// History: earlier workouts as compact cards, newest first (DECISIONS #36). The app opens here.
import {
  state, save, getExercise, dayHasWork, daySummary, dayDuration, isPR, getDay,
} from '../store.js';
import {
  esc, icon, dateKey, fmtDate, fmtNum, e1rm, MONTHS, parseKey, go, menuDialog, confirmDialog, toast,
} from '../utils.js';
import { logState, copyToToday, openCalendar } from './log.js';
import { setText } from './exercises.js';
import { exLabel } from './seteditor.js';

const PAGE = 25;

// The set that best shows the day's performance: highest estimated 1RM, most reps, longest time or distance
function bestSet(ex, sets) {
  const work = sets.filter((s) => s.lvl !== 'warmup');
  const pool = work.length ? work : sets;
  const score = (s) => (ex.type === 'wr' ? e1rm(s.w, s.r) || s.w || 0 : ex.type === 'r' ? s.r || 0 : ex.type === 't' ? s.t || 0 : s.d || s.t || 0);
  return pool.reduce((a, b) => (score(b) > score(a) ? b : a), pool[0]);
}

function title(day) {
  if (day.title) return day.title;
  const first = Math.min(...day.entries.flatMap((e) => e.sets.filter((s) => s.at).map((s) => s.at)));
  if (!Number.isFinite(first)) return 'Workout';
  const h = new Date(first).getHours();
  return h < 12 ? 'Morning Workout' : h < 17 ? 'Afternoon Workout' : 'Evening Workout';
}

const fmtDuration = (min) => (min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`);

function cardHtml(key) {
  const day = getDay(key);
  const sum = daySummary(day);
  const mins = dayDuration(day);
  const u = state.settings.unit;
  let prs = 0;
  const rows = day.entries.map((e) => {
    const done = e.sets.filter((s) => s.done && [s.w, s.r, s.t, s.d].some(Boolean));
    if (!done.length) return '';
    const ex = getExercise(e.ex);
    const best = bestSet(ex, done);
    if (isPR(e.ex, key, best)) prs++;
    return `<div class="h-row"><span class="h-ex">${done.length} × ${esc(exLabel(ex))}</span><span class="h-best">${esc(ex.type === 'wr' && !best.w ? `${best.r} reps` : setText(ex, best))}</span></div>`;
  }).join('');
  return `<article class="h-card" data-day="${key}">
    <div class="h-head">
      <div class="grow"><h3>${esc(title(day))}</h3><div class="sub">${fmtDate(key)}</div></div>
      <button class="icon-btn h-more" data-more="${key}" aria-label="Workout menu">${icon('more')}</button>
    </div>
    <div class="h-stats">
      ${mins ? `<span>${icon('timer')}${fmtDuration(mins)}</span>` : ''}
      ${sum.vol ? `<span>${icon('dumbbell')}${fmtNum(sum.vol, 0)} ${u}</span>` : `<span>${icon('check')}${sum.sets} sets</span>`}
      <span class="${prs ? 'gold' : ''}">${icon('trophy')}${prs} PR${prs === 1 ? '' : 's'}</span>
    </div>
    <div class="h-table"><div class="h-row h-th"><span>Exercise</span><span>Best set</span></div>${rows}</div>
  </article>`;
}

export function renderHistory(root) {
  const days = Object.keys(state.log).filter(dayHasWork).sort().reverse();
  const today = dateKey();
  const hasToday = dayHasWork(today);
  let shown = 0;
  let lastMonth = '';

  root.innerHTML = `
    <header class="topbar">
      <button class="icon-btn" data-open-drawer aria-label="Menu">${icon('menu')}</button>
      <h1 class="topbar-title">History</h1>
      <div class="topbar-actions"><button class="icon-btn" data-act="calendar" aria-label="Calendar">${icon('calendar')}</button></div>
    </header>
    <div class="h-list">${days.length ? '' : `<div class="empty-day"><h2>No workouts yet</h2>
      <p class="muted">Tap "Start workout" to log your first one.</p></div>`}</div>
    <div class="h-more-sentinel"></div>
    <div class="fab-wrap"><button class="fab-ext" data-act="start">${icon('plus')}${hasToday ? 'Continue workout' : 'Start workout'}</button></div>`;

  const list = root.querySelector('.h-list');
  const more = () => {
    const next = days.slice(shown, shown + PAGE);
    shown += next.length;
    list.insertAdjacentHTML('beforeend', next.map((k) => {
      const d = parseKey(k);
      const m = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      const head = m !== lastMonth ? `<h2 class="h-month">${m}</h2>` : '';
      lastMonth = m;
      return head + cardHtml(k);
    }).join(''));
  };
  more();
  // Load older workouts as the list scrolls
  const sentinel = root.querySelector('.h-more-sentinel');
  const io = new IntersectionObserver((es) => {
    if (!document.body.contains(sentinel)) { io.disconnect(); return; }
    if (es.some((x) => x.isIntersecting) && shown < days.length) more();
  }, { rootMargin: '600px' });
  io.observe(sentinel);

  const open = (key) => { logState.date = key; go('log'); };

  root.onclick = async (e) => {
    const m = e.target.closest('[data-more]');
    if (m) {
      const key = m.dataset.more;
      const items = [{ value: 'open', label: 'Open workout', icon: 'edit' }];
      if (key !== today) items.push({ value: 'copy', label: 'Repeat today', icon: 'copy' });
      items.push({ value: 'del', label: 'Delete workout', icon: 'trash', danger: true });
      const v = await menuDialog(fmtDate(key), items);
      if (v === 'open') open(key);
      if (v === 'copy') { copyToToday(key); open(today); toast('Copied to today – tap a set to log it'); }
      if (v === 'del' && await confirmDialog(`Delete the workout from ${fmtDate(key)}?`)) {
        delete state.log[key];
        save();
        renderHistory(root);
      }
      return;
    }
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'start') return open(today);
    if (a === 'calendar') return openCalendar();
    const card = e.target.closest('[data-day]');
    if (card) open(card.dataset.day);
  };
}
