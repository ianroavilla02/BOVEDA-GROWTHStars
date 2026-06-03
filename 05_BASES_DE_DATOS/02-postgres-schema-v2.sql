-- =====================================================================
-- G*S Postgres Schema v2 — D-006 v2 compatible
-- Created: 2026-06-02
--
-- Tables: clients, projects, agents, runs, findings (5 total)
-- Based on: 01-postgres-schema-LEGACY-v1.sql (archived)
-- Changes:
--   - Added clients table (normalized)
--   - Added projects table (normalized)
--   - Updated agents seed to D-006 v2 (14 agents)
--   - runs now references normalized clients/projects
-- =====================================================================

-- =====================================================================
-- EXTENSIONS
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- pgvector: enable in Phase 2+ for semantic search

-- =====================================================================
-- TABLE: clients (NEW in v2)
-- =====================================================================

CREATE TABLE clients (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL,
  artist_tier   INTEGER CHECK (artist_tier IN (1, 2, 3)),
  status        TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  country       TEXT,
  genre         TEXT,
  contact_info  JSONB DEFAULT '{}',
  notes         TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_slug ON clients(slug);
CREATE INDEX idx_clients_status ON clients(status);

-- =====================================================================
-- TABLE: projects (NEW in v2)
-- =====================================================================

CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  name            TEXT NOT NULL,
  project_type    TEXT NOT NULL CHECK (project_type IN ('CREATOR!', 'ARTIST!', 'STAR!')),
  package_price_usd  NUMERIC(10, 2),
  package_price_cop  NUMERIC(15, 2),
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'paused')),
  phase           TEXT CHECK (phase IN ('pre-release', 'release', 'post-release', 'done')),
  release_date    DATE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  notes           TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_type ON projects(project_type);

-- =====================================================================
-- TABLE: agents (FROM LEGACY, seed updated to D-006 v2)
-- =====================================================================

CREATE TABLE agents (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  panel        TEXT NOT NULL CHECK (panel IN ('directivo', 'maestro', 'operativo')),
  group_name   TEXT,
  subgroup     TEXT,
  workspace    TEXT NOT NULL CHECK (workspace IN ('growth', 'contenido')),
  role         TEXT,
  description  TEXT,
  version      TEXT DEFAULT '1.0',
  status       TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  pipeline_order  INTEGER,
  config       JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agents_slug ON agents(slug);
CREATE INDEX idx_agents_panel ON agents(panel);
CREATE INDEX idx_agents_workspace ON agents(workspace);

-- =====================================================================
-- TABLE: runs (FROM LEGACY, normalized to clients/projects)
-- =====================================================================

CREATE TABLE runs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id        UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
  parent_run_id   UUID REFERENCES runs(id),
  client_id       UUID REFERENCES clients(id),
  project_id      UUID REFERENCES projects(id),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  input_data      JSONB DEFAULT '{}',
  output_data     JSONB DEFAULT '{}',
  tokens_input    INTEGER,
  tokens_output   INTEGER,
  cost_usd        NUMERIC(10, 4),
  duration_ms     INTEGER,
  handoff_to      UUID REFERENCES agents(id),
  handoff_payload JSONB,
  error_message   TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}'
);

CREATE INDEX idx_runs_agent ON runs(agent_id);
CREATE INDEX idx_runs_client ON runs(client_id);
CREATE INDEX idx_runs_project ON runs(project_id);
CREATE INDEX idx_runs_parent ON runs(parent_run_id);
CREATE INDEX idx_runs_status ON runs(status);
CREATE INDEX idx_runs_started_at ON runs(started_at DESC);

-- Idempotency: avoid duplicate hand-offs
CREATE UNIQUE INDEX uq_runs_parent_agent
  ON runs(parent_run_id, agent_id)
  WHERE parent_run_id IS NOT NULL;

-- =====================================================================
-- TABLE: findings (FROM LEGACY, mostly unchanged)
-- =====================================================================

CREATE TABLE findings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id          UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  agent_id        UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
  client_id       UUID REFERENCES clients(id),
  project_id      UUID REFERENCES projects(id),
  type            TEXT NOT NULL,
  title           TEXT NOT NULL,
  content         TEXT,
  data            JSONB DEFAULT '{}',
  confidence      NUMERIC(3, 2) CHECK (confidence BETWEEN 0 AND 1),
  consolidated    BOOLEAN DEFAULT false,
  consolidated_to TEXT,
  consolidated_at TIMESTAMPTZ,
  tags            TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_findings_run ON findings(run_id);
CREATE INDEX idx_findings_agent ON findings(agent_id);
CREATE INDEX idx_findings_client ON findings(client_id);
CREATE INDEX idx_findings_project ON findings(project_id);
CREATE INDEX idx_findings_type ON findings(type);
CREATE INDEX idx_findings_consolidated ON findings(consolidated) WHERE consolidated = false;

-- =====================================================================
-- TRIGGER: auto-update updated_at column
-- =====================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- VIEWS
-- =====================================================================

-- Active runs across system
CREATE OR REPLACE VIEW v_active_runs AS
SELECT
  r.id,
  r.status,
  a.slug AS agent_slug,
  a.name AS agent_name,
  c.display_name AS client_name,
  p.name AS project_name,
  r.started_at,
  EXTRACT(EPOCH FROM (now() - r.started_at)) AS duration_seconds
FROM runs r
JOIN agents a ON r.agent_id = a.id
LEFT JOIN clients c ON r.client_id = c.id
LEFT JOIN projects p ON r.project_id = p.id
WHERE r.status IN ('pending', 'running')
ORDER BY r.started_at DESC;

-- Cost summary per agent in last 30 days
CREATE OR REPLACE VIEW v_agent_costs_30d AS
SELECT
  a.slug,
  a.name,
  COUNT(r.id) AS run_count,
  COALESCE(SUM(r.cost_usd), 0) AS total_cost_usd,
  COALESCE(SUM(r.tokens_input), 0) AS total_tokens_in,
  COALESCE(SUM(r.tokens_output), 0) AS total_tokens_out
FROM agents a
LEFT JOIN runs r ON a.id = r.agent_id
  AND r.completed_at >= now() - INTERVAL '30 days'
GROUP BY a.id, a.slug, a.name
ORDER BY total_cost_usd DESC;

-- Pending findings consolidation
CREATE OR REPLACE VIEW v_pending_consolidation AS
SELECT
  f.id,
  f.title,
  a.slug AS agent_slug,
  c.display_name AS client_name,
  p.name AS project_name,
  f.created_at
FROM findings f
JOIN agents a ON f.agent_id = a.id
LEFT JOIN clients c ON f.client_id = c.id
LEFT JOIN projects p ON f.project_id = p.id
WHERE f.consolidated = false
ORDER BY f.created_at DESC;

-- Active projects with progress
CREATE OR REPLACE VIEW v_active_projects AS
SELECT
  p.id,
  p.name,
  p.project_type,
  c.display_name AS client_name,
  c.artist_tier,
  p.phase,
  p.package_price_usd,
  p.release_date,
  COUNT(r.id) AS total_runs,
  COUNT(CASE WHEN r.status = 'completed' THEN 1 END) AS completed_runs
FROM projects p
JOIN clients c ON p.client_id = c.id
LEFT JOIN runs r ON p.id = r.project_id
WHERE p.status = 'active'
GROUP BY p.id, p.name, p.project_type, c.display_name, c.artist_tier,
         p.phase, p.package_price_usd, p.release_date
ORDER BY p.release_date NULLS LAST;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;

-- Service role: full access (for backend operations)
CREATE POLICY "service_role_all_clients" ON clients FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_projects" ON projects FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_agents" ON agents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_runs" ON runs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_findings" ON findings FOR ALL USING (auth.role() = 'service_role');

-- =====================================================================
-- SEED: 14 D-006 v2 agents
-- =====================================================================

INSERT INTO agents (slug, name, panel, group_name, subgroup, workspace, role, version, pipeline_order) VALUES
  -- Directivos
  ('gs-cto', 'G*S CTO', 'directivo', NULL, NULL, 'growth', 'Chief Technology Officer', '1.0', NULL),
  ('gs-growth-hacker', 'G*S Growth Hacker', 'directivo', NULL, NULL, 'growth', 'Master Growth Strategist', '1.0', NULL),

  -- Maestro
  ('gs-bibliotecario', 'G*S Bibliotecario', 'maestro', NULL, NULL, 'growth', 'Skills Inventory Auditor', '1.0', NULL),

  -- Operativos backend (pipeline)
  ('gs-perfilador-artista', 'G*S Perfilador de Artista', 'operativo', 'backend', 'sop', 'growth', 'Qualitative Artist Profiler', '1.1', 0),
  ('gs-auditor-redes', 'G*S Auditor de Redes Sociales', 'operativo', 'backend', 'sop', 'growth', 'Social Media Audit Specialist', '1.0', 1),
  ('gs-auditor-musical', 'G*S Auditor Musical', 'operativo', 'backend', 'sop', 'growth', 'Music Performance Analyst', '1.0', 2),
  ('gs-sintesis-growth', 'G*S Síntesis Growth', 'operativo', 'backend', 'sop', 'growth', 'Growth Synthesis Specialist', '1.0', 3),
  ('gs-estrategia-activaciones', 'G*S Estrategia de Activaciones', 'operativo', 'backend', 'sop', 'growth', 'Strategy Brief Designer', '1.0', 4),
  ('gs-cotizador', 'G*S Cotizador Comercial', 'operativo', 'backend', 'sop', 'growth', 'Commercial Pricing Agent', '1.0', 5),
  ('gs-roi', 'G*S ROI', 'operativo', 'backend', 'sop', 'growth', 'ROI/ROAS Calculator', '1.0', 12),

  -- Operativos frontend (growth)
  ('gs-calendarizador', 'G*S Calendarizador', 'operativo', 'frontend', 'sop', 'growth', 'Operational Calendar Builder', '1.0', 6),

  -- Operativos frontend (contenido)
  ('gs-canva', 'G*S Canva', 'operativo', 'frontend', 'documentacion', 'contenido', 'Visual Production Director', '1.0', NULL),
  ('gs-memes-fans', 'G*S Memes Fans', 'operativo', 'frontend', 'documentacion', 'contenido', 'Viral Content Creator', '1.0', NULL),
  ('gs-prod-vfx', 'G*S Producción VFX', 'operativo', 'frontend', 'documentacion', 'contenido', 'VFX Production Lead', '1.0', NULL);

-- =====================================================================
-- VERIFICATION QUERIES (run manually after applying)
-- =====================================================================

-- SELECT count(*) FROM agents;  -- Should be 14
-- SELECT panel, count(*) FROM agents GROUP BY panel;  -- 2/1/11
-- SELECT workspace, count(*) FROM agents GROUP BY workspace;  -- growth: 11, contenido: 3
