-- Patch SQL seguro — tabela profiles
-- Execute este script no SQL Editor do Supabase para garantir a estrutura correta

-- Garante a tabela (se você já tiver, esse bloco pode ser ignorado)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role text,
  tab_access jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Corrige/garante colunas sem quebrar o que já existe
alter table public.profiles
  add column if not exists name text,
  add column if not exists role text,
  add column if not exists tab_access jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamp with time zone default now();

-- Garante a FK (se não existir)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;
  end if;
end$$;

-- Observação: como a função usa Service Role, o RLS é ignorado — então não precisa de policy para esse insert.
