// Share a workout as an image (DECISIONS #79): a 1080 px wide card (1080–1350 high) drawn on canvas in the app's colours, shown in a
// sheet with Share (Web Share with a file) and Save (download). The Android app's web view can do neither, so the
// image is also shown large enough to screenshot.
import { esc, icon, openModal, toast, parseKey } from './utils.js';
import { css } from './charts.js';

const W = 1080;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Cut text to a width with "…"
function fit(ctx, text, max) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

/**
 * data: { title, date, kicker, tiles: [[value, label]…], rows: [{ name, sets, rec }], footer }
 * Returns a PNG Blob.
 */
export async function drawWorkout(data) {
  try { await Promise.all(['700 40px "Barlow Condensed"', '600 40px "Barlow Condensed"', '500 30px Barlow', '400 30px Barlow'].map((f) => document.fonts.load(f))); } catch { /* fallback fonts */ }
  // Height follows the number of exercises: square for a short workout, up to 4:5 for a long one
  const H = Math.min(1350, Math.max(1080, 600 + Math.min(9, data.rows.length) * 84 + 200));
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const col = {
    bg: css('--bg') || '#0f1216', card: css('--card') || '#1b2027', card2: css('--card2') || '#232a33', text: css('--text') || '#e9edf2',
    muted: css('--muted') || '#8b95a3', accent: css('--accent') || '#2f5fb3', hi: css('--accent-hi') || '#6f9be8', gold: css('--gold') || '#e8b931',
  };
  const num = (w, s) => `${w} ${s}px "Barlow Condensed", "Arial Narrow", sans-serif`;
  const ui = (w, s) => `${w} ${s}px Barlow, Roboto, sans-serif`;

  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, W, H);
  // Accent bar on the left, like a main-lift card
  ctx.fillStyle = col.accent;
  ctx.fillRect(0, 0, 14, H);

  const x = 84;
  let y = 120;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = col.hi;
  ctx.font = num(700, 40);
  ctx.fillText('LOADLOG', x, y);
  ctx.fillStyle = col.muted;
  ctx.font = ui(500, 30);
  ctx.textAlign = 'right';
  ctx.fillText(data.date, W - x, y);
  ctx.textAlign = 'left';

  y += 90;
  if (data.kicker) {
    ctx.fillStyle = col.muted;
    ctx.font = ui(600, 28);
    ctx.fillText(data.kicker.toUpperCase(), x, y);
    y += 70;
  }
  ctx.fillStyle = col.text;
  ctx.font = num(700, 82);
  ctx.fillText(fit(ctx, data.title, W - 2 * x), x, y);

  // Four tiles
  y += 50;
  const gap = 20;
  const tw = (W - 2 * x - gap * 3) / 4;
  data.tiles.forEach(([v, l], i) => {
    const tx = x + i * (tw + gap);
    ctx.fillStyle = col.card;
    roundRect(ctx, tx, y, tw, 150, 22);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = l.startsWith('record') && v !== '0' ? col.gold : col.text;
    ctx.font = num(700, 62);
    ctx.fillText(v, tx + tw / 2, y + 82);
    ctx.fillStyle = col.muted;
    ctx.font = ui(500, 26);
    ctx.fillText(l, tx + tw / 2, y + 124);
    ctx.textAlign = 'left';
  });
  y += 150 + 50;

  // Exercises
  const rows = data.rows.slice(0, 9);
  const rh = Math.min(84, Math.floor((H - y - 140) / Math.max(1, rows.length)));
  ctx.fillStyle = col.card;
  roundRect(ctx, x - 24, y, W - 2 * x + 48, rh * rows.length + 30, 26);
  ctx.fill();
  y += 15;
  rows.forEach((r, i) => {
    const ry = y + i * rh;
    if (i) {
      ctx.fillStyle = col.card2;
      ctx.fillRect(x, ry, W - 2 * x, 2);
    }
    const mid = ry + rh / 2 + 11;
    ctx.textAlign = 'right';
    ctx.fillStyle = r.rec ? col.gold : col.text;
    ctx.font = num(700, 40);
    const setsW = Math.min(420, ctx.measureText(r.sets).width);
    ctx.fillText(fit(ctx, r.sets, 420), W - x, mid);
    ctx.textAlign = 'left';
    ctx.fillStyle = col.text;
    ctx.font = ui(500, 32);
    ctx.fillText(fit(ctx, `${r.rec ? '🏆 ' : ''}${r.name}`, W - 2 * x - setsW - 30), x, mid);
  });
  if (data.rows.length > rows.length) {
    ctx.fillStyle = col.muted;
    ctx.font = ui(500, 26);
    ctx.fillText(`+ ${data.rows.length - rows.length} more`, x, y + rh * rows.length + 50);
  }

  if (data.footer) {
    ctx.fillStyle = col.muted;
    ctx.font = ui(500, 28);
    ctx.fillText(fit(ctx, data.footer, W - 2 * x), x, H - 70);
  }
  return new Promise((res) => c.toBlob(res, 'image/png'));
}

// The sheet: the image, Share and Save
export async function openShareImage(data, fileName) {
  const blob = await drawWorkout(data);
  const file = new File([blob], fileName, { type: 'image/png' });
  const url = URL.createObjectURL(blob);
  const canShare = !!navigator.canShare?.({ files: [file] });
  openModal(`
    <div class="modal-head"><h2>Share workout</h2>
      <button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>
    <img class="share-img" src="${url}" alt="${esc(data.title)}">
    ${canShare ? `<button class="btn primary block" data-share>${icon('upload')} Share</button>` : ''}
    <button class="btn ${canShare ? 'ghost' : 'primary'} block" data-save>${icon('download')} Save image</button>
    ${canShare ? '' : '<p class="muted small share-hint">Sharing isn’t available here. Save the image, or take a screenshot of it.</p>'}`, {
    onMount(m, close) {
      m.querySelector('[data-close]').onclick = close;
      m.querySelector('[data-share]')?.addEventListener('click', async () => {
        try { await navigator.share({ files: [file], title: data.title }); } catch (e) { if (e?.name !== 'AbortError') toast('Could not share'); }
      });
      m.querySelector('[data-save]').onclick = () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      };
    },
    onClose() { setTimeout(() => URL.revokeObjectURL(url), 1000); },
  });
}

export const shareDateText = (key) => parseKey(key).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
