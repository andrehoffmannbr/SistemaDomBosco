-- B4 - Validações finais e Triggers de Segurança
-- Execute para verificar se tudo foi configurado corretamente

-- 1. Função para prevenir alteração não autorizada de role
CREATE OR REPLACE FUNCTION prevent_unauthorized_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a role está sendo alterada
  IF NEW.role <> OLD.role THEN
    -- Verificar se quem está alterando é diretor
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'director'
    ) THEN
      RAISE EXCEPTION 'Apenas diretor pode alterar role de usuários';
    END IF;
  END IF;
  
  -- Se tab_access está sendo alterado para algo personalizado
  IF NEW.tab_access IS DISTINCT FROM OLD.tab_access THEN
    -- Log da alteração
    RAISE NOTICE 'tab_access alterado para usuário %: % -> %', NEW.name, OLD.tab_access, NEW.tab_access;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger para aplicar a validação
DROP TRIGGER IF EXISTS trg_prevent_unauthorized_role_change ON public.profiles;
CREATE TRIGGER trg_prevent_unauthorized_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_unauthorized_role_change();

-- 3. Função para validar dados obrigatórios em profiles
CREATE OR REPLACE FUNCTION validate_profile_required_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Role não pode ser NULL ou vazio
  IF NEW.role IS NULL OR char_length(NEW.role) = 0 THEN
    RAISE EXCEPTION 'Role é obrigatório para todos os usuários';
  END IF;
  
  -- Name não pode ser NULL ou vazio
  IF NEW.name IS NULL OR char_length(trim(NEW.name)) = 0 THEN
    RAISE EXCEPTION 'Nome é obrigatório para todos os usuários';
  END IF;
  
  -- Garantir que tab_access nunca seja NULL
  IF NEW.tab_access IS NULL THEN
    NEW.tab_access = '{}'::jsonb;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger para validar campos obrigatórios
DROP TRIGGER IF EXISTS trg_validate_profile_fields ON public.profiles;
CREATE TRIGGER trg_validate_profile_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION validate_profile_required_fields();

-- 5. Função para verificar integridade do sistema
CREATE OR REPLACE FUNCTION check_system_integrity()
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Verificar usuários sem role
  RETURN QUERY
  SELECT 
    'users_without_role'::TEXT,
    CASE WHEN count(*) = 0 THEN 'OK' ELSE 'ERRO' END::TEXT,
    format('%s usuários sem role', count(*))::TEXT
  FROM profiles 
  WHERE role IS NULL OR role = '';
  
  -- Verificar roles inválidas
  RETURN QUERY
  SELECT 
    'invalid_roles'::TEXT,
    CASE WHEN count(*) = 0 THEN 'OK' ELSE 'ERRO' END::TEXT,
    format('%s roles com dados inválidos', count(*))::TEXT
  FROM roles 
  WHERE id IS NULL OR id = '' OR name IS NULL OR name = '';
  
  -- Verificar usuários com roles inexistentes
  RETURN QUERY
  SELECT 
    'orphaned_user_roles'::TEXT,
    CASE WHEN count(*) = 0 THEN 'OK' ELSE 'ERRO' END::TEXT,
    format('%s usuários com roles inexistentes', count(*))::TEXT
  FROM profiles p
  LEFT JOIN roles r ON p.role = r.id
  WHERE r.id IS NULL;
  
  -- Verificar usuários sem tab_access
  RETURN QUERY
  SELECT 
    'users_without_tab_access'::TEXT,
    CASE WHEN count(*) = 0 THEN 'OK' ELSE 'AVISO' END::TEXT,
    format('%s usuários sem tab_access', count(*))::TEXT
  FROM profiles 
  WHERE tab_access IS NULL OR tab_access::text = '{}';
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. VERIFICAÇÕES E RELATÓRIOS

-- Executar verificação de integridade
SELECT * FROM check_system_integrity();

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

-- Verificar se triggers foram criados
SELECT 
  trigger_name, 
  event_object_table, 
  action_timing, 
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND (trigger_name LIKE '%prevent%' OR trigger_name LIKE '%validate%')
ORDER BY event_object_table, trigger_name;
