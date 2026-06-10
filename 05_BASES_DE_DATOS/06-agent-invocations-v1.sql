-- Agent Invocations — logging híbrido mínimo (D-024)
-- Los textos completos viven en filesystem; acá solo audit trail.

CREATE TABLE IF NOT EXISTS agent_invocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  artist_slug TEXT,                 -- subcarpeta artistas/<slug> si aplica
  agent_slug TEXT NOT NULL,
  task_summary TEXT,                -- primeros 200 chars de la tarea
  tokens_input INTEGER,
  tokens_output INTEGER,
  status TEXT NOT NULL DEFAULT 'success',  -- success | failed
  output_path TEXT,                 -- path del .md si se guardó (D-025 manual)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE agent_invocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_agent_invocations"
  ON agent_invocations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
