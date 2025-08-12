-- MASTER SCRIPT: Configuração Completa de Segurança
BEGIN;

-- Constraints mínimas
ALTER TABLE public.roles
  ADD CONSTRAINT IF NOT EXISTS roles_id_not_empty CHECK (char_length(id) > 0),
  ADD CONSTRAINT IF NOT EXISTS roles_name_not_empty CHECK (char_length(name) > 0);
ALTER TABLE public.profiles
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN tab_access SET DEFAULT '{}'::jsonb;

-- Upsert de roles (helper)
CREATE OR REPLACE FUNCTION upsert_role_safe(
  p_id TEXT, p_name TEXT, p_tab_access JSONB DEFAULT NULL, p_isCustom BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
BEGIN
  IF char_length(p_id) = 0 THEN RAISE EXCEPTION 'Role ID não pode ser vazio'; END IF;
  IF char_length(p_name) = 0 THEN RAISE EXCEPTION 'Role name não pode ser vazio'; END IF;
  INSERT INTO public.roles (id, name, is_custom, tab_access)
  VALUES (p_id, p_name, p_isCustom, COALESCE(p_tab_access, '{}'::jsonb))
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    tab_access = COALESCE(EXCLUDED.tab_access, '{}'::jsonb),
    is_custom = EXCLUDED.is_custom;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Propagar permissões padrão quando tab_access estiver vazio
CREATE OR REPLACE FUNCTION propagate_role_permissions()
RETURNS INTEGER AS $$
DECLARE affected_rows INTEGER := 0;
BEGIN
  UPDATE public.profiles p
  SET tab_access = r.tab_access
  FROM public.roles r
  WHERE p.role = r.id
    AND (p.tab_access IS NULL OR p.tab_access::text IN ('{}','null'));
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT propagate_role_permissions();
COMMIT;
