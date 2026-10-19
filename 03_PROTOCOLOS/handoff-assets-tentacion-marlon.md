# Handoff: Sistema de Assets para Lanzamiento TENTACIÓN — Marlon Villamil

> **Estado:** Borrador de handoff pendiente de input del CTO Senior  
> **Fecha:** 2026-08-02  
> **Solicitante:** Operador actual (Kimi Code CLI)  
> **Destinatario:** CTO Senior / CTO Jr de G*S  
> **Contexto:** Se requiere conectar la página web de lanzamiento `TENTACIÓN` con Supabase y la Boveda para persistir los assets (imágenes/videos) que se suban a cada publicación del calendario.

---

## 1. Resumen ejecutivo

La página `tentacion-launch/index.html` es un frontend React standalone que hoy carga archivos solo en memoria del navegador (`URL.createObjectURL`). Se quiere evolucionarla para que cada archivo subido se persista en:

1. **Supabase Storage** — como source of truth de archivos (url firmada, acceso controlado).
2. **Boveda local** — como copia canonica en filesystem bajo `06_CLIENTES/marlon-villamil/assets/lanzamientos/tentacion/`.

Para hacer esto sin romper código existente, necesito entender la arquitectura completa, la relación entre `clients`, `artists`, `projects`, `mgmt_engagements`/`mgmt_objectives`/`mgmt_deliverables`, y las convenciones de storage que ya están operando en producción.

---

## 2. Alcance objetivo

### 2.1 Funcionalidad esperada

- Cada post del calendario de TENTACIÓN debe permitir subir 1 o N archivos (imagen/video).
- El archivo debe guardarse en Supabase Storage con un path estructurado.
- El registro del asset debe guardarse en una tabla de Supabase vinculada al post/campaña.
- Una copia del archivo debe escribirse en la Boveda local bajo la estructura de Marlon.
- La UI debe mostrar el estado real: pendiente / subiendo / cargado / error.
- Al recargar la página, el estado y previews deben recuperarse desde Supabase.

### 2.2 Alcance temporal

- **Lanzamiento:** TENTACIÓN (drop 1 ago 2026, según cronograma `cronograma-contenidos-amor-adolescente.md`).
- **Artista/Cliente:** Marlon Villamil (`marlon-villamil`), UUID Supabase `f078d25a-b1aa-4ab8-a77c-f39e621e1574`.
- **Campaña:** EP "AMOR ADOLESCENTE" — single TENTACIÓN.

---

## 3. Estado actual de la infraestructura G*S (revisado)

### 3.1 Bases de datos (Supabase)

Según `05_BASES_DE_DATOS/12-schema-vivo-2026-07-16.sql`, existen las tablas operativas:

| Tabla | Uso actual | Relevancia para assets |
|-------|-----------|------------------------|
| `clients` | Clientes de G*S | Marlon ya existe (`marlon-villamil`) |
| `artists` | Artistas vinculados a clientes | ¿Existe un artista separado para Marlon? |
| `projects` | Proyectos por cliente (lanzamientos, videoclips, etc.) | **Probable lugar para el proyecto TENTACIÓN** |
| `mgmt_engagements` | Engagements mensuales MGMT | Marlon es cliente MGMT |
| `mgmt_objectives` | Objetivos dentro de un engagement | Posible agrupador de campaña |
| `mgmt_deliverables` | Entregables con `file_path` + `attachment_type` | Ya tiene upload a Storage (`mgmt-deliverables` bucket) |
| `press_batches` / `press_notes` | Notas de prensa | Menos relevante |
| `artist_links` | Links/archivos de artista | Podría reutilizarse para assets |

**No existe** una tabla `campaign_assets`, `campaign_posts`, `launch_assets` o similar en el schema vivo.

### 3.2 Backend local

- `agent-dashboard/server.js` levanta un servidor Node en `localhost:3737`.
- `agent-dashboard/db.js` contiene el cliente Supabase y funciones de upload/download.
- Ya existe un endpoint de upload: `POST /api/mgmt/deliverable/:id/upload`.
- La función `uploadDeliverableFile()` sube a bucket `mgmt-deliverables` y retorna signed URL.

### 3.3 Frontend de lanzamiento

- `tentacion-launch/index.html` es un SPA React standalone servido en `localhost:1212`.
- No tiene backend propio aún; usa un `server.js` mínimo inline para servir estáticos.
- El estado de posts está hardcodeado en `initialDb`.
- Los archivos se manejan con `URL.createObjectURL` (no persisten).

### 3.4 Boveda local

Estructura de Marlon (`06_CLIENTES/marlon-villamil/`):

```
marlon-villamil/
├── contexto.md
├── notes.md
├── README.md
├── assets/                 <- Audio, visual, docs (creado por onboarding)
├── mgmt/                   <- Meetings, monthly, deliverables
├── brand-book/
├── 01-auditorias/
├── 02-sintesis/
├── 04-calendario/
└── auditoria-deploy/
```

No existe aún una carpeta `lanzamientos/` ni `tentacion/` bajo `assets/`.

---

## 4. Preguntas para el CTO Senior / respuestas que necesito

### 4.1 Modelo de datos

1. **¿El lanzamiento TENTACIÓN ya existe como `project` en Supabase?**  
   Si no existe, ¿lo creamos con `project_type = 'lanzamiento'` y `phase = 'pre-release'`?

2. **¿Cómo se modela la relación campaña ↔ posts ↔ assets?** Opciones:
   - **A)** Reutilizar `mgmt_objectives` + `mgmt_deliverables`: cada post es un deliverable.
   - **B)** Crear nuevas tablas `campaigns` + `campaign_posts` + `campaign_assets`.
   - **C)** Vincular a `projects` mediante `metadata` JSONB y guardar assets en `artist_links`.
   - **D)** Otra convención que ya esté decidida.

3. **¿El artista Marlon debe existir en tabla `artists` además de `clients`?**  
   Actualmente `clients` tiene a Marlon; `artists` parece una tabla más reciente. ¿Cuál es la fuente de verdad?

4. **¿Cómo se identifica el contrato de Marlon?**  
   El usuario dice "contrato ya registrado". ¿En qué tabla/campo está? ¿`service_lines`? ¿`mgmt_engagements`? ¿`projects`? Necesito el UUID o slug para vincular assets.

### 4.2 Storage y archivos

5. **¿Usamos el bucket existente `mgmt-deliverables` o creamos uno nuevo?**  
   Opciones: `gs-assets`, `campaign-assets`, `launch-assets`, `marlon-assets`.

6. **¿Cuál es la convención de path en Storage?**  
   Hoy es: `<clientSlug>/<month>/objective-<objNumber>/<deliverableId>-<safeFileName>`.  
   Propuesta para assets de lanzamiento: `<clientSlug>/lanzamientos/<launchSlug>/<phase>/<postId>/<safeFileName>`.

7. **¿Se requiere transformación de archivos?**  
   Ej: compresión de imágenes, thumbnails, conversión de video, metadatos EXIF.

8. **¿Cuál es el límite de tamaño por archivo y por bucket?**  
   Free tier de Supabase: 1GB storage total.

### 4.3 Boveda local

9. **¿La copia local debe ser obligatoria o fallback?**  
   Es decir: ¿Supabase es la fuente de verdad y Boveda es backup, o ambas son iguales?

10. **¿Convención de carpetas local?**  
    Propuesta:
    ```
    06_CLIENTES/marlon-villamil/
    └── assets/
        └── lanzamientos/
            └── tentacion/
                ├── prerelease/
                ├── releaseday/
                └── postrelease/
    ```

11. **¿Se debe escribir un archivo índice `.md` o `.json` por campaña?**  
    Para que otros agentes lean el estado sin consultar Supabase.

### 4.4 Seguridad y permisos

12. **¿El frontend sube directo a Supabase con `anon` key o pasa por el backend Node?**  
    Hoy el frontend de `agent-dashboard` consume `/api/*` del backend. Recomendación: pasar por backend para no exponer service_role key y mantener RLS simple.

13. **¿Quién puede subir/borrar?**  
    ¿Solo operadores autenticados? ¿Sin auth (por ahora)?

### 4.5 Interconexiones con otras apps

14. **¿Este calendario debe sincronizarse con `agent-dashboard` (localhost:3737)?**  
    ¿O es una app separada que eventualmente se integra?

15. **¿Los agentes G*S deben poder leer/escribir estos assets?**  
    Si sí, el path de Boveda y el schema de Supabase deben seguir convenciones que los agentes ya entiendan.

16. **¿Existe una integración con n8n, Notion, Canva o calendario que deba respetarse?**  
    Para no romper flujos existentes.

---

## 5. Riesgos de implementación

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Crear un schema nuevo sin alinearlo a `mgmt_deliverables` existente | Deuda técnica, duplicidad de datos | Reutilizar abstracción existente o diseñar con migración clara |
| Exponer `service_role` key en frontend | Seguridad crítica | Siempre subir vía backend Node |
| Sincronización Boveda ↔ Supabase inconsistente | Estado fragmentado | Backend escribe ambos en una sola operación |
| Path de storage desordenado | Imposible encontrar assets después | Definir y documentar convención antes de escribir |
| Romper `agent-dashboard` al modificar `db.js` | App principal caída | Hacer cambios backward-compatible, probar endpoints |
| Límite de 1GB storage en Supabase free | Uploads fallan | Implementar quotas o limpieza manual |

---

## 6. Opciones de diseño preliminares

### Opción A: Reutilizar `mgmt_deliverables` (mínimo cambio)

- Crear un `mgmt_engagement` y `mgmt_objective` para "Lanzamiento TENTACIÓN".
- Cada post del calendario = un `mgmt_deliverable`.
- Reutilizar `uploadDeliverableFile()` y el bucket `mgmt-deliverables`.
- **Pros:** código existente, firmas firmadas, vistas de progreso ya funcionan.
- **Contras:** semanticamente los posts no son "entregables MGMT"; puede confundir reporting.

### Opción B: Nuevo dominio `campaigns` (más limpio semánticamente)

- Crear tablas:
  - `campaigns` (client_id, artist_id, name, slug, release_date, status)
  - `campaign_posts` (campaign_id, phase, date, day, title, type, platform, copy, strategy, status)
  - `campaign_assets` (post_id, storage_path, file_name, mime_type, file_size, signed_url, boveda_path, status)
- Crear bucket `campaign-assets` con path: `<clientSlug>/campaigns/<campaignSlug>/<phase>/<postId>/<file>`.
- **Pros:** semántica correcta, escalable a futuros lanzamientos.
- **Contras:** requiere migración de schema y nuevo código backend/frontend.

### Opción C: Híbrida (recomendada tentativa)

- Crear `campaigns` + `campaign_posts` + `campaign_assets`.
- Permitir vincular un `campaign` a un `project` existente y/o a `mgmt_objectives` para reporting unificado.
- Backend extiende `db.js` con funciones `uploadCampaignAsset()`, `listCampaignAssets()`.
- Frontend mantiene su propia UI pero consume API del backend.

---

## 7. Entregables que necesito del CTO Jr / Senior

Para poder implementar sin romper nada, necesito:

1. **Confirmación del modelo de datos elegido** (A, B, C u otra).
2. **UUIDs/claves necesarias:**
   - `client.id` de Marlon (confirmar si es `f078d25a-b1aa-4ab8-a77c-f39e621e1574`).
   - `artist.id` si aplica.
   - `project.id` de TENTACIÓN si existe.
   - `mgmt_engagement.id` / `mgmt_objective.id` si se usa Opción A.
3. **Credenciales:** no necesito ver los secrets, pero sí confirmar que el backend de `agent-dashboard` tiene acceso a `SUPABASE_SERVICE_ROLE_KEY` y que el bucket de storage existe/está permitido.
4. **Convención de path definitiva** en Storage y en Boveda.
5. **Decisión sobre autenticación:** ¿sin auth por ahora o requiere login?
6. **OK para crear/modificar:**
   - Nuevas tablas en Supabase (o reutilizar existentes).
   - Nuevas funciones en `agent-dashboard/db.js`.
   - Nuevos endpoints en `agent-dashboard/server.js`.
   - Nueva carpeta en Boveda.
   - Posible nuevo bucket en Supabase Storage.

---

## 8. Checklist de desbloqueo

- [ ] CTO confirma modelo de datos.
- [ ] Se identifican IDs de cliente/artista/proyecto/contrato.
- [ ] Se define bucket y convención de path en Supabase Storage.
- [ ] Se define estructura de carpetas en Boveda.
- [ ] Se decide si subida es directa o vía backend.
- [ ] Se autoriza modificar `db.js` y `server.js` de `agent-dashboard`.
- [ ] Se confirma si se requiere migración SQL nueva.
- [ ] Se asigna prioridad: ¿antes del drop del 1 ago o es post-MVP?

---

## 9. Notas del operador

- Revisé `agent-dashboard/db.js`, `server.js`, los schemas SQL vivos y la estructura de `06_CLIENTES/marlon-villamil/`.
- No accedí a `.env` ni a credenciales de Supabase por seguridad.
- La página `tentacion-launch/index.html` funciona en `localhost:1212` pero sin persistencia.
- El cronograma oficial de TENTACIÓN está en `06_CLIENTES/marlon-villamil/04-calendario/cronograma-contenidos-amor-adolescente.md`.
- Recomiendo no tocar `agent-dashboard` hasta tener claridad sobre el modelo de datos; cualquier cambio en `db.js` afecta a todos los endpoints MGMT.

---

*Handoff generado por Kimi Code CLI · G*S BOVEDA — GROWTHStars*
