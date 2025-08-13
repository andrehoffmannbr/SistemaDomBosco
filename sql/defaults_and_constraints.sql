-- sql/defaults_and_constraints.sql

-- Garantir que tab_access nunca é nulo e vem vazio por padrão
alter table if exists profiles
  alter column tab_access set default '{}'::jsonb;

update profiles
  set tab_access = '{}'::jsonb
where tab_access is null;
