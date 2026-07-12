# PROMPT para CTO Jr — Dashboard: Cierre de Mes, Historial y Gestión de Artistas

> Generado por G*S-CTO tras auditoría del dashboard (2026-07-07). Pasar este prompt al CTO Jr - Dashboard (Kimi).
> 🚨 **UBICACIÓN REAL DEL CÓDIGO: `C:\Users\Ian Villaveces\agent-dashboard\`** (fuera de BOVEDA). NO trabajar sobre `BOVEDA/agent-dashboard/` — es una copia DESACTUALIZADA (2030 líneas vs 2954 reales; difieren ~900). El código que corre es el de afuera.
> 🚨 **Las referencias de línea de este prompt (db.js:XXX) salieron de la copia vieja de BOVEDA — NO coinciden con el real.** Buscá SIEMPRE por NOMBRE de función/tabla, nunca por número de línea.
> Archivos: `db.js` (funciones de datos, Supabase JS), `server.js` (http.createServer manual, router por regex), `index.html` (dashboard interno), `artist-portal.html` (portal público, Supabase directo anon key).

---

## ⚠️ ACTUALIZACIÓN 2026-07-12 — G*S-CTO YA EJECUTÓ PARTE (leer ANTES que nada)

Entre la auditoría (07-07) y hoy, G*S-CTO ejecutó limpieza manual de datos y cambios de código. **El "estado actual" de abajo está parcialmente desactualizado.** Esto es lo real HOY:

**Hallazgos que cambian el plan:**
- **El check constraint `mgmt_engagements_status_check` NO acepta `'closed'`.** Valores válidos confirmados: `'active'`, `'paused'`, `'completed'`. → En P1, `closeMonth` debe usar **`status='completed'`** para el mes cerrado (NO `'closed'`), O agregar `'closed'` al constraint con un `ALTER TABLE ... DROP CONSTRAINT / ADD CONSTRAINT`. Decisión CTO: usar `'completed'` (ya en uso, sin tocar el constraint).
- **Existe un TERCER estado de artista: `inactive`.** Ahora son 3 canónicos: `active` (ficha normal), `inactive` (visible pero atenuado — ficha "desactivada"), `archived` (fuera del frontend). `getAllArtists` **YA cambió** a `.in('status',['active','inactive'])` con `.order('status').order('stage_name')`. El frontend **YA** pinta los `inactive` atenuados (clase `.sidebar-artist-item.is-inactive`, opacity .38, + tag "inactivo"). NO reintroducir el filtro `.eq('status','active')` en `getAllArtists`.

**Datos ya limpiados en Supabase (NO repetir):**
- Rollover a medias detectado: ya existían engagements de julio (vacíos) para reckless/ery/jot4r sin cerrar junio → 2 `active` por artista. **Ya corregido.**
- `reckless`: junio → `'completed'` (⚠️ SIN snapshot en `mgmt_monthly_reports` todavía — pendiente en P1), julio `'active'` (único mes activo).
- `ery-la-buena-vida`, `jot4r`: artista → `'inactive'`; sus engagements junio+julio → `'paused'`.
- `javier-ferreira`: artista → `'archived'` (P4 ya aplicado a nivel dato).
- `marlon-villamil`: aparece `active` en `getAllArtists`, PERO su engagement de mes está `inactive`/ausente y falta su carpeta BOVEDA (P3 sigue pendiente).

**Lo que SIGUE pendiente para Kimi (el código no existe todavía):**
- La LÓGICA de código sigue eligiendo el mes por `.eq('month', ...)`, no por `status='active'` (P1 sigue vigente). La limpieza de datos NO arregló esto: si vuelve a haber 2 `active`, el bug se repite.
- El endpoint para cambiar status de artista (`PATCH /api/artists/:id`) NO existe — el archivado de Javier se hizo por script directo (P4 backend pendiente).
- `closeMonth` de reckless NO escribió snapshot: junio quedó `completed` sin fila en `mgmt_monthly_reports`. Al implementar P1, generar ese snapshot retroactivo.

---

## Contexto y estado actual (auditado — no asumir, esto es real)

- El "mes" de un artista MGMT es una fila en `mgmt_engagements` con columna `month` (texto `'YYYY-MM'`) + `status` + `client_id` + `service_line_id` + `invoice_amount`/`invoice_currency`.
- Objetivos (`mgmt_objectives.engagement_id`) → entregables (`mgmt_deliverables.objective_id`) → reuniones (`mgmt_meetings.objective_id`); misiones en `secondary_tasks` (`artist_id`/`client_id`/`meeting_id`, con campo `archived` bool).
- **NO existe función de "cerrar mes" ni rollover.** Los engagements solo se crean en `onboardArtist()` (db.js:1716) y `createContract()` (db.js:1881). Nunca se crea el del mes siguiente.
- El dashboard interno (`getMgmtClientDetail`, db.js:117) filtra estricto `.eq('month', currentMonth)` con `new Date().toISOString().substring(0,7)` → al cambiar el mes calendario queda VACÍO.
- El portal (`artist-portal.html:441`) hace fallback al engagement más reciente → muestra el mismo mes eternamente.
- `mgmt_monthly_reports` EXISTE en Supabase pero está MUERTA: el código nunca la lee ni escribe.
- `artists` y `clients` tienen columna `status`. `getAllArtists` ~~filtra `.eq('status','active')`~~ **[ACTUALIZADO 07-12: ahora `.in('status',['active','inactive'])` + order status,stage_name]**. Sigue SIN existir endpoint para cambiar ese status (el archivado de Javier fue por script).
- Endpoint `GET /api/mgmt/engagements` (server.js:366) devuelve TODOS los engagements pero el frontend NUNCA lo llama.

## DECISIÓN DE ARQUITECTURA (respetar, no reinterpretar)

1. **El mes activo lo determina `status='active'`, NUNCA el calendario.** Prohibido seguir usando `.eq('month', currentMonth)` para decidir qué mes mostrar. Se muestra el engagement con `status='active'` del artista. Esto elimina el bug de rollover por UTC y da control manual.
2. **NO implementar filtrado por rango de fechas día-4-a-día-3.** El ciclo custom se maneja por cierre MANUAL (Ian cierra cuando corresponde). Las fechas de período son solo ETIQUETA visual.
3. **Despertar `mgmt_monthly_reports`**: es el registro histórico de cada mes cerrado (snapshot de contadores + link al informe).
4. Cambios incrementales y no-destructivos. Nada de borrar engagements viejos — se archivan por status.

---

## TAREAS (en orden de prioridad)

### P1 — Flujo "Cerrar Mes" (manual) + rollover

**Backend:**
- Nueva función `closeMonth(engagementId)` en `db.js` + endpoint `POST /api/mgmt/engagement/:id/close`.
- Al cerrar:
  1. Setear `mgmt_engagements.status = 'completed'` en el engagement actual. **(NO `'closed'` — el check constraint lo rechaza. Ver bloque de actualización 07-12.)**
  2. Escribir un snapshot en `mgmt_monthly_reports`: `engagement_id`, contadores (objetivos totales/completados, entregables totales/completados, `meetings_held`, misiones ejecutadas), `summary` (opcional), y **`report_url`** = link al informe publicado (ej. `https://reckless-cierre-junio.growthstars.net`) + `report_path` = ruta del `.md`/`.html` en BOVEDA. (Si a la tabla le falta `report_url`/`report_path`, agregar esas columnas.)
  3. Crear un NUEVO `mgmt_engagements` con `status='active'`, `month` del período siguiente, mismo `client_id`/`service_line_id`. **Copiar los objetivos NO completados** (`status NOT IN ('delivered','approved')`) al nuevo engagement (nuevos `mgmt_objectives` con `engagement_id` nuevo); los completados (`delivered`/`approved`) quedan en el mes cerrado. ⚠️ Los objetivos NO usan `'done'` (eso es de `secondary_tasks`); completado = `delivered`/`approved`.
- Agregar columnas OPCIONALES a `mgmt_engagements`: `period_start` (date), `period_end` (date) — SOLO para mostrar la etiqueta "4 jun – 3 jul". No usarlas en ningún filtro de "qué mostrar".

**Frontend (index.html):**
- Botón "Cerrar Mes" en la ficha del artista → confirma → llama al endpoint → refresca mostrando el nuevo mes activo (vacío o con pendientes copiados).

**Reemplazar el filtro de mes activo (EL FIX DE FONDO — sin esto el bug vuelve):** en `getActiveMonth`, `getMgmtClientDetail`, `getArtistDashboard`, `getMgmtMetricsOverview`, `getClientFullContext` y en `artist-portal.html`: cambiar la selección del engagement de `.eq('month', currentMonth)` / fallback-al-más-reciente por **`.eq('status','active')`** (el mes activo del artista). El fallback al más reciente se elimina. Ian limpió los datos a mano, pero mientras la LÓGICA elija por `month`, si vuelve a haber dos engagements `active` el bug se repite.
- **Caché:** `getActiveMonth` cachea en memoria ~5 min. `closeMonth` DEBE invalidar ese caché al cerrar (si no, el dashboard sigue mostrando el mes viejo hasta que expire). Buscar la variable de caché y limpiarla dentro de `closeMonth`.

### P2 — Historial de meses (dashboard interno + portal)

- **Dashboard (index.html):** en la ficha del artista, consumir `GET /api/mgmt/engagements` (ya existe) filtrado por cliente → selector/lista de meses (activo + cerrados). Al elegir un mes cerrado, mostrar su snapshot desde `mgmt_monthly_reports` + link al informe.
- **Portal (artist-portal.html):** sección "Historial" que liste los meses cerrados del artista con su `report_url` (link al informe de cada mes). El mes activo se muestra como hoy; los cerrados como tarjetas de historial enlazadas.
- Nuevo endpoint si hace falta: `GET /api/mgmt/engagement/:id/report` → devuelve el snapshot de `mgmt_monthly_reports`.

### P3 — Activar artista nuevo (Marlon Villamil)

- Usar `onboardArtist()` con `services.mgmt` para crear: fila en `artists` (`status='active'`, `stage_name='Marlon Villamil'`, slug `marlon-villamil`), `service_lines` MGMT, y `mgmt_engagements` del mes con `status='active'`.
- **Unificar con filesystem:** `onboardArtist` hoy NO crea la carpeta en BOVEDA. Hacer que también invoque `createClientFilesystem` (db.js:270) para generar `06_CLIENTES/marlon-villamil/` con la estructura estándar (ver SOP-CIERRE-DE-MES para la raíz esperada: `contexto.md`, `brand-book/`, `direccion-artistica/`, `01-auditorias/`, `02-sintesis/`, `lanzamientos/`, `mgmt/meetings/`, `mgmt/monthly/`).
- **Bug a arreglar de paso:** `getArtistDashboard` (db.js:1672) lee contexto desde `06_CLIENTES/{slug}/00-contexto/` pero `createClientFilesystem` crea `contexto.md` en la RAÍZ. Alinear ambos (elegir uno: raíz o `00-contexto/`).

### P4 — Archivar/desactivar artista (Javier Ferreira)

- Nueva función `setArtistStatus(artistId, status)` en `db.js` + endpoint `PATCH /api/artists/:id` (o `/api/artists/:id/archive`).
- Setear `artists.status = 'archived'` para Javier Ferreira. `getAllArtists` ya filtra por `active`, así que desaparece de la lista activa pero queda en base (historial intacto).
- Definir valor canónico: usar `'archived'`. Sus engagements/service_lines quedan con su propio status (no tocar) — el artista archivado no se muestra pero su data histórica se conserva.

### P5 — Vista de Sello (Chimbita Records) + soporte multi-proyecto

**Concepto:** Chimbita Records es `clients.type='sello'` — un CONTENEDOR de artistas (Javier Ferreira, Marlon Villamil) y de proyectos. Necesita su propia vista que dé tracking a VARIOS proyectos simultáneos, distinta de la ficha de un artista individual.

**GAP crítico #1 (multi-proyecto):** el código asume UN proyecto por cliente. La línea real es **`db.js:477`** (no 433): `.from('projects').select('*').eq('client_id', client.id).maybeSingle()` — `.maybeSingle()` **ya está rompiendo**: verificado 07-12, Chimbita tiene **3 proyectos** (`Videoclip Henessy`, `Videoclip Tentacion`, `Tentacion`), así que ese `.maybeSingle()` lanza error hoy mismo. Cambiar a devolver ARRAY. Revisar TODOS los `.maybeSingle()` sobre `projects` (hay varios: db.js:477 y alrededores).

**GAP crítico #2 (vínculo artista↔sello — NO existe relacionalmente):** verificado 07-12: `artists` **NO tiene `client_id` ni FK al sello**. El único nexo hoy es `metadata.label = "CHIMBITA RECORDS"` (string libre, frágil, rompe con typos). Los `projects` del sello (client_id=chimbita) tienen `artist_id`, pero **los 3 apuntan solo a Marlon** — Javier NO tiene proyectos bajo el sello. Consecuencia: si "artistas del sello" se resuelve vía `projects.artist_id`, **Javier desaparece**; si se resuelve vía `metadata.label`, es string-matching frágil.
  - **Decisión CTO:** agregar columna **`artists.label_client_id`** (FK nullable → `clients.id` donde `type='sello'`) y poblarla para Javier y Marlon (→ chimbita). "Artistas del sello" = `artists.where(label_client_id = sello.id)`. `metadata.label` queda solo como display. Sin esta FK, la lista de artistas del sello es inconsistente.

**Backend:**
- Función `getLabelDashboard(slug)` en `db.js` + endpoint `GET /api/label/:slug` (o extender el detail de cliente cuando `type='sello'`). Devuelve:
  - Datos del sello (`clients` con `type='sello'`).
  - **Artistas del sello:** todos los `artists` vinculados a ese client (activos + archivados marcados como tal).
  - **Proyectos del sello:** todos los `projects` del `client_id` con `project_type`, `phase`, `status`, `release_date`, `artist_id` (a qué artista pertenece), `package_price_usd`/`package_price_cop`.
  - **Agregados:** nº de proyectos activos, revenue del sello (suma de proyectos activos/completados), nº de artistas activos.

**Frontend (index.html):**
- Cuando el cliente es `type='sello'`, renderizar la **Vista de Sello** en vez de la ficha de artista individual:
  1. Header del sello (nombre, nº artistas, nº proyectos activos, revenue agregado).
  2. **Lista de artistas** del sello → cada uno linkea a su ficha de artista (con su mes/engagement).
  3. **Tabla de proyectos con tracking:** nombre, tipo (`project_type`), artista, fase (`phase`), estado, fecha (`release_date`), monto. Filtrable por estado.
- Un artista puede verse standalone O dentro de su sello; el sello es el nivel superior.

**Nota de modelo:** Javier Ferreira (archivado en P4) y Marlon Villamil (activado en P3) son artistas de este sello. La vista de sello debe mostrar Marlon activo y Javier como archivado/histórico — sin perder ninguno.

---

## NO HACER (fuera de scope, decisión CTO)

- **NO** implementar filtrado de "mes activo" por rango de fechas (día 4 al 3). El cierre manual + `status='active'` lo cubre. `period_start`/`period_end` son solo etiqueta.
- **NO** borrar engagements ni data histórica. Todo se archiva por status.
- **NO** tocar el flujo de prensa (`press_batches`) ni el agent runner.

## Definición de Hecho (DoD)

- [~] "Cerrar Mes" de Reckless: junio ya en `completed` y julio `active` (hecho a mano 07-12, SIN copiar pendientes). **Falta:** implementar `closeMonth()` genérico + escribir el snapshot retroactivo de junio en `mgmt_monthly_reports` (link al informe). Para FUTUROS cierres, `closeMonth` sí debe copiar los objetivos `!= 'done'`.
- [ ] Dashboard y portal muestran el mes `active` **por `status='active'`** (no por `.eq('month',...)` ni fallback al más reciente); junio queda accesible como historial con link a su informe.
- [~] Marlon Villamil aparece como artista activo. **Falta:** su carpeta en BOVEDA y su engagement del mes con `status='active'`.
- [~] Javier Ferreira archivado a nivel dato (`status='archived'`, no aparece en activos). **Falta:** el endpoint `PATCH /api/artists/:id` + `setArtistStatus()` para poder hacerlo desde la UI.
- [ ] Ery y Jot4r visibles como `inactive` (ficha atenuada) — **YA hecho** a nivel dato + frontend; verificar que P1/P5 no los rompan.
- [ ] Verificar que ningún flujo siga usando `.eq('month', currentMonth)` para decidir qué mostrar.
- [ ] Chimbita Records tiene Vista de Sello con sus artistas (Marlon activo, Javier archivado) y tabla de proyectos con tracking; el dashboard soporta múltiples proyectos por cliente (sin `.maybeSingle()`).

## Contexto de datos para el cierre de Reckless (junio 2026)

- Informe ya generado: `06_CLIENTES/reckless/mgmt/monthly/informe-2026-06/index.html` (a publicar en `reckless-cierre-junio.growthstars.net`).
- Snapshot del mes: 5/5 objetivos, 8/8 entregables, 7 reuniones, 5 misiones, 8 decisiones. Estos números deben quedar en `mgmt_monthly_reports` al cerrar.
