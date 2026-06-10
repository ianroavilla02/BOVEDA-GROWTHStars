-- D-050: responsable de la misión secundaria (reemplaza para_cristian)
-- Aplicar en: gs-growthstars-prod (Supabase SQL Editor)
-- Fecha: 2026-06-10

alter table secondary_tasks add column if not exists assigned_to text
  check (assigned_to in ('santiago','ian','cristian','artista','equipo_artista'));

-- Migrar datos existentes: para_cristian=true -> cristian
update secondary_tasks set assigned_to = 'cristian'
  where para_cristian = true and assigned_to is null;
