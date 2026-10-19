// =====================================================================
// G*S Auditor Algorítmico — cadena de auditoría con visión Kimi K2.5
// Flujo: screenshots por plataforma → análisis visión (1 call/plataforma)
//        → síntesis integrada (1 call) → informe HTML → recurso del artista
// Runs en memoria (single-user local); auditoría trail en agent_invocations.
// =====================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../db');
const { renderAuditReport } = require('./auditReportTemplate');

const AGENT_SLUG = 'gs-auditor-algoritmico';
const MAX_IMAGES_PER_PLATFORM = 10;

const PLATFORMS = [
  { key: 'tiktok', label: 'TikTok' },
  { key: 'instagram', label: 'Instagram / Meta' },
  { key: 'youtube', label: 'YouTube' },
  { key: 's4a', label: 'Spotify for Artists' },
  { key: 'distro', label: 'Distribuidora' }
];

const PLATFORM_PROMPTS = {
  tiktok: 'Screenshots de TikTok Studio/Analytics. Extrae: followers, views del período, like rate, comment-to-view, share-to-view, % For You, profile visits, conversión visita→follow, completion rate, top videos con sus métricas, y performance de sonidos/UGC si aparece.',
  instagram: 'Screenshots de Instagram Insights / Meta Business Suite. Extrae: seguidores, alcance del período, % alcance no-seguidores, engagement (likes/comentarios/shares/saves), performance por formato (Reels vs Feed vs Stories), visitas al perfil, clics al link en bio, y crecimiento de seguidores.',
  youtube: 'Screenshots de YouTube Studio. Extrae: suscriptores, views del período, CTR de impresiones, duración media de vista / retención, fuentes de tráfico, performance de Shorts vs videos largos, y videos top con sus métricas.',
  s4a: 'Screenshots de Spotify for Artists. Extrae: oyentes mensuales, streams, saves y save rate, skip rate, source of streams (editorial/algorítmico/perfil/playlists de usuarios), listener segments (active/previously active/programmed), playlists relevantes, ciudades/países top, y datos demográficos.',
  distro: 'Screenshots de la distribuidora (DistroKid, ONErpm, TuneCore, Believe, Symphonic u otra). Extrae: ingresos del período y lifetime, streams por DSP, RPS (revenue per stream) si es calculable, diversificación por plataforma (% Spotify vs Apple vs otros), y tendencia mensual de ingresos.'
};

// runId → run state (in-memory; el dashboard es single-user local)
const runs = new Map();

function getRun(runId) {
  return runs.get(runId) || null;
}

function publicRun(run) {
  if (!run) return null;
  return {
    run_id: run.id,
    status: run.status,
    client_slug: run.clientSlug,
    artist_slug: run.artistSlug,
    steps: run.steps.map(s => ({ key: s.key, label: s.label, status: s.status, note: s.note || null })),
    report_url: run.reportUrl || null,
    error: run.error || null,
    started_at: run.startedAt,
    finished_at: run.finishedAt || null
  };
}

function setStep(run, key, status, note) {
  const step = run.steps.find(s => s.key === key);
  if (step) {
    step.status = status;
    if (note !== undefined) step.note = note;
  }
}

// Kimi (thinking model) devuelve a veces prosa alrededor del JSON:
// extracción defensiva entre el primer { y el último } + un retry aguas arriba.
function extractJson(text) {
  if (!text) throw new Error('Respuesta vacía de Kimi');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('Sin JSON en la respuesta');
  return JSON.parse(text.slice(start, end + 1));
}

async function callKimiJson(messages, maxTokens) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await db.callMoonshot(messages, { temperature: 1, max_tokens: maxTokens || 16000 });
    try {
      return { json: extractJson(result.content), usage: result.usage };
    } catch (err) {
      lastErr = err;
      messages = messages.concat([
        { role: 'assistant', content: result.content ? result.content.slice(0, 2000) : '' },
        { role: 'user', content: 'Tu respuesta anterior no era JSON válido. Responde ÚNICAMENTE el objeto JSON, sin backticks ni texto adicional.' }
      ]);
    }
  }
  throw new Error(`Kimi no devolvió JSON válido: ${lastErr.message}`);
}

function imagesToContent(text, images) {
  const content = [{ type: 'text', text }];
  for (const img of images.slice(0, MAX_IMAGES_PER_PLATFORM)) {
    content.push({
      type: 'image_url',
      image_url: { url: `data:${img.mime || 'image/png'};base64,${img.data.toString('base64')}` }
    });
  }
  return content;
}

async function analyzePlatform(run, platform, images, agentPrompt) {
  const userText = `${PLATFORM_PROMPTS[platform.key]}

Analiza los ${images.length} screenshots adjuntos de ${platform.label} del artista "${run.artistName}".

Responde ÚNICAMENTE este JSON (sin backticks):
{
  "plataforma": "${platform.label}",
  "resumen": "diagnóstico de la plataforma en 2-3 frases",
  "metricas": [{ "nombre": "...", "valor": "...", "benchmark": "...", "estado": "verde|amarillo|rojo|nd" }],
  "hallazgos": ["hallazgo con el dato que lo sustenta", "..."],
  "triggers": [{ "codigo": "UAU-xx|UCT-xx|MOC-xx|IE-xx", "nombre": "...", "nota": "..." }],
  "datos_no_disponibles": ["métrica que no aparece en los screenshots", "..."]
}`;

  const messages = [
    { role: 'system', content: agentPrompt },
    { role: 'user', content: imagesToContent(userText, images) }
  ];

  const { json, usage } = await callKimiJson(messages, 16000);
  await db.logAgentInvocation({
    clientSlug: run.clientSlug, artistSlug: run.artistSlug, agentSlug: AGENT_SLUG,
    taskSummary: `Auditoría algorítmica — análisis ${platform.label} (${images.length} screenshots)`,
    tokensInput: usage?.prompt_tokens || 0, tokensOutput: usage?.completion_tokens || 0,
    status: 'success', outputPath: null
  });
  return json;
}

async function synthesize(run, platformResults, agentPrompt, context) {
  const userText = `Síntesis de auditoría algorítmica para "${run.artistName}" (fecha: ${run.dateStr}).

ANÁLISIS POR PLATAFORMA (extraídos de screenshots reales):
${JSON.stringify(platformResults, null, 2)}

Plataformas sin screenshots (decláralas como sin datos, no inventes): ${run.skippedPlatforms.join(', ') || 'ninguna'}

Responde ÚNICAMENTE este JSON (sin backticks):
{
  "artista": "${run.artistName}",
  "fecha": "${run.dateStr}",
  "tier": { "nivel": "1-4", "nombre": "Emergente|Mid-Level|Establecido|Consolidado", "justificacion": "...", "asimetria": "si es caso híbrido influencer/músico, descríbela; si no, null" },
  "kpis_hero": [{ "valor": "número corto", "label": "métrica" }],
  "resumen_ejecutivo": ["hallazgo integrado 1", "... (5 hallazgos)"],
  "nsm": { "metrica": "...", "baseline": "...", "meta_30": "...", "meta_60": "...", "meta_90": "...", "justificacion": "..." },
  "funnel": [{ "etapa": "Descubrimiento|Comunidad|Conversión|Streaming", "estado": "verde|amarillo|rojo", "diagnostico": "..." }],
  "triggers": [{ "codigo": "...", "nombre": "...", "prioridad": "CRÍTICA|ALTA|MEDIA", "baseline": "...", "meta": "...", "palanca": "..." }],
  "roadmap": [{ "mes": "Mes 1 — Foundation", "foco": "...", "acciones": ["..."] }],
  "riesgos": [{ "riesgo": "...", "probabilidad": "Alta|Media|Baja", "impacto": "Alto|Medio|Bajo", "mitigacion": "..." }],
  "conclusion": "cierre ejecutivo en 2-3 frases"
}
Incluye exactamente 4 kpis_hero, 5 resumen_ejecutivo, 5-7 triggers, 3 meses de roadmap y 4-6 riesgos.`;

  const messages = [
    { role: 'system', content: `${agentPrompt}\n\n---\n\nCONTEXTO DEL CLIENTE Y ARTISTA:\n\n${context.slice(0, 12000)}` },
    { role: 'user', content: userText }
  ];

  const { json, usage } = await callKimiJson(messages, 16000);
  await db.logAgentInvocation({
    clientSlug: run.clientSlug, artistSlug: run.artistSlug, agentSlug: AGENT_SLUG,
    taskSummary: 'Auditoría algorítmica — síntesis integrada',
    tokensInput: usage?.prompt_tokens || 0, tokensOutput: usage?.completion_tokens || 0,
    status: 'success', outputPath: null
  });
  return json;
}

function saveReportAndScreenshots(run, report, screenshots, platformResults) {
  const baseParts = run.artistSlug
    ? ['06_CLIENTES', run.clientSlug, 'artistas', run.artistSlug, '01-auditorias', `auditoria-algoritmica-${run.dateStr}`]
    : ['06_CLIENTES', run.clientSlug, '01-auditorias', `auditoria-algoritmica-${run.dateStr}`];

  const reportDir = path.join(db.BOVEDA_PATH, ...baseParts);
  fs.mkdirSync(reportDir, { recursive: true });

  // screenshots por plataforma (respaldo del input, patrón vault existente)
  for (const [platformKey, images] of Object.entries(screenshots)) {
    if (!images.length) continue;
    const dir = path.join(reportDir, 'screenshots', platformKey.toUpperCase());
    fs.mkdirSync(dir, { recursive: true });
    images.forEach((img, i) => {
      const ext = (img.filename && path.extname(img.filename)) || '.png';
      fs.writeFileSync(path.join(dir, `${platformKey}-${i + 1}${ext}`), img.data);
    });
  }

  // datos crudos por plataforma (para consumo downstream / gs-sintesis-growth)
  fs.writeFileSync(path.join(reportDir, 'datos-plataformas.json'), JSON.stringify(platformResults, null, 2), 'utf-8');

  const html = renderAuditReport(report, { platformResults });
  fs.writeFileSync(path.join(reportDir, 'index.html'), html, 'utf-8');

  // URL relativa servida por el dashboard en /reports/*
  const relative = baseParts.slice(1).join('/');
  return { reportDir, reportUrl: `/reports/${relative}/index.html` };
}

async function attachAsArtistResource(run) {
  // el recurso cuelga del artista: slug del artista o, si no vino, el del cliente
  const artistSlug = run.artistSlug || run.clientSlug;
  const { data: artist } = await db.supabase.from('artists').select('id').eq('slug', artistSlug).maybeSingle();
  if (!artist) {
    return { attached: false, reason: `No existe artists.slug='${artistSlug}' — informe generado pero sin recurso` };
  }
  await db.createArtistLink(artist.id, {
    label: `Auditoría Algorítmica — ${run.dateStr}`,
    url: run.reportUrl,
    attachment_type: 'link',
    category: 'auditoria'
  });
  return { attached: true };
}

async function executeChain(run, screenshots) {
  try {
    const agentPrompt = db.getAgentPrompt(AGENT_SLUG);
    const context = db.buildAgentContext(run.clientSlug, run.artistSlug);

    const platformResults = [];
    for (const platform of PLATFORMS) {
      const images = screenshots[platform.key] || [];
      if (!images.length) {
        setStep(run, platform.key, 'skipped', 'Sin screenshots');
        run.skippedPlatforms.push(platform.label);
        continue;
      }
      setStep(run, platform.key, 'running');
      try {
        const result = await analyzePlatform(run, platform, images, agentPrompt);
        platformResults.push(result);
        setStep(run, platform.key, 'done', `${result.metricas?.length || 0} métricas extraídas`);
      } catch (err) {
        // una plataforma caída no tumba la auditoría: se declara sin datos
        setStep(run, platform.key, 'failed', err.message.slice(0, 140));
        run.skippedPlatforms.push(`${platform.label} (falló análisis)`);
      }
    }

    if (platformResults.length === 0) {
      throw new Error('Ningún análisis de plataforma completó — revisa los screenshots o la conexión con Kimi');
    }

    setStep(run, 'sintesis', 'running');
    const report = await synthesize(run, platformResults, agentPrompt, context);
    setStep(run, 'sintesis', 'done');

    setStep(run, 'informe', 'running');
    const { reportUrl } = saveReportAndScreenshots(run, report, screenshots, platformResults);
    run.reportUrl = reportUrl;
    setStep(run, 'informe', 'done');

    setStep(run, 'recurso', 'running');
    const resource = await attachAsArtistResource(run);
    setStep(run, 'recurso', resource.attached ? 'done' : 'failed', resource.attached ? 'Recurso creado en ficha del artista' : resource.reason);

    run.status = 'done';
    run.finishedAt = new Date().toISOString();
  } catch (err) {
    console.error('Audit chain error:', err);
    run.status = 'failed';
    run.error = err.message;
    run.finishedAt = new Date().toISOString();
    await db.logAgentInvocation({
      clientSlug: run.clientSlug, artistSlug: run.artistSlug, agentSlug: AGENT_SLUG,
      taskSummary: `Auditoría algorítmica — FALLÓ: ${err.message.slice(0, 150)}`,
      tokensInput: 0, tokensOutput: 0, status: 'failed', outputPath: null
    });
  }
}

function startAuditRun({ clientSlug, artistSlug, artistName, screenshots }) {
  const runId = 'aud_' + crypto.randomBytes(6).toString('hex');
  const dateStr = new Date().toISOString().split('T')[0];

  const run = {
    id: runId,
    status: 'running',
    clientSlug,
    artistSlug: artistSlug || null,
    artistName: artistName || artistSlug || clientSlug,
    dateStr,
    skippedPlatforms: [],
    reportUrl: null,
    error: null,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    steps: [
      ...PLATFORMS.map(p => ({ key: p.key, label: `Análisis ${p.label}`, status: 'pending' })),
      { key: 'sintesis', label: 'Síntesis integrada', status: 'pending' },
      { key: 'informe', label: 'Generación del informe', status: 'pending' },
      { key: 'recurso', label: 'Recurso del artista', status: 'pending' }
    ]
  };

  runs.set(runId, run);
  // fire-and-forget (mismo patrón que press batches)
  executeChain(run, screenshots);
  return publicRun(run);
}

module.exports = { startAuditRun, getRun, publicRun };
