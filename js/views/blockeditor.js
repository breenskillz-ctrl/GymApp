// Editor for the user's own block templates: weeks × days × exercises (DECISIONS #23).
// Items: { ex, kind: 'pct', count, reps, pct, amrapLast } or { ex, kind: 'normal', sets, reps }.
import { state, save, getExercise } from '../store.js';
import { esc, icon, openModal, toast, confirmDialog, uid } from '../utils.js';
import { openExercisePicker } from './picker.js';

const clone = (x) => JSON.parse(JSON.stringify(x));
const newDay = (i) => ({ name: `Day ${i + 1}`, items: [] });

export function openBlockEditor(template, onSave) {
  const editing = !!template;
  const t = editing ? clone(template) : { name: '', desc: '', weeks: [{ days: [newDay(0), newDay(1), newDay(2)] }] };

  const itemHtml = (it, w, d, i) => {
    const ex = getExercise(it.ex);
    const pct = it.kind === 'pct';
    return `<div class="be-item" data-w="${w}" data-d="${d}" data-i="${i}">
      <div class="row gap">
        <span class="grow title">${esc(ex.name)}${ex.equip && !['Other', 'Bodyweight'].includes(ex.equip) ? ` <span class="muted">· ${esc(ex.equip)}</span>` : ''}</span>
        <button type="button" class="icon-btn sm" data-x="del" aria-label="Remove">${icon('close')}</button>
      </div>
      <div class="row gap be-fields">
        <select class="input be-kind" data-f="kind">
          <option value="pct" ${pct ? 'selected' : ''}>% of 1RM</option>
          <option value="normal" ${pct ? '' : 'selected'}>Normal progression</option>
        </select>
        <input class="input tiny" data-f="${pct ? 'count' : 'sets'}" type="number" min="1" value="${pct ? it.count : it.sets}" aria-label="Sets">
        <span class="muted">×</span>
        <input class="input tiny" data-f="reps" type="number" min="1" value="${it.reps}" aria-label="Reps">
        ${pct ? `<span class="muted">@</span><input class="input tiny" data-f="pct" type="number" min="1" max="120" value="${it.pct}" aria-label="Percent"><span class="muted">%</span>` : ''}
      </div>
      ${pct ? `<label class="switch small"><input type="checkbox" data-f="amrapLast" ${it.amrapLast ? 'checked' : ''}> Last set AMRAP (+)</label>` : ''}
    </div>`;
  };

  const html = () => `
    <div class="modal-head">
      <button class="icon-btn" data-close aria-label="Close">${icon('close')}</button>
      <h2 class="grow">${editing ? 'Edit block' : 'New block'}</h2>
      <button class="text-btn accent" data-save>Save</button>
    </div>
    <div class="scroll form">
      <label>Name<input class="input" data-top="name" value="${esc(t.name)}" placeholder="E.g. Bench peaking 4 weeks"></label>
      <label>Description<input class="input" data-top="desc" value="${esc(t.desc || '')}" placeholder="Optional"></label>
      <p class="sub">"% of 1RM" uses the 1RM and base % you enter when you start the block. "Normal progression" uses the exercise's rep range.
        ${editing ? 'Changes apply to blocks you start from now on.' : ''}</p>
      ${t.weeks.map((wk, w) => `
        <div class="be-week">
          <div class="row between"><h3>Week ${w + 1}</h3>
            <div class="row">
              ${w > 0 ? `<button type="button" class="btn ghost sm" data-wk="copy" data-w="${w}">${icon('copy')} Copy week ${w}</button>` : ''}
              ${t.weeks.length > 1 ? `<button type="button" class="icon-btn sm" data-wk="del" data-w="${w}" aria-label="Delete week">${icon('trash')}</button>` : ''}
            </div>
          </div>
          ${wk.days.map((dy, d) => `
            <div class="card be-day">
              <div class="row gap">
                <input class="input grow" data-dayname data-w="${w}" data-d="${d}" value="${esc(dy.name)}">
                ${wk.days.length > 1 ? `<button type="button" class="icon-btn sm" data-dy="del" data-w="${w}" data-d="${d}" aria-label="Delete day">${icon('trash')}</button>` : ''}
              </div>
              ${dy.items.map((it, i) => itemHtml(it, w, d, i)).join('')}
              <button type="button" class="btn ghost sm" data-dy="add" data-w="${w}" data-d="${d}">${icon('plus')} Add exercises</button>
            </div>`).join('')}
          <button type="button" class="btn ghost sm" data-wk="addday" data-w="${w}">${icon('plus')} Add day</button>
        </div>`).join('')}
      <button type="button" class="btn ghost block" data-addweek>${icon('plus')} Add week (copies the last week)</button>
      ${editing ? `<button type="button" class="btn danger block" data-deltpl>${icon('trash')} Delete this block template</button>` : ''}
    </div>`;

  openModal('<div class="editor"></div>', {
    className: 'sheet',
    onMount(m, close) {
      const box = m.querySelector('.editor');
      const draw = () => {
        const st = box.querySelector('.scroll')?.scrollTop || 0;
        box.innerHTML = html();
        box.querySelector('.scroll').scrollTop = st;
      };
      const itemOf = (el) => {
        const r = el.closest('[data-i]');
        return r && t.weeks[+r.dataset.w].days[+r.dataset.d].items[+r.dataset.i];
      };
      const onField = (e) => {
        const el = e.target;
        if (el.dataset.top) t[el.dataset.top] = el.value;
        if (el.hasAttribute('data-dayname')) t.weeks[+el.dataset.w].days[+el.dataset.d].name = el.value;
        const it = itemOf(el);
        const f = el.dataset.f;
        if (!it || !f) return;
        if (f === 'kind') {
          const n = it.count || it.sets || 3;
          Object.keys(it).forEach((k) => { if (k !== 'ex' && k !== 'reps') delete it[k]; });
          Object.assign(it, el.value === 'pct' ? { kind: 'pct', count: n, pct: 75 } : { kind: 'normal', sets: n });
          draw();
        } else if (f === 'amrapLast') it.amrapLast = el.checked;
        else it[f] = Number(el.value) || null;
      };
      box.addEventListener('input', onField);
      box.addEventListener('change', (e) => { if (e.target.dataset.f === 'kind' || e.target.type === 'checkbox') onField(e); });

      box.addEventListener('click', async (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        const w = +b.dataset.w;
        const d = +b.dataset.d;
        if (b.dataset.x === 'del') {
          const r = b.closest('[data-i]');
          t.weeks[+r.dataset.w].days[+r.dataset.d].items.splice(+r.dataset.i, 1);
          draw();
        } else if (b.dataset.dy === 'add') {
          openExercisePicker({
            onPick(ids) {
              ids.forEach((id) => {
                const ex = getExercise(id);
                const items = t.weeks[w].days[d].items;
                // The first weighted exercise of a day is the main lift (% of 1RM); the rest are accessories
                items.push(ex.type === 'wr' && !items.some((x) => x.kind === 'pct')
                  ? { ex: id, kind: 'pct', count: 3, reps: 5, pct: 75 }
                  : { ex: id, kind: 'normal', sets: 3, reps: 10 });
              });
              draw();
            },
          });
        } else if (b.dataset.dy === 'del') {
          t.weeks[w].days.splice(d, 1);
          draw();
        } else if (b.dataset.wk === 'addday') {
          t.weeks[w].days.push(newDay(t.weeks[w].days.length));
          draw();
        } else if (b.dataset.wk === 'copy') {
          t.weeks[w] = clone(t.weeks[w - 1]);
          draw();
        } else if (b.dataset.wk === 'del') {
          t.weeks.splice(w, 1);
          draw();
        } else if (b.hasAttribute('data-addweek')) {
          t.weeks.push(clone(t.weeks[t.weeks.length - 1]));
          draw();
        } else if (b.hasAttribute('data-deltpl')) {
          if (!await confirmDialog(`Delete the block template "${t.name}"? Running blocks are kept.`)) return;
          state.blockTemplates = state.blockTemplates.filter((x) => x.id !== t.id);
          save();
          close();
          onSave?.();
        } else if (b.hasAttribute('data-save')) {
          if (!t.name.trim()) { toast('Give the block a name'); return; }
          const items = t.weeks.flatMap((wk) => wk.days.flatMap((dy) => dy.items));
          if (!items.length) { toast('Add at least one exercise'); return; }
          if (!items.some((it) => it.kind === 'pct')) { toast('Add at least one "% of 1RM" exercise'); return; }
          t.id = t.id || 'cbt-' + uid();
          const i = state.blockTemplates.findIndex((x) => x.id === t.id);
          if (i >= 0) state.blockTemplates[i] = t; else state.blockTemplates.unshift(t);
          save();
          close();
          toast('Block saved – tap it under "Start a block"');
          onSave?.();
        }
      });
      draw();
    },
  });
}
