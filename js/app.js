// Startup, navigation between views and the side drawer.
import { load } from './store.js';
import { initRestBar } from './timer.js';
import { renderLog, enableSwipe } from './views/log.js';
import { renderPrograms } from './views/programs.js';
import { renderExercises } from './views/exercises.js';
import { renderProgress, openSettings, openBodyWeight } from './views/progress.js';
import { renderTimers } from './views/timers.js';
import { renderBlocks } from './views/blocks.js';

load();

const main = document.getElementById('main');
const drawer = document.getElementById('drawer');
let current = 'log';

const VIEWS = {
  log: renderLog,
  programs: renderPrograms,
  exercises: renderExercises,
  progress: renderProgress,
  timers: renderTimers,
  blocks: renderBlocks,
};

export function navigate(view) {
  current = view;
  closeDrawer();
  drawer.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  main.onclick = main.oninput = main.onchange = main.onfocusin = null;
  VIEWS[view](main);
  window.scrollTo(0, 0);
  if (location.hash !== `#${view}`) history.replaceState(null, '', `#${view}`);
}

// Views call this to go somewhere else without importing app.js (avoids circular imports)
window.addEventListener('gym:navigate', (e) => navigate(e.detail));

function openDrawer() {
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
});

enableSwipe(main, () => current === 'log');
initRestBar();

// Redraw charts when the screen size changes
let resizeT;
window.addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => { if (current === 'progress') navigate('progress'); }, 250);
});

const start = location.hash.slice(1);
navigate(VIEWS[start] ? start : 'log');

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  // Always fetch sw.js fresh, and reload once when a new version takes over so old and new files never mix
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) { reloaded = true; location.reload(); }
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
}
