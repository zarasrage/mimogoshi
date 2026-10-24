/* ===================== Premios: ruleta y gacha =====================
   Dos formas de conseguir cosas que no son "comprar lo que elegiste":
   - La ruleta (🎡, en las píldoras de abajo): un giro gratis cada
     WHEEL_CYCLE_MS de tiempo REAL, y giros extra con tickets de ruleta
     (🎫, state.wheelTickets, salen en los regalos). Da (o quita) monedas,
     y da comida, medicina, felicidad o fichas para el gacha.
   - El gacha (pestaña "Gacha" de la tienda): una máquina de cápsulas que da
     un objeto de estilo al azar, de un catálogo propio que no se vende en la
     tienda, con rarezas. Se paga con monedas o con una ficha de la ruleta.

   Las monedas de la ruleta son un extra y no reemplazan a jugar: un giro deja
   en promedio menos que una partida buena, y sale una vez cada 12 horas.

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
    /* El pop-up sale cuando la cápsula termina de abrirse en la máquina. */
    const pago = conFicha ? { icon: '🎟️', text: 'Ficha', amount: '-1', neg: true }
      : { icon: '💰', text: 'Pagaste', amount: `-${GACHA_PRICE}`, neg: true };
    setTimeout(() => {
      if (r.item){
        const rar = rarityById(r.item.gacha);
        showPopup({ icon: gachaSwatch(r.item), title: `¡${rar.name}!`,
          items: [{ icon: gachaSwatch(r.item), text: r.item.name, amount: 'Nuevo' }, pago],
          note: `${GACHA_KIND_NAMES[r.item.kind]} · solo sale en el gacha. Ya lo tiene puesto.` });
      } else {
        showPopup({ icon: r.consuelo.emoji, title: '¡Colección completa!',
          items: [{ icon: r.consuelo.emoji, text: r.consuelo.name, amount: '+1' }, pago],
          note: 'Ya tienes todo lo de la máquina: te llevas un premio de consuelo.' });
      }
    }, 750);
  };
  const pay = document.getElementById('gachaPay');
  const tick = document.getElementById('gachaTicket');
  /* Con monedas es una compra: se confirma antes. Con ficha no se gasta
     plata, así que gira de una. */
  if (pay) pay.addEventListener('click', () => {
    if (state.coins < GACHA_PRICE){ tirar(false); return; }   // tirar() avisa lo que falta
    confirmBuy({ icon: '🎰', name: 'un giro del gacha', price: GACHA_PRICE }, () => tirar(false));
  });
  if (tick) tick.addEventListener('click', () => tirar(true));
}

/* ---------- Ruleta ---------- */

const WHEEL_CYCLE_MS = 12 * 60 * 60 * 1000;
const WHEEL_SPIN_MS = 4200;

/* Cada premio ocupa en la rueda un trozo proporcional a su probabilidad
   (`w`): lo que se ve es lo que hay. `give()` lo aplica y devuelve el texto.

   Las monedas van de varios tamaños (+2 a +100, mientras más grande más
   raro) y también hay trozos que QUITAN monedas (-2, -5, -10; nunca más de
   10): le dan suspenso al giro. Cuentas con los pesos de abajo (suman 120):
   se ganan monedas el 40% de las veces, se pierden el 15%, y en promedio un
   giro deja ~+6.4 monedas, algo menos que una partida buena (~7).
   Los trozos de monedas llevan el número escrito (`label`) en vez de un
   emoji: con 17 trozos no se distinguiría cuál es cuál. Van intercalados
   con el resto para que los que quitan no queden todos juntos, y cada trozo
   angosto va entre dos anchos: dos angostos seguidos encimaban sus emojis. */
const WHEEL_PRIZES = [
  { id: 'm5',       label: '+5',   w: 12, color: '#ffd25a', give: () => giveCoins(5) },
  { id: 'rica',     emoji: '🍗',   w: 9,  color: '#ffb36b', give: () => giveFood('rica', 2) },
  { id: 'm-2',      label: '-2',   w: 8,  color: '#7a6c96', give: () => giveCoins(-2), lose: true },
  { id: 'm10',      label: '+10',  w: 10, color: '#ffe27a', give: () => giveCoins(10) },
  { id: 'fichas3',  emoji: '💎',   w: 3,  color: '#b39cff', give: () => giveTickets(3), big: true },
  { id: 'ficha',    emoji: '🎟️',   w: 7,  color: '#8fd3ff', give: () => giveTickets(1) },
  { id: 'm2',       label: '+2',   w: 12, color: '#ffd25a', give: () => giveCoins(2) },
  { id: 'banquete', emoji: '🍱',   w: 5,  color: '#8fcf7f', give: () => giveFood('banquete', 1) },
  { id: 'feliz',    emoji: '⭐',   w: 8,  color: '#fff0a0', give: () => { state.happiness = clamp(state.happiness + 15); return '+15 de felicidad'; } },
  { id: 'm-5',      label: '-5',   w: 6,  color: '#6a5a8a', give: () => giveCoins(-5), lose: true },
  { id: 'm25',      label: '+25',  w: 7,  color: '#ffc93c', give: () => giveCoins(25) },
  { id: 'cafe',     emoji: '☕',   w: 8,  color: '#c99a6b', give: () => giveFood('cafe', 2) },
  { id: 'm50',      label: '+50',  w: 4,  color: '#ffb13d', give: () => giveCoins(50), big: true },
  { id: 'medicina', emoji: '💊',   w: 7,  color: '#ff7b8a', give: () => giveFood(MEDICINE.id, 1) },
  { id: 'm-10',     label: '-10',  w: 4,  color: '#4f416c', give: () => giveCoins(-10), lose: true },
  { id: 'especial', emoji: '🍰',   w: 7,  color: '#ff9ec4', give: () => giveFood('especial', 1) },
  { id: 'm100',     label: '+100', w: 3,  color: '#5ccf7a', give: () => giveCoins(100), big: true },
];

/* La fila del pop-up para un premio de la ruleta: el nombre a la izquierda y
   la cantidad a la derecha, como en el resto de los pop-ups. give() devuelve
   un texto tipo "+2 Café ☕"; acá se separa en cantidad y nombre. */
function wheelPrizeRow(p, texto){
  if (p.label) return { icon: '💰', text: 'Monedas', amount: p.label };
  if (p.id === 'feliz') return { icon: '😊', text: 'Felicidad', amount: '+15' };
  const m = texto.match(/^\+(\d+) (.+)$/);
  if (!m) return { icon: p.emoji, text: texto };
  const nombre = m[2].replace(/\s*[^\p{L}\p{N}\s]+$/u, '');
  return { icon: p.emoji, text: nombre[0].toUpperCase() + nombre.slice(1), amount: '+' + m[1] };
}

/* Suma o resta monedas. Quitar nunca deja el saldo bajo cero: si tienes
   menos de lo que dice el trozo, se pierde solo lo que hay. */
function giveCoins(n){
  if (n >= 0){
    state.coins += n;
    return `${coinsLabel('+' + n)} monedas`;
  }
  const quita = Math.min(-n, state.coins);
  state.coins -= quita;
  if (quita === 0) return `Te tocó ${n}… pero no tenías monedas 😅`;
  return quita < -n ? `Perdiste tus últimas ${quita} monedas 💸` : `Perdiste ${quita} monedas 💸`;
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

function wheelTickets(){ return state.wheelTickets || 0; }

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
    /* En el centro de su trozo, hacia afuera (en % de la rueda, así vale
       para cualquier tamaño). El número de las monedas va escrito a lo
       largo del radio, como en una ruleta de verdad: atravesado no cabe en
       los trozos angostos. En la mitad izquierda se da vuelta para que no
       quede de cabeza. */
    const midDeg = (s.a0 + s.a1) / 2, mid = midDeg * Math.PI / 180;
    const r = s.p.label ? 37 : s.p.w <= 5 ? 38 : 35;   // los angostos, más afuera: ahí el trozo es más ancho
    const left = 50 + r * Math.sin(mid), top = 50 - r * Math.cos(mid);
    const pos = `left:${left.toFixed(2)}%; top:${top.toFixed(2)}%`;
    if (!s.p.label) return `<span class="wheel-label" style="${pos}">${s.p.emoji}</span>`;
    const rot = midDeg <= 180 ? midDeg - 90 : midDeg + 90;
    return `<span class="wheel-label txt ${s.p.lose ? 'lose' : ''}" style="${pos}; transform:rotate(${rot.toFixed(1)}deg)">${s.p.label}</span>`;
  }).join('');
  return `
    <div class="wheel-stage">
      <div class="wheel-wrap">
        <div class="wheel-pointer"></div>
        <div class="wheel" id="wheel" style="background:conic-gradient(${grad}); transform:rotate(${wheelState().angle || 0}deg)">${labels}</div>
        <div class="wheel-hub">🎡</div>
      </div>
      <canvas class="wheel-pet" id="wheelPet"></canvas>
    </div>`;
}

/* Entrada a la ruleta arriba del menú de Juegos (antes era una píldora
   suelta abajo). Dice si hay giro gratis, cuánto falta o cuántos tickets. */
function wheelEntryHtml(){
  return `<button class="wheel-entry ${wheelReady() ? 'ready' : ''}" id="btnOpenWheel">${wheelEntryInner()}</button>`;
}
function wheelEntryInner(){
  const t = wheelTickets();
  const sub = wheelReady() ? '¡Tienes un giro gratis!'
    : `Gratis en ${megaClockLabel(wheelMsLeft(), true)}${t ? ` · ${t} ticket${t > 1 ? 's' : ''} 🎫` : ''}`;
  return `<span class="we-icon">🎡</span><span class="we-text"><b>Ruleta</b><small>${sub}</small></span><span class="we-go">›</span>`;
}

/* ---------- La mascota que gira la ruleta ----------
   Está parada al lado de la rueda: al girar toma vuelo, la empuja y se queda
   saltando de los nervios mientras da vueltas; con el premio celebra (o se
   pone triste si perdió monedas). Es un actor de juego (gameActor, de
   duo-juegos.js) con la especie de la mascota, así no toca su animación en
   la pieza. El canvas va en píxeles físicos y la escala es entera en
   píxeles físicos (ver "La regla de oro"); el movimiento también se redondea
   a píxeles físicos. */
const WHEEL_PET_SCALE = 2.6;   // objetivo en px CSS por píxel del arte (8 físicos en un 3x)
const wheelPet = { ga: null, mode: 'idle', t0: 0, raf: 0 };

function setWheelPetMode(mode){
  wheelPet.mode = mode;
  wheelPet.t0 = performance.now();
  if (!wheelPet.ga) return;
  if (mode === 'win' || mode === 'big') gaOnce(wheelPet.ga, 'celebrate');
}

function startWheelPet(mode){
  const c = document.getElementById('wheelPet');
  if (!c) return;
  const dpr = window.devicePixelRatio || 1;
  c.width = Math.round(c.clientWidth * dpr);
  c.height = Math.round(c.clientHeight * dpr);
  wheelPet.ga = gameActor(currentSpeciesId());
  setWheelPetMode(mode);
  cancelAnimationFrame(wheelPet.raf);
  wheelPet.raf = requestAnimationFrame(wheelPetLoop);
}

function wheelPetLoop(now){
  const c = document.getElementById('wheelPet');
  if (!c || !c.isConnected){ wheelPet.raf = 0; return; }   // se cerró la hoja
  const ga = wheelPet.ga, t = now - wheelPet.t0;
  let dx = 0, dy = 0;   // en px CSS: a la derecha (hacia la rueda) y hacia arriba
  switch (wheelPet.mode){
    case 'spin':
      if (t < 260){ gaLoop(ga, 'walk'); dx = -6 * (t / 260); }             // toma vuelo
      else if (t < 420){ gaLoop(ga, 'pet'); dx = -6 + 18 * ((t - 260) / 160); } // empujón
      else if (t < 900){ gaLoop(ga, 'happy'); dx = 12 * (1 - (t - 420) / 480); }
      else { gaLoop(ga, 'happy'); dy = Math.abs(Math.sin((t - 900) / 230)) * 7; } // saltitos de nervios
      break;
    case 'lose': gaLoop(ga, 'sad'); break;
    case 'big': if (t > 1400) gaLoop(ga, 'happy'), dy = Math.abs(Math.sin(t / 200)) * 5; break;
    default: gaLoop(ga, 'idle');
  }
  const dpr = window.devicePixelRatio || 1;
  const k = Math.max(1, Math.round(WHEEL_PET_SCALE * dpr));
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.save();
  ctx.translate(Math.round(dx * dpr), -Math.round(dy * dpr));
  drawSprite(ctx, 'adult', 'normal', 0, true, k, { w: c.width, h: c.height }, ga);
  ctx.restore();
  wheelPet.raf = requestAnimationFrame(wheelPetLoop);
}

/* Dos formas de girar, independientes: el giro gratis (uno cada 12 horas)
   y los tickets de ruleta (🎫). Usar un ticket NO toca el reloj del gratis:
   van aparte. Con el gratis disponible, ese va primero (es el botón
   principal) y el del ticket queda de secundario, así no se gasta un ticket
   sin querer. */
function openWheel(aviso, petMode = 'idle'){
  const ready = wheelReady();
  const tickets = wheelTickets();
  const nota = aviso ? escapeHtml(aviso)
    : ready ? 'Un giro gratis cada 12 horas'
    : tickets ? 'El gratis ya lo usaste, pero tienes tickets 🎫' : 'Ya giraste: vuelve más tarde';
  const ticketBtn = tickets
    ? `<button class="overlay-btn ${ready ? 'secondary' : ''}" id="btnSpinTicket">Usar ticket 🎫 (${tickets})</button>` : '';
  showOverlay(`
    <h3>🎡 Ruleta</h3>
    <p class="sheet-note" id="wheelNote">${nota}</p>
    ${wheelHtml()}
    <div class="overlay-actions">
      ${ready ? '<button class="overlay-btn" id="btnSpin">¡Girar gratis!</button>'
        : `<div class="mega-wait"><div class="mega-wait-row"><b>Próximo giro gratis</b><span>⏳ <span data-wheel-clock>${megaClockLabel(wheelMsLeft())}</span></span></div></div>`}
      ${ticketBtn}
      ${tickets ? '' : '<p class="wheel-hint">¿Más giros? Los regalos 🎁 a veces traen tickets de ruleta 🎫</p>'}
      <button class="overlay-btn secondary" id="btnCloseWheel">Volver a Juegos</button>
    </div>
  `, hideOverlay);
  /* La ruleta se abre desde Juegos: volver la deja donde estaba. */
  document.getElementById('btnCloseWheel').addEventListener('click', () => openGamesMenu());
  startWheelPet(petMode);
  const card = document.querySelector('#overlay .overlay-card');
  snapPixelIcons(card);
  card.addEventListener('animationend', () => snapPixelIcons(card), { once: true });
  const spin = document.getElementById('btnSpin');
  const spinT = document.getElementById('btnSpinTicket');
  if (spin) spin.addEventListener('click', () => spinWheel(false));
  if (spinT) spinT.addEventListener('click', () => spinWheel(true));
}

/* El premio se sortea y se aplica (y se guarda) al tocar Girar, no al
   terminar la animación: si se cierra la hoja a mitad del giro, el premio
   igual queda. La animación solo lo muestra. Con ticket, se gasta el ticket
   y el reloj del gratis no se toca. */
function spinWheel(conTicket){
  if (wheelSpinning) return;
  if (conTicket ? wheelTickets() <= 0 : !wheelReady()) return;
  const slices = wheelSlices();
  const tot = WHEEL_PRIZES.reduce((a, p) => a + p.w, 0);
  let r = Math.random() * tot, pick = slices[slices.length - 1];
  for (const s of slices){ if (r < s.p.w){ pick = s; break; } r -= s.p.w; }
  const texto = pick.p.give();
  const w = wheelState();
  if (conTicket) state.wheelTickets = wheelTickets() - 1;
  else w.last = Date.now();
  /* Para que el puntero (arriba) quede sobre el trozo, la rueda gira hasta
     que el centro del trozo (con un poco de azar adentro) llegue a 0°. */
  const dentro = pick.a0 + (pick.a1 - pick.a0) * (0.2 + Math.random() * 0.6);
  const base = Math.ceil((w.angle || 0) / 360) * 360;
  w.angle = base + 5 * 360 + (360 - dentro);
  saveState(); render();
  setWheelPetMode('spin');

  /* Mientras gira no se puede volver a girar (ni con el otro botón). */
  wheelSpinning = true;
  document.querySelectorAll('#btnSpin, #btnSpinTicket').forEach(b => { b.disabled = true; });
  const btn = document.getElementById(conTicket ? 'btnSpinTicket' : 'btnSpin');
  if (btn) btn.textContent = 'Girando…';
  const wheel = document.getElementById('wheel');
  wheel.style.transition = `transform ${WHEEL_SPIN_MS}ms cubic-bezier(.12,.7,.12,1)`;
  requestAnimationFrame(() => { wheel.style.transform = `rotate(${w.angle}deg)`; });
  const ticks = setInterval(() => tone({ freq: 1200, durationMs: 18, type: 'square', vol: 0.03 }), 140);
  setTimeout(() => {
    clearInterval(ticks);
    wheelSpinning = false;
    if (!document.getElementById('wheel')) return;   // cerraron la hoja: el premio ya está dado
    const pago = conTicket ? [{ icon: '🎫', text: 'Ticket de ruleta', amount: '-1', neg: true }] : [];
    if (pick.p.lose){
      openWheel(`¡Uy! ${texto}`, 'lose');
      showPopup({ tone: 'lose', icon: '💸', title: '¡Uy!', ok: 'Ni modo',
        items: [{ icon: '💰', text: texto }, ...pago] });
      return;
    }
    if (pick.p.big) triggerPetAction('celebrate');
    openWheel(`${pick.p.big ? '¡Premio mayor! ' : '¡Ganaste! '}${texto}`, pick.p.big ? 'big' : 'win');
    const icono = pick.p.emoji || '💰';
    showPopup({ icon: icono, title: pick.p.big ? '¡Premio mayor!' : '¡Ganaste!', items: [wheelPrizeRow(pick.p, texto), ...pago] });
  }, WHEEL_SPIN_MS + 120);
}

let wheelSpinning = false;

/* Reloj de la ruleta en vivo, como los del Megajuego: un solo intervalo que
   no hace nada si no hay ninguno a la vista. También refresca la entrada a
   la ruleta del menú de Juegos (pasan las 12 horas con el menú abierto). */
if (typeof window !== 'undefined') setInterval(() => {
  if (!state) return;
  const entry = document.getElementById('btnOpenWheel');
  if (entry) entry.innerHTML = wheelEntryInner();
  if (entry) entry.classList.toggle('ready', wheelReady());
  const clocks = document.querySelectorAll('[data-wheel-clock]');
  if (!clocks.length) return;
  const ms = wheelMsLeft();
  if (ms <= 0){ if (!wheelSpinning) openWheel(); return; }   // se cumplió con la hoja abierta: aparece el botón
  clocks.forEach(el => { el.textContent = megaClockLabel(ms); });
}, 1000);
