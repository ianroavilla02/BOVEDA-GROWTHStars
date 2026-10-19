# PROMPT: Meetings Hub V2 — Corrección de flujo + Cierre con transcripción (DT-035)

> **Para:** CTO Jr (Claude Code operativo)
> **Scope:** Corregir flujo de Reuniones: solo meetings pendientes, cierre con transcripción, vínculo MGMT condicional
> **Archivos target:** `agent-dashboard/index.html`, `agent-dashboard/server.js`, `agent-dashboard/db.js`
> **Referencia:** PROMPT-DT035-MEETINGS-HUB.md (prompt base ya implementado parcialmente)
> **Prioridad:** Alta — DT-035

---

## CONTEXTO Y CAMBIOS DE FLUJO

El prompt base (PROMPT-DT035-MEETINGS-HUB.md) se implementó parcialmente. El CTO Jr creó la vista lista y el sidebar, pero:

1. **El botón "+ Nueva Reunión" no funciona** — la función `openNewMeetingModal()` no se implementó o no se conectó
2. **El flujo de la sección cambió** — Reuniones es un INBOX de reuniones pendientes, NO un archivo histórico

### Flujo correcto:

```
PLANIFICAR → Crear reunión en sección Reuniones (agenda + onboardings)
EJECUTAR   → Hacer la call con el artista
CERRAR     → Subir transcripción del Meet EN la reunión
             → Sistema destila notas por tema de agenda
             → Si artista tiene MGMT active → vincular a objetivos + extraer secondary_tasks
             → Si artista tiene MGMT paused/inactive/sin artista → solo destilar, NO vincular
             → Guardar .md comprimido en BOVEDA (06_CLIENTES/<slug>/mgmt/meetings/)
             → Cerrar reunión (status = 'completed')
             → Desaparece de la sección Reuniones
VER HISTORIAL → Las reuniones cerradas se ven SOLO desde la vista interna del artista
```

### Reglas clave:
- La sección "Reuniones" muestra SOLO meetings con `status = 'scheduled'`
- NO mostrar completadas ni canceladas en esta sección
- Las completadas aparecen en la vista interna del artista (ya existe `loadClientMeetingsPanel`)
- La transcripción se sube UNA sola vez (en Reuniones) y el sistema distribuye

---

## PASO 1: CORREGIR — Vista lista solo muestra pendientes (`index.html`)

Buscar la función `renderReuniones()` y modificarla:

### Antes (muestra todas agrupadas):
```javascript
const upcoming = meetings.filter(m => m.status === 'scheduled');
const completed = meetings.filter(m => m.status === 'completed');
const cancelled = meetings.filter(m => m.status === 'cancelled');
```

### Después (solo pendientes):
```javascript
const pending = meetings.filter(m => m.status === 'scheduled');
```

### Modificar el endpoint para filtrar por defecto:

En `renderReuniones()`, cambiar el fetch:

```javascript
const res = await fetch('/api/meetings?status=scheduled');
```

### Modificar el HTML de la lista:

Reemplazar TODO el bloque de secciones (Próximas/Completadas/Canceladas) por:

```javascript
content.innerHTML = `
  <div>
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
      <div>
        <h2 style="font-size:18px; font-weight:700; color:var(--text); margin:0;">Reuniones pendientes</h2>
        <div style="font-size:12px; color:var(--text-dim); margin-top:4px;">${pending.length} reunión${pending.length !== 1 ? 'es' : ''} agendada${pending.length !== 1 ? 's' : ''}</div>
      </div>
      <button class="modal-btn confirm" onclick="openNewMeetingModal()" style="font-size:12px; padding:8px 16px;">
        + Nueva Reunión
      </button>
    </div>

    ${pending.length > 0
      ? pending.map(renderMeetingCard).join('')
      : '<div style="padding:40px; text-align:center; color:var(--text-dim); font-size:13px;">No hay reuniones pendientes. Creá una con el botón de arriba.</div>'
    }
  </div>
`;
```

---

## PASO 2: CORREGIR — Botón "+ Nueva Reunión" (`index.html`)

Verificar que la función `openNewMeetingModal()` existe y funciona. Si no existe, implementarla completa. Si existe pero no se conecta al click, verificar que el onclick está bien.

La función debe:
1. Cargar la lista de artistas desde `/api/artists`
2. Mostrar modal con: título, fecha, tipo, artista (select), agenda dinámica
3. Al guardar, hacer POST a `/api/meetings`

### Función completa (si no existe o está rota):

```javascript
let newMeetingAgenda = [];

async function openNewMeetingModal() {
  newMeetingAgenda = [];
  let artists = [];
  try {
    const res = await fetch('/api/artists');
    const data = await res.json();
    artists = data.artists || [];
  } catch (err) { console.error(err); }

  const today = new Date().toISOString().split('T')[0];

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:560px;">
      <div class="modal-header">
        <h3 class="modal-title">Nueva Reunión</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
      </div>
      <div class="modal-body" style="padding:20px;">

        <div style="margin-bottom:14px;">
          <label class="modal-label">Título</label>
          <input type="text" class="modal-input" id="new-mtg-title" placeholder="Ej: Seguimiento semanal con Reckless">
        </div>

        <div style="display:flex; gap:12px; margin-bottom:14px;">
          <div style="flex:1;">
            <label class="modal-label">Fecha</label>
            <input type="date" class="modal-input" id="new-mtg-date" value="${today}">
          </div>
          <div style="flex:1;">
            <label class="modal-label">Tipo</label>
            <select class="modal-select" id="new-mtg-type">
              <option value="seguimiento">Seguimiento</option>
              <option value="onboarding">Onboarding</option>
              <option value="revision">Revisión</option>
              <option value="planificacion">Planificación</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>

        <div style="margin-bottom:14px;">
          <label class="modal-label">Artista</label>
          <select class="modal-select" id="new-mtg-artist">
            <option value="">— Sin artista —</option>
            ${artists.map(a => '<option value="' + a.id + '">' + escapeHtml(a.artist_name || a.name) + '</option>').join('')}
          </select>
        </div>

        <div style="margin-bottom:14px;">
          <label class="modal-label">Agenda — Temas a tratar</label>
          <div id="new-mtg-agenda-list"></div>
          <div style="display:flex; gap:8px; margin-top:8px;">
            <input type="text" class="modal-input" id="new-mtg-agenda-input" placeholder="Tema a tratar..." style="flex:1;"
              onkeydown="if(event.key==='Enter'){event.preventDefault();addNewMtgAgendaItem();}">
            <button class="modal-btn cancel" onclick="addNewMtgAgendaItem()" style="font-size:11px; padding:6px 12px; white-space:nowrap;">+ Tema</button>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
          <button class="modal-btn cancel" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
          <button class="modal-btn confirm" onclick="saveNewMeeting()">Crear Reunión</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function addNewMtgAgendaItem() {
  const input = document.getElementById('new-mtg-agenda-input');
  if (!input) return;
  const topic = input.value.trim();
  if (!topic) return;

  newMeetingAgenda.push({
    id: crypto.randomUUID(),
    topic: topic,
    onboarding: '',
    done: false
  });
  input.value = '';
  renderNewMtgAgendaList();
}

function renderNewMtgAgendaList() {
  const container = document.getElementById('new-mtg-agenda-list');
  if (!container) return;
  container.innerHTML = newMeetingAgenda.map((item, i) => `
    <div style="display:flex; align-items:flex-start; gap:8px; margin-bottom:8px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:8px; padding:10px 12px;">
      <div style="flex:1; min-width:0;">
        <div style="font-size:12px; font-weight:600; color:var(--text);">${escapeHtml(item.topic)}</div>
        <input type="text" class="modal-input" placeholder="Onboarding previo (opcional)..." value="${escapeHtml(item.onboarding)}"
          onchange="newMeetingAgenda[${i}].onboarding = this.value"
          style="margin-top:6px; font-size:11px; padding:4px 8px;">
      </div>
      <button onclick="newMeetingAgenda.splice(${i}, 1); renderNewMtgAgendaList();"
        style="background:none; border:none; color:var(--text-dim); cursor:pointer; font-size:14px; padding:2px;">✕</button>
    </div>
  `).join('');
}

async function saveNewMeeting() {
  const title = document.getElementById('new-mtg-title')?.value.trim();
  const date = document.getElementById('new-mtg-date')?.value;
  const meeting_type = document.getElementById('new-mtg-type')?.value;
  const artist_id = document.getElementById('new-mtg-artist')?.value || null;

  if (!title) { showToast('Ponele un título a la reunión'); return; }
  if (!date) { showToast('Elegí una fecha'); return; }

  try {
    // Si hay artista, buscar su service_line de MGMT para compatibilidad
    let service_line_id = null;
    if (artist_id) {
      try {
        const slRes = await fetch('/api/artists');
        const slData = await slRes.json();
        const artist = (slData.artists || []).find(a => a.id === artist_id);
        if (artist && artist.service_lines) {
          const mgmtSl = artist.service_lines.find(sl =>
            sl.service_types?.name === 'Management' || sl.service_type === 'Management'
          );
          if (mgmtSl) service_line_id = mgmtSl.id;
        }
      } catch (e) { console.error('Error buscando service_line:', e); }
    }

    const res = await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        summary: title,
        date,
        meeting_type,
        artist_id,
        service_line_id,
        agenda: newMeetingAgenda,
        status: 'scheduled'
      })
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);

    newMeetingAgenda = [];
    document.querySelector('.modal-overlay')?.remove();
    showToast('Reunión creada');
    switchView('reuniones');
  } catch (err) {
    showToast('Error: ' + err.message);
  }
}
```

---

## PASO 3: CORREGIR — Vista interna de reunión (`openMeetingDetail`)

La vista interna se abre al hacer click en una reunión de la lista. Debe tener:

### Header con info de la reunión
### Columna izquierda: Agenda con checkboxes + post-notas por tema
### Columna derecha: ZONA DE CIERRE con transcripción

La columna derecha es la parte clave. El flujo de cierre es:

```
1. Subir transcripción (link o archivo)
2. El sistema procesa la transcripción:
   a. Destila notas por cada tema de la agenda
   b. Si artista tiene MGMT active → vincula a objetivos + extrae secondary_tasks
   c. Si artista tiene MGMT paused/inactive/sin artista → solo destilado
3. Genera .md comprimido y lo guarda en BOVEDA
4. Cambia status a 'completed'
5. Reunión desaparece de la sección Reuniones
6. Reunión aparece en la vista interna del artista
```

### Verificar que `openMeetingDetail()` existe y funciona

Si no existe o está incompleta, implementarla:

```javascript
let currentMeeting = null;

async function openMeetingDetail(meetingId) {
  const content = $('#reuniones-container');
  if (!content) return;
  content.innerHTML = '<div class="loading">Cargando reunión...</div>';

  try {
    const res = await fetch('/api/meetings/' + meetingId);
    const data = await res.json();
    currentMeeting = data.meeting;
    if (!currentMeeting) throw new Error('Reunión no encontrada');

    const m = currentMeeting;
    const agenda = m.agenda || [];
    const postNotes = m.post_notes || [];

    const typeLabels = {
      'seguimiento': 'Seguimiento', 'onboarding': 'Onboarding',
      'revision': 'Revisión', 'planificacion': 'Planificación', 'otro': 'Otro'
    };

    const formatDate = (d) => {
      if (!d) return '—';
      const date = new Date(d + 'T12:00:00');
      return date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const getPostNote = (agendaId) => postNotes.find(pn => pn.topic_id === agendaId);

    // Renderizar agenda items con post-notas
    const agendaHtml = agenda.map((item) => {
      const postNote = getPostNote(item.id);
      return `
        <div style="background:var(--bg-elevated); border:1px solid var(--border); border-radius:10px; padding:14px 16px; margin-bottom:10px;">
          <div style="display:flex; align-items:flex-start; gap:10px;">
            <input type="checkbox" ${item.done ? 'checked' : ''}
              onchange="toggleMtgAgendaItem('${item.id}', this.checked)"
              style="margin-top:2px; accent-color:var(--neon-green);">
            <div style="flex:1; min-width:0;">
              <div style="font-size:13px; font-weight:600; color:var(--text); ${item.done ? 'text-decoration:line-through; opacity:0.6;' : ''}">
                ${escapeHtml(item.topic)}
              </div>
              ${item.onboarding ? '<div style="font-size:11px; color:var(--neon-orange); margin-top:4px;">⚡ ' + escapeHtml(item.onboarding) + '</div>' : ''}
              <div style="margin-top:10px; padding-top:10px; border-top:1px solid var(--border);">
                <div style="font-size:10px; text-transform:uppercase; letter-spacing:1px; color:var(--text-dim); margin-bottom:6px;">Anotación post-reunión</div>
                <textarea class="modal-input" placeholder="Anotaciones sobre este tema..."
                  id="post-note-${item.id}"
                  onchange="updateMtgPostNote('${item.id}', '${escapeHtml(item.topic)}', this.value)"
                  style="font-size:12px; min-height:60px; resize:vertical;">${postNote ? escapeHtml(postNote.note) : ''}</textarea>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    content.innerHTML = `
      <div>
        <!-- HEADER -->
        <div style="margin-bottom:24px;">
          <button onclick="switchView('reuniones')" style="background:none; border:none; color:var(--neon-violet); cursor:pointer; font-size:12px; margin-bottom:12px; padding:0;">
            ← Volver a Reuniones
          </button>
          <div style="display:flex; align-items:flex-start; justify-content:space-between;">
            <div>
              <h2 style="font-size:20px; font-weight:700; color:var(--text); margin:0;">
                ${escapeHtml(m.title || m.summary || 'Sin título')}
              </h2>
              <div style="font-size:12px; color:var(--text-dim); margin-top:6px; display:flex; align-items:center; gap:12px;">
                <span>${formatDate(m.date)}</span>
                <span style="color:var(--neon-violet);">● ${typeLabels[m.meeting_type] || m.meeting_type}</span>
                ${m.artists ? '<span>· ' + escapeHtml(m.artists.artist_name || m.artists.name) + '</span>' : ''}
              </div>
            </div>
            <button class="modal-btn cancel" onclick="cancelMeeting('${m.id}')" style="font-size:11px; padding:6px 14px; color:var(--text-dim);">
              Cancelar reunión
            </button>
          </div>
        </div>

        <!-- GRID 2 COLUMNAS -->
        <div class="mgmt-grid">
          <!-- COLUMNA IZQUIERDA: Agenda -->
          <div class="mgmt-col">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
              <div class="mgmt-col-title" style="margin-bottom:0;">Agenda</div>
              <span style="font-size:11px; color:var(--text-dim);">${agenda.filter(a => a.done).length}/${agenda.length} temas</span>
            </div>
            ${agenda.length > 0 ? agendaHtml : '<div style="padding:16px; text-align:center; color:var(--text-dim); font-size:12px;">Sin temas en la agenda</div>'}
            <div style="display:flex; gap:8px; margin-top:12px;">
              <input type="text" class="modal-input" id="add-mtg-agenda-input" placeholder="Agregar tema..." style="flex:1; font-size:12px;"
                onkeydown="if(event.key==='Enter'){event.preventDefault();addMtgAgendaItem();}">
              <button class="modal-btn cancel" onclick="addMtgAgendaItem()" style="font-size:11px; padding:6px 12px; white-space:nowrap;">+ Tema</button>
            </div>
          </div>

          <!-- COLUMNA DERECHA: Cierre de reunión -->
          <div class="mgmt-col">
            <div class="mgmt-col-title">Cerrar reunión</div>
            <div style="background:var(--bg-elevated); border:1px solid var(--border); border-radius:10px; padding:16px; margin-bottom:16px;">
              ${m.transcript_url ? `
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
                  <span style="font-size:20px;">📝</span>
                  <div style="flex:1; min-width:0;">
                    <div style="font-size:12px; font-weight:600; color:var(--text);">
                      ${escapeHtml(m.transcript_filename || 'Transcripción')}
                    </div>
                    <div style="font-size:11px; color:var(--neon-green); margin-top:2px;">Transcripción cargada</div>
                  </div>
                  <button class="modal-btn cancel" onclick="replaceMtgTranscript('${m.id}')" style="font-size:10px; padding:4px 8px;">Reemplazar</button>
                </div>
                <button class="modal-btn confirm" onclick="closeMeeting('${m.id}')" style="width:100%; padding:10px; font-size:13px;">
                  ✓ Cerrar reunión y procesar
                </button>
                <div style="font-size:10px; color:var(--text-dim); margin-top:8px; text-align:center;">
                  Se destilará la transcripción, se guardará en BÓVEDA y se cerrará la reunión.
                  ${m.artists ? '<br>Si el artista tiene MGMT activo, se vinculará a sus objetivos.' : ''}
                </div>
              ` : `
                <div style="text-align:center; padding:16px;">
                  <div style="font-size:13px; color:var(--text-dim); margin-bottom:12px;">
                    Subí la transcripción del Meet para cerrar la reunión
                  </div>
                  <div style="display:flex; gap:8px; justify-content:center;">
                    <button class="modal-btn cancel" onclick="addMtgTranscriptLink('${m.id}')" style="font-size:11px; padding:8px 14px;">
                      🔗 Pegar link
                    </button>
                    <label class="modal-btn cancel" style="font-size:11px; padding:8px 14px; cursor:pointer;">
                      📎 Subir archivo
                      <input type="file" accept=".txt,.md,.doc,.docx" style="display:none;" onchange="uploadMtgTranscriptFile('${m.id}', this)">
                    </label>
                  </div>
                </div>
              `}
            </div>

            <div class="mgmt-col-title">Notas generales</div>
            <textarea class="modal-input" id="mtg-general-notes" placeholder="Notas libres de la reunión..."
              onchange="updateMtgNotes('${m.id}', this.value)"
              style="font-size:12px; min-height:120px; resize:vertical;">${escapeHtml(m.notes || '')}</textarea>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error loading meeting:', err);
    content.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-dim);">Error: ' + escapeHtml(err.message) + '</div>';
  }
}
```

---

## PASO 4: HANDLERS de la vista interna (`index.html`)

```javascript
// Toggle agenda item checkbox
async function toggleMtgAgendaItem(itemId, checked) {
  if (!currentMeeting) return;
  const agenda = currentMeeting.agenda || [];
  const item = agenda.find(a => a.id === itemId);
  if (item) item.done = checked;
  await fetch('/api/meetings/' + currentMeeting.id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agenda })
  });
}

// Update post-note for a specific agenda topic
async function updateMtgPostNote(topicId, topicText, noteText) {
  if (!currentMeeting) return;
  let postNotes = currentMeeting.post_notes || [];
  const existing = postNotes.find(pn => pn.topic_id === topicId);
  if (existing) {
    existing.note = noteText;
  } else {
    postNotes.push({ topic_id: topicId, topic: topicText, note: noteText, action_items: [] });
  }
  currentMeeting.post_notes = postNotes;
  await fetch('/api/meetings/' + currentMeeting.id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ post_notes: postNotes })
  });
}

// Add agenda item from detail view
async function addMtgAgendaItem() {
  if (!currentMeeting) return;
  const input = document.getElementById('add-mtg-agenda-input');
  const topic = input?.value.trim();
  if (!topic) return;
  const agenda = currentMeeting.agenda || [];
  agenda.push({ id: crypto.randomUUID(), topic, onboarding: '', done: false });
  await fetch('/api/meetings/' + currentMeeting.id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agenda })
  });
  openMeetingDetail(currentMeeting.id);
}

// Update general notes
async function updateMtgNotes(meetingId, notes) {
  await fetch('/api/meetings/' + meetingId, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes })
  });
}

// Add transcript link
async function addMtgTranscriptLink(meetingId) {
  const url = prompt('URL de la transcripción (Google Docs, link del Meet, etc):');
  if (url === null || !url.trim()) return;
  await fetch('/api/meetings/' + meetingId, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript_url: url.trim(), transcript_filename: 'Link externo' })
  });
  showToast('Transcripción vinculada');
  openMeetingDetail(meetingId);
}

// Upload transcript file
async function uploadMtgTranscriptFile(meetingId, input) {
  const file = input.files[0];
  if (!file) return;
  // Por ahora: guardar nombre como placeholder. Subida real a Storage es futuro.
  await fetch('/api/meetings/' + meetingId, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript_url: file.name, transcript_filename: file.name })
  });
  showToast('Transcripción registrada: ' + file.name);
  openMeetingDetail(meetingId);
}

// Replace transcript
async function replaceMtgTranscript(meetingId) {
  const url = prompt('Nueva URL de la transcripción:');
  if (url === null || !url.trim()) return;
  await fetch('/api/meetings/' + meetingId, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript_url: url.trim(), transcript_filename: 'Link externo' })
  });
  showToast('Transcripción reemplazada');
  openMeetingDetail(meetingId);
}

// Cancel meeting
async function cancelMeeting(meetingId) {
  if (!confirm('¿Cancelar esta reunión?')) return;
  await fetch('/api/meetings/' + meetingId, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'cancelled' })
  });
  showToast('Reunión cancelada');
  switchView('reuniones');
}
```

---

## PASO 5: CERRAR REUNIÓN — Lógica principal (`index.html` + `server.js` + `db.js`)

Este es el paso más importante. Al hacer click en "Cerrar reunión y procesar":

### 5a. Frontend — Función `closeMeeting()`:

```javascript
async function closeMeeting(meetingId) {
  if (!currentMeeting) return;
  if (!currentMeeting.transcript_url) {
    showToast('Subí la transcripción antes de cerrar');
    return;
  }
  if (!confirm('¿Cerrar esta reunión? Se procesará la transcripción y se guardará en BÓVEDA.')) return;

  try {
    showToast('Procesando reunión...');

    const res = await fetch('/api/meetings/' + meetingId + '/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);

    showToast('Reunión cerrada y guardada en BÓVEDA');
    switchView('reuniones');
  } catch (err) {
    showToast('Error al cerrar: ' + err.message);
  }
}
```

### 5b. Backend — Endpoint `POST /api/meetings/:id/close` (`server.js`):

```javascript
const meetingCloseMatch = pathname.match(/^\/api\/meetings\/([^\/]+)\/close$/);
if (meetingCloseMatch && req.method === 'POST') {
  const meetingId = meetingCloseMatch[1];
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const result = await db.closeMeeting(meetingId);
      res.writeHead(200, headers);
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(500, headers);
      res.end(JSON.stringify({ error: err.message }));
    }
  });
  return;
}
```

### 5c. Backend — Función `closeMeeting()` (`db.js`):

Agregar DESPUES de `getMeetingDetail()`:

```javascript
async closeMeeting(meetingId) {
    // 1. Obtener la reunión completa
    const meeting = await this.getMeetingDetail(meetingId);
    if (!meeting) throw new Error('Reunión no encontrada');
    if (!meeting.transcript_url) throw new Error('Sin transcripción');

    const agenda = meeting.agenda || [];
    const postNotes = meeting.post_notes || [];
    const artistName = meeting.artists?.artist_name || meeting.artists?.name || 'sin-artista';
    const artistSlug = meeting.artists?.slug || null;

    // 2. Generar .md comprimido con la info de la reunión
    const meetingDate = meeting.date || new Date().toISOString().split('T')[0];
    const meetingType = meeting.meeting_type || 'seguimiento';
    const timestamp = Date.now();

    let mdContent = `# Reunión: ${meeting.title || 'Sin título'}\n\n`;
    mdContent += `- **Fecha:** ${meetingDate}\n`;
    mdContent += `- **Tipo:** ${meetingType}\n`;
    mdContent += `- **Artista:** ${artistName}\n`;
    mdContent += `- **Transcripción:** ${meeting.transcript_url}\n\n`;

    // Agenda con notas
    if (agenda.length > 0) {
      mdContent += `## Agenda\n\n`;
      for (const item of agenda) {
        const check = item.done ? '✅' : '⬜';
        mdContent += `### ${check} ${item.topic}\n`;
        if (item.onboarding) mdContent += `> Onboarding: ${item.onboarding}\n`;
        const postNote = postNotes.find(pn => pn.topic_id === item.id);
        if (postNote && postNote.note) {
          mdContent += `\n**Notas:** ${postNote.note}\n`;
        }
        if (postNote && postNote.action_items && postNote.action_items.length > 0) {
          mdContent += `\n**Action items:**\n`;
          postNote.action_items.forEach(ai => { mdContent += `- ${ai}\n`; });
        }
        mdContent += `\n`;
      }
    }

    // Notas generales
    if (meeting.notes) {
      mdContent += `## Notas generales\n\n${meeting.notes}\n\n`;
    }

    mdContent += `---\n_Generado automáticamente por G*S Dashboard · ${new Date().toISOString()}_\n`;

    // 3. Guardar .md en BOVEDA si hay artista con slug
    let documentPath = null;
    if (artistSlug) {
      const fs = require('fs');
      const path = require('path');
      const bovedaPath = process.env.BOVEDA_PATH || path.join(__dirname, '..'); // Ajustar según config
      const meetingsDir = path.join(bovedaPath, '06_CLIENTES', artistSlug, 'mgmt', 'meetings');

      // Crear directorio si no existe
      if (!fs.existsSync(meetingsDir)) {
        fs.mkdirSync(meetingsDir, { recursive: true });
      }

      const filename = `${meetingType}-${meetingDate}-${timestamp}.md`;
      documentPath = path.join(meetingsDir, filename);
      fs.writeFileSync(documentPath, mdContent, 'utf-8');
    }

    // 4. Si el artista tiene MGMT active → vincular a objetivos
    let linkedToMgmt = false;
    if (meeting.artist_id) {
      // Buscar service_line de MGMT
      const { data: sl } = await this.supabase
        .from('service_lines')
        .select('id')
        .eq('artist_id', meeting.artist_id)
        .eq('service_type_id', '7dd7837d-21bf-4712-a459-216ca3421a90')
        .single();

      if (sl) {
        // Buscar engagement del mes actual
        const currentMonth = new Date().toISOString().substring(0, 7);
        const { data: eng } = await this.supabase
          .from('mgmt_engagements')
          .select('status')
          .eq('service_line_id', sl.id)
          .eq('month', currentMonth)
          .limit(1)
          .single();

        // SOLO vincular si MGMT está ACTIVE
        if (eng && eng.status === 'active') {
          // Asegurar que la reunión tiene service_line_id
          if (!meeting.service_line_id) {
            await this.supabase
              .from('mgmt_meetings')
              .update({ service_line_id: sl.id })
              .eq('id', meetingId);
          }
          linkedToMgmt = true;
          // La vinculación a objetivos específicos se hace desde la vista interna
          // del artista (loadClientMeetingsPanel), que ya tiene esa lógica
        }
      }
    }

    // 5. Actualizar status a completed + guardar document_path
    const updates = {
      status: 'completed',
      document_path: documentPath
    };
    await this.supabase
      .from('mgmt_meetings')
      .update(updates)
      .eq('id', meetingId);

    return {
      ok: true,
      document_path: documentPath,
      linked_to_mgmt: linkedToMgmt,
      artist: artistName
    };
}
```

---

## PASO 6: VERIFICACIÓN

### Flujo completo de prueba:

1. Reiniciar server: `node server.js`
2. Abrir `localhost:3737` → Sidebar → Reuniones
3. **Crear reunión:**
   - Click "+ Nueva Reunión"
   - Título: "Seguimiento Reckless semana 27"
   - Fecha: hoy
   - Tipo: Seguimiento
   - Artista: Reckless
   - Agregar 3 temas: "Revisar métricas Spotify", "Definir estrategia TikTok", "Planificar videoclip"
   - Agregar onboarding al primer tema: "Correr audit con gs-auditor-musical"
   - Click "Crear Reunión"
4. **Verificar lista:** debe aparecer en la lista con badge tipo y artista
5. **Abrir reunión:** click en la card → vista interna con agenda y zona de cierre
6. **Marcar temas como done** → checkboxes se guardan
7. **Escribir post-notas** en cada tema → se guardan
8. **Subir transcripción:** click "🔗 Pegar link" → pegar URL → aparece "Transcripción cargada"
9. **Cerrar reunión:** click "✓ Cerrar reunión y procesar"
   - Debe generar .md en `06_CLIENTES/reckless/mgmt/meetings/`
   - Si Reckless tiene MGMT active → `linked_to_mgmt: true`
   - Status cambia a `completed`
   - Redirige a la lista de reuniones
   - La reunión ya NO aparece en la lista (solo muestra scheduled)
10. **Verificar en vista interna del artista:** Abrir Reckless → la reunión cerrada debe aparecer en la sección de reuniones

### Test con artista sin MGMT activo:
11. Crear reunión para Jot4 R (MGMT inactive)
12. Cerrar con transcripción → `linked_to_mgmt: false`, .md se guarda igual

---

## CHECKLIST

### Corrección de vista lista
- [ ] `renderReuniones()` solo muestra `status = 'scheduled'`
- [ ] Fetch usa `?status=scheduled`
- [ ] No hay secciones de "Completadas" ni "Canceladas"

### Botón Nueva Reunión
- [ ] `openNewMeetingModal()` existe y funciona
- [ ] Modal con: título, fecha, tipo, artista, agenda dinámica con onboardings
- [ ] `saveNewMeeting()` hace POST y recarga la lista
- [ ] Enter en campo de agenda agrega el tema (onkeydown)

### Vista interna de reunión
- [ ] `openMeetingDetail()` muestra header + grid 2 columnas
- [ ] Columna izq: agenda con checkboxes + post-notas por tema + agregar tema
- [ ] Columna der: zona de cierre (subir transcripción → botón cerrar)
- [ ] Botón "Cancelar reunión" funciona

### Handlers
- [ ] `toggleMtgAgendaItem()` — checkbox PATCH
- [ ] `updateMtgPostNote()` — nota por tema PATCH
- [ ] `addMtgAgendaItem()` — agregar tema y recargar
- [ ] `addMtgTranscriptLink()` — prompt URL
- [ ] `uploadMtgTranscriptFile()` — registrar archivo
- [ ] `cancelMeeting()` — cancelar y volver a lista

### Cierre de reunión (CRÍTICO)
- [ ] `server.js`: Endpoint `POST /api/meetings/:id/close`
- [ ] `db.js`: Función `closeMeeting(meetingId)`
- [ ] Genera .md con agenda + notas + transcripción
- [ ] Guarda en `06_CLIENTES/<slug>/mgmt/meetings/`
- [ ] Crea directorio si no existe
- [ ] Si MGMT active → vincula (linkedToMgmt = true)
- [ ] Si MGMT paused/inactive → NO vincula
- [ ] Si sin artista → NO vincula
- [ ] Status cambia a `completed`
- [ ] Reunión desaparece de la sección Reuniones
- [ ] Reunión aparece en vista interna del artista
