# PROMPT: Meetings Hub — Sección independiente de Reuniones (DT-035)

> **Para:** CTO Jr (Claude Code operativo)
> **Scope:** Nueva sección "Reuniones" en el dashboard con vista lista + vista interna de reunión
> **Archivos target:** `agent-dashboard/db.js`, `agent-dashboard/server.js`, `agent-dashboard/index.html`
> **Referencia:** Sistema actual de meetings en `mgmt_meetings` (db.js linea ~1477, server.js linea ~354)
> **Prioridad:** Alta — DT-035

---

## CONTEXTO

Hoy las reuniones viven DENTRO de la vista interna del artista (columna derecha, bajo "Reuniones y misiones"). El sistema actual (`mgmt_meetings`) tiene: date, summary, notes, action_items. Es básico y no tiene:
- Vista centralizada de TODAS las reuniones (cross-artista)
- Agenda pre-reunión con temas + onboardings por tarea
- Anotaciones post-reunión estructuradas por tema
- Subida de transcripción
- Estados de reunión (agendada/completada/cancelada)

Vamos a crear una **sección independiente "Reuniones"** en el sidebar que centralice todo. La vista dentro del artista seguirá mostrando sus reuniones pero como acceso rápido a la vista completa.

---

## PASO 1: SCHEMA — Expandir tabla `mgmt_meetings` en Supabase

Agregar columnas nuevas a la tabla existente. NO crear tabla nueva.

```sql
-- Nuevas columnas para mgmt_meetings
ALTER TABLE mgmt_meetings ADD COLUMN IF NOT EXISTS artist_id UUID REFERENCES artists(id);
ALTER TABLE mgmt_meetings ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE mgmt_meetings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled'));
ALTER TABLE mgmt_meetings ADD COLUMN IF NOT EXISTS meeting_type TEXT DEFAULT 'seguimiento' CHECK (meeting_type IN ('seguimiento', 'onboarding', 'revision', 'planificacion', 'otro'));
ALTER TABLE mgmt_meetings ADD COLUMN IF NOT EXISTS agenda JSONB DEFAULT '[]';
ALTER TABLE mgmt_meetings ADD COLUMN IF NOT EXISTS post_notes JSONB DEFAULT '[]';
ALTER TABLE mgmt_meetings ADD COLUMN IF NOT EXISTS transcript_url TEXT;
ALTER TABLE mgmt_meetings ADD COLUMN IF NOT EXISTS transcript_filename TEXT;
ALTER TABLE mgmt_meetings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
```

### Estructura de `agenda` (JSONB array):
```json
[
  {
    "id": "uuid-generado-en-frontend",
    "topic": "Revisar resultados audit algorítmica",
    "onboarding": "Completar audit con gs-auditor-musical antes de la reunión",
    "done": false
  },
  {
    "id": "uuid-2",
    "topic": "Definir brandbook para próximo release",
    "onboarding": "Tener referencias visuales listas",
    "done": false
  }
]
```

### Estructura de `post_notes` (JSONB array):
```json
[
  {
    "topic_id": "uuid-del-tema-en-agenda",
    "topic": "Revisar resultados audit algorítmica",
    "note": "Se revisaron los números de Spotify. Hay caída del 12% en monthly listeners. Decidimos cambiar estrategia de playlisting.",
    "action_items": ["Crear nueva playlist strategy", "Contactar curator de LATAM"]
  }
]
```

### Backfill de `artist_id` para reuniones existentes:
```sql
-- Llenar artist_id desde service_line → artist_id
UPDATE mgmt_meetings m
SET artist_id = sl.artist_id
FROM service_lines sl
WHERE m.service_line_id = sl.id
AND m.artist_id IS NULL;
```

**IMPORTANTE:** Correr estos SQLs en Supabase SQL Editor ANTES de modificar el código. Si preferís, podés agregar un comentario en el código indicando que se necesitan correr.

---

## PASO 2: BACKEND — Nuevos endpoints y funciones (`db.js` + `server.js`)

### 2a. Nueva función `getAllMeetings()` en db.js

Agregar DESPUES de `updateMgmtMeeting()` (linea ~1510):

```javascript
async getAllMeetings(filters = {}) {
    let query = this.supabase
      .from('mgmt_meetings')
      .select('*, artists(id, slug, name, artist_name, image_url)')
      .order('date', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.artist_id) query = query.eq('artist_id', filters.artist_id);
    if (filters.from_date) query = query.gte('date', filters.from_date);
    if (filters.to_date) query = query.lte('date', filters.to_date);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}
```

### 2b. Nueva función `getMeetingDetail(id)` en db.js

```javascript
async getMeetingDetail(id) {
    const { data, error } = await this.supabase
      .from('mgmt_meetings')
      .select('*, artists(id, slug, name, artist_name, image_url)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
}
```

### 2c. Actualizar `createMgmtMeeting()` para incluir nuevos campos

Modificar la función existente (linea ~1487) para aceptar los campos nuevos:

```javascript
async createMgmtMeeting(meetingData) {
    const insert = {
      service_line_id: meetingData.service_line_id,
      artist_id: meetingData.artist_id,
      date: meetingData.date,
      title: meetingData.title || meetingData.summary || 'Sin título',
      summary: meetingData.summary,
      notes: meetingData.notes,
      action_items: meetingData.action_items || [],
      status: meetingData.status || 'scheduled',
      meeting_type: meetingData.meeting_type || 'seguimiento',
      agenda: meetingData.agenda || []
    };
    const { data, error } = await this.supabase
      .from('mgmt_meetings')
      .insert(insert)
      .select('*, artists(id, slug, name, artist_name, image_url)')
      .single();
    if (error) throw error;
    return data;
}
```

### 2d. Nuevos endpoints en server.js

Agregar DESPUES de los endpoints existentes de meetings (~linea 400):

```javascript
// GET /api/meetings — Todas las reuniones (con filtros opcionales)
if (pathname === '/api/meetings' && req.method === 'GET') {
  try {
    const params = new URL(req.url, 'http://localhost').searchParams;
    const filters = {};
    if (params.get('status')) filters.status = params.get('status');
    if (params.get('artist_id')) filters.artist_id = params.get('artist_id');
    if (params.get('from_date')) filters.from_date = params.get('from_date');
    if (params.get('to_date')) filters.to_date = params.get('to_date');
    const meetings = await db.getAllMeetings(filters);
    res.writeHead(200, headers);
    res.end(JSON.stringify({ meetings }));
  } catch (err) {
    res.writeHead(500, headers);
    res.end(JSON.stringify({ error: err.message }));
  }
  return;
}

// GET /api/meetings/:id — Detalle de una reunión
const meetingDetailMatch = pathname.match(/^\/api\/meetings\/([^\/]+)$/);
if (meetingDetailMatch && req.method === 'GET') {
  try {
    const meeting = await db.getMeetingDetail(meetingDetailMatch[1]);
    res.writeHead(200, headers);
    res.end(JSON.stringify({ meeting }));
  } catch (err) {
    res.writeHead(500, headers);
    res.end(JSON.stringify({ error: err.message }));
  }
  return;
}

// PATCH /api/meetings/:id — Actualizar reunión (reutiliza updateMgmtMeeting)
// NOTA: El endpoint PATCH /api/mgmt/meetings/:id ya existe (linea ~386).
// Agregar este alias para acceso directo sin prefijo mgmt:
if (meetingDetailMatch && req.method === 'PATCH') {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const payload = JSON.parse(body);
      const meeting = await db.updateMgmtMeeting(meetingDetailMatch[1], payload);
      res.writeHead(200, headers);
      res.end(JSON.stringify({ meeting }));
    } catch (err) {
      res.writeHead(500, headers);
      res.end(JSON.stringify({ error: err.message }));
    }
  });
  return;
}

// POST /api/meetings — Crear reunión (alias de /api/mgmt/meetings)
if (pathname === '/api/meetings' && req.method === 'POST') {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const payload = JSON.parse(body);
      const meeting = await db.createMgmtMeeting(payload);
      res.writeHead(200, headers);
      res.end(JSON.stringify({ meeting }));
    } catch (err) {
      res.writeHead(500, headers);
      res.end(JSON.stringify({ error: err.message }));
    }
  });
  return;
}
```

**NOTA:** Los endpoints existentes `/api/mgmt/meetings` y `/api/mgmt/:serviceLineId/meetings` NO se tocan. Siguen funcionando para la vista dentro del artista. Los nuevos `/api/meetings` son el acceso centralizado.

---

## PASO 3: FRONTEND — Agregar "Reuniones" al Sidebar y Navegación (`index.html`)

**IMPORTANTE:** El dashboard usa un patrón de navegación específico basado en `data-view` + `switchView()` + secciones `<section class="view hidden">`. Seguirlo exactamente.

### 3a. Agregar item al sidebar (linea ~2859)

En el `<nav class="nav-list">`, agregar DESPUES del botón "Artistas" (linea ~2859) y ANTES del botón "Nuevo Artista" (linea ~2860):

```html
<button class="nav-item" data-view="reuniones">
  <span>Reuniones</span>
  <span class="badge" id="badge-reuniones">0</span>
</button>
```

### 3b. Agregar section de vista (linea ~2950)

Agregar una nueva `<section>` DESPUES de la sección `view-artists` y ANTES del cierre de `</main>`:

```html
<section class="view hidden" id="view-reuniones">
  <div class="view-header">
    <h1 class="view-title">Reuniones</h1>
    <p class="view-subtitle">Agenda, onboardings y seguimiento de reuniones con artistas</p>
  </div>
  <div id="reuniones-container">
    <div class="loading">Cargando reuniones...</div>
  </div>
</section>
```

### 3c. Agregar condición en switchView() (linea ~3388)

En la función `switchView()` (linea ~3378), agregar DESPUES de la línea `else if (viewName === 'artists') renderArtists();`:

```javascript
else if (viewName === 'reuniones') renderReuniones();
```

### 3d. Registrar event listener

El event listener de los nav-items se registra con `document.querySelectorAll('.nav-item[data-view]')` (linea ~3615). Como usa querySelectorAll al cargar, el nuevo botón con `data-view="reuniones"` se registra automáticamente. NO hace falta agregar listener manual.

---

## PASO 4: FRONTEND — Vista lista de reuniones (`renderReuniones`)

Crear función `renderReuniones()`. El patrón es igual a `renderArtists()` o `renderProjects()` — usa `$('#reuniones-container')` internamente.

```javascript
async function renderReuniones() {
  const content = $('#reuniones-container');
  if (!content) return;
  content.innerHTML = '<div class="loading">Cargando reuniones...</div>';

  try {
    const res = await fetch('/api/meetings');
    const data = await res.json();
    const meetings = data.meetings || [];

    // Separar por estado
    const upcoming = meetings.filter(m => m.status === 'scheduled');
    const completed = meetings.filter(m => m.status === 'completed');
    const cancelled = meetings.filter(m => m.status === 'cancelled');

    // Cargar artistas para el select de nueva reunión
    const artistRes = await fetch('/api/artists');
    const artistData = await artistRes.json();
    const artists = artistData.artists || [];

    const meetingTypeLabel = {
      'seguimiento': 'Seguimiento',
      'onboarding': 'Onboarding',
      'revision': 'Revisión',
      'planificacion': 'Planificación',
      'otro': 'Otro'
    };

    const meetingTypeColor = {
      'seguimiento': 'var(--neon-violet)',
      'onboarding': 'var(--neon-green)',
      'revision': 'var(--neon-violet)',
      'planificacion': 'var(--neon-orange)',
      'otro': 'var(--text-dim)'
    };

    const statusDot = {
      'scheduled': '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--neon-violet);margin-right:6px;" title="Agendada"></span>',
      'completed': '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--neon-green);margin-right:6px;" title="Completada"></span>',
      'cancelled': '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--text-dim);margin-right:6px;" title="Cancelada"></span>'
    };

    const formatDate = (d) => {
      if (!d) return '—';
      const date = new Date(d + 'T12:00:00');
      const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
      return date.toLocaleDateString('es-CO', options);
    };

    const renderMeetingCard = (m) => `
      <div class="meeting-card ${m.status}" onclick="openMeetingDetail('${escapeHtml(m.id)}')" style="cursor:pointer;">
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
            ${statusDot[m.status] || statusDot['scheduled']}
            <div style="min-width:0; flex:1;">
              <div style="font-size:13px; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${escapeHtml(m.title || m.summary || 'Sin título')}
              </div>
              <div style="font-size:11px; color:var(--text-dim); margin-top:3px; display:flex; align-items:center; gap:8px;">
                <span>${formatDate(m.date)}</span>
                <span style="color:${meetingTypeColor[m.meeting_type] || 'var(--text-dim)'};">● ${meetingTypeLabel[m.meeting_type] || m.meeting_type}</span>
                ${m.artists ? '<span>· ' + escapeHtml(m.artists.artist_name || m.artists.name) + '</span>' : ''}
              </div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            ${m.agenda && m.agenda.length > 0 ? '<span style="font-size:10px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:4px; padding:2px 6px; color:var(--text-dim);">' + m.agenda.filter(a => a.done).length + '/' + m.agenda.length + ' temas</span>' : ''}
            ${m.transcript_url ? '<span style="font-size:12px;" title="Tiene transcripción">📝</span>' : ''}
          </div>
        </div>
      </div>
    `;

    content.innerHTML = `
      <div>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
          <div>
            <h2 style="font-size:18px; font-weight:700; color:var(--text); margin:0;">Reuniones</h2>
            <div style="font-size:12px; color:var(--text-dim); margin-top:4px;">${upcoming.length} agendada${upcoming.length !== 1 ? 's' : ''} · ${completed.length} completada${completed.length !== 1 ? 's' : ''}</div>
          </div>
          <button class="modal-btn confirm" onclick="openNewMeetingModal()" style="font-size:12px; padding:8px 16px;">
            + Nueva Reunión
          </button>
        </div>

        ${upcoming.length > 0 ? `
          <div style="margin-bottom:24px;">
            <div style="font-size:10px; text-transform:uppercase; letter-spacing:1.5px; color:var(--neon-violet); margin-bottom:10px; font-weight:600;">Próximas</div>
            ${upcoming.map(renderMeetingCard).join('')}
          </div>
        ` : ''}

        ${completed.length > 0 ? `
          <div style="margin-bottom:24px;">
            <div style="font-size:10px; text-transform:uppercase; letter-spacing:1.5px; color:var(--neon-green); margin-bottom:10px; font-weight:600;">Completadas</div>
            ${completed.map(renderMeetingCard).join('')}
          </div>
        ` : ''}

        ${cancelled.length > 0 ? `
          <div style="margin-bottom:24px;">
            <div style="font-size:10px; text-transform:uppercase; letter-spacing:1.5px; color:var(--text-dim); margin-bottom:10px; font-weight:600;">Canceladas</div>
            ${cancelled.map(renderMeetingCard).join('')}
          </div>
        ` : ''}

        ${meetings.length === 0 ? '<div style="padding:40px; text-align:center; color:var(--text-dim); font-size:13px;">No hay reuniones registradas. Creá una con el botón de arriba.</div>' : ''}
      </div>
    `;
  } catch (err) {
    console.error('Error loading meetings:', err);
    content.innerHTML = '<div class="error-state">Error cargando reuniones: ' + escapeHtml(err.message) + '</div>';
  }
}
```

### CSS para meeting cards

Agregar en la sección de estilos (cerca de `.contract-card`):

```css
.meeting-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 8px;
  transition: all 0.2s;
}
.meeting-card:hover {
  border-color: var(--neon-violet);
}
.meeting-card.completed {
  opacity: 0.7;
}
.meeting-card.cancelled {
  opacity: 0.4;
}
```

---

## PASO 5: FRONTEND — Modal "Nueva Reunión" (`openNewMeetingModal`)

```javascript
async function openNewMeetingModal() {
  // Cargar artistas
  let artists = [];
  try {
    const res = await fetch('/api/artists');
    const data = await res.json();
    artists = data.artists || [];
  } catch (err) { console.error(err); }

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:560px;">
      <div class="modal-header">
        <h3 class="modal-title">Nueva Reunión</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
      </div>
      <div class="modal-body" style="padding:20px;">
        <div class="form-row">
          <div class="form-field-group">
            <label class="modal-label">Título</label>
            <input type="text" class="modal-input" id="new-meeting-title" placeholder="Ej: Seguimiento semanal con Reckless">
          </div>
        </div>
        <div class="form-row" style="display:flex; gap:12px;">
          <div class="form-field-group" style="flex:1;">
            <label class="modal-label">Fecha</label>
            <input type="date" class="modal-input" id="new-meeting-date" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-field-group" style="flex:1;">
            <label class="modal-label">Tipo</label>
            <select class="modal-select" id="new-meeting-type">
              <option value="seguimiento">Seguimiento</option>
              <option value="onboarding">Onboarding</option>
              <option value="revision">Revisión</option>
              <option value="planificacion">Planificación</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field-group">
            <label class="modal-label">Artista</label>
            <select class="modal-select" id="new-meeting-artist">
              <option value="">— Sin artista —</option>
              ${artists.map(a => '<option value="' + a.id + '">' + escapeHtml(a.artist_name || a.name) + '</option>').join('')}
            </select>
          </div>
        </div>

        <div style="margin-top:16px;">
          <label class="modal-label">Agenda — Temas a tratar</label>
          <div id="new-meeting-agenda-list" style="margin-bottom:8px;"></div>
          <div style="display:flex; gap:8px;">
            <input type="text" class="modal-input" id="new-meeting-agenda-input" placeholder="Tema a tratar..." style="flex:1;">
            <button class="modal-btn cancel" onclick="addAgendaItem()" style="font-size:12px; padding:6px 12px; white-space:nowrap;">+ Tema</button>
          </div>
        </div>

        <div style="margin-top:20px; display:flex; justify-content:flex-end; gap:10px;">
          <button class="modal-btn cancel" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
          <button class="modal-btn confirm" onclick="saveMeeting()" style="padding:8px 20px;">Crear Reunión</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// Estado temporal de agenda items
let newMeetingAgenda = [];

function addAgendaItem() {
  const input = document.getElementById('new-meeting-agenda-input');
  const topic = input.value.trim();
  if (!topic) return;

  newMeetingAgenda.push({
    id: crypto.randomUUID(),
    topic: topic,
    onboarding: '',
    done: false
  });
  input.value = '';
  renderAgendaItems();
}

function renderAgendaItems() {
  const container = document.getElementById('new-meeting-agenda-list');
  if (!container) return;
  container.innerHTML = newMeetingAgenda.map((item, i) => `
    <div style="display:flex; align-items:flex-start; gap:8px; margin-bottom:8px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:8px; padding:10px 12px;">
      <div style="flex:1; min-width:0;">
        <div style="font-size:12px; font-weight:600; color:var(--text);">${escapeHtml(item.topic)}</div>
        <input type="text" class="modal-input" placeholder="Onboarding previo (opcional)..." value="${escapeHtml(item.onboarding)}"
          onchange="newMeetingAgenda[${i}].onboarding = this.value"
          style="margin-top:6px; font-size:11px; padding:4px 8px;">
      </div>
      <button onclick="newMeetingAgenda.splice(${i}, 1); renderAgendaItems();"
        style="background:none; border:none; color:var(--text-dim); cursor:pointer; font-size:14px; padding:2px;">✕</button>
    </div>
  `).join('');
}

async function saveMeeting() {
  const title = document.getElementById('new-meeting-title').value.trim();
  const date = document.getElementById('new-meeting-date').value;
  const meeting_type = document.getElementById('new-meeting-type').value;
  const artist_id = document.getElementById('new-meeting-artist').value || null;

  if (!title) { showToast('Ponele un título a la reunión'); return; }
  if (!date) { showToast('Elegí una fecha'); return; }

  try {
    // Si hay artista, buscar su service_line de MGMT para mantener compatibilidad
    let service_line_id = null;
    if (artist_id) {
      const slRes = await fetch('/api/artists');
      const slData = await slRes.json();
      const artist = (slData.artists || []).find(a => a.id === artist_id);
      if (artist && artist.service_lines) {
        const mgmtSl = artist.service_lines.find(sl => sl.service_types?.name === 'Management' || sl.service_type === 'Management');
        if (mgmtSl) service_line_id = mgmtSl.id;
      }
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

## PASO 6: FRONTEND — Vista interna de reunión (`openMeetingDetail`)

Esta es la vista más importante. Tiene 3 zonas: header, pre-reunión (agenda), post-reunión (notas + transcripción).

```javascript
let currentMeeting = null;

async function openMeetingDetail(meetingId) {
  // Reutilizar el container de reuniones para la vista interna
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

    const meetingTypeLabel = {
      'seguimiento': 'Seguimiento', 'onboarding': 'Onboarding',
      'revision': 'Revisión', 'planificacion': 'Planificación', 'otro': 'Otro'
    };
    const meetingTypeColor = {
      'seguimiento': 'var(--neon-violet)', 'onboarding': 'var(--neon-green)',
      'revision': 'var(--neon-violet)', 'planificacion': 'var(--neon-orange)', 'otro': 'var(--text-dim)'
    };
    const statusLabel = { 'scheduled': 'Agendada', 'completed': 'Completada', 'cancelled': 'Cancelada' };
    const statusColor = { 'scheduled': 'var(--neon-violet)', 'completed': 'var(--neon-green)', 'cancelled': 'var(--text-dim)' };

    const formatDate = (d) => {
      if (!d) return '—';
      const date = new Date(d + 'T12:00:00');
      return date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    // Buscar post_note para cada agenda item
    const getPostNote = (agendaId) => postNotes.find(pn => pn.topic_id === agendaId);

    const agendaHtml = agenda.map((item, i) => {
      const postNote = getPostNote(item.id);
      return `
        <div class="meeting-agenda-item" style="background:var(--bg-elevated); border:1px solid var(--border); border-radius:10px; padding:14px 16px; margin-bottom:10px;">
          <div style="display:flex; align-items:flex-start; gap:10px;">
            <input type="checkbox" ${item.done ? 'checked' : ''}
              onchange="toggleAgendaItem('${item.id}', this.checked)"
              style="margin-top:2px; accent-color:var(--neon-green);">
            <div style="flex:1; min-width:0;">
              <div style="font-size:13px; font-weight:600; color:var(--text); ${item.done ? 'text-decoration:line-through; opacity:0.6;' : ''}">
                ${escapeHtml(item.topic)}
              </div>
              ${item.onboarding ? '<div style="font-size:11px; color:var(--neon-orange); margin-top:4px;">⚡ ' + escapeHtml(item.onboarding) + '</div>' : ''}

              <!-- Post-nota para este tema -->
              <div style="margin-top:10px; padding-top:10px; border-top:1px solid var(--border);">
                <div style="font-size:10px; text-transform:uppercase; letter-spacing:1px; color:var(--text-dim); margin-bottom:6px;">Anotación post-reunión</div>
                <textarea class="modal-input" placeholder="Anotaciones sobre este tema..."
                  id="post-note-${item.id}"
                  onchange="updatePostNote('${item.id}', '${escapeHtml(item.topic)}', this.value)"
                  style="font-size:12px; min-height:60px; resize:vertical;">${postNote ? escapeHtml(postNote.note) : ''}</textarea>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    content.innerHTML = `
      <div class="section-container">
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
                <span style="color:${meetingTypeColor[m.meeting_type] || 'var(--text-dim)'};">● ${meetingTypeLabel[m.meeting_type] || m.meeting_type}</span>
                ${m.artists ? '<span>· ' + escapeHtml(m.artists.artist_name || m.artists.name) + '</span>' : ''}
                <span style="color:${statusColor[m.status]};">● ${statusLabel[m.status]}</span>
              </div>
            </div>
            <div style="display:flex; gap:8px;">
              ${m.status === 'scheduled' ? `
                <button class="modal-btn confirm" onclick="changeMeetingStatus('${m.id}', 'completed')" style="font-size:11px; padding:6px 14px;">
                  ✓ Completar
                </button>
              ` : ''}
              ${m.status !== 'cancelled' ? `
                <button class="modal-btn cancel" onclick="changeMeetingStatus('${m.id}', 'cancelled')" style="font-size:11px; padding:6px 14px; color:var(--text-dim);">
                  Cancelar
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- GRID 2 COLUMNAS -->
        <div class="mgmt-grid">
          <!-- COLUMNA IZQUIERDA: Agenda + Post-notas -->
          <div class="mgmt-col">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
              <div class="mgmt-col-title" style="margin-bottom:0;">Agenda</div>
              <span style="font-size:11px; color:var(--text-dim);">${agenda.filter(a => a.done).length}/${agenda.length} temas</span>
            </div>
            ${agenda.length > 0 ? agendaHtml : '<div style="padding:16px; text-align:center; color:var(--text-dim); font-size:12px;">Sin temas en la agenda</div>'}

            <!-- Agregar tema -->
            <div style="display:flex; gap:8px; margin-top:12px;">
              <input type="text" class="modal-input" id="add-agenda-input" placeholder="Agregar tema..." style="flex:1; font-size:12px;">
              <button class="modal-btn cancel" onclick="addAgendaToMeeting()" style="font-size:11px; padding:6px 12px; white-space:nowrap;">+ Tema</button>
            </div>
          </div>

          <!-- COLUMNA DERECHA: Transcripción + Notas generales -->
          <div class="mgmt-col">
            <div class="mgmt-col-title">Transcripción</div>
            <div style="background:var(--bg-elevated); border:1px solid var(--border); border-radius:10px; padding:16px; margin-bottom:16px;">
              ${m.transcript_url ? `
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-size:20px;">📝</span>
                  <div style="flex:1; min-width:0;">
                    <div style="font-size:12px; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                      ${escapeHtml(m.transcript_filename || 'Transcripción')}
                    </div>
                    <a href="${escapeHtml(m.transcript_url)}" target="_blank" style="font-size:11px; color:var(--neon-violet);">Ver transcripción</a>
                  </div>
                  <button class="modal-btn cancel" onclick="uploadTranscript('${m.id}')" style="font-size:10px; padding:4px 8px;">Reemplazar</button>
                </div>
              ` : `
                <div style="text-align:center; padding:12px;">
                  <div style="font-size:12px; color:var(--text-dim); margin-bottom:10px;">Subí la transcripción de la reunión</div>
                  <div style="display:flex; gap:8px; justify-content:center;">
                    <button class="modal-btn cancel" onclick="uploadTranscriptLink('${m.id}')" style="font-size:11px; padding:6px 14px;">🔗 Pegar link</button>
                    <label class="modal-btn cancel" style="font-size:11px; padding:6px 14px; cursor:pointer;">
                      📎 Subir archivo
                      <input type="file" style="display:none;" onchange="uploadTranscriptFile('${m.id}', this)">
                    </label>
                  </div>
                </div>
              `}
            </div>

            <div class="mgmt-col-title">Notas generales</div>
            <textarea class="modal-input" id="meeting-general-notes" placeholder="Notas libres de la reunión..."
              onchange="updateMeetingNotes('${m.id}', this.value)"
              style="font-size:12px; min-height:120px; resize:vertical;">${escapeHtml(m.notes || '')}</textarea>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error loading meeting:', err);
    content.innerHTML = '<div class="error-state">Error: ' + escapeHtml(err.message) + '</div>';
  }
}
```

---

## PASO 7: FRONTEND — Handlers de la vista interna

```javascript
async function toggleAgendaItem(itemId, checked) {
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

async function updatePostNote(topicId, topicText, noteText) {
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

async function addAgendaToMeeting() {
  if (!currentMeeting) return;
  const input = document.getElementById('add-agenda-input');
  const topic = input.value.trim();
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

async function changeMeetingStatus(meetingId, newStatus) {
  await fetch('/api/meetings/' + meetingId, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  });
  openMeetingDetail(meetingId);
}

async function updateMeetingNotes(meetingId, notes) {
  await fetch('/api/meetings/' + meetingId, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes })
  });
}

async function uploadTranscriptLink(meetingId) {
  const url = prompt('URL de la transcripción:');
  if (url === null) return;

  await fetch('/api/meetings/' + meetingId, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript_url: url, transcript_filename: 'Link externo' })
  });
  showToast('Transcripción vinculada');
  openMeetingDetail(meetingId);
}

async function uploadTranscriptFile(meetingId, input) {
  const file = input.files[0];
  if (!file) return;
  // Por ahora: guardar nombre como placeholder (subida real a Storage en futuro)
  await fetch('/api/meetings/' + meetingId, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript_url: file.name, transcript_filename: file.name })
  });
  showToast('Transcripción registrada: ' + file.name);
  openMeetingDetail(meetingId);
}
```

---

## PASO 8: VERIFICACIÓN

1. **Correr los SQLs** del Paso 1 en Supabase SQL Editor
2. Reiniciar server: `node server.js`
3. Abrir `localhost:3737` → Sidebar debe mostrar "📅 Reuniones" entre Contratos y Agentes
4. Click en Reuniones → Vista lista vacía con botón "+ Nueva Reunión"
5. Crear reunión:
   - Título: "Seguimiento semanal Reckless"
   - Fecha: hoy
   - Tipo: Seguimiento
   - Artista: Reckless
   - Agregar 3 temas a la agenda con onboardings
   - Click "Crear Reunión"
6. Verificar que aparece en la lista con dot cyan (agendada)
7. Click en la reunión → Vista interna con:
   - Header con título, fecha, tipo, artista, estado
   - Columna izq: Agenda con checkboxes, onboardings en amber, textarea post-nota por tema
   - Columna der: Zona de transcripción + notas generales
8. Marcar un tema como done → checkbox se guarda
9. Escribir una anotación post-reunión → se guarda
10. Pegar link de transcripción → aparece "Ver transcripción"
11. Click "✓ Completar" → estado cambia a completada
12. Volver a lista → reunión aparece en "Completadas" con dot verde

---

## CHECKLIST

### Schema
- [ ] Correr ALTER TABLE en Supabase (artist_id, title, status, meeting_type, agenda, post_notes, transcript_url, transcript_filename, updated_at)
- [ ] Correr UPDATE de backfill para artist_id en reuniones existentes

### Backend
- [ ] `db.js`: Función `getAllMeetings(filters)` con join a artists
- [ ] `db.js`: Función `getMeetingDetail(id)` con join a artists
- [ ] `db.js`: Actualizar `createMgmtMeeting()` con campos nuevos
- [ ] `server.js`: `GET /api/meetings` (con filtros query params)
- [ ] `server.js`: `GET /api/meetings/:id`
- [ ] `server.js`: `PATCH /api/meetings/:id`
- [ ] `server.js`: `POST /api/meetings`
- [ ] Endpoints existentes `/api/mgmt/meetings` NO se tocan

### Frontend — Navegación
- [ ] Sidebar: agregar item "Reuniones" con icono 📅
- [ ] `navigateTo()`: agregar case 'reuniones'

### Frontend — Vista lista
- [ ] `renderReuniones()`: lista agrupada por estado (próximas/completadas/canceladas)
- [ ] Cards con: dot estado, título, fecha, tipo, artista, progreso agenda, icono transcripción
- [ ] CSS: `.meeting-card` con hover y estados visuales

### Frontend — Modal nueva reunión
- [ ] `openNewMeetingModal()`: título, fecha, tipo, artista, agenda con onboardings
- [ ] `addAgendaItem()` + `renderAgendaItems()`: gestión dinámica de temas
- [ ] `saveMeeting()`: POST y recarga

### Frontend — Vista interna
- [ ] `openMeetingDetail()`: header + grid 2 columnas
- [ ] Columna izq: agenda con checkboxes + onboarding (amber) + textarea post-nota por tema
- [ ] Columna der: zona transcripción (link/archivo) + notas generales
- [ ] Botones: Completar / Cancelar reunión

### Frontend — Handlers
- [ ] `toggleAgendaItem()`: marcar/desmarcar tema
- [ ] `updatePostNote()`: anotación por tema
- [ ] `addAgendaToMeeting()`: agregar tema en vista interna
- [ ] `changeMeetingStatus()`: cambiar estado
- [ ] `updateMeetingNotes()`: notas generales
- [ ] `uploadTranscriptLink()` + `uploadTranscriptFile()`: transcripción

### Verificación
- [ ] Crear reunión con agenda completa
- [ ] Marcar temas como done
- [ ] Escribir post-notas por tema
- [ ] Subir transcripción (link)
- [ ] Completar reunión → se refleja en lista
- [ ] Vista interna del artista sigue mostrando sus reuniones
