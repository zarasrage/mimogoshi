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
- `CANVAS_W`/`CANVAS_H` = **96** → `pixelScale()` da 3 (96/32), el sprite llena
  el canvas justo.
- `#petCanvas` en CSS mide **96x96**, o sea 1:1 con su backing store del HTML.
  Así la única escala que queda es la del dispositivo (2x/3x), que ya es entera.

Para cambiarle el tamaño a la mascota hay que mover **los tres a la vez**
(`CANVAS_W`/`CANVAS_H`, el `width`/`height` del `<canvas>` en el HTML y el CSS) y
solo a múltiplos de 32: 64, 96, 128, 192. Poner `width:50px` sobre un canvas de
80 (como estaba antes) reescala por 0.625 y arruina todo el pixel art.

Lo mismo aplica a las miniaturas del selector de especie (`speciesThumbStyle()`
acepta `s`; el picker de la pantalla de inicio usa `s=1`, 32px — ver más abajo)
y a la mascota dentro de los minijuegos, que se dibuja con `drawPetAt()` a escala
2 usando `ctx.translate()` y **sin** `ctx.scale()`.

`drawEgg()` dibuja sus radios como fracción de `CANVAS_W`/`CANVAS_H`, no en
píxeles fijos: si no, al agrandar la mascota el huevo se queda chico abajo.

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
que ya usan las listas de comida y minijuegos): tope de alto + scroll propio,
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

La caca aparece con `POOP_CHANCE_PER_HOUR` (0.0115 por hora de juego): calibrada
para que la primera salga en mediana a la hora real. La higiene no baja sola —
solo mientras haya caca sin limpiar (ver `DECAY_PER_HOUR.hygiene`).

- **Etapas** (`ALL_STAGES`): solo dos, `egg → grown` (`EGG_HOURS = 0.1`, o sea
  ~6 s reales de huevo). Había una escalera de edades
  (bebé/niño/adolescente/adulto bueno-neutro-malo) pero **no existía arte por
  edad**: cada especie tiene un solo diseño, así que las cinco etapas se veían
  idénticas. `loadState()` mapea a `grown` cualquier etapa que ya no exista, si
  no los saves viejos quedan con una etapa fantasma.
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
  (`BB_LAYUP_DX`, "parábola hacia la derecha"); el slam dunk salta derecho hacia
  arriba y su ventana cae después del punto más alto (`BB_DUNK_WINDOW` empieza
  en 0.60, ya en la bajada — "al caer"). Si el salto completo transcurre sin
  toque, `bbLoop()` lo cancela solo llamando a `resolveJumpShot(false)`.
- **Reflejos** (`rx`): aparecen blancos que duran cada vez menos; tocar los
  buenos, no las bombas. 25 segundos y 3 vidas. Tocar el vacío corta el combo,
  así que martillar la pantalla es peor que elegir.
- **Tap rítmico** (`tr`): tres carriles, notas que bajan a la línea. El chart lo
  genera `trBuildChart()` (acelera de 0.62s a 0.34s entre notas; los carriles
  cambian en cada partida). Ventanas `TR_PERFECT`/`TR_GOOD`; tocar de más
  también corta el combo.

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
- `finishMinigame(id, {...})`: aplica premio y costo, guarda el récord y avisa
  "¡RÉCORD!" si corresponde.
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
`mm`) y expone un `xxDispose()` que saca listeners y cancela el
`requestAnimationFrame`.
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
