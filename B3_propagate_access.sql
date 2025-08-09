-- B3 - (Opcional) Propagar tab_access do cargo para profiles
-- Execute este script APÓS o B2, se desejar que profiles herdem tab_access dos cargos

-- Atualiza todos os perfis sem tab_access específico para herdar do cargo
update profiles p
set tab_access = r.tab_access
from roles r
where p.role = r.id
  and (p.tab_access is null or p.tab_access = '{}'::jsonb);

-- Exemplo: trocar o cargo de um usuário específico e aplicar tab_access desse cargo
-- (substitua pelo UUID do usuário real)
-- update profiles
-- set role = 'diretor',
--     tab_access = (select tab_access from roles where id='diretor')
-- where id = 'SEU-UUID-AQUI';

-- Verificar resultado
select id, name, role, (tab_access is not null) as has_tab_access
from profiles
order by created_at desc;
