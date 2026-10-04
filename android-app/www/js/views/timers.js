// Timers: rest timer, countdown, Tabata intervals and stopwatch.
import { state, save } from '../store.js';
import { icon, fmtTime, beep, vibrate, pad, topBar } from '../utils.js';
import { startRest } from '../timer.js';

let tab = 'rest';
let rootEl = null;
let ticker = null;

const sound = (...a) => { if (state.settings.sound) beep(...a); };

// ---------- Countdown ----------
const cd = { duration: 60, left: 60, endAt: 0, running: false };

// ---------- Tabata ----------
const tb = {
  cfg: { prep: 10, work: 20, rest: 10, rounds: 8, ...(JSON.parse(localStorage.getItem('gymapp.tabata') || '{}')) },
  phases: [],
  idx: 0,
  endAt: 0,
  left: 0,
  running: false,
  started: false,
};

function buildPhases() {
  const { prep, work, rest, rounds } = tb.cfg;
  const p = [];
  if (prep) p.push({ kind: 'prep', label: 'Get ready', dur: prep });
  for (let r = 1; r <= rounds; r++) {
    p.push({ kind: 'work', label: 'Work!', dur: work, round: r });
    if (rest && r < rounds) p.push({ kind: 'rest', label: 'Rest', dur: rest, round: r });
  }
  return p;
}

// ---------- Stopwatch ----------
const sw = { startAt: 0, acc: 0, running: false, laps: [] };
const swElapsed = () => sw.acc + (sw.running ? Date.now() - sw.startAt : 0);

function fmtMs(ms) {
  const cs = Math.floor(ms / 10) % 100;
  return `${fmtTime(Math.floor(ms / 1000))}<small>.${pad(cs)}</small>`;
}

// ---------- Shared tick ----------
function ensureTicker() {
  if (ticker) return;
  ticker = setInterval(tick, 100);
}

function tick() {
  const now = Date.now();
  if (cd.running) {
    const left = (cd.endAt - now) / 1000;
    const prevWhole = Math.ceil(cd.left);
    cd.left = Math.max(0, left);
    const whole = Math.ceil(cd.left);
    if (whole !== prevWhole && whole <= 3 && whole > 0) sound(660, 100);
    if (left <= 0) {
      cd.running = false;
      cd.left = 0;
      sound(1046, 250, 3);
      vibrate([300, 100, 300]);
    }
  }
  if (tb.running) {
    const prevWhole = Math.ceil(tb.left);
    tb.left = Math.max(0, (tb.endAt - now) / 1000);
    const whole = Math.ceil(tb.left);
    if (whole !== prevWhole && whole <= 3 && whole > 0) sound(660, 90);
    if (tb.left <= 0) {
      tb.idx++;
      if (tb.idx >= tb.phases.length) {
        tb.running = false;
        tb.started = false;
        tb.idx = 0;
        tb.left = 0;
        sound(1046, 300, 4);
        vibrate([400, 100, 400]);
      } else {
        const ph = tb.phases[tb.idx];
        tb.endAt = now + ph.dur * 1000;
        tb.left = ph.dur;
        if (ph.kind === 'work') { sound(1200, 350); vibrate(300); } else { sound(500, 350); vibrate([100, 80, 100]); }
      }
    }
  }
  if (!cd.running && !tb.running && !sw.running) {
    clearInterval(ticker);
    ticker = null;
  }
  updateDisplay();
}

function updateDisplay() {
  if (!rootEl || !document.body.contains(rootEl)) return;
  const q = (s) => rootEl.querySelector(s);
  if (tab === 'countdown' && q('#cd-time')) {
    q('#cd-time').textContent = fmtTime(Math.ceil(cd.left));
    q('#cd-ring').style.setProperty('--p', cd.duration ? 1 - cd.left / cd.duration : 0);
    q('#cd-toggle').innerHTML = cd.running ? `${icon('pause')} Pause` : `${icon('play')} Start`;
  }
  if (tab === 'tabata' && q('#tb-time')) {
    const ph = tb.phases[tb.idx];
    const box = q('#tb-box');
    box.dataset.kind = tb.started ? ph.kind : 'idle';
    q('#tb-phase').textContent = tb.started ? ph.label : 'Ready';
    q('#tb-round').textContent = tb.started && ph.round ? `Round ${ph.round} of ${tb.cfg.rounds}` : `${tb.cfg.rounds} rounds · ${fmtTime(totalTabata())} total`;
    q('#tb-time').textContent = fmtTime(Math.ceil(tb.started ? tb.left : tb.cfg.work));
    q('#tb-toggle').innerHTML = tb.running ? `${icon('pause')} Pause` : `${icon('play')} ${tb.started ? 'Resume' : 'Start'}`;
  }
  if (tab === 'stopwatch' && q('#sw-time')) {
    q('#sw-time').innerHTML = fmtMs(swElapsed());
    q('#sw-toggle').innerHTML = sw.running ? `${icon('pause')} Stop` : `${icon('play')} Start`;
    q('#sw-lap').textContent = sw.running ? 'Lap' : 'Reset';
  }
}

function totalTabata() {
  return buildPhases().reduce((a, p) => a + p.dur, 0);
}

// ---------- View ----------
function body() {
  if (tab === 'rest') {
    const presets = [30, 45, 60, 90, 120, 180, 240, 300];
    return `
      <p class="muted center">The rest timer appears at the bottom of the screen while you log sets.</p>
      <div class="preset-grid">
        ${presets.map((s) => `<button class="preset" data-rest="${s}">${fmtTime(s)}</button>`).join('')}
      </div>
      <label class="form">Default rest time (seconds)
        <input class="input" type="number" min="5" step="5" id="rest-default" value="${state.settings.rest}">
      </label>`;
  }
  if (tab === 'countdown') {
    const presets = [30, 60, 120, 180, 300, 600];
    return `
      <div class="ring" id="cd-ring"><span id="cd-time" class="big-time">${fmtTime(Math.ceil(cd.left))}</span></div>
      <div class="row gap center-row">
        <button class="btn ghost" data-cd="-10">−10s</button>
        <button class="btn primary big" id="cd-toggle"></button>
        <button class="btn ghost" data-cd="10">+10s</button>
      </div>
      <button class="btn ghost block" data-cd="reset">${icon('repeat')} Reset</button>
      <div class="preset-grid">
        ${presets.map((s) => `<button class="preset" data-cdset="${s}">${fmtTime(s)}</button>`).join('')}
      </div>
      <div class="row gap">
        <input class="input grow" id="cd-custom" placeholder="Custom time, e.g. 2:30" inputmode="numeric">
        <button class="btn ghost" data-cd="custom">Set</button>
      </div>`;
  }
  if (tab === 'tabata') {
    const f = (k, l) => `
      <div class="stepper"><span>${l}</span>
        <button class="icon-btn sm" data-tb="${k}" data-d="-1" aria-label="Less">−</button>
        <strong>${k === 'rounds' ? tb.cfg[k] : fmtTime(tb.cfg[k])}</strong>
        <button class="icon-btn sm" data-tb="${k}" data-d="1" aria-label="More">+</button></div>`;
    return `
      <div class="tabata-box" id="tb-box">
        <div id="tb-phase" class="tb-phase"></div>
        <div id="tb-time" class="big-time"></div>
        <div id="tb-round" class="tb-round"></div>
      </div>
      <div class="row gap center-row">
        <button class="btn primary big" id="tb-toggle"></button>
        <button class="btn ghost" data-tbc="reset">${icon('repeat')}</button>
      </div>
      <div class="card steppers ${tb.started ? 'disabled' : ''}">
        ${f('prep', 'Prepare')}${f('work', 'Work')}${f('rest', 'Rest')}${f('rounds', 'Rounds')}
      </div>`;
  }
  return `
    <div id="sw-time" class="big-time sw"></div>
    <div class="row gap center-row">
      <button class="btn ghost" id="sw-lap"></button>
      <button class="btn primary big" id="sw-toggle"></button>
    </div>
    <div class="laps">${sw.laps.map((l, i) => `
      <div class="lap"><span>Lap ${sw.laps.length - i}</span><span>${fmtMs(l.split)}</span><span class="muted">${fmtMs(l.total)}</span></div>`).join('')}</div>`;
}

export function renderTimers(root) {
  rootEl = root;
  const tabs = [['rest', 'Rest'], ['countdown', 'Countdown'], ['tabata', 'Tabata'], ['stopwatch', 'Stopwatch']];
  root.innerHTML = `
    ${topBar('Timers')}
    <div class="seg wide" data-tabs>${tabs.map(([k, l]) => `<button class="${tab === k ? 'active' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>
    <div class="timer-body">${body()}</div>`;
  updateDisplay();

  root.onchange = (e) => {
    if (e.target.id === 'rest-default') {
      state.settings.rest = Math.max(5, Number(e.target.value) || 90);
      save();
    }
  };

  root.onclick = (e) => {
    const t = e.target.closest('[data-tab]');
    if (t) { tab = t.dataset.tab; renderTimers(root); return; }

    const r = e.target.closest('[data-rest]');
    if (r) { startRest(Number(r.dataset.rest)); return; }

    // Nedtelling
    const cs = e.target.closest('[data-cdset]');
    if (cs) {
      cd.duration = cd.left = Number(cs.dataset.cdset);
      cd.running = false;
      updateDisplay();
      return;
    }
    if (e.target.closest('#cd-toggle')) {
      if (cd.running) { cd.running = false; } else {
        if (cd.left <= 0) cd.left = cd.duration;
        cd.endAt = Date.now() + cd.left * 1000;
        cd.running = true;
        sound(880, 80);
        ensureTicker();
      }
      updateDisplay();
      return;
    }
    const c = e.target.closest('[data-cd]');
    if (c) {
      const a = c.dataset.cd;
      if (a === 'reset') { cd.running = false; cd.left = cd.duration; } else if (a === 'custom') {
        const v = root.querySelector('#cd-custom').value.trim();
        const parts = v.split(':').map(Number);
        const sec = parts.some(Number.isNaN) ? 0 : parts.reduce((x, p) => x * 60 + p, 0);
        if (sec > 0) { cd.duration = cd.left = sec; cd.running = false; }
      } else {
        const d = Number(a);
        cd.left = Math.max(1, cd.left + d);
        cd.duration = Math.max(cd.duration, cd.left);
        if (cd.running) cd.endAt += d * 1000;
      }
      updateDisplay();
      return;
    }

    // Tabata
    const tbBtn = e.target.closest('[data-tb]');
    if (tbBtn && !tb.started) {
      const k = tbBtn.dataset.tb;
      const d = Number(tbBtn.dataset.d);
      const step = k === 'rounds' ? 1 : 5;
      const min = k === 'rounds' || k === 'work' ? 1 : 0;
      tb.cfg[k] = Math.max(min, tb.cfg[k] + d * step);
      localStorage.setItem('gymapp.tabata', JSON.stringify(tb.cfg));
      renderTimers(root);
      return;
    }
    if (e.target.closest('#tb-toggle')) {
      if (tb.running) {
        tb.running = false;
      } else {
        if (!tb.started) {
          tb.phases = buildPhases();
          tb.idx = 0;
          tb.left = tb.phases[0].dur;
          tb.started = true;
          sound(tb.phases[0].kind === 'work' ? 1200 : 500, 300);
        }
        tb.endAt = Date.now() + tb.left * 1000;
        tb.running = true;
        ensureTicker();
      }
      root.querySelector('.steppers')?.classList.toggle('disabled', tb.started);
      updateDisplay();
      return;
    }
    if (e.target.closest('[data-tbc="reset"]')) {
      tb.running = false;
      tb.started = false;
      tb.idx = 0;
      renderTimers(root);
      return;
    }

    // Stoppeklokke
    if (e.target.closest('#sw-toggle')) {
      if (sw.running) { sw.acc += Date.now() - sw.startAt; sw.running = false; } else {
        sw.startAt = Date.now();
        sw.running = true;
        ensureTicker();
      }
      updateDisplay();
      return;
    }
    if (e.target.closest('#sw-lap')) {
      if (sw.running) {
        const total = swElapsed();
        const prev = sw.laps[0]?.total || 0;
        sw.laps.unshift({ total, split: total - prev });
      } else {
        sw.acc = 0;
        sw.laps = [];
      }
      renderTimers(root);
    }
  };
}
