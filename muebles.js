/* ===================== Muebles =====================
   Todo lo de los muebles vive acá: el catálogo (precios), el arte, los
   guiones de lo que hace cada personaje con ellos y el motor que los corre.
   Se carga después de app.js y antes de duo.js (ver index.html); todo lo de
   acá se usa recién en tiempo de juego, no al cargar.

   Se compran en la pestaña Estilo y se ponen hasta FURNI_MAX a la vez, en
   cualquier lugar del piso: en Personalizar, "Acomodar muebles" deja
   arrastrarlos (ver enterArrange). Son pixel art dibujado acá mismo, no
   emojis: no hay emoji de tocador ni de tobogán que funcione en teléfonos
   viejos, y al lado del sprite un emoji se ve de otro mundo.

   Lo importante es que los personajes los USAN, y sin arte nuevo: cada
   mueble trae guiones (pasos: caminar, saltar, deslizarse, quedarse haciendo
   algo) que combinan las animaciones que ya tiene toda especie (feliz,
   limpiarse, comer, dormir...) con movimiento, partículas y piezas del
   mueble que se mueven (la pelota rueda, el cohete despega, la rueda gira).
   Cada mueble tiene VARIOS guiones y en cada visita se sortea uno, así no
   hace siempre lo mismo. Hay tres clases de guion:
   - routines: reemplazan una acción que ya existía (cama al dormirse, plato
     al comer, bañera al limpiarse).
   - visits: lo que hace uno solo, cada tanto, cuando está tranquilo.
   - duos: lo que hacen los dos juntos cuando hay acompañante (duo.js); cada
     uno tiene su lista de pasos y se esperan entre sí en los `sync`.

   Todo lo que hacen con un mueble es visual. Los únicos efectos en las
   barras son chicos a propósito: dormir con cama puesta recupera energía
   FURNI_BED_ENERGY_MULT veces más rápido, y cada visita (solo o de a dos)
   da FURNI_JOY de felicidad, con tope de FURNI_JOY_PER_HOUR por hora real
   para que dejarla sola con muebles no sea una forma de no cuidarla. */

const FURNI_MAX = 3;
/* Los tres lugares fijos de antes; solo sirven para migrar saves viejos. */
const LEGACY_FURNI_SLOTS = { izq: 0.21, centro: 0.5, der: 0.79 };
/* Separación mínima entre dos muebles, en px CSS. */
const FURNI_GAP_PX = 4;

const FURNI_VISIT_CHANCE = 0.45;      // al terminar cada paseo, chance de ir a un mueble
const FURNI_VISIT_GAP_MS = 14000;     // pausa mínima (aprox.) entre una visita y otra
const FURNI_JOY = 1;
const FURNI_JOY_PER_HOUR = 6;
const FURNI_BED_ENERGY_MULT = 1.5;
/* Si una visita (sola o de a dos) terminó antes de esto, encadena otro guion
   del mismo mueble (distinto si hay): así ninguna queda corta y además se
   mezclan los patrones. Los guiones duran de 5 a 15 s, así que con 9 s las
   visitas quedan entre ~9 y ~18 s (con 12 s, uno de 11.9 encadenaba otro
   entero y llegaba a 25). */
const FURNI_VISIT_MIN_MS = 9000;

/* Catálogo: precio y la línea chica de la tienda (`use`). Se suma a
   STYLE_ITEMS (app.js) para que la tienda y Personalizar lo traten igual que
   el resto del Estilo. Los ids tienen que ser únicos en TODO STYLE_ITEMS
   (ver CLAUDE.md: el radiocasete chocaba con el adorno "radio"). */
const FURNI_ITEMS = [
  { id:'cama',       name:'Cama',        use:'duerme ahí',     price: 60 },
  { id:'plato',      name:'Plato',       use:'come ahí',       price: 30 },
  { id:'banera',     name:'Bañera',      use:'se baña',        price: 70 },
  { id:'tocador',    name:'Tocador',     use:'se arregla',     price: 60 },
  { id:'trampolin',  name:'Trampolín',   use:'rebota',         price: 50 },
  { id:'pelota',     name:'Pelota',      use:'juega con ella', price: 25 },
  { id:'balon',      name:'Balón',       use:'mete goles',     price: 35 },
  { id:'playa',      name:'Pelota de playa', use:'la lanza',   price: 30 },
  { id:'columpio',   name:'Columpio',    use:'se columpia',    price: 70 },
  { id:'tobogan',    name:'Tobogán',     use:'se tira',        price: 90 },
  { id:'radiocasete',name:'Radiocasete', use:'baila',          price: 40 },
  { id:'tele',       name:'Tele',        use:'ve tele',        price: 60 },
  { id:'piano',      name:'Piano',       use:'toca',           price: 80 },
  { id:'tarima',     name:'Tarima',      use:'se sube',        price: 35 },
  { id:'librero',    name:'Librero',     use:'trepa',          price: 45 },
  { id:'cajas',      name:'Cajas',       use:'escala',         price: 30 },
  // nuevos
  { id:'pecera',     name:'Pecera',      use:'mira los peces', price: 55 },
  { id:'maceta',     name:'Maceta',      use:'la riega',       price: 30 },
  { id:'rueda',      name:'Rueda',       use:'corre adentro',  price: 75 },
  { id:'balancin',   name:'Balancín',    use:'sube y baja',    price: 65 },
  { id:'cohete',     name:'Cohete',      use:'despega',        price: 120 },
  { id:'arenero',    name:'Arenero',     use:'cava',           price: 45 },
  { id:'piscina',    name:'Piscina',     use:'nada',           price: 85 },
  { id:'hamaca',     name:'Hamaca',      use:'se mece',        price: 70 },
  { id:'telescopio', name:'Telescopio',  use:'mira el cielo',  price: 80 },
  { id:'cucu',       name:'Reloj cucú',  use:'se asusta',      price: 70 },
  { id:'caballito',  name:'Caballito',   use:'cabalga',        price: 65 },
  { id:'bateria',    name:'Batería',     use:'toca tambor',    price: 90 },
  { id:'caballete',  name:'Caballete',   use:'pinta',          price: 55 },
  { id:'cocinita',   name:'Cocinita',    use:'cocina',         price: 75 },
  { id:'cofre',      name:'Cofre',       use:'busca tesoros',  price: 60 },
  { id:'escalada',   name:'Muro',        use:'escala',         price: 85 },
  { id:'ventilador', name:'Ventilador',  use:'se refresca',    price: 40 },
  { id:'disco',      name:'Bola disco',  use:'hace fiesta',    price: 95 },
  { id:'puf',        name:'Puf',         use:'se tira encima', price: 35 },
  { id:'pinata',     name:'Piñata',      use:'le pega',        price: 50 },
];
STYLE_ITEMS.push(...FURNI_ITEMS.map(it => ({ ...it, kind: 'furni' })));

/* Un píxel del arte de los muebles mide lo mismo que uno de la mascota
   adulta: así todo en la pieza se ve del mismo "grano". */
function furniDeviceScale(){ return stageDeviceScale('adult'); }
function furniK(){ return furniDeviceScale() / DPR; }   // px CSS por píxel del arte

const FP = {
  O: '#2b1b2e',
  wood: '#b9774a', woodL: '#d99a66', woodD: '#8a5233',
  white: '#f4efe9', whiteL: '#ffffff', gray: '#cfc8d6', grayD: '#8d86a0',
  red: '#e8475a', redL: '#ff7b8a', redD: '#b02a3f', pink: '#ff9ec4', pinkL: '#ffc6dc',
  blue: '#5aa7ff', blueL: '#8cc4ff', blueD: '#3a6fd0',
  yel: '#ffd25a', yelL: '#ffe79a', green: '#5ccf7a', greenD: '#3a9e58',
  metal: '#9aa3b5', metalD: '#5f6678', glass: '#bfe6ff', water: '#8fd3ff',
  box: '#d39a5c', boxL: '#e8b57d', tape: '#efcf9a', dark: '#2a2433', rope: '#d8cbb0',
  orange: '#ff8a3d', orangeL: '#ffb36b', purple: '#8c6bff', purpleL: '#b39cff',
  sand: '#efd9a0', sandD: '#d9bf7f', brown: '#a0622d', brownL: '#c47a3a',
};

/* Pincel de pixel art: todo en píxeles del arte, sobre un canvas a 1:1. */
function pxPainter(ctx){
  const r = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  /* Rectángulo con contorno y, si se pasa, una fila de brillo arriba. */
  const box = (x, y, w, h, fill, hi) => {
    r(x, y, w, h, FP.O); r(x + 1, y + 1, w - 2, h - 2, fill);
    if (hi) r(x + 1, y + 1, w - 2, 1, hi);
  };
  /* Círculo relleno con contorno. `fill` puede ser una función (x, y) → color
     para pintar franjas, cuadrículas o reflejos. */
  const disc = (cx, cy, rad, fill) => {
    for (let y = Math.floor(cy - rad); y <= Math.ceil(cy + rad); y++){
      for (let x = Math.floor(cx - rad); x <= Math.ceil(cx + rad); x++){
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d <= rad) r(x, y, 1, 1, d > rad - 1 ? FP.O : (typeof fill === 'function' ? fill(x, y) : fill));
      }
    }
  };
  /* Elipse rellena con contorno. */
  const ell = (cx, cy, rx, ry, fill) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++){
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++){
        const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry);
        const edge = Math.hypot((x + 0.5 - cx) / Math.max(1, rx - 1), (y + 0.5 - cy) / Math.max(1, ry - 1));
        if (d <= 1) r(x, y, 1, 1, edge > 1 ? FP.O : (typeof fill === 'function' ? fill(x, y) : fill));
      }
    }
  };
  /* Anillo (solo el borde de un círculo), de grosor t. */
  const ring = (cx, cy, rad, c, t = 1) => {
    for (let y = Math.floor(cy - rad); y <= Math.ceil(cy + rad); y++){
      for (let x = Math.floor(cx - rad); x <= Math.ceil(cx + rad); x++){
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d <= rad && d > rad - t) r(x, y, 1, 1, c);
      }
    }
  };
  const line = (x0, y0, x1, y1, c, t = 1) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= n; i++){
      r(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), t, t, c);
    }
  };
  /* Una fila con contorno en las puntas: para siluetas que se arman de a fila
     (la punta del cohete, el balancín). */
  const span = (y, x0, x1, fill) => { r(x0, y, x1 - x0 + 1, 1, fill); r(x0, y, 1, 1, FP.O); r(x1, y, 1, 1, FP.O); };
  return { r, box, disc, ell, ring, line, span };
}

/* Dibuja una pieza a 1:1 en un canvas chico; se cachea por mueble y pieza. */
const furniArtCache = new Map();
function furniPartArt(id, part){
  const key = id + ':' + part.id;
  let c = furniArtCache.get(key);
  if (c) return c;
  const art = FURNI_ART[id];
  c = document.createElement('canvas');
  c.width = art.w; c.height = art.h;
  part.draw(pxPainter(c.getContext('2d')));
  furniArtCache.set(key, c);
  return c;
}

/* Miniatura para la tienda: las piezas que se ven en reposo. */
const furniThumbCache = new Map();
function furniThumb(id){
  if (furniThumbCache.has(id)) return furniThumbCache.get(id);
  const art = FURNI_ART[id];
  const c = document.createElement('canvas');
  c.width = art.w; c.height = art.h;
  const ctx = c.getContext('2d');
  const rt = furniRestState(id);
  for (const part of art.parts) if (partVisible(part, rt, 0)) ctx.drawImage(furniPartArt(id, part), 0, 0);
  const url = c.toDataURL();
  furniThumbCache.set(id, url);
  return url;
}

/* ---------- estado en vivo de cada mueble puesto ----------
   Dónde está y qué está haciendo (pelota corrida, columpio balanceándose,
   tele prendida, piñata rota...). Se rearma en cada renderFurniture(). Cada
   arte puede declarar `init(rt)` (cómo queda en reposo) y lo que haga falta
   en el resto del rt; resetFurniRt() lo devuelve al reposo cuando nadie lo
   está usando. */
let furniRt = [];

function furniRestState(id){
  const rt = { id, ballDx: 0, ballY: 0, ballRot: 0, ballAnim: null, ballFollow: null,
    swing: 0, on: false, food: false, users: new Set() };
  const art = FURNI_ART[id];
  if (art && art.init) art.init(rt);
  return rt;
}

function resetFurniRt(rt){
  /* La pelota se queda donde quedó. Si iba volando sigue su vuelo; si la
     llevaba alguien (en la cabeza, en las manos), se cae al piso. */
  const b = ballNow(rt);
  const keep = { id: rt.id, entry: rt.entry, x: rt.x, els: rt.els, users: rt.users, removed: rt.removed,
    ballDx: b.dx, ballY: rt.ballFollow ? b.y : rt.ballY, ballRot: rt.ballRot,
    ballAnim: rt.ballFollow ? null : rt.ballAnim, _bx: rt._bx };
  for (const k of Object.keys(rt)) delete rt[k];
  Object.assign(rt, furniRestState(keep.id), keep);
  /* Quedó (o iba a quedar) en alto, en una cabeza o en unas manos: se cae. */
  if (rt.ballY > 0 || (rt.ballAnim && rt.ballAnim.y1 > 0)) ballTo(rt, { dx: 0, y: 0, h: 4, bounces: 2, ms: 650 });
}

/* ---------- la pelota ----------
   Las pelotas (pelota, balón, pelota de playa) se mueven de verdad: ruedan,
   botan, vuelan y se pueden llevar encima. El estado vive en el rt:
   - ballDx / ballY: dónde quedó (px CSS desde el centro del mueble, y alto
     sobre el piso);
   - ballAnim: un movimiento en curso (rodar o volar, con botes);
   - ballFollow: va pegada a un personaje (en la cabeza, en las manos, a los
     pies empujándola).
   ballNow() calcula dónde está en este instante; la pieza la dibuja ahí
   (pose) y los guiones la apuntan con ballAbsX(). */

const BALL_BOUNCE_KEEP = 0.42;   // cada bote llega al 42% del alto del anterior

function ballNow(rt, now = performance.now()){
  const f = rt.ballFollow;
  if (f){
    const fw = floorWidth();
    return { dx: (clampX(f.act.x + f.dx * f.act.dir / fw) - rt.x) * fw, y: f.act.y + f.dy };   // nunca sale del piso
  }
  const a = rt.ballAnim;
  if (!a) return { dx: rt.ballDx || 0, y: rt.ballY || 0 };
  const u = Math.min(1, (now - a.t0) / a.ms);
  if (u >= 1){
    rt.ballDx = a.dx1; rt.ballY = a.y1; rt.ballAnim = null;
    return { dx: a.dx1, y: a.y1 };
  }
  /* Rodar frena (sale rápido y se detiene); volar va parejo. */
  const e = a.ease === 'out' ? 1 - (1 - u) * (1 - u) : u;
  let hop = 0;
  for (const sg of a.segs){
    if (u < sg.u1){ const v = (u - sg.u0) / (sg.u1 - sg.u0); hop = 4 * sg.h * v * (1 - v); break; }
  }
  return { dx: lerp(a.dx0, a.dx1, e), y: lerp(a.y0, a.y1, u) + hop };
}

function ballAbsX(rt){ return rt.x + ballNow(rt).dx / floorWidth(); }
function ballIdle(rt){ return !rt.ballAnim && !rt.ballFollow; }

/* Mueve la pelota. `o.x` = destino en fracción del piso (o `o.dx` = cuánto
   correrla, px CSS), `o.y` = alto al que llega (0 = el piso), `o.h` = alto
   del arco, `o.bounces` = botes después del primer arco, cada uno más bajo
   (BALL_BOUNCE_KEEP) y más corto (la duración va con la raíz del alto, como
   una caída de verdad). Nunca sale del piso. */
function ballTo(rt, o){
  const now = performance.now();
  const cur = ballNow(rt, now);
  rt.ballFollow = null;
  const fw = floorWidth();
  const target = o.x !== undefined ? o.x : rt.x + (cur.dx + (o.dx || 0)) / fw;
  const dx1 = (clampX(target) - rt.x) * fw;
  /* Que el arco no se salga por arriba de la pieza (en un teléfono chico el
     piso mide ~150 px de alto). */
  const top = floorHeight() - FURNI_ART[rt.id].w * furniK() - 6;
  const h = Math.max(0, Math.min(o.h || 0, top - Math.max(cur.y, o.y || 0))), n = o.bounces || 0;
  const hs = [h];
  for (let i = 0; i < n; i++) hs.push(hs[i] * BALL_BOUNCE_KEEP);
  const w = hs.map(x => Math.sqrt(Math.max(x, 0.5)));
  const tot = w.reduce((a, b) => a + b, 0);
  let acc = 0;
  const segs = hs.map((hh, i) => { const u0 = acc / tot; acc += w[i]; return { u0, u1: acc / tot, h: hh }; });
  rt.ballAnim = { t0: now, ms: o.ms || 600, dx0: cur.dx, dx1, y0: cur.y, y1: o.y || 0, ease: o.ease || 'lin', segs };
}

/* La pelota va pegada a un personaje: `dx` hacia adelante (se da vuelta con
   él) y `dy` de alto sobre sus pies. */
function ballFollow(rt, act, dx, dy){
  const cur = ballNow(rt);
  rt.ballDx = cur.dx; rt.ballY = cur.y; rt.ballAnim = null;
  rt.ballFollow = { act, dx, dy };
}

/* La suelta: si estaba en alto, se cae y bota. */
function ballRelease(rt){
  if (!rt.ballFollow) return;
  const cur = ballNow(rt);
  rt.ballFollow = null;
  rt.ballDx = cur.dx; rt.ballY = cur.y;
  if (cur.y > 0) ballTo(rt, { dx: 0, y: 0, h: Math.min(10, 3 + cur.y * 0.15), bounces: 2, ms: 420 + cur.y * 6 });
}

function partVisible(part, rt, now){
  if (!part.show) return true;
  return typeof part.show === 'function' ? !!part.show(rt, now) : !!rt[part.show];
}

function renderFurniture(){
  for (const rt of furniRt) rt.removed = true;
  furniRt = [];
  const back = document.getElementById('furniBack');
  const mid = document.getElementById('furniMid');
  const front = document.getElementById('furniFront');
  back.innerHTML = ''; mid.innerHTML = ''; front.innerHTML = '';
  const s = furniDeviceScale(), k = s / DPR;
  for (const entry of state.style.furniture){
    const id = entry.id;
    const art = FURNI_ART[id];
    if (!art) continue;
    const rt = Object.assign(furniRestState(id), { entry, x: entry.x, els: {} });
    let lastBack = null;
    for (const part of art.parts){
      /* Backing store en píxeles físicos y escala entera, igual que la
         mascota: cada píxel del arte ocupa exactamente s píxeles de pantalla. */
      const c = document.createElement('canvas');
      c.width = art.w * s; c.height = art.h * s;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(furniPartArt(id, part), 0, 0, c.width, c.height);
      c.className = 'furni-part' + (part.flicker ? ' flicker' : '');
      c.style.width = (art.w * k) + 'px';
      c.style.height = (art.h * k) + 'px';
      c.style.left = (rt.x * 100) + '%';
      if (part.pivot) c.style.transformOrigin = `${part.pivot[0] * k}px ${part.pivot[1] * k}px`;
      /* Los "libres" (pelota, plato) van en una capa propia, delante de los
         otros muebles y detrás de la mascota: se pueden encimar. Las piezas
         `z:'front'` (el borde de la bañera y de la piscina) arrancan atrás
         como todo lo demás: updateFurniture() las pasa adelante solo
         mientras alguien está adentro usándolas. `anchor` es la pieza tras
         la que vuelven a su lugar en la capa de atrás. */
      (art.free ? mid : back).appendChild(c);
      c.addEventListener('pointerdown', e => startFurniDrag(rt, e));
      rt.els[part.id] = { el: c, part, anchor: part.z === 'front' ? lastBack : null };
      if (part.z !== 'front') lastBack = c;
    }
    furniRt.push(rt);
  }
  updateFurniture();
}

/* Lo que cambia cuadro a cuadro: solo transform y visibilidad, nada que
   obligue a recalcular el layout. Cada pieza puede tener `pose(rt, now, k,
   dt)` → { x, y, r, sx, sy } (px CSS, radianes, escala): así se mueven la
   pelota, el asiento del columpio, el pez, el cohete, la rueda... Las
   traslaciones se redondean a píxel físico para que el pixel art no se
   embarre en reposo. */
let furniLastNow = 0;
function updateFurniture(now = performance.now()){
  const dt = Math.min(0.1, Math.max(0, (now - (furniLastNow || now)) / 1000));
  furniLastNow = now;
  const k = furniK();
  const px = v => Math.round(v * DPR) / DPR;
  let party = false;
  const front = document.getElementById('furniFront');
  for (const rt of furniRt){
    const inside = furniOccupied(rt, k);
    for (const { el, part, anchor } of Object.values(rt.els)){
      if (part.z === 'front'){
        if (inside && el.parentElement !== front) front.appendChild(el);
        else if (!inside && el.parentElement === front) anchor ? anchor.after(el) : document.getElementById('furniBack').appendChild(el);
      }
      let t = 'translateX(-50%)';
      const p = part.pose ? part.pose(rt, now, k, dt) : null;
      if (p){
        if (p.x || p.y) t += ` translate(${px(p.x || 0)}px, ${px(-(p.y || 0))}px)`;
        if (p.r) t += ` rotate(${p.r.toFixed(4)}rad)`;
        if ((p.sx !== undefined && p.sx !== 1) || (p.sy !== undefined && p.sy !== 1)) t += ` scale(${(p.sx ?? 1).toFixed(3)}, ${(p.sy ?? 1).toFixed(3)})`;
      }
      if (el._t !== t){ el.style.transform = t; el._t = t; }
      const visible = partVisible(part, rt, now);
      if (el._v !== visible){ el.classList.toggle('hidden', !visible); el._v = visible; }
    }
    if (rt.id === 'disco' && rt.on) party = true;
  }
  /* La bola disco prendida llena la pieza de luces de colores (CSS). */
  if (updateFurniture._party !== party){
    updateFurniture._party = party;
    document.getElementById('creatureFloor').classList.toggle('party', party);
  }
}

/* ¿Hay alguien adentro de este mueble usándolo? Hacen falta tres cosas:
   que su actividad sea en este mueble (pasar caminando por delante no
   cuenta), estar dentro de su ancho (parado al lado esperando para entrar,
   o recién salido, tampoco) y estar sobre el piso: todos los guiones dejan
   al personaje adentro un poco en alto (f.y(1) a f.y(6)), y sin esto el
   borde lo tapaba mientras salía caminando desde encima del mueble para
   ir a tomar impulso. Al entrar o salir de un salto el cambio cae a mitad
   del salto, con el personaje en el aire por encima del borde. */
function furniOccupied(rt, k){
  if (!FURNI_ART[rt.id].parts.some(p => p.z === 'front')) return false;
  const half = FURNI_ART[rt.id].w * k / 2;
  return allActors().some(a => a.activity && a.activity.rt === rt && !a.hidden && a.y > 0.5 &&
    Math.abs(a.x - rt.x) * (a.activity.fw || floorWidth()) < half);
}

function furniPlaced(id){ return furniRt.find(rt => rt.id === id && !rt.removed); }

/* ---------- ubicación libre y modo acomodar ---------- */

/* ¿Choca el mueble `id` puesto en `x` con alguno de los otros? Los "libres"
   (pelota, plato) no chocan con nada: se pueden encimar. Con `strict` sí
   chocan: al PONER un mueble se le busca un lugar despejado igual, si no la
   pelota y el plato aparecían uno encima del otro en el centro; encimarlos
   queda para cuando uno los arrastra a propósito. Todo en fracción del
   piso, usando el ancho real del dibujo. */
function furniOverlaps(id, x, fw, strict){
  if (FURNI_ART[id].free && !strict) return false;
  const k = furniK();
  const half = FURNI_ART[id].w * k / 2;
  return state.style.furniture.some(f => {
    if (f.id === id || (FURNI_ART[f.id].free && !strict)) return false;
    const otherHalf = FURNI_ART[f.id].w * k / 2;
    return Math.abs(f.x - x) * fw < half + otherHalf + FURNI_GAP_PX;
  });
}

/* Límites para que el mueble entero quede dentro del piso. */
function furniBounds(id, fw){
  const half = FURNI_ART[id].w * furniK() / 2 + 2;
  return [Math.min(0.5, half / fw), Math.max(0.5, 1 - half / fw)];
}

/* El lugar libre más cercano a `x0`, buscando hacia los dos lados; null si
   no cabe en ninguna parte. */
function findFurniSpot(id, x0, strict){
  const fw = floorWidth();
  const [lo, hi] = furniBounds(id, fw);
  const start = Math.min(hi, Math.max(lo, x0));
  for (let d = 0; d <= 1; d += 0.005){
    for (const x of [start - d, start + d]){
      if (x >= lo && x <= hi && !furniOverlaps(id, x, fw, strict)) return x;
    }
  }
  return null;
}

/* Modo acomodar: se entra desde Personalizar. La hoja se cierra para ver el
   piso entero (la hoja tapaba justo el piso), los personajes quedan quietos
   y transparentes para no estorbar, y los mandos de abajo se cambian por
   "Listo" (los mismos showGameControls de los minijuegos), así no se puede
   abrir otra cosa a medio acomodar. */
let arranging = false;

function enterArrange(){
  hideOverlay();
  for (const act of allActors()){ if (act.activity) endFurniActivity(act); act.y = 0; }
  arranging = true;
  document.getElementById('creatureFloor').classList.add('arranging');
  showGameControls(`
    <div class="game-hint">Arrastra los muebles por el piso</div>
    <button class="gbtn gbtn-lg" id="btnArrangeDone">Listo</button>
  `);
  document.getElementById('btnArrangeDone').addEventListener('click', () => { exitArrange(); openPersonalize(); });
  renderFurniture();
}

function exitArrange(){
  if (!arranging) return;
  arranging = false;
  document.getElementById('creatureFloor').classList.remove('arranging');
  hideGameControls();
  saveState();
  renderFurniture();
}

/* Arrastre de un mueble, solo en modo acomodar. Mientras se arrastra se
   marca en rojo si choca con otro; al soltarlo, si choca, se corre al lugar
   libre más cercano (y si no hay ninguno, vuelve a donde estaba). */
function startFurniDrag(rt, e){
  if (!arranging || rt.removed) return;
  e.preventDefault();
  const rect = document.getElementById('creatureFloor').getBoundingClientRect();
  const fw = rect.width;
  const [lo, hi] = furniBounds(rt.id, fw);
  const x0 = rt.x, px0 = e.clientX;
  const parts = Object.values(rt.els).map(p => p.el);
  const place = x => {
    rt.x = x;
    for (const el of parts) el.style.left = (x * 100) + '%';
  };
  parts.forEach(el => el.classList.add('dragging'));
  const move = ev => {
    place(Math.min(hi, Math.max(lo, x0 + (ev.clientX - px0) / fw)));
    const choca = furniOverlapsAt(rt, fw);
    parts.forEach(el => el.classList.toggle('blocked', choca));
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    let x = rt.x;
    if (furniOverlapsAt(rt, fw)) x = findFurniSpotFrom(rt, x) ?? x0;
    place(x);
    rt.entry.x = x;
    parts.forEach(el => el.classList.remove('dragging', 'blocked'));
    saveState();
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}

/* Mientras se arrastra, la posición en vivo está en rt.x y no en el save:
   se prueba con esa. */
function furniOverlapsAt(rt, fw){
  const guardado = rt.entry.x;
  rt.entry.x = rt.x;
  const choca = furniOverlaps(rt.id, rt.x, fw);
  rt.entry.x = guardado;
  return choca;
}
function findFurniSpotFrom(rt, x){
  const guardado = rt.entry.x;
  rt.entry.x = x;
  const spot = findFurniSpot(rt.id, x);
  rt.entry.x = guardado;
  return spot;
}

/* ---------- tocar un mueble: ir a usarlo ----------
   Fuera de los menús y del modo acomodar, tocar un mueble manda a la mascota
   a usarlo en el momento (una visita, con los mismos guiones de siempre). Si
   el acompañante ya estaba ahí, lo usan de a dos.

   Los muebles no reciben toques (sus capas van con pointer-events:none, si
   no taparían a la mascota y la caca), así que se miran a mano en un listener
   de captura sobre #creatureFloor, que corre antes que el de la mascota: un
   toque sobre el cuerpo de un personaje sigue siendo un mimo, y solo si cae
   en un mueble (en un píxel pintado, con FURNI_TAP_SLOP de tolerancia para
   que las piezas finas —el pie de la bola disco, la cuerda de la piñata— se
   puedan tocar con el dedo) se lo come el mueble. */

const FURNI_TAP_SLOP = 8;   // px CSS de tolerancia alrededor de lo pintado

/* ¿El punto (clientX/Y) cae sobre el cuerpo de un personaje? Se usa la caja
   del frame dibujado (lo que devuelve drawSprite), un poco achicada por los
   costados porque la celda de 32 trae aire a los lados. */
function spriteHit(canvas, drawn, x, y){
  if (!drawn || !drawn.frame) return false;
  const r = canvas.getBoundingClientRect();
  const k = r.width / drawn.box.w;
  const w = drawn.frame.w * drawn.scale * k, h = drawn.frame.h * drawn.scale * k;
  const left = r.left + drawn.dx * k + w * 0.15, right = left + w * 0.7;
  const top = r.top + drawn.dy * k + h * 0.1, bottom = r.top + (drawn.dy * k) + h;
  return x >= left && x <= right && y >= top && y <= bottom;
}

/* ¿Hay algo pintado de esta pieza cerca del punto? Lee los píxeles del canvas
   de la pieza (arte dibujado con código: nunca está "contaminado", también
   anda con file://). Si el navegador no deja leer, cuenta la caja entera. */
function partHit(el, x, y){
  const r = el.getBoundingClientRect();
  if (x < r.left - FURNI_TAP_SLOP || x > r.right + FURNI_TAP_SLOP ||
      y < r.top - FURNI_TAP_SLOP || y > r.bottom + FURNI_TAP_SLOP) return false;
  try {
    const sx = el.width / r.width, sy = el.height / r.height;
    const cx = Math.round((x - r.left) * sx), cy = Math.round((y - r.top) * sy);
    const rx = Math.ceil(FURNI_TAP_SLOP * sx), ry = Math.ceil(FURNI_TAP_SLOP * sy);
    const x0 = Math.max(0, cx - rx), y0 = Math.max(0, cy - ry);
    const x1 = Math.min(el.width, cx + rx + 1), y1 = Math.min(el.height, cy + ry + 1);
    if (x1 <= x0 || y1 <= y0) return false;
    const data = el.getContext('2d').getImageData(x0, y0, x1 - x0, y1 - y0).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return true;
    return false;
  } catch (e) { return true; }
}

/* El mueble bajo el punto, o null. Si hay dos encimados gana el de adelante
   (borde de la bañera, después los libres, después el resto). */
function furniAtPoint(x, y){
  const layerRank = { furniFront: 0, furniMid: 1, furniBack: 2 };
  let best = null, bestRank = 9;
  for (const rt of furniRt){
    if (rt.removed) continue;
    for (const { el } of Object.values(rt.els)){
      if (el._v === false || el.classList.contains('hidden')) continue;
      const rank = layerRank[el.parentElement && el.parentElement.id] ?? 3;
      if (rank < bestRank && partHit(el, x, y)){ best = rt; bestRank = rank; }
    }
  }
  return best;
}

/* Por qué no puede ir ahora, o null si puede. */
function furniCommandBlocked(){
  const mood = displayMood();
  if (state.sleeping || mood === 'sleepy') return 'Shh… está durmiendo 💤';
  if (mood === 'sick') return 'Se siente mal: primero, una medicina 💊';
  if (isExhausted()) return 'Está agotado: lo que necesita es dormir 💤';
  if (mood === 'sad') return 'Está triste, no tiene ganas de jugar…';
  return null;
}

function commandFurniVisit(rt){
  const art = FURNI_ART[rt.id];
  /* Destello en el mueble: se ve que el toque entró, vaya o no. */
  for (const { el } of Object.values(rt.els)){
    el.classList.remove('poked'); void el.offsetWidth; el.classList.add('poked');
    el.addEventListener('animationend', () => el.classList.remove('poked'), { once: true });
  }
  const no = furniCommandBlocked();
  if (no){ say(no); return; }
  if (!art.visits || !art.visits.length) return;
  petAction = null;
  if (walker.activity && walker.activity.rt === rt && walker.activity.kind !== 'eat' && walker.activity.kind !== 'clean'){
    petFx('❗', walker);   // ya está en eso
    return;
  }
  if (walker.activity) endFurniActivity(walker);
  const now = performance.now();
  /* Si el acompañante está libre o ya jugando ahí solo, lo usan de a dos. */
  const b = typeof buddyActive === 'function' && buddyActive() ? buddy : null;
  const buddyHere = b && b.activity && b.activity.rt === rt && b.activity.kind === 'visit';
  const buddyFree = b && !b.activity && !b.action && b.y === 0;
  if (art.duos && art.duos.length && (buddyHere || (buddyFree && Math.random() < 0.5))){
    if (b.activity) endFurniActivity(b, false);
    startFurniDuo(rt, walker, b);
  } else {
    /* Lo que hubiera en el mueble se corre: lo pidió quien juega. */
    for (const act of allActors()) if (act !== walker && act.activity && act.activity.rt === rt) endFurniActivity(act);
    startFurniActivity(rt, 'visit', walker);
  }
  /* Si estaba arriba de otro mueble, primero se baja: si no, el primer
     paso (caminar) lo lleva por el aire. */
  for (const act of allActors()){
    if (act.activity && act.activity.rt === rt && act.y > 1) act.activity.steps.unshift({ hop: { x: act.x, y: 0 }, ms: 300, h: 6 });
  }
  walker.lastVisit = rt.id;
  petFx('❗', walker);
  if (typeof socialNextAt !== 'undefined') socialNextAt = Math.max(socialNextAt, now + 4000);
}

function furniTapTarget(e){
  if (!state || gameOver || arranging || activeMinigame || displayStage() === 'egg') return null;
  if (e.target.closest && e.target.closest('.poop-fx, .gift-fx')) return null;
  const x = e.clientX, y = e.clientY;
  /* Tocar el cuerpo de un personaje sigue siendo tocarlo a él. */
  if (spriteHit(document.getElementById('petCanvas'), walker.drawn, x, y)) return null;
  if (typeof buddy !== 'undefined' && buddyActive() &&
      spriteHit(document.getElementById('buddyCanvas'), buddy.drawn, x, y)) return null;
  return furniAtPoint(x, y);
}

if (typeof window !== 'undefined'){
  window.addEventListener('DOMContentLoaded', () => {
    const floor = document.getElementById('creatureFloor');
    floor.addEventListener('click', e => {
      const rt = furniTapTarget(e);
      if (!rt) return;
      e.stopPropagation();   // ni mimo ni limpiar la caca de pasada
      commandFurniVisit(rt);
    }, true);
    /* Con mouse, la manito avisa que el mueble se puede tocar. */
    if (window.matchMedia && window.matchMedia('(hover: hover)').matches){
      floor.addEventListener('mousemove', e => {
        const on = !!furniTapTarget(e);
        if (floor._hand !== on){ floor._hand = on; floor.classList.toggle('furni-hover', on); }
      });
    }
  });
}

/* ===================== Actores =====================
   Un "actor" es un personaje en la pieza: la mascota (`walker`, app.js) o
   el acompañante (`buddy`, duo.js). Los dos tienen la misma forma (x, y,
   dir, activity, anim...) y todo el motor de acá recibe el actor, así un
   mueble, un paseo o un juego entre los dos se programan una sola vez. */

function allActors(){
  return (typeof buddyActive === 'function' && buddyActive()) ? [walker, buddy] : [walker];
}
function actorStage(act){ return act.isMain ? displayStage() : act.stage; }
function actorCssH(act){ return STAGE_CSS_PX[actorStage(act)] || 64; }

let furniFloorW = 0;
function floorWidth(){
  const w = document.getElementById('creatureFloor').clientWidth;
  if (w > 0) furniFloorW = w;
  return furniFloorW || 300;
}

let furniFloorH = 0;
function floorHeight(){
  const h = document.getElementById('creatureFloor').clientHeight;
  if (h > 0) furniFloorH = h;
  return furniFloorH || 150;
}

const clampX = x => Math.min(0.96, Math.max(0.04, x));
const lerp = (a, b, t) => a + (b - a) * t;
const pickOne = list => list[Math.floor(Math.random() * list.length)];

/* Paseo sin rumbo: camina a un punto al azar, se queda quieto un rato y
   vuelve a elegir. Al llegar llama a `onArrive()`, que puede arrancar una
   rutina (visita a un mueble, juego con el otro) y devolver true. */
function wanderActor(act, dt, now, onArrive){
  if (now < act.pauseUntil){ act.frame = 0; return; }
  const dist = act.targetX - act.x;
  if (Math.abs(dist) < 0.01){
    if (onArrive && onArrive()) return;
    act.pauseUntil = now + 1200 + Math.random() * 2200;
    act.targetX = 0.12 + Math.random() * 0.76;
    act.dir = act.targetX > act.x ? 1 : -1;
    return;
  }
  act.dir = dist > 0 ? 1 : -1;
  act.x += act.dir * dt * 0.09;
  if (now - act.lastFrameSwitch > 220){
    act.lastFrameSwitch = now;
    act.frame = act.frame === 1 ? 2 : 1;
  }
}

/* Ayudantes que reciben los guiones: pasan de píxeles del arte del mueble a
   posición en la pieza. */
function furniHelpers(rt, act, partner){
  const k = furniK(), fw = floorWidth();
  return { rt, fw, k, act, partner,
    x: dx => clampX(rt.x + dx * k / fw),   // píxeles del arte desde el centro del mueble → fracción del piso
    dx: d => d * k / fw,
    y: dy => dy * k,                       // alto en píxeles del arte → px CSS
    isBuddy: !act.isMain,
    night: isNightMode(),
    h: actorCssH(act),                     // alto en px CSS del que hace el guion
  };
}

/* Arranca una rutina. `opts.duo` es el objeto compartido de una rutina de a
   dos (sus `sync` se anotan ahí); `opts.partner`, el otro actor. */
function startActivity(act, steps, opts = {}){
  const { rt = null, kind = 'visit', duo = null, partner = null } = opts;
  if (act.activity) endFurniActivity(act, false);
  act.activity = { rt, kind, steps, i: 0, st: 0, fw: floorWidth(), duo, partner };
  act.pauseUntil = 0;
  if (rt) rt.users.add(act.key);
}

function startFurniActivity(rt, kind, act = walker, chain = null){
  const art = FURNI_ART[rt.id];
  const list = kind === 'visit' ? art.visits : art.routines;
  const i = pickOtherIndex(list.length, chain && chain.last);
  startActivity(act, list[i](furniHelpers(rt, act)), { rt, kind });
  if (kind === 'visit') act.activity.chain = { t0: chain ? chain.t0 : performance.now(), last: i };
}

/* Un índice al azar, distinto de `avoid` si hay más de uno. */
function pickOtherIndex(n, avoid){
  if (n <= 1 || avoid === undefined || avoid === null) return Math.floor(Math.random() * n);
  const i = Math.floor(Math.random() * (n - 1));
  return i >= avoid ? i + 1 : i;
}

/* Rutina de a dos sobre un mueble: los dos guiones salen del mismo sorteo y
   comparten el objeto `duo`, donde cada `sync` anota que llegó. */
function startFurniDuo(rt, a, b, chain = null){
  const list = FURNI_ART[rt.id].duos;
  const i = pickOtherIndex(list.length, chain && chain.last);
  const d = list[i](furniHelpers(rt, a, b));
  const duo = newDuo(a, b);
  /* Terminan juntos: si no, el que acaba primero se va a pasear y el
     encadenado (ver finishFurniActivity) no lo encuentra. */
  startActivity(a, [...d.a, S.sync('__fin')], { rt, kind: 'duo', duo, partner: b });
  startActivity(b, [...d.b, S.sync('__fin')], { rt, kind: 'duo', duo, partner: a });
  a.activity.chain = b.activity.chain = { t0: chain ? chain.t0 : performance.now(), last: i, a, b };
}

function newDuo(a, b){
  return { reached: { [a.key]: new Set(), [b.key]: new Set() }, data: {} };
}

/* Termina la rutina de un actor. Si era de a dos y se cortó (no terminó
   sola), corta también la del otro: que uno se quede esperando en un `sync`
   para siempre se ve roto. */
function endFurniActivity(act = walker, cascade = true){
  const a = act.activity;
  if (!a) return;
  if (a.st){ const s = a.steps[a.i]; if (s && s.end) s.end(a.rt, act, a); }
  act.activity = null;
  act.anim = null;
  act.frame = 0;
  act.hidden = false;
  if (a.rt){
    a.rt.users.delete(act.key);
    if (!a.rt.users.size) resetFurniRt(a.rt);
  }
  const now = performance.now();
  act.targetX = act.x;
  act.pauseUntil = now + 900;
  act.nextVisitAt = now + FURNI_VISIT_GAP_MS * (0.6 + Math.random() * 0.8);
  const p = a.partner;
  if (cascade && a.duo && p && p.activity && p.activity.duo === a.duo) endFurniActivity(p, false);
}

/* Terminó todos sus pasos (no se cortó). */
function finishFurniActivity(act){
  const a = act.activity;
  /* Visita corta: encadena otra del mismo mueble (ver FURNI_VISIT_MIN_MS). */
  const ch = a.chain;
  if (ch && a.rt && !a.rt.removed && performance.now() - ch.t0 < FURNI_VISIT_MIN_MS && act.y < 1){
    if (a.kind === 'visit'){
      endFurniActivity(act, false);
      startFurniActivity(a.rt, 'visit', act, ch);
      return;
    }
    const p = a.partner;
    if (a.kind === 'duo' && p && p.activity && p.activity.duo === a.duo && p.y < 1){
      endFurniActivity(act, false);
      endFurniActivity(p, false);
      startFurniDuo(a.rt, ch.a, ch.b, ch);
      return;
    }
  }
  if (act.isMain && (a.kind === 'visit' || a.kind === 'duo' || a.kind === 'social')) furniJoy();
  endFurniActivity(act, false);
}

/* Felicidad por visita, con tope por hora real (Date.now(), igual que el
   Megajuego: es un ritmo de quien juega). */
function furniJoy(){
  const now = Date.now();
  const j = state.furniJoy && typeof state.furniJoy === 'object' ? state.furniJoy : { since: now, n: 0 };
  if (now - j.since >= 3600000 || now < j.since){ j.since = now; j.n = 0; }
  if (j.n < FURNI_JOY_PER_HOUR){
    j.n++;
    state.happiness = clamp(state.happiness + FURNI_JOY);
  }
  state.furniJoy = j;
}

function setWalkerAnim(name, now, act = walker){
  if (act.anim !== name){ act.anim = name; act.animT0 = now; }
}

/* Partícula sobre la cabeza de un personaje, donde sea que esté parado. */
function petFx(emoji, act = walker){
  const floor = document.getElementById('creatureFloor');
  const el = document.createElement('div');
  el.className = 'fx';
  el.textContent = emoji;
  el.style.left = `calc(${act.x * 100}% + ${Math.round(Math.random() * 24 - 12)}px)`;
  el.style.bottom = (4 + act.y + actorCssH(act) * 0.7) + 'px';
  floor.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

/* Un valor del guion puede ser fijo o una función que se evalúa al empezar
   el paso (para apuntar a donde está el otro en ese momento). */
const resolveStep = (v, a, act) => typeof v === 'function' ? v(a, act) : v;

/* Corre un cuadro de la rutina de `act`. Pasos (todos opcionales salvo el
   que define el tipo):
   - go: x | fn            caminar hasta x (fracción del piso) en el alto actual
   - chase / flee: ms      perseguir al otro / escaparse de él (hasta `catchDist`)
   - hop: {x, y} | fn      salto en parábola de alto `h` (px CSS) en `ms`
   - slide: {x, y} | fn    movimiento recto (subir una escalera, tirarse)
   - bounce: n             n saltos en el lugar (`onBounce` en cada uno)
   - kick: dx              patear la pelota del mueble dx px CSS (h/bounces: con botes)
   - ride: ms | until      ir montado en el otro (dx, dy)
   - sync: 'nombre'        esperar a que el otro llegue al mismo nombre
   - call: fn              ejecutar algo y seguir
   - (ninguno)             quedarse: anim, ms o until, dir ('partner' mira al
                           otro), flip (bailar), swing (columpio), track
                           (fn que fija x/y cada cuadro)
   En cualquiera: anim, fx + fxEvery (partículas), hide (desaparecer, por
   ejemplo adentro del cohete), start/end (rt, act, a), y para la pelota del
   mueble: ball (lanzarla, ver ballTo), follow: [dx, dy] (llevarla encima),
   release (soltarla); dir: 'ball' mira la pelota. */
function runFurniActivity(dt, now, act = walker){
  const a = act.activity;
  const s = a.steps[a.i];
  if (!s){ finishFurniActivity(act); return; }
  const partner = a.partner;
  if (!a.st){
    a.st = now; a.x0 = act.x; a.y0 = act.y; a.fxAt = now; a.flipAt = now;
    a.to = null; a.bounceN = -1; a.apexDone = false; a.kicked = false;
    if (s.hide !== undefined) act.hidden = s.hide;
    /* La pelota del mueble, en cualquier paso: lanzarla (`ball`), llevarla
       encima (`follow: [dx, dy]`, px CSS) o soltarla (`release`). */
    if (a.rt){
      if (s.release) ballRelease(a.rt);
      if (s.ball) ballTo(a.rt, resolveStep(s.ball, a, act));
      if (s.follow){ const fo = resolveStep(s.follow, a, act); ballFollow(a.rt, act, fo[0], fo[1]); }
    }
    if (s.start) s.start(a.rt, act, a);
    if (s.call){ s.call(a.rt, act, a); a.i++; a.st = 0; return; }
    if (s.fx && !s.fxEvery) petFx(pickOne(s.fx), act);
  }
  const el = now - a.st;
  const next = () => { if (s.end) s.end(a.rt, act, a); a.i++; a.st = 0; };
  const faceTo = x => { if (Math.abs(x - act.x) > 0.002) act.dir = x > act.x ? 1 : -1; };
  /* `dir`: 1 / -1, 'partner' (mira al otro) o 'ball' (mira la pelota). */
  const faceDir = () => {
    if (s.dir === 'partner'){ if (partner) faceTo(partner.x); }
    else if (s.dir === 'ball'){ if (a.rt) faceTo(ballAbsX(a.rt)); }
    else if (s.dir) act.dir = s.dir;
  };
  const anim = v => setWalkerAnim(typeof v === 'function' ? v(a, act) : v, now, act);
  if (s.fx && s.fxEvery && now - a.fxAt >= s.fxEvery){
    a.fxAt = now;
    petFx(pickOne(s.fx), act);
  }
  const visit = a.kind === 'visit' || a.kind === 'duo' || a.kind === 'social';

  if (s.go !== undefined){
    const tx = clampX(resolveStep(s.go, a, act));
    const d = tx - act.x;
    const step = dt * (s.speed || (visit ? 0.11 : 0.2));   // a una rutina va más apurada
    if (Math.abs(d) <= step){ act.x = tx; act.frame = 0; next(); return; }
    act.dir = d > 0 ? 1 : -1;
    act.x += act.dir * step;
    anim(s.anim || 'walk');
  } else if (s.chase !== undefined || s.flee !== undefined){
    const ms = s.chase ?? s.flee;
    const gap = partner ? partner.x - act.x : 0;
    const caught = Math.abs(gap) < (s.catchDist || 0.06);
    if (!partner || el >= ms || caught){ next(); return; }
    let dir = s.chase !== undefined ? Math.sign(gap) : -Math.sign(gap);
    /* Escapando contra la pared no hay a dónde ir: se queda acorralado. */
    if (s.flee !== undefined && ((dir < 0 && act.x <= 0.06) || (dir > 0 && act.x >= 0.94))) dir = 0;
    if (dir) act.dir = dir;
    act.x = clampX(act.x + dir * dt * (s.speed || 0.14));
    anim(s.anim || 'walk');
  } else if (s.hop || s.slide){
    if (!a.to) a.to = resolveStep(s.hop || s.slide, a, act);
    const to = a.to;
    const t = Math.min(1, el / s.ms);
    if (el < 20) faceTo(to.x);
    act.x = lerp(a.x0, to.x, t);
    act.y = lerp(a.y0, to.y, t) + (s.hop ? 4 * t * (1 - t) * (s.h ?? 16) : 0);
    anim(s.anim || (s.slide ? 'happy' : 'happy'));
    if (t >= 1){ act.y = to.y; next(); }
  } else if (s.bounce){
    const n = Math.floor(el / s.ms);
    if (n >= s.bounce){ act.y = a.y0; next(); return; }
    if (n !== a.bounceN){ a.bounceN = n; a.apexDone = false; if (s.onBounce) s.onBounce(a.rt, act, n); }
    const u = (el % s.ms) / s.ms;
    if (!a.apexDone && u >= 0.5){ a.apexDone = true; if (s.onApex) s.onApex(a.rt, act, n); }
    act.y = a.y0 + 4 * u * (1 - u) * s.h;
    faceDir();
    anim(s.anim ? s.anim : (u < 0.1 || u > 0.9 ? 'idle' : 'happy'));
  } else if (s.kick !== undefined){
    /* Patada: la pelota sale rápido y frena (con botes si se pide `h`). */
    if (!a.kicked){ a.kicked = true; ballTo(a.rt, { dx: s.kick, ms: s.ms, h: s.h, bounces: s.bounces, ease: s.h ? 'lin' : 'out' }); }
    faceDir();
    anim(el < 300 ? (s.anim || 'happy') : 'idle');
    if (el >= s.ms){ a.kicked = false; next(); }
  } else if (s.ride !== undefined){
    if (!partner){ next(); return; }
    act.x = partner.x + (s.dx || 0) * partner.dir / a.fw;
    act.y = partner.y + (typeof s.dy === 'function' ? s.dy() : (s.dy || 0));
    act.dir = partner.dir;
    anim(s.anim || 'happy');
    const done = typeof s.ride === 'function' ? s.ride(a, act) : el >= s.ride;
    if (done) next();
  } else if (s.sync !== undefined){
    a.duo.reached[act.key].add(s.sync);
    faceDir();
    anim(s.anim || 'idle');
    const pa = partner && partner.activity;
    if (!pa || pa.duo !== a.duo || a.duo.reached[partner.key].has(s.sync)) next();
  } else {
    faceDir();
    anim(s.anim || 'idle');
    if (s.flip && now - a.flipAt >= s.flip){ a.flipAt = now; act.dir *= -1; }
    if (s.swing){
      const th = s.swing.amp * Math.sin(2 * Math.PI * el / s.swing.period);
      a.rt.swing = th;
      /* rotate() positivo en CSS es horario: con el pivote arriba, el
         asiento se va a la IZQUIERDA. La mascota lo sigue. */
      act.x = a.x0 - s.swing.L * Math.sin(th) / a.fw;
      act.y = a.y0 + s.swing.L * (1 - Math.cos(th));
    }
    if (s.track){
      const p = s.track(a.rt, el, act, a, dt);
      if (p){
        if (p.x !== undefined) act.x = p.x;
        if (p.y !== undefined) act.y = p.y;
      }
    }
    const done = s.until ? s.until(a, act) : el >= s.ms;
    if (done){
      if (s.swing){ a.rt.swing = 0; act.x = a.x0; act.y = a.y0; }
      next();
    }
  }
}

/* Cuándo se corta una rutina a la mitad. La mascota: las de rutina (comer,
   limpiarse) no se cortan por estar triste o enferma, que es justo cuando
   más se la alimenta; la cama no se corta por dormir (es para eso) y termina
   sola al despertar. El acompañante no tiene barras: solo lo cortan que lo
   toquen o que la mascota se duerma (se va a dormir con ella). */
function furniActivityBroken(mood, act = walker){
  const a = act.activity;
  if ((a.rt && a.rt.removed) || gameOver) return true;
  if (act.isMain){
    if (displayStage() === 'egg' || mood === 'dead' || petAction) return true;
    if (a.kind === 'sleep') return false;
    if (state.sleeping) return true;
    if (a.kind === 'eat' || a.kind === 'clean') return false;
    return mood === 'sleepy' || mood === 'sad' || mood === 'sick';
  }
  if (act.action) return true;
  if (a.kind === 'sleep' || a.kind === 'comfort') return false;
  return !!state.sleeping;
}

/* Si hay un mueble para esta acción, el personaje va hasta él en vez de
   hacerla donde está parado. Devuelve false si no hay (y la acción sigue
   como siempre). Las barras ya se movieron en el botón: esto es solo lo que
   se ve. */
function startFurniRoutine(action, act = walker){
  if (activeMinigame || gameOver || (act.isMain && displayStage() === 'egg')) return false;
  const rt = furniRt.find(r => !r.removed && FURNI_ART[r.id].routine === action);
  if (!rt) return false;
  startFurniActivity(rt, action, act);
  return true;
}

/* Visita espontánea a un mueble que nadie más esté usando. */
function maybeStartFurniVisit(now, act = walker){
  if (now < act.nextVisitAt || Math.random() >= FURNI_VISIT_CHANCE) return false;
  const opciones = furniRt.filter(rt => !rt.removed && FURNI_ART[rt.id].visits &&
    rt.users.size === 0 && rt.id !== act.lastVisit);
  if (!opciones.length) return false;
  const rt = pickOne(opciones);
  act.lastVisit = rt.id;
  startFurniActivity(rt, 'visit', act);
  return true;
}

/* ===================== Arte y guiones =====================
   Cada mueble: w, h (píxeles del arte), parts (piezas dibujadas por
   separado; ver renderFurniture/updateFurniture), y sus guiones:
   - routine + routines: para la acción que reemplaza (sleep / eat / clean)
   - visits: lo que hace uno solo
   - duos: lo que hacen los dos; cada uno devuelve { a: [...], b: [...] }
   Coordenadas del dibujo: de arriba a la izquierda, como un canvas. Las del
   guion: f.x(dx) en píxeles del arte desde el centro del mueble, f.y(dy) de
   alto sobre el piso. `free: true` = se puede encimar con otros muebles. */

/* Pasos que se repiten en muchos guiones. */
const S = {
  wait: (ms, anim = 'idle', more = {}) => ({ anim, ms, ...more }),
  happy: (ms, more = {}) => ({ anim: 'happy', ms, ...more }),
  dance: (ms, flip = 400, more = {}) => ({ anim: 'happy', ms, flip, ...more }),
  sync: (name, more = {}) => ({ sync: name, ...more }),
  call: fn => ({ call: fn }),
  fx: (list) => ({ call: (rt, act) => petFx(pickOne(list), act) }),
};

/* ---------- las pelotas ----------
   Tres pelotas (pelota, balón, pelota de playa) con distinto dibujo y tamaño
   pero los MISMOS guiones: BALL_VISITS (16 formas de jugar solo) y
   BALL_DUOS (9 de a dos). Los guiones se escriben con ballKit(f), que mide
   la pelota del mueble (diámetro en px CSS) y al personaje, así sirven para
   cualquier tamaño de pelota y cualquier etapa. La pelota no vuelve a su
   lugar: queda donde terminó el juego, como una pelota de verdad. */
function ballKit(f){
  const rt = f.rt, D = FURNI_ART[rt.id].w * f.k, R = D / 2, fw = f.fw;
  const px = v => v / fw;                          // px CSS → fracción del piso
  const bx = () => ballAbsX(rt);
  const side = bx() < 0.5 ? 1 : -1;                // hacia donde hay más pieza
  const reach = px(R + f.h * 0.3);                 // a qué distancia se para para patearla
  const hands = act => [R * 0.3 + actorCssH(act) * 0.32, actorCssH(act) * 0.28];
  return { rt, D, R, px, bx, side, reach, hands,
    head: act => actorCssH(act) * 0.8,             // coronilla, px CSS sobre los pies
    behind: (sd = side) => () => clampX(ballAbsX(rt) - sd * reach),   // detrás, para patearla hacia sd
    idle: () => ballIdle(rt),
    /* Tomarla con las manos: la levanta (un saltito) y la lleva pegada. */
    pickup: () => [
      { ball: (a, act) => ({ x: act.x + act.dir * px(hands(act)[0]), y: hands(act)[1], h: 6, ms: 300 }), anim: 'happy', ms: 300 },
      { follow: (a, act) => hands(act), anim: 'happy', ms: 120 },
    ],
  };
}

const BALL_VISITS = [
  /* Patadas largas: la pelota va dando botecitos y la persigue corriendo. */
  f => {
    const B = ballKit(f), sd = B.side, far = f.fw * 0.26;
    return [
      { go: B.behind(sd) },
      { kick: sd * far, ms: 1100, h: 7, bounces: 2, dir: sd },
      { go: B.behind(-sd), speed: 0.18 }, S.happy(350, { dir: 'ball' }),
      { kick: -sd * far, ms: 1100, h: 7, bounces: 2, dir: -sd },
      { go: B.behind(sd), speed: 0.18 }, S.happy(350, { dir: 'ball', fx: ['⭐'] }),
      { kick: sd * far * 0.6, ms: 900, h: 12, bounces: 2, dir: sd },
      { go: B.behind(sd), speed: 0.18 }, S.dance(900, 300, { fx: ['⚽'] }),
    ];
  },
  /* Dribleo: patadas cortitas, de un lado a otro. */
  f => {
    const B = ballKit(f), sd = B.side, st = [{ go: B.behind(sd) }];
    for (let i = 0; i < 5; i++) st.push({ kick: sd * f.fw * 0.07, ms: 380, dir: sd }, { go: B.behind(sd), speed: 0.16 });
    st.push({ go: B.behind(-sd), speed: 0.14 }, S.happy(300, { fx: ['⚽'] }));
    for (let i = 0; i < 5; i++) st.push({ kick: -sd * f.fw * 0.07, ms: 380, dir: -sd }, { go: B.behind(-sd), speed: 0.16 });
    st.push(S.dance(900, 300, { fx: ['⭐'] }));
    return st;
  },
  /* Número de circo: arriba de la pelota, haciendo equilibrio. */
  f => {
    const B = ballKit(f), top = B.D - 1;
    return [
      { go: B.behind(B.side) },
      { hop: () => ({ x: B.bx(), y: top }), ms: 500, h: 18 },
      { anim: 'happy', ms: 3600, flip: 900, fx: ['🎪', '⭐'], fxEvery: 900,
        track: (rt, el) => ({ x: ballAbsX(rt) + Math.sin(el / 160) * B.px(1.2), y: top + Math.abs(Math.sin(el / 320)) * 2 }) },
      { hop: () => ({ x: clampX(B.bx() + B.side * B.reach * 1.3), y: 0 }), ms: 500, h: 16 },
      S.happy(700, { fx: ['👏'] }),
    ];
  },
  /* Cabecitas: la sube a la cabeza y la hace rebotar ahí, sin que se caiga. */
  f => {
    const B = ballKit(f);
    const st = [{ go: B.behind(B.side) }, S.wait(250, 'idle', { dir: 'ball' }),
      { ball: (a, act) => ({ x: act.x, y: B.head(act), h: 26, ms: 650 }), anim: 'happy', ms: 650 }];
    for (let i = 0; i < 7; i++){
      const ms = 430 + (i % 3) * 60;
      st.push({ ball: (a, act) => ({ x: act.x, y: B.head(act), h: 14 + (i % 3) * 7, ms }), bounce: 1, ms, h: 5, anim: 'happy',
        fx: i === 3 ? ['⭐'] : undefined });
    }
    st.push({ ball: (a, act) => ({ x: act.x + act.dir * B.px(B.R + actorCssH(act) * 0.5), h: 10, bounces: 2, ms: 900 }),
      anim: 'celebrate', ms: 1000, fx: ['🎉'] }, S.happy(500, { dir: 'ball' }));
    return st;
  },
  /* Lanzarla al aire y atraparla, cada vez más alto. La última le cae en la cabeza. */
  f => {
    const B = ballKit(f);
    const up = (h, ms) => ({ ball: (a, act) => ({ x: act.x + act.dir * B.px(B.hands(act)[0]), y: B.hands(act)[1], h, ms }),
      anim: 'idle', until: B.idle });
    const atrapa = { follow: (a, act) => B.hands(act), anim: 'happy', ms: 500 };
    return [
      { go: B.behind(B.side) }, ...B.pickup(), S.wait(300, 'happy'),
      up(40, 850), atrapa, up(62, 1050), { ...atrapa, fx: ['⭐'] },
      { ball: (a, act) => ({ x: act.x, y: B.head(act), h: 85, ms: 1250 }), anim: 'idle', until: B.idle },
      { ball: (a, act) => ({ x: act.x + act.dir * B.px(B.R + actorCssH(act) * 0.6), h: 12, bounces: 2, ms: 800 }),
        anim: 'sick', ms: 900, fx: ['💫'] },
      S.happy(700, { dir: 'ball', fx: ['😆'] }),
    ];
  },
  /* Golazo: toma vuelo, corre y la patea fuerte. */
  f => {
    const B = ballKit(f), sd = B.side;
    return [
      { go: B.behind(sd) },
      { go: () => clampX(B.bx() - sd * (B.reach + 0.12)), speed: 0.1 },   // retrocede para tomar impulso
      S.wait(400, 'idle', { dir: sd }),
      { go: B.behind(sd), speed: 0.24 },
      { kick: sd * f.fw * 0.45, ms: 1500, h: 30, bounces: 3, dir: sd, anim: 'celebrate' },
      { anim: 'celebrate', ms: 1300, dir: sd, fx: ['⚽', '🎉', '⭐'], fxEvery: 420 },
      S.dance(800, 260),
      { go: B.behind(-sd), speed: 0.15 }, S.happy(400, { dir: 'ball' }),
    ];
  },
  /* Contra la pared: la tira, rebota y le vuelve. Tres veces. */
  f => {
    const B = ballKit(f), sd = B.side, wall = sd > 0 ? 0.96 : 0.04;
    const st = [{ go: B.behind(sd) }];
    for (let i = 0; i < 3; i++){
      st.push(
        { ball: { x: wall, ms: 700 }, anim: 'happy', dir: sd, until: B.idle },
        { ball: (a, act) => ({ x: clampX(act.x + sd * B.reach), ms: 850, ease: 'out', h: 4, bounces: 1 }), anim: 'idle', dir: sd, until: B.idle },
        S.happy(300, { dir: sd }),
      );
    }
    st.push(S.dance(800, 300, { fx: ['⭐'] }));
    return st;
  },
  /* Se le escapa: rueda, la persigue, se le vuelve a escapar, y al final se le tira encima. */
  f => {
    const B = ballKit(f), sd = B.side;
    return [
      { go: B.behind(sd) },
      { kick: sd * f.fw * 0.12, ms: 600, dir: sd },
      { ball: { dx: sd * f.fw * 0.16, ms: 1700, ease: 'out' }, go: B.behind(sd), speed: 0.12 },
      { ball: { dx: sd * f.fw * 0.12, ms: 900, ease: 'out' }, anim: 'sad', ms: 600, fx: ['😤'] },
      { go: B.behind(sd), speed: 0.18 },
      { hop: () => ({ x: B.bx(), y: 0 }), ms: 450, h: 20 },
      { anim: 'pet', ms: 1300, fx: ['💗'] },
      S.happy(600, { fx: ['😆'] }),
    ];
  },
  /* Sentada encima, rebotando como en un saltarín. */
  f => {
    const B = ballKit(f), top = B.D * 0.8;
    return [
      { go: B.behind(B.side) },
      { hop: () => ({ x: B.bx(), y: top }), ms: 480, h: 16 },
      { bounce: 6, ms: 420, h: 16, fx: ['😆'], fxEvery: 1200 },
      { bounce: 2, ms: 650, h: 30, anim: 'celebrate' },
      { hop: () => ({ x: clampX(B.bx() - B.side * B.reach * 1.2), y: 0 }), ms: 480, h: 14 },
      S.happy(600),
    ];
  },
  /* Pataditas: la mantiene en el aire con el pie, sin dejarla caer. */
  f => {
    const B = ballKit(f), foot = act => B.px(B.R + actorCssH(act) * 0.28);
    const st = [{ go: B.behind(B.side) }, S.wait(200, 'idle', { dir: 'ball' })];
    for (let i = 0; i < 8; i++){
      st.push({ ball: (a, act) => ({ x: act.x + act.dir * foot(act), h: 16 + (i % 2) * 8, ms: 460 }),
        anim: i % 2 ? 'happy' : 'idle', ms: 460, fx: i === 7 ? ['⭐'] : undefined });
    }
    st.push({ ball: (a, act) => ({ x: clampX(act.x + act.dir * (foot(act) + 0.2)), h: 30, bounces: 2, ms: 1200 }),
      anim: 'celebrate', ms: 1200, fx: ['🎉'] }, S.happy(400, { dir: 'ball' }));
    return st;
  },
  /* Cabezazo: se la tira a sí misma y la cabecea lejos. */
  f => {
    const B = ballKit(f), sd = B.side;
    return [
      { go: B.behind(sd) }, ...B.pickup(), S.wait(300, 'idle', { dir: sd }),
      { ball: (a, act) => ({ x: act.x, y: B.head(act), h: 45, ms: 950 }), anim: 'idle', dir: sd, until: B.idle },
      { ball: (a, act) => ({ x: clampX(act.x + sd * 0.4), h: 34, bounces: 2, ms: 1500 }), bounce: 1, ms: 420, h: 12, dir: sd },
      S.wait(900, 'idle', { dir: 'ball' }),
      { anim: 'celebrate', ms: 1100, fx: ['⚽', '✨'], fxEvery: 500 },
      { go: B.behind(-sd), speed: 0.14 }, S.happy(400, { dir: 'ball' }),
    ];
  },
  /* La empuja con la nariz de una punta a la otra, y de vuelta. */
  f => {
    const B = ballKit(f), sd = B.side;
    const nose = (a, act) => [B.R + actorCssH(act) * 0.3, 0];
    const far = clampX(B.bx() + sd * 0.34);
    return [
      { go: B.behind(sd) },
      { follow: nose, anim: 'happy', ms: 250, dir: sd },
      { go: far, speed: 0.08 },
      { release: true, anim: 'happy', ms: 400, fx: ['😆'] },
      { go: B.behind(-sd), speed: 0.12 },
      { follow: nose, ms: 250 },
      { go: clampX(far - sd * 0.3), speed: 0.08 },
      { release: true, anim: 'happy', ms: 600, fx: ['⭐'] },
    ];
  },
  /* Bolos: la hace rodar despacito, la mira llegar lejos y celebra. */
  f => {
    const B = ballKit(f), sd = B.side;
    return [
      { go: B.behind(sd) }, S.wait(400, 'idle', { dir: sd }),
      { bounce: 1, ms: 300, h: 4, dir: sd },
      { kick: sd * f.fw * 0.4, ms: 2400, dir: sd },
      S.wait(400, 'idle', { dir: sd }),
      { anim: 'celebrate', ms: 1200, dir: sd, fx: ['🎳', '✨', '⭐'], fxEvery: 400 },
      { go: B.behind(-sd), speed: 0.15 }, S.happy(500, { dir: 'ball' }),
    ];
  },
  /* Siestita abrazada a la pelota. */
  f => {
    const B = ballKit(f);
    return [
      { go: () => clampX(B.bx() - B.side * B.px(B.R + f.h * 0.22)) },
      S.wait(400, 'idle', { dir: 'ball', fx: ['😪'] }),
      { anim: 'sleep', ms: 4200, dir: 'ball', fx: ['💤'], fxEvery: 1400 },
      S.wait(500, 'idle', { dir: 'ball' }),
      { anim: 'pet', ms: 1200, dir: 'ball', fx: ['💗'] },
      { kick: B.side * f.fw * 0.08, ms: 600, dir: B.side },
      S.happy(500),
    ];
  },
  /* Baile con la pelota: la lleva en las manos (al girar se la cambia de
     lado) y la hace botar sobre la cabeza al ritmo. */
  f => {
    const B = ballKit(f);
    const st = [{ go: B.behind(B.side) }, ...B.pickup(), S.dance(1600, 400, { fx: ['🎵', '🎶'], fxEvery: 600 })];
    for (let i = 0; i < 4; i++){
      st.push({ ball: (a, act) => ({ x: act.x, y: B.head(act) + 2, h: 16, ms: 420 }), bounce: 1, ms: 420, h: 7, anim: 'celebrate' });
    }
    st.push(...B.pickup(), S.dance(1200, 300, { fx: ['🎶'] }), { release: true, anim: 'happy', ms: 700, fx: ['✨'] });
    return st;
  },
  /* La lleva en la cabeza, caminando con cuidado... hasta que se le cae. */
  f => {
    const B = ballKit(f), sd = B.side;
    const p1 = clampX(B.bx() + sd * 0.25), p2 = clampX(B.bx() - sd * 0.05);
    return [
      { go: B.behind(sd) },
      { ball: (a, act) => ({ x: act.x, y: B.head(act), h: 20, ms: 600 }), anim: 'happy', ms: 600 },
      { follow: (a, act) => [0, B.head(act)], ms: 100 },
      { go: p1, speed: 0.07, fx: ['🎪'] },
      S.wait(500, 'happy', { fx: ['⭐'] }),
      { go: p2, speed: 0.07 },
      { release: true, anim: 'sick', ms: 900, fx: ['😮'] },
      S.happy(700, { dir: 'ball', fx: ['😆'] }),
    ];
  },
];

const BALL_DUOS = [
  /* Pases: cada uno a un lado, de ida y vuelta (el del medio, con botes). */
  f => {
    const B = ballKit(f), sd = B.side, dist = 0.3, far = clampX(B.bx() + sd * dist);
    const P = { dir: 'partner' };
    const a = [{ go: B.behind(sd) }, S.sync('in', P)];
    const b = [{ go: clampX(far + sd * B.reach) }, S.sync('in', P)];
    for (let i = 0; i < 3; i++){
      const h = i === 1 ? 14 : 0, bounces = i === 1 ? 2 : 0;
      a.push({ kick: sd * f.fw * dist, ms: 950, h, bounces, dir: 'partner' }, S.sync('k' + 2 * i), S.wait(950, 'idle', { dir: 'ball' }), S.sync('k' + (2 * i + 1)));
      b.push(S.wait(950, 'idle', { dir: 'ball' }), S.sync('k' + 2 * i), { kick: -sd * f.fw * dist, ms: 950, h, bounces, dir: 'partner' }, S.sync('k' + (2 * i + 1)));
    }
    a.push(S.dance(900, 300, { fx: ['⚽'] }));
    b.push(S.dance(900, 300, { fx: ['😆'] }));
    return { a, b };
  },
  /* Cabezazos: se la pasan de cabeza a cabeza sin que toque el suelo. */
  f => {
    const B = ballKit(f), sd = B.side, P = { dir: 'partner' };
    const xa = clampX(B.bx() - sd * B.reach), xb = clampX(xa + sd * 0.24);
    const headOf = act => actorCssH(act) * 0.8;
    const a = [{ go: xa }, S.sync('in', P), ...B.pickup(),
      { ball: (st, act) => ({ x: act.x, y: headOf(act), h: 30, ms: 800 }), anim: 'idle', dir: 'partner', until: B.idle }];
    const b = [{ go: xb }, S.sync('in', P)];
    for (let i = 0; i < 6; i++){
      const [snd, rcv] = i % 2 ? [b, a] : [a, b];
      snd.push(
        { ball: (st, act) => ({ x: st.partner.x, y: headOf(st.partner), h: 26, ms: 900 }), bounce: 1, ms: 380, h: 10, dir: 'partner', anim: 'happy' },
        { anim: 'idle', dir: 'partner', until: B.idle },
        S.sync('h' + i, P));
      rcv.push(S.sync('h' + i, P));
    }
    a.push({ ball: (st, act) => ({ x: act.x + act.dir * B.px(B.R + actorCssH(act) * 0.6), h: 8, bounces: 2, ms: 800 }), anim: 'sick', ms: 800, fx: ['💫'] },
      S.sync('end', P), S.happy(1100, { ...P, fx: ['😆'] }));
    b.push(S.sync('end', P), S.happy(1100, { ...P, fx: ['😂'] }));
    return { a, b };
  },
  /* Arquero: `a` ataja en el arco y `b` patea tres penales. Si ataja, la
     pelota rebota hacia la cancha; si es gol, el arquero va a buscarla. */
  f => {
    const B = ballKit(f), sd = B.side;
    const goalX = sd > 0 ? 0.86 : 0.14, wall = sd > 0 ? 0.97 : 0.03;
    const a = [{ go: goalX }, S.sync('in', { dir: -sd })];
    const b = [{ go: B.behind(sd) }, S.sync('in', { dir: sd })];
    for (let i = 0; i < 3; i++){
      const ataja = Math.random() < 0.5;
      b.push({ go: B.behind(sd), speed: 0.14 }, S.sync('ready' + i, { dir: sd }), S.wait(350, 'idle', { dir: sd }),
        { ball: ataja ? (st) => ({ x: clampX(st.partner.x - sd * 0.02), y: actorCssH(st.partner) * 0.45, h: 16, ms: 750 })
                      : { x: wall, h: 22, ms: 850 },
          bounce: 1, ms: 300, h: 6, dir: sd },
        { anim: 'idle', dir: sd, until: B.idle },
        S.sync('r' + i));
      a.push(S.sync('ready' + i, { dir: -sd }), S.wait(450, 'idle', { dir: -sd }),
        ataja ? { bounce: 1, ms: 450, h: 18, anim: 'happy', dir: -sd }
              : { hop: { x: clampX(goalX + sd * 0.04), y: 0 }, ms: 420, h: 10, anim: 'sad' },
        S.sync('r' + i, { dir: -sd }));
      if (ataja){
        a.push({ ball: { x: clampX(goalX - sd * 0.42), h: 12, bounces: 2, ms: 1100 }, anim: 'celebrate', ms: 1100, dir: -sd, fx: ['🧤', '⭐'], fxEvery: 500 },
          { go: goalX, speed: 0.12 }, S.sync('e' + i, { dir: -sd }));
        b.push(S.wait(1100, 'sad', { dir: 'ball', fx: ['😮'] }), S.sync('e' + i));
      } else {
        b.push({ anim: 'celebrate', ms: 1300, fx: ['⚽', '🎉'], fxEvery: 450 }, S.sync('e' + i));
        a.push({ go: B.behind(-sd), speed: 0.15 }, { kick: -sd * f.fw * 0.36, ms: 1000, h: 10, bounces: 2, dir: -sd },
          { go: goalX, speed: 0.14 }, S.sync('e' + i, { dir: -sd }));
      }
    }
    a.push(S.sync('end', { dir: 'partner' }), S.happy(900, { dir: 'partner', fx: ['👏'] }));
    b.push(S.sync('end', { dir: 'partner' }), S.dance(900, 300));
    return { a, b };
  },
  /* Lanzarse la pelota con las manos, en arcos de distinto alto. La última
     sale muy alta, le pasa por encima al otro y se le cae atrás. */
  f => {
    const B = ballKit(f), sd = B.side, P = { dir: 'partner' };
    const xa = clampX(B.bx() - sd * B.reach), xb = clampX(xa + sd * 0.3);
    const handsAt = act => { const h = B.hands(act); return { x: clampX(act.x + act.dir * B.px(h[0])), y: h[1] }; };
    const a = [{ go: xa }, S.sync('in', P), ...B.pickup(), S.sync('go', P)];
    const b = [{ go: xb }, S.sync('in', P), S.sync('go', P)];
    const alto = [30, 55, 22, 70, 40];
    alto.forEach((h, i) => {
      const [snd, rcv] = i % 2 ? [b, a] : [a, b];
      snd.push(S.sync('t' + i, P),
        { ball: st => { const t = handsAt(st.partner); return { x: t.x, y: t.y, h, ms: 650 + h * 6 }; }, anim: 'happy', dir: 'partner', until: B.idle },
        S.sync('c' + i, P));
      rcv.push(S.sync('t' + i, P), S.sync('c' + i, P), { follow: (st, act) => B.hands(act), anim: 'happy', ms: 350, fx: i === 3 ? ['⭐'] : undefined });
    });
    /* La quinta la atrapó `b`: tira la última, que se le pasa a `a`. */
    b.push(S.sync('last', P), { ball: st => ({ x: clampX(st.partner.x - sd * 0.16), h: 80, bounces: 2, ms: 1500 }), anim: 'happy', dir: 'partner', until: B.idle },
      S.sync('end', P), S.happy(1100, { ...P, fx: ['😂'], fxEvery: 550 }));
    a.push(S.sync('last', P), S.wait(500, 'idle', P), S.wait(700, 'sick', { dir: 'ball', fx: ['😮'] }),
      S.sync('end', P), S.happy(1100, { ...P, fx: ['😆'] }));
    return { a, b };
  },
  /* Quítasela: uno se la lleva empujándola y el otro lo persigue hasta
     alcanzarlo; ahí se la quita y se invierten los papeles. */
  f => {
    const B = ballKit(f), sd = B.side, P = { dir: 'partner' };
    const nose = (st, act) => [B.R + actorCssH(act) * 0.3, 0];
    const bx0 = B.bx(), lejos = clampX(bx0 + sd * 0.3), vuelta = clampX(bx0 - sd * 0.05);
    const pega = B.px(f.h * 0.9);
    const a = [{ go: B.behind(sd) }, S.sync('in', P),
      { follow: nose, anim: 'happy', ms: 250, dir: sd }, { go: lejos, speed: 0.1 }, S.sync('pillada', P),
      { release: true, anim: 'sad', ms: 600, fx: ['😮'] },
      { chase: 4000, speed: 0.15, catchDist: pega }, S.sync('pillada2', P), S.happy(1200, { ...P, fx: ['😆'], fxEvery: 600 })];
    const b = [{ go: () => clampX(B.bx() - sd * (B.reach + 0.14)) }, S.sync('in', P),
      S.wait(600, 'idle', { ...P, fx: ['❗'] }),
      { chase: 4500, speed: 0.15, catchDist: pega }, S.sync('pillada', P),
      { go: () => clampX(B.bx() + sd * B.reach), speed: 0.16 },
      { follow: nose, anim: 'happy', ms: 250, dir: -sd, fx: ['😝'] }, { go: vuelta, speed: 0.1 },
      S.sync('pillada2', P), { release: true, anim: 'happy', ms: 1200, dir: 'partner', fx: ['😂'] }];
    return { a, b };
  },
  /* Rodarla despacito: cerca, frente a frente, se la devuelven sin apuro. */
  f => {
    const B = ballKit(f), sd = B.side, P = { dir: 'partner' }, dist = 0.2;
    const a = [{ go: B.behind(sd) }, S.sync('in', P)];
    const b = [{ go: () => clampX(B.bx() + sd * (dist + B.reach)) }, S.sync('in', P)];
    for (let i = 0; i < 3; i++){
      a.push({ kick: sd * f.fw * dist, ms: 1600, dir: 'partner', anim: 'pet' }, S.sync('k' + 2 * i, P),
        S.wait(1600, 'idle', { dir: 'ball' }), S.sync('k' + (2 * i + 1), P), { anim: 'pet', ms: 500, dir: 'partner', fx: ['💗'] });
      b.push(S.wait(1600, 'idle', { dir: 'ball' }), S.sync('k' + 2 * i, P), { anim: 'pet', ms: 500, dir: 'partner', fx: ['💕'] },
        { kick: -sd * f.fw * dist, ms: 1600, dir: 'partner', anim: 'pet' }, S.sync('k' + (2 * i + 1), P));
    }
    a.push(S.happy(900, P)); b.push(S.happy(900, P));
    return { a, b };
  },
  /* Saltar la pelota: `a` la tira rodando fuerte, `b` la salta, rebota en
     la pared y la vuelve a saltar de vuelta. Cada ronda más rápido. */
  f => {
    const B = ballKit(f), sd = B.side, P = { dir: 'partner' };
    const bx0 = B.bx(), xa = clampX(bx0 - sd * B.reach), xb = clampX(bx0 + sd * 0.26);
    const wall = sd > 0 ? 0.96 : 0.04, home = clampX(xa + sd * B.reach);
    const HOP = 420;
    const a = [{ go: xa }, S.sync('in', P)];
    const b = [{ go: xb }, S.sync('in', P)];
    [1150, 950, 780].forEach((ms, i) => {
      const ida = Math.abs(xb - home) / Math.abs(wall - home) * ms;            // cuándo pasa por `b` a la ida
      const back = ms * 0.9, vuelta = Math.abs(wall - xb) / Math.abs(wall - home) * back;
      a.push(S.sync('r' + i, P),
        { ball: { x: wall, ms }, bounce: 1, ms: 300, h: 5, dir: sd },
        { anim: 'idle', dir: 'ball', until: B.idle },
        { ball: { x: home, ms: back }, anim: 'idle', dir: 'ball', until: B.idle },
        S.sync('v' + i, P));
      b.push(S.sync('r' + i, P),
        S.wait(Math.max(0, ida - HOP / 2), 'idle', P), { bounce: 1, ms: HOP, h: 26, anim: 'happy', dir: 'partner' },
        S.wait(Math.max(0, ms - ida - HOP / 2 + vuelta - HOP / 2), 'idle', { dir: 'ball' }),
        { bounce: 1, ms: HOP, h: 26, anim: 'happy', dir: 'ball', fx: ['😆'] },
        S.sync('v' + i, P));
    });
    a.push(S.happy(1000, { ...P, fx: ['👏'] }));
    b.push({ anim: 'celebrate', ms: 1000, dir: 'partner', fx: ['⭐'] });
    return { a, b };
  },
  /* Partidito: la pelota salta al medio, los dos corren y el que llega
     primero mete el gol en la pared del otro. Una sola ronda: con dos
     duraba más de 30 s. */
  f => {
    const B = ballKit(f), sd = B.side, P = { dir: 'partner' };
    const mid = clampX(B.bx() + sd * 0.12);
    const xa = clampX(mid - sd * 0.16), xb = clampX(mid + sd * 0.16);
    const a = [{ go: B.behind(sd) }, { kick: sd * f.fw * 0.12, ms: 700, dir: sd }, { go: xa }, S.sync('in', P)];
    const b = [{ go: xb }, S.sync('in', P)];
    for (let i = 0; i < 1; i++){
      const ganaA = Math.random() < 0.5;
      /* El que patea hacia la pared del otro: `a` ataca hacia sd, `b` hacia -sd. */
      const [win, lose, dirW] = ganaA ? [a, b, sd] : [b, a, -sd];
      a.push(S.sync('s' + i, P));
      b.push(S.sync('s' + i, P));
      a.push({ ball: { dx: 0, h: 36, ms: 900 }, anim: 'idle', dir: 'ball', until: B.idle });
      b.push({ anim: 'idle', dir: 'ball', ms: 900 });
      a.push(S.sync('go' + i)); b.push(S.sync('go' + i));
      win.push({ go: B.behind(dirW), speed: 0.2 },
        { kick: dirW * f.fw * 0.42, ms: 1300, h: 16, bounces: 3, dir: dirW },
        { anim: 'celebrate', ms: 1200, fx: ['⚽', '🎉'], fxEvery: 450 }, S.sync('gol' + i, P));
      lose.push({ go: mid, speed: 0.12 }, S.wait(500, 'sad', { dir: 'ball', fx: ['😮'] }), S.sync('gol' + i, P));
      /* El que metió el gol la trae de vuelta al medio. */
      win.push({ go: B.behind(-dirW), speed: 0.17 }, { ball: () => ({ x: mid, ms: 1100, ease: 'out' }), anim: 'happy', until: B.idle },
        { go: ganaA ? xa : xb, speed: 0.15 }, S.sync('back' + i, P));
      lose.push({ go: ganaA ? xb : xa, speed: 0.15 }, S.sync('back' + i, P));
    }
    a.push(S.happy(900, P)); b.push(S.happy(900, P));
    return { a, b };
  },
  /* Circo de a dos: `a` se sube a la pelota y hace equilibrio mientras `b`
     la empuja despacito por la pieza. */
  f => {
    const B = ballKit(f), sd = B.side, P = { dir: 'partner' }, top = B.D - 1;
    const nose = (st, act) => [B.R + actorCssH(act) * 0.3, 0];
    const bx0 = B.bx(), dest = clampX(bx0 - sd * 0.26);
    const a = [{ go: B.behind(sd) }, { hop: () => ({ x: B.bx(), y: top }), ms: 500, h: 18 }, S.sync('on', P),
      { anim: 'happy', flip: 1000, fx: ['🎪', '⭐'], fxEvery: 900, until: st => st.duo.data.done,
        track: (rt, el) => ({ x: ballAbsX(rt), y: top + Math.abs(Math.sin(el / 300)) * 2 }) },
      { hop: () => ({ x: clampX(B.bx() - sd * B.reach * 1.3), y: 0 }), ms: 500, h: 16 },
      S.sync('end', P), { anim: 'celebrate', ms: 1100, dir: 'partner', fx: ['🎉'] }];
    const b = [{ go: () => clampX(B.bx() + sd * B.reach) }, S.sync('on', P),
      { follow: nose, anim: 'happy', ms: 300, dir: -sd },
      { go: dest, speed: 0.05 },
      { release: true, anim: 'happy', ms: 400 },
      S.call((r, act, st) => { st.duo.data.done = true; }),
      S.sync('end', P), S.happy(1100, { ...P, fx: ['👏'], fxEvery: 550 })];
    return { a, b };
  },
];

/* Una pelota: solo cambia el dibujo (y el tamaño). La pieza se dibuja donde
   esté la pelota en este instante y gira según cuánto rodó. */
function ballArt(w, draw){
  return { w, h: w, free: true,
    parts: [{ id: 'ball', draw, pose: (rt, now, k) => {
      const b = ballNow(rt, now);
      if (rt._bx !== undefined) rt.ballRot += (b.dx - rt._bx) / (w * k / 2);
      rt._bx = b.dx;
      return { x: b.dx, y: b.y, r: rt.ballRot };
    } }],
    visits: BALL_VISITS, duos: BALL_DUOS };
}

const FURNI_ART = {
  /* ---------------- los 14 de antes, con más de un guion ---------------- */

  cama: { w: 32, h: 14, routine: 'sleep',
    parts: [{ id: 'base', draw: p => {
      p.box(0, 0, 5, 14, FP.wood, FP.woodL);
      p.r(28, 12, 3, 2, FP.O);
      p.box(4, 9, 28, 4, FP.wood);
      p.box(4, 6, 28, 4, FP.white);
      p.box(5, 3, 8, 4, FP.white, FP.whiteL);
      p.box(13, 5, 19, 5, FP.blue, FP.blueL);
      p.r(15, 7, 15, 1, FP.blueD);
    } }],
    /* El acompañante se acuesta del lado de la almohada, la mascota al medio. */
    routines: [
      f => [
        { go: f.x(-3) },
        { hop: { x: f.x(f.isBuddy ? -4 : 6), y: f.y(7) }, ms: 450, h: 14 },
        { anim: 'sleep', until: () => !state.sleeping, fx: ['💤'], fxEvery: 1800 },
        { hop: { x: f.x(f.isBuddy ? -22 : 22), y: 0 }, ms: 450, h: 12 },
      ],
      f => [
        { go: f.x(-3) },
        { hop: { x: f.x(f.isBuddy ? -4 : 6), y: f.y(7) }, ms: 450, h: 14 },
        { bounce: 2, ms: 420, h: 14 },
        S.wait(500, 'idle', { dir: -1 }),
        { anim: 'sleep', until: () => !state.sleeping, fx: ['💤'], fxEvery: 1800 },
        { hop: { x: f.x(f.isBuddy ? -22 : 22), y: 0 }, ms: 450, h: 12 },
      ],
    ],
    /* Despierta, la cama también sirve para saltar encima. */
    visits: [
      f => [
        { go: f.x(-20) },
        { hop: { x: f.x(4), y: f.y(7) }, ms: 500, h: 18 },
        { bounce: 5, ms: 460, h: 26, fx: ['⭐'], fxEvery: 900 },
        S.dance(1200, 400, { fx: ['😆'] }),
        { bounce: 2, ms: 560, h: 34 },
        { hop: { x: f.x(22), y: 0 }, ms: 500, h: 14 },
      ],
      f => [
        { go: f.x(-3) },
        { hop: { x: f.x(6), y: f.y(7) }, ms: 450, h: 14 },
        { anim: 'sleep', ms: 5000, fx: ['💤'], fxEvery: 1500 },   // siestita
        S.happy(900, { fx: ['✨'] }),
        { hop: { x: f.x(22), y: 0 }, ms: 450, h: 12 },
      ],
    ],
    /* Guerra de almohadas: saltan por turnos y se tiran almohadazos. */
    duos: [
      f => ({
        a: [
          { go: f.x(-20) }, S.sync('in'),
          { hop: { x: f.x(-1), y: f.y(7) }, ms: 500, h: 18 },
          S.sync('on'),
          { bounce: 3, ms: 420, h: 24, dir: 'partner', onApex: (rt, act) => petFx('💥', act) },
          S.sync('t1'),
          S.wait(1260, 'happy', { dir: 'partner', fx: ['😆'], fxEvery: 600 }),
          S.sync('t2'),
          { bounce: 2, ms: 520, h: 30 },
          S.dance(1000, 300, { fx: ['😆'] }),
          { hop: { x: f.x(-22), y: 0 }, ms: 500, h: 14 },
        ],
        b: [
          { go: f.x(22) }, S.sync('in'),
          { hop: { x: f.x(11), y: f.y(7) }, ms: 500, h: 18 },
          S.sync('on'),
          S.wait(1260, 'happy', { dir: 'partner', fx: ['😆'], fxEvery: 600 }),
          S.sync('t1'),
          { bounce: 3, ms: 420, h: 24, dir: 'partner', onApex: (rt, act) => petFx('💥', act) },
          S.sync('t2'),
          { bounce: 2, ms: 520, h: 30 },
          S.dance(1000, 300),
          { hop: { x: f.x(24), y: 0 }, ms: 500, h: 14 },
        ],
      }),
    ] },

  plato: { w: 12, h: 7, routine: 'eat', free: true,
    parts: [
      { id: 'base', draw: p => {
        p.r(0, 2, 12, 1, FP.O);
        p.r(0, 3, 1, 2, FP.O); p.r(11, 3, 1, 2, FP.O);
        p.r(1, 3, 10, 1, FP.redL); p.r(1, 4, 10, 1, FP.red);
        p.r(1, 5, 1, 1, FP.O); p.r(10, 5, 1, 1, FP.O); p.r(2, 5, 8, 1, FP.redD);
        p.r(2, 6, 8, 1, FP.O);
      } },
      { id: 'food', show: 'food', draw: p => {
        p.r(2, 1, 8, 2, '#a8683a'); p.r(3, 0, 2, 1, '#c98b4f'); p.r(7, 0, 2, 1, '#c98b4f'); p.r(5, 1, 1, 1, '#c98b4f');
      } },
    ],
    routines: [
      f => [
        { go: f.x(-12) },
        { anim: 'eat', ms: 3600, dir: 1, fx: ['😋'], fxEvery: 900, start: rt => { rt.food = true; }, end: rt => { rt.food = false; } },
        S.happy(600, { fx: ['💖'] }),
      ],
      f => [
        { go: f.x(12) },
        { anim: 'eat', ms: 2000, dir: -1, start: rt => { rt.food = true; } },
        S.happy(500, { dir: -1, fx: ['😋'] }),
        { anim: 'eat', ms: 1800, dir: -1, end: rt => { rt.food = false; } },
        { bounce: 1, ms: 420, h: 14, fx: ['💖'] },
      ],
    ],
    /* Fuera de la hora de comer: va a revisar el plato vacío y mira con cara
       de "¿y la comida?". Un recordatorio que no castiga. */
    visits: [
      f => [
        { go: f.x(-12) },
        { anim: 'eat', ms: 1200, dir: 1 },
        S.wait(1600, 'idle', { dir: 1, fx: ['🥺'] }),
        { anim: 'sad', ms: 1400 },
        S.wait(800, 'idle', { dir: -1 }),
      ],
    ],
    duos: [
      f => ({
        a: [{ go: f.x(-12) }, S.sync('c'), { anim: 'eat', ms: 3000, dir: 1, fx: ['😋'], fxEvery: 1100 }, S.happy(700, { dir: 'partner' })],
        b: [{ go: f.x(12) }, S.sync('c'), S.wait(1400, 'idle', { dir: -1, fx: ['🥺'] }), { anim: 'eat', ms: 1600, dir: -1 }, S.happy(700, { dir: 'partner', fx: ['💖'] })],
      }),
    ] },

  banera: { w: 30, h: 16, routine: 'clean',
    parts: [
      { id: 'base', draw: p => {
        p.r(1, 0, 6, 2, FP.metalD); p.r(1, 0, 2, 6, FP.metalD); p.r(5, 2, 2, 2, FP.metal);
        p.box(0, 5, 30, 9, FP.white);
        p.r(1, 6, 28, 2, FP.water);
        p.r(3, 14, 3, 2, FP.O); p.r(24, 14, 3, 2, FP.O);
      } },
      { id: 'duck', pose: (rt, now, k) => ({ x: Math.sin(now / 1300) * 3 * k, y: Math.sin(now / 420) * 0.5 * k }), draw: p => {
        p.r(19, 4, 4, 3, FP.yel); p.r(22, 3, 2, 2, FP.yel); p.r(24, 4, 1, 1, FP.orange); p.r(23, 3, 1, 1, FP.O);
      } },
      { id: 'front', z: 'front', draw: p => {
        p.r(0, 8, 30, 6, FP.O); p.r(1, 9, 28, 4, FP.white);
        p.r(1, 9, 28, 1, FP.whiteL); p.r(1, 11, 28, 1, '#e7e0f0');
      } },
    ],
    routines: [
      f => [
        { go: f.x(-19) },
        { hop: { x: f.x(0), y: f.y(3) }, ms: 500, h: 22 },
        { anim: 'clean', ms: 2500, fx: ['🧼', '💦'], fxEvery: 350 },
        S.dance(700, 350, { fx: ['💦'], fxEvery: 250 }),
        { anim: 'clean', ms: 2000, fx: ['🧼', '💦'], fxEvery: 350 },
        { hop: { x: f.x(19), y: 0 }, ms: 500, h: 20 },
      ],
      f => [
        { go: f.x(19) },
        { hop: { x: f.x(-2), y: f.y(3) }, ms: 500, h: 22 },
        S.wait(1400, 'idle', { fx: ['🦆'] }),
        { anim: 'clean', ms: 2600, flip: 650, fx: ['🧼', '💦'], fxEvery: 300 },
        { bounce: 2, ms: 400, h: 10, fx: ['💦'] },
        { hop: { x: f.x(-19), y: 0 }, ms: 500, h: 20 },
        { anim: 'clean', ms: 900, flip: 150, fx: ['💦'] },   // se sacude como perro
      ],
    ],
    /* Un rato de juego con el patito, sin que sea la hora del baño. */
    visits: [
      f => [
        { go: f.x(-19) },
        { hop: { x: f.x(-3), y: f.y(3) }, ms: 500, h: 22 },
        S.happy(2400, { dir: 1, fx: ['🦆', '💦'], fxEvery: 600 }),
        { bounce: 3, ms: 380, h: 8, fx: ['💦'] },
        { hop: { x: f.x(19), y: 0 }, ms: 500, h: 20 },
      ],
    ],
    duos: [
      f => ({
        a: [{ go: f.x(-19) }, S.sync('in'), { hop: { x: f.x(-6), y: f.y(3) }, ms: 500, h: 22 }, S.sync('w'),
          { anim: 'clean', ms: 900, dir: 'partner', fx: ['💦'] }, S.sync('s1'), S.happy(900, { dir: 'partner', fx: ['😆'] }), S.sync('s2'),
          { anim: 'clean', ms: 900, dir: 'partner', fx: ['💦'] }, S.sync('out'), { hop: { x: f.x(-20), y: 0 }, ms: 500, h: 20 }],
        b: [{ go: f.x(19) }, S.sync('in'), { hop: { x: f.x(6), y: f.y(3) }, ms: 500, h: 22 }, S.sync('w'),
          S.happy(900, { dir: 'partner', fx: ['😆'] }), S.sync('s1'), { anim: 'clean', ms: 900, dir: 'partner', fx: ['💦'] }, S.sync('s2'),
          S.happy(900, { dir: 'partner' }), S.sync('out'), { hop: { x: f.x(20), y: 0 }, ms: 500, h: 20 }],
      }),
    ] },

  tocador: { w: 20, h: 30,
    parts: [{ id: 'base', draw: p => {
      p.box(4, 0, 12, 13, FP.pink, FP.pinkL);
      p.r(6, 2, 8, 9, FP.glass); p.r(7, 3, 2, 4, FP.whiteL); p.r(11, 8, 1, 2, '#e6f6ff');
      p.r(9, 13, 2, 3, FP.woodD);
      p.r(3, 12, 2, 4, FP.red); p.r(3, 15, 2, 1, FP.O);
      p.r(15, 12, 3, 4, FP.pink); p.r(16, 11, 1, 1, FP.pink);
      p.box(0, 16, 20, 3, FP.wood, FP.woodL);
      p.box(1, 18, 18, 8, FP.woodL);
      p.r(2, 22, 16, 1, FP.wood);
      p.r(9, 20, 2, 1, FP.yel); p.r(9, 24, 2, 1, FP.yel);
      p.r(2, 26, 2, 4, FP.O); p.r(16, 26, 2, 4, FP.O);
    } }],
    visits: [
      f => [
        { go: f.x(16) },
        { anim: 'clean', ms: 2600, dir: -1, fx: ['✨', '💄', '✨'], fxEvery: 550 },
        S.happy(900, { dir: 1, fx: ['💖'] }),
        { anim: 'clean', ms: 2200, dir: -1, fx: ['✨', '💄'], fxEvery: 550 },
        { go: f.x(-16) },
        { anim: 'clean', ms: 2000, dir: 1, fx: ['✨', '💄'], fxEvery: 550 },
        S.dance(1600, 400, { fx: ['💖', '✨'], fxEvery: 400 }),
      ],
      /* Se prueba "sombreros" frente al espejo y posa con cada uno. */
      f => [
        { go: f.x(15) },
        S.wait(700, 'idle', { dir: -1 }),
        { anim: 'clean', ms: 900, dir: -1, fx: ['🎀'] }, { bounce: 1, ms: 420, h: 12, dir: 1 }, S.happy(700, { dir: 1 }),
        { anim: 'clean', ms: 900, dir: -1, fx: ['👑'] }, { bounce: 1, ms: 420, h: 12, dir: 1 }, S.happy(700, { dir: 1 }),
        { anim: 'clean', ms: 900, dir: -1, fx: ['🎩'] }, { bounce: 1, ms: 420, h: 12, dir: 1 }, S.happy(700, { dir: 1 }),
        { anim: 'clean', ms: 900, dir: -1, fx: ['🌸'] }, S.dance(1600, 300, { fx: ['💖'], fxEvery: 500 }),
      ],
      /* Se queda mirándose de cerca y se tira besos. */
      f => [
        { go: f.x(13) },
        S.wait(1500, 'idle', { dir: -1 }),
        { anim: 'pet', ms: 2400, dir: -1, fx: ['💋', '💖'], fxEvery: 600 },
        { bounce: 2, ms: 400, h: 10 },
        S.wait(1200, 'idle', { dir: -1, fx: ['😊'] }),
        { anim: 'clean', ms: 1800, dir: -1, fx: ['✨'], fxEvery: 450 },
        S.happy(900, { dir: 1 }),
      ],
    ],
    /* Uno se arregla y el otro lo mira y aplaude; después cambian. */
    duos: [
      f => ({
        a: [{ go: f.x(14) }, S.sync('in'), { anim: 'clean', ms: 2400, dir: -1, fx: ['💄', '✨'], fxEvery: 500 },
          S.happy(700, { dir: 'partner' }), S.sync('swap'), { go: f.x(26) },
          S.wait(1800, 'idle', { dir: 'partner' }), { bounce: 2, ms: 400, h: 12, fx: ['👏'] }, S.sync('end'), S.dance(900, 300)],
        b: [{ go: f.x(26) }, S.sync('in'), S.wait(1600, 'idle', { dir: 'partner' }), { bounce: 2, ms: 400, h: 12, fx: ['👏'] },
          S.sync('swap'), { go: f.x(13) }, { anim: 'clean', ms: 2000, dir: -1, fx: ['💄', '💖'], fxEvery: 500 },
          S.happy(500, { dir: 'partner' }), S.sync('end'), S.dance(900, 300)],
      }),
    ] },

  trampolin: { w: 26, h: 8,
    parts: [
      { id: 'legs', draw: p => {
        p.r(2, 4, 2, 4, FP.metalD); p.r(22, 4, 2, 4, FP.metalD); p.r(12, 4, 2, 4, FP.metalD);
      } },
      /* La lona se hunde un poquito cada vez que alguien cae. */
      { id: 'mat', pose: (rt, now, k) => {
        const t = (now - (rt.landAt || -1e9)) / 220;
        return { y: t < 1 ? -Math.sin(Math.PI * t) * 1.5 * k : 0 };
      }, draw: p => {
        p.box(0, 1, 26, 4, FP.blue, FP.blueL);
        p.r(2, 2, 22, 1, FP.dark);
      } },
    ],
    visits: [
      f => [
        { go: f.x(-18) },
        { hop: { x: f.x(0), y: f.y(6) }, ms: 450, h: 16 },
        { bounce: 4, ms: 520, h: 40, onBounce: rt => { rt.landAt = performance.now(); } },
        { bounce: 3, ms: 680, h: 64, onBounce: rt => { rt.landAt = performance.now(); } },
        S.happy(500, { fx: ['⭐'] }),
        { bounce: 5, ms: 430, h: 28, onBounce: rt => { rt.landAt = performance.now(); } },
        { bounce: 2, ms: 720, h: 72, onBounce: rt => { rt.landAt = performance.now(); } },
        S.happy(600, { fx: ['⭐'] }),
        { bounce: 4, ms: 560, h: 46, onBounce: rt => { rt.landAt = performance.now(); } },
        { hop: { x: f.x(19), y: 0 }, ms: 500, h: 26 },
        S.happy(700, { fx: ['⭐'] }),
      ],
      /* Acrobacias: en lo más alto de cada salto gira y se luce. */
      f => [
        { go: f.x(18) },
        { hop: { x: f.x(0), y: f.y(6) }, ms: 450, h: 16 },
        { bounce: 3, ms: 520, h: 40, onBounce: rt => { rt.landAt = performance.now(); } },
        { bounce: 6, ms: 760, h: 78, anim: 'celebrate', onBounce: rt => { rt.landAt = performance.now(); },
          onApex: (rt, act) => { act.dir *= -1; petFx(pickOne(['✨', '⭐', '🌟']), act); } },
        { bounce: 2, ms: 400, h: 16, onBounce: rt => { rt.landAt = performance.now(); } },
        S.wait(700, 'sick', { fx: ['💫'] }),   // mareado de tanta vuelta
        { hop: { x: f.x(-19), y: 0 }, ms: 500, h: 22 },
        S.happy(800),
      ],
    ],
    /* Saltan alternados: cuando uno cae, el otro sube. */
    duos: [
      f => ({
        a: [{ go: f.x(-20) }, S.sync('in'), { hop: { x: f.x(-5), y: f.y(6) }, ms: 450, h: 16 }, S.sync('on'),
          { bounce: 8, ms: 600, h: 48, onBounce: rt => { rt.landAt = performance.now(); } },
          S.sync('off'), { hop: { x: f.x(-21), y: 0 }, ms: 500, h: 26 }, S.happy(800, { dir: 'partner', fx: ['😆'] })],
        b: [{ go: f.x(20) }, S.sync('in'), { hop: { x: f.x(5), y: f.y(6) }, ms: 450, h: 16 }, S.sync('on'),
          S.wait(300, 'idle'),
          { bounce: 8, ms: 600, h: 48, onBounce: rt => { rt.landAt = performance.now(); } },
          S.sync('off'), { hop: { x: f.x(21), y: 0 }, ms: 500, h: 26 }, S.happy(800, { dir: 'partner' })],
      }),
    ] },

  /* Tres pelotas, mismos 16 juegos solos y 9 de a dos (BALL_VISITS / BALL_DUOS). */
  pelota: ballArt(9, p => {
    p.disc(4.5, 4.5, 4.5, (x, y) => y < 4 ? FP.red : y === 4 ? FP.O : FP.white);
    p.r(2, 2, 1, 1, FP.pinkL);
  }),
  /* Balón de fútbol: el pentágono negro al centro y medio pentágono en cada
     borde, como el clásico. Dibujado píxel a píxel: a 10x10, generado con
     discos los parches no se leían. Sombra gris abajo a la derecha. */
  balon: ballArt(10, p => {
    const MAP = [
      '..OOOOOO..',
      '.OWWWWWWO.',
      'OWWWKKWWWO',
      'OWWKKKKWWO',
      'OWWWKKWWWO',
      'OKWWWWWWKO',
      'OKKWWWWKKO',
      'OWWWKKWWWO',
      '.OWKKKKWO.',
      '..OOOOOO..',
    ];
    /* Los parches van en un gris carbón y no del color del contorno: si no,
       se pegan al borde y el balón se lee como una calavera. */
    MAP.forEach((row, y) => [...row].forEach((c, x) => {
      if (c === 'O') p.r(x, y, 1, 1, FP.O);
      else if (c === 'K') p.r(x, y, 1, 1, '#4a4058');
      else if (c === 'W') p.r(x, y, 1, 1, x + y >= 12 ? FP.gray : FP.white);
    }));
    p.r(2, 2, 1, 1, FP.whiteL);
  }),
  /* Pelota de playa: seis gajos de colores y el botón blanco al centro. */
  playa: ballArt(12, p => {
    const col = [FP.red, FP.yel, FP.blue, FP.white, FP.green, FP.orange];
    p.disc(6, 6, 6, (x, y) => {
      const dx = x + 0.5 - 6, dy = y + 0.5 - 6;
      if (Math.hypot(dx, dy) < 1.6) return FP.white;
      return col[Math.floor((Math.atan2(dy, dx) + Math.PI) / (Math.PI / 3)) % 6];
    });
    p.r(3, 3, 1, 1, FP.whiteL); p.r(4, 2, 1, 1, FP.whiteL);
  }),

  columpio: { w: 28, h: 36,
    parts: [
      { id: 'base', draw: p => {
        p.line(3, 35, 7, 1, FP.woodD, 2); p.line(24, 35, 20, 1, FP.woodD, 2);
        p.box(4, 0, 20, 3, FP.wood, FP.woodL);
      } },
      { id: 'seat', pivot: [14, 2], pose: rt => ({ r: rt.swing }), draw: p => {
        p.r(9, 3, 1, 23, FP.rope); p.r(18, 3, 1, 23, FP.rope);
        p.box(7, 26, 14, 3, FP.red, FP.redL);
      } },
    ],
    visits: [
      f => [
        { go: f.x(0) },
        { hop: { x: f.x(0), y: f.y(9) }, ms: 400, h: 10 },
        /* Cada tramo dura un múltiplo exacto del período: así termina con el
           asiento derecho y el siguiente arranca sin salto. */
        { anim: 'happy', ms: 3000, swing: { amp: 0.25, period: 1500, L: f.y(24) } },
        { anim: 'happy', ms: 7500, swing: { amp: 0.5, period: 1500, L: f.y(24) }, fx: ['🎵'], fxEvery: 1500 },
        { anim: 'happy', ms: 3000, swing: { amp: 0.25, period: 1500, L: f.y(24) } },
        { hop: { x: f.x(17), y: 0 }, ms: 450, h: 16 },
      ],
      /* Se tira en lo más alto y aterriza lejos. */
      f => [
        { go: f.x(0) },
        { hop: { x: f.x(0), y: f.y(9) }, ms: 400, h: 10 },
        { anim: 'happy', ms: 4500, swing: { amp: 0.32, period: 1500, L: f.y(24) } },
        { anim: 'happy', ms: 4125, swing: { amp: 0.55, period: 1500, L: f.y(24) }, fx: ['😆'], fxEvery: 1200 },
        { hop: { x: f.x(-34), y: 0 }, ms: 800, h: 46, anim: 'celebrate', start: rt => { rt.swing = 0; } },
        { bounce: 1, ms: 380, h: 8, fx: ['⭐'] },
        S.happy(900, { fx: ['👏'] }),
      ],
    ],
    /* Uno se columpia y el otro lo empuja desde atrás; después cambian. */
    duos: [
      f => ({
        a: [{ go: f.x(0) }, { hop: { x: f.x(0), y: f.y(9) }, ms: 400, h: 10 }, S.sync('up'),
          { anim: 'happy', ms: 6000, swing: { amp: 0.42, period: 1500, L: f.y(24) }, fx: ['😆'], fxEvery: 1500 },
          S.sync('swap'), { hop: { x: f.x(-20), y: 0 }, ms: 450, h: 16 }, S.sync('b-up'),
          { anim: 'pet', ms: 6000, dir: 1 }, S.sync('end'), S.happy(800, { dir: 'partner' })],
        b: [{ go: f.x(-20) }, S.sync('up', { dir: 1 }), { anim: 'pet', ms: 6000, dir: 1 },
          S.sync('swap'), { go: f.x(0) }, { hop: { x: f.x(0), y: f.y(9) }, ms: 400, h: 10 }, S.sync('b-up'),
          { anim: 'happy', ms: 6000, swing: { amp: 0.42, period: 1500, L: f.y(24) }, fx: ['😆'], fxEvery: 1500 },
          S.sync('end'), { hop: { x: f.x(18), y: 0 }, ms: 450, h: 16 }, S.happy(800, { dir: 'partner' })],
      }),
    ] },

  tobogan: { w: 34, h: 24,
    parts: [{ id: 'base', draw: p => {
      p.r(0, 2, 1, 22, FP.metalD); p.r(5, 2, 1, 22, FP.metalD);
      for (let y = 5; y < 24; y += 4) p.r(1, y, 4, 1, FP.metal);
      p.r(20, 13, 2, 11, FP.metalD);
      for (let i = 0; i <= 22; i++){
        const x = 10 + i, y = 2 + Math.round(i * 0.82);
        p.r(x, y - 1, 1, 1, FP.O); p.r(x, y, 1, 3, FP.red); p.r(x, y + 3, 1, 1, FP.O);
      }
      p.r(31, 20, 3, 2, FP.red); p.r(31, 22, 3, 1, FP.O);
      p.box(0, 1, 11, 3, FP.yel, FP.yelL);
    } }],
    visits: [
      /* Dos vueltas: sube, se tira, vuelve corriendo a la escalera y otra vez. */
      f => {
        const vuelta = () => [
          { go: f.x(-21) },
          { slide: { x: f.x(-14), y: f.y(23) }, ms: 1300, anim: 'walk' },
          { go: f.x(-9), speed: 0.07 },
          S.happy(600, { dir: 1 }),
          { slide: { x: f.x(15), y: f.y(4) }, ms: 650, anim: 'happy', fx: ['💨'] },
          { hop: { x: f.x(21), y: 0 }, ms: 350, h: 8 },
          S.happy(800, { fx: ['💨', '⭐'], fxEvery: 350 }),
        ];
        return [...vuelta(), ...vuelta()];
      },
      /* Sube por la rampa al revés (no se debe, pero es más divertido) y se
         tira de guata. */
      f => [
        { go: f.x(22) },
        { slide: { x: f.x(15), y: f.y(4) }, ms: 400, anim: 'walk' },
        { slide: { x: f.x(-6), y: f.y(21) }, ms: 2200, anim: 'walk', fx: ['💦'], fxEvery: 700 },
        { slide: { x: f.x(4), y: f.y(13) }, ms: 400, anim: 'sad' },   // se resbala un poco
        { slide: { x: f.x(-8), y: f.y(22) }, ms: 1200, anim: 'walk' },
        S.happy(700, { dir: 1, fx: ['😤'] }),
        { slide: { x: f.x(15), y: f.y(4) }, ms: 600, anim: 'celebrate', fx: ['💨'] },
        { hop: { x: f.x(22), y: 0 }, ms: 350, h: 8 },
        S.dance(1000, 300, { fx: ['😆'] }),
      ],
    ],
    /* Trencito: bajan uno detrás del otro, dos veces. */
    duos: [
      f => {
        const lap = (n, first) => [
          { go: f.x(first ? -21 : -27) },
          S.sync('l' + n + 'a'),
          ...(first ? [] : [S.wait(700, 'idle', { dir: 1 })]),
          { slide: { x: f.x(-14), y: f.y(23) }, ms: 1200, anim: 'walk' },
          { go: f.x(-9), speed: 0.08 },
          { slide: { x: f.x(15), y: f.y(4) }, ms: 650, anim: 'happy', fx: ['💨'] },
          { hop: { x: f.x(first ? 24 : 19), y: 0 }, ms: 350, h: 8 },
          S.sync('l' + n + 'b'),
          S.happy(500, { dir: 'partner', fx: ['😆'] }),
        ];
        return { a: [...lap(0, true), ...lap(1, false)], b: [...lap(0, false), ...lap(1, true)] };
      },
    ] },

  radiocasete: { w: 16, h: 12,
    parts: [
      { id: 'base', pose: (rt, now, k) => ({ sy: rt.on ? 1 + Math.max(0, Math.sin(now / 95)) * 0.06 : 1 }), pivot: [8, 12], draw: p => {
        p.r(4, 0, 8, 1, FP.O); p.r(4, 0, 1, 3, FP.O); p.r(11, 0, 1, 3, FP.O);
        p.box(0, 2, 16, 10, FP.metalD, '#7c849a');
        p.disc(4, 7.5, 2.6, FP.dark); p.disc(12, 7.5, 2.6, FP.dark);
        p.r(6, 4, 4, 2, FP.gray);
      } },
      { id: 'light', show: 'on', draw: p => { p.r(7, 9, 2, 1, '#5cff8a'); } },
    ],
    visits: [
      f => [
        { go: f.x(14), start: rt => { rt.on = true; } },
        S.dance(3200, 420, { fx: ['🎵', '🎶'], fxEvery: 450 }),
        { bounce: 4, ms: 380, h: 14 },
        { go: f.x(-14) },
        S.dance(3000, 300, { fx: ['🎵', '🎶'], fxEvery: 400 }),
        { bounce: 3, ms: 380, h: 18 },
        S.dance(1500, 250, { fx: ['🎶'], fxEvery: 300, end: rt => { rt.on = false; } }),
      ],
      /* Busca una estación: prende y apaga, baila lento, y cuando encuentra
         "su" canción se vuelve loco. */
      f => [
        { go: f.x(12) },
        { anim: 'pet', ms: 500, dir: -1, start: rt => { rt.on = true; } },
        S.wait(700, 'idle', { dir: -1, fx: ['📻'] }),
        { anim: 'pet', ms: 400, dir: -1, start: rt => { rt.on = false; } },
        { anim: 'pet', ms: 400, dir: -1, start: rt => { rt.on = true; } },
        { anim: 'idle', ms: 2600, flip: 900, fx: ['🎵'], fxEvery: 900 },
        { anim: 'pet', ms: 400, dir: -1, fx: ['❗'] },
        { bounce: 3, ms: 340, h: 20, fx: ['🎶'] },
        S.dance(3000, 200, { fx: ['🎶', '🔥'], fxEvery: 350 }),
        { bounce: 2, ms: 480, h: 26, end: rt => { rt.on = false; } },
      ],
    ],
    /* Bailan juntos frente a frente, a contratiempo. */
    duos: [
      f => ({
        a: [{ go: f.x(-14), start: rt => { rt.on = true; } }, S.sync('in', { dir: 'partner' }),
          S.dance(2400, 400, { fx: ['🎵'], fxEvery: 600 }), { bounce: 3, ms: 400, h: 16 },
          S.sync('m'), S.dance(2400, 300), { bounce: 2, ms: 500, h: 22 }, S.sync('end', { dir: 'partner' }),
          S.happy(800, { dir: 'partner', fx: ['😆'], end: rt => { rt.on = false; } })],
        b: [{ go: f.x(14) }, S.sync('in', { dir: 'partner' }),
          { bounce: 3, ms: 400, h: 16 }, S.dance(2400, 400, { fx: ['🎶'], fxEvery: 600 }),
          S.sync('m'), { bounce: 2, ms: 500, h: 22 }, S.dance(2400, 300), S.sync('end', { dir: 'partner' }),
          S.happy(800, { dir: 'partner' })],
      }),
    ] },

  tele: { w: 20, h: 20,
    parts: [
      { id: 'base', draw: p => {
        p.line(10, 4, 6, 0, FP.O); p.line(10, 4, 14, 0, FP.O);
        p.box(1, 4, 18, 12, '#4a3a6a', '#5e4b85');
        p.r(3, 6, 12, 8, '#16202b');
        p.r(16, 7, 1, 1, FP.yel); p.r(16, 10, 1, 1, FP.yel);
        p.r(4, 16, 2, 4, FP.O); p.r(14, 16, 2, 4, FP.O);
      } },
      { id: 'screen', show: 'on', flicker: true, draw: p => {
        p.r(3, 6, 12, 8, '#7cc6ff'); p.r(11, 7, 2, 2, FP.yel);
        p.r(3, 11, 12, 3, FP.green); p.r(6, 10, 5, 1, FP.green);
      } },
    ],
    visits: [
      f => [
        { go: f.x(16), start: rt => { rt.on = true; } },
        S.wait(5000, 'idle', { dir: -1 }),
        S.happy(1200, { dir: -1, fx: ['😆'], fxEvery: 600 }),
        { bounce: 2, ms: 420, h: 12 },
        S.wait(5500, 'idle', { dir: -1, fx: ['😆'], fxEvery: 2600 }),
        S.dance(1500, 500, { fx: ['😆'], fxEvery: 700, end: rt => { rt.on = false; } }),
      ],
      /* Se queda dormido frente a la tele y despierta de un salto. */
      f => [
        { go: f.x(15), start: rt => { rt.on = true; } },
        S.wait(3000, 'idle', { dir: -1 }),
        { anim: 'sleep', ms: 4500, fx: ['💤'], fxEvery: 1400 },
        { bounce: 1, ms: 500, h: 26, anim: 'celebrate', fx: ['❗'] },
        S.wait(1200, 'idle', { dir: -1, fx: ['😳'] }),
        S.happy(1500, { dir: -1, fx: ['😆'], end: rt => { rt.on = false; } }),
      ],
    ],
    duos: [
      f => ({
        a: [{ go: f.x(14), start: rt => { rt.on = true; } }, S.sync('in'), S.wait(4000, 'idle', { dir: -1 }),
          S.sync('laugh'), S.happy(1400, { dir: 'partner', fx: ['😆'], fxEvery: 500 }), { bounce: 2, ms: 400, h: 12 },
          S.wait(3500, 'idle', { dir: -1 }), S.sync('end', { end: rt => { rt.on = false; } }), S.happy(600, { dir: 'partner' })],
        b: [{ go: f.x(24) }, S.sync('in'), S.wait(4000, 'idle', { dir: -1 }),
          S.sync('laugh'), { bounce: 2, ms: 400, h: 12 }, S.happy(1400, { dir: 'partner', fx: ['😂'], fxEvery: 500 }),
          { anim: 'sleep', ms: 3500, fx: ['💤'], fxEvery: 1500 }, S.sync('end'), S.happy(600, { dir: 'partner' })],
      }),
    ] },

  piano: { w: 26, h: 20,
    parts: [{ id: 'base', draw: p => {
      p.box(0, 0, 26, 14, '#3b2433', '#53324a');
      p.r(9, 3, 8, 5, FP.white); p.r(10, 5, 6, 1, FP.grayD);
      p.box(0, 11, 26, 5, FP.white);
      for (let i = 0; i < 8; i++) p.r(2 + i * 3, 12, 1, 2, '#1d1424');
      p.r(2, 16, 2, 4, FP.O); p.r(22, 16, 2, 4, FP.O);
    } }],
    visits: [
      f => [
        { go: f.x(18) },
        S.happy(3600, { dir: -1, fx: ['🎵', '🎹', '🎶'], fxEvery: 380 }),
        { go: f.x(-18) },
        S.happy(3200, { dir: 1, fx: ['🎵', '🎹', '🎶'], fxEvery: 380 }),
        { bounce: 2, ms: 450, h: 16 },
        S.dance(1500, 500, { fx: ['🎶'], fxEvery: 500 }),
      ],
      /* Toca con los pies: salta de tecla en tecla por encima del piano. */
      f => {
        const top = f.y(14);
        const steps = [{ go: f.x(-18) }, { hop: { x: f.x(-10), y: top }, ms: 500, h: 18 }];
        for (const dx of [-5, 0, 5, 10, 5, 0, -5, -10, 0, 10]){
          steps.push({ hop: { x: f.x(dx), y: top }, ms: 330, h: 10, fx: [pickOne(['🎵', '🎶'])] });
        }
        steps.push(S.happy(700, { fx: ['🎹'] }), { hop: { x: f.x(20), y: 0 }, ms: 500, h: 14 }, S.happy(700, { fx: ['👏'] }));
        return steps;
      },
    ],
    /* Uno toca y el otro baila; al final hacen una reverencia juntos. */
    duos: [
      f => ({
        a: [{ go: f.x(18) }, S.sync('in'), S.happy(5000, { dir: -1, fx: ['🎵', '🎹', '🎶'], fxEvery: 350 }),
          S.sync('end'), { anim: 'eat', ms: 900, dir: 'partner' }, S.happy(700)],
        b: [{ go: f.x(-24) }, S.sync('in'), S.dance(2500, 350, { fx: ['🎶'], fxEvery: 700 }), { bounce: 3, ms: 420, h: 18 },
          S.dance(1200, 250), S.sync('end'), { anim: 'eat', ms: 900, dir: 'partner' }, S.happy(700, { fx: ['👏'] })],
      }),
    ] },

  tarima: { w: 28, h: 7,
    parts: [{ id: 'base', draw: p => {
      p.box(0, 0, 28, 7, FP.woodL, '#f0b98a');
      p.r(1, 2, 26, 1, FP.pink); p.r(1, 4, 26, 1, FP.wood);
    } }],
    visits: [
      f => [
        { go: f.x(-21) },
        { hop: { x: f.x(-9), y: f.y(7) }, ms: 420, h: 14 },
        { go: f.x(9), speed: 0.07 },
        S.happy(900),
        { go: f.x(-9), speed: 0.07 },
        S.wait(800),
        { go: f.x(9), speed: 0.05 },
        { bounce: 2, ms: 450, h: 18 },
        S.happy(800, { fx: ['⭐'] }),
        { hop: { x: f.x(21), y: 0 }, ms: 420, h: 12 },
      ],
      /* Show: sube, saluda al público, canta, hace reverencia y recibe aplausos. */
      f => [
        { go: f.x(-21) },
        { hop: { x: f.x(0), y: f.y(7) }, ms: 450, h: 16 },
        { anim: 'eat', ms: 900, fx: ['🎤'] },   // reverencia de entrada
        S.dance(2600, 450, { fx: ['🎤', '🎵'], fxEvery: 650 }),
        { bounce: 3, ms: 420, h: 20 },
        { anim: 'celebrate', ms: 900, fx: ['🌟'] },
        { anim: 'eat', ms: 1100, fx: ['👏', '🌹'], fxEvery: 350 },
        { hop: { x: f.x(21), y: 0 }, ms: 420, h: 12 },
      ],
    ],
    duos: [
      f => ({
        a: [{ go: f.x(-21) }, S.sync('in'), { hop: { x: f.x(-6), y: f.y(7) }, ms: 450, h: 16 }, S.sync('on', { dir: 'partner' }),
          S.dance(2400, 400, { fx: ['🎤'] }), { bounce: 2, ms: 450, h: 20 }, S.sync('bow', { dir: 1 }),
          { anim: 'eat', ms: 1200, dir: 1, fx: ['👏'], fxEvery: 400 }, { hop: { x: f.x(-22), y: 0 }, ms: 420, h: 12 }],
        b: [{ go: f.x(21) }, S.sync('in'), { hop: { x: f.x(6), y: f.y(7) }, ms: 450, h: 16 }, S.sync('on', { dir: 'partner' }),
          { bounce: 2, ms: 450, h: 20 }, S.dance(2400, 400, { fx: ['🎵'] }), S.sync('bow', { dir: -1 }),
          { anim: 'eat', ms: 1200, dir: -1 }, { hop: { x: f.x(22), y: 0 }, ms: 420, h: 12 }],
      }),
    ] },

  librero: { w: 22, h: 22,
    parts: [{ id: 'base', draw: p => {
      p.box(0, 0, 22, 22, FP.wood, FP.woodL);
      p.r(2, 2, 18, 8, FP.woodD); p.r(2, 12, 18, 8, FP.woodD);
      p.r(3, 4, 2, 6, FP.red); p.r(5, 3, 2, 7, FP.blue); p.r(7, 5, 2, 5, FP.green);
      p.r(10, 4, 2, 6, FP.yel); p.r(12, 3, 2, 7, FP.pink);
      p.r(3, 14, 2, 6, FP.blue); p.r(5, 15, 3, 5, FP.red); p.r(14, 13, 2, 7, FP.green); p.r(16, 15, 2, 5, FP.yel);
    } }],
    visits: [
      f => [
        { go: f.x(-20) },
        { hop: { x: f.x(-2), y: f.y(22) }, ms: 600, h: 24 },
        S.wait(2600, 'idle', { fx: ['⭐'], fxEvery: 1200 }),
        S.wait(1000, 'idle', { dir: 1 }),
        S.wait(1000, 'idle', { dir: -1 }),
        S.happy(1500, { fx: ['⭐'], fxEvery: 700 }),
        { bounce: 2, ms: 480, h: 18 },
        S.wait(1800, 'idle', { fx: ['💤'] }),
        S.wait(1000, 'idle', { dir: 1 }),
        S.dance(1200, 400, { fx: ['⭐'], fxEvery: 600 }),
        { hop: { x: f.x(20), y: 0 }, ms: 600, h: 14 },
      ],
      /* Saca un libro y se pone a leer sentado arriba. */
      f => [
        { go: f.x(14) },
        { anim: 'pet', ms: 900, dir: -1, fx: ['📕'] },
        { hop: { x: f.x(2), y: f.y(22) }, ms: 600, h: 24 },
        { anim: 'eat', ms: 6000, fx: ['📖', '💭'], fxEvery: 1500 },
        S.happy(900, { fx: ['💡'] }),
        { hop: { x: f.x(-20), y: 0 }, ms: 600, h: 14 },
      ],
    ],
    /* Uno trepa y el otro queda abajo saltando para alcanzarlo. */
    duos: [
      f => ({
        a: [{ go: f.x(-20) }, { hop: { x: f.x(-2), y: f.y(22) }, ms: 600, h: 24 }, S.sync('top'),
          S.happy(2600, { dir: 1, fx: ['😆'], fxEvery: 900 }), S.sync('down'),
          { hop: { x: f.x(-20), y: 0 }, ms: 600, h: 14 }, S.happy(900, { dir: 'partner' })],
        b: [{ go: f.x(18) }, S.sync('top'), { bounce: 4, ms: 500, h: 26, dir: -1, fx: ['😤'], fxEvery: 1000 },
          S.wait(500, 'sad'), S.sync('down'), S.happy(900, { dir: 'partner', fx: ['💖'] })],
      }),
    ] },

  cajas: { w: 26, h: 22,
    parts: [
      { id: 'base', draw: p => {
        p.box(0, 12, 13, 10, FP.box, FP.boxL); p.r(5, 13, 3, 8, FP.tape);
        p.box(13, 12, 13, 10, FP.box, FP.boxL); p.r(18, 13, 3, 8, FP.tape);
      } },
      /* La de arriba se sacude cuando alguien se esconde adentro. */
      { id: 'top', pivot: [19, 13], pose: (rt, now) => ({ r: rt.wiggle ? Math.sin(now / 45) * 0.06 : 0 }), draw: p => {
        p.box(13, 2, 13, 11, FP.box, FP.boxL); p.r(18, 3, 3, 9, FP.tape);
      } },
    ],
    visits: [
      f => [
        { go: f.x(-20) },
        { hop: { x: f.x(-6), y: f.y(10) }, ms: 420, h: 14 },
        S.wait(500),
        { hop: { x: f.x(6), y: f.y(20) }, ms: 420, h: 14 },
        S.happy(1600, { fx: ['🎉', '⭐'], fxEvery: 500 }),
        { hop: { x: f.x(-6), y: f.y(10) }, ms: 420, h: 10 },
        S.wait(700),
        { hop: { x: f.x(6), y: f.y(20) }, ms: 420, h: 14 },
        S.dance(2200, 500, { fx: ['🎉', '⭐'], fxEvery: 450 }),
        { bounce: 3, ms: 420, h: 16 },
        { hop: { x: f.x(20), y: 0 }, ms: 550, h: 12 },
        S.wait(600),
        { go: f.x(-20) },
        { hop: { x: f.x(-6), y: f.y(10) }, ms: 420, h: 14 },
        { hop: { x: f.x(6), y: f.y(20) }, ms: 420, h: 14 },
        S.happy(1500, { fx: ['🎉'], fxEvery: 500 }),
        { hop: { x: f.x(20), y: 0 }, ms: 550, h: 12 },
      ],
      /* Se mete en la caja de arriba, la caja se sacude... ¡y sale de un salto! */
      f => [
        { go: f.x(-20) },
        { hop: { x: f.x(-6), y: f.y(10) }, ms: 420, h: 14 },
        { hop: { x: f.x(6), y: f.y(14) }, ms: 450, h: 18, end: (rt, act) => { act.hidden = true; } },
        { anim: 'idle', ms: 2600, hide: true, start: rt => { rt.wiggle = true; }, end: rt => { rt.wiggle = false; } },
        S.wait(1200, 'idle', { hide: true }),
        { hop: { x: f.x(6), y: f.y(20) }, ms: 450, h: 26, anim: 'celebrate', hide: false, fx: ['😆'] },
        S.dance(1400, 350, { fx: ['🎉'] }),
        { hop: { x: f.x(20), y: 0 }, ms: 550, h: 12 },
      ],
    ],
    /* Cada uno en un escalón; se cambian saltándose. */
    duos: [
      f => ({
        a: [{ go: f.x(-20) }, { hop: { x: f.x(-6), y: f.y(10) }, ms: 420, h: 14 }, { hop: { x: f.x(6), y: f.y(20) }, ms: 420, h: 14 },
          S.sync('up'), S.happy(1500, { dir: 'partner', fx: ['🎉'] }), S.sync('swap'),
          { hop: { x: f.x(-20), y: 0 }, ms: 600, h: 16 }, S.sync('end'), S.happy(800, { dir: 'partner' })],
        b: [{ go: f.x(-24) }, S.sync('up'), { hop: { x: f.x(-6), y: f.y(10) }, ms: 420, h: 14 }, S.wait(1080, 'happy', { dir: 1 }),
          S.sync('swap'), S.wait(300), { hop: { x: f.x(6), y: f.y(20) }, ms: 420, h: 14 }, S.happy(1200, { fx: ['⭐'] }),
          S.sync('end'), { hop: { x: f.x(20), y: 0 }, ms: 550, h: 12 }],
      }),
    ] },

  /* ---------------- los nuevos ---------------- */

  /* Pecera: el pez nada solo todo el tiempo; si le golpean el vidrio, se
     pone a nadar como loco un rato (rt.excitedUntil). */
  pecera: { w: 16, h: 22,
    init: rt => { rt.fishPh = 0; rt.excitedUntil = 0; },
    parts: [
      { id: 'base', draw: p => {
        p.box(0, 13, 16, 3, FP.wood, FP.woodL);
        p.r(2, 16, 2, 6, FP.woodD); p.r(12, 16, 2, 6, FP.woodD);
        p.r(1, 21, 4, 1, FP.O); p.r(11, 21, 4, 1, FP.O);
        p.disc(8, 7, 6.6, (x, y) => y < 3 ? '#e8f6ff' : y >= 11 ? '#e8d29a' : FP.water);
        p.r(4, 4, 1, 3, FP.whiteL);
        p.r(11, 8, 1, 4, FP.green); p.r(12, 9, 1, 3, FP.greenD); p.r(10, 10, 1, 2, FP.greenD);
      } },
      { id: 'fish', pose: (rt, now, k, dt) => {
        const fast = now < rt.excitedUntil;
        rt.fishPh += dt * (fast ? 4.5 : 1.3);
        const vx = Math.cos(rt.fishPh);
        return { x: Math.sin(rt.fishPh) * 2.6 * k, y: Math.sin(rt.fishPh * 1.7) * 1 * k, sx: vx > 0 ? -1 : 1 };
      }, draw: p => {
        p.r(6, 6, 3, 2, FP.orange); p.r(9, 6, 1, 2, FP.orangeL); p.r(10, 5, 1, 1, FP.orangeL); p.r(10, 8, 1, 1, FP.orangeL);
        p.r(6, 6, 1, 1, FP.O);
      } },
    ],
    visits: [
      f => [
        { go: f.x(13) },
        S.wait(3000, 'idle', { dir: -1, fx: ['🐟'], fxEvery: 1400 }),
        { bounce: 1, ms: 350, h: 8, dir: -1, start: rt => { rt.excitedUntil = performance.now() + 3200; }, fx: ['💧'] },
        S.happy(1600, { dir: -1, fx: ['🐟', '💧'], fxEvery: 500 }),
        S.wait(1500, 'idle', { dir: -1 }),
        { bounce: 1, ms: 350, h: 8, dir: -1, start: rt => { rt.excitedUntil = performance.now() + 3200; } },
        S.dance(1800, 450, { fx: ['😆'] }),
      ],
      /* Le da de comer: los peces suben como locos y él aplaude. */
      f => [
        { go: f.x(-13) },
        { anim: 'pet', ms: 1500, dir: 1, fx: ['✨'], fxEvery: 300, start: rt => { rt.excitedUntil = performance.now() + 4000; } },
        S.happy(1200, { dir: 1, fx: ['🐟'] }),
        S.wait(2500, 'idle', { dir: 1, fx: ['🐟', '💖'], fxEvery: 1200 }),
        { bounce: 2, ms: 400, h: 12, fx: ['👏'] },
        S.dance(1600, 400),
      ],
    ],
    duos: [
      f => ({
        a: [{ go: f.x(13) }, S.sync('in', { dir: -1 }), S.wait(2400, 'idle', { dir: -1 }),
          { bounce: 1, ms: 350, h: 8, start: rt => { rt.excitedUntil = performance.now() + 2500; }, fx: ['💧'] },
          S.sync('b'), S.happy(2400, { dir: 'partner', fx: ['🐟'], fxEvery: 800 })],
        b: [{ go: f.x(-13) }, S.sync('in', { dir: 1 }), S.wait(2750, 'idle', { dir: 1 }), S.sync('b'),
          { bounce: 1, ms: 350, h: 8, start: rt => { rt.excitedUntil = performance.now() + 2500; }, fx: ['💧'] },
          S.happy(2000, { dir: 'partner', fx: ['😆'], fxEvery: 800 })],
      }),
    ] },

  /* Maceta: regada, florece por un rato (rt.bloomUntil). */
  maceta: { w: 14, h: 24,
    init: rt => { rt.bloomUntil = 0; },
    parts: [
      { id: 'base', draw: p => {
        p.r(6, 6, 2, 10, FP.greenD);
        p.r(2, 9, 4, 2, FP.green); p.r(1, 10, 1, 1, FP.greenD); p.r(8, 7, 4, 2, FP.green); p.r(12, 8, 1, 1, FP.greenD);
        p.r(3, 12, 3, 2, FP.green); p.r(8, 11, 3, 2, FP.green);
        p.r(6, 4, 2, 2, FP.pinkL);
        p.box(3, 16, 8, 8, '#c96f4a', '#e08a5f');
        p.box(2, 15, 10, 3, '#e08a5f', '#f2a07a');
      } },
      { id: 'bloom', show: (rt, now) => now < rt.bloomUntil, pose: (rt, now, k) => ({ y: Math.sin(now / 500) * 0.4 * k }), draw: p => {
        p.r(5, 1, 4, 1, '#ff7bb0'); p.r(4, 2, 6, 3, '#ff7bb0'); p.r(5, 5, 4, 1, '#ff7bb0');
        p.r(3, 3, 1, 1, '#ff7bb0'); p.r(10, 3, 1, 1, '#ff7bb0');
        p.r(6, 2, 2, 3, FP.yel); p.r(6, 3, 2, 1, FP.orange);
      } },
    ],
    visits: [
      f => [
        { go: f.x(-14) },
        { anim: 'clean', ms: 2600, dir: 1, fx: ['💧'], fxEvery: 300 },
        S.call(rt => { rt.bloomUntil = performance.now() + 12000; }),
        S.happy(1200, { dir: 1, fx: ['🌸'] }),
        S.wait(2000, 'idle', { dir: 1, fx: ['🌸', '✨'], fxEvery: 900 }),
        S.dance(1200, 400),
      ],
      /* La huele, estornuda del polen y se ríe. */
      f => [
        { go: f.x(12) },
        S.wait(1500, 'idle', { dir: -1 }),
        S.happy(900, { dir: -1, fx: ['🌸'] }),
        { anim: 'idle', ms: 500, dir: -1, fx: ['😤'] },
        { bounce: 1, ms: 320, h: 12, dir: -1, fx: ['💨'] },
        { hop: { x: f.x(20), y: 0 }, ms: 400, h: 10, anim: 'sick' },
        S.dance(1500, 400, { fx: ['😆'] }),
      ],
    ],
    duos: [
      f => ({
        a: [{ go: f.x(-14) }, S.sync('in'), { anim: 'clean', ms: 2400, dir: 1, fx: ['💧'], fxEvery: 300 },
          S.call(rt => { rt.bloomUntil = performance.now() + 12000; }), S.sync('bloom'), S.dance(1800, 400, { fx: ['🌸'] })],
        b: [{ go: f.x(13) }, S.sync('in'), S.wait(2400, 'idle', { dir: -1 }), S.sync('bloom'),
          { bounce: 2, ms: 400, h: 14, fx: ['🌸'] }, S.dance(1000, 300, { fx: ['💖'] })],
      }),
    ] },

  /* Rueda de hámster: gira según cómo corra adentro (rt.spinV, rad/s). */
  rueda: { w: 28, h: 28,
    init: rt => { rt.spin = 0; rt.spinV = 0; },
    parts: [
      { id: 'stand', draw: p => {
        p.line(14, 14, 4, 27, FP.metalD, 2); p.line(14, 14, 23, 27, FP.metalD, 2);
        p.r(2, 27, 6, 1, FP.O); p.r(20, 27, 6, 1, FP.O);
      } },
      { id: 'wheel', pivot: [14, 13], pose: (rt, now, k, dt) => {
        if (!rt.running) rt.spinV *= Math.pow(0.15, dt);   // frena sola cuando nadie corre
        rt.spin += rt.spinV * dt;
        return { r: rt.spin };
      }, draw: p => {
        p.ring(14, 13, 13, FP.O, 1);
        p.ring(14, 13, 12, FP.red, 2);
        p.ring(14, 13, 10, FP.O, 1);
        for (let i = 0; i < 8; i++){
          const a = i * Math.PI / 4;
          p.line(14, 13, Math.round(14 + Math.cos(a) * 9), Math.round(13 + Math.sin(a) * 9), FP.redL);
        }
        p.disc(14, 13, 2, FP.yel);
      } },
    ],
    visits: [
      f => [
        { go: f.x(-17) },
        { hop: { x: f.x(0), y: f.y(4) }, ms: 450, h: 14 },
        { anim: 'walk', ms: 5200, dir: 1, fx: ['💨'], fxEvery: 600,
          start: rt => { rt.running = true; rt.spinV = 9; }, end: rt => { rt.running = false; } },
        { hop: { x: f.x(18), y: 0 }, ms: 450, h: 12 },
        { anim: 'sick', ms: 1600, fx: ['💫'], fxEvery: 700 },   // mareado
        S.happy(900),
      ],
      /* Corre, frena, corre al revés y la rueda lo bota. */
      f => [
        { go: f.x(17) },
        { hop: { x: f.x(0), y: f.y(4) }, ms: 450, h: 14 },
        { anim: 'walk', ms: 2600, dir: 1, start: rt => { rt.running = true; rt.spinV = 8; } },
        S.wait(700, 'idle', { start: rt => { rt.running = false; } }),
        { anim: 'walk', ms: 2600, dir: -1, start: rt => { rt.running = true; rt.spinV = -11; }, fx: ['💨'], fxEvery: 500 },
        { hop: { x: f.x(-20), y: 0 }, ms: 600, h: 24, anim: 'celebrate', start: rt => { rt.running = false; } },
        { anim: 'sick', ms: 1200, fx: ['💫'] },
        S.dance(1000, 300, { fx: ['😆'] }),
      ],
    ],
    /* Uno corre y el otro le hace barra; después cambian. */
    duos: [
      f => ({
        a: [{ go: f.x(-17) }, { hop: { x: f.x(0), y: f.y(4) }, ms: 450, h: 14 }, S.sync('run'),
          { anim: 'walk', ms: 4000, dir: 1, start: rt => { rt.running = true; rt.spinV = 9; }, end: rt => { rt.running = false; } },
          { hop: { x: f.x(-20), y: 0 }, ms: 450, h: 12 }, S.sync('swap'), S.dance(4000, 350, { dir: 'partner', fx: ['📣'], fxEvery: 900 }),
          S.sync('end'), S.happy(700)],
        b: [{ go: f.x(20) }, S.sync('run'), S.dance(4000, 350, { fx: ['📣'], fxEvery: 900 }), S.sync('swap'),
          { hop: { x: f.x(0), y: f.y(4) }, ms: 450, h: 14 },
          { anim: 'walk', ms: 4000, dir: -1, start: rt => { rt.running = true; rt.spinV = -9; }, end: rt => { rt.running = false; } },
          { hop: { x: f.x(20), y: 0 }, ms: 450, h: 12 }, S.sync('end'), { anim: 'sick', ms: 900, fx: ['💫'] }],
      }),
    ] },

  /* Balancín: la tabla gira sobre el apoyo (rt.tilt, + = baja el lado
     derecho). Quien está en una punta a dx del centro queda a
     9 - dx·sin(tilt) píxeles de alto. En reposo queda caído a la derecha. */
  balancin: { w: 40, h: 14,
    init: rt => { rt.tilt = 0.42; },
    parts: [
      { id: 'base', draw: p => {
        for (let y = 7; y <= 13; y++){
          const half = y - 7;
          p.span(y, 19 - half, 20 + half, FP.yel);
        }
        p.r(12, 13, 16, 1, FP.O);
      } },
      { id: 'plank', pivot: [20, 6], pose: rt => ({ r: rt.tilt }), draw: p => {
        p.box(1, 5, 38, 3, FP.blue, FP.blueL);
        p.r(4, 2, 2, 3, FP.O); p.r(34, 2, 2, 3, FP.O);
        p.r(3, 2, 4, 1, FP.red); p.r(33, 2, 4, 1, FP.red);
      } },
    ],
    visits: [
      /* Se sube a la punta alta, cruza la tabla caminando y la hace caer
         para el otro lado. */
      f => {
        const seatY = (dx, tilt) => f.y(9 - dx * Math.sin(tilt));
        return [
          { go: f.x(-24) },
          { hop: () => ({ x: f.x(-15), y: seatY(-15, f.rt.tilt) }), ms: 500, h: 16 },
          { anim: 'walk', ms: 2800, dir: 1, track: (rt, el) => {
            const dx = -15 + 30 * Math.min(1, el / 2800);
            const target = Math.max(-0.42, Math.min(0.42, dx / 6 * 0.42));
            rt.tilt += (target - rt.tilt) * 0.12;
            return { x: f.x(dx), y: seatY(dx, rt.tilt) };
          } },
          S.happy(900, { fx: ['😆'] }),
          { anim: 'walk', ms: 2800, dir: -1, track: (rt, el) => {
            const dx = 15 - 30 * Math.min(1, el / 2800);
            const target = Math.max(-0.42, Math.min(0.42, dx / 6 * 0.42));
            rt.tilt += (target - rt.tilt) * 0.12;
            return { x: f.x(dx), y: seatY(dx, rt.tilt) };
          } },
          { hop: { x: f.x(-26), y: 0 }, ms: 500, h: 18, end: rt => { rt.tilt = -0.42; } },
          S.happy(800, { fx: ['⭐'] }),
        ];
      },
    ],
    /* El clásico: uno en cada punta, sube uno y baja el otro. */
    duos: [
      f => {
        const seatY = (dx, tilt) => f.y(9 - dx * Math.sin(tilt));
        const ride = (dx) => ({ anim: 'happy', ms: 8400, dir: dx < 0 ? 1 : -1, fx: ['😆', '⭐'], fxEvery: 1400,
          track: (rt, el) => {
            if (dx < 0) rt.tilt = 0.42 * Math.cos(2 * Math.PI * el / 1400);
            return { x: f.x(dx), y: seatY(dx, rt.tilt) };
          } });
        return {
          a: [{ go: f.x(-25) }, S.sync('in'), { hop: () => ({ x: f.x(-15), y: seatY(-15, f.rt.tilt) }), ms: 500, h: 16 },
            S.sync('on'), ride(-15), S.sync('off'), { hop: { x: f.x(-26), y: 0 }, ms: 500, h: 18 }, S.happy(700, { dir: 'partner' })],
          b: [{ go: f.x(25) }, S.sync('in'), { hop: () => ({ x: f.x(15), y: seatY(15, f.rt.tilt) }), ms: 500, h: 16 },
            S.sync('on'), ride(15), S.sync('off'), { hop: { x: f.x(26), y: 0 }, ms: 500, h: 18 }, S.happy(700, { dir: 'partner' })],
        };
      },
    ] },

  /* Cohete: el cuerpo y la llama suben juntos (rt.lift, px CSS) y tiemblan
     antes de despegar (rt.shake). Quien va adentro está escondido. */
  cohete: { w: 16, h: 32,
    init: rt => { rt.lift = 0; rt.shake = false; rt.flame = false; },
    parts: [
      { id: 'pad', draw: p => { p.box(1, 29, 14, 3, FP.metalD, FP.metal); } },
      { id: 'body', pose: (rt, now) => ({ y: rt.lift, x: rt.shake ? Math.sin(now / 25) * 0.7 : 0 }), draw: p => {
        p.span(0, 7, 8, FP.red);
        p.span(1, 6, 9, FP.red);
        p.span(2, 5, 10, FP.red);
        p.span(3, 5, 10, FP.redL);
        p.span(4, 4, 11, FP.red);
        for (let y = 5; y <= 21; y++) p.span(y, 4, 11, y === 5 ? FP.whiteL : FP.white);
        p.r(5, 6, 1, 14, FP.whiteL);
        p.disc(8, 10, 2.6, FP.glass); p.r(7, 9, 1, 1, FP.whiteL);
        p.r(4, 15, 8, 1, FP.red);
        for (let y = 16; y <= 24; y++){ p.span(y, 1 + Math.max(0, 19 - y), 4, FP.red); p.span(y, 11, 14 - Math.max(0, 19 - y), FP.red); }
        p.r(4, 22, 8, 1, FP.O);
        p.box(5, 22, 6, 4, FP.metalD, FP.metal);
      } },
      { id: 'flame', show: 'flame', pose: (rt, now) => ({ y: rt.lift, sy: 0.85 + Math.abs(Math.sin(now / 40)) * 0.3 }), pivot: [8, 26], draw: p => {
        p.r(5, 26, 6, 1, FP.orange); p.r(6, 27, 4, 1, FP.orangeL); p.r(6, 28, 4, 1, FP.yel); p.r(7, 29, 2, 2, FP.yelL);
      } },
    ],
    visits: [
      f => {
        const LIFT = 70;
        return [
          { go: f.x(-12) },
          { hop: { x: f.x(0), y: f.y(14) }, ms: 500, h: 20, end: (rt, act) => { act.hidden = true; } },
          { anim: 'idle', ms: 1100, hide: true, start: rt => { rt.shake = true; }, fx: ['💨'], fxEvery: 300 },
          { anim: 'idle', ms: 3000, hide: true, start: rt => { rt.flame = true; },
            track: (rt, el) => {
              const t = el / 3000;
              rt.lift = LIFT * Math.sin(Math.PI * Math.min(1, t * 1.1));
              return { y: f.y(14) + rt.lift };
            },
            end: rt => { rt.lift = 0; rt.flame = false; rt.shake = false; } },
          { hop: { x: f.x(13), y: 0 }, ms: 500, h: 24, hide: false, anim: 'celebrate' },
          { anim: 'sick', ms: 1300, fx: ['💫'] },
          S.dance(1200, 300, { fx: ['⭐', '🚀'], fxEvery: 400 }),
        ];
      },
      /* Cuenta regresiva saltando, y despega más alto. */
      f => {
        const LIFT = 95;
        return [
          { go: f.x(12) },
          { bounce: 1, ms: 520, h: 16, fx: ['3️⃣'] }, { bounce: 1, ms: 520, h: 16, fx: ['2️⃣'] }, { bounce: 1, ms: 520, h: 16, fx: ['1️⃣'] },
          { hop: { x: f.x(0), y: f.y(14) }, ms: 500, h: 20, end: (rt, act) => { act.hidden = true; } },
          { anim: 'idle', ms: 900, hide: true, start: rt => { rt.shake = true; } },
          { anim: 'idle', ms: 3600, hide: true, start: rt => { rt.flame = true; }, fx: ['🚀'],
            track: (rt, el) => { rt.lift = LIFT * Math.sin(Math.PI * Math.min(1, el / 3300)); return { y: f.y(14) + rt.lift }; },
            end: rt => { rt.lift = 0; rt.flame = false; rt.shake = false; } },
          { hop: { x: f.x(-14), y: 0 }, ms: 500, h: 26, hide: false, anim: 'celebrate', fx: ['🌟'] },
          S.happy(1400, { fx: ['😆'] }),
        ];
      },
    ],
    /* Uno despega y el otro hace la cuenta regresiva y lo despide. */
    duos: [
      f => ({
        a: [{ go: f.x(-12) }, S.sync('in'), { hop: { x: f.x(0), y: f.y(14) }, ms: 500, h: 20, end: (rt, act) => { act.hidden = true; } },
          { anim: 'idle', ms: 1600, hide: true, start: rt => { rt.shake = true; } }, S.sync('go', { hide: true }),
          { anim: 'idle', ms: 3000, hide: true, start: rt => { rt.flame = true; },
            track: (rt, el) => { rt.lift = 80 * Math.sin(Math.PI * Math.min(1, el / 2800)); return { y: f.y(14) + rt.lift }; },
            end: rt => { rt.lift = 0; rt.flame = false; rt.shake = false; } },
          { hop: { x: f.x(-14), y: 0 }, ms: 500, h: 24, hide: false, anim: 'celebrate' }, S.sync('land'),
          S.happy(1000, { dir: 'partner', fx: ['😆'] })],
        b: [{ go: f.x(16) }, S.sync('in', { dir: -1 }),
          { bounce: 1, ms: 520, h: 14, fx: ['3️⃣'] }, { bounce: 1, ms: 520, h: 14, fx: ['2️⃣'] }, { bounce: 1, ms: 520, h: 14, fx: ['1️⃣'] },
          S.sync('go'), S.dance(3000, 500, { fx: ['👀', '👋'], fxEvery: 700 }), S.sync('land'),
          { go: f.x(8) }, S.happy(1000, { dir: 'partner', fx: ['💖'] })],
      }),
    ] },

  /* Arenero: se cava (a veces sale un tesoro) o se hace un castillo que
     queda un rato (rt.castleUntil). */
  arenero: { w: 30, h: 12,
    init: rt => { rt.castleUntil = 0; },
    parts: [
      { id: 'base', draw: p => {
        p.box(0, 5, 30, 7, FP.wood, FP.woodL);
        p.r(2, 6, 26, 4, FP.sand);
        p.r(5, 7, 1, 1, FP.sandD); p.r(14, 8, 1, 1, FP.sandD); p.r(22, 6, 1, 1, FP.sandD); p.r(9, 9, 1, 1, FP.sandD);
        p.box(23, 2, 5, 5, FP.blue, FP.blueL); p.r(24, 1, 3, 1, FP.O);
        p.line(3, 2, 6, 5, FP.yel); p.r(2, 1, 2, 2, FP.yel);
      } },
      { id: 'castle', show: (rt, now) => now < rt.castleUntil, draw: p => {
        p.box(11, 2, 8, 5, '#e2c88a', '#f0dca8');
        p.r(11, 0, 2, 2, '#e2c88a'); p.r(14, 0, 2, 2, '#e2c88a'); p.r(17, 0, 2, 2, '#e2c88a');
        p.r(11, 0, 2, 1, FP.O); p.r(14, 0, 2, 1, FP.O); p.r(17, 0, 2, 1, FP.O);
        p.r(14, 4, 2, 2, '#a88850'); p.r(15, -1, 1, 1, FP.red);
      } },
    ],
    visits: [
      f => {
        const tesoro = Math.random() < 0.35;
        return [
          { go: f.x(-20) },
          { hop: { x: f.x(-6), y: f.y(6) }, ms: 450, h: 14 },
          { anim: 'eat', ms: 2600, dir: 1, fx: ['✨'], fxEvery: 300 },
          tesoro
            ? { anim: 'celebrate', ms: 1100, fx: ['💎'] }
            : { anim: 'idle', ms: 1100, fx: ['🐚'] },
          tesoro ? S.dance(1400, 300, { fx: ['💎', '✨'], fxEvery: 400 }) : S.happy(1000),
          { anim: 'eat', ms: 1600, dir: -1, fx: ['✨'], fxEvery: 300 },
          { hop: { x: f.x(20), y: 0 }, ms: 450, h: 12 },
        ];
      },
      f => [
        { go: f.x(20) },
        { hop: { x: f.x(6), y: f.y(6) }, ms: 450, h: 14 },
        { anim: 'clean', ms: 3000, dir: -1, fx: ['✨'], fxEvery: 350 },
        S.call(rt => { rt.castleUntil = performance.now() + 14000; }),
        { hop: { x: f.x(22), y: 0 }, ms: 450, h: 12 },
        S.happy(1600, { dir: -1, fx: ['🏰', '✨'], fxEvery: 600 }),
        S.wait(1200, 'idle', { dir: -1 }),
      ],
    ],
    duos: [
      f => ({
        a: [{ go: f.x(-20) }, { hop: { x: f.x(-8), y: f.y(6) }, ms: 450, h: 14 }, S.sync('in'),
          { anim: 'eat', ms: 2600, dir: 1, fx: ['✨'], fxEvery: 350 }, S.sync('found'),
          { anim: 'celebrate', ms: 1000, fx: ['💎'] }, S.dance(1200, 300), { hop: { x: f.x(-22), y: 0 }, ms: 450, h: 12 }],
        b: [{ go: f.x(20) }, { hop: { x: f.x(8), y: f.y(6) }, ms: 450, h: 14 }, S.sync('in'),
          { anim: 'eat', ms: 2600, dir: -1, fx: ['✨'], fxEvery: 400 }, S.sync('found'),
          S.wait(600, 'idle', { dir: 'partner', fx: ['😮'] }), { bounce: 2, ms: 420, h: 14, fx: ['👏'] },
          { hop: { x: f.x(22), y: 0 }, ms: 450, h: 12 }],
      }),
    ] },

  /* Piscina inflable: el borde de adelante tapa al que está adentro, como
     en la bañera; el patito flota solo. */
  piscina: { w: 36, h: 11,
    parts: [
      { id: 'back', draw: p => {
        p.box(0, 2, 36, 9, FP.blue, FP.blueL);
        p.r(2, 3, 32, 3, FP.water); p.r(4, 3, 6, 1, '#d6f0ff'); p.r(20, 4, 5, 1, '#d6f0ff');
      } },
      { id: 'duck', pose: (rt, now, k) => ({ x: Math.sin(now / 2300) * 5 * k, y: Math.sin(now / 480) * 0.5 * k, sx: Math.cos(now / 2300) > 0 ? 1 : -1 }), draw: p => {
        p.r(16, 2, 5, 3, FP.yel); p.r(20, 0, 3, 3, FP.yel); p.r(23, 1, 1, 1, FP.orange); p.r(21, 1, 1, 1, FP.O);
      } },
      { id: 'front', z: 'front', draw: p => {
        p.r(0, 6, 36, 5, FP.O); p.r(1, 6, 34, 4, FP.blue);
        for (const x of [5, 15, 25]) p.r(x, 6, 4, 4, FP.white);
        p.r(1, 6, 34, 1, FP.blueL);
      } },
    ],
    visits: [
      f => [
        { go: f.x(-23) },
        { hop: { x: f.x(-10), y: f.y(1) }, ms: 500, h: 24 },
        { go: f.x(10), speed: 0.06, anim: 'happy', fx: ['💦'], fxEvery: 400 },
        { go: f.x(-10), speed: 0.06, anim: 'happy', fx: ['💦'], fxEvery: 400 },
        { go: f.x(6), speed: 0.06, anim: 'happy', fx: ['💦'], fxEvery: 400 },
        S.wait(1500, 'idle', { fx: ['😌'] }),
        { hop: { x: f.x(23), y: 0 }, ms: 500, h: 22 },
        { anim: 'clean', ms: 1200, flip: 150, fx: ['💦'], fxEvery: 200 },   // se sacude
      ],
      /* Piquero: se tira de bomba desde lejos. */
      f => [
        { go: f.x(-38) },
        S.wait(500, 'idle', { dir: 1, fx: ['😤'] }),
        { hop: { x: f.x(0), y: f.y(1) }, ms: 850, h: 56, anim: 'celebrate',
          end: (rt, act) => { for (let i = 0; i < 4; i++) setTimeout(() => petFx('💦', act), i * 90); } },
        S.wait(2500, 'idle', { fx: ['😌'] }),
        { anim: 'sleep', ms: 2600, fx: ['💤'], fxEvery: 1300 },   // flotando
        S.happy(700),
        { hop: { x: f.x(23), y: 0 }, ms: 500, h: 22 },
        { anim: 'clean', ms: 1000, flip: 150, fx: ['💦'] },
      ],
    ],
    /* Guerra de agua. */
    duos: [
      f => ({
        a: [{ go: f.x(-23) }, S.sync('in'), { hop: { x: f.x(-9), y: f.y(1) }, ms: 500, h: 24 }, S.sync('w'),
          { anim: 'clean', ms: 900, dir: 'partner', fx: ['💦'], fxEvery: 200 }, S.sync('s1'),
          S.happy(900, { dir: 'partner', fx: ['😆'] }), S.sync('s2'),
          { anim: 'clean', ms: 900, dir: 'partner', fx: ['💦'], fxEvery: 200 }, S.sync('s3'),
          S.happy(900, { dir: 'partner', fx: ['😂'] }), S.sync('out'), { hop: { x: f.x(-24), y: 0 }, ms: 500, h: 22 }],
        b: [{ go: f.x(23) }, S.sync('in'), { hop: { x: f.x(9), y: f.y(1) }, ms: 500, h: 24 }, S.sync('w'),
          S.happy(900, { dir: 'partner', fx: ['😆'] }), S.sync('s1'),
          { anim: 'clean', ms: 900, dir: 'partner', fx: ['💦'], fxEvery: 200 }, S.sync('s2'),
          S.happy(900, { dir: 'partner' }), S.sync('s3'),
          { anim: 'clean', ms: 900, dir: 'partner', fx: ['💦'], fxEvery: 200 }, S.sync('out'), { hop: { x: f.x(24), y: 0 }, ms: 500, h: 22 }],
      }),
    ] },

  /* Hamaca: la red se mece colgada de su centro (usa el mismo `swing` que el
     columpio, más suave y lento). */
  hamaca: { w: 38, h: 24,
    parts: [
      { id: 'posts', draw: p => {
        p.box(1, 2, 3, 22, FP.woodD, FP.wood); p.box(34, 2, 3, 22, FP.woodD, FP.wood);
        p.r(0, 1, 5, 2, FP.O); p.r(33, 1, 5, 2, FP.O);
      } },
      { id: 'net', pivot: [19, 4], pose: rt => ({ r: rt.swing }), draw: p => {
        for (let x = 4; x <= 33; x++){
          const y = 5 + Math.round(10 * (1 - Math.pow((x - 19) / 15, 2)));
          p.r(x, y, 1, 3, (x % 4 < 2) ? FP.pink : FP.yel);
          p.r(x, y - 1, 1, 1, FP.O); p.r(x, y + 3, 1, 1, FP.O);
        }
        p.line(4, 4, 4, 6, FP.rope); p.line(33, 4, 33, 6, FP.rope);
      } },
    ],
    visits: [
      f => [
        { go: f.x(-8) },
        { hop: { x: f.x(0), y: f.y(7) }, ms: 450, h: 14 },
        { anim: 'sleep', ms: 6600, swing: { amp: 0.08, period: 2200, L: f.y(12) }, fx: ['💤'], fxEvery: 1600 },
        S.happy(900, { fx: ['😌'] }),
        { hop: { x: f.x(22), y: 0 }, ms: 450, h: 12 },
      ],
      /* Se mece fuerte riéndose hasta que casi se da vuelta. */
      f => [
        { go: f.x(8) },
        { hop: { x: f.x(0), y: f.y(7) }, ms: 450, h: 14 },
        { anim: 'happy', ms: 4200, swing: { amp: 0.2, period: 1400, L: f.y(12) }, fx: ['😆'], fxEvery: 900 },
        { anim: 'celebrate', ms: 1400, swing: { amp: 0.32, period: 1400, L: f.y(12) }, fx: ['😱'] },
        { hop: { x: f.x(-24), y: 0 }, ms: 600, h: 26, anim: 'sick' },
        S.dance(1200, 300, { fx: ['😆'] }),
      ],
    ],
    /* Siesta de a dos, meciéndose juntos. */
    duos: [
      f => ({
        a: [{ go: f.x(-10) }, { hop: { x: f.x(-5), y: f.y(7) }, ms: 450, h: 14 }, S.sync('in'),
          { anim: 'sleep', ms: 6600, swing: { amp: 0.08, period: 2200, L: f.y(12) }, fx: ['💤'], fxEvery: 1600 },
          S.sync('wake'), S.happy(800, { dir: 'partner' }), { hop: { x: f.x(-22), y: 0 }, ms: 450, h: 12 }],
        b: [{ go: f.x(10) }, { hop: { x: f.x(6), y: f.y(7) }, ms: 450, h: 14 }, S.sync('in'),
          { anim: 'sleep', ms: 6600, swing: { amp: 0.08, period: 2200, L: f.y(12) } },
          S.sync('wake'), S.happy(800, { dir: 'partner', fx: ['💖'] }), { hop: { x: f.x(22), y: 0 }, ms: 450, h: 12 }],
      }),
    ] },

  /* Telescopio: lo que ve depende de si es de día o de noche (hora real). */
  telescopio: { w: 20, h: 26,
    init: rt => { rt.aim = 0; rt.aimTo = 0; },
    parts: [
      { id: 'tripod', draw: p => {
        p.line(10, 14, 3, 25, FP.metalD); p.line(10, 14, 17, 25, FP.metalD); p.line(10, 14, 10, 25, FP.metalD);
        p.r(9, 13, 3, 2, FP.O);
      } },
      { id: 'tube', pivot: [10, 13], pose: (rt, now, k, dt) => { rt.aim += (rt.aimTo - rt.aim) * Math.min(1, dt * 3); return { r: rt.aim }; }, draw: p => {
        p.line(4, 17, 16, 6, FP.O, 3);
        p.line(5, 17, 16, 7, '#5e4b85', 2);
        p.line(5, 16, 15, 7, '#8a74c0');
        p.disc(17, 5, 2.6, FP.glass);
        p.r(2, 17, 3, 2, FP.O);
      } },
    ],
    visits: [
      f => [
        { go: f.x(-10) },
        S.wait(3200, 'idle', { dir: 1, fx: f.night ? ['⭐', '🌙', '🌠'] : ['☁️', '🐦', '✈️'], fxEvery: 900 }),
        { anim: 'celebrate', ms: 700, fx: ['❗'] },
        S.dance(1500, 500, { fx: ['😮'] }),
        S.wait(2000, 'idle', { dir: 1, fx: f.night ? ['🌠'] : ['🌈'], fxEvery: 1000 }),
        S.happy(800),
      ],
      /* Mueve el telescopio buscando algo, hasta que lo encuentra. */
      f => [
        { go: f.x(-10) },
        S.wait(1500, 'idle', { dir: 1 }),
        { anim: 'pet', ms: 1300, dir: 1, start: rt => { rt.aimTo = -0.35; } },
        S.wait(1400, 'idle', { dir: 1, fx: ['❓'] }),
        { anim: 'pet', ms: 1300, dir: 1, start: rt => { rt.aimTo = 0.25; } },
        S.wait(1600, 'idle', { dir: 1, fx: f.night ? ['🌙'] : ['🐦'] }),
        { anim: 'celebrate', ms: 900, fx: [f.night ? '🌠' : '🛸'], end: rt => { rt.aimTo = 0; } },
        { bounce: 2, ms: 420, h: 16, fx: ['😮'] },
      ],
    ],
    duos: [
      f => ({
        a: [{ go: f.x(-10) }, S.sync('in'), S.wait(2800, 'idle', { dir: 1, fx: f.night ? ['⭐'] : ['☁️'], fxEvery: 900 }),
          S.sync('swap'), { go: f.x(-22) }, S.wait(2800, 'idle', { dir: 'partner' }), S.sync('end'),
          { bounce: 2, ms: 420, h: 14, fx: ['😮'] }],
        b: [{ go: f.x(-21) }, S.sync('in'), S.wait(2800, 'idle', { dir: 1 }), S.sync('swap'),
          { go: f.x(-10) }, S.wait(2400, 'idle', { dir: 1, fx: f.night ? ['🌠'] : ['🐦'], fxEvery: 900 }),
          S.sync('end'), { bounce: 2, ms: 420, h: 14, fx: ['❗'] }],
      }),
    ] },

  /* Reloj cucú de pie: el péndulo se mueve siempre y el pájaro sale cada
     ~15 s solo, o cuando alguien lo espera (rt.cuckooUntil). */
  cucu: { w: 16, h: 36,
    init: rt => { rt.cuckooUntil = 0; },
    parts: [
      { id: 'body', draw: p => {
        p.box(2, 6, 12, 28, '#7a4b2e', FP.brownL);
        p.box(1, 2, 14, 5, FP.wood, FP.woodL);
        p.r(7, 0, 2, 2, FP.wood); p.r(6, 0, 4, 1, FP.O);
        p.disc(8, 11, 3.6, FP.white);
        p.r(8, 9, 1, 2, FP.O); p.r(8, 11, 2, 1, FP.O);
        p.r(5, 17, 6, 13, FP.dark);
        p.r(6, 3, 4, 3, FP.dark);
        p.r(2, 34, 3, 2, FP.O); p.r(11, 34, 3, 2, FP.O);
      } },
      { id: 'pendulum', pivot: [8, 17], pose: (rt, now) => ({ r: Math.sin(now / 520) * 0.28 }), draw: p => {
        p.r(8, 17, 1, 9, FP.yel); p.disc(8.5, 27, 1.8, FP.yel);
      } },
      { id: 'bird', show: (rt, now) => now < rt.cuckooUntil || (now % 15000) < 1100,
        pose: (rt, now, k) => ({ x: -Math.abs(Math.sin(now / 90)) * 1.5 * k }), draw: p => {
          p.r(5, 3, 4, 2, FP.yel); p.r(4, 3, 1, 1, FP.orange); p.r(6, 3, 1, 1, FP.O);
        } },
    ],
    visits: [
      f => [
        { go: f.x(-13) },
        S.wait(2600, 'idle', { dir: 1 }),
        { anim: 'idle', ms: 200, start: rt => { rt.cuckooUntil = performance.now() + 1600; }, fx: ['🐦'] },
        { bounce: 1, ms: 520, h: 24, anim: 'celebrate', fx: ['❗'] },
        S.dance(1800, 450, { fx: ['😆'], fxEvery: 700 }),
        S.wait(1500, 'idle', { dir: 1 }),
      ],
      /* Imita al péndulo meciéndose de lado a lado. */
      f => [
        { go: f.x(-12) },
        S.wait(800, 'idle', { dir: 1, fx: ['🕰️'] }),
        { anim: 'idle', ms: 4160, track: (rt, el) => ({ x: f.x(-12 + Math.sin(el / 520) * 3) }), flip: 1630 },
        { anim: 'idle', ms: 200, start: rt => { rt.cuckooUntil = performance.now() + 1600; } },
        { bounce: 1, ms: 520, h: 22, anim: 'celebrate', fx: ['❗'] },
        S.happy(1400, { fx: ['😂'] }),
      ],
    ],
    duos: [
      f => ({
        a: [{ go: f.x(-12) }, S.sync('in', { dir: 1 }), S.wait(2400, 'idle', { dir: 1 }),
          { anim: 'idle', ms: 200, start: rt => { rt.cuckooUntil = performance.now() + 1600; } }, S.sync('boo'),
          { bounce: 1, ms: 520, h: 24, anim: 'celebrate', fx: ['❗'] }, S.happy(1400, { dir: 'partner', fx: ['😆'] })],
        b: [{ go: f.x(13) }, S.sync('in', { dir: -1 }), S.wait(2500, 'idle', { dir: -1 }), S.sync('boo'),
          { bounce: 1, ms: 520, h: 24, anim: 'celebrate', fx: ['😱'] }, S.happy(1400, { dir: 'partner', fx: ['😂'] })],
      }),
    ] },

  /* Caballito mecedor: todo el caballo gira sobre la base (rt.rock). La
     montura queda a 14 px del pivote: x = 14·sin(rock), alto = 14·cos(rock). */
  caballito: { w: 26, h: 22,
    init: rt => { rt.rock = 0; },
    parts: [
      { id: 'horse', pivot: [13, 22], pose: rt => ({ r: rt.rock }), draw: p => {
        for (let x = 1; x <= 24; x++){
          const y = 19 + Math.round(Math.pow((x - 12.5) / 12, 2) * 2);
          p.r(x, y, 1, 2, FP.woodD);
        }
        p.r(1, 19, 1, 1, FP.O); p.r(24, 19, 1, 1, FP.O);
        p.box(7, 15, 3, 5, FP.gray); p.box(17, 15, 3, 5, FP.gray);
        p.box(5, 9, 15, 7, FP.white, FP.whiteL);
        p.box(16, 3, 6, 9, FP.white, FP.whiteL);
        p.box(19, 5, 5, 4, FP.white);
        p.r(19, 5, 1, 1, FP.O);
        p.r(15, 3, 2, 7, FP.red); p.r(16, 2, 3, 1, FP.red);
        p.r(2, 9, 4, 2, FP.red); p.r(2, 11, 2, 3, FP.red);
        p.r(10, 8, 6, 2, FP.red); p.r(12, 11, 2, 1, FP.grayD);
      } },
    ],
    visits: [
      f => {
        const seat = (rock) => ({ x: f.x(14 * Math.sin(rock)), y: f.y(14 * Math.cos(rock) - 1) });
        return [
          { go: f.x(-17) },
          { hop: { x: f.x(0), y: f.y(13) }, ms: 450, h: 12 },
          { anim: 'happy', ms: 6000, fx: ['🐴', '🎵'], fxEvery: 1600,
            track: (rt, el) => { rt.rock = 0.18 * Math.sin(2 * Math.PI * el / 1000); return seat(rt.rock); } },
          { hop: { x: f.x(18), y: 0 }, ms: 450, h: 12, start: rt => { rt.rock = 0; } },
          S.happy(800),
        ];
      },
      /* Galope desatado... hasta que sale volando. */
      f => {
        const seat = (rock) => ({ x: f.x(14 * Math.sin(rock)), y: f.y(14 * Math.cos(rock) - 1) });
        return [
          { go: f.x(17) },
          { hop: { x: f.x(0), y: f.y(13) }, ms: 450, h: 12 },
          { anim: 'happy', ms: 2000, track: (rt, el) => { rt.rock = 0.15 * Math.sin(2 * Math.PI * el / 1000); return seat(rt.rock); } },
          { anim: 'celebrate', ms: 3000, fx: ['💨', '🐴'], fxEvery: 500,
            track: (rt, el) => { rt.rock = 0.32 * Math.sin(2 * Math.PI * el / 500); return seat(rt.rock); } },
          { hop: { x: f.x(-26), y: 0 }, ms: 650, h: 30, anim: 'sick', start: rt => { rt.rock = 0; } },
          { anim: 'sick', ms: 1200, fx: ['💫'] },
          S.dance(1000, 300, { fx: ['😆'] }),
        ];
      },
    ],
    /* Uno monta y el otro lo mece empujando; después cambian. */
    duos: [
      f => {
        const seat = (rock) => ({ x: f.x(14 * Math.sin(rock)), y: f.y(14 * Math.cos(rock) - 1) });
        const ride = { anim: 'happy', ms: 5000, fx: ['🐴'], fxEvery: 1500,
          track: (rt, el) => { rt.rock = 0.22 * Math.sin(2 * Math.PI * el / 900); return seat(rt.rock); } };
        return {
          a: [{ go: f.x(-17) }, { hop: { x: f.x(0), y: f.y(13) }, ms: 450, h: 12 }, S.sync('r1'), ride,
            { hop: { x: f.x(-18), y: 0 }, ms: 450, h: 12, start: rt => { rt.rock = 0; } }, S.sync('swap'),
            { anim: 'pet', ms: 5000, dir: 1 }, S.sync('end'), S.happy(700, { dir: 'partner' })],
          b: [{ go: f.x(-20) }, S.sync('r1', { dir: 1 }), { anim: 'pet', ms: 5000, dir: 1 }, S.sync('swap'),
            { hop: { x: f.x(0), y: f.y(13) }, ms: 450, h: 12 }, ride,
            { hop: { x: f.x(18), y: 0 }, ms: 450, h: 12, start: rt => { rt.rock = 0; } }, S.sync('end'), S.happy(700, { dir: 'partner' })],
        };
      },
    ] },

  /* Batería: el platillo vibra con cada golpe (rt.hitAt) y el bombo late. */
  bateria: { w: 28, h: 22,
    init: rt => { rt.hitAt = -1e9; },
    parts: [
      { id: 'kit', draw: p => {
        p.line(24, 3, 24, 21, FP.metalD);
        p.r(5, 15, 2, 7, FP.metalD); p.r(3, 21, 6, 1, FP.O);
        p.box(1, 11, 9, 5, FP.gray, FP.whiteL); p.r(2, 13, 7, 1, FP.red);
        p.box(19, 13, 8, 7, FP.blue, FP.blueL); p.r(20, 19, 1, 3, FP.O); p.r(25, 19, 1, 3, FP.O);
      } },
      { id: 'bass', pivot: [14, 21], pose: (rt, now) => {
        const t = (now - rt.hitAt) / 160;
        return { sx: t < 1 ? 1 + 0.06 * Math.sin(Math.PI * t) : 1, sy: t < 1 ? 1 + 0.06 * Math.sin(Math.PI * t) : 1 };
      }, draw: p => {
        p.disc(14, 15, 6.6, (x, y) => Math.hypot(x + 0.5 - 14, y + 0.5 - 15) > 4.6 ? FP.red : FP.white);
        p.r(12, 14, 4, 2, FP.redL);
      } },
      { id: 'cymbal', pivot: [24, 3], pose: (rt, now) => {
        const e = (now - rt.hitAt) / 1000;
        return { r: e < 1.2 ? Math.sin(now / 35) * 0.25 * Math.exp(-e * 3) : 0 };
      }, draw: p => {
        p.r(19, 3, 11, 1, FP.O); p.r(20, 2, 9, 1, FP.yel); p.r(22, 1, 5, 1, FP.yelL); p.r(24, 0, 1, 1, FP.O);
      } },
    ],
    visits: [
      f => [
        { go: f.x(-18) },
        { bounce: 8, ms: 300, h: 8, dir: 1, onBounce: (rt, act, n) => { rt.hitAt = performance.now(); if (n % 2) petFx(pickOne(['🥁', '🎵']), act); } },
        S.happy(600, { dir: 1 }),
        { bounce: 6, ms: 220, h: 10, dir: 1, onBounce: (rt) => { rt.hitAt = performance.now(); } },
        { anim: 'celebrate', ms: 900, fx: ['💥'], start: rt => { rt.hitAt = performance.now(); } },
        { bounce: 8, ms: 260, h: 9, dir: 1, onBounce: (rt, act, n) => { rt.hitAt = performance.now(); if (n % 3 === 0) petFx('🎶', act); } },
        { anim: 'celebrate', ms: 1100, fx: ['💥', '🤘'], fxEvery: 400, start: rt => { rt.hitAt = performance.now(); } },
      ],
      /* Solo de batería con vueltas entre golpes. */
      f => [
        { go: f.x(18) },
        { bounce: 4, ms: 320, h: 10, dir: -1, onBounce: rt => { rt.hitAt = performance.now(); } },
        S.dance(800, 200),
        { bounce: 4, ms: 260, h: 12, dir: -1, onBounce: rt => { rt.hitAt = performance.now(); } },
        S.dance(800, 200, { fx: ['🎶'] }),
        { bounce: 10, ms: 180, h: 6, dir: -1, onBounce: rt => { rt.hitAt = performance.now(); }, fx: ['🥁'], fxEvery: 500 },
        { bounce: 1, ms: 600, h: 30, anim: 'celebrate', start: rt => { rt.hitAt = performance.now(); }, fx: ['💥'] },
        S.happy(1200, { fx: ['🤘'] }),
      ],
    ],
    /* Uno toca y el otro baila al ritmo. */
    duos: [
      f => ({
        a: [{ go: f.x(-18) }, S.sync('in'),
          { bounce: 16, ms: 300, h: 8, dir: 1, onBounce: (rt, act, n) => { rt.hitAt = performance.now(); if (n % 4 === 0) petFx('🥁', act); } },
          { anim: 'celebrate', ms: 900, fx: ['💥'], start: rt => { rt.hitAt = performance.now(); } }, S.sync('end'), S.happy(700, { dir: 'partner' })],
        b: [{ go: f.x(20) }, S.sync('in'), S.dance(2400, 300, { fx: ['🎶'], fxEvery: 600 }), { bounce: 4, ms: 300, h: 16 },
          S.dance(1200, 300), S.sync('end'), S.happy(700, { dir: 'partner', fx: ['🤘'] })],
      }),
    ] },

  /* Caballete: la pintura aparece por capas (rt.paint 0..3) y puede ser un
     paisaje o un corazón (rt.pk). Queda pintada hasta la próxima visita. */
  caballete: { w: 20, h: 30,
    init: rt => { rt.paint = 0; rt.pk = 0; },
    parts: [
      { id: 'easel', draw: p => {
        p.line(10, 2, 3, 29, FP.woodD, 2); p.line(10, 2, 16, 29, FP.woodD, 2); p.line(10, 2, 10, 29, FP.woodD);
        p.r(2, 22, 16, 2, FP.wood); p.r(2, 22, 16, 1, FP.woodL);
        p.box(3, 4, 14, 14, FP.white, FP.whiteL);
        p.r(14, 20, 2, 2, FP.red); p.r(16, 20, 1, 2, FP.blue);
      } },
      { id: 'l1a', show: rt => rt.pk === 0 && rt.paint >= 1, draw: p => { p.r(4, 5, 12, 7, '#8fd3ff'); } },
      { id: 'l2a', show: rt => rt.pk === 0 && rt.paint >= 2, draw: p => {
        p.disc(13, 8, 2.2, FP.yel); p.r(4, 12, 12, 5, FP.green); p.r(6, 11, 6, 1, FP.green);
      } },
      { id: 'l3a', show: rt => rt.pk === 0 && rt.paint >= 3, draw: p => {
        p.box(5, 11, 5, 5, FP.red); p.r(4, 10, 7, 1, FP.redD); p.r(5, 9, 5, 1, FP.redD); p.r(7, 13, 1, 2, FP.dark);
        p.r(12, 14, 1, 1, FP.pink); p.r(14, 15, 1, 1, FP.yel);
      } },
      { id: 'l1b', show: rt => rt.pk === 1 && rt.paint >= 1, draw: p => { p.r(4, 5, 12, 12, FP.pinkL); } },
      { id: 'l2b', show: rt => rt.pk === 1 && rt.paint >= 2, draw: p => {
        p.r(6, 8, 3, 2, FP.red); p.r(11, 8, 3, 2, FP.red); p.r(5, 9, 10, 3, FP.red); p.r(6, 12, 8, 1, FP.red);
        p.r(7, 13, 6, 1, FP.red); p.r(8, 14, 4, 1, FP.red); p.r(9, 15, 2, 1, FP.red);
      } },
      { id: 'l3b', show: rt => rt.pk === 1 && rt.paint >= 3, draw: p => {
        p.r(7, 9, 1, 1, FP.whiteL); p.r(5, 6, 1, 1, FP.yel); p.r(14, 6, 1, 1, FP.yel); p.r(14, 14, 1, 1, FP.yel); p.r(5, 14, 1, 1, FP.purple);
      } },
    ],
    visits: [
      f => [
        { go: f.x(-14) },
        S.call(rt => { rt.paint = 0; rt.pk = Math.random() < 0.5 ? 0 : 1; }),
        { anim: 'clean', ms: 1600, dir: 1, fx: ['🎨'], fxEvery: 800 }, S.call(rt => { rt.paint = 1; }),
        { anim: 'clean', ms: 1600, dir: 1, fx: ['🖌️'], fxEvery: 800 }, S.call(rt => { rt.paint = 2; }),
        { anim: 'clean', ms: 1600, dir: 1, fx: ['🎨'], fxEvery: 800 }, S.call(rt => { rt.paint = 3; }),
        { go: f.x(-24) },
        S.wait(1200, 'idle', { dir: 1, fx: ['🤔'] }),
        S.dance(1600, 450, { fx: ['✨', '💖'], fxEvery: 500 }),
      ],
      /* Se mancha: termina el cuadro y queda pintado él también. */
      f => [
        { go: f.x(14) },
        S.call(rt => { rt.paint = 0; rt.pk = Math.random() < 0.5 ? 0 : 1; }),
        { anim: 'clean', ms: 1400, dir: -1 }, S.call(rt => { rt.paint = 1; }),
        { anim: 'clean', ms: 1400, dir: -1, fx: ['🎨'] }, S.call(rt => { rt.paint = 2; }),
        { bounce: 1, ms: 400, h: 10, fx: ['💦'] },
        { anim: 'sad', ms: 900, fx: ['🎨'] },
        { anim: 'clean', ms: 1400, dir: -1 }, S.call(rt => { rt.paint = 3; }),
        S.dance(1600, 400, { fx: ['🌈', '😆'], fxEvery: 600 }),
      ],
    ],
    duos: [
      f => ({
        a: [{ go: f.x(-14) }, S.sync('in', { start: rt => { rt.paint = 0; rt.pk = Math.random() < 0.5 ? 0 : 1; } }),
          { anim: 'clean', ms: 1600, dir: 1, fx: ['🎨'] }, S.call(rt => { rt.paint = 1; }),
          { anim: 'clean', ms: 1600, dir: 1 }, S.call(rt => { rt.paint = 2; }), S.sync('turn'),
          S.wait(1700, 'happy', { dir: 'partner' }), S.sync('done'), S.dance(1200, 400, { fx: ['✨'] })],
        b: [{ go: f.x(14) }, S.sync('in', { dir: -1 }), S.wait(3200, 'idle', { dir: -1 }), S.sync('turn'),
          { anim: 'clean', ms: 1700, dir: -1, fx: ['🖌️'] }, S.call(rt => { rt.paint = 3; }), S.sync('done'),
          { bounce: 2, ms: 400, h: 12, fx: ['👏'] }],
      }),
    ] },

  /* Cocinita: prendida sale vapor de la olla y llamitas abajo. */
  cocinita: { w: 22, h: 22,
    parts: [
      { id: 'stove', draw: p => {
        p.box(1, 8, 20, 14, FP.white, FP.whiteL);
        p.box(4, 12, 14, 8, FP.gray); p.r(6, 14, 10, 4, FP.dark); p.r(7, 14, 3, 1, '#5e4b85');
        p.r(4, 9, 2, 2, FP.red); p.r(8, 9, 2, 2, FP.red); p.r(16, 9, 3, 2, FP.dark);
        p.box(6, 2, 10, 6, FP.metal, '#c5cbd8'); p.r(4, 4, 2, 1, FP.O); p.r(16, 4, 2, 1, FP.O);
        p.r(10, 1, 2, 1, FP.O);
      } },
      { id: 'flame', show: (rt, now) => rt.on && Math.floor(now / 140) % 2 === 0, draw: p => { p.r(7, 7, 2, 1, FP.orange); p.r(13, 7, 2, 1, FP.orange); } },
      { id: 'flame2', show: (rt, now) => rt.on && Math.floor(now / 140) % 2 === 1, draw: p => { p.r(8, 7, 2, 1, FP.yel); p.r(12, 7, 2, 1, FP.yel); } },
      { id: 'steam', show: 'on', pose: (rt, now, k) => ({ y: ((now / 40) % 5) * k, x: Math.sin(now / 200) * 0.6 * k }), draw: p => {
        p.r(9, 0, 2, 1, '#e7e0f0'); p.r(12, 1, 1, 1, '#e7e0f0');
      } },
    ],
    visits: [
      f => [
        { go: f.x(-15), start: rt => { rt.on = true; } },
        { anim: 'clean', ms: 3200, dir: 1, fx: ['💨', '🥄'], fxEvery: 600 },
        { anim: 'eat', ms: 1500, dir: 1, fx: ['😋'] },
        S.call(rt => { rt.on = false; }),
        S.dance(1200, 400, { fx: ['⭐'] }),
        { anim: 'eat', ms: 1400, dir: 1, fx: ['🍲'] },
      ],
      /* Se le quema: humo, carita de susto y se ríe igual. */
      f => [
        { go: f.x(15), start: rt => { rt.on = true; } },
        { anim: 'clean', ms: 2600, dir: -1, fx: ['💨'], fxEvery: 600 },
        S.wait(900, 'idle', { dir: 1, fx: ['🎵'] }),
        { bounce: 1, ms: 450, h: 18, anim: 'celebrate', fx: ['🔥'] },
        { anim: 'sick', ms: 1300, fx: ['😵', '💨'], fxEvery: 500, end: rt => { rt.on = false; } },
        S.happy(1500, { fx: ['😆'] }),
      ],
    ],
    /* Uno cocina y el otro espera con hambre y prueba. */
    duos: [
      f => ({
        a: [{ go: f.x(-15), start: rt => { rt.on = true; } }, S.sync('in'), { anim: 'clean', ms: 3200, dir: 1, fx: ['💨'], fxEvery: 600 },
          S.sync('taste', { end: rt => { rt.on = false; } }), S.happy(1600, { dir: 'partner', fx: ['😊'] })],
        b: [{ go: f.x(15) }, S.sync('in'), S.wait(3200, 'idle', { dir: -1, fx: ['🤤'], fxEvery: 1400 }), S.sync('taste'),
          { anim: 'eat', ms: 1300, dir: -1, fx: ['😋'] }, { bounce: 2, ms: 400, h: 12, fx: ['⭐'] }],
      }),
    ] },

  /* Cofre: la tapa sube al abrirse (rt.open) y adentro brilla. Se puede
     esconder alguien adentro (y el cofre se sacude). */
  cofre: { w: 20, h: 16,
    init: rt => { rt.open = 0; rt.openTo = 0; rt.wiggle = false; },
    parts: [
      { id: 'glow', show: rt => rt.open > 0.2, draw: p => {
        p.r(3, 5, 14, 3, '#ffe066'); p.r(5, 4, 2, 1, FP.yel); p.r(10, 4, 3, 1, FP.yel); p.r(14, 4, 1, 1, FP.whiteL);
      } },
      { id: 'body', pose: (rt, now) => ({ x: rt.wiggle ? Math.sin(now / 40) * 0.8 : 0 }), draw: p => {
        p.box(1, 7, 18, 9, FP.brown, FP.brownL);
        p.r(4, 8, 2, 7, FP.yel); p.r(14, 8, 2, 7, FP.yel); p.r(9, 9, 2, 3, FP.yel); p.r(9, 11, 2, 1, FP.O);
      } },
      { id: 'lid', pivot: [19, 7], pose: (rt, now, k, dt) => {
        rt.open += (rt.openTo - rt.open) * Math.min(1, dt * 10);
        return { y: rt.open * 5 * k, r: -rt.open * 0.25, x: rt.wiggle ? Math.sin(now / 40) * 0.8 : 0 };
      }, draw: p => {
        p.box(1, 3, 18, 5, '#b5702f', '#d48a45'); p.r(4, 4, 2, 3, FP.yel); p.r(14, 4, 2, 3, FP.yel);
      } },
    ],
    visits: [
      f => [
        { go: f.x(-14) },
        { anim: 'pet', ms: 900, dir: 1 },
        S.call(rt => { rt.openTo = 1; }),
        { anim: 'celebrate', ms: 1000, fx: ['💰', '✨', '💎'], fxEvery: 250 },
        S.dance(1500, 500, { fx: ['💰'], fxEvery: 500 }),
        { anim: 'pet', ms: 700, dir: 1, end: rt => { rt.openTo = 0; } },
        S.happy(900),
      ],
      /* Se esconde adentro, el cofre tiembla... ¡y sale de golpe! */
      f => [
        { go: f.x(-14) },
        S.call(rt => { rt.openTo = 1; }),
        { hop: { x: f.x(0), y: f.y(6) }, ms: 500, h: 22, end: (rt, act) => { act.hidden = true; rt.openTo = 0; } },
        S.wait(1500, 'idle', { hide: true }),
        { anim: 'idle', ms: 1600, hide: true, start: rt => { rt.wiggle = true; }, end: rt => { rt.wiggle = false; rt.openTo = 1; } },
        { hop: { x: f.x(14), y: 0 }, ms: 600, h: 32, hide: false, anim: 'celebrate', fx: ['😆'] },
        S.call(rt => { rt.openTo = 0; }),
        S.dance(1400, 350, { fx: ['✨'] }),
      ],
    ],
    /* Uno se esconde en el cofre; el otro lo busca, abre y ¡sorpresa! */
    duos: [
      f => ({
        a: [{ go: f.x(-14) }, S.call(rt => { rt.openTo = 1; }),
          { hop: { x: f.x(0), y: f.y(6) }, ms: 500, h: 22, end: (rt, act) => { act.hidden = true; rt.openTo = 0; } },
          S.sync('hidden', { hide: true }), S.sync('open', { hide: true }),
          { hop: { x: f.x(-14), y: 0 }, ms: 600, h: 32, hide: false, anim: 'celebrate', fx: ['😆'] }, S.sync('end'),
          S.happy(900, { dir: 'partner' })],
        b: [{ go: f.x(26) }, S.sync('hidden', { dir: -1 }), S.dance(1800, 600, { fx: ['❓'] }), { go: f.x(14) },
          { anim: 'pet', ms: 700, dir: -1, end: rt => { rt.openTo = 1; } }, S.sync('open'),
          { bounce: 1, ms: 480, h: 22, fx: ['😱'] }, S.sync('end', { end: rt => { rt.openTo = 0; } }), S.happy(900, { dir: 'partner', fx: ['😂'] })],
      }),
    ] },

  /* Muro de escalada: se trepa por delante con pausas entre agarre y agarre. */
  escalada: { w: 22, h: 40,
    parts: [{ id: 'wall', draw: p => {
      p.box(2, 4, 18, 36, '#8a6bd8', '#a58cf0');
      for (let y = 8; y < 38; y += 6) p.r(3, y, 16, 1, '#7a5cc8');
      const holds = [[5, 34, FP.red], [13, 31, FP.yel], [7, 27, FP.green], [14, 23, FP.blue], [5, 19, FP.orange],
        [12, 15, FP.red], [7, 11, FP.yel], [14, 7, FP.green]];
      for (const [x, y, c] of holds){ p.r(x, y, 3, 2, c); p.r(x, y + 2, 3, 1, FP.O); }
      p.r(17, 0, 1, 5, FP.O); p.r(18, 0, 3, 2, FP.red);
    } }],
    visits: [
      f => [
        { go: f.x(0) },
        { slide: { x: f.x(-2), y: f.y(12) }, ms: 1300, anim: 'walk' }, S.wait(350),
        { slide: { x: f.x(2), y: f.y(24) }, ms: 1300, anim: 'walk' }, S.wait(350),
        { slide: { x: f.x(0), y: f.y(36) }, ms: 1300, anim: 'walk' },
        { anim: 'celebrate', ms: 1000, fx: ['🚩'] },
        S.dance(1000, 350, { fx: ['⭐'] }),
        { hop: { x: f.x(19), y: 0 }, ms: 700, h: 10 },
        S.happy(600),
      ],
      /* Se resbala a mitad de camino y lo vuelve a intentar. */
      f => [
        { go: f.x(0) },
        { slide: { x: f.x(1), y: f.y(20) }, ms: 1800, anim: 'walk' },
        S.wait(400, 'idle', { fx: ['😰'] }),
        { slide: { x: f.x(0), y: f.y(2) }, ms: 450, anim: 'sad', fx: ['💦'] },
        { anim: 'sad', ms: 700 }, { anim: 'idle', ms: 500, fx: ['😤'] },
        { slide: { x: f.x(-1), y: f.y(36) }, ms: 3000, anim: 'walk' },
        { anim: 'celebrate', ms: 1200, fx: ['🚩', '🏆'], fxEvery: 500 },
        { hop: { x: f.x(-19), y: 0 }, ms: 700, h: 10 },
      ],
    ],
    /* Carrera de escalada: gana el primero que llega arriba. */
    duos: [
      f => {
        const climb = (dx, ms) => [{ go: f.x(dx) }, S.sync('go'), { slide: { x: f.x(dx), y: f.y(36) }, ms, anim: 'walk',
          end: (rt, act, a) => { if (!a.duo.data.winner) { a.duo.data.winner = act.key; petFx('🚩', act); } } }];
        const result = { anim: (a, act) => a.duo.data.winner === act.key ? 'celebrate' : 'sad', ms: 1200 };
        const tA = 2600 + Math.random() * 900, tB = 2600 + Math.random() * 900;
        return {
          a: [...climb(-4, tA), S.sync('top'), result, S.happy(700), { hop: { x: f.x(-19), y: 0 }, ms: 700, h: 10 }],
          b: [...climb(4, tB), S.sync('top'), result, S.happy(700), { hop: { x: f.x(19), y: 0 }, ms: 700, h: 10 }],
        };
      },
    ] },

  /* Ventilador: las aspas giran prendido (rt.on) y el viento empuja. */
  ventilador: { w: 18, h: 30,
    init: rt => { rt.fan = 0; rt.fanV = 0; },
    parts: [
      { id: 'stand', draw: p => {
        p.box(3, 27, 12, 3, FP.metalD, FP.metal);
        p.r(8, 14, 2, 13, FP.metal); p.r(8, 14, 1, 13, FP.whiteL);
        p.ring(9, 8, 8, FP.O, 1); p.ring(9, 8, 7, FP.metal, 1);
      } },
      { id: 'blades', pivot: [9, 8], pose: (rt, now, k, dt) => {
        rt.fanV += ((rt.on ? 18 : 0) - rt.fanV) * Math.min(1, dt * 2);
        rt.fan += rt.fanV * dt;
        return { r: rt.fan };
      }, draw: p => {
        p.r(8, 2, 2, 5, FP.blueL); p.r(8, 10, 2, 5, FP.blueL); p.r(3, 7, 5, 2, FP.blueL); p.r(11, 7, 5, 2, FP.blueL);
        p.disc(9, 8, 1.6, FP.blue);
      } },
    ],
    visits: [
      f => [
        { go: f.x(13) },
        { anim: 'pet', ms: 500, dir: -1, end: rt => { rt.on = true; } },
        { anim: 'happy', ms: 3600, dir: -1, fx: ['💨'], fxEvery: 300, track: (rt, el) => ({ x: f.x(15 + Math.sin(el / 55) * 0.6) }) },
        S.wait(1600, 'idle', { dir: -1, fx: ['😌'] }),
        { anim: 'pet', ms: 500, dir: -1, end: rt => { rt.on = false; } },
        S.happy(700),
      ],
      /* Canta frente al ventilador y la voz le sale entrecortada. */
      f => [
        { go: f.x(12) },
        { anim: 'pet', ms: 500, dir: -1, end: rt => { rt.on = true; } },
        { bounce: 5, ms: 360, h: 6, dir: -1, fx: ['🎤', '🎵', '〰️'], fxEvery: 360 },
        S.happy(900, { dir: 1, fx: ['😆'] }),
        { bounce: 4, ms: 360, h: 6, dir: -1, fx: ['🎶'], fxEvery: 360 },
        { anim: 'pet', ms: 500, dir: -1, end: rt => { rt.on = false; } },
      ],
    ],
    duos: [
      f => ({
        a: [{ go: f.x(12) }, { anim: 'pet', ms: 500, dir: -1, end: rt => { rt.on = true; } }, S.sync('in'),
          { anim: 'happy', ms: 3600, dir: -1, fx: ['💨'], fxEvery: 400, track: (rt, el) => ({ x: f.x(14 + Math.sin(el / 55) * 0.6) }) },
          S.sync('end', { end: rt => { rt.on = false; } }), S.happy(700, { dir: 'partner' })],
        b: [{ go: f.x(20) }, S.sync('in'),
          { anim: 'happy', ms: 3600, dir: -1, fx: ['😆'], fxEvery: 900, track: (rt, el) => ({ x: f.x(22 + Math.sin(el / 50) * 0.8) }) },
          S.sync('end'), S.happy(700, { dir: 'partner' })],
      }),
    ] },

  /* Bola disco: prendida brilla alternando facetas y llena la pieza de
     luces de colores (clase .party en el piso, ver updateFurniture). */
  disco: { w: 16, h: 34,
    parts: [
      { id: 'stand', draw: p => {
        p.r(7, 9, 2, 22, FP.metalD); p.box(3, 31, 10, 3, FP.metal, FP.whiteL);
      } },
      { id: 'ballA', show: (rt, now) => !rt.on || Math.floor(now / 170) % 2 === 0, draw: p => {
        p.disc(8, 5, 4.8, (x, y) => (x + y) % 2 ? '#cfd6e6' : '#8d97b0'); p.r(6, 3, 1, 1, FP.whiteL);
      } },
      { id: 'ballB', show: (rt, now) => rt.on && Math.floor(now / 170) % 2 === 1, draw: p => {
        p.disc(8, 5, 4.8, (x, y) => (x + y) % 2 ? '#8d97b0' : '#e6ecf7'); p.r(9, 6, 1, 1, FP.whiteL); p.r(5, 4, 1, 1, '#ffb3d1');
      } },
    ],
    visits: [
      f => [
        { go: f.x(11) },
        { anim: 'pet', ms: 500, dir: -1, end: rt => { rt.on = true; } },
        S.dance(2000, 300, { fx: ['✨', '🎶', '💃'], fxEvery: 400 }),
        { bounce: 4, ms: 350, h: 14 },
        S.dance(2000, 250, { fx: ['🎶', '✨'], fxEvery: 400 }),
        { bounce: 3, ms: 420, h: 22 },
        { anim: 'celebrate', ms: 900, fx: ['🌟'] },
        { anim: 'pet', ms: 500, dir: -1, end: rt => { rt.on = false; } },
      ],
    ],
    duos: [
      f => ({
        a: [{ go: f.x(-12) }, { anim: 'pet', ms: 400, end: rt => { rt.on = true; } }, S.sync('in', { dir: 'partner' }),
          S.dance(2400, 300, { fx: ['💃', '✨'], fxEvery: 500 }), { bounce: 3, ms: 380, h: 18 }, S.sync('m'),
          S.dance(2000, 250), { bounce: 2, ms: 500, h: 26 }, S.sync('end', { end: rt => { rt.on = false; } }),
          S.happy(700, { dir: 'partner', fx: ['😆'] })],
        b: [{ go: f.x(12) }, S.sync('in', { dir: 'partner' }), { bounce: 3, ms: 380, h: 18 },
          S.dance(2400, 300, { fx: ['🕺'], fxEvery: 500 }), S.sync('m'), { bounce: 2, ms: 500, h: 26 },
          S.dance(2000, 250, { fx: ['🎶'], fxEvery: 500 }), S.sync('end'), S.happy(700, { dir: 'partner' })],
      }),
    ] },

  /* Puf: se aplasta cuando alguien cae encima (rt.squashAt) y se queda un
     poco hundido mientras está sentado (rt.sit). */
  puf: { w: 22, h: 11,
    init: rt => { rt.squashAt = -1e9; rt.sit = 0; },
    parts: [{ id: 'bag', pivot: [11, 11], pose: (rt, now) => {
      const t = (now - rt.squashAt) / 380;
      const hit = t < 1 ? Math.sin(Math.PI * t) * (1 - t) : 0;
      const squash = Math.min(1, hit * 1.6 + rt.sit * 0.35);
      return { sx: 1 + 0.12 * squash, sy: 1 - 0.22 * squash };
    }, draw: p => {
      p.ell(11, 6.5, 10.5, 4.6, (x, y) => y < 4 ? FP.purpleL : FP.purple);
      p.r(8, 3, 6, 1, '#d4c6ff');
    } }],
    visits: [
      f => [
        { go: f.x(-28) },
        S.wait(400, 'idle', { dir: 1 }),
        { hop: { x: f.x(0), y: f.y(6) }, ms: 650, h: 32, anim: 'celebrate', end: rt => { rt.squashAt = performance.now(); rt.sit = 1; } },
        { anim: 'sleep', ms: 4000, fx: ['😌', '💤'], fxEvery: 1400 },
        S.happy(700),
        { hop: { x: f.x(20), y: 0 }, ms: 450, h: 14, start: rt => { rt.sit = 0; rt.squashAt = performance.now(); } },
      ],
      /* Lo usa de cama elástica chiquita. */
      f => [
        { go: f.x(18) },
        { hop: { x: f.x(0), y: f.y(6) }, ms: 450, h: 16, end: rt => { rt.squashAt = performance.now(); } },
        { bounce: 6, ms: 420, h: 22, onBounce: rt => { rt.squashAt = performance.now(); }, fx: ['😆'], fxEvery: 1200 },
        S.wait(1600, 'idle', { start: rt => { rt.sit = 1; } }),
        { hop: { x: f.x(-20), y: 0 }, ms: 450, h: 14, start: rt => { rt.sit = 0; } },
      ],
    ],
    /* Uno se tira, después el otro encima... y se ríen. */
    duos: [
      f => ({
        a: [{ go: f.x(-26) }, S.sync('in'), { hop: { x: f.x(-3), y: f.y(6) }, ms: 650, h: 30, end: rt => { rt.squashAt = performance.now(); rt.sit = 1; } },
          S.sync('a-in'), S.wait(800, 'idle'), S.sync('b-in'),
          S.happy(2200, { dir: 'partner', fx: ['😆'], fxEvery: 800 }), { hop: { x: f.x(-22), y: 0 }, ms: 450, h: 14, start: rt => { rt.sit = 0; } }],
        b: [{ go: f.x(26) }, S.sync('in'), S.sync('a-in'),
          { hop: { x: f.x(4), y: f.y(6) }, ms: 650, h: 30, end: rt => { rt.squashAt = performance.now(); } }, S.sync('b-in'),
          S.happy(2200, { dir: 'partner', fx: ['😂'], fxEvery: 800 }), { hop: { x: f.x(22), y: 0 }, ms: 450, h: 14 }],
      }),
    ] },

  /* Piñata: se balancea con cada golpe (rt.pv, impulso) y al tercero se
     rompe y llueven dulces. Vuelve a aparecer cuando nadie la usa. */
  pinata: { w: 24, h: 38,
    init: rt => { rt.pr = 0; rt.pv = 0; rt.hits = 0; rt.broken = false; },
    parts: [
      { id: 'stand', draw: p => {
        p.box(1, 3, 4, 35, FP.woodD, FP.wood); p.box(1, 1, 22, 4, FP.wood, FP.woodL);
        p.r(0, 37, 7, 1, FP.O);
      } },
      { id: 'pinata', pivot: [18, 5], show: rt => !rt.broken, pose: (rt, now, k, dt) => {
        rt.pv += -rt.pr * 30 * dt; rt.pv *= Math.pow(0.35, dt); rt.pr += rt.pv * dt;
        return { r: rt.pr };
      }, draw: p => {
        p.r(18, 5, 1, 6, FP.rope);
        p.disc(18, 16, 5.6, (x, y) => [FP.pink, FP.yel, FP.blueL, FP.green][Math.floor(y / 2) % 4]);
        p.r(11, 15, 2, 2, FP.pink); p.r(23, 15, 2, 2, FP.yel); p.r(17, 21, 2, 2, FP.blueL);
        p.r(16, 14, 1, 1, FP.O); p.r(20, 14, 1, 1, FP.O);
      } },
    ],
    visits: [
      f => {
        const hit = (rt, act) => {
          rt.hits++; rt.pv += (Math.random() < 0.5 ? -1 : 1) * 3.2;
          petFx('💥', act);
          if (rt.hits >= 3){
            rt.broken = true;
            for (let i = 0; i < 6; i++) setTimeout(() => petFx(pickOne(['🍬', '🍭', '🎉', '🍫']), act), i * 120);
          }
        };
        const jump = { bounce: 1, ms: 560, h: 34, anim: 'celebrate', onApex: hit };
        return [
          { go: f.x(2) },
          S.wait(600, 'idle', { dir: 1, fx: ['😤'] }),
          jump, S.wait(500), jump, S.wait(500), jump,
          { anim: 'eat', ms: 2200, fx: ['😋', '🍬'], fxEvery: 600 },
          S.dance(1400, 350, { fx: ['🎉'] }),
        ];
      },
      /* Le pega con los ojos vendados: falla, falla... y le achunta. */
      f => {
        const miss = { bounce: 1, ms: 560, h: 30, anim: 'celebrate', onApex: (rt, act) => petFx('💨', act) };
        const hitAll = { bounce: 1, ms: 560, h: 34, anim: 'celebrate', onApex: (rt, act) => {
          rt.hits = 3; rt.broken = true; rt.pv += 4;
          for (let i = 0; i < 7; i++) setTimeout(() => petFx(pickOne(['🍬', '🍭', '🎉']), act), i * 110);
        } };
        return [
          { go: f.x(-10) },
          S.wait(900, 'sleep', { fx: ['🙈'] }),
          miss, { go: f.x(14), speed: 0.06, anim: 'walk' }, miss, { go: f.x(3), speed: 0.06 },
          hitAll,
          { anim: 'eat', ms: 2000, fx: ['😋'], fxEvery: 700 },
          S.dance(1400, 350, { fx: ['🎉'] }),
        ];
      },
    ],
    /* Le pegan por turnos; al que la rompe le llueven los dulces. */
    duos: [
      f => {
        const hit = (rt, act) => {
          rt.hits++; rt.pv += (Math.random() < 0.5 ? -1 : 1) * 3;
          petFx('💥', act);
          if (rt.hits >= 3){ rt.broken = true; for (let i = 0; i < 6; i++) setTimeout(() => petFx(pickOne(['🍬', '🍭', '🎉']), act), i * 120); }
        };
        const jump = { bounce: 1, ms: 560, h: 34, anim: 'celebrate', onApex: hit };
        return {
          a: [{ go: f.x(1) }, S.sync('in'), jump, S.sync('h1'), S.wait(700), S.sync('h2'), jump, S.sync('h3'),
            { anim: 'eat', ms: 2000, fx: ['😋'], fxEvery: 700 }, S.happy(700, { dir: 'partner' })],
          b: [{ go: f.x(10) }, S.sync('in'), S.wait(700, 'idle', { dir: -1 }), S.sync('h1'), jump, S.sync('h2'),
            S.wait(700), S.sync('h3'), { anim: 'eat', ms: 2000, fx: ['🍭'], fxEvery: 700 }, S.happy(700, { dir: 'partner' })],
        };
      },
    ] },
};
