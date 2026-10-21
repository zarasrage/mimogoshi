# Mimogoshi — tamagotchi de una sola página

Mascota virtual pixel-art en HTML/CSS/JS puro. **Sin build, sin frameworks, sin
backend**: se edita directo y se abre `index.html` en el navegador. Todo el
progreso vive en `localStorage`.

**Archivos:** `index.html` (esqueleto), `styles.css` (todo el CSS) y la lógica
en cuatro scripts clásicos que comparten el ámbito global:
- `app.js`: el núcleo (estado, simulación, render, menús, los minijuegos de uno).
- `muebles.js`: los muebles (catálogo, arte, guiones) y el **motor de actores**
  que también usa el acompañante.
- `duo.js`: el acompañante (`buddy`) y lo que hacen los dos juntos.
- `duo-juegos.js`: los seis juegos de a dos.

Se cargan en ese orden (`index.html`). Lo de un archivo que usa otro se usa
recién en tiempo de juego (después de `DOMContentLoaded`), nunca al cargar —
salvo los `push` a arreglos de `app.js` (`STYLE_ITEMS`, `GAMES`,
`extraMinigameDisposers`), que por eso van después de él. Dentro de
`sprites/`, un par `<especie>_spritesheet.png` + `.json` por cada especie (más
los PNG de personajes todavía sin integrar); se cargan como `new Image()` desde
`app.js` por ruta relativa (`sprites/<archivo>.png`).

Se trabaja **siempre directo sobre `main`**, sin ramas ni PRs — proyecto de una
sola persona.

## Cómo probar cambios

Chequeo de sintaxis (lo mínimo antes de cualquier commit):

```bash
node -e "const fs=require('fs'); for (const f of ['app.js','muebles.js','duo.js','duo-juegos.js']) { new Function(fs.readFileSync(f,'utf8')); console.log(f, 'syntax OK'); }"
```

Prueba funcional/visual con Playwright (Chromium ya está instalado en
`/opt/pw-browsers/chromium`, **no** correr `playwright install`):

```bash
npm install playwright --no-save        # borrar node_modules al terminar
# servir la carpeta en un puerto y abrirla con deviceScaleFactor 2 o 3
# (un teléfono real es 3x — los bugs de escalado solo aparecen ahí)
```

Aserciones que conviene correr al tocar sprites:

```js
// todas las imágenes cargaron
await page.evaluate(() => { const o={}; for (const id of SPECIES_IDS) o[id]=SPECIES[id].ready; return o; });
// ninguna combinación revienta
await page.evaluate(() => {
  const c=document.createElement('canvas'); c.width=CANVAS_W; c.height=CANVAS_H;
  const x=c.getContext('2d'); let n=0;
  for (const id of SPECIES_IDS){ debugForcedSpecies=id;
    for (const st of ALL_STAGES) for (const m of ALL_MOODS){ drawSprite(x,st,m,0); n++; } }
  debugForcedSpecies=null; return n;
});
```

No hay tests automatizados formales: syntax check + un par de aserciones en
Playwright sobre lo que tocaste + mirar una captura.

## La regla de oro: escalas enteras

**Un píxel del arte tiene que ocupar siempre el mismo número entero de píxeles
en pantalla.** Es el bug que más veces reapareció en este proyecto y el que peor
se ve: con escala fraccionaria unos píxeles salen de 2 y otros de 3, y en una
cara de 32x32 eso junta los ojos con la boca en un borrón que parece una
segunda cara dibujada encima.

Ojo: "píxeles en pantalla" son píxeles **físicos**, no px CSS. Un teléfono 3x
tiene 3 físicos por cada px CSS, y ahí está el margen para tener tamaños que no
sean múltiplos de 32 sin romper la regla.

La cadena está calibrada así y **no hay que romperla**:

- El arte es de 32x32 por frame.
- `#petCanvas` en CSS mide **96x96** px CSS, pero su backing store va en
  píxeles físicos: `fitPetCanvas()` lo deja en `96 * devicePixelRatio`
  (`DPR`). El `width`/`height` del HTML (96) es solo el valor inicial.
- El tamaño por etapa (`STAGE_CSS_PX = {child:50, teen:64, adult:78}`) es un
  **objetivo** en px CSS. `stageDeviceScale()` lo pasa a una escala **entera
  en píxeles físicos** (`round(objetivo * DPR / 32)`), y esa es la que recibe
  `drawSprite()`. En un teléfono 3x da 53 / 64 / 75 px; en uno 2x, 48 / 64 / 80.
  Antes eran escalas enteras de px CSS (32 / 64 / 96): el recién nacido salía
  diminuto, el adulto llenaba la pieza y los saltos entre etapas eran bruscos.
- Lo que no es la mascota principal sigue como antes, a escala entera de px
  CSS sobre canvas 1:1: `CANVAS_W`/`CANVAS_H` = 96 son el `box` por defecto de
  `drawSprite()`, y los minijuegos dibujan con `drawPetAt()` a escala 2.

Nunca escalar el canvas con CSS a un tamaño que no sea su backing store
dividido por `DPR`: poner `width:50px` sobre un canvas de 80 (como estaba antes)
reescala por 0.625 y arruina todo el pixel art. Para cambiar el tamaño de la
mascota se tocan los objetivos de `STAGE_CSS_PX`, nada más.

Lo mismo aplica a las miniaturas del selector de especie (`speciesThumbStyle()`
acepta `s`; el picker de la pantalla de inicio usa `s=1`, 32px — ver más abajo)
y a la mascota dentro de los minijuegos, que se dibuja con `drawPetAt()` a escala
2 usando `ctx.translate()` y **sin** `ctx.scale()`.

`drawEgg()` dibuja sus radios como fracción del `box` (el tamaño real del
canvas), no en píxeles fijos: si no, al agrandar la mascota el huevo se queda
chico abajo.

`drawSprite()` devuelve lo que dibujó (`species`, `frame`, `scale`, `dx`, `dy`,
`box`) en píxeles del canvas; quien necesite ubicar algo encima (el accesorio)
lo pasa a px CSS dividiendo por `box.w / CANVAS_W`.

`ctx.imageSmoothingEnabled = false` y `image-rendering:pixelated` en el CSS son
necesarios pero **no** suficientes: no arreglan una escala fraccionaria.

## Sprites

### Formato de las hojas

Todas las especies comparten el mismo formato, así que agregar una es trivial:

- PNG de **224x128**, grilla de **7 columnas x 4 filas** de **32x32** = 28 frames.
- Alfa real y dura (nada de semitransparencias).
- JSON con los frames **por nombre** y animaciones con `durations_ms`.

Los 28 frames, en orden de índice (fila 0 primero, izquierda a derecha):

```
normal, blink, idle_squash, walk_1, walk_2, happy_1, happy_2,
happy_3, happy_4, sad_1, sad_2, sick_1, sick_2, sleep_1,
sleep_2, eat_1, eat_2, eat_3, pet_1, pet_2, pet_3,
clean_1, clean_2, medicine_1, medicine_2, celebrate, dead_1, dead_2
```

Las 12 animaciones (`idle`, `walk`, `happy`, `sad`, `sick`, `sleep`, `eat`,
`pet`, `clean`, `medicine`, `celebrate`, `dead`) son idénticas en las tres
especies actuales — al sumar una nueva se copian tal cual.

`LOOPING_ANIMS` decide cuáles se repiten sin fin (los ánimos: idle, walk, sad,
sick, sleep, dead) y cuáles se reproducen una vez y vuelven solas al ánimo
normal (las acciones: eat, pet, clean, medicine, celebrate). El JSON **no**
trae un flag `loop`; sale de ese `Set`.

`normalizeSpecies()` traduce el JSON al runtime una sola vez al cargar: frames
indexables y animaciones como lista de `steps` con `{frame, durationMs}`.

### Revisar un asset ANTES de integrarlo

Esto ahorró varias vueltas. Un PNG con las medidas correctas igual puede estar
malo. Tres chequeos:

```python
from PIL import Image
im = Image.open(f).convert('RGBA'); px = im.load(); W,H = im.size
# 1) ¿es pixel art nativo o un reescalado con interpolación?
print(len({px[x,y] for y in range(H) for x in range(W) if px[x,y][3]>0}))   # ~10-25 OK; miles = malo
print(sum(1 for y in range(H) for x in range(W) if 0<px[x,y][3]<255))       # 0 OK; miles = bordes blandos
# 2) ¿los sprites caen en la grilla de 32px? (runs verticales por columna)
```

Referencia: Blob llegó con **13 colores y 0 semitransparentes** (perfecto). El
Gato llegó con **9915 colores y 15708 semitransparentes** — medidas correctas
pero era un reescalado interpolado, y al lado del Blob se veía borroso.

**Deriva de grilla:** varios sheets traían los sprites en bandas que *no* caen
en múltiplos de 32 (ej. y 2-30, 34-59, 61-86, 89-122). El síntoma es que la fila
de abajo asoma dentro de la celda de arriba — se ven orejas o aureolas al pie de
los frames de comer y de mimo. Se detecta midiendo los runs verticales de
píxeles opacos por franja de columna. Si hay deriva, hay que **regrillar**:
reubicar cada sprite dentro de su celda apoyado en el piso (`ny = y - ymax + 31`).

### Recuperar un JPG con damero pegado

A veces el arte llega como JPG de 1360x784 **sin canal alfa**, con el damero de
transparencia del editor pegado como píxeles grises (~149 y ~100). Se puede
recuperar, con reservas:

1. El nativo es 224x128 (el damero mide 4 píxeles de arte por cuadro, y
   1360/224 = 6.07 px de JPG por píxel nativo).
2. Muestrear la **mediana de un 3x3 en el centro** de cada píxel nativo.
3. Fondo = gris neutro (canales dentro de ~20 entre sí) con valor entre 85 y 168.
4. Paleta: clusterizar los colores **únicos** (sin sesgo de frecuencia, si no
   los acentos raros —picos, corazones, confeti— se los come la cuantización) y
   quedarse con los que cubren ~98.5% de los píxeles.
5. Alfa dura por umbral.

**Cuándo funciona:** el Pollito salió bien (amarillo y negro contrastan fuerte
contra el gris del damero) → 25 colores, 0 semitransparentes. El gato verde
salió mal: su contorno oliva se confundía con el gris y quedaba desvaído, y
además se perdían la mano beige y las burbujas. Si el arte es de tono medio y
poco saturado, mejor pedir el PNG original que shipear una recuperación pobre.

**Siempre preferir el PNG con transparencia.** Es fiel al 100% y se salta todo
esto.

### Agregar una especie nueva

1. Dejar el PNG en `sprites/` como `<id>_spritesheet.png`, ya verificado según
   lo de arriba.
2. Generar `sprites/<id>_spritesheet.json` con la grilla estándar (copiar el
   de otra especie y cambiar `character`, `id` e `image`).
3. En `app.js`: agregar `<ID>_RAW` con el mismo JSON embebido (va embebido para
   no depender de un `fetch()`, que no funcionaría abriendo el archivo con
   `file://`) con `image: 'sprites/<id>_spritesheet.png'`, y registrarlo en
   `SPECIES_RAW`, `SPECIES` y `SPECIES_IDS`.
4. Listo: el selector, el panel de prueba y las miniaturas se arman solos desde
   `SPECIES_IDS`.

El selector (`.species-list`) es una **rejilla de 3 columnas**. La fila con
scroll horizontal ya se probó y falla: ese gesto pelea con el scroll vertical
del overlay y las especies que quedan pasado el borde no dan ninguna señal de
existir. Apiladas en vertical (una por fila) tampoco: cada especie nueva suma
una fila entera.

El número de especies **va a seguir creciendo**, así que el selector no puede
depender de que quepan todas de una — esa cuenta se rompe apenas se agrega la
próxima. Por eso `.species-list` comparte la regla de `.menu-list` (la misma
que ya usan las listas de comida y minijuegos): tope de alto + scroll propio
(el tope es lo que deja libre la hoja, ver "Interfaz" más abajo),
así el nombre y "Empezar" quedan siempre fijos debajo, visibles, sin importar
cuántas especies haya. Con 6 (dos filas) todavía entran enteras sin scrollear;
de la tercera fila en adelante aparece el scroll — y a diferencia del scroll
horizontal de antes, una fila cortada a la mitad sí avisa que hay más abajo.
Si se agrega una especie nueva y la rejilla ya no entra en dos filas, es
esperable que empiece a scrollear: **no** hay que agrandar `#screen` ni el
`min-height` de la pantalla para perseguir la lista, ya está resuelto.

En la pantalla de inicio `speciesThumbStyle(id, s)` usa `s = 1` (miniatura de
32px) en vez del `s = 2` de siempre, para que quepan más especies por fila
antes de necesitar scroll. La escala tiene que seguir siendo **entera**; en
cualquier otro lado que use `speciesThumbStyle()` sigue siendo `s = 2`.

La pantalla de inicio **no** enfoca el campo del nombre al abrirse: en el teléfono
el teclado aparecía de una y tapaba justo el selector de especies, que es lo
primero que hay que elegir.

`askName()` también esconde `.controls` (los 7 botones de cuidado, que sin
mascota no sirven de nada) y agrega la clase `.onboarding` a `#screen` mientras
dura esta pantalla; `start()` saca las dos cosas justo antes de llamar a
`boot()`. Sin esto, `.controls` sumaba alto de más abajo del overlay (`boot()`
nunca corre sin un save existente, así que nadie los escondía) y `#screen`
seguía atado al `clamp(290px, 42vh, 420px)` pensado para la pantalla de juego
—con mascota, barras y mandos reales—, que le quedaba corto a esta pantalla sin
nada de eso. `.screen.onboarding` afloja ese clamp a `clamp(290px, 62vh, 560px)`:
puede porque en esta pantalla no hay nada más abajo compitiendo por alto.

## Interfaz (menús y botones)

Dos estilos a propósito: la **pantalla LCD** (verde, pixel, retro) es donde
vive la mascota; todo lo de alrededor —botones, menús, panel de prueba— va
como una **app moderna de teléfono**, pensando en que esto termine empaquetado
como app de tienda. Tokens en `:root` de `styles.css` (`--brand` es el único
degradado de marca, rosa→violeta; `--sheet`, `--surface`, `--text`...).

- **Menús = hoja inferior.** `#overlay` es hijo de `.device`, no de `#screen`:
  cubre el aparato entero y `.overlay-card` sube desde abajo. Metido en los
  ~300px de la LCD, la tienda mostraba dos filas y media. La tarjeta es una
  columna flex donde solo `.menu-list` cede alto (`flex:0 1 auto;
  min-height:0`) y se lleva el scroll: el botón de abajo queda siempre visible
  sin un `max-height` en píxeles.
- `showOverlay(html, onDismiss)`: si se pasa `onDismiss`, tocar el fondo fuera
  de la hoja la cierra. Lo pasan los menús con Cerrar/Cancelar; inicio y game
  over no.
- Botones de hoja: `.overlay-btn` (primario, degradado), `.overlay-btn
  secondary` (Cerrar/Cancelar — nunca el degradado en la acción de salir) y
  `.overlay-btn danger`. Varios juntos van en `.overlay-actions`. Toda
  confirmación destructiva lleva su Cancelar (la de Reiniciar no tenía y no
  había forma de salir).
- `.controls`: tarjetas blancas con el ícono en un "squircle" de color propio
  (`--tint` por id): las acciones se reconocen por color y posición.
  Reiniciar va como píldora discreta, no como tarjeta.
- Todo lo tocable lleva `-webkit-tap-highlight-color:transparent`,
  `user-select:none` y `touch-action:manipulation`; los `:hover` van dentro de
  `@media (hover:hover)` para que no queden pegados en el teléfono. El `<input>`
  usa 16px (con menos, Safari de iPhone hace zoom al enfocar).
- Preparado para app a pantalla completa: `viewport-fit=cover`, `theme-color`
  y padding con `env(safe-area-inset-*)` en `body` y en la hoja.

## Estado del juego

`localStorage`, clave `SAVE_KEY = 'mimogoshi.save.v2'`.

**Todo acceso a `localStorage` va en try/catch**: algunos visores (Quick Look de
iOS, previsualizaciones sandboxed) lo bloquean, y sin el try/catch la página
entera queda en blanco. Si agregas una llamada nueva, protégela igual.

`loadState()` también migra saves viejos: si `state.species` apunta a una
especie que ya no existe, cae a `DEFAULT_SPECIES` en vez de quedarse sin sprite.
Hay que mantener eso al borrar o renombrar especies.

Simulación por ticks (`TICK_MS = 4000`, `MS_PER_GAME_HOUR = 60000`): hambre,
felicidad, energía, higiene y salud bajan solas; `catchUp()` recupera el tiempo
que pasó con la pestaña cerrada (con tope de 3 días).

Los ritmos de decaimiento (`DECAY_PER_HOUR`, `HEALTH_DECAY_PER_HOUR`,
`POOP_CHANCE_PER_HOUR`, `SICK_CHANCE_PER_HOUR*`) se calibraron primero todos
juntos, con el mismo factor (~3.54x), para que una mascota totalmente
descuidada muriera en una mediana de ~12 horas reales. Después, **a propósito
y por pedido**, se rompió esa proporción en dos lugares:
- hambre, felicidad e higiene bajan **al doble** de rápido (hay que atenderla
  más seguido): 100/424.5, 100/530.5 y 100/212 h de juego;
- la salud baja **2.5 veces más lento** (`HEALTH_DECAY_PER_HOUR` = 100/1060):
  las barras se vacían antes, pero morirse por eso tarda más.

Resultado, medido por simulación contra `applyDecay()`/`maybeAutoSleep()`
reales (ticks de 4 s, sin modo nocturno, 400 corridas): totalmente descuidada
se pone triste por primera vez a las **~3.9 h** reales (antes 7.3) y muere en
una mediana de **~16.8 h** (p10 12.2, p90 21; antes 11.5). Los umbrales
(`DISTRESS_AT`, `HEALTH_RISK_AT`, `SICK_LOW_HEALTH_AT`) no se tocaron: son
valores de barra, no de tiempo. Si se vuelve a recalibrar, conviene repetir esa
simulación en vez de razonar con un factor, porque las proporciones ya no son
uniformes.

La caca aparece con `POOP_CHANCE_PER_HOUR`: calibrada (dentro de ese mismo
escalado) para que la primera salga en mediana a las ~3.5 horas reales. La
higiene no baja sola — solo mientras haya caca sin limpiar (ver
`DECAY_PER_HOUR.hygiene`).

Los regalos aparecen igual que la caca — mismo modelo de dado, un solo
`Math.random() < hours * GIFT_CHANCE_PER_HOUR` por tick, sin componer — pero
calibrados aparte para una mediana de ~12 horas reales, verificado por
simulación contra el tick real (`TICK_MS`/`MS_PER_GAME_HOUR`). No comparten
escala con `POOP_CHANCE_PER_HOUR`: si se recalibra el tiempo hasta la muerte,
`GIFT_CHANCE_PER_HOUR` NO tiene que tocarse, es un evento aparte que no
compite por atención con nada más (no toca higiene ni ninguna otra barra).
Al abrir uno (`collectGift()`, tocando el ícono 🎁 que aparece flotando junto
a la mascota) da una porción de una comida mejor que la inicial
(`GIFT_FOOD_POOL`: rica, especial o Red Bull, al azar) más `GIFT_HAPPINESS`
de felicidad — **nunca monedas**: esas se ganan solo jugando (ver
`finishMinigame`), y si el regalo también las diera dejaría de ser cierto.

**Modo nocturno** (`isNightMode()`, 00:00 a 06:00 **hora real** del
dispositivo — es de noche para quien juega, no para la mascota): todo decae a
la mitad de velocidad (`NIGHT_DECAY_FACTOR`, aplicado junto a `sleepFactor` en
`applyDecay()` — solo frena el decaimiento, no la recuperación) y
`maybeAutoSleep()` cambia a un sube-y-baja de sueño propio en vez del gatillo
por energía baja: `NIGHT_SLEEP_ENTER_CHANCE`/`NIGHT_SLEEP_EXIT_CHANCE` por
tick, en proporción 3:1, dan una fracción de tiempo dormida en el largo plazo
de `enter/(enter+exit) = 75%`. Limitación conocida y aceptada: `catchUp()`
puede entregar de una un rango de horas que cruza medianoche, y como
`applyDecay()` solo mira la hora ACTUAL al aplicarlas (no hora por hora), un
tramo nocturno adentro de un catchUp largo no se trata distinto del resto —
el mismo compromiso que ya hace `sleepFactor` con horas acumuladas.

El modo nocturno **se ve**: `render()` le pone `.night` a `#screen` (el fondo
de la LCD se oscurece —solo el fondo, la mascota no— y salen estrellas que
titilan en `.night-sky`) y cambia el ícono `#dayNight` de la barra de arriba
entre ☀️ y 🌙. Tocar el ícono hace que la mascota explique qué cambia de noche.
Antes el modo existía pero no había ninguna señal de que estaba activo. En el
panel de prueba, "Día/noche" gira entre hora real → noche forzada → día
forzado (`debugForcedNight`, que lee `isNightMode()`): cambia también la
simulación, no solo cómo se ve.

- **Etapas** (`ALL_STAGES`): `egg → child → teen → adult` (`EGG_HOURS = 0.1`,
  ~6 s reales de huevo; `CHILD_HOURS = 24*60` y `TEEN_HOURS = 4*24*60`, 1 día
  real de niño y 3 días más de adolescente, 4 días reales en total hasta
  adulto — `ageHours` es hora de JUEGO, 60 por hora real). Hubo antes una
  escalera de edades (bebé/niño/adolescente/adulto bueno-neutro-malo) que se
  sacó porque **no había arte por edad**: cada especie tiene un solo diseño,
  así que las etapas se veían idénticas. Esta escalera nueva no repite ese
  error: la única diferencia entre `child`/`teen`/`adult` es el **tamaño**
  (`STAGE_CSS_PX`, ver "La regla de oro") — mismo sprite, mismas animaciones,
  sin arte nuevo. La mascota dentro de los minijuegos (`drawPetAt()`) sigue siempre
  a escala 2 fija, sin importar la etapa — no vale la pena reajustar el layout
  de cada minijuego por esto. Como `ageHours` sigue subiendo mientras la
  mascota esté viva, una ya establecida casi siempre tiene `ageHours` muy por
  encima de `TEEN_HOURS`, así que `stageFor()` la manda directo a `adult`: la
  escalera solo se nota en una mascota recién nacida. `loadState()` mapea a
  `adult` cualquier etapa que ya no exista (`grown`, de antes de esta
  escalera, o una etapa fantasma más vieja todavía), si no los saves viejos
  quedan con una etapa fantasma.
- **Ánimos** (`ALL_MOODS`): `normal, happy, sad, sick, sleepy, dead`.

`careGood` / `careBad` se siguen acumulando pero **hoy no los lee nadie**: eran
lo que elegía la rama adulta. Se dejan porque van en el save y son el enganche
obvio si vuelve a haber ramas o un final según el cuidado.

### Dinero y tienda

`state.coins` se gana **solo jugando**. Cada juego le pasa a `finishMinigame()`
un **mérito**: su puntaje llevado a una escala común (~45 = partida muy buena),
porque los cuatro puntajes no se pueden comparar entre sí (9 en baloncesto contra
~500 en tap rítmico). De ese mérito salen las dos recompensas, con reglas
distintas a propósito:

- **Felicidad** (`merit/3`, tope 15): jugar no puede ser la forma de tapar el
  descuido, así que sube la barra pero no la llena de una partida.
- **Monedas** (`merit/6`, **sin tope**): es lo que hace que jugar excelente pague
  más que jugar bien. Cuando tenían tope, 75 y 96 puntos en estrellas daban
  exactamente lo mismo.

Las monedas no pueden derivarse de la felicidad ya topada: si se hace así, subir
el premio de una arrastra al de la otra y el tope de la felicidad le pone techo
al dinero.

`state.pantry` guarda **porciones** por comida. Se arranca con
`FOOD_START_STOCK = 5` de bocadillo simple (`freshState()`) y de ahí en más se
repone en la tienda como cualquier otra comida, a `price: 5` — ya no es
infinito ni gratis. `btnFeed()` cae solo al bocadillo si lo elegido se acabó,
y si el bocadillo también está en 0 avisa que hay que pasar por la tienda en
vez de alimentar de la nada.

El modelo viejo era `unlockedFoods` (desbloqueo permanente), pero nada en el
código lo llenaba nunca: las comidas 2 y 3 eran inalcanzables. `loadState()`
borra ese campo al migrar.

Toda comida sube energía al comerla, no solo hambre: `food.energy` es opcional
en `FOODS` y si falta usa el bonus plano de siempre (`FOOD_ENERGY_DEFAULT = 4`).
La Red Bull es la única que lo pisa — poca hambre (`restore: 2`), mucha energía
(`energy: 20`) — al revés que el resto, que dan poca energía y mucha hambre.

**Medicina:** ya no es un botón propio, gratis e infinito. Es una porción más
de la despensa (`MEDICINE`, `state.pantry.medicina`): se compra en la tienda,
pestaña Comida (`price: 15`), y se da desde el menú de comidas, sección
**Botiquín** (`giveMedicine()`). Se arranca con `MED_START_STOCK = 2`, y los
saves de antes también reciben esas 2, para que la primera enfermedad no pille
sin monedas. El lugar del botón de Medicina lo tomó **Personalizar** (ver
"Estilo"). Para que la enfermedad se siga notando sin ese botón, `render()`
le pone la clase `.alert` al botón **Menú** mientras está enferma: un 💊 rojo
que late.

**Los avisos de la tienda van dentro de la tarjeta, no con `say()`**: la burbuja
tiene `z-index:5` y el overlay `10`, así que un `say()` con un overlay abierto
queda tapado. Lo mismo vale para cualquier menú nuevo.

#### Mejoras

Segunda pestaña de la tienda (`shopTab`, "Comida"/"Mejoras" — un tab en vez de
apilar dos `.menu-list`, porque la de comida ya usa todo el alto disponible y
esto va a seguir creciendo). Catálogo en `UPGRADES`, con dos formas:

- **Armables** (`armable: true`, hoy `autoClean` y `autoMed`): se compran una
  sola vez pero funcionan como un seguro de **un solo uso**. Al comprarlas
  quedan activadas de una; cuando disparan su efecto se desactivan solas y hay
  que volver a activarlas a mano (gratis, ya están pagadas) para que sirvan de
  nuevo. Nunca quedan disparando para siempre a propósito: eso volvería
  trivial la caca o la enfermedad en vez de ser una red de contención puntual
  para cuando no estás mirando. `autoClean` limpia sola la primera caca que
  aparezca (mismo `+35` de higiene que `btnClean`); `autoMed` cura sola una
  enfermedad (mismo `MED_HEALTH`, +20 de salud, que darle una medicina). Ninguna distingue si la app
  está abierta o cerrada al disparar — nada más en el juego trata "estar
  mirando" como un estado aparte, así que tampoco esto. `state.upgrades[id]`
  guarda `{owned, armed, timesUsed}`; `timesUsed` se muestra en la tienda como
  "usada N veces", sin popup — igual que la enfermedad al aparecer, es un
  cambio de estado silencioso que se nota en la interfaz, no con un aviso.
- **No armables** (`armable: false`, hoy `sendVisit` y `returnVisit`): se
  compran pero todavía no hacen nada — son el enganche para cuando exista la
  función de visitar amigos (todavía sin backend ni pantalla propia), para
  que no aparezcan de la nada ese día. Una vez compradas solo muestran
  "Comprada", sin botón de activar.

`loadState()` rellena `state.upgrades[id]` con el default que corresponda
(`armable` u no) para saves viejos o para una mejora agregada después.

#### Estilo

Tercera pestaña de la tienda: cosas que solo cambian cómo se ve, sin efecto en
ninguna barra. Catálogo en `STYLE_ITEMS`, en cuatro secciones
(`STYLE_SECTIONS`):

- **Carcasa** (`kind:'shell'`, `colors` = los tres colores del degradado del
  aparato) y **Pantalla** (`kind:'screen'`, `lcd` = fondo, brillo, lo encendido
  en `r,g,b` y borde): siempre hay una puesta; las de `price: 0` (Chicle y
  Verde) vienen de fábrica.
- **Accesorios** (`kind:'hat'`): uno a la vez en la cabeza, o ninguno.
- **Decoración** (`kind:'deco'`): un adorno por lugar (`slot`: `pared`, `izq`,
  `der`), o ninguno.

**La tienda es solo para comprar; ponerse y sacarse las cosas es en
Personalizar** (`openPersonalize()`, el botón 🎨 que reemplazó a Medicina).
Comprar algo lo deja puesto de una (si es un mueble y ya hay tres, queda
guardado), y en la tienda lo ya comprado sale como "Tuyo ✓": tocarlo solo
avisa que se cambia en Personalizar. Personalizar muestra únicamente lo
comprado, por sección (`styleRows('mine')`; la tienda usa `styleRows('shop')`),
y ahí tocar algo lo pone o lo saca. En las dos el overlay va con `.clear` y la
hoja no pasa del 66% de alto, así el cambio se ve puesto atrás al tiro.
`state.style` = `{owned, shell, screen, hat, deco:{pared, izq, der}}`;
`loadState()` lo rellena para saves viejos y saca lo que ya no exista en el
catálogo o no esté comprado.

Los colores viven en el catálogo, **no** en el CSS: `applyStyle()` los pone
como variables (`--shell-a/b/c`, `--screen`, `--screen-hi`, `--screen-lit`,
`--screen-lit-rgb`, `--screen-edge`) sobre `#device`. Todo color de la LCD en
el CSS tiene que salir de esas variables (lo encendido con transparencia va
como `rgba(var(--screen-lit-rgb), .x)`), si no queda verde con cualquier
pantalla. `--screen-lit` se pone aparte y no derivado de `--screen-lit-rgb`:
una variable que usa otra se resuelve donde se define (`:root`) y no se
actualiza al pisar la de adentro en `#device`.

Los adornos son emojis en `#decoLayer`, detrás de la mascota y con
`pointer-events:none`, en los bordes (3%) para no pisar la caca ni el
regalo (16%). El accesorio es `#petHat`, un elemento aparte encima del canvas
y **no** un dibujo dentro de él: a escala 3 la mascota llena los 96px y
cualquier cosa sobre su cabeza quedaba cortada por el borde de arriba.
`updateHat()` lo mueve cada frame con el mismo `left` y `scaleX` que el canvas,
usando lo que devuelve `drawSprite()` (frame, escala, posición). La cabeza la
mide `frameHead()` leyendo los píxeles del frame (cacheado): es la primera
fila con al menos `HEAD_MIN_WIDTH` del ancho del sprite, no la primera con
algo, porque antenas y orejas dejaban el accesorio flotando. Con `file://` el
navegador no deja leer píxeles y cae a la parte de arriba de la celda: queda
más alto, pero no rompe.

#### Muebles

Cuarta clase de cosas en Estilo (`kind:'furni'`, sección "Muebles", la primera):
34 muebles que los personajes **usan**. Todo vive en `muebles.js`: el catálogo
(`FURNI_ITEMS`, que se suma a `STYLE_ITEMS` con `kind:'furni'`), el arte y los
guiones (`FURNI_ART`) y el motor que los corre. Los 14 primeros: cama, plato,
bañera, tocador, trampolín, pelota, columpio, tobogán, radiocasete, tele,
piano, tarima, librero y cajas; los 20 que se sumaron después: pecera, maceta,
rueda (de hámster), balancín, cohete, arenero, piscina, hamaca, telescopio,
reloj cucú, caballito, batería, caballete, cocinita, cofre, muro de escalada,
ventilador, bola disco (prendida llena la pieza de luces: `.creature-floor.party`),
puf y piñata. Se ponen hasta `FURNI_MAX` (3) a la vez, **en cualquier
parte del piso**: `state.style.furniture = [{id, x}]`, con `x` = centro del
mueble como fracción del ancho del piso. (Antes eran tres lugares fijos,
izq./centro/der.; `loadState()` convierte esos saves con `LEGACY_FURNI_SLOTS`
y los muebles quedan donde estaban.)

- **Poner uno** (Personalizar, o al comprarlo): `findFurniSpot()` busca el
  lugar libre más cerca del centro. Si no cabe, o ya hay tres, se avisa en la
  hoja (`toggleStyleItem()` devuelve el aviso en vez de `true`).
- **Acomodar** (Personalizar → "Acomodar muebles", `enterArrange()`): la hoja
  se cierra (tapaba justo el piso), la mascota queda quieta, transparente y sin
  recibir toques (`.arranging`), y los mandos de abajo se cambian por "Listo"
  con los mismos `showGameControls()` de los minijuegos. Los muebles se
  arrastran solo en horizontal, que es lo que es el piso en esta vista
  (`startFurniDrag()`, con pointer events: anda con dedo y con mouse).
  Mientras se arrastra se marca en rojo si choca con otro; al soltarlo
  encima de otro, se corre solo al lugar libre más cercano, o vuelve a donde
  estaba si no hay.
- **Encimarse**: los muebles con `free: true` (pelota y plato) no chocan con
  nada y van en una capa propia (`#furniMid`), delante de los otros muebles y
  detrás de la mascota. Pero al *poner* uno igual se le busca lugar despejado
  (`strict`): si no, la pelota y el plato aparecían uno encima del otro en el
  centro. Encimarlos queda para cuando uno los arrastra a propósito.
- Separación mínima entre muebles: `FURNI_GAP_PX`. Ningún mueble se sale del
  piso (`furniBounds()`).

**Arte:** pixel art dibujado con código (`pxPainter()`: `r`, `box` con contorno,
`disc`, `line`), no emojis: no hay emoji de tocador ni de tobogán que exista en
teléfonos viejos, y al lado del sprite un emoji se ve de otro estilo. Cada
mueble tiene `parts` que van como canvas separados: `z:'front'` va delante de la
mascota (el borde de la bañera), `show` las muestra solo con una bandera de su
estado (`food` en el plato, `on` en tele y radiocasete), `pivot` gira (el asiento
del columpio) y la pieza `ball` se traslada. Un píxel del arte mide lo mismo que
uno de la mascota adulta (`furniDeviceScale()`), así que también va a escala
entera en píxeles físicos.

**Guion:** cada mueble tiene **varios** guiones por clase (`visits`, `duos`,
`routines`, ver abajo) y en cada visita se sortea uno: no hace siempre lo mismo
(la cama sirve para saltar encima o dormir siesta; la pelota se patea, se
dribla o se persigue...). Cada guion `f => [pasos]` recibe `furniHelpers()` y
devuelve pasos que corre `runFurniActivity()`, en
píxeles del arte respecto del centro del mueble (`f.x`) y alto sobre el piso
(`f.y`): `go` (caminar), `hop` (salto en parábola), `slide` (lineal: subir la
escalera, tirarse por el tobogán), `bounce` (trampolín), `kick` (patear la
pelota) y, si no es ninguno, quedarse haciendo algo (`anim`, `ms` o `until`,
`fx` con partículas, `flip` para bailar, `swing` para el columpio), más los
de a dos: `chase`/`flee` (perseguir/escaparse del otro), `ride` (ir montado
encima del otro), `sync` (esperar a que el otro llegue al mismo nombre) y
`call` (ejecutar algo y seguir); en cualquiera, `hide` (desaparecer, por
ejemplo adentro del cohete), `start`/`end`. Un valor puede ser una función que
se evalúa al empezar el paso (`(st, act) => ...`, para apuntar a donde está el
otro en ese momento). **No hay
arte nuevo**: todo combina las animaciones que ya tiene cada especie
(`walker.anim` manda sobre el ánimo en `pickAnimation()` y se repite en loop)
con movimiento (`walker.y` es la altura sobre el piso) y partículas
(`petFx()`). Si algún día llega arte propio (maquillarse, trepar), basta con
nombrar esa animación en el guion.

Tres tipos:
- **De rutina** (`routine`): cama (`sleep`), plato (`eat`), bañera (`clean`).
  Reemplazan dónde pasa algo que ya existía: `triggerPetAction()` desvía comer y
  limpiarse a `startFurniRoutine()`, y `updateWalker()` manda a la cama apenas
  se duerme. Las barras ya se movieron en el botón; esto es solo lo que se ve.
  Van más rápido que un paseo y no se cortan por estar triste o enferma, que es
  justo cuando más se la alimenta.
- **Espontáneos** (el resto): al terminar un paseo, con `FURNI_VISIT_CHANCE` y
  una pausa mínima de `FURNI_VISIT_GAP_MS` entre visitas, elige uno (nunca el
  mismo dos veces seguidas) y va. Se cortan si se duerme, se pone triste o
  enferma, si se la toca o si empieza un minijuego; si quedó arriba de un
  mueble, cae al piso.
- **De a dos** (`duos`): los dos personajes juntos en el mismo mueble (ver
  "Acompañante"). Cada uno devuelve `{a: [...], b: [...]}` y los dos guiones
  se coordinan con `sync`; `startFurniDuo()` les agrega un `sync` final para
  que terminen juntos.

**Duración:** cada visita dura de ~9 a ~18 segundos. Los guiones duran entre 5
y 15 s, y si una visita (sola o de a dos) terminó antes de `FURNI_VISIT_MIN_MS`
(9 s), `finishFurniActivity()` **encadena** otro guion del mismo mueble
(distinto si hay, `pickOtherIndex()`): así ninguna queda corta y se mezclan los
patrones. Con 12 s de umbral, uno de 11.9 encadenaba otro entero y llegaba a 25.
Los 14 primeros ya duraban más que la primera versión (~5 s). No es la misma rutina estirada: los guiones suman
más cosas que hacer (dos vueltas de tobogán, cuatro patadas a la pelota que la
persigue corriendo, tandas de rebote de distinto alto, bailar a los dos lados
del radiocasete...). Con visitas más largas, el ritmo de visitas
(`FURNI_VISIT_CHANCE`/`FURNI_VISIT_GAP_MS`) queda igual. La pelota siempre
patea un número par de veces, así termina donde estaba. Los tramos del columpio
duran un múltiplo exacto de su período, así el asiento termina derecho.

Efectos en las barras, chicos a propósito: dormir con cama puesta recupera
energía `FURNI_BED_ENERGY_MULT` (x1.25) más rápido (se mira el save, así vale
también en `catchUp()`), y cada visita espontánea da `FURNI_JOY` (+1) de
felicidad con tope `FURNI_JOY_PER_HOUR` (6) por hora real (`state.furniJoy`):
dejarla sola con muebles no puede reemplazar cuidarla.

**Probado** corriendo en Chromium cada guion de cada mueble por índice (visitas
con la mascota y con el acompañante, duos y rutinas: 104 en total): 0 errores,
0 que se queden trabados esperando en un `sync`, y todos terminan con los dos
en el piso. Al sumar o cambiar un guion, conviene repetir eso.

**Ids únicos en todo `STYLE_ITEMS`**: el mueble radiocasete se llamaba `radio` y
chocaba con el adorno 📻 `radio`; `styleItemById()` devolvía el adorno y tocar el
mueble ponía y sacaba el adorno.

De la mascota, el huevo es lo **único** que se dibuja procedural (`drawEgg()`, un óvalo): no
vino arte para esa etapa en ninguna especie. Todo lo demás sale recortado del
PNG tal cual, **sin tinte ni recoloreo encima** — los spritesheets ya son la
ilustración terminada, y aplicarles un wash de color por etapa pintaba también
sobre la cara. Por eso `PALETTES` quedó reducido a la entrada `egg`, y por eso
mismo `drawSprite()` solo usa `stage` para decidir si dibuja el huevo o el
sprite: entre las dos etapas que quedan no hay ninguna otra diferencia visual.

El huevo se tambalea de lado a lado, en ráfagas y no con un vaivén continuo:
`eggWobbleAngle()` calcula la fase dentro de `EGG_WOBBLE_PERIOD_MS` (1 ciclo
por segundo) y solo mueve durante los primeros `EGG_WOBBLE_ACTIVE_MS` (~280ms,
rápido — `EGG_WOBBLE_HALF_CYCLES = 4` da dos vaivenes completos ahí adentro),
quieto el resto del segundo. `EGG_WOBBLE_HALF_CYCLES` par es a propósito: el
seno vuelve solo a 0 al final de la ráfaga, sin saltos. Sin estado propio —
`render()` ya redibuja cada frame, así que no hace falta enganchar nada al
loop. El eje del giro es la **base** del huevo (donde apoya en el piso, en
`drawEgg()`), no su centro: girar sobre el centro corre también la punta de
abajo y en vez de tambalearse parece flotar.


## Acompañante (de a dos)

Un segundo personaje en la pieza: un hijo o una visita (`duo.js`). Todavía no
hay forma de *tener* uno jugando —hijos y visitas de amigos vienen después—: se
agrega desde el panel de prueba (Hijo: misma especie, etapa niño, "<nombre>
Jr."; Visita: otra especie al azar, adulto; y se le puede cambiar la etapa). Va
en el save: `state.companion = null | {species, stage, name, kind}`
(`loadState()` lo valida: especie que exista, etapa child/teen/adult).

**No tiene barras.** No come, no se ensucia, no se enferma ni se muere: uno se
preocupa solo de la principal. Todo lo que hace es visual, salvo dos cosas
chicas que pasan por `furniJoy()` (con su tope por hora): jugar juntos y
consolarla le suben un poco la felicidad a la principal.

**Actores.** La mascota (`walker`, `app.js`) y el acompañante (`buddy`,
`duo.js`) tienen la misma forma (`x`, `y`, `dir`, `activity`, `anim`, `frame`,
`hidden`...) y todo el motor de `muebles.js` recibe el actor: un paseo
(`wanderActor()`), un mueble o un juego entre los dos se programa una sola vez.
`pickAnimation()`/`drawSprite()` también reciben el actor (la acción de una
sola vez de la mascota es `petAction`; la del otro, `buddy.action`). El
acompañante se dibuja en `#buddyCanvas`, igual que `#petCanvas` (96 px CSS,
backing store en píxeles físicos, escala entera por su etapa) y con
`renderBuddy()`; el que va más alto (montado, saltando encima del otro) se pasa
adelante reordenando el DOM, no con `z-index`, así el borde de la bañera sigue
delante de los dos. Se esconde mientras la mascota es huevo.

Qué hace (`updateBuddy()`, llamado desde `loopRender()`):
- Pasea y visita muebles solo, igual que la mascota.
- **Se duerme con ella**: en la cama si hay una (la rutina de la cama ya tiene
  lugar para dos: el acompañante del lado de la almohada), si no a su lado.
- **La consuela** si está triste o enferma (cada `COMFORT_GAP_MS`): va, le hace
  cariño y le da un `furniJoy()`.
- Celebra cuando ella celebra (al ganar un juego).
- Tocarlo le hace un mimo (sin barras que mover).

**Jugar entre ellos.** Cuando los dos están libres (`actorFree()`) y uno termina
un paseo, con `SOCIAL_CHANCE` empiezan algo juntos, con al menos
`SOCIAL_GAP_MS` entre una cosa y otra: un mueble de a dos
(`SOCIAL_FURNI_SHARE` de las veces, si hay uno libre) o uno de los 13 juegos de
`SOCIALS`: abrazo, choca esos cinco (saludo secreto), saltarse (uno se agacha y
el otro le pasa por encima, por turnos, avanzando), la pinta (persecución con
cambio de roles), carrera (el ganador sale del sorteo de velocidades),
escondidas (detrás de un mueble que no sea "libre"), caballito (el más grande
lleva al otro; necesita que el de arriba no sea más grande), cosquillas,
saltos (al unísono o en ola), baile, empujoncitos, mirar el cielo (estrellas de
noche, siesta de día), paseo e imitar (copia tres movimientos y en el cuarto se
equivoca). Qué personaje es `a` y cuál `b` se sortea, así el que persigue o el
que se esconde no es siempre el mismo. Cada uno dura 8-15 s (el paseo, hasta 20). Probados los 13
con las dos combinaciones de tamaño: 0 errores, 0 trabados.

### Juegos de a dos (ver también "Minijuegos")

Seis más en `duo-juegos.js` (`DUO_GAMES`, que se suman a `GAMES` con `duo:
true`): en el menú de Jugar van en su propia sección, "De a dos", debajo de los
otros (`.game-grid-head`). Mismo sistema que el resto: precio, niveles,
récords, Megajuego, mérito. Los dos personajes los maneja **la misma persona**:
la gracia de cada uno es coordinar a los dos. Si no hay acompañante, viene una
visita de otra especie solo para esa partida (`duoGuest()`).

- **Espejo** (`espejo`): pantalla partida, cada mitad con lo suyo; un solo
  deslizador mueve a los dos en espejo, así que hay que elegir una posición que
  le sirva a las dos mitades. Los corazones caen de a pares en espejo (siempre
  se pueden atrapar los dos, y son lo único que corta el combo si se cae).
- **Voleibol** (`voley`): cooperativo, se pasan la pelota sobre la red; un
  botón por personaje, se aprieta cuando el anillo se cierra sobre su cabeza.
  A veces uno "coloca" (le vuelve a él mismo) y lo siguiente es un remate
  rápido: no alcanza con alternar a ciegas. 45 s, 3 vidas.
- **Copia el baile** (`baile`): la visita baila una secuencia (cuatro pasos con
  su nota) y hay que repetirla; crece de a uno por ronda. Desde la ronda 4,
  algunas son "¡al revés!" y valen doble. 2 corazones.
- **Escondidas** (`escondidas`): se mete en una caja, se revuelven, y se toca
  dónde quedó. Al cruzarse dos cajas, una pasa por delante (más grande, arco
  bajo) y otra por detrás: se puede seguir con la vista. 3 corazones.
- **Sube y baja** (`subebaja`): un balancín; cada uno lanza al otro al caer.
  Con ▲/▼ se elige la altura del PRÓXIMO salto (que es del otro lado), para
  reventar globos sin tocar las bombas. La altura 1 nunca tiene bomba.
- **Carrera en dupla** (`dupla`): corren en fila, cada uno con su botón de
  salto; todo le llega primero al de adelante y después al de atrás. Los
  pájaros se esquivan *sin* saltar. El salto mide una **distancia** fija
  (`DP_JUMP_DIST`) y no un tiempo: con duración fija, a la velocidad del nivel
  5 había pares de obstáculos imposibles (muy juntos para dos saltos, muy
  separados para uno). Las cuentas están en el comentario de arriba del juego.

Comparten una sola variable de partida, `dg` (nunca hay dos minijuegos a la
vez), con `dgDispose()` registrado en `extraMinigameDisposers` (lo que corre
`forceCloseMinigames()`). Cada juego separa la lógica (`dg.stepFn(dt)`) del
dibujo: así un bot juega cientos de partidas sin canvas. **Ojo con los nombres
en `dg`**: `stepFn`/`drawFn`/`endFn` son del loop; Sube y baja guardaba su
alto por nivel en `dg.step` y el loop lo pisaba con una función (el personaje
salía volando a la esquina).

El mérito de cada uno está **calibrado con bots** que juegan contra las
funciones reales (un bot "bueno" con errores humanos y uno "experto"; las
medianas están en el comentario de cada `xxMerit()`): un bot bueno queda en
~35-45 de mérito y uno experto en ~55-80. Si se cambia la dificultad de uno,
repetir esa simulación en vez de mover el factor a ojo.

Los personajes dentro de estos juegos se dibujan con `drawActorAt(ctx, actor,
x, suelo, flip)` (escala 2 entera, igual que `drawPetAt()`) sobre un "actor de
juego" (`gameActor()`) que no toca `petAction` ni el paseo de la pieza.

## Minijuegos

Seis, todos sobre `#gameCanvas`, que se redimensiona con `fitGameCanvas()` a
su tamaño real en pantalla para que nada salga estirado:

- **Atrapa estrellas** (`sg`): mover a la mascota con el deslizador de abajo
  para atrapar lo que cae, esquivando la caca. 20 segundos
  con dificultad creciente (caen más seguido, más rápido y con más caca). El
  combo multiplica hasta x4 y se corta tanto al comer caca como al dejar caer
  una estrella.
- **Baloncesto** (`bb`): la pelota sube y baja, se aprieta Tiro cerca del punto
  más alto. 3 tiros, dificultad creciente (`BB_DIFFICULTY`). El arco de vuelo es
  una parábola real (`bbArcPos()`). Ni un switch limpio es 100% seguro: hay
  `BB_REBOUND_CHANCE` (5%/15%/40% por tiro) de que rebote igual y encadene a una
  Bandeja. Una Bandeja lograda puede a su vez encadenar a un Slam Dunk con esa
  misma probabilidad. Puntos según de dónde venga la cadena: switch 3, bandeja
  3(de switch)/2(de tocar el aro), dunk 4(de switch)/3(de tocar el aro) — el
  dunk vale más viniendo de un switch porque ya evitó rebotar dos veces. Tocar
  el aro (`near≤h<peak`) ya no es "0 puntos": siempre manda a Bandeja. Un 2%
  de las veces que el tiro no alcanza, la pelota se pincha y termina la
  partida ahí mismo (`BB_POP_CHANCE`).

  Bandeja y Slam Dunk son botones propios (tres en total: Tiro / Bandeja / Slam
  Dunk, `.gbtn-row3`) y cada uno es un salto de **una sola pasada**, no un
  oscilador que sube y baja esperando el botón: `bbJumpPos(t)` calcula una
  parábola real (misma forma que `bbArcPos`) sobre `BB_LAYUP_JUMP_MS`/
  `BB_DUNK_JUMP_MS`, y solo cuenta un toque dentro de `BB_LAYUP_WINDOW`/
  `BB_DUNK_WINDOW` (fracciones 0..1 del salto); afuera de la ventana, antes o
  después, es fallo igual que no apretar. La bandeja avanza en x mientras salta
  (`BB_LAYUP_DX_FRAC`, "parábola hacia la derecha"); el slam dunk salta derecho
  hacia arriba y su ventana cae después del punto más alto ("al caer"). Si el
  salto completo transcurre sin toque, `bbLoop()` lo cancela solo llamando a
  `resolveJumpShot(false)`.

  Las dos ventanas (`BB_LAYUP_WINDOW = [0.38, 0.70]`, `BB_DUNK_WINDOW =
  [0.50, 0.72]`) y la forma de cada salto (`BB_LAYUP_ARC_FRAC`/
  `BB_LAYUP_DX_FRAC`/`BB_DUNK_ARC_FRAC`) están calibradas a mano contra una
  captura de pantalla real marcada a mano: se ubicó dónde caía el punto más
  alto de cada salto, hasta dónde llegaba el tramo bueno dibujado, y qué tan
  alto/ancho se veía el salto completo, y de ahí se sacaron las fracciones
  correspondientes (con la fórmula real de `bbJumpPos`, `4t(1-t)`, no a ojo).
  Para el dunk en particular, el final de la ventana (0.72) es el instante en
  que el personaje, ya bajando, cruza la altura del aro — no bien más abajo
  como estaba antes.

  El alto y el ancho del salto (antes `BB_LAYUP_ARC_PX`/`BB_LAYUP_DX`/
  `BB_DUNK_ARC_PX`, en píxeles fijos) pasan a `_FRAC`, fracción de `bb.h`/`bb.w`
  igual que ya hacían las posiciones `X_FRAC`/`Y_FRAC` — mismo motivo que
  `drawEgg()` dibuja sus radios como fracción del canvas: en píxeles fijos, la
  altura que se veía bien en un canvas de prueba chico se quedaba corta en un
  canvas real de teléfono (bastante más alto), y el dunk terminaba sin llegar
  ni a la altura del aro. Verificado por simulación contra `bbJumpCfg()`/
  `bbJumpPos()` reales en tres tamaños de canvas bien distintos: el dunk
  siempre despega por encima del aro y la bandeja siempre aterriza antes de
  llegar a él, sin importar el tamaño de pantalla.
- **Reflejos** (`rx`): aparecen blancos que duran cada vez menos; tocar los
  buenos, no las bombas. 25 segundos y 3 vidas. Tocar el vacío corta el combo,
  así que martillar la pantalla es peor que elegir.
- **Tap rítmico** (`tr`): tres carriles, notas que bajan a la línea. El chart lo
  genera `trBuildChart()` (los carriles y los tonos cambian en cada partida).
  Ventana `TR_PERFECT` (simétrica) y ventana de acierto normal, que es
  **asimétrica** (`TR_GOOD_EARLY` = 0.19s; `TR_GOOD_LATE` es un cuarto de eso,
  0.0475s): un toque temprano suena cuantizado al pulso de la nota, sin costo
  de audio, así que hay margen para tolerar bastante adelanto; uno tarde no se
  puede cuantizar hacia atrás y siempre suena "ya" — de ese lado casi no hay
  margen. Como `TR_GOOD_LATE` queda por debajo de `TR_PERFECT`, del lado tarde
  no existe un "bien": todo toque atrasado que se acepta ya cae también
  dentro de la ventana perfecta, o es perfecto o es fallo. Tocar de más
  también corta el combo.

  **El tempo es fijo y todo se mide en pulsos, no en segundos sueltos.**
  `TR_BPM = 150` define la negra (`TR_BEAT_SEC` = 0.4s) y de ahí salen derivados la
  corchea, el largo de una sostenida (una blanca), la anticipación con que se
  ve venir una nota (tres pulsos) y el largo del chart (`TR_CHART_BARS`
  compases de `TR_BEATS_PER_BAR`). Cambiar el BPM reacomoda todo solo.
  `trBeatTime(beat)` multiplica en vez de ir acumulando: sumar la negra sesenta
  veces arrastra error y deja las notas fuera de la grilla del metrónomo.

  Una nota **solo puede caer en una negra o en la corchea exacta del medio**,
  nunca en un instante intermedio: `trBuildChart()` recorre números de pulso
  enteros y los contratiempos van en `beat + 0.5`. Verificado por simulación
  contra la función real: 0 notas fuera de la grilla de corcheas y 0
  sostenidas que no terminen sobre un pulso, en 4000 charts.

  Antes el chart aceleraba solo y eso era lo único que subía la intensidad,
  pero con la pista acelerando no hay forma de que suene a canción. La
  dificultad ahora escala por **densidad** sobre la misma grilla:
  `TR_OFFBEAT_CHANCE`, `TR_DOUBLE_CHANCE` y `TR_HOLD_CHANCE` son rampas
  `{al empezar, al terminar}` que `trRamp()` interpola según el avance —
  medido a 150 BPM, va de ~3.0 a ~3.9 notas/s. Si se quiere endurecer o ablandar el
  juego, se tocan esas rampas, **no** el tempo.

  Dos tipos de nota además de la simple: **dobles** (dos carriles al mismo
  instante — hay que tocar los dos) y **sostenidas** (`TR_HOLD_SEC`, que son
  exactamente dos pulsos; hay que mantener apretado el carril hasta
  completarla y soltar antes corta el combo igual que un fallo). Los
  contratiempos son siempre nota simple a propósito: si además pudieran ser
  dobles o sostenidas, la parte densa del final se vuelve ilegible.

  Por las sostenidas el input dejó de ser un solo `trHit()` en `pointerdown` y
  pasó a `trPress()`/`trRelease()` con estado por carril (`tr.laneDown[]`):
  hace falta saber si se sigue sosteniendo, no solo si se tocó. El botón de
  carril ya no usa `wireGameButton()` (solo ata pointerdown) porque necesita
  también el soltar; el canvas trackea `pointerId → carril` para que dos dedos
  en dos carriles (una doble) funcionen a la vez.

  `trBuildChart()` tiene dos resguardos para que ningún fallo sea culpa del
  generador y no del jugador — `pickLane()` devuelve `null` y esa posición
  queda como silencio antes que agendar una nota injusta:
  - `busyUntil[carril]`: una sostenida deja su carril tomado hasta un poco
    **después** de terminar (`+ TR_MIN_SAME_LANE_GAP`), así la nota siguiente
    no cae justo en el instante en que hay que soltar.
  - `TR_MIN_SAME_LANE_GAP`: dos notas más juntas que eso nunca comparten
    carril (con contratiempos quedan a 0.19s y la ventana `TR_GOOD` mide lo
    mismo, así que en el mismo carril serían indistinguibles). Aplica también
    a la pareja de una doble, que es justo por donde se escapaba antes.
  Verificado por simulación pura contra la función real: 0 solapamientos, 0
  pares del mismo carril demasiado juntos, 0 charts fuera de orden.

  Tiene sonido y pulso visual, el único minijuego con los dos:
  - **Sonido**: sintetizado con Web Audio (`tone()`/`beep()`, en las
    utilidades compartidas de minijuegos), sin archivos de audio. Un acierto
    (normal o perfecto) **no suena en el instante del toque, sino en el pulso
    de la nota** (`trSfxHit(pitch, perfecto, at)` recibe `tr.audioStart +
    mejor.t`): si sonara al tocar, un acierto adelantado —dentro de la
    ventana pero antes del pulso— se oiría desalineado del metrónomo aunque
    el juego lo cuente como bueno. Achicar la ventana no arregla eso, solo
    reduce cuánto se nota; cuantizar sí. `tone()` igual recorta `at` al
    presente si ya quedó en el pasado, así que un toque tardío sigue sonando
    "ya" —no hay forma de sonar hacia atrás—, pero es el caso adelantado el
    que más se nota contra la pista. `trSfxFail` no cuantiza (`at` por
    default 0): un fallo no tiene ningún pulso al que alinearse. `TR_SCALE` es
    la escala
    de **Si menor natural** recorrida desde el 7º grado (A, B, C♯, D, E, F♯,
    G, A, B): nueve notas repartidas de a tres por carril, graves a la
    izquierda y agudas a la derecha, así la altura coincide con la posición en
    pantalla. Cada nota del chart sortea su tono entre los tres del carril
    (puede repetir el anterior), de modo que cada partida arma una melodía
    distinta pero siempre en tono. El registro es 440-988 Hz **a propósito**:
    abajo de ~400 Hz el parlante de un celular casi no suena.
    - Acierto normal: la nota sola, onda cuadrada.
    - **Perfecto**: la nota con su 3ª y su 5ª (índices `i`, `i+2`, `i+4`), las
      tres a la vez y en triangular — las nueve combinaciones dan tríadas
      diatónicas completas de Si menor (A mayor, B menor, C♯ dim, …),
      verificado calculando los intervalos desde los Hz del código. Por eso
      `TR_SCALE` tiene 13 entradas y no 9: las cuatro de arriba no las toca
      ninguna nota, existen solo para que las tríadas de las notas más altas
      cierren en vez de dar la vuelta y quedar en octavas dobladas. Cada voz
      va más bajita que un tono suelto: tres osciladores al volumen de uno
      saturan.
    - **Fallo** (`trSfxFail`): el tritono contra la tónica (Fa natural con
      Si), lo único fuera de escala en todo el juego — no puede confundirse
      con un acierto ni sonar "bien por casualidad".
    El `AudioContext` se crea recién al primer sonido (no antes: los
    navegadores lo bloquean si no hay un gesto del usuario previo, y acá
    siempre lo hay porque hace falta tocar algo para llegar a jugar) y queda
    vivo para toda la sesión, no solo para este minijuego. `getAudioCtx()`
    está blindado con try/catch y una bandera para no reintentar, porque ahora
    lo llama el loop del juego en cada frame: si tirara ahí, se llevaría
    puesto el `requestAnimationFrame` y el minijuego se congelaría.
  - **Pista de fondo** (`trScheduleTrack`): un **metrónomo** en cada negra
    (`TR_CLICK_ACCENT`/`TR_CLICK_BEAT`, dos clicks cortos y agudos, fuera del
    registro de la melodía para que no se confundan con una nota; el acento va
    en el primer tiempo del compás) y el acorde de **Si menor en redonda**,
    uno por compás (`TR_PAD_CHORD`, voicing abierto B3-F♯4-D5). Se sienta
    debajo de la melodía **por volumen** (`TR_PAD_VOL`), no por ataque lento:
    con `TR_PAD_ATTACK_MS` alto el acorde se percibe entrando tarde y suena
    desfasado del metrónomo, así que el ataque es corto (12ms, solo para que
    no chasquee) y lo que lo mantiene atrás es que está bajito.
    Además, en `tone()` el ataque va en rampa **lineal** y solo la caída es
    exponencial: una rampa exponencial de subida arranca pegada a cero y
    recién despega cerca del final, o sea que el golpe se escucha bastante
    después del instante agendado.
    Se agenda **por adelantado** (`TR_SCHEDULE_AHEAD`) con instantes absolutos
    del reloj de Web Audio vía `tone({ at })`, no disparando el sonido en el
    frame que cruza el pulso: un metrónomo disparado frame a frame suena
    tembleque. Como avanza por número de pulso y no por "crucé el beat en este
    frame", un frame lento no le hace saltear ni duplicar clicks — verificado
    simulando 30s con frames de 250ms intercalados. Un pulso que ya quedó en
    el pasado se **saltea** (`if (at < now) continue`) en vez de agendarse:
    `tone()` recorta `at` al presente, así que agendarlos igual amontonaría
    todos los clicks atrasados de golpe. El `AudioContext` se prende en
    `startTapGame()`, dentro del gesto que abrió el minijuego, y la pista
    arranca `TR_START_DELAY` después: si se esperara al primer frame el
    contexto podría seguir suspendido y se perdería el primer compás.
  - **El reloj del juego es el del audio** (`trAdvanceClock`): `tr.time` sale
    de `audioNow()`, no de acumular el `dt` de los frames. Si corrieran por
    relojes distintos, la pista (agendada en el reloj de audio) se despegaría
    de las notas apenas el navegador saltee un frame — y encima el `dt` viene
    con tope de 0.05s, o sea que con la pestaña trabada se atrasa a propósito.
    Mientras el `AudioContext` siga suspendido se usa el `dt` acumulado y al
    enganchar se descuenta lo ya transcurrido, así no pega un salto.
  - **Pulso visual**: late una vez por negra —el mismo compás que marca el
    metrónomo, una vez visto y otra escuchado— y más fuerte en el primer
    tiempo. Late toque o no toque el jugador: es metrónomo, no feedback de
    puntería (eso ya lo cubren los flashes por carril y los sonidos).

- **Snake** (`sn`): clásico, sobre una rejilla de celdas de `SN_CELL`. Se gira
  deslizando el dedo o con flechas / WASD. El giro se registra en `pointermove`
  y no al soltar, para poder encadenar dos curvas sin levantar el dedo. `snTurn()`
  compara contra `dir` (la dirección del último paso ya dado) y no contra
  `nextDir`: si no, dos giros dentro del mismo paso dejan volverse 180° sobre el
  propio cuerpo. Acelera 4 ms por manzana, de 190 a 85 ms por paso.
- **Memorice** (`mm`): 10 luces en posiciones al azar; se enciende una secuencia
  y hay que repetirla tocándolas en orden. Suma una luz por ronda y un solo error
  termina la partida. Las posiciones salen de una rejilla 4x3 barajada con la luz
  corrida al azar dentro de su casilla: sortear posiciones libres y descartar las
  que se pisan se amontona, y con diez círculos en un canvas chico hay tiradas
  donde no entra ninguna. La secuencia **crece**, no se sortea de nuevo cada
  ronda: rehacerla entera es más difícil pero se siente arbitrario.

Los seis suman felicidad y disparan `triggerPetAction('celebrate')` si el
puntaje fue positivo.

### Desbloqueo y Megajuego

Los seis juegos del menú viven en `GAMES` (id, nombre, precio y `start`): el
menú de Jugar se arma solo desde ahí. Se desbloquean con monedas tocándolos en
el mismo menú, una vez y para siempre (`state.unlockedGames`). Atrapa
estrellas es gratis (`price: 0`) a propósito: las monedas solo se ganan
jugando, sin un juego abierto no habría cómo juntar la primera. `loadState()`
deja desbloqueados en saves viejos los juegos que ya tienen récord. El panel de
prueba se salta el bloqueo. El cansancio (`energy < 12`) se revisa al lanzar,
no al abrir el menú, para poder comprar igual.

**Megajuego** (`state.mega`): una partida por juego desbloqueado cada
`MEGA_CYCLE_MS` (12 h **reales**, `Date.now()`) que paga `MEGA_COIN_MULT` (x3)
las monedas — solo monedas, la felicidad no. Jugar el de todos los
desbloqueados da al instante `MEGA_BONUS_PER_GAME` (10) por juego, una vez por
ciclo. El ciclo es uno solo para todos, arranca con el primer Megajuego jugado
y `megaState()` lo renueva entero al vencer. Se gasta en `finishMinigame()`
(lee `megaRun`), así que una partida cortada por `forceCloseMinigames()` no lo
consume.

El Megajuego se juega **siempre en el nivel más difícil desbloqueado**
(`maxLevelFor()`), no en el elegido en la ficha: es la partida especial del
ciclo, así que va con todo, y su x3 se multiplica con el `LEVEL_COIN_MULT` de
ese nivel. Lo fija `launchGame()`.

La cuenta regresiva del ciclo se ve en vivo: cualquier elemento con
`data-mega-clock` (`"short"` para HH:MM) o `data-mega-bar` lo refresca
`tickMegaClocks()`, un solo `setInterval` global de 1 s que no hace nada si no
hay relojes a la vista — ninguna hoja tiene que arrancarlo ni pararlo. Aparece
en el banner de la grilla (con barra que se vacía), en la etiqueta de las
tarjetas cuyo MEGA ya se jugó y en la ficha ("MEGA usado · vuelve en").

### Niveles

Cada juego del menú tiene niveles 1 a `GAME_MAX_LEVEL` (5). La experiencia
(`state.gameXp[id]`) es el **mérito** de cada partida tal cual, sin multiplicar
por nivel ni por Megajuego. `LEVEL_XP` está en "partidas buenas" acumuladas
(`GOOD_GAME_MERIT = 45`): 10 para el nivel 2, 30 para el 3, 50 para el 4, 150
para el 5. El nivel **no sube solo**: la experiencia desbloquea y se elige en
la ficha del juego entre los desbloqueados (`state.gameLevelPick`), para
que nadie quede atascado en uno que le queda grande. Al desbloquear uno queda
elegido de una. Cada nivel tiene nombre (`LEVEL_NAMES`: Fácil, Normal,
Difícil, Experto, Leyenda).

Más nivel = más difícil, así que paga más: `LEVEL_COIN_MULT` (x1 a x2) multiplica
solo las monedas y se suma al x3 del Megajuego. Sin eso subir sería un castigo.
El récord es por nivel (`recordKey()`; el nivel 1 usa la clave de siempre, así
los récords viejos quedan como de nivel 1).

La dificultad la lee cada juego con `levelT()` (0 en nivel 1, 1 en el máximo)
desde la variable global `playLevel`, que `launch()` fija **antes** de
`start()` (Snake y el chart del Tap la leen al armar su estado) y
`exitMinigame()`/`forceCloseMinigames()` devuelven a 1 — el panel de prueba
juega siempre en nivel 1. Qué sube en el nivel máximo: Estrellas caen 50% más
rápido, 30% más seguido y con +15 puntos de caca; Baloncesto solo la velocidad
de la pelota (+50%: el azar de rebotes ya es bastante); Reflejos blancos 30%
más cortos y seguidos, +12 puntos de bombas; Tap rítmico más densidad
(`TR_LEVEL_BONUS`), **nunca** tempo; Snake arranca a 140 ms en vez de 190 y
acelera más; Memorice arranca con 5 luces y las muestra 30% más rápido. Tap
prueba no tiene niveles. Números sin calibrar, un primer intento.

### Cómo se arma un minijuego

**Los mandos van abajo, no encima de la pantalla.** `showGameControls(html)`
esconde `.controls` (comer, limpiar, tienda...) y pone en su lugar los botones
del juego; `exitMinigame()` y `forceCloseMinigames()` los sacan. Los usan
estrellas (deslizador), baloncesto (TIRAR), snake (cruceta) y tap rítmico (un
botón por carril). Reflejos y memorice **no**: se juegan tocando la pantalla.
`wireGameButton()` los ata con `pointerdown` y no con `click` porque en el
teléfono el click llega bastante después del toque.

Lo compartido está justo debajo de `fitGameCanvas()` y conviene reusarlo:

- `enterMinigame(id)` / `exitMinigame()`: alta y baja del canvas (esconder al
  monito, mostrar el canvas, `catchUp()`, `activeMinigame`).
- `finishMinigame(id, {...})`: aplica premio y costo, guarda el récord y abre
  la hoja de resultado (`showGameResult()`, ver abajo).
- `drawPetAt(ctx, x, suelo, mood, escala)`: dibuja a la mascota dentro del canvas
  de un minijuego (la canasta de estrellas y el jugador de baloncesto son el
  sprite real). La `escala` **tiene que ser entera**: se usa 2 (64px) porque el
  tamaño de la vista normal, 96px, se come el cuadro de un minijuego.
- `drawEmoji()`: **usar siempre esto en vez de `ctx.fillText()` con un emoji.**
  `fillText` rasteriza el glifo de color en cada llamada y en una partida hay
  decenas por frame; `emojiSprite()` lo cachea en un canvas chico y después solo
  copia.
- `makeCanvasPointer(gc)`: coordenadas del puntero con el `getBoundingClientRect()`
  cacheado. Llamarlo en cada `pointermove` fuerza un recálculo de layout por
  frame.

Cada juego guarda su estado en una variable global (`sg`, `bb`, `rx`, `tr`, `sn`,
`mm`; los de a dos comparten `dg`, ver "Juegos de a dos") y expone un `xxDispose()` que saca listeners y cancela el
`requestAnimationFrame`.
**Al agregar uno nuevo hay que sumarlo a `forceCloseMinigames()`**, que es lo que
corre si la mascota se muere a mitad de partida.

Los récords viven en `state.records[id]`, o sea dentro del save (`loadState()` los
rellena vacíos para saves viejos).

### Menú de Jugar: grilla, ficha y resultado

Tres hojas, como la tienda de una app:

1. **Grilla** (`openGamesMenu()`): tarjetas de 2 columnas con el color propio
   de cada juego (`--g1`/`--g2` por `data-g` en el CSS — al sumar un juego hay
   que darle su par), puntitos de nivel (`levelDots()`), récord del nivel
   elegido y la etiqueta MEGA si le queda. Arriba, `megaBanner()` con un punto
   por juego desbloqueado. Los bloqueados se compran tocándolos y, al
   comprarlos, abren su ficha.
2. **Ficha** (`openGameDetail(id)`): los cinco niveles a la vista (antes era
   un botón chico que giraba 1→2→3→1 sin mostrar a dónde iba). Tocar uno
   desbloqueado lo elige; uno bloqueado dice cuánta xp le falta. Debajo, récord
   del nivel, multiplicador de monedas y barra de xp (`levelProgress()`). Si
   queda Megajuego, "Jugar MEGA · <nivel máx.>" va como botón principal y
   "Jugar" como secundario; si ya se usó, en su lugar va el reloj de cuánto
   falta. El cansancio se avisa dentro de la ficha.
3. **Resultado** (`showGameResult()`): reemplaza al `say()` de una línea que
   duraba 3 segundos. Puntaje grande, insignia de récord, premios en chips y
   la barra de xp animándose desde donde estaba antes de la partida (desde 0
   si subió de nivel). El overlay va con `.clear` (sin desenfoque) para que se
   vea a la mascota celebrando arriba; `showOverlay()` saca esa clase en
   cualquier otra hoja. "Otra vez" relanza con `launchGame()` (o "Probar
   <nivel>" si se acaba de abrir uno); los prototipos del panel de prueba no
   están en `GAMES` y solo muestran "Listo".

`launchGame(id, mega)` fija `playLevel` y `megaRun` antes de `start()` y
devuelve `false` si está muy cansado, para que quien llama ponga el aviso
donde corresponda.

### Combate (prototipo, todavía no en el menú de Jugar)

`startCombatGame()` — se lanza solo desde el panel de prueba (`dbgCombat`),
a propósito: es para probar el feel antes de sumarlo al menú real y a la
economía. El rival es **otra especie al azar** (nunca la propia): no hace
falta arte nuevo, `drawCombat()` pisa `debugForcedSpecies` un instante nada
más que para ese `drawPetAt()` y lo restaura enseguida, así no interfiere si
el panel de prueba ya estaba forzando una especie propia.

Mecánica de lectura + reacción, no azar: el rival telegrafía uno de tres
ataques (`CB_ATTACKS`, un ícono arriba de su cabeza) y hay que responder con
el botón que corresponde antes de que se cierre el anillo de tiempo
(`cbWindowMs()`, se achica por ronda igual que `BB_DIFFICULTY`). Golpe y
agarre solo evitan daño si se leen bien (esquivar / bloquear); el ataque
lento es el único que, bien leído, deja contraatacar y hacerle daño de
vuelta al rival — así no alcanza con apretar siempre el mismo botón.
Verificado por simulación pura (sin canvas): un jugador que siempre acierta
gana 100% de las veces, uno que aprieta al azar gana ~3%, uno que solo
contraataca gana ~21% — la habilidad paga y no hay atajo.

Los tres botones (`.gbtn-row3`, Esquivar / Bloquear / Contra) están siempre
habilitados durante la ventana de telegraph, al revés que Baloncesto donde
solo uno sirve por vez — acá la gracia es elegir CUÁL de los tres es el
correcto. El impacto (`CB_IMPACT_MS`) es sacudida de cámara + flash rojo +
knockback de una sola pasada (misma idea que las parábolas de Baloncesto,
pero en x). Números sin calibrar: `CB_ROUNDS`/`CB_PLAYER_HP`/`CB_RIVAL_HP`/
`cbWindowMs()` son un primer intento a propósito, para probarlos jugando.

### Tap prueba (prototipo, todavía no en el menú de Jugar)

`startTapPruebaGame()` — se lanza solo desde el panel de prueba
(`dbgTapPrueba`), a propósito: es una variante A/B del tap rítmico real para
escuchar si suena mejor antes de decidir si lo reemplaza. Comparte TODO el
sistema ya probado del tap rítmico real — grilla, rampas de dificultad,
ventanas de acierto, holds/dobles, input, hasta las funciones de sonido
`trSfxHit`/`trSfxFail` — y cambia solo dos cosas:

- **Melodía fija en loop, no al azar.** `TP_MELODY` es una frase de 4
  compáses compuesta a mano (índices en `TR_SCALE`) que sube en el primer
  compás (tónica-3ª-5ª-7ª), baja por grados en el segundo, rebota en tensión
  en el tercero y baja resolviendo a la tónica en el cuarto, antes de
  repetirse. `tpPitchAt(beat)` la consulta según la posición dentro del
  compás — el chart (`tpBuildChart`, copia de `trBuildChart`) sigue
  sorteando carril y timing igual que siempre, lo único que ya no sortea es
  el tono. Una corchea a mitad de camino entre dos negras no tiene nota
  propia en la frase: toma la del pulso que viene (anticipación), más simple
  que componer el doble de notas.
- **Progresión de acordes, no un acorde fijo.** `TP_CHORDS` recorre
  i-VI-III-VII en Si menor natural (Bm-G-D-A) un acorde por compás, mismo
  voicing abierto que ya usaba el Bm fijo (fundamental, quinta, tercera una
  octava arriba).

Verificado por simulación pura contra `tpBuildChart()`/`tpPitchAt()` reales:
0 notas fuera de la grilla, 0 solapamientos, todo pitch dentro de rango
válido para la tríada perfecta, y la melodía se repite idéntica en cada
loop de 16 pulsos.

## Panel de prueba

El botón ✏️ (`#btnDebug`) abre `#debugPanel`: fuerza etapa, ánimo y **especie**
(para previsualizar sin perder la mascota guardada), dispara las 5 acciones,
lanza los minijuegos, ensucia y mata. La sección "Acompañante" (`duoDebugHtml()`
/`wireDuoDebug()` en `duo.js`) agrega o saca al hijo o la visita, le cambia la
etapa, dispara cualquiera de los juegos entre ellos ("Juntos ahora") o un
mueble de a dos, y lanza los juegos de a dos. En pantallas anchas queda fijo al lado del
dispositivo (`.layout-row`); en celular la misma CSS lo vuelve un modal a
pantalla completa.

`debugForcedSpecies` es lo que lee `currentSpeciesId()` antes que `state.species`.

## Convenciones

- Todo el copy en español (Chile).
- Emojis solo de **Unicode 11 o anterior** (2018). 🪙 y 🫧 (Unicode 13 y 14)
  salían como un cuadro vacío en teléfonos con sistema más viejo; se
  cambiaron por 💰 y 🧼. Antes de sumar un emoji nuevo, revisar su versión.
- Los mensajes de commit también en español, explicando el **porqué** del cambio
  y no solo el qué.
- Nada de emojis ni de identificadores de modelo en commits o en el código.
