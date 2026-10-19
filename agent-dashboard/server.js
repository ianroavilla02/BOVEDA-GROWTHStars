// =====================================================================
// G*S Agent Dashboard — Server
// Reads canonical .claude/agents/ from configured projects.
// Multi-project, read-only, D-006 v2 compatible.
// =====================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const yaml = require('js-yaml');
const db = require('./db');
const deliverables = require('./deliverables');
const pressBatch = require('./lib/pressBatch');
const auditRun = require('./lib/auditRun');

// =====================================================================
// CONFIGURATION
// =====================================================================

const PORT = 3737;

// Project registry — add new projects here
const PROJECTS = [
  {
    name: "G*S Growth*Stars",
    slug: "gs",
    agentsPath: "C:\\Users\\Ian Villaveces\\Documents\\BOVEDA - GROWTHStars\\.claude\\agents",
    color: "purple"
  }
  // Future projects (uncomment when ready):
  // {
  //   name: "Ian Villaveces B2B",
  //   slug: "iv",
  //   agentsPath: "C:\\Users\\Ian Villaveces\\Documents\\IAN-VILLAVECES\\.claude\\agents",
  //   color: "blue"
  // }
];

// Pipeline ordering — agents not listed go after, alphabetically
const PIPELINE_ORDER = {
  "gs-perfilador-artista": 0,      // Input cualitativo (paralelo a auditores)
  "gs-auditor-redes": 1,
  "gs-auditor-musical": 2,
  "gs-sintesis-growth": 3,
  "gs-estrategia-activaciones": 4,
  "gs-cotizador": 5,
  "gs-calendarizador": 6,
  "gs-roi": 12
};

// SSE clients registry
const sseClients = new Set();

// =====================================================================
// FRONTMATTER PARSING
// =====================================================================

function parseFrontmatter(content) {
  // Frontmatter is between --- lines at the start of the file
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: null, body: content };
  }
  try {
    const frontmatter = yaml.load(match[1]);
    return { frontmatter, body: match[2] };
  } catch (err) {
    console.error('YAML parse error:', err.message);
    return { frontmatter: null, body: content };
  }
}

// =====================================================================
// AGENT SCANNING
// =====================================================================

function scanAgentsForProject(project) {
  const agents = [];

  if (!fs.existsSync(project.agentsPath)) {
    console.warn(`Path does not exist for ${project.name}: ${project.agentsPath}`);
    return agents;
  }

  const files = fs.readdirSync(project.agentsPath);

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    if (file === '.gitkeep') continue;

    const filePath = path.join(project.agentsPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);

    if (!frontmatter || !frontmatter.slug) {
      console.warn(`Skipping ${file}: invalid or missing slug`);
      continue;
    }

    agents.push({
      slug: frontmatter.slug,
      name: frontmatter.name || frontmatter.slug,
      version: frontmatter.version || '1.0',
      panel: frontmatter.panel || 'unknown',
      group: frontmatter.group || null,
      subgroup: frontmatter.subgroup || null,
      workspace: frontmatter.workspace || 'unknown',
      role: frontmatter.role || '',
      description: typeof frontmatter.description === 'string'
        ? frontmatter.description
        : (frontmatter.description?.toString() || ''),
      model: frontmatter.model || 'inherit',
      tools: frontmatter.tools || [],
      skills_used: frontmatter.skills_used || [],
      depends_on: frontmatter.depends_on || [],
      handoff_to: frontmatter.handoff_to || null,
      status: frontmatter.status || 'active',
      project: project.slug,
      projectName: project.name,
      pipelineOrder: PIPELINE_ORDER[frontmatter.slug] ?? null,
      body: body.trim()
    });
  }

  return agents;
}

function scanAllAgents() {
  const allAgents = [];
  for (const project of PROJECTS) {
    const projectAgents = scanAgentsForProject(project);
    allAgents.push(...projectAgents);
  }

  // Sort: pipeline number first, then alphabetical by slug
  allAgents.sort((a, b) => {
    const aHasOrder = a.pipelineOrder !== null;
    const bHasOrder = b.pipelineOrder !== null;
    if (aHasOrder && bHasOrder) return a.pipelineOrder - b.pipelineOrder;
    if (aHasOrder) return -1;
    if (bHasOrder) return 1;
    return a.slug.localeCompare(b.slug);
  });

  return allAgents;
}

// =====================================================================
// CATEGORIES (derived from agents)
// =====================================================================

function deriveCategories(agents) {
  // Workspaces: unique workspace values
  const workspaces = [...new Set(agents.map(a => a.workspace))].filter(w => w !== 'unknown');

  // Panels: directivo, maestro, organos, operativo
  const panels = [...new Set(agents.map(a => a.panel))].filter(p => p !== 'unknown');

  // Groups: backend, frontend (under operativo panel)
  const groups = [...new Set(agents.filter(a => a.panel === 'operativo').map(a => a.group))].filter(g => g !== null);

  // Subgroups: sop, documentacion (under groups)
  const subgroups = [...new Set(agents.map(a => a.subgroup))].filter(s => s !== null);

  return { workspaces, panels, groups, subgroups };
}

// =====================================================================
// FILE WATCHING (for auto-refresh via SSE)
// =====================================================================

let watchTimeout = null;

function watchProjects() {
  for (const project of PROJECTS) {
    if (!fs.existsSync(project.agentsPath)) continue;

    fs.watch(project.agentsPath, { persistent: true }, (eventType, filename) => {
      if (watchTimeout) clearTimeout(watchTimeout);
      watchTimeout = setTimeout(() => {
        console.log(`Change detected in ${project.name}: ${filename}`);
        broadcastRefresh();
      }, 500);
    });

    console.log(`Watching: ${project.agentsPath}`);
  }
}

function broadcastRefresh() {
  for (const client of sseClients) {
    try {
      client.write('data: refresh\n\n');
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

// =====================================================================
// MULTIPART HELPER (reusable)
// =====================================================================

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.startsWith('multipart/form-data')) {
      return reject(new Error('Expected multipart/form-data'));
    }

    const boundary = contentType.split('boundary=')[1];
    if (!boundary) return reject(new Error('Missing boundary'));

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks);
        const boundaryBuffer = Buffer.from('--' + boundary);
        const parts = [];
        let start = 0;
        let idx;
        while ((idx = body.indexOf(boundaryBuffer, start)) !== -1) {
          if (start > 0) parts.push(body.slice(start, idx));
          start = idx + boundaryBuffer.length;
        }

        if (parts.length === 0) return reject(new Error('No file part found'));

        const filePart = parts[0];
        const headersEnd = filePart.indexOf('\r\n\r\n');
        if (headersEnd === -1) return reject(new Error('Invalid file part'));

        const headersStr = filePart.slice(0, headersEnd).toString('utf-8');
        let fileContent = filePart.slice(headersEnd + 4);
        if (fileContent.length >= 2 && fileContent[fileContent.length - 2] === 0x0D && fileContent[fileContent.length - 1] === 0x0A) {
          fileContent = fileContent.slice(0, -2);
        }

        const fileNameMatch = headersStr.match(/filename="([^"]+)"/);
        const fileName = fileNameMatch ? fileNameMatch[1] : 'untitled.bin';
        const ctMatch = headersStr.match(/Content-Type:\s*([^\r\n]+)/i);
        const mimeType = ctMatch ? ctMatch[1].trim() : 'application/octet-stream';

        resolve({ fileName, mimeType, fileContent });
      } catch (err) {
        reject(err);
      }
    });
  });
}

async function resolveProjectId(clientSlug, nameLike = 'tent%') {
  const project = await db.getProjectByClientSlug(clientSlug, nameLike);
  if (!project) throw new Error(`Project not found for client ${clientSlug} matching ${nameLike}`);
  return project.id;
}

// =====================================================================
// HTTP SERVER
// =====================================================================

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // GET / — serve index.html
  if (pathname === '/' && req.method === 'GET') {
    const indexPath = path.join(__dirname, 'index.html');
    fs.readFile(indexPath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // GET /favicon.png
  if (pathname === '/favicon.png' && req.method === 'GET') {
    const faviconPath = path.join(__dirname, 'favicon.png');
    fs.readFile(faviconPath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(data);
    });
    return;
  }

  // GET /reports/* — serve informes de auditoría desde el vault (06_CLIENTES)
  if (pathname.startsWith('/reports/') && req.method === 'GET') {
    const CLIENTES_BASE = path.resolve(db.BOVEDA_PATH, '06_CLIENTES');
    const relative = decodeURIComponent(pathname.slice('/reports/'.length));
    const target = path.resolve(CLIENTES_BASE, relative);

    // guard contra path traversal
    if (!target.startsWith(CLIENTES_BASE + path.sep)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    const MIME = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json; charset=utf-8' };
    const ext = path.extname(target).toLowerCase();
    if (!MIME[ext]) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    fs.readFile(target, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[ext] });
      res.end(data);
    });
    return;
  }

  // GET /api/agents — return all agents + categories
  if (pathname === '/api/agents' && req.method === 'GET') {
    const agents = scanAllAgents();
    const categories = deriveCategories(agents);
    const projects = PROJECTS.map(p => ({ slug: p.slug, name: p.name, color: p.color }));

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify({ agents, categories, projects }, null, 2));
    return;
  }

  // GET /api/events — SSE stream
  if (pathname === '/api/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write('data: connected\n\n');
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // GET /api/clients — return all clients from Supabase
  if (pathname === '/api/clients' && req.method === 'GET') {
    db.getAllClients()
      .then(clients => {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify({ clients }, null, 2));
      })
      .catch(err => {
        console.error('Error fetching clients:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  // GET /api/projects — return all projects from Supabase view
  if (pathname === '/api/projects' && req.method === 'GET') {
    db.getAllProjects()
      .then(projects => {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify({ projects }, null, 2));
      })
      .catch(err => {
        console.error('Error fetching projects:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  // GET /api/projects/:slug/deliverables - List deliverables tree
  const deliverablesMatch = pathname.match(/^\/api\/projects\/([^\/]+)\/deliverables$/);
  if (deliverablesMatch && req.method === 'GET') {
    const clientSlug = deliverablesMatch[1];
    try {
      const tree = deliverables.getClientDeliverables(clientSlug);
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache'
      });
      res.end(JSON.stringify({ client: clientSlug, deliverables: tree }, null, 2));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // GET /api/projects/:slug/file?path=... - Get specific .md content
  const fileMatch = pathname.match(/^\/api\/projects\/([^\/]+)\/file$/);
  if (fileMatch && req.method === 'GET') {
    const clientSlug = fileMatch[1];
    const relativePath = parsedUrl.query.path;

    if (!relativePath) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Missing path parameter' }));
      return;
    }

    try {
      const data = deliverables.getDeliverableContent(clientSlug, relativePath);
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache'
      });
      res.end(JSON.stringify(data, null, 2));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // GET /api/mgmt/overview - Current month engagements with progress
  if (pathname === '/api/mgmt/overview' && req.method === 'GET') {
    db.getMgmtOverview()
      .then(overview => {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify({ overview }, null, 2));
      })
      .catch(err => {
        console.error('Error fetching mgmt overview:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  // GET /api/mgmt/engagements - All engagements (historical)
  if (pathname === '/api/mgmt/engagements' && req.method === 'GET') {
    db.getMgmtEngagements()
      .then(engagements => {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify({ engagements }, null, 2));
      })
      .catch(err => {
        console.error('Error fetching mgmt engagements:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  // GET /api/mgmt/clients - MGMT clients only
  if (pathname === '/api/mgmt/clients' && req.method === 'GET') {
    db.getMgmtClients()
      .then(clients => {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify({ clients }, null, 2));
      })
      .catch(err => {
        console.error('Error fetching mgmt clients:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  // GET /api/mgmt/client/:slug - Client detail with objectives + deliverables
  const mgmtClientMatch = pathname.match(/^\/api\/mgmt\/client\/([^\/]+)$/);
  if (mgmtClientMatch && req.method === 'GET') {
    const slug = mgmtClientMatch[1];
    db.getMgmtClientDetail(slug)
      .then(detail => {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify(detail, null, 2));
      })
      .catch(err => {
        console.error('Error fetching mgmt client detail:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  // POST /api/mgmt/deliverable/:id/upload - Upload PDF/MD file
  const uploadMatch = pathname.match(/^\/api\/mgmt\/deliverable\/([^\/]+)\/upload$/);
  if (uploadMatch && req.method === 'POST') {
    const deliverableId = uploadMatch[1];

    const contentType = req.headers['content-type'] || '';
    if (!contentType.startsWith('multipart/form-data')) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Expected multipart/form-data' }));
      return;
    }

    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Missing boundary' }));
      return;
    }

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks);

        const boundaryBuffer = Buffer.from('--' + boundary);
        const parts = [];
        let start = 0;
        let idx;
        while ((idx = body.indexOf(boundaryBuffer, start)) !== -1) {
          if (start > 0) {
            parts.push(body.slice(start, idx));
          }
          start = idx + boundaryBuffer.length;
        }

        if (parts.length === 0) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'No file part found' }));
          return;
        }

        const filePart = parts[0];
        const headersEnd = filePart.indexOf('\r\n\r\n');
        if (headersEnd === -1) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid file part' }));
          return;
        }

        const headersStr = filePart.slice(0, headersEnd).toString('utf-8');
        let fileContent = filePart.slice(headersEnd + 4);
        if (fileContent.length >= 2 && fileContent[fileContent.length - 2] === 0x0D && fileContent[fileContent.length - 1] === 0x0A) {
          fileContent = fileContent.slice(0, -2);
        }

        const fileNameMatch = headersStr.match(/filename="([^"]+)"/);
        const fileName = fileNameMatch ? fileNameMatch[1] : 'untitled.pdf';

        const ctMatch = headersStr.match(/Content-Type:\s*([^\r\n]+)/i);
        const fileMimeType = ctMatch ? ctMatch[1].trim() : 'application/octet-stream';

        const result = await db.uploadDeliverableFile(deliverableId, fileName, fileContent, fileMimeType);

        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify(result, null, 2));
      } catch (err) {
        console.error('Upload error:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // POST /api/mgmt/deliverable/:id/link - Set link attachment
  const linkMatch = pathname.match(/^\/api\/mgmt\/deliverable\/([^\/]+)\/link$/);
  if (linkMatch && req.method === 'POST') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      try {
        const { url } = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
        const result = await db.setDeliverableLink(linkMatch[1], url);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, deliverable: result }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // PATCH /api/mgmt/objective/:id - Update objective
  const objPatchMatch = pathname.match(/^\/api\/mgmt\/objective\/([^\/]+)$/);
  if (objPatchMatch && req.method === 'PATCH') {
    const objectiveId = objPatchMatch[1];
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks).toString('utf-8');
        const updates = JSON.parse(body);
        const updated = await db.updateObjective(objectiveId, updates);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify({ objective: updated }, null, 2));
      } catch (err) {
        console.error('Update objective error:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // POST /api/mgmt/objective/:id/postpone - Mark as postponed with reason
  const postponeMatch = pathname.match(/^\/api\/mgmt\/objective\/([^\/]+)\/postpone$/);
  if (postponeMatch && req.method === 'POST') {
    const objectiveId = postponeMatch[1];
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks).toString('utf-8');
        const data = JSON.parse(body || '{}');
        const updated = await db.postponeObjective(objectiveId, data.reason || null);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify({ objective: updated }, null, 2));
      } catch (err) {
        console.error('Postpone error:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // DELETE /api/mgmt/objective/:id - Delete objective (only if no children)
  if (objPatchMatch && req.method === 'DELETE') {
    const objectiveId = objPatchMatch[1];
    db.deleteObjective(objectiveId)
      .then(result => {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify(result, null, 2));
      })
      .catch(err => {
        console.error('Delete objective error:', err);
        const statusCode = err.message.includes('Cannot delete') ? 409 : 500;
        res.writeHead(statusCode);
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  // ===================================================================
  // AGENT RUNNER
  // ===================================================================

  if (pathname === '/api/agent-files' && req.method === 'GET') {
    try {
      const agents = db.listAgents();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ agents }, null, 2));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  const artistsMatch = pathname.match(/^\/api\/client\/([^\/]+)\/artists$/);
  if (artistsMatch && req.method === 'GET') {
    try {
      const artists = db.listClientArtists(artistsMatch[1]);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ artists }, null, 2));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  const invokeMatch = pathname.match(/^\/api\/agent\/([^\/]+)\/invoke$/);
  if (invokeMatch && req.method === 'POST') {
    const agentSlug = invokeMatch[1];

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks).toString('utf-8');
        const data = JSON.parse(body);

        if (!data.client_slug || !data.task) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'client_slug and task are required' }));
          return;
        }

        const result = await db.invokeAgent(
          agentSlug,
          data.client_slug,
          data.artist_slug || null,
          data.task
        );

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result, null, 2));
      } catch (err) {
        console.error('Invoke agent error:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  const saveOutputMatch = pathname.match(/^\/api\/agent\/([^\/]+)\/save-output$/);
  if (saveOutputMatch && req.method === 'POST') {
    const agentSlug = saveOutputMatch[1];

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks).toString('utf-8');
        const data = JSON.parse(body);

        if (!data.client_slug || !data.task || !data.output) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'client_slug, task and output are required' }));
          return;
        }

        const result = await db.saveAgentOutput(
          agentSlug,
          data.client_slug,
          data.artist_slug || null,
          data.task,
          data.output
        );

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result, null, 2));
      } catch (err) {
        console.error('Save output error:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // ===================================================================
  // MGMT MEETINGS
  // ===================================================================

  // POST /api/mgmt/objective/:id/meeting/parse - Parse raw meeting text
  const parseMatch = pathname.match(/^\/api\/mgmt\/objective\/([^\/]+)\/meeting\/parse$/);
  if (parseMatch && req.method === 'POST') {
    const objectiveId = parseMatch[1];
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks).toString('utf-8');
        const data = JSON.parse(body);
        if (!data.raw_text) { res.writeHead(400); res.end(JSON.stringify({ error: 'raw_text is required' })); return; }
        const parsed = await db.parseMeetingReport(data.raw_text, objectiveId);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ parsed }, null, 2));
      } catch (err) {
        console.error('Parse meeting error:', err);
        res.writeHead(500); res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // POST /api/mgmt/objective/:id/meeting - Create meeting
  const createMeetMatch = pathname.match(/^\/api\/mgmt\/objective\/([^\/]+)\/meeting$/);
  if (createMeetMatch && req.method === 'POST') {
    const objectiveId = createMeetMatch[1];
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks).toString('utf-8');
        const data = JSON.parse(body);
        const result = await db.createMeeting(objectiveId, data);
        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result, null, 2));
      } catch (err) {
        console.error('Create meeting error:', err);
        res.writeHead(500); res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // PATCH /api/mgmt/meeting/:id - Update meeting fields
  const meetingPatchMatch = pathname.match(/^\/api\/mgmt\/meeting\/([^\/]+)$/);
  if (meetingPatchMatch && req.method === 'PATCH') {
    const meetingId = meetingPatchMatch[1];
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks).toString('utf-8');
        const updates = JSON.parse(body);
        const updated = await db.updateMeeting(meetingId, updates);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ meeting: updated }, null, 2));
      } catch (err) {
        console.error('Update meeting error:', err);
        res.writeHead(500); res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // PATCH /api/mgmt/meeting/:id/document - Update meeting .md content
  const meetingDocMatch = pathname.match(/^\/api\/mgmt\/meeting\/([^\/]+)\/document$/);
  if (meetingDocMatch && req.method === 'PATCH') {
    const meetingId = meetingDocMatch[1];
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks).toString('utf-8');
        const data = JSON.parse(body);
        if (!data.content) { res.writeHead(400); res.end(JSON.stringify({ error: 'content is required' })); return; }
        const result = await db.updateMeetingDocument(meetingId, data.content);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result, null, 2));
      } catch (err) {
        console.error('Update meeting doc error:', err);
        res.writeHead(500); res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // GET /api/mgmt/meeting/:id/document - Read meeting .md content
  if (meetingDocMatch && req.method === 'GET') {
    const meetingId = meetingDocMatch[1];
    db.getMeetingDocument(meetingId)
      .then(result => { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(result, null, 2)); })
      .catch(err => { res.writeHead(500); res.end(JSON.stringify({ error: err.message })); });
    return;
  }

  // DELETE /api/mgmt/meeting/:id - Delete meeting + file
  if (meetingPatchMatch && req.method === 'DELETE') {
    const meetingId = meetingPatchMatch[1];
    db.deleteMeeting(meetingId)
      .then(result => { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(result, null, 2)); })
      .catch(err => { res.writeHead(500); res.end(JSON.stringify({ error: err.message })); });
    return;
  }

  // === MEETINGS v2 endpoints ===

  // GET /api/client/:clientId/secondary-tasks?status=pendiente
  const secTasksMatch = pathname.match(/^\/api\/client\/([^\/]+)\/secondary-tasks$/);
  if (secTasksMatch && req.method === 'GET') {
    const status = parsedUrl.query.status || null;
    db.listSecondaryTasks(secTasksMatch[1], status)
      .then(tasks => { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ tasks }, null, 2)); })
      .catch(err => { res.writeHead(500); res.end(JSON.stringify({ error: err.message })); });
    return;
  }

  // PATCH /api/secondary-task/:id/status  body: { status }
  const taskStatusMatch = pathname.match(/^\/api\/secondary-task\/([^\/]+)\/status$/);
  if (taskStatusMatch && req.method === 'PATCH') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      try {
        const { status } = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
        const task = await db.updateSecondaryTaskStatus(taskStatusMatch[1], status);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(task, null, 2));
      } catch (err) { res.writeHead(500); res.end(JSON.stringify({ error: err.message })); }
    });
    return;
  }

  // POST /api/secondary-task/:id/sent-cristian
  const taskSentMatch = pathname.match(/^\/api\/secondary-task\/([^\/]+)\/sent-cristian$/);
  if (taskSentMatch && req.method === 'POST') {
    db.markTaskSentToCristian(taskSentMatch[1])
      .then(task => { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(task, null, 2)); })
      .catch(err => { res.writeHead(500); res.end(JSON.stringify({ error: err.message })); });
    return;
  }

  // PATCH /api/secondary-task/:id/assignee  body: { assigned_to }
  const taskAssigneeMatch = pathname.match(/^\/api\/secondary-task\/([^\/]+)\/assignee$/);
  if (taskAssigneeMatch && req.method === 'PATCH') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      try {
        const { assigned_to } = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
        const task = await db.updateTaskAssignee(taskAssigneeMatch[1], assigned_to);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(task, null, 2));
      } catch (err) { res.writeHead(500); res.end(JSON.stringify({ error: err.message })); }
    });
    return;
  }

  // PATCH /api/secondary-task/:id  body: { descripcion?, archived? }
  const taskPatchMatch = pathname.match(/^\/api\/secondary-task\/([^\/]+)$/);
  if (taskPatchMatch && req.method === 'PATCH') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
        let task;
        if (typeof body.descripcion === 'string') {
          task = await db.updateSecondaryTaskDescription(taskPatchMatch[1], body.descripcion);
        }
        if (typeof body.archived === 'boolean') {
          task = await db.setSecondaryTaskArchived(taskPatchMatch[1], body.archived);
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, task }));
      } catch (err) { res.writeHead(500); res.end(JSON.stringify({ error: err.message })); }
    });
    return;
  }

  // DELETE /api/secondary-task/:id
  if (taskPatchMatch && req.method === 'DELETE') {
    (async () => {
      try {
        await db.deleteSecondaryTask(taskPatchMatch[1]);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) { res.writeHead(500); res.end(JSON.stringify({ error: err.message })); }
    })();
    return;
  }

  // GET /api/meeting/:id/links
  const meetingLinksMatch = pathname.match(/^\/api\/meeting\/([^\/]+)\/links$/);
  if (meetingLinksMatch && req.method === 'GET') {
    db.listMeetingLinks(meetingLinksMatch[1])
      .then(links => { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ links }, null, 2)); })
      .catch(err => { res.writeHead(500); res.end(JSON.stringify({ error: err.message })); });
    return;
  }

  // GET /api/meeting/:id/tasks
  const meetingTasksMatch = pathname.match(/^\/api\/meeting\/([^\/]+)\/tasks$/);
  if (meetingTasksMatch && req.method === 'GET') {
    db.listMeetingTasks(meetingTasksMatch[1])
      .then(tasks => { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ tasks }, null, 2)); })
      .catch(err => { res.writeHead(500); res.end(JSON.stringify({ error: err.message })); });
    return;
  }

  // PATCH /api/meeting-link/:id/confirm  body: { confirmed: true|false }
  const linkConfirmMatch = pathname.match(/^\/api\/meeting-link\/([^\/]+)\/confirm$/);
  if (linkConfirmMatch && req.method === 'PATCH') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      try {
        const { confirmed } = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
        const result = await db.setLinkConfirmed(linkConfirmMatch[1], confirmed);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result, null, 2));
      } catch (err) { res.writeHead(500); res.end(JSON.stringify({ error: err.message })); }
    });
    return;
  }

  // === M5: vistas agregadas ===

  // GET /api/client/:id/meetings
  const clientMeetingsMatch = pathname.match(/^\/api\/client\/([^\/]+)\/meetings$/);
  if (clientMeetingsMatch && req.method === 'GET') {
    db.listClientMeetings(clientMeetingsMatch[1])
      .then(meetings => { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ meetings }, null, 2)); })
      .catch(err => { res.writeHead(500); res.end(JSON.stringify({ error: err.message })); });
    return;
  }

  // GET /api/client/:id/missions
  const clientMissionsMatch = pathname.match(/^\/api\/client\/([^\/]+)\/missions$/);
  if (clientMissionsMatch && req.method === 'GET') {
    (async () => {
      try {
        const all = await db.listClientSecondaryTasks(clientMissionsMatch[1], true);
        const tasks = all.filter(t => !t.archived);
        const archivedTasks = all.filter(t => t.archived);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ tasks, archivedTasks }, null, 2));
      } catch (err) { res.writeHead(500); res.end(JSON.stringify({ error: err.message })); }
    })();
    return;
  }

  // GET /api/objective/:id/meetings
  const objMeetingsMatch = pathname.match(/^\/api\/objective\/([^\/]+)\/meetings$/);
  if (objMeetingsMatch && req.method === 'GET') {
    db.listObjectiveMeetings(objMeetingsMatch[1])
      .then(meetings => { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ meetings }, null, 2)); })
      .catch(err => { res.writeHead(500); res.end(JSON.stringify({ error: err.message })); });
    return;
  }

  // POST /api/mgmt/engagement/:id/objective - Create new objective
  const createObjMatch = pathname.match(/^\/api\/mgmt\/engagement\/([^\/]+)\/objective$/);
  if (createObjMatch && req.method === 'POST') {
    const engagementId = createObjMatch[1];
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks).toString('utf-8');
        const data = JSON.parse(body);
        const created = await db.createObjective(engagementId, data);
        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify({ objective: created }, null, 2));
      } catch (err) {
        console.error('Create objective error:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // PATCH /api/mgmt/deliverable/:id - Update deliverable fields
  const patchMatch = pathname.match(/^\/api\/mgmt\/deliverable\/([^\/]+)$/);
  if (patchMatch && req.method === 'PATCH') {
    const deliverableId = patchMatch[1];

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks).toString('utf-8');
        const updates = JSON.parse(body);
        const updated = await db.updateDeliverable(deliverableId, updates);

        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify({ deliverable: updated }, null, 2));
      } catch (err) {
        console.error('Update error:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // DELETE /api/mgmt/deliverable/:id - Delete deliverable
  if (patchMatch && req.method === 'DELETE') {
    const deliverableId = patchMatch[1];
    db.deleteDeliverable(deliverableId)
      .then(result => {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify(result, null, 2));
      })
      .catch(err => {
        console.error('Delete error:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  // POST /api/mgmt/objective/:id/deliverable - Create new deliverable
  const createDelMatch = pathname.match(/^\/api\/mgmt\/objective\/([^\/]+)\/deliverable$/);
  if (createDelMatch && req.method === 'POST') {
    const objectiveId = createDelMatch[1];

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks).toString('utf-8');
        const data = JSON.parse(body);
        const created = await db.createDeliverable(objectiveId, data);

        res.writeHead(201, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify({ deliverable: created }, null, 2));
      } catch (err) {
        console.error('Create error:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // GET /api/mgmt/deliverable/:id/file - Get signed URL of uploaded file
  const fileUrlMatch = pathname.match(/^\/api\/mgmt\/deliverable\/([^\/]+)\/file$/);
  if (fileUrlMatch && req.method === 'GET') {
    const deliverableId = fileUrlMatch[1];
    db.getDeliverableSignedUrl(deliverableId)
      .then(data => {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify(data, null, 2));
      })
      .catch(err => {
        res.writeHead(404);
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  // GET /api/mgmt/metrics - Aggregate metrics
  if (pathname === '/api/mgmt/metrics' && req.method === 'GET') {
    db.getMgmtMetricsOverview()
      .then(metrics => {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify({ metrics }, null, 2));
      })
      .catch(err => {
        console.error('Error fetching mgmt metrics:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  // ===================================================================
  // CLIENT ONBOARDING + 360° CONTEXT
  // ===================================================================

  // POST /api/clients/onboard - Create new client (G*S or MGMT)
  if (pathname === '/api/clients/onboard' && req.method === 'POST') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks).toString('utf-8');
        const data = JSON.parse(body);
        data.onboard_method = 'dashboard';

        const result = await db.onboardClient(data);

        res.writeHead(201, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify(result, null, 2));
      } catch (err) {
        console.error('Onboard error:', err);
        let statusCode = 500;
        if (err.message.includes('already exists')) statusCode = 409;
        if (err.message.includes('required') || err.message.includes('Invalid')) statusCode = 400;

        res.writeHead(statusCode, {
          'Content-Type': 'application/json; charset=utf-8'
        });
        res.end(JSON.stringify({ error: err.message }, null, 2));
      }
    });
    return;
  }

  // POST /api/artists/onboard - Create new artist with optional services
  if (pathname === '/api/artists/onboard' && req.method === 'POST') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks).toString('utf-8');
        const data = JSON.parse(body);
        const result = await db.onboardArtist(data);
        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result, null, 2));
      } catch (err) {
        console.error('Artist onboard error:', err);
        let statusCode = 500;
        if (err.message.includes('already exists')) statusCode = 409;
        if (err.message.includes('required')) statusCode = 400;
        res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }, null, 2));
      }
    });
    return;
  }

  // POST /api/projects/contract - Create new contract
  if (pathname === '/api/projects/contract' && req.method === 'POST') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks).toString('utf-8');
        const data = JSON.parse(body);
        const result = await db.createContract(data);
        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result, null, 2));
      } catch (err) {
        console.error('Contract creation error:', err);
        let statusCode = 500;
        if (err.message.includes('already exists')) statusCode = 409;
        if (err.message.includes('required') || err.message.includes('Invalid')) statusCode = 400;
        res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }, null, 2));
      }
    });
    return;
  }

  // GET /api/client/:slug/full-context - Get complete 360° view
  const fullContextMatch = pathname.match(/^\/api\/client\/([^\/]+)\/full-context$/);
  if (fullContextMatch && req.method === 'GET') {
    const slug = fullContextMatch[1];
    db.getClientFullContext(slug)
      .then(context => {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify(context, null, 2));
      })
      .catch(err => {
        console.error('Full context error:', err);
        res.writeHead(err.code === 'PGRST116' ? 404 : 500);
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  // PATCH /api/client/:slug/file-md - Update contexto.md or notes.md
  const fileMatchMd = pathname.match(/^\/api\/client\/([^\/]+)\/file-md$/);
  if (fileMatchMd && req.method === 'PATCH') {
    const slug = fileMatchMd[1];
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks).toString('utf-8');
        const data = JSON.parse(body);

        if (!data.file_type || !data.content) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'file_type and content are required' }));
          return;
        }

        const result = await db.updateClientFileMd(slug, data.file_type, data.content);

        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify(result, null, 2));
      } catch (err) {
        console.error('Update file error:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // GET /api/clients/validate-slug?slug=xxx - Check if slug is valid and available
  if (pathname === '/api/clients/validate-slug' && req.method === 'GET') {
    const slug = parsedUrl.query.slug;

    const formatCheck = db.validateSlug(slug);
    if (!formatCheck.valid) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ valid: false, reason: 'invalid_format', message: formatCheck.error }));
      return;
    }

    db.supabase
      .from('clients')
      .select('id, display_name')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) throw error;
        if (data) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ valid: false, reason: 'duplicate', message: `Slug already exists for: ${data.display_name}`, existing_id: data.id }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ valid: true, message: 'Slug is available' }));
        }
      })
      .catch(err => {
        console.error('Validate slug error:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  // GET /api/metrics — return overview metrics from Supabase
  if (pathname === '/api/metrics' && req.method === 'GET') {
    db.getMetricsOverview()
      .then(metrics => {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify({ metrics }, null, 2));
      })
      .catch(err => {
        console.error('Error fetching metrics:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  // =====================================================================
  // PRESS BATCH ENDPOINTS (D-043: fire-and-forget + polling)
  // =====================================================================

  // POST /api/batches — crear lote + generar arco (NO genera notas)
  if (pathname === '/api/batches' && req.method === 'POST') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const { mode, clientSlug, artistSlug, plan, objetivo, cantidad } = JSON.parse(Buffer.concat(chunks).toString());
        const result = await pressBatch.createBatch({ mode, clientSlug, artistSlug, plan, objetivo, cantidad });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error('createBatch error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // POST /api/batches/:id/approve — aprobar arco (humano revisó)
  const batchApproveMatch = pathname.match(/^\/api\/batches\/([^\/]+)\/approve$/);
  if (batchApproveMatch && req.method === 'POST') {
    const batchId = batchApproveMatch[1];
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const { arco } = JSON.parse(Buffer.concat(chunks).toString());
        await pressBatch.approveBatchArco(batchId, arco);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        console.error('approveBatchArco error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // POST /api/batches/:id/generate — fire-and-forget (D-054)
  const batchGenerateMatch = pathname.match(/^\/api\/batches\/([^\/]+)\/generate$/);
  if (batchGenerateMatch && req.method === 'POST') {
    const batchId = batchGenerateMatch[1];
    res.writeHead(202, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ started: true }));
    pressBatch.generateBatchNotes(batchId, null, 3)
      .then(r => console.log(`[generate ${batchId}] ${r.ok} ok, ${r.fail} fail`))
      .catch(err => console.error(`[generate ${batchId}]`, err.message));
    return;
  }

  // POST /api/batches/:id/close — cerrar lote y escribir a BOVEDA
  const batchCloseMatch = pathname.match(/^\/api\/batches\/([^\/]+)\/close$/);
  if (batchCloseMatch && req.method === 'POST') {
    const batchId = batchCloseMatch[1];
    (async () => {
      try {
        const result = await pressBatch.closeBatch(batchId);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      }
    })();
    return;
  }

  // GET /api/batches/:id — polling de status + notas
  const batchGetMatch = pathname.match(/^\/api\/batches\/([^\/]+)$/);
  if (batchGetMatch && req.method === 'GET') {
    const batchId = batchGetMatch[1];
    (async () => {
      const { data: batch, error } = await db.supabase
        .from('press_batches').select('id, status, arco, artist_slug, client_slug, created_at')
        .eq('id', batchId).single();
      if (error) {
        const sc = error.code === 'PGRST116' ? 404 : 500;
        const msg = error.code === 'PGRST116' ? 'lote no existe' : error.message;
        res.writeHead(sc, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: msg }));
        return;
      }
      const { data: notes } = await db.supabase
        .from('press_notes').select('id, beat_index, titular, content, status, rating, fase, fecha')
        .eq('batch_id', batchId).order('beat_index');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(JSON.stringify({ batch, notes: notes || [] }));
    })().catch(err => {
      console.error('getBatch error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // POST /api/notes/:id/regenerate — re-genera una nota (síncrono, ~60-90s)
  const noteRegenMatch = pathname.match(/^\/api\/notes\/([^\/]+)\/regenerate$/);
  if (noteRegenMatch && req.method === 'POST') {
    const noteId = noteRegenMatch[1];
    (async () => {
      const updated = await pressBatch.regenerateNote(noteId);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ note: updated }));
    })().catch(err => {
      console.error('regenerateNote error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // PATCH /api/notes/:id — actualizar rating y/o status
  const notePatchMatch = pathname.match(/^\/api\/notes\/([^\/]+)$/);
  if (notePatchMatch && req.method === 'PATCH') {
    const noteId = notePatchMatch[1];
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString());
        const update = {};

        if (body.rating !== undefined) {
          const r = parseInt(body.rating, 10);
          if (!Number.isInteger(r) || r < 1 || r > 5) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'rating debe ser entero 1-5' }));
            return;
          }
          update.rating = r;
        }

        if (body.status !== undefined) {
          const valid = ['approved', 'discarded', 'pending'];
          if (!valid.includes(body.status)) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'status debe ser approved, discarded o pending' }));
            return;
          }
          update.status = body.status;
        }

        if (Object.keys(update).length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'enviar al menos rating o status' }));
          return;
        }

        const { data: note, error } = await db.supabase
          .from('press_notes').update(update).eq('id', noteId).select().single();
        if (error) throw error;

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, note }));
      } catch (err) {
        console.error('patchNote error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // =====================================================================
  // ARTIST-CENTRIC ROUTES
  // =====================================================================

  // GET /api/artists
  if (pathname === '/api/artists' && req.method === 'GET') {
    db.getAllArtists()
      .then(artists => {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ artists }));
      })
      .catch(err => {
        console.error('Error fetching artists:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  // GET /api/artist/:slug/dashboard
  const artistDashMatch = pathname.match(/^\/api\/artist\/([^\/]+)\/dashboard$/);
  if (artistDashMatch && req.method === 'GET') {
    const slug = artistDashMatch[1];
    db.getArtistDashboard(slug)
      .then(data => {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(data));
      })
      .catch(err => {
        console.error('Error fetching artist dashboard:', err);
        const sc = err.code === 'PGRST116' ? 404 : 500;
        res.writeHead(sc, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  // GET /api/artist/:slug/links
  const artistLinksGetMatch = pathname.match(/^\/api\/artist\/([^\/]+)\/links$/);
  if (artistLinksGetMatch && req.method === 'GET') {
    const slug = artistLinksGetMatch[1];
    db.supabase.from('artists').select('id').eq('slug', slug).single()
      .then(({ data: artist, error }) => {
        if (error) throw error;
        return db.getArtistLinks(artist.id);
      })
      .then(links => {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ links }));
      })
      .catch(err => {
        console.error('Error fetching artist links:', err);
        const sc = err.code === 'PGRST116' ? 404 : 500;
        res.writeHead(sc, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  // POST /api/artist/:slug/links
  const artistLinksPostMatch = pathname.match(/^\/api\/artist\/([^\/]+)\/links$/);
  if (artistLinksPostMatch && req.method === 'POST') {
    const slug = artistLinksPostMatch[1];
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { data: artist, error } = await db.supabase
          .from('artists').select('id').eq('slug', slug).single();
        if (error) throw error;
        const link = await db.createArtistLink(artist.id, payload);
        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, link }));
      } catch (err) {
        console.error('Error creating artist link:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // DELETE /api/artist-link/:id
  const artistLinkDeleteMatch = pathname.match(/^\/api\/artist-link\/([^\/]+)$/);
  if (artistLinkDeleteMatch && req.method === 'DELETE') {
    const linkId = artistLinkDeleteMatch[1];
    db.deleteArtistLink(linkId)
      .then(() => {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, deleted: linkId }));
      })
      .catch(err => {
        console.error('Error deleting artist link:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  // ===================================================================
  // PROJECT ASSETS (lanzamientos: TENTACIÓN)
  // ===================================================================

  // GET /api/projects/:slug/assets - List assets for the project's launch
  const projectAssetsMatch = pathname.match(/^\/api\/projects\/([^\/]+)\/assets$/);
  if (projectAssetsMatch && req.method === 'GET') {
    const clientSlug = projectAssetsMatch[1];
    const projectNameLike = parsedUrl.query.project_name || 'tent%';
    (async () => {
      try {
        const projectId = await resolveProjectId(clientSlug, projectNameLike);
        const assets = await db.listProjectAssets(projectId);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify({ project_id: projectId, assets }, null, 2));
      } catch (err) {
        console.error('List project assets error:', err);
        res.writeHead(err.message.includes('not found') ? 404 : 500);
        res.end(JSON.stringify({ error: err.message }));
      }
    })();
    return;
  }

  // POST /api/projects/:slug/assets/:postKey - Upload asset for a post
  const projectAssetUploadMatch = pathname.match(/^\/api\/projects\/([^\/]+)\/assets\/([^\/]+)$/);
  if (projectAssetUploadMatch && req.method === 'POST') {
    const clientSlug = projectAssetUploadMatch[1];
    const postKey = projectAssetUploadMatch[2];
    const phase = parsedUrl.query.phase || 'general';
    const projectNameLike = parsedUrl.query.project_name || 'tent%';

    (async () => {
      try {
        const projectId = await resolveProjectId(clientSlug, projectNameLike);

        // Reemplazo: mantener un solo asset por post_key
        const { data: existingAssets } = await db.supabase
          .from('project_assets')
          .select('id')
          .eq('project_id', projectId)
          .eq('post_key', postKey);

        for (const existing of (existingAssets || [])) {
          try { await db.deleteProjectAsset(existing.id); } catch (e) { console.warn('Could not replace old asset:', e.message); }
        }

        const { fileName, mimeType, fileContent } = await parseMultipart(req);
        const result = await db.uploadProjectAsset(projectId, postKey, phase, fileName, fileContent, mimeType);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify(result, null, 2));
      } catch (err) {
        console.error('Upload project asset error:', err);
        res.writeHead(err.message.includes('Expected multipart') || err.message.includes('No file part') ? 400 : 500);
        res.end(JSON.stringify({ error: err.message }));
      }
    })();
    return;
  }

  // DELETE /api/project-assets/:id - Delete asset
  const projectAssetDeleteMatch = pathname.match(/^\/api\/project-assets\/([^\/]+)$/);
  if (projectAssetDeleteMatch && req.method === 'DELETE') {
    const assetId = projectAssetDeleteMatch[1];
    db.deleteProjectAsset(assetId)
      .then(result => {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify(result, null, 2));
      })
      .catch(err => {
        console.error('Delete project asset error:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  // GET /tentacion - Portal de lanzamiento TENTACIÓN
  if (pathname === '/tentacion' || pathname === '/tentacion/') {
    const portalPath = path.join(__dirname, 'tentacion-portal.html');
    try {
      const content = fs.readFileSync(portalPath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    } catch (err) {
      res.writeHead(404);
      res.end('Tentacion portal not found');
    }
    return;
  }

  if (pathname === '/portal' || pathname === '/artist-portal.html') {
    const portalPath = path.join(__dirname, 'artist-portal.html');
    try {
      const content = fs.readFileSync(portalPath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    } catch (err) {
      res.writeHead(404);
      res.end('Portal not found');
    }
    return;
  }

  // 404 for everything else
  res.writeHead(404);
  res.end('Not found');
});

// =====================================================================
// STARTUP
// =====================================================================

server.listen(PORT, () => {
  console.log(`G*S Dashboard running at http://localhost:${PORT}`);
  console.log(`Projects configured: ${PROJECTS.length}`);
  for (const project of PROJECTS) {
    console.log(`  - ${project.name}: ${project.agentsPath}`);
  }

  const agents = scanAllAgents();
  console.log(`Total agents loaded: ${agents.length}`);

  db.syncAgentsToSupabase().then(result => {
    console.log(`Agent sync: ${result.synced} in filesystem`);
    if (result.added.length) console.log(`  + Added: ${result.added.join(', ')}`);
    if (result.removed.length) console.log(`  - Deactivated: ${result.removed.join(', ')}`);
  }).catch(err => console.error('Agent sync failed:', err.message));

  watchProjects();
});
