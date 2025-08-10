-- Verificação do usuário administrador
-- Execute no SQL Editor do Supabase

-- 1. Verificar usuários na tabela auth.users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
WHERE email LIKE '%admin%' OR email LIKE '%dom%'
ORDER BY created_at DESC;

-- 2. Verificar profiles existentes
SELECT 
  id,
  email,
  role,
  name,
  tab_access,
  created_at
FROM profiles 
ORDER BY created_at DESC;

-- 3. Verificar se há algum profile com role administrator
SELECT 
  id,
  email,
  role,
  name
FROM profiles 
WHERE role IN ('admin', 'administrator', 'director');

-- 4. Se não houver profile do admin, criar um
-- SUBSTITUA pelo UUID real do usuário admin da query 1
/*
INSERT INTO profiles (id, role, name, email, tab_access)
VALUES (
  'SUBSTITUIR_UUID_AQUI',  -- UUID do auth.users
  'administrator',
  'Sistema Administrador',
  'admin@dominio.com',     -- Email real
  '{"roles":true,"stock":true,"reports":true,"documents":true,"appointments":true,"clients":true,"finance":true,"users":true,"notifications":true}'::jsonb
)
ON CONFLICT (id) DO UPDATE
SET 
  role = 'administrator',
  tab_access = '{"roles":true,"stock":true,"reports":true,"documents":true,"appointments":true,"clients":true,"finance":true,"users":true,"notifications":true}'::jsonb;
*/

-- 5. Verificar roles disponíveis
SELECT id, name, tab_access FROM roles WHERE id IN ('admin', 'administrator', 'director');
