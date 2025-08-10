-- Políticas RLS para permitir criação de usuários via Edge Function
-- Este script adiciona políticas necessárias para a Edge Function criar perfis

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "edge_function_create_profiles" ON public.profiles;

-- Política para permitir que Edge Functions criem perfis usando SERVICE_ROLE
CREATE POLICY "edge_function_create_profiles" ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "edge_function_select_profiles" ON public.profiles;

-- Política para permitir que Edge Functions consultem perfis para validação
CREATE POLICY "edge_function_select_profiles" ON public.profiles
FOR SELECT
TO service_role
USING (true);

-- Comentário explicativo
COMMENT ON POLICY "edge_function_create_profiles" ON public.profiles IS 
'Permite que Edge Functions com SERVICE_ROLE criem novos perfis de usuário';

COMMENT ON POLICY "edge_function_select_profiles" ON public.profiles IS 
'Permite que Edge Functions com SERVICE_ROLE consultem perfis para validação';

-- Verificar que as políticas foram criadas
SELECT 
    schemaname,
    tablename, 
    policyname,
    roles,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname LIKE 'edge_function%'
ORDER BY policyname;
