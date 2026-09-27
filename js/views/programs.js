// Treningsprogrammer: innebygde og egne, med redigering.
import { allPrograms, getProgram, saveProgram, deleteProgram, getExercise } from '../store.js';
import { esc, icon, openModal, confirmDialog, toast, dateKey } from '../utils.js';
import { openExercisePicker } from './picker.js';
import { startWorkout, goToDate } from './log.js';

let rootEl;
let navigate;

export function renderPrograms(root, nav) {
  rootEl = root;
  navigate = nav;
  const programs = allPrograms();
  const mine = programs.filter((p) => !p.builtin);
  const builtin = programs.filter((p) => p.builtin);
  const card = (p) => `
    <button class="card prog-card" data-id="${esc(p.id)}">
      <div class="prog-top">
        <span class="title">${esc(p.name)}</span>
        ${p.level ? `<span class="badge">${esc(p.level)}</span>` : ''}
      </div>
      ${p.desc ? `<p class="sub clamp">${esc(p.desc)}</p>` : ''}
      <div class="prog-meta">
        <span>${icon('list')} ${p.workouts.length} økt${p.workouts.length === 1 ? '' : 'er'}</span>
        ${p.days ? `<span>${icon('calendar')} ${p.days} dager/uke</span>` : ''}
        <span>${icon('dumbbell')} ${new Set(p.workouts.flatMap((w) => w.exercises.map((x) => x.ex))).size} øvelser</span>
      </div>
    </button>`;

  root.innerHTML = `
    <header class="page-head">
      <h1>Programmer</h1>
      <button class="btn primary sm" data-act="new">${icon('plus')} Nytt program</button>
    </header>
    ${mine.length ? `<h3 class="section-title">Mine programmer</h3>${mine.map(card).join('')}` : ''}
    <h3 class="section-title">Ferdige programmer</h3>
    ${builtin.map(card).join('')}`;

  root.onclick = (e) => {
    if (e.target.closest('[data-act="new"]')) return openProgramEditor(null);
    const c = e.target.closest('[data-id]');
    if (c) openProgramDetail(c.dataset.id);
  };
}

const target = (x) => {
  const ex = getExercise(x.ex);
  if (!x.sets) return '';
  if (ex.type === 't') return `${x.sets} × ${x.reps}s`;
  if (ex.type === 'dt') return `${x.sets} runde${x.sets > 1 ? 'r' : ''}`;
  return `${x.sets} × ${x.reps ?? '–'}`;
};

function openProgramDetail(id) {
  const p = getProgram(id);
  openModal(`
    <div class="modal-head">
      <div><h2>${esc(p.name)}</h2>
      <p class="sub">${[p.level, p.days && `${p.days} dager/uke`].filter(Boolean).map(esc).join(' · ')}</p></div>
      <button class="icon-btn" data-close aria-label="Lukk">${icon('close')}</button>
    </div>
    <div class="scroll">
      ${p.desc ? `<p class="desc">${esc(p.desc)}</p>` : ''}
      ${p.workouts.map((w) => `
        <div class="card workout">
          <div class="row between">
            <h3>${esc(w.name)}</h3>
            <button class="btn primary sm" data-start="${esc(w.id)}">${icon('play')} Start i dag</button>
          </div>
          <ol class="wo-list">
            ${w.exercises.map((x) => `<li><span>${esc(getExercise(x.ex).name)}</span><span class="muted">${target(x)}</span></li>`).join('')}
          </ol>
        </div>`).join('')}
      <div class="row gap mt">
        ${p.builtin
          ? `<button class="btn ghost grow" data-copy>${icon('copy')} Kopier og tilpass</button>`
          : `<button class="btn ghost grow" data-edit>${icon('edit')} Rediger</button>
             <button class="btn danger grow" data-del>${icon('trash')} Slett</button>`}
      </div>
    </div>`, {
    className: 'tall',
    onMount(m, close) {
      m.addEventListener('click', async (e) => {
        const s = e.target.closest('[data-start]');
        if (s) {
          const today = dateKey();
          startWorkout(p, p.workouts.find((w) => w.id === s.dataset.start), today);
          close();
          goToDate(today);
          navigate('log');
          toast('Økt lagt til i dag – lykke til!');
          return;
        }
        if (e.target.closest('[data-copy]')) {
          close();
          const copy = JSON.parse(JSON.stringify(p));
          copy.name = `${p.name} (kopi)`;
          copy.workouts.forEach((w) => { delete w.id; });
          openProgramEditor(copy);
        }
        if (e.target.closest('[data-edit]')) { close(); openProgramEditor(JSON.parse(JSON.stringify(p))); }
        if (e.target.closest('[data-del]') && await confirmDialog(`Slette programmet «${p.name}»?`)) {
          deleteProgram(p.id);
          close();
          renderPrograms(rootEl, navigate);
          toast('Program slettet');
        }
      });
    },
  });
}

function openProgramEditor(program) {
  const p = program || { name: '', desc: '', level: '', days: 3, workouts: [{ name: 'Økt A', exercises: [] }] };

  const html = () => `
    <div class="modal-head">
      <h2>${program?.id && !program.builtin ? 'Rediger program' : 'Nytt program'}</h2>
      <button class="icon-btn" data-close aria-label="Lukk">${icon('close')}</button>
    </div>
    <div class="scroll form">
      <label>Navn<input class="input" data-f="name" value="${esc(p.name)}" placeholder="Mitt program"></label>
      <label>Beskrivelse<textarea class="input" data-f="desc" rows="2" placeholder="Valgfritt">${esc(p.desc)}</textarea></label>
      <div class="row gap">
        <label class="grow">Nivå<input class="input" data-f="level" value="${esc(p.level || '')}" placeholder="F.eks. Nybegynner"></label>
        <label class="grow">Dager per uke<input class="input" data-f="days" type="number" min="1" max="7" value="${p.days ?? ''}"></label>
      </div>
      ${p.workouts.map((w, wi) => `
        <div class="card workout" data-wi="${wi}">
          <div class="row gap">
            <input class="input grow" data-wname value="${esc(w.name)}" placeholder="Navn på økt">
            <button class="icon-btn" data-wdel aria-label="Slett økt">${icon('trash')}</button>
          </div>
          ${w.exercises.map((x, xi) => {
            const ex = getExercise(x.ex);
            return `
            <div class="ed-ex" data-xi="${xi}">
              <span class="grow">${esc(ex.name)}</span>
              <input class="input tiny" data-x="sets" type="number" min="1" value="${x.sets ?? 3}" aria-label="Sett">
              <span class="muted">×</span>
              <input class="input tiny" data-x="reps" type="number" min="1" value="${x.reps ?? ''}" aria-label="${ex.type === 't' ? 'Sekunder' : 'Reps'}" placeholder="${ex.type === 't' ? 'sek' : 'reps'}">
              <button class="icon-btn sm" data-xup aria-label="Flytt opp">${icon('up')}</button>
              <button class="icon-btn sm" data-xdel aria-label="Fjern">${icon('close')}</button>
            </div>`;
          }).join('')}
          <button class="btn ghost sm" data-xadd>${icon('plus')} Legg til øvelser</button>
        </div>`).join('')}
      <button class="btn ghost block" data-wadd>${icon('plus')} Legg til økt</button>
      <button class="btn primary block" data-save>Lagre program</button>
    </div>`;

  openModal('<div class="editor"></div>', {
    className: 'tall',
    onMount(m, close) {
      const box = m.querySelector('.editor');
      const draw = () => {
        const st = box.querySelector('.scroll')?.scrollTop || 0;
        box.innerHTML = html();
        box.querySelector('.scroll').scrollTop = st;
      };
      box.addEventListener('input', (e) => {
        const t = e.target;
        if (t.dataset.f) p[t.dataset.f] = t.dataset.f === 'days' ? (Number(t.value) || null) : t.value;
        const wEl = t.closest('[data-wi]');
        if (!wEl) return;
        const w = p.workouts[Number(wEl.dataset.wi)];
        if (t.hasAttribute('data-wname')) w.name = t.value;
        if (t.dataset.x) w.exercises[Number(t.closest('[data-xi]').dataset.xi)][t.dataset.x] = Number(t.value) || null;
      });
      box.addEventListener('click', (e) => {
        const wEl = e.target.closest('[data-wi]');
        const w = wEl && p.workouts[Number(wEl.dataset.wi)];
        const xi = Number(e.target.closest('[data-xi]')?.dataset.xi);
        if (e.target.closest('[data-wadd]')) {
          p.workouts.push({ name: `Økt ${String.fromCharCode(65 + p.workouts.length)}`, exercises: [] });
          draw();
        } else if (e.target.closest('[data-wdel]')) {
          p.workouts.splice(Number(wEl.dataset.wi), 1);
          draw();
        } else if (e.target.closest('[data-xdel]')) {
          w.exercises.splice(xi, 1);
          draw();
        } else if (e.target.closest('[data-xup]')) {
          if (xi > 0) [w.exercises[xi - 1], w.exercises[xi]] = [w.exercises[xi], w.exercises[xi - 1]];
          draw();
        } else if (e.target.closest('[data-xadd]')) {
          openExercisePicker({
            onPick(ids) {
              ids.forEach((id) => w.exercises.push({ ex: id, sets: 3, reps: getExercise(id).type === 't' ? 30 : 10 }));
              draw();
            },
          });
        } else if (e.target.closest('[data-save]')) {
          if (!p.name.trim()) { toast('Gi programmet et navn'); return; }
          p.workouts = p.workouts.filter((x) => x.exercises.length || x.name.trim());
          if (!p.workouts.length) { toast('Legg til minst én økt'); return; }
          saveProgram(p);
          close();
          renderPrograms(rootEl, navigate);
          toast('Program lagret');
        }
      });
      draw();
    },
  });
}
