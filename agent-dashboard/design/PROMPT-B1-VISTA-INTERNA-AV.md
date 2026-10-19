# PROMPT: Vista Interna de Contratos AV (Productora Audiovisual)

> **Para:** CTO Jr (Claude Code operativo)
> **Scope:** Nueva vista de detalle para proyectos AV (Videoclip, Sesion de Contenido, Fotografia, Visualizer)
> **Archivos target:** `agent-dashboard/db.js`, `agent-dashboard/server.js`, `agent-dashboard/index.html`
> **Referencia:** La vista de Lanzamientos ya funciona (file-tree + preview). AV usa un layout diferente.
> **NO TOCAR:** Eventos. Lanzamientos (ya funciona).

---

## CONTEXTO

### Modelo de datos
Los contratos AV viven en la tabla `projects`:
```
projects:
  id, name, project_type, status, phase,
  package_price_cop, artist_id, client_id,
  metadata (JSONB), created_at, started_at
```

Tipos AV: `videoclip`, `sesion-contenido`, `sesion-fotos`, `visualizer`

Fases AV (flujo lineal):
```
pre-produccion → produccion → post-produccion → entregado
```

### Datos reales actuales
```json
{ "name": "Videoclip Henessy", "project_type": "videoclip", "phase": "pre-produccion", "package_price_cop": 3000000 }
{ "name": "Videoclip Tentacion", "project_type": "videoclip", "phase": "pre-produccion", "package_price_cop": 3000000 }
```

### Diferencia con Lanzamientos
Lanzamientos usa un file-tree del filesystem (BOVEDA/06_CLIENTES/{slug}/) con archivos .md organizados por fase.
AV NO usa file-tree. AV es un proyecto con fases de produccion, equipo, y entregables tipo archivo (video final, fotos editadas, etc).

---

## PASO 1: BACKEND — Endpoint para detalle de proyecto AV (`server.js`)

Crear endpoint `GET /api/projects/:projectId/detail`:

```javascript
const projectDetailMatch = pathname.match(/^\/api\/projects\/([^\/]+)\/detail$/);
if (projectDetailMatch && req.method === 'GET') {
  const projectId = projectDetailMatch[1];
  db.getProjectDetail(projectId)
    .then(data => {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(JSON.stringify(data, null, 2));
    })
    .catch(err => {
      res.writeHead(err.message.includes('not found') ? 404 : 500);
      res.end(JSON.stringify({ error: err.message }));
    });
  return;
}
```

Colocar ANTES de los endpoints existentes de `/api/projects/` para que el regex no colisione.

---

## PASO 2: BACKEND — Funcion `getProjectDetail()` (`db.js`)

```javascript
async function getProjectDetail(projectId) {
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      clients (id, slug, display_name, type),
      artists!projects_artist_id_fkey (id, slug, stage_name)
    `)
    .eq('id', projectId)
    .single();

  if (error) throw new Error('Project not found: ' + error.message);

  return { project };
}
```

Agregar `getProjectDetail` a `module.exports`.

---

## PASO 3: FRONTEND — Funcion para abrir detalle AV (`index.html`)

### 3a. Detectar click en contract-card

En el prompt anterior (PROMPT-CONTRATOS-VISTA-INTERNA) se agregaron `.contract-card` con `data-project-id`. Agregar handler de click:

```javascript
document.addEventListener('click', (e) => {
  const contractCard = e.target.closest('.contract-card[data-project-id]');
  if (!contractCard) return;
  e.preventDefault();
  const projectId = contractCard.dataset.projectId;
  const projectType = contractCard.dataset.projectType; // agregar este data-attr en el prompt anterior
  
  // Lanzamientos usan el sistema existente (file-tree)
  if (projectType === 'lanzamiento') {
    const proj = projectsData.find(p => p.id === projectId);
    if (proj) openProjectDetail(projectId, getClientSlug(proj.client_name));
    return;
  }
  
  // AV y otros usan la nueva vista
  openAVProjectDetail(projectId);
});
```

**IMPORTANTE:** Agregar `data-project-type="${escapeHtml(p.project_type)}"` al HTML del contract-card en el prompt anterior.

### 3b. Funcion `openAVProjectDetail()`

```javascript
async function openAVProjectDetail(projectId) {
  $$('.view').forEach(v => v.classList.add('hidden'));
  $('#view-project-detail').classList.remove('hidden');
  
  const container = $('#project-detail-container');
  container.innerHTML = '<div class="loading">Cargando proyecto...</div>';
  
  try {
    const res = await fetch('/api/projects/' + encodeURIComponent(projectId) + '/detail');
    if (!res.ok) throw new Error('Proyecto no encontrado');
    const data = await res.json();
    renderAVProjectDetail(data.project);
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Error: ' + escapeHtml(err.message) + '</div></div>';
  }
}
```

### 3c. Funcion `renderAVProjectDetail()`

```javascript
function renderAVProjectDetail(project) {
  const container = $('#project-detail-container');
  const artist = project.artists || {};
  const client = project.clients || {};
  
  const phases = ['pre-produccion', 'produccion', 'post-produccion', 'entregado'];
  const phaseLabels = {
    'pre-produccion': 'Pre-producción',
    'produccion': 'Producción',
    'post-produccion': 'Post-producción',
    'entregado': 'Entregado'
  };
  const currentPhaseIdx = phases.indexOf(project.phase || 'pre-produccion');
  
  const typeIcons = {
    'videoclip': '🎬',
    'sesion-contenido': '📸',
    'sesion-fotos': '📷',
    'visualizer': '🎨'
  };
  const icon = typeIcons[project.project_type] || '📋';
  
  const priceFmt = project.package_price_cop
    ? '$' + Number(project.package_price_cop).toLocaleString('en-US') + ' COP'
    : '—';

  // Progress bar de fases
  const progressHtml = `
    <div class="av-phase-progress">
      ${phases.map((phase, i) => `
        <div class="av-phase-step ${i <= currentPhaseIdx ? 'completed' : ''} ${i === currentPhaseIdx ? 'current' : ''}">
          <div class="av-phase-dot"></div>
          <div class="av-phase-label">${phaseLabels[phase]}</div>
        </div>
        ${i < phases.length - 1 ? '<div class="av-phase-line ' + (i < currentPhaseIdx ? 'completed' : '') + '"></div>' : ''}
      `).join('')}
    </div>
  `;

  // Header
  const headerHtml = `
    <div class="av-detail-header">
      <div class="av-detail-back">
        <button class="back-btn" id="av-back-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Volver
        </button>
      </div>
      <div class="av-detail-title-row">
        <div>
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
            <span style="font-size:24px;">${icon}</span>
            <div class="av-detail-title">${escapeHtml(project.name)}</div>
          </div>
          <div class="av-detail-subtitle">
            ${escapeHtml(artist.stage_name || '—')} · ${escapeHtml(client.display_name || '—')}
            · <span class="badge-pill ${(project.project_type || 'otro').toLowerCase()}">${escapeHtml(project.project_type)}</span>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:20px; font-weight:700; color:var(--neon-green);">${priceFmt}</div>
          <div style="font-size:10px; color:var(--text-dim); text-transform:uppercase; margin-top:4px;">
            ${escapeHtml(project.status)}
          </div>
        </div>
      </div>
      ${progressHtml}
    </div>
  `;

  // Grid: 2 columnas
  // Izquierda: info del proyecto + notas
  // Derecha: acciones de fase (cambiar fase, actualizar estado)
  const gridHtml = `
    <div class="av-detail-grid">
      <div class="av-detail-col">
        <div class="mgmt-col-title">Informacion del proyecto</div>
        <div class="av-info-card">
          <div class="av-info-row">
            <span class="av-info-label">Tipo</span>
            <span class="av-info-value">${escapeHtml(project.project_type)}</span>
          </div>
          <div class="av-info-row">
            <span class="av-info-label">Fase actual</span>
            <span class="av-info-value">${phaseLabels[project.phase] || project.phase || '—'}</span>
          </div>
          <div class="av-info-row">
            <span class="av-info-label">Precio</span>
            <span class="av-info-value">${priceFmt}</span>
          </div>
          <div class="av-info-row">
            <span class="av-info-label">Artista</span>
            <span class="av-info-value">${escapeHtml(artist.stage_name || '—')}</span>
          </div>
          <div class="av-info-row">
            <span class="av-info-label">Cliente/Pagador</span>
            <span class="av-info-value">${escapeHtml(client.display_name || '—')}</span>
          </div>
          <div class="av-info-row">
            <span class="av-info-label">Creado</span>
            <span class="av-info-value">${project.created_at ? new Date(project.created_at).toLocaleDateString('es-CO') : '—'}</span>
          </div>
        </div>
      </div>
      <div class="av-detail-col">
        <div class="mgmt-col-title">Acciones</div>
        <div class="av-actions-card">
          <div style="margin-bottom:16px;">
            <label class="modal-label">Cambiar fase</label>
            <select class="modal-select" id="av-phase-select">
              ${phases.map(p => '<option value="' + p + '"' + (p === project.phase ? ' selected' : '') + '>' + phaseLabels[p] + '</option>').join('')}
            </select>
          </div>
          <div style="margin-bottom:16px;">
            <label class="modal-label">Estado</label>
            <select class="modal-select" id="av-status-select">
              <option value="active" ${project.status === 'active' ? 'selected' : ''}>Activo</option>
              <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>Completado</option>
              <option value="cancelled" ${project.status === 'cancelled' ? 'selected' : ''}>Cancelado</option>
            </select>
          </div>
          <button class="modal-btn confirm" id="av-save-btn" style="width:100%;">Guardar cambios</button>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = headerHtml + gridHtml;

  // Back button
  document.getElementById('av-back-btn').addEventListener('click', () => {
    if (_artistDashboardOrigin === 'artists' && currentMgmtClientSlug) {
      openArtistDashboard(currentMgmtClientSlug);
    } else {
      switchView('projects');
    }
  });

  // Save button
  document.getElementById('av-save-btn').addEventListener('click', async () => {
    const btn = document.getElementById('av-save-btn');
    btn.disabled = true;
    btn.textContent = 'Guardando...';
    try {
      const res = await fetch('/api/projects/' + encodeURIComponent(project.id) + '/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: document.getElementById('av-phase-select').value,
          status: document.getElementById('av-status-select').value
        })
      });
      if (!res.ok) throw new Error('Error actualizando');
      showToast('Proyecto actualizado');
      openAVProjectDetail(project.id); // reload
    } catch (err) {
      showToast('Error: ' + err.message);
      btn.disabled = false;
      btn.textContent = 'Guardar cambios';
    }
  });
}
```

---

## PASO 4: BACKEND — Endpoint PATCH para actualizar proyecto (`server.js`)

```javascript
const projectUpdateMatch = pathname.match(/^\/api\/projects\/([^\/]+)\/update$/);
if (projectUpdateMatch && req.method === 'PATCH') {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const data = JSON.parse(body);
      const projectId = projectUpdateMatch[1];
      const updates = {};
      if (data.phase) updates.phase = data.phase;
      if (data.status) updates.status = data.status;
      
      const { error } = await db.supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);
      
      if (error) throw error;
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
  });
  return;
}
```

---

## PASO 5: CSS — Estilos para vista AV

```css
/* AV Project Detail */
.av-detail-header {
  margin-bottom: 24px;
}
.av-detail-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}
.av-detail-title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.5px;
}
.av-detail-subtitle {
  font-size: 13px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}
.av-detail-back {
  margin-bottom: 16px;
}

/* Phase progress bar */
.av-phase-progress {
  display: flex;
  align-items: center;
  padding: 20px 0;
}
.av-phase-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.av-phase-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--bg-elevated);
  border: 2px solid var(--border);
  transition: all 0.3s;
}
.av-phase-step.completed .av-phase-dot {
  background: var(--neon-green);
  border-color: var(--neon-green);
}
.av-phase-step.current .av-phase-dot {
  border-color: var(--neon-violet);
  box-shadow: 0 0 8px rgba(168, 85, 247, 0.4);
}
.av-phase-label {
  font-size: 10px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
  white-space: nowrap;
}
.av-phase-step.current .av-phase-label {
  color: var(--neon-violet);
  font-weight: 600;
}
.av-phase-line {
  flex: 1;
  height: 2px;
  background: var(--border);
  margin: 0 8px;
  margin-bottom: 22px; /* alinear con dots, no labels */
}
.av-phase-line.completed {
  background: var(--neon-green);
}

/* AV Detail Grid */
.av-detail-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
}
.av-detail-col {
  min-width: 0;
}
.av-info-card, .av-actions-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
}
.av-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.av-info-row:last-child {
  border-bottom: none;
}
.av-info-label {
  font-size: 12px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.av-info-value {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}
```

---

## PASO 6: INTEGRACION CON CONTRATOS DE VISTA INTERNA

En el prompt anterior (PROMPT-CONTRATOS-VISTA-INTERNA), el `renderProjectCard` debe incluir `data-project-type`:

```javascript
// Actualizar el contract-card para incluir project_type:
<div class="contract-card ${p.status}" 
     data-project-id="${escapeHtml(p.id)}" 
     data-project-type="${escapeHtml(p.project_type)}">
```

Esto permite que el click handler (paso 3a) distinga entre lanzamientos (que abren file-tree) y AV (que abren la nueva vista).

---

## PASO 7: VERIFICACION

1. Reiniciar server
2. Abrir `localhost:3737` → Artistas → Reckless → deberia ver seccion Contratos (del prompt anterior)
3. Click en "Videoclip Tentacion" → debe abrir vista AV con:
   - Header con nombre, artista, pagador, icono, precio
   - Progress bar de fases (pre-produccion activa)
   - Grid con info del proyecto (izq) y acciones (der)
4. Cambiar fase a "produccion" → guardar → debe recargar con fase actualizada
5. Cambiar estado a "completado" → guardar → verificar
6. Click en "Volver" → debe regresar al dashboard del artista
7. Verificar que Lanzamientos siguen abriendo con file-tree (no la vista AV)

---

## ORDEN DE IMPLEMENTACION

Este prompt DEPENDE de PROMPT-CONTRATOS-VISTA-INTERNA (seccion de contratos en vista interna).
Implementar en este orden:
1. PROMPT-CONTRATOS-VISTA-INTERNA (agrega la seccion de contratos al artist dashboard)
2. PROMPT-B1-VISTA-INTERNA-AV (agrega la vista de detalle al hacer click)

---

## CHECKLIST

- [ ] `db.js`: Crear `getProjectDetail(projectId)` con join a clients y artists
- [ ] `db.js`: Exportar `getProjectDetail` en module.exports
- [ ] `server.js`: Endpoint `GET /api/projects/:id/detail`
- [ ] `server.js`: Endpoint `PATCH /api/projects/:id/update`
- [ ] `index.html`: Handler de click en `.contract-card` (distinguir lanzamiento vs AV)
- [ ] `index.html`: Funcion `openAVProjectDetail(projectId)`
- [ ] `index.html`: Funcion `renderAVProjectDetail(project)` con header, progress bar, grid
- [ ] `index.html`: Back button funcional (vuelve al artist dashboard)
- [ ] `index.html`: Save button funcional (PATCH fase + estado)
- [ ] `index.html`: CSS completo para `.av-detail-*`, `.av-phase-*`, `.av-info-*`
- [ ] Verificar contract-card incluye `data-project-type`
- [ ] Verificar que Lanzamientos siguen usando file-tree
- [ ] Verificar visual en navegador con proyecto real
