-- =====================================================================
-- Migración: project_assets + proyecto TENTACIÓN
-- Fecha: 2026-08-02
-- Autor: G*S Operador / CTO
-- Propósito: persistir assets de lanzamientos vinculados a projects
-- =====================================================================

-- -----------------------------------------------------------------
-- 1. Tabla nueva: project_assets (aditiva, sin tocar producción)
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_assets (
    id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id   uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    post_key     text NOT NULL,        -- id estable del post del calendario (del initialDb)
    phase        text,                 -- prerelease | releaseday | postrelease
    storage_path text NOT NULL,        -- path en bucket mgmt-deliverables
    file_name    text NOT NULL,
    mime_type    text,
    file_size    bigint,
    boveda_path  text,                 -- null hasta que exista la copia local (fast-follow)
    status       text NOT NULL DEFAULT 'uploaded',  -- uploading | uploaded | error
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_assets_project ON public.project_assets (project_id);
CREATE INDEX IF NOT EXISTS idx_project_assets_post ON public.project_assets (project_id, post_key);

ALTER TABLE public.project_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "service_role_all_project_assets"
  ON public.project_assets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------
-- 2. Proyecto TENTACIÓN para Marlon Villamil (idempotente)
-- -----------------------------------------------------------------
-- Reemplazar <marlon_client_id> con el UUID real de clients.slug = 'marlon-villamil'
-- Reemplazar <marlon_artist_id> con el UUID real de artists.slug = 'marlon-villamil' o NULL

-- INSERT INTO public.projects (
--     client_id,
--     artist_id,
--     name,
--     project_type,
--     phase,
--     release_date,
--     notes,
--     metadata
-- )
-- VALUES (
--     '<marlon_client_id>',
--     <marlon_artist_id_or_null>,
--     'TENTACIÓN',
--     'lanzamiento',
--     'pre-release',
--     '2026-08-01',
--     'Primer single del EP AMOR ADOLESCENTE. Lanzamiento 1 ago 2026.',
--     '{"campaign_slug": "tentacion", "ep": "AMOR ADOLESCENTE"}'::jsonb
-- )
-- ON CONFLICT (client_id, name) DO NOTHING;

-- Nota: projects tiene UNIQUE constraint implícito por PK; si existe (client_id, name)
-- duplicado, ajustar según constraint real del schema vivo.
