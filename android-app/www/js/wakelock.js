// Keeps the screen on while today's workout is open (Settings → "Keep the screen on during a workout").
import { state, dayHasWork } from './store.js';
import { dateKey } from './utils.js';

let lock = null;

const wanted = () => state.settings.keepAwake && document.visibilityState === 'visible' && dayHasWork(dateKey());

export async function updateWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try {
    if (wanted() && !lock) {
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => { lock = null; });
    } else if (!wanted() && lock) {
      await lock.release();
      lock = null;
    }
  } catch {
    lock = null; // e.g. battery saver or an unsupported browser
  }
}

export function initWakeLock() {
  // The browser drops the lock when the page is hidden, so ask again when it comes back
  document.addEventListener('visibilitychange', updateWakeLock);
  // Re-check after taps (an exercise may just have been added or the day cleared)
  document.addEventListener('click', () => setTimeout(updateWakeLock, 300));
  updateWakeLock();
}
