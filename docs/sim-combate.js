/* Simulación de las fórmulas de combate automático propuestas en
   docs/PLAN-PERSONAJES.md. No es código del juego: es para probar el
   equilibrio antes de construir nada. Correr con:

     node docs/sim-combate.js

   Cada línea es el % de peleas que gana el primero contra el segundo (4000
   peleas por línea, con azar: ±2 puntos de ruido entre corridas). */

const R = Math.random;
const STATS = ['vit', 'fue', 'def', 'agi', 'ing'];

/* Suma de stats base de una especie según su rareza. La diferencia entre
   rarezas es chica a propósito: en un combate automático las ventajas se
   componen (más vida + más daño + más velocidad) y una diferencia del 10%
   ya da ~80% de victorias. */
const RAREZA_TOTAL = { comun: 250, raro: 257, epico: 265, legendario: 276 };

/* Perfil = cómo reparte la especie su total entre los 5 stats. */
function especie(rareza, perfil){
  const tot = RAREZA_TOTAL[rareza];
  const s = perfil.reduce((a, b) => a + b, 0);
  const base = {};
  STATS.forEach((k, i) => { base[k] = tot * perfil[i] / s; });
  return base;
}

/* Una mascota concreta: genes (±8 por stat, al nacer), nivel (1..50),
   entrenamiento (puntos por stat ganados jugando) y cuidado (multiplicador
   0.92 descuidada .. 1.04 muy bien cuidada, sale de careGood/careBad). */
function mascota(base, { nivel = 30, entreno = 0, cuidado = 1, genes = true, elem = 'fuego' } = {}){
  const st = {};
  STATS.forEach(k => {
    const g = genes ? (R() * 16 - 8) : 0;
    st[k] = ((base[k] + g) * (0.6 + nivel * 0.016) + entreno / 4) * cuidado;
  });
  return { st, elem };
}

const VENTAJA = { fuego: 'planta', planta: 'agua', agua: 'fuego' };

/* Pelea por "barra de turno": cada uno la llena según su agilidad y actúa
   al llegar a 100. Ataque normal (fuerza contra defensa, se puede esquivar,
   puede ser crítico) o especial cuando junta maná (ingenio, atraviesa parte
   de la defensa). Daño con ±30% de azar. */
function pelea(A, B){
  const mk = m => ({ m, hp: m.st.vit * 2.5 + 60, mana: 0, gauge: R() * 50 });
  const a = mk(A), b = mk(B);
  for (let t = 0; t < 2000; t++){
    for (const [yo, otro] of (R() < 0.5 ? [[a, b], [b, a]] : [[b, a], [a, b]])){
      yo.gauge += yo.m.st.agi * 0.3 + 25;
      if (yo.gauge < 100) continue;
      yo.gauge -= 100;
      yo.mana += 10 + yo.m.st.ing * 0.25;
      const elem = VENTAJA[yo.m.elem] === otro.m.elem ? 1.06 : VENTAJA[otro.m.elem] === yo.m.elem ? 0.95 : 1;
      let dmg;
      if (yo.mana >= 60){
        yo.mana -= 60;
        dmg = yo.m.st.ing * 1.5 * 100 / (100 + otro.m.st.def * 0.85);
      } else {
        if (R() < Math.min(0.25, otro.m.st.agi / 500)) continue;   // esquiva
        dmg = yo.m.st.fue * 100 / (100 + otro.m.st.def);
        if (R() < yo.m.st.agi / 450) dmg *= 1.5;                     // crítico
      }
      otro.hp -= dmg * elem * (0.7 + R() * 0.6);
      if (otro.hp <= 0) return yo === a;
    }
  }
  return R() < 0.5;
}

function winrate(fa, fb, n = 4000){
  let w = 0;
  for (let i = 0; i < n; i++) if (pelea(fa(), fb())) w++;
  return Math.round(w / n * 100);
}

/* Arquetipos: [vit, fue, def, agi, ing]. */
const equil = [1, 1, 1, 1, 1];
const tanque = [1.3, 0.95, 1.3, 0.7, 0.75];
const veloz = [0.85, 1, 0.8, 1.35, 1];
const mago = [0.95, 0.75, 0.9, 1, 1.4];
const bruto = [1.05, 1.35, 1, 0.85, 0.75];
const P = (rar, perfil, o) => () => mascota(especie(rar, perfil), o);

const casos = [
  ['Común vs común, iguales (control)', P('comun', equil), P('comun', equil)],
  ['Dos raros iguales con genes al azar', P('raro', equil), P('raro', equil)],
  ['Raro vs común, igual nivel y cuidado', P('raro', equil), P('comun', equil)],
  ['Épico vs común, igual nivel y cuidado', P('epico', equil), P('comun', equil)],
  ['Legendario vs común, igual nivel y cuidado', P('legendario', equil), P('comun', equil)],
  ['Legendario sin entrenar vs común con +20 por stat', P('legendario', equil), P('comun', equil, { entreno: 20 })],
  ['Legendario descuidado vs común bien cuidado, sin entrenar', P('legendario', equil, { cuidado: 0.92 }), P('comun', equil, { cuidado: 1.04 })],
  ['Legendario descuidado vs común entrenado y bien cuidado', P('legendario', equil, { cuidado: 0.92 }), P('comun', equil, { cuidado: 1.04, entreno: 20 })],
  ['Legendario nivel 20 vs común nivel 30', P('legendario', equil, { nivel: 20 }), P('comun', equil, { nivel: 30 })],
  ['Ventaja de elemento (fuego vs planta), iguales', P('comun', equil, { elem: 'fuego' }), P('comun', equil, { elem: 'planta' })],
  ['Bruto vs tanque (mismo total)', P('comun', bruto), P('comun', tanque)],
  ['Tanque vs veloz', P('comun', tanque), P('comun', veloz)],
  ['Tanque vs mago', P('comun', tanque), P('comun', mago)],
  ['Veloz vs mago', P('comun', veloz), P('comun', mago)],
  ['Mago vs bruto', P('comun', mago), P('comun', bruto)],
];
for (const [nombre, a, b] of casos) console.log(String(winrate(a, b)).padStart(3) + '%  ' + nombre);
