// Lagring av all brukerdata i localStorage.
import { EXERCISES, PROGRAMS } from './data.js';
import { uid, e1rm } from './utils.js';

const KEY = 'gymapp.v1';

const defaults = () => ({
  customExercises: [],
  customPrograms: [],
  log: {}, // { 'YYYY-MM-DD': { entries: [{ id, ex, sets: [{ w, r, t, d, done }] }], note, title } }
  body: [], // [{ date, weight }]
  settings: { unit: 'kg', rest: 90, sound: true, autoRest: true },
});

export let state = defaults();

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      state = { ...defaults(), ...saved, settings: { ...defaults().settings, ...saved.settings } };
    }
  } catch {
    state = defaults();
  }
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Kunne ikke lagre', e);
  }
}

export function replaceState(next) {
  state = { ...defaults(), ...next, settings: { ...defaults().settings, ...next.settings } };
  save();
}

export function resetState() {
  state = defaults();
  save();
}

// ---------- Øvelser ----------
export function allExercises() {
  return [...EXERCISES, ...state.customExercises].sort((a, b) => a.name.localeCompare(b.name, 'nb'));
}

export function getExercise(id) {
  return state.customExercises.find((e) => e.id === id)
    || EXERCISES.find((e) => e.id === id)
    || { id, name: 'Ukjent øvelse', group: '', equip: '', type: 'wr', desc: '' };
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

// ---------- Programmer ----------
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

// ---------- Logg ----------
export function getDay(key, create = false) {
  if (!state.log[key] && create) state.log[key] = { entries: [], note: '', title: '' };
  return state.log[key];
}

export function cleanupDay(key) {
  const d = state.log[key];
  if (d && !d.entries.length && !d.note && !d.title) delete state.log[key];
}

export function dayHasWork(key) {
  const d = state.log[key];
  return !!(d && d.entries.length);
}

export const setHasData = (s) => [s.w, s.r, s.t, s.d].some((v) => v != null && v !== '');

// Alle tidligere økter med en øvelse, nyeste først: [{ date, sets }]
export function history(exId, beforeKey = null) {
  const out = [];
  for (const date of Object.keys(state.log).sort().reverse()) {
    if (beforeKey && date >= beforeKey) continue;
    const sets = state.log[date].entries
      .filter((e) => e.ex === exId)
      .flatMap((e) => e.sets.filter(setHasData));
    if (sets.length) out.push({ date, sets });
  }
  return out;
}

export function lastSets(exId, beforeKey) {
  return history(exId, beforeKey)[0]?.sets || null;
}

// Lag sett for en ny øvelse, fylt ut fra forrige gang (smart autofyll)
export function makeSets(exId, beforeKey, target) {
  const prev = lastSets(exId, beforeKey);
  if (prev) return prev.map((s) => ({ w: s.w ?? null, r: s.r ?? null, t: s.t ?? null, d: s.d ?? null, done: false }));
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

export function addEntry(key, exId, target) {
  const day = getDay(key, true);
  const entry = { id: uid(), ex: exId, sets: makeSets(exId, key, target) };
  day.entries.push(entry);
  save();
  return entry;
}

// ---------- Statistikk ----------
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

// Er dette settet en ny personlig rekord (tyngste vekt eller beste 1RM) sammenlignet med tidligere dager?
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
