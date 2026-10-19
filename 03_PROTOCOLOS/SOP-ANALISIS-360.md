# SOP Operativo: Análisis 360 de Artista

> **Versión:** 1.2 · **Fecha:** 2026-06-30
> **Decisiones:** D-092 a D-096
> **Deuda técnica:** DT-036 (Perfilador), DT-037 (Auditor Mercado), DT-038 (Orquestación), DT-039 (Limpiador)

---

## Propósito

Producir, a partir de un artista que entra al sistema, un retrato estratégico completo: salud algorítmica + entorno de mercado + identidad + el cruce que genera veredicto y brandbook.

## Agentes, objetos y autonomía

| Agente | Objeto que mira | Fuentes | Autonomía |
|---|---|---|---|
| Limpiador (DT-039) | Transcripción cruda | Notetaker | Autónomo (solo necesita la transcripción) |
| Auditor Redes | Audiencia/comportamiento propio | IG/TikTok analytics | Autónomo (solo necesita handles) |
| Auditor Musical | Artista propio | S4A, distribuidora, Soundcharts | Autónomo (solo necesita IDs) |
| Perfilador | Identidad del artista | Transcripción limpia (del Limpiador) | Autónomo (necesita transcripción limpia) |
| Auditor Mercado | Entorno / competencia / nicho | Soundcharts, TikTok CC, Trends, Meta | **Dependiente del Perfilador** |
| Sintetizador | El cruce de todo | Outputs de los 4 | Terminal (necesita a todos) |

> La capa no es simétrica. Tres agentes arrancan sin esperar a nadie; Mercado espera al perfil; Sintetizador espera a todos.

## Orquestación por fases (dependencia de datos, no de reloj)

```
FASE 0 → Onboarding
   Reunión (Guía v2) → transcripción del notetaker

FASE 0.5 → Limpieza (DT-039)
   Limpiador → quita ruido, corrige nombres, etiqueta [ARTISTA]/[ENTREVISTADOR]
   Output: transcripción confiable para el Perfilador

FASE 1 → Recolección autónoma (en paralelo)
   ├─ Auditor Redes      → salud social
   ├─ Auditor Musical    → salud algorítmica + audiencia REAL (S4A: edad, geo)
   └─ Perfilador         → perfil + punto único (hipótesis) + hipótesis de nicho + coherencia

FASE 2 → Recolección dependiente
   └─ Auditor Mercado    → disparado por el output del Perfilador
        confirma el nicho propuesto + barre adyacencias + norma demográfica del nicho

FASE 3 → Síntesis
   └─ Sintetizador       → recibe los 4 outputs
        cruza tracks · juicio de vacío y defendibilidad · gap percepción-data
        · gap audiencia real-deseada (= perfil de cliente real) · veredicto

SALIDA (2 documentos)
   ├─ 1. CONTEXTO DEL ARTISTA   → retrato descriptivo (identidad + coherencia +
   │                              salud algorítmica + entorno). Reutilizable y estable.
   └─ 2. SÍNTESIS DE GROWTH     → veredicto prescriptivo (punto único validado,
                                  gaps, dirección estratégica). Caduca por era/números.

   → ESTOS DOS alimentan al Agente de Diseño del Brandbook,
     que los combina con lo que NO sale del 360:
     logos · tipografía · imágenes · sesiones de foto · paleta visual · texturas
```

> El análisis 360 produce **inteligencia textual**, no el brandbook. El brandbook nace después, cuando el Agente de Diseño cruza estos dos documentos con la capa visual y de assets (que entra por otro flujo).

## Dos flujos separados, no uno

```
FLUJO A — Conversacional          FLUJO B — Administrativo / Data
(la reunión)                      (existe sin la reunión)
   │                                 │
   ▼                                 ▼
Transcripción literal            IDs S4A · distribuidora · Soundcharts · handles
   │                                 │
   ▼                                 ▼
DT-039 Limpiador                 Auditores (Musical lee métricas,
   │                              Redes lee comportamiento social)
   ▼                                 │
Perfilador ——————————————————————————┴——— (todo converge en Sintetizador)
```

> Corrección clave: **la reunión NO alimenta a ningún auditor.** Solo produce el input del Limpiador → Perfilador. Los auditores corren con data administrativa y métricas que existen independientemente de la reunión.

## Contratos de handoff

### Perfilador → Auditor de Mercado (el más crítico):
- `punto_unico`: etiquetado `HIPÓTESIS NO VALIDADA`
- `hipotesis_nicho`: el mercado explícito a estudiar (ej. "trap latino con narrativa emocional, 18-28 bicultural")
- `adyacencias_a_barrer`: nichos vecinos que el perfil NO pidió pero deben revisarse (cláusula anti-eco)
- `tipo_dominante`: orienta qué buscar

### Perfilador → Sintetizador:
- Perfil completo en variables (esquema del Sistema de Perfilamiento) + `coherencia_interna` (score + evidencia)

### Auditores → Sintetizador:
- Data en formato uniforme. Hechos, no opiniones. Cada métrica con fuente y fecha.

## Reglas de separación (invariantes — no negociables)

1. **Los auditores recolectan hechos. No juzgan.** "Hay competencia X" sí; "no hay vacío" no (eso es juicio = Sintetizador).
2. **El Perfilador es cualitativo puro.** No toca números. Cita evidencia textual para todo.
3. **Solo el Sintetizador cruza y dictamina.** Vacío, defendibilidad, gaps, veredicto: todo aquí.
4. **Soundcharts, doble mandato sin solape:** Musical extrae filas de *tu artista*; Mercado extrae filas de *competencia/nicho*. Misma fuente, objetos distintos.
5. **El Perfilador orienta pero no encarcela al Auditor de Mercado.** El mandato anti-eco protege contra la cámara de eco que solo confirma lo que el artista ya creía.

## Los 4 ángulos de audiencia

| Ángulo | Quién lo produce | Qué responde |
|---|---|---|
| Audiencia **real** | Auditor Musical/Redes | ¿Quién lo escucha hoy? |
| Audiencia **deseada** | Perfilador | ¿A quién *quiere* hablarle? |
| Norma del **nicho** | Auditor Mercado | ¿A quién atrae la competencia? |
| Perfil de **cliente real** | Sintetizador | El cruce de los tres → retrato accionable |

> El error recurrente es mandar todo "al de mercado porque es audiencia". Se divide por *operación y fuente*, no por *tema*.

## Entregables finales

El análisis 360 produce **2 documentos de salida** (no el brandbook):

**1. CONTEXTO DEL ARTISTA** — descriptivo, reutilizable, estable.
Agrega los hechos: identidad + coherencia (Perfilador) + salud algorítmica (Auditores Redes/Musical) + entorno de mercado (Auditor Mercado). Describe con evidencia, no dictamina. Sirve para brandbook, cotización, pitch, onboarding de equipo.

**2. SÍNTESIS DE GROWTH** — prescriptivo, caduca por era/números.
La lectura estratégica que el Sintetizador concluye del contexto: punto único validado (✓/⚠️/✗), gaps (percepción-data, real-deseada), perfil de cliente real, dirección y riesgo.

> **Por qué separados:** el Contexto cambia poco; la Síntesis caduca cuando cambian los números o la era. Fundidos, actualizar la estrategia obliga a reescribir el contexto que no cambió.

### Qué NO produce el 360
Logos, tipografía, imágenes, sesiones de foto, paleta visual, texturas. Eso entra por otro flujo. El **Agente de Diseño del Brandbook** toma los 2 documentos de salida + la capa visual y recién ahí construye el brandbook.

---

## Runbook: usar el sistema, paso a paso

**1. Antes de la reunión.**
Corre el router de tipología con lo que sepas del artista → decide qué anzuelos de la Guía v2 priorizar. Configura el notetaker para **transcripción literal** (no solo resumen).

**2. La reunión.**
Conducís con la Guía v2. Produce: transcripción literal (input del sistema) + resumen (solo para tu overview, NO entra a ningún agente).

**3. Limpieza — DT-039.**
La transcripción cruda entra al Limpiador: quita ruido, corrige nombres/términos, etiqueta `[ARTISTA]`/`[ENTREVISTADOR]`. Sale transcripción confiable. *Sin este paso, la regla de evidencia del Perfilador es humo.*

**4. Fase 1 — recolección (en paralelo, sin dependencias entre sí).**
- Perfilador → transcripción limpia → perfil + punto único (hipótesis) + `hipotesis_nicho` + coherencia.
- Auditor Musical → métricas de S4A/distribuidora/Soundcharts → hallazgos. **No recibe nada de la reunión.**
- Auditor Redes → analytics sociales → hallazgos. **No recibe nada de la reunión.**

> Los IDs y accesos que los auditores necesitan son data administrativa que ya tenés o pedís por fuera. No son parte del flujo de la reunión.

**5. Fase 2 — Auditor de Mercado.**
Se dispara con la `hipotesis_nicho` del Perfilador. Confirma el nicho + barre adyacencias (anti-eco). Ni antes ni en paralelo: sin perfil arrancaría a ciegas.

**6. Fase 3 — Sintetizador.**
Recibe los 4 outputs. Cruza, juzga (vacío, defendibilidad, gaps). Produce los **2 documentos de salida**: Contexto del Artista + Síntesis de Growth.

**7. Handoff al diseño.**
Los 2 documentos + la capa visual (logos, tipografía, imágenes, paleta — que NO salen del 360) entran al Agente de Diseño del Brandbook → `CONTENT.md` → Fase 3 del Brand Book Protocol → brandbook HTML.

### Una línea para recordarlo
La reunión produce **transcripción** (→ Limpiador → Perfilador). La data de acceso y las métricas viven **fuera** de la reunión y van directo a los auditores. El Sintetizador produce **2 documentos** (Contexto + Síntesis); el brandbook se construye después con eso + la capa visual.

---

*Growth\*Stars — Análisis 360 v1.2 · salida = Contexto del Artista + Síntesis de Growth (alimentan al Agente de Diseño, no son el brandbook)*
