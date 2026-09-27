// Fremgang: statistikk, grafer, rekorder, kroppsvekt og innstillinger.
import { GROUPS } from '../data.js';
import {
  state, save, dayHasWork, getExercise, records, setVolume, replaceState, resetState,
} from '../store.js';
import {
  esc, icon, dateKey, addDays, weekStart, parseKey, fmtDate, fmtNum, num, toast, confirmDialog, openModal,
} from '../utils.js';
import { lineChart, barChart } from '../charts.js';
import { openExerciseDetail } from './exercises.js';

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
      const g = getExercise(e.ex).group || 'Annet';
      for (const s of e.sets) {
        if (!s.done) continue;
        sets30++;
        vol30 += setVolume(s);
        groupSets[g] = (groupSets[g] || 0) + 1;
      }
    }
  }

  // Uker på rad med minst én økt
  const weeks = new Set(days.map(weekStart));
  let streak = 0;
  let w = thisWeek;
  if (!weeks.has(w)) w = addDays(w, -7);
  while (weeks.has(w)) { streak++; w = addDays(w, -7); }

  // Økter per uke, siste 12 uker
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
  return out.sort((a, b) => b.sort - a.sort || a.name.localeCompare(b.name, 'nb'));
}

export function renderProgress(root) {
  const s = stats();
  const recs = topRecords();
  const u = state.settings.unit;
  const body = [...state.body].sort((a, b) => a.date.localeCompare(b.date));
  const lastBody = body[body.length - 1];
  const maxGroup = Math.max(1, ...Object.values(s.groupSets));
  const groupsSorted = GROUPS.concat('Annet').filter((g) => s.groupSets[g]).sort((a, b) => s.groupSets[b] - s.groupSets[a]);

  root.innerHTML = `
    <header class="page-head"><h1>Fremgang</h1>
      <button class="icon-btn" data-act="settings" aria-label="Innstillinger">${icon('settings')}</button></header>

    <div class="tiles four">
      <div class="tile"><span class="tile-val">${s.total}</span><span class="tile-label">Økter totalt</span></div>
      <div class="tile"><span class="tile-val">${s.week}</span><span class="tile-label">Denne uka</span></div>
      <div class="tile"><span class="tile-val">${s.streak}</span><span class="tile-label">Uker på rad</span></div>
      <div class="tile"><span class="tile-val">${s.vol30 >= 10000 ? fmtNum(s.vol30 / 1000, 1) + 't' : fmtNum(s.vol30, 0)}</span><span class="tile-label">${u} siste 30 d</span></div>
    </div>

    <section class="card">
      <h3>Økter per uke</h3>
      <div class="chart-box"><canvas id="c-weeks"></canvas></div>
    </section>

    <section class="card">
      <h3>Sett per muskelgruppe <span class="muted">(30 dager)</span></h3>
      ${groupsSorted.length ? groupsSorted.map((g) => `
        <div class="hbar"><span class="hbar-label">${esc(g)}</span>
          <span class="hbar-track"><span class="hbar-fill" style="width:${(s.groupSets[g] / maxGroup) * 100}%"></span></span>
          <span class="hbar-val">${s.groupSets[g]}</span></div>`).join('') : '<p class="empty">Fullfør noen sett for å se fordelingen.</p>'}
    </section>

    <section class="card">
      <div class="row between"><h3>Kroppsvekt</h3>
        ${lastBody ? `<span class="muted">${fmtNum(lastBody.weight)} ${u} · ${fmtDate(lastBody.date, false)}</span>` : ''}</div>
      <form class="row gap body-form">
        <input class="input grow" name="w" inputmode="decimal" placeholder="Vekt i dag (${u})">
        <button class="btn primary" type="submit">Lagre</button>
      </form>
      <div class="chart-box"><canvas id="c-body"></canvas></div>
      ${body.length ? `<button class="btn ghost sm" data-act="body-list">Vis alle målinger</button>` : ''}
    </section>

    <section class="card">
      <h3>Personlige rekorder</h3>
      ${recs.length ? `<div class="list">${recs.map((r) => `
        <button class="list-item" data-ex="${esc(r.id)}">
          <span class="avatar gold">${icon('trophy')}</span>
          <span class="grow"><span class="title">${esc(r.name)}</span><span class="sub">${fmtDate(r.date, false)}</span></span>
          <strong>${r.val}</strong>
        </button>`).join('')}</div>` : '<p class="empty">Rekordene dine dukker opp her når du begynner å logge.</p>'}
    </section>`;

  requestAnimationFrame(() => {
    barChart(root.querySelector('#c-weeks'), s.perWeek);
    lineChart(root.querySelector('#c-body'), body.slice(-60).map((b) => {
      const d = parseKey(b.date);
      return { label: `${d.getDate()}.${d.getMonth() + 1}`, value: b.weight };
    }), { height: 170, format: (v) => fmtNum(v, 0) });
  });

  root.querySelector('.body-form').onsubmit = (e) => {
    e.preventDefault();
    const w = num(e.target.w.value);
    if (!w) return;
    const today = dateKey();
    state.body = state.body.filter((b) => b.date !== today);
    state.body.push({ date: today, weight: w });
    save();
    toast('Kroppsvekt lagret');
    renderProgress(root);
  };

  root.onclick = (e) => {
    const ex = e.target.closest('[data-ex]');
    if (ex) return openExerciseDetail(ex.dataset.ex);
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'settings') openSettings(() => renderProgress(root));
    if (a === 'body-list') openBodyList(() => renderProgress(root));
  };
}

function openBodyList(onChange) {
  const u = state.settings.unit;
  const list = () => [...state.body].sort((a, b) => b.date.localeCompare(a.date));
  openModal(`
    <div class="modal-head"><h2>Kroppsvekt</h2>
      <button class="icon-btn" data-close aria-label="Lukk">${icon('close')}</button></div>
    <div class="list scroll"></div>`, {
    className: 'tall',
    onMount(m) {
      const box = m.querySelector('.list');
      const draw = () => {
        box.innerHTML = list().map((b) => `
          <div class="list-item static"><span class="grow">${fmtDate(b.date)}</span>
          <strong>${fmtNum(b.weight)} ${u}</strong>
          <button class="icon-btn sm" data-del="${b.date}" aria-label="Slett">${icon('trash')}</button></div>`).join('')
          || '<p class="empty">Ingen målinger.</p>';
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

export function openSettings(onChange) {
  const st = state.settings;
  openModal(`
    <div class="modal-head"><h2>Innstillinger</h2>
      <button class="icon-btn" data-close aria-label="Lukk">${icon('close')}</button></div>
    <div class="scroll form">
      <label>Vektenhet
        <div class="seg" data-unit>
          <button class="${st.unit === 'kg' ? 'active' : ''}" data-v="kg">kg</button>
          <button class="${st.unit === 'lb' ? 'active' : ''}" data-v="lb">lb</button>
        </div>
      </label>
      <label>Standard hviletid (sekunder)<input class="input" type="number" min="5" step="5" data-rest value="${st.rest}"></label>
      <label class="switch"><input type="checkbox" data-auto ${st.autoRest ? 'checked' : ''}> Start hviletimer automatisk når et sett fullføres</label>
      <label class="switch"><input type="checkbox" data-sound ${st.sound ? 'checked' : ''}> Lyd når timeren er ferdig</label>
      <h3 class="section-title">Data</h3>
      <p class="muted small">All data lagres kun på denne enheten. Ta sikkerhetskopi jevnlig.</p>
      <button class="btn ghost block" data-export>${icon('download')} Eksporter sikkerhetskopi</button>
      <label class="btn ghost block file-btn">${icon('upload')} Importer sikkerhetskopi<input type="file" accept="application/json,.json" data-import hidden></label>
      <button class="btn danger block" data-reset>${icon('trash')} Slett all data</button>
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
      m.querySelector('[data-rest]').addEventListener('change', (e) => { st.rest = Math.max(5, Number(e.target.value) || 90); save(); });
      m.querySelector('[data-auto]').addEventListener('change', (e) => { st.autoRest = e.target.checked; save(); });
      m.querySelector('[data-sound]').addEventListener('change', (e) => { st.sound = e.target.checked; save(); });
      m.querySelector('[data-export]').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `gymapp-backup-${dateKey()}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      });
      m.querySelector('[data-import]').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const data = JSON.parse(await file.text());
          if (typeof data !== 'object' || !data.log) throw new Error('Ugyldig fil');
          if (!await confirmDialog('Dette erstatter all nåværende data med sikkerhetskopien. Fortsette?', 'Importer')) return;
          replaceState(data);
          close();
          toast('Data importert');
          location.reload();
        } catch {
          toast('Kunne ikke lese filen');
        }
      });
      m.querySelector('[data-reset]').addEventListener('click', async () => {
        if (await confirmDialog('Slette all treningsdata, egne øvelser og programmer? Dette kan ikke angres.', 'Slett alt')) {
          resetState();
          close();
          location.reload();
        }
      });
    },
  });
}
