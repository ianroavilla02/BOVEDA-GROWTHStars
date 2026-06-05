-- =====================================================================
-- G*S MGMT Module — Schema + Seed v1
-- Created: 2026-06-05
-- Tables: mgmt_engagements, mgmt_objectives, mgmt_meetings,
--         mgmt_deliverables, mgmt_monthly_reports (5 total)
-- References: clients (existing from schema v2)
-- Seed: 3 clients + 3 engagements + 9 objectives + 35 deliverables
-- =====================================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- STEP 1: Insert MGMT clients into existing clients table
-- =====================================================================

INSERT INTO clients (slug, display_name, artist_tier, country, genre, status, notes, metadata)
VALUES
  ('reckless', 'Reckless', 1, 'CO', NULL, 'active',
   'MGMT client. Proyecto de dirección artística, discovery y auditoría redes.',
   '{"service": "mgmt", "city": "Medellín", "manager": "SANCORT Mgmt (Santiago Anzola)"}'::jsonb),
  ('chimbita-records', 'Chimbita Records', 1, 'CO', NULL, 'active',
   'MGMT client. Sello/colectivo. Proyectos: Javier Ferreira x LitBari, Colectivo Mansión, Marlon EP.',
   '{"service": "mgmt", "city": "Medellín", "contact": "Santiago Restrepo Escobar", "cc": "1088350169"}'::jsonb),
  ('jared-la-j', 'Jared la J', 1, 'CO', NULL, 'active',
   'MGMT client via MoneyMade. Featuring, lanzamiento propio, evento Barranquilla.',
   '{"service": "mgmt", "city": "Medellín", "label": "MoneyMade"}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  updated_at = now();

-- =====================================================================
-- TABLE: mgmt_engagements
-- =====================================================================

CREATE TABLE mgmt_engagements (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id         UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  month             TEXT NOT NULL,
  invoice_number    TEXT,
  invoice_amount    NUMERIC(12, 2),
  invoice_currency  TEXT DEFAULT 'USD' CHECK (invoice_currency IN ('USD', 'COP')),
  duration_weeks    INTEGER DEFAULT 4,
  started_at        DATE,
  ends_at           DATE,
  status            TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'paused')),
  notes             TEXT,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mgmt_eng_client ON mgmt_engagements(client_id);
CREATE INDEX idx_mgmt_eng_month ON mgmt_engagements(month);
CREATE INDEX idx_mgmt_eng_status ON mgmt_engagements(status);
CREATE INDEX idx_mgmt_eng_dates ON mgmt_engagements(started_at, ends_at);
CREATE UNIQUE INDEX uq_mgmt_eng_client_month ON mgmt_engagements(client_id, month);

-- =====================================================================
-- TABLE: mgmt_objectives
-- =====================================================================

CREATE TABLE mgmt_objectives (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id       UUID NOT NULL REFERENCES mgmt_engagements(id) ON DELETE CASCADE,
  number              INTEGER NOT NULL,
  title               TEXT NOT NULL,
  subtitle            TEXT,
  description         TEXT,
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'delivered', 'approved', 'blocked', 'postponed')),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mgmt_obj_engagement ON mgmt_objectives(engagement_id);
CREATE UNIQUE INDEX uq_mgmt_obj_eng_number ON mgmt_objectives(engagement_id, number);

-- =====================================================================
-- TABLE: mgmt_meetings (hybrid Supabase + filesystem)
-- =====================================================================

CREATE TABLE mgmt_meetings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  objective_id      UUID NOT NULL REFERENCES mgmt_objectives(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN ('empalme', 'entrega', 'feedback')),
  scheduled_at      TIMESTAMPTZ,
  held_at           TIMESTAMPTZ,
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'documented', 'completed', 'cancelled', 'rescheduled')),
  summary           TEXT,
  document_path     TEXT,
  action_items      TEXT,
  attendees         TEXT[],
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mgmt_meet_objective ON mgmt_meetings(objective_id);
CREATE INDEX idx_mgmt_meet_type ON mgmt_meetings(type);
CREATE INDEX idx_mgmt_meet_status ON mgmt_meetings(status);
CREATE INDEX idx_mgmt_meet_document ON mgmt_meetings(document_path) WHERE document_path IS NOT NULL;

-- =====================================================================
-- TABLE: mgmt_deliverables
-- =====================================================================

CREATE TABLE mgmt_deliverables (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  objective_id    UUID NOT NULL REFERENCES mgmt_objectives(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  owner           TEXT NOT NULL DEFAULT 'team' CHECK (owner IN ('team', 'artist', 'both')),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'blocked', 'done', 'postponed')),
  due_date        DATE,
  completed_at    TIMESTAMPTZ,
  file_path       TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mgmt_del_objective ON mgmt_deliverables(objective_id);
CREATE INDEX idx_mgmt_del_owner ON mgmt_deliverables(owner);
CREATE INDEX idx_mgmt_del_status ON mgmt_deliverables(status);

-- =====================================================================
-- TABLE: mgmt_monthly_reports
-- =====================================================================

CREATE TABLE mgmt_monthly_reports (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id         UUID NOT NULL REFERENCES mgmt_engagements(id) ON DELETE CASCADE,
  generated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  objectives_total      INTEGER,
  objectives_met        INTEGER,
  objectives_delayed    INTEGER,
  deliverables_total    INTEGER,
  deliverables_done     INTEGER,
  deliverables_blocked  INTEGER,
  meetings_held         INTEGER,
  summary               TEXT,
  highlights            TEXT,
  blockers              TEXT,
  next_month_focus      TEXT,
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mgmt_report_engagement ON mgmt_monthly_reports(engagement_id);
CREATE UNIQUE INDEX uq_mgmt_report_engagement ON mgmt_monthly_reports(engagement_id);

-- =====================================================================
-- TRIGGERS
-- =====================================================================

CREATE TRIGGER trg_mgmt_engagements_updated_at
  BEFORE UPDATE ON mgmt_engagements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_mgmt_objectives_updated_at
  BEFORE UPDATE ON mgmt_objectives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_mgmt_meetings_updated_at
  BEFORE UPDATE ON mgmt_meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_mgmt_deliverables_updated_at
  BEFORE UPDATE ON mgmt_deliverables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- RLS
-- =====================================================================

ALTER TABLE mgmt_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE mgmt_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE mgmt_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mgmt_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE mgmt_monthly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_mgmt_engagements" ON mgmt_engagements FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_mgmt_objectives" ON mgmt_objectives FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_mgmt_meetings" ON mgmt_meetings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_mgmt_deliverables" ON mgmt_deliverables FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_mgmt_monthly_reports" ON mgmt_monthly_reports FOR ALL USING (auth.role() = 'service_role');

-- =====================================================================
-- VIEWS
-- =====================================================================

CREATE OR REPLACE VIEW v_mgmt_overview AS
SELECT
  e.id AS engagement_id, e.month, e.invoice_number, e.invoice_amount,
  e.invoice_currency, e.started_at, e.ends_at, e.status AS engagement_status,
  c.slug AS client_slug, c.display_name AS client_name,
  COUNT(DISTINCT o.id) AS total_objectives,
  COUNT(DISTINCT o.id) FILTER (WHERE o.status IN ('delivered', 'approved')) AS completed_objectives,
  COUNT(DISTINCT d.id) AS total_deliverables,
  COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'done') AS done_deliverables,
  COUNT(DISTINCT m.id) AS total_meetings,
  COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'completed') AS held_meetings
FROM mgmt_engagements e
JOIN clients c ON e.client_id = c.id
LEFT JOIN mgmt_objectives o ON o.engagement_id = e.id
LEFT JOIN mgmt_deliverables d ON d.objective_id = o.id
LEFT JOIN mgmt_meetings m ON m.objective_id = o.id
GROUP BY e.id, e.month, e.invoice_number, e.invoice_amount,
         e.invoice_currency, e.started_at, e.ends_at, e.status, c.slug, c.display_name
ORDER BY e.month DESC, c.display_name;

CREATE OR REPLACE VIEW v_mgmt_objective_detail AS
SELECT
  o.id AS objective_id, o.engagement_id, o.number, o.title, o.subtitle, o.status,
  c.slug AS client_slug, c.display_name AS client_name, e.month,
  COUNT(DISTINCT d.id) AS total_deliverables,
  COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'done') AS done_deliverables,
  COUNT(DISTINCT d.id) FILTER (WHERE d.owner = 'team') AS team_deliverables,
  COUNT(DISTINCT d.id) FILTER (WHERE d.owner = 'artist') AS artist_deliverables,
  COUNT(DISTINCT m.id) AS total_meetings,
  COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'completed') AS held_meetings
FROM mgmt_objectives o
JOIN mgmt_engagements e ON o.engagement_id = e.id
JOIN clients c ON e.client_id = c.id
LEFT JOIN mgmt_deliverables d ON d.objective_id = o.id
LEFT JOIN mgmt_meetings m ON m.objective_id = o.id
GROUP BY o.id, o.engagement_id, o.number, o.title, o.subtitle,
         o.status, c.slug, c.display_name, e.month
ORDER BY e.month DESC, c.display_name, o.number;

CREATE OR REPLACE VIEW v_mgmt_current_month AS
SELECT
  e.id AS engagement_id, e.month, e.invoice_amount, e.invoice_currency, e.status,
  c.slug AS client_slug, c.display_name AS client_name,
  COUNT(DISTINCT o.id) AS total_objectives,
  COUNT(DISTINCT o.id) FILTER (WHERE o.status IN ('delivered', 'approved')) AS completed_objectives,
  COUNT(DISTINCT d.id) AS total_deliverables,
  COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'done') AS done_deliverables,
  COUNT(DISTINCT d.id) FILTER (WHERE d.owner = 'team' AND d.status != 'done') AS team_pending,
  COUNT(DISTINCT d.id) FILTER (WHERE d.owner = 'artist' AND d.status != 'done') AS artist_pending,
  COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'scheduled' AND m.scheduled_at >= now()) AS upcoming_meetings
FROM mgmt_engagements e
JOIN clients c ON e.client_id = c.id
LEFT JOIN mgmt_objectives o ON o.engagement_id = e.id
LEFT JOIN mgmt_deliverables d ON d.objective_id = o.id
LEFT JOIN mgmt_meetings m ON m.objective_id = o.id
WHERE e.month = to_char(now(), 'YYYY-MM')
GROUP BY e.id, e.month, e.invoice_amount, e.invoice_currency, e.status, c.slug, c.display_name
ORDER BY c.display_name;

-- =====================================================================
-- SEED: 3 engagements
-- =====================================================================

INSERT INTO mgmt_engagements (client_id, month, invoice_number, invoice_amount, invoice_currency, duration_weeks, started_at, ends_at, notes)
SELECT c.id, '2026-06', '001', 1200.00, 'USD', 4, '2026-06-01', '2026-06-28',
  'Dirección Artística + Discovery Session + Auditoría Redes Sociales'
FROM clients c WHERE c.slug = 'reckless';

INSERT INTO mgmt_engagements (client_id, month, invoice_number, invoice_amount, invoice_currency, duration_weeks, started_at, ends_at, notes)
SELECT c.id, '2026-06', '001', 3000000.00, 'COP', 4, '2026-06-01', '2026-06-28',
  'Estrategia Sostenimiento + Nueva Era Creativa + Lanzamiento EP Amor Juvenil'
FROM clients c WHERE c.slug = 'chimbita-records';

INSERT INTO mgmt_engagements (client_id, month, invoice_number, invoice_amount, invoice_currency, duration_weeks, started_at, ends_at, notes)
SELECT c.id, '2026-06', '001', 800.00, 'USD', 4, '2026-06-01', '2026-06-28',
  'Estrategia de Apoyo (feat) + Estrategia Lanzamiento + Evento Barranquilla'
FROM clients c WHERE c.slug = 'jared-la-j';

-- =====================================================================
-- SEED: 9 objectives
-- =====================================================================

-- RECKLESS
WITH eng AS (SELECT e.id FROM mgmt_engagements e JOIN clients c ON e.client_id = c.id WHERE c.slug = 'reckless' AND e.month = '2026-06')
INSERT INTO mgmt_objectives (engagement_id, number, title, subtitle, description) VALUES
  ((SELECT id FROM eng), 1, 'Dirección Artística', 'Brand Book de la Era Musical',
   'Construcción del Manual de Marca de Era: define quién es la artista, cómo se ve, cómo se siente y cómo comunica.'),
  ((SELECT id FROM eng), 2, 'Discovery Session', 'Sesión de Escucha del Catálogo',
   'Exploración y validación musical orientada a alinear el sonido de la artista con el universo de marca.'),
  ((SELECT id FROM eng), 3, 'Auditoría Redes Sociales', 'Salud Algorítmica y Plan de Contenidos',
   'Diagnóstico y estrategia de contenidos basada en datos reales del comportamiento de la audiencia.');

-- CHIMBITA RECORDS
WITH eng AS (SELECT e.id FROM mgmt_engagements e JOIN clients c ON e.client_id = c.id WHERE c.slug = 'chimbita-records' AND e.month = '2026-06')
INSERT INTO mgmt_objectives (engagement_id, number, title, subtitle, description) VALUES
  ((SELECT id FROM eng), 1, 'Estrategia de Sostenimiento', 'Quien como yo? - Javier Ferreira x LitBari',
   'Acompañamiento del sencillo ya lanzado: narrativa de prensa, cronograma de activaciones, administración de contenido existente y preproducción orgánica.'),
  ((SELECT id FROM eng), 2, 'Nueva Era Creativa', 'Colectivo en Mansión (Plan de Trabajo 1 mes)',
   'Diseño de estrategia de contenidos para la convivencia del colectivo en la mansión: captura, sesiones, dinámica de grupo, plan de publicación.'),
  ((SELECT id FROM eng), 3, 'Lanzamiento de EP', 'Amor Juvenil - Marlon x ChimbitaRecords',
   'Estructuración de identidad del EP: presskit básico, estrategia de contenidos orgánicos, notas de prensa del mes con calendario de activaciones.');

-- JARED LA J
WITH eng AS (SELECT e.id FROM mgmt_engagements e JOIN clients c ON e.client_id = c.id WHERE c.slug = 'jared-la-j' AND e.month = '2026-06')
INSERT INTO mgmt_objectives (engagement_id, number, title, subtitle, description) VALUES
  ((SELECT id FROM eng), 1, 'Estrategia de Apoyo', 'Nanda Free (artista como Featuring)',
   'Estrategia para capitalizar la exposición del artista como featuring: contenido orgánico y gira de discotecas en Cali.'),
  ((SELECT id FROM eng), 2, 'Estrategia de Lanzamiento', 'PXRX NX Jared feat. Calao',
   'Estrategia de lanzamiento del sencillo propio: plan de videoclip, medios de prensa, preproducción de contenidos orgánicos.'),
  ((SELECT id FROM eng), 3, 'Evento en Barranquilla', 'Logística y Cubrimiento Show Carabin3',
   'Logística y cubrimiento de la presentación en Barranquilla donde el artista abrirá el show de Carabin3.');

-- =====================================================================
-- SEED: Deliverables (35 total)
-- =====================================================================

-- RECKLESS Meta 1 (10)
WITH obj AS (SELECT o.id FROM mgmt_objectives o JOIN mgmt_engagements e ON o.engagement_id = e.id JOIN clients c ON e.client_id = c.id WHERE c.slug = 'reckless' AND e.month = '2026-06' AND o.number = 1)
INSERT INTO mgmt_deliverables (objective_id, title, owner) VALUES
  ((SELECT id FROM obj), 'Manifiesto de la Era: identidad, faceta artística, espacio emocional', 'team'),
  ((SELECT id FROM obj), 'Narrativa y Storyworld: lugar, tiempo, atmósfera, arco emocional', 'team'),
  ((SELECT id FROM obj), 'Moodboard de Referencias Estéticas: selección visual y sonora', 'team'),
  ((SELECT id FROM obj), 'Oyente Ideal: perfil detallado del target', 'team'),
  ((SELECT id FROM obj), 'Pilares de Comunicación y Pitch Artístico', 'team'),
  ((SELECT id FROM obj), 'Logotipo oficial de la artista para esta era', 'team'),
  ((SELECT id FROM obj), 'Símbolo o ícono central identificador', 'team'),
  ((SELECT id FROM obj), 'Paleta de color con aplicaciones y restricciones', 'team'),
  ((SELECT id FROM obj), 'Tipografías principales y de apoyo', 'team'),
  ((SELECT id FROM obj), 'Motivos e iconografías secundarias', 'team');

-- RECKLESS Meta 2 (3)
WITH obj AS (SELECT o.id FROM mgmt_objectives o JOIN mgmt_engagements e ON o.engagement_id = e.id JOIN clients c ON e.client_id = c.id WHERE c.slug = 'reckless' AND e.month = '2026-06' AND o.number = 2)
INSERT INTO mgmt_deliverables (objective_id, title, owner) VALUES
  ((SELECT id FROM obj), 'Identificación del Tono de Voz y Escalas Musicales', 'team'),
  ((SELECT id FROM obj), 'Validación del Catálogo Existente vs nuevo branding', 'both'),
  ((SELECT id FROM obj), 'Directorio de Productores y Beatmakers compatibles', 'team');

-- RECKLESS Meta 3 (2)
WITH obj AS (SELECT o.id FROM mgmt_objectives o JOIN mgmt_engagements e ON o.engagement_id = e.id JOIN clients c ON e.client_id = c.id WHERE c.slug = 'reckless' AND e.month = '2026-06' AND o.number = 3)
INSERT INTO mgmt_deliverables (objective_id, title, owner) VALUES
  ((SELECT id FROM obj), 'Análisis Algorítmico: rendimiento histórico, patrones de alcance, engagement', 'team'),
  ((SELECT id FROM obj), 'Estrategia Snippet Testing: prueba de formatos cortos + plan mensual de contenidos', 'team');

-- CHIMBITA Meta 1 (4)
WITH obj AS (SELECT o.id FROM mgmt_objectives o JOIN mgmt_engagements e ON o.engagement_id = e.id JOIN clients c ON e.client_id = c.id WHERE c.slug = 'chimbita-records' AND e.month = '2026-06' AND o.number = 1)
INSERT INTO mgmt_deliverables (objective_id, title, owner) VALUES
  ((SELECT id FROM obj), 'Documento de Narrativa de Prensa del mes: ángulo central, mensajes clave', 'team'),
  ((SELECT id FROM obj), 'Calendario de Activaciones de Prensa: cronograma fechado de salidas y medios', 'team'),
  ((SELECT id FROM obj), 'Cronograma de Publicación del Contenido Existente: fechas, formatos, plataformas', 'team'),
  ((SELECT id FROM obj), 'Documento de Preproducción Orgánica: ideas y conceptos narrativos', 'team');

-- CHIMBITA Meta 2 (3)
WITH obj AS (SELECT o.id FROM mgmt_objectives o JOIN mgmt_engagements e ON o.engagement_id = e.id JOIN clients c ON e.client_id = c.id WHERE c.slug = 'chimbita-records' AND e.month = '2026-06' AND o.number = 2)
INSERT INTO mgmt_deliverables (objective_id, title, owner) VALUES
  ((SELECT id FROM obj), 'Estrategia de contenidos para convivencia en mansión', 'team'),
  ((SELECT id FROM obj), 'Plan de captura y publicación durante la estadía', 'team'),
  ((SELECT id FROM obj), 'Coordinar disponibilidad del colectivo para sesiones', 'artist');

-- CHIMBITA Meta 3 (3)
WITH obj AS (SELECT o.id FROM mgmt_objectives o JOIN mgmt_engagements e ON o.engagement_id = e.id JOIN clients c ON e.client_id = c.id WHERE c.slug = 'chimbita-records' AND e.month = '2026-06' AND o.number = 3)
INSERT INTO mgmt_deliverables (objective_id, title, owner) VALUES
  ((SELECT id FROM obj), 'Presskit Básico del EP: concepto, descripción, biografía, ángulos para prensa', 'team'),
  ((SELECT id FROM obj), 'Estrategia de Contenidos Orgánicos del EP: calendario de activaciones fechado', 'team'),
  ((SELECT id FROM obj), 'Notas de Prensa del mes: redacción + calendario de activaciones con fechas', 'team');

-- JARED Meta 1 (3)
WITH obj AS (SELECT o.id FROM mgmt_objectives o JOIN mgmt_engagements e ON o.engagement_id = e.id JOIN clients c ON e.client_id = c.id WHERE c.slug = 'jared-la-j' AND e.month = '2026-06' AND o.number = 1)
INSERT INTO mgmt_deliverables (objective_id, title, owner) VALUES
  ((SELECT id FROM obj), 'Documento de Preproducción de Contenido Orgánico: ideas, formatos, cronograma', 'team'),
  ((SELECT id FROM obj), 'Plan Logístico de Gira de Discotecas (1 fin de semana en Cali)', 'team'),
  ((SELECT id FROM obj), 'Entregar materiales y accesos para contenido de redes', 'artist');

-- JARED Meta 2 (4)
WITH obj AS (SELECT o.id FROM mgmt_objectives o JOIN mgmt_engagements e ON o.engagement_id = e.id JOIN clients c ON e.client_id = c.id WHERE c.slug = 'jared-la-j' AND e.month = '2026-06' AND o.number = 2)
INSERT INTO mgmt_deliverables (objective_id, title, owner) VALUES
  ((SELECT id FROM obj), 'Plan de Publicación del Videoclip: estrategia y cronograma de estreno', 'team'),
  ((SELECT id FROM obj), 'Estrategia de Medios de Prensa: narrativa central, notas de prensa, calendario', 'team'),
  ((SELECT id FROM obj), 'Documento de Preproducción de Contenidos Orgánicos (Social Marketing)', 'team'),
  ((SELECT id FROM obj), 'Entregar videoclip finalizado y assets del lanzamiento', 'artist');

-- JARED Meta 3 (3)
WITH obj AS (SELECT o.id FROM mgmt_objectives o JOIN mgmt_engagements e ON o.engagement_id = e.id JOIN clients c ON e.client_id = c.id WHERE c.slug = 'jared-la-j' AND e.month = '2026-06' AND o.number = 3)
INSERT INTO mgmt_deliverables (objective_id, title, owner) VALUES
  ((SELECT id FROM obj), 'Plan Logístico del Evento: coordinación operativa, cronograma, rider, traslados', 'team'),
  ((SELECT id FROM obj), 'Plan de Cubrimiento de Contenido: formatos de captura durante la presentación', 'team'),
  ((SELECT id FROM obj), 'Confirmar requerimientos técnicos y rider con venue', 'artist');

-- =====================================================================
-- VERIFICATION QUERIES
-- =====================================================================

-- SELECT * FROM v_mgmt_overview;
-- SELECT * FROM v_mgmt_current_month;
-- SELECT count(*) FROM mgmt_engagements;     -- Should be 3
-- SELECT count(*) FROM mgmt_objectives;      -- Should be 9
-- SELECT count(*) FROM mgmt_deliverables;    -- Should be 35
-- SELECT count(*) FROM mgmt_meetings;        -- Should be 0
-- SELECT count(*) FROM mgmt_monthly_reports; -- Should be 0
-- SELECT owner, count(*) FROM mgmt_deliverables GROUP BY owner;
