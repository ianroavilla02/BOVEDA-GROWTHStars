-- migration: press_batches + press_notes (Fase 2, D-032/D-033)
create table press_batches (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  artist_slug text not null,
  objetivo_percepcion text not null,
  arco jsonb,
  status text not null default 'draft'
    check (status in ('draft','arco_aprobado','generado','cerrado')),
  created_at timestamptz default now()
);

create table press_notes (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references press_batches(id) on delete cascade,
  beat_index int not null,
  titular text,
  content text,
  status text not null default 'pending'
    check (status in ('pending','approved','discarded')),
  rating int check (rating between 1 and 5),
  created_at timestamptz default now()
);

create index idx_press_batches_artist on press_batches(artist_slug);
create index idx_press_notes_flywheel on press_notes(batch_id, status, rating);

alter table press_batches enable row level security;
alter table press_notes enable row level security;
create policy "service_role_all_press_batches" on press_batches for all to service_role using (true) with check (true);
create policy "service_role_all_press_notes" on press_notes for all to service_role using (true) with check (true);
