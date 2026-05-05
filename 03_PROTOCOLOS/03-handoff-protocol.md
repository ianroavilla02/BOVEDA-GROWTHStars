# Protocolo de Hand-off entre Agentes G*S

## Qué es un hand-off (y por qué importa)

Un hand-off es el momento en que un agente termina su trabajo y le pasa el resultado a otro agente para que continúe. Suena obvio, pero es donde **el 80% de los sistemas multi-agente fallan**. Los problemas típicos:

- Agente A termina pero nadie despierta a Agente B → trabajo varado.
- Agente A pasa data en formato X, Agente B esperaba formato Y → falla silenciosa.
- Agente B se ejecuta dos veces porque el trigger no es idempotente → costo doble, resultados duplicados.
- Si algo falla en la cadena, no se sabe dónde → debugging imposible.

Por eso el hand-off no es "Agente A llama a Agente B". Es un **protocolo formal con contratos, estados, y trazabilidad**.

## Modelo conceptual: máquina de estados sobre Postgres

El patrón que adopta G\*S es:

```
[Trigger] → [Agent A run: pending → running → complete]
              ↓ (al completarse, escribe handoff_to + handoff_payload)
[n8n detecta status=complete con handoff_to]
              ↓ (crea nuevo run para Agent B)
[Agent B run: pending → running → complete]
              ↓ (puede hacer otro hand-off, o terminar)
[Cierre del flujo, deliverable a cliente]
```

Postgres es la fuente de verdad del estado. n8n es el observador que conecta estados con acciones. Claude Code (con MCP de Postgres) es quien ejecuta la lógica de cada agente.

## Componentes del protocolo

### 1. Contratos input/output (lo más crítico)

Cada agente declara explícitamente qué espera recibir y qué garantiza producir. Esto se documenta en su carpeta de skill/agente como `contract.md` y se valida en runtime.

**Ejemplo: G\*S-Auditoría Redes Sociales**

```yaml
# contract.md de gs-auditoria-redes-sociales

input_schema:
  type: object
  required: [project_id, artist, platforms]
  properties:
    project_id:
      type: string
      description: "ID único del proyecto/lanzamiento"
    artist:
      type: object
      required: [name, handles]
      properties:
        name: { type: string }
        handles:
          type: object
          properties:
            instagram: { type: string }
            tiktok: { type: string }
            youtube: { type: string }
    platforms:
      type: array
      items: { enum: [instagram, tiktok, youtube, twitter] }

output_schema:
  type: object
  required: [project_id, audit_date, platforms_analyzed, metrics, summary]
  properties:
    project_id: { type: string }
    audit_date: { type: string, format: date-time }
    platforms_analyzed: { type: array }
    metrics:
      type: object
      properties:
        instagram:
          properties:
            followers: { type: integer }
            engagement_rate: { type: number }
            avg_likes: { type: number }
            avg_comments: { type: number }
            growth_30d: { type: number }
        # ... etc por plataforma
    summary:
      type: object
      properties:
        strengths: { type: array }
        weaknesses: { type: array }
        opportunities: { type: array }

handoff_to: gs-sintesis-growth  # opcional; null si es agente terminal
```

**Por qué es crítico:** sin contrato, cuando falle la cadena no sabrás si fue Agente A que produjo data malformada o Agente B que no supo leerla. Con contrato, validas en cada hand-off y el error se localiza.

### 2. Estados de run y sus transiciones

Estados permitidos para cada run:

| Estado | Significado | Transiciones permitidas |
|---|---|---|
| `pending` | Run creado, esperando que un worker lo tome | → running, → cancelled |
| `running` | Worker (Claude Code) está ejecutando | → complete, → failed |
| `complete` | Terminado exitosamente con output válido | (terminal, dispara handoff si aplica) |
| `failed` | Falló durante ejecución | (terminal, requiere intervención manual o retry) |
| `cancelled` | Ian o sistema canceló antes de ejecutar | (terminal) |

**Reglas:**
- Una vez en estado terminal, el run es **inmutable**. Para "reintentar", se crea un run nuevo con `parent_run_id` apuntando al fallado.
- `running → failed` requiere escribir `error` con el motivo.
- `running → complete` requiere escribir `output` que cumpla el `output_schema` del contrato.

### 3. Trigger del hand-off

Cuando un run pasa a `complete` y tiene `handoff_to` no nulo, se dispara automáticamente un nuevo run para el agente destino. Hay dos formas de implementarlo:

**Opción A: n8n con polling (recomendado para empezar)**

n8n ejecuta cada minuto:

```sql
SELECT id, agent_id, handoff_to, handoff_payload, project_id, client_id
FROM runs
WHERE status = 'complete'
  AND handoff_to IS NOT NULL
  AND id NOT IN (SELECT parent_run_id FROM runs WHERE parent_run_id IS NOT NULL);
```

Para cada resultado: crea un nuevo run en estado `pending` con `agent_id = handoff_to`, `parent_run_id = id`, `input = handoff_payload`. Luego dispara la ejecución de ese agente vía webhook a Claude Code.

**Opción B: Postgres LISTEN/NOTIFY (más elegante, Fase 2)**

Trigger SQL que emite NOTIFY cuando un run pasa a complete. n8n escucha vía LISTEN. Cero polling, latencia baja.

```sql
CREATE OR REPLACE FUNCTION notify_handoff()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'complete' AND NEW.handoff_to IS NOT NULL THEN
        PERFORM pg_notify('handoff', json_build_object(
            'run_id', NEW.id,
            'handoff_to', NEW.handoff_to,
            'payload', NEW.handoff_payload
        )::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_handoff
    AFTER UPDATE ON runs
    FOR EACH ROW
    EXECUTE FUNCTION notify_handoff();
```

Recomendación CTO: **empezar con Opción A** (polling cada minuto). Migrar a B cuando tengas más de 100 runs/día y el polling se sienta lento.

### 4. Idempotencia (evitar ejecuciones duplicadas)

Regla: **un run con `parent_run_id` específico solo puede existir una vez**.

```sql
CREATE UNIQUE INDEX uq_runs_parent_agent
ON runs(parent_run_id, agent_id)
WHERE parent_run_id IS NOT NULL;
```

Con ese índice, si n8n intenta crear el mismo hand-off dos veces (por race condition o reintento), Postgres rechaza el segundo. Cero ejecuciones duplicadas garantizado.

### 5. Manejo de errores y retries

Cuando un run pasa a `failed`:

1. Se loguea `error` con stacktrace o mensaje.
2. Se crea un finding tipo `risk` en Postgres con el detalle.
3. n8n notifica a Ian (Slack/email/Notion).
4. Ian decide:
   - **Retry manual:** crear run nuevo con `parent_run_id = failed_run_id`.
   - **Skip:** marcar el flujo como `cancelled` aguas abajo.
   - **Fix & retry:** corregir contrato/agente y reintentar.

**No retries automáticos al inicio.** Los retries automáticos esconden bugs reales. Cuando G\*S esté maduro y tengamos categorización de errores (transitorios vs permanentes), añadimos retry automático para transitorios.

## Ejemplo end-to-end: lanzamiento de artista

Veamos el flujo concreto del hand-off para un lanzamiento típico.

### Flujo: Onboarding de artista nuevo

```
Notion: nuevo cliente "Carlos G" → status=onboarding
   ↓ (n8n trigger por cambio de status en Notion DB)
Run #1: gs-auditoria-redes-sociales
   input: { project_id, artist: { name: "Carlos G", handles: {...} }, platforms: [instagram, tiktok] }
   output: { metrics: {...}, summary: {...} }
   handoff_to: gs-sintesis-growth
   handoff_payload: { project_id, audit_data: <output> }
   ↓
Run #2: gs-sintesis-growth
   parent_run_id: Run #1
   input: handoff_payload de Run #1
   output: { diagnosis: {...}, priorities: [...], risks: [...] }
   handoff_to: gs-estrategia-activaciones
   handoff_payload: { project_id, diagnosis, priorities }
   ↓
Run #3: gs-estrategia-activaciones
   parent_run_id: Run #2
   output: { activaciones: [{...}, {...}], timeline: {...}, budget_estimate: {...} }
   handoff_to: gs-canva
   handoff_payload: { project_id, deliverable_type: 'estrategia-360', content }
   ↓
Run #4: gs-canva
   parent_run_id: Run #3
   output: { canva_url: "https://...", pdf_url: "https://..." }
   handoff_to: null (terminal)
   ↓
n8n detecta cadena terminal → escribe deliverable a Notion DB del cliente
   ↓
Notion: status=audit_complete + link a deliverable
```

Cada nodo de la cadena queda registrado en Postgres con `parent_run_id` apuntando hacia atrás. Puedes reconstruir la cadena completa con:

```sql
WITH RECURSIVE chain AS (
    SELECT id, agent_id, parent_run_id, status, output, 0 AS depth
    FROM runs WHERE id = '<root_run_id>'
    UNION ALL
    SELECT r.id, r.agent_id, r.parent_run_id, r.status, r.output, c.depth + 1
    FROM runs r
    INNER JOIN chain c ON r.parent_run_id = c.id
)
SELECT * FROM chain ORDER BY depth;
```

## Implementación concreta en n8n

Tres workflows necesarios:

### Workflow 1: "Trigger inicial"
- **Trigger:** Notion webhook (cambio de status en DB de clientes).
- **Acción:** crear run en `pending` para el primer agente del flujo.
- **Output:** llama webhook de Claude Code para arrancar ejecución.

### Workflow 2: "Hand-off poller" (corre cada minuto)
- **Trigger:** Schedule cada minuto.
- **Acción:** query a Postgres por runs `complete` con `handoff_to` no procesado aún.
- **Para cada uno:** crear run nuevo en `pending` para el agente destino + disparar Claude Code.

### Workflow 3: "Cierre y notificación"
- **Trigger:** Schedule cada 5 minutos.
- **Acción:** query a Postgres por runs `complete` con `handoff_to=null` y `output` con `deliverable_url`.
- **Acción:** actualizar Notion DB del cliente con el deliverable.

## Worker de Claude Code

El "worker" es el script que toma un run en `pending`, lo marca `running`, ejecuta el agente correspondiente, y escribe el resultado.

Pseudocódigo:

```python
def worker_loop():
    while True:
        run = claim_pending_run()  # SELECT ... FOR UPDATE SKIP LOCKED
        if not run:
            sleep(5)
            continue

        try:
            mark_running(run.id)
            agent = load_agent(run.agent_id)
            validate_input(run.input, agent.input_schema)

            output = execute_agent(agent, run.input)  # llama Claude API

            validate_output(output, agent.output_schema)
            mark_complete(run.id, output, handoff_to=agent.handoff_to)
            extract_findings_to_db(run.id, output)

        except Exception as e:
            mark_failed(run.id, str(e))
```

Este worker corre como un proceso de Claude Code o como un servicio Python independiente. Para Fase 1, lo más simple es un script Python con MCP de Postgres + Anthropic SDK.

## Checklist de implementación

**Antes de tener el primer hand-off funcionando:**

- [ ] Schema Postgres aplicado (las 3 tablas + índices + vistas).
- [ ] Al menos 2 agentes G\*S con `contract.md` definido.
- [ ] Worker de Claude Code que pueda ejecutar un run y escribir output.
- [ ] Workflow n8n "Hand-off poller" corriendo cada minuto.
- [ ] Test end-to-end: disparas Run #1 manualmente, verificas que Run #2 aparece automáticamente.

**Validación: el hand-off funciona si:**
1. Disparas el primer run manualmente vía SQL `INSERT`.
2. En menos de 90 segundos, ves Run #2 creado con `parent_run_id` correcto.
3. El payload de input de Run #2 corresponde al `handoff_payload` de Run #1.
4. Si rompes el contrato a propósito (output malformado), Run #2 NO se crea y queda finding tipo `risk`.

## Anti-patrones a evitar

🚫 **No hagas hand-off por API directa entre agentes** ("Agente A llama a Agente B vía HTTP").
   - Razón: pierdes trazabilidad, idempotencia, y observabilidad.

🚫 **No uses estado en memoria del agente para el hand-off**.
   - Razón: si el proceso muere, pierdes todo. Postgres es la fuente de verdad.

🚫 **No mezcles `output` y `handoff_payload` en el mismo campo**.
   - `output` es el resultado completo del agente (puede ser muy grande).
   - `handoff_payload` es el subset preparado para el siguiente agente (compacto).

🚫 **No pongas lógica de negocio en n8n**.
   - n8n es el plomero: detecta estado, dispara siguiente. La lógica vive en los agentes.

🚫 **No escribas a Notion desde cada agente**.
   - Solo el último agente del flujo o un workflow dedicado escribe a Notion. Evita conflictos y simplifica debugging.

## Evolución futura del protocolo

- **v1.0 (ahora):** secuencial lineal, n8n polling, sin retries automáticos.
- **v1.5:** soporte para fan-out (1 agente dispara N agentes en paralelo).
- **v2.0:** fan-in (N agentes alimentan a 1 con sincronización).
- **v2.5:** condicional branching (handoff_to depende del output).
- **v3.0:** migración a orquestador dedicado si los criterios de D-001 se cumplen.
