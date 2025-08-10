# Edge Function: create-user

## Pré-requisitos
- Deno instalado (>= 2.x)
- Supabase CLI
- Variáveis de ambiente no projeto Supabase:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Deploy
```bash
supabase functions deploy create-user
```

## Teste via curl
Obtenha um `access_token` logado como admin/director no app (ou via Auth).
```bash
curl -i -X POST \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"email":"novo@org.com","password":"SenhaForte!","name":"Novo Usuário","role":"admin","tab_access":{"clients":{"view":true}}}' \
  https://<PROJECT-ID>.supabase.co/functions/v1/create-user
```

## Frontend
O módulo `js/funcionarios.js` já chama a função com Bearer token e faz `hydrate('users')` após sucesso.

---

# Sistema de Criação de Usuários via Edge Function

## Visão Geral

Este sistema implementa a criação segura de usuários através de uma Supabase Edge Function, eliminando a necessidade de expor o `SERVICE_ROLE_KEY` no frontend.

## Arquitetura

### Frontend (JavaScript)
- `js/funcionarios.js`: Função `addFuncionario()` atualizada para chamar Edge Function
- `js/main.js`: Função `addNewFuncionario()` atualizada para usar email como identificador

### Backend (Edge Function)
- `supabase/functions/create-user/index.ts`: Edge Function com autenticação e autorização
- `supabase/functions/create-user/deno.json`: Configuração do Deno runtime

### Database (SQL)
- `sql/edge-function-rls.sql`: Políticas RLS para Edge Functions
- `sql/test-edge-function.sql`: Scripts de teste e validação

## Instalação

### 1. Configurar Edge Function

```bash
# No diretório do projeto Supabase
supabase functions new create-user

# Copiar o conteúdo do arquivo index.ts
# Fazer deploy da função
supabase functions deploy create-user
```

### 2. Configurar Políticas RLS

Execute o script `sql/edge-function-rls.sql` no SQL Editor do Supabase:

```sql
-- Políticas para Edge Functions
CREATE POLICY "edge_function_create_profiles" ON public.profiles
FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "edge_function_select_profiles" ON public.profiles
FOR SELECT TO service_role USING (true);
```

### 3. Verificar Permissões

Execute `sql/test-edge-function.sql` para validar a configuração.

## Funcionamento

### Fluxo de Criação de Usuário

1. **Frontend**: Usuário director/admin preenche formulário
2. **Validação**: Sistema verifica permissões e dados obrigatórios
3. **Autenticação**: Frontend obtém token JWT da sessão atual
4. **Edge Function**: Recebe requisição com token de autenticação
5. **Autorização**: Edge Function verifica se usuário é director/admin
6. **Criação Auth**: Edge Function cria usuário no Supabase Auth
7. **Criação Profile**: Edge Function cria perfil na tabela profiles
8. **Rollback**: Em caso de erro, desfaz operações já realizadas
9. **Resposta**: Frontend recebe confirmação e atualiza interface

### Segurança

- **SERVICE_ROLE_KEY**: Mantido apenas no backend (Edge Function)
- **Autenticação**: JWT token validado em cada requisição
- **Autorização**: Apenas director/admin podem criar usuários
- **RLS Policies**: Políticas de segurança no banco de dados
- **Validação**: Dados validados tanto no frontend quanto no backend
- **Rollback**: Transações reversíveis em caso de erro

## Estrutura de Dados

### Requisição para Edge Function

```typescript
{
  email: string,
  password: string,
  name: string,
  role: string,
  unit?: string,
  tab_access?: object
}
```

### Resposta da Edge Function

```typescript
{
  success: boolean,
  userId?: string,
  profileId?: string,
  error?: string
}
```

## Permissões Necessárias

### Frontend
- Usuário deve estar logado (sessão ativa)
- Usuário deve ter role 'director' ou 'admin'
- Usuário deve ter permissão 'edit' no tab 'funcionarios'

### Edge Function
- SERVICE_ROLE_KEY para operações no Auth e Database
- Políticas RLS configuradas para service_role

## Tratamento de Erros

### Erros Comuns
- **Email já existente**: Verificação antes da criação
- **Senha muito fraca**: Validação de requisitos mínimos
- **Permissões insuficientes**: Verificação de role
- **Dados obrigatórios**: Validação de campos requeridos
- **Falha na criação**: Rollback automático

### Logs e Debug
- Edge Function logs disponíveis no Dashboard Supabase
- Mensagens de erro específicas para cada tipo de falha
- Notificações informativas no frontend

## Testes

### Teste Manual
1. Faça login como director ou admin
2. Acesse a aba Funcionários
3. Clique em "Adicionar Funcionário"
4. Preencha todos os campos obrigatórios
5. Submeta o formulário
6. Verifique a criação do usuário

### Teste de Permissões
1. Faça login como staff
2. Tente acessar criação de funcionário
3. Deve ser negado o acesso

### Teste de Validação
1. Tente criar usuário com email duplicado
2. Tente criar usuário com senha muito curta
3. Verifique mensagens de erro apropriadas

## Logs e Monitoramento

### Edge Function Logs
```
Dashboard Supabase > Functions > create-user > Logs
```

### Database Logs
```
Dashboard Supabase > Logs > Database
```

### Frontend Logs
```
Console do navegador (F12)
```

## Solução de Problemas

### Edge Function não responde
- Verificar se foi feito deploy: `supabase functions deploy create-user`
- Verificar logs da função no Dashboard
- Verificar configuração de CORS

### Erro de permissão
- Verificar políticas RLS: execute `sql/test-edge-function.sql`
- Verificar role do usuário logado
- Verificar token de autenticação

### Erro de validação
- Verificar campos obrigatórios no frontend
- Verificar validação no backend
- Verificar constraints do banco de dados

## Arquivos Principais

```
projeto/
├── js/
│   ├── funcionarios.js      # Frontend: função addFuncionario()
│   └── main.js              # Frontend: função addNewFuncionario()
├── supabase/functions/create-user/
│   ├── index.ts             # Edge Function principal
│   └── deno.json            # Configuração Deno
└── sql/
    ├── edge-function-rls.sql    # Políticas RLS
    └── test-edge-function.sql   # Scripts de teste
```

## Próximos Passos

1. **Teste completo**: Validar todos os cenários de uso
2. **Monitoramento**: Configurar alertas para falhas
3. **Documentação**: Treinar usuários director/admin
4. **Backup**: Implementar backup de usuários criados
5. **Auditoria**: Log de todas as criações de usuário
