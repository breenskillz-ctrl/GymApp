// Progress photos (DECISIONS #34). Images are too big for localStorage, so they live in IndexedDB on the device.
// Record: { id, date: 'YYYY-MM-DD', pose: 'front'|'side'|'back', full: Blob, thumb: Blob, added }
import { uid } from './utils.js';

const DB = 'gymapp-photos';
const STORE = 'photos';
export const POSES = [['front', 'Front'], ['side', 'Side'], ['back', 'Back']];

let dbp = null;
function db() {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbp;
}

async function run(mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
  });
}

// Scale an image file down to at most `max` px on the long side and encode it as JPEG
async function shrink(file, max, quality) {
  const img = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  img.close?.();
  return new Promise((resolve) => c.toBlob(resolve, 'image/jpeg', quality));
}

export async function addPhoto(file, date, pose) {
  const rec = {
    id: uid(), date, pose, added: Date.now(),
    full: await shrink(file, 1400, 0.85),
    thumb: await shrink(file, 320, 0.75),
  };
  await run('readwrite', (s) => s.put(rec));
  return rec;
}

// All photos, newest date first
export async function allPhotos() {
  const list = (await run('readonly', (s) => s.getAll())) || [];
  return list.sort((a, b) => b.date.localeCompare(a.date) || b.added - a.added);
}

export const deletePhoto = (id) => run('readwrite', (s) => s.delete(id));
export const clearPhotos = () => run('readwrite', (s) => s.clear());
