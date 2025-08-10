-- Criar usuário administrador temporário para teste
-- ATENÇÃO: Executar apenas em ambiente de desenvolvimento/teste

-- 1. Inserir na tabela auth.users (com hash de senha para 'admin123')
insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    confirmation_token,
    recovery_sent_at,
    recovery_token,
    email_change_sent_at,
    email_change_token_new,
    email_change,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@testdomainonly.com',
    '$2a$10$KzGwJZ9QJe8XjJK8sM4/OeF4CZfJGFPG4x4iF5Gj5/QJ5hJ5jJ5jJ', -- hash para 'admin123'
    now(),
    now(),
    '',
    null,
    '',
    null,
    '',
    '',
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    now(),
    now(),
    null,
    null,
    '',
    '',
    null,
    '',
    0,
    null,
    '',
    null,
    false,
    null
) returning id, email;

-- 2. Inserir na tabela profiles usando o ID gerado
insert into profiles (
    id,
    email,
    name,
    role,
    tab_access,
    created_at,
    updated_at
) 
select 
    au.id,
    au.email,
    'Administrador Teste',
    'administrator',
    '{}'::jsonb,
    now(),
    now()
from auth.users au 
where au.email = 'admin@testdomainonly.com'
and not exists (select 1 from profiles p where p.id = au.id);

-- 3. Verificar criação
select 
    p.id,
    p.email,
    p.name,
    p.role,
    au.email as auth_email
from profiles p
join auth.users au on p.id = au.id
where p.email = 'admin@testdomainonly.com';
