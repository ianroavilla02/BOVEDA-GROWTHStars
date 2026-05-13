# D-006 v2: Arquitectura de Agentes G*S — 5 capas

**Fecha:** 2026-05-12
**Estado:** Aprobada — supersedes D-006 v1
**Autor:** Ian Villaveces + G*S-CTO
**Tipo:** Decisión Arquitectónica Mayor

---

## Contexto

D-006 v1 asumía arquitectura de 3 capas (Skills + Agentes + Memory).
Durante Sesión B, Ian reveló que el stack real tiene 5 capas operativas:

1. Skills auto-creadas por agentes
2. Engram (memoria persistente nativa)
3. Obsidian Vault (BD de conocimiento operativa)
4. Memory de Claude Code (contexto de sesiones)
5. Sub-agentes invocables (capa D-006)

D-006 v2 amplía el frontmatter estándar para reflejar las 5 capas
y asignar permisos granulares por agente.

## Decisión

### Capas reconocidas

| # | Capa | Propósito | Ubicación |
|---|---|---|---|
| 1 | Skills | Capacidades reusables, auto-creables por agentes | ~/.claude/skills/ |
| 2 | Engram | Memoria persistente con namespace por agente+cliente | (sistema externo) |
| 3 | Obsidian Vault | BD operativa de conocimiento G*S | BOVEDA/ |
| 4 | Memory CC | Contexto de sesiones (gestionado por Claude Code) | ~/.claude/projects/ |
| 5 | Sub-agentes | Roles operativos invocables con /agent | <proyecto>/.claude/agents/ |

### Frontmatter estándar D-006 v2

Cada agente declara explícitamente sus permisos:

```yaml
---
# Identidad
slug, name, version, panel, group, subgroup, workspace

# Rol
role, description, model, tools

# Capacidades
skills_used: []                     # skills que invoca
can_create_skills: true|false       # permiso de auto-creación
skill_scope: [tags]                 # dominios permitidos para creación

# Vault Access (Capa 3)
vault_read: [paths]                 # paths que puede leer
vault_write: [paths]                # paths que puede escribir
                                    # <current> = cliente activo

# Engram (Capa 2)
engram_namespace: "<slug>/<client>" # namespace compuesto

# Pipeline
handoff_to, depends_on

# Trazabilidad
created, updated, status
---
```

### Reglas de seguridad

1. **Default deny en vault:** si un path no está en vault_read/vault_write,
   el agente NO puede tocarlo. Sin acceso implícito.

2. **Engram aislado:** namespace compuesto agente/cliente. Sin mezcla
   entre agentes ni entre clientes. Re-acceso al mismo cliente recupera
   contexto histórico.

3. **Skills auditadas:** can_create_skills habilita auto-creación, pero
   skill_scope acota dominios. gs-bibliotecario audita drift periódicamente.

4. **vault_write nunca incluye:** 03_PROTOCOLOS/ (excepto findings.md),
   00_INDEX/ (excepto skills-master.md), CLAUDE.md raíz, decisiones D-XXX.

### Roles de excepción

- **gs-cto:** vault_read total, vault_write limitado a 03_PROTOCOLOS/decisions/
- **gs-bibliotecario:** vault_read total, vault_write a 00_INDEX/skills-master.md
- **gs-growth-hacker:** vault_read total, vault_write a 01_METODOLOGIA/

## Migración desde v1

Los 5 agentes ya commiteados bajo v1 requieren upgrade:
- gs-cto
- gs-roi
- gs-memes-fans
- gs-bibliotecario
- gs-growth-hacker

Refactor: agregar campos faltantes (vault_read, vault_write,
engram_namespace, can_create_skills, skill_scope).

**No bloquea operación actual.** Se ejecuta en sesión separada de
limpieza. Los agentes funcionan con frontmatter incompleto, solo no
declaran permisos explícitamente.

## Referencias

- D-006 v1 (deprecada): este mismo directorio
- DT-007: validar comportamiento real de Engram en runtime
