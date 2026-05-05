# Sistema de Triggers Algorítmicos G*S — Versión Calibrada v2.3

> **Documento maestro de referencia para el equipo de Growth*Stars**
>
> Este documento reemplaza al SancorBrain Standard V8 (marzo 2026) y consolida el sistema de triggers algorítmicos calibrado por tier de artista, con calendario de activaciones integrado al SOP de lanzamiento de G*S. Incluye sistema dual de benchmarks (Modo Estándar y Modo PODERES), árbol de decisión de 3 escenarios y protocolo de crisis con 5 casos.
>
> **Versión:** 2.3
> **Última actualización:** Abril 2026
> **Documento confidencial — Growth*Stars**

---

## Índice

1. Filosofía del sistema
2. Definición operacional de tiers
3. Modo Estándar vs Modo PODERES
4. Las 3 capas del sistema
5. Conceptos fundamentales (ventanas, leading vs lagging, pairs, orgánico vs pagado)
6. Catálogo de triggers
7. Calendario de activaciones por fase del SOP
8. Adicionales contratables por fase
9. Distribución TOFU/MOFU/BOFU por tier y modo
10. Árbol de decisión: 3 escenarios post-lanzamiento
11. Protocolo de crisis (5 casos)
12. Matriz de palancas vs triggers
13. Cómo lo usa cada rol del equipo
14. Versionado

---

## 1. Filosofía del sistema

### Principios rectores

**1. Los algoritmos no leen tiers, leen señales.**
Lo que cambia entre tiers no es el comportamiento del algoritmo, sino el baseline desde el que partes, la velocidad/volumen requeridos, y la interpretación relativa de los datos.

**2. Algunos umbrales son universales (físicos del algoritmo), otros son relativos (sociales).**
Confundirlos hace que diagnostiquemos fracaso donde solo hay realidad de tier.

**3. Los algoritmos son probabilísticos, no binarios.**
"Save rate >18%" no es un switch que se activa. Es un umbral operativo simplificado de un modelo bayesiano que pondera saves contra muchas otras señales. Lo tratamos como guía, no como ley.

**4. Las metas operativas no son triggers algorítmicos.**
"50 videos UGC en 6h" no es algo que el algoritmo de TikTok exija explícitamente. Es nuestra meta para activar el trigger algorítmico de "emerging sound". Hay que distinguirlas.

**5. Trigger pairs importan más que triggers individuales.**
Save rate alto sin completion rate alto es señal sospechosa. Completion rate alto sin saves es entretenimiento que no convierte. La combinación es lo que el algoritmo lee como "este es un hit real".

**6. Leading metrics se opera, lagging metrics se reporta.**
El equipo de growth actúa sobre triggers leading (predicen éxito futuro). Los lagging confirman lo que ya pasó.

**7. El sistema sirve a dos perfiles de cliente.**
Hay clientes que necesitan resultados conservadores y sostenibles (Modo Estándar) y clientes que tienen el producto, el presupuesto y el compromiso para ir por benchmarks agresivos (Modo PODERES). G*S calibra el sistema según el perfil correcto.

**8. Toda decisión se ancla a data, no a intuición.**
El equipo no escala, pivota o pausa por instinto. Lo hace cuando los datos del lanzamiento ubican al artista en uno de los 3 escenarios definidos (sección 10) o cuando se activa uno de los 5 protocolos de crisis (sección 11).

---

## 2. Definición operacional de tiers

### Sistema de 4 tiers

| Tier | Oyentes mensuales Spotify | Seguidores TikTok | Estado de marca | Realidad operativa |
|---|---|---|---|---|
| **Tier 1 — Emergente** | <15K | <50K | Identidad en construcción, primeros releases, sin equipo profesional consolidado | Cada release es una apuesta, presupuestos limitados, dependencia alta del artista para contenido |
| **Tier 2 — Mid-Level** | 15K-150K | 50K-500K | Identidad clara, base de fans real, presencia regional, equipo básico | Releases consistentes, primeras pautas, primeros pitches a editoriales con respuesta |
| **Tier 3 — Establecido** | 150K-1M | 500K-3M | Marca consolidada, alcance nacional, ingresos consistentes, equipo profesional | Cada release tiene presión comercial, sponsors, expectativa de chart entries, gira en construcción |
| **Tier 4 — Consolidado** | >1M | >3M | Mainstream, gira internacional, sync, equipo grande, alcance multi-país | Cada release es evento cultural, presupuestos altos, integración con sellos majors o estructuras propias robustas |

### Reglas de clasificación

**Regla 1 — Toma el tier más bajo entre Spotify y TikTok.**
Si un artista tiene Tier 3 en Spotify pero Tier 1 en TikTok, opera como Tier 1 hasta cerrar el gap. Esto evita inflar expectativas en plataformas débiles.

**Regla 2 — Realidad de marca puede bajar el tier (no subirlo).**
Un artista con Tier 3 en métricas pero sin identidad clara, sin equipo o sin catálogo coherente, opera como Tier 2 hasta que la marca se profesionalice.

**Regla 3 — Re-clasificación cada 90 días.**
El tier se revisa trimestralmente. Si un artista cruza el umbral hacia arriba o abajo, se re-clasifica y se ajustan los benchmarks.

### Anclaje a pricing del servicio

> **Nota crítica para el Agente 5 (Inversión y Presupuesto):**
> Los tiers definidos aquí son la base de calibración no solo de triggers, sino también de **pricing del servicio G*S**. Cuando se construya el Agente 5, los rangos de inversión deben anclarse a estos mismos tiers. Esto garantiza coherencia: el cliente que es Tier 2 paga rangos de Tier 2, opera con benchmarks de Tier 2, y G*S ejecuta con presupuesto de Tier 2.
>
> Sistema cerrado: tier → benchmarks → pricing → activaciones → reporte.

---

## 3. Modo Estándar vs Modo PODERES

G*S opera con dos modos de servicio según el perfil del cliente:

### Modo Estándar (Default)

**Filosofía:** benchmarks conservadores, alineados con el promedio realista del nicho. Sostenible, ejecutable con presupuestos típicos, baja frustración del cliente.

**Cuándo aplica:**
- Cliente nuevo sin histórico de éxito demostrado en releases anteriores
- Presupuesto estándar para su tier
- Disponibilidad parcial del artista para grabar contenido
- Identidad de marca en construcción o en refinamiento

**Resultado esperado:** crecimiento sano y sostenido, salud algorítmica positiva, base de fans creciendo de forma orgánica.

### Modo PODERES (Premium / Lanzamiento Agresivo)

**Filosofía:** benchmarks alineados con el top 25-30% del nicho. Exige más, asegura que solo "celebremos" éxitos reales, posiciona a G*S como agencia premium.

**Cuándo aplica:**
- Cliente que cumple mínimo 5 de 7 criterios objetivos (ver abajo)
- Producto musical demostradamente sólido
- Presupuesto superior al rango estándar de su tier
- Disponibilidad total del artista
- Decisión validada entre G*S y el cliente

**Resultado esperado:** posibilidad real de explosión algorítmica, entrada a charts, capital de marca acelerado.

### Quién activa el Modo PODERES

**El Agente 3 (Sintetizador) recomienda formalmente la activación del Modo PODERES** con base en evaluación objetiva de los 7 criterios. La decisión final de activación la toma G*S junto al cliente. Una vez activado, todos los agentes downstream (4-11) heredan automáticamente el modo y aplican benchmarks PODERES.

### Los 7 criterios objetivos de PODERES

Para ser candidato a Modo PODERES, el artista debe cumplir **mínimo 5 de los siguientes 7 criterios**:

**Criterios de salud del producto:**
1. **Save rate histórico >12% promedio** en sus últimos 3 releases (la música retiene)
2. **Skip rate <30% promedio** en su catálogo (la música no aburre)

**Criterios de tracción cross-platform:**
3. **Crecimiento orgánico positivo en los últimos 90 días** (no está estancado)
4. **Coherencia demográfica entre Spotify, IG y TikTok** (no hay fragmentación crítica de identidad)

**Criterios de capacidad operativa:**
5. **Presupuesto disponible superior al rango estándar de su tier** (definido en el Agente 5)
6. **Disponibilidad real del artista para grabar contenido** y ejecutar showcase (sin restricciones críticas)
7. **Identidad visual y narrativa establecida** (no requiere reconstrucción de marca antes del lanzamiento)

**Si cumple 5+ criterios:** candidato a PODERES con recomendación formal.
**Si cumple menos de 5:** opera en Modo Estándar. El Sintetizador identifica los gaps a cerrar para optar a PODERES en futuro release.

### Cómo se aplican los modos en este documento

A lo largo del catálogo de triggers (sección 6), los UCT (Umbrales Calibrados por Tier) y los MOC (Metas Operativas Calibradas) presentan **tablas duales**: una columna con el benchmark de Modo Estándar y otra con el benchmark de Modo PODERES.

Los UAU (Umbrales Algorítmicos Universales) **no tienen modo dual** porque son del algoritmo, no del artista. Son los mismos para todos.

La distribución del contenido TOFU/MOFU/BOFU también varía por modo (ver sección 9).

Los 3 escenarios post-lanzamiento (sección 10) también tienen calibración dual por tier y modo.

---

## 4. Las 3 capas del sistema

### Capa 1 — Umbrales Algorítmicos Universales (UAU)

**12 triggers que NO varían entre tiers ni modos.**
Son del algoritmo, no del artista. Si el algoritmo de Spotify dice "necesito 70% de completion para no penalizar", aplica igual a Bad Bunny y a un artista con 500 oyentes.

Función: diagnóstico binario de salud algorítmica.

### Capa 2 — Umbrales Calibrados por Tier (UCT)

**13 triggers que SÍ varían entre tiers Y entre modos.**
Son señales algorítmicas pero el benchmark de "éxito" depende del baseline del artista y del modo de servicio. Un save rate de 15% en Tier 1 Estándar es excelente, en Tier 4 PODERES es promedio.

Función: diagnóstico relativo de performance.

### Capa 3 — Metas Operativas Calibradas (MOC)

**8 metas internas de operación que varían por tier y modo.**
No son triggers algorítmicos en sí. Son las metas que G*S persigue para activar triggers algorítmicos. Dependen del tier, del modo y del presupuesto.

Función: planificación operativa y asignación de recursos.

### Indicadores de Éxito (signals, no triggers)

**3 señales que confirman que está funcionando.**
No se "activan", se observan. Son confirmación post-hoc de éxito.

---

## 5. Conceptos fundamentales

### 5.1 Ventanas de medición

Toda métrica tiene una ventana donde es relevante:

| Ventana | Periodo | Relevancia |
|---|---|---|
| **Hot** | 0-72h post-release | Define la curva inicial del algoritmo. Los datos aquí son los más importantes para predecir trayectoria |
| **Cálida** | 72h-10d | Expansión algorítmica natural. Confirma o desconfirma señales de la ventana hot |
| **Observación** | 10d-30d | Long tail, entrada a playlists algorítmicas, UGC orgánico residual, lectura de datos para reporte final |

### 5.2 Leading vs lagging metrics

**Leading metrics — predicen éxito futuro:**
- Save rate D1
- Completion rate D1
- Pre-save conversion D1
- Comment-to-view ratio en primeras horas
- Sound reuse rate D1-D2

→ El equipo de growth **actúa sobre leading metrics**.

**Lagging metrics — confirman éxito que ya ocurrió:**
- Entrada a Release Radar
- Chart positions
- Shazam Viral Chart entry
- UGC supera contenido oficial

→ El equipo de growth **reporta lagging metrics**, no actúa sobre ellas.

### 5.3 Trigger pairs críticos

Los algoritmos leen combinaciones, no señales aisladas. Estos pairs son los que importan:

| Pair | Interpretación si ambos altos | Interpretación si solo uno alto |
|---|---|---|
| Save rate + Completion rate | Hit real, expansión algorítmica probable | Solo save: sospechoso (saves comprados). Solo completion: entretiene pero no engancha |
| UGC count + UGC completion rate | Trend orgánico, viralidad real | Solo count: UGC pagada sin tracción. Solo completion: bueno pero sin volumen |
| Pre-save volume + Pre-save conversion | Fans reales movilizados | Solo volume: fans tibios. Solo conversion: pocos pero cualificados |
| Followers growth + Engagement rate | Crecimiento sano | Solo followers: bots o pauta mal targetada. Solo engagement: base estancada pero leal |

### 5.4 Orgánico vs pagado

Cada trigger se etiqueta:

**🟢 Orgánico** — Activable sin presupuesto adicional, depende de calidad del producto y operación.
**🟡 Mixto** — Activable orgánico, escalable con presupuesto.
**🔴 Pagado** — Requiere inversión sí o sí (ads, influencers, prensa pagada, herramientas Spotify).

---

## 6. Catálogo de triggers

---

### CAPA 1 — UMBRALES ALGORÍTMICOS UNIVERSALES (UAU)

> **Nota:** Los UAU no varían por tier ni por modo. Son los mismos para todos.

#### UAU-01 — Completion Rate Spotify
- **Plataforma:** Spotify
- **Umbral universal:** >70%
- **Tipo:** Leading
- **Categoría:** 🟢 Orgánico
- **Mecanismo:** Spotify penaliza canciones con alto skip rate. Completion alto = la canción engancha de principio a fin.
- **Fórmula:** (Listeners que llegan al final / Total listeners) × 100
- **Si <70%:** revisar primeros 15 seg, verso 2, considerar versión corta (2:45 max)

#### UAU-02 — Canvas Activo
- **Plataforma:** Spotify
- **Umbral universal:** Configurado (sí/no)
- **Tipo:** Leading
- **Categoría:** 🟢 Orgánico
- **Mecanismo:** Loop visual de 3-8 seg que aumenta time-on-app +25-35%.
- **Activación:** crear video loop (puede ser IA con Sora 2 o Veo si no hay video original).

#### UAU-03 — Completion Rate TikTok
- **Plataforma:** TikTok
- **Umbral universal:** >55%
- **Tipo:** Leading
- **Categoría:** 🟢 Orgánico
- **Mecanismo:** TikTok expone a cohortes más grandes si la mayoría completa el video.
- **Si <55%:** acortar a 8-15 seg, hook en primeros 2 seg, cambiar formato.

#### UAU-04 — Spark Ads Engagement Rate
- **Plataforma:** TikTok
- **Umbral universal:** >8%
- **Tipo:** Leading
- **Categoría:** 🔴 Pagado
- **Mecanismo:** Si el video amplificado sigue performando, TikTok extiende automáticamente el alcance.
- **Si <5%:** pausar, cambiar video amplificado.

#### UAU-05 — Comment-to-View Ratio TikTok
- **Plataforma:** TikTok
- **Umbral universal:** >2%
- **Tipo:** Leading
- **Categoría:** 🟡 Mixto
- **Mecanismo:** Comentarios = engagement activo, no pasivo. Algoritmo lo prioriza.
- **Activación:** comment seeding 20 comentarios primeros 30 min, responder todo en <2h.

#### UAU-06 — Profile Visits desde Sound Page
- **Plataforma:** TikTok
- **Umbral universal:** >5%
- **Tipo:** Leading
- **Categoría:** 🟢 Orgánico
- **Mecanismo:** La gente que va del sonido al perfil = curiosidad genuina hacia el artista.
- **Activación:** bio optimizada con CTA a Spotify, pinned video del artista, link en bio.

#### UAU-07 — Carrusel Save Rate Instagram
- **Plataforma:** Instagram
- **Umbral universal:** >5%
- **Tipo:** Leading
- **Categoría:** 🟢 Orgánico
- **Mecanismo:** Carruseles tienen mejor algoritmo que videos en IG. Saves = alcance orgánico extendido.
- **Activación:** estructura 5 slides (hook visual / clip / dato / CTA / BTS).

#### UAU-08 — Story Reply Rate Instagram
- **Plataforma:** Instagram
- **Umbral universal:** >3%
- **Tipo:** Leading
- **Categoría:** 🟢 Orgánico
- **Mecanismo:** Replies = engagement directo. Stories con replies altas son priorizadas en ranking.
- **Activación:** stickers de poll, question, link, responder todo en <1h.

#### UAU-09 — Reel Completion Instagram
- **Plataforma:** Instagram
- **Umbral universal:** >80%
- **Tipo:** Leading
- **Categoría:** 🟢 Orgánico
- **Mecanismo:** Reels con completion alto van a Explore (alcance orgánico masivo).
- **Activación:** duración 15-30 seg, hook 2 seg, dinámica visual constante.

#### UAU-10 — Short Completion Rate YouTube
- **Plataforma:** YouTube
- **Umbral universal:** >90%
- **Tipo:** Leading
- **Categoría:** 🟢 Orgánico
- **Mecanismo:** Shorts con completion alto entran a "replay loop" (reproducción múltiple automática).
- **Activación:** duración 15-30 seg, hook inmediato 3 seg.

#### UAU-11 — CTR Thumbnail YouTube
- **Plataforma:** YouTube
- **Umbral universal:** >8%
- **Tipo:** Leading
- **Categoría:** 🟢 Orgánico
- **Mecanismo:** CTR es el principal proxy que YouTube usa para decidir recomendación.
- **Activación:** thumbnail con rostro 60%, contraste alto (rojo/amarillo/magenta), texto corto.
- **Si <8% en 48h:** cambiar thumbnail inmediatamente.

#### UAU-12 — Watch Time YouTube Video Largo
- **Plataforma:** YouTube
- **Umbral universal:** >50%
- **Tipo:** Leading
- **Categoría:** 🟢 Orgánico
- **Mecanismo:** YouTube recomienda en sidebar si la mayoría ve el video completo.
- **Activación:** duración 2-3 min, transiciones cada 15-20 seg.

---

### CAPA 2 — UMBRALES CALIBRADOS POR TIER (UCT)

> **Nota:** Los UCT presentan tablas duales por modo (Estándar / PODERES).

#### UCT-01 — Save Rate Spotify
- **Plataforma:** Spotify
- **Tipo:** Leading (CRÍTICO)
- **Categoría:** 🟡 Mixto
- **Fórmula:** (Total saves / Total streams) × 100

**Modo Estándar:**

| Tier | Mínimo aceptable | Objetivo |
|---|---|---|
| Tier 1 | >6% | >9% |
| Tier 2 | >9% | >12% |
| Tier 3 | >12% | >15% |
| Tier 4 | >15% | >18% |

**Modo PODERES:**

| Tier | Mínimo | Objetivo | Excelente |
|---|---|---|---|
| Tier 1 | >10% | >15% | >20% |
| Tier 2 | >15% | >20% | >25% |
| Tier 3 | >18% | >25% | >30% |
| Tier 4 | >22% | >30% | >35% |

#### UCT-02 — Repeat-Listen Ratio Spotify
- **Plataforma:** Spotify
- **Tipo:** Lagging
- **Categoría:** 🟢 Orgánico
- **Fórmula:** Total streams / Total unique listeners

**Modo Estándar:**

| Tier | Bueno | Estándar |
|---|---|---|
| Tier 1 | >1.2 | >1.4 |
| Tier 2 | >1.4 | >1.6 |
| Tier 3 | >1.6 | >1.8 |
| Tier 4 | >1.8 | >2.0 |

**Modo PODERES:**

| Tier | Bueno | Estándar | Excelente |
|---|---|---|---|
| Tier 1 | >1.5 | >1.8 | >2.2 |
| Tier 2 | >1.8 | >2.2 | >2.6 |
| Tier 3 | >2.0 | >2.5 | >3.0 |
| Tier 4 | >2.3 | >3.0 | >3.5 |

#### UCT-03 — Pre-save → Release Conversion
- **Plataforma:** Spotify
- **Tipo:** Leading
- **Categoría:** 🟡 Mixto
- **Fórmula:** (Streams D1 / Pre-saves totales) × 100

**Modo Estándar:**

| Tier | Mínimo | Objetivo |
|---|---|---|
| Tier 1 | >35% | >45% |
| Tier 2 | >45% | >55% |
| Tier 3 | >50% | >60% |
| Tier 4 | >55% | >65% |

**Modo PODERES:**

| Tier | Mínimo | Objetivo | Excelente |
|---|---|---|---|
| Tier 1 | >50% | >60% | >70% |
| Tier 2 | >55% | >65% | >75% |
| Tier 3 | >60% | >70% | >80% |
| Tier 4 | >65% | >75% | >85% |

#### UCT-04 — Playlist Adds Orgánicas Spotify
- **Plataforma:** Spotify
- **Tipo:** Lagging
- **Categoría:** 🟡 Mixto

**Modo Estándar (semana 1):**

| Tier | Mínimo | Objetivo |
|---|---|---|
| Tier 1 | 3+ | 8+ |
| Tier 2 | 8+ | 20+ |
| Tier 3 | 20+ | 50+ |
| Tier 4 | 50+ | 150+ |

**Modo PODERES (semana 1):**

| Tier | Mínimo | Objetivo |
|---|---|---|
| Tier 1 | 10+ | 25+ |
| Tier 2 | 25+ | 60+ |
| Tier 3 | 60+ | 150+ |
| Tier 4 | 150+ | 400+ |

#### UCT-05 — Marquee CTR
- **Plataforma:** Spotify
- **Tipo:** Leading
- **Categoría:** 🔴 Pagado
- **Nota:** Tier 1 NO debe correr Marquee en ningún modo. ROI negativo.

**Modo Estándar:**

| Tier | Mínimo aceptable | Objetivo |
|---|---|---|
| Tier 1 | N/A (no usar) | N/A |
| Tier 2 | >3% | >6% |
| Tier 3 | >6% | >10% |
| Tier 4 | >10% | >13% |

**Modo PODERES:**

| Tier | Mínimo | Objetivo |
|---|---|---|
| Tier 1 | N/A (no usar) | N/A |
| Tier 2 | >6% | >10% |
| Tier 3 | >10% | >15% |
| Tier 4 | >15% | >20% |

#### UCT-06 — Sound Reuse Rate TikTok (D2 vs D1)
- **Plataforma:** TikTok
- **Tipo:** Leading (CRÍTICO)
- **Categoría:** 🟡 Mixto
- **Fórmula:** (Videos D2 / Videos D1) × 100
- **Umbral universal de crecimiento:** >120% (D2 supera D1 en al menos 20%)

**Modo Estándar (base D1 esperada):**

| Tier | Base D1 mínima | Base D2 mínima |
|---|---|---|
| Tier 1 | 15+ videos | 18+ videos |
| Tier 2 | 35+ videos | 45+ videos |
| Tier 3 | 80+ videos | 110+ videos |
| Tier 4 | 150+ videos | 220+ videos |

**Modo PODERES (base D1 esperada):**

| Tier | Base D1 mínima | Base D2 mínima |
|---|---|---|
| Tier 1 | 30+ videos | 40+ videos |
| Tier 2 | 70+ videos | 95+ videos |
| Tier 3 | 150+ videos | 220+ videos |
| Tier 4 | 300+ videos | 450+ videos |

#### UCT-07 — Share-to-View Ratio TikTok
- **Plataforma:** TikTok
- **Tipo:** Leading
- **Categoría:** 🟢 Orgánico

**Modo Estándar:**

| Tier | Mínimo | Objetivo |
|---|---|---|
| Tier 1 | >0.4% | >0.7% |
| Tier 2 | >0.7% | >1.2% |
| Tier 3 | >1.2% | >1.7% |
| Tier 4 | >1.7% | >2.2% |

**Modo PODERES:**

| Tier | Mínimo | Objetivo |
|---|---|---|
| Tier 1 | >0.7% | >1.2% |
| Tier 2 | >1.2% | >1.8% |
| Tier 3 | >1.8% | >2.5% |
| Tier 4 | >2.5% | >3.5% |

#### UCT-08 — Duet/Stitch Ratio TikTok
- **Plataforma:** TikTok
- **Tipo:** Leading
- **Categoría:** 🟢 Orgánico
- **Aplica:** depende del tipo de contenido. Más relevante para artistas que invitan a interacción (challenges, retos, formatos abiertos). En lanzamientos sin componente de challenge, este trigger pierde peso.

#### UCT-09 — Video del Artista Post-Tendencia
- **Plataforma:** TikTok
- **Tipo:** Leading (CRÍTICO)
- **Categoría:** 🟢 Orgánico
- **Mecanismo:** El artista NO publica D1. Publica D2 cuando los influencers ya sembraron el sonido. Genera pico de atención por curiosidad + autoridad + momentum.
- **Timing exacto:** D2 entre 10am-12pm.
- **Aplica a todos los tiers y modos.**

#### UCT-10 — DM Shares vs Likes Instagram
- **Plataforma:** Instagram
- **Tipo:** Leading (CRÍTICO en 2026)
- **Categoría:** 🟢 Orgánico
- **Fórmula:** (DM shares / Likes) × 100

**Modo Estándar:**

| Tier | Mínimo | Objetivo |
|---|---|---|
| Tier 1 | >30% | >55% |
| Tier 2 | >55% | >85% |
| Tier 3 | >85% | >110% |
| Tier 4 | >110% | >130% |

**Modo PODERES:**

| Tier | Mínimo | Objetivo |
|---|---|---|
| Tier 1 | >55% | >85% |
| Tier 2 | >85% | >120% (shares > likes) |
| Tier 3 | >120% | >150% |
| Tier 4 | >150% | >180% |

#### UCT-11 — Collab Post Instagram
- **Plataforma:** Instagram
- **Tipo:** Leading
- **Categoría:** 🟢 Orgánico
- **Aplica a todos los tiers y modos.** Lo que cambia es el tipo de colaborador.

#### UCT-12 — Live Viewers Concurrentes
- **Plataforma:** Instagram / TikTok
- **Tipo:** Leading
- **Categoría:** 🟢 Orgánico

**Modo Estándar:**

| Tier | Mínimo | Objetivo |
|---|---|---|
| Tier 1 | 35+ | 100+ |
| Tier 2 | 100+ | 300+ |
| Tier 3 | 300+ | 800+ |
| Tier 4 | 800+ | 2.000+ |

**Modo PODERES:**

| Tier | Mínimo | Objetivo |
|---|---|---|
| Tier 1 | 80+ | 200+ |
| Tier 2 | 200+ | 600+ |
| Tier 3 | 600+ | 1.500+ |
| Tier 4 | 1.500+ | 4.500+ |

#### UCT-13 — Subscriber Conversion desde Short YouTube
- **Plataforma:** YouTube
- **Tipo:** Leading
- **Categoría:** 🟢 Orgánico

**Modo Estándar:**

| Tier | Mínimo | Objetivo |
|---|---|---|
| Tier 1 | >0.8% | >1.5% |
| Tier 2 | >1.5% | >2.2% |
| Tier 3 | >2.2% | >3.0% |
| Tier 4 | >3.0% | >4.0% |

**Modo PODERES:**

| Tier | Mínimo | Objetivo |
|---|---|---|
| Tier 1 | >1.5% | >2.5% |
| Tier 2 | >2.5% | >3.5% |
| Tier 3 | >3.5% | >5.0% |
| Tier 4 | >5.0% | >6.5% |

---

### CAPA 3 — METAS OPERATIVAS CALIBRADAS (MOC)

> **Nota:** Los MOC son metas operativas internas, no umbrales algorítmicos.

#### MOC-01 — Videos UGC en primeras 6h
- **Plataforma:** TikTok
- **Categoría:** 🔴 Pagado
- **Activa:** "emerging sound classification"

**Modo Estándar:**

| Tier | Videos meta | Influencers necesarios |
|---|---|---|
| Tier 1 | 15+ | 5-8 |
| Tier 2 | 35+ | 10-15 |
| Tier 3 | 80+ | 25-40 |
| Tier 4 | 150+ | 50-80 |

**Modo PODERES:**

| Tier | Videos meta | Influencers necesarios |
|---|---|---|
| Tier 1 | 30+ | 10-15 |
| Tier 2 | 70+ | 20-30 |
| Tier 3 | 150+ | 45-70 |
| Tier 4 | 300+ | 90-130 |

#### MOC-02 — Videos UGC en semana 1
- **Plataforma:** TikTok
- **Categoría:** 🔴 Pagado + orgánico
- **Activa:** "trending sound classification"

**Modo Estándar:**

| Tier | Mínimo | Objetivo |
|---|---|---|
| Tier 1 | 60+ | 120+ |
| Tier 2 | 150+ | 300+ |
| Tier 3 | 350+ | 700+ |
| Tier 4 | 1.000+ | 2.000+ |

**Modo PODERES:**

| Tier | Mínimo | Objetivo |
|---|---|---|
| Tier 1 | 120+ | 200+ |
| Tier 2 | 300+ | 550+ |
| Tier 3 | 700+ | 1.500+ |
| Tier 4 | 2.000+ | 4.500+ |

#### MOC-03 — Hashtag Unificado
- **Plataforma:** TikTok
- **Categoría:** 🟡 Mixto

**Modo Estándar (al final de semana 1):**

| Tier | Mínimo | Objetivo |
|---|---|---|
| Tier 1 | 35+ | 75+ |
| Tier 2 | 75+ | 180+ |
| Tier 3 | 200+ | 500+ |
| Tier 4 | 700+ | 1.800+ |

**Modo PODERES:**

| Tier | Mínimo | Objetivo |
|---|---|---|
| Tier 1 | 75+ | 150+ |
| Tier 2 | 180+ | 400+ |
| Tier 3 | 500+ | 1.200+ |
| Tier 4 | 1.800+ | 4.000+ |

#### MOC-04 — CapCut Template Usos
- **Plataforma:** TikTok
- **Categoría:** 🟢 Orgánico / 🔴 Pagado
- **Aplica desde Tier 2.**
- **Modo Estándar:** >50 usos = formato viral.
- **Modo PODERES:** target >150 usos en semana 1.

#### MOC-05 — Pre-saves totales
- **Plataforma:** Spotify
- **Categoría:** 🟡 Mixto

**Modo Estándar:**

| Tier | Mínimo | Objetivo |
|---|---|---|
| Tier 1 | 150+ | 350+ |
| Tier 2 | 350+ | 1.500+ |
| Tier 3 | 1.500+ | 3.500+ |
| Tier 4 | 3.500+ | 10.000+ |

**Modo PODERES:**

| Tier | Mínimo | Objetivo |
|---|---|---|
| Tier 1 | 350+ | 700+ |
| Tier 2 | 700+ | 2.500+ |
| Tier 3 | 2.500+ | 6.000+ |
| Tier 4 | 6.000+ | 18.000+ |

#### MOC-06 — Medios en 48h post-release
- **Plataforma:** Cross-platform
- **Categoría:** 🔴 Pagado

**Modo Estándar:**

| Tier | Mínimo | Objetivo | Tipo de medios |
|---|---|---|---|
| Tier 1 | 1 | 2 | Blogs nicho |
| Tier 2 | 2 | 3-4 | Blogs nicho + 1 regional |
| Tier 3 | 3-4 | 6+ | Regionales + 1 nacional |
| Tier 4 | 6+ | 9+ | Nacionales + 1 internacional |

**Modo PODERES:**

| Tier | Mínimo | Objetivo | Tipo de medios |
|---|---|---|---|
| Tier 1 | 2 | 3+ | Blogs nicho + 1 regional |
| Tier 2 | 3+ | 5+ | Mix nicho/regional/nacional |
| Tier 3 | 6+ | 10+ | Multi-tier nacional + internacional |
| Tier 4 | 9+ | 15+ | Multi-país + medios premium |

#### MOC-07 — Showcase Post-Release
- **Plataforma:** Físico + redes
- **Categoría:** 🟡 Mixto

**Modo Estándar:**

| Tier | Cantidad | Tamaño audiencia |
|---|---|---|
| Tier 1 | 1 íntimo | 25-50 personas |
| Tier 2 | 1 | 60-120 personas |
| Tier 3 | 1-2 | 150-400 personas |
| Tier 4 | 2-3 | 400-1.500 personas |

**Modo PODERES:**

| Tier | Cantidad | Tamaño audiencia |
|---|---|---|
| Tier 1 | 1 íntimo + 1 secundario | 50-100 personas |
| Tier 2 | 2 (multi-locación posible) | 120-250 personas |
| Tier 3 | 2-3 (multi-ciudad) | 400-800 personas |
| Tier 4 | 3-5 (mini-gira) | 1.500-3.500+ |

#### MOC-08 — Influencers contratados total
- **Plataforma:** TikTok / IG
- **Categoría:** 🔴 Pagado

**Modo Estándar:**

| Tier | Total influencers | Mix |
|---|---|---|
| Tier 1 | 6-10 | 90% nano-micro |
| Tier 2 | 12-20 | 70% micro, 25% medio, 5% macro |
| Tier 3 | 25-45 | 50% micro, 35% medio, 15% macro |
| Tier 4 | 60-110 | 35% micro, 40% medio, 25% macro |

**Modo PODERES:**

| Tier | Total influencers | Mix |
|---|---|---|
| Tier 1 | 12-18 | 70% nano-micro, 30% medio |
| Tier 2 | 22-35 | 50% micro, 35% medio, 15% macro |
| Tier 3 | 50-80 | 35% micro, 40% medio, 25% macro |
| Tier 4 | 110-180+ | 25% micro, 40% medio, 35% macro/celebrity |

---

### INDICADORES DE ÉXITO (signals, no triggers)

#### IE-01 — Entrada a Release Radar Spotify
- **Cuándo se observa:** viernes posterior al release
- **Significado:** el algoritmo detectó la canción como relevante.

#### IE-02 — Shazam Viral Chart Entry
- **Cuándo se observa:** semana 1-2
- **Significado:** Apple Music consideró la canción para editorial.

#### IE-03 — UGC supera contenido oficial
- **Cuándo se observa:** semana 2-3
- **Fórmula:** Si videos UGC > videos oficiales = trigger ACTIVADO
- **Significado:** viralidad orgánica real. Dato crítico para reporte D+30.

---

## 7. Calendario de Activaciones por Fase del SOP

Cubre 60 días totales: 14 de Inbound + 16 de Pre-Lanzamiento + 4 de Sprint + 7 de Expansión + 20 de Observación.

**Servicio activo:** 40 días (D-30 a D+10). **Reporte final:** D+30.

### Línea de tiempo maestra

```
INBOUND          PRE-LANZAMIENTO      SPRINT 72H    EXPANSIÓN      OBSERVACIÓN
[D-30 ── D-17]   [D-16 ────── D-1]    [D0 ── D+3]   [D+4 ─ D+10]   [D+11 ── D+30]
   14 días          16 días              4 días        7 días          20 días
```

### FASE 0 — Inbound Pre-Lanzamiento (D-30 a D-17, 14 días)

**Objetivo:** preparar el ecosistema con contenido TOFU/MOFU/BOFU calibrado por tier y modo, calentar audiencia, validar formatos en cuenta de fans.

**Conexión con SOP:** Fase 5 del SOP (Preproducción Estratégica de Inbound Marketing).

**Cuenta del Artista:** distribución de las 9 piezas según sección 9.

**Cuenta de Fans:**
- 🟢 Arranque del CM con plantillas Canva
- 🟢 Snippet testing inicial

**Decisiones del audit:**
- 🔴 Sintetizador (Agente 3) ejecuta recomendación de Modo Estándar vs PODERES

**Adicional contratable:** 🟡 Creación Audiovisual de Contenido TOFU/MOFU/BOFU

### FASE 1 — Pre-Lanzamiento (D-16 a D-1, 16 días)

**Objetivo:** activar leading metrics tempranas, sembrar el sonido, capturar pre-saves.

#### D-16 a D-14 — Setup y Oleada 1 UGC (Siembra)
- 🔴 MOC-08 Contratar 30-50% de influencers Oleada 1
- 🟢 UAU-02 Configurar Canvas Spotify
- 🟢 UAU-11 Diseñar 2-3 thumbnails YouTube
- 🟡 MOC-05 Pre-save link activo con UTM tracking
- 🟢 Cuenta artista: Video Expectativa (formato AGENCIA)

#### D-13 a D-9 — Calentamiento y Validación
- 🟢 UAU-07 Empezar carruseles IG
- 🟢 UAU-08 Stories diarias con CTA pre-save
- 🟡 UCT-03 Empujar pre-save vía broadcasts WhatsApp + IG Stories
- 🟢 Cuenta de fans: continúa snippet testing

#### D-8 a D-3 — Countdown intensivo
- 🟢 Stories Anuncio Estreno x Días (countdown 8-5-3-2-1)
- 🟡 Meta Ads de pre-save (5-7 días antes)
- 🟢 UAU-08 Aumento de cadencia stories
- 🟢 UAU-09 Reels propios del artista con clip

#### D-5 — Reacción Videos UGC (Trigger crítico)
- 🟢 Artista publica Reacción a videos UGC ya sembrados

#### D-2 a D-1 — Víspera
- 🔴 MOC-08 Confirmar Oleada 2 UGC para D0
- 🟡 MOC-06 Confirmar embargo de medios
- 🟢 Contenido AGENCIA "Ya casi disponible"
- 🟢 UAU-08 Stories cada 2-3h con countdown final

**Adicional contratable Fase 1+2:** 🟡 Producción Cinematográfica de Videoclip / Visualizer

### FASE 2 — Sprint 72hrs (D0 a D+3, 4 días)

**Objetivo:** activar máxima cantidad de leading metrics en mínimo tiempo.

#### D0 — Día del Release

**Mañana (00:00 - 12:00):**
- ⚡ UCT-03 Convertir pre-saves automáticamente
- 🟢 UAU-02 Verificar Canvas activo
- 🟢 Artist Pick configurado
- 🟢 Video "Ya Disponible" cuenta artista

**Mediodía (12:00 - 15:00) — VENTANA CRÍTICA:**
- 🔴 MOC-01 Oleada 2 UGC publica simultáneamente, stagger por minutos
- 🟢 UCT-01 Stories IG con CTA "GUARDA en Spotify"
- 🟡 WhatsApp broadcast con CTA "Guarda en Spotify"
- 🔴 MOC-06 Activación de medios digitales

**Tarde-noche (15:00 - 23:59):**
- 🟢 UAU-05 Comment seeding (20 comentarios primeros 30 min)
- 🟢 UCT-12 Live IG/TikTok con preview + CTA save
- 🟢 Artista publica Revelación del Trend Post UGC

**KPIs críticos D0 a 36h:**
- 60% del total de oyentes mensuales impactados
- 20% del total convertidos
- UCT-01 Save Rate >umbral del tier/modo
- UAU-01 Completion Rate >70%
- MOC-01 videos UGC en 6h según tier/modo

#### D+1 — UCT-09 Video del Artista Post-Tendencia (CRÍTICO)
- 🟢 UCT-09 Artista publica entre 10am-12pm
- 🟢 UAU-05 Continuar comment seeding
- 🟢 UAU-08 Stories con replays UGC favoritos
- 🔴 UAU-04 Activar Spark Ads sobre 5-10 mejores UGC orgánicos

#### D+2 — Optimización en Tiempo Real
- 🔴 UAU-04 Escalar Spark Ads
- 🟢 UCT-10 Reels IG con CTA shares
- 🟢 UAU-11 Si CTR thumbnail <8%, cambiar
- 🟡 MOC-03 Push de hashtag unificado

#### D+3 — Cierre del Sprint
- 🟢 Resumen de los 3 días en stories
- 🟢 UAU-08 Story con números preliminares
- 🟡 Iniciar pitch a curadores Spotify independientes

**KPIs de salida del sprint** (vs benchmarks del modo activado):
- Save Rate dentro de benchmark ✓/✗
- Completion Rate >70% ✓/✗
- Videos UGC acumulados ✓/✗
- Medios publicados según tier/modo ✓/✗
- DM Shares vs Likes ✓/✗

### FASE 3 — Expansión Algorítmica (D+4 a D+10, 7 días)

**Objetivo:** los algoritmos expanden orgánicamente. Mantener combustible suficiente. **Esta fase cierra el servicio activo de G*S.**

#### D+4 a D+6 — Sustento del momentum
- 🟢 UCT-02 Monitorear Repeat-Listen Ratio
- 🟢 UAU-09 Continuar Reels IA Videolyric
- 🟡 MOC-04 Si tier ≥2: lanzar CapCut template
- 🟢 BTS Videoclip/Videolyrics
- 🟢 UAU-08 Q&A semanal en stories

#### D+7 — DÍA DE EVALUACIÓN ESTRATÉGICA (CRÍTICO)

**En este día se evalúa al artista contra los 3 escenarios de la sección 10.** Según el escenario detectado, se activa el plan de acciones correspondiente para los días D+8 a D+10.

#### D+8 a D+10 — Showcase y Oleada 3 UGC (Cierre de Servicio Activo)
- 🟡 MOC-07 Showcase en ciudad del artista
- 🔴 MOC-08 Oleada 3 UGC: creadores locales
- 🟢 UCT-12 Live post-showcase
- 🟢 BTS Showcase/Recap

**Adicional contratable Fase 3:** 🟡 Cubrimiento de Evento para Showcase

### FASE 4 — Observación y Reporte (D+11 a D+30, 20 días)

**Objetivo:** capturar long tail, recolectar data para reporte D+30. **Servicio sin costo adicional.**

#### Actividades activas (alcance reducido)
- 🟢 Cuenta de fans en cadencia mínima (2-3 piezas/semana)
- 🟢 Stories diarias del artista (LIBRE)
- 🟢 Monitoreo pasivo de triggers
- 🟡 Capitalización de wins inesperados

#### Lo que NO se hace
- ❌ Pauta nueva
- ❌ Nueva oleada UGC
- ❌ Showcase adicional
- ❌ Producción de contenido nuevo del artista
- ❌ Actividades facturables

#### D+30: Reporte ROI/ROAS final (ejecutado por Agente 11)

---

## 8. Adicionales contratables por fase

| Fase | Adicional | Cuándo | Qué cubre | Triggers que alimenta |
|---|---|---|---|---|
| **Fase 0 — Inbound** | Creación Audiovisual TOFU/MOFU/BOFU | D-30 a D-17 | Producción profesional de las 9 piezas de PRODUCCIÓN | UAU-09, UCT-10, UAU-08, UCT-09 |
| **Fase 1 + 2** | Producción Cinematográfica Videoclip/Visualizer | D-16 a D+3 | Videoclip cinematográfico (físico o IA) | UAU-12, UAU-02, UAU-09 |
| **Fase 3 — Postlanzamiento** | Cubrimiento de Evento Showcase | D+8 a D+10 | Producción audiovisual profesional del showcase | MOC-07, contenido Fase 4 |

### Reglas operativas

**1.** Cada adicional tiene su propio pricing en el Agente 5.
**2.** Sin Fase 0 contratada: G*S entrega solo preproducción, artista graba.
**3.** Sin Fase 1+2 contratada: G*S usa visualizer IA como Canvas y Reels.
**4.** Sin Fase 3 contratada: G*S cubre showcase con equipo básico.
**5.** Modo PODERES recomienda contratar los 3 adicionales para maximizar ROI.

---

## 9. Distribución TOFU/MOFU/BOFU por tier y modo

### Filosofía

La distribución de las 9 piezas de PRODUCCIÓN NO es fija 33/33/33. Varía por tier y modo:

- **Tier 1:** prioridad TOFU (descubrimiento)
- **Tier 2:** balance descubrimiento/comunidad
- **Tier 3-4:** prioridad MOFU (profundización)

### Tablas

**Modo Estándar:**

| Tier | TOFU | MOFU | BOFU | Distribución (9 piezas) |
|---|---|---|---|---|
| Tier 1 | 50% | 30% | 20% | 5 / 3 / 1 |
| Tier 2 | 33% | 33% | 33% | 3 / 3 / 3 |
| Tier 3 | 25% | 45% | 30% | 2 / 4 / 3 |
| Tier 4 | 22% | 45% | 33% | 2 / 4 / 3 |

**Modo PODERES:**

| Tier | TOFU | MOFU | BOFU | Distribución (9 piezas) |
|---|---|---|---|---|
| Tier 1 | 45% | 35% | 20% | 4 / 4 / 2 |
| Tier 2 | 33% | 40% | 27% | 3 / 4 / 2 |
| Tier 3 | 22% | 45% | 33% | 2 / 4 / 3 |
| Tier 4 | 20% | 40% | 40% | 2 / 4 / 3 |

### Calendario por tier (Modo Estándar)

| Tier | Días 1-7 | Días 8-12 | Días 13-14 |
|---|---|---|---|
| Tier 1 | 5 piezas TOFU | 3 piezas MOFU | 1 pieza BOFU |
| Tier 2 | 3 piezas TOFU | 3 piezas MOFU | 3 piezas BOFU |
| Tier 3 | 2 piezas TOFU | 4 piezas MOFU | 3 piezas BOFU |
| Tier 4 | 2 piezas TOFU | 4 piezas MOFU | 3 piezas BOFU |

### Tipos de contenido por nivel del funnel

**TOFU — Descubrimiento:**
- Hooks visuales fuertes, primeros 2 seg críticos
- Identidad del artista, sonido distintivo
- Sin CTA comercial, solo curiosidad

**MOFU — Comunidad:**
- Storytelling, BTS, conexión emocional
- CTA suave (seguir, guardar)

**BOFU — Conversión:**
- CTAs explícitos (pre-save, save, listen, share)
- Anticipación al release, countdown

---

## 10. Árbol de decisión: 3 escenarios post-lanzamiento

### Filosofía

**Toda decisión de escalamiento, ajuste o pivote se ancla a data, no a intuición.** El día D+7 (último día antes de showcase y oleada 3 UGC) el equipo de G*S evalúa al artista contra los 3 escenarios definidos abajo. Según el escenario detectado, se activa el plan de acciones correspondiente.

### Reglas universales de los escenarios

**Regla 1 — Nunca gastar más del 50% del presupuesto antes del día 7.**
Esto deja reserva para escalar Escenario A o pivotar Escenario C sin quedar descapitalizado.

**Regla 2 — La decisión de escenario se toma SOLO con data.**
No por sensaciones del cliente, no por entusiasmo del equipo. Solo con métricas medibles.

**Regla 3 — Los benchmarks de los escenarios se calibran por tier y modo.**
Igual que UCT y MOC.

**Regla 4 — Un solo indicador NO define escenario.**
Se evalúan múltiples indicadores en conjunto. Si la mayoría están en zona del escenario X, ese es el escenario activo.

---

### ESCENARIO A — ESTÁ PEGANDO

**Significado:** el lanzamiento está performando por encima de benchmark. El algoritmo está expandiendo. Hay momentum real para escalar.

#### Indicadores (todos o la mayoría se cumplen)

**Modo Estándar:**

| Indicador | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---|---|---|---|
| Sound reuse D7 | >50/día o >5x promedio | >100/día o >5x promedio | >200/día o >5x promedio | >400/día o >5x promedio |
| Save rate | >9% | >12% | >15% | >18% |
| Views D1 vs promedio Reels/TikToks artista | >3x | >3x | >3x | >3x |
| DM shares Instagram | > likes en posts release | > likes en posts release | > likes en posts release | > likes en posts release |

**Modo PODERES:**

| Indicador | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---|---|---|---|
| Sound reuse D7 | >100/día o >7x promedio | >200/día o >7x promedio | >400/día o >7x promedio | >800/día o >7x promedio |
| Save rate | >15% | >20% | >25% | >30% |
| Views D1 vs promedio Reels/TikToks artista | >5x | >5x | >5x | >5x |
| DM shares Instagram | >1.5x likes | >1.5x likes | >1.5x likes | >1.5x likes |

#### Acciones (todas se ejecutan en D+7 a D+10)

- 🔴 **Escalar Meta Ads** usando reserva del 50% del presupuesto que quedó intacta
- 🔴 **Contactar influencers medianas** (100K+ seguidores) para Oleada 3 reforzada
- 🟢 **Artista hace Lives diarios** durante D+7 a D+10 para capitalizar momentum
- 🔴 **Activar segunda ola de PR** con lista de 10+ medios adicionales (preparada en Fase 0)
- 🔴 **Evaluar Marquee** Spotify (solo Tier 2+)
- 🔴 **Evaluar Showcase de Spotify** (solo Tier 3+)
- 🔴 **Evaluar radio plugger** (solo Tier 3+)

---

### ESCENARIO B — TIBIO

**Significado:** el lanzamiento está performando dentro de benchmark pero sin picos de viralidad. No es fracaso, pero no hay momentum para escalar agresivo. Hay que optimizar formato, no escalar volumen.

#### Indicadores

**Modo Estándar:**

| Indicador | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---|---|---|---|
| Sound reuse D7 | 10-50/día o 1-5x promedio | 25-100/día o 1-5x promedio | 50-200/día o 1-5x promedio | 100-400/día o 1-5x promedio |
| Save rate | 6-9% | 9-12% | 12-15% | 15-18% |
| Engagement | Normal, sin picos | Normal, sin picos | Normal, sin picos | Normal, sin picos |

**Modo PODERES:**

| Indicador | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---|---|---|---|
| Sound reuse D7 | 30-100/día o 2-7x promedio | 70-200/día o 2-7x promedio | 150-400/día o 2-7x promedio | 300-800/día o 2-7x promedio |
| Save rate | 10-15% | 15-20% | 18-25% | 22-30% |
| Engagement | Normal, sin picos | Normal, sin picos | Normal, sin picos | Normal, sin picos |

#### Acciones (todas se ejecutan en D+7 a D+10)

- 🟡 **Probar Clip B** (alternativa al clip dominante, idealmente verso con buena cadencia)
- 🟡 **Probar formato alternativo de TikTok** (cambio de hook, cambio de POV, cambio de tipo de video — no baile si baile no funciona)
- 🟢 **Mantener Meta Ads, amplificar mejores videos orgánicos**
- 🔄 **Redistribuir budget de TikTok a Meta** si Meta convierte mejor (decisión basada en CPC/CPF comparativo)

---

### ESCENARIO C — NO PRENDE

**Significado:** el lanzamiento está por debajo del benchmark. Hay riesgo real de quemar presupuesto sin retorno. Hay que pausar, contener y pivotar.

#### Indicadores

**Modo Estándar:**

| Indicador | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---|---|---|---|
| Sound reuse D7 | <10/día | <25/día | <50/día | <100/día |
| Save rate | <6% | <9% | <12% | <15% |
| Skip rate | >40% | >40% | >40% | >40% |

**Modo PODERES:**

| Indicador | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---|---|---|---|
| Sound reuse D7 | <30/día | <70/día | <150/día | <300/día |
| Save rate | <10% | <15% | <18% | <22% |
| Skip rate | >40% | >40% | >40% | >40% |

#### Acciones (todas se ejecutan en D+7 a D+10)

- ❌ **Pausar TikTok Ads completamente** (no quemar presupuesto en plataforma que no responde)
- 🔄 **Mover TODO el presupuesto restante a Meta Ads directos a Spotify** (CPC más bajo, conversión a save más predecible)
- 🔄 **Pivotar a YouTube como canal principal** (publicar lyric video, video oficial si está listo, Shorts adicionales)

#### Importante: Escenario C que persiste 7 días → Crisis 4

Si después de aplicar las acciones del Escenario C durante 7 días (D+7 a D+14) los indicadores siguen en zona C, **se escala a Crisis 4** (sección 11). Esto significa que el problema no es de canal o pauta, es estructural.

---

### Cómo determinar el escenario

**Método de evaluación:**

1. **El día D+7**, el equipo de G*S extrae las métricas actuales del lanzamiento
2. Se comparan contra los benchmarks del tier y modo del artista
3. Se identifica el escenario donde caen la mayoría de indicadores (mínimo 3 de 4 indicadores en la misma zona = escenario confirmado)
4. Si los indicadores están repartidos entre dos escenarios, se toma el escenario de menor performance (conservador)
5. Se ejecutan las acciones del escenario detectado durante D+8 a D+10

**Quién evalúa:** el Agente 10 (Sprint 72hrs) es el responsable operativo. La decisión final de ejecución se valida con G*S.

---

## 11. Protocolo de crisis (5 casos)

### Filosofía

El protocolo de crisis cubre situaciones que **rompen el flujo normal del lanzamiento** y requieren respuesta inmediata fuera del árbol de decisión de los 3 escenarios. Cada crisis tiene un protocolo predefinido que el equipo debe ejecutar sin improvisación.

### CRISIS 1 — Hate masivo / Comentarios negativos

**Síntoma:** oleada de comentarios negativos en los videos del lanzamiento (artista o UGC), proporción de comentarios negativos > positivos en una ventana de 4-6 horas.

**Acciones:**
- ❌ **NO borrar comentarios.** TikTok penaliza algorítmicamente cuando se borran masivamente comentarios. Reduce el alcance.
- ❌ **NO responder agresivamente.** Cualquier respuesta hostil del artista o del equipo genera más hate.
- 🟢 **Activar superfans** para equilibrar con comentarios positivos. Pedir a la base leal (cuenta de fans, lista de WhatsApp) que comente positivamente para diluir el hate.
- 🟡 **Si es muy grave (escala a tendencia negativa):** publicar respuesta oficial del artista, breve, humilde, sin victimizar.

### CRISIS 2 — Leak de la canción

**Síntoma:** la canción aparece en plataformas o redes antes del release oficial.

**Acciones:**
- ⚡ **Adelantar el release si es posible (máximo 48h antes).** Activar contacto con distribuidor para liberar release acelerado.
- 🟡 **Si no se puede adelantar:** publicar snippet oficial inmediatamente para controlar narrativa y que la versión "buena" sea la oficial.
- 🔍 **Identificar fuente del leak** para futuros lanzamientos (productor, mezclador, sello, círculo cercano del artista). Esto es trabajo post-lanzamiento, no urgente.

### CRISIS 3 — Influencer se retracta o genera polémica

**Síntoma:** un creador UGC contratado genera polémica pública (declaración política, escándalo personal, etc.) o se retracta del contenido publicado.

**Acciones:**
- ⚡ **Desvincular inmediatamente.** Pausar pago si está pendiente, retirar el video de Spark Ads si está siendo amplificado.
- ❌ **NO hacer comunicado público.** El silencio es la mejor respuesta. Comunicar genera narrativa donde no la hay.
- 🟢 **Las demás influencers continúan normalmente.** No suspender la campaña UGC general, solo aislar al influencer afectado.

### CRISIS 4 — Canción no prende (Escenario C extendido)

**Síntoma:** Escenario C que persiste 7 días después de aplicar las acciones correctivas (D+14 todavía en zona C).

**Acciones:**
- 🔍 **Analizar fríamente:** ¿es la canción? ¿el clip dominante? ¿el timing del release? ¿la audiencia objetivo?
- 🔄 **Si la canción es buena pero el approach falló:** pivotar a otro formato. Ejemplo: convertir el release en YouTube visual album, lanzar versión acústica o remix, reposicionar como sleeper hit.
- ❌ **NUNCA invertir más dinero por terquedad.** Si la canción no prende a D+14, no prenderá metiendo más presupuesto. Aceptar la realidad y proteger lo que queda del budget para el siguiente release.

### CRISIS 5 — Problemas técnicos

**Síntoma:** la canción no aparece en Spotify, link de pre-save no funciona, distribuidor falla, video bloqueado en YouTube por copyright, etc.

**Acciones:**
- ⚡ **Contactar soporte del distribuidor inmediatamente.** Tener teléfonos directos del soporte premium si está disponible (DistroKid, ONErpm, La Cúpula).
- 🟢 **Tener backup:** comunicar link directo a Apple Music o YouTube como alternativa mientras se resuelve Spotify.
- ❌ **No lanzar ads hasta que el link funcione correctamente.** Cualquier ad que apunta a un link roto quema presupuesto y daña pixel de conversión.

### Protocolo general de comunicación de crisis

**Quién detecta:** el Agente 10 (Sprint 72hrs) en monitoreo en tiempo real, o cualquier miembro del equipo que reciba alerta del cliente o de la comunidad.

**Quién decide:** G*S (no el cliente directamente) evalúa la situación con base en los protocolos definidos arriba y comunica la acción al cliente. El cliente debe estar informado pero la decisión técnica la toma G*S.

**Quién ejecuta:** equipo operativo según el tipo de crisis (CM cuenta fans para Crisis 1, distribuidor para Crisis 2 y 5, equipo de UGC para Crisis 3, equipo de strategy para Crisis 4).

---

## 12. Matriz de palancas vs triggers

| Palanca | Triggers que activa | Plataforma |
|---|---|---|
| **Cuenta del Artista** | UAU-07, UAU-08, UAU-09, UAU-11, UAU-12, UCT-01, UCT-09, UCT-10, UCT-12, UCT-13 | IG, TikTok, YouTube |
| **Cuenta de Fans (CM)** | UAU-05, UAU-06, UAU-08, UCT-07, UCT-08, UCT-10 | IG, TikTok |
| **Prensa Digital** | MOC-06, IE-01, IE-02 | Cross-platform |
| **UGC TikTok (Oleadas)** | MOC-01, MOC-02, MOC-03, MOC-04, MOC-08, UCT-06 | TikTok |
| **Pauta Digital** | UAU-04, UCT-03, UCT-05 | Meta, TikTok, Spotify |
| **Showcase + Live** | MOC-07, UCT-12, IE-02, UAU-08 | Físico + IG/TikTok |
| **Spotify Playlists Pitching** | UCT-04, IE-01 | Spotify |
| **Configuración técnica Spotify** | UAU-02, UCT-05, Artist Pick | Spotify |
| **Inbound Marketing (TOFU/MOFU/BOFU)** | UAU-07, UAU-08, UAU-09, UCT-09, UCT-10 | IG, TikTok, YouTube |
| **Adicionales contratables** | Refuerza palancas existentes según fase | Cross-platform |

---

## 13. Cómo lo usa cada rol del equipo

### Agente 1 — Audit Redes Sociales
**Usa:** UAU de IG/TikTok/YouTube + UCT de IG/TikTok/YouTube + criterios PODERES (parciales)
**Para:** diagnosticar baseline. Marca pre-evaluación de candidato a PODERES.

### Agente 2 — Audit Música y Distribución
**Usa:** UAU de Spotify + UCT de Spotify + IE-01, IE-02 + criterios PODERES (parciales)
**Para:** diagnosticar baseline musical. Marca pre-evaluación de candidato a PODERES.

### Agente 3 — Sintetizador
**Usa:** vista cruzada + matriz palancas/triggers + tabla de tiers + 7 criterios objetivos PODERES
**Para:** definir NSM, mapear hallazgos, emitir recomendación formal Modo Estándar vs PODERES.

### Agente 4 — Strategy Brief Activaciones
**Usa:** matriz palancas/triggers + benchmarks por tier Y MODO + leading/lagging + distribución TOFU/MOFU/BOFU
**Para:** calibrar intensidad de las 6 palancas según hallazgos del audit.

### Agente 5 — Inversión y Presupuesto
**Usa:** triggers 🔴 Pagado + costos asociados + ROI + anclaje a tiers + diferencia inversión Estándar vs PODERES + pricing de los 3 adicionales contratables
**Para:** asignar presupuesto y definir pricing del servicio base + adicionales.

### Agente 6 — Calendarización
**Usa:** Calendario de Activaciones (sección 7) + ventanas de medición + distribución TOFU/MOFU/BOFU
**Para:** convertir strategy brief en calendario día por día.

### Agente 7 — Briefing Creativo
**Usa:** protocolos de activación + lenguaje específico + distribución TOFU/MOFU/BOFU por tier y modo (sección 9)
**Para:** briefs por pieza con hooks, CTAs y formatos correctos.

### Agente 8 — Selección de Medios
**Usa:** MOC-06 + tipo de medios por tier y modo
**Para:** seleccionar medios alineados al tier, modo y ángulo narrativo.

### Agente 9 — Selección de Creadores UGC
**Usa:** MOC-01, MOC-02, MOC-08 + criterios de oleadas + mix por modo
**Para:** armar las 3 oleadas con cantidad y mix correctos.

### Agente 10 — Sprint 72hrs
**Usa:** TODO. Especialmente leading metrics + trigger pairs + acciones correctivas + **árbol de decisión 3 escenarios (sección 10) + protocolo de crisis 5 casos (sección 11)**
**Para:** monitoreo en tiempo real, alertas, ejecución de protocolos, evaluación D+7 de escenario, activación de protocolos de crisis cuando aplique.

### Agente 11 — Reporting ROI
**Usa:** lagging metrics + IE-01, IE-02, IE-03 + fórmulas de ROI + comparativa vs benchmarks del modo
**Para:** reporte D+30 con baseline vs estado actual, calibrado al modo activado.

---

## 14. Versionado

- **v2.3** — Abril 2026. Documento definitivo. Integración completa de árbol de decisión y protocolo de crisis.
  - Cambios mayores vs v2.2:
    - **Sección 10 nueva:** Árbol de decisión de 3 escenarios post-lanzamiento (A: Está pegando, B: Tibio, C: No prende), con indicadores y acciones calibrados por tier y modo. Evaluación día D+7.
    - **Sección 11 nueva:** Protocolo de crisis con 5 casos (Hate masivo, Leak de canción, Influencer se retracta, Canción no prende extendido, Problemas técnicos), con acciones específicas por caso.
    - Regla universal añadida: nunca gastar más del 50% del presupuesto antes del D+7.
    - Conexión Escenario C extendido (>7 días) → Crisis 4.
    - Protocolo de comunicación de crisis: G*S decide, cliente informado, equipo ejecuta.
    - Sección 13 (Cómo lo usa cada rol) actualizada para Agente 10 con referencias explícitas a secciones 10 y 11.
    - Filosofía añadida: "Toda decisión se ancla a data, no a intuición".

- **v2.2** — Distribución TOFU/MOFU/BOFU por tier y modo + adicionales contratables por fase.
- **v2.1** — Modo Estándar/PODERES + Fase 0 Inbound + Fase 4 Observación + anclaje a pricing.
- **v2.0** — Reescritura completa. Reemplazó SancorBrain V8.

---

**Fin del documento**
