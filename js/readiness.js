// Readiness (DECISIONS #71): last night's sleep, HRV, resting pulse and body battery from the watch, read from the coach
// sheet (Apps Script GET ?read=garmin), turned into a plain suggestion for today's main lift. Only shown when the sheet
// is connected and the sheet has watch data; the plan itself never changes unless the user taps "Apply".
import { save, getDay, warmupSets } from './store.js';
import { dateKey } from './utils.js';
import { sheetUrl } from './sync.js';

const CACHE_KEY = 'gymapp.garmin'; // per device: { at, rows }
const MAX_AGE = 30 * 60000;

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch { return null; }
}

// Rows newest first: { date, sleep, bb, rhr, hrv, sleepH, stress }
export async function garminRows(force = false) {
  const url = sheetUrl();
  if (!url) return [];
  const c = readCache();
  if (!force && c && Date.now() - c.at < MAX_AGE) return c.rows;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 15000);
    const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}read=garmin&pid=p0`, { signal: ctl.signal, redirect: 'follow' });
    clearTimeout(t);
    const json = await res.json();
    if (!json?.ok || !Array.isArray(json.rows)) return c?.rows || [];
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), rows: json.rows })); } catch { /* full */ }
    return json.rows;
  } catch {
    return c?.rows || [];
  }
}

export const cachedRows = () => readCache()?.rows || [];

const num = (v) => (v === '' || v == null || Number.isNaN(Number(String(v).replace(',', '.'))) ? null : Number(String(v).replace(',', '.')));
const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);

// { level: 'good'|'reduced'|'poor', pct, text, facts[] } for today, or null without data from last night
export function readiness(rows, today = dateKey()) {
  const r = rows.find((x) => x.date === today);
  if (!r) return null;
  const sleep = num(r.sleep);
  const sleepH = num(r.sleepH);
  const hrv = num(r.hrv);
  const rhr = num(r.rhr);
  const bb = num(r.bb);
  if (sleep == null && sleepH == null && hrv == null) return null;
  const prev = rows.filter((x) => x.date < today).slice(0, 7);
  const hrvAvg = avg(prev.map((x) => num(x.hrv)).filter((x) => x != null));
  const rhrAvg = avg(prev.map((x) => num(x.rhr)).filter((x) => x != null));

  let score = 0;
  const why = [];
  if (sleepH != null && sleepH < 5) { score += 2; why.push('short sleep'); } else if (sleepH != null && sleepH < 6.5) { score += 1; why.push('little sleep'); }
  if (sleep != null && sleep < 50) { score += 2; why.push('poor sleep score'); } else if (sleep != null && sleep < 65) score += 1;
  if (hrv != null && hrvAvg) {
    if (hrv < hrvAvg * 0.85) { score += 2; why.push('HRV well below normal'); } else if (hrv < hrvAvg * 0.92) { score += 1; why.push('HRV below normal'); }
  }
  if (rhr != null && rhrAvg && rhr > rhrAvg + 4) { score += 1; why.push('high resting pulse'); }
  if (bb != null && bb < 40) { score += 1; why.push('low body battery'); }

  const level = score >= 4 ? 'poor' : score >= 2 ? 'reduced' : 'good';
  const facts = [
    sleepH != null && `${sleepH} h sleep${sleep != null ? ` (${sleep})` : ''}`,
    hrv != null && `HRV ${hrv}${hrvAvg ? ` (avg ${Math.round(hrvAvg)})` : ''}`,
    rhr != null && `pulse ${rhr}`,
    bb != null && `battery ${bb}`,
  ].filter(Boolean);
  const text = level === 'good' ? 'Ready – train as planned'
    : level === 'reduced' ? `Take it a bit easier – main lift −5 %${why.length ? ` (${why[0]})` : ''}`
      : `Recovery is low – main lift −10 % and drop the last set${why.length ? ` (${why[0]})` : ''}`;
  return { level, pct: level === 'good' ? 0 : level === 'reduced' ? 5 : 10, text, facts };
}

// Lower today's planned block sets by pct (rounded to 2.5 kg); done sets are left alone. Returns the number changed.
export function applyReadiness(pct, key = dateKey()) {
  const day = getDay(key);
  if (!day || !pct) return 0;
  let n = 0;
  for (const e of day.entries) {
    if (!e.block) continue;
    for (const s of e.sets) {
      if (s.done || !s.w || s.lvl === 'warmup') continue;
      s.w = Math.max(0, Math.round((s.w * (1 - pct / 100)) / 2.5) * 2.5);
      n++;
    }
    // Warm-ups not done yet follow the new top weight
    if (!e.sets.some((s) => s.lvl === 'warmup' && s.done) && e.sets.some((s) => s.lvl === 'warmup')) {
      const work = e.sets.filter((s) => s.lvl !== 'warmup');
      e.sets = [...warmupSets(e.ex, Math.max(0, ...work.map((s) => s.w || 0))), ...work];
    }
  }
  if (n) { day.readiness = pct; save(); }
  return n;
}

export const readinessApplied = (key = dateKey()) => getDay(key)?.readiness || 0;
