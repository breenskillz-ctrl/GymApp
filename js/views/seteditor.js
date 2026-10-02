// Set editor dialog: add or edit one set (weight/reps/time/distance, comment, intensity level).
import { LEVELS } from '../data.js';
import { state, save, getExercise, history, lastSets, isPR, getRest } from '../store.js';
import { esc, icon, openModal, num, parseTime, fmtTime, fmtNum, e1rm, toast, dateKey, fmtDate } from '../utils.js';
import { startRest } from '../timer.js';
import { setText } from './exercises.js';

// Which fields each exercise type has: [field, label, step]
function fieldsFor(type) {
  const u = state.settings.unit.toUpperCase();
  const wStep = state.settings.unit === 'lb' ? 5 : 2.5;
  switch (type) {
    case 't': return [['t', 'TIME', 5]];
    case 'dt': return [['d', 'KM', 0.5], ['t', 'TIME', 30]];
    default: return [['w', u, wStep], ['r', 'REP', 1]];
  }
}

const show = (f, v) => (v == null || v === '' ? '' : f === 't' ? fmtTime(v) : String(v));
const read = (f, s) => (f === 't' ? parseTime(s) : num(s));

// Short description of how a suggestion differs from last time, e.g. "+1 rep" or "+2.5 kg"
export function suggestionDelta(s) {
  if (s.pct && !s.done) return `${s.pct}\u00a0%${s.amrap ? '+' : ''}`; // block set: show the prescribed percentage
  const l = s.last;
  if (!l || s.done) return '';
  const u = state.settings.unit;
  const parts = [];
  if (s.w != null && l.w != null && s.w !== l.w) parts.push(`${s.w > l.w ? '+' : '−'}${fmtNum(Math.abs(s.w - l.w), 2)} ${u}`);
  else if (s.r != null && l.r != null && s.r !== l.r) parts.push(`${s.r > l.r ? '+' : '−'}${Math.abs(s.r - l.r)} rep`);
  if (s.t != null && l.t != null && s.t !== l.t) parts.push(`${s.t > l.t ? '+' : '−'}${Math.abs(s.t - l.t)} s`);
  return parts.join(' ');
}

export const levelColor = (id) => LEVELS.find((l) => l.id === id)?.color;
export const exLabel = (ex) => (ex.equip && !['Other', 'Bodyweight'].includes(ex.equip) ? `${ex.name} · ${ex.equip}` : ex.name);

function platesHtml(total) {
  const lb = state.settings.unit === 'lb';
  const bar = lb ? 45 : 20;
  const plates = lb ? [45, 35, 25, 10, 5, 2.5] : [25, 20, 15, 10, 5, 2.5, 1.25];
  if (!total || total < bar) return `<p class="muted">Enter a weight of at least ${bar} ${state.settings.unit} (the bar).</p>`;
  let side = (total - bar) / 2;
  const used = [];
  for (const p of plates) {
    while (side >= p - 1e-9) { used.push(p); side -= p; }
  }
  return `<div class="muted small">Per side (bar ${bar} ${state.settings.unit}):</div>
    <div>${used.length ? used.map((p) => `<span class="pill">${fmtNum(p, 2)}</span>`).join('') : 'Just the bar'}</div>
    ${side > 0.01 ? `<div class="muted small">${fmtNum(side * 2, 2)} ${state.settings.unit} can't be made with standard plates.</div>` : ''}`;
}

function oneRmHtml(w, r) {
  const max = e1rm(w, r);
  if (!max) return '<p class="muted">Enter weight and reps to estimate your one-rep max.</p>';
  const u = state.settings.unit;
  const rows = [100, 95, 90, 85, 80, 75, 70, 65, 60].map((p) => `<tr><td>${p}%</td><td>${fmtNum(max * p / 100, 1)} ${u}</td></tr>`).join('');
  return `<div>Estimated 1RM: <strong>${fmtNum(max, 1)} ${u}</strong></div><table>${rows}</table>`;
}

function historyHtml(ex, date) {
  const hist = history(ex.id, date).slice(0, 6);
  if (!hist.length) return '<p class="muted">No previous sessions.</p>';
  return hist.map((h) => `<div class="hist-item"><div class="hist-date">${fmtDate(h.date)}</div>
    ${h.sets.map((s) => `<span class="pill">${esc(setText(ex, s))}</span>`).join('')}</div>`).join('');
}

/**
 * Open the set editor.
 * @param {string} date  day key
 * @param {object} entry log entry ({ ex, sets })
 * @param {number|null} index existing set index, or null to add a new set
 * @param {Function} onDone called after save/delete
 */
export function openSetEditor(date, entry, index, onDone) {
  const ex = getExercise(entry.ex);
  const editing = index != null;
  const existing = editing ? entry.sets[index] : null;
  const n = editing ? index + 1 : entry.sets.length + 1;
  // Pre-fill: the set itself, else the previous set in this card, else the same set from last session
  const prevSession = lastSets(entry.ex, date) || [];
  const src = existing && (existing.w != null || existing.r != null || existing.t != null || existing.d != null)
    ? existing
    : entry.sets[entry.sets.length - 1] || prevSession[n - 1] || prevSession[prevSession.length - 1] || {};
  const values = { w: src.w ?? null, r: src.r ?? null, t: src.t ?? null, d: src.d ?? null };
  let lvl = existing?.lvl || src.lvl || 'normal';
  const fields = fieldsFor(ex.type);
  const tools = ex.type === 'wr' ? ['history', 'calc', 'plates'] : ['history'];
  let tool = null;

  openModal(`
    <form class="set-form" autocomplete="off">
      <div class="se-head">
        <div>
          <h2>Set №${n}</h2>
          <span class="sub">${esc(exLabel(ex))}</span>
        </div>
        <div class="se-tools">
          ${tools.includes('plates') ? `<button type="button" class="icon-btn" data-tool="plates" aria-label="Plate calculator">${icon('plates')}</button>` : ''}
          ${tools.includes('calc') ? `<button type="button" class="icon-btn" data-tool="calc" aria-label="1RM calculator">${icon('calc')}</button>` : ''}
          <button type="button" class="icon-btn" data-tool="history" aria-label="History">${icon('history')}</button>
          ${editing ? `<button type="button" class="icon-btn danger-text" data-del aria-label="Delete set">${icon('trash')}</button>` : ''}
        </div>
      </div>
      ${existing && !existing.done && existing.last ? `<table class="se-compare">
        <tr><th>Last time</th><th>Suggestion</th></tr>
        <tr><td>${esc(setText(ex, existing.last))}</td><td>${esc(setText(ex, existing))}${suggestionDelta(existing) ? ` <span class="delta">${esc(suggestionDelta(existing))}</span>` : ''}</td></tr>
      </table>` : ''}
      <div class="se-tool-panel" hidden></div>
      <div class="se-fields">${fields.map(([f, label], i) => `
        <div class="se-row" data-f="${f}">
          <label for="se-${f}">${label}</label>
          <div class="se-stepper">
            <button type="button" class="step-btn" data-step="-1" aria-label="Decrease ${label}">−</button>
            <input id="se-${f}" data-f="${f}" inputmode="${f === 'r' ? 'numeric' : 'decimal'}" enterkeyhint="${i < fields.length - 1 ? 'next' : 'done'}"
              placeholder="${f === 't' ? 'm:ss' : '0'}" value="${esc(show(f, values[f]))}">
            <button type="button" class="step-btn" data-step="1" aria-label="Increase ${label}">+</button>
          </div>
        </div>`).join('')}</div>
      <label class="se-comment">${icon('comment')}<input data-comment placeholder="Add comment" value="${esc(existing?.c || '')}"></label>
      <div class="lvl-row">
        ${LEVELS.map((l) => `<button type="button" class="lvl-btn ${l.id === lvl ? 'active' : ''}" style="--c:${l.color}" data-lvl="${l.id}">
          <span class="dot" style="background:${l.color}"></span>${l.label}</button>`).join('')}
      </div>
      <button type="submit" class="btn primary block save-set">${icon('check')} ${editing ? 'Save set' : 'Add set'}</button>
    </form>`, {
    className: 'dialog set-dialog',
    onMount(m, close) {
      const form = m.querySelector('form');
      const panel = m.querySelector('.se-tool-panel');
      const inputs = [...m.querySelectorAll('.se-row input')];
      const cur = () => Object.fromEntries(inputs.map((i) => [i.dataset.f, read(i.dataset.f, i.value)]));

      const drawTool = () => {
        m.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === tool));
        panel.hidden = !tool;
        if (!tool) return;
        const v = cur();
        panel.innerHTML = tool === 'history' ? historyHtml(ex, date) : tool === 'calc' ? oneRmHtml(v.w, v.r) : platesHtml(v.w);
      };

      setTimeout(() => { inputs[0]?.focus(); inputs[0]?.select(); }, 60);
      // Show the chosen level even when the chip row has to scroll
      const activeLvl = m.querySelector('.lvl-btn.active');
      if (activeLvl) activeLvl.parentElement.scrollLeft = activeLvl.offsetLeft - activeLvl.parentElement.offsetLeft - 8;
      m.addEventListener('focusin', (e) => { if (e.target.matches('.se-row input')) e.target.select(); });
      m.addEventListener('input', () => { if (tool === 'calc' || tool === 'plates') drawTool(); });

      m.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' || !e.target.matches('.se-row input')) return;
        const i = inputs.indexOf(e.target);
        if (i < inputs.length - 1) { e.preventDefault(); inputs[i + 1].focus(); }
      });

      m.addEventListener('click', (e) => {
        const step = e.target.closest('[data-step]');
        if (step) {
          const row = step.closest('.se-row');
          const f = row.dataset.f;
          const [, , size] = fields.find(([x]) => x === f);
          const inp = row.querySelector('input');
          const v = Math.max(0, (read(f, inp.value) || 0) + Number(step.dataset.step) * size);
          inp.value = show(f, Math.round(v * 100) / 100);
          if (tool === 'calc' || tool === 'plates') drawTool();
          return;
        }
        const lb = e.target.closest('[data-lvl]');
        if (lb) {
          lvl = lb.dataset.lvl;
          m.querySelectorAll('[data-lvl]').forEach((b) => b.classList.toggle('active', b === lb));
          return;
        }
        const tb = e.target.closest('[data-tool]');
        if (tb) {
          tool = tool === tb.dataset.tool ? null : tb.dataset.tool;
          drawTool();
          return;
        }
        if (e.target.closest('[data-del]')) {
          entry.sets.splice(index, 1);
          save();
          close();
          onDone?.();
        }
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const v = cur();
        const set = { w: v.w ?? null, r: v.r ?? null, t: v.t ?? null, d: v.d ?? null, done: true, lvl, at: existing?.done && existing.at ? existing.at : Date.now() };
        const c = m.querySelector('[data-comment]').value.trim();
        if (c) set.c = c;
        // Keep block prescriptions (percentage, AMRAP target) on the logged set
        for (const k of ['pct', 'amrap', 'goal']) if (existing?.[k] != null) set[k] = existing[k];
        if (editing) entry.sets[index] = set; else entry.sets.push(set);
        save();
        close();
        if (isPR(entry.ex, date, set)) toast('🏆 New personal record!');
        if (state.settings.autoRest && date === dateKey() && lvl !== 'warmup') startRest(getRest(entry.ex));
        onDone?.();
      });
    },
  });
}
