-- Admin vê todos; demais: owner/assigned
drop policy if exists "schedules_select_owner_assigned_admin" on schedules;
drop policy if exists "admin_can_select_all_schedules" on schedules;
create policy "admin_can_select_all_schedules"
on schedules
for select
using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  or user_id = auth.uid()
  or assigned_to_user_uid = auth.uid()
);

-- Reforço de permissões no tab_access do admin
update profiles
set tab_access = jsonb_set(
  jsonb_set(
    jsonb_set(coalesce(tab_access,'{}'::jsonb),
      '{agenda}',    '{"view":true,"edit":true,"create":true,"delete":true}'::jsonb, true),
    '{schedule}',    '{"view":true,"edit":true,"create":true,"delete":true}'::jsonb, true),
  '{schedules}',     '{"view":true,"edit":true,"create":true,"delete":true,"confirm":true}'::jsonb, true)
where role = 'admin';
