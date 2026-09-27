// Øvelsesbibliotek: søk, filtrering, detaljer med historikk, rekorder og graf, samt egne øvelser.
import { GROUPS, EQUIPMENT, TYPES } from '../data.js';
import { state, getExercise, saveExercise, deleteExercise, history, records, setVolume } from '../store.js';
import { esc, openModal, confirmDialog, icon, fmtDate, fmtNum, fmtTime, e1rm, toast, parseKey } from '../utils.js';
import { lineChart } from '../charts.js';
import { exerciseListHtml, filterExercises, groupChips } from './picker.js';

let query = '';
let group = '';

export function renderExercises(root) {
  root.innerHTML = `
    <header class="page-head">
      <h1>Øvelser</h1>
      <button class="btn primary sm" data-act="new">${icon('plus')} Egen øvelse</button>
    </header>
    <input class="input search" type="search" placeholder="Søk blant ${filterExercises('', '').length} øvelser…" value="${esc(query)}">
    <div class="chip-wrap">${groupChips(group)}</div>
    <div class="list"></div>`;

  const list = root.querySelector('.list');
  const draw = () => {
    list.innerHTML = exerciseListHtml(filterExercises(query, group));
    root.querySelector('.chip-wrap').innerHTML = groupChips(group);
  };
  root.querySelector('.search').addEventListener('input', (e) => { query = e.target.value; draw(); });
  root.querySelector('.chip-wrap').addEventListener('click', (e) => {
    const c = e.target.closest('[data-group]');
    if (c) { group = c.dataset.group; draw(); }
  });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ex]');
    if (b) openExerciseDetail(b.dataset.ex, () => draw());
  });
  root.querySelector('[data-act="new"]').onclick = () => openExerciseEditor(null, () => draw());
  draw();
}

// Beskriv et sett som tekst, f.eks. "60 kg × 10"
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
  wr: [['1rm', 'Est. 1RM'], ['w', 'Tyngste vekt'], ['vol', 'Volum']],
  r: [['r', 'Flest reps'], ['rsum', 'Totalt reps']],
  t: [['t', 'Lengste tid']],
  dt: [['d', 'Lengste distanse'], ['t', 'Lengste tid']],
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
    recTiles.push(['Tyngste', rec.maxW ? `${fmtNum(rec.maxW.v, 2)} ${u}` : '–']);
    recTiles.push(['Mest volum', rec.maxVol ? `${fmtNum(rec.maxVol.v, 0)} ${u}` : '–']);
  } else if (ex.type === 'r') {
    recTiles.push(['Flest reps', rec.maxR ? rec.maxR.v : '–']);
  } else if (ex.type === 't') {
    recTiles.push(['Lengste tid', rec.maxT ? fmtTime(rec.maxT.v) : '–']);
  } else {
    recTiles.push(['Lengst', rec.maxD ? `${fmtNum(rec.maxD.v, 2)} km` : '–']);
    recTiles.push(['Lengste tid', rec.maxT ? fmtTime(rec.maxT.v) : '–']);
  }
  recTiles.push(['Økter', rec.sessions]);

  openModal(`
    <div class="modal-head">
      <div>
        <h2>${esc(ex.name)}</h2>
        <p class="sub">${esc(ex.group)} · ${esc(ex.equip)} · ${esc(TYPES[ex.type])}</p>
      </div>
      <button class="icon-btn" data-close aria-label="Lukk">${icon('close')}</button>
    </div>
    <div class="scroll">
      ${ex.desc ? `<p class="desc">${esc(ex.desc)}</p>` : ''}
      <h3 class="section-title">Personlige rekorder</h3>
      <div class="tiles">${recTiles.map(([l, v]) => `<div class="tile"><span class="tile-val">${v}</span><span class="tile-label">${l}</span></div>`).join('')}</div>
      <h3 class="section-title">Fremgang</h3>
      <div class="seg" data-metrics>${metrics.map(([k, l], i) => `<button class="${i ? '' : 'active'}" data-metric="${k}">${l}</button>`).join('')}</div>
      <div class="chart-box"><canvas></canvas></div>
      <h3 class="section-title">Historikk</h3>
      ${hist.length ? hist.slice(0, 30).map((h) => `
        <div class="hist-item">
          <div class="hist-date">${fmtDate(h.date)}</div>
          <div class="hist-sets">${h.sets.map((s) => `<span class="pill">${setText(ex, s)}</span>`).join('')}</div>
        </div>`).join('') : '<p class="empty">Ingen økter registrert ennå.</p>'}
      ${ex.builtin ? '' : `
        <div class="row gap mt">
          <button class="btn ghost grow" data-edit>${icon('edit')} Rediger</button>
          <button class="btn danger grow" data-del>${icon('trash')} Slett</button>
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
        if (await confirmDialog(`Slette «${ex.name}»? Loggførte sett beholdes, men vises som ukjent øvelse.`)) {
          deleteExercise(ex.id);
          close();
          toast('Øvelse slettet');
          onChange?.();
        }
      });
    },
  });
}

export function openExerciseEditor(ex, onSave) {
  const e = ex ? { ...ex } : { name: '', group: GROUPS[0], equip: EQUIPMENT[0], type: 'wr', desc: '' };
  const opts = (arr, v) => arr.map((x) => `<option ${x === v ? 'selected' : ''}>${esc(x)}</option>`).join('');
  openModal(`
    <div class="modal-head">
      <h2>${ex ? 'Rediger øvelse' : 'Ny øvelse'}</h2>
      <button class="icon-btn" data-close aria-label="Lukk">${icon('close')}</button>
    </div>
    <form class="form">
      <label>Navn<input class="input" name="name" required value="${esc(e.name)}" placeholder="F.eks. Skråbenk i smithmaskin"></label>
      <label>Muskelgruppe<select class="input" name="group">${opts(GROUPS, e.group)}</select></label>
      <label>Utstyr<select class="input" name="equip">${opts(EQUIPMENT, e.equip)}</select></label>
      <label>Type registrering<select class="input" name="type">
        ${Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${k === e.type ? 'selected' : ''}>${v}</option>`).join('')}
      </select></label>
      <label>Beskrivelse<textarea class="input" name="desc" rows="3" placeholder="Valgfritt">${esc(e.desc)}</textarea></label>
      <button class="btn primary block" type="submit">Lagre</button>
    </form>
  `, {
    onMount(m, close) {
      m.querySelector('form').addEventListener('submit', (ev) => {
        ev.preventDefault();
        const f = new FormData(ev.target);
        const name = f.get('name').trim();
        if (!name) return;
        saveExercise({ ...e, name, group: f.get('group'), equip: f.get('equip'), type: f.get('type'), desc: f.get('desc').trim(), builtin: false });
        close();
        toast('Øvelse lagret');
        onSave?.();
      });
    },
  });
}
