-- B1 - Verificações do Schema
-- Verificar se as tabelas existem
select table_name from information_schema.tables
where table_schema='public' and table_name in ('roles','profiles');

-- Verificar estrutura da tabela roles
select column_name, data_type
from information_schema.columns
where table_name='roles' and table_schema='public'
order by ordinal_position;

-- Verificar estrutura da tabela profiles
select column_name, data_type
from information_schema.columns
where table_name='profiles' and table_schema='public'
order by ordinal_position;

-- Verificar dados atuais nas tabelas
select 'ROLES EXISTENTES:' as info;
select id, name, is_custom from roles order by id;

select 'PROFILES EXISTENTES:' as info;
select id, name, role from profiles limit 5;
