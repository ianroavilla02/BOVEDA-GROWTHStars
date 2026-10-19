const { callMoonshot, buildAgentContext, getAgentPrompt, supabase, BOVEDA_PATH } = require('../db');
const fs = require('fs');
const pathModule = require('path');
const REDACTOR_AGENT = 'gs-redactor-prensa';

const ARCO_SYSTEM = `Eres el estratega narrativo de gs-redactor-prensa.
Tu trabajo NO es escribir notas: es diseñar el ARCO NARRATIVO de una campaña
de prensa estilo farándula urbana (tono chisme IG, conciso) que construya
una percepción pública específica del artista.

REGLAS:
- Usa SIEMPRE el nombre artístico. JAMÁS nombres reales o legales.
- NUNCA menciones el sello, inversor ni ecosistema de management
  (MoneyMade, Chimbita, etc.) ni jerga de negocio (inversión, roster,
  contrato). El arco construye percepción del ARTISTA, no del negocio.
- Los beats deben HILAR una sola línea narrativa con progresión
  (intriga -> desarrollo -> clímax), no notas sueltas.
- Cada ángulo debe ser publicable como chisme de farándula creíble,
  sin inventar hechos verificables falsos (premios, contratos, cifras).
- El colaborador/featuring se nombra natural, sin explicar estrategia.
- Responde ÚNICAMENTE con JSON válido, sin markdown, sin backticks,
  sin texto antes o después.

FORMATO EXACTO:
{"premisa":"...","percepcion_objetivo":"...","beats":[{"index":1,"titular":"...","angulo":"..."}]}`;

const PARSE_SYSTEM = `Eres el estructurador de campañas de prensa de gs-redactor-prensa.
El usuario te entrega un PLAN DE CAMPAÑA pensado por él (fases, fechas, ideas
de notas, instrucciones operativas, datos). Tu trabajo NO es escribir notas ni
pulir titulares: es ESTRUCTURAR fielmente su plan en beats JSON.

CONCEPTO CLAVE: las ideas de notas que el usuario escribe son INTENCIONES, no
titulares finales. Capturá la intención de cada nota; el titular final lo
redactará otro agente después. NO conviertas su idea en un titular pulido.

REGLAS:
- NO inventes beats que el usuario no escribió. Respetá su cantidad exacta.
- NO inventes cifras, fechas ni datos. Si el usuario da un dato duro
  (ej: "+1M escuchas", "4M en TikTok", "@usuario"), copialo TAL CUAL en
  datos_duros. Si una idea menciona un dato sin valor concreto (ej: "x
  cantidad de videos"), dejá datos_duros en "" — NO inventes el número.
- Conservá la FASE y FECHA que el usuario asignó a cada grupo de notas.
- Usá SIEMPRE el nombre artístico. JAMÁS nombres reales/legales.
- NUNCA menciones sello/inversor/management.

CAMPOS DE CADA BEAT:
- index: número de orden (1, 2, 3...).
- fase: la fase del usuario (ej: "Aumentar percepción pública").
- fecha: la fecha/rango que el usuario asignó a esa fase.
- intencion: la idea de la nota TAL CUAL la escribió el usuario (su bullet,
  sin pulir, es su input crudo).
- angulo: una frase corta tuya que capture el enfoque editorial de esa nota.
- nota_contexto: instrucciones operativas del usuario para esa nota
  (ej: "montar ss de fans especulando", "mostrar interacciones de fans").
  Si no hay, dejá "".
- datos_duros: cifras/fechas/menciones verificadas que el usuario dio. Si no
  hay dato concreto, dejá "".

premisa: resumí en 1 frase de qué va la campaña completa.
percepcion_objetivo: el objetivo de percepción que se desprende del plan.

Respondé ÚNICAMENTE con JSON válido, sin markdown ni backticks.

FORMATO EXACTO:
{"premisa":"...","percepcion_objetivo":"...","beats":[{"index":1,"fase":"...","fecha":"...","intencion":"...","angulo":"...","nota_contexto":"...","datos_duros":"..."}]}`;

function extractJson(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try { return JSON.parse(cleaned.slice(start, end + 1)); }
  catch { return null; }
}

function validateArco(arco, cantidad) {
  return arco
    && typeof arco.premisa === 'string'
    && typeof arco.percepcion_objetivo === 'string'
    && Array.isArray(arco.beats)
    && arco.beats.length === cantidad
    && arco.beats.every(b => Number.isInteger(b.index) && b.titular && b.angulo);
}

async function generateArco({ clientSlug, artistSlug, objetivo, cantidad = 6 }) {
  const context = buildAgentContext(clientSlug, artistSlug);

  const userPrompt = `CONTEXTO DEL ARTISTA:\n${context}\n\n` +
    `OBJETIVO DE PERCEPCIÓN: ${objetivo}\n\n` +
    `Diseña un arco narrativo de EXACTAMENTE ${cantidad} beats.`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const userContent = attempt === 1
      ? userPrompt
      : userPrompt + '\n\nIMPORTANTE: tu respuesta anterior no fue JSON válido. Responde SOLO el objeto JSON.';

    const result = await callMoonshot([
      { role: 'system', content: ARCO_SYSTEM },
      { role: 'user', content: userContent }
    ], { temperature: 1, max_tokens: 16000 });

    const arco = extractJson(result.content);
    if (validateArco(arco, cantidad)) {
      return { arco, usage: result.usage };
    }
    console.warn(`[generateArco] intento ${attempt} JSON inválido`);
  }
  throw new Error('generateArco: JSON inválido tras 2 intentos');
}

function validateParsedArco(arco) {
  return arco
    && typeof arco.premisa === 'string'
    && typeof arco.percepcion_objetivo === 'string'
    && Array.isArray(arco.beats)
    && arco.beats.length > 0
    && arco.beats.every(b =>
        Number.isInteger(b.index) && typeof b.intencion === 'string' && b.intencion.length > 0);
}

async function parseArco({ clientSlug, artistSlug, planTexto }) {
  const context = buildAgentContext(clientSlug, artistSlug);

  const userPrompt = `CONTEXTO DEL ARTISTA (referencia de identidad y tono):\n${context}\n\n---\n\nPLAN DE CAMPAÑA DEL USUARIO (estructurá ESTO, no inventes, no pulas titulares):\n\n${planTexto}`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const userContent = attempt === 1
      ? userPrompt
      : userPrompt + '\n\nIMPORTANTE: tu respuesta anterior no fue JSON válido. Respondé SOLO el objeto JSON.';

    const result = await callMoonshot([
      { role: 'system', content: PARSE_SYSTEM },
      { role: 'user', content: userContent }
    ], { temperature: 1, max_tokens: 16000 });

    const arco = extractJson(result.content);
    if (validateParsedArco(arco)) {
      return { arco, usage: result.usage };
    }
    console.warn(`[parseArco] intento ${attempt} JSON inválido`);
  }
  throw new Error('parseArco: JSON inválido tras 2 intentos');
}

async function getFlywheelExamples(artistSlug, limit = 3) {
  const { data, error } = await supabase
    .from('press_notes')
    .select('titular, content, rating, press_batches!inner(artist_slug)')
    .eq('status', 'approved')
    .gte('rating', 4)
    .eq('press_batches.artist_slug', artistSlug)
    .order('rating', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(n => {
    const firstPara = (n.content || '').split('\n\n')[0].slice(0, 400);
    return `EJEMPLO (rating ${n.rating}):\nTitular: ${n.titular}\n${firstPara}`;
  });
}

async function generateNota({ clientSlug, artistSlug, arco, beat }) {
  const agentPrompt = getAgentPrompt(REDACTOR_AGENT);
  const context = buildAgentContext(clientSlug, artistSlug);
  const examples = await getFlywheelExamples(artistSlug);

  const systemPrompt = `${agentPrompt}\n\n---\n\nCONTEXTO COMPLETO DEL ARTISTA:\n${context}`
    + (examples.length
        ? `\n\n---\n\nEJEMPLOS DE NOTAS APROBADAS (replica este nivel de estilo, NO el contenido):\n\n${examples.join('\n\n')}`
        : '');

  const datosBlock = beat.datos_duros && beat.datos_duros.trim()
    ? `\nDATOS DUROS VERIFICADOS (usa SOLO estos, no inventes otros numeros): ${beat.datos_duros}`
    : `\nDATOS DUROS: ninguno provisto. NO inventes cifras, fechas ni numeros. Si la idea sugiere un dato que no tenes, redacta sin el o de forma cualitativa.`;

  const contextoBlock = beat.nota_contexto && beat.nota_contexto.trim()
    ? `\nINSTRUCCION OPERATIVA (tenela en cuenta al redactar): ${beat.nota_contexto}`
    : '';

  const userPrompt = `Esta nota es parte de una campaña de prensa con arco narrativo.

PREMISA DE LA CAMPAÑA: ${arco.premisa}
PERCEPCION OBJETIVO: ${arco.percepcion_objetivo}

ESTA NOTA es el beat ${beat.index} de ${arco.beats.length}.
FASE: ${beat.fase || '-'} (${beat.fecha || '-'})
INTENCION DE LA NOTA (idea base del usuario, NO es el titular final): ${beat.intencion}
ANGULO EDITORIAL: ${beat.angulo}${datosBlock}${contextoBlock}

Redacta la nota completa siguiendo tu estilo de prensa urbana farandula:
- Crea un TITULAR final potente (la intencion es solo la idea, vos la convertis en titular de farandula).
- Cuerpo conciso, lenguaje de calle digerible.
- Coherente con la premisa y el angulo. No repitas info de beats anteriores.
- Cerra con el copy para redes (1 linea + emojis).`;

  const result = await callMoonshot([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], { temperature: 1, max_tokens: 16000 });

  return {
    content: result.content,
    beat_index: beat.index,
    fase: beat.fase || null,
    fecha: beat.fecha || null,
    nota_contexto: beat.nota_contexto || null,
    datos_duros: beat.datos_duros || null,
    usage: result.usage
  };
}

function extractTitular(content) {
  if (!content) return null;
  const primera = content.split('\n').map(l => l.trim()).find(l => l.length > 0);
  if (!primera) return null;
  return primera
    .replace(/^#+\s*/, '')
    .replace(/\*\*/g, '')
    .replace(/^["'""']+|["'""']+$/g, '')
    .slice(0, 140);
}

async function createBatch({ mode, clientSlug, artistSlug, plan, objetivo, cantidad = 6 }) {
  const { arco } = mode === 'B'
    ? await parseArco({ clientSlug, artistSlug, planTexto: plan })
    : await generateArco({ clientSlug, artistSlug, objetivo, cantidad });

  const { data: client, error: cErr } = await supabase
    .from('clients').select('id').eq('slug', clientSlug).single();
  if (cErr || !client) throw new Error(`createBatch: cliente '${clientSlug}' no encontrado`);

  const { data: batch, error } = await supabase
    .from('press_batches')
    .insert({
      client_id: client.id,
      client_slug: clientSlug,
      artist_slug: artistSlug,
      plan_raw: mode === 'B' ? plan : null,
      objetivo_percepcion: mode === 'A' ? objetivo : null,
      arco,
      status: 'draft',
    })
    .select().single();
  if (error) throw new Error(`createBatch insert: ${error.message}`);
  return { batchId: batch.id, arco };
}

async function approveBatchArco(batchId, arcoFinal) {
  const { error } = await supabase
    .from('press_batches')
    .update({ arco: arcoFinal, status: 'arco_aprobado' })
    .eq('id', batchId)
    .eq('status', 'draft');
  if (error) throw new Error(`approveBatchArco: ${error.message}`);
}

async function generateBatchNotes(batchId, onProgress, concurrency = 3) {
  const { data: batch, error } = await supabase
    .from('press_batches').select('*').eq('id', batchId).single();
  if (error || !batch) throw new Error(`generateBatchNotes: lote ${batchId} no existe`);
  if (batch.status !== 'arco_aprobado')
    throw new Error(`generateBatchNotes: status '${batch.status}', se requiere 'arco_aprobado'`);

  const { error: genErr } = await supabase.from('press_batches').update({ status: 'generando' }).eq('id', batchId);
  if (genErr) console.warn('[generateBatchNotes] failed to set generando:', genErr.message);

  const beats = batch.arco.beats;
  const resultados = { ok: 0, fail: 0 };
  let completadas = 0;
  let cursor = 0;

  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= beats.length) break;
      const beat = beats[i];

      let content = null, titular = null, err = null;
      try {
        const nota = await generateNota({
          clientSlug: batch.client_slug,
          artistSlug: batch.artist_slug,
          arco: batch.arco,
          beat,
        });
        content = nota.content;
        titular = extractTitular(content);
        resultados.ok++;
      } catch (e) { err = e.message; resultados.fail++; }

      await supabase.from('press_notes').insert({
        batch_id: batchId,
        beat_index: beat.index,
        titular,
        content,
        status: 'pending',
        fase: beat.fase ?? null,
        fecha: beat.fecha ?? null,
        nota_contexto: beat.nota_contexto ?? null,
        datos_duros: beat.datos_duros ?? null,
      });

      completadas++;
      if (onProgress) onProgress(completadas, beats.length, titular || `beat ${beat.index}`);
      if (err) console.warn(`[generateBatchNotes] beat ${beat.index} falló: ${err}`);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, beats.length) }, worker);
  await Promise.all(workers);

  await supabase.from('press_batches').update({ status: 'generado' }).eq('id', batchId);
  return resultados;
}

async function regenerateNote(noteId) {
  const { data: note, error: nErr } = await supabase
    .from('press_notes').select('*').eq('id', noteId).single();
  if (nErr || !note) throw new Error(`regenerateNote: nota ${noteId} no existe`);

  const { data: batch, error: bErr } = await supabase
    .from('press_batches').select('*').eq('id', note.batch_id).single();
  if (bErr || !batch) throw new Error(`regenerateNote: batch de la nota no existe`);

  const beat = batch.arco.beats.find(b => b.index === note.beat_index);
  if (!beat) throw new Error(`regenerateNote: beat ${note.beat_index} no está en el arco`);

  const nota = await generateNota({
    clientSlug: batch.client_slug,
    artistSlug: batch.artist_slug,
    arco: batch.arco,
    beat,
  });
  const titular = extractTitular(nota.content);

  const { data: updated, error: uErr } = await supabase
    .from('press_notes')
    .update({ content: nota.content, titular, rating: null, status: 'pending' })
    .eq('id', noteId)
    .select().single();
  if (uErr) throw new Error(`regenerateNote update: ${uErr.message}`);
  return updated;
}

async function closeBatch(batchId) {
  const { data: batch, error: bErr } = await supabase
    .from('press_batches').select('*').eq('id', batchId).single();
  if (bErr || !batch) throw new Error(`closeBatch: lote ${batchId} no existe`);
  if (batch.status === 'cerrado') throw new Error('El lote ya está cerrado');

  const { data: notes, error: nErr } = await supabase
    .from('press_notes')
    .select('*')
    .eq('batch_id', batchId)
    .eq('status', 'approved')
    .order('beat_index', { ascending: true });
  if (nErr) throw new Error(`closeBatch notes: ${nErr.message}`);
  if (!notes || notes.length === 0) throw new Error('No hay notas aprobadas para cerrar el lote');

  const sinCalificar = notes.filter(n => n.rating == null).map(n => n.beat_index);

  const lotePath = pathModule.join(
    BOVEDA_PATH, '06_CLIENTES', batch.client_slug,
    'artistas', batch.artist_slug, 'agents',
    REDACTOR_AGENT, 'lotes', batchId
  );
  fs.mkdirSync(lotePath, { recursive: true });

  const arco = batch.arco || {};
  const arcoMd = `# Arco Narrativo — Lote ${batchId}

> Artista: ${batch.artist_slug}
> Cliente: ${batch.client_slug}
> Premisa: ${arco.premisa || '(sin premisa)'}
> Percepción objetivo: ${arco.percepcion_objetivo || '(sin objetivo)'}

---

## Beats

${(arco.beats || []).map((b, i) => `### Beat ${i + 1} — ${b.fase || ''}
- **Fecha:** ${b.fecha || '—'}
- **Ángulo:** ${b.angulo || '—'}
- **Datos duros:** ${b.datos_duros || '—'}
- **Nota contexto:** ${b.nota_contexto || '—'}
`).join('\n')}
`;
  fs.writeFileSync(pathModule.join(lotePath, 'arco.md'), arcoMd, 'utf-8');

  for (const note of notes) {
    const idx = String(note.beat_index).padStart(2, '0');
    const noteMd = `---
rating: ${note.rating != null ? note.rating : 'sin calificar'}
beat_index: ${note.beat_index}
fase: ${note.fase || ''}
fecha: ${note.fecha || ''}
batch_id: ${batchId}
---

${note.content}
`;
    fs.writeFileSync(pathModule.join(lotePath, `nota-${idx}.md`), noteMd, 'utf-8');
  }

  const { error: closeErr } = await supabase
    .from('press_batches')
    .update({ status: 'cerrado' })
    .eq('id', batchId);
  if (closeErr) throw new Error(`closeBatch update status: ${closeErr.message}`);

  const relPath = lotePath.replace(BOVEDA_PATH, '').replace(/\\/g, '/').replace(/^\//, '');
  return { escritas: notes.length, ruta: relPath, sin_calificar: sinCalificar };
}

module.exports = {
  generateArco, parseArco, generateNota, getFlywheelExamples,
  extractJson, validateArco, validateParsedArco,
  extractTitular, createBatch, approveBatchArco, generateBatchNotes,
  regenerateNote, closeBatch,
};
