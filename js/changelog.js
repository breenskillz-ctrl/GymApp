// "What's new" (DECISIONS #47). Add an entry for every release, with the same number as CACHE in sw.js and ?v= in index.html.
// After an update the app shows the entries the user has not seen yet, once.
import { esc, icon, openModal } from './utils.js';

export const APP_VERSION = 28;
const SEEN = 'gymapp.seenVersion'; // per device, not part of backups

export const CHANGELOG = [
  { v: 28, date: '2026-10-03', items: [
    'New app icon: five blue plates on a bar, with a stopper and a clip.',
    'This "What\'s new" note after each update. Find it again in the side menu.',
  ] },
  { v: 27, date: '2026-10-03', items: [
    'Profile: your name, and an optional username and password that lock the app on this phone.',
    'History starts with a greeting, your number of workouts and a pie chart of the muscle groups you train most.',
  ] },
  { v: 26, date: '2026-10-02', items: [
    'Calmer, smaller buttons and controls.',
    'Muscle groups are a plain list, and log cards no longer show the figure.',
  ] },
  { v: 25, date: '2026-09-29', items: [
    'Redrawn muscle figure, and a close-up of the worked muscles on each exercise page, with the equipment listed.',
  ] },
];

const fmt = (d) => new Date(d + 'T12:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export function openWhatsNew(since = 0) {
  const list = CHANGELOG.filter((e) => e.v > since);
  openModal(`
    <div class="modal-head"><h2>What's new</h2><button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>
    <div class="whatsnew">${(list.length ? list : CHANGELOG).map((e) => `<section>
      <h3>Version ${e.v} <span>${fmt(e.date)}</span></h3>
      <ul>${e.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>`).join('')}</div>
    <button class="btn primary block" data-close>Got it</button>`);
}

// Called after startup. A first install marks everything as seen; an update shows what changed since the last version seen.
export function checkWhatsNew(firstRun) {
  let seen = 0;
  try { seen = Number(localStorage.getItem(SEEN)) || 0; } catch { return; }
  if (seen >= APP_VERSION) return;
  try { localStorage.setItem(SEEN, String(APP_VERSION)); } catch { /* storage blocked */ }
  if (firstRun) return;
  openWhatsNew(seen || APP_VERSION - 1);
}
