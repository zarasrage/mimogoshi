/* ===================== Banco de pruebas de Mimogoshi =====================
   Uso (desde la raíz del repo):

     node tests/run.js            todo (~1-2 min)
     node tests/run.js --rapido   sin la simulación de muerte ni los guiones

   Necesita Playwright con Chromium. En el entorno de la nube ya viene
   (require('playwright') anda desde cualquier carpeta; no correr
   `playwright install`). En otro lado: `npm install playwright --no-save`
   y borrar node_modules al terminar.

   Levanta un servidor estático propio, abre la app en un teléfono de
   390x844 a 3x y corre las pruebas de abajo. Cada una imprime OK o FALLA
   con el detalle; si alguna falla, sale con código 1. Lo que antes se
   probaba a mano en cada sesión (ver CLAUDE.md, "Cómo probar cambios") vive
   acá: al tocar algo, correr esto antes del commit. */

const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const SCRIPTS = ['app.js', 'juegos.js', 'premios.js', 'muebles.js', 'objetos.js', 'huerta.js', 'duo.js', 'duo-juegos.js', 'logros.js'];
const RAPIDO = process.argv.includes('--rapido');

const resultados = [];
function anotar(nombre, ok, detalle = ''){
  resultados.push({ nombre, ok, detalle });
  console.log(`${ok ? 'OK   ' : 'FALLA'}  ${nombre}${detalle ? ' · ' + detalle : ''}`);
}

/* ---------- 1. sintaxis (sin navegador) ---------- */
for (const f of SCRIPTS){
  try { new Function(fs.readFileSync(path.join(ROOT, f), 'utf8')); anotar(`sintaxis ${f}`, true); }
  catch (e){ anotar(`sintaxis ${f}`, false, e.message); }
}

/* ---------- servidor estático ---------- */
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };
function servidor(){
  const srv = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){ res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(ok => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

/* Corre una prueba dentro de la página: `fn` devuelve { ok, detalle }. */
async function prueba(page, nombre, fn, arg){
  try {
    const r = await page.evaluate(fn, arg);
    anotar(nombre, !!r.ok, r.detalle || '');
  } catch (e){
    anotar(nombre, false, String(e.message).split('\n')[0]);
  }
}

(async () => {
  let playwright;
  try { playwright = require('playwright'); }
  catch (e){
    console.log('\nNo está Playwright: `npm install playwright --no-save` (y borrar node_modules al terminar).');
    process.exit(1);
  }
  const srv = await servidor();
  const url = `http://127.0.0.1:${srv.address().port}/index.html`;
  const browser = await playwright.chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', e => errores.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });

  /* ---------- 2. carga y primera mascota ---------- */
  await page.goto(url);
  await page.waitForTimeout(800);
  await page.fill('#nameInput', 'Prueba');
  await page.click('#btnStart');
  await page.waitForTimeout(1200);
  anotar('carga sin errores de consola', errores.length === 0, errores.slice(0, 3).join(' | '));

  /* ---------- 3. sprites ---------- */
  await prueba(page, 'sprites: todas las especies cargadas', () => {
    const malas = SPECIES_IDS.filter(id => !SPECIES[id].ready);
    return { ok: !malas.length, detalle: malas.length ? 'sin cargar: ' + malas.join(', ') : `${SPECIES_IDS.length} especies` };
  });
  await prueba(page, 'sprites: ninguna combinación revienta', () => {
    const c = document.createElement('canvas'); c.width = CANVAS_W; c.height = CANVAS_H;
    const x = c.getContext('2d'); let n = 0;
    for (const id of SPECIES_IDS){ debugForcedSpecies = id;
      for (const st of ALL_STAGES) for (const m of ALL_MOODS){ drawSprite(x, st, m, 0); n++; } }
    debugForcedSpecies = null;
    return { ok: true, detalle: `${n} dibujos` };
  });

  /* ---------- 4. reglas puntuales ---------- */
  await prueba(page, 'noche: de 23:00 a 07:00', () => {
    const esperado = { 21: false, 22: false, 23: true, 0: true, 3: true, 6: true, 7: false, 12: false };
    const mal = [];
    for (const [h, n] of Object.entries(esperado)){
      const d = new Date(); d.setHours(+h, 30, 0, 0);
      simNowMs = d.getTime();
      if (isNightMode() !== n) mal.push(h);
    }
    simNowMs = null;
    return { ok: !mal.length, detalle: mal.length ? 'horas mal: ' + mal.join(', ') : '' };
  });

  await prueba(page, 'mimos: +10 una vez cada 5 min', () => {
    debugMode = false;
    state.stage = 'adult'; state.ageHours = TEEN_HOURS + 10; state.sleeping = false;
    state.happiness = 40; state.lastPet = 0; state.lastUpdate = Date.now();
    for (let i = 0; i < 15; i++) btnPet();
    const tras15 = Math.round(state.happiness);
    state.lastPet = Date.now() - PET_COOLDOWN_MS - 1000;
    btnPet();
    const despues = Math.round(state.happiness);
    return { ok: tras15 === 50 && despues === 60, detalle: `15 toques: 40→${tras15}; pasado el tiempo: ${despues}` };
  });

  await prueba(page, 'máquina reviviente: fósil → huevo fósil', () => {
    state.style.owned.revividor = true;
    curRoom().furniture = [{ id: 'revividor', x: 0.5 }];
    applyStyle();
    const rt = magicRt('revividor');
    if (!rt) return { ok: false, detalle: 'no quedó puesta' };
    bagAdd('fosil', 1);
    const huevos0 = bagCount('huevo_fosil');
    reviveInsert();
    const d = reviveData();
    if (d.at === null) return { ok: false, detalle: 'no tomó el fósil' };
    d.at = Date.now() - REVIVE_MS;
    if (reviveData().ready !== 1) return { ok: false, detalle: 'no quedó lista' };
    openRevividor(rt);
    reviveTake();
    document.getElementById('popup').className = 'popup hidden';
    hideOverlay();
    curRoom().furniture = []; applyStyle();
    return { ok: bagCount('huevo_fosil') === huevos0 + 1 && reviveData().ready === 0, detalle: `huevos fósiles: ${bagCount('huevo_fosil')}` };
  });

  /* ---------- 5. minijuegos: cada uno arranca y se cierra ---------- */
  for (const id of await page.evaluate(() => GAMES.map(g => g.id))){
    errores.length = 0;
    await page.evaluate(gid => { debugMode = true; state.energy = 100; launchGame(gid, false); }, id);
    await page.waitForTimeout(400);
    await page.evaluate(() => { forceCloseMinigames(); hideOverlay(); });
    anotar(`minijuego ${id}: arranca y se cierra`, errores.length === 0, errores.slice(0, 2).join(' | '));
  }

  /* ---------- 6. la simulación: muerte por descuido total ---------- */
  if (!RAPIDO){
    await prueba(page, 'simulación: muerte por descuido (mediana, h reales)', () => {
      const real = triggerGameOver;
      triggerGameOver = () => { gameOver = true; };
      const guardado = JSON.stringify(state);
      debugMode = false; debugForcedNight = false;
      const correr = vacunada => {
        state = loadState() || state;
        Object.assign(state, { hunger: 100, happiness: 100, energy: 100, hygiene: 100, health: 100, sick: false, poop: false,
          sleeping: false, stage: 'adult', ageHours: TEEN_HOURS + 1, vaccinated: vacunada ? { adult: true } : {} });
        state.upgrades.autoClean.armed = state.upgrades.autoMed.armed = false;
        gameOver = false;
        const paso = TICK_MS / MS_PER_GAME_HOUR;
        let ticks = 0;
        while (!gameOver && ticks < 900 * 120){ applyDecay(paso); maybeAutoSleep(); ticks++; }
        return ticks / 900;
      };
      const med = a => { a.sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
      const v = [], s = [];
      for (let i = 0; i < 15; i++){ v.push(correr(true)); s.push(correr(false)); }
      state = JSON.parse(guardado); gameOver = false; debugForcedNight = null;
      triggerGameOver = real;
      const mv = med(v), ms = med(s);
      /* Referencia en CLAUDE.md: ~31 h vacunada y ~25 h sin vacuna. */
      const ok = mv > 24 && mv < 40 && ms > 19 && ms < 33 && mv > ms;
      return { ok, detalle: `vacunada ${mv.toFixed(1)} h · sin vacuna ${ms.toFixed(1)} h` };
    });
  }

  /* ---------- 7. guiones de muebles y objetos, con tiempo acelerado ----------
     Se para el loop de la app y se avanza cuadro a cuadro con un reloj
     virtual (performance.now parchado). Cada guion tiene que terminar solo,
     sin errores, con los personajes en el piso y sin nada dado vuelta. */
  if (!RAPIDO){
    await page.evaluate(() => {
      cancelAnimationFrame(animFrame); animFrame = -1;
      window.__vt = performance.now();
      performance.now = () => window.__vt;
      debugMode = true; state.stage = 'adult'; state.ageHours = TEEN_HOURS + 10; state.sleeping = false;
      setCompanion({ species: 'gato', stage: 'adult', name: 'Visita', kind: 'visita' });
      socialNextAt = Infinity;
      /* Avanza hasta que nadie esté usando `rt` (o, sin rt, hasta que los
         dos queden libres). Devuelve los segundos que tardó o null. */
      window.__correr = (rt, maxS = 120) => {
        const ocupado = () => [walker, buddy].some(a => a.activity && (rt ? a.activity.rt === rt : true));
        for (let t = 0; t < maxS * 20; t++){
          window.__vt += 50;
          updateWalker(0.05); digestMeal(); updateBuddy(0.05); render();
          if (!ocupado()) return t / 20;
        }
        return null;
      };
      window.__piso = () => [walker, buddy].every(a => a.y < 1 && !a.flipY && !a.hidden);
    });

    const ids = await page.evaluate(() => Object.keys(FURNI_ART));
    let total = 0;
    const malos = [];
    for (const id of ids){
      errores.length = 0;
      const r = await page.evaluate(fid => {
        state.style.owned[fid] = true;
        curRoom().furniture = [{ id: fid, x: 0.5 }];
        applyStyle();
        const rt = furniPlaced(fid), art = FURNI_ART[fid];
        const out = [];
        const caso = (nombre, arrancar) => {
          for (const a of [walker, buddy]){ if (a.activity) endFurniActivity(a, false); a.x = a === walker ? 0.3 : 0.7; a.y = 0; }
          try {
            arrancar();
            const s = window.__correr(rt);
            out.push({ nombre, ok: s !== null && window.__piso(), s });
          } catch (e){ out.push({ nombre, ok: false, err: e.message }); }
        };
        (art.visits || []).forEach((v, i) => {
          caso(`visita ${i}`, () => startActivity(walker, v(furniHelpers(rt, walker)), { rt, kind: 'visit' }));
          caso(`visita ${i} (acompañante)`, () => startActivity(buddy, v(furniHelpers(rt, buddy)), { rt, kind: 'visit' }));
        });
        (art.routines || []).forEach((v, i) => caso(`rutina ${i}`, () => startActivity(walker, v(furniHelpers(rt, walker)), { rt, kind: 'routine' })));
        (art.duos || []).forEach((v, i) => caso(`dúo ${i}`, () => {
          const d = v(furniHelpers(rt, walker, buddy)), duo = newDuo(walker, buddy);
          startActivity(walker, [...d.a, S.sync('__fin')], { rt, kind: 'duo', duo, partner: buddy });
          startActivity(buddy, [...d.b, S.sync('__fin')], { rt, kind: 'duo', duo, partner: walker });
        }));
        return out;
      }, id);
      for (const c of r){
        total++;
        if (!c.ok) malos.push(`${id} ${c.nombre}${c.err ? ': ' + c.err : c.s === null ? ': no terminó' : ': quedó en el aire o escondido'}`);
      }
      if (errores.length) malos.push(`${id}: ${errores[0]}`);
    }
    anotar('guiones de muebles y objetos', !malos.length, `${total} guiones${malos.length ? ' · ' + malos.slice(0, 5).join(' | ') + (malos.length > 5 ? ` (+${malos.length - 5})` : '') : ''}`);

    errores.length = 0;
    const sociales = await page.evaluate(() => {
      curRoom().furniture = []; applyStyle();
      const malos = [];
      for (const s of SOCIALS) for (let k = 0; k < 2; k++){
        for (const a of [walker, buddy]){ if (a.activity) endFurniActivity(a, false); a.y = 0; }
        if (!startSocial(s.id)) continue;
        const t = window.__correr(null);
        if (t === null || !window.__piso()) malos.push(s.id);
      }
      return { n: SOCIALS.length * 2, malos };
    });
    anotar('juegos entre los dos personajes', !sociales.malos.length && !errores.length,
      `${sociales.n} corridas${sociales.malos.length ? ' · trabados: ' + sociales.malos.join(', ') : ''}${errores.length ? ' · ' + errores[0] : ''}`);
  }

  /* ---------- 8. diseño: sin scroll de costado en un teléfono chico ---------- */
  const chico = await browser.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
  await chico.goto(url);
  await chico.waitForTimeout(600);
  const scroll = await chico.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  anotar('360x640: sin scroll horizontal', scroll <= 0, scroll > 0 ? `${scroll}px de más` : '');

  await browser.close();
  srv.close();
  const fallas = resultados.filter(r => !r.ok).length;
  console.log(`\n${resultados.length - fallas} de ${resultados.length} OK${fallas ? ` · ${fallas} FALLA${fallas > 1 ? 'N' : ''}` : ''}`);
  process.exit(fallas ? 1 : 0);
})();
