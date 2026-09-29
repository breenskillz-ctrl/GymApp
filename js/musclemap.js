// Exercise thumbnails in one style (DECISIONS #42): a body figure (front or back) with the trained muscles lit in the
// accent colour, plus a small badge for the equipment. Our own artwork, drawn in code, so every exercise matches.
// ---------- Body shapes (viewBox 0 0 100 100) ----------
// Each muscle is its own shape; the thin gaps between them (stroke in the thumbnail background colour) draw the anatomy.
const L = (d) => d; // readability helper for path data
const FRONT = {
  base: [
    '<circle cx="50" cy="9.5" r="6.8"/>',
    '<rect x="46.2" y="14" width="7.6" height="6" rx="2"/>',
    '<circle cx="26.4" cy="62.5" r="3"/><circle cx="73.6" cy="62.5" r="3"/>',
    '<path d="M42 56h16l-1.5 7.5h-13z"/>',
    '<ellipse cx="44" cy="82.5" rx="3.6" ry="2.4"/><ellipse cx="56" cy="82.5" rx="3.6" ry="2.4"/>',
    '<path d="M40.5 97h6.5v2.4h-7.5zM53 97h6.5l1 2.4H53z"/>',
  ],
  traps: [L('M44 19.5 L50 21.5 L56 19.5 L61.5 22.5 L38.5 22.5 Z')],
  delts: ['<ellipse cx="34" cy="27" rx="6.4" ry="6.2" transform="rotate(-18 34 27)"/>', '<ellipse cx="66" cy="27" rx="6.4" ry="6.2" transform="rotate(18 66 27)"/>'],
  chest: [L('M49.4 23.4 L40.2 23.8 Q36.4 29.5 39.2 35.2 Q44.6 38.2 49.4 35.6 Z'), L('M50.6 23.4 L59.8 23.8 Q63.6 29.5 60.8 35.2 Q55.4 38.2 50.6 35.6 Z')],
  biceps: ['<ellipse cx="30.4" cy="38.5" rx="3.9" ry="7.6" transform="rotate(10 30.4 38.5)"/>', '<ellipse cx="69.6" cy="38.5" rx="3.9" ry="7.6" transform="rotate(-10 69.6 38.5)"/>'],
  forearms: ['<ellipse cx="27.8" cy="52" rx="3.4" ry="7.6" transform="rotate(8 27.8 52)"/>', '<ellipse cx="72.2" cy="52" rx="3.4" ry="7.6" transform="rotate(-8 72.2 52)"/>'],
  abs: [
    '<rect x="44.4" y="37.4" width="5.3" height="5.4" rx="1.6"/>', '<rect x="50.3" y="37.4" width="5.3" height="5.4" rx="1.6"/>',
    '<rect x="44.4" y="43.4" width="5.3" height="5.4" rx="1.6"/>', '<rect x="50.3" y="43.4" width="5.3" height="5.4" rx="1.6"/>',
    '<rect x="44.8" y="49.4" width="4.9" height="6.2" rx="1.8"/>', '<rect x="50.3" y="49.4" width="4.9" height="6.2" rx="1.8"/>',
  ],
  obliques: [L('M39.6 37.2 Q43.4 38.6 43.6 39 L43.8 55.4 L41.4 55.6 Q38.6 46 39.6 37.2 Z'), L('M60.4 37.2 Q56.6 38.6 56.4 39 L56.2 55.4 L58.6 55.6 Q61.4 46 60.4 37.2 Z')],
  quads: [L('M42.2 63.2 L49.4 63.4 L48.6 79.6 Q44.4 81.6 41 79 Q38.8 70 42.2 63.2 Z'), L('M57.8 63.2 L50.6 63.4 L51.4 79.6 Q55.6 81.6 59 79 Q61.2 70 57.8 63.2 Z')],
  adductors: [L('M48.2 63.8 L49.6 63.8 L49.2 72 Z'), L('M51.8 63.8 L50.4 63.8 L50.8 72 Z')],
  calves: ['<ellipse cx="43.6" cy="90" rx="3.3" ry="6.6"/>', '<ellipse cx="56.4" cy="90" rx="3.3" ry="6.6"/>'],
};
const BACK = {
  base: [
    '<circle cx="50" cy="9.5" r="6.8"/>',
    '<rect x="46.2" y="14" width="7.6" height="5" rx="2"/>',
    '<circle cx="26.4" cy="62.5" r="3"/><circle cx="73.6" cy="62.5" r="3"/>',
    '<ellipse cx="44" cy="81.6" rx="3.6" ry="2.4"/><ellipse cx="56" cy="81.6" rx="3.6" ry="2.4"/>',
    '<path d="M40.5 97h6.5v2.4h-7.5zM53 97h6.5l1 2.4H53z"/>',
  ],
  traps: [L('M50 17.6 L60.8 22.8 L55 29 L50 38 L45 29 L39.2 22.8 Z')],
  delts: ['<ellipse cx="34" cy="27" rx="6.4" ry="6.2" transform="rotate(-18 34 27)"/>', '<ellipse cx="66" cy="27" rx="6.4" ry="6.2" transform="rotate(18 66 27)"/>'],
  upperback: [L('M44.6 29.6 L49.4 38.4 L41.2 33.4 L40.8 28 Z'), L('M55.4 29.6 L50.6 38.4 L58.8 33.4 L59.2 28 Z')],
  lats: [L('M40.2 34.2 L49.2 39.6 L48.6 47.6 L43.6 51.2 Q38 43 40.2 34.2 Z'), L('M59.8 34.2 L50.8 39.6 L51.4 47.6 L56.4 51.2 Q62 43 59.8 34.2 Z')],
  triceps: ['<ellipse cx="30.4" cy="38.5" rx="3.9" ry="7.6" transform="rotate(10 30.4 38.5)"/>', '<ellipse cx="69.6" cy="38.5" rx="3.9" ry="7.6" transform="rotate(-10 69.6 38.5)"/>'],
  forearms: ['<ellipse cx="27.8" cy="52" rx="3.4" ry="7.6" transform="rotate(8 27.8 52)"/>', '<ellipse cx="72.2" cy="52" rx="3.4" ry="7.6" transform="rotate(-8 72.2 52)"/>'],
  lowerback: [L('M44.6 51.8 L49.4 48.6 L49.4 56.6 L43.2 56.6 Z'), L('M55.4 51.8 L50.6 48.6 L50.6 56.6 L56.8 56.6 Z')],
  glutes: [L('M42.4 57.4 L49.4 57.4 L49.4 66.2 Q44.8 68.2 41.4 65.6 Q40.4 61 42.4 57.4 Z'), L('M57.6 57.4 L50.6 57.4 L50.6 66.2 Q55.2 68.2 58.6 65.6 Q59.6 61 57.6 57.4 Z')],
  hamstrings: [L('M41.8 67.4 Q45 69 49 67.6 L48.4 79 Q44.4 80.6 41.4 78.6 Q40.4 72.6 41.8 67.4 Z'), L('M58.2 67.4 Q55 69 51 67.6 L51.6 79 Q55.6 80.6 58.6 78.6 Q59.6 72.6 58.2 67.4 Z')],
  calves: ['<ellipse cx="43.8" cy="89.4" rx="3.9" ry="6.9"/>', '<ellipse cx="56.2" cy="89.4" rx="3.9" ry="6.9"/>'],
};

// ---------- Which muscles an exercise trains ----------
// view: 'f' front or 'b' back; p = primary (lit), s = secondary (half lit)
const M = (view, p, s = []) => ({ view, p, s });
const BY_SUB = {
  'Chest|Upper': M('f', ['chest'], ['delts']),
  'Chest|Middle': M('f', ['chest'], ['delts']),
  'Chest|Lower': M('f', ['chest'], ['delts']),
  'Back|Lats': M('b', ['lats'], ['upperback', 'delts']),
  'Back|Upper back': M('b', ['upperback', 'traps'], ['lats', 'delts']),
  'Back|Lower back': M('b', ['lowerback'], ['glutes', 'hamstrings']),
  'Back|Traps': M('b', ['traps'], ['upperback']),
  'Shoulders|Anterior': M('f', ['delts'], ['traps']),
  'Shoulders|Lateral': M('f', ['delts'], ['traps']),
  'Shoulders|Posterior': M('b', ['delts'], ['upperback', 'traps']),
  'Arms|Biceps': M('f', ['biceps'], ['forearms']),
  'Arms|Triceps': M('b', ['triceps']),
  'Arms|Forearms': M('f', ['forearms']),
  'Legs|Quads': M('f', ['quads'], ['adductors']),
  'Legs|Hamstrings': M('b', ['hamstrings'], ['glutes']),
  'Legs|Glutes': M('b', ['glutes'], ['hamstrings']),
  'Legs|Calves': M('b', ['calves']),
  'Core|Abs': M('f', ['abs'], ['obliques']),
  'Core|Obliques': M('f', ['obliques'], ['abs']),
};
const BY_GROUP = {
  Chest: BY_SUB['Chest|Middle'], Back: BY_SUB['Back|Lats'], Shoulders: BY_SUB['Shoulders|Anterior'], Arms: BY_SUB['Arms|Biceps'],
  Legs: BY_SUB['Legs|Quads'], Core: BY_SUB['Core|Abs'],
  'Full-Body': M('f', ['quads', 'delts'], ['chest', 'abs', 'forearms', 'traps']),
  Cardio: M('f', ['quads', 'calves'], ['abs']),
  Other: M('f', [], ['abs']),
};
// Exercises that train more than their region says
const BY_ID = {
  deadlift: M('b', ['lowerback', 'glutes', 'hamstrings'], ['traps', 'lats', 'forearms']),
  'sumo-deadlift': M('b', ['glutes', 'hamstrings', 'lowerback'], ['traps']),
  'romanian-deadlift': M('b', ['hamstrings'], ['glutes', 'lowerback']),
  'db-romanian-deadlift': M('b', ['hamstrings'], ['glutes', 'lowerback']),
  'good-morning': M('b', ['hamstrings', 'lowerback'], ['glutes']),
  'back-extension': M('b', ['lowerback'], ['glutes', 'hamstrings']),
  squat: M('f', ['quads'], ['adductors', 'abs']),
  'front-squat': M('f', ['quads'], ['abs']),
  'hip-adduction': M('f', ['adductors'], ['quads']),
  'hip-abduction': M('b', ['glutes']),
  'kettlebell-swing': M('b', ['glutes', 'hamstrings'], ['lowerback', 'delts']),
  'deadlift-high-pull': M('b', ['traps', 'delts'], ['glutes', 'hamstrings', 'lowerback']),
  clean: M('b', ['glutes', 'hamstrings', 'traps'], ['lowerback', 'delts']),
  'power-clean': M('b', ['glutes', 'hamstrings', 'traps'], ['lowerback', 'delts']),
  snatch: M('b', ['glutes', 'hamstrings', 'traps', 'delts'], ['lowerback']),
  'renegade-row': M('b', ['lats', 'upperback'], ['triceps', 'delts']),
  'squat-row': M('b', ['lats', 'upperback'], ['glutes', 'hamstrings']),
  'muscle-up': M('b', ['lats', 'triceps'], ['upperback', 'delts']),
  'gorilla-chin-crunch': M('f', ['abs', 'biceps'], ['forearms']),
  'pull-ups': M('b', ['lats'], ['upperback', 'delts', 'forearms']),
  dips: M('f', ['chest'], ['delts']),
  'close-grip-bench': M('b', ['triceps'], ['delts']),
  'hanging-leg-raise': M('f', ['abs'], ['obliques', 'forearms']),
  plank: M('f', ['abs'], ['obliques', 'delts']),
  'side-plank': M('f', ['obliques'], ['abs', 'delts']),
  'ab-wheel': M('f', ['abs'], ['delts', 'obliques']),
  'rowing-machine': M('b', ['lats', 'upperback'], ['hamstrings', 'glutes', 'delts']),
  swimming: M('b', ['lats', 'delts'], ['triceps', 'upperback']),
  'battle-rope': M('f', ['delts', 'forearms'], ['abs', 'biceps']),
  'jump-rope': M('b', ['calves'], ['delts', 'forearms']),
  cycling: M('f', ['quads'], ['calves']),
  'stair-climber': M('b', ['glutes', 'calves'], ['hamstrings']),
  stepper: M('b', ['glutes', 'calves'], ['hamstrings']),
  'butt-kicks': M('b', ['hamstrings', 'calves']),
  'mountain-climbers': M('f', ['abs', 'delts'], ['quads']),
  burpees: M('f', ['chest', 'quads'], ['delts', 'abs']),
  'wall-ball': M('f', ['quads', 'delts'], ['chest', 'abs']),
  'slam-ball': M('f', ['delts', 'abs'], ['lats', 'quads']),
  'turkish-get-up': M('f', ['delts', 'abs'], ['quads', 'obliques']),
  'iron-cross': M('f', ['delts'], ['quads', 'abs']),
  'farmers-walk': M('f', ['forearms', 'traps'], ['quads', 'abs']),
};

// Guess from the name, for custom and imported exercises without a region
const BY_NAME = [
  [/tricep|skull|pushdown|kickback(?!.*glute)/i, BY_SUB['Arms|Triceps']],
  [/leg curl|hamstring|nordic/i, BY_SUB['Legs|Hamstrings']],
  [/wrist|forearm|grip/i, BY_SUB['Arms|Forearms']],
  [/curl/i, BY_SUB['Arms|Biceps']],
  [/rear delt|reverse fly|face pull/i, BY_SUB['Shoulders|Posterior']],
  [/lateral raise|front raise|overhead press|shoulder press|arnold/i, BY_SUB['Shoulders|Anterior']],
  [/shrug/i, BY_SUB['Back|Traps']],
  [/hyperextension|back extension|good morning|jefferson/i, BY_SUB['Back|Lower back']],
  [/deadlift/i, BY_ID.deadlift],
  [/pull ?down|pull ?up|chin|lat /i, BY_SUB['Back|Lats']],
  [/row/i, BY_SUB['Back|Upper back']],
  [/calf|calves/i, BY_SUB['Legs|Calves']],
  [/glute|hip thrust|bridge|abduct/i, BY_SUB['Legs|Glutes']],
  [/adduct/i, BY_ID['hip-adduction']],
  [/squat|leg press|lunge|step ?up|leg extension/i, BY_SUB['Legs|Quads']],
  [/twist|rotation|side bend|woodchop|oblique/i, BY_SUB['Core|Obliques']],
  [/crunch|plank|leg raise|sit ?up|ab |abs|bird dog|dead bug/i, BY_SUB['Core|Abs']],
  [/bench|chest|fly|flye|pec|dip|push ?up/i, BY_SUB['Chest|Middle']],
  [/steps|walk|run|treadmill|bike|cycl|climber|row(ing)? machine/i, BY_GROUP.Cardio],
];

export function musclesFor(ex) {
  if (BY_ID[ex.id]) return BY_ID[ex.id];
  if (ex.sub && BY_SUB[`${ex.group}|${ex.sub}`]) return BY_SUB[`${ex.group}|${ex.sub}`];
  if (['Full-Body', 'Cardio', 'Other'].includes(ex.group) || !BY_GROUP[ex.group]) {
    const hit = BY_NAME.find(([re]) => re.test(ex.name || ''));
    if (hit) return hit[1];
  }
  return BY_GROUP[ex.group] || BY_GROUP.Other;
}

// ---------- Equipment badges (viewBox 0 0 24 24) ----------
const BADGE = {
  Barbell: '<path d="M2 12h20"/><path d="M5 8v8M8 6v12M16 6v12M19 8v8"/>',
  'Smith Machine': '<path d="M4 3v18M20 3v18M4 12h16"/><path d="M8 9v6M16 9v6"/>',
  Dumbbell: '<path d="M8 12h8"/><rect x="3" y="8" width="5" height="8" rx="1.5"/><rect x="16" y="8" width="5" height="8" rx="1.5"/>',
  Kettlebell: '<path d="M9 8a3 3 0 0 1 6 0"/><path d="M6.5 16a5.5 5.5 0 1 1 11 0c0 2-1 3.5-2 4h-7c-1-.5-2-2-2-4z"/>',
  Cable: '<circle cx="12" cy="5" r="3"/><circle cx="12" cy="5" r=".6"/><path d="M12 8v6"/><path d="M8 14h8M8 14q0 6 4 6t4-6"/>',
  Machine: '<rect x="4" y="3" width="6" height="18" rx="1.5"/><path d="M10 8h8M10 12h8M18 6v10"/>',
  Band: '<path d="M5 18c0-9 14-9 14 0"/><path d="M3 18h4M17 18h4"/>',
  Plate: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/>',
  Bodyweight: '<circle cx="12" cy="5" r="2.5"/><path d="M12 8v7M7 11h10M12 15l-3.5 6M12 15l3.5 6"/>',
  Other: '<circle cx="12" cy="12" r="7"/><path d="M12 8v4l3 2"/>',
};

// Thumbnail SVG for an exercise (fills its .thumb box)
export function muscleSvg(ex) {
  const m = musclesFor(ex);
  const body = m.view === 'b' ? BACK : FRONT;
  const parts = [];
  for (const [name, shapes] of Object.entries(body)) {
    if (name === 'base') continue;
    const cls = m.p.includes(name) ? 'mp' : m.s.includes(name) ? 'ms' : 'mn';
    for (const s of shapes) parts.push(s.startsWith('<') ? s.replace(/^<(\w+)/, `<$1 class="${cls}"`) : `<path class="${cls}" d="${s}"/>`);
  }
  const badge = BADGE[ex.equip] || BADGE.Other;
  return `<svg class="mm" viewBox="0 0 100 100" aria-hidden="true">
    <g class="mm-base">${body.base.join('')}</g><g class="mm-muscles">${parts.join('')}</g>
    <g class="mm-badge" transform="translate(74 74)"><circle cx="11" cy="11" r="12.5"/>
      <g transform="translate(1.4 1.4) scale(.8)" fill="none" stroke-linecap="round" stroke-linejoin="round">${badge}</g></g>
  </svg>`;
}
