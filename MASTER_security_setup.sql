-- MASTER SCRIPT: Configuração Completa de Segurança
-- Execute este script no SQL Editor do Supabase para aplicar todas as correções
-- OU execute os arquivos individuais na ordem especificada

-- ORDEM DE EXECUÇÃO:
-- 1. setup-roles.sql (constraints e roles básicos)
-- 2. B2_upsert_roles.sql (roles com validações)
-- 3. B3_propagate_access.sql (propagação segura de permissões)
-- 4. setup-stock-rls.sql (RLS para estoque)
-- 5. B4_validations.sql (triggers e validações finais)

BEGIN;

-- ========================================
-- PASSO 1: CONSTRAINTS DE SEGURANÇA
-- ========================================

-- Garante que nenhuma role inválida seja criada
ALTER TABLE public.roles
  ADD CONSTRAINT IF NOT EXISTS roles_id_not_empty CHECK (char_length(id) > 0),
  ADD CONSTRAINT IF NOT EXISTS roles_name_not_empty CHECK (char_length(name) > 0);

-- Garante que todo usuário tenha role (não pode ser NULL)
ALTER TABLE public.profiles
  ALTER COLUMN role SET NOT NULL;

-- Garante que todo usuário novo tenha tab_access coerente (não NULL)
ALTER TABLE public.profiles
  ALTER COLUMN tab_access SET DEFAULT '{}'::jsonb;

-- ========================================
-- PASSO 2: FUNÇÕES DE SEGURANÇA
-- ========================================

-- Função para upsert seguro de roles
CREATE OR REPLACE FUNCTION upsert_role_safe(
  p_id TEXT,
  p_name TEXT,
  p_tab_access JSONB DEFAULT NULL,
  p_isCustom BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
  IF char_length(p_id) = 0 THEN
    RAISE EXCEPTION 'Role ID não pode ser vazio';
  END IF;
  
  IF char_length(p_name) = 0 THEN
    RAISE EXCEPTION 'Role name não pode ser vazio';
  END IF;

  INSERT INTO public.roles (id, name, is_custom, tab_access)
  VALUES (
    p_id,
    p_name,
    p_isCustom,
    COALESCE(p_tab_access, '{}'::jsonb)
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    tab_access = COALESCE(EXCLUDED.tab_access, '{}'::jsonb),
    is_custom = EXCLUDED.is_custom;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para propagar permissões preservando customizações
CREATE OR REPLACE FUNCTION propagate_role_permissions()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER := 0;
BEGIN
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

-- ========================================
-- PASSO 3: TRIGGERS DE VALIDAÇÃO
-- ========================================

-- Prevenir alteração não autorizada de role
CREATE OR REPLACE FUNCTION prevent_unauthorized_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role <> OLD.role THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'director'
    ) THEN
      RAISE EXCEPTION 'Apenas diretor pode alterar role de usuários';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_unauthorized_role_change ON public.profiles;
CREATE TRIGGER trg_prevent_unauthorized_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_unauthorized_role_change();

-- Validar campos obrigatórios
CREATE OR REPLACE FUNCTION validate_profile_required_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS NULL OR char_length(NEW.role) = 0 THEN
    RAISE EXCEPTION 'Role é obrigatório para todos os usuários';
  END IF;
  
  IF NEW.name IS NULL OR char_length(trim(NEW.name)) = 0 THEN
    RAISE EXCEPTION 'Nome é obrigatório para todos os usuários';
  END IF;
  
  IF NEW.tab_access IS NULL THEN
    NEW.tab_access = '{}'::jsonb;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_validate_profile_fields ON public.profiles;
CREATE TRIGGER trg_validate_profile_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION validate_profile_required_fields();

-- ========================================
-- PASSO 4: EXECUTAR CONFIGURAÇÕES
-- ========================================

-- Propagar permissões (preservando customizações)
SELECT propagate_role_permissions();

-- ========================================
-- PASSO 5: VERIFICAÇÃO FINAL
-- ========================================

-- Função para verificar integridade
CREATE OR REPLACE FUNCTION check_system_integrity()
RETURNS TABLE(check_name TEXT, status TEXT, details TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 'users_without_role'::TEXT,
    CASE WHEN count(*) = 0 THEN 'OK' ELSE 'ERRO' END::TEXT,
    format('%s usuários sem role', count(*))::TEXT
  FROM profiles WHERE role IS NULL OR role = '';
  
  RETURN QUERY
  SELECT 'invalid_roles'::TEXT,
    CASE WHEN count(*) = 0 THEN 'OK' ELSE 'ERRO' END::TEXT,
    format('%s roles com dados inválidos', count(*))::TEXT
  FROM roles WHERE id IS NULL OR id = '' OR name IS NULL OR name = '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar verificação
SELECT * FROM check_system_integrity();

COMMIT;

-- ========================================
-- RELATÓRIO FINAL
-- ========================================

-- Mostrar configuração atual
SELECT 
  'ROLES' as type, 
  count(*)::text as count, 
  string_agg(id, ', ') as items
FROM roles
UNION ALL
SELECT 
  'PROFILES', 
  count(*)::text, 
  count(*)::text || ' usuários cadastrados'
FROM profiles
UNION ALL
SELECT 
  'TRIGGERS', 
  count(*)::text, 
  string_agg(trigger_name, ', ')
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND (trigger_name LIKE '%prevent%' OR trigger_name LIKE '%validate%');

-- Status de integridade
SELECT * FROM check_system_integrity();
