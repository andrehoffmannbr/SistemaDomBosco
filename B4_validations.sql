-- B4 - Validações finais
-- Execute para verificar se tudo foi configurado corretamente

-- Cargos existentes
select id, name, is_custom from roles order by id;

-- Amostra de tab_access (módulos por cargo)
select id, jsonb_object_keys(tab_access) as module
from roles
order by id, module;

-- Perfis e cargo
select id, name, role, (tab_access is not null) as has_tab
from profiles
order by created_at desc
limit 20;

-- Verificar permissões específicas por cargo
select 
  r.id as role_id,
  r.name as role_name,
  r.tab_access->'clients'->>'view' as can_view_clients,
  r.tab_access->'schedules'->>'edit' as can_edit_schedules,
  r.tab_access->'funcionarios'->>'view' as can_view_funcionarios
from roles r
order by r.id;
