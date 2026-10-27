/* ===================== Huerta: mochila, tesoros y huerto =====================
   Lo que se junta y no es comida de la despensa ni un mueble: va en la
   mochila (state.bag, bagAdd()/bagCount() en app.js), con su catálogo
   (BAG_ITEMS):
   - la huerta: el fertilizante de la compostera (objetos.js) y las
     semillas (salen de los regalos y de cavar);
   - la cosecha del huerto: se come o se vende;
   - los tesoros que salen al cavar con la pala: piedras preciosas, un
     hueso, un amuleto... y, muy de vez en cuando, un fósil de Mimogoshi
     (algún día una máquina lo va a revivir; por ahora se guarda).
   Todo se guarda aunque no se tenga la Mochila; comprarla (la cosa más
   barata de la tienda, en Esenciales) da la pestañita para verla, comer y
   vender.

   El huerto es un objeto más (como los de objetos.js): parcelas donde se
   plantan semillas que crecen con la hora real, se fertilizan y se
   cosechan. Empieza con dos y se amplía hasta cuatro.

   Se carga después de objetos.js (usa sus ayudantes: startChore, besideX,
   las capas de partículas) y antes de duo.js. Los push a STYLE_ITEMS y
   FURNI_ART van al cargar, como los de objetos.js. */

STYLE_ITEMS.push(
  { id:'mochila', kind:'tool', group:'esencial', name:'Mochila', emoji:'🎒', price: 10, use:'guarda lo que juntas',
    boughtNote: 'Ábrela con la mochila del borde izquierdo de la pantalla.' },
  { id:'huerto', kind:'furni', wow: true, group:'huerta', name:'Huerto', use:'siembra y cosecha', price: 80 },
);

/* ---------- catálogo ---------- */

/* Lo que se planta. growH: horas reales hasta cosechar; yield: cuánto da;
   food: lo que llena al comerlo (puntos de panza, como FOODS). */
const CROPS = {
  zanahoria: { name: 'Zanahoria', emoji: '🥕', growH: 3,  yield: 2, sell: 2, food: { restore: 12, energy: 3 } },
  tomate:    { name: 'Tomate',    emoji: '🍅', growH: 5,  yield: 3, sell: 2, food: { restore: 10, energy: 2 } },
  frutilla:  { name: 'Frutilla',  emoji: '🍓', growH: 8,  yield: 4, sell: 3, food: { restore: 8, energy: 2, happy: 3 } },
  zapallo:   { name: 'Zapallo',   emoji: '🎃', growH: 12, yield: 1, sell: 8, food: { restore: 45, energy: 6 } },
  girasol:   { name: 'Girasol',   emoji: '🌻', growH: 6,  yield: 1, sell: 4, seeds: 2, happy: 10 },
};
const CROP_IDS = Object.keys(CROPS);

const BAG_RARITY = {
  comun:  { name: 'Común',      color: '#9fb4c8' },
  raro:   { name: 'Raro',       color: '#4fa3ff' },
  epico:  { name: 'Épico',      color: '#b45cff' },
  unico:  { name: 'Legendario', color: '#ffb52e' },
};
const BAG_GROUPS = [
  { id: 'huerta',  title: 'Huerta' },
  { id: 'cosecha', title: 'Cosecha' },
  { id: 'tesoro',  title: 'Tesoros' },
];
const BAG_ITEMS = [
  { id: 'fertilizante', group: 'huerta', name: 'Fertilizante', emoji: '🌿',
    desc: 'Sale de la compostera. Hace crecer al árbol frutal, al frijol mágico y al huerto (tócalos).' },
  ...CROP_IDS.map(id => ({ id: 'semilla_' + id, group: 'huerta', seed: id, name: `Semillas de ${CROPS[id].name.toLowerCase()}`,
    emoji: CROPS[id].emoji, desc: `Se plantan en el huerto. ${CROPS[id].name}: lista en ${CROPS[id].growH} h, da ${CROPS[id].yield}.` })),
  ...CROP_IDS.map(id => ({ id, group: 'cosecha', crop: id, name: CROPS[id].name, emoji: CROPS[id].emoji, sell: CROPS[id].sell,
    desc: CROPS[id].food ? `Del huerto. Llena ${CROPS[id].food.restore} de panza${CROPS[id].food.happy ? ` y da +${CROPS[id].food.happy} de felicidad` : ''}.`
      : `Del huerto. Regálaselo: +${CROPS[id].happy} de felicidad.` })),
  { id: 'caracola', group: 'tesoro', rar: 'comun', name: 'Caracola',        emoji: '🐚', sell: 3,   desc: 'Una caracola enterrada. ¿Qué hacía acá?' },
  { id: 'hueso',    group: 'tesoro', rar: 'comun', name: 'Hueso',           emoji: '🦴', sell: 2,   desc: 'Un hueso viejo. No es de nadie conocido… creo.' },
  { id: 'amuleto',  group: 'tesoro', rar: 'raro',  name: 'Amuleto antiguo', emoji: '🧿', sell: 15,  desc: 'Alguien lo enterró hace mucho para la buena suerte.' },
  { id: 'topacio',  group: 'tesoro', rar: 'raro',  name: 'Topacio',         emoji: '🔶', sell: 25,  desc: 'Una piedra preciosa dorada.' },
  { id: 'zafiro',   group: 'tesoro', rar: 'raro',  name: 'Zafiro',          emoji: '🔷', sell: 30,  desc: 'Una piedra preciosa azul.' },
  { id: 'rubi',     group: 'tesoro', rar: 'epico', name: 'Rubí',            emoji: '♦️', sell: 50,  desc: 'Una piedra preciosa roja, de las difíciles.' },
  { id: 'diamante', group: 'tesoro', rar: 'epico', name: 'Diamante',        emoji: '💎', sell: 120, desc: 'Brilla aunque no haya luz.' },
  { id: 'fosil',    group: 'tesoro', rar: 'unico', name: 'Fósil misterioso', emoji: '🦕', sell: 0,
    desc: 'Un Mimogoshi de hace millones de años, de una especie que ya no existe. Guárdalo: algún día una máquina va a poder revivirlo.' },
];
function bagItem(id){ return BAG_ITEMS.find(it => it.id === id); }
function hasBackpack(){ return !!(state && state.style && state.style.owned.mochila); }
function randomSeedId(){ return 'semilla_' + pickOne(CROP_IDS); }

/* Sumar a la mochila y avisar en su pestañita. */
function bagGain(id, n = 1){
  bagAdd(id, n);
  const b = document.getElementById('btnBag');
  if (b && hasBackpack()){ b.classList.remove('blink'); void b.offsetWidth; b.classList.add('blink'); }
}
const bagNote = () => hasBackpack() ? 'Quedó en la mochila 🎒'
  : 'Se guarda igual: con la Mochila (Tienda → Objetos → Esenciales) puedes verlo, comerlo o venderlo.';

/* ---------- la hoja de la mochila ---------- */

function openBag(sel, aviso){
  const tile = it => {
    const n = bagCount(it.id), rar = it.rar && BAG_RARITY[it.rar];
    return `<button class="bag-tile ${sel === it.id ? 'on' : ''} ${it.seed ? 'seed' : ''}" data-bag="${it.id}"${rar ? ` style="--rar:${rar.color}"` : ''}>
        <span class="bag-emoji">${it.emoji}</span><b>${escapeHtml(it.name)}</b><span class="bag-n">×${n}</span></button>`;
  };
  const grupos = BAG_GROUPS.map(g => {
    const items = BAG_ITEMS.filter(it => it.group === g.id && bagCount(it.id) > 0);
    return items.length ? `<div class="section-label">${g.title}</div><div class="bag-grid">${items.map(tile).join('')}</div>` : '';
  }).join('');
  const balde = state.style.owned.pala && typeof palaData === 'function'
    ? `<div class="bag-chip">💩 En el balde de la pala: <b>${palaData().caca} de ${PALA_MAX}</b></div>` : '';
  const it = sel && bagCount(sel) > 0 ? bagItem(sel) : null;
  let detail = '';
  if (it){
    const n = bagCount(it.id), rar = it.rar && BAG_RARITY[it.rar];
    const acts = [];
    const c = it.crop && CROPS[it.crop];
    if (c && c.food) acts.push(`<button class="overlay-btn" data-bag-act="eat">Dárselo de comer</button>`);
    if (c && c.happy) acts.push(`<button class="overlay-btn" data-bag-act="gift">Regalárselo</button>`);
    if (it.seed) acts.push(`<button class="overlay-btn" data-bag-act="plant">Plantar en el huerto</button>`);
    if (it.sell){
      acts.push(`<button class="overlay-btn secondary" data-bag-act="sell1">Vender 1 · ${coinsLabel(it.sell)}</button>`);
      if (n > 1) acts.push(`<button class="overlay-btn secondary" data-bag-act="sellall">Vender ${n} · ${coinsLabel(it.sell * n)}</button>`);
    }
    detail = `<div class="bag-detail"${rar ? ` style="--rar:${rar.color}"` : ''}>
        <span class="bag-big">${it.emoji}</span>
        <div><b>${escapeHtml(it.name)}</b> <small>×${n}${rar ? ` · <span class="bag-rar">${rar.name}</span>` : ''}</small>
        <p>${escapeHtml(it.desc)}</p></div>
        ${acts.length ? `<div class="bag-acts">${acts.join('')}</div>` : ''}
      </div>`;
  }
  showOverlay(`
    <h3>🎒 Mochila</h3>
    <p class="${aviso ? 'sheet-note' : ''}">${aviso ? escapeHtml(aviso) : (grupos ? 'Toca algo para ver qué es y qué se puede hacer.' : '')}</p>
    ${balde}
    <div class="menu-list bag-list">${detail}${grupos || '<p class="style-empty">Todavía está vacía. Cava con la pala, abre regalos, saca fertilizante de la compostera o cosecha el huerto.</p>'}</div>
    <button class="overlay-btn secondary" id="btnCloseBag">Cerrar</button>
  `, hideOverlay);
  document.getElementById('overlayCard').classList.add('sheet-tall');
  const card = document.getElementById('overlayCard');
  card.onclick = e => {
    const t = e.target.closest('[data-bag]');
    if (t){ openBag(t.dataset.bag === sel ? null : t.dataset.bag); return; }
    const a = e.target.closest('[data-bag-act]');
    if (a && it) bagAction(it, a.dataset.bagAct);
  };
  document.getElementById('btnCloseBag').addEventListener('click', hideOverlay);
}

function bagAction(it, act){
  const c = it.crop && CROPS[it.crop];
  if (act === 'sell1' || act === 'sellall'){
    const n = act === 'sell1' ? 1 : bagCount(it.id);
    bagAdd(it.id, -n);
    state.coins += it.sell * n;
    saveState(); render();
    openBag(bagCount(it.id) ? it.id : null, `Vendiste ${n} · +${it.sell * n} monedas`);
    return;
  }
  if (act === 'eat'){
    hideOverlay();
    bagEat(it.id);
    return;
  }
  if (act === 'gift'){
    if (!tryWake()) return;
    catchUp();
    bagAdd(it.id, -1);
    state.happiness = clamp(state.happiness + c.happy);
    hideOverlay();
    floatFx(c.emoji);
    say('¡Para mí! 🥰');
    triggerPetAction('celebrate');
    saveState(); render();
    return;
  }
  if (act === 'plant'){
    const rt = magicRt('huerto');
    if (rt){ openHuerto(rt); return; }
    openBag(it.id, state.style.owned.huerto ? 'Trae el huerto a esta habitación (Personalizar) para plantar'
      : 'Primero el huerto: Tienda → Objetos → Huerta');
  }
}

/* Comer algo de la cosecha: igual que una porción de la bandeja (cae al
   montón, las barras suben mientras se la come), pero de la mochila. */
function bagEat(id){
  const it = bagItem(id), c = CROPS[it.crop];
  if (bagCount(id) <= 0) return;
  if (state.stage === 'egg'){ say('Todavía es un huevo…'); return; }
  if (foodPile && foodPile.pieces.length >= FOOD_PILE_MAX){ say('¡Espera que se coma lo que tiene!'); return; }
  if (!tryWake()) return;
  catchUp();
  bagAdd(id, -1);
  const food = { id, name: c.name, emoji: c.emoji, restore: c.food.restore, energy: c.food.energy };
  const piece = { food, hunger: hungerFillPct(food), energy: food.energy, t: 0, done: 0 };
  const m = state.meal || (state.meal = { hunger: 0, energy: 0 });
  m.hunger += piece.hunger; m.energy += piece.energy;
  if (c.food.happy) state.happiness = clamp(state.happiness + c.food.happy);
  say('¡Del huerto! 😋');
  serveFood(piece);
  medalAdd('comidas');   // logros.js
  saveState(); render();
}

/* ---------- cavar con la pala ----------
   Cavar encuentra algo una vez cada DIG_GAP_MS (tiempo real): la tierra
   "descansa". Mandada (tocar la pala sin caca) o sola (la visita de jugar a
   cavar, objetos.js). Lo que sale, por peso: */
const DIG_GAP_MS = 40 * 60 * 1000;
const DIG_LOOT = [
  { id: null, w: 22 },                      // solo tierra
  { id: 'caracola', w: 18 }, { id: 'hueso', w: 15 }, { id: 'semilla', w: 20 },
  { id: 'amuleto', w: 8 }, { id: 'topacio', w: 6 }, { id: 'zafiro', w: 5 },
  { id: 'rubi', w: 3 }, { id: 'diamante', w: 1.2 }, { id: 'fosil', w: 0.5 },
];

function digFind(act, player){
  const d = palaData(), now = Date.now(), last = d.lastDig || 0;
  const wait = last + DIG_GAP_MS - now;
  if (wait > 0 && now >= last){
    if (player) say(`Solo tierra 🕳️ La tierra descansa: vuelve a cavar en ${magicDur(wait)}`, 2800);
    else petFx('🕳️', act);
    return null;
  }
  d.lastDig = now;
  let r = Math.random() * DIG_LOOT.reduce((s, x) => s + x.w, 0), pick = DIG_LOOT[0];
  for (const x of DIG_LOOT){ if ((r -= x.w) < 0){ pick = x; break; } }
  if (!pick.id){
    saveState();
    if (player) say('Solo tierra esta vez 🕳️', 2200); else petFx('🕳️', act);
    return null;
  }
  const id = pick.id === 'semilla' ? randomSeedId() : pick.id;
  const it = bagItem(id);
  bagGain(id, 1);
  petFx(it.emoji, act);
  const k = furniK();
  fxBurst(act.x * floorWidth() + act.dir * actorCssH(act) * 0.4, 4, 10, { colors: ['#ffffff', MP.goldL, MP.gold], shape: 'plus', speed: 55, life: 650, ay: 0 });
  if (!player) logEvent(it.emoji, `Cavando encontró: ${it.name.toLowerCase()}`);
  if (player || id === 'fosil'){
    if ((it.rar === 'epico' || it.rar === 'unico') && typeof rewardSound === 'function') rewardSound();
    showPopup({ icon: it.emoji, title: id === 'fosil' ? '¡Un fósil misterioso!' : '¡Encontró algo!',
      items: [{ icon: it.emoji, text: it.name, amount: '+1' }],
      note: id === 'fosil' ? `${it.desc} ${bagNote()}` : bagNote() });
  }
  saveState();
  return id;
}

/* Tocar la pala sin caca: la toma, va a cavar a otro lado y vuelve. */
function palaDig(rt){
  const k = furniK(), at = () => rt.x;
  let spot = 0.5;
  return startChore(rt, [
    { go: besideX(at, 5 * k) }, faceX(at),
    { anim: 'pet', ms: 380, end: (r, act) => { rt.carry = { what: 'shovel', act, tilt: 0 }; spot = clampX(rt.x + (rt.x < 0.5 ? 0.28 : -0.28)); } },
    { go: () => spot },
    { anim: 'clean', ms: 2400, fx: ['🕳️'], track: (r, el, act) => {
      rt.carry.tilt = 0.45 * Math.abs(Math.sin(el / 260));
      if (Math.random() < 0.3){ const t = shovelTip(rt); fxSpawn({ x: t.x, y: 2, vx: -act.dir * rnd(10, 40), vy: rnd(30, 60), ay: -160, life: 600, shape: 'dust', colors: [FP.sandD, FP.brown, FP.brownL], layer: 'front', floor: 'die' }); }
      return null;
    }, end: (r, act) => { if (rt.carry) rt.carry.tilt = 0; digFind(act, true); } },
    { anim: 'happy', ms: 800 },
    { go: besideX(at, 5 * k) }, faceX(at),
    { anim: 'pet', ms: 380, end: () => { rt.carry = null; } },
  ]);
}

/* ---------- el huerto ---------- */

const HUERTO_START = 2;
const HUERTO_MAX = 4;
const HUERTO_PLOT_PRICE = [0, 0, 60, 90];   // lo que cuesta abrir la parcela 3 y la 4

function huertoData(){
  const d = objData('huerto');
  if (!Array.isArray(d.plots)) d.plots = [];
  if (!Number.isInteger(d.n) || d.n < HUERTO_START) d.n = HUERTO_START;
  d.n = Math.min(HUERTO_MAX, d.n);
  while (d.plots.length < HUERTO_MAX) d.plots.push({ crop: null });
  for (const p of d.plots) if (p.crop && !CROPS[p.crop]) p.crop = null;
  return d;
}
/* El fertilizante la deja crecer al doble de rápido (una vez por siembra). */
const plotGrowMs = p => CROPS[p.crop].growH * 3600000 * (p.fert ? 0.5 : 1);
function plotStage(p){
  if (!p.crop) return -1;
  const t = (Date.now() - p.at) / plotGrowMs(p);
  return t >= 1 ? 3 : t >= 0.6 ? 2 : t >= 0.25 ? 1 : 0;
}
const plotLeftMs = p => Math.max(0, p.at + plotGrowMs(p) - Date.now());

const HUERTO_W = 34;
const plotArtX = i => 2 + 8 * i;   // x del arte donde empieza la parcela i (mide 6)
function plotX(rt, i){ return clampX(rt.x + (plotArtX(i) + 3 - HUERTO_W / 2) * furniK() / floorWidth()); }

/* La mascota va a la parcela y hace algo; `apply` corre al terminar (o al
   cortarse: no se pierde). Dormida o de huevo, pasa al tiro. */
function huertoChore(rt, i, kind, apply){
  const at = () => plotX(rt, i);
  let done = false;
  const run = () => { if (!done){ done = true; apply(); } };
  if (state.sleeping || displayStage() === 'egg' || (walker.activity && (walker.activity.kind === 'eat' || walker.activity.kind === 'vaccine'))){ run(); return; }
  rt.pending = run;
  const fx = kind === 'harvest' ? { anim: 'pet', ms: 1000, fx: ['✨'] }
    : { anim: 'clean', ms: 1300, fx: [kind === 'fert' ? '🌿' : '🌱'], track: () => {
      if (Math.random() < 0.3) fxSpawn({ x: at() * floorWidth() + rnd(-6, 6), y: 9 * furniK(), vx: rnd(-10, 10), vy: rnd(10, 40), ay: -150, life: 500,
        shape: 'dust', colors: kind === 'fert' ? ['#5a3a22', MP.leaf] : ['#e8d5a0', '#6a4428'], layer: 'front', floor: 'die' });
      return null; } };
  const ok = startChore(rt, [
    { go: besideX(at, 3 * furniK()) }, faceX(at),
    { ...fx, end: () => { rt.pending = null; run(); } },
    { anim: kind === 'harvest' ? 'celebrate' : 'happy', ms: 800 },
  ]);
  if (!ok){ rt.pending = null; run(); }
}

function openHuerto(rt, aviso, pick = -1){
  const d = huertoData();
  const seeds = CROP_IDS.filter(c => bagCount('semilla_' + c) > 0);
  const rows = [];
  for (let i = 0; i < d.n; i++){
    const p = d.plots[i], st = plotStage(p), c = p.crop && CROPS[p.crop];
    let icon = '➕', title = `Parcela ${i + 1}`, sub = 'Vacía', btns = '';
    if (!c){
      btns = `<button class="mini-btn" data-plot-plant="${i}">Plantar</button>`;
    } else if (st === 3){
      icon = c.emoji; title = c.name; sub = `¡Lista! Da ${c.yield}${c.seeds ? ` y ${c.seeds} semillas` : ''}`;
      btns = `<button class="mini-btn go" data-plot-harvest="${i}">Cosechar</button>`;
    } else {
      icon = '🌱'; title = c.name; sub = `Lista en ${magicDur(plotLeftMs(p))}${p.fert ? ' · fertilizada' : ''}`;
      if (!p.fert) btns = `<button class="mini-btn" data-plot-fert="${i}" ${bagCount('fertilizante') ? '' : 'disabled'}>Fertilizar</button>`;
    }
    rows.push(`<div class="menu-item plot-row ${st === 3 ? 'ripe' : ''}"><span class="emoji">${icon}</span>
      <div class="info"><b>${title}</b><small>${sub}</small></div>${btns}</div>`);
    if (pick === i){
      rows.push(seeds.length
        ? `<div class="seed-pick">${seeds.map(s => `<button class="seed-chip" data-seed="${i}:${s}">${CROPS[s].emoji} ${CROPS[s].name} <small>×${bagCount('semilla_' + s)}</small></button>`).join('')}</div>`
        : `<p class="style-empty">No tienes semillas: salen de los regalos 🎁 y de cavar con la pala.</p>`);
    }
  }
  if (d.n < HUERTO_MAX){
    const price = HUERTO_PLOT_PRICE[d.n];
    rows.push(`<div class="menu-item ${state.coins >= price ? '' : 'locked'}" data-huerto-expand><span class="emoji">🧱</span>
      <div class="info"><b>Ampliar el huerto</b><small>Una parcela más (${d.n + 1} de ${HUERTO_MAX})</small></div>
      <span class="menu-record">${coinsLabel(price)}</span></div>`);
  }
  const fert = bagCount('fertilizante');
  showOverlay(`
    <h3>🌱 Huerto</h3>
    <p class="${aviso ? 'sheet-note' : ''}">${aviso ? escapeHtml(aviso) : `Planta semillas y vuelve cuando estén listas.${fert ? ` Tienes ${fert} de fertilizante 🌿.` : ''}`}</p>
    <div class="menu-list">${rows.join('')}</div>
    <button class="overlay-btn secondary" id="btnCloseHuerto">Cerrar</button>
  `, hideOverlay);
  const card = document.getElementById('overlayCard');
  card.onclick = e => {
    const t = e.target.closest('[data-plot-plant],[data-plot-harvest],[data-plot-fert],[data-seed],[data-huerto-expand]');
    if (!t) return;
    if (t.dataset.plotPlant !== undefined){ const i = +t.dataset.plotPlant; openHuerto(rt, null, pick === i ? -1 : i); return; }
    if (t.dataset.seed){
      const [i, crop] = t.dataset.seed.split(':');
      if (bagCount('semilla_' + crop) <= 0) return;
      bagAdd('semilla_' + crop, -1);
      const p = huertoData().plots[+i];
      p.crop = crop; p.at = Date.now(); p.fert = false;
      saveState();
      hideOverlay();
      huertoChore(rt, +i, 'plant', () => {});
      say(`${CROPS[crop].emoji} ¡Plantada! Lista en ${CROPS[crop].growH} h`, 2600);
      return;
    }
    if (t.dataset.plotFert !== undefined){
      const p = huertoData().plots[+t.dataset.plotFert];
      if (!p.crop || p.fert || bagCount('fertilizante') <= 0) return;
      bagAdd('fertilizante', -1);
      p.fert = true;
      saveState();
      hideOverlay();
      huertoChore(rt, +t.dataset.plotFert, 'fert', () => {});
      say('🌿 Fertilizada: crece al doble de rápido', 2600);
      return;
    }
    if (t.dataset.plotHarvest !== undefined){
      const i = +t.dataset.plotHarvest, p = huertoData().plots[i];
      if (plotStage(p) !== 3) return;
      hideOverlay();
      huertoChore(rt, i, 'harvest', () => harvestPlot(i));
      return;
    }
    if (t.dataset.huertoExpand !== undefined){
      const dd = huertoData(), price = HUERTO_PLOT_PRICE[dd.n];
      if (state.coins < price){ openHuerto(rt, `Te faltan ${coinsLabel(price - state.coins)} para ampliarlo`); return; }
      confirmBuy({ icon: '🌱', name: 'una parcela más', price }, () => {
        state.coins -= price;
        huertoData().n++;
        saveState(); render();
        openHuerto(rt, '¡Una parcela más! 🌱');
      });
    }
  };
  document.getElementById('btnCloseHuerto').addEventListener('click', hideOverlay);
}

function harvestPlot(i){
  const p = huertoData().plots[i];
  if (!p.crop || plotStage(p) !== 3) return;
  const c = CROPS[p.crop], crop = p.crop;
  p.crop = null; p.fert = false;
  bagGain(crop, c.yield);
  if (c.seeds) bagGain('semilla_' + crop, c.seeds);
  saveState(); render();
  if (typeof rewardSound === 'function') rewardSound();
  showPopup({ icon: c.emoji, title: '¡Cosecha!',
    items: [{ icon: c.emoji, text: c.name, amount: `+${c.yield}` },
      ...(c.seeds ? [{ icon: '🌱', text: `Semillas de ${c.name.toLowerCase()}`, amount: `+${c.seeds}` }] : [])],
    note: bagNote() });
}

/* El dibujo: un cajón de tablas con cuatro parcelas; cada una con su
   planta según la etapa, y las que no están abiertas, tapadas con una tabla. */
const PLANT_SOIL = '#6a4428', PLANT_SEED = '#e8d5a0';
const CROP_ART = {
  zanahoria: (p, x) => { p.r(x + 1, 3, 1, 4, MP.leaf); p.r(x + 3, 2, 1, 5, MP.leaf); p.r(x + 2, 4, 1, 3, MP.leafL); p.r(x + 4, 4, 1, 3, MP.leafD);
    p.r(x + 1, 7, 4, 2, '#ff8a3d'); p.r(x + 1, 7, 1, 1, '#ffb36b'); },
  tomate: (p, x) => { p.r(x + 2, 1, 2, 7, MP.leafD); p.r(x + 1, 2, 1, 1, MP.leaf); p.r(x + 4, 3, 1, 1, MP.leaf);
    p.r(x, 3, 2, 2, FP.red); p.r(x, 3, 1, 1, FP.redL); p.r(x + 4, 5, 2, 2, FP.red); p.r(x + 4, 5, 1, 1, FP.redL); p.r(x + 2, 0, 2, 1, FP.red); },
  frutilla: (p, x) => { p.r(x, 5, 6, 2, MP.leaf); p.r(x + 1, 4, 4, 1, MP.leafL); p.r(x, 6, 1, 1, MP.leafD);
    p.r(x + 1, 7, 2, 2, FP.red); p.r(x + 4, 6, 2, 2, FP.red); p.r(x + 1, 7, 1, 1, '#ffe08a'); p.r(x + 5, 6, 1, 1, '#ffe08a'); },
  zapallo: (p, x) => { p.ell(x + 3, 6.2, 3.4, 2.6, (xx, yy) => (xx === x + 1 || xx === x + 4) ? '#e0702a' : '#ff8a3d'); p.r(x + 3, 3, 1, 1, MP.leafD); p.r(x + 4, 2, 1, 1, MP.leaf); },
  girasol: (p, x) => { p.r(x + 2, 3, 1, 5, MP.leafD); p.r(x + 3, 5, 2, 1, MP.leaf); p.r(x, 6, 2, 1, MP.leaf);
    p.r(x + 1, 0, 3, 3, '#ffd25a'); p.r(x + 2, 1, 1, 1, '#7a4a26'); p.r(x, 1, 1, 1, '#ffd25a'); p.r(x + 4, 1, 1, 1, '#ffd25a'); },
};

const HUERTO_ART = { w: HUERTO_W, h: 16,
  init: rt => { rt.st = []; rt.n = HUERTO_START; rt.sparkAt = 0; rt.pending = null; },
  tick: (rt, now) => {
    const d = huertoData();
    rt.n = d.n;
    rt.st = d.plots.map(p => ({ stage: plotStage(p), crop: p.crop }));
    if (now - rt.sparkAt > 700){
      rt.sparkAt = now;
      const ripe = rt.st.map((s, i) => s.stage === 3 ? i : -1).filter(i => i >= 0 && i < rt.n);
      if (ripe.length){
        const i = pickOne(ripe), k = furniK();
        fxSpawn({ x: rtPx(rt, plotArtX(i) + 3 - HUERTO_W / 2 + rnd(-3, 3)), y: rnd(8, 15) * k, vy: 8, life: 700, shape: 'spark', color: '#fff6a8', layer: 'front' });
      }
    }
  },
  cleanup: rt => { if (rt.pending){ const f = rt.pending; rt.pending = null; f(); } },
  tap: rt => { openHuerto(rt); return true; },
  parts: [
    { id: 'box', draw: p => {
      p.box(0, 9, HUERTO_W, 7, FP.wood, FP.woodL);
      p.r(1, 13, HUERTO_W - 2, 1, FP.woodD);
      for (let i = 0; i < HUERTO_MAX; i++){
        const x = plotArtX(i);
        p.r(x, 9, 6, 2, PLANT_SOIL); p.r(x + 1, 8, 4, 1, PLANT_SOIL); p.r(x + 2, 9, 1, 1, '#7d5534');
      }
    } },
    ...[0, 1, 2, 3].flatMap(i => {
      const x = plotArtX(i), st = rt => (rt.st && rt.st[i]) || { stage: -1 };
      return [
        { id: 'lock' + i, show: rt => i >= (rt.n || HUERTO_START), draw: p => {
          p.r(x - 1, 7, 8, 3, FP.O); p.r(x, 8, 6, 1, FP.woodD); p.r(x, 7, 6, 1, FP.wood); p.r(x + 1, 8, 1, 1, FP.metal); p.r(x + 4, 8, 1, 1, FP.metal);
        } },
        { id: 'seed' + i, show: rt => i < rt.n && st(rt).stage === 0, draw: p => { p.r(x + 1, 7, 1, 1, PLANT_SEED); p.r(x + 4, 7, 1, 1, PLANT_SEED); p.r(x + 2, 7, 2, 1, '#7d5534'); } },
        { id: 'sprout' + i, show: rt => i < rt.n && st(rt).stage === 1, draw: p => {
          p.r(x + 2, 5, 1, 3, MP.leafD); p.r(x + 1, 5, 1, 1, MP.leaf); p.r(x + 3, 4, 1, 1, MP.leafL); p.r(x + 3, 5, 1, 1, MP.leaf);
        } },
        { id: 'grow' + i, show: rt => i < rt.n && st(rt).stage === 2, draw: p => {
          p.r(x + 2, 2, 2, 6, MP.leafD); p.r(x, 4, 2, 1, MP.leaf); p.r(x + 4, 3, 2, 1, MP.leaf); p.r(x + 1, 2, 1, 1, MP.leafL); p.r(x + 4, 5, 1, 1, MP.leafL);
        } },
        ...CROP_IDS.map(c => ({ id: `ripe${i}_${c}`, show: rt => i < rt.n && st(rt).stage === 3 && st(rt).crop === c, draw: p => CROP_ART[c](p, x) })),
      ];
    }),
  ],
  visits: [
    /* Va a regar: mira una parcela, la riega y se pone contenta. */
    f => {
      const rt = f.rt, i = Math.floor(Math.random() * ((rt.n || HUERTO_START))), at = () => plotX(rt, i);
      return [
        { go: besideX(at, 3 * f.k) }, faceX(at),
        S.wait(900, 'idle', { fx: ['👀'] }),
        { anim: 'clean', ms: 2200, fx: ['💧'], fxEvery: 700, track: () => {
          if (Math.random() < 0.35) fxSpawn({ x: at() * floorWidth() + rnd(-6, 6), y: 14 * furniK(), vy: -rnd(40, 70), life: 600, shape: 'drop', color: MP.sky, layer: 'front', floor: 'die' });
          return null; } },
        S.happy(1200, { fx: ['🌱', '😊'], fxEvery: 600 }),
      ];
    },
  ],
  duos: [
    f => {
      const rt = f.rt, at = i => () => plotX(rt, i);
      return {
        a: [{ go: besideX(at(0), 3 * f.k) }, faceX(at(0)), S.sync('in'), { anim: 'clean', ms: 2400, fx: ['💧'], fxEvery: 800 }, S.sync('end'), S.happy(800, { dir: 'partner' })],
        b: [{ go: besideX(at(1), 3 * f.k) }, faceX(at(1)), S.sync('in'), S.wait(2400, 'idle', { fx: ['🌱', '👀'], fxEvery: 1200 }), S.sync('end'), { anim: 'celebrate', ms: 900 }],
      };
    },
  ] };
FURNI_ART.huerto = HUERTO_ART;

/* ---------- la pestañita de la mochila ---------- */

window.addEventListener('DOMContentLoaded', () => {
  const b = document.getElementById('btnBag');
  if (!b) return;
  b.addEventListener('click', e => {
    e.stopPropagation();
    b.classList.remove('blink');
    if (state && !gameOver && !activeMinigame) openBag();
  });
  /* Se ve solo con la mochila comprada. */
  setInterval(() => {
    const on = hasBackpack();
    if (b._on !== on){ b._on = on; b.classList.toggle('hidden', !on); }
  }, 500);
});
