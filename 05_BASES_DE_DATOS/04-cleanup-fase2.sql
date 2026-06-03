-- =====================================================================
-- G*S Cleanup Fase 2 - Eliminar duplicados del seed
-- Created: 2026-06-03
--
-- Issue: seed-jot4r-real.sql se ejecutó 3 veces
-- Result: 1 client (OK por ON CONFLICT), 3 projects, 24 runs
--
-- Action: Truncate runs + projects, mantener client (idempotente)
--         Reaplicar seed runs + project 1 sola vez
-- =====================================================================

-- =====================================================================
-- STEP 1: Truncate operational tables (FK order: runs first, then projects)
-- =====================================================================

-- Borrar runs (FK a projects)
TRUNCATE TABLE runs CASCADE;

-- Borrar projects (mantener clients, agents, findings que están vacíos)
DELETE FROM projects;

-- =====================================================================
-- STEP 2: Re-insert project (no duplicate now)
-- =====================================================================

INSERT INTO projects (
  client_id,
  name,
  project_type,
  package_price_usd,
  package_price_cop,
  status,
  phase,
  notes,
  metadata
)
SELECT
  c.id,
  'Lanzamiento TUCUTÚ',
  'ARTIST!',
  2500.00,
  9360000.00,
  'active',
  'pre-release',
  'Lanzamiento single TUCUTÚ. Primera ejecución completa pipeline G*S con cliente real.',
  '{"single_name": "TUCUTÚ", "vault_path": "06_CLIENTES/jot4r/"}'::jsonb
FROM clients c WHERE c.slug = 'jot4r';

-- =====================================================================
-- STEP 3: Re-insert 4 runs
-- =====================================================================

WITH
  client_ref AS (SELECT id FROM clients WHERE slug = 'jot4r'),
  project_ref AS (SELECT id FROM projects WHERE name = 'Lanzamiento TUCUTÚ'),
  perfilador AS (SELECT id FROM agents WHERE slug = 'gs-perfilador-artista'),
  audit_redes AS (SELECT id FROM agents WHERE slug = 'gs-auditor-redes'),
  audit_musical AS (SELECT id FROM agents WHERE slug = 'gs-auditor-musical'),
  sintesis AS (SELECT id FROM agents WHERE slug = 'gs-sintesis-growth')

INSERT INTO runs (
  agent_id,
  client_id,
  project_id,
  status,
  started_at,
  completed_at,
  output_data,
  metadata
)
SELECT
  perfilador.id, client_ref.id, project_ref.id, 'completed',
  now() - INTERVAL '14 days',
  now() - INTERVAL '14 days' + INTERVAL '45 minutes',
  '{"deliverable": "perfil-artista-jot4r.md", "consolidated": true}'::jsonb,
  '{"phase": "pre-release", "pipeline_step": 0}'::jsonb
FROM perfilador, client_ref, project_ref
UNION ALL
SELECT
  audit_redes.id, client_ref.id, project_ref.id, 'completed',
  now() - INTERVAL '12 days',
  now() - INTERVAL '12 days' + INTERVAL '1 hour 20 minutes',
  '{"deliverable": "auditoria-redes-sociales.md", "consolidated": true}'::jsonb,
  '{"phase": "pre-release", "pipeline_step": 1}'::jsonb
FROM audit_redes, client_ref, project_ref
UNION ALL
SELECT
  audit_musical.id, client_ref.id, project_ref.id, 'completed',
  now() - INTERVAL '10 days',
  now() - INTERVAL '10 days' + INTERVAL '1 hour 30 minutes',
  '{"deliverable": "auditoria-musical.md", "consolidated": true}'::jsonb,
  '{"phase": "pre-release", "pipeline_step": 2}'::jsonb
FROM audit_musical, client_ref, project_ref
UNION ALL
SELECT
  sintesis.id, client_ref.id, project_ref.id, 'completed',
  now() - INTERVAL '7 days',
  now() - INTERVAL '7 days' + INTERVAL '2 hours',
  '{"deliverable": "sintesis-growth.md", "consolidated": true}'::jsonb,
  '{"phase": "pre-release", "pipeline_step": 3}'::jsonb
FROM sintesis, client_ref, project_ref;

-- =====================================================================
-- STEP 4: Add UNIQUE constraint to prevent future duplicates
-- =====================================================================

ALTER TABLE projects
  ADD CONSTRAINT projects_client_name_unique
  UNIQUE (client_id, name);

-- =====================================================================
-- VERIFICATION QUERIES (run manually after applying)
-- =====================================================================

-- SELECT count(*) FROM clients;   -- Should be 1
-- SELECT count(*) FROM projects;  -- Should be 1
-- SELECT count(*) FROM runs;      -- Should be 4
-- SELECT count(*) FROM agents;    -- Should be 14
