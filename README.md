# G*S CTO Kit — Bootstrap del sistema

Kit de arranque entregado por G\*S-CTO para Ian Villaveces el 2026-04-30.

## Archivos incluidos

| Archivo | Destino | Propósito |
|---|---|---|
| `CLAUDE.md` | Raíz del proyecto G\*S en Claude Code | System prompt del CTO. Lo carga Claude Code automáticamente. |
| `00-supabase-setup.md` | Obsidian: `gs/setup/` | Guía paso a paso de instalación de Supabase |
| `01-postgres-schema.sql` | Ejecutar en Supabase SQL Editor | Schema inicial: agents, runs, findings + vistas + datos semilla |
| `02-gs-bibliotecario-skills.md` | Obsidian: `gs/agentes/meta/` | Spec del agente G\*S-Bibliotecario Skills |
| `03-handoff-protocol.md` | Obsidian: `gs/protocolos/` | Protocolo completo de hand-off entre agentes |

## Orden de ejecución sugerido

### Día 1 (hoy): Foundation
1. Crear cuenta en Supabase y proyecto `gs-growthstars-prod` (ver `00-supabase-setup.md`).
2. Ejecutar `01-postgres-schema.sql` en el SQL Editor de Supabase.
3. Verificar: query `SELECT * FROM agents;` debe devolver los 11 agentes semilla.
4. Configurar MCP de Postgres en Claude Code.
5. Crear estructura de carpetas en Obsidian:
   ```
   vault/
   └── gs/
       ├── setup/           ← guías de instalación
       ├── agentes/
       │   ├── meta/        ← G*S-CTO, G*S-Bibliotecario
       │   ├── growth/      ← agentes operacionales
       │   ├── documentacion/
       │   ├── preproduccion/
       │   └── postproduccion/
       ├── protocolos/      ← protocolos vivos (handoff, etc)
       ├── decisions/       ← decisiones arquitectónicas (D-001, D-002...)
       ├── _indices/        ← índices generados automáticamente
       └── clientes/        ← carpeta por cliente
   ```
6. Mover los .md de este kit a sus carpetas respectivas.
7. Copiar `CLAUDE.md` a la raíz del proyecto Claude Code de G\*S.

### Día 2-3: Bibliotecario
8. Implementar G\*S-Bibliotecario Skills siguiendo `02-gs-bibliotecario-skills.md`.
9. Ejecutar primera auditoría manual (mode=full).
10. Verificar que `skills-master.md` se genera correctamente.

### Día 4-7: Primer hand-off real
11. Definir contratos `contract.md` para 2 agentes (ej: Auditoría Redes Sociales + Síntesis Growth).
12. Implementar worker de Claude Code (script Python básico).
13. Crear workflows n8n: "Trigger inicial" y "Hand-off poller".
14. Test end-to-end con artista de prueba.

### Día 8+: Operación
15. Ampliar a los 5 agentes de Growth.
16. Conectar con Notion (front cliente).
17. Conectar con Canva (output deliverables).

## Decisiones arquitectónicas registradas

Crear en Obsidian `vault/gs/decisions/`:

- **D-001-no-orquestador-dedicado.md** — n8n + Claude Code suficientes para Fase 1.
- **D-002-postgres-estado-central.md** — Postgres como fuente de verdad de estado.
- **D-003-supabase-bd-operacional.md** — Supabase cloud free tier inicialmente.
- **D-004-frontend-custom-fase-3.md** — Sin UI custom hasta validar operación.

(Estas decisiones están consolidadas en `CLAUDE.md`. Crear los .md individuales para historial.)

## Lo que NO está en este kit (por ahora)

Estas son piezas que sé que necesitamos pero no he construido en este sprint:

- Documento de contratos input/output para los 5 agentes Growth (lo hacemos juntos cuando lo abordemos).
- Workflows n8n específicos en formato JSON exportable (los construyo cuando tengamos los contratos).
- Worker Python concreto (lo construimos en Claude Code directamente).
- Setup de Tailscale para acceso remoto (Fase 2).
- Backup automatizado de Supabase (urgente, pero después del primer cliente).

## Ping al CTO cuando

- Termines el Día 1 y necesites avanzar a Bibliotecario.
- Tengas dudas de implementación de algún paso.
- Encuentres fricción inesperada (siempre hay).
- Quieras revisar contratos antes de crear los workflows n8n.

— G\*S-CTO
