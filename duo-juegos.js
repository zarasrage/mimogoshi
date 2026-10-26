/* ===================== Juegos de a dos =====================
   Seis minijuegos con dos personajes en pantalla: la mascota y el
   acompañante (si hay uno; si no, viene una visita de otra especie solo para
   esa partida, ver duoGuest()). Los dos los maneja la misma persona: no es
   un "jugador 2", es coordinar a dos a la vez — la gracia de cada juego es
   esa coordinación (atrapar en espejo, pasarse la pelota, copiar un baile,
   seguir una caja, lanzarse en el sube y baja, saltar en fila).

   Van al final del menú de Jugar, en su propia sección ("De a dos"), con el
   mismo sistema que los otros seis: precio, niveles, récords por nivel,
   Megajuego y mérito (~45 = partida muy buena, calibrado con bots que juegan
   contra las funciones reales de cada juego).

   Comparten una sola variable de partida (`dg`) porque nunca hay dos
   minijuegos a la vez, y cada uno separa la lógica (`step(dt)`) del dibujo:
   así un bot puede jugar miles de partidas sin canvas para calibrar. */

const DUO_GAMES = [
  { id:'espejo',     name:'Espejo',           emoji:'🌗', desc:'Atrapan en espejo',        price: 30, start: () => startEspejoGame() },
  { id:'voley',      name:'Voleibol',         emoji:'🏐', desc:'Que no toque el suelo',    price: 35, start: () => startVoleyGame() },
  { id:'baile',      name:'Copia el baile',   emoji:'👯', desc:'Repite los pasos',         price: 40, start: () => startBaileGame() },
  { id:'escondidas', name:'Escondidas',       emoji:'📦', desc:'¿En qué caja quedó?',      price: 45, start: () => startEscondidasGame() },
  { id:'subebaja',   name:'Sube y baja',      emoji:'🎈', desc:'Revienta los globos',      price: 50, start: () => startSubebajaGame() },
  { id:'dupla',      name:'Carrera en dupla', emoji:'🏃', desc:'Salten a tiempo los dos',  price: 60, start: () => startDuplaGame() },
];
GAMES.push(...DUO_GAMES.map(g => ({ ...g, duo: true })));

/* ---------- lo compartido ---------- */

let dg = null;   // la partida de a dos en curso

/* El acompañante si hay uno; si no, una visita de otra especie. */
function duoGuest(){
  const c = state.companion;
  if (c && SPECIES[c.species]) return { species: c.species, name: c.name };
  const otras = SPECIES_IDS.filter(id => id !== currentSpeciesId());
  const sp = pickOne(otras.length ? otras : SPECIES_IDS);
  return { species: sp, name: SPECIES_RAW[sp].name, visita: true };
}

/* Un personaje dentro de un minijuego: la misma forma que un actor (ver
   pickAnimation), sin tocar petAction ni el paseo de la pieza. */
function gameActor(species){
  return { isMain: false, key: 'game', species, action: null, anim: 'idle', animT0: 0 };
}
function gaLoop(ga, name){ if (ga.anim !== name){ ga.anim = name; ga.animT0 = performance.now(); } }
function gaOnce(ga, name){ ga.action = { name, startedAt: performance.now() }; }

/* Dibuja un personaje apoyado en (x, suelo), a escala 2 entera como
   drawPetAt(). `flip` lo da vuelta (mira a la izquierda): un -1 entero no
   rompe la regla de las escalas. */
function drawActorAt(ctx, ga, x, suelo, flip = false, alpha = 1){
  ctx.save();
  if (alpha !== 1) ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x), Math.round(suelo - CANVAS_H));
  if (flip) ctx.scale(-1, 1);
  ctx.translate(-CANVAS_W / 2, 0);
  drawSprite(ctx, 'adult', 'normal', 0, true, 2, undefined, ga);
  ctx.restore();
}

const shortName = s => s.length > 10 ? s.slice(0, 9) + '…' : s;

function dgNew(id, extra){
  const guest = duoGuest();
  dexSeen(guest.species);   // la visita entra al Mimodex (logros.js)
  const { gc, ctx } = enterMinigame(id);
  dg = Object.assign({
    id, gc, ctx, w: gc.width, h: gc.height, cleanup: [], fx: [], pops: [], raf: null, lastT: 0,
    main: gameActor(currentSpeciesId()), guest: gameActor(guest.species),
    mainName: state.name, guestName: guest.name, score: 0, over: false,
  }, extra);
  return dg;
}

function dgListen(target, ev, fn, opts){
  target.addEventListener(ev, fn, opts);
  dg.cleanup.push(() => target.removeEventListener(ev, fn, opts));
}

function dgKeys(map){
  dgListen(window, 'keydown', e => { const f = map[e.key]; if (f && !e.repeat){ e.preventDefault(); f(); } });
}

/* Botón de mando: pointerdown como wireGameButton, y un destello al tocarlo. */
function dgButton(el, fn){
  wireGameButton(el, () => {
    el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
    fn();
  });
}

function dgRun(step, draw, end){
  const g = dg;
  g.stepFn = step; g.drawFn = draw; g.endFn = end;
  const loop = t => {
    if (dg !== g || activeMinigame !== g.id) return;
    const dt = Math.min(0.05, (t - (g.lastT || t)) / 1000);
    g.lastT = t;
    step(dt);
    dgStepFx(g, dt);
    if (g.over){ end(); return; }
    draw();
    g.raf = requestAnimationFrame(loop);
  };
  g.raf = requestAnimationFrame(loop);
}

function dgDispose(){
  if (!dg) return;
  if (dg.raf) cancelAnimationFrame(dg.raf);
  for (const f of dg.cleanup) f();
  dg = null;
}
minigameDisposers.push(dgDispose);

function dgFinish(opts){
  const id = dg.id;
  dgDispose();
  finishMinigame(id, opts);
}

/* Partículas y textos que suben y se desvanecen, dentro del canvas. */
function dgFx(char, x, y, size = 15){ if (dg) dg.fx.push({ char, x, y, vy: -42, life: 0.7, size }); }
function dgPop(text, x, y, color = '#fff'){ if (dg) dg.pops.push({ text, x, y, life: 0.9, color }); }
function dgStepFx(g, dt){
  for (const list of [g.fx, g.pops]){
    for (let i = list.length - 1; i >= 0; i--){
      const f = list[i];
      f.life -= dt;
      if (f.life <= 0){ list.splice(i, 1); continue; }
      f.y += (f.vy || -26) * dt;
    }
  }
}
function dgDrawFx(ctx, g){
  for (const f of g.fx){
    ctx.globalAlpha = Math.min(1, f.life * 2);
    drawEmoji(ctx, f.char, f.size, f.x, f.y);
  }
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const p of g.pops){
    ctx.globalAlpha = Math.min(1, p.life * 2);
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillText(p.text, p.x + 1, p.y + 1);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;
}

/* Barra de arriba: puntaje, centro y derecha, igual que los otros juegos. */
function dgHud(ctx, w, left, right, center, centerColor = 'rgba(255,255,255,.85)'){
  ctx.font = '11px monospace';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.fillText(left, 8, 16);
  ctx.textAlign = 'right';
  ctx.fillText(right, w - 8, 16);
  if (center){
    ctx.textAlign = 'center';
    ctx.fillStyle = centerColor;
    ctx.fillText(center, w / 2, 16);
  }
}

const hearts = n => '💗'.repeat(Math.max(0, n));

/* Fondo con degradado vertical, cacheado por partida (es fijo). */
function dgBackdrop(g, top, bottom, extra){
  if (!g.bg){
    const c = document.createElement('canvas');
    c.width = g.w; c.height = g.h;
    const x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, g.h);
    gr.addColorStop(0, top); gr.addColorStop(1, bottom);
    x.fillStyle = gr;
    x.fillRect(0, 0, g.w, g.h);
    if (extra) extra(x, g.w, g.h);
    g.bg = c;
  }
  g.ctx.drawImage(g.bg, 0, 0);
}

/* ===================== De a dos 1: Espejo =====================
   La pantalla se parte al medio: la mascota a la izquierda y la visita a la
   derecha, y se mueven en espejo con un solo deslizador (si una va hacia el
   centro, la otra también). En cada mitad cae lo suyo, independiente: hay que
   elegir una posición que le sirva a las dos. Los corazones caen de a pares,
   exactamente en espejo, y siempre se pueden atrapar los dos: son los que
   valen y los únicos que, si se caen, cortan el combo (las estrellas sueltas
   no, porque no siempre se puede con las dos mitades a la vez). */

const ES_DURATION = 25;
const ES_HALF = 16;            // medio ancho de lo que atrapa cada uno
const ES_CHAR = { star: '⭐', gold: '🌟', poop: '💩', heart: '💗' };
const ES_PAIR_CHANCE = 0.14;
const ES_PAIR_BONUS = 4;

function startEspejoGame(){
  const g = dgNew('espejo', { items: [], combo: 0, bestCombo: 0, pairs: 0, time: ES_DURATION, spawnIn: 0.5,
    keys: { l: false, r: false }, nextPair: 1, vx: 0 });
  g.x = esMinX() + (esMaxX() - esMinX()) * 0.5;
  const cont = showGameControls(`
    <div class="game-hint">Se mueven en espejo: atrapa para los dos</div>
    <input type="range" class="game-slider" id="esSlider" min="0" max="1000" value="500">`);
  const slider = cont.querySelector('#esSlider');
  g.slider = slider;
  dgListen(slider, 'input', () => { g.x = esMinX() + (esMaxX() - esMinX()) * (+slider.value / 1000); });
  dgListen(window, 'keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'a') g.keys.l = true; if (e.key === 'ArrowRight' || e.key === 'd') g.keys.r = true; });
  dgListen(window, 'keyup', e => { if (e.key === 'ArrowLeft' || e.key === 'a') g.keys.l = false; if (e.key === 'ArrowRight' || e.key === 'd') g.keys.r = false; });
  say('¡Atrapen en espejo!');
  dgRun(esStep, esDraw, endEspejoGame);
}

function esMinX(){ return ES_HALF + 6; }
function esMaxX(){ return dg.w / 2 - ES_HALF - 6; }
function esMult(){ return Math.min(4, 1 + Math.floor(dg.combo / 5)); }

function esSpawn(progress){
  const g = dg, L = levelT();
  const vy = (95 + 120 * progress) * (1 + 0.45 * L) * (0.85 + Math.random() * 0.3);
  const half = g.w / 2;
  const randX = () => 12 + Math.random() * (half - 24);
  if (Math.random() < ES_PAIR_CHANCE){
    const x = randX(), pair = g.nextPair++;
    g.items.push({ x, y: -12, vy, kind: 'heart', side: 0, pair });
    g.items.push({ x: g.w - x, y: -12, vy, kind: 'heart', side: 1, pair });
    return;
  }
  const side = Math.random() < 0.5 ? 0 : 1;
  const r = Math.random();
  const poop = 0.18 + 0.30 * progress + 0.12 * L;
  const kind = r < poop ? 'poop' : r > 0.94 ? 'gold' : 'star';
  const x = randX();
  g.items.push({ x: side ? g.w - x : x, y: -12, vy, kind, side });
}

function esCatch(it){
  const g = dg;
  if (it.kind === 'poop'){
    g.score -= 2; g.combo = 0;
    dgFx('💩', it.x, it.y);
    return;
  }
  g.combo++;
  g.bestCombo = Math.max(g.bestCombo, g.combo);
  const pts = (it.kind === 'gold' ? 3 : it.kind === 'heart' ? 2 : 1) * esMult();
  g.score += pts;
  dgFx(ES_CHAR[it.kind], it.x, it.y);
  if (it.kind === 'heart'){
    const other = g.items.find(o => o.pair === it.pair && o !== it);
    if (!other && it.pairHalf){   // la otra mitad ya se atrapó
      g.score += ES_PAIR_BONUS * esMult();
      g.pairs++;
      dgPop(`¡Par! +${ES_PAIR_BONUS * esMult()}`, g.w / 2, it.y - 14, '#ff9bd2');
    }
  }
}

function esStep(dt){
  const g = dg;
  g.time -= dt;
  const progress = 1 - Math.max(0, g.time) / ES_DURATION;
  const prevX = g.x;
  if (g.keys.l || g.keys.r){
    if (g.keys.l) g.x -= 220 * dt;
    if (g.keys.r) g.x += 220 * dt;
    g.x = Math.min(esMaxX(), Math.max(esMinX(), g.x));
    if (g.slider) g.slider.value = Math.round((g.x - esMinX()) / (esMaxX() - esMinX()) * 1000);
  }
  g.vx = dt > 0 ? (g.x - prevX) / dt : 0;
  g.moving = Math.abs(g.x - (g.lastX ?? g.x)) > 0.3;
  g.lastX = g.x;

  g.spawnIn -= dt;
  if (g.spawnIn <= 0){
    g.spawnIn = (0.62 - 0.30 * progress) * (1 - 0.25 * levelT());
    esSpawn(progress);
  }
  const catchY = g.h - 40;
  const cx = [g.x, g.w - g.x];
  for (let i = g.items.length - 1; i >= 0; i--){
    const it = g.items[i];
    it.y += it.vy * dt;
    if (it.y > catchY && it.y < g.h - 8 && Math.abs(it.x - cx[it.side]) < ES_HALF + 4){
      g.items.splice(i, 1);
      /* El bono del par se paga al atrapar la segunda mitad. */
      if (it.kind === 'heart'){
        const other = g.items.find(o => o.pair === it.pair);
        if (other) other.pairHalf = true;
        else it.pairHalf = true;
      }
      esCatch(it);
      continue;
    }
    if (it.y > g.h + 14){
      g.items.splice(i, 1);
      if (it.kind === 'heart'){
        g.combo = 0;
        const other = g.items.find(o => o.pair === it.pair);
        if (other) other.pair = -1;   // la otra mitad ya no completa el par
      }
    }
  }
  if (g.time <= 0) g.over = true;
}

function esDraw(){
  const g = dg, ctx = g.ctx, w = g.w, h = g.h;
  dgBackdrop(g, '#2b2550', '#1a1a33', (x, w, h) => {
    x.fillStyle = 'rgba(255,170,120,.10)'; x.fillRect(0, 0, w / 2, h);
    x.fillStyle = 'rgba(120,200,255,.10)'; x.fillRect(w / 2, 0, w / 2, h);
    x.fillStyle = 'rgba(255,255,255,.35)';
    for (let y = 22; y < h; y += 10) x.fillRect(Math.round(w / 2) - 1, y, 2, 5);
  });
  for (const it of g.items){
    drawEmoji(ctx, ES_CHAR[it.kind], it.kind === 'heart' ? 20 : 18, it.x, it.y);
  }
  /* Los dos miran al centro: la visita es el reflejo de la mascota. */
  const anim = g.moving ? 'walk' : g.combo >= 5 ? 'happy' : 'idle';
  gaLoop(g.main, anim); gaLoop(g.guest, anim);
  drawActorAt(ctx, g.main, g.x, h, false);
  drawActorAt(ctx, g.guest, w - g.x, h, true);
  dgDrawFx(ctx, g);
  dgHud(ctx, w, '⭐ ' + g.score, Math.max(0, g.time).toFixed(1) + 's',
    g.combo >= 2 ? `combo ${g.combo}  x${esMult()}` : '', esMult() > 1 ? '#ffe66d' : 'rgba(255,255,255,.7)');
}

/* Calibrado con bots contra esStep(): uno bueno (reacción 0.2 s, un poco
   impreciso) saca una mediana de ~180, uno experto ~200 (pero con mucha
   varianza: depende de cómo caigan las cosas en las dos mitades). */
function esMerit(score){ return score * 0.25; }

function endEspejoGame(){
  const g = dg;
  const score = g.score;
  const message = score > 0 ? `${score} pts · ${g.pairs} pares` : 'Mmm, la próxima será';
  dgFinish({ score, merit: esMerit(score), energyCost: 16, hygieneCost: 3, message });
}

/* ===================== De a dos 2: Voleibol =====================
   Cooperativo: se pasan la pelota por encima de la red y no puede tocar el
   suelo. Cada uno tiene su botón; se aprieta el del que recibe justo cuando
   la pelota le llega arriba de la cabeza (el anillo se cierra). El que
   recibe corre solo a donde va a caer: lo único que se juega es el momento
   y a quién le toca. A veces uno "coloca" (la pelota sube y le vuelve a él
   mismo) y el golpe siguiente es un remate, más rápido, al otro lado: así no
   alcanza con alternar los botones a ciegas. Cada pase acelera la pelota.
   3 vidas, 45 segundos. */

const VB_DURATION = 45;
const VB_LIVES = 3;
const VB_T0 = 1.25;            // segundos de vuelo del primer pase
const VB_TMIN = 0.62;          // lo más rápido que llega a ir
const VB_TSTEP = 0.028;        // cuánto acelera por pase
const VB_PERFECT = 0.06;       // ventana perfecta (± s)
const VB_GOOD = 0.14;          // ventana de golpe (± s)
const VB_COOLDOWN = 0.3;       // apretar de más deja al personaje sin poder saltar un rato
const VB_SET_CHANCE = [0.05, 0.3];
const VB_RALLY_BONUS = 10;     // cada tantos pases seguidos, +5

function startVoleyGame(){
  const g = dgNew('voley', { time: VB_DURATION, lives: VB_LIVES, rally: 0, bestRally: 0, perfects: 0,
    ball: null, wait: 0.9, serveSide: 0, cool: [0, 0] });
  g.ground = g.h - 8;
  g.hitY = g.ground - 72;
  g.netTop = g.ground - Math.max(40, g.h * 0.36);
  g.chars = [
    { ga: g.main, x: g.w * 0.24, tx: g.w * 0.24, speed: 0, jumpT: -1 },
    { ga: g.guest, x: g.w * 0.76, tx: g.w * 0.76, speed: 0, jumpT: -1 },
  ];
  const cont = showGameControls(`
    <div class="game-hint">Golpea cuando el anillo se cierra sobre su cabeza</div>
    <div class="gbtn-row2">
      <button class="gbtn gbtn-lg" id="vbA">◀ ${escapeHtml(shortName(g.mainName))}</button>
      <button class="gbtn gbtn-lg" id="vbB">${escapeHtml(shortName(g.guestName))} ▶</button>
    </div>`);
  dgButton(cont.querySelector('#vbA'), () => vbPress(0));
  dgButton(cont.querySelector('#vbB'), () => vbPress(1));
  dgKeys({ ArrowLeft: () => vbPress(0), a: () => vbPress(0), ArrowRight: () => vbPress(1), l: () => vbPress(1) });
  say('¡Que no toque el suelo!');
  dgRun(vbStep, vbDraw, endVoleyGame);
}

function vbFlightT(){
  const L = levelT();
  return Math.max(VB_TMIN * (1 - 0.18 * L), (VB_T0 - dg.rally * VB_TSTEP) * (1 - 0.22 * L));
}

function vbSideX(side){
  const w = dg.w;
  return side === 0 ? w * (0.12 + Math.random() * 0.26) : w * (0.62 + Math.random() * 0.26);
}

/* Lanza la pelota desde (x, y) hacia el lado `to`. El alto del arco se
   calcula para que pase la red con aire; una colocada sube derecho y vuelve
   al mismo lado. */
function vbLaunch(x0, y0, to, T, kind){
  const g = dg;
  const tx = kind === 'set' ? Math.min(Math.max(x0 + (Math.random() - 0.5) * g.w * 0.12, to ? g.w * 0.6 : g.w * 0.1), to ? g.w * 0.9 : g.w * 0.4)
    : vbSideX(to);
  const ty = g.hitY;
  let H;
  if (kind === 'set'){
    H = Math.min(ty - 18, g.h * 0.32);
  } else {
    const u = (g.w / 2 - x0) / (tx - x0);
    const lineY = lerp(y0, ty, u);
    const need = (lineY - (g.netTop - 12)) / (4 * u * (1 - u));
    H = kind === 'spike' ? Math.max(need, 8) : Math.max(need, 20) + Math.random() * 14;
    H = Math.min(H, Math.min(y0, ty) - 18 + 4 * 0.25 * 0);   // que no se salga por arriba
    H = Math.max(H, need);
  }
  g.ball = { x0, y0, tx, ty, H, t: 0, T, to, kind };
  const c = g.chars[to];
  c.tx = tx;
  c.speed = Math.abs(tx - c.x) / Math.max(0.2, T - 0.25);
}

function vbBallPos(b){
  const u = b.t / b.T;
  return { x: lerp(b.x0, b.tx, u), y: lerp(b.y0, b.ty, u) - 4 * b.H * u * (1 - u) };
}

function vbPress(side){
  const g = dg;
  if (!g || g.over || g.cool[side] > 0) return;
  g.cool[side] = VB_COOLDOWN;
  const c = g.chars[side];
  c.jumpT = 0;
  const b = g.ball;
  const err = b && b.to === side && !b.missed ? Math.abs(b.t - b.T) : Infinity;
  if (err > VB_GOOD){
    dgPop('¡Uy!', c.x, g.hitY - 22, 'rgba(255,255,255,.8)');
    return;
  }
  const perfect = err <= VB_PERFECT;
  g.rally++;
  g.bestRally = Math.max(g.bestRally, g.rally);
  g.score += perfect ? 2 : 1;
  if (perfect) g.perfects++;
  dgPop(perfect ? '¡Perfecto!' : '¡Bien!', c.x, g.hitY - 24, perfect ? '#ffe66d' : '#c8f7ff');
  tone({ freq: perfect ? 880 : 660, durationMs: 90, type: 'triangle', vol: 0.1 });
  if (g.rally % VB_RALLY_BONUS === 0){
    g.score += 5;
    dgPop(`¡Rally ${g.rally}! +5`, g.w / 2, 34, '#ff9bd2');
  }
  gaOnce(c.ga, 'happy');
  /* Qué viene: remate después de una colocada, a veces colocada, si no pase. */
  const pos = vbBallPos(b);
  const T = vbFlightT();
  const progress = 1 - Math.max(0, g.time) / VB_DURATION;
  if (b.kind === 'set') vbLaunch(pos.x, pos.y, 1 - side, T * 0.72, 'spike');
  else if (Math.random() < lerp(VB_SET_CHANCE[0], VB_SET_CHANCE[1], progress)){
    vbLaunch(pos.x, pos.y, side, T * 1.05, 'set');
    dgPop('¡Colocada!', c.x, g.hitY - 40, '#ffd166');
  } else vbLaunch(pos.x, pos.y, 1 - side, T, 'pass');
}

function vbStep(dt){
  const g = dg;
  g.time -= dt;
  g.cool[0] = Math.max(0, g.cool[0] - dt);
  g.cool[1] = Math.max(0, g.cool[1] - dt);
  for (const c of g.chars){
    const d = c.tx - c.x;
    const s = Math.max(c.speed, 40) * dt;
    if (Math.abs(d) <= s){ c.x = c.tx; c.moving = false; }
    else { c.x += Math.sign(d) * s; c.moving = true; }
    if (c.jumpT >= 0){ c.jumpT += dt; if (c.jumpT > 0.3) c.jumpT = -1; }
  }
  if (!g.ball){
    g.wait -= dt;
    if (g.wait <= 0){
      if (g.time <= 0 || g.lives <= 0){ g.over = true; return; }
      const c = g.chars[g.serveSide];
      c.jumpT = 0;
      gaOnce(c.ga, 'happy');
      vbLaunch(c.x, g.hitY, 1 - g.serveSide, VB_T0 * (1 - 0.22 * levelT()), 'pass');
    }
    return;
  }
  const b = g.ball;
  b.t += dt;
  if (!b.missed && b.t > b.T + VB_GOOD){
    b.missed = true;
    g.rally = 0;
  }
  if (b.missed){
    const p = vbBallPos(b);
    if (p.y >= g.ground - 8){
      g.lives--;
      g.ball = null;
      g.serveSide = b.to;
      g.wait = 1.1;
      dgFx('💥', p.x, g.ground - 10, 18);
      dgPop('¡Se cayó!', p.x, g.ground - 34, '#ff8b8b');
      sfxFail();
      gaOnce(g.chars[b.to].ga, 'sad');
      if (g.lives <= 0) g.wait = 0.9;
    }
  }
  if (g.time <= 0 && g.ball && !g.ball.missed && g.ball.t < 0.05){
    /* Se acabó el tiempo: el pase en el aire termina limpio. */
    g.over = true;
  }
}

function vbDraw(){
  const g = dg, ctx = g.ctx, w = g.w, h = g.h;
  dgBackdrop(g, '#5fc8ff', '#c9f1ff', (x, w, h) => {
    x.fillStyle = 'rgba(255,255,255,.55)';
    x.beginPath(); x.ellipse(w * 0.2, h * 0.22, 26, 9, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(w * 0.72, h * 0.14, 20, 7, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#f4d58d'; x.fillRect(0, h - 8, w, 8);
    x.fillStyle = '#e2bd6a'; for (let i = 0; i < w; i += 7) x.fillRect(i, h - 8 + (i % 3), 2, 1);
  });
  /* Red */
  ctx.fillStyle = '#fff';
  ctx.fillRect(Math.round(w / 2) - 1, g.netTop, 3, g.ground - g.netTop);
  ctx.strokeStyle = 'rgba(255,255,255,.75)';
  ctx.lineWidth = 1;
  for (let y = g.netTop + 3; y < g.netTop + 22; y += 5){
    ctx.beginPath(); ctx.moveTo(w / 2 - 7, y + 0.5); ctx.lineTo(w / 2 + 8, y + 0.5); ctx.stroke();
  }
  ctx.fillStyle = '#ff5d8f';
  ctx.fillRect(Math.round(w / 2) - 8, g.netTop - 2, 17, 3);

  const b = g.ball;
  if (b){
    const p = vbBallPos(b);
    /* Sombra en la arena: dice dónde va a caer. */
    const k = Math.max(0.3, 1 - (g.ground - p.y) / h);
    ctx.fillStyle = `rgba(0,0,0,${0.25 * k})`;
    ctx.beginPath(); ctx.ellipse(p.x, g.ground - 2, 9 * k, 3 * k, 0, 0, Math.PI * 2); ctx.fill();
    /* Anillo de tiempo sobre la cabeza del que recibe. */
    if (!b.missed){
      const c = g.chars[b.to];
      const left = b.T - b.t;
      const r = 7 + 26 * Math.min(1, Math.max(0, left / 0.7));
      const inWin = Math.abs(left) <= VB_GOOD;
      ctx.strokeStyle = inWin ? '#5dff9b' : 'rgba(255,255,255,.75)';
      ctx.lineWidth = inWin ? 3 : 2;
      ctx.beginPath(); ctx.arc(c.tx, g.hitY, r, 0, Math.PI * 2); ctx.stroke();
    }
  }
  g.chars.forEach((c, i) => {
    const jy = c.jumpT >= 0 ? 4 * (c.jumpT / 0.3) * (1 - c.jumpT / 0.3) * 16 : 0;
    if (!c.ga.action) gaLoop(c.ga, c.moving ? 'walk' : 'idle');
    const face = b && !b.missed ? b.to !== i ? c.x > w / 2 : (vbBallPos(b).x < c.x) : i === 1;
    drawActorAt(ctx, c.ga, c.x, g.ground - jy, face);
  });
  if (b) drawEmoji(ctx, '🏐', 18, vbBallPos(b).x, vbBallPos(b).y);
  dgDrawFx(ctx, g);
  dgHud(ctx, w, '🏐 ' + g.score, Math.max(0, g.time).toFixed(0) + 's  ' + hearts(g.lives),
    g.rally >= 2 ? `pases ${g.rally}` : '', g.rally >= VB_RALLY_BONUS ? '#ffe66d' : 'rgba(0,0,0,.55)');
}

/* Bot bueno (error de ±65 ms, a veces el botón equivocado): mediana ~79;
   experto (±35 ms): ~146. */
function vbMerit(score){ return score * 0.45; }

function endVoleyGame(){
  const g = dg;
  const message = g.score > 0 ? `${g.score} pts · mejor rally ${g.bestRally}` : 'Mmm, la próxima será';
  dgFinish({ score: g.score, merit: vbMerit(g.score), energyCost: 18, message });
}

/* ===================== De a dos 3: Copia el baile =====================
   La visita baila una secuencia de pasos (cada uno con su nota) y la mascota
   tiene que repetirla con los cuatro botones. La secuencia crece de a un
   paso por ronda —se agrega uno al final, no se sortea de nuevo, igual que
   Memorice— y se acelera. Desde la ronda 4 algunas rondas son "¡al revés!":
   hay que repetirla de atrás para adelante, y valen doble. Dos corazones:
   un error repite la misma ronda. Al completar una, bailan los dos juntos la
   secuencia entera. */

const BL_MOVES = [
  { id: 'salta',  label: 'Salta',  icon: '⬆️', note: 1, color: '#ff7ab8' },
  { id: 'gira',   label: 'Gira',   icon: '🔄', note: 3, color: '#ffd166' },
  { id: 'agacha', label: 'Agacha', icon: '⬇️', note: 5, color: '#6be3ff' },
  { id: 'brilla', label: 'Brilla', icon: '✨', note: 8, color: '#b88cff' },
];
const BL_LIVES = 2;
const BL_MOVE_MS = 360;
const BL_INPUT_TIMEOUT = 5;
const BL_REVERSE_FROM = 4;

function startBaileGame(){
  const L = levelT();
  const startLen = 3 + Math.round(2 * L);
  const seq = [];
  for (let i = 0; i < startLen; i++) seq.push(Math.floor(Math.random() * 4));
  const g = dgNew('baile', { seq, round: 1, lives: BL_LIVES, phase: 'intro', t: 0, k: 0, reverse: false,
    showI: -1, idle: 0, flash: null, moves: 0 });
  g.dancers = [
    { ga: g.main, x: g.w * 0.3, flip: false, move: null, mt0: 0 },
    { ga: g.guest, x: g.w * 0.7, flip: true, move: null, mt0: 0 },
  ];
  const cont = showGameControls(`
    <div class="game-hint" id="blHint">Mira a ${escapeHtml(g.guestName)}…</div>
    <div class="gbtn-row4">
      ${BL_MOVES.map((m, i) => `<button class="gbtn" data-bl="${i}" style="--hit:${m.color}"><span class="gbtn-ico">${m.icon}</span>${m.label}</button>`).join('')}
    </div>`);
  g.hintEl = cont.querySelector('#blHint');
  cont.querySelectorAll('[data-bl]').forEach(el => dgButton(el, () => blPress(+el.dataset.bl)));
  dgKeys({ ArrowUp: () => blPress(0), ArrowRight: () => blPress(1), ArrowLeft: () => blPress(1), ArrowDown: () => blPress(2), ' ': () => blPress(3) });
  dgRun(blStep, blDraw, endBaileGame);
}

function blBeat(){ return Math.max(0.34, 0.62 - 0.03 * dg.round) * (1 - 0.25 * levelT()); }

function blPerform(d, mi, sound = true){
  const m = BL_MOVES[mi];
  d.move = m.id; d.mt0 = performance.now();
  if (m.id === 'salta') gaOnce(d.ga, 'happy');
  if (m.id === 'agacha') gaOnce(d.ga, 'sad');
  if (m.id === 'brilla'){ gaOnce(d.ga, 'celebrate'); dgFx('✨', d.x + (Math.random() * 30 - 15), dg.h - 70); }
  dg.flash = { color: m.color, t: performance.now() };
  if (sound) tone({ freq: SFX_SCALE[m.note], durationMs: 180, type: 'triangle', vol: 0.11 });
}

function blSetHint(text){ if (dg.hintEl && dg.hintEl.textContent !== text) dg.hintEl.textContent = text; }

function blStartShow(){
  const g = dg;
  g.phase = 'show'; g.t = 0; g.showI = -1; g.k = 0;
  g.reverse = g.round >= BL_REVERSE_FROM && Math.random() < 0.3 + 0.2 * levelT();
  blSetHint(g.reverse ? `¡Al revés! Mira a ${g.guestName}…` : `Mira a ${g.guestName}…`);
}

function blExpected(){
  const g = dg;
  return g.reverse ? g.seq[g.seq.length - 1 - g.k] : g.seq[g.k];
}

function blPress(mi){
  const g = dg;
  if (!g || g.over || g.phase !== 'input') return;
  blPerform(g.dancers[0], mi, false);
  g.idle = 0;
  if (mi !== blExpected()){ blFail(); return; }
  tone({ freq: SFX_SCALE[BL_MOVES[mi].note], durationMs: 180, type: 'triangle', vol: 0.11 });
  const mult = g.reverse ? 2 : 1;
  g.score += mult;
  g.moves++;
  g.k++;
  if (g.k >= g.seq.length){
    const bonus = g.seq.length * mult;
    g.score += bonus;
    dgPop(`¡Ronda ${g.round}! +${bonus}`, g.w / 2, 34, '#ffe66d');
    g.phase = 'party'; g.t = 0; g.showI = -1;
    blSetHint('¡Así se baila!');
  }
}

function blFail(){
  const g = dg;
  sfxFail();
  g.lives--;
  gaOnce(g.main, 'sad');
  dgPop('¡Ese no era!', g.dancers[0].x, g.h - 82, '#ff8b8b');
  g.phase = 'fail'; g.t = 0;
  blSetHint(g.lives > 0 ? 'Otra vez la misma…' : 'Se acabó el baile');
}

function blStep(dt){
  const g = dg;
  g.t += dt;
  const beat = blBeat();
  if (g.phase === 'intro' && g.t > 1.0) blStartShow();
  else if (g.phase === 'show'){
    const i = Math.floor((g.t - 0.5) / beat);
    if (i > g.showI && i < g.seq.length){ g.showI = i; blPerform(g.dancers[1], g.seq[i]); }
    if (g.t > 0.5 + g.seq.length * beat + 0.25){
      g.phase = 'input'; g.k = 0; g.idle = 0;
      blSetHint(g.reverse ? '¡Tu turno, de atrás para adelante!' : '¡Tu turno!');
    }
  } else if (g.phase === 'input'){
    g.idle += dt;
    if (g.idle > BL_INPUT_TIMEOUT) blFail();
  } else if (g.phase === 'party'){
    /* Los dos bailan la secuencia completa, rapidito, sin sonido. */
    const step = 0.2;
    const i = Math.floor(g.t / step);
    if (i > g.showI && i < g.seq.length){
      g.showI = i;
      blPerform(g.dancers[0], g.seq[i], false);
      blPerform(g.dancers[1], g.seq[i], false);
    }
    if (g.t > g.seq.length * step + 0.6){
      g.round++;
      g.seq.push(Math.floor(Math.random() * 4));
      blStartShow();
    }
  } else if (g.phase === 'fail' && g.t > 1.3){
    if (g.lives <= 0){ g.over = true; return; }
    blStartShow();
  }
}

function blDraw(){
  const g = dg, ctx = g.ctx, w = g.w, h = g.h;
  dgBackdrop(g, '#2a1240', '#140a24', (x, w, h) => {
    const n = 9, tw = w / n;
    for (let i = 0; i < n; i++){
      x.fillStyle = i % 2 ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.13)';
      x.fillRect(i * tw, h - 18, tw, 18);
    }
  });
  const now = performance.now();
  /* El piso se ilumina con el color del último paso. */
  if (g.flash){
    const a = 1 - (now - g.flash.t) / 400;
    if (a > 0){ ctx.globalAlpha = a * 0.45; ctx.fillStyle = g.flash.color; ctx.fillRect(0, h - 18, w, 18); ctx.globalAlpha = 1; }
  }
  /* Focos sobre cada uno. */
  for (const d of g.dancers){
    const gr = ctx.createRadialGradient(d.x, h - 30, 4, d.x, h - 30, 56);
    gr.addColorStop(0, 'rgba(255,240,200,.22)'); gr.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(d.x - 60, h - 90, 120, 90);
  }
  for (const d of g.dancers){
    const e = (now - d.mt0) / BL_MOVE_MS;
    let y = 0, flip = d.flip;
    if (e < 1){
      if (d.move === 'salta') y = 4 * e * (1 - e) * 24;
      if (d.move === 'gira' && e > 0.2 && e < 0.8) flip = !flip;
    }
    if (!d.ga.action) gaLoop(d.ga, g.phase === 'party' ? 'happy' : 'idle');
    drawActorAt(ctx, d.ga, d.x, h - 6 - y, flip);
  }
  /* Lo que está bailando la visita, en un globito. */
  if (g.phase === 'show' && g.showI >= 0 && g.t - (0.5 + g.showI * blBeat()) < blBeat() * 0.85){
    const m = BL_MOVES[g.seq[g.showI]];
    const bx = g.dancers[1].x, by = h - 92;
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.beginPath(); ctx.arc(bx, by, 13, 0, Math.PI * 2); ctx.fill();
    drawEmoji(ctx, m.icon, 18, bx, by);
  }
  /* Avance de la ronda: un punto por paso. */
  const n = g.seq.length, r = 3, gap = 9;
  const x0 = w / 2 - (n - 1) * gap / 2;
  for (let i = 0; i < n; i++){
    const done = g.phase === 'input' ? i < g.k : g.phase === 'show' ? i <= g.showI : g.phase === 'party';
    ctx.fillStyle = done ? '#ffe66d' : 'rgba(255,255,255,.25)';
    ctx.beginPath(); ctx.arc(x0 + i * gap, 30, r, 0, Math.PI * 2); ctx.fill();
  }
  if (g.reverse && (g.phase === 'show' || g.phase === 'input') && Math.floor(now / 300) % 2 === 0){
    ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#ff9bd2';
    ctx.fillText('¡AL REVÉS! x2', w / 2, 48);
  }
  dgDrawFx(ctx, g);
  dgHud(ctx, w, '🎵 ' + g.score, hearts(g.lives), `ronda ${g.round}`);
}

/* Bot bueno (se equivoca en ~1% de los pasos por paso de largo): mediana
   ~54; experto: ~108. */
function blMerit(score){ return score * 0.7; }

function endBaileGame(){
  const g = dg;
  const message = g.moves > 0 ? `${g.score} pts · ronda ${g.round}` : 'Mmm, la próxima será';
  dgFinish({ score: g.score, merit: blMerit(g.score), energyCost: 14, message });
}

/* ===================== De a dos 4: Escondidas =====================
   La visita se mete en una caja, las cajas se revuelven y hay que tocar
   dónde quedó; la mascota va y la abre. Cada ronda hay más cambios y más
   rápidos (y desde la ronda 4, más cajas). Cuando dos cajas se cruzan, una
   pasa por delante (más grande, arco bajo) y la otra por detrás (más chica,
   arco alto): así se puede seguir con la vista cuál es cuál. 3 corazones. */

const HD_LIVES = 3;
const HD_MAX_ROUNDS = 15;

function startEscondidasGame(){
  const g = dgNew('escondidas', { round: 0, lives: HD_LIVES, found: 0, streak: 0, phase: 'next', t: 0.6,
    boxes: [], swaps: [], swapI: 0, pick: null });
  g.ground = g.h - 8;
  g.mx = 22;
  g.pointer = makeCanvasPointer(g.gc);
  g.cleanup.push(() => g.pointer.dispose());
  dgListen(g.gc, 'pointerdown', e => { e.preventDefault(); hdTap(g.pointer.at(e)); });
  showGameControls(`<div class="game-hint" id="hdHint">Fíjate en qué caja se mete</div>`);
  g.hintEl = document.getElementById('hdHint');
  dgRun(hdStep, hdDraw, endEscondidasGame);
}

function hdHint(text){ if (dg.hintEl && dg.hintEl.textContent !== text) dg.hintEl.textContent = text; }

function hdBoxCount(round){ return round <= 3 ? 3 : round <= 7 ? 4 : 5; }

function hdSlotX(i, n){ return dg.w * (i + 1) / (n + 1); }

function hdBoxSize(n){
  const g = dg;
  return { bw: Math.min(54, g.w / (n + 1) * 0.8), bh: Math.min(44, g.h * 0.26) };
}

function hdNewRound(){
  const g = dg;
  g.round++;
  const n = hdBoxCount(g.round);
  g.boxes = [];
  for (let i = 0; i < n; i++) g.boxes.push({ slot: i, x: hdSlotX(i, n), y: 0, s: 1, open: 1, z: 0 });
  g.hidden = pickOne(g.boxes);
  g.mx = 22;
  const L = levelT();
  const swaps = Math.min(14, 3 + g.round + Math.round(2 * L));
  g.swapMs = Math.max(170, 520 - 28 * g.round) * (1 - 0.3 * L);
  g.swaps = [];
  for (let k = 0; k < swaps; k++){
    let i = Math.floor(Math.random() * n), j;
    if (Math.random() < 0.6) j = i + (Math.random() < 0.5 ? -1 : 1);
    else j = Math.floor(Math.random() * n);
    if (j < 0) j = 1; if (j >= n) j = n - 2; if (j === i) j = (i + 1) % n;
    g.swaps.push([i, j]);
  }
  g.swapI = 0;
  g.pick = null;
  g.phase = 'show'; g.t = 0;
  gaLoop(g.guest, 'idle');
  hdHint(`Fíjate en qué caja se mete ${g.guestName}`);
}

/* Dónde está la visita durante la presentación: al lado de su caja, salta
   y se mete. Devuelve {x, suelo, visible}. */
function hdGuestPose(){
  const g = dg, b = g.hidden, { bw, bh } = hdBoxSize(g.boxes.length);
  const top = g.ground - bh;
  const x0 = b.x - bw * 0.95;
  const sink = top + CANVAS_H * 0.7;           // adentro: queda tapada por la caja
  if (g.phase === 'show'){
    if (g.t < 0.7) return { x: x0, suelo: g.ground, flip: false };
    const u = Math.min(1, (g.t - 0.7) / 0.5);
    return { x: lerp(x0, b.x, u), suelo: lerp(g.ground, sink, u) - 4 * u * (1 - u) * 40, flip: false };
  }
  if (g.phase === 'reveal' || g.phase === 'next'){
    const u = Math.min(1, Math.max(0, (g.t - g.revealAt) / 0.45));
    return { x: lerp(b.x, b.x + bw * 0.95, u), suelo: lerp(sink, g.ground, u) - 4 * u * (1 - u) * 44, flip: true };
  }
  return null;
}

function hdTap(pos){
  const g = dg;
  if (!g || g.phase !== 'pick') return;
  const { bw, bh } = hdBoxSize(g.boxes.length);
  let best = null, bd = Infinity;
  for (const b of g.boxes){
    const d = Math.abs(pos.x - b.x);
    if (d < bw * 0.7 && pos.y > g.ground - bh - 40 && d < bd){ best = b; bd = d; }
  }
  if (!best) return;
  g.pick = best;
  g.phase = 'walk'; g.t = 0;
  hdHint('…');
}

function hdStep(dt){
  const g = dg;
  g.t += dt;
  const { bw } = hdBoxSize(g.boxes.length || 3);
  if (g.phase === 'next'){
    if (g.t > (g.round ? 1.5 : 0.6)){
      if (g.lives <= 0 || g.round >= HD_MAX_ROUNDS){ g.over = true; return; }
      hdNewRound();
    }
    return;
  }
  if (g.phase === 'show'){
    if (g.t > 1.25) for (const b of g.boxes) b.open = Math.max(0, 1 - (g.t - 1.25) / 0.25);
    if (g.t > 1.7){ g.phase = 'shuffle'; g.t = 0; hdHint('…'); }
    return;
  }
  if (g.phase === 'shuffle'){
    const dur = g.swapMs / 1000;
    const k = Math.floor(g.t / dur);
    const n = g.boxes.length;
    /* Se aplica el cambio terminado y se anima el que va. */
    while (g.swapI < Math.min(k, g.swaps.length)){
      const [i, j] = g.swaps[g.swapI++];
      const A = g.boxes.find(b => b.slot === i), B = g.boxes.find(b => b.slot === j);
      A.slot = j; B.slot = i;
    }
    for (const b of g.boxes){ b.x = hdSlotX(b.slot, n); b.y = 0; b.s = 1; b.z = 0; }
    if (g.swapI >= g.swaps.length){
      g.phase = 'pick'; g.t = 0;
      hdHint(`¿Dónde está ${g.guestName}? Toca una caja`);
      return;
    }
    const u = (g.t - k * dur) / dur;
    const e = u * u * (3 - 2 * u);
    const [i, j] = g.swaps[g.swapI];
    const A = g.boxes.find(b => b.slot === i), B = g.boxes.find(b => b.slot === j);
    const lift = Math.sin(Math.PI * e);
    A.x = lerp(hdSlotX(i, n), hdSlotX(j, n), e); A.y = -lift * 6; A.s = 1 + 0.1 * lift; A.z = 1;
    B.x = lerp(hdSlotX(j, n), hdSlotX(i, n), e); B.y = -lift * 26; B.s = 1 - 0.1 * lift; B.z = -1;
    return;
  }
  if (g.phase === 'walk'){
    const tx = g.pick.x - bw * 0.8;
    const d = tx - g.mx;
    const s = 240 * dt;
    if (Math.abs(d) <= s){
      g.mx = tx;
      g.phase = 'open'; g.t = 0;
    } else g.mx += Math.sign(d) * s;
    return;
  }
  if (g.phase === 'open'){
    g.pick.open = Math.min(1, g.t / 0.2);
    if (g.t > 0.25){
      const ok = g.pick === g.hidden;
      if (ok){
        g.found++; g.streak++;
        const pts = 5 + g.round + (g.streak >= 3 ? 2 : 0);
        g.score += pts;
        dgPop(`¡Te encontré! +${pts}`, g.pick.x, g.ground - 80, '#ffe66d');
        tone({ freq: 880, durationMs: 120, type: 'triangle', vol: 0.1 });
        tone({ freq: 1318.51, durationMs: 160, type: 'triangle', vol: 0.08, at: (audioNow() || 0) + 0.1 });
        gaOnce(g.guest, 'celebrate'); gaOnce(g.main, 'happy');
        hdHint('¡Bien visto!');
      } else {
        g.streak = 0; g.lives--;
        dgFx('💨', g.pick.x, g.ground - 50, 20);
        sfxFail();
        gaOnce(g.main, 'sad');
        g.hidden.open = 1;
        hdHint(`No… estaba acá`);
      }
      g.phase = 'reveal'; g.t = 0; g.revealAt = ok ? 0 : 0.5;
    }
    return;
  }
  if (g.phase === 'reveal'){
    if (g.pick !== g.hidden && g.t > 0.45 && !g.laughed){ g.laughed = true; gaOnce(g.guest, 'happy'); }
    if (g.t > 1.0){ g.phase = 'next'; g.t = 0; g.laughed = false; }
  }
}

function hdDrawBox(ctx, b, bw, bh, ground){
  const w = bw * b.s, h = bh * b.s;
  const x = Math.round(b.x - w / 2), y = Math.round(ground - h + b.y);
  ctx.fillStyle = 'rgba(0,0,0,.22)';
  ctx.beginPath(); ctx.ellipse(b.x, ground - 1, w * 0.52, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c98b4b'; ctx.fillRect(x, y, Math.round(w), Math.round(h));
  ctx.fillStyle = '#b07538'; ctx.fillRect(x, y, Math.round(w), 4);
  ctx.fillStyle = '#e6b77a'; ctx.fillRect(x + Math.round(w / 2) - 3, y, 6, Math.round(h));
  ctx.strokeStyle = '#7a4a1e'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, Math.round(w) - 2, Math.round(h) - 2);
  /* Solapas: abiertas hacia los lados. */
  if (b.open > 0){
    const fh = Math.round(h * 0.45 * b.open);
    ctx.fillStyle = '#d9a061';
    ctx.fillRect(x - 2, y - fh, Math.round(w * 0.42), fh);
    ctx.fillRect(x + Math.round(w * 0.6) + 2, y - fh, Math.round(w * 0.42), fh);
  }
}

function hdDraw(){
  const g = dg, ctx = g.ctx, w = g.w, h = g.h;
  dgBackdrop(g, '#ffd9a8', '#f6b97e', (x, w, h) => {
    x.fillStyle = 'rgba(255,255,255,.18)';
    for (let i = 0; i < w; i += 24) x.fillRect(i, 0, 12, h - 8);
    x.fillStyle = '#a8673a'; x.fillRect(0, h - 8, w, 8);
  });
  if (!g.boxes.length){ dgHud(ctx, w, '📦 0', hearts(g.lives), ''); return; }
  const { bw, bh } = hdBoxSize(g.boxes.length);
  const pose = hdGuestPose();
  const order = [...g.boxes].sort((a, b) => a.z - b.z);
  /* La visita va detrás de la caja: se recorta al piso para que no asome por abajo. */
  const drawGuest = () => {
    if (!pose) return;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, w, g.ground); ctx.clip();
    if (!g.guest.action) gaLoop(g.guest, g.phase === 'show' && g.t < 0.7 ? 'happy' : 'idle');
    drawActorAt(ctx, g.guest, pose.x, pose.suelo, pose.flip);
    ctx.restore();
  };
  drawGuest();
  for (const b of order) hdDrawBox(ctx, b, bw, bh, g.ground);
  if (g.phase === 'pick' && Math.floor(performance.now() / 400) % 2 === 0){
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
    for (const b of g.boxes) ctx.fillText('?', b.x, g.ground - bh - 6);
  }
  if (!g.main.action) gaLoop(g.main, g.phase === 'walk' ? 'walk' : 'idle');
  drawActorAt(ctx, g.main, g.mx, g.ground, false);
  dgDrawFx(ctx, g);
  dgHud(ctx, w, '📦 ' + g.score, hearts(g.lives), `ronda ${g.round}`, 'rgba(0,0,0,.6)');
}

/* Bot bueno (pierde la caja con más probabilidad mientras más rápido el
   cambio): mediana ~88; experto: ~176 (llega a las 15 rondas). */
function hdMerit(score){ return score * 0.45; }

function endEscondidasGame(){
  const g = dg;
  const message = g.found > 0 ? `${g.score} pts · ${g.found} encontradas` : 'Mmm, la próxima será';
  dgFinish({ score: g.score, merit: hdMerit(g.score), energyCost: 10, message });
}

/* ===================== De a dos 5: Sube y baja =====================
   Un balancín: cada vez que uno cae en su punta, lanza al otro por los
   aires. Arriba de cada punta flotan globos a distintas alturas (y alguna
   estrella, y alguna bomba): el que vuela revienta todo lo que alcanza en su
   columna. Con ▲/▼ se elige a qué altura sale el PRÓXIMO lanzamiento (hay
   SB_LEVELS alturas), y como se turnan, cada decisión es para el otro lado.
   Subir de más mete en una bomba; quedarse bajo deja globos. 35 segundos,
   3 corazones. */

const SB_DURATION = 35;
const SB_LEVELS = 4;
const SB_LIVES = 3;
const SB_T1 = 0.62;            // segundos de vuelo a la altura 1 (crece con la raíz de la altura)
const SB_ITEM_LIFE = 5.5;
const SB_CHAR = { balloon: '🎈', star: '⭐', bomb: '💣' };
const SB_POINTS = { balloon: 2, star: 5, bomb: -3 };

function startSubebajaGame(){
  const g = dgNew('subebaja', { time: SB_DURATION, lives: SB_LIVES, level: 2, items: [], spawnIn: 0.6,
    combo: 0, popped: 0, tilt: 1, tiltTo: 1, flyer: 1, ft: 0, fT: 0, flyLevel: 2, hitThisFlight: 0 });
  g.ground = g.h - 6;
  g.pivotY = g.ground - 12;
  g.pl = Math.min(g.w * 0.26, 84);
  g.colX = [g.w / 2 - g.pl + 12, g.w / 2 + g.pl - 12];
  g.base = g.pivotY - 10 - 58;                        // cabeza de pie en la punta alta
  g.step = Math.max(14, (g.base - 26) / SB_LEVELS);
  g.chars = [{ ga: g.main }, { ga: g.guest }];
  const cont = showGameControls(`
    <div class="game-hint" id="sbHint">Elige a qué altura sale el próximo salto</div>
    <div class="gbtn-row2">
      <button class="gbtn gbtn-lg" id="sbDown">▼ Más bajo</button>
      <button class="gbtn gbtn-lg" id="sbUp">▲ Más alto</button>
    </div>`);
  dgButton(cont.querySelector('#sbDown'), () => sbAdjust(-1));
  dgButton(cont.querySelector('#sbUp'), () => sbAdjust(1));
  dgKeys({ ArrowDown: () => sbAdjust(-1), s: () => sbAdjust(-1), ArrowUp: () => sbAdjust(1), w: () => sbAdjust(1) });
  sbLaunch(1);
  say('¡Revienten los globos!');
  dgRun(sbStep, sbDraw, endSubebajaGame);
}

function sbAdjust(d){
  const g = dg;
  if (!g || g.over) return;
  g.level = Math.min(SB_LEVELS, Math.max(1, g.level + d));
  tone({ freq: SFX_SCALE[[1, 3, 5, 8][g.level - 1]], durationMs: 70, type: 'square', vol: 0.06 });
}

function sbEndY(side){ return dg.pivotY + (side === 0 ? dg.tilt : -dg.tilt) * 9; }
function sbItemY(lev){ return dg.base - lev * dg.step + dg.step * 0.45; }

/* `side` sale volando a la altura elegida. */
function sbLaunch(side){
  const g = dg;
  const progress = 1 - Math.max(0, g.time) / SB_DURATION;
  g.flyer = side;
  g.flyLevel = g.level;
  g.ft = 0;
  g.fT = SB_T1 * Math.sqrt(g.flyLevel) * (1 - 0.18 * progress - 0.12 * levelT());
  g.hitThisFlight = 0;
  g.tiltTo = side === 0 ? -1 : 1;     // la punta del que sale queda arriba
  gaOnce(g.chars[side].ga, 'happy');
}

function sbSpawn(){
  const g = dg;
  const side = Math.random() < 0.5 ? 0 : 1;
  const L = levelT();
  const r = Math.random();
  const bomb = 0.18 + 0.12 * L;
  let kind = r < bomb ? 'bomb' : r < bomb + 0.12 ? 'star' : 'balloon';
  let lev = 1 + Math.floor(Math.random() * SB_LEVELS);
  if (kind === 'bomb' && lev === 1) lev = 2 + Math.floor(Math.random() * (SB_LEVELS - 1));   // la altura 1 siempre es segura
  if (kind === 'star' && lev < 3) lev = 3 + Math.floor(Math.random() * (SB_LEVELS - 2));
  if (g.items.some(o => o.side === side && o.lev === lev)) return;
  g.items.push({ side, lev, kind, age: 0, wob: Math.random() * 6 });
}

function sbStep(dt){
  const g = dg;
  g.time -= dt;
  g.tilt += (g.tiltTo - g.tilt) * Math.min(1, dt * 18);
  g.spawnIn -= dt;
  if (g.spawnIn <= 0){
    const progress = 1 - Math.max(0, g.time) / SB_DURATION;
    g.spawnIn = (1.1 - 0.4 * progress) * (1 - 0.2 * levelT());
    if (g.items.length < 7) sbSpawn();
  }
  for (let i = g.items.length - 1; i >= 0; i--){
    const it = g.items[i];
    it.age += dt;
    if (it.age > SB_ITEM_LIFE) g.items.splice(i, 1);
  }
  g.ft += dt;
  const u = Math.min(1, g.ft / g.fT);
  const H = g.flyLevel * g.step;
  const headY = g.base - H * 4 * u * (1 - u) * (u < 0.5 ? 1 : 1);
  /* Revienta lo que alcanza la cabeza, subiendo. */
  if (u <= 0.5){
    for (let i = g.items.length - 1; i >= 0; i--){
      const it = g.items[i];
      if (it.side !== g.flyer || headY > sbItemY(it.lev)) continue;
      g.items.splice(i, 1);
      const x = g.colX[it.side];
      if (it.kind === 'bomb'){
        g.lives--; g.combo = 0;
        g.score += SB_POINTS.bomb;
        dgFx('💥', x, sbItemY(it.lev), 22);
        dgPop('¡Pum!', x, sbItemY(it.lev) - 14, '#ff8b8b');
        sfxFail();
        gaOnce(g.chars[g.flyer].ga, 'sad');
      } else {
        g.hitThisFlight++;
        g.popped++;
        const mult = Math.min(3, 1 + Math.floor(g.combo / 4));
        const pts = SB_POINTS[it.kind] * mult;
        g.score += pts;
        dgFx(it.kind === 'star' ? '✨' : '💥', x, sbItemY(it.lev), 16);
        dgPop('+' + pts, x + 14, sbItemY(it.lev), it.kind === 'star' ? '#ffe66d' : '#fff');
        tone({ freq: SFX_SCALE[[1, 3, 5, 8][it.lev - 1]], durationMs: 110, type: 'triangle', vol: 0.1 });
      }
    }
  }
  if (u >= 1){
    /* Cae en su punta y lanza al otro. */
    if (g.hitThisFlight > 0) g.combo++;
    if (g.time <= 0 || g.lives <= 0){ g.over = true; return; }
    sbLaunch(1 - g.flyer);
  }
}

function sbDraw(){
  const g = dg, ctx = g.ctx, w = g.w, h = g.h;
  dgBackdrop(g, '#8fd3ff', '#e8f7ff', (x, w, h) => {
    x.fillStyle = '#7bd36b'; x.fillRect(0, h - 6, w, 6);
    x.fillStyle = 'rgba(255,255,255,.7)';
    x.beginPath(); x.ellipse(w * 0.5, h * 0.18, 24, 8, 0, 0, Math.PI * 2); x.fill();
  });
  /* Guías de altura en cada columna y la marca del próximo salto. */
  const next = 1 - g.flyer;
  for (let side = 0; side < 2; side++){
    for (let lev = 1; lev <= SB_LEVELS; lev++){
      const y = Math.round(sbItemY(lev));
      const sel = side === next && lev === g.level;
      ctx.fillStyle = sel ? 'rgba(255,90,150,.9)' : 'rgba(255,255,255,.55)';
      const x = g.colX[side];
      for (let k = -16; k < 16; k += 6) ctx.fillRect(Math.round(x + k), y, sel ? 4 : 2, sel ? 2 : 1);
      if (sel){ ctx.font = 'bold 10px monospace'; ctx.textAlign = side ? 'left' : 'right'; ctx.fillText('▶◀'[side], x + (side ? 20 : -20), y + 4); }
    }
  }
  for (const it of g.items){
    const fade = Math.min(1, (SB_ITEM_LIFE - it.age) / 0.8);
    ctx.globalAlpha = Math.max(0, fade);
    const bob = Math.sin((it.age + it.wob) * 3) * 2;
    drawEmoji(ctx, SB_CHAR[it.kind], 18, g.colX[it.side] + Math.sin(it.age * 1.7 + it.wob) * 3, sbItemY(it.lev) + bob);
  }
  ctx.globalAlpha = 1;
  /* Balancín */
  const lx = w / 2 - g.pl, rx = w / 2 + g.pl;
  ctx.fillStyle = '#6b4a8a';
  ctx.beginPath(); ctx.moveTo(w / 2 - 9, g.ground); ctx.lineTo(w / 2 + 9, g.ground); ctx.lineTo(w / 2, g.pivotY); ctx.fill();
  ctx.strokeStyle = '#ff7ab8'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(lx, sbEndY(0)); ctx.lineTo(rx, sbEndY(1)); ctx.stroke();
  ctx.lineCap = 'butt';
  /* Personajes: el que espera, sentado en su punta; el otro, volando. */
  const u = Math.min(1, g.ft / g.fT);
  for (let side = 0; side < 2; side++){
    const c = g.chars[side];
    const endY = sbEndY(side) - 2;
    let feet = endY;
    if (side === g.flyer) feet = endY - g.flyLevel * g.step * 4 * u * (1 - u);
    if (!c.ga.action) gaLoop(c.ga, side === g.flyer ? (u < 0.5 ? 'happy' : 'idle') : 'idle');
    drawActorAt(ctx, c.ga, g.colX[side], feet, side === 1);
  }
  dgDrawFx(ctx, g);
  const mult = Math.min(3, 1 + Math.floor(g.combo / 4));
  dgHud(ctx, w, '🎈 ' + g.score, Math.max(0, g.time).toFixed(0) + 's  ' + hearts(g.lives),
    mult > 1 ? `racha x${mult}` : `altura ${g.level}`, mult > 1 ? '#ff5d8f' : 'rgba(0,0,0,.55)');
}

/* Bot bueno (reacciona en 0.3 s y a veces erra por una altura): mediana
   ~100; experto: ~140. */
function sbMerit(score){ return score * 0.4; }

function endSubebajaGame(){
  const g = dg;
  const message = g.popped > 0 ? `${g.score} pts · ${g.popped} globos` : 'Mmm, la próxima será';
  dgFinish({ score: g.score, merit: sbMerit(g.score), energyCost: 16, message });
}

/* ===================== De a dos 6: Carrera en dupla =====================
   Corren en fila: la mascota adelante y la visita atrás, cada una con su
   botón de salto. Todo lo que viene les llega primero a la de adelante y un
   ratito después a la de atrás, así que hay que saltar "en eco"; cuando dos
   obstáculos vienen a la distancia justa, hay que saltar con los dos a la
   vez. Los pájaros se esquivan NO saltando, y las estrellas se agarran
   saltando. Acelera de a poco. 40 segundos, 3 corazones compartidos.

   El salto mide una distancia fija (DP_JUMP_DIST) y no un tiempo fijo: así
   toda la geometría (qué cabe en un salto, qué necesita dos) es la misma a
   cualquier velocidad y solo se achica el margen de tiempo. Con un salto de
   duración fija, a la velocidad del nivel 5 dos obstáculos seguidos quedaban
   demasiado juntos para dos saltos y demasiado separados para uno: no había
   forma de pasarlos. Las cuentas: un obstáculo bajo "toca" 30 px de piso
   (±15 alrededor de cada corredor) y el salto va por encima de su alto (16)
   en el 81% central de DP_JUMP_DIST (68 px): sobran ±19 px de margen. Para
   que dos bajos seguidos del mismo corredor tengan cada uno su margen entero
   tienen que estar a ≥ 124 px: por eso los corredores van a 0.48 del ancho
   (≥ 124 px en el teléfono más chico) y los patrones se arman con esa
   distancia. */

const DP_DURATION = 40;
const DP_LIVES = 3;
const DP_JUMP_DIST = 84;       // px de piso que recorre un salto
const DP_JUMP_H = 46;
const DP_BODY_HALF = 7;       // medio ancho del cuerpo para chocar

function startDuplaGame(){
  const g = dgNew('dupla', { time: DP_DURATION, lives: DP_LIVES, obs: [], dist: 0, nextAt: 140,
    combo: 0, cleared: 0, scroll: 0 });
  g.ground = g.h - 10;
  g.chars = [
    { ga: g.guest, x: Math.round(g.w * 0.22), jt: -1, inv: 0 },   // atrás
    { ga: g.main, x: Math.round(g.w * 0.70), jt: -1, inv: 0 },    // adelante
  ];
  const cont = showGameControls(`
    <div class="game-hint">Salta con cada uno cuando le toque · los pájaros, no</div>
    <div class="gbtn-row2">
      <button class="gbtn gbtn-lg" id="dpBack">⤴ ${escapeHtml(shortName(g.guestName))}</button>
      <button class="gbtn gbtn-lg" id="dpFront">⤴ ${escapeHtml(shortName(g.mainName))}</button>
    </div>`);
  dgButton(cont.querySelector('#dpBack'), () => dpJump(0));
  dgButton(cont.querySelector('#dpFront'), () => dpJump(1));
  dgKeys({ ArrowLeft: () => dpJump(0), a: () => dpJump(0), ArrowRight: () => dpJump(1), l: () => dpJump(1), ' ': () => dpJump(1) });
  say('¡A correr!');
  dgRun(dpStep, dpDraw, endDuplaGame);
}

function dpSpeed(){
  const progress = 1 - Math.max(0, dg.time) / DP_DURATION;
  return (120 + 90 * progress) * (1 + 0.35 * levelT());
}

function dpJump(i){
  const g = dg;
  if (!g || g.over) return;
  const c = g.chars[i];
  if (c.jt >= 0) return;
  c.jt = 0;
  c.js = dpJumpS();
  gaOnce(c.ga, 'happy');
  tone({ freq: i ? 740 : 587, durationMs: 60, type: 'square', vol: 0.05 });
}

function dpJumpS(){ return DP_JUMP_DIST / dpSpeed(); }

function dpJumpY(c){
  if (c.jt < 0) return 0;
  const u = Math.min(1, c.jt / c.js);
  return 4 * u * (1 - u) * DP_JUMP_H;
}

/* Patrones: siempre en distancias de pantalla, así se leen igual a
   cualquier velocidad. `gap` = la distancia entre los dos corredores: dos
   obstáculos a esa distancia les llegan a la vez. */
function dpSpawnPattern(){
  const g = dg;
  const gap = g.chars[1].x - g.chars[0].x;
  const x = g.w + 20;
  const L = levelT();
  const progress = 1 - Math.max(0, g.time) / DP_DURATION;
  const r = Math.random();
  let len = 0;
  const add = (dx, kind) => { g.obs.push({ x: x + dx, kind, done: [false, false], hit: [false, false] }); len = Math.max(len, dx); };
  const low = () => pickOne(['🌵', '🧱', '🍄']);
  if (r < 0.32) add(0, low());
  else if (r < 0.50) { add(0, low()); add(gap, low()); }                 // saltan los dos a la vez
  else if (r < 0.62) add(0, 'bird');
  else if (r < 0.74) { add(0, low()); add(DP_JUMP_DIST + 30, 'star'); }
  else if (r < 0.86) { add(0, 'bird'); add(Math.max(48, gap * 0.55), low()); }   // pasa el pájaro y salta
  else { add(0, low()); add(gap, low()); add(gap * 2, low()); }          // eco largo
  const spd = dpSpeed();
  g.nextAt = g.dist + len + DP_JUMP_DIST + 50 + (0.9 - 0.3 * progress - 0.15 * L) * spd + Math.random() * 60;
}

function dpObsBox(o){
  if (o.kind === 'bird') return { half: 9, low: 70, high: 84 };     // alto sobre el piso
  if (o.kind === 'star') return { half: 9, low: 58, high: 72 };
  return { half: 8, low: 0, high: 16 };
}

function dpStep(dt){
  const g = dg;
  g.time -= dt;
  const v = dpSpeed();
  g.dist += v * dt;
  g.scroll += v * dt;
  if (g.dist >= g.nextAt && g.time > 1.2) dpSpawnPattern();
  for (const c of g.chars){
    if (c.jt >= 0){ c.jt += dt; if (c.jt >= c.js) c.jt = -1; }
    c.inv = Math.max(0, c.inv - dt);
  }
  for (let i = g.obs.length - 1; i >= 0; i--){
    const o = g.obs[i];
    o.x -= v * dt;
    const box = dpObsBox(o);
    g.chars.forEach((c, ci) => {
      if (o.done[ci]) return;
      const jy = dpJumpY(c);
      /* El cuerpo: de los pies (jy) a ~52 px más arriba. */
      const overlap = Math.abs(o.x - c.x) < box.half + DP_BODY_HALF;
      if (overlap){
        const touches = jy < box.high && jy + 52 > box.low;
        if (o.kind === 'star'){
          if (touches){ o.done[ci] = true; o.got = true; g.score += 3; dgFx('⭐', c.x, g.ground - 70, 16); dgPop('+3', c.x, g.ground - 84, '#ffe66d');
            tone({ freq: 1174.66, durationMs: 90, type: 'triangle', vol: 0.08 }); }
        } else if (touches && c.inv <= 0){
          o.done[ci] = true; o.hit[ci] = true;
          g.lives--; g.combo = 0; c.inv = 1.0;
          dgFx('💥', c.x + 8, g.ground - 30, 18);
          dgPop('¡Ay!', c.x, g.ground - 76, '#ff8b8b');
          sfxFail();
          gaOnce(c.ga, 'sad');
        }
      } else if (o.x < c.x - box.half - DP_BODY_HALF){
        o.done[ci] = true;
        if (o.kind !== 'star' && !o.hit[ci]){
          g.combo++; g.cleared++;
          g.score += Math.min(3, 1 + Math.floor(g.combo / 8));
        }
      }
    });
    if (o.x < -30) g.obs.splice(i, 1);
  }
  if (g.lives <= 0 || (g.time <= 0 && !g.obs.length)) g.over = true;
  if (g.time <= -3) g.over = true;
}

function dpDraw(){
  const g = dg, ctx = g.ctx, w = g.w, h = g.h;
  dgBackdrop(g, '#ffb38a', '#ffe3b8');
  /* Cerros lejanos (lento) y piso con rayas (rápido): paralaje. */
  ctx.fillStyle = 'rgba(160,90,160,.35)';
  ctx.beginPath(); ctx.moveTo(0, g.ground);
  for (let x = 0; x <= w; x += 8) ctx.lineTo(x, g.ground - 26 - Math.sin((x + g.scroll * 0.2) / 38) * 12 - Math.sin((x + g.scroll * 0.2) / 17) * 4);
  ctx.lineTo(w, g.ground); ctx.fill();
  ctx.fillStyle = '#8c5a3c'; ctx.fillRect(0, g.ground, w, h - g.ground);
  ctx.fillStyle = '#b07a52';
  for (let x = -(g.scroll % 22); x < w; x += 22) ctx.fillRect(Math.round(x), g.ground + 4, 10, 2);
  for (const o of g.obs){
    const box = dpObsBox(o);
    if (o.kind === 'star' && o.got) continue;
    const y = g.ground - (box.low + box.high) / 2;
    drawEmoji(ctx, o.kind === 'bird' ? '🐦' : o.kind === 'star' ? '⭐' : o.kind, o.kind === 'bird' ? 18 : 20,
      o.x, o.kind === 'bird' ? y + Math.sin(performance.now() / 120 + o.x) * 2 : y);
  }
  for (const c of g.chars){
    if (!c.ga.action) gaLoop(c.ga, c.jt >= 0 ? 'happy' : 'walk');
    const blink = c.inv > 0 && Math.floor(c.inv * 10) % 2 === 0;
    drawActorAt(ctx, c.ga, c.x, g.ground - dpJumpY(c), false, blink ? 0.35 : 1);
  }
  dgDrawFx(ctx, g);
  const mult = Math.min(3, 1 + Math.floor(g.combo / 8));
  dgHud(ctx, w, '🏃 ' + g.score, Math.max(0, g.time).toFixed(0) + 's  ' + hearts(g.lives),
    g.combo >= 3 ? `seguidos ${g.combo}  x${mult}` : '', mult > 1 ? '#7a2b8a' : 'rgba(0,0,0,.55)');
}

/* Bot bueno (±50 ms, un poco tarde): mediana ~122 en nivel 1 y ~63 en el
   5; experto (±20 ms): ~158 y ~212, sin perder ningún corazón. */
function dpMerit(score){ return score * 0.35; }

function endDuplaGame(){
  const g = dg;
  const message = g.score > 0 ? `${g.score} pts · ${g.cleared} saltos` : 'Mmm, la próxima será';
  dgFinish({ score: g.score, merit: dpMerit(g.score), energyCost: 20, hygieneCost: 4, message });
}
