# G*S Agent Dashboard

Dashboard de visualización de agentes Claude Code bajo arquitectura D-006 v2.

## Características

- **Read-only** sobre archivos canónicos `.claude/agents/`
- **Multi-proyecto** via registry configurable en `server.js`
- **Parser YAML real** (js-yaml) compatible con frontmatter D-006 v2
- **Auto-refresh** via Server-Sent Events cuando se modifican agentes
- **Glassmorphism UI** con categorización por panel/group/workspace

## Stack

- Node.js (vanilla, sin Express)
- js-yaml para parseo de frontmatter
- HTML + CSS + JS vanilla (sin frameworks)

## Setup

```bash
npm install
node server.js
```

Dashboard disponible en `http://localhost:3737`.

## Configuración

Editar el array `PROJECTS` en `server.js`:

```javascript
const PROJECTS = [
  {
    name: "G*S Growth*Stars",
    slug: "gs",
    agentsPath: "C:\\Users\\...\\BOVEDA - GROWTHStars\\.claude\\agents",
    color: "purple"
  }
];
```

## Pipeline Order

Para que un agente aparezca con badge numerado (#1, #2, etc.), agregarlo
al objeto `PIPELINE_ORDER` en `server.js`:

```javascript
const PIPELINE_ORDER = {
  "gs-auditor-redes": 1,
  // ...
};
```

Agentes sin número en `PIPELINE_ORDER` se ordenan alfabéticamente
después de los numerados.

## Arquitectura

- `server.js` — Backend Node.js, scan + parser + endpoints
- `index.html` — Frontend SPA glassmorphism
- `start-dashboard.vbs` — Auto-start con Windows
- `favicon.png` — Icono del dashboard

## Endpoints

- `GET /` — Dashboard UI
- `GET /api/agents` — JSON con agentes + categorías + proyectos
- `GET /api/events` — SSE stream para auto-refresh
- `GET /favicon.png` — Icono

## Historial

- **v2 (2026-06-02):** Refactor para D-006 v2, multi-proyecto, read-only
- **v1 (anterior):** Leía de memory/, parser regex, drag-and-drop con escritura

## Compatibilidad

Compatible con cualquier repo que use frontmatter D-006 v2:
- `slug`, `name`, `version` (obligatorios)
- `panel`, `group`, `subgroup`, `workspace` (categorización)
- `role`, `description`, `tools` (metadata)
- `depends_on`, `handoff_to` (pipeline)
