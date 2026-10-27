/* ===================== Medallas y Mimodex =====================
   Dos colecciones que NO son de la mascota sino de quien juega, así que
   sobreviven a que se muera o se reinicie: van en su propia clave de
   localStorage (PROFILE_KEY), aparte del save.

   - Medallas: 20 logros con tres niveles (bronce, plata, oro). Cada nivel
     que se alcanza avisa con un cartelito arriba y queda para reclamar en
     la hoja de Logros: el premio (monedas, y en el oro además una ficha del
     gacha) se cobra a mano, con su pop-up, para que se sienta. Lo que mide
     cada una sale de contadores (comidas, cacas, partidas...) que se suman
     desde el lugar donde pasa cada cosa (medalAdd) o de valores que se
     miran cada tanto (medalMax: días vividos, muebles, nivel de un juego).
   - Mimodex: la ficha de cada especie. Se "ve" al cruzársela (la visita de
     los juegos de a dos, el acompañante, el rival del combate) y se "cría"
     al nacer de un huevo propio. Las que no se conocen salen en silueta.

   Se carga al final (después de duo-juegos.js): usa gameActor() para el
   personaje animado de la ficha. Los demás archivos llaman a medalAdd() y
   dexSeen() recién en tiempo de juego. */

const PROFILE_KEY = 'mimogoshi.perfil.v1';
let profile = null;

function freshProfile(){
  return { stats: {}, claimed: {}, notified: {}, dex: {}, adults: [] };
}
function loadProfile(){
  let p = null;
  try { p = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); } catch (e) { p = null; }
  const f = freshProfile();
  if (!p || typeof p !== 'object') p = f;
  for (const k of Object.keys(f)) if (!p[k] || typeof p[k] !== typeof f[k] || Array.isArray(p[k]) !== Array.isArray(f[k])) p[k] = f[k];
  return p;
}
function saveProfile(){
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (e) { /* bloqueado: se pierde, no rompe */ }
}
function prof(){ if (!profile) profile = loadProfile(); return profile; }

/* ---------- medallas ---------- */

/* Premio de cada nivel. El oro suma una ficha del gacha (premios.js), salvo
   con el gacha en pausa (GACHA_ON). */
const MEDAL_TIERS = [
  { id: 'bronce', name: 'bronce', emoji: '🥉', coins: 10 },
  { id: 'plata',  name: 'plata',  emoji: '🥈', coins: 30 },
  { id: 'oro',    name: 'oro',    emoji: '🥇', coins: 80, gacha: GACHA_ON ? 1 : 0 },
];

/* `stat`: el contador de profile.stats que mide. `at`: lo que pide cada
   nivel. `desc(n)`: el texto con la meta del nivel que viene. `steps`: si
   está, se muestra eso en vez del número (para lo que no conviene contar). */
const MEDALS = [
  { id: 'chef',     emoji: '🍽️', name: 'Chef',           stat: 'comidas',  at: [25, 150, 600], desc: n => `Que se coma ${n} porciones` },
  { id: 'limpio',   emoji: '🧹', name: 'Impecable',      stat: 'cacas',    at: [10, 50, 200],  desc: n => `Limpiar ${n} cacas` },
  { id: 'doctor',   emoji: '💊', name: 'Doctor',         stat: 'curas',    at: [1, 10, 30],    desc: n => n === 1 ? 'Curarla con una medicina' : `Curar ${n} enfermedades` },
  { id: 'vacunas',  emoji: '💉', name: 'Al día',         stat: 'vacunas',  at: [1, 3, 9],      desc: n => n === 1 ? 'Ponerle una vacuna' : `Poner ${n} vacunas` },
  { id: 'mimos',    emoji: '💗', name: 'Regalón',        stat: 'mimos',    at: [20, 150, 600], desc: n => `Hacerle cariño ${n} veces` },
  { id: 'siestas',  emoji: '💤', name: 'Dulces sueños',  stat: 'siestas',  at: [10, 60, 250],  desc: n => `Que se duerma ${n} veces` },
  { id: 'vida',     emoji: '🎂', name: 'Larga vida',     stat: 'dias',     at: [1, 7, 30],     desc: n => n === 1 ? 'Que una mascota viva un día real' : `Que una mascota viva ${n} días reales` },
  { id: 'criador',  emoji: '🌱', name: 'Criador',        stat: 'adultos',  at: [1, 3, 10],     desc: n => n === 1 ? 'Criar una mascota hasta adulta' : `Criar ${n} mascotas hasta adultas` },
  { id: 'jugador',  emoji: '🎮', name: 'Jugador',        stat: 'partidas', at: [10, 100, 500], desc: n => `Jugar ${n} partidas` },
  { id: 'crack',    emoji: '⭐', name: 'Crack',          stat: 'merito',   at: [45, 70, 100],
    steps: ['Una partida muy buena', 'Una partida excelente', 'Una partida legendaria'], desc: () => '' },
  { id: 'leyenda',  emoji: '🏔️', name: 'Leyenda',        stat: 'nivel',    at: [3, 4, 5],      desc: n => `Desbloquear el nivel ${n} de un juego` },
  { id: 'desafio',  emoji: '🔥', name: 'Desafiante',     stat: 'desafios', at: [5, 30, 120],   desc: n => `Jugar ${n} desafíos diarios` },
  { id: 'suerte',   emoji: '🎡', name: 'Suertudo',       stat: 'giros',    at: [5, 40, 150],   desc: n => `Girar la ruleta ${n} veces` },
  { id: 'deco',     emoji: '🛋️', name: 'Decorador',      stat: 'muebles',  at: [3, 12, 30],    desc: n => `Tener ${n} muebles u objetos` },
  { id: 'mago',     emoji: '✨', name: 'Mago',           stat: 'magia',    at: [1, 5, 15],     desc: n => n === 1 ? 'Tener un objeto mágico' : `Tener ${n} objetos mágicos` },
  { id: 'gacha',    emoji: '🎰', name: 'Coleccionista',  stat: 'capsulas', at: [3, 15, 40],    desc: n => `Abrir ${n} cápsulas del gacha` },
  { id: 'ahorro',   emoji: '💰', name: 'Ahorrista',      stat: 'monedas',  at: [500, 5000, 25000], desc: n => `Ganar ${n.toLocaleString('es-CL')} monedas en total` },
  /* El oro del Mimodex pide todas las especies que haya: crece solo cuando
     se suma una. */
  { id: 'explora',  emoji: '📖', name: 'Explorador',     stat: 'especies', at: () => [2, 4, SPECIES_IDS.length], desc: n => `Conocer ${n} especies en el Mimodex` },
  { id: 'familia',  emoji: '🐣', name: 'Familia grande', stat: 'criadas',  at: () => [1, 3, SPECIES_IDS.length], desc: n => n === 1 ? 'Criar una mascota desde el huevo' : `Criar ${n} especies distintas` },
  { id: 'amigos',   emoji: '🤝', name: 'Mejores amigos', stat: 'juntos',   at: [5, 30, 120],   desc: n => `Que jueguen de a dos ${n} veces` },
].filter(m => GACHA_ON || m.stat !== 'capsulas');   // Coleccionista, solo con el gacha prendido

function medalAt(m){ return typeof m.at === 'function' ? m.at() : m.at; }
function medalValue(m){ return prof().stats[m.stat] || 0; }
function medalReached(m){ return medalAt(m).filter(n => medalValue(m) >= n).length; }
function medalClaimed(m){ return Math.min(prof().claimed[m.id] || 0, medalReached(m)); }
function medalsPending(){ return MEDALS.reduce((s, m) => s + medalReached(m) - medalClaimed(m), 0); }

/* Sumar a un contador (algo que pasó) o subir un máximo (algo que se mide). */
function medalAdd(stat, n = 1){
  const p = prof();
  p.stats[stat] = (p.stats[stat] || 0) + n;
  medalsChanged();
}
function medalMax(stat, v){
  const p = prof();
  if (!(v > (p.stats[stat] || 0))) return;
  p.stats[stat] = v;
  medalsChanged();
}

/* Avisa los niveles nuevos (una vez cada uno) y guarda. */
function medalsChanged(){
  const p = prof();
  for (const m of MEDALS){
    const r = medalReached(m), n = p.notified[m.id] || 0;
    if (r > n){
      for (let t = n; t < r; t++) medalToast(m, t);
      p.notified[m.id] = r;
    }
  }
  saveProfile();
  updateLogrosBadge();
}

/* Cartelito de arriba (una medalla nueva, una especie nueva en el
   Mimodex): uno a la vez, en fila. Tocarlo abre esa pestaña de Logros. */
const medalQueue = [];
let medalToastBusy = false;
function medalToast(m, t){
  const tier = MEDAL_TIERS[t];
  queueToast({ emoji: m.emoji, small: `¡Medalla de ${tier.name}!`, title: m.name, cls: tier.id, tab: 'medallas' });
}
function queueToast(q){
  medalQueue.push(q);
  /* Se espera un instante antes de mostrar: si llegan varias juntas (al
     abrir la app con progreso guardado, o un juego que da tres de una), van
     en un solo cartelito. */
  if (!medalToastBusy){ medalToastBusy = true; setTimeout(nextMedalToast, 60); }
}
function nextMedalToast(){
  const el = document.getElementById('medalToast');
  let q = medalQueue.shift();
  if (!el || !q){ medalToastBusy = false; return; }
  if (q.tab === 'medallas'){
    const mas = medalQueue.filter(x => x.tab === 'medallas');
    if (mas.length){
      for (const x of mas) medalQueue.splice(medalQueue.indexOf(x), 1);
      q = { emoji: '🏅', small: '¡Medallas nuevas!', title: `${mas.length + 1} para reclamar`, cls: 'oro', tab: 'medallas' };
    }
  }
  medalToastBusy = true;
  el.innerHTML = `<span class="mt-medal ${q.cls}">${q.emoji}</span>
    <span class="mt-text"><small>${escapeHtml(q.small)}</small><b>${escapeHtml(q.title)}</b></span>
    <span class="mt-cta">Ver</span>`;
  el.className = `medal-toast ${q.cls}`;
  el.dataset.tab = q.tab;
  if (typeof tone === 'function'){
    const t0 = (typeof audioNow === 'function' && audioNow()) || 0;
    [1318.5, 1568, 1975.5].forEach((f, i) => tone({ freq: f, durationMs: 120, type: 'triangle', vol: 0.06, at: t0 + i * 0.07 }));
  }
  /* La pestañita de las medallas pestañea, como la bitácora al volver. */
  const lb = q.tab === 'medallas' && document.getElementById('btnLogros');
  if (lb){ lb.classList.remove('blink'); void lb.offsetWidth; lb.classList.add('blink'); }
  clearTimeout(nextMedalToast.timer);
  nextMedalToast.timer = setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => { el.className = 'medal-toast hidden'; nextMedalToast(); }, 320);
  }, 2800);
}

function updateLogrosBadge(){
  const btn = document.getElementById('btnLogros');
  if (!btn) return;
  const n = medalsPending();
  if (n) btn.dataset.badge = n > 9 ? '9+' : String(n); else delete btn.dataset.badge;
}

/* Cobrar el siguiente nivel de una medalla. */
function claimMedal(id){
  const m = MEDALS.find(x => x.id === id);
  if (!m || medalClaimed(m) >= medalReached(m) || gameOver) return;
  const t = medalClaimed(m), tier = MEDAL_TIERS[t];
  prof().claimed[m.id] = t + 1;
  saveProfile();
  state.coins += tier.coins;
  if (tier.gacha) state.gachaTickets = (state.gachaTickets || 0) + tier.gacha;
  saveState(); render();
  updateLogrosBadge();
  showPopup({
    icon: tier.emoji, title: `¡Medalla de ${tier.name}!`, note: `${m.emoji} ${m.name}`,
    items: [
      { icon: '💰', text: 'Monedas', amount: `+${tier.coins}` },
      ...(tier.gacha ? [{ icon: '🎟️', text: 'Ficha del gacha', amount: `+${tier.gacha}` }] : []),
    ],
  });
}

/* ---------- lo que se mide solo ----------
   Cada segundo (y al abrir la hoja): los valores que no son contadores
   (días vividos, muebles que tiene, el nivel más alto de un juego), las
   monedas ganadas (todo lo que el saldo sube, venga de donde venga), las
   veces que se duerme y el Mimodex de la mascota propia. */
let medalLastCoins = null, medalLastSleeping = null;
function medalsTick(){
  if (!state || gameOver) return;
  const p = prof();
  if (medalLastCoins !== null && state.coins > medalLastCoins) medalAdd('monedas', state.coins - medalLastCoins);
  medalLastCoins = state.coins;
  if (medalLastSleeping === false && state.sleeping) medalAdd('siestas');
  medalLastSleeping = !!state.sleeping;

  if (state.stage !== 'egg'){
    /* Criada: la especie entra al Mimodex con esta mascota (bornAt la
       identifica, así no cuenta dos veces). */
    const d = dexEntry(state.species);
    if (!d.raised.includes(state.bornAt)){ d.raised.push(state.bornAt); if (!d.seen) d.seen = Date.now(); d.name = state.name; }
    const dias = state.ageHours / (24 * 60);
    d.bestDays = Math.max(d.bestDays || 0, dias);
    medalMax('dias', Math.floor(dias));
    if (state.stage === 'adult' && !p.adults.includes(state.bornAt)){ p.adults.push(state.bornAt); medalMax('adultos', p.adults.length); }
  }
  const owned = state.style && state.style.owned ? state.style.owned : {};
  const furni = STYLE_ITEMS.filter(it => it.kind === 'furni' && owned[it.id]);
  medalMax('muebles', furni.length);
  medalMax('magia', furni.filter(it => it.wow).length);
  if (typeof GAMES !== 'undefined' && typeof maxLevelFor === 'function'){
    medalMax('nivel', Math.max(1, ...GAMES.map(g => maxLevelFor(g.id))));
  }
  medalMax('especies', SPECIES_IDS.filter(id => dexKnown(id)).length);
  medalMax('criadas', SPECIES_IDS.filter(id => dexEntry(id).raised.length).length);
}

/* ---------- Mimodex ---------- */

/* Una frase por especie; las que se sumen sin la suya usan la genérica. */
const DEX_FLAVOR = {
  blob: 'Una gotita de gelatina que rebota para todos lados. Dicen que brilla más cuando está feliz.',
  gato: 'Curioso y dormilón. Aunque tenga la panza llena, siempre mira la comida del otro.',
  pollito: 'Recién salido del cascarón y ya quiere conocer el mundo entero. Pía fuerte cuando tiene hambre.',
  blob_amarillo: 'El primo soleado del Blob. Dicen que guarda un poquito de sol adentro.',
  amarillo_cuernos: 'Parece bravo por los cuernos, pero es el más regalón de todos.',
};
const DEX_FLAVOR_DEFAULT = 'Un personaje del que todavía se sabe poco.';

function dexEntry(id){
  const p = prof();
  if (!p.dex[id] || typeof p.dex[id] !== 'object') p.dex[id] = {};
  const d = p.dex[id];
  if (!Array.isArray(d.raised)) d.raised = [];
  return d;
}
function dexKnown(id){ const d = prof().dex[id]; return !!(d && (d.seen || (d.raised && d.raised.length))); }

/* Se cruzó con una especie (visita, acompañante, rival). */
function dexSeen(id){
  if (!SPECIES_RAW[id]) return;
  const d = dexEntry(id);
  const nueva = !dexKnown(id);
  if (!d.seen) d.seen = Date.now();
  d.met = (d.met || 0) + 1;
  saveProfile();
  if (nueva){
    medalMax('especies', SPECIES_IDS.filter(x => dexKnown(x)).length);
    dexToast(id);
  }
}
function dexToast(id){
  const db = document.getElementById('btnDex');
  if (db){ db.classList.remove('blink'); void db.offsetWidth; db.classList.add('blink'); }
  queueToast({ emoji: '📖', small: '¡Nueva en el Mimodex!', title: SPECIES_RAW[id].name, cls: 'dex', tab: 'mimodex' });
}

const dexNum = id => '#' + String(SPECIES_IDS.indexOf(id) + 1).padStart(3, '0');
const fmtDate = ts => new Date(ts).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });

/* ---------- las hojas: Medallas y Mimodex ----------
   Cada una con su pestañita en la pantalla (la copa y el libro, debajo de
   la bitácora). Antes iban juntas en una hoja con dos pestañas. */

let dexAnim = 0;   // requestAnimationFrame del personaje de la ficha

/* Las medallas se ven de dos formas: la lista (con metas, barras y el botón
   para reclamar) y la vitrina (solo los íconos en filas y columnas: gris si
   no tiene ninguna, o con el color de la mejor que tiene). */
let medalView = 'lista';
function openLogros(tab = 'medallas'){
  cancelAnimationFrame(dexAnim);
  medalsTick();
  const dex = tab === 'mimodex';
  const views = dex ? '' : `<div class="shop-tabs">
      <button class="shop-tab ${medalView === 'lista' ? 'active' : ''}" data-mview="lista">Lista</button>
      <button class="shop-tab ${medalView === 'vitrina' ? 'active' : ''}" data-mview="vitrina">Vitrina</button>
    </div>`;
  showOverlay(`
    <h3>${dex ? '📖 Mimodex' : '🏆 Medallas'}</h3>
    ${views}
    ${dex ? dexHtml() : medalView === 'vitrina' ? showcaseHtml() : medalsHtml()}
    <button class="overlay-btn secondary" id="btnCloseLogros">Cerrar</button>
  `, closeLogros);
  document.querySelectorAll('[data-mview]').forEach(b => b.addEventListener('click', () => { medalView = b.dataset.mview; openLogros('medallas'); }));
  document.querySelectorAll('[data-show]').forEach(b => b.addEventListener('click', () => {
    const m = MEDALS.find(x => x.id === b.dataset.show), r = medalReached(m);
    const cap = document.getElementById('showcaseCap');
    document.querySelectorAll('.show-cell.on').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    if (cap) cap.innerHTML = `<b>${escapeHtml(m.name)}</b> · ${r ? `medalla de ${MEDAL_TIERS[r - 1].name}` : 'ninguna todavía'}`;
  }));
  document.getElementById('overlayCard').classList.add('sheet-full');
  document.getElementById('btnCloseLogros').addEventListener('click', closeLogros);
  document.querySelectorAll('[data-claim]').forEach(b => b.addEventListener('click', () => {
    const list = document.querySelector('.overlay-card .menu-list');
    const scroll = list ? list.scrollTop : 0;
    claimMedal(b.dataset.claim);
    openLogros('medallas');
    const l2 = document.querySelector('.overlay-card .menu-list');
    if (l2) l2.scrollTop = scroll;
  }));
  document.querySelectorAll('[data-dex]').forEach(b => b.addEventListener('click', () => openDexEntry(b.dataset.dex)));
}
function closeLogros(){ cancelAnimationFrame(dexAnim); hideOverlay(); }

function medalCard(m){
  const at = medalAt(m), v = medalValue(m), reached = medalReached(m), claimed = medalClaimed(m);
  const top = reached ? MEDAL_TIERS[reached - 1].id : 'none';
  const pend = reached > claimed;
  const pips = MEDAL_TIERS.map((t, i) => `<i class="mpip ${i < reached ? t.id : ''}"></i>`).join('');
  /* Con un nivel por reclamar se muestra ESE nivel (lo que se logró y lo
     que paga el botón), no la meta del siguiente: antes salía la meta que
     venía y parecía que la medalla era de otra cosa. Reclamado, pasa a la
     que viene. */
  const shown = pend ? claimed : reached, goal = at[shown];
  let meta, bar = '';
  if (goal === undefined) meta = '¡Completa! Las tres medallas';
  else {
    const txt = m.steps ? m.steps[shown] : m.desc(goal);
    if (pend){
      meta = `✓ ${txt}`;
      bar = `<div class="mbar done"><i style="width:100%"></i></div><small class="mcount">¡Logrado! Reclama la medalla de ${MEDAL_TIERS[shown].name}</small>`;
    } else {
      meta = txt;
      if (!m.steps){
        const prev = shown ? at[shown - 1] : 0;
        const frac = Math.max(0, Math.min(1, (v - prev) / (goal - prev)));
        bar = `<div class="mbar"><i style="width:${(frac * 100).toFixed(1)}%"></i></div>
          <small class="mcount">${Math.min(v, goal).toLocaleString('es-CL')} / ${goal.toLocaleString('es-CL')}</small>`;
      }
    }
  }
  const tier = MEDAL_TIERS[claimed];
  const right = pend
    ? `<button class="mclaim" data-claim="${m.id}">${tier.emoji} +${tier.coins}${tier.gacha ? ' 🎟️' : ''}</button>`
    : `<span class="mpips">${pips}</span>`;
  return `<div class="medal-card ${pend ? 'pending' : ''}">
      <span class="medal-disc ${top}">${m.emoji}</span>
      <div class="minfo"><b>${escapeHtml(m.name)}</b><small>${escapeHtml(meta)}</small>${bar}</div>
      ${right}
    </div>`;
}

function medalsHtml(){
  const total = MEDALS.length * MEDAL_TIERS.length;
  const got = MEDALS.reduce((s, m) => s + medalReached(m), 0);
  const oros = MEDALS.filter(m => medalReached(m) === 3).length;
  const pend = medalsPending();
  /* Primero lo que hay que reclamar, después las que van más avanzadas. */
  const orden = [...MEDALS].sort((a, b) =>
    (medalReached(b) - medalClaimed(b) > 0) - (medalReached(a) - medalClaimed(a) > 0) ||
    (medalReached(a) === 3) - (medalReached(b) === 3));
  return `
    <div class="logros-sum">
      <span><b>${got}</b> / ${total} medallas</span>
      <span>🥇 ${oros}</span>
      ${pend ? `<span class="lpend">${pend} por reclamar</span>` : ''}
    </div>
    <div class="menu-list medal-list">${orden.map(medalCard).join('')}</div>`;
}

/* La vitrina: un casillero por logro, solo el ícono. Gris sin ninguna
   medalla; con el disco de bronce, plata u oro de la mejor que tiene.
   Tocar uno dice cuál es arriba. */
function showcaseHtml(){
  const got = MEDALS.reduce((s, m) => s + medalReached(m), 0);
  const cells = MEDALS.map(m => {
    const r = medalReached(m);
    return `<button class="show-cell" data-show="${m.id}" title="${escapeHtml(m.name)}">
        <span class="medal-disc ${r ? MEDAL_TIERS[r - 1].id : 'none gray'}">${m.emoji}</span></button>`;
  }).join('');
  return `
    <div class="logros-sum"><span><b>${got}</b> / ${MEDALS.length * MEDAL_TIERS.length} medallas</span>
      <span id="showcaseCap" class="show-cap">Toca una para ver cuál es</span></div>
    <div class="menu-list showcase">${cells}</div>`;
}

function dexHtml(){
  const vistos = SPECIES_IDS.filter(dexKnown).length;
  const criados = SPECIES_IDS.filter(id => dexEntry(id).raised.length).length;
  const cards = SPECIES_IDS.map(id => {
    const known = dexKnown(id), d = dexEntry(id);
    const tag = d.raised.length ? '<i class="dex-tag raised">👑 Criado</i>' : known ? '<i class="dex-tag">👁️ Visto</i>' : '';
    return `<button class="dex-card ${known ? '' : 'unknown'}" data-dex="${id}">
        <small class="dex-num">${dexNum(id)}</small>
        <span class="dex-thumb" style="${speciesThumbStyle(id, 2)}"></span>
        <b>${known ? escapeHtml(SPECIES_RAW[id].name) : '???'}</b>
        ${tag}
      </button>`;
  }).join('');
  return `
    <div class="logros-sum">
      <span><b>${vistos}</b> / ${SPECIES_IDS.length} conocidas</span>
      <span>👑 ${criados} criadas</span>
    </div>
    <div class="menu-list dex-grid">${cards}</div>`;
}

/* La ficha de una especie: el personaje animado (tocarlo cambia lo que
   hace), su número, cómo se la conoció y su frase. Una desconocida solo
   dice dónde buscarla. */
const DEX_ANIMS = ['idle', 'happy', 'walk', 'eat', 'pet', 'celebrate', 'sleep'];
function openDexEntry(id){
  cancelAnimationFrame(dexAnim);
  const known = dexKnown(id), d = dexEntry(id);
  const rows = [];
  if (known){
    if (d.raised.length) rows.push(['👑', 'Criados', `${d.raised.length}`]);
    if (d.raised.length) rows.push(['🎂', 'El que más vivió', d.bestDays >= 1 ? `${Math.floor(d.bestDays)} días` : 'menos de un día']);
    if (d.met) rows.push(['👋', 'Encuentros', `${d.met}`]);
    if (d.seen) rows.push(['📅', 'Visto por primera vez', fmtDate(d.seen)]);
  }
  showOverlay(`
    <div class="dex-head">
      <button class="dex-back" id="dexBack">‹ Mimodex</button>
      <small class="dex-num">${dexNum(id)}</small>
    </div>
    <div class="dex-stage ${known ? '' : 'unknown'}"><canvas id="dexCanvas"></canvas></div>
    <h3>${known ? escapeHtml(SPECIES_RAW[id].name) : '???'}</h3>
    <p>${known ? escapeHtml(DEX_FLAVOR[id] || DEX_FLAVOR_DEFAULT)
      : 'Todavía no la conoces. Puede aparecer de visita en los juegos de a dos, o nacer de un huevo cuando empieces una mascota nueva.'}</p>
    ${rows.length ? `<div class="menu-list dex-rows">${rows.map(([e, t, v]) =>
      `<div class="si-row"><span class="si-e">${e}</span><div class="si-t"><b>${t}</b></div><span class="si-v">${escapeHtml(v)}</span></div>`).join('')}</div>` : ''}
    ${known ? '<small class="dex-hint">Tócala para ver qué más hace</small>' : ''}
    <button class="overlay-btn secondary" id="btnCloseLogros">Cerrar</button>
  `, closeLogros);
  document.getElementById('overlayCard').classList.add('sheet-full');
  document.getElementById('dexBack').addEventListener('click', () => openLogros('mimodex'));
  document.getElementById('btnCloseLogros').addEventListener('click', closeLogros);

  /* El personaje: canvas en píxeles físicos y escala entera en píxeles
     físicos (la regla de oro), como la mascota de la pieza. */
  const c = document.getElementById('dexCanvas');
  const box = 112;
  c.width = Math.round(box * DPR); c.height = Math.round(box * DPR);
  c.style.width = c.style.height = (c.width / DPR) + 'px';
  const scale = Math.max(1, Math.round(96 * DPR / 32));
  const ctx = c.getContext('2d');
  const actor = gameActor(id);
  let i = 0;
  gaLoop(actor, known ? 'happy' : 'idle');
  if (known) c.addEventListener('click', () => { i = (i + 1) % DEX_ANIMS.length; gaLoop(actor, DEX_ANIMS[i]); });
  const frame = () => {
    if (!document.getElementById('dexCanvas')) return;
    drawSprite(ctx, 'adult', 'normal', 0, false, scale, { w: c.width, h: c.height }, actor);
    dexAnim = requestAnimationFrame(frame);
  };
  dexAnim = requestAnimationFrame(frame);
}

/* ---------- arranque ---------- */
window.addEventListener('DOMContentLoaded', () => {
  prof();
  const btn = document.getElementById('btnLogros');
  /* Vive en la pantalla: el toque no tiene que seguir de largo (el listener
     de los muebles los manda a usar). */
  if (btn) btn.addEventListener('click', e => {
    e.stopPropagation();
    btn.classList.remove('blink');
    if (state && !gameOver && !activeMinigame) openLogros('medallas');
  });
  const dexBtn = document.getElementById('btnDex');
  if (dexBtn) dexBtn.addEventListener('click', e => {
    e.stopPropagation();
    dexBtn.classList.remove('blink');
    if (state && !gameOver && !activeMinigame) openLogros('mimodex');
  });
  const toast = document.getElementById('medalToast');
  if (toast) toast.addEventListener('click', () => {
    if (!state || gameOver || activeMinigame) return;
    openLogros(toast.dataset.tab || 'medallas');
  });
  setInterval(medalsTick, 1000);
  updateLogrosBadge();
});
