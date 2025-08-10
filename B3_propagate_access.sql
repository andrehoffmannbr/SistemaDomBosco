-- B3 - (Opcional) Propagar tab_access do cargo para profiles
-- Execute este script APÓS o B2, se desejar que profiles herdem tab_access dos cargos
-- Melhorado para preservar permissões customizadas

-- Função para propagar permissões apenas para usuários sem permissões customizadas
CREATE OR REPLACE FUNCTION propagate_role_permissions()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER := 0;
BEGIN
  -- Atualiza apenas profiles que têm tab_access NULL ou vazio
  -- Preserva permissões customizadas de usuários
  UPDATE public.profiles p
  SET tab_access = r.tab_access
  FROM public.roles r
  WHERE p.role = r.id
    AND (p.tab_access IS NULL OR p.tab_access::text = '{}'::text OR p.tab_access::text = 'null'::text);
    
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  RAISE NOTICE 'Atualizados % profiles com permissões padrão da role', affected_rows;
  
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar a propagação (preservando customizações)
SELECT propagate_role_permissions();

-- Atualização manual direta (CUIDADO: sobrescreve customizações)
-- Descomente apenas se quiser forçar reset de todas as permissões
/*
update profiles p
set tab_access = r.tab_access
from roles r
where p.role = r.id
  and (p.tab_access is null or p.tab_access = '{}'::jsonb);
*/

-- Exemplo: trocar o cargo de um usuário específico e aplicar tab_access desse cargo
-- (substitua pelo UUID do usuário real)
-- update profiles
-- set role = 'diretor',
--     tab_access = (select tab_access from roles where id='diretor')
-- where id = 'SEU-UUID-AQUI';

-- Verificar resultado
select 
  id, 
  name, 
  email, 
  role,
  CASE 
    WHEN tab_access IS NULL THEN 'NULL'
    WHEN tab_access::text = '{}' THEN 'VAZIO'
    ELSE 'CUSTOMIZADO'
  END as tab_access_status
from profiles
order by role, created_at desc;
