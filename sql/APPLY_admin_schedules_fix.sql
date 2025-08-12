-- ========================================================
-- MASTER SCRIPT: APLICAR CORREÇÕES DE PERMISSÕES
-- Execute este arquivo no Supabase SQL Editor
-- ========================================================

\echo '🔧 Aplicando correções de permissões para schedules...'

-- Executar correção principal
\i sql/fix_admin_schedules_permissions.sql

\echo '✅ Correções aplicadas! Verificando resultados...'

-- Verificação final
SELECT 
  'Política RLS schedules' as item,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'schedules' 
    AND policyname = 'admin_can_select_all_schedules'
  ) THEN '✅ OK' ELSE '❌ FALTANDO' END as status;

SELECT 
  'Permissões admin tab_access' as item,
  CASE WHEN EXISTS (
    SELECT 1 FROM profiles 
    WHERE role = 'admin' 
    AND tab_access->'schedules'->>'view' = 'true'
  ) THEN '✅ OK' ELSE '❌ FALTANDO' END as status;

\echo '🎯 Execute os testes manuais:'
\echo '1. Login como admin'  
\echo '2. Abrir "Agenda do Dia"'
\echo '3. Verificar se lista todos os agendamentos'
