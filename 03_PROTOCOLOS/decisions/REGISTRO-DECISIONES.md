# Registro de Decisiones Arquitectónicas — G*S / SANCORT

> Canon único de decisiones (D-082). Este archivo es la ÚNICA fuente de verdad.
> El CTO-Engram registra nuevas decisiones aquí al cerrar cada discusión (D-084).
> Última actualización: 2026-07-15 · Última decisión: D-102

---

## Convenciones

- **D-XXX** = decisión de arquitectura/producto
- Formato: `#` · título · contexto · decisión · qué descartó · detalle técnico
- Si una decisión modifica otra → marcar la vieja como OBSOLETA y referenciar la nueva
- Ante conflicto memoria vs disco → DISCO MANDA (regla de oro D-084)

---

# PARTE 1 — Fundación (Días 1-7, D-001 a D-025)

> Decisiones reconstruidas desde contexto acumulado. Para detalle exacto de D-006 a D-021, consultar commits de Días 1-7.

### D-001 · Arquitectura multi-producto base
**Contexto:** El sistema debía servir a dos líneas de negocio distintas.
**Decisión:** Separar G*S (lanzamientos one-shot) y MGMT (gestión mensual) como dos productos dentro de SANCORT.
**Qué descartó:** Un producto único que cubriera ambos flujos.
**Estado:** Evolucionada por D-067 (G*S pasa a HOLDING multi-línea).

### D-002 · Stack de capas separadas
**Decisión:** Notion (cliente-facing) / Obsidian-BOVEDA (conocimiento) / Supabase (operacional) / Kimi (inteligencia).
**Qué descartó:** Monolito o all-in-one.
**Detalle:** Cada capa evoluciona sin romper las otras.

### D-003 · Supabase Cloud como BD operacional
**Decisión:** Proyecto `gs-growthstars-prod` en São Paulo, free tier, con RLS y service_role.
**Qué descartó:** BD local, Firebase.

### D-004 · Dashboard local Node.js sin framework
**Decisión:** Server HTTP nativo en puerto 3737, tres archivos (index.html SPA, server.js router, db.js lógica).
**Qué descartó:** React, Next.js, frameworks pesados.
**Detalle:** Simplicidad, control total, sin dependencias de framework.

### D-005 · Migrar sub-agentes a project scope
**Decisión:** Migrar agentes de global (`~/.claude/agents/`) a project scope (`BOVEDA/.claude/agents/`).
**Estado:** PENDIENTE (DT-005).

### D-006 · Arquitectura de agentes G*S — 5 capas (v2, supersedes v1)
**Fecha:** 2026-05-12
**Contexto:** Los agentes coexistían en 3+ ubicaciones sin fuente de verdad clara (skills, sub-agentes, memoria de sesiones). Duplicados y drift entre prompts.
**Decisión:** Arquitectura de 5 capas con responsabilidades separadas:
1. **Skills** (`~/.claude/skills/`) — capacidades técnicas reusables, auto-creables por agentes con permisos
2. **Engram** — memoria persistente con namespace por agente+cliente
3. **Obsidian Vault** (BOVEDA) — BD operativa de conocimiento G*S
4. **Memory CC** (`~/.claude/projects/`) — contexto de sesiones, gestionado por Claude Code
5. **Sub-agentes** (`<proyecto>/.claude/agents/`) — roles operativos invocables
**Qué descartó:** v1 de 3 capas (no reconocía Engram ni Vault como capas formales). Agente directivo único.
**Detalle:** Frontmatter YAML obligatorio con: slug, name, panel, group, subgroup, workspace, role, model, tools, skills_used, can_create_skills, vault_read, vault_write, engram_namespace, handoff_to. Default deny en vault (si un path no está en vault_read/write, el agente NO lo toca). Roles de excepción: gs-cto (vault_read total), gs-bibliotecario (write a skills-master), gs-growth-hacker (write a metodología).

### D-007 · (reservado, sin registrar)

### D-008 · Organización de archivos — estructura plana en .claude/agents/
**Fecha:** 2026-05-12
**Contexto:** Ian preguntó si convenía crear subcarpetas (directivos/, maestros/, operativos/) dentro de `.claude/agents/`.
**Decisión:** NO subcarpetas. Estructura plana. Claude Code no soporta subcarpetas en `.claude/agents/`. El frontmatter `panel` clasifica por categoría; el dashboard lee panel del frontmatter, no del filesystem.
**Qué descartó:** Subcarpetas por panel (rompe descubrimiento automático de /agents).
**Detalle:** 12 agentes en carpeta plana es manejable. Reevaluar si supera 30.

### D-009 · Brand Book Digital como formato de entregable premium
**Fecha:** 2026-06-09
**Contexto:** G*S necesitaba un formato de entregable premium para brand books: profesional, costo cero, reproducible.
**Decisión:** HTML single-file + GitHub Pages + PDF print. 11 secciones canónicas, CSS tokens = paleta del artista, JS vanilla (cursor, fade-up, contadores, copy-HEX, scroll-spy), @media print A4. Repos públicos FUERA de BOVEDA; solo CONTENT.md regresa a la ficha del cliente.
**Qué descartó:** PDF estático (genérico), Notion page pública (sin control de diseño), Next.js (over-engineering).
**Detalle:** Flujo: co-creación en Claude.ai → build en Claude Code (~30min) → deploy GitHub Pages → firma del cliente. Protocolo y templates en `03_PROTOCOLOS/brand-book/`.

### D-010 a D-021 · Fundación detallada (Días 1-7)
**Contexto:** Modelo económico, dashboard v2, schema Supabase, módulo MGMT, onboarding, CRUD objetivos, parser híbrido regex/Kimi, tiers de artista (Tier 1 Emergente a Tier 4 Consolidado), triggers algorítmicos.
**Nota:** El detalle individual debe recuperarse de la documentación y commits de los Días 1-7.

### D-022 · Bloqueo de borrado de objetivos con hijos
**Decisión:** No permitir eliminar un objetivo que tenga deliverables o meetings asociados. Status "postponed" para rollover.
**Qué descartó:** Borrado en cascada.

### D-023 · Sin streaming en invocación de agentes
**Decisión:** No streaming. El loading muestra un timer que cuenta segundos.
**Qué descartó:** SSE/WebSocket (complejidad para UX marginal dado que 60-90s es el rango normal).

### D-024 · Logging mínimo de invocaciones
**Decisión:** `agent_invocations` guarda solo audit trail (cliente, agente, tokens, status, path), no textos completos.
**Qué descartó:** Guardar inputs/outputs completos en DB (los textos viven en filesystem/BOVEDA).

### D-025 · Guardado a BOVEDA manual
**Decisión:** Output se guarda a BOVEDA solo cuando el usuario presiona "Guardar en BOVEDA", no automáticamente.
**Qué descartó:** Auto-save (genera archivos basura).

---

# PARTE 2 — Clientes y artistas (Día 8, D-026 a D-031)

### D-026 · Artistas como subcarpetas dentro del cliente
**Decisión:** `06_CLIENTES/<cliente>/artistas/<artista>/`.
**Qué descartó:** Artistas como entidades top-level en filesystem (en ese momento).
**Detalle:** El contrato es con el sello, no con el artista.

### D-027 · PRINCIPIO OPERATIVO CENTRAL: cliente = quien contrata
**Decisión:** El cliente principal es SIEMPRE quien contrata y paga. El artista es el PROYECTO. El artista NUNCA es cliente directo.
**Qué descartó:** Artista como cliente (simplificación que no refleja la realidad legal/comercial).
**Estado:** Evolucionado por D-067/D-068 (artista pasa a entidad de primer nivel, pero el pagador sigue siendo el cliente).

### D-028 · Nombre real solo en contexto interno
**Decisión:** El nombre real/legal del artista vive SOLO en contexto interno. NUNCA en outputs públicos.
**Qué descartó:** Usar nombre real en cualquier contexto.
**Detalle:** Regla CRÍTICA heredada por todos los agentes que generan contenido público.

### D-029 · Output de agentes a nivel artista
**Decisión:** Output va a `06_CLIENTES/<cliente>/artistas/<artista>/agents/<agente>/`.
**Qué descartó:** Output a nivel cliente (el output es del proyecto/artista).

### D-030 · Migración legacy jared-la-j → moneymade
**Decisión:** Migrar engagement del legacy a moneymade, consolidar bajo D-027.
**Detalle:** UUID moneymade: 4caff612. **NOTA: moneymade posteriormente BORRADO (D-077).**

### D-031 · Output del agente LIMPIO
**Decisión:** Sin metadatos, sin mención de sello/era interna/inversor, nombre artístico siempre, no inventa datos.
**Qué descartó:** Incluir metadatos de generación en el output.

---

# PARTE 3 — Agente de prensa Fase 2 (Día 8, D-032 a D-040)

### D-032 · Pipeline de 2 etapas con checkpoint humano
**Decisión:** (1) generar ARCO en una llamada, (2) checkpoint humano, (3) generar notas una por una.
**Qué descartó:** Generar 5-10 notas en una sola llamada (riesgo de truncado y degradación).

### D-033 · Rating = calidad → flywheel
**Decisión:** Rating 1-5 significa CALIDAD. Notas `approved AND rating≥4` se reinyectan como ejemplos de estilo.
**Qué descartó:** Rating como prioridad de publicación.

### D-034 · ARCO_SYSTEM hereda prohibiciones de output público
**Decisión:** El system prompt del arco no menciona sello/inversor/management en los beats.
**Qué descartó:** Beats con contexto de negocio (mejoró la calidad narrativa al liberarlos).

### D-035 · generateNota reusa el prompt de gs-redactor-prensa
**Decisión:** Reusa el system prompt validado + arco + beat + ejemplos flywheel.
**Qué descartó:** Crear un estilo separado para lotes.

### D-036 · Dos modos de generar el arco
**Decisión:** Modo A (asistido: objetivo → IA propone arco) y Modo B (dirigido, PRINCIPAL: Ian pega plan → IA parsea).
**Qué descartó:** Un solo modo (el flujo real de Ian es Modo B).

### D-037 · Cada nota guarda fase + fecha
**Decisión:** Campos `fase`, `fecha`, `nota_contexto` en press_notes.
**Qué descartó:** Perder la estructura del plan original.

### D-038 · Datos duros sin inventar
**Decisión:** La IA NO inventa cifras. Si el plan dice "x cantidad" sin número, `datos_duros` queda vacío.
**Qué descartó:** Que la IA rellene cifras aproximadas.

### D-039 · El plan del usuario es intención, no titular
**Decisión:** `parseArco` guarda el bullet como `intencion`. El titular FINAL lo redacta `generateNota`.
**Qué descartó:** Que parseArco pula titulares (un solo lugar redacta = consistencia).

### D-040 · Tracking de costos por agente
**Decisión:** Implementar observabilidad tokens→USD/COP usando agent_invocations.
**Estado:** PENDIENTE.

---

# PARTE 4 — Meetings v2 (Día 8, D-041 a D-051)

### D-041 · Tareas secundarias por cliente (entidad nueva)
**Decisión:** `secondary_tasks`, ligada a client_id. Descentralizada de los entregables.
**Qué descartó:** Meter action items dentro de deliverables.

### D-042 · Enlace reunión→objetivo: IA sugiere, Ian confirma
**Decisión:** Tabla `meeting_objective_links` (N:M). IA sugiere con rationale, confirmed=false.
**Qué descartó:** Auto-vincular sin validación humana.

### D-043 · El parser recibe los objetivos del mes
**Decisión:** `getMeetingContext` trae objetivos activos y se los pasa a Kimi para sugerir enlaces.
**Qué descartó:** Que la IA invente IDs de objetivos.

### D-044 · Todo action item es tarea secundaria
**Decisión:** Unificar action items y tareas secundarias.
**Qué descartó:** Mantenerlos como entidades separadas.

### D-045 · Persistir todo al crear; confirmar enlaces después
**Decisión:** Al crear reunión se persiste todo (reunión + tareas + enlaces confirmed=false).
**Qué descartó:** Confirmar enlaces antes de guardar (más fricción).

### D-046 · Vista de cliente MGMT en 2 columnas
**Decisión:** Izquierda: objetivos+entregables. Derecha: reuniones+misiones.
**Qué descartó:** Layout vertical apilado.

### D-047 · Enlaces como informativo, no navegación
**Decisión:** Bajo cada objetivo: "Dialogado en reuniones del [fechas]". Clickear = bonus, no requisito.
**Qué descartó:** Navegación bidireccional completa (mucho más código por 1% más de valor).

### D-048 · Informe de cierre de mes (futuro)
**Decisión:** Agente sintetiza informe del mes cuando todo se cumple; reuniones se archivan.
**Estado:** NO CONSTRUIDO. Cuota futura.

### D-049 · Reuniones solo desde panel central
**Decisión:** Reuniones se crean y ven SOLO desde panel central (no bajo cada objetivo).
**Qué descartó:** Reuniones duplicadas en ambos sitios.

### D-050 · assigned_to reemplaza para_cristian
**Decisión:** 5 valores: santiago/ian/cristian/artista/equipo_artista. Kimi sugiere, Ian cambia.
**Qué descartó:** Flag booleano para_cristian (insuficiente).

### D-051 · renderClient360: bloque MGMT deduplicado
**Decisión:** Solo resumen (objetivos + progreso + botón "Ver detalle MGMT completo").
**Qué descartó:** Duplicar precio, listado detallado, reuniones y misiones en dos vistas.

---

# PARTE 5 — Prensa Fase 2: lote, curaduría, cierre (Días 8-9, D-052 a D-057, D-065)

### D-052 · Origen del lote: plan_raw + client_slug
**Decisión:** `press_batches` gana `plan_raw` y `client_slug`. `objetivo_percepcion` pasa nullable. Constraint chk_origen.
**Qué descartó:** Meter el plan crudo en `objetivo_percepcion` (ensucia el significado).

### D-053 · Paralelización con pool de concurrencia
**Decisión:** `generateBatchNotes` paraleliza con pool concurrency=3. Validado sin 429.
**Qué descartó:** Secuencial (9.5 min) y concurrency>3 (riesgo 429, retornos decrecientes).

### D-054 · Generación larga: fire-and-forget + polling
**Decisión:** POST dispara sin await → responde 202. UI lee progreso de press_notes.
**Qué descartó:** Request bloqueado 5 min (frágil, timeout en serverless).
**Nota:** DT-004 — si se deploya serverless, este patrón se rompe.

### D-055 · Estado intermedio 'generando'
**Decisión:** Status 'generando' en constraint de press_batches, seteado al inicio.
**Qué descartó:** Saltar de 'arco_aprobado' a 'generado' sin intermedio (no refresh-resilient).

### D-056 · Rating y status INDEPENDIENTES
**Decisión:** Aprobar/descartar = binario. Rating 1-5 = calidad aparte. Flywheel: approved AND rating≥4.
**Qué descartó:** Rating como requisito para aprobar.

### D-057 · Entrada unificada Normal/Lote
**Decisión:** Modal "Invocar" gana selector [Normal][Lote], visible SOLO para gs-redactor-prensa.
**Qué descartó:** Botón "LOTE" separado en la card (bug de stopPropagation).

### D-065 · closeBatch: cerrar lote y escribir a BOVEDA
**Decisión:** Escribe SOLO approved a `agents/gs-redactor-prensa/lotes/<batch-id>/`. Frontmatter YAML interno + cuerpo limpio.
**Qué descartó:** Guardar todas las notas (incluso descartadas) o guardar sin frontmatter.
**Detalle:** No contradice D-031 (frontmatter = metadata interna del vault, el cuerpo publicable va limpio). Status→'cerrado'.

---

# PARTE 6 — MGMT Detail (Día 8-9, D-058 a D-059)

### D-058 · Misiones secundarias: editar + archivar + borrar
**Decisión:** `archived` = flag boolean ORTOGONAL al status. Archivar preserva para informe D-048; borrar = hard delete con confirm.
**Qué descartó:** Solo marcar como 'descartada' (no es lo mismo que archivar una tarea hecha).

### D-059 · Entregables: adjunto de tipo variable
**Decisión:** `file_path` = puntero universal + `attachment_type` (pdf|md|link).
**Qué descartó:** `attachment_url` como columna separada (se dropeó, vacía y sin uso).

---

# PARTE 7 — Feed Architect (EN COLA, D-060 a D-064)

### D-060 · Brand-tokens estructurados
**Decisión:** Bloque YAML en nota BOVEDA: paleta, tipografías, arquetipo, tensión, pilares, ANTI-BRAND.
**Qué descartó:** Consumir el brand book como prosa (causa drift).

### D-061 · Separación capa conceptual / render
**Decisión:** El agente produce un SPEC de composición (grilla de tiles), NO la imagen.
**Qué descartó:** Agente que intenta generar imagen directamente.

### D-062 · Critic pass obligatorio
**Decisión:** Segundo paso valida contra anti-brand + ratios del tier ANTES del gate humano.
**Qué descartó:** Sin validación = automatizar el drift.

### D-063 · Pipeline y ubicación
**Decisión:** Brief Notion → n8n → Feed Architect → Critic → feed_proposals → Canva autofill → gate humano.
**Qué descartó:** Generar y publicar sin gate humano (irreducible).

### D-064 · MVP backend-first
**Decisión:** Primero brand-tokens + Architect + Critic con salida HTML/md. Canva y n8n después.
**Qué descartó:** Invertir en tubería (Canva+n8n) antes de validar que el contenido sale consistente.

---

# PARTE 8 — Holding: rediseño del modelo (Día 9, D-066 a D-079)

### D-066 · OBSOLETA
**Estado:** Superada por D-067 al revelarse que G*S es un holding multi-línea, no solo gestión continua.

### D-067 · G*S como HOLDING multi-línea
**Decisión:** 3 líneas: MGMT (gestión continua), Productora AV (por proyecto), Productora Eventos (booking + producción).
**Qué descartó:** G*S como producto one-shot único (D-001 evolucionada).
**Detalle:** Artista pasa a ENTIDAD de primer nivel (evoluciona D-027 sin romperlo).

### D-068 · service_lines como bisagra; pagador vive en el ÍTEM
**Decisión:** `service_lines` = (artist_id, service_type_id, status). Pagador (client_id) en el ítem facturable, no en la línea.
**Qué descartó:** Pagador en service_line (no soporta pagadores distintos por ítem).
**Detalle:** Artista autogestionado → fila en clients type='artista' (Reckless vive en ambas tablas).

### D-069 · Eventos: entidad propia N:M, propio vs booking
**Decisión:** `events` = entidad propia. N:M con artists vía `event_participations`. Propio vs booking (fee %).
**Qué descartó:** Eventos colgados de un artista (un evento involucra a varios).

### D-070 · Alcance extensible y orden de ejecución
**Decisión:** `service_lines` extensible: servicio nuevo = INSERT, no ALTER. Orden: MGMT → Eventos → AV y futuros.
**Qué descartó:** CHECK cerrado que obliga ALTER por tipo nuevo.

### D-071 · service_types: catálogo de líneas
**Decisión:** Tabla `service_types` con filas (mgmt, av, eventos, +futuros).
**Qué descartó:** Enum o CHECK constraint cerrado.

### D-072 · subservices: catálogo único de subservicios
**Decisión:** Cada subservicio pertenece a UNA línea. AV tiene 4: videoclip, cubrimiento, sesión contenido, sesión fotos.
**Qué descartó:** Subservicios embebidos como JSON o como columnas.

### D-073 · Patrón de dos niveles (línea → N ítems)
**Decisión:** `service_line` → N ÍTEMS de trabajo. Las 3 líneas comparten el patrón. MGMT ya lo implementa (objetivos→deliverables).
**Qué descartó:** Un solo nivel donde línea = ítem.

### D-074 · secondary_tasks ganan artist_id
**Decisión:** Columna `artist_id` aditiva. client_id queda histórico.
**Qué descartó:** Borrar client_id (breaking change innecesario).

### D-075 · artist_links: recursos permanentes del artista
**Decisión:** Tabla con artist_id, label, file_path, source_type, categoría. DISTINTO de deliverables (efímeros).
**Qué descartó:** Meter recursos permanentes como deliverables del mes.
**Estado:** Pendiente de construir con Dashboard del Artista (P1).

### D-076 · Alcance de migración reducido
**Decisión:** Solo Reckless tiene contexto vivo. El modelo arranca esencialmente limpio.
**Qué descartó:** Migración compleja de múltiples clientes activos.

### D-077 · Jared borrado, Chimbita histórico
**Decisión:** MoneyMade/Jared → BORRADO TOTAL por impago. Chimbita → histórico sin línea.
**Qué descartó:** Conservar datos de cliente cancelado.

### D-078 · Reckless migra su trabajo existente
**Decisión:** Conserva y migra reuniones, misiones, objetivos, deliverables al modelo nuevo.
**Qué descartó:** Empezar de cero (perdería trabajo real).

### D-079 · Estrategia de código: COEXISTENCIA
**Decisión:** Funciones viejas (client→engagement) quedan. Lo nuevo (Dashboard del Artista) usa ruta nueva (artist→service_line→engagement). Se reapuntan una por una cuando se tocan.
**Qué descartó:** Reescribir las ~10 funciones de db.js de golpe (over-engineering con 1 artista por cliente).

---

# PARTE 9 — Sistema de agentes directivos (Día 9, D-080 a D-084)

### D-080 · Agentes directivos por dominio
**Decisión:** Cada agente directivo es ESPECIALISTA de su dominio. CTO = decisiones técnicas + deuda. CEO/CFO/COO cada uno su área.
**Qué descartó:** Agente directivo único que conoce todo (difuso, contexto inmanejable). También descartó que el CTO lea estado operativo del negocio.
**Detalle:** Cada directivo se enchufa al corpus de SU dominio. Sin pisar a los demás.

### D-081 · Dos funciones del CTO-dashboard
**Decisión:** (1) Guardián de coherencia: avisa cuando una idea CHOCA con una D-XXX. (2) Auditor periódico: informe mensual de errores, pendientes, mejoras.
**Qué descartó:** CTO "operador" que lee y reporta estado del negocio (redundante con UI y CEO/CFO/COO).
**Detalle:** Función 1 = consulta en vivo (diálogo). Función 2 = job batch (n8n o botón). Se construye primero la Función 1.

### D-082 · Canon único, derivación por lectura
**Decisión:** `BOVEDA/03_PROTOCOLOS/decisions/REGISTRO-DECISIONES.md` es la ÚNICA fuente de verdad. CTO-dashboard (Kimi) y CTO-Engram NO tienen copia propia: leen/derivan de aquí.
**Qué descartó:** Registro paralelo en varios lugares (diverge siempre). DB como canon (invierte la fuente de verdad).
**Detalle:** Imposible divergir porque solo hay un canon y los demás son lectores.

### D-083 · Contexto del CTO = corpus curado fijo
**Decisión:** El registro de decisiones completo se carga entero en el system prompt del CTO (contexto curado fijo).
**Qué descartó:** RAG ligero (sobre-ingeniería: el corpus es chico, homogéneo, crece lento). Híbrido datos-en-vivo + resumen (innecesario dado D-080).
**Detalle:** Revisar si el registro crece al punto de no entrar cómodo en contexto → recién ahí migrar a recuperación selectiva.

### D-084 · El registro lo escribe el CTO-Engram al cerrar cada discusión
**Decisión:** El CTO-Engram, al cerrar una discusión de arquitectura, formatea la D-XXX y la escribe al REGISTRO-DECISIONES.md en el momento. El humano aprueba.
**Qué descartó:** (a) Ritual manual con plantilla (depende de la memoria del humano — causa raíz del problema D-052–D-079 sin registrar). (b) Tabla `decisions` en Supabase (agrega infra, invierte canon D-082).
**Detalle — protocolo:**
1. Numerar consultando el último D-XXX en el archivo, NO de memoria
2. Formato fijo con "qué descartó" OBLIGATORIO
3. Si modifica otra → PISAR la vieja (marcar obsoleta + referenciar nueva)
4. Confirmar al humano qué D-XXX se registró
5. **Regla de oro:** el archivo en disco MANDA sobre la memoria del Engram. Ante conflicto, gana el disco.

---

## Índice rápido por área

| Área | Decisiones |
|------|-----------|
| Fundación / Stack | D-001 a D-005, D-022 a D-025 |
| Agentes / Agent Runner | D-006 a D-021, D-023 a D-024 |
| Clientes / Artistas | D-026 a D-031 |
| Prensa Fase 2 (lotes) | D-032 a D-040, D-052 a D-057, D-065 |
| Meetings v2 | D-041 a D-051 |
| MGMT Detail | D-058, D-059 |
| Feed Architect (cola) | D-060 a D-064 |
| Holding (modelo) | D-066 a D-079 |
| Agentes directivos | D-080 a D-084 |
| Dashboard Artista | D-085, D-086 |
| Proyectos universal | D-087 |
| Snippet Testing | D-089 (OBSOLETA), D-090, D-091 |
| SOP Análisis 360 | D-092 a D-096 |
| Modelo Comercial / Tier | D-097, D-098 |
| Jerarquía organizacional de agentes | D-099 |
| Infraestructura / PaaS (stateless first) | D-100 |
| Ingesta automática de reuniones (Drive → bitácora) | D-101 |
| Revenue por devengo + switch de estado de contrato | D-102 |

---

# PARTE 10 — Dashboard del Artista (Día 10, D-085 a D-087)

### D-085 — Dashboard centrado en Artista reemplaza modelo G*S/MGMT separado

**Contexto.** El frontend tenía 2 workspaces (G*S y MGMT) como productos separados con vistas duplicadas: `clients` (G*S), `mgmt-clients`, `mgmt-overview`, `mgmt-objectives`, `mgmt-client-detail`, `client-360`. El modelo Holding (D-067) ya unificó el backend con artista como entidad de primer nivel, pero el frontend seguía fragmentado.

**Decisión.** Una sola navegación **Sistema / Artistas**. El artista es la entidad de primer nivel. Su dashboard reutiliza `renderMgmtClientDetail()` con tabs por línea de servicio (MGMT activo, AV/Eventos placeholders). Sección "Recursos del Artista" (artist_links D-075) como recursos permanentes que sobreviven entre engagements.

**Qué descartó.**
- Mantener coexistencia G*S/MGMT en frontend (over-engineering con 1 cliente).
- Sistema de tabs desde el arranque (solo MGMT activo, tabs son prematuros).
- Reescribir `renderMgmtClientDetail()` (se reutiliza tal cual, menos riesgo).

**Detalle técnico.**
- **Sidebar:** 2 grupos — Sistema (Métricas, Agentes, Proyectos) + Artistas. Eliminado product switcher.
- **Vista Artistas:** `GET /api/artists` lee de `artists → service_lines → service_types`. Cards con badges de líneas activas.
- **Dashboard Artista:** `GET /api/artist/:slug/dashboard` consolida artist + service_lines + engagement + objectives + missions + links + boveda. Frontend llama a `renderMgmtClientDetail()` con datos adaptados.
- **artist_links (D-075):** tabla en Supabase (`artist_links`: id, artist_id, label, url, file_path, attachment_type, category). CRUD: `GET/POST /api/artist/:slug/links`, `DELETE /api/artist-link/:id`. Categorías: brandbook, guia-tecnica, biolink, auditoria, general.
- **Limpieza:** ~1027 líneas eliminadas. Muertas: `switchProduct()`, `renderClients()`, `renderMgmtClients()`, `renderMgmtOverview()`, `renderMgmtObjectives()`, `openClient360()`, `renderClient360()`. Restauradas: `openOnboardClientModal()` (adaptada a "Nuevo Artista"), `openMdEditor()`, `openInObsidian()`.
- **DT-027 cerrada:** frontend ya no consume `metadata->>service='mgmt'`. Endpoints backend legacy siguen existiendo pero sin consumidor.

### D-086 — Portal público del artista (read-only, Supabase directo)

**Contexto.** El artista necesita ver sus entregables, documentos maestros y misiones asignadas. El dashboard interno (localhost:3737) no se puede exponer.

**Decisión.** HTML standalone (`artist-portal.html`) que lee de Supabase con anon key + RLS. Deploy en Vercel con subdominio por artista (`reckless.growthstars.net`). Read-only, sin auth (slug como acceso implícito).

**Qué descartó.**
- Vista pública en el mismo server (expone endpoints admin).
- Notion embebido (sync compleja).
- Portal con backend propio (over-engineering para read-only).

**Detalle técnico.** Archivo standalone, Supabase JS CDN, queries directas con anon key. RLS policies configuradas para SELECT en: artists, service_lines, service_types, artist_links, secondary_tasks, mgmt_engagements, mgmt_objectives, mgmt_deliverables, clients. Slug obtenido del subdominio o query param `?artist=`. Criterio para revisar: agregar auth cuando ≥3 artistas o cuando el artista necesite escribir.

### D-087 — Projects como registro universal de servicios no-MGMT

**Contexto.** La tabla `projects` solo soportaba lanzamientos con paquetes fijos (CREATOR!/ARTIST!/STAR!). El negocio ejecuta más servicios: videoclips, cubrimientos, bookings, estrategias growth. El modelo de cotización cambió: se cotiza por tier del artista + activaciones vía gs-cotizador, no por paquete fijo.

**Decisión.** Expandir `projects` para ser el registro universal de cualquier servicio no-MGMT. Paquetes fijos OBSOLETOS — el precio sale del gs-cotizador.

**Qué descartó.**
- Crear tabla nueva por tipo de servicio (fragmenta el modelo).
- Mantener paquetes fijos CREATOR!/ARTIST!/STAR! (modelo de negocio evolucionó).

**Detalle técnico.**
- `project_type` CHECK expandido: 'lanzamiento', 'videoclip', 'cubrimiento', 'sesion-contenido', 'sesion-fotos', 'booking', 'estrategia-growth', 'otro'.
- `phase` CHECK expandido: fases originales + 'pre-produccion', 'produccion', 'post-produccion', 'entregado'.
- Columna `artist_id` UUID agregada (FK a artists).
- TUCUTÚ migrado: project_type='lanzamiento', artist_id=jot4r.
- Entregables siguen en BOVEDA como carpetas. Estructura varía por tipo de servicio.

---

# PARTE 11 — Infraestructura Financiera (Día 11, D-088)

### D-088 — Agente CFO y modelo financiero LLC USA + persona natural COL

**Contexto.** G*S factura entre $3K-7K USD/mes a clientes locales e internacionales. Hasta ahora: cuentas de cobro manuales en Canva, facturación como persona natural (Art. 383), emisor rotando entre Ian y Santiago, sin estructura fiscal formal ni tracking de cobros/pagos.

**Decisión.** Crear agente directivo gs-cfo con modelo financiero dual:
- **LLC Wyoming (USA):** entidad internacional, cuenta Mercury, Stripe, 50/50 Ian+Santiago. Costo ~$500/año.
- **Persona natural (COL):** para clientes locales COP, régimen Art. 383. Sin cambios al modelo actual.
- **SAS Colombia:** diferida hasta cumplir ≥2 de 4 criterios (gastos >$3M/mes, ingresos >$100M/año, empleados formales, cliente exige FE).

**Qué descartó.**
- SAS inmediata (costo $8-22M COP/año no justificado al volumen actual).
- Operar solo en Colombia (pierde eficiencia para clientes internacionales).
- LLC en Delaware (Wyoming más barato, misma funcionalidad para LLC extranjera).

**Detalle técnico.**
- Agente: `.claude/agents/gs-cfo.md` (panel: directivo, par del CTO y Growth Hacker).
- Skill: `~/.claude/skills/gs-cfo/SKILL.md` (fuente de verdad canónica).
- Sub-agentes planificados: gs-facturador (Fase 1), gs-tesorero (Fase 2), gs-tributario (Fase 3).
- Flujo de fondos: clientes → LLC Mercury → gastos operativos + distributions a socios.
- Optimización fiscal: gastos desde LLC reducen base gravable en COL.
- Tasa efectiva estimada (50/50, $84K/año): ~7.1% por socio.
- Integración futura: Canva MCP para generación automática de cuentas de cobro.

### D-089 — ~~Modelo de dos tiers por artista (metrics_tier vs access_tier)~~ — OBSOLETA

> **⚠ OBSOLETA — Supersedida por D-097 (2026-07-02).** Se descarta el eje Tier-Acceso. El modelo se queda con un solo tier por artista basado en métricas.

**Fecha:** 2026-06-28
**Contexto.** Al diseñar el sistema de Snippet Testing, se identificó que un artista puede tener métricas bajas pero acceso alto (contactos, eventos, proximidad industria) o viceversa. Tratarlos como un solo eje distorsiona la estrategia de contenido.

**Decisión.** Separar la clasificación del artista en dos ejes independientes:
- **`metrics_tier`**: derivado del audit cuantitativo (Spotify, YouTube, engagement). Es el número duro.
- **`access_tier`**: derivado de red/acceso — con quién trabaja, eventos, proximidad a la industria. Es el capital relacional.

**Regla operativa:**
- Si `access > metrics` → estrategia **documentación-led** (capturar momentos > crear contenido manufacturado).
- Si `access ≈ metrics` (ambos bajos) → estrategia **concepto manufacturado** (crear desde cero).

**Qué descartó.** Un solo tier unificado que mezclaba métricas con acceso.

> **Nota posteridad:** La regla operativa de documentación-led vs concepto manufacturado sigue siendo válida como heurística de contenido, pero ya no se formaliza como eje de clasificación del artista. Ver D-097.

### D-090 — El funnel vive en el snippet, no en el formato

**Fecha:** 2026-06-28
**Contexto.** Al diseñar el catálogo de formatos para Snippet Testing, la tentación era etiquetar cada formato con TOFU/MOFU/BOFU. Pero el mismo formato (ej: "behind the scenes") puede ser TOFU en un contexto y MOFU en otro, dependiendo de la intención y el CTA.

**Decisión.** `funnel = f(intención de la idea, CTA, etapa del artista)`. El formato es funnel-agnóstico. El catálogo de formatos NO lleva campo funnel. La clasificación funnel se asigna en el **snippet** al momento del test, no en el formato.

**Qué descartó.** Catálogo de formatos con campo funnel fijo por formato.

### D-091 — Catálogo de formatos = activo de sistema, global y vivo

**Fecha:** 2026-06-28
**Contexto.** Los formatos de contenido (behind the scenes, reaction, storytime, etc.) son reutilizables entre artistas. Pero los formatos decaen: lo que era innovador en 2024 puede estar saturado en 2026.

**Decisión.** El catálogo de formatos es un activo GLOBAL del sistema G*S (no per-artist) con campo `vigencia` que refleja el ciclo de vida del formato:
- `emergente` → formato nuevo, bajo riesgo de saturación
- `vigente` → formato activo, funciona bien
- `saturado` → formato sobreusado, rendimientos decrecientes
- `muerto` → formato obsoleto, no usar

La activación/estado por artista vive en una capa per-artist separada (no en el catálogo global).

**Qué descartó.** Catálogo per-artist (duplicación) o catálogo sin vigencia (no refleja decaimiento natural de formatos).

---

# PARTE 12 — SOP Análisis 360 y Capa de Auditoría (D-092 a D-096)

### D-092 — Auditor de Mercado separado del Auditor Musical

**Fecha:** 2026-06-30
**Contexto.** Al diseñar el pipeline de Análisis 360, se evaluó si el análisis de mercado/competencia debía vivir dentro del Auditor Musical o en un agente separado.

**Decisión.** Agentes separados. Musical mira al artista propio (S4A, distribuidora, Soundcharts — filas del artista); Mercado mira el entorno (competencia, nicho, demanda — filas de otros). Mezclarlos produce mandato confuso y trabajo duplicado. Misma fuente (Soundcharts), objetos distintos.

**Qué descartó.** Un solo auditor que mezcle artista propio + competencia (mandato ambiguo, output difícil de consumir).

### D-093 — Auditor de Mercado es fase 2, dependiente del Perfilador (no paralelo)

**Fecha:** 2026-06-30
**Contexto.** En el pipeline de Análisis 360, tres agentes (Auditor Redes, Auditor Musical, Perfilador) corren en paralelo en Fase 1. Se evaluó si el Auditor de Mercado podía correr en paralelo también.

**Decisión.** No. El Auditor de Mercado corre en Fase 2, DESPUÉS del Perfilador. Razón: un auditor de entorno no puede definir qué recorte del mercado estudiar sin saber quién es el artista. Sin perfil, estudiaría un nicho al azar. El perfil define los bordes del "afuera". Handoff: `hipotesis_nicho` + `adyacencias_a_barrer`.

**Qué descartó.** Ejecución paralela de todos los agentes (el Auditor de Mercado necesita scope del Perfilador).

### D-094 — El Perfilador entrega el punto único como HIPÓTESIS NO VALIDADA

**Fecha:** 2026-06-30
**Contexto.** El Perfilador extrae un "punto único" (diferencial del artista) de la transcripción cualitativa. Se debatió si el Perfilador debe validar su propia hipótesis.

**Decisión.** No. El sello ✅/⚠️/❌ lo pone el Sintetizador tras cruzar con los auditores (data cuantitativa). El Perfilador no valida lo suyo porque no toca data. Etiqueta explícita: `HIPÓTESIS NO VALIDADA`.

**Qué descartó.** Auto-validación del Perfilador (no tiene acceso a data para confirmar/negar).

### D-095 — El perfil de cliente real es output del Sintetizador, no de un auditor

**Fecha:** 2026-06-30
**Contexto.** El "perfil de cliente real" (quién es el oyente accionable) requiere cruzar múltiples fuentes. Se evaluó dónde producirlo.

**Decisión.** El Sintetizador. Nace del cruce: audiencia REAL (auditores) vs. audiencia DESEADA (Perfilador) vs. norma del nicho (Auditor Mercado). Ningún agente lo produce solo.

**Regla de los 4 ángulos de audiencia:**
| Ángulo | Quién lo produce | Qué responde |
|---|---|---|
| Audiencia real | Auditor Musical/Redes | ¿Quién lo escucha hoy? |
| Audiencia deseada | Perfilador | ¿A quién quiere hablarle? |
| Norma del nicho | Auditor Mercado | ¿A quién atrae la competencia? |
| Perfil de cliente real | Sintetizador (cruce) | Retrato accionable |

**Qué descartó.** Asignarlo al Auditor de Mercado ("porque es audiencia" — error: el tema es uno, las operaciones son cuatro).

### D-096 — SOP Análisis 360: orquestación por fases con separación de responsabilidades

**Fecha:** 2026-06-30
**Contexto.** Se diseñó el SOP completo del Análisis 360 que integra todos los agentes de auditoría + perfilamiento + síntesis.

**Decisión.** Pipeline de 4 fases con dependencia de datos:
```
Fase 0: Onboarding (reunión → transcripción del notetaker)
Fase 1: Recolección autónoma en paralelo (Auditor Redes + Auditor Musical + Perfilador)
Fase 2: Recolección dependiente (Auditor Mercado, disparado por output del Perfilador)
Fase 3: Síntesis (Sintetizador recibe los 4 outputs → veredicto + brandbook)
```

**Invariantes (no negociables):**
1. Los auditores recolectan hechos. No juzgan.
2. El Perfilador es cualitativo puro. No toca números. Cita evidencia textual.
3. Solo el Sintetizador cruza y dictamina (vacío, defendibilidad, gaps, veredicto).
4. El Perfilador orienta pero no encarcela al Auditor de Mercado (mandato anti-eco).

**Entregables finales:** 3 inputs (escáner algorítmico, análisis de entorno, perfil de identidad) → fundidos por Sintetizador en veredicto estratégico + brandbook.

**Qué descartó.** Ordenar todos los agentes igual (la capa NO es simétrica). Pipeline secuencial completo (3 agentes pueden correr en paralelo).

---

# PARTE 13 — Modelo Comercial y Tier Unificado (2026-07-02, D-097 a D-098)

### D-097 — Descarte del eje Tier-Acceso: un solo tier por artista (métricas)

**Fecha:** 2026-07-02
**Contexto.** En sesión COO se evaluó introducir un segundo eje de segmentación, "Tier-Acceso" (nivel de entorno/contactos/recursos del artista), separado del "Tier-Artista" (métricas). Caso disparador: Reckless — Tier 1 en métricas (~30 oyentes/mes, ecosistema por reconstruir) pero con acceso a entorno de artistas posicionados (NY, productor de DeiV, shows internacionales previos). D-089 formalizaba ese modelo dual.

**Decisión.** Se DESCARTA el eje Tier-Acceso. Un artista con buen entorno pero métricas T1 enfrenta los mismos retos operativos que cualquier T1. El acceso es un activo del artista, no un eje que cambie el dolor, el producto ni la calibración de palancas. El modelo se queda con un solo tier por artista (métricas, regla del más bajo entre plataformas).

**Qué descartó.** Modelo dual metrics_tier + access_tier (D-089, ahora OBSOLETA).

**Supersede:** D-089.

**Criterio para revisar:** si aparecen ≥3 artistas donde el entorno cambie materialmente el producto entregado (no solo el discurso de venta), se reabre la discusión.

### D-098 — Nomenclatura comercial por tier (Matriz Tier-Dolor-Lenguaje)

**Fecha:** 2026-07-02
**Contexto.** El motor interno de G*S son 3 líneas de servicio fijas (MGMT / Productora AV / Eventos) que aplican a todos los tiers. Sin embargo, el lenguaje comercial que ve el cliente debe variar por tier: un artista emergente (T1/T2) no entiende ni necesita escuchar "growth hacking" — ese término solo aparece en T3/T4 donde el artista ya tiene tracción y busca escalar.

**Decisión.** El nombre comercial que ve el cliente varía por tier según la Matriz Tier-Dolor-Lenguaje:
- **T1 (Emergente)** y **T2 (En Desarrollo)**: lenguaje de "acompañamiento", "desarrollo artístico", "producción". Nunca "growth hacking".
- **T3 (En Crecimiento)** y **T4 (Consolidado)**: lenguaje de "growth", "estrategia de escalamiento", "growth hacking". El artista ya entiende el juego.

**Qué descartó.** Nombre comercial único para todos los tiers (generaba rechazo o confusión en T1/T2).

**Detalle.** La Matriz Tier-Dolor-Lenguaje es un documento vivo bajo `03_PROTOCOLOS/comercial/Matriz-Tier-Dolor-Lenguaje-v1.md` que define: dolor principal por tier, lenguaje de venta, objeciones frecuentes, y caso de uso. El contenido comercial fino (copy, objeciones, casos) es responsabilidad del COO, no del CTO.

**Criterio para revisar:** cuando el pipeline tenga ≥2 artistas por tier y se pueda validar si el lenguaje diferenciado convierte mejor que uno genérico.

# PARTE 14 — Jerarquía organizacional de agentes (2026-07-05, D-099)

### D-099 — Jerarquía de agentes en 2 bloques y 6 cajas (organigrama G*S)

**Fecha:** 2026-07-05
**Contexto.** El sistema de agentes creció a 14+ agentes sin una jerarquía organizacional formal. El dashboard ya los agrupa visualmente, pero faltaba la definición canónica de roles, fronteras entre capas y flujo de contexto. Complementa D-006 (arquitectura de agentes) y D-080 a D-084 (agentes directivos).

**Decisión.** La jerarquía de agentes G*S se organiza en 2 bloques y 6 cajas:

**BLOQUE 1 — AGENTES DE DIRECCIÓN** (corazón de G*S: decisiones infraestructurales e ideológicas)
1. **DIRECTIVOS** — dirigen agentes junior por área (CTO, CFO, Growth Hacker). Deciden el CÓMO se construye.
2. **MAESTROS** — almacenan y sirven contexto de áreas específicas (Bibliotecario de Skills, Bibliotecario de Artistas). Memoria viva por área.
3. **ÓRGANOS DE CONTROL** — puente bidireccional de contexto entre dirección y operación: destilan estado operativo hacia arriba (operativo → directivo) y traducen decisiones directivas hacia abajo (directivo → operativo). Supervisan a los Jefes de Área. *(Pendiente de construir; roles ya definidos.)*

**BLOQUE 2 — AGENTES OPERATIVOS** (cerebro operativo: decisiones técnicas y profesionales)

*Backend (producción de conocimiento):*
4. **OPERATIVOS** — agentes profesionales de área (auditores, sintetizador, estrategia, etc.).
5. **SOPORTE** — análisis y tareas paralelas que alimentan a los operativos (ej.: COO de análisis psicológico/aspiracional del artista). *(Pendiente de construir.)*

*Frontend (entrega):*
6. **DOCUMENTACIÓN** — formatos, presentaciones, estructuras visuales. Puente entre el backend y el contexto final (cliente) o de proceso (interno).
7. **JEFES DE ÁREA** — vigilan progresos y promueven cambios estructurales de los agentes operativos de su área. Reportan a los Órganos de Control. *(Pendiente de construir.)*

**Flujo de contexto:** DIRECTIVOS ↔ ÓRGANOS DE CONTROL ↔ JEFES DE ÁREA → OPERATIVOS/SOPORTE → DOCUMENTACIÓN → cliente.

**Restricción técnica (obligatoria al construir las cajas pendientes).** La cadena Directivo → Control → Jefe de Área → Operativo tiene 3+ saltos de delegación. Para evitar degradación de contexto por salto, cada capa se comunica con la siguiente vía **formato fijo** (metadata estructurada en Supabase per D-002), nunca prosa libre. Los contratos de formato se diseñan cuando se programe cada caja, no antes.

**Nota D-001.** Cuando las cajas pendientes se llenen, este flujo cumple el criterio 3 de D-001 (≥3 agentes con cadenas de delegación >3 saltos) — en ese momento se revisa si n8n + Claude Code siguen bastando como orquestación o se evalúa orquestador dedicado. Los /loops de Claude Code (charters con ciclo encontrar→hacer→revisarse→recordar→repetir) son la primera opción de orquestación para Órganos de Control y Jefes de Área antes de considerar herramienta nueva.

**Qué descartó.** (a) Construir las cajas vacías por completitud del organigrama — cada agente nuevo se construye cuando resuelva un dolor actual (filosofía #3). (b) Órganos de Control como auditores de runs individuales — ese rol quedó descartado; son puente de contexto, no QA por run.

**Criterio para revisar:** cuando Órganos de Control y Jefes de Área estén operando, validar que la separación de responsabilidades (Control = puente de contexto; Jefes = vigilancia de proceso operativo) no genere solapamiento en la práctica.

---

# PARTE 15 — Infraestructura y despliegue (2026-07-15, D-100)

### D-100 — "stateless first" para nuevos módulos y servicios

**Fecha:** 2026-07-15
**Contexto.** Ian preguntó si Railway podía ayudar al stack. El dashboard actual depende del filesystem local de BOVEDA (`06_CLIENTES/`, `.claude/agents/`), por lo que subirlo a un PaaS rompería el acceso a los archivos a menos que se reestructure el sistema. Al mismo tiempo, hay servicios futuros (webhooks, agent runner, bridges de inteligencia externa) que sí podrían beneficiarse de un PaaS.

**Decisión.** Los **nuevos módulos y servicios** de G*S se diseñan "stateless first": no dependen del filesystem local de BOVEDA. Su input/output viene de Supabase, variables de entorno o APIs externas. Esto permite desplegarlos en Railway, Render o cualquier PaaS sin reescritura cuando el volumen o el acceso remoto lo justifiquen.

**Qué descartó.** (a) Migrar el dashboard actual a Railway — lee/escribe archivos locales y no cruza el umbral de costo/beneficio de SaaS. (b) Diseñar nuevos módulos asumiendo filesystem local — cerraría la puerta al PaaS y forzaría una refactor costosa después.

**Detalle.**
- El dashboard actual sigue corriendo localmente. Su dependencia con BOVEDA es conocida y aceptada.
- Los nuevos servicios (ej.: agent runner stateless, bridge de Antigravity, webhooks) reciben y devuelven datos via Supabase o HTTP.
- Las variables de entorno sensibles (connection strings, API keys) viven en `.env` y nunca en código versionado.
- Esta decisión no cambia D-003 (Supabase como BD operacional) ni D-004 (sin UI custom hasta validar); las complementa.

**Criterio para revisar:** cuando un nuevo módulo necesite estar disponible 24/7, ser accesible desde múltiples dispositivos, o escalar más allá de la laptop de Ian, se evalúa su despliegue en Railway/u otro PaaS sin reescribirlo.

---

# PARTE 16 — Ingesta de reuniones (2026-07-15, D-101)

### D-101 — La ingesta de reuniones se automatiza: Drive es la puerta, la bitácora es el destino

**Fecha:** 2026-07-15
**Contexto.** Las transcripciones de reuniones (Notas de Gemini) caen como `.docx` en Google Drive. Hoy Ian las trae a mano: entra a Drive, descarga, convierte a `.md` y las sube a la bitácora del artista. Es un paso manual por reunión y ya se rompió: al 2026-07-15 lleva **varios días sin registrar reuniones de Chimbita Records y Marlon**. El costo no es el tiempo del upload — es que **las reuniones no registradas no existen** para el cierre de mes, que es archive-first (se genera desde los `.md` de la BÓVEDA, no desde la BD). Un mes sin bitácoras produce un informe incompleto y silencioso.

**Decisión.** La ingesta de reuniones **se automatiza**. Ian deja de ser el transporte entre Drive y la BÓVEDA. El pipeline es: **Drive (`.docx`) → conversión a `.md` → bitácora del artista (`06_CLIENTES/<artista>/mgmt/meetings/`)**, sin intervención manual. Ian solo interviene si el ruteo es ambiguo.

**Qué descartó.** (a) Seguir manual y "ser más disciplinado" — ya se demostró que falla, y falla en silencio. (b) Subir por el dashboard como paso obligatorio — mueve el trabajo manual de lugar, no lo elimina. (c) Un LLM que decida de qué artista es cada reunión — inventa ruteos; el ruteo se resuelve por convención de nombre/carpeta, y lo ambiguo se encola para que Ian lo decida, nunca se adivina.

**Detalle.**
- **Fuente:** carpeta vigilada en Drive. **Destino:** `06_CLIENTES/<artista>/mgmt/meetings/` con la convención de nombre vigente (`empalme-meta-N` / `entrega-meta-N`).
- **Ruteo por convención, no por adivinanza.** Se resuelve por carpeta o prefijo de archivo. Si el artista no se resuelve, el archivo va a una bandeja de pendientes y **se avisa** — nunca se archiva al azar (mismo principio que la D- de cobros: alertar, no adivinar).
- **Idempotencia:** un `.docx` ya procesado no se reprocesa ni duplica la bitácora.
- **El `.md` en la BÓVEDA es la fuente de verdad** de la reunión, consistente con el cierre archive-first del SOP-CIERRE-DE-MES.
- La limpieza de la transcripción sigue siendo trabajo del `gs-limpiador-input`; este pipeline solo transporta y archiva.
- **Ejecución:** DT-040 (elevada de *Diferida* a **Alta** por esta decisión). El backlog inmediato de Chimbita y Marlon se sube a mano una sola vez; la automatización evita el próximo atraso, no cura este.

**Criterio para revisar:** si el ruteo automático manda reuniones a la carpeta equivocada más de una vez, se corta el auto-archivado y todo pasa por bandeja de pendientes con confirmación de Ian.

---

# PARTE 17 — Revenue por devengo (2026-07-15, D-102)

### D-102 — El revenue se cuenta por DEVENGO (contrato firmado), no por caja

**Fecha:** 2026-07-15 · **Estado:** APROBADA por Ian — **implementación pendiente (próxima sesión)**

**Contexto.** La card "REVENUE TOTAL" mostraba el acumulado de vida (`computeRevenueLifetime`, db.js:1834): todas las `cuentas_cobro` pagadas sin filtrar mes. Ian la leyó como plata del mes y objetó. Peor: mostraba `$2.947 USD` y `$10.1M COP` en dos columnas paralelas como si fueran monedas sumables, cuando son **la misma plata normalizada dos veces** (`total_cop = cop + usd*trm`, línea 1845) — el error que DT-057 ya había atrapado en el historial y que en el hero seguía vivo. Al mismo tiempo, "REVENUE MES" daba $0 en julio (cash-basis: nadie pagó todavía), lo cual era contablemente correcto pero operativamente inútil: había 5.2M COP firmados y sin cobrar que el dashboard no mostraba en ningún lado.

**Decisión.** El revenue del mes se cuenta por **devengo**: un contrato suma al mes en que ENTRA, esté pagado o no. Solo se excluye si el contrato **se cae** (estado `Anulada`, que Ian avisa explícitamente). Se **elimina** la card de revenue total de vida.

**Qué descartó.** (a) Seguir en cash-basis puro — invisibiliza el negocio firmado. (b) Contar desde `projects.package_price` — duplicaría el revenue (el Videoclip Henessy vale 3M en `projects` **y** 3M en `cuentas_cobro`: contarlos juntos da 6M). Se mantiene la regla vigente: **el revenue sale SIEMPRE de `cuentas_cobro`, nunca de `package_price`**. (c) Reemplazar caja por devengo sin más — el dashboard diría que hay plata que no entró.

**Implementación (próxima sesión).**
1. **Revenue del mes = `cuentas_cobro` con estado `Pendiente` + `Abonado` + `Pagada`**, excluyendo `Anulada`. Sin tocar `projects`, sin fuente nueva, sin duplicar. Efecto esperado: julio pasa de $0 a **1.200 USD + 4M COP**.
2. **Nueva métrica "Por cobrar"** = solo lo no pagado. Es la contracara obligatoria del devengo: sin ella el dashboard miente sobre la caja. Sale de los mismos datos, costo cero.
3. **Eliminar** la card REVENUE TOTAL + `computeRevenueLifetime()` + sus llamadas (código muerto no se deja). El acumulado histórico sigue siendo derivable del HISTORIAL mes a mes.
4. **Denominación:** donde se muestre plata convertida, se lee `$X COP (≈ $Y USD)` — nunca dos columnas paralelas. Los montos crudos por moneda viven en `by_line`.
5. **Estado del contrato:** 4 estados — `Pendiente` / `Abonado` / `Pagada` / `Anulada`. **Sin montos parciales**: el revenue cuenta SIEMPRE el total del contrato; "Abonado" es etiqueta informativa. Costo aceptado: "Por cobrar" muestra el total aunque haya abono parcial. Si se necesita el saldo exacto, se agrega `monto_abonado` **después** (implica teclear la cifra en cada abono — fricción que hoy no se justifica).
6. **Switch de estado en la vista interna del contrato** + estado visible como info adicional en la vista reducida.

**🚨 Restricción no negociable del switch.** El estado de pago vive en el `.md` (`08_OPERACIONES/consecutivos-cuentas-cobro.md`), que es la **fuente de verdad** (DT-056). **El switch escribe en el `.md` y luego sincroniza** — el server ya tiene acceso al filesystem de BOVEDA y el parser ya existe en `syncCuentasCobro`. Si el switch escribiera solo en la tabla, **el próximo sync lo pisaría y el estado volvería atrás en silencio**: es exactamente el error del slug del fantasma de Marlon (DT-052), donde renombrar solo la tabla habría sido revertido por el sync. Un switch que el sync deshace es peor que no tener switch.

**Por qué Ian no avisa cada pago.** El switch existe para que Ian NO sea el transporte: aprieta → el server escribe el `.md` → sincroniza. El CTO no interviene. Si el CTO tuviera que editar el `.md` en cada pago, sería el mismo cuello de botella humano que D-101 elimina para las reuniones. **Ian solo avisa lo excepcional: el contrato caído (`Anulada`).**

**Riesgo asumido.** El devengo muestra plata firmada que todavía no entró (hoy: 5.2M COP de julio). Con 4 clientes y Ian controlando cada peso, es manejable. **Criterio para revisar:** al pasar de ~10 clientes o si aparece un cliente que se atrasa en pagos, la card "Por cobrar" deja de ser informativa y pasa a necesitar antigüedad de saldos (aging) y alertas de vencimiento — ver DT-029.

---

# ANEXO A — Protocolo de Hand-off entre Agentes

> Detalle técnico operativo de D-006 (arquitectura de agentes) y del pipeline general.
> Define CÓMO los agentes se pasan trabajo entre sí.

## Modelo: máquina de estados sobre Postgres

```
[Trigger] → [Agent A run: pending → running → complete]
              ↓ (escribe handoff_to + handoff_payload)
[n8n detecta status=complete con handoff_to]
              ↓ (crea nuevo run para Agent B)
[Agent B run: pending → running → complete]
```

Postgres = fuente de verdad del estado. n8n = observador que conecta estados con acciones. Claude Code = ejecuta la lógica.

## Contratos input/output

Cada agente declara `contract.md` con input_schema y output_schema (JSON Schema). Sin contrato, cuando falle la cadena no se sabe si fue el productor o el consumidor. Con contrato, se valida en cada hand-off.

## Estados de run

| Estado | Significado | Transiciones |
|---|---|---|
| `pending` | Esperando worker | → running, → cancelled |
| `running` | Ejecutando | → complete, → failed |
| `complete` | Exitoso con output válido | Terminal (dispara handoff si aplica) |
| `failed` | Falló | Terminal (requiere intervención) |
| `cancelled` | Cancelado antes de ejecutar | Terminal |

**Reglas:** run terminal = inmutable. Para reintentar → run nuevo con `parent_run_id`. `running→complete` requiere output válido vs output_schema. `running→failed` requiere escribir error.

## Trigger del hand-off

**Opción A (Fase 1, recomendada):** n8n polling cada minuto — busca runs `complete` con `handoff_to` no procesado.
**Opción B (Fase 2):** Postgres LISTEN/NOTIFY — trigger SQL emite NOTIFY al completar, n8n escucha. Cero polling.

## Idempotencia

```sql
CREATE UNIQUE INDEX uq_runs_parent_agent ON runs(parent_run_id, agent_id)
WHERE parent_run_id IS NOT NULL;
```

Si n8n intenta crear el mismo hand-off dos veces, Postgres rechaza el segundo.

## Manejo de errores

No retries automáticos al inicio (esconden bugs). Ian decide: retry manual, skip, o fix & retry. Retries automáticos para errores transitorios cuando G*S esté maduro.

## Workflows n8n necesarios

1. **Trigger inicial:** Notion webhook → crear run pending para primer agente
2. **Hand-off poller:** cada minuto, busca runs complete con handoff_to → crea run pending para destino
3. **Cierre:** cada 5 min, busca runs complete con handoff_to=null → actualiza Notion con deliverable

## Anti-patrones

- NO hand-off por API directa entre agentes (pierde trazabilidad)
- NO estado en memoria del agente (si muere, pierde todo)
- NO mezclar output y handoff_payload (output = completo; payload = subset compacto para el siguiente)
- NO lógica de negocio en n8n (n8n es plomero, la lógica vive en agentes)
- NO escribir a Notion desde cada agente (solo el último o un workflow dedicado)

## Evolución

- v1.0: secuencial lineal, polling, sin retries auto
- v1.5: fan-out (1→N en paralelo)
- v2.0: fan-in (N→1 con sincronización)
- v2.5: branching condicional
- v3.0: orquestador dedicado si criterios D-001 se cumplen

---

# ANEXO B — Prompts del Pipeline de Prensa (Fase 2)

> Detalle técnico de D-032 a D-039. Prompts versionados que viven en código en `agent-dashboard/lib/pressBatch.js`.
> Esta copia es referencia. Última validación: 2026-06-10.

## ARCO_SYSTEM (Modo A — objetivo libre, D-032/D-034)

```
Eres el estratega narrativo de gs-redactor-prensa.
Tu trabajo NO es escribir notas: es diseñar el ARCO NARRATIVO de una campaña
de prensa estilo farándula urbana (tono chisme IG, conciso) que construya
una percepción pública específica del artista.

REGLAS:
- Usa SIEMPRE el nombre artístico. JAMÁS nombres reales o legales.
- NUNCA menciones el sello, inversor ni ecosistema de management
  ni jerga de negocio. El arco construye percepción del ARTISTA, no del negocio.
- Los beats deben HILAR una sola línea narrativa con progresión
  (intriga -> desarrollo -> clímax), no notas sueltas.
- Cada ángulo debe ser publicable como chisme de farándula creíble,
  sin inventar hechos verificables falsos.
- Respondé ÚNICAMENTE con JSON válido, sin markdown, sin backticks.

FORMATO: {"premisa":"...","percepcion_objetivo":"...","beats":[{"index":1,"titular":"...","angulo":"..."}]}
```

## PARSE_SYSTEM (Modo B — plan dirigido, D-036/D-039)

```
Eres el estructurador de campañas de prensa de gs-redactor-prensa.
El usuario te entrega un PLAN DE CAMPAÑA pensado por él. Tu trabajo NO es
escribir notas ni pulir titulares: es ESTRUCTURAR fielmente su plan en beats JSON.

CONCEPTO CLAVE: las ideas de notas son INTENCIONES, no titulares finales.
Capturá la intención; el titular final lo redactará otro agente después.

REGLAS:
- NO inventes beats que el usuario no escribió. Respetá su cantidad exacta.
- NO inventes cifras, fechas ni datos. Si hay dato sin valor concreto,
  dejá datos_duros en "" — NO inventes el número.
- Conservá la FASE y FECHA del usuario.
- Nombre artístico SIEMPRE. NUNCA sello/inversor/management.

CAMPOS: index, fase, fecha, intencion, angulo, nota_contexto, datos_duros
FORMATO: {"premisa":"...","percepcion_objetivo":"...","beats":[...]}
```

## Validación (2026-06-10)

| Modo | Test | Resultado |
|------|------|-----------|
| Modo A (generateArco) | 5 corridas Jared La J | 0 retries JSON, ~13K tokens, 62-95s. Post D-034: sin sello en beats |
| Modo B (parseArco) | 1 corrida Javier Ferreira (10 beats) | 0 retries, 10.1K tokens, 93s. Respeta fases/fechas |
| generateNota (Modo B) | Beat 2 Javier Ferreira | 64s, 9.4K tokens. Titular farándula propio, dato "+1M" usado sin inventar |
