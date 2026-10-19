require('dotenv').config();
const { generateArco } = require('../lib/pressBatch');

(async () => {
  const t0 = Date.now();
  const { arco, usage } = await generateArco({
    clientSlug: 'moneymade',
    artistSlug: 'jared-la-j',
    objetivo: 'Posicionar a Jared La J como la nueva voz autentica del underground urbano colombiano, con misterio creciente alrededor de su proximo lanzamiento',
    cantidad: 6,
  });
  console.log(`OK Arco generado en ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log('Tokens:', JSON.stringify(usage));
  console.log('\nPREMISA:', arco.premisa);
  console.log('PERCEPCION OBJETIVO:', arco.percepcion_objetivo);
  arco.beats.forEach(b => console.log(`\n[${b.index}] ${b.titular}\n    -> ${b.angulo}`));
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
