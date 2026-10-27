/* ===================== Huerta: mochila, tesoros y huerto =====================
   Lo que se junta y no es comida de la despensa ni un mueble: va en la
   mochila (state.bag, bagAdd()/bagCount() en app.js), con su catálogo
   (BAG_ITEMS):
   - la huerta: el fertilizante de la compostera (objetos.js) y las
     semillas (salen de los regalos y de cavar);
   - la cosecha del huerto y del árbol: no se come cruda, se cocina (o se
     vende);
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
  { id:'cocina', kind:'furni', wow: true, group:'huerta', name:'Cocina', use:'pasteles y más', price: 90 },
  { id:'regadera', kind:'furni', wow: true, group:'huerta', name:'Regadera', use:'riega el huerto', price: 25 },
  { id:'palita', kind:'furni', wow: true, group:'huerta', name:'Pala de jardín', use:'cava tesoros', price: 45 },
);

/* ---------- catálogo ---------- */

/* Lo que se planta. growH: horas REGADAS hasta cosechar (ver la regadera);
   yield: cuánto da. Los vegetales y frutas no se comen crudos (pedido así):
   se cocinan. El girasol es una flor: se regala. */
const CROPS = {
  zanahoria: { name: 'Zanahoria', emoji: '🥕', growH: 3,  yield: 2, sell: 2 },
  tomate:    { name: 'Tomate',    emoji: '🍅', growH: 5,  yield: 3, sell: 2 },
  frutilla:  { name: 'Frutilla',  emoji: '🍓', growH: 8,  yield: 4, sell: 3 },
  zapallo:   { name: 'Zapallo',   emoji: '🎃', growH: 12, yield: 1, sell: 8 },
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
  { id: 'cocina',  title: 'Cocina' },
  { id: 'tesoro',  title: 'Tesoros' },
];
const BAG_ITEMS = [
  { id: 'fertilizante', group: 'huerta', name: 'Fertilizante', emoji: '🌿',
    desc: 'Sale de la compostera. Hace crecer al árbol frutal, al frijol mágico y al huerto (tócalos).' },
  ...CROP_IDS.map(id => ({ id: 'semilla_' + id, group: 'huerta', seed: id, name: `Semillas de ${CROPS[id].name.toLowerCase()}`,
    emoji: CROPS[id].emoji, desc: `Se plantan en el huerto. ${CROPS[id].name}: lista en ${CROPS[id].growH} h, da ${CROPS[id].yield}.` })),
  ...CROP_IDS.map(id => ({ id, group: 'cosecha', crop: id, name: CROPS[id].name, emoji: CROPS[id].emoji, sell: CROPS[id].sell,
    gift: CROPS[id].happy,
    desc: CROPS[id].happy ? `Del huerto. Regálaselo: +${CROPS[id].happy} de felicidad, o úsalo en la cocina.`
      : 'Del huerto. Crudo no se come: hay que cocinarlo en la cocina.' })),
  { id: 'manzana', group: 'cosecha', name: 'Manzana', emoji: '🍎', sell: 2,
    desc: 'Del árbol frutal. Cruda no se come: hay que cocinarla en la cocina.' },
  /* La cocina: la harina se compra (Tienda → Comida) y los platos salen de
     las recetas (RECIPES, abajo). */
  { id: 'harina', group: 'cocina', name: 'Harina', emoji: '🌾', sell: 3, buy: 6,
    desc: 'Para pasteles, pies y galletas. Se compra en la tienda, pestaña Comida.' },
  { id: 'ensalada', group: 'cocina', name: 'Ensalada', emoji: '🥗', sell: 6,  food: { restore: 30, energy: 4, happy: 5 } },
  { id: 'sopa',     group: 'cocina', short: 'Sopa', name: 'Sopa de zapallo', emoji: '🍲', sell: 12, food: { restore: 70, energy: 8 } },
  { id: 'pastel',   group: 'cocina', short: 'Pastel', name: 'Pastel de frutilla', emoji: '🎂', sell: 25, food: { restore: 40, energy: 5, happy: 20 } },
  { id: 'pie',      group: 'cocina', short: 'Pie', name: 'Pie de zapallo', emoji: '🥧', sell: 15, food: { restore: 60, energy: 6, happy: 10 } },
  { id: 'galletas', group: 'cocina', short: 'Galletas', name: 'Galletas de girasol', emoji: '🍪', sell: 3, food: { restore: 10, energy: 3, happy: 5 } },
  { id: 'compota',  group: 'cocina', short: 'Compota', name: 'Compota de manzana', emoji: '🥣', sell: 4, food: { restore: 25, energy: 3, happy: 5 } },
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
for (const it of BAG_ITEMS) if (it.food && !it.desc) it.desc = `Hecho en la cocina. ${foodText(it.food)}`;
function foodText(f){ return `Llena ${f.restore} de panza${f.happy ? ` y da +${f.happy} de felicidad` : ''}.`; }
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
    if (it.food) acts.push(`<button class="overlay-btn" data-bag-act="eat">Dárselo de comer</button>`);
    if (it.gift) acts.push(`<button class="overlay-btn" data-bag-act="gift">Regalárselo</button>`);
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
    state.happiness = clamp(state.happiness + it.gift);
    hideOverlay();
    floatFx(it.emoji);
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

/* Comer algo de la cosecha o de la cocina: igual que una porción de la
   bandeja (cae al montón, las barras suben mientras se la come), pero de la
   mochila. */
function bagEat(id){
  const it = bagItem(id), c = it.food;
  if (bagCount(id) <= 0) return;
  if (state.stage === 'egg'){ say('Todavía es un huevo…'); return; }
  if (foodPile && foodPile.pieces.length >= FOOD_PILE_MAX){ say('¡Espera que se coma lo que tiene!'); return; }
  if (!tryWake()) return;
  catchUp();
  bagAdd(id, -1);
  const food = { id, name: it.name, emoji: it.emoji, restore: c.restore, energy: c.energy };
  const piece = { food, hunger: hungerFillPct(food), energy: food.energy, t: 0, done: 0 };
  const m = state.meal || (state.meal = { hunger: 0, energy: 0 });
  m.hunger += piece.hunger; m.energy += piece.energy;
  if (c.happy) state.happiness = clamp(state.happiness + c.happy);
  say(it.crop ? '¡Del huerto! 😋' : '¡Hecho en casa! 😋');
  serveFood(piece);
  medalAdd('comidas');   // logros.js
  saveState(); render();
}

/* ---------- cavar con la pala de jardín ----------
   La pala de jardín (palita) es otra que la recogecaca (objetos.js): una
   pala de punta, clavada en un montoncito de tierra. Cavar encuentra algo
   una vez cada DIG_GAP_MS (tiempo real): la tierra "descansa". Mandada
   (tocarla) o sola (su visita). Lo que sale, por peso: */
const DIG_GAP_MS = 40 * 60 * 1000;
const DIG_LOOT = [
  { id: null, w: 22 },                      // solo tierra
  { id: 'caracola', w: 18 }, { id: 'hueso', w: 15 }, { id: 'semilla', w: 20 },
  { id: 'amuleto', w: 8 }, { id: 'topacio', w: 6 }, { id: 'zafiro', w: 5 },
  { id: 'rubi', w: 3 }, { id: 'diamante', w: 1.2 }, { id: 'fosil', w: 0.5 },
];

function digFind(act, player){
  const d = objData('palita'), now = Date.now(), last = d.lastDig || 0;
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

/* Una herramienta en la mano: la pieza gira en `pivot` (abajo al centro
   del arte) y el punto (gx, gy) del arte queda en la mano. Lo mismo que
   palaPoseAt() de objetos.js, para cualquier objeto. */
function toolPoseAt(rt, art, pivot, gx, gy, hx, hy, r, sx = 1){
  const k = furniK(), dx = (gx - pivot[0]) * k * sx, dy = (gy - pivot[1]) * k;
  const c = Math.cos(r), s = Math.sin(r);
  return { x: hx - rt.x * floorWidth() - (dx * c - dy * s), y: hy - (art.h - pivot[1]) * k + (dx * s + dy * c), r, sx };
}

/* La pala de jardín: cruzada en la mano con la punta adelante, como la
   recogecaca; `tilt` la baja para cavar. */
const SPADE_PIVOT = [5, 21], SPADE_GRIP = [5, 4], SPADE_TIP = [5, 20];
function spadePose(rt){
  const c = rt.carry;
  if (!c) return null;
  const hand = palaHand(c.act), r = 1.15 - (c.tilt || 0), len = (SPADE_TIP[1] - SPADE_GRIP[1]) * furniK();
  const y = Math.max(hand.y, c.act.y + len * Math.cos(r) + 1);
  return toolPoseAt(rt, PALITA_ART, SPADE_PIVOT, SPADE_GRIP[0], SPADE_GRIP[1], hand.x, y, -c.act.dir * r);
}
function spadeTip(rt){
  const c = rt.carry, hand = palaHand(c.act), r = 1.15 - (c.tilt || 0), len = (SPADE_TIP[1] - SPADE_GRIP[1]) * furniK();
  return { x: hand.x + c.act.dir * len * Math.sin(r), y: Math.max(1, hand.y - len * Math.cos(r)) };
}

/* Toma la pala, va a cavar a otro lado de la pieza, (a veces) encuentra
   algo y la deja de vuelta. `player`: lo pidió quien juega (pop-up). */
function spadeDigSteps(rt, player){
  const k = furniK(), at = () => rt.x;
  let spot = 0.5;
  return [
    { go: besideX(at, 4 * k) }, faceX(at),
    { anim: 'pet', ms: 380, end: (r, act) => { rt.carry = { act, tilt: 0 }; spot = clampX(rt.x + (rt.x < 0.5 ? 0.28 : -0.28)); } },
    { go: () => spot },
    { anim: 'clean', ms: 2400, fx: ['🕳️'], fxEvery: player ? 0 : 1200, track: (r, el, act) => {
      rt.carry.tilt = 0.45 * Math.abs(Math.sin(el / 260));
      if (Math.random() < 0.3){ const t = spadeTip(rt); fxSpawn({ x: t.x, y: 2, vx: -act.dir * rnd(10, 40), vy: rnd(30, 60), ay: -160, life: 600, shape: 'dust', colors: [FP.sandD, FP.brown, FP.brownL], layer: 'front', floor: 'die' }); }
      return null;
    }, end: (r, act) => { if (rt.carry) rt.carry.tilt = 0; digFind(act, player); } },
    { anim: 'happy', ms: 800 },
    { go: besideX(at, 4 * k) }, faceX(at),
    { anim: 'pet', ms: 380, end: () => { rt.carry = null; } },
  ];
}

const PALITA_ART = { w: 10, h: 22,
  init: rt => { rt.carry = null; },
  cleanup: rt => { rt.carry = null; },
  tap: rt => {
    if (walker.activity && walker.activity.kind === 'chore'){ petFx('❗', walker); return true; }
    if (!startChore(rt, spadeDigSteps(rt, true)) && state.sleeping) say('Shh… está durmiendo 💤');
    return true;
  },
  parts: [
    /* La pala: mango verde con agarradera, hoja de punta (la punta queda
       metida en la tierra). */
    { id: 'spade', pivot: SPADE_PIVOT, pose: rt => spadePose(rt), draw: p => {
      p.box(3, 0, 5, 3, MP.leafD, MP.leaf);
      p.r(4, 3, 3, 9, FP.O); p.r(5, 3, 1, 9, FP.wood);
      p.r(3, 12, 5, 1, FP.metalD);
      p.r(2, 13, 7, 4, FP.O); p.r(3, 13, 5, 4, FP.metal); p.r(3, 13, 1, 3, '#d9dee8');
      p.r(3, 17, 5, 2, FP.O); p.r(4, 17, 3, 2, FP.metal); p.r(4, 19, 3, 1, FP.O); p.r(5, 20, 1, 1, FP.O);
    } },
    { id: 'mound', draw: p => {
      p.r(1, 19, 8, 3, FP.O); p.r(2, 19, 6, 2, '#6a4428'); p.r(0, 21, 10, 1, FP.O);
      p.r(3, 19, 1, 1, '#7d5534'); p.r(6, 20, 1, 1, '#7d5534');
    } },
  ],
  visits: [ f => spadeDigSteps(f.rt, false) ],
  duos: [
    f => {
      const rt = f.rt, k = f.k, at = () => rt.x;
      return {
        a: [{ go: besideX(at, 4 * k) }, faceX(at),
          { anim: 'pet', ms: 380, end: (r, act) => { rt.carry = { act, tilt: 0 }; } }, S.sync('dig'),
          { anim: 'clean', ms: 3000, fx: ['🕳️'], fxEvery: 1000, track: (r, el, act) => {
            rt.carry.tilt = 0.45 * Math.abs(Math.sin(el / 260));
            if (Math.random() < 0.3){ const t = spadeTip(rt); fxSpawn({ x: t.x, y: 2, vx: -act.dir * rnd(10, 40), vy: rnd(30, 60), ay: -160, life: 600, shape: 'dust', colors: [FP.sandD, FP.brown], layer: 'front', floor: 'die' }); }
            return null; } },
          { anim: 'pet', ms: 380, end: () => { rt.carry = null; } }, S.sync('end'), S.happy(800, { dir: 'partner', fx: ['💎'] })],
        b: [{ go: f.x(-30) }, S.sync('dig', { dir: 'partner' }), S.wait(3000, 'idle', { dir: 'partner', fx: ['👀', '😮'], fxEvery: 1200 }),
          S.sync('end'), { anim: 'celebrate', ms: 900, fx: ['👏'] }],
      };
    },
  ] };
FURNI_ART.palita = PALITA_ART;

/* ---------- el huerto ---------- */

const HUERTO_START = 2;
const HUERTO_MAX = 4;
const HUERTO_PLOT_PRICE = [0, 0, 60, 90];   // lo que cuesta abrir la parcela 3 y la 4

/* Las plantas crecen solo mientras el huerto está regado: cada riego (la
   regadera, abajo) sirve WATER_MS (una hora real) y hay que volver a
   regar para que sigan; seco, no crecen (tampoco se mueren). Cada parcela
   guarda cuánto lleva crecido (`grown`, ms regados) y hasta cuándo se
   contó (`t`); huertoGrow() suma lo regado entre `t` y ahora, también con
   la app cerrada (se cuenta con la hora). El fertilizante la hace crecer
   al doble de rápido (una vez por siembra). */
const WATER_MS = 60 * 60 * 1000;
const plotNeedMs = p => CROPS[p.crop].growH * 3600000;

function huertoData(){
  const d = objData('huerto');
  if (!Array.isArray(d.plots)) d.plots = [];
  if (!Number.isInteger(d.n) || d.n < HUERTO_START) d.n = HUERTO_START;
  d.n = Math.min(HUERTO_MAX, d.n);
  while (d.plots.length < HUERTO_MAX) d.plots.push({ crop: null });
  const now = Date.now();
  for (const p of d.plots){
    if (p.crop && !CROPS[p.crop]) p.crop = null;
    /* Siembras de antes del riego (crecían con la hora): lo que llevaban. */
    if (p.crop && typeof p.grown !== 'number'){
      p.grown = Math.min(plotNeedMs(p), Math.max(0, now - (p.at || now)) * (p.fert ? 2 : 1));
      p.t = now; delete p.at;
    }
  }
  huertoGrow(d, now);
  return d;
}
function huertoGrow(d, now = Date.now()){
  const wet = d.wateredUntil || 0;
  for (const p of d.plots){
    if (!p.crop) continue;
    if (!p.t || now < p.t){ p.t = now; continue; }   // reloj que vuelve atrás: no crece
    const dt = Math.max(0, Math.min(now, wet) - p.t);
    if (dt) p.grown = Math.min(plotNeedMs(p), p.grown + dt * (p.fert ? 2 : 1));
    p.t = now;
  }
}
const huertoWet = (d = huertoData()) => Date.now() < (d.wateredUntil || 0);
function huertoWater(){
  const d = huertoData(), now = Date.now();
  huertoGrow(d, now);
  d.wateredUntil = now + WATER_MS;
  saveState();
}
function plotStage(p){
  if (!p.crop) return -1;
  const t = p.grown / plotNeedMs(p);
  return t >= 1 ? 3 : t >= 0.6 ? 2 : t >= 0.25 ? 1 : 0;
}
/* Cuánto riego le falta (ms regados, ya con el x2 del fertilizante). */
const plotLeftMs = p => Math.max(0, (plotNeedMs(p) - p.grown) / (p.fert ? 2 : 1));

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
      icon = '🌱'; title = c.name; sub = `Le faltan ${magicDur(plotLeftMs(p))} regada${p.fert ? ' · fertilizada' : ''}`;
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
  /* El riego, arriba de todo: sin agua no crece nada. */
  const reg = magicRt('regadera'), wet = huertoWet(d), left = (d.wateredUntil || 0) - Date.now();
  const water = `<div class="menu-item plot-row water-row ${wet ? 'wet' : 'dry'}">
      <span class="emoji">${wet ? '💧' : '🥀'}</span>
      <div class="info"><b>${wet ? 'Regado' : 'Seco: no crece'}</b>
        <small>${wet ? `Sigue creciendo ${magicDur(left)} más` : reg ? 'Riégalo con la regadera: cada riego dura 1 hora'
          : state.style.owned.regadera ? 'Trae la regadera a esta habitación para regarlo' : 'Hace falta una regadera (Tienda → Objetos → Huerta y cocina)'}</small></div>
      ${reg ? `<button class="mini-btn ${wet ? '' : 'go'}" data-water>Regar</button>` : ''}</div>`;
  showOverlay(`
    <h3>🌱 Huerto</h3>
    <p class="${aviso ? 'sheet-note' : ''}">${aviso ? escapeHtml(aviso) : `Planta, riega cada hora y cosecha.${fert ? ` Tienes ${fert} de fertilizante 🌿.` : ''}`}</p>
    <div class="menu-list">${water}${rows.join('')}</div>
    <button class="overlay-btn secondary" id="btnCloseHuerto">Cerrar</button>
  `, hideOverlay);
  const card = document.getElementById('overlayCard');
  card.onclick = e => {
    const t = e.target.closest('[data-plot-plant],[data-plot-harvest],[data-plot-fert],[data-seed],[data-huerto-expand],[data-water]');
    if (!t) return;
    if (t.dataset.water !== undefined){ const reg = magicRt('regadera'); hideOverlay(); if (reg) waterGarden(reg); return; }
    if (t.dataset.plotPlant !== undefined){ const i = +t.dataset.plotPlant; openHuerto(rt, null, pick === i ? -1 : i); return; }
    if (t.dataset.seed){
      const [i, crop] = t.dataset.seed.split(':');
      if (bagCount('semilla_' + crop) <= 0) return;
      bagAdd('semilla_' + crop, -1);
      const p = huertoData().plots[+i];
      p.crop = crop; p.grown = 0; p.t = Date.now(); p.fert = false;
      saveState();
      hideOverlay();
      huertoChore(rt, +i, 'plant', () => {});
      say(`${CROPS[crop].emoji} ¡Plantada! Necesita ${CROPS[crop].growH} h regada`, 2600);
      return;
    }
    if (t.dataset.plotFert !== undefined){
      const p = huertoData().plots[+t.dataset.plotFert];
      if (!p.crop || p.fert || bagCount('fertilizante') <= 0) return;
      bagAdd('fertilizante', -1);
      huertoGrow(huertoData());
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
    rt.wet = huertoWet(d);
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
        /* Regado, la tierra se ve oscura y húmeda. */
        { id: 'wet' + i, show: rt => i < rt.n && rt.wet, draw: p => {
          p.r(x, 9, 6, 2, '#4a2e18'); p.r(x + 1, 8, 4, 1, '#4a2e18'); p.r(x + 1, 9, 1, 1, '#7fb4e0'); p.r(x + 4, 10, 1, 1, '#7fb4e0');
        } },
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
    /* Va a mirar sus plantas: las huele, les habla y se pone contenta (el
       riego de verdad es con la regadera). */
    f => {
      const rt = f.rt, i = Math.floor(Math.random() * ((rt.n || HUERTO_START))), at = () => plotX(rt, i);
      return [
        { go: besideX(at, 3 * f.k) }, faceX(at),
        S.wait(1200, 'idle', { fx: ['👀'] }),
        { anim: 'pet', ms: 1600, fx: ['🌱', '💬'], fxEvery: 800 },
        S.happy(1200, { fx: [rt.wet ? '😊' : '🥀'], fxEvery: 600 }),
      ];
    },
  ],
  duos: [
    f => {
      const rt = f.rt, at = i => () => plotX(rt, i);
      return {
        a: [{ go: besideX(at(0), 3 * f.k) }, faceX(at(0)), S.sync('in'), { anim: 'pet', ms: 2400, fx: ['🌱'], fxEvery: 800 }, S.sync('end'), S.happy(800, { dir: 'partner' })],
        b: [{ go: besideX(at(1), 3 * f.k) }, faceX(at(1)), S.sync('in'), S.wait(2400, 'idle', { fx: ['🌱', '👀'], fxEvery: 1200 }), S.sync('end'), { anim: 'celebrate', ms: 900 }],
      };
    },
  ] };
FURNI_ART.huerto = HUERTO_ART;

/* ---------- la regadera ----------
   Tiene que estar en la habitación del huerto. Tocarla (o "Regar" en la
   hoja del huerto) manda a la mascota a tomarla, pasar por cada parcela
   abierta echándole agua y dejarla de vuelta: el huerto queda regado una
   hora (WATER_MS, huertoWater() al echar la primera agua). Sola juega con
   ella (se moja), pero eso no riega: regar es cosa de quien juega. */
const CAN_PIVOT = [7, 11], CAN_GRIP = [7, 2];
function canPose(rt){
  const c = rt.carry;
  if (!c) return null;
  const hand = palaHand(c.act), dir = c.act.dir;
  return toolPoseAt(rt, REGADERA_ART, CAN_PIVOT, CAN_GRIP[0], CAN_GRIP[1], hand.x, hand.y + 3 * furniK(), dir * (c.tilt || 0), dir);
}
/* Dónde cae el agua: la punta del pico, adelante y abajo. */
function canSpout(rt){
  const c = rt.carry, hand = palaHand(c.act), k = furniK();
  return { x: hand.x + c.act.dir * 7 * k, y: hand.y + k };
}
const pour = (rt, ms, onDone) => ({ anim: 'idle', ms, track: (r, el) => {
  rt.carry.tilt = Math.min(0.7, el / 250);
  if (Math.random() < 0.6){ const s = canSpout(rt); fxSpawn({ x: s.x + rnd(-2, 2), y: s.y, vx: rnd(-6, 6), vy: -rnd(30, 60), ay: -260, life: 900, shape: 'drop', color: Math.random() < 0.5 ? MP.sky : '#d6f1ff', layer: 'front', floor: 'die' }); }
  return null;
}, end: () => { rt.carry.tilt = 0; if (onDone) onDone(); } });

function waterGarden(rt){
  const hrt = magicRt('huerto');
  if (!hrt){ say(state.style.owned.huerto ? 'Pon la regadera en la habitación del huerto 🌱' : 'Primero un huerto para regar 🌱', 2600); return; }
  if (walker.activity && walker.activity.kind === 'chore'){ petFx('❗', walker); return; }
  const k = furniK(), at = () => rt.x, n = huertoData().n;
  let watered = false;
  const water = () => { if (!watered){ watered = true; huertoWater(); } };
  rt.pending = water;
  const steps = [
    { go: besideX(at, 4 * k) }, faceX(at),
    { anim: 'pet', ms: 380, end: (r, act) => { rt.carry = { act, tilt: 0 }; } },
  ];
  for (let i = 0; i < n; i++){
    const px = () => plotX(hrt, i);
    steps.push({ go: (a, act) => clampX(px() + (act.x <= px() ? -1 : 1) * actorCssH(act) * 0.45 / floorWidth()) }, faceX(px),
      pour(rt, 900, water));
  }
  steps.push({ anim: 'happy', ms: 600, fx: ['💧', '🌱'] }, { go: besideX(at, 4 * k) }, faceX(at),
    { anim: 'pet', ms: 380, end: () => { rt.carry = null; rt.pending = null; say('💧 ¡Regado! Crece por una hora', 2400); } });
  if (!startChore(rt, steps)){ rt.pending = null; if (state.sleeping) say('Shh… está durmiendo 💤'); }
}

const REGADERA_ART = { w: 16, h: 12,
  init: rt => { rt.carry = null; rt.pending = null; },
  cleanup: rt => { rt.carry = null; if (rt.pending){ const f = rt.pending; rt.pending = null; f(); } },
  tap: rt => { waterGarden(rt); return true; },
  parts: [
    { id: 'can', pivot: CAN_PIVOT, pose: rt => canPose(rt), draw: p => {
      p.r(4, 0, 7, 1, FP.O); p.r(4, 1, 1, 3, FP.O); p.r(10, 1, 1, 3, FP.O);   // asa
      p.box(2, 3, 11, 9, MP.mintD, MP.mint); p.r(3, 5, 9, 1, '#24a074');
      p.r(13, 6, 1, 1, FP.O); p.r(14, 5, 1, 1, FP.O); p.r(15, 3, 1, 3, FP.O); p.r(14, 3, 1, 1, MP.sky);   // pico
      p.r(4, 7, 2, 2, '#ffffff');
    } },
  ],
  /* Sola: se moja con la regadera, de puro jugar. */
  visits: [
    f => {
      const rt = f.rt, at = () => rt.x;
      return [
        { go: besideX(at, 4 * f.k) }, faceX(at),
        { anim: 'pet', ms: 380, end: (r, act) => { rt.carry = { act, tilt: 0 }; } },
        { anim: 'happy', ms: 1200, fx: ['😄'] },
        { anim: 'clean', ms: 1800, fx: ['💦', '😆'], fxEvery: 700, track: (r, el, act) => {
          rt.carry.tilt = 0.5 + 0.3 * Math.sin(el / 200);
          if (Math.random() < 0.5) fxSpawn({ x: act.x * floorWidth() + rnd(-8, 8), y: actorCssH(act) * 0.8, vy: -rnd(20, 50), ay: -200, life: 700, shape: 'drop', color: MP.sky, layer: 'front', floor: 'die' });
          return null; } },
        { anim: 'pet', ms: 380, end: () => { rt.carry = null; } },
        S.happy(800, { fx: ['💧'] }),
      ];
    },
  ],
  /* Uno moja al otro y se ríen. */
  duos: [
    f => {
      const rt = f.rt, at = () => rt.x;
      return {
        a: [{ go: besideX(at, 4 * f.k) }, faceX(at), { anim: 'pet', ms: 380, end: (r, act) => { rt.carry = { act, tilt: 0 }; } },
          S.sync('in', { dir: 'partner' }),
          { anim: 'happy', ms: 1800, dir: 'partner', fx: ['😈'], track: (r, el, act, a) => {
            rt.carry.tilt = 0.6;
            const s = canSpout(rt);
            if (Math.random() < 0.6) fxSpawn({ x: s.x + rnd(-2, 2), y: s.y, vx: act.dir * rnd(10, 30), vy: -rnd(10, 40), ay: -240, life: 900, shape: 'drop', color: MP.sky, layer: 'front', floor: 'die' });
            return null; } },
          { anim: 'pet', ms: 380, end: () => { rt.carry = null; } }, S.sync('end'), S.happy(800, { dir: 'partner' })],
        b: [{ go: f.x(-24) }, S.sync('in', { dir: 'partner' }), { anim: 'sad', ms: 900, fx: ['💦'] }, { anim: 'celebrate', ms: 1300, fx: ['😂'] }, S.sync('end'), S.happy(600, { dir: 'partner' })],
      };
    },
  ] };
FURNI_ART.regadera = REGADERA_ART;

/* ---------- la cocina ----------
   Una cocina con horno. Con lo cosechado (y harina de la tienda) se hacen
   recetas: bocadillos y comida rica (van a la despensa, a la bandeja de
   Comer), y platos que van a la mochila (ensalada, sopa, pastel, pie,
   galletas, compota). Cocinar rinde más que comerse la cosecha cruda: es la
   gracia.

   Tiene **cola** (por pedido): se pueden encargar varias recetas y se
   cocinan de a una, cada una con su tiempo (`mins`, reales, también con la
   app cerrada). Los ingredientes se descuentan al encargarla (y vuelven si
   se cancela). Lo que termina espera en la cocina y sale un globito con
   cuántas hay listas (con corona cuando ya no queda nada en el horno);
   tocar el globito saca todo lo listo y lo demás se sigue cocinando.
   Caben COCINA_MAX cosas entre la cola y lo listo. */
const COCINA_MAX = 6;
const RECIPES = [
  { id: 'bocadillos', out: { pantry: 'simple', n: 3 }, needs: { zanahoria: 1, tomate: 1 }, mins: 2 },
  { id: 'rica',       out: { pantry: 'rica', n: 2 },   needs: { tomate: 2, zanahoria: 1, harina: 1 }, mins: 4 },
  { id: 'ensalada',   out: { bag: 'ensalada', n: 1 },  needs: { zanahoria: 2, tomate: 1 }, mins: 2 },
  { id: 'sopa',       out: { bag: 'sopa', n: 2 },      needs: { zapallo: 1, zanahoria: 1 }, mins: 6 },
  { id: 'pastel',     out: { bag: 'pastel', n: 1 },    needs: { frutilla: 3, harina: 2 }, mins: 10 },
  { id: 'pie',        out: { bag: 'pie', n: 2 },       needs: { zapallo: 1, harina: 2 }, mins: 10 },
  { id: 'galletas',   out: { bag: 'galletas', n: 4 },  needs: { girasol: 1, harina: 1 }, mins: 5 },
  { id: 'compota',    out: { bag: 'compota', n: 2 },   needs: { manzana: 2 }, mins: 3 },
];
const recipeById = id => RECIPES.find(r => r.id === id);
const recipeMs = id => recipeById(id).mins * 60000;
/* Lo que sale de una receta: nombre y emoji (de la despensa o de la mochila). */
function recipeOut(r){
  const it = r.out.pantry ? foodById(r.out.pantry) : bagItem(r.out.bag);
  return { name: it.name, emoji: it.emoji, n: r.out.n };
}
const recipeCan = r => Object.entries(r.needs).every(([id, n]) => bagCount(id) >= n);

/* `queue`: lo encargado, en orden; el primero se está cocinando desde `at`.
   `ready`: lo que ya salió y espera que lo saquen. Al leerla se pasa a
   `ready` todo lo que ya terminó: cada uno empieza justo cuando termina el
   anterior, así la cola avanza igual con la app cerrada. */
function cocinaData(){
  const d = objData('cocina');
  if (!Array.isArray(d.queue)) d.queue = [];
  if (!Array.isArray(d.ready)) d.ready = [];
  /* Saves de cuando se cocinaba una cosa a la vez: {recipe, at}. */
  if (d.recipe){ if (recipeById(d.recipe)) d.queue.unshift(d.recipe); delete d.recipe; }
  d.queue = d.queue.filter(recipeById);
  d.ready = d.ready.filter(recipeById);
  if (typeof d.at !== 'number') d.at = Date.now();
  const now = Date.now();
  while (d.queue.length && now >= d.at + recipeMs(d.queue[0])){
    d.at += recipeMs(d.queue[0]);
    d.ready.push(d.queue.shift());
  }
  return d;
}
/* Cuándo termina cada cosa de la cola (hora real, ms). */
function cocinaEnds(d){
  let t = d.at;
  return d.queue.map(id => (t += recipeMs(id)));
}
const cocinaFull = d => d.queue.length + d.ready.length >= COCINA_MAX;

/* Lo listo, agrupado: [{r, times}] en el orden en que salió. */
function cocinaReadyGroups(d){
  const out = [];
  for (const id of d.ready){
    const g = out.find(x => x.r.id === id);
    if (g) g.times++; else out.push({ r: recipeById(id), times: 1 });
  }
  return out;
}

function cocinaListHtml(){
  const d = cocinaData(), ends = cocinaEnds(d), now = Date.now();
  let html = '';
  if (d.ready.length){
    const groups = cocinaReadyGroups(d);
    const txt = groups.map(g => { const o = recipeOut(g.r); return `${o.emoji} ${escapeHtml(o.name)} ×${o.n * g.times}`; }).join(' · ');
    html += `<div class="menu-item plot-row ripe"><span class="emoji">${recipeOut(groups[0].r).emoji}</span>
      <div class="info"><b>¡Listo para sacar!</b><small>${txt}</small></div>
      <button class="mini-btn go" data-cook-take>Sacar</button></div>`;
  }
  if (d.queue.length){
    html += `<div class="section-label">En el horno (${d.queue.length})</div>`;
    html += d.queue.map((id, i) => {
      const r = recipeById(id), o = recipeOut(r), ms = recipeMs(id);
      const pct = i === 0 ? Math.max(0, Math.min(100, (now - d.at) / ms * 100)) : 0;
      return `<div class="menu-item plot-row cook-q ${i === 0 ? 'cooking' : ''}"><span class="emoji">${o.emoji}</span>
        <div class="info"><b>${escapeHtml(o.name)} ×${o.n}</b>
          <small>${i === 0 ? 'Cocinando' : 'En espera'} · listo en <span data-cook-end="${ends[i]}">${fmtWait(ends[i] - now)}</span></small>
          ${i === 0 ? `<div class="cook-bar"><i data-cook-bar="${d.at}" data-cook-ms="${ms}" style="width:${pct.toFixed(1)}%"></i></div>` : ''}</div>
        <button class="mini-btn" data-cook-cancel="${i}:${id}">Cancelar</button></div>`;
    }).join('');
  }
  const full = cocinaFull(d);
  html += `<div class="section-label">Recetas</div>` + RECIPES.map(r => {
    const o = recipeOut(r), can = recipeCan(r) && !full;
    const chips = Object.entries(r.needs).map(([id, n]) => {
      const it = bagItem(id), ok = bagCount(id) >= n;
      return `<span class="need-chip ${ok ? 'ok' : ''}">${it.emoji} ×${n}${ok ? '' : ` · faltan ${n - bagCount(id)}`}</span>`;
    }).join('');
    const label = full && recipeCan(r) ? 'Llena' : d.queue.length ? 'A la cola' : 'Cocinar';
    return `<div class="menu-item recipe-row ${recipeCan(r) ? '' : 'locked'}">
      <span class="emoji">${o.emoji}</span>
      <div class="info"><b>${escapeHtml(o.name)} ×${o.n}</b><small>${r.out.pantry ? 'A la despensa' : 'A la mochila'} · ${r.mins} min</small>
        <div class="need-chips">${chips}</div></div>
      <button class="mini-btn ${can ? 'go' : ''}" data-cook="${r.id}" ${can ? '' : 'disabled'}>${label}</button></div>`;
  }).join('');
  return html;
}
const cocinaSig = () => { const d = cocinaData(); return d.queue.join() + '|' + d.ready.join(); };

/* La hoja se queda abierta mientras se encarga: se pueden poner varias en
   la cola seguidas. Cada segundo se mueven las cuentas regresivas; la lista
   entera se rehace solo cuando algo termina (rehacerla cada segundo se
   comería los toques). */
let cocinaTimer = 0;
function openCocina(rt, aviso){
  showOverlay(`
    <h3>🍳 Cocina</h3>
    <p class="sheet-note" id="cocinaNote"></p>
    <div class="menu-list" id="cocinaList"></div>
    <button class="overlay-btn secondary" id="btnCloseCocina">Cerrar</button>
  `, hideOverlay);
  const list = document.getElementById('cocinaList'), note = document.getElementById('cocinaNote');
  const defNote = () => {
    const d = cocinaData();
    return d.queue.length || d.ready.length ? `Se cocinan de a una, en orden. Caben ${COCINA_MAX} entre el horno y lo listo.`
      : 'Con lo que cosechas en el huerto (y harina de la tienda).';
  };
  let sig = '';
  const draw = msg => {
    list.innerHTML = cocinaListHtml();
    note.textContent = msg || defNote();
    sig = cocinaSig();
  };
  draw(aviso);
  document.getElementById('overlayCard').classList.add('sheet-tall');
  document.getElementById('overlayCard').onclick = e => {
    if (e.target.closest('[data-cook-take]')){ hideOverlay(); cocinaChore(rt, 'take'); return; }
    const cancel = e.target.closest('[data-cook-cancel]');
    if (cancel){
      const [i, id] = cancel.dataset.cookCancel.split(':');
      const d = cocinaData(), idx = +i;
      if (d.queue[idx] !== id){ draw(); return; }
      const r = recipeById(id);
      d.queue.splice(idx, 1);
      if (idx === 0) d.at = Date.now();      // el que seguía empieza ahora
      for (const [k, n] of Object.entries(r.needs)) bagAdd(k, n);
      saveState();
      draw(`Cancelado: ${recipeOut(r).name}. Los ingredientes volvieron a la mochila.`);
      return;
    }
    const b = e.target.closest('[data-cook]');
    if (!b || b.disabled) return;
    const r = recipeById(b.dataset.cook), d = cocinaData();
    if (!recipeCan(r) || cocinaFull(d)) return;
    for (const [id, n] of Object.entries(r.needs)) bagAdd(id, -n);
    const first = !d.queue.length;
    if (first) d.at = Date.now();
    d.queue.push(r.id);
    saveState();
    const ends = cocinaEnds(d);
    draw(`${recipeOut(r).emoji} ${recipeOut(r).name}: listo en ${fmtWait(ends[ends.length - 1] - Date.now())}`);
    /* La primera de la tanda: va a revolver la olla (se ve al cerrar). */
    if (first && !(walker.activity && walker.activity.kind === 'chore')) cocinaChore(rt, 'cook');
  };
  document.getElementById('btnCloseCocina').addEventListener('click', hideOverlay);
  clearInterval(cocinaTimer);
  cocinaTimer = setInterval(() => {
    if (!document.body.contains(list)){ clearInterval(cocinaTimer); return; }
    if (cocinaSig() !== sig){ const top = list.scrollTop; draw(note.textContent); list.scrollTop = top; return; }
    const now = Date.now();
    list.querySelectorAll('[data-cook-end]').forEach(el => { el.textContent = fmtWait(Math.max(0, +el.dataset.cookEnd - now)); });
    list.querySelectorAll('[data-cook-bar]').forEach(el => {
      el.style.width = Math.max(0, Math.min(100, (now - +el.dataset.cookBar) / +el.dataset.cookMs * 100)).toFixed(1) + '%';
    });
  }, 1000);
}

/* Sacar todo lo listo: a la despensa o a la mochila, con pop-up. Lo que
   sigue en la cola se sigue cocinando. */
function cocinaTake(){
  const d = cocinaData();
  if (!d.ready.length) return;
  const groups = cocinaReadyGroups(d);
  d.ready = [];
  let pantry = false, bag = false;
  const items = groups.map(({ r, times }) => {
    const o = recipeOut(r), n = r.out.n * times;
    if (r.out.pantry){ state.pantry[r.out.pantry] = foodStock(r.out.pantry) + n; pantry = true; }
    else { bagGain(r.out.bag, n); bag = true; }
    return { icon: o.emoji, text: o.name, amount: `+${n}` };
  });
  saveState(); render();
  if (typeof rewardSound === 'function') rewardSound();
  const notes = [];
  if (pantry) notes.push('Lo de la despensa está en la bandeja de Comer.');
  if (bag) notes.push(bagNote());
  if (d.queue.length) notes.push(`Sigue en el horno: ${d.queue.length}.`);
  showPopup({ icon: items[0].icon, title: '¡Salió del horno!', items, note: notes.join(' ') });
}

/* La mascota va a la cocina: a revolver la olla o a sacar lo listo. */
function cocinaChore(rt, kind){
  let done = false;
  const run = () => { if (!done){ done = true; if (kind === 'take') cocinaTake(); } };
  if (state.sleeping || displayStage() === 'egg' || (walker.activity && (walker.activity.kind === 'eat' || walker.activity.kind === 'vaccine'))){ run(); return; }
  const at = () => rt.x;
  rt.pending = run;
  const ok = startChore(rt, [
    { go: besideX(at, 6 * furniK()) }, faceX(at),
    kind === 'take'
      ? { anim: 'pet', ms: 900, fx: ['✨'], end: () => { rt.pending = null; run(); } }
      : { anim: 'clean', ms: 1800, fx: ['🍳', '🧂'], fxEvery: 700, end: () => { rt.pending = null; run(); } },
    { anim: kind === 'take' ? 'celebrate' : 'happy', ms: 800 },
  ]);
  if (!ok){ rt.pending = null; run(); }
}

/* El globito de lo listo, en pixel art como todo lo de la pantalla: ×N
   blanco mientras queda algo en el horno, dorado y con corona cuando ya
   salió todo. Una pieza por número (1 a COCINA_MAX) y por variante; se
   dibuja en la parte de arriba del canvas de la cocina y `pose` lo sube por
   encima, flotando de a un píxel. */
const PX_DIGITS = {
  1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'],
  3: ['##.', '..#', '.#.', '..#', '##.'], 4: ['#.#', '#.#', '###', '..#', '..#'],
  5: ['###', '#..', '##.', '..#', '##.'], 6: ['.##', '#..', '###', '#.#', '###'],
};
/* Un dibujo de letras (`.` vacío) con contorno alrededor de lo pintado. */
function pxMap(p, x0, y0, rows, pal, outline = FP.O){
  const at = (x, y) => y >= 0 && y < rows.length && x >= 0 && x < rows[y].length && rows[y][x] !== '.';
  const W = Math.max(...rows.map(r => r.length));
  if (outline) for (let y = -1; y <= rows.length; y++) for (let x = -1; x <= W; x++)
    if (!at(x, y) && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))) p.r(x0 + x, y0 + y, 1, 1, outline);
  for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++)
    if (at(x, y)) p.r(x0 + x, y0 + y, 1, 1, pal[rows[y][x]]);
}
const BUBBLE_ROWS = ['.WWWWWWWWW.', 'WWWWWWWWWWW', 'WWWWWWWWWWW', 'WWWWWWWWWWW', 'WWWWWWWWWWW', 'WWWWWWWWWWW', '.WWWWWWWWW.', '....WWW....', '.....W.....'];
function cocinaBubble(n, all){
  return { id: (all ? 'bubAll' : 'bub') + n,
    show: rt => rt.bub === n && rt.bubAll === all,
    pose: (rt, now, k) => ({ y: (15 + (Math.sin(now / 320) > 0 ? 1 : 0)) * k }),
    draw: p => {
      const ink = all ? '#5c3a00' : FP.O;
      if (all) pxMap(p, 6, 1, ['Y..Y..Y', 'YYYYYYY', 'DDDDDDD'], { Y: '#ffd25a', D: '#e0a31a' });
      pxMap(p, 4, 5, BUBBLE_ROWS, { W: all ? '#ffd25a' : '#ffffff' });
      p.r(5, 5, 9, 1, all ? '#ffe79a' : '#ffffff');
      pxMap(p, 6, 7, ['#.#', '.#.', '#.#'], { '#': ink }, null);
      pxMap(p, 10, 6, PX_DIGITS[n], { '#': ink }, null);
    } };
}
const COCINA_BUBBLES = [];
for (let n = 1; n <= COCINA_MAX; n++) COCINA_BUBBLES.push(cocinaBubble(n, false), cocinaBubble(n, true));

const COCINA_ART = { w: 20, h: 22,
  init: rt => { rt.cook = 'idle'; rt.ready = 0; rt.bub = 0; rt.bubAll = false; rt.steamAt = 0; rt.sparkAt = 0; rt.pending = null; rt.hitPart = null; },
  tick: (rt, now) => {
    const d = cocinaData();
    rt.cook = d.queue.length ? 'cooking' : 'idle';
    rt.ready = d.ready.length;
    rt.bub = Math.min(COCINA_MAX, rt.ready);
    rt.bubAll = rt.ready > 0 && !d.queue.length;
    const k = furniK();
    if (rt.cook === 'cooking' && now - rt.steamAt > 300){
      rt.steamAt = now;
      fxSpawn({ x: rtPx(rt, -3.5 + rnd(-2, 2)), y: 22 * k, vx: rnd(-4, 4), vy: rnd(10, 18), wob: 4, wobF: 2,
        life: 1400, color: 'rgba(240,240,250,.6)', layer: 'back' });
    }
    if (rt.ready && now - rt.sparkAt > 650){
      rt.sparkAt = now;
      fxSpawn({ x: rtPx(rt, 5 + rnd(-3, 3)), y: rnd(17, 22) * k, vy: 8, life: 700, shape: 'spark', color: '#fff6a8', layer: 'front' });
    }
  },
  cleanup: rt => { if (rt.pending){ const f = rt.pending; rt.pending = null; f(); } },
  /* Tocar el globito saca lo listo; tocar la cocina abre su hoja. */
  tap: rt => {
    const hit = rt.hitPart || ''; rt.hitPart = null;
    if (hit.startsWith('bub') && cocinaData().ready.length){
      if (walker.activity && walker.activity.kind === 'chore') cocinaTake();
      else cocinaChore(rt, 'take');
      return true;
    }
    openCocina(rt);
    return true;
  },
  parts: [
    { id: 'body', draw: p => {
      p.box(0, 6, 20, 16, '#e8e4ef', '#ffffff');
      p.r(1, 7, 18, 1, '#cfc8d6');
      p.r(3, 5, 5, 1, FP.dark); p.r(12, 5, 5, 1, FP.dark);
      p.r(3, 9, 2, 1, FP.red); p.r(9, 9, 2, 1, FP.red); p.r(15, 9, 2, 1, FP.red);
      p.r(5, 11, 10, 1, FP.metalD);
      p.box(3, 12, 14, 8, '#3a3448'); p.r(5, 14, 10, 4, '#26202e');
      p.r(2, 21, 2, 1, FP.O); p.r(16, 21, 2, 1, FP.O);
    } },
    { id: 'glow', show: rt => rt.cook === 'cooking', flicker: true, draw: p => {
      p.r(5, 14, 10, 4, '#ff8a3d'); p.r(6, 15, 8, 2, '#ffd25a'); p.r(7, 16, 1, 1, '#ffffff');
    } },
    { id: 'pot', show: rt => rt.cook === 'cooking', draw: p => {
      p.box(2, 1, 8, 5, FP.metal, '#d9dee8'); p.r(1, 2, 1, 1, FP.O); p.r(10, 2, 1, 1, FP.O); p.r(5, 0, 2, 1, FP.O);
    } },
    { id: 'dish', show: rt => rt.ready > 0, draw: p => {
      p.r(10, 5, 9, 1, FP.O); p.r(11, 4, 7, 1, '#ffffff');
      p.box(12, 0, 5, 5, '#ffb3cf', '#ffffff'); p.r(14, 0, 1, 1, FP.red);
    } },
    ...COCINA_BUBBLES,
  ],
  visits: [
    /* Juega a ser chef: revuelve, prueba y le gusta. */
    f => [
      { go: besideX(() => f.rt.x, 6 * f.k) }, faceX(() => f.rt.x),
      { anim: 'clean', ms: 2600, fx: ['🍳', '🧂', '🎶'], fxEvery: 800 },
      { anim: 'eat', ms: 900, fx: ['😋'] },
      S.happy(1000, { fx: ['⭐'] }),
    ],
  ],
  duos: [
    f => {
      const at = () => f.rt.x;
      return {
        a: [{ go: besideX(at, 6 * f.k) }, faceX(at), S.sync('in'), { anim: 'clean', ms: 2600, fx: ['🍳'], fxEvery: 900 }, S.sync('plato'), S.happy(800, { dir: 'partner' }), S.sync('end')],
        b: [{ go: f.x(-34) }, S.sync('in', { dir: 'partner' }), S.wait(2600, 'idle', { dir: 'partner', fx: ['🤤'], fxEvery: 1200 }), S.sync('plato'),
          { anim: 'eat', ms: 1200, fx: ['😋'] }, S.sync('end'), { anim: 'celebrate', ms: 800 }],
      };
    },
  ] };
FURNI_ART.cocina = COCINA_ART;

/* ---------- modo prueba ----------
   Botones del panel de prueba para no esperar horas: crecer el huerto,
   terminar lo que está en el horno o en la compostera, y llenar la mochila. */
function huertaDebugHtml(){
  return `<div class="debug-section"><h4>Huerta y cocina</h4>
    <div class="debug-grid" style="grid-template-columns:1fr 1fr">
      <button class="debug-btn" data-hdbg="grow1">🌱 Plantas +1 h</button>
      <button class="debug-btn" data-hdbg="ripe">🌱 Plantas listas</button>
      <button class="debug-btn" data-hdbg="water">💧 Regar ya</button>
      <button class="debug-btn" data-hdbg="cook1">🍳 Listo el que va</button>
      <button class="debug-btn" data-hdbg="cook">🍳 Horno: todo listo</button>
      <button class="debug-btn" data-hdbg="compost">♻️ Compost listo</button>
      <button class="debug-btn" data-hdbg="bag">🎒 +3 de todo</button>
      <button class="debug-btn" data-hdbg="dig">⛏️ Cavar sin esperar</button>
    </div></div>`;
}
function wireHuertaDebug(){
  document.querySelectorAll('[data-hdbg]').forEach(b => b.addEventListener('click', () => {
    const what = b.dataset.hdbg, d = huertoData();
    if (what === 'grow1' || what === 'ripe'){
      for (const p of d.plots) if (p.crop) p.grown = what === 'ripe' ? plotNeedMs(p) : Math.min(plotNeedMs(p), p.grown + 3600000);
    }
    if (what === 'water') huertoWater();
    if (what === 'cook1'){ const c = cocinaData(); if (c.queue.length) c.at = Date.now() - recipeMs(c.queue[0]); cocinaData(); }
    if (what === 'cook'){ const c = cocinaData(); c.at = Date.now() - c.queue.reduce((t, id) => t + recipeMs(id), 0); cocinaData(); }
    if (what === 'compost' && typeof compostData === 'function'){ const c = compostData(); c.items = c.items.map(() => 0); compostData(); }
    if (what === 'bag') for (const it of BAG_ITEMS) if (it.id !== 'fosil') bagAdd(it.id, 3);
    if (what === 'dig') objData('palita').lastDig = 0;
    saveState(); render();
    say('🧪 Listo', 1200);
  }));
}

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
