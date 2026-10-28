# Mimogoshi — tamagotchi de una sola página

Mascota virtual pixel-art en HTML/CSS/JS puro. **Sin build, sin frameworks, sin
backend**: se edita directo y se abre `index.html` en el navegador. Todo el
progreso vive en `localStorage`.

Este archivo dice **cómo funciona hoy** y las reglas para tocarlo. El **porqué**
de cada decisión (lo que se probó antes, lo que falló, las calibraciones
viejas) está en `docs/HISTORIA.md`: leerlo antes de cambiar algo que parezca
raro, porque casi siempre hay una razón. Al decidir algo nuevo, anotar acá lo
vigente y en `docs/HISTORIA.md` → "Cambios posteriores" lo que cambió y por qué.

Se trabaja **siempre directo sobre `main`**, sin ramas ni PRs — proyecto de una
sola persona.

## Archivos

`index.html` (esqueleto), `styles.css` (todo el CSS) y nueve scripts clásicos
que comparten el ámbito global, cargados en este orden:

| Archivo | Qué tiene |
|---|---|
| `app.js` | Núcleo: especies, estado, simulación, bitácora, render, comida, tienda, Personalizar, fichas de los relojes, panel de prueba |
| `juegos.js` | Menú de Jugar (`GAMES`, niveles, desafío diario, resultado), lo común a los minijuegos (canvas, mandos, sonido, premio) y los 6 de uno |
| `premios.js` | Ruleta y gacha (en pausa) |
| `muebles.js` | Muebles (catálogo, arte, guiones), habitaciones y el **motor de actores** |
| `objetos.js` | Objetos mágicos: muebles con ganchos propios y sus capas de efectos |
| `huerta.js` | Mochila, tesoros, huerto, regadera, cocina y la máquina reviviente |
| `duo.js` | El acompañante (`buddy`) y los juegos entre los dos |
| `duo-juegos.js` | Los 6 minijuegos de a dos |
| `logros.js` | Medallas y Mimodex (clave propia de `localStorage`, sobreviven a la mascota) |

Lo de un archivo que usa otro se usa recién en tiempo de juego (después de
`DOMContentLoaded`), nunca al cargar — salvo los `push` a arreglos de otro
archivo (`STYLE_ITEMS` y `minigameDisposers` de `app.js`, `GAMES` de
`juegos.js`, `FURNI_ART` de `muebles.js`), que por eso van después del archivo
dueño del arreglo.

`sprites/`: un par `<especie>.png` + `.json` por especie, cargados como
`new Image()` por ruta relativa. `docs/PLAN-PERSONAJES.md` planifica (sin
construir) los 100+ personajes y el Club de la pelea; `docs/sim-combate.js`
simula sus fórmulas. `tests/run.js` es el banco de pruebas.

## Cómo probar cambios

```bash
node tests/run.js            # todo, ~1-2 min
node tests/run.js --rapido   # sin la simulación de muerte ni los guiones
```

Necesita Playwright con Chromium. En el entorno de la nube ya está
(`require('playwright')` anda desde cualquier carpeta; **no** correr
`playwright install`; el binario está en `/opt/pw-browsers/chromium`). En otro
lado, `npm install playwright --no-save` y borrar `node_modules` al terminar.

Prueba: sintaxis de los 9 scripts, carga sin errores de consola, sprites
cargados y todas las combinaciones especie × etapa × ánimo, la noche, el tope
de los mimos, la máquina reviviente, que cada minijuego arranque y se cierre,
la muerte por descuido total (mediana, contra la referencia de "Ritmos" más
abajo), **cada guion de cada mueble y objeto** (visitas con la mascota y con
el acompañante, rutinas y dúos: hoy 373) con tiempo acelerado, los 14 juegos
entre los dos personajes y que no haya scroll horizontal en 360×640. Al sumar
algo nuevo con reglas propias, sumarle su prueba ahí.

El banco no mira la pantalla: después de un cambio visual, sacar una captura
con `deviceScaleFactor` 2 o 3 (un teléfono real es 3x — los bugs de escalado
solo aparecen ahí) y mirarla.

## La regla de oro: escalas enteras

**Un píxel del arte ocupa siempre el mismo número entero de píxeles físicos en
pantalla.** Es el bug que más veces reapareció: con escala fraccionaria unos
píxeles salen de 2 y otros de 3, y en una cara de 32x32 eso junta los ojos con
la boca. "Píxeles físicos", no px CSS: un teléfono 3x tiene 3 por px CSS, y ahí
está el margen para tamaños que no son múltiplos de 32.

La cadena, que **no hay que romper**:

- El arte es de 32x32 por cuadro.
- `#petCanvas` mide **96x96 px CSS**; su backing store va en píxeles físicos
  (`fitPetCanvas()`: `96 * DPR`).
- El tamaño por etapa (`STAGE_CSS_PX = {child:50, teen:64, adult:78}`) es un
  **objetivo** en px CSS; `stageDeviceScale()` lo pasa a escala entera en
  píxeles físicos (`round(objetivo * DPR / 32)`): 53/64/75 en 3x, 48/64/80 en
  2x. Para cambiar el tamaño de la mascota se tocan esos objetivos, nada más.
- Lo que no es la mascota principal va a escala entera de px CSS sobre canvas
  1:1: `CANVAS_W`/`CANVAS_H` = 96 son el `box` por defecto de `drawSprite()`, y
  los minijuegos dibujan con `drawPetAt()` / `drawActorAt()` a escala 2, con
  `ctx.translate()` y **sin** `ctx.scale()`.
- Nunca escalar un canvas con CSS a algo que no sea su backing store / `DPR`.
- Miniaturas: `speciesThumbStyle(id, s)` con `s` entero (1 en el selector de
  inicio, 2 en el resto).
- Muebles, objetos, partículas, la jeringa y la mascota de la ruleta: escala
  entera en píxeles físicos (`furniDeviceScale()`; un píxel del mueble mide lo
  mismo que uno de la mascota adulta).
- Íconos pixel de la LCD (`PX_ICONS`): escala redondeada en píxeles físicos
  (`pxIconScale()`) y corridos al píxel físico con `snapPixelIcons()`. **Nunca
  escalarlos con `transform`**: los latidos son de brillo y halo.
- `drawEgg()` dibuja sus radios como fracción del `box`, no en píxeles fijos.
- `drawSprite()` devuelve `{species, frame, scale, dx, dy, box}` en píxeles del
  canvas; para ubicar algo encima en px CSS, dividir por `box.w / CANVAS_W`.

`imageSmoothingEnabled = false` e `image-rendering:pixelated` son necesarios pero
**no** suficientes: no arreglan una escala fraccionaria.

## Sprites

**Formato** (todas las especies): PNG de 224x128, grilla de 7x4 cuadros de 32x32
(28), alfa dura, JSON con los cuadros por nombre y animaciones con
`durations_ms`. Los cuadros, en orden de índice:

```
normal, blink, idle_squash, walk_1, walk_2, happy_1, happy_2,
happy_3, happy_4, sad_1, sad_2, sick_1, sick_2, sleep_1,
sleep_2, eat_1, eat_2, eat_3, pet_1, pet_2, pet_3,
clean_1, clean_2, medicine_1, medicine_2, celebrate, dead_1, dead_2
```

Las 12 animaciones (`idle`, `walk`, `happy`, `sad`, `sick`, `sleep`, `eat`,
`pet`, `clean`, `medicine`, `celebrate`, `dead`) son iguales en todas las
especies. `LOOPING_ANIMS` decide cuáles se repiten (los ánimos: idle, walk,
sad, sick, sleep, dead); las demás son acciones de una vez. `normalizeSpecies()`
traduce el JSON al runtime al cargar. Los sprites se dibujan **tal cual**, sin
tinte: el huevo (`drawEgg()`, un óvalo que se tambalea sobre su base) es lo
único procedural.

**Revisar un asset antes de integrarlo** (un PNG con las medidas correctas
igual puede estar malo):

```python
from PIL import Image
im = Image.open(f).convert('RGBA'); px = im.load(); W,H = im.size
print(len({px[x,y] for y in range(H) for x in range(W) if px[x,y][3]>0}))   # ~10-40 OK; miles = reescalado con interpolación
print(sum(1 for y in range(H) for x in range(W) if 0<px[x,y][3]<255))       # 0 OK; miles = bordes blandos
```

Y medir los runs verticales de píxeles opacos por columna: si los sprites no
caen en múltiplos de 32 (la fila de abajo asoma en la celda de arriba), hay que
**regrillar** apoyando cada sprite en el piso de su celda (`ny = y - ymax + 31`).
Si llega un JPG con el damero pegado, la receta de recuperación está en
`docs/HISTORIA.md`; siempre preferir el PNG con transparencia.

**Agregar una especie:**
1. `sprites/<id>.png` verificado, y su `.json` copiando el de otra (cambiar
   `character`, `id`, `image`).
2. En `app.js`: `<ID>_RAW` con el JSON **embebido** (con `file://` no anda un
   `fetch()`), registrado en `SPECIES_RAW`, `SPECIES` y `SPECIES_IDS`.
3. Su frase en `DEX_FLAVOR` (`logros.js`).
Selector, panel de prueba, miniaturas, Mimodex y medallas se arman solos.

El selector de especie (`.species-list`) es una rejilla de 3 columnas con tope
de alto y scroll propio (comparte la regla de `.menu-list`): crece sola con más
especies, **no** agrandar `#screen` para perseguirla. La pantalla de inicio no
enfoca el campo del nombre (el teclado tapaba el selector), esconde `.controls`
y pone `.onboarding` en `#screen` (que afloja el alto a `clamp(290px, 62vh,
560px)`); `start()` deshace las dos cosas antes de `boot()`.

## Interfaz

Dos estilos a propósito: la **pantalla LCD** (pixel, retro) es donde vive la
mascota y todo lo de adentro es pixel art (íconos de `PX_ICONS`, no emojis);
todo lo de alrededor (botones, hojas, pop-ups, panel de prueba) es una **app
moderna de teléfono** con emojis. Tokens en `:root` de `styles.css` (`--brand`
es el único degradado de marca; colores de cada reloj en `--c-energy`,
`--c-hygiene`, `--c-health`, `--c-happiness`, `--c-hunger`, con `-hi` y `-ink`).

- **Hojas**: `#overlay` es hijo de `.device` (cubre el aparato entero) y
  `.overlay-card` sube desde abajo; es una columna flex donde solo `.menu-list`
  cede alto y se lleva el scroll. `showOverlay(html, onDismiss)`: con
  `onDismiss`, tocar el fondo la cierra (menús con Cerrar/Cancelar; inicio y
  despedida no). Variantes: `.sheet-full` (tienda, fichas), `.sheet-tall`
  (Personalizar, mochila), `.clear` (sin desenfoque: Personalizar, resultado).
- **Botones de hoja**: `.overlay-btn` (primario), `.secondary` (salir; nunca
  el degradado), `.danger`; varios juntos en `.overlay-actions`. Toda
  confirmación destructiva lleva Cancelar.
- **Los avisos de una hoja van dentro de la hoja**, no con `say()`: la burbuja
  (`z-index:5`) queda debajo del overlay (`10`).
- **Pop-ups** (`showPopup()`, `#popup`, `z-index:20`): toda compra se confirma
  (`confirmBuy()`, con − / + / Máx para lo que va por porciones) y después
  `boughtPopup()`; lo que se gana (ruleta, gacha, regalos, cocina, cosecha)
  también sale en pop-up. El resultado de los minijuegos tiene su propia hoja.
- **Dock** (`.controls`): Dormir, Limpiar, Jugar, Comer, en el orden de los
  relojes, con el color de su reloj; debajo las píldoras Personalizar y
  Tienda. Arriba, ⚙️ Configuración (Reiniciar) y 🧪 modo prueba.
  `updateDock()` (desde `render()`, solo toca el DOM si algo cambió) marca
  `.need` y el globito `data-badge`: 💊 en Comer si está enferma, 💩 en
  Limpiar, zZ en Dormir bajo `SLEEPY_THRESHOLD`, 🎡 en Jugar con la ruleta
  gratis, 💉 en Tienda si falta la vacuna. Limpiar en espera se ve apagado y su
  etiqueta es la cuenta regresiva.
- **Relojes** (`#stats`): cinco anillos SVG (`pathLength="100"`) en el orden
  energía, higiene, **salud** (al medio y más grande), felicidad, hambre. Cada
  uno de su color; `statColor()` solo decide si va `.low`. Durmiendo, el de
  energía lleva `.charging`. **Tocar un reloj** abre su ficha
  (`openStatInfo(stat, tab)`): pestaña **Ahora** (ritmo neto, cuánto falta,
  lo que la mueve, lo que se puede hacer) y **Todo** (el catálogo y los
  umbrales). Sale de `statInfoData()`, que se arma con las **constantes de la
  simulación**: al sumar una fila, `fx: true` si pasa sola y `on` cuando está
  pasando; sin `fx` si es algo que se hace. A mano solo van los costos de
  higiene y energía de los minijuegos: al cambiarlos en `finishMinigame()`,
  actualizar esas filas. Colores en `rgba()`, nunca `color-mix()` (lo rompen
  teléfonos un poco viejos).
- **Íconos pixel**: para sumar uno, agregarlo a `PX_ICONS` (relleno con
  letras b/l/m/w y propias; el contorno se agrega solo) y usar
  `<i class="px-icon px-nombre">`. Revisar que tenga las filas justas (9x9 los
  de los relojes, 7x7 los de arriba): una fila de más no da error, deja un
  borde raro abajo.
- **Pestañitas del borde izquierdo** (`.log-btn`): 📜 bitácora, 🏆 medallas,
  📖 Mimodex y 🎒 mochila (esta solo con la Mochila comprada). Su clic frena
  la propagación.
- **Bandeja de Comer** (`#foodTray`, `toggleFoodTray()`): flota encima del
  dock sin cambiar el alto del aparato y no tapa la pantalla. Las 7 comidas
  más la medicina en dos filas de cuatro; con cocina o platos, pestañas
  Despensa / Hecho en casa. Tocar una gasta la porción y la comida **cae del
  cielo** a un montón (`foodPile`, hasta `FOOD_PILE_MAX`); la bandeja no se
  cierra, se pueden tirar varias. La mascota camina una vez
  (`startEatRoutine()`) y se las come una tras otra; **las barras suben
  mientras come** (`state.meal` guarda lo que falta; si se corta,
  `flushMeal()` lo suma; si se cierra la app, `loadState()`). Mientras come no
  se puede hacer nada más (`mealBusy()`, un listener de captura en `window`)
  salvo seguir tirándole comida.
- Todo lo tocable: `-webkit-tap-highlight-color:transparent`,
  `user-select:none`, `touch-action:manipulation`; `:hover` dentro de
  `@media (hover:hover)`; el `<input>` a 16px (Safari hace zoom con menos).
- **Teléfono (≤ 500px)**: el aparato va de borde a borde y llena el alto (cada
  nivel pasa el alto con `flex:1`; la pantalla se lleva lo que sobra). Ojo con
  los minijuegos: `showGameControls()` compensa el cambio de alto de los mandos
  para que el canvas medido no quede estirado. Escritorio: aparato de 420px
  centrado. `viewport-fit=cover`, `theme-color` y `env(safe-area-inset-*)`.

## Estado y simulación

`localStorage`, clave `SAVE_KEY = 'mimogoshi.save.v2'`. **Todo acceso a
`localStorage` va en try/catch** (algunos visores lo bloquean y la página queda
en blanco). `loadState()` migra saves viejos: cada campo nuevo necesita su
relleno ahí, y al borrar o renombrar algo (especies, comidas, objetos, juegos)
hay que mapearlo o devolver lo pagado (`REMOVED_STYLE`, `REMOVED_GAMES`).

**Ticks**: `TICK_MS = 4000`, `MS_PER_GAME_HOUR = 60000` (una hora real = 60 de
juego). `catchUp()` simula la ausencia **de a un tick** (con
`maybeAutoSleep()` y la hora de cada paso en `simNowMs`), con tope
`CATCHUP_CAP_MS` = 72 minutos reales: pasado eso la mascota queda en pausa.
Al volver a la pestaña (`visibilitychange`) corre un `tick()`. Lo que va por
hora real (huerto, cocina, compost, árbol, frijol, máquina reviviente, ruleta,
desafío diario) no tiene ese tope.

**Bitácora** (`state.log`, hasta `LOG_MAX`): solo lo que pasó solo (caca,
enfermarse, seguros, regalos, nacer y crecer, barras que cruzan un umbral hacia
abajo, lo que encontró cavando). `logChanges()` compara antes y después de cada
paso. Si estuvo cerrada `AWAY_MIN_MS` (2 min) o más y pasó algo, `logAway()`
cierra el grupo con un encabezado y el 📜 pestañea; no abre nada solo.

### Ritmos (por hora real, salvo que se diga)

| Barra | Baja | Sube |
|---|---|---|
| Hambre | lleno a vacío en 7 / 6 / 5 h (niño / adolescente / adulto), ver "Hambre por etapa" | comida |
| Felicidad | 12 (`DECAY_PER_HOUR.happiness`) | jugar (mérito/3, tope 15), mimos (+10 cada 5 min), regalos, muebles (tope 6/h), ruleta |
| Higiene | 2; con caca sin recoger, 18 (`HYGIENE_POOP_DECAY`) | bañar +25 cada 5 min, caca +10 |
| Energía | ~1,8 despierta | durmiendo, barra entera en 45 min (30 con cama) |
| Salud | 3 si hambre, felicidad o higiene < 30 (cuenta una vez); 2 enferma; 1 agotada y despierta; 20 al día sin la vacuna de su etapa | 15 al día sin ninguna causa |

Bajo `DISTRESS_AT` (20; energía 10) la barra baja ×1,5. Dormida, hambre y
felicidad bajan a un cuarto. De noche todo lo que decae va a la mitad
(`NIGHT_DECAY_FACTOR`), salvo la vacuna. La caca sale con mediana ~3,5 h
(`POOP_CHANCE_PER_HOUR`) y los regalos con mediana ~12 h
(`GIFT_CHANCE_PER_HOUR`, calibrado aparte: no tocarlo al recalibrar lo demás).

**Referencia, medida por `tests/run.js`**: totalmente descuidada (sin noche,
ticks de 4 s) muere en una mediana de **~29-31 h vacunada** y **~24-25 h sin
vacuna**. Las proporciones entre barras **no** son uniformes: al recalibrar,
volver a medir con el banco, no razonar con un factor.

**Higiene**: el botón **Limpiar baña** (+`CLEAN_HYGIENE` 25, después
`CLEAN_COOLDOWN_MS` 5 min, `state.lastClean`) y si hay caca también la recoge
(+10). La caca también se recoge **tocándola** (`cleanPoop()`, +10, sin
espera); con la pala en la pieza, tocarla manda a la mascota a recogerla.

**Mimos**: tocar a la mascota suma `PET_HAPPINESS` (10) **una vez cada
`PET_COOLDOWN_MS`** (5 min, `state.lastPet`, `petWaitMs()`). Mientras espera,
el toque igual hace la animación y el corazón (nunca se siente roto) pero no
suma ni cuenta para la medalla Regalón. Tocarla dormida la despierta
(`tryWake()`).

**Modo nocturno** (`isNightMode()`): de **23:00 a 07:00 hora real del
dispositivo** (`NIGHT_START_HOUR`/`NIGHT_END_HOUR`, cruza la medianoche;
`NIGHT_LABEL` para los textos). Decae a la mitad y `maybeAutoSleep()` cambia a
un sube-y-baja de sueño (`NIGHT_SLEEP_ENTER_CHANCE`/`EXIT`, 3:1, ~75% dormida).
Se ve: `.night` en `#screen` (fondo oscuro y estrellas) y el sol/luna de
arriba, que al tocarlo explica la noche. El panel de prueba gira hora real →
noche forzada → día forzado (`debugForcedNight`).

**Sueño y energía**, de abajo hacia arriba:
- `< ENERGY_LOCK_AT` (7): se duerme en el acto (`collapseIfDrained()`, también
  al terminar un minijuego) y nada la despierta.
- `< EXHAUSTED_AT` (15): agotada; se la puede despertar, pero despierta pierde
  salud y se ve triste. Dormida no cuesta nada.
- `< SLEEPY_THRESHOLD` (20): puede dormirse sola (más probable mientras menos
  energía). Después de despertarla a mano hay `WAKE_GRACE_MS` (90 s).
- `WAKE_AT` (90): se despierta sola. Dormir con 90 o más: "No tiene nada de
  sueño".
- `GAME_MIN_ENERGY` (10) para lanzar un minijuego.

**Etapas** (`ALL_STAGES`): `egg → child → teen → adult`, por `ageHours` de
juego: huevo `EGG_HOURS` (~6 s), niño 1 día real, adolescente 3 más. La única
diferencia entre etapas es el **tamaño** (no hay arte por edad: no inventar
ramas visuales). `loadState()` manda a `adult` cualquier etapa que no exista.
Ánimos (`ALL_MOODS`): `normal, happy, sad, sick, sleepy, dead`.

**Hambre por etapa** (`HUNGER_CAP` 70/110/180 puntos de panza,
`HUNGER_PER_REAL_HOUR` 9,33/17,1/33,6): `state.hunger` se guarda en **%**; lo
que cambia por etapa es cuánto % llena una comida (`hungerFillPct()`) y cuánto
% baja (`hungerDecayPerHour()`). Mientras más grande, menos aguanta y más
cuesta: ~35 monedas al día de niño, ~79 de adolescente, ~172 de adulto. Uno de
6 partidas al día no alcanza a mantener al adulto: es la versión exigente,
elegida a propósito. Al crecer se mantiene el %. El Banquete (`fill:true`)
llena entero en cualquier etapa.

`careGood` / `careBad` se acumulan y **no los lee nadie**: se dejan como
enganche para un final según el cuidado.

### Comida, medicina y vacunas

- `FOODS`: bocadillo 5 (+15), rica 9 (+30), especial 14 (+50) — descuento por
  tamaño —, Red Bull 20 (+2, energía +20), Banquete 55 (llena), Café 10 (solo
  energía +15), Jugo 22 (solo energía +35). `food.energy` opcional, si no
  `FOOD_ENERGY_DEFAULT` (4). `state.pantry` guarda porciones; se arranca con
  `FOOD_START_STOCK` (5) bocadillos.
- **Medicina** (`MEDICINE`, 15): una porción más de la despensa, se da desde
  Comer (`giveMedicine()`); **solo cura**, no suma salud. Se arranca con 2.
- **Vacunas** (`VACCINES`: niño 20, adolescente 50, adulto 100): sin la de su
  etapa la salud pierde 20 al día, siempre (con la recuperación de 15 queda en
  −5 al día). Vacunada se enferma la mitad (`VACCINE_SICK_MULT`). Se compran
  en Mejoras (solo la de su etapa) y se ponen **al comprarlas**
  (`applyVaccine()` primero, después la animación `vaccinateFx()` y recién ahí
  el pop-up).
- Regalos (`collectGift()`, tocando el 🎁): una comida mejor
  (`GIFT_FOOD_POOL`), +8 de felicidad, la mitad de las veces un ticket de
  ruleta y la mitad un sobre de semillas.

## Dinero y tienda

Las monedas salen sobre todo de **jugar** (puede haber otras fuentes, pero
jugar bien tiene que seguir siendo la principal). Cada juego le pasa a
`finishMinigame()` un **mérito** (~45 = partida muy buena):
- **Felicidad** = mérito/3, tope 15 (jugar no tapa el descuido).
- **Monedas** = mérito/6 × `LEVEL_COIN_MULT`, **sin tope** (jugar excelente
  paga más). No derivarlas de la felicidad topada.

Tienda (`openShop()`, `shopTab`): **Comida** (comidas, medicina, harina),
**Mejoras** (vacuna, próxima habitación, seguros), **Objetos** (en el código
`'style'`/`STYLE_ITEMS`) y Gacha si está prendido. La tienda es solo para
comprar; ponerse y sacarse cosas es en **Personalizar** (`openPersonalize()`,
`styleRows('mine')`). Lo comprado queda puesto de una si cabe.

- **Mejoras** (`UPGRADES`): armables (`autoClean` 30, `autoMed` 50) son un
  seguro de un solo uso que se desactiva al disparar y se reactiva gratis a
  mano; no armables (`sendVisit`, `returnVisit`) todavía no hacen nada —
  enganche para las visitas.
- **Objetos**: secciones en `STYLE_SECTIONS` — Esenciales (`group:'esencial'`,
  la Mochila, `kind:'tool'`: no se pone ni se saca), Huerta y cocina
  (`group:'huerta'`), Objetos mágicos (`wow:true` sin grupo), Muebles, Carcasa
  (`kind:'shell'`), Pantalla (`kind:'screen'`). Accesorios (`hat`) y adornos
  (`deco`) **no hay hoy** (los emojis se sacaron por feos); el motor quedó.
- **Los colores viven en el catálogo, no en el CSS**: `applyStyle()` los pone
  como variables sobre `#device` (`--shell-a/b/c`, `--screen`, `--screen-hi`,
  `--screen-lit`, `--screen-lit-rgb`, `--screen-edge`). Todo color de la LCD
  sale de esas variables (lo encendido con transparencia como
  `rgba(var(--screen-lit-rgb), .x)`).
- **Ids únicos en todo `STYLE_ITEMS`** (un choque hizo que tocar un mueble
  pusiera un adorno).
- **Habitaciones**: hasta `ROOM_MAX` (4), `ROOM_PRICES` 150/250/400. Cada una
  con sus muebles (`state.style.rooms`, `curRoom()`); un mueble está en una
  sola (`roomOf()`). Flechas `‹ ›` y puntitos; `goRoom()` corta todo y los
  personajes entran caminando. La cama vale esté donde esté.

### Ruleta y gacha (`premios.js`)

**Ruleta** (desde la fila 🎡 del menú de Jugar): un giro gratis cada
`WHEEL_CYCLE_MS` (12 h reales) y giros extra con **tickets** 🎫
(`state.wheelTickets`, de los regalos; no tocan el reloj del gratis).
`WHEEL_PRIZES`: 19 trozos (pesan 105), cada uno del ancho de su probabilidad;
monedas de +1 a +100 y de −2 a −10 (nunca bajo cero), comida, medicina,
felicidad. En promedio ~+6,1 monedas por giro (menos que una partida buena);
gana el 59%, pierde el 11%. El premio se sortea y se guarda al tocar Girar.
La animación (`wheelSpinLoop()`, rAF) sabe qué trozo está bajo la lengüeta:
cada clavo suena y la hace saltar. La mascota gira la rueda (`#wheelPet`,
`wheelPetPose()`). Rueda en SVG (`wheelSvg()`), números orientados según el
ángulo final.

**Gacha: EN PAUSA** (`GACHA_ON = false`): sin pestaña, sin trozos de fichas
en la ruleta, sin ficha en el oro de las medallas ni medalla Coleccionista.
Las fichas guardadas siguen en `state.gachaTickets`. Para volver: `true` y un
catálogo que valga la pena (`GACHA_ITEMS`, ids `g_`, `price: null`).

## Muebles y objetos

Todo el motor vive en `muebles.js`. `curRoom().furniture = [{id, x}]` (`x` =
centro como fracción del piso), hasta `FURNI_MAX` (3) por habitación, en
cualquier parte (`findFurniSpot()`, separación `FURNI_GAP_PX`). Personalizar →
**Acomodar muebles** (`enterArrange()`) los deja arrastrar en horizontal.
`free: true` (pelotas, plato, nube, patineta) no chocan y van en `#furniMid`.

**Catálogo hoy**: 36 muebles (cama, plato, bañera, tocador, trampolín, tres
pelotas, columpio, tobogán, radiocasete, tele, piano, tarima, librero, cajas,
pecera, maceta, rueda, balancín, cohete, arenero, piscina, hamaca,
telescopio, cucú, caballito, batería, caballete, cocinita, cofre, escalada,
ventilador, bola disco, puf, piñata) y 27 objetos con `wow`: 21 mágicos
(`objetos.js` + la máquina reviviente) y 6 de la huerta.

**Arte**: pixel art dibujado con código (`pxPainter()`: `r`, `box`, `disc`,
`ell`, `ring`, `line`), nunca emojis. Cada objeto tiene `parts` (canvas
separados) con `show` (bandera o función de `rt`), `pivot`, `pose`, `flicker`
y `z:'front'` (pasa adelante solo mientras alguien está adentro,
`furniOccupied()`).

**Guiones**: cada mueble tiene `visits`, `duos` y (cama, plato, bañera)
`routines`; cada guion `f => [pasos]` recibe `furniHelpers()` y lo corre
`runFurniActivity()`. Pasos: `go`, `hop`, `slide`, `bounce`, `kick`, o
quedarse (`anim`, `ms`/`until`, `fx`, `flip`, `swing`, `track`); de a dos
`chase`, `flee`, `ride`, `sync`, `call`; en cualquiera `hide`, `start`, `end`.
Valores pueden ser funciones `(st, act) => ...`. **No hay arte nuevo**: se
combinan las animaciones de la especie (`walker.anim` manda en
`pickAnimation()`) con movimiento (`walker.y`) y partículas (`petFx()`).
Atajos en `S` (`S.happy`, `S.sync`, `S.wait`...).

- **Rutinas**: `triggerPetAction()` desvía comer/limpiarse a
  `startFurniRoutine()`; dormida va a la cama sola. No se cortan por estar
  triste o enferma.
- **Espontáneas**: al terminar un paseo, `FURNI_VISIT_CHANCE` y
  `FURNI_VISIT_GAP_MS`, nunca el mismo dos veces seguidas; se cortan si se
  duerme, se pone triste/enferma, se la toca o empieza un minijuego. Si una
  visita dura menos de `FURNI_VISIT_MIN_MS` (9 s) encadena otro guion.
- **Tocar un mueble** (`commandFurniVisit()`): la manda a usarlo; con el
  acompañante libre, a veces de a dos. El toque se mira a mano en un listener
  **de captura** sobre `#creatureFloor` (`spriteHit()` para los personajes,
  `partHit()` para los píxeles del mueble con `FURNI_TAP_SLOP`). El destello
  va en `filter`, no en `transform`.
- **Pelotas**: mismos guiones (`BALL_VISITS` 16, `BALL_DUOS` 9) escritos con
  `ballKit(f)`; física propia (`ballTo`, `ballFollow`/`ballRelease`, botes al
  `BALL_BOUNCE_KEEP`). La pelota queda donde terminó, siempre en el piso.
- Efectos en las barras, chicos a propósito: cama ×1,5 de energía
  (`FURNI_BED_ENERGY_MULT`), cada visita +1 de felicidad (`FURNI_JOY`) con tope
  6 por hora (`FURNI_JOY_PER_HOUR`, `furniJoy()`).

**Ganchos de los objetos** (opcionales en `FURNI_ART`): `tick(rt, now, dt, k)`
(vida propia cada cuadro), `tap(rt)` (devuelve `true` si se hizo cargo; corre
antes del chequeo de bloqueo), `cleanup(rt, act, a)` (al terminar o cortarse),
`keep: [...]` (campos que sobreviven a `resetFurniRt()`), `thumb`, `init`.
`startChore(rt, pasos)` es una **tarea** (`kind:'chore'`: no la corta estar
triste o enferma; dormida no va): si deja algo pendiente, `rt.pending` y
`cleanup` lo ejecutan igual. `magicGo()` manda a la mascota con los chequeos
de un toque. `objData(id)` guarda en el save (`state.objData`). Capas:
`#ambientLayer` (luz, `setAmbient()`), `canvas#fxBack`, `#cloneCanvas`,
personajes, `#furniFront`, `canvas#fxFront`, `#magicFlash`. Partículas pixel
(`PX_SHAPES`, `fxSpawn()`, `fxBurst()`, `fxEffect()`) en px CSS del piso con
`y` hacia arriba. `startFloorMode()` convierte el piso en mando (captura en
`window`). `act.flipY` da vuelta a un personaje con `scaleY(-1)`
(`actorTransform()`).

**Los objetos mágicos**: láser, jetpack, burbujas, cámara (álbum de
`ALBUM_MAX` fotos re-dibujadas), bola de cristal (predicción real con los
ritmos), robot aspiradora (una caca cada 20 h), nubecita (lluvia +4 de
higiene), árbol frutal (una manzana cada 6 h, a la mochila), frijol mágico
(120 monedas al llegar arriba, ~5 días), fuegos artificiales, prisma,
planetario, máquina de nieve, lámpara de lava, portal (viaja de habitación),
caja musical (de noche, cuna que la duerme), cañón, gelatina, patineta, espejo
(el reflejo la imita), pala recogecaca + compostera, y la máquina reviviente.

**Pala y compostera**: con la pala en la pieza, tocar la caca es una tarea:
la palea (+10) y la guarda en el balde (`PALA_MAX` 5). Tocar la compostera
vacía el balde; cada caca es un saco de fertilizante en `COMPOST_MS` (4 h
reales, `compostData()`), hasta `FERT_READY_MAX` esperando. El fertilizante
va a la mochila y hace dar fruta al árbol, crecer el frijol o crecer el
huerto al doble.

## Mochila, huerta, cocina y fósiles (`huerta.js`)

- **Mochila** (`state.bag`, `bagAdd()`/`bagCount()` en `app.js`, `bagGain()`
  avisa en la pestañita; catálogo `BAG_ITEMS` en grupos `BAG_GROUPS`, tesoros
  con rareza `BAG_RARITY`). **Se guarda aunque no se tenga la Mochila**
  (Esenciales, 10): comprarla da la pestañita y la hoja (`openBag()`): comer
  lo cocinado, regalar, plantar, revivir un fósil, vender (`sell`).
- **Cavar** con la pala de jardín (`palita`, otra que la recogecaca): algo cada
  `DIG_GAP_MS` (40 min reales), por peso de `DIG_LOOT` (tierra, caracola,
  semilla, hueso, gemas, y el **fósil misterioso** al 0,5%).
- **Huerto** (`HUERTO_ART`): 2 parcelas, ampliable a 4
  (`HUERTO_PLOT_PRICE`). `CROPS`: zanahoria 3 h, tomate 5 h, frutilla 8 h,
  zapallo 12 h, girasol 6 h. **Solo crecen regadas**: cada riego dura
  `WATER_MS` (1 h) y se hace con la **regadera** en la misma habitación
  (`waterGarden()`); seco no crece (no se muere). La cosecha cruda **no se
  come**: se cocina, se regala o se vende.
- **Cocina** (`COCINA_ART`; no confundir con la Cocinita de juguete):
  `RECIPES` con lo cosechado y harina (se compra en Comida). Bocadillos y
  comida rica van a la despensa; ensalada, sopa, pastel, pie, galletas y
  compota a la mochila (se comen desde "Hecho en casa"). **Cola**
  (`cocinaData()` = `{queue, at, ready}`): se cocinan de a una, en orden, con
  la hora real; ingredientes se descuentan al encargar y vuelven al cancelar;
  `COCINA_MAX` (6) entre cola y listo. El globito ×N sobre la cocina
  (`COCINA_BUBBLES`) se toca para sacar todo (`cocinaTake()`);
  `furniAtPoint()` deja en `rt.hitPart` qué pieza se tocó.
- **Máquina reviviente** (`revividor`, Objetos mágicos, 150): se le pone un
  fósil (`reviveChore(rt, 'put')`: la mascota va y lo mete) y trabaja
  `REVIVE_MS` (24 h reales, `reviveData()` = `{at, ready}`, uno a la vez).
  Tocarla abre su hoja (`openRevividor()`); lista, tocarla saca el huevo.
  **Todavía no hay especies antiguas**: con `FOSSIL_SPECIES` vacío sale un
  **Huevo fósil** a la mochila, vivo pero cerrado. Al sumar especies a
  `FOSSIL_SPECIES` (ids de `SPECIES`), la máquina las hace nacer al tiro como
  acompañante (`hatchFossil()`) y los huevos guardados se abren desde la
  mochila (`fossilHatch()`).

## Medallas y Mimodex (`logros.js`)

Van en su propia clave (`PROFILE_KEY = 'mimogoshi.perfil.v1'`, try/catch):
son de quien juega y sobreviven a la mascota (`clearSave()` solo borra el
save). Pestañitas 🏆 y 📖.

- **Medallas** (`MEDALS`): 19 logros × bronce/plata/oro (`MEDAL_TIERS`, 10 /
  30 / 80 monedas; el oro, una ficha si el gacha está prendido). Se reclaman
  a mano. Contadores en `profile.stats`: `medalAdd(stat)` donde pasa la cosa
  (comidas, cacas, curas, vacunas, mimos que suman, partidas, desafíos,
  giros, juegos juntos) y `medalMax(stat, v)` para lo que se mide (mejor
  mérito, y cada segundo en `medalsTick()`: días, adultos, muebles, nivel,
  monedas ganadas, siestas, especies). Lista y Vitrina; la medalla es la
  silueta del emoji en metal (`medalIcon()`). `explora` y `familia` piden en
  el oro todas las especies que haya.
- **Mimodex**: ficha por especie, en el orden de `SPECIES_IDS`. Se **ve** al
  cruzársela (`dexSeen()`) y se **cría** al nacer una propia. Desconocidas en
  silueta (`filter`). La ficha anima al personaje con `gameActor()`.

## Acompañante (`duo.js`)

Un segundo personaje (hijo, visita o, más adelante, una especie antigua):
`state.companion = null | {species, stage, name, kind}`. Hoy solo se agrega
desde el panel de prueba (o naciendo de un fósil cuando haya especies). **No
tiene barras**: todo es visual, salvo jugar juntos y consolarla, que pasan por
`furniJoy()`.

La mascota (`walker`) y él (`buddy`) tienen la misma forma y todo el motor
recibe el actor. Pasea, visita muebles, se duerme con ella (en la cama, del
lado de la almohada), la consuela si está triste o enferma
(`COMFORT_GAP_MS`), celebra con ella. Con los dos libres, `SOCIAL_CHANCE` de
jugar juntos (`SOCIAL_GAP_MS` entre una y otra): un mueble de a dos o uno de
los 14 `SOCIALS`. Se dibuja en `#buddyCanvas` con las mismas reglas que la
mascota; el que va más alto se pasa adelante reordenando el DOM.

## Minijuegos

Doce, en `GAMES`: seis de uno en `juegos.js` (Atrapa estrellas gratis,
Baloncesto 15, Reflejos 25, Torre de cajas 35, Salto al cielo 45, Memorice 55)
y seis de a dos en `duo-juegos.js` (Espejo 30, Voleibol 35, Copia el baile 40,
Escondidas 45, Sube y baja 50, Carrera en dupla 60), en su propia sección del
menú. Se desbloquean con monedas en el mismo menú, para siempre
(`state.unlockedGames`).

**Cómo se arma uno:**
- `enterMinigame(id)` / `exitMinigame()`; `fitGameCanvas()` mide el canvas
  real. Los mandos van **abajo** (`showGameControls(html)`, atados con
  `wireGameButton()` en `pointerdown`); Reflejos y Memorice se juegan tocando
  la pantalla.
- `finishMinigame(id, {score, merit, energyCost, hygieneCost, message})`
  aplica premio, costo, récord, xp, desafío y medallas y abre el resultado.
- `drawPetAt()` / `drawActorAt()` a escala 2; `drawEmoji()` en vez de
  `fillText()` con emojis (cachea); `makeCanvasPointer()` cachea el rect.
- Estado en una global (`sg`, `bb`, `rx`, `tw`, `sk`, `mm`; los de a dos
  comparten `dg`). **Registrar su limpieza** en `minigameDisposers`
  (`minigameDisposers.push(() => { xxDispose(); xx = null; })`): es lo que
  corre `forceCloseMinigames()`.
- Separar lógica de dibujo (`xxNew/xxStep`, `dg.stepFn`) para poder calibrar
  con bots. **Ojo con los nombres en `dg`**: `stepFn`/`drawFn`/`endFn` son
  del loop.
- **Mérito calibrado con bots** (bueno ~35-45, experto ~55-80; medianas en el
  comentario de cada `xxMerit()`): al cambiar la dificultad, repetir la
  simulación.
- Sonido: `tone()`/`beep()` (Web Audio, `AudioContext` al primer sonido, en
  try/catch), `SFX_SCALE`, `sfxFail()`. El premio suena con `rewardSound()`
  (de prueba).
- Todo en fracciones del canvas, para que un teléfono chico y uno grande
  jueguen igual.

**Niveles**: 1 a 5 por juego (`LEVEL_NAMES` Fácil…Leyenda). La xp es el
mérito tal cual; `LEVEL_XP` = 10/30/50/150 partidas buenas. Se elige el nivel
en la ficha entre los desbloqueados; `levelT()` (0 a 1, desde `playLevel`,
que `launchGame()` fija **antes** de `start()`) da la dificultad.
`LEVEL_COIN_MULT` ×1 a ×2. Récord por nivel (`recordKey()`).

**Desafío diario** (en el código `mega*`): una partida por juego desbloqueado
cada `MEGA_CYCLE_MS` (24 h reales, un solo ciclo que arranca con el primero),
**siempre en el nivel más difícil desbloqueado**, ×3 monedas; completarlos
todos da `MEGA_BONUS_PER_GAME` (10) por juego. Se gasta al terminar (una
partida cortada no lo consume). Relojes en vivo con `data-mega-clock` /
`data-mega-bar` (`tickMegaClocks()`, un solo intervalo global).

Detalles por juego que no son obvios en el código:
- **Baloncesto**: 3 tiros; Tiro / Bandeja / Slam Dunk (`.gbtn-row3`). Rebote
  `BB_REBOUND_CHANCE` = **30/50/70%** por tiro (un switch rebota a Bandeja, una
  Bandeja a Dunk). Saltos de una pasada (`bbJumpPos()`, parábola real) con su
  ventana (`BB_LAYUP_WINDOW`, `BB_DUNK_WINDOW`), alto y ancho como fracción de
  `bb.h`/`bb.w` (calibrados contra una captura real). 2% de pinchar la pelota.
- **Torre**: perfecto con `TW_PERFECT`; tres seguidos ensanchan la caja.
- **Salto al cielo**: `SK_DURATION` 90 s; las nubes nunca están más separadas
  que el 85% de un salto.
- **Memorice**: posiciones de una rejilla 4x3 barajada; la secuencia crece.
- **Carrera en dupla**: el salto mide una distancia (`DP_JUMP_DIST`), no un
  tiempo.
- **Combate** (`startCombatGame()`): prototipo, solo desde el panel de
  prueba; no está en `GAMES` ni en la economía.

**Menú de Jugar**: grilla (`openGamesMenu()`, color por `data-g` en el CSS:
al sumar un juego, darle su par `--g1`/`--g2`), ficha (`openGameDetail()`) y
resultado (`showGameResult()`, overlay `.clear`).

## Panel de prueba

🧪 (`#btnDebug`) abre `#debugPanel`: stats al máximo (`debugMode`), monedas,
tickets, ruleta gratis, día/noche, etapa, ánimo, especie
(`debugForcedSpecies`, lo lee `currentSpeciesId()`), acciones, minijuegos y
Combate, caca, regalo, Game Over; secciones de acompañante (`duoDebugHtml()`)
y de huerta (`huertaDebugHtml()`: plantas, horno, compost, mochila, cavar,
+1 fósil, máquina lista). En pantallas anchas va al lado del aparato; en el
teléfono, modal.

**Pasar el tiempo (TEMPORAL)**: +15 min a +1 día (`debugSkipTime()`), de a un
tick y **sin el tope de 72 min**, con reloj virtual (`debugClockOffsetMs`,
que suman `isNightMode()` y `catchUp()`). No se guarda. Al sacarlo:
`debugSkipTime()`, `debugTimeInfo()`, `debugClockOffsetMs` (y su uso en
`isNightMode()` y `catchUp()`), los botones `data-skip`/`dbgClockReset` y
`.debug-time` del CSS.

## Convenciones

- Todo el copy en español (Chile).
- Emojis solo de **Unicode 11 o anterior** (2018): 🪙 y 🫧 salían como un
  cuadro vacío en teléfonos viejos. Revisar la versión antes de sumar uno.
- Mensajes de commit en español, explicando el **porqué**.
- Nada de emojis ni de identificadores de modelo en commits o en el código.
