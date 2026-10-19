# PROMPT: 6 Modificaciones a la Vista Interna Editorial Noir

> **Para:** CTO Jr (Claude Code operativo)
> **Prerequisito:** La vista interna Editorial Noir ya está implementada (PROMPT-VISTA-INTERNA-EDITORIAL-NOIR.md)
> **Archivo target:** `agent-dashboard/index.html`, `agent-dashboard/server.js`, `agent-dashboard/db.js`

---

## MODIFICACIÓN 1: Fecha de inicio y cierre del contrato en el Hero

### Lógica de negocio
- **Fecha de inicio** = fecha de la PRIMERA reunión registrada del artista (`mgmt_meetings.held_at` más antigua, ORDER BY ASC LIMIT 1)
- **Fecha de cierre** = fecha de inicio + 29 días
- Si no hay reuniones registradas, mostrar "SIN INICIO" en lugar de las fechas

### Backend (`db.js`)
En `getArtistDashboard()`, después de obtener los objectives (línea ~1605), agregar la query para la primera reunión:

```javascript
// Calcular fecha de inicio (primera reunión) y cierre (+29 días)
let serviceStart = null;
let serviceEnd = null;
if (objectives.length > 0) {
  const allMeetingIds = objectives.flatMap(o => (o.mgmt_meetings || []).map(m => m.held_at)).filter(Boolean);
  if (allMeetingIds.length > 0) {
    allMeetingIds.sort();
    serviceStart = allMeetingIds[0];
    const endDate = new Date(serviceStart);
    endDate.setDate(endDate.getDate() + 29);
    serviceEnd = endDate.toISOString().substring(0, 10);
  }
}
lineData.service_start = serviceStart;
lineData.service_end = serviceEnd;
```

### Frontend (`index.html`)
En `renderMgmtClientDetail`, dentro del bloque `priceHtml` (el `div.gs-hero__price`), DESPUÉS de la línea del ciclo, agregar las fechas:

```javascript
// Dentro de priceHtml, después de gs-hero__price-cycle
var serviceStart = engagement ? (detail.service_lines || []).find(function(s) { return s.service_start; }) : null;
var startDate = serviceStart ? serviceStart.service_start : null;
var endDate = serviceStart ? serviceStart.service_end : null;

// Formatear fechas
function formatGsDate(dateStr) {
  if (!dateStr) return '—';
  var d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace('.', '');
}
```

Agregar dentro de `gs-hero__price`, después del ciclo:
```html
<div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--gs-bd-08);">
  <div style="display:flex;gap:24px;">
    <div>
      <div style="font-family:var(--gs-font-display);font-size:9px;letter-spacing:2px;color:var(--gs-text-3);">INICIO</div>
      <div style="font-family:var(--gs-font-display);font-size:13px;font-weight:500;margin-top:4px;color:var(--gs-text);">{startDate}</div>
    </div>
    <div>
      <div style="font-family:var(--gs-font-display);font-size:9px;letter-spacing:2px;color:var(--gs-text-3);">CIERRE</div>
      <div style="font-family:var(--gs-font-display);font-size:13px;font-weight:500;margin-top:4px;color:var(--gs-amber);">{endDate}</div>
    </div>
  </div>
</div>
```

La fecha de cierre se muestra en ámbar (`--gs-amber: #ff8a3d`) para dar urgencia visual.

---

## MODIFICACIÓN 2: Datos de Reckless ya actualizados

**YA HECHO.** La metadata de Reckless en Supabase fue actualizada a:
```json
{
  "city": "New York",
  "country": "US",
  "service_start_date": "2026-06-01"
}
```

El código ya lee `metadata.city` y `client.country`, así que debería mostrar "NEW YORK, US" automáticamente. **No requiere cambios de código.**

Queda como **pendiente operativo** registrar el contexto completo de Reckless (en la BÓVEDA `06_CLIENTES/reckless/00-contexto/`).

---

## MODIFICACIÓN 3: Upload de foto de perfil del artista

### Bucket Supabase
Ya creado: `artist-avatars` (público, max 5MB, solo jpg/png/webp).

### Backend — `db.js`

Agregar función de upload (junto a las otras funciones de storage, ~línea 155):

```javascript
async function uploadArtistAvatar(artistId, slug, fileBuffer, mimeType) {
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const storagePath = slug + '/avatar.' + ext;

  // Upsert: borrar anterior si existe
  await supabase.storage.from('artist-avatars').remove([storagePath]).catch(() => {});

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('artist-avatars')
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: true
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('artist-avatars')
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;

  // Guardar URL en metadata del artista
  const { data: artist } = await supabase.from('artists')
    .select('metadata')
    .eq('id', artistId)
    .single();

  const currentMeta = artist?.metadata || {};
  await supabase.from('artists')
    .update({ metadata: { ...currentMeta, key_visual_url: publicUrl } })
    .eq('id', artistId);

  return { url: publicUrl, path: storagePath };
}
```

Exportar la función en el bloque de exports al final del archivo:
```javascript
  uploadArtistAvatar,
```

### Backend — `server.js`

Agregar endpoint (junto a los otros endpoints de artist, ~después del DELETE artist-link):

```javascript
// POST /api/artist/:slug/avatar - Upload artist key visual
const avatarUploadMatch = pathname.match(/^\/api\/artist\/([^\/]+)\/avatar$/);
if (avatarUploadMatch && req.method === 'POST') {
  const slug = avatarUploadMatch[1];
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', async () => {
    try {
      const buffer = Buffer.concat(chunks);
      const contentType = req.headers['content-type'] || '';

      // Parse multipart form data (same pattern as deliverable upload)
      let fileBuffer, fileMimeType;

      if (contentType.includes('multipart/form-data')) {
        const boundary = contentType.split('boundary=')[1];
        const parts = buffer.toString('binary').split('--' + boundary);
        for (const part of parts) {
          if (part.includes('filename=')) {
            const headerEnd = part.indexOf('\r\n\r\n') + 4;
            const bodyEnd = part.lastIndexOf('\r\n');
            fileBuffer = Buffer.from(part.substring(headerEnd, bodyEnd), 'binary');
            if (part.includes('image/png')) fileMimeType = 'image/png';
            else if (part.includes('image/webp')) fileMimeType = 'image/webp';
            else fileMimeType = 'image/jpeg';
            break;
          }
        }
      }

      if (!fileBuffer) throw new Error('No file found in request');

      const { data: artist, error } = await db.supabase
        .from('artists').select('id').eq('slug', slug).single();
      if (error) throw error;

      const result = await db.uploadArtistAvatar(artist.id, slug, fileBuffer, fileMimeType);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, url: result.url }));
    } catch (err) {
      console.error('Avatar upload error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
  return;
}
```

### Frontend — `index.html`

En `renderMgmtClientDetail`, el bloque del avatar cambia para:
1. Mostrar la imagen si `metadata.key_visual_url` existe
2. Hacer click para subir una nueva foto

Reemplazar la línea del avatar en el hero:

```javascript
var avatarUrl = meta.key_visual_url || null;
var avatarHtml = avatarUrl
  ? '<img class="gs-hero__avatar" src="' + escapeHtml(avatarUrl) + '" alt="Key Visual" id="gs-avatar" style="cursor:pointer" title="Click para cambiar foto">'
  : '<div class="gs-hero__avatar" id="gs-avatar" style="cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:var(--gs-font-display);font-size:9px;letter-spacing:2px;" title="Click para subir foto">// KEY VISUAL</div>';
```

Agregar input file oculto en el hero y handler:

```javascript
// Después de container.innerHTML = ...
var avatar = document.getElementById('gs-avatar');
if (avatar) {
  var avatarInput = document.createElement('input');
  avatarInput.type = 'file';
  avatarInput.accept = 'image/jpeg,image/png,image/webp';
  avatarInput.style.display = 'none';
  container.appendChild(avatarInput);

  avatar.addEventListener('click', function() { avatarInput.click(); });

  avatarInput.addEventListener('change', async function() {
    var file = avatarInput.files[0];
    if (!file) return;
    avatar.style.opacity = '0.5';
    try {
      var formData = new FormData();
      formData.append('file', file);
      var res = await fetch('/api/artist/' + encodeURIComponent(slug) + '/avatar', {
        method: 'POST',
        body: formData
      });
      var result = await res.json();
      if (result.error) throw new Error(result.error);
      // Actualizar avatar inline
      if (avatar.tagName === 'IMG') {
        avatar.src = result.url;
      } else {
        var img = document.createElement('img');
        img.className = 'gs-hero__avatar';
        img.src = result.url;
        img.id = 'gs-avatar';
        img.style.cursor = 'pointer';
        img.title = 'Click para cambiar foto';
        avatar.replaceWith(img);
      }
      showToast('Foto actualizada');
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally {
      avatar.style.opacity = '1';
    }
  });
}
```

---

## MODIFICACIÓN 4: Engranaje → Modal de editar artista

### Lógica
Reutilizar la estructura del modal `openOnboardClientModal()` (línea ~5751) pero en modo edición:
- Pre-llenar todos los campos con los datos actuales del artista
- El slug es de solo lectura
- El botón dice "Guardar Cambios" en vez de "Crear Artista"
- Al guardar, hace PATCH en vez de POST

### Backend — `server.js`

Agregar endpoint PATCH para actualizar artista:

```javascript
// PATCH /api/artist/:slug
const artistPatchMatch = pathname.match(/^\/api\/artist\/([^\/]+)$/);
if (artistPatchMatch && req.method === 'PATCH') {
  const slug = artistPatchMatch[1];
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const payload = JSON.parse(body);
      const updateData = {};

      if (payload.stage_name) updateData.stage_name = payload.stage_name;
      if (payload.status) updateData.status = payload.status;

      // Merge metadata (no sobreescribir todo)
      if (payload.metadata) {
        const { data: current } = await db.supabase
          .from('artists').select('metadata').eq('slug', slug).single();
        updateData.metadata = { ...(current?.metadata || {}), ...payload.metadata };
      }

      const { data: updated, error } = await db.supabase
        .from('artists')
        .update(updateData)
        .eq('slug', slug)
        .select('id, slug, stage_name, status, metadata')
        .single();

      if (error) throw error;

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, artist: updated }));
    } catch (err) {
      console.error('Error updating artist:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
  return;
}
```

### Frontend — `index.html`

Crear función `openEditArtistModal(slug)` que:

```javascript
async function openEditArtistModal(slug) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  // Cargar datos actuales
  try {
    const res = await fetch('/api/artist/' + encodeURIComponent(slug) + '/dashboard');
    const data = await res.json();
    const artist = data.artist;
    const meta = artist.metadata || {};

    content.innerHTML =
      '<div class="modal-title">Editar Artista</div>' +
      '<div class="modal-subtitle">' + escapeHtml(artist.display_name) + '</div>' +

      '<div class="form-section">' +
        '<div class="form-section-title">DATOS DEL ARTISTA</div>' +
        '<div class="form-row full">' +
          '<div class="form-field-group">' +
            '<label class="modal-label">Stage Name *</label>' +
            '<input type="text" class="modal-input" id="edit-name" value="' + escapeHtml(artist.display_name || '') + '">' +
          '</div>' +
        '</div>' +
        '<div class="form-row full">' +
          '<div class="form-field-group">' +
            '<label class="modal-label">Slug (no editable)</label>' +
            '<input type="text" class="modal-input" id="edit-slug" value="' + escapeHtml(artist.slug) + '" readonly style="opacity:0.5;cursor:default;">' +
          '</div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-field-group">' +
            '<label class="modal-label">Estado</label>' +
            '<select class="modal-select" id="edit-status">' +
              '<option value="active"' + (artist.status === 'active' ? ' selected' : '') + '>Active</option>' +
              '<option value="paused"' + (artist.status === 'paused' ? ' selected' : '') + '>Paused</option>' +
              '<option value="closed"' + (artist.status === 'closed' ? ' selected' : '') + '>Closed</option>' +
            '</select>' +
          '</div>' +
          '<div class="form-field-group">' +
            '<label class="modal-label">Tier</label>' +
            '<select class="modal-select" id="edit-tier">' +
              '<option value="1"' + (meta.tier == 1 ? ' selected' : '') + '>Tier 1 - Emergente</option>' +
              '<option value="2"' + (meta.tier == 2 ? ' selected' : '') + '>Tier 2 - Crecimiento</option>' +
              '<option value="3"' + (meta.tier == 3 ? ' selected' : '') + '>Tier 3 - Establecido</option>' +
              '<option value="4"' + (meta.tier == 4 ? ' selected' : '') + '>Tier 4 - Estrella</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-field-group">' +
            '<label class="modal-label">Pais</label>' +
            '<input type="text" class="modal-input" id="edit-country" value="' + escapeHtml(meta.country || '') + '" placeholder="US">' +
          '</div>' +
          '<div class="form-field-group">' +
            '<label class="modal-label">Ciudad</label>' +
            '<input type="text" class="modal-input" id="edit-city" value="' + escapeHtml(meta.city || '') + '" placeholder="New York">' +
          '</div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-field-group">' +
            '<label class="modal-label">Genero</label>' +
            '<input type="text" class="modal-input" id="edit-genre" value="' + escapeHtml(meta.genre || '') + '" placeholder="indie pop urbano">' +
          '</div>' +
          '<div class="form-field-group">' +
            '<label class="modal-label">Manager</label>' +
            '<input type="text" class="modal-input" id="edit-manager" value="' + escapeHtml(meta.manager || '') + '">' +
          '</div>' +
        '</div>' +
        '<div class="form-row full">' +
          '<div class="form-field-group">' +
            '<label class="modal-label">Sello</label>' +
            '<input type="text" class="modal-input" id="edit-label" value="' + escapeHtml(meta.label || '') + '">' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="form-section">' +
        '<div class="form-section-title">NOTAS</div>' +
        '<div class="form-row full">' +
          '<div class="form-field-group">' +
            '<textarea class="modal-textarea" id="edit-notes" placeholder="Contexto, referencias...">' + escapeHtml(meta.notes || '') + '</textarea>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="modal-actions">' +
        '<button class="modal-btn cancel" id="edit-cancel">Cancelar</button>' +
        '<button class="modal-btn confirm" id="edit-save">Guardar Cambios</button>' +
      '</div>';

    overlay.classList.add('show');

    document.getElementById('edit-cancel').addEventListener('click', function() {
      overlay.classList.remove('show');
    });

    document.getElementById('edit-save').addEventListener('click', async function() {
      var saveBtn = document.getElementById('edit-save');
      saveBtn.textContent = 'Guardando...';
      saveBtn.disabled = true;

      try {
        var payload = {
          stage_name: document.getElementById('edit-name').value.trim(),
          status: document.getElementById('edit-status').value,
          metadata: {
            tier: parseInt(document.getElementById('edit-tier').value) || 1,
            country: document.getElementById('edit-country').value.trim() || null,
            city: document.getElementById('edit-city').value.trim() || null,
            genre: document.getElementById('edit-genre').value.trim() || null,
            manager: document.getElementById('edit-manager').value.trim() || null,
            label: document.getElementById('edit-label').value.trim() || null,
            notes: document.getElementById('edit-notes').value.trim() || null
          }
        };

        var res = await fetch('/api/artist/' + encodeURIComponent(slug), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        var result = await res.json();
        if (result.error) throw new Error(result.error);

        showToast('Artista actualizado');
        overlay.classList.remove('show');

        // Recargar la vista
        if (typeof openArtistDashboard === 'function') {
          openArtistDashboard(slug);
        }
      } catch (err) {
        showToast('Error: ' + err.message);
        saveBtn.textContent = 'Guardar Cambios';
        saveBtn.disabled = false;
      }
    });

  } catch (err) {
    showToast('Error cargando datos: ' + err.message);
  }
}
```

Luego, en `renderMgmtClientDetail`, el handler del settings button ya apunta a esta función:
```javascript
settingsBtn.addEventListener('click', function() {
  openEditArtistModal(slug);
});
```

---

## MODIFICACIÓN 5: Vista previa de links con iframe

Todas las páginas de recursos son de GrowthStars, así que iframe funciona sin problemas de X-Frame-Options.

### CSS

Reemplazar `.gs-res__preview` por:

```css
.gs-res__preview {
  width: 100%; height: 152px; display: block;
  border: none; background: #0a0a0a;
}
.gs-res__preview-placeholder {
  width: 100%; height: 152px; display: flex; align-items: center; justify-content: center;
  color: #7d7d7d; font-family: var(--gs-font-display); font-size: 9px; letter-spacing: 2px;
  background: repeating-linear-gradient(135deg, #0d0d0d 0, #0d0d0d 8px, #080808 8px, #080808 16px);
}
```

### Frontend

En `loadGsResources`, cambiar la línea del preview dentro del `.gs-res` card:

```javascript
// Reemplazar la div de preview por iframe o placeholder
var previewHtml = link.url
  ? '<iframe class="gs-res__preview" src="' + escapeHtml(link.url) + '" loading="lazy" sandbox="allow-same-origin" tabindex="-1" scrolling="no" style="pointer-events:none;"></iframe>'
  : '<div class="gs-res__preview-placeholder">Captura &middot; ' + escapeHtml(link.label || '') + '</div>';
```

**Notas técnicas del iframe:**
- `loading="lazy"` — solo carga cuando el carrusel scrollea hasta esa card
- `sandbox="allow-same-origin"` — seguridad: solo permite lectura del mismo origen
- `pointer-events:none` — evita que el usuario interactúe con el iframe (el click va a la card `<a>`)
- `scrolling="no"` — sin scrollbars dentro del preview
- `tabindex="-1"` — no recibe focus con Tab

Si algún link externo NO carga en iframe, fallback automático: agregar `onerror` listener que reemplaza el iframe por el placeholder:

```javascript
// Después de section.innerHTML = ...
section.querySelectorAll('.gs-res__preview').forEach(function(iframe) {
  iframe.addEventListener('error', function() {
    var placeholder = document.createElement('div');
    placeholder.className = 'gs-res__preview-placeholder';
    placeholder.textContent = 'Vista previa no disponible';
    iframe.replaceWith(placeholder);
  });
});
```

---

## MODIFICACIÓN 6: Informe del Mes (sección nueva en columna derecha)

### Concepto
Nueva sección **"INFORME DEL MES"** que va ARRIBA de la Bitácora en la columna derecha (`gs-col-side`). Contiene un único link al documento de cierre mensual con avances, metas alcanzadas y próximos pasos. Un informe por engagement/mes.

### Almacenamiento
Se guarda en `mgmt_engagements.metadata.report_url` (campo JSONB ya existente). **NO requiere nueva columna ni nueva tabla.**

### CSS

Agregar estos estilos con los demás de Editorial Noir:

```css
/* --- INFORME DEL MES --- */
.gs-report {
  padding: 22px 0 28px;
  border-bottom: 1px solid var(--gs-bd-06);
  margin-bottom: 0;
}
.gs-report__card {
  display: flex; align-items: center; gap: 16px;
  padding: 16px 18px;
  background: var(--gs-surf-1); border: 1px solid var(--gs-bd-10); border-radius: 6px;
  text-decoration: none; transition: border-color .2s, transform .2s;
}
.gs-report__card:hover { border-color: var(--gs-lime); transform: translateY(-2px); }
.gs-report__icon {
  width: 40px; height: 40px; flex: none; display: flex; align-items: center; justify-content: center;
  background: rgba(198,255,0,.08); border: 1px solid rgba(198,255,0,.2); border-radius: 6px;
  font-size: 18px;
}
.gs-report__info { flex: 1; min-width: 0; }
.gs-report__title {
  font-family: var(--gs-font-display); font-size: 14px; font-weight: 600;
  color: var(--gs-text); line-height: 1.2;
}
.gs-report__sub {
  font-family: var(--gs-font-display); font-size: 9px; letter-spacing: 2px;
  color: var(--gs-text-3); margin-top: 4px;
}
.gs-report__arrow {
  font-family: var(--gs-font-display); font-size: 16px; color: var(--gs-lime); flex: none;
}
.gs-report__empty {
  padding: 16px 18px;
  background: var(--gs-surf-1); border: 1px dashed var(--gs-bd-16); border-radius: 6px;
  display: flex; align-items: center; gap: 14px;
}
.gs-report__empty-text {
  flex: 1; font-size: 12px; color: var(--gs-text-3);
  font-family: var(--gs-font-display); letter-spacing: 1px;
}
.gs-report__add-btn {
  padding: 7px 14px; background: transparent;
  border: 1px solid var(--gs-lime); border-radius: 4px;
  color: var(--gs-lime); font-family: var(--gs-font-display);
  font-size: 10px; font-weight: 600; letter-spacing: 1.5px;
  cursor: pointer; transition: all .15s; flex: none;
}
.gs-report__add-btn:hover { background: rgba(198,255,0,.08); }

/* Form inline para agregar/editar link del informe */
.gs-report__form {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 18px;
  background: var(--gs-surf-1); border: 1px solid rgba(198,255,0,.3); border-radius: 6px;
}
.gs-report__form-input {
  flex: 1; min-width: 0; background: var(--gs-surf-3);
  border: 1px solid var(--gs-bd-12); border-radius: 4px;
  padding: 8px 12px; color: var(--gs-text);
  font-family: var(--gs-font-body); font-size: 12.5px; outline: none;
}
.gs-report__form-ok {
  padding: 8px 14px; background: var(--gs-lime); border: none; border-radius: 4px;
  color: #000; font-family: var(--gs-font-display); font-size: 10px;
  font-weight: 600; letter-spacing: 1.5px; cursor: pointer;
}
.gs-report__form-x {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  background: transparent; border: none; color: var(--gs-text-4);
  font-size: 14px; cursor: pointer;
}
.gs-report__form-x:hover { color: var(--gs-danger); }
```

### Backend — `server.js`

Agregar endpoint para guardar/actualizar el report URL del engagement:

```javascript
// PATCH /api/engagement/:id/report
const engReportMatch = pathname.match(/^\/api\/engagement\/([^\/]+)\/report$/);
if (engReportMatch && req.method === 'PATCH') {
  const engId = engReportMatch[1];
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const { report_url } = JSON.parse(body);

      // Leer metadata actual y hacer merge
      const { data: current } = await db.supabase
        .from('mgmt_engagements').select('metadata').eq('id', engId).single();

      const newMeta = { ...(current?.metadata || {}), report_url: report_url || null };

      const { error } = await db.supabase
        .from('mgmt_engagements')
        .update({ metadata: newMeta })
        .eq('id', engId);

      if (error) throw error;

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      console.error('Error updating report:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
  return;
}
```

### Frontend — `index.html`

En `renderMgmtClientDetail`, el grid de la columna derecha (`gs-col-side`) debe tener la sección de informe ARRIBA de la bitácora.

Dentro del bloque `gridHtml`, en el `div.gs-col-side`, ANTES de la bitácora, agregar:

```javascript
// Obtener report URL del engagement
var reportUrl = engagement && engagement.metadata ? engagement.metadata.report_url : null;
var engagementId = engagement ? engagement.id : null;
var reportMonth = engagement ? engagement.month : '';

var reportHtml = '<div class="gs-report">' +
  '<div class="gs-sec__head"><h2 class="gs-sec__title">INFORME DEL MES</h2><span class="gs-sec__rule"></span></div>';

if (reportUrl) {
  reportHtml += '<a class="gs-report__card" href="' + escapeHtml(reportUrl) + '" target="_blank">' +
    '<div class="gs-report__icon">&#128203;</div>' +
    '<div class="gs-report__info">' +
      '<div class="gs-report__title">Documento de Cierre</div>' +
      '<div class="gs-report__sub">AVANCES &middot; METAS &middot; PR&Oacute;XIMOS PASOS</div>' +
    '</div>' +
    '<span class="gs-report__arrow">&nearr;</span>' +
  '</a>';
} else {
  reportHtml += '<div class="gs-report__empty" id="gs-report-empty">' +
    '<span class="gs-report__empty-text">SIN INFORME ESTE MES</span>' +
    '<button class="gs-report__add-btn" id="gs-report-add">+ AGREGAR</button>' +
  '</div>';
}

reportHtml += '</div>';
```

Luego, insertar `reportHtml` en el `gridHtml` antes de la bitácora:

```javascript
'<div class="gs-col-side">' +
  reportHtml +  // <-- INFORME DEL MES (nuevo)
  '<div class="gs-sec__head">...' +  // BITÁCORA (existente)
```

Después de `container.innerHTML = ...`, agregar el handler para el botón + AGREGAR:

```javascript
// Report add handler
var reportAddBtn = document.getElementById('gs-report-add');
if (reportAddBtn && engagementId) {
  reportAddBtn.addEventListener('click', function() {
    var emptyDiv = document.getElementById('gs-report-empty');
    emptyDiv.outerHTML = '<div class="gs-report__form" id="gs-report-form">' +
      '<input class="gs-report__form-input" id="gs-report-input" placeholder="URL del informe de cierre">' +
      '<button class="gs-report__form-ok" id="gs-report-save">GUARDAR</button>' +
      '<button class="gs-report__form-x" id="gs-report-cancel">&times;</button>' +
    '</div>';

    document.getElementById('gs-report-input').focus();

    document.getElementById('gs-report-cancel').addEventListener('click', function() {
      // Recargar vista para restaurar estado
      openArtistDashboard(slug);
    });

    document.getElementById('gs-report-save').addEventListener('click', async function() {
      var url = document.getElementById('gs-report-input').value.trim();
      if (!url) { showToast('La URL es obligatoria'); return; }

      try {
        await fetch('/api/engagement/' + engagementId + '/report', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report_url: url })
        });
        showToast('Informe guardado');
        openArtistDashboard(slug);
      } catch (err) {
        showToast('Error: ' + err.message);
      }
    });
  });
}
```

**Si ya hay informe y se quiere editar/reemplazar:** agregar un botón de editar dentro de `.gs-report__card`:

```javascript
// Después del arrow, agregar botón editar (solo visible en hover via CSS o siempre visible)
// Alternativa: click derecho o doble click para editar
// Recomendación simple: agregar un pequeño botón "✎" después del arrow
```

### Datos

El campo `engagement.metadata.report_url` ya viene en el response de `/api/artist/:slug/dashboard` porque el engagement se consulta con `select('*')`. **No requiere cambios en db.js.**

### En el Portal del Artista

También mostrar el informe en el portal (solo lectura). En `renderPortal()`, después de la barra de progreso general y antes de los objetivos, agregar:

```javascript
// Informe del mes (si existe)
if (engagement && engagement.metadata && engagement.metadata.report_url) {
  html += '<a class="gs-report__card" href="' + esc(engagement.metadata.report_url) + '" target="_blank" style="margin-bottom:24px;display:flex;">' +
    '<div class="gs-report__icon">&#128203;</div>' +
    '<div class="gs-report__info">' +
      '<div class="gs-report__title">Informe del Mes</div>' +
      '<div class="gs-report__sub">AVANCES &middot; METAS &middot; PR&Oacute;XIMOS PASOS</div>' +
    '</div>' +
    '<span class="gs-report__arrow">&nearr;</span>' +
  '</a>';
}
```

Y agregar los estilos de `.gs-report__card`, `.gs-report__icon`, `.gs-report__info`, `.gs-report__title`, `.gs-report__sub`, `.gs-report__arrow` al CSS del portal también.

---

## RESUMEN DE ARCHIVOS A MODIFICAR

| Archivo | Modificaciones |
|---|---|
| `db.js` | Agregar `uploadArtistAvatar()`, calcular `service_start/end` en `getArtistDashboard()` |
| `server.js` | Agregar `POST /api/artist/:slug/avatar`, `PATCH /api/artist/:slug`, `PATCH /api/engagement/:id/report` |
| `index.html` CSS | Agregar `.gs-res__preview` iframe styles, `.gs-report` section styles |
| `index.html` JS | Actualizar `renderMgmtClientDetail` (avatar click, fechas, informe del mes), agregar `openEditArtistModal()`, actualizar `loadGsResources` (iframe preview) |
| `artist-portal.html` | Agregar estilos `.gs-report__card` + mostrar informe si existe |

## ORDEN DE IMPLEMENTACIÓN

1. **Mod 2** — Ya hecho (verificar que NEW YORK, US aparece)
2. **Mod 3** — Backend avatar upload → frontend click-to-upload
3. **Mod 4** — Backend PATCH artist → frontend edit modal
4. **Mod 1** — Calcular fechas en backend → mostrar en hero
5. **Mod 5** — Iframe previews en carrusel
6. **Mod 6** — Informe del Mes: backend PATCH report → frontend sección + form inline + portal

## REGLAS

- NO tocar el CSS Editorial Noir ya implementado
- NO modificar otras vistas (métricas, agentes, contratos)
- Reusar los patrones existentes (upload como deliverables, modal como onboard)
- El bucket `artist-avatars` YA EXISTE en Supabase Storage (público)
- Endpoint PATCH de artista hace MERGE de metadata, no sobreescribe
- Informe del Mes usa `mgmt_engagements.metadata.report_url` (JSONB merge, no columna nueva)
