-- ========================================================
-- CORREÇÃO DE PERMISSÕES E RLS PARA AGENDAMENTOS
-- Objetivo: Garantir que admin veja todos os schedules + ajustar tab_access
-- Data: 2025-08-12
-- ========================================================

-- 1. VERIFICAR POLÍTICA ATUAL DE SCHEDULES
-- A política já existe em fix-rls-recursion.sql, mas vamos garantir que está correta

-- Drop e recriar política de SELECT para schedules (garantindo que admin vê tudo)
DROP POLICY IF EXISTS "schedules_select_owner_assigned_admin" ON schedules;
DROP POLICY IF EXISTS "admin_can_select_all_schedules" ON schedules;

CREATE POLICY "admin_can_select_all_schedules"
ON schedules
FOR SELECT
USING (
  -- Admin pode ver todos os agendamentos
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
  -- Usuários normais só veem os próprios ou atribuídos a eles
  OR user_id = auth.uid()
  OR assigned_to_user_uid = auth.uid()
);

-- 2. ATUALIZAR TAB_ACCESS DOS ADMINS
-- Garantir que admins tenham permissões completas para agenda/schedules

UPDATE profiles
SET tab_access = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(tab_access, '{}'::jsonb),
      '{agenda}', 
      '{"view": true, "edit": true, "create": true, "delete": true}'::jsonb, 
      true
    ),
    '{schedule}', 
    '{"view": true, "edit": true, "create": true, "delete": true}'::jsonb, 
    true
  ),
  '{schedules}', 
  '{"view": true, "edit": true, "create": true, "delete": true, "confirm": true}'::jsonb, 
  true
)
WHERE role = 'admin';

-- 3. VERIFICAÇÕES DE TESTE
-- Estas queries devem ser executadas para validar as correções:

-- Verificar se a política foi criada
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'schedules' 
AND policyname = 'admin_can_select_all_schedules';

-- Verificar tab_access dos admins
SELECT 
  id, 
  name, 
  role,
  tab_access->'agenda' as agenda_permissions,
  tab_access->'schedule' as schedule_permissions,
  tab_access->'schedules' as schedules_permissions
FROM profiles 
WHERE role = 'admin';

-- Contar schedules total (admin deve ver todos)
SELECT COUNT(*) as total_schedules FROM schedules;

-- COMENTÁRIOS PARA TESTE MANUAL:
-- 1. Login como admin no sistema
-- 2. Abrir "Agenda do Dia" 
-- 3. Verificar se lista todos os agendamentos (não só os próprios)
-- 4. Console deve estar sem erros de permissão

-- ========================================================
-- FIM DO SCRIPT
-- ========================================================
