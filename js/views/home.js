// Home (start page, DECISIONS #57): a greeting and three big buttons – Exercise, Programs and History – each with today's status.
import { state, getDay, daySummary, dayHasWork } from '../store.js';
import { esc, icon, dateKey, fmtDate, go } from '../utils.js';
import { profileName, workoutCount } from '../profile.js';
import { logState } from './log.js';

export function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 22 ? 'Good evening' : 'Good night';
}

export function renderHome(root) {
  const today = dateKey();
  const name = profileName();
  const sum = daySummary(getDay(today));
  const days = Object.keys(state.log).filter(dayHasWork).sort();
  const last = days.filter((k) => k < today).pop();
  const n = workoutCount();

  const exercise = sum.sets
    ? `Today: ${sum.exs} exercise${sum.exs === 1 ? '' : 's'} · ${sum.sets} set${sum.sets === 1 ? '' : 's'}`
    : sum.exs ? `Today: ${sum.exs} exercise${sum.exs === 1 ? '' : 's'} planned` : 'Start today’s workout';
  const block = (state.blocks || []).find((x) => !x.finished);
  const programs = block ? `Active block: ${block.name}` : 'Your programs and training blocks';
  const history = n ? `${n} workout${n === 1 ? '' : 's'}${last ? ` · last ${fmtDate(last, false)}` : ''}` : 'Your workouts show up here';

  root.innerHTML = `
    <header class="topbar">
      <button class="icon-btn" data-open-drawer aria-label="Menu">${icon('menu')}</button>
      <h1 class="topbar-title">Loadlog</h1>
    </header>
    <section class="home-hello">
      <div class="hello-greet">${greeting()}</div>
      <h2 class="hello-title">Are you ready to grind${name ? `, <span>${esc(name)}</span>` : ''}?</h2>
    </section>
    <nav class="home-btns" aria-label="Go to">
      <button class="home-btn" data-go="exercise">${icon('dumbbell')}<span><b>Exercise</b><small>${esc(exercise)}</small></span>${icon('right')}</button>
      <button class="home-btn" data-go="programs">${icon('flex')}<span><b>Programs</b><small>${esc(programs)}</small></span>${icon('right')}</button>
      <button class="home-btn" data-go="history">${icon('history')}<span><b>History</b><small>${esc(history)}</small></span>${icon('right')}</button>
    </nav>`;

  root.onclick = (e) => {
    const b = e.target.closest('[data-go]');
    if (!b) return;
    if (b.dataset.go === 'exercise') { logState.date = today; go('log'); }
    if (b.dataset.go === 'programs') go('programs');
    if (b.dataset.go === 'history') go('history');
  };
}
