# D-008: Organización de Archivos en Repo G*S

**Fecha:** 2026-05-12
**Estado:** Aprobada
**Autor:** Ian Villaveces + G*S-CTO
**Tipo:** Decisión Arquitectónica de Organización

---

## Contexto

Durante Sesión B Ian preguntó si convenía crear subcarpetas en
`.claude/agents/` (directivos/, maestros/, operativos/). Esta decisión
formaliza la respuesta y documenta el mapa completo del repo para
referencia futura.

## Decisión

### Estructura plana en `.claude/agents/`

NO usamos subcarpetas dentro de `.claude/agents/`. Razones técnicas:

1. **Claude Code no soporta subcarpetas en `.claude/agents/`.** Los
   sub-agentes deben estar en archivos planos para que `/agents`
   los descubra automáticamente.
2. **Frontmatter ya tiene `panel`** que clasifica por categoría
   (directivo/maestro/organos/operativo). La carpeta es redundante.
3. **El dashboard lee `panel` del frontmatter** para agrupar
   visualmente, no del filesystem.
4. **12 agentes en una carpeta plana es manejable.** Si superamos 30,
   reevaluamos en D-006 v3 futura.

### Mapa de organización del repo

```
BOVEDA - GROWTHStars/
│
├── .claude/                           [Sub-agentes y config Claude Code]
│   ├── agents/                        [12 sub-agentes invocables /agent]
│   │   ├── gs-cto.md                  (directivo)
│   │   ├── gs-growth-hacker.md        (directivo)
│   │   ├── gs-bibliotecario.md        (maestro)
│   │   ├── gs-auditor-redes.md        (operativo backend)
│   │   ├── gs-auditor-musical.md      (operativo backend)
│   │   ├── gs-sintesis-growth.md      (operativo backend)
│   │   ├── gs-estrategia-activaciones.md (operativo backend)
│   │   ├── gs-roi.md                  (operativo backend)
│   │   ├── gs-calendarizador.md       (operativo frontend)
│   │   ├── gs-canva.md                (operativo frontend, workspace contenido)
│   │   ├── gs-memes-fans.md           (operativo frontend, workspace contenido)
│   │   └── gs-prod-vfx.md             (operativo frontend, workspace contenido)
│   ├── commands/                      [Slash commands custom (sin uso aún)]
│   └── settings.local.json
│
├── 00_INDEX/                          [Índices maestros (skills-master.md, etc.)]
├── 01_METODOLOGIA/                    [Onboarding PDFs + Sistema Triggers]
├── 02_AGENTES/                        [Spec histórica de prompts (deprecar Sesión D)]
│   ├── Agente-1-Audit-Redes/          (con prompt-v2.md)
│   ├── Agente-2-Audit-Musica/         (con prompt-v2.md)
│   ├── Agente-3-Sintetizador/         (con prompt-v3.md)
│   ├── Agente-4-Estrategia-Activaciones/ (con Strategy-Brief-prompt-v3.md)
│   ├── Agente-5-Cotizacion/           (RESERVADO — DT-002)
│   ├── Agente-6-Calendario/           (con prompt-v1.md)
│   ├── Agente-7-Briefing/             (esqueleto)
│   ├── Agente-8-Medios/               (esqueleto)
│   ├── Agente-9-Creadores/            (esqueleto)
│   ├── Agente-10-Sprint72/            (esqueleto)
│   └── Agente-11-Reporting/           (esqueleto)
│
├── 03_PROTOCOLOS/                     [Decisiones arquitectónicas activas]
│   ├── decisions/
│   │   ├── D-006-arquitectura-agentes.md      (v1, deprecada)
│   │   ├── D-006-v2-arquitectura-agentes.md   (vigente)
│   │   └── D-008-organizacion-archivos.md     (este archivo)
│   └── 03-handoff-protocol.md
│
├── 04_PLANTILLAS/                     [Templates reutilizables (estructura futura)]
├── 05_BASES_DE_DATOS/                 [Schemas SQL y BDs operativas]
│   └── 01-postgres-schema.sql
├── 06_CLIENTES/                       [Carpeta por cliente con deliverables]
│   └── jot4r/                         (primer cliente migrado)
├── 07_CONOCIMIENTO/                   [BD de conocimiento G*S]
├── 08_OPERACIONES/                    [Setup y ops del sistema]
│   └── 00-supabase-setup.md
│
├── CLAUDE.md                          [Identidad CTO auto-cargada]
├── GROWTHACKER-v1-1.md                [Playbook humano fundacional Ian]
├── README.md                          [Punto de entrada al repo]
├── .gitignore                         [Exclusiones Git]
├── .gitattributes                     [Atributos Git]
└── Test- Git Sync.md                  [Archivo prueba sync]
```

### Función de cada nivel

| Nivel | Audiencia | Función |
|---|---|---|
| `.claude/` | Claude Code | Carga sub-agentes y configuración runtime |
| `00_INDEX/` | Humanos + agentes | Índices maestros (skills, agentes, decisiones) |
| `01_METODOLOGIA/` | Humanos + agentes | Frameworks, triggers, onboarding |
| `02_AGENTES/` | Humanos (deprecando) | Spec histórica de prompts (canónica vivió aquí antes de D-006) |
| `03_PROTOCOLOS/` | Humanos + agentes | Decisiones arquitectónicas y protocolos operativos |
| `04_PLANTILLAS/` | Agentes | Templates reutilizables para deliverables |
| `05_BASES_DE_DATOS/` | Sistema | Schemas, queries, BDs operativas |
| `06_CLIENTES/` | Operativo | Carpeta por cliente con deliverables versionados |
| `07_CONOCIMIENTO/` | Humanos + agentes | BD de conocimiento extendido G*S |
| `08_OPERACIONES/` | Operativo | Setup, ops, runbooks |

### Reglas de oro

1. **Definiciones canónicas de agentes:** SIEMPRE en `.claude/agents/`.
2. **Deliverables de cliente:** SIEMPRE en `06_CLIENTES/<cliente>/`.
3. **Decisiones arquitectónicas:** SIEMPRE en `03_PROTOCOLOS/decisions/D-XXX-*.md`.
4. **Skills:** en `~/.claude/skills/` (global, no en este repo).
5. **Identidad cargada automáticamente:** `CLAUDE.md` en raíz.

## Consecuencias

- Los archivos legacy en `02_AGENTES/` se deprecan en Sesión D.
- Las carpetas vacías (esqueletos Agente-7 a Agente-11) se mantienen
  con `.gitkeep` hasta que se construyan los agentes.
- `04_PLANTILLAS/`, `00_INDEX/`, `07_CONOCIMIENTO/` se irán poblando
  según necesidad operativa, sin estructura forzada.

## Criterio para revisar

Esta decisión se revisa si:
1. La cantidad de agentes supera 30 (entonces evaluar subcarpetas).
2. Se agrega un nuevo tipo de artefacto que no encaje en la estructura.
3. Se decide migrar a multi-repo (G*S + Ian Villaveces B2B separados).

## Referencias

- D-006 v2: Arquitectura de Agentes G*S
- DT-002: Crear Agente #5 - Cotización
- DT-010: Resolver naming de agentes transversales (gs-prod-vfx)
