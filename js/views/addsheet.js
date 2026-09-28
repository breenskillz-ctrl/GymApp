// The "Exercises" sheet: quick actions, muscle groups, and GymKeeper-style exercise lists with filter chips.
// mode 'add'    (+ button): tapping an exercise adds it to `date`.
// mode 'browse' (Exercises page): tapping an exercise opens its details.
import { GROUPS, GROUP_COLORS, SUBGROUPS } from '../data.js';
import {
  state, save, getDay, cleanupDay, addEntry, allExercises, getExercise, daysSinceGroups, recentExercises, dayHasWork,
  lastDoneMap, isFavorite, toggleFavorite, deleteExercise,
} from '../store.js';
import {
  esc, icon, openModal, fmtDate, promptDialog, menuDialog, confirmDialog, toast, dateKey, parseKey,
} from '../utils.js';
import { groupIcon, exerciseThumb } from '../icons.js';
import {
  openExerciseEditor, openExerciseDetail, openProgressionDialog, hasRange, progressionText,
} from './exercises.js';
import { openProgramsSheet } from './programs.js';
import { exLabel } from './seteditor.js';

const daysAgo = (from, to) => Math.round((parseKey(to) - parseKey(from)) / 86400000);
const daysText = (n) => (n == null ? '' : n === 0 ? 'today' : `${n} day${n === 1 ? '' : 's'}`);

// One exercise row: thumbnail (★ if favourite), "Name · Equipment", days since last done, ⋮
export function exItemHtml(ex, last, today) {
  const n = last ? daysAgo(last, today) : null;
  return `<div class="ex-item" data-ex="${esc(ex.id)}" role="button" tabindex="0">
    <span class="thumb-wrap">${exerciseThumb(ex)}${isFavorite(ex.id) ? '<span class="fav-star">★</span>' : ''}</span>
    <span class="name">${esc(exLabel(ex))}</span>
    <span class="days ${n != null && n > 14 ? 'old' : ''}">${daysText(n)}</span>
    <button class="icon-btn" data-exmenu="${esc(ex.id)}" aria-label="Exercise menu">${icon('more')}</button>
  </div>`;
}

// ⋮ menu for one exercise
export async function exerciseMenu(id, refresh) {
  const ex = getExercise(id);
  const items = [
    { value: 'fav', label: isFavorite(id) ? 'Remove from favourites' : 'Add to favourites', icon: 'trophy' },
    { value: 'info', label: 'History and records', icon: 'chart' },
  ];
  if (hasRange(ex)) items.push({ value: 'range', label: `Rep range ${progressionText(id)}`, icon: 'edit' });
  if (!ex.builtin) items.push({ value: 'edit', label: 'Edit', icon: 'edit' }, { value: 'del', label: 'Delete', icon: 'trash', danger: true });
  const v = await menuDialog(exLabel(ex), items);
  if (v === 'fav') { toggleFavorite(id); refresh(); }
  if (v === 'info') openExerciseDetail(id, refresh);
  if (v === 'range') openProgressionDialog(id, refresh);
  if (v === 'edit') openExerciseEditor(ex, refresh);
  if (v === 'del' && await confirmDialog(`Delete "${ex.name}"? Logged sets are kept.`)) {
    deleteExercise(id);
    toast('Exercise deleted');
    refresh();
  }
}

// Muscle-group rows with days since last trained
export function groupRowsHtml(date) {
  const days = daysSinceGroups(date || dateKey());
  return GROUPS.map((g) => `
    <div class="group-row" data-group="${esc(g)}" role="button" tabindex="0">
      ${groupIcon(g, 40)}
      <span class="name">${esc(g)}</span>
      <span class="days">${daysText(days[g])}</span>
      <button class="icon-btn" data-gmenu="${esc(g)}" aria-label="${esc(g)} menu">${icon('more')}</button>
    </div>`).join('');
}

/**
 * @param {string|null} date   the day to add to (mode 'add')
 * @param {Function} onAdded   called with the new entry (or nothing) after something was added
 * @param {{mode?: 'add'|'browse', page?: object}} opts
 */
export function openAddSheet(date, onAdded, { mode = 'add', page: startPage = null } = {}) {
  const home = { kind: 'home' };
  let page = startPage || home;
  let query = '';
  const filter = { fav: false, sub: '', equip: '' };

  openModal('<div class="sheet-body editor"></div><button class="close-float" data-close>Close</button>', {
    className: 'sheet',
    onMount(m, close) {
      const body = m.querySelector('.sheet-body');
      const today = date || dateKey();

      const header = (title, back) => `
        <div class="modal-head">
          ${back ? `<button class="icon-btn" data-back aria-label="Back">${icon('left')}</button>` : ''}
          <h2 class="grow">${esc(title)}</h2>
          <div class="actions">
            <button class="icon-btn" data-new aria-label="New exercise">${icon('plus')}</button>
            <button class="icon-btn" data-search aria-label="Search">${icon('search')}</button>
          </div>
        </div>`;

      const chipsHtml = (list, group) => {
        const color = GROUP_COLORS[group];
        const subs = (SUBGROUPS[group] || []).filter((s) => list.some((e) => e.sub === s));
        const equips = [...new Set(list.map((e) => e.equip))];
        return `<div class="filter-chips">
          <button class="fchip star ${filter.fav ? 'on' : ''}" data-f="fav">★</button>
          ${subs.map((s) => `<button class="fchip sub ${filter.sub === s ? 'on' : ''}" style="--c:${color}" data-f="sub" data-v="${esc(s)}">${esc(s)}</button>`).join('')}
          ${equips.map((q) => `<button class="fchip ${filter.equip === q ? 'on' : ''}" data-f="equip" data-v="${esc(q)}">${esc(q)}</button>`).join('')}
        </div>`;
      };

      const draw = () => {
        const back = page !== home && !(startPage && page === startPage && mode === 'browse');
        if (page.kind === 'home') {
          body.innerHTML = `${header('Exercises', false)}
            <div class="scroll">
              ${mode === 'add' ? `<div class="quick-tiles">
                <button class="quick-tile qt-program" data-q="program">${icon('flex')}From program</button>
                <button class="quick-tile qt-day" data-q="day">${icon('calendar')}From another day</button>
                <button class="quick-tile qt-recent" data-q="recent">${icon('history')}Recent exercises</button>
                <button class="quick-tile qt-comment" data-q="comment">${icon('comment')}${getDay(date)?.title ? 'Edit comment' : 'Add comment'}</button>
              </div>` : ''}
              ${groupRowsHtml(date)}
            </div>`;
          return;
        }
        const last = lastDoneMap();
        let list = [];
        let title = '';
        let chips = '';
        if (page.kind === 'group') {
          title = page.group;
          const all = allExercises().filter((e) => e.group === page.group);
          chips = chipsHtml(all, page.group);
          list = all.filter((e) => (!filter.fav || isFavorite(e.id)) && (!filter.sub || e.sub === filter.sub) && (!filter.equip || e.equip === filter.equip));
        } else if (page.kind === 'recent') {
          title = 'Recent exercises';
          list = recentExercises().map(getExercise);
        } else if (page.kind === 'search') {
          title = 'Search';
          const q = query.trim().toLowerCase();
          list = q ? allExercises().filter((e) => `${e.name} ${e.equip} ${e.group} ${e.sub || ''}`.toLowerCase().includes(q)) : [];
        }
        // Favourites first, otherwise keep the curated order
        if (page.kind !== 'recent') list = [...list.filter((e) => isFavorite(e.id)), ...list.filter((e) => !isFavorite(e.id))];
        const empty = page.kind === 'search' && !query.trim() ? 'Type to search all exercises.' : 'No exercises here.';
        body.innerHTML = `${header(title, back)}
          ${page.kind === 'search' ? `<input class="input search" type="search" placeholder="Search exercises…" value="${esc(query)}">` : ''}
          <div class="scroll">${chips}<div class="list">${list.length ? list.map((e) => exItemHtml(e, last[e.id], today)).join('') : `<p class="empty">${empty}</p>`}</div></div>`;
        const s = body.querySelector('.search');
        if (s) {
          s.focus();
          s.setSelectionRange(s.value.length, s.value.length);
          s.oninput = () => {
            query = s.value;
            const pos = s.selectionStart;
            draw();
            body.querySelector('.search').setSelectionRange(pos, pos);
          };
        }
      };

      const newExercise = (group) => openExerciseEditor(
        group ? { name: '', group, equip: 'Other', type: 'wr', desc: '', isNew: true } : null, draw,
      );

      body.addEventListener('click', async (e) => {
        if (e.target.closest('[data-back]')) { page = home; draw(); return; }
        if (e.target.closest('[data-search]')) { page = { kind: 'search' }; draw(); return; }
        if (e.target.closest('[data-new]')) { newExercise(page.kind === 'group' ? page.group : null); return; }

        const chip = e.target.closest('[data-f]');
        if (chip) {
          const f = chip.dataset.f;
          if (f === 'fav') filter.fav = !filter.fav;
          else filter[f] = filter[f] === chip.dataset.v ? '' : chip.dataset.v;
          draw();
          return;
        }
        const exMenu = e.target.closest('[data-exmenu]');
        if (exMenu) { exerciseMenu(exMenu.dataset.exmenu, draw); return; }
        const gm = e.target.closest('[data-gmenu]');
        if (gm) {
          const grp = gm.dataset.gmenu;
          const v = await menuDialog(grp, [
            { value: 'open', label: 'Show exercises', icon: 'list' },
            { value: 'new', label: `New ${grp.toLowerCase()} exercise`, icon: 'plus' },
          ]);
          if (v === 'open') { page = { kind: 'group', group: grp }; Object.assign(filter, { fav: false, sub: '', equip: '' }); draw(); }
          if (v === 'new') newExercise(grp);
          return;
        }
        const g = e.target.closest('[data-group]');
        if (g) { page = { kind: 'group', group: g.dataset.group }; Object.assign(filter, { fav: false, sub: '', equip: '' }); draw(); return; }
        const exRow = e.target.closest('[data-ex]');
        if (exRow) {
          if (mode === 'browse') { openExerciseDetail(exRow.dataset.ex, draw); return; }
          const entry = addEntry(date, exRow.dataset.ex);
          close();
          onAdded?.(entry);
          return;
        }
        const q = e.target.closest('[data-q]')?.dataset.q;
        if (q === 'recent') { page = { kind: 'recent' }; draw(); }
        if (q === 'program') openProgramsSheet({ date, onAdded: () => { close(); onAdded?.(); } });
        if (q === 'day') openCopyDay(date, () => { close(); onAdded?.(); });
        if (q === 'comment') {
          const day = getDay(date);
          const text = await promptDialog('Comment', day?.title || '', { placeholder: 'E.g. Friday Lower + Hypers' });
          if (text == null) return;
          getDay(date, true).title = text;
          cleanupDay(date);
          save();
          close();
          onAdded?.();
        }
      });
      draw();
    },
  });
}

// Copy the exercises of another day as planned sets
function openCopyDay(date, onDone) {
  const dates = Object.keys(state.log).filter((k) => k !== date && dayHasWork(k)).sort().reverse().slice(0, 60);
  openModal(`
    <div class="modal-head"><h2>From another day</h2>
      <button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>
    <div class="list scroll">
      ${dates.length ? dates.map((k) => {
        const d = state.log[k];
        return `<button class="list-item" data-date="${k}">
          <span class="grow"><span class="title">${esc(d.title || fmtDate(k))}</span>
          <span class="sub">${d.title ? fmtDate(k) + ' · ' : ''}${d.entries.map((x) => esc(getExercise(x.ex).name)).join(', ')}</span></span>
          ${icon('right')}</button>`;
      }).join('') : '<p class="empty">You have no other workout days yet.</p>'}
    </div>`, {
    className: 'tall',
    onMount(m, close) {
      m.addEventListener('click', (e) => {
        const b = e.target.closest('[data-date]');
        if (!b) return;
        const src = state.log[b.dataset.date];
        const day = getDay(date, true);
        if (!day.title && src.title) day.title = src.title;
        for (const x of src.entries) {
          const entry = addEntry(date, x.ex, null, false);
          entry.sets = x.sets.filter((s) => s.done).map((s) => ({ w: s.w ?? null, r: s.r ?? null, t: s.t ?? null, d: s.d ?? null, done: false, lvl: s.lvl }));
        }
        save();
        close();
        toast('Workout copied – tap a set to log it');
        onDone?.();
      });
    },
  });
}
