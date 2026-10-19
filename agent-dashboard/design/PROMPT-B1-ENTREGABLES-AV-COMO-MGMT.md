# PROMPT: Entregables AV con formato MGMT (archivo/link + status badge)

> **Para:** CTO Jr (Claude Code operativo)
> **Scope:** Reemplazar el checklist de entregables AV por el mismo componente de entregables que usa MGMT
> **Archivo target:** `agent-dashboard/index.html`
> **Referencia:** El componente `.mgmt-deliverable-row` (linea ~3823) es el patron a replicar

---

## CONTEXTO

Los entregables del videoclip se implementaron como checkboxes simples. Ian quiere que usen el MISMO formato visual que los entregables de los objetivos MGMT:

```
[Titulo] [Status Badge: pending/done] [Adjuntar archivo | Agregar link | Ver PDF/LINK]
```

El componente ya existe en el codebase — es `.mgmt-deliverable-row` (linea ~3823). Tiene:
- Titulo del entregable
- Status badge (pending/done/in_progress)
- Zona de acciones:
  - Si NO tiene archivo: drop-zone "Adjuntar" + boton link (🔗)
  - Si TIENE archivo/link: boton "Ver PDF/LINK" + boton reemplazar (↻)

NO crear un componente nuevo. Reutilizar las mismas clases CSS y el mismo patron HTML.

---

## QUE CAMBIAR

En la funcion que renderiza los entregables AV (la que produce el checklist actual), reemplazar cada fila de checkbox por una fila tipo `.mgmt-deliverable-row`.

### ANTES (checklist actual):
```html
<div class="av-deliverable-row">
  <input type="checkbox" ...>
  <div class="av-deliverable-label">Cuenta de Cobro</div>
  <button class="av-action-btn">📎</button>
</div>
```

### DESPUES (formato MGMT):
```html
<div class="mgmt-deliverable-row" data-av-deliverable data-phase="pre-produccion" data-key="cuenta-cobro">
  <div class="mgmt-deliverable-title">Cuenta de Cobro</div>
  <span class="mgmt-status-badge ${status}" data-av-status="${key}">${status}</span>
  <div class="deliverable-actions">
    <!-- Si NO tiene valor (pending): -->
    <label class="drop-zone" data-av-upload-phase="pre-produccion" data-av-upload-key="cuenta-cobro">
      <svg class="drop-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
      </svg>
      <span class="drop-zone-text">Adjuntar</span>
      <input type="file" style="display:none;" data-av-file-phase="pre-produccion" data-av-file-key="cuenta-cobro">
    </label>
    <button class="replace-btn" data-av-link-phase="pre-produccion" data-av-link-key="cuenta-cobro" title="Agregar link" style="font-size:14px;">&#128279;</button>

    <!-- Si TIENE valor (done): -->
    <!-- Para links: -->
    <a href="${value}" target="_blank" class="view-pdf-btn">
      <svg class="drop-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
      Ver LINK
    </a>
    <button class="replace-btn" data-av-link-phase="${phase}" data-av-link-key="${key}">&#8635;</button>

    <!-- Para archivos: -->
    <button class="view-pdf-btn" data-av-view-phase="${phase}" data-av-view-key="${key}">
      <svg class="drop-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      Ver PDF
    </button>
    <button class="replace-btn" data-av-upload-phase="${phase}" data-av-upload-key="${key}">&#8635;</button>
  </div>
</div>
```

---

## LOGICA DE RENDERIZADO POR ITEM

```javascript
function renderAVDeliverableItem(item, phase) {
  const hasValue = item.value && item.value.trim();
  const isLink = item.type === 'link';
  const status = hasValue ? 'done' : 'pending';

  let actionsHtml = '';
  if (hasValue) {
    if (isLink) {
      actionsHtml = `
        <a href="${escapeHtml(item.value)}" target="_blank" class="view-pdf-btn">
          <svg class="drop-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          Ver LINK
        </a>
        <button class="replace-btn" data-av-link-phase="${phase}" data-av-link-key="${item.key}" title="Cambiar link">&#8635;</button>
      `;
    } else {
      actionsHtml = `
        <button class="view-pdf-btn" title="${escapeHtml(item.value)}">
          <svg class="drop-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          ${escapeHtml(item.value)}
        </button>
        <label class="replace-btn" title="Reemplazar archivo" style="cursor:pointer;">&#8635;
          <input type="file" style="display:none;" data-av-file-phase="${phase}" data-av-file-key="${item.key}">
        </label>
      `;
    }
  } else {
    if (isLink) {
      actionsHtml = `
        <button class="replace-btn" data-av-link-phase="${phase}" data-av-link-key="${item.key}" title="Agregar link" style="font-size:14px;">&#128279; Agregar link</button>
      `;
    } else {
      actionsHtml = `
        <label class="drop-zone" style="cursor:pointer;">
          <svg class="drop-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          <span class="drop-zone-text">Adjuntar</span>
          <input type="file" style="display:none;" data-av-file-phase="${phase}" data-av-file-key="${item.key}">
        </label>
        <button class="replace-btn" data-av-link-phase="${phase}" data-av-link-key="${item.key}" title="Agregar como link" style="font-size:14px;">&#128279;</button>
      `;
    }
  }

  return `
    <div class="mgmt-deliverable-row" data-av-deliverable data-phase="${phase}" data-key="${item.key}">
      <div class="mgmt-deliverable-title">${escapeHtml(item.label)}</div>
      <span class="mgmt-status-badge ${status}">${status}</span>
      <div class="deliverable-actions">
        ${actionsHtml}
      </div>
    </div>
  `;
}
```

---

## EVENT HANDLERS

### Link button (agregar o cambiar link):
```javascript
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-av-link-key]');
  if (!btn) return;
  const phase = btn.dataset.avLinkPhase;
  const key = btn.dataset.avLinkKey;
  const url = prompt('URL:');
  if (url === null) return;

  await fetch('/api/projects/' + currentDetailProject.id + '/deliverable', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phase, key, value: url || null, status: url ? 'done' : 'pending' })
  });
  // Recargar vista
  openAVProjectDetail(currentDetailProject.id);
});
```

### File upload:
```javascript
document.addEventListener('change', async (e) => {
  const input = e.target;
  if (!input.dataset.avFileKey) return;
  const phase = input.dataset.avFilePhase;
  const key = input.dataset.avFileKey;
  const file = input.files[0];
  if (!file) return;

  // TODO futuro: subir a Supabase Storage y guardar URL
  // Por ahora: guardar nombre del archivo como placeholder
  await fetch('/api/projects/' + currentDetailProject.id + '/deliverable', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phase, key, value: file.name, status: 'done' })
  });
  showToast('Archivo registrado: ' + file.name);
  openAVProjectDetail(currentDetailProject.id);
});
```

---

## ESTADO N/A (NO APLICA)

Algunos paquetes de videoclip no incluyen todos los entregables (ej: un videoclip basico puede no tener Propuesta de Vestuario). Para esto existe un tercer estado: **`n/a`**.

### Estados posibles por entregable:
- **`pending`** → incluido en el paquete, falta completar
- **`done`** → completado (tiene archivo o link)
- **`n/a`** → no incluido en este paquete (grisado, sin acciones)

### Renderizado del estado `n/a`:
```html
<div class="mgmt-deliverable-row" style="opacity:0.35; pointer-events:none;">
  <div class="mgmt-deliverable-title" style="text-decoration:line-through;">Propuesta de Vestuario</div>
  <span class="mgmt-status-badge" style="background:var(--bg-elevated); color:var(--text-dim);">n/a</span>
</div>
```

### Toggle para marcar n/a:
Agregar un boton pequeno (ej: ✕ o "N/A") al final de cada fila que permita marcar/desmarcar como `n/a`. Al marcar:
- Hace PATCH con `status: 'n/a'` y `value: null`
- La fila se grisea y se desactivan las acciones

Al desmarcar (click de nuevo):
- Hace PATCH con `status: 'pending'`
- La fila vuelve a la normalidad

```javascript
// Agregar boton n/a a cada fila (al final, despues de las acciones):
'<button class="av-na-btn" data-av-na-phase="${phase}" data-av-na-key="${item.key}" title="Marcar como no aplica" style="font-size:10px; background:none; border:1px solid var(--border); border-radius:4px; padding:2px 6px; color:var(--text-dim); cursor:pointer;">' +
  (item.status === 'n/a' ? 'Activar' : 'N/A') +
'</button>'
```

Handler:
```javascript
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-av-na-key]');
  if (!btn) return;
  const phase = btn.dataset.avNaPhase;
  const key = btn.dataset.avNaKey;
  
  // Leer estado actual del item para toggle
  const currentItem = currentDetailProject.metadata?.deliverables?.[phase]?.find(d => d.key === key);
  const newStatus = currentItem?.status === 'n/a' ? 'pending' : 'n/a';
  
  await fetch('/api/projects/' + currentDetailProject.id + '/deliverable', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phase, key, value: null, status: newStatus })
  });
  openAVProjectDetail(currentDetailProject.id);
});
```

### Conteo de progreso:
Los `n/a` NO cuentan en el conteo. Ejemplo: si hay 5 entregables y 1 es n/a:
```javascript
const applicable = items.filter(i => i.status !== 'n/a');
const doneCount = applicable.filter(i => i.status === 'done').length;
// Mostrar: 2/4 (no 2/5)
```

---

## QUE NO CAMBIAR

- Las fases (Pre-produccion, Produccion, Post-produccion) y sus headers con colores y conteos → mantener
- La progress bar de fases arriba → mantener
- El header del proyecto (titulo, artista, pagador, badge tipo) → mantener
- El endpoint `PATCH /api/projects/:id/deliverable` → ya existe, no tocar
- Los estilos CSS de `.mgmt-deliverable-row`, `.drop-zone`, `.view-pdf-btn`, `.replace-btn` → ya existen, reutilizar

---

## CHECKLIST

- [ ] Eliminar el componente de checkbox (`.av-deliverable-row` con `<input type="checkbox">`)
- [ ] Reemplazar con `renderAVDeliverableItem()` que produce `.mgmt-deliverable-row`
- [ ] Cada entregable muestra: titulo + status badge (pending/done) + acciones (adjuntar/link/ver)
- [ ] Handler de click para agregar/cambiar link (prompt URL)
- [ ] Handler de change para file upload (nombre por ahora)
- [ ] Items con valor muestran "Ver LINK" o nombre de archivo + boton reemplazar
- [ ] Items sin valor muestran drop-zone "Adjuntar" + boton link (🔗)
- [ ] Eliminar CSS custom de `.av-deliverable-*` y `.av-action-btn` (ya no se necesitan)
- [ ] Verificar visual: debe verse identico a los entregables de objetivos MGMT
- [ ] Estado `n/a`: boton para marcar/desmarcar entregable como "no aplica"
- [ ] Items `n/a` se muestran grisados con line-through y sin acciones
- [ ] Conteo de progreso excluye items `n/a` (ej: 2/4 no 2/5)
