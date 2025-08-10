# Edge Function: create-user

## Visão Geral

Edge Function segura para criação de usuários no sistema. Permite apenas que usuários com roles `admin` ou `director` criem novos usuários.

## Variáveis de Ambiente (Secrets)

### Obrigatórias
- `EDGE_SUPABASE_URL`: URL do projeto Supabase
- `EDGE_SERVICE_ROLE_KEY`: Chave de service role para operações administrativas
- `EDGE_ANON_KEY`: Chave anônima para validação de JWT
- `EDGE_ALLOWED_ROLES`: Roles permitidos (CSV), ex: "admin,director"

### Temporárias (apenas para desenvolvimento)
- `ALLOW_NOAUTH`: Se "true", permite bypass de autenticação com header `x-dev-smoke: 1`

## Endpoints

### GET /health ou /?health=1
- **Descrição**: Healthcheck para verificar se a função está funcionando
- **Autenticação**: Não necessária
- **Resposta**: `{"ok": true}`

### POST /
- **Descrição**: Criar novo usuário
- **Autenticação**: JWT obrigatório via header `Authorization: Bearer <token>`
- **RBAC**: Apenas roles em `EDGE_ALLOWED_ROLES` podem executar
- **Payload**:
```json
{
  "email": "usuario@empresa.com",
  "password": "SenhaSegura123!",
  "name": "Nome do Usuário",
  "role": "funcionario",
  "tab_access": {
    "clientes": true,
    "agendamento": false
  }
}
```

## Configurar Secrets

```bash
npx supabase@latest secrets set --project-ref iyukvodgqagaedomwxcs \
  EDGE_SUPABASE_URL="https://iyukvodgqagaedomwxcs.supabase.co" \
  EDGE_SERVICE_ROLE_KEY="<sua-service-role-key>" \
  EDGE_ANON_KEY="<sua-anon-key>" \
  EDGE_ALLOWED_ROLES="admin,director"
```

## Deploy

```bash
# Cache das dependências
cd supabase/functions/create-user
deno cache index.ts

# Deploy
cd ../../..
npx supabase@latest functions deploy create-user --project-ref iyukvodgqagaedomwxcs
```

## Testes

### Healthcheck
```bash
curl -i "https://iyukvodgqagaedomwxcs.supabase.co/functions/v1/create-user?health=1"
# Esperado: 200 {"ok":true}
```

### Smoke Test com Bypass (APENAS DESENVOLVIMENTO)

1. Ativar bypass:
```bash
npx supabase@latest secrets set --project-ref iyukvodgqagaedomwxcs ALLOW_NOAUTH=true
npx supabase@latest functions deploy create-user --project-ref iyukvodgqagaedomwxcs
```

2. Testar:
```bash
curl -i -X POST \
  -H "Content-Type: application/json" \
  -H "x-dev-smoke: 1" \
  -d '{"email":"novo@empresa.com","password":"Senha123!","name":"Novo","role":"admin","tab_access":{"clientes":true}}' \
  "https://iyukvodgqagaedomwxcs.supabase.co/functions/v1/create-user"
```

3. **IMPORTANTE**: Desativar bypass após teste:
```bash
npx supabase@latest secrets unset --project-ref iyukvodgqagaedomwxcs ALLOW_NOAUTH
npx supabase@latest functions deploy create-user --project-ref iyukvodgqagaedomwxcs
```

### Teste em Produção
```bash
# Usar JWT válido de usuário admin/director
curl -i -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-do-usuario-logado>" \
  -d '{"email":"novo@empresa.com","password":"Senha123!","name":"Novo","role":"funcionario","tab_access":{"clientes":true}}' \
  "https://iyukvodgqagaedomwxcs.supabase.co/functions/v1/create-user"
```

## Integração Frontend

O arquivo `js/funcionarios.js` já está configurado para usar esta Edge Function:

```javascript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

const res = await fetch('https://iyukvodgqagaedomwxcs.supabase.co/functions/v1/create-user', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ email, password, name, role, tab_access })
});
```

## Segurança

- ✅ Service role key nunca exposta ao frontend
- ✅ RBAC rigoroso: apenas admin/director podem criar usuários  
- ✅ JWT obrigatório para operações de produção
- ✅ CORS configurado adequadamente
- ✅ Validação de entrada de dados
- ✅ Rollback automático em caso de erro na criação do perfil

## Status

- ✅ Deploy realizado com sucesso
- ✅ Secrets configurados 
- ✅ Frontend integrado
- ✅ Testes de segurança (401 sem JWT) funcionando
- ✅ RBAC implementado
