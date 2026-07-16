-- =====================================================================
-- G*S Postgres Schema vivo exportado desde gs-growthstars-prod
-- Fecha: 2026-07-16 01:15:07
-- Herramienta: pg_dump (solo schema public)
-- Excluido: schemas de sistema (auth, storage, pgbouncer, extensions, realtime, supabase_functions, cron, graphql, graphql_public, net, pgsodium, vault)
-- Proposito: reproducibilidad del schema G*S (DT-046)
-- Ritual: regenerar despues de cada migracion manual en Supabase
-- =====================================================================

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: agent_invocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_invocations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    artist_slug text,
    agent_slug text NOT NULL,
    task_summary text,
    tokens_input integer,
    tokens_output integer,
    status text DEFAULT 'success'::text NOT NULL,
    output_path text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: agents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agents (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    panel text NOT NULL,
    group_name text,
    subgroup text,
    workspace text NOT NULL,
    role text,
    description text,
    version text DEFAULT '1.0'::text,
    status text DEFAULT 'active'::text,
    pipeline_order integer,
    config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT agents_panel_check CHECK ((panel = ANY (ARRAY['directivo'::text, 'maestro'::text, 'operativo'::text]))),
    CONSTRAINT agents_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'archived'::text]))),
    CONSTRAINT agents_workspace_check CHECK ((workspace = ANY (ARRAY['growth'::text, 'contenido'::text])))
);


--
-- Name: artist_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artist_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    artist_id uuid NOT NULL,
    label text NOT NULL,
    url text,
    file_path text,
    attachment_type text DEFAULT 'link'::text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT artist_links_attachment_type_check CHECK ((attachment_type = ANY (ARRAY['link'::text, 'file'::text]))),
    CONSTRAINT artist_links_category_check CHECK ((category = ANY (ARRAY['brandbook'::text, 'guia-tecnica'::text, 'biolink'::text, 'auditoria'::text, 'general'::text])))
);


--
-- Name: artists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    stage_name text NOT NULL,
    real_name text,
    status text DEFAULT 'active'::text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    label_client_id uuid
);


--
-- Name: ataraxia_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ataraxia_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    cat text DEFAULT 'Otros'::text NOT NULL,
    cost integer DEFAULT 0 NOT NULL,
    price integer DEFAULT 0 NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ataraxia_sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ataraxia_sales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id uuid,
    name text NOT NULL,
    cat text NOT NULL,
    qty integer DEFAULT 1 NOT NULL,
    price integer DEFAULT 0 NOT NULL,
    cost integer DEFAULT 0 NOT NULL,
    method text NOT NULL,
    ts timestamp with time zone DEFAULT now(),
    CONSTRAINT ataraxia_sales_method_check CHECK ((method = ANY (ARRAY['efectivo'::text, 'nequi'::text, 'tarjeta'::text])))
);


--
-- Name: business_month_snapshot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_month_snapshot (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mes text NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    slug text NOT NULL,
    display_name text NOT NULL,
    artist_tier integer,
    status text DEFAULT 'active'::text,
    country text,
    genre text,
    contact_info jsonb DEFAULT '{}'::jsonb,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    type text,
    CONSTRAINT clients_artist_tier_check CHECK ((artist_tier = ANY (ARRAY[1, 2, 3]))),
    CONSTRAINT clients_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'archived'::text]))),
    CONSTRAINT clients_type_check CHECK ((type = ANY (ARRAY['sello'::text, 'inversor'::text, 'artista'::text])))
);


--
-- Name: cuentas_cobro; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cuentas_cobro (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    consecutivo text NOT NULL,
    linea text NOT NULL,
    proyecto text,
    artista text,
    cliente_pagador text,
    monto numeric NOT NULL,
    moneda text NOT NULL,
    fecha date NOT NULL,
    emisor text,
    estado text NOT NULL,
    client_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    artist_id uuid
);


--
-- Name: findings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.findings (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    run_id uuid NOT NULL,
    agent_id uuid NOT NULL,
    client_id uuid,
    project_id uuid,
    type text NOT NULL,
    title text NOT NULL,
    content text,
    data jsonb DEFAULT '{}'::jsonb,
    confidence numeric(3,2),
    consolidated boolean DEFAULT false,
    consolidated_to text,
    consolidated_at timestamp with time zone,
    tags text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT findings_confidence_check CHECK (((confidence >= (0)::numeric) AND (confidence <= (1)::numeric)))
);


--
-- Name: jot4r_cactus_club; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jot4r_cactus_club (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    name text,
    city text,
    instagram text,
    whatsapp text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: jot4r_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jot4r_leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    source text DEFAULT 'landing_tucutu'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: jot4r_meta_export; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.jot4r_meta_export AS
 SELECT lower(TRIM(BOTH FROM l.email)) AS email,
        CASE
            WHEN ((c.whatsapp IS NULL) OR (btrim(c.whatsapp) = ''::text)) THEN NULL::text
            WHEN (regexp_replace(c.whatsapp, '\D'::text, ''::text, 'g'::text) ~ '^57\d{10}$'::text) THEN ('+'::text || regexp_replace(c.whatsapp, '\D'::text, ''::text, 'g'::text))
            WHEN (length(regexp_replace(c.whatsapp, '\D'::text, ''::text, 'g'::text)) = 10) THEN ('+57'::text || regexp_replace(c.whatsapp, '\D'::text, ''::text, 'g'::text))
            ELSE ('+'::text || regexp_replace(c.whatsapp, '\D'::text, ''::text, 'g'::text))
        END AS phone,
    lower(split_part(btrim(c.name), ' '::text, 1)) AS fn,
    lower(NULLIF(btrim(substr(btrim(c.name), (length(split_part(btrim(c.name), ' '::text, 1)) + 2))), ''::text)) AS ln,
    lower(btrim(c.city)) AS ct,
    'co'::text AS country,
    (c.email IS NOT NULL) AS cactus_club,
    l.source,
    l.created_at
   FROM (public.jot4r_leads l
     LEFT JOIN public.jot4r_cactus_club c USING (email));


--
-- Name: meeting_objective_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meeting_objective_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    meeting_id uuid NOT NULL,
    objective_id uuid NOT NULL,
    confirmed boolean DEFAULT false NOT NULL,
    rationale text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: mgmt_deliverables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mgmt_deliverables (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    objective_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    owner text DEFAULT 'team'::text NOT NULL,
    status text DEFAULT 'pending'::text,
    due_date date,
    completed_at timestamp with time zone,
    file_path text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    attachment_type text,
    CONSTRAINT mgmt_deliverables_attachment_type_check CHECK ((attachment_type = ANY (ARRAY['pdf'::text, 'md'::text, 'link'::text]))),
    CONSTRAINT mgmt_deliverables_owner_check CHECK ((owner = ANY (ARRAY['team'::text, 'artist'::text, 'both'::text]))),
    CONSTRAINT mgmt_deliverables_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'blocked'::text, 'done'::text, 'postponed'::text])))
);


--
-- Name: mgmt_engagements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mgmt_engagements (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    client_id uuid NOT NULL,
    month text NOT NULL,
    invoice_number text,
    invoice_amount numeric(12,2),
    invoice_currency text DEFAULT 'USD'::text,
    duration_weeks integer DEFAULT 4,
    started_at date,
    ends_at date,
    status text DEFAULT 'active'::text,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    service_line_id uuid,
    CONSTRAINT mgmt_engagements_invoice_currency_check CHECK ((invoice_currency = ANY (ARRAY['USD'::text, 'COP'::text]))),
    CONSTRAINT mgmt_engagements_status_check CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text, 'paused'::text])))
);


--
-- Name: mgmt_meetings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mgmt_meetings (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    objective_id uuid,
    type text NOT NULL,
    scheduled_at timestamp with time zone,
    held_at timestamp with time zone,
    status text DEFAULT 'pending'::text,
    summary text,
    document_path text,
    action_items text,
    attendees text[],
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    artist_id uuid,
    title text,
    meeting_status text DEFAULT 'scheduled'::text,
    meeting_type text DEFAULT 'seguimiento'::text,
    agenda jsonb DEFAULT '[]'::jsonb,
    post_notes jsonb DEFAULT '[]'::jsonb,
    transcript_url text,
    transcript_filename text,
    transcript_text text,
    CONSTRAINT mgmt_meetings_meeting_status_check CHECK ((meeting_status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text]))),
    CONSTRAINT mgmt_meetings_meeting_type_check CHECK ((meeting_type = ANY (ARRAY['seguimiento'::text, 'onboarding'::text, 'revision'::text, 'planificacion'::text, 'otro'::text]))),
    CONSTRAINT mgmt_meetings_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'scheduled'::text, 'documented'::text, 'completed'::text, 'cancelled'::text, 'rescheduled'::text]))),
    CONSTRAINT mgmt_meetings_type_check CHECK ((type = ANY (ARRAY['empalme'::text, 'entrega'::text, 'feedback'::text])))
);


--
-- Name: mgmt_monthly_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mgmt_monthly_reports (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    engagement_id uuid NOT NULL,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    objectives_total integer,
    objectives_met integer,
    objectives_delayed integer,
    deliverables_total integer,
    deliverables_done integer,
    deliverables_blocked integer,
    meetings_held integer,
    summary text,
    highlights text,
    blockers text,
    next_month_focus text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: mgmt_objectives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mgmt_objectives (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    engagement_id uuid NOT NULL,
    number integer NOT NULL,
    title text NOT NULL,
    subtitle text,
    description text,
    status text DEFAULT 'pending'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    artist_id uuid,
    CONSTRAINT mgmt_objectives_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'delivered'::text, 'approved'::text, 'blocked'::text, 'postponed'::text])))
);


--
-- Name: press_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.press_batches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    artist_slug text NOT NULL,
    objetivo_percepcion text,
    arco jsonb,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    plan_raw text,
    client_slug text,
    CONSTRAINT chk_origen CHECK (((objetivo_percepcion IS NOT NULL) OR (plan_raw IS NOT NULL))),
    CONSTRAINT press_batches_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'arco_aprobado'::text, 'generando'::text, 'generado'::text, 'cerrado'::text])))
);


--
-- Name: press_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.press_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    batch_id uuid NOT NULL,
    beat_index integer NOT NULL,
    titular text,
    content text,
    status text DEFAULT 'pending'::text NOT NULL,
    rating integer,
    created_at timestamp with time zone DEFAULT now(),
    fase text,
    fecha text,
    nota_contexto text,
    datos_duros text,
    CONSTRAINT press_notes_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT press_notes_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'discarded'::text])))
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    client_id uuid NOT NULL,
    name text NOT NULL,
    project_type text NOT NULL,
    package_price_usd numeric(10,2),
    package_price_cop numeric(15,2),
    status text DEFAULT 'active'::text,
    phase text,
    release_date date,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    artist_id uuid,
    subservice_id uuid,
    CONSTRAINT projects_phase_check CHECK ((phase = ANY (ARRAY['pre-release'::text, 'release'::text, 'post-release'::text, 'done'::text, 'pre-produccion'::text, 'produccion'::text, 'post-produccion'::text, 'entregado'::text]))),
    CONSTRAINT projects_project_type_check CHECK ((project_type = ANY (ARRAY['lanzamiento'::text, 'videoclip'::text, 'cubrimiento'::text, 'sesion-contenido'::text, 'sesion-fotos'::text, 'booking'::text, 'estrategia-growth'::text, 'visualizer'::text, 'otro'::text]))),
    CONSTRAINT projects_status_check CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text, 'paused'::text])))
);


--
-- Name: runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.runs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    agent_id uuid NOT NULL,
    parent_run_id uuid,
    client_id uuid,
    project_id uuid,
    status text DEFAULT 'pending'::text,
    input_data jsonb DEFAULT '{}'::jsonb,
    output_data jsonb DEFAULT '{}'::jsonb,
    tokens_input integer,
    tokens_output integer,
    cost_usd numeric(10,4),
    duration_ms integer,
    handoff_to uuid,
    handoff_payload jsonb,
    error_message text,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT runs_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])))
);


--
-- Name: secondary_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.secondary_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    meeting_id uuid,
    descripcion text NOT NULL,
    status text DEFAULT 'pendiente'::text NOT NULL,
    para_cristian boolean DEFAULT true NOT NULL,
    enviada_cristian boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    assigned_to text,
    archived boolean DEFAULT false NOT NULL,
    artist_id uuid,
    CONSTRAINT secondary_tasks_assigned_to_check CHECK ((assigned_to = ANY (ARRAY['santiago'::text, 'ian'::text, 'cristian'::text, 'artista'::text, 'equipo_artista'::text]))),
    CONSTRAINT secondary_tasks_status_check CHECK ((status = ANY (ARRAY['pendiente'::text, 'en_progreso'::text, 'hecha'::text, 'descartada'::text])))
);


--
-- Name: service_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    artist_id uuid NOT NULL,
    service_type_id uuid NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: service_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: subservices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subservices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_type_id uuid NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: trm_daily; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trm_daily (
    date date NOT NULL,
    trm numeric(10,2) NOT NULL,
    source text DEFAULT 'manual'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: v_active_projects; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_active_projects AS
SELECT
    NULL::uuid AS id,
    NULL::text AS name,
    NULL::text AS project_type,
    NULL::text AS status,
    NULL::text AS phase,
    NULL::numeric(10,2) AS package_price_usd,
    NULL::numeric(15,2) AS package_price_cop,
    NULL::date AS release_date,
    NULL::uuid AS artist_id,
    NULL::text AS client_name,
    NULL::text AS client_slug,
    NULL::text AS artist_name,
    NULL::text AS artist_slug,
    NULL::bigint AS total_runs,
    NULL::bigint AS completed_runs;


--
-- Name: v_active_runs; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_active_runs AS
 SELECT r.id,
    r.status,
    a.slug AS agent_slug,
    a.name AS agent_name,
    c.display_name AS client_name,
    p.name AS project_name,
    r.started_at,
    EXTRACT(epoch FROM (now() - r.started_at)) AS duration_seconds
   FROM (((public.runs r
     JOIN public.agents a ON ((r.agent_id = a.id)))
     LEFT JOIN public.clients c ON ((r.client_id = c.id)))
     LEFT JOIN public.projects p ON ((r.project_id = p.id)))
  WHERE (r.status = ANY (ARRAY['pending'::text, 'running'::text]))
  ORDER BY r.started_at DESC;


--
-- Name: v_agent_costs_30d; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_agent_costs_30d AS
 SELECT a.slug,
    a.name,
    count(r.id) AS run_count,
    COALESCE(sum(r.cost_usd), (0)::numeric) AS total_cost_usd,
    COALESCE(sum(r.tokens_input), (0)::bigint) AS total_tokens_in,
    COALESCE(sum(r.tokens_output), (0)::bigint) AS total_tokens_out
   FROM (public.agents a
     LEFT JOIN public.runs r ON (((a.id = r.agent_id) AND (r.completed_at >= (now() - '30 days'::interval)))))
  GROUP BY a.id, a.slug, a.name
  ORDER BY COALESCE(sum(r.cost_usd), (0)::numeric) DESC;


--
-- Name: v_mgmt_current_month; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_mgmt_current_month AS
 SELECT e.id AS engagement_id,
    e.month,
    e.invoice_amount,
    e.invoice_currency,
    e.status,
    c.slug AS client_slug,
    c.display_name AS client_name,
    count(DISTINCT o.id) AS total_objectives,
    count(DISTINCT o.id) FILTER (WHERE (o.status = ANY (ARRAY['delivered'::text, 'approved'::text]))) AS completed_objectives,
    count(DISTINCT d.id) AS total_deliverables,
    count(DISTINCT d.id) FILTER (WHERE (d.status = 'done'::text)) AS done_deliverables,
    count(DISTINCT d.id) FILTER (WHERE ((d.owner = 'team'::text) AND (d.status <> 'done'::text))) AS team_pending,
    count(DISTINCT d.id) FILTER (WHERE ((d.owner = 'artist'::text) AND (d.status <> 'done'::text))) AS artist_pending,
    count(DISTINCT m.id) FILTER (WHERE ((m.status = 'scheduled'::text) AND (m.scheduled_at >= now()))) AS upcoming_meetings
   FROM ((((public.mgmt_engagements e
     JOIN public.clients c ON ((e.client_id = c.id)))
     LEFT JOIN public.mgmt_objectives o ON ((o.engagement_id = e.id)))
     LEFT JOIN public.mgmt_deliverables d ON ((d.objective_id = o.id)))
     LEFT JOIN public.mgmt_meetings m ON ((m.objective_id = o.id)))
  WHERE (e.month = to_char(now(), 'YYYY-MM'::text))
  GROUP BY e.id, e.month, e.invoice_amount, e.invoice_currency, e.status, c.slug, c.display_name
  ORDER BY c.display_name;


--
-- Name: v_mgmt_objective_detail; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_mgmt_objective_detail AS
 SELECT o.id AS objective_id,
    o.engagement_id,
    o.number,
    o.title,
    o.subtitle,
    o.status,
    c.slug AS client_slug,
    c.display_name AS client_name,
    e.month,
    count(DISTINCT d.id) AS total_deliverables,
    count(DISTINCT d.id) FILTER (WHERE (d.status = 'done'::text)) AS done_deliverables,
    count(DISTINCT d.id) FILTER (WHERE (d.owner = 'team'::text)) AS team_deliverables,
    count(DISTINCT d.id) FILTER (WHERE (d.owner = 'artist'::text)) AS artist_deliverables,
    count(DISTINCT m.id) AS total_meetings,
    count(DISTINCT m.id) FILTER (WHERE (m.status = 'completed'::text)) AS held_meetings
   FROM ((((public.mgmt_objectives o
     JOIN public.mgmt_engagements e ON ((o.engagement_id = e.id)))
     JOIN public.clients c ON ((e.client_id = c.id)))
     LEFT JOIN public.mgmt_deliverables d ON ((d.objective_id = o.id)))
     LEFT JOIN public.mgmt_meetings m ON ((m.objective_id = o.id)))
  GROUP BY o.id, o.engagement_id, o.number, o.title, o.subtitle, o.status, c.slug, c.display_name, e.month
  ORDER BY e.month DESC, c.display_name, o.number;


--
-- Name: v_mgmt_overview; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_mgmt_overview AS
 SELECT e.id AS engagement_id,
    e.month,
    e.invoice_number,
    e.invoice_amount,
    e.invoice_currency,
    e.started_at,
    e.ends_at,
    e.status AS engagement_status,
    c.slug AS client_slug,
    c.display_name AS client_name,
    count(DISTINCT o.id) AS total_objectives,
    count(DISTINCT o.id) FILTER (WHERE (o.status = ANY (ARRAY['delivered'::text, 'approved'::text]))) AS completed_objectives,
    count(DISTINCT d.id) AS total_deliverables,
    count(DISTINCT d.id) FILTER (WHERE (d.status = 'done'::text)) AS done_deliverables,
    count(DISTINCT m.id) AS total_meetings,
    count(DISTINCT m.id) FILTER (WHERE (m.status = 'completed'::text)) AS held_meetings
   FROM ((((public.mgmt_engagements e
     JOIN public.clients c ON ((e.client_id = c.id)))
     LEFT JOIN public.mgmt_objectives o ON ((o.engagement_id = e.id)))
     LEFT JOIN public.mgmt_deliverables d ON ((d.objective_id = o.id)))
     LEFT JOIN public.mgmt_meetings m ON ((m.objective_id = o.id)))
  GROUP BY e.id, e.month, e.invoice_number, e.invoice_amount, e.invoice_currency, e.started_at, e.ends_at, e.status, c.slug, c.display_name
  ORDER BY e.month DESC, c.display_name;


--
-- Name: v_pending_consolidation; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_pending_consolidation AS
 SELECT f.id,
    f.title,
    a.slug AS agent_slug,
    c.display_name AS client_name,
    p.name AS project_name,
    f.created_at
   FROM (((public.findings f
     JOIN public.agents a ON ((f.agent_id = a.id)))
     LEFT JOIN public.clients c ON ((f.client_id = c.id)))
     LEFT JOIN public.projects p ON ((f.project_id = p.id)))
  WHERE (f.consolidated = false)
  ORDER BY f.created_at DESC;


--
-- Name: agent_invocations agent_invocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_invocations
    ADD CONSTRAINT agent_invocations_pkey PRIMARY KEY (id);


--
-- Name: agents agents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_pkey PRIMARY KEY (id);


--
-- Name: agents agents_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_slug_key UNIQUE (slug);


--
-- Name: artist_links artist_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_links
    ADD CONSTRAINT artist_links_pkey PRIMARY KEY (id);


--
-- Name: artists artists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artists
    ADD CONSTRAINT artists_pkey PRIMARY KEY (id);


--
-- Name: artists artists_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artists
    ADD CONSTRAINT artists_slug_key UNIQUE (slug);


--
-- Name: ataraxia_items ataraxia_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ataraxia_items
    ADD CONSTRAINT ataraxia_items_pkey PRIMARY KEY (id);


--
-- Name: ataraxia_sales ataraxia_sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ataraxia_sales
    ADD CONSTRAINT ataraxia_sales_pkey PRIMARY KEY (id);


--
-- Name: business_month_snapshot business_month_snapshot_mes_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_month_snapshot
    ADD CONSTRAINT business_month_snapshot_mes_key UNIQUE (mes);


--
-- Name: business_month_snapshot business_month_snapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_month_snapshot
    ADD CONSTRAINT business_month_snapshot_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: clients clients_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_slug_key UNIQUE (slug);


--
-- Name: cuentas_cobro cuentas_cobro_consecutivo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_cobro
    ADD CONSTRAINT cuentas_cobro_consecutivo_key UNIQUE (consecutivo);


--
-- Name: cuentas_cobro cuentas_cobro_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_cobro
    ADD CONSTRAINT cuentas_cobro_pkey PRIMARY KEY (id);


--
-- Name: findings findings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.findings
    ADD CONSTRAINT findings_pkey PRIMARY KEY (id);


--
-- Name: jot4r_cactus_club jot4r_cactus_club_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jot4r_cactus_club
    ADD CONSTRAINT jot4r_cactus_club_email_key UNIQUE (email);


--
-- Name: jot4r_cactus_club jot4r_cactus_club_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jot4r_cactus_club
    ADD CONSTRAINT jot4r_cactus_club_pkey PRIMARY KEY (id);


--
-- Name: jot4r_leads jot4r_leads_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jot4r_leads
    ADD CONSTRAINT jot4r_leads_email_key UNIQUE (email);


--
-- Name: jot4r_leads jot4r_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jot4r_leads
    ADD CONSTRAINT jot4r_leads_pkey PRIMARY KEY (id);


--
-- Name: meeting_objective_links meeting_objective_links_meeting_id_objective_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_objective_links
    ADD CONSTRAINT meeting_objective_links_meeting_id_objective_id_key UNIQUE (meeting_id, objective_id);


--
-- Name: meeting_objective_links meeting_objective_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_objective_links
    ADD CONSTRAINT meeting_objective_links_pkey PRIMARY KEY (id);


--
-- Name: mgmt_deliverables mgmt_deliverables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mgmt_deliverables
    ADD CONSTRAINT mgmt_deliverables_pkey PRIMARY KEY (id);


--
-- Name: mgmt_engagements mgmt_engagements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mgmt_engagements
    ADD CONSTRAINT mgmt_engagements_pkey PRIMARY KEY (id);


--
-- Name: mgmt_meetings mgmt_meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mgmt_meetings
    ADD CONSTRAINT mgmt_meetings_pkey PRIMARY KEY (id);


--
-- Name: mgmt_monthly_reports mgmt_monthly_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mgmt_monthly_reports
    ADD CONSTRAINT mgmt_monthly_reports_pkey PRIMARY KEY (id);


--
-- Name: mgmt_objectives mgmt_objectives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mgmt_objectives
    ADD CONSTRAINT mgmt_objectives_pkey PRIMARY KEY (id);


--
-- Name: press_batches press_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.press_batches
    ADD CONSTRAINT press_batches_pkey PRIMARY KEY (id);


--
-- Name: press_notes press_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.press_notes
    ADD CONSTRAINT press_notes_pkey PRIMARY KEY (id);


--
-- Name: projects projects_client_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_client_name_unique UNIQUE (client_id, name);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: runs runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.runs
    ADD CONSTRAINT runs_pkey PRIMARY KEY (id);


--
-- Name: secondary_tasks secondary_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secondary_tasks
    ADD CONSTRAINT secondary_tasks_pkey PRIMARY KEY (id);


--
-- Name: service_lines service_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_lines
    ADD CONSTRAINT service_lines_pkey PRIMARY KEY (id);


--
-- Name: service_types service_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_types
    ADD CONSTRAINT service_types_pkey PRIMARY KEY (id);


--
-- Name: service_types service_types_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_types
    ADD CONSTRAINT service_types_slug_key UNIQUE (slug);


--
-- Name: subservices subservices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subservices
    ADD CONSTRAINT subservices_pkey PRIMARY KEY (id);


--
-- Name: subservices subservices_service_type_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subservices
    ADD CONSTRAINT subservices_service_type_id_slug_key UNIQUE (service_type_id, slug);


--
-- Name: trm_daily trm_daily_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trm_daily
    ADD CONSTRAINT trm_daily_pkey PRIMARY KEY (date);


--
-- Name: idx_agents_panel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agents_panel ON public.agents USING btree (panel);


--
-- Name: idx_agents_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agents_slug ON public.agents USING btree (slug);


--
-- Name: idx_agents_workspace; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agents_workspace ON public.agents USING btree (workspace);


--
-- Name: idx_artist_links_artist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_artist_links_artist ON public.artist_links USING btree (artist_id);


--
-- Name: idx_clients_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_slug ON public.clients USING btree (slug);


--
-- Name: idx_clients_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_status ON public.clients USING btree (status);


--
-- Name: idx_findings_agent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_findings_agent ON public.findings USING btree (agent_id);


--
-- Name: idx_findings_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_findings_client ON public.findings USING btree (client_id);


--
-- Name: idx_findings_consolidated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_findings_consolidated ON public.findings USING btree (consolidated) WHERE (consolidated = false);


--
-- Name: idx_findings_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_findings_project ON public.findings USING btree (project_id);


--
-- Name: idx_findings_run; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_findings_run ON public.findings USING btree (run_id);


--
-- Name: idx_findings_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_findings_type ON public.findings USING btree (type);


--
-- Name: idx_mgmt_del_objective; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mgmt_del_objective ON public.mgmt_deliverables USING btree (objective_id);


--
-- Name: idx_mgmt_del_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mgmt_del_owner ON public.mgmt_deliverables USING btree (owner);


--
-- Name: idx_mgmt_del_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mgmt_del_status ON public.mgmt_deliverables USING btree (status);


--
-- Name: idx_mgmt_eng_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mgmt_eng_client ON public.mgmt_engagements USING btree (client_id);


--
-- Name: idx_mgmt_eng_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mgmt_eng_dates ON public.mgmt_engagements USING btree (started_at, ends_at);


--
-- Name: idx_mgmt_eng_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mgmt_eng_month ON public.mgmt_engagements USING btree (month);


--
-- Name: idx_mgmt_eng_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mgmt_eng_status ON public.mgmt_engagements USING btree (status);


--
-- Name: idx_mgmt_meet_document; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mgmt_meet_document ON public.mgmt_meetings USING btree (document_path) WHERE (document_path IS NOT NULL);


--
-- Name: idx_mgmt_meet_objective; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mgmt_meet_objective ON public.mgmt_meetings USING btree (objective_id);


--
-- Name: idx_mgmt_meet_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mgmt_meet_status ON public.mgmt_meetings USING btree (status);


--
-- Name: idx_mgmt_meet_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mgmt_meet_type ON public.mgmt_meetings USING btree (type);


--
-- Name: idx_mgmt_obj_engagement; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mgmt_obj_engagement ON public.mgmt_objectives USING btree (engagement_id);


--
-- Name: idx_mgmt_report_engagement; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mgmt_report_engagement ON public.mgmt_monthly_reports USING btree (engagement_id);


--
-- Name: idx_mol_meeting; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mol_meeting ON public.meeting_objective_links USING btree (meeting_id);


--
-- Name: idx_mol_objective; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mol_objective ON public.meeting_objective_links USING btree (objective_id);


--
-- Name: idx_press_batches_artist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_press_batches_artist ON public.press_batches USING btree (artist_slug);


--
-- Name: idx_press_notes_flywheel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_press_notes_flywheel ON public.press_notes USING btree (batch_id, status, rating);


--
-- Name: idx_projects_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_client ON public.projects USING btree (client_id);


--
-- Name: idx_projects_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_status ON public.projects USING btree (status);


--
-- Name: idx_projects_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_type ON public.projects USING btree (project_type);


--
-- Name: idx_runs_agent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_runs_agent ON public.runs USING btree (agent_id);


--
-- Name: idx_runs_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_runs_client ON public.runs USING btree (client_id);


--
-- Name: idx_runs_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_runs_parent ON public.runs USING btree (parent_run_id);


--
-- Name: idx_runs_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_runs_project ON public.runs USING btree (project_id);


--
-- Name: idx_runs_started_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_runs_started_at ON public.runs USING btree (started_at DESC);


--
-- Name: idx_runs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_runs_status ON public.runs USING btree (status);


--
-- Name: idx_secondary_tasks_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_secondary_tasks_client ON public.secondary_tasks USING btree (client_id);


--
-- Name: idx_secondary_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_secondary_tasks_status ON public.secondary_tasks USING btree (status);


--
-- Name: uq_mgmt_eng_client_month; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_mgmt_eng_client_month ON public.mgmt_engagements USING btree (client_id, month);


--
-- Name: uq_mgmt_obj_eng_number; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_mgmt_obj_eng_number ON public.mgmt_objectives USING btree (engagement_id, number);


--
-- Name: uq_mgmt_report_engagement; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_mgmt_report_engagement ON public.mgmt_monthly_reports USING btree (engagement_id);


--
-- Name: uq_runs_parent_agent; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_runs_parent_agent ON public.runs USING btree (parent_run_id, agent_id) WHERE (parent_run_id IS NOT NULL);


--
-- Name: v_active_projects _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.v_active_projects AS
 SELECT p.id,
    p.name,
    p.project_type,
    p.status,
    p.phase,
    p.package_price_usd,
    p.package_price_cop,
    p.release_date,
    p.artist_id,
    c.display_name AS client_name,
    c.slug AS client_slug,
    a.stage_name AS artist_name,
    a.slug AS artist_slug,
    count(r.id) AS total_runs,
    count(
        CASE
            WHEN (r.status = 'completed'::text) THEN 1
            ELSE NULL::integer
        END) AS completed_runs
   FROM (((public.projects p
     JOIN public.clients c ON ((p.client_id = c.id)))
     LEFT JOIN public.artists a ON ((p.artist_id = a.id)))
     LEFT JOIN public.runs r ON ((p.id = r.project_id)))
  WHERE (p.status = 'active'::text)
  GROUP BY p.id, c.display_name, c.slug, a.stage_name, a.slug
  ORDER BY p.created_at DESC;


--
-- Name: agents trg_agents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: clients trg_clients_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: mgmt_deliverables trg_mgmt_deliverables_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_mgmt_deliverables_updated_at BEFORE UPDATE ON public.mgmt_deliverables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: mgmt_engagements trg_mgmt_engagements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_mgmt_engagements_updated_at BEFORE UPDATE ON public.mgmt_engagements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: mgmt_meetings trg_mgmt_meetings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_mgmt_meetings_updated_at BEFORE UPDATE ON public.mgmt_meetings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: mgmt_objectives trg_mgmt_objectives_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_mgmt_objectives_updated_at BEFORE UPDATE ON public.mgmt_objectives FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projects trg_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: agent_invocations agent_invocations_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_invocations
    ADD CONSTRAINT agent_invocations_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: artist_links artist_links_artist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_links
    ADD CONSTRAINT artist_links_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(id) ON DELETE CASCADE;


--
-- Name: artists artists_label_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artists
    ADD CONSTRAINT artists_label_client_id_fkey FOREIGN KEY (label_client_id) REFERENCES public.clients(id);


--
-- Name: ataraxia_sales ataraxia_sales_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ataraxia_sales
    ADD CONSTRAINT ataraxia_sales_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.ataraxia_items(id) ON DELETE SET NULL;


--
-- Name: cuentas_cobro cuentas_cobro_artist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_cobro
    ADD CONSTRAINT cuentas_cobro_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(id);


--
-- Name: findings findings_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.findings
    ADD CONSTRAINT findings_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE RESTRICT;


--
-- Name: findings findings_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.findings
    ADD CONSTRAINT findings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: findings findings_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.findings
    ADD CONSTRAINT findings_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: findings findings_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.findings
    ADD CONSTRAINT findings_run_id_fkey FOREIGN KEY (run_id) REFERENCES public.runs(id) ON DELETE CASCADE;


--
-- Name: meeting_objective_links meeting_objective_links_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_objective_links
    ADD CONSTRAINT meeting_objective_links_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.mgmt_meetings(id) ON DELETE CASCADE;


--
-- Name: meeting_objective_links meeting_objective_links_objective_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_objective_links
    ADD CONSTRAINT meeting_objective_links_objective_id_fkey FOREIGN KEY (objective_id) REFERENCES public.mgmt_objectives(id) ON DELETE CASCADE;


--
-- Name: mgmt_deliverables mgmt_deliverables_objective_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mgmt_deliverables
    ADD CONSTRAINT mgmt_deliverables_objective_id_fkey FOREIGN KEY (objective_id) REFERENCES public.mgmt_objectives(id) ON DELETE CASCADE;


--
-- Name: mgmt_engagements mgmt_engagements_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mgmt_engagements
    ADD CONSTRAINT mgmt_engagements_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE RESTRICT;


--
-- Name: mgmt_engagements mgmt_engagements_service_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mgmt_engagements
    ADD CONSTRAINT mgmt_engagements_service_line_id_fkey FOREIGN KEY (service_line_id) REFERENCES public.service_lines(id);


--
-- Name: mgmt_meetings mgmt_meetings_artist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mgmt_meetings
    ADD CONSTRAINT mgmt_meetings_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(id);


--
-- Name: mgmt_meetings mgmt_meetings_objective_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mgmt_meetings
    ADD CONSTRAINT mgmt_meetings_objective_id_fkey FOREIGN KEY (objective_id) REFERENCES public.mgmt_objectives(id) ON DELETE CASCADE;


--
-- Name: mgmt_monthly_reports mgmt_monthly_reports_engagement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mgmt_monthly_reports
    ADD CONSTRAINT mgmt_monthly_reports_engagement_id_fkey FOREIGN KEY (engagement_id) REFERENCES public.mgmt_engagements(id) ON DELETE CASCADE;


--
-- Name: mgmt_objectives mgmt_objectives_artist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mgmt_objectives
    ADD CONSTRAINT mgmt_objectives_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(id);


--
-- Name: mgmt_objectives mgmt_objectives_engagement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mgmt_objectives
    ADD CONSTRAINT mgmt_objectives_engagement_id_fkey FOREIGN KEY (engagement_id) REFERENCES public.mgmt_engagements(id) ON DELETE CASCADE;


--
-- Name: press_batches press_batches_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.press_batches
    ADD CONSTRAINT press_batches_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: press_notes press_notes_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.press_notes
    ADD CONSTRAINT press_notes_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.press_batches(id) ON DELETE CASCADE;


--
-- Name: projects projects_artist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(id);


--
-- Name: projects projects_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE RESTRICT;


--
-- Name: projects projects_subservice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_subservice_id_fkey FOREIGN KEY (subservice_id) REFERENCES public.subservices(id);


--
-- Name: runs runs_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.runs
    ADD CONSTRAINT runs_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE RESTRICT;


--
-- Name: runs runs_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.runs
    ADD CONSTRAINT runs_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: runs runs_handoff_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.runs
    ADD CONSTRAINT runs_handoff_to_fkey FOREIGN KEY (handoff_to) REFERENCES public.agents(id);


--
-- Name: runs runs_parent_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.runs
    ADD CONSTRAINT runs_parent_run_id_fkey FOREIGN KEY (parent_run_id) REFERENCES public.runs(id);


--
-- Name: runs runs_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.runs
    ADD CONSTRAINT runs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: secondary_tasks secondary_tasks_artist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secondary_tasks
    ADD CONSTRAINT secondary_tasks_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(id);


--
-- Name: secondary_tasks secondary_tasks_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secondary_tasks
    ADD CONSTRAINT secondary_tasks_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: secondary_tasks secondary_tasks_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secondary_tasks
    ADD CONSTRAINT secondary_tasks_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.mgmt_meetings(id) ON DELETE SET NULL;


--
-- Name: service_lines service_lines_artist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_lines
    ADD CONSTRAINT service_lines_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(id);


--
-- Name: service_lines service_lines_service_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_lines
    ADD CONSTRAINT service_lines_service_type_id_fkey FOREIGN KEY (service_type_id) REFERENCES public.service_types(id);


--
-- Name: subservices subservices_service_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subservices
    ADD CONSTRAINT subservices_service_type_id_fkey FOREIGN KEY (service_type_id) REFERENCES public.service_types(id);


--
-- Name: agent_invocations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agent_invocations ENABLE ROW LEVEL SECURITY;

--
-- Name: agents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

--
-- Name: jot4r_cactus_club anon_insert_club; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anon_insert_club ON public.jot4r_cactus_club FOR INSERT TO anon WITH CHECK (true);


--
-- Name: jot4r_leads anon_insert_leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anon_insert_leads ON public.jot4r_leads FOR INSERT TO anon WITH CHECK (true);


--
-- Name: artists anon_read_artist; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anon_read_artist ON public.artists FOR SELECT USING ((status = 'active'::text));


--
-- Name: artist_links anon_read_artist_links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anon_read_artist_links ON public.artist_links FOR SELECT USING ((artist_id IN ( SELECT artists.id
   FROM public.artists
  WHERE (artists.status = 'active'::text))));


--
-- Name: clients anon_read_clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anon_read_clients ON public.clients FOR SELECT USING ((status = 'active'::text));


--
-- Name: mgmt_deliverables anon_read_deliverables; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anon_read_deliverables ON public.mgmt_deliverables FOR SELECT USING ((objective_id IN ( SELECT mgmt_objectives.id
   FROM public.mgmt_objectives
  WHERE (mgmt_objectives.engagement_id IN ( SELECT mgmt_engagements.id
           FROM public.mgmt_engagements
          WHERE (mgmt_engagements.status = 'active'::text))))));


--
-- Name: mgmt_engagements anon_read_engagements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anon_read_engagements ON public.mgmt_engagements FOR SELECT USING ((status = 'active'::text));


--
-- Name: mgmt_objectives anon_read_objectives; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anon_read_objectives ON public.mgmt_objectives FOR SELECT USING ((engagement_id IN ( SELECT mgmt_engagements.id
   FROM public.mgmt_engagements
  WHERE (mgmt_engagements.status = 'active'::text))));


--
-- Name: secondary_tasks anon_read_secondary_tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anon_read_secondary_tasks ON public.secondary_tasks FOR SELECT USING (((artist_id IN ( SELECT artists.id
   FROM public.artists
  WHERE (artists.status = 'active'::text))) AND (archived = false)));


--
-- Name: service_lines anon_read_service_lines; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anon_read_service_lines ON public.service_lines FOR SELECT USING ((artist_id IN ( SELECT artists.id
   FROM public.artists
  WHERE (artists.status = 'active'::text))));


--
-- Name: service_types anon_read_service_types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anon_read_service_types ON public.service_types FOR SELECT USING (true);


--
-- Name: artist_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artist_links ENABLE ROW LEVEL SECURITY;

--
-- Name: artists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

--
-- Name: ataraxia_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ataraxia_items ENABLE ROW LEVEL SECURITY;

--
-- Name: ataraxia_items ataraxia_items_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ataraxia_items_all ON public.ataraxia_items USING (true) WITH CHECK (true);


--
-- Name: ataraxia_sales; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ataraxia_sales ENABLE ROW LEVEL SECURITY;

--
-- Name: ataraxia_sales ataraxia_sales_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ataraxia_sales_all ON public.ataraxia_sales USING (true) WITH CHECK (true);


--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: findings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;

--
-- Name: jot4r_cactus_club; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.jot4r_cactus_club ENABLE ROW LEVEL SECURITY;

--
-- Name: jot4r_leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.jot4r_leads ENABLE ROW LEVEL SECURITY;

--
-- Name: meeting_objective_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.meeting_objective_links ENABLE ROW LEVEL SECURITY;

--
-- Name: mgmt_deliverables; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mgmt_deliverables ENABLE ROW LEVEL SECURITY;

--
-- Name: mgmt_engagements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mgmt_engagements ENABLE ROW LEVEL SECURITY;

--
-- Name: mgmt_meetings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mgmt_meetings ENABLE ROW LEVEL SECURITY;

--
-- Name: mgmt_monthly_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mgmt_monthly_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: mgmt_objectives; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mgmt_objectives ENABLE ROW LEVEL SECURITY;

--
-- Name: press_batches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.press_batches ENABLE ROW LEVEL SECURITY;

--
-- Name: press_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.press_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;

--
-- Name: secondary_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.secondary_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: service_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: artist_links service_role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service_role full access" ON public.artist_links USING (true) WITH CHECK (true);


--
-- Name: agent_invocations service_role_all_agent_invocations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_all_agent_invocations ON public.agent_invocations TO service_role USING (true) WITH CHECK (true);


--
-- Name: agents service_role_all_agents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_all_agents ON public.agents USING ((auth.role() = 'service_role'::text));


--
-- Name: clients service_role_all_clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_all_clients ON public.clients USING ((auth.role() = 'service_role'::text));


--
-- Name: findings service_role_all_findings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_all_findings ON public.findings USING ((auth.role() = 'service_role'::text));


--
-- Name: mgmt_deliverables service_role_all_mgmt_deliverables; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_all_mgmt_deliverables ON public.mgmt_deliverables USING ((auth.role() = 'service_role'::text));


--
-- Name: mgmt_engagements service_role_all_mgmt_engagements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_all_mgmt_engagements ON public.mgmt_engagements USING ((auth.role() = 'service_role'::text));


--
-- Name: mgmt_meetings service_role_all_mgmt_meetings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_all_mgmt_meetings ON public.mgmt_meetings USING ((auth.role() = 'service_role'::text));


--
-- Name: mgmt_monthly_reports service_role_all_mgmt_monthly_reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_all_mgmt_monthly_reports ON public.mgmt_monthly_reports USING ((auth.role() = 'service_role'::text));


--
-- Name: mgmt_objectives service_role_all_mgmt_objectives; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_all_mgmt_objectives ON public.mgmt_objectives USING ((auth.role() = 'service_role'::text));


--
-- Name: meeting_objective_links service_role_all_mol; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_all_mol ON public.meeting_objective_links TO service_role USING (true) WITH CHECK (true);


--
-- Name: press_batches service_role_all_press_batches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_all_press_batches ON public.press_batches TO service_role USING (true) WITH CHECK (true);


--
-- Name: press_notes service_role_all_press_notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_all_press_notes ON public.press_notes TO service_role USING (true) WITH CHECK (true);


--
-- Name: projects service_role_all_projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_all_projects ON public.projects USING ((auth.role() = 'service_role'::text));


--
-- Name: runs service_role_all_runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_all_runs ON public.runs USING ((auth.role() = 'service_role'::text));


--
-- Name: secondary_tasks service_role_all_secondary_tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_all_secondary_tasks ON public.secondary_tasks TO service_role USING (true) WITH CHECK (true);


--
-- Name: trm_daily service_role_all_trm; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_all_trm ON public.trm_daily USING ((auth.role() = 'service_role'::text));


--
-- Name: service_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

--
-- Name: subservices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subservices ENABLE ROW LEVEL SECURITY;

--
-- Name: trm_daily; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trm_daily ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


