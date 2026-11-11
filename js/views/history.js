// History: earlier workouts as compact cards, newest first (DECISIONS #36). The app opens here.
import {
  state, save, getExercise, dayHasWork, dayDone, daySummary, dayDuration, isPR, getDay, isBigLift,
} from '../store.js';
import { workoutName, todayPlan, startToday } from '../today.js';
import {
  esc, icon, dateKey, fmtDate, fmtNum, e1rm, MONTHS, parseKey, go, menuDialog, confirmDialog, toast, addDays,
} from '../utils.js';
import { logState, copyToToday, openCalendar } from './log.js';
import { setText } from './exercises.js';
import { exLabel } from './seteditor.js';
import { GROUPS, GROUP_COLORS } from '../data.js';
import { workoutCount } from '../profile.js';

const PAGE = 25;

// The set that best shows the day's performance: highest estimated 1RM, most reps, longest time or distance
function bestSet(ex, sets) {
  const work = sets.filter((s) => s.lvl !== 'warmup');
  const pool = work.length ? work : sets;
  const score = (s) => (ex.type === 'wr' ? e1rm(s.w, s.r) || s.w || 0 : ex.type === 'r' ? s.r || 0 : ex.type === 't' ? s.t || 0 : s.d || s.t || 0);
  return pool.reduce((a, b) => (score(b) > score(a) ? b : a), pool[0]);
}

// The program day or block day ("Tirsdag Chest+Tri"), else the time of day from the first logged set (DECISIONS #70)
function title(day) {
  const named = workoutName(day);
  if (named) return esc(named.replace(/^[A-Za-zæøåÆØÅ]{3,8}\s*·\s*/, ''));
  const first = Math.min(...day.entries.flatMap((e) => e.sets.filter((s) => s.at).map((s) => s.at)));
  if (!Number.isFinite(first)) return 'Workout';
  const h = new Date(first).getHours();
  return h < 12 ? 'Morning Workout' : h < 17 ? 'Afternoon Workout' : 'Evening Workout';
}

// ---------- Greeting and muscle-group mix (DECISIONS #45) ----------
let mixRange = 'all'; // 'all' | '30'

// Working sets (no warmups) per muscle group, as [group, sets] sorted largest first
function groupMix(range) {
  const from = range === '30' ? dateKey(new Date(Date.now() - 30 * 86400000)) : '';
  const count = {};
  for (const [k, day] of Object.entries(state.log)) {
    if (k < from) continue;
    for (const e of day.entries) {
      const n = e.sets.filter((s) => s.done && s.lvl !== 'warmup').length;
      if (!n) continue;
      const g = getExercise(e.ex).group || 'Other';
      count[g] = (count[g] || 0) + n;
    }
  }
  return GROUPS.filter((g) => count[g]).map((g) => [g, count[g]]).sort((a, b) => b[1] - a[1]);
}

function mixHtml() {
  const mix = groupMix(mixRange);
  const total = mix.reduce((a, [, n]) => a + n, 0);
  const pct = mix.map(([g, n]) => [g, (n / total) * 100]);
  const range = `<button class="text-btn hello-range" data-act="mix-range">${mixRange === 'all' ? 'All time' : 'Last 30 days'}</button>`;
  if (!total) return `<div class="mix"><div class="mix-head"><span>Muscle groups</span>${range}</div><p class="muted mix-empty">No sets logged yet.</p></div>`;
  return `<div class="mix">
    <div class="mix-head"><span>Muscle groups</span>${range}</div>
    <div class="mix-bar" aria-hidden="true">${pct.map(([g, p]) => `<i style="flex:${p};background:${GROUP_COLORS[g]}"></i>`).join('')}</div>
    <div class="mix-legend row">${pct.map(([g, p]) => `<span><i class="gdot" style="--c:${GROUP_COLORS[g]}"></i>${esc(g)} <b>${Math.round(p)}%</b></span>`).join('')}</div>
  </div>`;
}

function helloHtml() {
  const n = workoutCount();
  const week = weekCount();
  return `<section class="hello">
    <div class="hello-stats"><span><b>${n}</b> workout${n === 1 ? '' : 's'}</span><span><b>${week}</b> this week</span></div>
    ${mixHtml()}
  </section>`;
}

// Workouts since Monday
function weekCount() {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const from = dateKey(d);
  return Object.keys(state.log).filter((k) => k >= from && dayDone(k)).length;
}

const fmtDuration = (min) => (min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`);

// "3 × 5 · 155" / "155 × 5, 5, 4" / best set: the day's main lift in one line (DECISIONS #72)
function liftLine(ex, sets) {
  const w = sets.filter((s) => s.lvl !== 'warmup');
  if (!w.length) return '';
  if (ex.type === 'wr' && w[0].w && w.every((s) => s.w === w[0].w)) {
    return w.every((s) => s.r === w[0].r) ? `${w.length} × ${w[0].r} · ${fmtNum(w[0].w, 2)}` : `${fmtNum(w[0].w, 2)} × ${w.map((s) => s.r).join(', ')}`;
  }
  return setText(ex, bestSet(ex, w));
}

function mainOf(day) {
  const done = (e) => e.sets.filter((s) => s.done && s.lvl !== 'warmup' && [s.w, s.r, s.t, s.d].some(Boolean));
  const e = day.entries.find((x) => x.block && done(x).length) || day.entries.find((x) => isBigLift(x.ex) && done(x).length)
    || day.entries.find((x) => done(x).length);
  if (!e) return '';
  const ex = getExercise(e.ex);
  return `${ex.name} ${liftLine(ex, done(e))}`;
}

const open = new Set(); // rows opened to show details

function rowHtml(key) {
  const day = getDay(key);
  const mins = dayDuration(day);
  const d = parseKey(key);
  const prs = day.entries.reduce((n, e) => n + (e.sets.some((s) => s.done && isPR(e.ex, key, s)) ? 1 : 0), 0);
  const info = [mins && fmtDuration(mins), prs && `<span class="gold">${prs} record${prs === 1 ? '' : 's'}</span>`].filter(Boolean).join(' · ');
  return `<div class="hr ${open.has(key) ? 'open' : ''}" data-row="${key}">
    <button class="hr-main" data-toggle="${key}">
      <span class="hr-l"><span class="hr-date">${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span><b>${title(day)}</b></span>
      <span class="hr-r"><b>${esc(mainOf(day))}</b><span>${info}</span></span>
    </button>
    ${open.has(key) ? cardHtml(key) : ''}
  </div>`;
}

function cardHtml(key) {
  const day = getDay(key);
  const sum = daySummary(day);
  const mins = dayDuration(day);
  const u = state.settings.unit;
  let prs = 0;
  const rows = day.entries.map((e) => {
    const done = e.sets.filter((s) => s.done && s.lvl !== 'warmup' && [s.w, s.r, s.t, s.d].some(Boolean));
    if (!done.length) return '';
    const ex = getExercise(e.ex);
    const best = bestSet(ex, done);
    if (done.some((s) => isPR(e.ex, key, s))) prs++;
    return `<div class="h-row"><span class="h-ex">${done.length} × ${esc(exLabel(ex))}</span><span class="h-best">${esc(ex.type === 'wr' && !best.w ? `${best.r} reps` : setText(ex, best))}</span></div>`;
  }).join('');
  return `<article class="h-card h-detail">
    <div class="h-head">
      <div class="grow">${day.title && !day.title.endsWith(workoutName(day) || '\u0000') ? `<div class="h-comment">${esc(day.title)}</div>` : ''}
        ${day.note ? `<div class="h-comment">${esc(day.note)}</div>` : ''}</div>
      <button class="icon-btn h-more" data-more="${key}" aria-label="Workout menu">${icon('more')}</button>
    </div>
    <div class="h-stats">
      ${mins ? `<span>${icon('timer')}${fmtDuration(mins)}</span>` : ''}
      ${sum.vol ? `<span>${icon('dumbbell')}${fmtNum(sum.vol, 0)} ${u}</span>` : `<span>${icon('check')}${sum.sets} sets</span>`}
      ${prs ? `<span class="gold">${icon('trophy')}${prs} record${prs === 1 ? '' : 's'}</span>` : ''}
    </div>
    <div class="h-table"><div class="h-row h-th"><span>Exercise</span><span>Best set</span></div>${rows}</div>
    <button class="btn ghost block h-open" data-day="${key}">${icon('edit')} Open workout</button>
  </article>`;
}

export function renderHistory(root) {
  const days = Object.keys(state.log).filter(dayDone).sort().reverse(); // planned-only days are not workouts yet
  const today = dateKey();
  const hasToday = dayHasWork(today);
  const plan = hasToday ? null : todayPlan(today);
  const canStart = plan && (plan.bd || plan.workout);
  let shown = 0;
  let lastWeek = '';
  const mondayOf = (k) => addDays(k, -((parseKey(k).getDay() + 6) % 7));
  const thisMon = mondayOf(today);
  const perWeek = {};
  for (const k of days) perWeek[mondayOf(k)] = (perWeek[mondayOf(k)] || 0) + 1;
  const weekLabel = (mon) => {
    const n = perWeek[mon];
    const name = mon === thisMon ? 'This week' : mon === addDays(thisMon, -7) ? 'Last week'
      : `Week of ${parseKey(mon).getDate()} ${MONTHS[parseKey(mon).getMonth()].slice(0, 3)}${mon.slice(0, 4) !== today.slice(0, 4) ? ` ${mon.slice(0, 4)}` : ''}`;
    return `${name} · ${n} workout${n === 1 ? '' : 's'}`;
  };

  root.innerHTML = `
    <header class="topbar">
      <button class="icon-btn" data-open-drawer aria-label="Menu">${icon('menu')}</button>
      <h1 class="topbar-title">History</h1>
      <div class="topbar-actions"><button class="icon-btn" data-act="calendar" aria-label="Calendar">${icon('calendar')}</button></div>
    </header>
    ${helloHtml()}
    <div class="h-list">${days.length ? '' : `<div class="empty-day"><h2>No workouts yet</h2>
      <p class="muted">Tap "Start workout" to log your first one.</p></div>`}</div>
    <div class="h-more-sentinel"></div>
    <div class="fab-wrap"><button class="fab-ext" data-act="start">${icon('plus')}${hasToday ? 'Continue workout' : canStart ? 'Start today’s workout' : 'Start workout'}</button></div>`;

  const list = root.querySelector('.h-list');
  const more = () => {
    const next = days.slice(shown, shown + PAGE);
    shown += next.length;
    if (!next.length) return;
    // One group per week; a week that continues from the previous page gets a new group without a heading
    let html = '';
    let group = null;
    for (const k of next) {
      const mon = mondayOf(k);
      if (mon !== group) {
        html += `${group ? '</div>' : ''}${mon !== lastWeek ? `<h2 class="h-month">${weekLabel(mon)}</h2>` : ''}<div class="hr-list">`;
        group = mon;
        lastWeek = mon;
      }
      html += rowHtml(k);
    }
    list.insertAdjacentHTML('beforeend', `${html}</div>`);
  };
  more();
  // Load older workouts as the list scrolls
  const sentinel = root.querySelector('.h-more-sentinel');
  const io = new IntersectionObserver((es) => {
    if (!document.body.contains(sentinel)) { io.disconnect(); return; }
    if (es.some((x) => x.isIntersecting) && shown < days.length) more();
  }, { rootMargin: '600px' });
  io.observe(sentinel);

  const openDay = (key) => { logState.date = key; go('log'); };

  root.onclick = async (e) => {
    const m = e.target.closest('[data-more]');
    if (m) {
      const key = m.dataset.more;
      const items = [{ value: 'open', label: 'Open workout', icon: 'edit' }];
      if (key !== today) items.push({ value: 'copy', label: 'Repeat today', icon: 'copy' });
      items.push({ value: 'del', label: 'Delete workout', icon: 'trash', danger: true });
      const v = await menuDialog(fmtDate(key), items);
      if (v === 'open') openDay(key);
      if (v === 'copy') { copyToToday(key); openDay(today); toast('Copied to today – tap a set to log it'); }
      if (v === 'del' && await confirmDialog(`Delete the workout from ${fmtDate(key)}?`)) {
        delete state.log[key];
        save();
        renderHistory(root);
      }
      return;
    }
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'mix-range') {
      mixRange = mixRange === 'all' ? '30' : 'all';
      root.querySelector('.mix').outerHTML = mixHtml();
      return;
    }
    if (a === 'start') {
      if (canStart) { startToday(today); toast('Today’s workout is ready – tap a set to log it'); }
      return openDay(today);
    }
    if (a === 'calendar') return openCalendar();
    const t = e.target.closest('[data-toggle]');
    if (t) {
      const key = t.dataset.toggle;
      if (open.has(key)) open.delete(key); else open.add(key);
      t.closest('[data-row]').outerHTML = rowHtml(key);
      return;
    }
    const card = e.target.closest('[data-day]');
    if (card) openDay(card.dataset.day);
  };
}
