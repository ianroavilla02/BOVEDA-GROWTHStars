# PROMPT: Sección Contratos Activos/Cerrados en Vista Interna del Artista

> **Para:** CTO Jr (Claude Code operativo)
> **Scope:** Backend (getArtistDashboard) + Frontend (renderMgmtClientDetail) + Frontend (openArtistDashboard)
> **Archivos target:** `agent-dashboard/db.js`, `agent-dashboard/index.html`
> **Ubicación visual:** Columna izquierda de la vista interna, ARRIBA de "Objetivos y entregables"

---

## CONTEXTO

Cuando se abre la vista interna de un artista, se ven sus objetivos, entregables, reuniones y misiones de MGMT. Pero NO se ven los contratos/proyectos vinculados (AV, Lanzamientos, Eventos). Estos existen en la tabla `projects` con `artist_id`, pero `getArtistDashboard()` no los carga y el frontend no los muestra.

**Modelo de datos actual:**
```
Artist
  └─ service_lines (1:N)
       ├─ Management → mgmt_engagements → mgmt_objectives → mgmt_deliverables
       ├─ Productora AV → projects (videoclip, sesion-contenido, sesion-fotos, visualizer)
       ├─ Productora Eventos → projects (booking, otro)
       └─ Lanzamiento → projects (lanzamiento, release_date)
```

Los contratos viven en `projects` con campos relevantes:
- `artist_id` (FK a artists)
- `client_id` (FK a clients — el pagador)
- `name` (nombre del proyecto, ej: "Videoclip Tentacion")
- `project_type` (videoclip, sesion-contenido, sesion-fotos, booking, lanzamiento, etc.)
- `status` (active, completed, cancelled)
- `phase` (pre-produccion, produccion, post-produccion, entregado, pre-release, release, post-release)
- `package_price_cop` (precio en COP)
- `release_date` (para lanzamientos)
- `started_at`, `created_at`

---

## PASO 1: BACKEND — Cargar projects en `getArtistDashboard()` (`db.js` linea ~1599)

Agregar una query de projects DESPUES de la query de missions (linea ~1622) y ANTES del loop de service_lines:

```javascript
// Despues de la query de missions, agregar:
const { data: projects, error: projError } = await supabase
  .from('projects')
  .select('id, name, project_type, status, phase, package_price_cop, release_date, started_at, created_at, client_id, clients(display_name)')
  .eq('artist_id', artist.id)
  .order('created_at', { ascending: false });
if (projError) throw projError;
```

Agregar `projects` al return (linea ~1687):

```javascript
return {
  artist: { ... },
  service_lines: serviceLines,
  projects: projects || [],   // <-- AGREGAR
  missions: missions || [],
  links,
  boveda
};
```

---

## PASO 2: FRONTEND — Pasar projects a renderMgmtClientDetail (`index.html` linea ~3726)

En la funcion `openArtistDashboard()`, agregar projects al objeto detail:

```javascript
const detail = {
  client: clientRecord,
  engagement: mgmtLine ? mgmtLine.engagement : null,
  objectives: mgmtLine ? (mgmtLine.objectives || []) : [],
  projects: data.projects || []   // <-- AGREGAR
};
```

---

## PASO 3: FRONTEND — Renderizar seccion de contratos en `renderMgmtClientDetail()`

En la funcion `renderMgmtClientDetail()` (linea ~3771), agregar al inicio (despues de extraer variables):

```javascript
const projects = detail.projects || [];
```

Crear el HTML de la seccion de contratos. Insertar ANTES de `objectivesHtml` dentro de la columna izquierda del `mgmt-grid`.

### HTML de la seccion:

```javascript
const activeProjects = projects.filter(p => p.status === 'active');
const closedProjects = projects.filter(p => p.status !== 'active');

const projectIcon = (type) => {
  const icons = {
    'videoclip': '🎬',
    'sesion-contenido': '📸',
    'sesion-fotos': '📷',
    'visualizer': '🎨',
    'lanzamiento': '🚀',
    'booking': '🎤',
    'otro': '📋'
  };
  return icons[type] || '📋';
};

const projectPhaseLabel = (phase) => {
  const labels = {
    'pre-produccion': 'Pre-producción',
    'produccion': 'Producción',
    'post-produccion': 'Post-producción',
    'entregado': 'Entregado',
    'pre-release': 'Pre-release',
    'release': 'Release',
    'post-release': 'Post-release'
  };
  return labels[phase] || phase || '—';
};

const renderProjectCard = (p) => `
  <div class="contract-card ${p.status}" data-project-id="${escapeHtml(p.id)}">
    <div style="display:flex; align-items:center; justify-content:space-between;">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:16px;">${projectIcon(p.project_type)}</span>
        <div>
          <div style="font-size:13px; font-weight:600; color:var(--text-primary);">${escapeHtml(p.name)}</div>
          <div style="font-size:11px; color:var(--text-dim); margin-top:2px;">${escapeHtml(p.project_type)} · ${p.clients?.display_name ? escapeHtml(p.clients.display_name) : '—'}</div>
        </div>
      </div>
      <div style="text-align:right;">
        <span class="mgmt-status-badge ${p.status === 'active' ? 'active' : 'completed'}" style="font-size:10px;">${projectPhaseLabel(p.phase)}</span>
        ${p.package_price_cop ? '<div style="font-size:11px; color:var(--text-muted); margin-top:4px;">$' + Number(p.package_price_cop).toLocaleString('en-US') + ' COP</div>' : ''}
      </div>
    </div>
    ${p.release_date ? '<div style="font-size:11px; color:var(--neon-orange); margin-top:6px;">Release: ' + escapeHtml(p.release_date) + '</div>' : ''}
  </div>
`;

const contractsHtml = `
  <div class="contracts-section">
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
      <div class="mgmt-col-title" style="margin-bottom:0;">Contratos</div>
      <span style="font-size:11px; color:var(--text-dim);">${activeProjects.length} activo${activeProjects.length !== 1 ? 's' : ''} · ${closedProjects.length} cerrado${closedProjects.length !== 1 ? 's' : ''}</span>
    </div>
    ${activeProjects.length === 0 && closedProjects.length === 0
      ? '<div style="padding:16px; text-align:center; color:var(--text-dim); font-size:12px;">Sin contratos registrados</div>'
      : activeProjects.map(renderProjectCard).join('') +
        (closedProjects.length > 0
          ? '<div style="font-size:10px; text-transform:uppercase; letter-spacing:1.5px; color:var(--text-dim); margin:12px 0 8px; font-weight:600;">Cerrados</div>' +
            closedProjects.map(renderProjectCard).join('')
          : '')
    }
  </div>
`;
```

### Insertar en el grid:

Modificar el `gridHtml` (linea ~3889) para incluir contratos ARRIBA de objetivos en la columna izquierda:

```javascript
const gridHtml = `
  <div class="mgmt-grid">
    <div class="mgmt-col">
      ${contractsHtml}
      <div class="mgmt-col-title">Objetivos y entregables</div>
      ${objectivesHtml}
      ${addObjBtn}
    </div>
    <div class="mgmt-col">
      <div class="mgmt-col-title">Reuniones y misiones</div>
      <div id="m5-meetings-${client.id}" class="m5-panel"></div>
      <div id="m5-missions-${client.id}" class="m5-panel"></div>
    </div>
  </div>
`;
```

---

## PASO 4: CSS — Estilos para contract cards

Agregar despues de los estilos de `.mgmt-objective-detail-card` o similar:

```css
.contracts-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border);
}
.contract-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 8px;
  transition: all 0.2s;
}
.contract-card:hover {
  border-color: var(--neon-violet);
  cursor: pointer;
}
.contract-card.completed,
.contract-card.cancelled {
  opacity: 0.6;
}
```

---

## PASO 5: VERIFICACION

1. Reiniciar server: `node server.js`
2. Abrir `localhost:3737` → Artistas → Click en Reckless (tiene projects)
3. En la columna izquierda debe aparecer:
   - **Contratos** (con conteo activos/cerrados)
   - Cards de cada proyecto con icono, nombre, tipo, fase, precio
   - Separador visual
   - **Objetivos y entregables** (como estaba antes)
4. Verificar artistas sin projects (ej: Jot4 R) → debe mostrar "Sin contratos registrados"
5. Verificar que objetivos, entregables, reuniones y misiones siguen funcionando igual

---

## CHECKLIST

- [ ] `db.js`: Query de projects en `getArtistDashboard()` con join a clients
- [ ] `db.js`: Agregar `projects` al return
- [ ] `index.html`: Pasar `projects` en el objeto `detail` desde `openArtistDashboard()`
- [ ] `index.html`: Extraer `projects` en `renderMgmtClientDetail()`
- [ ] `index.html`: Crear HTML de seccion contratos con cards activos/cerrados
- [ ] `index.html`: Insertar seccion contratos ARRIBA de objetivos en columna izquierda
- [ ] `index.html`: CSS para `.contracts-section` y `.contract-card`
- [ ] Verificar con artista con projects (Reckless)
- [ ] Verificar con artista sin projects
- [ ] Verificar que el resto de la vista interna sigue igual
