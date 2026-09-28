// Exercise library: search, filtering, details with history, records and chart, plus custom exercises.
import { GROUPS, EQUIPMENT, TYPES, SUBGROUPS } from '../data.js';
import { state, getExercise, saveExercise, deleteExercise, history, records, setVolume, allExercises } from '../store.js';
import { esc, openModal, confirmDialog, icon, fmtDate, fmtNum, fmtTime, e1rm, toast, parseKey, topBar, menuDialog } from '../utils.js';
import { lineChart } from '../charts.js';
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
      ${ex.desc ? `<p class="desc">${esc(ex.desc)}</p>` : ''}
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
