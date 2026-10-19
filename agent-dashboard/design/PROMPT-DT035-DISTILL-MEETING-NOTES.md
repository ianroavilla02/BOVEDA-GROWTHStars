# PROMPT: Destilación automática de transcripciones con Kimi

> **Para:** CTO Jr (Claude Code operativo)
> **Scope:** db.js (nueva función) + server.js (integrar en close meeting) + package.json (mammoth)
> **Dependencias:** Moonshot API (Kimi K2.5) ya integrado en db.js via `callMoonshot()`

---

## CONTEXTO

Cuando se cierra una reunión en el Meetings Hub, el usuario sube una transcripción (.docx de Notas de Gemini / Google Meet). El sistema debe:

1. Convertir .docx → .md (mammoth)
2. Extraer la sección de transcripción cruda (después de `📖 Transcripción`)
3. Llamar a Kimi con la transcripción + los temas de la agenda
4. Kimi devuelve post-notas destiladas por tema
5. Guardar las post-notas en `post_notes` (JSONB) de la reunión en Supabase

---

## PASO 1: Instalar mammoth

```bash
cd agent-dashboard && npm install mammoth
```

---

## PASO 2: Función `convertDocxToMd()` en db.js

Agregar después de la sección `// MOONSHOT AI (Kimi K2.5)`:

```javascript
// =====================================================================
// DOCX → MD CONVERSION
// =====================================================================

const mammoth = require('mammoth');

async function convertDocxToMd(buffer) {
  const result = await mammoth.convertToMarkdown({ buffer });
  return result.value;
}
```

---

## PASO 3: Función `extractTranscriptSection()` en db.js

Extrae SOLO la sección de transcripción del documento completo de Notas de Gemini.

```javascript
function extractTranscriptSection(markdown) {
  // Buscar el inicio de la transcripción — variantes del marcador de Gemini
  const markers = [
    /📖\s*Transcripción/i,
    /##?\s*.*Transcripción/i,
    /Transcripción\s*$/im
  ];

  let startIndex = -1;
  for (const marker of markers) {
    const match = markdown.search(marker);
    if (match !== -1) {
      startIndex = match;
      break;
    }
  }

  if (startIndex === -1) {
    return null; // No se encontró sección de transcripción
  }

  return markdown.slice(startIndex);
}
```

---

## PASO 4: Función `distillMeetingNotes()` en db.js

Esta es la función principal. Llama a Kimi con la transcripción + agenda y devuelve post-notas estructuradas.

```javascript
async function distillMeetingNotes(transcript, agenda) {
  if (!transcript || !agenda || agenda.length === 0) {
    return [];
  }

  const MAX_INPUT = 12000;
  let trimmed = transcript;
  if (transcript.length > MAX_INPUT) {
    const head = transcript.slice(0, MAX_INPUT * 0.6);
    const tail = transcript.slice(-MAX_INPUT * 0.4);
    trimmed = head + '\n\n[... transcripción truncada ...]\n\n' + tail;
  }

  const agendaList = agenda.map((item, i) =>
    `${i + 1}. [ID: ${item.id}] ${item.topic}`
  ).join('\n');

  const systemPrompt = `Eres un analista de reuniones. Recibes una transcripción y una lista de temas de agenda.

Para CADA tema de la agenda, extraé de la transcripción:
- "summary": resumen de lo que se discutió (2-3 oraciones, en español)
- "decisions": lista de decisiones tomadas sobre este tema
- "action_items": lista de tareas pendientes, cada una con "task" y "responsible" (nombre de la persona)
- "status": "discussed" si se habló del tema, "briefly_mentioned" si se tocó superficialmente, "not_discussed" si no se habló
- "key_quotes": 1-2 citas textuales importantes del artista o participantes (las palabras exactas)

También identificá temas que se discutieron pero NO estaban en la agenda (temas emergentes).

Output SOLO el JSON. Sin markdown, sin explicación.`;

  const userPrompt = `AGENDA DE LA REUNIÓN:
${agendaList}

TRANSCRIPCIÓN:
${trimmed}

Responde con este formato JSON exacto:
{
  "agenda_notes": [
    {
      "topic_id": "uuid del tema",
      "topic": "texto del tema",
      "status": "discussed|briefly_mentioned|not_discussed",
      "summary": "resumen",
      "decisions": ["decisión 1"],
      "action_items": [{"task": "tarea", "responsible": "nombre"}],
      "key_quotes": ["cita textual"]
    }
  ],
  "emerging_topics": [
    {
      "topic": "tema que surgió",
      "summary": "qué se habló",
      "decisions": [],
      "action_items": [{"task": "tarea", "responsible": "nombre"}]
    }
  ]
}`;

  const result = await callMoonshot([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], { temperature: 0.3, max_tokens: 16000 });

  let raw = (result.content || '').trim();
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { parsed = JSON.parse(jsonMatch[0]); } catch (_) {}
    }
    if (!parsed) {
      console.error('Kimi distill returned non-JSON:', raw.slice(0, 300));
      return [];
    }
  }

  // Convertir al formato post_notes que usa el Meetings Hub
  const postNotes = [];

  if (Array.isArray(parsed.agenda_notes)) {
    for (const note of parsed.agenda_notes) {
      postNotes.push({
        topic_id: note.topic_id,
        topic: note.topic,
        status: note.status || 'discussed',
        note: note.summary || '',
        decisions: Array.isArray(note.decisions) ? note.decisions : [],
        action_items: Array.isArray(note.action_items) ? note.action_items : [],
        key_quotes: Array.isArray(note.key_quotes) ? note.key_quotes : [],
        source: 'kimi-distill'
      });
    }
  }

  // Agregar temas emergentes con flag
  if (Array.isArray(parsed.emerging_topics)) {
    for (const topic of parsed.emerging_topics) {
      postNotes.push({
        topic_id: 'emerging-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        topic: '🆕 ' + (topic.topic || 'Tema emergente'),
        status: 'emerging',
        note: topic.summary || '',
        decisions: Array.isArray(topic.decisions) ? topic.decisions : [],
        action_items: Array.isArray(topic.action_items) ? topic.action_items : [],
        key_quotes: [],
        source: 'kimi-distill'
      });
    }
  }

  return postNotes;
}
```

---

## PASO 5: Integrar en el flujo de cierre de reunión

Buscar la función `closeMeeting()` (o el endpoint `POST /api/meetings/:id/close`). Dentro del flujo, DESPUÉS de recibir el transcript y ANTES de marcar como completed, agregar la destilación:

```javascript
// Dentro de closeMeeting() o el endpoint close:

// 1. Si el transcript es un .docx (Buffer), convertir a .md
let transcriptText = meeting.transcript_text; // o como esté guardado

// Si viene como archivo subido (.docx buffer):
// transcriptText = await convertDocxToMd(fileBuffer);

// 2. Extraer solo la sección de transcripción
const transcriptOnly = extractTranscriptSection(transcriptText);

// 3. Destilar notas si hay transcripción Y agenda
if (transcriptOnly && meeting.agenda && meeting.agenda.length > 0) {
  try {
    const distilledNotes = await distillMeetingNotes(transcriptOnly, meeting.agenda);
    if (distilledNotes.length > 0) {
      // Merge: preservar notas manuales que el usuario ya escribió
      const manualNotes = (meeting.post_notes || []).filter(pn => pn.source !== 'kimi-distill');
      const mergedNotes = [...manualNotes, ...distilledNotes];

      await supabase
        .from('mgmt_meetings')
        .update({ post_notes: mergedNotes })
        .eq('id', meetingId);
    }
  } catch (err) {
    console.error('Distill failed (non-blocking):', err.message);
    // No bloquear el cierre si Kimi falla
  }
}

// 4. Continuar con el flujo normal: marcar completed, guardar .md en BÓVEDA, etc.
```

**Importante:** La destilación es **non-blocking**. Si Kimi falla, el cierre de reunión continúa normalmente. Las notas se pueden agregar después.

---

## PASO 6: Endpoint para upload de .docx con conversión

Si no existe, crear o modificar el endpoint de upload de transcripción para aceptar .docx y convertir:

```javascript
// En server.js, donde se maneja el upload de transcripción:
// Detectar si es .docx por extension o content-type

if (filename.endsWith('.docx')) {
  const mammoth = require('mammoth');
  const mdResult = await mammoth.convertToMarkdown({ buffer: fileBuffer });
  transcriptText = mdResult.value;
} else {
  // .txt o .md — usar como está
  transcriptText = fileBuffer.toString('utf-8');
}
```

---

## PASO 7: Exportar funciones nuevas

En `module.exports` de db.js, agregar:

```javascript
convertDocxToMd,
extractTranscriptSection,
distillMeetingNotes,
```

---

## VERIFICACIÓN

1. Reiniciar server
2. Crear reunión con 3 temas de agenda
3. Subir un .docx de Notas de Gemini como transcripción
4. Cerrar la reunión
5. Verificar en la vista interna que aparecen post-notas por tema con:
   - Resumen de lo discutido
   - Decisiones
   - Action items con responsable
   - Citas clave
   - Temas emergentes (si los hubo)
6. Verificar en Supabase que `post_notes` tiene el JSONB con source: 'kimi-distill'

---

## CHECKLIST

- [ ] `npm install mammoth` en agent-dashboard
- [ ] `convertDocxToMd()` funciona con .docx de Notas de Gemini
- [ ] `extractTranscriptSection()` extrae solo la parte después de "📖 Transcripción"
- [ ] `distillMeetingNotes()` llama a Kimi y devuelve post-notas estructuradas
- [ ] Integrado en `closeMeeting()` — destila ANTES de marcar completed
- [ ] Non-blocking — si Kimi falla, el cierre continúa
- [ ] Merge: notas manuales del usuario se preservan, no se sobreescriben
- [ ] Upload de .docx convierte a .md automáticamente
- [ ] Post-notas aparecen en la vista interna de la reunión
