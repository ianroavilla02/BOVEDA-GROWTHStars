# Auditoría de Redes Sociales — Marlon Villamil

> **Agente 1 — Audit Redes Sociales (G\*S)** · Prompt v2
> **Artista:** Marlon Villamil (Chimbita Records) · Producto: MGMT
> **Fecha de auditoría:** 2026-07-18
> **Ventanas temporales de la data:** TikTok 1–7 jul (7 días) · Instagram 8 jun–7 jul (30 días) · YouTube 10 jun–7 jul (28 días)
> **Fuentes:** JSON validados con Ian (demografía ground truth) + screenshots originales TikTok/IG/YT
> **Alcance:** Instagram, TikTok, YouTube. NO cubre Spotify/distribuidora (Agente 2).

---

## 0. Confirmación de inputs y datos faltantes críticos

**Plataformas disponibles:** las 3 (IG, TikTok, YouTube).

**Rangos temporales disponibles:** heterogéneos (TikTok 7d, IG 30d, YT 28d). La ventana de TikTok es de solo 7 días, insuficiente para declarar tendencia de 90 días con certeza. **Ninguna plataforma aporta serie de 90 días completa** — el Criterio 3 PODERES se evalúa con proxies de 28–30 días.

**Datos faltantes críticos identificados ANTES de auditar:**

| Dato faltante | Plataforma | Impacto en la decisión |
|---|---|---|
| **Conteo total de seguidores** | TikTok | Bloquea la clasificación formal de tier (la banda de tier se define por seguidores TikTok). Tab "Seguidores" no capturado. |
| Conteo total de seguidores | Instagram | Impide calcular tasa exacta de rotación; solo hay neto -3.880. |
| Suscriptores totales del canal | YouTube | Impide dimensionar el activo YT; solo hay neto -36. |
| Clics en bio / link externo | IG + TikTok | Impide medir conversión red → tráfico externo (funnel de fondo). |
| Demografía YouTube | YouTube | Deja el Criterio 4 (coherencia demográfica) verificable solo en 2 de 3 plataformas. |
| Serie de seguidores 90 días | Las 3 | Criterio 3 se evalúa con proxy 28–30d, no con la ventana canónica de 90d. |
| Retention curve / completion rate por video | TikTok, IG Reels, YT | Impide evaluar UAU-03, UAU-09, UAU-10, UAU-12 (completion/watch). |

Los valores marcados `null`/no legibles en los JSON se reportan como **"pendiente por enviar"**, no se estiman.

---

## 1. Resumen ejecutivo

Marlon Villamil opera un ecosistema social de **alto volumen de vistas pero con fuga de comunidad y sin identidad de artista musical visible**. Genera tracción real (IG 6,26M vistas/30d; TikTok 222,8K vistas/7d con +20,6%), pero la comunidad se está contrayendo: Instagram perdió **-3.880 seguidores netos en 30 días** y YouTube -36 suscriptores, todo esto mientras el contenido rinde en vistas. El perfil de audiencia (mujer joven 18-24, Colombia+México) es sólido y coherente entre IG y TikTok, pero **la propuesta es de creador/entretenimiento personal, no de músico** — la narrativa de artista indie pop urbano es casi inexistente en el contenido.

**Top 3 hallazgos críticos:**
- **Fuga de comunidad en IG:** -3.880 seguidores netos/30d pese a 6,26M vistas y 234K interacciones. Vistas altas que no retienen ni convierten en follow.
- **Descubrimiento roto en IG vs sano en TikTok:** IG solo 12,2% de vistas de no-seguidores (baja adquisición); TikTok 70,4% desde "Para ti" (motor de descubrimiento activo). El funnel de entrada vive en TikTok, no en IG.
- **Comunidad pasiva:** comment-to-view TikTok de 0,055% (122 comentarios sobre 222,8K vistas) vs benchmark UAU-05 de 2%. Muchos likes, casi ninguna conversación.

**Veredicto:** ecosistema **a optimizar** (con un activo YouTube que requiere reconstrucción o abandono deliberado).

**Tier observado desde TikTok:** **no determinable con certeza** (falta conteo de seguidores TikTok). Señales indirectas (volumen de vistas, 36,9K likes en top video, alcance) apuntan a **rango Tier 2 (50K–500K)**, lo que **contradice el Tier 1 pre-declarado** en `contexto.md`. Flag para el Sintetizador.

**Pre-evaluación PODERES (4 criterios que evalúo):** **1 de 4 se cumple** (Crit. 6). Crit. 3 ✗, Crit. 4 ✓ parcial (falta YT), Crit. 7 ✗.

---

## 2. Scorecard general del ecosistema

| Dimensión | Score (1-5) | Sustento |
|---|---|---|
| Tracción base | **4** | IG 6,26M vistas/30d y 399K cuentas alcanzadas; TikTok 222,8K vistas/7d; magnitud alta pese a YT débil. |
| Crecimiento | **2** | IG -3.880 seguidores/30d, YT -36 subs; TikTok vistas +20,6% pero sin dato de seguidores. Neto de comunidad negativo. |
| Engagement quality | **2** | Likes altos pero comment-to-view TikTok 0,055% (vs 2%); saves IG bajos; pérdida de seguidores = engagement no fideliza. |
| Coherencia narrativa cross-platform | **2** | IG/TikTok coherentes como persona, pero identidad de músico ausente; YT es contenido legacy (culinario/"cuarentena") fuera de era. |
| Conversión a tráfico externo | **N/D** | Sin datos de clics en bio ni link externo. Pendiente por enviar. |
| Cadencia y consistencia | **4** | Publicación muy frecuente (posts a 1d/2d/3d/4d) y sostenida; aparición personal constante. |

**Score total (dimensiones medibles): 14/25 en 5 dimensiones evaluadas → promedio 2,8/5.** Interpretación: **ecosistema con tracción pero con fugas estructurales en comunidad e identidad**. La fortaleza es volumen y cadencia; la debilidad es retención, profundidad de engagement y posicionamiento musical.

---

## 3. Diagnóstico por plataforma

### 3.1 Instagram (30 días)

**KPIs principales:**
- Vistas totales: **6.262.266**
- Cuentas alcanzadas: **399.258**
- Interacciones: **234.948**
- Seguidores netos: **-3.880**
- Vistas de seguidores / no-seguidores: **87,8% / 12,2%**
- Desglose de vistas: Publicaciones 1,1M · Reels 833K · Historias 4,3K · En vivo 0
- Mejor post por alcance: "Oigan esta gorra ha sido mi má..." → **175,7K alcance, 41,0K likes, 141 comentarios, 267 compartidos, 695 guardados**
- Reel individual más visto: "Tenía todas estas selfies..." → **520,6K vistas, 36,9K likes, 92 comentarios, 156 compartidos**

**Tendencias (proxy 30d):** vistas con picos fuertes (hasta ~659K en un día) pero **seguidores en negativo**. Horario de mayor actividad: domingos, martes y miércoles 6pm–9pm.

**Top performers:** contenido personal/selfie y de "personalidad" (gorra, cuidado de piel, comida "Y SI SI??"). **Bottom:** no aislable con la data entregada; publicaciones de bajo alcance no detalladas.

- **Fortalezas:** volumen de vistas muy alto; base fiel (87,8% de vistas son de seguidores); interacción por cuenta alcanzada elevada (234.948/399.258 = **58,8%**).
- **Debilidades:** (1) **pérdida neta de -3.880 seguidores** pese al volumen; (2) **descubrimiento bajo** — solo 12,2% de vistas de no-seguidores (~48,7K cuentas nuevas); (3) save rate del top post 695/175,7K = **0,40%** (muy por debajo de UAU-07 >5%).
- **Oportunidades:** el contenido con banderas MX/CO y de "personalidad" viraliza; hay materia prima para reconvertir alcance en follows con CTAs y formatos de retención.

**Notas no legibles (pendiente por enviar):** vistas exactas del post "A ver" ("40,3 m" unidad cortada); alcance exacto de "Recomiéndenme series" ("84,3 m" unidad cortada).

### 3.2 TikTok (7 días)

**KPIs principales:**
- Vistas de publicaciones: **222,8K (+38K, +20,6%)**
- Vistas de perfil: **4,6K (+778, +20,5%)**
- Me gusta: **43,1K (+15,7K, +57,2%)**
- Comentarios: **122 (variación reportada -383,7%)**
- Compartidos: **1,5K (+839, +133,6%)**
- Recompensas: **$0,00** (sin monetización activa)
- Fuentes de tráfico: **Para ti 70,4%** · Perfil personal 17,9% · Buscar 6,1% · Sonido 3,5% · Siguiendo 2,1%
- Peak de actividad: **martes 5pm–6pm**; pico diario jul 06 = 5,5K
- Top video: "Tenía todas estas selfies..." → **520,6K vistas, 36,9K likes, 92 comentarios, 156 compartidos, 81 guardados**
- Creadores de overlap: VRB/Valeri (879K), LA_BLANQU (14M), Naimdarrechi (33M), karen torre (25M) → nicho entretenimiento/pop masivo.

**Tendencias:** semana explosiva en likes (+57,2%) y shares (+133,6%); vistas +20,6%. **Ventana de 7 días — insuficiente para tendencia de 90d.**

- **Fortalezas:** motor de descubrimiento sano (**70,4% Para ti**); like-to-view muy alto (43,1K/222,8K = **19,3%**); shares creciendo fuerte.
- **Debilidades:** (1) **comment-to-view 0,055%** (122/222,8K) vs UAU-05 >2% — comunidad pasiva; (2) tasa de visita a perfil 4,6K/222,8K = **2,06%**, por debajo del umbral de conversión sano (~5%); (3) sin monetización.
- **Oportunidades:** el 17,9% de tráfico de "perfil personal" indica reconocimiento de marca aprovechable; SEO/búsqueda aún sin tráfico suficiente (oportunidad de captura por keywords).

### 3.3 YouTube (28 días)

**KPIs principales:**
- Vistas: **10,4K–10,7K** (discrepancia entre tabs Contenido/Resumen)
- Impresiones: **114,4K**
- Tiempo de reproducción: **1,3K horas (-104h vs habitual)**
- CTR: **5,9%**
- Suscriptores netos: **-36** (confianza media)
- View rate (vistas/impresiones): 10,4K/114,4K = **9,1%**
- Top 5 videos: contenido **culinario y de "cuarentena"/familiar** (Lasaña navideña, Divirtiéndonos en cuarentena, NO DIO PARA MAS, Hice sushi, Reaccionando a confesiones) — 100% legacy, no musical actual.

**Tendencias:** impresiones planas (114,4K), watch time **en descenso (-104h)**, suscriptores **en descenso (-36)**. Retención decayendo con distribución algorítmica estable.

- **Fortalezas:** CTR 5,9% supera el genérico de YT (2-5%); impresiones estables.
- **Debilidades:** (1) canal en contracción (subs y watch time negativos); (2) **contenido fuera de era** (referencias a cuarentena = catálogo viejo, formato vlog no musical); (3) CTR 5,9% **por debajo de UAU-11 >8%** (gap -2,1pp); (4) volumen marginal (10K vistas/mes) frente a IG/TikTok.
- **Oportunidades:** activo prácticamente dormido. Decisión pendiente: reconstruir con contenido de era actual (Shorts musicales) o desinvertir conscientemente.

**Datos faltantes (pendiente por enviar):** suscriptores totales del canal; demografía YT; variación % exacta de subs ("Un 5% m..." cortado); confirmación de nombre de métrica "Tasa d..." (valor 5,9% legible, contexto = CTR).

---

## 4. Análisis cruzado del ecosistema

### 4.1 Tabla resumen cross-platform

| Métrica | Instagram | TikTok | YouTube |
|---|---|---|---|
| Ventana | 30d | 7d | 28d |
| Seguidores totales | pendiente por enviar | pendiente por enviar | pendiente por enviar |
| Crecimiento seguidores | **-3.880 neto** | s/d seguidores (vistas +20,6%) | **-36 neto** |
| Vistas | 6,26M | 222,8K (7d) | 10,4K |
| Alcance/impresiones | 399,3K cuentas | — | 114,4K impresiones |
| Engagement destacado | 234,9K interacciones | 43,1K likes / 122 comentarios | CTR 5,9% |
| Descubrimiento | 12,2% no-seguidores | 70,4% Para ti | 9,1% view rate |
| Género top audiencia | 83,6% mujer | 84% mujer | pendiente |
| Edad top | 57,8% 18-24 | 56% 18-24 | pendiente |
| País top | Colombia 52,7% / México 18,7% | Colombia 55,8% / México 23,6% | pendiente |

### 4.2 Matriz de funnel (descubrimiento → comunidad → conversión)

| Etapa | Estado | Evidencia |
|---|---|---|
| **Descubrimiento** | Concentrado en TikTok | TikTok 70,4% Para ti; IG solo 12,2% no-seguidores |
| **Comunidad** | En fuga | IG -3.880 seg/30d; YT -36 subs; comment-to-view TikTok 0,055% |
| **Conversión (a follow)** | Débil en IG | 6,26M vistas → follows negativos; visita a perfil TikTok 2,06% |
| **Conversión (a externo)** | No medible | Sin data de clics en bio/link — pendiente por enviar |

### 4.3 Hallazgos de los 8 cruces críticos

1. **Coherencia demográfica IG↔TikTok: muy alta.** Mujer 83,6%/84%, 18-24 57,8%/56%, Colombia 52,7%/55,8%, México 18,7%/23,6%. YouTube sin demografía (gap de verificación).
2. **Descubrimiento vs conversión a follow:** TikTok descubre bien (70,4% FYP) pero convierte poco a perfil (2,06%); IG casi no descubre (12,2%) y además pierde seguidores. El embudo de entrada está en TikTok, la fuga está en IG.
3. **Velocidad de crecimiento relativo:** TikTok en expansión de vistas (+20,6%); IG y YouTube en contracción de comunidad. Divergencia clara entre plataformas.
4. **Mismo contenido cross-platform:** "Tenía todas estas selfies" rinde en ambas (IG 520,6K vistas / TikTok 520,6K vistas) — el contenido personal viaja bien, pero es contenido de personalidad, no musical.
5. **Conversión a tráfico externo:** no evaluable (sin datos de clics). Fuga potencial de fondo de embudo sin instrumentar.
6. **Engagement quality vs vanity:** likes muy altos (TikTok 19,3% like-to-view; IG 41K en top post) conviven con comentarios ínfimos (122 en TikTok) y pérdida de seguidores → engagement superficial, no comunidad.
7. **Cadencia vs performance:** cadencia alta y sostenida sostiene el volumen de vistas, pero no frena la fuga de seguidores → problema no es frecuencia, es retención/propuesta.
8. **Coherencia narrativa cross-platform:** persona coherente (creador/entretenimiento), pero **identidad de artista musical ausente**; YT es de otra era (culinario/cuarentena). Narrativa fragmentada creador↔músico.

### 4.4 Mapa de fugas detectadas

- **Fuga 1 — Retención IG:** 6,26M vistas → -3.880 seguidores. Vistas que no fidelizan.
- **Fuga 2 — Profundidad de engagement TikTok:** comment-to-view 0,055%; audiencia consume pero no conversa.
- **Fuga 3 — Conversión a perfil TikTok:** 2,06% visita perfil desde vistas.
- **Fuga 4 — Activo YouTube:** subs y watch time en descenso, contenido fuera de era.
- **Fuga 5 — Identidad musical:** el músico no aparece como músico; no hay conversión de audiencia de "personalidad" a audiencia de "artista".

---

## 5. Aplicación de triggers del Sistema v2.3 (benchmarks Modo Estándar)

| Plataforma | Trigger | Baseline actual | Benchmark Estándar | Estado | ¿Supera PODERES? |
|---|---|---|---|---|---|
| TikTok | **UAU-05** Comment-to-View | 0,055% (122/222,8K) | >2% | **Muy por debajo** (gap -1,945pp) | No |
| TikTok | **UAU-06** Visita perfil (proxy vistas) | 2,06% (4,6K/222,8K) | >5% | Por debajo (gap -2,94pp) | No |
| TikTok | **UCT-07** Share-to-View | 0,67% (1,5K/222,8K) | ~1% (Tier bajo) | Ligeramente por debajo | No |
| TikTok | Like-to-View (referencia) | 19,3% (43,1K/222,8K) | — | Muy fuerte | Señal positiva |
| TikTok | **UAU-03** Completion Rate | pendiente por enviar | >55% | No evaluable | — |
| TikTok | **UCT-08** Duet/Stitch Ratio | pendiente por enviar | calibrado por tier | No evaluable | — |
| Instagram | **UAU-07** Save Rate (top post) | 0,40% (695/175,7K) | >5% | Muy por debajo | No |
| Instagram | **UCT-10** DM Shares vs Likes (top post) | 0,65% (267/41K) | calibrado por tier | Bajo | No |
| Instagram | **UAU-08** Story Reply Rate | pendiente por enviar | >3% | No evaluable | — |
| Instagram | **UAU-09** Reel Completion | pendiente por enviar | >80% | No evaluable | — |
| Instagram | Interacción/alcance (referencia) | 58,8% (234,9K/399,3K) | — | Fuerte en magnitud | Señal positiva bruta |
| YouTube | **UAU-11** CTR Thumbnail | 5,9% | >8% | Por debajo (gap -2,1pp) | No |
| YouTube | **UAU-12** Watch Time video largo | pendiente por enviar (watch time total -104h) | >50% | No evaluable / tendencia negativa | No |
| YouTube | **UAU-10** Short Completion Rate | pendiente por enviar | >90% | No evaluable | — |
| YouTube | **UCT-13** Subscriber Conversion desde Short | -36 subs netos | calibrado por tier | Negativo | No |

**Síntesis de triggers:** ningún trigger de redes supera el benchmark PODERES. Fugas confirmadas en UAU-05, UAU-06, UAU-07, UAU-11 y UCT-13. Fortalezas brutas (no-trigger canónico) en like-to-view TikTok e interacción/alcance IG, pero no compensan la fuga de comunidad.

---

## 6. Pre-clasificación de tier desde TikTok

- **Seguidores actuales TikTok:** **pendiente por enviar** (tab "Seguidores" no capturado).
- **Tier observado:** **no determinable con certeza.** Señales indirectas (222,8K vistas/7d, 36,9K likes en top video, 520,6K vistas de un solo video, overlap con creadores masivos) sugieren un piso de audiencia **compatible con Tier 2 (50K–500K)**, e improbable Tier 1 (<50K).
- **Justificación:** el volumen de likes absolutos y el alcance por pieza son inconsistentes con una base <50K. Sin embargo, no se puede confirmar sin el conteo directo.
- **Discrepancia flageada:** `contexto.md` declara **Tier 1**; la evidencia social apunta a **Tier 2**. El Sintetizador debe resolver este conflicto cruzando con el conteo real de seguidores TikTok y con el Agente 2 (Spotify).
- **Nota:** *El Sintetizador determinará el tier final cruzando con observaciones del Agente 2. Recordar la regla G\*S: se toma el tier más bajo entre Spotify y TikTok.*

---

## 7. Pre-evaluación de criterios PODERES (4 de 7)

| # | Criterio | Evaluación | Evidencia | Resultado |
|---|---|---|---|---|
| 3 | Crecimiento orgánico positivo 90d | Comunidad en contracción en 2 de 3 plataformas; TikTok solo con dato de vistas (no seguidores) y ventana de 7d | IG **-3.880 seg/30d**; YT **-36 subs/28d**; TikTok vistas +20,6% pero sin serie de seguidores | **✗** (con caveat: falta serie 90d y seguidores TikTok) |
| 4 | Coherencia demográfica | Alta coherencia IG↔TikTok; YouTube sin demografía | Mujer 83,6%/84%; 18-24 57,8%/56%; Colombia 52,7%/55,8%; México 18,7%/23,6% | **✓ parcial** (falta demografía YT para cierre) |
| 6 | Disponibilidad del artista | Alta: publica varias veces/semana y aparece personalmente en casi todo el contenido | Posts IG/TikTok a 1d/2d/3d/4d; selfies, vlog personal, apariciones directas constantes | **✓** |
| 7 | Identidad visual/narrativa establecida | Persona coherente pero **identidad de artista musical ausente**; YT fuera de era (culinario/cuarentena). Narrativa fragmentada creador↔músico | Top content = gorra, selfies, series, reacciones fútbol; música casi invisible; YT legacy | **✗** (identidad fragmentada — flag, sin profundizar por regla 11) |

**Resultado agregado: 1 de 4 criterios se cumple limpio (Crit. 6); Crit. 4 se cumple parcialmente; Crit. 3 y 7 no se cumplen.**

---

## 8. Hallazgos críticos (Top 5)

1. **Fuga de comunidad en Instagram** — *Crítica.* -3.880 seguidores netos/30d con 6,26M vistas y 234K interacciones. Vistas altas que no retienen. Impacto: erosión de la base de fondo de embudo pese a inversión de contenido.
2. **Descubrimiento asimétrico IG vs TikTok** — *Alta.* IG 12,2% no-seguidores vs TikTok 70,4% Para ti. El motor de adquisición vive solo en TikTok; IG no capta audiencia nueva. Impacto: dependencia de una sola plataforma para crecer.
3. **Comunidad pasiva (engagement superficial)** — *Alta.* Comment-to-view TikTok 0,055% (vs 2%) y save rate IG 0,40% (vs 5%). Muchos likes, poca conversación/guardado. Impacto: baja señal de comunidad profunda para el algoritmo y para conversión musical.
4. **Identidad de artista musical ausente** — *Crítica (estratégica).* El contenido es de creador/entretenimiento; la música no está en el centro. YT es catálogo viejo no musical. Impacto: la audiencia sigue a la persona, no al músico → riesgo de no convertir a streams.
5. **YouTube en contracción y fuera de era** — *Media.* Subs -36, watch time -104h, top 5 = contenido culinario/cuarentena. Impacto: activo dormido que resta más de lo que suma; requiere decisión de reconstruir o desinvertir.

---

## 9. Recomendaciones priorizadas

| Acción | Plataforma | KPI que mueve | Timeline | Inversión | Prioridad |
|---|---|---|---|---|---|
| Instrumentar y auditar retención: identificar qué formatos preceden a unfollows en IG (revisar top posts vs curva de seguidores) | IG | Seguidores netos | Semana 1-2 | Baja | Crítica |
| Introducir contenido con música propia en el centro (snippets, behind-the-song) manteniendo la persona | TikTok + IG | Comment-to-view, conversión a artista | Semana 1-4 | Baja-Media | Crítica |
| Añadir CTAs de follow y ganchos de retención en Reels/videos de alto alcance para convertir vistas de no-seguidores | IG | % no-seguidores → follow | Semana 2-3 | Baja | Alta |
| Activar formatos que fuercen conversación (preguntas, respuestas en comentarios) para subir comment-to-view | TikTok | UAU-05 | Semana 2-4 | Baja | Alta |
| Capturar y enviar métricas faltantes (seguidores TikTok/IG, subs YT, clics bio, retención) | Todas | Habilita decisiones bloqueadas | Semana 1 | Nula | Crítica |
| Decidir YouTube: piloto de Shorts musicales de era actual o congelar el canal | YouTube | Watch time, subs | Semana 3-4 | Media | Media |
| Aprovechar horarios pico (IG dom/mar/mié 6-9pm; TikTok mar 5-6pm) para publicación de piezas clave | IG + TikTok | Alcance orgánico | Inmediato | Nula | Media |

---

## 10. Datos faltantes y limitaciones

- **Conteo de seguidores TikTok:** bloquea la clasificación formal de tier. **Sin esto, el tier queda "no determinable" y la discrepancia con contexto.md (Tier 1) no se puede cerrar.**
- **Seguidores totales IG y subs totales YT:** impiden calcular tasas de rotación y dimensionar activos.
- **Clics en bio / link externo (IG, TikTok):** impiden evaluar conversión red → tráfico externo (Sección 4.4 y scorecard "conversión externa" quedan N/D).
- **Demografía YouTube:** deja el Criterio 4 verificable solo en IG↔TikTok.
- **Serie de 90 días:** no disponible; Criterio 3 evaluado con proxy 28–30d.
- **Retention/completion por video:** impide evaluar UAU-03, 09, 10, 12.
- **Ventana TikTok de solo 7 días:** insuficiente para tendencia robusta; conclusiones de crecimiento TikTok son preliminares.
- **Valores IG cortados (pendiente por enviar):** vistas de "A ver" y alcance de "Recomiéndenme series".

---

## 11. Inputs estructurados para el Sintetizador (Agente 3)

```
TIER OBSERVADO DESDE TIKTOK: NO DETERMINABLE (falta conteo de seguidores TikTok)
- Seguidores TikTok: pendiente por enviar (tab Seguidores no capturado)
- Estimación indirecta: rango Tier 2 (50K-500K) por volumen de vistas/likes/alcance
- Justificación: 222,8K vistas/7d, 36,9K likes y 520,6K vistas en top video son inconsistentes con base <50K
- CONFLICTO: contexto.md declara Tier 1; evidencia social sugiere Tier 2. Resolver con conteo real.

CRITERIOS PODERES PRE-EVALUADOS (4 de 7):
- Criterio 3 (Crecimiento orgánico 90d): ✗ (IG -3.880/30d, YT -36/28d; TikTok solo vistas; falta serie 90d)
- Criterio 4 (Coherencia demográfica): ✓ parcial (IG↔TikTok muy coherentes; falta demografía YT)
- Criterio 6 (Disponibilidad del artista): ✓ (publicación multi-semanal + aparición personal constante)
- Criterio 7 (Identidad establecida): ✗ (persona coherente pero identidad de MÚSICO ausente; YT fuera de era)

TOP 3 HALLAZGOS DEL ECOSISTEMA SOCIAL:
1. Fuga de comunidad IG: -3.880 seguidores netos/30d pese a 6,26M vistas y 234K interacciones.
2. Descubrimiento asimétrico: IG 12,2% no-seguidores vs TikTok 70,4% Para ti; adquisición vive solo en TikTok.
3. Comunidad pasiva: comment-to-view TikTok 0,055% (vs 2%) y save rate IG 0,40% (vs 5%).

TRIGGERS DE REDES CON FUGAS DETECTADAS:
- UAU-05 (Comment-to-View TikTok): 0,055% vs 2%
- UAU-06 (Visita perfil TikTok): 2,06% vs 5%
- UAU-07 (Save Rate IG): 0,40% vs 5%
- UAU-11 (CTR YouTube): 5,9% vs 8%
- UCT-13 (Subscriber Conversion YT): -36 netos
- UCT-07 (Share-to-View TikTok): 0,67% vs ~1%

TRIGGERS DE REDES CON FORTALEZAS:
- Like-to-View TikTok: 19,3% (muy fuerte, pero superficial sin comentarios)
- Interacción/alcance IG: 58,8% (fuerte en magnitud bruta)
- (Ninguno supera benchmark PODERES; señales positivas no compensan la fuga de comunidad)

DEMOGRAFÍA CROSS-PLATFORM:
- IG: 83,6% mujer, 57,8% 18-24 (91,4% entre 18-34), Colombia 52,7% / México 18,7%
- TikTok: 84% mujer, 56% 18-24 (92,5% entre 18-34), Colombia 55,8% / México 23,6%
- YouTube: pendiente por enviar (sin demografía capturada)
- Coherencia: MUY ALTA entre IG y TikTok (género, edad y país casi idénticos). Nota: el país top de AUDIENCIA es Colombia, aunque contexto.md ubica al artista en México (MX/CDMX) — la geografía del artista ≠ geografía de la audiencia.

DATOS FALTANTES CRÍTICOS (que el Sintetizador debe conseguir):
- Conteo de seguidores TikTok (desbloquea tier)
- Seguidores totales IG + suscriptores totales YT
- Clics en bio / link externo (conversión a tráfico externo)
- Demografía YouTube (cierra Criterio 4)
- Serie de seguidores 90 días (cierra Criterio 3 con ventana canónica)
- Retention/completion por video (UAU-03, 09, 10, 12)
```

---

*Auditoría generada por Agente 1 — Audit Redes Sociales (G\*S). Benchmarks aplicados en Modo Estándar (Sistema de Triggers v2.3). El tier final y el modo de servicio los determina el Sintetizador (Agente 3).*
