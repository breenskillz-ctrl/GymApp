// Block training (DECISIONS #23): templates, weight maths and turning a block day into a logged workout.
// A template has weeks × days × items. An item is either
//   { slot|ex, kind: 'pct', sets: [{ pct, reps, amrap?, addSteps? }] }  – sets × reps @ % of the training max
//   { slot|ex, kind: 'normal', sets: n, reps: r }                       – accessory with normal rep-range suggestions
// Custom templates store pct items compactly as { count, reps, pct, amrapLast } and are expanded when a block starts.
import {
  state, save, getDay, addEntry, getExercise, getProgression, history,
} from './store.js';
import { uid, e1rm, dateKey } from './utils.js';

const S = (n, pct, reps, extra = {}) => Array.from({ length: n }, () => ({ pct, reps, ...extra }));
const day = (name, items) => ({ name, items });
const main = (sets) => [{ slot: 'main', kind: 'pct', sets }];

// ---------- Built-in templates ----------
const RUSSIAN = [
  [[6, 80, 2], [6, 80, 3], [6, 80, 2]],
  [[6, 80, 4], [6, 80, 2], [6, 80, 5]],
  [[6, 80, 2], [6, 80, 6], [6, 80, 2]],
  [[5, 85, 5], [6, 80, 2], [4, 90, 4]],
  [[6, 80, 2], [3, 95, 3], [6, 80, 2]],
  [[2, 100, 2], [6, 80, 2], [1, 105, 1]],
];

// 5/3/1: three work sets per week, the last one "+" (as many reps as possible); week 4 is a deload
const W531 = [
  [[65, 5], [75, 5], [85, 5, true]],
  [[70, 3], [80, 3], [90, 3, true]],
  [[75, 5], [85, 3], [95, 1, true]],
  [[40, 5], [50, 5], [60, 5]],
];
const sets531 = (week) => week.map(([pct, reps, amrap]) => ({ pct, reps, ...(amrap ? { amrap: true } : {}) }));

// Smolov Jr: the same four days for three weeks; weeks 2 and 3 add one and two weight steps (5 kg lower body, 2.5 kg upper body)
const SMOLOV_DAYS = [[6, 70, 6], [7, 75, 5], [8, 80, 4], [10, 85, 3]];

export const BLOCK_TEMPLATES = [
  {
    id: 'bt-russian',
    base: 100, // percentages of the real 1RM
    name: 'Russian Squat Program',
    desc: '6 weeks, 3 days a week. Lots of sets at 80 %, building to heavy triples, doubles and a test at 105 %. Works for squat or bench.',
    slots: [{ key: 'main', label: 'Main lift', ex: 'squat' }],
    weeks: RUSSIAN.map((w) => ({ days: w.map(([n, pct, reps], i) => day(`Day ${i + 1}`, main(S(n, pct, reps)))) })),
  },
  {
    id: 'bt-531',
    base: 90, // 5/3/1 works from a training max of 90 % of 1RM
    name: '5/3/1',
    desc: '4-week cycles: a 5s week, a 3s week, a 5/3/1 week and a deload. The last set each week is "+" (as many reps as possible). 4 days a week, one main lift per day.',
    slots: [
      { key: 'ohp', label: 'Day 1 lift', ex: 'overhead-press' },
      { key: 'dl', label: 'Day 2 lift', ex: 'deadlift' },
      { key: 'bench', label: 'Day 3 lift', ex: 'bench-press' },
      { key: 'squat', label: 'Day 4 lift', ex: 'squat' },
    ],
    weeks: W531.map((w) => ({
      days: ['ohp', 'dl', 'bench', 'squat'].map((slot, i) => day(`Day ${i + 1}`, [{ slot, kind: 'pct', sets: sets531(w) }])),
    })),
  },
  {
    id: 'bt-smolov-jr',
    base: 100, // percentages of the real 1RM
    name: 'Smolov Jr.',
    desc: '3 weeks, 4 days a week for one lift: 6×6, 7×5, 8×4 and 10×3. Weeks 2 and 3 add weight (+5/+10 kg lower body, +2.5/+5 kg upper body). Very demanding.',
    slots: [{ key: 'main', label: 'Main lift', ex: 'bench-press' }],
    weeks: [0, 1, 2].map((w) => ({
      days: SMOLOV_DAYS.map(([n, pct, reps], i) => day(`Day ${i + 1}`, main(S(n, pct, reps, { addSteps: w })))),
    })),
  },
];

export const allBlockTemplates = () => [...(state.blockTemplates || []), ...BLOCK_TEMPLATES];
export const getBlockTemplate = (id) => allBlockTemplates().find((t) => t.id === id);

// Default base % for a template: 100 % of 1RM unless the template says otherwise (5/3/1 uses a 90 % training max)
export const templateBase = (t) => t?.base ?? 100;

// Main lifts in a template that need a 1RM: slots for built-ins, distinct % exercises for custom templates
export function templateLifts(t) {
  if (t.slots) return t.slots.map((s) => ({ key: s.key, label: s.label, ex: s.ex }));
  const ids = [...new Set(t.weeks.flatMap((w) => w.days.flatMap((d) => d.items.filter((i) => i.kind === 'pct').map((i) => i.ex))))];
  return ids.map((ex) => ({ key: ex, label: getExercise(ex).name, ex }));
}

// Expand compact custom items into explicit sets
function expandItem(item, lifts) {
  const ex = item.slot ? lifts[item.slot] : item.ex;
  if (item.kind !== 'pct') return { ex, kind: 'normal', sets: item.sets || 3, reps: item.reps || 10 };
  const sets = Array.isArray(item.sets) ? item.sets
    : Array.from({ length: item.count || 1 }, (_, i) => ({
      pct: item.pct, reps: item.reps, ...(item.amrapLast && i === (item.count || 1) - 1 ? { amrap: true } : {}),
    }));
  return { ex, kind: 'pct', sets };
}

// ---------- Running blocks ----------
// block: { id, name, templateId, base, maxes: { exId: kg }, weeks, pos: { w, d }, started, finished }
export function createBlock(template, { name, lifts, maxes, base }) {
  const block = {
    id: 'b-' + uid(),
    name: name || template.name,
    templateId: template.id,
    base,
    maxes,
    weeks: template.weeks.map((w) => ({ days: w.days.map((d) => ({ name: d.name, items: d.items.map((it) => expandItem(it, lifts)) })) })),
    pos: { w: 0, d: 0 },
    started: dateKey(),
    finished: false,
  };
  state.blocks.unshift(block);
  save();
  return block;
}

export function blockSize(b) {
  return b.weeks.reduce((n, w) => n + w.days.length, 0);
}

export function blockIndex(b) {
  let n = 0;
  for (let w = 0; w < b.pos.w; w++) n += b.weeks[w].days.length;
  return n + b.pos.d;
}

// Move the position by +1 or -1 day
export function moveBlock(b, step) {
  let { w, d } = b.pos;
  if (step > 0) {
    d++;
    if (d >= b.weeks[w].days.length) { w++; d = 0; }
    if (w >= b.weeks.length) { b.finished = true; w = b.weeks.length - 1; d = b.weeks[w].days.length - 1; }
  } else {
    if (b.finished) { // un-finish: the last day becomes "next" again
      b.finished = false;
      save();
      return;
    }
    d--;
    if (d < 0) { w = Math.max(0, w - 1); d = w === b.pos.w ? 0 : b.weeks[w].days.length - 1; }
  }
  b.pos = { w, d };
  save();
}

const isLower = (ex) => ex.group === 'Legs' || ex.id === 'deadlift';

// One weight step for a lift: 5 kg lower body, 2.5 kg upper body (10/5 lb)
export const liftStep = (ex) => (state.settings.unit === 'lb' ? (isLower(ex) ? 10 : 5) : (isLower(ex) ? 5 : 2.5));

// Weight for one prescribed set: 1RM × base % × set % (+ weight steps), rounded to the exercise's weight step
export function setWeight(b, exId, set) {
  const max = b.maxes[exId];
  if (!max) return null;
  const ex = getExercise(exId);
  const step = getProgression(exId).inc || 2.5;
  const add = (set.addSteps || 0) * liftStep(ex);
  const raw = max * (b.base / 100) * (set.pct / 100) + add;
  return Math.round(raw / step) * step;
}

// Add the block day at (w, d) to a log date as planned sets, then move the block on to the next day
export function addBlockWorkout(b, date, w = b.pos.w, d = b.pos.d) {
  const bd = b.weeks[w].days[d];
  const log = getDay(date, true);
  if (!log.title) log.title = `${b.name} · W${w + 1} D${d + 1}`;
  for (const it of bd.items) {
    if (it.kind === 'normal') {
      addEntry(date, it.ex, { sets: it.sets, reps: it.reps });
      continue;
    }
    const entry = addEntry(date, it.ex, null, false);
    entry.block = { id: b.id, w, d };
    entry.sets = it.sets.map((s) => ({
      w: setWeight(b, it.ex, s),
      r: s.reps,
      t: null,
      d: null,
      done: false,
      lvl: s.pct >= 90 || s.amrap ? 'hard' : 'normal',
      pct: s.pct,
      ...(s.amrap ? { amrap: true, goal: s.reps, c: 'AMRAP – as many reps as possible' } : {}),
    }));
  }
  b.pos = { w, d };
  moveBlock(b, 1);
  save();
}

// Best estimated 1RM for an exercise since a date (used to suggest new maxes when a block ends)
export function bestSince(exId, since) {
  let best = 0;
  for (const h of history(exId)) {
    if (h.date < since) continue;
    for (const s of h.sets) best = Math.max(best, e1rm(s.w, s.r));
  }
  return best ? Math.round(best * 2) / 2 : null;
}

// Short text for one day's prescription, e.g. "Squat 6×2 @ 80 % · 110 kg"
export function dayText(b, bd) {
  const u = state.settings.unit;
  return bd.items.map((it) => {
    const ex = getExercise(it.ex);
    if (it.kind === 'normal') return `${ex.name} ${it.sets}×${it.reps}`;
    const groups = [];
    for (const s of it.sets) {
      const g = groups[groups.length - 1];
      const key = `${s.pct}|${s.reps}|${s.amrap ? 1 : 0}|${s.addSteps || 0}`;
      if (g && g.key === key) g.n++;
      else groups.push({ key, n: 1, s });
    }
    return `${ex.name} ${groups.map(({ n, s }) => {
      const kg = setWeight(b, it.ex, s);
      return `${n}×${s.reps}${s.amrap ? '+' : ''} @ ${s.pct}\u00a0%${kg ? ` (${kg} ${u})` : ''}`;
    }).join(', ')}`;
  }).join(' · ');
}

// 5/3/1-style update from the "+" sets (DECISIONS #31): when every AMRAP set of a lift in this block reached its
// prescribed reps, the training max goes up one step (2.5 kg upper / 5 kg lower body). The 1RM we store moves by
// step ÷ base %, so the training max (1RM × base %) rises by exactly one step. Returns { exId: { max, ok, sets } }.
export function amrapResults(b) {
  const out = {};
  for (const day of Object.values(state.log)) {
    for (const e of day.entries) {
      if (e.block?.id !== b.id) continue;
      for (const s of e.sets) {
        if (!s.amrap || !s.done || !s.goal) continue;
        const r = out[e.ex] || (out[e.ex] = { ok: true, sets: 0 });
        r.sets++;
        if ((s.r || 0) < s.goal) r.ok = false;
      }
    }
  }
  for (const [exId, r] of Object.entries(out)) {
    const max = b.maxes[exId];
    if (!max) { delete out[exId]; continue; }
    const step = liftStep(getExercise(exId)) / ((b.base || 100) / 100);
    r.max = r.ok ? Math.round((max + step) * 2) / 2 : max;
  }
  return out;
}
