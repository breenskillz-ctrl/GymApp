// Oppstart og navigasjon mellom fanene.
import { load } from './store.js';
import { initRestBar } from './timer.js';
import { renderLog, enableSwipe } from './views/log.js';
import { renderPrograms } from './views/programs.js';
import { renderExercises } from './views/exercises.js';
import { renderProgress } from './views/progress.js';
import { renderTimers } from './views/timers.js';

load();

const main = document.getElementById('main');
const nav = document.getElementById('nav');
let current = 'log';

const VIEWS = {
  log: renderLog,
  programs: (el) => renderPrograms(el, navigate),
  exercises: renderExercises,
  progress: renderProgress,
  timers: renderTimers,
};

export function navigate(view) {
  current = view;
  nav.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  main.onclick = main.oninput = main.onchange = main.onfocusin = null;
  VIEWS[view](main);
  main.scrollTop = 0;
  window.scrollTo(0, 0);
  if (location.hash !== `#${view}`) history.replaceState(null, '', `#${view}`);
}

nav.addEventListener('click', (e) => {
  const b = e.target.closest('[data-view]');
  if (b) navigate(b.dataset.view);
});

enableSwipe(main, () => current === 'log');
initRestBar();

// Tegn grafer på nytt når skjermstørrelsen endres
let resizeT;
window.addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => { if (current === 'progress') navigate('progress'); }, 250);
});

const start = location.hash.slice(1);
navigate(VIEWS[start] ? start : 'log');

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
