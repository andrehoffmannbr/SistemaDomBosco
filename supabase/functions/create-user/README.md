# Comandos para desenvolvimento local da Edge Function

## Pré-requisitos
1. Preencher o arquivo `.env` com suas credenciais reais do Supabase
2. Ter o Supabase CLI instalado

## Comandos de desenvolvimento

### Servir função localmente
```bash
# A partir da raiz do projeto
supabase functions serve create-user --env-file supabase/functions/create-user/.env

# Ou a partir da pasta da função
cd supabase/functions/create-user
supabase functions serve create-user --env-file .env
```

### Cache das dependências
```bash
# A partir da pasta da função
cd supabase/functions/create-user
deno cache --lock=deno.lock --lock-write index.ts
```

### Deploy para produção
```bash
# A partir da raiz do projeto
supabase functions deploy create-user

# As variáveis de ambiente são configuradas automaticamente no Supabase
# não é necessário usar --env-file no deploy
```

## Teste local
Após servir localmente, a função estará disponível em:
`http://localhost:54321/functions/v1/create-user`

## Variáveis de ambiente necessárias
- `SUPABASE_URL`: URL do seu projeto Supabase
- `SUPABASE_ANON_KEY`: Chave pública do Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de service role (sensível)
