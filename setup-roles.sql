-- Script SQL para garantir que todos os roles/cargos existem no sistema
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar constraints de segurança para prevenir dados inválidos
-- Garante que nenhuma role inválida seja criada
ALTER TABLE public.roles
  ADD CONSTRAINT IF NOT EXISTS roles_id_not_empty CHECK (char_length(id) > 0),
  ADD CONSTRAINT IF NOT EXISTS roles_name_not_empty CHECK (char_length(name) > 0);

-- Garante que todo usuário tenha role (não pode ser NULL)
ALTER TABLE public.profiles
  ALTER COLUMN role SET NOT NULL;

-- Garante que todo usuário novo tenha tab_access coerente (não NULL)
ALTER TABLE public.profiles
  ALTER COLUMN tab_access SET DEFAULT '{}'::jsonb;

-- 2. Inserir roles/cargos essenciais (INSERT ... ON CONFLICT DO NOTHING para evitar duplicatas)
INSERT INTO roles (name, display_name, permissions) VALUES 
  ('director', 'Diretor(a)', '{"agenda": {"view": true, "edit": true}, "historico": {"view": true, "edit": true}, "estoque": {"view": true, "edit": true}, "financeiro": {"view": true, "edit": true}, "funcionarios": {"view": true, "edit": true}, "documentos": {"view": true, "edit": true}, "meus-pacientes": {"view": true, "edit": true}}'),
  ('coordinator_madre', 'Coordenador(a) Madre', '{"agenda": {"view": true, "edit": true}, "historico": {"view": true, "edit": true}, "estoque": {"view": false, "edit": false}, "financeiro": {"view": false, "edit": false}, "funcionarios": {"view": true, "edit": false}, "documentos": {"view": true, "edit": true}, "meus-pacientes": {"view": true, "edit": true}}'),
  ('coordinator_floresta', 'Coordenador(a) Floresta', '{"agenda": {"view": true, "edit": true}, "historico": {"view": true, "edit": true}, "estoque": {"view": false, "edit": false}, "financeiro": {"view": false, "edit": false}, "funcionarios": {"view": true, "edit": false}, "documentos": {"view": true, "edit": true}, "meus-pacientes": {"view": true, "edit": true}}'),
  ('staff', 'Funcionário(a) Geral', '{"agenda": {"view": true, "edit": false}, "historico": {"view": false, "edit": false}, "estoque": {"view": false, "edit": false}, "financeiro": {"view": false, "edit": false}, "funcionarios": {"view": false, "edit": false}, "documentos": {"view": false, "edit": false}, "meus-pacientes": {"view": true, "edit": true}}'),
  ('intern', 'Estagiário(a)', '{"agenda": {"view": true, "edit": false}, "historico": {"view": false, "edit": false}, "estoque": {"view": false, "edit": false}, "financeiro": {"view": false, "edit": false}, "funcionarios": {"view": false, "edit": false}, "documentos": {"view": false, "edit": false}, "meus-pacientes": {"view": true, "edit": true}}'),
  ('musictherapist', 'Musicoterapeuta', '{"agenda": {"view": true, "edit": false}, "historico": {"view": false, "edit": false}, "estoque": {"view": false, "edit": false}, "financeiro": {"view": false, "edit": false}, "funcionarios": {"view": false, "edit": false}, "documentos": {"view": false, "edit": false}, "meus-pacientes": {"view": true, "edit": true}}'),
  ('financeiro', 'Financeiro', '{"agenda": {"view": false, "edit": false}, "historico": {"view": false, "edit": false}, "estoque": {"view": true, "edit": true}, "financeiro": {"view": true, "edit": true}, "funcionarios": {"view": false, "edit": false}, "documentos": {"view": false, "edit": false}, "meus-pacientes": {"view": false, "edit": false}}'),
  ('receptionist', 'Recepcionista', '{"agenda": {"view": true, "edit": true}, "historico": {"view": true, "edit": false}, "estoque": {"view": false, "edit": false}, "financeiro": {"view": false, "edit": false}, "funcionarios": {"view": true, "edit": false}, "documentos": {"view": false, "edit": false}, "meus-pacientes": {"view": false, "edit": false}}'),
  ('psychologist', 'Psicólogo(a)', '{"agenda": {"view": true, "edit": false}, "historico": {"view": false, "edit": false}, "estoque": {"view": false, "edit": false}, "financeiro": {"view": false, "edit": false}, "funcionarios": {"view": false, "edit": false}, "documentos": {"view": false, "edit": false}, "meus-pacientes": {"view": true, "edit": true}}'),
  ('psychopedagogue', 'Psicopedagogo(a)', '{"agenda": {"view": true, "edit": false}, "historico": {"view": false, "edit": false}, "estoque": {"view": false, "edit": false}, "financeiro": {"view": false, "edit": false}, "funcionarios": {"view": false, "edit": false}, "documentos": {"view": false, "edit": false}, "meus-pacientes": {"view": true, "edit": true}}'),
  ('speech_therapist', 'Fonoaudiólogo(a)', '{"agenda": {"view": true, "edit": false}, "historico": {"view": false, "edit": false}, "estoque": {"view": false, "edit": false}, "financeiro": {"view": false, "edit": false}, "funcionarios": {"view": false, "edit": false}, "documentos": {"view": false, "edit": false}, "meus-pacientes": {"view": true, "edit": true}}'),
  ('nutritionist', 'Nutricionista', '{"agenda": {"view": true, "edit": false}, "historico": {"view": false, "edit": false}, "estoque": {"view": false, "edit": false}, "financeiro": {"view": false, "edit": false}, "funcionarios": {"view": false, "edit": false}, "documentos": {"view": false, "edit": false}, "meus-pacientes": {"view": true, "edit": true}}'),
  ('physiotherapist', 'Fisioterapeuta', '{"agenda": {"view": true, "edit": false}, "historico": {"view": false, "edit": false}, "estoque": {"view": false, "edit": false}, "financeiro": {"view": false, "edit": false}, "funcionarios": {"view": false, "edit": false}, "documentos": {"view": false, "edit": false}, "meus-pacientes": {"view": true, "edit": true}}')
ON CONFLICT (name) DO NOTHING;

-- 3. Verificar se os roles foram inseridos
SELECT name, display_name FROM roles ORDER BY name;
