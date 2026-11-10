// Home (start page, DECISIONS #57, #70): greeting, today's workout with one "Start" button, this week, latest record.
import { state, getDay, getExercise, dayDone, isPR, setHasData } from '../store.js';
import {
  esc, icon, dateKey, addDays, parseKey, fmtDate, fmtNum, go, toast,
} from '../utils.js';
import { profileName } from '../profile.js';
import { logState } from './log.js';
import { exLabel } from './seteditor.js';
import { setWeight } from '../blocks.js';
import { todayPlan, startToday, workoutName, weekdayOf } from '../today.js';
import { backupDue, shareBackup, downloadBackup, canShareFiles } from '../backup.js';
import { save } from '../store.js';
import {
  garminRows, cachedRows, readiness, applyReadiness, readinessApplied,
} from '../readiness.js';
import { sheetUrl } from '../sync.js';

export function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 22 ? 'Good evening' : 'Good night';
}

const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// "4 × 6 · 92.5 kg" for a block item (sets with the same load as the first one)
function blockItemText(b, it) {
  if (it.kind === 'normal') return `${it.sets} × ${it.reps}`;
  const first = it.sets[0];
  const same = it.sets.filter((s) => s.pct === first.pct && s.reps === first.reps && !s.amrap).length || 1;
  const w = setWeight(b, it.ex, first);
  return `${same} × ${first.reps}${w ? ` · ${fmtNum(w, 2)} ${state.settings.unit}` : ''}`;
}

function todayCardHtml(today) {
  const day = getDay(today);
  const wd = WD[parseKey(today).getDay()].toUpperCase();
  if (day?.entries.length) {
    const sets = day.entries.flatMap((e) => e.sets);
    const done = sets.filter((s) => s.done).length;
    return `<section class="today-card">
      <div class="tc-kicker">Today · ${wd}</div>
      <h2 class="tc-title">${esc(workoutName(day) || 'Workout')}</h2>
      <div class="tc-row"><span>${day.entries.length} exercise${day.entries.length === 1 ? '' : 's'}</span><b>${done} of ${sets.length} sets done</b></div>
      <button class="btn primary block tc-btn" data-go="log">${icon('right')} Continue workout</button>
    </section>`;
  }
  const plan = todayPlan(today);
  const rows = [];
  if (plan.bd) {
    for (const it of plan.bd.day.items) {
      rows.push(`<div class="tc-row"><span>${esc(getExercise(it.ex).name)} <span class="muted">· block W${plan.bd.w + 1}</span></span>
        <b>${esc(blockItemText(plan.block, it))}</b></div>`);
    }
  }
  if (plan.workout) {
    const n = plan.workout.exercises.length;
    rows.push(`<div class="tc-row"><span>${esc(plan.workout.name)} <span class="muted">· ${esc(plan.program.name)}</span></span>
      <b>${n} exercise${n === 1 ? '' : 's'}</b></div>`);
  }
  const title = plan.workout || plan.bd
    ? [plan.bd?.day.name.replace(/^[A-Za-zæøåÆØÅ]{3,8}\s*·\s*/, ''), plan.workout?.name.replace(/^\S+\s*/, '')].filter(Boolean).join(' + ')
    : 'Nothing planned';
  return `<section class="today-card ${rows.length ? '' : 'quiet'}">
    <div class="tc-kicker">Today · ${wd}</div>
    <h2 class="tc-title">${esc(title)}</h2>
    ${rows.join('') || '<p class="muted tc-empty">A rest day – or add exercises yourself.</p>'}
    ${rows.length ? `<button class="btn primary block tc-btn" data-go="start">${icon('plus')} Start today’s workout</button>`
    : `<button class="btn ghost block tc-btn" data-go="log">${icon('plus')} Open today’s log</button>`}
  </section>`;
}

// Monday–Sunday with done / today / planned markers
function weekHtml(today) {
  const d = parseKey(today);
  const mon = addDays(today, -((d.getDay() + 6) % 7));
  const keys = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  const doneN = keys.filter(dayDone).length;
  const block = (state.blocks || []).find((b) => !b.finished);
  const target = block ? block.weeks[block.pos.w].days.length
    : (state.customPrograms || []).find((p) => p.id === state.settings.myProgram)?.workouts.filter((w) => weekdayOf(w.name) != null).length || 0;
  return `<section class="home-card week-card">
    <div class="wc-head"><b>This week</b><span class="muted">${doneN}${target ? ` of ${target}` : ''} workout${(target || doneN) === 1 ? '' : 's'}</span></div>
    <div class="wc-days">${keys.map((k) => {
      const cls = dayDone(k) ? 'done' : k === today ? 'today' : getDay(k)?.entries.length ? 'planned' : '';
      return `<button class="wc-day" data-day="${k}"><span>${WD[parseKey(k).getDay()][0]}</span><i class="${cls}">${dayDone(k) ? icon('check') : ''}</i></button>`;
    }).join('')}</div>
  </section>`;
}

// Today's readiness from the watch (DECISIONS #71); empty without data
function readyHtml(today, rows) {
  const r = readiness(rows, today);
  if (!r) return '';
  const day = getDay(today);
  const canApply = r.pct && !readinessApplied(today) && day?.entries.some((e) => e.block && e.sets.some((s) => !s.done && s.w));
  const applied = readinessApplied(today);
  return `<div class="ready ready-${r.level}">
    <div class="rd-head"><i class="rd-dot"></i><b>${esc(r.text)}</b></div>
    <div class="rd-facts">${r.facts.map(esc).join(' · ')}</div>
    ${applied ? `<div class="rd-facts">Block sets lowered by ${applied} % today.</div>` : ''}
    ${canApply ? `<button class="text-btn accent rd-apply" data-go="ready">Lower today’s block sets by ${r.pct} %</button>` : ''}
  </div>`;
}

// Newest personal record in the last 60 days
function latestRecord(today) {
  const from = addDays(today, -60);
  for (const k of Object.keys(state.log).filter((x) => x >= from && x <= today).sort().reverse()) {
    for (const e of state.log[k].entries) {
      const ex = getExercise(e.ex);
      const best = e.sets.filter((s) => s.done && setHasData(s) && isPR(e.ex, k, s)).pop();
      if (best) {
        const what = ex.type === 'wr' ? `${fmtNum(best.w, 2)} ${state.settings.unit} × ${best.r}` : ex.type === 'r' ? `${best.r} reps` : '';
        return { ex, what, date: k };
      }
    }
  }
  return null;
}

export function renderHome(root) {
  const today = dateKey();
  const name = profileName();
  const rec = latestRecord(today);

  root.innerHTML = `
    <header class="topbar">
      <button class="icon-btn" data-open-drawer aria-label="Menu">${icon('menu')}</button>
      <h1 class="topbar-title">Loadlog</h1>
    </header>
    <section class="home-hello">
      <div class="hello-greet">${greeting()}</div>
      <h2 class="hello-title">Are you ready to grind${name ? `, <span>${esc(name)}</span>` : ''}?</h2>
    </section>
    ${todayCardHtml(today)}
    <div id="ready-slot">${readyHtml(today, cachedRows())}</div>
    ${weekHtml(today)}
    ${rec ? `<button class="home-card rec-card" data-go="records"><span class="gold">${icon('trophy')}</span>
      <span class="grow"><b>Latest record</b><small>${esc(exLabel(rec.ex))}${rec.what ? ` · ${esc(rec.what)}` : ''} · ${fmtDate(rec.date, false)}</small></span>${icon('right')}</button>` : ''}
    ${backupDue() ? `<div class="backup-banner home-backup">${icon('download')}
      <span class="grow">${state.lastBackup ? `Last backup ${Math.floor((Date.now() - state.lastBackup) / 86400000)} days ago` : 'Your data is only on this phone'}</span>
      <button class="text-btn accent" data-go="backup">Back up</button>
      <button class="icon-btn sm" data-go="backup-later" aria-label="Remind me later">${icon('close')}</button></div>` : ''}`;

  if (sheetUrl()) {
    garminRows().then((rows) => {
      const slot = root.querySelector('#ready-slot');
      if (slot?.isConnected) slot.innerHTML = readyHtml(today, rows);
    });
  }

  root.onclick = (e) => {
    const day = e.target.closest('[data-day]');
    if (day) { logState.date = day.dataset.day; go('log'); return; }
    const b = e.target.closest('[data-go]');
    if (!b) return;
    if (b.dataset.go === 'start') {
      startToday(today);
      logState.date = today;
      go('log');
      toast('Today’s workout is ready – tap a set to log it');
    }
    if (b.dataset.go === 'log') { logState.date = today; go('log'); }
    if (b.dataset.go === 'records') go('records');
    if (b.dataset.go === 'ready') {
      const r = readiness(cachedRows(), today);
      const n = r ? applyReadiness(r.pct, today) : 0;
      toast(n ? `${n} sets lowered by ${r.pct} %` : 'Nothing to change');
      renderHome(root);
    }
    if (b.dataset.go === 'backup') (canShareFiles() ? shareBackup() : downloadBackup()).then(() => renderHome(root));
    if (b.dataset.go === 'backup-later') { state.backupSnooze = Date.now(); save(); renderHome(root); }
  };
}

