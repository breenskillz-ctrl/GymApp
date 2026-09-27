// Training log: one page per day with exercises and sets.
import {
  state, save, getDay, cleanupDay, addEntry, getExercise, lastSets, allPrograms, dayHasWork, isPR, setVolume, setHasData,
} from '../store.js';
import {
  esc, icon, openModal, confirmDialog, dateKey, addDays, fmtDate, relDay, num, parseTime, fmtTime, fmtNum, toast,
  parseKey, MONTHS, pad,
} from '../utils.js';
import { startRest } from '../timer.js';
import { openExercisePicker } from './picker.js';
import { openExerciseDetail, setText } from './exercises.js';

export const logState = { date: dateKey() };

let rootEl;

export function goToDate(key) {
  logState.date = key;
  if (rootEl) renderLog(rootEl);
}

const COLS = {
  wr: [['w', () => state.settings.unit], ['r', () => 'reps']],
  r: [['r', () => 'reps']],
  t: [['t', () => 'time']],
  dt: [['d', () => 'km'], ['t', () => 'time']],
};

function inputHtml(field, value) {
  if (field === 't') {
    return `<input class="set-input" data-field="t" inputmode="numeric" placeholder="m:ss" value="${value != null ? fmtTime(value) : ''}">`;
  }
  const mode = field === 'r' ? 'numeric' : 'decimal';
  return `<input class="set-input" data-field="${field}" type="text" inputmode="${mode}" placeholder="–" value="${value ?? ''}">`;
}

function setRowHtml(ex, s, i, prev) {
  const cols = COLS[ex.type] || COLS.wr;
  const pr = s.done && isPR(ex.id, logState.date, s);
  return `
    <div class="set-row ${s.done ? 'done' : ''}" data-set="${i}">
      <button class="set-num" data-act="set-menu" title="Delete set">${pr ? '<span class="pr">PR</span>' : i + 1}</button>
      <span class="set-prev" data-act="copy-prev">${prev ? esc(setText(ex, prev)) : '–'}</span>
      ${cols.map(([f]) => inputHtml(f, s[f])).join('')}
      <button class="set-check" data-act="toggle" aria-label="Done">${icon('check')}</button>
    </div>`;
}

function entryHtml(entry) {
  const ex = getExercise(entry.ex);
  const prev = lastSets(entry.ex, logState.date) || [];
  const cols = COLS[ex.type] || COLS.wr;
  const done = entry.sets.filter((s) => s.done).length;
  return `
    <section class="card entry ${cols.length === 1 ? 'one-col' : ''}" data-entry="${entry.id}">
      <div class="entry-head">
        <button class="entry-title" data-act="info">
          <span class="title">${esc(ex.name)}</span>
          <span class="sub">${esc(ex.group)} · ${done}/${entry.sets.length} sets</span>
        </button>
        <button class="icon-btn" data-act="entry-menu" aria-label="Menu">${icon('more')}</button>
      </div>
      <div class="set-row head">
        <span>Set</span><span>Previous</span>
        ${cols.map(([, l]) => `<span>${l()}</span>`).join('')}
        <span>${icon('check')}</span>
      </div>
      ${entry.sets.map((s, i) => setRowHtml(ex, s, i, prev[i])).join('')}
      <div class="entry-foot">
        <button class="btn ghost sm" data-act="add-set">${icon('plus')} Add set</button>
      </div>
    </section>`;
}

function summary(day) {
  if (!day?.entries.length) return '';
  let sets = 0;
  let vol = 0;
  for (const e of day.entries) {
    for (const s of e.sets) {
      if (s.done) { sets++; vol += setVolume(s); }
    }
  }
  return `${day.entries.length} exercise${day.entries.length > 1 ? 's' : ''} · ${sets} set${sets === 1 ? '' : 's'} done${vol ? ` · ${fmtNum(vol, 0)} ${state.settings.unit} lifted` : ''}`;
}

export function renderLog(root) {
  rootEl = root;
  const key = logState.date;
  const day = getDay(key);
  const entries = day?.entries || [];

  root.innerHTML = `
    <header class="day-nav">
      <button class="icon-btn" data-act="prev" aria-label="Previous day">${icon('left')}</button>
      <button class="day-title" data-act="calendar">
        <span class="title">${relDay(key)} ${icon('calendar')}</span>
        <span class="sub">${fmtDate(key, false)}</span>
      </button>
      <button class="icon-btn" data-act="next" aria-label="Next day">${icon('right')}</button>
    </header>
    ${key !== dateKey() ? `<button class="today-link" data-act="today">Go to today</button>` : ''}
    ${day?.title ? `<div class="day-label">${icon('dumbbell')} ${esc(day.title)}</div>` : ''}
    <p class="day-summary">${summary(day)}</p>
    <div class="entries">
      ${entries.length ? entries.map((e) => entryHtml(e)).join('') : `
        <div class="empty-state">
          <div class="empty-icon">${icon('dumbbell')}</div>
          <h2>No workout logged</h2>
          <p>Add exercises or start a workout from a program. Swipe sideways to change day.</p>
        </div>`}
    </div>
    <div class="day-actions">
      <button class="btn primary" data-act="add">${icon('plus')} Add exercise</button>
      <button class="btn ghost" data-act="program">${icon('list')} Start from program</button>
      ${entries.length ? '' : `<button class="btn ghost" data-act="repeat">${icon('repeat')} Repeat past workout</button>`}
    </div>
    <label class="note-label">Notes
      <textarea class="input note" rows="2" placeholder="How did the workout feel?">${esc(day?.note || '')}</textarea>
    </label>`;

  bind(root);
}

function entryById(id) {
  return getDay(logState.date)?.entries.find((e) => e.id === id);
}

function rerenderEntry(root, entry) {
  const day = getDay(logState.date);
  const card = root.querySelector(`[data-entry="${entry.id}"]`);
  const tmp = document.createElement('div');
  tmp.innerHTML = entryHtml(entry);
  card.replaceWith(tmp.firstElementChild);
  root.querySelector('.day-summary').textContent = summary(day);
}

function bind(root) {
  root.onclick = async (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    const card = b.closest('[data-entry]');
    const entry = card && entryById(card.dataset.entry);
    const row = b.closest('[data-set]');
    const si = row ? Number(row.dataset.set) : -1;

    switch (act) {
      case 'prev': return goToDate(addDays(logState.date, -1));
      case 'next': return goToDate(addDays(logState.date, 1));
      case 'today': return goToDate(dateKey());
      case 'calendar': return openCalendar();
      case 'add':
        return openExercisePicker({
          onPick(ids) {
            ids.forEach((id) => addEntry(logState.date, id));
            renderLog(root);
          },
        });
      case 'program': return openProgramStarter();
      case 'repeat': return openRepeat();
      case 'info': return openExerciseDetail(entry.ex);
      case 'entry-menu': return openEntryMenu(entry);
      case 'add-set': {
        const last = entry.sets[entry.sets.length - 1];
        entry.sets.push(last ? { ...last, done: false } : { w: null, r: null, t: null, d: null, done: false });
        save();
        return rerenderEntry(root, entry);
      }
      case 'toggle': {
        const s = entry.sets[si];
        // Fill in from last time if the fields are empty
        if (!s.done && !setHasData(s)) {
          const prev = (lastSets(entry.ex, logState.date) || [])[si];
          if (prev) Object.assign(s, { w: prev.w, r: prev.r, t: prev.t, d: prev.d });
        }
        s.done = !s.done;
        save();
        rerenderEntry(root, entry);
        if (s.done) {
          if (isPR(entry.ex, logState.date, s)) toast('🏆 New personal record!');
          if (state.settings.autoRest && logState.date === dateKey()) startRest();
        }
        return;
      }
      case 'copy-prev': {
        const prev = (lastSets(entry.ex, logState.date) || [])[si];
        if (!prev) return;
        Object.assign(entry.sets[si], { w: prev.w, r: prev.r, t: prev.t, d: prev.d });
        save();
        return rerenderEntry(root, entry);
      }
      case 'set-menu': {
        if (entry.sets.length === 1) {
          if (await confirmDialog('Remove this exercise from the day?', 'Remove')) removeEntry(entry);
          return;
        }
        if (!await confirmDialog(`Delete set ${si + 1}?`)) return;
        entry.sets.splice(si, 1);
        save();
        return rerenderEntry(root, entry);
      }
      default:
    }
  };

  root.oninput = (e) => {
    const inp = e.target;
    if (inp.classList.contains('note')) {
      const day = getDay(logState.date, true);
      day.note = inp.value;
      cleanupDay(logState.date);
      save();
      return;
    }
    if (!inp.classList.contains('set-input')) return;
    const entry = entryById(inp.closest('[data-entry]').dataset.entry);
    const s = entry.sets[Number(inp.closest('[data-set]').dataset.set)];
    const f = inp.dataset.field;
    s[f] = f === 't' ? parseTime(inp.value) : num(inp.value);
    save();
  };

  root.onfocusin = (e) => {
    if (e.target.classList.contains('set-input')) e.target.select();
  };
}

function removeEntry(entry) {
  const day = getDay(logState.date);
  day.entries = day.entries.filter((x) => x !== entry);
  if (!day.entries.length) day.title = '';
  cleanupDay(logState.date);
  save();
  renderLog(rootEl);
}

function openEntryMenu(entry) {
  const ex = getExercise(entry.ex);
  const day = getDay(logState.date);
  const idx = day.entries.indexOf(entry);
  openModal(`
    <div class="modal-head"><h2>${esc(ex.name)}</h2>
      <button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>
    <div class="menu">
      <button data-m="info">${icon('chart')} History and records</button>
      ${idx > 0 ? `<button data-m="up">${icon('up')} Move up</button>` : ''}
      ${idx < day.entries.length - 1 ? `<button data-m="down">${icon('down')} Move down</button>` : ''}
      <button data-m="swap">${icon('repeat')} Replace exercise</button>
      <button data-m="del" class="danger-text">${icon('trash')} Remove from day</button>
    </div>`, {
    className: 'small',
    onMount(m, close) {
      m.querySelector('.menu').addEventListener('click', async (e) => {
        const b = e.target.closest('[data-m]');
        if (!b) return;
        close();
        const a = b.dataset.m;
        if (a === 'info') openExerciseDetail(entry.ex);
        if (a === 'up' || a === 'down') {
          const j = idx + (a === 'up' ? -1 : 1);
          [day.entries[idx], day.entries[j]] = [day.entries[j], day.entries[idx]];
          save();
          renderLog(rootEl);
        }
        if (a === 'swap') {
          openExercisePicker({
            title: 'Replace with',
            multi: false,
            onPick([id]) {
              entry.ex = id;
              save();
              renderLog(rootEl);
            },
          });
        }
        if (a === 'del' && await confirmDialog(`Remove ${ex.name} from the day?`, 'Remove')) removeEntry(entry);
      });
    },
  });
}

export function startWorkout(program, workout, key = logState.date) {
  const day = getDay(key, true);
  day.title = `${program.name} – ${workout.name}`;
  workout.exercises.forEach((w) => addEntry(key, w.ex, { sets: w.sets, reps: w.reps }));
  save();
}

function openProgramStarter() {
  const programs = allPrograms();
  openModal(`
    <div class="modal-head"><h2>Start from program</h2>
      <button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>
    <div class="scroll">
      ${programs.map((p) => `
        <div class="prog-group">
          <div class="list-heading">${esc(p.name)}</div>
          ${p.workouts.map((w) => `
            <button class="list-item" data-p="${esc(p.id)}" data-w="${esc(w.id)}">
              <span class="grow"><span class="title">${esc(w.name)}</span>
              <span class="sub">${w.exercises.map((x) => esc(getExercise(x.ex).name)).join(', ')}</span></span>
              ${icon('right')}
            </button>`).join('')}
        </div>`).join('')}
    </div>`, {
    className: 'tall',
    onMount(m, close) {
      m.addEventListener('click', (e) => {
        const b = e.target.closest('[data-w]');
        if (!b) return;
        const p = programs.find((x) => x.id === b.dataset.p);
        const w = p.workouts.find((x) => x.id === b.dataset.w);
        startWorkout(p, w);
        close();
        renderLog(rootEl);
        toast('Workout added – good luck!');
      });
    },
  });
}

function openRepeat() {
  const dates = Object.keys(state.log).filter((k) => k !== logState.date && dayHasWork(k)).sort().reverse().slice(0, 30);
  openModal(`
    <div class="modal-head"><h2>Repeat past workout</h2>
      <button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>
    <div class="list scroll">
      ${dates.length ? dates.map((k) => {
        const d = state.log[k];
        return `<button class="list-item" data-date="${k}">
          <span class="grow"><span class="title">${esc(d.title || fmtDate(k))}</span>
          <span class="sub">${d.title ? fmtDate(k) + ' · ' : ''}${d.entries.map((x) => esc(getExercise(x.ex).name)).join(', ')}</span></span>
          ${icon('right')}</button>`;
      }).join('') : '<p class="empty">You have no past workouts yet.</p>'}
    </div>`, {
    className: 'tall',
    onMount(m, close) {
      m.addEventListener('click', (e) => {
        const b = e.target.closest('[data-date]');
        if (!b) return;
        const src = state.log[b.dataset.date];
        const day = getDay(logState.date, true);
        day.title = src.title || '';
        src.entries.forEach((x) => addEntry(logState.date, x.ex));
        save();
        close();
        renderLog(rootEl);
      });
    },
  });
}

function openCalendar() {
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

  openModal('<div class="cal"></div><button class="btn ghost block" data-close>Close</button>', {
    className: 'small',
    onMount(m, close) {
      const cal = m.querySelector('.cal');
      const draw = () => { cal.innerHTML = monthHtml(); };
      cal.addEventListener('click', (e) => {
        const mo = e.target.closest('[data-mo]');
        if (mo) { cur.setMonth(cur.getMonth() + Number(mo.dataset.mo)); draw(); return; }
        const d = e.target.closest('[data-day]');
        if (d) { close(); goToDate(d.dataset.day); }
      });
      draw();
    },
  });
}

// Swipe left/right to change day
export function enableSwipe(el, isActive) {
  let x0 = null;
  let y0 = null;
  el.addEventListener('touchstart', (e) => {
    if (!isActive() || e.target.closest('input, textarea, .chips')) { x0 = null; return; }
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
