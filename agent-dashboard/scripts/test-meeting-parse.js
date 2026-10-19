require('dotenv').config();
const fs = require('fs');
const db = require('../db');

const OBJECTIVE_ID = '9b570500-ffe5-4cd8-939f-f078a942de7f'; // obj#2 Discovery Session | Reckless
const TRANSCRIPT_PATH = 'C:/Users/Ian Villaveces/Documents/BOVEDA - GROWTHStars/06_CLIENTES/reckless/mgmt/meetings/empalme-meta-2-1781111517050.md';

(async () => {
  const rawText = fs.readFileSync(TRANSCRIPT_PATH, 'utf-8');
  console.log('Transcripcion:', rawText.length, 'chars');

  const ctx = await db.getMeetingContext(OBJECTIVE_ID);
  console.log('client_id:', ctx.client_id);
  console.log('Objetivos del engagement:', ctx.objectives.length);
  ctx.objectives.forEach(o => console.log('  - [#' + o.number + '] ' + o.title + ' (' + o.status + ') id=' + o.id));

  console.log('\nParseando con Kimi...');
  const t0 = Date.now();
  const parsed = await db.parseMeetingReport(rawText, OBJECTIVE_ID);
  console.log('Parseado en ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
  console.log('METHOD:', parsed._method);

  console.log('\nTYPE:', parsed.type);
  console.log('SUMMARY:', (parsed.summary || '').slice(0, 200));
  console.log('ATTENDEES:', JSON.stringify(parsed.attendees));
  console.log('ACTION ITEMS:', JSON.stringify(parsed.action_items, null, 2));
  console.log('DECISIONS:', JSON.stringify(parsed.decisions, null, 2));
  console.log('\n>>> SECONDARY TASKS:', JSON.stringify(parsed.secondary_tasks, null, 2));
  console.log('\n>>> OBJETIVO LINKS:', JSON.stringify(parsed.objetivo_links, null, 2));

  const validNumbers = new Set(ctx.objectives.map(o => o.number));
  const links = parsed.objetivo_links || [];
  const inventados = links.filter(l => !validNumbers.has(l.objective_number));
  console.log('\nVALIDACION ENLACES:');
  console.log('  Total sugeridos:', links.length);
  console.log('  Inventados (number no real):', inventados.length, inventados.length ? JSON.stringify(inventados) : 'OK');

  process.exit(0);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
