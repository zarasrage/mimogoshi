/* ===================== Mimogoshi — lógica del tamagotchi ===================== */

const GRID = 16;
const CELL = 256 / GRID;

/* Paleta compartida por todos los sprites */
const PALETTES = {
  baby:    { A:'#ffd166', B:'#e8a83a', D:'#fff4d6' },
  child:   { A:'#7bdff2', B:'#4bb7d4', D:'#e7fbff' },
  teen:    { A:'#a29bfe', B:'#7a6ff0', D:'#ece9ff' },
  adult_good:    { A:'#4ee08a', B:'#2fb56a', D:'#e5fff0', C:'#ffe66d' },
  adult_neutral: { A:'#7bdff2', B:'#4bb7d4', D:'#e7fbff' },
  adult_bad:     { A:'#ff8fa3', B:'#e0526f', D:'#ffe3e9', S:'#8a2846' },
  egg:     { A:'#fff4d6', B:'#e8cf94', D:'#ffce4b' },
  ghost:   { A:'#dfeaff', B:'#a9bfe0', D:'#ffffff' },
};

/* Matrices 16x16. '.' = vacío, cualquier otra letra = color de PALETTES[stage][letra] */
const SPRITES = {
  egg: [
    "................",
    "................",
    ".....AAAA.......",
    "....AAAAAA......",
    "...AAAAAAAA.....",
    "..AAAAAAAAAA....",
    "..AAAAAAAAAA....",
    "..AAAADAAAAA....",
    "..AAAAAAAAAA....",
    "..AAAADAAAAA....",
    "..AAAAAAAAAA....",
    "...AAAAAAAA.....",
    "....AAAAAA......",
    ".....AAAA.......",
    "................",
    "................",
  ],
  baby: [
    "................",
    "................",
    "......AAAA......",
    ".....AAAAAA.....",
    "....AAAAAAAA....",
    "...AAAAAAAAAA...",
    "...AAAAAAAAAA...",
    "...AAAAAAAAAA...",
    "...AAAAAAAAAA...",
    "...AAAAAAAAAA...",
    "....AAAAAAAA....",
    ".....AAAAAA.....",
    "......AAAA......",
    "................",
    "................",
    "................",
  ],
  child: [
    "................",
    ".....AAAA.......",
    "....AAAAAA......",
    "...AAAAAAAA.....",
    "..AAAAAAAAAA....",
    "..AAAAAAAAAA....",
    "..AAAAAAAAAA....",
    "..AAAAAAAAAA....",
    "..AAAAAAAAAA....",
    "..AAAAAAAAAA....",
    "...AAAAAAAA.....",
    "...AAAAAAAA.....",
    "...AA....AA.....",
    "...AA....AA.....",
    "................",
    "................",
  ],
  teen: [
    "..AA........AA.",
    ".AAAA......AAAA",
    "..AAAAAAAAAAAA.",
    "..AAAAAAAAAAAA.",
    ".AAAAAAAAAAAAAA",
    ".AAAAAAAAAAAAAA",
    ".AAAAAAAAAAAAAA",
    ".AAAAAAAAAAAAAA",
    ".AAAAAAAAAAAAAA",
    ".AAAAAAAAAAAAAA",
    "..AAAAAAAAAAAA.",
    "..AAAAAAAAAAAA.",
    "...AAAAAAAAAA..",
    "...AA......AA..",
    "...AA......AA..",
    "................",
  ],
  adult_good: [
    "..CC........CC.",
    ".AACC......CCAA",
    "CAAAAAAAAAAAAAAC",
    ".AAAAAAAAAAAAAA.",
    "AAAAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAAAA",
    ".AAAAAAAAAAAAAA.",
    "..AAAAAAAAAAAA..",
    "...AAAAAAAAAA...",
    "...AA......AA...",
    "...AA......AA...",
    "................",
  ],
  adult_neutral: [
    "................",
    "..AA........AA.",
    ".AAAAAAAAAAAAAA.",
    "AAAAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAAAA",
    ".AAAAAAAAAAAAAA.",
    "..AAAAAAAAAAAA..",
    "...AAAAAAAAAA...",
    "...AA......AA...",
    "...AA......AA...",
    "................",
  ],
  adult_bad: [
    "..S........S...",
    ".SAA......AAS..",
    "SAAAAAAAAAAAAAAS",
    ".AAAAAAAAAAAAAA.",
    "AAAAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAAAA",
    ".AAAAAAAAAAAAAA.",
    "..AAAAAAAAAAAA..",
    "...AAAAAAAAAA...",
    "...AA......AA...",
    "...AA......AA...",
    "................",
  ],
  ghost: [
    "................",
    "................",
    "......AAAA......",
    ".....AAAAAA.....",
    "....AAAAAAAA....",
    "...AAAAAAAAAA...",
    "...AAAAAAAAAA...",
    "...AAAAAAAAAA...",
    "...AAAAAAAAAA...",
    "...AAAAAAAAAA...",
    "...AAAAAAAAAA...",
    "...AA.AA.AA.AA..",
    "................",
    "................",
    "................",
    "................",
  ],
};

/* Ancla de la "zona de cara" por etapa: fila donde empiezan los ojos */
const FACE_ROW = {
  egg: 6, baby: 6, child: 5, teen: 5,
  adult_good: 5, adult_neutral: 5, adult_bad: 5, ghost: 6,
};

function normalizeRow(row){
  row = row || '';
  if (row.length < GRID) row = row + '.'.repeat(GRID - row.length);
  return row.slice(0, GRID);
}

function drawSprite(ctx, stage, mood, bounce){
  ctx.clearRect(0,0,256,256);
  const rows = SPRITES[stage] || SPRITES.baby;
  const pal = PALETTES[stage] || PALETTES.baby;
  const bob = bounce ? Math.round(Math.sin(Date.now()/260)*3) : 0;

  ctx.save();
  ctx.translate(0, bob);

  for (let r=0; r<GRID; r++){
    const row = normalizeRow(rows[r]);
    for (let c=0; c<GRID; c++){
      const ch = row[c];
      if (ch === '.') continue;
      const color = pal[ch] || pal.A;
      ctx.fillStyle = color;
      ctx.fillRect(c*CELL, r*CELL, CELL+0.5, CELL+0.5);
    }
  }

  drawFace(ctx, stage, mood);
  ctx.restore();
}

function drawFace(ctx, stage, mood){
  if (mood === 'egg') return;
  const faceRow = FACE_ROW[stage] ?? 5;
  const eyeY = faceRow * CELL;
  const leftX = 5.5 * CELL;
  const rightX = 9.5 * CELL;
  const eyeSize = CELL * 0.9;

  ctx.fillStyle = '#20141c';

  const drawEye = (x) => {
    switch (mood){
      case 'happy':
        ctx.fillRect(x, eyeY+eyeSize*0.4, eyeSize, eyeSize*0.35);
        break;
      case 'sad':
        ctx.fillRect(x, eyeY+eyeSize*0.1, eyeSize, eyeSize*0.55);
        ctx.fillRect(x - eyeSize*0.15, eyeY, eyeSize*0.3, eyeSize*0.2);
        break;
      case 'sick':
        ctx.fillRect(x, eyeY, eyeSize*0.4, eyeSize*0.4);
        ctx.fillRect(x+eyeSize*0.5, eyeY+eyeSize*0.5, eyeSize*0.4, eyeSize*0.4);
        break;
      case 'sleepy':
        ctx.fillRect(x-2, eyeY+eyeSize*0.5, eyeSize+4, eyeSize*0.25);
        break;
      case 'dead':
        ctx.fillRect(x, eyeY, eyeSize*0.4, eyeSize*0.4);
        ctx.fillRect(x+eyeSize*0.5, eyeY+eyeSize*0.4, eyeSize*0.4, eyeSize*0.4);
        ctx.fillRect(x, eyeY+eyeSize*0.4, eyeSize*0.4, eyeSize*0.4);
        ctx.fillRect(x+eyeSize*0.5, eyeY, eyeSize*0.4, eyeSize*0.4);
        break;
      default:
        ctx.fillRect(x, eyeY+eyeSize*0.15, eyeSize*0.55, eyeSize*0.7);
    }
  };
  drawEye(leftX);
  drawEye(rightX);

  const mouthY = eyeY + CELL*2.1;
  const mouthX = 6.5*CELL;
  ctx.fillStyle = '#20141c';
  if (mood === 'happy'){
    ctx.fillRect(mouthX, mouthY, CELL*3, CELL*0.7);
  } else if (mood === 'sad'){
    ctx.fillRect(mouthX+CELL*0.4, mouthY, CELL*2.2, CELL*0.4);
  } else if (mood === 'sick'){
    ctx.fillRect(mouthX, mouthY, CELL*0.7, CELL*0.4);
    ctx.fillRect(mouthX+CELL*1.1, mouthY+CELL*0.3, CELL*0.7, CELL*0.4);
    ctx.fillRect(mouthX+CELL*2.2, mouthY, CELL*0.7, CELL*0.4);
  } else if (mood === 'sleepy'){
    ctx.fillRect(mouthX+CELL*0.8, mouthY, CELL*1.4, CELL*0.35);
  } else {
    ctx.fillRect(mouthX+CELL*0.5, mouthY, CELL*2, CELL*0.4);
  }
}

/* ===================== Estado del juego ===================== */

const SAVE_KEY = 'mimogoshi.save.v1';
const TICK_MS = 4000;             // un "paso" de simulación
const MS_PER_GAME_HOUR = 45000;   // 45s reales = 1 hora de mascota (ajustable)
const STAGE_HOURS = { baby: 3, child: 8, teen: 16 }; // horas de vida hasta la siguiente etapa

let state = null;
let tickTimer = null;
let animFrame = null;
let sleeping = false;
let gameOver = false;

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
  };
}

function loadState(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s !== 'object') return null;
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
  const cappedMs = Math.min(elapsedMs, MS_PER_GAME_HOUR * 24 * 3); // tope: 3 días de mascota
  const hours = cappedMs / MS_PER_GAME_HOUR;
  applyDecay(hours);
  state.lastUpdate = now;
}

function tick(){
  if (gameOver) return;
  catchUp();
  saveState();
  render();
}

function triggerGameOver(){
  gameOver = true;
  clearInterval(tickTimer);
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

function render(){
  if (!state) return;
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
  drawSprite(ctx, state.stage, currentMood(), true);

  document.getElementById('btnMed').disabled = !state.sick;
  document.getElementById('btnSleep').textContent = '';
  document.getElementById('btnSleep').innerHTML = state.sleeping
    ? '<span class="btn-icon">☀️</span><span class="btn-label">Despertar</span>'
    : '<span class="btn-icon">💤</span><span class="btn-label">Dormir</span>';

  const poopBadge = state.poop ? ' 💩' : '';
  document.getElementById('btnClean').querySelector('.btn-label').textContent = 'Limpiar' + poopBadge;
}

function loopRender(){
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
  return (...args) => { if (!gameOver && !minigameActive) fn(...args); };
}

const btnFeed = () => {
  if (state.stage === 'egg') { say('Todavía es un huevo…'); return; }
  catchUp();
  state.hunger = clamp(state.hunger + 28);
  state.energy = clamp(state.energy + 4);
  floatFx('🍖');
  say('¡Ñam ñam!');
  saveState(); render();
};

const btnClean = () => {
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

const btnSleep = () => {
  catchUp();
  state.sleeping = !state.sleeping;
  say(state.sleeping ? 'Zzz…' : '¡Buenos días!');
  saveState(); render();
};

/* ===================== Minijuego (atrapar estrellas) ===================== */

let minigameActive = false;
let mg = null;

function startMinigame(){
  if (state.stage === 'egg'){ say('Todavía es un huevo…'); return; }
  if (state.energy < 12){ say('Está muy cansado para jugar'); return; }
  if (state.sleeping){ say('Está durmiendo…'); return; }

  catchUp();
  minigameActive = true;
  document.getElementById('petCanvas').classList.add('hidden');
  const gc = document.getElementById('gameCanvas');
  gc.classList.remove('hidden');
  const ctx = gc.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  mg = {
    ctx, gc,
    basketX: gc.width/2,
    items: [],
    score: 0,
    timeLeft: 10,
    lastSpawn: 0,
    keys: {left:false, right:false},
    raf: null,
    startedAt: performance.now(),
  };

  const onKey = (down) => (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') mg.keys.left = down;
    if (e.key === 'ArrowRight' || e.key === 'd') mg.keys.right = down;
  };
  mg.onKeyDown = onKey(true);
  mg.onKeyUp = onKey(false);
  window.addEventListener('keydown', mg.onKeyDown);
  window.addEventListener('keyup', mg.onKeyUp);

  mg.onMove = (e) => {
    const rect = gc.getBoundingClientRect();
    const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
    const relX = (clientX - rect.left) / rect.width * gc.width;
    mg.basketX = Math.max(14, Math.min(gc.width-14, relX));
  };
  gc.addEventListener('pointermove', mg.onMove);

  say('¡Atrapa las estrellas!');
  mgLoop(performance.now());
}

function mgLoop(t){
  if (!minigameActive || !mg) return;
  const dt = Math.min(0.05, (t - (mg.lastT || t)) / 1000);
  mg.lastT = t;
  mg.timeLeft -= dt;

  if (mg.keys.left) mg.basketX = Math.max(14, mg.basketX - 220*dt);
  if (mg.keys.right) mg.basketX = Math.min(mg.gc.width-14, mg.basketX + 220*dt);

  mg.lastSpawn -= dt;
  if (mg.lastSpawn <= 0){
    mg.lastSpawn = 0.55 + Math.random()*0.4;
    mg.items.push({ x: 16+Math.random()*(mg.gc.width-32), y: -10, vy: 70+Math.random()*50, star: Math.random() > 0.2 });
  }

  const ctx = mg.ctx, gc = mg.gc;
  ctx.clearRect(0,0,gc.width, gc.height);
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  for (let i=0;i<gc.width;i+=16) ctx.fillRect(i,0,1,gc.height);

  mg.items.forEach(it => { it.y += it.vy * dt; });

  for (let i=mg.items.length-1; i>=0; i--){
    const it = mg.items[i];
    if (it.y > gc.height + 12){ mg.items.splice(i,1); continue; }
    const caught = it.y > gc.height-26 && Math.abs(it.x - mg.basketX) < 18;
    if (caught){
      mg.score += it.star ? 1 : -1;
      mg.items.splice(i,1);
      floatFx(it.star ? '⭐' : '💩');
      continue;
    }
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(it.star ? '⭐' : '💩', it.x, it.y);
  }

  ctx.fillStyle = '#ffe66d';
  ctx.beginPath();
  ctx.moveTo(mg.basketX-16, gc.height-6);
  ctx.lineTo(mg.basketX+16, gc.height-6);
  ctx.lineTo(mg.basketX, gc.height-26);
  ctx.closePath();
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.font = '11px monospace';
  ctx.fillText('⭐ ' + mg.score, 8, 16);
  ctx.fillText(Math.max(0, mg.timeLeft).toFixed(1) + 's', gc.width-46, 16);

  if (mg.timeLeft <= 0){
    endMinigame();
    return;
  }
  mg.raf = requestAnimationFrame(mgLoop);
}

function endMinigame(){
  const score = mg ? mg.score : 0;
  window.removeEventListener('keydown', mg.onKeyDown);
  window.removeEventListener('keyup', mg.onKeyUp);
  mg.gc.removeEventListener('pointermove', mg.onMove);
  if (mg.raf) cancelAnimationFrame(mg.raf);

  document.getElementById('gameCanvas').classList.add('hidden');
  document.getElementById('petCanvas').classList.remove('hidden');

  const happinessGain = clamp(score * 6, -10, 45);
  state.happiness = clamp(state.happiness + happinessGain);
  state.energy = clamp(state.energy - 18);
  state.hygiene = clamp(state.hygiene - 5);

  say(score > 0 ? `¡${score} estrellas! +${happinessGain} felicidad` : 'Mmm, la próxima será');
  minigameActive = false;
  mg = null;
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

function wireButtons(){
  document.getElementById('btnFeed').addEventListener('click', requireAlive(btnFeed));
  document.getElementById('btnPlay').addEventListener('click', requireAlive(startMinigame));
  document.getElementById('btnClean').addEventListener('click', requireAlive(btnClean));
  document.getElementById('btnSleep').addEventListener('click', requireAlive(btnSleep));
  document.getElementById('btnMed').addEventListener('click', requireAlive(btnMed));
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
    if (e.target.closest('.overlay') || e.target.closest('#gameCanvas')) return;
    if (state.poop) { btnClean(); return; }
  });
}

function boot(){
  gameOver = false;
  sleeping = state.sleeping;
  catchUp();
  saveState();
  wireButtons();
  render();
  if (!animFrame) loopRender();
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
