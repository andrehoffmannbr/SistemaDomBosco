-- VERIFY_admin_schedules.sql
-- Checklist rápido para confirmar que ADMIN enxerga todos os agendamentos
-- Rode este script logado como o usuário admin no Supabase SQL Editor.

-- 1) Deve retornar linhas (se houver dados)
select * from schedules limit 5;

-- 2) Prova de visão global (pega qualquer user_id)
select count(*) as total_schedules from schedules;

-- 3) Quem sou eu? Deve retornar 'admin'
select role from profiles where id = auth.uid();

-- 4) Amostragem do dia atual (admin deve ver tudo)
select *
from schedules
where date = current_date
order by time asc
limit 50;
