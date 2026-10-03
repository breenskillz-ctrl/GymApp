// Stores all user data in localStorage.
import { EXERCISES, PROGRAMS, GROUPS, SET_TAGS, RETIRED_TAGS } from './data.js';
import { uid, e1rm } from './utils.js';

const KEY = 'gymapp.v1';

const defaults = () => ({
  customExercises: [],
  customPrograms: [],
  // { 'YYYY-MM-DD': { title, entries: [{ id, ex, sets: [{ w, r, t, d, done, lvl, c }] }] } }
  // title = the day comment. done = performed (planned sets have done: false). lvl = intensity level id.
  log: {},
  body: [], // [{ date, weight?, chest?, waist?, armL?, armR?, thighL?, thighR? }]
  favorites: [], // exercise ids marked with ★
  progression: {}, // per exercise: { min, max, inc, auto } – overrides the defaults in getProgression()
  blocks: [], // running and finished training blocks (js/blocks.js)
  blockTemplates: [], // the user's own block templates
  lastBackup: 0, // time of the last exported backup (weekly reminder)
  settings: { unit: 'kg', rest: 90, sound: true, autoRest: true, textScale: 100, keepAwake: true },
});

export let state = defaults();

// Old group names -> the 9 GymKeeper-style groups
const GROUP_MIGRATION = {
  Biceps: 'Arms', Triceps: 'Arms', Forearms: 'Arms', Glutes: 'Legs', Calves: 'Legs', 'Full body': 'Full-Body',
};

// Bring data saved by older versions up to date
// Rack pulls logged as deadlifts with a note ("rackpull", "høy rack pull" …) belong to their own exercise, so they don't count
// as deadlift records (DECISIONS #50). Moves those sets to a Rack Pull card right after the deadlift card.
const RACK_NOTE = /rack\s*-?\s*pull/i;
export function splitRackPulls(day) {
  for (let i = 0; i < day.entries.length; i++) {
    const e = day.entries[i];
    if (e.ex !== 'deadlift' || !e.sets.some((st) => RACK_NOTE.test(st.c || ''))) continue;
    const rack = e.sets.filter((st) => RACK_NOTE.test(st.c || ''));
    e.sets = e.sets.filter((st) => !rack.includes(st));
    day.entries.splice(i + 1, 0, { id: uid(), ex: 'rack-pull', sets: rack });
  }
  day.entries = day.entries.filter((e) => e.sets.length);
}

// Variants written in a set note ("paused", "3 sec paused", "speed", "belteløs" …) become set tags (DECISIONS #51).
// Sets with a retired tag (RETIRED_TAGS) get the new tag, or the word back in their note.
// The words are removed from the note; whatever else the note says stays.
export function tagSetsFromNotes(day) {
  for (const e of day.entries) {
    for (const st of e.sets) {
      if (st.tags?.some((t) => RETIRED_TAGS[t])) {
        const notes = [];
        const kept = new Set(st.tags.map((t) => {
          const r = RETIRED_TAGS[t];
          if (r?.note) notes.push(r.note);
          return r ? r.to : t;
        }));
        st.tags = SET_TAGS.map((t) => t.id).filter((id) => kept.has(id));
        if (notes.length) st.c = [st.c, ...notes].filter(Boolean).join(', ');
        if (!st.tags.length) delete st.tags;
        continue; // the note now holds the dropped tag's word on purpose
      }
      const found = st.c ? SET_TAGS.filter((t) => t.note.test(st.c)) : [];
      if (!found.length) continue;
      st.tags = [...new Set([...(st.tags || []), ...found.map((t) => t.id)])];
      for (const t of found) st.c = st.c.replace(t.note, ' ');
      st.c = st.c.replace(/\s*[,;+&]\s*$|^\s*[,;+&]\s*/g, '').replace(/\s+/g, ' ').trim();
      if (!st.c) delete st.c;
    }
  }
}

function migrate() {
  // Russian Squat and Smolov Jr. are written for % of the real 1RM; blocks started with the old 90 % default are corrected (DECISIONS #25)
  for (const b of state.blocks || []) {
    if (['bt-russian', 'bt-smolov-jr'].includes(b.templateId) && b.base === 90 && !b.baseChecked) b.base = 100;
    b.baseChecked = true;
  }
  // Body measurements: arm and thigh are now measured per side (DECISIONS #33); a single old value becomes the right side
  for (const b of state.body || []) {
    for (const k of ['arm', 'thigh']) {
      if (b[k] != null) { if (b[k + 'R'] == null) b[k + 'R'] = b[k]; delete b[k]; }
    }
  }
  for (const ex of state.customExercises) {
    ex.group = GROUP_MIGRATION[ex.group] || ex.group;
    if (ex.equip === 'Dumbbells') ex.equip = 'Dumbbell';
    if (!GROUPS.includes(ex.group)) ex.group = 'Other';
  }
  for (const day of Object.values(state.log)) {
    splitRackPulls(day);
    tagSetsFromNotes(day);
    if (!day.title && day.note) day.title = day.note;
    delete day.note;
    const emptied = new Set();
    for (const e of day.entries) {
      // Logged sets without any numbers (e.g. empty 0 × 0 sets from the first GymKeeper import) are dropped
      const n = e.sets.length;
      e.sets = e.sets.filter((st) => !st.done || [st.w, st.r, st.t, st.d].some(Boolean));
      if (n && !e.sets.length) emptied.add(e);
      for (const st of e.sets) {
        if (st.done && !st.lvl) st.lvl = 'normal';
      }
    }
    day.entries = day.entries.filter((e) => !emptied.has(e));
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      state = { ...defaults(), ...saved, settings: { ...defaults().settings, ...saved.settings } };
      migrate();
      save();
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
// ---------- Progression (DECISIONS #21) ----------
// Default rep ranges. The user's own: deadlift 1–5, bench press 1–12, triceps 10–30.
const DEFAULT_RANGES = { deadlift: [1, 5], 'bench-press': [1, 12] };

// Rep range (min–max), weight step and on/off for one exercise
export function getProgression(exId) {
  const ex = getExercise(exId);
  const lb = state.settings.unit === 'lb';
  const inc = lb ? 5 : ({ Dumbbell: 2, Kettlebell: 4 }[ex.equip] || 2.5);
  const [min, max] = DEFAULT_RANGES[exId]
    || (ex.group === 'Arms' && ex.sub === 'Triceps' ? [10, 30] : ex.type === 'r' ? [5, 20] : [6, 12]);
  return { min, max, inc, auto: true, ...state.progression[exId] };
}

export function setProgression(exId, p) {
  state.progression[exId] = p;
  save();
}

// Suggested next set with double progression:
// - below the top of the rep range: same weight, +1 rep
// - at or above the top: add weight and work out the reps for the same estimated 1RM, kept inside the range
//   (if last time was far above the range, the weight jumps to where the top of the range fits)
// Warm-up sets are repeated unchanged. Timed exercises get +5 s.
export function progressSet(s, ex) {
  const next = { w: s.w ?? null, r: s.r ?? null, t: s.t ?? null, d: s.d ?? null, done: false, lvl: s.lvl };
  if (s.tags?.length) next.tags = [...s.tags]; // a paused bench session suggests paused sets again
  next.last = { w: next.w, r: next.r, t: next.t, d: next.d }; // shown as "Last time" next to the suggestion
  const p = getProgression(ex.id);
  if (s.lvl === 'warmup' || !p.auto) return next;
  if (ex.type === 't') {
    if (next.t != null) next.t += 5;
    return next;
  }
  if (next.r == null) return next;
  if (next.r < p.max) {
    next.r += 1;
    return next;
  }
  if (!next.w) { // bodyweight without added weight: stay at the top of the range
    next.r = p.max;
    return next;
  }
  const oneRm = e1rm(next.w, next.r);
  const inc = p.inc || 2.5;
  const fits = Math.floor(oneRm / (1 + p.max / 30) / inc) * inc;
  const jump = fits > next.w + inc; // last time was far above the range
  const w = jump ? fits : next.w + inc;
  const reps = jump ? p.max : Math.min(p.max - 1, Math.round(30 * (oneRm / w - 1)));
  next.w = Math.round(w * 100) / 100;
  next.r = Math.max(p.min, reps);
  return next;
}

// Progression for a whole session (DECISIONS #38). If a working set at a weight ended in failure, no set at that weight
// progresses: every set there gets the best reps done at that weight last time (110×4, 110×4, 110×3 failure → 110×4 ×3).
// Once all of them reach it without failure, the normal +1 rep / more weight rules apply again.
export function progressSets(prev, ex) {
  const next = prev.map((s) => progressSet(s, ex));
  if (!['wr', 'r'].includes(ex.type) || !getProgression(ex.id).auto) return next;
  const groups = new Map(); // weight → indexes of working sets
  prev.forEach((s, i) => {
    if (s.lvl === 'warmup' || s.lvl === 'drop' || s.r == null) return;
    const k = s.w || 0;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(i);
  });
  for (const idx of groups.values()) {
    if (!idx.some((i) => prev[i].lvl === 'failure')) continue;
    const top = Math.max(...idx.map((i) => prev[i].r));
    for (const i of idx) Object.assign(next[i], { w: prev[i].w ?? null, r: top });
  }
  return next;
}

// Planned sets for an exercise: the last session's sets with progression, else the program target.
// Returns [] when there is neither (the card then starts empty and the set editor opens).
export function makeSets(exId, beforeKey, target) {
  const ex = getExercise(exId);
  const prev = lastSets(exId, beforeKey);
  if (prev) return progressSets(prev, ex);
  if (!target) return [];
  const n = target?.sets || 3;
  return Array.from({ length: n }, () => ({
    w: null,
    r: ex.type === 'wr' || ex.type === 'r' ? (target?.reps ?? null) : null,
    t: ex.type === 't' ? (target?.reps ?? null) : null,
    d: null,
    done: false,
  }));
}

// Add an exercise to a day. By default the card gets suggested sets from the last session (or the program target);
// pass withPlan = false for an empty card (e.g. when the caller copies sets itself).
export function addEntry(key, exId, target, withPlan = true) {
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

// Best estimated 1RM from all logged sets of an exercise (rounded to 0.5), or null
export function bestE1rmOf(exId) {
  const r = records(exId);
  return r.best1rm ? Math.round(r.best1rm.v * 2) / 2 : null;
}

// ---------- Rest time per exercise ----------
// Seconds of rest after a set of this exercise (exercise settings), else the default from Settings
export const getRest = (exId) => state.progression[exId]?.rest || state.settings.rest;

// ---------- Warm-up sets ----------
// Planned warm-up sets up to a working weight: (empty bar × 10), 50 % × 5, 70 % × 3, 85 % × 1, rounded to the weight step
export function warmupSets(exId, workW) {
  const ex = getExercise(exId);
  const bar = state.settings.unit === 'lb' ? 45 : 20;
  const step = getProgression(exId).inc || 2.5;
  const barbell = ['Barbell', 'Smith Machine'].includes(ex.equip);
  if (!workW || (barbell && workW <= bar)) return [];
  const out = barbell && workW > bar * 1.5 ? [{ w: bar, r: 10 }] : [];
  for (const [pct, reps] of [[0.5, 5], [0.7, 3], [0.85, 1]]) {
    const w = Math.round((workW * pct) / step) * step;
    const prev = out.length ? out[out.length - 1].w : 0;
    if (w > prev && w < workW && (!barbell || w > bar)) out.push({ w, r: reps });
  }
  return out.map((s) => ({ ...s, t: null, d: null, done: false, lvl: 'warmup' }));
}

// ---------- Workout duration ----------
// Minutes from the first to the last logged set of a day (sets carry an `at` timestamp), or null
// Imported days carry their duration in minutes instead.
export function dayDuration(day) {
  if (day?.duration) return day.duration;
  const times = (day?.entries || []).flatMap((e) => e.sets.filter((s) => s.done && s.at).map((s) => s.at));
  if (times.length < 2) return null;
  const min = Math.round((Math.max(...times) - Math.min(...times)) / 60000);
  return min > 0 ? min : null;
}

// ---------- Stalls and deloads (DECISIONS #30) ----------
// Best estimated 1RM of the working sets in each of the last sessions, newest first
function sessionBests(exId, beforeKey, n) {
  return history(exId, beforeKey).slice(0, n)
    .map((h) => Math.max(0, ...h.sets.filter((s) => s.lvl !== 'warmup').map((s) => e1rm(s.w, s.r) || 0)));
}

// True when the last three sessions of a weighted exercise did not beat the session before them
export function isStalled(exId, beforeKey) {
  if (getExercise(exId).type !== 'wr') return false;
  const b = sessionBests(exId, beforeKey, 4);
  return b.length === 4 && b[3] > 0 && Math.max(b[0], b[1], b[2]) <= b[3];
}

// Take 10 % off the planned working sets of a card (rounded to the weight step)
export function deloadEntry(entry) {
  const step = getProgression(entry.ex).inc || 2.5;
  for (const s of entry.sets) {
    if (s.done || s.lvl === 'warmup' || !s.w) continue;
    s.w = Math.round((s.w * 0.9) / step) * step;
    if (s.last?.r != null) s.r = s.last.r;
  }
  entry.deload = true;
  save();
}
