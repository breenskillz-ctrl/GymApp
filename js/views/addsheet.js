// The "Exercises" sheet opened by the + button: quick actions, muscle groups, exercise lists and search.
import { GROUPS } from '../data.js';
import {
  state, save, getDay, cleanupDay, addEntry, allExercises, getExercise, daysSinceGroups, recentExercises, dayHasWork,
} from '../store.js';
import { esc, icon, openModal, fmtDate, promptDialog, menuDialog, toast } from '../utils.js';
import { groupIcon } from '../icons.js';
import { exRowHtml } from './picker.js';
import { openExerciseEditor } from './exercises.js';
import { openProgramsSheet } from './programs.js';

/**
 * @param {string} date     the day to add to
 * @param {Function} onAdded called with the new entry (or nothing) after something was added
 */
export function openAddSheet(date, onAdded) {
  let page = { kind: 'home' };
  let query = '';

  openModal('<div class="sheet-body editor"></div><button class="close-float" data-close>Close</button>', {
    className: 'sheet',
    onMount(m, close) {
      const body = m.querySelector('.sheet-body');

      const header = (title, back = false) => `
        <div class="modal-head">
          ${back ? `<button class="icon-btn" data-back aria-label="Back">${icon('left')}</button>` : ''}
          <h2 class="grow">${esc(title)}</h2>
          <div class="actions">
            <button class="icon-btn" data-new aria-label="New exercise">${icon('plus')}</button>
            <button class="icon-btn" data-search aria-label="Search">${icon('search')}</button>
          </div>
        </div>`;

      const draw = () => {
        if (page.kind === 'home') {
          const days = daysSinceGroups(date);
          body.innerHTML = `${header('Exercises')}
            <div class="scroll">
              <div class="quick-tiles">
                <button class="quick-tile qt-program" data-q="program">${icon('flex')}From program</button>
                <button class="quick-tile qt-day" data-q="day">${icon('calendar')}From another day</button>
                <button class="quick-tile qt-recent" data-q="recent">${icon('history')}Recent exercises</button>
                <button class="quick-tile qt-comment" data-q="comment">${icon('comment')}${getDay(date)?.title ? 'Edit comment' : 'Add comment'}</button>
              </div>
              ${GROUPS.map((g) => `
                <button class="group-row" data-group="${esc(g)}">
                  ${groupIcon(g, 40)}
                  <span class="name">${esc(g)}</span>
                  <span class="days">${days[g] == null ? '' : days[g] === 0 ? 'today' : `${days[g]} day${days[g] === 1 ? '' : 's'}`}</span>
                  <span class="icon-btn" data-gmenu="${esc(g)}" role="button" aria-label="${esc(g)} menu">${icon('more')}</span>
                </button>`).join('')}
            </div>`;
          return;
        }
        let list = [];
        let title = '';
        if (page.kind === 'group') {
          title = page.group;
          list = allExercises().filter((e) => e.group === page.group);
        } else if (page.kind === 'recent') {
          title = 'Recent exercises';
          list = recentExercises().map(getExercise);
        } else if (page.kind === 'search') {
          title = 'Search';
          const q = query.trim().toLowerCase();
          list = allExercises().filter((e) => !q || `${e.name} ${e.equip} ${e.group}`.toLowerCase().includes(q));
        }
        body.innerHTML = `${header(title, true)}
          ${page.kind === 'search' ? `<input class="input search" type="search" placeholder="Search exercises…" value="${esc(query)}">` : ''}
          <div class="list scroll">${list.length ? list.map((e) => exRowHtml(e)).join('') : '<p class="empty">Nothing here yet.</p>'}</div>`;
        const s = body.querySelector('.search');
        if (s) {
          s.focus();
          s.setSelectionRange(s.value.length, s.value.length);
          s.oninput = () => { query = s.value; const pos = s.selectionStart; draw(); const n = body.querySelector('.search'); n.setSelectionRange(pos, pos); };
        }
      };

      body.addEventListener('click', async (e) => {
        if (e.target.closest('[data-back]')) { page = { kind: 'home' }; draw(); return; }
        if (e.target.closest('[data-search]')) { page = { kind: 'search' }; draw(); return; }
        if (e.target.closest('[data-new]')) {
          openExerciseEditor(page.kind === 'group' ? { name: '', group: page.group, equip: 'Other', type: 'wr', desc: '', isNew: true } : null, draw);
          return;
        }
        const gm = e.target.closest('[data-gmenu]');
        if (gm) {
          const grp = gm.dataset.gmenu;
          const v = await menuDialog(grp, [
            { value: 'open', label: 'Show exercises', icon: 'list' },
            { value: 'new', label: `New ${grp.toLowerCase()} exercise`, icon: 'plus' },
          ]);
          if (v === 'open') { page = { kind: 'group', group: grp }; draw(); }
          if (v === 'new') openExerciseEditor({ name: '', group: grp, equip: 'Other', type: 'wr', desc: '', isNew: true }, draw);
          return;
        }
        const g = e.target.closest('[data-group]');
        if (g) { page = { kind: 'group', group: g.dataset.group }; draw(); return; }
        const exBtn = e.target.closest('[data-ex]');
        if (exBtn) {
          const entry = addEntry(date, exBtn.dataset.ex);
          close();
          onAdded?.(entry);
          return;
        }
        const q = e.target.closest('[data-q]')?.dataset.q;
        if (q === 'recent') { page = { kind: 'recent' }; draw(); }
        if (q === 'program') {
          openProgramsSheet({ date, onAdded: () => { close(); onAdded?.(); } });
        }
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
          const entry = addEntry(date, x.ex);
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
