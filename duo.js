/* ===================== De a dos: el acompañante =====================
   Un segundo personaje en la pieza (`buddy`): un hijo o una visita. Todavía
   no hay forma de "tener" uno jugando (eso viene después: hijos, visitas de
   amigos); por ahora se agrega desde el panel de prueba y queda en el save
   (`state.companion = { species, stage, name, kind }`).

   El acompañante NO tiene barras: no come, no se ensucia, no se enferma ni
   se muere. Uno solo se preocupa de la mascota principal; el otro está para
   acompañarla. Por eso todo lo que hace es visual, con dos excepciones
   chicas que pasan por furniJoy() (con su tope por hora, ver muebles.js):
   jugar juntos y consolarla cuando está triste o enferma le suben un poco la
   felicidad a la principal.

   Es un actor igual que la mascota (ver "Actores" en muebles.js): pasea,
   visita muebles solo, y cuando los dos están libres se ponen a jugar entre
   ellos (SOCIALS, abajo) o usan un mueble de a dos (los `duos` de cada
   mueble). Se duerme cuando la mascota se duerme, en la cama si hay una.

   Los juegos de a dos (duo-juegos.js) también usan al acompañante si hay
   uno; si no, invitan a una visita solo para esa partida. */

const buddy = { isMain: false, key: 'buddy', hidden: false,
  species: DEFAULT_SPECIES, stage: 'child', name: '',
  x: 0.3, targetX: 0.3, dir: 1, pauseUntil: 0, frame: 0, lastFrameSwitch: 0,
  y: 0, activity: null, anim: null, animT0: 0, nextVisitAt: 0, action: null,
  happyUntil: 0, comfortAt: 0, seenAction: null };

function buddyActive(){
  return !!(state && state.companion) && displayStage() !== 'egg';
}

/* El save manda: si cambió el acompañante (panel de prueba), se copia acá. */
function syncBuddy(){
  const c = state.companion;
  if (!c) return;
  if (buddy.species !== c.species || buddy.stage !== c.stage || buddy.name !== c.name){
    if (buddy.activity) endFurniActivity(buddy);
    buddy.species = c.species; buddy.stage = c.stage; buddy.name = c.name;
  }
}

function setCompanion(c){
  if (buddy.activity) endFurniActivity(buddy);
  state.companion = c;
  if (c){
    dexSeen(c.species);   // entra al Mimodex (logros.js)
    syncBuddy();
    buddy.x = buddy.targetX = walker.x < 0.5 ? Math.min(0.9, walker.x + 0.28) : Math.max(0.1, walker.x - 0.28);
    buddy.y = 0; buddy.dir = walker.x > buddy.x ? 1 : -1;
    buddy.pauseUntil = performance.now() + 1500;
  }
  saveState();
  render();
}

function buddyMood(now){
  if (gameOver) return 'sad';
  if (state.sleeping) return 'sleepy';
  return now < buddy.happyUntil ? 'happy' : 'normal';
}

/* Una acción de una sola vez (mimo, celebrar), igual que petAction pero del
   acompañante. Si estaba en una rutina, la corta. */
function buddyAction(name){
  if (!speciesById(buddy.species).animations[name]) return;
  if (buddy.activity) endFurniActivity(buddy);
  buddy.action = { name, startedAt: performance.now() };
}

function updateBuddy(dt){
  if (!buddyActive() || activeMinigame || arranging) return;
  syncBuddy();
  const now = performance.now();
  if (gameOver){
    if (buddy.activity) endFurniActivity(buddy, false);
    buddy.frame = 0;
    return;
  }
  /* Cuando la mascota celebra (ganó un juego, se mejoró), el otro también. */
  if (petAction && petAction !== buddy.seenAction){
    buddy.seenAction = petAction;
    if (petAction.name === 'celebrate' && !buddy.activity) buddyAction('celebrate');
  }
  if (buddy.activity){
    if (furniActivityBroken(buddyMood(now), buddy)) endFurniActivity(buddy);
    else { runFurniActivity(dt, now, buddy); return; }
  }
  buddy.anim = null;
  buddy.hidden = false;
  if (buddy.y > 0) buddy.y = Math.max(0, buddy.y - dt * 260);
  if (buddy.action){ buddy.frame = 0; return; }

  /* Se duerme con ella: en la cama si hay una, si no al lado. */
  if (state.sleeping){
    if (buddy.y === 0 && !startFurniRoutine('sleep', buddy)) startBuddySleep();
    return;
  }

  /* Triste o enferma: va a hacerle cariño, cada tanto. */
  const mood = displayMood();
  if ((mood === 'sad' || mood === 'sick') && now >= buddy.comfortAt && !walker.activity){
    buddy.comfortAt = now + COMFORT_GAP_MS;
    startComfort();
    return;
  }

  wanderActor(buddy, dt, now, () => maybeStartSocial(buddy, now) || maybeStartFurniVisit(now, buddy));
}

function startBuddySleep(){
  const g = socialHelpers(buddy, walker);
  const side = buddy.x <= walker.x ? -1 : 1;
  const spot = clampX(walker.x + side * g.touch * 1.05);
  startActivity(buddy, [
    { go: spot },
    S.wait(600, 'idle', { dir: 'partner', fx: ['😪'] }),
    { anim: 'sleep', until: () => !state.sleeping, fx: ['💤'], fxEvery: 2200 },
    S.wait(500, 'idle', { dir: 'partner' }),
  ], { kind: 'sleep', partner: walker });
}

const COMFORT_GAP_MS = 26000;

function startComfort(){
  const g = socialHelpers(buddy, walker);
  const side = buddy.x <= walker.x ? -1 : 1;
  startActivity(buddy, [
    { go: () => clampX(walker.x + side * g.touch * 0.95), speed: 0.15 },
    S.wait(500, 'idle', { dir: 'partner', fx: ['❓'] }),
    { anim: 'pet', ms: 2600, dir: 'partner', fx: ['💗', '💕'], fxEvery: 850 },
    S.call(() => furniJoy()),
    { bounce: 2, ms: 420, h: 12, dir: 'partner' },
    S.wait(900, 'idle', { dir: 'partner' }),
  ], { kind: 'comfort', partner: walker });
}

function renderBuddy(){
  const c = document.getElementById('buddyCanvas');
  const on = buddyActive();
  if (c._on !== on){ c.classList.toggle('hidden', !on); c._on = on; }
  if (!on) return;
  syncBuddy();
  fitPetCanvas(c);
  const ctx = c.getContext('2d');
  const drawn = drawSprite(ctx, buddy.stage, buddyMood(performance.now()), buddy.frame, false,
    stageDeviceScale(buddy.stage), { w: c.width, h: c.height }, buddy);
  buddy.drawn = buddy.hidden ? null : drawn;
  c.style.left = (buddy.x * 100) + '%';
  c.style.bottom = (4 + buddy.y) + 'px';
  c.style.transform = actorTransform(buddy, drawn);
  c.style.opacity = buddy.hidden ? '0' : '';
  /* El que va más arriba (montado, saltando por encima del otro) se dibuja
     delante. Se reordena el DOM y no el z-index, así el borde de la bañera
     (furniFront) sigue delante de los dos. */
  const front = buddy.y > walker.y + 2;
  if (c._front !== front){
    c._front = front;
    const pet = document.getElementById('petCanvas');
    if (front) pet.after(c); else pet.before(c);
  }
}

/* ===================== Jugar entre ellos =====================
   Cuando los dos están libres y uno termina un paseo, con SOCIAL_CHANCE se
   ponen a hacer algo juntos: o un mueble de a dos (SOCIAL_FURNI_SHARE de las
   veces, si hay uno libre) o uno de los juegos de SOCIALS. Entre una y otra
   pasa al menos SOCIAL_GAP_MS (contado desde que empieza, y cada una dura
   12-16 s, así que quedan ~10 s de paseo entre medio).

   Cada juego devuelve dos guiones (`a` y `b`) del mismo motor que los
   muebles; los `sync` hacen que se esperen. Qué personaje es `a` se sortea,
   así el que persigue, el que se esconde o el que salta no es siempre el
   mismo. `ok(g)` dice si se puede (escondidas necesita un mueble detrás del
   cual esconderse; caballito, que el de abajo no sea más chico). */

const SOCIAL_CHANCE = 0.55;
const SOCIAL_GAP_MS = 22000;
const SOCIAL_FURNI_SHARE = 0.4;
let socialNextAt = 0;
let lastSocial = null;

function socialHelpers(a, b){
  const fw = floorWidth();
  const px = d => d / fw;                        // px CSS → fracción del piso
  const ha = actorCssH(a), hb = actorCssH(b);
  /* El sprite ocupa ~3/4 del ancho de su celda: a esta distancia entre
     centros quedan pegados sin encimarse. */
  const touch = px((ha + hb) * 0.42);
  return { a, b, fw, px, ha, hb, touch, mid: clampX((a.x + b.x) / 2), night: isNightMode() };
}

/* Dónde se para cada uno para quedar a `gap` de distancia alrededor de `m`,
   sin cruzarse (el que estaba a la izquierda sigue a la izquierda). */
function pairSpots(g, m, gap){
  const c = Math.min(0.95 - gap / 2, Math.max(0.05 + gap / 2, m));
  const aLeft = g.a.x <= g.b.x;
  return { xa: c + (aLeft ? -gap / 2 : gap / 2), xb: c + (aLeft ? gap / 2 : -gap / 2), c };
}

/* Mira al otro (para los `dir: 'partner'`). */
const P = { dir: 'partner' };

const SOCIALS = [
  /* Se abrazan: caminan uno hacia el otro y se hacen cariño. */
  { id: 'abrazo', name: 'Abrazo', emoji: '🤗', weight: 1.2,
    build: g => {
      const { xa, xb } = pairSpots(g, g.mid, g.touch * 0.78);
      /* Abrazo, una vuelta de baile abrazados y otro abrazo más largo. */
      const fin = [S.sync('out', P), { bounce: 2, ms: 420, h: 14, dir: 'partner' }, S.sync('spin'),
        S.dance(1800, 450, { fx: ['💗'], fxEvery: 900 }), S.sync('again', P),
        { anim: 'pet', ms: 2400, ...P }, S.sync('bye', P), S.happy(1000, { ...P, fx: ['✨'] })];
      return {
        a: [{ go: xa }, S.sync('in', P), { anim: 'pet', ms: 2600, ...P, fx: ['💗', '💕'], fxEvery: 800 }, ...fin],
        b: [{ go: xb }, S.sync('in', P), { anim: 'pet', ms: 2600, ...P, fx: ['💗'], fxEvery: 1100 }, ...fin],
      };
    } },

  /* Chocan los cinco: tres saltitos de frente, el último bien alto. */
  { id: 'choca', name: 'Choca esos cinco', emoji: '👏', weight: 1,
    build: g => {
      const { xa, xb } = pairSpots(g, g.mid, g.touch * 1.05);
      const salto = (n, h, ms, anim) => [{ bounce: 1, ms, h, dir: 'partner', anim,
        onApex: (rt, act) => { if (act === g.a) petFx(pickOne(['👏', '✋', '✨']), act); } }, S.sync('c' + n, P)];
      /* Saludo secreto: dos choques, uno alto, una vuelta, espalda con
         espalda, y el choque final con salto grande. */
      const rutina = (x, other) => {
        const away = x < other ? -1 : 1;
        return [{ go: x }, S.sync('in', P), S.wait(300, 'idle', P),
          ...salto(1, 16, 420), ...salto(2, 16, 420), S.wait(250, 'idle', P), ...salto(3, 40, 720, 'celebrate'),
          S.dance(900, 225), S.sync('c4', { dir: away }), { bounce: 2, ms: 400, h: 12, dir: away }, S.wait(500, 'idle', { dir: away }),
          S.sync('c5', P), S.wait(300, 'idle', P), ...salto(6, 54, 820, 'celebrate'),
          S.dance(1500, 300, { fx: ['😆'] }), S.happy(600, P)];
      };
      return { a: rutina(xa, xb), b: rutina(xb, xa) };
    } },

  /* Saltarse: uno se agacha y el otro le pasa por encima, y así por turnos,
     avanzando por la pieza. Cuatro saltos: termina cada uno de un lado. */
  { id: 'saltarse', name: 'Saltarse', emoji: '🐸', weight: 1.3,
    build: g => {
      const d = Math.min(g.px(Math.max(g.ha, g.hb) * 0.62), 0.84 / 5);
      const dirT = g.mid < 0.5 ? 1 : -1;
      const x0 = dirT > 0 ? 0.06 + d : 0.94 - d;      // a adelante, b atrás; caben 4 saltos
      const leap = hOther => ({ hop: st => ({ x: clampX(st.partner.x + dirT * d), y: 0 }),
        ms: 640, h: hOther * 0.72 + 8, anim: 'happy', fx: ['✨'] });
      const agachado = name => S.sync(name, { anim: 'sad', dir: dirT });
      return {
        a: [{ go: x0 }, S.sync('in', { dir: dirT }), S.wait(400, 'idle', { dir: dirT }),
          agachado('l1'), leap(g.hb), S.sync('l2', { dir: dirT }), agachado('l3'), leap(g.hb), S.sync('l4', { dir: dirT }),
          S.sync('end', P), S.happy(1400, { ...P, fx: ['😆', '🎉'], fxEvery: 600 })],
        b: [{ go: x0 - dirT * d }, S.sync('in', { dir: dirT }), S.wait(400, 'idle', { dir: dirT }),
          leap(g.ha), S.sync('l1', { dir: dirT }), agachado('l2'), leap(g.ha), S.sync('l3', { dir: dirT }), agachado('l4'),
          S.sync('end', P), { bounce: 2, ms: 420, h: 14 }, S.happy(560, P)],
      };
    } },

  /* La pinta: uno persigue y el otro arranca; al pillarlo se cambian. */
  { id: 'pillar', name: 'La pinta', emoji: '🏃', weight: 1.3,
    build: g => {
      const catchDist = g.touch * 0.95;
      const lejos = st => { const s = st.partner.x < 0.5 ? 1 : -1; return clampX(st.partner.x + s * 0.34); };
      const persigue = (n) => [{ chase: 3400, speed: 0.2, catchDist, anim: 'walk' }, S.sync('t' + n, P),
        S.happy(500, { ...P, fx: ['✋'] })];
      const arranca = (n) => [{ flee: 3400, speed: 0.15, catchDist, anim: 'walk' }, S.sync('t' + n, P),
        S.wait(500, 'sad', { ...P, fx: ['😝'] })];
      const contar = S.wait(1100, 'idle', { ...P, fx: ['🙈'] });
      return {
        a: [S.wait(400, 'idle', { ...P, fx: ['❗'] }), S.sync('go'), contar, ...persigue(1),
          S.sync('swap'), { go: lejos, speed: 0.17 }, ...arranca(2),
          S.sync('end', P), S.happy(1400, { ...P, fx: ['😆'], fxEvery: 500 })],
        b: [S.happy(400, { ...P, fx: ['😆'] }), { go: lejos, speed: 0.17 }, S.sync('go'), ...arranca(1),
          S.sync('swap'), contar, ...persigue(2),
          S.sync('end', P), { bounce: 2, ms: 400, h: 14 }, S.happy(600, P)],
      };
    } },

  /* Carrera de una punta a la otra. Quién gana se decide al empezar (las
     velocidades salen del mismo sorteo), así cada uno sabe si celebra. */
  { id: 'carrera', name: 'Carrera', emoji: '🏁', weight: 1,
    build: g => {
      const dirT = g.mid < 0.5 ? 1 : -1;
      const off = g.px(8);
      const start = dirT > 0 ? 0.1 : 0.9, end = dirT > 0 ? 0.88 : 0.12;
      const va = 0.15 + Math.random() * 0.08, vb = 0.15 + Math.random() * 0.08;
      const fin = gana => gana
        ? [S.sync('meta'), { anim: 'celebrate', ms: 1500, dir: -dirT, fx: ['🏆', '✨'], fxEvery: 700 }, S.happy(700, P)]
        : [S.sync('meta'), S.wait(900, 'sad', { dir: -dirT, fx: ['😮'] }), S.happy(1300, { ...P, fx: ['👏'] })];
      return {
        a: [{ go: start }, S.sync('line', { dir: dirT }), S.wait(900, 'idle', { dir: dirT, fx: ['🏁'] }), S.sync('go'),
          { go: end, speed: va }, ...fin(va >= vb)],
        b: [{ go: start - dirT * off }, S.sync('line', { dir: dirT }), S.wait(900, 'idle', { dir: dirT }), S.sync('go'),
          { go: end - dirT * off, speed: vb }, ...fin(vb > va)],
      };
    } },

  /* Escondidas: `b` se mete detrás de un mueble mientras `a` cuenta mirando
     a la pared; después lo busca (primero donde no está) y lo encuentra. */
  { id: 'escondidas', name: 'Escondidas', emoji: '🙈', weight: 1.2,
    ok: g => !!hideSpot(),
    build: g => {
      const rt = hideSpot();
      const side = rt.x < 0.5 ? 1 : -1;
      const cuenta = clampX(rt.x + side * 0.42);
      const pared = side;                              // mira hacia el otro lado, sin espiar
      /* Primero busca donde no está: más allá de donde contó, o si no cabe, a medio camino. */
      const lejos = cuenta + side * 0.18;
      const falso = clampX(lejos > 0.94 || lejos < 0.06 ? cuenta - side * 0.2 : lejos);
      const found = st => st.duo.data.found;
      return { rt,
        a: [{ go: cuenta }, S.sync('in', P), { anim: 'idle', ms: 3000, dir: pared, fx: ['🙈'], fxEvery: 1000 },
          S.sync('hidden'), S.wait(400, 'idle', { dir: -pared, fx: ['❓'] }),
          { go: falso, speed: 0.12 }, S.wait(800, 'idle', { dir: side, fx: ['❓'] }), S.wait(500, 'idle', { dir: -side }),
          { go: clampX(rt.x + side * g.touch), speed: 0.13 }, S.wait(400, 'idle', { dir: -side }),
          S.call((r, act, st) => { st.duo.data.found = true; petFx('❗', act); }),
          S.sync('out', P), S.happy(1400, { ...P, fx: ['😆'], fxEvery: 600 })],
        b: [S.happy(400, P), S.sync('in'), { go: rt.x, speed: 0.15 }, { sync: 'hidden', hide: true },
          { anim: 'idle', until: found, hide: true },
          { hop: { x: clampX(rt.x - side * g.touch * 0.4), y: 0 }, ms: 480, h: 26, hide: false, fx: ['😝'] },
          S.sync('out', P), { bounce: 2, ms: 420, h: 16, dir: 'partner' }, S.happy(560, P)],
      };
    } },

  /* Caballito: el más grande lleva al otro en la espalda y pasean. */
  { id: 'caballito', name: 'Caballito', emoji: '🐴', weight: 1.1,
    ok: g => STAGE_CSS_PX[actorStage(g.b)] <= STAGE_CSS_PX[actorStage(g.a)],
    build: g => {
      /* `a` lleva, `b` va arriba. */
      const sube = g.ha * 0.48;
      const bob = () => sube + (Math.floor(performance.now() / 160) % 2);
      const x1 = clampX(g.a.x < 0.5 ? 0.78 : 0.22), x2 = clampX(1 - x1);
      const done = st => st.duo.data.ride;
      return {
        a: [S.wait(300, 'idle', P), S.sync('in', P), S.sync('up', { anim: 'sad' }),
          { go: x1, speed: 0.12 }, S.wait(500, 'happy', { fx: ['😆'] }), { go: x2, speed: 0.13 }, S.wait(400, 'happy'),
          { go: lerp(x1, x2, 0.5), speed: 0.12 },
          S.call((r, act, st) => { st.duo.data.ride = true; }), S.sync('down', P), S.happy(1000, { ...P, fx: ['✨'] })],
        b: [{ go: st => clampX(st.partner.x - (st.partner.x < 0.5 ? -1 : 1) * g.touch * 0.9) }, S.sync('in', P),
          { hop: st => ({ x: st.partner.x, y: sube }), ms: 520, h: 16 }, S.sync('up'),
          { ride: done, dy: bob, anim: 'happy', fx: ['😆', '✨', '🎵'], fxEvery: 1000 },
          { hop: st => ({ x: clampX(st.partner.x + st.partner.dir * g.touch), y: 0 }), ms: 520, h: 14 },
          S.sync('down', P), { bounce: 2, ms: 420, h: 14 }, S.happy(150, P)],
      };
    } },

  /* Cosquillas: uno se las hace al otro, que se retuerce de la risa; y
     después al revés. */
  { id: 'cosquillas', name: 'Cosquillas', emoji: '🤣', weight: 1,
    build: g => {
      const { xa, xb } = pairSpots(g, g.mid, g.touch * 0.85);
      const hace = n => [{ anim: 'pet', ms: 2200, ...P }, S.sync('c' + n, P)];
      const recibe = n => [{ anim: 'celebrate', ms: 2200, flip: 170, fx: ['😂', '🤣'], fxEvery: 600 }, S.sync('c' + n, P),
        S.wait(700, 'sick', { ...P, fx: ['💫'] })];
      /* Al final se las hacen los dos a la vez y quedan rendidos. */
      const guerra = [S.sync('war', P), { anim: 'celebrate', ms: 1800, flip: 200, fx: ['😂'], fxEvery: 700 }, S.sync('end', P),
        { anim: 'sleep', ms: 1200 }];
      return {
        a: [{ go: xa }, S.sync('in', P), ...hace(1), S.sync('r1', P), ...recibe(2), ...guerra, S.happy(1100, { ...P, fx: ['😆'] })],
        b: [{ go: xb }, S.sync('in', P), ...recibe(1), S.sync('r1', P), ...hace(2), ...guerra, S.happy(1100, P)],
      };
    } },

  /* Saltos: o al unísono, o en ola (uno sube cuando el otro baja). */
  { id: 'saltos', name: 'Saltos', emoji: '⭐', weight: 0.9,
    build: g => {
      const { xa, xb } = pairSpots(g, g.mid, g.touch * 1.3);
      const ola = Math.random() < 0.5;
      const bote = h => ({ bounce: 4, ms: 480, h, dir: 'partner' });
      const a = [{ go: xa }, S.sync('in', P)];
      const b = [{ go: xb }, S.sync('in', P)];
      if (ola){
        a.push(bote(26), S.sync('w1'), S.wait(240, 'idle', P), bote(26));
        b.push(S.wait(240, 'idle', P), bote(26), S.sync('w1'), bote(26));
      } else {
        a.push(bote(22), S.sync('w1'), bote(30));
        b.push(bote(22), S.sync('w1'), bote(30));
      }
      /* Tanda de saltos chicos y rápidos, y el gran salto final, juntos. */
      const fin = [S.sync('fast'), { bounce: 6, ms: 330, h: 12, dir: 'partner' }, S.sync('big'),
        { bounce: 2, ms: 760, h: 52, anim: 'celebrate', onApex: (rt, act) => petFx('✨', act) },
        S.sync('end', P), S.dance(1200, 300, { fx: ['🎉'] })];
      a.push(...fin); b.push(...fin);
      return { a, b };
    } },

  /* Bailan frente a frente; después uno se luce y el otro aplaude. */
  { id: 'baile', name: 'Baile', emoji: '🎶', weight: 1,
    build: g => {
      const { xa, xb } = pairSpots(g, g.mid, g.touch * 1.25);
      const luce = [{ bounce: 3, ms: 440, h: 22, anim: 'celebrate', fx: ['🎵', '🎶'], fxEvery: 500 }, S.dance(900, 220)];
      const aplaude = [S.wait(1320, 'happy', { ...P, fx: ['👏'], fxEvery: 650 }), S.wait(900, 'happy', P)];
      const d = {
        a: [{ go: xa }, S.sync('in', P), S.dance(2400, 380, { fx: ['🎵', '🎶'], fxEvery: 700 }), S.sync('s1'),
          ...luce, S.sync('s2'), ...aplaude, S.sync('end', P), { bounce: 1, ms: 600, h: 30, anim: 'celebrate' }, S.happy(600, P)],
        b: [{ go: xb }, S.sync('in', P), S.dance(2400, 380), S.sync('s1'),
          ...aplaude, S.sync('s2'), ...luce, S.sync('end', P), { bounce: 1, ms: 600, h: 30, anim: 'celebrate' }, S.happy(600, P)],
      };
      /* Remate: los dos a la vez, al mismo compás. */
      const remate = [S.sync('fin', P), { bounce: 3, ms: 440, h: 18, dir: 'partner' }, S.dance(1300, 220, { fx: ['🎶'] })];
      d.a.splice(-1, 0, ...remate); d.b.splice(-1, 0, ...remate);
      return d;
    } },

  /* Empujoncitos: uno salta encima del otro y lo corre; el otro se la
     devuelve. Termina en risa. */
  { id: 'empujon', name: 'Empujoncitos', emoji: '💥', weight: 0.9,
    build: g => {
      const { xa, xb } = pairSpots(g, g.mid, g.touch * 1.6);
      const aLeft = xa < xb;
      const empuja = (n, side) => [
        { hop: st => ({ x: clampX(st.partner.x - side * g.touch * 0.8), y: 0 }), ms: 420, h: 18 },
        S.call((r, act, st) => { st.duo.data['p' + n] = true; petFx('💥', act); }), S.happy(500, P)];
      const recibe = (n, side) => [{ anim: 'idle', ...P, until: st => st.duo.data['p' + n] },
        { slide: st => ({ x: clampX(st.x0 + side * 0.11), y: 0 }), ms: 300, anim: 'sad' },
        S.wait(450, 'sick', { ...P, fx: ['💫'] })];
      const sA = aLeft ? 1 : -1;   // hacia dónde empuja a
      /* Dos rondas: la segunda la empieza el que recibió primero. */
      return {
        a: [{ go: xa }, S.sync('in', P), ...empuja(1, sA), S.sync('r1', P), ...recibe(2, -sA), S.sync('r2', P),
          S.wait(500, 'happy', P), ...recibe(3, -sA), S.sync('r3', P), ...empuja(4, sA),
          S.sync('end', P), S.happy(1400, { ...P, fx: ['😆'], fxEvery: 600 })],
        b: [{ go: xb }, S.sync('in', P), ...recibe(1, sA), S.sync('r1', P), ...empuja(2, -sA), S.sync('r2', P),
          S.wait(500, 'happy', P), ...empuja(3, -sA), S.sync('r3', P), ...recibe(4, sA),
          S.sync('end', P), S.happy(1400, { ...P, fx: ['😂'], fxEvery: 700 })],
      };
    } },

  /* Se tiran en el suelo juntos: de noche miran las estrellas, de día
     duermen una siestita. */
  { id: 'tirados', name: 'Mirar el cielo', emoji: '🌙', weight: 0.7,
    build: g => {
      const { xa, xb } = pairSpots(g, g.mid, g.touch * 0.9);
      const fx = g.night ? ['⭐', '✨', '🌙'] : ['💤'];
      const mirar = { anim: 'sleep', ms: 8200, fx, fxEvery: 1300 };
      return {
        a: [{ go: xa }, S.sync('in', P), S.wait(500, 'idle', P), mirar, S.sync('up', P), S.happy(900, { ...P, fx: ['💗'] })],
        b: [{ go: xb }, S.sync('in', P), S.wait(500, 'idle', P), mirar, S.sync('up', P), { bounce: 1, ms: 500, h: 14 }, S.happy(400, P)],
      };
    } },

  /* Paseo: caminan juntos de punta a punta, conversando. */
  { id: 'paseo', name: 'Paseo', emoji: '💬', weight: 0.8,
    build: g => {
      const off = g.touch * 1.05;
      const x1 = g.mid < 0.5 ? 0.82 : 0.18, x2 = 1 - x1;
      const lado = x1 > x2 ? -1 : 1;   // `b` va detrás en la ida y adelante en la vuelta: nunca se cruzan
      const charla = S.wait(1200, 'happy', { ...P, fx: ['💬', '🎵', '😆'], fxEvery: 600 });
      return {
        a: [S.sync('in'), { go: x1, speed: 0.09 }, S.sync('p1'), charla, S.sync('p2'), { go: x2, speed: 0.09 },
          S.sync('p3'), charla, S.sync('end', P), S.happy(500, P)],
        b: [{ go: clampX(g.a.x + lado * off * 0.5), speed: 0.14 }, S.sync('in'), { go: clampX(x1 + lado * off), speed: 0.09 },
          S.sync('p1'), charla, S.sync('p2'), { go: clampX(x2 + lado * off), speed: 0.09 }, S.sync('p3'), charla,
          S.sync('end', P), S.happy(500, P)],
      };
    } },

  /* Imitar: `a` hace un movimiento y `b` lo copia, tres veces; en el último
     `b` se equivoca y los dos se ríen. */
  { id: 'imitar', name: 'Imitar', emoji: '👯', weight: 1,
    build: g => {
      const { xa, xb } = pairSpots(g, g.mid, g.touch * 1.35);
      const MOVES = [
        [{ bounce: 2, ms: 420, h: 18 }],
        [S.dance(1000, 250)],
        [{ anim: 'celebrate', ms: 1100 }],
        [{ bounce: 1, ms: 720, h: 42, anim: 'celebrate' }],
        [{ anim: 'clean', ms: 1100 }],
        [{ anim: 'eat', ms: 1000 }],
      ];
      const orden = MOVES.map((m, i) => i).sort(() => Math.random() - 0.5).slice(0, 4);
      const a = [{ go: xa }, S.sync('in', P)];
      const b = [{ go: xb }, S.sync('in', P)];
      orden.forEach((mi, n) => {
        const mov = MOVES[mi];
        const ultimo = n === orden.length - 1;
        a.push(...mov, S.sync('m' + n, P), S.sync('c' + n, P), S.wait(200, 'idle', P));
        const otro = MOVES[mi === 3 ? 1 : 3];   // el que no era
        b.push(S.sync('m' + n, P), ...(ultimo ? otro : mov), S.sync('c' + n, P), S.wait(200, 'idle', P));
      });
      a.push(S.wait(500, 'idle', { ...P, fx: ['❓'] }), S.sync('end', P), S.happy(1300, { ...P, fx: ['😆'], fxEvery: 600 }));
      b.push(S.wait(500, 'sad', { ...P, fx: ['😅'] }), S.sync('end', P), S.happy(1300, { ...P, fx: ['😂'], fxEvery: 600 }));
      return { a, b };
    } },
];

/* Un mueble detrás del cual esconderse: de los que no se pueden encimar
   (la pelota no tapa a nadie) y que nadie esté usando. */
function hideSpot(){
  return furniRt.find(rt => !rt.removed && !FURNI_ART[rt.id].free && !rt.users.size) || null;
}

/* ¿Está libre para empezar algo de a dos? */
function actorFree(act){
  if (act.activity || act.y > 0) return false;
  if (act.isMain) return !mainFrozen();
  return !act.action && !state.sleeping && !gameOver;
}

function maybeStartSocial(act, now){
  if (!buddyActive() || activeMinigame || arranging || now < socialNextAt) return false;
  if (!actorFree(walker) || !actorFree(buddy)) return false;
  socialNextAt = now + 3000;   // aunque no salga, que no se reintente en cada llegada
  if (Math.random() >= SOCIAL_CHANCE) return false;
  return startSocial();
}

/* `force`: id de un juego de SOCIALS, o 'mueble' para un mueble de a dos.
   Lo usa el panel de prueba. */
function startSocial(force){
  const now = performance.now();
  const [a, b] = Math.random() < 0.5 ? [walker, buddy] : [buddy, walker];
  if (a.activity) endFurniActivity(a, false);
  if (b.activity) endFurniActivity(b, false);
  const muebles = furniRt.filter(rt => !rt.removed && FURNI_ART[rt.id].duos && !rt.users.size);
  if (force === 'mueble' || (!force && muebles.length && Math.random() < SOCIAL_FURNI_SHARE)){
    if (!muebles.length) return false;
    startFurniDuo(pickOne(muebles), a, b);
    socialNextAt = now + SOCIAL_GAP_MS;
    medalAdd('juntos');   // logros.js
    return true;
  }
  let g = socialHelpers(a, b);
  let opciones = SOCIALS.filter(s => (force ? s.id === force : s.id !== lastSocial) && (!s.ok || s.ok(g)));
  /* Caballito al revés: si `b` es más grande, que lleve él. */
  if (!opciones.length && force === 'caballito'){
    g = socialHelpers(b, a);
    if (SOCIALS.find(s => s.id === force).ok(g)) return startSocialWith(SOCIALS.find(s => s.id === force), g, now);
  }
  if (!opciones.length) return false;
  const total = opciones.reduce((s, o) => s + o.weight, 0);
  let r = Math.random() * total;
  const s = opciones.find(o => (r -= o.weight) < 0) || opciones[0];
  return startSocialWith(s, g, now);
}

function startSocialWith(s, g, now){
  const d = s.build(g);
  const duo = newDuo(g.a, g.b);
  startActivity(g.a, d.a, { kind: 'social', duo, partner: g.b, rt: d.rt || null });
  startActivity(g.b, d.b, { kind: 'social', duo, partner: g.a, rt: d.rt || null });
  socialNextAt = now + SOCIAL_GAP_MS;
  lastSocial = s.id;
  medalAdd('juntos');   // logros.js
  return true;
}

/* ===================== Panel de prueba ===================== */

const COMPANION_STAGES = [['child', 'Niño'], ['teen', 'Adolescente'], ['adult', 'Adulto']];

function duoDebugHtml(){
  const c = state.companion;
  const juntos = c ? `
        <h4 style="margin-top:10px">Juntos ahora</h4>
        <div class="debug-grid">
          ${SOCIALS.map(s => `<button class="debug-btn" data-social="${s.id}">${s.emoji} ${s.name}</button>`).join('')}
          <button class="debug-btn" data-social="mueble">🛋️ Con un mueble</button>
        </div>` : '';
  const etapas = c ? `
        <div class="debug-grid" style="margin-top:6px">
          ${COMPANION_STAGES.map(([id, n]) => `<button class="debug-btn ${c.stage === id ? 'active' : ''}" data-buddy-stage="${id}">${n}</button>`).join('')}
        </div>` : '';
  const juegos = (typeof DUO_GAMES !== 'undefined') ? `
        <h4 style="margin-top:10px">Juegos de a dos</h4>
        <div class="debug-grid">
          ${DUO_GAMES.map(gm => `<button class="debug-btn" data-duo-game="${gm.id}">${gm.emoji} ${gm.name}</button>`).join('')}
        </div>` : '';
  return `
      <div class="debug-section">
        <h4>Acompañante</h4>
        <div class="debug-grid">
          <button class="debug-btn ${c && c.kind === 'hijo' ? 'active' : ''}" id="dbgBuddyChild">👶 Hijo</button>
          <button class="debug-btn ${c && c.kind === 'visita' ? 'active' : ''}" id="dbgBuddyVisit">👋 Visita</button>
          <button class="debug-btn ${!c ? 'active' : ''}" id="dbgBuddyOff">✖️ Nadie</button>
        </div>
        ${etapas}
        ${juntos}
        ${juegos}
      </div>`;
}

function wireDuoDebug(){
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
  on('dbgBuddyChild', () => {
    setCompanion({ species: state.species, stage: 'child', name: `${state.name} Jr.`, kind: 'hijo' });
    renderDebugPanel();
  });
  on('dbgBuddyVisit', () => {
    const otras = SPECIES_IDS.filter(id => id !== state.species);
    const sp = pickOne(otras.length ? otras : SPECIES_IDS);
    setCompanion({ species: sp, stage: 'adult', name: SPECIES_RAW[sp].name, kind: 'visita' });
    renderDebugPanel();
  });
  on('dbgBuddyOff', () => { setCompanion(null); renderDebugPanel(); });
  document.querySelectorAll('[data-buddy-stage]').forEach(el => el.addEventListener('click', () => {
    setCompanion({ ...state.companion, stage: el.dataset.buddyStage });
    renderDebugPanel();
  }));
  document.querySelectorAll('[data-social]').forEach(el => el.addEventListener('click', () => {
    if (mainFrozen()){ say('Ahora no puede: está ocupada, triste o durmiendo'); return; }
    if (petAction) petAction = null;
    buddy.action = null;
    if (!startSocial(el.dataset.social)) say(el.dataset.social === 'mueble' ? 'No hay un mueble de a dos libre' : 'Ahora no se puede (falta un mueble o el tamaño no da)');
  }));
  document.querySelectorAll('[data-duo-game]').forEach(el => el.addEventListener('click', () => {
    closeDebugPanel();
    DUO_GAMES.find(gm => gm.id === el.dataset.duoGame).start();
  }));
}

/* Tocar al acompañante: se pone feliz, igual que un mimo (pero sin barras). */
if (typeof window !== 'undefined'){
  window.addEventListener('DOMContentLoaded', () => {
    const c = document.getElementById('buddyCanvas');
    c.addEventListener('click', (e) => {
      if (!state || gameOver || arranging || !buddyActive()) return;
      e.stopPropagation();   // que no limpie la caca de pasada (listener de #screen)
      buddyAction('pet');
      buddy.happyUntil = performance.now() + 8000;
      petFx(pickOne(['💗', '💕', '😊']), buddy);
    });
  });
}
