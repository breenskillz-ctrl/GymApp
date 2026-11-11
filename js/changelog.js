// "What's new" (DECISIONS #47). Add an entry for every release, with the same number as CACHE in sw.js and ?v= in index.html.
// After an update the app shows the entries the user has not seen yet, once.
import { esc, icon, openModal } from './utils.js';

export const APP_VERSION = 57;
const SEEN = 'gymapp.seenVersion'; // per device, not part of backups

export const CHANGELOG = [
  { v: 57, date: '2026-11-11', items: [
    'Plate colours match the gym: 5 kg white, 2.5 kg black.',
  ] },
  { v: 56, date: '2026-11-11', items: [
    'The plate line uses 20 kg as the heaviest plate. Gyms with 25 kg plates can choose that in Settings.',
  ] },
  { v: 55, date: '2026-11-11', items: [
    'Planned sets are white with a dashed edge, done sets are filled, and the next set has a blue ring.',
    'The main lift comes first on Home and in the log, with plates per side under it.',
    'Block lifts get warm-up sets automatically. Warm-ups don’t count as work.',
    'Rest is 3 minutes after squat, bench, deadlift, press and block sets, 90 seconds after the rest. Change it in Settings.',
    'Finished exercises fold into one line while you train. Tap to open them again.',
    'Superset two exercises from the ⋮ menu: the rest starts after both.',
    'Each exercise shows its rep range and when the weight goes up.',
    'A summary when the last set is done, compared with last time.',
    'Home shows where you are in the block, with the lighter weeks and the test week.',
    'History is one line per workout, grouped by week. Tap a line for details.',
    'Progress: plan against what you lifted in the block, and your top set per week.',
    'Trophies only for real records on the big barbell lifts (a heavier 5RM, 3RM …).',
  ] },
  { v: 54, date: '2026-11-10', items: [
    'Coach sync shows how many items are left while it sends.',
    'Your programs and blocks are sent to the coach sheet first, not last.',
  ] },
  { v: 53, date: '2026-11-10', items: [
    'Readiness on Home: last night’s sleep, HRV, resting pulse and body battery from your watch (via the coach sheet) give a simple advice for today’s main lift. If recovery is low, one tap lowers today’s planned block sets by 5 or 10 %.',
  ] },
  { v: 52, date: '2026-11-10', items: [
    'Home shows today’s workout – your block day and your own program day for this weekday – with one “Start today’s workout” button, plus this week and your latest record.',
    'Each exercise card shows what you did last time, and done sets are filled in with a tick.',
    'Set editor: all levels visible, your most used variants first (the rest under “More”), and last time’s set at the top.',
    'History only counts workouts with done sets and names them after the program day. Muscle groups are shown as one thin bar.',
    'Strength trend shows the main lifts; tap a lift to hide it or “+ Choose” to add one.',
    'Programs: your own programs are listed first with their days and an “Add today” button. The tab “Exercise” is now called “Log”.',
    'The backup reminder moved to Home and only shows after 14 days. Your programs, blocks and settings are sent to the coach sheet.',
  ] },
  { v: 51, date: '2026-11-06', items: [
    'New program: Hybrid PPL, a five-day split with legs twice a week and walking days. It holds the accessories and pairs with the 12-Week Strength Period block for the main lifts. Tap ⋮ → "Copy and customise" to make your own version.',
    'New exercises: One Arm Row and Single Arm Tricep Extension with a cable.',
  ] },
  { v: 50, date: '2026-11-03', items: [
    'New setting: "Plan first, tick off when done" (Settings). When it is on, sets you add are saved as a plan, and you tick off each set or the whole exercise with a check box when you have done it. Off by default, so nothing changes unless you turn it on.',
  ] },
  { v: 49, date: '2026-11-03', items: [
    'Blocks: do the days in any order. In the schedule, tap any day to add it to today, mark it done without logging it, or undo it. Done days show a tick and the date, and the next day is the first one you have not done. Removing a block exercise from a workout opens that day again.',
  ] },
  { v: 48, date: '2026-11-03', items: [
    '12-Week Strength Period is now main lifts only, on a Mon–Sat week: Mon squat, Tue bench, Wed heavy deadlift, Fri light paused or high-bar squat, Sat paused bench, overhead press and a light beltless deadlift. Add your own accessories from your program. A block you already started keeps its week, day and weights.',
  ] },
  { v: 47, date: '2026-10-31', items: [
    'Personal records now show what you actually lifted first: the heaviest lift with reps and date, and your best single (1RM) when you have done one. The estimated 1RM shows which set it came from.',
  ] },
  { v: 46, date: '2026-10-30', items: [
    '12-Week Strength Period: enter your real 1RM for each lift. The block works out the training weights from 95 % of it. A block you already started keeps exactly the same weights; it now shows your 1RM instead of the training max.',
  ] },
  { v: 45, date: '2026-10-24', items: [
    'Notes for a whole exercise: ⋮ on the exercise → Add note. Handy for "beltless" or "shoulder 0/10" without typing it on every set.',
    'Notes for the whole workout: ⋮ at the top → Add workout note. The old "comment" is now called the workout name.',
  ] },
  { v: 44, date: '2026-10-17', items: [
    'New block: 12-Week Strength Period. Squat, bench, deadlift and overhead press with five days A–E, lighter weeks and a test in week 12. Find it under Programs → Blocks.',
  ] },
  { v: 43, date: '2026-10-17', items: [
    'Coach sync: exercises that share a name now include the equipment, for example "Incline Bench Press (Dumbbell)", so barbell and dumbbell work no longer mix in your sheet.',
  ] },
  { v: 42, date: '2026-10-16', items: [
    'New in Settings: Coach (Google Sheets). Loadlog can send your workouts and body measurements to your own Google Sheet, so Claude can follow your training.',
  ] },
  { v: 41, date: '2026-10-16', items: [
    'The Food tab is gone again: Loadlog is about training only.',
    'Home now has Exercise, Programs and History. The bottom bar is Home, Exercise, Programs, History and Progress.',
  ] },
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
