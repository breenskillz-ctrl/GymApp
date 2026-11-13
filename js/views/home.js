// Home (start page, DECISIONS #57, #70): greeting, today's workout with one "Start" button, this week, latest record.
import { state, getDay, getExercise, dayDone, isPR, setHasData, warmupSets } from '../store.js';
import {
  esc, icon, dateKey, addDays, parseKey, fmtDate, fmtNum, go, toast,
} from '../utils.js';
import { profileName } from '../profile.js';
import { logState } from './log.js';
import { exLabel } from './seteditor.js';
import { setWeight } from '../blocks.js';
import { todayPlan, startTodayFlow, workoutName, weekdayOf, myBlock, myProgram } from '../today.js';
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

// The block's weeks as a strip (DECISIONS #72): done, this week, lighter weeks and the test week
function blockStrip(b, today) {
  const top = (wk) => Math.max(0, ...wk.days.flatMap((d) => d.items.filter((it) => it.kind === 'pct').flatMap((it) => it.sets.map((x) => x.pct || 0))));
  const tops = b.weeks.map(top);
  const n = b.weeks.length;
  const isTest = (i) => i === n - 1 && (b.templateId === 'bt-strength-12' || b.weeks[i].days.some((d) => /test/i.test(d.name)));
  const isLight = (i) => i > 0 && !isTest(i) && tops[i] < tops[i - 1] - 0.01;
  const cur = b.pos.w;
  const cells = b.weeks.map((_, i) => `<i class="${i < cur ? 'd' : i === cur ? 'c' : isTest(i) ? 't' : isLight(i) ? 'l' : ''}"></i>`).join('');
  const mon = addDays(today, -((parseKey(today).getDay() + 6) % 7));
  const nextLight = b.weeks.findIndex((_, i) => i > cur && isLight(i));
  const test = isTest(n - 1) ? n - 1 : -1;
  const facts = [
    isLight(cur) ? 'Lighter week now' : nextLight > 0 && `Lighter week ${nextLight - cur === 1 ? 'next week' : `in ${nextLight - cur} weeks`}`,
    test > cur && `test week starts ${fmtDate(addDays(mon, (test - cur) * 7), false)}`,
    test === cur && 'Test week',
  ].filter(Boolean);
  return `<div class="tc-block"><span>Week ${cur + 1} of ${n}</span><span class="tc-weeks">${cells}</span></div>
    ${facts.length ? `<div class="tc-facts">${facts.join(' · ')}</div>` : ''}`;
}

// The main lift of a block day, big: "Deadlift 3 × 5 · 155 kg" + the warm-up weights
function mainLiftHtml(b, it) {
  const ex = getExercise(it.ex);
  const work = it.sets.filter((x) => !x.amrap);
  const w = setWeight(b, it.ex, it.sets[0]);
  const wu = warmupSets(it.ex, Math.max(0, ...it.sets.map((x) => setWeight(b, it.ex, x) || 0)));
  const pct = it.sets[0].pct;
  return `<div class="tc-lift"><div class="tc-kick2">Main lift</div>
    <div class="tc-big">${esc(ex.name)} ${esc(blockItemText(b, it))}</div>
    <div class="tc-sub">${pct ? `${fmtNum(pct, 1)} %` : ''}${wu.length && state.settings.autoWarmup !== false ? ` · warm-up ${wu.map((x) => fmtNum(x.w, 2)).join(', ')}` : ''}${work.length < it.sets.length ? ' · last set AMRAP' : ''}</div></div>`;
}

function todayCardHtml(today) {
  const day = getDay(today);
  const wd = WD[parseKey(today).getDay()].toUpperCase();
  const block = myBlock();
  if (day?.entries.length) {
    const sets = day.entries.flatMap((e) => e.sets).filter((s) => s.lvl !== 'warmup' && setHasData(s));
    const done = sets.filter((s) => s.done).length;
    const main = day.entries.find((e) => e.block);
    const mw = main && main.sets.filter((s) => s.lvl !== 'warmup');
    const mainTxt = mw?.length ? `${getExercise(main.ex).name} ${mw.length} × ${mw[0].r} · ${fmtNum(mw[0].w, 2)} ${state.settings.unit}` : '';
    return `<section class="today-card">
      <div class="tc-kicker">Today · ${wd}${main ? ` · Week ${main.block.w + 1} Day ${main.block.d + 1}` : ''}</div>
      <h2 class="tc-title">${esc((workoutName(day) || 'Workout').replace(/^[A-Za-zæøåÆØÅ]{3,8}\s*·\s*/, ''))}</h2>
      ${mainTxt ? `<div class="tc-sub">Main lift: <b>${esc(mainTxt)}</b></div>` : ''}
      <div class="tc-row"><span>${day.entries.length} exercise${day.entries.length === 1 ? '' : 's'}</span><b>${done} of ${sets.length} sets done</b></div>
      <button class="btn primary block tc-btn" data-go="log">${icon('right')} ${done && done === sets.length ? 'Open workout' : 'Continue workout'}</button>
      ${block ? blockStrip(block, today) : ''}
    </section>`;
  }
  const plan = todayPlan(today);
  const pctItems = plan.bd ? plan.bd.day.items.filter((it) => it.kind === 'pct') : [];
  const rows = [];
  if (plan.bd) {
    for (const it of plan.bd.day.items) {
      if (pctItems[0] === it) continue;
      rows.push(`<div class="tc-row"><span>${esc(getExercise(it.ex).name)} <span class="muted">· block</span></span>
        <b>${esc(blockItemText(plan.block, it))}</b></div>`);
    }
  }
  if (plan.pick) {
    rows.push(`<div class="tc-row"><span>then a day from <b>${esc(plan.pick.name)}</b></span><b>you choose</b></div>`);
  }
  if (plan.workout) {
    const n = plan.workout.exercises.length;
    rows.push(`<div class="tc-row"><span>then <b>${esc(plan.workout.name.replace(/^\S+\s*[·.:-]?\s*/, ''))}</b> <span class="muted">· ${esc(plan.program.name)}</span></span>
      <b>${n} exercise${n === 1 ? '' : 's'}</b></div>`);
  }
  const title = plan.workout || plan.bd
    ? [plan.bd?.day.name.replace(/^[A-Za-zæøåÆØÅ]{3,8}\s*·\s*/, ''), plan.workout?.name.replace(/^\S+\s*/, '')].filter(Boolean).join(' + ')
    : 'Nothing planned';
  const has = rows.length || pctItems.length || plan.pick;
  return `<section class="today-card ${has ? '' : 'quiet'}">
    <div class="tc-kicker">Today · ${wd}${plan.bd ? ` · Week ${plan.bd.w + 1} Day ${plan.bd.d + 1}` : ''}</div>
    ${pctItems.length ? mainLiftHtml(plan.block, pctItems[0]) : `<h2 class="tc-title">${esc(title)}</h2>`}
    ${rows.join('') || (has ? '' : '<p class="muted tc-empty">A rest day – or add exercises yourself.</p>')}
    ${has ? `<button class="btn primary block tc-btn" data-go="start">${icon('plus')} Start today’s workout</button>`
    : `<button class="btn ghost block tc-btn" data-go="log">${icon('plus')} Open today’s log</button>`}
    ${block ? blockStrip(block, today) : ''}
  </section>`;
}

// Monday–Sunday with done / today / planned markers
function weekHtml(today) {
  const d = parseKey(today);
  const mon = addDays(today, -((d.getDay() + 6) % 7));
  const keys = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  const doneN = keys.filter(dayDone).length;
  const block = myBlock();
  const target = block ? block.weeks[block.pos.w].days.length
    : myProgram()?.workouts.filter((w) => weekdayOf(w.name) != null && w.exercises.some((x) => x.ex !== 'walking')).length || 0;
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
      startTodayFlow(today, () => {
        logState.date = today;
        go('log');
        toast('Today’s workout is ready – tap a set to log it');
      });
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

