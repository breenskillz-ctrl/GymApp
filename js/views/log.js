// Day view: the workout log for one day.
import {
  state, save, getDay, cleanupDay, addEntry, getExercise, dayHasWork, isPR, daySummary, records, makeSets,
  warmupSets, getRest, dayDuration, isStalled, deloadEntry, setHasData,
} from '../store.js';
import { startRest } from '../timer.js';
import {
  esc, icon, openModal, confirmDialog, dateKey, addDays, fmtTime, fmtNum, toast,
  parseKey, MONTHS, pad, go, promptDialog, menuDialog,
} from '../utils.js';
import { exerciseThumb } from '../icons.js';
import { SET_TAGS } from '../data.js';
import { profileName } from '../profile.js';
import { openExercisePicker } from './picker.js';
import { openExerciseDetail, openProgressionDialog, progressionText } from './exercises.js';
import { openSetEditor, levelColor, exLabel, suggestionDelta } from './seteditor.js';
import { openAddSheet } from './addsheet.js';
import { backupDue, shareBackup, downloadBackup, canShareFiles } from '../backup.js';

export const logState = { date: dateKey() };

let rootEl;

export function goToDate(key) {
  logState.date = key;
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

const tagLabel = (id) => SET_TAGS.find((t) => t.id === id)?.label || id;

// One set as a compact two-line column: "120 KG / 2 REP"
function setColHtml(ex, s, i) {
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
  return `<button class="set-col ${s.done ? '' : 'planned'} ${pr ? 'pr' : ''}" data-act="edit-set" data-set="${i}"
    ${color ? `style="--c:${color}"` : ''}>
    <span class="line">${l1}</span>${l2 ? `<span class="line">${l2}</span>` : ''}
    ${s.tags?.length ? `<span class="set-tags">${s.tags.map(tagLabel).join(' · ')}</span>` : ''}
    ${s.c ? `<span class="set-note">${esc(s.c)}</span>` : ''}
    ${suggestionDelta(s) ? `<span class="set-delta">${esc(suggestionDelta(s))}</span>` : ''}
  </button>`;
}

// Planned (suggested) sets that already have numbers and can be logged in one tap
const plannedSets = (entry) => entry.sets.filter((s) => !s.done && setHasData(s));

function entryHtml(entry) {
  const ex = getExercise(entry.ex);
  const planned = plannedSets(entry).length;
  const stalled = !entry.block && !entry.deload && !entry.sets.some((s) => s.done) && isStalled(entry.ex, logState.date);
  return `
    <section class="ex-card" data-entry="${entry.id}">
      <div class="ex-body">
        <div class="ex-head">
          <button class="ex-title" data-act="info">${esc(exLabel(ex))}</button>
          <button class="icon-btn" data-act="entry-menu" aria-label="Menu">${icon('more')}</button>
        </div>
        <div class="sets">${entry.sets.map((s, i) => setColHtml(ex, s, i)).join('')}
          <button class="set-col add-chip" data-act="add-set" aria-label="Add set">${icon('plus')}<span>Set</span></button></div>
        ${stalled ? `<div class="stall">No progress in 3 sessions.
          <button class="text-btn accent" data-act="deload">Deload −10&nbsp;%</button></div>` : ''}
        ${planned > 1 ? `<button class="log-all" data-act="log-all">${icon('check')} Log all ${planned} as suggested</button>` : ''}
      </div>
    </section>`;
}

// "Today", "Yesterday" or a short date like "25 Sep"
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
  return `<div class="empty-day log-empty"><h2>${esc(head)}</h2><p>${esc(sub)}</p></div>`;
}

export function renderLog(root) {
  rootEl = root;
  const key = logState.date;
  const day = getDay(key);
  const entries = day?.entries || [];
  const sum = daySummary(day);
  const mins = dayDuration(day);
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
    ${isToday && backupDue() ? `<div class="backup-banner">${icon('download')}
      <span class="grow">${state.lastBackup ? `Last backup ${Math.floor((Date.now() - state.lastBackup) / 86400000)} days ago` : 'Your data is only on this phone'}</span>
      <button class="text-btn accent" data-act="backup">Back up</button>
      <button class="icon-btn sm" data-act="backup-later" aria-label="Remind me later">${icon('close')}</button></div>` : ''}
    ${entries.length ? `
      <p class="day-summary">${sum.exs} exs · ${sum.sets} sets${sum.vol ? ` · ${fmtNum(sum.vol, 0)} ${state.settings.unit}` : ''}${mins ? ` · ${mins} min` : ''}</p>
      ${day.title ? `<button class="day-comment" data-act="comment">${esc(day.title)}</button>` : ''}
      <div class="entries">${entries.map(entryHtml).join('')}</div>` : `
      ${day?.title ? `<button class="day-comment" data-act="comment">${esc(day.title)}</button>` : ''}
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
    case 'day-menu': return openDayMenu();
    case 'records': return openDayRecords();
    case 'comment': return editComment();
    case 'add':
      return openAddSheet(date, (added) => {
        rerender();
        // With history the card already has suggested sets to tap; otherwise start logging the first set
        if (added && !added.sets.length) openSetEditor(date, added, null, rerender);
        else if (added) toast('Suggested from last time – tap a set to log it');
      });
    case 'info': return openExerciseDetail(entry.ex);
    case 'entry-menu': return openEntryMenu(entry);
    case 'add-set': return openSetEditor(date, entry, null, rerender);
    case 'log-all': return logAll(entry);
    case 'backup':
      (canShareFiles() ? shareBackup() : downloadBackup()).then(rerender);
      return undefined;
    case 'backup-later':
      state.backupSnooze = Date.now();
      save();
      return rerender();
    case 'deload':
      deloadEntry(entry);
      toast('Weights lowered by 10 % for this session');
      return rerender();
    case 'edit-set': return openSetEditor(date, entry, Number(b.dataset.set), rerender);
    default:
  }
}

async function editComment() {
  const day = getDay(logState.date);
  const text = await promptDialog('Comment', day?.title || '', { placeholder: 'E.g. Friday Lower + Hypers' });
  if (text == null) return;
  getDay(logState.date, true).title = text;
  cleanupDay(logState.date);
  save();
  rerender();
}

// Mark every suggested set of a card as done, exactly as suggested
function logAll(entry) {
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
  rerender();
  toast(pr ? '🏆 Logged – new personal record!' : 'All sets logged');
  if (work && state.settings.autoRest && date === dateKey()) startRest(getRest(entry.ex));
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
  const items = [{ value: 'comment', label: day?.title ? 'Edit comment' : 'Add comment', icon: 'comment' }];
  if (key !== dateKey()) items.push({ value: 'today', label: 'Go to today', icon: 'calendar' });
  if (day?.entries.length && key !== dateKey()) items.push({ value: 'copy', label: 'Copy workout to today', icon: 'copy' });
  if (day?.entries.length) items.push({ value: 'clear', label: 'Clear this day', icon: 'trash', danger: true });
  const v = await menuDialog(null, items);
  if (v === 'comment') editComment();
  if (v === 'today') goToDate(dateKey());
  if (v === 'copy') {
    copyToToday(key);
    goToDate(dateKey());
    toast('Copied to today – tap a set to log it');
  }
  if (v === 'clear' && await confirmDialog('Remove all exercises and the comment from this day?', 'Clear')) {
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
  if (plannedSets(entry).length) items.push({ value: 'logall', label: 'Log all as suggested', icon: 'check' });
  if (ex.type === 'wr') items.push({ value: 'warmup', label: 'Add warm-up sets', icon: 'up' });
  items.push({ value: 'range', label: progressionText(ex.id), icon: 'settings' });
  if (idx > 0) items.push({ value: 'up', label: 'Move up', icon: 'up' });
  if (idx < day.entries.length - 1) items.push({ value: 'down', label: 'Move down', icon: 'down' });
  items.push({ value: 'swap', label: 'Replace exercise', icon: 'repeat' });
  items.push({ value: 'del', label: 'Remove from day', icon: 'trash', danger: true });
  const a = await menuDialog(exLabel(ex), items);
  if (a === 'info') openExerciseDetail(entry.ex);
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
    if (ex.type === 'wr' && rec.best1rm) best = `Est. 1RM ${fmtNum(rec.best1rm.v, 1)} ${u} · heaviest ${fmtNum(rec.maxW.v, 2)} ${u}`;
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
  workout.exercises.forEach((w) => addEntry(key, w.ex, { sets: w.sets, reps: w.reps }));
  save();
}

// Swipe left/right to change day
// Swipe left/right anywhere on the day view (also the empty space under the cards) to change day.
// Not inside dialogs, menus, the bottom bars or horizontally scrolling chip rows.
const NO_SWIPE = 'input, textarea, .chips, .modal-backdrop, #drawer, #tabbar, #restbar, .auth, .lvl-row';
export function enableSwipe(el, isActive) {
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
      goToDate(addDays(logState.date, dx < 0 ? 1 : -1));
    }
  }, { passive: true });
}
