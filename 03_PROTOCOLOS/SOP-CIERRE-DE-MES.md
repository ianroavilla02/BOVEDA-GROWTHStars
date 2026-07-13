# SOP — Cierre de Mes por Artista (MGMT / Growth)

> Procedimiento replicable y escalable para producir el informe de cierre mensual de cada artista.
> Deriva del molde de oro: `06_CLIENTES/reckless/mgmt/monthly/informe-2026-06.md`.
> Materializa DT-044 (jerarquía D-099). Última actualización: 2026-07-05.

---

## Propósito

Producir, cada fin de mes y para cada artista activo, un **informe de cierre** que registre de dónde viene el artista, qué se construyó, por qué se tomó cada decisión y hacia dónde apunta — cruzando todas las fuentes de su raíz de contexto. El informe alimenta el entregable al cliente (HTML) y la cuenta de cobro del mes.

## Qué lo hace replicable y escalable

| Principio | Cómo se garantiza |
|-----------|-------------------|
| **Replicable** — mismo proceso, misma calidad, cualquier artista | Raíz estándar idéntica + template fijo de 7 secciones + convención de nombres + regla de evidencia + este SOP |
| **Escalable** — sumar artistas no multiplica el esfuerzo | 1 molde de agente × N contextos + plantilla de raíz clonable + cierre como Loop (`/goal`) |

Regla dura: **la disciplina de convención va primero, la automatización después.** El agente se construye cuando el proceso está probado 2-3 veces a mano, no antes.

---

## Capa 1 — Raíz del árbol (contexto por artista)

Estructura estándar. Todo artista activo tiene exactamente esta forma (clonable desde `_template-artista/`):

```
<artista>/
  contexto.md            — quién es, tier, estado actual
  brand-book/            — identidad de marca — ESTABLE durante una era (bases creativas)
  direccion-artistica/   — decisiones artísticas MES A MES (feed, guiones, snippet testing)
    YYYY-MM.md           — decisiones artísticas del mes (cambia mensualmente)
  01-auditorias/         — diagnóstico cuantitativo (musical + redes)
  02-sintesis/           — síntesis growth
  lanzamientos/          — un sub-árbol por lanzamiento (musical o subproyecto: merch, etc.)
    <lanzamiento>/
      estrategia.md      — orgánico + profesional + UGC + prensa
  mgmt/
    meetings/            — actas del mes  ← INPUT CRUDO del cierre
    monthly/
      informe-YYYY-MM.md    — el cierre (la lectura)
      informe-YYYY-MM.html  — entregable final (GitHub Pages)
      cuenta-cobro-YYYY-MM  — facturación
```

**Convención de actas (crítica):** las reuniones se nombran `empalme-meta-N` (arranque de un objetivo) y `entrega-meta-N` (cierre de ese objetivo). Esta nomenclatura ES el registro de objetivos y entregables del mes — no se necesita planilla aparte. Las misiones secundarias (tareas sueltas) se registran dentro de las actas.

**Dirección artística (mes a mes) ≠ brand-book:** el brand-book establece las bases creativas ESTABLES de una era. La dirección artística son las decisiones creativas que cambian cada mes: reformar el feed, guiones de producciones, snippet testing de contenido. Se registra en `direccion-artistica/YYYY-MM.md` y alimenta directamente las secciones 2 y 3 del informe.

**Lanzamientos (subestrategias ricas):** cada lanzamiento —musical o de subproyecto (merch, nuevo subproyecto)— es una estrategia completa con sus 4 frentes de contenido: **orgánico, profesional, UGC y prensa**. Se registra en `lanzamientos/<lanzamiento>/`. Un mes puede tener 0, 1 o varios lanzamientos; cuando los hay, son la fuente más rica del cierre. (Ej.: junio de Reckless tuvo 0 lanzamientos — fue mes de preparación de marca; julio arranca con los primeros.)

## Capa 2 — Anatomía del informe (template fijo de 7 secciones)

| # | Sección | Contenido |
|---|---------|-----------|
| 0 | El mes en una frase | La tesis del mes |
| 1 | De dónde venimos — baseline | Métricas de inicio (tier, listeners, streams, revenue, redes, geografía) |
| 2 | Qué construimos | Entregable por entregable: **por qué importa + cómo se hizo + decisiones tomadas + conexión al diagnóstico** |
| 3 | Decisiones estratégicas del mes | Tabla: decisión / contexto / reunión donde se tomó |
| 4 | Lo que el artista demostró | Lo cualitativo que no está en métricas |
| 5 | Métricas de operación | Objetivos (X/Y), entregables, reuniones, misiones, documentos |
| 6 | El antes y el después | Tabla comparativa por dimensión |

**Regla invariante de evidencia:** cada afirmación se ancla a una fuente concreta (un acta, una auditoría, una cita textual del artista). Sin ancla, no se afirma. Esto es lo que separa un informe creíble de relleno.

## Capa 3 — Flujo de trabajo (roles DT-044)

| Paso | Qué se hace | Rol (DT-044 / D-099) |
|------|-------------|----------------------|
| 1. Recolectar | Reunir las fuentes de la raíz (auditorías, síntesis, brand, actas del mes) | Growth Hacker del artista (Jefe de Área) |
| 2. Interpretar | Cruzar fuentes → `informe-YYYY-MM.md` con las 8 secciones + regla de evidencia | Growth Hacker del artista |
| 3. Presentar | `.md` → HTML entregable para GitHub Pages con estética G*S | Documentación |
| 4. Cobrar | Cuenta de cobro del mes | gs-facturador |

Por encima: el **Growth Hacker de G*S** (Órgano de Control) agrega las lecturas de todos los artistas → foto de cartera para dirección.

**Frontera (DATA ≠ LECTURA):** el análisis vive en el paso 2 (Growth Hacker). Documentación (paso 3) NO interpreta — solo presenta la lectura ya hecha. No colapsar ambos roles.

---

## Fase de construcción (incremental)

1. **Hoy — manual-asistido:** el CTO (Claude) hace de Growth Hacker del artista, lee la raíz y produce el cierre conversando con Ian. Se ejecuta 2-3 veces con artistas reales siguiendo este SOP.
2. **Cristalización:** con el proceso probado, se destila el prompt del agente `gs-growth-hacker-artista` (1 molde) + un skill de generación HTML (Documentación).
3. **Automatización — Loop:** el cierre se corre como `/goal` de DT-044: *"el informe de cierre de <ARTISTA> de <MES> tiene las 8 secciones con evidencia y está publicado"*. El loop barre los N artistas activos.

## Onboarding de un artista nuevo (escalabilidad)

1. Clonar `_template-artista/` como `<nuevo-artista>/`.
2. Llenar `contexto.md` (tier, estado, cliente).
3. A medida que ocurren reuniones, guardar actas con la convención `empalme-meta-N` / `entrega-meta-N`.
4. Al cierre del mes, ejecutar este SOP. Cero trabajo de diseño — solo ejecución.

---

## Anexo — Esqueleto del informe (copiar y llenar)

```markdown
# Informe de Cierre — <Artista> | <Mes Año>

## El Mes en una Frase
<tesis>

## 1. De Dónde Venimos — El Baseline (<fecha>)
<tabla de métricas de inicio + diagnóstico integrado>

## 2. Qué Construimos — Entregable por Entregable
### 2.x <Entregable>
**Por qué importa:** ...
**Cómo se hizo:** ... (con fecha/acta)
**Decisiones tomadas:** ...
**Conexión con el diagnóstico:** ...

## 3. Decisiones Estratégicas del Mes
| # | Decisión | Contexto | Reunión |

## 4. Lo Que <Artista> Demostró Este Mes
<cualitativo, anclado a citas>

## 5. Métricas de Operación
| Indicador | Valor |
| Objetivos completados | X/Y |
| Entregables finalizados | X/Y |
| Reuniones realizadas | N |
| Misiones ejecutadas | N |
| Documentos producidos | ... |
| Decisiones estratégicas registradas | N |

## 6. El Antes y El Después
| Dimensión | Antes (<fecha>) | Después (<fecha>) |

*Escrito cruzando <fuentes>. Growth*Stars — Cierre de <mes año>.*
```
