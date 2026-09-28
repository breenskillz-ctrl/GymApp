// Programs: a two-column card grid (GymKeeper style), with your own nicknamed programs first.
import {
  state, save, allPrograms, getProgram, saveProgram, deleteProgram, getExercise,
} from '../store.js';
import {
  esc, icon, openModal, confirmDialog, toast, topBar, go, promptDialog, menuDialog, dateKey, fmtDate,
} from '../utils.js';
import { programArt } from '../icons.js';
import { openExercisePicker } from './picker.js';
import { startWorkout, goToDate } from './log.js';
import { exLabel } from './seteditor.js';
import { renderBlocks, activeBlocksHtml, onBannerClick } from './blocks.js';
import { openBlockEditor } from './blockeditor.js';

export const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];

const levelClass = (lvl) => {
  const l = String(lvl || '').toLowerCase();
  return ['beginner', 'intermediate', 'advanced'].includes(l) ? `lvl-${l}` : 'lvl-other';
};

function gridHtml() {
  return `<div class="prog-grid">${allPrograms().map((p) => `
    <div class="prog-tile" data-id="${esc(p.id)}" role="button" tabindex="0">
      ${programArt(p.id)}
      <span class="prog-name">${esc(p.name)}</span>
      <button class="icon-btn prog-more" data-more aria-label="Program menu">${icon('more')}</button>
      ${p.level ? `<span class="lvl-badge ${levelClass(p.level)}">${esc(p.level)}</span>` : ''}
    </div>`).join('')}</div>`;
}

const headActions = `
  <button class="icon-btn" data-import aria-label="Import program">${icon('import')}</button>
  <button class="icon-btn" data-new aria-label="New program">${icon('plus')}</button>`;

// Shared click handling for the grid (page and sheet). `ctx` = { date, onAdded, refresh }
async function onGridClick(e, ctx) {
  if (e.target.closest('[data-new]')) return openProgramEditor(null, ctx.refresh);
  if (e.target.closest('[data-import]')) return importProgram(ctx.refresh);
  const tile = e.target.closest('[data-id]');
  if (!tile) return;
  const p = getProgram(tile.dataset.id);
  if (e.target.closest('[data-more]')) return programMenu(p, ctx);
  openProgramDetail(p, ctx);
}

// Programs page with two tabs: "Programs" (the card grid) and "Blocks" (block training, DECISIONS #26)
let tab = 'programs';

export function renderPrograms(root, opts = {}) {
  if (opts.tab) tab = opts.tab;
  const ctx = {
    date: dateKey(),
    refresh: () => draw(),
    onAdded: () => { goToDate(dateKey()); go('log'); },
  };
  const draw = () => {
    const actions = tab === 'programs' ? headActions
      : `<button class="icon-btn" data-newblock aria-label="New block">${icon('plus')}</button>`;
    root.innerHTML = `${topBar('Programs', actions)}
      <div class="seg wide" data-tabs>
        <button class="${tab === 'programs' ? 'active' : ''}" data-tab="programs">Programs</button>
        <button class="${tab === 'blocks' ? 'active' : ''}" data-tab="blocks">Blocks</button>
      </div>
      <div class="tab-body"></div>`;
    const body = root.querySelector('.tab-body');
    if (tab === 'blocks') renderBlocks(body, { embedded: true });
    else body.innerHTML = `${activeBlocksHtml()}${gridHtml()}`;
  };
  root.onclick = (e) => {
    const t = e.target.closest('[data-tab]');
    if (t) { tab = t.dataset.tab; draw(); return; }
    if (e.target.closest('[data-newblock]')) { openBlockEditor(null, draw); return; }
    if (tab !== 'programs') return; // the Blocks tab handles its own clicks
    if (onBannerClick(e, ctx.date, ctx.onAdded)) return;
    onGridClick(e, ctx);
  };
  draw();
}

// Programs sheet (from the + sheet's "From program" tile): picks a workout for `date`
export function openProgramsSheet({ date, onAdded }) {
  openModal('<div class="sheet-body editor"></div><button class="close-float" data-close>Close</button>', {
    className: 'sheet',
    onMount(m, close) {
      const body = m.querySelector('.sheet-body');
      const draw = () => {
        body.innerHTML = `<div class="modal-head"><h2 class="grow">Programs</h2><div class="actions">${headActions}</div></div>
          <div class="scroll">${activeBlocksHtml()}${state.blocks.some((b) => !b.finished) ? '<h3 class="section-title">Programs</h3>' : ''}${gridHtml()}</div>`;
      };
      const ctx = { date, refresh: draw, onAdded: () => { close(); onAdded?.(); } };
      body.addEventListener('click', (e) => {
        if (onBannerClick(e, date, ctx.onAdded)) return;
        onGridClick(e, ctx);
      });
      draw();
    },
  });
}

const target = (x) => {
  const ex = getExercise(x.ex);
  if (!x.sets) return '';
  if (ex.type === 't') return `${x.sets} × ${x.reps}s`;
  if (ex.type === 'dt') return `${x.sets} round${x.sets > 1 ? 's' : ''}`;
  return `${x.sets} × ${x.reps ?? '–'}`;
};

function openProgramDetail(p, ctx) {
  const dayLabel = ctx.date === dateKey() ? 'today' : fmtDate(ctx.date, false);
  openModal(`
    <div class="modal-head">
      <button class="icon-btn" data-close aria-label="Back">${icon('left')}</button>
      <h2 class="grow">${esc(p.name)}</h2>
      <button class="icon-btn" data-more aria-label="Program menu">${icon('more')}</button>
    </div>
    <div class="scroll">
      ${p.desc ? `<p class="desc">${esc(p.desc)}</p>` : ''}
      <p class="sub">${[p.level, p.days && `${p.days} days/week`].filter(Boolean).map(esc).join(' · ')}</p>
      <h3 class="section-title">Pick a workout to add to ${esc(dayLabel)}</h3>
      ${p.workouts.map((w) => `
        <button class="workout-row" data-w="${esc(w.id)}">
          <span class="grow">
            <span class="title">${esc(w.name)}</span>
            <span class="sub">${w.exercises.map((x) => `${esc(exLabel(getExercise(x.ex)))} <span class="muted">${target(x)}</span>`).join(' · ')}</span>
          </span>
          <span class="add">Add</span>
        </button>`).join('')}
    </div>`, {
    className: 'sheet',
    onMount(m, close) {
      m.addEventListener('click', (e) => {
        if (e.target.closest('[data-more]')) {
          programMenu(p, { ...ctx, refresh: () => { close(); ctx.refresh(); } });
          return;
        }
        const b = e.target.closest('[data-w]');
        if (!b) return;
        startWorkout(p, p.workouts.find((w) => w.id === b.dataset.w), ctx.date);
        close();
        toast('Workout added – tap a set to log it');
        ctx.onAdded();
      });
    },
  });
}

async function programMenu(p, ctx) {
  const items = [];
  if (!p.builtin) items.push({ value: 'rename', label: 'Rename', icon: 'edit' }, { value: 'edit', label: 'Edit', icon: 'list' });
  items.push({ value: 'copy', label: p.builtin ? 'Copy and customise' : 'Duplicate', icon: 'copy' });
  items.push({ value: 'export', label: 'Export to file', icon: 'download' });
  if (!p.builtin) items.push({ value: 'delete', label: 'Delete', icon: 'trash', danger: true });
  const v = await menuDialog(p.name, items);
  if (v === 'rename') {
    const name = await promptDialog('Rename program', p.name, { placeholder: 'E.g. Hybrid PPL' });
    if (!name) return;
    p.name = name;
    saveProgram(p);
    ctx.refresh();
  }
  if (v === 'edit') openProgramEditor(JSON.parse(JSON.stringify(p)), ctx.refresh);
  if (v === 'copy') {
    const copy = JSON.parse(JSON.stringify(p));
    copy.name = p.builtin ? p.name : `${p.name} (copy)`;
    delete copy.id;
    copy.workouts.forEach((w) => { delete w.id; });
    openProgramEditor(copy, ctx.refresh);
  }
  if (v === 'export') exportProgram(p);
  if (v === 'delete' && await confirmDialog(`Delete the program "${p.name}"?`)) {
    deleteProgram(p.id);
    ctx.refresh();
    toast('Program deleted');
  }
}

// ---------- Import / export ----------
function exportProgram(p) {
  const exIds = new Set(p.workouts.flatMap((w) => w.exercises.map((x) => x.ex)));
  const data = {
    gymapp: 'program',
    version: 1,
    program: { ...p, id: undefined, builtin: undefined },
    exercises: state.customExercises.filter((x) => exIds.has(x.id)),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${p.name.replace(/[^\w\- ]+/g, '').trim() || 'program'}.gymapp.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function importProgram(onDone) {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'application/json,.json';
  inp.onchange = async () => {
    try {
      const data = JSON.parse(await inp.files[0].text());
      if (data.gymapp !== 'program' || !data.program?.workouts) throw new Error('Not a program file');
      for (const ex of data.exercises || []) {
        if (!state.customExercises.some((x) => x.id === ex.id)) state.customExercises.push({ ...ex, builtin: false });
      }
      save();
      const p = { ...data.program, id: undefined };
      p.workouts.forEach((w) => { delete w.id; });
      saveProgram(p);
      toast(`Imported "${p.name}"`);
      onDone?.();
    } catch {
      toast('Could not import that file');
    }
  };
  inp.click();
}

// ---------- Editor ----------
function openProgramEditor(program, onSave) {
  const p = program || { name: '', desc: '', level: '', days: 3, workouts: [{ name: 'Workout A', exercises: [] }] };

  const html = () => `
    <div class="modal-head">
      <button class="icon-btn" data-close aria-label="Close">${icon('close')}</button>
      <h2 class="grow">${program?.id && !program.builtin ? 'Edit program' : 'New program'}</h2>
      <button class="text-btn accent" data-save>Save</button>
    </div>
    <div class="scroll form">
      <label>Name (your own nickname)<input class="input" data-f="name" value="${esc(p.name)}" placeholder="E.g. Hybrid PPL"></label>
      <label>Description<textarea class="input" data-f="desc" rows="2" placeholder="Optional">${esc(p.desc || '')}</textarea></label>
      <div class="row gap">
        <label class="grow">Level<select class="input" data-f="level">
          <option value="">None</option>
          ${LEVEL_OPTIONS.map((l) => `<option ${p.level === l ? 'selected' : ''}>${l}</option>`).join('')}
          ${p.level && !LEVEL_OPTIONS.includes(p.level) ? `<option selected>${esc(p.level)}</option>` : ''}
        </select></label>
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
    </div>`;

  openModal('<div class="editor"></div>', {
    className: 'sheet',
    onMount(m, close) {
      const box = m.querySelector('.editor');
      const draw = () => {
        const st = box.querySelector('.scroll')?.scrollTop || 0;
        box.innerHTML = html();
        box.querySelector('.scroll').scrollTop = st;
      };
      const onField = (e) => {
        const t = e.target;
        if (t.dataset.f) p[t.dataset.f] = t.dataset.f === 'days' ? (Number(t.value) || null) : t.value;
        const wEl = t.closest('[data-wi]');
        if (!wEl) return;
        const w = p.workouts[Number(wEl.dataset.wi)];
        if (t.hasAttribute('data-wname')) w.name = t.value;
        if (t.dataset.x) w.exercises[Number(t.closest('[data-xi]').dataset.xi)][t.dataset.x] = Number(t.value) || null;
      };
      box.addEventListener('input', onField);
      box.addEventListener('change', onField);
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
          onSave?.();
          toast('Program saved');
        }
      });
      draw();
    },
  });
}
