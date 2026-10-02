// Global rest timer shown at the bottom of the screen whichever tab you are on.
import { state } from './store.js';
import { beep, vibrate, fmtTime } from './utils.js';

let endAt = 0;
let total = 0;
let tick = null;
const RING = 2 * Math.PI * 21; // circumference of the timer ring

const bar = () => document.getElementById('restbar');

export function startRest(sec = state.settings.rest) {
  total = sec;
  endAt = Date.now() + sec * 1000;
  bar().classList.add('show');
  document.body.classList.add('resting');
  clearInterval(tick);
  tick = setInterval(update, 250);
  update();
}

export function adjustRest(delta) {
  if (!endAt) return;
  endAt += delta * 1000;
  total = Math.max(1, total + delta);
  update();
}

export function stopRest() {
  clearInterval(tick);
  endAt = 0;
  bar().classList.remove('show');
  document.body.classList.remove('resting');
}

function update() {
  const left = (endAt - Date.now()) / 1000;
  const el = bar();
  if (left <= 0) {
    stopRest();
    if (state.settings.sound) beep(1046, 180, 3);
    vibrate([200, 100, 200, 100, 300]);
    return;
  }
  el.querySelector('.rest-time').textContent = fmtTime(Math.ceil(left));
  // The ring empties as the rest runs out (DECISIONS #44)
  el.querySelector('.ring-fg').style.strokeDashoffset = String(RING * (1 - left / total));
}

export function initRestBar() {
  const el = bar();
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-rest]');
    if (!b) return;
    const a = b.dataset.rest;
    if (a === 'skip') stopRest();
    else adjustRest(Number(a));
  });
}
