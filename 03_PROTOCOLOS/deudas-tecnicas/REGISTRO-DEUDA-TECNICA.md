# Registro de Deuda Técnica — G*S / SANCORT

> Canon único de deuda técnica. Mismo patrón que REGISTRO-DECISIONES.md (D-082).
> Última actualización: 2026-07-16

---

## Deuda activa

| # | Descripción | Origen | Estado |
|---|-------------|--------|--------|
| DT-001 | Paridad agentes filesystem/Supabase | Fundación | Cerrada (sync automático al arrancar server — db.js:syncAgentsToSupabase) |
| DT-004 | fire-and-forget (D-054) se rompe en serverless | D-054 | Inactiva (solo aplica si se deploya) |
| DT-005 | Migrar sub-agentes de global a project scope | D-005 | Cerrada (17 agentes G*S en BOVEDA/.claude/agents/) |
| DT-020 | **CERRADA (2026-07-15, ~20:17 UTC-5, commit ac00279 en BOVEDA).** Scope reducido a RECKLESS: Ery ya tenía `contexto.md` (DT-053); Jot4 R descartado por `inactive`. Se creó `06_CLIENTES/reckless/contexto.md` destilando auditoría musical, auditoría de redes, síntesis growth, Brand Book, 7 actas de reunión e informe de cierre junio 2026. Validación: `GET /api/artist/reckless/dashboard` devuelve HTTP 200 con `boveda.contexto` de 17,287 caracteres. **Pendiente de verificar:** año de nacimiento exacto de Reckless (día 9 de agosto confirmado; año no recordado). | Día 7 / DT-053 | Cerrada — ver traza en detalle expandido |
| DT-059 | ~~**Toasts que mienten:** el dashboard tenía 71 mutaciones y solo 26 chequeos de `.ok`; handlers que mostraban toast de ÉXITO aunque el server respondiera 404/500 (confirmado en "+ AÑADIR MISIÓN")~~ | Paridad Vista de Sello (2026-07-16) | **CERRADA (2026-07-16, commit `4e94ebd`)** — barrido completo: helper `apiMutate` (index.html:4447, hace `throw new Error` si `!res.ok`) cubre 37 call sites + 16 con `result.error`; las 72 mutaciones verifican la respuesta, **0 mienten**. Verificado por G*S-CTO: `apiMutate` lanza en `!res.ok`, y DELETE con id inexistente → HTTP 500 muestra el error real, no toast verde. Bloqueaba D-102 (el switch de pago); ya resuelto |
| DT-060 | Dashboard de Lanzamiento reusable (D-104): (1) parametrizar la data — hoy `initialDb` hardcodeado con Tentación, debe venir de JSON/`estrategia.md` por-lanzamiento; (2) persistir cargas — hoy `URL.createObjectURL` (blob efímero), migrar a Supabase Storage o dashboard | D-104 | Abierta (prototipo Tentación funcional; falta hacerlo data-driven + persistir assets) |
| DT-023 | Sin UI para listar/re-abrir lotes existentes (press_batches) | D-065 | Abierta |
| DT-024 | Huérfanos en Supabase Storage al reemplazar adjunto | D-059/D-075 | Abierta (volumen bajo) |
| DT-025 | Commit consolidado no atómico (commit 5692507) | Día 8 | Asumida |
| DT-026 | closeBatch y saveAgentOutput duplican ruta BOVEDA → extraer getAgentDir() | D-065 | Abierta |
| DT-027 | getMgmtClients() y getMgmtMetricsOverview() usan metadata->>service='mgmt' → migrar a service_lines | D-079/D-085 | Cerrada (frontend migrado a /api/artists) |
| DT-028 | Gráfica de Revenue histórico (MGMT + Extra) con chart mensual, cards USD/COP, mini-tabla proyectos del mes | D-087 | Abierta |
| DT-029 | Tracking de cobros y pagos por proyecto (fecha_cobro, fecha_pago, estado_pago) + alertas de vencimiento | D-087 | Abierta (requiere responder brief CFO primero) |
| DT-030 | Workflow n8n para TRM semanal automático (API datos.gov.co → trm_daily en Supabase) | D-087 | Abierta (n8n requiere Node ≤22, nvm-windows instalado) |
| DT-031 | Agente G*S-Estratega de Snippets (system prompt + contrato I/O) | DT-028 snippet | Diferida (triggers: publicación consistente + cuello de botella manual + ≥2 artistas) |
| DT-032 | Tablas Supabase para Snippet Testing (formatos global + ideas/snippets/ledger per-artist) | DT-028 snippet | Diferida (mismos triggers que DT-031) |
| DT-033 | Automatización del audit (pipeline Soundcharts → Supabase → Kimi) | DT-028 snippet | Diferida (trigger propio: suscripción Soundcharts activa + cuota audit cerrada) |
| DT-034 | Feedback loop de snippets (ponderación por ganadores pasados del ledger) | DT-028 snippet | Diferida (horizonte lejano — requiere meses de data acumulada) |
| DT-035 | Meetings Hub en dashboard con integración Google Calendar + vista interna de reunión | Operaciones | Abierta |
| DT-036 | Programar el Perfilador (`gs-perfilador-artista`) — agente cualitativo completo | SOP Análisis 360 | Abierta (bloquea DT-037 y Sintetizador) |
| DT-037 | Crear Auditor de Mercado (fase 2) — entorno, competencia, nicho, norma demográfica · Motor: Antigravity | SOP Análisis 360 | Abierta (↑ Alta, desbloqueado por Antigravity) |
| DT-038 | Orquestación con dependencia de fase — guarda que impida ejecutar Auditor Mercado sin perfil válido | SOP Análisis 360 | Abierta |
| DT-039 | **PARCIAL (2026-07-16).** Agente `gs-limpiador-input.md` creado y commiteado (commit `0ebe408`). Prompt v1.0 completo: rol, límites, input, 6 pasos de limpieza, formato de output `TRANSCRIPCIÓN LIMPIA`, regla de calidad, preservación de evidencia textual. Sin secrets. **Nunca se ejecutó sobre una transcripción real:** no existe `transcripcion-limpia.md` en ningún artista, ni referencias en outputs, ni invocaciones registradas. Falta validar con una reunión real de onboarding. | SOP Análisis 360 | Parcial — ver traza en detalle expandido |
| DT-040 | Pipeline automático de reuniones Drive → bitácora + digest + clasificador. **Corregido 2026-07-16 tras spike:** (a) NO usa n8n — el server lee Drive directo; (b) NO se lee del FS local — las Notas de Gemini son `.gdoc` (punteros a la nube, `EISDIR` en Node), hay que leerlas vía **Google Drive/Docs API (OAuth)** por fileId; (c) las notas ya vienen semi-estructuradas de Gemini (Resumen + Próximos pasos con responsable en `[corchetes]` + Detalles) → el digest es liviano. Carpeta: `Meet Recordings` (id `1D0yjAOPBOsLOhA7PhzX23Pd1IUSbfa3j`, owner growthstarscolombia@gmail.com) | Operaciones / Meetings | **Alta** (elevada 2026-07-15 por D-101) · **Clasificador VALIDADO** (2026-07-16, spike vía conector Drive): 5 notas → 3 entidades (Chimbita MERCH ×2, Marlon ×2, Reckless ×1), discrimina sin ambigüedad. **Falta:** definir vía de ingesta de producción (Drive API en dashboard) + validar detección "sin_artista" |
| DT-041 | **PARCIAL (2026-07-15).** Fase 0 de higiene estabilizadora: smoke tests Jest 5/5 pasan (`tests/smoke.test.js`), `npm test` configurado, rutas BOVEDA centralizadas en `config.js` con migración de consumidores (`deliverables.js`, scripts de test). **Falta:** tests E2E por endpoint crítico, schema validation contra Supabase, guardrails de regresión. | Operaciones | Parcial — ver traza en detalle expandido |
| DT-042 | **PARCIAL (2026-07-16).** Compilador en `03_PROTOCOLOS/herramientas/compilador-informe-mensual.js` ya lee números reales desde `resumen-YYYY-MM.md` (input de Control) y tabla `## Métricas clave` en auditorías. Validado sobre Reckless junio 2026: sección 5 reporta 5/5 objetivos, 8/8 entregables, 7 reuniones, 5 misiones, 6 documentos, 8 decisiones — todos derivados de fuente estructurada o actas. Sigue siendo andamio mecánico: no genera narrativa; secciones 0/2/4/6 requieren Growth Hacker (D-099). | Operaciones / MGMT | Parcial — ver traza en detalle expandido |
| DT-043 | Modelo de 3 cerebros: Antigravity (externo) + Claude (interno) + Kimi (runtime) — convención de roles y formato I/O | Stack / Arquitectura | Abierta |
| DT-044 | Activación jerarquía D-099: Growth Hacker → Órgano de Control + primer Jefe de Área (registro mensual MGMT/Growth por artista) + primer Loop de cierre de mes | D-099 / DT-042 | Abierta (primer módulo orquestador — enciende Loops + GitHub Pages) |
| DT-045 | Infraestructura de datos para cierres de mes en el DASHBOARD: baseline/métricas time-series (`artist_metrics`), lanzamientos + 4 frentes (`launches`/`launch_fronts`), dirección artística mensual (`artistic_direction`), decisiones estructuradas (`mgmt_decisions`), índice de documentos por artista | Auditoría SOP-Cierre | Diferida (los cierres se generan ARCHIVO-FIRST; estas tablas son para VISUALIZAR en el dashboard, no para producir el informe) |
| DT-046 | **CERRADA (2026-07-15, ~20:17 UTC-5, commit ac00279 en BOVEDA).** Schema vivo exportado a `05_BASES_DE_DATOS/12-schema-vivo-2026-07-16.sql` (61 KB, ~2,124 líneas) con `pg_dump --schema-only` vía `scripts/clean-schema-dump.js`. Incluye las 4 tablas HOLDING (`artists`, `artist_links`, `service_lines`, `service_types`) y columnas recientes (`artists.label_client_id`, etc.). Sin secrets en el `.sql`. Reproducible: correr `node scripts/clean-schema-dump.js` en `agent-dashboard`. | Auditoría schema | Cerrada — ver traza en detalle expandido |
| DT-047 | Data confidencial de clientes (revenue, RPS, métricas, decisiones internas, citas de reuniones) publicada en repos GitHub Pages PÚBLICOS con `noindex` (reckless-sintesis-growth, reckless-cierre-junio, etc.). URL no indexable pero accesible por cualquiera con el link; queda en historial git permanente | Deploy deliverables | Riesgo ASUMIDO conscientemente. Criterio de revisión: al superar 4 clientes simultáneos entra un CTO profesional que reorganiza y da ciberseguridad a todo el stack |
| DT-048 | Doble mecanismo de cierre de mes: el nuevo `closeMonth` manual por-artista (P1, correcto) coexiste con `legacyCloseMonthBatch` (ex-`closeMonth` global del botón "CERRAR MES" del Roster) que hace rollover batch POR CALENDARIO | Validación P1 (CTO Jr) | **En progreso (2026-07-13):** trigger UI deprecado — botón "CERRAR MES" del Roster + handler `openCloseMonthModal()` removidos de index.html, `legacyCloseMonthBatch` marcada `@deprecated` (lógica intacta). Cierre por-artista (`closeArtistMonth` → `POST /api/mgmt/engagement/:id/close`) es el ÚNICO camino disparable desde UI. **RESTA:** endpoint `POST /api/mgmt/close-month` sigue alcanzable por HTTP directo — decisión Ian: dejarlo por ahora (requiere POST manual, nadie lo dispara sin querer), tapar con 410 cuando se limpie el legacy del todo. No urgente |
| DT-049 | ~~`getAllArtists` resuelve `engagement_status` con lógica month-based (mismo bug class que P1 arregló)~~ | Validación P1 | **CERRADA (2026-07-15, Tanda F)** — migrado a status-based: trae el engagement MÁS RECIENTE del service_line (order by month desc) y usa su `status` real, sin exigir match exacto con `activeMonth`. Verificado vía HTTP `/api/artists`: Reckless sigue `active`, Ery/Jot4r siguen `paused` (sin regresión). Ver DT-058 (hallazgo nuevo, sin cerrar) |
| DT-050 | ~~Endpoint `POST /api/mgmt/engagement/:id/close` responde 500 con id inexistente (debería ser 404)~~ | Validación P1 | **CERRADA (2026-07-15, Tanda F)** — mismo patrón que `/api/artist/:slug/dashboard` (`err.code === 'PGRST116' ? 404 : 500`). Verificado con curl: id inexistente → 404 `{"error":"Engagement no encontrado"}` |
| DT-051 | ~~BUG ACTIVO — `.maybeSingle()` en query de `projects` revienta con >1 proyecto (Chimbita, 3 proyectos)~~ | P5 / Vista de Sello | **CERRADA (2026-07-13)** — fix validado por Ian: devuelve ARRAY; full-context de Chimbita da 200 con 3 proyectos |
| DT-052 | ~~Client huérfano `marlon-villamil` (id 68abb0bf, `type=null`) con engagement legacy 2026-06 `paused` $750 USD — homónimo del artist del sello. NO era inofensivo: 2 `cuentas_cobro` (CC-TENTACION-001, CC-HENESSY-001, 6M COP) colgaban de él por match de substring, escondiendo el revenue real de Marlon~~ | Rollout Chimbita+Marlon | **CERRADA (2026-07-15, ~19:54 UTC-5, commit a22d769).** El fix estructural (orden 1→2→3→4) se ejecutó en Tanda F, pero la validación final — Marlon visible en el Roster como `active` / 4.000.000 COP y la ficha de Marlon mostrando junio con 6.000.000 COP — recién se cumplió con el **modelo artista-de-sello** (commit a22d769). Trayectoria real: (1) CC reapuntadas a `chimbita-records`, revenue global de junio verificado idéntico antes/después (1.200 USD + 6M COP); (2) `syncCuentasCobro` migrado de substring-match a mapeo EXPLÍCITO `CC_ARTISTA_TO_CLIENT_SLUG` (match exacto, sin adivinar); (3) sync corrido 2x, ambas CC estables en chimbita; (4) fantasma archivado (`status=archived`, `slug=marlon-villamil-legacy`, NUNCA DELETE), engagement legacy $750 intacto, Marlon real (`artists.f078d25a`) intacto; (5) modelo artista-de-sello aplicado: `getAllArtists` resuelve por `label_client_id`, el historial entra por **revenue ∪ ejecución** (Regla 3), y la ficha de Marlon muestra junio con 6M COP. Validado por Ian: Roster `active` / $4M, HISTORIAL con 6M COP. |
| DT-053 | ~~`getArtistDashboard` cambió para TODOS los artistas: antes leía de `00-contexto/` (carpeta inexistente), ahora lee `contexto.md` plano. Cambio GLOBAL — Reckless validado OK, resto del roster sin verificar uno por uno~~ | Rollout Chimbita+Marlon | **CERRADA (2026-07-15, Tanda F)** — los 5 artistas (Reckless, Marlon, Ery, Jot4r, Javier archivado) devuelven HTTP 200 sin excepción vía `/api/artist/:slug/dashboard` (el try/catch hace `boveda=null` si faltan archivos, nunca revienta). Contenido real por artista: Marlon y Ery tienen `contexto.md`+`notes.md` y cargan boveda; Reckless y Jot4r NO tienen `contexto.md` en la raíz de su carpeta (boveda=null, coincide con DT-020 ya abierta); Javier Ferreira tiene la carpeta `06_CLIENTES/javier-ferreira/` completamente vacía (esperado, archivado) |
| DT-054 | ~~`contracts_active` contaba solo engagements `active` HOY → meses cerrados mostraban "0 contratos"~~ | Validación Tanda A | **CERRADA (2026-07-14, Tanda D)** — fix: `isCurrentMonth` (mes en curso cuenta solo `active`; meses cerrados cuentan todos los engagements de ese `month`). Snapshot de junio REGENERADO con verificación diferencial (revenue idéntico) + traza en `metadata` (`reason: fix DT-054`). Junio ahora muestra 1 contrato |
| DT-055 | `projects_by_phase` de junio vacío: no hay FK proyecto→mes; los videoclips se pagaron en junio pero no están atados al "mes" de junio. El CTO Jr infirió "proyectos del mes" vía `client_id` | Validación Tanda A | Abierta (definir qué significa "proyecto del mes" — por fecha de pago, de inicio, o de fase) |
| DT-056 | ~~Doble fuente de verdad de cobros: tabla `cuentas_cobro` vs `.md` `consecutivos-cuentas-cobro.md` como espejos independientes~~ | Validación Tanda A / DT-029 | **CERRADA (2026-07-14, Tanda E)** — **DECISIÓN: el `.md` es la FUENTE DE VERDAD** (es donde se registra, está versionado en git, el CTO puede escribirlo); `cuentas_cobro` es **derivado sincronizado**, nunca al revés. Implementado: `syncCuentasCobro()` parsea el `.md` → `select-then-update` por fila (NO upsert ciego — evita pisar `client_id` con null y da diff campo a campo) → `POST /api/cobros/sync` → botón "SINCRONIZAR COBROS" en Métricas con reporte visual. Nunca borra (huérfanas se reportan). Validado: sync idempotente (7 sin cambios), parser resiste bold/comas/fecha DD-MM, cálculo EN VIVO de junio coincide (1.200 USD + 6M COP). **Flujo nuevo: registrar SOLO en el `.md` → apretar Sincronizar → aparece en el dashboard** |
| DT-057 | ~~`formatHistRevenue` no probado con mes de moneda mixta (COP+USD)~~ | Validación Tanda B | **CERRADA (2026-07-14, Tanda D)** — junio muestra 1.200 USD + 6M COP separadas, nunca sumadas. ⚠️ **HALLAZGO CLAVE que evitó duplicar revenue:** `revenue_month_usd` y `revenue_month_cop` son **la MISMA plata normalizada a dos denominaciones**, NO montos por moneda — mostrarlos "separados" habría duplicado el revenue en pantalla. Los montos crudos por moneda viven en **`by_line`**. Usar `by_line` para desglose por moneda, NUNCA sumar usd+cop |

## Deuda activa — detalle expandido

### DT-015 · Vista Detalle Cliente con Soundcharts API
**Prioridad:** Alta · **Fecha:** 2026-06-03
**Problema:** Vista Clientes muestra cards básicos. Falta vista detalle enriquecida con métricas reales del artista vía Soundcharts API (monthly listeners, followers, top tracks, geographic distribution, demographics).
**Pre-requisitos:** Cuenta Soundcharts API + decisión de caché (clients.metadata JSONB vs tabla soundcharts_snapshots con TTL) + frecuencia de refresh.
**Conexión:** Comparte fuente Soundcharts con DT-017. Mejor implementar juntos.

### DT-016 · Organización de agentes en columnas correctas
**Prioridad:** Media · **Fecha:** 2026-06-03
**Problema:** Algunos agentes mal categorizados en el dashboard: gs-canva, gs-memes-fans, gs-prod-vfx aparecen como "documentación" pero son preproducción/postproducción. Revisar frontmatter `subgroup` y mapping en renderGrowthWorkspace()/renderContenidoWorkspace().
**Solución:** Ajustar frontmatter + UI mapping. Evaluar expandir subgroup con 'preproduccion', 'postproduccion'.

### DT-017 · Agente Baseline Snapshot (estado inicial del artista)
**Prioridad:** Alta · **Fecha:** 2026-06-03
**Problema:** No existe captura formal del estado inicial del artista al ingresar a G*S. Sin baseline no hay ROI comprobable ni prueba social vendible.
**Solución propuesta:** Nuevo agente `gs-baseline-snapshot` (pipeline order -1, antes de gs-perfilador-artista). Captura: audience (Spotify/Apple/YouTube/IG/TikTok), engagement (avg likes/views/comments), catalog (#tracks, #releases, top track), geographic (top 5 países/ciudades), revenue (streams, royalties estimados).
**Output:** `00-baseline/snapshot-inicial.md` + JSON en runs.output_data. Se ejecuta UNA vez al inicio. gs-roi lo referencia para calcular crecimiento.
**Capa Antigravity:** Agrega dimensiones externas al baseline que las APIs de plataforma no dan: search visibility (volumen de búsqueda Google del artista), YouTube discovery (presencia en sugeridos, contextos de aparición), competencia posicional (quién ocupa el espacio que el artista quiere). Transforma el baseline de "foto del artista" a "foto del artista EN su mercado".
**Conexión:** Comparte Soundcharts API con DT-015.

### DT-018 · Script de onboarding de clientes — CERRADA
**Prioridad:** Crítica · **Fecha:** 2026-06-03 · **Cerrada:** 2026-07-01
**Resolución:** Implementado como `onboardClient()` en db.js + botón "+ NUEVO ARTISTA" en el dashboard. Crea filesystem (estructura D-006 v2) + INSERT en Supabase (clients + artist) + README.md auto-generado. Funcional desde el dashboard sin CLI.

### DT-020 · Contexto de Reckless — CERRADA
**Prioridad:** Media · **Fecha:** 2026-07-15 · **Cerrada:** 2026-07-15 (~20:17 UTC-5, commit `ac00279` en BOVEDA)
**Problema:** `getArtistDashboard` leía `contexto.md` plano en la raíz de la carpeta del artista. Reckless, el artista más trabajado del roster, no lo tenía → `boveda=null`; cada agente invocado sobre él corría a ciegas.
**Scope:** Se redujo a Reckless. Ery ya tenía `contexto.md` (verificado en DT-053); Jot4 R fue descartado (`inactive`, ROI cero).
**Qué se hizo:**
- Se creó `06_CLIENTES/reckless/contexto.md` siguiendo la estructura de Javier Ferreira pero con la voz de Reckless.
- Fuentes destiladas (todas reales, nada inventado):
  - `01-auditorias/auditoria-musical.md` → tier, métricas, hallazgos musicales.
  - `01-auditorias/auditoria-redes-sociales.md` → IG/TikTok, funnel, nichos.
  - `02-sintesis/sintesis-growth.md` → NSM, 5 hallazgos integrados, roadmap.
  - `brand-book/01-vision-estrategica.md` → era "La Era de Quitarse la Máscara", paleta, storyworld.
  - `mgmt/monthly/informe-2026-06.md` → estado al cierre de junio.
  - 7 actas en `mgmt/meetings/` → decisiones estratégicas y operativas.
**Cómo se validó:**
- `GET http://localhost:3737/api/artist/reckless/dashboard` → HTTP 200, `boveda` presente, `boveda.contexto` con 17,287 caracteres.
**Qué quedó afuera / pendiente de verificar:**
- Año de nacimiento exacto de Reckless: día 9 de agosto confirmado (viernes), año no recordado. Marcado como ⚠️ en `contexto.md`.
- No se creó `notes.md` (no se pidió).

### DT-046 · Schema vivo versionado — CERRADA
**Prioridad:** Media · **Fecha:** 2026-07-15 · **Cerrada:** 2026-07-15 (~20:17 UTC-5, commit `ac00279` en BOVEDA)
**Problema:** 4 tablas HOLDING (`artists`, `artist_links`, `service_lines`, `service_types`) y varias columnas recientes vivían solo en Supabase, sin migración versionada en `05_BASES_DE_DATOS/`. El schema no era reproducible desde el repo.
**Qué se hizo:**
- Se terminó `agent-dashboard/scripts/clean-schema-dump.js`:
  - Lee `DIRECT_URL` o `DATABASE_URL` desde `.env` (nunca hardcodea credenciales).
  - Busca `pg_dump` en PATH o en ubicaciones comunes (scoop, PostgreSQL installer).
  - Ejecuta `pg_dump --schema-only --no-owner --no-privileges --schema=public` excluyendo schemas de sistema.
  - Limpia líneas `\restrict`/`\unrestrict` y cualquier connection string residual.
  - Escribe `05_BASES_DE_DATOS/{NN}-schema-vivo-YYYY-MM-DD.sql` con número de secuencia autoincremental.
- Se generó `05_BASES_DE_DATOS/12-schema-vivo-2026-07-16.sql` (61 KB, ~2,124 líneas).
**Cómo se validó:**
- El `.sql` incluye `CREATE TABLE public.artists`, `public.artist_links`, `public.service_lines`, `public.service_types`.
- Incluye `label_client_id uuid` en `artists` y las FK asociadas.
- Sin secrets: `grep` no encuentra passwords ni connection strings en el dump.
- Reproducible: volver a correr `node scripts/clean-schema-dump.js` genera un nuevo archivo con el mismo contenido estructural.
**Qué quedó afuera:**
- No se versionan datos, solo schema.
- No se incluyen schemas de sistema (`auth`, `storage`, `pgbouncer`, etc.).
- El ritual de regenerar después de cada migración manual queda documentado en el header del `.sql`.

### DT-028 · Gráfica de Revenue histórico (mensual + extra)
**Prioridad:** Media · **Fecha:** 2026-06-27
**Problema:** No hay visibilidad histórica de ingresos. Solo se ve el mes actual.
**Solución propuesta:** Chart con 2 series (Revenue MGMT normalizado a USD + Revenue Extra normalizado a USD), agregado por mes. Al lado: cards de Revenue Mes y Revenue Extra con USD/COP separado. Debajo: mini-tabla con contratos/proyectos del mes con estado y monto.
**Pre-requisito:** projects.started_at debe usarse para agregar por mes. mgmt_engagements.month ya existe.

### DT-029 · Tracking de cobros y pagos por proyecto
**Prioridad:** Alta · **Fecha:** 2026-06-27
**Problema:** No hay forma de rastrear si un proyecto fue cobrado, pagado o está vencido. Tampoco hay alertas de cobros próximos.
**Solución propuesta:** Campos nuevos en projects o tabla separada `project_payments`: fecha_cobro, fecha_pago, estado_pago (pendiente/cobrado/vencido/parcial), monto_pagado. Alertas en dashboard para cobros próximos.
**Pre-requisito:** Responder las 15 preguntas del brief-cfo-contabilidad.md con contador real. La estructura de cobros depende de decisiones contables (factura electrónica, retenciones, moneda base).

### DT-031 · Agente G*S-Estratega de Snippets
**Prioridad:** Diferida · **Fecha:** 2026-06-28
**Problema:** El cruce ideas × formatos para producir snippets clasificados (orgánico/profesional, TOFU/MOFU/BOFU) se hace manual. Escala mal con múltiples artistas.
**Solución propuesta:** Agente `gs-estratega-snippets` con system prompt + contrato I/O. Consume audit + catálogo de formatos + banco de ideas → entrega batch de snippets taggeados.
**Pipeline de 3 cerebros:** Antigravity mantiene actualizado el catálogo de formatos con vigencia real (emergente/vigente/saturado/muerto) + evidencia (links, creators referentes, trends activos por región). Claude genera ideas desde BÓVEDA con contexto personalizado del artista (brand book, perfil, punto único, catálogo musical). Kimi (dashboard) cruza ideas × formatos × tendencias → batch de snippets pulidos y taggeados listos para ejecución.
**Triggers de graduación (las 3 deben cumplirse):** (1) Publicación consistente real, no teórica. (2) Armado manual = cuello de botella real. (3) ≥2-3 artistas con programas de contenido simultáneos.
**Nota:** Si el dolor es "no se me ocurren ángulos" en vez de "registrar a mano es tedioso", el software no lo resuelve.

### DT-032 · Tablas Supabase para Snippet Testing
**Prioridad:** Diferida · **Fecha:** 2026-06-28
**Problema:** No existe estructura de datos para formatos, ideas, snippets ni ledger de resultados.
**Solución propuesta:** Tablas: `formatos` (global, con campo vigencia: emergente/vigente/saturado/muerto), `ideas` + `snippets` + `ledger` (per-artist). Referencia D-091 para diseño del catálogo.
**Capa Antigravity:** La tabla `formatos` necesita un campo `source` (manual/antigravity) y `evidence_url`. Antigravity alimenta esta tabla periódicamente con formatos detectados en tendencias globales (TikTok, IG Reels, YouTube Shorts por región y género). La vigencia se actualiza con data real, no con intuición.
**Mismos triggers que DT-031.**

### DT-033 · Automatización del audit (pipeline multi-fuente → Supabase → Kimi)
**Prioridad:** Diferida · **Fecha:** 2026-06-28
**Problema:** Los audits de artista se hacen manualmente y requieren copiar datos de múltiples fuentes.
**Solución propuesta:** Pipeline automatizado: fuentes de datos → datos normalizados en Supabase → síntesis vía Kimi.
**Capa Antigravity:** Antes de pagar Soundcharts, Antigravity cubre una parte significativa del audit con data pública: YouTube Analytics (público), Google Trends por artista y género, presencia en prensa digital, social mentions, playlists públicas. No reemplaza Soundcharts para métricas granulares (demographics, source of streams), pero reduce la dependencia para el audit inicial y complementa con datos que Soundcharts no tiene (search visibility, press coverage, trend context).
**Pipeline revisado:** Antigravity (data pública) + Soundcharts (data granular, cuando esté activo) → Supabase → Kimi (síntesis).
**Trigger propio (independiente de DT-031):** Suscripción Antigravity activa. Soundcharts se agrega cuando el volumen de artistas lo justifique.
**Conexión:** Comparte fuente Soundcharts con DT-015 y DT-017.

### DT-034 · Feedback loop de snippets (ponderación por ganadores)
**Prioridad:** Horizonte lejano · **Fecha:** 2026-06-28
**Problema:** Sin data histórica de rendimiento de snippets, no hay forma de ponderar propuestas futuras.
**Solución propuesta:** Kimi pondera propuestas futuras usando ganadores pasados del ledger.
**Capa Antigravity:** Agrega la dimensión del POR QUÉ funcionó. Un snippet ganador ¿performó por el formato, por el timing, o por un trend externo? Antigravity cruza los ganadores del ledger con tendencias globales del momento para separar señal interna (el artista/formato conectó) de señal externa (había un trend que amplificó). Esto evita que el feedback loop sobreajuste a coincidencias de timing.
**Pre-requisito:** Meses de data acumulada en el ledger (DT-032). NO construir hasta tenerla.

### DT-035 · Meetings Hub en dashboard + integración Google Calendar
**Prioridad:** Alta · **Fecha:** 2026-06-30
**Problema:** Las reuniones con artistas se planifican con agenda (temas a tratar, onboardings por tarea) pero al ser muchas semanales, se pierde información, se olvidan puntos o no queda registro estructurado post-reunión. Hoy no hay un lugar centralizado para ver reuniones pasadas/futuras con su contexto.
**Solución propuesta:** Nuevo apartado "Reuniones" en el dashboard con:
1. **Integración Google Calendar** — Conectar vía OAuth2 para agendar reuniones en Google Meet directamente desde el dashboard. Cada reunión queda vinculada al artista.
2. **Vista de lista** — Reuniones próximas y pasadas por artista, con estado (agendada/completada/cancelada).
3. **Vista interna de reunión** con 3 secciones:
   - **Pre-reunión:** Temas a tratar (checklist) + onboardings necesarios por tarea (ej: "completar audit algorítmica", "definir brandbook").
   - **Post-reunión:** Anotaciones manuales + transcripción subida (archivo o link). Al subir transcripción, se destila automáticamente la info relevante por cada tema de la agenda como anotación post-reunión.
4. **Conexión con artista** — Desde la vista interna del artista, sección de reuniones muestra las últimas con acceso directo a la vista interna.
**Pre-requisitos:** OAuth2 con Google Calendar API (scope: calendar.events + meet). Decisión sobre dónde almacenar reuniones (nueva tabla `meetings` vs reutilizar `mgmt_meetings` expandida). Decisión sobre procesamiento de transcripciones (Claude API para destilado o manual).
**Conexión:** Complementa `mgmt_meetings` existente (que hoy solo tiene fecha + resumen básico). DT-035 lo reemplazaría con un sistema más completo.

### DT-036 · Programar el Perfilador (`gs-perfilador-artista`)
**Prioridad:** Alta (bloquea Auditor de Mercado y Sintetizador) · **Fecha:** 2026-06-30
**Problema:** El agente tiene system prompt completo (v1.1 en `.claude/agents/gs-perfilador-artista.md`) pero nunca se ejecutó con un artista real. Es el pilar cualitativo del Análisis 360 — sin él, el Sintetizador recibe solo data cuantitativa sin contexto de identidad.
**Definición de hecho (DoD):**
- Recibe transcripción del notetaker (reunión de onboarding) como input.
- Ejecuta: router de tipología → variables de identidad → punto único (hipótesis) → score de coherencia interna.
- **Regla invariante de evidencia:** cada rasgo afirmado cita la frase textual de la transcripción. Sin ancla textual, no se afirma.
- Entrega contrato de handoff: `punto_unico` (HIPÓTESIS NO VALIDADA), `hipotesis_nicho`, `adyacencias_a_barrer`, `tipo_dominante`.
- Pre-evalúa PODERES 5, 6, 7 (presupuesto, disponibilidad, identidad visual).
- NO toca data cuantitativa. NO valida su propia hipótesis. NO juzga mercado.
**Conexión:** Output va al Sintetizador como tercer pilar + al Auditor de Mercado (DT-037) como definidor de scope.

### DT-037 · Crear Auditor de Mercado (fase 2)
**Prioridad:** Alta (desbloqueado por Antigravity) · **Fecha:** 2026-06-30 · **Actualizada:** 2026-07-04
**Problema:** No existe agente que audite el entorno (competencia, nicho, demanda, norma demográfica). Los auditores actuales (Redes + Musical) miran al artista propio; nadie mira afuera.
**Dependencia:** NO puede ejecutarse sin perfil válido del Perfilador (DT-036). El perfil define qué mercado estudiar.
**Mandato anti-eco:** Confirma el nicho que sugiere el perfil Y barre adyacencias que el perfil no pidió. Protege contra la cámara de eco que solo confirma lo que el artista ya creía.
**Separación con Auditor Musical:** Musical extrae filas de *tu artista* de Soundcharts; Mercado extrae filas de *competencia/nicho*. Misma fuente, objetos distintos.
**Motor Antigravity (cambio clave):** Antigravity es el motor primario de este agente. Tiene acceso a las bases de datos globales de Google (Search, YouTube, Trends) para responder las preguntas que definen el audit de mercado: ¿Quiénes son los artistas del nicho con métricas similares? ¿Cuál es la norma demográfica? ¿Qué playlists editoriales mueven artistas emergentes de este perfil? ¿Qué sellos/distribuidoras están firmando en este espacio? ¿Cuál es el volumen de búsqueda del género/nicho? Esto DESBLOQUEA DT-037 sin depender de Soundcharts — la inteligencia de mercado cualitativa que Soundcharts no provee viene gratis con Antigravity.
**Nota CTO (revisada):** Prioridad sube de Baja a Alta. Antigravity elimina la dependencia de fuentes pagas para la primera versión. Corre manual hasta que Perfilador y Sintetizador estén validados, pero ya no hay bloqueo económico.

### DT-038 · Orquestación con dependencia de fase
**Prioridad:** Media · **Fecha:** 2026-06-30
**Problema:** El Auditor de Mercado (DT-037) NO debe poder ejecutarse sin un perfil válido en input. Es una guarda de orquestación, no un detalle de timing.
**Solución propuesta:** Validación en el hand-off: antes de crear run para Auditor de Mercado, verificar que existe run `complete` del Perfilador para ese artista con output válido vs output_schema.
**Conexión:** Requiere el protocolo de hand-off entre agentes (Anexo A del SOP Análisis 360) y la tabla `runs` en Supabase.

### DT-039 · Agente Limpiador de Transcripción (`gs-limpiador-input`) — PARCIAL
**Prioridad:** Alta (gatea la calidad de TODO lo que el Perfilador produce) · **Fecha:** 2026-06-30 · **Actualizado:** 2026-07-16
**Estado:** Parcial. El agente está construido y versionado, pero nunca se ejecutó sobre una transcripción real.
**Problema:** La regla de evidencia textual del Perfilador (DT-036) solo vale si lo que cita es lo que el artista REALMENTE dijo. El crudo del notetaker viene con ruido conversacional, errores de transcripción y sin etiquetas de hablante. Basura de entrada = evidencia contaminada.
**Qué se hizo:**
- Se creó y commiteó `.claude/agents/gs-limpiador-input.md` (commit `0ebe408`, 2026-07-16).
- Prompt v1.0 completo con:
  - Rol y límites claros: preprocesador de texto, NO interpreta, NO resume, NO perfila.
  - Contrato I/O: input `.md` de Notas de Gemini; output `TRANSCRIPCIÓN LIMPIA` con metadata + transcripción etiquetada.
  - 6 pasos de procesamiento: extraer transcripción, identificar/normalizar hablantes, limpiar ruido, fusionar fragmentos, corregir errores de transcripción, estructurar salida.
  - Formato de output explícito con etiquetas `[ARTISTA]`, `[ENTREVISTADOR]`, `[PARTICIPANTE: nombre]`.
  - Regla de calidad (BUENA/ACEPTABLE/POBRE) y advertencia para transcripciones de calidad pobre.
  - Regla de preservación de evidencia textual: "Si dudás si algo es ruido o signal: PRESERVALO."
- Sin secrets: `grep` no encuentra API keys, passwords, tokens, connection strings ni data de clientes en el archivo.
**Cómo se validó (estático):**
- Frontmatter completo (slug, name, version, role, description, model, tools, vault_read/write, handoff_to, depends_on, status).
- Contrato I/O legible y completo en el cuerpo del prompt.
**Qué falta para cerrar DT-039:**
- Ejecutar el agente sobre una transcripción real de onboarding (ej. Reckless, Marlon o un nuevo artista).
- Verificar que el output se escribe en `06_CLIENTES/<slug>/00-perfilamiento/transcripcion-limpia.md`.
- Validar que las etiquetas `[ARTISTA]` / `[ENTREVISTADOR]` sean correctas y que no se pierda contenido sustantivo.
- Confirmar que el Perfilador pueda usar el output como input sin re-procesamiento.
**Definición de hecho (DoD) original:**
- Input: transcripción literal cruda del notetaker (no el resumen).
- Limpia ruido conversacional (saludos, charla, muletillas que no aportan).
- Corrige errores de transcripción de nombres/términos.
- Etiqueta hablantes: `[ARTISTA]` / `[ENTREVISTADOR]`.
- Output: transcripción limpia y etiquetada, lista para el Perfilador.
- NO parafrasea el contenido del artista.
**Conexión:** Fase 0.5 del SOP Análisis 360. Va entre la reunión de onboarding y el Perfilador (DT-036). Es barato pero no opcional.

### DT-040 · Pipeline automático Drive → BÓVEDA (n8n + Google Drive)
**Prioridad:** **Alta** (elevada 2026-07-15) · **Fecha:** 2026-06-30 · **Decisión:** D-101

> **Por qué se elevó (2026-07-15).** El criterio de graduación se cumplió: al 2026-07-15 Ian lleva **varios días sin registrar reuniones de Chimbita Records y Marlon**. El upload manual dejó de ser una molestia y pasó a ser pérdida de datos — y como el cierre de mes es archive-first (se genera desde los `.md` de la BÓVEDA), un mes sin bitácoras produce un informe incompleto **en silencio**. Ver **D-101** para las reglas de diseño (ruteo por convención, idempotencia, bandeja de pendientes en vez de adivinanza).
>
> **Backlog abierto:** las reuniones atrasadas de Chimbita y Marlon se suben a mano una vez. La automatización previene el próximo atraso, no cura este.
**Problema:** Las transcripciones de reuniones llegan como .docx a Google Drive. Hoy se suben manualmente al dashboard, donde el server convierte a .md (mammoth). Funciona, pero requiere intervención manual en cada reunión.
**Solución propuesta:** Workflow n8n que vigila una carpeta de Drive. Cuando cae un .docx nuevo: descarga → convierte a .md → empuja a BÓVEDA en la carpeta del artista correspondiente → opcionalmente notifica o crea la reunión en el dashboard.
**Pre-requisitos:** n8n operativo (DT-030 Node ≤22), Google Drive API credentials, convención de naming en Drive para mapear archivo → artista.
**Trigger de graduación:** Cuando el volumen de reuniones haga que el upload manual sea cuello de botella (estimado: ≥4 reuniones/semana).
**Conexión:** Complementa DT-035 (Meetings Hub) y DT-039 (Limpiador). El pipeline sería: Drive → n8n (descarga + convierte) → BÓVEDA → Limpiador (DT-039) → Perfilador (DT-036).

### DT-041 · Dashboard Stabilization (tests + guardrails) — PARCIAL
**Prioridad:** Alta · **Fecha:** 2026-06-30 · **Actualizado:** 2026-07-16
**Estado:** Parcial. Fase 0 de higiene estabilizadora completada el 2026-07-15.
**Hecho:**
- Smoke tests Jest en `agent-dashboard/tests/smoke.test.js`: 5/5 pasan (levantan server real en puerto efímero y verifican `/`, `/api/agents`, `/api/artists`, `/api/mgmt/metrics`, `/api/artist/:slug/dashboard`).
- `npm test` configurado en `package.json` (`jest --runInBand`).
- Rutas de BOVEDA centralizadas en `agent-dashboard/config.js` (`BOVEDA_PATH`, `CLIENTS_PATH`, `AGENTS_PATH`) con fallback a paths locales.
- Consumidores migrados: `deliverables.js`, `scripts/test-meeting-create.js`, `scripts/test-meeting-parse.js`.
- Commits: `b3ecea8` (gitignore), `5e9b05a` (config), `1488fae` (tests), `64d269e` (.env.example), `c8ef7ae` (schema script).
**Falta para cerrar DT-041:**
- Tests E2E por endpoint crítico (no solo smoke: validar contratos de respuesta campo a campo).
- Schema validation contra Supabase (verificar que tablas/columnas esperadas existen antes de arrancar server).
- Guardrails de regresión (CI local, pre-commit o hook que corra `npm test`).
- Inventario completo de endpoints críticos y funciones de `db.js` cuya estructura de retorno deba validarse.
**Problema original:** Cada modificación al dashboard rompe algo (queries, joins, nombres de columna, month rollover). El sistema depende de Claude Code para sostenimiento — Ian quiere estabilidad sin depender de IA para que funcione.
**Trigger:** Inmediato — cada bug fix introduce regresiones.

### DT-042 · Informe mensual de entrega (.md con Kimi)
**Prioridad:** Alta · **Fecha:** 2026-06-30
**Problema:** Al cerrar el mes con un artista, se necesita un informe de entrega profesional que compile objetivos, entregables, reuniones, decisiones y misiones. Hoy se haría manualmente — no escala.
**Solución propuesta:** Botón "GENERAR INFORME DEL MES" en vista interna del artista. Compila data de Supabase (engagement, objectives, deliverables, meetings, secondary_tasks), llama a Kimi para narrativa ejecutiva, guarda .md en `06_CLIENTES/<slug>/mgmt/monthly/informe-YYYY-MM.md`.
**Capa Antigravity:** Enriquece el informe con contexto de industria: "Durante junio, el género urbano en Colombia creció X% en streams; el artista creció Y% — Z puntos por encima/debajo del mercado." Transforma un reporte operativo en un análisis estratégico posicional. Antigravity provee benchmarks de género/nicho/región; Kimi integra esos datos en la narrativa.
**Pre-requisitos:** DT-035 Meetings Hub funcional (para reuniones con post_notes), engagement activo con data suficiente.
**Prompt:** `agent-dashboard/design/PROMPT-DT042-INFORME-MENSUAL.md`
**Conexión:** Complementa el flujo de "Cerrar Mes" (PROMPT-FIX-MES-FALLBACK.md Part 2). Idealmente se genera el informe ANTES de cerrar el mes.
**Actualización 2026-07-05 (converge con DT-044):** El output ya NO es solo `.md`. El deliverable de cierre es un **HTML llamativo para GitHub Pages** con gráficas y data real (estética la provee Ian). El `.md` de narrativa pasa a ser un artefacto intermedio (la lectura del Órgano de Control), no el entregable final. La ORQUESTACIÓN de este informe se reasigna a la jerarquía D-099 — ver DT-044 para la descomposición en 3 roles (Jefe de Área acumula → Growth Hacker/Control interpreta → Documentación renderiza HTML).

**Actualización 2026-07-16 (v0.1 del compilador, commit `56420e5`):**
**Qué se hizo:**
- Se construyó `compilador-informe-mensual.js` en `03_PROTOCOLOS/herramientas/`.
- Sigue el principio archive-first del SOP-CIERRE-DE-MES.md: lee `.md` de la BÓVEDA, no tablas de BD.
- Parser de actas soporta el formato actual de `mgmt/meetings/` (`> Fecha:`, `> Tipo:`, secciones `Resumen`/`Decisiones`/`Action Items`).
- Corrigió bug de fechas (zona horaria desplazaba un día atrás).
- Genera output en `06_CLIENTES/<slug>/mgmt/monthly/informe-YYYY-MM.md`.

**Cómo se validó:**
- Ejecutado sobre Reckless junio 2026.
- Incluyó 7 reuniones: 2 empalmes Meta #1 (11/jun), empalme Meta #3 (11/jun), entrega Meta #3 (12/jun), entrega Meta #1 (21/jun), empalme Meta #4 (30/jun), snippet testing (1/jul).
- Se comparó output generado contra `informe-2026-06.md` humano (reconstruido desde el HTML publicado tras sobrescribirse accidentalmente).

**Corrección Prioridad 1 — conteos (2026-07-16):**
- El compilador ya NO inventa números.
- Sección 5 ahora reporta:
  - `Objetivos completados: —`
  - `Entregables finalizados: —`
  - `Misiones ejecutadas: —`
  - `Reuniones realizadas: <derivado de actas>`
  - `Decisiones registradas en actas: <derivado de actas>`
- Razón: objetivos, entregables y misiones no están estructurados en los `.md` fuente. Un "—" es honesto; un conteo heurístico es falso.

**Verificación Prioridad 3 — fecha `empalme-meta-3-1781193050306.md`:**
- Timestamp `1781193050306` = `2026-06-11T15:50:50.306Z` (10:50 a.m. hora Colombia).
- La fecha del archivo (`2026-06-11`) coincide con el timestamp. **No es typo.** Se deja tal cual.

**Implementación Prioridad 2 — formato estructurado (2026-07-16):**
Se aplicó la opción 2 aprobada. El compilador ahora lee dos fuentes estructuradas:

1. **`## Métricas clave`** en `01-auditorias/auditoria-musical.md` y `auditoria-redes-sociales.md`:
   - Tabla normalizada `| Indicador | Valor | Significado |` con métricas de baseline.
   - Agregada a ambas auditorías de Reckless con datos derivados del contenido existente.

2. **`06_CLIENTES/<slug>/mgmt/monthly/resumen-YYYY-MM.md`**:
   - Frontmatter YAML con `objetivos_total`, `objetivos_completados`, `entregables_total`, `entregables_completados`, `reuniones_realizadas`, `decisiones_estrategicas`, `misiones[]`, `documentos[]`.
   - Creado `resumen-2026-06.md` para Reckless con datos del informe humano validado.
   - Incluye nota explícita: es **input de la capa de Control** (Growth Hacker / Jefe de Área), no output del compilador.

**Validación del DoD — compilador genera números reales (Reckless junio 2026):**
- `Objetivos completados: 5/5`
- `Entregables finalizados: 8/8`
- `Reuniones realizadas: 7`
- `Misiones ejecutadas: 5`
- `Documentos producidos: 6`
- `Decisiones estratégicas registradas: 8`
- Misiones y documentos listados explícitamente debajo de la tabla.

**Delta vs informe humano (lo que sigue sin ser mecánico):**
- **Sección 0 ("El mes en una frase"):** el compilador produce un fragmento del resumen ejecutivo o concatenación de resúmenes; el humano escribe una tesis sintética.
- **Sección 1 (Baseline):** el compilador extrae métricas de la tabla `## Métricas clave`, pero el significado/contexto y el diagnóstico integrado siguen siendo trabajo humano.
- **Sección 2 (Entregables):** agrupa por meta, no por tema narrativo. Pierde el "por qué importa", conexión con diagnóstico, y análisis cualitativo.
- **Sección 3 (Decisiones):** lista todas las decisiones de las actas, incluyendo tácticas/operativas; el humano filtró 8 decisiones estratégicas definitorias.
- **Sección 4 (Lo que demostró):** no encuentra sección equivalente en `contexto.md`. El humano escribió 5 cualidades con evidencia.
- **Sección 6 (Antes/Después):** genera filas genéricas; el humano hizo una tabla de 10 dimensiones con valores concretos.
- **Sección 7 (Pendientes):** extrae action items abiertos de las actas; el humano los agrupó por área.

**Alcance de DT-042 — andamio mecánico, no narrativa:**
- El compilador NO usa LLM para las secciones 0/2/4/6.
- Su techo es: extraer datos estructurados, contar lo contable y armar el esqueleto de las 7 secciones.
- La narrativa, la tesis sintética, el filtrado de decisiones estratégicas y el análisis cualitativo son trabajo del Growth Hacker (D-099: DATA ≠ LECTURA).

**Qué quedó afuera / siguiente paso:**
- Replicar `resumen-YYYY-MM.md` para futuros meses/artistas (ritual de cierre).
- Decidir si la sección 1 del compilador usa la tabla `## Métricas clave` para armar el baseline automáticamente (hoy solo lee algunas métricas por regex).
- Revisión narrativa de Growth Hacker sigue siendo obligatoria antes de entregar al cliente.

### DT-043 · Modelo de 3 cerebros — convención de roles y formato I/O entre modelos
**Prioridad:** Alta · **Fecha:** 2026-07-04
**Problema:** Con la incorporación de Antigravity (Gemini), G*S opera con 3 modelos. Sin convención de roles clara y formato I/O estandarizado, los modelos se pisan o duplican trabajo.

**Modelo de 3 cerebros:**

| Modelo | Rol | Fortaleza | NO hace |
|--------|-----|-----------|---------|
| **Antigravity (Gemini)** | Inteligencia EXTERNA | Datos del mundo real, tendencias, competencia, formatos, benchmarks globales | Arquitectura, código, datos internos del artista |
| **Claude** | Construcción INTERNA | Arquitectura, agentes, skills, BÓVEDA, contexto personalizado del artista | Datos en tiempo real del mundo exterior |
| **Kimi** | Operación RUNTIME | Dashboard, mezcla, mantenimiento, outputs user-facing | Construcción, decisiones arquitectónicas |

**Pendiente de definir:**
1. Convención de prompts para queries de inteligencia externa (Antigravity).
2. Formato de output estandarizado para que Claude y Kimi consuman datos de Antigravity.
3. Dónde se persisten los outputs de Antigravity (Supabase, BÓVEDA, o ambos).

**DTs impactadas (el detalle de Antigravity vive en cada una):** DT-017, DT-031, DT-032, DT-033, DT-034, DT-037, DT-042.
**Pre-requisitos:** Suscripción Antigravity activa con tokens suficientes.

### DT-044 · Activación de la jerarquía D-099 — primer módulo orquestador (cierre de mes MGMT/Growth)
**Prioridad:** Alta (primer caso operativo de D-099 + primer Loop de G*S) · **Fecha:** 2026-07-05
**Problema:** La jerarquía D-099 está definida pero ninguna caja de dirección/control está poblada. El cierre de mes de un artista MGMT (ej. RECKLESS) es el primer flujo real que exige esas cajas: alguien acumula el trabajo del mes, alguien lo interpreta, alguien lo presenta.

**Cambios organizacionales — DOS NIVELES de Growth Hacker (patrón Head of Growth + Growth Leads):**
1. **Growth Hacker de G*S (macro): DIRECTIVO → ÓRGANO DE CONTROL.** Uno solo. Mira toda la cartera de artistas. Hace la lectura AGREGADA (cómo va el portafolio) y es el puente operativo↔directivo. NO interpreta artista por artista en detalle — eso no escala; delega en los GH por artista.
2. **Growth Hacker por artista (micro): nuevo, caja JEFES DE ÁREA.** Uno por artista lógicamente, pero es **UN solo system prompt instanciado con el contexto de cada artista** (patrón buildAgentContext(clientSlug, artistSlug) que ya existe en el agent runner — NO son N agentes distintos, no hay proliferación). Lleva el registro mensual de SU artista Y produce la lectura de cierre de SU artista.

**Descomposición correcta (target, respeta D-099):**
| Rol | Caja | Responsabilidad |
|-----|------|-----------------|
| Growth Hacker por artista (nuevo, 1 prompt × N contextos) | Jefes de Área | Acumula durante el mes (objetivos, entregables por objetivo, decisiones de reuniones, misiones secundarias) Y lee/interpreta la data de SU artista → lectura estratégica del artista (`.md` intermedio). Autoridad única de interpretación de ESE artista. |
| Growth Hacker de G*S (reclasificado) | Órgano de Control | Agrega las lecturas de todos los artistas → lectura de cartera. Sube contexto a dirección, baja decisiones directivas. Autoridad única de interpretación AGREGADA. NO produce HTML. |
| Documentación | Documentación | Toma la lectura ya hecha + data real → HTML llamativo con gráficas para GitHub Pages. Estética la provee Ian. NO interpreta. |

**Anti-proliferación:** "Growth Hacker por artista" = 1 definición de agente, N invocaciones con contexto de cada artista (Reckless, Ery, etc.). Aprovecha la infra de contexto por artista que ya tiene el dashboard. Escalar a un artista nuevo NO crea un agente nuevo.

**Autoridad de interpretación por nivel (mantiene la regla DATA≠LECTURA):** cada artista tiene UN intérprete (su GH por artista). La cartera tiene UN intérprete agregado (GH de G*S). Ningún dato tiene dos autoridades que puedan discrepar.

**Regla de diseño (por qué separar):** el análisis NO se acopla al formato. La misma lectura de cierre debe poder salir como HTML, PDF o slides sin tocar al Órgano de Control. Interpretación (Control) ≠ presentación (Documentación).

**Frontera analítica (DATA ≠ LECTURA) — no colapsar Control en Documentación:** El informe de cierre confluye de múltiples fuentes: registro del mes (Jefe de Área), métricas/data (auditores operativos), análisis psicológico/aspiracional del artista de las reuniones (agente de Soporte — COO psicológico), y contexto externo/benchmark (Antigravity). TODAS esas fuentes confluyen en el ÓRGANO DE CONTROL (Growth Hacker), que es la ÚNICA autoridad de interpretación: cruza fuentes y produce LA LECTURA. Documentación NO analiza métricas ni genera insight — recibe la lectura ya hecha y la presenta. Documentación NO necesita habilidades growth hacker; necesita habilidades de diseño de información (skills ui-ux-pro-max, awesome-claude-design, gs-landing-builder). Regla dura: una sola autoridad de interpretación por dato (Control). Si dos agentes interpretan la misma fuente y pueden discrepar → ambigüedad de autoridad = bug. Analogía: Control = periodista/editor (investiga, cruza fuentes, escribe la nota con criterio); Documentación = director de arte (maqueta la nota ya escrita en portada llamativa, no reescribe ni decide qué es importante).

**MVP pragmático (filosofía #3):** NO construir 3 agentes el día 1. Un solo pase hace las tres cosas con las fronteras marcadas en código para separarlas cuando el volumen (≥2-3 artistas con cierre mensual) lo justifique.

**Stack que activa (primera vez en G*S):**
- **Loops** — el cierre de mes es un `/goal` de manual: "el informe de cierre de <ARTISTA> de <MES> tiene todas las secciones con data real y está publicado en GitHub Pages". Charter con ciclo encontrar→hacer→revisarse→recordar→parar.
- **GitHub Pages** — pieza NUEVA en el stack. Hosting estático del HTML de cierre. Soberano, $0, alineado con D-006.
- **Supabase** — tablas de registro mensual (heredadas/contempladas por DT-042: objectives, deliverables, meetings, secondary_tasks — verificar cuáles existen ya).
- **3 cerebros (DT-043)** — Antigravity aporta benchmark de mercado/género, Growth Hacker/Claude interpreta, Kimi puede renderizar.

**Inputs que el Jefe de Área lee e interpreta:** objetivos principales del mes · entregables por objetivo · decisiones tomadas en reuniones con el artista · misiones secundarias del mes.

**Foco/orden:** Diferido hasta terminar el deploy de vida-ian (en curso). Es el siguiente módulo grande de G*S tras vida-ian.
**Criterio de graduación a 3 agentes separados:** ≥2-3 artistas con cierre mensual simultáneo, o cuando el pase único se vuelva cuello de botella.
**Conexión:** Es la materialización operativa de D-099. Absorbe y reformula DT-042 (informe mensual). Depende de la restricción de formato fijo entre capas (D-099).

### DT-045 · Infraestructura de datos para cierres de mes (dashboard-side)
**Prioridad:** Diferida · **Fecha:** 2026-07-05
**Contexto.** Auditoría del schema Supabase contra las 8 fuentes del cierre de mes (SOP-CIERRE-DE-MES). El núcleo MGMT está CUBIERTO: `mgmt_engagements` (contenedor del mes), `mgmt_objectives`, `mgmt_deliverables`, `mgmt_meetings`, `secondary_tasks`, `mgmt_monthly_reports` (agregador). Faltan las "patas de valor":
- **Fuente 1 — Baseline/métricas:** NO EXISTE estructurado. Solo `clients.artist_tier`. Sin time-series de listeners/streams/revenue/followers/geo no hay "antes vs después" consultable. → tabla `artist_metrics`.
- **Fuente 4 — Decisiones estratégicas:** PARCIAL. Se extraen al `.md` de la reunión pero sin columna/tabla. → `mgmt_decisions` o `decisions JSONB` en `mgmt_meetings`.
- **Fuente 7 — Lanzamientos + 4 frentes:** PARCIAL. El lanzamiento existe como `projects.project_type='lanzamiento'` pero los 4 frentes (orgánico/profesional/UGC/prensa) no se modelan; prensa (`press_batches`) ni siquiera enlaza al `project_id`. → `launches` + `launch_fronts`.
- **Fuente 8 — Dirección artística mensual:** NO EXISTE. Hoy se cuela como `mgmt_deliverables` sueltos. → `artistic_direction` (separado del brand-book).
- **Índice de documentos:** registro PARCIAL (`artist_links`, `file_path`, `document_path`, `agent_invocations.output_path`). No hay índice automático de `06_CLIENTES/<artista>/` — los `.md` viven sueltos y el código escanea el filesystem en vivo.

**Decisión CTO.** NO se construye ahora. El cierre de mes se genera **archivo-first** (leyendo los `.md` de la raíz del artista, per SOP) — el informe de junio de Reckless lo demuestra: salió completo SIN estas tablas. Estas tablas son para VISUALIZAR/consultar en el dashboard, no para producir el informe. Se construyen cuando el dashboard necesite mostrar esta data agregada y haya ROI (criterio D-004: ≥3 clientes pagos operando).
**Conexión:** complementa DT-042/DT-044. La fuente 1 (métricas) es la de mayor valor si algún día se prioriza (habilita el "antes/después" automático).

| DT-058 | ~~`getAllArtists` no aplica la resolución "artista de sello" (`label_client_id`) → el Roster mostraba a Marlon con el engagement legacy ($750/paused) en vez del real de Chimbita ($4M/active)~~ | Hallazgo del fix DT-049 (Tanda F) | **CERRADA (2026-07-15, modelo artista-de-sello)** — la decisión pedida se tomó: **Regla 1 del modelo** — "un artista de sello se resuelve SIEMPRE por `label_client_id`, NUNCA por service_line propio". `getAllArtists` migrado. Validado por Ian: Roster muestra Marlon `active` / 4.000.000 COP. El service_line legacy quedó neutralizado con el fantasma archivado (DT-052) |

## Deuda cerrada

| # | Descripción | Resolución |
|---|-------------|-----------|
| DT-003 | Extracción de titular por heurística (1ra línea limpia del content) | VALIDADA con outputs reales |

## Bug conocido

- ~~Encoding "discogrÃ¡fico"~~ — CERRADO (2026-07-15). Auditoría de Fase 0 no encontró ocurrencias activas en BOVEDA ni en agent-dashboard. La forma rota solo persistía en esta línea del registro.
