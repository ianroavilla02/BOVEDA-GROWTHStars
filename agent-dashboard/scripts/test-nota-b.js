require('dotenv').config();
const { parseArco, generateNota } = require('../lib/pressBatch');

const PLAN = `FASE 1 / 25-27 Mayo
Aumentar Percepcion publica
3 notas de prensa
- de modelo a artista consolidado, la historia de Javier Ferreira
- El influencer que ya acumula mas de un millon de escuchas en su catalogo musical
- de Colombia para el mundo, el adonis colombiano ya es pedido en Mexico y paises de Latinoamerica`;

(async () => {
  console.log('Parseando plan...');
  const { arco } = await parseArco({
    clientSlug: 'chimbita-records',
    artistSlug: 'javier-ferreira',
    planTexto: PLAN,
  });
  console.log(`Arco OK: ${arco.beats.length} beats\n`);

  const beat = arco.beats[1];
  console.log('Generando nota del beat 2...');
  console.log('  intencion:', beat.intencion);
  console.log('  datos_duros:', beat.datos_duros || '(ninguno)');
  const t0 = Date.now();
  const nota = await generateNota({
    clientSlug: 'chimbita-records',
    artistSlug: 'javier-ferreira',
    arco,
    beat
  });
  console.log(`\nNota OK en ${((Date.now()-t0)/1000).toFixed(1)}s | tokens ${JSON.stringify(nota.usage)}`);
  console.log(`fase: ${nota.fase} (${nota.fecha})`);
  console.log('\n=== NOTA BEAT 2 ===\n');
  console.log(nota.content);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
