-- =====================================================================
-- G*S Seed Real - Cliente Jot4 R / Lanzamiento TUCUTÚ
-- Created: 2026-06-03
--
-- Real client data:
-- - Tier 1 (Emergente, <50K oyentes mensuales)
-- - Género: ndombolo (afro)
-- - Producto: ARTIST! (US$ 2,500 / 9.36M COP)
-- - Fase: pre-release
-- - Agentes ejecutados: perfilador, audit-redes, audit-musical, sintesis
-- =====================================================================

-- =====================================================================
-- INSERT: client Jot4 R
-- =====================================================================

INSERT INTO clients (slug, display_name, artist_tier, country, genre, status, contact_info, notes, metadata)
VALUES (
  'jot4r',
  'Jot4 R',
  1,
  'CO',
  'ndombolo',
  'active',
  '{}'::jsonb,
  'Primer cliente piloto migrado a Supabase. Género: ndombolo (música afro). Lanzamiento TUCUTÚ en preparación.',
  '{"vault_path": "06_CLIENTES/jot4r/", "afro_subgenre": "ndombolo"}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  updated_at = now();

-- =====================================================================
-- INSERT: project Lanzamiento TUCUTÚ
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
FROM clients c WHERE c.slug = 'jot4r'
RETURNING id;

-- =====================================================================
-- INSERT: runs ejecutados (4 agentes del pipeline pre-release)
-- =====================================================================

-- Helper: capturar IDs necesarios para los runs
WITH
  client_ref AS (SELECT id FROM clients WHERE slug = 'jot4r'),
  project_ref AS (SELECT id FROM projects WHERE name = 'Lanzamiento TUCUTÚ'),
  perfilador AS (SELECT id FROM agents WHERE slug = 'gs-perfilador-artista'),
  audit_redes AS (SELECT id FROM agents WHERE slug = 'gs-auditor-redes'),
  audit_musical AS (SELECT id FROM agents WHERE slug = 'gs-auditor-musical'),
  sintesis AS (SELECT id FROM agents WHERE slug = 'gs-sintesis-growth')

-- Insert 4 runs completados en orden de pipeline
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
  perfilador.id,
  client_ref.id,
  project_ref.id,
  'completed',
  now() - INTERVAL '14 days',
  now() - INTERVAL '14 days' + INTERVAL '45 minutes',
  '{"deliverable": "perfil-artista-jot4r.md", "consolidated": true}'::jsonb,
  '{"phase": "pre-release", "pipeline_step": 0}'::jsonb
FROM perfilador, client_ref, project_ref
UNION ALL
SELECT
  audit_redes.id,
  client_ref.id,
  project_ref.id,
  'completed',
  now() - INTERVAL '12 days',
  now() - INTERVAL '12 days' + INTERVAL '1 hour 20 minutes',
  '{"deliverable": "auditoria-redes-sociales.md", "consolidated": true}'::jsonb,
  '{"phase": "pre-release", "pipeline_step": 1}'::jsonb
FROM audit_redes, client_ref, project_ref
UNION ALL
SELECT
  audit_musical.id,
  client_ref.id,
  project_ref.id,
  'completed',
  now() - INTERVAL '10 days',
  now() - INTERVAL '10 days' + INTERVAL '1 hour 30 minutes',
  '{"deliverable": "auditoria-musical.md", "consolidated": true}'::jsonb,
  '{"phase": "pre-release", "pipeline_step": 2}'::jsonb
FROM audit_musical, client_ref, project_ref
UNION ALL
SELECT
  sintesis.id,
  client_ref.id,
  project_ref.id,
  'completed',
  now() - INTERVAL '7 days',
  now() - INTERVAL '7 days' + INTERVAL '2 hours',
  '{"deliverable": "sintesis-growth.md", "consolidated": true}'::jsonb,
  '{"phase": "pre-release", "pipeline_step": 3}'::jsonb
FROM sintesis, client_ref, project_ref;

-- =====================================================================
-- VERIFICATION QUERIES (run manually after applying)
-- =====================================================================

-- SELECT slug, display_name, artist_tier, genre FROM clients;
-- SELECT name, project_type, phase, status FROM projects;
-- SELECT a.slug, r.status, r.started_at, r.completed_at FROM runs r JOIN agents a ON r.agent_id = a.id ORDER BY r.started_at;
