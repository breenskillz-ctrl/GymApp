// Små hjelpefunksjoner som brukes i hele appen.

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

export const MONTHS = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'];
export const WEEKDAYS = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];

export function fmtDate(key, withWeekday = true) {
  const d = parseKey(key);
  const s = `${d.getDate()}. ${MONTHS[d.getMonth()]}`;
  const y = d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : '';
  return (withWeekday ? `${WEEKDAYS[d.getDay()]} ` : '') + s + y;
}

export function relDay(key) {
  const today = dateKey();
  if (key === today) return 'I dag';
  if (key === addDays(today, -1)) return 'I går';
  if (key === addDays(today, 1)) return 'I morgen';
  const s = WEEKDAYS[parseKey(key).getDay()];
  return s[0].toUpperCase() + s.slice(1);
}

// Mandag i uka datoen tilhører
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
  return Number(n.toFixed(digits)).toLocaleString('nb-NO');
};

// Estimert 1RM (Epley)
export const e1rm = (w, r) => (w && r ? (r === 1 ? w : w * (1 + r / 30)) : 0);

// ---------- Lyd og vibrasjon ----------
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
  } catch { /* lyd ikke tilgjengelig */ }
}

export function vibrate(pattern = 200) {
  try { navigator.vibrate?.(pattern); } catch { /* ignorer */ }
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

export function confirmDialog(message, okLabel = 'Slett') {
  return new Promise((resolve) => {
    openModal(`
      <p class="confirm-text">${esc(message)}</p>
      <div class="row gap end">
        <button class="btn ghost" data-close>Avbryt</button>
        <button class="btn danger" data-ok>${esc(okLabel)}</button>
      </div>`, {
      className: 'small',
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
