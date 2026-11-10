// Today's workout (DECISIONS #70): the running block's day and the user's own program day that belong to today's
// weekday, added with one tap ("Start today's workout"). Weekdays are read from the workout names ("Tue · Bench",
// "Tirsdag Chest+Tri", "Monday legs" …), in English or Norwegian.
import { state, save, getDay, addEntry } from './store.js';
import { dateKey, parseKey } from './utils.js';
import { addBlockWorkout, syncBlock, loggedDays, isMarked } from './blocks.js';

// Index = JS getDay() (0 = Sunday)
const WEEKDAYS = [
  ['sun', 'sunday', 'søn', 'søndag', 'sondag'],
  ['mon', 'monday', 'man', 'mandag'],
  ['tue', 'tues', 'tuesday', 'tir', 'tirsdag'],
  ['wed', 'wednesday', 'ons', 'onsdag'],
  ['thu', 'thur', 'thurs', 'thursday', 'tor', 'torsdag'],
  ['fri', 'friday', 'fre', 'fredag'],
  ['sat', 'saturday', 'lør', 'lor', 'lørdag', 'lordag'],
];

// Weekday (0–6) a workout name starts with, or null
export function weekdayOf(name) {
  const first = String(name || '').trim().toLowerCase().split(/[\s·.:,\-–/]+/)[0];
  const i = WEEKDAYS.findIndex((w) => w.includes(first));
  return i < 0 ? null : i;
}

const SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const weekdayShort = (i) => SHORT[i];

// The user's own program: the one picked with "Use as my program", else the first own program with weekday names
export function myProgram() {
  const own = state.customPrograms || [];
  return own.find((p) => p.id === state.settings.myProgram)
    || own.find((p) => p.workouts.some((w) => weekdayOf(w.name) != null)) || null;
}

const activeBlock = () => (state.blocks || []).find((b) => !b.finished) || null;

// The first open block day for this weekday, in the current block week (or the next one)
function blockDayFor(b, wd) {
  if (!b) return null;
  syncBlock(b);
  const logged = loggedDays(b);
  for (let w = b.pos.w; w < Math.min(b.weeks.length, b.pos.w + 2); w++) {
    for (let d = 0; d < b.weeks[w].days.length; d++) {
      if (weekdayOf(b.weeks[w].days[d].name) !== wd) continue;
      if (logged[`${w}-${d}`] || isMarked(b, w, d)) continue;
      return { w, d, day: b.weeks[w].days[d] };
    }
  }
  return null;
}

// What "Start today's workout" would add for a date: { block, bd, program, workout }
export function todayPlan(key = dateKey()) {
  const wd = parseKey(key).getDay();
  const block = activeBlock();
  const bd = blockDayFor(block, wd);
  const program = myProgram();
  const workout = program?.workouts.find((w) => weekdayOf(w.name) === wd) || null;
  return { block: bd ? block : null, bd, program: workout ? program : null, workout };
}

// The day's name for history and cards: the program workout, else the block day, else null
export function workoutName(day) {
  if (!day) return null;
  if (day.workout) return day.workout;
  const t = day.title || '';
  const dash = t.split(' – ');
  if (dash.length > 1) return dash.slice(1).join(' – ');
  const m = t.match(/^(.*) · W(\d+) D(\d+)$/);
  if (m) {
    const b = (state.blocks || []).find((x) => x.name === m[1]);
    const name = b?.weeks[m[2] - 1]?.days[m[3] - 1]?.name;
    if (name) return name.replace(/^[A-Za-zæøåÆØÅ]{3,8}\s*·\s*/, '');
  }
  return null;
}

// Add today's block day and program day (exercises already on the day are skipped). Returns what was added.
export function startToday(key = dateKey()) {
  const plan = todayPlan(key);
  if (plan.bd) addBlockWorkout(plan.block, key, plan.bd.w, plan.bd.d);
  if (plan.workout) {
    const day = getDay(key, true);
    const have = new Set(day.entries.map((e) => e.ex));
    plan.workout.exercises.forEach((w) => { if (!have.has(w.ex)) addEntry(key, w.ex, { sets: w.sets, reps: w.reps }); });
    day.workout = plan.workout.name;
    if (!day.title) day.title = `${plan.program.name} – ${plan.workout.name}`;
  }
  save();
  return plan;
}
