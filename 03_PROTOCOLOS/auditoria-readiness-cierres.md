# Auditoría de Readiness Archive-First para Cierres de Mes

> Árbol auditado: el definido en `03_PROTOCOLOS/SOP-CIERRE-DE-MES.md`.
> Artistas/sellos auditados: Reckless, Marlon Villamil, Chimbita Records.
> Fecha: 2026-07-16.
> Regla: se reporta lo que existe y lo que falta. No se escribe contenido ni se crean carpetas vacías.

---

## Metodología

Cada fila representa un nodo del árbol estándar del SOP. El **estado** puede ser:

- **EXISTS** — el archivo/carpeta está presente y tiene contenido suficiente.
- **A MEDIAS** — existe, pero está incompleto, es un template sin llenar o requiere revisión.
- **FALTA** — no existe.
- **CONVENCIÓN ERRÓNEA** — existe algo similar pero con nombre/ubicación/formato distinto al SOP.

El **tipo de gap** indica quién debe actuar:

- **Mecánico** — falta scaffold, renombrar carpeta, crear estructura. Puede resolverlo el CTO/operaciones.
- **Contenido** — falta material que debe producir el Growth Hacker / Jefe de Área (auditoría, brand-book, dirección artística, actas). No se automatiza.
- **Convención** — el material existe pero no respeta la convención de nombres/ubicación del SOP.

---

## 1. Reckless

| Nodo | Estado | Tipo de gap | Notas |
|------|--------|-------------|-------|
| `contexto.md` | EXISTS | — | Completo: bio, sonoridad, narrativa de era, audiencia, posicionamiento, métricas de baseline, decisiones estratégicas. 297 líneas. |
| `brand-book/` | EXISTS | — | Tiene `01-vision-estrategica.md` con manifiesto, storyworld, mood, paleta, audiencia. 88 líneas. |
| `direccion-artistica/YYYY-MM.md` | CONVENCIÓN ERRÓNEA | Convención | No existe `direccion-artistica/`. Existe `03-direccion-musical/` con `index.html` (HTML publicado, no .md mensual). Para el SOP se necesita `direccion-artistica/YYYY-MM.md`. |
| `01-auditorias/` | EXISTS | — | Tiene `auditoria-musical.md` y `auditoria-redes-sociales.md`. Ambos ahora incluyen tabla `## Métricas clave`. |
| `02-sintesis/` | EXISTS | — | Tiene `sintesis-growth.md`. `index.html` es el HTML publicado, no fuente. |
| `lanzamientos/<x>/estrategia.md` | FALTA | Contenido | No hay carpeta `lanzamientos/`. Junio fue mes de preparación de marca (0 lanzamientos), pero el árbol del SOP prevé el nodo para futuros meses. |
| `mgmt/meetings/` | EXISTS | — | 7 actas de junio 2026 (`empalme-meta-1` ×2, `empalme-meta-3`, `empalme-meta-4`, `entrega-meta-1`, `entrega-meta-3`, `snippet-testing`). |
| `mgmt/monthly/informe-YYYY-MM.md` | EXISTS | — | `informe-2026-06.md` reconstruido desde HTML. 191 líneas. |
| `mgmt/monthly/resumen-YYYY-MM.md` | EXISTS | — | Convención reciente (DT-042). `resumen-2026-06.md` creado con frontmatter estructurado. **No forma parte del SOP original; se incluye como nota.** |

**Veredicto Reckless:** el árbol está casi completo. El único gap activo es la convención de `direccion-artistica/` vs `03-direccion-musical/`. Es el artista más maduro para automatizar cierres de mes.

---

## 2. Marlon Villamil

| Nodo | Estado | Tipo de gap | Notas |
|------|--------|-------------|-------|
| `contexto.md` | A MEDIAS | Contenido | Es el template generado por `onboard-client.js` el 2026-07-13. Todas las secciones narrativas dicen `[pendiente]`. Solo tiene datos comerciales básicos (Tier 1, indie pop urbano, MX, MGMT). |
| `brand-book/` | FALTA | Contenido | No existe carpeta ni archivo de brand. |
| `direccion-artistica/YYYY-MM.md` | FALTA | Contenido | No existe carpeta. |
| `01-auditorias/` | FALTA | Contenido | No existe carpeta ni auditorías. |
| `02-sintesis/` | FALTA | Contenido | No existe carpeta ni síntesis. |
| `lanzamientos/<x>/estrategia.md` | FALTA | Contenido | No existe carpeta `lanzamientos/`. |
| `mgmt/meetings/` | FALTA | Contenido | No existe carpeta `mgmt/meetings/`. Existe `mgmt/deliverables/` (vacía) y `mgmt/monthly/` (vacía). |
| `mgmt/monthly/informe-YYYY-MM.md` | FALTA | Contenido | No existe informe de cierre. |
| `mgmt/monthly/resumen-YYYY-MM.md` | FALTA | Mecánico + Contenido | Convención reciente; no existe. Requiere input de Control. |

**Veredicto Marlon Villamil:** el artista fue onboarded recientemente y aún no tiene material de contexto ni operativo. **No está listo para un cierre de mes automático.** Antes de automatizar necesita: contexto.md completo, brand-book, al menos una auditoría inicial, y actas de reunión.

---

## 3. Chimbita Records

| Nodo | Estado | Tipo de gap | Notas |
|------|--------|-------------|-------|
| `contexto.md` | EXISTS | — | Completo para el sello: sobre el sello, identidad, equipo, artistas, catálogo, posicionamiento, audiencia, lineamientos. 116 líneas. |
| `brand-book/` | FALTA | Contenido | No existe carpeta `brand-book/` a nivel de sello. El artista Javier Ferreira (archivado) tiene `artistas/javier-ferreira/brand.md`, pero no sigue la convención del SOP (`brand-book/01-vision-estrategica.md`). |
| `direccion-artistica/YYYY-MM.md` | FALTA | Contenido | No existe carpeta. |
| `01-auditorias/` | FALTA | Contenido | No existe carpeta ni auditorías del sello ni de sus artistas activos. |
| `02-sintesis/` | FALTA | Contenido | No existe carpeta ni síntesis. |
| `lanzamientos/<x>/estrategia.md` | FALTA | Contenido | No existe carpeta `lanzamientos/`. El sello tiene catálogo de canciones documentado en `contexto.md`, pero no estrategia.md por lanzamiento. |
| `mgmt/meetings/` | A MEDIAS | Contenido | Existe la carpeta `mgmt/meetings/` pero está vacía. No hay actas registradas. |
| `mgmt/monthly/informe-YYYY-MM.md` | FALTA | Contenido | No existe informe de cierre del sello. |
| `mgmt/monthly/resumen-YYYY-MM.md` | FALTA | Mecánico + Contenido | Convención reciente; no existe. Requiere input de Control. |

**Nota sobre artistas del sello:** Javier Ferreira figura como archivado en el contexto operativo. No se audita como activo. Marlon aparece en `contexto.md` de Chimbita como "posibilidad futura, en evaluación" — no es artista firmado todavía.

**Veredicto Chimbita Records:** el sello tiene contexto institucional, pero le falta todo el scaffold operativo: brand-book formal, auditorías, actas y cierres de mes. **No está listo para cierre automático.**

---

## Resumen ejecutivo

| Artista/Sello | Nodos EXISTS | Nodos A MEDIAS | Nodos FALTAN/CONVENCIÓN ERRÓNEA | Listo para cierre automático |
|---------------|--------------|----------------|----------------------------------|------------------------------|
| Reckless | 8 | 0 | 1 (`direccion-artistica/` como `03-direccion-musical/`) | **Casi** — corregir convención nombres |
| Marlon Villamil | 0 | 1 (`contexto.md` template) | 8 | **No** — falta scaffold y contenido |
| Chimbita Records | 1 (`contexto.md`) | 1 (`mgmt/meetings/` vacía) | 7 | **No** — falta scaffold y contenido |

---

## Recomendaciones

### Inmediatas (mecánicas)
1. **Reckless:** renombrar/mover `03-direccion-musical/` a `direccion-artistica/` y convertir el contenido mensual a `.md` (ej. `direccion-artistica/2026-06.md`, `direccion-artistica/2026-07.md`).
2. **Marlon Villamil:** crear el scaffold del árbol (`brand-book/`, `01-auditorias/`, `02-sintesis/`, `direccion-artistica/`, `lanzamientos/`, `mgmt/meetings/`, `mgmt/monthly/`) solo cuando el Growth Hacker vaya a llenarlo. No crear carpetas vacías de adorno.
3. **Chimbita Records:** igual que Marlon — scaffold bajo demanda, no de adorno.

### De contenido (requieren Growth Hacker / Jefe de Área)
1. **Marlon Villamil:** completar `contexto.md`, producir brand-book, auditoría musical + redes, síntesis growth, y registrar actas de reuniones.
2. **Chimbita Records:** producir brand-book del sello, auditorías, actas de reuniones mensuales, y resumen operativo mensual.
3. **Reckless:** crear `direccion-artistica/YYYY-MM.md` para junio y meses siguientes (feed, guiones, snippet testing).

### Para DT-044 (automatización)
- **No automatizar el cierre para Marlon ni Chimbita** hasta que tengan al menos: contexto.md completo, una auditoría, brand-book, y actas del mes.
- **Reckless es el único candidato inmediato** para un Loop de cierre automático, previa corrección de `direccion-artistica/`.
- El compilador DT-042 ya puede generar el andamio mecánico de Reckless cuando exista `resumen-YYYY-MM.md`; la narrativa sigue siendo responsabilidad de Control.
