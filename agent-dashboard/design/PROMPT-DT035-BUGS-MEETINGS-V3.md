# PROMPT: Fix bugs del Meetings Hub — Ronda 2

> **Para:** CTO Jr (Claude Code operativo)
> **Scope:** db.js + server.js + index.html
> **Prioridad:** Alta — el cierre de reunión no destila ni genera documento

**Bugs 1-3 de la ronda anterior ya están fixeados.** Este prompt cubre los problemas restantes, diagnosticados con datos reales de Supabase.

---

## DIAGNÓSTICO (datos reales de la reunión `a4b499b6`)

```
Reunión: RECKLESS - PREPRODUCCION VIDEOCLIP XXX
meeting_status: completed
agenda: []                    ← VACÍA — por eso Kimi no destiló
post_notes: []                ← VACÍAS — consecuencia de agenda vacía
document_path: NULL           ← No se generó .md en BÓVEDA
transcript_text: 205,009 chars ← ES HTML, NO MARKDOWN
transcript_text empieza con: <a id="_hk6kg06b69i4"></a>__📝 Las notas__
```

**3 problemas de raíz:**
1. mammoth convierte a HTML, no a markdown → los regex de `extractTranscriptSection()` no matchean
2. `distillMeetingNotes()` tiene guard `if (!agenda || agenda.length === 0) return []` — correcto, pero el cierre no debería completar sin advertir que no hubo destilación
3. `closeMeeting()` no genera .md en BÓVEDA ni guarda `document_path`

---

## BUG A: mammoth produce HTML, no markdown

**Causa raíz:** `mammoth.convertToMarkdown()` NO existe como función estándar. `mammoth.convertToHtml()` es lo correcto, y después se necesita convertir HTML → texto plano/markdown.

**Fix en db.js — `convertDocxToMd()`:**

```javascript
async function convertDocxToMd(buffer) {
  const mammoth = require('mammoth');
  // mammoth produce HTML — extraemos el texto sin tags
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value;
  
  // Convertir HTML a texto legible preservando estructura
  let text = html
    // Headers
    .replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi, (_, level, content) => {
      return '#'.repeat(parseInt(level)) + ' ' + stripTags(content) + '\n\n';
    })
    // Bold → markdown bold (preservar __Nombre:__ del formato Gemini)
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    // Italic
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    // Links
    .replace(/<a[^>]+href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    // List items
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    // Paragraphs y line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    // Limpiar tags restantes
    .replace(/<[^>]+>/g, '')
    // Limpiar entidades HTML
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Limpiar whitespace excesivo
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return text;
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '');
}
```

**Alternativa más simple** — usar `mammoth.extractRawText()`:

```javascript
async function convertDocxToMd(buffer) {
  const mammoth = require('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
```

`extractRawText()` devuelve texto plano sin tags. Pierde formato pero los markers de Gemini (`📝 Las notas`, `📖 Transcripción`, `__Nombre:__`) se preservan porque son texto, no markup HTML.

**Recomendación:** Usar `extractRawText()` — es más simple y los markers de Gemini que necesitamos son texto plano.

---

## BUG B: `extractTranscriptSection()` no matchea en HTML

Depende del fix de Bug A. Si se usa `extractRawText()`, los markers ya están en texto plano y los regex actuales deberían funcionar. Pero verificar que matcheen con el formato real.

**El formato real del transcript de Gemini después de extractRawText() será algo como:**

```
📝 Las notas
jun 30, 2026
RECKLESS - SHOWSET
...resumen...

📖 Transcripción
00:00:01
Ian Villaveces:
Texto del hablante...

00:05:30
RECKLESS MUSIC (La maniatica):
Texto del artista...
```

**Verificar que los regex del `extractTranscriptSection()` matchean:**

```javascript
function extractTranscriptSection(text) {
  const markers = [
    /📖\s*Transcripción/i,
    /Transcripci[oó]n\s*$/im
  ];
  // ... rest of function
}
```

Agregar variante sin emoji por si `extractRawText()` lo pierde.

---

## BUG C: `closeMeeting()` no genera .md en BÓVEDA ni guarda `document_path`

**Fix en db.js — dentro de `closeMeeting()`, DESPUÉS de la destilación y ANTES de marcar completed:**

```javascript
const fs = require('fs');
const path = require('path');

// Obtener el slug del artista
const { data: artist } = await supabase
  .from('artists')
  .select('slug')
  .eq('id', meeting.artist_id)
  .single();

if (artist?.slug) {
  // Generar contenido del .md
  let mdContent = `# ${meeting.title || 'Reunión sin título'}\n\n`;
  mdContent += `- **Fecha:** ${new Date(meeting.scheduled_at).toLocaleDateString('es-CO')}\n`;
  mdContent += `- **Tipo:** ${meeting.meeting_type || 'general'}\n`;
  mdContent += `- **Estado:** completed\n\n`;

  // Agenda
  if (meeting.agenda && meeting.agenda.length > 0) {
    mdContent += `## Agenda\n\n`;
    meeting.agenda.forEach(a => {
      const check = a.done ? '☑' : '☐';
      mdContent += `${check} ${a.topic || a}\n`;
    });
    mdContent += '\n';
  }

  // Post-notas destiladas
  const postNotes = /* las post-notas que se calcularon arriba */ [];
  if (postNotes.length > 0) {
    mdContent += `## Notas por Tema (Auto-destilado por Kimi)\n\n`;
    for (const n of postNotes) {
      mdContent += `### ${n.topic}\n`;
      mdContent += `**Estado:** ${n.status}\n\n`;
      if (n.note) mdContent += `${n.note}\n\n`;
      
      if (n.decisions?.length) {
        mdContent += `**Decisiones:**\n`;
        n.decisions.forEach(d => mdContent += `- ${d}\n`);
        mdContent += '\n';
      }
      if (n.action_items?.length) {
        mdContent += `**Tareas:**\n`;
        n.action_items.forEach(a => {
          const resp = a.responsible ? ` → ${a.responsible}` : '';
          mdContent += `- ${a.task || a}${resp}\n`;
        });
        mdContent += '\n';
      }
      if (n.key_quotes?.length) {
        mdContent += `**Citas clave:**\n`;
        n.key_quotes.forEach(q => mdContent += `> "${q}"\n`);
        mdContent += '\n';
      }
    }
  }

  // Notas generales (si las hay)
  if (meeting.notes) {
    mdContent += `## Notas Generales\n\n${meeting.notes}\n\n`;
  }

  // Guardar archivo
  const BOVEDA_PATH = path.resolve(__dirname, '..');
  const slug = artist.slug;
  const typeSlug = (meeting.meeting_type || 'general').toLowerCase();
  const titleSlug = (meeting.title || 'reunion').toLowerCase()
    .replace(/[^a-z0-9áéíóúñü]+/g, '-')
    .replace(/^-|-$/g, '');
  const filename = `${typeSlug}-${titleSlug}-${Date.now()}.md`;
  const meetingDir = path.join(BOVEDA_PATH, '06_CLIENTES', slug, 'mgmt', 'meetings');
  
  fs.mkdirSync(meetingDir, { recursive: true });
  const filePath = path.join(meetingDir, filename);
  fs.writeFileSync(filePath, mdContent, 'utf-8');

  // Guardar ruta relativa en Supabase
  const relativePath = `06_CLIENTES/${slug}/mgmt/meetings/${filename}`;
  await supabase
    .from('mgmt_meetings')
    .update({ document_path: relativePath })
    .eq('id', meetingId);
}
```

**IMPORTANTE:** La variable `BOVEDA_PATH` debe apuntar a la raíz de la BÓVEDA. Actualmente `__dirname` es `agent-dashboard/`, así que `path.resolve(__dirname, '..')` te da la raíz del repo. Verificar que sea correcto.

---

## BUG D: Vista interna muestra "Sin documento" para reuniones del Hub

**Síntoma:** En la bitácora de la vista interna del artista, al hacer click en una reunión del Hub se ve "Sin documento".

**Causa:** La función que abre el detalle busca un archivo .md por `document_path`. Las reuniones del Hub guardan datos en Supabase (JSONB), no en archivo. Aunque el Bug C genera el .md, la vista interna debe TAMBIÉN poder renderizar desde los datos de Supabase.

**Fix en index.html — modificar la función que renderiza el detalle de reunión:**

```javascript
// En la función que abre el detalle de una reunión:
if (meeting.document_path) {
  // Modo legacy — leer .md de BÓVEDA (comportamiento actual, no cambiar)
  renderLegacyMeetingDetail(meeting);
} else if (meeting.post_notes?.length > 0 || meeting.agenda?.length > 0) {
  // Modo Hub — renderizar desde datos de Supabase
  renderHubMeetingDetail(meeting);
} else {
  showModal('Sin documento ni notas disponibles');
}

function renderHubMeetingDetail(meeting) {
  let html = '';
  
  // Header
  html += `<h3>${meeting.title || 'Reunión'}</h3>`;
  html += `<p style="color: var(--gs-text-3)">`;
  html += `${new Date(meeting.scheduled_at).toLocaleDateString('es-CO')}`;
  html += ` | ${meeting.meeting_type || 'general'}`;
  const statusColor = meeting.meeting_status === 'completed' ? 'var(--neon-green)' : 'var(--neon-orange)';
  html += ` | <span style="color: ${statusColor}">${meeting.meeting_status?.toUpperCase()}</span>`;
  html += `</p>`;
  
  // Agenda
  if (meeting.agenda?.length > 0) {
    html += '<h4 style="margin-top: 16px">AGENDA</h4><ul>';
    for (const item of meeting.agenda) {
      const check = item.done ? '☑' : '☐';
      html += `<li>${check} ${item.topic || item}</li>`;
    }
    html += '</ul>';
  }
  
  // Post-notas destiladas
  if (meeting.post_notes?.length > 0) {
    html += '<h4 style="margin-top: 16px">NOTAS POR TEMA</h4>';
    for (const note of meeting.post_notes) {
      html += `<div style="margin-bottom: 16px; padding: 12px; background: var(--gs-surf-2); border-radius: 8px; border-left: 3px solid var(--neon-violet);">`;
      html += `<strong>${note.topic}</strong>`;
      if (note.source === 'kimi-distill') {
        html += ` <span style="color: var(--gs-text-3); font-size: 0.75em; background: var(--gs-surf-2); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--gs-bd-07)">AUTO-DESTILADO</span>`;
      }
      if (note.status && note.status !== 'discussed') {
        const statusColors = { briefly_mentioned: 'var(--neon-orange)', not_discussed: 'var(--gs-text-3)', emerging: 'var(--neon-green)' };
        html += ` <span style="color: ${statusColors[note.status] || 'var(--gs-text-3)'}; font-size: 0.75em">${note.status.toUpperCase()}</span>`;
      }
      if (note.note) html += `<p style="margin: 8px 0">${note.note}</p>`;
      
      if (note.decisions?.length > 0) {
        html += '<p style="margin: 4px 0"><strong>Decisiones:</strong></p><ul>';
        note.decisions.forEach(d => html += `<li>${d}</li>`);
        html += '</ul>';
      }
      
      if (note.action_items?.length > 0) {
        html += '<p style="margin: 4px 0"><strong>Tareas:</strong></p><ul>';
        note.action_items.forEach(a => {
          const resp = a.responsible ? ` → <span style="color: var(--neon-orange)">${a.responsible}</span>` : '';
          html += `<li>${a.task || a}${resp}</li>`;
        });
        html += '</ul>';
      }
      
      if (note.key_quotes?.length > 0) {
        html += '<p style="margin: 4px 0"><strong>Citas clave:</strong></p>';
        note.key_quotes.forEach(q => {
          html += `<blockquote style="border-left: 2px solid var(--neon-violet); padding-left: 8px; margin: 4px 0; color: var(--gs-text-3); font-style: italic;">"${q}"</blockquote>`;
        });
      }
      
      html += '</div>';
    }
  }
  
  // Notas generales
  if (meeting.notes) {
    html += `<h4 style="margin-top: 16px">NOTAS GENERALES</h4>`;
    html += `<p>${meeting.notes}</p>`;
  }
  
  showModal(html);
}
```

---

## TAMBIÉN: Fix para transcript_text existente (reunión `a4b499b6`)

La reunión PREPRODUCCION VIDEOCLIP XXX ya tiene `transcript_text` guardado como HTML (205K chars). Para re-procesarla sin tener que volver a subir el .docx, agregar un endpoint temporal o ejecutar este query directo:

Opción: re-convertir el transcript_text existente limpiando tags HTML:

```javascript
// Ejecutar una vez para limpiar el transcript_text existente:
const { data: meeting } = await supabase
  .from('mgmt_meetings')
  .select('transcript_text')
  .eq('id', 'a4b499b6-670c-4dc5-a19b-117baca557a7')
  .single();

if (meeting?.transcript_text) {
  const clean = meeting.transcript_text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  await supabase
    .from('mgmt_meetings')
    .update({ transcript_text: clean })
    .eq('id', 'a4b499b6-670c-4dc5-a19b-117baca557a7');
}
```

---

## VERIFICACIÓN

### Bug A (mammoth HTML → texto):
- [ ] Subir .docx de Notas de Gemini → `transcript_text` en Supabase NO tiene tags HTML
- [ ] El texto preserva los markers: `📝 Las notas`, `📖 Transcripción`, `__Nombre:__`

### Bug B (extractTranscriptSection):
- [ ] `extractTranscriptSection(transcriptText)` devuelve solo la parte después de `📖 Transcripción`
- [ ] Si no encuentra el marker, devuelve `null` (no crashea)

### Bug C (generar .md en BÓVEDA):
- [ ] Después de cerrar reunión → archivo .md existe en `06_CLIENTES/<slug>/mgmt/meetings/`
- [ ] `document_path` en Supabase apunta al archivo
- [ ] El .md contiene agenda + notas destiladas

### Bug D (vista interna):
- [ ] Click en reunión del Hub con post_notes → muestra detalle renderizado con agenda, notas por tema, decisiones, tareas, citas
- [ ] Click en reunión legacy con document_path → sigue mostrando el .md como antes
- [ ] Badge "AUTO-DESTILADO" visible en notas de Kimi

### Test end-to-end:
- [ ] Crear reunión con 3 temas de agenda
- [ ] Subir .docx de Notas de Gemini
- [ ] Cerrar reunión → toast "Procesando..." → destilación → toast final → vuelve a la lista
- [ ] En Supabase: `post_notes` tiene contenido con `source: 'kimi-distill'`
- [ ] En BÓVEDA: archivo .md generado con agenda + notas
- [ ] En vista interna del artista: reunión aparece, click muestra notas destiladas

---

## ORDEN DE EJECUCIÓN

1. **Bug A** — Fix mammoth (usar `extractRawText()`) — sin esto, nada funciona
2. **Bug B** — Verificar que `extractTranscriptSection()` matchea
3. **Bug C** — Generar .md en BÓVEDA en `closeMeeting()`
4. **Bug D** — Vista interna renderiza desde Supabase
5. **Fix one-time** — Limpiar transcript_text de la reunión `a4b499b6`
