# PROMPT: Portal del Artista — Estética Editorial Noir

> **Para:** CTO Jr (Claude Code operativo)
> **Archivo target:** `agent-dashboard/artist-portal.html` (600 líneas, archivo standalone)
> **Estética:** Editorial Noir — misma identidad visual que la vista interna del dashboard
> **Contexto:** Este es el portal PÚBLICO del artista. El artista y su equipo lo ven. Es presentacional, NO operativo (sin CRUD, sin edición). Solo lectura de su progreso, documentos, y tareas.

---

## CONTEXTO TÉCNICO

El portal es un HTML standalone que:
- Carga Supabase JS desde CDN y usa la **anon key** (NO service_role — es público)
- Detecta el artista por subdomain (`reckless.growthstars.net`) o query param (`?artist=reckless`)
- Consulta directamente: `artists`, `clients`, `artist_links`, `secondary_tasks`, `mgmt_engagements`, `mgmt_objectives` con `mgmt_deliverables`
- Renderiza todo con template literals en una función `renderPortal()`
- NO tiene backend propio — todo es client-side contra Supabase

**IMPORTANTE:** NO cambiar la anon key. Solo transformar CSS + estructura HTML del render. Hay UN cambio mínimo de datos: ver PASO 3.

---

## PASO 1: REEMPLAZAR `:root` Y ESTILOS BASE

Reemplazar TODO el bloque `<style>` con la estética Editorial Noir. Agregar Google Fonts antes del `<style>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:ital,wght@0,400;0,500;0,600;0,700;1,500&family=Arimo:wght@400;500;600;700&display=swap" rel="stylesheet">
```

```css
:root {
  --gs-bg: #000000;
  --gs-surf-1: #070707;
  --gs-surf-2: #0a0a0a;
  --gs-surf-3: #0c0c0c;
  --gs-text: #fcfcfa;
  --gs-text-2: #9a9a9a;
  --gs-text-3: #656565;
  --gs-text-4: #5a5a5a;
  --gs-text-card: #d6d6d2;
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

@keyframes gsGlow { 0%,100% { opacity:.55 } 50% { opacity:1 } }
@keyframes gsBar { from { transform:scaleX(0) } to { transform:scaleX(1) } }

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: var(--gs-font-body);
  background: var(--gs-bg);
  color: var(--gs-text);
  min-height: 100vh;
  line-height: 1.5;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 44px 60px;
}

/* ===== LOADING ===== */
.state-screen {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 60vh; text-align: center; gap: 12px;
}
.state-screen .title { font-family: var(--gs-font-display); font-size: 20px; font-weight: 600; }
.state-screen .subtitle { font-size: 14px; color: var(--gs-text-2); max-width: 400px; }
.spinner {
  width: 32px; height: 32px;
  border: 3px solid var(--gs-bd-12);
  border-top-color: var(--gs-lime);
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== HEADER / HERO ===== */
.portal-hero {
  position: relative;
  padding: 46px 0 38px;
  border-bottom: 1px solid var(--gs-bd-06);
  margin-bottom: 0;
}
.portal-hero::before {
  content: ""; position: absolute; left: -44px; right: -44px; top: 0; height: 2px;
  background: linear-gradient(90deg, #c6ff00, transparent 60%);
}
.portal-hero__top {
  display: flex; align-items: flex-start; gap: 36px; flex-wrap: wrap;
}
.portal-hero__avatar {
  width: 120px; height: 157px; flex: none;
  border: 1px solid var(--gs-bd-12); border-radius: 4px;
  background: repeating-linear-gradient(135deg, #0c0c0c 0, #0c0c0c 7px, #070707 7px, #070707 14px);
  object-fit: cover;
}
.portal-hero__info { flex: 1; min-width: 240px; }
.portal-hero__status {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: var(--gs-font-display); font-size: 10px; letter-spacing: 2px;
  color: var(--gs-lime); margin-bottom: 14px;
}
.portal-hero__dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--gs-lime);
  box-shadow: 0 0 10px var(--gs-lime); animation: gsGlow 2s infinite;
}
.portal-hero__name {
  font-family: var(--gs-font-display); font-weight: 700;
  font-size: clamp(36px, 4.5vw, 56px); line-height: .92; letter-spacing: -1.5px; margin: 0;
}
.portal-hero__name-dot { font-style: italic; font-weight: 500; color: var(--gs-lime); }
.portal-hero__loc {
  margin: 12px 0 0; font-family: var(--gs-font-display);
  font-size: 10px; letter-spacing: 2px; color: var(--gs-text-3);
}
.portal-hero__badges { margin: 18px 0 0; display: flex; gap: 8px; flex-wrap: wrap; }
.portal-hero__badge {
  display: inline-block; padding: 5px 12px;
  border: 1px solid var(--gs-bd-20); border-radius: 3px; color: var(--gs-text-2);
  font-family: var(--gs-font-display); font-size: 11px; letter-spacing: 2px;
}
.portal-hero__badge--tier { color: var(--gs-violet); border-color: rgba(179,136,255,.3); }

/* ===== SECCIÓN GENÉRICA ===== */
.gs-portal-sec { padding: 34px 0; border-bottom: 1px solid var(--gs-bd-06); }
.gs-portal-sec__head { display: flex; align-items: baseline; gap: 14px; margin-bottom: 22px; }
.gs-portal-sec__title {
  font-family: var(--gs-font-display); font-size: 11px; font-weight: 400;
  letter-spacing: 3px; color: var(--gs-text); margin: 0;
}
.gs-portal-sec__rule { flex: 1; height: 1px; background: var(--gs-bd-08); }
.gs-portal-sec__count { font-family: var(--gs-font-display); font-size: 10px; color: var(--gs-text-3); }
.gs-portal-sec__sub {
  font-family: var(--gs-font-display); font-size: 10px; color: var(--gs-text-3); letter-spacing: 1px;
}

/* ===== BARRA DE PROGRESO ===== */
.gs-progress { margin-bottom: 28px; }
.gs-progress__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.gs-progress__label { font-family: var(--gs-font-display); font-size: 10px; letter-spacing: 2px; color: var(--gs-text-2); }
.gs-progress__pct { font-family: var(--gs-font-display); font-size: 14px; font-weight: 600; color: var(--gs-lime); }
.gs-progress__track { height: 3px; background: var(--gs-bd-08); border-radius: 2px; overflow: hidden; }
.gs-progress__fill {
  height: 100%; background: var(--gs-lime);
  box-shadow: 0 0 8px rgba(198,255,0,.7);
  transform-origin: left; animation: gsBar .8s ease-out;
}

/* ===== OBJETIVO ===== */
.gs-portal-obj { padding: 26px 0; border-bottom: 1px solid var(--gs-bd-07); }
.gs-portal-obj:last-child { border-bottom: none; }
.gs-portal-obj__row { display: flex; align-items: flex-start; gap: 18px; }
.gs-portal-obj__n {
  font-family: var(--gs-font-display); font-size: 36px; font-weight: 600;
  line-height: .8; color: rgba(252,252,250,.22); width: 48px; flex: none;
}
.gs-portal-obj__body { flex: 1; min-width: 0; }
.gs-portal-obj__top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.gs-portal-obj__title { font-family: var(--gs-font-display); font-size: 20px; font-weight: 600; line-height: 1.1; }
.gs-portal-obj__sub { color: var(--gs-text-3); font-size: 12px; margin-top: 3px; }

/* Status badge */
.gs-badge {
  font-family: var(--gs-font-display); font-size: 9px; letter-spacing: 1.5px;
  padding: 4px 8px; border-radius: 3px; white-space: nowrap;
}
.gs-badge--done { color: var(--gs-lime); border: 1px solid rgba(198,255,0,.35); }
.gs-badge--pending { color: var(--gs-amber); border: 1px solid rgba(255,138,61,.35); }
.gs-badge--progress { color: var(--gs-cyan); border: 1px solid rgba(41,224,255,.35); }

/* Barra de progreso del objetivo */
.gs-portal-prog { display: flex; align-items: center; gap: 12px; margin: 14px 0 6px; }
.gs-portal-prog__track { flex: 1; height: 3px; background: var(--gs-bd-08); border-radius: 2px; overflow: hidden; }
.gs-portal-prog__fill {
  height: 100%; background: var(--gs-lime);
  box-shadow: 0 0 8px rgba(198,255,0,.7); transform-origin: left; animation: gsBar .8s ease-out;
}
.gs-portal-prog__count { font-family: var(--gs-font-display); font-size: 10px; color: var(--gs-text-2); }

/* ===== ENTREGABLE ===== */
.gs-portal-delivs { margin-top: 14px; display: flex; flex-direction: column; gap: 6px; }
.gs-portal-deliv {
  display: flex; align-items: center; gap: 12px; padding: 11px 12px;
  background: var(--gs-surf-1); border: 1px solid var(--gs-bd-06); border-radius: 4px;
  transition: border-color .15s;
}
.gs-portal-deliv:hover { border-color: var(--gs-bd-16); }
.gs-portal-deliv__dot {
  width: 7px; height: 7px; border-radius: 50%; flex: none;
  border: 1.5px solid var(--gs-text-3); background: transparent;
}
.gs-portal-deliv__dot--done { background: var(--gs-lime); border-color: var(--gs-lime); box-shadow: 0 0 8px var(--gs-lime); }
.gs-portal-deliv__name { flex: 1; min-width: 0; font-size: 13.5px; color: var(--gs-text-card); }
.gs-portal-deliv__action {
  font-family: var(--gs-font-display); font-size: 8.5px; letter-spacing: 1px;
  text-decoration: none; cursor: pointer; transition: opacity .15s;
}
.gs-portal-deliv__action:hover { opacity: .7; }
.gs-portal-deliv__action--done { color: var(--gs-lime); }
.gs-portal-deliv__action--pending { color: var(--gs-text-3); }

/* ===== DOCUMENTOS (carrusel) ===== */
.gs-portal-carousel {
  display: flex; gap: 14px; overflow-x: auto;
  scroll-snap-type: x proximity; scrollbar-width: none;
}
.gs-portal-carousel::-webkit-scrollbar { display: none; }

.gs-portal-doc {
  flex: none; width: 260px; scroll-snap-align: start;
  display: flex; flex-direction: column;
  background: #000; border: 1px solid var(--gs-bd-10); border-radius: 6px; overflow: hidden;
  text-decoration: none; transition: border-color .2s, transform .2s;
}
.gs-portal-doc:hover { transform: translateY(-3px); }
.gs-portal-doc__bar {
  display: flex; align-items: center; gap: 7px; padding: 9px 11px;
  border-bottom: 1px solid var(--gs-bd-07); background: var(--gs-surf-1);
}
.gs-portal-doc__tl { width: 7px; height: 7px; border-radius: 50%; background: #2a2a2a; flex: none; }
.gs-portal-doc__tl--live { box-shadow: 0 0 6px var(--neon); }
.gs-portal-doc__url {
  flex: 1; min-width: 0; text-align: right; font-family: var(--gs-font-display);
  font-size: 9px; letter-spacing: .3px; color: var(--gs-text-3);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.gs-portal-doc__preview {
  width: 100%; height: 130px; display: block; border: none; background: #0a0a0a;
}
.gs-portal-doc__preview-ph {
  width: 100%; height: 130px; display: flex; align-items: center; justify-content: center;
  color: #7d7d7d; font-family: var(--gs-font-display); font-size: 9px; letter-spacing: 2px;
  background: repeating-linear-gradient(135deg, #0d0d0d 0, #0d0d0d 8px, #080808 8px, #080808 16px);
}
.gs-portal-doc__foot { padding: 12px 14px 13px; border-top: 1px solid var(--gs-bd-07); }
.gs-portal-doc__tag { font-family: var(--gs-font-display); font-size: 9px; font-weight: 600; letter-spacing: 2px; margin-bottom: 6px; }
.gs-portal-doc__row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.gs-portal-doc__title { font-family: var(--gs-font-display); font-size: 15px; font-weight: 600; color: var(--gs-text); line-height: 1.05; }
.gs-portal-doc__arrow { font-family: var(--gs-font-display); font-size: 13px; color: #3a3a3a; flex: none; }

/* ===== TAREAS ===== */
.gs-portal-task {
  display: flex; align-items: center; gap: 12px; padding: 11px 12px;
  background: var(--gs-surf-1); border: 1px solid var(--gs-bd-06); border-radius: 4px;
  margin-bottom: 8px;
}
.gs-portal-task:hover { border-color: var(--gs-bd-14); }
.gs-portal-task__box {
  width: 16px; height: 16px; flex: none; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; color: #000;
}
.gs-portal-task__text { flex: 1; min-width: 0; font-size: 12.5px; color: var(--gs-text-card); line-height: 1.35; }
.gs-portal-task__text--done { text-decoration: line-through; opacity: .42; }
.gs-portal-task__who { font-family: var(--gs-font-display); font-size: 8.5px; letter-spacing: 1px; }
.gs-portal-task__badge {
  font-family: var(--gs-font-display); font-size: 9px; letter-spacing: 1.5px;
  padding: 4px 8px; border-radius: 3px;
}

/* ===== EMPTY STATE ===== */
.gs-portal-empty {
  padding: 30px 0; text-align: center; color: var(--gs-text-3);
  font-family: var(--gs-font-display); font-size: 11px; letter-spacing: 2px;
}

/* ===== FOOTER ===== */
.portal-footer {
  text-align: center; padding: 34px 0 16px;
  border-top: 1px solid var(--gs-bd-06); margin-top: 0;
}
.portal-footer-brand {
  font-family: var(--gs-font-display); font-size: 11px; font-weight: 600;
  letter-spacing: 3px; color: var(--gs-text-3);
}

/* ===== INFORME DEL MES ===== */
.gs-report__card {
  display: flex; align-items: center; gap: 16px;
  padding: 16px 18px;
  background: var(--gs-surf-1); border: 1px solid var(--gs-bd-10); border-radius: 6px;
  text-decoration: none; transition: border-color .2s, transform .2s;
}
.gs-report__card:hover { border-color: var(--gs-lime); transform: translateY(-2px); }
.gs-report__icon {
  width: 40px; height: 40px; flex: none; display: flex; align-items: center; justify-content: center;
  background: rgba(198,255,0,.08); border: 1px solid rgba(198,255,0,.2); border-radius: 6px;
  font-size: 18px;
}
.gs-report__info { flex: 1; min-width: 0; }
.gs-report__title {
  font-family: var(--gs-font-display); font-size: 14px; font-weight: 600;
  color: var(--gs-text); line-height: 1.2;
}
.gs-report__sub {
  font-family: var(--gs-font-display); font-size: 9px; letter-spacing: 2px;
  color: var(--gs-text-3); margin-top: 4px;
}
.gs-report__arrow {
  font-family: var(--gs-font-display); font-size: 16px; color: var(--gs-lime); flex: none;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 600px) {
  .container { padding: 0 20px 40px; }
  .portal-hero__name { font-size: 32px; }
  .portal-hero__top { gap: 20px; }
  .portal-hero__avatar { width: 90px; height: 118px; }
  .gs-portal-doc { width: 220px; }
  .gs-portal-obj__n { font-size: 28px; width: 36px; }
  .gs-portal-obj__title { font-size: 17px; }
}
```

---

## PASO 2: REESCRIBIR `renderPortal()`

Reemplazar la función `renderPortal` completa. La lógica de datos NO cambia — solo la estructura HTML:

```javascript
var GS_NEON_CYCLE = ['#c6ff00', '#29e0ff', '#ff8a3d', '#b388ff', '#ff2d78'];
var GS_WHO_COLORS = {
  'ian': '#ff2d78', 'cristian': '#ff8a3d', 'santiago': '#29e0ff',
  'artista': '#c6ff00', 'equipo_artista': '#b388ff', 'equipo del artista': '#b388ff', 'g*s': '#fcfcfa'
};

function gsWhoColor(who) {
  return who ? (GS_WHO_COLORS[who.toLowerCase()] || '#656565') : '#656565';
}

function renderPortal(artist, client, objectives, engMonth, links, tasks, engagement) {
  var meta = artist.metadata || {};
  var tier = (client && client.artist_tier) ? client.artist_tier : null;
  var genre = (client && client.genre) ? client.genre : null;
  var tierLabels = { 1: 'Emergente', 2: 'Establecido', 3: 'Reconocido', 4: 'Consolidado' };

  var status = (artist.status || 'active').toLowerCase();
  var statusColor = status === 'active' ? 'var(--gs-lime)' : status === 'paused' ? 'var(--gs-amber)' : 'var(--gs-text-3)';
  var dotAnim = status === 'active';

  var location = [meta.city, meta.country || (client && client.country) || ''].filter(Boolean).join(', ').toUpperCase();

  // Calcular progreso general
  var totalDels = 0, doneDels = 0;
  objectives.forEach(function(obj) {
    var dels = obj.mgmt_deliverables || [];
    totalDels += dels.length;
    doneDels += dels.filter(function(d) { return d.status === 'done'; }).length;
  });
  var pct = totalDels > 0 ? Math.round((doneDels / totalDels) * 100) : 0;

  // Avatar
  var avatarUrl = meta.key_visual_url || null;
  var avatarHtml = avatarUrl
    ? '<img class="portal-hero__avatar" src="' + esc(avatarUrl) + '" alt="">'
    : '<div class="portal-hero__avatar" style="display:flex;align-items:center;justify-content:center;font-family:var(--gs-font-display);font-size:9px;letter-spacing:2px;color:#7d7d7d;">// KEY VISUAL</div>';

  var html = '';

  // === HERO ===
  html += '<header class="portal-hero">' +
    '<div class="portal-hero__top">' +
      avatarHtml +
      '<div class="portal-hero__info">' +
        '<div class="portal-hero__status" style="color:' + statusColor + '">' +
          '<span class="portal-hero__dot" style="background:' + statusColor + ';box-shadow:0 0 10px ' + statusColor + (dotAnim ? '' : ';animation:none') + '"></span>' +
          esc(status.toUpperCase()) +
        '</div>' +
        '<h1 class="portal-hero__name">' + esc(artist.stage_name) + '<span class="portal-hero__name-dot">.</span></h1>' +
        (location ? '<div class="portal-hero__loc">' + esc(location) + '</div>' : '') +
        '<div class="portal-hero__badges">' +
          (tier ? '<span class="portal-hero__badge portal-hero__badge--tier">TIER ' + tier + ' &mdash; ' + esc(tierLabels[tier] || '') + '</span>' : '') +
          (genre ? '<span class="portal-hero__badge">' + esc(genre.toUpperCase()) + '</span>' : '') +
        '</div>' +
      '</div>' +
    '</div>' +
  '</header>';

  // === PROGRESO ===
  html += '<section class="gs-portal-sec">' +
    '<div class="gs-portal-sec__head">' +
      '<h2 class="gs-portal-sec__title">PROGRESO</h2>' +
      '<span class="gs-portal-sec__rule"></span>' +
      '<span class="gs-portal-sec__sub">' + getMonthName(engMonth).toUpperCase() + '</span>' +
    '</div>';

  // === INFORME DEL MES (si existe) ===
  var engReportUrl = engagement && engagement.metadata ? engagement.metadata.report_url : null;
  if (engReportUrl) {
    html += '<a class="gs-report__card" href="' + esc(engReportUrl) + '" target="_blank" style="margin:0 0 28px;display:flex;">' +
      '<div class="gs-report__icon">&#128203;</div>' +
      '<div class="gs-report__info">' +
        '<div class="gs-report__title">Informe del Mes</div>' +
        '<div class="gs-report__sub">AVANCES &middot; METAS &middot; PR&Oacute;XIMOS PASOS</div>' +
      '</div>' +
      '<span class="gs-report__arrow">&nearr;</span>' +
    '</a>';
  }

  if (objectives.length > 0) {
    // Barra general
    html += '<div class="gs-progress">' +
      '<div class="gs-progress__header">' +
        '<span class="gs-progress__label">AVANCE GENERAL</span>' +
        '<span class="gs-progress__pct">' + pct + '%</span>' +
      '</div>' +
      '<div class="gs-progress__track"><div class="gs-progress__fill" style="width:' + pct + '%"></div></div>' +
    '</div>';

    // Objetivos
    objectives.forEach(function(obj) {
      var dels = obj.mgmt_deliverables || [];
      var objDone = dels.filter(function(d) { return d.status === 'done'; }).length;
      var objTotal = dels.length;
      var objPct = objTotal > 0 ? Math.round(objDone / objTotal * 100) : 0;
      var allDone = objDone === objTotal && objTotal > 0;
      var statusClass = allDone ? 'gs-badge--done' : (obj.status === 'in_progress' || obj.status === 'en_progreso') ? 'gs-badge--progress' : 'gs-badge--pending';
      var statusText = allDone ? 'DONE' : (obj.status === 'in_progress' || obj.status === 'en_progreso') ? 'EN PROGRESO' : 'PENDING';
      var numStr = String(obj.number || 1).padStart(2, '0');

      html += '<div class="gs-portal-obj">' +
        '<div class="gs-portal-obj__row">' +
          '<div class="gs-portal-obj__n">' + numStr + '</div>' +
          '<div class="gs-portal-obj__body">' +
            '<div class="gs-portal-obj__top">' +
              '<div class="gs-portal-obj__title">' + esc(obj.title) + '</div>' +
              '<span class="gs-badge ' + statusClass + '">' + statusText + '</span>' +
            '</div>' +
            '<div class="gs-portal-prog">' +
              '<div class="gs-portal-prog__track"><div class="gs-portal-prog__fill" style="width:' + objPct + '%"></div></div>' +
              '<span class="gs-portal-prog__count">' + objDone + '/' + objTotal + '</span>' +
            '</div>';

      if (dels.length > 0) {
        html += '<div class="gs-portal-delivs">';
        dels.forEach(function(d) {
          var isDone = d.status === 'done';
          var dotClass = isDone ? 'gs-portal-deliv__dot gs-portal-deliv__dot--done' : 'gs-portal-deliv__dot';
          var hasLink = d.file_path && d.attachment_type === 'link';
          var actionHtml = '';
          if (hasLink) {
            actionHtml = '<a href="' + esc(d.file_path) + '" target="_blank" class="gs-portal-deliv__action ' + (isDone ? 'gs-portal-deliv__action--done' : 'gs-portal-deliv__action--pending') + '">' +
              (isDone ? 'VER &rarr;' : 'VER') + '</a>';
          }

          html += '<div class="gs-portal-deliv">' +
            '<span class="' + dotClass + '"></span>' +
            '<span class="gs-portal-deliv__name">' + esc(d.title) + '</span>' +
            actionHtml +
          '</div>';
        });
        html += '</div>';
      }

      html += '</div></div></div>';
    });

  } else {
    html += '<div class="gs-portal-empty">SIN PLAN ACTIVO ESTE MES</div>';
  }
  html += '</section>';

  // === DOCUMENTOS (carrusel) ===
  html += '<section class="gs-portal-sec">' +
    '<div class="gs-portal-sec__head">' +
      '<h2 class="gs-portal-sec__title">RECURSOS</h2>' +
      '<span class="gs-portal-sec__rule"></span>' +
      '<span class="gs-portal-sec__count">' + String(links.length).padStart(2, '0') + ' LINKS</span>' +
    '</div>';

  if (links.length > 0) {
    html += '<div class="gs-portal-carousel">';
    links.forEach(function(link, i) {
      var neon = GS_NEON_CYCLE[i % GS_NEON_CYCLE.length];
      var displayUrl = (link.url || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
      var tag = (link.category || 'GENERAL').toUpperCase();

      var previewHtml = link.url
        ? '<iframe class="gs-portal-doc__preview" src="' + esc(link.url) + '" loading="lazy" sandbox="allow-same-origin" tabindex="-1" scrolling="no" style="pointer-events:none;"></iframe>'
        : '<div class="gs-portal-doc__preview-ph">Captura &middot; ' + esc(link.label || '') + '</div>';

      html += '<a class="gs-portal-doc" href="' + esc(link.url || '#') + '" target="_blank" style="--neon:' + neon + '">' +
        '<div class="gs-portal-doc__bar">' +
          '<span class="gs-portal-doc__tl"></span><span class="gs-portal-doc__tl"></span>' +
          '<span class="gs-portal-doc__tl gs-portal-doc__tl--live" style="background:' + neon + ';box-shadow:0 0 6px ' + neon + '"></span>' +
          '<span class="gs-portal-doc__url">' + esc(displayUrl) + '</span>' +
        '</div>' +
        previewHtml +
        '<div class="gs-portal-doc__foot">' +
          '<div class="gs-portal-doc__tag" style="color:' + neon + '">' + esc(tag) + '</div>' +
          '<div class="gs-portal-doc__row">' +
            '<span class="gs-portal-doc__title">' + esc(link.label || '') + '</span>' +
            '<span class="gs-portal-doc__arrow">&nearr;</span>' +
          '</div>' +
        '</div>' +
      '</a>';
    });
    html += '</div>';
  } else {
    html += '<div class="gs-portal-empty">SIN RECURSOS DISPONIBLES</div>';
  }
  html += '</section>';

  // === TAREAS ===
  var activeTasks = tasks.filter(function(t) { return t.status !== 'hecha'; });
  var doneTasks = tasks.filter(function(t) { return t.status === 'hecha'; });
  var allTasks = activeTasks.concat(doneTasks);

  html += '<section class="gs-portal-sec">' +
    '<div class="gs-portal-sec__head">' +
      '<h2 class="gs-portal-sec__title">MISIONES</h2>' +
      '<span class="gs-portal-sec__rule"></span>' +
      '<span class="gs-portal-sec__count" style="color:var(--gs-lime)">' + doneTasks.length + '/' + tasks.length + '</span>' +
    '</div>';

  if (allTasks.length > 0) {
    allTasks.forEach(function(t) {
      var isDone = t.status === 'hecha';
      var who = t.assigned_to || '';
      var whoColor = gsWhoColor(who);
      var boxBg = isDone ? whoColor : 'transparent';

      html += '<div class="gs-portal-task">' +
        '<span class="gs-portal-task__box" style="border:1.5px solid ' + whoColor + ';background:' + boxBg + '">' +
          (isDone ? '&#10003;' : '') +
        '</span>' +
        '<span class="gs-portal-task__text' + (isDone ? ' gs-portal-task__text--done' : '') + '">' + esc(t.descripcion) + '</span>' +
        (who ? '<span class="gs-portal-task__who" style="color:' + whoColor + '">' + esc(who.toUpperCase()) + '</span>' : '') +
      '</div>';
    });
  } else {
    html += '<div class="gs-portal-empty">SIN MISIONES PENDIENTES</div>';
  }
  html += '</section>';

  // === FOOTER ===
  html += '<footer class="portal-footer">' +
    '<div class="portal-footer-brand">GROWTH*STARS &middot; ' + new Date().getFullYear() + '</div>' +
  '</footer>';

  document.getElementById('app').innerHTML = html;
  document.title = artist.stage_name + ' — Portal G*S';
}
```

---

## PASO 3: ACTUALIZAR `loadPortal()` — 2 cambios mínimos de datos

### 3a. Agregar `metadata` a la query del engagement

En `loadPortal()`, la línea que hace select del engagement actualmente dice:
```javascript
var engRes = await sb.from('mgmt_engagements').select('id, month, status').eq('client_id', client.id).eq('status', 'active');
```

Cambiar a:
```javascript
var engRes = await sb.from('mgmt_engagements').select('id, month, status, metadata').eq('client_id', client.id).eq('status', 'active');
```

### 3b. Pasar `engagement` a `renderPortal`

La llamada actual:
```javascript
renderPortal(artist, client, objectives, engMonth, links, tasks);
```

Cambiar a:
```javascript
renderPortal(artist, client, objectives, engMonth, links, tasks, engagement);
```

**NO cambiar:**
- La anon key
- La función `getArtistSlug()`
- La función `esc()`
- Las funciones helper (`getMonthName`, `statusLabel`, etc.)

---

## DIFERENCIAS PORTAL vs DASHBOARD INTERNO

| Aspecto | Dashboard interno | Portal cliente |
|---|---|---|
| Avatar | 150×196px, click para upload | 120×157px, solo lectura |
| Nombre | clamp(44-72px) | clamp(36-56px) — más contenido |
| CRUD | Sí (editar, borrar, crear) | NO — solo lectura |
| Recursos | Carrusel con form inline | Carrusel sin form (solo ver) |
| Misiones | Editar, asignar, archivar | Solo ver estado |
| Precio/retainer | Visible | NO visible (dato interno) |
| Settings ⚙ | Sí | NO |
| Breadcrumb | Sí (← ARTISTAS) | NO |

---

## CHECKLIST DE ACEPTACIÓN

- [ ] Fonts cargadas: Libre Franklin + Arimo
- [ ] Fondo #000000, NO #0a0a0f
- [ ] Hero con avatar, dot animado, nombre editorial grande con ".", location uppercase, badges
- [ ] Barra de progreso lime con glow y animación gsBar
- [ ] Objetivos con número fantasma (01, 02...), barra de progreso por objetivo, dots de entregables
- [ ] Recursos como carrusel horizontal tipo browser (dots + URL + iframe preview + tag color + título)
- [ ] Misiones con checkbox cuadrado coloreado por responsable
- [ ] Scroll del carrusel sin barra visible
- [ ] Status badges: DONE=lime, PENDING=amber, EN PROGRESO=cyan
- [ ] Footer: "GROWTH*STARS · 2026" centrado
- [ ] NO hay pricing, settings, CRUD, ni breadcrumb
- [ ] Responsive: funciona en mobile (600px)
- [ ] Informe del Mes: card con ícono + título + flecha, visible solo si `engagement.metadata.report_url` existe
- [ ] Query del engagement incluye `metadata` (no solo `id, month, status`)
- [ ] Anon key NO modificada, queries mínimamente ajustadas (solo se agrega `metadata` al select)
