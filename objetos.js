/* ===================== Objetos mágicos =====================
   Veintidós objetos que se ponen como cualquier mueble (FURNI_ART, con sus
   partes, guiones `visits`/`duos` y el mismo motor de muebles.js), pero que
   hacen cosas que un mueble no hacía:
   - se manejan directo: el láser y el jetpack convierten los toques en el
     piso en órdenes (floorMode); las burbujas se revientan tocándolas;
   - tienen vida propia (`tick`): el robot pasea y limpia, la nube flota y
     llueve, el árbol da fruta, el frijol crece día a día;
   - llenan la pieza de efectos: partículas pixel en dos capas (detrás y
     delante de los personajes), luz ambiente (planetario, lámpara de lava),
     un destello (fotos, truenos), el doble del espejo;
   - algunos tienen un efecto de verdad, chico: fruta gratis, el robot limpia
     una caca al día, el frijol paga al llegar al cielo, la caja musical
     duerme a la mascota de noche, la bola de cristal dice qué va a pasar.
   Se carga después de muebles.js (usa FURNI_ART, el motor de actores y los
   ganchos `tick`, `tap`, `cleanup`, `keep` y `thumb` que muebles.js lee) y
   antes de duo.js. Lo que guardan va en state.objData[id] (objData()).

   Todo el arte es pixel art dibujado con pxPainter, a la escala de los
   muebles; las partículas también son pixeles de ese mismo tamaño
   (furniDeviceScale() píxeles físicos), así nada se ve de otro "grano". */

const MAGIC_ITEMS = [
  { id:'laser',      name:'Puntero láser',    use:'lo guías tocando el piso', price:  45 },
  { id:'jetpack',    name:'Jetpack',          use:'vuela: tú lo diriges',     price: 110 },
  { id:'burbujas',   name:'Máquina de burbujas', use:'revienta burbujas',     price:  55 },
  { id:'camara',     name:'Cámara instantánea', use:'álbum de fotos',         price:  70 },
  { id:'cristal',    name:'Bola de cristal',  use:'predice el futuro',        price:  65 },
  { id:'robot',      name:'Robot aspiradora', use:'limpia y lo pasea',        price: 120 },
  { id:'nube',       name:'Nubecita',         use:'llueve y truena',          price:  80 },
  { id:'arbol',      name:'Árbol frutal',     use:'da fruta gratis',          price:  90 },
  { id:'frijol',     name:'Frijol mágico',    use:'crece hasta el cielo',     price: 100 },
  { id:'fuegos',     name:'Fuegos artificiales', use:'un show de luces',      price:  75 },
  { id:'prisma',     name:'Prisma',           use:'se tira por el arcoíris',  price:  85 },
  { id:'planetario', name:'Planetario',       use:'llena la pieza de estrellas', price: 95 },
  { id:'nieve',      name:'Máquina de nieve', use:'nieva y hace monos',       price:  85 },
  { id:'lava',       name:'Lámpara de lava',  use:'luz según su ánimo',       price:  60 },
  { id:'portal',     name:'Portal',           use:'aparece en otro lado',     price: 130 },
  { id:'musica',     name:'Caja musical',     use:'toca una melodía',         price:  70 },
  { id:'canon',      name:'Cañón de circo',   use:'sale disparado',           price: 100 },
  { id:'gelatina',   name:'Gelatina gigante', use:'rebota y se hunde',        price:  75 },
  { id:'patineta',   name:'Patineta',         use:'hace trucos',              price:  60 },
  { id:'espejo',     name:'Espejo mágico',    use:'su reflejo cobra vida',    price: 120 },
  { id:'pala',       name:'Pala y balde',     use:'recoge y guarda la caca',  price:  40 },
  { id:'compost',    name:'Compostera',       use:'caca → fertilizante',      price:  70 },
];
STYLE_ITEMS.push(...MAGIC_ITEMS.map(it => ({ ...it, kind: 'furni', wow: true })));

/* Lo que guarda cada objeto (fruta del árbol, fotos, el frijol...). */
function objData(id){
  if (!state.objData || typeof state.objData !== 'object') state.objData = {};
  if (!state.objData[id] || typeof state.objData[id] !== 'object') state.objData[id] = {};
  return state.objData[id];
}

/* Colores extra de los objetos (el resto, FP de muebles.js). */
const MP = {
  neon: '#ff3b5c', neonL: '#ff9fb0', mint: '#5fffc0', mintD: '#2fbf8a', sky: '#7fd6ff',
  gold: '#ffc83d', goldL: '#ffe58a', goldD: '#c98a12', violet: '#a46bff', violetL: '#d2b6ff',
  violetD: '#6a3fd0', lime: '#a8f060', limeD: '#6fbf2a', leaf: '#4fc463', leafL: '#86e07f',
  leafD: '#2e8f45', bark: '#8a5a33', barkL: '#b07a49', snow: '#f4fbff', ice: '#bfe9ff',
  jelly: '#ff5fa2', jellyL: '#ff9cc8', jellyD: '#d63c80', lava: '#ff7a3d', glass2: '#d6f1ff',
};
const RAINBOW = ['#ff4d6d', '#ff9a3d', '#ffd84d', '#5fdc7a', '#4db8ff', '#9b6bff'];

/* ---------- partículas ----------
   Cada partícula vive en px CSS del piso: x desde el borde izquierdo, y hacia
   ARRIBA desde el suelo (como walker.y). Se dibujan como figuritas de pixel
   art (PX_SHAPES) en un canvas en píxeles físicos, cada pixel de la figura
   del mismo tamaño que un pixel de los muebles. */
const PX_SHAPES = {
  sq:    ['x'],
  big:   ['xx', 'xx'],
  plus:  ['.x.', 'xxx', '.x.'],
  spark: ['x.x', '.x.', 'x.x'],
  star:  ['..x..', '..x..', 'xxxxx', '..x..', '..x..'],
  heart: ['xx.xx', 'xxxxx', '.xxx.', '..x..'],
  note:  ['..xx', '..x.', '..x.', 'xxx.', 'xx..'],
  flake: ['x.x.x', '.xxx.', 'xxxxx', '.xxx.', 'x.x.x'],
  drop:  ['x', 'x'],
  leaf:  ['.xx', 'xxx', 'xx.'],
  dust:  ['.x', 'xx'],
};

const MAGIC = {
  parts: [],          // partículas vivas
  effects: [],        // dibujos que duran (arcoíris, estrellas, nieve en el piso, el punto del láser)
  ambient: {},        // luces de la pieza por fuente: { id: { bg, a } }
  floorMode: null,    // { id, onTap(x, y), until } mientras el láser o el jetpack se manejan con toques
  swallowClickUntil: 0,
  lastDrawn: { back: false, front: false },
};

function fxSpawn(o){
  const now = performance.now();
  const p = Object.assign({
    x: 0, y: 0, vx: 0, vy: 0, ax: 0, ay: 0, drag: 0, life: 1000, size: 1,
    color: '#fff', shape: 'sq', layer: 'front', fade: true, wob: 0, wobF: 3,
    floor: null, born: now, a: 1,
  }, o);
  p.phase = Math.random() * 6.28;
  MAGIC.parts.push(p);
  if (MAGIC.parts.length > 700) MAGIC.parts.splice(0, MAGIC.parts.length - 700);
  return p;
}

/* Un estallido de partículas desde un punto (px CSS del piso). */
function fxBurst(x, y, n, o = {}){
  for (let i = 0; i < n; i++){
    const ang = (o.ang0 ?? 0) + (o.spread ?? Math.PI * 2) * (i + Math.random() * 0.6) / n;
    const sp = (o.speed ?? 60) * (0.55 + Math.random() * 0.6);
    fxSpawn({
      x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, ay: o.ay ?? -60, drag: o.drag ?? 1.2,
      life: (o.life ?? 900) * (0.7 + Math.random() * 0.5), size: o.size ?? 1,
      color: Array.isArray(o.colors) ? pickOne(o.colors) : (o.color || '#fff'),
      shape: Array.isArray(o.shapes) ? pickOne(o.shapes) : (o.shape || 'sq'),
      layer: o.layer || 'front', floor: o.floor ?? null,
    });
  }
}

/* Un efecto que dura: `draw(ctx, I, now)` cada cuadro hasta `until` (o hasta
   que `done(now)` diga que sí). `layer`: 'back' (detrás de los personajes)
   o 'front'. Con `id`, uno nuevo reemplaza al anterior del mismo id. */
function fxEffect(e){
  if (e.id) MAGIC.effects = MAGIC.effects.filter(o => o.id !== e.id);
  e.layer = e.layer || 'back';
  e.t0 = performance.now();
  MAGIC.effects.push(e);
  return e;
}
function fxEffectOff(id){ MAGIC.effects = MAGIC.effects.filter(o => o.id !== id); }
function fxEffectOn(id){ return MAGIC.effects.some(o => o.id === id); }

/* Luz de la pieza: cada fuente pone su fondo CSS (oscuridad del planetario,
   resplandor de la lámpara, cielo de lluvia); van todas juntas en
   #ambientLayer, que tiñe la pieza y los muebles pero no a los personajes. */
function setAmbient(id, bg, rt = null){
  if (bg) MAGIC.ambient[id] = { bg, rt }; else delete MAGIC.ambient[id];
}

/* Destello de toda la pieza (foto, trueno, cañonazo). */
function magicFlash(color = '#fff', ms = 380, peak = 0.85){
  const el = document.getElementById('magicFlash');
  if (!el) return;
  el.style.setProperty('--flash', color);
  el.style.setProperty('--flash-a', peak);
  el.style.animation = 'none'; void el.offsetWidth;
  el.style.animation = `magicFlash ${ms}ms ease-out`;
}

/* Sonido: solo cuando lo pide quien juega (tocar el objeto), nunca en una
   visita espontánea. Usa tone() de juegos.js (Web Audio, sin archivos). */
function magicTone(freq, ms, type = 'triangle', vol = 0.12, at = 0){
  if (typeof tone !== 'function') return;
  tone({ freq, durationMs: ms, type, vol, at, attackMs: 8 });
}
function audioNow(){
  try { const c = typeof getAudioCtx === 'function' ? getAudioCtx() : null; return c ? c.currentTime : 0; }
  catch (e) { return 0; }
}

/* ---------- dibujo ---------- */

function fitFxCanvas(c){
  const floor = document.getElementById('creatureFloor');
  const w = Math.round(floor.clientWidth * DPR), h = Math.round(floor.clientHeight * DPR);
  if (c.width !== w) c.width = w;
  if (c.height !== h) c.height = h;
  return { w, h };
}

/* Medidas para dibujar: u = píxeles físicos por pixel del arte; X/Y pasan
   de px CSS del piso (y hacia arriba) a píxeles del canvas, ya calzados a la
   grilla del arte para que nada quede corrido medio pixel. */
function fxInfo(c){
  const u = furniDeviceScale();
  const H = c.height, base = H - 4 * DPR;
  return {
    u, W: c.width, H, fw: c.width / DPR, fh: c.height / DPR,
    X: x => Math.round(x * DPR),
    Y: y => Math.round(base - y * DPR),
  };
}

function drawShape(ctx, I, shape, x, y, size, color){
  const map = PX_SHAPES[shape] || PX_SHAPES.sq;
  const s = I.u * size;
  const w = map[0].length, h = map.length;
  const x0 = I.X(x) - Math.floor(w * s / 2), y0 = I.Y(y) - Math.floor(h * s / 2);
  ctx.fillStyle = color;
  for (let j = 0; j < h; j++){
    const row = map[j];
    for (let i = 0; i < w; i++) if (row[i] === 'x') ctx.fillRect(x0 + i * s, y0 + j * s, s, s);
  }
}

/* Aro de pixeles (burbujas, portales): radio en pixeles del arte. */
function drawRing(ctx, I, x, y, rad, color, hi){
  const u = I.u, cx = I.X(x), cy = I.Y(y);
  const r = Math.max(1, Math.round(rad));
  for (let j = -r; j <= r; j++){
    for (let i = -r; i <= r; i++){
      const d = Math.hypot(i, j);
      if (d <= r + 0.3 && d > r - 0.75){
        ctx.fillStyle = color;
        ctx.fillRect(cx + i * u - u / 2, cy + j * u - u / 2, u, u);
      }
    }
  }
  if (hi && r >= 2){
    ctx.fillStyle = hi;
    ctx.fillRect(cx - Math.round(r * 0.45) * u - u / 2, cy - Math.round(r * 0.45) * u - u / 2, u, u);
  }
}

/* Línea de pixeles del arte entre dos puntos (px CSS del piso). */
function drawPxLine(ctx, I, x0, y0, x1, y1, color, size = 1){
  const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / (I.u / DPR)));
  ctx.fillStyle = color;
  const s = I.u * size;
  for (let i = 0; i <= n; i++){
    const x = I.X(x0 + (x1 - x0) * i / n), y = I.Y(y0 + (y1 - y0) * i / n);
    ctx.fillRect(x - Math.floor(s / 2), y - Math.floor(s / 2), s, s);
  }
}

function updateMagic(now, dt){
  const back = document.getElementById('fxBack'), front = document.getElementById('fxFront');
  if (!back || !front) return;
  const hiddenFloor = activeMinigame || document.getElementById('creatureFloor').classList.contains('hidden');

  /* Partículas: se mueven aunque no se vean (para que no se acumulen). */
  const fh = floorHeight();
  for (let i = MAGIC.parts.length - 1; i >= 0; i--){
    const p = MAGIC.parts[i];
    const age = now - p.born;
    if (age >= p.life || p.dead){ MAGIC.parts.splice(i, 1); if (p.onDie) p.onDie(p); continue; }
    p.vx += p.ax * dt; p.vy += p.ay * dt;
    if (p.drag){ const f = Math.max(0, 1 - p.drag * dt); p.vx *= f; p.vy *= f; }
    p.x += p.vx * dt + (p.wob ? Math.sin(age / 1000 * p.wobF + p.phase) * p.wob * dt : 0);
    p.y += p.vy * dt;
    if (p.y <= 0 && p.floor){
      if (p.floor === 'stop'){ p.y = 0; p.vy = 0; p.vx *= 0.5; }
      else if (p.floor === 'bounce' && p.vy < -10){ p.y = 0; p.vy = -p.vy * 0.45; p.vx *= 0.7; }
      else if (p.floor === 'die'){ p.dead = true; if (p.onFloor) p.onFloor(p); }
    }
    if (p.y > fh + 60 || p.y < -30) p.dead = true;
    /* Una partícula que va dejando estela (cohetes, estrellas fugaces). */
    if (p.emit && !p.dead) p.emit(p, now);
  }
  MAGIC.effects = MAGIC.effects.filter(e => !(e.until && now > e.until) && !(e.done && e.done(now)) && !(e.rt && e.rt.removed));

  for (const [c, layer] of [[back, 'back'], [front, 'front']]){
    const parts = MAGIC.parts.filter(p => p.layer === layer);
    const effs = MAGIC.effects.filter(e => e.layer === layer);
    const has = !hiddenFloor && (parts.length || effs.length);
    if (!has && !MAGIC.lastDrawn[layer]) continue;
    fitFxCanvas(c);
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    MAGIC.lastDrawn[layer] = !!has;
    if (!has) continue;
    ctx.imageSmoothingEnabled = false;
    const I = fxInfo(c);
    for (const e of effs){ ctx.globalAlpha = 1; e.draw(ctx, I, now, e); }
    for (const p of parts){
      const age = now - p.born, u = age / p.life;
      let a = p.a * (p.fade ? (u > 0.6 ? 1 - (u - 0.6) / 0.4 : 1) : 1);
      if (p.twinkle) a *= 0.55 + 0.45 * Math.sin(age / 90 + p.phase);
      if (a <= 0.02) continue;
      ctx.globalAlpha = Math.min(1, a);
      const color = p.colors ? p.colors[Math.floor(age / (p.cycle || 120)) % p.colors.length] : p.color;
      if (p.ring) drawRing(ctx, I, p.x, p.y, p.ring, color, p.hi);
      else drawShape(ctx, I, p.shape, p.x, p.y, p.size, color);
    }
    ctx.globalAlpha = 1;
  }

  /* Luz de la pieza. */
  const amb = document.getElementById('ambientLayer');
  for (const [id, a] of Object.entries(MAGIC.ambient)) if (a.rt && a.rt.removed) delete MAGIC.ambient[id];
  const bg = hiddenFloor ? '' : Object.values(MAGIC.ambient).map(a => a.bg).join(', ');
  if (amb._bg !== bg){ amb._bg = bg; amb.style.background = bg; amb.classList.toggle('on', !!bg); }

  if (MAGIC.floorMode && (now > MAGIC.floorMode.until || hiddenFloor)) endFloorMode();
  updateClone(now);
}

/* ---------- toques en el piso ----------
   Mientras el láser o el jetpack se manejan (floorMode), todo toque en el
   piso es una orden: no mima, no limpia, no manda a un mueble. Las burbujas
   se revientan tocándolas, sin modo: si el toque cae cerca de una, se la
   come la burbuja. Captura en window: corre antes que todos los demás. */
function floorPointFromEvent(e){
  const r = document.getElementById('creatureFloor').getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width, y: r.bottom - 4 - e.clientY, xpx: e.clientX - r.left };
}

function startFloorMode(id, ms, onTap, onEnd){
  if (MAGIC.floorMode && MAGIC.floorMode.id !== id) endFloorMode();
  MAGIC.floorMode = { id, until: performance.now() + ms, onTap, onEnd };
  document.getElementById('creatureFloor').classList.add('floor-mode');
}
function endFloorMode(){
  const m = MAGIC.floorMode;
  if (!m) return;
  MAGIC.floorMode = null;
  document.getElementById('creatureFloor').classList.remove('floor-mode');
  if (m.onEnd) m.onEnd();
}
function floorModeOn(id){ return !!(MAGIC.floorMode && MAGIC.floorMode.id === id); }

window.addEventListener('DOMContentLoaded', () => {
  const floor = document.getElementById('creatureFloor');
  const inFloor = e => e.target && e.target.closest && e.target.closest('#creatureFloor') &&
    !e.target.closest('.log-btn, .room-arrow');
  window.addEventListener('pointerdown', e => {
    if (!state || gameOver || !inFloor(e) || (typeof mealBusy === 'function' && mealBusy())) return;
    const pt = floorPointFromEvent(e);
    if (MAGIC.floorMode){
      e.stopPropagation(); e.preventDefault();
      MAGIC.swallowClickUntil = performance.now() + 600;
      MAGIC.floorMode.onTap(pt.x, pt.y);
      return;
    }
    if (popBubbleAt(pt.xpx, pt.y)){
      e.stopPropagation(); e.preventDefault();
      MAGIC.swallowClickUntil = performance.now() + 600;
    }
  }, true);
  window.addEventListener('click', e => {
    if (performance.now() < MAGIC.swallowClickUntil && inFloor(e)){ e.stopPropagation(); e.preventDefault(); }
  }, true);
  void floor;
});

/* ---------- el doble (espejo mágico) ----------
   Un tercer personaje que solo se dibuja: copia a la mascota con un poco de
   retraso y reflejada respecto de un eje (la línea del espejo). Lleva un
   tinte (CSS filter, que no reescala el pixel art). */
const CLONE = { on: false, axis: 0.5, delay: 260, hist: [], alpha: 0, want: 0 };

function startClone(axisX){
  CLONE.on = true; CLONE.axis = axisX; CLONE.hist = []; CLONE.want = 1;
}
function stopClone(){ CLONE.want = 0; }

function updateClone(now){
  const c = document.getElementById('cloneCanvas');
  if (!c) return;
  if (!CLONE.on){ if (!c.classList.contains('hidden')) c.classList.add('hidden'); return; }
  CLONE.alpha += (CLONE.want - CLONE.alpha) * Math.min(1, 0.006 * 16);
  if (CLONE.want === 0 && CLONE.alpha < 0.03){ CLONE.on = false; c.classList.add('hidden'); return; }
  CLONE.hist.push({ t: now, x: walker.x, y: walker.y, dir: walker.dir, anim: walker.anim, animT0: walker.animT0,
    frame: walker.frame, hidden: walker.hidden, action: petAction });
  while (CLONE.hist.length > 2 && CLONE.hist[1].t <= now - CLONE.delay) CLONE.hist.shift();
  const h = CLONE.hist[0];
  c.classList.remove('hidden');
  fitPetCanvas(c);
  const stage = displayStage();
  const ghost = { isMain: false, species: currentSpeciesId(), stage, frame: h.frame,
    anim: h.anim, animT0: (h.animT0 || 0) + CLONE.delay,
    action: h.action ? { name: h.action.name, startedAt: h.action.startedAt + CLONE.delay } : null };
  const ctx = c.getContext('2d');
  drawSprite(ctx, stage, displayMood(), h.frame, false, stageDeviceScale(stage), { w: c.width, h: c.height }, ghost);
  c.style.left = (clampX(2 * CLONE.axis - h.x) * 100) + '%';
  c.style.bottom = (4 + h.y) + 'px';
  c.style.transform = `translateX(-50%) scaleX(${-h.dir})`;
  c.style.opacity = h.hidden ? 0 : (0.78 * CLONE.alpha).toFixed(3);
}

/* ---------- ayudantes ---------- */

/* Mandar a la mascota a hacer algo con el objeto, por orden de quien juega
   (el `tap` de cada objeto), con los mismos chequeos que tocar un mueble. */
function magicGo(rt, steps, opts = {}){
  const no = furniCommandBlocked();
  if (no){ say(no); return false; }
  petAction = null;
  for (const act of allActors()) if (act.activity && act.activity.rt === rt) endFurniActivity(act);
  if (walker.activity) endFurniActivity(walker);
  const list = typeof steps === 'function' ? steps(furniHelpers(rt, walker)) : steps;
  if (walker.y > 1) list.unshift({ hop: { x: walker.x, y: 0 }, ms: 300, h: 6 });
  startActivity(walker, list, { rt, kind: 'visit', onEnd: opts.onEnd });
  walker.lastVisit = rt.id;
  petFx('❗', walker);
  if (typeof socialNextAt !== 'undefined') socialNextAt = Math.max(socialNextAt, performance.now() + 4000);
  return true;
}

/* Dónde está en px CSS del piso: el centro del objeto y alto (pixeles del arte). */
function rtPx(rt, dx = 0){ return rt.x * floorWidth() + dx * furniK(); }
function artPx(n){ return n * furniK(); }
/* La mascota está libre para algo nuevo (no come, no duerme, no está en un juego). */
function walkerBusy(){ return !!(walker.activity && (walker.activity.kind === 'eat' || walker.activity.kind === 'sleep')) || state.sleeping; }
/* Un objeto puesto en la pieza que se está viendo, por id. */
function magicRt(id){ return typeof furniPlaced === 'function' ? furniPlaced(id) : null; }

/* Un regalito de felicidad por jugar con un objeto: pasa por furniJoy(),
   con su tope por hora. */
function magicJoy(){ if (typeof furniJoy === 'function') furniJoy(); }

/* Formato de tiempo corto: "2 h 10 min", "35 min". */
function magicDur(ms){
  const min = Math.max(1, Math.round(ms / 60000));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/* Un resplandor redondo en la luz de la pieza, centrado en un punto del piso
   (px CSS, y hacia arriba). La capa de luz arranca 40 px más arriba que el
   piso (ver .ambient-layer). */
function glowAt(xpx, ypx, rgba, radius){
  const top = 40 + floorHeight() - 4 - ypx;
  return `radial-gradient(circle at ${Math.round(xpx)}px ${Math.round(top)}px, ${rgba}, transparent ${Math.round(radius)}px)`;
}
const rnd = (a, b) => a + Math.random() * (b - a);
/* Después de un paso que puede cortarse con el personaje en el aire (un
   salto a medio camino), baja suave al piso. */
const LAND = { hop: (a, act) => ({ x: act.x, y: 0 }), ms: 240, h: 3 };

/* ===================== 1. Puntero láser =====================
   Tocarlo lo prende y el piso pasa a ser un mando: el punto rojo va donde
   se toque y la mascota lo persigue, y cuando lo alcanza se le tira encima.
   Solo (visita espontánea), el punto se mueve sin rumbo. */
const LASER = { on: false, rt: null, x: 0.5, tx: 0.5, auto: true, nextAt: 0 };

function laserFarX(){
  let x = rnd(0.1, 0.9);
  for (let i = 0; i < 8 && Math.abs(x - walker.x) < 0.25; i++) x = rnd(0.1, 0.9);
  return x;
}
function laserOn(rt, auto){
  if (rt.removed) return;
  Object.assign(LASER, { on: true, rt, auto, x: rt.x, tx: laserFarX(), nextAt: performance.now() + 1400 });
  rt.on = true;
  fxEffect({ id: 'laser-dot', layer: 'front', rt, draw: drawLaserDot });
}
function laserOff(){
  if (!LASER.on) return;
  LASER.on = false;
  if (LASER.rt) LASER.rt.on = false;
  fxEffectOff('laser-dot');
  if (floorModeOn('laser')) endFloorMode();
}
function drawLaserDot(ctx, I, now){
  const rt = LASER.rt, k = furniK();
  const x = LASER.x * I.fw + Math.sin(now / 41) * 0.6, y = 1.5;
  const sx = rt.x * I.fw + 4.5 * k, sy = 6.5 * k;
  /* El rayo, apenas visible, de a puntitos. */
  const n = Math.max(2, Math.round(Math.hypot(x - sx, y - sy) / 6));
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = MP.neon;
  for (let i = 1; i < n; i++){
    if ((i + Math.floor(now / 90)) % 2) continue;
    ctx.fillRect(I.X(sx + (x - sx) * i / n), I.Y(sy + (y - sy) * i / n), I.u, I.u);
  }
  ctx.globalAlpha = 0.35 + 0.2 * Math.sin(now / 70);
  drawShape(ctx, I, 'star', x, y, 1, MP.neon);
  ctx.globalAlpha = 0.9;
  drawShape(ctx, I, 'plus', x, y, 1, MP.neonL);
  ctx.globalAlpha = 1;
  drawShape(ctx, I, 'sq', x, y, 1, '#ffffff');
}

/* Perseguir el punto: corre hacia él y, al alcanzarlo, se le tira encima. */
function laserChase(ms){
  return { ms: ms || 1e9, anim: a => (a.l && a.l.anim) || 'walk',
    until: a => !LASER.on || (ms && performance.now() - a.st >= ms),
    track: (rt, el, act, a, dt) => {
      const l = a.l || (a.l = { anim: 'walk', pounce: 0, last: 0 });
      const now = performance.now();
      if (l.pounce){
        const t = (now - l.pounce) / 420;
        if (t < 1){ act.y = 4 * t * (1 - t) * 18; act.x = clampX(act.x + l.pdir * dt * 0.14); return null; }
        l.pounce = 0; act.y = 0; l.anim = 'happy';
        fxBurst(act.x * floorWidth(), 2, 5, { colors: ['#ffffff', '#ffd7a0'], speed: 40, life: 400, ay: -80, layer: 'back' });
        if (LASER.auto) LASER.tx = laserFarX();
      }
      const d = LASER.x - act.x;
      if (Math.abs(d) < 0.03){
        if (now - l.last > 750){ l.pounce = now; l.last = now; l.pdir = act.dir; l.anim = 'celebrate'; }
        else if (l.anim === 'walk') l.anim = 'happy';
        return null;
      }
      act.dir = d > 0 ? 1 : -1;
      act.x = clampX(act.x + act.dir * dt * (Math.abs(d) > 0.25 ? 0.3 : 0.2));
      l.anim = 'walk';
      return null;
    } };
}

const LASER_ART = { w: 12, h: 12,
  tick: (rt, now, dt) => {
    if (!LASER.on || LASER.rt !== rt) return;
    LASER.x += (LASER.tx - LASER.x) * Math.min(1, dt * (LASER.auto ? 4 : 9));
    if (LASER.auto && now > LASER.nextAt){ LASER.tx = rnd(0.08, 0.92); LASER.nextAt = now + rnd(900, 2200); }
  },
  cleanup: (rt, act) => {
    if (LASER.rt === rt && !allActors().some(o => o !== act && o.activity && o.activity.rt === rt)) laserOff();
  },
  tap: rt => {
    if (LASER.on && LASER.rt === rt){ laserOff(); say('Láser apagado'); return true; }
    if (!magicGo(rt, [laserChase(0), LAND, S.happy(900, { fx: ['😆'] })])) return true;
    laserOn(rt, false);
    startFloorMode('laser', 25000, x => {
      LASER.tx = Math.min(0.96, Math.max(0.04, x));
      fxBurst(LASER.tx * floorWidth(), 3, 4, { colors: [MP.neon, MP.neonL], speed: 30, life: 300, ay: 0, drag: 3 });
    }, () => laserOff());
    say('Toca el piso: el punto rojo va donde toques 🔴', 2800);
    return true;
  },
  parts: [
    { id: 'body', draw: p => {
      p.box(2, 9, 8, 3, FP.metalD, FP.metal);
      p.r(5, 7, 2, 2, FP.metalD);
      p.box(1, 3, 10, 5, FP.dark, '#5a5070');
      p.r(3, 5, 5, 1, '#3b3448');
      p.r(10, 4, 2, 3, FP.O); p.r(10, 5, 1, 1, '#7a1020');
      p.r(4, 2, 2, 1, FP.O); p.r(4, 2, 2, 1, FP.redL);
    } },
    { id: 'led', show: 'on', draw: p => {
      p.r(10, 5, 2, 1, MP.neon); p.r(11, 4, 1, 3, MP.neonL); p.r(4, 2, 2, 1, '#ffffff');
    } },
  ],
  visits: [
    f => [
      { go: f.x(-11) },
      { anim: 'pet', ms: 500, dir: 1, end: rt => laserOn(rt, true) },
      laserChase(9500), LAND,
      { go: f.x(-11) },
      { anim: 'pet', ms: 450, dir: 1, end: () => laserOff() },
      S.happy(700, { fx: ['😆'] }),
    ],
  ],
  /* Los dos detrás del mismo punto: chocan, se tiran encima a la vez. */
  duos: [
    f => ({
      a: [{ go: f.x(-11) }, { anim: 'pet', ms: 500, dir: 1, end: rt => laserOn(rt, true) }, S.sync('on'),
        laserChase(10000), LAND, S.sync('off'), S.call(() => laserOff()), S.happy(800, { dir: 'partner', fx: ['😆'] })],
      b: [{ go: f.x(13) }, S.sync('on'), laserChase(10000), LAND, S.sync('off'), S.happy(800, { dir: 'partner', fx: ['😂'] })],
    }),
  ] };

/* ===================== 2. Jetpack =====================
   Se lo pone y vuela. Por orden de quien juega, la pantalla pasa a ser el
   mando: donde se toque, ahí va (con inercia, como un jetpack de verdad), y
   el jetpack va en su espalda echando fuego. Solo, hace un ocho por la pieza.
   De a dos, el otro se sube a su cabeza. */
const JET = { on: false, rt: null, act: null, tx: 0.5, ty: 40, vx: 0, vy: 0, mode: 'auto' };

function jetMaxY(act){ return Math.max(20, floorHeight() - actorCssH(act) - 8); }
function jetFly(ms, mode){
  return { anim: 'happy', ms: ms || 1e9,
    start: (rt, act) => {
      Object.assign(JET, { on: true, rt, act, mode, vx: 0, vy: 0, tx: act.x, ty: Math.min(jetMaxY(act), actorCssH(act) * 1.3) });
      if (mode === 'player'){
        startFloorMode('jetpack', 20000, (x, y) => {
          JET.tx = Math.min(0.94, Math.max(0.06, x));
          JET.ty = Math.min(jetMaxY(act), Math.max(12, y - actorCssH(act) * 0.4));
        });
      }
    },
    until: a => mode === 'player' ? !floorModeOn('jetpack') : performance.now() - a.st >= ms,
    track: (rt, el, act, a, dt) => {
      const fw = floorWidth(), top = jetMaxY(act);
      let tx = JET.tx, ty = JET.ty;
      if (mode !== 'player'){
        const t = el / 1000;
        tx = 0.5 + 0.36 * Math.sin(t * 0.85);
        ty = top * 0.5 + top * 0.32 * Math.sin(t * 1.7);
      } else ty += Math.sin(el / 280) * 4;
      JET.vx += ((tx - act.x) * fw * 5 - JET.vx * 2.6) * dt;
      JET.vy += ((ty - act.y) * 5 - JET.vy * 2.6) * dt;
      act.x = clampX(act.x + JET.vx * dt / fw);
      act.y = Math.max(6, Math.min(top, act.y + JET.vy * dt));
      if (Math.abs(JET.vx) > 10) act.dir = JET.vx > 0 ? 1 : -1;
      return null;
    },
    end: () => { JET.on = false; if (floorModeOn('jetpack')) endFloorMode(); } };
}
function jetSteps(f, mode){
  return [
    { go: f.x(-12) },
    { anim: 'pet', ms: 500, dir: 1, end: (rt, act) => { rt.worn = true; rt.wearer = act; } },
    S.wait(450, 'idle', { fx: ['🔥'] }),
    jetFly(mode === 'player' ? 0 : 9000, mode),
    { hop: (a, act) => ({ x: act.x, y: 0 }), ms: 550, h: 5, anim: 'celebrate' },
    { go: f.x(-12) },
    { anim: 'pet', ms: 450, dir: 1, end: rt => { rt.worn = false; rt.wearer = null; } },
    S.happy(800, { fx: ['😆', '🌟'] }),
  ];
}
/* Lo que lleva puesto el jetpack: dónde va el pack (en la espalda). */
function jetPackPos(rt){
  const W = rt.wearer, h = actorCssH(W), k = furniK();
  return { x: (W.x - rt.x) * floorWidth() - W.dir * h * 0.22, y: W.y + h * 0.42 - 12 * k };
}

const JETPACK_ART = { w: 14, h: 22, keep: ['worn', 'wearer'],
  init: rt => { rt.worn = false; rt.wearer = null; rt.puffAt = 0; },
  tick: (rt, now) => {
    if (!rt.worn || !rt.wearer) return;
    /* Fuego por las toberas: harto volando, poquito en tierra. */
    const flying = JET.on && JET.rt === rt;
    if (now - rt.puffAt < (flying ? 28 : 120)) return;
    rt.puffAt = now;
    const p = jetPackPos(rt), k = furniK();
    const nx = rt.x * floorWidth() + p.x, ny = p.y + 12 * k - 7 * k;
    for (const off of [-2, 2]){
      fxSpawn({ x: nx + off * k + rnd(-1, 1), y: ny, vx: rnd(-8, 8) - (flying ? JET.vx * 0.25 : 0),
        vy: -(flying ? rnd(70, 120) : rnd(20, 40)), life: rnd(220, 380), size: Math.random() < 0.35 ? 2 : 1,
        colors: ['#fff6c0', MP.goldL, FP.orange, FP.red], cycle: 70, layer: 'back' });
    }
    if (flying && Math.random() < 0.25){
      fxSpawn({ x: nx, y: ny - 6, vx: rnd(-10, 10), vy: -rnd(10, 25), life: 700, size: 2, color: 'rgba(210,210,225,.7)', layer: 'back' });
    }
  },
  cleanup: rt => {
    rt.worn = false; rt.wearer = null;
    if (JET.rt === rt){ JET.on = false; if (floorModeOn('jetpack')) endFloorMode(); }
  },
  tap: rt => {
    if (floorModeOn('jetpack')){ endFloorMode(); return true; }
    if (magicGo(rt, f => jetSteps(f, 'player'))) say('¡A volar! Toca la pantalla para llevarlo 🚀', 2800);
    return true;
  },
  parts: [
    { id: 'stand', draw: p => {
      p.box(2, 19, 10, 3, FP.metalD, FP.metal);
      p.r(6, 2, 2, 17, FP.metalD); p.r(6, 2, 1, 17, FP.metal);
      p.r(4, 2, 6, 1, FP.O); p.r(4, 3, 1, 1, FP.O);
    } },
    ...['rest', 'worn'].map(which => ({ id: 'pack-' + which,
      show: rt => which === 'rest' ? !rt.worn : (rt.worn && !!rt.wearer),
      pose: which === 'worn' ? (rt => (rt.wearer ? jetPackPos(rt) : null)) : undefined,
      draw: p => {
        p.box(3, 5, 4, 10, FP.metal, FP.whiteL); p.box(7, 5, 4, 10, FP.metal, FP.whiteL);
        p.r(4, 6, 1, 7, '#dfe4ee'); p.r(8, 6, 1, 7, '#dfe4ee');
        p.r(4, 4, 2, 1, FP.red); p.r(8, 4, 2, 1, FP.red);
        p.r(3, 9, 8, 1, FP.redD); p.r(6, 9, 2, 1, MP.gold);
        p.r(4, 15, 2, 2, FP.metalD); p.r(8, 15, 2, 2, FP.metalD);
      } })),
  ],
  visits: [ f => jetSteps(f, 'auto') ],
  /* Uno vuela y el otro va arriba de su cabeza. */
  duos: [
    f => ({
      a: [{ go: f.x(-12) }, { anim: 'pet', ms: 500, dir: 1, end: (rt, act) => { rt.worn = true; rt.wearer = act; } },
        S.sync('ready'), S.wait(500, 'idle', { fx: ['🔥'] }), jetFly(9000, 'auto'),
        S.call((rt, act, a) => { a.duo.data.landing = true; }),
        { hop: (a, act) => ({ x: act.x, y: 0 }), ms: 600, h: 5, anim: 'celebrate' }, S.sync('down'),
        { go: f.x(-12) }, { anim: 'pet', ms: 450, dir: 1, end: rt => { rt.worn = false; rt.wearer = null; } },
        S.happy(800, { dir: 'partner', fx: ['😆'] })],
      b: [{ go: f.x(-30) }, S.sync('ready'),
        { hop: (a, act) => ({ x: a.partner.x, y: a.partner.y + actorCssH(a.partner) * 0.85 }), ms: 450, h: 14 },
        { ride: a => !!a.duo.data.landing, dy: () => actorCssH(f.act) * 0.85, anim: 'celebrate', fx: ['😱', '😆'], fxEvery: 1600 },
        { hop: (a, act) => ({ x: clampX(act.x - act.dir * 0.08), y: 0 }), ms: 500, h: 10 }, S.sync('down'),
        S.happy(900, { dir: 'partner', fx: ['🌟'] })],
    }),
  ] };

/* ===================== 3. Máquina de burbujas =====================
   Echa burbujas que suben bamboleándose. Se revientan tocándolas (cada seis,
   un poquito de felicidad) y la mascota salta a reventarlas. */
const BUB = { on: false, rt: null, until: 0, nextAt: 0, popped: 0 };

function bubblesOn(rt, ms){
  if (rt.removed) return;
  Object.assign(BUB, { on: true, rt, until: performance.now() + ms, nextAt: 0 });
  rt.on = true;
}
function bubbleList(){ return MAGIC.parts.filter(p => p.bubble && !p.dead); }
function bubbleBurst(p){
  fxBurst(p.x, p.y, 7, { colors: ['#ffffff', MP.sky, FP.pinkL], speed: 50, life: 320, ay: 0, drag: 3 });
}
function popBubble(p, byPlayer){
  p.popped = true; p.dead = true;
  bubbleBurst(p);
  if (!byPlayer) return;
  magicTone(rnd(1100, 1800), 70, 'sine', 0.08);
  BUB.popped++;
  if (BUB.popped % 6 === 0){ magicJoy(); petFx('😆', walker); }
}
/* Un toque en el piso: ¿cayó en una burbuja? */
function popBubbleAt(xpx, y){
  const k = furniK();
  let best = null, bd = 1e9;
  for (const p of bubbleList()){
    const d = Math.hypot(p.x - xpx, p.y - y);
    if (d < p.ring * k + 12 && d < bd){ best = p; bd = d; }
  }
  if (best){ popBubble(best, true); return true; }
  return false;
}
function spawnBubble(rt){
  const k = furniK();
  fxSpawn({ x: rtPx(rt, -3) + rnd(-3, 3), y: 13 * k, vx: rnd(-28, 28), vy: rnd(14, 30), ay: 2, wob: 18, wobF: rnd(2, 4),
    life: rnd(6000, 9000), ring: 3 + Math.floor(Math.random() * 3), colors: [MP.sky, FP.pinkL, MP.violetL, '#c8fff0'],
    cycle: 170, hi: '#ffffff', fade: false, layer: 'front', bubble: true,
    onDie: p => { if (!p.popped) bubbleBurst(p); } });
}

/* Reventar burbujas: va hacia la más cercana que esté a su alcance y salta. */
function bubbleChase(ms){
  return { ms, anim: a => (a.b && a.b.anim) || 'idle',
    track: (rt, el, act, a, dt) => {
      const b = a.b || (a.b = { anim: 'idle', j: 0 });
      const now = performance.now(), fw = floorWidth(), h = actorCssH(act);
      if (b.j){
        const t = (now - b.j) / 460;
        if (t < 1){
          act.y = 4 * t * (1 - t) * b.jh;
          for (const p of bubbleList()) if (Math.abs(p.x - act.x * fw) < 14 && Math.abs(p.y - (act.y + h * 0.8)) < 16) popBubble(p, false);
          return null;
        }
        b.j = 0; act.y = 0;
      }
      let best = null;
      for (const p of bubbleList()) if (p.y < h * 2.1 && (!best || Math.abs(p.x - act.x * fw) < Math.abs(best.x - act.x * fw))) best = p;
      if (!best){ b.anim = 'happy'; return null; }
      const dx = best.x - act.x * fw;
      if (Math.abs(dx) < 10){
        if (best.y < h * 0.7) popBubble(best, false);
        else { b.j = now; b.jh = Math.min(h * 1.3, Math.max(10, best.y - h * 0.7 + 8)); b.anim = 'celebrate'; }
        return null;
      }
      act.dir = dx > 0 ? 1 : -1;
      act.x = clampX(act.x + act.dir * dt * 0.17);
      b.anim = 'walk';
      return null;
    } };
}

const BURBUJAS_ART = { w: 16, h: 18,
  init: rt => { rt.spin = 0; },
  tick: (rt, now, dt) => {
    if (BUB.rt === rt && BUB.on){
      if (now > BUB.until){ BUB.on = false; rt.on = false; }
      else if (now > BUB.nextAt){ BUB.nextAt = now + rnd(220, 420); spawnBubble(rt); }
      rt.spin += dt * 5;
    }
  },
  tap: rt => {
    bubblesOn(rt, 14000);
    if (!furniCommandBlocked() && !walkerBusy()) magicGo(rt, [bubbleChase(13500), LAND, S.happy(700, { fx: ['😆'] })]);
    say('¡Revienta las burbujas tocándolas! ✨', 2600);
    return true;
  },
  parts: [
    { id: 'machine', draw: p => {
      p.box(1, 10, 14, 7, '#7fc4ff', '#b5e0ff');
      p.disc(5, 13.5, 2, MP.gold); p.r(5, 13, 1, 1, FP.O);
      p.r(9, 12, 5, 1, FP.blueD); p.r(9, 14, 5, 1, FP.blueD);
      p.r(2, 17, 2, 1, FP.O); p.r(12, 17, 2, 1, FP.O);
      p.box(10, 4, 5, 7, FP.glass); p.r(11, 7, 3, 3, FP.pinkL); p.r(11, 5, 1, 1, '#ffffff');
      p.r(5, 9, 1, 2, FP.metalD);
    } },
    { id: 'hoop', pivot: [5, 5], pose: rt => ({ r: rt.spin }), draw: p => {
      p.ring(5, 5, 4, FP.O, 1); p.ring(5, 5, 3, FP.pink, 1);
      p.r(5, 9, 1, 1, FP.metalD);
    } },
  ],
  visits: [
    f => [
      { go: f.x(11) },
      { anim: 'pet', ms: 500, dir: -1, end: rt => bubblesOn(rt, 10000) },
      bubbleChase(9500), LAND,
      S.dance(900, 300, { fx: ['✨'] }),
    ],
  ],
  duos: [
    f => ({
      a: [{ go: f.x(-11) }, { anim: 'pet', ms: 500, dir: 1, end: rt => bubblesOn(rt, 11000) }, S.sync('on'),
        bubbleChase(10000), LAND, S.sync('end'), S.happy(800, { dir: 'partner', fx: ['😆'] })],
      b: [{ go: f.x(13) }, S.sync('on'), bubbleChase(10000), LAND, S.sync('end'), S.happy(800, { dir: 'partner', fx: ['✨'] })],
    }),
  ] };

/* ===================== 4. Cámara instantánea =====================
   Se pone frente a ella, cuenta 3-2-1 y ¡flash!: la foto queda en un álbum
   (state.objData.camara.photos, las últimas ALBUM_MAX). Tocar la cámara abre
   el álbum, con un botón para sacar una foto ahora. Las fotos no son una
   captura de pantalla: guardan qué se veía (especie, etapa, pose, el
   acompañante si estaba al lado, el color de la pantalla) y se vuelven a
   dibujar con el sprite, a escala entera. Sola se saca una selfie cada tanto
   (no más de una cada ALBUM_AUTO_GAP_MS, para no llenar el álbum). */
const ALBUM_MAX = 18;
const ALBUM_AUTO_GAP_MS = 2 * 60 * 60 * 1000;

function photoPose(act){
  const el = performance.now() - (act.animT0 || 0);
  return { anim: act.anim || 'happy', el: Math.max(0, el) };
}
function takePhoto(rt, player){
  const now = performance.now();
  rt.flashUntil = now + 200; rt.photoT = now;
  magicFlash('#ffffff', 450, player ? 0.9 : 0.5);
  if (player){ magicTone(2200, 35, 'square', 0.05); magicTone(1100, 70, 'square', 0.05, audioNow() + 0.06); }
  const d = objData('camara');
  if (!player && Date.now() - (d.lastAuto || 0) < ALBUM_AUTO_GAP_MS) return;
  if (!player) d.lastAuto = Date.now();
  const screen = styleItemById(state.style.screen) || styleItemById('verde');
  const hat = state.style.hat && styleItemById(state.style.hat);
  const b = typeof buddyActive === 'function' && buddyActive() &&
    Math.abs(buddy.x - walker.x) * floorWidth() < 90 ? buddy : null;
  const photo = {
    t: Date.now(), day: Math.floor(state.ageHours / 24) + 1, stage: displayStage(), species: currentSpeciesId(),
    ...photoPose(walker), hat: hat ? hat.emoji : null, bg: screen.lcd[0], hi: screen.lcd[1], night: isNightMode(),
    buddy: b ? { species: b.species, stage: b.stage, ...photoPose(b), left: b.x < walker.x } : null,
  };
  d.photos = [photo, ...(Array.isArray(d.photos) ? d.photos : [])].slice(0, ALBUM_MAX);
  saveState();
}

/* Dibuja una foto en un canvas (px CSS w x h, backing en píxeles físicos).
   El sprite va a escala ENTERA en píxeles físicos, como la mascota. */
function drawPhoto(canvas, ph, w, h){
  canvas.width = Math.round(w * DPR); canvas.height = Math.round(h * DPR);
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const g = ctx.createRadialGradient(canvas.width / 2, 0, 4, canvas.width / 2, canvas.height * 0.4, canvas.width);
  g.addColorStop(0, ph.hi); g.addColorStop(1, ph.bg);
  ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (ph.night){ ctx.fillStyle = 'rgba(10,8,40,.45)'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  const floorY = canvas.height - Math.round(5 * DPR);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, floorY, canvas.width, Math.round(2 * DPR));
  const scale = Math.max(1, Math.round(36 * DPR / 32));
  const tmp = document.createElement('canvas');
  tmp.width = Math.round(48 * DPR); tmp.height = Math.round(48 * DPR);
  const who = [{ species: ph.species, stage: ph.stage, anim: ph.anim, el: ph.el, dx: 0 }];
  if (ph.buddy){
    const off = Math.round(17 * DPR);
    who[0].dx = ph.buddy.left ? off : -off;
    who.push({ ...ph.buddy, dx: ph.buddy.left ? -off : off });
  }
  for (const wh of who){
    if (!SPECIES[wh.species] || wh.stage === 'egg') continue;
    const tctx = tmp.getContext('2d');
    tctx.clearRect(0, 0, tmp.width, tmp.height);
    const ghost = { isMain: false, species: wh.species, stage: wh.stage, anim: wh.anim, animT0: performance.now() - wh.el, action: null, frame: 0 };
    drawSprite(tctx, wh.stage, 'happy', 0, false, scale, { w: tmp.width, h: tmp.height }, ghost);
    ctx.drawImage(tmp, Math.round((canvas.width - tmp.width) / 2) + wh.dx, floorY - tmp.height);
  }
  if (ph.hat && !ph.buddy){
    ctx.font = `${Math.round(12 * DPR)}px sans-serif`; ctx.textAlign = 'center';
    ctx.fillText(ph.hat, canvas.width / 2, floorY - Math.round(30 * DPR));
  }
}

function openAlbum(rt){
  const photos = Array.isArray(objData('camara').photos) ? objData('camara').photos : [];
  const cards = photos.map((ph, i) => `
    <div class="polaroid"><canvas data-photo="${i}"></canvas>
      <small>Día ${ph.day} · ${escapeHtml(STAGE_LABELS[ph.stage] || ph.stage)}</small></div>`).join('');
  showOverlay(`
    <h3>📷 Álbum</h3>
    <p>${photos.length ? `${photos.length} foto${photos.length === 1 ? '' : 's'} · la más nueva primero` : 'Todavía no hay fotos: ¡sácale una!'}</p>
    <div class="menu-list album-list">${cards ? `<div class="album-grid">${cards}</div>` : ''}</div>
    <div class="overlay-actions">
      <button class="overlay-btn secondary" id="albumClose">Cerrar</button>
      <button class="overlay-btn" id="albumShoot">📸 Sacar una foto</button>
    </div>`, hideOverlay);
  document.querySelectorAll('[data-photo]').forEach(c => drawPhoto(c, photos[Number(c.dataset.photo)], 76, 64));
  document.getElementById('albumClose').addEventListener('click', hideOverlay);
  document.getElementById('albumShoot').addEventListener('click', () => {
    hideOverlay();
    if (rt.removed) return;
    magicGo(rt, f => photoSteps(f, true));
  });
}

/* Posar: se para frente al lente, cuenta y ¡flash! en la pose elegida. */
function photoSteps(f, player){
  const pose = pickOne(['celebrate', 'happy', 'pet']);
  return [
    { go: f.x(-30) },
    S.wait(350, 'idle', { dir: 1 }),
    { anim: 'happy', ms: 650, dir: 1, fx: ['3️⃣'] },
    { anim: 'happy', ms: 650, dir: 1, fx: ['2️⃣'] },
    { anim: 'happy', ms: 650, dir: 1, fx: ['1️⃣'] },
    { anim: pose, ms: 1000, dir: 1, start: rt => setTimeout(() => { if (!rt.removed) takePhoto(rt, player); }, 380) },
    S.happy(900, { dir: 1, fx: ['😄', '📸'] }),
    { go: f.x(-12) },
    S.wait(900, 'idle', { dir: 1, fx: ['👀'] }),
    S.happy(600, { fx: ['💖'] }),
  ];
}

const CAMARA_ART = { w: 16, h: 26,
  init: rt => { rt.flashUntil = 0; rt.photoT = -1e9; },
  tap: rt => { openAlbum(rt); return true; },
  parts: [
    { id: 'tripod', draw: p => {
      p.line(7, 13, 2, 25, FP.woodD); p.line(8, 13, 8, 25, FP.woodD); p.line(9, 13, 14, 25, FP.woodD);
      p.r(6, 12, 4, 2, FP.metalD);
    } },
    { id: 'photo', show: (rt, now) => now - rt.photoT < 2600,
      pose: (rt, now, k) => {
        const t = Math.min(1, (now - rt.photoT) / 700);
        return { y: -t * 6 * k };
      }, draw: p => {
        p.box(4, 6, 8, 8, '#fbfbfb'); p.r(5, 7, 6, 5, '#3a3550'); p.r(7, 9, 2, 1, FP.pink); p.r(8, 10, 1, 1, FP.pink);
      } },
    { id: 'cam', draw: p => {
      p.box(1, 4, 14, 9, FP.white, FP.whiteL);
      for (let i = 0; i < 6; i++) p.r(2 + i * 2, 6, 2, 1, RAINBOW[i]);
      p.disc(9.5, 9, 2.9, FP.dark); p.disc(9.5, 9, 1.7, '#3a5a8a'); p.r(9, 8, 1, 1, FP.whiteL);
      p.box(2, 8, 3, 3, FP.dark); p.r(3, 9, 1, 1, '#8cc4ff');
      p.box(10, 2, 4, 3, FP.metal, FP.whiteL);
      p.r(3, 3, 2, 1, FP.O); p.r(3, 3, 2, 1, FP.red);
      p.r(4, 12, 8, 1, FP.dark);
    } },
    { id: 'flash', show: (rt, now) => now < rt.flashUntil, draw: p => {
      p.r(9, 0, 6, 6, '#fff7b0'); p.r(10, 1, 4, 4, '#ffffff');
    } },
  ],
  visits: [ f => photoSteps(f, false) ],
  /* Foto de los dos juntos. */
  duos: [
    f => ({
      a: [{ go: f.x(-28) }, S.sync('pose', { dir: 1 }),
        { anim: 'happy', ms: 650, dir: 1, fx: ['3️⃣'] }, { anim: 'happy', ms: 650, dir: 1, fx: ['2️⃣'] },
        { anim: 'happy', ms: 650, dir: 1, fx: ['1️⃣'] },
        { anim: 'celebrate', ms: 1000, dir: 1, start: rt => setTimeout(() => { if (!rt.removed) takePhoto(rt, false); }, 380) },
        S.sync('done'), S.happy(1000, { dir: 'partner', fx: ['😄'] })],
      b: [{ go: f.x(-46) }, S.sync('pose', { dir: 1 }), S.wait(1500, 'happy', { dir: 1 }),
        { anim: 'pet', ms: 1500, dir: 1 }, S.sync('done'), S.happy(1000, { dir: 'partner', fx: ['💖'] })],
    }),
  ] };

/* ===================== 5. Bola de cristal =====================
   Tocarla: la mascota pone las manos encima, la bola se enciende y dice qué
   va a pasar, de verdad: cuál de sus barras se va a poner en riesgo primero
   y en cuánto, con los ritmos reales de la simulación (o si está enferma,
   si hay caca, si le falta la vacuna). Sola, solo mira y se asusta. */
function crystalProphecy(){
  if (state.stage === 'egg') return 'Veo… un huevo a punto de abrirse 🥚';
  if (state.sick) return 'Veo… que se siente mal. ¡Una medicina! 💊';
  const H = 60;   // horas de juego por hora real
  const cands = [];
  const eta = (v, umbral, porHoraReal) => v <= umbral ? 0 : (v - umbral) / porHoraReal;
  cands.push({ t: eta(state.hunger, HEALTH_RISK_AT, hungerDecayPerHour() * H), msg: t => t ? `le dará hambre en ${t}` : 'tiene hambre ahora mismo' });
  cands.push({ t: eta(state.happiness, HEALTH_RISK_AT, DECAY_PER_HOUR.happiness * H), msg: t => t ? `se va a aburrir en ${t}` : 'quiere jugar ahora mismo' });
  if (!state.sleeping) cands.push({ t: eta(state.energy, SLEEPY_THRESHOLD, DECAY_PER_HOUR.energy * H), msg: t => t ? `le dará sueño en ${t}` : 'tiene sueño ahora mismo' });
  if (state.poop) cands.push({ t: eta(state.hygiene, HEALTH_RISK_AT, HYGIENE_POOP_DECAY * H), msg: t => t ? `esa caca lo va a ensuciar en ${t}` : 'hay que recoger la caca ahora mismo' });
  if (vaccineFor() && !isVaccinated()) cands.push({ t: eta(state.health, SICK_LOW_HEALTH_AT, (VACCINE_HEALTH_LOSS_PER_DAY - HEALTH_RECOVER_PER_DAY) / 24), msg: t => t ? `sin vacuna su salud bajará de ${SICK_LOW_HEALTH_AT} en ${t}: ¡vacuna!` : 'le falta su vacuna, ¡ya!' });
  cands.sort((a, b) => a.t - b.t);
  const c = cands[0];
  if (!c || c.t > 6) return 'Veo… un día tranquilo. Nada urgente en 6 horas ✨';
  return `Veo… que ${c.msg(c.t ? magicDur(c.t * 3600000) : '')}`;
}

function crystalOn(rt, ms){
  if (rt.removed) return;
  rt.on = true; rt.onUntil = performance.now() + ms;
}

const CRISTAL_ART = { w: 14, h: 18,
  init: rt => { rt.onUntil = 0; rt.sparkAt = 0; },
  tick: (rt, now) => {
    const on = now < rt.onUntil;
    if (rt.on !== on) rt.on = on;
    const k = furniK(), fw = floorWidth();
    setAmbient('cristal', on ? glowAt(rt.x * fw, 11 * k, `rgba(170,110,255,${(0.3 + 0.1 * Math.sin(now / 200)).toFixed(2)})`, 110) : null, rt);
    if (on && now - rt.sparkAt > 110){
      rt.sparkAt = now;
      fxSpawn({ x: rtPx(rt, 0) + rnd(-14, 14), y: 11 * k + rnd(-8, 8), vy: rnd(10, 22), life: rnd(700, 1100),
        shape: pickOne(['plus', 'sq', 'sq']), colors: [MP.violetL, FP.pinkL, '#ffffff'], cycle: 160, twinkle: true, layer: 'back' });
    }
  },
  cleanup: rt => { rt.onUntil = 0; },
  tap: rt => {
    if (furniCommandBlocked() || walkerBusy()){
      crystalOn(rt, 2600);
      say('🔮 ' + crystalProphecy(), 3600);
      return true;
    }
    magicGo(rt, [
      { go: f2 => clampX(rt.x - 13 * furniK() / floorWidth()) },
      { anim: 'pet', ms: 2200, dir: 1, start: () => crystalOn(rt, 3400), fx: ['✨', '🔮'], fxEvery: 700 },
      { anim: 'idle', ms: 1400, dir: 1, start: () => say('🔮 ' + crystalProphecy(), 3800) },
      S.happy(700, { fx: ['😮'] }),
    ]);
    return true;
  },
  parts: [
    { id: 'stand', draw: p => {
      p.box(2, 15, 10, 3, MP.violetD, MP.violet);
      p.box(4, 11, 6, 4, MP.goldD, MP.gold); p.r(5, 12, 1, 2, MP.goldL);
    } },
    { id: 'ball', draw: p => {
      p.disc(7, 6.5, 5.7, (x, y) => y < 4 ? '#e2f4ff' : y < 7 ? '#b6dcff' : '#86b6ff');
      p.r(4, 4, 1, 1, '#ffffff'); p.r(5, 3, 2, 1, '#ffffff');
    } },
    { id: 'glowA', show: (rt, now) => rt.on && Math.floor(now / 160) % 2 === 0, draw: p => {
      p.r(6, 5, 2, 1, MP.violetL); p.r(8, 6, 1, 2, FP.pinkL); p.r(5, 7, 2, 1, MP.violet); p.r(7, 8, 2, 1, '#ffffff');
    } },
    { id: 'glowB', show: (rt, now) => rt.on && Math.floor(now / 160) % 2 === 1, draw: p => {
      p.r(5, 5, 1, 2, FP.pinkL); p.r(7, 5, 2, 1, '#ffffff'); p.r(8, 7, 2, 1, MP.violetL); p.r(6, 8, 2, 1, MP.violet);
    } },
  ],
  visits: [
    f => [
      { go: f.x(-13) },
      { anim: 'pet', ms: 2400, dir: 1, start: rt => crystalOn(rt, 3200), fx: ['✨', '🔮', '👀'], fxEvery: 800 },
      { anim: 'sad', ms: 900, dir: 1, fx: ['😱'] },
      { hop: { x: f.x(-26), y: 0 }, ms: 380, h: 10 },
      S.happy(1100, { dir: 1, fx: ['😅'] }),
    ],
  ],
  /* Los dos miran: uno se asusta, el otro se ríe. */
  duos: [
    f => ({
      a: [{ go: f.x(-13) }, S.sync('in', { dir: 1 }), { anim: 'pet', ms: 2400, dir: 1, start: rt => crystalOn(rt, 3200), fx: ['🔮'], fxEvery: 900 },
        S.sync('look'), S.happy(1600, { dir: 'partner', fx: ['😂'] })],
      b: [{ go: f.x(13) }, S.sync('in', { dir: -1 }), S.wait(2400, 'idle', { dir: -1, fx: ['👀'] }), S.sync('look'),
        { anim: 'sad', ms: 900, fx: ['😱'] }, { hop: { x: f.x(26), y: 0 }, ms: 380, h: 10 }, S.happy(700, { dir: 'partner' })],
    }),
  ] };


/* ===================== 6. Robot aspiradora =====================
   Pasea solo por la pieza (aunque nadie lo use). Una vez al día
   (ROBOT_CLEAN_EVERY_MS) va hasta la caca y se la aspira: limpia como el
   botón Limpiar, sola. Después tiene que recargarse (la luz se pone roja).
   La mascota se le sube encima y la lleva de paseo. Tocarlo dice cuánta
   batería le queda y, si se puede, la mascota se sube. */
const ROBOT_CLEAN_EVERY_MS = 20 * 60 * 60 * 1000;
const ROBOT_POOP_X = 0.16;   // donde se dibuja la caca (.poop-fx, left:16%)

function robotCharged(){ return Date.now() - (objData('robot').lastClean || 0) >= ROBOT_CLEAN_EVERY_MS; }
function robotAbsX(rt){ return clampX(rt.x + (rt.rx || 0) / floorWidth()); }
function robotBounds(rt){
  const fw = floorWidth(), half = 8 * furniK() + 4;
  return [half - rt.x * fw, fw - half - rt.x * fw];
}
function robotRideSteps(f, ms){
  const rt = f.rt, top = () => 7 * furniK();
  return [
    { go: () => clampX(robotAbsX(rt) - 0.09) },
    { hop: () => ({ x: robotAbsX(rt), y: top() }), ms: 450, h: 14, end: () => { rt.rider = true; } },
    { anim: 'happy', ms, fx: ['😆', '🤖', '🎶'], fxEvery: 1500,
      track: (r, el, act) => { act.dir = rt.dirX || 1; return { x: robotAbsX(rt), y: top() + Math.abs(Math.sin(el / 120)) }; } },
    { hop: (a, act) => ({ x: clampX(act.x + 0.08), y: 0 }), ms: 420, h: 12, start: () => { rt.rider = false; } },
    S.happy(800, { fx: ['🌟'] }),
  ];
}

const ROBOT_ART = { w: 16, h: 8, keep: ['rx', 'tx', 'dirX', 'waitUntil', 'mode', 'suckAt'],
  init: rt => { rt.rx = 0; rt.tx = 0; rt.dirX = 1; rt.waitUntil = 0; rt.mode = 'roam'; rt.rider = false; rt.suckAt = 0; rt.dustAt = 0; },
  tick: (rt, now, dt) => {
    const [lo, hi] = robotBounds(rt), fw = floorWidth();
    rt.rx = Math.min(hi, Math.max(lo, rt.rx || 0));
    /* ¿Hay caca y batería? Va a limpiarla (si nadie va encima). */
    if (rt.mode !== 'clean' && state.poop && !rt.rider && robotCharged() && !gameOver && displayStage() !== 'egg'){
      rt.mode = 'clean'; rt.tx = Math.min(hi, Math.max(lo, ROBOT_POOP_X * fw + 10 - rt.x * fw));
    }
    if (rt.mode === 'clean' && !state.poop) rt.mode = 'roam';
    if (rt.mode === 'suck'){
      const t = now - rt.suckAt;
      if (Math.random() < 0.5){
        const ang = rnd(0, 6.28), r = rnd(18, 30);
        fxSpawn({ x: robotAbsX(rt) * fw + Math.cos(ang) * r, y: 6 + Math.abs(Math.sin(ang)) * r * 0.5,
          vx: -Math.cos(ang) * r * 2.4, vy: -Math.abs(Math.sin(ang)) * r * 1.2, life: 400,
          colors: ['#a07a4a', '#c9b08a', '#ffffff'], cycle: 130, layer: 'front' });
      }
      if (t > 1600){
        rt.mode = 'roam';
        if (state.poop){
          state.poop = false;
          state.hygiene = clamp(state.hygiene + POOP_CLEAN_HYGIENE);   // lo mismo que recogerla a mano
          objData('robot').lastClean = Date.now();
          logEvent('🤖', 'El robot aspiró la caca');
          fxBurst(robotAbsX(rt) * fw, 10, 8, { colors: ['#ffffff', MP.mint], shape: 'plus', speed: 50, life: 600, ay: 0 });
          saveState(); render();
        }
      }
      return;
    }
    const speed = rt.rider ? 46 : rt.mode === 'clean' ? 30 : 20;
    const d = rt.tx - rt.rx;
    if (Math.abs(d) < 1.5){
      rt.moving = false;
      if (rt.mode === 'clean'){ rt.mode = 'suck'; rt.suckAt = now; return; }
      if (now > rt.waitUntil){
        rt.tx = rnd(lo, hi);
        rt.waitUntil = now + (rt.rider ? rnd(200, 700) : rnd(1500, 4500));
      }
      return;
    }
    if (now < rt.waitUntil && rt.mode === 'roam' && !rt.rider){ rt.moving = false; return; }
    rt.moving = true;
    rt.dirX = d > 0 ? 1 : -1;
    rt.rx += rt.dirX * Math.min(Math.abs(d), speed * dt);
    if (now - rt.dustAt > 220){
      rt.dustAt = now;
      fxSpawn({ x: robotAbsX(rt) * fw - rt.dirX * 8 * furniK(), y: 2, vx: -rt.dirX * 12, vy: 6, life: 450,
        color: 'rgba(200,200,215,.7)', layer: 'back' });
    }
  },
  cleanup: rt => { rt.rider = false; },
  tap: rt => {
    const msg = robotCharged() ? '🤖 Batería llena: aspira la próxima caca'
      : `🤖 Cargando: vuelve a limpiar en ${magicDur(ROBOT_CLEAN_EVERY_MS - (Date.now() - (objData('robot').lastClean || 0)))}`;
    if (!furniCommandBlocked() && !walkerBusy()) magicGo(rt, f => robotRideSteps(f, 7000));
    say(msg, 2600);
    return true;
  },
  parts: [
    { id: 'body', pose: (rt, now) => ({ x: rt.rx || 0, y: rt.moving ? Math.abs(Math.sin(now / 60)) * 0.4 : 0 }), draw: p => {
      p.ell(8, 4.5, 7.6, 3.4, (x, y) => y < 3 ? '#e9edf5' : y < 5 ? '#c7cede' : '#9aa3b5');
      p.r(1, 5, 14, 1, FP.dark); p.r(2, 5, 3, 1, MP.mint);
      p.r(3, 7, 2, 1, FP.O); p.r(11, 7, 2, 1, FP.O);
    } },
    { id: 'ledG', show: (rt, now) => robotCharged() && Math.floor(now / 500) % 2 === 0,
      pose: rt => ({ x: rt.rx || 0 }), draw: p => { p.r(7, 1, 2, 1, MP.mint); } },
    { id: 'ledR', show: (rt, now) => !robotCharged() && Math.floor(now / 700) % 2 === 0,
      pose: rt => ({ x: rt.rx || 0 }), draw: p => { p.r(7, 1, 2, 1, MP.neon); } },
  ],
  visits: [ f => robotRideSteps(f, 7500) ],
  /* Uno arriba del robot y el otro corriendo detrás. */
  duos: [
    f => {
      const rt = f.rt;
      return {
        a: [...robotRideSteps(f, 7000).slice(0, 2), S.sync('go'),
          { anim: 'happy', ms: 7000, fx: ['😆'], fxEvery: 1500,
            track: (r, el, act) => { act.dir = rt.dirX || 1; return { x: robotAbsX(rt), y: 7 * furniK() + Math.abs(Math.sin(el / 120)) }; } },
          ...robotRideSteps(f, 7000).slice(3, 4), S.sync('end'), S.happy(800, { dir: 'partner' })],
        b: [{ go: f.x(-30) }, S.sync('go'),
          { anim: 'walk', ms: 7000, fx: ['😂'], fxEvery: 2000, track: (r, el, act, a, dt) => {
            const tx = clampX(robotAbsX(rt) - (rt.dirX || 1) * 0.12), d = tx - act.x;
            if (Math.abs(d) > 0.01){ act.dir = d > 0 ? 1 : -1; act.x = clampX(act.x + act.dir * Math.min(Math.abs(d), dt * 0.2)); }
            return null; } },
          S.sync('end'), S.happy(800, { dir: 'partner', fx: ['🌟'] })],
      };
    },
  ] };

/* ===================== 7. Nubecita =====================
   Una nube con carita que flota por la pieza (libre: no ocupa lugar en el
   piso). Cada tanto llueve: si la mascota queda debajo, se moja (un poquito
   de higiene, una vez por lluvia). Tocarla hace un trueno: destello, rayo,
   sonido y la mascota se asusta. */
function cloudAbsX(rt){ return clampX(rt.x + (rt.cx || 0) / floorWidth()); }
function cloudY(){ return Math.max(actorCssH(walker) * 1.7, Math.min(floorHeight() * 0.58, floorHeight() - 12 * furniK() - 8)); }
function cloudRain(rt, ms){ rt.rainUntil = performance.now() + ms; rt.washed = false; }

const NUBE_ART = { w: 24, h: 12, free: true, keep: ['cx', 'tcx', 'waitUntil', 'rainUntil', 'nextRain', 'stormUntil'],
  init: rt => { rt.cx = 0; rt.tcx = 0; rt.waitUntil = 0; rt.rainUntil = 0; rt.nextRain = performance.now() + rnd(15000, 30000); rt.stormUntil = 0; rt.dropAt = 0; },
  tick: (rt, now, dt) => {
    const fw = floorWidth(), half = 12 * furniK() + 4;
    const lo = half - rt.x * fw, hi = fw - half - rt.x * fw;
    const d = rt.tcx - rt.cx;
    if (Math.abs(d) < 1){ if (now > rt.waitUntil){ rt.tcx = rnd(lo, hi); rt.waitUntil = now + rnd(3000, 9000); } }
    else rt.cx += Math.sign(d) * Math.min(Math.abs(d), 9 * dt);
    if (now > rt.nextRain){ cloudRain(rt, 6500); rt.nextRain = now + rnd(40000, 70000); }
    const raining = now < rt.rainUntil;
    setAmbient('nube', raining ? 'linear-gradient(rgba(40,60,90,.32), rgba(40,60,90,.12))' : null, rt);
    if (!raining) return;
    const k = furniK(), cx = cloudAbsX(rt) * fw, cy = cloudY() + 2 * k;
    if (now - rt.dropAt > 22){
      rt.dropAt = now;
      for (let i = 0; i < 2; i++) fxSpawn({ x: cx + rnd(-10, 10) * k, y: cy, vy: -rnd(160, 200), life: 3000, shape: 'drop',
        color: Math.random() < 0.5 ? MP.sky : '#d6f1ff', layer: 'front', floor: 'die', fade: false,
        onFloor: p => fxBurst(p.x, 1, 2, { colors: ['#d6f1ff'], speed: 25, life: 220, ay: -120, spread: Math.PI, ang0: 0 }) });
    }
    /* La mascota debajo se moja: un poco de higiene, una vez por lluvia. */
    if (!rt.washed && !state.sleeping && Math.abs(walker.x * fw - cx) < 12 * k && displayStage() !== 'egg'){
      rt.washed = true;
      state.hygiene = clamp(state.hygiene + 4);
      petFx('💦', walker);
    }
  },
  tap: rt => {
    const now = performance.now(), k = furniK(), fw = floorWidth();
    rt.stormUntil = now + 2500;
    magicFlash('#e8f0ff', 320, 0.85);
    setTimeout(() => magicFlash('#ffffff', 260, 0.6), 180);
    magicTone(70, 700, 'sawtooth', 0.09); magicTone(46, 1100, 'triangle', 0.16, audioNow() + 0.08);
    const x0 = cloudAbsX(rt) * fw, y0 = cloudY();
    const pts = [[x0, y0]];
    let x = x0;
    for (let y = y0 - 14; y > 0; y -= 14){ x += rnd(-12, 12); pts.push([x, Math.max(0, y)]); }
    pts.push([x + rnd(-6, 6), 0]);
    fxEffect({ id: 'rayo', layer: 'front', until: now + 260, draw: (ctx, I) => {
      for (let i = 1; i < pts.length; i++) drawPxLine(ctx, I, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], '#fff6a8', 1);
    } });
    fxBurst(x, 2, 10, { colors: ['#fff6a8', '#ffffff'], shape: 'plus', speed: 70, life: 500, ay: -80 });
    if (now > rt.rainUntil) cloudRain(rt, 6000);
    if (!state.sleeping && !walker.activity && !furniCommandBlocked() && displayStage() !== 'egg'){
      startActivity(walker, [{ anim: 'sad', ms: 700, fx: ['😱'] }, { bounce: 1, ms: 380, h: 16 }, S.happy(700, { fx: ['😅'] })], { kind: 'visit' });
    }
    return true;
  },
  parts: [
    ...['soft', 'storm'].map(kind => ({ id: kind,
      show: (rt, now) => kind === 'storm' ? now < rt.stormUntil : now >= rt.stormUntil,
      pose: (rt, now) => ({ x: rt.cx || 0, y: cloudY() + Math.sin(now / 900) * 2 }),
      draw: p => {
        const W = kind === 'storm' ? '#9aa3b5' : '#ffffff', L = kind === 'storm' ? '#c3c9d6' : '#ffffff', B = kind === 'storm' ? '#6f7890' : '#cfe3f5';
        const fill = (x, y) => y >= 9 ? B : W;
        p.disc(7, 7.5, 4.6, fill); p.disc(16.5, 7.5, 4.6, fill); p.disc(11.5, 5.5, 5.6, fill);
        p.r(5, 8, 14, 3, W); p.r(5, 10, 14, 1, B); p.r(4, 11, 16, 1, FP.O);
        p.r(9, 2, 3, 1, L);
        p.r(9, 7, 1, 1, FP.O); p.r(14, 7, 1, 1, FP.O);
        if (kind === 'storm'){ p.r(8, 6, 2, 1, FP.O); p.r(14, 6, 2, 1, FP.O); p.r(11, 9, 2, 1, FP.O); }
        else { p.r(8, 8, 1, 1, FP.pinkL); p.r(15, 8, 1, 1, FP.pinkL); p.r(11, 8, 2, 1, FP.O); }
      } })),
  ],
  visits: [
    f => {
      const rt = f.rt;
      return [
        { go: () => cloudAbsX(rt) },
        { anim: 'happy', ms: 900, fx: ['☁️'], start: () => cloudRain(rt, 7000) },
        { anim: 'happy', ms: 6000, flip: 600, fx: ['💦', '☔', '😆'], fxEvery: 900,
          track: (r, el, act, a, dt) => {
            const d = cloudAbsX(rt) - act.x;
            if (Math.abs(d) > 0.01) act.x = clampX(act.x + Math.sign(d) * Math.min(Math.abs(d), dt * 0.1));
            return null;
          } },
        { bounce: 2, ms: 380, h: 12, fx: ['💦'] },
        S.happy(700),
      ];
    },
  ],
  duos: [
    f => {
      const rt = f.rt, under = side => ({ anim: 'happy', ms: 6000, flip: 700, fx: ['💦', '☔'], fxEvery: 1100,
        track: (r, el, act, a, dt) => {
          const d = clampX(cloudAbsX(rt) + side * 0.06) - act.x;
          if (Math.abs(d) > 0.01) act.x = clampX(act.x + Math.sign(d) * Math.min(Math.abs(d), dt * 0.1));
          return null;
        } });
      return {
        a: [{ go: () => clampX(cloudAbsX(rt) - 0.06) }, S.sync('in', { start: () => cloudRain(rt, 7500) }), under(-1),
          S.sync('end'), S.happy(800, { dir: 'partner', fx: ['😆'] })],
        b: [{ go: () => clampX(cloudAbsX(rt) + 0.06) }, S.sync('in'), under(1), S.sync('end'), S.happy(800, { dir: 'partner' })],
      };
    },
  ] };

/* ===================== 8. Árbol frutal =====================
   Da una fruta cada FRUIT_EVERY_MS (hasta tres colgando), aunque la app
   esté cerrada (se cuenta con la hora). Tocarlo: si hay fruta, la mascota
   sacude el árbol, la fruta cae y se la come (es comida de verdad, entra al
   mismo montón que la de la bandeja, ver serveFood). Comida gratis pero
   poca: unas cuatro frutas al día, +15 de hambre cada una. */
const FRUIT_EVERY_MS = 6 * 60 * 60 * 1000;
const FRUIT_FOOD = { id: 'fruta', name: 'Fruta del árbol', emoji: '🍎', restore: 15, energy: 3 };
const FRUIT_SPOTS = [[8, 13], [20, 9], [14, 17]];

function treeFruit(){
  const d = objData('arbol');
  if (typeof d.fruit !== 'number') d.fruit = 0;
  if (!d.since) d.since = Date.now();
  while (d.fruit < 3 && Date.now() - d.since >= FRUIT_EVERY_MS){ d.fruit++; d.since += FRUIT_EVERY_MS; }
  if (d.fruit >= 3) d.since = Date.now();
  return d;
}
function harvestFruit(rt){
  const d = treeFruit();
  if (d.fruit <= 0 || rt.removed) return;
  if (d.fruit >= 3) d.since = Date.now();
  d.fruit--;
  const piece = { food: FRUIT_FOOD, hunger: hungerFillPct(FRUIT_FOOD), energy: FRUIT_FOOD.energy, t: 0, done: 0 };
  const m = state.meal || (state.meal = { hunger: 0, energy: 0 });
  m.hunger += piece.hunger; m.energy += piece.energy;
  const k = furniK();
  foodPile = { x: clampX(rt.x + 7 * k / floorWidth()), side: -1, standX: clampX(rt.x - 6 * k / floorWidth()), plate: null, pieces: [], n: 0 };
  serveFood(piece);
  if (piece.el) piece.el.style.setProperty('--drop', Math.round(20 * k) + 'px');
  say('¡Una fruta! 🍎');
  saveState();
}

const ARBOL_ART = { w: 28, h: 34,
  init: rt => { rt.shakeAt = -1e9; rt.leafUntil = 0; rt.leafAt = 0; },
  tick: (rt, now) => {
    rt.fruit = treeFruit().fruit;
    if (now < rt.leafUntil && now - rt.leafAt > 160){
      rt.leafAt = now;
      const k = furniK();
      fxSpawn({ x: rtPx(rt, rnd(-10, 10)), y: rnd(18, 28) * k, vx: rnd(-8, 8), vy: -rnd(18, 30), wob: 30, wobF: rnd(2, 4),
        life: 2600, shape: 'leaf', colors: [MP.leaf, MP.leafL, MP.limeD], cycle: 400, layer: 'front', floor: 'stop' });
    }
  },
  tap: rt => {
    const d = treeFruit();
    if (d.fruit <= 0){
      /* Con fertilizante de la compostera, da una fruta al tiro. */
      if (bagCount('fertilizante') > 0 && !(walker.activity && walker.activity.pile)){
        magicGo(rt, fertilizeSteps(rt, r => {
          const dd = treeFruit();
          dd.fruit = Math.min(3, dd.fruit + 1);
          r.shakeAt = performance.now();
          say('¡Salió una fruta! Toca el árbol para cosecharla 🍎', 2800);
        }));
        return true;
      }
      say(`🍎 La próxima fruta sale en ${magicDur(FRUIT_EVERY_MS - (Date.now() - d.since))}`, 2600);
      return true;
    }
    if (walker.activity && walker.activity.pile){ say('Primero que termine de comer'); return true; }
    magicGo(rt, f => [
      { go: f.x(-8) },
      { bounce: 3, ms: 420, h: 14, dir: 1, onBounce: r => { r.shakeAt = performance.now(); r.leafUntil = performance.now() + 900; } },
      { call: r => harvestFruit(r) },
    ]);
    return true;
  },
  parts: [
    { id: 'trunk', draw: p => {
      p.box(12, 18, 5, 16, MP.bark, MP.barkL); p.r(13, 22, 1, 6, MP.barkL);
      p.r(10, 32, 2, 2, MP.bark); p.r(17, 32, 2, 2, MP.bark); p.r(9, 33, 11, 1, FP.O);
    } },
    { id: 'crown', pivot: [14, 30], pose: (rt, now) => {
      const t = (now - rt.shakeAt) / 500;
      return { r: t < 1 ? Math.sin(t * 18) * 0.05 * (1 - t) : Math.sin(now / 1500) * 0.008 };
    }, draw: p => {
      const leaf = (x, y) => ((x * 7 + y * 3) % 6 === 0 ? MP.leafL : y > 15 ? MP.leafD : MP.leaf);
      p.disc(7, 14, 6.5, leaf); p.disc(21, 14, 6.5, leaf); p.disc(14, 10, 9.6, leaf);
      p.r(10, 4, 3, 1, MP.leafL); p.r(9, 5, 1, 1, MP.leafL);
    } },
    ...FRUIT_SPOTS.map(([x, y], i) => ({ id: 'fruit' + i, pivot: [14, 30], show: rt => (rt.fruit || 0) > i,
      pose: (rt, now) => {
        const t = (now - rt.shakeAt) / 500;
        return { r: t < 1 ? Math.sin(t * 18) * 0.05 * (1 - t) : Math.sin(now / 1500) * 0.008 };
      }, draw: p => {
        p.disc(x, y, 1.9, FP.red); p.r(x - 1, y - 1, 1, 1, FP.redL); p.r(x, y - 3, 1, 1, MP.bark);
      } })),
  ],
  visits: [
    /* Siesta a la sombra, con hojas que caen. */
    f => [
      { go: f.x(-6) },
      { anim: 'sleep', ms: 5000, fx: ['😌', '🍃'], fxEvery: 1600, start: r => { r.leafUntil = performance.now() + 4500; } },
      S.happy(800, { fx: ['🌳'] }),
    ],
    /* Salta a tocar las hojas: el árbol se sacude y llueven hojas. */
    f => [
      { go: f.x(-4) },
      { bounce: 4, ms: 480, h: 22, onApex: r => { r.shakeAt = performance.now(); r.leafUntil = performance.now() + 800; } },
      S.dance(2600, 400, { fx: ['🍃', '😆'], fxEvery: 800 }),
      S.happy(600),
    ],
  ],
  /* Uno sacude el árbol y al otro le llueven hojas; después, siesta juntos. */
  duos: [
    f => ({
      a: [{ go: f.x(-6) }, S.sync('in'), { bounce: 3, ms: 450, h: 18, onApex: r => { r.shakeAt = performance.now(); r.leafUntil = performance.now() + 900; } },
        S.sync('leaves'), S.happy(900, { dir: 'partner', fx: ['😂'] }), { anim: 'sleep', ms: 3500, fx: ['💤'], fxEvery: 1500 }, S.sync('end')],
      b: [{ go: f.x(6) }, S.sync('in', { dir: -1 }), S.wait(1400, 'idle', { dir: -1 }), S.sync('leaves'),
        { anim: 'celebrate', ms: 900, fx: ['🍃'] }, { anim: 'sleep', ms: 3500 }, S.sync('end'), S.happy(600, { dir: 'partner' })],
    }),
  ] };

/* ===================== 9. Frijol mágico =====================
   Una plantita que crece un poco cada vez que se riega, una vez por día
   (BEAN_WATER_EVERY_MS): seis etapas, y en la última llega a las nubes.
   Ahí, tocarla manda a la mascota a trepar hasta arriba, donde encuentra un
   huevo de oro (BEAN_REWARD monedas) y la planta vuelve a empezar. Es la
   meta larga: no se castiga si un día no se riega, solo no crece. */
const BEAN_WATER_EVERY_MS = 20 * 60 * 60 * 1000;
const BEAN_REWARD = 120;
const BEAN_TOP = 5;
const BEAN_HEIGHT = [52, 44, 34, 24, 12, 3];   // dónde termina el tallo (pixeles del arte, de arriba) por etapa

function beanData(){
  const d = objData('frijol');
  if (typeof d.stage !== 'number') d.stage = 0;
  return d;
}
function drawBean(p, stage){
  const top = BEAN_HEIGHT[stage];
  for (let y = 54; y >= top; y--){
    const x = 11 + Math.round(Math.sin(y / 4) * 2);
    p.r(x, y, 2, 1, MP.leafD); p.r(x, y, 1, 1, MP.leaf);
    if (y % 6 === 0 && y < 52){
      const side = (y / 6) % 2 ? 1 : -1;
      p.r(x + (side > 0 ? 2 : -2), y - 1, 2, 1, MP.leafL); p.r(x + (side > 0 ? 2 : -3), y, 3, 1, MP.leaf);
    }
  }
  const tx = 11 + Math.round(Math.sin(top / 4) * 2);
  p.r(tx - 1, top - 1, 2, 1, MP.leafL); p.r(tx + 1, top - 2, 2, 1, MP.leafL);
  if (stage === BEAN_TOP){
    const W = '#ffffff', B = '#d6e8f7';
    p.disc(6, 4, 3.5, W); p.disc(16, 4, 3.5, W); p.disc(11, 3, 4, W); p.r(3, 5, 17, 2, W); p.r(3, 7, 17, 1, B);
    p.disc(11, 1.5, 1.6, MP.gold); p.r(10, 0, 1, 1, MP.goldL);
  }
}
function drawBeanPot(p){
  p.box(5, 54, 12, 3, '#c4633a', '#e08a5a');
  p.box(6, 56, 10, 8, '#b4552f', '#c96a40'); p.r(7, 58, 1, 4, '#d27a4e');
}

const FRIJOL_ART = { w: 22, h: 64,
  thumb: { w: 22, h: 22, draw: p => {
    p.box(5, 12, 12, 3, '#c4633a', '#e08a5a'); p.box(6, 14, 10, 8, '#b4552f', '#c96a40');
    for (let y = 11; y >= 3; y--) p.r(11 + Math.round(Math.sin(y / 3)), y, 2, 1, MP.leafD);
    p.r(13, 4, 3, 1, MP.leafL); p.r(8, 7, 3, 1, MP.leafL); p.r(9, 2, 4, 1, MP.leafL);
    p.disc(16, 3, 2.5, '#ffffff'); p.disc(16, 2.5, 1, MP.gold);
  } },
  init: rt => { rt.growAt = -1e9; },
  tick: rt => { rt.stage = beanData().stage; },
  tap: rt => {
    const d = beanData();
    if (d.stage >= BEAN_TOP){
      magicGo(rt, f => [
        { go: f.x(-7) },
        S.wait(400, 'idle', { dir: 1, fx: ['☁️'] }),
        { slide: { x: f.x(0), y: f.y(52) }, ms: 2600, anim: 'happy', fx: ['🌱', '😆'], fxEvery: 800 },
        { anim: 'idle', ms: 1300, hide: true, start: r => {
          for (let i = 0; i < 10; i++) fxSpawn({ x: rtPx(r, rnd(-8, 8)), y: 58 * furniK(), vx: rnd(-30, 30), vy: rnd(10, 40), ay: -40,
            life: 900, shape: 'plus', colors: [MP.gold, MP.goldL, '#ffffff'], cycle: 120, layer: 'front' });
        } },
        { call: r => {
          const dd = beanData();
          dd.stage = 0; dd.harvests = (dd.harvests || 0) + 1; dd.lastWater = 0;
          state.coins += BEAN_REWARD;
          r.growAt = performance.now();
          saveState(); render();
          if (typeof rewardSound === 'function') rewardSound();
          showPopup({ icon: '🥚', title: '¡Un huevo de oro en las nubes!', items: [{ icon: '💰', text: 'Monedas', amount: `+${BEAN_REWARD}` }],
            note: 'El frijol vuelve a empezar: riégalo cada día y vuelve a llegar al cielo.' });
        } },
        { hop: (a, act) => ({ x: clampX(act.x - 0.1), y: 0 }), ms: 900, h: 20, hide: false, anim: 'celebrate' },
        S.dance(1400, 350, { fx: ['🌟', '💰'], fxEvery: 500 }),
      ]);
      return true;
    }
    const wait = BEAN_WATER_EVERY_MS - (Date.now() - (d.lastWater || 0));
    if (wait > 0){
      /* Con fertilizante de la compostera, crece una etapa sin esperar el riego. */
      if (bagCount('fertilizante') > 0){
        magicGo(rt, fertilizeSteps(rt, r => {
          const dd = beanData();
          dd.stage = Math.min(BEAN_TOP, dd.stage + 1);
          r.growAt = performance.now();
          petFx('🌱', walker);
          if (dd.stage >= BEAN_TOP) say('¡Llegó hasta las nubes! Tócala para que suba ☁️', 3000);
        }));
        return true;
      }
      say(`🌱 Ya la regó: crece de nuevo en ${magicDur(wait)}`, 2600);
      return true;
    }
    magicGo(rt, f => [
      { go: f.x(-9) },
      { anim: 'clean', ms: 1700, dir: 1, fx: ['💧'], fxEvery: 500, start: r => {
        for (let i = 0; i < 12; i++) setTimeout(() => { if (!r.removed) fxSpawn({ x: rtPx(r, rnd(-3, 3)), y: 16 * furniK(), vy: -rnd(40, 70), life: 700,
          shape: 'drop', color: MP.sky, layer: 'front', floor: 'die' }); }, i * 110);
      } },
      { call: r => {
        const dd = beanData();
        dd.stage = Math.min(BEAN_TOP, dd.stage + 1); dd.lastWater = Date.now();
        r.growAt = performance.now();
        saveState();
        petFx('🌱', walker);
        if (dd.stage >= BEAN_TOP) say('¡Llegó hasta las nubes! Tócala para que suba ☁️', 3000);
      } },
      { anim: 'celebrate', ms: 1100, dir: 1, fx: ['✨'] },
      S.happy(600),
    ]);
    return true;
  },
  parts: [
    { id: 'pot', draw: drawBeanPot },
    ...[0, 1, 2, 3, 4, 5].map(st => ({ id: 'stalk' + st, show: rt => (rt.stage || 0) === st, pivot: [11, 54],
      pose: (rt, now) => {
        const t = (now - rt.growAt) / 700;
        return t < 1 ? { sy: 0.8 + 0.2 * t + Math.sin(t * Math.PI) * 0.06, sx: 1 + Math.sin(t * Math.PI) * 0.06 }
          : { r: Math.sin(now / 1400) * 0.01 };
      }, draw: p => drawBean(p, st) })),
  ],
  visits: [
    f => [
      { go: f.x(-8) },
      S.wait(1200, 'idle', { dir: 1, fx: ['🌱', '👀'] }),
      { anim: 'eat', ms: 900, dir: 1, fx: ['😋'] },
      S.dance(2400, 500, { fx: ['🎶', '🌱'], fxEvery: 800 }),
      S.happy(600),
    ],
  ],
  duos: [
    f => ({
      a: [{ go: f.x(-9) }, S.sync('in', { dir: 1 }), S.dance(3000, 500, { fx: ['🌱'], fxEvery: 900 }), S.sync('end'), S.happy(700, { dir: 'partner' })],
      b: [{ go: f.x(9) }, S.sync('in', { dir: -1 }), S.dance(3000, 500, { fx: ['🎶'], fxEvery: 900 }), S.sync('end'), S.happy(700, { dir: 'partner' })],
    }),
  ] };


/* ===================== 10. Fuegos artificiales =====================
   Prende la mecha, corre a taparse los oídos y desde la caja suben cohetes
   que revientan en el cielo de la pieza: distintas formas (bola, anillo,
   corazón, sauce dorado), cada una de su color, con un brillo en la luz de
   la pieza. Con sonido si lo pidió quien juega. */
const FIREWORK_SETS = [
  ['#ff4d6d', '#ffb3c1', '#ffffff'], ['#4db8ff', '#b5e9ff', '#ffffff'], ['#ffd84d', '#fff2a8', '#ff9a3d'],
  ['#5fdc7a', '#c8ffd6', '#ffffff'], ['#9b6bff', '#e0c8ff', '#ff9ec4'], RAINBOW,
];

function fireworkBoom(x, y, player){
  const cols = pickOne(FIREWORK_SETS);
  const kind = pickOne(['ball', 'ball', 'ring', 'heart', 'willow']);
  const n = kind === 'willow' ? 26 : 34;
  for (let i = 0; i < n; i++){
    const ang = (i / n) * Math.PI * 2 + rnd(-0.08, 0.08);
    let sp = kind === 'ring' ? 105 : rnd(45, 115), vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp;
    if (kind === 'heart'){
      const t = ang, hx = 16 * Math.pow(Math.sin(t), 3), hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      vx = hx * 6; vy = hy * 6;
    }
    fxSpawn({ x, y, vx, vy, ay: kind === 'willow' ? -35 : -45, drag: kind === 'willow' ? 0.9 : 1.6,
      life: kind === 'willow' ? rnd(1600, 2200) : rnd(900, 1400), size: 1,
      colors: kind === 'willow' ? [MP.goldL, MP.gold, MP.goldD] : cols, cycle: 140, twinkle: Math.random() < 0.4,
      shape: Math.random() < 0.18 ? 'plus' : 'sq', layer: 'back' });
  }
  fxSpawn({ x, y, life: 160, shape: 'star', size: 2, color: '#ffffff', layer: 'back' });
  magicFlash(cols[0], 300, isNightMode() ? 0.22 : 0.12);
  if (player){
    magicTone(rnd(70, 95), 280, 'sawtooth', 0.08);
    for (let j = 0; j < 5; j++) magicTone(rnd(2400, 3600), 25, 'square', 0.025, audioNow() + 0.12 + j * 0.06);
  }
}
function launchRocket(rt, i, player){
  if (rt.removed) return;
  const k = furniK(), fw = floorWidth(), fh = floorHeight();
  const x0 = rtPx(rt, [-4, 0, 4][i % 3]), y0 = 11 * k;
  const H = rnd(0.5, 0.82) * fh, tx = Math.min(fw - 20, Math.max(20, x0 + rnd(-0.25, 0.25) * fw));
  const ms = rnd(850, 1150);
  if (player) magicTone(rnd(700, 900), ms * 0.8, 'sine', 0.03);
  fxSpawn({ x: x0, y: y0, vx: (tx - x0) / (ms / 1000), vy: (H - y0) / (ms / 1000), life: ms, size: 1, color: MP.goldL, fade: false, layer: 'back',
    emit: p => { if (Math.random() < 0.8) fxSpawn({ x: p.x + rnd(-1, 1), y: p.y - 2, vy: -rnd(10, 30), life: 380, color: pickOne([MP.gold, FP.orange, '#ffffff']), layer: 'back' }); },
    onDie: p => fireworkBoom(p.x, p.y, player) });
}
/* El show: n cohetes, en cola (rt.queue, con la hora de cada uno). */
function fireworksShow(rt, n, delay, player){
  const now = performance.now();
  rt.queue = Array.from({ length: n }, (_, i) => ({ at: now + delay + i * rnd(550, 800), i, player }));
  rt.litUntil = now + delay;
}
function fireworkSteps(f, player){
  return [
    { go: f.x(-11) },
    { anim: 'pet', ms: 600, dir: 1, start: rt => fireworksShow(rt, 6, 1300, player) },
    { go: f.x(-40), speed: 0.3, anim: 'walk' },
    { anim: 'sad', ms: 700, dir: 1, fx: ['🙉'] },
    { anim: 'happy', ms: 4400, dir: 1, fx: ['😮', '🎆', '✨'], fxEvery: 900 },
    { anim: 'celebrate', ms: 1000, fx: ['🎉'] },
  ];
}

const FUEGOS_ART = { w: 16, h: 12, keep: ['queue', 'litUntil'],
  init: rt => { rt.queue = []; rt.litUntil = 0; },
  tick: (rt, now) => {
    if (!rt.queue || !rt.queue.length) return;
    while (rt.queue.length && now >= rt.queue[0].at){ const q = rt.queue.shift(); launchRocket(rt, q.i, q.player); }
  },
  tap: rt => { magicGo(rt, f => fireworkSteps(f, true)); return true; },
  parts: [
    { id: 'box', draw: p => {
      p.box(1, 6, 14, 6, FP.red, FP.redL);
      p.r(2, 8, 12, 1, MP.gold); p.r(2, 10, 12, 1, MP.gold);
      for (const x of [3, 7, 11]){ p.box(x, 1, 3, 6, FP.dark); p.r(x + 1, 1, 1, 1, '#5a5070'); }
      p.r(0, 9, 2, 1, FP.rope); p.r(0, 10, 1, 1, FP.rope);
    } },
    { id: 'spark', show: (rt, now) => now < rt.litUntil && Math.floor(now / 70) % 2 === 0, draw: p => {
      p.r(0, 9, 1, 1, '#ffffff'); p.r(0, 8, 1, 1, MP.gold);
    } },
  ],
  visits: [ f => fireworkSteps(f, false) ],
  duos: [
    f => ({
      a: [{ go: f.x(-11) }, S.sync('in'), { anim: 'pet', ms: 600, dir: 1, start: rt => fireworksShow(rt, 7, 1300, false) },
        { go: f.x(-40), speed: 0.3 }, S.sync('watch'), { anim: 'happy', ms: 5200, dir: 1, fx: ['😮', '🎆'], fxEvery: 1100 },
        S.sync('end'), S.happy(900, { dir: 'partner', fx: ['💖'] })],
      b: [{ go: f.x(-52) }, S.sync('in', { dir: 1 }), S.sync('watch', { dir: 1 }), { anim: 'celebrate', ms: 5200, dir: 1, fx: ['🎆', '✨'], fxEvery: 1100 },
        S.sync('end'), S.happy(900, { dir: 'partner', fx: ['😆'] })],
    }),
  ] };

/* ===================== 11. Prisma =====================
   Lo toca, un rayo de luz lo atraviesa y sale un arcoíris de verdad (seis
   bandas de pixel) que cruza la pieza. Se sube por el arcoíris, llega
   arriba y se tira de guata hasta el otro lado, dejando chispas. */
function rainbowFor(rt){
  const fw = floorWidth(), fh = floorHeight(), k = furniK();
  const x0 = rtPx(rt, 0), y0 = 14 * k;
  const x1 = rt.x < 0.5 ? fw * 0.88 : fw * 0.12;
  const H = Math.min(fh * 0.5, Math.abs(x1 - x0) * 0.42) + 6 * k;
  const P = t => ({ x: x0 + (x1 - x0) * t, y: y0 * (1 - t) + H * Math.sin(Math.PI * t) });
  return { x0, x1, y0, H, P };
}
function rainbowOn(rt, ms){
  if (rt.removed) return;
  const R = rainbowFor(rt);
  rt.rainbow = R; rt.rainbowUntil = performance.now() + ms;
  fxEffect({ id: 'arcoiris', layer: 'back', rt, until: rt.rainbowUntil + 900, draw: (ctx, I, now, e) => {
    const age = now - e.t0, grow = Math.min(1, age / 900);
    const fade = now > rt.rainbowUntil ? Math.max(0, 1 - (now - rt.rainbowUntil) / 900) : 1;
    ctx.globalAlpha = 0.85 * fade;
    const steps = Math.ceil(Math.abs(R.x1 - R.x0) / (I.u / DPR));
    const k = I.u / DPR;
    for (let j = 0; j <= steps * grow; j++){
      const t = j / steps, pt = R.P(t);
      for (let b = 0; b < 6; b++){
        ctx.fillStyle = RAINBOW[5 - b];
        ctx.fillRect(I.X(pt.x) - I.u / 2, I.Y(pt.y + (b + 1) * k), I.u, I.u);
      }
    }
    ctx.globalAlpha = 1;
  } });
}
/* Sube caminando por el arco hasta la cima y se tira por el otro lado. */
function rainbowRide(rt){
  const on = (t, act) => { const R = rt.rainbow, pt = R.P(t); return { x: clampX(pt.x / floorWidth()), y: pt.y + 6 * furniK() }; };
  return [
    { hop: (a, act) => on(0.04, act), ms: 450, h: 10 },
    { anim: 'walk', ms: 2100, track: (r, el, act) => { const p = on(0.04 + 0.46 * Math.min(1, el / 2100), act); act.dir = rt.rainbow.x1 > rt.rainbow.x0 ? 1 : -1; return p; } },
    { anim: 'celebrate', ms: 700, fx: ['🌈'] },
    { anim: 'happy', ms: 1000, track: (r, el, act) => {
      const u = Math.min(1, el / 1000), p = on(0.5 + 0.5 * u * u, act);
      if (Math.random() < 0.6) fxSpawn({ x: p.x * floorWidth(), y: p.y + 4, vx: rnd(-20, 20), vy: rnd(-10, 20), life: 500,
        shape: 'plus', colors: RAINBOW, cycle: 90, layer: 'back' });
      return p;
    } },
    LAND,
    { anim: 'celebrate', ms: 900, fx: ['🌟', '😆'] },
  ];
}

const PRISMA_ART = { w: 12, h: 16, keep: ['rainbow', 'rainbowUntil'],
  init: rt => { rt.rainbow = null; rt.rainbowUntil = 0; },
  parts: [
    { id: 'stand', draw: p => {
      p.box(2, 13, 8, 3, FP.woodD, FP.wood); p.r(5, 11, 2, 2, FP.woodD);
    } },
    { id: 'prism', draw: p => {
      for (let y = 0; y < 10; y++){ const half = Math.floor(y / 2) + 1; p.span(1 + y, 6 - half, 5 + half, y < 3 ? '#ffffff' : '#cdeeff'); }
      p.r(1, 10, 10, 1, FP.O);
      p.r(5, 3, 1, 5, '#ffffff'); p.r(7, 6, 1, 3, '#a8dcff');
    } },
    { id: 'glint', show: (rt, now) => now < rt.rainbowUntil || Math.floor(now / 1700) % 5 === 0, draw: p => {
      p.r(6, 1, 1, 1, '#ffffff'); p.r(5, 2, 3, 1, '#fff7c0'); p.r(6, 3, 1, 1, '#ffffff');
    } },
  ],
  visits: [
    f => [
      { go: f.x(-9) },
      { anim: 'pet', ms: 600, dir: 1, start: rt => rainbowOn(rt, 7200), fx: ['✨'] },
      S.wait(700, 'idle', { fx: ['😮'] }),
      ...rainbowRide(f.rt),
      S.happy(700),
    ],
  ],
  /* Se tiran uno después del otro. */
  duos: [
    f => ({
      a: [{ go: f.x(-9) }, S.sync('in'), { anim: 'pet', ms: 600, dir: 1, start: rt => rainbowOn(rt, 9500) },
        ...rainbowRide(f.rt), S.sync('a-down'), S.sync('b-down'), S.happy(800, { dir: 'partner', fx: ['😆'] })],
      b: [{ go: f.x(-22) }, S.sync('in', { dir: 1 }), S.sync('a-down'), ...rainbowRide(f.rt), S.sync('b-down'),
        S.happy(800, { dir: 'partner', fx: ['🌈'] })],
    }),
  ] };

/* ===================== 12. Planetario =====================
   Prendido, apaga la luz de la pieza (no la de los personajes) y llena
   todo de estrellas que giran despacito alrededor del proyector, con un par
   de constelaciones dibujadas y una que otra estrella fugaz. La mascota se
   tira de espaldas a mirarlas. Tocarlo lo prende o lo apaga. */
function planetarioOn(rt, ms){
  if (rt.removed) return;
  rt.onUntil = performance.now() + ms;
  if (!rt.stars){
    rt.stars = Array.from({ length: 40 }, () => ({ a: rnd(0, Math.PI * 2), r: rnd(0.35, 1.25), tw: rnd(0, 6), big: Math.random() < 0.12,
      c: pickOne(['#ffffff', '#ffffff', '#fff2b0', '#b8dcff']) }));
    /* Constelaciones: estrellas juntitas (mismo ángulo y radio, con poco
       corrimiento), unidas por líneas tenues. */
    rt.groups = [];
    for (let g = 0; g < 3; g++){
      const a0 = rnd(0, Math.PI * 2), r0 = rnd(0.55, 1.05), ids = [];
      for (let j = 0; j < 4 + (g % 2); j++){
        ids.push(rt.stars.length);
        rt.stars.push({ a: a0 + rnd(-0.11, 0.11) + j * 0.05, r: r0 + rnd(-0.09, 0.09), tw: rnd(0, 6), big: j === 0, c: '#ffffff' });
      }
      rt.groups.push(ids);
    }
  }
  fxEffect({ id: 'estrellas', layer: 'back', rt, done: now => now > rt.onUntil, draw: (ctx, I, now) => {
    const fw = I.fw, fh = I.fh, cx = rt.x * fw, cy = -fh * 0.25, R = fh * 1.05;
    const rot = now / 1000 * 0.025;
    const pos = rt.stars.map(st => ({ x: cx + Math.cos(st.a + rot) * st.r * R, y: cy + Math.sin(st.a + rot) * st.r * R, st }));
    ctx.globalAlpha = 0.28;
    for (const g of rt.groups) for (let i = 1; i < g.length; i++){
      const a = pos[g[i - 1]], b = pos[g[i]];
      if (a.y > 8 && b.y > 8 && Math.hypot(a.x - b.x, a.y - b.y) < 70) drawPxLine(ctx, I, a.x, a.y, b.x, b.y, '#b8dcff');
    }
    for (const p of pos){
      if (p.y < 6 || p.x < 0 || p.x > fw) continue;
      ctx.globalAlpha = 0.55 + 0.45 * Math.sin(now / 400 + p.st.tw);
      drawShape(ctx, I, p.st.big ? 'plus' : 'sq', p.x, p.y, 1, p.st.c);
    }
    ctx.globalAlpha = 1;
  } });
}

const PLANETARIO_ART = { w: 16, h: 14, keep: ['onUntil', 'stars', 'groups', 'shootAt'],
  init: rt => { rt.onUntil = 0; rt.shootAt = 0; },
  tick: (rt, now) => {
    const on = now < rt.onUntil;
    setAmbient('planetario', on ? 'rgba(6,8,34,.66)' : null, rt);
    if (on && now > rt.shootAt){
      rt.shootAt = now + rnd(1800, 4200);
      const fw = floorWidth(), fh = floorHeight();
      fxSpawn({ x: rnd(0.1, 0.9) * fw, y: rnd(0.6, 0.9) * fh, vx: rnd(-160, 160), vy: -rnd(60, 110), life: 700, color: '#ffffff', layer: 'back',
        emit: p => fxSpawn({ x: p.x, y: p.y, life: 260, color: '#b8dcff', layer: 'back' }) });
    }
  },
  cleanup: () => {},
  tap: rt => {
    if (performance.now() < rt.onUntil){ rt.onUntil = 0; return true; }
    planetarioOn(rt, 30000);
    if (!furniCommandBlocked() && !walkerBusy()){
      magicGo(rt, f => [{ go: f.x(14) }, { anim: 'sleep', ms: 6000, fx: ['✨', '⭐', '😮'], fxEvery: 1500 }, { anim: 'pet', ms: 1200, fx: ['🌠'] }, S.happy(800)]);
    }
    return true;
  },
  parts: [
    { id: 'base', draw: p => {
      p.box(2, 9, 12, 5, '#2a2f6a', '#3d4590'); p.r(4, 11, 1, 1, MP.gold); p.r(8, 12, 1, 1, '#ffffff'); p.r(11, 11, 1, 1, MP.gold);
    } },
    { id: 'dome', draw: p => {
      p.disc(8, 9, 6.6, (x, y) => y < 5 ? '#4652a8' : '#363f8c');
      p.r(1, 9, 15, 1, FP.O);
    } },
    ...[0, 1].map(ph => ({ id: 'holes' + ph, show: (rt, now) => now >= rt.onUntil ? ph === 0 : Math.floor(now / 380) % 2 === ph,
      draw: p => {
        const pts = ph ? [[6, 5], [10, 4], [8, 7], [4, 7], [12, 7]] : [[7, 4], [9, 6], [5, 6], [11, 5], [8, 3]];
        for (const [x, y] of pts) p.r(x, y, 1, 1, ph ? '#fff2b0' : '#ffffff');
      } })),
  ],
  visits: [
    f => [
      { go: f.x(11) },
      { anim: 'pet', ms: 500, dir: -1, end: rt => planetarioOn(rt, 11000) },
      { go: f.x(26) },
      { anim: 'sleep', ms: 6000, fx: ['✨', '⭐'], fxEvery: 1600 },
      { anim: 'pet', ms: 1000, fx: ['🌠'] },
      S.happy(800, { fx: ['😮'] }),
    ],
  ],
  duos: [
    f => ({
      a: [{ go: f.x(11) }, { anim: 'pet', ms: 500, dir: -1, end: rt => planetarioOn(rt, 12000) }, { go: f.x(24) }, S.sync('lie'),
        { anim: 'sleep', ms: 6500, fx: ['⭐'], fxEvery: 1800 }, S.sync('end'), S.happy(800, { dir: 'partner' })],
      b: [{ go: f.x(36) }, S.sync('lie'), { anim: 'sleep', ms: 4000 }, { anim: 'pet', ms: 2500, fx: ['🌠', '😮'], fxEvery: 1100 },
        S.sync('end'), S.happy(800, { dir: 'partner', fx: ['💖'] })],
    }),
  ] };

/* ===================== 13. Máquina de nieve =====================
   Nieva en toda la pieza; la nieve se va juntando en el piso (una capa de
   pixeles blancos que después se derrite) y la mascota arma un mono de
   nieve al lado de la máquina, que dura un rato. De a dos: guerra de bolas. */
const SNOW = { cols: null, w: 0, lastSnowAt: 0, lastDraw: 0 };
const SNOWMAN_MS = 90000;

function snowLayer(){
  const n = Math.ceil(floorWidth() / furniK()) + 2;
  if (!SNOW.cols || SNOW.w !== n){ SNOW.cols = new Float32Array(n); SNOW.w = n; }
  if (!fxEffectOn('nieve-piso')){
    fxEffect({ id: 'nieve-piso', layer: 'back', done: () => !SNOW.cols.some(h => h > 0.05), draw: (ctx, I, now) => {
      const k = I.u / DPR;
      /* Se derrite sola cuando deja de nevar (aunque se saque la máquina). */
      const dtm = Math.min(200, now - (SNOW.lastDraw || now));
      SNOW.lastDraw = now;
      if (now - SNOW.lastSnowAt > 400) for (let i = 0; i < SNOW.w; i++) SNOW.cols[i] = Math.max(0, SNOW.cols[i] - 0.14 * dtm / 1000);
      for (let i = 0; i < SNOW.w; i++){
        const h = Math.floor(SNOW.cols[i]);
        for (let j = 0; j < h; j++){
          ctx.fillStyle = j === h - 1 ? '#ffffff' : '#dcefff';
          ctx.fillRect(I.X(i * k), I.Y((j + 1) * k), I.u, I.u);
        }
      }
    } });
  }
}
function snowOn(rt, ms){ if (!rt.removed){ rt.snowUntil = performance.now() + ms; snowLayer(); } }
function throwSnowball(from, to){
  const fw = floorWidth(), x0 = from.x * fw + from.dir * 10, y0 = actorCssH(from) * 0.6;
  const x1 = to.x * fw, y1 = actorCssH(to) * 0.55, T = 0.6, g = 200;
  fxSpawn({ x: x0, y: y0, vx: (x1 - x0) / T, vy: (y1 - y0 + 0.5 * g * T * T) / T, ay: -g, life: T * 1000, shape: 'big', color: '#ffffff',
    fade: false, layer: 'front', onDie: p => fxBurst(p.x, p.y, 9, { colors: ['#ffffff', MP.ice], speed: 55, life: 450, ay: -150 }) });
}

const NIEVE_ART = { w: 32, h: 21, keep: ['snowUntil', 'snowman', 'snowmanUntil'],
  init: rt => { rt.snowUntil = 0; rt.snowman = 0; rt.snowmanUntil = 0; rt.flakeAt = 0; rt.fan = 0; },
  tick: (rt, now, dt) => {
    if (rt.snowman && now > rt.snowmanUntil){
      rt.snowman = 0;
      fxBurst(rtPx(rt, 9), 8 * furniK(), 12, { colors: ['#ffffff', MP.ice], speed: 40, life: 600, ay: -60 });
    }
    const on = now < rt.snowUntil;
    if (on){ rt.fan += dt * 14; SNOW.lastSnowAt = now; }
    if (!on || now - rt.flakeAt < 30) return;
    rt.flakeAt = now;
    const fw = floorWidth(), fh = floorHeight(), k = furniK();
    fxSpawn({ x: rnd(0, fw), y: fh * rnd(0.55, 1), vx: rnd(-6, 6), vy: -rnd(38, 60), wob: rnd(10, 26), wobF: rnd(1.5, 3), life: 14000,
      shape: Math.random() < 0.08 ? 'flake' : Math.random() < 0.3 ? 'plus' : 'sq', colors: ['#ffffff', MP.snow, MP.ice], cycle: 500,
      fade: false, layer: 'front', floor: 'die', onFloor: p => {
        if (!SNOW.cols) return;
        const i = Math.max(0, Math.min(SNOW.w - 1, Math.round(p.x / k)));
        SNOW.cols[i] = Math.min(4, SNOW.cols[i] + 0.45);
        if (i > 0) SNOW.cols[i - 1] = Math.min(4, SNOW.cols[i - 1] + 0.2);
        if (i < SNOW.w - 1) SNOW.cols[i + 1] = Math.min(4, SNOW.cols[i + 1] + 0.2);
      } });
  },
  tap: rt => {
    snowOn(rt, 14000);
    if (!furniCommandBlocked() && !walkerBusy()) magicGo(rt, f => snowSteps(f).slice(2));
    return true;
  },
  parts: [
    { id: 'machine', draw: p => {
      p.box(0, 8, 16, 13, '#dceeff', '#ffffff');
      p.r(1, 19, 14, 1, '#b5cfe8');
      p.box(10, 4, 4, 5, FP.metal, FP.whiteL);
      p.r(3, 17, 2, 1, FP.blueD); p.r(6, 17, 1, 1, MP.mint);
    } },
    { id: 'fan', pivot: [8, 13], pose: rt => ({ r: rt.fan }), draw: p => {
      p.disc(8, 13, 3.6, '#7fb0e0'); p.r(8, 10, 1, 7, '#ffffff'); p.r(5, 13, 7, 1, '#ffffff'); p.r(8, 13, 1, 1, FP.O);
    } },
    { id: 'sm1', show: rt => rt.snowman >= 1, draw: p => { p.disc(25, 16.5, 4.4, (x, y) => y > 18 ? '#dcefff' : '#ffffff'); } },
    { id: 'sm2', show: rt => rt.snowman >= 2, draw: p => {
      p.disc(25, 10.5, 3.5, '#ffffff'); p.r(25, 9, 1, 1, FP.O); p.r(25, 11, 1, 1, FP.O);
      p.line(22, 10, 19, 7, MP.bark); p.line(28, 10, 31, 7, MP.bark);
    } },
    { id: 'sm3', show: rt => rt.snowman >= 3, draw: p => {
      p.disc(25, 5, 2.9, '#ffffff'); p.r(24, 4, 1, 1, FP.O); p.r(26, 4, 1, 1, FP.O); p.r(25, 5, 2, 1, FP.orange);
      p.r(22, 2, 7, 1, FP.redD); p.r(23, 0, 5, 2, FP.red);
    } },
  ],
  visits: [ f => snowSteps(f) ],
  /* Guerra de bolas de nieve. */
  duos: [
    f => {
      const throwStep = (who) => ({ anim: 'pet', ms: 450, dir: 'partner', start: (rt, act, a) => throwSnowball(act, a.partner) });
      return {
        a: [{ go: f.x(-12) }, { anim: 'pet', ms: 400, dir: 1, start: rt => snowOn(rt, 12000) }, { go: f.x(-46) }, S.sync('ready', { dir: 'partner' }),
          throwStep(), S.sync('a1'), S.sync('b1'), { anim: 'sad', ms: 500, fx: ['❄️'] }, throwStep(), S.sync('a2'), S.sync('b2'),
          { anim: 'sad', ms: 500 }, S.happy(1400, { dir: 'partner', fx: ['😂'], fxEvery: 700 }), S.sync('end')],
        b: [{ go: f.x(26) }, S.sync('ready', { dir: 'partner' }), S.sync('a1'), { anim: 'sad', ms: 500, fx: ['❄️'] }, throwStep(), S.sync('b1'),
          S.sync('a2'), { anim: 'sad', ms: 500 }, throwStep(), S.sync('b2'), S.happy(1400, { dir: 'partner', fx: ['😆'], fxEvery: 700 }), S.sync('end')],
      };
    },
  ] };
function snowSteps(f){
  return [
    { go: f.x(-12) },
    { anim: 'pet', ms: 500, dir: 1, start: rt => snowOn(rt, 13000) },
    { anim: 'eat', ms: 1800, flip: 600, fx: ['❄️', '😋'], fxEvery: 700 },
    { go: f.x(19) },
    ...[1, 2, 3].map(n => ({ anim: 'clean', ms: 900, dir: 1, end: rt => {
      rt.snowman = n; rt.snowmanUntil = performance.now() + SNOWMAN_MS;
      fxBurst(rtPx(rt, 9), (4 + n * 4) * furniK(), 6, { colors: ['#ffffff'], speed: 35, life: 400, ay: -80 });
    } })),
    { anim: 'celebrate', ms: 1000, dir: 1, fx: ['⛄', '🌟'] },
    S.happy(700),
  ];
}

/* ===================== 14. Lámpara de lava =====================
   Siempre prendida: tiñe la pieza de un resplandor suave del color de su
   lava, que en modo automático sigue su ánimo (rosado feliz, ámbar normal,
   azul triste, verde enfermo, violeta con sueño). Tocarla cambia el modo
   (automático, rosa, azul, verde, arcoíris). Adentro, las burbujas de lava
   suben y bajan. */
const LAVA_COLORS = {
  rosa:    { liq: '#ff5fa2', blob: '#ffd0e4', rgb: '255,95,162' },
  ambar:   { liq: '#ff8a2a', blob: '#ffe08a', rgb: '255,150,60' },
  azul:    { liq: '#3f7dff', blob: '#9fd0ff', rgb: '70,130,255' },
  verde:   { liq: '#2fbf6a', blob: '#b6ffcf', rgb: '60,210,120' },
  violeta: { liq: '#8a4dff', blob: '#e0c8ff', rgb: '150,90,255' },
};
const LAVA_MODES = ['auto', 'rosa', 'azul', 'verde', 'arcoiris'];
const LAVA_MODE_NAMES = { auto: 'Según su ánimo', rosa: 'Rosa', azul: 'Azul', verde: 'Verde', arcoiris: 'Arcoíris' };
function lavaColor(now = performance.now()){
  const mode = objData('lava').mode || 'auto';
  if (mode === 'arcoiris') return Object.keys(LAVA_COLORS)[Math.floor(now / 2200) % 5];
  if (mode !== 'auto') return mode;
  const mood = displayMood();
  return mood === 'happy' ? 'rosa' : mood === 'sad' ? 'azul' : mood === 'sick' ? 'verde' : mood === 'sleepy' ? 'violeta' : 'ambar';
}

const LAVA_ART = { w: 10, h: 24,
  tick: (rt, now) => {
    const c = LAVA_COLORS[lavaColor(now)], k = furniK();
    const a = (isNightMode() ? 0.4 : 0.26) + 0.06 * Math.sin(now / 900);
    setAmbient('lava', displayMood() === 'dead' ? null : glowAt(rtPx(rt, 0), 12 * k, `rgba(${c.rgb},${a.toFixed(2)})`, 150), rt);
  },
  tap: rt => {
    const d = objData('lava');
    d.mode = LAVA_MODES[(LAVA_MODES.indexOf(d.mode || 'auto') + 1) % LAVA_MODES.length];
    saveState();
    say(`💡 Lámpara: ${LAVA_MODE_NAMES[d.mode]}`);
    return true;
  },
  parts: [
    { id: 'base', draw: p => {
      p.span(19, 1, 8, FP.metal); p.span(20, 1, 8, FP.metalD); p.span(21, 0, 9, FP.metalD); p.span(22, 0, 9, FP.metalD); p.r(0, 23, 10, 1, FP.O);
      p.span(0, 3, 6, FP.metal); p.span(1, 3, 6, FP.metalD);
    } },
    ...Object.entries(LAVA_COLORS).flatMap(([key, c]) => [
      { id: 'liq-' + key, show: (rt, now) => lavaColor(now) === key, draw: p => {
        for (let y = 2; y <= 18; y++){ const w = y < 5 || y > 15 ? 2 : 3; p.span(y, 5 - w, 4 + w, c.liq); }
        p.r(3, 4, 1, 12, 'rgba(255,255,255,.35)');
      } },
      ...[0, 1, 2].map(b => ({ id: `blob-${key}-${b}`, show: (rt, now) => lavaColor(now) === key, pivot: [5, 10],
        pose: (rt, now, k) => {
          const per = [5200, 7300, 6100][b], t = (now + b * 1900) % per / per;
          return { y: (Math.sin(t * Math.PI * 2) * 4.5 + [2, -2, 0][b]) * k, sx: 1 + Math.sin(now / 500 + b) * 0.08, sy: 1 - Math.sin(now / 500 + b) * 0.08 };
        }, draw: p => { const x = [4, 5, 5][b], y = [12, 8, 10][b]; p.r(x, y, 2, 2, c.blob); p.r(x - (b === 2 ? 1 : 0), y + 1, 1, 1, c.blob); } })),
    ]),
  ],
  visits: [
    f => [
      { go: f.x(-9) },
      { anim: 'idle', ms: 3200, dir: 1, fx: ['😌', '✨'], fxEvery: 1100 },
      S.dance(3600, 900, { fx: ['🎶'], fxEvery: 1200 }),
      S.happy(700),
    ],
  ],
  duos: [
    f => ({
      a: [{ go: f.x(-10) }, S.sync('in', { dir: 1 }), S.dance(4200, 1000, { fx: ['😌'], fxEvery: 1500 }), S.sync('end'), S.happy(700, { dir: 'partner' })],
      b: [{ go: f.x(10) }, S.sync('in', { dir: -1 }), S.dance(4200, 1000, { fx: ['🎶'], fxEvery: 1500 }), S.sync('end'), S.happy(700, { dir: 'partner' })],
    }),
  ] };

/* ===================== 15. Portal =====================
   Un arco de piedra con un remolino adentro. Se mete y aparece por otro
   portal que se abre en el aire, en otra parte de la pieza, y cae. Si hay
   más de una habitación y lo pide quien juega (tocarlo), aparece en la
   siguiente habitación. */
function portalExit(x, y){
  const now = performance.now();
  fxEffect({ id: 'portal-salida', layer: 'back', until: now + 1700, draw: (ctx, I, t, e) => {
    const age = t - e.t0, s = age < 300 ? age / 300 : age > 1300 ? Math.max(0, 1 - (age - 1300) / 400) : 1;
    for (let r = 1; r <= 4; r++){
      const rr = r * 1.6 * s;
      if (rr < 0.8) continue;
      drawRing(ctx, I, x, y, rr, [MP.violet, MP.sky, FP.pink, MP.violetL][(r + Math.floor(t / 90)) % 4]);
    }
  } });
  for (let i = 0; i < 14; i++) fxSpawn({ x, y, vx: rnd(-60, 60), vy: rnd(-60, 60), drag: 2, life: 700, shape: 'plus',
    colors: [MP.violetL, MP.sky, '#ffffff'], cycle: 100, layer: 'back' });
}
function portalSuck(rt){
  const k = furniK(), cx = rtPx(rt, 0), cy = 14 * k;
  for (let i = 0; i < 16; i++){
    const ang = rnd(0, 6.28), r = rnd(20, 34);
    fxSpawn({ x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r, vx: -Math.cos(ang) * r * 2.2, vy: -Math.sin(ang) * r * 2.2,
      life: 450, shape: 'sq', colors: [MP.violetL, MP.sky, '#ffffff'], cycle: 90, layer: 'front' });
  }
}
/* Entra al portal y sale por otro en el aire, en `ex` (fracción del piso). */
function portalSteps(f, travel){
  const exitAt = () => { const ex = f.rt.x < 0.5 ? rnd(0.62, 0.88) : rnd(0.12, 0.38); return { x: ex, y: floorHeight() * rnd(0.45, 0.62) }; };
  let E = null;
  return [
    { go: f.x(-16) },
    S.wait(600, 'idle', { dir: 1, fx: ['😮'] }),
    { go: f.x(0), speed: 0.08, anim: 'walk', end: rt => portalSuck(rt) },
    { anim: 'idle', ms: 500, hide: true, start: rt => { rt.spinFast = performance.now() + 900; } },
    travel ? { call: () => portalTravel() } : { anim: 'idle', ms: 700, hide: true, start: (rt, act) => { E = exitAt(); portalExit(E.x * floorWidth(), E.y); act.x = E.x; act.y = E.y; } },
    { anim: 'idle', ms: 150, hide: true },
    { hop: (a, act) => ({ x: clampX(act.x + (E && E.x > 0.5 ? -0.05 : 0.05)), y: 0 }), ms: 750, h: 14, hide: false, anim: 'celebrate' },
    { anim: 'sick', ms: 900, fx: ['💫'] },
    S.happy(800, { fx: ['😆'] }),
  ];
}
/* Viaje a la habitación siguiente: cambia de pieza y la mascota sale de un
   portal en el aire de la otra. */
function portalTravel(){
  goRoom(1);
  const ex = rnd(0.3, 0.7), ey = floorHeight() * 0.55;
  walker.x = ex; walker.y = ey; walker.hidden = true;
  startActivity(walker, [
    { anim: 'idle', ms: 650, hide: true, start: () => portalExit(ex * floorWidth(), ey) },
    { hop: { x: clampX(ex + 0.05), y: 0 }, ms: 750, h: 14, hide: false, anim: 'celebrate' },
    { anim: 'sick', ms: 900, fx: ['💫'] },
    S.happy(800, { fx: ['😆'] }),
  ], { kind: 'enter' });
}

const PORTAL_ART = { w: 20, h: 30,
  init: rt => { rt.spinFast = 0; },
  tap: rt => {
    const travel = state.style.rooms.length > 1;
    magicGo(rt, f => portalSteps(f, travel));
    return true;
  },
  parts: [
    { id: 'arch', draw: p => {
      const stone = (x, y) => ((x * 5 + y * 3) % 7 === 0 ? '#a7a3b6' : (x + y) % 2 ? '#8b869c' : '#958fa6');
      for (let y = 0; y < 30; y++){
        for (let x = 0; x < 20; x++){
          const dx = x - 9.5, dy = y - 12;
          const out = y >= 12 ? Math.abs(dx) <= 9.5 : Math.hypot(dx, dy) <= 9.5;
          const inn = y >= 12 ? Math.abs(dx) <= 6.5 && y < 29 : Math.hypot(dx, dy) <= 6.5;
          if (out && !inn) p.r(x, y, 1, 1, stone(x, y));
        }
      }
      p.r(0, 29, 20, 1, FP.O);
    } },
    { id: 'void', draw: p => {
      for (let y = 6; y < 29; y++) for (let x = 3; x < 17; x++){
        const dx = x - 9.5, dy = y - 12;
        if (y >= 12 ? Math.abs(dx) <= 6.5 : Math.hypot(dx, dy) <= 6.5) p.r(x, y, 1, 1, '#1a1040');
      }
    } },
    ...[0, 1, 2].map(i => ({ id: 'swirl' + i, pivot: [10, 17], pose: (rt, now) => ({ r: (now / 1000) * (i % 2 ? -1 : 1) * (now < rt.spinFast ? 9 : 1.6 + i * 0.6) }),
      draw: p => {
        const col = [MP.violet, MP.sky, FP.pink][i], rad = [5.4, 3.8, 2.2][i];
        for (let a = 0; a < 5.6; a += 0.22){
          const r = rad * (0.55 + a / 12);
          p.r(Math.round(10 + Math.cos(a + i * 2) * r), Math.round(17 + Math.sin(a + i * 2) * r), 1, 1, col);
        }
      } })),
  ],
  visits: [ f => portalSteps(f, false) ],
  /* Entran uno detrás del otro y salen por el mismo portal en el aire. */
  duos: [
    f => {
      const fw = () => floorWidth();
      return {
        a: [{ go: f.x(-16) }, S.sync('in'), { go: f.x(0), speed: 0.08, end: rt => portalSuck(rt) }, { anim: 'idle', ms: 400, hide: true },
          S.sync('a-in', { hide: true }), S.sync('b-in', { hide: true }),
          { anim: 'idle', ms: 500, hide: true, start: (rt, act, a) => {
            const ex = f.rt.x < 0.5 ? 0.75 : 0.25, ey = floorHeight() * 0.55;
            a.duo.data.ex = ex; a.duo.data.ey = ey; portalExit(ex * fw(), ey); act.x = ex; act.y = ey;
          } },
          { hop: (a, act) => ({ x: clampX(act.x - 0.05), y: 0 }), ms: 750, h: 14, hide: false, anim: 'celebrate' }, S.sync('a-out'),
          { anim: 'sick', ms: 800, fx: ['💫'] }, S.sync('end'), S.happy(800, { dir: 'partner', fx: ['😆'] })],
        b: [{ go: f.x(-30) }, S.sync('in', { dir: 1 }), S.sync('a-in', { dir: 1, fx: ['😮'] }), { go: f.x(0), speed: 0.09 },
          { anim: 'idle', ms: 300, hide: true }, S.sync('b-in', { hide: true }), S.sync('a-out', { hide: true }),
          { anim: 'idle', ms: 200, hide: true, start: (rt, act, a) => { act.x = a.duo.data.ex || 0.5; act.y = a.duo.data.ey || 60; } },
          { hop: (a, act) => ({ x: clampX(act.x + 0.05), y: 0 }), ms: 750, h: 14, hide: false, anim: 'celebrate' },
          { anim: 'sick', ms: 800, fx: ['💫'] }, S.sync('end'), S.happy(800, { dir: 'partner' })],
      };
    },
  ] };


/* ===================== 16. Caja musical =====================
   Le da cuerda y la bailarina gira. Tocarla toca una melodía de verdad
   (Web Audio): de día "Estrellita", de noche o con sueño la canción de
   cuna de Brahms, y al terminar la cuna, si tiene algo de sueño, se queda
   dormida. Las notas salen volando de la caja, una por nota. Sola (visita
   espontánea) baila sin sonido: el sonido es solo cuando lo pide quien juega. */
const NOTE_FREQ = { C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5 };
const MELODIES = {
  estrellita: { beat: 340, notes: [['C5', 1], ['C5', 1], ['G5', 1], ['G5', 1], ['A5', 1], ['A5', 1], ['G5', 2],
    ['F5', 1], ['F5', 1], ['E5', 1], ['E5', 1], ['D5', 1], ['D5', 1], ['C5', 2]] },
  cuna: { beat: 420, notes: [['E5', 1], ['E5', 1], ['G5', 3], ['E5', 1], ['E5', 1], ['G5', 3], ['E5', 1], ['G5', 1],
    ['C6', 2], ['B5', 2], ['A5', 2], ['A5', 2], ['G5', 3]] },
};
function melodyMs(key){ const m = MELODIES[key]; return m.notes.reduce((t, n) => t + n[1] * m.beat, 0); }
function musicPlay(rt, key, sound){
  if (rt.removed) return;
  const m = MELODIES[key], now = performance.now(), t0 = audioNow() + 0.05;
  let t = 0;
  rt.noteQueue = m.notes.map(([n, d]) => {
    const at = t; t += d * m.beat;
    if (sound){
      magicTone(NOTE_FREQ[n], Math.min(900, d * m.beat + 300), 'triangle', 0.09, t0 + at / 1000);
      magicTone(NOTE_FREQ[n] * 2, 260, 'sine', 0.025, t0 + at / 1000);
    }
    return { at: now + at };
  });
  rt.playUntil = now + t;
}
function lullabyTime(){ return isNightMode() || state.energy < 45; }
function musicSteps(f, key, sound){
  const ms = melodyMs(key), lull = key === 'cuna';
  return [
    { go: f.x(-11) },
    { anim: 'pet', ms: 600, dir: 1, start: rt => musicPlay(rt, key, sound), fx: ['🎵'] },
    lull ? { anim: 'idle', ms, flip: 1400, fx: ['🎶', '😌', '💤'], fxEvery: 1300 }
      : S.dance(ms, MELODIES[key].beat * 2, { fx: ['🎵', '🎶'], fxEvery: 900 }),
    { anim: lull ? 'sleep' : 'celebrate', ms: 900, fx: [lull ? '😪' : '🌟'] },
  ];
}

const MUSICA_ART = { w: 14, h: 15, keep: ['noteQueue', 'playUntil'],
  init: rt => { rt.noteQueue = []; rt.playUntil = 0; },
  tick: (rt, now) => {
    while (rt.noteQueue && rt.noteQueue.length && now >= rt.noteQueue[0].at){
      rt.noteQueue.shift();
      fxSpawn({ x: rtPx(rt, rnd(-3, 3)), y: 12 * furniK(), vx: rnd(-14, 14), vy: rnd(26, 40), wob: 20, life: 1900,
        shape: 'note', color: pickOne(RAINBOW), layer: 'front' });
    }
  },
  tap: rt => {
    const key = lullabyTime() ? 'cuna' : 'estrellita';
    if (furniCommandBlocked() || walkerBusy()){
      musicPlay(rt, key, true);
      say(key === 'cuna' ? '🎶 Una canción de cuna…' : '🎶 Estrellita, ¿dónde estás?', 2200);
      return true;
    }
    const steps = musicSteps(furniHelpers(rt, walker), key, true);
    if (key === 'cuna') steps.push({ call: () => { if (!state.sleeping) btnSleep(); } });
    magicGo(rt, steps);
    return true;
  },
  parts: [
    { id: 'box', draw: p => {
      p.box(0, 3, 14, 5, '#7a3fa8', '#a46bd8');
      p.r(1, 4, 12, 3, '#efe3ff'); p.r(2, 5, 10, 1, '#c9e6ff');
      p.box(0, 8, 14, 7, FP.wood, FP.woodL);
      p.r(0, 10, 14, 1, MP.gold); p.r(6, 12, 2, 1, MP.goldD);
      p.r(13, 11, 1, 2, MP.goldD);
    } },
    { id: 'dancer', pivot: [7, 8], pose: (rt, now) => ({ sx: now < rt.playUntil ? Math.cos(now / 160) : 1 }), draw: p => {
      p.r(7, 2, 1, 1, FP.O); p.r(6, 3, 3, 1, FP.pinkL); p.r(5, 4, 5, 1, FP.pink); p.r(7, 5, 1, 2, '#ffe0c8'); p.r(7, 7, 1, 1, MP.gold);
      p.r(7, 1, 1, 1, '#ffe0c8');
    } },
  ],
  visits: [ f => musicSteps(f, 'estrellita', false) ],
  duos: [
    f => {
      const ms = melodyMs('estrellita'), beat = MELODIES.estrellita.beat;
      return {
        a: [{ go: f.x(-11) }, S.sync('in'), { anim: 'pet', ms: 600, dir: 1, start: rt => musicPlay(rt, 'estrellita', false) },
          S.sync('go'), S.dance(ms, beat * 2, { fx: ['🎵'], fxEvery: 1100 }), S.sync('end'), S.happy(800, { dir: 'partner', fx: ['💖'] })],
        b: [{ go: f.x(-34) }, S.sync('in', { dir: 1 }), S.sync('go'), { bounce: Math.floor(ms / (beat * 2)), ms: beat * 2, h: 10, dir: 'partner' },
          S.sync('end'), S.happy(800, { dir: 'partner', fx: ['🎶'] })],
      };
    },
  ] };

/* ===================== 17. Cañón de circo =====================
   Se mete en el cañón, cuenta 3-2-1 y ¡BUM!: sale volando en un arco
   enorme hacia el otro lado de la pieza, dándose vueltas y cabeza abajo
   (flipY, ver actorTransform), con estela de estrellas. Aterriza, rebota,
   queda mareada y celebra. El cañón apunta siempre al centro de la pieza. */
function canonSide(rt){ return rt.x < 0.5 ? 1 : -1; }
function canonMuzzle(rt){ return { x: rtPx(rt, 9 * canonSide(rt)), y: 13 * furniK() }; }
function canonFire(rt, player){
  const m = canonMuzzle(rt), sd = canonSide(rt);
  rt.recoilAt = performance.now();
  magicFlash('#ffb35c', 260, 0.3);
  for (let i = 0; i < 14; i++) fxSpawn({ x: m.x, y: m.y, vx: sd * rnd(20, 90) + rnd(-25, 25), vy: rnd(-10, 50), drag: 2.5, life: rnd(600, 1100),
    size: 2, colors: ['#ffffff', '#d8d8e0', '#a8a8b8'], cycle: 300, layer: 'front' });
  fxBurst(m.x, m.y, 8, { colors: [MP.gold, FP.orange, '#ffffff'], shape: 'plus', speed: 90, life: 400, ay: 0 });
  if (player){ magicTone(60, 450, 'sawtooth', 0.14); magicTone(120, 220, 'square', 0.06); }
}
function canonFlight(rt){
  const T = 1500;
  let x0, y0, x1, H;
  return { anim: 'celebrate', ms: T, hide: false,
    start: (r, act) => {
      const m = canonMuzzle(rt), fw = floorWidth();
      x0 = m.x / fw; y0 = m.y; x1 = canonSide(rt) > 0 ? rnd(0.82, 0.92) : rnd(0.08, 0.18);
      H = Math.min(floorHeight() - actorCssH(act) - 10, floorHeight() * 0.72);
      act.x = x0; act.y = y0;
    },
    track: (r, el, act) => {
      const t = Math.min(1, el / T);
      act.flipY = t > 0.28 && t < 0.82;
      if (t > 0.18 && t < 0.88) act.dir = Math.floor(el / 110) % 2 ? 1 : -1;
      if (Math.random() < 0.7) fxSpawn({ x: act.x * floorWidth(), y: act.y + actorCssH(act) * 0.4, vx: rnd(-15, 15), vy: rnd(-15, 15),
        life: 600, shape: Math.random() < 0.3 ? 'plus' : 'sq', colors: [MP.gold, MP.goldL, '#ffffff', FP.pinkL], cycle: 110, layer: 'back' });
      return { x: clampX(x0 + (x1 - x0) * t), y: Math.max(0, y0 * (1 - t) + 4 * H * t * (1 - t)) };
    },
    end: (r, act) => {
      act.flipY = false; act.y = 0;
      fxBurst(act.x * floorWidth(), 2, 10, { colors: ['#e0d6c8', '#ffffff'], speed: 60, life: 500, ay: -120, spread: Math.PI, ang0: 0 });
    } };
}
function canonSteps(f, player){
  const rt = f.rt, sd = canonSide(rt);
  return [
    { go: f.x(-13 * sd) },
    S.wait(500, 'idle', { dir: sd, fx: ['😤'] }),
    { hop: () => ({ x: clampX(canonMuzzle(rt).x / floorWidth()), y: canonMuzzle(rt).y }), ms: 520, h: 18, end: (r, act) => { act.hidden = true; } },
    { anim: 'idle', ms: 650, hide: true, fx: ['3️⃣'], start: r => { r.fuseUntil = performance.now() + 1950; } },
    { anim: 'idle', ms: 650, hide: true, fx: ['2️⃣'] },
    { anim: 'idle', ms: 650, hide: true, fx: ['1️⃣'], end: r => canonFire(r, player) },
    canonFlight(rt),
    { bounce: 1, ms: 380, h: 12, anim: 'sick' },
    { bounce: 1, ms: 260, h: 5, anim: 'sick' },
    { anim: 'sick', ms: 900, fx: ['💫'] },
    { anim: 'celebrate', ms: 1000, fx: ['🌟', '🎉'] },
  ];
}

const CANON_ART = { w: 26, h: 16,
  init: rt => { rt.recoilAt = -1e9; rt.fuseUntil = 0; },
  tap: rt => { magicGo(rt, f => canonSteps(f, true)); return true; },
  parts: [
    { id: 'barrel', pivot: [13, 11], pose: (rt, now) => {
      const t = (now - rt.recoilAt) / 300;
      const kick = t < 1 ? Math.sin(t * Math.PI) * 2.5 : 0;
      return { sx: canonSide(rt), x: -canonSide(rt) * kick * furniK() };
    }, draw: p => {
      for (let i = 0; i < 12; i++){
        const x = 8 + i, y = 11 - Math.round(i * 0.7);
        p.r(x, y - 3, 2, 6, FP.O); p.r(x, y - 2, 2, 4, i % 4 === 3 ? MP.gold : FP.red); p.r(x, y - 2, 2, 1, FP.redL);
      }
      p.r(20, 0, 3, 7, FP.O); p.r(20, 1, 3, 5, MP.goldD); p.r(21, 2, 1, 3, '#2a1a10');
      p.r(5, 9, 4, 5, FP.O); p.r(6, 10, 3, 3, FP.redD); p.r(4, 11, 1, 1, FP.rope);
    } },
    { id: 'fuse', show: (rt, now) => now < rt.fuseUntil && Math.floor(now / 60) % 2 === 0, pose: rt => ({ sx: canonSide(rt) }), draw: p => {
      p.r(3, 10, 1, 1, '#ffffff'); p.r(3, 9, 1, 1, MP.gold); p.r(2, 10, 1, 1, FP.orange);
    } },
    { id: 'wheels', pose: rt => ({ sx: canonSide(rt) }), draw: p => {
      p.disc(10, 12.5, 3.4, (x, y) => (x + y) % 3 ? FP.woodD : FP.wood); p.disc(10, 12.5, 1, MP.gold);
      p.disc(17, 12.5, 3.4, (x, y) => (x + y) % 3 ? FP.woodD : FP.wood); p.disc(17, 12.5, 1, MP.gold);
    } },
  ],
  visits: [ f => canonSteps(f, false) ],
  /* Uno prende la mecha y el otro sale disparado. */
  duos: [
    f => {
      const rt = f.rt, sd = canonSide(rt);
      return {
        a: [{ go: f.x(-16 * sd) }, S.sync('in', { dir: sd }), S.sync('inside'), { anim: 'pet', ms: 1500, dir: sd, start: r => { r.fuseUntil = performance.now() + 1500; } },
          { call: r => canonFire(r, false) }, S.sync('fired'), { anim: 'celebrate', ms: 1600, fx: ['😮', '👏'], fxEvery: 800 }, S.sync('end'),
          S.happy(800, { dir: 'partner', fx: ['😆'] })],
        b: [{ go: f.x(-28 * sd) }, S.sync('in', { dir: sd }),
          { hop: () => ({ x: clampX(canonMuzzle(rt).x / floorWidth()), y: canonMuzzle(rt).y }), ms: 520, h: 18, end: (r, act) => { act.hidden = true; } },
          S.sync('inside', { hide: true }), S.sync('fired', { hide: true }), canonFlight(rt),
          { bounce: 1, ms: 380, h: 12, anim: 'sick' }, { anim: 'sick', ms: 800, fx: ['💫'] }, S.sync('end'), S.happy(800, { dir: 'partner', fx: ['🌟'] })],
      };
    },
  ] };

/* ===================== 18. Gelatina gigante =====================
   Una gelatina que tiembla de verdad (resorte: rt.sq es cuánto se aplasta,
   rt.sqv su velocidad). Salta encima y rebota cada vez más alto; después se
   hunde adentro (la gelatina es semitransparente y pasa por delante: se la ve
   adentro) y la gelatina la escupe para arriba. Tocarla la hace temblar. */
function jellyPoke(rt, v){ rt.sqv = (rt.sqv || 0) + v; }
function jellyTop(rt){ return 13 * furniK() * (1 - Math.max(-0.2, Math.min(0.45, rt.sq || 0))); }
function jellySteps(f){
  const rt = f.rt;
  return [
    { go: f.x(-18) },
    { hop: () => ({ x: f.x(0), y: jellyTop(rt) }), ms: 500, h: 16, end: r => jellyPoke(r, 5) },
    ...[14, 20, 28, 36].map(h => ({ bounce: 1, ms: 380 + h * 6, h, anim: 'celebrate', onBounce: r => jellyPoke(r, 4 + h / 10) })),
    { anim: 'happy', ms: 1600, fx: ['😆'], track: (r, el) => ({ y: Math.max(3, jellyTop(rt) - el / 1600 * jellyTop(rt) * 0.75) }) },
    { anim: 'happy', ms: 1800, fx: ['😵', '💗'], fxEvery: 900, track: (r, el) => { if (el % 600 < 20) jellyPoke(r, 2); return { y: 3 + Math.sin(el / 120) }; } },
    { hop: { x: f.x(22), y: 0 }, ms: 700, h: 34, anim: 'celebrate', start: r => jellyPoke(r, -6) },
    S.happy(900, { fx: ['🍮'] }),
  ];
}

const GELATINA_ART = { w: 24, h: 16, keep: ['sq', 'sqv'],
  init: rt => { rt.sq = 0; rt.sqv = 0; },
  tick: (rt, now, dt) => {
    rt.sqv += (-(rt.sq || 0) * 180 - (rt.sqv || 0) * 7) * dt;
    rt.sq = (rt.sq || 0) + rt.sqv * dt;
    rt.sq = Math.max(-0.25, Math.min(0.5, rt.sq));
  },
  tap: rt => {
    jellyPoke(rt, 7);
    magicTone(300, 120, 'sine', 0.08); magicTone(180, 260, 'sine', 0.08, audioNow() + 0.08);
    if (!furniCommandBlocked() && !walkerBusy()) magicGo(rt, f => jellySteps(f));
    return true;
  },
  parts: [
    { id: 'plate', draw: p => { p.ell(12, 14.5, 11.5, 1.5, FP.whiteL); } },
    { id: 'jelly', z: 'front', pivot: [12, 15], pose: rt => ({ sx: 1 + (rt.sq || 0) * 0.7, sy: 1 - (rt.sq || 0) }), draw: p => {
      for (let y = 2; y <= 14; y++){
        const w = y < 4 ? 8 - (4 - y) : y > 12 ? 9 : 9;
        for (let x = 12 - w; x <= 11 + w; x++){
          const edge = x === 12 - w || x === 11 + w || y === 2;
          p.r(x, y, 1, 1, edge ? 'rgba(150,20,80,.95)' : y < 5 ? 'rgba(255,190,220,.88)' : y > 11 ? 'rgba(230,70,140,.82)' : 'rgba(255,110,170,.74)');
        }
      }
      p.r(6, 4, 1, 6, 'rgba(255,255,255,.7)'); p.r(8, 3, 3, 1, 'rgba(255,255,255,.7)');
      p.r(15, 9, 2, 1, 'rgba(255,255,255,.4)');
      p.disc(12, 1.5, 1.6, FP.red); p.r(12, 0, 1, 1, MP.leafD);
    } },
  ],
  visits: [ f => jellySteps(f) ],
  /* Uno se sienta arriba y el otro salta encima: el de arriba sale volando. */
  duos: [
    f => {
      const rt = f.rt;
      return {
        a: [{ go: f.x(-16) }, { hop: () => ({ x: f.x(-2), y: jellyTop(rt) }), ms: 500, h: 14, end: r => jellyPoke(r, 5) }, S.sync('up'),
          { anim: 'happy', ms: 900, track: () => ({ y: jellyTop(rt) }) }, S.sync('b-jump'),
          { hop: { x: f.x(-30), y: 0 }, ms: 900, h: 46, anim: 'celebrate', fx: ['😱'] }, S.sync('end'), S.happy(1000, { dir: 'partner', fx: ['😂'] })],
        b: [{ go: f.x(26) }, S.sync('up', { dir: -1 }), { hop: () => ({ x: f.x(3), y: jellyTop(rt) }), ms: 600, h: 26, end: r => jellyPoke(r, 10) },
          S.sync('b-jump'), { anim: 'happy', ms: 900, fx: ['😆'], track: () => ({ y: jellyTop(rt) }) },
          { hop: { x: f.x(20), y: 0 }, ms: 500, h: 14 }, S.sync('end'), S.happy(1000, { dir: 'partner' })],
      };
    },
  ] };

/* ===================== 19. Patineta =====================
   Se sube, toma impulso y cruza la pieza haciendo trucos: un kickflip (la
   tabla gira debajo en el aire) a la ida y otro a la vuelta. La tabla queda
   donde se bajó (libre, como la pelota). De a dos: se la pasan. */
function boardAbs(rt){ return clampX(rt.x + (rt.bdx || 0) / floorWidth()); }
function boardTop(){ return 4 * furniK(); }
function skateRide(rt, toX, ms, flipAt){
  let x0;
  return { anim: 'happy', ms,
    start: (r, act) => { x0 = act.x; act.dir = toX > x0 ? 1 : -1; },
    track: (r, el, act) => {
      const t = Math.min(1, el / ms), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const x = x0 + (toX - x0) * e;
      let y = boardTop(), by = 0, rot = 0;
      if (flipAt != null){
        const u = (t - flipAt) / 0.22;
        if (u > 0 && u < 1){ y += 4 * u * (1 - u) * 30; by = 4 * u * (1 - u) * 18; rot = u * Math.PI * 2; }
      }
      rt.by = by; rt.brot = rot;
      if (Math.random() < 0.35) fxSpawn({ x: x * floorWidth() - act.dir * 10, y: 3, vx: -act.dir * rnd(10, 30), life: 300, color: 'rgba(220,220,235,.8)', layer: 'back' });
      return { x, y };
    },
    end: () => { rt.by = 0; rt.brot = 0; } };
}
function skateSteps(f){
  const rt = f.rt;
  let far, near;
  return [
    { go: () => clampX(boardAbs(rt) - 0.07) },
    { hop: () => ({ x: boardAbs(rt), y: boardTop() }), ms: 380, h: 8, end: (r, act) => {
      r.rider = act; far = act.x < 0.5 ? 0.86 : 0.14; near = act.x < 0.5 ? 0.14 : 0.86;
    } },
    { anim: 'walk', ms: 500, track: (r, el, act) => ({ y: boardTop() }) },
    { call: (r, act, a) => { a.steps.splice(a.i + 1, 0, skateRide(rt, far, 2300, 0.55), S.wait(250, 'happy', { fx: ['😎'] }), skateRide(rt, near, 2300, 0.5)); } },
    { hop: (a, act) => ({ x: clampX(act.x + act.dir * 0.06), y: 0 }), ms: 380, h: 10, start: r => { r.rider = null; } },
    S.happy(900, { fx: ['🌟', '😆'] }),
  ];
}

const PATINETA_ART = { w: 18, h: 6, free: true, keep: ['bdx'],
  init: rt => { rt.bdx = 0; rt.by = 0; rt.brot = 0; rt.rider = null; },
  tick: rt => {
    if (rt.rider) rt.bdx = (rt.rider.x - rt.x) * floorWidth();
  },
  cleanup: rt => { rt.rider = null; rt.by = 0; rt.brot = 0; },
  parts: [
    { id: 'board', pivot: [9, 3], pose: rt => ({ x: rt.bdx || 0, y: rt.by || 0, r: rt.brot || 0 }), draw: p => {
      p.r(1, 1, 16, 1, FP.O); p.r(0, 2, 18, 1, FP.O); p.r(1, 2, 16, 1, '#3a3448');
      p.r(1, 3, 16, 1, FP.wood); p.r(0, 2, 1, 1, FP.wood); p.r(17, 2, 1, 1, FP.wood);
      p.r(2, 3, 14, 1, FP.redL); p.r(1, 4, 16, 1, FP.O);
      p.r(3, 4, 3, 1, FP.metalD); p.r(12, 4, 3, 1, FP.metalD);
      p.r(3, 5, 2, 1, MP.mint); p.r(13, 5, 2, 1, MP.mint);
    } },
  ],
  visits: [ f => skateSteps(f) ],
  /* Uno anda y el otro corre al lado; después se la pasa. */
  duos: [
    f => {
      const rt = f.rt;
      const runBeside = ms => ({ anim: 'walk', ms, fx: ['😆'], fxEvery: 1500, track: (r, el, act, a, dt) => {
        const tx = clampX(a.partner.x - a.partner.dir * 0.1), d = tx - act.x;
        if (Math.abs(d) > 0.01){ act.dir = d > 0 ? 1 : -1; act.x = clampX(act.x + act.dir * Math.min(Math.abs(d), dt * 0.32)); }
        return null; } });
      return {
        a: [{ go: () => clampX(boardAbs(rt) - 0.07) },
          { hop: () => ({ x: boardAbs(rt), y: boardTop() }), ms: 380, h: 8, end: (r, act) => { r.rider = act; } }, S.sync('go'),
          { call: (r, act, a) => { a.steps.splice(a.i + 1, 0, skateRide(rt, act.x < 0.5 ? 0.86 : 0.14, 2600, 0.55)); } },
          { hop: (a, act) => ({ x: clampX(act.x - act.dir * 0.05), y: 0 }), ms: 380, h: 10, start: r => { r.rider = null; } },
          S.sync('swap'), S.sync('b-done'), S.happy(900, { dir: 'partner', fx: ['👏'] })],
        b: [{ go: f.x(-30) }, S.sync('go'), runBeside(2700), S.sync('swap'),
          { hop: () => ({ x: boardAbs(rt), y: boardTop() }), ms: 380, h: 8, end: (r, act) => { r.rider = act; } },
          { call: (r, act, a) => { a.steps.splice(a.i + 1, 0, skateRide(rt, act.x < 0.5 ? 0.86 : 0.14, 2600, 0.5)); } },
          { hop: (a, act) => ({ x: clampX(act.x - act.dir * 0.05), y: 0 }), ms: 380, h: 10, start: r => { r.rider = null; } },
          S.sync('b-done'), S.happy(900, { dir: 'partner', fx: ['😎'] })],
      };
    },
  ] };

/* ===================== 20. Espejo mágico =====================
   Se mira, el reflejo sale del espejo y la imita reflejada (como en un
   espejo de verdad: si ella va a la izquierda, el reflejo va a la derecha)
   con un poquito de retraso, teñido de otro color (ver CLONE). Hacen la
   coreografía juntos y el reflejo vuelve a entrar. */
function mirrorSteps(f){
  const rt = f.rt;
  return [
    { go: f.x(-14) },
    S.wait(900, 'idle', { dir: 1, fx: ['👀'] }),
    { anim: 'sad', ms: 600, dir: 1, fx: ['😮'], start: r => {
      startClone(r.x);
      fxBurst(rtPx(r, 0), 16 * furniK(), 14, { colors: [MP.violetL, '#ffffff', MP.sky], shape: 'plus', speed: 60, life: 700, ay: 0 });
    } },
    { anim: 'pet', ms: 1000, dir: 1, fx: ['👋'] },
    { go: f.x(-44), speed: 0.12 },
    { bounce: 2, ms: 420, h: 16, dir: 1 },
    S.dance(1800, 300, { fx: ['🎶'] }),
    { go: f.x(-24), speed: 0.12 },
    { anim: 'celebrate', ms: 900, dir: 1 },
    { go: f.x(-12), speed: 0.09, dir: 1 },
    { anim: 'pet', ms: 700, dir: 1, start: r => {
      stopClone();
      fxBurst(rtPx(r, 0), 16 * furniK(), 10, { colors: [MP.violetL, '#ffffff'], shape: 'plus', speed: 50, life: 600, ay: 0 });
    } },
    S.wait(600, 'idle', { dir: 1, fx: ['❓'] }),
    S.happy(800, { fx: ['😆'] }),
  ];
}

const ESPEJO_ART = { w: 18, h: 30,
  cleanup: () => stopClone(),
  parts: [
    { id: 'frame', draw: p => {
      p.r(4, 25, 2, 4, MP.goldD); p.r(12, 25, 2, 4, MP.goldD); p.box(2, 28, 14, 2, MP.goldD, MP.gold);
      p.ell(9, 13, 8.4, 12.4, MP.gold);
      p.ell(9, 13, 6.6, 10.6, (x, y) => y < 8 ? '#dff3ff' : y < 16 ? '#bfe2f7' : '#a6cfee');
      p.r(9, 0, 1, 1, MP.goldL); p.r(8, 1, 3, 1, MP.goldL);
    } },
    { id: 'shine', pose: (rt, now, k) => ({ x: ((now / 30) % 28 - 14) * k * 0.25 }), draw: p => {
      p.r(6, 6, 1, 4, 'rgba(255,255,255,.85)'); p.r(7, 5, 1, 2, 'rgba(255,255,255,.85)'); p.r(11, 15, 1, 3, 'rgba(255,255,255,.6)');
    } },
  ],
  visits: [ f => mirrorSteps(f) ],
  /* El acompañante mira, se asusta del reflejo y aplaude. */
  duos: [
    f => ({
      a: [...mirrorSteps(f).slice(0, 4), S.sync('seen'), ...mirrorSteps(f).slice(4), S.sync('end')],
      b: [{ go: f.x(-30) }, S.sync('seen', { dir: 1 }), { anim: 'sad', ms: 800, fx: ['😱'] }, S.wait(2500, 'idle', { dir: 1, fx: ['👀'] }),
        { anim: 'celebrate', ms: 2000, fx: ['👏'], fxEvery: 900 }, S.sync('end'), S.happy(800, { dir: 'partner' })],
    }),
  ] };

/* ===================== 21. Pala y balde =====================
   Una pala parada en un balde. Con la pala en la pieza, tocar la caca (o
   la pala) manda a la mascota a buscarla, ir hasta la caca, recogerla y
   echarla al balde: la misma higiene que recogerla a mano (+10), pero la
   caca no se pierde: queda guardada en el balde (hasta PALA_MAX, se ve el
   montón asomando y con moscas cuando está harto lleno). El balde se vacía
   en la compostera (abajo). Recoger y vaciar son tareas ('chore'): no se
   cortan por estar triste o enferma, solo dormida no va.

   Se lleva en las manos moviendo las piezas con `pose`: todas giran en el
   mismo pivote (abajo al centro del balde) y la cuenta pone el mango justo
   en la mano del personaje (palaHand). */
const PALA_MAX = 5;
const PALA_PIVOT = [7, 23];

function palaData(){
  const d = objData('pala');
  if (typeof d.caca !== 'number') d.caca = 0;
  return d;
}
/* Dónde está la caca (fracción del piso): la del DOM, que es la que se ve. */
function poopX(){
  const el = document.getElementById('poopFx'), fl = document.getElementById('creatureFloor');
  if (el && fl && !el.classList.contains('hidden')){
    const a = el.getBoundingClientRect(), b = fl.getBoundingClientRect();
    if (b.width) return clampX((a.left + a.width / 2 - b.left) / b.width);
  }
  return clampX(ROBOT_POOP_X + 12 / floorWidth());
}
/* La mano del personaje, px CSS del piso (y hacia arriba). Baja: el
   cuerpo de casi todas las especies llena la mitad de abajo de su cuadro. */
function palaHand(act){
  const h = actorCssH(act);
  return { x: act.x * floorWidth() + act.dir * h * 0.3, y: act.y + h * 0.22 };
}
const SHOVEL_GRIP = [10, 10], SHOVEL_TIP = [10, 21];
/* Pose de una pieza girando en PALA_PIVOT, con el punto (gx, gy) del arte
   puesto en (hx, hy) del piso. */
function palaPoseAt(rt, gx, gy, hx, hy, r){
  const k = furniK(), dx = (gx - PALA_PIVOT[0]) * k, dy = (gy - PALA_PIVOT[1]) * k;
  const c = Math.cos(r), s = Math.sin(r);
  const pivotUp = (FURNI_ART.pala.h - PALA_PIVOT[1]) * k;
  return { x: hx - rt.x * floorWidth() - (dx * c - dy * s), y: hy - pivotUp + (dx * s + dy * c), r };
}
/* Las piezas del balde (balde y montón): quietas, o en las manos. */
function bucketPose(rt){
  const c = rt.carry;
  if (!c || c.what !== 'bucket') return null;
  const hand = palaHand(c.act), k = furniK();
  return palaPoseAt(rt, 7, 16, hand.x, c.lift ?? hand.y, c.act.dir * (c.tilt || 0));
}
/* La pala: con el balde, o sola en la mano (agarrada del mango). */
function shovelPose(rt){
  const c = rt.carry;
  if (!c) return null;
  if (c.what === 'bucket') return bucketPose(rt);
  /* Cruzada, con la hoja adelante y abajo; `tilt` la baja más (palear).
     La mano sube lo que haga falta para que la punta no pase el piso. */
  const hand = palaHand(c.act), r = 1.15 - (c.tilt || 0);
  const len = (SHOVEL_TIP[1] - SHOVEL_GRIP[1]) * furniK();
  const y = Math.max(hand.y, c.act.y + len * Math.cos(r) + 1);
  return palaPoseAt(rt, SHOVEL_GRIP[0], SHOVEL_GRIP[1], hand.x, y, -c.act.dir * r);
}
/* Dónde queda la punta de la pala (px CSS del piso), para las partículas. */
function shovelTip(rt){
  const c = rt.carry, hand = palaHand(c.act), r = 1.15 - (c.tilt || 0);
  const len = (SHOVEL_TIP[1] - SHOVEL_GRIP[1]) * furniK();
  return { x: hand.x + c.act.dir * len * Math.sin(r), y: Math.max(1, hand.y - len * Math.cos(r)) };
}

/* Pararse al lado de algo (fracción del piso), del lado donde ya está, a
   `gap` px CSS más medio cuerpo. */
const besideX = (targetX, gap) => (a, act) => {
  const side = act.x <= targetX() ? -1 : 1;
  return clampX(targetX() + side * (gap + actorCssH(act) * 0.34) / floorWidth());
};
const faceX = targetX => ({ anim: 'idle', ms: 120, start: (r, act) => { act.dir = targetX() > act.x ? 1 : -1; } });

function palaScoopSteps(rt){
  const k = furniK(), at = () => rt.x;
  return [
    { go: besideX(at, 5 * k) }, faceX(at),
    { anim: 'pet', ms: 380, end: (r, act) => { rt.carry = { what: 'shovel', act, tilt: 0 }; } },
    /* Se para a un largo de pala de la caca: la punta queda encima. */
    { go: (a, act) => { const px = poopX(); return clampX(px + (act.x <= px ? -1 : 1) * actorCssH(act) * 0.6 / floorWidth()); } }, faceX(poopX),
    { anim: 'clean', ms: 1300, fx: ['💪'], track: (r, el, act) => {
      rt.carry.tilt = 0.55 * Math.sin(Math.min(1, el / 1300) * Math.PI);
      if (Math.random() < 0.25){ const t = shovelTip(rt); fxSpawn({ x: t.x, y: 2, vx: rnd(-25, 25), vy: rnd(20, 50), ay: -150, life: 500, shape: 'dust', colors: ['#7a4a26', '#a06a3a'], layer: 'front', floor: 'die' }); }
      return null;
    }, end: () => {
      if (!state.poop) return;
      if (typeof catchUp === 'function') catchUp();
      state.poop = false;
      state.hygiene = clamp(state.hygiene + POOP_CLEAN_HYGIENE);
      if (typeof medalAdd === 'function') medalAdd('cacas');
      rt.loaded = true;
      const t = shovelTip(rt);
      fxBurst(t.x, t.y + 6, 7, { colors: ['#ffffff', MP.mint], shape: 'plus', speed: 45, life: 550, ay: 0 });
      saveState(); render();
    } },
    { go: besideX(at, 5 * k) }, faceX(at),
    { anim: 'pet', ms: 450, end: (r, act) => {
      if (rt.loaded){
        const d = palaData();
        d.caca = Math.min(PALA_MAX, d.caca + 1);
        rt.loaded = false;
        saveState();
        if (d.caca >= PALA_MAX) say('¡El balde está lleno! Vacíalo en la compostera ♻️', 2800);
      }
      rt.carry = null;
    } },
    S.happy(700, { fx: ['✨', '😌'] }),
  ];
}

/* Llevar el balde hasta la compostera y vaciarlo ahí. */
function palaEmptySteps(prt, crt){
  const k = furniK(), at = () => prt.x, bin = () => compostBinX(crt);
  let lift0 = 0, top = 0;
  return [
    { go: besideX(at, 5 * k) }, faceX(at),
    { anim: 'pet', ms: 380, end: (r, act) => { prt.carry = { what: 'bucket', act, tilt: 0 }; } },
    { go: (a, act) => clampX(bin() + (act.x <= bin() ? -1 : 1) * actorCssH(act) * 0.34 / floorWidth()) }, faceX(bin),
    { anim: 'happy', ms: 450, start: (r, act) => { lift0 = palaHand(act).y; top = 15 * furniK(); }, track: (r, el) => {
      prt.carry.lift = lift0 + (top - lift0) * Math.min(1, el / 450); return null; } },
    { anim: 'clean', ms: 1300, fx: ['💩', '♻️'], fxEvery: 650, track: (r, el, act) => {
      prt.carry.tilt = Math.min(1.7, el / 380);
      if (el > 350 && Math.random() < 0.55){
        const hand = palaHand(act);
        fxSpawn({ x: hand.x + act.dir * rnd(2, 8) * furniK(), y: top + 4 * furniK(), vx: act.dir * rnd(0, 15), vy: rnd(-10, 10), ay: -260, life: 900,
          shape: Math.random() < 0.5 ? 'big' : 'dust', colors: ['#6a3e1f', '#8a5a33', '#a06a3a'], layer: 'front', floor: 'die' });
      }
      return null;
    }, end: () => {
      const d = palaData(), c = compostData();
      if (crt.removed) return;
      const n = Math.min(d.caca, COMPOST_MAX - c.items.length), now = Date.now();
      for (let i = 0; i < n; i++) c.items.push(now);
      d.caca -= n;
      crt.puffAt = performance.now();
      saveState();
    } },
    { anim: 'idle', ms: 350, track: () => { prt.carry.tilt = 0; prt.carry.lift = null; return null; } },
    { go: besideX(at, 5 * k) }, faceX(at),
    { anim: 'pet', ms: 380, end: () => { prt.carry = null; } },
  ];
}

const PALA_ART = { w: 14, h: 24,
  init: rt => { rt.carry = null; rt.loaded = false; rt.flyAt = 0; },
  tick: (rt, now) => {
    rt.caca = palaData().caca;
    /* Con el balde harto lleno, unas moscas dando vueltas. */
    if (rt.caca >= 3 && !rt.carry && now - rt.flyAt > 900){
      rt.flyAt = now;
      const k = furniK();
      fxSpawn({ x: rtPx(rt, rnd(-3, 3)), y: 13 * k, vx: rnd(-6, 6), vy: rnd(4, 9), wob: 9, wobF: rnd(5, 8), life: 1600,
        color: '#2a2433', layer: 'front' });
    }
  },
  cleanup: rt => {
    /* Si se cortó con la caca en la pala, igual va al balde: no se pierde. */
    if (rt.loaded){ const d = palaData(); d.caca = Math.min(PALA_MAX, d.caca + 1); saveState(); }
    rt.loaded = false; rt.carry = null;
  },
  tap: rt => {
    if (walker.activity && walker.activity.kind === 'chore'){ petFx('❗', walker); return true; }
    const d = palaData();
    if (state.poop){ if (!palaTryScoop() && state.sleeping) say('Shh… está durmiendo 💤'); return true; }
    const crt = magicRt('compost');
    if (d.caca > 0 && crt){ compostTap(crt); return true; }
    say(d.caca ? `💩 ${d.caca} de ${PALA_MAX} cacas en el balde: vacíalo en la compostera ♻️`
      : '💩 Cuando haya caca, toca la caca o la pala y la recoge', 2800);
    return true;
  },
  parts: [
    /* Chica a propósito: al lado de la mascota, una pala de su alto se
       veía como un arma. La hoja queda dentro del balde. */
    { id: 'shovel', pivot: PALA_PIVOT, pose: rt => shovelPose(rt), draw: p => {
      p.box(8, 5, 5, 3, FP.wood, FP.woodL);
      p.r(9, 8, 3, 8, FP.O); p.r(10, 8, 1, 8, FP.woodL);
      p.r(8, 15, 5, 1, FP.metalD);
      p.box(7, 16, 7, 5, FP.metal, '#d9dee8'); p.r(8, 17, 1, 2, '#d9dee8');
      p.r(9, 21, 3, 1, FP.O);
    } },
    { id: 'load', pivot: PALA_PIVOT, show: 'loaded', pose: rt => shovelPose(rt), draw: p => {
      p.r(8, 15, 5, 2, '#7a4a26'); p.r(9, 14, 3, 1, '#7a4a26'); p.r(10, 14, 1, 1, '#a06a3a'); p.r(9, 13, 2, 1, FP.O);
    } },
    { id: 'bucket', pivot: PALA_PIVOT, pose: rt => bucketPose(rt), draw: p => {
      p.r(0, 14, 14, 2, FP.O); p.r(1, 14, 12, 1, FP.redL);
      for (let y = 16; y <= 22; y++){
        const i = Math.floor((y - 16) / 4), x0 = 1 + i, x1 = 12 - i;
        p.r(x0, y, x1 - x0 + 1, 1, FP.O); p.r(x0 + 1, y, x1 - x0 - 1, 1, y === 18 || y === 19 ? FP.redD : FP.red);
      }
      p.r(3, 16, 1, 2, FP.redL); p.r(2, 23, 10, 1, FP.O);
    } },
    ...[1, 2, 3, 4, 5].map(n => ({ id: 'pile' + n, pivot: PALA_PIVOT, show: rt => Math.min(PALA_MAX, rt.caca || 0) === n,
      pose: rt => bucketPose(rt), draw: p => {
        const B = '#7a4a26', L = '#a06a3a';
        const rows = [[13, 3, 6], [13, 2, 10], [12, 4, 8], [12, 3, 10], [11, 5, 8], [11, 4, 9], [10, 5, 7], [9, 6, 7]];
        const upTo = [0, 1, 3, 5, 6, 8][n];
        for (let i = 0; i < upTo; i++){ const [y, a, b] = rows[i]; p.span(y, a, b, B); }
        const topRow = rows[upTo - 1];
        p.r(topRow[1] + 1, topRow[0], 1, 1, L);
      } })),
  ],
  /* Sola: juega a cavar en otro lado y deja la pala de vuelta. */
  visits: [
    f => {
      const rt = f.rt, k = f.k, at = () => rt.x;
      let spot = 0.5;
      return [
        { go: besideX(at, 5 * k) }, faceX(at),
        { anim: 'pet', ms: 380, end: (r, act) => { rt.carry = { what: 'shovel', act, tilt: 0 }; spot = clampX(rt.x + (rt.x < 0.5 ? 0.3 : -0.3)); } },
        { go: () => spot },
        { anim: 'clean', ms: 2600, fx: ['🕳️', '😆'], fxEvery: 900, track: (r, el, act) => {
          rt.carry.tilt = 0.45 * Math.abs(Math.sin(el / 260));
          if (Math.random() < 0.3){ const t = shovelTip(rt); fxSpawn({ x: t.x, y: 2, vx: -act.dir * rnd(10, 40), vy: rnd(30, 60), ay: -160, life: 600, shape: 'dust', colors: [FP.sandD, FP.brown, FP.brownL], layer: 'front', floor: 'die' }); }
          return null;
        } },
        { anim: 'happy', ms: 700, fx: ['💎', '🐛', '🦴'], start: () => { if (rt.carry) rt.carry.tilt = 0; } },
        { go: besideX(at, 5 * k) }, faceX(at),
        { anim: 'pet', ms: 380, end: () => { rt.carry = null; } },
        S.happy(600),
      ];
    },
  ],
  duos: [
    f => {
      const rt = f.rt, k = f.k, at = () => rt.x;
      return {
        a: [{ go: besideX(at, 5 * k) }, faceX(at),
          { anim: 'pet', ms: 380, end: (r, act) => { rt.carry = { what: 'shovel', act, tilt: 0 }; } }, S.sync('dig'),
          { anim: 'clean', ms: 3000, fx: ['🕳️'], fxEvery: 1000, track: (r, el, act) => {
            rt.carry.tilt = 0.45 * Math.abs(Math.sin(el / 260));
            if (Math.random() < 0.3){ const t = shovelTip(rt); fxSpawn({ x: t.x, y: 2, vx: -act.dir * rnd(10, 40), vy: rnd(30, 60), ay: -160, life: 600, shape: 'dust', colors: [FP.sandD, FP.brown], layer: 'front', floor: 'die' }); }
            return null; } },
          { anim: 'pet', ms: 380, end: () => { rt.carry = null; } }, S.sync('end'), S.happy(800, { dir: 'partner', fx: ['💎'] })],
        b: [{ go: f.x(-30) }, S.sync('dig', { dir: 'partner' }), S.wait(3000, 'idle', { dir: 'partner', fx: ['👀', '😮'], fxEvery: 1200 }),
          S.sync('end'), { anim: 'celebrate', ms: 900, fx: ['👏'] }],
      };
    },
  ] };

/* Lo llama tocar la caca (app.js). Con la pala en esta pieza y la mascota
   despierta, ella va a recogerla; si no, false y se recoge a mano. */
function palaTryScoop(){
  const rt = magicRt('pala');
  if (!rt || !state.poop || displayStage() === 'egg' || state.sleeping) return false;
  if (walker.activity && walker.activity.kind === 'chore'){ petFx('❗', walker); return true; }
  if (walker.activity && (walker.activity.kind === 'eat' || walker.activity.kind === 'vaccine')) return false;
  if (palaData().caca >= PALA_MAX){
    say('El balde de la pala está lleno: vacíalo en la compostera ♻️', 2800);
    return false;
  }
  return startChore(rt, palaScoopSteps(rt));
}

/* Una tarea de la mascota con un objeto (recoger, vaciar, cosechar): corta
   lo que estuviera haciendo, como tocar un mueble, pero no la frena estar
   triste o enferma. */
function startChore(rt, steps){
  if (state.sleeping){ say('Shh… está durmiendo 💤'); return false; }
  if (walker.activity && (walker.activity.kind === 'eat' || walker.activity.kind === 'vaccine')){ say('Primero que termine'); return false; }
  petAction = null;
  for (const act of allActors()) if (act.activity && act.activity.rt === rt) endFurniActivity(act);
  if (walker.activity) endFurniActivity(walker);
  if (walker.y > 1) steps.unshift({ hop: { x: walker.x, y: 0 }, ms: 300, h: 6 });
  startActivity(walker, steps, { rt, kind: 'chore' });
  petFx('❗', walker);
  return true;
}

/* ===================== 22. Compostera =====================
   Un cajón de tablas. Lo que se vacía del balde de la pala se composta: cada
   caca se vuelve un saco de fertilizante en COMPOST_MS (tiempo real, también
   con la app cerrada; se ve el montón y un vapor). Los sacos listos esperan
   al lado del cajón (FERT_READY_MAX) hasta que se toca la compostera: la
   mascota los saca y quedan en la mochila (state.bag.fertilizante). El
   fertilizante hace crecer al árbol frutal (una fruta al tiro) y al frijol
   mágico (una etapa sin esperar el riego). */
const COMPOST_MS = 4 * 60 * 60 * 1000;
const COMPOST_MAX = 8;
const FERT_READY_MAX = 6;

function compostData(){
  const d = objData('compost');
  if (!Array.isArray(d.items)) d.items = [];
  if (typeof d.fert !== 'number') d.fert = 0;
  const now = Date.now();
  while (d.items.length && now - d.items[0] >= COMPOST_MS && d.fert < FERT_READY_MAX){ d.items.shift(); d.fert++; }
  return d;
}
/* El centro del cajón (el arte trae los sacos a la derecha). */
function compostBinX(rt){ return clampX(rt.x + (8.5 - FURNI_ART.compost.w / 2) * furniK() / floorWidth()); }

function compostCollectSteps(crt){
  const bin = () => compostBinX(crt);
  return [
    { go: besideX(bin, 6 * furniK()) }, faceX(bin),
    { anim: 'pet', ms: 1300, fx: ['🌱'], track: (r, el, act) => {
      if (Math.random() < 0.3) fxSpawn({ x: compostBinX(crt) * floorWidth() + rnd(-8, 8), y: 13 * furniK(), vx: rnd(-20, 20), vy: rnd(30, 60), ay: -150, life: 500,
        shape: 'dust', colors: ['#5a3a22', MP.leaf], layer: 'front', floor: 'die' });
      return null;
    }, end: () => {
      const c = compostData(), n = c.fert;
      if (!n) return;
      c.fert = 0;
      bagAdd('fertilizante', n);
      saveState();
      if (typeof rewardSound === 'function') rewardSound();
      const usos = [magicRt('arbol') || state.style.owned.arbol ? 'el árbol frutal' : null, magicRt('frijol') || state.style.owned.frijol ? 'el frijol mágico' : null].filter(Boolean);
      showPopup({ icon: '🌱', title: '¡Fertilizante!', items: [{ icon: '🌱', text: 'Fertilizante', amount: `+${n}` }],
        note: `Tienes ${bagCount('fertilizante')}. ${usos.length ? `Hace crecer ${usos.join(' y ')}: tócalo cuando esté esperando.` : 'Hace crecer al árbol frutal y al frijol mágico.'}` });
    } },
    { anim: 'celebrate', ms: 900, fx: ['✨'] },
  ];
}

function compostTap(crt){
  if (walker.activity && walker.activity.kind === 'chore'){ petFx('❗', walker); return; }
  const c = compostData(), p = palaData(), prt = magicRt('pala');
  const vaciar = p.caca > 0 && prt && c.items.length < COMPOST_MAX;
  if (!vaciar && !c.fert){
    const prox = c.items.length ? ` · el próximo saco en ${magicDur(COMPOST_MS - (Date.now() - c.items[0]))}` : '';
    const saco = bagCount('fertilizante') ? ` · tienes ${bagCount('fertilizante')} de fertilizante` : '';
    if (p.caca > 0 && !prt) say('♻️ Trae la pala a esta habitación para vaciar el balde aquí', 2800);
    else if (p.caca > 0) say(`♻️ Está llena: espera que se haga fertilizante${prox}`, 2800);
    else if (c.items.length) say(`♻️ Compostando ${c.items.length} caca${c.items.length > 1 ? 's' : ''}${prox}${saco}`, 2800);
    else say(`♻️ Vacía aquí el balde de la pala: la caca se vuelve fertilizante${saco}`, 2800);
    return;
  }
  startChore(vaciar ? prt : crt, [...(vaciar ? palaEmptySteps(prt, crt) : []), ...(c.fert ? compostCollectSteps(crt) : [])]);
}

const COMPOST_ART = { w: 24, h: 16,
  init: rt => { rt.puffAt = -1e9; rt.steamAt = 0; },
  tick: (rt, now) => {
    const c = compostData();
    rt.items = c.items.length; rt.fert = c.fert;
    if (rt.items && now - rt.steamAt > 650){
      rt.steamAt = now;
      const k = furniK();
      fxSpawn({ x: compostBinX(rt) * floorWidth() + rnd(-6, 6) * k, y: 15 * k, vx: rnd(-4, 4), vy: rnd(8, 14), wob: 4, wobF: 2,
        life: 1800, color: 'rgba(230,230,240,.55)', layer: 'back' });
    }
  },
  tap: rt => { compostTap(rt); return true; },
  parts: [
    { id: 'heap1', show: rt => (rt.items || 0) >= 1, pose: (rt, now) => ({ sy: now - rt.puffAt < 400 ? 1.15 : 1 }), pivot: [8, 6], draw: p => {
      p.span(3, 3, 13, '#5a3a22'); p.r(5, 3, 1, 1, MP.leaf); p.r(10, 3, 1, 1, '#7a4a26');
    } },
    { id: 'heap2', show: rt => (rt.items || 0) >= 4, pose: (rt, now) => ({ sy: now - rt.puffAt < 400 ? 1.15 : 1 }), pivot: [8, 6], draw: p => {
      p.span(2, 5, 11, '#5a3a22'); p.span(1, 7, 9, '#5a3a22'); p.r(8, 1, 1, 1, MP.leafL); p.r(6, 2, 1, 1, '#7a4a26');
    } },
    { id: 'bin', draw: p => {
      p.box(0, 4, 17, 12, '#3a2618');
      for (const y of [5, 8, 11]){ p.r(1, y, 15, 2, FP.wood); p.r(1, y, 15, 1, FP.woodL); }
      p.r(1, 14, 15, 1, FP.woodD);
      p.r(1, 4, 2, 11, FP.woodD); p.r(14, 4, 2, 11, FP.woodD);
      p.r(0, 3, 3, 1, FP.O); p.r(14, 3, 3, 1, FP.O);
      p.r(7, 8, 3, 2, MP.leaf); p.r(8, 8, 1, 1, MP.leafL); p.r(7, 10, 1, 1, MP.leafD);
    } },
    ...[0, 1].map(i => ({ id: 'sack' + i, show: rt => (rt.fert || 0) > i, draw: p => {
      const y = i ? 3 : 9;
      p.box(17, y + 1, 7, 6, '#d8c08a', '#efd9a0'); p.r(19, y, 3, 1, FP.O); p.r(20, y - 1, 1, 1, '#d8c08a');
      p.r(19, y + 3, 3, 2, MP.leaf); p.r(20, y + 3, 1, 1, MP.leafL);
    } })),
  ],
  visits: [
    /* Va a oler: le da asco, se tapa y se ríe. */
    f => [
      { go: besideX(() => compostBinX(f.rt), 4 * f.k) }, faceX(() => compostBinX(f.rt)),
      S.wait(1200, 'idle', { fx: ['👃'] }),
      { anim: 'sad', ms: 1100, fx: ['🤢', '💨'] },
      { bounce: 1, ms: 420, h: 10, fx: ['😝'] },
      S.happy(1200, { fx: ['♻️', '🌱'], fxEvery: 600 }),
    ],
  ],
  duos: [
    f => {
      const bin = () => compostBinX(f.rt);
      return {
        a: [{ go: besideX(bin, 4 * f.k) }, faceX(bin), S.sync('in'), S.wait(1000, 'idle', { fx: ['👃'] }), { anim: 'sad', ms: 1000, fx: ['🤢'] }, S.sync('end'), S.happy(900, { dir: 'partner', fx: ['😂'] })],
        b: [{ go: f.x(-34) }, S.sync('in', { dir: 'partner' }), S.wait(2000, 'idle', { dir: 'partner', fx: ['👀'] }), S.sync('end'), { anim: 'celebrate', ms: 900, fx: ['😂'] }],
      };
    },
  ] };

/* Echarle fertilizante a una planta (árbol frutal, frijol): la mascota va,
   lo esparce y después pasa `grow`. */
function fertilizeSteps(rt, grow){
  return f => [
    { go: f.x(-9) },
    { anim: 'clean', ms: 1500, dir: 1, fx: ['🌱'], start: r => {
      for (let i = 0; i < 14; i++) setTimeout(() => { if (!r.removed) fxSpawn({ x: rtPx(r, rnd(-4, 4)), y: 14 * furniK(), vx: rnd(-12, 12), vy: -rnd(20, 50), life: 700,
        shape: 'dust', colors: ['#5a3a22', '#7a4a26', MP.leaf], layer: 'front', floor: 'die' }); }, i * 90);
    } },
    { call: r => { if (bagCount('fertilizante') <= 0) return; bagAdd('fertilizante', -1); grow(r); saveState(); } },
    { anim: 'celebrate', ms: 1000, dir: 1, fx: ['✨'] },
    S.happy(600),
  ];
}

Object.assign(FURNI_ART, {
  laser: LASER_ART, jetpack: JETPACK_ART, burbujas: BURBUJAS_ART, camara: CAMARA_ART, cristal: CRISTAL_ART,
});

Object.assign(FURNI_ART, { robot: ROBOT_ART, nube: NUBE_ART, arbol: ARBOL_ART, frijol: FRIJOL_ART });
Object.assign(FURNI_ART, { fuegos: FUEGOS_ART, prisma: PRISMA_ART, planetario: PLANETARIO_ART, nieve: NIEVE_ART, lava: LAVA_ART, portal: PORTAL_ART });
Object.assign(FURNI_ART, { musica: MUSICA_ART, canon: CANON_ART, gelatina: GELATINA_ART, patineta: PATINETA_ART, espejo: ESPEJO_ART });
Object.assign(FURNI_ART, { pala: PALA_ART, compost: COMPOST_ART });
