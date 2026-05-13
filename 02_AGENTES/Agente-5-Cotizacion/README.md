# Agente #5 — Cotización (Pipeline G*S)

## Estado

Pendiente de construcción — DT-002.

## Contexto

Este slot del pipeline G*S está reservado para el Agente de Cotización
que consume el Strategy Brief de gs-estrategia-activaciones (#4) y
produce la cotización formal del lanzamiento para el cliente.

## Pipeline G*S — Posición

```
#1 Audit-Redes → #2 Audit-Musical → #3 Sintetizador → #4 Estrategia
  → #5 Cotización ← [acá] → #6 Calendario → #7-11 (esqueletos) → #12 ROI
```

## Trabajo pendiente

- Diseñar system prompt completo del agente desde cero
- Definir frontmatter D-006 v2 (panel: operativo, group: backend)
- Crear contraparte en BOVEDA/.claude/agents/gs-cotizador.md
- Actualizar handoff_to de gs-estrategia-activaciones a gs-cotizador (DT-009)

## Histórico

Esta carpeta originalmente se llamaba "Agente-5-ROI" por error histórico.
ROI es Agente #12 del pipeline, no #5. Renombrado bajo Sesión B / D-006 v2.

## Referencias

- D-006 v2: Arquitectura de Agentes G*S
- DT-002: Crear Agente #5 - Cotización
- DT-009: Actualizar handoff_to chain cuando exista gs-cotizador
