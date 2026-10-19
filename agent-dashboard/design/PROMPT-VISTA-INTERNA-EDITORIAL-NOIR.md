# PROMPT: Implementar Vista Interna de Artista — Editorial Noir

> **Para:** CTO Jr (Claude Code operativo)
> **Scope:** SOLO la vista interna de artista (`renderMgmtClientDetail` y funciones relacionadas)
> **Stack:** Vanilla JS con template literals, NO React/Vue/frameworks
> **Archivo target:** `agent-dashboard/index.html`
> **Referencia visual:** Abrir `Dashboard GS (standalone).html` en navegador como target pixel-perfect

---

## CONTEXTO

El dashboard G*S es una SPA vanilla (HTML/JS/CSS en un solo archivo `index.html`), servida por Node.js HTTP nativo en puerto 3737, con Supabase como BD. La vista interna del artista se renderiza cuando el usuario hace click en un artista desde el sidebar o la lista. Actualmente usa colores y estructura genéricos. Hay que transformarla al sistema de diseño **Editorial Noir**: cinematográfico, oscuro puro (#000), tipografía editorial (Libre Franklin + Arimo), acentos neón.

**Regla fundamental:** NO inventar valores. Copiar EXACTAMENTE los hex, font-sizes, paddings, y letter-spacings de este documento. Si un valor no está especificado, usar `0` o `inherit`.

---

## PASO 1: ACTUALIZAR `:root` CSS VARIABLES (líneas 12-28 de index.html)

Reemplazar las variables actuales con los tokens Editorial Noir. **No borrar las variables viejas que usan otras vistas** — agregar las nuevas CON PREFIJO `--gs-` para no romper lo existente.

```css
:root {
  /* === VARIABLES EXISTENTES (NO TOCAR — las usan otras vistas) === */
  --bg-base: #0a0a0f;
  --bg-card: #14141f;
  --bg-elevated: #1a1a28;
  --border: #1f1f2e;
  --border-strong: #2a2a3f;
  --text: #e4e4f0;
  --text-muted: #8b8fa3;
  --text-dim: #6b6f80;
  --neon-violet: #a855f7;
  --neon-blue: #3b82f6;
  --neon-orange: #fb923c;
  --neon-yellow: #facc15;
  --neon-green: #10b981;
  --neon-pink: #ec4899;

  /* === EDITORIAL NOIR — Vista Interna Artista === */
  --gs-bg: #000000;
  --gs-surf-1: #070707;
  --gs-surf-2: #0a0a0a;
  --gs-surf-3: #0c0c0c;
  --gs-surf-4: #0d0d0d;
  --gs-text: #fcfcfa;
  --gs-text-card: #d6d6d2;
  --gs-text-doc: #b8b8b8;
  --gs-text-2: #9a9a9a;
  --gs-text-3: #656565;
  --gs-text-4: #5a5a5a;
  --gs-lime: #c6ff00;
  --gs-cyan: #29e0ff;
  --gs-violet: #b388ff;
  --gs-amber: #ff8a3d;
  --gs-pink: #ff2d78;
  --gs-danger: #ff5470;
  --gs-bd-06: rgba(252,252,250,.06);
  --gs-bd-07: rgba(252,252,250,.07);
  --gs-bd-08: rgba(252,252,250,.08);
  --gs-bd-10: rgba(252,252,250,.10);
  --gs-bd-12: rgba(252,252,250,.12);
  --gs-bd-14: rgba(252,252,250,.14);
  --gs-bd-16: rgba(252,252,250,.16);
  --gs-bd-20: rgba(252,252,250,.20);
  --gs-font-display: 'Libre Franklin', sans-serif;
  --gs-font-body: 'Arimo', sans-serif;
}
```

**Agregar Google Fonts en el `<head>`** (antes del `<style>`):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:ital,wght@0,400;0,500;0,600;0,700;1,500&family=Arimo:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Agregar animaciones globales** (después del bloque `:root`):
```css
@keyframes gsGlow { 0%,100% { opacity:.55 } 50% { opacity:1 } }
@keyframes gsBar { from { transform:scaleX(0) } to { transform:scaleX(1) } }
```

---

## PASO 2: CSS DE LA VISTA INTERNA (agregar DESPUÉS de los estilos existentes de MGMT, antes de `/* ============ MODAL ============ */`)

Reemplazar TODO el bloque CSS desde `.mgmt-client-detail-header` (línea 1697) hasta `.add-deliverable-btn:hover` (línea 2248) con el siguiente CSS. Las clases nuevas usan prefijo `.gs-` para no colisionar.

```css
/* ============ EDITORIAL NOIR — VISTA INTERNA ARTISTA ============ */

/* Contenedor principal */
.gs-detail {
  background: var(--gs-bg);
  color: var(--gs-text);
  font-family: var(--gs-font-body);
}

/* --- 1. BREADCRUMB --- */
.gs-bc {
  display: flex; align-items: center; gap: 8px;
  padding: 22px 44px; margin: 0;
  font-family: var(--gs-font-display); font-size: 10px; font-weight: 400;
  letter-spacing: 2px; line-height: 1; color: var(--gs-text-3);
  border-bottom: 1px solid var(--gs-bd-06);
}
.gs-bc__back {
  background: transparent; border: none; padding: 0; cursor: pointer;
  font-family: var(--gs-font-display); font-size: 10px; letter-spacing: 2px;
  color: var(--gs-text-2);
}
.gs-bc__back:hover { color: var(--gs-lime); }
.gs-bc__sep { color: var(--gs-text-3); }
.gs-bc__current { color: var(--gs-text); }

/* --- 2. HERO --- */
.gs-hero {
  position: relative; display: flex; flex-wrap: wrap; gap: 36px;
  padding: 46px 44px 38px; margin: 0;
  border-bottom: 1px solid var(--gs-bd-06);
}
.gs-hero::before {
  content: ""; position: absolute; left: 0; right: 0; top: 0; height: 2px;
  background: linear-gradient(90deg, #c6ff00, transparent 60%);
}
.gs-hero__avatar {
  width: 150px; height: 196px; flex: none; display: block;
  border: 1px solid var(--gs-bd-12); border-radius: 4px; color: #7d7d7d;
  background: repeating-linear-gradient(135deg, #0c0c0c 0, #0c0c0c 7px, #070707 7px, #070707 14px);
  object-fit: cover;
}
.gs-hero__mid { flex: 1; min-width: 280px; }
.gs-hero__status {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  margin: 0 0 14px;
  font-family: var(--gs-font-display); font-size: 10px; letter-spacing: 2px; color: var(--gs-lime);
}
.gs-hero__status-inner { display: inline-flex; align-items: center; gap: 6px; }
.gs-hero__dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--gs-lime);
  box-shadow: 0 0 10px var(--gs-lime); animation: gsGlow 2s infinite;
}
.gs-hero__dot--paused { background: var(--gs-amber); box-shadow: 0 0 10px var(--gs-amber); }
.gs-hero__dot--closed { background: var(--gs-text-3); box-shadow: none; animation: none; }
.gs-hero__name {
  font-family: var(--gs-font-display); font-weight: 700;
  font-size: clamp(44px, 5.2vw, 72px); line-height: .92; letter-spacing: -1.5px; margin: 0;
}
.gs-hero__name-dot { font-style: italic; font-weight: 500; color: var(--gs-lime); }
.gs-hero__loc {
  margin: 14px 0 0; font-family: var(--gs-font-display);
  font-size: 10px; letter-spacing: 2px; color: var(--gs-text-3);
}
.gs-hero__badge-wrap { margin: 24px 0 0; }
.gs-hero__badge {
  display: inline-block; padding: 5px 12px;
  border: 1px solid var(--gs-bd-20); border-radius: 3px; color: var(--gs-text-2);
  font-family: var(--gs-font-display); font-size: 11px; letter-spacing: 2px;
}
.gs-hero__settings {
  flex: none; align-self: flex-start; margin-left: auto;
  width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
  background: rgba(252,252,250,.03); border: 1px solid var(--gs-bd-14); border-radius: 9px;
  color: var(--gs-text-2); font-size: 19px; line-height: 1; cursor: pointer;
  transition: transform .25s, color .15s, border-color .15s;
}
.gs-hero__settings:hover { color: var(--gs-lime); border-color: rgba(198,255,0,.4); transform: rotate(60deg); }
.gs-hero__price {
  flex: none; text-align: right; min-width: 160px;
  padding-left: 24px; border-left: 1px solid var(--gs-bd-08);
}
.gs-hero__price-label { font-family: var(--gs-font-display); font-size: 9.5px; letter-spacing: 3px; color: var(--gs-text-3); }
.gs-hero__price-value {
  font-family: var(--gs-font-display); font-size: clamp(40px, 4.4vw, 60px); font-weight: 600;
  line-height: 1; margin-top: 8px; color: var(--gs-text);
}
.gs-hero__price-value b { color: var(--gs-lime); font-weight: 600; }
.gs-hero__price-cycle { font-family: var(--gs-font-display); font-size: 10px; letter-spacing: 2px; color: var(--gs-text-3); margin-top: 8px; }

/* --- 3. SECCIÓN GENÉRICA (cabecera de sección) --- */
.gs-sec { padding: 34px 44px; border-bottom: 1px solid var(--gs-bd-06); }
.gs-sec__head { display: flex; align-items: baseline; gap: 14px; margin-bottom: 22px; }
.gs-sec__title { font-family: var(--gs-font-display); font-size: 11px; font-weight: 400; letter-spacing: 3px; color: var(--gs-text); margin: 0; }
.gs-sec__rule { flex: 1; height: 1px; background: var(--gs-bd-08); }
.gs-sec__count { font-family: var(--gs-font-display); font-size: 10px; color: var(--gs-text-3); }

/* --- 3b. CARRUSEL DE RECURSOS --- */
.gs-carousel {
  display: flex; gap: 14px; overflow-x: auto;
  scroll-snap-type: x proximity; scrollbar-width: none;
}
.gs-carousel::-webkit-scrollbar { display: none; }

.gs-res {
  flex: none; width: 290px; scroll-snap-align: start;
  display: flex; flex-direction: column;
  background: #000; border: 1px solid var(--gs-bd-10); border-radius: 6px; overflow: hidden;
  text-decoration: none; transition: border-color .2s, transform .2s;
}
.gs-res:hover { transform: translateY(-3px); }
.gs-res__bar {
  display: flex; align-items: center; gap: 7px; padding: 9px 11px;
  border-bottom: 1px solid var(--gs-bd-07); background: var(--gs-surf-1);
}
.gs-res__tl { width: 7px; height: 7px; border-radius: 50%; background: #2a2a2a; flex: none; }
.gs-res__tl--live { background: var(--neon); box-shadow: 0 0 6px var(--neon); }
.gs-res__url {
  flex: 1; min-width: 0; text-align: right; font-family: var(--gs-font-display);
  font-size: 9px; letter-spacing: .3px; color: var(--gs-text-3);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.gs-res__preview {
  width: 100%; height: 152px; display: block; color: #7d7d7d;
  background: repeating-linear-gradient(135deg, #0d0d0d 0, #0d0d0d 8px, #080808 8px, #080808 16px);
  object-fit: cover;
}
.gs-res__foot { padding: 14px 14px 15px; border-top: 1px solid var(--gs-bd-07); }
.gs-res__tag { font-family: var(--gs-font-display); font-size: 9px; font-weight: 600; letter-spacing: 2px; margin-bottom: 7px; }
.gs-res__row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.gs-res__title { font-family: var(--gs-font-display); font-size: 17px; font-weight: 600; color: var(--gs-text); line-height: 1.05; }
.gs-res__arrow { font-family: var(--gs-font-display); font-size: 13px; color: #3a3a3a; flex: none; }

.gs-res-add {
  flex: none; width: 290px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px;
  background: transparent; border: 1px dashed var(--gs-bd-16); border-radius: 6px;
  cursor: pointer; color: var(--gs-text-3); transition: border-color .2s, color .2s;
  min-height: 260px;
}
.gs-res-add:hover { border-color: var(--gs-lime); color: var(--gs-lime); }
.gs-res-add__plus { font-size: 34px; font-weight: 200; line-height: 1; }
.gs-res-add__label { font-family: var(--gs-font-display); font-size: 10px; letter-spacing: 2px; }

.gs-res-form {
  flex: none; width: 290px; display: flex; flex-direction: column;
  background: #000; border: 1px solid rgba(198,255,0,.3); border-radius: 6px; overflow: hidden;
}
.gs-res-form__head {
  display: flex; align-items: center; justify-content: space-between; padding: 11px 13px;
  border-bottom: 1px solid var(--gs-bd-07); background: var(--gs-surf-1);
}
.gs-res-form__title { font-family: var(--gs-font-display); font-size: 9px; letter-spacing: 2px; color: var(--gs-lime); }
.gs-res-form__x { background: transparent; border: none; color: var(--gs-text-3); cursor: pointer; font-size: 15px; line-height: 1; }
.gs-res-form__body { display: flex; flex-direction: column; gap: 10px; padding: 16px 14px; flex: 1; }
.gs-input {
  background: var(--gs-surf-3); border: 1px solid var(--gs-bd-12); border-radius: 4px;
  padding: 10px 12px; color: var(--gs-text); font-family: var(--gs-font-body); font-size: 12.5px; outline: none;
}
.gs-res-form__submit {
  margin-top: auto; padding: 11px; background: var(--gs-lime); border: none; border-radius: 4px;
  color: #000; font-family: var(--gs-font-display); font-size: 11px; font-weight: 600;
  letter-spacing: 2px; cursor: pointer;
}

/* --- 4. GRID 2 COLUMNAS (Objetivos | Bitácora + Misiones) --- */
.gs-grid { display: grid; grid-template-columns: 1.55fr 1fr; gap: 0; }
@media (max-width: 1100px) { .gs-grid { grid-template-columns: 1fr; } }
.gs-col-obj { padding: 34px 36px 40px 44px; border-right: 1px solid var(--gs-bd-06); }
.gs-col-obj .gs-sec__head { margin-bottom: 6px; }
.gs-col-side { padding: 34px 44px 40px 36px; }
.gs-col-side .gs-sec__head { margin-bottom: 18px; gap: 12px; }

/* --- 4a. OBJETIVOS --- */
.gs-obj { padding: 26px 0; border-bottom: 1px solid var(--gs-bd-07); }
.gs-obj__row { display: flex; align-items: flex-start; gap: 18px; }
.gs-obj__n { font-family: var(--gs-font-display); font-size: 42px; font-weight: 600; line-height: .8; color: rgba(252,252,250,.22); width: 56px; flex: none; }
.gs-obj__body { flex: 1; min-width: 0; }
.gs-obj__top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.gs-obj__title { font-family: var(--gs-font-display); font-size: 24px; font-weight: 600; line-height: 1.1; }
.gs-obj__sub { color: var(--gs-text-3); font-size: 13px; margin-top: 3px; }
.gs-obj__actions { display: flex; align-items: center; gap: 7px; flex: none; }
.gs-status {
  font-family: var(--gs-font-display); font-size: 9px; letter-spacing: 1.5px;
  padding: 4px 8px; border-radius: 3px; white-space: nowrap;
}
.gs-status--pending { color: var(--gs-amber); border: 1px solid rgba(255,138,61,.35); }
.gs-status--done { color: var(--gs-lime); border: 1px solid rgba(198,255,0,.35); }
.gs-status--postponed { color: var(--gs-text-3); border: 1px solid var(--gs-bd-10); }
.gs-iconbtn {
  width: 26px; height: 26px; flex: none; display: flex; align-items: center; justify-content: center;
  background: transparent; border: 1px solid var(--gs-bd-10); border-radius: 4px;
  color: var(--gs-text-3); font-size: 13px; cursor: pointer; transition: all .15s;
}
.gs-iconbtn:hover { color: var(--gs-text); border-color: rgba(252,252,250,.32); }
.gs-iconbtn--del { font-size: 12px; }
.gs-iconbtn--del:hover { color: var(--gs-danger); border-color: rgba(255,84,112,.5); }

/* Barra de progreso */
.gs-prog { display: flex; align-items: center; gap: 12px; margin: 16px 0 6px; }
.gs-prog__track { flex: 1; height: 3px; background: var(--gs-bd-08); border-radius: 2px; overflow: hidden; }
.gs-prog__fill { height: 100%; background: var(--gs-lime); box-shadow: 0 0 8px rgba(198,255,0,.7); transform-origin: left; animation: gsBar .8s ease-out; }
.gs-prog__count { font-family: var(--gs-font-display); font-size: 10px; color: var(--gs-text-2); }

/* Entregables */
.gs-delivs { margin-top: 14px; display: flex; flex-direction: column; gap: 6px; }
.gs-deliv {
  display: flex; align-items: center; gap: 12px; padding: 11px 12px;
  background: var(--gs-surf-1); border: 1px solid var(--gs-bd-06); border-radius: 4px;
}
.gs-deliv:hover { border-color: var(--gs-bd-16); }
.gs-deliv__dot { width: 7px; height: 7px; border-radius: 50%; flex: none; border: 1.5px solid var(--gs-text-3); background: transparent; }
.gs-deliv__dot--done { background: var(--gs-lime); border-color: var(--gs-lime); box-shadow: 0 0 8px var(--gs-lime); }
.gs-deliv__name { flex: 1; min-width: 0; font-size: 13.5px; color: var(--gs-text-card); }
.gs-deliv__team { font-family: var(--gs-font-display); font-size: 8.5px; letter-spacing: 1px; color: var(--gs-violet); border: 1px solid rgba(179,136,255,.3); padding: 3px 6px; border-radius: 3px; }
.gs-deliv__action { font-family: var(--gs-font-display); font-size: 8.5px; letter-spacing: 1px; cursor: pointer; }
.gs-deliv__action:hover { opacity: .7; }
.gs-deliv__action--done { color: var(--gs-lime); }
.gs-deliv__action--pending { color: var(--gs-text-3); }
.gs-deliv__divider { width: 1px; height: 14px; background: var(--gs-bd-10); flex: none; }
.gs-deliv__icon {
  width: 21px; height: 21px; flex: none; display: flex; align-items: center; justify-content: center;
  background: transparent; border: none; color: var(--gs-text-4); font-size: 12px; cursor: pointer; transition: color .15s;
}
.gs-deliv__icon:hover { color: var(--gs-text); }
.gs-deliv__icon--del { font-size: 11px; }
.gs-deliv__icon--del:hover { color: var(--gs-danger); }

/* Botón nuevo objetivo */
.gs-dashed {
  margin-top: 22px; width: 100%; padding: 14px;
  border: 1px dashed var(--gs-bd-16); background: transparent; color: var(--gs-text-2);
  border-radius: 4px; font-family: var(--gs-font-display); font-size: 11px;
  letter-spacing: 2px; cursor: pointer;
}
.gs-dashed:hover { border-color: var(--gs-lime); color: var(--gs-lime); }

/* --- 5. BITÁCORA (timeline) --- */
.gs-timeline { position: relative; padding-left: 18px; display: flex; flex-direction: column; gap: 0; }
.gs-timeline__line { position: absolute; left: 3px; top: 6px; bottom: 10px; width: 1px; background: var(--gs-bd-12); }
.gs-log { position: relative; padding: 0 0 22px; }
.gs-log__node {
  position: absolute; left: -18px; top: 5px; width: 7px; height: 7px; border-radius: 50%;
  background: #000; border: 1.5px solid var(--gs-lime); box-shadow: 0 0 8px var(--gs-lime);
}
.gs-log__top { display: flex; justify-content: space-between; gap: 8px; }
.gs-log__kind { font-family: var(--gs-font-display); font-size: 8.5px; letter-spacing: 2px; }
.gs-log__meta { display: flex; align-items: center; gap: 6px; }
.gs-log__date { font-family: var(--gs-font-display); font-size: 9px; color: var(--gs-text-3); }
.gs-log__icon {
  width: 19px; height: 19px; flex: none; display: flex; align-items: center; justify-content: center;
  background: transparent; border: none; color: var(--gs-text-4); font-size: 11px; cursor: pointer; transition: color .15s;
}
.gs-log__icon:hover { color: var(--gs-text); }
.gs-log__icon--del { font-size: 10px; }
.gs-log__icon--del:hover { color: var(--gs-danger); }
.gs-log__title { font-family: var(--gs-font-display); font-size: 17px; font-weight: 500; margin-top: 4px; }
.gs-log__note { font-size: 12px; color: var(--gs-text-3); margin-top: 3px; line-height: 1.4; }

.gs-dashed--sm {
  margin-top: 6px; width: 100%; padding: 11px;
  border: 1px dashed var(--gs-bd-16); background: transparent; color: var(--gs-text-2);
  border-radius: 4px; font-family: var(--gs-font-display); font-size: 10px;
  letter-spacing: 2px; cursor: pointer; transition: all .15s;
}
.gs-dashed--sm:hover { border-color: var(--gs-lime); color: var(--gs-lime); }

/* --- 6. MISIONES --- */
.gs-mis-head { display: flex; align-items: baseline; gap: 12px; margin: 14px 0 16px; }
.gs-mis-list { display: flex; flex-direction: column; gap: 8px; }
.gs-mis {
  display: flex; align-items: center; gap: 12px; padding: 11px 12px;
  background: var(--gs-surf-1); border: 1px solid var(--gs-bd-06); border-radius: 4px;
}
.gs-mis:hover { border-color: var(--gs-bd-14); }
.gs-mis__box {
  width: 16px; height: 16px; flex: none; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; color: #000; cursor: pointer;
}
.gs-mis__text { flex: 1; min-width: 0; font-size: 12.5px; color: var(--gs-text-card); line-height: 1.35; }
.gs-mis__text--done { text-decoration: line-through; opacity: .42; }
.gs-mis__who { font-family: var(--gs-font-display); font-size: 8.5px; letter-spacing: 1px; }
.gs-mis__icon {
  width: 21px; height: 21px; flex: none; display: flex; align-items: center; justify-content: center;
  background: transparent; border: none; color: var(--gs-text-4); font-size: 12px; cursor: pointer; transition: color .15s;
}
.gs-mis__icon:hover { color: var(--gs-text); }
.gs-mis__icon--del { font-size: 11px; }
.gs-mis__icon--del:hover { color: var(--gs-danger); }

.gs-mis-form {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  background: var(--gs-surf-1); border: 1px solid rgba(198,255,0,.3); border-radius: 4px;
}
.gs-mis-form__input {
  flex: 1; min-width: 0; background: transparent; border: none; outline: none;
  color: var(--gs-text); font-family: var(--gs-font-display); font-size: 12.5px;
}
.gs-mis-form__sel {
  flex: none; background: var(--gs-surf-4); border: 1px solid var(--gs-bd-14); border-radius: 4px;
  color: var(--gs-text-card); font-family: var(--gs-font-display); font-size: 9.5px;
  letter-spacing: .5px; padding: 5px 6px; cursor: pointer; outline: none;
}
.gs-mis-form__ok {
  flex: none; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
  background: var(--gs-lime); border: none; border-radius: 4px; color: #000; font-size: 14px; font-weight: 800; cursor: pointer;
}
.gs-mis-form__x {
  flex: none; width: 21px; height: 21px; display: flex; align-items: center; justify-content: center;
  background: transparent; border: none; color: var(--gs-text-4); font-size: 11px; cursor: pointer;
}
.gs-mis-form__x:hover { color: var(--gs-danger); }
.gs-dashed--xs {
  margin-top: 2px; width: 100%; padding: 10px;
  border: 1px dashed var(--gs-bd-16); background: transparent; color: var(--gs-text-2);
  border-radius: 4px; font-family: var(--gs-font-display); font-size: 10px; font-weight: 700;
  letter-spacing: 1.5px; cursor: pointer; transition: all .15s;
}
.gs-dashed--xs:hover { border-color: var(--gs-lime); color: var(--gs-lime); }
```

---

## PASO 3: REESCRIBIR LA SECCIÓN HTML (líneas 2951-2962)

Reemplazar el contenido de `<section id="view-mgmt-client-detail">`:

```html
<section class="view view-mgmt-client-detail hidden" id="view-mgmt-client-detail">
  <div id="mgmt-client-detail-container" class="gs-detail">
    <div class="loading">Cargando detalle...</div>
  </div>
</section>
```

El botón "Volver" se mueve DENTRO del render (como breadcrumb `.gs-bc`).

---

## PASO 4: REESCRIBIR `renderMgmtClientDetail(detail)` (línea 3771)

Esta es la función principal. Reemplazar COMPLETAMENTE con:

```javascript
function renderMgmtClientDetail(detail) {
  const container = document.getElementById('mgmt-client-detail-container');
  const client = detail.client || {};
  const engagement = detail.engagement;
  const objectives = detail.objectives || [];
  const meta = client.metadata || {};
  const slug = client.slug || currentMgmtClientSlug;

  // Determinar status visual
  const status = (client.status || 'active').toLowerCase();
  const statusColor = status === 'active' ? 'var(--gs-lime)' :
                      status === 'paused' ? 'var(--gs-amber)' : 'var(--gs-text-3)';
  const dotClass = status === 'paused' ? 'gs-hero__dot--paused' :
                   status === 'closed' ? 'gs-hero__dot--closed' : '';
  const dotAnim = status === 'active';

  // Formatear precio
  let priceHtml = '';
  if (engagement) {
    const currency = engagement.invoice_currency || 'USD';
    const amount = Number(engagement.invoice_amount) || 0;
    const formatted = currency === 'COP'
      ? '$' + (amount / 1000000).toFixed(1) + 'M'
      : '$<b>' + amount.toLocaleString('en-US') + '</b>';
    const cycle = engagement.month || '';
    priceHtml = '<div class="gs-hero__price">' +
      '<div class="gs-hero__price-label">RETAINER · ' + currency + '/MES</div>' +
      '<div class="gs-hero__price-value">' + formatted + '</div>' +
      '<div class="gs-hero__price-cycle">CICLO ' + escapeHtml(cycle.replace('-', ' · ')) + '</div>' +
    '</div>';
  }

  // Service lines como badges
  const serviceLines = (detail.service_lines || []).filter(function(s) { return s.status === 'active'; });
  const badgesHtml = serviceLines.length
    ? serviceLines.map(function(s) {
        return '<span class="gs-hero__badge">' + escapeHtml((s.type || '').toUpperCase()) + '</span>';
      }).join(' ')
    : '<span class="gs-hero__badge">MGMT</span>';

  // Location
  const location = [meta.city, client.country || 'CO'].filter(Boolean).join(', ').toUpperCase();

  // --- BREADCRUMB ---
  var bcHtml = '<nav class="gs-bc">' +
    '<button class="gs-bc__back" id="gs-back-btn">&larr; ARTISTAS</button>' +
    '<span class="gs-bc__sep">/</span>' +
    '<span class="gs-bc__current">' + escapeHtml((client.display_name || '').toUpperCase()) + '</span>' +
  '</nav>';

  // --- HERO ---
  var heroHtml = '<section class="gs-hero">' +
    '<div class="gs-hero__avatar" style="display:flex;align-items:center;justify-content:center;font-family:var(--gs-font-display);font-size:9px;letter-spacing:2px;">// KEY VISUAL</div>' +
    '<div class="gs-hero__mid">' +
      '<div class="gs-hero__status">' +
        '<span class="gs-hero__status-inner" style="color:' + statusColor + '">' +
          '<span class="gs-hero__dot ' + dotClass + '" style="background:' + statusColor + ';box-shadow:0 0 10px ' + statusColor + (dotAnim ? '' : ';animation:none') + '"></span>' +
          escapeHtml(status.toUpperCase()) +
        '</span>' +
      '</div>' +
      '<h1 class="gs-hero__name">' + escapeHtml(client.display_name || '') + '<span class="gs-hero__name-dot">.</span></h1>' +
      '<div class="gs-hero__loc">' + escapeHtml(location) + '</div>' +
      '<div class="gs-hero__badge-wrap">' + badgesHtml + '</div>' +
    '</div>' +
    '<button class="gs-hero__settings" title="Editar artista">&#9881;</button>' +
    priceHtml +
  '</section>';

  // --- RECURSOS (placeholder, se carga async) ---
  var resourcesHtml = '<section class="gs-sec" id="gs-resources-section"></section>';

  // --- OBJETIVOS ---
  var objectivesHtml = objectives.length === 0
    ? '<div style="padding:40px 0;text-align:center;color:var(--gs-text-3);font-size:13px;">Sin objetivos este mes</div>'
    : objectives.map(function(obj) {
        var deliverables = obj.mgmt_deliverables || [];
        var doneCount = deliverables.filter(function(d) { return d.status === 'done'; }).length;
        var total = deliverables.length;
        var pct = total > 0 ? Math.round(doneCount / total * 100) : 0;
        var objDone = doneCount === total && total > 0;
        var objStatus = obj.status === 'postponed' ? 'postponed' : (objDone ? 'done' : 'pending');
        var statusClass = 'gs-status--' + objStatus;
        var statusLabel = objStatus === 'done' ? 'DONE' : objStatus === 'postponed' ? 'POSTPONED' : 'PENDING';
        var numStr = String(obj.number || 1).padStart(2, '0');

        var delivsHtml = deliverables.map(function(d) {
          var isDone = d.status === 'done';
          var dotClass = isDone ? 'gs-deliv__dot gs-deliv__dot--done' : 'gs-deliv__dot';
          var actionLabel = d.file_path ? 'VER PDF' : d.attachment_type === 'link' && d.file_path ? 'VER LINK' : 'ADJUNTAR';
          var actionClass = isDone ? 'gs-deliv__action gs-deliv__action--done' : 'gs-deliv__action gs-deliv__action--pending';
          var ownerLabel = (d.owner || 'team').toUpperCase();

          return '<div class="gs-deliv" data-deliverable-id="' + escapeHtml(d.id) + '">' +
            '<span class="' + dotClass + '"></span>' +
            '<span class="gs-deliv__name">' + escapeHtml(d.title) + '</span>' +
            '<span class="gs-deliv__team">' + escapeHtml(ownerLabel) + '</span>' +
            '<span class="' + actionClass + '" data-view-deliverable="' + escapeHtml(d.id) + '">' + actionLabel + (isDone ? ' &rarr;' : '') + '</span>' +
            '<span class="gs-deliv__divider"></span>' +
            '<button class="gs-deliv__icon" data-edit-deliverable="' + escapeHtml(d.id) + '">&check;</button>' +
            '<button class="gs-deliv__icon gs-deliv__icon--del" data-delete-deliverable="' + escapeHtml(d.id) + '">&times;</button>' +
          '</div>';
        }).join('');

        return '<div class="gs-obj" data-objective-id="' + escapeHtml(obj.id) + '">' +
          '<div class="gs-obj__row">' +
            '<div class="gs-obj__n">' + numStr + '</div>' +
            '<div class="gs-obj__body">' +
              '<div class="gs-obj__top">' +
                '<div>' +
                  '<div class="gs-obj__title">' + escapeHtml(obj.title) + '</div>' +
                  (obj.subtitle ? '<div class="gs-obj__sub">' + escapeHtml(obj.subtitle) + '</div>' : '') +
                '</div>' +
                '<div class="gs-obj__actions">' +
                  '<span class="gs-status ' + statusClass + '">' + statusLabel + '</span>' +
                  '<button class="gs-iconbtn" data-edit-objective="' + escapeHtml(obj.id) + '">&#9998;</button>' +
                  '<button class="gs-iconbtn gs-iconbtn--del" data-delete-objective="' + escapeHtml(obj.id) + '">&times;</button>' +
                '</div>' +
              '</div>' +
              '<div class="gs-prog">' +
                '<div class="gs-prog__track"><div class="gs-prog__fill" style="width:' + pct + '%"></div></div>' +
                '<span class="gs-prog__count">' + doneCount + '/' + total + '</span>' +
              '</div>' +
              '<div class="gs-delivs">' + delivsHtml + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');

  var addObjBtn = engagement
    ? '<button class="gs-dashed" data-add-objective="' + escapeHtml(engagement.id) + '">+ NUEVO OBJETIVO</button>'
    : '';

  // --- GRID: columna izq (objetivos) + columna der (bitácora + misiones) ---
  var gridHtml = '<div class="gs-grid">' +
    '<div class="gs-col-obj">' +
      '<div class="gs-sec__head"><h2 class="gs-sec__title">OBJETIVOS Y ENTREGABLES</h2><span class="gs-sec__rule"></span></div>' +
      objectivesHtml +
      addObjBtn +
    '</div>' +
    '<div class="gs-col-side">' +
      '<div class="gs-sec__head"><h2 class="gs-sec__title">BIT&Aacute;CORA</h2><span class="gs-sec__rule"></span><span class="gs-sec__count" id="gs-meetings-count"></span></div>' +
      '<div id="gs-meetings-timeline" class="gs-timeline"><span class="gs-timeline__line"></span></div>' +
      '<button class="gs-dashed--sm" id="gs-add-meeting">+ A&Ntilde;ADIR REUNI&Oacute;N</button>' +
      '<div class="gs-mis-head"><h2 class="gs-sec__title">MISIONES</h2><span class="gs-sec__rule"></span><span class="gs-sec__count" id="gs-missions-count" style="color:var(--gs-lime)"></span></div>' +
      '<div id="gs-missions-list" class="gs-mis-list"></div>' +
      '<button class="gs-dashed--xs" id="gs-add-mission">+ A&Ntilde;ADIR MISI&Oacute;N</button>' +
    '</div>' +
  '</div>';

  container.innerHTML = bcHtml + heroHtml + resourcesHtml + gridHtml;

  // --- EVENT LISTENERS ---

  // Back button
  var backBtn = document.getElementById('gs-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      if (typeof _artistDashboardOrigin !== 'undefined' && _artistDashboardOrigin) {
        loadView(_artistDashboardOrigin);
      } else {
        loadView('artists');
      }
    });
  }

  // Settings button (editar artista)
  var settingsBtn = container.querySelector('.gs-hero__settings');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', function() {
      // Reusar modal de editar artista existente si existe
      if (typeof openEditArtistModal === 'function') {
        openEditArtistModal(slug);
      }
    });
  }

  // Reusar handlers de deliverables existentes
  attachDeliverableHandlers();

  // Reusar handlers de objetivos existentes (add, edit, delete, postpone)
  container.querySelectorAll('[data-add-objective]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (typeof openNewObjectiveModal === 'function') {
        openNewObjectiveModal(btn.dataset.addObjective);
      }
    });
  });
  container.querySelectorAll('[data-edit-objective]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (typeof openEditObjectiveModal === 'function') {
        openEditObjectiveModal(btn.dataset.editObjective);
      }
    });
  });
  container.querySelectorAll('[data-delete-objective]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (typeof deleteObjective === 'function') {
        deleteObjective(btn.dataset.deleteObjective);
      }
    });
  });

  // Cargar secciones async
  loadGsResources(slug);
  loadGsMeetings(client.id, objectives);
  loadGsMissions(client.id);
}
```

---

## PASO 5: REESCRIBIR `loadArtistLinksSection` → `loadGsResources` (línea 3974)

Reemplazar `loadArtistLinksSection(slug)` con una nueva función que renderiza el carrusel Editorial Noir:

```javascript
var GS_NEON_CYCLE = ['#c6ff00', '#29e0ff', '#ff8a3d', '#b388ff', '#ff2d78'];

async function loadGsResources(slug) {
  var section = document.getElementById('gs-resources-section');
  if (!section) return;

  try {
    var res = await fetch('/api/artist/' + encodeURIComponent(slug) + '/links');
    var data = await res.json();
    var links = data.links || data || [];

    var countStr = String(links.length).padStart(2, '0') + ' LINKS';

    var cardsHtml = links.map(function(link, i) {
      var neon = link.accent || GS_NEON_CYCLE[i % GS_NEON_CYCLE.length];
      var displayUrl = (link.url || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
      var tag = (link.category || 'GENERAL').toUpperCase();

      return '<a class="gs-res" href="' + escapeHtml(link.url || '#') + '" target="_blank" style="--neon:' + neon + '">' +
        '<div class="gs-res__bar">' +
          '<span class="gs-res__tl"></span><span class="gs-res__tl"></span>' +
          '<span class="gs-res__tl gs-res__tl--live" style="background:' + neon + ';box-shadow:0 0 6px ' + neon + '"></span>' +
          '<span class="gs-res__url">' + escapeHtml(displayUrl) + '</span>' +
        '</div>' +
        '<div class="gs-res__preview" style="display:flex;align-items:center;justify-content:center;font-family:var(--gs-font-display);font-size:9px;letter-spacing:2px;color:#7d7d7d;">Captura &middot; ' + escapeHtml(link.label || '') + '</div>' +
        '<div class="gs-res__foot">' +
          '<div class="gs-res__tag" style="color:' + neon + '">' + escapeHtml(tag) + '</div>' +
          '<div class="gs-res__row">' +
            '<span class="gs-res__title">' + escapeHtml(link.label || '') + '</span>' +
            '<span class="gs-res__arrow">&nearr;</span>' +
          '</div>' +
        '</div>' +
      '</a>';
    }).join('');

    // Card + AÑADIR RECURSO
    var addCardHtml = '<button class="gs-res-add" id="gs-res-add-btn">' +
      '<span class="gs-res-add__plus">+</span>' +
      '<span class="gs-res-add__label">A&Ntilde;ADIR RECURSO</span>' +
    '</button>';

    // Form inline (oculto por defecto)
    var formHtml = '<div class="gs-res-form" id="gs-res-form" style="display:none">' +
      '<div class="gs-res-form__head">' +
        '<span class="gs-res-form__title">NUEVO RECURSO</span>' +
        '<button class="gs-res-form__x" id="gs-res-form-close">&times;</button>' +
      '</div>' +
      '<div class="gs-res-form__body">' +
        '<input class="gs-input" id="gs-res-title" placeholder="Nombre (ej: Brandbook Era X)">' +
        '<input class="gs-input" id="gs-res-url" placeholder="URL">' +
        '<input class="gs-input" id="gs-res-tag" placeholder="Categor&iacute;a (ej: Brandbook)">' +
        '<button class="gs-res-form__submit" id="gs-res-submit">+ AGREGAR</button>' +
      '</div>' +
    '</div>';

    section.innerHTML =
      '<div class="gs-sec__head">' +
        '<h2 class="gs-sec__title">RECURSOS DEL ARTISTA</h2>' +
        '<span class="gs-sec__rule"></span>' +
        '<span class="gs-sec__count">' + countStr + '</span>' +
      '</div>' +
      '<div class="gs-carousel">' + cardsHtml + addCardHtml + formHtml + '</div>';

    // Toggle form
    var addBtn = document.getElementById('gs-res-add-btn');
    var form = document.getElementById('gs-res-form');
    var closeBtn = document.getElementById('gs-res-form-close');

    if (addBtn) addBtn.addEventListener('click', function() {
      addBtn.style.display = 'none';
      form.style.display = 'flex';
    });
    if (closeBtn) closeBtn.addEventListener('click', function() {
      form.style.display = 'none';
      addBtn.style.display = 'flex';
    });

    // Submit
    var submitBtn = document.getElementById('gs-res-submit');
    if (submitBtn) submitBtn.addEventListener('click', async function() {
      var title = document.getElementById('gs-res-title').value.trim();
      var url = document.getElementById('gs-res-url').value.trim();
      var category = document.getElementById('gs-res-tag').value.trim() || 'general';

      if (!title) { showToast('El nombre es obligatorio'); return; }
      if (!url) { showToast('La URL es obligatoria'); return; }

      try {
        await fetch('/api/artist/' + encodeURIComponent(slug) + '/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: title, url: url, attachment_type: 'link', category: category })
        });
        showToast(title + ' agregado');
        loadGsResources(slug);
      } catch (err) {
        showToast('Error: ' + err.message);
      }
    });

  } catch (err) {
    section.innerHTML = '<div style="padding:20px;color:var(--gs-text-3);">Error cargando recursos: ' + escapeHtml(err.message) + '</div>';
  }
}
```

---

## PASO 6: REESCRIBIR `loadClientMeetingsPanel` → `loadGsMeetings` (línea 4507)

Nueva función para renderizar la bitácora como timeline Editorial Noir:

```javascript
async function loadGsMeetings(clientId, objectives) {
  var timeline = document.getElementById('gs-meetings-timeline');
  var countEl = document.getElementById('gs-meetings-count');
  if (!timeline) return;

  try {
    var res = await fetch('/api/client/' + clientId + '/meetings');
    var data = await res.json();
    var meetings = data.meetings || [];

    if (countEl) countEl.textContent = String(meetings.length).padStart(2, '0');

    var logsHtml = meetings.map(function(m) {
      var kind = (m.type || 'REUNION').toUpperCase();
      var neon = kind === 'EMPALME' ? 'var(--gs-text-3)' : 'var(--gs-lime)';
      var heldDate = m.held_at ? new Date(m.held_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }).toUpperCase().replace('.', '') : '';
      var title = m.objetivo || m.type || 'Reunion';
      var note = m.summary ? m.summary.slice(0, 120) : '';

      return '<div class="gs-log" style="--neon:' + neon + '">' +
        '<span class="gs-log__node" style="border-color:' + neon + ';box-shadow:0 0 8px ' + neon + '"></span>' +
        '<div class="gs-log__top">' +
          '<span class="gs-log__kind" style="color:' + neon + '">' + escapeHtml(kind) + '</span>' +
          '<div class="gs-log__meta">' +
            '<span class="gs-log__date">' + escapeHtml(heldDate) + '</span>' +
            '<button class="gs-log__icon" data-open-meeting="' + m.id + '">&#9998;</button>' +
            '<button class="gs-log__icon gs-log__icon--del" data-delete-meeting="' + m.id + '">&times;</button>' +
          '</div>' +
        '</div>' +
        '<div class="gs-log__title">' + escapeHtml(title) + '</div>' +
        (note ? '<div class="gs-log__note">' + escapeHtml(note) + '</div>' : '') +
      '</div>';
    }).join('');

    // Mantener la línea vertical
    timeline.innerHTML = '<span class="gs-timeline__line"></span>' + (logsHtml || '<div style="padding:8px 0;color:var(--gs-text-3);font-size:12px;">Sin reuniones registradas.</div>');

    // Event listeners
    timeline.querySelectorAll('[data-open-meeting]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (typeof openMeetingDetailModal === 'function') {
          openMeetingDetailModal(btn.dataset.openMeeting);
        }
      });
    });

    // Add meeting button
    var addMeetingBtn = document.getElementById('gs-add-meeting');
    if (addMeetingBtn) {
      addMeetingBtn.addEventListener('click', function() {
        if (typeof openNewMeetingWithObjectiveSelector === 'function') {
          openNewMeetingWithObjectiveSelector(clientId, objectives || []);
        }
      });
    }

  } catch (err) {
    timeline.innerHTML = '<span class="gs-timeline__line"></span><div style="padding:8px 0;color:var(--gs-text-3);font-size:12px;">Error: ' + escapeHtml(err.message) + '</div>';
  }
}
```

---

## PASO 7: REESCRIBIR `loadClientMissionsPanel` → `loadGsMissions` (línea 4582)

Nueva función para misiones con colores por responsable:

```javascript
var GS_WHO_COLORS = {
  'ian': '#ff2d78',
  'cristian': '#ff8a3d',
  'santiago': '#29e0ff',
  'artista': '#c6ff00',
  'equipo_artista': '#b388ff',
  'equipo del artista': '#b388ff',
  'g*s': '#fcfcfa'
};

function gsWhoColor(who) {
  if (!who) return '#656565';
  return GS_WHO_COLORS[who.toLowerCase()] || '#656565';
}

async function loadGsMissions(clientId) {
  var list = document.getElementById('gs-missions-list');
  var countEl = document.getElementById('gs-missions-count');
  if (!list) return;

  try {
    var res = await fetch('/api/client/' + clientId + '/missions');
    var data = await res.json();
    var tasks = data.tasks || [];
    var doneCount = tasks.filter(function(t) { return t.status === 'hecha'; }).length;

    if (countEl) countEl.textContent = doneCount + '/' + tasks.length;

    var missionsHtml = tasks.length
      ? tasks.map(function(t) {
          var isDone = t.status === 'hecha';
          var who = t.assigned_to || '';
          var whoColor = gsWhoColor(who);
          var whoLabel = who ? who.charAt(0).toUpperCase() + who.slice(1) : '';
          var boxBg = isDone ? whoColor : 'transparent';

          return '<div class="gs-mis">' +
            '<span class="gs-mis__box" style="border:1.5px solid ' + whoColor + ';background:' + boxBg + '" data-done-task="' + t.id + '" data-current="' + t.status + '">' +
              (isDone ? '&#10003;' : '') +
            '</span>' +
            '<span class="gs-mis__text' + (isDone ? ' gs-mis__text--done' : '') + '">' + escapeHtml(t.descripcion) + '</span>' +
            (whoLabel ? '<span class="gs-mis__who" style="color:' + whoColor + '">' + escapeHtml(whoLabel.toUpperCase()) + '</span>' : '') +
            '<button class="gs-mis__icon" data-edit-mission="' + t.id + '">&#9998;</button>' +
            '<button class="gs-mis__icon gs-mis__icon--del" data-delete-mission="' + t.id + '">&times;</button>' +
          '</div>';
        }).join('')
      : '<div style="padding:8px 0;color:var(--gs-text-3);font-size:12px;">Sin misiones secundarias.</div>';

    list.innerHTML = missionsHtml;

    // Toggle done
    list.querySelectorAll('[data-done-task]').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var newStatus = btn.dataset.current === 'hecha' ? 'pendiente' : 'hecha';
        try {
          await fetch('/api/secondary-task/' + btn.dataset.doneTask + '/status', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
          loadGsMissions(clientId);
        } catch (err) { showToast('Error: ' + err.message); }
      });
    });

    // Edit missions
    list.querySelectorAll('[data-edit-mission]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var taskId = btn.dataset.editMission;
        var mis = btn.closest('.gs-mis');
        var textSpan = mis.querySelector('.gs-mis__text');
        var currentText = textSpan.textContent;
        textSpan.outerHTML = '<input class="gs-input" id="gs-mis-edit-' + taskId + '" value="' + escapeHtml(currentText) + '" style="flex:1;padding:4px 8px;font-size:12.5px;">';
        var input = document.getElementById('gs-mis-edit-' + taskId);
        if (input) {
          input.focus();
          input.addEventListener('keydown', async function(e) {
            if (e.key === 'Enter') {
              var newDesc = input.value.trim();
              if (!newDesc) return;
              try {
                await fetch('/api/secondary-task/' + taskId, {
                  method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ descripcion: newDesc })
                });
                showToast('Descripcion actualizada');
                loadGsMissions(clientId);
              } catch (err) { showToast('Error: ' + err.message); }
            }
            if (e.key === 'Escape') loadGsMissions(clientId);
          });
        }
      });
    });

    // Delete missions
    list.querySelectorAll('[data-delete-mission]').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        if (!confirm('Borrar esta mision?')) return;
        try {
          await fetch('/api/secondary-task/' + btn.dataset.deleteMission, { method: 'DELETE' });
          showToast('Mision eliminada');
          loadGsMissions(clientId);
        } catch (err) { showToast('Error: ' + err.message); }
      });
    });

    // Add mission button + form
    var addBtn = document.getElementById('gs-add-mission');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        // Insert form before button
        var formHtml = '<div class="gs-mis-form" id="gs-mis-form">' +
          '<input class="gs-mis-form__input" id="gs-mis-input" placeholder="Nueva misi&oacute;n&hellip;">' +
          '<select class="gs-mis-form__sel" id="gs-mis-who">' +
            '<option value="">Responsable</option>' +
            '<option value="ian">Ian</option>' +
            '<option value="cristian">Cristian</option>' +
            '<option value="santiago">Santiago</option>' +
            '<option value="artista">Artista</option>' +
            '<option value="equipo_artista">Equipo del Artista</option>' +
          '</select>' +
          '<button class="gs-mis-form__ok" id="gs-mis-ok">&#10003;</button>' +
          '<button class="gs-mis-form__x" id="gs-mis-cancel">&times;</button>' +
        '</div>';

        addBtn.insertAdjacentHTML('beforebegin', formHtml);
        addBtn.style.display = 'none';
        document.getElementById('gs-mis-input').focus();

        document.getElementById('gs-mis-cancel').addEventListener('click', function() {
          document.getElementById('gs-mis-form').remove();
          addBtn.style.display = '';
        });

        document.getElementById('gs-mis-ok').addEventListener('click', async function() {
          var desc = document.getElementById('gs-mis-input').value.trim();
          var who = document.getElementById('gs-mis-who').value;
          if (!desc) { showToast('Escribe la mision'); return; }
          try {
            await fetch('/api/client/' + clientId + '/missions', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ descripcion: desc, assigned_to: who || null })
            });
            showToast('Mision creada');
            document.getElementById('gs-mis-form').remove();
            addBtn.style.display = '';
            loadGsMissions(clientId);
          } catch (err) { showToast('Error: ' + err.message); }
        });
      });
    }

  } catch (err) {
    list.innerHTML = '<div style="padding:8px 0;color:var(--gs-text-3);font-size:12px;">Error: ' + escapeHtml(err.message) + '</div>';
  }
}
```

---

## PASO 8: ACTUALIZAR `openArtistDashboard` (línea 3700)

La función `openArtistDashboard` necesita un ajuste mínimo: ya no inserta la sección de links por separado (ahora la maneja `renderMgmtClientDetail` internamente via `loadGsResources`). Eliminar las líneas 3734-3741 (el bloque que creaba `linksSection` y llamaba a `loadArtistLinksSection`).

La función queda:
```javascript
async function openArtistDashboard(slug) {
  currentMgmtClientSlug = slug;
  _artistDashboardOrigin = activeView;

  $$('.view').forEach(v => v.classList.add('hidden'));
  $('#view-mgmt-client-detail').classList.remove('hidden');
  activeView = 'artist-dashboard';

  const container = $('#mgmt-client-detail-container');
  container.innerHTML = '<div class="loading">Cargando dashboard...</div>';

  try {
    const res = await fetch('/api/artist/' + encodeURIComponent(slug) + '/dashboard');
    if (!res.ok) throw new Error('Artista no encontrado');
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    const mgmtLine = data.service_lines.find(s =>
      s.type === 'Management' || s.type === 'MGMT'
    );

    const clientRecord = clientsData.find(c => c.slug === slug) || {
      id: data.artist.id,
      slug: data.artist.slug,
      display_name: data.artist.display_name,
      status: data.artist.status,
      metadata: data.artist.metadata || {}
    };

    const detail = {
      client: clientRecord,
      engagement: mgmtLine ? mgmtLine.engagement : null,
      objectives: mgmtLine ? (mgmtLine.objectives || []) : [],
      service_lines: data.service_lines || []
    };

    renderMgmtClientDetail(detail);
  } catch (err) {
    container.innerHTML = '<div style="padding:60px;text-align:center;color:var(--gs-text-3);font-size:14px;">Error: ' + escapeHtml(err.message) + '</div>';
  }
}
```

---

## MAPEO DE DATOS — TABLAS REALES SUPABASE

**IMPORTANTE:** El SPEC de diseño usa nombres genéricos. Estos son los nombres REALES en Supabase:

| SPEC dice | Tabla REAL | Notas |
|---|---|---|
| `artists` | `artists` | Correcto |
| `artist_resources` | `artist_links` | **DIFERENTE** — usar `artist_links` |
| `objectives` | `mgmt_objectives` | **DIFERENTE** — con prefijo mgmt_ |
| `deliverables` | `mgmt_deliverables` | **DIFERENTE** — con prefijo mgmt_ |
| `meetings` | `mgmt_meetings` | **DIFERENTE** — con prefijo mgmt_ |
| `missions` | `secondary_tasks` | **DIFERENTE** — nombre completamente diferente |

### Campos disponibles en el response de `/api/artist/:slug/dashboard`:

```javascript
{
  artist: { id, slug, display_name, status, metadata: { city, manager, label, ... } },
  service_lines: [{
    id, type, status, started_at,
    engagement: { id, client_id, month, invoice_amount, invoice_currency, status },
    objectives: [{
      id, number, title, subtitle, description, status,
      mgmt_deliverables: [{ id, title, owner, status, file_path, attachment_type }],
      mgmt_meetings: [{ id, type, held_at, summary, objetivo }]
    }]
  }],
  missions: [{ id, descripcion, status, assigned_to, archived }],
  links: [{ id, label, url, category, attachment_type }],
  boveda: { ... }
}
```

### Endpoints existentes:

| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/artist/:slug/dashboard` | Dashboard completo del artista |
| GET | `/api/artist/:slug/links` | Links/recursos del artista |
| POST | `/api/artist/:slug/links` | Crear link `{ label, url, attachment_type, category }` |
| DELETE | `/api/artist-link/:id` | Eliminar link |
| GET | `/api/client/:id/meetings` | Reuniones del cliente |
| GET | `/api/client/:id/missions` | Misiones del cliente |
| POST | `/api/client/:id/missions` | Crear misión `{ descripcion, assigned_to }` |
| PATCH | `/api/secondary-task/:id/status` | Cambiar estado `{ status }` |
| PATCH | `/api/secondary-task/:id/assignee` | Cambiar responsable `{ assigned_to }` |
| PATCH | `/api/secondary-task/:id` | Editar misión `{ descripcion }` |
| DELETE | `/api/secondary-task/:id` | Eliminar misión |

---

## REGLAS ANTI-DRIFT (leer antes de cada sección)

1. Usar SIEMPRE los hex EXACTOS del SPEC. Prohibido sustituir por colores "equivalentes".
2. Las DOS fuentes son obligatorias: `Libre Franklin` (títulos/labels/cifras) y `Arimo` (body).
3. Labels de sección y badges van en **MAYÚSCULAS** con su `letter-spacing` exacto.
4. Si un elemento no tiene margin declarado, es `margin: 0`.
5. NINGÚN borde usa `#fff` directo: todos usan `rgba(252,252,250, α)` con el α indicado.
6. Los estados (DONE/PENDING, hover) cambian color según las tablas condicionales.
7. NO agregar `backdrop-filter`, `blur`, ni efectos glassmorphism en esta vista.
8. Los fondos son TRANSPARENTES o `#000` / `#070707` — nunca `#14141f` ni similares.
9. NO tocar funciones ni estilos de otras vistas (métricas, agentes, contratos, sidebar).
10. Mantener TODOS los event handlers funcionales (CRUD de objetivos, deliverables, meetings, missions).

---

## CHECKLIST DE ACEPTACIÓN

- [ ] Ambas fuentes cargadas (Libre Franklin + Arimo); labels en Libre Franklin con letter-spacing correcto
- [ ] Todos los hex coinciden con el SPEC (verificar con color-picker)
- [ ] Breadcrumb con "← ARTISTAS / NOMBRE" funcional
- [ ] Hero: avatar 150×196px, nombre editorial grande (clamp 44-72px), dot animado, badge servicio, precio con formato
- [ ] Carrusel de recursos: scroll horizontal sin barra visible, cards tipo browser con dots, card "+" al final, form inline funcional
- [ ] Grid 1.55fr / 1fr con borde divisor entre columnas
- [ ] Objetivos: número grande fantasma (#01), título 24px, badge PENDING/DONE con color condicional, barra de progreso animada
- [ ] Entregables: dots con border 1.5px (relleno+glow solo si done), badge TEAM violeta, acciones funcionales
- [ ] Bitácora: timeline vertical con nodos coloreados por tipo, fechas en formato "DD MMM"
- [ ] Misiones: checkbox cuadrado con color del responsable, texto tachado si done, form inline para nueva misión
- [ ] Hover del settings rota 60°; hover de cards recurso eleva 3px
- [ ] Todas las otras vistas del dashboard siguen funcionando sin cambios
- [ ] NO hay glassmorphism, backdrop-filter, ni blur en esta vista
