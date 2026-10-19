# PROMPT: Generador de Informe Mensual (.md) con Kimi

> **Para:** CTO Jr (Claude Code operativo)
> **Scope:** db.js (nueva función) + server.js (endpoint) + index.html (botón)
> **Prioridad:** Alta — primer informe: Reckless Junio 2026

---

## CONCEPTO

Botón "GENERAR INFORME DEL MES" en la vista interna del artista. Compila toda la data del engagement actual (objetivos, entregables, reuniones, misiones, revenue) y llama a Kimi para generar una narrativa ejecutiva. Guarda el resultado como .md en BÓVEDA.

**Output:** `06_CLIENTES/<slug>/mgmt/monthly/informe-<YYYY-MM>.md`

---

## PASO 1: Función `compileMonthData()` en db.js

Recolecta TODA la data del engagement para un artista en un mes dado.

```javascript
async function compileMonthData(artistId, month) {
  // 1. Engagement del mes
  const { data: engagement } = await supabase
    .from('mgmt_engagements')
    .select('*')
    .eq('artist_id', artistId)
    .eq('month', month)
    .maybeSingle();
  
  if (!engagement) {
    // Fallback: mes más reciente
    const { data: latest } = await supabase
      .from('mgmt_engagements')
      .select('*')
      .eq('artist_id', artistId)
      .eq('status', 'active')
      .order('month', { ascending: false })
      .limit(1)
      .single();
    if (!latest) throw new Error('No hay engagement activo para este artista');
    engagement = latest;
  }
  
  // 2. Objetivos con deliverables
  const { data: objectives } = await supabase
    .from('mgmt_objectives')
    .select('*, mgmt_deliverables(*)')
    .eq('engagement_id', engagement.id)
    .order('number');
  
  // 3. Reuniones del mes (legacy + hub)
  const { data: legacyMeetings } = await supabase
    .from('mgmt_meetings')
    .select('*')
    .eq('objective_id', objectives?.map(o => o.id) || [])
    .order('held_at');
  
  const { data: hubMeetings } = await supabase
    .from('mgmt_meetings')
    .select('*')
    .eq('artist_id', artistId)
    .not('agenda', 'is', null)
    .gte('scheduled_at', month + '-01')
    .lt('scheduled_at', nextMonth(month) + '-01')
    .order('scheduled_at');
  
  // Merge y dedup
  const allMeetingIds = new Set();
  const meetings = [];
  for (const m of [...(legacyMeetings || []), ...(hubMeetings || [])]) {
    if (!allMeetingIds.has(m.id)) {
      allMeetingIds.add(m.id);
      meetings.push(m);
    }
  }
  
  // 4. Misiones (secondary_tasks)
  const { data: tasks } = await supabase
    .from('secondary_tasks')
    .select('*')
    .eq('client_id', engagement.client_id)
    .order('created_at');
  
  // 5. Artist info
  const { data: artist } = await supabase
    .from('artists')
    .select('display_name, slug, genre, country')
    .eq('id', artistId)
    .single();
  
  return {
    artist,
    engagement,
    month: engagement.month,
    objectives: objectives || [],
    meetings,
    tasks: tasks || []
  };
}

function nextMonth(month) {
  const [y, m] = month.split('-').map(Number);
  if (m === 12) return `${y + 1}-01`;
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}
```

---

## PASO 2: Función `generateMonthlyReport()` en db.js

Recibe la data compilada y llama a Kimi para generar la narrativa.

```javascript
async function generateMonthlyReport(artistId, month) {
  const data = await compileMonthData(artistId, month);
  
  // Preparar resumen estructurado para Kimi
  const objectivesSummary = data.objectives.map(o => {
    const dels = o.mgmt_deliverables || [];
    const done = dels.filter(d => d.status === 'done');
    const pending = dels.filter(d => d.status !== 'done');
    return {
      number: o.number,
      title: o.title,
      status: o.status,
      deliverables_done: done.map(d => d.title),
      deliverables_pending: pending.map(d => d.title),
      progress: dels.length > 0 ? Math.round((done.length / dels.length) * 100) : 0
    };
  });
  
  const meetingsSummary = data.meetings.map(m => ({
    title: m.title || m.summary || `Reunión ${m.type || m.meeting_type}`,
    date: m.held_at || m.scheduled_at,
    type: m.meeting_type || m.type,
    decisions: (m.post_notes || []).flatMap(n => n.decisions || []),
    action_items: (m.post_notes || []).flatMap(n => (n.action_items || []).map(a => a.task || a)),
    topics: (m.agenda || []).map(a => a.topic || a),
    key_quotes: (m.post_notes || []).flatMap(n => n.key_quotes || [])
  }));
  
  const tasksDone = data.tasks.filter(t => t.status === 'hecha');
  const tasksPending = data.tasks.filter(t => t.status === 'pendiente');
  
  const totalDels = data.objectives.reduce((sum, o) => sum + (o.mgmt_deliverables || []).length, 0);
  const doneDels = data.objectives.reduce((sum, o) => sum + (o.mgmt_deliverables || []).filter(d => d.status === 'done').length, 0);
  
  const context = JSON.stringify({
    artist: data.artist.display_name,
    month: data.month,
    invoice: `${data.engagement.invoice_amount} ${data.engagement.invoice_currency}`,
    objectives: objectivesSummary,
    meetings: meetingsSummary,
    tasks_done: tasksDone.map(t => t.descripcion),
    tasks_pending: tasksPending.map(t => ({ task: t.descripcion, responsible: t.assigned_to })),
    totals: {
      objectives: data.objectives.length,
      deliverables: `${doneDels}/${totalDels}`,
      meetings: data.meetings.length,
      tasks_done: tasksDone.length,
      tasks_pending: tasksPending.length
    }
  }, null, 2);
  
  // Truncar si es muy largo
  const MAX_INPUT = 12000;
  let trimmedContext = context;
  if (context.length > MAX_INPUT) {
    trimmedContext = context.slice(0, MAX_INPUT * 0.7) + '\n...[truncado]...\n' + context.slice(-MAX_INPUT * 0.3);
  }
  
  const systemPrompt = `Eres un Growth Manager de una agencia de marketing musical (Growth*Stars). 
Generás informes mensuales de entrega para artistas/clientes.

El informe debe ser PROFESIONAL pero CÁLIDO — es para el artista, no para un board corporativo.

Formato del informe en Markdown:

# Informe de Gestión — [Artista] | [Mes Año]

## Resumen Ejecutivo
(3-4 párrafos narrativos: qué se logró este mes, highlights, tono positivo pero honesto. Si hay pendientes, mencionarlos como "en progreso" no como fallas.)

## Objetivos del Mes
(Para cada objetivo: título, barra de progreso visual con emojis ⬛⬜, % completado, lista de entregables con ✅/⏳)

## Reuniones Realizadas
(Timeline de reuniones con fecha, temas clave, decisiones importantes. Si hay citas textuales del artista, incluirlas.)

## Decisiones Clave del Mes
(Lista consolidada de TODAS las decisiones tomadas en reuniones — esto es valioso para el artista.)

## Misiones Completadas
(Lista de tareas completadas con quién las ejecutó)

## Pendientes para el Próximo Mes
(Qué queda por hacer — entregables pendientes, tareas abiertas, objetivos no completados)

## Métricas del Mes
(Tabla resumen: # objetivos, entregables completados/total, reuniones, misiones)

---
*Informe generado por Growth*Stars — [fecha]*

REGLAS:
- Escribir en español
- Tono profesional pero cercano — como un par que le rinde cuentas a su artista
- NO inventar datos que no estén en el contexto
- Si un objetivo tiene 100% de progreso, celebrarlo brevemente
- Las barras de progreso usan: ⬛ (completado) y ⬜ (pendiente), 10 bloques = 100%
- Fechas en formato "21 de junio" no "2026-06-21"
- Output SOLO el markdown, sin explicación`;

  const result = await callMoonshot([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Generá el informe mensual con estos datos:\n\n${trimmedContext}` }
  ], { temperature: 1, max_tokens: 16000 });
  
  const reportContent = (result.content || '').trim();
  
  // Guardar en BÓVEDA
  const fs = require('fs');
  const path = require('path');
  const BOVEDA_PATH = path.resolve(__dirname, '..');
  const slug = data.artist.slug;
  const monthlyDir = path.join(BOVEDA_PATH, '06_CLIENTES', slug, 'mgmt', 'monthly');
  
  fs.mkdirSync(monthlyDir, { recursive: true });
  
  const filename = `informe-${data.month}.md`;
  const filePath = path.join(monthlyDir, filename);
  fs.writeFileSync(filePath, reportContent, 'utf-8');
  
  const relativePath = `06_CLIENTES/${slug}/mgmt/monthly/${filename}`;
  
  return {
    report: reportContent,
    file_path: relativePath,
    full_path: filePath,
    month: data.month,
    artist: data.artist.display_name,
    totals: {
      objectives: data.objectives.length,
      deliverables: `${doneDels}/${totalDels}`,
      meetings: data.meetings.length,
      tasks_done: tasksDone.length,
      tasks_pending: tasksPending.length
    }
  };
}
```

---

## PASO 3: Endpoint en server.js

```javascript
// POST /api/artist/:artistId/monthly-report
// Body: { month: "2026-06" } (opcional — si no se envía, usa el mes activo)

const reportMatch = pathname.match(/^\/api\/artist\/([^\/]+)\/monthly-report$/);
if (reportMatch && req.method === 'POST') {
  const artistId = reportMatch[1];
  const body = await parseBody(req);
  const month = body.month || null; // null = mes activo
  
  try {
    const result = await db.generateMonthlyReport(artistId, month);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Monthly report error:', err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
  return;
}
```

---

## PASO 4: Botón en index.html — Vista interna del artista

Agregar un botón "GENERAR INFORME DEL MES" en la vista interna del artista, cerca de la sección de objetivos o al final.

```javascript
// En la vista interna del artista, agregar botón:
function renderMonthlyReportButton(artistId, artistName) {
  return `
    <button onclick="generateMonthlyReport('${artistId}', '${artistName}')" 
      style="padding: 10px 20px; background: var(--neon-violet); color: #fff; 
             border: none; border-radius: 8px; cursor: pointer; font-weight: bold;
             margin: 16px 0;">
      📊 GENERAR INFORME DEL MES
    </button>
  `;
}

async function generateMonthlyReport(artistId, artistName) {
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'GENERANDO INFORME...';
  
  try {
    const res = await fetch(`/api/artist/${artistId}/monthly-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // mes activo por defecto
    });
    const result = await res.json();
    
    if (result.error) {
      showToast('Error: ' + result.error);
      btn.disabled = false;
      btn.textContent = '📊 GENERAR INFORME DEL MES';
      return;
    }
    
    // Mostrar preview del informe en un modal
    showReportPreview(result);
    
    showToast(`Informe guardado en ${result.file_path}`);
    btn.disabled = false;
    btn.textContent = '📊 GENERAR INFORME DEL MES';
  } catch (err) {
    showToast('Error: ' + err.message);
    btn.disabled = false;
    btn.textContent = '📊 GENERAR INFORME DEL MES';
  }
}

function showReportPreview(result) {
  // Mostrar el markdown renderizado en un modal grande
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay show';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:9999;display:flex;justify-content:center;align-items:center;';
  
  const modal = document.createElement('div');
  modal.style.cssText = 'background:var(--gs-surf-1);border:1px solid var(--gs-bd-07);border-radius:12px;padding:24px;max-width:800px;width:90%;max-height:85vh;overflow-y:auto;color:var(--gs-text-1);';
  
  // Header con métricas
  let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">`;
  html += `<h2 style="margin:0;">Informe ${result.artist} — ${result.month}</h2>`;
  html += `<button onclick="this.closest('.modal-overlay').remove()" style="background:none;border:none;color:var(--gs-text-3);font-size:1.5em;cursor:pointer;">×</button>`;
  html += `</div>`;
  
  // Métricas rápidas
  html += `<div style="display:flex;gap:12px;margin-bottom:16px;">`;
  html += `<span style="background:var(--gs-surf-2);padding:4px 10px;border-radius:6px;font-size:0.8em;">Objetivos: ${result.totals.objectives}</span>`;
  html += `<span style="background:var(--gs-surf-2);padding:4px 10px;border-radius:6px;font-size:0.8em;">Entregables: ${result.totals.deliverables}</span>`;
  html += `<span style="background:var(--gs-surf-2);padding:4px 10px;border-radius:6px;font-size:0.8em;">Reuniones: ${result.totals.meetings}</span>`;
  html += `<span style="background:var(--gs-surf-2);padding:4px 10px;border-radius:6px;font-size:0.8em;">Misiones: ✅${result.totals.tasks_done} ⏳${result.totals.tasks_pending}</span>`;
  html += `</div>`;
  
  // Ruta del archivo
  html += `<p style="color:var(--gs-text-3);font-size:0.8em;margin-bottom:16px;">📁 ${result.file_path}</p>`;
  
  // Contenido del informe (markdown como texto formateado básico)
  // Convertir markdown básico a HTML
  let reportHtml = result.report
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 style="border-bottom:1px solid var(--gs-bd-07);padding-bottom:8px;margin-top:24px;">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
  
  html += `<div style="line-height:1.6;">${reportHtml}</div>`;
  
  modal.innerHTML = html;
  overlay.appendChild(modal);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}
```

---

## PASO 5: Exportar funciones en db.js

```javascript
// En module.exports agregar:
compileMonthData,
generateMonthlyReport,
```

---

## VERIFICACIÓN

- [ ] Botón "GENERAR INFORME DEL MES" visible en vista interna del artista
- [ ] Click → "GENERANDO INFORME..." → Kimi procesa → modal con preview
- [ ] Preview muestra: resumen ejecutivo, objetivos con progreso, reuniones, decisiones, misiones, pendientes
- [ ] Archivo .md guardado en `06_CLIENTES/reckless/mgmt/monthly/informe-2026-06.md`
- [ ] El informe NO inventa datos — solo usa lo que hay en Supabase
- [ ] Si no hay engagement activo → error descriptivo
- [ ] Barras de progreso ⬛⬜ correctas por objetivo
- [ ] Decisiones consolidadas de TODAS las reuniones del mes
- [ ] Tono profesional pero cercano, en español
