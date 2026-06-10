-- =====================================================================
-- Meetings v2: secondary_tasks + meeting_objective_links
-- Fecha: 2026-06-10
-- Aplicar en: gs-growthstars-prod (Supabase SQL Editor)
-- =====================================================================

-- secondary_tasks: misiones que salen de reuniones, NO son entregables.
-- Ligadas a cliente directamente. meeting_id opcional (puede venir de
-- contexto externo, no solo de una reunión registrada).
create table secondary_tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  meeting_id uuid references mgmt_meetings(id) on delete set null,
  descripcion text not null,
  status text not null default 'pendiente'
    check (status in ('pendiente','en_progreso','hecha','descartada')),
  para_cristian boolean not null default true,
  enviada_cristian boolean not null default false,
  created_at timestamptz default now()
);

create index idx_secondary_tasks_client on secondary_tasks(client_id);
create index idx_secondary_tasks_status on secondary_tasks(status);

alter table secondary_tasks enable row level security;
create policy "service_role_all_secondary_tasks" on secondary_tasks
  for all to service_role using (true) with check (true);

-- meeting_objective_links: una reunión puede tocar uno o varios objetivos.
-- IA sugiere (confirmed=false), Ian confirma en review (confirmed=true).
-- Actualmente meetings ya tiene objective_id (1:1), pero este modelo
-- permite N:M sin romper el FK existente.
create table meeting_objective_links (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references mgmt_meetings(id) on delete cascade,
  objective_id uuid not null references mgmt_objectives(id) on delete cascade,
  confirmed boolean not null default false,
  rationale text,
  created_at timestamptz default now(),
  unique (meeting_id, objective_id)
);

create index idx_mol_meeting on meeting_objective_links(meeting_id);
create index idx_mol_objective on meeting_objective_links(objective_id);

alter table meeting_objective_links enable row level security;
create policy "service_role_all_mol" on meeting_objective_links
  for all to service_role using (true) with check (true);
