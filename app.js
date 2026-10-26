/* ===================== Mimogoshi — especies (sprite sheets reales) =====================
   Cada especie se dibuja recortando frames reales de su spritesheet PNG, con las
   coordenadas y animaciones de su .json (el mismo documento va embebido acá abajo
   para no depender de un fetch()). El formato de todas las hojas es el mismo:
   una grilla de 32x32, frames con nombre ("normal","walk_1",...) y animaciones
   con {frames:[nombres], durations_ms:[...]}.
   El único dibujo procedural que queda es el huevo: para esa etapa no vino arte. */

/* 96x96 a propósito: es múltiplo entero del tamaño nativo del arte (32px → x3), y
   el CSS muestra el canvas 1:1 (96px), así que la única escala que queda es la del
   dispositivo (2x/3x), que es entera. Con medidas que no calzan unos píxeles del
   arte salen de 2 y otros de 3, y en una cara de 32x32 eso junta los ojos con la
   boca en un borrón que parece una segunda cara.
   Los tamaños válidos son los múltiplos de 32: 64, 96, 128, 192. */
const CANVAS_W = 96;
const CANVAS_H = 96;

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
/* `s` es la escala de la miniatura: entera sí o sí, igual que pixelScale(). Con 2
   la miniatura mide 64px, que es lo que permite tres columnas en la rejilla del
   selector sin que se desborde. */
function speciesThumbStyle(id, s = 2){
  const raw = SPECIES_RAW[id];
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
  /* Con plato o bañera puestos, comer y limpiarse se hacen ahí. */
  if ((name === 'eat' || name === 'clean') && startFurniRoutine(name)){ petAction = null; return; }
  petAction = { name, startedAt: performance.now() };
}

/* `act` es el personaje que se dibuja: la mascota (walker, con su petAction)
   o el acompañante (buddy, con su act.action). Ver "Actores" en muebles.js. */
function pickAnimation(species, mood, walkFrame, now, act = walker){
  const action = act.isMain ? petAction : act.action;
  if (action && species.animations[action.name]){
    const elapsed = now - action.startedAt;
    if (elapsed < animTotalMs(species, action.name)) return { name: action.name, startedAt: action.startedAt };
    if (act.isMain) petAction = null; else act.action = null;
  }
  /* Rutina con un mueble (ver "Muebles"): manda sobre el ánimo mientras dure,
     y se repite en loop aunque sea una acción de una sola vez (limpiarse
     frente al tocador dura más que la animación). */
  if (act.anim && species.animations[act.anim]){
    const total = animTotalMs(species, act.anim);
    return { name: act.anim, startedAt: now - ((now - act.animT0) % total) };
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

/* Tambaleo de lado a lado, tipo huevo a punto de eclosionar: sin esto se ve
   muerto. No es un seno continuo (eso da un vaivén lento y parejo) sino una
   ráfaga corta y rápida que se repite una vez por segundo y el resto del
   tiempo queda quieto — "lo hace rápido, y después se queda quieto". Con
   EGG_WOBBLE_HALF_CYCLES par el seno vuelve solo a 0 al final de la ráfaga,
   sin saltos.
   El giro es sobre la base (donde apoya en el piso) y no sobre el centro —
   si no, en vez de tambalearse parece que floppea flotando en el aire, porque
   la punta de abajo también se corre. Sin estado propio (render() ya redibuja
   cada frame) — sigue siendo el mismo óvalo, no hay sprites nuevos. */
const EGG_WOBBLE_PERIOD_MS = 1000;    // un ciclo por segundo
const EGG_WOBBLE_ACTIVE_MS = 280;     // el tambaleo dura esto adentro de cada ciclo
const EGG_WOBBLE_HALF_CYCLES = 4;     // dos vaivenes completos, rápido, durante lo activo
const EGG_WOBBLE_MAX_RAD = 0.175;     // ~10°

function eggWobbleAngle(now){
  const phase = now % EGG_WOBBLE_PERIOD_MS;
  if (phase >= EGG_WOBBLE_ACTIVE_MS) return 0; // quieto el resto del segundo
  const t = phase / EGG_WOBBLE_ACTIVE_MS;
  return Math.sin(EGG_WOBBLE_HALF_CYCLES * Math.PI * t) * EGG_WOBBLE_MAX_RAD;
}

function drawEgg(ctx, box){
  const pal = PALETTES.egg;
  /* Proporcional al canvas y no en píxeles fijos: si no, al agrandar la mascota
     el huevo se queda chico y descolocado abajo. `box` es el tamaño real del
     canvas (el de la mascota va en píxeles físicos, ver STAGE_CSS_PX). */
  const k = box.w / CANVAS_W;
  const rx = box.w * 0.25, ry = box.h * 0.3125;
  const cx = box.w/2, cy = box.h - ry - 2*k; // apoyado en el piso, igual que los sprites
  const baseY = cy + ry; // punto donde el huevo toca el piso: el eje del giro

  const wobble = eggWobbleAngle(performance.now());
  ctx.save();
  ctx.translate(cx, baseY);
  ctx.rotate(wobble);
  ctx.translate(-cx, -baseY);

  ctx.fillStyle = pal.O;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = pal.A;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx-3*k, ry-3*k, 0, 0, Math.PI*2);
  ctx.fill();

  ctx.restore();
}

/* ===================== Render ===================== */

/* Cuántos píxeles de canvas ocupa un píxel del arte. Siempre entero, y siempre el
   mismo para todos los píxeles del frame — es lo único que mantiene el pixel art
   nítido. Con el arte de 32px da 2, o sea 64x64: llena el canvas justo. */
function pixelScale(frame, box = { w: CANVAS_W, h: CANVAS_H }){
  return Math.max(1, Math.floor(Math.min(box.w / frame.w, box.h / frame.h)));
}

/* La especie activa es la de la mascota guardada, salvo que el panel de prueba
   la esté forzando para previsualizar otra. */
function currentSpeciesId(){
  return (typeof debugForcedSpecies !== 'undefined' && debugForcedSpecies) ||
         (state && state.species) || DEFAULT_SPECIES;
}

/* `scaleOverride` deja dibujar la mascota más chica dentro de un minijuego. Tiene
   que ser un entero: es exactamente la regla que rompe el pixel art si se ignora.
   `box` es el tamaño del canvas en sus propios píxeles: por defecto el de
   siempre (CANVAS_W/H), y para la mascota principal el canvas en píxeles
   físicos (ver STAGE_CSS_PX). */
function drawSprite(ctx, stage, mood, walkFrame, noClear, scaleOverride, box = { w: CANVAS_W, h: CANVAS_H }, act = walker){
  if (!noClear) ctx.clearRect(0, 0, box.w, box.h);
  ctx.imageSmoothingEnabled = false;

  if (stage === 'egg'){
    drawEgg(ctx, box);
    return;
  }

  const species = speciesById(act.isMain ? currentSpeciesId() : act.species);
  if (!species.ready) return; // la imagen carga async; el próximo frame ya la tiene

  const now = performance.now();
  const { name, startedAt } = pickAnimation(species, mood, walkFrame, now, act);
  const frame = frameAtElapsed(species, name, now - startedAt);

  const scale = scaleOverride || pixelScale(frame, box);
  const dw = frame.w * scale, dh = frame.h * scale;
  const dx = Math.round((box.w - dw) / 2);
  const dy = box.h - dh; // apoyado en el piso

  ctx.drawImage(species.image, frame.x, frame.y, frame.w, frame.h, dx, dy, dw, dh);
  return { species, frame, scale, dx, dy, box };   // para ubicar el accesorio (updateHat)
}

/* ===================== Comida ===================== */

/* El bocadillo simple ya no es infinito ni gratis: se arranca con
   FOOD_START_STOCK porciones (ver freshState) y de ahí en más se repone en la
   tienda como cualquier otra comida, a precio. */
/* Las comidas de hambre llevan descuento por tamaño: mientras más grande,
   menos monedas por punto (0.33 / 0.30 / 0.28). Como la barra no pasa del
   100%, lo que sobra se pierde: la grande conviene solo con harta hambre, y
   eso es una decisión (darle un bocadillo ahora o esperar y darle la que
   rinde más). Además calza con las etapas: a un adulto, con su panza grande,
   le sirven las grandes. Antes era al revés (0.33 / 0.40 / 0.50: se pagaba
   la comodidad), y comer de a varias porciones habría dejado las grandes sin
   sentido. */
const FOODS = [
  { id:'simple',   name:'Bocadillo simple', emoji:'🍬', restore:15, price:  5 },
  { id:'rica',     name:'Comida rica',      emoji:'🍗', restore:30, price:  9 },
  { id:'especial', name:'Comida especial',  emoji:'🍰', restore:50, price: 14 },
  { id:'redbull',  name:'Red Bull',         emoji:'⚡', restore: 2, energy: 20, price: 20 },
  /* El banquete llena la barra entera, sea cual sea la panza (fill: con
     restore 100 solo, a un adulto de 180 lo dejaba a medias). Cuesta más que
     dos especiales a propósito: es la forma cómoda, no la barata. */
  { id:'banquete', name:'Banquete',         emoji:'🍱', restore:100, fill:true, price: 55 },
  /* Solo energía (restore 0): para cuando está cansada y no se la quiere
     acostar. Ninguna llega a la de una siesta: la cama sigue siendo lo que
     llena la barra. */
  { id:'cafe',     name:'Café',             emoji:'☕', restore: 0, energy: 15, price: 10 },
  { id:'jugo',     name:'Jugo energético',  emoji:'🧃', restore: 0, energy: 35, price: 22 },
];

const FOOD_START_STOCK = 5;

/* La medicina ya no es un botón gratis e infinito: se compra en la tienda
   (pestaña Comida) como cualquier porción y se da desde la bandeja de Comer,
   en la misma fila que las comidas. Se guarda en la misma despensa (state.pantry), con
   su propia clave. Se arranca con MED_START_STOCK para que la primera
   enfermedad no pille sin monedas. */
const MEDICINE = { id:'medicina', name:'Medicina', emoji:'💊', price: 15 };
const MED_START_STOCK = 2;
const MED_HEALTH = 20;

/* Vacunas: una por etapa (niño, adolescente, adulto), cada una más cara.
   Sin la vacuna de su etapa la salud pierde VACCINE_HEALTH_LOSS_PER_DAY por
   día real, siempre, esté como esté. Como sin otras causas se recupera sola
   HEALTH_RECOVER_PER_DAY (15), cuidada y sin vacuna queda en −5 al día: baja
   muy despacio, pero nunca se recupera. Vacunada deja de perder esos 20 (y
   se enferma la mitad, VACCINE_SICK_MULT) hasta que crece y le toca la de
   la etapa nueva. Se compran en la tienda (pestaña Mejoras, solo la de su
   etapa) y se ponen en el acto, con su animación (vaccinateFx()); no se
   guardan en la despensa.
   Antes bajaba un "tope" de la salud (state.healthMax) en vez de la salud:
   con la recuperación de entonces (~25 por hora) una bajada lenta de la
   salud misma se tapaba sola. Con la recuperación de 15 al día ya no. */
const VACCINES = {
  child: { id: 'vac_child', name: 'Vacuna de niño',        price: 20 },
  teen:  { id: 'vac_teen',  name: 'Vacuna de adolescente', price: 50 },
  adult: { id: 'vac_adult', name: 'Vacuna de adulto',      price: 100 },
};
const VACCINE_EMOJI = '💉';
const VACCINE_HEALTH_LOSS_PER_DAY = 20;   // por día real, sin la vacuna de su etapa
const VACCINE_SICK_MULT = 0.5;
function vaccineFor(stage = state.stage){ return VACCINES[stage] || null; }
function isVaccinated(stage = state.stage){ return !!(state.vaccinated && state.vaccinated[stage]); }

function foodById(id){ return FOODS.find(f => f.id === id) || FOODS[0]; }

const FOOD_ENERGY_DEFAULT = 4;
function foodDesc(f){
  const energy = f.energy ?? FOOD_ENERGY_DEFAULT;
  if (!f.restore) return `Solo energía: +${energy}`;
  /* En puntos, con cuánto de SU panza llena según la etapa de ahora. */
  const pct = Math.round(hungerFillPct(f));
  const hambre = f.fill ? 'Llena el hambre' : `+${f.restore} de hambre (llena ${pct}%)`;
  return hambre + (energy !== FOOD_ENERGY_DEFAULT ? ` · +${energy} de energía` : '');
}

/* Cuántas porciones quedan. Todas las comidas, incluido el bocadillo simple,
   se gastan al usarlas y se reponen en la tienda. */
function foodStock(id){
  return (state.pantry && state.pantry[id]) || 0;
}

/* Solo emojis de Unicode 11 o anterior: la moneda (Unicode 13) y las
   burbujas (Unicode 14) salían como un cuadro vacío en teléfonos con un
   sistema un poco más viejo, que no traen esos glifos. */
function coinsLabel(n){ return `💰 ${n}`; }

/* Mejoras: se compran una sola vez (quedan compradas para siempre) y las
   "armables" son un seguro de un solo uso — cuando dispara su efecto se
   apagan solas y hay que volver a activarlas a mano, gratis, ya que están
   pagadas. No hay forma de dejarlas disparando para siempre: eso volvería
   trivial la caca o la enfermedad en vez de ser una red de contención
   puntual. Las dos últimas todavía no hacen nada — se compran igual, listas
   para cuando exista la función de visitar amigos, en vez de aparecer de la
   nada ese día. */
const UPGRADES = [
  { id:'autoClean', name:'Seguro de limpieza', emoji:'🧹', price: 30, armable: true,
    desc:'Limpia sola la primera caca que aparezca.' },
  { id:'autoMed', name:'Seguro médico', emoji:'💉', price: 50, armable: true,
    desc:'Cura sola una enfermedad si aparece.' },
  { id:'sendVisit', name:'Pase de visita', emoji:'🚪', price: 20, armable: false,
    desc:'Manda a tu mimogoshi a visitar a un amigo. (Próximamente)' },
  { id:'returnVisit', name:'Silbato de regreso', emoji:'📯', price: 20, armable: false,
    desc:'Trae de vuelta a tu mimogoshi de una visita. (Próximamente)' },
];

function upgradeById(id){ return UPGRADES.find(u => u.id === id); }

function upgradeState(id){
  const u = state.upgrades && state.upgrades[id];
  return u || { owned: false, armed: false, timesUsed: 0 };
}

/* Estilo: cosas que se compran solo para verse distinto, sin efecto en las
   barras. Cuatro tipos, cada uno con su forma de equiparse:
   - shell (carcasa del aparato) y screen (color de la pantalla LCD): siempre
     hay una puesta; las de price 0 vienen de fábrica.
   - hat: un accesorio a la vez en la cabeza de la mascota, o ninguno.
   - deco: un adorno por lugar de la pieza (slot: pared, izq, der), o ninguno.
   Los colores viven acá y no en el CSS: applyStyle() los pone como variables
   sobre #device, así una carcasa nueva es una línea en este catálogo. */
const STYLE_ITEMS = [
  { id:'rosa',      kind:'shell', name:'Chicle',    price:  0, colors:['#ff8cc0', '#ff5d9e', '#b44dff'] },
  { id:'menta',     kind:'shell', name:'Menta',     price: 40, colors:['#a6f5d6', '#3fd6a5', '#1f8fb0'] },
  { id:'oceano',    kind:'shell', name:'Océano',    price: 40, colors:['#8fd3ff', '#4f8dff', '#5b4bd6'] },
  { id:'atardecer', kind:'shell', name:'Atardecer', price: 50, colors:['#ffd27a', '#ff8a5c', '#e8457a'] },
  { id:'lima',      kind:'shell', name:'Lima',      price: 50, colors:['#e2ff8a', '#8fd94f', '#2f9e6a'] },
  { id:'noche',     kind:'shell', name:'Noche',     price: 60, colors:['#6a6288', '#3a3256', '#17122a'] },
  { id:'oro',       kind:'shell', name:'Oro',       price: 80, colors:['#fff1a8', '#f2c041', '#c27c12'] },

  /* screen: fondo, brillo del fondo, color de lo encendido (r,g,b) y borde. */
  { id:'verde',  kind:'screen', name:'Verde',   price:  0, lcd:['#0e1b12', '#1a3320', '200,242,194', '#0a1109'] },
  { id:'ambar',  kind:'screen', name:'Ámbar',   price: 45, lcd:['#1c1206', '#3a2608', '255,204,128', '#120b03'] },
  { id:'azul',   kind:'screen', name:'Hielo',   price: 45, lcd:['#0a1424', '#142a4a', '170,215,255', '#060c16'] },
  { id:'malva',  kind:'screen', name:'Malva',   price: 45, lcd:['#1d0f24', '#3a1a48', '255,190,235', '#12081a'] },
  { id:'retro',  kind:'screen', name:'Retro',   price: 70, lcd:['#8bac0f', '#a4c41a', '15,56,15',    '#306230'] },

  { id:'flor',     kind:'hat', name:'Flor',     emoji:'🌸', price: 15 },
  { id:'mono',     kind:'hat', name:'Moño',     emoji:'🎀', price: 20 },
  { id:'jockey',   kind:'hat', name:'Jockey',   emoji:'🧢', price: 25 },
  { id:'copa',     kind:'hat', name:'Galera',   emoji:'🎩', price: 35 },
  { id:'birrete',  kind:'hat', name:'Birrete',  emoji:'🎓', price: 40 },
  { id:'corona',   kind:'hat', name:'Corona',   emoji:'👑', price: 60 },

  { id:'cuadro',   kind:'deco', slot:'pared', name:'Cuadro',    emoji:'🖼️', price: 20 },
  { id:'reloj',    kind:'deco', slot:'pared', name:'Reloj',     emoji:'🕰️', price: 25 },
  { id:'arcoiris', kind:'deco', slot:'pared', name:'Arcoíris',  emoji:'🌈', price: 35 },
  { id:'cactus',   kind:'deco', slot:'izq',   name:'Cactus',    emoji:'🌵', price: 15 },
  { id:'tulipan',  kind:'deco', slot:'izq',   name:'Tulipanes', emoji:'🌷', price: 20 },
  { id:'arbolito', kind:'deco', slot:'izq',   name:'Arbolito',  emoji:'🎄', price: 35 },
  { id:'radio',    kind:'deco', slot:'der',   name:'Radio',     emoji:'📻', price: 20 },
  { id:'peluche',  kind:'deco', slot:'der',   name:'Peluche',   emoji:'🧸', price: 25 },
  { id:'trofeo',   kind:'deco', slot:'der',   name:'Trofeo',    emoji:'🏆', price: 40 },
];

const STYLE_SECTIONS = [
  { kind:'furni',  title:'Objetos mágicos ✨', wow: true },   // objetos.js
  { kind:'furni',  title:'Muebles' },
  { kind:'shell',  title:'Carcasa' },
  { kind:'screen', title:'Pantalla' },
  { kind:'hat',    title:'Accesorios' },
  { kind:'deco',   title:'Decoración' },
];
const DECO_SLOT_NAMES = { pared:'pared', izq:'suelo izq.', der:'suelo der.' };

function styleItemById(id){ return STYLE_ITEMS.find(it => it.id === id); }

/* Habitaciones: la primera viene con la mascota y se pueden comprar más
   (pestaña Mejoras), hasta ROOM_MAX. Cada una tiene sus propios muebles y
   adornos; carcasa, pantalla y accesorio son del aparato y de la mascota, no
   de la pieza. Un mueble o adorno está en UNA habitación a la vez: ponerlo
   en otra lo cambia de lugar. Se cambia de habitación con las flechas de los
   costados de la pantalla (goRoom, muebles.js). */
const ROOM_MAX = 4;
const ROOM_PRICES = [0, 150, 250, 400];

function freshRoom(){
  return { deco: { pared:null, izq:null, der:null },
    furniture: [] };   // muebles puestos: [{ id, x }], x = centro como fracción del piso
}

function freshStyle(){
  const owned = {};
  for (const it of STYLE_ITEMS) if (it.price === 0) owned[it.id] = true;
  return { owned, shell:'rosa', screen:'verde', hat:null, rooms:[freshRoom()], room:0 };
}

/* La habitación que se está viendo. */
function curRoom(){
  const st = state.style;
  return st.rooms[st.room] || st.rooms[0];
}

/* En qué habitación está puesto un mueble o adorno (-1 si en ninguna). */
function roomOf(it){
  return state.style.rooms.findIndex(r => it.kind === 'furni'
    ? r.furniture.some(f => f.id === it.id) : r.deco[it.slot] === it.id);
}

function isStyleEquipped(it){
  const st = state.style;
  if (it.kind === 'shell') return st.shell === it.id;
  if (it.kind === 'screen') return st.screen === it.id;
  if (it.kind === 'hat') return st.hat === it.id;
  return roomOf(it) === st.room;
}

/* Carcasa y pantalla no se pueden sacar (siempre hay una); accesorio, adorno
   y mueble sí: tocar el que ya está puesto lo saca. Un mueble nuevo va al
   lugar libre del piso más cerca del centro (findFurniSpot). Devuelve true si
   se pudo, o el aviso de por qué no (ya hay FURNI_MAX, o no cabe). */
/* Si está en otra habitación, se trae a esta (y se saca de aquella). */
function toggleStyleItem(it){
  const st = state.style;
  const room = curRoom();
  if (it.kind === 'shell') st.shell = it.id;
  else if (it.kind === 'screen') st.screen = it.id;
  else if (it.kind === 'hat') st.hat = st.hat === it.id ? null : it.id;
  else if (it.kind === 'furni'){
    const i = room.furniture.findIndex(f => f.id === it.id);
    if (i >= 0){ room.furniture.splice(i, 1); return true; }
    if (room.furniture.length >= FURNI_MAX) return `Ya hay ${FURNI_MAX} muebles en esta habitación: toca uno de los puestos para sacarlo`;
    const x = findFurniSpot(it.id, 0.5, true) ?? findFurniSpot(it.id, 0.5);
    if (x === null) return 'No cabe en el piso: acomoda los muebles o saca uno';
    const otra = roomOf(it);
    if (otra >= 0){ const r = st.rooms[otra]; r.furniture = r.furniture.filter(f => f.id !== it.id); }
    room.furniture.push({ id: it.id, x });
  }
  else {
    if (room.deco[it.slot] === it.id){ room.deco[it.slot] = null; return true; }
    const otra = roomOf(it);
    if (otra >= 0) st.rooms[otra].deco[it.slot] = null;
    room.deco[it.slot] = it.id;
  }
  return true;
}

/* ===================== Estado del juego ===================== */

const SAVE_KEY = 'mimogoshi.save.v2';
const TICK_MS = 4000;
const MS_PER_GAME_HOUR = 60000;  // 1 minuto real = 1 hora de juego (60 h de juego por hora real)
const EGG_HOURS = 0.1;         // horas de juego que dura el huevo (~6 s reales)
/* Niño → adolescente → adulto son horas de JUEGO (60 por hora real, ver
   MS_PER_GAME_HOUR): 1 día real de niño, y 3 días reales más de adolescente
   antes de llegar a adulto (4 días reales en total). Un pet ya establecido
   casi siempre tiene ageHours muy por encima de esto, así que stageFor() lo
   manda directo a 'adult' — la escalera solo se nota en una mascota recién
   nacida. */
const CHILD_HOURS = 24 * 60;         // 1 día real
const TEEN_HOURS = 4 * 24 * 60;      // 4 días reales en total (3 más de adolescente)
/* Único cambio entre etapas: el tamaño. Mismo sprite, mismas animaciones.
   Antes eran escalas enteras de píxel CSS (32 / 64 / 96px): el recién nacido
   salía diminuto, el adulto llenaba la pieza y el salto entre etapas era
   brusco. Ahora el canvas de la mascota se dibuja en píxeles FÍSICOS
   (devicePixelRatio) y la escala entera se elige ahí: un píxel del arte sigue
   ocupando siempre el mismo número entero de píxeles de la pantalla —la regla
   de oro—, pero hay muchos más tamaños posibles. Estos son los objetivos en
   px CSS; stageDeviceScale() redondea al entero de píxeles físicos más
   cercano. En un teléfono 3x da 53 / 64 / 75px; en uno 2x, 48 / 64 / 80. */
const STAGE_CSS_PX = { child: 50, teen: 64, adult: 78 };

/* Hambre por etapa: la panza crece y come más. state.hunger se sigue
   guardando en % (los anillos, los umbrales y los avisos no cambian); lo que
   cambia es cuánto % llena cada comida (sus puntos sobre la panza) y cuánto %
   baja por hora (los puntos por hora real sobre la panza). La comida cuesta
   en puntos, así que alimentar a un adulto cuesta ~4 veces lo que a un niño:
   la idea es que el gasto crezca junto con lo que se gana (más juegos, más
   niveles, más desafíos diarios). Calibrado contra una simulación de la
   economía para que la comida se lleve ~35% de lo que gana alguien que juega
   10 partidas al día de niño. Mientras más grande, menos aguanta: de lleno a
   vacío dura 7 h de niño, 6 h de adolescente y 5 h de adulto (horas reales,
   medido contra applyDecay(): cuenta el x1.5 de DISTRESS_MULT bajo el 20%,
   por eso el ritmo es 0.933 * panza / horas). El huevo cuenta como niño. Al
   crecer se mantiene el %: crecer no le da hambre de golpe. */
const HUNGER_CAP = { child: 70, teen: 110, adult: 180 };
const HUNGER_PER_REAL_HOUR = { child: 9.33, teen: 17.1, adult: 33.6 };
function hungerStage(){
  const st = state && state.stage;
  return HUNGER_CAP[st] ? st : 'child';
}
function hungerCap(){ return HUNGER_CAP[hungerStage()]; }
/* % de la barra que baja por hora de juego (60 por hora real). */
function hungerDecayPerHour(){
  const st = hungerStage();
  return HUNGER_PER_REAL_HOUR[st] / 60 / HUNGER_CAP[st] * 100;
}
/* % de la barra que llena una comida en la etapa de ahora. */
function hungerFillPct(food){
  return food.fill ? 100 : food.restore / hungerCap() * 100;
}
const DPR = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

function stageDeviceScale(stage){
  return Math.max(1, Math.round((STAGE_CSS_PX[stage] || STAGE_CSS_PX.adult) * DPR / 32));
}
/* Sueño y energía, de abajo hacia arriba:
   - bajo ENERGY_LOCK_AT se desploma: se duerme en el acto (aunque esté
     despierta) y nada la despierta hasta que recupere un poco;
   - bajo EXHAUSTED_AT está agotada: se la puede despertar, pero mientras
     siga despierta pierde salud (EXHAUSTED_LOSS_PER_DAY) y se la ve triste;
   - bajo SLEEPY_THRESHOLD puede quedarse dormida sola, con más probabilidad
     mientras menos energía le quede;
   - con WAKE_AT se despierta sola.
   Antes el candado era 25 y el sueño empezaba en 35: con barras de 0 a 100
   se pasaba mucho rato dormida sin poder hacer nada. Ahora el candado es
   corto (de 0 a 7 se recupera en ~4 min reales) y lo que hay entre medio
   es una decisión: despertarla cuesta salud. */
const ENERGY_LOCK_AT = 7;
const EXHAUSTED_AT = 15;
const SLEEPY_THRESHOLD = 20;
const WAKE_AT = 90;
/* Después de despertarla a mano no se vuelve a dormir sola por un rato: si
   no, se la despertaba para jugar y se dormía en el menú. */
const WAKE_GRACE_MS = 90 * 1000;
/* Mínimo para lanzar un minijuego (antes 12). Jugar cansada puede dejarla
   bajo ENERGY_LOCK_AT, y ahí se desploma al terminar. */
const GAME_MIN_ENERGY = 10;
let wokeUpAt = 0;   // Date.now() de la última vez que se la despertó a mano

function isExhausted(){ return !state.sleeping && state.energy < EXHAUSTED_AT; }

/* Desgaste en puntos por hora de juego. Van escritos como 100 / <horas de juego>
   para que se lea directo cuánto tarda cada barra en vaciarse entera; con
   MS_PER_GAME_HOUR = 60000, una hora real son 60 horas de juego.

   Todos los ritmos de esta sección (decaimiento, probabilidad de caca,
   probabilidad de enfermarse) están escalados por el mismo factor (~3.54x)
   respecto de sus valores "naturales", para que la mascota totalmente
   descuidada (sin comer/limpiar/jugar, fuera del horario nocturno) muera en
   una mediana de ~12 horas reales en vez de ~3.4 — manteniendo intactas las
   proporciones entre barras y entre causas: la que antes tardaba el doble en
   vaciarse sigue tardando el doble ahora. Los umbrales (DISTRESS_AT,
   HEALTH_RISK_AT, SICK_LOW_HEALTH_AT, DISTRESS_MULT) NO se tocan: son valores
   de barra, no de tiempo, y no necesitan escalarse para que la proporción se
   mantenga. */
/* Hambre, felicidad e higiene van al doble de rápido que esa calibración
   (pedido explícito: que haya que atenderla más seguido). La salud ya no
   sigue este escalado: sus ritmos van en números redondos por hora o por
   día real (ver HEALTH_RISK_LOSS_PER_REAL_HOUR). Ver CLAUDE.md para el
   tiempo hasta la muerte que da esta combinación. */
const DECAY_PER_HOUR = {
  /* El hambre ya no va acá: depende de la etapa (hungerDecayPerHour(), junto
     a HUNGER_CAP). Antes era 100 / 424.5 para todas, 7.1 horas reales. */
  happiness: 100 / 530.5,  // 530.5 h de juego ≈ 8.8 horas reales (antes 1061)
  energy:    100 / 3395,   // 3395 h de juego ≈ 56.6 horas reales
  hygiene:   100 / 212,    // 212 h de juego ≈ 3.5 horas reales, pero solo si hay caca (antes 424)
};
const ENERGY_RECOVER_PER_HOUR = 100 / 45;   // durmiendo: barra entera en 45 min reales (45 h de juego); con cama, 30 min

/* Probabilidad de que aparezca caca, por hora de juego. Antes daba mediana a
   la hora real; escalada al mismo ~3.54x da mediana a las ~3.5 horas reales
   (no compuesta como sickChance() porque nunca hace falta más de un evento —
   una vez que hay caca, state.poop ya no vuelve a tirar el dado). */
const POOP_CHANCE_PER_HOUR = 0.00325;

/* Regalo al azar: mismo modelo de dado que la caca (un solo Math.random() por
   `hours` de juego transcurridas, sin componer), calibrado para mediana ~12
   horas reales. No compite con la caca por atención: no toca higiene ni nada
   más, es puro extra. Verificado por simulación contra el mismo tick real
   (TICK_MS/MS_PER_GAME_HOUR): mediana ~12h. */
const GIFT_CHANCE_PER_HOUR = 0.00096;

/* Bajo estos valores la barra entra en "apuro" y se vacía más rápido — el bajón
   se acelera solo cuando ya va mal. Son valores de barra (0-100), no de
   tiempo: no se escalan con el resto. */
const DISTRESS_AT = { hunger: 20, happiness: 20, hygiene: 20, energy: 10 };
const DISTRESS_MULT = 1.5;

/* La salud tiene tres causas de daño independientes que se suman: que alguna
   de las otras barras esté bajo HEALTH_RISK_AT (cuenta una vez aunque sean
   varias), estar enferma y estar agotada y despierta. Van en números
   redondos de tiempo REAL (pedido así); applyDecay() los pasa a horas de
   juego. Antes cada causa costaba ~5.7 por hora real (100 / 1060 por hora
   de juego) y la agotada el triple, ~17 por hora. De noche bajan a la
   mitad, como todo lo que decae. */
const HEALTH_RISK_AT = 30;
const HEALTH_RISK_LOSS_PER_REAL_HOUR = 1;   // hambre, felicidad o higiene bajo HEALTH_RISK_AT
const SICK_LOSS_PER_REAL_HOUR = 1;          // enferma
const EXHAUSTED_LOSS_PER_DAY = 5;           // agotada (energía bajo EXHAUSTED_AT) y despierta
/* Sin ninguna causa activa se recupera sola, despacio: 15 por día real
   (antes 0.424 por hora de juego, ~25 por hora real: cualquier susto se
   borraba en un rato). Así lo que se pierde cuesta recuperarlo, y la
   medicina y la vacuna pesan. */
const HEALTH_RECOVER_PER_DAY = 15;
const HEALTH_RECOVER_PER_HOUR = HEALTH_RECOVER_PER_DAY / (24 * 60);   // por hora de juego

/* Probabilidad de enfermarse, por hora de juego. */
const SICK_CHANCE_PER_HOUR = 0.000566;
const SICK_CHANCE_PER_HOUR_LOW = 0.00283;
const SICK_LOW_HEALTH_AT = 60;

/* Modo nocturno: de 00:00 a 06:00 hora REAL del dispositivo (no de juego —
   es "de noche" para quien está jugando, no para la mascota), todo decae
   50% más lento y la mascota tiende a estar dormida ~75% del tiempo.
   catchUp() simula la ausencia de a un tick y con la hora de cada paso
   (simNowMs), así un tramo de noche con la app cerrada también cuenta como
   noche. */
const NIGHT_START_HOUR = 0;
const NIGHT_END_HOUR = 6;
const NIGHT_DECAY_FACTOR = 0.5;
/* Por tick (TICK_MS), no por hora: maybeAutoSleep() ya se llama una vez por
   tick sin escalar por horas, igual que su rama diurna de abajo. La
   proporción 3:1 (entra:sale) da una fracción de tiempo dormida de
   enter/(enter+exit) = 0.75 en el largo plazo. */
const NIGHT_SLEEP_ENTER_CHANCE = 0.03;
const NIGHT_SLEEP_EXIT_CHANCE = 0.01;

/* El panel de prueba puede forzar día (false) o noche (true) para ver cómo
   se ve sin esperar a medianoche; null = la hora real. */
let debugForcedNight = null;

/* Mientras catchUp() simula el tiempo que la app estuvo cerrada, la hora de
   cada paso (así un tramo de noche adentro de la ausencia se trata como
   noche); null = la hora de verdad. */
let simNowMs = null;

function isNightMode(){
  if (debugForcedNight !== null) return debugForcedNight;
  const h = new Date(simNowMs ?? (Date.now() + debugClockOffsetMs)).getHours();
  return h >= NIGHT_START_HOUR && h < NIGHT_END_HOUR;
}

let state = null;
let tickTimer = null;
let animFrame = null;
let gameOver = false;
let activeMinigame = null; // null o el id del minijuego en curso ('stars', 'torre', ...)

/* Modo prueba: no se guarda, vive solo en memoria de la sesión */
let debugMode = false;
let debugForcedStage = null;   // null = usar la etapa real de la mascota
let debugForcedMood = null;    // null = usar el ánimo calculado normalmente
let debugForcedSpecies = null; // null = usar la especie real de la mascota

/* El huevo (lo único procedural, `drawEgg()`) y una escalera de tamaños una
   vez que nace. Los spritesheets son un solo diseño por especie —no hay arte
   distinto por edad—, así que niño/adolescente/adulto usan exactamente el
   mismo sprite y solo cambian de tamaño (ver STAGE_CSS_PX). */
const ALL_STAGES = ['egg','child','teen','adult'];
const ALL_MOODS = ['normal','happy','sad','sick','sleepy','dead'];

function displayStage(){ return debugForcedStage || state.stage; }
function displayMood(){ return debugForcedMood || currentMood(); }

/* y: altura en px CSS sobre el piso (subido a un mueble). activity/anim: la
   rutina con un mueble en curso (ver "Muebles"). */
const walker = { isMain: true, key: 'main', hidden: false,
  x: 0.5, targetX: 0.5, dir: 1, pauseUntil: 0, frame: 0, lastFrameSwitch: 0,
  y: 0, activity: null, anim: null, animT0: 0, nextVisitAt: 0 };

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
    gift: false,
    stage: 'egg',
    selectedFood: 'simple',
    coins: 0,
    pantry: { simple: FOOD_START_STOCK, [MEDICINE.id]: MED_START_STOCK },  // porciones en la mochila
    objData: {},         // lo que guardan los objetos mágicos (objetos.js): fruta, fotos, el frijol...
    vaccinated: {},      // { child, teen, adult }: qué vacunas tiene puestas
    records: {},   // mejor puntaje por minijuego
    upgrades: freshUpgrades(),
    unlockedGames: [],   // los gratis (price 0) no hace falta anotarlos
    mega: freshMega(),
    gameXp: {},          // experiencia acumulada por juego
    gameLevelPick: {},   // nivel elegido en el menú por juego
    style: freshStyle(), // carcasa, pantalla, accesorio y adornos (pestaña Estilo)
    companion: null,     // segundo personaje en pantalla (hijo o visita), ver duo.js
    log: [],             // bitácora: lo que pasó solo (ver logEvent)
    wheel: { last: null, angle: 0 },   // ruleta (premios.js): último giro y dónde quedó la rueda
    gachaTickets: 0,     // fichas de la ruleta para el gacha
    wheelTickets: 0,     // tickets de ruleta: giros extra, aparte del gratis (premios.js)
  };
}

function freshUpgrades(){
  const u = {};
  for (const up of UPGRADES) u[up.id] = up.armable ? { owned:false, armed:false, timesUsed:0 } : { owned:false };
  return u;
}

function loadState(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s !== 'object') return null;
    if (!s.selectedFood) s.selectedFood = 'simple';
    if (typeof s.coins !== 'number' || !isFinite(s.coins)) s.coins = 0;   // saves anteriores al dinero
    if (!s.pantry || typeof s.pantry !== 'object') s.pantry = {};
    // saves de antes de que el bocadillo simple se gastara: sin esto quedarían en 0 de golpe
    if (s.pantry.simple === undefined) s.pantry.simple = FOOD_START_STOCK;
    // saves de cuando la medicina era un botón gratis: arrancan con lo mismo que una partida nueva
    if (s.pantry[MEDICINE.id] === undefined) s.pantry[MEDICINE.id] = MED_START_STOCK;
    // saves de antes de las vacunas: tope entero y ninguna puesta
    delete s.healthMax;   // el tope de salud de la primera versión de las vacunas (ver VACCINES)
    if (!s.vaccinated || typeof s.vaccinated !== 'object') s.vaccinated = {};
    /* Las vacunas se guardaban en la despensa y se ponían desde Comer; ahora
       se ponen al comprarlas. La de su etapa que estaba guardada se pone, y
       las que ya no le sirven se devuelven en monedas. */
    for (const [stage, v] of Object.entries(VACCINES)){
      let n = Math.max(0, Math.floor(Number(s.pantry[v.id]) || 0));
      if (n > 0 && stage === s.stage && !s.vaccinated[stage]){ s.vaccinated[stage] = true; n--; }
      if (n > 0) s.coins = (Number(s.coins) || 0) + n * v.price;
      delete s.pantry[v.id];
    }
    if (!s.objData || typeof s.objData !== 'object') s.objData = {};   // objetos.js
    // se cerró la app mientras iba a comer: lo que faltaba se suma de una
    if (s.meal){
      s.hunger = clamp((s.hunger || 0) + (s.meal.hunger || 0));
      s.energy = clamp((s.energy || 0) + (s.meal.energy || 0));
      delete s.meal;
    }
    delete s.unlockedFoods;  // el modelo viejo era desbloqueo permanente; ahora son porciones
    if (!s.species || !SPECIES[s.species]) s.species = DEFAULT_SPECIES; // saves de especies que ya no existen
    if (!s.records || typeof s.records !== 'object') s.records = {};    // saves anteriores a los récords
    // saves de antes del desbloqueo con monedas: quedan abiertos los juegos que
    // ya se jugaron (tienen récord), para no quitarle a nadie algo que ya usaba
    if (!Array.isArray(s.unlockedGames)){
      s.unlockedGames = GAMES.filter(g => g.price > 0 && s.records[g.id] > 0).map(g => g.id);
    }
    if (!s.gameXp || typeof s.gameXp !== 'object') s.gameXp = {};               // saves anteriores a los niveles
    if (!s.gameLevelPick || typeof s.gameLevelPick !== 'object') s.gameLevelPick = {};
    /* Juegos que se sacaron (Snake y Tap rítmico): lo pagado pasa al juego
       que ocupó su lugar en el menú, y sus récords, xp y Megajuego se borran. */
    for (const [viejo, nuevo] of Object.entries(REMOVED_GAMES)){
      if (s.unlockedGames.includes(viejo)) s.unlockedGames = s.unlockedGames.filter(id => id !== viejo).concat(nuevo);
      for (const tabla of [s.records, s.gameXp, s.gameLevelPick, s.mega && s.mega.played]){
        if (!tabla) continue;
        for (const k of Object.keys(tabla)) if (k === viejo || k.startsWith(viejo + ':')) delete tabla[k];
      }
    }
    s.unlockedGames = [...new Set(s.unlockedGames)].filter(id => gameById(id));
    if (!s.mega || typeof s.mega !== 'object' || !s.mega.played) s.mega = freshMega();
    // saves de antes de las mejoras, o de después de sumar una mejora nueva
    if (!s.upgrades || typeof s.upgrades !== 'object') s.upgrades = {};
    for (const up of UPGRADES){
      if (!s.upgrades[up.id]) s.upgrades[up.id] = up.armable ? { owned:false, armed:false, timesUsed:0 } : { owned:false };
    }
    // saves de antes de la pestaña Estilo, o con algo que ya no está en el catálogo
    const base = freshStyle();
    if (!s.style || typeof s.style !== 'object') s.style = base;
    if (!s.style.owned || typeof s.style.owned !== 'object') s.style.owned = {};
    Object.assign(s.style.owned, base.owned);
    const vale = (id, kind) => { const it = styleItemById(id); return it && it.kind === kind && s.style.owned[id]; };
    if (!vale(s.style.shell, 'shell')) s.style.shell = base.shell;
    if (!vale(s.style.screen, 'screen')) s.style.screen = base.screen;
    if (s.style.hat && !vale(s.style.hat, 'hat')) s.style.hat = null;
    /* Saves de antes de las habitaciones: los muebles y adornos que tenía
       pasan a ser los de la primera. */
    if (!Array.isArray(s.style.rooms) || !s.style.rooms.length){
      s.style.rooms = [{ deco: s.style.deco, furniture: s.style.furniture }];
    }
    delete s.style.deco;
    delete s.style.furniture;
    s.style.rooms = s.style.rooms.slice(0, ROOM_MAX).map(r => (r && typeof r === 'object') ? r : freshRoom());
    if (!Number.isInteger(s.style.room) || s.style.room < 0 || s.style.room >= s.style.rooms.length) s.style.room = 0;
    /* Cada mueble y adorno, en una sola habitación (el primero que aparece). */
    const vistos = new Set();
    for (const room of s.style.rooms){
      if (!room.deco || typeof room.deco !== 'object') room.deco = freshRoom().deco;
      for (const slot of Object.keys(freshRoom().deco)){
        const id = room.deco[slot];
        if (!id || !vale(id, 'deco') || styleItemById(id).slot !== slot || vistos.has(id)) room.deco[slot] = null;
        else vistos.add(id);
      }
      /* Antes los muebles iban en tres lugares fijos ({izq, centro, der});
         ahora cada uno guarda su posición libre. Los de antes quedan donde
         estaban. */
      let muebles = room.furniture;
      if (muebles && !Array.isArray(muebles) && typeof muebles === 'object'){
        muebles = Object.entries(LEGACY_FURNI_SLOTS).filter(([slot]) => muebles[slot]).map(([slot, x]) => ({ id: muebles[slot], x }));
      }
      if (!Array.isArray(muebles)) muebles = [];
      room.furniture = muebles.filter(f => f && vale(f.id, 'furni') && FURNI_ART[f.id] && !vistos.has(f.id) && vistos.add(f.id))
        .slice(0, FURNI_MAX)
        .map(f => ({ id: f.id, x: (typeof f.x === 'number' && isFinite(f.x)) ? Math.min(0.95, Math.max(0.05, f.x)) : 0.5 }));
    }
    // acompañante: de antes no existía; uno con especie o etapa que ya no existen se descarta
    if (!s.companion || typeof s.companion !== 'object' || !SPECIES[s.companion.species]) s.companion = null;
    else {
      if (!['child', 'teen', 'adult'].includes(s.companion.stage)) s.companion.stage = 'child';
      if (typeof s.companion.name !== 'string' || !s.companion.name) s.companion.name = SPECIES_RAW[s.companion.species].name;
    }
    if (!Array.isArray(s.log)) s.log = [];   // saves de antes de la bitácora
    // ruleta y gacha (premios.js): de antes no existían
    if (!s.wheel || typeof s.wheel !== 'object') s.wheel = { last: null, angle: 0 };
    if (typeof s.gachaTickets !== 'number' || !isFinite(s.gachaTickets)) s.gachaTickets = 0;
    if (typeof s.wheelTickets !== 'number' || !isFinite(s.wheelTickets)) s.wheelTickets = 0;
    // saves con 'grown' (antes de la escalera de tamaños) o con una etapa fantasma
    if (!ALL_STAGES.includes(s.stage)) s.stage = 'adult';
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

/* Borrar el save también va en try/catch: en un visor que bloquea
   localStorage, "Reiniciar" tiraba un error y no hacía nada. */
function clearSave(){
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* bloqueado: se recarga igual */ }
}

function clamp(v, min=0, max=100){ return Math.max(min, Math.min(max, v)); }

/* ===================== Simulación ===================== */

function stageFor(ageHours){
  if (ageHours < EGG_HOURS) return 'egg';
  if (ageHours < CHILD_HOURS) return 'child';
  if (ageHours < TEEN_HOURS) return 'teen';
  return 'adult';
}

/* Velocidad a la que baja una barra, ya con el castigo por estar en apuro. */
function decayRate(stat, value){
  const base = stat === 'hunger' ? hungerDecayPerHour() : DECAY_PER_HOUR[stat];
  const umbral = DISTRESS_AT[stat];
  return (umbral !== undefined && value < umbral) ? base * DISTRESS_MULT : base;
}

/* Probabilidad de enfermarse en un lapso de `hours` horas de juego.
   Se compone en vez de multiplicar: catchUp() puede entregar 72 horas de una,
   y 72 * 0.1 daría 7.2 — o sea "seguro", además de ser una probabilidad > 1.
   Compuesta, el resultado siempre queda entre 0 y 1 y respeta la tasa por hora. */
function sickChance(hours){
  let porHora = state.health < SICK_LOW_HEALTH_AT ? SICK_CHANCE_PER_HOUR_LOW : SICK_CHANCE_PER_HOUR;
  if (isVaccinated()) porHora *= VACCINE_SICK_MULT;
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
  /* Solo frena el decaimiento (la mitad de lento), no la recuperación —
     dormir de noche ya recupera energía a su ritmo normal. */
  const nightFactor = isNightMode() ? NIGHT_DECAY_FACTOR : 1;
  state.hunger   = clamp(state.hunger   - hours * decayRate('hunger',    state.hunger)    * sleepFactor * nightFactor);
  state.happiness= clamp(state.happiness- hours * decayRate('happiness', state.happiness) * sleepFactor * nightFactor);
  /* Con cama puesta recupera un poco más rápido (ver "Muebles"). Se mira el
     save y no si está acostada en este momento: así vale igual en catchUp(). */
  /* La cama cuenta esté en la habitación que esté: es su casa. */
  const bedMult = state.style && Array.isArray(state.style.rooms) &&
    state.style.rooms.some(r => r.furniture.some(f => f.id === 'cama')) ? FURNI_BED_ENERGY_MULT : 1;
  state.energy   = clamp(state.energy   + (state.sleeping
    ? hours * ENERGY_RECOVER_PER_HOUR * bedMult
    : -hours * decayRate('energy', state.energy) * nightFactor));

  if (!state.poop && Math.random() < hours * POOP_CHANCE_PER_HOUR){
    state.poop = true;
    /* El seguro de limpieza actúa en el mismo instante en que aparece la caca,
       sea con la app abierta o en un catchUp de vuelta: el juego nunca trata
       "estar mirando" como un estado distinto en ningún otro lado, así que
       tampoco acá. */
    const seguro = upgradeState('autoClean');
    if (seguro.owned && seguro.armed){
      state.poop = false;
      state.hygiene = clamp(state.hygiene + 35);   // mismo efecto que btnClean
      seguro.armed = false;
      seguro.timesUsed = (seguro.timesUsed || 0) + 1;
    }
  }
  /* La higiene NO baja sola: solo se ensucia mientras haya caca sin limpiar. Así
     limpiar deja de ser un trámite periódico y pasa a ser la respuesta a algo
     que el jugador ve en pantalla. */
  if (state.poop) state.hygiene = clamp(state.hygiene - hours * decayRate('hygiene', state.hygiene) * nightFactor);

  if (!state.gift && Math.random() < hours * GIFT_CHANCE_PER_HOUR) state.gift = true;

  /* Salud: las causas se suman, y solo se recupera si no hay ninguna. La
     energía no cuenta como las otras barras (bajo HEALTH_RISK_AT): dormida
     se está recuperando y no tiene por qué costar salud; lo que cuesta es
     tenerla despierta estando agotada, y cuesta más (ver EXHAUSTED_AT). */
  const enRiesgo = state.hunger    < HEALTH_RISK_AT || state.happiness < HEALTH_RISK_AT ||
                   state.hygiene   < HEALTH_RISK_AT;
  let healthDelta = 0;
  if (enRiesgo)   healthDelta -= HEALTH_RISK_LOSS_PER_REAL_HOUR / 60 * nightFactor;
  if (state.sick) healthDelta -= SICK_LOSS_PER_REAL_HOUR / 60 * nightFactor;
  if (isExhausted()) healthDelta -= EXHAUSTED_LOSS_PER_DAY / (24 * 60) * nightFactor;
  if (healthDelta === 0) healthDelta = HEALTH_RECOVER_PER_HOUR;
  /* Sin la vacuna de su etapa pierde siempre lo suyo, aparte de las causas
     y sin frenarse de noche: así cuidada queda justo en 15 − 20 = −5 al día
     (ver VACCINES). El huevo no necesita vacuna. */
  if (vaccineFor() && !isVaccinated()) healthDelta -= VACCINE_HEALTH_LOSS_PER_DAY / (24 * 60);
  state.health = clamp(state.health + hours * healthDelta);

  if (!state.sick && Math.random() < sickChance(hours)){
    state.sick = true;
    const seguro = upgradeState('autoMed');
    if (seguro.owned && seguro.armed){
      state.sick = false;
      state.health = clamp(state.health + MED_HEALTH);   // mismo efecto que darle medicina
      seguro.armed = false;
      seguro.timesUsed = (seguro.timesUsed || 0) + 1;
    }
  }

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

/* El tiempo que pasó con la app cerrada se simula de a un tick (TICK_MS),
   igual que si hubiera estado abierta: antes se aplicaba de una sola vez y
   eso cambiaba las reglas (el riesgo para la salud se medía con las barras
   ya vaciadas, se quedaba dormida o despierta todo el rato, la noche se
   decidía con la hora de ahora). De paso, cada paso deja en la bitácora lo
   que pasó y a qué hora. Tope: tres días de juego (72 minutos reales), como
   siempre; pasado eso la mascota queda "en pausa" hasta que vuelvas. */
const CATCHUP_CAP_MS = MS_PER_GAME_HOUR * 24 * 3;

function catchUp(){
  const now = Date.now();
  const t0 = state.lastUpdate;
  const elapsedMs = Math.max(0, now - t0);
  const away = elapsedMs >= AWAY_MIN_MS;
  const cappedMs = Math.min(elapsedMs, CATCHUP_CAP_MS);
  const visita = away ? { slept: 0, n: 0 } : null;
  let done = 0;
  while (done < cappedMs && !gameOver){
    const step = Math.min(TICK_MS, cappedMs - done);
    simNowMs = t0 + done + debugClockOffsetMs;
    const antes = logSnapshot();
    applyDecay(step / MS_PER_GAME_HOUR);
    /* Con la app abierta esto lo hace tick(); cerrada, cada paso. */
    if (away && !gameOver) maybeAutoSleep();
    done += step;
    if (visita && state.sleeping) visita.slept += step;
    const n = logChanges(antes, t0 + done, away);
    if (visita) visita.n += n;
  }
  simNowMs = null;
  state.lastUpdate = now;
  if (visita) logAway(elapsedMs, visita);
}

/* Panel de prueba, TEMPORAL (se saca cuando se termine de calibrar): pasar
   el tiempo. Simula `ms` reales de a un tick, igual que catchUp() pero SIN
   su tope de 72 minutos, porque la app de teléfono va a llevar el tiempo
   completo y eso es lo que se quiere probar. Corre un reloj virtual
   (debugClockOffsetMs, que suma isNightMode()), así las noches caen donde
   corresponde aunque se adelante varias veces seguidas. No se guarda: al
   recargar vuelve la hora real. Los relojes de la ruleta y del desafío
   diario no se mueven (leen Date.now()). */
let debugClockOffsetMs = 0;
function debugSkipTime(ms){
  if (!state || gameOver) return;
  catchUp();      // primero lo que pasó de verdad
  flushMeal();    // una comida a medio comer cuenta entera
  const t0 = Date.now() + debugClockOffsetMs;
  const visita = { slept: 0, n: 0 };
  let done = 0;
  while (done < ms && !gameOver){
    const step = Math.min(TICK_MS, ms - done);
    simNowMs = t0 + done;
    const antes = logSnapshot();
    applyDecay(step / MS_PER_GAME_HOUR);
    if (!gameOver) maybeAutoSleep();
    done += step;
    if (state.sleeping) visita.slept += step;
    visita.n += logChanges(antes, t0 + done, true);
  }
  simNowMs = null;
  debugClockOffsetMs += done;
  state.lastUpdate = Date.now();
  logAway(done, visita);
  saveState(); render();
}

/* Bajo ENERGY_LOCK_AT se duerme en el acto, de día o de noche. */
function collapseIfDrained(){
  if (state.sleeping || gameOver || state.stage === 'egg' || state.energy >= ENERGY_LOCK_AT) return false;
  state.sleeping = true;
  return true;
}

function maybeAutoSleep(){
  if (gameOver || state.stage === 'egg') return;
  if (collapseIfDrained()) return;
  /* Con el candado puesto no se despierta sola tampoco de noche. */
  if (state.sleeping && state.energy < ENERGY_LOCK_AT) return;
  const recienDespierta = !state.sleeping && Date.now() - wokeUpAt < WAKE_GRACE_MS;
  /* De noche el sueño no depende de la energía: es una tendencia horaria
     aparte, con su propia probabilidad de entrar y salir (ver
     NIGHT_SLEEP_ENTER_CHANCE / NIGHT_SLEEP_EXIT_CHANCE más arriba). */
  if (isNightMode()){
    if (state.sleeping){
      if (Math.random() < NIGHT_SLEEP_EXIT_CHANCE) state.sleeping = false;
    } else if (!recienDespierta && Math.random() < NIGHT_SLEEP_ENTER_CHANCE){
      state.sleeping = true;
    }
    return;
  }
  if (state.sleeping){
    if (state.energy >= WAKE_AT) state.sleeping = false;
    return;
  }
  if (!recienDespierta && state.energy < SLEEPY_THRESHOLD){
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

/* ===================== Bitácora =====================
   Lo que pasó solo (caca, enfermarse, un regalo, que le diera hambre...),
   con la hora. Sobre todo lo que pasó con la app cerrada: al volver, el
   ícono del borde de la pantalla (#logBtn) pestañea unos segundos y nada
   más — no abre nada ni obliga a leer; quien quiera, lo toca y ve la lista.
   Lo que hace quien juega (darle de comer, dormirla) no se anota: ya lo vio. */

const LOG_MAX = 40;
const AWAY_MIN_MS = 2 * 60 * 1000;   // menos que esto no cuenta como "no estabas"
const LOG_BLINK_MS = 3600;

function logEvent(e, m, t = Date.now(), away = false){
  if (!Array.isArray(state.log)) state.log = [];
  state.log.push({ t, e, m, away });
  if (state.log.length > LOG_MAX) state.log.splice(0, state.log.length - LOG_MAX);
}

function logSnapshot(){
  return {
    poop: state.poop, sick: state.sick, gift: state.gift, stage: state.stage,
    hunger: state.hunger, happiness: state.happiness, hygiene: state.hygiene,
    energy: state.energy, health: state.health, sleeping: state.sleeping,
    clean: upgradeState('autoClean').timesUsed || 0, med: upgradeState('autoMed').timesUsed || 0,
  };
}

const LOG_LOW = [
  ['hunger',    HEALTH_RISK_AT,   '🍖', 'Le dio hambre'],
  ['happiness', HEALTH_RISK_AT,   '😞', 'Se aburrió: quiere jugar'],
  ['hygiene',   HEALTH_RISK_AT,   '🧼', 'Se ensució'],
  ['energy',    SLEEPY_THRESHOLD, '🥱', 'Se cansó'],
  ['health',    SICK_LOW_HEALTH_AT, '❤️', 'Su salud empezó a bajar'],
  ['health',    25,               '🚑', '¡Su salud está muy baja!'],
];

/* Compara antes y después de un paso y anota lo nuevo. Devuelve cuántas
   cosas anotó. Las barras se anotan al cruzar el umbral hacia abajo, una
   vez, no mientras siguen bajas. */
function logChanges(a, t, away){
  const n0 = (state.log || []).length;
  const b = logSnapshot();
  if (!a.poop && b.poop) logEvent('💩', 'Hizo caca', t, away);
  if (b.clean > a.clean) logEvent('🧹', 'El seguro de limpieza limpió la caca', t, away);
  if (!a.sick && b.sick) logEvent('🤒', 'Se enfermó', t, away);
  if (b.med > a.med) logEvent('💉', 'Se enfermó, pero el seguro médico lo resolvió', t, away);
  if (!a.gift && b.gift) logEvent('🎁', 'Apareció un regalo', t, away);
  if (ALL_STAGES.indexOf(b.stage) > ALL_STAGES.indexOf(a.stage)){
    const nombres = { child: 'Nació', teen: 'Creció: ya es adolescente', adult: 'Creció: ya es adulto' };
    if (nombres[b.stage]) logEvent(b.stage === 'child' ? '🐣' : '🌱', nombres[b.stage], t, away);
    if (b.stage !== 'child' && vaccineFor(b.stage)) logEvent(VACCINE_EMOJI, `Le toca la ${vaccineFor(b.stage).name.toLowerCase()}`, t, away);
  }
  for (const [k, umbral, e, m] of LOG_LOW){
    if (a[k] >= umbral && b[k] < umbral && !(k === 'energy' && b.sleeping)) logEvent(e, m, t, away);
  }
  return Math.max(0, (state.log || []).length - n0);
}

/* Cierre de una ausencia: una línea de encabezado con cuánto faltaste (y
   cuánto durmió, que si no se anota cada vez que se duerme y se despierta
   y de noche son muchas), y el ícono pestañea si hay algo que ver. */
function logAway(ms, visita){
  const durmio = visita.slept >= 10 * 60 * 1000;
  if (!visita.n && !durmio) return;   // no pasó nada: ni encabezado ni pestañeo
  if (durmio) logEvent('😴', `Durmió ${durationLabel(visita.slept)}`, Date.now(), true);
  /* El encabezado va DESPUÉS de lo que pasó en la ausencia: la lista se
     muestra al revés (lo nuevo arriba), así queda encima de su grupo. */
  if (!Array.isArray(state.log)) state.log = [];
  state.log.push({ t: Date.now() - ms, e: '🚪', m: 'Te fuiste', away: true, head: true, ms });
  if (state.log.length > LOG_MAX) state.log.splice(0, state.log.length - LOG_MAX);
  blinkLogBtn();
}

function durationLabel(ms){
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  if (h < 24) return m ? `${h} h ${m} min` : `${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? '1 día' : `${d} días`;
}

function relTimeLabel(t){
  const ms = Date.now() - t;
  if (ms < 60000) return 'recién';
  if (ms < 24 * 3600000) return 'hace ' + durationLabel(ms).replace(/ \d+ min$/, '');
  const d = new Date(t);
  return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function blinkLogBtn(){
  const btn = document.getElementById('logBtn');
  if (!btn) return;
  btn.classList.remove('blink'); void btn.offsetWidth; btn.classList.add('blink');
  clearTimeout(blinkLogBtn._t);
  blinkLogBtn._t = setTimeout(() => btn.classList.remove('blink'), LOG_BLINK_MS);
}

function logPanelOpen(){ return !document.getElementById('logPanel').classList.contains('hidden'); }

function closeLogPanel(){ document.getElementById('logPanel').classList.add('hidden'); }

function toggleLogPanel(){
  if (logPanelOpen()){ closeLogPanel(); return; }
  renderLogPanel();
  document.getElementById('logPanel').classList.remove('hidden');
  document.getElementById('logBtn').classList.remove('blink');
}

/* Lo más nuevo arriba. Una ausencia sale como un encabezado ("Mientras no
   estabas · 8 h") con lo que pasó en ese rato debajo. */
function renderLogPanel(){
  const log = (state.log || []).slice().reverse();
  const filas = log.map(ev => ev.head
    ? `<li class="log-head"><b>Mientras no estabas</b><small>${durationLabel(ev.ms)} fuera · ${relTimeLabel(ev.t)}</small></li>`
    : `<li class="${ev.away ? 'away' : ''}"><span class="log-e">${ev.e}</span><span class="log-m">${escapeHtml(ev.m)}</span><small>${relTimeLabel(ev.t)}</small></li>`).join('');
  document.getElementById('logPanel').innerHTML = `
    <div class="log-top"><b>📜 Bitácora</b><button class="log-close" id="logClose" aria-label="Cerrar">✕</button></div>
    ${filas ? `<ul class="log-list">${filas}</ul>` : '<p class="log-empty">Todavía no pasa nada que contar.</p>'}`;
  document.getElementById('logClose').addEventListener('click', closeLogPanel);
}

function triggerGameOver(){
  gameOver = true;
  exitArrange();
  clearInterval(tickTimer);
  forceCloseMinigames();
  showOverlay(`
    <h3>💫 ${escapeHtml(state.name)} se fue a las estrellas</h3>
    <p>Vivió ${Math.floor(state.ageHours)} horas de mascota. Gracias por cuidarlo.</p>
    <button class="overlay-btn" id="btnNewEgg">Empezar de nuevo</button>
  `);
  document.getElementById('btnNewEgg').addEventListener('click', () => {
    clearSave();
    location.reload();
  });
}

/* Cierra cualquier minijuego en curso a la fuerza (ej. si la mascota muere a
   mitad de partida). Cada minijuego (juegos.js, duo-juegos.js) registra acá
   su limpieza —sacar listeners, cancelar el requestAnimationFrame y soltar
   su estado—, así esto los cubre a todos sin saber de ninguno. */
const minigameDisposers = [];

function forceCloseMinigames(){
  for (const dispose of minigameDisposers) dispose();
  activeMinigame = null;
  megaRun = null;   // una partida cortada no gasta el Megajuego
  playLevel = 1;
  document.getElementById('gameCanvas').classList.add('hidden');
  document.getElementById('creatureFloor').classList.remove('hidden');
  hideGameControls();
}

/* Devuelve true si la acción puede proceder (y despierta a la mascota si corresponde) */
function tryWake(){
  if (!state.sleeping) return true;
  if (state.energy < ENERGY_LOCK_AT){
    say('Está profundamente dormido… 💤');
    return false;
  }
  state.sleeping = false;
  wokeUpAt = Date.now();
  say(state.energy < EXHAUSTED_AT
    ? 'Se despertó, pero está agotado: despierto pierde salud'
    : '¡Buenos días!', state.energy < EXHAUSTED_AT ? 2600 : 1600);
  return true;
}

/* ===================== Mood / UI ===================== */

function currentMood(){
  if (gameOver) return 'dead';
  if (state.stage === 'egg') return 'egg';
  if (state.sleeping) return 'sleepy';
  if (state.sick) return 'sick';
  if (isExhausted()) return 'sad';   // agotada y despierta: se le nota
  if (state.hunger < 25 || state.happiness < 25 || state.hygiene < 25) return 'sad';
  if (state.happiness > 75 && state.hunger > 60) return 'happy';
  return 'normal';
}

const CARE_STATS = ['hunger', 'happiness', 'energy', 'hygiene'];

/* Los colores tienen que coincidir con lo que de verdad pasa, si no el jugador
   no puede leer el estado de un vistazo. Antes eran 55 y 25, que no correspondían
   a nada: el daño a la salud empieza en HEALTH_RISK_AT y la barra se vacía
   1.5x más rápido bajo su DISTRESS_AT (20, o 10 en energía). La salud se mide con
   su propio umbral: bajo SICK_LOW_HEALTH_AT la probabilidad de enfermarse salta
   de SICK_CHANCE_PER_HOUR a SICK_CHANCE_PER_HOUR_LOW. */
function statColor(v, stat){
  if (stat === 'health'){
    if (v < 25) return 'var(--bad)';
    if (v < SICK_LOW_HEALTH_AT) return 'var(--mid)';
    return 'var(--good)';
  }
  /* La energía tiene sus propios umbrales (ver ENERGY_LOCK_AT y compañía):
     rojo = agotada (despierta pierde salud), amarillo = ya le da sueño. */
  if (stat === 'energy'){
    if (v < EXHAUSTED_AT) return 'var(--bad)';
    if (v < SLEEPY_THRESHOLD) return 'var(--mid)';
    return 'var(--good)';
  }
  if (v < DISTRESS_AT[stat]) return 'var(--bad)';   // encima se vacía más rápido
  if (v < HEALTH_RISK_AT) return 'var(--mid)';      // ya le está costando salud
  return 'var(--good)';
}

/* El LED es el aviso a distancia, para cuando no estás mirando las barras.
   Antes ignoraba la energía, que hoy también le baja la salud. */
function updateLed(){
  const led = document.getElementById('led');
  led.className = 'led';
  const otras = CARE_STATS.filter(k => k !== 'energy');
  const enApuro  = otras.some(k => state[k] < DISTRESS_AT[k]) || isExhausted();
  const enRiesgo = otras.some(k => state[k] < HEALTH_RISK_AT) || state.energy < SLEEPY_THRESHOLD;
  if (state.sick || enApuro || state.health < 25) led.classList.add('danger');
  else if (enRiesgo) led.classList.add('warn');
}

/* ===================== Movimiento pasivo ===================== */

/* ¿Está la mascota en un estado en que no se mueve sola? (durmiendo,
   triste, enferma, haciendo una acción...). Lo usa también el acompañante
   para saber si puede invitarla a jugar. */
function mainFrozen(mood = displayMood()){
  return gameOver || displayStage() === 'egg' || state.sleeping || !!petAction ||
    mood === 'sleepy' || mood === 'dead' || mood === 'sad' || mood === 'sick';
}

function updateWalker(dt){
  if (activeMinigame || arranging) return;
  const mood = displayMood();
  const now = performance.now();
  if (walker.activity){
    if (furniActivityBroken(mood, walker)) endFurniActivity(walker);
    else { runFurniActivity(dt, now, walker); return; }
  }
  walker.anim = null;
  walker.hidden = false;
  /* Si una rutina se cortó con la mascota arriba de un mueble, cae al piso. */
  if (walker.y > 0) walker.y = Math.max(0, walker.y - dt * 260);
  if (mainFrozen(mood)){
    walker.frame = 0;
    /* Dormida y con cama puesta: va a acostarse ahí. */
    if (state.sleeping && !gameOver && mood !== 'dead' && displayStage() !== 'egg' && walker.y === 0){
      startFurniRoutine('sleep', walker);
    }
    return;
  }
  wanderActor(walker, dt, now, () =>
    (typeof maybeStartSocial === 'function' && maybeStartSocial(walker, now)) ||
    maybeStartFurniVisit(now, walker));
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
  const coinsEl = document.getElementById('petCoins');
  if (coinsEl.textContent !== String(state.coins)){
    coinsEl.textContent = state.coins;
    snapPixelIcons(document.querySelector('.topbar'));   // el largo del número corre la moneda
  }

  [...CARE_STATS, 'health'].forEach(k => {
    const v = clamp(state[k]);
    const fill = document.getElementById('fill-'+k);
    const shine = document.getElementById('shine-'+k);
    fill.style.strokeDasharray = shine.style.strokeDasharray = v + ' 100';   // pathLength=100
    fill.classList.toggle('empty', v < 1);
    shine.classList.toggle('empty', v < 1);
    /* El color del anillo es el propio de cada reloj (CSS); los umbrales de
       statColor() deciden solo si se marca como bajo. */
    fill.closest('.stat').classList.toggle('low', statColor(state[k], k) !== 'var(--good)');
    const num = document.getElementById('num-'+k);
    const txt = Math.round(v) + '%';
    if (num.textContent !== txt) num.textContent = txt;
  });
    /* Durmiendo, el reloj de energía se ve cargando (un destello que da
     vueltas): sube tan poco por tick (~0.15) que el arco solo no lo
     muestra. */
  const charging = !!state.sleeping && !gameOver && state.energy < 100;
  if (render._charging !== charging){
    render._charging = charging;
    document.querySelector('.stat[data-stat="energy"]').classList.toggle('charging', charging);
  }

  updateLed();

  /* Día o noche, a la vista: el ícono de arriba y la pantalla oscurecida con
     estrellas. Sin esto el modo nocturno existía (todo baja a la mitad y
     duerme más) pero no había cómo saberlo. */
  const night = isNightMode();
  if (render._night !== night){
    render._night = night;
    document.getElementById('screen').classList.toggle('night', night);
    const dn = document.getElementById('dayNight');
    dn.classList.toggle('is-night', night);
    dn.title = night ? 'De noche' : 'De día';
    snapPixelIcons(dn);
  }

  const canvas = document.getElementById('petCanvas');
  fitPetCanvas(canvas);
  const ctx = canvas.getContext('2d');
  const stage = displayStage();
  const drawn = drawSprite(ctx, stage, displayMood(), walker.frame, false, stageDeviceScale(stage),
    { w: canvas.width, h: canvas.height });
  canvas.style.left = (walker.x*100) + '%';
  canvas.style.bottom = (4 + walker.y) + 'px';
  canvas.style.transform = actorTransform(walker, drawn);
  canvas.style.opacity = walker.hidden ? '0' : '';
  walker.drawn = walker.hidden ? null : drawn;   // para saber si un toque cae sobre ella (muebles.js)
  updateHat(walker.drawn);
  if (typeof renderBuddy === 'function') renderBuddy();
  updateFurniture();

  /* Los botones de abajo avisan lo que hace falta (enferma, caca, sueño). */
  updateDock();
  /* Las flechas de habitación no salen mientras es huevo: al nacer aparecen. */
  const roomKey = state.style.rooms.length + ':' + state.style.room + ':' + displayStage();
  if (render._roomKey !== roomKey){ render._roomKey = roomKey; updateRoomNav(); }

  document.getElementById('poopFx').classList.toggle('hidden', !state.poop);
  document.getElementById('giftFx').classList.toggle('hidden', !state.gift);
}

/* Transform del canvas de un personaje: mira a su lado (scaleX) y, si un
   objeto lo da vuelta (el cañón, objetos.js), cabeza abajo (scaleY(-1)),
   girando sobre el centro del sprite y no del canvas: el sprite va apoyado
   abajo y, girado sobre el centro del canvas, saltaba arriba. Escalas de -1
   y 1: el pixel art no se deforma. */
function actorTransform(act, drawn){
  let t = `translateX(-50%) scaleX(${act.dir})`;
  if (act.flipY && drawn && drawn.frame){
    const k = drawn.box.h / CANVAS_H;
    const cy = (drawn.dy + drawn.frame.h * drawn.scale / 2) / k;
    t += ` translateY(${(cy - CANVAS_H / 2).toFixed(2)}px) scaleY(-1) translateY(${(CANVAS_H / 2 - cy).toFixed(2)}px)`;
  }
  return t;
}

/* El canvas de la mascota mide 96x96 px CSS (eso no cambia) pero su backing
   store va en píxeles físicos, para que stageDeviceScale() pueda elegir la
   escala entera ahí. Solo toca el tamaño si cambió (asignar width borra). */
function fitPetCanvas(canvas){
  const w = Math.round(CANVAS_W * DPR), h = Math.round(CANVAS_H * DPR);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
}

/* ===================== Íconos pixel de la pantalla =====================
   Lo que vive en la LCD es pixel art (la mascota, los muebles), y los íconos
   de los relojes y de la barra de arriba también: los emojis son de otro
   estilo (brillos, degradados) y al lado del resto desentonaban. Afuera de
   la pantalla (dock, menús) siguen los emojis: es la parte de app moderna.
   Cada ícono se escribe solo con su relleno y el contorno ('o') se agrega
   solo alrededor, así todos tienen el mismo trazo. Letras: b base, l luz,
   m sombra, w brillo, más las propias (d rasgos, p mejillas, c/e hueso).
   Los de los relojes van en los tonos de su reloj (--stat), para que ícono
   y anillo se lean como una sola pieza. */
const PX_ICONS = {
  energy: {
    pal: { o:'#2e2275', b:'#8f7bff', l:'#cdc3ff', m:'#6550e0', w:'#ffffff' },
    art: [
      '.....bbbb',
      '....lbbb.',
      '...lbbm..',
      '..lbbm...',
      '.lbbbbbbm',
      '....bbbm.',
      '...bbbm..',
      '..bbm....',
      '.bm......',
    ],
  },
  hygiene: {
    pal: { o:'#08496e', b:'#3fb8ff', l:'#b5e9ff', m:'#1f8fd0', w:'#ffffff' },
    art: [
      '....b...l',
      '...bbb...',
      '...lbb...',
      '..lbbbb..',
      '.lwbbbbm.',
      '.lbbbbbm.',
      '.bbbbbbm.',
      '..bbbbm..',
      '...bbb...',
    ],
  },
  health: {
    pal: { o:'#6e0b20', b:'#ff4d6d', l:'#ffadbb', m:'#d4284a', w:'#ffffff' },
    art: [
      '.bb...bb.',
      'bwlb.bbbm',
      'blbbbbbbm',
      'bbbbbbbbm',
      '.bbbbbbm.',
      '..bbbbm..',
      '...bbm...',
      '....m....',
    ],
  },
  happiness: {
    pal: { o:'#7a4706', b:'#ffc23d', l:'#fff1b8', m:'#e8a020', w:'#ffffff', d:'#3a2400', p:'#ff8a7a' },
    art: [
      '..bbbbb..',
      '.bwlbbbb.',
      'blbbbbbbm',
      'bbdbbbdbm',
      'bbdbbbdbm',
      'bpbbbbbpm',
      'bbdbbbdbm',
      '.mbdddbm.',
      '..mmmmm..',
    ],
  },
  hunger: {
    pal: { o:'#6b250a', b:'#ff8a4c', l:'#ffd0b0', m:'#d75f26', w:'#ffffff', c:'#fff4de', e:'#e6d3b0' },
    art: [
      '....lbbb.',
      '...lwbbbm',
      '..lbbbbbm',
      '..bbbbbbm',
      '..bbbbbm.',
      '..cbmmm..',
      '.cc......',
      'cc.......',
      'ce.......',
    ],
  },
  coin: {
    pal: { o:'#6b4000', b:'#ffc23d', l:'#fff1b8', m:'#e09a1a', w:'#ffffff' },
    art: [
      '.bbbbb.',
      'blllbbm',
      'blwbmbm',
      'blbbmbm',
      'blbbmbm',
      'bbmmmbm',
      '.mmmmm.',
    ],
  },
  sun: {
    pal: { o:'#8a4a00', b:'#ffcf3d', l:'#fff4b8', m:'#ff9a1a', w:'#ffffff' },
    art: [
      'b..b..b',
      '.b.b.b.',
      '..lbb..',
      'bblwbbb',
      '..bbm..',
      '.b.b.b.',
      'b..b..b',
    ],
  },
  log: {
    pal: { o:'#4a2c0a', b:'#d99a4a', l:'#fff1d0', m:'#a8682a', d:'#b88a5a', w:'#ffffff' },
    art: [
      '.bbbbbbb.',
      'bmmmmmmmb',
      '.lwlllll.',
      '.lddddll.',
      '.lllllll.',
      '.ldddlll.',
      '.lllllll.',
      'bmmmmmmmb',
      '.bbbbbbb.',
    ],
  },
  moon: {
    pal: { o:'#4a3f12', b:'#fff0a8', l:'#ffffff', m:'#d9c25a', w:'#ffffff' },
    art: [
      '..bbb..',
      '.lbb...',
      'lwb....',
      'lbb....',
      'bbb....',
      '.bbbbm.',
      '..mmm..',
    ],
  },
};
/* Tamaño de un píxel del arte, como objetivo en px CSS. Lo que tiene que ser
   entero son los píxeles físicos (ver "La regla de oro"), así que
   pxIconScale() lo redondea en píxeles físicos: en un teléfono 3x, 2.3 da 7
   físicos. Los de los relojes van más grandes que los de la barra de arriba;
   el de la salud iba más grande todavía y se veía tosco: queda igual que los
   otros (el reloj grande ya lo destaca). */
const PX_ICON_SCALE = { base: 2, stat: 2.3 };
function pxIconScale(target){
  const dpr = window.devicePixelRatio || 1;
  return Math.max(1, Math.round(target * dpr)) / dpr;
}

/* El arte con su contorno, como SVG en un data URI (sin archivos aparte, así
   anda también abriendo index.html con file://). */
function pxIconSvg({ pal, art }){
  const h = art.length + 2, w = art[0].length + 2;
  const at = (x, y) => (art[y - 1] && art[y - 1][x - 1]) || '.';
  let rects = '';
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    let c = at(x, y);
    if (c === '.' && [[1,0],[-1,0],[0,1],[0,-1]].some(([dx, dy]) => at(x + dx, y + dy) !== '.')) c = 'o';
    if (c !== '.') rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${pal[c]}"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects}</svg>`;
  return { w, h, uri: 'data:image/svg+xml,' + encodeURIComponent(svg) };
}

/* Una clase .px-<nombre> por ícono, con su tamaño y su dibujo (y el tamaño
   más grande dentro de los relojes). Depende de la densidad de la pantalla:
   si cambia (otro monitor, zoom), se vuelve a armar. */
let pxIconsDpr = 0;
function installPixelIcons(){
  const dpr = window.devicePixelRatio || 1;
  if (dpr === pxIconsDpr) return;
  pxIconsDpr = dpr;
  const size = (sel, w, h, k) => `${sel}{width:${w * k}px;height:${h * k}px;}\n`;
  const base = pxIconScale(PX_ICON_SCALE.base), stat = pxIconScale(PX_ICON_SCALE.stat);
  let css = '';
  for (const [name, icon] of Object.entries(PX_ICONS)){
    const { w, h, uri } = pxIconSvg(icon);
    css += `.px-${name}{background-image:url("${uri}");}\n`;
    css += size(`.px-${name}`, w, h, base);
    css += size(`.stat-icon .px-${name}`, w, h, stat);
  }
  let style = document.getElementById('pxIcons');
  if (!style){
    style = document.createElement('style');
    style.id = 'pxIcons';
    document.head.appendChild(style);
  }
  style.textContent = css;
}

/* Los íconos pixel tienen que empezar en un píxel físico, igual que todo el
   pixel art (ver "La regla de oro"): los relojes se reparten con
   space-around y la barra de arriba depende del largo del texto, así que
   caen en posiciones fraccionarias. Se corre cada uno lo que le falta para
   el píxel más cercano. */
function snapPixelIcons(root = document){
  const dpr = window.devicePixelRatio || 1;
  for (const el of root.querySelectorAll('.px-icon, .wheel-pet')){
    el.style.transform = '';
    const r = el.getBoundingClientRect();
    if (!r.width) continue;   // escondido: se calza al mostrarse
    const dx = Math.round(r.left * dpr) / dpr - r.left;
    const dy = Math.round(r.top * dpr) / dpr - r.top;
    if (dx || dy) el.style.transform = `translate(${dx}px, ${dy}px)`;
  }
}

let lastFrameT = 0;
function loopRender(t){
  const dt = Math.min(0.05, (t - (lastFrameT || t)) / 1000);
  lastFrameT = t;
  updateWalker(dt);
  digestMeal();
  if (typeof updateBuddy === 'function') updateBuddy(dt);
  render();
  animFrame = requestAnimationFrame(loopRender);
}

/* ===================== Estilo: carcasa, pantalla, adornos y accesorio ===================== */

/* Pone los colores de la carcasa y de la pantalla como variables CSS sobre
   #device y arma los adornos de la pieza. Se llama al arrancar y cada vez que
   se compra o se cambia algo en la pestaña Estilo; no en cada frame. */
function applyStyle(){
  const st = state.style;
  const device = document.getElementById('device');
  const shell = styleItemById(st.shell) || styleItemById('rosa');
  const screen = styleItemById(st.screen) || styleItemById('verde');
  ['--shell-a', '--shell-b', '--shell-c'].forEach((v, i) => device.style.setProperty(v, shell.colors[i]));
  const [bg, hi, lit, edge] = screen.lcd;
  device.style.setProperty('--screen', bg);
  device.style.setProperty('--screen-hi', hi);
  device.style.setProperty('--screen-lit-rgb', lit);
  device.style.setProperty('--screen-lit', `rgb(${lit})`);
  device.style.setProperty('--screen-edge', edge);

  const room = document.getElementById('decoLayer');
  room.innerHTML = Object.entries(curRoom().deco)
    .filter(([, id]) => id && styleItemById(id))
    .map(([slot, id]) => `<span class="deco deco-${slot}">${styleItemById(id).emoji}</span>`)
    .join('');
  renderFurniture();
  updateRoomNav();
}

/* Dónde está la cabeza dentro de cada frame (fila más alta con píxeles opacos
   y el centro de esa franja), en píxeles del arte. Se mide una vez por frame
   leyendo el spritesheet y se cachea. Abriendo el archivo con file:// el
   navegador no deja leer los píxeles (canvas "contaminado"): ahí cae a la
   parte de arriba de la celda, centrado — el accesorio queda un poco más
   alto, pero no rompe nada. */
const headCache = new Map();
const HEAD_MIN_WIDTH = 0.45;   // fracción del ancho máximo del sprite que ya cuenta como cabeza
function frameHead(species, frame){
  const key = species.id + ':' + frame.x + ',' + frame.y;
  let head = headCache.get(key);
  if (head) return head;
  head = { top: 0, cx: frame.w / 2 };
  try {
    const c = document.createElement('canvas');
    c.width = frame.w; c.height = frame.h;
    const cx = c.getContext('2d');
    cx.drawImage(species.image, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h);
    const px = cx.getImageData(0, 0, frame.w, frame.h).data;
    const opaque = (x, y) => px[(y * frame.w + x) * 4 + 3] > 0;
    /* La cabeza es la primera fila "ancha", no la primera con algo: una
       antena, un rulo o las puntas de las orejas son filas de pocos píxeles,
       y apoyar el accesorio ahí lo dejaba flotando sobre la cabeza. */
    const ancho = [];
    for (let y = 0; y < frame.h; y++){
      let n = 0;
      for (let x = 0; x < frame.w; x++) if (opaque(x, y)) n++;
      ancho.push(n);
    }
    const maxAncho = Math.max(...ancho);
    const top = ancho.findIndex(n => n > 0 && n >= maxAncho * HEAD_MIN_WIDTH);
    if (top >= 0){
      /* El centro sale de las primeras filas de la cabeza y no de la primera
         sola, por si la fila de arriba está cargada a un lado. */
      let min = frame.w, max = -1;
      for (let y = top; y < Math.min(frame.h, top + 4); y++){
        for (let x = 0; x < frame.w; x++) if (opaque(x, y)){ min = Math.min(min, x); max = Math.max(max, x); }
      }
      head = { top, cx: (min + max + 1) / 2 };
    }
  } catch (e) { /* file:// o imagen sin cargar: queda el valor por defecto */ }
  headCache.set(key, head);
  return head;
}

/* Tamaño del accesorio en píxeles del arte: se multiplica por la escala de la
   etapa, así crece junto con la mascota. Cuánto se hunde en la cabeza, como
   fracción de su alto: apoyado justo encima se ve flotando. */
const HAT_ART_PX = 12;
const HAT_SINK = 0.3;

/* El accesorio es un elemento aparte encima del canvas y no un dibujo dentro
   de él: a escala 3 la mascota llena los 96px del canvas y cualquier cosa
   sobre su cabeza quedaba recortada por el borde de arriba. Sigue al canvas
   con el mismo left y el mismo espejo (scaleX) cuando camina. */
function updateHat(drawn){
  const el = document.getElementById('petHat');
  const hat = state.style.hat && styleItemById(state.style.hat);
  if (!hat || !drawn || walker.flipY || displayMood() === 'dead'){ el.classList.add('hidden'); return; }
  /* drawSprite() devuelve todo en píxeles del canvas (físicos); acá se pasa a
     px CSS dividiendo por cuántos píxeles del canvas hay en un px CSS. */
  const { species, frame, scale, dx, dy, box } = drawn;
  const k = box.w / CANVAS_W;
  const head = frameHead(species, frame);
  const size = HAT_ART_PX * scale / k;
  const headY = (dy + head.top * scale) / k;                     // desde arriba del canvas
  const offX = (dx + head.cx * scale) / k - CANVAS_W / 2;        // respecto del centro del canvas
  el.textContent = hat.emoji;
  el.style.fontSize = size + 'px';
  el.style.left = (walker.x * 100) + '%';
  el.style.bottom = (4 + walker.y + CANVAS_H - headY - size * HAT_SINK) + 'px';
  el.style.transform = `translateX(-50%) scaleX(${walker.dir}) translateX(${offX}px)`;
  el.classList.remove('hidden');
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

/* Darle una comida de la despensa (la bandeja de Comer). Devuelve true si
   comió. La que comió queda como `selectedFood`, la marcada en la bandeja. */
function feedFood(id){
  if (state.stage === 'egg') { say('Todavía es un huevo…'); return false; }
  const food = foodById(id);
  if (foodStock(food.id) <= 0) return false;
  if (foodPile && foodPile.pieces.length >= FOOD_PILE_MAX){ say('¡Espera que se coma lo que tiene!'); return false; }
  if (!tryWake()) return false;
  catchUp();
  state.pantry[food.id] = (state.pantry[food.id] || 0) - 1;
  /* La porción se gasta ya, pero las barras suben recién mientras se la
     come (eatFoodPile()): si no, el hambre se llenaba antes de que llegara.
     state.meal es lo que falta sumar de TODAS las porciones del montón. */
  const piece = { food, hunger: hungerFillPct(food), energy: food.energy ?? FOOD_ENERGY_DEFAULT, t: 0, done: 0 };
  const m = state.meal || (state.meal = { hunger: 0, energy: 0 });
  m.hunger += piece.hunger;
  m.energy += piece.energy;
  state.selectedFood = food.id;
  if (!foodPile || !foodPile.pieces.length) say(food.restore ? '¡Ñam ñam!' : '¡Con pilas! ⚡');
  serveFood(piece);
  saveState(); render();
  return true;
}

/* La comida cae del cielo y la mascota va a comérsela. La bandeja no se
   cierra al tocar una: se pueden tocar varias y caen todas al MISMO lugar,
   apiladas (foodPile). La mascota camina una sola vez y se las come una tras
   otra en la misma animación (cada una se achica de a mordiscos en
   EAT_PIECE_MS). Si una cae cuando ya terminó y está celebrando, vuelve a
   comer (la rutina retrocede al paso de comer); si ya se fue, el montón es
   nuevo, en otro lugar. Con plato puesto cae en el plato. Las barras suben
   mientras come y mientras tanto no se puede hacer nada más que seguir
   dándole comida (mealBusy()). Si algo igual la corta (dormirse de
   agotada), lo que quedaba en el piso se va y se suma de una. */
const FOOD_REACH_PX = 26;    // de la comida al centro de la mascota cuando come
const EAT_PIECE_MS = 1100;   // lo que tarda en comerse cada porción
const FOOD_DROP_MS = 650;    // lo que tarda en caer del cielo (igual que .floor-food en el CSS)
const FOOD_PILE_MAX = 8;     // porciones esperando a la vez
let foodPile = null;         // { x, side, standX, plate, pieces: [...] }

function serveFood(piece){
  if (activeMinigame || gameOver || displayStage() === 'egg'){ flushMeal(); return; }
  petAction = null;
  if (!foodPile) foodPile = newFoodPile();
  dropFoodPiece(foodPile, piece);
  const a = walker.activity;
  if (a && a.pile === foodPile){
    /* Ya estaba terminando (paso de celebrar): vuelve a comer. */
    if (a.i > 1){ a.i = 1; a.st = 0; }
    return;
  }
  startEatRoutine(foodPile);
}

function newFoodPile(){
  const plate = typeof furniPlaced === 'function' ? furniPlaced('plato') : null;
  let x, side, reach;
  if (plate){
    x = plate.x;
    side = walker.x < x ? -1 : 1;
    reach = FURNI_ART.plato.w * furniK();
  } else {
    x = 0.15 + Math.random() * 0.7;
    for (let i = 0; i < 8 && Math.abs(x - walker.x) < 0.2; i++) x = 0.15 + Math.random() * 0.7;
    side = x > walker.x ? -1 : 1;   // se para del lado por donde llega
    reach = FOOD_REACH_PX;
  }
  return { x, side, standX: clampX(x + side * reach / floorWidth()), plate, pieces: [], n: 0 };
}

/* Alto de cada porción del montón: se apilan un poco y, cuando se come la
   de abajo, las otras bajan (transición en el CSS). */
function foodPieceBottom(pile, i){
  return 4 + (pile.plate ? Math.round(3 * furniK()) : 0) + Math.min(i, 4) * 3;
}

function dropFoodPiece(pile, piece){
  const floor = document.getElementById('creatureFloor');
  const el = document.createElement('div');
  el.className = 'floor-food';
  el.textContent = piece.food.emoji;
  const jitter = pile.n ? Math.round((Math.random() * 2 - 1) * 8) : 0;
  el.style.left = `calc(${(pile.x * 100).toFixed(2)}% + ${jitter}px)`;
  el.style.bottom = foodPieceBottom(pile, pile.pieces.length) + 'px';
  el.style.setProperty('--drop', Math.round(floorHeight() + 24) + 'px');
  el.style.setProperty('--eat', EAT_PIECE_MS + 'ms');
  floor.insertBefore(el, document.getElementById('buddyCanvas'));   // detrás de los personajes
  piece.el = el;
  piece.landAt = performance.now() + FOOD_DROP_MS;
  pile.pieces.push(piece);
  pile.n++;
}

function startEatRoutine(pile){
  const side = pile.side;
  startActivity(walker, [
    { go: pile.standX, speed: 0.24 },
    /* Come lo que haya en el montón; termina cuando no queda nada. */
    { anim: 'eat', dir: -side, fx: ['😋'], fxEvery: 1000,
      track: (rt, el, act, a, dt) => { eatFoodPile(pile, dt); return null; },
      until: () => !pile.pieces.length },
    { anim: 'happy', ms: 650, dir: -side, fx: ['💖'] },
  ], { kind: 'eat', rt: pile.plate || null, onEnd: () => endFoodPile(pile) });
  walker.activity.meal = true;
  walker.activity.pile = pile;
}

/* Un cuadro comiendo: la porción de abajo se achica y suma lo suyo de a
   poco. Una que todavía viene cayendo se espera. */
function eatFoodPile(pile, dt){
  const p = pile.pieces[0];
  if (!p || performance.now() < p.landAt) return;
  if (!p.t) p.el.classList.add('eating');
  p.t += dt * 1000;
  const frac = Math.min(1, p.t / EAT_PIECE_MS);
  const bite = frac - p.done;
  p.done = frac;
  const m = state.meal;
  if (m){
    for (const stat of ['hunger', 'energy']){
      const v = Math.min(m[stat], p[stat] * bite);
      state[stat] = clamp(state[stat] + v);
      m[stat] -= v;
    }
    if (m.hunger <= 1e-6 && m.energy <= 1e-6) state.meal = null;
  }
  if (frac >= 1){
    pile.pieces.shift();
    p.el.classList.add('gone');
    setTimeout(() => p.el.remove(), 260);
    pile.pieces.forEach((q, i) => { q.el.style.bottom = foodPieceBottom(pile, i) + 'px'; });
    saveState();
  }
}

/* Terminó (o se cortó): lo que quede en el piso se va; lo que faltaba sumar
   lo suma digestMeal() apenas deja de estar ocupada. */
function endFoodPile(pile){
  for (const p of pile.pieces){ p.el.classList.add('gone'); setTimeout(() => p.el.remove(), 260); }
  pile.pieces = [];
  if (foodPile === pile) foodPile = null;
}

/* Lo que falta sumar de la comida (state.meal). Va en el save: si se cierra
   la app a mitad, loadState() lo suma. */
function flushMeal(){
  const m = state && state.meal;
  if (!m) return;
  state.hunger = clamp(state.hunger + m.hunger);
  state.energy = clamp(state.energy + m.energy);
  state.meal = null;
}

/* Mientras va a la comida y se la come no se puede hacer nada más: ni los
   botones de abajo ni tocar la pantalla (la mascota, el acompañante, los
   muebles, la caca, el regalo, las flechas de las piezas). La bandeja de
   comida sí: se le puede seguir dando. */
function mealBusy(){
  return !!(state && state.meal && walker.activity && walker.activity.meal);
}

/* Cada frame (loopRender): marca los botones como ocupados y, si la rutina
   se cortó con comida a medias, suma lo que faltaba. */
function digestMeal(){
  const busy = mealBusy();
  const controls = document.getElementById('controls');
  if (controls.classList.contains('busy') !== busy) controls.classList.toggle('busy', busy);
  if (state && state.meal && !busy){ flushMeal(); saveState(); }
}

/* Corta cualquier toque mientras come (captura en window: corre antes que
   todos los demás listeners, también el de los muebles). La bandeja queda
   afuera: se le puede seguir tirando comida. */
let mealBusySaidAt = 0;
window.addEventListener('DOMContentLoaded', () => {
  const block = e => {
    if (!mealBusy() || !e.target.closest || !e.target.closest('#controls, #screen') || e.target.closest('#foodTray')) return;
    e.stopPropagation();
    e.preventDefault();
    if (e.type === 'click' && performance.now() - mealBusySaidAt > 1500){
      mealBusySaidAt = performance.now();
      say('¡Déjala comer tranquila! 😋');
    }
  };
  for (const type of ['pointerdown', 'click']) window.addEventListener(type, block, true);
});

const btnClean = () => {
  if (!tryWake()) return;
  catchUp();
  state.hygiene = clamp(state.hygiene + 35);
  state.poop = false;
  floatFx('🧼');
  say(state.stage === 'egg' ? 'Huevo brillante' : '¡Ya quedó limpio!');
  if (state.stage !== 'egg') triggerPetAction('clean');
  saveState(); render();
};

/* Comida de premio, no la de arranque: la gracia del regalo es que sea mejor
   que lo que ya se puede comprar barato. */
const GIFT_FOOD_POOL = ['rica', 'especial', 'redbull'];
const GIFT_HAPPINESS = 8;
/* Además de la comida, a veces trae un ticket de ruleta (premios.js): un
   giro extra que no toca el gratis de cada 12 horas. Con un regalo cada
   ~12 h reales, sale un ticket cada ~24 h. */
const GIFT_WHEEL_TICKET_CHANCE = 0.5;

const collectGift = () => {
  if (!tryWake()) return;
  catchUp();
  state.gift = false;

  const food = foodById(GIFT_FOOD_POOL[Math.floor(Math.random() * GIFT_FOOD_POOL.length)]);
  state.pantry[food.id] = (state.pantry[food.id] || 0) + 1;
  state.happiness = clamp(state.happiness + GIFT_HAPPINESS);
  const ticket = Math.random() < GIFT_WHEEL_TICKET_CHANCE;
  if (ticket) state.wheelTickets = (state.wheelTickets || 0) + 1;

  floatFx(food.emoji);
  if (ticket) setTimeout(() => floatFx('🎫'), 250);
  triggerPetAction('celebrate');
  saveState(); render();
  showPopup({
    icon: '🎁', title: '¡Un regalo!',
    items: [
      { icon: food.emoji, text: food.name, amount: '+1' },
      { icon: '😊', text: 'Felicidad', amount: `+${GIFT_HAPPINESS}` },
      ...(ticket ? [{ icon: '🎫', text: 'Ticket de ruleta', amount: '+1' }] : []),
    ],
    note: ticket ? 'El ticket es un giro extra: úsalo en Juegos → Ruleta.' : '',
  });
};

/* Ponerle la vacuna de su etapa: se hace al comprarla. Cuenta de una (si
   se cierra la app a mitad de la animación, ya quedó puesta). */
function applyVaccine(){
  catchUp();
  state.vaccinated = { ...(state.vaccinated || {}), [state.stage]: true };
  saveState();
}

/* ---------- la animación de vacunarla ----------
   Una jeringa de pixel art (escala entera en píxeles físicos: la de los
   muebles agrandada, para que se lea al lado de la mascota) baja volando junto a la mascota, se echa para atrás, la pincha
   y empuja el émbolo: el líquido verde se vacía mientras le saltan
   crucecitas verdes. Sale, ella celebra con un estallido de
   crucecitas y la jeringa se va hacia arriba y se deshace en chispas.
   Dormida no se despierta: la pinchan igual. */
const VAC_ART_W = 25, VAC_ART_H = 7, VAC_PUSH_MAX = 7;
const VAC_T = { arrive: 600, windup: 950, jab: 1100, push: 2000, out: 2250, leave: 2800 };

function drawSyringe(ctx, push){
  const p = pxPainter(ctx), O = FP.O;
  ctx.clearRect(0, 0, VAC_ART_W, VAC_ART_H);
  const q = Math.round(push);
  p.r(q, 0, 2, 7, O); p.r(q, 1, 1, 5, '#ff7b8a'); p.r(q + 1, 1, 1, 5, '#e8475a');   // mango
  p.r(q + 2, 3, 7, 1, '#9aa3b5');                                                   // vástago
  p.r(7, 0, 2, 1, O); p.r(7, 6, 2, 1, O);                                           // aletas
  p.box(8, 1, 10, 5, '#e8f6ff');                                                    // cuerpo
  if (q < VAC_PUSH_MAX) p.r(10 + q, 2, 7 - q, 3, '#5fe39b');                        // la vacuna
  if (q < VAC_PUSH_MAX) p.r(10 + q, 2, 7 - q, 1, '#b6ffd6');
  p.r(9 + q, 2, 1, 3, O);                                                           // émbolo
  p.r(11, 1, 1, 1, '#8fb3cf'); p.r(13, 1, 1, 1, '#8fb3cf'); p.r(15, 1, 1, 1, '#8fb3cf');
  p.r(18, 2, 2, 3, O); p.r(18, 3, 1, 1, '#cfd8e6');                                 // pico
  p.r(20, 3, 4, 1, '#cfd8e6'); p.r(24, 3, 1, 1, '#ffffff');                         // aguja
}

function vaccinateFx(done){
  const floor = document.getElementById('creatureFloor');
  const c = document.createElement('canvas');
  c.className = 'vaccine-fx';
  const s = Math.round(furniDeviceScale() * 1.35), k = s / DPR;
  c.width = VAC_ART_W * s; c.height = VAC_ART_H * s;
  c.style.width = (c.width / DPR) + 'px'; c.style.height = (c.height / DPR) + 'px';
  floor.appendChild(c);
  const art = document.createElement('canvas');
  art.width = VAC_ART_W; art.height = VAC_ART_H;
  const actx = art.getContext('2d'), ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const side = walker.x < 0.5 ? 1 : -1;      // la jeringa va del lado con más pieza
  const awake = !state.sleeping;
  if (walker.activity) endFurniActivity(walker);
  petAction = null;
  if (awake){
    startActivity(walker, [
      { anim: 'idle', ms: VAC_T.windup - 250, dir: side },
      { anim: 'sad', ms: 250, dir: side, fx: ['😨'] },
      { anim: 'medicine', ms: VAC_T.out - VAC_T.windup, dir: side, fx: ['💢'] },
      { anim: 'happy', ms: 900, dir: side, fx: ['💪'] },
    ], { kind: 'vaccine' });
  }
  const snap = v => Math.round(v * DPR) / DPR;
  const ease = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
  const t0 = performance.now();
  let lastPush = -1, burst = false, raf = 0, sparkAt = 0;
  const frame = now => {
    const t = now - t0, T = VAC_T;
    const fw = floorWidth(), h = actorCssH(walker);
    /* El borde del cuerpo: el frame de 32 trae aire a los lados, el cuerpo
       ocupa más o menos su mitad del centro. */
    const d = walker.drawn, frameW = d && d.frame ? d.frame.w * d.scale / DPR : h;
    const petX = walker.x * fw, half = frameW * 0.27;
    const armY = walker.y + h * (state.sleeping ? 0.25 : 0.42);
    /* Cuánto se separa la punta del cuerpo (px CSS) y cuánto más arriba va. */
    let gap = 6, lift = 0, alpha = 1;
    if (t < T.arrive){ const e = ease(t / T.arrive); lift = (1 - e) * 70; gap = 6 + (1 - e) * 18; alpha = Math.min(1, t / 200); }
    else if (t < T.windup) gap = 6 + ease((t - T.arrive) / (T.windup - T.arrive)) * 8;
    else if (t < T.jab) gap = 14 - ease((t - T.windup) / (T.jab - T.windup)) * 17;
    else if (t < T.push) gap = -3;
    else if (t < T.out) gap = -3 + ease((t - T.push) / (T.out - T.push)) * 13;
    else { const e = ease((t - T.out) / (T.leave - T.out)); gap = 10; lift = e * 60; alpha = 1 - e; }
    const push = t < T.jab ? 0 : t < T.push ? VAC_PUSH_MAX * (t - T.jab) / (T.push - T.jab) : VAC_PUSH_MAX;
    if (Math.round(push) !== lastPush){
      lastPush = Math.round(push);
      drawSyringe(actx, push);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(art, 0, 0, c.width, c.height);
    }
    if (t >= T.jab && t < T.push && t - sparkAt > 90 && typeof fxSpawn === 'function'){
      sparkAt = t;
      fxSpawn({ x: petX + side * half * 0.4, y: armY + 2, vx: side * (10 + Math.random() * 20), vy: 30 + Math.random() * 30, ay: -40,
        life: 700, shape: 'plus', color: '#5fe39b', layer: 'front' });
    }
    if (!burst && t >= T.out){
      burst = true;
      if (typeof fxBurst === 'function'){
        fxBurst(petX, walker.y + h * 0.55, 16, { colors: ['#5fe39b', '#b6ffd6', '#ffffff'], shapes: ['plus', 'sq', 'heart'], speed: 75, life: 900, ay: -40 });
      }
      if (typeof magicFlash === 'function') magicFlash('#9dffcb', 420, 0.35);
      if (typeof tone === 'function'){
        [784, 988, 1319].forEach((f, i) => tone({ freq: f, durationMs: 160, type: 'triangle', vol: 0.1, at: i * 0.09, attackMs: 8 }));
      }
    }
    const W = VAC_ART_W * k;
    const tipX = petX + side * (half + gap);
    c.style.left = snap(side > 0 ? tipX : tipX - W) + 'px';
    c.style.bottom = snap(4 + armY + lift - 3.5 * k) + 'px';
    c.style.transform = side > 0 ? 'scaleX(-1)' : '';
    c.style.opacity = alpha.toFixed(3);
    if (t < T.leave){ raf = requestAnimationFrame(frame); return; }
    if (typeof fxBurst === 'function'){
      fxBurst(tipX + (side > 0 ? 1 : -1) * W * 0.5, armY + lift + 4, 10, { colors: ['#ffffff', '#b6ffd6'], shapes: ['spark', 'sq'], speed: 45, life: 600, ay: -30 });
    }
    c.remove();
    render();
    if (done) done();
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

/* Dar una medicina de la despensa. Devuelve el aviso si no se pudo (no está
   enferma, no quedan), para que la bandeja de Comer lo muestre. */
function giveMedicine(){
  catchUp();
  if (!state.sick) return 'No está enferma: guárdala para cuando la necesite';
  if (foodStock(MEDICINE.id) <= 0) return 'No te quedan medicinas: cómpralas en la tienda';
  state.pantry[MEDICINE.id] -= 1;
  state.sick = false;
  state.health = clamp(state.health + MED_HEALTH);
  floatFx('💊');
  say('Se siente mejor');
  triggerPetAction('medicine');
  saveState(); render();
  return null;
}

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

/* Dormir / Despertar: el mismo botón. Dormir la acuesta en el acto (a la
   cama si hay una: eso lo hace solo updateWalker()); despertar sigue las
   reglas de siempre (tryWake: bajo ENERGY_LOCK_AT no se puede). Con la
   energía en WAKE_AT o más no se acuesta: se despertaría sola en el próximo
   tick y el botón parecería no hacer nada. */
const btnSleep = () => {
  if (state.stage === 'egg') { say('Todavía es un huevo…'); return; }
  if (state.sleeping){ tryWake(); saveState(); render(); return; }
  if (state.energy >= WAKE_AT){ say('No tiene nada de sueño ☀️'); return; }
  catchUp();
  state.sleeping = true;
  petAction = null;
  say('A dormir… 💤');
  saveState(); render();
};

/* Los botones de abajo avisan cuando hacen falta (ver .need y data-badge en
   el CSS). Corre en cada render(), así que solo toca el DOM si algo cambió. */
/* Le falta la vacuna de su etapa (pierde salud cada día): la Tienda lo
   avisa con un 💉 (rojo bajo SICK_LOW_HEALTH_AT) (salvo que esté enferma: primero la
   medicina, que avisa Comer con el 💊). */
function vaccineDue(){
  return !state.sick && !!vaccineFor() && !isVaccinated();
}

function updateDock(){
  const sleepy = !state.sleeping && state.energy < SLEEPY_THRESHOLD;
  const want = {
    btnFeed:  { need: state.hunger < 30 || !!state.sick, badge: state.sick ? '💊' : '' },
    btnClean: { need: !!state.poop, badge: state.poop ? '💩' : '' },
    btnSleep: { need: sleepy, badge: sleepy ? 'zZ' : '', soft: !isExhausted(), asleep: !!state.sleeping },
    /* La ruleta vive dentro de Juegos: el giro gratis se avisa en Jugar. */
    btnPlay:  { need: false, badge: typeof wheelReady === 'function' && wheelReady() ? '🎡' : '', soft: true },
    /* La vacuna se compra (y se pone) en la tienda. */
    btnShop:  vaccineDue() ? { need: false, badge: VACCINE_EMOJI, soft: state.health >= SICK_LOW_HEALTH_AT } : { need: false, badge: '' },
  };
  const key = JSON.stringify(want);
  if (updateDock._key === key) return;
  updateDock._key = key;
  for (const [id, w] of Object.entries(want)){
    const el = document.getElementById(id);
    el.classList.toggle('need', w.need);
    if (w.badge) el.dataset.badge = w.badge; else delete el.dataset.badge;
    el.classList.toggle('badge-soft', !!w.soft);
  }
  const sl = document.getElementById('btnSleep');
  sl.classList.toggle('asleep', want.btnSleep.asleep);
  sl.title = want.btnSleep.asleep ? 'Despertar' : 'Dormir';
  document.getElementById('sleepIcon').textContent = want.btnSleep.asleep ? '☀️' : '🌙';
  document.getElementById('sleepLabel').textContent = want.btnSleep.asleep ? 'Despertar' : 'Dormir';
}

/* ===================== Ficha de cada reloj =====================
   Tocar un reloj abre una hoja con todo lo que mueve esa barra: el valor
   real (el hambre en puntos de panza, la salud contra su tope), a qué ritmo
   va ahora y cuánto falta para el próximo umbral, lo que la sube y lo que
   la baja con sus números, y qué pasa en cada umbral. Todo sale de las
   constantes de la simulación (nada escrito a mano), así no se desfasa si
   se recalibra algo. Lo que está pasando ahora va marcado. */
const STAT_META = {
  energy:    { name: 'Energía',   emoji: '⚡' },
  hygiene:   { name: 'Higiene',   emoji: '🧼' },
  health:    { name: 'Salud',     emoji: '❤️' },
  happiness: { name: 'Felicidad', emoji: '😊' },
  hunger:    { name: 'Hambre',    emoji: '🍗' },
};
const STAGE_NAME = { egg: 'huevo', child: 'niño', teen: 'adolescente', adult: 'adulto' };
const GAME_H = 60;   // horas de juego por hora real (MS_PER_GAME_HOUR)

const nf = (v, d = 1) => Number(v).toLocaleString('es-CL', { maximumFractionDigits: d });
function fmtHours(h){
  if (!isFinite(h)) return '—';
  const min = Math.max(1, Math.round(h * 60));
  if (min < 60) return `${min} min`;
  const H = Math.floor(min / 60), M = min % 60;
  return M ? `${H} h ${M} min` : `${H} h`;
}
function hasFurniAnywhere(id){
  return !!(state.style && Array.isArray(state.style.rooms) &&
    state.style.rooms.some(r => r.furniture.some(f => f.id === id)));
}

/* Lo que multiplica el decaimiento en este momento. */
function statFactors(stat){
  const night = isNightMode() ? NIGHT_DECAY_FACTOR : 1;
  const sleep = state.sleeping && (stat === 'hunger' || stat === 'happiness') ? 0.25 : 1;
  return night * sleep;
}

/* Cuánto cambia la barra por hora REAL ahora mismo, en % (signo incluido). */
function statRateNow(stat){
  const v = state[stat];
  if (stat === 'energy'){
    if (state.sleeping) return ENERGY_RECOVER_PER_HOUR * (hasFurniAnywhere('cama') ? FURNI_BED_ENERGY_MULT : 1) * GAME_H;
    return -decayRate('energy', v) * statFactors('energy') * GAME_H;
  }
  if (stat === 'hygiene') return state.poop ? -decayRate('hygiene', v) * statFactors('hygiene') * GAME_H : 0;
  if (stat === 'health'){
    const night = isNightMode() ? NIGHT_DECAY_FACTOR : 1;
    let d = 0;
    if (healthRiskNow()) d -= HEALTH_RISK_LOSS_PER_REAL_HOUR / 60 * night;
    if (state.sick) d -= SICK_LOSS_PER_REAL_HOUR / 60 * night;
    if (isExhausted()) d -= EXHAUSTED_LOSS_PER_DAY / (24 * 60) * night;
    if (d === 0) d = HEALTH_RECOVER_PER_HOUR;
    if (vaccineFor() && !isVaccinated()) d -= VACCINE_HEALTH_LOSS_PER_DAY / (24 * 60);
    if ((d > 0 && state.health >= 99.99) || (d < 0 && state.health <= 0)) return 0;
    return d * GAME_H;
  }
  return -decayRate(stat, v) * statFactors(stat) * GAME_H;
}
function healthRiskNow(){
  return state.hunger < HEALTH_RISK_AT || state.happiness < HEALTH_RISK_AT || state.hygiene < HEALTH_RISK_AT;
}

/* Horas reales hasta que la barra baje a `target`, a las condiciones de
   ahora (con el x1.5 de apuro cuando entra). Infinity si no baja. */
function statEta(stat, target){
  if (stat === 'health'){
    const r = statRateNow('health');
    return r < 0 && state.health > target ? (state.health - target) / -r : Infinity;
  }
  if (stat === 'hygiene' && !state.poop) return Infinity;
  if (stat === 'energy' && state.sleeping) return Infinity;
  let v = state[stat], h = 0;
  if (v <= target) return 0;
  const f = statFactors(stat), step = 0.25;
  while (v > target && h < 60 * 24 * 30){ v -= decayRate(stat, v) * f * step; h += step; }
  return h / GAME_H;
}

/* Fila de una lista: e emoji, t título, d detalle, v valor, up/down el
   color del valor, on = está pasando ahora. */
function siRow({ e, t, d = '', v = '', up = false, down = false, on = false }){
  return `<div class="si-row ${on ? 'on' : ''}">
      <span class="si-e">${e}</span>
      <div class="si-t"><b>${t}${on ? ' <i class="si-now">ahora</i>' : ''}</b>${d ? `<small>${d}</small>` : ''}</div>
      ${v ? `<span class="si-v ${up ? 'up' : down ? 'down' : ''}">${v}</span>` : ''}
    </div>`;
}

/* Contenido por reloj: { big, unit, sub, gauge: {marks, cap}, now: [chips],
   eta: [líneas], up: [filas], down: [filas], marks: [filas de umbrales],
   extra } */
function statInfoData(stat){
  const night = isNightMode(), sleeping = !!state.sleeping;
  const nightRow = { e: '🌙', t: 'De noche (00:00 a 06:00)', d: 'Hora del teléfono', v: `×${nf(NIGHT_DECAY_FACTOR)}`, up: true, on: night };
  const distressRow = (lim) => ({ e: '📉', t: `En apuro (bajo ${lim}%)`, d: 'Cuando ya va mal, baja más rápido', v: `×${nf(DISTRESS_MULT)}`, down: true, on: state[stat] < lim });
  const sleepRow = { e: '💤', t: 'Dormida', d: 'Baja a un cuarto del ritmo', v: '×0,25', up: true, on: sleeping };
  const riskMark = { v: HEALTH_RISK_AT, t: 'Empieza a dañar la salud' };
  const sadMark = { v: 25, t: 'Se pone triste' };
  const distMark = lim => ({ v: lim, t: `Apuro: baja ×${nf(DISTRESS_MULT)} más rápido` });

  if (stat === 'hunger'){
    const st = hungerStage(), cap = hungerCap(), pts = state.hunger / 100 * cap;
    const ptsH = HUNGER_PER_REAL_HOUR[st];
    const full = c => c * (0.8 + 0.2 / DISTRESS_MULT);   // de 100% a 0, con el apuro bajo 20%
    const stages = ['child', 'teen', 'adult'].map(s => siRow({
      e: s === st ? '👉' : '·', t: `${STAGE_NAME[s][0].toUpperCase() + STAGE_NAME[s].slice(1)}: panza de ${HUNGER_CAP[s]}`,
      d: `Baja ${nf(HUNGER_PER_REAL_HOUR[s])} pts por hora · de lleno a vacío en ${fmtHours(full(HUNGER_CAP[s]) / HUNGER_PER_REAL_HOUR[s])}`,
      on: s === st })).join('');
    const foods = FOODS.filter(f => f.restore > 0).map(f => ({
      e: f.emoji, t: f.name,
      d: f.fill ? `Llena la panza entera · ${f.price} 💰` : `Llena ${nf(hungerFillPct(f), 0)}% siendo ${STAGE_NAME[st]} · ${f.price} 💰`,
      v: f.fill ? 'lleno' : `+${f.restore} pts`, up: true }));
    if (typeof FRUIT_FOOD !== 'undefined') foods.push({ e: FRUIT_FOOD.emoji, t: 'Fruta del árbol frutal', d: `Gratis, una cada ${FRUIT_EVERY_MS / 3600000} h (objeto mágico)`, v: `+${FRUIT_FOOD.restore} pts`, up: true, on: hasFurniAnywhere('arbol') });
    return {
      big: nf(pts, 0), unit: `/ ${cap} pts`, sub: `${nf(state.hunger, 0)}% de su panza de ${STAGE_NAME[st]}`,
      down: [
        { e: '⏳', t: 'Sola, con el tiempo', d: `De lleno a vacío en ${fmtHours(full(cap) / ptsH)} siendo ${STAGE_NAME[st]}`, v: `−${nf(ptsH)} pts/h`, down: true, on: true },
        sleepRow, nightRow, distressRow(DISTRESS_AT.hunger),
      ],
      up: foods,
      marks: [{ v: 60, t: 'Feliz (si la felicidad pasa de 75)', above: true }, riskMark, sadMark, distMark(DISTRESS_AT.hunger)],
      extra: `<h4>La panza crece con la edad</h4>${stages}`,
      unitPts: cap / 100,
      pct: true,   // los umbrales son % de la panza, no puntos
    };
  }

  if (stat === 'happiness'){
    const base = DECAY_PER_HOUR.happiness * GAME_H;
    const j = state.furniJoy && typeof state.furniJoy === 'object' && Date.now() - state.furniJoy.since < 3600000 ? state.furniJoy.n : 0;
    return {
      big: nf(state.happiness, 1), unit: '/ 100', sub: 'Puntos de felicidad',
      down: [
        { e: '⏳', t: 'Sola, con el tiempo', d: `De llena a vacía en ~${fmtHours(100 / base)}`, v: `−${nf(base)}/h`, down: true, on: true },
        sleepRow, nightRow, distressRow(DISTRESS_AT.happiness),
        { e: '💩', t: 'Comer caca en Atrapa estrellas', d: 'Una partida mala puede restar', v: `hasta −${Math.abs(HAPPINESS_MIN_GAIN)}`, down: true },
      ],
      up: [
        { e: '🎮', t: 'Jugar un minijuego', d: `Según qué tan bien: un tercio del mérito (~${Math.round(GOOD_GAME_MERIT * HAPPINESS_PER_MERIT)} en una partida muy buena)`, v: `hasta +${HAPPINESS_MAX_GAIN}`, up: true },
        { e: '💗', t: 'Hacerle cariño', d: 'Tocar a la mascota', v: '+6', up: true },
        { e: '🎁', t: 'Abrir un regalo', d: 'Aparecen solos, ~1 cada 12 h', v: `+${GIFT_HAPPINESS}`, up: true, on: !!state.gift },
        { e: '🎡', t: 'Trozo de felicidad en la ruleta', d: 'Un premio posible del giro', v: '+15', up: true },
        { e: '🛋️', t: 'Muebles, objetos y jugar de a dos', d: `Cada visita o juego juntos · máximo ${FURNI_JOY_PER_HOUR} por hora (esta hora: ${j})`, v: `+${FURNI_JOY}`, up: true, on: j > 0 },
      ],
      marks: [{ v: 75, t: 'Feliz (si el hambre pasa de 60)', above: true }, riskMark, sadMark, distMark(DISTRESS_AT.happiness)],
    };
  }

  if (stat === 'energy'){
    const base = DECAY_PER_HOUR.energy * GAME_H, rec = ENERGY_RECOVER_PER_HOUR * GAME_H;
    const bed = hasFurniAnywhere('cama');
    const foods = FOODS.map(f => ({ f, e: f.energy ?? FOOD_ENERGY_DEFAULT }))
      .sort((a, b) => b.e - a.e)
      .map(({ f, e }) => ({ e: f.emoji, t: f.name, d: `${f.price} 💰`, v: `+${e}`, up: true }));
    return {
      big: nf(state.energy, 1), unit: '/ 100', sub: sleeping ? 'Durmiendo: se está cargando' : 'Puntos de energía',
      down: [
        { e: '⏳', t: 'Despierta, con el tiempo', d: `De llena a vacía en ~${fmtHours(100 / base)}`, v: `−${nf(base)}/h`, down: true, on: !sleeping },
        { e: '🌙', t: 'De noche (00:00 a 06:00)', d: 'Hora del teléfono', v: `×${nf(NIGHT_DECAY_FACTOR)}`, up: true, on: night && !sleeping },
        distressRow(DISTRESS_AT.energy),
        { e: '🎮', t: 'Cada partida de un minijuego', d: `Según el juego; hace falta ${GAME_MIN_ENERGY} para jugar`, v: '−10 a −20', down: true },
      ],
      up: [
        { e: '💤', t: 'Dormir', d: `La barra entera en ${fmtHours(100 / rec)}`, v: `+${nf(rec, 0)}/h`, up: true, on: sleeping },
        { e: '🛏️', t: 'Con cama puesta', d: `En cualquier habitación: la barra en ${fmtHours(100 / rec / FURNI_BED_ENERGY_MULT)}`, v: `×${nf(FURNI_BED_ENERGY_MULT)}`, up: true, on: bed },
        ...foods,
        ...(typeof FRUIT_FOOD !== 'undefined' ? [{ e: FRUIT_FOOD.emoji, t: 'Fruta del árbol frutal', d: 'Objeto mágico', v: `+${FRUIT_FOOD.energy}`, up: true }] : []),
      ],
      marks: [
        { v: WAKE_AT, t: 'Se despierta sola', above: true },
        { v: SLEEPY_THRESHOLD, t: 'Puede quedarse dormida sola' },
        { v: EXHAUSTED_AT, t: `Agotada: despierta pierde ${EXHAUSTED_LOSS_PER_DAY} de salud al día` },
        { v: GAME_MIN_ENERGY, t: `Muy cansada para jugar · apuro ×${nf(DISTRESS_MULT)}` },
        { v: ENERGY_LOCK_AT, t: 'Se desploma: se duerme y no se la puede despertar' },
      ],
    };
  }

  if (stat === 'hygiene'){
    const base = DECAY_PER_HOUR.hygiene * GAME_H;
    const poopH = 1 - Math.pow(1 - POOP_CHANCE_PER_HOUR, GAME_H);
    const poopMed = Math.log(2) / -Math.log(1 - POOP_CHANCE_PER_HOUR) / GAME_H;
    const seguro = upgradeState('autoClean');
    return {
      big: nf(state.hygiene, 1), unit: '/ 100', sub: state.poop ? 'Hay caca: se está ensuciando' : 'No baja sola: solo con caca',
      down: [
        { e: '💩', t: 'Caca sin limpiar', d: `Solo mientras esté: de limpia a sucia en ~${fmtHours(100 / base)}`, v: `−${nf(base)}/h`, down: true, on: !!state.poop },
        { e: '🎲', t: 'Que aparezca caca', d: `${nf(poopH * 100)}% por hora · la primera sale en ~${fmtHours(poopMed)} (mediana)`, v: '' },
        nightRow, distressRow(DISTRESS_AT.hygiene),
        { e: '🎮', t: 'Algunos minijuegos', d: 'Atrapa estrellas −5, Carrera en dupla −4, Espejo −3', v: 'hasta −5', down: true },
      ],
      up: [
        { e: '🧹', t: 'Limpiar', d: 'Y saca la caca', v: '+35', up: true, on: !!state.poop },
        { e: '🛡️', t: 'Seguro de limpieza', d: seguro.owned ? (seguro.armed ? 'Activado: limpia sola la próxima caca' : 'Comprado, pero desactivado (Tienda → Mejoras)') : 'Mejora de la tienda: limpia sola una caca', v: '+35', up: true, on: !!(seguro.owned && seguro.armed) },
        ...(typeof ROBOT_CLEAN_EVERY_MS !== 'undefined' ? [{ e: '🤖', t: 'Robot aspiradora', d: `Aspira una caca cada ${ROBOT_CLEAN_EVERY_MS / 3600000} h (objeto mágico)`, v: '+35', up: true, on: hasFurniAnywhere('robot') }] : []),
        ...(typeof NUBE_ART !== 'undefined' ? [{ e: '🌧️', t: 'Lluvia de la nubecita', d: 'Si queda debajo, una vez por lluvia (objeto mágico)', v: '+4', up: true, on: hasFurniAnywhere('nube') }] : []),
      ],
      marks: [riskMark, sadMark, distMark(DISTRESS_AT.hygiene)],
    };
  }

  /* Salud */
  const sickH = p => 1 - Math.pow(1 - p, GAME_H);
  const vac = vaccineFor(), vacOk = isVaccinated();
  const mult = vacOk ? VACCINE_SICK_MULT : 1;
  const medSeguro = upgradeState('autoMed');
  const risk = healthRiskNow(), causas = (risk ? 1 : 0) + (state.sick ? 1 : 0) + (isExhausted() ? 1 : 0);
  return {
    big: nf(state.health, 1), unit: '/ 100',
    sub: vac && !vacOk ? `Sin vacuna: pierde ${VACCINE_HEALTH_LOSS_PER_DAY} al día` : 'Puntos de salud',
    down: [
      { e: '⚠️', t: `Hambre, felicidad o higiene bajo ${HEALTH_RISK_AT}%`, d: 'Cuenta una vez, aunque sean varias', v: `−${nf(HEALTH_RISK_LOSS_PER_REAL_HOUR)}/h`, down: true, on: risk },
      { e: '🤒', t: 'Enferma', d: 'Se suma a lo de arriba', v: `−${nf(SICK_LOSS_PER_REAL_HOUR)}/h`, down: true, on: !!state.sick },
      { e: '😵', t: `Agotada y despierta (energía bajo ${EXHAUSTED_AT})`, d: 'Dormida no cuesta nada', v: `−${EXHAUSTED_LOSS_PER_DAY}/día`, down: true, on: isExhausted() },
      { e: '🌙', t: 'De noche (00:00 a 06:00)', d: 'Lo que baja, baja a la mitad', v: `×${nf(NIGHT_DECAY_FACTOR)}`, up: true, on: night && causas > 0 },
      ...(vac ? [{ e: VACCINE_EMOJI, t: 'Sin la vacuna de su etapa', d: vacOk ? 'Ya la tiene puesta' : `Siempre, aunque esté todo bien, y también de noche`, v: `−${VACCINE_HEALTH_LOSS_PER_DAY}/día`, down: true, on: !vacOk }] : []),
    ],
    up: [
      { e: '🌿', t: 'Sin ninguna causa', d: vac && !vacOk ? `Se recupera sola, pero sin vacuna le gana la pérdida: ${HEALTH_RECOVER_PER_DAY} − ${VACCINE_HEALTH_LOSS_PER_DAY} = −${VACCINE_HEALTH_LOSS_PER_DAY - HEALTH_RECOVER_PER_DAY} al día` : 'Se recupera sola, despacio, hasta 100', v: `+${HEALTH_RECOVER_PER_DAY}/día`, up: true, on: causas === 0 && state.health < 99.99 },
      { e: '💊', t: 'Medicina', d: `La cura y suma salud · ${MEDICINE.price} 💰`, v: `+${MED_HEALTH}`, up: true, on: !!state.sick },
      { e: '🛡️', t: 'Seguro médico', d: medSeguro.owned ? (medSeguro.armed ? 'Activado: cura sola la próxima enfermedad' : 'Comprado, pero desactivado') : 'Mejora de la tienda: cura sola una enfermedad', v: `+${MED_HEALTH}`, up: true, on: !!(medSeguro.owned && medSeguro.armed) },
      ...(vac ? [{ e: VACCINE_EMOJI, t: vac.name, d: vacOk ? 'Puesta ✓ · la próxima al crecer' : `Deja de perder esos ${VACCINE_HEALTH_LOSS_PER_DAY} y se enferma la mitad · Tienda → Mejoras · ${vac.price} 💰`, v: `+${VACCINE_HEALTH_LOSS_PER_DAY}/día`, up: true, on: vacOk }] : []),
    ],
    marks: [
      { v: SICK_LOW_HEALTH_AT, t: `Se enferma más seguido (${nf(sickH(SICK_CHANCE_PER_HOUR_LOW * mult) * 100)}% por hora)` },
      { v: 25, t: 'Queda anotado en la bitácora' },
      { v: 0, t: 'Se muere', zero: true },
    ],
    extra: `<h4>Enfermarse</h4>${siRow({ e: '🎲', t: 'Probabilidad por hora',
      d: `${nf(sickH(SICK_CHANCE_PER_HOUR * mult) * 100)}% con ${SICK_LOW_HEALTH_AT} o más de salud, ${nf(sickH(SICK_CHANCE_PER_HOUR_LOW * mult) * 100)}% bajo ${SICK_LOW_HEALTH_AT}${vacOk ? ' (vacunada: la mitad)' : ''}`,
      v: `${nf(sickH((state.health < SICK_LOW_HEALTH_AT ? SICK_CHANCE_PER_HOUR_LOW : SICK_CHANCE_PER_HOUR) * mult) * 100)}%/h`, down: true, on: true })}`,
    perDay: true,   // la recuperación y la vacuna van por día: por hora se leen como 0,6
  };
}

/* Un umbral "pasa" bajo su valor; los de arriba (feliz, despertarse), sobre él. */
const markOn = (m, v) => m.zero ? v <= 0 : m.above ? v >= m.v : v < m.v;

/* La barra con sus umbrales marcados y dónde está ahora. */
function statGauge(stat, data){
  const v = clamp(state[stat]);
  const marks = data.marks.filter(m => m.v > 0 && m.v < 100)
    .map(m => `<i class="si-mark ${markOn(m, v) ? 'past' : ''}" style="left:${m.v}%"></i>`).join('');
  return `<div class="si-gauge"><i class="si-fill" style="width:${v}%"></i>${marks}</div>`;
}

/* Lo de "ahora": a qué ritmo va y cuánto le falta para lo próximo. */
function statNowHtml(stat, data){
  const r = statRateNow(stat);
  const k = data.unitPts || 1, u = data.unitPts ? ' pts' : '';
  let ritmo;
  if (Math.abs(r) < 0.005) ritmo = stat === 'health' && state.health >= 99.99 ? 'Está entera: no cambia' : 'Quieta: no está cambiando';
  else if (data.perDay && Math.abs(r) < 1) ritmo = `${r > 0 ? 'Sube' : 'Baja'} ${nf(Math.abs(r) * 24)} por día`;
  else ritmo = `${r > 0 ? 'Sube' : 'Baja'} ${nf(Math.abs(r) * k)}${u} por hora${data.unitPts ? ` (${nf(Math.abs(r))}%)` : ''}`;
  const lines = [];
  if (r > 0.005){
    const tope = 100;
    lines.push(`Llega a ${stat === 'energy' && state.sleeping ? `${WAKE_AT} (se despierta)` : nf(tope, 0)} en ${fmtHours(((stat === 'energy' && state.sleeping ? WAKE_AT : tope) - state[stat]) / r)}`);
  } else if (r < -0.005){
    const prox = data.marks.filter(m => !m.above).sort((a, b) => b.v - a.v).find(m => m.v < state[stat]);
    if (prox) lines.push(`${prox.v === 0 ? 'Llega a 0' : `Baja de ${prox.v}${data.pct ? '%' : ''}`} en ${fmtHours(statEta(stat, prox.v))}: ${prox.t.toLowerCase()}`);
    if (stat !== 'health' && (!prox || prox.v > 0)) lines.push(`Se vacía en ${fmtHours(statEta(stat, 0))}`);
  }
  const flags = [];
  if (state.sleeping) flags.push('💤 dormida');
  if (isNightMode()) flags.push('🌙 noche');
  return `<div class="si-now-box">
      <b>${ritmo}</b>
      ${lines.map(l => `<small>${l}</small>`).join('')}
      ${flags.length ? `<div class="si-flags">${flags.map(f => `<span>${f}</span>`).join('')}</div>` : ''}
    </div>`;
}

let statInfoTimer = null;
function statInfoParts(stat){
  const m = STAT_META[stat], d = statInfoData(stat);
  return {
    head: `
      <div class="si-head">
        <span class="si-badge">${m.emoji}</span>
        <div class="si-title"><small>${m.name}</small><div><b class="si-big">${d.big}</b> <span class="si-unit">${d.unit}</span></div><small>${escapeHtml(d.sub)}</small></div>
      </div>
      ${statGauge(stat, d)}`,
    body: `
      ${statNowHtml(stat, d)}
      <h4>Lo que la sube</h4>${d.up.map(siRow).join('')}
      <h4>Lo que la baja</h4>${d.down.map(siRow).join('')}
      <h4>Umbrales${d.pct ? ' (en % de la panza)' : ''}</h4>${d.marks.map(mk => siRow({ e: `<span class="si-num">${mk.v}</span>`, t: mk.t, on: markOn(mk, state[stat]) })).join('')}
      ${d.extra || ''}`,
  };
}

function openStatInfo(stat){
  if (!STAT_META[stat] || !state || state.stage === 'egg') return;
  catchUp();
  const p = statInfoParts(stat);
  showOverlay(`
    <div class="stat-info" data-si="${stat}">${p.head}</div>
    <div class="menu-list si-body">${p.body}</div>
    <button class="overlay-btn secondary" id="btnCloseStat">Cerrar</button>
  `, closeStatInfo);
  document.getElementById('btnCloseStat').addEventListener('click', closeStatInfo);
  /* Se refresca sola mientras está abierta (los números se mueven): solo el
     contenido, sin volver a armar la hoja ni perder el scroll. */
  clearInterval(statInfoTimer);
  statInfoTimer = setInterval(() => {
    const head = document.querySelector('.stat-info[data-si]');
    if (!head || document.getElementById('overlay').classList.contains('hidden') || gameOver){ clearInterval(statInfoTimer); return; }
    const q = statInfoParts(head.dataset.si);
    head.innerHTML = q.head;
    document.querySelector('.si-body').innerHTML = q.body;
  }, 2000);
}
function closeStatInfo(){ clearInterval(statInfoTimer); hideOverlay(); }

/* ===================== Bandeja de comidas ===================== */

/* Comer abre una bandeja encima de los botones de abajo (no una hoja: no tapa
   la pantalla, así se ve comer y se ve la barra de hambre). Tocar una comida
   se la da en el acto; la medicina va en la misma fila (antes era la sección
   Botiquín de un menú aparte). Una comida en 0 sale apagada y tocarla lleva a
   la tienda a comprarla. Los avisos van con say(): la burbuja está en la
   pantalla, que la bandeja no tapa. */
function foodTrayOpen(){ return !document.getElementById('foodTray').classList.contains('hidden'); }

function closeFoodTray(){
  document.getElementById('foodTray').classList.add('hidden');
  document.getElementById('controls').classList.remove('tray-open');
}

function toggleFoodTray(){
  if (foodTrayOpen()){ closeFoodTray(); return; }
  if (state.stage === 'egg'){ say('Todavía es un huevo…'); return; }
  renderFoodTray();
  document.getElementById('foodTray').classList.remove('hidden');
  document.getElementById('controls').classList.add('tray-open');   // esconde los globitos de aviso
}

function renderFoodTray(aviso){
  const tray = document.getElementById('foodTray');
  const tile = (id, emoji, label, n, cls) => `
      <button class="tray-food ${cls}" data-tray="${id}">
        <span class="n">x${n}</span><span class="emo">${emoji}</span><b>${label}</b>
      </button>`;
  const short = { simple: 'Simple', rica: 'Rica', especial: 'Especial', redbull: 'Red Bull',
    banquete: 'Banquete', cafe: 'Café', jugo: 'Jugo' };
  const foods = FOODS.map(f => {
    const n = foodStock(f.id);
    return tile(f.id, f.emoji, short[f.id] || f.name, n,
      (n <= 0 ? 'out ' : '') + (state.selectedFood === f.id ? 'last' : ''));
  }).join('');
  const meds = foodStock(MEDICINE.id);
  const med = tile(MEDICINE.id, MEDICINE.emoji, MEDICINE.name, meds,
    'med ' + (meds <= 0 ? 'out ' : '') + (state.sick ? 'urgent' : ''));
  const sub = aviso
    ? `<small class="warn">${escapeHtml(aviso)}</small>`
    : `<small>${state.sick ? '¡Está enferma! Dale una medicina' : 'Toca varias: caen todas juntas'}</small>`;
  tray.innerHTML = `
    <div class="tray-head"><span><b>¿Qué come?</b>${sub}</span>
      <button class="tray-close" id="trayClose">Cerrar</button></div>
    <div class="tray-foods">${foods}${med}</div>`;
  tray.querySelector('#trayClose').addEventListener('click', closeFoodTray);
  tray.querySelectorAll('[data-tray]').forEach(el => el.addEventListener('click', requireAlive(() => {
    const id = el.dataset.tray;
    if (id === MEDICINE.id){
      if (mealBusy()){ renderFoodTray('Primero que termine de comer'); return; }
      if (meds <= 0){ closeFoodTray(); shopTab = 'food'; openShop('No te quedan medicinas'); return; }
      const problema = giveMedicine();
      if (problema) renderFoodTray(problema); else closeFoodTray();
      return;
    }
    if (foodStock(id) <= 0){
      closeFoodTray();
      shopTab = 'food';
      openShop(`No te queda ${foodById(id).name}`);
      return;
    }
    /* La bandeja queda abierta: se pueden tirar varias, caen todas al mismo
       montón y se las come de una. */
    if (feedFood(id)) renderFoodTray();
  })));
}

/* ===================== Tienda =====================
   Las monedas salen de los minijuegos (ver finishMinigame). Se vende toda la
   comida, incluido el bocadillo simple: ya no es infinito ni gratis, hay que
   venir a comprarlo igual que el resto. */

/* Pestaña activa de la tienda: vive fuera de openShop() para que sobreviva a
   los re-render que ella misma dispara (comprar algo vuelve a llamar a
   openShop). Un tab en vez de dos listas apiladas: la de comida ya usa todo
   el alto disponible (`.menu-list`), y esto va a seguir creciendo con más
   mejoras — apilar las dos listas rompería ese tope. */
let shopTab = 'food';

function upgradeRow(u){
  const st = upgradeState(u.id);
  if (!st.owned){
    const alcanza = state.coins >= u.price;
    return `
      <div class="menu-item ${alcanza ? '' : 'locked'}" data-buy-upgrade="${u.id}">
        <span class="emoji">${u.emoji}</span>
        <div class="info"><b>${escapeHtml(u.name)}</b><small>${escapeHtml(u.desc)}</small></div>
        <span class="menu-record">${coinsLabel(u.price)}</span>
      </div>`;
  }
  if (!u.armable){
    return `
      <div class="menu-item locked">
        <span class="emoji">${u.emoji}</span>
        <div class="info"><b>${escapeHtml(u.name)}</b><small>${escapeHtml(u.desc)}</small></div>
        <span class="menu-record">Comprada</span>
      </div>`;
  }
  const usos = st.timesUsed ? ` · usada ${st.timesUsed} ${st.timesUsed === 1 ? 'vez' : 'veces'}` : '';
  return `
    <div class="menu-item" data-toggle-upgrade="${u.id}">
      <span class="emoji">${u.emoji}</span>
      <div class="info"><b>${escapeHtml(u.name)}</b><small>${escapeHtml(u.desc)}${usos}</small></div>
      <span class="menu-record">${st.armed ? 'Activa ✅' : 'Apagada'}</span>
    </div>`;
}

/* La próxima habitación que se puede comprar (una sola fila: la siguiente),
   o el aviso de que ya están todas. */
function roomUpgradeRow(){
  const n = state.style.rooms.length;
  if (n >= ROOM_MAX){
    return `
      <div class="menu-item locked">
        <span class="emoji">🏠</span>
        <div class="info"><b>Habitaciones</b><small>Tienes las ${ROOM_MAX}: cámbiate con las flechas de la pantalla</small></div>
        <span class="menu-record">Todas</span>
      </div>`;
  }
  const price = ROOM_PRICES[n];
  return `
    <div class="menu-item ${state.coins >= price ? '' : 'locked'}" data-buy-room>
      <span class="emoji">🏠</span>
      <div class="info"><b>Habitación ${n + 1}</b><small>Una pieza más, con sus propios muebles y adornos</small></div>
      <span class="menu-record">${coinsLabel(price)}</span>
    </div>`;
}

/* Una casilla de la pestaña Estilo. La muestra es el color mismo (carcasa y
   pantalla) o el emoji (accesorio y adorno); abajo, el precio o el estado. */
/* mode 'shop': la tienda (precio o "Tuyo"). mode 'mine': Personalizar, solo
   lo comprado, con "En uso" / "Usar". */
/* La muestra de algo de Estilo: el degradado de la carcasa, la pantalla, la
   miniatura del mueble o el emoji. La usan las fichas de la tienda y el
   pop-up de compra. */
function styleSwatch(it){
  if (it.kind === 'shell'){
    return `<span class="swatch shell" style="background:linear-gradient(150deg, ${it.colors.join(', ')})"></span>`;
  }
  if (it.kind === 'screen'){
    const [bg, hi, lit] = it.lcd;
    return `<span class="swatch lcd" style="background:radial-gradient(120% 120% at 50% 0%, ${hi}, ${bg} 70%); color:rgb(${lit})">▪▪</span>`;
  }
  if (it.kind === 'furni'){
    /* Miniatura a escala entera de px CSS (el pixel art no se reescala raro). */
    const art = FURNI_ART[it.id];
    const tw = art.thumb ? art.thumb.w : art.w, th = art.thumb ? art.thumb.h : art.h;
    const s = Math.min(3, Math.max(1, Math.floor(46 / Math.max(tw, th))));   // tope: la pelota sola salía gigante
    return `<span class="swatch furni"><img src="${furniThumb(it.id)}" alt="" style="width:${tw * s}px;height:${th * s}px"></span>`;
  }
  return `<span class="swatch emoji">${it.emoji}</span>`;
}

function styleTile(it, mode){
  const owned = state.style.owned[it.id];
  const puesto = owned && isStyleEquipped(it) && mode === 'mine';
  const swatch = styleSwatch(it);
  /* Puesto en otra habitación: tocarlo lo trae a esta. */
  const otra = mode === 'mine' && owned && !puesto && (it.kind === 'furni' || it.kind === 'deco') ? roomOf(it) : -1;
  const estado = puesto ? 'En uso' : otra >= 0 ? `En hab. ${otra + 1}` : mode === 'mine' ? 'Usar' : owned ? 'Tuyo ✓' : coinsLabel(it.price);
  const alcanza = owned || state.coins >= it.price;
  const rareza = it.gacha && typeof rarityById === 'function' ? rarityById(it.gacha) : null;
  const lugar = rareza ? `<small class="tile-slot" style="color:${rareza.color}">★ ${rareza.name}</small>`
    : it.kind === 'deco' ? `<small class="tile-slot">${DECO_SLOT_NAMES[it.slot]}</small>`
    : it.kind === 'furni' ? `<small class="tile-slot">${it.use}</small>` : '';
  return `
    <button class="style-tile ${puesto ? 'on' : ''} ${owned ? 'owned' : ''} ${alcanza ? '' : 'locked'}" data-style="${it.id}">
      ${swatch}
      <b>${escapeHtml(it.name)}</b>${lugar}
      <span class="tile-state">${estado}</span>
    </button>`;
}

function styleRows(mode){
  return STYLE_SECTIONS.map(sec => {
    /* Lo del gacha (premios.js) no se vende: en la tienda no sale. */
    const items = STYLE_ITEMS.filter(it => it.kind === sec.kind && !!it.wow === !!sec.wow &&
      (mode === 'shop' ? !it.gacha : state.style.owned[it.id]));
    const grid = items.length
      ? `<div class="style-grid">${items.map(it => styleTile(it, mode)).join('')}</div>`
      : `<p class="style-empty">Nada todavía: se compra en la tienda, pestaña Estilo.</p>`;
    return `<div class="section-label">${sec.title}</div>${grid}`;
  }).join('');
}

/* El aviso va dentro de la tarjeta y no con say(): la burbuja tiene z-index 5 y
   el overlay 10, así que un mensaje por say() con la tienda abierta queda tapado. */
function openShop(aviso, gachaRes){
  const foodRows = FOODS.map(f => {
    const alcanza = state.coins >= f.price;
    return `
      <div class="menu-item ${alcanza ? '' : 'locked'}" data-buy="${f.id}">
        <span class="emoji">${f.emoji}</span>
        <div class="info">
          <b>${escapeHtml(f.name)}</b>
          <small>${foodDesc(f)} · tienes ${foodStock(f.id)}</small>
        </div>
        <span class="menu-record">${f.price === 0 ? 'Gratis' : coinsLabel(f.price)}</span>
      </div>`;
  }).join('');
  const medAlcanza = state.coins >= MEDICINE.price;
  const medShopRow = `
      <div class="menu-item ${medAlcanza ? '' : 'locked'}" data-buy-med>
        <span class="emoji">${MEDICINE.emoji}</span>
        <div class="info">
          <b>${MEDICINE.name}</b>
          <small>Cura la enfermedad · tienes ${foodStock(MEDICINE.id)}</small>
        </div>
        <span class="menu-record">${coinsLabel(MEDICINE.price)}</span>
      </div>`;
  const upgradeRows = roomUpgradeRow() + UPGRADES.map(upgradeRow).join('');
  /* La vacuna: solo la de su etapa (la de antes ya no sirve y la de después
     todavía no). */
  const vac = vaccineFor();
  const vacShopRow = !vac ? '' : isVaccinated() ? `
      <div class="menu-item locked">
        <span class="emoji">${VACCINE_EMOJI}</span>
        <div class="info"><b>${vac.name}</b><small>Ya la tiene puesta ✓ · la próxima, al crecer</small></div>
      </div>` : `
      <div class="menu-item ${state.coins >= vac.price ? '' : 'locked'} ${state.health < SICK_LOW_HEALTH_AT ? 'urgent' : ''}" data-buy-vaccine>
        <span class="emoji">${VACCINE_EMOJI}</span>
        <div class="info">
          <b>${vac.name}</b>
          <small>Sin ella pierde ${VACCINE_HEALTH_LOSS_PER_DAY} de salud al día · se la pones al comprarla</small>
        </div>
        <span class="menu-record">${coinsLabel(vac.price)}</span>
      </div>`;

  showOverlay(`
    <h3>🛒 Tienda</h3>
    <p>${aviso ? escapeHtml(aviso) : `Tienes ${coinsLabel(state.coins)}. Se ganan jugando y en la ruleta 🎡.`}</p>
    <div class="shop-tabs">
      <button class="shop-tab ${shopTab === 'food' ? 'active' : ''}" id="shopTabFood">Comida</button>
      <button class="shop-tab ${shopTab === 'upgrades' ? 'active' : ''}" id="shopTabUpgrades">Mejoras</button>
      <button class="shop-tab ${shopTab === 'style' ? 'active' : ''}" id="shopTabStyle">Estilo</button>
      <button class="shop-tab ${shopTab === 'gacha' ? 'active' : ''}" id="shopTabGacha">Gacha</button>
    </div>
    <div class="menu-list ${shopTab === 'style' ? 'style-list' : ''}">${
      shopTab === 'food' ? foodRows + medShopRow : shopTab === 'upgrades' ? vacShopRow + upgradeRows
        : shopTab === 'gacha' ? gachaTabHtml(gachaRes) : styleRows('shop')}</div>
    <button class="overlay-btn secondary" id="btnCloseShop">Cerrar</button>
  `, hideOverlay);

  document.getElementById('shopTabFood').addEventListener('click', () => { shopTab = 'food'; openShop(); });
  document.getElementById('shopTabUpgrades').addEventListener('click', () => { shopTab = 'upgrades'; openShop(); });
  document.getElementById('shopTabStyle').addEventListener('click', () => { shopTab = 'style'; openShop(); });
  document.getElementById('shopTabGacha').addEventListener('click', () => { shopTab = 'gacha'; openShop(); });
  if (shopTab === 'gacha') wireGachaTab((msg, res) => openShop(msg, res));

  /* Las tres pestañas tienen la misma hoja, a todo el alto: así no salta al
     cambiar de pestaña y la lista tiene espacio. Antes Estilo iba sin
     desenfoque y topada al 66% (.clear) para ver lo comprado puesto atrás,
     pero la lista quedaba en la mitad de alto que las otras (109 px en un
     teléfono chico). Ponérselo y verlo puesto es en Personalizar. */
  document.getElementById('overlayCard').classList.add('sheet-full');

  /* Re-render que no pierde el scroll: comprar o cambiar algo vuelve a armar
     la hoja entera, y sin esto la lista saltaba arriba a cada toque. */
  const reopen = (msg) => {
    const scroll = document.querySelector('.overlay-card .menu-list').scrollTop;
    openShop(msg);
    document.querySelector('.overlay-card .menu-list').scrollTop = scroll;
  };

  document.querySelectorAll('[data-style]').forEach(el => {
    el.addEventListener('click', () => {
      const it = styleItemById(el.dataset.style);
      if (!state.style.owned[it.id]){
        if (state.coins < it.price){
          reopen(`Te faltan ${coinsLabel(it.price - state.coins)} para ${it.name}`);
          return;
        }
        confirmBuy({ icon: styleSwatch(it), name: it.name, price: it.price }, () => {
          state.coins -= it.price;
          state.style.owned[it.id] = true;
          const puesto = isStyleEquipped(it) || toggleStyleItem(it) === true;   // se estrena apenas se compra
          saveState(); applyStyle(); render();
          reopen();
          /* En la fila chica, un mueble va con ✨: su miniatura pixel no se
             puede achicar a un tamaño no entero sin deformarse. */
          boughtPopup({ icon: styleSwatch(it), rowIcon: it.kind === 'furni' ? '✨' : styleSwatch(it),
            name: it.name, amount: 'Nuevo', price: it.price,
            note: puesto ? 'Ya lo tiene puesto. Cámbialo cuando quieras en Personalizar.'
              : 'No había espacio para ponerlo: hazlo desde Personalizar.' });
        });
        return;
      }
      /* Lo ya comprado se pone y se saca en Personalizar, no acá: la tienda
         es solo para comprar. */
      reopen(`${it.name} ya es tuyo: póntelo o sácatelo en Personalizar`);
    });
  });

  const buyVac = document.querySelector('[data-buy-vaccine]');
  if (buyVac) buyVac.addEventListener('click', () => {
    if (state.coins < vac.price){ reopen(`Te faltan ${coinsLabel(vac.price - state.coins)} para la ${vac.name.toLowerCase()}`); return; }
    confirmBuy({ icon: VACCINE_EMOJI, name: vac.name, price: vac.price }, () => {
      state.coins -= vac.price;
      applyVaccine();
      render();
      /* Se cierra la tienda para que se vea vacunarla; el pop-up de la
         compra sale cuando termina. */
      hideOverlay();
      vaccinateFx(() => boughtPopup({ icon: VACCINE_EMOJI, name: vac.name, amount: 'Puesta ✓', price: vac.price,
        note: `Ya no pierde ${VACCINE_HEALTH_LOSS_PER_DAY} de salud al día y se va a enfermar la mitad.` }));
    });
  });

  const buyMed = document.querySelector('[data-buy-med]');
  if (buyMed) buyMed.addEventListener('click', () => {
    if (state.coins < MEDICINE.price){
      openShop(`Te faltan ${coinsLabel(MEDICINE.price - state.coins)} para ${MEDICINE.name}`);
      return;
    }
    confirmBuy({ icon: MEDICINE.emoji, name: MEDICINE.name, price: MEDICINE.price, multi: true }, n => {
      state.coins -= MEDICINE.price * n;
      state.pantry[MEDICINE.id] = foodStock(MEDICINE.id) + n;
      saveState(); render();
      reopen();
      boughtPopup({ icon: MEDICINE.emoji, name: MEDICINE.name, amount: `+${n}`, price: MEDICINE.price * n,
        note: `Ahora tienes ${foodStock(MEDICINE.id)}. Se da desde Comer.` });
    });
  });

  document.querySelectorAll('[data-buy]').forEach(el => {
    el.addEventListener('click', () => {
      const food = foodById(el.dataset.buy);
      if (state.coins < food.price){
        openShop(`Te faltan ${coinsLabel(food.price - state.coins)} para ${food.name}`);
        return;
      }
      confirmBuy({ icon: food.emoji, name: food.name, price: food.price, multi: true }, n => {
        state.coins -= food.price * n;
        state.pantry[food.id] = (state.pantry[food.id] || 0) + n;
        saveState(); render();
        reopen();
        boughtPopup({ icon: food.emoji, name: food.name, amount: `+${n}`, price: food.price * n,
          note: `Ahora tienes ${foodStock(food.id)}.` });
      });
    });
  });

  document.querySelectorAll('[data-buy-upgrade]').forEach(el => {
    el.addEventListener('click', () => {
      const upgrade = upgradeById(el.dataset.buyUpgrade);
      if (state.coins < upgrade.price){
        openShop(`Te faltan ${coinsLabel(upgrade.price - state.coins)} para ${upgrade.name}`);
        return;
      }
      confirmBuy({ icon: upgrade.emoji, name: upgrade.name, price: upgrade.price }, () => {
        state.coins -= upgrade.price;
        const st = upgradeState(upgrade.id);
        st.owned = true;
        if (upgrade.armable) st.armed = true;   // lista para usarse apenas se compra
        state.upgrades[upgrade.id] = st;
        saveState(); render();
        reopen();
        boughtPopup({ icon: upgrade.emoji, name: upgrade.name, amount: 'Nueva', price: upgrade.price,
          note: upgrade.armable ? 'Ya quedó activada.' : upgrade.desc });
      });
    });
  });

  const buyRoom = document.querySelector('[data-buy-room]');
  if (buyRoom) buyRoom.addEventListener('click', () => {
    const n = state.style.rooms.length;
    const price = ROOM_PRICES[n];
    if (state.coins < price){ openShop(`Te faltan ${coinsLabel(price - state.coins)} para la habitación ${n + 1}`); return; }
    confirmBuy({ icon: '🏠', name: `la habitación ${n + 1}`, price }, () => {
      state.coins -= price;
      state.style.rooms.push(freshRoom());
      saveState(); applyStyle(); render();
      reopen();
      boughtPopup({ icon: '🏠', name: `Habitación ${n + 1}`, amount: 'Nueva', price,
        note: 'Usa las flechas de los costados de la pantalla para ir.' });
    });
  });

  document.querySelectorAll('[data-toggle-upgrade]').forEach(el => {
    el.addEventListener('click', () => {
      const st = upgradeState(el.dataset.toggleUpgrade);
      st.armed = !st.armed;
      saveState(); render();
      openShop();
    });
  });

  document.getElementById('btnCloseShop').addEventListener('click', hideOverlay);
}

/* ===================== Personalizar =====================
   Todo lo comprado en la pestaña Estilo, en un solo lugar para ponérselo y
   sacárselo. La tienda queda solo para comprar. Como en la pestaña Estilo, el
   fondo va sin desenfoque (.clear) para ver el cambio al tiro. */
function openPersonalize(aviso){
  const varias = state.style.rooms.length > 1;
  const ayuda = varias ? `Muebles y adornos van en la habitación ${state.style.room + 1}, la que estás viendo.`
    : 'Toca algo para ponérselo o sacárselo.';
  showOverlay(`
    <h3>🎨 Personalizar${varias ? ` · Hab. ${state.style.room + 1}` : ''}</h3>
    <p class="${aviso ? 'sheet-note warn' : ''}">${aviso ? escapeHtml(aviso) : ayuda}</p>
    <div class="menu-list style-list">${styleRows('mine')}</div>
    <div class="overlay-actions">
      ${curRoom().furniture.length ? '<button class="overlay-btn" id="btnArrange">Acomodar muebles</button>' : ''}
      <button class="overlay-btn secondary" id="btnClosePersonalize">Cerrar</button>
    </div>
  `, hideOverlay);
  document.getElementById('overlay').classList.add('clear');
  document.getElementById('overlayCard').classList.add('sheet-tall');
  const arr = document.getElementById('btnArrange');
  if (arr) arr.addEventListener('click', enterArrange);

  const reopen = (msg) => {
    const scroll = document.querySelector('.overlay-card .menu-list').scrollTop;
    openPersonalize(msg);
    document.querySelector('.overlay-card .menu-list').scrollTop = scroll;
  };
  document.querySelectorAll('[data-style]').forEach(el => {
    el.addEventListener('click', () => {
      const it = styleItemById(el.dataset.style);
      const ok = toggleStyleItem(it);
      if (ok !== true){ reopen(ok); return; }
      saveState(); applyStyle(); render();
      reopen();
    });
  });
  document.getElementById('btnClosePersonalize').addEventListener('click', hideOverlay);
}

/* ===================== Overlay / setup ===================== */

/* onDismiss: si viene, tocar el fondo oscuro fuera de la hoja la cierra, como
   en cualquier app. Solo los menús que ya tienen Cerrar/Cancelar lo pasan; la
   pantalla de inicio y la de game over no, ahí no hay a dónde volver. */
function showOverlay(html, onDismiss){
  const overlay = document.getElementById('overlay');
  const card = document.getElementById('overlayCard');
  card.innerHTML = html;
  card.classList.remove('sheet-full', 'sheet-tall');
  overlay.onclick = onDismiss ? (e => { if (e.target === overlay) onDismiss(); }) : null;
  overlay.classList.remove('hidden', 'clear');
}

function hideOverlay(){
  document.getElementById('overlay').classList.add('hidden');
}

/* ===================== Pop-up de compra y de premio =====================
   Una tarjeta chica al centro, encima de todo (también de la hoja de la
   tienda o de la ruleta), para dos momentos: confirmar una compra antes de
   gastar, y mostrar lo que se consiguió (una compra, un premio de la ruleta
   o del gacha, un regalo) con cada cosa y cuánto. Antes una compra se
   avisaba con una línea dentro de la hoja que pasaba desapercibida, y se
   compraba al primer toque, sin confirmar.
   `tone`: 'reward' (celebra, con sonido), 'confirm' (pregunta) o 'lose'.
   `icon` e `items[].icon` son HTML (emoji o miniatura); el resto es texto. */
function showPopup({ tone = 'reward', icon = '', title, items = [], note = '',
                     ok = '¡Genial!', cancel = null, onOk = null, onCancel = null }){
  const el = document.getElementById('popup');
  const rows = items.map(i => `
      <div class="popup-item">
        <span class="pi-icon">${i.icon || ''}</span>
        <span class="pi-text">${escapeHtml(i.text)}</span>
        ${i.amount != null ? `<b class="pi-amount ${i.neg ? 'neg' : ''}">${escapeHtml(String(i.amount))}</b>` : ''}
      </div>`).join('');
  el.innerHTML = `
    <div class="popup-card" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      ${icon ? `<div class="popup-icon">${icon}</div>` : ''}
      <h3>${escapeHtml(title)}</h3>
      ${rows ? `<div class="popup-items">${rows}</div>` : ''}
      ${note ? `<p class="popup-note">${escapeHtml(note)}</p>` : ''}
      <div class="popup-actions">
        ${cancel ? `<button class="overlay-btn secondary" data-pop="cancel">${escapeHtml(cancel)}</button>` : ''}
        <button class="overlay-btn" data-pop="ok">${escapeHtml(ok)}</button>
      </div>
    </div>`;
  el.className = `popup ${tone}`;
  const close = fn => { el.className = 'popup hidden'; el.innerHTML = ''; if (fn) fn(); };
  el.querySelector('[data-pop="ok"]').addEventListener('click', () => close(onOk));
  const c = el.querySelector('[data-pop="cancel"]');
  if (c) c.addEventListener('click', () => close(onCancel));
  /* Tocar afuera: en una pregunta es cancelar; en un premio, cerrarlo. */
  el.onclick = e => { if (e.target === el) close(cancel ? onCancel : onOk); };
  if (tone === 'reward') rewardSound();
  else if (tone === 'lose' && typeof sfxFail === 'function') sfxFail();
}

/* Sonido de prueba del premio: un arpegio corto hacia arriba (Do-Mi-Sol-Do).
   tone() vive en juegos.js; se usa recién al tocar algo, nunca al cargar. */
function rewardSound(){
  if (typeof tone !== 'function') return;
  const t0 = (typeof audioNow === 'function' && audioNow()) || 0;
  [1046.5, 1318.5, 1568, 2093].forEach((freq, i) =>
    tone({ freq, durationMs: i === 3 ? 260 : 110, type: 'triangle', vol: 0.07, at: t0 + i * 0.08 }));
}

/* "¿Comprar X por N?" antes de gastar. Si no alcanza, quien llama ya avisó
   antes y no llega acá. */
function confirmBuy({ icon, name, price, multi = false }, onYes){
  /* Lo que se gasta por porciones (comida, medicina) deja elegir cuántas:
     de 1 hasta lo que alcance (tope 99). onYes recibe la cantidad. */
  const max = multi ? Math.max(1, Math.min(99, Math.floor(state.coins / price))) : 1;
  let n = 1;
  showPopup({
    tone: 'confirm', icon, title: `¿Comprar ${name}?`,
    items: [
      { icon: '💰', text: 'Cuesta', amount: price },
      { icon: '👛', text: 'Te quedan después', amount: state.coins - price },
    ],
    ok: 'Comprar', cancel: 'Cancelar', onOk: () => onYes(n),
  });
  if (max <= 1) return;
  const card = document.querySelector('#popup .popup-card');
  card.querySelector('.popup-items').insertAdjacentHTML('beforebegin', `
    <div class="qty" role="group" aria-label="Cantidad">
      <button class="qty-btn" data-q="-1" aria-label="Una menos">−</button>
      <b class="qty-n" aria-live="polite">1</b>
      <button class="qty-btn" data-q="1" aria-label="Una más">+</button>
      <button class="qty-max" data-q="max">Máx · ${max}</button>
    </div>`);
  const amounts = card.querySelectorAll('.pi-amount');
  const okBtn = card.querySelector('[data-pop="ok"]');
  const paint = () => {
    card.querySelector('.qty-n').textContent = n;
    amounts[0].textContent = price * n;
    amounts[1].textContent = state.coins - price * n;
    card.querySelector('[data-q="-1"]').disabled = n <= 1;
    card.querySelector('[data-q="1"]').disabled = n >= max;
    okBtn.textContent = n > 1 ? `Comprar ${n}` : 'Comprar';
  };
  card.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => {
    const q = b.dataset.q;
    n = q === 'max' ? max : Math.max(1, Math.min(max, n + Number(q)));
    paint();
  }));
  paint();
}

/* "¡Compra realizada!" con lo que llegó y lo que se pagó. */
function boughtPopup({ icon, rowIcon = icon, name, amount = '+1', price, note = '' }){
  showPopup({
    icon, title: '¡Compra realizada!', note,
    items: [
      { icon: rowIcon, text: name, amount },
      ...(price ? [{ icon: '💰', text: 'Pagaste', amount: `-${price}`, neg: true }] : []),
    ],
  });
}

let pickedSpecies = DEFAULT_SPECIES;

/* s=1 (miniatura de 32px) y no el s=2 de siempre: con 5 especies y creciendo,
   el grid de 3 columnas en dos filas a 64px ya no entraba sin scroll dentro
   del alto disponible. Sigue siendo escala entera, que es lo que importa. */
function renderSpeciesPicker(){
  return SPECIES_IDS.map(id => `
    <div class="menu-item species-item ${pickedSpecies===id ? 'selected':''}" data-species="${id}">
      <span class="species-thumb" style="${speciesThumbStyle(id, 1)}"></span>
      <div class="info"><b>${SPECIES_RAW[id].name}</b></div>
    </div>
  `).join('');
}

function askName(){
  pickedSpecies = DEFAULT_SPECIES;
  /* Los mandos (.controls) no sirven de nada todavía — no hay mascota — y sin
     mascota guardada boot() nunca corre, así que nadie los esconde: quedan ahí
     abajo sumando alto de más y la pantalla inicial termina más larga que el
     viewport del teléfono, obligando a scrollear para llegar a "Empezar". Se
     esconden acá y start() los vuelve a mostrar al arrancar boot(). */
  document.getElementById('controls').classList.add('hidden');
  document.getElementById('screen').classList.add('onboarding');
  /* Sin `autofocus`: en el teléfono abría el teclado apenas cargaba la pantalla,
     y el teclado tapa justo el selector de especies — que es lo primero que hay
     que elegir. El campo se enfoca cuando el jugador lo toca. */
  showOverlay(`
    <h3>🥚 Un nuevo Mimogoshi</h3>
    <p>¿Qué especie va a ser?</p>
    <div class="menu-list species-list" id="speciesList">${renderSpeciesPicker()}</div>
    <div><input id="nameInput" maxlength="14" placeholder="Nombre"></div>
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
    document.getElementById('controls').classList.remove('hidden');
    document.getElementById('screen').classList.remove('onboarding');
    boot();
  };
  document.getElementById('btnStart').addEventListener('click', start);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') start(); });
}

/* ===================== Modo prueba (debug) ===================== */

const STAGE_LABELS = {
  egg:'🥚 Huevo', child:'🐣 Niño', teen:'🐤 Adolescente', adult:'🐔 Adulto',
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

/* Lo que se mira al pasar el tiempo: hora simulada, cuánto se adelantó,
   etapa y las barras. */
function debugTimeInfo(){
  if (!state) return '';
  const t = new Date(Date.now() + debugClockOffsetMs);
  const hh = String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0');
  const adelanto = debugClockOffsetMs ? ` · adelantado ${durationLabel(debugClockOffsetMs)}` : '';
  const r = v => Math.round(v);
  return `🕐 ${hh}${adelanto}${isNightMode() ? ' · 🌙 noche' : ''}<br>` +
    `${STAGE_LABELS[state.stage] || state.stage}${state.sleeping ? ' · 😴 dormida' : ''}${gameOver ? ' · 💀' : ''}<br>` +
    `🍗 ${r(state.hunger)}% · 😊 ${r(state.happiness)}% · ⚡ ${r(state.energy)}% · 🧼 ${r(state.hygiene)}% · ❤️ ${r(state.health)}%${isVaccinated() ? ' 💉' : ''}`;
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

  const extraDebug = typeof duoDebugHtml === 'function' ? duoDebugHtml() : '';
  document.getElementById('debugPanelBody').innerHTML = `
    <div class="debug-panel">
      <div class="debug-section">
        <button class="debug-btn wide ${debugMode ? 'active':''}" id="dbgToggleGod">
          ${debugMode ? '✅ Stats al máximo: ON' : '⬜ Stats al máximo: OFF'}
        </button>
        <div class="debug-grid" style="margin-top:6px; grid-template-columns:1fr 1fr">
          <button class="debug-btn" data-coins="100">💰 +100 monedas</button>
          <button class="debug-btn" data-coins="1000">💰 +1000 monedas</button>
          <button class="debug-btn" id="dbgWheelTicket">🎫 +1 ticket de ruleta</button>
          <button class="debug-btn" id="dbgWheelReset">🎡 Ruleta gratis ya</button>
        </div>
        <button class="debug-btn wide" id="dbgNight" style="margin-top:6px">${
          debugForcedNight === null ? '🕐 Día/noche: hora real' : debugForcedNight ? '🌙 Día/noche: noche forzada' : '☀️ Día/noche: día forzado'}</button>
      </div>
      <div class="debug-section">
        <h4>Pasar el tiempo</h4>
        <div class="debug-time">${debugTimeInfo()}</div>
        <div class="debug-grid" style="grid-template-columns:1fr 1fr 1fr">
          <button class="debug-btn" data-skip="15">+15 min</button>
          <button class="debug-btn" data-skip="60">+1 h</button>
          <button class="debug-btn" data-skip="180">+3 h</button>
          <button class="debug-btn" data-skip="480">+8 h</button>
          <button class="debug-btn" data-skip="1440">+1 día</button>
          <button class="debug-btn" id="dbgClockReset" ${debugClockOffsetMs ? '' : 'disabled'}>🕐 Hora real</button>
        </div>
        ${debugMode ? '<div class="debug-time warn">Con "Stats al máximo" encendido las barras no bajan: apágalo para probar.</div>' : ''}
      </div>
      ${extraDebug}
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
          <button class="debug-btn" id="dbgTower">📦 Torre</button>
          <button class="debug-btn" id="dbgSky">☁️ Salto al cielo</button>
          <button class="debug-btn" id="dbgMemory">💡 Memorice</button>
          <button class="debug-btn" id="dbgCombat">⚔️ Combate (prueba)</button>
        </div>
      </div>
      <div class="debug-section">
        <h4>Otras pruebas</h4>
        <div class="debug-grid">
          <button class="debug-btn" id="dbgPoop">💩 Ensuciar</button>
          <button class="debug-btn" id="dbgGift">🎁 Regalo</button>
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
  document.getElementById('dbgTower').addEventListener('click', () => { closeDebugPanel(); startTowerGame(); });
  document.getElementById('dbgSky').addEventListener('click', () => { closeDebugPanel(); startSkyGame(); });
  document.getElementById('dbgMemory').addEventListener('click', () => { closeDebugPanel(); startMemoryGame(); });
  document.getElementById('dbgCombat').addEventListener('click', () => { closeDebugPanel(); startCombatGame(); });
  /* Para probar la tienda (muebles, estilo, juegos) sin tener que jugar
     partidas. Son monedas reales del save: no se devuelven al apagar nada. */
  document.getElementById('dbgWheelTicket').addEventListener('click', () => {
    state.wheelTickets = (state.wheelTickets || 0) + 1; saveState(); render(); renderDebugPanel();
  });
  document.getElementById('dbgWheelReset').addEventListener('click', () => {
    if (state.wheel) state.wheel.last = null; saveState(); render(); renderDebugPanel();
  });
  document.querySelectorAll('[data-coins]').forEach(el => el.addEventListener('click', () => {
    state.coins += +el.dataset.coins; saveState(); render(); renderDebugPanel();
  }));
  document.querySelectorAll('[data-skip]').forEach(el => el.addEventListener('click', () => {
    debugSkipTime(Number(el.dataset.skip) * 60 * 1000);
    renderDebugPanel();
  }));
  document.getElementById('dbgClockReset').addEventListener('click', () => {
    debugClockOffsetMs = 0; render(); renderDebugPanel();
  });
  /* Gira entre hora real → noche → día. Cambia también la simulación (el
     decaimiento y el sueño leen isNightMode()), no solo cómo se ve. */
  document.getElementById('dbgNight').addEventListener('click', () => {
    debugForcedNight = debugForcedNight === null ? true : debugForcedNight ? false : null;
    render(); renderDebugPanel();
  });
  if (typeof wireDuoDebug === 'function') wireDuoDebug();
  document.getElementById('dbgPoop').addEventListener('click', () => {
    state.poop = true; saveState(); render(); renderDebugPanel();
  });
  document.getElementById('dbgGift').addEventListener('click', () => {
    state.gift = true; saveState(); render(); renderDebugPanel();
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
  document.getElementById('btnFeed').addEventListener('click', requireAlive(toggleFoodTray));
  document.getElementById('btnSleep').addEventListener('click', requireAlive(btnSleep));
  /* La bandeja de comidas se cierra al tocar cualquier cosa fuera de ella. */
  document.addEventListener('pointerdown', (e) => {
    if (foodTrayOpen() && !e.target.closest('#foodTray, #btnFeed')) closeFoodTray();
  });
  document.getElementById('btnPlay').addEventListener('click', requireAlive(() => openGamesMenu()));
  document.getElementById('btnClean').addEventListener('click', requireAlive(btnClean));
  document.getElementById('btnShop').addEventListener('click', requireAlive(() => {
    if (vaccineDue()) shopTab = 'upgrades';   // donde está la vacuna, si es lo que avisa el 💉
    openShop();
  }));
  document.getElementById('btnStyle').addEventListener('click', requireAlive(() => openPersonalize()));
  document.getElementById('btnDebug').addEventListener('click', requireAlive(toggleDebugPanel));
  document.getElementById('btnCloseDebugSide').addEventListener('click', closeDebugPanel);
  document.getElementById('petCanvas').addEventListener('click', requireAlive(() => {
    if (state.poop) { btnClean(); return; } // tocar la caca limpia, no mima
    btnPet();
  }));
  /* stopPropagation: si no, el click burbujea hasta el listener de #screen de
     más abajo, que limpia la caca si hay una — tocar el regalo no tiene por
     qué limpiar caca de arriba. */
  document.getElementById('dayNight').addEventListener('click', (e) => {
    e.stopPropagation();   // que no limpie caca de pasada (listener de #screen)
    say(isNightMode()
      ? 'Es de noche (00:00 a 06:00): todo baja a la mitad y duerme más seguido'
      : `Es de día. De ${String(NIGHT_START_HOUR).padStart(2, '0')}:00 a ${String(NIGHT_END_HOUR).padStart(2, '0')}:00 es de noche`, 2800);
  });
  /* Cada reloj abre su ficha (ver openStatInfo). */
  document.querySelectorAll('#stats .stat').forEach(el => el.addEventListener('click', (e) => {
    e.stopPropagation();   // que no limpie caca de pasada (listener de #screen)
    if (gameOver || activeMinigame) return;
    openStatInfo(el.dataset.stat);
  }));
  /* Bitácora: el ícono del borde abre y cierra la lista; tocar fuera la cierra. */
  document.getElementById('logBtn').addEventListener('click', (e) => { e.stopPropagation(); toggleLogPanel(); });
  document.getElementById('logPanel').addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('pointerdown', (e) => {
    if (logPanelOpen() && !e.target.closest('#logPanel, #logBtn')) closeLogPanel();
  });
  /* En el teléfono el intervalo se congela con la app en segundo plano: al
     volver se pone al día de inmediato (y si fue un rato largo, la bitácora
     pestañea) en vez de esperar al próximo tick. */
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state && !gameOver){ tick(); render(); }
  });
  document.getElementById('giftFx').addEventListener('click', requireAlive((e) => {
    e.stopPropagation();
    collectGift();
  }));
  document.getElementById('btnSettings').addEventListener('click', () => openSettings());

  document.getElementById('screen').addEventListener('click', (e) => {
    if (arranging || e.target.closest('.overlay') || e.target.closest('#gameCanvas')) return;
    if (state.poop) { btnClean(); return; }
  });
}

/* Configuración (⚙️ arriba, al lado del modo prueba). Por ahora solo
   Reiniciar, que antes era una píldora abajo: destructivo, no tiene por qué
   estar a mano junto a los cuidados de todos los días. */
function openSettings(){
  showOverlay(`
    <h3>Configuración</h3>
    <div class="menu-list">
      <div class="menu-item settings-danger" id="btnReset">
        <span class="emoji">↺</span>
        <div class="info"><b>Reiniciar partida</b><small>Empezar de cero con una mascota nueva</small></div>
      </div>
    </div>
    <button class="overlay-btn secondary" id="btnCloseSettings">Cerrar</button>
  `, hideOverlay);
  document.getElementById('btnCloseSettings').addEventListener('click', hideOverlay);
  document.getElementById('btnReset').addEventListener('click', () => {
    showOverlay(`
      <h3>¿Reiniciar?</h3>
      <p>Se perderá el progreso de ${escapeHtml(state.name)}.</p>
      <div class="overlay-actions">
        <button class="overlay-btn danger" id="btnConfirmReset">Sí, reiniciar</button>
        <button class="overlay-btn secondary" id="btnCancelReset">Cancelar</button>
      </div>
    `, openSettings);
    document.getElementById('btnCancelReset').addEventListener('click', openSettings);
    document.getElementById('btnConfirmReset').addEventListener('click', () => {
      clearSave();
      location.reload();
    });
  });
}

function boot(){
  gameOver = false;
  catchUp();
  saveState();
  wireButtons();
  applyStyle();
  render();
  if (!animFrame) animFrame = requestAnimationFrame(loopRender);
  if (!tickTimer) tickTimer = setInterval(tick, TICK_MS);
}

function init(){
  installPixelIcons();
  /* Los íconos pixel de la pantalla se reparten según su tamaño: cada vez
     que cambia, se vuelven a calzar a píxeles físicos. */
  const screen = document.getElementById('screen');
  if (window.ResizeObserver) new ResizeObserver(() => { installPixelIcons(); snapPixelIcons(screen); }).observe(screen);
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
