require('dotenv').config();
const { createBatch, approveBatchArco, generateBatchNotes } = require('../lib/pressBatch');

const PLAN = `FASE 1 / 25-27 Mayo
Aumentar Percepcion publica
3 notas de prensa
- de modelo a artista consolidado, la historia de Javier Ferreira
- El influencer que ya acumula mas de un millon de escuchas en su catalogo musical
- de Colombia para el mundo, el adonis colombiano ya es pedido en Mexico y paises de Latinoamerica`;

(async () => {
  const t0 = Date.now();

  console.log('=== PASO 1: createBatch (Modo B) ===');
  const { batchId, arco } = await createBatch({
    mode: 'B',
    clientSlug: 'chimbita-records',
    artistSlug: 'javier-ferreira',
    plan: PLAN,
  });
  console.log(`Batch ${batchId} | ${arco.beats.length} beats | status: draft`);

  console.log('\n=== PASO 2: approveBatchArco ===');
  await approveBatchArco(batchId, arco);
  console.log('Arco aprobado | status: arco_aprobado');

  console.log('\n=== PASO 3: generateBatchNotes (concurrency=3) ===');
  const r = await generateBatchNotes(batchId, (hechas, total, h) =>
    console.log(`  ${hechas}/${total} done: ${h}`), 3);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n${r.ok} ok, ${r.fail} fallidas | ${elapsed}s total`);
  console.log(`Batch ID: ${batchId}`);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
