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
const WHEEL_PULL_MS = 600;    // la mascota salta, agarra el borde y tira: recién ahí arranca
const WHEEL_SPIN_MS = 4800;
const WHEEL_TURNS = 5;

/* Cada premio ocupa en la rueda un trozo proporcional a su probabilidad
   (`w`): lo que se ve es lo que hay. `give()` lo aplica y devuelve el texto.

   Las monedas van en diez tamaños (+1, +2, +3, +5, +7, +10, +15, +25, +50
   y +100: mientras más grande, más raro) y también hay trozos que QUITAN
   monedas (-2, -5, -10; nunca más de 10): le dan suspenso al giro. Cuentas
   con los pesos de abajo (suman 113): se ganan monedas el 55% de las veces,
   se pierden el 11%, y en promedio un giro deja ~+5.7 monedas, algo menos
   que una partida buena (~7). Ningún trozo pesa menos de 2 (6.4°): ahí
   todavía cabe el número escrito a lo largo del radio, y los emojis van
   en trozos de 3 o más. Van intercalados para que los que quitan no queden
   juntos, ni dos angostos seguidos. */
const WHEEL_PRIZES = [
  { id: 'm5',       label: '+5',   w: 9,  color: '#ffcd57', give: () => giveCoins(5) },
  { id: 'rica',     emoji: '🍗',   w: 7,  color: '#ff8fab', give: () => giveFood('rica', 2) },
  { id: 'm1',       label: '+1',   w: 10, color: '#ffeaa6', give: () => giveCoins(1) },
  { id: 'm-2',      label: '-2',   w: 6,  color: '#5d4b8a', give: () => giveCoins(-2), lose: true },
  { id: 'm15',      label: '+15',  w: 4,  color: '#ffa62b', give: () => giveCoins(15) },
  { id: 'cafe',     emoji: '☕',   w: 6,  color: '#b9a0ff', give: () => giveFood('cafe', 2) },
  { id: 'm3',       label: '+3',   w: 9,  color: '#ffdc78', give: () => giveCoins(3) },
  { id: 'fichas3',  emoji: '💎',   w: 3,  color: '#6fd2ff', give: () => giveTickets(3), big: true },
  { id: 'm7',       label: '+7',   w: 7,  color: '#ffc23d', give: () => giveCoins(7) },
  { id: 'feliz',    emoji: '😊',   w: 6,  color: '#ff9ed8', give: () => { state.happiness = clamp(state.happiness + 15); return '+15 de felicidad'; } },
  { id: 'm-5',      label: '-5',   w: 4,  color: '#4b3b76', give: () => giveCoins(-5), lose: true },
  { id: 'm2',       label: '+2',   w: 9,  color: '#ffe38f', give: () => giveCoins(2) },
  { id: 'banquete', emoji: '🍱',   w: 3,  color: '#8fe0a0', give: () => giveFood('banquete', 1) },
  { id: 'm10',      label: '+10',  w: 6,  color: '#ffb52e', give: () => giveCoins(10) },
  { id: 'm100',     label: '+100', w: 2,  color: '#2fc985', give: () => giveCoins(100), big: true },
  { id: 'medicina', emoji: '💊',   w: 5,  color: '#ff7b7b', give: () => giveFood(MEDICINE.id, 1) },
  { id: 'm25',      label: '+25',  w: 3,  color: '#ff9330', give: () => giveCoins(25) },
  { id: 'ficha',    emoji: '🎟️',   w: 5,  color: '#86c8ff', give: () => giveTickets(1) },
  { id: 'm-10',     label: '-10',  w: 2,  color: '#3a2c60', give: () => giveCoins(-10), lose: true },
  { id: 'especial', emoji: '🍰',   w: 4,  color: '#ffb8d4', give: () => giveFood('especial', 1) },
  { id: 'm50',      label: '+50',  w: 3,  color: '#ff7a3d', give: () => giveCoins(50), big: true },
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
    return `${coinsLabel('+' + n)} moneda${n === 1 ? '' : 's'}`;
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

/* Un punto del borde a `r` del centro (100, 100), con el ángulo desde arriba
   en sentido horario: las coordenadas del SVG de la rueda. */
function wheelPt(deg, r){
  const a = deg * Math.PI / 180;
  return [(100 + r * Math.sin(a)).toFixed(2), (100 - r * Math.cos(a)).toFixed(2)];
}

/* La rueda es un SVG (viewBox 200x200, todo en esas unidades, así se ve
   igual de nítida en cualquier tamaño) que gira entera. Los trozos son
   arcos de verdad con una línea blanca entre ellos y un clavito en cada
   borde (los que hacen sonar la lengüeta). El número de las monedas va a lo
   largo del radio y los emojis paraditos hacia afuera, los dos con el
   tamaño que deja el ancho de su trozo: antes iban a un tamaño fijo y en
   los trozos angostos se salían. `winId` ilumina el trozo que salió.

   Los números se escriben para que se lean de izquierda a derecha con la
   rueda girada en `rot` (el ángulo en que quedó): los de la mitad izquierda
   van del borde hacia el centro y los de la derecha al revés. Con un solo
   sentido para todos, los de abajo quedaban de cabeza. Mientras gira no
   importa; al detenerse, la hoja se vuelve a armar con el ángulo final. */
function wheelSvg(winId, rot = 0){
  const arc = (s, r) => {
    const [x0, y0] = wheelPt(s.a0, r), [x1, y1] = wheelPt(s.a1, r);
    return `M100 100 L${x0} ${y0} A${r} ${r} 0 ${s.a1 - s.a0 > 180 ? 1 : 0} 1 ${x1} ${y1}Z`;
  };
  const slices = wheelSlices();
  const trozos = slices.map(s => `<path d="${arc(s, 100)}" fill="${s.p.color}"/>`).join('');
  const labels = slices.map(s => {
    const mid = (s.a0 + s.a1) / 2, ancho = rad => rad * (s.a1 - s.a0) * Math.PI / 180;
    if (s.p.label){
      const fs = Math.min(13, Math.max(8.5, ancho(78) * 0.86));
      const cls = s.p.lose ? 'lose' : s.p.big ? 'big' : '';
      const enPantalla = ((mid + rot) % 360 + 360) % 360;
      const izq = enPantalla > 180;
      return `<g transform="rotate(${mid.toFixed(2)} 100 100)"><text class="wl ${cls}" transform="translate(100 9) rotate(${izq ? 90 : -90})" text-anchor="${izq ? 'start' : 'end'}" dominant-baseline="central" font-size="${fs.toFixed(1)}">${s.p.label}</text></g>`;
    }
    const r = s.p.w <= 3 ? 80 : 74;
    const fs = Math.min(17, ancho(r) * 0.8);
    return `<g transform="rotate(${mid.toFixed(2)} 100 100)"><text class="we" x="100" y="${100 - r}" text-anchor="middle" dominant-baseline="central" font-size="${fs.toFixed(1)}">${s.p.emoji}</text></g>`;
  }).join('');
  const clavos = slices.map(s => { const [x, y] = wheelPt(s.a0, 95); return `<circle cx="${x}" cy="${y}" r="1.9"/>`; }).join('');
  const lineas = slices.map(s => { const [x, y] = wheelPt(s.a0, 100); return `<line x1="100" y1="100" x2="${x}" y2="${y}"/>`; }).join('');
  const win = slices.find(s => s.p.id === winId);
  return `<svg viewBox="0 0 200 200" aria-hidden="true">
    <defs><radialGradient id="wheelShade"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></radialGradient></defs>
    ${trozos}
    ${win ? `<path class="wheel-win" d="${arc(win, 100)}"/>` : ''}
    <g class="wheel-lines">${lineas}</g>
    <circle cx="100" cy="100" r="100" fill="url(#wheelShade)"/>
    ${labels}
    <g class="wheel-pegs">${clavos}</g>
  </svg>`;
}

/* El aro de afuera no gira: dorado, con ampolletas que pestañean (más rápido
   mientras gira). Encima, la lengüeta roja, que salta al pasar cada clavo
   (la mueve wheelSpinLoop). */
function wheelRimSvg(){
  const n = 20;
  const bulbs = Array.from({ length: n }, (_, i) => {
    const a = i / n * 2 * Math.PI;
    return `<circle class="bulb ${i % 2 ? 'b' : 'a'}" cx="${(110 + 105 * Math.sin(a)).toFixed(2)}" cy="${(110 - 105 * Math.cos(a)).toFixed(2)}" r="2.6"/>`;
  }).join('');
  return `<svg class="wheel-rim" viewBox="0 0 220 220" aria-hidden="true">
    <defs><linearGradient id="wheelGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset=".45" stop-color="#ffc23d"/><stop offset="1" stop-color="#c77700"/></linearGradient></defs>
    <circle cx="110" cy="110" r="110" fill="url(#wheelGold)"/>
    <circle cx="110" cy="110" r="101.5" fill="#2a1d4a"/>
    ${bulbs}
  </svg>`;
}

function wheelHtml(winId){
  return `
    <div class="wheel-stage">
      <div class="wheel-wrap" id="wheelWrap">
        ${wheelRimSvg()}
        <div class="wheel" id="wheel" style="transform:rotate(${wheelState().angle || 0}deg)">${wheelSvg(winId, wheelState().angle || 0)}</div>
        <div class="wheel-hub"></div>
        <svg class="wheel-pointer" id="wheelPointer" viewBox="0 0 30 40" aria-hidden="true">
          <path d="M15 38 L4 13 A11.5 11.5 0 1 1 26 13 Z" fill="#ff4d6d" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>
          <circle cx="15" cy="11" r="4" fill="#fff"/>
        </svg>
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
   Está parada a la derecha de la rueda, mirándola. Al girar: se agacha,
   salta hasta el borde, lo agarra arriba y tira hacia abajo con todo su
   peso (la rueda arranca justo ahí, WHEEL_PULL_MS después de tocar Girar);
   cae, trastabilla para atrás y se queda mirando: salta de los nervios al
   ritmo de la rueda y, cuando la rueda va frenando, se queda quieta,
   inclinada hacia adelante. Con el premio celebra, con un premio mayor
   salta de alegría y si perdió monedas se pone triste.

   Es un actor de juego (gameActor, de duo-juegos.js) con la especie de la
   mascota, así no toca su animación en la pieza. El canvas va en píxeles
   físicos, la escala es entera en píxeles físicos (ver "La regla de oro"),
   darla vuelta es un scale(-1, 1) entero y el movimiento se redondea a
   píxeles físicos. */
const WHEEL_PET_SCALE = 2.3;   // objetivo en px CSS por píxel del arte (7 físicos en un 3x)
const wheelPet = { ga: null, mode: 'idle', t0: 0, raf: 0, ph: 0, lean: 0, last: 0 };

function setWheelPetMode(mode){
  wheelPet.mode = mode;
  wheelPet.t0 = performance.now();
  wheelPet.ph = 0;
  wheelPet.lean = 0;
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

const easeOut = u => 1 - (1 - u) * (1 - u);

/* Deja quieto un cuadro de una animación: pet_1 (la mano arriba) para
   agarrar y tirar del aro; si corre la animación entera salen corazones. */
function gaPin(ga, name, ms){ ga.anim = name; ga.animT0 = performance.now() - ms; }

/* Dónde va y qué hace en el instante `t` del modo actual. dx: px CSS hacia
   la rueda; dy: px CSS hacia arriba. */
function wheelPetPose(t, dt){
  const ga = wheelPet.ga;
  const JUMP = 46;   // alto del salto hasta el borde
  switch (wheelPet.mode){
    case 'spin': {
      if (t < 200){ gaLoop(ga, 'idle'); return { dx: -4 * (t / 200), dy: 0 }; }   // se echa para atrás: toma impulso
      if (t < 460){ const u = (t - 200) / 260; gaLoop(ga, 'happy'); return { dx: -4 + 24 * u, dy: JUMP * easeOut(u) }; }   // salta al borde
      if (t < WHEEL_PULL_MS){ gaPin(ga, 'pet', 60); return { dx: 20, dy: JUMP + 2 * Math.sin((t - 460) / 140 * Math.PI) }; }   // lo agarra
      if (t < 900){ const u = (t - WHEEL_PULL_MS) / (900 - WHEEL_PULL_MS); gaPin(ga, 'pet', 60); return { dx: 20 - 6 * u, dy: JUMP * (1 - u * u) }; }   // tira para abajo
      if (t < 1150){ const u = (t - 900) / 250; gaLoop(ga, 'walk'); return { dx: 14 - 20 * easeOut(u), dy: 6 * Math.sin(u * Math.PI) }; }   // trastabilla
      /* Mirando: los saltitos siguen la velocidad de la rueda. */
      const v = wheelSpeedNow();
      if (v > 0.18){
        wheelPet.ph += dt * (0.008 + 0.01 * v);
        gaLoop(ga, 'happy');
        return { dx: -6 + 2 * Math.min(1, (t - 1150) / 300), dy: Math.abs(Math.sin(wheelPet.ph)) * (3 + 8 * v) };
      }
      /* Ya va frenando: se queda quieta y se acerca de a poco a mirar. */
      gaLoop(ga, 'idle');
      wheelPet.lean = Math.min(1, (wheelPet.lean || 0) + dt / 700);
      return { dx: -4 + 7 * wheelPet.lean, dy: 0 };
    }
    case 'win':
      if (t > 1300 && t < 2700){ gaLoop(ga, 'happy'); return { dx: 3, dy: Math.abs(Math.sin((t - 1300) / 1400 * 3 * Math.PI)) * 7 }; }
      gaLoop(ga, 'idle'); return { dx: 3, dy: 0 };
    case 'big':
      gaLoop(ga, 'happy');
      return { dx: 3, dy: t < 1300 ? 0 : Math.abs(Math.sin((t - 1300) / 210)) * 12 };
    case 'lose':
      gaLoop(ga, 'sad'); return { dx: 3, dy: 0 };
    default: {
      gaLoop(ga, 'idle');
      const u = (t % 5200) / 320;   // cada tanto, un saltito impaciente
      return { dx: 0, dy: u < 1 ? 5 * Math.sin(u * Math.PI) : 0 };
    }
  }
}

function wheelPetLoop(now){
  const c = document.getElementById('wheelPet');
  if (!c || !c.isConnected || !wheelVisible()){ wheelPet.raf = 0; return; }   // se cerró la hoja
  const dt = Math.min(50, now - (wheelPet.last || now));
  wheelPet.last = now;
  const { dx, dy } = wheelPetPose(now - wheelPet.t0, dt);
  const dpr = window.devicePixelRatio || 1;
  const k = Math.max(1, Math.round(WHEEL_PET_SCALE * dpr));
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.save();
  /* Mira a la izquierda (a la rueda): "hacia la rueda" es x negativa. */
  ctx.translate(c.width - Math.round(dx * dpr), -Math.round(dy * dpr));
  ctx.scale(-1, 1);
  drawSprite(ctx, 'adult', 'normal', 0, true, k, { w: c.width, h: c.height }, wheelPet.ga);
  ctx.restore();
  wheelPet.raf = requestAnimationFrame(wheelPetLoop);
}

/* Dos formas de girar, independientes: el giro gratis (uno cada 12 horas)
   y los tickets de ruleta (🎫). Usar un ticket NO toca el reloj del gratis:
   van aparte. Con el gratis disponible, ese va primero (es el botón
   principal) y el del ticket queda de secundario, así no se gasta un ticket
   sin querer. */
function openWheel(aviso, petMode = 'idle', winId = null){
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
    ${wheelHtml(winId)}
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

/* El giro lo anima wheelSpinLoop (no una transición CSS): así se sabe en
   cada cuadro qué trozo está bajo la lengüeta, y cada clavo que pasa suena
   y la hace saltar, como una ruleta de verdad (antes el tic-tic iba a ritmo
   fijo, sin relación con la rueda). Arranca despacio (la mascota la está
   tirando) y frena largo. */
let wheelAnim = null;

/* La hoja de la ruleta está a la vista (hideOverlay solo la esconde: el
   #wheel sigue en el DOM). */
function wheelVisible(){
  return !!document.getElementById('wheel') && !document.getElementById('overlay').classList.contains('hidden');
}

function wheelEase(t){
  const a = 0.12;   // el arranque suave: lo que dura el tirón
  const g = (t < a ? t * t / (2 * a) : t - a / 2) / (1 - a / 2);
  return 1 - Math.pow(1 - g, 4);
}

/* Velocidad de la rueda de 0 (quieta) a 1 (la máxima), para la mascota. */
function wheelSpeedNow(){
  const a = wheelAnim;
  if (!a) return 0;
  const t = (performance.now() - a.t0) / WHEEL_SPIN_MS;
  if (t <= 0 || t >= 1) return 0;
  return Math.min(1, (wheelEase(Math.min(1, t + 0.005)) - wheelEase(t)) / 0.005 / 3.5);
}

function wheelSliceAt(rot, slices){
  const p = ((-rot % 360) + 360) % 360;   // el ángulo de la rueda que queda bajo la lengüeta
  return slices.findIndex(s => p >= s.a0 && p < s.a1);
}

function wheelSpinLoop(now){
  const a = wheelAnim;
  if (!a) return;
  /* Si cierran la hoja (o abren otra) sigue contando sin dibujar ni sonar:
     al terminar sale igual el pop-up con el premio. */
  const el = wheelVisible() ? document.getElementById('wheel') : null;
  const t = Math.max(0, Math.min(1, (now - a.t0) / WHEEL_SPIN_MS));
  const rot = a.from + (a.to - a.from) * wheelEase(t);
  if (el) el.style.transform = `rotate(${rot.toFixed(2)}deg)`;
  const i = wheelSliceAt(rot, a.slices);
  if (i !== a.idx){
    a.idx = i;
    a.kick = 1;
    if (el && now - a.lastTone > 45){   // a toda velocidad pasan demasiados clavos para un tic cada uno
      a.lastTone = now;
      tone({ freq: 1250 + Math.random() * 150, durationMs: 14, type: 'square', vol: 0.03 });
    }
  }
  a.kick *= Math.pow(0.8, Math.min(50, now - (a.last || now)) / 16.7);
  a.last = now;
  const ptr = document.getElementById('wheelPointer');
  if (ptr) ptr.style.transform = `rotate(${(-26 * a.kick).toFixed(1)}deg)`;
  if (t < 1){ requestAnimationFrame(wheelSpinLoop); return; }
  wheelAnim = null;
  a.done();
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
  /* Para que la lengüeta (arriba) quede sobre el trozo, la rueda gira hasta
     que un punto del trozo (al azar, lejos de los bordes) llegue a 0°. */
  const desde = w.angle || 0;
  const dentro = pick.a0 + (pick.a1 - pick.a0) * (0.2 + Math.random() * 0.6);
  w.angle = Math.ceil(desde / 360) * 360 + WHEEL_TURNS * 360 + (360 - dentro);
  saveState(); render();
  setWheelPetMode('spin');

  /* Mientras gira no se puede volver a girar (ni con el otro botón). */
  wheelSpinning = true;
  document.querySelectorAll('#btnSpin, #btnSpinTicket').forEach(b => { b.disabled = true; });
  const btn = document.getElementById(conTicket ? 'btnSpinTicket' : 'btnSpin');
  if (btn) btn.textContent = 'Girando…';
  const wrap = document.getElementById('wheelWrap');
  if (wrap) wrap.classList.add('spinning');
  const now = performance.now();
  wheelAnim = { t0: now + WHEEL_PULL_MS, from: desde, to: w.angle, slices, idx: wheelSliceAt(desde, slices), kick: 0, lastTone: 0, last: 0, done: terminar };
  requestAnimationFrame(wheelSpinLoop);

  function terminar(){
    wheelSpinning = false;
    if (wheelVisible()) tone({ freq: 880, durationMs: 60, type: 'triangle', vol: 0.05 });
    setTimeout(() => {
      /* Si cerraron la hoja mientras giraba, igual sale el pop-up con lo
         que tocó (ya está dado), pero la ruleta no se vuelve a abrir sola. */
      const abierta = wheelVisible();
      const reabrir = (...a) => { if (abierta) openWheel(...a); };
      const pago = conTicket ? [{ icon: '🎫', text: 'Ticket de ruleta', amount: '-1', neg: true }] : [];
      if (pick.p.lose){
        reabrir(`¡Uy! ${texto}`, 'lose', pick.p.id);
        showPopup({ tone: 'lose', icon: '💸', title: '¡Uy!', ok: 'Ni modo',
          items: [{ icon: '💰', text: texto }, ...pago] });
        return;
      }
      if (pick.p.big) triggerPetAction('celebrate');
      reabrir(`${pick.p.big ? '¡Premio mayor! ' : '¡Ganaste! '}${texto}`, pick.p.big ? 'big' : 'win', pick.p.id);
      const icono = pick.p.emoji || '💰';
      showPopup({ icon: icono, title: pick.p.big ? '¡Premio mayor!' : '¡Ganaste!', items: [wheelPrizeRow(pick.p, texto), ...pago] });
    }, 450);   // un respiro con la rueda quieta antes del pop-up
  }
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
