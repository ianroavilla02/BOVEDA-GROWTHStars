-- Fase 2 D-037/D-038: campos de fase/fecha/contexto/datos en cada nota
alter table press_notes add column if not exists fase text;
alter table press_notes add column if not exists fecha text;
alter table press_notes add column if not exists nota_contexto text;
alter table press_notes add column if not exists datos_duros text;
