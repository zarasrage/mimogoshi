# Plan: más de 100 personajes, con stats, rarezas y combate

Documento de planificación. Nada de esto está construido todavía. La idea es
decidir el rumbo antes de escribir código o encargar arte. Cada sección trae
varias opciones, la que recomiendo y por qué. Al final hay una hoja de ruta
por fases y una lista de preguntas que necesito que respondas.

Los números de combate de este documento salen de una simulación de verdad
(`node docs/sim-combate.js`), no de intuición.

---

## 0. Resumen en una página

**Qué recomiendo:**

1. **Cinco stats para todo el juego:** Vitalidad, Fuerza, Defensa, Agilidad
   e Ingenio. Los mismos cinco números sirven para combatir, dan una ayudita
   chica en los minijuegos y definen la personalidad de cuidado. Así cada
   número significa algo en todos lados, en vez de tener tres sistemas
   sueltos.
2. **Cada especie tiene un "perfil"** (cómo reparte sus stats), un
   **elemento** y uno o dos **rasgos con costo y beneficio** (por ejemplo,
   "Glotón: le da hambre 20% más rápido, pero comer lo pone feliz"). Eso es
   lo que hace que cada personaje se sienta distinto, más que los números.
3. **La rareza sube el techo, no gana sola.** Un legendario tiene ~10% más
   stats que un común. En la simulación eso da 82% de victorias entre dos
   mascotas igual de cuidadas, pero un común **entrenado y bien cuidado le
   gana al legendario descuidado el 87% de las veces**. La rareza importa,
   pero cuidar y jugar importa más.
4. **Cada individuo es distinto aunque sea de la misma especie:** genes al
   nacer (±8 por stat), entrenamiento (jugar minijuegos entrena stats) y
   cuidado (el `careGood`/`careBad` que el juego ya acumula y que hoy nadie
   lee).
5. **Club de la pelea como expedición asíncrona:** mandas a tu mascota unas
   horas, pelea sola (combate automático) contra rivales de su liga y vuelve
   con los resultados en la bitácora, una repetición de la mejor pelea y
   premios. Funciona **sin servidor**. Los "amigos" llegan en dos pasos:
   primero con **códigos de amigo** (sin servidor, se pasan por WhatsApp) y
   después, si vale la pena, con un servidor de verdad.
6. **100+ personajes = ~35 diseños × variantes de color.** Hacer 100
   ilustraciones únicas de 28 frames es inviable para una persona. Con
   familias de diseño y variantes de paleta (cambio exacto de colores,
   píxel por píxel, no un tinte encima) se llega a 100+ con un tercio del
   arte. Las variantes raras ("brillantes") son además un gancho de rareza
   gratis.

**Orden sugerido:** primero la base técnica del catálogo (sin eso, 100
especies no caben en el código actual), después stats y la ficha de la
mascota, después el Club contra rivales del juego, después cómo se consiguen
más personajes (huevos), y al final los amigos.

---

## 1. Lo que condiciona todo (el proyecto como está hoy)

Antes de las propuestas, lo que ya existe y no conviene romper:

| Hoy | Qué implica para el plan |
|---|---|
| Cada especie es un PNG de 224×128 (28 frames de 32×32) + un JSON embebido en `app.js`. Hay 5. | El JSON es **idéntico** en todas (misma grilla, mismas animaciones). Con 100, embeber 100 JSON iguales no tiene sentido: hay que pasar a un catálogo con una sola grilla compartida (ver §11). |
| Las hojas actuales tienen entre 13 y 40 colores, 0 semitransparencias, y pesan 2-17 KB. | Las variantes de paleta son viables y baratas. 100 hojas pesarían ~1 MB: hay que cargarlas solo cuando se usan. |
| Se elige especie al crear el huevo, entre todas. | Con 100 y rarezas, elegir libremente cualquiera mata la rareza. El inicio tiene que ofrecer solo unas pocas comunes. |
| Hay **una** mascota principal más un acompañante sin barras (`duo.js`). | Tener muchos personajes pide decidir qué pasa con los que no están en pantalla (§3). |
| Sin backend: todo en `localStorage`. | Todo lo social tiene que funcionar primero sin servidor, o esperar a tenerlo. |
| Los ritmos de las barras están calibrados por simulación (muere descuidada en ~17 h con la app abierta). | Cualquier rasgo que cambie el hambre o la energía obliga a repetir esa simulación por rasgo, no a ojo. |
| Las monedas se ganan **solo jugando**, con el mérito como escala común. | Ni el combate automático ni la rareza deberían fabricar monedas, o se rompe la economía. |
| `careGood`/`careBad` se acumulan pero nadie los lee. Las mejoras "Pase de visita" y "Silbato de regreso" se venden pero no hacen nada. | Son los enganches naturales: el cuidado define stats, y el pase y el silbato pasan a ser "mandar al Club" y "traerla antes". |
| Ya existe un prototipo de combate (`startCombatGame`, leer el ataque y reaccionar). | Sirve como modo interactivo de combate (§7, formato B). |

---

## 2. Cómo llegar a 100 personajes (el arte)

Este es el cuello de botella real. Una especie es una hoja completa con 28
frames y 12 animaciones. Tres caminos:

### Opción A: 100 diseños únicos

- **A favor:** cada personaje es distinto de verdad.
- **En contra:** 100 hojas de 28 frames, con el control de calidad de
  `CLAUDE.md` en cada una (deriva de grilla, colores, semitransparencias). Al
  ritmo actual (5 especies y varias tuvieron que repararse) son meses o
  años. Además, el estilo se dispara si viene de fuentes distintas.

### Opción B: familias + variantes de paleta (recomendada)

- ~30-35 **diseños base** agrupados en **familias** (blob, gato, pollito,
  cuernos...). Cada diseño tiene 2-4 **variantes de color** con nombre propio
  y stats propios: "Blob de agua", "Blob de lava", "Blob de musgo"...
- La variante se genera desde la hoja base **cambiando colores exactos**:
  como el arte tiene 13-40 colores, se define un mapa `color viejo → color
  nuevo` y se aplica píxel por píxel. No es un tinte encima (`CLAUDE.md`
  prohíbe eso con razón, porque ensuciaba la cara): el contorno, los ojos y
  la boca quedan fuera del mapa y salen idénticos.
- Se puede hacer al cargar (en un canvas, una vez, cacheado) o generar los
  PNG con un script y guardarlos. **Recomiendo generarlos con un script**:
  así cada variante pasa el mismo control de calidad que una hoja dibujada y
  se puede retocar a mano si una combinación queda fea.
- **Variante brillante:** cada especie puede tener, con probabilidad baja
  (1/64), una paleta "brillante" al nacer. Rareza gratis y muy coleccionable.
- **Cuenta:** 35 diseños × 3 variantes = 105 especies, más las brillantes.
  Arte nuevo: ~30 hojas en vez de 100.

### Opción C: personajes modulares (cuerpo + cabeza + accesorio)

- Combinar piezas para que salgan miles.
- **En contra:** 28 frames por pieza que tienen que calzar entre sí, y casi
  siempre se ve "armado". No encaja con el estilo de ilustración terminada
  que tiene el juego. No lo recomiendo.

### Recomendación

**B.** Y para que 100 se sientan distintos aunque compartan cuerpo, la
diferencia se carga sobre todo en lo que **no** es arte: perfil de stats,
elemento, rasgos, movimiento especial, y el emoji o partícula de su
elemento en combate.

---

## 3. Cómo se consiguen y qué pasa con los que no están en pantalla

### 3.1 El inicio

- Al crear la partida se elige entre **3-6 comunes** ("iniciales"), no entre
  todas. El selector de 3 columnas que ya existe sirve tal cual.

### 3.2 Formas de conseguir más (se pueden combinar)

| Fuente | Cómo | Rareza típica |
|---|---|---|
| **Huevo de la tienda** | Comprado con monedas. Sale una especie al azar del grupo "común/raro". | Común-raro |
| **Gacha de huevos** | La máquina gacha que ya existe gana una segunda "palanca": huevos. Con probabilidades a la vista, como hoy. | Todas |
| **Crianza** | Una mascota adulta bien cuidada puede tener un huevo (el "Hijo" del acompañante ya existe). El hijo hereda la familia y parte de los genes. Con dos padres de familias distintas se pueden desbloquear especies "mixtas". | Depende de los padres |
| **Club de la pelea / expediciones** | A veces vuelven con un huevo (más raro mientras más alta la liga). | Raro-épico |
| **Eventos** | Especies de temporada (Halloween, Navidad) solo por un tiempo. | Épico-legendario |
| **Ruleta** | Muy de vez en cuando, un "huevo misterioso" como premio mayor. | Común-raro |

### 3.3 ¿Qué pasa con los demás personajes?

Este es el corazón del cambio: hoy es un tamagotchi de **una** mascota. Tres
modelos:

**Modelo 1: una sola mascota a la vez + álbum.** Los demás personajes solo
se "conocen" (en visitas, rivales del club, la gacha) y quedan en un álbum
(Mimodex). Al morir la mascota, la próxima puede ser de cualquier especie
desbloqueada.
- A favor: no cambia el núcleo del juego.
- En contra: coleccionar 100 sin poder tenerlos frustra.

**Modelo 2: varias mascotas, una activa + guardería (recomendado).** Tienes
hasta N personajes (por ejemplo 6, ampliable comprando espacio). Uno es el
**activo** (el de hoy, con barras), otro puede ser el **acompañante** (ya
existe, sin barras) y el resto está en la **guardería**, en pausa: no se
mueren ni bajan sus barras mientras están ahí. Se cambian cuando quieras,
salvo si el activo está enfermo o agotado (para que la guardería no sea una
forma de esquivar el cuidado).
- A favor: coleccionar tiene sentido, el cuidado sigue siendo de uno a la
  vez, y la muerte de una mascota deja de borrar todo el progreso.
- En contra: hay que decidir qué cosas son de la cuenta (monedas, muebles,
  habitaciones, juegos desbloqueados) y cuáles de cada mascota (barras,
  stats, nivel, récords). Mi propuesta: **casa y economía de la cuenta,
  cuerpo y stats de cada mascota**.

**Modelo 3: generaciones.** Una sola mascota viva, pero cada una deja un
hijo que hereda algo (genes, un rasgo). Muy tamagotchi clásico.
- A favor: el ciclo vida-muerte cobra sentido.
- En contra: para coleccionar 100 es muy lento.

**Recomendación:** Modelo 2 como estructura, con la **crianza del Modelo 3
como una de las fuentes** de personajes nuevos. El acompañante deja de ser
"una visita de prueba" y pasa a ser "el segundo de tu equipo que está
contigo en la pieza".

### 3.4 Mimodex (álbum)

Una hoja nueva con las 100+ siluetas: conocidas (vistas en el club o en
visitas) en gris, obtenidas a color, brillantes con brillo. Barra de
progreso por familia y por rareza. Es el motor de "quiero completar la
colección" más barato que hay: no necesita nada nuevo salvo una lista.

---

## 4. El sistema de stats

### Opción A: sin combate, solo "personalidad de cuidado"

Cada especie cambia los ritmos de cuidado: hambre, sueño, cuánto se ensucia,
cuánto la alegra jugar. Nada de ataque ni defensa.
- A favor: cero sistemas nuevos; cambia cómo se juega a diario.
- En contra: sin combate no hay "más poderoso", y el Club de la pelea no
  tiene sobre qué apoyarse.

### Opción B: RPG completo

Ataque, defensa, ataque y defensa especial, velocidad, maná, precisión,
evasión, suerte... con movimientos y tipos.
- A favor: mucha profundidad.
- En contra: en un tamagotchi de teléfono, nueve números que nadie entiende
  son ruido. Y cada stat más multiplica el trabajo de balancear 100
  especies.

### Opción C: cinco stats que sirven en todo (recomendada)

| Stat | En combate | En minijuegos (ayuda chica) | En el cuidado | Se entrena jugando... |
|---|---|---|---|---|
| ❤️ **Vitalidad** | Puntos de vida | Salto al cielo: un rebote de gracia al caerse | Se enferma un poco menos | Salto al cielo |
| 💪 **Fuerza** | Daño del ataque normal | Baloncesto: ventana de tiro un poco más ancha | (nada) | Baloncesto |
| 🛡️ **Defensa** | Resta daño | Torre: tolerancia del "perfecto" un poco mayor | La salud baja un poco más lento | Torre de cajas |
| ⚡ **Agilidad** | Velocidad de turno, esquivar, críticos | Estrellas: canasta un poco más ancha · Reflejos: blancos un poco más largos | (nada) | Estrellas y Reflejos |
| 🧠 **Ingenio** | Maná y ataque especial (atraviesa defensa) | Memorice: la secuencia se muestra un poco más lenta | Aprende más rápido (más xp) | Memorice |

Escala de 1 a ~120. Un común promedio anda en 50 por stat a nivel 30.

- **Por qué cinco:** se pueden mostrar en una ficha como un pentágono
  (gráfico radar), que se entiende de un vistazo y hace que dos especies con
  el mismo total se vean distintas.
- **Por qué atarlos a los minijuegos:** le da a cada juego una razón más
  para jugarlo ("quiero subirle la agilidad") y conecta el sistema nuevo con
  lo que ya existe, en vez de ser un juego aparte pegado.

### Cómo se calcula el stat de una mascota

```
stat = ((base de la especie + genes) × factor de nivel + entrenamiento / 4) × cuidado
```

- **Base de la especie:** su perfil. La suma de los cinco depende de la
  rareza (ver §5).
- **Genes:** ±8 por stat, sorteados al nacer y fijos. Dos blobs nunca son
  iguales. Se pueden heredar en la crianza.
- **Factor de nivel:** `0.6 + nivel × 0.016` (nivel 1 → 0.62, nivel 30 →
  1.08, nivel 50 → 1.4). El nivel sube con xp de todo: cuidar, jugar,
  pelear.
- **Entrenamiento:** puntos por stat que se ganan jugando el minijuego
  asociado (el mérito de la partida, con rendimientos decrecientes y un tope
  total, por ejemplo 100 puntos repartidos).
- **Cuidado:** multiplicador de 0.92 (descuidada) a 1.04 (muy bien cuidada),
  calculado de `careGood`/`careBad`. Por fin se usan.

---

## 5. Rareza y poder: ¿qué tan "más poderosos" deben ser los raros?

Pediste que haya personajes más raros y más poderosos. El riesgo es el
clásico: si el legendario gana siempre, cuidar y jugar bien da lo mismo, y
entre amigos gana quien tuvo suerte en la gacha. Tres modelos:

### Modelo vertical: el raro es mejor en todo

Legendario = +30% de stats. Simple, y la rareza se siente muchísimo.
**Problema:** en la simulación, con solo +10% de stats ya gana el 82%. Con
+30% gana prácticamente siempre. Entre amigos, eso es aburrido.

### Modelo horizontal: el raro es distinto, no mejor

Misma suma de stats para todos; la rareza da rasgos únicos, movimientos
llamativos y arte especial.
**Problema:** no cumple lo que pediste ("más poderosos").

### Modelo "techo + crianza" (recomendado)

La rareza sube un poco la suma de stats (el **techo**), pero el
entrenamiento, el nivel y el cuidado mueven más que la rareza. Valores
probados en la simulación:

| Rareza | Suma de stats base | % del catálogo | Ejemplo de cupo en 105 |
|---|---|---|---|
| Común | 250 | ~50% | 52 |
| Rara | 257 | ~28% | 30 |
| Épica | 265 | ~15% | 16 |
| Legendaria | 276 | ~6% | 6 |
| (Mítica, de evento) | 285 | ~1% | 1-2 |

**Resultados de la simulación** (4000 peleas automáticas por línea, nivel
30, `node docs/sim-combate.js`):

| Enfrentamiento | Gana el primero |
|---|---|
| Común vs común, iguales (control) | 50% |
| Rara vs común, igual nivel y cuidado | 61% |
| Épica vs común, igual nivel y cuidado | 70% |
| Legendaria vs común, igual nivel y cuidado | 82% |
| Legendaria **sin entrenar** vs común **entrenada** (+20 por stat) | 54% |
| Legendaria **descuidada** vs común **bien cuidada** | 43% |
| Legendaria descuidada vs común entrenada y bien cuidada | **13%** |
| Legendaria nivel 20 vs común nivel 30 | 28% |
| Ventaja de elemento (fuego vs planta), iguales | 65% |

Cómo se lee: **entre dos jugadores igual de dedicados, la rareza pesa
bastante** (82%, se siente "poderoso"). Pero **un jugador dedicado con un
común le gana a uno que solo tuvo suerte**. Eso premia cuidar, que es la
gracia de un tamagotchi.

**Lo que hay que saber:** en un combate automático las ventajas se
componen (más vida, más daño y más velocidad a la vez). Por eso las
diferencias de rareza en los stats tienen que ser chicas: +10% ya es mucho.
Si en el futuro se quiere que la rareza pese más, conviene hacerlo con
**rasgos y movimientos** (algo que el raro *puede hacer* y el común no),
no con más números.

### Arquetipos: que el total igual no signifique "igual"

Con la misma suma, una especie puede ser tanque, veloz, maga o bruta. La
simulación muestra que ya generan matchups (bruto vence a tanque 64%, tanque
pierde con veloz 42% y con mago 38%), pero **el tanque quedó débil en
general** y habría que darle algo propio (por ejemplo, un rasgo que
devuelva daño). Esto es afinación normal y se hace con el script, no a ojo.

---

## 6. Rasgos: la personalidad de cada especie

Cada especie trae 1-2 **rasgos**, y cada rasgo tiene **un beneficio y un
costo**. Así "le da hambre más rápido" no es solo un castigo, y elegir
especie es elegir un estilo de juego. Ejemplos:

**De cuidado** (cambian el día a día):

| Rasgo | Beneficio | Costo |
|---|---|---|
| Glotón | Comer da +5 de felicidad | Hambre ×1.2 |
| Dormilón | Dormido recupera energía ×1.25 | Se duerme solo más seguido |
| Inquieto | Jugar da +30% de felicidad | La energía baja ×1.3 |
| Pulcro | Se ensucia la mitad | Se pone triste con la caca a la vista |
| Resistente | La salud baja ×0.8 | Las medicinas curan menos |
| Nocturno | De noche no decae nada | De día se aburre ×1.15 |
| Mimoso | Los mimos valen el doble | Sin mimos en 2 h, felicidad ×1.2 de bajada |
| Coleccionista | Los regalos aparecen ×1.5 | (ninguno: rasgo de especie rara) |

**De juego** (ayuditas chicas y visibles):

| Rasgo | Efecto |
|---|---|
| Ojo de lince | Estrellas: canasta +6% |
| Saltarín | Salto al cielo: rebote +5% más alto |
| Memoria de elefante | Memorice: +1 luz de ventaja al empezar |
| Pulso firme | Torre: perfecto +20% más tolerante |

**De combate** (sobre todo en raras y legendarias):

| Rasgo | Efecto |
|---|---|
| Espinas | Devuelve 15% del daño recibido (le da identidad al tanque) |
| Primer golpe | Siempre actúa primero en la pelea |
| Segundo aire | Una vez por pelea, al bajar del 20% de vida se cura 25% |
| Elemental | Su ventaja de elemento es ×1.12 en vez de ×1.06 |

**Reglas para que no se rompa nada:**
- Los multiplicadores de cuidado se mueven **entre ×0.8 y ×1.25**, nunca
  más.
- **Cada rasgo que toque un ritmo de barra se simula** contra
  `applyDecay()` real, como pide `CLAUDE.md`: la mediana de muerte por
  descuido de esa especie tiene que quedar entre ~13 y ~21 h (hoy, 16.8).
  Si un rasgo la saca de ahí, se ajusta el rasgo, no el juego.
- Las ayudas de minijuego **nunca multiplican monedas ni mérito**: dan un
  poco de margen (ventana, ancho, tiempo). Un jugador experto con un común
  tiene que seguir ganándole al promedio con el raro.

---

## 7. El combate: tres formatos

### Formato A: combate automático con repetición (recomendado como base)

Las mascotas pelean solas según sus stats (es lo que simula
`docs/sim-combate.js`): cada una llena su "barra de turno" según la
agilidad, ataca con fuerza contra defensa, a veces esquiva o da un crítico,
y cuando junta maná (ingenio) lanza su especial. La pelea se guarda como
**semilla + participantes**: con la misma semilla sale exactamente la misma
pelea, así se puede **ver la repetición** animada después (con los sprites
reales, `drawActorAt()` y los efectos del prototipo de combate) sin guardar
nada pesado.

- A favor: funciona sin conexión y de forma asíncrona (lo que necesita el
  Club), es barato de construir y de balancear con bots.
- En contra: no hay habilidad del jugador en el momento; la habilidad está
  en criar y armar al personaje.

### Formato B: combate de reacción (el prototipo que ya existe)

El rival anuncia un ataque y hay que responder (esquivar, bloquear,
contraatacar). Los stats ajustan la ventana de reacción (agilidad), el daño
(fuerza) y cuánto aguantas (vitalidad).

- A favor: ya está medio hecho, y es habilidad pura.
- En contra: no sirve para peleas que pasan mientras no miras.
- **Uso propuesto:** "jefes" del Club (una pelea en vivo al final de cada
  liga) y entrenamiento. Este sí puede dar monedas, porque es jugar.

### Formato C: táctico por turnos (movimientos y maná, tipo Pokémon)

Cuatro movimientos por especie, elegir qué hacer en cada turno.
- A favor: la profundidad más grande.
- En contra: diseñar movimientos para 100 especies, y una interfaz de
  combate entera en una pantalla chica. Es otro juego dentro del juego.
- **Si algún día:** los movimientos se definen por elemento y arquetipo (no
  por especie), así son ~20 y no 400.

### Recomendación

**A como base, B para los momentos especiales, C nunca o mucho después.**

---

## 8. El Club de la pelea (expediciones)

### Cómo funciona

1. Desde un botón nuevo (o desde la ficha de la mascota) eliges **mandarla
   al Club** por 1, 4 u 8 horas reales. Requisitos: no estar enferma,
   energía ≥ 50, hambre ≥ 50. Se usa la mejora **"Pase de visita"** que ya
   se vende y hoy no hace nada (o se vuelve gratis, y el pase pasa a ser
   "una expedición extra").
2. Mientras está fuera **no está en la pieza**: un cartel dice "Se fue al
   Club 🥊 · vuelve en 3:12". Sus barras **bajan a la mitad** (allá la
   cuidan, pero no es como en casa), así nadie la usa para "pausar" el
   cuidado. El acompañante se queda y la espera.
3. En ese tiempo pelea solo contra rivales de su **liga** (Bronce → Plata →
   Oro → Diamante → Leyenda): ~1 pelea por hora, en combate automático.
4. Al volver, entra caminando por el costado (como al cambiar de habitación)
   y en la **bitácora** aparece el resumen: "Peleó 4 veces: 3 ganadas, 1
   perdida", con un botón para **ver la repetición** de la mejor pelea.
5. **Premios:** xp (sube de nivel), trofeos (puntos de liga), a veces un
   objeto o un huevo. Perder no la mata nunca: vuelve cansada y un poco
   triste.
6. El **"Silbato de regreso"** (la otra mejora que hoy no hace nada) la
   trae antes de tiempo.

### ¿Da monedas?

Recomiendo **no, o muy pocas.** La regla del juego es que las monedas se
ganan jugando, y el Club pelea solo. Si diera monedas, mandar a la mascota
cada 8 horas pagaría más que jugar. Que dé trofeos, xp, objetos y huevos.
Las peleas de **jefe en vivo** (formato B), en cambio, sí pueden pagar como
un minijuego más.

### Ligas y rivales sin servidor

Los rivales los **genera el juego**: especie al azar según la liga, nombre
de una lista ("Pelusa", "Don Cuesco", "Mini Tifón"...), nivel y stats según
la liga. Subir de liga pide trofeos. Así todo el Club funciona sin
conexión desde el primer día, y los amigos se suman después como "rivales
especiales".

---

## 9. Amigos: de cero servidor a servidor

### Etapa 1: rivales del juego

Lo del §8. Sin servidor.

### Etapa 2: códigos de amigo (sin servidor, recomendado como siguiente paso)

- Cada mascota puede **exportar un código**, por ejemplo `MIMO-7KQ2-...`,
  con especie, nombre, nivel, stats, elemento, rasgos y un dígito de
  control. Se comparte por WhatsApp o con un QR.
- Al **importar** el código de un amigo, su mascota entra a tu Club como
  rival especial (un "fantasma", como en los juegos de carreras).
- **Truco para que los dos vean lo mismo:** la pelea entre dos códigos usa
  una semilla sacada de los dos códigos más la fecha. Como el combate es
  determinista, **tú y tu amigo ven exactamente la misma pelea y el mismo
  resultado** en sus teléfonos, sin servidor. "La pelea del día contra
  Pelusa de Camila: ganaste 2 de 3."
- **Límite honesto:** sin servidor no hay forma de impedir que alguien
  edite su código para tener stats imposibles. El dígito de control frena
  al curioso, no al tramposo. Entre amigos alcanza; para ranking público,
  no.
- Opcional: modo **"parejo"** que lleva a las dos mascotas a nivel 30 para
  que pese más la especie y la crianza que cuánto tiempo lleva cada uno.

### Etapa 3: servidor (solo si el juego crece)

- Cuentas, lista de amigos, ligas reales con emparejamiento, visitas de
  verdad (la mascota de tu amigo aparece en tu pieza), y la pelea se simula
  **en el servidor** con la misma función que el cliente: así no hay
  trampa.
- Un servicio administrado (Firebase, Supabase u otro) alcanza para esto
  sin mantener máquinas. Pero es un salto grande: cuentas, privacidad
  (muchos jugadores pueden ser menores), costos y moderación de nombres.
  **No lo recomiendo antes de que la Etapa 2 demuestre que la parte social
  engancha.**

---

## 10. Economía: que nada de esto la rompa

- **Monedas:** siguen saliendo solo de jugar (minijuegos y jefes en vivo).
  Nuevos gastos: huevos, espacios de guardería, entrenamientos.
- **Trofeos:** no se gastan, solo marcan la liga.
- **Fichas:** las de la ruleta, sirven también para la gacha de huevos.
- **Cuidado con la inflación por rareza:** si los stats dan ayudas en los
  minijuegos y el mérito da monedas, una especie rara gana más monedas.
  Por eso las ayudas son chicas y nunca multiplican el mérito (§6).
- **Precios de huevos sugeridos:** común 60, gacha de huevo 100 (o 2
  fichas). Para comparar: una partida buena da ~7 monedas, o ~21 en
  Megajuego.

---

## 11. Cambios técnicos necesarios

### 11.1 Catálogo de especies

Hoy cada especie es un objeto `XXX_RAW` con un JSON de grilla repetido, y
se registra en `SPECIES_RAW`, `SPECIES` y `SPECIES_IDS`. Con 100, propongo:

```js
// especies.js — catálogo; la grilla y las animaciones son UNA sola, compartida
const SHEET_LAYOUT = { /* los 28 frames y las 12 animaciones de siempre */ };

const SPECIES_CATALOG = [
  { id:'blob', familia:'blob', nombre:'Blob', rareza:'comun', elemento:'agua',
    perfil:[1, 1, 1, 1, 1],          // vit, fue, def, agi, ing (se escala a la suma de su rareza)
    rasgos:['mimoso'], especial:'burbujazo',
    hoja:'sprites/blob_spritesheet.png' },
  { id:'blob_lava', familia:'blob', nombre:'Blob de lava', rareza:'raro', elemento:'fuego',
    perfil:[0.9, 1.3, 0.9, 1, 0.9], rasgos:['inquieto'], especial:'erupcion',
    hoja:'sprites/blob_lava.png' },   // generada desde la de blob con un mapa de colores
  // ...
];
```

- **Una sola grilla:** `normalizeSpecies()` trabaja con `SHEET_LAYOUT` y la
  ruta de la hoja; agregar una especie pasa a ser **una línea**.
- **Carga diferida:** hoy se cargan todas las hojas al iniciar. Con 100,
  solo las que se usan (la activa, el acompañante, la guardería, el rival
  del momento) y el resto al abrir el Mimodex. `SPECIES[id].ready` ya
  existe para saber si una hoja está lista; falta dibujar un "cargando"
  (el huevo sirve) mientras no lo esté.
- **Script de variantes:** `tools/variantes.py` lee una hoja base y un mapa
  de colores y escribe la variante, con los mismos chequeos de
  `CLAUDE.md` (colores, semitransparencias, grilla).

### 11.2 El save

```js
// lo de cada mascota pasa de `state` a `state.pets[i]`
pets: [{
  uid, species, name, shiny,
  genes: { vit, fue, def, agi, ing },     // ±8, fijos desde que nace
  nivel, xp, entreno: { vit, fue, def, agi, ing },
  hunger, happiness, energy, hygiene, health, sick, sleeping, poop,   // las barras de hoy
  ageHours, stage, careGood, careBad, records?,                       // (¿récords por mascota o por cuenta?)
}],
activo: 0, acompanante: 1,
liga: { nombre, trofeos }, rivales: [/* códigos importados */],
expedicion: null | { hasta, peleas: [{ semilla, rival, gano }] },
mimodex: { visto: {}, tenido: {} },
```

`loadState()` convierte el save de hoy en `pets[0]`, con genes sorteados
una vez. Es la migración más grande que tendría el proyecto: conviene
hacerla sola, en su propio cambio, antes de construir encima.

### 11.3 Lo que se reutiliza

- Combate y repeticiones: `drawActorAt()`, `gameActor()`, los efectos del
  prototipo `startCombatGame`.
- Resultados del Club: la **bitácora** (recién hecha) y su ícono que
  pestañea.
- Entrar a la pieza al volver: `roomEnter()` (recién hecho, de las
  habitaciones).
- Calibración: el mismo método de bots que ya usan los minijuegos.

---

## 12. Hoja de ruta por fases

Cada fase se puede jugar y probar por sí sola: si una no engancha, se
corrige antes de seguir.

| Fase | Qué | Resultado jugable |
|---|---|---|
| **0. Base técnica** | Catálogo con grilla compartida, carga diferida, script de variantes, migración a `pets[]` con una sola mascota. | Nada visible cambia, pero agregar una especie pasa a ser una línea. |
| **1. Stats y ficha** | 5 stats, genes, nivel, cuidado → multiplicador, ficha con gráfico de pentágono, entrenamiento por minijuegos, 2-3 rasgos de cuidado (simulados). | Tu mascota tiene números que suben jugando y cuidándola. |
| **2. Club de la pelea** | Combate automático + repetición, expediciones de 1/4/8 h, ligas con rivales del juego, resultados en la bitácora. Pase y silbato pasan a funcionar. | Mandas a pelear y vuelve con una historia. |
| **3. Más personajes** | Arte de familias + variantes, huevos (tienda, gacha, club), guardería, Mimodex, brillantes. Elegir al inicio entre 3-6 iniciales. | Coleccionar. |
| **4. Crianza** | Huevo de una adulta bien cuidada, herencia de genes y rasgos, especies mixtas. | Generaciones. |
| **5. Amigos sin servidor** | Códigos de amigo, peleas fantasma deterministas, modo parejo. | Pelear contra amigos. |
| **6. Jefes en vivo** | El prototipo de combate (formato B) como jefe de cada liga, con monedas. | Habilidad en el combate. |
| **7. Servidor (opcional)** | Cuentas, ligas reales, visitas de verdad. | Solo si la Fase 5 engancha. |

El **arte corre en paralelo** desde la Fase 1: definir las ~35 familias,
dibujar o encargar las bases, generar variantes.

---

## 13. Riesgos

| Riesgo | Cómo se mitiga |
|---|---|
| El arte no llega a 100 | Variantes de paleta (§2); lanzar con 30-40 y sumar por temporadas. |
| La rareza hace aburrido pelear entre amigos | Techo chico (§5), modo parejo (§9), rareza vía rasgos más que vía números. |
| Los rasgos de cuidado rompen la calibración de muerte | Rango ×0.8-×1.25 y simulación obligatoria por rasgo (§6). |
| El Club se usa para "pausar" el cuidado | Barras a la mitad, no en cero, mientras está fuera (§8). |
| Inflación de monedas | Club sin monedas; ayudas de minijuego que no multiplican el mérito (§10). |
| La migración del save rompe partidas | Fase 0 aislada, con saves de prueba de cada versión vieja. |
| Trampa en códigos de amigo | Aceptarlo entre amigos; servidor solo si hace falta ranking público (§9). |
| Demasiados sistemas para una pantalla chica | Cada fase agrega UNA cosa visible; la ficha concentra los números. |

---

## 14. Preguntas que necesito que respondas

Con mi recomendación entre paréntesis, para que puedas contestar "sí a
todo" si te parece bien:

1. **Arte:** ¿Variantes de paleta para llegar a 100, o quieres 100 diseños
   únicos aunque tarde mucho más? (Variantes.)
2. **Muchas mascotas:** ¿Guardería con varias (una activa), solo álbum, o
   generaciones? (Guardería + crianza.)
3. **¿Qué es de la cuenta y qué de cada mascota?** Monedas, casa, muebles y
   juegos desbloqueados de la cuenta; ¿los récords y la xp de los juegos
   también, o por mascota? (De la cuenta: así cambiar de mascota no se
   siente como empezar de cero.)
4. **Cuánto poder da la rareza:** ¿techo chico (+10%, recomendado), o que
   los legendarios ganen casi siempre? (Techo chico.)
5. **Stats en los minijuegos:** ¿ayudas chicas y visibles, o que los
   minijuegos sigan siendo habilidad pura y los stats sean solo para
   pelear? (Ayudas chicas.)
6. **Combate:** ¿automático con repetición como base? ¿O prefieres que el
   jugador siempre pelee en vivo? (Automático + jefes en vivo.)
7. **El Club, ¿da monedas?** (No, o muy pocas; sí trofeos, xp y huevos.)
8. **Amigos:** ¿te sirven los códigos sin servidor como primer paso, o el
   plan es ir directo a un servidor? (Códigos primero.)
9. **Nombres:** "Club de la pelea" puede sonar a la película; otras
   opciones: "Arena", "Torneo", "Dojo", "Liga Mimo". (Me gusta "Arena" para
   el botón y "Liga" para el ranking.)

---

## Apéndice A: diez especies de ejemplo

Para mostrar cómo se combinan perfil, elemento y rasgos (las cinco primeras
existen hoy):

| Especie | Rareza | Elemento | Perfil | Rasgos |
|---|---|---|---|---|
| Blob | Común | Agua | Equilibrado | Mimoso |
| Gato | Común | Planta | Veloz | Inquieto |
| Pollito | Común | Fuego | Veloz-frágil | Glotón · Saltarín |
| Blob amarillo | Rara | Luz | Mago | Coleccionista |
| Cuernos amarillo | Épica | Fuego | Bruto | Primer golpe |
| Blob de lava | Rara | Fuego | Bruto | Inquieto |
| Blob de musgo | Común | Planta | Tanque | Dormilón |
| Gato sombra | Épica | Sombra | Veloz | Nocturno · Segundo aire |
| Pollito tormenta | Rara | Agua | Mago | Ojo de lince |
| Rey Blob (brillante) | Legendaria | Agua | Tanque | Espinas · Resistente |

Elementos: Fuego > Planta > Agua > Fuego, más Luz y Sombra que se ganan
entre sí. La ventaja es ×1.06 y la desventaja ×0.95: en la simulación eso
ya da 65% entre iguales, así que no conviene más.

## Apéndice B: fórmulas de combate (las de la simulación)

```
vida        = vitalidad × 2.5 + 60
turno       = la barra sube agilidad × 0.3 + 25 por tic; actúa al pasar 100
maná        = +10 + ingenio × 0.25 por acción; especial al llegar a 60
ataque      = fuerza × 100 / (100 + defensa del rival)
especial    = ingenio × 1.5 × 100 / (100 + defensa del rival × 0.85)
esquiva     = agilidad del rival / 500   (tope 25%)
crítico     = agilidad / 450, ×1.5
elemento    = ×1.06 con ventaja, ×0.95 con desventaja
azar        = cada golpe ×0.7 a ×1.3
```

Están en `docs/sim-combate.js`. Antes de construir el Club, la tarea es
afinarlas con más casos (arquetipos, rasgos de combate, mejor de 3), no
decidirlas de nuevo.
