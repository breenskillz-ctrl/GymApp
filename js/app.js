// Startup, navigation between views and the side drawer.
import { load, state } from './store.js';
import { applyTextScale, closeTopModal, toast } from './utils.js';
import { initRestBar } from './timer.js';
import { initWakeLock } from './wakelock.js';
import { renderLog, enableSwipe } from './views/log.js';
import { renderPrograms } from './views/programs.js';
import { renderExercises } from './views/exercises.js';
import { renderProgress, openSettings, openBodyWeight } from './views/progress.js';
import { renderTimers } from './views/timers.js';
import { renderHistory } from './views/history.js';
import { openProgressPhotos } from './views/photos.js';

load();
applyTextScale(state.settings.textScale);

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
  blocks: (el) => renderPrograms(el, { tab: 'blocks' }), // old links: Blocks now lives under Programs
};

export function navigate(view) {
  current = view;
  document.body.dataset.screen = view;
  closeDrawer();
  drawer.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
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

const start = location.hash.slice(1);
navigate(VIEWS[start] ? start : 'history');

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  // Always fetch sw.js fresh, and reload once when a new version takes over so old and new files never mix
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) { reloaded = true; location.reload(); }
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
}
