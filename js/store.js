// Stores all user data in localStorage.
import { EXERCISES, PROGRAMS, GROUPS } from './data.js';
import { uid, e1rm } from './utils.js';

const KEY = 'gymapp.v1';

const defaults = () => ({
  customExercises: [],
  customPrograms: [],
  // { 'YYYY-MM-DD': { title, entries: [{ id, ex, sets: [{ w, r, t, d, done, lvl, c }] }] } }
  // title = the day comment. done = performed (planned sets have done: false). lvl = intensity level id.
  log: {},
  body: [], // [{ date, weight }]
  favorites: [], // exercise ids marked with ★
  settings: { unit: 'kg', rest: 90, sound: true, autoRest: true },
});

export let state = defaults();

// Old group names -> the 9 GymKeeper-style groups
const GROUP_MIGRATION = {
  Biceps: 'Arms', Triceps: 'Arms', Forearms: 'Arms', Glutes: 'Legs', Calves: 'Legs', 'Full body': 'Full-Body',
};

// Bring data saved by older versions up to date
function migrate() {
  for (const ex of state.customExercises) {
    ex.group = GROUP_MIGRATION[ex.group] || ex.group;
    if (ex.equip === 'Dumbbells') ex.equip = 'Dumbbell';
    if (!GROUPS.includes(ex.group)) ex.group = 'Other';
  }
  for (const day of Object.values(state.log)) {
    if (!day.title && day.note) day.title = day.note;
    delete day.note;
    for (const e of day.entries) {
      for (const st of e.sets) {
        if (st.done && !st.lvl) st.lvl = 'normal';
      }
    }
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      state = { ...defaults(), ...saved, settings: { ...defaults().settings, ...saved.settings } };
      migrate();
    }
  } catch {
    state = defaults();
  }
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Could not save', e);
  }
}

export function replaceState(next) {
  state = { ...defaults(), ...next, settings: { ...defaults().settings, ...next.settings } };
  migrate();
  save();
}

export function resetState() {
  state = defaults();
  save();
}

// ---------- Exercises ----------
// Built-ins in their curated order, then custom exercises
export function allExercises() {
  return [...EXERCISES, ...state.customExercises];
}

export function getExercise(id) {
  return state.customExercises.find((e) => e.id === id)
    || EXERCISES.find((e) => e.id === id)
    || { id, name: 'Unknown exercise', group: '', equip: '', type: 'wr', desc: '' };
}

export function saveExercise(ex) {
  if (!ex.id) ex.id = 'c-' + uid();
  const i = state.customExercises.findIndex((e) => e.id === ex.id);
  if (i >= 0) state.customExercises[i] = ex; else state.customExercises.push(ex);
  save();
  return ex;
}

export function deleteExercise(id) {
  state.customExercises = state.customExercises.filter((e) => e.id !== id);
  save();
}

// ---------- Programs ----------
export function allPrograms() {
  return [...state.customPrograms, ...PROGRAMS];
}

export function getProgram(id) {
  return allPrograms().find((p) => p.id === id);
}

export function saveProgram(p) {
  if (!p.id || p.builtin) p.id = 'cp-' + uid();
  p.builtin = false;
  p.workouts.forEach((w) => { if (!w.id) w.id = uid(); });
  const i = state.customPrograms.findIndex((x) => x.id === p.id);
  if (i >= 0) state.customPrograms[i] = p; else state.customPrograms.unshift(p);
  save();
  return p;
}

export function deleteProgram(id) {
  state.customPrograms = state.customPrograms.filter((p) => p.id !== id);
  save();
}

// ---------- Log ----------
export function getDay(key, create = false) {
  if (!state.log[key] && create) state.log[key] = { entries: [], title: '' };
  return state.log[key];
}

export function cleanupDay(key) {
  const d = state.log[key];
  if (d && !d.entries.length && !d.title) delete state.log[key];
}

export function dayHasWork(key) {
  const d = state.log[key];
  return !!(d && d.entries.length);
}

export const doneSets = (entry) => entry.sets.filter((s) => s.done);

export const setHasData = (s) => [s.w, s.r, s.t, s.d].some((v) => v != null && v !== '');

// All previous sessions with an exercise, newest first: [{ date, sets }]
export function history(exId, beforeKey = null) {
  const out = [];
  for (const date of Object.keys(state.log).sort().reverse()) {
    if (beforeKey && date >= beforeKey) continue;
    const sets = state.log[date].entries
      .filter((e) => e.ex === exId)
      .flatMap((e) => e.sets.filter((st) => st.done && setHasData(st)));
    if (sets.length) out.push({ date, sets });
  }
  return out;
}

export function lastSets(exId, beforeKey) {
  return history(exId, beforeKey)[0]?.sets || null;
}

// Create sets for a new exercise, pre-filled from last time (smart autofill)
export function makeSets(exId, beforeKey, target) {
  const prev = lastSets(exId, beforeKey);
  if (prev) return prev.map((s) => ({ w: s.w ?? null, r: s.r ?? null, t: s.t ?? null, d: s.d ?? null, done: false, lvl: s.lvl }));
  const ex = getExercise(exId);
  const n = target?.sets || 3;
  return Array.from({ length: n }, () => ({
    w: null,
    r: ex.type === 'wr' || ex.type === 'r' ? (target?.reps ?? null) : null,
    t: ex.type === 't' ? (target?.reps ?? null) : null,
    d: null,
    done: false,
  }));
}

// Add an exercise to a day. With `target` (from a program) or `withPlan` the card gets planned sets;
// otherwise it starts empty and sets are added with the set editor.
export function addEntry(key, exId, target, withPlan = !!target) {
  const day = getDay(key, true);
  const entry = { id: uid(), ex: exId, sets: withPlan ? makeSets(exId, key, target) : [] };
  day.entries.push(entry);
  save();
  return entry;
}

// ---------- Statistics ----------
export function setVolume(s) {
  return (s.w || 0) * (s.r || 0);
}

export function records(exId) {
  const ex = getExercise(exId);
  const rec = { maxW: null, maxR: null, best1rm: null, maxVol: null, maxT: null, maxD: null, sessions: 0 };
  for (const h of history(exId)) {
    rec.sessions++;
    let vol = 0;
    for (const s of h.sets) {
      if (s.w != null && (!rec.maxW || s.w > rec.maxW.v)) rec.maxW = { v: s.w, r: s.r, date: h.date };
      if (s.r != null && (!rec.maxR || s.r > rec.maxR.v)) rec.maxR = { v: s.r, date: h.date };
      if (s.t != null && (!rec.maxT || s.t > rec.maxT.v)) rec.maxT = { v: s.t, date: h.date };
      if (s.d != null && (!rec.maxD || s.d > rec.maxD.v)) rec.maxD = { v: s.d, date: h.date };
      const one = e1rm(s.w, s.r);
      if (one && (!rec.best1rm || one > rec.best1rm.v)) rec.best1rm = { v: one, date: h.date };
      vol += setVolume(s);
    }
    if (ex.type === 'wr' && vol && (!rec.maxVol || vol > rec.maxVol.v)) rec.maxVol = { v: vol, date: h.date };
  }
  return rec;
}

// Is this set a new personal record compared with previous days?
export function isPR(exId, key, set) {
  if (!set.w && !set.r && !set.t && !set.d) return false;
  const prev = history(exId, key);
  if (!prev.length) return false;
  const ex = getExercise(exId);
  const all = prev.flatMap((h) => h.sets);
  if (ex.type === 'wr') {
    const best = Math.max(...all.map((s) => e1rm(s.w, s.r)));
    return e1rm(set.w, set.r) > best;
  }
  if (ex.type === 'r') return (set.r || 0) > Math.max(...all.map((s) => s.r || 0));
  if (ex.type === 't') return (set.t || 0) > Math.max(...all.map((s) => s.t || 0));
  if (ex.type === 'dt') return (set.d || 0) > Math.max(...all.map((s) => s.d || 0));
  return false;
}

// ---------- Day and group helpers ----------
export function daySummary(day) {
  let sets = 0;
  let vol = 0;
  const groups = [];
  for (const e of day?.entries || []) {
    const g = getExercise(e.ex).group;
    if (g && !groups.includes(g)) groups.push(g);
    for (const st of doneSets(e)) {
      sets++;
      vol += setVolume(st);
    }
  }
  return { exs: day?.entries.length || 0, sets, vol, groups: GROUPS.filter((g) => groups.includes(g)) };
}

// Days since each muscle group was last trained (before or on `key`): { Chest: 3, ... }
export function daysSinceGroups(key) {
  const out = {};
  const today = new Date(key + 'T00:00:00');
  for (const date of Object.keys(state.log).sort().reverse()) {
    if (date > key) continue;
    for (const e of state.log[date].entries) {
      if (!doneSets(e).length) continue;
      const g = getExercise(e.ex).group;
      if (g && out[g] == null) out[g] = Math.round((today - new Date(date + 'T00:00:00')) / 86400000);
    }
  }
  return out;
}

// Most recently logged exercises, newest first
export function recentExercises(limit = 30) {
  const seen = [];
  for (const date of Object.keys(state.log).sort().reverse()) {
    for (const e of state.log[date].entries) {
      if (!seen.includes(e.ex)) seen.push(e.ex);
      if (seen.length >= limit) return seen;
    }
  }
  return seen;
}

// Date each exercise was last performed: { exId: 'YYYY-MM-DD' }
export function lastDoneMap() {
  const out = {};
  for (const date of Object.keys(state.log).sort()) {
    for (const e of state.log[date].entries) {
      if (doneSets(e).length) out[e.ex] = date;
    }
  }
  return out;
}

export const isFavorite = (id) => state.favorites.includes(id);

export function toggleFavorite(id) {
  state.favorites = isFavorite(id) ? state.favorites.filter((x) => x !== id) : [...state.favorites, id];
  save();
}
