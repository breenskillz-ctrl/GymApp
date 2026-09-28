// Blocks page: running blocks (position, next workout, schedule) and templates to start from (DECISIONS #23).
import { state, save, getExercise, bestE1rmOf } from '../store.js';
import {
  esc, icon, openModal, topBar, toast, go, menuDialog, confirmDialog, dateKey, num, fmtNum,
} from '../utils.js';
import {
  allBlockTemplates, getBlockTemplate, templateLifts, createBlock, blockSize, blockIndex, moveBlock, addBlockWorkout,
  dayText, bestSince, setWeight,
} from '../blocks.js';
import { goToDate } from './log.js';
import { openExercisePicker } from './picker.js';
import { openBlockEditor } from './blockeditor.js';

let rootEl;
const redraw = () => renderBlocks(rootEl);

function blockCard(b) {
  const size = blockSize(b);
  const done = b.finished ? size : blockIndex(b);
  const lifts = Object.entries(b.maxes).map(([id, max]) => `${esc(getExercise(id).name)} ${fmtNum(max, 1)} ${state.settings.unit}`).join(' · ');
  const next = b.weeks[b.pos.w].days[b.pos.d];
  return `
    <section class="card block-card" data-block="${esc(b.id)}">
      <div class="row between">
        <div class="grow"><span class="title">${esc(b.name)}</span>
          <span class="sub">${b.finished ? 'Finished' : `Week ${b.pos.w + 1} of ${b.weeks.length} · Day ${b.pos.d + 1} of ${b.weeks[b.pos.w].days.length}`}</span></div>
        <button class="icon-btn" data-bact="menu" aria-label="Block menu">${icon('more')}</button>
      </div>
      <div class="bar"><span style="width:${(done / size) * 100}%"></span></div>
      <p class="sub">1RM: ${lifts || '–'} · base ${b.base} %</p>
      ${b.finished ? `
        <p class="block-next">🎉 Block complete. Update your 1RM and run it again, or start a new block.</p>
        <button class="btn primary block" data-bact="finish">Update 1RM</button>` : `
        <p class="block-next"><span class="muted">Next:</span> ${esc(next.name)} – ${esc(dayText(b, next))}</p>
        <button class="btn primary block" data-bact="next">${icon('plus')} Add next workout to today</button>`}
      <button class="btn ghost block" data-bact="schedule">${icon('calendar')} Schedule</button>
    </section>`;
}

export function renderBlocks(root) {
  rootEl = root;
  const running = state.blocks;
  root.innerHTML = `
    ${topBar('Blocks', `<button class="icon-btn" data-act="new" aria-label="New block template">${icon('plus')}</button>`)}
    ${running.length ? running.map(blockCard).join('') : `<p class="empty">No active block. Pick a template below to start one.</p>`}
    <h3 class="section-title">Start a block</h3>
    ${allBlockTemplates().map((t) => `
      <button class="card tpl-row" data-tpl="${esc(t.id)}">
        <span class="grow"><span class="title">${esc(t.name)}${t.slots ? '' : ' <span class="muted small">· yours</span>'}</span>
        <span class="sub">${t.weeks.length} weeks · ${t.weeks[0].days.length} days/week${t.desc ? ` · ${esc(t.desc)}` : ''}</span></span>
        ${icon('right')}
      </button>`).join('')}
    <button class="btn ghost block" data-act="new">${icon('plus')} Create your own block</button>`;

  root.onclick = async (e) => {
    if (e.target.closest('[data-act="new"]')) return openBlockEditor(null, redraw);
    const tpl = e.target.closest('[data-tpl]');
    if (tpl) return openStartDialog(getBlockTemplate(tpl.dataset.tpl));
    const a = e.target.closest('[data-bact]')?.dataset.bact;
    const card = e.target.closest('[data-block]');
    const b = card && state.blocks.find((x) => x.id === card.dataset.block);
    if (!b || !a) return;
    if (a === 'next') {
      addBlockWorkout(b, dateKey());
      goToDate(dateKey());
      go('log');
      toast('Block workout added – tap a set to log it');
    }
    if (a === 'schedule') openSchedule(b);
    if (a === 'finish') openFinishDialog(b);
    if (a === 'menu') blockMenu(b);
  };
}

async function blockMenu(b) {
  const tpl = getBlockTemplate(b.templateId);
  const items = [
    { value: 'skip', label: 'Skip next day', icon: 'right' },
    { value: 'back', label: 'Go back one day', icon: 'left' },
    { value: 'maxes', label: 'Edit 1RM and base %', icon: 'edit' },
  ];
  if (tpl && !tpl.slots) items.push({ value: 'tpl', label: 'Edit template', icon: 'list' });
  items.push({ value: 'del', label: 'Remove block', icon: 'trash', danger: true });
  const v = await menuDialog(b.name, items);
  if (v === 'skip') { moveBlock(b, 1); redraw(); }
  if (v === 'back') { moveBlock(b, -1); redraw(); }
  if (v === 'maxes') openMaxesDialog(b);
  if (v === 'tpl') openBlockEditor(tpl, redraw);
  if (v === 'del' && await confirmDialog(`Remove "${b.name}"? Workouts you already logged are kept.`, 'Remove')) {
    state.blocks = state.blocks.filter((x) => x !== b);
    save();
    redraw();
  }
}

// Inputs for 1RM per lift + base %
function maxesForm(lifts, maxes, base) {
  const u = state.settings.unit;
  return `
    ${lifts.map((l) => `
      <div class="lift-row" data-key="${esc(l.key)}">
        <button type="button" class="btn ghost sm grow lift-pick" data-pick="${esc(l.key)}" data-ex="${esc(l.ex)}">${esc(l.label)}: <strong>${esc(getExercise(l.ex).name)}</strong></button>
        <label class="max-input">1RM (${u})<input class="input" name="max-${esc(l.key)}" inputmode="decimal" value="${maxes[l.ex] ?? ''}" placeholder="e.g. 150"></label>
      </div>`).join('')}
    <label>Base: % of 1RM to calculate from<input class="input" name="base" type="number" inputmode="numeric" min="50" max="110" value="${base}"></label>
    <p class="sub">90 % = training max (your choice). Classic Russian Squat and Smolov Jr. are written for 100 %.</p>`;
}

function openStartDialog(t) {
  const lifts = templateLifts(t);
  const maxes = {};
  for (const l of lifts) maxes[l.ex] = bestE1rmOf(l.ex);
  openModal(`
    <h2 class="dialog-title">${esc(t.name)}</h2>
    ${t.desc ? `<p class="sub" style="margin:-6px 0 12px">${esc(t.desc)}</p>` : ''}
    <form class="form">
      <label>Name<input class="input" name="name" value="${esc(t.name)}"></label>
      <div class="lifts">${maxesForm(lifts, maxes, 90)}</div>
      <div class="dialog-actions">
        <button type="button" class="text-btn" data-close>Cancel</button>
        <button type="submit" class="text-btn accent">Start block</button>
      </div>
    </form>`, {
    className: 'dialog',
    onMount(m, close) {
      m.addEventListener('click', (e) => {
        const pick = e.target.closest('[data-pick]');
        if (!pick || !t.slots) return; // custom templates have fixed exercises
        openExercisePicker({
          title: 'Choose lift',
          multi: false,
          onPick([id]) {
            const l = lifts.find((x) => x.key === pick.dataset.pick);
            l.ex = id;
            pick.dataset.ex = id;
            pick.innerHTML = `${esc(l.label)}: <strong>${esc(getExercise(id).name)}</strong>`;
            const inp = m.querySelector(`[name="max-${CSS.escape(l.key)}"]`);
            if (!inp.value) inp.value = bestE1rmOf(id) ?? '';
          },
        });
      });
      m.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        const liftMap = {};
        const maxMap = {};
        for (const l of lifts) {
          liftMap[l.key] = l.ex;
          const v = num(f.get(`max-${l.key}`));
          if (!v) { toast(`Enter a 1RM for ${getExercise(l.ex).name}`); return; }
          maxMap[l.ex] = v;
        }
        createBlock(t, { name: f.get('name').trim() || t.name, lifts: liftMap, maxes: maxMap, base: Number(f.get('base')) || 90 });
        close();
        toast('Block started');
        redraw();
      });
    },
  });
}

function openMaxesDialog(b, title = 'Edit 1RM', suggested = null) {
  const lifts = Object.keys(b.maxes).map((ex) => ({ key: ex, label: 'Lift', ex }));
  const maxes = { ...b.maxes, ...(suggested || {}) };
  openModal(`
    <h2 class="dialog-title">${esc(title)}</h2>
    ${suggested ? '<p class="sub" style="margin:-6px 0 12px">Pre-filled with your best estimated 1RM during the block.</p>' : ''}
    <form class="form">
      ${maxesForm(lifts, maxes, b.base)}
      ${suggested ? '<label class="switch"><input type="checkbox" name="restart" checked> Start the block again from week 1</label>' : ''}
      <div class="dialog-actions">
        <button type="button" class="text-btn" data-close>Cancel</button>
        <button type="submit" class="text-btn accent">Save</button>
      </div>
    </form>`, {
    className: 'dialog',
    onMount(m, close) {
      m.querySelectorAll('[data-pick]').forEach((x) => { x.disabled = true; });
      m.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        for (const l of lifts) {
          const v = num(f.get(`max-${l.key}`));
          if (v) b.maxes[l.ex] = v;
        }
        b.base = Number(f.get('base')) || b.base;
        if (f.get('restart')) {
          b.pos = { w: 0, d: 0 };
          b.finished = false;
          b.started = dateKey();
        }
        save();
        close();
        toast('Saved');
        redraw();
      });
    },
  });
}

function openFinishDialog(b) {
  const suggested = {};
  for (const ex of Object.keys(b.maxes)) {
    const best = bestSince(ex, b.started);
    if (best && best > b.maxes[ex]) suggested[ex] = best;
  }
  openMaxesDialog(b, 'Update 1RM', suggested);
}

// The whole block as a table: weeks × days, with the calculated weights
function openSchedule(b) {
  const u = state.settings.unit;
  const named = new Set(b.weeks.flatMap((wk) => wk.days.flatMap((dd) => dd.items.map((i) => i.ex)))).size > 1;
  const cell = (w, d) => {
    const bd = b.weeks[w].days[d];
    const isNext = !b.finished && w === b.pos.w && d === b.pos.d;
    const past = b.finished || w < b.pos.w || (w === b.pos.w && d < b.pos.d);
    return `<button class="sched-cell ${isNext ? 'next' : ''} ${past ? 'past' : ''}" data-w="${w}" data-d="${d}">
      ${bd.items.map((it) => {
        const ex = getExercise(it.ex);
        if (it.kind === 'normal') return `<span class="sc-line muted">${esc(ex.name)} ${it.sets}×${it.reps}</span>`;
        const first = it.sets[0];
        const same = it.sets.every((s) => s.pct === first.pct && s.reps === first.reps && !s.amrap);
        const body = same
          ? `<strong>${setWeight(b, it.ex, first) ?? '–'}</strong> ${it.sets.length}×${first.reps}`
          : it.sets.map((s) => `${setWeight(b, it.ex, s) ?? '–'}×${s.reps}${s.amrap ? '+' : ''}`).join(' ');
        return `<span class="sc-line">${named ? `<span class="muted">${esc(ex.name)}</span> ` : ''}${body}</span>`;
      }).join('')}
    </button>`;
  };
  const days = Math.max(...b.weeks.map((w) => w.days.length));
  // Show exercise names only when the block has more than one exercise
  openModal(`
    <div class="modal-head"><h2 class="grow">${esc(b.name)}</h2>
      <button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>
    <p class="sub" style="margin:-8px 0 10px">Weights in ${u}, sets × reps. Tap a day to add it to today.</p>
    <div class="scroll">
      <div class="sched" style="--days:${days}">
        <span></span>${Array.from({ length: days }, (_, i) => `<span class="sched-h">Day ${i + 1}</span>`).join('')}
        ${b.weeks.map((wk, w) => `<span class="sched-h">Week ${w + 1}</span>${wk.days.map((_, d) => cell(w, d)).join('')}`).join('')}
      </div>
    </div>`, {
    className: 'sheet',
    onMount(m, close) {
      m.addEventListener('click', async (e) => {
        const c = e.target.closest('[data-w]');
        if (!c) return;
        const w = Number(c.dataset.w);
        const d = Number(c.dataset.d);
        if (!await confirmDialog(`Add week ${w + 1}, day ${d + 1} to today? The block continues from the day after it.`, 'Add')) return;
        addBlockWorkout(b, dateKey(), w, d);
        close();
        goToDate(dateKey());
        go('log');
      });
    },
  });
}
