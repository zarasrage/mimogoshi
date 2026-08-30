# Mimogoshi — tamagotchi de una sola página

Mascota virtual pixel-art en HTML/CSS/JS puro. **Sin build, sin frameworks, sin
backend**: se edita directo y se abre `index.html` en el navegador. Todo el
progreso vive en `localStorage`.

**Archivos:** `index.html` (esqueleto), `styles.css` (todo el CSS), `app.js`
(toda la lógica) y, dentro de `sprites/`, un par `<especie>_spritesheet.png` +
`.json` por cada especie (más los PNG de personajes todavía sin integrar).
`index.html` carga `styles.css` y `app.js`; los spritesheets se cargan como
`new Image()` desde `app.js` por ruta relativa (`sprites/<archivo>.png`).

Se trabaja **siempre directo sobre `main`**, sin ramas ni PRs — proyecto de una
sola persona.

## Cómo probar cambios

Chequeo de sintaxis (lo mínimo antes de cualquier commit):

```bash
node -e "const fs=require('fs'); new Function(fs.readFileSync('app.js','utf8')); console.log('syntax OK');"
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

La cadena está calibrada así y **no hay que romperla**:

- El arte es de 32x32 por frame.
- `CANVAS_W`/`CANVAS_H` = **64** → `pixelScale()` da 2 (64/32), el sprite llena
  el canvas justo.
- `#petCanvas` en CSS mide **64x64**, o sea 1:1 con su backing store del HTML.
  Así la única escala que queda es la del dispositivo (2x/3x), que ya es entera.

Si algún día hay que agrandar la mascota, subir de a múltiplos (128, 192) y
mantener canvas y CSS en la misma proporción. Poner `width:50px` sobre un canvas
de 80 (como estaba antes) reescala por 0.625 y arruina todo el pixel art.

Lo mismo aplica a las miniaturas del selector (`speciesThumbStyle()` usa `s=2`)
y al mono del minijuego de baloncesto, que se dibuja 1:1 con `ctx.translate()`
y **sin** `ctx.scale()`.

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

El selector es una fila con scroll horizontal (`.species-list`). Si se apilan en
vertical, con tres o más especies el botón "Empezar" se sale de la pantalla.

## Estado del juego

`localStorage`, clave `SAVE_KEY = 'mimogoshi.save.v2'`.

**Todo acceso a `localStorage` va en try/catch**: algunos visores (Quick Look de
iOS, previsualizaciones sandboxed) lo bloquean, y sin el try/catch la página
entera queda en blanco. Si agregas una llamada nueva, protégela igual.

`loadState()` también migra saves viejos: si `state.species` apunta a una
especie que ya no existe, cae a `DEFAULT_SPECIES` en vez de quedarse sin sprite.
Hay que mantener eso al borrar o renombrar especies.

Simulación por ticks (`TICK_MS = 4000`, `MS_PER_GAME_HOUR = 45000`): hambre,
felicidad, energía, higiene y salud bajan solas; `catchUp()` recupera el tiempo
que pasó con la pestaña cerrada (con tope de 3 días).

- **Etapas** (`ALL_STAGES`): solo dos, `egg → grown` (`EGG_HOURS = 0.1`, o sea
  ~4.5 s reales de huevo). Había una escalera de edades
  (bebé/niño/adolescente/adulto bueno-neutro-malo) pero **no existía arte por
  edad**: cada especie tiene un solo diseño, así que las cinco etapas se veían
  idénticas. `loadState()` mapea a `grown` cualquier etapa que ya no exista, si
  no los saves viejos quedan con una etapa fantasma.
- **Ánimos** (`ALL_MOODS`): `normal, happy, sad, sick, sleepy, dead`.

`careGood` / `careBad` se siguen acumulando pero **hoy no los lee nadie**: eran
lo que elegía la rama adulta. Se dejan porque van en el save y son el enganche
obvio si vuelve a haber ramas o un final según el cuidado.

### Dinero y tienda

`state.coins` se gana **solo jugando**: `finishMinigame()` paga
`happinessGain / HAPPINESS_PER_COIN` (tope 15 por partida). Se calcula desde la
felicidad y no desde el puntaje porque cada juego tiene su escala (9 puntos en
baloncesto, ~500 en tap rítmico) y si no habría que calibrar cuatro fórmulas.

`state.pantry` guarda **porciones compradas** por comida. El bocadillo simple
(`price: 0`) es gratis e infinito **a propósito**: es la red de seguridad, si
toda la comida costara, un jugador sin monedas y con la mascota hambrienta
quedaría sin salida. `btnFeed()` cae solo al bocadillo si lo elegido se acabó.

El modelo viejo era `unlockedFoods` (desbloqueo permanente), pero nada en el
código lo llenaba nunca: las comidas 2 y 3 eran inalcanzables. `loadState()`
borra ese campo al migrar.

**Los avisos de la tienda van dentro de la tarjeta, no con `say()`**: la burbuja
tiene `z-index:5` y el overlay `10`, así que un `say()` con un overlay abierto
queda tapado. Lo mismo vale para cualquier menú nuevo.

El huevo es lo **único** que se dibuja procedural (`drawEgg()`, un óvalo): no
vino arte para esa etapa en ninguna especie. Todo lo demás sale recortado del
PNG tal cual, **sin tinte ni recoloreo encima** — los spritesheets ya son la
ilustración terminada, y aplicarles un wash de color por etapa pintaba también
sobre la cara. Por eso `PALETTES` quedó reducido a la entrada `egg`, y por eso
mismo `drawSprite()` solo usa `stage` para decidir si dibuja el huevo o el
sprite: entre las dos etapas que quedan no hay ninguna otra diferencia visual.

## Minijuegos

Cuatro, todos sobre `#gameCanvas`, que se redimensiona con `fitGameCanvas()` a
su tamaño real en pantalla para que nada salga estirado:

- **Atrapa estrellas** (`sg`): mover la canasta, esquivar la caca. 20 segundos
  con dificultad creciente (caen más seguido, más rápido y con más caca). El
  combo multiplica hasta x4 y se corta tanto al comer caca como al dejar caer
  una estrella.
- **Baloncesto** (`bb`): la pelota sube y baja, se aprieta TIRAR cerca del punto
  más alto. 3 tiros, dificultad creciente (`BB_DIFFICULTY`). El arco es una
  parábola real (`bbArcPos()`).
- **Reflejos** (`rx`): aparecen blancos que duran cada vez menos; tocar los
  buenos, no las bombas. 25 segundos y 3 vidas. Tocar el vacío corta el combo,
  así que martillar la pantalla es peor que elegir.
- **Tap rítmico** (`tr`): tres carriles, notas que bajan a la línea. El chart lo
  genera `trBuildChart()` (acelera de 0.62s a 0.34s entre notas; los carriles
  cambian en cada partida). Ventanas `TR_PERFECT`/`TR_GOOD`; tocar de más
  también corta el combo.

Los cuatro suman felicidad y disparan `triggerPetAction('celebrate')` si el
puntaje fue positivo.

### Cómo se arma un minijuego

Lo compartido está justo debajo de `fitGameCanvas()` y conviene reusarlo:

- `enterMinigame(id)` / `exitMinigame()`: alta y baja del canvas (esconder al
  monito, mostrar el canvas, `catchUp()`, `activeMinigame`).
- `finishMinigame(id, {...})`: aplica premio y costo, guarda el récord y avisa
  "¡RÉCORD!" si corresponde.
- `drawEmoji()`: **usar siempre esto en vez de `ctx.fillText()` con un emoji.**
  `fillText` rasteriza el glifo de color en cada llamada y en una partida hay
  decenas por frame; `emojiSprite()` lo cachea en un canvas chico y después solo
  copia.
- `makeCanvasPointer(gc)`: coordenadas del puntero con el `getBoundingClientRect()`
  cacheado. Llamarlo en cada `pointermove` fuerza un recálculo de layout por
  frame.

Cada juego guarda su estado en una variable global (`sg`, `bb`, `rx`, `tr`) y
expone un `xxDispose()` que saca listeners y cancela el `requestAnimationFrame`.
**Al agregar uno nuevo hay que sumarlo a `forceCloseMinigames()`**, que es lo que
corre si la mascota se muere a mitad de partida.

Los récords viven en `state.records[id]`, o sea dentro del save (`loadState()` los
rellena vacíos para saves viejos). Se muestran como insignia en el menú de Jugar;
si van dentro del texto de la descripción, esta pasa a dos líneas y con cuatro
juegos la lista deja el botón de Cancelar fuera de la pantalla.

## Panel de prueba

El botón ✏️ (`#btnDebug`) abre `#debugPanel`: fuerza etapa, ánimo y **especie**
(para previsualizar sin perder la mascota guardada), dispara las 5 acciones,
lanza los 4 minijuegos, ensucia y mata. En pantallas anchas queda fijo al lado del
dispositivo (`.layout-row`); en celular la misma CSS lo vuelve un modal a
pantalla completa.

`debugForcedSpecies` es lo que lee `currentSpeciesId()` antes que `state.species`.

## Convenciones

- Todo el copy en español (Chile).
- Los mensajes de commit también en español, explicando el **porqué** del cambio
  y no solo el qué.
- Nada de emojis ni de identificadores de modelo en commits o en el código.
