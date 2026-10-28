# mimogoshi

Un tamagotchi de una sola página (HTML/CSS/JS puro, sin build, sin frameworks).

Cuida a tu mascota pixel-art: aliméntala, juega con ella, báñala, déjala
dormir y cúrala si se enferma. Nace de un huevo y crece de niño a adulto.

- 12 minijuegos (6 solos y 6 de a dos) con niveles, récords y un desafío
  diario.
- Tienda de comida, mejoras y objetos; ruleta gratis cada 12 horas.
- Muebles y objetos mágicos que la mascota usa de verdad, en varias
  habitaciones.
- Huerto, cocina, tesoros para cavar y una máquina que revive fósiles.
- Medallas y un Mimodex con las especies que conociste.
- Una bitácora con lo que pasó mientras no estabas.

Todo el progreso se guarda en `localStorage` del navegador: no hay servidor
ni backend.

Abre `index.html` en el navegador para jugar. Las pruebas se corren con
`node tests/run.js`. Lo técnico (cómo está armado, cómo probar, reglas) está en
`CLAUDE.md`, y el porqué de cada decisión en `docs/HISTORIA.md`.
