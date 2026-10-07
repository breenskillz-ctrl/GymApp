// Food page (DECISIONS #56): calories and macros per day, meals, water, goals, barcode scan and Open Food Facts search.
import { state, save } from '../store.js';
import { esc, icon, openModal, toast, dateKey, addDays, parseKey, MONTHS, num, confirmDialog, fmtNum } from '../utils.js';
import {
  F, MEALS, BASE_FOODS, goals, foodDay, saveFoodDay, scale, totals, guessMeal, searchFoods, saveFood, deleteFood,
  findByBarcode, recentFoods, calcGoals, latestWeight, offLookup, offSearch, decodeBarcode, canDecodeBarcodes,
} from '../food.js';

export const foodState = { date: dateKey() };
let rootEl = null;
const rerender = () => { if (rootEl && document.body.dataset.screen === 'food') renderFood(rootEl); };

const r0 = (n) => Math.round(n || 0);
const r1 = (n) => fmtNum(Math.round((n || 0) * 10) / 10, 1);
const mealName = (k) => MEALS.find(([m]) => m === k)?.[1] || k;

function dateLabel(key) {
  if (key === dateKey()) return 'Today';
  if (key === addDays(dateKey(), -1)) return 'Yesterday';
  const d = parseKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}${d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : ''}`;
}

export function shiftFoodDay(n) {
  foodState.date = addDays(foodState.date, n);
  rerender();
}

// ---------- Day view ----------
function ring(eaten, goal) {
  const C = 2 * Math.PI * 52;
  const frac = Math.min(1, eaten / (goal || 1));
  const over = eaten > goal;
  return `<svg class="food-ring" viewBox="0 0 120 120" aria-hidden="true">
    <circle cx="60" cy="60" r="52" class="track"/>
    <circle cx="60" cy="60" r="52" class="fill ${over ? 'over' : ''}" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - frac)}"
      transform="rotate(-90 60 60)"/></svg>`;
}

const macroBar = (label, val, goal, cls) => `<div class="macro ${cls}">
  <div class="macro-head"><span>${label}</span><span class="num"><b>${r0(val)}</b> / ${r0(goal)} g</span></div>
  <div class="macro-track"><i style="width:${Math.min(100, (val / (goal || 1)) * 100)}%"></i></div></div>`;

export function renderFood(root) {
  rootEl = root;
  const key = foodState.date;
  const g = goals();
  const day = foodDay(key);
  const t = totals(day);
  const left = g.kcal - t.kcal;
  const yday = foodDay(addDays(key, -1));
  const isToday = key === dateKey();

  root.innerHTML = `
    <header class="topbar">
      <button class="icon-btn" data-open-drawer aria-label="Menu">${icon('menu')}</button>
      <div class="day-nav">
        <button class="icon-btn sm" data-act="prev" aria-label="Previous day">${icon('left')}</button>
        <button class="day-label ${isToday ? 'today' : ''}" data-act="today">${esc(dateLabel(key))}</button>
        <button class="icon-btn sm" data-act="next" aria-label="Next day">${icon('right')}</button>
      </div>
      <button class="icon-btn" data-act="history" aria-label="Last 14 days">${icon('chart')}</button>
      <button class="icon-btn" data-act="goals" aria-label="Goals">${icon('target')}</button>
    </header>
    <section class="food-sum">
      <div class="food-dial">${ring(t.kcal, g.kcal)}
        <div class="food-dial-txt"><b class="num">${r0(Math.abs(left))}</b><span>${left < 0 ? 'kcal over' : 'kcal left'}</span></div></div>
      <div class="food-macros">
        ${macroBar('Protein', t.p, g.p, 'p')}${macroBar('Carbs', t.c, g.c, 'c')}${macroBar('Fat', t.f, g.f, 'f')}
        <div class="food-kline num"><span>Eaten <b>${r0(t.kcal)}</b></span><span>Goal <b>${r0(g.kcal)}</b> kcal</span></div>
      </div>
    </section>
    ${!F().goals ? `<button class="food-hint" data-act="goals">${icon('target')}<span>Set your own goals<small>Calories and macros from your height, weight and activity</small></span></button>` : ''}
    ${MEALS.map(([m, label]) => {
      const es = day.entries.filter((e) => e.meal === m);
      const kc = es.reduce((a, e) => a + e.kcal, 0);
      const canCopy = !es.length && yday.entries.some((e) => e.meal === m);
      return `<section class="meal">
        <div class="meal-head"><h3>${label}</h3><span class="num muted">${es.length ? `${r0(kc)} kcal` : ''}</span></div>
        ${es.map((e) => `<button class="meal-row" data-edit="${esc(e.id)}"><span class="grow"><span class="title">${esc(e.name)}${e.est ? ' <i class="est">estimate</i>' : ''}</span>
          <span class="sub num">${r0(e.g)} g · P ${r1(e.p)} · C ${r1(e.c)} · F ${r1(e.f)}</span></span><b class="num">${r0(e.kcal)}</b></button>`).join('')}
        <div class="meal-actions"><button class="text-btn accent" data-add="${m}">${icon('plus')} Add</button>
          ${canCopy ? `<button class="text-btn" data-copy="${m}">Copy yesterday</button>` : ''}</div>
      </section>`;
    }).join('')}
    <section class="water">
      <div class="grow"><b>Water</b><span class="muted num">${day.water || 0} of ${g.water} glasses (2.5 dl)</span>
        <div class="glasses">${Array.from({ length: Math.max(g.water, day.water || 0) }, (_, i) => `<i class="${i < (day.water || 0) ? 'full' : ''}"></i>`).join('')}</div></div>
      <button class="step-btn" data-water="-1" aria-label="One glass less">−</button>
      <button class="step-btn" data-water="1" aria-label="One glass more">+</button>
    </section>
    <div class="fab-wrap wide"><button class="add-bar" data-add="${guessMeal()}">${icon('plus')}Add food</button></div>`;

  root.onclick = async (e) => {
    const t2 = e.target;
    const add = t2.closest('[data-add]');
    if (add) return openAddSheet(add.dataset.add);
    const ed = t2.closest('[data-edit]');
    if (ed) {
      const en = foodDay(key).entries.find((x) => x.id === ed.dataset.edit);
      if (en) openAmountSheet({ id: en.foodId, name: en.name, per: en.per || perFrom(en), portion: en.portion }, en.meal, en);
      return;
    }
    const cp = t2.closest('[data-copy]');
    if (cp) {
      const d = structuredClone(foodDay(key));
      for (const x of foodDay(addDays(key, -1)).entries.filter((y) => y.meal === cp.dataset.copy)) d.entries.push({ ...x, id: newId() });
      saveFoodDay(key, d);
      toast('Copied from yesterday');
      return rerender();
    }
    const w = t2.closest('[data-water]');
    if (w) {
      const d = structuredClone(foodDay(key));
      d.water = Math.max(0, (d.water || 0) + Number(w.dataset.water));
      saveFoodDay(key, d);
      return rerender();
    }
    const a = t2.closest('[data-act]')?.dataset.act;
    if (a === 'prev') shiftFoodDay(-1);
    if (a === 'next') shiftFoodDay(1);
    if (a === 'today') { foodState.date = dateKey(); rerender(); }
    if (a === 'goals') openGoalsSheet();
    if (a === 'history') openHistorySheet();
  };
}

const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const perFrom = (e) => (e.g > 0 ? { kcal: e.kcal / e.g * 100, p: e.p / e.g * 100, c: e.c / e.g * 100, f: e.f / e.g * 100 } : { kcal: 0, p: 0, c: 0, f: 0 });
const foodLine = (f) => `${r0(f.per.kcal)} kcal · P ${r1(f.per.p)} · C ${r1(f.per.c)} · F ${r1(f.per.f)} per 100 g`;

// ---------- Add food ----------
function openAddSheet(meal) {
  let q = '';
  let off = null; // { q, busy, list, err }
  openModal(`<div class="modal-head"><h2>Add to ${esc(mealName(meal))}</h2><button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>
    <div class="food-tools">
      <button class="food-tool" data-act="scan">${icon('scan')}<span>Scan barcode</span></button>
      <button class="food-tool" data-act="new">${icon('edit')}<span>New food</span></button>
    </div>
    <input class="input search" type="search" placeholder="Search foods…" autocomplete="off">
    <div class="food-list scroll"></div>`, {
    className: 'tall',
    onMount(m, close) {
      const list = m.querySelector('.food-list');
      const row = (f, i, src) => `<button class="food-pick" data-src="${src}" data-i="${i}"><span class="grow"><span class="title">${esc(f.name)}${f.base ? '' : ' <i class="mine">mine</i>'}</span>
        <span class="sub num">${foodLine(f)}</span></span></button>`;
      let shown = [];
      const draw = () => {
        const s = q.trim();
        if (s) {
          shown = searchFoods(s);
          list.innerHTML = (shown.length ? shown.map((f, i) => row(f, i, 'local')).join('') : '<p class="empty">No match among your and the common foods.</p>')
            + (off?.q === s && off.busy ? '<p class="muted small food-busy">Searching Open Food Facts…</p>'
              : off?.q === s && off.list ? (off.list.length ? `<h3 class="section-title">Open Food Facts</h3>${off.list.map((f, i) => row(f, i, 'off')).join('')}`
                : '<p class="empty">Nothing found in Open Food Facts.</p>')
                : off?.q === s && off.err ? '<p class="empty">Could not reach Open Food Facts. Check the connection.</p>'
                  : `<button class="btn ghost block" data-act="off">Search “${esc(s)}” in Open Food Facts</button>`)
            + `<button class="btn ghost block" data-act="new">Add “${esc(s)}” yourself</button>`;
        } else {
          const rec = recentFoods();
          shown = rec.concat(BASE_FOODS);
          list.innerHTML = (rec.length ? `<h3 class="section-title">Recent</h3>${rec.map((f, i) => row(f, i, 'local')).join('')}` : '')
            + `<h3 class="section-title">Common foods</h3>${BASE_FOODS.map((f, i) => row(f, i + rec.length, 'local')).join('')}`
            + '<p class="credit">Product data: Open Food Facts (openfoodfacts.org), open database.</p>';
        }
      };
      draw();
      const input = m.querySelector('.search');
      input.addEventListener('input', () => { q = input.value; draw(); });
      m.addEventListener('click', async (e) => {
        const p = e.target.closest('.food-pick');
        if (p) {
          const f = p.dataset.src === 'off' ? saveFood(off.list[Number(p.dataset.i)]) : shown[Number(p.dataset.i)];
          close();
          return openAmountSheet(f, meal);
        }
        const a = e.target.closest('[data-act]')?.dataset.act;
        if (a === 'off') {
          const s = q.trim();
          off = { q: s, busy: true };
          draw();
          try { off = { q: s, list: await offSearch(s) }; } catch { off = { q: s, err: true }; }
          if (document.body.contains(list)) draw();
        }
        if (a === 'new') { close(); openFoodForm({ name: q.trim() }, meal); }
        if (a === 'scan') { close(); openScanSheet(meal); }
      });
    },
  });
}

// ---------- Amount ----------
function openAmountSheet(food, meal, entry = null) {
  const portions = [];
  if (food.portion) portions.push(food.portion);
  portions.push({ label: '100 g', g: 100 });
  if (food.lastG && !portions.some((p) => p.g === food.lastG)) portions.unshift({ label: `Last: ${r0(food.lastG)} g`, g: food.lastG });
  let g = entry?.g ?? food.lastG ?? food.portion?.g ?? 100;
  let m = entry?.meal || meal;
  openModal(`<div class="modal-head"><h2>${esc(food.name)}</h2><button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>
    <p class="muted small num">${foodLine(food)}</p>
    <div class="chip-row">${portions.map((p) => `<button class="fchip" data-g="${p.g}">${esc(p.label)}${/ g$/.test(p.label) ? '' : ` · ${r0(p.g)} g`}</button>`).join('')}</div>
    <div class="se-row"><label for="amt-g">Grams</label><div class="se-stepper">
      <button type="button" class="step-btn" data-step="-10" aria-label="10 g less">−</button>
      <input id="amt-g" inputmode="decimal" value="${r0(g)}">
      <button type="button" class="step-btn" data-step="10" aria-label="10 g more">+</button></div></div>
    <div class="chip-row meals">${MEALS.map(([k, l]) => `<button class="fchip ${k === m ? 'on' : ''}" data-meal="${k}">${l}</button>`).join('')}</div>
    <div class="amt-prev num"></div>
    <button class="btn primary block" data-act="save">${entry ? 'Save' : 'Add'}</button>
    ${entry ? '<button class="text-btn danger block-center" data-act="del">Remove from the day</button>' : ''}`, {
    className: 'dialog food-amount',
    onMount(md, close) {
      const inp = md.querySelector('#amt-g');
      const prev = () => {
        const v = scale(food.per, num(inp.value) || 0);
        md.querySelector('.amt-prev').innerHTML = `<div><b>${r0(v.kcal)}</b><span>kcal</span></div><div class="p"><b>${r1(v.p)}</b><span>protein</span></div>
          <div class="c"><b>${r1(v.c)}</b><span>carbs</span></div><div class="f"><b>${r1(v.f)}</b><span>fat</span></div>`;
      };
      prev();
      setTimeout(() => { inp.focus(); inp.select(); }, 60);
      inp.addEventListener('input', prev);
      md.addEventListener('click', async (e) => {
        const c = e.target.closest('[data-g]');
        if (c) { inp.value = c.dataset.g; prev(); return; }
        const s = e.target.closest('[data-step]');
        if (s) { inp.value = Math.max(0, (num(inp.value) || 0) + Number(s.dataset.step)); prev(); return; }
        const mm = e.target.closest('[data-meal]');
        if (mm) { m = mm.dataset.meal; md.querySelectorAll('[data-meal]').forEach((b) => b.classList.toggle('on', b === mm)); return; }
        const a = e.target.closest('[data-act]')?.dataset.act;
        const key = foodState.date;
        const d = structuredClone(foodDay(key));
        if (a === 'save') {
          g = num(inp.value) || 0;
          if (g <= 0) { toast('Enter an amount in grams'); return; }
          const v = scale(food.per, g);
          const item = { id: entry?.id || newId(), meal: m, name: food.name, g, per: food.per, kcal: v.kcal, p: v.p, c: v.c, f: v.f,
            ...(food.id && !String(food.id).startsWith('r') ? { foodId: food.id } : {}), ...(food.portion ? { portion: food.portion } : {}) };
          const i = d.entries.findIndex((x) => x.id === item.id);
          if (i >= 0) d.entries[i] = item; else d.entries.push(item);
          saveFoodDay(key, d);
          close();
          toast(entry ? 'Saved' : `Added to ${mealName(m)}`);
          rerender();
        }
        if (a === 'del') {
          d.entries = d.entries.filter((x) => x.id !== entry.id);
          saveFoodDay(key, d);
          close();
          rerender();
        }
      });
    },
  });
}

// ---------- Own food ----------
function openFoodForm(p = {}, meal = null, note = '') {
  const own = p.id && F().items[p.id];
  openModal(`<div class="modal-head"><h2>${own ? 'Edit food' : 'New food'}</h2><button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>
    ${note ? `<p class="muted small">${esc(note)}</p>` : ''}
    <form class="form">
      <label>Name<input class="input" name="name" value="${esc(p.name || '')}" placeholder="e.g. Skyr vanilla"></label>
      <label>Per 100 g: kcal · protein · carbs · fat</label>
      <div class="grid4">
        <input class="input" name="kcal" inputmode="decimal" placeholder="kcal" aria-label="kcal per 100 g" value="${p.per?.kcal ?? ''}">
        <input class="input" name="p" inputmode="decimal" placeholder="P" aria-label="Protein per 100 g" value="${p.per?.p ?? ''}">
        <input class="input" name="c" inputmode="decimal" placeholder="C" aria-label="Carbs per 100 g" value="${p.per?.c ?? ''}">
        <input class="input" name="f" inputmode="decimal" placeholder="F" aria-label="Fat per 100 g" value="${p.per?.f ?? ''}"></div>
      <div class="grid2">
        <label>Portion<input class="input" name="pl" value="${esc(p.portion?.label || '')}" placeholder="1 cup"></label>
        <label>Portion (g)<input class="input" name="pg" inputmode="decimal" value="${p.portion?.g ?? ''}" placeholder="170"></label></div>
      <label>Barcode<input class="input" name="bc" inputmode="numeric" value="${esc(p.barcode || '')}" placeholder="Optional"></label>
      <button class="btn primary block" type="submit">${meal ? 'Save and choose amount' : 'Save'}</button>
      ${own ? '<button class="text-btn danger" type="button" data-act="del">Delete food</button>' : ''}
    </form>`, {
    className: 'tall',
    onMount(m, close) {
      const form = m.querySelector('form');
      form.onsubmit = (e) => {
        e.preventDefault();
        const name = form.name.value.trim();
        if (!name) { toast('Give the food a name'); return; }
        const per = { kcal: num(form.kcal.value) || 0, p: num(form.p.value) || 0, c: num(form.c.value) || 0, f: num(form.f.value) || 0 };
        const pg = num(form.pg.value);
        const food = saveFood({ id: own ? p.id : undefined, name, per, portion: pg > 0 ? { label: form.pl.value.trim() || '1 portion', g: pg } : null,
          barcode: form.bc.value.replace(/\D/g, '') || null });
        close();
        if (meal) openAmountSheet(food, meal); else toast('Saved');
      };
      m.querySelector('[data-act="del"]')?.addEventListener('click', async () => {
        if (!await confirmDialog(`Delete “${p.name}” from your foods? Logged days keep their values.`)) return;
        deleteFood(p.id);
        close();
      });
    },
  });
}

// ---------- Barcode ----------
function openScanSheet(meal) {
  openModal(`<div class="modal-head"><h2>Scan barcode</h2><button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>
    ${canDecodeBarcodes() ? `<label class="btn primary block file-btn">${icon('camera')} Take a photo of the barcode
      <input type="file" accept="image/*" capture="environment" hidden data-photo></label>`
      : '<p class="muted small">This browser cannot read barcodes from the camera. Type the numbers under the barcode instead.</p>'}
    <form class="form scan-form"><label>Numbers under the barcode<div class="row gap">
      <input class="input" name="code" inputmode="numeric" placeholder="7038010…" style="flex:1;min-width:0"><button class="btn ghost" type="submit">Look up</button></div></label></form>
    <p class="scan-msg muted small"></p>
    <p class="credit">Product data: Open Food Facts (openfoodfacts.org). Products you have scanned before also work offline.</p>`, {
    className: 'dialog',
    onMount(m, close) {
      const msg = (t) => { m.querySelector('.scan-msg').textContent = t; };
      const lookup = async (raw) => {
        const code = String(raw || '').replace(/\D/g, '');
        if (!code) { msg('Type the numbers under the barcode.'); return; }
        const known = findByBarcode(code);
        if (known) { close(); openAmountSheet(known, meal); toast(`Found ${known.name}`); return; }
        msg(`Looking up ${code} in Open Food Facts…`);
        try {
          const r = await offLookup(code);
          if (r.food) { const f = saveFood(r.food); close(); openAmountSheet(f, meal); toast(`Found ${f.name}`); return; }
          close();
          openFoodForm({ name: r.name || '', barcode: code }, meal,
            `${r.noNutrition ? 'The product is in Open Food Facts but has no nutrition values.' : 'The product was not found in Open Food Facts.'} Type the values from the label (per 100 g); Loadlog remembers it next time.`);
        } catch {
          msg('Could not reach Open Food Facts. Check the connection, or add the food yourself.');
        }
      };
      m.querySelector('[data-photo]')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        msg('Reading the barcode…');
        const code = await decodeBarcode(file);
        if (!code) { msg('No barcode found in the photo. Try closer and sharper, or type the numbers.'); return; }
        m.querySelector('[name=code]').value = code;
        lookup(code);
      });
      m.querySelector('.scan-form').onsubmit = (e) => { e.preventDefault(); lookup(e.target.code.value); };
    },
  });
}

// ---------- Goals ----------
const ACTIVITY = [['1.2', 'Mostly sitting'], ['1.375', 'Lightly active (1–3 sessions/week)'], ['1.55', 'Active (3–5 sessions/week)'],
  ['1.725', 'Very active (6–7 sessions/week)'], ['1.9', 'Hard physical work + training']];
const AIMS = [['-500', 'Lose weight (about 0.5 kg/week)'], ['-250', 'Lose slowly'], ['0', 'Keep my weight'], ['250', 'Build muscle (slow gain)']];

function openGoalsSheet() {
  const g = goals();
  const c = F().calc;
  const w = latestWeight();
  let sex = c.sex || 'm';
  openModal(`<div class="modal-head"><h2>Food goals</h2><button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>
    <div class="scroll"><form class="form goals-form">
      <div class="grid2">
        <label>Calories (kcal)<input class="input" name="kcal" inputmode="numeric" value="${r0(g.kcal)}"></label>
        <label>Protein (g)<input class="input" name="p" inputmode="numeric" value="${r0(g.p)}"></label>
        <label>Carbs (g)<input class="input" name="c" inputmode="numeric" value="${r0(g.c)}"></label>
        <label>Fat (g)<input class="input" name="f" inputmode="numeric" value="${r0(g.f)}"></label>
        <label>Water (glasses)<input class="input" name="water" inputmode="numeric" value="${r0(g.water)}"></label>
      </div>
      <p class="muted small goals-sum"></p>
      <button class="btn primary block" type="submit">Save goals</button>
    </form>
    <h3 class="section-title">Work out my goals</h3>
    <div class="form calc-form">
      <div class="seg"><button type="button" data-sex="m" class="${sex === 'm' ? 'active' : ''}">Man</button><button type="button" data-sex="f" class="${sex === 'f' ? 'active' : ''}">Woman</button></div>
      <div class="grid2">
        <label>Age<input class="input" name="age" inputmode="numeric" value="${c.age || ''}" placeholder="30"></label>
        <label>Height (cm)<input class="input" name="height" inputmode="numeric" value="${c.height || ''}" placeholder="180"></label>
        <label>Weight (kg)<input class="input" name="weight" inputmode="decimal" value="${w?.weight || ''}" placeholder="80"></label>
      </div>
      <label>Activity<select class="input" name="act">${ACTIVITY.map(([v, l]) => `<option value="${v}" ${String(c.act || '1.55') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label>Aim<select class="input" name="goal">${AIMS.map(([v, l]) => `<option value="${v}" ${String(c.goal ?? '0') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <button class="btn ghost block" type="button" data-act="calc">Calculate and fill in</button>
      <p class="muted small">Uses the Mifflin–St Jeor formula. Protein about 1.8–2.2 g per kg, fat 25–30 % of the calories, the rest carbs.${w ? ` Weight from Body measurements (${esc(w.date)}).` : ''}</p>
    </div></div>`, {
    className: 'tall',
    onMount(m, close) {
      const gf = m.querySelector('.goals-form');
      const cf = m.querySelector('.calc-form');
      const sum = () => {
        const k = 4 * (num(gf.p.value) || 0) + 4 * (num(gf.c.value) || 0) + 9 * (num(gf.f.value) || 0);
        m.querySelector('.goals-sum').textContent = `The macros add up to ${r0(k)} kcal.`;
      };
      sum();
      gf.addEventListener('input', sum);
      gf.onsubmit = (e) => {
        e.preventDefault();
        F().goals = { kcal: num(gf.kcal.value) || 0, p: num(gf.p.value) || 0, c: num(gf.c.value) || 0, f: num(gf.f.value) || 0, water: num(gf.water.value) || 8 };
        save();
        close();
        toast('Goals saved');
        rerender();
      };
      m.addEventListener('click', (e) => {
        const s = e.target.closest('[data-sex]');
        if (s) { sex = s.dataset.sex; m.querySelectorAll('[data-sex]').forEach((b) => b.classList.toggle('active', b === s)); return; }
        if (!e.target.closest('[data-act="calc"]')) return;
        const v = { sex, age: num(cf.querySelector('[name=age]').value), height: num(cf.querySelector('[name=height]').value),
          weight: num(cf.querySelector('[name=weight]').value), act: Number(cf.querySelector('[name=act]').value), goal: Number(cf.querySelector('[name=goal]').value) };
        if (!v.age || !v.height || !v.weight) { toast('Fill in age, height and weight'); return; }
        const r = calcGoals(v);
        gf.kcal.value = r.kcal; gf.p.value = r.p; gf.c.value = r.c; gf.f.value = r.f;
        F().calc = { sex, age: v.age, height: v.height, act: v.act, goal: v.goal };
        save();
        sum();
        toast('Filled in. Save to keep them.');
      });
    },
  });
}

// ---------- Last 14 days ----------
function openHistorySheet() {
  const g = goals();
  const today = dateKey();
  const days = Array.from({ length: 14 }, (_, i) => { const k = addDays(today, i - 13); return { k, t: totals(foodDay(k)) }; });
  const logged = days.filter((d) => d.t.kcal > 0);
  const avg = (k) => (logged.length ? logged.reduce((a, d) => a + d.t[k], 0) / logged.length : 0);
  const W = 340; const H = 170; const pl = 34; const pb = 22; const pt = 10;
  const max = Math.max(g.kcal * 1.25, ...days.map((d) => d.t.kcal));
  const bw = (W - pl - 6) / 14;
  const y = (v) => pt + (H - pt - pb) * (1 - v / max);
  const bars = days.map((d, i) => {
    const x = pl + i * bw + 3;
    const day = parseKey(d.k).getDate();
    return (d.t.kcal > 0 ? `<rect x="${x}" y="${y(d.t.kcal)}" width="${bw - 6}" height="${y(0) - y(d.t.kcal)}" rx="3" class="${d.t.kcal > g.kcal * 1.05 ? 'over' : 'ok'}"/>` : '')
      + (i % 2 === 1 ? `<text x="${x + (bw - 6) / 2}" y="${H - 6}" text-anchor="middle">${day}</text>` : '');
  }).join('');
  openModal(`<div class="modal-head"><h2>Last 14 days</h2><button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>
    <svg class="food-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Calories per day">
      <line x1="${pl}" x2="${W - 4}" y1="${y(g.kcal)}" y2="${y(g.kcal)}" class="goal"/>
      <text x="${pl - 4}" y="${y(g.kcal) + 3}" text-anchor="end">${r0(g.kcal)}</text>${bars}</svg>
    <div class="food-avg num">
      <div><b>${r0(avg('kcal'))}</b><span>kcal / day</span></div><div class="p"><b>${r0(avg('p'))}</b><span>protein g</span></div>
      <div class="c"><b>${r0(avg('c'))}</b><span>carbs g</span></div><div class="f"><b>${r0(avg('f'))}</b><span>fat g</span></div></div>
    <p class="muted small">Averages over the ${logged.length} day${logged.length === 1 ? '' : 's'} with food logged.</p>`, { className: 'dialog' });
}

// One-line food summary for a History card, or ''
export function foodSummaryLine(key) {
  const t = totals(state.food?.days?.[key]);
  return t.kcal > 0 ? `${r0(t.kcal)} kcal · ${r0(t.p)} g protein` : '';
}
