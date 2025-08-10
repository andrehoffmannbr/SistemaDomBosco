-- Ajustes de Roles e Permissões para Admin Total
-- Execute no SQL Editor do Supabase Dashboard

-- 1. Garantir que role administrator existe com acesso total
INSERT INTO roles (id, name, is_custom, tab_access)
VALUES (
  'administrator',
  'Administrator',
  FALSE,
  '{"roles":{"Edit":true,"View":true,"create":true,"delete":true},"stock":{"Edit":true,"View":true,"adjust":true,"create":true,"delete":true},"reports":{"Edit":true,"View":true},"documents":{"Edit":true,"View":true,"create":true,"delete":true},"appointments":{"Edit":true,"View":true,"create":true,"delete":true},"clients":{"Edit":true,"View":true,"create":true,"delete":true},"finance":{"Edit":true,"View":true,"create":true,"delete":true},"users":{"Edit":true,"View":true,"create":true,"delete":true},"notifications":{"Edit":true,"View":true,"create":true,"delete":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  tab_access = EXCLUDED.tab_access;

-- 2. Garantir que role admin também tem acesso total
INSERT INTO roles (id, name, is_custom, tab_access)
VALUES (
  'admin',
  'Admin',
  FALSE,
  '{"roles":{"Edit":true,"View":true,"create":true,"delete":true},"stock":{"Edit":true,"View":true,"adjust":true,"create":true,"delete":true},"reports":{"Edit":true,"View":true},"documents":{"Edit":true,"View":true,"create":true,"delete":true},"appointments":{"Edit":true,"View":true,"create":true,"delete":true},"clients":{"Edit":true,"View":true,"create":true,"delete":true},"finance":{"Edit":true,"View":true,"create":true,"delete":true},"users":{"Edit":true,"View":true,"create":true,"delete":true},"notifications":{"Edit":true,"View":true,"create":true,"delete":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  tab_access = EXCLUDED.tab_access;

-- 3. Verificar e criar profile do administrador se não existir
-- SUBSTITUA 'admin@dom.com' pelo email real do seu usuário administrador
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Buscar o ID do usuário admin no auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@dom.com'  -- SUBSTITUIR PELO EMAIL REAL
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Inserir ou atualizar o profile
        INSERT INTO profiles (id, role, name, email, tab_access, phone)
        VALUES (
            admin_user_id,
            'administrator',
            'Sistema Administrador',
            'admin@dom.com',  -- SUBSTITUIR PELO EMAIL REAL
            '{"roles":true,"stock":true,"reports":true,"documents":true,"appointments":true,"clients":true,"finance":true,"users":true,"notifications":true}'::jsonb,
            '+55 (11) 99999-9999'
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            role = 'administrator',
            tab_access = '{"roles":true,"stock":true,"reports":true,"documents":true,"appointments":true,"clients":true,"finance":true,"users":true,"notifications":true}'::jsonb;
        
        RAISE NOTICE 'Profile do administrador criado/atualizado para user_id: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Usuário admin não encontrado. Verifique o email.';
    END IF;
END $$;

-- 4. Verificar profiles existentes
SELECT id, email, role, name, tab_access 
FROM profiles 
WHERE role IN ('admin', 'administrator', 'director')
ORDER BY role;

-- 5. Verificar roles disponíveis
SELECT id, name, is_custom, tab_access 
FROM roles 
WHERE id IN ('admin', 'administrator', 'director')
ORDER BY id;
