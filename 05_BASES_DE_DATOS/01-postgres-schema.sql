-- ============================================================================
-- G*S — Schema central de estado de agentes
-- Versión: 1.0
-- Fecha: 2026-04-30
-- Autor: G*S-CTO
-- ============================================================================
-- Tablas core: agents, runs, findings
-- Compatible con Postgres 14+ (Supabase usa Postgres 15)
-- ============================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- pgvector lo activamos cuando metamos embeddings (Fase 2+)
-- CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- TABLA 1: agents
-- Catálogo maestro de agentes G*S. Un registro por agente, no por ejecución.
-- ============================================================================
CREATE TABLE IF NOT EXISTS agents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            TEXT UNIQUE NOT NULL,        -- ej: 'gs-auditoria-redes-sociales'
    name            TEXT NOT NULL,                -- ej: 'G*S-Auditoría Redes Sociales'
    panel           TEXT NOT NULL,                -- 'growth' | 'documentacion' | 'protocolos' | 'preproduccion' | 'postproduccion' | 'meta'
    role            TEXT NOT NULL,                -- descripción corta del rol
    description     TEXT,                         -- descripción larga
    version         TEXT NOT NULL DEFAULT '1.0',
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'experimental')),
    schedule        TEXT,                         -- 'on-demand' | 'cron:0 9 * * *' | 'event:notion-status-change'
    config          JSONB DEFAULT '{}'::jsonb,    -- prompts, modelos, parámetros
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agents_panel ON agents(panel);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_slug ON agents(slug);

COMMENT ON TABLE agents IS 'Catálogo maestro de agentes G*S';
COMMENT ON COLUMN agents.panel IS 'Panel G*S al que pertenece el agente';
COMMENT ON COLUMN agents.config IS 'Config del agente: system prompt, modelo Anthropic, temperatura, max_tokens, skills permitidas';

-- ============================================================================
-- TABLA 2: runs
-- Cada ejecución de un agente. Esta es la tabla más grande, crece con el uso.
-- ============================================================================
CREATE TABLE IF NOT EXISTS runs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id            UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
    parent_run_id       UUID REFERENCES runs(id) ON DELETE SET NULL,  -- para hand-offs
    project_id          TEXT,                     -- ej: artista_carlos_g_lanzamiento_q2
    client_id           TEXT,                     -- identificador del cliente
    status              TEXT NOT NULL DEFAULT 'pending' CHECK (
                            status IN ('pending', 'running', 'complete', 'failed', 'cancelled')
                        ),
    trigger_source      TEXT,                     -- 'manual' | 'n8n' | 'agent:slug' | 'cron'
    input               JSONB NOT NULL DEFAULT '{}'::jsonb,
    output              JSONB,
    error               TEXT,
    -- métricas y costos
    tokens_input        INTEGER DEFAULT 0,
    tokens_output       INTEGER DEFAULT 0,
    cost_usd            NUMERIC(10, 6) DEFAULT 0,
    duration_ms         INTEGER,
    model               TEXT,                     -- 'claude-opus-4-7' etc
    -- timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    -- handoff
    handoff_to          UUID REFERENCES agents(id) ON DELETE SET NULL,
    handoff_payload     JSONB
);

CREATE INDEX idx_runs_agent ON runs(agent_id);
CREATE INDEX idx_runs_status ON runs(status);
CREATE INDEX idx_runs_project ON runs(project_id);
CREATE INDEX idx_runs_client ON runs(client_id);
CREATE INDEX idx_runs_created ON runs(created_at DESC);
CREATE INDEX idx_runs_parent ON runs(parent_run_id);
CREATE INDEX idx_runs_handoff ON runs(handoff_to) WHERE handoff_to IS NOT NULL;

-- Idempotencia: imposible crear el mismo hand-off dos veces
CREATE UNIQUE INDEX uq_runs_parent_agent
ON runs(parent_run_id, agent_id)
WHERE parent_run_id IS NOT NULL;

COMMENT ON TABLE runs IS 'Cada ejecución de un agente. Inmutable después de complete/failed.';
COMMENT ON COLUMN runs.parent_run_id IS 'Si este run vino por hand-off de otro, aquí va el ID del run origen';
COMMENT ON COLUMN runs.input IS 'Payload de entrada al agente (JSONB structured)';
COMMENT ON COLUMN runs.output IS 'Resultado final del agente (JSONB structured)';
COMMENT ON COLUMN runs.handoff_to IS 'Si este run debe disparar otro agente al completarse';
COMMENT ON COLUMN runs.handoff_payload IS 'Payload preparado para el siguiente agente';

-- ============================================================================
-- TABLA 3: findings
-- Hallazgos individuales que un run produce. Permite atomizar conocimiento.
-- ============================================================================
CREATE TABLE IF NOT EXISTS findings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id          UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    agent_id        UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
    project_id      TEXT,
    type            TEXT NOT NULL,            -- 'metric' | 'insight' | 'recommendation' | 'asset_ref' | 'risk' | 'opportunity'
    title           TEXT NOT NULL,
    content         TEXT NOT NULL,
    data            JSONB DEFAULT '{}'::jsonb,  -- structured data si aplica
    confidence      NUMERIC(3, 2) CHECK (confidence >= 0 AND confidence <= 1),
    consolidated    BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE cuando ha sido revisado/integrado al vault
    consolidated_at TIMESTAMPTZ,
    consolidated_to TEXT,                     -- path en obsidian donde quedó consolidado
    tags            TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_findings_run ON findings(run_id);
CREATE INDEX idx_findings_agent ON findings(agent_id);
CREATE INDEX idx_findings_project ON findings(project_id);
CREATE INDEX idx_findings_type ON findings(type);
CREATE INDEX idx_findings_consolidated ON findings(consolidated);
CREATE INDEX idx_findings_tags ON findings USING GIN(tags);

COMMENT ON TABLE findings IS 'Hallazgos atómicos producidos por agentes. Cada finding es una unidad de conocimiento independiente.';
COMMENT ON COLUMN findings.consolidated IS 'TRUE cuando el finding ha sido revisado e integrado al vault Obsidian';
COMMENT ON COLUMN findings.consolidated_to IS 'Path relativo en Obsidian donde se almacenó (ej: clientes/carlos-g/insights/2026-04-engagement.md)';

-- ============================================================================
-- TRIGGER: actualización automática de updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VISTAS útiles
-- ============================================================================

-- Vista: runs activos (no terminados)
CREATE OR REPLACE VIEW v_active_runs AS
SELECT
    r.id,
    a.slug AS agent_slug,
    a.name AS agent_name,
    r.project_id,
    r.client_id,
    r.status,
    r.started_at,
    NOW() - r.started_at AS running_for
FROM runs r
JOIN agents a ON a.id = r.agent_id
WHERE r.status IN ('pending', 'running')
ORDER BY r.created_at DESC;

-- Vista: costos por agente últimos 30 días
CREATE OR REPLACE VIEW v_agent_costs_30d AS
SELECT
    a.slug,
    a.name,
    COUNT(r.id) AS total_runs,
    COUNT(*) FILTER (WHERE r.status = 'complete') AS successful_runs,
    COUNT(*) FILTER (WHERE r.status = 'failed') AS failed_runs,
    SUM(r.tokens_input) AS total_tokens_in,
    SUM(r.tokens_output) AS total_tokens_out,
    SUM(r.cost_usd) AS total_cost_usd,
    AVG(r.duration_ms) AS avg_duration_ms
FROM agents a
LEFT JOIN runs r ON r.agent_id = a.id AND r.created_at > NOW() - INTERVAL '30 days'
GROUP BY a.id, a.slug, a.name
ORDER BY total_cost_usd DESC NULLS LAST;

-- Vista: findings pendientes de consolidar
CREATE OR REPLACE VIEW v_pending_consolidation AS
SELECT
    f.id,
    f.title,
    f.type,
    a.slug AS agent_slug,
    f.project_id,
    f.created_at,
    NOW() - f.created_at AS pending_for
FROM findings f
JOIN agents a ON a.id = f.agent_id
WHERE f.consolidated = FALSE
ORDER BY f.created_at ASC;

-- ============================================================================
-- DATOS SEMILLA: agentes G*S iniciales
-- ============================================================================
INSERT INTO agents (slug, name, panel, role, description) VALUES
    ('gs-cto', 'G*S-CTO', 'meta', 'Chief Technology Officer', 'Meta-agente arquitectónico. Diseña, valida y documenta decisiones técnicas del sistema G*S.'),
    ('gs-growth-hacker', 'G*S-Growth Hacker', 'meta', 'Meta-agente director', 'Agente de dirección, coordina y supervisa a los demás agentes'),
    ('gs-auditoria-redes-sociales', 'G*S-Auditoría Redes Sociales', 'growth', 'Auditor de presencia digital', 'Audita la presencia del artista en redes sociales y produce diagnóstico'),
    ('gs-auditoria-musical', 'G*S-Auditoría Musical', 'growth', 'Auditor de catálogo musical', 'Audita catálogo del artista en plataformas (Spotify, Apple Music)'),
    ('gs-sintesis-growth', 'G*S-Síntesis Growth', 'growth', 'Sintetizador estratégico', 'Sintetiza hallazgos de auditorías y produce diagnóstico ejecutivo'),
    ('gs-estrategia-activaciones', 'G*S-Estrategia de Activaciones', 'growth', 'Estratega de activaciones', 'Diseña activaciones específicas basadas en diagnóstico'),
    ('gs-roi', 'G*S-ROI', 'growth', 'Calculador de ROI', 'Modela ROI esperado y mide ROI real post-activación'),
    ('gs-canva', 'G*S-Canva', 'documentacion', 'Generador de deliverables', 'Genera deliverables en formatos G*S vía Canva'),
    ('gs-calendario-operativo', 'G*S-Calendario Operativo v1', 'documentacion', 'Calendarizador', 'Genera calendarios operativos de lanzamiento'),
    ('gs-shitposter-fans', 'G*S-Shitposter-Fans', 'preproduccion', 'Generador de contenido viral', 'Genera contenido tipo shitpost orientado a fans'),
    ('prod-vfx', 'PROD-VFX', 'postproduccion', 'Productor VFX', 'Coordina producción de VFX para piezas audiovisuales'),
    ('gs-bibliotecario-skills', 'G*S-Bibliotecario Skills', 'meta', 'Auditor de skills', 'Audita todas las skills creadas y genera clasificación maestra')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (recomendado, activar cuando haya multi-cliente)
-- ============================================================================
-- Por ahora desactivado (single-user). Activar cuando entren colaboradores.
-- ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE findings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FIN
-- ============================================================================
