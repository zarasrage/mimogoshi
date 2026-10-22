/* ===================== Minijuegos de uno =====================
   El menú de Jugar (grilla, ficha y resultado), lo que comparten todos los
   minijuegos (canvas, mandos, sonido, premio) y los juegos de un jugador.
   Los de a dos viven en duo-juegos.js, que se carga después y suma los suyos
   a GAMES. Se carga justo después de app.js (ver index.html); todo lo de acá
   se usa recién en tiempo de juego, no al cargar. */

/* Minijuegos del menú de Jugar. Se desbloquean con monedas, una sola vez y para
   siempre; Atrapa estrellas viene gratis de inicio porque las monedas solo se
   ganan jugando (ver finishMinigame): sin un juego abierto no habría forma de
   juntar la primera. Precios sin calibrar, un primer intento: una partida buena
   da ~7 monedas. Combate no va acá — es un prototipo que solo lanza el panel
   de prueba, que además se salta el bloqueo. Snake y Tap rítmico se sacaron:
   loadState() les pasa lo pagado a Torre y Salto al cielo (ver
   REMOVED_GAMES). */
const GAMES = [
  { id:'stars',      name:'Atrapa estrellas', emoji:'⭐', desc:'Esquiva la caca',          price:  0, start: () => startStarsGame() },
  { id:'basketball', name:'Baloncesto',       emoji:'🏀', desc:'Tira en el momento justo', price: 15, start: () => startBasketballGame() },
  { id:'reflex',     name:'Reflejos',         emoji:'🎯', desc:'Todo menos las bombas',    price: 25, start: () => startReflexGame() },
  { id:'torre',      name:'Torre de cajas',   emoji:'📦', desc:'Apila sin que se caiga',   price: 35, start: () => startTowerGame() },
  { id:'cielo',      name:'Salto al cielo',   emoji:'☁️', desc:'Rebota hacia arriba',      price: 45, start: () => startSkyGame() },
  { id:'memory',     name:'Memorice',         emoji:'💡', desc:'Repite la secuencia',      price: 55, start: () => startMemoryGame() },
];

/* id viejo → id del juego que quedó en su lugar (ver loadState). */
const REMOVED_GAMES = { tap: 'torre', snake: 'cielo' };

function gameById(id){ return GAMES.find(g => g.id === id); }

function isGameUnlocked(id){
  const g = gameById(id);
  return !!g && (g.price === 0 || (state.unlockedGames || []).includes(id));
}

function unlockedGames(){ return GAMES.filter(g => isGameUnlocked(g.id)); }

/* Niveles por juego: cada partida suma su mérito como experiencia
   (state.gameXp[id]) y la experiencia desbloquea niveles, hasta GAME_MAX_LEVEL.
   El nivel no sube solo: se elige en el menú entre los ya desbloqueados, para
   que nadie quede atascado en uno que le queda grande. Los umbrales están en
   "partidas buenas" (mérito ~45, ver finishMinigame) y son acumulados: 10
   para el nivel 2, 30 en total para el 3, 50 para el 4, 150 para el 5.

   Más nivel es más difícil, así que tiene que pagar más: si no, subir sería un
   castigo (menos puntaje, menos monedas). LEVEL_COIN_MULT multiplica solo las
   monedas, y se suma al x3 del Megajuego. Cada juego lee la dificultad con
   levelT(), que va de 0 (nivel 1) a 1 (nivel máximo). */
const GAME_MAX_LEVEL = 5;
const GOOD_GAME_MERIT = 45;
const LEVEL_XP = [0, 10, 30, 50, 150].map(n => n * GOOD_GAME_MERIT);
const LEVEL_COIN_MULT = [1, 1.25, 1.5, 1.75, 2];

let playLevel = 1;   // nivel de la partida en curso; el panel de prueba juega en 1

function levelT(){ return (playLevel - 1) / (GAME_MAX_LEVEL - 1); }

function gameXp(id){ return (state.gameXp && state.gameXp[id]) || 0; }

function maxLevelFor(id){
  const xp = gameXp(id);
  let lvl = 1;
  while (lvl < GAME_MAX_LEVEL && xp >= LEVEL_XP[lvl]) lvl++;
  return lvl;
}

/* Nivel elegido en el menú, recortado al máximo desbloqueado. */
function pickedLevel(id){
  const p = (state.gameLevelPick && state.gameLevelPick[id]) || maxLevelFor(id);
  return Math.min(Math.max(1, p), maxLevelFor(id));
}

/* El récord es por nivel: un puntaje en nivel 1 y otro en nivel 5 no se pueden
   comparar. El nivel 1 usa la clave de siempre, así los récords de antes de los
   niveles quedan como récord de nivel 1. */
function recordKey(id, level){ return level > 1 ? `${id}:${level}` : id; }

/* Megajuego: una partida por juego desbloqueado cada MEGA_CYCLE_MS de tiempo
   REAL (Date.now(), no ageHours: es un ritmo para quien juega, igual que el
   modo nocturno). Paga MEGA_COIN_MULT veces las monedas — solo las monedas, la
   felicidad queda igual para no tapar el descuido. Jugar el Megajuego de todos
   los desbloqueados da de una MEGA_BONUS_PER_GAME por juego, una vez por ciclo.

   El ciclo arranca con el primer Megajuego jugado y se renueva entero 12 horas
   después, no por juego: así hay una sola cuenta regresiva que mostrar y el
   bonus de "completarlos todos" tiene un plazo claro. Un juego desbloqueado a
   mitad de ciclo entra en la cuenta de ese mismo ciclo. */
const MEGA_CYCLE_MS = 12 * 60 * 60 * 1000;
const MEGA_COIN_MULT = 3;
const MEGA_BONUS_PER_GAME = 10;

let megaRun = null;   // id del juego que se está jugando en versión Megajuego

function freshMega(){ return { cycleStart: null, played: {}, bonusPaid: false }; }

/* Devuelve el ciclo vigente, renovándolo si ya venció. Un reloj que vuelve
   atrás (cycleStart en el futuro) también lo renueva: si no, quedaría bloqueado
   hasta que el reloj alcance la fecha vieja. */
function megaState(){
  if (!state.mega || typeof state.mega !== 'object') state.mega = freshMega();
  const m = state.mega;
  if (m.cycleStart !== null){
    const elapsed = Date.now() - m.cycleStart;
    if (elapsed >= MEGA_CYCLE_MS || elapsed < 0) state.mega = freshMega();
  }
  return state.mega;
}

function megaAvailable(id){ return isGameUnlocked(id) && !megaState().played[id]; }

/* Milisegundos hasta que se renueve el ciclo; null si todavía no arrancó. */
function megaMsLeft(){
  const m = megaState();
  if (m.cycleStart === null) return null;
  return Math.max(0, m.cycleStart + MEGA_CYCLE_MS - Date.now());
}

/* "05:12:33" (o "05:12" con corto=true, para la etiqueta chica de la tarjeta). */
function megaClockLabel(ms, corto){
  const s = Math.ceil(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor(s / 60) % 60).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return corto ? `${hh}:${mm}` : `${hh}:${mm}:${ss}`;
}

/* Los relojes del Megajuego en pantalla ([data-mega-clock], y su barra en
   [data-mega-bar]) se refrescan solos cada segundo mientras haya alguno a la
   vista: sin esto, la cuenta regresiva quedaba congelada en lo que decía al
   abrir el menú. Un solo intervalo global, que no hace nada si no hay
   relojes; así ninguna hoja tiene que acordarse de arrancarlo ni pararlo. */
function tickMegaClocks(){
  const clocks = document.querySelectorAll('[data-mega-clock]');
  const bars = document.querySelectorAll('[data-mega-bar]');
  if (!clocks.length && !bars.length) return;
  const ms = megaMsLeft();
  clocks.forEach(el => {
    el.textContent = ms === null || ms <= 0 ? '¡listo!' : megaClockLabel(ms, el.dataset.megaClock === 'short');
  });
  bars.forEach(el => { el.style.width = ms === null ? '0%' : (ms / MEGA_CYCLE_MS * 100).toFixed(2) + '%'; });
}
if (typeof window !== 'undefined') setInterval(tickMegaClocks, 1000);

/* ===================== Menú de minijuegos =====================
   Dos pantallas, como la tienda de una app: la grilla de juegos y la ficha de
   cada uno. El nivel, el récord por nivel, la experiencia y el Megajuego viven
   en la ficha y no en la fila de la lista: amontonados en la fila (Nv 1/3 +
   ★ récord + MEGA apilados a la derecha) no se entendía qué era cada cosa, y
   el nivel se elegía tocando un botón chico que giraba 1→2→3→1 sin mostrar
   a dónde iba. En la ficha los cinco niveles están a la vista, con su nombre,
   cuánto pagan y qué falta para los bloqueados.

   Un juego bloqueado se compra tocándolo, ahí mismo en la grilla (no en la
   tienda: es donde uno va a buscar a qué jugar). El aviso va dentro de la
   hoja y no con say(), por lo mismo que en la tienda. El cansancio se chequea
   recién al lanzar una partida, no al abrir el menú, para poder comprar igual. */

const LEVEL_NAMES = ['Fácil', 'Normal', 'Difícil', 'Experto', 'Leyenda'];

/* Progreso hacia el próximo nivel, 0..1, y cuánto falta. En el máximo es 1. */
function levelProgress(id){
  const xp = gameXp(id);
  const max = maxLevelFor(id);
  if (max >= GAME_MAX_LEVEL) return { frac: 1, falta: 0, max };
  const desde = LEVEL_XP[max - 1], hasta = LEVEL_XP[max];
  return { frac: clamp((xp - desde) / (hasta - desde) * 100) / 100, falta: hasta - xp, max };
}

/* Cinco puntos, uno por nivel: lleno = desbloqueado, con anillo = el elegido. */
function levelDots(id){
  const max = maxLevelFor(id), pick = pickedLevel(id);
  let html = '';
  for (let l = 1; l <= GAME_MAX_LEVEL; l++){
    html += `<i class="${l <= max ? 'on' : ''} ${l === pick ? 'pick' : ''}"></i>`;
  }
  return `<span class="lvl-dots">${html}</span>`;
}

/* El banner lleva la cuenta regresiva del ciclo: es el mismo plazo para
   "volver a tener Megajuegos" y para "completarlos todos y cobrar el bonus". */
function megaBanner(){
  const m = megaState();
  const abiertos = unlockedGames();
  const jugados = abiertos.filter(g => m.played[g.id]).length;
  const ms = megaMsLeft();
  const reloj = ms === null ? '' : `
      <span class="mega-clock">⏳ <span data-mega-clock>${megaClockLabel(ms)}</span></span>
      <div class="mega-track"><div data-mega-bar style="width:${(ms / MEGA_CYCLE_MS * 100).toFixed(2)}%"></div></div>`;
  if (m.bonusPaid){
    return `<div class="mega-banner done"><b>MEGA</b><span>Completos · vuelven en</span>${reloj}</div>`;
  }
  const pips = abiertos.map(g => `<i class="${m.played[g.id] ? 'on' : ''}"></i>`).join('');
  return `
    <div class="mega-banner">
      <b>MEGA x${MEGA_COIN_MULT}</b>
      <span class="mega-pips">${pips}</span>
      <span>${jugados}/${abiertos.length} · todos ${coinsLabel('+' + MEGA_BONUS_PER_GAME * abiertos.length)}</span>
      ${reloj}
    </div>`;
}

function openGamesMenu(aviso){
  if (state.stage === 'egg'){ say('Todavía es un huevo…'); return; }
  if (!tryWake()) return;

  const card = g => {
    if (!isGameUnlocked(g.id)){
      const alcanza = state.coins >= g.price;
      return `
      <button class="game-card locked ${alcanza ? 'can-buy' : ''}" data-g="${g.id}" data-buy-game="${g.id}">
        <span class="gc-emoji">${g.emoji}</span>
        <span class="gc-lock">🔒</span>
        <b class="gc-name">${escapeHtml(g.name)}</b>
        <span class="gc-price">${coinsLabel(g.price)}</span>
      </button>`;
    }
    const best = bestScore(recordKey(g.id, pickedLevel(g.id)));
    return `
      <button class="game-card" data-g="${g.id}" data-open-game="${g.id}">
        ${megaAvailable(g.id) ? '<span class="gc-mega">MEGA</span>'
          : megaMsLeft() !== null ? `<span class="gc-mega used">⏳ <span data-mega-clock="short">${megaClockLabel(megaMsLeft(), true)}</span></span>` : ''}
        <span class="gc-emoji">${g.emoji}</span>
        <b class="gc-name">${escapeHtml(g.name)}</b>
        <span class="gc-meta">${levelDots(g.id)}${best > 0 ? `<span class="gc-best">★ ${best}</span>` : ''}</span>
      </button>`;
  };
  /* Los de a dos (duo-juegos.js) van en su propia sección, debajo. */
  const solos = GAMES.filter(g => !g.duo).map(card).join('');
  const duos = GAMES.filter(g => g.duo).map(card).join('');
  const conQuien = state.companion ? `con ${escapeHtml(state.companion.name)}` : 'viene una visita a jugar';

  showOverlay(`
    <h3>Juegos</h3>
    ${aviso ? `<p class="sheet-note">${escapeHtml(aviso)}</p>` : megaBanner()}
    <div class="menu-list">
      <div class="game-grid">${solos}</div>
      ${duos ? `<div class="game-grid-head"><span class="ggh-icon">👯</span><span>De a dos<br><small>${conQuien}</small></span></div>
      <div class="game-grid">${duos}</div>` : ''}
    </div>
    <button class="overlay-btn secondary" id="btnCloseGames">Cerrar</button>
  `, hideOverlay);

  document.querySelectorAll('[data-open-game]').forEach(el => {
    el.addEventListener('click', () => openGameDetail(el.dataset.openGame));
  });
  document.querySelectorAll('[data-buy-game]').forEach(el => {
    el.addEventListener('click', () => {
      const g = gameById(el.dataset.buyGame);
      if (state.coins < g.price){
        openGamesMenu(`Te faltan ${coinsLabel(g.price - state.coins)} para ${g.name}`);
        return;
      }
      state.coins -= g.price;
      if (!state.unlockedGames) state.unlockedGames = [];
      state.unlockedGames.push(g.id);
      saveState(); render();
      openGameDetail(g.id, `¡Desbloqueado! Te quedan ${coinsLabel(state.coins)}`);
    });
  });
  document.getElementById('btnCloseGames').addEventListener('click', hideOverlay);
}

/* playLevel va antes de start(): varios juegos leen la dificultad al armar
   su estado inicial (Memorice, el ancho de la Torre). El Megajuego se juega
   siempre en el nivel más difícil desbloqueado, no en el elegido: es la
   partida especial del ciclo y paga x3, así que va con todo (y el x3 se suma
   al multiplicador de ese nivel). Devuelve false si no
   se pudo lanzar (cansancio), para que quien llama muestre el aviso donde
   corresponda. */
function launchGame(id, mega){
  if (state.energy < GAME_MIN_ENERGY) return false;
  hideOverlay();
  playLevel = mega ? maxLevelFor(id) : pickedLevel(id);
  megaRun = mega ? id : null;
  gameById(id).start();
  return true;
}

/* Ficha de un juego: los cinco niveles a la vista. Tocar uno desbloqueado lo
   elige (y queda guardado, como antes con el botón que giraba); tocar uno
   bloqueado solo cuenta cuánta experiencia le falta. */
function openGameDetail(id, aviso){
  const g = gameById(id);
  const max = maxLevelFor(id);
  const pick = pickedLevel(id);
  const prog = levelProgress(id);

  const niveles = LEVEL_NAMES.map((nombre, i) => {
    const l = i + 1;
    const abierto = l <= max;
    return `
      <button class="lvl-step ${abierto ? '' : 'locked'} ${l === pick ? 'active' : ''}" data-lvl="${l}">
        <span class="lvl-num">${abierto ? l : '🔒'}</span>
        <span class="lvl-name">${nombre}</span>
      </button>`;
  }).join('');

  const best = bestScore(recordKey(id, pick));
  const mult = LEVEL_COIN_MULT[pick - 1];
  const xpLine = prog.max >= GAME_MAX_LEVEL
    ? `${gameXp(id)} xp · todos los niveles abiertos`
    : `${gameXp(id)} / ${LEVEL_XP[prog.max]} xp para ${LEVEL_NAMES[prog.max]}`;
  const mega = megaAvailable(id);

  showOverlay(`
    <div class="detail-head">
      <button class="back-btn" id="btnBackGames" aria-label="Volver">‹</button>
      <span>Juegos</span>
    </div>
    <div class="game-hero" data-g="${id}">
      <span class="hero-emoji">${g.emoji}</span>
      <div class="hero-info">
        <h3>${escapeHtml(g.name)}</h3>
        <small>${escapeHtml(g.desc)}</small>
      </div>
    </div>
    <div class="menu-list detail-body">
      <div class="section-label">Nivel</div>
      <div class="lvl-picker">${niveles}</div>
      <p class="sheet-note" id="lvlNote">${aviso ? escapeHtml(aviso) : ''}</p>
      <div class="stat-tiles">
        <div class="stat-tile"><b>${best > 0 ? best : '—'}</b><span>Récord ${LEVEL_NAMES[pick - 1].toLowerCase()}</span></div>
        <div class="stat-tile"><b>x${mult}</b><span>Monedas</span></div>
      </div>
      <div class="xp-row">
        <div class="xp-bar"><div class="xp-fill" style="width:${Math.round(prog.frac * 100)}%"></div></div>
        <small>${xpLine}</small>
      </div>
    </div>
    <div class="overlay-actions">
      ${mega ? `<button class="overlay-btn mega" id="btnPlayMega"><span>Jugar MEGA · ${LEVEL_NAMES[max - 1]}</span><small>Tu nivel más difícil · x${MEGA_COIN_MULT} monedas · 1 vez cada 12 h</small></button>`
        : megaMsLeft() !== null ? `
        <div class="mega-wait">
          <div class="mega-wait-row"><b>MEGA usado</b><span>vuelve en ⏳ <span data-mega-clock>${megaClockLabel(megaMsLeft())}</span></span></div>
          <div class="mega-track"><div data-mega-bar style="width:${(megaMsLeft() / MEGA_CYCLE_MS * 100).toFixed(2)}%"></div></div>
        </div>` : ''}
      <button class="overlay-btn ${mega ? 'secondary' : ''}" id="btnPlayGame">Jugar · ${LEVEL_NAMES[pick - 1]}</button>
    </div>
  `, hideOverlay);

  const note = document.getElementById('lvlNote');
  const cansado = () => { note.textContent = 'Está muy cansado para jugar'; note.classList.add('warn'); };

  document.querySelectorAll('[data-lvl]').forEach(el => {
    el.addEventListener('click', () => {
      const l = +el.dataset.lvl;
      if (l > max){
        note.textContent = `${LEVEL_NAMES[l - 1]}: faltan ${LEVEL_XP[l - 1] - gameXp(id)} xp. Juega bien para abrirlo.`;
        note.classList.remove('warn');
        return;
      }
      state.gameLevelPick[id] = l;
      saveState();
      openGameDetail(id);
    });
  });
  document.getElementById('btnBackGames').addEventListener('click', () => openGamesMenu());
  document.getElementById('btnPlayGame').addEventListener('click', () => { if (!launchGame(id, false)) cansado(); });
  if (mega) document.getElementById('btnPlayMega').addEventListener('click', () => { if (!launchGame(id, true)) cansado(); });
}

/* Hoja de resultado al terminar una partida. Antes era un say() de una línea
   ("¡RÉCORD! 75 pts (combo 12) · +15 felicidad · 💰 +10 · ¡Nivel 2
   desbloqueado!") que duraba 3 segundos: lo más satisfactorio del juego se
   leía de pasada o no se leía. El overlay va sin desenfoque (.clear) para que
   se vea a la mascota celebrando arriba. La barra de experiencia arranca donde
   estaba antes de la partida y se llena hasta donde quedó. */
function showGameResult(r){
  const g = gameById(r.id);
  const chips = [
    r.happinessGain > 0 ? `<span class="chip">⭐ +${r.happinessGain}</span>` : '',
    r.coins > 0 ? `<span class="chip gold">${coinsLabel('+' + r.coins)}${r.mega ? ' · MEGA' : ''}</span>` : '',
    r.bonus > 0 ? `<span class="chip gold">Megajuegos completos ${coinsLabel('+' + r.bonus)}</span>` : '',
  ].join('');
  const xp = g ? `
    <div class="xp-row">
      <div class="xp-bar"><div class="xp-fill" id="resXp" style="width:${Math.round(r.xpFrom * 100)}%"></div></div>
      <small>${r.levelUp ? `¡Nivel ${LEVEL_NAMES[r.levelUp - 1]} desbloqueado!` : r.xpGain > 0 ? `+${r.xpGain} xp` : 'Sin experiencia esta vez'}</small>
    </div>` : '';

  showOverlay(`
    <div class="result-head ${r.record ? 'record' : ''}">
      ${r.record ? '<span class="result-badge">¡RÉCORD!</span>' : ''}
      <div class="result-score">${r.score}</div>
      <p>${escapeHtml(r.message)}</p>
      ${g ? `<small class="result-level">${escapeHtml(g.name)} · ${LEVEL_NAMES[r.level - 1]}</small>` : ''}
    </div>
    ${chips ? `<div class="result-chips">${chips}</div>` : ''}
    ${xp}
    <div class="overlay-actions row">
      ${g ? `<button class="overlay-btn" id="btnAgain">${r.levelUp ? `Probar ${LEVEL_NAMES[r.levelUp - 1]}` : 'Otra vez'}</button>` : ''}
      <button class="overlay-btn secondary" id="btnResultDone">Listo</button>
    </div>
  `, hideOverlay);
  document.getElementById('overlay').classList.add('clear');

  const fill = document.getElementById('resXp');
  if (fill) requestAnimationFrame(() => requestAnimationFrame(() => {
    fill.style.width = Math.round(r.xpTo * 100) + '%';
  }));
  document.getElementById('btnResultDone').addEventListener('click', hideOverlay);
  if (g) document.getElementById('btnAgain').addEventListener('click', () => {
    if (!launchGame(r.id, false)) openGameDetail(r.id, 'Está muy cansado para jugar');
  });
}

/* Ajusta la resolución interna del canvas del minijuego a su tamaño real en
   pantalla (el contenedor es flexible), para que nada salga estirado/deforme. */
function fitGameCanvas(gc){
  const rect = gc.getBoundingClientRect();
  gc.width = Math.max(200, Math.round(rect.width));
  gc.height = Math.max(90, Math.round(rect.height));
}

/* ===================== Utilidades compartidas de minijuegos ===================== */

/* Dibujar un emoji con fillText es caro: el navegador rasteriza el glifo a color
   en cada llamada, y en una partida hay decenas por frame. Se rasteriza una sola
   vez a un canvas chico y de ahí en adelante solo se copia con drawImage. */
const emojiCache = new Map();

function emojiSprite(char, size){
  const key = char + '@' + size;
  const cached = emojiCache.get(key);
  if (cached) return cached;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const cx = c.getContext('2d');
  cx.font = Math.round(size * 0.78) + 'px sans-serif';
  cx.textAlign = 'center';
  cx.textBaseline = 'middle';
  cx.fillText(char, size/2, size/2);
  emojiCache.set(key, c);
  return c;
}

function drawEmoji(ctx, char, size, x, y){
  ctx.drawImage(emojiSprite(char, size), Math.round(x - size/2), Math.round(y - size/2));
}

/* Sonido sintetizado con Web Audio, sin archivos: encaja con que todo el resto
   del juego ya es procedural (animaciones, huevo) y no depende de conseguir ni
   licenciar ningún asset. El AudioContext se crea recién al primer beep() —
   los navegadores lo bloquean si se crea antes de un gesto del usuario, y acá
   el primer beep siempre llega después de tocar algo (empezar un minijuego). */
let audioCtx = null;
let audioBroken = false;   // el navegador no deja: se deja de reintentar

/* Ojo: esto se llama desde el loop de un minijuego, o sea cada frame. Tiene que
   ser barato y no puede tirar nunca — si revienta acá, se lleva puesto el
   requestAnimationFrame y el juego se congela. */
function getAudioCtx(){
  if (audioBroken) return null;
  try {
    if (!audioCtx){
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC){ audioBroken = true; return null; }
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended'){
      const p = audioCtx.resume();
      if (p && p.catch) p.catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    audioBroken = true;
    return null;
  }
}

/* Reloj del audio, o null si todavía no arrancó (recién creado, o el navegador
   lo dejó suspendido esperando un gesto). Sirve para agendar sonidos con
   precisión de sample en vez de "cuando toque el próximo frame". */
function audioNow(){
  const ctx = getAudioCtx();
  return (ctx && ctx.state === 'running') ? ctx.currentTime : null;
}

/* Un tono con envolvente: ataque opcional y caída exponencial (así no
   "clickea" al cortar de golpe). `at` es un instante ABSOLUTO del reloj de
   audio: con eso se puede agendar por adelantado —un metrónomo agendado frame
   a frame suena tembleque, agendado en el reloj de audio no—. Envuelto en
   try/catch como el resto de las cosas que pueden fallar por políticas del
   navegador: un sonido que no suena no puede romper el juego. */
function tone({ freq, durationMs, type = 'sine', vol = 0.15, at = 0, attackMs = 0 }){
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const start = Math.max(at || 0, ctx.currentTime);
    const dur = durationMs / 1000;
    const atk = Math.min(attackMs / 1000, dur * 0.5);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    /* El ataque va en rampa LINEAL y la caída en exponencial, a propósito. Una
       rampa exponencial de subida arranca pegada a cero y recién despega
       cerca del final: con 110ms de ataque el sonido se percibe entrando
       ~80ms tarde, que a 150 BPM es un cuarto de pulso — se escucha
       claramente fuera de tiempo. La lineal llega a la mitad del volumen a
       la mitad del ataque, o sea que el golpe se percibe donde corresponde. */
    if (atk > 0){
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(vol, start + atk);
    } else {
      gain.gain.setValueAtTime(vol, start);
    }
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  } catch (e) { /* audio bloqueado o no soportado: no pasa nada, sigue mudo */ }
}

/* Atajo para el caso más común: un tono corto que suena ya mismo. */
function beep(freq, durationMs, type = 'sine', vol = 0.15){
  tone({ freq, durationMs, type, vol });
}

/* getBoundingClientRect() obliga al navegador a recalcular el layout. Llamarlo en
   cada pointermove es un recálculo por frame, así que se cachea al empezar la
   partida y solo se refresca si la ventana cambia de tamaño. */
function makeCanvasPointer(gc){
  const p = {
    rect: gc.getBoundingClientRect(),
    refresh(){ p.rect = gc.getBoundingClientRect(); },
    at(e){
      const r = p.rect;
      return {
        x: (e.clientX - r.left) / r.width * gc.width,
        y: (e.clientY - r.top) / r.height * gc.height,
      };
    },
    dispose(){ window.removeEventListener('resize', p.refresh); },
  };
  window.addEventListener('resize', p.refresh);
  return p;
}

/* Récord por minijuego: es lo que hace que valga la pena repetir una partida.
   Vive dentro del save, así que se guarda y migra junto con todo lo demás. */
function bestScore(id){
  return (state.records && state.records[id]) || 0;
}

function saveBestScore(id, score){
  if (!state.records) state.records = {};
  if (score <= (state.records[id] || 0)) return false;
  state.records[id] = score;
  return true;
}

/* Mientras dura una partida, los mandos del juego reemplazan a los botones de
   cuidado de abajo. Así la pantalla queda libre para el juego en vez de tener
   controles encima, y de paso los botones quedan donde está el pulgar. Reflejos
   y memorice no usan esto: se juegan tocando la pantalla sí o sí. */
/* En el teléfono la pantalla se estira hasta llenar el aparato, así que si
   los mandos del juego son más bajos que los de siempre la pantalla crece
   justo después de que el juego midió su canvas (enterMinigame va antes), y
   el canvas queda estirado. Se les suma a los mandos lo que habría crecido
   la pantalla: la pantalla queda del mismo alto con que se midió. */
function showGameControls(html){
  closeFoodTray();
  const screen = document.getElementById('screen');
  const before = screen.getBoundingClientRect().height;
  const cont = document.getElementById('gameControls');
  cont.innerHTML = html;
  cont.style.minHeight = '';
  cont.classList.remove('hidden');
  document.getElementById('controls').classList.add('hidden');
  const grow = screen.getBoundingClientRect().height - before;
  if (grow > 0.5) cont.style.minHeight = (cont.getBoundingClientRect().height + grow) + 'px';
  return cont;
}

function hideGameControls(){
  const cont = document.getElementById('gameControls');
  cont.innerHTML = '';   // se lleva los listeners junto con los nodos
  cont.style.minHeight = '';
  cont.classList.add('hidden');
  document.getElementById('controls').classList.remove('hidden');
}

/* Ata una acción a un botón de mando. Va en pointerdown y no en click: en el
   teléfono el click llega bastante después del toque y en estos juegos se nota. */
function wireGameButton(el, fn){
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); fn(); });
}

/* Alta y baja del canvas de minijuego: las dos mitades que todos repiten igual. */
function enterMinigame(id){
  /* Una rutina con un mueble no sigue detrás del minijuego: se corta y la
     mascota queda en el piso para cuando vuelva. */
  if (walker.activity) endFurniActivity(walker);
  walker.y = 0;
  if (typeof buddy !== 'undefined'){ if (buddy.activity) endFurniActivity(buddy); buddy.y = 0; }
  catchUp();
  activeMinigame = id;
  document.getElementById('creatureFloor').classList.add('hidden');
  const gc = document.getElementById('gameCanvas');
  gc.classList.remove('hidden');
  fitGameCanvas(gc);
  const ctx = gc.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { gc, ctx };
}

function exitMinigame(){
  document.getElementById('gameCanvas').classList.add('hidden');
  document.getElementById('creatureFloor').classList.remove('hidden');
  hideGameControls();
  activeMinigame = null;
  megaRun = null;
  playLevel = 1;
}

/* Dibuja a la mascota dentro de otro canvas, apoyada en (x, suelo). `escala`
   tiene que ser entera igual que en pixelScale(): con 2 el sprite mide 64px, que
   es lo que calza en el canvas de un minijuego sin comerse media pantalla. */
function drawPetAt(ctx, x, suelo, mood, escala){
  ctx.save();
  ctx.translate(Math.round(x - CANVAS_W/2), Math.round(suelo - CANVAS_H));
  drawSprite(ctx, displayStage(), mood, 0, true, escala);
  ctx.restore();
}

/* El "mérito" es el puntaje del juego llevado a una escala común: ~45 para una
   partida muy buena. Existe porque los cuatro puntajes viven en escalas que no
   se pueden comparar (9 en baloncesto contra ~500 en tap rítmico), y así hay una
   sola fórmula de premio en vez de cuatro.

   Las dos recompensas salen del mérito pero con reglas distintas a propósito:
   - La felicidad tiene tope. Jugar no puede ser la forma de tapar el descuido:
     sube la barra un buen tramo, no la llena de una partida.
   - Las monedas no lo tienen. Es lo que hace que jugar excelente pague más que
     jugar bien; con tope, 75 y 96 puntos en estrellas daban exactamente lo mismo. */
const HAPPINESS_PER_MERIT = 1/3;
const HAPPINESS_MAX_GAIN = 15;
const HAPPINESS_MIN_GAIN = -3;   // solo estrellas puede dar negativo (comer caca)
const COINS_PER_MERIT = 1/6;

/* Cierre común: aplica el premio, paga, avisa el récord y deja todo guardado. */
function finishMinigame(id, { score, merit, energyCost, hygieneCost = 0, message }){
  const record = saveBestScore(recordKey(id, playLevel), score);
  const happinessGain = clamp(Math.round(merit * HAPPINESS_PER_MERIT), HAPPINESS_MIN_GAIN, HAPPINESS_MAX_GAIN);
  const mega = megaRun === id;
  const baseCoins = Math.max(0, Math.round(merit * COINS_PER_MERIT * LEVEL_COIN_MULT[playLevel - 1]));
  let coins = mega ? baseCoins * MEGA_COIN_MULT : baseCoins;
  /* El Megajuego se gasta al terminar la partida, no al empezarla: si la
     mascota se muere a mitad (forceCloseMinigames), no se pierde. */
  let bonus = 0;
  if (mega){
    const m = megaState();
    if (m.cycleStart === null) m.cycleStart = Date.now();
    m.played[id] = true;
    const todos = unlockedGames();
    if (!m.bonusPaid && todos.every(g => m.played[g.id])){
      bonus = MEGA_BONUS_PER_GAME * todos.length;
      m.bonusPaid = true;
    }
  }
  coins += bonus;

  /* La experiencia es el mérito tal cual, sin multiplicar por nivel ni por
     Megajuego: mide cuánto jugaste bien, no cuánto pagó. Solo los juegos del
     menú tienen niveles (no los prototipos del panel de prueba). */
  let subio = 0;
  const xpFrom = gameById(id) ? levelProgress(id).frac : 0;
  const xpAntes = gameXp(id);
  if (gameById(id) && merit > 0){
    const antes = maxLevelFor(id);
    state.gameXp[id] = gameXp(id) + Math.round(merit);
    const despues = maxLevelFor(id);
    if (despues > antes){
      subio = despues;
      state.gameLevelPick[id] = despues;   // queda elegido el nivel nuevo, se puede bajar en el menú
    }
  }

  state.happiness = clamp(state.happiness + happinessGain);
  state.energy = clamp(state.energy - energyCost);
  collapseIfDrained();   // jugar hasta quedar sin energía la deja dormida
  if (hygieneCost) state.hygiene = clamp(state.hygiene - hygieneCost);
  state.coins += coins;

  const level = playLevel;
  if (happinessGain > 0) triggerPetAction('celebrate');
  exitMinigame();
  saveState(); render();
  showGameResult({
    id, score, message, record, level, mega, bonus,
    happinessGain, coins: coins - bonus,
    xpGain: gameXp(id) - xpAntes, levelUp: subio,
    /* Si subió de nivel la barra arranca de 0 en el tramo nuevo: llenarla
       hasta el tope del tramo viejo y saltar se lee como un error. */
    xpFrom: subio ? 0 : xpFrom,
    xpTo: gameById(id) ? levelProgress(id).frac : 0,
  });
}

/* ===================== Minijuego 1: atrapar estrellas =====================
   20 segundos con dificultad creciente: arranca lento y casi todo son estrellas,
   termina rápido y con mucha más caca. El combo (estrellas seguidas, sin comer
   caca ni dejar caer ninguna) multiplica hasta x4, así que lo que decide el
   puntaje no es atrapar mucho sino no romper la racha. */

const SG_DURATION = 20;
/* Media anchura de la zona que atrapa. Está ajustada al ancho del cuerpo de la
   mascota dibujada a escala 2 (~44px): si fuera más angosta que lo que se ve,
   las atrapadas de borde se sentirían robadas. */
const SG_BASKET_HALF = 22;
const SG_PET_SCALE = 2;   // entero, igual que pixelScale()
const SG_CHAR = { star:'⭐', gold:'🌟', poop:'💩' };

let sg = null;

/* La grilla de fondo es fija: se dibuja una vez a un canvas aparte y después se
   copia con un solo drawImage, en vez de repetir ~16 fillRect por frame. */
function sgBackground(w, h){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const cx = c.getContext('2d');
  cx.fillStyle = 'rgba(255,255,255,.06)';
  for (let i = 0; i < w; i += 16) cx.fillRect(i, 0, 1, h);
  return c;
}

function startStarsGame(){
  const { gc, ctx } = enterMinigame('stars');

  sg = {
    ctx, gc,
    basketX: gc.width/2,
    items: [],
    fx: [],
    score: 0,
    combo: 0,
    bestCombo: 0,
    timeLeft: SG_DURATION,
    spawnIn: 0.4,
    keys: { left:false, right:false },
    bg: sgBackground(gc.width, gc.height),
    raf: null,
    lastT: 0,
  };

  const onKey = (down) => (e) => {
    if (e.key === 'ArrowLeft'  || e.key === 'a') sg.keys.left = down;
    if (e.key === 'ArrowRight' || e.key === 'd') sg.keys.right = down;
  };
  sg.onKeyDown = onKey(true);
  sg.onKeyUp = onKey(false);
  window.addEventListener('keydown', sg.onKeyDown);
  window.addEventListener('keyup', sg.onKeyUp);

  /* El deslizador vive abajo, con los botones, no encima de la pantalla. */
  const cont = showGameControls(`
    <div class="game-hint">Mueve a tu mascota para atrapar las estrellas</div>
    <input type="range" class="game-slider" id="sgSlider" min="0" max="1000" value="500">
  `);
  sg.slider = cont.querySelector('#sgSlider');
  sg.onSlide = () => { sg.basketX = sgSliderToX(+sg.slider.value); };
  sg.slider.addEventListener('input', sg.onSlide);
  sg.onSlide();

  say('¡Atrapa las estrellas!');
  sg.raf = requestAnimationFrame(sgLoop);
}

function sgSliderToX(v){
  const min = SG_BASKET_HALF, max = sg.gc.width - SG_BASKET_HALF;
  return min + (max - min) * (v / 1000);
}

/* Al mover con el teclado hay que devolverle la posición al deslizador, si no
   el próximo toque en él pega un salto desde donde quedó la perilla. */
function sgSyncSlider(){
  if (!sg.slider) return;
  const min = SG_BASKET_HALF, max = sg.gc.width - SG_BASKET_HALF;
  sg.slider.value = Math.round((sg.basketX - min) / (max - min) * 1000);
}

function sgMultiplier(){
  return Math.min(4, 1 + Math.floor(sg.combo / 4));
}

/* Partículas dentro del canvas. Antes cada atrapada creaba un <div> con floatFx()
   que vivía 1s: con el ritmo de spawn de ahora eso es un chorro de nodos y de
   reflows por partida, y el canvas ya está dibujándose igual. */
function sgSpawnFx(char, x, y){
  sg.fx.push({ char, x, y, vy: -46, life: 0.6 });
}

function sgCatch(it){
  if (it.kind === 'poop'){
    sg.score -= 2;
    sg.combo = 0;
    sgSpawnFx('💩', it.x, it.y);
    return;
  }
  sg.combo += 1;
  if (sg.combo > sg.bestCombo) sg.bestCombo = sg.combo;
  sg.score += (it.kind === 'gold' ? 3 : 1) * sgMultiplier();
  sgSpawnFx(SG_CHAR[it.kind], it.x, it.y);
}

function sgLoop(t){
  if (activeMinigame !== 'stars' || !sg) return;
  const dt = Math.min(0.05, (t - (sg.lastT || t)) / 1000);
  sg.lastT = t;
  sg.timeLeft -= dt;

  const gc = sg.gc, ctx = sg.ctx;
  const progress = 1 - Math.max(0, sg.timeLeft) / SG_DURATION; // 0 al empezar, 1 al final

  if (sg.keys.left || sg.keys.right){
    if (sg.keys.left)  sg.basketX = Math.max(SG_BASKET_HALF, sg.basketX - 260*dt);
    if (sg.keys.right) sg.basketX = Math.min(gc.width - SG_BASKET_HALF, sg.basketX + 260*dt);
    sgSyncSlider();
  }

  sg.spawnIn -= dt;
  if (sg.spawnIn <= 0){
    sg.spawnIn = (0.50 - 0.32*progress) * (1 - 0.3*levelT());   // 0.50s → 0.18s entre caídas; -30% en nivel 5
    const roll = Math.random();
    const poopChance = 0.24 + 0.36*progress + 0.15*levelT();    // 24% → 60% de caca; +15 puntos en nivel 5
    const kind = roll < poopChance ? 'poop' : (roll > 0.95 ? 'gold' : 'star');
    sg.items.push({
      x: 16 + Math.random()*(gc.width - 32),
      y: -12,
      vy: (110 + 160*progress) * (1 + 0.5*levelT()) * (0.85 + Math.random()*0.4),
      kind,
    });
  }

  ctx.clearRect(0, 0, gc.width, gc.height);
  ctx.drawImage(sg.bg, 0, 0);

  /* Una sola pasada por los items: mover, chequear atrapada/salida y dibujar. */
  const catchY = gc.height - 26;
  for (let i = sg.items.length - 1; i >= 0; i--){
    const it = sg.items[i];
    it.y += it.vy * dt;

    if (it.y > catchY && it.y < gc.height && Math.abs(it.x - sg.basketX) < SG_BASKET_HALF + 4){
      sgCatch(it);
      sg.items.splice(i, 1);
      continue;
    }
    if (it.y > gc.height + 14){
      if (it.kind !== 'poop') sg.combo = 0; // dejar caer una estrella corta la racha
      sg.items.splice(i, 1);
      continue;
    }
    drawEmoji(ctx, SG_CHAR[it.kind], 20, it.x, it.y);
  }

  for (let i = sg.fx.length - 1; i >= 0; i--){
    const f = sg.fx[i];
    f.life -= dt;
    if (f.life <= 0){ sg.fx.splice(i, 1); continue; }
    f.y += f.vy * dt;
    ctx.globalAlpha = Math.min(1, f.life * 2);
    drawEmoji(ctx, f.char, 15, f.x, f.y);
  }
  ctx.globalAlpha = 1;

  drawPetAt(ctx, sg.basketX, gc.height, sg.combo >= 4 ? 'happy' : 'normal', SG_PET_SCALE);

  ctx.font = '11px monospace';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.fillText('⭐ ' + sg.score, 8, 16);
  ctx.textAlign = 'right';
  ctx.fillText(Math.max(0, sg.timeLeft).toFixed(1) + 's', gc.width - 8, 16);

  if (sg.combo >= 2){
    ctx.textAlign = 'center';
    ctx.fillStyle = sgMultiplier() > 1 ? '#ffe66d' : 'rgba(255,255,255,.7)';
    ctx.fillText(`combo ${sg.combo}  x${sgMultiplier()}`, gc.width/2, 16);
  }

  if (sg.timeLeft <= 0){ endStarsGame(); return; }
  sg.raf = requestAnimationFrame(sgLoop);
}

function sgDispose(){
  if (!sg) return;
  window.removeEventListener('keydown', sg.onKeyDown);
  window.removeEventListener('keyup', sg.onKeyUp);
  if (sg.raf) cancelAnimationFrame(sg.raf);
}
minigameDisposers.push(() => { sgDispose(); sg = null; });

function endStarsGame(){
  const score = sg ? sg.score : 0;
  const bestCombo = sg ? sg.bestCombo : 0;
  sgDispose();
  sg = null;

  /* Un bot que no falla nada saca ~96 puntos; 75 ya es una partida muy buena. */
  const message = score > 0 ? `${score} pts (combo ${bestCombo})` : 'Mmm, la próxima será';

  finishMinigame('stars', { score, merit: score * 0.6, energyCost: 18, hygieneCost: 5, message });
}

/* ===================== Minijuego 2: baloncesto (timing) ===================== */

const BB_TOTAL_SHOTS = 3;
/* La pelota sube y baja junto a la mascota. El acierto depende de qué tan cerca del punto
   más alto se aprieta Bandeja — las zonas de acierto no se muestran, solo están codificadas
   como umbrales de altura (0 = abajo, 1 = arriba del todo). Se endurece por tiro. */
const BB_DIFFICULTY = [
  { peak: 0.90, near: 0.80, speed: 1.5 },
  { peak: 0.95, near: 0.85, speed: 1.875 },
  { peak: 0.98, near: 0.90, speed: 2.25 },
];

/* Probabilidad, por tiro, de que un acierto NO se quede así de fácil:
   - un switch (h >= peak) tiene esta chance de rebotar igual y pasar a Bandeja
   - una Bandeja ya conseguida tiene esta MISMA chance de rebotar y pasar a Slam
     Dunk (no la pidieron por separado, se reusa el mismo número: es una sola
     perilla fácil de tocar en vez de cuatro sueltas). */
const BB_REBOUND_CHANCE = [0.30, 0.50, 0.70];

/* Tocar el aro (near <= h < peak) ya no es "0 puntos": ahora SIEMPRE manda a
   Bandeja. Antes ese umbral decidía un resultado muerto; ahora decide el inicio
   de una cadena, así que el nombre importa: "near" pasa a ser el piso de "algo
   pasa", no el piso de encestar. */

/* Puntos según de qué encadenamiento vengan. El dunk que viene de un switch vale
   más (4) porque ya evitó rebotar dos veces seguidas; el que viene de tocar el
   aro vale lo mismo que un switch limpio (3), como consuelo por la mala suerte
   inicial. */
const BB_POINTS = {
  swish: 3,
  layup: { swish: 3, rim: 2 },
  dunk:  { swish: 4, rim: 3 },
};

/* "No alcanza" normalmente no hace nada — pero hay una chance rara de que la
   pelota se pinche ahí mismo y termine la partida de golpe, con lo acumulado
   hasta ese momento. Es la única forma de perder tiros sin haberlos jugado. */
const BB_POP_CHANCE = 0.02;

/* Bandeja y Slam Dunk ya no son un oscilador que sube y baja sin parar: son un
   solo salto de una pasada (una parábola real, como bbArcPos pero para la
   mascota) con UNA ventana de tiempo para apretar. Si el salto termina y no se
   apretó dentro de la ventana — apretar antes o después tampoco cuenta — se
   acabó ahí, sin repetir el ciclo. */
const BB_LAYUP_JUMP_MS = 650;    // dura el salto completo, de despegue a caer
/* Recalibrada a mano contra una captura marcada: el arranque (0.38) ya
   calzaba justo con el punto más alto, pero el tramo bueno seguía un poco
   más allá de lo que marcaba — se extiende hasta 0.70. */
const BB_LAYUP_WINDOW = [0.38, 0.70];
/* La forma del salto (alto/ancho) sale de esa misma captura, midiéndola contra
   el aro —que ya se sabe dónde cae, BB_HOOP_X_FRAC/Y_FRAC, así que sirve para
   calibrar la escala real del dibujo—: un salto bastante más ancho y apenas
   más alto que el de antes, "largo y bajo" en vez de parejo.

   Van como FRACCIÓN del canvas (de `bb.w`/`bb.h`), no en píxeles fijos, igual
   que ya hacían las posiciones X_FRAC/Y_FRAC: en píxeles fijos, la altura
   "correcta" en el canvas chico de prueba se queda corta en un canvas real de
   teléfono (bastante más alto), que es justo el bug que ya evitaba `drawEgg()`
   dibujando sus radios como fracción del canvas y no en píxeles. */
const BB_LAYUP_ARC_FRAC = 0.195;   // alto del salto, fracción de bb.h
const BB_LAYUP_DX_FRAC = 0.16;     // "salta en una parábola hacia la derecha", fracción de bb.w
const BB_LAYUP_X_FRAC = 0.62;      // se acerca al aro, pero no queda debajo:
                                    // 0.62 + 0.16 = 0.78, todavía corto de BB_HOOP_X_FRAC=0.80

const BB_DUNK_JUMP_MS = 700;
/* Recalibrada a mano contra una captura marcada: ahí el tramo bueno arrancaba
   prácticamente en el punto más alto (t=0.5) y terminaba cuando el personaje
   cruza, ya bajando, la altura del aro — no bien más abajo como estaba antes
   (0.60-0.82). */
const BB_DUNK_WINDOW = [0.50, 0.72];
/* La captura marcada mostraba el salto llegando casi al borde de arriba de la
   pantalla — mucho más alto que antes. Con BB_DUNK_ARC_FRAC = 0.85 el pico
   queda bien arriba del aro (BB_HOOP_Y_FRAC = 0.24, con margen de sobra) sin
   pegarse del todo al borde superior, donde ya dibuja el HUD ("Tiro X/3"). */
const BB_DUNK_ARC_FRAC = 0.85;     // alto del salto, fracción de bb.h
const BB_DUNK_X_FRAC = 0.90;       // prácticamente debajo del aro, salta derecho hacia arriba

const BB_APPROACH_MS = 320;      // lo que tarda en correr hacia el aro antes de saltar

/* Posiciones como fracción del tamaño real del canvas (se recalculan al empezar
   cada partida con fitGameCanvas, así nunca queda estirado ni con huecos). */
const BB_BALL_TOP_FRAC = 0.20;
const BB_BALL_BOTTOM_FRAC = 0.58;
const BB_HOOP_X_FRAC = 0.80;
const BB_HOOP_Y_FRAC = 0.24;
const BB_MONO_X_FRAC = 0.15;
const BB_BALL_X_FRAC = 0.23;
const BB_FLIGHT_MS = 480;
const BB_SETTLE_MS = 220;
const BB_RESULT_MS = 800;

let bb = null;
minigameDisposers.push(() => { if (bb && bb.raf) cancelAnimationFrame(bb.raf); bb = null; });

function bbBallHeight(phase){
  return (Math.sin(phase - Math.PI/2) + 1) / 2; // 0 abajo, 1 arriba
}

function startBasketballGame(){
  const { gc, ctx } = enterMinigame('basketball');

  const w = gc.width, h = gc.height;
  bb = {
    ctx,
    gc, w, h,
    groundY: h - 4, // mismo margen que el piso normal (petCanvas usa bottom:4px)
    ballTopY: h*BB_BALL_TOP_FRAC,
    ballBottomY: h*BB_BALL_BOTTOM_FRAC,
    hoopX: w*BB_HOOP_X_FRAC,
    hoopY: h*BB_HOOP_Y_FRAC,
    monoX: w*BB_MONO_X_FRAC,
    ballX: w*BB_BALL_X_FRAC,
    layupX: w*BB_LAYUP_X_FRAC,
    dunkX: w*BB_DUNK_X_FRAC,
    shot: 0,
    score: 0,
    phase: 0,
    state: 'aim',       // 'aim' | 'approach' | 'jump_aim' | 'flight' | 'settle' | 'result'
    chain: null,        // null | 'swish' | 'rim' — de dónde viene la cadena actual
    jumpKind: null,     // null | 'layup' | 'dunk' — qué mini-juego de salto está activo
    jumpStart: 0,
    jumpFromX: 0,       // de dónde a dónde se mueve horizontalmente durante el salto
    jumpToX: 0,
    approachFrom: 0,
    approachTo: 0,
    approachStart: 0,
    popped: false,      // true si se acabó por la pelota pinchada, no por agotar tiros
    flightStart: 0,
    flightFrom: null,
    flightTo: null,
    settleFrom: null,
    settleTo: null,
    resultText: '',
    resultUntil: 0,
    raf: null,
    lastT: 0,
  };
  /* Los botones vivían flotando sobre la pantalla, con su posición calculada a
     mano desde getBoundingClientRect() una sola vez: si el layout cambiaba,
     quedaban descolocados. Ahora son botones normales abajo, con los demás
     mandos, y los tres quedan visibles todo el partido — solo el que sirve en
     el momento está habilitado, así nunca hay duda de cuál apretar. Son tres
     botones distintos (Tiro / Bandeja / Slam Dunk) y no dos: el tiro inicial
     ya no comparte gesto con la bandeja, aunque las dos sean "lanzar". */
  const cont = showGameControls(`
    <div class="game-hint" id="bbHint">¡Encesta en el momento justo!</div>
    <div class="gbtn-row3">
      <button class="gbtn gbtn-lg" id="btnShoot">🏀 Tiro</button>
      <button class="gbtn gbtn-lg" id="btnLayup">🏀 Bandeja</button>
      <button class="gbtn gbtn-lg" id="btnDunk">🔥 Slam Dunk</button>
    </div>
  `);
  bb.hintEl = cont.querySelector('#bbHint');
  wireGameButton(cont.querySelector('#btnShoot'), () => bbPress('shot'));
  wireGameButton(cont.querySelector('#btnLayup'), () => bbPress('layup'));
  wireGameButton(cont.querySelector('#btnDunk'), () => bbPress('dunk'));
  bbSyncButtons();

  bb.raf = requestAnimationFrame(bbLoop);
}

/* Cada botón solo responde en su propia etapa: Tiro en 'aim', Bandeja/Slam Dunk
   en 'jump_aim' con el jumpKind que corresponda. El disabled del HTML ya
   bloquea el pointerdown del que no toca, esto es la segunda capa de
   seguridad. */
function bbPress(which){
  if (!bb) return;
  if (bb.state === 'aim' && which === 'shot'){ resolveShot(); return; }
  if (bb.state === 'jump_aim' && bb.jumpKind === which){ resolveJumpShot(true); return; }
}

function bbSyncButtons(){
  if (!bb) return;
  const cont = document.getElementById('gameControls');
  const shootBtn = cont.querySelector('#btnShoot');
  const layupBtn = cont.querySelector('#btnLayup');
  const dunkBtn = cont.querySelector('#btnDunk');
  if (!shootBtn || !layupBtn || !dunkBtn) return;
  const shootOn = bb.state === 'aim';
  const layupOn = bb.state === 'jump_aim' && bb.jumpKind === 'layup';
  const dunkOn = bb.state === 'jump_aim' && bb.jumpKind === 'dunk';
  shootBtn.disabled = !shootOn;
  layupBtn.disabled = !layupOn;
  dunkBtn.disabled = !dunkOn;
  if (bb.hintEl){
    bb.hintEl.textContent =
      shootOn ? '¡Encesta en el momento justo!' :
      layupOn ? '¡Suéltala arriba de la parábola!' :
      dunkOn ? '¡Clávala al caer!' :
      '';
  }
}

function resolveShot(){
  if (!bb || bb.state !== 'aim' || activeMinigame !== 'basketball') return;
  const diff = BB_DIFFICULTY[bb.shot];
  const h = bbBallHeight(bb.phase);
  const aim = { x: bb.ballX, y: bb.ballBottomY - h*(bb.ballBottomY-bb.ballTopY) };

  if (h < diff.near){
    // "No alcanza": normalmente no pasa nada, pero hay una chance de que la
    // pelota se pinche ahí mismo y listo, se acabó la partida.
    bb.popped = Math.random() < BB_POP_CHANCE;
    const shortX = bb.monoX + (bb.hoopX-bb.monoX) * (0.35 + h*0.25);
    bbGoToFlight(aim, { x: shortX, y: bb.groundY-30 }, { x: shortX+10, y: bb.groundY },
      bb.popped ? '¡Se pinchó la pelota!' : 'No alcanza', bb.popped ? '💥' : '💨', 0);
    return;
  }

  if (h >= diff.peak){
    // Switch: casi siempre entra derecho. La chance de rebotar igual es la
    // que lo hace interesante — ni un tiro perfecto es 100% seguro.
    if (Math.random() < BB_REBOUND_CHANCE[bb.shot]){
      bbGoToRebound(aim, 'swish');
      return;
    }
    bbGoToFlight(aim, { x: bb.hoopX, y: bb.hoopY-4 }, { x: bb.hoopX, y: bb.hoopY+18 },
      '¡SWISH!', '🏀', BB_POINTS.swish);
    return;
  }

  // Toca el aro (near <= h < peak): ya no es "0 puntos" — siempre pasa a Bandeja.
  bbGoToRebound(aim, 'rim');
}

/* Comparte la animación de "toca el aro y sale disparada" con lo que antes era
   el resultado final de esa zona; ahora en vez de terminar en 'result' arranca
   la cadena de Bandeja al llegar al 'settle'. */
function bbGoToRebound(aim, chain){
  bb.chain = chain;
  bb.pendingJump = 'layup';
  bbGoToFlight(aim, { x: bb.hoopX, y: bb.hoopY-2 }, { x: bb.hoopX-30, y: bb.hoopY+26 },
    'Rebota…', '〰️', null);
}

function bbGoToFlight(from, flightTo, settleTo, text, fx, points){
  if (points !== null){
    bb.score += points;
    bb.resultText = points > 0 ? `${text} (+${points})` : text;
  } else {
    bb.resultText = text;   // resultado provisorio, todavía no hay puntos definidos
  }
  bb.state = 'flight';
  bb.flightStart = performance.now();
  bb.flightFrom = from;
  bb.flightTo = flightTo;
  bb.settleFrom = flightTo;
  bb.settleTo = settleTo;
  floatFx(fx);
}

/* Arranca la aproximación hacia el aro antes de saltar. Se llama al terminar el
   'settle' de un rebote (ver bbLoop) o al terminar el de un salto fallido que
   igual sigue la cadena (no aplica hoy, pero deja el gancho listo). */
function bbStartApproach(kind){
  bb.jumpKind = kind;
  bb.approachFrom = bb.monoAtX ?? bb.monoX;
  bb.approachTo = kind === 'layup' ? bb.layupX : bb.dunkX;
  bb.approachStart = performance.now();
  bb.state = 'approach';
}

/* Configuración del salto activo: bandeja o slam dunk. Una sola función para
   no repetir el if/else en cada lugar que necesita duración/ventana/altura. */
function bbJumpCfg(){
  return bb.jumpKind === 'layup'
    ? { durationMs: BB_LAYUP_JUMP_MS, window: BB_LAYUP_WINDOW, arcPx: bb.h * BB_LAYUP_ARC_FRAC }
    : { durationMs: BB_DUNK_JUMP_MS, window: BB_DUNK_WINDOW, arcPx: bb.h * BB_DUNK_ARC_FRAC };
}

/* Posición del monito durante el salto: una parábola real (misma forma que
   bbArcPos), de una sola pasada — no un oscilador que sube y baja sin fin. La
   bandeja además avanza en x (BB_LAYUP_DX_FRAC): "salta en una parábola hacia
   la derecha". El slam dunk salta derecho hacia arriba (jumpToX === jumpFromX). */
function bbJumpPos(t){
  const cfg = bbJumpCfg();
  const x = bb.jumpFromX + (bb.jumpToX - bb.jumpFromX) * t;
  const y = bb.groundY - cfg.arcPx * 4 * t * (1-t);
  return { x, y };
}

function bbStartJumpAim(){
  bb.jumpFromX = bb.approachTo;
  bb.jumpToX = bb.jumpKind === 'layup' ? bb.approachTo + bb.w * BB_LAYUP_DX_FRAC : bb.approachTo;
  bb.jumpStart = performance.now();
  bb.state = 'jump_aim';
  bbSyncButtons();
}

/* pressed=true cuando lo llama bbPress (el jugador apretó el botón).
   pressed=false cuando lo llama bbLoop porque el salto terminó y nadie
   apretó a tiempo: "pasado ese tiempo se cancela". Apretar fuera de la
   ventana falla igual que no apretar — solo cuenta un toque dentro de ella. */
function resolveJumpShot(pressed){
  if (!bb || bb.state !== 'jump_aim') return;
  const cfg = bbJumpCfg();
  const t = Math.min(1, (performance.now() - bb.jumpStart) / cfg.durationMs);
  const pos = bbJumpPos(t);
  const handPos = { x: pos.x, y: pos.y - 34 };
  const hit = pressed && t >= cfg.window[0] && t <= cfg.window[1];

  if (!hit){
    // Falló el salto: nada de vuelo vistoso, solo un rebote cortito hacia abajo.
    bbGoToFlight(handPos, { x: pos.x+8, y: bb.groundY-6 }, { x: pos.x+8, y: bb.groundY },
      bb.jumpKind === 'layup' ? 'No alcanzó la bandeja' : 'Falló el slam dunk', '💨', 0);
    bb.jumpKind = null;
    return;
  }

  if (bb.jumpKind === 'layup' && Math.random() < BB_REBOUND_CHANCE[bb.shot]){
    // La bandeja también rebota: sube la apuesta al slam dunk.
    bbGoToFlight(handPos, { x: bb.hoopX, y: bb.hoopY-2 }, { x: bb.hoopX-24, y: bb.hoopY+20 },
      'Rebota…', '〰️', null);
    bb.pendingJump = 'dunk';
    return;
  }

  const points = BB_POINTS[bb.jumpKind][bb.chain];
  const text = bb.jumpKind === 'layup' ? '¡BANDEJA!' : '¡SLAM DUNK!';
  bbGoToFlight(handPos, { x: bb.hoopX, y: bb.hoopY-4 }, { x: bb.hoopX, y: bb.hoopY+18 },
    text, bb.jumpKind === 'dunk' ? '🔥' : '🏀', points);
  bb.jumpKind = null;
}

/* Arco parabólico real: interpola en línea recta entre p0 y p1, y le resta una
   "joroba" que sube en el medio del recorrido y vuelve a 0 en los extremos. */
function bbArcPos(p0, p1, t, arcHeight){
  const x = p0.x + (p1.x-p0.x)*t;
  const straightY = p0.y + (p1.y-p0.y)*t;
  return { x, y: straightY - arcHeight*4*t*(1-t) };
}

function bbLoop(t){
  if (activeMinigame !== 'basketball' || !bb) return;
  const dt = Math.min(0.05, (t - (bb.lastT || t)) / 1000);
  bb.lastT = t;
  const now = performance.now();

  if (bb.state === 'aim'){
    const diff = BB_DIFFICULTY[bb.shot];
    bb.phase += dt * 2.6 * diff.speed * (1 + 0.5*levelT());   // solo la velocidad sube por nivel: el azar ya es bastante
  } else if (bb.state === 'approach'){
    const t2 = Math.min(1, (now - bb.approachStart) / BB_APPROACH_MS);
    bb.monoAtX = bb.approachFrom + (bb.approachTo - bb.approachFrom) * t2;
    if (t2 >= 1) bbStartJumpAim();
  } else if (bb.state === 'jump_aim'){
    // Salto de una sola pasada: si se acaba el tiempo y nadie apretó, se
    // cancela solo — no sigue rebotando a la espera de un botón.
    if (now - bb.jumpStart >= bbJumpCfg().durationMs){
      resolveJumpShot(false);
    }
  } else if (bb.state === 'flight'){
    if (now - bb.flightStart >= BB_FLIGHT_MS){
      bb.state = 'settle';
      bb.settleStart = now;
    }
  } else if (bb.state === 'settle'){
    if (now - bb.settleStart >= BB_SETTLE_MS){
      if (bb.pendingJump){
        // El rebote terminó de animarse: ahí arranca la cadena de verdad.
        const kind = bb.pendingJump;
        bb.pendingJump = null;
        bbStartApproach(kind);
      } else {
        bb.state = 'result';
        bb.resultUntil = now + BB_RESULT_MS;
      }
    }
  } else if (bb.state === 'result'){
    if (now > bb.resultUntil){
      if (bb.popped){
        endBasketballGame();
        return;
      }
      bb.shot += 1;
      bb.chain = null;
      if (bb.shot >= BB_TOTAL_SHOTS){
        endBasketballGame();
        return;
      }
      bb.state = 'aim';
      bb.phase = 0;
    }
  }

  bbSyncButtons();
  drawBasketball();
  bb.raf = requestAnimationFrame(bbLoop);
}

function bbBallPos(){
  if (bb.state === 'aim'){
    const h = bbBallHeight(bb.phase);
    return { x: bb.ballX, y: bb.ballBottomY - h*(bb.ballBottomY-bb.ballTopY) };
  }
  if (bb.state === 'jump_aim'){
    const t = Math.min(1, (performance.now()-bb.jumpStart)/bbJumpCfg().durationMs);
    const pos = bbJumpPos(t);
    return { x: pos.x, y: pos.y - 34 };
  }
  if (bb.state === 'flight'){
    const t = Math.min(1, (performance.now()-bb.flightStart)/BB_FLIGHT_MS);
    const dist = Math.abs(bb.flightTo.x - bb.flightFrom.x);
    const arcHeight = Math.max(24, dist*0.42); // puede salirse por arriba del canvas, no pasa nada
    return bbArcPos(bb.flightFrom, bb.flightTo, t, arcHeight);
  }
  if (bb.state === 'settle'){
    const t = Math.min(1, (performance.now()-bb.settleStart)/BB_SETTLE_MS);
    return {
      x: bb.settleFrom.x + (bb.settleTo.x-bb.settleFrom.x)*t,
      y: bb.settleFrom.y + (bb.settleTo.y-bb.settleFrom.y)*t,
    };
  }
  return bb.settleTo;
}

function drawBasketball(){
  const { ctx, gc } = bb;
  ctx.clearRect(0,0,gc.width,gc.height);

  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Tiro ${Math.min(bb.shot+1, BB_TOTAL_SHOTS)}/${BB_TOTAL_SHOTS}`, 8, 16);
  ctx.textAlign = 'right';
  ctx.fillText(`🏀 ${bb.score}`, gc.width-8, 16);

  ctx.strokeStyle = 'rgba(200,242,194,.25)';
  ctx.beginPath();
  ctx.moveTo(0, bb.groundY+2);
  ctx.lineTo(gc.width, bb.groundY+2);
  ctx.stroke();

  drawHoop(ctx);

  /* A escala 2 (64px) y no al tamaño de la vista normal (96px): en la cancha, con
     el aro al otro extremo, la mascota a 96 se come el cuadro. Sigue siendo una
     escala entera, que es lo que importa. El salto es procedural, no hay sprites
     nuevos: se sube el "suelo" que usa drawPetAt() unos píxeles con la misma
     curva que ya anima la pelota. */
  const mood = debugForcedMood || (state.sick ? 'sick' : 'happy');
  if (bb.state === 'jump_aim'){
    const t = Math.min(1, (performance.now()-bb.jumpStart)/bbJumpCfg().durationMs);
    const pos = bbJumpPos(t);
    drawPetAt(ctx, pos.x, pos.y, mood, 2);
  } else if (bb.state === 'approach'){
    drawPetAt(ctx, bb.monoAtX ?? bb.monoX, bb.groundY, mood, 2);
  } else {
    drawPetAt(ctx, bb.monoX, bb.groundY, mood, 2);
  }

  const ballPos = bbBallPos();
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏀', ballPos.x, ballPos.y);

  if (bb.state === 'result' || (bb.state === 'settle' && bb.resultText)){
    ctx.font = '13px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(bb.resultText, gc.width/2, bb.hoopY + (bb.groundY-bb.hoopY)*0.55);
  }
}

function drawHoop(ctx){
  const x = bb.hoopX, y = bb.hoopY;
  ctx.fillStyle = '#d8d8e0';
  ctx.fillRect(x+16, y-20, 6, 34);
  ctx.strokeStyle = '#ff8a3d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, y, 16, 5, 0, 0, Math.PI*2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.35)';
  ctx.lineWidth = 1;
  for (let i=-1;i<=1;i++){
    ctx.beginPath();
    ctx.moveTo(x+i*10, y+2);
    ctx.lineTo(x+i*6, y+16);
    ctx.stroke();
  }
}

function endBasketballGame(){
  const score = bb ? bb.score : 0;
  const popped = bb ? bb.popped : false;
  if (bb && bb.raf) cancelAnimationFrame(bb.raf);
  bb = null;

  const message = popped
    ? `¡Se pinchó la pelota! ${score} puntos`
    : score > 0 ? `${score} puntos en baloncesto` : 'Ni una… la próxima';

  finishMinigame('basketball', { score, merit: score * 8, energyCost: 16, message });
}

/* ===================== Minijuego 3: reflejos =====================
   Aparecen blancos que duran cada vez menos. Hay que tocar los buenos y NO tocar
   las bombas. Tres cosas empujan la dificultad a la vez: salen más seguido, duran
   menos y crece la proporción de bombas. Tocar el vacío corta el combo, así que
   martillar la pantalla al azar es peor que mirar y elegir. */

const RX_DURATION = 25;
const RX_LIVES = 3;
const RX_RADIUS = 17;
const RX_CHAR = { good:'🎯', gold:'💎', bomb:'💣' };

let rx = null;

function startReflexGame(){
  const { gc, ctx } = enterMinigame('reflex');

  rx = {
    ctx, gc,
    targets: [],
    fx: [],
    score: 0,
    combo: 0,
    bestCombo: 0,
    lives: RX_LIVES,
    timeLeft: RX_DURATION,
    spawnIn: 0.6,
    flash: 0,            // destello rojo al tocar una bomba
    pointer: makeCanvasPointer(gc),
    raf: null,
    lastT: 0,
  };

  rx.onDown = (e) => {
    e.preventDefault();
    rxTap(rx.pointer.at(e));
  };
  gc.addEventListener('pointerdown', rx.onDown);

  say('¡Toca los blancos, esquiva las bombas!');
  rx.raf = requestAnimationFrame(rxLoop);
}

function rxMultiplier(){
  return Math.min(4, 1 + Math.floor(rx.combo / 5));
}

function rxSpawnFx(char, x, y){
  rx.fx.push({ char, x, y, vy: -50, life: 0.55 });
}

/* Busca un hueco donde el blanco nuevo no quede encima de otro: si no encuentra
   uno limpio en unos intentos, igual lo pone (mejor eso que saltarse el spawn). */
function rxPlaceTarget(){
  const gc = rx.gc;
  const minX = RX_RADIUS + 4, maxX = gc.width - RX_RADIUS - 4;
  const minY = RX_RADIUS + 22, maxY = gc.height - RX_RADIUS - 6; // 22 deja libre el HUD
  let x = 0, y = 0;
  for (let intento = 0; intento < 8; intento++){
    x = minX + Math.random()*(maxX - minX);
    y = minY + Math.random()*Math.max(1, maxY - minY);
    const chocado = rx.targets.some(o => Math.hypot(o.x - x, o.y - y) < RX_RADIUS*2.1);
    if (!chocado) break;
  }
  return { x, y };
}

function rxTap(pos){
  if (!rx) return;
  /* De atrás para adelante: el último dibujado es el que se ve arriba. */
  for (let i = rx.targets.length - 1; i >= 0; i--){
    const tg = rx.targets[i];
    if (Math.hypot(tg.x - pos.x, tg.y - pos.y) > RX_RADIUS + 4) continue;

    rx.targets.splice(i, 1);
    if (tg.kind === 'bomb'){
      rx.lives -= 1;
      rx.combo = 0;
      rx.flash = 0.3;
      rxSpawnFx('💥', tg.x, tg.y);
      if (rx.lives <= 0) endReflexGame();
      return;
    }
    rx.combo += 1;
    if (rx.combo > rx.bestCombo) rx.bestCombo = rx.combo;
    rx.score += (tg.kind === 'gold' ? 3 : 1) * rxMultiplier();
    rxSpawnFx(RX_CHAR[tg.kind], tg.x, tg.y);
    return;
  }
  rx.combo = 0; // tocar el vacío corta la racha
}

function rxLoop(t){
  if (activeMinigame !== 'reflex' || !rx) return;
  const dt = Math.min(0.05, (t - (rx.lastT || t)) / 1000);
  rx.lastT = t;
  rx.timeLeft -= dt;
  if (rx.flash > 0) rx.flash -= dt;

  const gc = rx.gc, ctx = rx.ctx;
  const progress = 1 - Math.max(0, rx.timeLeft) / RX_DURATION;

  rx.spawnIn -= dt;
  if (rx.spawnIn <= 0){
    rx.spawnIn = (0.78 - 0.44*progress) * (1 - 0.3*levelT());   // 0.78s → 0.34s entre blancos; -30% en nivel 5
    const ttl = (1.55 - 0.75*progress) * (1 - 0.3*levelT());    // 1.55s → 0.80s de vida; -30% en nivel 5
    const roll = Math.random();
    const bombChance = 0.18 + 0.22*progress + 0.12*levelT();    // 18% → 40% bombas; +12 puntos en nivel 5
    const kind = roll < bombChance ? 'bomb' : (roll > 0.96 ? 'gold' : 'good');
    const { x, y } = rxPlaceTarget();
    rx.targets.push({ x, y, kind, ttl, life: ttl });
  }

  ctx.clearRect(0, 0, gc.width, gc.height);
  if (rx.flash > 0){
    ctx.fillStyle = `rgba(255,70,70,${(rx.flash/0.3)*0.35})`;
    ctx.fillRect(0, 0, gc.width, gc.height);
  }

  for (let i = rx.targets.length - 1; i >= 0; i--){
    const tg = rx.targets[i];
    tg.life -= dt;
    if (tg.life <= 0){
      rx.targets.splice(i, 1);
      if (tg.kind !== 'bomb') rx.combo = 0; // dejar escapar un blanco corta la racha
      continue;
    }

    const restante = tg.life / tg.ttl;
    /* Entra creciendo en los primeros 120ms: da el pulso de "apareció acá". */
    const aparicion = Math.min(1, (tg.ttl - tg.life) / 0.12);
    const r = RX_RADIUS * (0.55 + 0.45*aparicion);

    ctx.beginPath();
    ctx.arc(tg.x, tg.y, r, 0, Math.PI*2);
    ctx.fillStyle = tg.kind === 'bomb' ? 'rgba(255,90,90,.20)' : 'rgba(255,230,109,.18)';
    ctx.fill();

    /* Anillo que se vacía: cuánto queda antes de que desaparezca. */
    ctx.beginPath();
    ctx.arc(tg.x, tg.y, r + 3, -Math.PI/2, -Math.PI/2 + Math.PI*2*restante);
    ctx.strokeStyle = tg.kind === 'bomb' ? '#ff6b6b' : '#ffe66d';
    ctx.lineWidth = 2;
    ctx.stroke();

    drawEmoji(ctx, RX_CHAR[tg.kind], Math.round(r * 1.35), tg.x, tg.y);
  }

  for (let i = rx.fx.length - 1; i >= 0; i--){
    const f = rx.fx[i];
    f.life -= dt;
    if (f.life <= 0){ rx.fx.splice(i, 1); continue; }
    f.y += f.vy * dt;
    ctx.globalAlpha = Math.min(1, f.life * 2);
    drawEmoji(ctx, f.char, 16, f.x, f.y);
  }
  ctx.globalAlpha = 1;

  ctx.font = '11px monospace';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.fillText('🎯 ' + rx.score, 8, 16);
  ctx.textAlign = 'center';
  if (rx.combo >= 2){
    ctx.fillStyle = rxMultiplier() > 1 ? '#ffe66d' : 'rgba(255,255,255,.7)';
    ctx.fillText(`combo ${rx.combo}  x${rxMultiplier()}`, gc.width/2, 16);
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fff';
  ctx.fillText('❤️'.repeat(Math.max(0, rx.lives)) + '  ' + Math.max(0, rx.timeLeft).toFixed(0) + 's', gc.width - 8, 16);

  if (rx.timeLeft <= 0){ endReflexGame(); return; }
  rx.raf = requestAnimationFrame(rxLoop);
}

function rxDispose(){
  if (!rx) return;
  rx.gc.removeEventListener('pointerdown', rx.onDown);
  rx.pointer.dispose();
  if (rx.raf) cancelAnimationFrame(rx.raf);
}
minigameDisposers.push(() => { rxDispose(); rx = null; });

function endReflexGame(){
  const score = rx ? rx.score : 0;
  const bestCombo = rx ? rx.bestCombo : 0;
  const sinVidas = rx ? rx.lives <= 0 : false;
  rxDispose();
  rx = null;

  const message = sinVidas
    ? `¡Boom! ${score} pts (combo ${bestCombo})`
    : `${score} pts (combo ${bestCombo})`;

  finishMinigame('reflex', { score, merit: score * 0.5, energyCost: 20, message });
}


/* ===================== Sonidos compartidos ===================== */

/* Escala de Si menor natural (B, C♯, D, E, F♯, G, A) recorrida desde el 7º
   grado: A, B, C♯, D, E, F♯, G, A, B. Nueve notas, una octava y dos, todas en
   un registro que el parlante de un teléfono reproduce bien (440-988 Hz; abajo
   de ~400 Hz un celular casi no suena). Cada carril se queda con tres notas
   seguidas: izquierda las graves, medio las del medio, derecha las agudas, así
   la altura del sonido coincide con la posición en pantalla.

   Los cuatro índices de arriba (9..12) no los toca ninguna nota del chart:
   existen solo para que el acorde de "perfecto" (grados i, i+2, i+4 — la nota
   con su 3ª y su 5ª) también cierre bien en las notas más altas. Sin ellos
   habría que dar la vuelta al arreglo y las tríadas de arriba quedaban en
   octavas dobladas en vez de acordes completos. */
const SFX_SCALE = [
  440.00,   // 0  A4  ┐
  493.88,   // 1  B4  ├ carril izquierdo
  554.37,   // 2  C#5 ┘
  587.33,   // 3  D5  ┐
  659.25,   // 4  E5  ├ carril del medio
  739.99,   // 5  F#5 ┘
  783.99,   // 6  G5  ┐
  880.00,   // 7  A5  ├ carril derecho
  987.77,   // 8  B5  ┘
  1108.73,  // 9  C#6 ┐
  1174.66,  // 10 D6  ├ solo para completar las tríadas de las notas de arriba
  1318.51,  // 11 E6  │
  1479.98,  // 12 F#6 ┘
];

/* Fallo: el tritono contra la tónica (Fa natural con Si), la única cosa acá
   adentro que está fuera de escala a propósito — no hay forma de confundirlo
   con un acierto ni de que suene "bien por casualidad". */
function sfxFail(){
  beep(349.23, 140, 'sawtooth', 0.10);  // F4
  beep(493.88, 140, 'sawtooth', 0.07);  // B4
}


/* ===================== Minijuego 4: torre de cajas =====================
   Una caja va y viene por arriba de la torre; se suelta tocando (la pantalla
   o el botón) y lo que quede fuera de la caja de abajo se corta y se cae, así
   que la torre se va angostando. Soltarla casi justo encima (TW_PERFECT) es
   "¡perfecto!": no se corta nada, suma el doble y, con tres seguidos, la caja
   vuelve a ensancharse un poco. Se pierde al soltarla del todo afuera.

   Cada caja va un poco más rápido. Todo se mide en fracciones del canvas, así
   la dificultad es la misma en un teléfono chico y en uno grande.

   La lógica (twNew/twStep/twDrop) no toca el DOM ni el canvas: así un bot
   puede jugar cientos de partidas para calibrar el mérito (ver twMerit). */

const TW_START_W = 0.42;     // ancho de la primera caja, fracción del canvas
const TW_PERFECT = 0.013;    // tolerancia del perfecto, fracción del canvas (~4 px en 330)
const TW_GROW_AFTER = 3;     // perfectos seguidos para que la caja vuelva a crecer
const TW_SPEED = [0.42, 0.03, 1.5];   // fracciones del ancho por segundo: base, por caja, tope
const TW_PET_SCALE = 2;      // entero, igual que pixelScale()
const TW_BOX_COLORS = [['#d39a5c', '#e8b57d'], ['#e07a5f', '#f2a488'], ['#7fb3d5', '#a9cfe8'],
  ['#8fcf7f', '#b5e3a8'], ['#c39bd3', '#dcc0e6'], ['#f2c14e', '#f7d98a']];

let tw = null;

function twSpeed(s){
  return s.w * Math.min(TW_SPEED[2], TW_SPEED[0] + TW_SPEED[1] * s.n) * (1 + 0.45 * s.lt);
}

/* Estado inicial de una partida. `lt` es levelT() (0 en nivel 1, 1 en el
   máximo): en el nivel más difícil la primera caja es más angosta y todo va
   45% más rápido. */
function twNew(w, h, lt){
  const bw = w * (TW_START_W - 0.08 * lt);
  const s = { w, h, lt, n: 0, score: 0, perfects: 0, streak: 0, bestStreak: 0,
    startW: bw, over: false, falling: [], last: null };
  s.stack = [{ x: (w - bw) / 2, w: bw }];
  twNextBox(s);
  return s;
}

/* La caja siguiente entra por el costado, alternando, con el ancho de la de
   arriba de la torre. */
function twNextBox(s){
  const top = s.stack[s.stack.length - 1];
  const left = s.n % 2 === 0;
  s.cur = { x: left ? 0 : s.w - top.w, w: top.w, dir: left ? 1 : -1 };
}

function twStep(s, dt){
  if (s.over) return;
  const c = s.cur;
  c.x += c.dir * twSpeed(s) * dt;
  if (c.x < 0){ c.x = -c.x; c.dir = 1; }
  if (c.x + c.w > s.w){ c.x = 2 * (s.w - c.w) - c.x; c.dir = -1; }
}

/* Suelta la caja. Devuelve 'perfect', 'cut' o 'miss' (y deja en s.last el
   pedazo que se cae, para que el dibujo lo anime). */
function twDrop(s){
  if (s.over) return null;
  const c = s.cur, top = s.stack[s.stack.length - 1];
  const l = Math.max(c.x, top.x), r = Math.min(c.x + c.w, top.x + top.w);
  if (r - l <= 0){
    s.over = true;
    s.last = { kind: 'miss', piece: { x: c.x, w: c.w } };
    return 'miss';
  }
  s.n += 1;
  if (Math.abs(c.x - top.x) <= s.w * TW_PERFECT){
    s.streak += 1;
    s.perfects += 1;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
    s.score += 2;
    let w = top.w, x = top.x;
    /* Racha de perfectos: la caja recupera un poco de ancho, sin pasarse del
       de la primera. Se ensancha hacia los dos lados y no se sale del canvas. */
    if (s.streak >= TW_GROW_AFTER){
      const extra = Math.min(s.startW - w, s.w * 0.03);
      if (extra > 0){ w += extra; x = Math.min(s.w - w, Math.max(0, x - extra / 2)); }
    }
    s.stack.push({ x, w });
    s.last = { kind: 'perfect', piece: null };
  } else {
    s.streak = 0;
    s.score += 1;
    const piece = c.x < top.x ? { x: c.x, w: top.x - c.x } : { x: r, w: c.x + c.w - r };
    s.stack.push({ x: l, w: r - l });
    s.last = { kind: 'cut', piece };
  }
  twNextBox(s);
  return s.last.kind;
}

/* Calibrado con un bot que suelta con un error de tiempo normal (contra el
   instante en que la caja pasa justo encima), 400 partidas en nivel 1 sobre
   un canvas de 330x300: un bot "bueno" (σ = 55 ms) saca mediana 20 (p10 15,
   p90 27) y uno "experto" (σ = 30 ms) 38 (p10 29, p90 48). Con merit =
   score * 2 quedan en ~40 y ~76, en línea con los otros juegos (~45 =
   partida muy buena). */
function twMerit(score){ return score * 2; }

function startTowerGame(){
  const { gc, ctx } = enterMinigame('torre');
  tw = Object.assign(twNew(gc.width, gc.height, levelT()), {
    ctx, gc, raf: null, lastT: 0, camY: 0, flash: 0, label: null, endAt: 0,
    bh: Math.max(12, Math.min(22, Math.round(gc.height * 0.05))),
  });
  const cont = showGameControls(`
    <div class="game-hint">Suelta la caja justo encima de la torre</div>
    <button class="gbtn gbtn-lg" id="twDropBtn">📦 Soltar</button>
  `);
  wireGameButton(cont.querySelector('#twDropBtn'), twPress);
  tw.onDown = (e) => { e.preventDefault(); twPress(); };
  gc.addEventListener('pointerdown', tw.onDown);
  tw.onKey = (e) => { if (e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); twPress(); } };
  window.addEventListener('keydown', tw.onKey);
  say('¡Apila las cajas!');
  tw.raf = requestAnimationFrame(twLoop);
}

function twPress(){
  if (!tw || tw.over) return;
  const res = twDrop(tw);
  const k = tw.bh;
  if (res === 'perfect'){
    tw.label = { text: tw.streak >= 2 ? `¡perfecto x${tw.streak}!` : '¡perfecto!', t: 0.8 };
    tone({ freq: SFX_SCALE[Math.min(12, 4 + tw.streak)], durationMs: 140, type: 'triangle', vol: 0.1 });
  } else if (res === 'cut'){
    tone({ freq: 440, durationMs: 70, type: 'square', vol: 0.06 });
  } else if (res === 'miss'){
    tw.flash = 0.35;
    tw.endAt = performance.now() + 1100;
    sfxFail();
  }
  /* El pedazo cortado se cae girando. Su alto en el mundo es el de la caja
     que se acaba de poner (o la que no llegó a ponerse). */
  if (tw.last && tw.last.piece){
    const level = tw.stack.length - (res === 'miss' ? 0 : 1);
    tw.falling.push({ ...tw.last.piece, y: level * k, vy: 0, rot: 0,
      vr: (tw.last.piece.x < tw.w / 2 ? -1 : 1) * 3, color: twColor(level) });
  }
}

function twColor(i){ return TW_BOX_COLORS[i % TW_BOX_COLORS.length]; }

/* Una caja de cartón en pixel art: contorno, cara, una fila de brillo y la
   cinta del medio. y = borde de arriba, en píxeles del canvas. */
function twDrawBox(ctx, x, y, w, h, color){
  x = Math.round(x); y = Math.round(y); w = Math.round(w);
  if (w < 1) return;
  ctx.fillStyle = '#2b1b2e'; ctx.fillRect(x, y, w, h);
  if (w <= 2) return;
  ctx.fillStyle = color[0]; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = color[1]; ctx.fillRect(x + 1, y + 1, w - 2, 2);
  if (w > 10){ ctx.fillStyle = 'rgba(255,240,200,.55)'; ctx.fillRect(x + Math.floor(w / 2) - 1, y + 1, 3, h - 2); }
}

function twLoop(t){
  if (activeMinigame !== 'torre' || !tw) return;
  const dt = Math.min(0.05, (t - (tw.lastT || t)) / 1000);
  tw.lastT = t;
  twStep(tw, dt);
  if (tw.flash > 0) tw.flash -= dt;
  if (tw.label){ tw.label.t -= dt; if (tw.label.t <= 0) tw.label = null; }

  const { ctx, gc, bh } = tw;
  const ground = gc.height - 6;
  /* La cámara sube para que la punta de la torre quede a media pantalla. */
  const want = Math.max(0, tw.stack.length * bh - gc.height * 0.5);
  tw.camY += (want - tw.camY) * Math.min(1, dt * 6);
  const yOf = level => ground - level * bh + tw.camY;   // borde de arriba de la caja `level` (0 = la base)

  ctx.clearRect(0, 0, gc.width, gc.height);
  if (tw.flash > 0){ ctx.fillStyle = `rgba(255,70,70,${tw.flash})`; ctx.fillRect(0, 0, gc.width, gc.height); }
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  ctx.fillRect(0, ground + tw.camY, gc.width, 2);

  /* La mascota mira desde abajo a la izquierda, fija (no sube con la cámara):
     contenta con un perfecto, triste al perder. */
  const mood = tw.over ? 'sad' : tw.label ? 'happy' : 'normal';
  drawPetAt(ctx, 34, gc.height - 2, mood, TW_PET_SCALE);

  /* Solo las cajas que se ven. */
  for (let i = 0; i < tw.stack.length; i++){
    const y = yOf(i + 1);
    if (y > gc.height || y + bh < 0) continue;
    const b = tw.stack[i];
    twDrawBox(ctx, b.x, y, b.w, bh, twColor(i));
  }
  if (!tw.over) twDrawBox(ctx, tw.cur.x, yOf(tw.stack.length + 1), tw.cur.w, bh, twColor(tw.stack.length));

  for (let i = tw.falling.length - 1; i >= 0; i--){
    const p = tw.falling[i];
    p.vy += 900 * dt;
    p.y -= p.vy * dt;
    p.rot += p.vr * dt;
    const y = ground - p.y - bh + tw.camY;
    if (y > gc.height + 40){ tw.falling.splice(i, 1); continue; }
    ctx.save();
    ctx.translate(p.x + p.w / 2, y + bh / 2);
    ctx.rotate(p.rot);
    twDrawBox(ctx, -p.w / 2, -bh / 2, p.w, bh, p.color);
    ctx.restore();
  }

  ctx.font = '11px monospace';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.fillText('📦 ' + tw.score, 8, 16);
  ctx.textAlign = 'right';
  ctx.fillText(`${tw.n} cajas`, gc.width - 8, 16);
  if (tw.label){
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe66d';
    ctx.fillText(tw.label.text, gc.width / 2, 34);
  }

  if (tw.over && performance.now() >= tw.endAt){ endTowerGame(); return; }
  tw.raf = requestAnimationFrame(twLoop);
}

function twDispose(){
  if (!tw) return;
  tw.gc.removeEventListener('pointerdown', tw.onDown);
  window.removeEventListener('keydown', tw.onKey);
  if (tw.raf) cancelAnimationFrame(tw.raf);
}
minigameDisposers.push(() => { twDispose(); tw = null; });

function endTowerGame(){
  const score = tw ? tw.score : 0;
  const n = tw ? tw.n : 0;
  const best = tw ? tw.bestStreak : 0;
  twDispose();
  tw = null;
  const message = n > 0 ? `${n} cajas · ${best > 1 ? `racha de ${best} perfectos` : 'sin rachas'}` : 'Se cayó la primera…';
  finishMinigame('torre', { score, merit: twMerit(score), energyCost: 16, message });
}

/* ===================== Minijuego 5: salto al cielo =====================
   La mascota rebota sola de nube en nube y hay que llevarla de lado a lado
   (deslizador abajo, arrastrando el dedo sobre el juego, o flechas) para que
   caiga sobre la siguiente. Se acaba cuando se cae por abajo de la pantalla,
   o a los SK_DURATION segundos: sin ese tope una partida buena no terminaba
   nunca (con un tope de 45 s, en cambio, el que juega bien y el que juega
   mejor sacaban casi lo mismo: subir más rápido lo limita la física, lo que
   separa a uno de otro es cuánto aguanta sin caerse).

   Tres nubes: la normal, la que se mueve de lado y la gris, que aguanta un
   solo rebote y se deshace. En algunas hay una estrella (+SK_STAR_PTS) y muy
   de vez en cuando un globo, que la lanza mucho más alto. Mientras más sube,
   más separadas, más chicas y más nubes raras.

   Todo se mide en fracciones del alto del canvas (SK_*_H), así un salto cubre
   lo mismo en cualquier pantalla. Lógica (skNew/skStep) sin DOM, como la
   Torre, para poder calibrarla con un bot. */

const SK_DURATION = 90;
const SK_GRAVITY_H = 2.4;     // alto del canvas por segundo²
const SK_JUMP_H = 0.30;       // alto de un rebote normal (fracción del canvas): medio segundo de subida
const SK_BALLOON_MULT = 2.6;  // el globo lanza 2.6 veces más alto
const SK_MOVE_W = 1.6;        // velocidad de lado, anchos de canvas por segundo
const SK_HALF_W = 14;         // media anchura de los pies de la mascota a escala 2, px
const SK_STAR_PTS = 5;
const SK_PET_SCALE = 2;       // entero, igual que pixelScale()

let sk = null;

function skJumpV(s, mult = 1){ return Math.sqrt(2 * s.g * s.h * SK_JUMP_H * mult); }

/* Cuánto subió, de 0 a 1 en 10 pantallas: con eso crece la dificultad. */
function skProgress(s){ return Math.min(1, (s.startY - s.topY) / (s.h * 10)); }

function skNew(w, h, lt){
  const s = { w, h, lt, g: SK_GRAVITY_H * h, time: SK_DURATION, over: false, fell: false,
    x: w / 2, targetX: w / 2, plats: [], items: [], stars: 0, score: 0, bounces: 0 };
  s.y = s.startY = s.topY = h * 0.92;
  s.vy = -skJumpV(s);
  s.camY = 0;
  /* La primera nube es el piso: ancha, quieta, justo debajo. */
  s.plats.push({ x: w / 2, y: s.startY, w: w * 0.9, kind: 'n', vx: 0 });
  s.genY = s.startY;
  skFill(s);
  return s;
}

/* Arma nubes hasta una pantalla por encima de la cámara. Nunca más separadas
   que el 85% de un salto: siempre hay a dónde llegar. */
function skFill(s){
  while (s.genY > s.camY - s.h){
    const p = skProgress(s);
    const gap = s.h * Math.min(SK_JUMP_H * 0.85, (0.12 + 0.11 * p) * (1 + 0.12 * s.lt)) * (0.75 + Math.random() * 0.25);
    s.genY -= gap;
    const pw = Math.max(40, s.w * (0.24 - 0.07 * p) * (1 - 0.15 * s.lt));
    const roll = Math.random();
    const moving = 0.08 + 0.3 * p + 0.12 * s.lt, fragile = 0.04 + 0.16 * p + 0.1 * s.lt;
    const kind = roll < moving ? 'm' : roll < moving + fragile ? 'f' : 'n';
    const x = pw / 2 + Math.random() * (s.w - pw);
    const plat = { x, y: s.genY, w: pw, kind, vx: kind === 'm' ? (Math.random() < 0.5 ? -1 : 1) * s.w * (0.18 + 0.2 * p) : 0 };
    s.plats.push(plat);
    const r = Math.random();
    if (kind !== 'f' && r < 0.04) s.items.push({ x, y: s.genY, kind: 'balloon', plat });
    else if (r < 0.28) s.items.push({ x: x + (Math.random() - 0.5) * pw * 0.5, y: s.genY - s.h * 0.12, kind: 'star' });
  }
}

/* Un paso de física. Devuelve lo que pasó en este paso (para el sonido). */
function skStep(s, dt){
  if (s.over) return null;
  let ev = null;
  s.time -= dt;
  /* De lado: va hacia donde apunta el deslizador, con velocidad tope. */
  const maxDx = s.w * SK_MOVE_W * dt;
  s.x += Math.max(-maxDx, Math.min(maxDx, s.targetX - s.x));
  s.x = Math.max(SK_HALF_W, Math.min(s.w - SK_HALF_W, s.x));
  for (const p of s.plats){
    if (!p.vx) continue;
    p.x += p.vx * dt;
    if (p.x < p.w / 2){ p.x = p.w / 2; p.vx = -p.vx; }
    if (p.x > s.w - p.w / 2){ p.x = s.w - p.w / 2; p.vx = -p.vx; }
  }
  const prevY = s.y;
  s.vy += s.g * dt;
  s.y += s.vy * dt;
  if (s.vy > 0){
    for (const p of s.plats){
      if (p.gone || prevY > p.y || s.y < p.y || Math.abs(s.x - p.x) > p.w / 2 + SK_HALF_W * 0.6) continue;
      s.y = p.y;
      const balloon = s.items.find(it => it.kind === 'balloon' && it.plat === p && !it.taken);
      if (balloon){ balloon.taken = true; s.vy = -skJumpV(s, SK_BALLOON_MULT); ev = 'balloon'; }
      else { s.vy = -skJumpV(s); ev = ev || 'bounce'; }
      if (p.kind === 'f'){ p.gone = true; ev = 'break'; }
      s.bounces += 1;
      break;
    }
  }
  for (const it of s.items){
    if (it.taken || it.kind !== 'star') continue;
    if (Math.abs(it.x - s.x) < 18 && s.y - 40 < it.y && s.y + 4 > it.y){ it.taken = true; s.stars += 1; ev = 'star'; }
  }
  s.topY = Math.min(s.topY, s.y);
  /* La cámara solo sube: si la mascota pasa del 42% de la pantalla, la sigue. */
  s.camY = Math.min(s.camY, s.y - s.h * 0.42);
  s.plats = s.plats.filter(p => p.y < s.camY + s.h + 30);
  s.items = s.items.filter(it => it.y < s.camY + s.h + 30);
  skFill(s);
  s.score = Math.floor((s.startY - s.topY) / (s.h * 0.05)) + s.stars * SK_STAR_PTS;
  if (s.y - s.camY > s.h + 30){ s.over = true; s.fell = true; ev = 'fall'; }
  else if (s.time <= 0){ s.over = true; }
  return ev;
}

/* Calibrado con bots que en cada rebote eligen una nube de las que están más
   arriba y al alcance, con un error de puntería normal y alguna distracción
   (400 partidas en nivel 1, canvas de 330x300). El "bueno" apunta a la más
   cercana (σ 16 px, 25% de distracción): mediana 287 (p10 145, p90 505). El
   "experto" busca la más alta (σ 7 px, 5%) y casi siempre llega al tope de
   tiempo: mediana 568. Con merit = score * 0.14 quedan en ~40 y ~80. */
function skMerit(score){ return score * 0.14; }

function startSkyGame(){
  const { gc, ctx } = enterMinigame('cielo');
  sk = Object.assign(skNew(gc.width, gc.height, levelT()), {
    ctx, gc, raf: null, lastT: 0, keys: { left: false, right: false }, fx: [], endAt: 0,
  });
  const onKey = (down) => (e) => {
    if (e.key === 'ArrowLeft'  || e.key === 'a') sk.keys.left = down;
    if (e.key === 'ArrowRight' || e.key === 'd') sk.keys.right = down;
  };
  sk.onKeyDown = onKey(true);
  sk.onKeyUp = onKey(false);
  window.addEventListener('keydown', sk.onKeyDown);
  window.addEventListener('keyup', sk.onKeyUp);
  const cont = showGameControls(`
    <div class="game-hint">Llévala de lado a lado para caer en las nubes</div>
    <input type="range" class="game-slider" id="skSlider" min="0" max="1000" value="500">
  `);
  sk.slider = cont.querySelector('#skSlider');
  sk.onSlide = () => { sk.targetX = SK_HALF_W + (sk.w - 2 * SK_HALF_W) * (+sk.slider.value / 1000); };
  sk.slider.addEventListener('input', sk.onSlide);
  /* También se puede arrastrar el dedo sobre la pantalla del juego. */
  sk.pointer = makeCanvasPointer(gc);
  sk.onDrag = (e) => {
    if (e.type === 'pointermove' && !e.buttons && e.pointerType === 'mouse') return;
    e.preventDefault();
    sk.targetX = sk.pointer.at(e).x;
    sk.slider.value = Math.round((sk.targetX - SK_HALF_W) / (sk.w - 2 * SK_HALF_W) * 1000);
  };
  gc.addEventListener('pointerdown', sk.onDrag);
  gc.addEventListener('pointermove', sk.onDrag);
  say('¡Sube por las nubes!');
  sk.raf = requestAnimationFrame(skLoop);
}

function skDrawCloud(ctx, x, y, w, kind, alpha){
  /* Nube en pixel art: un óvalo achatado de bloques, con su borde. */
  const h = 8, x0 = Math.round(x - w / 2), y0 = Math.round(y);
  const body = kind === 'f' ? '#a9a3b8' : kind === 'm' ? '#cfe9ff' : '#ffffff';
  const edge = kind === 'f' ? '#6d6680' : '#7a8fb0';
  ctx.globalAlpha = alpha;
  ctx.fillStyle = edge;
  ctx.fillRect(x0 + 2, y0, Math.round(w) - 4, h);
  ctx.fillRect(x0, y0 + 2, Math.round(w), h - 4);
  ctx.fillStyle = body;
  ctx.fillRect(x0 + 3, y0 + 1, Math.round(w) - 6, h - 2);
  ctx.fillRect(x0 + 1, y0 + 3, Math.round(w) - 2, h - 6);
  /* Bultitos de arriba. */
  ctx.fillStyle = edge;
  ctx.fillRect(x0 + Math.round(w * 0.25), y0 - 3, Math.round(w * 0.2), 4);
  ctx.fillRect(x0 + Math.round(w * 0.55), y0 - 2, Math.round(w * 0.18), 3);
  ctx.fillStyle = body;
  ctx.fillRect(x0 + Math.round(w * 0.25) + 1, y0 - 2, Math.round(w * 0.2) - 2, 4);
  ctx.fillRect(x0 + Math.round(w * 0.55) + 1, y0 - 1, Math.round(w * 0.18) - 2, 3);
  ctx.globalAlpha = 1;
}

function skLoop(t){
  if (activeMinigame !== 'cielo' || !sk) return;
  const dt = Math.min(0.05, (t - (sk.lastT || t)) / 1000);
  sk.lastT = t;
  if (sk.keys.left || sk.keys.right){
    sk.targetX = sk.x + (sk.keys.right ? 1 : -1) * sk.w * 0.2;
    sk.slider.value = Math.round((Math.max(SK_HALF_W, Math.min(sk.w - SK_HALF_W, sk.targetX)) - SK_HALF_W) / (sk.w - 2 * SK_HALF_W) * 1000);
  }
  const ev = skStep(sk, dt);
  if (ev === 'bounce') tone({ freq: 587.33, durationMs: 60, type: 'triangle', vol: 0.05 });
  else if (ev === 'star'){ tone({ freq: 1318.51, durationMs: 120, type: 'triangle', vol: 0.08 }); sk.fx.push({ char: '⭐', x: sk.x, y: sk.y - 50, life: 0.6 }); }
  else if (ev === 'balloon'){ tone({ freq: 880, durationMs: 220, type: 'triangle', vol: 0.09 }); sk.fx.push({ char: '🎈', x: sk.x, y: sk.y - 30, life: 0.8 }); }
  else if (ev === 'break') tone({ freq: 330, durationMs: 90, type: 'sawtooth', vol: 0.05 });
  else if (ev === 'fall') sfxFail();
  if (sk.over && !sk.endAt) sk.endAt = performance.now() + (sk.fell ? 700 : 300);

  const { ctx, gc } = sk;
  const sy = y => y - sk.camY;   // del mundo a la pantalla
  ctx.clearRect(0, 0, gc.width, gc.height);
  /* El cielo se va oscureciendo al subir: se nota cuánto se avanzó. */
  const p = skProgress(sk);
  ctx.fillStyle = `rgba(20,30,90,${(0.05 + 0.3 * p).toFixed(3)})`;
  ctx.fillRect(0, 0, gc.width, gc.height);

  for (const pl of sk.plats){
    if (pl.gone) continue;
    skDrawCloud(ctx, pl.x, sy(pl.y), pl.w, pl.kind, 1);
  }
  for (const it of sk.items){
    if (it.taken) continue;
    if (it.kind === 'star') drawEmoji(ctx, '⭐', 16, it.x, sy(it.y));
    else drawEmoji(ctx, '🎈', 20, it.x, sy(it.y) - 14);
  }
  for (let i = sk.fx.length - 1; i >= 0; i--){
    const f = sk.fx[i];
    f.life -= dt;
    if (f.life <= 0){ sk.fx.splice(i, 1); continue; }
    f.y -= 50 * dt;
    ctx.globalAlpha = Math.min(1, f.life * 2);
    drawEmoji(ctx, f.char, 15, f.x, sy(f.y));
  }
  ctx.globalAlpha = 1;
  drawPetAt(ctx, sk.x, Math.round(sy(sk.y)), sk.fell ? 'sad' : sk.vy < 0 ? 'happy' : 'normal', SK_PET_SCALE);

  ctx.font = '11px monospace';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.fillText('☁️ ' + sk.score, 8, 16);
  ctx.textAlign = 'right';
  ctx.fillText(Math.max(0, sk.time).toFixed(0) + 's', gc.width - 8, 16);

  if (sk.over && performance.now() >= sk.endAt){ endSkyGame(); return; }
  sk.raf = requestAnimationFrame(skLoop);
}

function skDispose(){
  if (!sk) return;
  window.removeEventListener('keydown', sk.onKeyDown);
  window.removeEventListener('keyup', sk.onKeyUp);
  sk.gc.removeEventListener('pointerdown', sk.onDrag);
  sk.gc.removeEventListener('pointermove', sk.onDrag);
  sk.pointer.dispose();
  if (sk.raf) cancelAnimationFrame(sk.raf);
}
minigameDisposers.push(() => { skDispose(); sk = null; });

function endSkyGame(){
  const score = sk ? sk.score : 0;
  const stars = sk ? sk.stars : 0;
  const fell = sk ? sk.fell : false;
  skDispose();
  sk = null;
  const message = (fell ? '¡Se cayó! ' : '¡Tiempo! ') + `${score} pts · ${stars} ⭐`;
  finishMinigame('cielo', { score, merit: skMerit(score), energyCost: 18, message });
}

/* ===================== Minijuego 6: memorice de luces =====================
   Diez luces en posiciones al azar. Se enciende una secuencia y hay que
   repetirla tocándolas en el mismo orden; cada ronda suma una luz más. Un solo
   error termina la partida. */

const MM_LIGHTS = 10;
const MM_START_LEN = 3;
const MM_RADIUS = 16;
const MM_HUD = 22;

let mm = null;

/* Casillas de una rejilla 4x3 barajadas, con la luz corrida al azar dentro de su
   casilla. Sortear posiciones libres y descartar las que se pisan queda lindo en
   el papel pero se amontona: con diez círculos en un canvas chico hay tiradas
   donde no entra ninguna sin solaparse. Así siempre salen diez separadas y
   tocables, y de todos modos cambian de lugar en cada partida. */
function mmPlaceLights(gc){
  const cols = 4, rows = 3;
  const cw = gc.width / cols, ch = (gc.height - MM_HUD) / rows;
  const casillas = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) casillas.push({ c, r });
  for (let i = casillas.length - 1; i > 0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [casillas[i], casillas[j]] = [casillas[j], casillas[i]];
  }
  const jitterX = Math.max(0, cw/2 - MM_RADIUS - 3);
  const jitterY = Math.max(0, ch/2 - MM_RADIUS - 3);
  return casillas.slice(0, MM_LIGHTS).map(({ c, r }) => ({
    x: c*cw + cw/2 + (Math.random()*2 - 1)*jitterX,
    y: MM_HUD + r*ch + ch/2 + (Math.random()*2 - 1)*jitterY,
  }));
}

function startMemoryGame(){
  const { gc, ctx } = enterMinigame('memory');
  mm = {
    ctx, gc,
    lights: mmPlaceLights(gc),
    sequence: [],
    round: 0,
    step: 0,
    phase: 'showing',   // 'showing' | 'input' | 'good' | 'fail'
    lit: -1,
    litUntil: 0,
    wrong: -1,
    timer: 0,
    score: 0,
    pointer: makeCanvasPointer(gc),
    raf: null, lastT: 0,
  };
  mmNextRound();

  mm.onDown = (e) => { e.preventDefault(); mmTap(mm.pointer.at(e)); };
  gc.addEventListener('pointerdown', mm.onDown);

  say('Mira la secuencia y repítela');
  mm.raf = requestAnimationFrame(mmLoop);
}

/* La secuencia crece, no se sortea de nuevo: se apoya en lo que ya memorizaste.
   Rehacerla entera cada ronda sería más difícil pero se siente arbitrario, y a
   la sexta ronda ya nadie la sigue. */
function mmNextRound(){
  mm.round += 1;
  const nuevas = mm.round === 1 ? MM_START_LEN + Math.round(2*levelT()) : 1;   // 3 → 5 luces en nivel 5
  for (let i = 0; i < nuevas; i++){
    mm.sequence.push(Math.floor(Math.random()*mm.lights.length));
  }
  mm.phase = 'showing';
  mm.step = 0;
  mm.lit = -1;
  mm.wrong = -1;
  mm.timer = 600;   // respiro antes de empezar a mostrar
}

function mmTap(pos){
  if (!mm || mm.phase !== 'input') return;
  const i = mm.lights.findIndex(l => Math.hypot(l.x - pos.x, l.y - pos.y) <= MM_RADIUS + 6);
  if (i < 0) return;   // tocar el vacío no cuenta como error, simplemente no pasa nada

  mm.lit = i;
  mm.litUntil = performance.now() + 160;

  if (i !== mm.sequence[mm.step]){
    mm.wrong = i;
    mm.phase = 'fail';
    mm.timer = 950;
    return;
  }
  mm.step += 1;
  mm.score += 1;
  if (mm.step >= mm.sequence.length){
    mm.phase = 'good';
    mm.timer = 550;
  }
}

function mmDraw(){
  const { ctx, gc } = mm;
  ctx.clearRect(0, 0, gc.width, gc.height);

  mm.lights.forEach((l, i) => {
    const encendida = i === mm.lit;
    const fallo = i === mm.wrong;
    ctx.beginPath();
    ctx.arc(l.x, l.y, MM_RADIUS, 0, Math.PI*2);
    ctx.fillStyle = fallo ? 'rgba(255,90,90,.85)'
                  : encendida ? 'rgba(255,230,109,.95)'
                  : 'rgba(200,242,194,.12)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = fallo ? '#ff6b6b' : encendida ? '#fff3b0' : 'rgba(200,242,194,.35)';
    ctx.stroke();
  });

  ctx.font = '11px monospace';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.fillText('💡 ' + mm.score, 8, 16);
  ctx.textAlign = 'right';
  ctx.fillText(`ronda ${mm.round} · ${mm.sequence.length}`, gc.width - 8, 16);

  ctx.textAlign = 'center';
  if (mm.phase === 'showing'){
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.fillText('mirá…', gc.width/2, 16);
  } else if (mm.phase === 'input'){
    ctx.fillStyle = '#ffe66d';
    ctx.fillText(`tu turno  ${mm.step}/${mm.sequence.length}`, gc.width/2, 16);
  } else if (mm.phase === 'fail'){
    ctx.fillStyle = '#ff8f8f';
    ctx.fillText('¡esa no era!', gc.width/2, 16);
  }
}

function mmLoop(t){
  if (activeMinigame !== 'memory' || !mm) return;
  const dtMs = Math.min(120, t - (mm.lastT || t));
  mm.lastT = t;
  mm.timer -= dtMs;

  if (mm.phase === 'showing'){
    /* Acelera con la ronda: la secuencia larga además se muestra más rápido. */
    const rapido = 1 - 0.3*levelT();   // -30% en nivel 5
    const onMs  = Math.max(200, 420 - mm.round*18) * rapido;
    const offMs = Math.max(90,  180 - mm.round*8) * rapido;
    if (mm.timer <= 0){
      if (mm.lit >= 0){
        mm.lit = -1;
        mm.step += 1;
        mm.timer = offMs;
        if (mm.step >= mm.sequence.length){ mm.phase = 'input'; mm.step = 0; }
      } else {
        mm.lit = mm.sequence[mm.step];
        mm.timer = onMs;
      }
    }
  } else if (mm.phase === 'input'){
    if (mm.lit >= 0 && performance.now() >= mm.litUntil) mm.lit = -1;
  } else if (mm.phase === 'good'){
    if (mm.timer <= 0) mmNextRound();
  } else if (mm.phase === 'fail'){
    if (mm.timer <= 0){ endMemoryGame(); return; }
  }

  mmDraw();
  mm.raf = requestAnimationFrame(mmLoop);
}

function mmDispose(){
  if (!mm) return;
  mm.gc.removeEventListener('pointerdown', mm.onDown);
  mm.pointer.dispose();
  if (mm.raf) cancelAnimationFrame(mm.raf);
}
minigameDisposers.push(() => { mmDispose(); mm = null; });

function endMemoryGame(){
  const score = mm ? mm.score : 0;
  const rondas = mm ? mm.round - 1 : 0;   // la ronda en curso no se completó
  mmDispose();
  mm = null;

  const message = rondas > 0 ? `${rondas} rondas · ${score} luces` : 'Se perdió en la primera';
  finishMinigame('memory', { score, merit: score * 1.2, energyCost: 18, message });
}

/* ===================== Minijuego 7 (PRUEBA): combate =====================
   Prototipo para probar el feel de la pelea antes de sumarlo al menú de Jugar.
   Por ahora solo se lanza desde el panel de prueba (dbgCombat). El rival es
   otra especie al azar (nunca la propia) — no hace falta arte nuevo, se
   reusa el mismo drawPetAt() con debugForcedSpecies pisado un instante nada
   más que para dibujar al rival (ver drawCombat()), y se restaura enseguida.

   Mecánica: el rival telegrafía uno de tres ataques (un ícono arriba de su
   cabeza) y hay que responder con el botón que le corresponde antes de que
   se acabe el anillo de tiempo — igual que el resto de los minijuegos, es
   lectura + reacción, no azar. Golpe y agarre solo evitan daño si se
   responden bien (esquivar / bloquear); el ataque lento es el único que,
   bien leído, deja contraatacar y hacerle daño de vuelta al rival. Números
   sin calibrar todavía: es justo lo que hay que probar jugándolo. */

const CB_ROUNDS = 8;
const CB_PLAYER_HP = 3;
const CB_RIVAL_HP = 3;
const CB_IMPACT_MS = 380;   // dura el flash/sacudida/knockback de cada golpe
const CB_END_MS = 1200;

const CB_ATTACKS = {
  golpe:  { icon: '👊', beats: 'esquivar' },
  agarre: { icon: '🤜', beats: 'bloquear' },
  lento:  { icon: '🐢', beats: 'contraatacar' },  // el único que se puede devolver
};
const CB_ATTACK_IDS = Object.keys(CB_ATTACKS);

/* La ventana de reacción se achica con las rondas, mismo espíritu que
   BB_DIFFICULTY en baloncesto. */
function cbWindowMs(round){ return Math.max(420, 900 - round * 60); }

let cb = null;
minigameDisposers.push(() => { if (cb && cb.raf) cancelAnimationFrame(cb.raf); cb = null; });

function pickRivalSpecies(){
  const mine = currentSpeciesId();
  const opciones = SPECIES_IDS.filter(id => id !== mine);
  const pool = opciones.length ? opciones : SPECIES_IDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function startCombatGame(){
  const { gc, ctx } = enterMinigame('combat');
  const w = gc.width, h = gc.height;
  cb = {
    ctx, gc, w, h,
    groundY: h - 4,
    playerX: w * 0.22,
    rivalX: w * 0.78,
    rivalSpecies: pickRivalSpecies(),
    round: 0,
    playerHp: CB_PLAYER_HP,
    rivalHp: CB_RIVAL_HP,
    attack: null,
    state: 'telegraph',    // 'telegraph' | 'impact' | 'end'
    telegraphStart: 0,
    telegraphMs: 0,
    impactStart: 0,
    lastHit: null,         // 'player' | 'rival' | 'dodge' — qué animar en el impacto
    result: null,           // 'win' | 'lose' cuando termina
    resultAt: 0,
    raf: null,
  };
  cbNextRound();

  const cont = showGameControls(`
    <div class="game-hint" id="cbHint">¡Mirá qué viene y respondé!</div>
    <div class="gbtn-row3">
      <button class="gbtn gbtn-lg" id="btnDodge">🤸 Esquivar</button>
      <button class="gbtn gbtn-lg" id="btnBlock">🛡️ Bloquear</button>
      <button class="gbtn gbtn-lg" id="btnCounter">👊 Contra</button>
    </div>
  `);
  cb.hintEl = cont.querySelector('#cbHint');
  wireGameButton(cont.querySelector('#btnDodge'), () => cbPress('esquivar'));
  wireGameButton(cont.querySelector('#btnBlock'), () => cbPress('bloquear'));
  wireGameButton(cont.querySelector('#btnCounter'), () => cbPress('contraatacar'));

  cb.raf = requestAnimationFrame(cbLoop);
}

function cbNextRound(){
  cb.attack = CB_ATTACK_IDS[Math.floor(Math.random() * CB_ATTACK_IDS.length)];
  cb.telegraphMs = cbWindowMs(cb.round);
  cb.telegraphStart = performance.now();
  cb.state = 'telegraph';
  cb.lastHit = null;
}

/* Los tres botones responden siempre — no hay uno solo habilitado como en
   Baloncesto, porque acá la gracia es elegir CUÁL de los tres es el
   correcto, no esperar el momento de apretar el único que sirve. */
function cbPress(which){
  if (!cb || cb.state !== 'telegraph' || activeMinigame !== 'combat') return;
  cbResolve(which);
}

/* which === null pasa cuando se acaba el tiempo sin ninguna respuesta: cuenta
   como fallo, igual que apretar el botón que no corresponde. */
function cbResolve(which){
  const info = CB_ATTACKS[cb.attack];
  const acierto = which === info.beats;

  if (acierto && which === 'contraatacar'){
    cb.rivalHp -= 1;
    cb.lastHit = 'rival';
    floatFx('💥');
  } else if (acierto){
    cb.lastHit = 'dodge';
    floatFx('💨');
  } else {
    cb.playerHp -= 1;
    cb.lastHit = 'player';
    floatFx('💢');
  }
  cb.state = 'impact';
  cb.impactStart = performance.now();
}

function cbEnd(won){
  cb.state = 'end';
  cb.result = won ? 'win' : 'lose';
  cb.resultAt = performance.now();
}

function cbSyncButtons(){
  if (!cb) return;
  const cont = document.getElementById('gameControls');
  const on = cb.state === 'telegraph';
  ['btnDodge', 'btnBlock', 'btnCounter'].forEach(id => {
    const el = cont.querySelector('#' + id);
    if (el) el.disabled = !on;
  });
  if (cb.hintEl) cb.hintEl.textContent = on ? '¡Mirá qué viene y respondé!' : '';
}

function cbLoop(){
  if (activeMinigame !== 'combat' || !cb) return;
  const now = performance.now();

  if (cb.state === 'telegraph'){
    if (now - cb.telegraphStart >= cb.telegraphMs) cbResolve(null);
  } else if (cb.state === 'impact'){
    if (now - cb.impactStart >= CB_IMPACT_MS){
      if (cb.rivalHp <= 0) cbEnd(true);
      else if (cb.playerHp <= 0) cbEnd(false);
      else if (cb.round + 1 >= CB_ROUNDS) cbEnd(cb.playerHp >= cb.rivalHp);
      else { cb.round += 1; cbNextRound(); }
    }
  } else if (cb.state === 'end'){
    if (now - cb.resultAt >= CB_END_MS){
      finishCombatGame();
      return;
    }
  }

  cbSyncButtons();
  drawCombat();
  cb.raf = requestAnimationFrame(cbLoop);
}

function drawCombat(){
  const { ctx, gc } = cb;
  ctx.clearRect(0, 0, gc.width, gc.height);
  ctx.save();

  /* Sacudida de cámara: más fuerte si te pegan a vos que si le pegás al
     rival, y nada si fue una esquiva/bloqueo limpio. */
  if (cb.state === 'impact'){
    const t = (performance.now() - cb.impactStart) / CB_IMPACT_MS;
    const amp = (1 - t) * (cb.lastHit === 'player' ? 6 : cb.lastHit === 'rival' ? 4 : 0);
    if (amp > 0) ctx.translate((Math.random()*2-1)*amp, (Math.random()*2-1)*amp);
  }

  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.fillText(`Vos ${'❤️'.repeat(Math.max(0, cb.playerHp))}`, 8, 16);
  ctx.textAlign = 'right';
  ctx.fillText(`${'💚'.repeat(Math.max(0, cb.rivalHp))} Rival`, gc.width-8, 16);

  ctx.strokeStyle = 'rgba(200,242,194,.25)';
  ctx.beginPath();
  ctx.moveTo(0, cb.groundY+2); ctx.lineTo(gc.width, cb.groundY+2); ctx.stroke();

  /* Knockback: sale y vuelve en una sola pasada (misma idea que las
     parábolas de baloncesto, pero en x y sin altura). */
  let playerOffsetX = 0, rivalOffsetX = 0;
  if (cb.state === 'impact'){
    const t = Math.min(1, (performance.now() - cb.impactStart) / CB_IMPACT_MS);
    const kb = Math.sin(t * Math.PI) * 10;
    if (cb.lastHit === 'player') playerOffsetX = kb;
    if (cb.lastHit === 'rival') rivalOffsetX = -kb;
  }

  /* El rival es otra especie: se pisa debugForcedSpecies solo para este
     drawPetAt() y se restaura al toque, así no interfiere con el panel de
     prueba si estaba forzando una especie propia. */
  const prevForced = debugForcedSpecies;
  debugForcedSpecies = cb.rivalSpecies;
  const rivalMood = cb.state === 'end'
    ? (cb.result === 'win' ? 'sad' : 'happy')
    : (cb.lastHit === 'rival' ? 'sad' : 'normal');
  drawPetAt(ctx, cb.rivalX + rivalOffsetX, cb.groundY, rivalMood, 2);
  debugForcedSpecies = prevForced;

  const playerMood = cb.state === 'end'
    ? (cb.result === 'win' ? 'happy' : 'dead')
    : (cb.lastHit === 'player' ? 'sad' : 'normal');
  drawPetAt(ctx, cb.playerX + playerOffsetX, cb.groundY, playerMood, 2);

  /* Flash de impacto: un rect semitransparente encima de a quién le pegaron. */
  if (cb.state === 'impact' && cb.lastHit && cb.lastHit !== 'dodge'){
    const t = (performance.now() - cb.impactStart) / CB_IMPACT_MS;
    if (t < 0.4){
      const alpha = (0.4 - t) / 0.4 * 0.5;
      ctx.fillStyle = `rgba(255,80,80,${alpha})`;
      const fx = cb.lastHit === 'player' ? cb.playerX : cb.rivalX;
      ctx.fillRect(fx-32, cb.groundY-64, 64, 64);
    }
  }

  /* Telegraph: ícono del ataque que viene + anillo de tiempo que se achica. */
  if (cb.state === 'telegraph'){
    const info = CB_ATTACKS[cb.attack];
    drawEmoji(ctx, info.icon, 22, cb.rivalX, cb.groundY-80);
    const remain = 1 - Math.min(1, (performance.now() - cb.telegraphStart) / cb.telegraphMs);
    ctx.strokeStyle = remain > 0.3 ? 'rgba(255,206,75,.9)' : 'rgba(255,93,108,.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cb.rivalX, cb.groundY-80, 16, -Math.PI/2, -Math.PI/2 + remain*Math.PI*2);
    ctx.stroke();
  }

  if (cb.state === 'end'){
    ctx.font = '14px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(cb.result === 'win' ? '¡GANASTE!' : 'Perdiste…', gc.width/2, gc.height/2);
  }

  ctx.restore();
}

function finishCombatGame(){
  const won = cb && cb.result === 'win';
  const rounds = cb ? cb.round + 1 : 0;
  if (cb && cb.raf) cancelAnimationFrame(cb.raf);
  cb = null;

  const score = won ? rounds : 0;
  const merit = won ? rounds * 9 : 0;
  const message = won ? '¡Ganaste la pelea!' : 'Perdiste la pelea… la próxima';

  finishMinigame('combat', { score, merit, energyCost: 14, message });
}
