# Auditoría Musical — Marlon Villamil

> **Agente 2 — Audit Música y Distribución · G\*S**
> Fecha: 2026-07-18
> Artista: Marlon Villamil (Chimbita Records) · Producto contratado: MGMT
> Analista: Music Business Analyst Senior (IC450)
> Fuente única disponible: **SoundOn — Artist Insights** (distribuidora TikTok), rango 365d y 90d

---

## 0. CONFIRMACIÓN DE FUENTES Y RANGOS TEMPORALES

| Fuente esperada (metodología G\*S) | Disponible | Detalle |
|---|---|---|
| Spotify for Artists (S4A) nativo | **NO** | Sin capturas. Save rate por track, source of streams, listener segments, discovered-on, playlists NO calculables |
| Soundcharts (benchmark competitivo) | **NO** | Sin similar artists, sin head-to-head, sin histórico de playlists, sin career stage |
| Distribuidora — **Earnings** | **NO** | Las capturas son de **Artist Insights (analytics)**, NO del tab "Analytics & Earnings". Cero cifras en USD |
| Distribuidora — **Insights (analytics)** | **SÍ** | SoundOn: streams, TikTok sound performance, demografía Spotify+TikTok, streams by region, completion rate |

**Advertencia estructural (crítica):** de las 3 fuentes de la metodología (S4A + Soundcharts + Distribuidora) solo tengo **1 parcial** — el módulo de *analytics* de SoundOn. **No hay datos económicos de ningún tipo** (ni earnings, ni RPS, ni splits, ni per-release). Por lo tanto la **Fase 3 (Análisis económico) NO se puede ejecutar** y las Fases 1-2 se ejecutan de forma parcial usando proxies de distribuidora, no datos nativos S4A/Soundcharts.

**Datos validados como ground truth por Ian:** métricas de streams/TikTok (confianza alta) y demografía género/regiones Spotify+TikTok (usada tal cual pese a marca "verificar" del extractor).

---

## 1. RESUMEN EJECUTIVO

Marlon Villamil es un artista **emergente en pleno pico de viralización reciente y aún no consolidado**. El dato que domina toda la lectura: **el 95% de sus streams de los últimos 365 días (28.9K de 30.3K) ocurrieron en los últimos 90 días**, disparados por un evento viral en TikTok en abril 2026 (streams 90d +1890.5%, listeners 90d +1483.1%, views TikTok 90d +489%). No es un catálogo con tracción sostenida: es una **primera chispa** que hay que capitalizar antes de que decaiga.

**Top 3 hallazgos críticos:**
1. **Dependencia total de un único evento viral** — sin base previa; toda la tracción vive en una ventana de 90 días y el gráfico intra-90d ya muestra decaimiento.
2. **El motor TikTok→Spotify FUNCIONA pero a escala pequeña** — 199.4K views de sonido (90d) convirtieron a 28.9K streams; la tubería existe, falta volumen y repetición.
3. **Retención imposible de verificar** — SoundOn reporta Saves=0 (casi seguro un vacío de tracking, no un 0 real) y no hay S4A; el indicador #1 de PODERES (save rate) queda a ciegas.

**Veredicto:** proyecto **a optimizar / en construcción temprana** — hay una señal orgánica real que capturar, pero sin S4A ni earnings no se puede certificar salud de retención ni salud económica.

**Tier observado desde Spotify:** **Tier 1 — Emergente** (con caveat: no hay oyentes mensuales nativos de Spotify; ver §8).

**Pre-evaluación PODERES (3 criterios que evalúo):** **0 de 3 confirmados** — C1 y C2 = Datos faltantes; C3 (crecimiento) = componente distribuidora positivo pero no certificable como sostenido.

---

## 2. SCORECARD GENERAL DEL PROYECTO MUSICAL

| Dimensión | Score (1-5) | Notas |
|---|---|---|
| Salud del catálogo | 2 | Sin desglose per-track; toda la tracción en un evento; sin long tail |
| Retención de música (save/skip) | **N/E** | No evaluable — sin S4A y Saves=0 no confiable |
| Calidad de fuentes de stream | 2 | Sin source-of-streams nativo; proxy: streams siguen a la viralidad TikTok (discovery, no listener-active) |
| Posicionamiento competitivo | **N/E** | No evaluable — sin Soundcharts |
| Diversificación de plataformas | **N/E** | No evaluable — sin desglose por DSP ni earnings |
| Salud económica | **N/E** | No evaluable — cero datos de earnings |
| Estrategia de playlists | **N/E** | No evaluable — sin datos de playlists |

**Score total:** no computable (5 de 7 dimensiones sin datos). **Interpretación:** la auditoría está severamente limitada por falta de inputs. Lo poco medible apunta a un artista Tier 1 con un pico de discovery reciente y salud de retención/economía **desconocida**.

---

## 3. DIAGNÓSTICO DE CATÁLOGO (proxy SoundOn — S4A no disponible)

### 3.1 Volumen y trayectoria
| Métrica | 365d | 90d | % del total en 90d |
|---|---|---|---|
| Streams | 30.3K | 28.9K | **95.4%** |
| Listeners | 15.0K | 14.1K | **94.0%** |
| Saves | 0 | 0 | — (dato no confiable) |

**Lectura:** artista sin historia de consumo relevante antes de abril 2026. El pico (gráfico) se concentra entre **2026-04-06 y 2026-05-09**, con caída posterior. Es un **spike de novedad**, no crecimiento acumulativo.

### 3.2 Ratio streams/listener (proxy repeat-listen, UCT-02)
- 90d: 28.9K streams / 14.1K listeners = **~2.05 streams por listener**.
- Lectura: repetición baja. Consumo mayormente de descubrimiento único, poca reescucha. Señal temprana de que la canción **atrae pero no fideliza** — pero es un **proxy crudo**, no el UCT-02 nativo de S4A.

### 3.3 Completion rate (UAU-01)
- **69%** (ventana 2026-06-16 a 2026-07-14) vs benchmark UAU-01 **>70%**.
- Estado: **justo por debajo del umbral** (gap −1pp). Al filo. No es alarma pero tampoco fortaleza.

### 3.4 Save rate por canción (UCT-01) — **input crítico PODERES C1**
- **NO CALCULABLE.** SoundOn reporta Saves=0 en 365d y 90d, lo cual con 30K streams es estadísticamente inverosímil de forma orgánica → se trata casi con certeza de un **vacío de tracking de SoundOn**, no de retención real cero.
- **Pendiente: falta S4A nativo.** Sin él no hay save rate por track ni promedio de catálogo.

### 3.5 Skip rate — **input crítico PODERES C2**
- **NO CALCULABLE.** SoundOn no expone skip rate. Único proxy indirecto: completion 69% ⇒ ~31% de reproducciones no se completan, lo que *sugiere* abandono cerca del umbral de 30%, pero **completion ≠ skip rate** y no es sustituto válido.
- **Pendiente: falta S4A nativo.**

### 3.6 Audiencia — demografía Spotify (validada por Ian)
- **Género:** Female **69.53%** / Male 23.33% / Unknown 7.14% → audiencia marcadamente femenina.
- **Edad:** 23-27 (~43%) + 18-22 (~34%) + 28-34 (~14%) → **77% entre 18 y 27 años**. Núcleo joven-adulto, coherente con indie pop urbano.

### 3.7 Geografía de streams (365d / 90d)
| País | Streams 365d | Streams 90d |
|---|---|---|
| CO – Colombia | 40.53% | 39.75% |
| MX – México | 22.83% | 22.88% |
| US – Estados Unidos | 8.54% | 8.72% |
| ES – España | 4.91% | 5.05% |
| CL – Chile | 4.88% | 5.06% |
| EC – Ecuador | 3.30% | 3.31% |

**Nota de coherencia con contexto:** el contexto lo registra como artista **MX / CDMX**, pero el consumo real es **liderado por Colombia** (40%+), consistente con que Chimbita Records es sello colombiano. México igual es un segundo mercado fuerte (22.8%). Geografía **estable** entre 365d y 90d → el pico no distorsionó el mix por país.

---

## 4. POSICIONAMIENTO COMPETITIVO (Soundcharts) — NO DISPONIBLE

Sin datos de Soundcharts no puedo evaluar: career stage, comparativa head-to-head con referentes, gap competitivo, growth vs similar artists, chart positions, radio/prensa, ni histórico de playlists.

**Único componente cubierto — Performance del sonido en TikTok** (vía SoundOn, cumple parcialmente el rol de Soundcharts para el sonido):

| Métrica sonido TikTok | 365d | 90d | Growth 90d |
|---|---|---|---|
| Videos (UGC) | 160 | 118 | +181.0% |
| Views | 233.3K | 199.4K | +489.0% |
| Likes | 25.9K | 20.7K | +301.3% |
| Shares | 572 | — | — |
| Comments | 468 | — | — |
| Favorites | 236 | — | — |

- **Views por video (90d):** 199.4K / 118 ≈ **1,690 views/video** — alcance modesto por pieza; la viralidad es agregada (muchos videos pequeños), no un video-bomba.
- **Like rate (90d):** 20.7K / 199.4K ≈ **10.4%** — engagement de sonido sano.
- **Categoría de contenido:** ~50% "Unknown" + ~40% "Lipsync" → el UGC es dominantemente **lipsync**, típico de sonido que engancha para dueto/mímica. Buena señal de "usabilidad" del sonido.
- **Demografía creadores TikTok:** Female **81.48%**, idioma español ~85%, Colombia **69.81%** de creadores.

**Potencial de viralidad detectado: SÍ, ya materializado y en decaimiento.** El sonido tuvo su momento; la ventana para reactivarlo con estrategia está abierta pero cerrándose.

---

## 5. ANÁLISIS ECONÓMICO (Distribuidora) — NO EJECUTABLE

**Cero datos económicos disponibles.** Las capturas son del módulo analytics de SoundOn, no del tab Earnings. No se puede reportar ni estimar:

- Earnings 12 meses / lifetime → **Datos faltantes**
- RPS por plataforma (Spotify, Apple, YT Music, Amazon, TikTok, Meta) → **no calculable** (sin earnings ni streams por DSP)
- Distribución de ingresos por plataforma → **Datos faltantes**
- Geografía económica (país por ingresos) → **Datos faltantes**
- Performance económico por release → **Datos faltantes**
- Long tail económico → **Datos faltantes**
- Sync / publishing / royalties TikTok-Meta → **Datos faltantes**
- **Splits configurados por canción → Datos faltantes (riesgo legal no auditable)**

**Decisión bloqueada:** no se puede validar el componente-ingresos de PODERES C3, ni evaluar sustentabilidad económica del proyecto, ni detectar plataformas subexplotadas, ni riesgo de dependencia de un solo DSP. **Se requiere acceso al tab Earnings de SoundOn (o export CSV de la distribuidora real del sello).**

---

## 6. CRUCES CRÍTICOS ENTRE FUENTES

Solo 2 de los 5 cruces de oro son parcialmente posibles (el resto requiere S4A/earnings/Soundcharts ausentes).

| # | Cruce | ¿Posible? | Hallazgo |
|---|---|---|---|
| 1 | Streams Spotify vs ingresos Spotify | **NO** | Sin earnings |
| 2 | Top cities S4A vs top países distribuidora | Parcial | Streams CO 40% / MX 23% coherentes; falta ciudades S4A |
| 3 | Playlists (Soundcharts) vs source of streams (S4A) | **NO** | Sin ambas fuentes |
| 4 | Crecimiento oyentes vs crecimiento ingresos | **NO** | Sin ingresos |
| 5 | **Sonido TikTok vs streams Spotify** | **SÍ** | Ver abajo |

**Cruce 5 (el único fuerte) — Sonido TikTok → Streams:**
- 90d: **199.4K views de sonido** (+489%) coinciden temporalmente con **28.9K streams** (+1890.5%). Ambos picos son simultáneos (abril 2026).
- **Interpretación:** la tubería TikTok→Spotify **está abierta y convierte** — el sonido mueve streams. NO hay cuello de botella estructural; hay **cuello de botella de volumen y de repetición** (crecen juntos pero desde base baja y con reescucha ~2x).
- **Decisión recomendada:** priorizar **reactivación del sonido en TikTok** (más UGC, retos de lipsync que ya funcionan) porque el canal demostró que traduce a streams — pero acompañarlo de mecánica de retención en Spotify (save/playlist), hoy invisible.

**Cruce demográfico (parcial, apoya coherencia para Agente 1):** Female TikTok 81.5% vs Female Spotify 69.5% → **misma dirección** (audiencia femenina) en ambas plataformas. Colombia lidera en ambas (TikTok 69.8% creadores / streams 40.5%). México **sobre-convierte a streams** (13.8% creadores TikTok → 22.8% de streams). Coherencia demográfica preliminar **positiva** (el Sintetizador/Agente 1 confirma C4).

---

## 7. APLICACIÓN DE TRIGGERS — SISTEMA v2.3 (Benchmarks Tier 1, Modo Estándar)

| Trigger | Ref | Baseline actual | Benchmark Estándar T1 | Estado | ¿Supera PODERES? |
|---|---|---|---|---|---|
| Completion Rate Spotify | UAU-01 | 69% | >70% | 🔴 (−1pp, al filo) | No |
| Canvas activo | UAU-02 | Desconocido | Configurado | N/E | — |
| Save Rate (CRÍTICO) | UCT-01 | No medible (Saves=0 no confiable) | >18% | **N/E** | No verificable |
| Repeat-Listen ratio | UCT-02 | ~2.05 streams/listener (proxy) | — | ⚠️ bajo (proxy) | No |
| Pre-save conversion | UCT-03 | N/A | — | N/A | — |
| Playlist adds orgánicas | UCT-04 | Sin dato | Calibrado T1 | N/E | — |
| Marquee CTR | UCT-05 | N/A (T1) | Solo T2+ | N/A | — |
| Pre-saves totales | MOC-05 | Sin dato | Calibrado T1 | N/E | — |
| Release Radar / DW (histórico) | IE-01 | Sin dato | — | N/E | — |
| Shazam Viral/Top (histórico) | IE-02 | Sin dato | — | N/E | — |

**Único trigger con lectura clara:** UAU-01 completion 69% justo bajo umbral. Todo lo demás es **no evaluable por falta de S4A**.

---

## 8. PRE-CLASIFICACIÓN DE TIER DESDE SPOTIFY

- **Oyentes mensuales de Spotify (nativo): NO DISPONIBLE.** SoundOn reporta "Listeners 15.0K en 365d" — esto es **listeners acumulados a 365 días agregados**, NO oyentes mensuales (ventana rodante de 28 días). No son equivalentes.
- Dado que el 94% de esos listeners se concentran en un pico viral de 90d que **ya está decayendo**, los oyentes mensuales actuales reales de Spotify están casi con certeza en el rango de **pocos miles**, muy por debajo de 15K.
- Aplicando **principio conservador** (regla de ambigüedad del clasificador): incluso en el escenario más generoso (15K = frontera T1/T2), se toma el tier más bajo.

**TIER OBSERVADO DESDE SPOTIFY: Tier 1 — Emergente.**

**Justificación:** catálogo en construcción, sin base previa al pico, retención no verificada, sin oyentes mensuales nativos que superen 15K de forma sostenida. Coincide con el Tier 1 registrado en el contexto del artista.

> **Nota:** El Sintetizador (Agente 3) determinará el tier final cruzando con el Agente 1 (TikTok). La regla es "tomar el tier más bajo entre Spotify y TikTok".

---

## 9. PRE-EVALUACIÓN DE CRITERIOS PODERES (3 de 7)

| # | Criterio | Evaluación | Evidencia | Resultado |
|---|---|---|---|---|
| 1 | Save rate histórico >12% últimos 3 releases | No hay S4A ni desglose per-release; SoundOn Saves=0 no confiable | Save rate por track: no disponible | **Datos faltantes** |
| 2 | Skip rate <30% catálogo | No hay skip rate; único proxy completion 69% (~31% no completa), insuficiente | Skip rate por track: no disponible | **Datos faltantes** |
| 3 | Crecimiento orgánico positivo 90d | Componente distribuidora/streams claramente positivo, pero es pico viral en decaimiento, no crecimiento sostenido | Streams 90d +1890.5%, Listeners +1483.1%, Views TikTok +489% | **Parcial ✅ (componente distro) — con caveat** |

**Resultado agregado:** de los 3 criterios que evalúo, **0 confirmados netos**. C1 y C2 a ciegas por falta de S4A. C3 positivo en su componente de distribuidora pero **no certificable como sostenido** — el Sintetizador debe cruzarlo con S4A y con la lectura de TikTok del Agente 1 antes de darlo por válido.

---

## 10. HALLAZGOS CRÍTICOS

1. **Dependencia total de un único evento viral (CRÍTICA).** 95% de streams y 94% de listeners de 365d ocurren en los últimos 90d, con el pico en abril 2026 y decaimiento posterior. Evidencia: SoundOn 365d vs 90d + curva de tendencia. Impacto: sin acción, la tracción se disipa y el artista vuelve a base cero.

2. **La tubería TikTok→Spotify funciona pero a escala pequeña (ALTA).** Cruce 5: 199.4K views de sonido convierten a 28.9K streams simultáneamente. Evidencia cruzada: TikTok sound + streams SoundOn. Impacto: el canal de crecimiento está validado; el problema es volumen y repetición, no estructura.

3. **Retención no verificable — punto ciego del negocio (CRÍTICA).** Save rate y skip rate (los dos criterios PODERES 1 y 2, indicadores #1 de si la música engancha) no se pueden medir sin S4A. Evidencia: Saves=0 no confiable + completion 69% al filo + repeat ~2x. Impacto: **no se puede certificar que la música fidelice**; es el dato que más urge conseguir.

4. **Salud económica completamente desconocida (ALTA).** Cero earnings, cero RPS, cero splits. Evidencia: capturas son de analytics, no de Earnings. Impacto: no hay base para decisiones de inversión ni para detectar riesgo legal de co-autorías (Chimbita = sello, casi seguro hay splits que documentar).

5. **Desalineación registro vs consumo real (MEDIA).** Contexto lo registra MX/CDMX, pero el consumo es CO-liderado (40%+) y México segundo (23%). Evidencia: streams by region estable 365d/90d. Impacto: la estrategia de mercado y prensa debe apuntar a Colombia como plaza primaria (coherente con Chimbita), no a México.

---

## 11. RECOMENDACIONES PRIORIZADAS

| Acción | Fuente del hallazgo | KPI que mueve | Timeline | Inversión | Prioridad |
|---|---|---|---|---|---|
| Conseguir acceso S4A nativo (save rate, skip rate, source of streams, playlists) | H3 | Desbloquea UCT-01, PODERES C1/C2 | Inmediato (D0-D7) | Nula (acceso) | **CRÍTICA** |
| Conseguir tab Earnings de SoundOn / CSV de distribuidora del sello | H4 | RPS, ingresos, splits | Inmediato (D0-D7) | Nula (acceso) | **CRÍTICA** |
| Reactivar el sonido en TikTok (más UGC lipsync, reto) antes de que decaiga el pico | H1, H2 | Views sonido → streams | D0-D30 | Baja-media | **ALTA** |
| Instrumentar retención en Spotify (pitch a playlists, CTA de save, Canvas) | H3 | Save rate, playlist adds (UCT-01/04) | D7-D45 | Baja | **ALTA** |
| Reorientar plaza primaria a Colombia (mercado real) en prensa/estrategia | H5 | Concentración geográfica de calidad | D0-D30 | Nula | MEDIA |
| Documentar splits de co-autorías del catálogo | H4 | Riesgo legal | D0-D30 | Nula | MEDIA |

---

## 12. DATOS FALTANTES Y LIMITACIONES

**Faltantes críticos (bloquean decisiones):**
- **S4A nativo** → sin save rate (UCT-01, PODERES C1), skip rate (PODERES C2), source of streams, listener segments, discovered-on, playlists, oyentes mensuales reales, Canvas (UAU-02). *Sin esto no se puede certificar retención ni tier con precisión.*
- **Earnings de distribuidora** → sin RPS, ingresos, diversificación de plataformas, geografía económica, long tail económico, sync/publishing. *Sin esto no hay Fase 3 ni decisiones de inversión.*
- **Splits por canción** → riesgo legal no auditable.
- **Soundcharts** → sin benchmark competitivo, similar artists, career stage, chart positions, histórico de playlists. *Sin esto no hay Fase 2 real.*
- **Desglose per-track y per-release** → no se puede identificar ancla del catálogo ni long tail.

**Confiabilidad de lo disponible:** streams/TikTok/región (alta, ground truth Ian). Saves=0 (baja — tratado como vacío de tracking). Demografía (validada por Ian pese a marca "verificar" del extractor).

---

## 13. INPUTS ESTRUCTURADOS PARA EL SINTETIZADOR (AGENTE 3)

### 13.1 Tier observado desde Spotify
**TIER OBSERVADO DESDE SPOTIFY: Tier 1 — Emergente**
- Oyentes mensuales nativos Spotify: **NO DISPONIBLE** (sin S4A). Proxy SoundOn: 15.0K listeners/365d (94% concentrados en pico 90d en decaimiento ⇒ oyentes mensuales reales estimados en pocos miles).
- Justificación: catálogo en construcción, tracción 100% dependiente de un evento viral reciente, retención no verificada.
- Nota: "El Sintetizador determinará el tier final cruzando con Agente 1 (TikTok)."

### 13.2 Criterios PODERES pre-evaluados (3 de 7)
| # | Criterio | Evidencia | Resultado |
|---|---|---|---|
| 1 | Save rate histórico >12% últimos 3 releases | Sin S4A; SoundOn Saves=0 no confiable | **Datos faltantes** |
| 2 | Skip rate <30% catálogo | Sin skip rate; proxy completion 69% insuficiente | **Datos faltantes** |
| 3 | Crecimiento orgánico positivo 90d | Streams +1890.5%, Listeners +1483.1%, Views TikTok +489% (pico viral en decaimiento) | **✅ parcial (componente distro) — no certificado sostenido** |

Criterios que NO evalúa este agente: C4 (coherencia demográfica — Agente 1; aporto cruce parcial positivo), C5 (presupuesto — cliente), C6 (disponibilidad — Agente 1), C7 (identidad visual — Agente 1).

### 13.3 Triggers musicales — baseline
| Trigger | Ref | Baseline | Benchmark T1 | ¿Supera PODERES? | Estado |
|---|---|---|---|---|---|
| Completion rate | UAU-01 | 69% | >70% | No | 🔴 al filo |
| Canvas activo | UAU-02 | Desconocido | Configurado | — | N/E |
| Save rate | UCT-01 | No medible | >18% | No verificable | N/E |
| Repeat-Listen | UCT-02 | ~2.05x (proxy) | — | No | ⚠️ |
| Pre-save conv. | UCT-03 | N/A | — | — | N/A |
| Playlist adds | UCT-04 | Sin dato | Calibrado T1 | — | N/E |
| Marquee CTR | UCT-05 | N/A | Solo T2+ | — | N/A |
| Pre-saves totales | MOC-05 | Sin dato | Calibrado T1 | — | N/E |

### 13.4 Top 3 hallazgos del ecosistema musical
1. **Dependencia total de un evento viral** — 95% streams y 94% listeners en 90d (SoundOn 365d vs 90d) — Prioridad: CRÍTICA.
2. **Tubería TikTok→Spotify validada a baja escala** — 199.4K views sonido ↔ 28.9K streams simultáneos (cruce sonido TikTok + streams) — Prioridad: ALTA.
3. **Retención no verificable** — sin S4A, Saves=0 no confiable, completion 69%, repeat ~2x — Prioridad: CRÍTICA.

### 13.5 Triggers con fugas detectadas
- UAU-01 (Completion): 69% vs >70% → gap −1pp.
- UCT-02 (Repeat-listen, proxy): ~2.05 streams/listener → reescucha baja.

### 13.6 Triggers con fortalezas
- Ninguno confirmado (todos los medibles están al filo o por debajo; los que serían fortaleza requieren S4A ausente).

### 13.7 Demografía y geografía Spotify
- Edad top: **18-27** (23-27 ~43% + 18-22 ~34%).
- Género: **Female 69.5% / Male 23.3% / Unknown 7.1%**.
- Top 3 países (streams): CO 40.53%, MX 22.83%, US 8.54%.
- Top 3 ciudades: **no disponible** (sin S4A).

### 13.8 Economía del proyecto
- Ingresos 12 meses: **Datos faltantes** (capturas son analytics, no Earnings).
- RPS promedio Spotify: **no calculable**.
- Plataforma top en ingresos: **Datos faltantes**.
- Plataforma subexplotada: **Datos faltantes**.
- Ingresos vs benchmark tier: **no evaluable**.

### 13.9 Riesgos de negocio
- Splits sin documentar: **desconocido** (sin datos; con sello Chimbita, asumir que hay que documentarlos → riesgo latente).
- Dependencia de plataforma única: **no evaluable** por DSP; pero **dependencia de un único evento viral = riesgo crítico confirmado**.
- Dependencia editorial: no evaluable (sin source of streams).
- Sync/publishing pendiente: **Datos faltantes**.

### 13.10 Performance del sonido en TikTok
- UGC histórico: **160 videos** (365d) / 118 (90d, +181%).
- Views agregados: **233.3K** (365d) / 199.4K (90d, +489%).
- Like rate 90d: ~10.4%. Categoría dominante: Lipsync (~40%).
- ¿Potencial de viralidad?: **SÍ — ya materializado y en decaimiento**; ventana de reactivación abierta.
- ¿Fuga TikTok→Spotify?: **NO estructural** — el canal convierte (cruce 5); limitante es volumen y repetición, no fuga.

### 13.11 Indicadores de Éxito históricos
| IE | Ref | Histórico | Detalle |
|---|---|---|---|
| Release Radar / DW | IE-01 | Sin dato | Requiere S4A |
| Shazam Viral/Top | IE-02 | Sin dato | Requiere Soundcharts |

### 13.12 Datos faltantes críticos (para el Sintetizador)
1. **S4A nativo** — bloquea PODERES C1/C2, UCT-01, tier preciso, playlists, source of streams. *Sin esto, la recomendación de modo (Estándar/PODERES) queda incompleta.*
2. **Earnings de distribuidora + splits** — bloquea toda la Fase 3 económica y el componente-ingresos de C3.
3. **Soundcharts** — bloquea benchmark competitivo (Fase 2) y IE-01/IE-02.
4. **Desglose per-track / per-release** — bloquea identificación de ancla y long tail.

---

*Auditoría limitada por disponibilidad de fuentes. Ejecutada con 1 de 3 fuentes (SoundOn analytics parcial). Prioridad operativa #1: conseguir acceso a S4A nativo y al tab Earnings antes de la síntesis del Agente 3.*
