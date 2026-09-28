// Small helpers used throughout the app.

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

export const pad = (n) => String(n).padStart(2, '0');

export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function fmtDate(key, withWeekday = true) {
  const d = parseKey(key);
  const s = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const y = d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : '';
  return (withWeekday ? `${WEEKDAYS[d.getDay()]}, ` : '') + s + y;
}

export function relDay(key) {
  const today = dateKey();
  if (key === today) return 'Today';
  if (key === addDays(today, -1)) return 'Yesterday';
  if (key === addDays(today, 1)) return 'Tomorrow';
  return WEEKDAYS[parseKey(key).getDay()];
}

// Monday of the week the date belongs to
export function weekStart(key) {
  const d = parseKey(key);
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  return dateKey(d);
}

export function fmtTime(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// "1:30" / "90" / "1:02:03" -> sekunder
export function parseTime(str) {
  if (str == null || str === '') return null;
  const parts = String(str).trim().split(':').map((p) => Number(p.replace(',', '.')));
  if (parts.some((p) => Number.isNaN(p))) return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

export const num = (v) => {
  if (v === '' || v == null) return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export const fmtNum = (n, digits = 1) => {
  if (n == null) return '–';
  return Number(n.toFixed(digits)).toLocaleString('en-GB');
};

// Estimated 1RM (Epley)
export const e1rm = (w, r) => (w && r ? (r === 1 ? w : w * (1 + r / 30)) : 0);

// ---------- Sound and vibration ----------
let audioCtx;
export function beep(freq = 880, ms = 150, times = 1) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < times; i++) {
      const t = audioCtx.currentTime + i * (ms / 1000 + 0.08);
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.frequency.value = freq;
      o.type = 'sine';
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.4, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
      o.connect(g).connect(audioCtx.destination);
      o.start(t);
      o.stop(t + ms / 1000 + 0.02);
    }
  } catch { /* audio unavailable */ }
}

export function vibrate(pattern = 200) {
  try { navigator.vibrate?.(pattern); } catch { /* ignore */ }
}

// ---------- Toast ----------
let toastTimer;
export function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// ---------- Modal ----------
const modalStack = [];

export function openModal(html, { onMount, className = '' } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `<div class="modal ${className}" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(wrap);
  const modal = wrap.firstElementChild;
  const close = () => {
    const i = modalStack.indexOf(close);
    if (i >= 0) modalStack.splice(i, 1);
    wrap.classList.remove('open');
    setTimeout(() => wrap.remove(), 200);
  };
  modalStack.push(close);
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap || e.target.closest('[data-close]')) close();
  });
  requestAnimationFrame(() => wrap.classList.add('open'));
  onMount?.(modal, close);
  return { modal, close };
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalStack.length) modalStack[modalStack.length - 1]();
});

export function confirmDialog(message, okLabel = 'Delete') {
  return new Promise((resolve) => {
    openModal(`
      <p class="confirm-text">${esc(message)}</p>
      <div class="dialog-actions">
        <button class="text-btn" data-close>Cancel</button>
        <button class="text-btn danger-text" data-ok>${esc(okLabel)}</button>
      </div>`, {
      className: 'dialog',
      onMount(m, close) {
        let ok = false;
        m.querySelector('[data-ok]').onclick = () => { ok = true; close(); };
        const obs = new MutationObserver(() => {
          if (!document.body.contains(m)) { obs.disconnect(); resolve(ok); }
        });
        obs.observe(document.body, { childList: true });
      },
    });
  });
}

export const icon = (name) => `<svg class="ico" aria-hidden="true"><use href="#i-${name}"/></svg>`;

// ---------- Layout helpers ----------
// Standard top bar for a view: ☰, title, optional action buttons on the right
export function topBar(title, actions = '') {
  return `<header class="topbar">
    <button class="icon-btn" data-open-drawer aria-label="Menu">${icon('menu')}</button>
    <h1 class="topbar-title">${title}</h1>
    <div class="topbar-actions">${actions}</div>
  </header>`;
}

// Navigate to another view (handled in app.js)
export const go = (view) => window.dispatchEvent(new CustomEvent('gym:navigate', { detail: view }));

// Small text input dialog. Resolves with the text, or null on cancel.
export function promptDialog(title, value = '', { placeholder = '', okLabel = 'Save', multiline = false } = {}) {
  return new Promise((resolve) => {
    let result = null;
    openModal(`
      <h2 class="dialog-title">${esc(title)}</h2>
      <form class="form">
        ${multiline
          ? `<textarea class="input" rows="3" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`
          : `<input class="input" value="${esc(value)}" placeholder="${esc(placeholder)}">`}
        <div class="dialog-actions">
          <button type="button" class="text-btn" data-close>Cancel</button>
          <button type="submit" class="text-btn accent">${esc(okLabel)}</button>
        </div>
      </form>`, {
      className: 'dialog',
      onMount(m, close) {
        const inp = m.querySelector('.input');
        setTimeout(() => { inp.focus(); inp.select?.(); }, 50);
        m.querySelector('form').addEventListener('submit', (e) => {
          e.preventDefault();
          result = inp.value.trim();
          close();
        });
        const obs = new MutationObserver(() => {
          if (!document.body.contains(m)) { obs.disconnect(); resolve(result); }
        });
        obs.observe(document.body, { childList: true });
      },
    });
  });
}

// Pick one option from a list. Resolves with the chosen value, or null.
export function menuDialog(title, items) {
  return new Promise((resolve) => {
    let result = null;
    openModal(`
      ${title ? `<h2 class="dialog-title">${esc(title)}</h2>` : ''}
      <div class="menu">${items.map((it) => `<button data-v="${esc(it.value)}" class="${it.danger ? 'danger-text' : ''}">${it.icon ? icon(it.icon) : ''}${esc(it.label)}</button>`).join('')}</div>`, {
      className: 'dialog',
      onMount(m, close) {
        m.querySelector('.menu').addEventListener('click', (e) => {
          const b = e.target.closest('[data-v]');
          if (!b) return;
          result = b.dataset.v;
          close();
        });
        const obs = new MutationObserver(() => {
          if (!document.body.contains(m)) { obs.disconnect(); resolve(result); }
        });
        obs.observe(document.body, { childList: true });
      },
    });
  });
}

// Text and number size (80–150 %), applied to every font size through the --fs CSS variable
export function applyTextScale(pct) {
  document.documentElement.style.setProperty('--fs', String((Number(pct) || 100) / 100));
}

export const textScale = () => Number(getComputedStyle(document.documentElement).getPropertyValue('--fs')) || 1;
