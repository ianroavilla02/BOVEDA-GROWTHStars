# Registro de Deuda Técnica — G*S / SANCORT

> Canon único de deuda técnica. Mismo patrón que REGISTRO-DECISIONES.md (D-082).
> Última actualización: 2026-07-05

---

## Deuda activa

| # | Descripción | Origen | Estado |
|---|-------------|--------|--------|
| DT-001 | Paridad agentes filesystem/Supabase | Fundación | Cerrada (sync automático al arrancar server — db.js:syncAgentsToSupabase) |
| DT-004 | fire-and-forget (D-054) se rompe en serverless | D-054 | Inactiva (solo aplica si se deploya) |
| DT-005 | Migrar sub-agentes de global a project scope | D-005 | Cerrada (17 agentes G*S en BOVEDA/.claude/agents/) |
| DT-020 | Contextos de Reckless, Ery, Jot4 R pendientes de carga | Día 7 | Abierta |
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
| DT-039 | Agente Limpiador de Transcripción (`gs-limpiador-input`) — sanea el crudo del notetaker antes del Perfilador | SOP Análisis 360 | Abierta |
| DT-040 | Pipeline automático Drive → BÓVEDA: n8n vigila carpeta de Drive, convierte .docx → .md, empuja a BÓVEDA | Operaciones / Meetings | Diferida |
| DT-041 | Dashboard Stabilization — tests E2E, schema validation, guardrails para evitar regresiones | Operaciones | Abierta |
| DT-042 | Informe mensual de entrega (.md con Kimi) — compilar objetivos, entregables, reuniones, misiones → narrativa | Operaciones / MGMT | Abierta |
| DT-043 | Modelo de 3 cerebros: Antigravity (externo) + Claude (interno) + Kimi (runtime) — convención de roles y formato I/O | Stack / Arquitectura | Abierta |
| DT-044 | Activación jerarquía D-099: Growth Hacker → Órgano de Control + primer Jefe de Área (registro mensual MGMT/Growth por artista) + primer Loop de cierre de mes | D-099 / DT-042 | Abierta (primer módulo orquestador — enciende Loops + GitHub Pages) |
| DT-045 | Infraestructura de datos para cierres de mes en el DASHBOARD: baseline/métricas time-series (`artist_metrics`), lanzamientos + 4 frentes (`launches`/`launch_fronts`), dirección artística mensual (`artistic_direction`), decisiones estructuradas (`mgmt_decisions`), índice de documentos por artista | Auditoría SOP-Cierre | Diferida (los cierres se generan ARCHIVO-FIRST; estas tablas son para VISUALIZAR en el dashboard, no para producir el informe) |
| DT-046 | Schema no reproducible desde `05_BASES_DE_DATOS/*.sql`: 4 tablas HOLDING (`artists`, `artist_links`, `service_lines`, `service_types`) + varias columnas (`clients.type`, `projects.artist_id`, `secondary_tasks.artist_id/archived`, `mgmt_engagements.service_line_id`, `trm_daily`) viven solo en Supabase, sin migración versionada | Auditoría schema | Abierta (higiene: exportar el schema vivo a un `.sql` versionado para reproducibilidad) |
| DT-047 | Data confidencial de clientes (revenue, RPS, métricas, decisiones internas, citas de reuniones) publicada en repos GitHub Pages PÚBLICOS con `noindex` (reckless-sintesis-growth, reckless-cierre-junio, etc.). URL no indexable pero accesible por cualquiera con el link; queda en historial git permanente | Deploy deliverables | Riesgo ASUMIDO conscientemente. Criterio de revisión: al superar 4 clientes simultáneos entra un CTO profesional que reorganiza y da ciberseguridad a todo el stack |

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

### DT-039 · Agente Limpiador de Transcripción (`gs-limpiador-input`)
**Prioridad:** Alta (gatea la calidad de TODO lo que el Perfilador produce) · **Fecha:** 2026-06-30
**Problema:** La regla de evidencia textual del Perfilador (DT-036) solo vale si lo que cita es lo que el artista REALMENTE dijo. El crudo del notetaker viene con ruido conversacional, errores de transcripción y sin etiquetas de hablante. Basura de entrada = evidencia contaminada.
**Definición de hecho (DoD):**
- Input: transcripción literal cruda del notetaker (no el resumen).
- Limpia ruido conversacional (saludos, charla, muletillas que no aportan).
- Corrige errores de transcripción de nombres/términos (ej. "enpeso"→"empezó", nombres de productores, títulos de canciones).
- **Etiqueta hablantes:** `[ARTISTA]` / `[ENTREVISTADOR]`. Crítico — sin esto el Perfilador le atribuye al artista frases del entrevistador.
- Output: transcripción limpia y etiquetada, lista para el Perfilador.
- NO parafrasea el contenido del artista (debe preservar las palabras exactas para que la cita textual siga siendo válida).
**Conexión:** Fase 0.5 del SOP Análisis 360. Va entre la reunión de onboarding y el Perfilador (DT-036). Es barato pero no opcional.

### DT-040 · Pipeline automático Drive → BÓVEDA (n8n + Google Drive)
**Prioridad:** Diferida · **Fecha:** 2026-06-30
**Problema:** Las transcripciones de reuniones llegan como .docx a Google Drive. Hoy se suben manualmente al dashboard, donde el server convierte a .md (mammoth). Funciona, pero requiere intervención manual en cada reunión.
**Solución propuesta:** Workflow n8n que vigila una carpeta de Drive. Cuando cae un .docx nuevo: descarga → convierte a .md → empuja a BÓVEDA en la carpeta del artista correspondiente → opcionalmente notifica o crea la reunión en el dashboard.
**Pre-requisitos:** n8n operativo (DT-030 Node ≤22), Google Drive API credentials, convención de naming en Drive para mapear archivo → artista.
**Trigger de graduación:** Cuando el volumen de reuniones haga que el upload manual sea cuello de botella (estimado: ≥4 reuniones/semana).
**Conexión:** Complementa DT-035 (Meetings Hub) y DT-039 (Limpiador). El pipeline sería: Drive → n8n (descarga + convierte) → BÓVEDA → Limpiador (DT-039) → Perfilador (DT-036).

### DT-041 · Dashboard Stabilization (tests + guardrails)
**Prioridad:** Alta · **Fecha:** 2026-06-30
**Problema:** Cada modificación al dashboard rompe algo (queries, joins, nombres de columna, month rollover). No hay tests ni validación de schema. El sistema depende de Claude Code para sostenimiento — Ian quiere estabilidad sin depender de IA para que funcione.
**Solución propuesta:** Suite de tests E2E mínima (endpoint responses, schema validation contra Supabase, smoke tests de queries). Validar que cada función de db.js retorna la estructura esperada. CI local (npm test) antes de cada deploy.
**Pre-requisitos:** Definir runner (Jest/Vitest), mock de Supabase o test DB, inventario de endpoints críticos.
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

## Deuda cerrada

| # | Descripción | Resolución |
|---|-------------|-----------|
| DT-003 | Extracción de titular por heurística (1ra línea limpia del content) | VALIDADA con outputs reales |

## Bug conocido

- Encoding "discogrÃ¡fico" — prioridad media, pendiente
