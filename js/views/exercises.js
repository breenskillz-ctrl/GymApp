// Exercise library: search, filtering, details with history, records and chart, plus custom exercises.
import { GROUPS, EQUIPMENT, TYPES, SUBGROUPS } from '../data.js';
import {
  state, getExercise, saveExercise, deleteExercise, history, records, setVolume, allExercises, getProgression, setProgression,
} from '../store.js';
import { esc, openModal, confirmDialog, icon, fmtDate, fmtNum, fmtTime, e1rm, toast, parseKey, topBar, menuDialog } from '../utils.js';
import { lineChart } from '../charts.js';
import { hasPhoto, photoUrl } from '../icons.js';
import { muscleDetail, muscleLists } from '../musclemap.js';
import { openAddSheet, groupRowsHtml } from './addsheet.js';

// Exercises page: muscle groups like the + sheet. Opening a group shows the GymKeeper-style list in browse mode.
export function renderExercises(root) {
  const draw = () => {
    root.innerHTML = `
      ${topBar('Exercises', `<button class="icon-btn" data-act="new" aria-label="New exercise">${icon('plus')}</button>
        <button class="icon-btn" data-act="search" aria-label="Search">${icon('search')}</button>`)}
      <p class="sub center" style="margin:0 0 12px">${allExercises().length} exercises</p>
      ${groupRowsHtml(null)}`;
  };
  root.onclick = async (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'new') return openExerciseEditor(null, draw);
    if (act === 'search') return openAddSheet(null, null, { mode: 'browse', page: { kind: 'search' } });
    const gm = e.target.closest('[data-gmenu]');
    if (gm) {
      const grp = gm.dataset.gmenu;
      const v = await menuDialog(grp, [
        { value: 'open', label: 'Show exercises', icon: 'list' },
        { value: 'new', label: `New ${grp.toLowerCase()} exercise`, icon: 'plus' },
      ]);
      if (v === 'open') openAddSheet(null, draw, { mode: 'browse', page: { kind: 'group', group: grp } });
      if (v === 'new') openExerciseEditor({ name: '', group: grp, equip: 'Other', type: 'wr', desc: '', isNew: true }, draw);
      return;
    }
    const g = e.target.closest('[data-group]');
    if (g) openAddSheet(null, draw, { mode: 'browse', page: { kind: 'group', group: g.dataset.group } });
  };
  draw();
}

// Describe a set as text, e.g. "60 kg × 10"
export function setText(ex, s) {
  const u = state.settings.unit;
  switch (ex.type) {
    case 'wr': return `${s.w != null ? fmtNum(s.w, 2) + ' ' + u : '–'} × ${s.r ?? '–'}`;
    case 'r': return `${s.r ?? '–'} reps${s.w ? ` (+${fmtNum(s.w, 2)} ${u})` : ''}`;
    case 't': return s.t != null ? fmtTime(s.t) : '–';
    case 'dt': return `${s.d != null ? fmtNum(s.d, 2) + ' km' : '–'}${s.t != null ? ' · ' + fmtTime(s.t) : ''}`;
    default: return '';
  }
}

function chartSeries(ex, hist, metric) {
  const pts = [...hist].reverse().map((h) => {
    let v = 0;
    for (const s of h.sets) {
      if (metric === '1rm') v = Math.max(v, e1rm(s.w, s.r));
      else if (metric === 'w') v = Math.max(v, s.w || 0);
      else if (metric === 'vol') v += setVolume(s);
      else if (metric === 'r') v = Math.max(v, s.r || 0);
      else if (metric === 'rsum') v += s.r || 0;
      else if (metric === 't') v = Math.max(v, s.t || 0);
      else if (metric === 'd') v = Math.max(v, s.d || 0);
    }
    const d = parseKey(h.date);
    return { label: `${d.getDate()}.${d.getMonth() + 1}`, value: v };
  });
  return pts.filter((p) => p.value > 0);
}

const METRICS = {
  wr: [['1rm', 'Est. 1RM'], ['w', 'Heaviest'], ['vol', 'Volume']],
  r: [['r', 'Most reps'], ['rsum', 'Total reps']],
  t: [['t', 'Longest time']],
  dt: [['d', 'Longest distance'], ['t', 'Longest time']],
};

// Close-up of the trained muscles with their names and the equipment (DECISIONS #42)
function musclesCard(ex) {
  const { primary, secondary } = muscleLists(ex);
  const row = (label, v) => (v ? `<div class="mc-row"><span class="mc-label">${label}</span><span class="mc-val">${v}</span></div>` : '');
  return `<div class="card muscle-card">
    <div class="mc-art">${muscleDetail(ex)}</div>
    <div class="mc-info">
      ${row('Primary', primary.map((m) => `<span class="mc-chip p">${esc(m)}</span>`).join(''))}
      ${row('Secondary', secondary.map((m) => `<span class="mc-chip">${esc(m)}</span>`).join(''))}
      ${row('Equipment', `<span class="mc-equip">${esc(ex.equip || 'Other')}</span>`)}
    </div>
  </div>`;
}

export function openExerciseDetail(id, onChange) {
  const ex = getExercise(id);
  const hist = history(id);
  const rec = records(id);
  const u = state.settings.unit;
  const metrics = METRICS[ex.type] || METRICS.wr;
  let metric = metrics[0][0];

  const recTiles = [];
  if (ex.type === 'wr') {
    recTiles.push(['Est. 1RM', rec.best1rm ? `${fmtNum(rec.best1rm.v)} ${u}` : '–']);
    recTiles.push(['Heaviest', rec.maxW ? `${fmtNum(rec.maxW.v, 2)} ${u}` : '–']);
    recTiles.push(['Best volume', rec.maxVol ? `${fmtNum(rec.maxVol.v, 0)} ${u}` : '–']);
  } else if (ex.type === 'r') {
    recTiles.push(['Most reps', rec.maxR ? rec.maxR.v : '–']);
  } else if (ex.type === 't') {
    recTiles.push(['Longest time', rec.maxT ? fmtTime(rec.maxT.v) : '–']);
  } else {
    recTiles.push(['Longest', rec.maxD ? `${fmtNum(rec.maxD.v, 2)} km` : '–']);
    recTiles.push(['Longest time', rec.maxT ? fmtTime(rec.maxT.v) : '–']);
  }
  recTiles.push(['Sessions', rec.sessions]);

  openModal(`
    <div class="modal-head">
      <div>
        <h2>${esc(ex.name)}</h2>
        <p class="sub">${esc(ex.group)} · ${esc(ex.equip)} · ${esc(TYPES[ex.type])}</p>
      </div>
      <button class="icon-btn" data-close aria-label="Close">${icon('close')}</button>
    </div>
    <div class="scroll">
      ${musclesCard(ex)}
      ${hasPhoto(ex.id) ? `<h3 class="section-title">How to</h3><div class="ex-photo"><img src="${photoUrl(ex.id, 0)}" alt="${esc(ex.name)}, start position">
        <img src="${photoUrl(ex.id, 1)}" alt="${esc(ex.name)}, end position"></div>` : ''}
      ${ex.desc ? `<p class="desc">${esc(ex.desc)}</p>` : ''}
      <button class="card prog-row" data-prog>${icon('settings')}<span class="grow">
        <span class="title">${esc(progressionText(ex.id))}</span>
        <span class="sub">Exercise settings: ${hasRange(ex) ? 'rep range, weight step and ' : ''}rest time</span></span>${icon('edit')}</button>
      <h3 class="section-title">Personal records</h3>
      <div class="tiles">${recTiles.map(([l, v]) => `<div class="tile"><span class="tile-val">${v}</span><span class="tile-label">${l}</span></div>`).join('')}</div>
      <h3 class="section-title">Progress</h3>
      <div class="seg" data-metrics>${metrics.map(([k, l], i) => `<button class="${i ? '' : 'active'}" data-metric="${k}">${l}</button>`).join('')}</div>
      <div class="chart-box"><canvas></canvas></div>
      <h3 class="section-title">History</h3>
      ${hist.length ? hist.slice(0, 30).map((h) => `
        <div class="hist-item">
          <div class="hist-date">${fmtDate(h.date)}</div>
          <div class="hist-sets">${h.sets.map((s) => `<span class="pill">${setText(ex, s)}</span>`).join('')}</div>
        </div>`).join('') : '<p class="empty">No sessions logged yet.</p>'}
      ${ex.builtin ? '' : `
        <div class="row gap mt">
          <button class="btn ghost grow" data-edit>${icon('edit')} Edit</button>
          <button class="btn danger grow" data-del>${icon('trash')} Delete</button>
        </div>`}
    </div>
  `, {
    className: 'tall',
    onMount(m, close) {
      const canvas = m.querySelector('canvas');
      const draw = () => lineChart(canvas, chartSeries(ex, hist, metric), {
        format: metric === 't' ? fmtTime : (v) => fmtNum(v, metric === 'd' ? 1 : 0),
      });
      requestAnimationFrame(draw);
      m.querySelector('[data-metrics]').addEventListener('click', (e) => {
        const b = e.target.closest('[data-metric]');
        if (!b) return;
        metric = b.dataset.metric;
        m.querySelectorAll('[data-metric]').forEach((x) => x.classList.toggle('active', x === b));
        draw();
      });
      m.querySelector('[data-prog]')?.addEventListener('click', () => openProgressionDialog(ex.id, () => {
        m.querySelector('[data-prog] .title').textContent = progressionText(ex.id);
      }));
      m.querySelector('[data-edit]')?.addEventListener('click', () => {
        close();
        openExerciseEditor(ex, onChange);
      });
      m.querySelector('[data-del]')?.addEventListener('click', async () => {
        if (await confirmDialog(`Delete "${ex.name}"? Logged sets are kept but will show as an unknown exercise.`)) {
          deleteExercise(ex.id);
          close();
          toast('Exercise deleted');
          onChange?.();
        }
      });
    },
  });
}

export function openExerciseEditor(ex, onSave) {
  const e = ex ? { ...ex } : { name: '', group: GROUPS[0], equip: EQUIPMENT[0], type: 'wr', desc: '' };
  delete e.isNew;
  const opts = (arr, v) => arr.map((x) => `<option ${x === v ? 'selected' : ''}>${esc(x)}</option>`).join('');
  openModal(`
    <div class="modal-head">
      <h2>${e.id ? 'Edit exercise' : 'New exercise'}</h2>
      <button class="icon-btn" data-close aria-label="Close">${icon('close')}</button>
    </div>
    <form class="form">
      <label>Name<input class="input" name="name" required value="${esc(e.name)}" placeholder="E.g. Smith Machine Incline Press"></label>
      <label>Muscle group<select class="input" name="group">${opts(GROUPS, e.group)}</select></label>
      <label>Muscle region<select class="input" name="sub"><option value="">–</option>${Object.values(SUBGROUPS).flat().map((x) => `<option ${x === e.sub ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
      <label>Equipment<select class="input" name="equip">${opts(EQUIPMENT, e.equip)}</select></label>
      <label>Tracking type<select class="input" name="type">
        ${Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${k === e.type ? 'selected' : ''}>${v}</option>`).join('')}
      </select></label>
      <label>Description<textarea class="input" name="desc" rows="3" placeholder="Optional">${esc(e.desc)}</textarea></label>
      <button class="btn primary block" type="submit">Save</button>
    </form>
  `, {
    onMount(m, close) {
      m.querySelector('form').addEventListener('submit', (ev) => {
        ev.preventDefault();
        const f = new FormData(ev.target);
        const name = f.get('name').trim();
        if (!name) return;
        saveExercise({ ...e, name, group: f.get('group'), sub: f.get('sub'), equip: f.get('equip'), type: f.get('type'), desc: f.get('desc').trim(), builtin: false });
        close();
        toast('Exercise saved');
        onSave?.();
      });
    },
  });
}

// ---------- Rep range and progression per exercise (DECISIONS #21) ----------
export const hasRange = (ex) => ex.type === 'wr' || ex.type === 'r';

export function progressionText(id) {
  const p = getProgression(id);
  const ex = getExercise(id);
  const parts = [];
  if (hasRange(ex)) parts.push(p.auto ? `${p.min}–${p.max} reps${ex.type === 'wr' ? ` · +${fmtNum(p.inc, 2)} ${state.settings.unit}` : ''}` : 'Suggestions off');
  parts.push(`Rest ${fmtTime(p.rest || state.settings.rest)}`);
  return parts.join(' · ');
}

export function openProgressionDialog(id, onSave) {
  const ex = getExercise(id);
  const p = getProgression(id);
  const u = state.settings.unit;
  const range = hasRange(ex);
  openModal(`
    <h2 class="dialog-title">Exercise settings</h2>
    <p class="sub" style="margin:-8px 0 14px">${esc(ex.name)}${ex.equip && ex.equip !== 'Other' ? ` · ${esc(ex.equip)}` : ''}</p>
    <form class="form">
      ${range ? `<div class="row gap">
        <label class="grow">Min reps<input class="input" name="min" type="number" inputmode="numeric" min="1" value="${p.min}"></label>
        <label class="grow">Max reps<input class="input" name="max" type="number" inputmode="numeric" min="1" value="${p.max}"></label>
        ${ex.type === 'wr' ? `<label class="grow">+ ${u} step<input class="input" name="inc" type="number" inputmode="decimal" step="0.25" min="0.25" value="${p.inc}"></label>` : ''}
      </div>
      <label class="switch"><input type="checkbox" name="auto" ${p.auto ? 'checked' : ''}> Suggest progression next time</label>
      <p class="sub">Below max: same weight, +1 rep. At max: ${ex.type === 'wr' ? 'more weight, with reps worked out from your strength.' : 'stay at max.'}
        Warm-up sets never change.</p>` : ''}
      <label>Rest between sets (seconds)<input class="input" name="rest" type="number" inputmode="numeric" min="0" step="15"
        value="${p.rest || ''}" placeholder="Default: ${state.settings.rest}"></label>
      <div class="dialog-actions">
        <button type="button" class="text-btn" data-close>Cancel</button>
        <button type="submit" class="text-btn accent">Save</button>
      </div>
    </form>`, {
    className: 'dialog',
    onMount(m, close) {
      m.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        const next = { ...state.progression[id] };
        if (range) {
          next.min = Math.max(1, Math.round(Number(f.get('min')) || 1));
          next.max = Math.max(next.min, Math.round(Number(f.get('max')) || next.min));
          next.inc = Math.max(0.25, Number(String(f.get('inc') ?? p.inc).replace(',', '.')) || p.inc);
          next.auto = !!f.get('auto');
        }
        const rest = Math.round(Number(f.get('rest')) || 0);
        if (rest > 0) next.rest = rest; else delete next.rest;
        setProgression(id, next);
        close();
        toast('Exercise settings saved');
        onSave?.();
      });
    },
  });
}
