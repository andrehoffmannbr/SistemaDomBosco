-- sql/rls_profiles_users.sql

-- Habilitar RLS (idempotente)
alter table if exists profiles enable row level security;

-- Remover políticas antigas com nomes conflitantes (opcional/seguro)
drop policy if exists profiles_select_self_or_admin on profiles;
drop policy if exists profiles_update_self_or_admin on profiles;
drop policy if exists profiles_insert_admin_or_director on profiles;

-- SELECT: próprio perfil ou admin/diretor vê tudo
create policy profiles_select_self_or_admin
on profiles
for select
using (
  id = auth.uid()
  or exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role in ('admin','director')
  )
);

-- UPDATE: próprio perfil OU admin/diretor pode editar qualquer perfil
create policy profiles_update_self_or_admin
on profiles
for update
using (
  id = auth.uid()
  or exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role in ('admin','director')
  )
)
with check (
  id = auth.uid()
  or exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role in ('admin','director')
  )
);

-- INSERT: somente admin/diretor podem inserir perfis para qualquer usuário
create policy profiles_insert_admin_or_director
on profiles
for insert
with check (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role in ('admin','director')
  )
);
