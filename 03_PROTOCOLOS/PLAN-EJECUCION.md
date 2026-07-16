# PLAN DE EJECUCIÓN G*S — deuda técnica ordenada por dependencia

> Documento **vivo**. Creado 2026-07-16. Se ejecuta entre sesiones.
> Fuente: `03_PROTOCOLOS/deudas-tecnicas/REGISTRO-DEUDA-TECNICA.md` + `03_PROTOCOLOS/decisions/REGISTRO-DECISIONES.md`
> **Regla:** al cerrar un ítem se marca en el REGISTRO (no solo acá) el mismo día. Un registro que miente vale menos que no tener registro.

## Cómo está ordenado

No por número de DT ni por antigüedad. Por **tres criterios, en este orden**:

1. **Qué desbloquea.** Un ítem que libera a otros tres va primero aunque duela menos.
2. **Qué está costando HOY.** Sangrar ahora > riesgo futuro.
3. **Qué comparte infraestructura.** Montar n8n una vez sirve a tres DT; hacerlas separadas lo monta tres veces.

**El hallazgo que reordenó todo:** los ~28 ítems abiertos no son una lista plana. Son **5 cadenas**. Ejecutar una cadena entera de una vez es más barato que picotear ítems sueltos de cadenas distintas, porque cada cadena comparte contexto, infra y decisiones.

---

## CADENA 1 — PLATA
> *Qué cuesta no hacerla:* el dashboard te miente sobre tu propio revenue. Es la única cadena que toca decisiones de negocio directas.

| # | Ítem | Qué hace | Ejecuta |
|---|---|---|---|
| 1.1 | **D-102** | Devengo (Pendiente+Abonado+Pagada), métrica "Por cobrar", eliminar revenue lifetime, switch de estado escribiendo en el `.md` | CTO Jr |
| 1.2 | **DT-055** | Definir "proyecto del mes" (FK proyecto→mes). D-102 lo resuelve en parte: si el revenue entra por devengo, el mes del contrato queda definido | CTO Jr |
| 1.3 | **DT-029** | Tracking de cobros/pagos por proyecto + alertas de vencimiento | CTO Jr |
| 1.4 | **DT-028** | Gráfica de revenue histórico (chart mensual, cards USD/COP, mini-tabla) | CTO Jr |

**Por qué en este orden:** 1.1 define la semántica del revenue. Sin eso, 1.3 y 1.4 grafican y alertan sobre una definición que va a cambiar → retrabajo garantizado. **DT-029 es la contracara obligatoria de D-102**: el devengo muestra plata firmada que no entró; sin aging ni alertas, esa card se vuelve peligrosa cuando crezcas.

---

## CADENA 2 — MEMORIA OPERATIVA
> *Qué cuesta no hacerla:* estás perdiendo reuniones AHORA (Chimbita y Marlon, varios días). Y como el cierre de mes es archive-first, cada reunión no registrada es un agujero silencioso en el informe.

| # | Ítem | Qué hace | Ejecuta |
|---|---|---|---|
| 2.0 | **Backlog manual** | Subir a mano las reuniones atrasadas de Chimbita y Marlon. D-101 previene el próximo atraso, no cura este | Ian + Kimi |
| 2.1 | **n8n operativo** | Infra compartida. Requiere Node ≤22 (nvm-windows ya instalado) | Ian/Kimi |
| 2.2 | **DT-040** (Alta) | Pipeline Drive → `.md` → bitácora. Ruteo por convención, idempotente, bandeja de pendientes si es ambiguo (D-101) | Kimi |
| 2.3 | **DT-039** | Limpiador de transcripción — sanea el crudo del notetaker | Kimi |
| 2.4 | **DT-035** | Meetings Hub + Google Calendar + vista interna de reunión | CTO Jr |
| 2.5 | **DT-042** | Informe mensual de entrega (.md) — compila objetivos, entregables, reuniones, misiones → narrativa | Kimi |
| 2.6 | **DT-044** | Activar jerarquía D-099: Órgano de Control + primer Jefe de Área + primer Loop de cierre de mes | CTO + Ian |

**Por qué en este orden:** es una cadena literal. **DT-042 no puede compilar un informe de reuniones que no están archivadas** (2.2), y **DT-044 no puede orquestar un cierre cuyo informe no existe** (2.5). Empezar por DT-044 —lo más vistoso— sería construir el techo antes que los cimientos.
**Sinergia:** 2.1 (n8n) también habilita **DT-030** (TRM semanal automático) sin trabajo extra. Se hace de paso.

---

## CADENA 3 — INTELIGENCIA (SOP Análisis 360)
> *Qué cuesta no hacerla:* no podés correr un análisis 360 completo sobre un artista nuevo. Afecta la venta y el onboarding, no la operación de los que ya tenés.

| # | Ítem | Qué hace | Ejecuta |
|---|---|---|---|
| 3.1 | **DT-039** | Limpiador (compartido con 2.3 — se hace una vez) | Kimi |
| 3.2 | **DT-036** | Programar el Perfilador — agente cualitativo completo | CTO Jr / Antigravity |
| 3.3 | **DT-037** | Auditor de Mercado (fase 2) — entorno, competencia, nicho. Motor: Antigravity | Antigravity |
| 3.4 | **DT-038** | Guarda de dependencia de fase: no correr Auditor sin perfil válido | CTO Jr |

**Por qué en este orden:** **DT-036 bloquea a DT-037, DT-038 y al Sintetizador** — es el cuello más apretado de esta cadena. DT-038 va última por definición: una guarda protege un flujo que debe existir primero (poner el guardia antes de construir la casa fue exactamente el error que rechazamos el 2026-07-15).
**Nota:** DT-039 sirve a las cadenas 2 y 3. Se hace una vez, en la que llegue primero.

---

## CADENA 4 — HIGIENE Y RIESGO
> *Qué cuesta no hacerla:* nada hoy, todo el día que explote. Es la cadena que se paga sola cuando entra el CTO profesional (>4 clientes).

| # | Ítem | Qué hace | Ejecuta |
|---|---|---|---|
| 4.1 | **Registro al día** | Marcar DT-020 y DT-046 como cerradas (Kimi las hizo, no las marcó). Corregir la traza de DT-052 | Kimi |
| 4.2 | **RLS del portal** | El `artist-portal.html` lee 7 tablas base con anon key desde el navegador. Auditar y cerrar con RLS | CTO Jr |
| 4.3 | **DT-041** | Stabilization: E2E + schema validation + guardrails. **Parcial**: Kimi dejó smoke tests 5/5 | Kimi |
| 4.4 | **DT-048** | Tapar con 410 el endpoint legacy `POST /api/mgmt/close-month` | CTO Jr |
| 4.5 | **DT-026** | Extraer `getAgentDir()` — ruta BOVEDA duplicada en closeBatch y saveAgentOutput | Kimi |
| 4.6 | **DT-024** | Huérfanos en Supabase Storage al reemplazar adjunto | Kimi |
| 4.7 | **DT-023** | UI para listar/re-abrir lotes de prensa (`press_batches`) | CTO Jr |
| 4.8 | **DT-047** | Data de clientes en GitHub Pages público. **Riesgo asumido** — se ejecuta al pasar de 4 clientes | CTO profesional |
| 4.9 | **DT-004** | fire-and-forget se rompe en serverless. Inactiva hasta que se deploye (D-100: stateless first) | — |

---

## CADENA 5 — SNIPPETS
> *Qué cuesta no hacerla:* el testing de snippets sigue siendo manual. Los triggers que Ian mismo definió deben verificarse antes de arrancar.

| # | Ítem | Trigger declarado | Ejecuta |
|---|---|---|---|
| 5.1 | **DT-031** | Estratega de Snippets. Triggers: publicación consistente + cuello de botella manual + ≥2 artistas | CTO Jr |
| 5.2 | **DT-032** | Tablas Supabase (formatos global + ideas/snippets/ledger per-artist) | CTO Jr |
| 5.3 | **DT-033** | Automatización del audit. Trigger propio: **suscripción Soundcharts activa** | Kimi |
| 5.4 | **DT-034** | Feedback loop (ponderación por ganadores del ledger). Requiere meses de data | — |

**Verificar antes de arrancar:** el trigger de ≥2 artistas **ya se cumple** (Reckless + Marlon). Falta confirmar publicación consistente. **DT-034 no puede ir antes que 5.1-5.3**: pondera sobre un ledger que todavía no existe.

---

## Diferidas por decisión, no por olvido

| Ítem | Por qué espera | Se revisa cuando |
|---|---|---|
| **DT-045** | Los cierres se generan ARCHIVE-FIRST desde los `.md`. Estas tablas son para VISUALIZAR, no para producir el informe | El informe exista y se quiera ver en el dashboard |
| **DT-043** | Modelo de 3 cerebros (Antigravity/Claude/Kimi) — la convención se está formando sola en la práctica | Haya un choque real de dominios |
| **DT-025** | Commit no atómico ya ocurrido. Asumida, no se reescribe historia | — |
| **vida-ian** | Congelado por decisión de Ian | Llegue el Mac Mini (24/7) |
| **CLAUDE.md + Graphify** | Auditoría de carga de contexto + knowledge graph para ahorrar tokens | Próxima sesión (ver `next-session-decisions`) |

---

## Secuencia sugerida entre sesiones

| Sesión | Foco | Por qué |
|---|---|---|
| **Hoy** | Cerrar features del sello (CTO Jr) + **4.1** registro al día | Terminar lo abierto antes de abrir lo nuevo |
| **S+1** | **Cadena 1 completa** (D-102 → DT-055 → DT-029 → DT-028) | Es la que toca tu plata y ya está decidida — cero discusión pendiente |
| **S+2** | **2.0 + 2.1 + 2.2** (backlog + n8n + pipeline Drive) | Corta la hemorragia de reuniones. n8n habilita DT-030 gratis |
| **S+3** | **2.3 → 2.5** (Limpiador → Meetings Hub → Informe mensual) | Con bitácoras completas, el informe ya tiene de qué compilarse |
| **S+4** | **2.6 (DT-044)** — jerarquía D-099 + primer Loop | Los cimientos ya están: hay informe que orquestar |
| **S+5** | **Cadena 3** (Perfilador → Auditor → Guarda) | Desbloquea el 360 para artistas nuevos |
| **S+6** | **Cadena 4** (higiene) y **Cadena 5** (snippets) según triggers | — |

**Regla de la secuencia:** no se abre una cadena nueva con la anterior a medias. Picotear entre cadenas es lo que produjo tres tandas sin commitear el 2026-07-15.
