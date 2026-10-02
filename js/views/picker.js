// Modal for picking one or more exercises from the library.
import { GROUPS, GROUP_COLORS } from '../data.js';
import { allExercises } from '../store.js';
import { esc, openModal, icon } from '../utils.js';
import { exerciseThumb } from '../icons.js';
import { exLabel } from './seteditor.js';

// One exercise row with its thumbnail
export function exRowHtml(ex, selected = false) {
  return `<button class="ex-row ${selected ? 'selected' : ''}" data-ex="${esc(ex.id)}">
    ${exerciseThumb(ex)}
    <span class="grow"><span class="title">${esc(exLabel(ex))}</span>
    <span class="sub">${esc(ex.group)}${ex.builtin ? '' : ' · Custom'}</span></span>
    <span class="check">${icon('check')}</span>
  </button>`;
}

// Exercises grouped under muscle-group headings
export function exerciseListHtml(list, selected = new Set()) {
  if (!list.length) return '<p class="empty">No exercises found.</p>';
  let html = '';
  let group = null;
  const sorted = [...list].sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group));
  for (const ex of sorted) {
    if (ex.group !== group) {
      group = ex.group;
      html += `<div class="list-heading row gap"><i class="gdot" style="--c:${GROUP_COLORS[group] || GROUP_COLORS.Other}"></i>${esc(group || 'Other')}</div>`;
    }
    html += exRowHtml(ex, selected.has(ex.id));
  }
  return html;
}

export function filterExercises(query, group) {
  const q = query.trim().toLowerCase();
  return allExercises().filter((e) => (!group || e.group === group)
    && (!q || e.name.toLowerCase().includes(q) || e.equip.toLowerCase().includes(q) || e.group.toLowerCase().includes(q)));
}

export function groupChips(active) {
  return `<div class="chips">
    <button class="chip ${!active ? 'active' : ''}" data-group="">All</button>
    ${GROUPS.map((g) => `<button class="chip ${active === g ? 'active' : ''}" data-group="${esc(g)}">${esc(g)}</button>`).join('')}
  </div>`;
}

export function openExercisePicker({ title = 'Add exercises', multi = true, onPick }) {
  const selected = new Set();
  let query = '';
  let group = '';

  openModal(`
    <div class="modal-head">
      <h2>${esc(title)}</h2>
      <button class="icon-btn" data-close aria-label="Close">${icon('close')}</button>
    </div>
    <input class="input search" type="search" placeholder="Search exercises…" autocomplete="off">
    <div class="chip-wrap"></div>
    <div class="list scroll"></div>
    ${multi ? '<button class="btn primary block" data-add disabled>Select exercises</button>' : ''}
  `, {
    className: 'sheet',
    onMount(m, close) {
      const list = m.querySelector('.list');
      const chipWrap = m.querySelector('.chip-wrap');
      const addBtn = m.querySelector('[data-add]');
      const render = () => {
        chipWrap.innerHTML = groupChips(group);
        list.innerHTML = exerciseListHtml(filterExercises(query, group), selected);
        if (addBtn) {
          addBtn.disabled = !selected.size;
          addBtn.textContent = selected.size ? `Add ${selected.size} exercise${selected.size > 1 ? 's' : ''}` : 'Select exercises';
        }
      };
      m.querySelector('.search').addEventListener('input', (e) => { query = e.target.value; render(); });
      chipWrap.addEventListener('click', (e) => {
        const c = e.target.closest('[data-group]');
        if (c) { group = c.dataset.group; render(); }
      });
      list.addEventListener('click', (e) => {
        const b = e.target.closest('[data-ex]');
        if (!b) return;
        const id = b.dataset.ex;
        if (!multi) { close(); onPick([id]); return; }
        if (selected.has(id)) selected.delete(id); else selected.add(id);
        render();
      });
      addBtn?.addEventListener('click', () => { close(); onPick([...selected]); });
      render();
    },
  });
}
