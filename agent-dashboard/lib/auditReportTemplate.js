// =====================================================================
// Template del informe de Auditoría Algorítmica — formato G*S noir
// Mismo lenguaje visual que los informes publicados en growthstars.net
// (Archivo Black + Oswald + Space Grotesk, ink/paper, hazard stripes).
// Recibe el JSON de síntesis de Kimi y devuelve un single-file HTML.
// =====================================================================

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const SEMAFORO = {
  verde: { bg: '#0e7a3d', label: 'OK' },
  amarillo: { bg: '#b57f00', label: 'ATENCIÓN' },
  rojo: { bg: '#b3261e', label: 'CRÍTICO' },
  nd: { bg: '#8a8a8a', label: 'N/D' }
};

function semaforoPill(estado) {
  const s = SEMAFORO[String(estado || 'nd').toLowerCase()] || SEMAFORO.nd;
  return `<span class="sem" style="background:${s.bg}">${s.label}</span>`;
}

const PRIORIDAD_COLOR = { 'CRÍTICA': '#b3261e', 'ALTA': '#b57f00', 'MEDIA': '#4d4d4d' };

function renderAuditReport(report, extras) {
  const r = report || {};
  const platformResults = (extras && extras.platformResults) || [];
  const artista = esc(r.artista || 'Artista');
  const fecha = esc(r.fecha || '');
  const tier = r.tier || {};
  const kpis = Array.isArray(r.kpis_hero) ? r.kpis_hero.slice(0, 4) : [];
  const secciones = [];
  let secNo = 0;

  const sec = (id, titulo, inner, opts) => {
    secNo++;
    const dark = opts && opts.dark;
    secciones.push(`
<section id="${id}" class="${dark ? 'dark' : (secNo % 2 === 0 ? 'gray' : '')}">
  <div class="wrap">
    <div class="sechead">
      <div>
        <div class="kicker">Auditoría Algorítmica · Growth*Stars</div>
        <h2>${titulo}</h2>
      </div>
      <div class="secno">${String(secNo).padStart(2, '0')}</div>
    </div>
    <div class="hazard"></div>
    ${inner}
  </div>
</section>`);
    return `<a class="nl" href="#${id}">${titulo}</a>`;
  };

  const navLinks = [];

  // 01 — Resumen ejecutivo
  if (Array.isArray(r.resumen_ejecutivo) && r.resumen_ejecutivo.length) {
    navLinks.push(sec('resumen', 'Resumen Ejecutivo', `
      <ol class="hallazgos">
        ${r.resumen_ejecutivo.map(h => `<li>${esc(h)}</li>`).join('')}
      </ol>`));
  }

  // 02 — Tier
  if (tier.nivel || tier.nombre) {
    navLinks.push(sec('tier', 'Clasificación de Tier', `
      <div class="tiergrid">
        <div class="tierbadge">
          <div class="v">T${esc(tier.nivel || '?')}</div>
          <div class="l">${esc(tier.nombre || '')}</div>
        </div>
        <div>
          <p class="lead">${esc(tier.justificacion || '')}</p>
          ${tier.asimetria ? `<div class="callout"><strong>Asimetría detectada (palanca #1):</strong> ${esc(tier.asimetria)}</div>` : ''}
        </div>
      </div>`, { dark: true }));
  }

  // 03 — Plataformas
  if (platformResults.length) {
    const bloques = platformResults.map(p => {
      const metricas = Array.isArray(p.metricas) ? p.metricas : [];
      const hallazgos = Array.isArray(p.hallazgos) ? p.hallazgos : [];
      const nd = Array.isArray(p.datos_no_disponibles) ? p.datos_no_disponibles : [];
      return `
      <div class="platform">
        <h3 class="osw">${esc(p.plataforma || '')}</h3>
        <p class="lead" style="margin-bottom:14px;">${esc(p.resumen || '')}</p>
        ${metricas.length ? `
        <div class="tblwrap"><table>
          <thead><tr><th>Métrica</th><th>Actual</th><th>Benchmark</th><th>Estado</th></tr></thead>
          <tbody>
            ${metricas.map(m => `<tr><td>${esc(m.nombre)}</td><td class="num">${esc(m.valor)}</td><td class="num">${esc(m.benchmark)}</td><td>${semaforoPill(m.estado)}</td></tr>`).join('')}
          </tbody>
        </table></div>` : ''}
        ${hallazgos.length ? `<ul class="mini">${hallazgos.map(h => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
        ${nd.length ? `<div class="ndnote">Datos no disponibles en screenshots: ${nd.map(esc).join(' · ')}</div>` : ''}
      </div>`;
    }).join('');
    navLinks.push(sec('plataformas', 'Diagnóstico por Plataforma', bloques));
  }

  // 04 — Funnel
  if (Array.isArray(r.funnel) && r.funnel.length) {
    navLinks.push(sec('funnel', 'Dónde se Rompe el Funnel', `
      <div class="funnelgrid">
        ${r.funnel.map(f => `
        <div class="funnelcard">
          <div class="fhead">${semaforoPill(f.estado)}<span class="osw">${esc(f.etapa)}</span></div>
          <p>${esc(f.diagnostico)}</p>
        </div>`).join('')}
      </div>`));
  }

  // 05 — NSM
  if (r.nsm && r.nsm.metrica) {
    navLinks.push(sec('nsm', 'North Star Metric', `
      <p class="nsmname disp">${esc(r.nsm.metrica)}</p>
      <p class="lead" style="margin:14px 0 24px;">${esc(r.nsm.justificacion || '')}</p>
      <div class="herostats" style="margin-top:0;">
        <div class="hs"><div class="v">${esc(r.nsm.baseline || '—')}</div><div class="l">Baseline</div></div>
        <div class="hs"><div class="v">${esc(r.nsm.meta_30 || '—')}</div><div class="l">Meta 30d</div></div>
        <div class="hs"><div class="v">${esc(r.nsm.meta_60 || '—')}</div><div class="l">Meta 60d</div></div>
        <div class="hs"><div class="v">${esc(r.nsm.meta_90 || '—')}</div><div class="l">Meta 90d</div></div>
      </div>`, { dark: true }));
  }

  // 06 — Triggers
  if (Array.isArray(r.triggers) && r.triggers.length) {
    navLinks.push(sec('triggers', 'Triggers Algorítmicos v2.3', `
      <div class="tblwrap"><table>
        <thead><tr><th>Código</th><th>Trigger</th><th>Prioridad</th><th>Baseline</th><th>Meta</th><th>Palanca</th></tr></thead>
        <tbody>
          ${r.triggers.map(t => `<tr>
            <td class="code">${esc(t.codigo)}</td>
            <td>${esc(t.nombre)}</td>
            <td><span class="sem" style="background:${PRIORIDAD_COLOR[t.prioridad] || '#4d4d4d'}">${esc(t.prioridad || '')}</span></td>
            <td class="num">${esc(t.baseline)}</td>
            <td class="num">${esc(t.meta)}</td>
            <td>${esc(t.palanca)}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>`));
  }

  // 07 — Roadmap
  if (Array.isArray(r.roadmap) && r.roadmap.length) {
    navLinks.push(sec('roadmap', 'Roadmap 90 Días', `
      <div class="roadgrid">
        ${r.roadmap.map(m => `
        <div class="roadcol">
          <div class="rhead osw">${esc(m.mes)}</div>
          <div class="rfoco">${esc(m.foco || '')}</div>
          <ul class="mini">${(Array.isArray(m.acciones) ? m.acciones : []).map(a => `<li>${esc(a)}</li>`).join('')}</ul>
        </div>`).join('')}
      </div>`, { dark: true }));
  }

  // 08 — Riesgos
  if (Array.isArray(r.riesgos) && r.riesgos.length) {
    navLinks.push(sec('riesgos', 'Riesgos y Mitigación', `
      <div class="tblwrap"><table>
        <thead><tr><th>Riesgo</th><th>Prob.</th><th>Impacto</th><th>Mitigación</th></tr></thead>
        <tbody>
          ${r.riesgos.map(x => `<tr><td>${esc(x.riesgo)}</td><td>${esc(x.probabilidad)}</td><td>${esc(x.impacto)}</td><td>${esc(x.mitigacion)}</td></tr>`).join('')}
        </tbody>
      </table></div>`));
  }

  // 09 — Conclusión
  if (r.conclusion) {
    navLinks.push(sec('cierre', 'Conclusión', `
      <p class="lead" style="font-size:20px; max-width:820px;">${esc(r.conclusion)}</p>
      <div style="margin-top:34px;"><span class="tag fill">Growth*Stars · Auditoría Algorítmica</span></div>`, { dark: true }));
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0a0a0a">
<title>${artista} · Auditoría Algorítmica · Growth*Stars</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Oswald:wght@400;600&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
<style>
:root{--ink:#0a0a0a;--paper:#ffffff;--g1:#f4f4f4;--g2:#e2e2e2;--g3:#bdbdbd;--g4:#8a8a8a;--g5:#4d4d4d;--g6:#1c1c1c;--maxw:1080px;}
*{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{font-family:'Space Grotesk',sans-serif;background:var(--paper);color:var(--ink);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased;}
.disp{font-family:'Archivo Black',sans-serif;text-transform:uppercase;line-height:1.02;letter-spacing:-0.01em;}
.osw{font-family:'Oswald',sans-serif;font-weight:600;text-transform:uppercase;letter-spacing:.06em;}
nav{position:fixed;top:0;left:0;right:0;z-index:90;background:rgba(10,10,10,.95);backdrop-filter:blur(8px);border-bottom:1px solid var(--g6);}
.navin{max-width:var(--maxw);margin:0 auto;display:flex;align-items:center;gap:18px;padding:0 20px;height:54px;overflow-x:auto;scrollbar-width:none;}
.navin::-webkit-scrollbar{display:none;}
.navbrand{font-family:'Archivo Black';color:var(--paper);font-size:13px;text-transform:uppercase;white-space:nowrap;flex-shrink:0;}
nav a.nl{font-family:'Oswald';font-weight:600;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--g4);text-decoration:none;white-space:nowrap;padding:4px 0;}
nav a.nl:hover{color:var(--paper);}
section{padding:80px 20px;}
.wrap{max-width:var(--maxw);margin:0 auto;}
.dark{background:var(--ink);color:var(--paper);}
.gray{background:var(--g1);}
.kicker{font-family:'Oswald';font-weight:600;font-size:12px;letter-spacing:.26em;text-transform:uppercase;color:var(--g4);}
.sechead{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:14px;}
.sechead h2{font-family:'Archivo Black';text-transform:uppercase;font-size:clamp(26px,4.5vw,44px);line-height:1.02;margin-top:8px;}
.secno{font-family:'Archivo Black';font-size:clamp(40px,7vw,72px);line-height:.9;color:transparent;-webkit-text-stroke:2px var(--ink);flex-shrink:0;}
.dark .secno{-webkit-text-stroke:2px var(--g5);}
.hazard{height:10px;background:repeating-linear-gradient(-45deg,var(--ink) 0 9px,transparent 9px 18px);margin:18px 0 34px;}
.dark .hazard{background:repeating-linear-gradient(-45deg,var(--paper) 0 9px,transparent 9px 18px);opacity:.85;}
.lead{font-size:17px;color:var(--g5);max-width:760px;}
.dark .lead{color:var(--g3);}
.tag{display:inline-block;font-family:'Oswald';font-weight:600;text-transform:uppercase;letter-spacing:.14em;font-size:11px;padding:5px 12px;border:2px solid var(--ink);}
.tag.fill{background:var(--paper);color:var(--ink);border-color:var(--paper);}
.hero{min-height:88svh;background:var(--ink);color:var(--paper);display:flex;flex-direction:column;justify-content:center;padding:130px 20px 70px;position:relative;overflow:hidden;}
.hero h1{font-family:'Archivo Black';text-transform:uppercase;font-size:clamp(48px,11vw,140px);line-height:.92;letter-spacing:-.02em;}
.hero .sub{font-family:'Oswald';font-size:clamp(14px,2vw,19px);letter-spacing:.08em;text-transform:uppercase;color:var(--g3);margin-top:18px;}
.hero .star1{position:absolute;right:-90px;top:-130px;font-family:'Archivo Black';font-size:420px;color:transparent;-webkit-text-stroke:2px var(--g6);line-height:1;pointer-events:none;}
.herobadges{display:flex;gap:10px;flex-wrap:wrap;margin-top:26px;}
.herobadge{display:inline-block;font-family:'Oswald';font-weight:600;text-transform:uppercase;letter-spacing:.14em;font-size:11px;padding:5px 12px;border:2px solid var(--paper);color:var(--paper);}
.herostats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:2px;margin-top:54px;background:var(--g6);border:2px solid var(--g6);}
.herostats .hs{background:var(--ink);padding:22px 18px;}
.herostats .v{font-family:'Archivo Black';font-size:clamp(22px,3.6vw,40px);line-height:1;color:var(--paper);}
.herostats .l{font-family:'Oswald';font-weight:600;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--g4);margin-top:8px;}
.hallazgos{counter-reset:h;list-style:none;display:grid;gap:14px;max-width:860px;}
.hallazgos li{counter-increment:h;position:relative;padding:18px 20px 18px 74px;border:2px solid var(--ink);background:var(--paper);font-size:16px;}
.hallazgos li::before{content:counter(h,decimal-leading-zero);position:absolute;left:18px;top:14px;font-family:'Archivo Black';font-size:26px;}
.tiergrid{display:grid;grid-template-columns:auto 1fr;gap:34px;align-items:start;}
.tierbadge{border:3px solid var(--paper);padding:26px 30px;text-align:center;}
.tierbadge .v{font-family:'Archivo Black';font-size:64px;line-height:1;}
.tierbadge .l{font-family:'Oswald';font-weight:600;font-size:13px;letter-spacing:.2em;text-transform:uppercase;margin-top:8px;color:var(--g3);}
.callout{margin-top:18px;padding:16px 18px;border:2px solid var(--paper);font-size:15px;}
.platform{margin-bottom:54px;}
.platform h3{font-size:22px;margin-bottom:8px;}
.tblwrap{overflow-x:auto;border:2px solid var(--ink);margin:14px 0;}
.dark .tblwrap{border-color:var(--g5);}
table{width:100%;border-collapse:collapse;font-size:14px;min-width:560px;background:var(--paper);color:var(--ink);}
th{font-family:'Oswald';font-weight:600;text-transform:uppercase;letter-spacing:.1em;font-size:11px;text-align:left;padding:10px 14px;background:var(--ink);color:var(--paper);}
td{padding:10px 14px;border-top:1px solid var(--g2);vertical-align:top;}
td.num{font-family:'Space Grotesk';font-weight:700;white-space:nowrap;}
td.code{font-family:'Oswald';font-weight:600;white-space:nowrap;}
.sem{display:inline-block;font-family:'Oswald';font-weight:600;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#fff;padding:3px 9px;white-space:nowrap;}
.mini{list-style:none;display:grid;gap:8px;margin-top:12px;max-width:820px;}
.mini li{padding-left:20px;position:relative;font-size:14.5px;}
.mini li::before{content:'★';position:absolute;left:0;font-size:11px;top:4px;}
.ndnote{margin-top:12px;font-size:12.5px;color:var(--g4);font-style:italic;}
.funnelgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;}
.funnelcard{border:2px solid var(--ink);background:var(--paper);padding:18px;}
.funnelcard .fhead{display:flex;align-items:center;gap:10px;margin-bottom:10px;font-size:15px;}
.funnelcard p{font-size:14px;color:var(--g5);}
.nsmname{font-size:clamp(28px,5vw,52px);}
.roadgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;}
.roadcol{border:2px solid var(--g5);padding:20px;}
.roadcol .rhead{font-size:16px;border-bottom:2px solid var(--g5);padding-bottom:10px;margin-bottom:10px;}
.roadcol .rfoco{font-size:13.5px;color:var(--g3);margin-bottom:10px;}
.dark .mini li{color:var(--g2);}
footer{background:var(--ink);color:var(--g4);padding:34px 20px;text-align:center;font-family:'Oswald';font-size:11px;letter-spacing:.2em;text-transform:uppercase;}
@media(max-width:640px){.tiergrid{grid-template-columns:1fr;}}
</style>
</head>
<body>
<nav><div class="navin">
  <span class="navbrand">G*S — AUDITORÍA</span>
  ${navLinks.join('\n  ')}
</div></nav>

<header class="hero">
  <div class="wrap" style="position:relative;z-index:2;">
    <div class="star1">*</div>
    <div class="kicker" style="margin-bottom:14px;">Growth*Stars · Auditoría Algorítmica · ${fecha}</div>
    <h1>${artista}</h1>
    <div class="sub">Diagnóstico algorítmico integral · TikTok / Instagram / YouTube / Spotify / Distribución</div>
    <div class="herobadges">
      ${tier.nivel ? `<span class="herobadge">Tier ${esc(tier.nivel)} — ${esc(tier.nombre || '')}</span>` : ''}
      <span class="herobadge">Sistema de Triggers v2.3</span>
      <span class="herobadge">Kimi K2.5 Vision</span>
    </div>
    ${kpis.length ? `<div class="herostats">
      ${kpis.map(k => `<div class="hs"><div class="v">${esc(k.valor)}</div><div class="l">${esc(k.label)}</div></div>`).join('')}
    </div>` : ''}
  </div>
</header>

${secciones.join('\n')}

<footer>Growth*Stars · Auditoría Algorítmica generada por G*S-Auditor Algorítmico · ${fecha} · Confidencial</footer>
</body>
</html>`;
}

module.exports = { renderAuditReport };
