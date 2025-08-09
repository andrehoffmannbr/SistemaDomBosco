-- B2 - UPSERT dos cargos com tab_access padrão
-- Execute este script no Supabase SQL Editor

begin;

-- ADMIN
insert into roles (id, name, is_custom, tab_access) values
('admin','Administrador',false,
 '{
    "clients":{"view":true,"create":true,"edit":true,"delete":true},
    "schedules":{"view":true,"create":true,"edit":true,"delete":true,"confirm":true},
    "daily_notes":{"view":true,"create":true,"edit":true,"delete":true},
    "stock":{"view":true,"create":true,"edit":true,"delete":true,"adjust":true},
    "documents":{"view":true,"create":true,"edit":true,"delete":true},
    "client_files":{"view":true,"create":true,"edit":true,"delete":true},
    "notifications":{"view":true,"create":true,"edit":true,"delete":true},
    "funcionarios":{"view":true,"create":true,"edit":true,"delete":true},
    "roles":{"view":true,"create":true,"edit":true,"delete":true},
    "reports":{"view":true}
  }'::jsonb)
on conflict (id) do update set name=excluded.name, tab_access=excluded.tab_access;

-- DIRETOR
insert into roles (id, name, is_custom, tab_access) values
('diretor','Diretor',false,
 '{
    "clients":{"view":true,"create":true,"edit":true,"delete":false},
    "schedules":{"view":true,"create":true,"edit":true,"delete":false,"confirm":true},
    "daily_notes":{"view":true,"create":false,"edit":false,"delete":false},
    "stock":{"view":true,"create":false,"edit":false,"delete":false,"adjust":false},
    "documents":{"view":true,"create":true,"edit":true,"delete":false},
    "client_files":{"view":true,"create":true,"edit":true,"delete":false},
    "notifications":{"view":true,"create":false,"edit":false,"delete":false},
    "funcionarios":{"view":true,"create":false,"edit":true,"delete":false},
    "roles":{"view":true,"create":false,"edit":true,"delete":false},
    "reports":{"view":true}
  }'::jsonb)
on conflict (id) do update set name=excluded.name, tab_access=excluded.tab_access;

-- COORDENADOR CLÍNICO
insert into roles (id, name, is_custom, tab_access) values
('coordenador','Coordenador Clínico',false,
 '{
    "clients":{"view":true,"create":true,"edit":true,"delete":false},
    "schedules":{"view":true,"create":true,"edit":true,"delete":false,"confirm":true},
    "daily_notes":{"view":true,"create":false,"edit":false,"delete":false},
    "stock":{"view":true,"create":false,"edit":false,"delete":false,"adjust":false},
    "documents":{"view":true,"create":true,"edit":true,"delete":false},
    "client_files":{"view":true,"create":true,"edit":true,"delete":false},
    "notifications":{"view":true,"create":false,"edit":false,"delete":false},
    "funcionarios":{"view":false,"create":false,"edit":false,"delete":false},
    "roles":{"view":false,"create":false,"edit":false,"delete":false},
    "reports":{"view":true}
  }'::jsonb)
on conflict (id) do update set name=excluded.name, tab_access=excluded.tab_access;

-- PSICÓLOGO
insert into roles (id, name, is_custom, tab_access) values
('psicologo','Psicólogo',false,
 '{
    "clients":{"view":true,"create":true,"edit":true,"delete":false},
    "schedules":{"view":true,"create":true,"edit":true,"delete":false,"confirm":true},
    "daily_notes":{"view":true,"create":true,"edit":true,"delete":false},
    "stock":{"view":true,"create":false,"edit":false,"delete":false,"adjust":false},
    "documents":{"view":true,"create":true,"edit":true,"delete":false},
    "client_files":{"view":true,"create":true,"edit":true,"delete":false},
    "notifications":{"view":true,"create":false,"edit":false,"delete":false},
    "funcionarios":{"view":false,"create":false,"edit":false,"delete":false},
    "roles":{"view":false,"create":false,"edit":false,"delete":false},
    "reports":{"view":true}
  }'::jsonb)
on conflict (id) do update set name=excluded.name, tab_access=excluded.tab_access;

-- ESTAGIÁRIO
insert into roles (id, name, is_custom, tab_access) values
('estagiario','Estagiário',false,
 '{
    "clients":{"view":true,"create":false,"edit":false,"delete":false},
    "schedules":{"view":true,"create":true,"edit":false,"delete":false,"confirm":false},
    "daily_notes":{"view":false,"create":false,"edit":false,"delete":false},
    "stock":{"view":false,"create":false,"edit":false,"delete":false,"adjust":false},
    "documents":{"view":true,"create":false,"edit":false,"delete":false},
    "client_files":{"view":true,"create":true,"edit":false,"delete":false},
    "notifications":{"view":true,"create":false,"edit":false,"delete":false},
    "funcionarios":{"view":false,"create":false,"edit":false,"delete":false},
    "roles":{"view":false,"create":false,"edit":false,"delete":false},
    "reports":{"view":false}
  }'::jsonb)
on conflict (id) do update set name=excluded.name, tab_access=excluded.tab_access;

-- RECEPÇÃO
insert into roles (id, name, is_custom, tab_access) values
('recepcao','Recepção',false,
 '{
    "clients":{"view":true,"create":true,"edit":true,"delete":false},
    "schedules":{"view":true,"create":true,"edit":true,"delete":false,"confirm":false},
    "daily_notes":{"view":false,"create":false,"edit":false,"delete":false},
    "stock":{"view":false,"create":false,"edit":false,"delete":false,"adjust":false},
    "documents":{"view":true,"create":false,"edit":false,"delete":false},
    "client_files":{"view":true,"create":false,"edit":false,"delete":false},
    "notifications":{"view":true,"create":false,"edit":false,"delete":false},
    "funcionarios":{"view":false,"create":false,"edit":false,"delete":false},
    "roles":{"view":false,"create":false,"edit":false,"delete":false},
    "reports":{"view":false}
  }'::jsonb)
on conflict (id) do update set name=excluded.name, tab_access=excluded.tab_access;

-- FINANCEIRO
insert into roles (id, name, is_custom, tab_access) values
('financeiro','Financeiro',false,
 '{
    "clients":{"view":true,"create":false,"edit":false,"delete":false},
    "schedules":{"view":true,"create":false,"edit":false,"delete":false,"confirm":false},
    "daily_notes":{"view":true,"create":true,"edit":true,"delete":true},
    "stock":{"view":true,"create":false,"edit":false,"delete":false,"adjust":false},
    "documents":{"view":true,"create":false,"edit":false,"delete":false},
    "client_files":{"view":false,"create":false,"edit":false,"delete":false},
    "notifications":{"view":true,"create":false,"edit":false,"delete":false},
    "funcionarios":{"view":false,"create":false,"edit":false,"delete":false},
    "roles":{"view":false,"create":false,"edit":false,"delete":false},
    "reports":{"view":true}
  }'::jsonb)
on conflict (id) do update set name=excluded.name, tab_access=excluded.tab_access;

-- ALMOXARIFADO (estoque)
insert into roles (id, name, is_custom, tab_access) values
('almoxarifado','Almoxarifado',false,
 '{
    "clients":{"view":false,"create":false,"edit":false,"delete":false},
    "schedules":{"view":false,"create":false,"edit":false,"delete":false,"confirm":false},
    "daily_notes":{"view":false,"create":false,"edit":false,"delete":false},
    "stock":{"view":true,"create":true,"edit":true,"delete":false,"adjust":true},
    "documents":{"view":false,"create":false,"edit":false,"delete":false},
    "client_files":{"view":false,"create":false,"edit":false,"delete":false},
    "notifications":{"view":true,"create":false,"edit":false,"delete":false},
    "funcionarios":{"view":false,"create":false,"edit":false,"delete":false},
    "roles":{"view":false,"create":false,"edit":false,"delete":false},
    "reports":{"view":false}
  }'::jsonb)
on conflict (id) do update set name=excluded.name, tab_access=excluded.tab_access;

commit;

-- Confirmar inserção
select id, name from roles order by id;
