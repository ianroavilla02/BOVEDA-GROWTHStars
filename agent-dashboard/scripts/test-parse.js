require('dotenv').config();
const { parseArco } = require('../lib/pressBatch');

const PLAN = `FASE 1 / 25-27 Mayo
Aumentar Percepcion publica
3 notas de prensa
- de modelo a artista consolidado, la historia de Javier Ferreira
- El influencer que ya acumula mas de un millon de escuchas en su catalogo musical
- de Colombia para el mundo, el adonis colombiano ya es pedido en Mexico y paises de Latinoamerica

FASE 2 / 27-28 Mayo
Prelanzamiento / Anuncio de Collab
2 notas de prensa
- La primera collab de Javier Ferreira estan haciendo que ardan las redes, y sus fans ya especulan (montar ss de fans preguntando y adivinando)
- El colombiano Lit Bari se une junto a Javier Ferreira en su proximo lanzamiento "Quien Como Yo"

FASE 3 / 28-29 Mayo
Lanzamiento / Sprint de 72hrs algoritmico
3 notas de prensa
- El artista detras del exito Clack Clack estrena su primera colaboracion
- Quien Como Yo esta rompiendo expectativas, la primera colaboracion del adonis colombiano Javier Ferreira ya esta disponible
- Lit Bari y Javier Ferreira, el junte del que todos estan hablando en redes (mostrar interacciones de fans)

FASE 4 / 1-3 Junio
Sostenimiento / Hitos
2 notas de prensa
- Quien Como Yo acumula x cantidad de videos en TikTok
- a nada de llegar a los 4 millones en TikTok luego de lanzar su sencillo Quien Como Yo

TOTAL: 10 notas. Activaciones: 25 Mayo - 3 Junio`;

(async () => {
  const t0 = Date.now();
  const { arco, usage } = await parseArco({
    clientSlug: 'chimbita-records',
    artistSlug: 'javier-ferreira',
    planTexto: PLAN,
  });
  console.log(`OK Parseado en ${((Date.now()-t0)/1000).toFixed(1)}s | tokens ${JSON.stringify(usage)}`);
  console.log(`\nBeats detectados: ${arco.beats.length} (esperado: 10)`);
  console.log('\nPREMISA:', arco.premisa);
  console.log('PERCEPCION:', arco.percepcion_objetivo);
  arco.beats.forEach(b => {
    console.log(`\n[${b.index}] FASE: ${b.fase} (${b.fecha})`);
    console.log(`    INTENCION: ${b.intencion}`);
    console.log(`    ANGULO: ${b.angulo}`);
    console.log(`    CONTEXTO: ${b.nota_contexto || '(ninguno)'}`);
    console.log(`    DATOS: ${b.datos_duros || '(ninguno)'}`);
  });
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
