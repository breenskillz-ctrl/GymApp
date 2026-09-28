// Import a diary exported from GymKeeper as CSV (DECISIONS #27).
// Columns: Date (dd.mm.yyyy), Type, Name, №, Val_1, Unit_1, Val_2, Unit_2, Comment. Row types:
//   📅 day (Comment "56 min | Chest/Arms"), 💬 day comment, 🏋️‍♂️ exercise (🔗 = linked in a superset),
//   🔹 set (Comment "Hard (paused)" = level + note), 📏 body measurement ("Weight").
import { state, save, allExercises } from './store.js';
import { uid } from './utils.js';

// GymKeeper names that differ from ours (lower case "Name · Equipment" → our exercise id)
const ALIASES = {
  'lat pull down · cable': 'lat-pulldown',
  'lat pull down (close grip) · cable': 'lat-pulldown',
  'straight arm lat pull down · cable': 'straight-arm-pulldown',
  'hammer strength press · machine': 'plate-loaded-press',
  'bent over row · t-bar': 't-bar-row',
  'single arm bent over row · dumbbell': 'db-row',
  'lying leg curl · machine': 'leg-curl',
  'pull up (close grip)': 'pull-ups',
  'standing calf raise': 'standing-calf-raise',
  'bulgarian split squat': 'bulgarian-split-squat',
  'step up': 'step-up',
  'stair climber': 'stair-climber',
  treadmill: 'treadmill',
};

const LEVEL_WORDS = { warmup: 'warmup', easy: 'easy', normal: 'normal', hard: 'hard', drop: 'drop' };
const EQUIP = ['Bodyweight', 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Smith Machine', 'Kettlebell', 'Band', 'Plate'];

// Split CSV text into rows of fields (handles quotes, "" escapes and a UTF-8 BOM)
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let f = '';
  let q = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; } else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(f);
      rows.push(row);
      row = [];
      f = '';
    } else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows.filter((r) => r.some((x) => x !== ''));
}

const label = (ex) => (ex.equip && !['Other', 'Bodyweight'].includes(ex.equip) ? `${ex.name} · ${ex.equip}` : ex.name);
const toKey = (d) => { const [dd, mm, yy] = d.split('.'); return `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`; };
const numOf = (v) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };

// "Hard (failure)" → { lvl: 'failure' }, "Normal (paused)" → { lvl: 'normal', c: 'paused' }
export function parseSetComment(text) {
  const m = /^\s*(warmup|easy|normal|hard|drop)?\s*(?:\((.*)\))?\s*$/i.exec(text || '');
  if (!m) return { lvl: 'normal', c: text.trim() };
  const lvl = LEVEL_WORDS[(m[1] || 'normal').toLowerCase()];
  const note = (m[2] || '').trim();
  if (/^failure$/i.test(note)) return { lvl: 'failure' };
  return note ? { lvl, c: note } : { lvl };
}

// Best guess of muscle group (and region) for an exercise we don't have
function guessGroup(name) {
  const n = name.toLowerCase();
  const rules = [
    [/steps|climber|treadmill|walk|run|bike|cycling/, 'Cardio'],
    [/tricep|oh tricep/, 'Arms', 'Triceps'],
    [/jefferson/, 'Back', 'Lower back'],
    [/wrist/, 'Arms', 'Forearms'],
    [/leg curl|nordic/, 'Legs', 'Hamstrings'],
    [/curl/, 'Arms', 'Biceps'],
    [/rear delt|reverse fly/, 'Shoulders', 'Posterior'],
    [/lateral raise|front raise/, 'Shoulders', 'Lateral'],
    [/shrug/, 'Back', 'Traps'],
    [/hyperextension|good morning/, 'Back', 'Lower back'],
    [/pulldown|pull down|pull up|chin/, 'Back', 'Lats'],
    [/row/, 'Back', 'Upper back'],
    [/calf/, 'Legs', 'Calves'],
    [/glute|hip thrust|kickback/, 'Legs', 'Glutes'],
    [/squat|leg press|lunge|step up|leg extension/, 'Legs', 'Quads'],
    [/rotation|twist|side bend|oblique/, 'Core', 'Obliques'],
    [/bird dog|crunch|plank|leg raise|sit up|ab /, 'Core', 'Abs'],
    [/overhead press|shoulder/, 'Shoulders', 'Anterior'],
    [/bench|chest|fly|pec|dip|push up/, 'Chest', 'Middle'],
  ];
  const hit = rules.find(([re]) => re.test(n));
  return hit ? { group: hit[1], sub: hit[2] || '' } : { group: 'Other', sub: '' };
}

/**
 * Read a GymKeeper CSV into days, without changing the app state.
 * Returns { days: { key: { title, duration, entries } }, body: [{ date, weight }], newExercises: [...], stats }.
 */
export function readGymKeeperCsv(text) {
  const rows = parseCsv(text);
  const head = rows.shift() || [];
  if (head[0]?.trim() !== 'Date' || head[1]?.trim() !== 'Type') throw new Error('Not a GymKeeper diary export');

  // Exercises by label, including custom ones created by an earlier import
  const byLabel = new Map();
  for (const ex of allExercises()) if (!byLabel.has(label(ex).toLowerCase())) byLabel.set(label(ex).toLowerCase(), ex.id);
  const created = new Map(); // label → new custom exercise
  const units = new Map(); // label → { kinds: Set, weighted }

  const days = {};
  const body = [];
  const current = {}; // day key → name → entry (sets follow their exercise row)
  let sets = 0;

  const exerciseFor = (name) => {
    const k = name.toLowerCase();
    if (ALIASES[k]) return ALIASES[k];
    if (byLabel.has(k)) return byLabel.get(k);
    if (!created.has(k)) {
      const [base, equipRaw] = name.split(' · ');
      const equip = EQUIP.find((e) => e.toLowerCase() === (equipRaw || '').toLowerCase()) || (equipRaw ? 'Other' : 'Bodyweight');
      created.set(k, {
        id: 'c-' + uid(), name: equipRaw && equip === 'Other' ? name : base.trim(), equip, type: 'wr',
        desc: 'Imported from GymKeeper', ...guessGroup(base),
      });
    }
    return created.get(k).id;
  };

  for (const r of rows) {
    const [date, type, name, , v1, u1, v2, u2, comment] = r;
    if (!date || !/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(date.trim())) continue;
    const key = toKey(date.trim());
    const day = days[key] || (days[key] = { title: '', entries: [] });
    const t = type.trim();
    if (t.startsWith('📅')) {
      const min = parseInt(comment, 10);
      if (min > 0) day.duration = min;
    } else if (t.startsWith('💬')) {
      day.title = day.title ? `${day.title} · ${comment.trim()}` : comment.trim();
    } else if (t.startsWith('📏')) {
      const w = numOf(v1);
      if (/weight/i.test(name) && w) body.push({ date: key, weight: w });
    } else if (t.startsWith('🏋')) {
      const entry = { id: uid(), ex: exerciseFor(name.trim()), sets: [] };
      day.entries.push(entry);
      (current[key] || (current[key] = {}))[name.trim()] = entry;
    } else if (t.startsWith('🔹')) {
      let entry = current[key]?.[name.trim()];
      if (!entry) { // a set without its exercise row: create the card
        entry = { id: uid(), ex: exerciseFor(name.trim()), sets: [] };
        day.entries.push(entry);
        (current[key] || (current[key] = {}))[name.trim()] = entry;
      }
      const a = numOf(v1);
      const b = numOf(v2);
      const set = { w: null, r: null, t: null, d: null, done: true, ...parseSetComment(comment) };
      const unitKey = `${u1}/${u2}`;
      if (u1 === 'sec') {
        set.t = a || null;
        if (u2 === 'km') set.d = b || null;
        else if (u2 === 'kg') set.w = b || null;
        else if (u2 === 'rep') set.r = b || null;
      } else {
        set.w = u1 === 'kg' && a ? a : null;
        set.r = u2 === 'rep' ? b : null;
      }
      entry.sets.push(set);
      sets++;
      const info = units.get(name.trim().toLowerCase()) || { kinds: new Set(), weighted: false };
      info.kinds.add(unitKey);
      if (set.w) info.weighted = true;
      units.set(name.trim().toLowerCase(), info);
    }
  }

  // Tracking type for new exercises from the units that were used
  for (const [k, ex] of created) {
    const info = units.get(k);
    if (!info) continue;
    if (ex.equip === 'Bodyweight' && info.weighted) ex.equip = 'Other'; // no equipment in the name, but weight was logged
    if (info.kinds.has('sec/km')) ex.type = 'dt';
    else if (info.kinds.has('sec/kg')) ex.type = 't';
    else if (info.kinds.has('sec/rep') || !info.weighted) ex.type = 'r';
  }

  // Drop empty days and cards
  for (const [key, day] of Object.entries(days)) {
    day.entries = day.entries.filter((e) => e.sets.length);
    if (!day.entries.length && !day.title) delete days[key];
  }
  const keys = Object.keys(days).sort();
  return {
    days,
    body,
    newExercises: [...created.values()].filter((ex) => keys.some((k) => days[k].entries.some((e) => e.ex === ex.id))),
    stats: { days: keys.length, sets, from: keys[0], to: keys[keys.length - 1] },
  };
}

// Put an imported diary into the app. mode 'skip' keeps days that already exist, 'replace' overwrites them.
export function applyImport(result, mode = 'skip') {
  let added = 0;
  for (const [key, day] of Object.entries(result.days)) {
    if (state.log[key]?.entries.length && mode === 'skip') continue;
    state.log[key] = day;
    added++;
  }
  const used = new Set(Object.values(state.log).flatMap((d) => d.entries.map((e) => e.ex)));
  for (const ex of result.newExercises) if (used.has(ex.id)) state.customExercises.push(ex);
  for (const b of result.body) {
    const cur = state.body.find((x) => x.date === b.date);
    if (cur) { if (!cur.weight) cur.weight = b.weight; } else state.body.push(b);
  }
  save();
  return added;
}
