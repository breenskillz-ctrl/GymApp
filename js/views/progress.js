// Progress: statistics, charts, records, body weight and settings.
import { GROUPS, GROUP_COLORS } from '../data.js';
import { groupIcon } from '../icons.js';
import {
  state, save, dayHasWork, getExercise, records, setVolume, replaceState, resetState,
} from '../store.js';
import {
  esc, icon, topBar, applyTextScale, dateKey, addDays, weekStart, parseKey, fmtDate, fmtNum, num, toast, confirmDialog, openModal,
  e1rm, MONTHS, pad, menuDialog,
} from '../utils.js';
import { readGymKeeperCsv, applyImport } from '../import.js';
import { openProgressPhotos, exportPhotos, importPhotosFile } from './photos.js';
import { clearPhotos } from '../photodb.js';
import { lineChart, barChart, multiLineChart, stackedBarChart } from '../charts.js';
import { openExerciseDetail } from './exercises.js';
import { updateWakeLock } from '../wakelock.js';

function stats() {
  const days = Object.keys(state.log).filter(dayHasWork).sort();
  const today = dateKey();
  const thisWeek = weekStart(today);
  const month = addDays(today, -29);

  let vol30 = 0;
  let sets30 = 0;
  const groupSets = {};
  for (const k of days) {
    if (k < month || k > today) continue;
    for (const e of state.log[k].entries) {
      const g = getExercise(e.ex).group || 'Other';
      for (const s of e.sets) {
        if (!s.done) continue;
        sets30++;
        vol30 += setVolume(s);
        groupSets[g] = (groupSets[g] || 0) + 1;
      }
    }
  }

  // Consecutive weeks with at least one workout
  const weeks = new Set(days.map(weekStart));
  let streak = 0;
  let w = thisWeek;
  if (!weeks.has(w)) w = addDays(w, -7);
  while (weeks.has(w)) { streak++; w = addDays(w, -7); }

  // Workouts per week, last 12 weeks
  const perWeek = [];
  for (let i = 11; i >= 0; i--) {
    const ws = addDays(thisWeek, -7 * i);
    const we = addDays(ws, 6);
    const d = parseKey(ws);
    perWeek.push({ label: `${d.getDate()}.${d.getMonth() + 1}`, value: days.filter((k) => k >= ws && k <= we).length });
  }

  return {
    total: days.length,
    week: days.filter((k) => k >= thisWeek && k <= today).length,
    streak,
    vol30,
    sets30,
    groupSets,
    perWeek,
  };
}


// ---------- Strength trend and weekly sets (DECISIONS #29) ----------
const LINE_COLORS = ['#ff7a1a', '#3d8bff', '#f2b705', '#43c463'];

// Best estimated 1RM per month for the four weighted lifts trained most often in the last 12 months.
// Sets above 12 reps are left out, because the 1RM estimate gets unreliable there.
function strengthTrend() {
  const now = parseKey(dateKey());
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  });
  const from = months[0];
  const count = {};
  const best = {};
  for (const [date, day] of Object.entries(state.log)) {
    const m = date.slice(0, 7);
    if (m < from) continue;
    for (const e of day.entries) {
      if (getExercise(e.ex).type !== 'wr') continue;
      let top = 0;
      for (const st of e.sets) {
        if (st.done && st.lvl !== 'warmup' && st.r && st.r <= 12) top = Math.max(top, e1rm(st.w, st.r) || 0);
      }
      if (!top) continue;
      count[e.ex] = (count[e.ex] || 0) + 1;
      best[e.ex] = best[e.ex] || {};
      best[e.ex][m] = Math.max(best[e.ex][m] || 0, top);
    }
  }
  const ids = Object.keys(count).sort((a, b) => count[b] - count[a]).slice(0, 4);
  return {
    labels: months.map((m) => MONTHS[Number(m.slice(5)) - 1].slice(0, 3)),
    series: ids.map((id, i) => ({
      id, name: getExercise(id).name, color: LINE_COLORS[i], values: months.map((m) => best[id][m] || null),
    })),
  };
}

// Working sets per muscle group per week, last 12 weeks
function weeklyGroupSets() {
  const thisWeek = weekStart(dateKey());
  const weeks = Array.from({ length: 12 }, (_, i) => addDays(thisWeek, -7 * (11 - i)));
  const data = {};
  for (const [date, day] of Object.entries(state.log)) {
    const i = weeks.indexOf(weekStart(date));
    if (i < 0) continue;
    for (const e of day.entries) {
      const g = getExercise(e.ex).group || 'Other';
      const n = e.sets.filter((st) => st.done && st.lvl !== 'warmup').length;
      if (!n) continue;
      data[g] = data[g] || Array(12).fill(0);
      data[g][i] += n;
    }
  }
  return {
    labels: weeks.map((k) => { const d = parseKey(k); return `${d.getDate()}.${d.getMonth() + 1}`; }),
    series: GROUPS.concat('Other').filter((g) => data[g]).map((g) => ({ name: g, color: GROUP_COLORS[g] || GROUP_COLORS.Other, values: data[g] })),
  };
}

const legendHtml = (series) => `<div class="legend">${series.map((x) => `<span><i style="background:${x.color}"></i>${esc(x.name)}</span>`).join('')}</div>`;

// ---------- Body measurements (DECISIONS #28) ----------
// state.body entries: { date, weight?, chest?, waist?, arm?, thigh? }
export const MEASURES = [
  ['weight', 'Weight'], ['chest', 'Chest'], ['waist', 'Waist'],
  ['armL', 'Left arm'], ['armR', 'Right arm'], ['thighL', 'Left thigh'], ['thighR', 'Right thigh'],
];
const measureUnit = (k) => (k === 'weight' ? state.settings.unit : state.settings.unit === 'lb' ? 'in' : 'cm');
let bodyMeasure = 'weight';

function saveMeasure(key, value, date = dateKey()) {
  let entry = state.body.find((b) => b.date === date);
  if (!entry) { entry = { date }; state.body.push(entry); }
  if (value) entry[key] = value; else delete entry[key];
  state.body = state.body.filter((b) => MEASURES.some(([k]) => b[k]));
  save();
}

function topRecords() {
  const ids = new Set();
  for (const d of Object.values(state.log)) d.entries.forEach((e) => ids.add(e.ex));
  const out = [];
  for (const id of ids) {
    const ex = getExercise(id);
    const r = records(id);
    if (ex.type === 'wr' && r.maxW) out.push({ id, name: ex.name, val: `${fmtNum(r.maxW.v, 2)} ${state.settings.unit} × ${r.maxW.r ?? '–'}`, date: r.maxW.date, sort: r.best1rm?.v || 0 });
    else if (ex.type === 'r' && r.maxR) out.push({ id, name: ex.name, val: `${r.maxR.v} reps`, date: r.maxR.date, sort: 0 });
  }
  return out.sort((a, b) => b.sort - a.sort || a.name.localeCompare(b.name, 'en'));
}

export function renderProgress(root) {
  const s = stats();
  const recs = topRecords();
  const u = state.settings.unit;
  const body = [...state.body].sort((a, b) => a.date.localeCompare(b.date)).filter((b) => b[bodyMeasure]);
  const lastBody = body[body.length - 1];
  const mu = measureUnit(bodyMeasure);
  const mLabel = MEASURES.find(([k]) => k === bodyMeasure)[1];
  const trend = strengthTrend();
  const weekly = weeklyGroupSets();
  const maxGroup = Math.max(1, ...Object.values(s.groupSets));
  const groupsSorted = GROUPS.concat('Other').filter((g) => s.groupSets[g]).sort((a, b) => s.groupSets[b] - s.groupSets[a]);

  root.innerHTML = `
    ${topBar('Progress', `<button class="icon-btn" data-act="settings" aria-label="Settings">${icon('settings')}</button>`)}

    <div class="tiles four">
      <div class="tile"><span class="tile-val">${s.total}</span><span class="tile-label">Total workouts</span></div>
      <div class="tile"><span class="tile-val">${s.week}</span><span class="tile-label">This week</span></div>
      <div class="tile"><span class="tile-val">${s.streak}</span><span class="tile-label">Week streak</span></div>
      <div class="tile"><span class="tile-val">${s.vol30 >= 10000 ? fmtNum(s.vol30 / 1000, 1) + 't' : fmtNum(s.vol30, 0)}</span><span class="tile-label">${u} last 30 days</span></div>
    </div>

    <section class="card">
      <h3>Workouts per week</h3>
      <div class="chart-box"><canvas id="c-weeks"></canvas></div>
    </section>

    <section class="card">
      <h3>Strength trend <span class="muted">(best est. 1RM per month)</span></h3>
      <div class="chart-box"><canvas id="c-trend"></canvas></div>
      ${trend.series.length ? legendHtml(trend.series) : ''}
    </section>

    <section class="card">
      <h3>Weekly sets per muscle group</h3>
      <div class="chart-box"><canvas id="c-weekly"></canvas></div>
      ${weekly.series.length ? legendHtml(weekly.series) : ''}
    </section>

    <section class="card">
      <h3>Sets per muscle group <span class="muted">(30 days)</span></h3>
      ${groupsSorted.length ? groupsSorted.map((g) => `
        <div class="hbar"><span class="hbar-label">${groupIcon(g, 18)}${esc(g)}</span>
          <span class="hbar-track"><span class="hbar-fill" style="width:${(s.groupSets[g] / maxGroup) * 100}%;background:${GROUP_COLORS[g] || GROUP_COLORS.Other}"></span></span>
          <span class="hbar-val">${s.groupSets[g]}</span></div>`).join('') : '<p class="empty">Complete some sets to see the breakdown.</p>'}
    </section>

    <section class="card">
      <div class="row between"><h3>Body</h3>
        ${lastBody ? `<span class="muted">${fmtNum(lastBody[bodyMeasure])} ${mu} · ${fmtDate(lastBody.date, false)}</span>` : ''}</div>
      <div class="chips" data-measures>${MEASURES.map(([k, l]) => `<button class="chip ${k === bodyMeasure ? 'active' : ''}" data-measure="${k}">${l}</button>`).join('')}</div>
      <form class="row gap body-form">
        <input class="input grow" name="w" inputmode="decimal" placeholder="Today's ${mLabel.toLowerCase()} (${mu})">
        <button class="btn primary" type="submit">Save</button>
      </form>
      <div class="chart-box"><canvas id="c-body"></canvas></div>
      <div class="row gap"><button class="btn ghost sm" data-act="body-list">All measurements</button>
        <button class="btn ghost sm" data-act="photos">${icon('camera')} Photos</button></div>
    </section>

    <section class="card">
      <h3>Personal records</h3>
      ${recs.length ? `<div class="list">${recs.map((r) => `
        <button class="list-item" data-ex="${esc(r.id)}">
          <span class="avatar gold">${icon('trophy')}</span>
          <span class="grow"><span class="title">${esc(r.name)}</span><span class="sub">${fmtDate(r.date, false)}</span></span>
          <strong>${r.val}</strong>
        </button>`).join('')}</div>` : '<p class="empty">Your records will appear here once you start logging.</p>'}
    </section>`;

  requestAnimationFrame(() => {
    barChart(root.querySelector('#c-weeks'), s.perWeek);
    multiLineChart(root.querySelector('#c-trend'), trend.labels, trend.series, { format: (v) => fmtNum(v, 0) });
    stackedBarChart(root.querySelector('#c-weekly'), weekly.labels, weekly.series);
    lineChart(root.querySelector('#c-body'), body.slice(-60).map((b) => {
      const d = parseKey(b.date);
      return { label: `${d.getDate()}.${d.getMonth() + 1}`, value: b[bodyMeasure] };
    }), { height: 170, format: (v) => fmtNum(v, 0) });
  });

  root.querySelector('.body-form').onsubmit = (e) => {
    e.preventDefault();
    const w = num(e.target.w.value);
    if (!w) return;
    saveMeasure(bodyMeasure, w);
    toast(`${mLabel} saved`);
    renderProgress(root);
  };

  root.onclick = (e) => {
    const ex = e.target.closest('[data-ex]');
    if (ex) return openExerciseDetail(ex.dataset.ex);
    const ms = e.target.closest('[data-measure]');
    if (ms) { bodyMeasure = ms.dataset.measure; return renderProgress(root); }
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'settings') openSettings(() => renderProgress(root));
    if (a === 'body-list') openBodyWeight(() => renderProgress(root));
    if (a === 'photos') openProgressPhotos();
  };
}

// Body measurements: today's values for all measures, and every earlier entry
export function openBodyWeight(onChange) {
  const list = () => [...state.body].sort((x, y) => y.date.localeCompare(x.date));
  const today = () => state.body.find((b) => b.date === dateKey()) || {};
  openModal(`
    <div class="modal-head"><h2>Body measurements</h2>
      <button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>
    <form class="body-add">
      <div class="measure-grid">${MEASURES.map(([k, l]) => `<label${k === 'armL' ? ' class="row-start"' : ''}>${l} <span class="muted">(${measureUnit(k)})</span>
        <input class="input" name="${k}" inputmode="decimal" value="${today()[k] ?? ''}"></label>`).join('')}</div>
      <button class="btn primary block" type="submit">Save today</button>
    </form>
    <button class="btn ghost block" data-photos>${icon('camera')} Progress photos</button>
    <div class="list scroll body-list"></div>`, {
    className: 'tall',
    onMount(m) {
      const box = m.querySelector('.list');
      m.querySelector('[data-photos]').addEventListener('click', openProgressPhotos);
      m.querySelector('.body-add').addEventListener('submit', (e) => {
        e.preventDefault();
        for (const [k] of MEASURES) saveMeasure(k, num(e.target[k].value));
        toast('Measurements saved');
        draw();
        onChange();
      });
      const draw = () => {
        box.innerHTML = list().map((b) => `
          <div class="list-item static"><span class="grow">${fmtDate(b.date)}
            <span class="sub">${MEASURES.filter(([k]) => b[k]).map(([k, l]) => `${l} ${fmtNum(b[k])} ${measureUnit(k)}`).join(' · ')}</span></span>
          <button class="icon-btn sm" data-del="${b.date}" aria-label="Delete">${icon('trash')}</button></div>`).join('')
          || '<p class="empty">No entries.</p>';
      };
      box.addEventListener('click', (e) => {
        const d = e.target.closest('[data-del]');
        if (!d) return;
        state.body = state.body.filter((b) => b.date !== d.dataset.del);
        save();
        draw();
        onChange();
      });
      draw();
    },
  });
}

// Download all data as a JSON file and remember when (for the weekly reminder, DECISIONS #32)
export function exportBackup() {
  state.lastBackup = Date.now();
  save();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `gymapp-backup-${dateKey()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Show the backup reminder when there is data and no backup (or snooze) in the last 7 days
export function backupDue() {
  const week = 7 * 86400000;
  const last = Math.max(state.lastBackup || 0, state.backupSnooze || 0);
  if (Date.now() - last < week) return false;
  return Object.keys(state.log).filter(dayHasWork).length >= 3;
}

export function openSettings(onChange) {
  const st = state.settings;
  openModal(`
    <div class="modal-head"><h2>Settings</h2>
      <button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>
    <div class="scroll form">
      <label>Weight unit
        <div class="seg" data-unit>
          <button class="${st.unit === 'kg' ? 'active' : ''}" data-v="kg">kg</button>
          <button class="${st.unit === 'lb' ? 'active' : ''}" data-v="lb">lb</button>
        </div>
      </label>
      <label>Text and number size
        <div class="scale-row">
          <span class="small">A</span>
          <input type="range" min="80" max="150" step="5" value="${st.textScale || 100}" data-scale aria-label="Text and number size">
          <span style="font-size:20px">A</span>
          <span class="scale-val">${st.textScale || 100} %</span>
        </div>
        <span class="scale-preview">Bench Press · Barbell &nbsp; <span class="v">110</span><span class="u">kg</span> <span class="v">4</span><span class="u">rep</span></span>
      </label>
      <label>Default rest time (seconds)<input class="input" type="number" min="5" step="5" data-rest value="${st.rest}"></label>
      <label class="switch"><input type="checkbox" data-auto ${st.autoRest ? 'checked' : ''}> Start rest timer automatically when a set is completed</label>
      <label class="switch"><input type="checkbox" data-sound ${st.sound ? 'checked' : ''}> Play a sound when the timer finishes</label>
      <label class="switch"><input type="checkbox" data-awake ${st.keepAwake ? 'checked' : ''}> Keep the screen on during a workout</label>
      <h3 class="section-title">Data</h3>
      <p class="muted small">All data is stored only on this device. Back it up regularly. Progress photos have their own export file.</p>
      <button class="btn ghost block" data-export>${icon('download')} Export backup</button>
      <label class="btn ghost block file-btn">${icon('upload')} Import backup<input type="file" accept="application/json,.json" data-import hidden></label>
      <button class="btn ghost block" data-exportp>${icon('camera')} Export progress photos</button>
      <label class="btn ghost block file-btn">${icon('camera')} Import progress photos<input type="file" accept="application/json,.json" data-importp hidden></label>
      <label class="btn ghost block file-btn">${icon('import')} Import from GymKeeper (CSV)<input type="file" accept=".csv,text/csv" data-gk hidden></label>
      <button class="btn danger block" data-reset>${icon('trash')} Delete all data</button>
      <h3 class="section-title">About</h3>
      <p class="credit">Exercise photos: <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener" style="color:inherit">free-exercise-db</a> (public domain).</p>
    </div>`, {
    className: 'tall',
    onMount(m, close) {
      m.querySelector('[data-unit]').addEventListener('click', (e) => {
        const b = e.target.closest('[data-v]');
        if (!b) return;
        e.preventDefault();
        st.unit = b.dataset.v;
        m.querySelectorAll('[data-unit] button').forEach((x) => x.classList.toggle('active', x === b));
        save();
        onChange();
      });
      const scale = m.querySelector('[data-scale]');
      scale.addEventListener('input', () => {
        applyTextScale(scale.value);
        m.querySelector('.scale-val').textContent = `${scale.value} %`;
      });
      scale.addEventListener('change', () => { st.textScale = Number(scale.value); save(); onChange(); });
      m.querySelector('[data-rest]').addEventListener('change', (e) => { st.rest = Math.max(5, Number(e.target.value) || 90); save(); });
      m.querySelector('[data-auto]').addEventListener('change', (e) => { st.autoRest = e.target.checked; save(); });
      m.querySelector('[data-sound]').addEventListener('change', (e) => { st.sound = e.target.checked; save(); });
      m.querySelector('[data-awake]').addEventListener('change', (e) => { st.keepAwake = e.target.checked; save(); updateWakeLock(); });
      m.querySelector('[data-export]').addEventListener('click', exportBackup);
      m.querySelector('[data-import]').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const data = JSON.parse(await file.text());
          if (data?.type === 'gymapp-photos') { e.target.value = ''; await importPhotosFile(file); return; } // a photo export
          if (typeof data !== 'object' || !data.log) throw new Error('Invalid file');
          if (!await confirmDialog('This replaces all current data with the backup. Continue?', 'Import')) return;
          replaceState(data);
          close();
          toast('Data imported');
          location.reload();
        } catch {
          toast('Could not read the file');
        }
      });
      m.querySelector('[data-exportp]').addEventListener('click', exportPhotos);
      m.querySelector('[data-importp]').addEventListener('change', async (e) => {
        const f = e.target.files[0];
        e.target.value = '';
        await importPhotosFile(f);
      });
      m.querySelector('[data-gk]').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;
        let res;
        try {
          res = readGymKeeperCsv(await file.text());
        } catch {
          toast('This is not a GymKeeper diary export');
          return;
        }
        const { stats } = res;
        if (!stats.days) { toast('No workouts found in the file'); return; }
        const clash = Object.keys(res.days).filter((k) => state.log[k]?.entries.length).length;
        const mode = await menuDialog('Import from GymKeeper', [
          { value: 'skip', label: clash ? 'Import, keep my existing days' : 'Import', icon: 'import' },
          ...(clash ? [{ value: 'replace', label: 'Import, replace those days', icon: 'repeat' }] : []),
        ], `${stats.days} days and ${stats.sets} sets, ${fmtDate(stats.from, false)} – ${fmtDate(stats.to, false)}. `
          + `${res.newExercises.length} exercises are new and will be added as your own.${clash ? ` ${clash} of the days already have workouts here.` : ''}`);
        if (!mode) return;
        const n = applyImport(res, mode);
        toast(`Imported ${n} workout day${n === 1 ? '' : 's'}`);
        onChange();
      });
      m.querySelector('[data-reset]').addEventListener('click', async () => {
        if (await confirmDialog('Delete all workout data, custom exercises, programs and progress photos? This cannot be undone.', 'Delete all')) {
          resetState();
          await clearPhotos().catch(() => {});
          close();
          location.reload();
        }
      });
    },
  });
}
