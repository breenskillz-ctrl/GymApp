// Progress photos: add front/side/back photos per date and compare two dates (DECISIONS #34).
import { state } from '../store.js';
import { esc, icon, openModal, dateKey, fmtDate, fmtNum, toast, confirmDialog, parseKey } from '../utils.js';
import { POSES, addPhoto, allPhotos, deletePhoto, exportPhotosBlob, importPhotos } from '../photodb.js';

const poseLabel = (p) => POSES.find(([k]) => k === p)?.[1] || p;
const poseIndex = (p) => POSES.findIndex(([k]) => k === p);

// Object URLs for blobs, released when the dialog that made them closes
function urlPool() {
  const urls = [];
  return {
    url(blob) { const u = URL.createObjectURL(blob); urls.push(u); return u; },
    free() { urls.splice(0).forEach((u) => URL.revokeObjectURL(u)); },
  };
}

// Call fn once the modal element has left the page
function onRemoved(el, fn) {
  const obs = new MutationObserver(() => {
    if (!document.body.contains(el)) { obs.disconnect(); fn(); }
  });
  obs.observe(document.body, { childList: true });
}

// Body weight logged on or up to 7 days before a date, if any
function weightNear(date) {
  const t = parseKey(date).getTime();
  const hit = state.body
    .filter((b) => b.weight && b.date <= date && t - parseKey(b.date).getTime() <= 7 * 86400000)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  return hit?.weight ?? null;
}

// Download all progress photos as one file (they are not in the JSON backup)
export async function exportPhotos() {
  const { count, blob } = await exportPhotosBlob();
  if (!count) { toast('No photos to export'); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `loadlog-photos-${dateKey()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(`${count} photo${count === 1 ? '' : 's'} exported`);
}

// Read a photo export file chosen in an <input type="file">; returns true when photos were added
export async function importPhotosFile(file) {
  if (!file) return false;
  try {
    const n = await importPhotos(await file.text());
    toast(n ? `${n} photo${n === 1 ? '' : 's'} imported` : 'No new photos in the file');
    return n > 0;
  } catch {
    toast('This is not a Loadlog photo export');
    return false;
  }
}

const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);

export function openProgressPhotos() {
  const pool = urlPool();
  let photos = [];
  openModal(`
    <div class="modal-head"><h2 class="grow">Progress photos</h2>
      <button class="icon-btn" data-export aria-label="Export photos">${icon('download')}</button>
      <label class="icon-btn file-icon" aria-label="Import photos">${icon('upload')}<input type="file" accept="application/json,.json" data-importp hidden></label>
      <button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>
    <div class="photo-add">
      <label class="photo-date">Date<input class="input" type="date" data-date value="${dateKey()}" max="${dateKey()}"></label>
      <div class="photo-poses">${POSES.map(([k, l]) => `<label class="btn ghost file-btn">${icon('camera')} ${l}
        <input type="file" accept="image/*" data-pose="${k}" hidden></label>`).join('')}</div>
    </div>
    <button class="btn primary block" data-compare>${icon('compare')} Compare</button>
    <div class="scroll photo-timeline"></div>`, {
    className: 'tall',
    onMount(m) {
      const box = m.querySelector('.photo-timeline');
      onRemoved(m, pool.free);

      const draw = async () => {
        photos = await allPhotos();
        pool.free();
        m.querySelector('[data-compare]').disabled = !POSES.some(([k]) => new Set(photos.filter((p) => p.pose === k).map((p) => p.date)).size > 1);
        if (!photos.length) {
          box.innerHTML = `<p class="empty">No photos yet. Take a front, side and back photo in the same spot and light,
            and repeat every few weeks. Photos stay on this phone only.</p>`;
          return;
        }
        const dates = [...new Set(photos.map((p) => p.date))];
        box.innerHTML = dates.map((d) => {
          const w = state.body.find((b) => b.date === d)?.weight;
          return `<div class="photo-day"><div class="photo-day-head">${fmtDate(d)}${w ? ` <span class="muted">· ${fmtNum(w)} ${state.settings.unit}</span>` : ''}</div>
            <div class="photo-row">${photos.filter((p) => p.date === d).sort((x, y) => poseIndex(x.pose) - poseIndex(y.pose)).map((p) => `
              <button class="photo-thumb" data-id="${p.id}"><img src="${pool.url(p.thumb)}" alt="${poseLabel(p.pose)} ${d}">
                <span>${poseLabel(p.pose)}</span></button>`).join('')}</div></div>`;
        }).join('');
      };

      m.addEventListener('change', async (e) => {
        if (e.target.matches('[data-importp]')) {
          const f = e.target.files[0];
          e.target.value = '';
          if (await importPhotosFile(f)) draw();
          return;
        }
        const inp = e.target.closest('[data-pose]');
        if (!inp?.files[0]) return;
        const date = m.querySelector('[data-date]').value || dateKey();
        try {
          await addPhoto(inp.files[0], date, inp.dataset.pose);
          toast(`${poseLabel(inp.dataset.pose)} photo saved`);
        } catch {
          toast('Could not read the image');
        }
        inp.value = '';
        draw();
      });
      m.addEventListener('click', (e) => {
        const t = e.target.closest('[data-id]');
        if (t) openPhotoViewer(photos.find((p) => p.id === t.dataset.id), draw);
        if (e.target.closest('[data-compare]')) openCompare(photos);
        if (e.target.closest('[data-export]')) exportPhotos();
      });
      draw();
    },
  });
}

function openPhotoViewer(p, onChange) {
  const pool = urlPool();
  openModal(`
    <div class="modal-head"><h2>${poseLabel(p.pose)} · ${fmtDate(p.date, false)}</h2>
      <button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>
    <div class="photo-full"><img src="${pool.url(p.full)}" alt="${poseLabel(p.pose)} ${p.date}"></div>
    <button class="btn danger block" data-del>${icon('trash')} Delete photo</button>`, {
    className: 'tall',
    onMount(m, close) {
      onRemoved(m, pool.free);
      m.querySelector('[data-del]').addEventListener('click', async () => {
        if (!await confirmDialog('Delete this photo?')) return;
        await deletePhoto(p.id);
        close();
        toast('Photo deleted');
        onChange();
      });
    },
  });
}

// Two dates of the same pose, side by side or on top of each other with a slider
function openCompare(photos) {
  const pool = urlPool();
  const poses = POSES.filter(([k]) => new Set(photos.filter((p) => p.pose === k).map((p) => p.date)).size > 1);
  let pose = poses[0][0];
  let mode = 'side';
  let a;
  let b;
  const ofPose = () => photos.filter((p) => p.pose === pose).sort((x, y) => x.date.localeCompare(y.date) || x.added - y.added);
  const pick = () => { const l = ofPose(); a = l[0]; b = l[l.length - 1]; };
  pick();

  openModal('<div class="compare"></div>', {
    className: 'tall',
    onMount(m) {
      const box = m.querySelector('.compare');
      onRemoved(m, pool.free);
      const opts = (sel) => ofPose().map((p) => `<option value="${p.id}" ${p === sel ? 'selected' : ''}>${esc(fmtDate(p.date, false))}</option>`).join('');
      const draw = () => {
        pool.free();
        const wa = weightNear(a.date);
        const wb = weightNear(b.date);
        const days = daysBetween(a.date, b.date);
        box.innerHTML = `
          <div class="modal-head"><h2>Compare</h2>
            <button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>
          <div class="chips">${poses.map(([k, l]) => `<button class="chip ${k === pose ? 'active' : ''}" data-cpose="${k}">${l}</button>`).join('')}
            <span class="grow"></span>
            <div class="seg small-seg"><button class="${mode === 'side' ? 'active' : ''}" data-mode="side">Side by side</button>
              <button class="${mode === 'slider' ? 'active' : ''}" data-mode="slider">Slider</button></div></div>
          <div class="compare-pick">
            <label>Before<select class="input" data-pick="a">${opts(a)}</select></label>
            <label>After<select class="input" data-pick="b">${opts(b)}</select></label>
          </div>
          <p class="compare-info">${days ? `${Math.abs(days)} days apart` : 'Same day'}${wa && wb ? ` · ${fmtNum(wa)} → ${fmtNum(wb)} ${state.settings.unit}
            (${wb - wa > 0 ? '+' : wb - wa < 0 ? '−' : '±'}${fmtNum(Math.abs(wb - wa), 1)})` : ''}</p>
          ${mode === 'side' ? `<div class="compare-side">
              <figure><img src="${pool.url(a.full)}" alt="Before"><figcaption>${esc(fmtDate(a.date, false))}</figcaption></figure>
              <figure><img src="${pool.url(b.full)}" alt="After"><figcaption>${esc(fmtDate(b.date, false))}</figcaption></figure>
            </div>` : `<div class="compare-slider" style="--pos:50%">
              <img src="${pool.url(a.full)}" alt="Before">
              <img class="after" src="${pool.url(b.full)}" alt="After">
              <span class="cs-line"></span>
              <span class="cs-tag l">${esc(fmtDate(a.date, false))}</span><span class="cs-tag r">${esc(fmtDate(b.date, false))}</span>
              <input type="range" min="0" max="100" value="50" data-slide aria-label="Before and after">
            </div>`}`;
      };
      box.addEventListener('click', (e) => {
        const c = e.target.closest('[data-cpose]');
        if (c) { pose = c.dataset.cpose; pick(); draw(); }
        const md = e.target.closest('[data-mode]');
        if (md) { mode = md.dataset.mode; draw(); }
      });
      box.addEventListener('change', (e) => {
        const s = e.target.closest('[data-pick]');
        if (!s) return;
        const p = ofPose().find((x) => x.id === s.value);
        if (s.dataset.pick === 'a') a = p; else b = p;
        draw();
      });
      box.addEventListener('input', (e) => {
        if (e.target.matches('[data-slide]')) box.querySelector('.compare-slider').style.setProperty('--pos', `${e.target.value}%`);
      });
      draw();
    },
  });
}
