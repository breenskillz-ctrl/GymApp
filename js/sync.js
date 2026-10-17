// Coach sync (DECISIONS #60): sends workouts and body measurements to the user's Google Sheet through an
// Apps Script web app (the script lives in the Makrologg repo: data/coach/Kode.gs), so Claude can follow the training.
// Only records that changed since the last send go out; their fingerprints are kept per device in SYNC_KEY.
import { state, getExercise, allExercises } from './store.js';
import { e1rm } from './utils.js';
import { profileName } from './profile.js';

const SYNC_KEY = 'gymapp.sync'; // per device, not part of backups
const PID = 'p0'; // same person id as "Meg" in Makrologg, so both apps meet on one row per day
const sync = { busy: false, timer: null, err: null };
const listeners = new Set();

export const sheetUrl = () => String(state.settings.sheetUrl || '').trim();

function readState() {
  try {
    const s = JSON.parse(localStorage.getItem(SYNC_KEY) || '{}');
    s.sent = s.sent || {};
    return s;
  } catch {
    return { sent: {} };
  }
}
function writeState(s) {
  try { localStorage.setItem(SYNC_KEY, JSON.stringify(s)); } catch { /* storage full or blocked */ }
}

function hash(str) {
  let h = 7;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return h;
}

const r1 = (n) => Math.round(n * 10) / 10;

// Several exercises share a name (Bench Press with a barbell, dumbbells, Smith …). Add the equipment to those names
// so the sheet can tell them apart: "Incline Bench Press (Dumbbell)".
function nameOf(ex) {
  const shared = allExercises().filter((x) => x.name === ex.name).length > 1;
  return shared && ex.equip ? `${ex.name} (${ex.equip})` : ex.name;
}

// One record per logged day and one per body measurement, newest first
function records() {
  const person = profileName() || 'Me';
  const out = [];
  for (const [date, day] of Object.entries(state.log || {})) {
    const sets = [];
    let planned = 0;
    for (const e of day.entries || []) {
      const ex = getExercise(e.ex);
      e.sets.forEach((s) => {
        if (!s.done) { planned++; return; }
        sets.push([nameOf(ex), ex.group || '', s.w ?? '', s.r ?? '', s.t ?? '', s.d ?? '', s.lvl || '',
          (s.tags || []).join(' '), s.c || '', ex.type === 'wr' && s.w && s.r ? r1(e1rm(s.w, s.r)) : '']);
      });
    }
    if (!sets.length && !planned) continue;
    const times = (day.entries || []).flatMap((e) => e.sets.filter((s) => s.done && s.at).map((s) => s.at));
    const min = day.duration || (times.length > 1 ? Math.round((Math.max(...times) - Math.min(...times)) / 60000) : '');
    out.push({ t: 'workout', pid: PID, person, date, title: day.title || '', min, unit: state.settings.unit, planned, sets });
  }
  for (const b of state.body || []) {
    if (!b?.date) continue;
    const { date, ...rest } = b;
    out.push({ t: 'body', pid: PID, person, date, unit: state.settings.unit, ...rest });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

const recKey = (r) => `${r.t}|${r.pid}|${r.date}`;

export function pendingCount() {
  const st = readState();
  return records().filter((r) => st.sent[recKey(r)] !== hash(JSON.stringify(r))).length;
}

async function send(url, rec) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 20000);
  try {
    // text/plain keeps this a simple request (no CORS preflight); Apps Script answers with JSON
    const res = await fetch(url, { method: 'POST', body: JSON.stringify(rec), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, signal: ctl.signal, redirect: 'follow' });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) throw new Error(json?.error || `Reply ${res.status}`);
  } finally {
    clearTimeout(t);
  }
}

export async function runSync() {
  const url = sheetUrl();
  if (!url || sync.busy) return;
  if (!navigator.onLine) { sync.err = 'No connection'; notify(); return; }
  sync.busy = true;
  sync.err = null;
  notify();
  const st = readState();
  const todo = records().filter((r) => st.sent[recKey(r)] !== hash(JSON.stringify(r))).slice(0, 40);
  try {
    for (const r of todo) {
      await send(url, r);
      st.sent[recKey(r)] = hash(JSON.stringify(r));
      st.last = Date.now();
      writeState(st);
    }
  } catch (e) {
    sync.err = e?.name === 'AbortError' || e instanceof TypeError ? 'No connection' : (e?.message || 'Unknown error');
  }
  sync.busy = false;
  notify();
  if (sync.err) syncSoon(10 * 60000); // try again in 10 minutes
  else if (pendingCount()) syncSoon(1000);
}

export function syncSoon(ms = 5000) {
  if (!sheetUrl()) return;
  clearTimeout(sync.timer);
  sync.timer = setTimeout(runSync, ms);
}

export function resendAll() {
  const st = readState();
  st.sent = {};
  writeState(st);
  syncSoon(0);
}

export function syncStatus() {
  if (!sheetUrl()) return 'Not connected.';
  if (sync.busy) return 'Sending…';
  const st = readState();
  const last = st.last ? `Last sent ${new Date(st.last).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.` : 'Nothing sent yet.';
  if (sync.err) return `${sync.err}. ${last} Trying again later.`;
  const n = pendingCount();
  return `${last} ${n ? `${n} waiting.` : 'Everything is sent.'}`;
}

export function onSyncChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify() { listeners.forEach((fn) => { try { fn(); } catch { /* view is gone */ } }); }

export function initSync() {
  window.addEventListener('gymapp:saved', () => syncSoon());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncSoon(3000); });
  window.addEventListener('online', () => syncSoon(2000));
  syncSoon(3000);
}
