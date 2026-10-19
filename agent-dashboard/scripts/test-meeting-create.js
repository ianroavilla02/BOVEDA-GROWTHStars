require('dotenv').config();
const fs = require('fs');
const db = require('../db');

const OBJECTIVE_ID = '9b570500-ffe5-4cd8-939f-f078a942de7f'; // obj#2 Discovery Session | Reckless
const TRANSCRIPT_PATH = 'C:/Users/Ian Villaveces/Documents/BOVEDA - GROWTHStars/06_CLIENTES/reckless/mgmt/meetings/empalme-meta-2-1781111517050.md';

(async () => {
  const rawText = fs.readFileSync(TRANSCRIPT_PATH, 'utf-8');
  console.log('Parseando + creando reunion real...');

  const parsed = await db.parseMeetingReport(rawText, OBJECTIVE_ID);
  console.log('Parsed OK. method:', parsed._method,
    '| secondary_tasks:', (parsed.secondary_tasks || []).length,
    '| links:', (parsed.objetivo_links || []).length);

  const result = await db.createMeeting(OBJECTIVE_ID, parsed);
  const meetingId = result.meeting.id;
  console.log('\nReunion creada:', meetingId);
  console.log('secondary_tasks saved:', result.secondary_tasks.length);
  console.log('objetivo_links saved:', result.objetivo_links.length);

  const tasks = await db.listMeetingTasks(meetingId);
  const links = await db.listMeetingLinks(meetingId);

  console.log('\n=== PERSISTIDO ===');
  console.log('Tareas secundarias:', tasks.length);
  tasks.forEach(t => console.log('  [' + t.status + '] ' + t.descripcion + ' (cristian: ' + t.para_cristian + ')'));
  console.log('\nEnlaces sugeridos:', links.length);
  links.forEach(l => console.log('  obj#' + l.mgmt_objectives.number + ' ' + l.mgmt_objectives.title + ' | confirmed: ' + l.confirmed + '\n    -> ' + l.rationale));

  console.log('\nMEETING_ID para M4:', meetingId);
  process.exit(0);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
