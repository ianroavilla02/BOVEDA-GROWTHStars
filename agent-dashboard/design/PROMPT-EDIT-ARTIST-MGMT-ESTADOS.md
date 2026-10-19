# PROMPT: Modal Editar Artista completo + Estados MGMT (active/paused/inactive)

> **Para:** CTO Jr (Claude Code operativo)
> **Scope:** Modal de editar artista expandido + estados de engagement + filtro revenue + lista artistas
> **Archivos target:** `agent-dashboard/index.html`, `agent-dashboard/server.js`, `agent-dashboard/db.js`
> **Referencia:** El modal actual esta en PROMPT-MODIFICACIONES-VISTA-INTERNA.md (Mod 4)

---

## CONTEXTO

### Problema 1 — Modal de editar artista incompleto
El modal actual (engranaje en vista interna) solo permite editar datos del perfil (nombre, tier, pais, genero, manager, sello, notas). NO permite:
- Cambiar el pagador (client_id del engagement)
- Modificar el retainer MGMT (monto + moneda)
- Cambiar el estado del engagement MGMT

### Problema 2 — No hay estados de engagement
Hoy `mgmt_engagements.status` solo tiene `active`. Necesitamos 3 estados:
- **`active`** → paga retainer, SUMA al revenue, prioridad operativa
- **`paused`** → tiene monto historico pero NO SUMA al revenue (pausa temporal, va a volver)
- **`inactive`** → no paga, no suma, sin operacion activa (artistas colaborativos, $0)

Ejemplo real:
- Reckless: active, $1,200 USD/mes → SUMA
- Chimbita Records (Marlon + Javier): paused, $3M COP/mes → NO SUMA (estan en pausa estos meses)
- Ery, Jot4 R: inactive, $0 → NO SUMA (colaborativos)

### Problema 3 — Lista de artistas no distingue activos/inactivos
En la vista de artistas (sidebar → Artistas) todos los artistas se ven igual. No hay indicador visual de si su MGMT esta activo, pausado o inactivo.

---

## PASO 1: BACKEND — Endpoint para obtener engagement del artista (`server.js`)

Crear endpoint `GET /api/artist/:slug/engagement`:

```javascript
const artistEngMatch = pathname.match(/^\/api\/artist\/([^\/]+)\/engagement$/);
if (artistEngMatch && req.method === 'GET') {
  const slug = artistEngMatch[1];
  try {
    // Buscar artist
    const { data: artist } = await db.supabase
      .from('artists').select('id').eq('slug', slug).single();
    if (!artist) throw new Error('Artist not found');

    // Buscar service_line de MGMT
    const { data: sl } = await db.supabase
      .from('service_lines')
      .select('id')
      .eq('artist_id', artist.id)
      .eq('service_type_id', '7dd7837d-21bf-4712-a459-216ca3421a90') // MGMT
      .single();

    if (!sl) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ engagement: null }));
      return;
    }

    // Buscar engagement actual (mes actual o el mas reciente)
    const currentMonth = new Date().toISOString().substring(0, 7);
    let { data: engagement } = await db.supabase
      .from('mgmt_engagements')
      .select('*, clients(id, slug, display_name, type)')
      .eq('service_line_id', sl.id)
      .eq('month', currentMonth)
      .single();

    // Si no hay del mes actual, buscar el mas reciente
    if (!engagement) {
      const { data: latest } = await db.supabase
        .from('mgmt_engagements')
        .select('*, clients(id, slug, display_name, type)')
        .eq('service_line_id', sl.id)
        .order('month', { ascending: false })
        .limit(1)
        .single();
      engagement = latest;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ engagement }));
  } catch (err) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
  return;
}
```

---

## PASO 2: BACKEND — Endpoint PATCH para actualizar engagement (`server.js`)

```javascript
const engPatchMatch = pathname.match(/^\/api\/engagement\/([^\/]+)$/);
if (engPatchMatch && req.method === 'PATCH') {
  const engId = engPatchMatch[1];
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const payload = JSON.parse(body);
      const updates = {};
      if (payload.invoice_amount !== undefined) updates.invoice_amount = payload.invoice_amount;
      if (payload.invoice_currency) updates.invoice_currency = payload.invoice_currency;
      if (payload.status) updates.status = payload.status;
      if (payload.client_id) updates.client_id = payload.client_id;

      const { data, error } = await db.supabase
        .from('mgmt_engagements')
        .update(updates)
        .eq('id', engId)
        .select()
        .single();
      if (error) throw error;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, engagement: data }));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
  });
  return;
}
```

---

## PASO 3: FRONTEND — Expandir modal de editar artista (`index.html`)

El modal actual esta en `openEditArtistModal(slug)`. Agregar una seccion **"2. MGMT ENGAGEMENT"** DESPUES de la seccion de datos del artista y ANTES de notas.

### 3a. Cargar datos del engagement al abrir el modal

Despues de cargar los datos del artista, hacer un segundo fetch:

```javascript
// Dentro de openEditArtistModal, despues de obtener `data`:
const engRes = await fetch('/api/artist/' + encodeURIComponent(slug) + '/engagement');
const engData = await engRes.json();
const engagement = engData.engagement;
```

### 3b. Agregar seccion MGMT al HTML del modal

Insertar DESPUES del cierre de la seccion "DATOS DEL ARTISTA" (`</div>`) y ANTES de la seccion "NOTAS":

```javascript
'<div class="form-section">' +
  '<div class="form-section-title">2. MGMT ENGAGEMENT</div>' +
  (engagement ? (
    '<div class="form-row">' +
      '<div class="form-field-group">' +
        '<label class="modal-label">Estado MGMT</label>' +
        '<select class="modal-select" id="edit-eng-status">' +
          '<option value="active"' + (engagement.status === 'active' ? ' selected' : '') + '>Active — Paga, suma al revenue</option>' +
          '<option value="paused"' + (engagement.status === 'paused' ? ' selected' : '') + '>Paused — No suma (pausa temporal)</option>' +
          '<option value="inactive"' + (engagement.status === 'inactive' ? ' selected' : '') + '>Inactive — Sin operacion activa</option>' +
        '</select>' +
      '</div>' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-field-group">' +
        '<label class="modal-label">Retainer mensual</label>' +
        '<input type="number" class="modal-input" id="edit-eng-amount" value="' + (engagement.invoice_amount || 0) + '">' +
      '</div>' +
      '<div class="form-field-group">' +
        '<label class="modal-label">Moneda</label>' +
        '<select class="modal-select" id="edit-eng-currency">' +
          '<option value="USD"' + (engagement.invoice_currency === 'USD' ? ' selected' : '') + '>USD</option>' +
          '<option value="COP"' + (engagement.invoice_currency === 'COP' ? ' selected' : '') + '>COP</option>' +
        '</select>' +
      '</div>' +
    '</div>' +
    '<div class="form-row full">' +
      '<div class="form-field-group">' +
        '<label class="modal-label">Pagador</label>' +
        '<select class="modal-select" id="edit-eng-client">' +
          '<option value="">Cargando...</option>' +
        '</select>' +
      '</div>' +
    '</div>'
  ) : (
    '<div style="padding:12px; color:var(--text-dim); font-size:12px;">Sin engagement MGMT. Creá uno desde el formulario de contrato.</div>'
  )) +
'</div>' +
```

### 3c. Cargar lista de clientes en el select de pagador

Despues de que el modal se muestra y SI hay engagement:

```javascript
if (engagement) {
  try {
    const clientRes = await fetch('/api/clients');
    const clientData = await clientRes.json();
    const clientSel = document.getElementById('edit-eng-client');
    clientSel.innerHTML = '';
    (clientData.clients || []).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.display_name + (c.type ? ' (' + c.type + ')' : '');
      if (c.id === engagement.client_id) opt.selected = true;
      clientSel.appendChild(opt);
    });
  } catch (err) { console.error('Error loading clients for edit:', err); }
}
```

### 3d. Guardar cambios del engagement

En el handler del boton "Guardar Cambios", DESPUES del PATCH de artista y ANTES de cerrar el modal:

```javascript
// Si hay engagement, guardar cambios del engagement
if (engagement && document.getElementById('edit-eng-status')) {
  const engPayload = {
    status: document.getElementById('edit-eng-status').value,
    invoice_amount: parseFloat(document.getElementById('edit-eng-amount').value) || 0,
    invoice_currency: document.getElementById('edit-eng-currency').value,
    client_id: document.getElementById('edit-eng-client').value || engagement.client_id
  };

  const engRes = await fetch('/api/engagement/' + encodeURIComponent(engagement.id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(engPayload)
  });
  const engResult = await engRes.json();
  if (engResult.error) throw new Error('Error engagement: ' + engResult.error);
}
```

---

## PASO 4: BACKEND — Revenue solo suma engagements `active` (`db.js`)

En `getMgmtMetricsOverview()` (linea ~1319), la query de revenue YA filtra por `.eq('status', 'active')`:

```javascript
supabase.from('mgmt_engagements').select('invoice_amount, invoice_currency').eq('status', 'active').eq('month', currentMonth),
```

Esto significa que `paused` e `inactive` ya NO suman al revenue. **No hay cambio necesario en este paso.** Solo verificar que la query sigue asi.

---

## PASO 5: FRONTEND — Indicador de estado MGMT en lista de artistas (`index.html`)

En la funcion `renderArtists()` (linea ~3654), modificar las cards para mostrar el estado del engagement.

### 5a. Agregar estado al endpoint de artistas

En el backend, el endpoint `GET /api/artists` debe incluir info del engagement. Verificar si ya lo hace. Si no, agregar al query un join o un campo extra.

Alternativa mas simple: usar la info que ya viene en `service_lines` para colorear el badge.

### 5b. Agregar indicador visual al card

En el `renderArtists()`, despues del badge de service_type, agregar un indicador:

```javascript
// Dentro del .map de artists:
const mgmtLine = (a.service_lines || []).find(sl => sl.service_type === 'Management');
const engStatus = a.engagement_status || (mgmtLine ? 'active' : '—');

// Agregar al HTML del card:
const statusDot = {
  'active': '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--neon-green);margin-right:6px;" title="MGMT Activo"></span>',
  'paused': '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--neon-orange);margin-right:6px;" title="MGMT Pausado"></span>',
  'inactive': '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--text-dim);margin-right:6px;" title="MGMT Inactivo"></span>'
};
```

**NOTA:** Para que esto funcione, el endpoint `/api/artists` debe devolver el `engagement_status` de cada artista. Hay dos opciones:

**Opcion A (simple):** En `getArtistsList()` o equivalente, hacer un join adicional para obtener el status del engagement del mes actual. Ejemplo:

```javascript
// Por cada artista, buscar su engagement del mes actual
const currentMonth = new Date().toISOString().substring(0, 7);
for (const artist of artists) {
  const mgmtSl = (artist.service_lines || []).find(sl => sl.service_types?.name === 'Management');
  if (mgmtSl) {
    const { data: eng } = await supabase
      .from('mgmt_engagements')
      .select('status, invoice_amount, invoice_currency')
      .eq('service_line_id', mgmtSl.id)
      .eq('month', currentMonth)
      .limit(1)
      .single();
    artist.engagement_status = eng?.status || 'inactive';
    artist.engagement_amount = eng?.invoice_amount || 0;
    artist.engagement_currency = eng?.invoice_currency || 'USD';
  }
}
```

**Opcion B (performante):** Una sola query con join. Evaluar segun volumen.

Con la opcion elegida, el card del artista mostraria:

```
🟢 Reckless          Management    $1,200 USD/mes
🟠 Javier Ferreira   Management    $3M COP/mes (pausado)
⚫ Jot4 R            Management    $0 (inactivo)
```

---

## PASO 6: VISTA INTERNA — Mostrar estado MGMT en el header

En `renderMgmtClientDetail()` (linea ~3771), el header muestra el monto del engagement. Agregar indicador de estado:

```javascript
// En el headerHtml, al lado del monto:
const engStatusLabel = {
  'active': '<span style="color:var(--neon-green); font-size:10px; font-weight:600;">● ACTIVO</span>',
  'paused': '<span style="color:var(--neon-orange); font-size:10px; font-weight:600;">● PAUSADO</span>',
  'inactive': '<span style="color:var(--text-dim); font-size:10px; font-weight:600;">● INACTIVO</span>'
};
// Usar: engStatusLabel[engagement?.status || 'inactive']
```

Mostrar debajo del monto/moneda en el header de la vista interna.

---

## PASO 7: VERIFICACION

1. Reiniciar server
2. Abrir vista interna de **Reckless** → click engranaje → debe aparecer seccion "2. MGMT ENGAGEMENT" con:
   - Estado: Active
   - Retainer: 1200
   - Moneda: USD
   - Pagador: Reckless (o el client vinculado)
3. Cambiar retainer a 1500 → Guardar → verificar que actualiza
4. Abrir **Javier Ferreira** → cambiar estado a **Paused** → Guardar
5. Ir a Metricas → Revenue Mes debe NO incluir el monto de Javier
6. Vista de Artistas → Reckless con dot verde, Javier con dot naranja, Jot4 R con dot gris
7. Abrir **Ery** → cambiar estado a **Inactive** → verificar dot gris

---

## CHECKLIST

- [ ] `server.js`: Endpoint `GET /api/artist/:slug/engagement`
- [ ] `server.js`: Endpoint `PATCH /api/engagement/:id`
- [ ] `index.html`: Expandir `openEditArtistModal` con seccion MGMT (estado + retainer + moneda + pagador)
- [ ] `index.html`: Cargar clientes en select de pagador
- [ ] `index.html`: Guardar cambios de engagement junto con datos del artista
- [ ] `db.js`: Verificar que revenue solo suma `status = 'active'` (ya esta, solo confirmar)
- [ ] `index.html`: Indicador visual (dot color) en lista de artistas
- [ ] `index.html`: Label de estado en header de vista interna
- [ ] Verificar que `paused` NO suma al revenue
- [ ] Verificar que `inactive` NO suma al revenue
- [ ] Verificar que cambiar estado se refleja en Metricas
