// Food log (DECISIONS #56): common foods, daily goals, Open Food Facts lookups, barcode reading and the Makrologg import.
// All values are per 100 g. Data lives in state.food; body weight stays in state.body like before.
import { state, save } from './store.js';
import { uid } from './utils.js';

// [English name, Norwegian name (searchable too), kcal, protein, fat, carbs, [portion label, grams]] per 100 g
const BASE_ROWS = [
  ['Oats', 'Havregryn', 367, 13, 7, 58, ['1 dl', 35]], ['Wholemeal bread', 'Grovbrød', 240, 9, 3.5, 40, ['1 slice', 40]],
  ['Kneipp bread', 'Kneippbrød', 235, 8, 2.5, 42, ['1 slice', 40]], ['Crispbread', 'Knekkebrød', 340, 10, 2, 64, ['1 piece', 13]],
  ['Semi-skimmed milk (1 %)', 'Lettmelk', 43, 3.5, 1, 4.6, ['1 glass', 200]], ['Whole milk', 'Helmelk', 64, 3.4, 3.5, 4.6, ['1 glass', 200]],
  ['Skimmed milk', 'Skummet melk', 35, 3.5, 0.1, 4.6, ['1 glass', 200]], ['Skyr, plain', 'Skyr naturell', 63, 11, 0.2, 4, ['1 cup', 170]],
  ['Greek yoghurt 10 %', 'Gresk yoghurt', 130, 4, 10, 5, ['1 dl', 100]], ['Cottage cheese', 'Cottage cheese', 98, 12.5, 4.3, 2.5, ['1 tub', 200]],
  ['Egg', 'Egg', 145, 12.5, 10, 0.5, ['1 egg', 60]], ['Cheese (Norvegia)', 'Gulost', 350, 27, 27, 0, ['1 slice', 10]],
  ['Cheese, light 16 %', 'Gulost lett', 270, 30, 16, 0, ['1 slice', 10]], ['Brown cheese', 'Brunost', 465, 9.5, 30, 40, ['1 slice', 10]],
  ['Butter', 'Smør', 740, 0.6, 82, 0.6, ['1 tsp', 5]], ['Mackerel in tomato', 'Makrell i tomat', 190, 13, 14, 4, ['On a slice', 25]],
  ['Liver pâté', 'Leverpostei', 230, 10, 18, 6, ['On a slice', 15]], ['Ham, boiled', 'Kokt skinke', 105, 20, 2.5, 1, ['1 slice', 12]],
  ['Turkey slices', 'Kalkunpålegg', 100, 21, 1.5, 1, ['1 slice', 12]], ['Peanut butter', 'Peanøttsmør', 600, 25, 50, 12, ['1 tbsp', 15]],
  ['Banana', 'Banan', 88, 1.1, 0.3, 20, ['1 banana', 120]], ['Apple', 'Eple', 52, 0.3, 0.2, 12, ['1 apple', 150]],
  ['Orange', 'Appelsin', 47, 1, 0.2, 9.5, ['1 orange', 160]], ['Blueberries', 'Blåbær', 51, 0.7, 0.6, 9, ['1 dl', 65]],
  ['Chicken breast (raw)', 'Kyllingfilet rå', 105, 23, 1.5, 0, ['1 fillet', 150]],
  ['Chicken breast (cooked)', 'Kyllingfilet stekt', 155, 31, 3.5, 0, ['1 fillet', 120]],
  ['Minced beef 14 % (raw)', 'Kjøttdeig', 200, 18, 14, 0, ['1 pack', 400]], ['Salmon (raw)', 'Laks', 200, 20, 13, 0, ['1 fillet', 125]],
  ['Cod (raw)', 'Torsk', 75, 18, 0.5, 0, ['1 fillet', 125]], ['Tuna in water', 'Tunfisk', 110, 25, 1, 0, ['1 can', 120]],
  ['Rice (cooked)', 'Ris kokt', 130, 2.7, 0.3, 28, ['1 portion', 180]], ['Rice (uncooked)', 'Ris ukokt', 355, 7, 0.8, 78, ['1 portion', 70]],
  ['Pasta (cooked)', 'Pasta kokt', 150, 5.5, 1, 30, ['1 portion', 200]], ['Pasta (uncooked)', 'Pasta ukokt', 355, 12.5, 1.5, 70, ['1 portion', 90]],
  ['Potatoes (boiled)', 'Poteter', 80, 2, 0.1, 17, ['1 potato', 80]], ['Sweet potato', 'Søtpotet', 86, 1.6, 0.1, 20, ['1 piece', 200]],
  ['Broccoli', 'Brokkoli', 34, 3, 0.4, 4, ['1 portion', 100]], ['Carrot', 'Gulrot', 40, 0.8, 0.2, 8, ['1 carrot', 70]],
  ['Tomato', 'Tomat', 20, 0.8, 0.3, 3, ['1 tomato', 90]], ['Cucumber', 'Agurk', 12, 0.7, 0.1, 1.8, ['3 slices', 30]],
  ['Avocado', 'Avokado', 200, 1.9, 20, 2, ['½ avocado', 75]], ['Olive oil', 'Olivenolje', 900, 0, 100, 0, ['1 tbsp', 10]],
  ['Almonds', 'Mandler', 610, 21, 53, 7, ['1 handful', 25]], ['Protein powder (whey)', 'Proteinpulver', 380, 75, 6, 8, ['1 scoop', 30]],
  ['Frozen pizza', 'Frossenpizza', 235, 9, 9, 29, ['½ pizza', 280]], ['Milk chocolate', 'Melkesjokolade', 535, 8, 30, 57, ['1 row', 20]],
  ['Crisps', 'Potetgull', 540, 6, 34, 50, ['1 handful', 30]], ['Soft drink with sugar', 'Brus', 42, 0, 0, 10.5, ['0.5 l', 500]],
  ['Orange juice', 'Appelsinjuice', 43, 0.6, 0.1, 9.5, ['1 glass', 200]], ['Beer 4.7 %', 'Øl', 43, 0.4, 0, 3.5, ['0.5 l', 500]],
  ['Coffee, black', 'Kaffe', 1, 0.1, 0, 0, ['1 cup', 200]], ['Hummus', 'Hummus', 280, 7, 23, 10, ['2 tbsp', 30]],
  ['Sour cream, light 18 %', 'Rømme lett', 185, 3, 18, 3.5, ['1 tbsp', 15]], ['Grill sausage', 'Grillpølse', 230, 11, 19, 4, ['1 sausage', 70]],
  ['Lompe (potato flatbread)', 'Lompe', 205, 4.5, 1.5, 43, ['1 lompe', 30]], ['Hot dog bun', 'Pølsebrød', 270, 8, 4, 50, ['1 bun', 45]],
  ['Tortilla wrap', 'Tortillalefse', 310, 8.5, 7.5, 52, ['1 wrap', 40]], ['Muesli', 'Müsli', 380, 10, 9, 62, ['1 dl', 45]],
  ['Quark, light (Kesam)', 'Kesam lett', 64, 10, 1, 4, ['1 dl', 100]],
];
export const BASE_FOODS = BASE_ROWS.map(([name, no, kcal, p, f, c, por], i) => ({
  id: `b${i}`, name, no, per: { kcal, p, f, c }, portion: por ? { label: por[0], g: por[1] } : null, base: true,
}));

export const MEALS = [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'], ['supper', 'Evening meal'], ['snacks', 'Snacks']];
export const DEFAULT_GOALS = { kcal: 2200, p: 150, c: 240, f: 70, water: 8 };

// state.food with every part present (older saves have no food at all)
export function F() {
  const f = state.food || (state.food = {});
  f.calc ||= {};
  f.items ||= {};
  f.days ||= {};
  return f;
}
export const goals = () => ({ ...DEFAULT_GOALS, ...(F().goals || {}) });
export const foodDay = (key) => F().days[key] || { entries: [], water: 0 };

export function saveFoodDay(key, day) {
  if (!day.entries.length && !day.water) delete F().days[key]; else F().days[key] = day;
  save();
}

export const scale = (per, g) => ({ kcal: per.kcal * g / 100, p: per.p * g / 100, c: per.c * g / 100, f: per.f * g / 100 });

export function totals(day) {
  const t = { kcal: 0, p: 0, c: 0, f: 0 };
  for (const e of day?.entries || []) { t.kcal += e.kcal; t.p += e.p; t.c += e.c; t.f += e.f; }
  return t;
}

// Meal that fits the time of day
export function guessMeal() {
  const h = new Date().getHours();
  return h < 10 ? 'breakfast' : h < 14 ? 'lunch' : h < 18 ? 'dinner' : h < 21 ? 'supper' : 'snacks';
}

// ---------- Foods ----------
export const ownFoods = () => Object.values(F().items);
export const allFoods = () => ownFoods().concat(BASE_FOODS);
export const findFood = (id) => F().items[id] || BASE_FOODS.find((b) => b.id === id) || null;
export const findByBarcode = (code) => ownFoods().find((p) => p.barcode === code) || null;

export function searchFoods(q) {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return allFoods().filter((f) => f.name.toLowerCase().includes(s) || (f.no || '').toLowerCase().includes(s)
    || (f.barcode || '').includes(s)).slice(0, 40);
}

// Saves (or updates) an own food; a food with a known barcode replaces the earlier copy
export function saveFood(food) {
  let id = food.id && !food.base ? food.id : null;
  if (!id && food.barcode) id = findByBarcode(food.barcode)?.id || null;
  const item = { ...food, id: id || `f${uid()}`, base: undefined, updated: Date.now() };
  delete item.base;
  F().items[item.id] = item;
  save();
  return item;
}

export function deleteFood(id) {
  delete F().items[id];
  save();
}

// Foods logged before, newest first, with the amount used last time
export function recentFoods(limit = 12) {
  const seen = new Set();
  const out = [];
  for (const key of Object.keys(F().days).sort().reverse()) {
    for (const e of [...F().days[key].entries].reverse()) {
      const k = e.name.toLowerCase();
      if (seen.has(k) || !e.per) continue;
      seen.add(k);
      out.push({ id: e.foodId || `r${out.length}`, name: e.name, per: e.per, portion: e.portion || null, lastG: e.g });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

// ---------- Goals calculator (Mifflin–St Jeor) ----------
export function calcGoals({ sex, age, height, weight, act, goal }) {
  const bmr = 10 * weight + 6.25 * height - 5 * age + (sex === 'f' ? -161 : 5);
  const kcal = Math.round((bmr * act + goal) / 10) * 10;
  const p = Math.round(weight * (goal > 0 ? 2 : goal < 0 ? 2.2 : 1.8));
  const f = Math.round(kcal * 0.27 / 9);
  const c = Math.max(0, Math.round((kcal - p * 4 - f * 9) / 4));
  return { kcal, p, c, f };
}

// Latest body weight from Body measurements
export function latestWeight() {
  const w = [...state.body].filter((b) => b.weight).sort((a, b) => a.date.localeCompare(b.date));
  return w.length ? w[w.length - 1] : null;
}

// ---------- Open Food Facts (open database, ODbL; credited in the app) ----------
const OFF = 'https://world.openfoodfacts.org';
const OFF_FIELDS = 'code,product_name,product_name_en,product_name_nb,product_name_no,brands,nutriments,serving_quantity,serving_size';

function offToFood(p, code) {
  const n = p.nutriments || {};
  let kcal = n['energy-kcal_100g'];
  if (kcal == null && n.energy_100g != null) kcal = n.energy_100g / 4.184;
  if (kcal == null) return null;
  const brand = p.brands ? String(p.brands).split(',')[0].trim() : '';
  const name = [p.product_name_nb || p.product_name_no || p.product_name || p.product_name_en || '', brand].filter(Boolean).join(' – ')
    || `Product ${code}`;
  const sq = Number(p.serving_quantity);
  return {
    name,
    per: { kcal: Number(kcal) || 0, p: Number(n.proteins_100g) || 0, f: Number(n.fat_100g) || 0, c: Number(n.carbohydrates_100g) || 0 },
    portion: sq > 0 ? { label: p.serving_size ? String(p.serving_size).slice(0, 24) : '1 serving', g: sq } : null,
    barcode: code || p.code || null,
  };
}

async function getJson(url, ms) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

// { food } when found with nutrition, { name, noNutrition } when found without, {} when unknown. Throws when offline.
export async function offLookup(code) {
  const j = await getJson(`${OFF}/api/v2/product/${encodeURIComponent(code)}.json?fields=${OFF_FIELDS}`, 12000);
  if (j.status !== 1 || !j.product) return {};
  const food = offToFood(j.product, code);
  return food ? { food } : { noNutrition: true, name: j.product.product_name || '' };
}

export async function offSearch(q) {
  const j = await getJson(`${OFF}/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&json=1&page_size=25&fields=${OFF_FIELDS}`, 15000);
  return (j.products || []).map((p) => offToFood(p, p.code)).filter(Boolean);
}

// ---------- Barcodes ----------
export const canDecodeBarcodes = () => 'BarcodeDetector' in window;

// Reads an EAN/UPC barcode from a photo; null when none is found or the browser can't decode barcodes
export async function decodeBarcode(file) {
  if (!canDecodeBarcodes()) return null;
  try {
    const det = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
    const r = await det.detect(await createImageBitmap(file));
    return r?.[0]?.rawValue || null;
  } catch {
    return null;
  }
}

// ---------- Import from Makrologg ----------
const MEAL_FROM_NO = { frokost: 'breakfast', lunsj: 'lunch', middag: 'dinner', kvelds: 'supper', snacks: 'snacks' };

// Makrologg's backup: { app: 'makrologg', docs: { profile, foods, weights, 'day-YYYY-MM-DD': {...} } }
export function importMakrologg(text) {
  const j = JSON.parse(text);
  if (j?.app !== 'makrologg' || !j.docs) throw new Error('Not a Makrologg backup');
  const f = F();
  const docs = j.docs;
  let days = 0;
  let foods = 0;
  for (const p of Object.values(docs.foods?.items || {})) {
    if (!p?.name || !p.per) continue;
    const id = `mk-${p.id}`;
    if (!f.items[id]) foods++;
    f.items[id] = { id, name: p.name, per: p.per, portion: p.portion || (p.porG ? { label: p.porLabel || '1 portion', g: p.porG } : null),
      barcode: p.barcode || null, updated: p.updated || Date.now() };
  }
  for (const [k, d] of Object.entries(docs)) {
    const m = /^day-(\d{4}-\d{2}-\d{2})$/.exec(k);
    if (!m || !d) continue;
    const day = f.days[m[1]] || { entries: [], water: 0 };
    const have = new Set(day.entries.map((e) => e.id));
    for (const e of d.entries || []) {
      if (have.has(`mk-${e.id}`)) continue;
      day.entries.push({ id: `mk-${e.id}`, meal: MEAL_FROM_NO[e.meal] || 'snacks', name: e.name, g: e.g || 0, per: e.per || null,
        kcal: e.kcal || 0, p: e.p || 0, c: e.c || 0, f: e.f || 0, ...(e.foodId ? { foodId: `mk-${e.foodId}` } : {}), ...(e.est ? { est: true } : {}) });
    }
    day.water = Math.max(day.water || 0, d.water || 0);
    if (day.entries.length || day.water) { f.days[m[1]] = day; days++; }
  }
  const g = docs.profile?.goals;
  if (g && !f.goals) f.goals = { ...DEFAULT_GOALS, ...g };
  const body = docs.profile?.body;
  if (body && !Object.keys(f.calc).length) {
    f.calc = { sex: body.sex === 'k' ? 'f' : 'm', age: body.age, height: body.height, act: body.act, goal: body.goal };
  }
  let weights = 0;
  for (const [date, kg] of Object.entries(docs.weights?.items || {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !kg) continue;
    const cur = state.body.find((b) => b.date === date);
    if (cur) { if (!cur.weight) { cur.weight = kg; weights++; } } else { state.body.push({ date, weight: kg }); weights++; }
  }
  save();
  return { days, foods, weights };
}

