// Full backup (workouts + progress photos in one file), sharing it to Drive/iCloud, and keeping the browser from
// clearing the app's storage (DECISIONS #41).
import { state, save, replaceState, dayHasWork } from './store.js';
import { dateKey, toast } from './utils.js';
import { exportPhotoList, importPhotoList } from './photodb.js';

// ---------- Persistent storage ----------
// Ask the browser to keep our data even when the device runs low on space. Chrome grants it silently for installed or
// often-used apps; Firefox may ask. Safari has no such flag: there the app must be opened from the home screen.
export async function requestPersist() {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

// { level: 'ok'|'warn', text, used } for the Settings page
export async function storageStatus() {
  let persisted = false;
  let used = null;
  try {
    persisted = !!(await navigator.storage?.persisted?.());
    const est = await navigator.storage?.estimate?.();
    if (est?.usage != null) used = est.usage;
  } catch { /* not supported */ }
  if (isIOS() && !isStandalone()) {
    return { level: 'warn', used, text: 'Safari can delete this data after 7 days without a visit. Tap Share → Add to Home Screen and open the app from there.' };
  }
  if (isIOS()) return { level: 'ok', used, text: 'Installed on the home screen: Safari keeps your data.' };
  if (persisted) return { level: 'ok', used, text: 'Protected: the browser will not clear your data to free up space.' };
  return { level: 'warn', used, text: 'Not protected yet. Install the app (browser menu → Install app) and keep using it; the browser then keeps your data.' };
}

// ---------- Full backup ----------
// File: the saved state as before, plus `photos` (progress photos as data URLs). Old backups without photos still import.
async function backupFile() {
  const photos = await exportPhotoList().catch(() => []);
  const text = JSON.stringify({ ...state, backupVersion: 2, photos });
  return { file: new File([text], `gymapp-backup-${dateKey()}.json`, { type: 'application/json' }), photos: photos.length };
}

function download(file) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const markDone = () => { state.lastBackup = Date.now(); save(); };

// Save the backup to the downloads folder
export async function downloadBackup() {
  const { file, photos } = await backupFile();
  download(file);
  markDone();
  toast(`Backup saved to downloads${photos ? ` (with ${photos} photo${photos === 1 ? '' : 's'})` : ''}`);
}

// Open the phone's share sheet so the file can go straight to Google Drive, iCloud Files, e-mail…
// Falls back to a download where sharing files is not supported.
export async function shareBackup() {
  const { file } = await backupFile();
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'GymApp backup' });
      markDone();
      toast('Backup shared');
      return;
    } catch (e) {
      if (e?.name === 'AbortError') return; // the user closed the share sheet
    }
  }
  download(file);
  markDone();
  toast('Sharing is not available here – the backup was saved to downloads');
}

export const canShareFiles = () => {
  try {
    return !!navigator.canShare?.({ files: [new File(['x'], 'x.json', { type: 'application/json' })] });
  } catch {
    return false;
  }
};

// Restore a backup file: replaces all workout data and adds the photos in it. Returns the number of photos added.
export async function restoreBackup(data) {
  const { photos, backupVersion, ...rest } = data;
  replaceState(rest);
  return Array.isArray(photos) ? importPhotoList(photos) : 0;
}

// Show the backup reminder when there is data and no backup (or snooze) in the last 7 days
export function backupDue() {
  const week = 7 * 86400000;
  const last = Math.max(state.lastBackup || 0, state.backupSnooze || 0);
  if (Date.now() - last < week) return false;
  return Object.keys(state.log).filter(dayHasWork).length >= 3;
}
