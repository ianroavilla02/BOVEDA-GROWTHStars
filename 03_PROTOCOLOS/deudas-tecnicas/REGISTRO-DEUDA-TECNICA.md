# Registro de Deuda Técnica — G*S / SANCORT

> Canon único de deuda técnica. Mismo patrón que REGISTRO-DECISIONES.md (D-082).
> Última actualización: 2026-06-26

---

## Deuda activa

| # | Descripción | Origen | Estado |
|---|-------------|--------|--------|
| DT-001 | Paridad 15=15 agentes filesystem/Supabase | Fundación | Abierta (se rompe al crear Feed Architect) |
| DT-004 | fire-and-forget (D-054) se rompe en serverless | D-054 | Inactiva (solo aplica si se deploya) |
| DT-005 | Migrar sub-agentes de global a project scope | D-005 | Pendiente |
| DT-020 | Contextos de Reckless, Ery, Jot4 R pendientes de carga | Día 7 | Abierta |
| DT-023 | Sin UI para listar/re-abrir lotes existentes (press_batches) | D-065 | Abierta |
| DT-024 | Huérfanos en Supabase Storage al reemplazar adjunto | D-059/D-075 | Abierta (volumen bajo) |
| DT-025 | Commit consolidado no atómico (commit 5692507) | Día 8 | Asumida |
| DT-026 | closeBatch y saveAgentOutput duplican ruta BOVEDA → extraer getAgentDir() | D-065 | Abierta |
| DT-027 | getMgmtClients() y getMgmtMetricsOverview() usan metadata->>service='mgmt' → migrar a service_lines | D-079 | Abierta |

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
**Conexión:** Comparte Soundcharts API con DT-015.

### DT-018 · Script de onboarding de clientes
**Prioridad:** Crítica · **Fecha:** 2026-06-03
**Problema:** Crear cliente requiere acciones manuales en filesystem + Supabase. Propenso a errores, no escalable.
**Solución propuesta:** Script CLI `scripts/onboard-client.js` — modo interactivo y modo flags. Valida slug único, crea estructura filesystem D-006 v2 (8 subcarpetas: 00-baseline a 07-post-release), INSERT en Supabase (client + project). Tiempo: ~5 min vs ~30 min manual.
**Script auxiliar:** `register-run.js` para registrar ejecución de agente sin INSERT manual.

## Deuda cerrada

| # | Descripción | Resolución |
|---|-------------|-----------|
| DT-003 | Extracción de titular por heurística (1ra línea limpia del content) | VALIDADA con outputs reales |

## Bug conocido

- Encoding "discogrÃ¡fico" — prioridad media, pendiente
