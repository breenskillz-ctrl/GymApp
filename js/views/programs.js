// Training programs: built-in and custom, with editing.
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
        <span>${icon('list')} ${p.workouts.length} workout${p.workouts.length === 1 ? '' : 's'}</span>
        ${p.days ? `<span>${icon('calendar')} ${p.days} days/week</span>` : ''}
        <span>${icon('dumbbell')} ${new Set(p.workouts.flatMap((w) => w.exercises.map((x) => x.ex))).size} exercises</span>
      </div>
    </button>`;

  root.innerHTML = `
    <header class="page-head">
      <h1>Programs</h1>
      <button class="btn primary sm" data-act="new">${icon('plus')} New program</button>
    </header>
    ${mine.length ? `<h3 class="section-title">My programs</h3>${mine.map(card).join('')}` : ''}
    <h3 class="section-title">Ready-made programs</h3>
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
  if (ex.type === 'dt') return `${x.sets} round${x.sets > 1 ? 's' : ''}`;
  return `${x.sets} × ${x.reps ?? '–'}`;
};

function openProgramDetail(id) {
  const p = getProgram(id);
  openModal(`
    <div class="modal-head">
      <div><h2>${esc(p.name)}</h2>
      <p class="sub">${[p.level, p.days && `${p.days} days/week`].filter(Boolean).map(esc).join(' · ')}</p></div>
      <button class="icon-btn" data-close aria-label="Close">${icon('close')}</button>
    </div>
    <div class="scroll">
      ${p.desc ? `<p class="desc">${esc(p.desc)}</p>` : ''}
      ${p.workouts.map((w) => `
        <div class="card workout">
          <div class="row between">
            <h3>${esc(w.name)}</h3>
            <button class="btn primary sm" data-start="${esc(w.id)}">${icon('play')} Start today</button>
          </div>
          <ol class="wo-list">
            ${w.exercises.map((x) => `<li><span>${esc(getExercise(x.ex).name)}</span><span class="muted">${target(x)}</span></li>`).join('')}
          </ol>
        </div>`).join('')}
      <div class="row gap mt">
        ${p.builtin
          ? `<button class="btn ghost grow" data-copy>${icon('copy')} Copy and customise</button>`
          : `<button class="btn ghost grow" data-edit>${icon('edit')} Edit</button>
             <button class="btn danger grow" data-del>${icon('trash')} Delete</button>`}
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
          toast('Workout added for today – good luck!');
          return;
        }
        if (e.target.closest('[data-copy]')) {
          close();
          const copy = JSON.parse(JSON.stringify(p));
          copy.name = `${p.name} (copy)`;
          copy.workouts.forEach((w) => { delete w.id; });
          openProgramEditor(copy);
        }
        if (e.target.closest('[data-edit]')) { close(); openProgramEditor(JSON.parse(JSON.stringify(p))); }
        if (e.target.closest('[data-del]') && await confirmDialog(`Delete the program "${p.name}"?`)) {
          deleteProgram(p.id);
          close();
          renderPrograms(rootEl, navigate);
          toast('Program deleted');
        }
      });
    },
  });
}

function openProgramEditor(program) {
  const p = program || { name: '', desc: '', level: '', days: 3, workouts: [{ name: 'Workout A', exercises: [] }] };

  const html = () => `
    <div class="modal-head">
      <h2>${program?.id && !program.builtin ? 'Edit program' : 'New program'}</h2>
      <button class="icon-btn" data-close aria-label="Close">${icon('close')}</button>
    </div>
    <div class="scroll form">
      <label>Name<input class="input" data-f="name" value="${esc(p.name)}" placeholder="My program"></label>
      <label>Description<textarea class="input" data-f="desc" rows="2" placeholder="Optional">${esc(p.desc)}</textarea></label>
      <div class="row gap">
        <label class="grow">Level<input class="input" data-f="level" value="${esc(p.level || '')}" placeholder="E.g. Beginner"></label>
        <label class="grow">Days per week<input class="input" data-f="days" type="number" min="1" max="7" value="${p.days ?? ''}"></label>
      </div>
      ${p.workouts.map((w, wi) => `
        <div class="card workout" data-wi="${wi}">
          <div class="row gap">
            <input class="input grow" data-wname value="${esc(w.name)}" placeholder="Workout name">
            <button class="icon-btn" data-wdel aria-label="Delete workout">${icon('trash')}</button>
          </div>
          ${w.exercises.map((x, xi) => {
            const ex = getExercise(x.ex);
            return `
            <div class="ed-ex" data-xi="${xi}">
              <span class="grow">${esc(ex.name)}</span>
              <input class="input tiny" data-x="sets" type="number" min="1" value="${x.sets ?? 3}" aria-label="Sets">
              <span class="muted">×</span>
              <input class="input tiny" data-x="reps" type="number" min="1" value="${x.reps ?? ''}" aria-label="${ex.type === 't' ? 'Seconds' : 'Reps'}" placeholder="${ex.type === 't' ? 'sec' : 'reps'}">
              <button class="icon-btn sm" data-xup aria-label="Move up">${icon('up')}</button>
              <button class="icon-btn sm" data-xdel aria-label="Remove">${icon('close')}</button>
            </div>`;
          }).join('')}
          <button class="btn ghost sm" data-xadd>${icon('plus')} Add exercises</button>
        </div>`).join('')}
      <button class="btn ghost block" data-wadd>${icon('plus')} Add workout</button>
      <button class="btn primary block" data-save>Save program</button>
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
          p.workouts.push({ name: `Workout ${String.fromCharCode(65 + p.workouts.length)}`, exercises: [] });
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
          if (!p.name.trim()) { toast('Give the program a name'); return; }
          p.workouts = p.workouts.filter((x) => x.exercises.length || x.name.trim());
          if (!p.workouts.length) { toast('Add at least one workout'); return; }
          saveProgram(p);
          close();
          renderPrograms(rootEl, navigate);
          toast('Program saved');
        }
      });
      draw();
    },
  });
}
