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
const FOODS = [
  { id:'simple',   name:'Bocadillo simple', emoji:'🍬', restore:15, price:  5 },
  { id:'rica',     name:'Comida rica',      emoji:'🍗', restore:30, price: 12 },
  { id:'especial', name:'Comida especial',  emoji:'🍰', restore:50, price: 25 },
  { id:'redbull',  name:'Red Bull',         emoji:'⚡', restore: 2, energy: 20, price: 20 },
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

function foodById(id){ return FOODS.find(f => f.id === id) || FOODS[0]; }

const FOOD_ENERGY_DEFAULT = 4;
function foodDesc(f){
  const energy = f.energy ?? FOOD_ENERGY_DEFAULT;
  return `+${f.restore} de hambre` + (energy !== FOOD_ENERGY_DEFAULT ? ` · +${energy} de energía` : '');
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
  { kind:'furni',  title:'Muebles' },
  { kind:'shell',  title:'Carcasa' },
  { kind:'screen', title:'Pantalla' },
  { kind:'hat',    title:'Accesorios' },
  { kind:'deco',   title:'Decoración' },
];
const DECO_SLOT_NAMES = { pared:'pared', izq:'suelo izq.', der:'suelo der.' };

function styleItemById(id){ return STYLE_ITEMS.find(it => it.id === id); }

function freshStyle(){
  const owned = {};
  for (const it of STYLE_ITEMS) if (it.price === 0) owned[it.id] = true;
  return { owned, shell:'rosa', screen:'verde', hat:null, deco:{ pared:null, izq:null, der:null },
    furniture:[] };   // muebles puestos: [{ id, x }], x = centro como fracción del piso
}

function isStyleEquipped(it){
  const st = state.style;
  if (it.kind === 'shell') return st.shell === it.id;
  if (it.kind === 'screen') return st.screen === it.id;
  if (it.kind === 'hat') return st.hat === it.id;
  if (it.kind === 'furni') return st.furniture.some(f => f.id === it.id);
  return st.deco[it.slot] === it.id;
}

/* Carcasa y pantalla no se pueden sacar (siempre hay una); accesorio, adorno
   y mueble sí: tocar el que ya está puesto lo saca. Un mueble nuevo va al
   lugar libre del piso más cerca del centro (findFurniSpot). Devuelve true si
   se pudo, o el aviso de por qué no (ya hay FURNI_MAX, o no cabe). */
function toggleStyleItem(it){
  const st = state.style;
  if (it.kind === 'shell') st.shell = it.id;
  else if (it.kind === 'screen') st.screen = it.id;
  else if (it.kind === 'hat') st.hat = st.hat === it.id ? null : it.id;
  else if (it.kind === 'furni'){
    const i = st.furniture.findIndex(f => f.id === it.id);
    if (i >= 0){ st.furniture.splice(i, 1); return true; }
    if (st.furniture.length >= FURNI_MAX) return `Ya hay ${FURNI_MAX} muebles puestos: toca uno de los puestos para sacarlo`;
    const x = findFurniSpot(it.id, 0.5, true) ?? findFurniSpot(it.id, 0.5);
    if (x === null) return 'No cabe en el piso: acomoda los muebles o saca uno';
    st.furniture.push({ id: it.id, x });
  }
  else st.deco[it.slot] = st.deco[it.slot] === it.id ? null : it.id;
  return true;
}

/* Minijuegos del menú de Jugar. Se desbloquean con monedas, una sola vez y para
   siempre; Atrapa estrellas viene gratis de inicio porque las monedas solo se
   ganan jugando (ver finishMinigame): sin un juego abierto no habría forma de
   juntar la primera. Precios sin calibrar, un primer intento: una partida buena
   da ~7 monedas. Combate y Tap prueba no van acá — son prototipos que solo
   lanza el panel de prueba, que además se salta el bloqueo. */
const GAMES = [
  { id:'stars',      name:'Atrapa estrellas', emoji:'⭐', desc:'Esquiva la caca',          price:  0, start: () => startStarsGame() },
  { id:'basketball', name:'Baloncesto',       emoji:'🏀', desc:'Tira en el momento justo', price: 15, start: () => startBasketballGame() },
  { id:'reflex',     name:'Reflejos',         emoji:'🎯', desc:'Todo menos las bombas',    price: 25, start: () => startReflexGame() },
  { id:'tap',        name:'Tap rítmico',      emoji:'🎵', desc:'Toca al cruzar la línea',  price: 35, start: () => startTapGame() },
  { id:'snake',      name:'Snake',            emoji:'🐍', desc:'Desliza para girar',       price: 45, start: () => startSnakeGame() },
  { id:'memory',     name:'Memorice',         emoji:'💡', desc:'Repite la secuencia',      price: 55, start: () => startMemoryGame() },
];

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
const DPR = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

function stageDeviceScale(stage){
  return Math.max(1, Math.round((STAGE_CSS_PX[stage] || STAGE_CSS_PX.adult) * DPR / 32));
}
/* Sueño y energía, de abajo hacia arriba:
   - bajo ENERGY_LOCK_AT se desploma: se duerme en el acto (aunque esté
     despierta) y nada la despierta hasta que recupere un poco;
   - bajo EXHAUSTED_AT está agotada: se la puede despertar, pero mientras
     siga despierta pierde salud (EXHAUSTED_HEALTH_MULT veces el ritmo de una
     causa normal) y se la ve triste;
   - bajo SLEEPY_THRESHOLD puede quedarse dormida sola, con más probabilidad
     mientras menos energía le quede;
   - con WAKE_AT se despierta sola.
   Antes el candado era 25 y el sueño empezaba en 35: con barras de 0 a 100
   se pasaba mucho rato dormida sin poder hacer nada. Ahora el candado es
   corto (de 0 a 7 se recupera en ~4 min reales) y lo que hay entre medio
   es una decisión: despertarla cuesta salud. */
const ENERGY_LOCK_AT = 7;
const EXHAUSTED_AT = 15;
const EXHAUSTED_HEALTH_MULT = 3;
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
   (pedido explícito: que haya que atenderla más seguido), y la salud baja 2.5
   veces más lento (ver HEALTH_DECAY_PER_HOUR): las barras se vacían antes,
   pero morirse por eso tarda más. Ver CLAUDE.md para el tiempo hasta la muerte
   que da esta combinación. */
const DECAY_PER_HOUR = {
  hunger:    100 / 424.5,  // 424.5 h de juego ≈ 7.1 horas reales (antes 849, el doble)
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

/* La salud tiene dos causas de daño independientes que se suman: que alguna de
   las otras barras esté bajo HEALTH_RISK_AT, y estar enfermo. Con las dos a la
   vez la salud cae al doble. */
const HEALTH_RISK_AT = 30;
const HEALTH_DECAY_PER_HOUR = 100 / 1060;  // ~17.7 horas reales por cada causa sola (antes 424: 2.5 veces más lento)
const HEALTH_RECOVER_PER_HOUR = 0.424;     // solo si no hay ninguna causa activa

/* Probabilidad de enfermarse, por hora de juego. */
const SICK_CHANCE_PER_HOUR = 0.000566;
const SICK_CHANCE_PER_HOUR_LOW = 0.00283;
const SICK_LOW_HEALTH_AT = 60;

/* Modo nocturno: de 00:00 a 06:00 hora REAL del dispositivo (no de juego —
   es "de noche" para quien está jugando, no para la mascota), todo decae
   50% más lento y la mascota tiende a estar dormida ~75% del tiempo.
   Limitación conocida: catchUp() puede entregar de una un rango de horas
   que cruza medianoche; como applyDecay() solo mira la hora ACTUAL al
   aplicarlas (no hora por hora), un tramo nocturno adentro de un catchUp
   largo no se trata distinto del resto — el mismo compromiso que ya hace
   sleepFactor con horas acumuladas. */
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

function isNightMode(){
  if (debugForcedNight !== null) return debugForcedNight;
  const h = new Date().getHours();
  return h >= NIGHT_START_HOUR && h < NIGHT_END_HOUR;
}

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
    records: {},   // mejor puntaje por minijuego
    upgrades: freshUpgrades(),
    unlockedGames: [],   // los gratis (price 0) no hace falta anotarlos
    mega: freshMega(),
    gameXp: {},          // experiencia acumulada por juego
    gameLevelPick: {},   // nivel elegido en el menú por juego
    style: freshStyle(), // carcasa, pantalla, accesorio y adornos (pestaña Estilo)
    companion: null,     // segundo personaje en pantalla (hijo o visita), ver duo.js
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
    delete s.unlockedFoods;  // el modelo viejo era desbloqueo permanente; ahora son porciones
    if (!s.species || !SPECIES[s.species]) s.species = DEFAULT_SPECIES; // saves de especies que ya no existen
    if (!s.records || typeof s.records !== 'object') s.records = {};    // saves anteriores a los récords
    // saves de antes del desbloqueo con monedas: quedan abiertos los juegos que
    // ya se jugaron (tienen récord), para no quitarle a nadie algo que ya usaba
    if (!Array.isArray(s.unlockedGames)){
      s.unlockedGames = GAMES.filter(g => g.price > 0 && s.records[g.id] > 0).map(g => g.id);
    }
    if (!s.mega || typeof s.mega !== 'object' || !s.mega.played) s.mega = freshMega();
    if (!s.gameXp || typeof s.gameXp !== 'object') s.gameXp = {};               // saves anteriores a los niveles
    if (!s.gameLevelPick || typeof s.gameLevelPick !== 'object') s.gameLevelPick = {};
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
    if (!s.style.deco || typeof s.style.deco !== 'object') s.style.deco = { ...base.deco };
    const vale = (id, kind) => { const it = styleItemById(id); return it && it.kind === kind && s.style.owned[id]; };
    if (!vale(s.style.shell, 'shell')) s.style.shell = base.shell;
    if (!vale(s.style.screen, 'screen')) s.style.screen = base.screen;
    if (s.style.hat && !vale(s.style.hat, 'hat')) s.style.hat = null;
    for (const slot of Object.keys(base.deco)){
      const id = s.style.deco[slot];
      if (!id || !vale(id, 'deco') || styleItemById(id).slot !== slot) s.style.deco[slot] = null;
    }
    /* Antes los muebles iban en tres lugares fijos ({izq, centro, der}); ahora
       cada uno guarda su posición libre. Los de antes quedan donde estaban. */
    let muebles = s.style.furniture;
    if (muebles && !Array.isArray(muebles) && typeof muebles === 'object'){
      muebles = Object.entries(LEGACY_FURNI_SLOTS).filter(([slot]) => muebles[slot]).map(([slot, x]) => ({ id: muebles[slot], x }));
    }
    if (!Array.isArray(muebles)) muebles = [];
    const vistos = new Set();
    s.style.furniture = muebles.filter(f => f && vale(f.id, 'furni') && FURNI_ART[f.id] && !vistos.has(f.id) && vistos.add(f.id))
      .slice(0, FURNI_MAX)
      .map(f => ({ id: f.id, x: (typeof f.x === 'number' && isFinite(f.x)) ? Math.min(0.95, Math.max(0.05, f.x)) : 0.5 }));
    // acompañante: de antes no existía; uno con especie o etapa que ya no existen se descarta
    if (!s.companion || typeof s.companion !== 'object' || !SPECIES[s.companion.species]) s.companion = null;
    else {
      if (!['child', 'teen', 'adult'].includes(s.companion.stage)) s.companion.stage = 'child';
      if (typeof s.companion.name !== 'string' || !s.companion.name) s.companion.name = SPECIES_RAW[s.companion.species].name;
    }
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
  /* Solo frena el decaimiento (la mitad de lento), no la recuperación —
     dormir de noche ya recupera energía a su ritmo normal. */
  const nightFactor = isNightMode() ? NIGHT_DECAY_FACTOR : 1;
  state.hunger   = clamp(state.hunger   - hours * decayRate('hunger',    state.hunger)    * sleepFactor * nightFactor);
  state.happiness= clamp(state.happiness- hours * decayRate('happiness', state.happiness) * sleepFactor * nightFactor);
  /* Con cama puesta recupera un poco más rápido (ver "Muebles"). Se mira el
     save y no si está acostada en este momento: así vale igual en catchUp(). */
  const bedMult = state.style && Array.isArray(state.style.furniture) && state.style.furniture.some(f => f.id === 'cama') ? FURNI_BED_ENERGY_MULT : 1;
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
  if (enRiesgo)   healthDelta -= HEALTH_DECAY_PER_HOUR * nightFactor;
  if (state.sick) healthDelta -= HEALTH_DECAY_PER_HOUR * nightFactor;
  if (isExhausted()) healthDelta -= HEALTH_DECAY_PER_HOUR * EXHAUSTED_HEALTH_MULT * nightFactor;
  if (healthDelta === 0) healthDelta = HEALTH_RECOVER_PER_HOUR;
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

function catchUp(){
  const now = Date.now();
  const elapsedMs = Math.max(0, now - state.lastUpdate);
  const cappedMs = Math.min(elapsedMs, MS_PER_GAME_HOUR * 24 * 3);
  const hours = cappedMs / MS_PER_GAME_HOUR;
  applyDecay(hours);
  state.lastUpdate = now;
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
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  });
}

/* Cierra cualquier minijuego en curso a la fuerza (ej. si la mascota muere a mitad de partida) */
/* Los minijuegos de otros archivos (duo.js) registran acá su limpieza, así
   forceCloseMinigames() los cubre sin saber de ellos. */
const extraMinigameDisposers = [];

function forceCloseMinigames(){
  for (const dispose of extraMinigameDisposers) dispose();
  sgDispose();
  rxDispose();
  trDispose();
  tpDispose();
  snDispose();
  mmDispose();
  if (bb && bb.raf) cancelAnimationFrame(bb.raf);
  if (cb && cb.raf) cancelAnimationFrame(cb.raf);
  sg = null;
  bb = null;
  rx = null;
  tr = null;
  tp = null;
  sn = null;
  mm = null;
  cb = null;
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
  document.getElementById('petCoins').textContent = coinsLabel(state.coins);

  [...CARE_STATS, 'health'].forEach(k => {
    const fill = document.getElementById('fill-'+k);
    fill.style.width = clamp(state[k]) + '%';
    fill.style.backgroundColor = statColor(state[k], k);
  });
  /* Durmiendo, la barra de energía se ve cargando (franjas que avanzan y
     una flechita): sube tan poco por tick (~0.15) que el ancho solo no lo
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
    dn.textContent = night ? '🌙' : '☀️';
    dn.title = night ? 'De noche' : 'De día';
  }

  const canvas = document.getElementById('petCanvas');
  fitPetCanvas(canvas);
  const ctx = canvas.getContext('2d');
  const stage = displayStage();
  const drawn = drawSprite(ctx, stage, displayMood(), walker.frame, false, stageDeviceScale(stage),
    { w: canvas.width, h: canvas.height });
  canvas.style.left = (walker.x*100) + '%';
  canvas.style.bottom = (4 + walker.y) + 'px';
  canvas.style.transform = `translateX(-50%) scaleX(${walker.dir})`;
  canvas.style.opacity = walker.hidden ? '0' : '';
  walker.drawn = walker.hidden ? null : drawn;   // para saber si un toque cae sobre ella (muebles.js)
  updateHat(walker.drawn);
  if (typeof renderBuddy === 'function') renderBuddy();
  updateFurniture();

  /* Los botones de abajo avisan lo que hace falta (enferma, caca, sueño). */
  updateDock();

  document.getElementById('poopFx').classList.toggle('hidden', !state.poop);
  document.getElementById('giftFx').classList.toggle('hidden', !state.gift);
}

/* El canvas de la mascota mide 96x96 px CSS (eso no cambia) pero su backing
   store va en píxeles físicos, para que stageDeviceScale() pueda elegir la
   escala entera ahí. Solo toca el tamaño si cambió (asignar width borra). */
function fitPetCanvas(canvas){
  const w = Math.round(CANVAS_W * DPR), h = Math.round(CANVAS_H * DPR);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
}

let lastFrameT = 0;
function loopRender(t){
  const dt = Math.min(0.05, (t - (lastFrameT || t)) / 1000);
  lastFrameT = t;
  updateWalker(dt);
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
  room.innerHTML = Object.entries(st.deco)
    .filter(([, id]) => id && styleItemById(id))
    .map(([slot, id]) => `<span class="deco deco-${slot}">${styleItemById(id).emoji}</span>`)
    .join('');
  renderFurniture();
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
  if (!hat || !drawn || displayMood() === 'dead'){ el.classList.add('hidden'); return; }
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
  if (!tryWake()) return false;
  catchUp();
  state.pantry[food.id] = (state.pantry[food.id] || 0) - 1;
  state.hunger = clamp(state.hunger + food.restore);
  state.energy = clamp(state.energy + (food.energy ?? FOOD_ENERGY_DEFAULT));
  state.selectedFood = food.id;
  floatFx(food.emoji);
  say('¡Ñam ñam!');
  triggerPetAction('eat');
  saveState(); render();
  return true;
}

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
   que lo que ya se puede comprar barato. Nunca monedas — esas se ganan SOLO
   jugando (ver finishMinigame): si el regalo también las diera, dejaría de
   ser cierto y el tope de felicidad de los minijuegos perdería sentido. */
const GIFT_FOOD_POOL = ['rica', 'especial', 'redbull'];
const GIFT_HAPPINESS = 8;

const collectGift = () => {
  if (!tryWake()) return;
  catchUp();
  state.gift = false;

  const food = foodById(GIFT_FOOD_POOL[Math.floor(Math.random() * GIFT_FOOD_POOL.length)]);
  state.pantry[food.id] = (state.pantry[food.id] || 0) + 1;
  state.happiness = clamp(state.happiness + GIFT_HAPPINESS);

  floatFx(food.emoji);
  say(`¡Un regalo! +1 ${food.name} ${food.emoji}`);
  triggerPetAction('celebrate');
  saveState(); render();
};

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
function updateDock(){
  const sleepy = !state.sleeping && state.energy < SLEEPY_THRESHOLD;
  const want = {
    btnFeed:  { need: state.hunger < 30 || !!state.sick, badge: state.sick ? '💊' : '' },
    btnClean: { need: !!state.poop, badge: state.poop ? '💩' : '' },
    btnSleep: { need: sleepy, badge: sleepy ? 'zZ' : '', soft: !isExhausted(), asleep: !!state.sleeping },
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
  const short = { simple: 'Simple', rica: 'Rica', especial: 'Especial', redbull: 'Red Bull' };
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
    : `<small>${state.sick ? '¡Está enferma! Dale una medicina' : 'Toca para dársela · marcada, la última'}</small>`;
  tray.innerHTML = `
    <div class="tray-head"><span><b>¿Qué come?</b>${sub}</span>
      <button class="tray-close" id="trayClose">Cerrar</button></div>
    <div class="tray-foods">${foods}${med}</div>`;
  tray.querySelector('#trayClose').addEventListener('click', closeFoodTray);
  tray.querySelectorAll('[data-tray]').forEach(el => el.addEventListener('click', requireAlive(() => {
    const id = el.dataset.tray;
    if (id === MEDICINE.id){
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
    if (feedFood(id)) closeFoodTray();
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

/* Una casilla de la pestaña Estilo. La muestra es el color mismo (carcasa y
   pantalla) o el emoji (accesorio y adorno); abajo, el precio o el estado. */
/* mode 'shop': la tienda (precio o "Tuyo"). mode 'mine': Personalizar, solo
   lo comprado, con "En uso" / "Usar". */
function styleTile(it, mode){
  const owned = state.style.owned[it.id];
  const puesto = owned && isStyleEquipped(it) && mode === 'mine';
  let swatch;
  if (it.kind === 'shell'){
    swatch = `<span class="swatch shell" style="background:linear-gradient(150deg, ${it.colors.join(', ')})"></span>`;
  } else if (it.kind === 'screen'){
    const [bg, hi, lit] = it.lcd;
    swatch = `<span class="swatch lcd" style="background:radial-gradient(120% 120% at 50% 0%, ${hi}, ${bg} 70%); color:rgb(${lit})">▪▪</span>`;
  } else if (it.kind === 'furni'){
    /* Miniatura a escala entera de px CSS (el pixel art no se reescala raro). */
    const art = FURNI_ART[it.id];
    const s = Math.min(3, Math.max(1, Math.floor(46 / Math.max(art.w, art.h))));   // tope: la pelota sola salía gigante
    swatch = `<span class="swatch furni"><img src="${furniThumb(it.id)}" alt="" style="width:${art.w * s}px;height:${art.h * s}px"></span>`;
  } else {
    swatch = `<span class="swatch emoji">${it.emoji}</span>`;
  }
  const estado = puesto ? 'En uso' : mode === 'mine' ? 'Usar' : owned ? 'Tuyo ✓' : coinsLabel(it.price);
  const alcanza = owned || state.coins >= it.price;
  const lugar = it.kind === 'deco' ? `<small class="tile-slot">${DECO_SLOT_NAMES[it.slot]}</small>`
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
    const items = STYLE_ITEMS.filter(it => it.kind === sec.kind && (mode === 'shop' || state.style.owned[it.id]));
    const grid = items.length
      ? `<div class="style-grid">${items.map(it => styleTile(it, mode)).join('')}</div>`
      : `<p class="style-empty">Nada todavía: se compra en la tienda, pestaña Estilo.</p>`;
    return `<div class="section-label">${sec.title}</div>${grid}`;
  }).join('');
}

/* El aviso va dentro de la tarjeta y no con say(): la burbuja tiene z-index 5 y
   el overlay 10, así que un mensaje por say() con la tienda abierta queda tapado. */
function openShop(aviso){
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
  const upgradeRows = UPGRADES.map(upgradeRow).join('');

  showOverlay(`
    <h3>🛒 Tienda</h3>
    <p>${aviso ? escapeHtml(aviso) : `Tienes ${coinsLabel(state.coins)}. Se ganan monedas jugando.`}</p>
    <div class="shop-tabs">
      <button class="shop-tab ${shopTab === 'food' ? 'active' : ''}" id="shopTabFood">Comida</button>
      <button class="shop-tab ${shopTab === 'upgrades' ? 'active' : ''}" id="shopTabUpgrades">Mejoras</button>
      <button class="shop-tab ${shopTab === 'style' ? 'active' : ''}" id="shopTabStyle">Estilo</button>
    </div>
    <div class="menu-list ${shopTab === 'style' ? 'style-list' : ''}">${
      shopTab === 'food' ? foodRows + medShopRow : shopTab === 'upgrades' ? upgradeRows : styleRows('shop')}</div>
    <button class="overlay-btn secondary" id="btnCloseShop">Cerrar</button>
  `, hideOverlay);

  document.getElementById('shopTabFood').addEventListener('click', () => { shopTab = 'food'; openShop(); });
  document.getElementById('shopTabUpgrades').addEventListener('click', () => { shopTab = 'upgrades'; openShop(); });
  document.getElementById('shopTabStyle').addEventListener('click', () => { shopTab = 'style'; openShop(); });

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
        state.coins -= it.price;
        state.style.owned[it.id] = true;
        const puesto = isStyleEquipped(it) || toggleStyleItem(it) === true;   // se estrena apenas se compra
        saveState(); applyStyle(); render();
        reopen(puesto ? `¡${it.name} comprado y puesto! Cámbialo cuando quieras en Personalizar`
          : `¡${it.name} comprado! No había espacio: ponlo desde Personalizar`);
        return;
      }
      /* Lo ya comprado se pone y se saca en Personalizar, no acá: la tienda
         es solo para comprar. */
      reopen(`${it.name} ya es tuyo: póntelo o sácatelo en Personalizar`);
    });
  });

  const buyMed = document.querySelector('[data-buy-med]');
  if (buyMed) buyMed.addEventListener('click', () => {
    if (state.coins < MEDICINE.price){
      openShop(`Te faltan ${coinsLabel(MEDICINE.price - state.coins)} para ${MEDICINE.name}`);
      return;
    }
    state.coins -= MEDICINE.price;
    state.pantry[MEDICINE.id] = foodStock(MEDICINE.id) + 1;
    saveState(); render();
    openShop(`¡${MEDICINE.name} comprada! Te quedan ${coinsLabel(state.coins)}`);
  });

  document.querySelectorAll('[data-buy]').forEach(el => {
    el.addEventListener('click', () => {
      const food = foodById(el.dataset.buy);
      if (state.coins < food.price){
        openShop(`Te faltan ${coinsLabel(food.price - state.coins)} para ${food.name}`);
        return;
      }
      state.coins -= food.price;
      state.pantry[food.id] = (state.pantry[food.id] || 0) + 1;
      saveState(); render();
      openShop(`¡${food.name} comprada! Te quedan ${coinsLabel(state.coins)}`);
    });
  });

  document.querySelectorAll('[data-buy-upgrade]').forEach(el => {
    el.addEventListener('click', () => {
      const upgrade = upgradeById(el.dataset.buyUpgrade);
      if (state.coins < upgrade.price){
        openShop(`Te faltan ${coinsLabel(upgrade.price - state.coins)} para ${upgrade.name}`);
        return;
      }
      state.coins -= upgrade.price;
      const st = upgradeState(upgrade.id);
      st.owned = true;
      if (upgrade.armable) st.armed = true;   // lista para usarse apenas se compra
      state.upgrades[upgrade.id] = st;
      saveState(); render();
      openShop(`¡${upgrade.name} comprada! Te quedan ${coinsLabel(state.coins)}`);
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
  showOverlay(`
    <h3>🎨 Personalizar</h3>
    <p class="${aviso ? 'sheet-note warn' : ''}">${aviso ? escapeHtml(aviso) : 'Toca algo para ponérselo o sacárselo.'}</p>
    <div class="menu-list style-list">${styleRows('mine')}</div>
    <div class="overlay-actions">
      ${state.style.furniture.length ? '<button class="overlay-btn" id="btnArrange">Acomodar muebles</button>' : ''}
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
   su estado inicial (Snake, el chart del Tap rítmico). El Megajuego se juega
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

/* ===================== Minijuego 4: tap rítmico =====================
   Tres carriles, notas que bajan hasta la línea y hay que tocarlas justo cuando
   la cruzan. Como tocar de más también corta el combo, no sirve tapear a lo
   loco: hay que seguir el ritmo.

   El tempo es FIJO (TR_BPM) y todo se mide en pulsos, no en segundos sueltos:
   la negra dura TR_BEAT_SEC y una nota solo puede caer en una negra o en la
   corchea exacta del medio — nunca en un instante intermedio. Antes el chart
   aceleraba solo, y eso era lo único que subía la intensidad, pero con la
   pista acelerando no hay forma de que suene a canción. Ahora la dificultad
   escala por densidad sobre la misma grilla, que es como escalan los juegos de
   ritmo de verdad.

   De fondo suena un metrónomo (una vez por negra, con acento en el primer
   tiempo de cada compás) y el acorde de Si menor en redonda, uno por compás.
   Los dos se agendan por adelantado en el reloj de Web Audio, no frame a
   frame; y para que la pista no se despegue nunca de las notas, el tiempo del
   juego (tr.time) también sale de ese mismo reloj — ver trAdvanceClock().

   Dos tipos de nota además de la simple: dobles (dos carriles al mismo tiempo,
   hay que tocar los dos) y sostenidas (hay que mantener apretado el carril hasta
   que se completa, soltar antes corta el combo). Por eso el input dejó de ser
   solo "pointerdown dispara el golpe" (trHit) y pasó a trPress/trRelease con
   estado por carril (tr.laneDown[]) — necesario para saber si seguís
   sosteniendo, no solo si tocaste. */

const TR_LANES = 3;
const TR_LANE_CHAR = ['🍬','🎮','🧼'];
const TR_PERFECT = 0.09;      // ventana de acierto perfecto, en segundos (simétrica)
/* La ventana de acierto normal es ASIMÉTRICA a propósito. Un toque adelantado
   ahora suena cuantizado al pulso (trSfxHit recibe el `at` de la nota, no el
   del toque) así que sonar antes de tiempo no tiene costo de audio — eso deja
   margen para tolerar bastante adelanto. Uno atrasado no se puede cuantizar
   hacia atrás (tone() ya pasó ese instante): siempre suena "ya", tarde de
   verdad respecto de la pista. Por eso el lado tarde es apenas un cuarto del
   adelantado: sigue sonando, pero solo si cae bastante cerca del pulso.
   Como queda por debajo de TR_PERFECT, cualquier toque tarde aceptado ya
   cae también dentro de la ventana perfecta — del lado tarde no existe un
   "bien", o es perfecto o es fallo. */
const TR_GOOD_EARLY = 0.19;              // cuánto se puede tocar antes de la nota
const TR_GOOD_LATE = TR_GOOD_EARLY / 4;  // después: un cuarto de eso (0.0475s)

/* La grilla musical. Todo lo demás se deriva de acá: si se cambia el tempo,
   las sostenidas, la anticipación y el largo del chart se acomodan solos. */
const TR_BPM = 150;
const TR_BEAT_SEC = 60 / TR_BPM;        // la negra
const TR_EIGHTH_SEC = TR_BEAT_SEC / 2;  // la corchea: el único subdividido permitido
const TR_BEATS_PER_BAR = 4;
const TR_LEAD_IN_BEATS = 4;             // un compás de metrónomo antes de la primera nota
const TR_CHART_BARS = 16;
const TR_CHART_BEATS = TR_CHART_BARS * TR_BEATS_PER_BAR;

const TR_APPROACH = TR_BEAT_SEC * 3;    // una nota se ve venir tres pulsos antes
const TR_HOLD_SEC = TR_BEAT_SEC * 2;    // una sostenida dura una blanca (dos pulsos)
/* Dos notas más juntas que esto no pueden compartir carril: dos corcheas
   seguidas quedan a media negra (0.19s) y el lado más ancho de la ventana de
   acierto (TR_GOOD_EARLY, 0.19s) mide lo mismo, así que en el mismo carril
   serían indistinguibles. Tres cuartos de negra deja pasar el caso de negra a
   negra y bloquea el de corchea. */
const TR_MIN_SAME_LANE_GAP = TR_BEAT_SEC * 0.75;

/* Rampas de densidad {al empezar, al terminar}: esto es lo que reemplaza a la
   aceleración de la pista. */
const TR_OFFBEAT_CHANCE = [0.05, 0.55];  // corchea extra entre dos negras
const TR_DOUBLE_CHANCE  = [0.06, 0.28];  // pareja en otro carril, mismo instante
const TR_HOLD_CHANCE    = [0.05, 0.16];  // nota sostenida
/* Lo que suma cada rampa en el nivel máximo: la dificultad por nivel también es
   densidad sobre la misma grilla, nunca tempo. Los resguardos de
   trBuildChart() siguen valiendo igual. */
const TR_LEVEL_BONUS = { offbeat: 0.25, double: 0.12, hold: 0.06 };

function trRamp(rango, progress){ return rango[0] + (rango[1] - rango[0]) * progress; }

/* Instante exacto de un pulso, contando desde que arranca la partida. Se
   multiplica en vez de ir acumulando: sumar 0.379 sesenta veces arrastra error
   y deja las notas fuera de la grilla del metrónomo. */
function trBeatTime(beat){ return beat * TR_BEAT_SEC; }

/* Pista de fondo. El metrónomo son dos clicks bien cortos y agudos (fuera del
   registro de la melodía, para que no se confundan con una nota) y el acorde
   es un Si menor abierto —fundamental, quinta y tercera repartidas— bien
   despacito y con ataque lento, para que se sienta debajo sin tapar nada. */
const TR_CLICK_ACCENT = 1975.53;  // B6, el primer tiempo del compás
const TR_CLICK_BEAT   = 1479.98;  // F#6, los otros tres
const TR_PAD_CHORD    = [246.94, 369.99, 587.33];  // B3, F#4, D5
/* "Despacito" es de volumen, no de ataque: el acorde entra justo con el click
   del primer tiempo y se queda sonando bajito. Con un ataque largo el oído lo
   escucha llegar tarde aunque esté agendado en el instante exacto. */
const TR_PAD_VOL = 0.032;
const TR_PAD_ATTACK_MS = 12;
const TR_SCHEDULE_AHEAD = 0.25;   // segundos de pista que se agendan por adelantado
/* Se arranca la pista unos milisegundos en el futuro para que el pulso 0 caiga
   siempre por delante del reloj de audio: si se agendara en el instante exacto
   en que empieza la partida, el primer frame ya lo dejaría en el pasado. */
const TR_START_DELAY = 0.08;

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
const TR_SCALE = [
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
const TR_NOTES_PER_LANE = 3;

/* `at` es el instante de LA NOTA en la grilla (tr.audioStart + mejor.t), no el
   instante del toque: si sonara cuando tocás, un acierto adelantado (dentro
   de la ventana pero antes del pulso) se escucharía desalineado del
   metrónomo aunque el juego lo cuente como bueno. tone() ya recorta `at` al
   presente si quedó en el pasado (tocaste tarde: ahí sí suena "ya", no hay
   forma de sonar hacia atrás), así que solo esto arregla el caso adelantado,
   que es el que se nota más. */
function trSfxHit(pitch, perfecto, at){
  if (perfecto){
    /* Tríada de la escala: la nota con su 3ª y su 5ª, las tres a la vez. Cada
       voz va más bajita que un tono suelto (tres osciladores al volumen de uno
       saturan) y en triangular en vez de cuadrada, que apiladas embarran. */
    tone({ freq: TR_SCALE[pitch],     durationMs: 220, type: 'triangle', vol: 0.09, at });
    tone({ freq: TR_SCALE[pitch + 2], durationMs: 220, type: 'triangle', vol: 0.07, at });
    tone({ freq: TR_SCALE[pitch + 4], durationMs: 220, type: 'triangle', vol: 0.06, at });
    return;
  }
  tone({ freq: TR_SCALE[pitch], durationMs: 90, type: 'square', vol: 0.10, at });
}

/* Fallo: el tritono contra la tónica (Fa natural con Si), la única cosa acá
   adentro que está fuera de escala a propósito — no hay forma de confundirlo
   con un acierto ni de que suene "bien por casualidad". */
function trSfxFail(){
  beep(349.23, 140, 'sawtooth', 0.10);  // F4
  beep(493.88, 140, 'sawtooth', 0.07);  // B4
}

let tr = null;

/* Chart generado, no fijo: la grilla rítmica es siempre la misma (tempo
   constante) pero los carriles, los tonos y qué posiciones se rellenan cambian
   en cada partida, así no se memoriza la secuencia en dos vueltas.

   Dos resguardos para que ningún fallo sea culpa del generador y no del
   jugador:
   - `busyUntil[carril]`: hasta cuándo sigue tomado un carril por una sostenida
     en curso. Ninguna nota nueva —ni la pareja de una doble— se agenda ahí
     mientras dure, porque con el dedo todavía puesto sería imposible de tocar.
   - `TR_MIN_SAME_LANE_GAP`: dos notas muy seguidas nunca comparten carril, o
     sus ventanas de acierto se pisarían.
   Verificado por simulación pura: 0 solapamientos y 0 pares del mismo carril
   demasiado juntos en 3000 charts generados. */
function trBuildChart(){
  const notes = [];
  const busyUntil = [0, 0, 0];
  let recentLanes = [];   // carriles de la última emisión...
  let recentT = -99;      // ...y cuándo fue, para no repetir carril si quedan muy juntas

  /* Devuelve null si no hay ningún carril donde la nota sea justa. El que
     llama simplemente no la agenda: un silencio en la grilla es preferible a
     una nota imposible. `excluir` lo usa la pareja de una doble para no caer
     sobre su propia compañera. */
  const pickLane = (t, excluir = []) => {
    const libres = [0, 1, 2].filter(l => busyUntil[l] <= t && !excluir.includes(l));
    if (!libres.length) return null;
    const sinRepetir = libres.filter(l => !recentLanes.includes(l));
    let pool = libres;
    if (t - recentT < TR_MIN_SAME_LANE_GAP){
      if (!sinRepetir.length) return null;   // muy junta y sin carril libre distinto
      pool = sinRepetir;                     // muy juntas: obligado a cambiar
    } else if (sinRepetir.length && Math.random() < 0.78){
      pool = sinRepetir;                     // separadas: casi siempre cambia igual
    }
    return pool[Math.floor(Math.random() * pool.length)];
  };

  /* El tono sale de las tres notas del carril, sorteado cada vez: puede repetir
     el de la nota anterior sin problema, todas son de la misma escala.
     Una sostenida deja el carril tomado hasta un poco DESPUÉS de terminar, no
     justo al terminar: si no, la nota siguiente caería en el mismo instante en
     que hay que soltar, y habría que soltar y volver a apretar sin margen. */
  const push = (t, lane, holdSec) => {
    const pitch = lane * TR_NOTES_PER_LANE + Math.floor(Math.random() * TR_NOTES_PER_LANE);
    notes.push({ t, lane, pitch, judged: false, hold: holdSec > 0, holding: false, holdSec });
    if (holdSec > 0) busyUntil[lane] = t + holdSec + TR_MIN_SAME_LANE_GAP;
    return lane;
  };

  /* Se recorre por número de pulso, no acumulando segundos: cada nota cae en
     una negra (trBeatTime(b)) o en la corchea exacta del medio (b + 0.5), y
     nunca en un instante intermedio. */
  for (let b = 0; b < TR_CHART_BEATS; b++){
    const progress = b / TR_CHART_BEATS;
    const t = trBeatTime(TR_LEAD_IN_BEATS + b);

    const lane = pickLane(t);
    if (lane === null) continue;             // grilla ocupada: queda un silencio

    const esHold = Math.random() < trRamp(TR_HOLD_CHANCE, progress) + TR_LEVEL_BONUS.hold*levelT();
    push(t, lane, esHold ? TR_HOLD_SEC : 0);
    const usados = [lane];

    if (!esHold && Math.random() < trRamp(TR_DOUBLE_CHANCE, progress) + TR_LEVEL_BONUS.double*levelT()){
      const pareja = pickLane(t, [lane]);
      if (pareja !== null) usados.push(push(t, pareja, 0));
    }
    recentLanes = usados;
    recentT = t;

    /* Contratiempo: la corchea justo al medio de las dos negras. Siempre nota
       simple — si además pudiera ser doble o sostenida, la parte densa del
       final se vuelve ilegible. */
    if (Math.random() < trRamp(TR_OFFBEAT_CHANCE, progress) + TR_LEVEL_BONUS.offbeat*levelT()){
      const tOff = trBeatTime(TR_LEAD_IN_BEATS + b + 0.5);
      const laneOff = pickLane(tOff);
      if (laneOff !== null){
        recentLanes = [push(tOff, laneOff, 0)];
        recentT = tOff;
      }
    }
  }
  return notes;
}

function startTapGame(){
  const { gc, ctx } = enterMinigame('tap');

  /* Se prende el audio ACÁ y no en el loop: esto corre dentro del gesto del
     usuario (el toque que abrió el minijuego), que es cuando el navegador deja
     arrancar un AudioContext. Si se esperara al primer frame, el contexto
     podría quedar suspendido y perderse el primer compás del metrónomo. */
  const audioT0 = audioNow();

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
    laneDown: [false, false, false],   // qué carriles están apretados ahora mismo (para las sostenidas)
    canvasPointers: new Map(),          // pointerId -> carril, para soltar el que corresponde al tocar la pantalla
    /* El pulso visual late en cada negra, igual que el metrónomo: es el mismo
       compás, una vez visto y otra escuchado. Late aunque el jugador no toque
       nada — es metrónomo, no feedback de puntería. */
    pulse: 0,
    nextPulseBeat: 0,
    /* Agenda de la pista de fondo: `nextBeat` es el próximo pulso todavía sin
       agendar, `audioStart` el instante del reloj de audio en que empezó la
       partida (null hasta que el navegador deja arrancar el AudioContext). */
    nextBeat: 0,
    audioStart: audioT0 === null ? null : audioT0 + TR_START_DELAY,
    totalBeats: TR_LEAD_IN_BEATS + TR_CHART_BEATS,
    pointer: makeCanvasPointer(gc),
    raf: null,
    lastT: 0,
  };
  tr.speed = (tr.hitY + 26) / TR_APPROACH; // px/s para que la nota tarde TR_APPROACH

  /* Un botón por carril, abajo. Tocar la pantalla sigue funcionando para quien
     prefiera apuntar al carril directamente — con dos carriles al mismo tiempo
     (dobles) hace falta que ambos, botones y canvas, soporten multitouch, por
     eso el canvas trackea pointerId->carril en vez de un solo puntero. */
  tr.onDown = (e) => {
    e.preventDefault();
    const { x } = tr.pointer.at(e);
    const lane = Math.max(0, Math.min(TR_LANES-1, Math.floor(x / tr.laneW)));
    tr.canvasPointers.set(e.pointerId, lane);
    trPress(lane);
  };
  tr.onUp = (e) => {
    const lane = tr.canvasPointers.get(e.pointerId);
    if (lane === undefined) return;
    tr.canvasPointers.delete(e.pointerId);
    trRelease(lane);
  };
  gc.addEventListener('pointerdown', tr.onDown);
  gc.addEventListener('pointerup', tr.onUp);
  gc.addEventListener('pointercancel', tr.onUp);

  const cont = showGameControls(`
    <div class="gbtn-row">
      ${TR_LANE_CHAR.map((c, i) => `<button class="gbtn" data-lane="${i}">${c}</button>`).join('')}
    </div>
  `);
  /* No usa wireGameButton: ese helper solo ata pointerdown, y las sostenidas
     necesitan también el soltar. pointerleave cubre el dedo que se arrastra
     fuera del botón sin pasar por un pointerup prolijo. */
  cont.querySelectorAll('[data-lane]').forEach(el => {
    const lane = +el.dataset.lane;
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); trPress(lane); });
    el.addEventListener('pointerup', () => trRelease(lane));
    el.addEventListener('pointercancel', () => trRelease(lane));
    el.addEventListener('pointerleave', () => trRelease(lane));
  });

  const KEY_LANE = { '1':0, '2':1, '3':2, a:0, s:1, d:2, ArrowLeft:0, ArrowDown:1, ArrowRight:2 };
  tr.onKeyDown = (e) => {
    const idx = KEY_LANE[e.key];
    if (idx !== undefined){ e.preventDefault(); trPress(idx); }
  };
  tr.onKeyUp = (e) => {
    const idx = KEY_LANE[e.key];
    if (idx !== undefined) trRelease(idx);
  };
  window.addEventListener('keydown', tr.onKeyDown);
  window.addEventListener('keyup', tr.onKeyUp);

  say('¡Toca al ritmo! Las celestes hay que mantenerlas apretadas');
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

/* pointerdown/keydown de un carril. Si ya estaba apretado no hace nada — el
   auto-repeat del teclado dispara keydown a repetición mientras se mantiene
   una tecla, y sin este freno cada repetición se juzgaba como un toque sin
   nota (fallo) apenas se resolvía la nota original. */
function trPress(lane){
  if (!tr || tr.laneDown[lane]) return;
  tr.laneDown[lane] = true;
  tr.lanePulse[lane] = 0.18;

  /* La nota sin juzgar más cercana en el tiempo, dentro de ese carril. Una
     sostenida ya empezada (n.holding) no cuenta: se resuelve sola en trLoop
     con el soltar, no con un segundo toque. */
  let mejor = null, mejorDist = Infinity;
  for (const n of tr.notes){
    if (n.judged || n.holding || n.lane !== lane) continue;
    const dist = Math.abs(n.t - tr.time);
    if (dist < mejorDist){ mejorDist = dist; mejor = n; }
  }

  /* mejorDist ya encontró la nota más cercana en cualquier dirección; ahora
     hay que aceptarla o no según de qué lado quedó el toque. Positivo =
     tocaste tarde (dist > 0), negativo = temprano. */
  const dist = mejor ? tr.time - mejor.t : 0;
  if (!mejor || dist > TR_GOOD_LATE || dist < -TR_GOOD_EARLY){
    tr.combo = 0;                    // tocar cuando no hay nota corta la racha
    trJudge('fallo', '#ff8f8f');
    trSfxFail();
    return;
  }

  // el sonido va SIEMPRE en el pulso de la nota, no en el instante del toque
  const at = tr.audioStart === null ? 0 : tr.audioStart + mejor.t;

  if (mejor.hold){
    // arranca la sostenida: se completa o falla en trLoop, no acá
    mejor.holding = true;
    trJudge('¡mantené!', '#8fd0ff');
    tr.fx.push({ char: TR_LANE_CHAR[lane], x: (lane + 0.5) * tr.laneW, y: tr.hitY, vy: -40, life: 0.4 });
    trSfxHit(mejor.pitch, false, at);
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
  trSfxHit(mejor.pitch, perfecto, at);
}

/* Soltar un carril. Si había una sostenida en curso ahí, trLoop se entera por
   tr.laneDown y la corta la próxima vez que la chequea — no hace falta buscar
   la nota acá también. */
function trRelease(lane){
  if (!tr) return;
  tr.laneDown[lane] = false;
}

/* El reloj del juego sale del AudioContext, no de sumar el dt de cada frame:
   la pista se agenda en el reloj de audio, así que si las notas corrieran por
   otro reloj se despegarían apenas el navegador saltee un frame (y el dt viene
   con tope de 0.05s, o sea que con la pestaña trabada se atrasa a propósito).
   Mientras el AudioContext no arranque —los navegadores lo dejan suspendido
   hasta que hay un gesto del usuario— se usa el dt acumulado, y al enganchar
   se descuenta lo ya transcurrido para que no pegue un salto. */
function trAdvanceClock(dt){
  const now = audioNow();
  if (now === null){ tr.time += dt; return; }
  if (tr.audioStart === null) tr.audioStart = now - tr.time;
  tr.time = now - tr.audioStart;
}

/* Agenda la pista de fondo un poco por adelantado (TR_SCHEDULE_AHEAD): el
   metrónomo en cada negra —con acento en el primer tiempo del compás— y el
   acorde de Si menor en redonda, uno por compás. Se agenda con instantes
   absolutos del reloj de audio, que es lo único que suena parejo; disparar un
   metrónomo desde el frame lo deja tembleque. */
function trScheduleTrack(){
  if (tr.audioStart === null) return;
  const now = audioNow();
  if (now === null) return;

  while (tr.nextBeat < tr.totalBeats && trBeatTime(tr.nextBeat) < tr.time + TR_SCHEDULE_AHEAD){
    const beat = tr.nextBeat++;
    const at = tr.audioStart + trBeatTime(beat);
    /* Si ese pulso ya pasó (el audio arrancó tarde, o la pestaña estuvo
       trabada), se saltea. Agendarlo igual no lo pone en su lugar: tone() lo
       correría al presente y sonaría un montón de clicks amontonados. */
    if (at < now) continue;

    const acento = beat % TR_BEATS_PER_BAR === 0;
    tone({
      freq: acento ? TR_CLICK_ACCENT : TR_CLICK_BEAT,
      durationMs: acento ? 45 : 28,
      type: 'sine',
      vol: acento ? 0.055 : 0.03,
      at,
    });

    if (acento){
      for (const freq of TR_PAD_CHORD){
        tone({
          freq,
          durationMs: TR_BEAT_SEC * TR_BEATS_PER_BAR * 1000 * 0.92,
          type: 'triangle',
          vol: TR_PAD_VOL,
          at,
          attackMs: TR_PAD_ATTACK_MS,
        });
      }
    }
  }
}

function trLoop(t){
  if (activeMinigame !== 'tap' || !tr) return;
  const dt = Math.min(0.05, (t - (tr.lastT || t)) / 1000);
  tr.lastT = t;
  trAdvanceClock(dt);
  trScheduleTrack();

  /* Sostenidas en curso: se resuelven acá, no en trPress/trRelease, porque
     "completarla" depende del tiempo transcurrido y "fallarla soltando antes"
     depende de tr.laneDown — ambas cosas solo se saben mirando cada frame. */
  for (const n of tr.notes){
    if (!n.holding || n.judged) continue;
    if (tr.time >= n.t + n.holdSec){
      n.judged = true;
      n.holding = false;
      tr.combo += 1;
      if (tr.combo > tr.bestCombo) tr.bestCombo = tr.combo;
      tr.hits += 1;
      tr.perfects += 1;               // una sostenida completa cuenta como perfecta
      tr.score += 4 * trMultiplier(); // vale más que una simple: hay que sostenerla, no solo tocarla
      trJudge('¡PERFECTO!', '#ffe66d');
      tr.fx.push({ char: TR_LANE_CHAR[n.lane], x: (n.lane + 0.5) * tr.laneW, y: tr.hitY, vy: -55, life: 0.5 });
      trSfxHit(n.pitch, true);
    } else if (!tr.laneDown[n.lane]){
      n.judged = true;
      n.holding = false;
      tr.combo = 0;
      trJudge('soltaste antes', '#ff8f8f');
      trSfxFail();
    }
  }

  /* Pulso de fondo: uno por negra, el mismo compás que marca el metrónomo, y
     más marcado en el primer tiempo. Late toque o no toque el jugador — es
     metrónomo visual, no feedback de puntería. */
  while (tr.nextPulseBeat < tr.totalBeats && trBeatTime(tr.nextPulseBeat) <= tr.time){
    tr.pulse = (tr.nextPulseBeat % TR_BEATS_PER_BAR === 0) ? 1 : 0.55;
    tr.nextPulseBeat++;
  }
  if (tr.pulse > 0) tr.pulse = Math.max(0, tr.pulse - dt * 5);

  const gc = tr.gc, ctx = tr.ctx;
  ctx.clearRect(0, 0, gc.width, gc.height);

  if (tr.pulse > 0){
    ctx.fillStyle = `rgba(255,255,255,${tr.pulse * 0.10})`;
    ctx.fillRect(0, 0, gc.width, gc.height);
  }

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
     dónde tiene que estar la nota al tocar en vez de adivinarlo. Asimétrica
     como la ventana real: hacia arriba de la línea (nota que todavía baja,
     toque temprano) llega más lejos que hacia abajo (nota que ya pasó, toque
     tarde). La línea se engrosa con el pulso: es el mismo "metrónomo" de
     arriba, solo que acá se ve justo donde hay que estar mirando. */
  const bandaArriba = TR_GOOD_EARLY * tr.speed;
  const bandaAbajo = TR_GOOD_LATE * tr.speed;
  ctx.fillStyle = 'rgba(255,230,109,.10)';
  ctx.fillRect(0, tr.hitY - bandaArriba, gc.width, bandaArriba + bandaAbajo);
  ctx.fillStyle = `rgba(255,230,109,${0.55 + tr.pulse*0.4})`;
  const grosor = 2 + tr.pulse*3;
  ctx.fillRect(0, tr.hitY - grosor/2, gc.width, grosor);
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
    if (n.judged) continue;
    const falta = n.t - tr.time;                   // >0 todavía viene bajando
    /* Una sostenida ya empezada no se juzga por estas dos reglas (ni "todavía
       no entra en pantalla" ni "se pasó de largo, fallo"): mientras se está
       sosteniendo, falta ya es negativo por diseño, y quien la resuelve es el
       bloque de arriba, no esto. */
    if (!n.holding){
      if (falta > TR_APPROACH) break;               // aún no entra en pantalla
      if (falta < -TR_GOOD_LATE){                    // se pasó de largo: fallo
        n.judged = true;
        tr.combo = 0;
        trJudge('fallo', '#ff8f8f');
        trSfxFail();
        continue;
      }
    }
    const y = n.holding ? tr.hitY : tr.hitY - falta * tr.speed;
    const x = (n.lane + 0.5) * tr.laneW;

    if (n.hold){
      /* Cola por encima de la cabeza: su largo es cuánto hay que sostenerla.
         Mientras se sostiene, se va acortando a medida que falta menos. */
      const restante = n.holding ? Math.max(0, (n.t + n.holdSec) - tr.time) : n.holdSec;
      ctx.fillStyle = 'rgba(143,208,255,.35)';
      ctx.fillRect(x-5, y - restante*tr.speed, 10, restante*tr.speed);
    }

    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI*2);
    ctx.fillStyle = n.hold ? 'rgba(143,208,255,.28)' : 'rgba(255,230,109,.16)';
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
  tr.gc.removeEventListener('pointerup', tr.onUp);
  tr.gc.removeEventListener('pointercancel', tr.onUp);
  window.removeEventListener('keydown', tr.onKeyDown);
  window.removeEventListener('keyup', tr.onKeyUp);
  tr.pointer.dispose();
  if (tr.raf) cancelAnimationFrame(tr.raf);
}

function endTapGame(){
  const score = tr ? tr.score : 0;
  const bestCombo = tr ? tr.bestCombo : 0;
  const perfects = tr ? tr.perfects : 0;
  trDispose();
  tr = null;

  const message = score > 0
    ? `${score} pts · ${perfects} perfectos (combo ${bestCombo})`
    : 'Se te fue el ritmo…';

  finishMinigame('tap', { score, merit: score * 0.13, energyCost: 20, message });
}

/* ===================== Prototipo: Tap prueba =====================
   Variante de prueba del Tap rítmico, para probar si una melodía
   compuesta a mano (en vez de un tono al azar por nota) y una progresión de
   acordes (en vez de un Bm fijo) hacen que suene más a canción de verdad.
   Todo lo demás — grilla rítmica, rampas de dificultad, ventanas de
   acierto, holds/dobles, input — es EXACTAMENTE el mismo sistema que ya
   está probado en el tap rítmico real (comparten hasta las funciones de
   sonido, trSfxHit/trSfxFail). Solo se lanza desde el panel de prueba
   (dbgTapPrueba), a propósito: es para escuchar la idea antes de decidir si
   reemplaza al tap rítmico real. */

/* Frase de 4 compáses en Si menor natural, compuesta a mano (índices dentro
   de TR_SCALE: 1=B4, 3=D5, 5=F#5, 7=A5, etc). Se repite en loop mientras dura
   el chart. Compás 1 sube (tónica-3ª-5ª-7ª), compás 2 baja por grados,
   compás 3 rebota en tensión y el compás 4 baja y resuelve otra vez en la
   tónica antes de repetir. */
const TP_LOOP_BEATS = 16;   // 4 compáses de 4 negras
const TP_MELODY = [
  1, 3, 5, 7,   // compás 1: B  D  F#  A   (sube)
  6, 5, 4, 3,   // compás 2: G  F#  E  D   (baja)
  4, 5, 6, 5,   // compás 3: E  F#  G  F#  (rebote)
  4, 3, 2, 1,   // compás 4: E  D  C#  B   (baja y resuelve)
];

/* Una corchea a mitad de camino entre dos negras no tiene nota propia en la
   melodía: toma la del pulso que viene (anticipación), un recurso melódico
   normal y más simple que componer 32 notas en vez de 16. */
function tpPitchAt(beat){
  const base = Math.floor(beat);
  const esCorchea = beat - base > 0.25;
  const pos = ((base % TP_LOOP_BEATS) + TP_LOOP_BEATS) % TP_LOOP_BEATS;
  return esCorchea ? TP_MELODY[(pos + 1) % TP_LOOP_BEATS] : TP_MELODY[pos];
}

/* Progresión i-VI-III-VII en Si menor natural (Bm-G-D-A), un acorde por
   compás, en vez del Bm fijo del tap rítmico real. Mismo voicing abierto que
   TR_PAD_CHORD (fundamental, quinta, tercera una octava arriba). */
const TP_CHORDS = [
  [246.94, 369.99, 587.33],  // Bm (i):   B3, F#4, D5
  [196.00, 293.66, 493.88],  // G  (VI):  G3, D4,  B4
  [146.83, 220.00, 369.99],  // D  (III): D3, A3,  F#4
  [110.00, 164.81, 277.18],  // A  (VII): A2, E3,  C#4
];

let tp = null;

/* Idéntico a trBuildChart en carriles/timing/dificultad — el único cambio
   real es que push() ya no sortea el tono, lo saca de tpPitchAt(beat) según
   la posición dentro del compás. */
function tpBuildChart(){
  const notes = [];
  const busyUntil = [0, 0, 0];
  let recentLanes = [];
  let recentT = -99;

  const pickLane = (t, excluir = []) => {
    const libres = [0, 1, 2].filter(l => busyUntil[l] <= t && !excluir.includes(l));
    if (!libres.length) return null;
    const sinRepetir = libres.filter(l => !recentLanes.includes(l));
    let pool = libres;
    if (t - recentT < TR_MIN_SAME_LANE_GAP){
      if (!sinRepetir.length) return null;
      pool = sinRepetir;
    } else if (sinRepetir.length && Math.random() < 0.78){
      pool = sinRepetir;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const push = (t, lane, holdSec, beat) => {
    const pitch = tpPitchAt(beat);
    notes.push({ t, lane, pitch, judged: false, hold: holdSec > 0, holding: false, holdSec });
    if (holdSec > 0) busyUntil[lane] = t + holdSec + TR_MIN_SAME_LANE_GAP;
    return lane;
  };

  for (let b = 0; b < TR_CHART_BEATS; b++){
    const progress = b / TR_CHART_BEATS;
    const t = trBeatTime(TR_LEAD_IN_BEATS + b);

    const lane = pickLane(t);
    if (lane === null) continue;

    const esHold = Math.random() < trRamp(TR_HOLD_CHANCE, progress);
    push(t, lane, esHold ? TR_HOLD_SEC : 0, b);
    const usados = [lane];

    if (!esHold && Math.random() < trRamp(TR_DOUBLE_CHANCE, progress)){
      const pareja = pickLane(t, [lane]);
      if (pareja !== null) usados.push(push(t, pareja, 0, b));
    }
    recentLanes = usados;
    recentT = t;

    if (Math.random() < trRamp(TR_OFFBEAT_CHANCE, progress)){
      const tOff = trBeatTime(TR_LEAD_IN_BEATS + b + 0.5);
      const laneOff = pickLane(tOff);
      if (laneOff !== null){
        recentLanes = [push(tOff, laneOff, 0, b + 0.5)];
        recentT = tOff;
      }
    }
  }
  return notes;
}

function startTapPruebaGame(){
  const { gc, ctx } = enterMinigame('tapPrueba');
  const audioT0 = audioNow();

  tp = {
    ctx, gc,
    notes: tpBuildChart(),
    fx: [],
    score: 0,
    combo: 0,
    bestCombo: 0,
    perfects: 0,
    hits: 0,
    laneW: gc.width / TR_LANES,
    hitY: gc.height - 26,
    time: 0,
    cursor: 0,
    endAt: 0,
    judgeText: '',
    judgeColor: '#fff',
    judgeUntil: 0,
    lanePulse: [0, 0, 0],
    laneDown: [false, false, false],
    canvasPointers: new Map(),
    pulse: 0,
    nextPulseBeat: 0,
    nextBeat: 0,
    audioStart: audioT0 === null ? null : audioT0 + TR_START_DELAY,
    totalBeats: TR_LEAD_IN_BEATS + TR_CHART_BEATS,
    pointer: makeCanvasPointer(gc),
    raf: null,
    lastT: 0,
  };
  tp.speed = (tp.hitY + 26) / TR_APPROACH;

  tp.onDown = (e) => {
    e.preventDefault();
    const { x } = tp.pointer.at(e);
    const lane = Math.max(0, Math.min(TR_LANES-1, Math.floor(x / tp.laneW)));
    tp.canvasPointers.set(e.pointerId, lane);
    tpPress(lane);
  };
  tp.onUp = (e) => {
    const lane = tp.canvasPointers.get(e.pointerId);
    if (lane === undefined) return;
    tp.canvasPointers.delete(e.pointerId);
    tpRelease(lane);
  };
  gc.addEventListener('pointerdown', tp.onDown);
  gc.addEventListener('pointerup', tp.onUp);
  gc.addEventListener('pointercancel', tp.onUp);

  const cont = showGameControls(`
    <div class="gbtn-row">
      ${TR_LANE_CHAR.map((c, i) => `<button class="gbtn" data-lane="${i}">${c}</button>`).join('')}
    </div>
  `);
  cont.querySelectorAll('[data-lane]').forEach(el => {
    const lane = +el.dataset.lane;
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); tpPress(lane); });
    el.addEventListener('pointerup', () => tpRelease(lane));
    el.addEventListener('pointercancel', () => tpRelease(lane));
    el.addEventListener('pointerleave', () => tpRelease(lane));
  });

  const KEY_LANE = { '1':0, '2':1, '3':2, a:0, s:1, d:2, ArrowLeft:0, ArrowDown:1, ArrowRight:2 };
  tp.onKeyDown = (e) => {
    const idx = KEY_LANE[e.key];
    if (idx !== undefined){ e.preventDefault(); tpPress(idx); }
  };
  tp.onKeyUp = (e) => {
    const idx = KEY_LANE[e.key];
    if (idx !== undefined) tpRelease(idx);
  };
  window.addEventListener('keydown', tp.onKeyDown);
  window.addEventListener('keyup', tp.onKeyUp);

  say('Prueba: melodía fija + acordes en progresión');
  tp.raf = requestAnimationFrame(tpLoop);
}

function tpMultiplier(){
  return Math.min(4, 1 + Math.floor(tp.combo / 10));
}

function tpJudge(text, color){
  tp.judgeText = text;
  tp.judgeColor = color;
  tp.judgeUntil = tp.time + 0.5;
}

function tpPress(lane){
  if (!tp || tp.laneDown[lane]) return;
  tp.laneDown[lane] = true;
  tp.lanePulse[lane] = 0.18;

  let mejor = null, mejorDist = Infinity;
  for (const n of tp.notes){
    if (n.judged || n.holding || n.lane !== lane) continue;
    const dist = Math.abs(n.t - tp.time);
    if (dist < mejorDist){ mejorDist = dist; mejor = n; }
  }

  const dist = mejor ? tp.time - mejor.t : 0;
  if (!mejor || dist > TR_GOOD_LATE || dist < -TR_GOOD_EARLY){
    tp.combo = 0;
    tpJudge('fallo', '#ff8f8f');
    trSfxFail();
    return;
  }

  const at = tp.audioStart === null ? 0 : tp.audioStart + mejor.t;

  if (mejor.hold){
    mejor.holding = true;
    tpJudge('¡mantené!', '#8fd0ff');
    tp.fx.push({ char: TR_LANE_CHAR[lane], x: (lane + 0.5) * tp.laneW, y: tp.hitY, vy: -40, life: 0.4 });
    trSfxHit(mejor.pitch, false, at);
    return;
  }

  mejor.judged = true;
  tp.combo += 1;
  if (tp.combo > tp.bestCombo) tp.bestCombo = tp.combo;
  tp.hits += 1;

  const perfecto = mejorDist <= TR_PERFECT;
  if (perfecto) tp.perfects += 1;
  tp.score += (perfecto ? 3 : 1) * tpMultiplier();
  tpJudge(perfecto ? '¡PERFECTO!' : 'bien', perfecto ? '#ffe66d' : '#c8f2c2');
  tp.fx.push({ char: TR_LANE_CHAR[lane], x: (lane + 0.5) * tp.laneW, y: tp.hitY, vy: -55, life: 0.5 });
  trSfxHit(mejor.pitch, perfecto, at);
}

function tpRelease(lane){
  if (!tp) return;
  tp.laneDown[lane] = false;
}

function tpAdvanceClock(dt){
  const now = audioNow();
  if (now === null){ tp.time += dt; return; }
  if (tp.audioStart === null) tp.audioStart = now - tp.time;
  tp.time = now - tp.audioStart;
}

/* Único cambio real contra trScheduleTrack: el acorde ya no es siempre Bm,
   sale de TP_CHORDS según en qué compás va (progresión i-VI-III-VII). */
function tpScheduleTrack(){
  if (tp.audioStart === null) return;
  const now = audioNow();
  if (now === null) return;

  while (tp.nextBeat < tp.totalBeats && trBeatTime(tp.nextBeat) < tp.time + TR_SCHEDULE_AHEAD){
    const beat = tp.nextBeat++;
    const at = tp.audioStart + trBeatTime(beat);
    if (at < now) continue;

    const acento = beat % TR_BEATS_PER_BAR === 0;
    tone({
      freq: acento ? TR_CLICK_ACCENT : TR_CLICK_BEAT,
      durationMs: acento ? 45 : 28,
      type: 'sine',
      vol: acento ? 0.055 : 0.03,
      at,
    });

    if (acento){
      const bar = Math.floor(beat / TR_BEATS_PER_BAR) % TP_CHORDS.length;
      for (const freq of TP_CHORDS[bar]){
        tone({
          freq,
          durationMs: TR_BEAT_SEC * TR_BEATS_PER_BAR * 1000 * 0.92,
          type: 'triangle',
          vol: TR_PAD_VOL,
          at,
          attackMs: TR_PAD_ATTACK_MS,
        });
      }
    }
  }
}

function tpLoop(t){
  if (activeMinigame !== 'tapPrueba' || !tp) return;
  const dt = Math.min(0.05, (t - (tp.lastT || t)) / 1000);
  tp.lastT = t;
  tpAdvanceClock(dt);
  tpScheduleTrack();

  for (const n of tp.notes){
    if (!n.holding || n.judged) continue;
    if (tp.time >= n.t + n.holdSec){
      n.judged = true;
      n.holding = false;
      tp.combo += 1;
      if (tp.combo > tp.bestCombo) tp.bestCombo = tp.combo;
      tp.hits += 1;
      tp.perfects += 1;
      tp.score += 4 * tpMultiplier();
      tpJudge('¡PERFECTO!', '#ffe66d');
      tp.fx.push({ char: TR_LANE_CHAR[n.lane], x: (n.lane + 0.5) * tp.laneW, y: tp.hitY, vy: -55, life: 0.5 });
      trSfxHit(n.pitch, true);
    } else if (!tp.laneDown[n.lane]){
      n.judged = true;
      n.holding = false;
      tp.combo = 0;
      tpJudge('soltaste antes', '#ff8f8f');
      trSfxFail();
    }
  }

  while (tp.nextPulseBeat < tp.totalBeats && trBeatTime(tp.nextPulseBeat) <= tp.time){
    tp.pulse = (tp.nextPulseBeat % TR_BEATS_PER_BAR === 0) ? 1 : 0.55;
    tp.nextPulseBeat++;
  }
  if (tp.pulse > 0) tp.pulse = Math.max(0, tp.pulse - dt * 5);

  const gc = tp.gc, ctx = tp.ctx;
  ctx.clearRect(0, 0, gc.width, gc.height);

  if (tp.pulse > 0){
    ctx.fillStyle = `rgba(255,255,255,${tp.pulse * 0.10})`;
    ctx.fillRect(0, 0, gc.width, gc.height);
  }

  for (let i = 0; i < TR_LANES; i++){
    if (tp.lanePulse[i] > 0) tp.lanePulse[i] -= dt;
    if (tp.lanePulse[i] > 0){
      ctx.fillStyle = `rgba(255,230,109,${(tp.lanePulse[i]/0.18)*0.18})`;
      ctx.fillRect(i*tp.laneW, 0, tp.laneW, gc.height);
    }
    if (i > 0){
      ctx.fillStyle = 'rgba(255,255,255,.08)';
      ctx.fillRect(Math.round(i*tp.laneW), 0, 1, gc.height);
    }
  }

  const bandaArriba = TR_GOOD_EARLY * tp.speed;
  const bandaAbajo = TR_GOOD_LATE * tp.speed;
  ctx.fillStyle = 'rgba(255,230,109,.10)';
  ctx.fillRect(0, tp.hitY - bandaArriba, gc.width, bandaArriba + bandaAbajo);
  ctx.fillStyle = `rgba(255,230,109,${0.55 + tp.pulse*0.4})`;
  const grosor = 2 + tp.pulse*3;
  ctx.fillRect(0, tp.hitY - grosor/2, gc.width, grosor);
  for (let i = 0; i < TR_LANES; i++){
    ctx.globalAlpha = 0.45;
    drawEmoji(ctx, TR_LANE_CHAR[i], 15, (i + 0.5)*tp.laneW, tp.hitY + 14);
    ctx.globalAlpha = 1;
  }

  while (tp.cursor < tp.notes.length && tp.notes[tp.cursor].judged) tp.cursor++;
  let quedan = tp.cursor < tp.notes.length;
  for (let i = tp.cursor; i < tp.notes.length; i++){
    const n = tp.notes[i];
    if (n.judged) continue;
    const falta = n.t - tp.time;
    if (!n.holding){
      if (falta > TR_APPROACH) break;
      if (falta < -TR_GOOD_LATE){
        n.judged = true;
        tp.combo = 0;
        tpJudge('fallo', '#ff8f8f');
        trSfxFail();
        continue;
      }
    }
    const y = n.holding ? tp.hitY : tp.hitY - falta * tp.speed;
    const x = (n.lane + 0.5) * tp.laneW;

    if (n.hold){
      const restante = n.holding ? Math.max(0, (n.t + n.holdSec) - tp.time) : n.holdSec;
      ctx.fillStyle = 'rgba(143,208,255,.35)';
      ctx.fillRect(x-5, y - restante*tp.speed, 10, restante*tp.speed);
    }

    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI*2);
    ctx.fillStyle = n.hold ? 'rgba(143,208,255,.28)' : 'rgba(255,230,109,.16)';
    ctx.fill();
    drawEmoji(ctx, TR_LANE_CHAR[n.lane], 20, x, y);
  }

  for (let i = tp.fx.length - 1; i >= 0; i--){
    const f = tp.fx[i];
    f.life -= dt;
    if (f.life <= 0){ tp.fx.splice(i, 1); continue; }
    f.y += f.vy * dt;
    ctx.globalAlpha = Math.min(1, f.life * 2);
    drawEmoji(ctx, f.char, 16, f.x, f.y);
  }
  ctx.globalAlpha = 1;

  ctx.font = '11px monospace';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.fillText('🎵 ' + tp.score, 8, 16);
  ctx.textAlign = 'right';
  ctx.fillStyle = tpMultiplier() > 1 ? '#ffe66d' : '#fff';
  ctx.fillText(`combo ${tp.combo}  x${tpMultiplier()}`, gc.width - 8, 16);

  if (tp.time < tp.judgeUntil){
    ctx.textAlign = 'center';
    ctx.fillStyle = tp.judgeColor;
    ctx.fillText(tp.judgeText, gc.width/2, tp.hitY - 26);
  }

  if (!quedan){
    if (!tp.endAt) tp.endAt = tp.time + 0.8;
    if (tp.time >= tp.endAt){ endTapPruebaGame(); return; }
  }
  tp.raf = requestAnimationFrame(tpLoop);
}

function tpDispose(){
  if (!tp) return;
  tp.gc.removeEventListener('pointerdown', tp.onDown);
  tp.gc.removeEventListener('pointerup', tp.onUp);
  tp.gc.removeEventListener('pointercancel', tp.onUp);
  window.removeEventListener('keydown', tp.onKeyDown);
  window.removeEventListener('keyup', tp.onKeyUp);
  tp.pointer.dispose();
  if (tp.raf) cancelAnimationFrame(tp.raf);
}

function endTapPruebaGame(){
  const score = tp ? tp.score : 0;
  const bestCombo = tp ? tp.bestCombo : 0;
  const perfects = tp ? tp.perfects : 0;
  tpDispose();
  tp = null;

  const message = score > 0
    ? `${score} pts · ${perfects} perfectos (combo ${bestCombo})`
    : 'Se te fue el ritmo…';

  finishMinigame('tapPrueba', { score, merit: score * 0.13, energyCost: 20, message });
}


/* ===================== Minijuego 5: snake =====================
   Se controla deslizando el dedo (o con flechas / WASD). El giro se registra en
   pointermove y no al soltar: así se pueden encadenar dos curvas sin levantar
   el dedo, que es lo que se necesita cuando ya va rápido. */

const SN_CELL = 14;
const SN_HUD = 22;
const SN_START_MS = 190;   // ms por paso al empezar
const SN_MIN_MS = 85;      // lo más rápido que llega a ir
const SN_SPEEDUP = 4;      // ms menos por manzana
const SN_SWIPE = 20;       // px de deslizamiento para que cuente como giro

let sn = null;

function startSnakeGame(){
  const { gc, ctx } = enterMinigame('snake');
  const cols = Math.floor(gc.width / SN_CELL);
  const rows = Math.floor((gc.height - SN_HUD) / SN_CELL);
  const cx = Math.floor(cols/2), cy = Math.floor(rows/2);

  sn = {
    ctx, gc, cols, rows,
    offX: Math.floor((gc.width - cols*SN_CELL) / 2),
    offY: SN_HUD,
    body: [{x:cx, y:cy}, {x:cx-1, y:cy}, {x:cx-2, y:cy}],
    dir: { x:1, y:0 },
    nextDir: { x:1, y:0 },
    food: null,
    score: 0,
    stepMs: SN_START_MS - 50*levelT(),   // 190 → 140 ms en nivel 5
    acc: 0,
    dead: false,
    deadUntil: 0,
    swipeFrom: null,
    pointer: makeCanvasPointer(gc),
    raf: null, lastT: 0,
  };
  snPlaceFood();

  sn.onKeyDown = (e) => {
    const d = { ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0],
                w:[0,-1], s:[0,1], a:[-1,0], d:[1,0] }[e.key];
    if (!d) return;
    e.preventDefault();
    snTurn(d[0], d[1]);
  };
  window.addEventListener('keydown', sn.onKeyDown);

  /* La cruceta va abajo con los mandos. Se deja además el deslizamiento sobre la
     pantalla porque a mucha gente le sale más natural en snake, pero ya no es la
     única forma de jugar. */
  sn.onDown = (e) => { e.preventDefault(); sn.swipeFrom = sn.pointer.at(e); };
  sn.onMove = (e) => {
    if (!sn.swipeFrom) return;
    const to = sn.pointer.at(e);
    const dx = to.x - sn.swipeFrom.x, dy = to.y - sn.swipeFrom.y;
    if (Math.hypot(dx, dy) < SN_SWIPE) return;
    if (Math.abs(dx) > Math.abs(dy)) snTurn(Math.sign(dx), 0);
    else snTurn(0, Math.sign(dy));
    sn.swipeFrom = to;   // deja encadenar el siguiente giro sin levantar el dedo
  };
  sn.onUp = () => { sn.swipeFrom = null; };
  gc.addEventListener('pointerdown', sn.onDown);
  gc.addEventListener('pointermove', sn.onMove);
  gc.addEventListener('pointerup', sn.onUp);
  gc.addEventListener('pointercancel', sn.onUp);

  const cont = showGameControls(`
    <div class="gpad">
      <button class="gbtn up"    data-dir="0,-1">▲</button>
      <button class="gbtn left"  data-dir="-1,0">◀</button>
      <button class="gbtn down"  data-dir="0,1">▼</button>
      <button class="gbtn right" data-dir="1,0">▶</button>
    </div>
  `);
  cont.querySelectorAll('[data-dir]').forEach(el => {
    const [dx, dy] = el.dataset.dir.split(',').map(Number);
    wireGameButton(el, () => snTurn(dx, dy));
  });

  say('¡Usa la cruceta para girar!');
  sn.raf = requestAnimationFrame(snLoop);
}

/* Se compara contra `dir` (la dirección del último paso ya dado) y no contra
   `nextDir`: si no, dos giros dentro del mismo paso permiten volverse 180° sobre
   el propio cuerpo y morir sin haber hecho nada raro. */
function snTurn(x, y){
  if (!sn || sn.dead) return;
  if (x === -sn.dir.x && y === -sn.dir.y) return;
  sn.nextDir = { x, y };
}

function snPlaceFood(){
  const libres = [];
  for (let y = 0; y < sn.rows; y++){
    for (let x = 0; x < sn.cols; x++){
      if (!sn.body.some(s => s.x === x && s.y === y)) libres.push({ x, y });
    }
  }
  sn.food = libres.length ? libres[Math.floor(Math.random()*libres.length)] : null;
}

function snStep(){
  sn.dir = sn.nextDir;
  const head = sn.body[0];
  const nx = head.x + sn.dir.x, ny = head.y + sn.dir.y;

  if (nx < 0 || ny < 0 || nx >= sn.cols || ny >= sn.rows){ snDie(); return; }
  /* La cola se corre en el mismo paso, así que pisar el último segmento no mata
     (salvo que justo se coma, y ahí la cola no se mueve). */
  const chocaConsigo = sn.body.some((s, i) => i < sn.body.length - 1 && s.x === nx && s.y === ny);
  if (chocaConsigo){ snDie(); return; }

  sn.body.unshift({ x:nx, y:ny });
  if (sn.food && nx === sn.food.x && ny === sn.food.y){
    sn.score += 1;
    sn.stepMs = Math.max(SN_MIN_MS - 15*levelT(), sn.stepMs - SN_SPEEDUP*(1 + 0.5*levelT()));
    snPlaceFood();
  } else {
    sn.body.pop();
  }
}

function snDie(){
  sn.dead = true;
  sn.deadUntil = performance.now() + 900;   // deja ver dónde se chocó
}

function snDraw(){
  const { ctx, gc } = sn;
  ctx.clearRect(0, 0, gc.width, gc.height);

  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.fillRect(sn.offX, sn.offY, sn.cols*SN_CELL, sn.rows*SN_CELL);

  if (sn.food){
    drawEmoji(ctx, '🍎', SN_CELL, sn.offX + (sn.food.x+0.5)*SN_CELL, sn.offY + (sn.food.y+0.5)*SN_CELL);
  }

  for (let i = sn.body.length - 1; i >= 0; i--){
    const s = sn.body[i];
    if (sn.dead)      ctx.fillStyle = i === 0 ? '#ff8f8f' : 'rgba(255,120,120,.5)';
    else if (i === 0) ctx.fillStyle = '#ffe66d';
    else              ctx.fillStyle = `rgba(200,242,194,${Math.max(0.35, 0.85 - i*0.012)})`;
    ctx.fillRect(sn.offX + s.x*SN_CELL + 1, sn.offY + s.y*SN_CELL + 1, SN_CELL-2, SN_CELL-2);
  }

  ctx.font = '11px monospace';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.fillText('🍎 ' + sn.score, 8, 16);
  ctx.textAlign = 'right';
  ctx.fillStyle = sn.dead ? '#ff8f8f' : 'rgba(255,255,255,.7)';
  ctx.fillText(sn.dead ? '¡chocaste!' : 'largo ' + sn.body.length, gc.width - 8, 16);
}

function snLoop(t){
  if (activeMinigame !== 'snake' || !sn) return;
  const dtMs = Math.min(120, t - (sn.lastT || t));
  sn.lastT = t;

  if (sn.dead){
    snDraw();
    if (performance.now() >= sn.deadUntil){ endSnakeGame(); return; }
  } else {
    sn.acc += dtMs;
    while (sn.acc >= sn.stepMs && !sn.dead){
      sn.acc -= sn.stepMs;
      snStep();
    }
    snDraw();
  }
  sn.raf = requestAnimationFrame(snLoop);
}

function snDispose(){
  if (!sn) return;
  window.removeEventListener('keydown', sn.onKeyDown);
  sn.gc.removeEventListener('pointerdown', sn.onDown);
  sn.gc.removeEventListener('pointermove', sn.onMove);
  sn.gc.removeEventListener('pointerup', sn.onUp);
  sn.gc.removeEventListener('pointercancel', sn.onUp);
  sn.pointer.dispose();
  if (sn.raf) cancelAnimationFrame(sn.raf);
}

function endSnakeGame(){
  const score = sn ? sn.score : 0;
  const largo = sn ? sn.body.length : 0;
  snDispose();
  sn = null;

  const message = score > 0 ? `${score} manzanas (largo ${largo})` : 'Se chocó al toque';
  finishMinigame('snake', { score, merit: score * 2.2, energyCost: 20, message });
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
        </div>
        <button class="debug-btn wide" id="dbgNight" style="margin-top:6px">${
          debugForcedNight === null ? '🕐 Día/noche: hora real' : debugForcedNight ? '🌙 Día/noche: noche forzada' : '☀️ Día/noche: día forzado'}</button>
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
          <button class="debug-btn" id="dbgTap">🎵 Tap rítmico</button>
          <button class="debug-btn" id="dbgSnake">🐍 Snake</button>
          <button class="debug-btn" id="dbgMemory">💡 Memorice</button>
          <button class="debug-btn" id="dbgCombat">⚔️ Combate (prueba)</button>
          <button class="debug-btn" id="dbgTapPrueba">🎼 Tap prueba</button>
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
  document.getElementById('dbgTap').addEventListener('click', () => { closeDebugPanel(); startTapGame(); });
  document.getElementById('dbgSnake').addEventListener('click', () => { closeDebugPanel(); startSnakeGame(); });
  document.getElementById('dbgMemory').addEventListener('click', () => { closeDebugPanel(); startMemoryGame(); });
  document.getElementById('dbgCombat').addEventListener('click', () => { closeDebugPanel(); startCombatGame(); });
  document.getElementById('dbgTapPrueba').addEventListener('click', () => { closeDebugPanel(); startTapPruebaGame(); });
  /* Para probar la tienda (muebles, estilo, juegos) sin tener que jugar
     partidas. Son monedas reales del save: no se devuelven al apagar nada. */
  document.querySelectorAll('[data-coins]').forEach(el => el.addEventListener('click', () => {
    state.coins += +el.dataset.coins; saveState(); render(); renderDebugPanel();
  }));
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
  document.getElementById('btnShop').addEventListener('click', requireAlive(() => openShop()));
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
  document.getElementById('giftFx').addEventListener('click', requireAlive((e) => {
    e.stopPropagation();
    collectGift();
  }));
  document.getElementById('btnReset').addEventListener('click', () => {
    showOverlay(`
      <h3>¿Reiniciar?</h3>
      <p>Se perderá el progreso de ${escapeHtml(state.name)}.</p>
      <div class="overlay-actions">
        <button class="overlay-btn danger" id="btnConfirmReset">Sí, reiniciar</button>
        <button class="overlay-btn secondary" id="btnCancelReset">Cancelar</button>
      </div>
    `, hideOverlay);
    document.getElementById('btnCancelReset').addEventListener('click', hideOverlay);
    document.getElementById('btnConfirmReset').addEventListener('click', () => {
      localStorage.removeItem(SAVE_KEY);
      location.reload();
    });
  });

  document.getElementById('screen').addEventListener('click', (e) => {
    if (arranging || e.target.closest('.overlay') || e.target.closest('#gameCanvas')) return;
    if (state.poop) { btnClean(); return; }
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
