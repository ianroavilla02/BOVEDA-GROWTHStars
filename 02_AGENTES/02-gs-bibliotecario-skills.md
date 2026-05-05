# G*S-BIBLIOTECARIO SKILLS — Especificación del Agente

## Identidad

**Slug:** `gs-bibliotecario-skills`
**Panel:** Meta (agentes que mantienen el sistema)
**Versión:** 1.0
**Estado:** experimental → activo después de primer ciclo

## Propósito

Auditar todas las skills creadas por los agentes G\*S, clasificarlas, detectar duplicados, identificar gaps, y generar un índice maestro `.md` que viva en Obsidian como fuente de verdad de capacidades del sistema.

Sin este agente, las skills crecen orgánicamente y en 3 meses tendremos:
- Skills con nombres inconsistentes (`scrape-instagram` vs `instagram-scraper` vs `ig-fetch`)
- Skills duplicadas (dos agentes hacen lo mismo con código diferente)
- Capacidades fantasma (skills creadas, nunca usadas)
- Cero visibilidad de qué puede hacer el sistema en total

## Inputs

```json
{
  "scan_paths": [
    "/path/to/.claude/skills/",
    "/path/to/obsidian-vault/gs/skills/"
  ],
  "output_path": "/path/to/obsidian-vault/gs/_indices/skills-master.md",
  "mode": "full" | "incremental",
  "since": "2026-04-01T00:00:00Z"
}
```

## Outputs

### Output primario: `skills-master.md` en Obsidian

Estructura del archivo generado:

```markdown
# G*S Skills — Índice Maestro

> Generado por G*S-BIBLIOTECARIO SKILLS el {timestamp}
> Total de skills: {N}
> Última auditoría: {date}

## Resumen ejecutivo

- **Total skills:** N
- **Por panel:** Growth: X | Documentación: Y | Pre: Z | Post: W | Meta: V
- **Duplicados detectados:** N
- **Skills sin uso (>30 días):** N
- **Skills sin documentación:** N

## Por panel y agente

### Panel: Growth

#### Agente: G*S-Auditoría Redes Sociales
| Skill | Versión | Uso (30d) | Inputs | Outputs | Estado |
|---|---|---|---|---|---|
| `gs-scrape-instagram` | 1.2 | 12 | profile_url | engagement_metrics | ✅ |
| `gs-scrape-tiktok` | 1.0 | 8 | profile_url | engagement_metrics | ✅ |
| `gs-fetch-spotify-stats` | 1.1 | 4 | artist_id | streaming_data | ⚠️ desactualizada |

[... continúa por agente ...]

## Duplicados detectados

⚠️ Las siguientes skills hacen funciones similares y deben consolidarse:

- `gs-instagram-scrape` (Auditoría) ≈ `ig-data-fetch` (Shitposter-Fans)
  - Recomendación: consolidar en `gs-scrape-instagram` v2.0

## Gaps identificados

🔴 Capacidades faltantes que se infieren de los protocolos:

- No existe skill para scraping de YouTube (mencionada en Protocolo de Auditoría)
- No existe skill para análisis de comentarios en Spotify

## Skills inactivas (candidatas a deprecar)

| Skill | Última ejecución | Agente | Recomendación |
|---|---|---|---|
| `gs-old-twitter-fetch` | 2026-01-15 | Auditoría | Deprecar (Twitter API ya no responde) |

## Convención de nombres aplicada

Todas las skills G*S deben seguir: `gs-{verbo}-{objeto}-{contexto?}`
Ejemplos válidos:
- `gs-scrape-instagram`
- `gs-generate-canva-brief`
- `gs-calculate-roi-activacion`

Skills no conformes detectadas: {N}
[lista]
```

### Output secundario: registros en Postgres

```sql
-- Cada auditoría queda registrada como un run
INSERT INTO runs (agent_id, status, output, ...) VALUES (...);

-- Cada anomalía detectada se registra como finding
INSERT INTO findings (run_id, type, title, content) VALUES
    (..., 'risk', 'Skill duplicada', 'gs-instagram-scrape ≈ ig-data-fetch'),
    (..., 'opportunity', 'Gap detectado', 'Falta skill para YouTube scraping'),
    ...;
```

## Lógica de operación

### Fase 1: Discovery
1. Escanea `scan_paths` recursivamente buscando archivos que correspondan a skills (estructura: carpeta con `description.md`, `inputs.md`, `outputs.md`, código).
2. Para cada skill encontrada, extrae:
   - Nombre / slug
   - Versión (si existe en frontmatter)
   - Agente dueño
   - Inputs declarados
   - Outputs declarados
   - Última modificación

### Fase 2: Cruce con Postgres
3. Query a Postgres: `SELECT skill_used, COUNT(*) FROM runs WHERE...` para obtener uso real.
4. Cruza skills declaradas con skills efectivamente usadas → detecta:
   - Skills declaradas pero nunca usadas (candidatas a deprecar).
   - Skills usadas pero no declaradas (mal documentadas).

### Fase 3: Análisis
5. Detección de duplicados:
   - Skills con nombres similares (Levenshtein distance < 3).
   - Skills con descriptions similares (embedding similarity > 0.85).
6. Detección de gaps:
   - Lee protocolos en `obsidian/gs/protocolos/`.
   - Extrae verbos/acciones mencionados.
   - Cruza con skills disponibles → reporta gaps.
7. Validación de convención de nombres.

### Fase 4: Generación
8. Genera `skills-master.md` con la estructura definida arriba.
9. Escribe runs y findings a Postgres.
10. Si `mode=full`, sobrescribe el archivo. Si `mode=incremental`, anexa una sección "Cambios desde {since}".

## Cuándo se ejecuta

- **On-demand:** Ian lo dispara desde Claude Code o n8n.
- **Cron sugerido:** semanal, los lunes a las 9am (cuando Ian arranca semana).
- **Trigger por evento:** después de que cualquier agente cree una skill nueva (vía hook de Claude Code).

## Skills propias del agente

Este agente requiere las siguientes skills:

| Skill | Propósito |
|---|---|
| `gs-scan-filesystem` | Escanear directorios buscando skills |
| `gs-parse-skill-metadata` | Extraer metadata de archivos de skill |
| `gs-detect-duplicates` | Detectar skills duplicadas vía similarity |
| `gs-query-postgres` | Consultar uso de skills en runs |
| `gs-generate-markdown-index` | Generar archivo .md con la estructura definida |

## Configuración en Postgres

```sql
INSERT INTO agents (slug, name, panel, role, description, schedule, config) VALUES (
  'gs-bibliotecario-skills',
  'G*S-Bibliotecario Skills',
  'meta',
  'Auditor maestro de skills',
  'Audita, clasifica y documenta todas las skills G*S. Detecta duplicados, gaps y skills no usadas.',
  'cron:0 9 * * 1',  -- lunes 9am
  '{
    "model": "claude-opus-4-7",
    "max_tokens": 8000,
    "temperature": 0.2,
    "scan_paths": ["~/.claude/skills/", "~/obsidian/gs/skills/"],
    "output_path": "~/obsidian/gs/_indices/skills-master.md",
    "alert_thresholds": {
      "duplicates_above": 3,
      "unused_skills_above": 10,
      "non_compliant_names_above": 5
    }
  }'::jsonb
);
```

## Criterios de éxito

El agente está funcionando correctamente cuando:
1. Genera `skills-master.md` sin errores.
2. El archivo refleja realidad (verificable por inspección manual).
3. Detecta al menos 1 duplicado o gap real en el primer mes (si no detecta nada en 3 ciclos, revisar la lógica).
4. Ian consulta el archivo al menos 1 vez por semana cuando piensa en construir un agente nuevo.

## Roadmap de mejoras

- **v1.1:** integración con embeddings (pgvector) para detección semántica de duplicados.
- **v1.2:** sugerencias automáticas de consolidación de duplicados.
- **v2.0:** capacidad de proponer refactors de skills y abrir PRs en el repo de skills.
