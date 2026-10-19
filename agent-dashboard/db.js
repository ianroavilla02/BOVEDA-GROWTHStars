// =====================================================================
// G*S Dashboard - Supabase Client
// =====================================================================

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials in .env');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? 'OK' : 'MISSING');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// =====================================================================
// Queries
// =====================================================================

async function testConnection() {
  const { data, error, count } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return { connected: true, agents_count: count };
}

async function getAllAgentsFromDB() {
  const { data, error } = await supabase
    .from('agents')
    .select('slug, name, panel, group_name, subgroup, workspace, role, pipeline_order, status')
    .order('pipeline_order', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data;
}

async function getAllClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

async function getAllProjects() {
  const { data, error } = await supabase
    .from('v_active_projects')
    .select('*');

  if (error) throw error;
  return data;
}

async function getProjectByClientSlug(clientSlug, nameLike = 'tent%') {
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id')
    .eq('slug', clientSlug)
    .single();

  if (clientError) throw clientError;

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, phase, release_date, metadata')
    .eq('client_id', client.id)
    .ilike('name', nameLike)
    .maybeSingle();

  if (projectError) throw projectError;
  return project || null;
}

async function getMetricsOverview() {
  const [agents, clients, projects, runs] = await Promise.all([
    supabase.from('agents').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('runs').select('*', { count: 'exact', head: true })
  ]);

  return {
    agents: agents.count,
    clients: clients.count,
    projects: projects.count,
    runs: runs.count
  };
}

// =====================================================================
// MGMT Queries
// =====================================================================

async function getMgmtOverview() {
  const { data, error } = await supabase
    .from('v_mgmt_current_month')
    .select('*')
    .order('client_name', { ascending: true });

  if (error) throw error;
  return data;
}

async function getMgmtEngagements() {
  const { data, error } = await supabase
    .from('v_mgmt_overview')
    .select('*');

  if (error) throw error;
  return data;
}

async function getMgmtClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .filter('metadata->>service', 'eq', 'mgmt')
    .order('display_name', { ascending: true });

  if (error) throw error;
  return data;
}

async function getMgmtClientDetail(clientSlug) {
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('slug', clientSlug)
    .single();

  if (clientError) throw clientError;

  const { data: engagement, error: engError } = await supabase
    .from('mgmt_engagements')
    .select('*')
    .eq('client_id', client.id)
    .eq('month', new Date().toISOString().substring(0, 7))
    .single();

  if (engError && engError.code !== 'PGRST116') throw engError;

  if (!engagement) {
    return { client, engagement: null, objectives: [] };
  }

  const { data: objectives, error: objError } = await supabase
    .from('mgmt_objectives')
    .select(`
      *,
      mgmt_deliverables (*),
      mgmt_meetings (*)
    `)
    .eq('engagement_id', engagement.id)
    .order('number', { ascending: true });

  if (objError) throw objError;

  return { client, engagement, objectives };
}

// =====================================================================
// MGMT Storage (deliverable file uploads)
// =====================================================================

const STORAGE_BUCKET = 'mgmt-deliverables';

async function uploadDeliverableFile(deliverableId, fileName, fileBuffer, mimeType) {
  const { data: deliverable, error: delError } = await supabase
    .from('mgmt_deliverables')
    .select(`
      id,
      title,
      mgmt_objectives (
        id,
        number,
        mgmt_engagements (
          id,
          month,
          client_id,
          clients ( slug )
        )
      )
    `)
    .eq('id', deliverableId)
    .single();

  if (delError) throw delError;

  const clientSlug = deliverable.mgmt_objectives?.mgmt_engagements?.clients?.slug;
  const month = deliverable.mgmt_objectives?.mgmt_engagements?.month;
  const objNumber = deliverable.mgmt_objectives?.number;

  if (!clientSlug || !month || !objNumber) {
    throw new Error('Deliverable missing parent context (client/month/objective)');
  }

  const safeFileName = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '_')
    .replace(/_+/g, '_');

  const storagePath = `${clientSlug}/${month}/objective-${objNumber}/${deliverableId}-${safeFileName}`;

  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: true
    });

  if (uploadError) throw uploadError;

  const { data: urlData, error: urlError } = await supabase
    .storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

  if (urlError) throw urlError;

  const ext = fileName.split('.').pop().toLowerCase();
  const attachmentType = ext === 'md' ? 'md' : 'pdf';

  const { data: updated, error: updateError } = await supabase
    .from('mgmt_deliverables')
    .update({
      file_path: storagePath,
      attachment_type: attachmentType,
      status: 'done',
      completed_at: new Date().toISOString()
    })
    .eq('id', deliverableId)
    .select()
    .single();

  if (updateError) throw updateError;

  return {
    deliverable: updated,
    storage_path: storagePath,
    signed_url: urlData.signedUrl
  };
}

// =====================================================================
// CLIENT ONBOARDING + CONTEXT 360°
// =====================================================================

const fs = require('fs');
const pathModule = require('path');

const BOVEDA_PATH = process.env.BOVEDA_PATH || 'C:\\Users\\Ian Villaveces\\Documents\\BOVEDA - GROWTHStars';
const TEMPLATES_PATH = pathModule.join(__dirname, 'scripts', 'templates');

function renderTemplate(templateContent, variables) {
  let result = templateContent;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
}

function validateSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return { valid: false, error: 'Slug is required' };
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { valid: false, error: 'Slug must contain only lowercase letters, numbers, and hyphens' };
  }
  if (slug.length < 2 || slug.length > 50) {
    return { valid: false, error: 'Slug must be between 2 and 50 characters' };
  }
  return { valid: true };
}

function createClientFilesystem(slug, data) {
  const clientPath = pathModule.join(BOVEDA_PATH, '06_CLIENTES', slug);

  if (fs.existsSync(clientPath) && !data.force) {
    throw new Error(`Directory already exists: ${clientPath}. Use force=true to override.`);
  }

  fs.mkdirSync(clientPath, { recursive: true });

  fs.mkdirSync(pathModule.join(clientPath, 'assets'), { recursive: true });
  fs.mkdirSync(pathModule.join(clientPath, 'assets', 'audio'), { recursive: true });
  fs.mkdirSync(pathModule.join(clientPath, 'assets', 'visual'), { recursive: true });
  fs.mkdirSync(pathModule.join(clientPath, 'assets', 'docs'), { recursive: true });

  const products = data.products || [];
  if (products.includes('gs')) {
    fs.mkdirSync(pathModule.join(clientPath, 'gs'), { recursive: true });
    fs.mkdirSync(pathModule.join(clientPath, 'gs', 'briefs'), { recursive: true });
    fs.mkdirSync(pathModule.join(clientPath, 'gs', 'deliverables'), { recursive: true });
    fs.mkdirSync(pathModule.join(clientPath, 'gs', 'reportes'), { recursive: true });
  }
  if (products.includes('mgmt')) {
    fs.mkdirSync(pathModule.join(clientPath, 'mgmt'), { recursive: true });
    fs.mkdirSync(pathModule.join(clientPath, 'mgmt', 'meetings'), { recursive: true });
    fs.mkdirSync(pathModule.join(clientPath, 'mgmt', 'monthly'), { recursive: true });
    fs.mkdirSync(pathModule.join(clientPath, 'mgmt', 'deliverables'), { recursive: true });
  }

  const variables = {
    NAME: data.display_name,
    SLUG: slug,
    DATE: new Date().toISOString().split('T')[0],
    TIER: String(data.tier || 1),
    GENRE: data.genre || 'sin especificar',
    COUNTRY: data.country || 'CO',
    CITY: data.city || 'sin especificar',
    CITY_LINE: data.city ? `(${data.city})` : '',
    PRODUCT: products.length > 0 ? products.join(' + ').toUpperCase() : 'pendiente',
    UUID: data.uuid || 'pendiente',
    STRUCTURE_TREE: buildStructureTree(products),
    NEXT_STEP_PRODUCT: products.includes('gs')
      ? 'Crear briefing del lanzamiento G*S'
      : products.includes('mgmt')
      ? 'Programar primer engagement mensual MGMT'
      : 'Definir producto contratado'
  };

  const contextoTemplate = fs.readFileSync(pathModule.join(TEMPLATES_PATH, 'contexto.md'), 'utf-8');
  fs.writeFileSync(pathModule.join(clientPath, 'contexto.md'), renderTemplate(contextoTemplate, variables));

  const notesTemplate = fs.readFileSync(pathModule.join(TEMPLATES_PATH, 'notes.md'), 'utf-8');
  fs.writeFileSync(pathModule.join(clientPath, 'notes.md'), renderTemplate(notesTemplate, variables));

  const readmeTemplate = fs.readFileSync(pathModule.join(TEMPLATES_PATH, 'README.md'), 'utf-8');
  fs.writeFileSync(pathModule.join(clientPath, 'README.md'), renderTemplate(readmeTemplate, variables));

  return clientPath;
}

function buildStructureTree(products) {
  const lines = ['├── assets/             <- Audio, visual, docs'];
  if (products.includes('gs')) {
    lines.push('├── gs/                 <- Proyectos G*S (briefs, deliverables, reportes)');
  }
  if (products.includes('mgmt')) {
    lines.push('├── mgmt/               <- Engagements MGMT (meetings, monthly, deliverables)');
  }
  return lines.join('\n');
}

async function onboardClient(data) {
  const slugValidation = validateSlug(data.slug);
  if (!slugValidation.valid) throw new Error(slugValidation.error);
  if (!data.display_name) throw new Error('display_name is required');
  if (!data.products || data.products.length === 0) throw new Error('At least one product (gs or mgmt) is required');

  const validProducts = ['gs', 'mgmt'];
  for (const p of data.products) {
    if (!validProducts.includes(p)) throw new Error(`Invalid product: ${p}`);
  }

  const { data: existing, error: checkError } = await supabase
    .from('clients')
    .select('id, slug')
    .eq('slug', data.slug)
    .maybeSingle();

  if (checkError) throw checkError;
  if (existing && !data.force) throw new Error(`Client '${data.slug}' already exists (UUID: ${existing.id}). Use force=true.`);

  const metadata = {
    products: data.products,
    onboard_date: new Date().toISOString().split('T')[0],
    onboard_method: data.onboard_method || 'dashboard',
    ...(data.city && { city: data.city }),
    ...(data.label && { label: data.label }),
    ...(data.manager && { manager: data.manager }),
    ...(data.contact && { contact: data.contact }),
    ...(data.cc && { cc: data.cc })
  };

  if (data.products.length === 1) {
    metadata.service = data.products[0];
  } else {
    metadata.service = 'hybrid';
  }

  const clientData = {
    slug: data.slug,
    display_name: data.display_name,
    artist_tier: data.tier || 1,
    country: data.country || 'CO',
    genre: data.genre || null,
    status: 'active',
    notes: data.notes || `Cliente onboarded via dashboard. Productos: ${data.products.join(', ')}.`,
    metadata
  };

  let result;
  if (existing && data.force) {
    const { data: updated, error } = await supabase
      .from('clients').update(clientData).eq('id', existing.id).select().single();
    if (error) throw error;
    result = updated;
  } else {
    const { data: inserted, error } = await supabase
      .from('clients').insert(clientData).select().single();
    if (error) throw error;
    result = inserted;
  }

  let clientPath;
  try {
    clientPath = createClientFilesystem(data.slug, { ...data, uuid: result.id, force: data.force });
  } catch (fsError) {
    if (!existing) await supabase.from('clients').delete().eq('id', result.id);
    throw new Error(`Filesystem error: ${fsError.message}`);
  }

  return { client: result, boveda_path: clientPath, products: data.products, structure_created: true };
}

// =====================================================================
// CLIENT 360° CONTEXT
// =====================================================================

async function getClientFullContext(slug) {
  const { data: client, error } = await supabase
    .from('clients').select('*').eq('slug', slug).single();
  if (error) throw error;

  const result = { client, boveda: {}, products: { gs: null, mgmt: null } };

  const clientPath = pathModule.join(BOVEDA_PATH, '06_CLIENTES', slug);
  if (fs.existsSync(clientPath)) {
    result.boveda.path = clientPath;
    const contextoPath = pathModule.join(clientPath, 'contexto.md');
    const notesPath = pathModule.join(clientPath, 'notes.md');
    if (fs.existsSync(contextoPath)) result.boveda.contexto = fs.readFileSync(contextoPath, 'utf-8');
    if (fs.existsSync(notesPath)) result.boveda.notes = fs.readFileSync(notesPath, 'utf-8');
  }

  const { data: gsProject } = await supabase
    .from('projects').select('*').eq('client_id', client.id).maybeSingle();
  if (gsProject) result.products.gs = { project: gsProject };

  const currentMonth = new Date().toISOString().substring(0, 7);
  const { data: mgmtEngagement } = await supabase
    .from('mgmt_engagements')
    .select('*, mgmt_objectives (*, mgmt_deliverables (*), mgmt_meetings (*))')
    .eq('client_id', client.id).eq('month', currentMonth).maybeSingle();
  if (mgmtEngagement) result.products.mgmt = { engagement: mgmtEngagement };

  return result;
}

async function updateClientFileMd(slug, fileType, content) {
  const allowedFiles = ['contexto', 'notes'];
  if (!allowedFiles.includes(fileType)) throw new Error(`Invalid file type: ${fileType}`);

  const clientPath = pathModule.join(BOVEDA_PATH, '06_CLIENTES', slug);
  if (!fs.existsSync(clientPath)) throw new Error(`Client directory not found: ${clientPath}`);

  const filePath = pathModule.join(clientPath, `${fileType}.md`);
  fs.writeFileSync(filePath, content, 'utf-8');

  return { slug, file: `${fileType}.md`, path: filePath, size: content.length, updated_at: new Date().toISOString() };
}

// =====================================================================
// MOONSHOT AI (Kimi K2.5)
// =====================================================================

const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
const MOONSHOT_BASE_URL = process.env.MOONSHOT_BASE_URL || 'https://api.moonshot.ai/v1';
const MOONSHOT_MODEL = 'kimi-k2.5';

async function callMoonshot(messages, options = {}) {
  if (!MOONSHOT_API_KEY) {
    throw new Error('MOONSHOT_API_KEY not configured in .env');
  }

  const payload = {
    model: options.model || MOONSHOT_MODEL,
    messages,
    temperature: options.temperature || 1,
    max_tokens: options.max_tokens || 8000,
    ...(options.response_format && { response_format: options.response_format })
  };

  const response = await fetch(`${MOONSHOT_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MOONSHOT_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Moonshot API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  const msg = data.choices?.[0]?.message || {};
  return {
    content: msg.content != null ? msg.content : (msg.reasoning_content || ''),
    usage: data.usage,
    model: data.model
  };
}

async function testMoonshotConnection() {
  try {
    const result = await callMoonshot([
      { role: 'user', content: 'Reply with exactly: "Moonshot connection OK"' }
    ], { max_tokens: 50 });

    return {
      success: true,
      response: result.content,
      model: result.model,
      tokens: result.usage
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

// =====================================================================
// AGENT RUNNER — invocación de agentes BOVEDA con Kimi K2.5
// =====================================================================

const AGENTS_PATH = pathModule.join(BOVEDA_PATH, '.claude', 'agents');

function parseAgentFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;
  try {
    return yaml.load(fmMatch[1]);
  } catch { return null; }
}

async function syncAgentsToSupabase() {
  const fsAgents = listAgents();
  if (fsAgents.length === 0) return { synced: 0, added: [], removed: [] };

  const { data: dbAgents } = await supabase.from('agents').select('slug, status');
  const dbSlugs = new Set((dbAgents || []).map(a => a.slug));
  const fsSlugs = new Set(fsAgents.map(a => a.slug));

  const toInsert = fsAgents.filter(a => !dbSlugs.has(a.slug));
  const toReactivate = (dbAgents || []).filter(a => fsSlugs.has(a.slug) && a.status === 'inactive');
  const toDeactivate = (dbAgents || []).filter(a => !fsSlugs.has(a.slug) && a.status !== 'inactive');

  const added = [];
  for (const agent of toInsert) {
    const fm = parseAgentFrontmatter(pathModule.join(AGENTS_PATH, agent.file)) || {};
    const { error } = await supabase.from('agents').insert({
      slug: agent.slug,
      name: fm.name || agent.slug,
      description: (fm.description || agent.description || '').trim(),
      panel: fm.panel || 'operativo',
      group_name: fm.group || null,
      subgroup: fm.subgroup || null,
      workspace: fm.workspace || 'growth',
      role: fm.role || null,
      status: 'active',
      version: fm.version || '1.0',
      pipeline_order: fm.pipeline_order || null
    });
    if (!error) added.push(agent.slug);
    else console.error(`Sync insert error for ${agent.slug}:`, error.message);
  }

  for (const agent of toReactivate) {
    await supabase.from('agents').update({ status: 'active' }).eq('slug', agent.slug);
  }

  const removed = [];
  for (const agent of toDeactivate) {
    await supabase.from('agents').update({ status: 'inactive' }).eq('slug', agent.slug);
    removed.push(agent.slug);
  }

  if (toReactivate.length > 0) added.push(...toReactivate.map(a => a.slug + ' (reactivated)'));

  return { synced: fsSlugs.size, added, removed };
}

function listAgents() {
  if (!fs.existsSync(AGENTS_PATH)) return [];

  return fs.readdirSync(AGENTS_PATH)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const slug = f.replace(/\.md$/, '');
      const content = fs.readFileSync(pathModule.join(AGENTS_PATH, f), 'utf-8');

      let description = '';
      const descMatch = content.match(/^description:\s*(.+)$/m);
      if (descMatch) {
        description = descMatch[1].trim();
      } else {
        const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
        const h1Index = lines.findIndex(l => l.startsWith('# '));
        if (h1Index >= 0 && lines[h1Index + 1]) {
          description = lines[h1Index + 1].replace(/^[>*-]\s*/, '').slice(0, 200);
        }
      }

      return { slug, description, file: f };
    });
}

function getAgentPrompt(agentSlug) {
  const agentFile = pathModule.join(AGENTS_PATH, `${agentSlug}.md`);
  if (!fs.existsSync(agentFile)) {
    throw new Error(`Agent not found: ${agentSlug}`);
  }
  return fs.readFileSync(agentFile, 'utf-8');
}

function buildAgentContext(clientSlug, artistSlug) {
  const clientPath = pathModule.join(BOVEDA_PATH, '06_CLIENTES', clientSlug);
  if (!fs.existsSync(clientPath)) {
    throw new Error(`Client directory not found: ${clientSlug}`);
  }

  const parts = [];

  const clientContexto = pathModule.join(clientPath, 'contexto.md');
  if (fs.existsSync(clientContexto)) {
    parts.push(`## CONTEXTO DEL CLIENTE (${clientSlug})\n\n${fs.readFileSync(clientContexto, 'utf-8')}`);
  }

  if (artistSlug) {
    const artistPath = pathModule.join(clientPath, 'artistas', artistSlug);
    if (!fs.existsSync(artistPath)) {
      throw new Error(`Artist directory not found: ${artistSlug} under ${clientSlug}`);
    }

    const artistFiles = fs.readdirSync(artistPath).filter(f => f.endsWith('.md'));
    for (const f of artistFiles) {
      const content = fs.readFileSync(pathModule.join(artistPath, f), 'utf-8');
      parts.push(`## ARCHIVO DEL ARTISTA: ${f} (${artistSlug})\n\n${content}`);
    }
  }

  const meetingsPath = pathModule.join(clientPath, 'mgmt', 'meetings');
  if (fs.existsSync(meetingsPath)) {
    const meetingFiles = fs.readdirSync(meetingsPath)
      .filter(f => f.endsWith('.md'))
      .sort()
      .reverse()
      .slice(0, 3);
    for (const f of meetingFiles) {
      const content = fs.readFileSync(pathModule.join(meetingsPath, f), 'utf-8');
      parts.push(`## REUNIÓN RECIENTE: ${f}\n\n${content.slice(0, 3000)}`);
    }
  }

  return parts.join('\n\n---\n\n');
}

async function invokeAgent(agentSlug, clientSlug, artistSlug, taskDescription) {
  const agentPrompt = getAgentPrompt(agentSlug);
  const context = buildAgentContext(clientSlug, artistSlug);

  const messages = [
    {
      role: 'system',
      content: `${agentPrompt}\n\n---\n\nCONTEXTO COMPLETO DEL CLIENTE Y ARTISTA:\n\n${context}`
    },
    {
      role: 'user',
      content: taskDescription
    }
  ];

  const startTime = Date.now();
  let result;
  let status = 'success';

  try {
    result = await callMoonshot(messages, {
      temperature: 1,
      max_tokens: 16000
    });
  } catch (err) {
    status = 'failed';
    await logAgentInvocation({
      clientSlug, artistSlug, agentSlug,
      taskSummary: taskDescription.slice(0, 200),
      tokensInput: 0, tokensOutput: 0,
      status: 'failed', outputPath: null
    });
    throw err;
  }

  const durationMs = Date.now() - startTime;

  await logAgentInvocation({
    clientSlug, artistSlug, agentSlug,
    taskSummary: taskDescription.slice(0, 200),
    tokensInput: result.usage?.prompt_tokens || 0,
    tokensOutput: result.usage?.completion_tokens || 0,
    status: 'success', outputPath: null
  });

  return {
    output: result.content,
    usage: result.usage,
    model: result.model,
    duration_ms: durationMs,
    agent: agentSlug,
    client: clientSlug,
    artist: artistSlug || null
  };
}

async function logAgentInvocation({ clientSlug, artistSlug, agentSlug, taskSummary, tokensInput, tokensOutput, status, outputPath }) {
  try {
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('slug', clientSlug)
      .maybeSingle();

    await supabase.from('agent_invocations').insert({
      client_id: client?.id || null,
      artist_slug: artistSlug || null,
      agent_slug: agentSlug,
      task_summary: taskSummary,
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
      status,
      output_path: outputPath
    });
  } catch (err) {
    console.warn('Failed to log invocation (non-blocking):', err.message);
  }
}

async function saveAgentOutput(agentSlug, clientSlug, artistSlug, taskDescription, outputContent) {
  let basePath;
  if (artistSlug) {
    basePath = pathModule.join(BOVEDA_PATH, '06_CLIENTES', clientSlug, 'artistas', artistSlug, 'agents', agentSlug);
  } else {
    basePath = pathModule.join(BOVEDA_PATH, '06_CLIENTES', clientSlug, 'agents', agentSlug);
  }

  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const taskSlug = taskDescription
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);

  const filename = `${dateStr}-${taskSlug || 'output'}.md`;
  const fullPath = pathModule.join(basePath, filename);

  const mdContent = `# Output — ${agentSlug}

> Cliente: ${clientSlug}${artistSlug ? ` · Artista: ${artistSlug}` : ''}
> Fecha: ${dateStr}
> Tarea: ${taskDescription}

---

${outputContent}

---

*Generado por ${agentSlug} vía Kimi K2.5 · ${new Date().toISOString()}*
`;

  fs.writeFileSync(fullPath, mdContent, 'utf-8');

  const relativePath = fullPath.replace(BOVEDA_PATH, '').replace(/\\/g, '/').replace(/^\//, '');

  try {
    const { data: lastInv } = await supabase
      .from('agent_invocations')
      .select('id')
      .eq('agent_slug', agentSlug)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastInv) {
      await supabase
        .from('agent_invocations')
        .update({ output_path: relativePath })
        .eq('id', lastInv.id);
    }
  } catch (err) {
    console.warn('Failed to update invocation path (non-blocking):', err.message);
  }

  return {
    saved: true,
    path: relativePath,
    full_path: fullPath,
    filename
  };
}

function listClientArtists(clientSlug) {
  const artistsPath = pathModule.join(BOVEDA_PATH, '06_CLIENTES', clientSlug, 'artistas');
  if (!fs.existsSync(artistsPath)) return [];

  return fs.readdirSync(artistsPath, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

// =====================================================================
// MGMT Meetings + Parser hybrid (regex + Kimi fallback)
// =====================================================================

async function getMeetingContext(objectiveId) {
  const { data: obj, error } = await supabase
    .from('mgmt_objectives')
    .select('id, engagement_id, mgmt_engagements ( client_id )')
    .eq('id', objectiveId).single();
  if (error) return { client_id: null, objectives: [] };

  const engagementId = obj.engagement_id;
  const clientId = obj.mgmt_engagements?.client_id || null;

  const { data: objectives } = await supabase
    .from('mgmt_objectives')
    .select('id, number, title, status')
    .eq('engagement_id', engagementId)
    .order('number');

  return { client_id: clientId, objectives: objectives || [] };
}

async function parseMeetingReport(rawText, objectiveId) {
  if (!rawText || rawText.trim().length < 20) throw new Error('Meeting text is too short to parse');

  const isTranscript = /\[\d{2}:\d{2}[.\:]\d{2,3}\s*-->\s*\d{2}:\d{2}/.test(rawText)
    || /\[\d{2}:\d{2}\.\d{3}\s*\\?--\\?>\s*\d{2}:\d{2}/.test(rawText);

  let context = null;
  if (objectiveId) {
    try { context = await getMeetingContext(objectiveId); } catch (_) {}
  }

  if (isTranscript) {
    try {
      const kimiResult = await parseWithKimi(rawText, context?.objectives || []);
      return { ...kimiResult, _method: 'kimi-transcript' };
    } catch (kimiErr) {
      console.warn('Kimi transcript parse failed:', kimiErr.message);
      throw new Error('No se pudo procesar la transcripcion: ' + kimiErr.message);
    }
  }

  const regexResult = parseWithRegex(rawText);
  const hasRichData = regexResult.type && regexResult.summary
    && (regexResult.attendees.length > 0 || regexResult.action_items.length > 0);

  if (!hasRichData) {
    try {
      const kimiResult = await parseWithKimi(rawText, context?.objectives || []);
      return { ...kimiResult, _method: 'kimi-fallback', _regex_failed: true };
    } catch (kimiErr) {
      console.warn('Kimi fallback failed:', kimiErr.message);
      return { ...regexResult, _method: 'regex-only', _kimi_error: kimiErr.message };
    }
  }

  return { ...regexResult, _method: 'regex-primary' };
}

function parseWithRegex(text) {
  const result = { type: null, summary: null, attendees: [], action_items: [], decisions: [], raw_text: text };
  const lowerText = text.toLowerCase();

  if (lowerText.includes('empalme') || lowerText.includes('kickoff') || lowerText.includes('inicio')) result.type = 'empalme';
  else if (lowerText.includes('entrega') || lowerText.includes('delivery') || lowerText.includes('final')) result.type = 'entrega';
  else if (lowerText.includes('feedback') || lowerText.includes('revision') || lowerText.includes('review')) result.type = 'feedback';

  const summaryPatterns = [/(?:^|\n)(?:summary|resumen|sumario)[:\s]+(.*?)(?:\n\n|\n[A-Z])/is, /(?:^|\n)(?:overview|descripcion)[:\s]+(.*?)(?:\n\n|\n[A-Z])/is];
  for (const p of summaryPatterns) { const m = text.match(p); if (m) { result.summary = m[1].trim().slice(0, 500); break; } }
  if (!result.summary) { const fp = text.split('\n\n')[0]; if (fp && fp.length > 30) result.summary = fp.trim().slice(0, 300); }

  const attendeePatterns = [/(?:attendees|asistentes|participantes|participants)[:\s]+(.*?)(?:\n\n|\n[A-Z])/is];
  for (const p of attendeePatterns) { const m = text.match(p); if (m) { result.attendees = m[1].split(/[,;\n]/).map(n => n.trim()).filter(n => n.length > 2 && n.length < 60).slice(0, 10); break; } }

  const actionPatterns = [/(?:action items|tareas|to-?dos|pendientes|acciones)[:\s]+([\s\S]*?)(?:\n\n[A-Z]|\n#|$)/i];
  for (const p of actionPatterns) { const m = text.match(p); if (m) { result.action_items = m[1].split(/\n+/).map(l => l.replace(/^[\s•\-\*\d\.]+/, '').trim()).filter(l => l.length > 5 && l.length < 300).slice(0, 20); break; } }

  const decisionPatterns = [/(?:decisions|decisiones|acuerdos)[:\s]+([\s\S]*?)(?:\n\n[A-Z]|\n#|$)/i];
  for (const p of decisionPatterns) { const m = text.match(p); if (m) { result.decisions = m[1].split(/\n+/).map(l => l.replace(/^[\s•\-\*\d\.]+/, '').trim()).filter(l => l.length > 5 && l.length < 300).slice(0, 10); break; } }

  return result;
}

async function parseWithKimi(text, objectives = []) {
  const MAX_INPUT = 8000;
  let trimmed = text;
  if (text.length > MAX_INPUT) {
    const head = text.slice(0, MAX_INPUT * 0.6);
    const tail = text.slice(-MAX_INPUT * 0.4);
    trimmed = head + '\n\n[... transcripcion truncada ...]\n\n' + tail;
  }

  const systemPrompt = `You extract meeting metadata as JSON. Output ONLY the JSON object on the first line. No reasoning, no markdown, no explanation before or after.`;

  let objectivesBlock = '';
  if (objectives.length > 0) {
    const list = objectives.map(o => `#${o.number} "${o.title}" (${o.status})`).join('; ');
    objectivesBlock = `\nActive objectives: [${list}]\nFor "secondary_tasks": extract actionable tasks/missions mentioned (NOT deliverables). Each: {"descripcion":"texto","assigned_to":"value"}. assigned_to MUST be one of: "santiago" (booking, eventos, coordinacion presencial), "ian" (estrategia, growth, sistemas, decisiones tecnicas), "cristian" (seguimiento, coordinacion operativa), "artista" (tareas para el propio artista: enviar material, datos), "equipo_artista" (entorno del artista: productor, DJ, manager local). Default to "cristian" if unclear.\nFor "objetivo_links": which objectives from the list above were discussed? Each: {"objective_number":N,"rationale":"why this objective was mentioned"}\n`;
  }

  const jsonFormat = objectives.length > 0
    ? '{"type":"empalme|entrega|feedback","summary":"resumen en español max 300 chars","attendees":["nombre"],"action_items":["tarea"],"decisions":["decision"],"secondary_tasks":[{"descripcion":"texto","assigned_to":"cristian"}],"objetivo_links":[{"objective_number":1,"rationale":"razon"}]}'
    : '{"type":"empalme|entrega|feedback","summary":"resumen en español max 300 chars","attendees":["nombre"],"action_items":["tarea"],"decisions":["decision"]}';

  const result = await callMoonshot([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Extract from this transcription. JSON format: ${jsonFormat}${objectivesBlock}\n\n${trimmed}` }
  ], { temperature: 1, max_tokens: 16000 });

  let raw = (result.content || '').trim();
  if (!raw && result.usage) {
    // Kimi spent all tokens reasoning — no content produced
    throw new Error('Kimi exhausted tokens on reasoning, content empty');
  }
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { parsed = JSON.parse(jsonMatch[0]); } catch (_) {}
    }
    if (!parsed) throw new Error(`Kimi returned non-JSON: ${raw.slice(0, 200)}`);
  }

  return {
    type: parsed.type || null, summary: parsed.summary || '',
    attendees: Array.isArray(parsed.attendees) ? parsed.attendees : [],
    action_items: Array.isArray(parsed.action_items) ? parsed.action_items : [],
    decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
    secondary_tasks: Array.isArray(parsed.secondary_tasks) ? parsed.secondary_tasks : [],
    objetivo_links: Array.isArray(parsed.objetivo_links) ? parsed.objetivo_links : [],
    raw_text: text
  };
}

// =====================================================================
// MGMT Meetings CRUD
// =====================================================================

async function createMeeting(objectiveId, data) {
  if (!data.type) throw new Error('type is required (empalme/entrega/feedback)');
  const validTypes = ['empalme', 'entrega', 'feedback'];
  if (!validTypes.includes(data.type)) throw new Error(`Invalid type: ${data.type}`);

  const { data: objective, error: objError } = await supabase
    .from('mgmt_objectives')
    .select('number, engagement_id, mgmt_engagements ( month, client_id, clients ( slug ) )')
    .eq('id', objectiveId).single();
  if (objError) throw objError;

  const slug = objective.mgmt_engagements?.clients?.slug;
  const month = objective.mgmt_engagements?.month;
  const objNumber = objective.number;
  if (!slug || !month) throw new Error('Cannot build document path - missing parent context');

  const documentPath = `06_CLIENTES/${slug}/mgmt/meetings/${data.type}-meta-${objNumber}-${Date.now()}.md`;
  const fullPath = pathModule.join(BOVEDA_PATH, documentPath);
  const dirPath = pathModule.dirname(fullPath);

  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  const dateStr = new Date().toISOString().split('T')[0];
  const mdContent = `# Reunion ${data.type.toUpperCase()} — Meta #${objNumber}\n\n> Fecha: ${dateStr}\n> Tipo: ${data.type}\n\n## Resumen\n\n${data.summary || '(pendiente)'}\n\n## Asistentes\n\n${(data.attendees || []).map(a => `- ${a}`).join('\n') || '(pendiente)'}\n\n## Action Items\n\n${(data.action_items || []).map(a => `- [ ] ${a}`).join('\n') || '(pendiente)'}\n\n## Decisiones\n\n${(data.decisions || []).map(d => `- ${d}`).join('\n') || '(pendiente)'}\n\n## Texto completo\n\n${data.raw_text || '(sin transcripcion)'}\n\n---\n\n*Ultima actualizacion: ${new Date().toISOString()}*\n`;

  fs.writeFileSync(fullPath, mdContent, 'utf-8');

  const meetingData = {
    objective_id: objectiveId, type: data.type, status: 'documented',
    summary: data.summary || null, document_path: documentPath,
    action_items: (data.action_items || []).join('\n') || null,
    attendees: data.attendees || [], notes: data.notes || null,
    scheduled_at: data.scheduled_at || null, held_at: data.held_at || new Date().toISOString()
  };

  const { data: created, error } = await supabase.from('mgmt_meetings').insert(meetingData).select().single();
  if (error) { if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath); throw error; }

  const meetingId = created.id;
  let savedTasks = [];
  let savedLinks = [];

  if (Array.isArray(data.secondary_tasks) && data.secondary_tasks.length > 0) {
    const clientId = objective.mgmt_engagements?.client_id;
    if (clientId) {
      const validAssignees = ['santiago', 'ian', 'cristian', 'artista', 'equipo_artista'];
      const rows = data.secondary_tasks.map(t => {
        const desc = typeof t === 'string' ? t : t.descripcion;
        const assignee = (typeof t === 'object' && validAssignees.includes(t.assigned_to)) ? t.assigned_to : 'cristian';
        return { client_id: clientId, meeting_id: meetingId, descripcion: desc, assigned_to: assignee, para_cristian: assignee === 'cristian' };
      });
      const { data: inserted, error: stErr } = await supabase.from('secondary_tasks').insert(rows).select();
      if (stErr) console.warn('secondary_tasks insert error:', stErr.message);
      else savedTasks = inserted;
    }
  }

  if (Array.isArray(data.objetivo_links) && data.objetivo_links.length > 0) {
    const { data: engObjectives } = await supabase
      .from('mgmt_objectives')
      .select('id, number')
      .eq('engagement_id', objective.engagement_id);

    if (engObjectives) {
      const numToId = Object.fromEntries(engObjectives.map(o => [o.number, o.id]));
      const rows = data.objetivo_links
        .filter(l => numToId[l.objective_number])
        .map(l => ({
          meeting_id: meetingId,
          objective_id: numToId[l.objective_number],
          confirmed: false,
          rationale: l.rationale || null
        }));
      if (rows.length > 0) {
        const { data: inserted, error: molErr } = await supabase.from('meeting_objective_links').insert(rows).select();
        if (molErr) console.warn('meeting_objective_links insert error:', molErr.message);
        else savedLinks = inserted;
      }
    }
  }

  return { meeting: created, document_path: documentPath, full_path: fullPath, secondary_tasks: savedTasks, objetivo_links: savedLinks };
}

async function updateMeeting(meetingId, updates) {
  const allowed = ['type', 'status', 'summary', 'action_items', 'notes', 'scheduled_at', 'held_at'];
  const cleanUpdates = {};
  for (const key of allowed) { if (updates[key] !== undefined) cleanUpdates[key] = updates[key]; }
  if (Object.keys(cleanUpdates).length === 0) throw new Error('No valid fields to update');

  const { data, error } = await supabase.from('mgmt_meetings').update(cleanUpdates).eq('id', meetingId).select().single();
  if (error) throw error;
  return data;
}

async function updateMeetingDocument(meetingId, content) {
  const { data: meeting, error } = await supabase.from('mgmt_meetings').select('document_path').eq('id', meetingId).single();
  if (error) throw error;
  if (!meeting.document_path) throw new Error('Meeting has no associated document');

  const fullPath = pathModule.join(BOVEDA_PATH, meeting.document_path);
  if (!fs.existsSync(pathModule.dirname(fullPath))) throw new Error('Directory not found');
  fs.writeFileSync(fullPath, content, 'utf-8');

  return { meeting_id: meetingId, document_path: meeting.document_path, size: content.length, updated_at: new Date().toISOString() };
}

async function getMeetingDocument(meetingId) {
  const { data: meeting, error } = await supabase.from('mgmt_meetings').select('document_path').eq('id', meetingId).single();
  if (error) throw error;
  if (!meeting.document_path) return { content: null, exists: false };

  const fullPath = pathModule.join(BOVEDA_PATH, meeting.document_path);
  if (!fs.existsSync(fullPath)) return { content: null, exists: false, path: meeting.document_path };

  return { content: fs.readFileSync(fullPath, 'utf-8'), exists: true, path: meeting.document_path };
}

async function deleteMeeting(meetingId) {
  const { data: meeting, error: getErr } = await supabase.from('mgmt_meetings').select('document_path').eq('id', meetingId).single();
  if (getErr) throw getErr;

  if (meeting.document_path) {
    const fullPath = pathModule.join(BOVEDA_PATH, meeting.document_path);
    if (fs.existsSync(fullPath)) { try { fs.unlinkSync(fullPath); } catch (err) { console.warn('Could not delete file:', err.message); } }
  }

  const { error } = await supabase.from('mgmt_meetings').delete().eq('id', meetingId);
  if (error) throw error;
  return { deleted: true, id: meetingId };
}

// =====================================================================
// MGMT Objectives CRUD
// =====================================================================

async function updateObjective(objectiveId, updates) {
  const allowed = ['title', 'subtitle', 'description', 'status', 'notes', 'number'];
  const cleanUpdates = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) cleanUpdates[key] = updates[key];
  }
  if (Object.keys(cleanUpdates).length === 0) throw new Error('No valid fields to update');

  if (cleanUpdates.status) {
    const validStatuses = ['pending', 'in_progress', 'delivered', 'approved', 'blocked', 'postponed'];
    if (!validStatuses.includes(cleanUpdates.status)) throw new Error(`Invalid status: ${cleanUpdates.status}`);
  }

  const { data, error } = await supabase
    .from('mgmt_objectives').update(cleanUpdates).eq('id', objectiveId).select().single();
  if (error) throw error;
  return data;
}

async function postponeObjective(objectiveId, reason) {
  const { data: existing, error: getErr } = await supabase
    .from('mgmt_objectives').select('notes, title').eq('id', objectiveId).single();
  if (getErr) throw getErr;

  const timestamp = new Date().toISOString().split('T')[0];
  const noteEntry = `[${timestamp}] Aplazado${reason ? ': ' + reason : ''}`;
  const updatedNotes = existing.notes ? `${existing.notes}\n\n${noteEntry}` : noteEntry;

  return updateObjective(objectiveId, { status: 'postponed', notes: updatedNotes });
}

async function deleteObjective(objectiveId) {
  const [delsResult, meetsResult] = await Promise.all([
    supabase.from('mgmt_deliverables').select('id', { count: 'exact', head: true }).eq('objective_id', objectiveId),
    supabase.from('mgmt_meetings').select('id', { count: 'exact', head: true }).eq('objective_id', objectiveId)
  ]);
  if (delsResult.error) throw delsResult.error;
  if (meetsResult.error) throw meetsResult.error;

  const deliverablesCount = delsResult.count || 0;
  const meetingsCount = meetsResult.count || 0;
  if (deliverablesCount > 0 || meetingsCount > 0) {
    throw new Error(`Cannot delete objective: has ${deliverablesCount} deliverable(s) and ${meetingsCount} meeting(s). Use 'postpone' instead, or delete children first.`);
  }

  const { error } = await supabase.from('mgmt_objectives').delete().eq('id', objectiveId);
  if (error) throw error;
  return { deleted: true, id: objectiveId };
}

async function createObjective(engagementId, data) {
  if (!data.title) throw new Error('title is required');

  let number = data.number;
  if (number === undefined || number === null) {
    const { data: existing, error: countErr } = await supabase
      .from('mgmt_objectives').select('number').eq('engagement_id', engagementId)
      .order('number', { ascending: false }).limit(1);
    if (countErr) throw countErr;
    number = existing && existing.length > 0 ? existing[0].number + 1 : 1;
  }

  const { data: created, error } = await supabase
    .from('mgmt_objectives')
    .insert({
      engagement_id: engagementId,
      number,
      title: data.title,
      subtitle: data.subtitle || null,
      description: data.description || null,
      status: data.status || 'pending',
      notes: data.notes || null
    })
    .select().single();
  if (error) throw error;
  return created;
}

// =====================================================================
// MGMT Deliverables CRUD
// =====================================================================

async function updateDeliverable(deliverableId, updates) {
  const allowed = ['title', 'description', 'owner', 'status', 'due_date', 'notes'];
  const cleanUpdates = {};

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      cleanUpdates[key] = updates[key];
    }
  }

  if (Object.keys(cleanUpdates).length === 0) {
    throw new Error('No valid fields to update');
  }

  const { data, error } = await supabase
    .from('mgmt_deliverables')
    .update(cleanUpdates)
    .eq('id', deliverableId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteDeliverable(deliverableId) {
  const { data: deliverable, error: getError } = await supabase
    .from('mgmt_deliverables')
    .select('file_path, attachment_type')
    .eq('id', deliverableId)
    .single();

  if (getError) throw getError;

  if (deliverable.file_path && deliverable.attachment_type !== 'link') {
    const { error: storageError } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .remove([deliverable.file_path]);

    if (storageError) {
      console.warn('Storage cleanup warning:', storageError.message);
    }
  }

  const { error: delError } = await supabase
    .from('mgmt_deliverables')
    .delete()
    .eq('id', deliverableId);

  if (delError) throw delError;

  return { deleted: true, id: deliverableId };
}

async function createDeliverable(objectiveId, data) {
  const allowed = ['title', 'description', 'owner', 'status', 'due_date', 'notes'];
  const cleanData = { objective_id: objectiveId };

  for (const key of allowed) {
    if (data[key] !== undefined) {
      cleanData[key] = data[key];
    }
  }

  if (!cleanData.owner) cleanData.owner = 'team';
  if (!cleanData.status) cleanData.status = 'pending';
  if (!cleanData.title) throw new Error('Title is required');

  const { data: created, error } = await supabase
    .from('mgmt_deliverables')
    .insert(cleanData)
    .select()
    .single();

  if (error) throw error;
  return created;
}

async function setDeliverableLink(deliverableId, url) {
  if (!url || !(url.startsWith('http://') || url.startsWith('https://'))) {
    throw new Error('URL must start with http:// or https://');
  }
  const { data, error } = await supabase
    .from('mgmt_deliverables')
    .update({ file_path: url, attachment_type: 'link', status: 'done', completed_at: new Date().toISOString() })
    .eq('id', deliverableId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function clearDeliverableAttachment(deliverableId) {
  const { data: deliverable } = await supabase.from('mgmt_deliverables').select('file_path, attachment_type').eq('id', deliverableId).single();
  if (deliverable && deliverable.file_path && deliverable.attachment_type !== 'link') {
    await supabase.storage.from(STORAGE_BUCKET).remove([deliverable.file_path]).catch(() => {});
  }
  const { data, error } = await supabase
    .from('mgmt_deliverables')
    .update({ file_path: null, attachment_type: null })
    .eq('id', deliverableId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getDeliverableSignedUrl(deliverableId) {
  const { data: deliverable, error } = await supabase
    .from('mgmt_deliverables')
    .select('file_path, attachment_type')
    .eq('id', deliverableId)
    .single();

  if (error) throw error;
  if (!deliverable.file_path) throw new Error('No file uploaded yet');

  if (deliverable.attachment_type === 'link') {
    return { signed_url: deliverable.file_path, file_path: deliverable.file_path, attachment_type: 'link' };
  }

  const { data: urlData, error: urlError } = await supabase
    .storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(deliverable.file_path, 60 * 60);

  if (urlError) throw urlError;

  return { signed_url: urlData.signedUrl, file_path: deliverable.file_path, attachment_type: deliverable.attachment_type || 'pdf' };
}

async function getMgmtMetricsOverview() {
  const currentMonth = new Date().toISOString().substring(0, 7);

  const [contractsRes, artistsRes, revenueRes, engagementsRes, extraRevenueRes, trmRes] = await Promise.all([
    supabase.from('service_lines').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('artists').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('mgmt_engagements').select('invoice_amount, invoice_currency').eq('status', 'active').eq('month', currentMonth),
    supabase.from('mgmt_engagements').select('id').eq('status', 'active').eq('month', currentMonth),
    supabase.from('projects').select('package_price_usd, package_price_cop').in('status', ['active', 'completed']),
    supabase.from('trm_daily').select('trm').order('date', { ascending: false }).limit(1)
  ]);

  let totalUSD = 0;
  let totalCOP = 0;
  (revenueRes.data || []).forEach(r => {
    if (r.invoice_currency === 'USD') totalUSD += Number(r.invoice_amount || 0);
    if (r.invoice_currency === 'COP') totalCOP += Number(r.invoice_amount || 0);
  });

  const engIds = (engagementsRes.data || []).map(e => e.id);

  let objectivesTotal = 0;
  let deliverablesTotal = 0;
  let deliverablesDone = 0;
  let meetingsMonth = 0;

  if (engIds.length > 0) {
    const { data: objectives } = await supabase
      .from('mgmt_objectives')
      .select('id, mgmt_deliverables(id, status), mgmt_meetings(id)')
      .in('engagement_id', engIds);

    (objectives || []).forEach(obj => {
      objectivesTotal++;
      const dels = obj.mgmt_deliverables || [];
      deliverablesTotal += dels.length;
      deliverablesDone += dels.filter(d => d.status === 'done').length;
      meetingsMonth += (obj.mgmt_meetings || []).length;
    });
  }

  let extraUSD = 0;
  let extraCOP = 0;
  (extraRevenueRes.data || []).forEach(p => {
    extraUSD += Number(p.package_price_usd || 0);
    extraCOP += Number(p.package_price_cop || 0);
  });

  const trm = (trmRes.data && trmRes.data.length > 0) ? Number(trmRes.data[0].trm) : null;
  let total_usd = null;
  if (trm) {
    total_usd = Math.round((totalUSD + extraUSD + ((totalCOP + extraCOP) / trm)) * 100) / 100;
  }

  return {
    artists_active: artistsRes.count,
    contracts_active: contractsRes.count,
    revenue_usd: totalUSD,
    revenue_cop: totalCOP,
    extra_revenue_usd: extraUSD,
    extra_revenue_cop: extraCOP,
    total_usd,
    trm,
    deliverables_total: deliverablesTotal,
    deliverables_done: deliverablesDone,
    meetings_month: meetingsMonth,
    objectives_total: objectivesTotal
  };
}

// === MEETINGS v2: tareas secundarias + enlaces ===

async function listSecondaryTasks(clientId, status, includeArchived = false) {
  let q = supabase.from('secondary_tasks').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  if (!includeArchived) q = q.eq('archived', false);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

async function updateSecondaryTaskStatus(taskId, status) {
  const valid = ['pendiente', 'en_progreso', 'hecha', 'descartada'];
  if (!valid.includes(status)) throw new Error(`Invalid status: ${status}`);
  const { data, error } = await supabase.from('secondary_tasks').update({ status }).eq('id', taskId).select().single();
  if (error) throw error;
  return data;
}

async function markTaskSentToCristian(taskId) {
  const { data, error } = await supabase.from('secondary_tasks').update({ enviada_cristian: true }).eq('id', taskId).select().single();
  if (error) throw error;
  return data;
}

async function listMeetingLinks(meetingId) {
  const { data, error } = await supabase
    .from('meeting_objective_links')
    .select('id, confirmed, rationale, objective_id, mgmt_objectives!inner(number, title, status)')
    .eq('meeting_id', meetingId)
    .order('created_at');
  if (error) throw error;
  return data || [];
}

async function setLinkConfirmed(linkId, confirmed) {
  if (!confirmed) {
    const { error } = await supabase.from('meeting_objective_links').delete().eq('id', linkId);
    if (error) throw error;
    return { deleted: true, id: linkId };
  }
  const { data, error } = await supabase.from('meeting_objective_links').update({ confirmed: true }).eq('id', linkId).select().single();
  if (error) throw error;
  return data;
}

async function listMeetingTasks(meetingId) {
  const { data, error } = await supabase.from('secondary_tasks').select('*').eq('meeting_id', meetingId).order('created_at');
  if (error) throw error;
  return data || [];
}

async function updateTaskAssignee(taskId, assignedTo) {
  const valid = ['santiago', 'ian', 'cristian', 'artista', 'equipo_artista'];
  if (!valid.includes(assignedTo)) throw new Error('assigned_to invalido: ' + assignedTo);
  const { data, error } = await supabase
    .from('secondary_tasks')
    .update({ assigned_to: assignedTo, para_cristian: assignedTo === 'cristian' })
    .eq('id', taskId).select().single();
  if (error) throw error;
  return data;
}

// === M5: vistas agregadas por cliente ===

async function listClientMeetings(clientId) {
  const { data: engs } = await supabase.from('mgmt_engagements').select('id').eq('client_id', clientId);
  if (!engs || !engs.length) return [];

  const { data: objs } = await supabase.from('mgmt_objectives').select('id, number, title').in('engagement_id', engs.map(e => e.id));
  if (!objs || !objs.length) return [];
  const objMap = Object.fromEntries(objs.map(o => [o.id, o]));

  const { data: meetings } = await supabase
    .from('mgmt_meetings')
    .select('id, type, summary, objective_id, held_at, created_at')
    .in('objective_id', objs.map(o => o.id))
    .order('held_at', { ascending: false });

  const result = [];
  for (const m of (meetings || [])) {
    const { count: pendTasks } = await supabase.from('secondary_tasks').select('id', { count: 'exact', head: true }).eq('meeting_id', m.id).eq('status', 'pendiente');
    const { count: confLinks } = await supabase.from('meeting_objective_links').select('id', { count: 'exact', head: true }).eq('meeting_id', m.id).eq('confirmed', true);
    const obj = objMap[m.objective_id];
    result.push({ ...m, objetivo: obj ? `#${obj.number} ${obj.title}` : null, pending_tasks: pendTasks || 0, confirmed_links: confLinks || 0 });
  }
  return result;
}

async function listClientSecondaryTasks(clientId, includeArchived = false) {
  let q = supabase
    .from('secondary_tasks')
    .select('id, descripcion, status, para_cristian, enviada_cristian, assigned_to, meeting_id, created_at, archived')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (!includeArchived) q = q.eq('archived', false);
  const { data: tasks } = await q;
  if (!tasks) return [];

  const meetingIds = [...new Set(tasks.map(t => t.meeting_id).filter(Boolean))];
  let meetingMap = {};
  if (meetingIds.length) {
    const { data: ms } = await supabase.from('mgmt_meetings').select('id, type, held_at').in('id', meetingIds);
    meetingMap = Object.fromEntries((ms || []).map(m => [m.id, m]));
  }
  return tasks.map(t => ({ ...t, origen_reunion: t.meeting_id && meetingMap[t.meeting_id] ? { type: meetingMap[t.meeting_id].type, date: meetingMap[t.meeting_id].held_at } : null }));
}

async function updateSecondaryTaskDescription(taskId, descripcion) {
  const { data, error } = await supabase.from('secondary_tasks').update({ descripcion }).eq('id', taskId).select().single();
  if (error) throw error;
  return data;
}

async function setSecondaryTaskArchived(taskId, archived) {
  const { data, error } = await supabase.from('secondary_tasks').update({ archived: !!archived }).eq('id', taskId).select().single();
  if (error) throw error;
  return data;
}

async function deleteSecondaryTask(taskId) {
  const { error } = await supabase.from('secondary_tasks').delete().eq('id', taskId);
  if (error) throw error;
}

async function listObjectiveMeetings(objectiveId) {
  const { data } = await supabase
    .from('meeting_objective_links')
    .select('confirmed, mgmt_meetings!inner(id, type, held_at, summary)')
    .eq('objective_id', objectiveId)
    .eq('confirmed', true);
  return (data || []).map(l => ({ meeting_id: l.mgmt_meetings.id, type: l.mgmt_meetings.type, date: l.mgmt_meetings.held_at, summary: l.mgmt_meetings.summary }));
}

// =====================================================================
// ARTIST-CENTRIC QUERIES
// =====================================================================

async function getAllArtists() {
  const { data: artists, error } = await supabase
    .from('artists')
    .select(`
      id, slug, stage_name, status, metadata,
      service_lines (
        id, status, created_at,
        service_types ( name )
      )
    `)
    .eq('status', 'active')
    .order('stage_name', { ascending: true });

  if (error) throw error;

  const enriched = await Promise.all(artists.map(async (artist) => {
    const [missions, links] = await Promise.all([
      supabase.from('secondary_tasks').select('id', { count: 'exact', head: true })
        .eq('artist_id', artist.id).eq('status', 'pendiente').eq('archived', false),
      supabase.from('artist_links').select('id', { count: 'exact', head: true })
        .eq('artist_id', artist.id)
    ]);

    return {
      id: artist.id,
      slug: artist.slug,
      display_name: artist.stage_name,
      status: artist.status,
      metadata: artist.metadata,
      service_lines: (artist.service_lines || []).map(sl => ({
        id: sl.id,
        service_type: sl.service_types?.name || 'unknown',
        status: sl.status,
        started_at: sl.created_at
      })),
      pending_missions: missions.count || 0,
      links_count: links.count || 0
    };
  }));

  return enriched;
}

async function getArtistLinks(artistId) {
  const { data, error } = await supabase
    .from('artist_links')
    .select('*')
    .eq('artist_id', artistId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function createArtistLink(artistId, { label, url, file_path, attachment_type, category }) {
  const { data, error } = await supabase
    .from('artist_links')
    .insert({
      artist_id: artistId,
      label,
      url: url || null,
      file_path: file_path || null,
      attachment_type: attachment_type || 'link',
      category: category || 'general'
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteArtistLink(linkId) {
  const { error } = await supabase
    .from('artist_links')
    .delete()
    .eq('id', linkId);
  if (error) throw error;
}

async function getArtistDashboard(artistSlug) {
  const { data: artist, error: artistError } = await supabase
    .from('artists')
    .select(`
      id, slug, stage_name, status, metadata,
      service_lines (
        id, status, created_at,
        service_types ( name )
      )
    `)
    .eq('slug', artistSlug)
    .single();

  if (artistError) throw artistError;

  const links = await getArtistLinks(artist.id);

  const { data: missions, error: missError } = await supabase
    .from('secondary_tasks')
    .select('*')
    .eq('artist_id', artist.id)
    .eq('archived', false)
    .order('created_at', { ascending: false });
  if (missError) throw missError;

  const serviceLines = [];
  for (const sl of (artist.service_lines || [])) {
    const typeName = sl.service_types?.name || 'unknown';
    const lineData = {
      id: sl.id,
      type: typeName,
      status: sl.status,
      started_at: sl.created_at
    };

    if (typeName === 'Management' && sl.status === 'active') {
      const currentMonth = new Date().toISOString().substring(0, 7);

      const { data: engagements } = await supabase
        .from('mgmt_engagements')
        .select('*')
        .eq('month', currentMonth)
        .eq('status', 'active');

      const { data: clientMatch } = await supabase
        .from('clients')
        .select('id')
        .eq('slug', artistSlug)
        .single();

      let engagement = null;
      let objectives = [];

      if (clientMatch) {
        const matchedEng = (engagements || []).find(e => e.client_id === clientMatch.id);
        if (matchedEng) {
          engagement = matchedEng;
          const { data: objs } = await supabase
            .from('mgmt_objectives')
            .select(`*, mgmt_deliverables (*), mgmt_meetings (*)`)
            .eq('engagement_id', matchedEng.id)
            .order('number', { ascending: true });
          objectives = objs || [];
        }
      }

      lineData.engagement = engagement;
      lineData.objectives = objectives;
    }

    serviceLines.push(lineData);
  }

  let boveda = null;
  try {
    const contextPath = pathModule.join(BOVEDA_PATH, '06_CLIENTES', artistSlug, '00-contexto');
    if (fs.existsSync(contextPath)) {
      const files = fs.readdirSync(contextPath).filter(f => f.endsWith('.md'));
      boveda = {};
      for (const file of files) {
        const content = fs.readFileSync(pathModule.join(contextPath, file), 'utf-8');
        boveda[file.replace('.md', '')] = content;
      }
    }
  } catch (e) {
    // No boveda context, that's ok
  }

  return {
    artist: {
      id: artist.id,
      slug: artist.slug,
      display_name: artist.stage_name,
      status: artist.status,
      metadata: artist.metadata
    },
    service_lines: serviceLines,
    missions: missions || [],
    links,
    boveda
  };
}

const SERVICE_TYPE_IDS = {
  mgmt: '7dd7837d-21bf-4712-a459-216ca3421a90',
  av: '0d3ef87c-1dc9-4c72-afeb-37608765298c',
  eventos: 'c70ba04d-5f3c-4ced-8eb0-b44893fe38e7'
};

const SUBSERVICE_IDS = {
  videoclip: 'b503cdf6-9361-4699-9efc-4922e0ee86e3',
  cubrimiento: 'fc1cdcc3-81c5-4cfb-ab56-373ab35a63b7',
  'sesion-contenido': 'b0087ffc-546f-4af0-952d-d32c06287b3c',
  'sesion-fotos': '2eb1b758-3c61-48d8-b8e4-2ba549dd5e2d',
  visualizer: '8e09b861-1cda-4093-b931-72f10423655d'
};

async function onboardArtist(data) {
  const { stage_name, slug, tier, genre, country, city, notes } = data;
  const { payer_mode, payer_client_id, new_payer } = data;
  const { services } = data;

  if (!stage_name || !slug) throw new Error('stage_name and slug are required');

  const { data: existing } = await supabase.from('artists').select('id').eq('slug', slug).single();
  if (existing) throw new Error('Artist slug already exists: ' + slug);

  const artistMeta = {};
  if (genre) artistMeta.genre = genre;
  if (country) artistMeta.country = country;
  if (city) artistMeta.city = city;

  const { data: artist, error: artistErr } = await supabase
    .from('artists')
    .insert({ slug, stage_name, status: 'active', metadata: artistMeta })
    .select()
    .single();
  if (artistErr) throw new Error('Error creating artist: ' + artistErr.message);

  let clientId = null;

  if (payer_mode === 'self') {
    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .insert({
        slug,
        display_name: stage_name,
        type: 'artista',
        artist_tier: tier || 1,
        genre: genre || null,
        country: country || 'CO',
        status: 'active',
        notes: notes || null,
        metadata: city ? { city } : {}
      })
      .select()
      .single();
    if (clientErr) throw new Error('Error creating client: ' + clientErr.message);
    clientId = client.id;
  } else if (payer_mode === 'existing') {
    clientId = payer_client_id;
  } else if (payer_mode === 'new') {
    if (!new_payer || !new_payer.name) throw new Error('New payer name is required');
    const payerSlug = new_payer.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .insert({
        slug: payerSlug,
        display_name: new_payer.name,
        type: new_payer.type || 'sello',
        status: 'active',
        metadata: {}
      })
      .select()
      .single();
    if (clientErr) throw new Error('Error creating payer: ' + clientErr.message);
    clientId = client.id;
  }

  const result = { artist: { id: artist.id, slug: artist.slug, stage_name: artist.stage_name }, services_created: [] };

  if (!services || !clientId) return result;

  if (services.mgmt) {
    const { data: sl, error: slErr } = await supabase
      .from('service_lines')
      .insert({ artist_id: artist.id, service_type_id: SERVICE_TYPE_IDS.mgmt, status: 'active' })
      .select()
      .single();
    if (slErr) throw new Error('Error creating MGMT service line: ' + slErr.message);

    const currentMonth = new Date().toISOString().substring(0, 7);
    const { error: engErr } = await supabase
      .from('mgmt_engagements')
      .insert({
        client_id: clientId,
        service_line_id: sl.id,
        month: currentMonth,
        invoice_amount: services.mgmt.amount || 0,
        invoice_currency: services.mgmt.currency || 'USD',
        status: 'active'
      });
    if (engErr) throw new Error('Error creating engagement: ' + engErr.message);
    result.services_created.push('mgmt');
  }

  if (services.av) {
    const { data: sl, error: slErr } = await supabase
      .from('service_lines')
      .insert({ artist_id: artist.id, service_type_id: SERVICE_TYPE_IDS.av, status: 'active' })
      .select()
      .single();
    if (slErr) throw new Error('Error creating AV service line: ' + slErr.message);

    const subserviceId = SUBSERVICE_IDS[services.av.subtype] || null;
    const { error: projErr } = await supabase
      .from('projects')
      .insert({
        client_id: clientId,
        artist_id: artist.id,
        name: services.av.project_name || services.av.subtype,
        project_type: services.av.subtype || 'videoclip',
        package_price_cop: services.av.price_cop || 0,
        subservice_id: subserviceId,
        status: 'active',
        phase: 'pre-produccion'
      });
    if (projErr) throw new Error('Error creating AV project: ' + projErr.message);
    result.services_created.push('av');
  }

  if (services.eventos) {
    const { error: slErr } = await supabase
      .from('service_lines')
      .insert({ artist_id: artist.id, service_type_id: SERVICE_TYPE_IDS.eventos, status: 'active' });
    if (slErr) throw new Error('Error creating Eventos service line: ' + slErr.message);
    result.services_created.push('eventos');
  }

  return result;
}

// =====================================================================
// PROJECT ASSETS (lanzamientos)
// =====================================================================

const PROJECT_ASSETS_BUCKET = 'mgmt-deliverables';

function normalizeForPath(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\-_\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);
}

function safeFileName(fileName) {
  return fileName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.\-_]/g, '_')
    .replace(/_+/g, '_');
}

async function uploadProjectAsset(projectId, postKey, phase, fileName, fileBuffer, mimeType) {
  if (!projectId || !postKey || !fileName || !fileBuffer) {
    throw new Error('projectId, postKey, fileName and fileBuffer are required');
  }

  // Resolver contexto del proyecto
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, client_id, clients ( slug )')
    .eq('id', projectId)
    .single();

  if (projectError) throw projectError;

  const clientSlug = project.clients?.slug;
  const projectSlug = normalizeForPath(project.name);
  const safePhase = normalizeForPath(phase || 'general');
  const safeName = safeFileName(fileName);
  const timestamp = Date.now();

  if (!clientSlug) throw new Error('Project missing client slug');

  const storagePath = `${clientSlug}/lanzamientos/${projectSlug}/${safePhase}/${postKey}/${timestamp}-${safeName}`;

  // Subir a Storage
  const { error: uploadError } = await supabase
    .storage
    .from(PROJECT_ASSETS_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType || 'application/octet-stream',
      upsert: false
    });

  if (uploadError) throw uploadError;

  // Signed URL (1 año, igual que deliverables)
  const { data: urlData, error: urlError } = await supabase
    .storage
    .from(PROJECT_ASSETS_BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

  if (urlError) throw urlError;

  // Insertar fila en project_assets
  const { data: asset, error: insertError } = await supabase
    .from('project_assets')
    .insert({
      project_id: projectId,
      post_key: postKey,
      phase: phase || null,
      storage_path: storagePath,
      file_name: fileName,
      mime_type: mimeType || null,
      file_size: fileBuffer.length || null,
      status: 'uploaded'
    })
    .select()
    .single();

  if (insertError) throw insertError;

  return {
    asset,
    signed_url: urlData.signedUrl,
    storage_path: storagePath
  };
}

async function listProjectAssets(projectId) {
  const { data: assets, error } = await supabase
    .from('project_assets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Refrescar signed URLs (las de 1 año no deberían vencer pronto, pero por seguridad)
  const enriched = await Promise.all((assets || []).map(async (asset) => {
    if (!asset.storage_path) return { ...asset, signed_url: null };
    try {
      const { data } = await supabase
        .storage
        .from(PROJECT_ASSETS_BUCKET)
        .createSignedUrl(asset.storage_path, 60 * 60 * 24 * 365);
      return { ...asset, signed_url: data?.signedUrl || null };
    } catch (err) {
      console.warn('Signed URL error for asset', asset.id, err.message);
      return { ...asset, signed_url: null };
    }
  }));

  return enriched;
}

async function deleteProjectAsset(assetId) {
  const { data: asset, error: getError } = await supabase
    .from('project_assets')
    .select('storage_path, boveda_path')
    .eq('id', assetId)
    .single();

  if (getError) throw getError;

  if (asset.storage_path) {
    const { error: storageError } = await supabase
      .storage
      .from(PROJECT_ASSETS_BUCKET)
      .remove([asset.storage_path]);

    if (storageError) {
      console.warn('Storage cleanup warning:', storageError.message);
    }
  }

  // Best-effort: limpiar copia local si existe (no bloqueante)
  if (asset.boveda_path) {
    const localPath = pathModule.join(BOVEDA_PATH, asset.boveda_path);
    if (fs.existsSync(localPath)) {
      try { fs.unlinkSync(localPath); } catch (err) { console.warn('Could not delete local file:', err.message); }
    }
  }

  const { error: delError } = await supabase
    .from('project_assets')
    .delete()
    .eq('id', assetId);

  if (delError) throw delError;
  return { deleted: true, id: assetId };
}

async function createContract(data) {
  const { artist_id, contract_type } = data;
  if (!artist_id || !contract_type) throw new Error('artist_id and contract_type are required');

  let clientId = data.client_id;

  if (data.new_client) {
    if (!data.new_client.name) throw new Error('New client name is required');
    const payerSlug = data.new_client.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    const { data: client, error } = await supabase
      .from('clients')
      .insert({ slug: payerSlug, display_name: data.new_client.name, type: data.new_client.type || 'sello', status: 'active', metadata: {} })
      .select()
      .single();
    if (error) throw new Error('Error creating client: ' + error.message);
    clientId = client.id;
  }

  if (!clientId) throw new Error('client_id is required');

  const serviceTypeMap = {
    mgmt: SERVICE_TYPE_IDS.mgmt,
    av: SERVICE_TYPE_IDS.av,
    eventos: SERVICE_TYPE_IDS.eventos,
    lanzamiento: SERVICE_TYPE_IDS.av
  };

  const serviceTypeId = serviceTypeMap[contract_type];
  if (!serviceTypeId) throw new Error('Invalid contract_type: ' + contract_type);

  const { data: sl, error: slErr } = await supabase
    .from('service_lines')
    .insert({ artist_id, service_type_id: serviceTypeId, status: 'active' })
    .select()
    .single();
  if (slErr) throw new Error('Error creating service_line: ' + slErr.message);

  const result = { success: true, type: contract_type, service_line_id: sl.id };

  if (contract_type === 'mgmt') {
    const month = data.start_date ? data.start_date.substring(0, 7) : new Date().toISOString().substring(0, 7);
    const { data: eng, error: engErr } = await supabase
      .from('mgmt_engagements')
      .insert({
        client_id: clientId,
        service_line_id: sl.id,
        month,
        invoice_amount: data.amount || 0,
        invoice_currency: data.currency || 'USD',
        status: 'active'
      })
      .select()
      .single();
    if (engErr) throw new Error('Error creating engagement: ' + engErr.message);
    result.engagement_id = eng.id;
  }

  if (contract_type === 'av') {
    const subserviceId = SUBSERVICE_IDS[data.subservice] || null;
    const { data: proj, error: projErr } = await supabase
      .from('projects')
      .insert({
        client_id: clientId,
        artist_id,
        name: data.project_name || data.subservice,
        project_type: data.subservice || 'videoclip',
        package_price_cop: data.price_cop || 0,
        subservice_id: subserviceId,
        status: 'active',
        phase: data.phase || 'pre-produccion'
      })
      .select()
      .single();
    if (projErr) throw new Error('Error creating AV project: ' + projErr.message);
    result.project_id = proj.id;
  }

  if (contract_type === 'eventos') {
    const { data: proj, error: projErr } = await supabase
      .from('projects')
      .insert({
        client_id: clientId,
        artist_id,
        name: data.event_name || 'Evento',
        project_type: data.event_type === 'booking' ? 'booking' : 'otro',
        status: 'active',
        phase: 'pre-produccion',
        metadata: {
          nombre_evento: data.event_name,
          tipo_evento: data.event_type,
          fee: data.fee,
          fecha_evento: data.event_date
        }
      })
      .select()
      .single();
    if (projErr) throw new Error('Error creating event project: ' + projErr.message);
    result.project_id = proj.id;
  }

  if (contract_type === 'lanzamiento') {
    const { data: proj, error: projErr } = await supabase
      .from('projects')
      .insert({
        client_id: clientId,
        artist_id,
        name: data.release_name || 'Lanzamiento',
        project_type: 'lanzamiento',
        package_price_cop: data.price_cop || 0,
        status: 'active',
        phase: 'pre-release',
        release_date: data.release_date || null,
        metadata: { formato: data.format || 'single' }
      })
      .select()
      .single();
    if (projErr) throw new Error('Error creating release project: ' + projErr.message);
    result.project_id = proj.id;
  }

  return result;
}

module.exports = {
  supabase,
  testConnection,
  getAllAgentsFromDB,
  getAllClients,
  getAllProjects,
  getProjectByClientSlug,
  getMetricsOverview,
  getMgmtOverview,
  getMgmtEngagements,
  getMgmtClients,
  getMgmtClientDetail,
  getMgmtMetricsOverview,
  uploadDeliverableFile,
  getDeliverableSignedUrl,
  setDeliverableLink,
  clearDeliverableAttachment,
  updateDeliverable,
  deleteDeliverable,
  createDeliverable,
  onboardClient,
  getClientFullContext,
  updateClientFileMd,
  validateSlug,
  callMoonshot,
  testMoonshotConnection,
  updateObjective,
  postponeObjective,
  deleteObjective,
  createObjective,
  // Agent Runner
  syncAgentsToSupabase,
  listAgents,
  getAgentPrompt,
  buildAgentContext,
  invokeAgent,
  logAgentInvocation,
  saveAgentOutput,
  listClientArtists,
  getMeetingContext,
  parseMeetingReport,
  createMeeting,
  updateMeeting,
  updateMeetingDocument,
  getMeetingDocument,
  deleteMeeting,
  listSecondaryTasks,
  updateSecondaryTaskStatus,
  markTaskSentToCristian,
  listMeetingLinks,
  setLinkConfirmed,
  listMeetingTasks,
  updateTaskAssignee,
  listClientMeetings,
  listClientSecondaryTasks,
  updateSecondaryTaskDescription,
  setSecondaryTaskArchived,
  deleteSecondaryTask,
  listObjectiveMeetings,
  BOVEDA_PATH,
  // Artist-centric
  getAllArtists,
  getArtistLinks,
  createArtistLink,
  deleteArtistLink,
  getArtistDashboard,
  onboardArtist,
  createContract,
  // Project assets (lanzamientos)
  uploadProjectAsset,
  listProjectAssets,
  deleteProjectAsset,
};
