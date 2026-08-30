/* ===================== Mimogoshi — especies (sprite sheets reales) =====================
   Cada especie se dibuja recortando frames reales de su spritesheet PNG, con las
   coordenadas y animaciones de su .json (el mismo documento va embebido acá abajo
   para no depender de un fetch()). El formato de todas las hojas es el mismo:
   una grilla de 32x32, frames con nombre ("normal","walk_1",...) y animaciones
   con {frames:[nombres], durations_ms:[...]}.
   El único dibujo procedural que queda es el huevo: para esa etapa no vino arte. */

/* 64x64 a propósito: es múltiplo entero del tamaño nativo del arte (32px → x2), y
   el CSS muestra el canvas 1:1 (64px), así que la única escala que queda es la del
   dispositivo (2x/3x), que es entera. Con medidas que no calzan unos píxeles del
   arte salen de 2 y otros de 3, y en una cara de 32x32 eso junta los ojos con la
   boca en un borrón que parece una segunda cara. */
const CANVAS_W = 64;
const CANVAS_H = 64;

/* Solo para el huevo. Los sprites se dibujan tal cual vienen del PNG: son la
   ilustración completa, así que no se les aplica ningún tinte encima. */
const PALETTES = {
  egg: { A:'#fff4d6', O:'#c9a24a' },
};

/* Animaciones que representan un ánimo continuo (se repiten en loop). El resto
   son acciones de una sola vez (comer, mimo, limpiar, medicina, celebrar). */
const LOOPING_ANIMS = new Set(['idle', 'walk', 'sad', 'sick', 'sleep', 'dead']);

/* ===================== Definiciones (mismo documento que los .json de la raíz) ===== */

const BLOB_RAW = {
  id: 'blob',
  name: 'Blob',
  image: 'sprites/blob_spritesheet.png',
  tileWidth: 32, tileHeight: 32,
  columns: 7, rows: 4,
  frames: {normal:{index:0,x:0,y:0,w:32,h:32},blink:{index:1,x:32,y:0,w:32,h:32},idle_squash:{index:2,x:64,y:0,w:32,h:32},walk_1:{index:3,x:96,y:0,w:32,h:32},walk_2:{index:4,x:128,y:0,w:32,h:32},happy_1:{index:5,x:160,y:0,w:32,h:32},happy_2:{index:6,x:192,y:0,w:32,h:32},happy_3:{index:7,x:0,y:32,w:32,h:32},happy_4:{index:8,x:32,y:32,w:32,h:32},sad_1:{index:9,x:64,y:32,w:32,h:32},sad_2:{index:10,x:96,y:32,w:32,h:32},sick_1:{index:11,x:128,y:32,w:32,h:32},sick_2:{index:12,x:160,y:32,w:32,h:32},sleep_1:{index:13,x:192,y:32,w:32,h:32},sleep_2:{index:14,x:0,y:64,w:32,h:32},eat_1:{index:15,x:32,y:64,w:32,h:32},eat_2:{index:16,x:64,y:64,w:32,h:32},eat_3:{index:17,x:96,y:64,w:32,h:32},pet_1:{index:18,x:128,y:64,w:32,h:32},pet_2:{index:19,x:160,y:64,w:32,h:32},pet_3:{index:20,x:192,y:64,w:32,h:32},clean_1:{index:21,x:0,y:96,w:32,h:32},clean_2:{index:22,x:32,y:96,w:32,h:32},medicine_1:{index:23,x:64,y:96,w:32,h:32},medicine_2:{index:24,x:96,y:96,w:32,h:32},celebrate:{index:25,x:128,y:96,w:32,h:32},dead_1:{index:26,x:160,y:96,w:32,h:32},dead_2:{index:27,x:192,y:96,w:32,h:32}},
  animations: {idle:{frames:["normal","idle_squash","normal","blink"],durations_ms:[780,780,2500,180]},walk:{frames:["walk_1","walk_2"],durations_ms:[220,220]},happy:{frames:["happy_1","happy_2","happy_3","happy_4","normal"],durations_ms:[150,150,200,150,1750]},sad:{frames:["sad_1","sad_2"],durations_ms:[900,900]},sick:{frames:["sick_1","sick_2"],durations_ms:[340,340]},sleep:{frames:["sleep_1","sleep_2"],durations_ms:[800,800]},eat:{frames:["eat_1","eat_2","eat_3"],durations_ms:[220,220,320]},pet:{frames:["pet_1","pet_2","pet_3","happy_4"],durations_ms:[150,150,180,420]},clean:{frames:["clean_1","clean_2","clean_1","clean_2"],durations_ms:[100,100,100,400]},medicine:{frames:["medicine_1","blink","medicine_2"],durations_ms:[220,220,410]},celebrate:{frames:["happy_1","happy_2","celebrate","happy_4"],durations_ms:[150,150,220,380]},dead:{frames:["dead_1","dead_2"],durations_ms:[1040,1040]}},
};

const GATO_RAW = {
  id: 'gato',
  name: 'Gato',
  image: 'sprites/gato_spritesheet.png',
  tileWidth: 32, tileHeight: 32,
  columns: 7, rows: 4,
  frames: {normal:{index:0,x:0,y:0,w:32,h:32},blink:{index:1,x:32,y:0,w:32,h:32},idle_squash:{index:2,x:64,y:0,w:32,h:32},walk_1:{index:3,x:96,y:0,w:32,h:32},walk_2:{index:4,x:128,y:0,w:32,h:32},happy_1:{index:5,x:160,y:0,w:32,h:32},happy_2:{index:6,x:192,y:0,w:32,h:32},happy_3:{index:7,x:0,y:32,w:32,h:32},happy_4:{index:8,x:32,y:32,w:32,h:32},sad_1:{index:9,x:64,y:32,w:32,h:32},sad_2:{index:10,x:96,y:32,w:32,h:32},sick_1:{index:11,x:128,y:32,w:32,h:32},sick_2:{index:12,x:160,y:32,w:32,h:32},sleep_1:{index:13,x:192,y:32,w:32,h:32},sleep_2:{index:14,x:0,y:64,w:32,h:32},eat_1:{index:15,x:32,y:64,w:32,h:32},eat_2:{index:16,x:64,y:64,w:32,h:32},eat_3:{index:17,x:96,y:64,w:32,h:32},pet_1:{index:18,x:128,y:64,w:32,h:32},pet_2:{index:19,x:160,y:64,w:32,h:32},pet_3:{index:20,x:192,y:64,w:32,h:32},clean_1:{index:21,x:0,y:96,w:32,h:32},clean_2:{index:22,x:32,y:96,w:32,h:32},medicine_1:{index:23,x:64,y:96,w:32,h:32},medicine_2:{index:24,x:96,y:96,w:32,h:32},celebrate:{index:25,x:128,y:96,w:32,h:32},dead_1:{index:26,x:160,y:96,w:32,h:32},dead_2:{index:27,x:192,y:96,w:32,h:32}},
  animations: {idle:{frames:["normal","idle_squash","normal","blink"],durations_ms:[780,780,2500,180]},walk:{frames:["walk_1","walk_2"],durations_ms:[220,220]},happy:{frames:["happy_1","happy_2","happy_3","happy_4","normal"],durations_ms:[150,150,200,150,1750]},sad:{frames:["sad_1","sad_2"],durations_ms:[900,900]},sick:{frames:["sick_1","sick_2"],durations_ms:[340,340]},sleep:{frames:["sleep_1","sleep_2"],durations_ms:[800,800]},eat:{frames:["eat_1","eat_2","eat_3"],durations_ms:[220,220,320]},pet:{frames:["pet_1","pet_2","pet_3","happy_4"],durations_ms:[150,150,180,420]},clean:{frames:["clean_1","clean_2","clean_1","clean_2"],durations_ms:[100,100,100,400]},medicine:{frames:["medicine_1","blink","medicine_2"],durations_ms:[220,220,410]},celebrate:{frames:["happy_1","happy_2","celebrate","happy_4"],durations_ms:[150,150,220,380]},dead:{frames:["dead_1","dead_2"],durations_ms:[1040,1040]}},
};

const POLLITO_RAW = {
  id: 'pollito',
  name: 'Pollito',
  image: 'sprites/pollito_spritesheet.png',
  tileWidth: 32, tileHeight: 32,
  columns: 7, rows: 4,
  frames: {normal:{index:0,x:0,y:0,w:32,h:32},blink:{index:1,x:32,y:0,w:32,h:32},idle_squash:{index:2,x:64,y:0,w:32,h:32},walk_1:{index:3,x:96,y:0,w:32,h:32},walk_2:{index:4,x:128,y:0,w:32,h:32},happy_1:{index:5,x:160,y:0,w:32,h:32},happy_2:{index:6,x:192,y:0,w:32,h:32},happy_3:{index:7,x:0,y:32,w:32,h:32},happy_4:{index:8,x:32,y:32,w:32,h:32},sad_1:{index:9,x:64,y:32,w:32,h:32},sad_2:{index:10,x:96,y:32,w:32,h:32},sick_1:{index:11,x:128,y:32,w:32,h:32},sick_2:{index:12,x:160,y:32,w:32,h:32},sleep_1:{index:13,x:192,y:32,w:32,h:32},sleep_2:{index:14,x:0,y:64,w:32,h:32},eat_1:{index:15,x:32,y:64,w:32,h:32},eat_2:{index:16,x:64,y:64,w:32,h:32},eat_3:{index:17,x:96,y:64,w:32,h:32},pet_1:{index:18,x:128,y:64,w:32,h:32},pet_2:{index:19,x:160,y:64,w:32,h:32},pet_3:{index:20,x:192,y:64,w:32,h:32},clean_1:{index:21,x:0,y:96,w:32,h:32},clean_2:{index:22,x:32,y:96,w:32,h:32},medicine_1:{index:23,x:64,y:96,w:32,h:32},medicine_2:{index:24,x:96,y:96,w:32,h:32},celebrate:{index:25,x:128,y:96,w:32,h:32},dead_1:{index:26,x:160,y:96,w:32,h:32},dead_2:{index:27,x:192,y:96,w:32,h:32}},
  animations: {idle:{frames:["normal","idle_squash","normal","blink"],durations_ms:[780,780,2500,180]},walk:{frames:["walk_1","walk_2"],durations_ms:[220,220]},happy:{frames:["happy_1","happy_2","happy_3","happy_4","normal"],durations_ms:[150,150,200,150,1750]},sad:{frames:["sad_1","sad_2"],durations_ms:[900,900]},sick:{frames:["sick_1","sick_2"],durations_ms:[340,340]},sleep:{frames:["sleep_1","sleep_2"],durations_ms:[800,800]},eat:{frames:["eat_1","eat_2","eat_3"],durations_ms:[220,220,320]},pet:{frames:["pet_1","pet_2","pet_3","happy_4"],durations_ms:[150,150,180,420]},clean:{frames:["clean_1","clean_2","clean_1","clean_2"],durations_ms:[100,100,100,400]},medicine:{frames:["medicine_1","blink","medicine_2"],durations_ms:[220,220,410]},celebrate:{frames:["happy_1","happy_2","celebrate","happy_4"],durations_ms:[150,150,220,380]},dead:{frames:["dead_1","dead_2"],durations_ms:[1040,1040]}},
};

const BLOB_AMARILLO_RAW = {
  id: 'blob_amarillo',
  name: 'Blob Amarillo',
  image: 'sprites/blob_amarillo.png',
  tileWidth: 32, tileHeight: 32,
  columns: 7, rows: 4,
  frames: {normal:{index:0,x:0,y:0,w:32,h:32},blink:{index:1,x:32,y:0,w:32,h:32},idle_squash:{index:2,x:64,y:0,w:32,h:32},walk_1:{index:3,x:96,y:0,w:32,h:32},walk_2:{index:4,x:128,y:0,w:32,h:32},happy_1:{index:5,x:160,y:0,w:32,h:32},happy_2:{index:6,x:192,y:0,w:32,h:32},happy_3:{index:7,x:0,y:32,w:32,h:32},happy_4:{index:8,x:32,y:32,w:32,h:32},sad_1:{index:9,x:64,y:32,w:32,h:32},sad_2:{index:10,x:96,y:32,w:32,h:32},sick_1:{index:11,x:128,y:32,w:32,h:32},sick_2:{index:12,x:160,y:32,w:32,h:32},sleep_1:{index:13,x:192,y:32,w:32,h:32},sleep_2:{index:14,x:0,y:64,w:32,h:32},eat_1:{index:15,x:32,y:64,w:32,h:32},eat_2:{index:16,x:64,y:64,w:32,h:32},eat_3:{index:17,x:96,y:64,w:32,h:32},pet_1:{index:18,x:128,y:64,w:32,h:32},pet_2:{index:19,x:160,y:64,w:32,h:32},pet_3:{index:20,x:192,y:64,w:32,h:32},clean_1:{index:21,x:0,y:96,w:32,h:32},clean_2:{index:22,x:32,y:96,w:32,h:32},medicine_1:{index:23,x:64,y:96,w:32,h:32},medicine_2:{index:24,x:96,y:96,w:32,h:32},celebrate:{index:25,x:128,y:96,w:32,h:32},dead_1:{index:26,x:160,y:96,w:32,h:32},dead_2:{index:27,x:192,y:96,w:32,h:32}},
  animations: {idle:{frames:["normal","idle_squash","normal","blink"],durations_ms:[780,780,2500,180]},walk:{frames:["walk_1","walk_2"],durations_ms:[220,220]},happy:{frames:["happy_1","happy_2","happy_3","happy_4","normal"],durations_ms:[150,150,200,150,1750]},sad:{frames:["sad_1","sad_2"],durations_ms:[900,900]},sick:{frames:["sick_1","sick_2"],durations_ms:[340,340]},sleep:{frames:["sleep_1","sleep_2"],durations_ms:[800,800]},eat:{frames:["eat_1","eat_2","eat_3"],durations_ms:[220,220,320]},pet:{frames:["pet_1","pet_2","pet_3","happy_4"],durations_ms:[150,150,180,420]},clean:{frames:["clean_1","clean_2","clean_1","clean_2"],durations_ms:[100,100,100,400]},medicine:{frames:["medicine_1","blink","medicine_2"],durations_ms:[220,220,410]},celebrate:{frames:["happy_1","happy_2","celebrate","happy_4"],durations_ms:[150,150,220,380]},dead:{frames:["dead_1","dead_2"],durations_ms:[1040,1040]}},
};

const AMARILLO_CUERNOS_RAW = {
  id: 'amarillo_cuernos',
  name: 'Amarillo Cuernos',
  image: 'sprites/amarillo_cuernos.png',
  tileWidth: 32, tileHeight: 32,
  columns: 7, rows: 4,
  frames: {normal:{index:0,x:0,y:0,w:32,h:32},blink:{index:1,x:32,y:0,w:32,h:32},idle_squash:{index:2,x:64,y:0,w:32,h:32},walk_1:{index:3,x:96,y:0,w:32,h:32},walk_2:{index:4,x:128,y:0,w:32,h:32},happy_1:{index:5,x:160,y:0,w:32,h:32},happy_2:{index:6,x:192,y:0,w:32,h:32},happy_3:{index:7,x:0,y:32,w:32,h:32},happy_4:{index:8,x:32,y:32,w:32,h:32},sad_1:{index:9,x:64,y:32,w:32,h:32},sad_2:{index:10,x:96,y:32,w:32,h:32},sick_1:{index:11,x:128,y:32,w:32,h:32},sick_2:{index:12,x:160,y:32,w:32,h:32},sleep_1:{index:13,x:192,y:32,w:32,h:32},sleep_2:{index:14,x:0,y:64,w:32,h:32},eat_1:{index:15,x:32,y:64,w:32,h:32},eat_2:{index:16,x:64,y:64,w:32,h:32},eat_3:{index:17,x:96,y:64,w:32,h:32},pet_1:{index:18,x:128,y:64,w:32,h:32},pet_2:{index:19,x:160,y:64,w:32,h:32},pet_3:{index:20,x:192,y:64,w:32,h:32},clean_1:{index:21,x:0,y:96,w:32,h:32},clean_2:{index:22,x:32,y:96,w:32,h:32},medicine_1:{index:23,x:64,y:96,w:32,h:32},medicine_2:{index:24,x:96,y:96,w:32,h:32},celebrate:{index:25,x:128,y:96,w:32,h:32},dead_1:{index:26,x:160,y:96,w:32,h:32},dead_2:{index:27,x:192,y:96,w:32,h:32}},
  animations: {idle:{frames:["normal","idle_squash","normal","blink"],durations_ms:[780,780,2500,180]},walk:{frames:["walk_1","walk_2"],durations_ms:[220,220]},happy:{frames:["happy_1","happy_2","happy_3","happy_4","normal"],durations_ms:[150,150,200,150,1750]},sad:{frames:["sad_1","sad_2"],durations_ms:[900,900]},sick:{frames:["sick_1","sick_2"],durations_ms:[340,340]},sleep:{frames:["sleep_1","sleep_2"],durations_ms:[800,800]},eat:{frames:["eat_1","eat_2","eat_3"],durations_ms:[220,220,320]},pet:{frames:["pet_1","pet_2","pet_3","happy_4"],durations_ms:[150,150,180,420]},clean:{frames:["clean_1","clean_2","clean_1","clean_2"],durations_ms:[100,100,100,400]},medicine:{frames:["medicine_1","blink","medicine_2"],durations_ms:[220,220,410]},celebrate:{frames:["happy_1","happy_2","celebrate","happy_4"],durations_ms:[150,150,220,380]},dead:{frames:["dead_1","dead_2"],durations_ms:[1040,1040]}},
};

/* ===================== Normalización a un runtime único =====================
   El .json indexa los frames por nombre; el runtime los quiere como lista de
   pasos ya resueltos, así que acá se traduce una vez al cargar:
   - frames: array indexable [ {x,y,w,h}, ... ]
   - animations: { nombre: { steps:[{frame, durationMs}], loop:bool } }
   - image: HTMLImageElement, y `ready` que se pone en true cuando carga. */

function normalizeSpecies(raw){
  const names = Object.keys(raw.frames).sort((a,b) => raw.frames[a].index - raw.frames[b].index);
  const frames = names.map(n => ({ x:raw.frames[n].x, y:raw.frames[n].y, w:raw.frames[n].w, h:raw.frames[n].h }));
  const byName = {};
  names.forEach((n, i) => { byName[n] = frames[i]; });

  const animations = {};
  Object.keys(raw.animations).forEach(animName => {
    const a = raw.animations[animName];
    animations[animName] = {
      steps: a.frames.map((name, i) => ({ frame: byName[name], durationMs: a.durations_ms[i] })),
      loop: LOOPING_ANIMS.has(animName),
    };
  });

  const image = new Image();
  const runtime = { id: raw.id, name: raw.name, image, ready: false, animations };
  image.onload = () => { runtime.ready = true; };
  image.src = raw.image;
  return runtime;
}

const SPECIES_RAW = {
  blob: BLOB_RAW, gato: GATO_RAW, pollito: POLLITO_RAW,
  blob_amarillo: BLOB_AMARILLO_RAW, amarillo_cuernos: AMARILLO_CUERNOS_RAW,
};
const SPECIES = {
  blob:             normalizeSpecies(BLOB_RAW),
  gato:             normalizeSpecies(GATO_RAW),
  pollito:          normalizeSpecies(POLLITO_RAW),
  blob_amarillo:    normalizeSpecies(BLOB_AMARILLO_RAW),
  amarillo_cuernos: normalizeSpecies(AMARILLO_CUERNOS_RAW),
};
const SPECIES_IDS = ['blob', 'gato', 'pollito', 'blob_amarillo', 'amarillo_cuernos'];
const DEFAULT_SPECIES = 'blob';
function speciesById(id){ return SPECIES[id] || SPECIES[DEFAULT_SPECIES]; }

/* Estilo inline para mostrar el frame "normal" de una especie como miniatura en
   el selector, recortando su spritesheet real vía background-position en vez de
   tener que precortar archivos aparte. Se escala x2 (entero) por lo mismo que
   el canvas: a escala fraccionaria el pixel art se embarra. */
function speciesThumbStyle(id){
  const raw = SPECIES_RAW[id];
  const s = 2;
  const f = raw.frames.normal;
  return [
    `width:${raw.tileWidth*s}px`, `height:${raw.tileHeight*s}px`,
    `background-image:url('${raw.image}')`,
    `background-size:${raw.columns*raw.tileWidth*s}px ${raw.rows*raw.tileHeight*s}px`,
    `background-position:-${f.x*s}px -${f.y*s}px`,
    `image-rendering:pixelated`,
  ].join(';');
}

/* ===================== Reproductor de animación =====================
   Recorre animations[nombre].steps sumando duraciones. El flag "loop" decide si
   una animación de ánimo se repite sin fin (idle/walk/sad/sick/sleep/dead) o si
   una acción (comer, mimo, limpiar...) se reproduce una vez y vuelve sola al
   ánimo normal. */

function animTotalMs(species, name){
  return species.animations[name].steps.reduce((sum, s) => sum + s.durationMs, 0);
}

function frameAtElapsed(species, name, elapsedMs){
  const anim = species.animations[name];
  const total = animTotalMs(species, name);
  let t = anim.loop ? elapsedMs % total : Math.min(elapsedMs, total - 0.001);
  for (const step of anim.steps){
    if (t < step.durationMs) return step.frame;
    t -= step.durationMs;
  }
  return anim.steps[anim.steps.length - 1].frame;
}

let petAction = null; // { name, startedAt } — animación de una sola vez (comer, mimo, limpiar...)

function triggerPetAction(name){
  if (!speciesById(currentSpeciesId()).animations[name]) return;
  petAction = { name, startedAt: performance.now() };
}

function pickAnimation(species, mood, walkFrame, now){
  if (petAction && species.animations[petAction.name]){
    const elapsed = now - petAction.startedAt;
    if (elapsed < animTotalMs(species, petAction.name)) return { name: petAction.name, startedAt: petAction.startedAt };
    petAction = null;
  }
  if (mood === 'dead')    return { name:'dead',  startedAt:0 };
  if (mood === 'sleepy')  return { name:'sleep', startedAt:0 };
  if (mood === 'sick')    return { name:'sick',  startedAt:0 };
  if (mood === 'sad')     return { name:'sad',   startedAt:0 };
  if (walkFrame === 1 || walkFrame === 2) return { name:'walk', startedAt:0 };
  if (mood === 'happy')   return { name:'happy', startedAt:0 };
  return { name:'idle', startedAt:0 };
}

/* ===================== Huevo =====================
   No vino arte para esta etapa: un óvalo chico dibujado a mano. */

function drawEgg(ctx){
  const pal = PALETTES.egg;
  const rx = 16, ry = 20;
  const cx = CANVAS_W/2, cy = CANVAS_H - ry - 2; // apoyado en el piso, igual que los sprites
  ctx.fillStyle = pal.O;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = pal.A;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx-3, ry-3, 0, 0, Math.PI*2);
  ctx.fill();
}

/* ===================== Render ===================== */

/* Cuántos píxeles de canvas ocupa un píxel del arte. Siempre entero, y siempre el
   mismo para todos los píxeles del frame — es lo único que mantiene el pixel art
   nítido. Con el arte de 32px da 2, o sea 64x64: llena el canvas justo. */
function pixelScale(frame){
  return Math.max(1, Math.floor(Math.min(CANVAS_W / frame.w, CANVAS_H / frame.h)));
}

/* La especie activa es la de la mascota guardada, salvo que el panel de prueba
   la esté forzando para previsualizar otra. */
function currentSpeciesId(){
  return (typeof debugForcedSpecies !== 'undefined' && debugForcedSpecies) ||
         (state && state.species) || DEFAULT_SPECIES;
}

function drawSprite(ctx, stage, mood, walkFrame, noClear){
  if (!noClear) ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.imageSmoothingEnabled = false;

  if (stage === 'egg'){
    drawEgg(ctx);
    return;
  }

  const species = speciesById(currentSpeciesId());
  if (!species.ready) return; // la imagen carga async; el próximo frame ya la tiene

  const now = performance.now();
  const { name, startedAt } = pickAnimation(species, mood, walkFrame, now);
  const frame = frameAtElapsed(species, name, now - startedAt);

  const scale = pixelScale(frame);
  const dw = frame.w * scale, dh = frame.h * scale;
  const dx = Math.round((CANVAS_W - dw) / 2);
  const dy = CANVAS_H - dh; // apoyado en el piso

  ctx.drawImage(species.image, frame.x, frame.y, frame.w, frame.h, dx, dy, dw, dh);
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
const MS_PER_GAME_HOUR = 60000;  // 1 minuto real = 1 hora de juego (60 h de juego por hora real)
const EGG_HOURS = 0.1;         // horas de juego que dura el huevo (~6 s reales)
const SLEEPY_THRESHOLD = 35;   // bajo esto puede quedarse dormido solo
const RED_ZONE = 25;           // bajo esto, ni alimentarlo/jugar lo despierta

/* Desgaste en puntos por hora de juego. Van escritos como 100 / <horas de juego>
   para que se lea directo cuánto tarda cada barra en vaciarse entera; con
   MS_PER_GAME_HOUR = 60000, una hora real son 60 horas de juego. */
const DECAY_PER_HOUR = {
  hunger:    100 / 180,   // 180 h de juego = 3 horas reales
  happiness: 100 / 300,   // 300 h de juego = 5 horas reales
  energy:    100 / 960,   // 960 h de juego = 16 horas reales
  hygiene:   100 / 120,   // 120 h de juego = 2 horas reales, pero solo si hay caca
};
const ENERGY_RECOVER_PER_HOUR = 100 / 60;  // durmiendo: barra entera en 1 hora real

/* Bajo estos valores la barra entra en "apuro" y se vacía más rápido — el bajón
   se acelera solo cuando ya va mal. */
const DISTRESS_AT = { hunger: 20, happiness: 20, hygiene: 20, energy: 10 };
const DISTRESS_MULT = 1.5;

/* La salud tiene dos causas de daño independientes que se suman: que alguna de
   las otras barras esté bajo HEALTH_RISK_AT, y estar enfermo. Con las dos a la
   vez la salud cae al doble (una hora real de 100 a 0). */
const HEALTH_RISK_AT = 50;
const HEALTH_DECAY_PER_HOUR = 100 / 120;   // 2 horas reales por cada causa
const HEALTH_RECOVER_PER_HOUR = 1.5;       // solo si no hay ninguna causa activa

/* Probabilidad de enfermarse, por hora de juego. */
const SICK_CHANCE_PER_HOUR = 0.002;
const SICK_CHANCE_PER_HOUR_LOW = 0.1;
const SICK_LOW_HEALTH_AT = 60;

let state = null;
let tickTimer = null;
let animFrame = null;
let gameOver = false;
let activeMinigame = null; // null | 'stars' | 'basketball'

/* Modo prueba: no se guarda, vive solo en memoria de la sesión */
let debugMode = false;
let debugForcedStage = null;   // null = usar la etapa real de la mascota
let debugForcedMood = null;    // null = usar el ánimo calculado normalmente
let debugForcedSpecies = null; // null = usar la especie real de la mascota

/* Solo dos etapas: el huevo (lo único procedural, `drawEgg()`) y la mascota ya
   salida. No había arte distinto por edad —los spritesheets son un solo diseño
   por especie— así que bebé/niño/adolescente/adulto se veían todos idénticos. */
const ALL_STAGES = ['egg','grown'];
const ALL_MOODS = ['normal','happy','sad','sick','sleepy','dead'];

function displayStage(){ return debugForcedStage || state.stage; }
function displayMood(){ return debugForcedMood || currentMood(); }

const walker = { x: 0.5, targetX: 0.5, dir: 1, pauseUntil: 0, frame: 0, lastFrameSwitch: 0 };

function freshState(name, species){
  return {
    name: name || speciesById(species).name,
    species: species || DEFAULT_SPECIES,
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
    records: {},   // mejor puntaje por minijuego
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
    if (!s.species || !SPECIES[s.species]) s.species = DEFAULT_SPECIES; // saves de especies que ya no existen
    if (!s.records || typeof s.records !== 'object') s.records = {};    // saves anteriores a los récords
    if (!ALL_STAGES.includes(s.stage)) s.stage = 'grown';               // saves con baby/child/teen/adult_*
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

function stageFor(ageHours){
  return ageHours < EGG_HOURS ? 'egg' : 'grown';
}

/* Velocidad a la que baja una barra, ya con el castigo por estar en apuro. */
function decayRate(stat, value){
  const base = DECAY_PER_HOUR[stat];
  const umbral = DISTRESS_AT[stat];
  return (umbral !== undefined && value < umbral) ? base * DISTRESS_MULT : base;
}

/* Probabilidad de enfermarse en un lapso de `hours` horas de juego.
   Se compone en vez de multiplicar: catchUp() puede entregar 72 horas de una,
   y 72 * 0.1 daría 7.2 — o sea "seguro", además de ser una probabilidad > 1.
   Compuesta, el resultado siempre queda entre 0 y 1 y respeta la tasa por hora. */
function sickChance(hours){
  const porHora = state.health < SICK_LOW_HEALTH_AT ? SICK_CHANCE_PER_HOUR_LOW : SICK_CHANCE_PER_HOUR;
  return 1 - Math.pow(1 - porHora, hours);
}

function applyDecay(hours){
  if (hours <= 0) return;

  if (debugMode){
    state.hunger = state.happiness = state.energy = state.hygiene = state.health = 100;
    state.sick = false;
    state.poop = false;
    state.ageHours += hours;
    if (!debugForcedStage) state.stage = stageFor(state.ageHours);
    return;
  }

  const sleepFactor = state.sleeping ? 0.25 : 1;
  state.hunger   = clamp(state.hunger   - hours * decayRate('hunger',    state.hunger)    * sleepFactor);
  state.happiness= clamp(state.happiness- hours * decayRate('happiness', state.happiness) * sleepFactor);
  state.energy   = clamp(state.energy   + (state.sleeping
    ? hours * ENERGY_RECOVER_PER_HOUR
    : -hours * decayRate('energy', state.energy)));

  if (!state.poop && Math.random() < hours * 0.35) state.poop = true;
  /* La higiene NO baja sola: solo se ensucia mientras haya caca sin limpiar. Así
     limpiar deja de ser un trámite periódico y pasa a ser la respuesta a algo
     que el jugador ve en pantalla. */
  if (state.poop) state.hygiene = clamp(state.hygiene - hours * decayRate('hygiene', state.hygiene));

  /* Salud: las dos causas se suman, y solo se recupera si no hay ninguna. */
  const enRiesgo = state.hunger    < HEALTH_RISK_AT || state.happiness < HEALTH_RISK_AT ||
                   state.energy    < HEALTH_RISK_AT || state.hygiene   < HEALTH_RISK_AT;
  let healthDelta = 0;
  if (enRiesgo)   healthDelta -= HEALTH_DECAY_PER_HOUR;
  if (state.sick) healthDelta -= HEALTH_DECAY_PER_HOUR;
  if (healthDelta === 0) healthDelta = HEALTH_RECOVER_PER_HOUR;
  state.health = clamp(state.health + hours * healthDelta);

  if (!state.sick && Math.random() < sickChance(hours)) state.sick = true;

  /* Se sigue llevando la cuenta de qué tan bien se cuidó, pero por ahora nadie la
     lee: era lo que decidía la rama adulta (buena/neutra/mala) y esas etapas ya
     no existen. Se deja acumulando porque va en el save y es el enganche obvio
     si algún día vuelve a haber ramas o un final según el cuidado. */
  const careDelta = (state.hunger>60?1:-1) + (state.happiness>60?1:-1) + (state.hygiene>60?1:-1);
  if (careDelta > 0) state.careGood += hours * careDelta * 0.5;
  if (careDelta < 0) state.careBad += hours * -careDelta * 0.5;

  state.ageHours += hours;
  state.stage = stageFor(state.ageHours);

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
  sgDispose();
  rxDispose();
  trDispose();
  if (bb && bb.raf) cancelAnimationFrame(bb.raf);
  if (bb && bb.onShoot) document.getElementById('btnShoot').removeEventListener('click', bb.onShoot);
  sg = null;
  bb = null;
  rx = null;
  tr = null;
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
  const mood = displayMood();
  const frozen = gameOver || displayStage() === 'egg' || state.sleeping || petAction ||
    mood === 'sleepy' || mood === 'dead' || mood === 'sad' || mood === 'sick';
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
  drawSprite(ctx, displayStage(), displayMood(), walker.frame);
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
  triggerPetAction('eat');
  saveState(); render();
};

const btnClean = () => {
  if (!tryWake()) return;
  catchUp();
  state.hygiene = clamp(state.hygiene + 35);
  state.poop = false;
  floatFx('🫧');
  say(state.stage === 'egg' ? 'Huevo brillante' : '¡Ya quedó limpio!');
  if (state.stage !== 'egg') triggerPetAction('clean');
  saveState(); render();
};

const btnMed = () => {
  if (!state.sick) return;
  catchUp();
  state.sick = false;
  state.health = clamp(state.health + 20);
  floatFx('💊');
  say('Se siente mejor');
  triggerPetAction('medicine');
  saveState(); render();
};

const btnPet = () => {
  if (state.stage === 'egg') { say('Todavía es un huevo…'); return; }
  if (!tryWake()) return;
  catchUp();
  state.happiness = clamp(state.happiness + 6);
  floatFx('💗');
  say('¡Le encanta que lo mimen!');
  triggerPetAction('pet');
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

  /* El récord va como insignia a la derecha y no dentro del texto: si va en el
     texto la descripción pasa a dos líneas y con cuatro juegos la lista ya no
     entra en la pantalla. */
  const record = (id) => {
    const best = bestScore(id);
    return best > 0 ? `<span class="menu-record">★ ${best}</span>` : '';
  };

  showOverlay(`
    <h3>🎮 Elegir juego</h3>
    <div class="menu-list">
      <div class="menu-item" id="pickStars">
        <span class="emoji">⭐</span>
        <div class="info"><b>Atrapa estrellas</b><small>Esquiva la caca</small></div>
        ${record('stars')}
      </div>
      <div class="menu-item" id="pickBasketball">
        <span class="emoji">🏀</span>
        <div class="info"><b>Baloncesto</b><small>Tira en el momento justo</small></div>
        ${record('basketball')}
      </div>
      <div class="menu-item" id="pickReflex">
        <span class="emoji">🎯</span>
        <div class="info"><b>Reflejos</b><small>Todo menos las bombas</small></div>
        ${record('reflex')}
      </div>
      <div class="menu-item" id="pickTap">
        <span class="emoji">🎵</span>
        <div class="info"><b>Tap rítmico</b><small>Toca al cruzar la línea</small></div>
        ${record('tap')}
      </div>
    </div>
    <button class="overlay-btn" id="btnCloseGames">Cancelar</button>
  `);

  document.getElementById('pickStars').addEventListener('click', () => { hideOverlay(); startStarsGame(); });
  document.getElementById('pickBasketball').addEventListener('click', () => { hideOverlay(); startBasketballGame(); });
  document.getElementById('pickReflex').addEventListener('click', () => { hideOverlay(); startReflexGame(); });
  document.getElementById('pickTap').addEventListener('click', () => { hideOverlay(); startTapGame(); });
  document.getElementById('btnCloseGames').addEventListener('click', hideOverlay);
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

/* Alta y baja del canvas de minijuego: las dos mitades que todos repiten igual. */
function enterMinigame(id){
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
  activeMinigame = null;
}

/* Cierre común: aplica el premio, avisa el récord y deja todo guardado. */
function finishMinigame(id, { score, happinessGain, energyCost, hygieneCost = 0, message }){
  const record = saveBestScore(id, score);
  state.happiness = clamp(state.happiness + happinessGain);
  state.energy = clamp(state.energy - energyCost);
  if (hygieneCost) state.hygiene = clamp(state.hygiene - hygieneCost);

  say(record ? `¡RÉCORD! ${message}` : message, 2200);
  if (happinessGain > 0) triggerPetAction('celebrate');
  exitMinigame();
  saveState(); render();
}

/* ===================== Minijuego 1: atrapar estrellas =====================
   20 segundos con dificultad creciente: arranca lento y casi todo son estrellas,
   termina rápido y con mucha más caca. El combo (estrellas seguidas, sin comer
   caca ni dejar caer ninguna) multiplica hasta x4, así que lo que decide el
   puntaje no es atrapar mucho sino no romper la racha. */

const SG_DURATION = 20;
const SG_BASKET_HALF = 18;
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
    pointer: makeCanvasPointer(gc),
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

  sg.onMove = (e) => {
    const { x } = sg.pointer.at(e);
    sg.basketX = Math.max(SG_BASKET_HALF, Math.min(gc.width - SG_BASKET_HALF, x));
  };
  gc.addEventListener('pointermove', sg.onMove);

  say('¡Atrapa las estrellas!');
  sg.raf = requestAnimationFrame(sgLoop);
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

  if (sg.keys.left)  sg.basketX = Math.max(SG_BASKET_HALF, sg.basketX - 260*dt);
  if (sg.keys.right) sg.basketX = Math.min(gc.width - SG_BASKET_HALF, sg.basketX + 260*dt);

  sg.spawnIn -= dt;
  if (sg.spawnIn <= 0){
    sg.spawnIn = 0.62 - 0.34*progress;          // 0.62s → 0.28s entre caídas
    const roll = Math.random();
    const poopChance = 0.16 + 0.26*progress;    // 16% → 42% de caca
    const kind = roll < poopChance ? 'poop' : (roll > 0.95 ? 'gold' : 'star');
    sg.items.push({
      x: 16 + Math.random()*(gc.width - 32),
      y: -12,
      vy: (72 + 96*progress) * (0.85 + Math.random()*0.4),
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

  ctx.fillStyle = '#ffe66d';
  ctx.beginPath();
  ctx.moveTo(sg.basketX - SG_BASKET_HALF, gc.height - 6);
  ctx.lineTo(sg.basketX + SG_BASKET_HALF, gc.height - 6);
  ctx.lineTo(sg.basketX, gc.height - 26);
  ctx.closePath();
  ctx.fill();

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
  sg.gc.removeEventListener('pointermove', sg.onMove);
  sg.pointer.dispose();
  if (sg.raf) cancelAnimationFrame(sg.raf);
}

function endStarsGame(){
  const score = sg ? sg.score : 0;
  const bestCombo = sg ? sg.bestCombo : 0;
  sgDispose();
  sg = null;

  /* Un bot que no falla nada saca ~96, así que el tope de felicidad queda arriba
     de lo que da una partida buena pero no perfecta: hay que jugar bien de verdad. */
  const happinessGain = clamp(Math.round(score * 0.6), -10, 45);
  const message = score > 0
    ? `${score} pts (combo ${bestCombo}) +${happinessGain} felicidad`
    : 'Mmm, la próxima será';

  finishMinigame('stars', { score, happinessGain, energyCost: 18, hygieneCost: 5, message });
}

/* ===================== Minijuego 2: baloncesto (timing) ===================== */

const BB_TOTAL_SHOTS = 3;
/* La pelota sube y baja junto a la mascota. El acierto depende de qué tan cerca del punto
   más alto se aprieta TIRAR — las zonas de acierto no se muestran, solo están codificadas
   como umbrales de altura (0 = abajo, 1 = arriba del todo). Se endurece por tiro. */
const BB_DIFFICULTY = [
  { peak: 0.90, near: 0.80, speed: 1.0 },
  { peak: 0.95, near: 0.85, speed: 1.25 },
  { peak: 0.98, near: 0.90, speed: 1.5 },
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

  // Mismo tamaño y mismo piso que la mascota fuera de los minijuegos. Sin
  // ctx.scale(): se dibuja 1:1 para no reintroducir una escala fraccionaria.
  ctx.save();
  ctx.translate(Math.round(bb.monoX - CANVAS_W/2), Math.round(bb.groundY - CANVAS_H));
  drawSprite(ctx, displayStage(), debugForcedMood || (state.sick ? 'sick' : 'happy'), 0, true);
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
  if (happinessGain > 0) triggerPetAction('celebrate');
  activeMinigame = null;
  bb = null;
  saveState(); render();
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
    rx.spawnIn = 0.78 - 0.44*progress;            // 0.78s → 0.34s entre blancos
    const ttl = 1.55 - 0.75*progress;             // 1.55s → 0.80s de vida
    const roll = Math.random();
    const bombChance = 0.18 + 0.22*progress;      // 18% → 40% bombas
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

function endReflexGame(){
  const score = rx ? rx.score : 0;
  const bestCombo = rx ? rx.bestCombo : 0;
  const sinVidas = rx ? rx.lives <= 0 : false;
  rxDispose();
  rx = null;

  const happinessGain = clamp(Math.round(score * 0.5), 0, 45);
  const message = sinVidas
    ? `¡Boom! ${score} pts (combo ${bestCombo})`
    : `${score} pts (combo ${bestCombo}) +${happinessGain} felicidad`;

  finishMinigame('reflex', { score, happinessGain, energyCost: 20, message });
}

/* ===================== Minijuego 4: tap rítmico =====================
   Tres carriles, notas que bajan hasta la línea y hay que tocarlas justo cuando
   la cruzan. El chart acelera solo (0.62s → 0.34s entre notas), y como tocar de
   más también corta el combo, no sirve tapear a lo loco: hay que seguir el ritmo. */

const TR_LANES = 3;
const TR_LANE_CHAR = ['🍬','🎮','🫧'];
const TR_APPROACH = 1.35;   // segundos que tarda una nota en bajar hasta la línea
const TR_PERFECT = 0.09;    // ventana de acierto perfecto, en segundos
const TR_GOOD = 0.19;       // ventana de acierto normal

let tr = null;

/* Chart generado, no fijo: mismo esqueleto rítmico siempre (acelera parejo) pero
   los carriles cambian, así no se memoriza la secuencia en dos partidas. */
function trBuildChart(){
  const notes = [];
  let t = 1.7;        // deja un compás de aire antes de la primera nota
  let beat = 0.62;
  let lane = 1;
  while (t < 26){
    // salta a otro carril la mayoría de las veces, pero a veces repite
    if (Math.random() < 0.78){
      lane = (lane + 1 + Math.floor(Math.random()*(TR_LANES-1))) % TR_LANES;
    }
    notes.push({ t, lane, judged: false });
    t += beat;
    beat = Math.max(0.34, beat * 0.985);
  }
  return notes;
}

function startTapGame(){
  const { gc, ctx } = enterMinigame('tap');

  tr = {
    ctx, gc,
    notes: trBuildChart(),
    fx: [],
    score: 0,
    combo: 0,
    bestCombo: 0,
    perfects: 0,
    hits: 0,
    laneW: gc.width / TR_LANES,
    hitY: gc.height - 26,
    time: 0,
    cursor: 0,          // primera nota del chart todavía sin resolver
    endAt: 0,
    judgeText: '',
    judgeColor: '#fff',
    judgeUntil: 0,
    lanePulse: [0, 0, 0],
    pointer: makeCanvasPointer(gc),
    raf: null,
    lastT: 0,
  };
  tr.speed = (tr.hitY + 26) / TR_APPROACH; // px/s para que la nota tarde TR_APPROACH

  tr.onDown = (e) => {
    e.preventDefault();
    const { x } = tr.pointer.at(e);
    trHit(Math.max(0, Math.min(TR_LANES-1, Math.floor(x / tr.laneW))));
  };
  gc.addEventListener('pointerdown', tr.onDown);

  tr.onKeyDown = (e) => {
    const idx = { '1':0, '2':1, '3':2, a:0, s:1, d:2, ArrowLeft:0, ArrowDown:1, ArrowRight:2 }[e.key];
    if (idx !== undefined){ e.preventDefault(); trHit(idx); }
  };
  window.addEventListener('keydown', tr.onKeyDown);

  say('¡Toca al ritmo!');
  tr.raf = requestAnimationFrame(trLoop);
}

function trMultiplier(){
  return Math.min(4, 1 + Math.floor(tr.combo / 10));
}

function trJudge(text, color){
  tr.judgeText = text;
  tr.judgeColor = color;
  tr.judgeUntil = tr.time + 0.5;
}

function trHit(lane){
  if (!tr) return;
  tr.lanePulse[lane] = 0.18;

  /* La nota sin juzgar más cercana en el tiempo, dentro de ese carril. */
  let mejor = null, mejorDist = Infinity;
  for (const n of tr.notes){
    if (n.judged || n.lane !== lane) continue;
    const dist = Math.abs(n.t - tr.time);
    if (dist < mejorDist){ mejorDist = dist; mejor = n; }
  }

  if (!mejor || mejorDist > TR_GOOD){
    tr.combo = 0;                    // tocar cuando no hay nota corta la racha
    trJudge('fallo', '#ff8f8f');
    return;
  }

  mejor.judged = true;
  tr.combo += 1;
  if (tr.combo > tr.bestCombo) tr.bestCombo = tr.combo;
  tr.hits += 1;

  const perfecto = mejorDist <= TR_PERFECT;
  if (perfecto) tr.perfects += 1;
  tr.score += (perfecto ? 3 : 1) * trMultiplier();
  trJudge(perfecto ? '¡PERFECTO!' : 'bien', perfecto ? '#ffe66d' : '#c8f2c2');
  tr.fx.push({ char: TR_LANE_CHAR[lane], x: (lane + 0.5) * tr.laneW, y: tr.hitY, vy: -55, life: 0.5 });
}

function trLoop(t){
  if (activeMinigame !== 'tap' || !tr) return;
  const dt = Math.min(0.05, (t - (tr.lastT || t)) / 1000);
  tr.lastT = t;
  tr.time += dt;

  const gc = tr.gc, ctx = tr.ctx;
  ctx.clearRect(0, 0, gc.width, gc.height);

  for (let i = 0; i < TR_LANES; i++){
    if (tr.lanePulse[i] > 0) tr.lanePulse[i] -= dt;
    if (tr.lanePulse[i] > 0){
      ctx.fillStyle = `rgba(255,230,109,${(tr.lanePulse[i]/0.18)*0.18})`;
      ctx.fillRect(i*tr.laneW, 0, tr.laneW, gc.height);
    }
    if (i > 0){
      ctx.fillStyle = 'rgba(255,255,255,.08)';
      ctx.fillRect(Math.round(i*tr.laneW), 0, 1, gc.height);
    }
  }

  /* Franja de acierto: es exactamente la ventana "bien", así el jugador ve
     dónde tiene que estar la nota al tocar en vez de adivinarlo. */
  const banda = TR_GOOD * tr.speed;
  ctx.fillStyle = 'rgba(255,230,109,.10)';
  ctx.fillRect(0, tr.hitY - banda, gc.width, banda*2);
  ctx.fillStyle = 'rgba(255,230,109,.55)';
  ctx.fillRect(0, tr.hitY - 1, gc.width, 2);
  for (let i = 0; i < TR_LANES; i++){
    ctx.globalAlpha = 0.45;
    drawEmoji(ctx, TR_LANE_CHAR[i], 15, (i + 0.5)*tr.laneW, tr.hitY + 14);
    ctx.globalAlpha = 1;
  }

  /* El chart está ordenado por tiempo: el cursor salta las notas ya resueltas del
     principio y el break corta las que todavía no entran en pantalla, así cada
     frame solo toca las que se ven. */
  while (tr.cursor < tr.notes.length && tr.notes[tr.cursor].judged) tr.cursor++;
  let quedan = tr.cursor < tr.notes.length;
  for (let i = tr.cursor; i < tr.notes.length; i++){
    const n = tr.notes[i];
    const falta = n.t - tr.time;                   // >0 todavía viene bajando
    if (falta > TR_APPROACH) break;                // aún no entra en pantalla
    if (n.judged) continue;
    if (falta < -TR_GOOD){                         // se pasó de largo: fallo
      n.judged = true;
      tr.combo = 0;
      trJudge('fallo', '#ff8f8f');
      continue;
    }
    const y = tr.hitY - falta * tr.speed;
    const x = (n.lane + 0.5) * tr.laneW;
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,230,109,.16)';
    ctx.fill();
    drawEmoji(ctx, TR_LANE_CHAR[n.lane], 20, x, y);
  }

  for (let i = tr.fx.length - 1; i >= 0; i--){
    const f = tr.fx[i];
    f.life -= dt;
    if (f.life <= 0){ tr.fx.splice(i, 1); continue; }
    f.y += f.vy * dt;
    ctx.globalAlpha = Math.min(1, f.life * 2);
    drawEmoji(ctx, f.char, 16, f.x, f.y);
  }
  ctx.globalAlpha = 1;

  ctx.font = '11px monospace';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.fillText('🎵 ' + tr.score, 8, 16);
  ctx.textAlign = 'right';
  ctx.fillStyle = trMultiplier() > 1 ? '#ffe66d' : '#fff';
  ctx.fillText(`combo ${tr.combo}  x${trMultiplier()}`, gc.width - 8, 16);

  if (tr.time < tr.judgeUntil){
    ctx.textAlign = 'center';
    ctx.fillStyle = tr.judgeColor;
    ctx.fillText(tr.judgeText, gc.width/2, tr.hitY - 26);
  }

  /* Media pausa al final para alcanzar a ver el veredicto de la última nota. */
  if (!quedan){
    if (!tr.endAt) tr.endAt = tr.time + 0.8;
    if (tr.time >= tr.endAt){ endTapGame(); return; }
  }
  tr.raf = requestAnimationFrame(trLoop);
}

function trDispose(){
  if (!tr) return;
  tr.gc.removeEventListener('pointerdown', tr.onDown);
  window.removeEventListener('keydown', tr.onKeyDown);
  tr.pointer.dispose();
  if (tr.raf) cancelAnimationFrame(tr.raf);
}

function endTapGame(){
  const score = tr ? tr.score : 0;
  const bestCombo = tr ? tr.bestCombo : 0;
  const perfects = tr ? tr.perfects : 0;
  trDispose();
  tr = null;

  const happinessGain = clamp(Math.round(score * 0.13), 0, 45);
  const message = score > 0
    ? `${score} pts · ${perfects} perfectos (combo ${bestCombo})`
    : 'Se te fue el ritmo…';

  finishMinigame('tap', { score, happinessGain, energyCost: 20, message });
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

let pickedSpecies = DEFAULT_SPECIES;

function renderSpeciesPicker(){
  return SPECIES_IDS.map(id => `
    <div class="menu-item species-item ${pickedSpecies===id ? 'selected':''}" data-species="${id}">
      <span class="species-thumb" style="${speciesThumbStyle(id)}"></span>
      <div class="info"><b>${SPECIES_RAW[id].name}</b></div>
    </div>
  `).join('');
}

function askName(){
  pickedSpecies = DEFAULT_SPECIES;
  showOverlay(`
    <h3>🥚 Un nuevo Mimogoshi</h3>
    <p>¿Qué especie va a ser?</p>
    <div class="menu-list species-list" id="speciesList">${renderSpeciesPicker()}</div>
    <p>¿Cómo se va a llamar?</p>
    <div><input id="nameInput" maxlength="14" placeholder="Nombre" autofocus></div>
    <button class="overlay-btn" id="btnStart">Empezar</button>
  `);
  const input = document.getElementById('nameInput');
  const refreshSpeciesList = () => {
    document.getElementById('speciesList').innerHTML = renderSpeciesPicker();
    wireSpeciesList();
  };
  const wireSpeciesList = () => {
    document.querySelectorAll('#speciesList [data-species]').forEach(el => {
      el.addEventListener('click', () => {
        pickedSpecies = el.dataset.species;
        if (!input.value.trim()) input.placeholder = SPECIES_RAW[pickedSpecies].name;
        refreshSpeciesList();
      });
    });
  };
  wireSpeciesList();
  const start = () => {
    const name = input.value.trim().slice(0,14) || SPECIES_RAW[pickedSpecies].name;
    state = freshState(name, pickedSpecies);
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
  egg:'🥚 Huevo', grown:'🐣 Mascota',
};
const MOOD_LABELS = {
  normal:'😐 Normal', happy:'😄 Feliz', sad:'😢 Triste',
  sick:'🤒 Enfermo', sleepy:'😴 Dormido', dead:'👻 Fantasma',
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
  const speciesBtns = SPECIES_IDS.map(id => `
    <button class="debug-btn ${debugForcedSpecies===id ? 'active':''}" data-species="${id}">${SPECIES_RAW[id].name}</button>
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
        <h4>Especie</h4>
        <div class="debug-grid">
          <button class="debug-btn ${!debugForcedSpecies ? 'active':''}" id="dbgSpeciesAuto">🔄 Auto</button>
          ${speciesBtns}
        </div>
      </div>
      <div class="debug-section">
        <h4>Acciones</h4>
        <div class="debug-grid">
          <button class="debug-btn" id="dbgActEat">🍬 Comer</button>
          <button class="debug-btn" id="dbgActPet">💗 Mimo</button>
          <button class="debug-btn" id="dbgActClean">🧹 Limpiar</button>
          <button class="debug-btn" id="dbgActMedicine">💊 Medicina</button>
          <button class="debug-btn" id="dbgActCelebrate">🎉 Celebrar</button>
        </div>
      </div>
      <div class="debug-section">
        <h4>Minijuegos</h4>
        <div class="debug-grid">
          <button class="debug-btn" id="dbgStars">⭐ Estrellas</button>
          <button class="debug-btn" id="dbgBasketball">🏀 Baloncesto</button>
          <button class="debug-btn" id="dbgReflex">🎯 Reflejos</button>
          <button class="debug-btn" id="dbgTap">🎵 Tap rítmico</button>
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
  document.getElementById('dbgSpeciesAuto').addEventListener('click', () => {
    debugForcedSpecies = null; render(); renderDebugPanel();
  });
  document.querySelectorAll('[data-species]').forEach(el => {
    el.addEventListener('click', () => { debugForcedSpecies = el.dataset.species; render(); renderDebugPanel(); });
  });
  document.getElementById('dbgActEat').addEventListener('click', () => triggerPetAction('eat'));
  document.getElementById('dbgActPet').addEventListener('click', () => triggerPetAction('pet'));
  document.getElementById('dbgActClean').addEventListener('click', () => triggerPetAction('clean'));
  document.getElementById('dbgActMedicine').addEventListener('click', () => triggerPetAction('medicine'));
  document.getElementById('dbgActCelebrate').addEventListener('click', () => triggerPetAction('celebrate'));
  document.getElementById('dbgStars').addEventListener('click', () => { closeDebugPanel(); startStarsGame(); });
  document.getElementById('dbgBasketball').addEventListener('click', () => { closeDebugPanel(); startBasketballGame(); });
  document.getElementById('dbgReflex').addEventListener('click', () => { closeDebugPanel(); startReflexGame(); });
  document.getElementById('dbgTap').addEventListener('click', () => { closeDebugPanel(); startTapGame(); });
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
  document.getElementById('petCanvas').addEventListener('click', requireAlive(() => {
    if (state.poop) { btnClean(); return; } // tocar la caca limpia, no mima
    btnPet();
  }));
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
