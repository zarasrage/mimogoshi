# Mimogoshi — tamagotchi de una sola página

Mascota virtual pixel-art en HTML/CSS/JS puro. **Sin build, sin frameworks, sin
backend**: se edita directo y se abre `index.html` en el navegador. Todo el
progreso vive en `localStorage`.

**Archivos:** `index.html` (esqueleto), `styles.css` (todo el CSS) y la lógica
en siete scripts clásicos que comparten el ámbito global:
- `app.js`: el núcleo (estado, simulación, bitácora, render, tienda,
  Personalizar, panel de prueba).
- `juegos.js`: el menú de Jugar (`GAMES`, niveles, desafío diario, resultado), lo
  que comparten todos los minijuegos (canvas, mandos, sonido, premio) y los
  minijuegos de uno.
- `premios.js`: la ruleta y el gacha.
- `muebles.js`: los muebles (catálogo, arte, guiones), las habitaciones y el
  **motor de actores** que también usa el acompañante.
- `objetos.js`: los 20 objetos mágicos (ver "Objetos mágicos"), que son
  muebles con ganchos propios, y sus capas de efectos.
- `duo.js`: el acompañante (`buddy`) y lo que hacen los dos juntos.
- `duo-juegos.js`: los seis juegos de a dos.

Se cargan en ese orden (`index.html`). Lo de un archivo que usa otro se usa
recién en tiempo de juego (después de `DOMContentLoaded`), nunca al cargar —
salvo los `push` a arreglos de otro archivo (`STYLE_ITEMS` y
`minigameDisposers` de `app.js`, `GAMES` de `juegos.js`, `FURNI_ART` de
`muebles.js`), que por eso van
después del archivo dueño del arreglo. Dentro de
`sprites/`, un par `<especie>_spritesheet.png` + `.json` por cada especie (más
los PNG de personajes todavía sin integrar); se cargan como `new Image()` desde
`app.js` por ruta relativa (`sprites/<archivo>.png`).

Se trabaja **siempre directo sobre `main`**, sin ramas ni PRs — proyecto de una
sola persona.

`docs/PLAN-PERSONAJES.md` es la planificación (todavía sin construir) de los
100+ personajes con stats, rarezas y el Club de la pelea;
`docs/sim-combate.js` simula sus fórmulas de combate.

## Cómo probar cambios

Chequeo de sintaxis (lo mínimo antes de cualquier commit):

```bash
node -e "const fs=require('fs'); for (const f of ['app.js','juegos.js','premios.js','muebles.js','objetos.js','duo.js','duo-juegos.js']) { new Function(fs.readFileSync(f,'utf8')); console.log(f, 'syntax OK'); }"
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

`askName()` también esconde `.controls` (los botones de abajo, que sin
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
- `.controls` en dos niveles: el **dock** (`.dock`) con los cuatro cuidados
  de todos los días —Dormir, Limpiar, Jugar, Comer, en el mismo orden que
  los relojes de la pantalla (ver "Relojes" abajo)—, tarjetas blancas con el
  ícono en un "squircle" lleno del **color exacto de su reloj** (con el
  mismo relieve que el anillo) y la etiqueta en un tono oscuro del mismo.
  Los colores de relojes y botones salen de los mismos tokens de `:root`
  (`--c-energy`, `--c-hygiene`, `--c-health`, `--c-happiness`, `--c-hunger`,
  más `-hi` y `-ink`): antes los botones iban en pastel y no calzaban con los
  anillos (Dormir era azul marino al lado de un reloj violeta). Dormida,
  Despertar sigue violeta (el sol sobre amarillo no se leía). Debajo
  dos **píldoras** (`.pill`, del mismo ancho, blancas con el ícono en un
  círculo de color, `.pill-icon`: rosa-violeta Personalizar, verde menta
  Tienda —era dorado y se confundía con el amarillo de Jugar—;
  antes eran un velo translúcido que se veía lavado) con lo de vez en cuando:
  Personalizar a la izquierda y Tienda a la derecha. Antes también estaban
  la Ruleta 🎡 (ahora dentro de Juegos, ver "Ruleta y gacha") y Reiniciar
  (ahora en la configuración, el ⚙️ de arriba junto al 🧪 del modo prueba,
  `openSettings()`: destructivo, no tiene por qué estar a mano). Debajo
  había cinco puntitos de adorno (un "parlante") que parecían indicadores de
  pestañas y confundían: se sacaron.
- **Relojes** (`#stats`, abajo de la pantalla): las cinco estadísticas son
  anillos en fila en vez de barras, en el orden **energía, higiene, salud,
  felicidad, hambre**: cada cuidado queda encima de su botón del dock
  (Dormir, Limpiar, Jugar, Comer) y la salud, que no tiene botón porque es
  la consecuencia de las otras, va al medio y más grande (58 px contra 50).
  Cada anillo es un SVG con `pathLength="100"`: `render()` pone el valor tal
  cual en `stroke-dasharray` (del arco y de su brillo, `#shine-<stat>`) y el
  número debajo (`#num-<stat>`). En 0 se esconde el arco (`.empty`), si no
  la punta redondeada deja un puntito. **Cada reloj tiene su color**
  (`--stat` por `data-stat` en el CSS: violeta energía, celeste higiene,
  rojo salud, amarillo felicidad, naranja hambre), no el verde/amarillo/rojo
  de antes; `statColor()` ahora solo decide si va `.low` (todo lo que no
  daría verde): el reloj late, el canal se pone rojizo y el número rojo. Y
  van con **relieve** (canal hundido, esfera oscura, filo claro adentro,
  brillo fino sobre el arco y sombra), que fue el "toque final" elegido.
  El botón de cada cuidado lleva el mismo color que su reloj (mismos tokens
  `--c-*`). Antes eran cinco barras finas iguales
  que trataban igual a la salud que a la higiene; se eligió esto entre una
  veintena de propuestas capturadas en la app real.
- **Cada reloj se toca** y abre su ficha (`openStatInfo(stat)`, una hoja
  como las demás): arriba el valor **real** (el hambre en puntos de panza,
  "83 / 180 pts"; el resto con un decimal) y una barra con los umbrales
  marcados (en rojo los que ya cruzó). Debajo, el ritmo de **ahora** por
  hora real (la salud, que va lento, por día) con lo que falta para el próximo umbral (`statRateNow()`,
  `statEta()`, que integra con el x1.5 de apuro), y las listas "Lo que la
  sube", "Lo que la baja" y "Umbrales", cada fila con su valor y la
  etiqueta AHORA en lo que está pasando (dormida, de noche, caca, cama
  puesta, seguro activado...). El hambre suma la tabla de panzas por etapa
  y la salud, la probabilidad de enfermarse por hora. **Todo sale de las
  constantes de la simulación** (`statInfoData()`), nada escrito a mano:
  si se recalibra algo, la ficha queda al día sola. Lo único a mano son los
  costos de higiene y energía de los minijuegos (van en cada
  `finishMinigame()`): al cambiarlos, actualizar esas dos filas. Se refresca
  cada 2 s mientras está abierta (solo el contenido, sin perder el scroll).
  El toque frena la propagación (el listener de `#screen` limpia caca) y
  el reloj apretado brilla con `filter`, no se achica (el ícono es pixel
  art).
- **Íconos pixel en la pantalla** (`PX_ICONS` en `app.js`): todo lo que
  vive en la LCD es pixel art, así que los íconos de los relojes (rayo,
  gota, corazón, carita, muslito), los de la barra de arriba (sol/luna,
  moneda) y el pergamino de la bitácora también lo son, en vez de emojis:
  los emojis son de otro estilo (brillos, degradados) y al lado del resto
  desentonaban. Se probó primero solo la carita entre emojis y se veía como
  el error. **Afuera de la pantalla (dock, menús) siguen los emojis**: es la
  parte de app moderna. Cada ícono se escribe con su relleno nada más
  (letras: b base, l luz, m sombra, w brillo, más las propias) y el
  contorno se agrega solo alrededor, así todos tienen el mismo trazo; los
  de los relojes van en los tonos de su reloj. `installPixelIcons()` los
  arma como SVG en data URI (anda con `file://`) en clases `.px-<nombre>`,
  con la escala redondeada en **píxeles físicos** (`pxIconScale()`, objetivo
  2 px CSS en la barra, 2.3 en los relojes; el corazón de la salud iba a
  2.6 y se veía tosco, ahora va igual que los otros y con la muesca de
  arriba marcada para que se lean los dos lóbulos) y
  `snapPixelIcons()` los corre al píxel físico más cercano (los relojes
  caen en posiciones fraccionarias): un `ResizeObserver` sobre `#screen`,
  cuando cambia el número de monedas o el día/noche, y al terminar de subir
  la hoja del resultado (el chip de felicidad usa la carita). **Nunca
  escalarlos con `transform`**: por eso el latido de carga y el de "bajo"
  son de brillo y halo, no de tamaño. Para sumar uno: agregarlo a
  `PX_ICONS` y usar `<i class="px-icon px-nombre">`. Revisar que el arte
  tenga las filas que corresponde (9x9 los de los relojes, 7x7 los de
  arriba): una fila de más no da error, solo agrega un borde raro abajo, y
  así pasó con la gota (se veía como una base que no dejaba entender que
  era una gota), la moneda, el sol, la luna y el muslito.
- **Los botones avisan** (`updateDock()`, desde `render()`, solo toca el DOM
  si algo cambió): anillo de su color alrededor del ícono (`.need`) y globito
  arriba (`data-badge`): 💊 en Comer si está enferma (anillo también con
  hambre bajo 30), 💩 en Limpiar si hay caca, zZ en Dormir con energía bajo
  `SLEEPY_THRESHOLD` (violeta; rojo si ya está agotada).
- **Pop-up de compra y de premio** (`showPopup()` en `app.js`, `#popup`,
  z-index 20: encima de todo, también de la hoja abierta). Toda compra con
  monedas **se confirma** antes (`confirmBuy()`: precio y con cuánto quedas;
  Cancelar no gasta nada; la comida y la medicina dejan elegir **cuántas**
  con − / + y "Máx", hasta lo que alcance, `multi:true`) y después sale
  "¡Compra realizada!"
  (`boughtPopup()`) con lo que llegó y lo que se pagó: comida, medicina,
  Estilo, mejoras, habitaciones, juegos y el gacha con monedas (con ficha no
  se confirma, no es plata). Lo que se **gana** también sale en pop-up, con
  cada cosa y cuánto: el premio de la ruleta (`wheelPrizeRow()` separa el
  texto de `give()` en nombre y cantidad; lo que se pierde va con
  `tone:'lose'`), lo que sale del gacha (cuando termina de abrirse la
  cápsula) y los regalos 🎁. Si no alcanza, sigue el aviso dentro de la hoja
  y no se pregunta nada. El premio suena con `rewardSound()`, un arpegio de
  prueba; el sonido definitivo queda para después. En las filas chicas un
  mueble va con ✨: su miniatura pixel no se puede achicar a un tamaño no
  entero. El resultado de los minijuegos **no** usa pop-up: ya tiene su
  propia hoja con los premios.
- **Comer abre una bandeja** (`#foodTray`, `toggleFoodTray()`), no una hoja:
  flota encima del dock y las píldoras con posición absoluta, así **el aparato
  no cambia de alto** al abrirla (verificado midiendo `#device` abierta y
  cerrada), y no tapa la pantalla: se ve comer y la barra de hambre. Todas
  las comidas con su stock, más la medicina en la misma fila (antes eran dos
  botones —Comer daba la elegida y Menú la elegía— y el botiquín era una
  sección del menú). Tocar una gasta la porción en el acto (`feedFood()`) y
  **cae del cielo** en un lugar al azar de la pieza (`serveFood()`,
  `.floor-food`, lejos de la mascota si se puede; con plato puesto, en el
  plato). **La bandeja no se cierra**: se pueden tocar varias y caen todas
  al mismo montón (`foodPile`, hasta `FOOD_PILE_MAX`), un poco apiladas. La
  mascota camina una sola vez (`startEatRoutine()`, `kind:'eat'`, que no se
  corta por estar triste o enferma) y se las come una tras otra en la misma
  animación: cada porción se achica de a mordiscos en `EAT_PIECE_MS`
  (`eatFoodPile()`, desde el `track` del paso de comer) y una que todavía
  viene cayendo se espera. Si cae una cuando ya terminó y está celebrando,
  la rutina retrocede al paso de comer; si ya se fue, el montón es nuevo.
  **Las barras suben mientras come, no al tocarla**: `state.meal` guarda lo
  que falta sumar de todo el montón y cada porción suma lo suyo mientras se
  achica. Antes el hambre se llenaba antes de que llegara a la comida, y
  antes de eso había que dar las porciones de a una, esperando que
  terminara cada vez. Si la rutina se corta, lo que quedaba en el piso se
  va y se suma de una (`flushMeal()` desde `digestMeal()`); si se cierra
  la app a mitad, lo suma `loadState()`. **Mientras va a la comida y se la
  come no se puede hacer nada más** (`mealBusy()`), salvo seguir tirándole
  comida: un listener de captura en `window` se come todo toque en
  `#controls` y `#screen` menos los de `#foodTray`, y avisa con `say()`;
  los botones se ven apagados (`.controls.busy`). La medicina sí espera a
  que termine de comer. Con plato puesto se sirve en el plato, como antes. La última
  queda marcada (`state.selectedFood`); una en 0 sale apagada y tocarla abre
  la tienda en Comida. Se cierra con Cerrar, tocando afuera o al entrar a un
  minijuego (`showGameControls()`). Mientras está abierta se esconden los
  globitos (`.tray-open`), que si no asomaban por arriba.
- **Dormir** (`btnSleep()`) la acuesta en el acto (a la cama si hay una, eso
  lo hace solo `updateWalker()`); dormida, el mismo botón es ☀️ Despertar y
  sigue las reglas de `tryWake()` (ver "Sueño y energía"). Con energía en
  `WAKE_AT` o más no se acuesta ("No tiene nada de sueño"): se despertaría
  sola en el próximo tick y el botón parecería no hacer nada.
- Todo lo tocable lleva `-webkit-tap-highlight-color:transparent`,
  `user-select:none` y `touch-action:manipulation`; los `:hover` van dentro de
  `@media (hover:hover)` para que no queden pegados en el teléfono. El `<input>`
  usa 16px (con menos, Safari de iPhone hace zoom al enfocar).
- Preparado para app a pantalla completa: `viewport-fit=cover`, `theme-color`
  y padding con `env(safe-area-inset-*)` en `body` y en la hoja.
- **En el teléfono (≤ 500px de ancho) el aparato va de borde a borde**, sin
  margen lateral (`@media (max-width: 500px)` al final de `styles.css`), con
  menos relleno en el marco y el bisel y un poco más de alto de pantalla
  (`clamp(290px, 46vh, 460px)`). En 390px la LCD pasó de 299x354 a 354x388 y el
  canvas de los minijuegos de 279 a 334 de ancho. Nada más hay que tocar: la
  pieza, los muebles y los minijuegos leen el tamaño real (`floorWidth()`,
  `fitGameCanvas()`). Medido en 360x640, 375x667, 390x844 y 414x896: sin
  scroll en ninguno. En escritorio sigue el aparato de 420px centrado.
- **Y de arriba a abajo también**: en el teléfono el aparato llena el alto de
  la ventana y lo que sobra se lo lleva la pantalla (`#stage` deja el
  `margin:auto` y cada nivel —`.layout-row`, `.device`, `.screen-bezel`,
  `.screen`— pasa el alto con `flex:1`; adentro, la pieza ya era `flex:1`).
  Antes quedaba centrado con ~125px vacíos abajo en 390x844 y la LCD medía
  388 de alto; ahora 550. Se sacó la nota de abajo ("Cuídalo bien. No hay
  servidor..."), que no le servía a nadie. **Ojo con los minijuegos**: como
  la pantalla se estira, cualquier cambio de alto abajo la cambia de tamaño.
  `enterMinigame()` mide el canvas *antes* de que `showGameControls()`
  cambie los botones por los del juego (que son ~15 px más bajos), y el
  canvas quedaba estirado; `showGameControls()` mide cuánto creció la
  pantalla al cambiar los mandos y se lo suma a su `min-height`, así la
  pantalla queda del alto con que se midió (verificado en los 12 juegos:
  canvas 1:1).

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
que pasó con la pestaña cerrada, con tope de 3 días **de juego**
(`CATCHUP_CAP_MS`, o sea 72 minutos reales: pasado eso la mascota queda "en
pausa" hasta que vuelvas; por eso el "muere en ~17 h" de abajo solo vale con
la app abierta).

`catchUp()` simula ese tiempo **de a un tick**, igual que si la app hubiera
estado abierta (y con `maybeAutoSleep()` en cada paso y `simNowMs` como hora
de cada paso, que es la que lee `isNightMode()`). Antes aplicaba todas las
horas de una sola vez y eso cambiaba las reglas: el riesgo para la salud se
medía con las barras ya vaciadas, se quedaba dormida o despierta todo el rato
y la noche se decidía con la hora de ahora. Son a lo sumo 1080 pasos: no se
nota. Al volver a la pestaña (`visibilitychange`) se corre un `tick()` en el
acto, porque en el teléfono el intervalo se congela en segundo plano.

### Bitácora

`state.log` guarda (hasta `LOG_MAX`) lo que pasó **solo**: caca, enfermarse,
los seguros que dispararon, un regalo, nacer y crecer, y cuando una barra
cruza hacia abajo su umbral (hambre/felicidad/higiene bajo `HEALTH_RISK_AT`,
energía bajo `SLEEPY_THRESHOLD`, salud bajo `SICK_LOW_HEALTH_AT` y bajo 25).
Lo que hace quien juega no se anota: ya lo vio. Lo detecta `logChanges()`
comparando antes y después de cada paso de `catchUp()`.

Si la app estuvo cerrada `AWAY_MIN_MS` (2 min) o más y pasó algo,
`logAway()` cierra el grupo con un encabezado ("Mientras no estabas · 8 h")
y una sola línea con cuánto durmió (de noche se duerme y despierta muchas
veces, anotarlas todas llenaba la lista), y el ícono 📜 pegado al borde
izquierdo de la pantalla (`#logBtn`, dentro del piso para que se esconda
solo en los minijuegos) **pestañea unos segundos y nada más**: a propósito
no abre nada ni obliga a leer. Tocarlo abre `#logPanel`, lo más nuevo
arriba; se cierra tocando afuera.

Los ritmos de decaimiento (`DECAY_PER_HOUR`, `HEALTH_DECAY_PER_HOUR`,
`POOP_CHANCE_PER_HOUR`, `SICK_CHANCE_PER_HOUR*`) se calibraron primero todos
juntos, con el mismo factor (~3.54x), para que una mascota totalmente
descuidada muriera en una mediana de ~12 horas reales. Después, **a propósito
y por pedido**, se rompió esa proporción en dos lugares:
- hambre, felicidad e higiene bajan **al doble** de rápido (hay que atenderla
  más seguido): 100/424.5, 100/530.5 y 100/212 h de juego (el hambre después
  pasó a depender de la etapa, ver "Hambre por etapa" más abajo);
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
de felicidad, y la mitad de las veces (`GIFT_WHEEL_TICKET_CHANCE`) además un
**ticket de ruleta** 🎫 (ver "Ruleta y gacha"): con un regalo cada ~12 h,
un ticket cada ~24 h. Hoy no da monedas, pero no es una regla: si se quiere,
es sumarlas en `collectGift()`.

**Modo nocturno** (`isNightMode()`, 00:00 a 06:00 **hora real** del
dispositivo — es de noche para quien juega, no para la mascota): todo decae a
la mitad de velocidad (`NIGHT_DECAY_FACTOR`, aplicado junto a `sleepFactor` en
`applyDecay()` — solo frena el decaimiento, no la recuperación) y
`maybeAutoSleep()` cambia a un sube-y-baja de sueño propio en vez del gatillo
por energía baja: `NIGHT_SLEEP_ENTER_CHANCE`/`NIGHT_SLEEP_EXIT_CHANCE` por
tick, en proporción 3:1, dan una fracción de tiempo dormida en el largo plazo
de `enter/(enter+exit) = 75%`. Con la app cerrada también: `catchUp()` usa la
hora de cada paso (ver arriba).

El modo nocturno **se ve**: `render()` le pone `.night` a `#screen` (el fondo
de la LCD se oscurece —solo el fondo, la mascota no— y salen estrellas que
titilan en `.night-sky`) y cambia el ícono `#dayNight` de la barra de arriba
entre ☀️ y 🌙. Tocar el ícono hace que la mascota explique qué cambia de noche.
Antes el modo existía pero no había ninguna señal de que estaba activo. En el
panel de prueba, "Día/noche" gira entre hora real → noche forzada → día
forzado (`debugForcedNight`, que lee `isNightMode()`): cambia también la
simulación, no solo cómo se ve.

**Sueño y energía.** Umbrales de abajo hacia arriba (todos en `app.js`, junto a
`ENERGY_LOCK_AT`):
- **< `ENERGY_LOCK_AT` (7): candado.** Se duerme en el acto aunque esté
  despierta (`collapseIfDrained()`, también al terminar un minijuego que la
  dejó sin energía) y nada la despierta, ni de noche. De 0 a 7 recupera en
  ~4 min reales.
- **< `EXHAUSTED_AT` (15): agotada.** Se la puede despertar (`tryWake()` avisa
  que está agotada), pero **despierta** pierde salud a `EXHAUSTED_HEALTH_MULT`
  (x3) el ritmo de una causa normal (~17 de salud por hora real) y se la ve
  triste (`isExhausted()` → ánimo `sad`; tampoco va a los muebles). Dormida
  no cuesta nada: se está recuperando. Por eso la energía ya **no** entra en
  la regla general de `HEALTH_RISK_AT` (antes, energía bajo 30 costaba salud
  aunque estuviera durmiendo).
- **< `SLEEPY_THRESHOLD` (20): se puede dormir sola**, con más probabilidad
  mientras menos energía le quede. Después de despertarla a mano hay
  `WAKE_GRACE_MS` (90 s) en que no se vuelve a dormir sola (si no, se la
  despertaba para jugar y se dormía en el menú).
- **`WAKE_AT` (90): se despierta sola.**
- Para lanzar un minijuego hace falta `GAME_MIN_ENERGY` (10).

Durmiendo recupera `ENERGY_RECOVER_PER_HOUR` = 100/45 por hora de juego: la
barra entera en **45 minutos reales**, y con cama (`FURNI_BED_ENERGY_MULT`,
x1.5) en 30. Se fue acelerando por pedido: 100/212 (~3.5 h), 100/106
(~1 h 45 min), 100/60 (1 h) y ahora esto.

Mientras duerme, el reloj de energía **se ve cargando**: `render()` le pone
`.charging` a su `.stat` (un destello, `.stat-spark`, que da vueltas por el
anillo, el anillo que brilla y el ⚡ latiendo). Hacía falta porque sube
~0.15 por tick y el largo del arco solo no se ve moverse.

Antes el candado era 25 y el sueño empezaba en 35: pasaba mucho rato dormida
sin que se pudiera hacer nada. Ahora el candado es corto y la franja de 7 a 15
es una decisión de quien juega: despertarla cuesta salud. El reloj de energía
se marca como bajo con estos umbrales (bajo 20), y el LED los usa también.
El tiempo hasta la muerte por descuido (arriba) no cambia: la energía despierta
baja tan lento (~56 h la barra) que en esa simulación nunca llega a 20.

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
- **Hambre por etapa** (`HUNGER_CAP`, `HUNGER_PER_REAL_HOUR`, junto a
  `STAGE_CSS_PX`): la panza crece y come más. Niño 70 / adolescente 110 /
  adulto 180 puntos de panza, que bajan 9.33 / 17.1 / 33.6 puntos por hora
  real. **Mientras más grande, menos aguanta**: de lleno a vacío dura 7 h de
  niño, 6 h de adolescente y 5 h de adulto (pedido así; con la primera
  versión el adolescente era el que más aguantaba). El ritmo sale de
  `0.933 * panza / horas`: bajo `DISTRESS_AT` (20%) baja x1.5. **`state.hunger` se sigue guardando en %**: anillos, umbrales,
  avisos y saves no cambian; lo que cambia por etapa es cuánto % llena una
  comida (`hungerFillPct()`: sus puntos sobre la panza; la comida rica, +30,
  llena 43% a un niño y 17% a un adulto) y cuánto % baja por hora
  (`hungerDecayPerHour()`, que lee `decayRate()`). El huevo cuenta como niño
  y al crecer se mantiene el % (crecer no le da hambre de golpe). El
  Banquete lleva `fill:true` y llena entero en cualquier etapa (con
  `restore:100` solo, a un adulto lo dejaba a la mitad). La tienda dice
  cuánto llena cada comida en la etapa de ahora (`foodDesc()`).
  **Por qué:** el gasto en comida tiene que crecer junto con lo que se gana
  (más juegos comprados, más niveles y, sobre todo, más desafíos diarios).
  Antes costaba igual en todas las etapas: el primer día se llevaba ~59% de
  lo que ganaba alguien que juega 10 partidas al día, y de adulto ~25%. Con
  esto, medido con una simulación de la economía (partidas de mérito 40,
  desafíos diarios, ruleta, regalos, comprando juegos apenas sobra un día de
  comida, comiendo bocadillos): ~35 monedas al día de niño, ~79 de
  adolescente y ~172 de adulto, o sea ~33% de lo que gana alguien que juega
  10 partidas al día de niño, ~40-60% de adolescente y ~60-75% de adulto;
  ~40% de adulto para uno de 15 partidas al día. Uno de 6 partidas al día
  **no alcanza** a mantener al adulto (gana ~85-117 y la comida cuesta
  172): es la versión exigente, elegida a propósito. Medido contra
  `applyDecay()` real: de lleno a vacío 7.0 / 6.0 / 5.0 h; la muerte por
  descuido total casi no cambia (mediana 17.6 / 17.4 / 16.8 h), porque la
  manda la salud, que no depende de la etapa. Las
  demás barras todavía no cambian por etapa.
- **Ánimos** (`ALL_MOODS`): `normal, happy, sad, sick, sleepy, dead`.

`careGood` / `careBad` se siguen acumulando pero **hoy no los lee nadie**: eran
lo que elegía la rama adulta. Se dejan porque van en el save y son el enganche
obvio si vuelve a haber ramas o un final según el cuidado.

### Dinero y tienda

`state.coins` sale sobre todo de jugar, y también de la ruleta (ver "Ruleta y
gacha"). **No es una regla que las monedas salgan solo de los juegos**: se
pueden dar en otros lados si conviene; lo que hay que cuidar es que jugar
bien siga siendo la fuente principal. Cada juego le pasa a `finishMinigame()`
un **mérito**: su puntaje llevado a una escala común (~45 = partida muy buena),
porque los puntajes no se pueden comparar entre sí (9 en baloncesto contra
~500 en salto al cielo). De ese mérito salen las dos recompensas, con reglas
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
infinito ni gratis. Las comidas de hambre llevan **descuento por tamaño**:
bocadillo +15 a 5, rica +30 a 9 y especial +50 a 14 (0.33 / 0.30 / 0.28
monedas por punto). Como la barra no pasa del 100% y lo que sobra se
pierde, la grande conviene solo con harta hambre: es una decisión. Antes era
al revés (12 y 25: se pagaba la comodidad). Ojo: el costo por etapa de
"Hambre por etapa" está medido con bocadillos; quien compre especiales gasta
~15% menos. `btnFeed()` cae solo al bocadillo si lo elegido se acabó,
y si el bocadillo también está en 0 avisa que hay que pasar por la tienda en
vez de alimentar de la nada.

El modelo viejo era `unlockedFoods` (desbloqueo permanente), pero nada en el
código lo llenaba nunca: las comidas 2 y 3 eran inalcanzables. `loadState()`
borra ese campo al migrar.

Toda comida sube energía al comerla, no solo hambre: `food.energy` es opcional
en `FOODS` y si falta usa el bonus plano de siempre (`FOOD_ENERGY_DEFAULT = 4`).
La Red Bull lo pisa — poca hambre (`restore: 2`), mucha energía
(`energy: 20`) — al revés que el resto, que dan poca energía y mucha hambre.
Además: el **Banquete** 🍱 (`restore: 100`) llena el hambre entera, cueste lo
que cueste la barra (55, más que dos especiales: es la forma cómoda, no la
barata), y dos de **solo energía** (`restore: 0`): Café ☕ (+15) y Jugo
energético 🧃 (+35). Ninguna llega a lo que da una siesta. Con siete comidas
más la medicina, la bandeja de Comer va en dos filas de cuatro (sigue sin
cambiar el alto del aparato).

**Medicina:** ya no es un botón propio, gratis e infinito. Es una porción más
de la despensa (`MEDICINE`, `state.pantry.medicina`): se compra en la tienda,
pestaña Comida (`price: 15`), y se da desde
la bandeja de **Comer**, en la misma fila que las comidas (`giveMedicine()`). Se arranca con `MED_START_STOCK = 2`, y los
saves de antes también reciben esas 2, para que la primera enfermedad no pille
sin monedas. Para que la enfermedad se siga notando sin un botón propio, el botón
**Comer** lleva un 💊 rojo que late mientras está enferma (`updateDock()`).

**Salud que se recupera sola: 15 al día** (`HEALTH_RECOVER_PER_DAY`,
solo sin ninguna causa activa). Antes era ~25 por hora real y cualquier
susto se borraba en un rato; ahora lo que se pierde cuesta recuperarlo, y
la medicina y la vacuna pesan.

**Vacunas** (`VACCINES`, una por etapa: niño 20, adolescente 50, adulto
100 💰): sin la vacuna de su etapa la salud pierde
`VACCINE_HEALTH_LOSS_PER_DAY` (20) por día real, **siempre** (aparte de las
causas, sin frenarse de noche). Como sola recupera 15, una mascota bien
cuidada y sin vacuna queda en **−5 al día**: baja muy despacio, pero nunca
se recupera (pedido así: que la diferencia sea −5). Vacunada deja de
perder esos 20 y se enferma la mitad (`VACCINE_SICK_MULT`), hasta que crece
y le toca la de la etapa nueva (`state.vaccinated` = `{child, teen,
adult}`). La primera versión bajaba un **tope** de la salud
(`state.healthMax`, con un tramo gris en el anillo) en vez de la salud:
con la recuperación de 25 por hora, una bajada lenta de la salud misma se
tapaba sola. Con 15 al día ya no hace falta y se sacó (`loadState()` borra
`healthMax`). Muerte por descuido total (simulada contra `applyDecay()`
real, 200 corridas): mediana **19.3 h** vacunada y **15.6 h** sin vacuna.
**No es comida**: se compra en la tienda, pestaña Mejoras
(arriba de todo, solo la de su etapa), y se pone **al comprarla**
(`applyVaccine()`, que la deja puesta en el acto por si se cierra la app a
mitad), con su animación (`vaccinateFx()`): la tienda se cierra, una
jeringa de pixel art baja volando junto a la mascota, se echa para atrás,
la pincha y empuja el émbolo mientras le saltan crucecitas verdes; después
un estallido y la jeringa se va hacia arriba y se deshace. Recién ahí sale
el pop-up de la compra. Mientras, la mascota está quieta en una rutina
`kind:'vaccine'` (no se corta por estar triste o enferma); dormida no se
despierta. Primero estaba en la bandeja de Comer, como la medicina: se
compraba, quedaba guardada y había que ir a ponerla; `loadState()` pone la
de su etapa si había una guardada y devuelve en monedas las que ya no
sirven. La píldora de Tienda lleva un 💉 mientras le falte
(`vaccineDue()`; rojo bajo `SICK_LOW_HEALTH_AT`) y entonces abre directo en
Mejoras, y la bitácora anota cuando le toca una nueva.

**Los avisos de la tienda van dentro de la tarjeta, no con `say()`**: la burbuja
tiene `z-index:5` y el overlay `10`, así que un `say()` con un overlay abierto
queda tapado. Lo mismo vale para cualquier menú nuevo.

#### Mejoras

Segunda pestaña de la tienda (`shopTab`, "Comida"/"Mejoras"/"Estilo"/"Gacha" —
un tab en vez de apilar varias `.menu-list`, porque la de comida ya usa todo
el alto disponible y esto va a seguir creciendo). Arriba de todo va la próxima
**habitación** que se puede comprar (`roomUpgradeRow()`, ver "Habitaciones").
Catálogo en `UPGRADES`, con dos formas:

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
y ahí tocar algo lo pone o lo saca. En Personalizar el overlay va con
`.clear` (sin desenfoque) y la hoja mide siempre el 80% del aparato
(`.sheet-tall`, la lista se estira): arriba se sigue viendo la carcasa y la
pantalla con el cambio puesto. Antes se topaba al 66% con la lista a su alto
natural y quedaba en una franja chica. La tienda **no**: sus cuatro pestañas usan la misma hoja a todo el alto
(`.sheet-full`, la lista se estira y se lleva el scroll), así no salta al
cambiar de pestaña. Antes la pestaña Estilo también iba con `.clear` y topada
al 66%, y su lista quedaba en la mitad de alto que las otras (188 px contra
369 en un teléfono de 390; 109 en uno chico).
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

#### Ruleta y gacha (`premios.js`)

La ruleta **da y quita monedas**: trozos de +1, +2, +3, +5, +7, +10, +15,
+25, +50 y +100 (mientras más grande, más raro: +100 sale el 1.8% de las
veces) y trozos que quitan -2, -5 y -10 (nunca más de 10, y nunca bajo
cero: `giveCoins()` quita solo lo que haya). Con los pesos de hoy (suman
113, 21 trozos) se ganan monedas el 55% de las veces, se pierden el 11%, y
en promedio un giro deja ~+5.7, algo menos que una partida buena (~7): es
un extra, no un reemplazo de jugar. Ningún trozo pesa menos de 2 (6.4°) y
los emojis van solo en trozos de 3 o más; van intercalados para que los
que quitan no queden juntos ni dos angostos seguidos. El gacha no da
monedas (se paga con ellas).

**Cómo se dibuja** (`wheelHtml()`): un aro dorado fijo con 20 ampolletas
que pestañean (`wheelRimSvg()`, más rápido mientras gira), adentro la
rueda en **SVG** (`wheelSvg()`, viewBox 200x200: nítida a cualquier
tamaño) que gira entera, un botón dorado al centro y una lengüeta roja
arriba (`#wheelPointer`). Los trozos son arcos con línea blanca entre ellos
y un clavito en cada borde. El número de las monedas va a lo largo del
radio y los emojis paraditos hacia afuera, **con el tamaño que deja el
ancho de su trozo** (la primera versión, con `conic-gradient` y etiquetas
HTML a tamaño fijo, se veía chica y desordenada: los emojis se salían de
los trozos angostos). Los números se orientan según el ángulo en que quedó
la rueda (`wheelSvg(winId, rot)`): los de la mitad izquierda van del borde
al centro, así ninguno queda de cabeza; al detenerse la hoja se vuelve a
armar con el ángulo final y el trozo ganador pestañea (`.wheel-win`). La
rueda mide `min(290px, 100% - 40px, 40vh)`: en 360x640 baja a 256 y la
hoja entra sin scroll.

- **Ruleta** (`openWheel()`, se entra desde la fila 🎡 de arriba del menú de
  Juegos, `wheelEntryHtml()`, que se pone amarilla con el giro gratis; el
  botón de la hoja vuelve a Juegos): un giro gratis cada
  `WHEEL_CYCLE_MS` (12 h **reales**, `state.wheel.last`; un reloj que vuelve
  atrás deja girar, igual que el desafío diario). Premios en `WHEEL_PRIZES` (21
  trozos): monedas (y monedas que se pierden), comida, medicina, +15 de
  felicidad o fichas para el gacha. Cada trozo de la
  rueda mide **lo que pesa su probabilidad** (`w`): lo que se ve es lo que
  hay. El premio se sortea, se aplica y se guarda al tocar Girar, no al
  terminar la animación (cerrar la hoja a mitad no lo pierde); la rueda gira
  hasta dejar el trozo bajo la lengüeta y guarda su ángulo
  (`state.wheel.angle`) para que el próximo giro arranque de ahí. El giro
  lo anima `wheelSpinLoop()` con `requestAnimationFrame` (no una transición
  CSS): sabe en cada cuadro qué trozo está bajo la lengüeta, y **cada clavo
  que pasa suena y hace saltar la lengüeta** (antes el tic-tic iba a ritmo
  fijo, sin relación con la rueda; a toda velocidad se salta tics, uno cada
  45 ms como mucho). `wheelEase()` arranca suave (lo que dura el tirón de la
  mascota) y frena largo, en `WHEEL_SPIN_MS` (4.8 s) después de
  `WHEEL_PULL_MS` (0.6 s). Si se cierra la hoja a mitad, sigue contando sin
  dibujar ni sonar y al terminar sale igual el pop-up del premio, pero la
  ruleta no se vuelve a abrir sola (`wheelVisible()`).
  **Tickets de ruleta** 🎫 (`state.wheelTickets`, salen en los regalos):
  cada uno es un giro extra que **no toca el reloj del gratis**, van aparte
  (`spinWheel(true)` gasta el ticket y no escribe `state.wheel.last`). Con
  el gratis disponible, ese es el botón principal y "Usar ticket" queda de
  secundario, para no gastar un ticket sin querer; sin gratis, el ticket
  pasa a ser el principal. `wheelSpinning` impide girar de nuevo (con
  cualquiera de los dos botones) mientras la rueda gira. El giro gratis se
  avisa con un globito 🎡 en el botón Jugar (`updateDock()`), solo por el
  gratis: con un ticket guardado estaría siempre. **La mascota gira la
  ruleta**: está parada a la derecha, encima del borde de abajo y mirando a
  la rueda (`#wheelPet`, un actor de juego con su especie que no toca su
  animación en la pieza, dado vuelta con un `scale(-1, 1)` entero). Al
  girar (`wheelPetPose()`): se echa para atrás, salta hasta el aro, lo
  agarra arriba y **tira hacia abajo** con su peso —la rueda arranca justo
  ahí—, cae y trastabilla; mientras gira salta de los nervios **al ritmo de
  la rueda** (`wheelSpeedNow()`) y cuando va frenando se queda quieta y se
  acerca a mirar. Con el premio celebra, con uno mayor salta de alegría, y
  si perdió monedas se pone triste. Para agarrar y tirar se deja quieto el
  cuadro `pet_1` (la mano arriba, `gaPin()`): la animación `pet` entera
  saca corazones, que no tienen nada que ver con hacer fuerza. La primera
  versión solo se corría unos píxeles y saltaba al lado: no se entendía que
  la estaba girando. Canvas en píxeles físicos, escala entera en píxeles
  físicos (objetivo 2.3 px CSS) y calzado con `snapPixelIcons()`. El panel de
  prueba tiene "+1 ticket de ruleta" y "Ruleta gratis ya". La cuenta
  regresiva se refresca sola (`[data-wheel-clock]`, mismo esquema que los
  relojes del desafío diario).
- **Gacha** (pestaña "Gacha" de la tienda): una cápsula = un objeto de
  `GACHA_ITEMS`, un catálogo **exclusivo** (no se vende en la tienda:
  `styleRows('shop')` salta los `gacha`) de accesorios, adornos, carcasas y
  pantallas, con rareza (`GACHA_RARITIES`: común 60%, raro 28%, épico 10%,
  legendario 2%; las probabilidades están escritas en la máquina). Cuesta
  `GACHA_PRICE` (40) o una ficha de la ruleta (`state.gachaTickets`).
  **Nunca repite**: si ya tienes todo lo de la rareza que salió, busca en
  las más comunes y después en las más raras; con la colección completa da
  un Banquete de consuelo. Lo que sale queda puesto de una (como lo que se
  compra) y en Personalizar lleva su rareza. Ids con prefijo `g_` y
  `price: null` (con `price: 0`, `freshStyle()` lo regalaría de fábrica).

#### Habitaciones

La primera viene con la mascota; las otras se compran en Mejoras
(`ROOM_PRICES`: 150, 250, 400) hasta `ROOM_MAX` (4). Cada una tiene **sus
propios muebles y adornos**: `state.style.rooms = [{furniture, deco}]` y
`state.style.room` = la que se está viendo; todo lo que antes leía
`state.style.furniture`/`state.style.deco` ahora pasa por `curRoom()`.
Carcasa, pantalla y accesorio no son de la pieza: siguen en `state.style`.
`loadState()` mete los muebles y adornos de un save viejo en la primera.

- Un mueble o adorno está en **una** habitación a la vez (`roomOf()`): en
  Personalizar sale "En hab. N" y tocarlo lo trae a la que se está viendo.
- Con más de una aparecen flechas `‹ ›` pegadas a los bordes de la pantalla
  (`.room-arrow`) y puntitos arriba (`#roomDots`); dan la vuelta.
  `goRoom()` corta lo que estén haciendo, vuelve a armar la pieza (los
  muebles entran deslizándose desde el lado por el que se llega) y los
  personajes **entran caminando por ese costado** (`roomEnter()`, una rutina
  `kind:'enter'` de un solo `go` que arranca fuera de la pantalla; triste o
  enferma igual termina de entrar). Dormida no camina: aparece acostada, y
  si en la nueva hay cama se va a ella sola.
- La cama acelera el sueño esté en la habitación que esté (es su casa).
- `endFurniActivity()` deja al personaje dentro del piso (`clampX`): si algo
  corta la entrada a mitad, no queda afuera de la pantalla.

#### Muebles

Cuarta clase de cosas en Estilo (`kind:'furni'`, sección "Muebles", la primera):
36 muebles que los personajes **usan**. Todo vive en `muebles.js`: el catálogo
(`FURNI_ITEMS`, que se suma a `STYLE_ITEMS` con `kind:'furni'`), el arte y los
guiones (`FURNI_ART`) y el motor que los corre. Los 14 primeros: cama, plato,
bañera, tocador, trampolín, pelota, columpio, tobogán, radiocasete, tele,
piano, tarima, librero y cajas; los 20 que se sumaron después: pecera, maceta,
rueda (de hámster), balancín, cohete, arenero, piscina, hamaca, telescopio,
reloj cucú, caballito, batería, caballete, cocinita, cofre, muro de escalada,
ventilador, bola disco (prendida llena la pieza de luces: `.creature-floor.party`),
puf y piñata; y dos pelotas más, el balón y la pelota de playa (ver "Pelotas"). Se ponen hasta `FURNI_MAX` (3) a la vez **por habitación**, **en cualquier
parte del piso**: `curRoom().furniture = [{id, x}]`, con `x` = centro del
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
mueble tiene `parts` que van como canvas separados: `z:'front'` es el borde de la
bañera y de la piscina, que va **detrás** de la mascota como todo el resto y
solo pasa adelante (a `#furniFront`) mientras alguien está adentro usándolo
(`furniOccupied()`: actividad en ese mueble, dentro de su ancho y sobre el
piso, porque todos los guiones dejan al personaje adentro un poco en alto);
así parece metida en el agua, pero al pasar caminando por delante no la
tapa. Antes iba siempre adelante. `show` las muestra solo con una bandera de su
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
Los tramos del columpio duran un múltiplo exacto de su período, así el asiento
termina derecho.

**Pelotas.** Tres (`pelota` 9x9, `balon` 10x10, `playa` 12x12) con distinto
dibujo y tamaño pero los **mismos guiones**: `BALL_VISITS` (16 formas de jugar
solo: patadas largas con botes, dribleo, equilibrio encima, cabecitas,
lanzarla y atraparla, golazo, contra la pared, se le escapa, sentada
rebotando, pataditas, cabezazo, empujarla con la nariz, bolos, siesta
abrazada, bailar con ella y llevarla en la cabeza) y `BALL_DUOS` (9 de a
dos: pases, cabezazos, penales con arquero, lanzársela con las manos, quítasela
—uno se la lleva y el otro lo persigue—, rodarla despacito, saltar la pelota
—uno la tira contra la pared y el otro la salta a la ida y a la vuelta, con el
salto calculado por distancia—, partidito y circo —uno hace equilibrio encima
y el otro la empuja—). Cada pelota es `ballArt(w, draw)`.
Los guiones se escriben con `ballKit(f)`, que mide la pelota (diámetro en px
CSS) y al personaje (cabeza, manos), así valen para cualquier tamaño de
pelota y de personaje. La pelota se mueve de verdad (física en `muebles.js`,
junto a `ballNow()`):
- `ballTo(rt, {x | dx, y, h, bounces, ms, ease})`: rodar (`ease:'out'`,
  frena) o volar en arco, con botes que llegan cada uno al
  `BALL_BOUNCE_KEEP` (42%) del anterior y duran según la raíz del alto, como
  una caída de verdad. El arco se topa al alto del piso (`floorHeight()`):
  en un teléfono chico no se sale por arriba.
- `ballFollow(rt, act, dx, dy)` / `ballRelease(rt)`: llevarla pegada a un
  personaje (cabeza, manos, a los pies empujándola); al soltarla en alto se
  cae botando. Nunca sale del piso.
- En los guiones: pasos con `ball:` (lanzarla), `follow: [dx, dy]`,
  `release`, `kick` (con `h`/`bounces` opcionales) y `dir: 'ball'`.
- Gira según cuánto rodó. **No vuelve a su lugar**: queda donde terminó el
  juego, como una pelota de verdad. Si se corta un juego con la pelota en
  alto, `resetFurniRt()` la deja caer.
- El dibujo del balón va píxel a píxel (un mapa de 10x10) y los parches en
  gris carbón, no del color del contorno: generado con discos, o con parches
  del color del borde, se leía como una calavera.

Efectos en las barras, chicos a propósito: dormir con cama puesta recupera
energía `FURNI_BED_ENERGY_MULT` (x1.5) más rápido (se mira el save, así vale
también en `catchUp()`), y cada visita espontánea da `FURNI_JOY` (+1) de
felicidad con tope `FURNI_JOY_PER_HOUR` (6) por hora real (`state.furniJoy`):
dejarla sola con muebles no puede reemplazar cuidarla.

**Tocar un mueble** (fuera de los menús y del modo acomodar) manda a la
mascota a usarlo en el momento (`commandFurniVisit()`): una visita con los
mismos guiones de siempre, cortando lo que estuviera haciendo. Si el
acompañante ya estaba jugando en ese mueble (o está libre, la mitad de las
veces) lo usan de a dos. Si está dormida, triste o enferma no va y lo dice
(`furniCommandBlocked()`). Las capas de muebles siguen con
`pointer-events:none` (si no taparían a la mascota y la caca): el toque se
mira a mano en un listener **de captura** sobre `#creatureFloor`, que corre
antes que el de la mascota. Un toque sobre el cuerpo de un personaje
(`spriteHit()`, con la caja del frame que guarda `render()` en `walker.drawn` /
`renderBuddy()` en `buddy.drawn`) sigue siendo un mimo; solo si cae en un
píxel pintado de un mueble (`partHit()`, leyendo el canvas de la pieza, con
`FURNI_TAP_SLOP` px de tolerancia para que el pie de la bola disco o la cuerda
de la piñata se puedan tocar con el dedo) se lo come el mueble. El destello
(`.furni-part.poked`) va en `filter` y no en `transform`, que lo escribe
`updateFurniture()` cada cuadro.

**Probado** corriendo en Chromium cada guion de cada mueble por índice (visitas
con la mascota y con el acompañante, duos y rutinas; con las pelotas son
175): 0 errores,
0 que se queden trabados esperando en un `sync`, todos terminan con los dos
en el piso y la pelota siempre queda quieta, en el piso y dentro de la pieza. Al sumar o cambiar un guion, conviene repetir eso.

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


#### Objetos mágicos (`objetos.js`)

Veinte objetos (`MAGIC_ITEMS`) que se compran, se ponen y se acomodan como
cualquier mueble (`kind:'furni'`, mismo `FURNI_MAX`, mismos guiones `visits`
y `duos`, mismo motor), pero que hacen cosas que un mueble no hacía. Van
marcados `wow:true` y salen en su propia sección de Estilo, "Objetos
mágicos ✨", la primera (`STYLE_SECTIONS`; `styleRows()` separa por
`!!it.wow`). Precios de 45 a 130.

**Ganchos nuevos que lee `muebles.js`** (todos opcionales en `FURNI_ART`):
- `tick(rt, now, dt, k)`: vida propia, cada cuadro, aunque nadie lo use
  (desde `updateFurniture()`): el robot pasea, la nube flota, el ventilador
  de la nieve gira.
- `tap(rt)`: tocar el objeto. Si devuelve `true` se hizo cargo y
  `commandFurniVisit()` no hace lo de siempre. Corre **antes** del chequeo de
  bloqueo, así un objeto puede responder aunque la mascota esté ocupada (el
  árbol dice cuánto falta, el robot su batería). Para mandar a la mascota se
  usa `magicGo(rt, pasos)`, que hace los mismos chequeos que tocar un mueble.
- `cleanup(rt, act, a)`: al terminar o cortarse una actividad en el objeto
  (`endFurniActivity()`): apagar el jetpack, el láser, el clon...
- `keep: [...]`: campos de `rt` que sobreviven a `resetFurniRt()` (la fruta
  colgando, dónde quedó el robot, el mono de nieve).
- `thumb: {w, h, draw}`: la miniatura de la tienda, cuando el arte completo
  no sirve (el frijol mide 60 de alto).

**Capas** (en `#creatureFloor`, en este orden): `#ambientLayer` (luz de la
pieza: `setAmbient(id, fondo, rt)`; si el objeto se saca, se apaga sola),
`canvas#fxBack` (partículas detrás de los personajes), `#cloneCanvas` (el
reflejo del espejo), los personajes y `#furniFront`, `canvas#fxFront`
(partículas delante) y `#magicFlash` (destello: fotos, truenos, el cañón).
Los dos canvas de partículas van en **píxeles físicos** y cada partícula es
una figurita de pixel art (`PX_SHAPES`) con pixeles del mismo tamaño que
los de los muebles (`furniDeviceScale()`): nada se ve de otro grano.
`fxSpawn()` (una), `fxBurst()` (una explosión), `fxEffect()` (un dibujo que
dura: el arcoíris, la nieve del piso, las estrellas del planetario).
Posiciones en px CSS del piso con `y` hacia arriba, como `walker.y`.

**Modo piso** (`startFloorMode(id, ms, onTap, onEnd)`): mientras dura, cada
toque en el piso es una orden para el objeto (el láser, el jetpack), no un
mimo ni un mueble. Es un listener de **captura en `window`** que corre antes
que todos los demás y se come el `click` que sigue. Lo mismo, sin modo,
para reventar burbujas (`popBubbleAt()`).

**Cabeza abajo** (`act.flipY`, el cañón): `actorTransform(act, drawn)` en
`app.js` arma el `transform` del canvas de cualquier actor (lo usan
`render()` y `renderBuddy()`) con un `scaleY(-1)` entero, que no rompe la
regla de oro. `endFurniActivity()` lo vuelve a `false` siempre, y el
accesorio se esconde mientras va dado vuelta.

**Lo que guardan** va en `state.objData[id]` (`objData()`), en el save.

Los 20:
- **Puntero láser**: modo piso de 25 s, el punto rojo va donde se toca y
  la mascota lo persigue y se le tira encima. Sola, el punto anda sin rumbo.
- **Jetpack**: vuela con inercia (un resorte hacia donde se toca, 20 s de
  modo piso), con el pack en la espalda echando fuego. Sola hace un ocho. De
  a dos, el otro va sentado en su cabeza.
- **Máquina de burbujas**: burbujas que suben bamboleándose; se revientan
  tocándolas (cada 6, un `furniJoy()`) y la mascota salta a reventarlas.
- **Cámara instantánea**: cuenta 3-2-1, flash, y la foto va a un **álbum**
  (tocar la cámara, `openAlbum()`; hasta `ALBUM_MAX` = 18). Las fotos no
  son capturas: guardan especie, etapa, pose, acompañante y pantalla, y se
  vuelven a dibujar con el sprite a escala entera. Sola, una selfie cada
  `ALBUM_AUTO_GAP_MS` (2 h) como mucho.
- **Bola de cristal**: dice de verdad qué va a pasar
  (`crystalProphecy()`): qué barra se pone en riesgo primero y en cuánto,
  con los ritmos reales; o que está enferma, que hay caca, que le falta la
  vacuna.
- **Robot aspiradora**: pasea solo y una vez cada `ROBOT_CLEAN_EVERY_MS`
  (20 h) va hasta la caca y la aspira (como el botón Limpiar; queda en la
  bitácora). Después se recarga (luz roja). La mascota se le sube encima.
- **Nubecita** (libre): flota por la pieza y cada tanto llueve; si la
  mascota queda debajo se moja (+4 de higiene, una vez por lluvia). Tocarla
  hace un trueno.
- **Árbol frutal**: una fruta cada `FRUIT_EVERY_MS` (6 h, hasta tres
  colgando, también con la app cerrada). Tocarlo con fruta: la sacude y se
  la come, **comida de verdad** (`FRUIT_FOOD`, +15 de hambre) que entra al
  mismo montón de la bandeja (`serveFood()`).
- **Frijol mágico**: crece una etapa por riego, un riego cada
  `BEAN_WATER_EVERY_MS` (20 h), seis etapas. Arriba de todo, tocarlo la
  manda a trepar y encuentra un huevo de oro (`BEAN_REWARD` = 120 monedas,
  pop-up) y la planta vuelve a empezar. Es la meta larga: no regarla no
  castiga, solo no crece.
- **Fuegos artificiales**: prende la mecha, se tapa los oídos y suben
  cohetes que revientan en bola, anillo, corazón o sauce, cada uno con su
  brillo en la luz de la pieza.
- **Prisma**: sale un arcoíris de seis bandas que cruza la pieza; sube por
  él y se tira de guata hasta el otro lado.
- **Planetario**: apaga la luz de la pieza (no la de los personajes) y la
  llena de estrellas que giran, constelaciones y estrellas fugaces; la
  mascota se tira de espaldas a mirar. Tocarlo lo prende o lo apaga.
- **Máquina de nieve**: nieva en toda la pieza, la nieve se junta en el
  piso (`SNOW`, se derrite sola aunque se saque la máquina) y arma un mono
  de nieve que dura `SNOWMAN_MS`. De a dos, guerra de bolas.
- **Lámpara de lava**: siempre prendida, tiñe la pieza del color de su
  ánimo (rosado feliz, ámbar normal, azul triste, verde enferma, violeta con
  sueño); tocarla cambia el modo (también rosa, azul, verde o arcoíris fijos).
- **Portal**: se mete y sale por otro portal que se abre en el aire. Tocado,
  con más de una habitación, viaja a la siguiente (`portalTravel()`).
- **Caja musical**: tocada, suena una melodía de verdad (Web Audio): de
  día "Estrellita", de noche o con sueño la canción de cuna, y al terminar
  la cuna, si tiene algo de sueño, se duerme (`btnSleep()`). Sola baila sin
  sonido.
- **Cañón de circo**: cuenta 3-2-1 y sale volando en un arco enorme, dándose
  vueltas y cabeza abajo (`flipY`), con estela; aterriza mareada.
- **Gelatina gigante**: tiembla con un resorte de verdad (`rt.sq`/`rt.sqv`),
  rebota cada vez más alto y se hunde adentro (la parte `z:'front'` es
  semitransparente: se la ve adentro) hasta que la escupe.
- **Patineta** (libre): cruza la pieza con un kickflip a la ida y otro a la
  vuelta (`skateRide()`); la tabla queda donde se bajó. De a dos, se la
  pasan.
- **Espejo mágico**: el reflejo sale del espejo (`CLONE`, un tercer
  personaje que solo se dibuja, teñido con `filter`) y la imita reflejado y
  con un poco de retraso; al final vuelve a entrar.

Los efectos de verdad son chicos a propósito, igual que los de los muebles:
la fruta es poca comida, el robot limpia una caca al día y el frijol paga
una vez cada ~5 días. La felicidad de jugar con ellos pasa por `furniJoy()`
(`magicJoy()`), con el mismo tope por hora.

**Probado** con un banco acelerado en Chromium (se parcha `performance.now`,
se para el loop y se avanza cuadro a cuadro con `updateWalker()`/
`updateBuddy()`/`render()`): cada guion de cada objeto, solo y de a dos,
y cada `tap`: 0 errores, todos terminan con los personajes en el piso y sin
modo piso ni reflejo colgando. También una visita espontánea a cada uno
(`maybeStartFurniVisit()`). Al sumar o cambiar un guion, repetir eso.


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
récords, desafío diario, mérito. Los dos personajes los maneja **la misma persona**:
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

Seis de uno (en `juegos.js`), todos sobre `#gameCanvas`, que se redimensiona
con `fitGameCanvas()` a su tamaño real en pantalla para que nada salga
estirado. Snake y Tap rítmico (y su variante de prueba) se **sacaron**:
`loadState()` le pasa a Torre y a Salto al cielo lo que se había pagado por
ellos (`REMOVED_GAMES`) y borra sus récords y su xp.

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
- **Torre de cajas** (`tw`): una caja va y viene arriba de la torre y se suelta
  tocando (la pantalla o el botón); lo que queda afuera de la caja de abajo
  se corta y se cae, así la torre se angosta. Soltarla casi justo encima
  (`TW_PERFECT`, 1.3% del ancho) es perfecto: no corta, vale doble y con tres
  seguidos la caja vuelve a ensancharse un poco. Cada caja va más rápido
  (`TW_SPEED`). Se pierde al soltarla del todo afuera. La mascota mira desde
  abajo a la izquierda, fija (no sube con la cámara).
- **Salto al cielo** (`sk`): la mascota rebota sola de nube en nube y se la
  lleva de lado a lado con el deslizador (o arrastrando el dedo sobre el
  juego, o con flechas). Nubes normales, que se mueven y grises que se
  deshacen tras un rebote; estrellas (+5) y a veces un globo que la lanza
  2.6 veces más alto. Nunca están más separadas que el 85% de un salto.
  Termina al caerse por abajo o a los `SK_DURATION` (90) segundos: sin tope
  no terminaba nunca, y con 45 s el que juega bien y el que juega mejor
  sacaban lo mismo (subir más rápido lo limita la física; lo que separa es
  cuánto aguanta sin caerse).

  Los dos separan la lógica (`twNew/twStep/twDrop`, `skNew/skStep`, sin DOM)
  del dibujo, como los de a dos, y su mérito está **calibrado con bots**
  (400 partidas, medianas en el comentario de `twMerit()`/`skMerit()`): bueno
  ~40, experto ~76-80. Todo se mide en fracciones del canvas, así un teléfono
  chico y uno grande juegan igual.
- **Memorice** (`mm`): 10 luces en posiciones al azar; se enciende una secuencia
  y hay que repetirla tocándolas en orden. Suma una luz por ronda y un solo error
  termina la partida. Las posiciones salen de una rejilla 4x3 barajada con la luz
  corrida al azar dentro de su casilla: sortear posiciones libres y descartar las
  que se pisan se amontona, y con diez círculos en un canvas chico hay tiradas
  donde no entra ninguna. La secuencia **crece**, no se sortea de nuevo cada
  ronda: rehacerla entera es más difícil pero se siente arbitrario.

Los seis suman felicidad y disparan `triggerPetAction('celebrate')` si el
puntaje fue positivo.

### Desbloqueo y desafío diario

Los seis juegos del menú viven en `GAMES` (id, nombre, precio y `start`): el
menú de Jugar se arma solo desde ahí. Se desbloquean con monedas tocándolos en
el mismo menú, una vez y para siempre (`state.unlockedGames`). Atrapa
estrellas es gratis (`price: 0`) a propósito: desde el primer minuto hay algo
que jugar y una forma de juntar monedas, sin esperar a la ruleta. `loadState()`
deja desbloqueados en saves viejos los juegos que ya tienen récord. El panel de
prueba se salta el bloqueo. El cansancio (`energy < GAME_MIN_ENERGY`, 10) se revisa al lanzar,
no al abrir el menú, para poder comprar igual.

**Desafío diario (x3)** (`state.mega`; antes se llamaba "Megajuego" o
"MEGA" y en el código sigue con ese nombre: `mega*`, `MEGA_*`; en pantalla
se cambió porque "MEGA" no decía qué era): una partida por juego
desbloqueado cada `MEGA_CYCLE_MS` (**24 h reales**, `Date.now()`; antes 12)
que paga `MEGA_COIN_MULT` (x3)
las monedas — solo monedas, la felicidad no. Jugar el de todos los
desbloqueados da al instante `MEGA_BONUS_PER_GAME` (10) por juego, una vez por
ciclo. El ciclo es uno solo para todos, arranca con el primer desafío jugado
y `megaState()` lo renueva entero al vencer. Se gasta en `finishMinigame()`
(lee `megaRun`), así que una partida cortada por `forceCloseMinigames()` no lo
consume.

El desafío se juega **siempre en el nivel más difícil desbloqueado**
(`maxLevelFor()`), no en el elegido en la ficha: es la partida especial del
ciclo, así que va con todo, y su x3 se multiplica con el `LEVEL_COIN_MULT` de
ese nivel. Lo fija `launchGame()`.

La cuenta regresiva del ciclo se ve en vivo: cualquier elemento con
`data-mega-clock` (`"short"` para HH:MM) o `data-mega-bar` lo refresca
`tickMegaClocks()`, un solo `setInterval` global de 1 s que no hace nada si no
hay relojes a la vista — ninguna hoja tiene que arrancarlo ni pararlo. Aparece
en el banner de la grilla (con barra que se vacía), en la etiqueta de las
tarjetas cuyo desafío ya se jugó y en la ficha ("Desafío de hoy listo ·
vuelve en"). La etiqueta de las tarjetas con desafío pendiente dice
"DESAFÍO x3".

### Niveles

Cada juego del menú tiene niveles 1 a `GAME_MAX_LEVEL` (5). La experiencia
(`state.gameXp[id]`) es el **mérito** de cada partida tal cual, sin multiplicar
por nivel ni por desafío diario. `LEVEL_XP` está en "partidas buenas" acumuladas
(`GOOD_GAME_MERIT = 45`): 10 para el nivel 2, 30 para el 3, 50 para el 4, 150
para el 5. El nivel **no sube solo**: la experiencia desbloquea y se elige en
la ficha del juego entre los desbloqueados (`state.gameLevelPick`), para
que nadie quede atascado en uno que le queda grande. Al desbloquear uno queda
elegido de una. Cada nivel tiene nombre (`LEVEL_NAMES`: Fácil, Normal,
Difícil, Experto, Leyenda).

Más nivel = más difícil, así que paga más: `LEVEL_COIN_MULT` (x1 a x2) multiplica
solo las monedas y se suma al x3 del desafío diario. Sin eso subir sería un castigo.
El récord es por nivel (`recordKey()`; el nivel 1 usa la clave de siempre, así
los récords viejos quedan como de nivel 1).

La dificultad la lee cada juego con `levelT()` (0 en nivel 1, 1 en el máximo)
desde la variable global `playLevel`, que `launch()` fija **antes** de
`start()` (Memorice y la Torre la leen al armar su estado) y
`exitMinigame()`/`forceCloseMinigames()` devuelven a 1 — el panel de prueba
juega siempre en nivel 1. Qué sube en el nivel máximo: Estrellas caen 50% más
rápido, 30% más seguido y con +15 puntos de caca; Baloncesto solo la velocidad
de la pelota (+50%: el azar de rebotes ya es bastante); Reflejos blancos 30%
más cortos y seguidos, +12 puntos de bombas; Torre: la primera caja más
angosta y todo 45% más rápido; Salto al cielo: nubes más separadas, más
chicas y más raras; Memorice arranca con 5 luces y las muestra 30% más
rápido. Números sin calibrar (salvo el nivel 1 de Torre y Cielo), un primer
intento.

### Cómo se arma un minijuego

**Los mandos van abajo, no encima de la pantalla.** `showGameControls(html)`
esconde `.controls` (comer, limpiar, tienda...) y pone en su lugar los botones
del juego; `exitMinigame()` y `forceCloseMinigames()` los sacan. Los usan
estrellas y salto al cielo (deslizador), baloncesto (TIRAR) y torre (Soltar).
Reflejos y memorice **no**: se juegan tocando la pantalla.
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

Cada juego guarda su estado en una variable global (`sg`, `bb`, `rx`, `tw`, `sk`,
`mm`; los de a dos comparten `dg`, ver "Juegos de a dos") y expone un `xxDispose()` que saca listeners y cancela el
`requestAnimationFrame`.
**Al agregar uno nuevo hay que registrar su limpieza en `minigameDisposers`**
(`minigameDisposers.push(() => { xxDispose(); xx = null; })`, justo debajo de
su `xxDispose()`): es lo que corre `forceCloseMinigames()` si la mascota se
muere a mitad de partida, y ya no conoce a ningún juego por nombre.

**Sonido:** `tone()`/`beep()` (Web Audio, sin archivos; `AudioContext` creado
recién al primer sonido y blindado con try/catch para no congelar un loop),
`SFX_SCALE` (Si menor natural desde el 7º grado, 440-988 Hz: abajo de ~400 Hz
un celular casi no suena) y `sfxFail()` (el tritono Fa-Si: no se confunde con
un acierto). Venían del Tap rítmico y los siguen usando los juegos de a dos.

Los récords viven en `state.records[id]`, o sea dentro del save (`loadState()` los
rellena vacíos para saves viejos).

### Menú de Jugar: grilla, ficha y resultado

Tres hojas, como la tienda de una app:

1. **Grilla** (`openGamesMenu()`): tarjetas de 2 columnas con el color propio
   de cada juego (`--g1`/`--g2` por `data-g` en el CSS — al sumar un juego hay
   que darle su par), puntitos de nivel (`levelDots()`), récord del nivel
   elegido y la etiqueta "DESAFÍO x3" si le queda. Arriba, `megaBanner()` con un punto
   por juego desbloqueado. Los bloqueados se compran tocándolos y, al
   comprarlos, abren su ficha.
2. **Ficha** (`openGameDetail(id)`): los cinco niveles a la vista (antes era
   un botón chico que giraba 1→2→3→1 sin mostrar a dónde iba). Tocar uno
   desbloqueado lo elige; uno bloqueado dice cuánta xp le falta. Debajo, récord
   del nivel, multiplicador de monedas y barra de xp (`levelProgress()`). Si
   queda desafío, "Desafío diario (x3) · <nivel máx.>" va como botón principal y
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

**Pasar el tiempo (TEMPORAL, sacar cuando se termine de calibrar)**: +15 min,
+1 h, +3 h, +8 h y +1 día (`debugSkipTime()`). Simula ese tiempo de a un
tick como `catchUp()`, pero **sin su tope de 72 minutos**: la app de
teléfono va a llevar el tiempo completo y eso es lo que se quiere probar.
Lleva un reloj virtual (`debugClockOffsetMs`, que suma `isNightMode()` y
también `catchUp()`), así la noche cae en la hora simulada aunque se
adelante varias veces; arriba de los botones se ve la hora simulada, la
etapa y las cinco barras, y "Hora real" lo vuelve a cero. No se guarda (al
recargar vuelve la hora real) y no mueve los relojes de la ruleta ni del
desafío diario. Se corta si la mascota muere. Con "Stats al máximo" no baja
nada (lo avisa). Al sacarlo: `debugSkipTime()`, `debugTimeInfo()`,
`debugClockOffsetMs` (y su uso en `isNightMode()` y `catchUp()`), los
botones `data-skip`/`dbgClockReset` y `.debug-time` del CSS.

## Convenciones

- Todo el copy en español (Chile).
- Emojis solo de **Unicode 11 o anterior** (2018). 🪙 y 🫧 (Unicode 13 y 14)
  salían como un cuadro vacío en teléfonos con sistema más viejo; se
  cambiaron por 💰 y 🧼. Antes de sumar un emoji nuevo, revisar su versión.
- Los mensajes de commit también en español, explicando el **porqué** del cambio
  y no solo el qué.
- Nada de emojis ni de identificadores de modelo en commits o en el código.
