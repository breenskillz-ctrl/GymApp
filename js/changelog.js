// "What's new" (DECISIONS #47). Add an entry for every release, with the same number as CACHE in sw.js and ?v= in index.html.
// After an update the app shows the entries the user has not seen yet, once.
import { esc, icon, openModal } from './utils.js';

export const APP_VERSION = 40;
const SEEN = 'gymapp.seenVersion'; // per device, not part of backups

export const CHANGELOG = [
  { v: 40, date: '2026-10-07', items: [
    'Scanning barcodes works like in Makrologg: the camera opens right away and finds the barcode by itself, also on iPhone.',
    'In the Android app the scanner is built in (update the app to get it). A photo or typing the numbers still works too.',
  ] },
  { v: 39, date: '2026-10-07', items: [
    'New Food tab: log calories, protein, carbs and fat per meal, with daily goals, a goal calculator, water and the last 14 days.',
    'Add food from common foods, your own foods or Open Food Facts, by search or barcode.',
    'Import your food log from Makrologg under Settings & backup. Food days also show on the History cards.',
    'New, simple home page with three buttons: Food, Exercise and History. The bottom bar is now Home, Food, Exercise, History and Progress; Programs is in the side menu.',
  ] },
  { v: 38, date: '2026-10-04', items: [
    'Fix: swiping left or right to change day now works anywhere on the log, also in the empty space under the exercises.',
  ] },
  { v: 37, date: '2026-10-04', items: [
    'Fix: "Download backup" works more reliably on phones, also for big backups with photos.',
  ] },
  { v: 36, date: '2026-10-04', items: [
    'Android app: automatic daily backup to a folder you choose once, for example in Google Drive (Settings → Data).',
  ] },
  { v: 35, date: '2026-10-04', items: [
    'The app has a new name: Loadlog. Your workouts and settings are unchanged.',
    'Fix: a long "What\'s new" list now scrolls, so the button at the bottom can always be reached.',
  ] },
  { v: 34, date: '2026-10-03', items: [
    'Fewer set variants: Speed is now Tempo, and Backoff and Touch & go are gone. Sets that had them keep the word in their note.',
  ] },
  { v: 33, date: '2026-10-03', items: [
    'New set variant: Unilateral (one arm or one leg at a time). Old notes saying "unilateral" were tagged automatically.',
  ] },
  { v: 32, date: '2026-10-03', items: [
    'Set variants: mark a set as Paused, Tempo, Speed, Backoff, Beltless, Deficit, Close grip, Wide grip, Touch & go or Sumo with one tap in the set editor.',
    'Variants written in your old set notes (like "paused" or "belteløs") were turned into these tags automatically.',
    'The Records page shows your best set for each variant, and next time\'s suggested sets keep the variant.',
  ] },
  { v: 31, date: '2026-10-03', items: [
    'Fix: rack pulls that were logged as deadlifts (with "rack pull" in the set note) now have their own exercise, Rack Pull, so they no longer count as deadlift records.',
  ] },
  { v: 30, date: '2026-10-03', items: [
    'New Records page (side menu): all your personal records by muscle group, your latest PRs, and your best 1, 3, 5 and 10 rep maxes.',
  ] },
  { v: 29, date: '2026-10-03', items: [
    'The orange is gone: buttons, tabs and highlights now use the same blue as the plates in the app icon.',
    'The app icon now has four plates.',
    'An empty workout day now gives you a short push to get going (a new line every day) instead of "Empty Day".',
  ] },
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
