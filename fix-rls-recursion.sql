-- 🔧 Helper não-recursivo para checar admin
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

-- Garantir owner do function é o postgres/service (para funcionar com RLS)
revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated, anon;

-- 🔄 Reescrever as políticas que referenciam "profiles" por EXISTS, trocando por is_admin(auth.uid())

-- PROFILES
drop policy if exists "profiles_select_self_or_admin" on profiles;
drop policy if exists "profiles_update_self_or_admin" on profiles;

create policy "profiles_select_self_or_admin" on profiles
for select
using ( id = auth.uid() or public.is_admin(auth.uid()) );

create policy "profiles_update_self_or_admin" on profiles
for update
using ( id = auth.uid() or public.is_admin(auth.uid()) )
with check ( id = auth.uid() or public.is_admin(auth.uid()) );

-- CLIENTS
drop policy if exists "clients_select_owner_assigned_admin" on clients;
drop policy if exists "clients_insert_owner_or_admin" on clients;
drop policy if exists "clients_update_owner_or_admin" on clients;
drop policy if exists "clients_delete_admin_only" on clients;

create policy "clients_select_owner_assigned_admin" on clients
for select using (
  user_id = auth.uid()
  or auth.uid() = any (assigned_professional_uids)
  or public.is_admin(auth.uid())
);

create policy "clients_insert_owner_or_admin" on clients
for insert with check (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

create policy "clients_update_owner_or_admin" on clients
for update using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

create policy "clients_delete_admin_only" on clients
for delete using ( public.is_admin(auth.uid()) );

-- client_notes
drop policy if exists "client_notes_cud_owner_or_admin" on client_notes;
create policy "client_notes_cud_owner_or_admin" on client_notes
for all using (
  user_id = auth.uid() or public.is_admin(auth.uid())
)
with check (
  user_id = auth.uid() or public.is_admin(auth.uid())
);

-- schedules
drop policy if exists "schedules_select_owner_assigned_admin" on schedules;
create policy "schedules_select_owner_assigned_admin" on schedules
for select using (
  user_id = auth.uid()
  or assigned_to_user_uid = auth.uid()
  or public.is_admin(auth.uid())
);

-- daily_notes
drop policy if exists "daily_notes_owner_or_admin" on daily_notes;
create policy "daily_notes_owner_or_admin" on daily_notes
for all using ( user_id = auth.uid() or public.is_admin(auth.uid()) )
with check ( user_id = auth.uid() or public.is_admin(auth.uid()) );

-- general_documents
drop policy if exists "general_documents_owner_or_admin" on general_documents;
create policy "general_documents_owner_or_admin" on general_documents
for all using ( user_id = auth.uid() or public.is_admin(auth.uid()) )
with check ( user_id = auth.uid() or public.is_admin(auth.uid()) );

-- stock_items
drop policy if exists "stock_items_owner_or_admin" on stock_items;
create policy "stock_items_owner_or_admin" on stock_items
for all using ( user_id = auth.uid() or public.is_admin(auth.uid()) )
with check ( user_id = auth.uid() or public.is_admin(auth.uid()) );

-- stock_movements
drop policy if exists "stock_movements_owner_or_admin" on stock_movements;
create policy "stock_movements_owner_or_admin" on stock_movements
for all using ( user_id = auth.uid() or public.is_admin(auth.uid()) )
with check ( user_id = auth.uid() or public.is_admin(auth.uid()) );

-- notifications
drop policy if exists "notifications_owner_only" on notifications;
create policy "notifications_owner_only" on notifications
for all using ( user_id = auth.uid() )
with check ( user_id = auth.uid() );
