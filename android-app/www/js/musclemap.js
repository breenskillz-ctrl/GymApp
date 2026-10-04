// Exercise muscle maps (DECISIONS #42): our own drawings of a body, front and back, where the trained muscles are lit.
// muscleSvg(ex)    – small full-body thumbnail for lists and cards
// muscleDetail(ex) – close-up of the trained body part with muscle fibres, for the exercise detail page
// Coordinates: viewBox 0 0 120 240, figure centred on x = 60. Muscles are drawn for one side (x < 60) and mirrored.

// ---------- Silhouette (light outline around and between the muscles) ----------
// Proportions of a muscular build: head about 1/8 of the height, shoulders about 0.4, thick arms and legs.
// One half of the outline, from the chin down the arm, round the hand, up the inner arm and down the torso and leg.
const HALF_BODY = 'M60 28 L52.2 28.6 Q51.4 33 49.8 36.6 Q43 38 34 41.6 Q20.2 44 17.6 56Q15.8 64 15.6 74Q14.4 86 14.6 96'
  + 'Q14.2 104 13 110Q10.6 122 10.8 134Q11.2 140 11.8 143Q8.8 150 10.2 158Q12.8 164 16.8 161Q19.8 154 19.6 144'
  + 'Q22.6 132 26 118Q28.4 110 29.6 104Q31.6 92 32.4 80Q32.8 70 34.8 64 Q34.6 76 38.6 92 Q42 104 43 110'
  + 'Q42.2 118 39.6 126 Q35.6 138 36 152 Q37 166 41 176 Q37.8 186 38.4 196 Q40 212 45 224 Q41.6 230 42.4 235'
  + 'L55 235 Q55.4 230 53.4 224 Q55.8 212 56 202 Q56.6 188 54.8 178 Q58.4 160 58.6 132 L60 128 Z';
const SILHOUETTE = [
  '<ellipse cx="60" cy="16.6" rx="11.2" ry="13.6"/>',
  `<path d="${HALF_BODY}"/>`,
  `<path d="${HALF_BODY}" transform="matrix(-1 0 0 1 120 0)"/>`,
];

// ---------- Muscles: [name, path for one side, fibre angle for the close-up] ----------
const FOREARM = 'M14 111.4Q11 124 12 138Q15.4 142.6 19.4 140Q24.4 126 27.4 114.6Q21.2 106.4 14 111.4Z';
const DELT = 'M36.2 41.6Q21.2 42.6 18.4 55Q16.6 64 17.2 74.4Q25.2 66 32 60Q37.8 52 37.4 44.6Z';
const FRONT = [
  ['traps', 'M52 34.4 Q50.8 37.8 45.6 39.4 L37 42 Q46.4 44.6 56.8 44.2 Z', 30],
  ['delts', DELT, 75],
  ['chest', 'M59 45.4 Q47 43.6 36.4 46.6 Q31.2 55 33.8 66 Q42 76.6 52 76.8 Q57 76.4 59 73.6 Z', 15],
  ['serratus', 'M33.8 70.4 Q34.8 78 37.2 84 L40.8 78 Q37.2 75 33.8 70.4 Z', 150],
  ['biceps', 'M18.6 76Q15.8 88 16.2 100Q20.8 107 26.2 104Q30.8 92 31.6 78Q26.2 70.6 18.6 76Z', 100],
  ['forearms', FOREARM, 105],
  ['abs', 'M52.2 80 q0 -1.6 1.6 -1.6 h3.8 q1.6 0 1.6 1.6 v6.4 h-7z M52.2 88 h7 v7.8 h-7z M52.2 97.4 h7 v7.8 h-7z '
    + 'M52.4 106.8 h6.8 v10 q0 4 -2.2 6 q-3.8 -2 -4.6 -7.4z', 90],
  ['obliques', 'M37.8 82.8 Q40 98 42 108 Q45 114 50.6 117 L50.6 80.2 Q44 79.2 37.8 82.8 Z', 60],
  ['quads', 'M41 128.6 Q36.4 142 37.2 158 Q39 170.6 45 175 Q52.8 176.2 55.8 170 Q58 152 57.6 136 Q51 130 41 128.6 Z', 90],
  ['adductors', 'M57.8 136.6 Q58.8 134.8 59.4 136.2 L59 158 Q56.4 148 57.8 136.6 Z', 105],
  ['calves', 'M39.6 182.4 Q38 196 40.8 209 Q45 215.4 48.6 208.6 Q50.8 194 49.8 182 Q45 178.4 39.6 182.4 Z M51.2 182.6 Q55.4 192 54.8 206 Q52.8 211 50.8 208.6 Q52.4 196 51.2 182.6 Z', 90],
];
const BACK = [
  ['traps', 'M59.6 28.4 L53 30.4 Q50.4 37 38 42 Q47 50 52.4 60 L59.6 84 Z', 30],
  ['delts', DELT, 75],
  ['upperback', 'M37 48.8 Q33.2 56 34.4 64 Q42 68.4 50.8 66.6 Q46.6 55.6 37 48.8 Z', 15],
  ['lats', 'M34.2 68 Q35.8 86 42.6 106 Q50 111 58.6 106 L58.6 88 Q54.2 74 52 68.6 Q42 70.6 34.2 68 Z', 60],
  ['triceps', 'M18.2 74.6Q15.4 88 16.2 100.6Q21.6 105.6 26.2 102Q31 90 31.6 76Q25.2 70 18.2 74.6Z', 100],
  ['forearms', FOREARM, 105],
  ['lowerback', 'M53.2 90 Q56.4 92 59.2 90.4 L59.2 118 Q55.4 120 51.8 118 Q54.2 104 53.2 90 Z', 90],
  ['glutes', 'M40.8 119.4 Q36.4 130 38.8 142.4 Q48.4 149.4 59.4 144 L59.4 121 Q50.4 116.6 40.8 119.4 Z', 30],
  ['hamstrings', 'M37.8 146 Q36.6 160 40 172.6 Q48 177.6 56.6 172.4 Q58.4 158 58.2 147.4 Q48.6 150.4 37.8 146 Z', 90],
  ['calves', 'M39.2 180 Q35.8 194 39.4 209 Q44.6 215.4 49.2 207.6 Q51.6 194 50.2 179.8 Q45 176.2 39.2 180 Z M51.6 180 Q56 190 55.2 206 Q52.8 211 50.6 208 Q53 194 51.6 180 Z', 90],
];

const MUSCLE_NAMES = {
  traps: 'Traps', delts: 'Shoulders', chest: 'Chest', serratus: 'Serratus', biceps: 'Biceps', forearms: 'Forearms', abs: 'Abs',
  obliques: 'Obliques', quads: 'Quads', adductors: 'Adductors', calves: 'Calves', upperback: 'Upper back', lats: 'Lats',
  triceps: 'Triceps', lowerback: 'Lower back', glutes: 'Glutes', hamstrings: 'Hamstrings',
};
export const muscleName = (m) => MUSCLE_NAMES[m] || m;

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
  'rack-pull': M('b', ['lowerback', 'glutes', 'traps'], ['hamstrings', 'lats', 'forearms']),
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
  'slam-ball': M('f', ['delts', 'abs'], ['quads']),
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

// ---------- Drawing ----------
const MIRROR = 'transform="matrix(-1 0 0 1 120 0)"';
// Final proportions (chosen by the user): the drawing is squeezed to 83 % height and 92 % width around x = 60
const SX = 0.92;
const SY = 1 / 1.2;
const SHAPE = `transform="matrix(${SX} 0 0 ${SY} ${60 * (1 - SX)} 0)"`;
// A rectangle in drawing coordinates → the same area after SHAPE (made square around its centre unless square = false)
function fitRect([x, y, w, h], square = true) {
  const nx = 60 + (x - 60) * SX;
  const nw = w * SX;
  const ny = y * SY;
  const nh = h * SY;
  if (!square) return [nx, ny, nw, nh].map((v) => Math.round(v * 10) / 10);
  const side = Math.max(nw, nh);
  return [nx + nw / 2 - side / 2, ny + nh / 2 - side / 2, side, side].map((v) => Math.round(v * 10) / 10);
}
const stateOf = (m, name) => (m.p.includes(name) ? 'mp' : m.s.includes(name) ? 'ms' : 'mn');

function body(m, fibres = false) {
  const shapes = m.view === 'b' ? BACK : FRONT;
  const half = shapes.map(([name, d, ang]) => {
    const fib = fibres ? `<path class="mf" d="${d}" fill="url(#mm-fib-${((Math.round(ang / 15) * 15) % 180 + 180) % 180})"/>` : '';
    return `<path class="${stateOf(m, name)}" d="${d}"/>${fib}`;
  }).join('');
  const midline = m.view === 'b' ? 'M60 30 V118' : 'M60 45 V77';
  return `<g ${SHAPE}><g class="mm-sil">${SILHOUETTE.join('')}</g>`
    + `<g class="mm-muscles">${half}<g ${MIRROR}>${half}</g><path class="mm-line" d="${midline}"/></g></g>`;
}

// Fibre hatching for the close-up: one pattern per angle (every 15°)
const fibreDefs = () => `<defs>${Array.from({ length: 12 }, (_, i) => i * 15).map((a) => `<pattern id="mm-fib-${a}" width="1.6" height="1.6"
  patternUnits="userSpaceOnUse" patternTransform="rotate(${a})"><path d="M0 .8H1.6"/></pattern>`).join('')}</defs>`;

// Small thumbnail: the whole body, or (crop = true) only the upper or lower half when all primary muscles are there
const LOWER = ['quads', 'adductors', 'hamstrings', 'glutes', 'calves'];
export const muscleSvg = (ex, crop = false) => mapSvg(musclesFor(ex), crop);

function mapSvg(m, crop) {
  const lit = m.p; // the primary muscles decide the crop; secondary ones may fall outside it
  let vb = fitRect([-6, 0, 132, 240], false);
  if (crop && lit.length && lit.every((x) => !LOWER.includes(x))) vb = fitRect([-8, 1, 136, 150]);
  else if (crop && lit.length && lit.every((x) => LOWER.includes(x))) vb = fitRect([6, 114, 108, 124]);
  return `<svg class="mm" viewBox="${vb.join(' ')}" aria-hidden="true">${body(m)}</svg>`;
}

// Close-up regions [x, y, w, h] in figure coordinates per primary muscle
const REGION = {
  f: {
    chest: [10, 20, 100, 100], delts: [10, 20, 100, 100], traps: [10, 14, 100, 100], serratus: [10, 20, 100, 100],
    abs: [24, 64, 72, 72], obliques: [24, 64, 72, 72], biceps: [-24, 44, 110, 110], forearms: [-22, 97, 76, 76],
    quads: [22, 112, 76, 76], adductors: [22, 112, 76, 76], calves: [26, 172, 68, 68],
  },
  b: {
    traps: [10, 14, 100, 100], delts: [10, 20, 100, 100], upperback: [10, 20, 100, 100], lats: [16, 36, 88, 88],
    triceps: [-24, 44, 110, 110], forearms: [-22, 97, 76, 76], lowerback: [24, 80, 72, 72], glutes: [22, 108, 76, 76],
    hamstrings: [22, 118, 76, 76], calves: [26, 170, 68, 68],
  },
};

// Close-up of the trained body part with muscle fibres (exercise detail page)
export function muscleDetail(ex) {
  const m = musclesFor(ex);
  // Square that covers the regions of all primary muscles
  const rs = m.p.map((x) => REGION[m.view][x]).filter(Boolean);
  let r = [0, 0, 120, 240];
  if (rs.length) {
    const x0 = Math.min(...rs.map((q) => q[0]));
    const y0 = Math.min(...rs.map((q) => q[1]));
    const x1 = Math.max(...rs.map((q) => q[0] + q[2]));
    const y1 = Math.max(...rs.map((q) => q[1] + q[3]));
    const side = Math.max(x1 - x0, y1 - y0);
    r = [(x0 + x1 - side) / 2, (y0 + y1 - side) / 2, side, side];
  }
  r = fitRect(r);
  return `<svg class="mm mm-detail" viewBox="${r.join(' ')}" aria-hidden="true">${fibreDefs()}${body(m, true)}</svg>`;
}

// Names of the trained muscles, for the detail page
export function muscleLists(ex) {
  const m = musclesFor(ex);
  return { primary: m.p.map(muscleName), secondary: m.s.map(muscleName) };
}
