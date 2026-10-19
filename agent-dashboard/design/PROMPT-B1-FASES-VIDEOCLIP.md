# PROMPT: Fases y Entregables de Videoclip/Visualizer — Vista Interna AV

> **Para:** CTO Jr (Claude Code operativo)
> **Scope:** Reemplazar el file-tree de lanzamientos por un sistema de entregables por fase para proyectos AV
> **Archivos target:** `agent-dashboard/db.js`, `agent-dashboard/server.js`, `agent-dashboard/index.html`
> **IMPORTANTE:** Este prompt REEMPLAZA la vista de file-tree cuando el project_type es videoclip/visualizer. Los lanzamientos siguen usando file-tree.

---

## CONTEXTO

Actualmente al abrir un contrato AV (Videoclip Tentacion), se muestra el file-tree de lanzamientos con fases Pre-Release/Release/Post-Release. Esto es INCORRECTO para AV. Los videoclips tienen su propio flujo de produccion con entregables especificos por fase.

### Fases AV (reemplazan Pre-Release/Release/Post-Release):

| Fase | Entregables |
|------|-------------|
| **Pre-produccion** | Cuenta de Cobro, Guion Literario, Guion Tecnico, Propuesta de Vestuario, Precotizacion |
| **Produccion** | Contrato Prestacion de Servicios (firmado), Resumen Gastos & Ganancias |
| **Post-produccion** | Link BTS, Link Fotos, Link Videoclip, Links Reels |

Cada entregable es un slot que puede estar: `vacio` (sin completar), `link` (URL), o `archivo` (PDF/imagen subida).

Los entregables que se ACTIVAN dependen del paquete contratado (videoclip completo vs visualizer basico). Esto se controla via metadata del proyecto.

---

## PASO 1: BACKEND — Tabla o estructura para entregables AV

### Opcion A: Usar la tabla `projects.metadata` (JSONB) — RECOMENDADA

No crear tabla nueva. Guardar los entregables en `projects.metadata.deliverables`:

```json
{
  "deliverables": {
    "pre-produccion": [
      { "key": "cuenta-cobro", "label": "Cuenta de Cobro", "type": "file", "value": null, "status": "pending" },
      { "key": "guion-literario", "label": "Guion Literario", "type": "file", "value": null, "status": "pending" },
      { "key": "guion-tecnico", "label": "Guion Tecnico", "type": "file", "value": null, "status": "pending" },
      { "key": "vestuario", "label": "Propuesta de Vestuario", "type": "file", "value": null, "status": "pending" },
      { "key": "precotizacion", "label": "Precotizacion", "type": "file", "value": null, "status": "pending" }
    ],
    "produccion": [
      { "key": "contrato-servicios", "label": "Contrato Prestacion de Servicios", "type": "file", "value": null, "status": "pending" },
      { "key": "resumen-gastos", "label": "Resumen Gastos & Ganancias", "type": "file", "value": null, "status": "pending" }
    ],
    "post-produccion": [
      { "key": "link-bts", "label": "Link BTS", "type": "link", "value": null, "status": "pending" },
      { "key": "link-fotos", "label": "Link Fotos", "type": "link", "value": null, "status": "pending" },
      { "key": "link-videoclip", "label": "Link Videoclip", "type": "link", "value": null, "status": "pending" },
      { "key": "links-reels", "label": "Links Reels", "type": "link", "value": null, "status": "pending" }
    ]
  }
}
```

### Templates por tipo de proyecto:

```javascript
const AV_TEMPLATES = {
  videoclip: {
    'pre-produccion': [
      { key: 'cuenta-cobro', label: 'Cuenta de Cobro', type: 'file' },
      { key: 'guion-literario', label: 'Guión Literario', type: 'file' },
      { key: 'guion-tecnico', label: 'Guión Técnico', type: 'file' },
      { key: 'vestuario', label: 'Propuesta de Vestuario', type: 'file' },
      { key: 'precotizacion', label: 'Precotización', type: 'file' }
    ],
    'produccion': [
      { key: 'contrato-servicios', label: 'Contrato Prestación de Servicios', type: 'file' },
      { key: 'resumen-gastos', label: 'Resumen Gastos & Ganancias', type: 'file' }
    ],
    'post-produccion': [
      { key: 'link-bts', label: 'Link BTS', type: 'link' },
      { key: 'link-fotos', label: 'Link Fotos', type: 'link' },
      { key: 'link-videoclip', label: 'Link Videoclip', type: 'link' },
      { key: 'links-reels', label: 'Links Reels', type: 'link' }
    ]
  },
  visualizer: {
    'pre-produccion': [
      { key: 'cuenta-cobro', label: 'Cuenta de Cobro', type: 'file' },
      { key: 'precotizacion', label: 'Precotización', type: 'file' }
    ],
    'produccion': [
      { key: 'contrato-servicios', label: 'Contrato Prestación de Servicios', type: 'file' },
      { key: 'resumen-gastos', label: 'Resumen Gastos & Ganancias', type: 'file' }
    ],
    'post-produccion': [
      { key: 'link-visualizer', label: 'Link Visualizer', type: 'link' },
      { key: 'links-reels', label: 'Links Reels', type: 'link' }
    ]
  }
};
```

Estos templates se aplican al CREAR el proyecto. Guardar en `projects.metadata.deliverables`. Si un proyecto existente no tiene deliverables en metadata, inicializarlos desde el template al abrir la vista.

---

## PASO 2: BACKEND — Inicializar y servir deliverables (`db.js`)

### 2a. Funcion para inicializar deliverables

```javascript
function getAVDeliverableTemplate(projectType) {
  const templates = {
    videoclip: { /* ... el template de arriba ... */ },
    visualizer: { /* ... el template de arriba ... */ }
  };
  const template = templates[projectType] || templates['videoclip'];
  const deliverables = {};
  for (const [phase, items] of Object.entries(template)) {
    deliverables[phase] = items.map(item => ({
      ...item,
      value: null,
      status: 'pending'
    }));
  }
  return deliverables;
}
```

### 2b. En `getProjectDetail()`, inicializar si no existen

```javascript
async function getProjectDetail(projectId) {
  const { data: project, error } = await supabase
    .from('projects')
    .select('*, clients(id, slug, display_name, type), artists!projects_artist_id_fkey(id, slug, stage_name)')
    .eq('id', projectId)
    .single();
  if (error) throw new Error('Project not found');

  // Inicializar deliverables si es AV y no tiene
  if (['videoclip', 'visualizer'].includes(project.project_type) && !project.metadata?.deliverables) {
    const deliverables = getAVDeliverableTemplate(project.project_type);
    const newMeta = { ...(project.metadata || {}), deliverables };
    await supabase.from('projects').update({ metadata: newMeta }).eq('id', projectId);
    project.metadata = newMeta;
  }

  return { project };
}
```

Exportar `getAVDeliverableTemplate` en module.exports.

---

## PASO 3: BACKEND — Endpoint para actualizar un deliverable (`server.js`)

```javascript
// PATCH /api/projects/:projectId/deliverable
const deliverablePatchMatch = pathname.match(/^\/api\/projects\/([^\/]+)\/deliverable$/);
if (deliverablePatchMatch && req.method === 'PATCH') {
  const projectId = deliverablePatchMatch[1];
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const { phase, key, value, status } = JSON.parse(body);
      if (!phase || !key) throw new Error('phase and key required');

      // Leer metadata actual
      const { data: project } = await db.supabase
        .from('projects').select('metadata').eq('id', projectId).single();
      if (!project) throw new Error('Project not found');

      const meta = project.metadata || {};
      const deliverables = meta.deliverables || {};
      const phaseItems = deliverables[phase] || [];

      // Encontrar y actualizar el item
      const item = phaseItems.find(d => d.key === key);
      if (!item) throw new Error('Deliverable not found: ' + key);

      if (value !== undefined) item.value = value;
      if (status) item.status = status;

      // Guardar
      const { error } = await db.supabase
        .from('projects')
        .update({ metadata: { ...meta, deliverables } })
        .eq('id', projectId);
      if (error) throw error;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
  });
  return;
}
```

---

## PASO 4: FRONTEND — Renderizar vista AV con entregables por fase (`index.html`)

### 4a. Detectar tipo de proyecto al abrir

Cuando se abre un proyecto AV (videoclip/visualizer), renderizar la vista de entregables por fase EN VEZ del file-tree de lanzamientos.

Si ya existe `renderAVProjectDetail()` del prompt B1, modificarla. Si no, crearla.

### 4b. Reemplazar el file-tree con entregables por fase

En vez del split `file-tree + preview-panel`, renderizar un layout de 3 fases con sus entregables:

```javascript
function renderAVDeliverables(project) {
  const deliverables = project.metadata?.deliverables || {};
  const phases = [
    { key: 'pre-produccion', label: 'Pre-producción', color: 'var(--neon-orange)' },
    { key: 'produccion', label: 'Producción', color: 'var(--neon-blue)' },
    { key: 'post-produccion', label: 'Post-producción', color: 'var(--neon-green)' }
  ];

  return phases.map(phase => {
    const items = deliverables[phase.key] || [];
    const doneCount = items.filter(i => i.status === 'done').length;

    const itemsHtml = items.map(item => {
      const isDone = item.status === 'done';
      const isLink = item.type === 'link';

      return `
        <div class="av-deliverable-row ${isDone ? 'done' : ''}" data-phase="${phase.key}" data-key="${item.key}">
          <div class="av-deliverable-check">
            <input type="checkbox" ${isDone ? 'checked' : ''} data-toggle-deliverable="${item.key}" data-toggle-phase="${phase.key}">
          </div>
          <div class="av-deliverable-info">
            <div class="av-deliverable-label">${escapeHtml(item.label)}</div>
            ${item.value ? (
              isLink
                ? '<a href="' + escapeHtml(item.value) + '" target="_blank" class="av-deliverable-link">' + escapeHtml(item.value) + '</a>'
                : '<span class="av-deliverable-file">' + escapeHtml(item.value) + '</span>'
            ) : ''}
          </div>
          <div class="av-deliverable-actions">
            ${isLink ? (
              '<button class="av-action-btn" data-set-link="${item.key}" data-set-phase="${phase.key}" title="' + (item.value ? 'Editar link' : 'Agregar link') + '">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                  '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>' +
                  '<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>' +
                '</svg>' +
              '</button>'
            ) : (
              '<label class="av-action-btn" title="' + (item.value ? 'Reemplazar archivo' : 'Subir archivo') + '">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                  '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>' +
                '</svg>' +
                '<input type="file" style="display:none;" data-upload-key="' + item.key + '" data-upload-phase="' + phase.key + '">' +
              '</label>'
            )}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="av-phase-section">
        <div class="av-phase-header" style="border-left: 3px solid ${phase.color};">
          <div class="av-phase-title">${phase.label}</div>
          <div class="av-phase-count">${doneCount}/${items.length}</div>
        </div>
        ${items.length === 0
          ? '<div style="padding:16px; color:var(--text-dim); font-size:12px;">Sin entregables en esta fase</div>'
          : itemsHtml
        }
      </div>
    `;
  }).join('');
}
```

### 4c. Event handlers

```javascript
// Checkbox toggle — marcar/desmarcar deliverable
document.addEventListener('change', async (e) => {
  const cb = e.target;
  if (!cb.dataset.toggleDeliverable) return;
  const key = cb.dataset.toggleDeliverable;
  const phase = cb.dataset.togglePhase;
  const newStatus = cb.checked ? 'done' : 'pending';

  await fetch('/api/projects/' + currentDetailProject.id + '/deliverable', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phase, key, status: newStatus })
  });
});

// Link button — prompt para URL
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-set-link]');
  if (!btn) return;
  const key = btn.dataset.setLink;
  const phase = btn.dataset.setPhase;
  const url = prompt('URL del link:');
  if (url === null) return;

  await fetch('/api/projects/' + currentDetailProject.id + '/deliverable', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phase, key, value: url || null, status: url ? 'done' : 'pending' })
  });
  openAVProjectDetail(currentDetailProject.id); // reload
});

// File upload — por ahora guardar solo el nombre (upload real a Storage es DT futuro)
document.addEventListener('change', async (e) => {
  const input = e.target;
  if (!input.dataset.uploadKey) return;
  const key = input.dataset.uploadKey;
  const phase = input.dataset.uploadPhase;
  const file = input.files[0];
  if (!file) return;

  // TODO: subir a Supabase Storage. Por ahora guardar nombre como placeholder.
  await fetch('/api/projects/' + currentDetailProject.id + '/deliverable', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phase, key, value: file.name, status: 'done' })
  });
  showToast('Archivo registrado: ' + file.name);
  openAVProjectDetail(currentDetailProject.id); // reload
});
```

---

## PASO 5: CSS

```css
.av-phase-section {
  margin-bottom: 20px;
}
.av-phase-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: var(--bg-elevated);
  border-radius: 8px;
  margin-bottom: 8px;
}
.av-phase-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-primary);
}
.av-phase-count {
  font-size: 11px;
  color: var(--text-dim);
}
.av-deliverable-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  transition: all 0.2s;
}
.av-deliverable-row:hover {
  background: var(--bg-elevated);
}
.av-deliverable-row.done {
  opacity: 0.6;
}
.av-deliverable-row.done .av-deliverable-label {
  text-decoration: line-through;
}
.av-deliverable-check input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--neon-green);
}
.av-deliverable-info {
  flex: 1;
  min-width: 0;
}
.av-deliverable-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}
.av-deliverable-link {
  font-size: 11px;
  color: var(--neon-blue);
  text-decoration: none;
  display: block;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.av-deliverable-link:hover {
  text-decoration: underline;
}
.av-deliverable-file {
  font-size: 11px;
  color: var(--neon-green);
  display: block;
  margin-top: 2px;
}
.av-action-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  transition: all 0.2s;
}
.av-action-btn:hover {
  border-color: var(--neon-violet);
  color: var(--neon-violet);
}
```

---

## PASO 6: INTEGRACION — Reemplazar file-tree cuando es AV

Cuando se abre un proyecto y el `project_type` es `videoclip` o `visualizer`, NO renderizar el `detail-split` (file-tree + preview). En su lugar renderizar el layout de fases con entregables.

En la funcion que abre el detalle del proyecto:

```javascript
// Si es videoclip o visualizer → vista AV con entregables
if (['videoclip', 'visualizer'].includes(project.project_type)) {
  // Renderizar header AV + fases con entregables
  container.innerHTML = headerHtml + '<div class="av-deliverables-container">' + renderAVDeliverables(project) + '</div>';
  // Attach handlers...
  return;
}

// Si es lanzamiento → file-tree existente (no tocar)
// renderProjectDetailContent(project, clientSlug, data.deliverables);
```

---

## PASO 7: INICIALIZAR proyectos existentes

Los 2 videoclips existentes (Henessy y Tentacion) no tienen `metadata.deliverables`. Al abrirlos, `getProjectDetail()` (paso 2b) los inicializa automaticamente con el template de videoclip.

---

## PASO 8: VERIFICACION

1. Reiniciar server
2. Abrir Videoclip Tentacion → debe mostrar 3 fases (Pre-produccion, Produccion, Post-produccion)
3. Pre-produccion debe tener 5 entregables, Produccion 2, Post-produccion 4
4. Click en checkbox de "Cuenta de Cobro" → debe marcar como done
5. Click en icono link de "Link BTS" → prompt para URL → debe guardar y mostrar link
6. Abrir un lanzamiento (TUCUTU) → debe seguir mostrando file-tree, NO la vista AV
7. Crear un nuevo videoclip → debe inicializar con el template completo

---

## CHECKLIST

- [ ] `db.js`: Templates `AV_TEMPLATES` para videoclip y visualizer
- [ ] `db.js`: Funcion `getAVDeliverableTemplate(projectType)`
- [ ] `db.js`: `getProjectDetail()` inicializa deliverables si no existen
- [ ] `server.js`: Endpoint `PATCH /api/projects/:id/deliverable`
- [ ] `index.html`: Funcion `renderAVDeliverables(project)` con fases y entregables
- [ ] `index.html`: Handler checkbox toggle (done/pending)
- [ ] `index.html`: Handler link button (prompt URL)
- [ ] `index.html`: Handler file upload (nombre por ahora, Storage futuro)
- [ ] `index.html`: CSS para `.av-phase-*` y `.av-deliverable-*`
- [ ] `index.html`: Condicional: videoclip/visualizer usa vista AV, lanzamiento usa file-tree
- [ ] Verificar con Videoclip Tentacion (debe inicializar template)
- [ ] Verificar con Lanzamiento TUCUTU (debe seguir con file-tree)
- [ ] Verificar checkbox y links funcionan
