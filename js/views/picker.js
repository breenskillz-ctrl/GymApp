// Modal for å velge én eller flere øvelser fra biblioteket.
import { GROUPS } from '../data.js';
import { allExercises } from '../store.js';
import { esc, openModal, icon } from '../utils.js';

export function exerciseListHtml(list, selected = new Set()) {
  if (!list.length) return '<p class="empty">Ingen øvelser funnet.</p>';
  let html = '';
  let group = null;
  const sorted = [...list].sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || a.name.localeCompare(b.name, 'nb'));
  for (const ex of sorted) {
    if (ex.group !== group) {
      group = ex.group;
      html += `<div class="list-heading">${esc(group || 'Annet')}</div>`;
    }
    html += `
      <button class="list-item ${selected.has(ex.id) ? 'selected' : ''}" data-ex="${esc(ex.id)}">
        <span class="avatar">${esc(ex.name[0])}</span>
        <span class="grow">
          <span class="title">${esc(ex.name)}</span>
          <span class="sub">${esc(ex.equip)}${ex.builtin ? '' : ' · Egen øvelse'}</span>
        </span>
        <span class="check">${icon('check')}</span>
      </button>`;
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
    <button class="chip ${!active ? 'active' : ''}" data-group="">Alle</button>
    ${GROUPS.map((g) => `<button class="chip ${active === g ? 'active' : ''}" data-group="${esc(g)}">${esc(g)}</button>`).join('')}
  </div>`;
}

export function openExercisePicker({ title = 'Legg til øvelser', multi = true, onPick }) {
  const selected = new Set();
  let query = '';
  let group = '';

  openModal(`
    <div class="modal-head">
      <h2>${esc(title)}</h2>
      <button class="icon-btn" data-close aria-label="Lukk">${icon('close')}</button>
    </div>
    <input class="input search" type="search" placeholder="Søk etter øvelse…" autocomplete="off">
    <div class="chip-wrap"></div>
    <div class="list scroll"></div>
    ${multi ? '<button class="btn primary block" data-add disabled>Velg øvelser</button>' : ''}
  `, {
    className: 'tall',
    onMount(m, close) {
      const list = m.querySelector('.list');
      const chipWrap = m.querySelector('.chip-wrap');
      const addBtn = m.querySelector('[data-add]');
      const render = () => {
        chipWrap.innerHTML = groupChips(group);
        list.innerHTML = exerciseListHtml(filterExercises(query, group), selected);
        if (addBtn) {
          addBtn.disabled = !selected.size;
          addBtn.textContent = selected.size ? `Legg til ${selected.size} øvelse${selected.size > 1 ? 'r' : ''}` : 'Velg øvelser';
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
