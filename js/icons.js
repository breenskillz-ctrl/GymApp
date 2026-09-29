// Our own SVG artwork: muscle-group icons, exercise thumbnails, program card backgrounds and the empty-day graphic.
import { GROUP_COLORS } from './data.js';
import { muscleSvg } from './musclemap.js';
import { PHOTOS } from './photos.js';

const svg = (vb, body, cls = '') => `<svg class="${cls}" viewBox="${vb}" aria-hidden="true">${body}</svg>`;

// ---------- Muscle-group icons: a body outline with the trained muscle filled in (our own drawings) ----------
const BUST = '<circle cx="16" cy="6.2" r="3.4"/><path d="M6.5 29v-8.5c0-4.6 2.8-7.8 6.8-8.7h5.4c4 .9 6.8 4.1 6.8 8.7V29"/>';
const GROUP_PATHS = {
  Chest: `${BUST}<path class="f" d="M8.8 15.9c1.9-2.2 4.9-2.6 6.5-1.2v5.4c-1.9 1.9-5.1 1.7-6.9-.3-.5-1.3-.3-2.8.4-3.9z"/><path class="f" d="M23.2 15.9c-1.9-2.2-4.9-2.6-6.5-1.2v5.4c1.9 1.9 5.1 1.7 6.9-.3.5-1.3.3-2.8-.4-3.9z"/>`,
  Arms: '<path d="M3.5 27.5h11c6.6 0 11.5-3.9 11.5-9.6 0-2.9-1.3-5.2-3.3-6.8l-1.9-5.6c-.7-2-3.4-2.1-4.3-.2l-1.9 3.9c-.7 1.5 1 3 2.4 2l1.1-.8 1.2 3.9c-3.7-.3-7.1 1.5-8.7 4.4H3.5"/><path class="f" d="M11.4 19.7c1.9-3 5.6-4.4 9-3.6 2.4.6 3.6 2.4 2.9 4.2-1 2.8-4.4 4.4-8.1 4.2-2.6-.2-4.5-2.1-3.8-4.8z"/>',
  Back: `${BUST}<path class="f" d="M12.2 13.4 15.2 15v11.6l-5.4-3.8c-1.3-3.2-1.1-6.8 2.4-9.4z"/><path class="f" d="M19.8 13.4 16.8 15v11.6l5.4-3.8c1.3-3.2 1.1-6.8-2.4-9.4z"/>`,
  Legs: '<path d="M8.6 3.5h6.2l-.4 10.4-1.2 6.6.6 8h-3.6l-.6-8-1.8-7.4z"/><path d="M23.4 3.5h-6.2l.4 10.4 1.2 6.6-.6 8h3.6l.6-8 1.8-7.4z"/><path class="f" d="M9.5 5.3h4.2l-.3 8.2-1.1 4.9h-1.6L9.1 12.8z"/><path class="f" d="M22.5 5.3h-4.2l.3 8.2 1.1 4.9h1.6l1.6-5.6z"/>',
  Shoulders: `${BUST}<path class="f" d="M6.6 20.5c-.3-4.2 1.7-7.4 5.2-8.5l1.3 3.6c-2.3 1-3.6 2.9-3.8 5.2z"/><path class="f" d="M25.4 20.5c.3-4.2-1.7-7.4-5.2-8.5l-1.3 3.6c2.3 1 3.6 2.9 3.8 5.2z"/>`,
  Core: `${BUST}${[14.6, 19, 23.4].map((y) => `<rect class="f" x="12.4" y="${y}" width="3.2" height="3.4" rx="1.1"/><rect class="f" x="16.4" y="${y}" width="3.2" height="3.4" rx="1.1"/>`).join('')}`,
  'Full-Body': '<circle class="f" cx="16" cy="4.8" r="2.9"/><path class="f" d="M12.2 9.3h7.6c1.4 0 2.5.9 2.9 2.2l2.4 8.2c.3 1-.3 2-1.3 2.2-.9.2-1.7-.3-2-1.2L20 15v5.6l1.2 8.3c.1 1-.6 1.9-1.6 1.9-.8 0-1.5-.6-1.6-1.4L16.6 22h-1.2L14 29.6c-.1.8-.8 1.4-1.6 1.4-1 0-1.7-.9-1.6-1.9L12 20.6V15l-1.8 5.7c-.3.9-1.1 1.4-2 1.2-1-.2-1.6-1.2-1.3-2.2l2.4-8.2c.4-1.3 1.5-2.2 2.9-2.2z"/>',
  Cardio: '<path class="s" d="M16 27.5S4 20.2 4 11.8A5.8 5.8 0 0 1 16 9a5.8 5.8 0 0 1 12 2.8C28 20.2 16 27.5 16 27.5z"/><path d="M4.8 16.5h5.4l2.2-3.6 3.4 7 2.4-3.4h9"/>',
  Other: '<g transform="rotate(-45 16 16)"><rect class="f" x="3" y="10" width="4" height="12" rx="1.4"/><rect class="f" x="7.6" y="7.5" width="4" height="17" rx="1.4"/><rect class="f" x="11.6" y="14.6" width="8.8" height="2.8"/><rect class="f" x="20.4" y="7.5" width="4" height="17" rx="1.4"/><rect class="f" x="25" y="10" width="4" height="12" rx="1.4"/></g>',
};

export function groupIcon(group, size = 30) {
  const color = GROUP_COLORS[group] || GROUP_COLORS.Other;
  return `<svg class="group-ico" width="${size}" height="${size}" viewBox="0 0 32 32" style="color:${color}" aria-hidden="true">${GROUP_PATHS[group] || GROUP_PATHS.Other}</svg>`;
}


export const photoUrl = (id, frame = 't') => `img/ex/${id}-${frame}.jpg`;
export const hasPhoto = (id) => PHOTOS.has(id);

// List thumbnail: our own muscle-map drawing for every exercise, zoomed to the upper or lower body (DECISIONS #42, #43).
// Photos are shown on the detail page only.
export function exerciseThumb(ex) {
  const color = GROUP_COLORS[ex.group] || GROUP_COLORS.Other;
  return `<span class="thumb mmap" style="--g:${color}">${muscleSvg(ex, true)}</span>`;
}

// ---------- Program card backgrounds ----------
const ART = [
  // Two kettlebells
  '<g fill="#2b2b2b" stroke="#3a3a3a" stroke-width="2"><path d="M96 70c-2-26 42-26 40 0" fill="none" stroke="#474747" stroke-width="9"/><path d="M84 100c0-22 14-32 32-32s32 10 32 32c0 15-8 26-16 30h-32c-8-4-16-15-16-30z"/><path d="M146 84c-2-26 42-26 40 0" fill="none" stroke="#474747" stroke-width="9"/><path d="M134 114c0-22 14-32 32-32s32 10 32 32c0 15-8 26-16 30h-32c-8-4-16-15-16-30z"/></g>',
  // Barbell with plates
  '<g fill="#2d2d2d" stroke="#3b3b3b" stroke-width="2"><rect x="10" y="84" width="220" height="7" rx="3" fill="#444"/><rect x="40" y="46" width="16" height="84" rx="4"/><rect x="58" y="56" width="11" height="64" rx="3"/><rect x="184" y="46" width="16" height="84" rx="4"/><rect x="171" y="56" width="11" height="64" rx="3"/></g>',
  // Dumbbell rack
  '<g fill="#2c2c2c" stroke="#3a3a3a" stroke-width="2"><rect x="30" y="118" width="190" height="6" rx="3" fill="#444"/><g><rect x="44" y="92" width="36" height="6" rx="3" fill="#444"/><rect x="36" y="80" width="12" height="30" rx="4"/><rect x="76" y="80" width="12" height="30" rx="4"/></g><g><rect x="104" y="90" width="40" height="6" rx="3" fill="#444"/><rect x="95" y="76" width="13" height="34" rx="4"/><rect x="140" y="76" width="13" height="34" rx="4"/></g><g><rect x="168" y="88" width="42" height="6" rx="3" fill="#444"/><rect x="158" y="72" width="14" height="38" rx="4"/><rect x="206" y="72" width="14" height="38" rx="4"/></g></g>',
  // Weight plates
  '<g fill="none" stroke="#3c3c3c"><circle cx="90" cy="92" r="46" stroke-width="14"/><circle cx="90" cy="92" r="10" fill="#2c2c2c" stroke-width="4"/><circle cx="170" cy="104" r="34" stroke-width="11"/><circle cx="170" cy="104" r="8" fill="#2c2c2c" stroke-width="3"/></g>',
];

const hash = (str) => [...String(str)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function programArt(id) {
  const art = ART[hash(id) % ART.length];
  return svg('0 0 240 180', `<defs><radialGradient id="pg" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#303030"/><stop offset="1" stop-color="#0d0d0d"/></radialGradient></defs><rect width="240" height="180" fill="url(#pg)"/>${art}`, 'prog-art');
}

// ---------- Empty day ----------
export const sleepArt = svg('0 0 120 120', `<g fill="#333" font-family="system-ui, sans-serif" font-weight="900">
  <text x="18" y="52" font-size="44" transform="rotate(-14 30 40)">Z</text>
  <text x="50" y="80" font-size="30" transform="rotate(-8 60 70)">Z</text>
  <text x="74" y="104" font-size="22" transform="rotate(10 80 96)">Z</text></g>`, 'sleep-art');
