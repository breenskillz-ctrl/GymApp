// Startup, navigation between views and the side drawer.
import { load, state } from './store.js';
import { applyTextScale, closeTopModal, toast, dateKey } from './utils.js';
import { initRestBar } from './timer.js';
import { initWakeLock } from './wakelock.js';
import { renderLog, enableSwipe, goToDate } from './views/log.js';
import { renderPrograms } from './views/programs.js';
import { renderExercises } from './views/exercises.js';
import { renderProgress, openSettings, openBodyWeight } from './views/progress.js';
import { renderTimers } from './views/timers.js';
import { renderHistory } from './views/history.js';
import { renderRecords } from './views/records.js';
import { openProgressPhotos } from './views/photos.js';
import { requestPersist } from './backup.js';
import { initProfile, openProfile } from './profile.js';
import { checkWhatsNew, openWhatsNew } from './changelog.js';

let firstRun = true;
try { firstRun = !localStorage.getItem('gymapp.v1'); } catch { /* storage blocked */ }
load();
applyTextScale(state.settings.textScale);
requestPersist(); // ask the browser not to clear our storage (DECISIONS #41)

const main = document.getElementById('main');
const drawer = document.getElementById('drawer');
let current = 'history';

const VIEWS = {
  history: renderHistory,
  log: renderLog,
  programs: renderPrograms,
  exercises: renderExercises,
  progress: renderProgress,
  timers: renderTimers,
  records: renderRecords,
  blocks: (el) => renderPrograms(el, { tab: 'blocks' }), // old links: Blocks now lives under Programs
};

const tabbar = document.getElementById('tabbar');
document.body.classList.add('has-tabbar');

export function navigate(view) {
  current = view;
  document.body.dataset.screen = view;
  closeDrawer();
  document.querySelectorAll('#drawer [data-view], #tabbar [data-view]').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  main.onclick = main.oninput = main.onchange = main.onfocusin = null;
  VIEWS[view](main);
  window.scrollTo(0, 0);
  if (location.hash !== `#${view}`) history.replaceState(history.state, '', `#${view}`);
  if (view !== 'history') ensureGuard();
}

// ---------- Phone back button (DECISIONS #37) ----------
// The app keeps one extra "guard" entry on top of its own history entry. Back pops the guard; we then close the drawer or the
// top dialog, or go to History, and put the guard back. On History with nothing open, the next back press leaves the app.
function ensureGuard() {
  if (history.state?.gym !== 'guard') history.pushState({ gym: 'guard' }, '', `#${current}`);
}
history.replaceState({ gym: 'root' }, '', location.hash);
window.addEventListener('popstate', () => {
  if (history.state?.gym === 'guard') return;
  if (drawer.classList.contains('open')) closeDrawer();
  else if (closeTopModal()) { /* closed a dialog */ } else if (current !== 'history') navigate('history');
  else { toast('Press back again to exit'); return; }
  ensureGuard();
});
window.addEventListener('gym:modal', ensureGuard);
// Chrome skips history entries made without a tap, so renew the guard whenever the user touches the app
document.addEventListener('pointerdown', ensureGuard, true);

// Views call this to go somewhere else without importing app.js (avoids circular imports)
window.addEventListener('gym:navigate', (e) => navigate(e.detail));

function openDrawer() {
  ensureGuard();
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
}

function closeDrawer() {
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
}

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-open-drawer]')) openDrawer();
});

drawer.addEventListener('click', (e) => {
  if (e.target === drawer) return closeDrawer();
  const v = e.target.closest('[data-view]');
  if (v) return navigate(v.dataset.view);
  const a = e.target.closest('[data-drawer-act]')?.dataset.drawerAct;
  if (!a) return;
  closeDrawer();
  const refresh = () => navigate(current);
  if (a === 'settings') openSettings(refresh);
  if (a === 'body') openBodyWeight(refresh);
  if (a === 'photos') openProgressPhotos();
  if (a === 'profile') openProfile(refresh);
  if (a === 'whatsnew') openWhatsNew();
});

// Bottom tab bar (DECISIONS #40). The Log tab always opens today.
tabbar.addEventListener('click', (e) => {
  const v = e.target.closest('[data-view]')?.dataset.view;
  if (v === 'log') goToDate(dateKey());
  else if (v) navigate(v);
});

enableSwipe(main, () => current === 'log');
initRestBar();
initWakeLock();

// Redraw charts when the screen size changes
let resizeT;
window.addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => { if (current === 'progress') navigate('progress'); }, 250);
});

// First start shows "Create profile"; with a password the lock screen comes first (DECISIONS #45)
const start = location.hash.slice(1);
initProfile().then(() => {
  navigate(VIEWS[start] ? start : 'history');
  checkWhatsNew(firstRun); // "What's new" after an update (DECISIONS #47)
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  // Always fetch sw.js fresh, and reload once when a new version takes over so old and new files never mix
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) { reloaded = true; location.reload(); }
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
}
