// =====================================================================
// G*S Dashboard - Deliverables Reader
// Reads client deliverable .md files from BOVEDA filesystem
// =====================================================================

const fs = require('fs');
const path = require('path');

// Base path to BOVEDA clients folder
const BOVEDA_CLIENTS = 'C:\\Users\\Ian Villaveces\\Documents\\BOVEDA - GROWTHStars\\06_CLIENTES';

// Phase folders convention
const PHASE_FOLDERS = {
  '01-auditorias': 'pre-release',
  '02-sintesis': 'pre-release',
  '03-estrategia': 'pre-release',
  '04-cotizacion': 'pre-release',
  '04-calendario': 'pre-release',  // alias histórico (Jot4 R)
  '05-visual': 'pre-release',
  '05-calendario': 'pre-release',  // orden D-006 v2 oficial
  '06-release': 'release',
  '06-cubrimiento': 'release',
  '07-post-release': 'post-release',
  '07-roi': 'post-release'
};

/**
 * Get directory tree for a client
 * Returns: { phase: [files...] }
 */
function getClientDeliverables(clientSlug) {
  const clientPath = path.join(BOVEDA_CLIENTS, clientSlug);

  if (!fs.existsSync(clientPath)) {
    return { error: `Client folder not found: ${clientSlug}` };
  }

  const result = {
    'pre-release': [],
    'release': [],
    'post-release': []
  };

  const folders = fs.readdirSync(clientPath);

  for (const folder of folders) {
    const folderPath = path.join(clientPath, folder);
    const stat = fs.statSync(folderPath);

    if (!stat.isDirectory()) continue;

    const phase = PHASE_FOLDERS[folder] || 'pre-release';

    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(folderPath, file);
      const fileStat = fs.statSync(filePath);

      result[phase].push({
        folder: folder,
        filename: file,
        path: `${folder}/${file}`,
        size_bytes: fileStat.size,
        modified_at: fileStat.mtime.toISOString()
      });
    }
  }

  for (const phase in result) {
    result[phase].sort((a, b) => a.folder.localeCompare(b.folder));
  }

  return result;
}

/**
 * Get content of a specific deliverable
 */
function getDeliverableContent(clientSlug, relativePath) {
  if (relativePath.includes('..') || relativePath.startsWith('/') || relativePath.startsWith('\\')) {
    throw new Error('Invalid path');
  }

  const fullPath = path.join(BOVEDA_CLIENTS, clientSlug, relativePath);

  if (!fullPath.startsWith(BOVEDA_CLIENTS)) {
    throw new Error('Path outside allowed scope');
  }

  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${relativePath}`);
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const stat = fs.statSync(fullPath);

  return {
    content,
    size_bytes: stat.size,
    modified_at: stat.mtime.toISOString()
  };
}

module.exports = {
  getClientDeliverables,
  getDeliverableContent
};
