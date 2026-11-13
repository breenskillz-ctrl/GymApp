// Day view: the workout log for one day.
import {
  state, save, getDay, cleanupDay, addEntry, getExercise, dayHasWork, isPR, daySummary, records, makeSets,
  warmupSets, restFor, dayDuration, isStalled, deloadEntry, setHasData, history, isMainLift, recordInfo,
  getProgression, isBigLift,
} from '../store.js';
import { todayPlan, startTodayFlow, workoutName } from '../today.js';
import { startRest } from '../timer.js';
import {
  esc, icon, openModal, confirmDialog, dateKey, addDays, fmtTime, fmtNum, toast,
  parseKey, MONTHS, pad, go, promptDialog, menuDialog,
} from '../utils.js';
import { exerciseThumb } from '../icons.js';
import { SET_TAGS } from '../data.js';
import { profileName } from '../profile.js';
import { openExercisePicker } from './picker.js';
import { openExerciseDetail, openProgressionDialog, progressionText, setText } from './exercises.js';
import { openSetEditor, levelColor, exLabel, suggestionDelta, platesPerSide } from './seteditor.js';
import { openAddSheet } from './addsheet.js';

export const logState = { date: dateKey() };

let rootEl;

export function goToDate(key) {
  logState.date = key;
  logState.folded = null;
  if (rootEl && document.body.dataset.screen === 'log') renderLog(rootEl);
  else go('log');
}

const rerender = () => renderLog(rootEl);

// Copy performed sets as planned (not yet done) sets
const asPlanned = (sets) => sets.filter((s) => s.done)
  .map((s) => ({ w: s.w ?? null, r: s.r ?? null, t: s.t ?? null, d: s.d ?? null, done: false, lvl: s.lvl }));

// Copy a day's exercises to today as planned sets
export function copyToToday(key) {
  const day = getDay(key);
  const today = dateKey();
  const target = getDay(today, true);
  if (!target.title && day.title) target.title = day.title;
  for (const x of day.entries) addEntry(today, x.ex, null, false).sets = asPlanned(x.sets);
  save();
}

// "Plan first, tick off when done" (settings.planFirst, DECISIONS #68): new sets are saved as a plan, and sets and whole
// exercises are ticked off with check boxes
const planMode = () => !!state.settings.planFirst;
const dataSets = (entry) => entry.sets.filter(setHasData);
const entryDone = (entry) => dataSets(entry).length > 0 && dataSets(entry).every((s) => s.done);

const tagLabel = (id) => SET_TAGS.find((t) => t.id === id)?.label || id;

// One set as a compact two-line column: "120 KG / 2 REP"
function setColHtml(ex, s, i, next = false) {
  const u = state.settings.unit;
  const val = (v, unit, fmt = (x) => fmtNum(x, 2)) => `<span class="v">${v == null ? '-' : fmt(v)}</span><span class="u">${unit}</span>`;
  let l1;
  let l2;
  if (ex.type === 't') {
    l1 = val(s.t, '', fmtTime);
    l2 = s.w ? val(s.w, u) : '';
  } else if (ex.type === 'dt') {
    l1 = val(s.d, 'km');
    l2 = val(s.t, '', fmtTime);
  } else {
    l1 = val(s.w, u);
    l2 = val(s.r, 'rep', String);
  }
  const pr = s.done && isPR(ex.id, logState.date, s);
  // Solid edge = done; dashed edge = suggested set, in the colour of the level it had last time (DECISIONS #44)
  const color = s.done ? levelColor(s.lvl || 'normal') : s.lvl ? levelColor(s.lvl) : null;
  return `<button class="set-col ${s.done ? 'done' : 'planned'} ${pr ? 'pr' : ''} ${s.lvl === 'warmup' ? 'wu' : ''} ${next ? 'next' : ''}" data-act="edit-set" data-set="${i}"
    ${color ? `style="--c:${color}"` : ''}>
    <span class="line">${l1}</span>${l2 ? `<span class="line">${l2}</span>` : ''}
    ${s.tags?.length ? `<span class="set-tags">${s.tags.map(tagLabel).join(' · ')}</span>` : ''}
    ${s.c ? `<span class="set-note">${esc(s.c)}</span>` : ''}
    ${suggestionDelta(s) ? `<span class="set-delta">${esc(suggestionDelta(s))}</span>` : ''}
    ${planMode() && setHasData(s) ? `<span class="set-tick ${s.done ? 'on' : ''}" data-act="tick-set" data-set="${i}" role="checkbox"
      aria-checked="${s.done}" aria-label="Set done">${icon('check')}</span>` : s.done ? `<span class="set-ok">${icon('check')}</span>` : ''}
  </button>`;
}

// "Last: 90 kg × 6, 6, 6 · 3 Nov" – the previous session with this exercise (DECISIONS #70)
export function lastText(ex, key) {
  const prev = history(ex.id, key)[0];
  if (!prev) return '';
  const work = prev.sets.filter((s) => s.lvl !== 'warmup');
  const sets = work.length ? work : prev.sets;
  const d = parseKey(prev.date);
  const when = `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
  if (ex.type === 'wr' && sets.every((s) => s.w === sets[0].w)) {
    return `${sets[0].w != null ? `${fmtNum(sets[0].w, 2)} ${state.settings.unit}` : 'BW'} × ${sets.map((s) => s.r ?? '–').join(', ')} · ${when}`;
  }
  if (ex.type === 'r' && sets[0].w && sets.every((s) => s.w === sets[0].w)) {
    return `+${fmtNum(sets[0].w, 2)} ${state.settings.unit} × ${sets.map((s) => s.r ?? '–').join(', ')} · ${when}`;
  }
  const parts = sets.slice(0, 4).map((s) => setText(ex, s).replace(` ${state.settings.unit} × `, '×'));
  return `${parts.join(', ')}${sets.length > 4 ? ' …' : ''} · ${when}`;
}

// Planned (suggested) sets that already have numbers and can be logged in one tap
const plannedSets = (entry) => entry.sets.filter((s) => !s.done && setHasData(s));

// Work sets ignore warm-ups; a card is finished when all its sets with numbers are done
const workSets = (entry) => entry.sets.filter((s) => s.lvl !== 'warmup' && setHasData(s));

// "Per side: 25 + 25 + 15 + 2.5" for the next work set of a barbell main lift (DECISIONS #72)
function platesLine(entry) {
  if (!isMainLift(entry.ex) && !entry.block) return '';
  if (getExercise(entry.ex).equip !== 'Barbell') return '';
  const s = entry.sets.find((x) => !x.done && x.lvl !== 'warmup' && x.w) || [...entry.sets].reverse().find((x) => x.lvl !== 'warmup' && x.w);
  const p = s && platesPerSide(s.w);
  if (!p || !p.used.length) return '';
  return `<div class="plates-line"><span class="pl-bars">${p.used.map((w) => `<i class="pl pl-${String(w).replace('.', '_')}"></i>`).join('')}</span>
    <span><b>${fmtNum(s.w, 2)}:</b> ${p.used.map((w) => fmtNum(w, 2)).join(' + ')} per side</span></div>`;
}

// Double progression shown as a rule (DECISIONS #72): "8–12 reps · at 3 × 12: +2.5 kg"
function ruleLine(entry, ex) {
  if (entry.block || ex.type !== 'wr' || isMainLift(entry.ex)) return '';
  const p = getProgression(entry.ex);
  if (!p.auto) return '';
  const work = workSets(entry);
  if (!work.length) return '';
  const u = state.settings.unit;
  const done = work.filter((s) => s.done);
  if (done.length === work.length && done.every((s) => (s.r || 0) >= p.max)) {
    return `<div class="rule-line up">${icon('up')} All sets at ${p.max} reps – next time +${fmtNum(p.inc, 2)} ${u}</div>`;
  }
  const low = Math.min(...work.map((s) => s.r || 0));
  const pct = Math.max(0, Math.min(100, ((low - p.min + 1) / (p.max - p.min + 1)) * 100));
  return `<div class="rule-line"><span>${p.min}–${p.max} reps</span><i class="rule-bar"><i style="width:${pct}%"></i></i>
    <span>at ${work.length} × ${p.max}: <b>+${fmtNum(p.inc, 2)} ${u}</b></span></div>`;
}

function entryHtml(entry, nextIdx = -1) {
  const ex = getExercise(entry.ex);
  const planned = plannedSets(entry).length;
  const stalled = !entry.block && !entry.deload && !entry.sets.some((s) => s.done) && isStalled(entry.ex, logState.date);
  const main = !!entry.block || isBigLift(entry.ex);
  const bl = entry.block && (state.blocks || []).find((b) => b.id === entry.block.id);
  const kicker = main ? `<div class="ex-kicker">Main lift${bl ? ` · block W${entry.block.w + 1} D${entry.block.d + 1}` : ''}</div>` : '';
  const idx = entry.sets.map((s, i) => i);
  const wu = idx.filter((i) => entry.sets[i].lvl === 'warmup');
  const work = idx.filter((i) => entry.sets[i].lvl !== 'warmup');
  const chips = (list) => list.map((i) => setColHtml(ex, entry.sets[i], i, i === nextIdx)).join('');
  const pct = entry.block && entry.sets.find((s) => s.lvl !== 'warmup' && s.pct)?.pct;
  const rows = wu.length
    ? `<div class="sets-lab">Warm-up</div><div class="sets wu-row">${chips(wu)}</div>
       <div class="sets-lab">Work sets${pct ? ` · ${fmtNum(pct, 1)} %` : ''}</div>`
    : '';
  return `
    <section class="ex-card ${main ? 'main-lift' : ''} ${planMode() ? 'plan-mode' : ''} ${planMode() && entryDone(entry) ? 'is-done' : ''}" data-entry="${entry.id}">
      <div class="ex-body">
        ${kicker}
        <div class="ex-head">
          <button class="ex-title" data-act="info">${esc(exLabel(ex))}</button>
          ${planMode() && dataSets(entry).length ? `<button class="ex-check ${entryDone(entry) ? 'on' : ''}" data-act="tick-entry" role="checkbox"
            aria-checked="${entryDone(entry)}" aria-label="Exercise done">${icon('check')}</button>` : ''}
          ${entry.sets.some((s) => s.done) ? `<button class="icon-btn fold-btn" data-act="fold" aria-label="Minimise">${icon('up')}</button>` : ''}
          <button class="icon-btn" data-act="entry-menu" aria-label="Menu">${icon('more')}</button>
        </div>
        ${entry.note ? `<button class="ex-note" data-act="entry-note">${esc(entry.note)}</button>` : ''}
        ${lastText(ex, logState.date) ? `<div class="ex-last">${icon('history')}<span>Last: <b>${esc(lastText(ex, logState.date))}</b></span></div>` : ''}
        ${rows}<div class="sets">${chips(work)}
          <button class="set-col add-chip" data-act="add-set" aria-label="Add set">${icon('plus')}<span>Set</span></button></div>
        ${platesLine(entry)}${ruleLine(entry, ex)}
        ${stalled ? `<div class="stall">No progress in 3 sessions.
          <button class="text-btn accent" data-act="deload">Deload −10&nbsp;%</button></div>` : ''}
        ${planned > 1 && !planMode() ? `<button class="log-all" data-act="log-all">${icon('check')} Log all ${planned} as suggested</button>` : ''}
      </div>
    </section>`;
}

// A card minimised with its ^ button: one line, tap to open it again (DECISIONS #72, #74)
function doneLineHtml(entry) {
  const ex = getExercise(entry.ex);
  const w = workSets(entry).filter((s) => s.done);
  const left = workSets(entry).length - w.length;
  const u = state.settings.unit;
  let txt = '';
  if (ex.type === 'wr' && w.length && w.every((s) => s.w === w[0].w)) {
    txt = `${w.every((s) => s.r === w[0].r) ? `${w.length} × ${w[0].r}` : `${w.map((s) => s.r).join(', ')}`} · ${w[0].w != null ? `${fmtNum(w[0].w, 2)} ${u}` : 'BW'}`;
  } else txt = w.slice(0, 4).map((s) => setText(ex, s)).join(', ');
  return `<button class="done-line ${left ? 'part' : ''}" data-entry="${entry.id}" data-act="expand"><i class="dl-ck">${left ? '' : icon('check')}</i>
    <span class="grow"><b>${esc(ex.name)}</b>${txt ? ` · ${esc(txt)}` : ''}${left ? ` <span class="dl-left">· ${left} left</span>` : ''}</span>${icon('down')}</button>`;
}

// Cards, with supersets wrapped together; cards the user minimised show as one line (DECISIONS #74)
function entriesHtml(entries) {
  const first = entries.find((e) => plannedSets(e).length && !logState.folded?.has(e.id));
  const nextOf = (e) => (e === first && !planMode() ? e.sets.findIndex((s) => !s.done && setHasData(s)) : -1);
  const card = (e) => (logState.folded?.has(e.id) ? doneLineHtml(e) : entryHtml(e, nextOf(e)));
  let out = '';
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (!e.ss) { out += card(e); continue; }
    let j = i;
    while (j + 1 < entries.length && entries[j + 1].ss === e.ss) j++;
    if (j === i) { out += card(e); continue; } // a lone superset member shows as a normal card
    out += `<div class="ss-group"><div class="ss-lab">Superset · rest after both</div>${entries.slice(i, j + 1).map(card).join('')}</div>`;
    i = j;
  }
  return out;
}

function dateLabel(key) {
  if (key === dateKey()) return 'Today';
  if (key === addDays(dateKey(), -1)) return 'Yesterday';
  const d = parseKey(key);
  const y = d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : '';
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}${y}`;
}

// Empty day: a motivating line for today, calmer text for past and future days (replaces "Empty Day zzz", 2026-10-03)
const PUSH_LINES = [
  ['The bar is loaded.', 'Are you?'],
  ['Today is a blank page.', 'Write a PR on it.'],
  ['Show up. Lift. Repeat.', 'Every set counts.'],
  ['Strong is built one set at a time.', 'Start with the first one.'],
  ['No zero days.', 'Even one exercise beats none.'],
  ['Small plates add up.', 'Add one today.'],
  ['Ready to grind{name}?', "Let's make today count."],
];

function emptyDayHtml(key) {
  const today = dateKey();
  let head;
  let sub;
  if (key < today) [head, sub] = ['Rest day', 'Recovery is part of the plan.'];
  else if (key > today) [head, sub] = ['Nothing planned yet', 'Add exercises now and they are ready when the day comes.'];
  else {
    const n = Math.floor(parseKey(key).getTime() / 86400000) % PUSH_LINES.length; // a new line each day
    const name = profileName();
    [head, sub] = PUSH_LINES[n].map((t) => t.replace('{name}', name ? `, ${name}` : ''));
  }
  const plan = key >= today ? todayPlan(key) : null;
  const can = plan && (plan.bd || plan.workout || plan.pick);
  return `<div class="empty-day log-empty"><h2>${esc(head)}</h2><p>${esc(sub)}</p>
    ${can ? `<button class="btn primary log-start" data-act="start-today">${icon('plus')} Start ${key === today ? 'today’s' : 'this day’s'} workout</button>
      <p class="muted log-start-sub">${esc([plan.bd?.day.name, plan.workout?.name, plan.pick && `a day from ${plan.pick.name}`].filter(Boolean).join(' + '))}</p>` : ''}</div>`;
}

// Minutes from the first done set: to now while the workout is going on today, else to the last set
function liveMinutes(day) {
  if (day?.duration) return day.duration;
  const times = (day?.entries || []).flatMap((e) => e.sets.filter((s) => s.done && s.at).map((s) => s.at));
  if (!times.length) return null;
  const going = logState.date === dateKey() && day.entries.some((e) => plannedSets(e).length);
  const end = going ? Date.now() : Math.max(...times);
  const m = Math.round((end - Math.min(...times)) / 60000);
  return m > 0 ? m : dayDuration(day);
}

const hm = (m) => (m >= 60 ? `${Math.floor(m / 60)}:${pad(m % 60)}` : String(m));
const tonnes = (v) => (state.settings.unit === 'kg' && v >= 1000 ? `${fmtNum(v / 1000, 1)} t` : fmtNum(v, 0));

// Records set on a day: the best new rep max per exercise
function dayRecords(key, day) {
  const out = [];
  for (const e of day?.entries || []) {
    let best = null;
    for (const s of e.sets) {
      if (!s.done) continue;
      const r = recordInfo(e.ex, key, s);
      if (r && (!best || s.w > best.set.w)) best = { ex: getExercise(e.ex), set: s, ...r };
    }
    if (best) out.push(best);
  }
  return out;
}

// Four numbers on top of the day (DECISIONS #72): time, sets done of planned, volume, records
function summaryTiles(day, sum, mins) {
  const total = (day?.entries || []).reduce((n, e) => n + workSets(e).length, 0);
  const recs = dayRecords(logState.date, day).length;
  return `<div class="day-tiles">
    <div><b>${mins ? hm(mins) : '–'}</b><span>${mins >= 60 ? 'time' : 'min'}</span></div>
    <div><b>${sum.sets}${total > sum.sets ? `/${total}` : ''}</b><span>sets</span></div>
    <div><b>${sum.vol ? tonnes(sum.vol) : '–'}</b><span>volume</span></div>
    <div><b class="${recs ? 'gold' : ''}">${recs}</b><span>record${recs === 1 ? '' : 's'}</span></div></div>`;
}

// After a set is logged: rerender, and when the last planned set of today is done, show the summary once (DECISIONS #72)
function afterLog() {
  rerender();
  const key = logState.date;
  const day = getDay(key);
  if (key !== dateKey() || !day || day.finished) return;
  if (day.entries.some((e) => plannedSets(e).length) || !day.entries.some((e) => workSets(e).some((s) => s.done))) return;
  day.finished = Date.now();
  save();
  setTimeout(() => openSummary(key), 350);
}

// The best work set of a card, to compare with last time
function topSet(ex, sets) {
  const w = sets.filter((s) => s.lvl !== 'warmup' && setHasData(s));
  if (!w.length) return null;
  return w.reduce((a, b) => ((b.w || 0) > (a.w || 0) || ((b.w || 0) === (a.w || 0) && (b.r || 0) > (a.r || 0)) ? b : a));
}

export function openSummary(key = logState.date) {
  const day = getDay(key);
  if (!day) return;
  const sum = daySummary(day);
  const mins = dayDuration(day);
  const recs = dayRecords(key, day);
  const u = state.settings.unit;
  const name = workoutName(day) || day.title || 'Workout';
  const d = parseKey(key);
  const block = day.entries.find((e) => e.block)?.block;
  const rows = day.entries.map((e) => {
    const ex = getExercise(e.ex);
    const now = topSet(ex, e.sets.filter((s) => s.done));
    if (!now) return '';
    const prev = history(e.ex, key)[0];
    const was = prev && topSet(ex, prev.sets);
    let delta = '<span class="muted">new</span>';
    if (was && (ex.type === 'wr' || ex.type === 'r')) {
      const dw = (now.w || 0) - (was.w || 0);
      const dr = (now.r || 0) - (was.r || 0);
      delta = dw ? `<span class="${dw > 0 ? 'up' : 'down'}">${dw > 0 ? '+' : '−'}${fmtNum(Math.abs(dw), 2)} ${u}</span>`
        : dr ? `<span class="${dr > 0 ? 'up' : 'down'}">${dr > 0 ? '+' : '−'}${Math.abs(dr)} rep</span>` : '<span class="muted">same</span>';
    } else if (was) delta = '<span class="muted">–</span>';
    return `<span>${esc(exLabel(ex))}</span><b>${esc(setText(ex, now))}</b>${delta}`;
  }).join('');
  openModal(`
    <div class="sum-sheet">
      <div class="sum-kick">Workout done</div>
      <h2 class="sum-title">${esc(name)}</h2>
      <p class="muted">${d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}${block ? ` · Week ${block.w + 1} Day ${block.d + 1}` : ''}</p>
      <div class="day-tiles"><div><b>${mins ? hm(mins) : '–'}</b><span>${mins >= 60 ? 'time' : 'min'}</span></div><div><b>${sum.sets}</b><span>sets</span></div>
        <div><b>${sum.vol ? tonnes(sum.vol) : '–'}</b><span>volume</span></div><div><b class="${recs.length ? 'gold' : ''}">${recs.length}</b><span>records</span></div></div>
      ${rows ? `<h3 class="sum-head">Compared with last time</h3><div class="sum-cmp">${rows}</div>` : ''}
      ${recs.length ? `<h3 class="sum-head">Record${recs.length === 1 ? '' : 's'}</h3>${recs.map((r) => `<p class="sum-rec"><span class="gold">${icon('trophy')}</span>
        ${esc(r.ex.name)} ${r.reps}RM · <b>${fmtNum(r.set.w, 2)} ${u} × ${r.set.r}</b>${r.old ? ` <span class="muted">(was ${fmtNum(r.old, 2)})</span>` : ''}</p>`).join('')}` : ''}
      <button class="btn primary block" data-close>Done</button>
      <button class="btn ghost block" data-note>${day.note ? 'Edit workout note' : 'Add a note for the coach'}</button>
    </div>`, {
    className: 'small',
    onMount(m, close) {
      m.querySelector('[data-close]').onclick = close;
      m.querySelector('[data-note]').onclick = () => { close(); editDayNote(); };
    },
  });
}

export function renderLog(root) {
  rootEl = root;
  const key = logState.date;
  const day = getDay(key);
  const entries = day?.entries || [];
  const sum = daySummary(day);
  const mins = liveMinutes(day);
  const isToday = key === dateKey();

  root.innerHTML = `
    <header class="topbar">
      <button class="icon-btn" data-open-drawer aria-label="Menu">${icon('menu')}</button>
      <div class="day-nav">
        <button class="icon-btn sm" data-act="prev-day" aria-label="Previous day">${icon('left')}</button>
        <button class="day-label ${isToday ? 'today' : ''}" data-act="calendar">${esc(dateLabel(key))}</button>
        <button class="icon-btn sm" data-act="next-day" aria-label="Next day">${icon('right')}</button>
      </div>
      ${entries.length ? `<button class="icon-btn" data-act="records" aria-label="Records">${icon('trophy')}</button>` : ''}
      <button class="icon-btn" data-act="timers" aria-label="Timers">${icon('timer')}</button>
      <button class="icon-btn" data-act="day-menu" aria-label="More">${icon('more')}</button>
    </header>
    ${entries.length ? `
      ${summaryTiles(day, sum, mins)}
      ${day.title ? `<button class="day-comment" data-act="comment">${esc(day.title)}</button>` : ''}
      ${day.note ? `<button class="day-note" data-act="day-note">${esc(day.note)}</button>` : ''}
      <div class="entries">${entriesHtml(entries)}</div>` : `
      ${day?.title ? `<button class="day-comment" data-act="comment">${esc(day.title)}</button>` : ''}
      ${day?.note ? `<button class="day-note" data-act="day-note">${esc(day.note)}</button>` : ''}
      ${emptyDayHtml(logState.date)}`}
    <div class="fab-wrap wide"><button class="add-bar" data-act="add">${icon('plus')}Add exercise</button></div>`;

  root.onclick = onClick;
}

function entryById(id) {
  return getDay(logState.date)?.entries.find((e) => e.id === id);
}

function onClick(e) {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const card = b.closest('[data-entry]');
  const entry = card && entryById(card.dataset.entry);
  const date = logState.date;

  switch (b.dataset.act) {
    case 'calendar': return openCalendar();
    case 'prev-day': return goToDate(addDays(logState.date, -1));
    case 'next-day': return goToDate(addDays(logState.date, 1));
    case 'timers': return go('timers');
    case 'start-today':
      return startTodayFlow(date, () => { toast('Workout ready – tap a set to log it'); rerender(); });
    case 'day-menu': return openDayMenu();
    case 'records': return openDayRecords();
    case 'comment': return editComment();
    case 'day-note': return editDayNote();
    case 'entry-note': return editEntryNote(entry);
    case 'add':
      return openAddSheet(date, (added) => {
        rerender();
        // With history the card already has suggested sets to tap; otherwise start logging the first set
        if (added && !added.sets.length) openSetEditor(date, added, null, rerender);
        else if (added) toast('Suggested from last time – tap a set to log it');
      });
    case 'info': return openExerciseDetail(entry.ex);
    case 'entry-menu': return openEntryMenu(entry);
    case 'expand':
      logState.folded?.delete(b.dataset.entry);
      return rerender();
    case 'fold':
      (logState.folded ||= new Set()).add(entry.id);
      return rerender();
    case 'add-set': return openSetEditor(date, entry, null, afterLog);
    case 'log-all': return logAll(entry);
    case 'tick-set': return tickSet(entry, Number(b.dataset.set));
    case 'tick-entry': return entryDone(entry) ? untickAll(entry) : logAll(entry, 'Exercise done');
    case 'deload':
      deloadEntry(entry);
      toast('Weights lowered by 10 % for this session');
      return rerender();
    case 'edit-set': return openSetEditor(date, entry, Number(b.dataset.set), afterLog);
    default:
  }
}

async function editComment() {
  const day = getDay(logState.date);
  const text = await promptDialog('Workout name', day?.title || '', { placeholder: 'E.g. Friday Lower + Hypers' });
  if (text == null) return;
  getDay(logState.date, true).title = text;
  cleanupDay(logState.date);
  save();
  rerender();
}

// A note for the whole workout (how it went, sleep, food …), separate from the workout name
async function editDayNote() {
  const day = getDay(logState.date);
  const text = await promptDialog('Workout note', day?.note || '', { placeholder: 'E.g. Tired after a long shift, little food', multiline: true });
  if (text == null) return;
  const d = getDay(logState.date, true);
  if (text) d.note = text; else delete d.note;
  cleanupDay(logState.date);
  save();
  rerender();
}

// A note for one exercise in this workout, instead of the same comment on every set
async function editEntryNote(entry) {
  const text = await promptDialog(`Note · ${exLabel(getExercise(entry.ex))}`, entry.note || '', { placeholder: 'E.g. Beltless, shoulder 0/10', multiline: true });
  if (text == null) return;
  if (text) entry.note = text; else delete entry.note;
  save();
  rerender();
}

// Tick one set off, or back to planned (plan mode)
function tickSet(entry, i) {
  const s = entry.sets[i];
  if (!s) return;
  const date = logState.date;
  if (s.done) {
    s.done = false;
    delete s.at;
  } else {
    s.done = true;
    s.at = Date.now();
    s.lvl = s.lvl || 'normal';
    delete s.last;
    if (isPR(entry.ex, date, s)) toast('🏆 New record!');
    const sec = restFor(entry, date);
    if (s.lvl !== 'warmup' && sec && state.settings.autoRest && date === dateKey()) startRest(sec);
  }
  save();
  afterLog();
}

// Un-tick a whole exercise: its sets become a plan again
function untickAll(entry) {
  for (const s of entry.sets) { s.done = false; delete s.at; }
  save();
  rerender();
}

// Mark every suggested set of a card as done, exactly as suggested
function logAll(entry, msg = 'All sets logged') {
  const date = logState.date;
  const now = Date.now();
  let pr = false;
  let work = false;
  for (const s of plannedSets(entry)) {
    s.done = true;
    s.at = now;
    s.lvl = s.lvl || 'normal';
    delete s.last;
    if (s.lvl !== 'warmup') work = true;
    if (isPR(entry.ex, date, s)) pr = true;
  }
  save();
  afterLog();
  toast(pr ? '🏆 Logged – new record!' : msg);
  const sec = restFor(entry, date);
  if (work && sec && state.settings.autoRest && date === dateKey()) startRest(sec);
}

// Put warm-up sets in front of the working sets, based on the heaviest working set of the card
function addWarmups(entry) {
  const work = entry.sets.filter((s) => s.lvl !== 'warmup' && s.w);
  const top = Math.max(0, ...work.map((s) => s.w));
  const sets = warmupSets(entry.ex, top);
  if (!sets.length) { toast(top ? 'The weight is too light for warm-up sets' : 'Enter a working weight first'); return; }
  entry.sets = [...sets, ...entry.sets.filter((s) => s.done || s.lvl !== 'warmup')];
  save();
  rerender();
  toast(`${sets.length} warm-up set${sets.length === 1 ? '' : 's'} added`);
}

function removeEntry(entry) {
  const day = getDay(logState.date);
  day.entries = day.entries.filter((x) => x !== entry);
  cleanupDay(logState.date);
  save();
  rerender();
}

async function openDayMenu() {
  const key = logState.date;
  const day = getDay(key);
  const items = [
    { value: 'comment', label: day?.title ? 'Rename workout' : 'Name workout', icon: 'edit' },
    { value: 'note', label: day?.note ? 'Edit workout note' : 'Add workout note', icon: 'comment' },
  ];
  if (day?.entries.some((e) => e.sets.some((s) => s.done))) items.push({ value: 'summary', label: 'Workout summary', icon: 'chart' });
  if (key !== dateKey()) items.push({ value: 'today', label: 'Go to today', icon: 'calendar' });
  if (day?.entries.length && key !== dateKey()) items.push({ value: 'copy', label: 'Copy workout to today', icon: 'copy' });
  if (day?.entries.length) items.push({ value: 'clear', label: 'Clear this day', icon: 'trash', danger: true });
  const v = await menuDialog(null, items);
  if (v === 'comment') editComment();
  if (v === 'note') editDayNote();
  if (v === 'summary') openSummary(key);
  if (v === 'today') goToDate(dateKey());
  if (v === 'copy') {
    copyToToday(key);
    goToDate(dateKey());
    toast('Copied to today – tap a set to log it');
  }
  if (v === 'clear' && await confirmDialog('Remove all exercises, the name and the note from this day?', 'Clear')) {
    delete state.log[key];
    save();
    rerender();
  }
}

async function openEntryMenu(entry) {
  const ex = getExercise(entry.ex);
  const day = getDay(logState.date);
  const idx = day.entries.indexOf(entry);
  const items = [{ value: 'info', label: 'History and records', icon: 'chart' }];
  items.push({ value: 'note', label: entry.note ? 'Edit note' : 'Add note', icon: 'comment' });
  if (plannedSets(entry).length) items.push({ value: 'logall', label: 'Log all as suggested', icon: 'check' });
  if (ex.type === 'wr') items.push({ value: 'warmup', label: 'Add warm-up sets', icon: 'up' });
  items.push({ value: 'range', label: progressionText(ex.id), icon: 'settings' });
  if (idx > 0) items.push({ value: 'up', label: 'Move up', icon: 'up' });
  if (idx < day.entries.length - 1) items.push({ value: 'down', label: 'Move down', icon: 'down' });
  const nextE = day.entries[idx + 1];
  if (entry.ss) items.push({ value: 'unss', label: 'Remove from superset', icon: 'close' });
  else if (nextE) items.push({ value: 'ss', label: `Superset with ${getExercise(nextE.ex).name}`, icon: 'repeat' });
  items.push({ value: 'swap', label: 'Replace exercise', icon: 'repeat' });
  items.push({ value: 'del', label: 'Remove from day', icon: 'trash', danger: true });
  const a = await menuDialog(exLabel(ex), items);
  if (a === 'info') openExerciseDetail(entry.ex);
  if (a === 'note') editEntryNote(entry);
  if (a === 'logall') logAll(entry);
  if (a === 'warmup') addWarmups(entry);
  if (a === 'range') {
    openProgressionDialog(ex.id, () => {
      // Recalculate the suggestions if nothing has been logged on this card yet
      if (!entry.block && !entry.sets.some((s) => s.done)) entry.sets = makeSets(entry.ex, logState.date);
      save();
      rerender();
    });
  }
  if (a === 'up' || a === 'down') {
    const j = idx + (a === 'up' ? -1 : 1);
    [day.entries[idx], day.entries[j]] = [day.entries[j], day.entries[idx]];
    save();
    rerender();
  }
  if (a === 'ss') {
    // Join the next card's superset if it has one, else start a new one
    const id = nextE.ss || `ss-${Date.now().toString(36)}`;
    entry.ss = id;
    nextE.ss = id;
    save();
    rerender();
    toast('Superset – rest starts after both');
  }
  if (a === 'unss') {
    const id = entry.ss;
    delete entry.ss;
    const left = day.entries.filter((x) => x.ss === id);
    if (left.length === 1) delete left[0].ss;
    save();
    rerender();
  }
  if (a === 'swap') {
    openExercisePicker({
      title: 'Replace with',
      multi: false,
      onPick([id]) {
        entry.ex = id;
        save();
        rerender();
      },
    });
  }
  if (a === 'del' && await confirmDialog(`Remove ${ex.name} from the day?`, 'Remove')) removeEntry(entry);
}

// Records for the exercises in this day
function openDayRecords() {
  const day = getDay(logState.date);
  const u = state.settings.unit;
  const rows = day.entries.map((e) => {
    const ex = getExercise(e.ex);
    const rec = records(e.ex);
    const newPR = e.sets.some((s) => s.done && isPR(e.ex, logState.date, s));
    let best = 'No records yet';
    if (ex.type === 'wr' && rec.best1rm) best = `Heaviest ${fmtNum(rec.maxW.v, 2)} ${u}${rec.maxW.r ? ` × ${rec.maxW.r}` : ''} · est. 1RM ${fmtNum(rec.best1rm.v, 1)} ${u}`;
    else if (ex.type === 'r' && rec.maxR) best = `Most reps: ${rec.maxR.v}`;
    else if (ex.type === 't' && rec.maxT) best = `Longest: ${fmtTime(rec.maxT.v)}`;
    else if (ex.type === 'dt' && rec.maxD) best = `Longest: ${fmtNum(rec.maxD.v, 2)} km`;
    return `<button class="ex-row" data-ex="${esc(e.ex)}">
      ${exerciseThumb(ex)}
      <span class="grow"><span class="title">${esc(exLabel(ex))}</span><span class="sub">${best}</span></span>
      ${newPR ? `<span class="avatar gold" title="New record today">${icon('trophy')}</span>` : ''}
    </button>`;
  }).join('');
  openModal(`
    <div class="modal-head"><h2>Records</h2>
      <button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>
    <div class="list scroll">${rows}</div>
    <button class="btn ghost block" data-all>${icon('trophy')} All records</button>`, {
    className: 'tall',
    onMount(m, close) {
      m.addEventListener('click', (e) => {
        const b = e.target.closest('[data-ex]');
        if (b) openExerciseDetail(b.dataset.ex);
        if (e.target.closest('[data-all]')) { close(); go('records'); }
      });
    },
  });
}

export function openCalendar() {
  let cur = parseKey(logState.date);
  cur = new Date(cur.getFullYear(), cur.getMonth(), 1);

  const monthHtml = () => {
    const y = cur.getFullYear();
    const mo = cur.getMonth();
    const first = (new Date(y, mo, 1).getDay() + 6) % 7;
    const days = new Date(y, mo + 1, 0).getDate();
    const today = dateKey();
    let cells = '';
    for (let i = 0; i < first; i++) cells += '<span></span>';
    let count = 0;
    for (let d = 1; d <= days; d++) {
      const k = `${y}-${pad(mo + 1)}-${pad(d)}`;
      const has = dayHasWork(k);
      if (has) count++;
      cells += `<button class="cal-day ${has ? 'has' : ''} ${k === today ? 'today' : ''} ${k === logState.date ? 'sel' : ''}" data-day="${k}">${d}</button>`;
    }
    return `
      <div class="cal-head">
        <button class="icon-btn" data-mo="-1" aria-label="Previous month">${icon('left')}</button>
        <div><strong>${MONTHS[mo]} ${y}</strong>
        <div class="sub">${count} workout day${count === 1 ? '' : 's'}</div></div>
        <button class="icon-btn" data-mo="1" aria-label="Next month">${icon('right')}</button>
      </div>
      <div class="cal-grid wk">${['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => `<span>${d}</span>`).join('')}</div>
      <div class="cal-grid">${cells}</div>`;
  };

  openModal(`<div class="cal"></div>
    <div class="dialog-actions"><button class="text-btn accent" data-today>Today</button><button class="text-btn" data-close>Close</button></div>`, {
    className: 'dialog',
    onMount(m, close) {
      const cal = m.querySelector('.cal');
      const draw = () => { cal.innerHTML = monthHtml(); };
      m.addEventListener('click', (e) => {
        const mo = e.target.closest('[data-mo]');
        if (mo) { cur.setMonth(cur.getMonth() + Number(mo.dataset.mo)); draw(); return; }
        const d = e.target.closest('[data-day]');
        if (d) { close(); goToDate(d.dataset.day); }
        if (e.target.closest('[data-today]')) { close(); goToDate(dateKey()); }
      });
      draw();
    },
  });
}

// Add a program workout to a day as planned sets (from the program targets or the last session)
export function startWorkout(program, workout, key = logState.date) {
  const day = getDay(key, true);
  if (!day.title) day.title = `${program.name} – ${workout.name}`;
  day.workout = workout.name;
  workout.exercises.forEach((w) => addEntry(key, w.ex, { sets: w.sets, reps: w.reps }));
  save();
}

// Swipe left/right to change day
// Swipe left/right anywhere on the day view (also the empty space under the cards) to change day.
// Not inside dialogs, menus, the bottom bars or horizontally scrolling chip rows.
const NO_SWIPE = 'input, textarea, .chips, .modal-backdrop, #drawer, #tabbar, #restbar, .auth, .lvl-row';
export function enableSwipe(el, isActive, onSwipe = (dir) => goToDate(addDays(logState.date, dir))) {
  let x0 = null;
  let y0 = null;
  el.addEventListener('touchstart', (e) => {
    if (!isActive() || e.touches.length > 1 || e.target.closest(NO_SWIPE)) { x0 = null; return; }
    x0 = e.touches[0].clientX;
    y0 = e.touches[0].clientY;
  }, { passive: true });
  el.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) {
      onSwipe(dx < 0 ? 1 : -1);
    }
  }, { passive: true });
}
