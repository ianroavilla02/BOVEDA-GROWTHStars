# PROMPT: Preview de destilación + Puente Hub → Vista Interna MGMT

> **Para:** CTO Jr (Claude Code operativo)
> **Scope:** db.js + server.js + index.html
> **Prioridad:** Alta — completa el flujo end-to-end del Meetings Hub

---

## CONTEXTO

El destilador de Kimi YA FUNCIONA. La reunión "RECKLESS - PREPRODUCCION VIDEOCLIP XXX" destiló correctamente:
- 3 temas de agenda → resumen + decisiones + action_items + citas clave
- 2 temas emergentes detectados automáticamente
- 12 decisiones, 8 action items con responsable, citas textuales

**Pero hay 2 gaps:**

1. **No hay preview** — Al cerrar reunión, Kimi destila y guarda directo sin que el usuario pueda validar el resultado. El usuario quiere ver y editar las post-notas ANTES de guardar definitivamente.

2. **No hay puente al sistema MGMT** — Las `post_notes` (JSONB) quedan en la reunión pero NO se mapean a `secondary_tasks` ni a `meeting_objective_links`. Las reuniones del sistema legacy (parseWithKimi) SÍ hacen esto automáticamente. Las del Hub, no.

---

## FEATURE 1: Preview de destilación antes de guardar

### Flujo actual (malo):
```
Click "Cerrar reunión" → confirm → Kimi destila → guarda → switchView('reuniones')
```

### Flujo nuevo (correcto):
```
Click "Cerrar reunión" → confirm → botón dice "DESTILANDO..."
→ Kimi destila → muestra PREVIEW en la misma página (reemplaza el panel derecho)
→ Usuario ve las post-notas destiladas por tema
→ Puede EDITAR notas, decisiones, action items inline
→ Click "CONFIRMAR Y GUARDAR" → guarda en Supabase + genera .md en BÓVEDA + vuelve a la lista
→ O click "DESCARTAR DESTILACIÓN" → cierra reunión sin post-notas
```

### Implementación en index.html

#### Paso 1: Separar el cierre en dos fases

El endpoint `POST /api/meetings/:id/close` debe aceptar un query param `?preview=true`:

- `preview=true`: Destila con Kimi pero NO guarda en Supabase ni genera .md. Devuelve las post-notas en el response para preview.
- Sin preview (o `preview=false`): Guarda todo definitivamente (comportamiento actual).

#### Paso 2: Nuevo endpoint o modificar el existente

En **server.js**, el endpoint de close:

```javascript
// POST /api/meetings/:id/close?preview=true
// Si preview=true: solo destila y devuelve resultado
// Si preview=false o no está: destila + guarda + genera .md

const preview = url.searchParams.get('preview') === 'true';

if (preview) {
  // Solo destilar, no guardar
  const meeting = await db.getMeetingDetail(meetingId);
  const transcript = meeting.transcript_text;
  const transcriptSection = db.extractTranscriptSection(transcript);
  
  let postNotes = [];
  if (transcriptSection && meeting.agenda?.length > 0) {
    postNotes = await db.distillMeetingNotes(transcriptSection, meeting.agenda);
  }
  
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ preview: true, post_notes: postNotes }));
  return;
}

// Flujo normal: guardar todo
// ... código existente de closeMeeting ...
```

#### Paso 3: Frontend — mostrar preview en el panel derecho

Modificar `closeMeeting()` en index.html:

```javascript
async function closeMeetingHub(meetingId) {
  if (!confirm('¿Cerrar esta reunión? Se procesará la transcripción con IA.')) return;
  
  const btn = document.querySelector('.close-meeting-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'DESTILANDO...'; }
  
  try {
    // FASE 1: Preview
    const previewRes = await fetch(`/api/meetings/${meetingId}/close?preview=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const previewData = await previewRes.json();
    
    if (previewData.error) {
      showToast('Error: ' + previewData.error);
      if (btn) { btn.disabled = false; btn.textContent = 'CERRAR REUNIÓN Y PROCESAR'; }
      return;
    }
    
    // Mostrar preview en el panel derecho
    renderDistillPreview(meetingId, previewData.post_notes);
    
  } catch (err) {
    showToast('Error al destilar: ' + err.message);
    if (btn) { btn.disabled = false; btn.textContent = 'CERRAR REUNIÓN Y PROCESAR'; }
  }
}
```

#### Paso 4: Renderizar el preview

```javascript
function renderDistillPreview(meetingId, postNotes) {
  // Reemplazar el panel derecho (CERRAR REUNIÓN) con el preview
  const rightPanel = document.querySelector('.meeting-detail-right') 
    || document.querySelector('.close-meeting-panel');
  
  if (!rightPanel) return;
  
  let html = `<h3 style="color: var(--neon-green); margin-bottom: 12px;">PREVIEW — DESTILACIÓN</h3>`;
  html += `<p style="color: var(--gs-text-3); font-size: 0.85em; margin-bottom: 16px;">Revisá y editá antes de guardar. Los campos son editables.</p>`;
  
  if (postNotes.length === 0) {
    html += `<p style="color: var(--neon-orange)">No se pudieron destilar notas. Verificá que la transcripción contiene la sección "📖 Transcripción" y que hay temas de agenda.</p>`;
    html += `<button onclick="confirmClose('${meetingId}', [])" style="width:100%; padding:12px; background: var(--gs-surf-2); border: 1px solid var(--gs-bd-07); color: var(--gs-text-1); border-radius: 8px; cursor: pointer; margin-top: 8px;">CERRAR SIN NOTAS</button>`;
    return;
  }
  
  postNotes.forEach((note, i) => {
    const isEmerging = note.status === 'emerging';
    const borderColor = isEmerging ? 'var(--neon-green)' : 'var(--neon-violet)';
    const badge = isEmerging ? '<span style="color: var(--neon-green); font-size: 0.75em; margin-left: 8px;">EMERGENTE</span>' : '';
    
    html += `<div style="margin-bottom: 16px; padding: 12px; background: var(--gs-surf-2); border-left: 3px solid ${borderColor}; border-radius: 0 8px 8px 0;" data-note-index="${i}">`;
    
    // Título del tema
    html += `<strong>${note.topic}</strong>${badge}`;
    
    // Resumen (editable)
    html += `<div style="margin: 8px 0;">`;
    html += `<label style="font-size: 0.75em; color: var(--gs-text-3);">RESUMEN</label>`;
    html += `<textarea class="distill-note" data-index="${i}" data-field="note" style="width:100%; min-height:60px; background: var(--gs-surf-1); border: 1px solid var(--gs-bd-07); color: var(--gs-text-1); border-radius: 4px; padding: 6px; font-size: 0.85em; resize: vertical;">${note.note || ''}</textarea>`;
    html += `</div>`;
    
    // Decisiones (editables)
    if (note.decisions?.length > 0) {
      html += `<div style="margin: 8px 0;">`;
      html += `<label style="font-size: 0.75em; color: var(--gs-text-3);">DECISIONES</label>`;
      note.decisions.forEach((d, di) => {
        html += `<div style="display:flex; align-items:center; gap:4px; margin: 2px 0;">`;
        html += `<span style="color: var(--neon-green);">✓</span>`;
        html += `<input type="text" class="distill-decision" data-index="${i}" data-di="${di}" value="${d.replace(/"/g, '&quot;')}" style="flex:1; background: var(--gs-surf-1); border: 1px solid var(--gs-bd-07); color: var(--gs-text-1); border-radius: 4px; padding: 4px 6px; font-size: 0.85em;">`;
        html += `<button onclick="this.parentElement.remove()" style="background:none; border:none; color: var(--neon-orange); cursor:pointer; font-size: 1.1em;">×</button>`;
        html += `</div>`;
      });
      html += `</div>`;
    }
    
    // Action Items (editables)
    if (note.action_items?.length > 0) {
      html += `<div style="margin: 8px 0;">`;
      html += `<label style="font-size: 0.75em; color: var(--gs-text-3);">TAREAS</label>`;
      note.action_items.forEach((a, ai) => {
        html += `<div style="display:flex; align-items:center; gap:4px; margin: 2px 0;">`;
        html += `<span>☐</span>`;
        html += `<input type="text" class="distill-task" data-index="${i}" data-ai="${ai}" value="${(a.task || a).replace(/"/g, '&quot;')}" style="flex:1; background: var(--gs-surf-1); border: 1px solid var(--gs-bd-07); color: var(--gs-text-1); border-radius: 4px; padding: 4px 6px; font-size: 0.85em;">`;
        html += `<span style="color: var(--neon-orange); font-size: 0.75em; white-space:nowrap;">${a.responsible || ''}</span>`;
        html += `<button onclick="this.parentElement.remove()" style="background:none; border:none; color: var(--neon-orange); cursor:pointer; font-size: 1.1em;">×</button>`;
        html += `</div>`;
      });
      html += `</div>`;
    }
    
    // Citas clave (solo lectura)
    if (note.key_quotes?.length > 0) {
      html += `<div style="margin: 8px 0;">`;
      html += `<label style="font-size: 0.75em; color: var(--gs-text-3);">CITAS</label>`;
      note.key_quotes.forEach(q => {
        html += `<blockquote style="border-left: 2px solid var(--neon-violet); padding-left: 8px; margin: 4px 0; color: var(--gs-text-3); font-style: italic; font-size: 0.85em;">"${q}"</blockquote>`;
      });
      html += `</div>`;
    }
    
    html += `</div>`;
  });
  
  // Botones de acción
  html += `<div style="display: flex; gap: 8px; margin-top: 16px;">`;
  html += `<button onclick="confirmClose('${meetingId}', collectEditedNotes())" style="flex:1; padding:12px; background: var(--neon-green); color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">CONFIRMAR Y GUARDAR</button>`;
  html += `<button onclick="confirmClose('${meetingId}', [])" style="padding:12px; background: var(--gs-surf-2); border: 1px solid var(--gs-bd-07); color: var(--gs-text-3); border-radius: 8px; cursor: pointer;">SIN NOTAS</button>`;
  html += `</div>`;
  
  rightPanel.innerHTML = html;
  // Scroll al preview
  rightPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
```

#### Paso 5: Recolectar notas editadas y confirmar

```javascript
function collectEditedNotes() {
  // Lee los valores editados del DOM y reconstruye post_notes
  const noteElements = document.querySelectorAll('[data-note-index]');
  const notes = [];
  
  noteElements.forEach(el => {
    const i = el.dataset.noteIndex;
    const note = {
      topic: el.querySelector('strong')?.textContent || '',
      note: el.querySelector(`.distill-note[data-index="${i}"]`)?.value || '',
      decisions: [],
      action_items: [],
      key_quotes: [],
      source: 'kimi-distill',
      status: el.querySelector('[style*="EMERGENTE"]') ? 'emerging' : 'discussed'
    };
    
    // Recolectar decisiones editadas
    el.querySelectorAll(`.distill-decision[data-index="${i}"]`).forEach(inp => {
      if (inp.value.trim()) note.decisions.push(inp.value.trim());
    });
    
    // Recolectar tareas editadas
    el.querySelectorAll(`.distill-task[data-index="${i}"]`).forEach(inp => {
      const responsible = inp.parentElement.querySelector('[style*="neon-orange"]')?.textContent?.trim() || '';
      if (inp.value.trim()) {
        note.action_items.push({ task: inp.value.trim(), responsible });
      }
    });
    
    // Citas (no editables, preservar)
    el.querySelectorAll('blockquote').forEach(bq => {
      const text = bq.textContent.replace(/^"|"$/g, '').trim();
      if (text) note.key_quotes.push(text);
    });
    
    notes.push(note);
  });
  
  return notes;
}

async function confirmClose(meetingId, postNotes) {
  const btn = document.querySelector('[onclick*="confirmClose"]');
  if (btn) { btn.disabled = true; btn.textContent = 'GUARDANDO...'; }
  
  try {
    const res = await fetch(`/api/meetings/${meetingId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_notes: postNotes })
    });
    const result = await res.json();
    
    if (result.error) {
      showToast('Error: ' + result.error);
      return;
    }
    
    showToast('Reunión cerrada y guardada en BÓVEDA');
    switchView('reuniones');
  } catch (err) {
    showToast('Error al guardar: ' + err.message);
  }
}
```

#### Paso 6: Backend acepta post_notes del body

En **server.js**, el endpoint `POST /api/meetings/:id/close` (sin `?preview=true`):

```javascript
// Si el body trae post_notes, usar esas (vienen del preview editado)
// Si no, destilar con Kimi como antes

const body = await parseBody(req);
let postNotes = body.post_notes; // Puede ser [] o un array de notas editadas

if (!postNotes) {
  // Fallback: destilar con Kimi (por si se llama sin preview)
  const transcriptSection = db.extractTranscriptSection(meeting.transcript_text);
  if (transcriptSection && meeting.agenda?.length > 0) {
    postNotes = await db.distillMeetingNotes(transcriptSection, meeting.agenda);
  } else {
    postNotes = [];
  }
}

// Guardar post_notes
await supabase.from('mgmt_meetings').update({ 
  post_notes: postNotes,
  meeting_status: 'completed',
  held_at: new Date().toISOString()
}).eq('id', meetingId);

// Generar .md en BÓVEDA (código existente)
// ... 

// NUEVO: Puente a MGMT (Feature 2 de este prompt)
// ...
```

---

## FEATURE 2: Puente Hub → Sistema MGMT (secondary_tasks + objective_links)

### Contexto: qué hace el sistema legacy

La función `parseWithKimi()` en db.js (línea ~905) ya extrae `secondary_tasks` y `objetivo_links` del texto de la reunión. Después, la función que crea la reunión legacy (línea ~1005) inserta automáticamente en:

- **`secondary_tasks`** — tabla con: `client_id`, `meeting_id`, `descripcion`, `assigned_to`, `status`, `para_cristian`
- **`meeting_objective_links`** — tabla con: `meeting_id`, `objective_id`, `confirmed`, `rationale`

Las reuniones del Hub tienen los datos en `post_notes` JSONB pero NO los mapean a estas tablas.

### Lo que hay que hacer

Después de guardar las `post_notes` (Feature 1, paso de confirmación), para artistas con MGMT activo:

```javascript
// DENTRO del endpoint close (sin preview), DESPUÉS de guardar post_notes:

// 1. Verificar si el artista tiene MGMT activo
const { data: engagement } = await supabase
  .from('mgmt_engagements')
  .select('id, client_id')
  .eq('artist_id', meeting.artist_id)
  .eq('engagement_status', 'active')
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

if (engagement) {
  // 2. Mapear action_items → secondary_tasks
  const allActionItems = postNotes.flatMap(n => 
    (n.action_items || []).map(a => ({
      client_id: engagement.client_id,
      artist_id: meeting.artist_id,
      meeting_id: meetingId,
      descripcion: typeof a === 'string' ? a : a.task,
      assigned_to: mapResponsible(typeof a === 'string' ? 'ian' : a.responsible),
      status: 'pendiente',
      para_cristian: mapResponsible(a.responsible) === 'cristian'
    }))
  );
  
  if (allActionItems.length > 0) {
    const { error: stErr } = await supabase
      .from('secondary_tasks')
      .insert(allActionItems);
    if (stErr) console.warn('secondary_tasks insert error:', stErr.message);
  }
  
  // 3. Sugerir objective_links basados en los temas discutidos
  // Obtener objetivos activos del engagement
  const { data: objectives } = await supabase
    .from('mgmt_objectives')
    .select('id, number, title, status')
    .eq('engagement_id', engagement.id)
    .in('status', ['active', 'on_track', 'at_risk']);
  
  if (objectives?.length > 0) {
    // Usar Kimi para sugerir qué objetivos se relacionan con cada tema
    const suggestedLinks = await suggestObjectiveLinks(postNotes, objectives, meetingId);
    
    if (suggestedLinks.length > 0) {
      const { error: linkErr } = await supabase
        .from('meeting_objective_links')
        .insert(suggestedLinks);
      if (linkErr) console.warn('meeting_objective_links insert error:', linkErr.message);
    }
  }
}
```

### Función auxiliar: mapResponsible

```javascript
function mapResponsible(name) {
  if (!name) return 'ian';
  const lower = name.toLowerCase().trim();
  // Mapear nombres comunes a los válidos del sistema
  if (lower.includes('cristian') || lower.includes('chris')) return 'cristian';
  if (lower.includes('santiago') || lower.includes('santi') || lower.includes('sancor')) return 'santiago';
  if (lower.includes('ian')) return 'ian';
  if (lower.includes('reckless') || lower.includes('artista') || lower.includes('ery') || lower.includes('jot4') || lower.includes('marlon') || lower.includes('javier')) return 'artista';
  return 'ian'; // default
}
```

### Función auxiliar: suggestObjectiveLinks (usa Kimi)

```javascript
async function suggestObjectiveLinks(postNotes, objectives, meetingId) {
  const topicsSummary = postNotes.map(n => 
    `- ${n.topic}: ${n.note || ''}`
  ).join('\n');
  
  const objectivesList = objectives.map(o => 
    `[ID:${o.id}] #${o.number} "${o.title}" (${o.status})`
  ).join('\n');
  
  const result = await callMoonshot([
    { role: 'system', content: 'Eres un asistente que relaciona temas de reuniones con objetivos de un plan. Responde SOLO JSON.' },
    { role: 'user', content: `Dado estos TEMAS discutidos en la reunión:\n${topicsSummary}\n\nY estos OBJETIVOS activos:\n${objectivesList}\n\nIdentificá qué objetivos se relacionan con los temas discutidos. Solo incluí matches reales, no forzados.\n\nFormato JSON:\n[{"objective_id":"uuid","rationale":"por qué se relaciona en 1 frase"}]` }
  ], { temperature: 1, max_tokens: 2000 });
  
  let parsed = [];
  try {
    const cleaned = (result.content || '').replace(/```json\n?|\n?```/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.warn('suggestObjectiveLinks parse error:', e.message);
    return [];
  }
  
  // Validar que los objective_id existen
  const validIds = new Set(objectives.map(o => o.id));
  return parsed
    .filter(l => validIds.has(l.objective_id))
    .map(l => ({
      meeting_id: meetingId,
      objective_id: l.objective_id,
      confirmed: false, // El usuario debe confirmar
      rationale: l.rationale || null
    }));
}
```

### IMPORTANTE: artist_id en secondary_tasks

La tabla `secondary_tasks` tiene `client_id` (sistema legacy) pero las reuniones del Hub usan `artist_id`. Verificar si la tabla tiene columna `artist_id`:

- Si la tiene → usarla
- Si NO → agregarla con: `ALTER TABLE secondary_tasks ADD COLUMN artist_id UUID REFERENCES artists(id);`

Buscar el `client_id` a partir del engagement: `engagement.client_id`.

---

## VERIFICACIÓN

### Feature 1 — Preview:
- [ ] Click "Cerrar reunión" → botón dice "DESTILANDO..." → preview aparece en panel derecho
- [ ] Preview muestra notas por tema con resumen, decisiones, tareas, citas
- [ ] Campos editables: resumen (textarea), decisiones (inputs), tareas (inputs)
- [ ] Botón × elimina una decisión o tarea
- [ ] "CONFIRMAR Y GUARDAR" → guarda las notas editadas + genera .md + vuelve a lista
- [ ] "SIN NOTAS" → cierra reunión sin post_notes
- [ ] Si no hay transcript o agenda → preview dice "No se pudieron destilar notas"

### Feature 2 — Puente MGMT:
- [ ] Cerrar reunión de artista con MGMT activo → `secondary_tasks` creadas automáticamente
- [ ] Cada action_item mapeado al responsable correcto (ian/cristian/santiago/artista)
- [ ] `meeting_objective_links` sugeridos por Kimi con `confirmed: false`
- [ ] En la vista interna del artista: tareas secundarias aparecen en MISIONES SECUNDARIAS
- [ ] En la vista interna: enlaces a objetivos aparecen como "Enlace sugerido" (no confirmado)
- [ ] El usuario puede confirmar/rechazar enlaces desde la vista interna (comportamiento existente)

### Test end-to-end completo:
- [ ] Crear reunión con 3 temas → subir .docx → cerrar → ver preview
- [ ] Editar 1 decisión, eliminar 1 tarea → confirmar
- [ ] En Supabase: `post_notes` tiene las ediciones, `document_path` apunta a .md
- [ ] En Supabase: `secondary_tasks` tiene las tareas del artista
- [ ] En Supabase: `meeting_objective_links` tiene los enlaces sugeridos
- [ ] En vista interna de Reckless: reunión aparece con tareas, enlaces y detalle

---

## ORDEN DE EJECUCIÓN

1. **Feature 1** — Preview de destilación (backend `?preview=true` + frontend render + confirm)
2. **Feature 2** — Puente a MGMT (secondary_tasks + objective_links dentro del close definitivo)
3. **Verificación** end-to-end
