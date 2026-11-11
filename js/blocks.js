// Block training (DECISIONS #23): templates, weight maths and turning a block day into a logged workout.
// A template has weeks × days × items. An item is either
//   { slot|ex, kind: 'pct', sets: [{ pct, reps, amrap?, addSteps? }] }  – sets × reps @ % of the training max
//   { slot|ex, kind: 'normal', sets: n, reps: r }                       – accessory with normal rep-range suggestions
// Custom templates store pct items compactly as { count, reps, pct, amrapLast } and are expanded when a block starts.
import {
  state, save, getDay, addEntry, getExercise, getProgression, history, cleanupDay, warmupSets,
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

// 12-week strength period (DECISIONS #62, #66): three phases (accumulation 1–4, transmutation 5–8, realization 9–12) for
// squat, bench, deadlift and overhead press, main lifts only on a five-day week. Week 12 is a test week with three attempts.
// [sets, % of training max, reps] per week; the percentages give clean 2.5 kg steps from typical training maxes.
const P12 = {
  squat: [[[4, 72.5, 6]], [[4, 76, 6]], [[4, 79.5, 5]], [[3, 72.5, 5]], [[5, 83, 4]], [[5, 86, 3]], [[4, 89.5, 3]], [[3, 79.5, 3]],
    [[3, 93, 2], [1, 98.5, 1]], [[2, 96.5, 2], [1, 101.5, 1]], [[1, 89.5, 1], [3, 79.5, 3]], [[1, 89.5, 1], [1, 100, 1], [1, 107, 1], [1, 114, 1]]],
  bench: [[[4, 71, 6]], [[4, 75, 6]], [[4, 79, 5]], [[3, 71, 5]], [[5, 82.5, 4]], [[5, 86.5, 3]], [[4, 90.5, 3]], [[3, 79, 3]],
    [[3, 94, 2], [1, 98, 1]], [[2, 98, 2], [1, 102, 1]], [[1, 92.5, 1], [3, 79, 3]], [[1, 92.5, 1], [1, 100, 1], [1, 106, 1], [1, 109.5, 1]]],
  pause: [[[3, 67.5, 5]], [[3, 69, 5]], [[3, 71, 5]], [[3, 67.5, 5]], [[4, 73, 4]], [[4, 75, 4]], [[4, 77, 3]], [[3, 71, 3]],
    [[3, 79, 3]], [[3, 79, 2]], [[3, 67.5, 3]], null],
  dl: [[[3, 78.5, 5]], [[3, 81, 5]], [[3, 84, 5]], [[3, 75.5, 3]], [[4, 86.5, 3]], [[4, 89, 3]], [[3, 92, 3]], [[2, 81, 3]],
    [[3, 92, 2], [1, 97.5, 1]], [[2, 100, 1]], [[3, 81, 2]], [[1, 92, 1], [1, 100, 1], [1, 105.5, 1], [1, 111, 1]]],
  ohp: [[[3, 70.5, 8]], [[3, 73.5, 8]], [[3, 76.5, 6]], [[3, 70.5, 6]], [[4, 79.5, 5]], [[4, 82.5, 5]], [[4, 88, 4]], [[3, 73.5, 5]],
    [[3, 91, 3]], [[3, 94, 3]], [[3, 76.5, 3]], [[1, 94, 1], [1, 103, 1], [1, 112, 1]]],
};
// Friday squat (paused or high-bar), % of the squat training max: lighter than Monday, same light weeks (DECISIONS #66)
P12.fri = [[[3, 65, 5]], [[3, 67.5, 5]], [[3, 70, 4]], [[2, 62.5, 5]], [[4, 72.5, 3]], [[4, 75, 3]], [[3, 77.5, 3]], [[2, 67.5, 3]],
  [[3, 80, 2]], [[2, 80, 2]], [[2, 70, 2]], null];
// Saturday deadlift: light and beltless, % of the deadlift training max (the heavy one with a belt is Wednesday)
P12.dlLight = [[[3, 65, 5]], [[3, 67.5, 5]], [[3, 70, 4]], [[2, 60, 4]], [[3, 72.5, 3]], [[3, 75, 3]], [[3, 75, 3]], [[2, 65, 3]],
  [[3, 75, 2]], [[2, 70, 2]], [[2, 65, 2]], null];
const pctItem = (slot, groups, extra = {}) => ({
  slot, kind: 'pct', ...extra, sets: groups.flatMap(([n, pct, reps]) => S(n, pct, reps)),
});
const TEST = { note: 'Test: first attempt easy, second heavy but safe, third is the record attempt' };
// Main lifts only, laid on the Hybrid PPL week (DECISIONS #66): the rest of each session comes from the user's own
// program. Mon heavy squat, Tue heavy bench, Wed heavy deadlift (belt), Fri light paused / high-bar squat,
// Sat paused bench + press + light beltless deadlift.
const STRENGTH12 = P12.squat.map((_, w) => {
  if (w === 11) {
    return { days: [
      day('Mon · Squat test', [pctItem('squat', P12.squat[w], TEST)]),
      day('Tue · Bench test', [pctItem('bench', P12.bench[w], TEST)]),
      day('Wed · Deadlift test', [pctItem('dl', P12.dl[w], TEST)]),
      day('Sat · Press test', [pctItem('ohp', P12.ohp[w], { note: 'Only if the shoulder feels 0–2 out of 10' })]),
    ] };
  }
  return { days: [
    day('Mon · Squat', [pctItem('squat', P12.squat[w])]),
    day('Tue · Bench', [pctItem('bench', P12.bench[w])]),
    day('Wed · Heavy deadlift', [pctItem('dl', P12.dl[w])]),
    day('Fri · Light squat (paused or high-bar)', [pctItem('squat', P12.fri[w], { tags: ['paused'], note: 'Paused 2 s at the bottom, or high-bar' })]),
    day('Sat · Paused bench, press, light deadlift', [pctItem('bench', P12.pause[w], { tags: ['paused'], note: 'Paused: 1–2 s still on the chest' }),
      pctItem('ohp', P12.ohp[w]),
      pctItem('dl', P12.dlLight[w], { tags: ['beltless'], note: 'Light and beltless: fast reps, perfect positions' })]),
  ] };
});

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
  {
    id: 'bt-strength-12',
    base: 95, // the percentages are of a training max = 95 % of the real 1RM the user enters (DECISIONS #64)
    name: '12-Week Strength Period',
    desc: 'Main lifts only, laid on a five-day week: Mon squat, Tue bench, Wed heavy deadlift, Fri light paused or high-bar squat, Sat paused bench, overhead press and light beltless deadlift. Add your own accessories. Volume (weeks 1–4), heavier (5–8), heavy singles and a test in week 12; weeks 4, 8 and 11 are lighter. Enter your real 1RM for each lift; the block works from 95 % of it.',
    slots: [
      { key: 'squat', label: 'Squat (Mon and Fri)', ex: 'squat' },
      { key: 'bench', label: 'Bench (Tue and Sat)', ex: 'bench-press' },
      { key: 'dl', label: 'Deadlift (Wed and Sat)', ex: 'deadlift' },
      { key: 'ohp', label: 'Overhead press (Sat)', ex: 'overhead-press' },
    ],
    weeks: STRENGTH12,
  },
];

// The 12-week block used to have five days A–E with accessories; it is now main lifts only on a Mon–Sat week
// (DECISIONS #66). A running block is rebuilt from the template once, keeping its lifts, maxes, base and position
// (day indexes line up: A→Mon squat, B→Tue bench, C→Wed deadlift, D→Fri, E→Sat).
export const STRENGTH_LAYOUT = 2; // raise when the 12-week template's days change, so running blocks are rebuilt
export function upgradeStrengthBlocks() {
  const t = BLOCK_TEMPLATES.find((x) => x.id === 'bt-strength-12');
  let changed = false;
  for (const b of state.blocks || []) {
    if (b.templateId !== 'bt-strength-12' || (b.layout || 0) >= STRENGTH_LAYOUT) continue;
    const first = (b.weeks[0]?.days || []).map((d) => d.items.filter((i) => i.kind === 'pct').map((i) => i.ex));
    const lifts = {
      squat: first[0]?.[0] || 'squat',
      bench: first[1]?.[0] || 'bench-press',
      dl: first[2]?.[0] || 'deadlift',
      ohp: first[1]?.[1] || 'overhead-press',
    };
    b.weeks = t.weeks.map((w) => ({ days: w.days.map((d) => ({ name: d.name, items: d.items.map((it) => expandItem(it, lifts)) })) }));
    const w = Math.min(b.pos.w, b.weeks.length - 1);
    b.pos = { w, d: Math.min(b.pos.d, b.weeks[w].days.length - 1) };
    b.layout = STRENGTH_LAYOUT;
    changed = true;
  }
  if (changed) save();
}

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
  const extra = { ...(item.tags ? { tags: item.tags } : {}), ...(item.note ? { note: item.note } : {}) };
  const sets = Array.isArray(item.sets) ? item.sets
    : Array.from({ length: item.count || 1 }, (_, i) => ({
      pct: item.pct, reps: item.reps, ...(item.amrapLast && i === (item.count || 1) - 1 ? { amrap: true } : {}),
    }));
  return { ex, kind: 'pct', sets, ...extra };
}

// ---------- Running blocks ----------
// block: { id, name, templateId, base, maxes: { exId: kg }, weeks, pos: { w, d } (next day), marked: ['w-d'], started, since?, finished }
export function createBlock(template, { name, lifts, maxes, base }) {
  const block = {
    id: 'b-' + uid(),
    name: name || template.name,
    templateId: template.id,
    base,
    maxes,
    weeks: template.weeks.map((w) => ({ days: w.days.map((d) => ({ name: d.name, items: d.items.map((it) => expandItem(it, lifts)) })) })),
    pos: { w: 0, d: 0 },
    marked: [], // days done without logging them (see syncBlock)
    started: dateKey(),
    finished: false,
    rmBase: true, // maxes are real 1RMs (see migrate() in store.js)
    layout: STRENGTH_LAYOUT, // built from the current templates (see upgradeStrengthBlocks)
  };
  state.blocks.unshift(block);
  save();
  return block;
}

export function blockSize(b) {
  return b.weeks.reduce((n, w) => n + w.days.length, 0);
}

// ---------- Done days (DECISIONS #67) ----------
// A block day is done when its sets are in the log (entries carry block: { id, w, d }) or when the user marked it
// done without logging it (b.marked, e.g. skipped or trained elsewhere). The next day is the first one not done,
// so days can be added, done out of order, removed from the log or un-marked in any order.
const dayKey = (w, d) => `${w}-${d}`;

// Log dates per block day: { 'w-d': latest date }. Logs before a restart (b.since) don't count.
export function loggedDays(b) {
  const out = {};
  for (const [date, day] of Object.entries(state.log)) {
    if (b.since && date < b.since) continue;
    for (const e of day.entries) {
      if (e.block?.id !== b.id) continue;
      const k = dayKey(e.block.w, e.block.d);
      if (!out[k] || date > out[k]) out[k] = date;
    }
  }
  return out;
}

export const isMarked = (b, w, d) => (b.marked || []).includes(dayKey(w, d));

// Recompute the next day (b.pos) and b.finished from what is done
export function syncBlock(b, logged = loggedDays(b)) {
  if (!b.marked) { // first run after the update: days before the old position count as done
    b.marked = [];
    b.weeks.forEach((wk, w) => wk.days.forEach((_, d) => {
      const before = w < b.pos.w || (w === b.pos.w && d < b.pos.d) || (b.finished && w === b.pos.w && d === b.pos.d);
      if (before && !logged[dayKey(w, d)]) b.marked.push(dayKey(w, d));
    }));
  }
  let next = null;
  for (let w = 0; w < b.weeks.length && !next; w++) {
    for (let d = 0; d < b.weeks[w].days.length; d++) {
      if (!logged[dayKey(w, d)] && !isMarked(b, w, d)) { next = { w, d }; break; }
    }
  }
  const last = b.weeks.length - 1;
  b.finished = !next;
  b.pos = next || { w: last, d: b.weeks[last].days.length - 1 };
}

export function syncBlocks() {
  const before = JSON.stringify((state.blocks || []).map((b) => [b.pos, b.finished, b.marked]));
  for (const b of state.blocks || []) syncBlock(b);
  if (JSON.stringify(state.blocks.map((b) => [b.pos, b.finished, b.marked])) !== before) save();
}

export function blockDoneCount(b) {
  const logged = loggedDays(b);
  let n = 0;
  b.weeks.forEach((wk, w) => wk.days.forEach((_, d) => { if (logged[dayKey(w, d)] || isMarked(b, w, d)) n++; }));
  return n;
}

// Mark a day done (without logging it) or not done
export function markDay(b, w, d, done) {
  const k = dayKey(w, d);
  b.marked = (b.marked || []).filter((x) => x !== k);
  if (done) b.marked.push(k);
  syncBlock(b);
  save();
}

// Take a block day's sets out of the log again (all dates since the block started or restarted)
export function removeLoggedDay(b, w, d) {
  for (const [date, day] of Object.entries(state.log)) {
    if (b.since && date < b.since) continue;
    const before = day.entries.length;
    day.entries = day.entries.filter((e) => !(e.block?.id === b.id && e.block.w === w && e.block.d === d));
    if (day.entries.length === before) continue;
    if (!day.entries.length && day.title?.startsWith(b.name)) day.title = '';
    cleanupDay(date);
  }
  markDay(b, w, d, false);
}

// Start the block over: nothing counts as done until it is logged again
export function restartBlock(b) {
  b.since = dateKey();
  b.started = dateKey();
  b.marked = [];
  syncBlock(b);
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
    entry.sets = it.sets.map((s, i) => ({
      w: setWeight(b, it.ex, s),
      r: s.reps,
      t: null,
      d: null,
      done: false,
      lvl: s.pct >= 90 || s.amrap ? 'hard' : 'normal',
      pct: s.pct,
      ...(it.tags ? { tags: [...it.tags] } : {}),
      ...(it.note && i === 0 && !s.amrap ? { c: it.note } : {}), // note on the first set only
      ...(s.amrap ? { amrap: true, goal: s.reps, c: 'AMRAP – as many reps as possible' } : {}),
    }));
    // Warm-up sets in front of the main lift (DECISIONS #72); they are not counted as work
    if (state.settings.autoWarmup !== false) {
      const top = Math.max(0, ...entry.sets.map((s) => s.w || 0));
      entry.sets = [...warmupSets(it.ex, top), ...entry.sets];
    }
  }
  syncBlock(b);
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
