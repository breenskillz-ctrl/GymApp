// Enkle grafer tegnet på <canvas>, uten eksterne biblioteker.

function css(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function setup(canvas, height) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.parentElement.clientWidth || 300;
  canvas.style.width = w + 'px';
  canvas.style.height = height + 'px';
  canvas.width = w * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, w, h: height };
}

function niceMax(v) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * p;
}

function empty(ctx, w, h, text) {
  ctx.fillStyle = css('--muted');
  ctx.font = '14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, w / 2, h / 2);
}

// points: [{ label, value }]
export function lineChart(canvas, points, { height = 200, format: fmt = (v) => v } = {}) {
  let format = fmt;
  const { ctx, w, h } = setup(canvas, height);
  if (points.length < 2) {
    empty(ctx, w, h, points.length ? 'Trenger minst to økter for graf' : 'Ingen data ennå');
    return;
  }
  const pad = { l: 44, r: 12, t: 12, b: 26 };
  const vals = points.map((p) => p.value);
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const range = max - min;
  min = Math.max(0, min - range * 0.1);
  max += range * 0.1;
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const labels = [0, 1, 2, 3, 4].map((i) => format(min + ((max - min) * i) / 4));
  if (new Set(labels).size < 5) format = (v) => Number(v.toFixed(1)).toLocaleString('nb-NO');
  const x = (i) => pad.l + (cw * i) / (points.length - 1);
  const y = (v) => pad.t + ch - ((v - min) / (max - min)) * ch;

  // Rutenett
  ctx.strokeStyle = css('--line');
  ctx.fillStyle = css('--muted');
  ctx.font = '11px system-ui, sans-serif';
  ctx.lineWidth = 1;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= 4; i++) {
    const v = min + ((max - min) * i) / 4;
    const yy = y(v);
    ctx.beginPath();
    ctx.moveTo(pad.l, yy);
    ctx.lineTo(w - pad.r, yy);
    ctx.stroke();
    ctx.fillText(format(v), pad.l - 6, yy);
  }

  // Etiketter på x-aksen
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const step = Math.ceil(points.length / Math.max(2, Math.floor(cw / 60)));
  points.forEach((p, i) => {
    if (i % step === 0 || i === points.length - 1) ctx.fillText(p.label, x(i), h - pad.b + 8);
  });

  // Fyll under linja
  const accent = css('--accent');
  const grad = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
  grad.addColorStop(0, accent + '55');
  grad.addColorStop(1, accent + '00');
  ctx.beginPath();
  ctx.moveTo(x(0), y(points[0].value));
  points.forEach((p, i) => ctx.lineTo(x(i), y(p.value)));
  ctx.lineTo(x(points.length - 1), h - pad.b);
  ctx.lineTo(x(0), h - pad.b);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Linje
  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(x(i), y(p.value)) : ctx.moveTo(x(i), y(p.value))));
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Punkter
  ctx.fillStyle = accent;
  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(x(i), y(p.value), 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

// bars: [{ label, value }]
export function barChart(canvas, bars, { height = 180, format = (v) => v } = {}) {
  const { ctx, w, h } = setup(canvas, height);
  const pad = { l: 30, r: 8, t: 14, b: 24 };
  const max = niceMax(Math.max(1, ...bars.map((b) => b.value)));
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const bw = cw / bars.length;

  ctx.strokeStyle = css('--line');
  ctx.fillStyle = css('--muted');
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= 2; i++) {
    const v = (max * i) / 2;
    const yy = pad.t + ch - (v / max) * ch;
    ctx.beginPath();
    ctx.moveTo(pad.l, yy);
    ctx.lineTo(w - pad.r, yy);
    ctx.stroke();
    ctx.fillText(format(v), pad.l - 6, yy);
  }

  const accent = css('--accent');
  ctx.textAlign = 'center';
  const every = Math.ceil(bars.length / Math.max(2, Math.floor(cw / 48)));
  bars.forEach((b, i) => {
    const bh = (b.value / max) * ch;
    const bx = pad.l + i * bw + bw * 0.18;
    const by = pad.t + ch - bh;
    ctx.fillStyle = i === bars.length - 1 ? accent : accent + '99';
    const r = Math.min(4, bh / 2);
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(bx, by, bw * 0.64, bh, [r, r, 0, 0]) : ctx.rect(bx, by, bw * 0.64, bh);
    ctx.fill();
    ctx.fillStyle = css('--muted');
    ctx.textBaseline = 'top';
    if ((bars.length - 1 - i) % every === 0) ctx.fillText(b.label, pad.l + i * bw + bw / 2, h - pad.b + 8);
  });
}
