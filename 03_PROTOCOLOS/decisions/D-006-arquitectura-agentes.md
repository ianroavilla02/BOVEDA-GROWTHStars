# D-006: Arquitectura de Agentes G*S — Fuente de Verdad

**Fecha:** 2026-05-12
**Estado:** Aprobada
**Autor:** Ian Villaveces + G*S-CTO
**Tipo:** Decisión Arquitectónica Mayor

---

## Contexto

Hasta esta fecha, los agentes G*S se han creado de forma orgánica en
múltiples ubicaciones sin una fuente de verdad clara. Coexisten 3
mecanismos paralelos:

1. **Skills** en `~/.claude/skills/<slug>/SKILL.md` (2 agentes hoy)
2. **Sub-agentes** en `~/.claude/agents/<slug>.md` (1 agente G*S + 8 SDD)
3. **Memoria de sesiones** en `~/.claude/projects/.../memory/` (10 agentes)

El dashboard en `~/agent-dashboard/` lee de la opción 3, que es memoria
contextual de Claude Code, no definiciones canónicas. Esto crea
fragilidad: las definiciones dependen de un directorio interno de
Claude Code que Anthropic puede cambiar sin aviso.

Además existen duplicados (PROD-VFX está en `agents/` y `memory/`) y
drift entre prompts del vault y memoria de sesiones.

## Decisión

Adoptamos arquitectura de 3 capas con responsabilidades separadas:

### Capa 1 — Skills (capacidades técnicas reusables)

**Ubicación:** `~/.claude/skills/<slug>/SKILL.md`
**Propósito:** Bloques de capacidad técnica invocables por agentes.
Granularidad fina, reusables entre agentes.
**Versionado:** Global, en home directory (no en repo de proyecto).
**Ejemplos:** `gs-scrape-instagram`, `gs-calculate-roi`,
`gs-bibliotecario-skills`.

### Capa 2 — Agentes (roles operativos)

**Ubicación:** `<proyecto>/.claude/agents/<slug>.md`
**Propósito:** Roles operativos invocables con `/agent <slug>`. Cada
agente tiene system prompt definido, conjunto de skills permitidas,
y rol específico de pipeline G*S.
**Versionado:** Git, con el repo de cada marca.
**Para G*S:** `BOVEDA/.claude/agents/`
**Para Ian Villaveces B2B (futuro):** `IAN-VILLAVECES/.claude/agents/`

### Capa 3 — Memoria (contexto histórico)

**Ubicación:** `~/.claude/projects/<workspace>/memory/`
**Propósito:** Memoria contextual de Claude Code entre sesiones.
Gestionada automáticamente por Claude Code.
**Versionado:** No se versiona, no se toca manualmente.

## Convenciones

### Naming
- Todos los agentes G*S llevan prefijo `gs-`.
- Naming en kebab-case (`gs-auditor-redes`, no `gs_auditor_redes`).
- Sin abreviaciones crípticas.

### Frontmatter YAML obligatorio

```yaml
---
slug: gs-auditor-redes
name: G*S-Auditor de Redes Sociales
version: 1.0
panel: operativo              # directivo | maestro | organos | operativo
group: backend                # backend | frontend (solo operativos)
subgroup: sop                 # sop | soporte | documentacion | jefes
workspace: growth             # growth | contenido
role: Auditor de presencia digital
description: |
  Descripción extendida del propósito del agente.
model: inherit
tools: [Read, Write, Bash, WebFetch]
skills: [gs-scrape-instagram, gs-scrape-tiktok]
handoff_to: gs-sintesis-growth
depends_on: []
created: 2026-05-12
updated: 2026-05-12
status: active                # active | deprecated | experimental
---
```

## Consecuencias

1. **Dashboard refactor:** lee de Capa 2 (canónica), no Capa 3.
2. **Migración de agentes:** los 10 archivos en `memory/` se canonizan
   como sub-agentes formales en `BOVEDA/.claude/agents/`.
3. **Reconciliación de duplicados:** PROD-VFX en `agents/` y `memory/`
   se fusionan en un único archivo canónico.
4. **Deliverables de cliente:** se versionan en `06_CLIENTES/<cliente>/`
   del repo de la marca correspondiente.
5. **Vault `02_AGENTES/`:** los prompts existentes se convierten en
   fuente de información para crear los sub-agentes canónicos, pero
   dejan de ser fuente de verdad operativa.

## Plan de ejecución

- **Sesión A (hoy):** Foundation — crear D-006, estructura
  `.claude/agents/`, migrar JOT4 a `06_CLIENTES/`.
- **Sesión B (hoy):** Migrar 11 agentes G*S a sub-agentes canónicos.
- **Sesión C (próxima):** Refactor dashboard para leer fuentes correctas.
- **Sesión D (próxima):** Cleanup, deprecación de duplicados,
  actualización de MEMORY.md.

## Criterio para revisar

Esta decisión se revisará si:
1. Anthropic cambia la convención oficial de sub-agentes.
2. Aparece necesidad real de agentes dinámicos generados en runtime.
3. La cantidad de agentes en un proyecto excede 30 y la organización
   por carpeta plana se vuelve insuficiente (entonces evaluamos
   subcarpetas por panel).

## Referencias

- D-001: No adoptar orquestador dedicado en esta fase
- D-002: Postgres como tabla de estado central
- D-003: Supabase como BD operacional
- D-004: Frontend custom es Fase 3
- D-005: Sub-agentes en proyecto (precursor de D-006)
- DT-001: Reconciliar nomenclatura agentes (resuelto por D-006)
- DT-002: Crear Agente #5 - Cotización (pendiente para Sesión B)
