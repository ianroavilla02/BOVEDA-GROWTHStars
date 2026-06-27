# Registro de Decisiones Arquitectónicas — G*S / SANCORT

> Canon único de decisiones (D-082). Este archivo es la ÚNICA fuente de verdad.
> El CTO-Engram registra nuevas decisiones aquí al cerrar cada discusión (D-084).
> Última actualización: 2026-06-26 · Última decisión: D-085

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
| Dashboard Artista | D-085 |

---

# PARTE 10 — Dashboard del Artista (Día 10, D-085)

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
