/* ===================== Premios: ruleta y gacha =====================
   Dos formas de conseguir cosas que no son "comprar lo que elegiste":
   - La ruleta (🎡, en las píldoras de abajo): un giro gratis cada
     WHEEL_CYCLE_MS de tiempo REAL. Da monedas, comida, medicina, felicidad
     o fichas para el gacha.
   - El gacha (pestaña "Gacha" de la tienda): una máquina de cápsulas que da
     un objeto de estilo al azar, de un catálogo propio que no se vende en la
     tienda, con rarezas. Se paga con monedas o con una ficha de la ruleta.

   Las monedas de la ruleta son un extra y no reemplazan a jugar: lo normal
   (25) son unas cuatro partidas buenas, y sale una vez cada 12 horas.

   Se carga después de juegos.js y antes de muebles.js (ver index.html). El
   push a STYLE_ITEMS va al cargar, como el de los muebles; todo lo demás se
   usa recién en tiempo de juego. */

/* ---------- Gacha ---------- */

const GACHA_PRICE = 40;

/* Rarezas: probabilidad de cada una al girar (suman 1) y su color. La
   probabilidad está a la vista en la máquina: el jugador sabe a qué juega. */
const GACHA_RARITIES = [
  { id: 'comun',      name: 'Común',      p: 0.60, color: '#9fb4c8' },
  { id: 'raro',       name: 'Raro',       p: 0.28, color: '#4fa3ff' },
  { id: 'epico',      name: 'Épico',      p: 0.10, color: '#b45cff' },
  { id: 'legendario', name: 'Legendario', p: 0.02, color: '#ffb52e' },
];
function rarityById(id){ return GACHA_RARITIES.find(r => r.id === id); }

/* Catálogo exclusivo: no se vende en la tienda (styleRows('shop') lo
   salta), solo sale de la máquina. Son los mismos cuatro tipos de Estilo de
   siempre, así Personalizar los pone y los saca igual que al resto. Ids con
   prefijo g_ para que nunca choquen con los de la tienda (ver CLAUDE.md, el
   choque del radiocasete con el adorno "radio"). Emojis de Unicode 11 o
   anterior. `price: null`: freshStyle() regala de fábrica lo que tiene
   price 0, y esto no tiene precio. */
const GACHA_ITEMS = [
  { id:'g_girasol',   kind:'hat',  gacha:'comun', name:'Girasol',      emoji:'🌻' },
  { id:'g_hongo',     kind:'hat',  gacha:'comun', name:'Hongo',        emoji:'🍄' },
  { id:'g_audif',     kind:'hat',  gacha:'comun', name:'Audífonos',    emoji:'🎧' },
  { id:'g_banderin',  kind:'deco', gacha:'comun', name:'Banderín',     emoji:'🎏', slot:'pared' },
  { id:'g_calabaza',  kind:'deco', gacha:'comun', name:'Calabaza',     emoji:'🎃', slot:'izq' },
  { id:'g_pato',      kind:'deco', gacha:'comun', name:'Patito',       emoji:'🦆', slot:'der' },
  { id:'g_futbol',    kind:'deco', gacha:'comun', name:'Pelotita',     emoji:'⚽', slot:'der' },

  { id:'g_cerezas',   kind:'hat',  gacha:'raro',  name:'Cerezas',      emoji:'🍒' },
  { id:'g_estrella',  kind:'hat',  gacha:'raro',  name:'Estrellita',   emoji:'🌟' },
  { id:'g_luna',      kind:'deco', gacha:'raro',  name:'Luna',         emoji:'🌙', slot:'pared' },
  { id:'g_arbol',     kind:'deco', gacha:'raro',  name:'Árbol',        emoji:'🌳', slot:'izq' },
  { id:'g_robot',     kind:'deco', gacha:'raro',  name:'Robot',        emoji:'🤖', slot:'der' },
  { id:'g_sakura',    kind:'shell', gacha:'raro', name:'Sakura',       colors:['#ffe3ef', '#ffb3cf', '#e47aa5'] },

  { id:'g_unicornio', kind:'hat',  gacha:'epico', name:'Unicornio',    emoji:'🦄' },
  { id:'g_galaxia',   kind:'deco', gacha:'epico', name:'Vía láctea',   emoji:'🌌', slot:'pared' },
  { id:'g_dragon',    kind:'deco', gacha:'epico', name:'Dragón',       emoji:'🐉', slot:'der' },
  { id:'g_cosmos',    kind:'shell', gacha:'epico', name:'Cosmos',      colors:['#7b6cff', '#3b2a8f', '#120b3a'] },
  { id:'g_neon',      kind:'screen', gacha:'epico', name:'Neón',       lcd:['#16061f', '#33104a', '255,110,230', '#0b0310'] },

  { id:'g_diamante',  kind:'hat',  gacha:'legendario', name:'Diamante', emoji:'💎' },
  { id:'g_arcoiris',  kind:'shell', gacha:'legendario', name:'Prisma',  colors:['#ff9a9e', '#fad06a', '#7fd6ff'] },
  { id:'g_dorada',    kind:'screen', gacha:'legendario', name:'Dorada', lcd:['#1a1404', '#3d2e08', '255,222,120', '#100c02'] },
].map(it => ({ ...it, price: null }));
STYLE_ITEMS.push(...GACHA_ITEMS);

/* Premio de consuelo cuando ya tienes todo el catálogo: algo útil igual. */
const GACHA_CONSOLATION = 'banquete';

function gachaTickets(){ return state.gachaTickets || 0; }

/* Sortea una rareza y, dentro de ella, algo que todavía no tengas. Si ya
   tienes todo lo de esa rareza, prueba con las más comunes primero y
   después con las más raras: nunca da repetidos. null = ya tienes todo. */
function gachaRoll(){
  let r = Math.random(), rar = GACHA_RARITIES[GACHA_RARITIES.length - 1];
  for (const x of GACHA_RARITIES){ if (r < x.p){ rar = x; break; } r -= x.p; }
  const i = GACHA_RARITIES.indexOf(rar);
  const orden = [rar, ...GACHA_RARITIES.slice(0, i).reverse(), ...GACHA_RARITIES.slice(i + 1)];
  for (const x of orden){
    const libres = GACHA_ITEMS.filter(it => it.gacha === x.id && !state.style.owned[it.id]);
    if (libres.length) return libres[Math.floor(Math.random() * libres.length)];
  }
  return null;
}

/* Gira la máquina pagando con ficha (si hay) o con monedas. Devuelve
   { item } / { consuelo } o { error }. Lo que sale queda puesto de una, igual
   que lo que se compra en la tienda. */
function gachaPull(conFicha){
  if (conFicha){
    if (gachaTickets() <= 0) return { error: 'No te quedan fichas: salen en la ruleta 🎡' };
    state.gachaTickets -= 1;
  } else {
    if (state.coins < GACHA_PRICE) return { error: `Te faltan ${coinsLabel(GACHA_PRICE - state.coins)} para girar` };
    state.coins -= GACHA_PRICE;
  }
  const item = gachaRoll();
  if (!item){
    state.pantry[GACHA_CONSOLATION] = foodStock(GACHA_CONSOLATION) + 1;
    saveState(); render();
    return { consuelo: foodById(GACHA_CONSOLATION) };
  }
  state.style.owned[item.id] = true;
  if (!isStyleEquipped(item)) toggleStyleItem(item);
  saveState(); applyStyle(); render();
  return { item };
}

/* La muestra de un objeto: el emoji, o el color (carcasa y pantalla). */
function gachaSwatch(it){
  if (it.kind === 'shell') return `<span class="gacha-swatch" style="background:linear-gradient(150deg, ${it.colors.join(', ')})"></span>`;
  if (it.kind === 'screen'){
    const [bg, hi, lit] = it.lcd;
    return `<span class="gacha-swatch" style="background:radial-gradient(120% 120% at 50% 0%, ${hi}, ${bg} 70%); color:rgb(${lit})">▪▪</span>`;
  }
  return `<span class="gacha-swatch emoji">${it.emoji}</span>`;
}

const GACHA_KIND_NAMES = { hat: 'Accesorio', deco: 'Decoración', shell: 'Carcasa', screen: 'Pantalla' };

/* Contenido de la pestaña Gacha (la arma openShop). `res` es lo que salió
   del último giro, para mostrarlo dentro de la máquina. */
function gachaTabHtml(res){
  const tengo = GACHA_ITEMS.filter(it => state.style.owned[it.id]).length;
  const odds = GACHA_RARITIES.map(r => `<span style="color:${r.color}">${r.name} ${Math.round(r.p * 100)}%</span>`).join(' · ');
  let hueco = '<div class="gacha-capsule idle"><span class="cap-top"></span><span class="cap-bot"></span></div>';
  if (res && res.item){
    const rar = rarityById(res.item.gacha);
    hueco = `
      <div class="gacha-capsule opening" style="--rar:${rar.color}"><span class="cap-top"></span><span class="cap-bot"></span></div>
      <div class="gacha-prize" style="--rar:${rar.color}">
        ${gachaSwatch(res.item)}
        <b>${escapeHtml(res.item.name)}</b>
        <small>${rar.name} · ${GACHA_KIND_NAMES[res.item.kind]} · ¡ya lo tiene puesto!</small>
      </div>`;
  } else if (res && res.consuelo){
    hueco = `
      <div class="gacha-capsule opening"><span class="cap-top"></span><span class="cap-bot"></span></div>
      <div class="gacha-prize" style="--rar:#9fb4c8">
        <span class="gacha-swatch emoji">${res.consuelo.emoji}</span>
        <b>¡Ya tienes toda la colección!</b>
        <small>Te llevas un ${escapeHtml(res.consuelo.name)} de consuelo</small>
      </div>`;
  }
  const fichas = gachaTickets();
  return `
    <div class="gacha-machine">
      <div class="gacha-window">${hueco}</div>
      <p class="gacha-odds">${odds}</p>
      <p class="gacha-col">Colección exclusiva: <b>${tengo}/${GACHA_ITEMS.length}</b> · nunca repite</p>
      <div class="gacha-actions">
        <button class="overlay-btn" id="gachaPay">Girar · ${coinsLabel(GACHA_PRICE)}</button>
        <button class="overlay-btn secondary" id="gachaTicket" ${fichas ? '' : 'disabled'}>Usar ficha 🎟️ (${fichas})</button>
      </div>
    </div>`;
}

/* Ata los botones de la pestaña. `reopen(msg, res)` vuelve a armar la
   tienda en la pestaña Gacha (la pasa openShop). */
function wireGachaTab(reopen){
  const tirar = (conFicha) => {
    const r = gachaPull(conFicha);
    if (r.error){ reopen(r.error); return; }
    tone({ freq: 659.25, durationMs: 90, type: 'triangle', vol: 0.08 });
    reopen(r.item ? `¡Salió ${r.item.name}! Cámbialo cuando quieras en Personalizar` : 'Ya tienes todo lo de la máquina', r);
  };
  const pay = document.getElementById('gachaPay');
  const tick = document.getElementById('gachaTicket');
  if (pay) pay.addEventListener('click', () => tirar(false));
  if (tick) tick.addEventListener('click', () => tirar(true));
}

/* ---------- Ruleta ---------- */

const WHEEL_CYCLE_MS = 12 * 60 * 60 * 1000;
const WHEEL_SPIN_MS = 4200;

/* Cada premio ocupa en la rueda un trozo proporcional a su probabilidad
   (`w`): lo que se ve es lo que hay. `give()` lo aplica y devuelve el texto. */
const WHEEL_PRIZES = [
  { id: 'monedas',  emoji: '💰', w: 16, color: '#ffd25a', give: () => giveCoins(25) },
  { id: 'rica',     emoji: '🍗', w: 14, color: '#ffb36b', give: () => giveFood('rica', 2) },
  { id: 'feliz',    emoji: '⭐', w: 14, color: '#fff0a0', give: () => { state.happiness = clamp(state.happiness + 15); return '+15 de felicidad'; } },
  { id: 'cafe',     emoji: '☕', w: 12, color: '#c99a6b', give: () => giveFood('cafe', 2) },
  { id: 'especial', emoji: '🍰', w: 14, color: '#ff9ec4', give: () => giveFood('especial', 1) },
  { id: 'ficha',    emoji: '🎟️', w: 12, color: '#8fd3ff', give: () => giveTickets(1) },
  { id: 'medicina', emoji: '💊', w: 12, color: '#ff7b8a', give: () => giveFood(MEDICINE.id, 1) },
  { id: 'banquete', emoji: '🍱', w: 8,  color: '#8fcf7f', give: () => giveFood('banquete', 1) },
  { id: 'fichas3',  emoji: '💎', w: 4,  color: '#b39cff', give: () => giveTickets(3), big: true },
  { id: 'monedas+', emoji: '🤑', w: 3,  color: '#5ccf7a', give: () => giveCoins(100), big: true },
];

function giveCoins(n){
  state.coins += n;
  return `${coinsLabel('+' + n)} monedas`;
}

function giveFood(id, n){
  state.pantry[id] = foodStock(id) + n;
  const f = id === MEDICINE.id ? MEDICINE : foodById(id);
  return `+${n} ${f.name} ${f.emoji}`;
}
function giveTickets(n){
  state.gachaTickets = gachaTickets() + n;
  return `+${n} ficha${n > 1 ? 's' : ''} para el gacha 🎟️`;
}

function wheelState(){
  if (!state.wheel || typeof state.wheel !== 'object') state.wheel = { last: null, angle: 0 };
  return state.wheel;
}

/* ms hasta el próximo giro; 0 = se puede girar ya. Un reloj que vuelve
   atrás (last en el futuro) deja girar, igual que el Megajuego. */
function wheelMsLeft(){
  const w = wheelState();
  if (!w.last) return 0;
  const el = Date.now() - w.last;
  if (el < 0) return 0;
  return Math.max(0, WHEEL_CYCLE_MS - el);
}

function wheelReady(){ return wheelMsLeft() === 0; }

/* Ángulos de cada trozo, en grados desde arriba en sentido horario. */
function wheelSlices(){
  const tot = WHEEL_PRIZES.reduce((a, p) => a + p.w, 0);
  let acc = 0;
  return WHEEL_PRIZES.map(p => { const a0 = acc / tot * 360; acc += p.w; return { p, a0, a1: acc / tot * 360 }; });
}

function wheelHtml(){
  const slices = wheelSlices();
  const grad = slices.map(s => `${s.p.color} ${s.a0.toFixed(2)}deg ${s.a1.toFixed(2)}deg`).join(', ');
  const labels = slices.map(s => {
    /* El emoji en el centro de su trozo, al 36% del radio hacia afuera
       (en % de la rueda, así vale para cualquier tamaño). */
    const mid = (s.a0 + s.a1) / 2 * Math.PI / 180;
    const left = 50 + 36 * Math.sin(mid), top = 50 - 36 * Math.cos(mid);
    return `<span class="wheel-label" style="left:${left.toFixed(2)}%; top:${top.toFixed(2)}%">${s.p.emoji}</span>`;
  }).join('');
  return `
    <div class="wheel-wrap">
      <div class="wheel-pointer"></div>
      <div class="wheel" id="wheel" style="background:conic-gradient(${grad}); transform:rotate(${wheelState().angle || 0}deg)">${labels}</div>
      <div class="wheel-hub">🎡</div>
    </div>`;
}

function openWheel(aviso){
  const ready = wheelReady();
  showOverlay(`
    <h3>🎡 Ruleta</h3>
    <p class="sheet-note" id="wheelNote">${aviso ? escapeHtml(aviso) : ready ? 'Un giro gratis cada 12 horas' : 'Ya giraste: vuelve más tarde'}</p>
    ${wheelHtml()}
    <div class="overlay-actions">
      ${ready ? '<button class="overlay-btn" id="btnSpin">¡Girar!</button>'
        : `<div class="mega-wait"><div class="mega-wait-row"><b>Próximo giro</b><span>⏳ <span data-wheel-clock>${megaClockLabel(wheelMsLeft())}</span></span></div></div>`}
      <button class="overlay-btn secondary" id="btnCloseWheel">Cerrar</button>
    </div>
  `, hideOverlay);
  document.getElementById('btnCloseWheel').addEventListener('click', hideOverlay);
  const spin = document.getElementById('btnSpin');
  if (spin) spin.addEventListener('click', () => spinWheel(spin));
}

/* El premio se sortea y se aplica (y se guarda) al tocar Girar, no al
   terminar la animación: si se cierra la hoja a mitad del giro, el premio
   igual queda. La animación solo lo muestra. */
function spinWheel(btn){
  if (!wheelReady()) return;
  const slices = wheelSlices();
  const tot = WHEEL_PRIZES.reduce((a, p) => a + p.w, 0);
  let r = Math.random() * tot, pick = slices[slices.length - 1];
  for (const s of slices){ if (r < s.p.w){ pick = s; break; } r -= s.p.w; }
  const texto = pick.p.give();
  const w = wheelState();
  w.last = Date.now();
  /* Para que el puntero (arriba) quede sobre el trozo, la rueda gira hasta
     que el centro del trozo (con un poco de azar adentro) llegue a 0°. */
  const dentro = pick.a0 + (pick.a1 - pick.a0) * (0.2 + Math.random() * 0.6);
  const base = Math.ceil((w.angle || 0) / 360) * 360;
  w.angle = base + 5 * 360 + (360 - dentro);
  saveState(); render(); updateWheelPill();

  btn.disabled = true;
  btn.textContent = 'Girando…';
  const wheel = document.getElementById('wheel');
  wheel.style.transition = `transform ${WHEEL_SPIN_MS}ms cubic-bezier(.12,.7,.12,1)`;
  requestAnimationFrame(() => { wheel.style.transform = `rotate(${w.angle}deg)`; });
  const ticks = setInterval(() => tone({ freq: 1200, durationMs: 18, type: 'square', vol: 0.03 }), 140);
  setTimeout(() => {
    clearInterval(ticks);
    if (!document.getElementById('wheel')) return;   // cerraron la hoja: el premio ya está dado
    tone({ freq: 880, durationMs: 160, type: 'triangle', vol: 0.09 });
    tone({ freq: 1318.51, durationMs: 220, type: 'triangle', vol: 0.08, at: (audioNow() || 0) + 0.12 });
    if (pick.p.big) triggerPetAction('celebrate');
    openWheel(`${pick.p.big ? '¡Premio mayor! ' : '¡Ganaste! '}${texto}`);
  }, WHEEL_SPIN_MS + 120);
}

/* La píldora de la ruleta late cuando hay un giro disponible. */
function updateWheelPill(){
  const pill = document.getElementById('btnWheel');
  if (!pill || !state) return;
  const ready = wheelReady();
  if (pill._ready !== ready){ pill._ready = ready; pill.classList.toggle('ready', ready); }
}

/* Reloj de la ruleta en vivo, como los del Megajuego: un solo intervalo que
   no hace nada si no hay ninguno a la vista. También refresca la píldora
   (pasan las 12 horas con la app abierta). */
if (typeof window !== 'undefined') setInterval(() => {
  if (!state) return;
  updateWheelPill();
  const clocks = document.querySelectorAll('[data-wheel-clock]');
  if (!clocks.length) return;
  const ms = wheelMsLeft();
  if (ms <= 0){ openWheel(); return; }   // se cumplió con la hoja abierta: aparece el botón
  clocks.forEach(el => { el.textContent = megaClockLabel(ms); });
}, 1000);
