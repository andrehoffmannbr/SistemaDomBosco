-- Teste da Edge Function de criação de usuários
-- Execute este script no SQL Editor do Supabase para testar

-- 1. Verificar se as políticas RLS estão corretas
SELECT 
    schemaname,
    tablename, 
    policyname,
    roles,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 2. Verificar configuração de roles
SELECT DISTINCT role FROM public.profiles ORDER BY role;

-- 3. Verificar se há usuários director/admin para testar
SELECT 
    id,
    name,
    email,
    role,
    created_at
FROM public.profiles 
WHERE role IN ('director', 'admin')
ORDER BY created_at;

-- 4. Teste de validação de email duplicado
-- (Isso deve falhar se o email já existir)
-- Substitua 'test@example.com' por um email que você sabe que não existe
/*
INSERT INTO public.profiles (name, email, role)
VALUES ('Test User', 'test@example.com', 'staff');
*/

-- 5. Verificar constraints de segurança
SELECT 
    constraint_name,
    constraint_type,
    table_name,
    is_deferrable,
    initially_deferred
FROM information_schema.table_constraints 
WHERE table_name = 'profiles'
AND constraint_type IN ('CHECK', 'FOREIGN KEY', 'UNIQUE')
ORDER BY constraint_name;

-- 6. Verificar triggers de segurança
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- 7. Status da Edge Function (verificar nos logs do Supabase)
-- Acesse: https://app.supabase.com/project/[SEU_PROJECT_ID]/functions

-- Instruções para teste:
-- 1. Execute as políticas RLS: edge-function-rls.sql
-- 2. Faça deploy da Edge Function: supabase functions deploy create-user
-- 3. Faça login como director/admin no sistema
-- 4. Tente criar um novo funcionário
-- 5. Verifique os logs da Edge Function se houver erros
