// Our own SVG artwork: muscle-group icons, exercise thumbnails, program card backgrounds and the empty-day graphic.
import { GROUP_COLORS } from './data.js';

const svg = (vb, body, cls = '') => `<svg class="${cls}" viewBox="${vb}" aria-hidden="true">${body}</svg>`;

// ---------- Muscle-group icons (outline, drawn in the group colour) ----------
const GROUP_PATHS = {
  Chest: '<path d="M3.5 7.5C6 5 9.5 5.5 11 7v6.5c-2 2.5-6 2.5-7.5-.5zM20.5 7.5C18 5 14.5 5.5 13 7v6.5c2 2.5 6 2.5 7.5-.5z"/><path d="M9 4.5h6"/>',
  Arms: '<path d="M3 19.5h9.5c3.5 0 6.5-2.5 6.5-6 0-1.8-.8-3.2-2-4.2L15 5c-.6-1.2-2.4-1.1-2.9.1L11 7.8c-.4 1 .7 1.9 1.6 1.3l1-.7.8 2.6c-2.4-.2-4.7 1-5.8 2.9H3z"/>',
  Back: '<path d="M5.5 4h13l-2.5 8 2.5 8h-13L8 12z"/><path d="M12 4v16M8.5 9.5 12 12l3.5-2.5"/>',
  Legs: '<path d="M8 3h7l-.5 7.5L16 21h-3.5L11 13l-1.5 8H6l2-10.5z"/>',
  Shoulders: '<circle cx="12" cy="6" r="2.5"/><path d="M3.5 17c0-4.5 3.5-7.5 8.5-7.5s8.5 3 8.5 7.5M7.5 13v7M16.5 13v7"/>',
  Core: '<rect x="7" y="3.5" width="10" height="17" rx="3"/><path d="M7 9h10M7 14.5h10M12 3.5v17"/>',
  'Full-Body': '<circle cx="12" cy="4.5" r="2"/><path d="M12 7.5v7M6.5 10h11M12 14.5l-3 6.5M12 14.5l3 6.5"/>',
  Cardio: '<path d="M12 20.5s-8.5-5.2-8.5-11.2A4.3 4.3 0 0 1 12 7.8a4.3 4.3 0 0 1 8.5 1.5c0 6-8.5 11.2-8.5 11.2z"/><path d="M5 12.5h3.5l1.8-2.8 2.4 5 1.8-2.2H19"/>',
  Other: '<path d="M4.5 9.5 9.5 4.5M3 11l5-5M6.5 13.5l7-7M10.5 17.5l7-7M14.5 19.5l5-5M16 21l5-5"/>',
};

export function groupIcon(group, size = 26) {
  const color = GROUP_COLORS[group] || GROUP_COLORS.Other;
  return `<svg class="group-ico" width="${size}" height="${size}" viewBox="0 0 24 24" style="color:${color}" aria-hidden="true">${GROUP_PATHS[group] || GROUP_PATHS.Other}</svg>`;
}

// ---------- Exercise thumbnails: a pictogram of the equipment ----------
const EQUIP_ART = {
  Barbell: '<rect x="4" y="22.5" width="40" height="3" rx="1.5" fill="#555"/><rect x="7" y="14" width="5" height="20" rx="1.5"/><rect x="12.5" y="17" width="3" height="14" rx="1"/><rect x="36" y="14" width="5" height="20" rx="1.5"/><rect x="32.5" y="17" width="3" height="14" rx="1"/>',
  Dumbbells: '<rect x="14" y="22.5" width="20" height="3" rx="1.5" fill="#555"/><rect x="9" y="15" width="6" height="18" rx="2"/><rect x="33" y="15" width="6" height="18" rx="2"/><rect x="5.5" y="18.5" width="4" height="11" rx="1.5"/><rect x="38.5" y="18.5" width="4" height="11" rx="1.5"/>',
  Machine: '<rect x="8" y="6" width="4" height="36" rx="1.5" fill="#555"/><rect x="8" y="6" width="26" height="4" rx="1.5" fill="#555"/><rect x="14" y="12" width="9" height="16" rx="1.5"/><path d="M14 16h9M14 20h9M14 24h9" stroke="#e6e6e6" stroke-width="1.2"/><rect x="24" y="30" width="16" height="5" rx="2"/><rect x="36" y="18" width="4" height="13" rx="1.5"/>',
  Cable: '<circle cx="24" cy="9" r="5" fill="none" stroke="#555" stroke-width="3"/><path d="M24 14v18" stroke="#555" stroke-width="2"/><rect x="15" y="31" width="18" height="4" rx="2"/><rect x="20" y="35" width="8" height="7" rx="2"/>',
  Bodyweight: '<circle cx="24" cy="9" r="4.5"/><path d="M24 15v13M13 20h22M24 28l-7 13M24 28l7 13" stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none"/>',
  Band: '<path d="M12 12c-6 4-6 20 0 24 7 5 17 5 24 0 6-4 6-20 0-24-7-5-17-5-24 0z" fill="none" stroke="currentColor" stroke-width="4"/><rect x="5" y="20" width="6" height="8" rx="2" fill="#555"/><rect x="37" y="20" width="6" height="8" rx="2" fill="#555"/>',
  Kettlebell: '<path d="M17 18c-1-9 15-9 14 0" fill="none" stroke="#555" stroke-width="4"/><path d="M13 30c0-8 5-12 11-12s11 4 11 12c0 5-3 9-6 10H19c-3-1-6-5-6-10z"/>',
  Other: '<rect x="10" y="10" width="28" height="28" rx="8" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="24" cy="24" r="5"/>',
};

export function exerciseThumb(ex) {
  const color = GROUP_COLORS[ex.group] || GROUP_COLORS.Other;
  const art = EQUIP_ART[ex.equip] || EQUIP_ART.Other;
  return `<span class="thumb" style="--g:${color}">${svg('0 0 48 48', `<g fill="currentColor">${art}</g>`)}</span>`;
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
