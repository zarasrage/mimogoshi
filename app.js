/* ===================== Mimogoshi — lógica del tamagotchi ===================== */

const COLS = 10;
const ROWS = 11;              // fila 0 = accesorios, filas 1-9 = cuerpo, fila 10 = piernas/base
const CELL = 8;
const CANVAS_W = COLS * CELL;
const CANVAS_H = ROWS * CELL;

/* Paleta por etapa. 'O' = contorno (mismo tono oscuro para todas, da legibilidad al pixel art chico).
   Esto sigue siendo lo que tiñe el color PRINCIPAL ('A') según cuánto se cuidó a la mascota;
   las especies no tocan esto, solo cambian de FORMA (ver SPECIES más abajo). */
const OUTLINE = '#20141c';
const PALETTES = {
  baby:    { A:'#ffd166', O:OUTLINE, M:'#c9ced6' },
  child:   { A:'#7bdff2', O:OUTLINE, M:'#a8b6c9' },
  teen:    { A:'#a29bfe', O:OUTLINE, M:'#9aa3d9' },
  adult_good:    { A:'#4ee08a', O:OUTLINE, C:'#ffe66d', M:'#8fe0c0' },
  adult_neutral: { A:'#7bdff2', O:OUTLINE, M:'#9ca7b8' },
  adult_bad:     { A:'#ff8fa3', O:OUTLINE, S:'#8a2846', M:'#6b5a63' },
  egg:     { A:'#fff4d6', O:'#c9a24a' },
  ghost:   { A:'#dfeaff', O:'#93a9c9' },
};

/* Colores de rasgos de especie: existen sin importar la etapa/paleta actual (una cola,
   una branquia o una antena se ven igual sin importar si la mascota está en su etapa
   "buena" o "mala"). 'M' (metal del robot) en cambio SÍ vive en PALETTES arriba, porque
   ese sí queremos que seúa con el cuidado, igual que el color principal 'A'.
   Resolución de color en drawSprite: paleta de etapa → estos → color 'A'. */
const SPECIES_COLORS = {
  T:'#c97a2e',               // dino: cola
  S:'#3fae52',               // dino: picos del lomo
  G:'#8a4fff',               // bloop: branquias
  E:'#ffce4b',               // beep: punta de la antena
  W:'#ff8fd6',               // sprig: flor cuando está feliz
  Y:'#ffe066', N:'#cbd5f5',  // puffi: sol / luna
  L:'#65c466',               // sprig: hojas
  X:'#ff4d4d',               // beep: antena en alerta (mood sick)
};

/* ---------- Generadores geométricos ----------
   Sirven para prototipar formas y para las siluetas más simples (huevo, fantasma).
   Los personajes con más personalidad (ver más abajo) están retocados a mano sobre
   esta base, tal como pide la silueta-reconocible-en-negro. */
function buildBlob(w, h, squishY, taper=0){
  const cx=(w-1)/2, cy=(h-1)/2;
  const inside = [];
  for (let r=0;r<h;r++){
    inside.push([]);
    for (let c=0;c<w;c++){
      const t = 1 - taper*(1 - r/(h-1)); // angosta la parte de arriba si taper>0 (ej. axolote)
      const dx=(c-cx)/((w/2)*t), dy=(r-cy)/((h/2)/squishY);
      inside[r].push(dx*dx+dy*dy <= 1);
    }
  }
  return outlineRows(inside);
}
function circleMask(w,h,cx,cy,rx,ry){
  const m=[];
  for(let r=0;r<h;r++){ m.push([]); for(let c=0;c<w;c++){ const dx=(c-cx)/rx, dy=(r-cy)/ry; m[r].push(dx*dx+dy*dy<=1); } }
  return m;
}
function orMask(...ms){
  const h=ms[0].length, w=ms[0][0].length;
  const out=[]; for(let r=0;r<h;r++){ out.push([]); for(let c=0;c<w;c++) out[r].push(ms.some(m=>m[r][c])); }
  return out;
}
function outlineRows(mask){
  const h=mask.length, w=mask[0].length;
  const rows=[];
  for(let r=0;r<h;r++){
    let row='';
    for(let c=0;c<w;c++){
      if(!mask[r][c]){ row+='.'; continue; }
      const out=(rr,cc)=>rr<0||cc<0||rr>=h||cc>=w||!mask[rr][cc];
      row += (out(r-1,c)||out(r+1,c)||out(r,c-1)||out(r,c+1)) ? 'O' : 'A';
    }
    rows.push(row);
  }
  return rows;
}
function setChar(row, idx, ch){ return row.slice(0,idx) + ch + row.slice(idx+1); }
function withRow(rows, idx, row){ const r = [...rows]; r[idx] = row; return r; }

const BLANK_ROW = '.'.repeat(COLS);
const LEGS_STAND = '..O....O..';
const LEGS_WALK_A = '.O......O.';
const LEGS_WALK_B = '...O..O...';

const EGG_ROWS = buildBlob(COLS, 9, 1.3);
const GHOST_ROWS = withRow(buildBlob(COLS, 9, 0.95), 8, '.A.A.A.A..');

/* ===================== Especies =====================
   Cada especie sólo aporta DATOS: forma del cuerpo (por etapa si evoluciona en silueta
   distinta), una fila de accesorios, una fila "de piso" para las que no caminan, y
   opcionalmente dónde va la cara. body/accessory/footer pueden ser un valor fijo o una
   función (stage, mood) => valor, que es como una especie reacciona a la etapa (evolución
   con silueta propia) o al ánimo (branquias, sol/lluvia, flor abierta, etc.) sin tocar
   el motor de dibujo. Agregar una especie nueva = agregar una entrada acá, nada más. */

// --- Mimo (blob): la criatura base, gelatinosa y redonda ---
const BLOB_BODY = [
  '...OOOO...',
  '..OAAAAO..',
  '.OAAAAAAO.',
  'OAAAAAAAAO',
  'OAAAAAAAAO',
  '.OAAAAAAO.',
  '..OAAAAO..',
  '..OAAAAO..',
  '..........',
];

// --- Gato: orejas y cola integradas a la silueta, no son un accesorio aparte ---
const GATO_BODY = [
  '.OO....OO.',
  'OAO....OAO',
  'OAAAAAAAAO',
  'OAAAAAAAAO',
  'OAAAAAAAAO',
  '.OAAAAAAO.',
  '..OAAAAOO.',
  '..OAAAAOAO',
  '...OOOO.OO',
];

// --- Dino: cresta dorsal + cuerpo inclinado + cola larga ---
const DINO_BODY = [
  '..S.S.S...',
  '.OAAAAO...',
  'OAAAAAAO..',
  'OAAAAAAAO.',
  'OAAAAAAAAT',
  '.OAAAAAATT',
  '..OAAAAATT',
  '..OAAAAO..',
  '..........',
];

// --- Bloop (axolote): las 'G' son las branquias, suben o caen según el ánimo ---
const AXOLOTE_BODY = [
  'GG......GG',
  '.GG....GG.',
  '..OOOOOO..',
  '.OAAAAAAO.',
  'OAAAAAAAAO',
  'OAAAAAAAAO',
  '.OAAAAAAO.',
  '..OAAAAO..',
  '..........',
];
const AXOLOTE_GILLS_DROOP = ['..........', 'GG......GG'];              // triste: más abajo y juntas
const AXOLOTE_GILLS_SICK  = ['..........', '.G......G.'];              // enfermo: casi caídas
function bloopBody(stage, mood){
  const rows = [...AXOLOTE_BODY];
  if (mood === 'sad'){ rows[0] = AXOLOTE_GILLS_DROOP[0]; rows[1] = AXOLOTE_GILLS_DROOP[1]; }
  else if (mood === 'sick'){ rows[0] = AXOLOTE_GILLS_SICK[0]; rows[1] = AXOLOTE_GILLS_SICK[1]; }
  return rows;
}

// --- Sprig (planta): hojas integradas a la copa, se abren en flor si está feliz ---
const PLANTA_BODY = [
  '...LLL....',
  '....L.....',
  '..OOOOO...',
  '.OAAAAAO..',
  'OAAAAAAAAO',
  'OAAAAAAAAO',
  '.OAAAAAAO.',
  '..OAAAAO..',
  '..........',
];
const PLANTA_FLOR = ['..LWWWL...', '....W.....'];
function sprigBody(stage, mood){
  const rows = [...PLANTA_BODY];
  if (mood === 'happy'){ rows[0] = PLANTA_FLOR[0]; rows[1] = PLANTA_FLOR[1]; }
  return rows;
}

// --- Mushii (hongo): sombrero ancho + pie angosto ---
const HONGO_BODY = [
  '...OOOO...',
  '.OOAAAAOO.',
  'OAAAAAAAAO',
  'OOOOOOOOOO',
  '..OAAAAO..',
  '..OAAAAO..',
  '..OAAAAO..',
  '...OAAO...',
  '..........',
];

// --- Beep (robot): antena y "brazos" incluidos en la silueta; la punta de la
//     antena hace de LED y cambia con el ánimo ---
const ROBOT_BODY = [
  '....E.....',
  '....O.....',
  '..OOOOOO..',
  '.OMMMMMMO.',
  'OOMMMMMMOO',
  'OOMMMMMMOO',
  '.OMMMMMMO.',
  '..O....O..',
  '..........',
];
function beepBody(stage, mood){
  const rows = [...ROBOT_BODY];
  const tip = mood === 'sick' ? 'X' : (mood === 'sleepy' || mood === 'dead') ? '.' : 'E';
  rows[0] = setChar(rows[0], 4, tip);
  return rows;
}

// --- Puffi (nube): varios círculos fusionados; sin patas, flota ---
const PUFFI_BASE = outlineRows(orMask(
  circleMask(COLS,9,2.5,4.5,2.6,2.6), circleMask(COLS,9,5,2.8,3.0,2.6),
  circleMask(COLS,9,7.5,4,2.7,2.6),   circleMask(COLS,9,4.8,6,4.3,2.6),
));
const PUFFI_BAD = withRow(PUFFI_BASE, 8, '.O.O.O.O..'); // base quebrada = nube de tormenta

const SPECIES = {
  blob: {
    body: BLOB_BODY,
    accessory: stage => ({ teen:'..O....O..', adult_neutral:'..O....O..', adult_good:'.C......C.', adult_bad:'.S.S.S.S..' }[stage] || null),
    hasLegs: true,
  },
  gato: { body: GATO_BODY, hasLegs: true },
  dino: { body: DINO_BODY, hasLegs: true },
  bloop: { body: bloopBody, hasLegs: true },
  sprig: { body: sprigBody, hasLegs: true },
  mushii: { body: HONGO_BODY, hasLegs: true, face: { row: 5 } },
  beep: { body: beepBody, hasLegs: true },
  puffi: {
    body: stage => stage === 'adult_bad' ? PUFFI_BAD : PUFFI_BASE,
    accessory: (stage, mood) => mood==='happy' ? '.Y......Y.' : mood==='sleepy' ? '....N.....' : null,
    footer: (stage, mood) => mood==='sad' ? 'R.R.R.R...' : null,
    hasLegs: false,
  },
};

function spriteRows(bodyRows, accessoryRow, legsRow){
  return [accessoryRow || BLANK_ROW, ...bodyRows, legsRow || BLANK_ROW];
}

function normalizeRow(row){
  row = row || '';
  if (row.length < COLS) row = row + '.'.repeat(COLS - row.length);
  return row.slice(0, COLS);
}

function drawSprite(ctx, stage, mood, walkFrame, noClear, species){
  if (!noClear) ctx.clearRect(0,0,CANVAS_W,CANVAS_H);
  const pal = PALETTES[stage] || PALETTES.baby;
  const sp = SPECIES[species] || SPECIES.blob;

  let rows;
  if (stage === 'egg'){
    rows = spriteRows(EGG_ROWS, null, null);
  } else if (mood === 'dead'){
    rows = spriteRows(GHOST_ROWS, null, null);
  } else {
    const body = typeof sp.body === 'function' ? sp.body(stage, mood) : sp.body;
    const accessory = sp.accessory ? sp.accessory(stage, mood) : null;
    if (mood === 'sleepy'){
      const footer = sp.footer ? sp.footer(stage, mood) : null;
      rows = spriteRows(body, accessory, footer);
    } else if (sp.hasLegs){
      const legsRow = walkFrame === 1 ? LEGS_WALK_A : walkFrame === 2 ? LEGS_WALK_B : LEGS_STAND;
      rows = spriteRows(body, accessory, legsRow);
    } else {
      rows = spriteRows(body, accessory, sp.footer ? sp.footer(stage, mood) : null);
    }
  }

  for (let r=0; r<ROWS; r++){
    const row = normalizeRow(rows[r]);
    for (let c=0; c<COLS; c++){
      const ch = row[c];
      if (ch === '.') continue;
      ctx.fillStyle = pal[ch] || SPECIES_COLORS[ch] || pal.A;
      ctx.fillRect(c*CELL, r*CELL, CELL, CELL);
    }
  }

  if (stage !== 'egg' && !(sp.face && sp.face.skip)){
    drawFace(ctx, stage, mood, sp.face);
  }
}

function drawFace(ctx, stage, mood, faceCfg){
  const row = (faceCfg && faceCfg.row) || 4;
  const eyeY = row*CELL;
  const lx = ((faceCfg && faceCfg.left) || 3)*CELL;
  const rx = ((faceCfg && faceCfg.right) || 6)*CELL;
  const es = CELL;

  ctx.fillStyle = OUTLINE;

  if (mood === 'sleepy'){
    ctx.fillRect(lx, eyeY+es*0.4, es, es*0.2);
    ctx.fillRect(rx, eyeY+es*0.4, es, es*0.2);
    return;
  }
  if (mood === 'dead'){
    ctx.fillRect(lx, eyeY, es*0.55, es*0.55);
    ctx.fillRect(rx, eyeY+es*0.3, es*0.55, es*0.55);
    return;
  }

  const drawEye = (x) => {
    if (mood === 'sad'){
      ctx.fillRect(x, eyeY, es*0.8, es*0.55);
    } else if (mood === 'sick'){
      ctx.fillRect(x, eyeY, es*0.4, es*0.4);
      ctx.fillRect(x+es*0.45, eyeY+es*0.3, es*0.4, es*0.4);
    } else if (mood === 'happy'){
      ctx.fillRect(x, eyeY+es*0.4, es*0.8, es*0.3);
    } else {
      ctx.fillRect(x, eyeY, es*0.7, es*0.7);
    }
  };
  drawEye(lx); drawEye(rx);

  const mouthY = eyeY + CELL*1.6;
  const mx = 3.5*CELL;
  if (mood === 'happy') ctx.fillRect(mx, mouthY, CELL*3, CELL*0.55);
  else if (mood === 'sad') ctx.fillRect(mx+CELL*0.3, mouthY, CELL*2, CELL*0.35);
  else if (mood === 'sick') ctx.fillRect(mx+CELL*0.6, mouthY, CELL*1.5, CELL*0.35);
  else ctx.fillRect(mx+CELL*0.4, mouthY, CELL*2.2, CELL*0.35);
}

/* ===================== Comida ===================== */

const FOODS = [
  { id:'simple',   name:'Bocadillo simple', emoji:'🍬', restore:15 },
  { id:'rica',     name:'Comida rica',      emoji:'🍗', restore:30 },
  { id:'especial', name:'Comida especial',  emoji:'🍰', restore:50 },
];

function foodById(id){ return FOODS.find(f => f.id === id) || FOODS[0]; }

/* ===================== Estado del juego ===================== */

const SAVE_KEY = 'mimogoshi.save.v2';
const TICK_MS = 4000;
const MS_PER_GAME_HOUR = 45000;
const STAGE_HOURS = { baby: 3, child: 8, teen: 16 };
const SLEEPY_THRESHOLD = 35;   // bajo esto puede quedarse dormido solo
const RED_ZONE = 25;           // bajo esto, ni alimentarlo/jugar lo despierta

let state = null;
let tickTimer = null;
let animFrame = null;
let gameOver = false;
let activeMinigame = null; // null | 'stars' | 'basketball'

/* Modo prueba: no se guarda, vive solo en memoria de la sesión */
let debugMode = false;
let debugForcedStage = null; // null = usar la etapa real de la mascota
let debugForcedMood = null;  // null = usar el ánimo calculado normalmente
let debugSpecies = 'blob';   // especie con la que se dibuja el sprite (solo modo prueba)

const ALL_STAGES = ['egg','baby','child','teen','adult_neutral','adult_good','adult_bad'];
const ALL_MOODS = ['normal','happy','sad','sick','sleepy','dead'];
const ALL_SPECIES = ['blob','gato','dino','bloop','sprig','puffi','mushii','beep'];

function displayStage(){ return debugForcedStage || state.stage; }
function displayMood(){ return debugForcedMood || currentMood(); }
function displaySpecies(){ return debugSpecies; }

const walker = { x: 0.5, targetX: 0.5, dir: 1, pauseUntil: 0, frame: 0, lastFrameSwitch: 0 };

function freshState(name){
  return {
    name: name || 'Mimo',
    bornAt: Date.now(),
    lastUpdate: Date.now(),
    ageHours: 0,
    hunger: 80,
    happiness: 80,
    energy: 80,
    hygiene: 80,
    health: 100,
    careGood: 0,
    careBad: 0,
    sick: false,
    sleeping: false,
    poop: false,
    stage: 'egg',
    selectedFood: 'simple',
    unlockedFoods: ['simple'],
  };
}

function loadState(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s !== 'object') return null;
    if (!s.selectedFood) s.selectedFood = 'simple';
    if (!s.unlockedFoods) s.unlockedFoods = ['simple'];
    return s;
  } catch (e) {
    return null;
  }
}

function saveState(){
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) { /* algunos visores bloquean localStorage; ignorar */ }
}

function clamp(v, min=0, max=100){ return Math.max(min, Math.min(max, v)); }

/* ===================== Simulación ===================== */

function stageFor(ageHours, careScore){
  if (ageHours < 0.4) return 'egg';
  if (ageHours < STAGE_HOURS.baby) return 'baby';
  if (ageHours < STAGE_HOURS.child) return 'child';
  if (ageHours < STAGE_HOURS.teen) return 'teen';
  if (careScore > 8) return 'adult_good';
  if (careScore < -8) return 'adult_bad';
  return 'adult_neutral';
}

function applyDecay(hours){
  if (hours <= 0) return;

  if (debugMode){
    state.hunger = state.happiness = state.energy = state.hygiene = state.health = 100;
    state.sick = false;
    state.poop = false;
    state.ageHours += hours;
    if (!debugForcedStage) state.stage = stageFor(state.ageHours, state.careGood - state.careBad);
    return;
  }

  const sleepFactor = state.sleeping ? 0.25 : 1;
  state.hunger   = clamp(state.hunger   - hours * 4.2 * sleepFactor);
  state.happiness= clamp(state.happiness- hours * 3.0 * sleepFactor);
  state.hygiene  = clamp(state.hygiene  - hours * 2.6 * sleepFactor);
  state.energy   = clamp(state.energy   + (state.sleeping ? hours*9 : -hours*2.4));

  if (!state.poop && Math.random() < hours * 0.35) state.poop = true;
  if (state.poop) state.hygiene = clamp(state.hygiene - hours*1.2);

  const distress = [state.hunger < 20, state.hygiene < 20, state.energy < 10].filter(Boolean).length;
  if (distress > 0){
    state.health = clamp(state.health - hours * distress * 3.5);
    if (!state.sick && state.health < 55 && Math.random() < hours * 0.3) state.sick = true;
  } else if (state.hunger > 50 && state.hygiene > 50 && state.health < 100){
    state.health = clamp(state.health + hours * 1.5);
  }
  if (state.sick){
    state.health = clamp(state.health - hours*2);
  }

  const careDelta = (state.hunger>60?1:-1) + (state.happiness>60?1:-1) + (state.hygiene>60?1:-1);
  if (careDelta > 0) state.careGood += hours * careDelta * 0.5;
  if (careDelta < 0) state.careBad += hours * -careDelta * 0.5;

  state.ageHours += hours;
  state.stage = stageFor(state.ageHours, state.careGood - state.careBad);

  if (state.health <= 0){
    triggerGameOver();
  }
}

function catchUp(){
  const now = Date.now();
  const elapsedMs = Math.max(0, now - state.lastUpdate);
  const cappedMs = Math.min(elapsedMs, MS_PER_GAME_HOUR * 24 * 3);
  const hours = cappedMs / MS_PER_GAME_HOUR;
  applyDecay(hours);
  state.lastUpdate = now;
}

function maybeAutoSleep(){
  if (gameOver || state.stage === 'egg') return;
  if (state.sleeping){
    if (state.energy >= 90) state.sleeping = false;
    return;
  }
  if (state.energy < SLEEPY_THRESHOLD){
    const chance = (SLEEPY_THRESHOLD - state.energy) / SLEEPY_THRESHOLD * 0.22;
    if (Math.random() < chance) state.sleeping = true;
  }
}

function tick(){
  if (gameOver) return;
  catchUp();
  maybeAutoSleep();
  saveState();
}

function triggerGameOver(){
  gameOver = true;
  clearInterval(tickTimer);
  forceCloseMinigames();
  showOverlay(`
    <h3>💫 ${escapeHtml(state.name)} se fue a las estrellas</h3>
    <p>Vivió ${Math.floor(state.ageHours)} horas de mascota. Gracias por cuidarlo.</p>
    <button class="overlay-btn" id="btnNewEgg">Empezar de nuevo</button>
  `);
  document.getElementById('btnNewEgg').addEventListener('click', () => {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  });
}

/* Cierra cualquier minijuego en curso a la fuerza (ej. si la mascota muere a mitad de partida) */
function forceCloseMinigames(){
  if (sg && sg.raf) cancelAnimationFrame(sg.raf);
  if (sg){
    window.removeEventListener('keydown', sg.onKeyDown);
    window.removeEventListener('keyup', sg.onKeyUp);
    sg.gc.removeEventListener('pointermove', sg.onMove);
  }
  if (bb && bb.raf) cancelAnimationFrame(bb.raf);
  if (bb && bb.onShoot) document.getElementById('btnShoot').removeEventListener('click', bb.onShoot);
  sg = null;
  bb = null;
  activeMinigame = null;
  document.getElementById('gameCanvas').classList.add('hidden');
  document.getElementById('btnShoot').classList.add('hidden');
  document.getElementById('creatureFloor').classList.remove('hidden');
}

/* Devuelve true si la acción puede proceder (y despierta a la mascota si corresponde) */
function tryWake(){
  if (!state.sleeping) return true;
  if (state.energy < RED_ZONE){
    say('Está profundamente dormido…');
    return false;
  }
  state.sleeping = false;
  say('¡Buenos días!');
  return true;
}

/* ===================== Mood / UI ===================== */

function currentMood(){
  if (gameOver) return 'dead';
  if (state.stage === 'egg') return 'egg';
  if (state.sleeping) return 'sleepy';
  if (state.sick) return 'sick';
  if (state.hunger < 25 || state.happiness < 25 || state.hygiene < 25) return 'sad';
  if (state.happiness > 75 && state.hunger > 60) return 'happy';
  return 'normal';
}

function statColor(v){
  if (v < 25) return 'var(--bad)';
  if (v < 55) return 'var(--mid)';
  return 'var(--good)';
}

function updateLed(){
  const led = document.getElementById('led');
  led.className = 'led';
  if (state.sick || state.health < 30) led.classList.add('danger');
  else if (state.hunger < 35 || state.happiness < 35 || state.hygiene < 35) led.classList.add('warn');
}

/* ===================== Movimiento pasivo ===================== */

function updateWalker(dt){
  if (activeMinigame) return;
  const frozen = gameOver || displayStage() === 'egg' || state.sleeping ||
    debugForcedMood === 'sleepy' || debugForcedMood === 'dead';
  if (frozen){
    walker.frame = 0;
    return;
  }
  const now = performance.now();
  if (now < walker.pauseUntil){
    walker.frame = 0;
    return;
  }
  const dist = walker.targetX - walker.x;
  if (Math.abs(dist) < 0.01){
    walker.pauseUntil = now + 1200 + Math.random()*2200;
    walker.targetX = 0.12 + Math.random()*0.76;
    walker.dir = walker.targetX > walker.x ? 1 : -1;
    return;
  }
  walker.dir = dist > 0 ? 1 : -1;
  walker.x += walker.dir * dt * 0.09;

  if (now - walker.lastFrameSwitch > 220){
    walker.lastFrameSwitch = now;
    walker.frame = walker.frame === 1 ? 2 : 1;
  }
}

function render(){
  if (!state) return;

  if (debugMode){
    state.hunger = state.happiness = state.energy = state.hygiene = state.health = 100;
    state.sick = false;
    state.poop = false;
  }

  document.getElementById('petName').textContent = state.name;
  document.getElementById('petAge').textContent = `Día ${Math.floor(state.ageHours/24)+1}`;

  ['hunger','happiness','energy','hygiene','health'].forEach(k => {
    const fill = document.getElementById('fill-'+k);
    fill.style.width = clamp(state[k]) + '%';
    fill.style.background = statColor(state[k]);
  });

  updateLed();

  const canvas = document.getElementById('petCanvas');
  const ctx = canvas.getContext('2d');
  drawSprite(ctx, displayStage(), displayMood(), walker.frame, false, displaySpecies());
  canvas.style.left = (walker.x*100) + '%';
  canvas.style.transform = `translateX(-50%) scaleX(${walker.dir})`;

  document.getElementById('btnMed').disabled = !state.sick;
  document.getElementById('feedIcon').textContent = foodById(state.selectedFood).emoji;

  document.getElementById('poopFx').classList.toggle('hidden', !state.poop);
}

let lastFrameT = 0;
function loopRender(t){
  const dt = Math.min(0.05, (t - (lastFrameT || t)) / 1000);
  lastFrameT = t;
  updateWalker(dt);
  render();
  animFrame = requestAnimationFrame(loopRender);
}

/* ===================== FX helpers ===================== */

function floatFx(emoji){
  const screen = document.getElementById('screen');
  const el = document.createElement('div');
  el.className = 'fx';
  el.textContent = emoji;
  el.style.left = (40 + Math.random()*40) + '%';
  el.style.top = '90px';
  screen.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function say(text, ms=1600){
  const bubble = document.getElementById('bubble');
  bubble.textContent = text;
  bubble.classList.add('show');
  clearTimeout(say._t);
  say._t = setTimeout(() => bubble.classList.remove('show'), ms);
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ===================== Acciones ===================== */

function requireAlive(fn){
  return (...args) => { if (!gameOver && !activeMinigame) fn(...args); };
}

const btnFeed = () => {
  if (state.stage === 'egg') { say('Todavía es un huevo…'); return; }
  if (!tryWake()) return;
  catchUp();
  const food = foodById(state.selectedFood);
  state.hunger = clamp(state.hunger + food.restore);
  state.energy = clamp(state.energy + 4);
  floatFx(food.emoji);
  say('¡Ñam ñam!');
  saveState(); render();
};

const btnClean = () => {
  if (!tryWake()) return;
  catchUp();
  state.hygiene = clamp(state.hygiene + 35);
  state.poop = false;
  floatFx('🫧');
  say(state.stage === 'egg' ? 'Huevo brillante' : '¡Ya quedó limpio!');
  saveState(); render();
};

const btnMed = () => {
  if (!state.sick) return;
  catchUp();
  state.sick = false;
  state.health = clamp(state.health + 20);
  floatFx('💊');
  say('Se siente mejor');
  saveState(); render();
};

/* ===================== Menú de comida ===================== */

function openFoodMenu(){
  const rows = FOODS.map(f => {
    const unlocked = state.unlockedFoods.includes(f.id);
    const selected = state.selectedFood === f.id;
    return `
      <div class="menu-item ${unlocked ? '' : 'locked'} ${selected ? 'selected' : ''}" data-food="${f.id}">
        <span class="emoji">${unlocked ? f.emoji : '🔒'}</span>
        <div class="info">
          <b>${escapeHtml(f.name)}</b>
          <small>${unlocked ? `Recupera ${f.restore} de hambre` : 'Todavía no la consigues'}</small>
        </div>
      </div>`;
  }).join('');

  showOverlay(`
    <h3>🍽️ Elegir comida</h3>
    <div class="menu-list">${rows}</div>
    <button class="overlay-btn" id="btnCloseMenu">Cerrar</button>
  `);

  document.querySelectorAll('.menu-item').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.food;
      if (!state.unlockedFoods.includes(id)) return;
      state.selectedFood = id;
      saveState(); render();
      hideOverlay();
    });
  });
  document.getElementById('btnCloseMenu').addEventListener('click', hideOverlay);
}

/* ===================== Menú de minijuegos ===================== */

function openGamesMenu(){
  if (state.stage === 'egg'){ say('Todavía es un huevo…'); return; }
  if (state.energy < 12){ say('Está muy cansado para jugar'); return; }
  if (!tryWake()) return;

  showOverlay(`
    <h3>🎮 Elegir juego</h3>
    <div class="menu-list">
      <div class="menu-item" id="pickStars">
        <span class="emoji">⭐</span>
        <div class="info"><b>Atrapa estrellas</b><small>Mueve la canasta, evita la caca</small></div>
      </div>
      <div class="menu-item" id="pickBasketball">
        <span class="emoji">🏀</span>
        <div class="info"><b>Baloncesto</b><small>Aprieta TIRAR en el momento justo</small></div>
      </div>
    </div>
    <button class="overlay-btn" id="btnCloseGames">Cancelar</button>
  `);

  document.getElementById('pickStars').addEventListener('click', () => { hideOverlay(); startStarsGame(); });
  document.getElementById('pickBasketball').addEventListener('click', () => { hideOverlay(); startBasketballGame(); });
  document.getElementById('btnCloseGames').addEventListener('click', hideOverlay);
}

/* Ajusta la resolución interna del canvas del minijuego a su tamaño real en
   pantalla (el contenedor es flexible), para que nada salga estirado/deforme. */
function fitGameCanvas(gc){
  const rect = gc.getBoundingClientRect();
  gc.width = Math.max(200, Math.round(rect.width));
  gc.height = Math.max(90, Math.round(rect.height));
}

/* ===================== Minijuego 1: atrapar estrellas ===================== */

let sg = null;

function startStarsGame(){
  catchUp();
  activeMinigame = 'stars';
  document.getElementById('creatureFloor').classList.add('hidden');
  const gc = document.getElementById('gameCanvas');
  gc.classList.remove('hidden');
  fitGameCanvas(gc);
  const ctx = gc.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  sg = {
    ctx, gc,
    basketX: gc.width/2,
    items: [],
    score: 0,
    timeLeft: 10,
    lastSpawn: 0,
    keys: {left:false, right:false},
    raf: null,
  };

  const onKey = (down) => (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') sg.keys.left = down;
    if (e.key === 'ArrowRight' || e.key === 'd') sg.keys.right = down;
  };
  sg.onKeyDown = onKey(true);
  sg.onKeyUp = onKey(false);
  window.addEventListener('keydown', sg.onKeyDown);
  window.addEventListener('keyup', sg.onKeyUp);

  sg.onMove = (e) => {
    const rect = gc.getBoundingClientRect();
    const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
    const relX = (clientX - rect.left) / rect.width * gc.width;
    sg.basketX = Math.max(14, Math.min(gc.width-14, relX));
  };
  gc.addEventListener('pointermove', sg.onMove);

  say('¡Atrapa las estrellas!');
  sgLoop(performance.now());
}

function sgLoop(t){
  if (activeMinigame !== 'stars' || !sg) return;
  const dt = Math.min(0.05, (t - (sg.lastT || t)) / 1000);
  sg.lastT = t;
  sg.timeLeft -= dt;

  if (sg.keys.left) sg.basketX = Math.max(14, sg.basketX - 220*dt);
  if (sg.keys.right) sg.basketX = Math.min(sg.gc.width-14, sg.basketX + 220*dt);

  sg.lastSpawn -= dt;
  if (sg.lastSpawn <= 0){
    sg.lastSpawn = 0.55 + Math.random()*0.4;
    sg.items.push({ x: 16+Math.random()*(sg.gc.width-32), y: -10, vy: 70+Math.random()*50, star: Math.random() > 0.2 });
  }

  const ctx = sg.ctx, gc = sg.gc;
  ctx.clearRect(0,0,gc.width, gc.height);
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  for (let i=0;i<gc.width;i+=16) ctx.fillRect(i,0,1,gc.height);

  sg.items.forEach(it => { it.y += it.vy * dt; });

  for (let i=sg.items.length-1; i>=0; i--){
    const it = sg.items[i];
    if (it.y > gc.height + 12){ sg.items.splice(i,1); continue; }
    const caught = it.y > gc.height-26 && Math.abs(it.x - sg.basketX) < 18;
    if (caught){
      sg.score += it.star ? 1 : -1;
      sg.items.splice(i,1);
      floatFx(it.star ? '⭐' : '💩');
      continue;
    }
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(it.star ? '⭐' : '💩', it.x, it.y);
  }

  ctx.fillStyle = '#ffe66d';
  ctx.beginPath();
  ctx.moveTo(sg.basketX-16, gc.height-6);
  ctx.lineTo(sg.basketX+16, gc.height-6);
  ctx.lineTo(sg.basketX, gc.height-26);
  ctx.closePath();
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.font = '11px monospace';
  ctx.fillText('⭐ ' + sg.score, 8, 16);
  ctx.fillText(Math.max(0, sg.timeLeft).toFixed(1) + 's', gc.width-46, 16);

  if (sg.timeLeft <= 0){
    endStarsGame();
    return;
  }
  sg.raf = requestAnimationFrame(sgLoop);
}

function endStarsGame(){
  const score = sg ? sg.score : 0;
  window.removeEventListener('keydown', sg.onKeyDown);
  window.removeEventListener('keyup', sg.onKeyUp);
  sg.gc.removeEventListener('pointermove', sg.onMove);
  if (sg.raf) cancelAnimationFrame(sg.raf);

  document.getElementById('gameCanvas').classList.add('hidden');
  document.getElementById('creatureFloor').classList.remove('hidden');

  const happinessGain = clamp(score * 6, -10, 45);
  state.happiness = clamp(state.happiness + happinessGain);
  state.energy = clamp(state.energy - 18);
  state.hygiene = clamp(state.hygiene - 5);

  say(score > 0 ? `¡${score} estrellas! +${happinessGain} felicidad` : 'Mmm, la próxima será');
  activeMinigame = null;
  sg = null;
  saveState(); render();
}

/* ===================== Minijuego 2: baloncesto (timing) ===================== */

const BB_TOTAL_SHOTS = 3;
/* La pelota sube y baja junto a la mascota. El acierto depende de qué tan cerca del punto
   más alto se aprieta TIRAR — las zonas de acierto no se muestran, solo están codificadas
   como umbrales de altura (0 = abajo, 1 = arriba del todo). Se endurece por tiro. */
const BB_DIFFICULTY = [
  { peak: 0.85, near: 0.60, speed: 1.0 },
  { peak: 0.90, near: 0.70, speed: 1.25 },
  { peak: 0.95, near: 0.80, speed: 1.5 },
];

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

function bbBallHeight(phase){
  return (Math.sin(phase - Math.PI/2) + 1) / 2; // 0 abajo, 1 arriba
}

function startBasketballGame(){
  catchUp();
  activeMinigame = 'basketball';
  document.getElementById('creatureFloor').classList.add('hidden');
  const gc = document.getElementById('gameCanvas');
  gc.classList.remove('hidden');
  const shootBtn = document.getElementById('btnShoot');
  shootBtn.classList.remove('hidden');
  fitGameCanvas(gc);

  const w = gc.width, h = gc.height;
  bb = {
    ctx: gc.getContext('2d'),
    gc, w, h,
    groundY: h - 4, // mismo margen que el piso normal (petCanvas usa bottom:4px)
    ballTopY: h*BB_BALL_TOP_FRAC,
    ballBottomY: h*BB_BALL_BOTTOM_FRAC,
    hoopX: w*BB_HOOP_X_FRAC,
    hoopY: h*BB_HOOP_Y_FRAC,
    monoX: w*BB_MONO_X_FRAC,
    ballX: w*BB_BALL_X_FRAC,
    shot: 0,
    score: 0,
    phase: 0,
    state: 'aim',       // 'aim' | 'flight' | 'settle' | 'result'
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
  bb.ctx.imageSmoothingEnabled = false;

  // Botón TIRAR: chico, cuadrado, pegado al suelo justo debajo del aro.
  const gcRect = gc.getBoundingClientRect();
  const screenRect = document.getElementById('screen').getBoundingClientRect();
  const btnSize = 38;
  shootBtn.style.left = Math.round(gcRect.left - screenRect.left + bb.hoopX - btnSize/2) + 'px';
  shootBtn.style.top = Math.round(gcRect.top - screenRect.top + bb.groundY + 6) + 'px';

  bb.onShoot = () => resolveShot();
  shootBtn.addEventListener('click', bb.onShoot);

  say('¡Encesta en el momento justo!');
  bbLoop(performance.now());
}

function resolveShot(){
  if (!bb || bb.state !== 'aim' || activeMinigame !== 'basketball') return;
  const diff = BB_DIFFICULTY[bb.shot];
  const h = bbBallHeight(bb.phase);
  const aim = { x: bb.ballX, y: bb.ballBottomY - h*(bb.ballBottomY-bb.ballTopY) };

  let points = 0, text = '', fx = '', flightTo, settleTo;
  if (h >= diff.peak){
    points = h >= (diff.peak + (1-diff.peak)*0.5) ? 3 : 2;
    text = points === 3 ? '¡SWISH!' : '¡ENCESTÓ!';
    fx = '🏀';
    flightTo = { x: bb.hoopX, y: bb.hoopY-4 };
    settleTo = { x: bb.hoopX, y: bb.hoopY+18 };
  } else if (h >= diff.near){
    points = 0;
    text = 'Rebota en el aro…';
    fx = '〰️';
    flightTo = { x: bb.hoopX, y: bb.hoopY-2 };
    settleTo = { x: bb.hoopX-30, y: bb.hoopY+26 };
  } else {
    points = 0;
    text = 'No alcanza';
    fx = '💨';
    const shortX = bb.monoX + (bb.hoopX-bb.monoX) * (0.35 + h*0.25);
    flightTo = { x: shortX, y: bb.groundY-30 };
    settleTo = { x: shortX+10, y: bb.groundY };
  }

  bb.score += points;
  bb.resultText = `${text} (+${points})`;
  bb.state = 'flight';
  bb.flightStart = performance.now();
  bb.flightFrom = aim;
  bb.flightTo = flightTo;
  bb.settleFrom = flightTo;
  bb.settleTo = settleTo;
  floatFx(fx);
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
    bb.phase += dt * 2.6 * diff.speed;
  } else if (bb.state === 'flight'){
    if (now - bb.flightStart >= BB_FLIGHT_MS){
      bb.state = 'settle';
      bb.settleStart = now;
    }
  } else if (bb.state === 'settle'){
    if (now - bb.settleStart >= BB_SETTLE_MS){
      bb.state = 'result';
      bb.resultUntil = now + BB_RESULT_MS;
    }
  } else if (bb.state === 'result'){
    if (now > bb.resultUntil){
      bb.shot += 1;
      if (bb.shot >= BB_TOTAL_SHOTS){
        endBasketballGame();
        return;
      }
      bb.state = 'aim';
      bb.phase = 0;
    }
  }

  drawBasketball();
  bb.raf = requestAnimationFrame(bbLoop);
}

function bbBallPos(){
  if (bb.state === 'aim'){
    const h = bbBallHeight(bb.phase);
    return { x: bb.ballX, y: bb.ballBottomY - h*(bb.ballBottomY-bb.ballTopY) };
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

  // Mismo tamaño (50x55) y mismo piso que la mascota fuera de los minijuegos.
  const MONO_W = 50, MONO_H = 55;
  ctx.save();
  ctx.translate(bb.monoX - MONO_W/2, bb.groundY - MONO_H);
  ctx.scale(MONO_W/CANVAS_W, MONO_H/CANVAS_H);
  drawSprite(ctx, displayStage(), debugForcedMood || (state.sick ? 'sick' : 'happy'), 0, true, displaySpecies());
  ctx.restore();

  const ballPos = bbBallPos();
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏀', ballPos.x, ballPos.y);

  if (bb.state === 'result'){
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
  document.getElementById('btnShoot').removeEventListener('click', bb.onShoot);
  document.getElementById('btnShoot').classList.add('hidden');
  document.getElementById('gameCanvas').classList.add('hidden');
  document.getElementById('creatureFloor').classList.remove('hidden');
  if (bb && bb.raf) cancelAnimationFrame(bb.raf);

  const happinessGain = clamp(score * 8, 0, 45);
  state.happiness = clamp(state.happiness + happinessGain);
  state.energy = clamp(state.energy - 16);

  say(`${score} puntos en baloncesto. +${happinessGain} felicidad`);
  activeMinigame = null;
  bb = null;
  saveState(); render();
}

/* ===================== Overlay / setup ===================== */

function showOverlay(html){
  const overlay = document.getElementById('overlay');
  document.getElementById('overlayCard').innerHTML = html;
  overlay.classList.remove('hidden');
}

function hideOverlay(){
  document.getElementById('overlay').classList.add('hidden');
}

function askName(){
  showOverlay(`
    <h3>🥚 Un nuevo Mimogoshi</h3>
    <p>¿Cómo se va a llamar?</p>
    <div><input id="nameInput" maxlength="14" placeholder="Nombre" autofocus></div>
    <button class="overlay-btn" id="btnStart">Empezar</button>
  `);
  const input = document.getElementById('nameInput');
  const start = () => {
    const name = input.value.trim().slice(0,14) || 'Mimo';
    state = freshState(name);
    saveState();
    hideOverlay();
    boot();
  };
  document.getElementById('btnStart').addEventListener('click', start);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') start(); });
  input.focus();
}

/* ===================== Modo prueba (debug) ===================== */

const STAGE_LABELS = {
  egg:'🥚 Huevo', baby:'👶 Bebé', child:'🧒 Niño', teen:'🧑 Adolesc.',
  adult_neutral:'😐 Adulto', adult_good:'✨ Adulto bueno', adult_bad:'😠 Adulto malo',
};
const MOOD_LABELS = {
  normal:'😐 Normal', happy:'😄 Feliz', sad:'😢 Triste',
  sick:'🤒 Enfermo', sleepy:'😴 Dormido', dead:'👻 Fantasma',
};
const SPECIES_LABELS = {
  blob:'🔵 Mimo', gato:'🐱 Gatuno', dino:'🦕 Dino', bloop:'🌊 Bloop',
  sprig:'🌱 Sprig', puffi:'☁️ Puffi', mushii:'🍄 Mushii', beep:'🤖 Beep',
};

function updateDebugToggleIcon(){
  document.getElementById('btnDebug').classList.toggle('active', debugMode);
}

/* El panel de prueba vive en su propio contenedor (#debugPanel), no en el overlay
   genérico: en pantallas anchas queda fijo al lado del dispositivo (CSS lo pone en
   .layout-row) para poder ver a la mascota mientras se cambian etapa/ánimo/especie;
   en celular esa misma CSS lo vuelve un modal a pantalla completa (ver styles.css). */
function isDebugPanelOpen(){
  return !document.getElementById('debugPanel').classList.contains('hidden');
}

function openDebugPanel(){
  document.getElementById('debugPanel').classList.remove('hidden');
  renderDebugPanel();
}

function closeDebugPanel(){
  document.getElementById('debugPanel').classList.add('hidden');
}

function toggleDebugPanel(){
  if (isDebugPanelOpen()) closeDebugPanel(); else openDebugPanel();
}

function renderDebugPanel(){
  const stageBtns = ALL_STAGES.map(s => `
    <button class="debug-btn ${debugForcedStage===s ? 'active':''}" data-stage="${s}">${STAGE_LABELS[s]}</button>
  `).join('');
  const moodBtns = ALL_MOODS.map(m => `
    <button class="debug-btn ${debugForcedMood===m ? 'active':''}" data-mood="${m}">${MOOD_LABELS[m]}</button>
  `).join('');
  const speciesBtns = ALL_SPECIES.map(s => `
    <button class="debug-btn ${debugSpecies===s ? 'active':''}" data-species="${s}">${SPECIES_LABELS[s]}</button>
  `).join('');

  document.getElementById('debugPanelBody').innerHTML = `
    <div class="debug-panel">
      <div class="debug-section">
        <button class="debug-btn wide ${debugMode ? 'active':''}" id="dbgToggleGod">
          ${debugMode ? '✅ Stats al máximo: ON' : '⬜ Stats al máximo: OFF'}
        </button>
      </div>
      <div class="debug-section">
        <h4>Etapa del monito</h4>
        <div class="debug-grid">
          <button class="debug-btn ${!debugForcedStage ? 'active':''}" id="dbgStageAuto">🔄 Auto</button>
          ${stageBtns}
        </div>
      </div>
      <div class="debug-section">
        <h4>Estado de ánimo</h4>
        <div class="debug-grid">
          <button class="debug-btn ${!debugForcedMood ? 'active':''}" id="dbgMoodAuto">🔄 Auto</button>
          ${moodBtns}
        </div>
      </div>
      <div class="debug-section">
        <h4>Especie (prueba)</h4>
        <div class="debug-grid">${speciesBtns}</div>
      </div>
      <div class="debug-section">
        <h4>Minijuegos</h4>
        <div class="debug-grid">
          <button class="debug-btn" id="dbgStars">⭐ Estrellas</button>
          <button class="debug-btn" id="dbgBasketball">🏀 Baloncesto</button>
        </div>
      </div>
      <div class="debug-section">
        <h4>Otras pruebas</h4>
        <div class="debug-grid">
          <button class="debug-btn" id="dbgPoop">💩 Ensuciar</button>
          <button class="debug-btn danger" id="dbgGameOver">💀 Game Over</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('dbgToggleGod').addEventListener('click', () => {
    debugMode = !debugMode;
    updateDebugToggleIcon();
    renderDebugPanel();
  });
  document.getElementById('dbgStageAuto').addEventListener('click', () => {
    debugForcedStage = null; render(); renderDebugPanel();
  });
  document.querySelectorAll('[data-stage]').forEach(el => {
    el.addEventListener('click', () => { debugForcedStage = el.dataset.stage; render(); renderDebugPanel(); });
  });
  document.getElementById('dbgMoodAuto').addEventListener('click', () => {
    debugForcedMood = null; render(); renderDebugPanel();
  });
  document.querySelectorAll('[data-mood]').forEach(el => {
    el.addEventListener('click', () => { debugForcedMood = el.dataset.mood; render(); renderDebugPanel(); });
  });
  document.querySelectorAll('[data-species]').forEach(el => {
    el.addEventListener('click', () => { debugSpecies = el.dataset.species; render(); renderDebugPanel(); });
  });
  document.getElementById('dbgStars').addEventListener('click', () => { closeDebugPanel(); startStarsGame(); });
  document.getElementById('dbgBasketball').addEventListener('click', () => { closeDebugPanel(); startBasketballGame(); });
  document.getElementById('dbgPoop').addEventListener('click', () => {
    state.poop = true; saveState(); render(); renderDebugPanel();
  });
  document.getElementById('dbgGameOver').addEventListener('click', () => {
    closeDebugPanel();
    debugMode = false;
    updateDebugToggleIcon();
    state.health = 0;
    triggerGameOver();
  });
}

function wireButtons(){
  document.getElementById('btnFeed').addEventListener('click', requireAlive(btnFeed));
  document.getElementById('btnPlay').addEventListener('click', requireAlive(openGamesMenu));
  document.getElementById('btnClean').addEventListener('click', requireAlive(btnClean));
  document.getElementById('btnFoodMenu').addEventListener('click', requireAlive(openFoodMenu));
  document.getElementById('btnMed').addEventListener('click', requireAlive(btnMed));
  document.getElementById('btnDebug').addEventListener('click', requireAlive(toggleDebugPanel));
  document.getElementById('btnCloseDebugSide').addEventListener('click', closeDebugPanel);
  document.getElementById('btnReset').addEventListener('click', () => {
    showOverlay(`
      <h3>¿Reiniciar?</h3>
      <p>Se perderá el progreso de ${escapeHtml(state.name)}.</p>
      <button class="overlay-btn" id="btnConfirmReset">Sí, reiniciar</button>
    `);
    document.getElementById('btnConfirmReset').addEventListener('click', () => {
      localStorage.removeItem(SAVE_KEY);
      location.reload();
    });
  });

  document.getElementById('screen').addEventListener('click', (e) => {
    if (e.target.closest('.overlay') || e.target.closest('#gameCanvas') || e.target.closest('#btnShoot')) return;
    if (state.poop) { btnClean(); return; }
  });
}

function boot(){
  gameOver = false;
  catchUp();
  saveState();
  wireButtons();
  render();
  if (!animFrame) animFrame = requestAnimationFrame(loopRender);
  if (!tickTimer) tickTimer = setInterval(tick, TICK_MS);
}

function init(){
  state = loadState();
  if (!state){
    askName();
  } else {
    boot();
  }
}

if (typeof window !== 'undefined'){
  window.addEventListener('DOMContentLoaded', init);
}
