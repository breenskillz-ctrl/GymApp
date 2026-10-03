// Records page (DECISIONS #49): every exercise's personal records in one place, the latest PRs on top.
import { state, getExercise, setHasData } from '../store.js';
import { GROUPS, GROUP_COLORS, SET_TAGS } from '../data.js';
import { esc, icon, topBar, fmtDate, fmtNum, fmtTime, e1rm } from '../utils.js';
import { openExerciseDetail } from './exercises.js';
import { exLabel } from './seteditor.js';

const REP_MAXES = [1, 3, 5, 10]; // "3RM" = heaviest weight lifted for at least 3 reps
let query = '';

// The score that decides a PR, per exercise type (same rule as isPR in store.js)
const score = (ex, s) => (ex.type === 'wr' ? e1rm(s.w, s.r) || 0 : ex.type === 'r' ? s.r || 0 : ex.type === 't' ? s.t || 0 : s.d || 0);

// One pass over the log: per exercise the best values and every day it set a new PR
function collect() {
  const byEx = {};
  for (const date of Object.keys(state.log).sort()) {
    for (const e of state.log[date].entries) {
      const sets = e.sets.filter((s) => s.done && setHasData(s) && s.lvl !== 'warmup');
      if (!sets.length) continue;
      (byEx[e.ex] ||= []).push({ date, sets });
    }
  }
  const list = [];
  const events = [];
  for (const [id, days] of Object.entries(byEx)) {
    const ex = getExercise(id);
    const rec = { id, ex, best: null, heaviest: null, rm: {}, variants: {}, sessions: days.length };
    let top = 0;
    days.forEach(({ date, sets }, i) => {
      const best = sets.reduce((a, b) => (score(ex, b) > score(ex, a) ? b : a));
      const v = score(ex, best);
      if (v > top) {
        if (i > 0) events.push({ id, ex, date, set: best });
        top = v;
        rec.best = { set: best, date };
      }
      for (const s of sets) {
        // Best set per variant (paused, beltless …), shown on its own line (DECISIONS #51)
        for (const t of s.tags || []) {
          const cur = rec.variants[t];
          if (!cur || score(ex, s) > score(ex, cur.set)) rec.variants[t] = { set: s, date };
        }
        if (!s.w) continue;
        if (!rec.heaviest || s.w > rec.heaviest.set.w) rec.heaviest = { set: s, date };
        for (const n of REP_MAXES) if ((s.r || 0) >= n && s.w > (rec.rm[n]?.w || 0)) rec.rm[n] = { w: s.w, date };
      }
    });
    if (rec.best) list.push(rec);
  }
  events.sort((a, b) => b.date.localeCompare(a.date));
  return { list, events };
}

const u = () => state.settings.unit;

function setText(ex, s) {
  if (ex.type === 'wr') return s.w ? `${fmtNum(s.w, 2)} ${u()} × ${s.r ?? '–'}` : `${s.r} reps`;
  if (ex.type === 'r') return `${s.r} reps`;
  if (ex.type === 't') return fmtTime(s.t);
  return `${fmtNum(s.d, 2)} km${s.t ? ` · ${fmtTime(s.t)}` : ''}`;
}

// The big number on the right: estimated 1RM for weighted lifts, otherwise the best set
function headline(r) {
  const s = r.best.set;
  if (r.ex.type === 'wr' && s.w) return `<b>${fmtNum(e1rm(s.w, s.r), 1)}</b><small>${u()} e1RM</small>`;
  return `<b>${esc(setText(r.ex, s))}</b>`;
}

function rowHtml(r) {
  // Always 1RM, 3RM, 5RM and 10RM for weighted lifts (the user's choice); "–" when not lifted for that many reps yet
  const rms = r.heaviest
    ? REP_MAXES.map((n) => `<span>${n}RM <b>${r.rm[n] ? fmtNum(r.rm[n].w, 2) : '–'}</b></span>`).join('')
    : '';
  const sub = r.ex.type === 'wr' && r.best.set.w ? `Best set ${setText(r.ex, r.best.set)}` : `${r.sessions} session${r.sessions === 1 ? '' : 's'}`;
  const vars = SET_TAGS.filter((t) => r.variants[t.id])
    .map((t) => `<span>${t.label} <b>${esc(setText(r.ex, r.variants[t.id].set))}</b></span>`).join('');
  return `<button class="rec-row" data-ex="${esc(r.id)}">
    <span class="grow"><span class="title">${esc(exLabel(r.ex))}</span>
      <span class="sub">${esc(sub)} · ${fmtDate(r.best.date, false)}</span>
      ${rms ? `<span class="rec-rms">${rms}</span>` : ''}
      ${vars ? `<span class="rec-rms rec-vars">${vars}</span>` : ''}</span>
    <span class="rec-val">${headline(r)}</span>
  </button>`;
}

function listHtml(list) {
  const q = query.trim().toLowerCase();
  const shown = q ? list.filter((r) => exLabel(r.ex).toLowerCase().includes(q)) : list;
  if (!shown.length) return `<p class="empty">${list.length ? 'No exercise matches your search.' : 'Your records will appear here once you start logging.'}</p>`;
  return GROUPS.map((g) => {
    const rows = shown.filter((r) => (r.ex.group || 'Other') === g).sort((a, b) => exLabel(a.ex).localeCompare(exLabel(b.ex), 'en'));
    if (!rows.length) return '';
    return `<h2 class="rec-group"><i class="gdot" style="--c:${GROUP_COLORS[g]}"></i>${esc(g)}<span>${rows.length}</span></h2>
      <div class="rec-list">${rows.map(rowHtml).join('')}</div>`;
  }).join('');
}

export function renderRecords(root) {
  const { list, events } = collect();
  const yearStart = `${new Date().getFullYear()}-01-01`;
  const thisYear = events.filter((x) => x.date >= yearStart).length;
  const latest = events.slice(0, 5);

  root.innerHTML = `
    ${topBar('Records')}
    <section class="rec-top">
      <div class="hello-stats"><span><b>${list.length}</b> exercises</span><span><b>${thisYear}</b> PRs this year</span></div>
      ${latest.length ? `<h3 class="rec-head">Latest PRs</h3>
      <div class="rec-latest">${latest.map((x) => `<button class="rec-new" data-ex="${esc(x.id)}">
        ${icon('trophy')}<span class="grow"><span class="title">${esc(exLabel(x.ex))}</span>
        <span class="sub">${fmtDate(x.date, false)}</span></span><strong>${esc(setText(x.ex, x.set))}</strong></button>`).join('')}</div>` : ''}
    </section>
    <input class="input search rec-search" type="search" placeholder="Search records…" value="${esc(query)}">
    <div class="rec-all">${listHtml(list)}</div>`;

  root.querySelector('.rec-search').oninput = (e) => {
    query = e.target.value;
    root.querySelector('.rec-all').innerHTML = listHtml(list);
  };
  root.onclick = (e) => {
    const b = e.target.closest('[data-ex]');
    if (b) openExerciseDetail(b.dataset.ex);
  };
}
