// =====================================================================
// Compilador de Informe Mensual de Artista (DT-042)
// Archive-first: genera informe-YYYY-MM.md desde los .md de BÓVEDA,
// no desde tablas de BD. Sigue SOP-CIERRE-DE-MES.md (7 secciones).
//
// Uso:
//   node compilador-informe-mensual.js <artist-slug> <YYYY-MM>
//
// Ejemplo:
//   node compilador-informe-mensual.js reckless 2026-06
// =====================================================================

const fs = require('fs');
const path = require('path');

const BOVEDA_PATH = 'C:\\Users\\Ian Villaveces\\Documents\\BOVEDA - GROWTHStars';
const CLIENTS_PATH = path.join(BOVEDA_PATH, '06_CLIENTES');

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------
function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function parseFrontmatter(md) {
  const result = {};
  if (!md || !md.startsWith('---')) return { body: md || '', frontmatter: result };
  const end = md.indexOf('---', 3);
  if (end === -1) return { body: md, frontmatter: result };
  const fm = md.slice(3, end).trim();
  const body = md.slice(end + 3).trim();
  for (const line of fm.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    val = val.replace(/^["']|["']$/g, '');
    result[key] = val;
  }
  return { body, frontmatter: result };
}

function parseYamlFrontmatter(md) {
  const result = {};
  if (!md || !md.startsWith('---')) return result;
  const end = md.indexOf('---', 3);
  if (end === -1) return result;
  const fm = md.slice(3, end).trim();

  let currentKey = null;
  let currentList = null;

  for (const raw of fm.split('\n')) {
    const line = raw.replace(/\r$/, '');
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (trimmed.startsWith('- ')) {
      const item = trimmed.replace(/^-\s+/, '').replace(/^["']|["']$/g, '');
      if (currentKey && currentList) {
        currentList.push(item);
      }
      continue;
    }

    const idx = line.indexOf(':');
    if (idx === -1) continue;
    currentKey = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    val = val.replace(/^["']|["']$/g, '');

    if (val === '') {
      currentList = [];
      result[currentKey] = currentList;
    } else {
      currentList = null;
      const num = Number(val);
      result[currentKey] = Number.isFinite(num) ? num : val;
    }
  }

  return result;
}

function extractSection(body, heading) {
  const regex = new RegExp(`##\\s+${heading}\\s*\\n(.*?)(?=\\n##\\s|$)`, 'is');
  const m = body.match(regex);
  return m ? m[1].trim() : '';
}

function extractListItems(sectionText) {
  if (!sectionText) return [];
  return sectionText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('- ') || l.startsWith('* '))
    .map(l => l.replace(/^[-*]\s+/, '').replace(/^\[.\]\s*/, '').trim())
    .filter(Boolean);
}

function extractTableRows(sectionText) {
  if (!sectionText) return [];
  const lines = sectionText.split('\n').map(l => l.trim()).filter(Boolean);
  return lines.filter(l => l.startsWith('|') && l.includes('|', 1) && !l.includes('|---'));
}

function parseMeetingFile(filePath) {
  const md = readFileSafe(filePath);
  if (!md) return null;
  const { body, frontmatter } = parseFrontmatter(md);
  const name = path.basename(filePath, '.md');

  const summary = extractSection(body, 'Resumen') || '';
  const decisions = extractListItems(extractSection(body, 'Decisiones'));
  const attendees = extractListItems(extractSection(body, 'Asistentes'));

  // Action items: preservar estado del checkbox
  const rawActions = extractListItems(extractSection(body, 'Action Items'));
  const actions = rawActions.map(a => {
    const checked = /^\[x\]/i.test(a);
    const open = /^\[ \]/.test(a);
    const text = a.replace(/^\[[xX ]\]\s*/, '').trim();
    return { text, checked, open };
  });

  let meta = null;
  let tipo = frontmatter.Tipo || '';
  const mTipo = name.match(/(empalme|entrega|planificacion)/i);
  if (mTipo && !tipo) tipo = mTipo[1].toLowerCase();
  const mMeta = name.match(/meta-(\d+)/i);
  if (mMeta) meta = parseInt(mMeta[1], 10);

  let fecha = frontmatter.Fecha || frontmatter['Fecha de cierre'] || '';

  // Fallback: metadatos tipo > Fecha: 2026-06-11  (sin frontmatter YAML)
  if (!fecha) {
    const fechaMatch = md.match(/^>\s*Fecha:\s*(\d{4}-\d{2}-\d{2})/im);
    if (fechaMatch) fecha = fechaMatch[1];
  }
  if (!fecha && name.match(/\d{4}-\d{2}-\d{2}/)) {
    fecha = name.match(/\d{4}-\d{2}-\d{2}/)[0];
  }

  // Tipo desde header tipo > Tipo: empalme
  if (!tipo) {
    const tipoMatch = md.match(/^>\s*Tipo:\s*(\S+)/im);
    if (tipoMatch) tipo = tipoMatch[1].toLowerCase();
  }

  return {
    name,
    path: filePath,
    fecha,
    tipo,
    meta,
    summary,
    decisions,
    actions,
    attendees,
    raw: md
  };
}

function monthFromDate(dateStr) {
  if (!dateStr) return null;
  const m = dateStr.match(/(\d{4})-(\d{2})-\d{2}/);
  return m ? `${m[1]}-${m[2]}` : null;
}

function isInMonth(meeting, targetMonth) {
  const m = monthFromDate(meeting.fecha);
  if (m === targetMonth) return true;
  // Reuniones de cierre del mes anterior o apertura del siguiente que
  // cierran/abren el target month (ej. snippet testing 2026-07-01 para junio).
  if (!meeting.fecha) return false;
  const d = new Date(meeting.fecha);
  if (isNaN(d.getTime())) return false;
  // Incluir si el nombre contiene el target month o si es hasta 3 días fuera
  const [y, mo] = targetMonth.split('-').map(Number);
  const firstDay = new Date(y, mo - 1, 1);
  const lastDay = new Date(y, mo, 0);
  const msPerDay = 86400000;
  const diff = (d - firstDay) / msPerDay;
  const diffEnd = (d - lastDay) / msPerDay;
  return (diff >= -3 && diffEnd <= 3);
}

function parseMetricsFromAudit(md) {
  const metrics = {};
  if (!md) return metrics;

  const pairs = [
    [/Tier\s+(1\s+[-—]\s+Emergente)/i, 'tier'],
    [/Listeners Spotify \/28d\s*\|\s*(\d+)/i, 'listeners_28d'],
    [/Streams \/28d\s*\|\s*(\d+)/i, 'streams_28d'],
    [/Revenue lifetime\s*\|\s*([$\d.,]+\s*[A-Z]{3})/i, 'revenue_lifetime'],
    [/RPS \(Revenue Per Stream\)\s*\|\s*([$\d.,]+)/i, 'rps'],
    [/IG followers\s*\|\s*([\d,()\s]+)/i, 'ig_followers'],
    [/TikTok views \/año\s*\|\s*([\d,]+)/i, 'tiktok_views_anual'],
    [/PODERES cumplidos\s*\|\s*([\d/]+)/i, 'poderes'],
    [/Score musical\s*\|\s*([\d/]+(?:\s*\(\d\.\d\/\d\))?)/i, 'score_musical'],
    [/Score redes\s*\|\s*([\d/]+(?:\s*\(\d\.\d\/\d\))?)/i, 'score_redes']
  ];

  for (const [regex, key] of pairs) {
    const m = md.match(regex);
    if (m && m[1]) metrics[key] = m[1].trim();
  }

  return metrics;
}

function extractBaselineFromContext(md) {
  if (!md) return '';
  // Busca bloque de métricas si existe; sino devuelve primer párrafo.
  const lines = md.split('\n');
  return lines.slice(0, 8).join('\n');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const m = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return dateStr;
  const [_, y, mo, day] = m.map(Number);
  const d = new Date(y, mo - 1, day);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

function slugToName(slug) {
  return slug
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// -------------------------------------------------------------------------
// Compiler
// -------------------------------------------------------------------------
function compileReport(slug, month) {
  const artistPath = path.join(CLIENTS_PATH, slug);
  if (!fs.existsSync(artistPath)) {
    throw new Error(`Artista no encontrado: ${artistPath}`);
  }

  const contextoMd = readFileSafe(path.join(artistPath, 'contexto.md'));
  const auditMusical = readFileSafe(path.join(artistPath, '01-auditorias', 'auditoria-musical.md'));
  const auditRedes = readFileSafe(path.join(artistPath, '01-auditorias', 'auditoria-redes-sociales.md'));
  const sintesis = readFileSafe(path.join(artistPath, '02-sintesis', 'sintesis-growth.md'));
  const brandBook = readFileSafe(path.join(artistPath, 'brand-book', '01-vision-estrategica.md'));
  const direccionArtistica = readFileSafe(path.join(artistPath, 'direccion-artistica', `${month}.md`));

  // Resumen operativo mensual (input de Control, D-099)
  const resumenMd = readFileSafe(path.join(artistPath, 'mgmt', 'monthly', `resumen-${month}.md`));
  const resumen = resumenMd ? parseYamlFrontmatter(resumenMd) : null;

  // Leer reuniones del mes
  const meetingsDir = path.join(artistPath, 'mgmt', 'meetings');
  let meetings = [];
  if (fs.existsSync(meetingsDir)) {
    meetings = fs.readdirSync(meetingsDir)
      .filter(f => f.endsWith('.md'))
      .map(f => parseMeetingFile(path.join(meetingsDir, f)))
      .filter(Boolean)
      .filter(m => isInMonth(m, month))
      .sort((a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0));
  }

  // Métricas
  const musicalMetrics = parseMetricsFromAudit(auditMusical);
  const socialMetrics = parseMetricsFromAudit(auditRedes);

  // Decisiones
  const allDecisions = meetings.flatMap(m => m.decisions.map(d => ({ text: d, meeting: m.name, fecha: m.fecha, tipo: m.tipo, meta: m.meta })));

  // Action items abiertos
  const openActions = meetings.flatMap(m => m.actions
    .filter(a => a.open || (!a.checked && !a.open))
    .map(a => ({ text: a.text, meeting: m.name })));

  // Métricas de operación
  // El compilador prioriza el resumen-YYYY-MM.md (input de Control, D-099).
  // Si no existe, no inventa: muestra "—" para lo que no pueda derivar.
  function fmtRatio(num, total) {
    if (Number.isFinite(num) && Number.isFinite(total) && total > 0) return `${num}/${total}`;
    return '—';
  }

  const objetivos = fmtRatio(resumen?.objetivos_completados, resumen?.objetivos_total);
  const entregables = fmtRatio(resumen?.entregables_completados, resumen?.entregables_total);
  const reuniones = Number.isFinite(resumen?.reuniones_realizadas)
    ? resumen.reuniones_realizadas
    : meetings.length;
  const totalDecisiones = Number.isFinite(resumen?.decisiones_estrategicas)
    ? resumen.decisiones_estrategicas
    : allDecisions.length;
  const misionesCount = Array.isArray(resumen?.misiones)
    ? resumen.misiones.length
    : '—';
  const documentosCount = Array.isArray(resumen?.documentos)
    ? resumen.documentos.length
    : '—';

  // Sección 0 — tesis del mes
  let tesis = '';
  if (sintesis) {
    const m = sintesis.match(/(?:resumen ejecutivo|NSM|Tier).*?\n+([^#\n].{80,400})/is);
    if (m) tesis = m[1].trim().replace(/\s+/g, ' ');
  }
  if (!tesis && meetings.length) {
    const summaries = meetings.map(m => m.summary).filter(Boolean).join(' ');
    tesis = summaries.slice(0, 200).replace(/\s+/g, ' ') + (summaries.length > 200 ? '...' : '');
  }
  if (!tesis) tesis = `Mes de trabajo operativo para ${slugToName(slug)}.`;

  // Sección 2 — entregables agrupados por meta
  const metas = {};
  for (const m of meetings) {
    const key = m.meta || 'general';
    if (!metas[key]) metas[key] = { meetings: [], decisions: [] };
    metas[key].meetings.push(m);
  }

  const artistName = slugToName(slug);

  // Construir informe
  let report = `# Informe de Cierre — ${artistName} | ${month}\n\n`;

  // 0. El mes en una frase
  report += `## El Mes en una Frase\n\n${tesis}\n\n---\n\n`;

  // 1. De dónde venimos
  report += `## 1. De Dónde Venimos — El Baseline\n\n`;
  report += `| Indicador | Valor | Fuente |\n`;
  report += `|-----------|-------|--------|\n`;
  if (musicalMetrics.tier) report += `| Tier G*S | ${musicalMetrics.tier} | Auditoría musical |\n`;
  if (musicalMetrics.listeners_28d) report += `| Listeners Spotify /28d | ${musicalMetrics.listeners_28d} | Auditoría musical |\n`;
  if (musicalMetrics.streams_28d) report += `| Streams /28d | ${musicalMetrics.streams_28d} | Auditoría musical |\n`;
  if (musicalMetrics.revenue_lifetime) report += `| Revenue lifetime | ${musicalMetrics.revenue_lifetime} | Auditoría musical |\n`;
  if (musicalMetrics.rps) report += `| RPS | ${musicalMetrics.rps} | Auditoría musical |\n`;
  if (musicalMetrics.score_musical) report += `| Score musical | ${musicalMetrics.score_musical} | Auditoría musical |\n`;
  if (socialMetrics.score_redes) report += `| Score redes | ${socialMetrics.score_redes} | Auditoría redes |\n`;
  if (socialMetrics.ig_followers) report += `| IG followers | ${socialMetrics.ig_followers} | Auditoría redes |\n`;
  if (socialMetrics.tiktok_views_anual) report += `| TikTok views /año | ${socialMetrics.tiktok_views_anual} | Auditoría redes |\n`;
  if (musicalMetrics.poderes) report += `| PODERES cumplidos | ${musicalMetrics.poderes} | Auditoría musical |\n`;
  report += `\n`;

  if (sintesis) {
    const diag = extractSection(sintesis, 'Resumen ejecutivo tecnico') || extractSection(sintesis, 'Resumen ejecutivo');
    if (diag) {
      report += `**Diagnóstico integrado:** ${diag.split('\n').filter(l => l.trim()).slice(0, 3).join(' ').slice(0, 500)}${diag.length > 500 ? '...' : ''}\n\n`;
    }
  }
  report += `---\n\n`;

  // 2. Qué construimos
  report += `## 2. Qué Construimos — Entregable por Entregable\n\n`;
  if (Object.keys(metas).length === 0) {
    report += `_No se encontraron reuniones con metas numeradas para ${month}._\n\n`;
  } else {
    for (const [key, data] of Object.entries(metas)) {
      const label = key === 'general' ? 'Trabajo general' : `Meta #${key}`;
      report += `### 2.${key === 'general' ? '0' : key} ${label}\n\n`;
      report += `**Reuniones:** ${data.meetings.map(m => `${m.tipo || 'reunión'} (${formatDate(m.fecha)})`).join(', ')}\n\n`;

      const decisions = data.meetings.flatMap(m => m.decisions);
      if (decisions.length) {
        report += `**Decisiones tomadas:**\n`;
        for (const d of decisions) report += `- ${d}\n`;
        report += `\n`;
      }

      const actions = data.meetings.flatMap(m => m.actions);
      if (actions.length) {
        report += `**Action items:**\n`;
        for (const a of actions) {
          const mark = a.checked ? '[x]' : (a.open ? '[ ]' : '[ ]');
          report += `- ${mark} ${a.text}\n`;
        }
        report += `\n`;
      }

      const summaries = data.meetings.map(m => m.summary).filter(Boolean);
      if (summaries.length) {
        report += `**Resumen:** ${summaries.join(' ').slice(0, 400)}${summaries.join(' ').length > 400 ? '...' : ''}\n\n`;
      }
      report += `\n`;
    }
  }

  // 3. Decisiones estratégicas
  report += `## 3. Decisiones Estratégicas del Mes\n\n`;
  if (allDecisions.length === 0) {
    report += `_No se registraron decisiones explícitas en las actas del mes._\n\n`;
  } else {
    report += `| # | Decisión | Contexto | Reunión |\n`;
    report += `|---|----------|----------|---------|\n`;
    allDecisions.forEach((d, i) => {
      const context = d.meta ? `Meta #${d.meta}` : d.tipo || '—';
      const meetingLabel = d.meeting.replace(/\.md$/, '').replace(/-/g, ' ');
      report += `| ${i + 1} | ${d.text.slice(0, 120)}${d.text.length > 120 ? '...' : ''} | ${context} | ${meetingLabel} |\n`;
    });
    report += `\n`;
  }

  // 4. Lo que demostró
  report += `## 4. Lo Que ${artistName} Demostró Este Mes\n\n`;
  if (contextoMd) {
    const cualidades = extractListItems(extractSection(contextoMd, 'Lo que demostró') || extractSection(contextoMd, 'Fortalezas'));
    if (cualidades.length) {
      for (const c of cualidades) report += `- ${c}\n`;
      report += `\n`;
    } else {
      report += `_No se encontró sección de fortalezas/cualidades en contexto.md._\n\n`;
    }
  } else {
    report += `_No hay contexto.md para extraer cualidades._\n\n`;
  }

  // 5. Métricas de operación
  report += `## 5. Métricas de Operación\n\n`;
  report += `| Indicador | Valor |\n`;
  report += `|-----------|-------|\n`;
  report += `| Objetivos completados | ${objetivos} |\n`;
  report += `| Entregables finalizados | ${entregables} |\n`;
  report += `| Reuniones realizadas | ${reuniones} |\n`;
  report += `| Misiones ejecutadas | ${misionesCount} |\n`;
  report += `| Documentos producidos | ${documentosCount} |\n`;
  report += `| Decisiones estratégicas registradas | ${totalDecisiones} |\n`;
  report += `\n`;

  if (Array.isArray(resumen?.misiones) && resumen.misiones.length) {
    report += `**Misiones:** ${resumen.misiones.join(', ')}\n\n`;
  }
  if (Array.isArray(resumen?.documentos) && resumen.documentos.length) {
    report += `**Documentos:** ${resumen.documentos.join(', ')}\n\n`;
  }

  // 6. Antes y después
  report += `## 6. El Antes y El Después\n\n`;
  report += `| Dimensión | Antes | Después |\n`;
  report += `|-----------|-------|---------|\n`;
  report += `| Proyecto | ${contextoMd ? 'Ver contexto.md baseline' : 'Sin contexto'} | Informe compilado desde ${reuniones} reuniones |\n`;
  report += `| Identidad | ${brandBook ? 'Brand Book definido' : 'Sin brand book'} | Era y paleta documentadas |\n`;
  report += `| Diagnóstico | ${auditMusical ? 'Auditoría musical disponible' : 'Pendiente'} | Métricas de inicio registradas |\n`;
  report += `\n`;

  // 7. Pendientes
  report += `## 7. Pendientes para el Próximo Mes\n\n`;
  if (openActions.length === 0) {
    report += `_No hay action items abiertos en las actas del mes._\n\n`;
  } else {
    for (const a of openActions) report += `- [ ] ${a.text} (de ${a.meeting.replace(/\.md$/, '')})\n`;
    report += `\n`;
  }

  report += `---\n\n`;
  report += `*Informe compilado automáticamente desde: contexto.md, auditorías, síntesis growth, brand-book y ${reuniones} actas de reunión de ${month}. Requiere revisión narrativa por Growth Hacker antes de entregar al cliente.*\n\n`;
  report += `*Growth*Stars — Cierre de ${month}*`;

  return { report, meetings, allDecisions, openActions, metrics: { ...musicalMetrics, ...socialMetrics } };
}

// -------------------------------------------------------------------------
// Main
// -------------------------------------------------------------------------
function main() {
  const [slug, month] = process.argv.slice(2);
  if (!slug || !month || !/^\d{4}-\d{2}$/.test(month)) {
    console.error('Uso: node compilador-informe-mensual.js <artist-slug> <YYYY-MM>');
    process.exit(1);
  }

  const { report, meetings } = compileReport(slug, month);

  const outDir = path.join(CLIENTS_PATH, slug, 'mgmt', 'monthly');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `informe-${month}.md`);

  fs.writeFileSync(outPath, report, 'utf-8');
  console.log(`Informe generado: ${outPath}`);
  console.log(`Reuniones incluidas: ${meetings.length}`);
  for (const m of meetings) console.log(`  - ${m.name} (${m.fecha || 'sin fecha'})`);
}

main();
