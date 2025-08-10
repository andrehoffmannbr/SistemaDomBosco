# CHANGELOG

## [2025-08-10 12:30] — Edge Function create-user DEPLOYADA EM PRODUÇÃO ✅
### 🚀 **Deploy Completo da Edge Function**
- **URL Produção**: `https://iyukvodgqagaedomwxcs.supabase.co/functions/v1/create-user`
- **Secrets Configurados**: Todos os `EDGE_*` secrets sem conflito com `SUPABASE_*`
- **RBAC Implementado**: Apenas admin/director podem criar usuários
- **Frontend Integrado**: `js/funcionarios.js` usando Edge Function com JWT

### 🛡️ **Segurança de Produção**
- **Secrets Neutros**: `EDGE_SUPABASE_URL`, `EDGE_SERVICE_ROLE_KEY`, `EDGE_ANON_KEY`, `EDGE_ALLOWED_ROLES`
- **JWT Obrigatório**: Authorization Bearer token validado na função
- **CORS Completo**: Headers padronizados para todas as respostas
- **Service Role Protegida**: Nunca exposta ao frontend

### 🔧 **Funcionalidades Implementadas**
- **Healthcheck**: `GET /?health=1` retorna `{"ok": true}` (interceptado pelo Supabase)
- **Criação de Usuário**: `POST /` com payload completo e RBAC
- **Dev Bypass**: Sistema removido após testes (produção segura)
- **Rollback Automático**: Desativa usuário se falha na criação do perfil

### 📋 **Testes Realizados**
- ✅ Deploy bem-sucedido
- ✅ 401 sem JWT (comportamento esperado)
- ✅ Secrets configurados corretamente
- ✅ Frontend enviando Authorization header
- ✅ RBAC funcionando (EDGE_ALLOWED_ROLES)

### 📚 **Documentação**
- **README Completo**: `supabase/functions/create-user/EDGE_FUNCTION_README.md`
- **Comandos de Deploy**: Scripts padronizados
- **Integração Frontend**: Exemplos de uso
- **Segurança**: Melhores práticas documentadas

## [2025-08-09 23:50] — Configuração de Ambiente e Isolamento Deno
### 🔧 **Ambiente de Desenvolvimento**
- **Edge Function .env**: Arquivo de configuração local criado com placeholders seguros
- **VS Code**: Deno isolado apenas na pasta `supabase/functions/create-user` via `deno.enablePaths`
- **Imports**: Migração completa para npm/jsr (removido esm.sh instável)
- **GitIgnore**: Proteção de credenciais (.env ignorado no Git)
- **Documentação**: README.md criado na função com comandos de desenvolvimento

### 🛡️ **Segurança Aprimorada**
- **Variáveis de Ambiente**: Todas as credenciais carregadas via `Deno.env.get()`
- **Validação**: Verificação obrigatória de todas as env vars ao inicializar
- **CORS**: Headers completos para requisições cross-origin
- **Isolamento**: Deno não interfere mais nos arquivos JS do frontend

### 📝 **Comandos de Desenvolvimento**
```bash
# Servir localmente
supabase functions serve create-user --env-file supabase/functions/create-user/.env

# Cache de dependências
deno cache --lock=deno.lock --lock-write index.ts

# Deploy para produção
supabase functions deploy create-user
```

## [2025-08-09 23:45] — Deno/VSCode + Edge Function
- **VS Code**: `.vscode/settings.json` adicionado (Deno habilitado, import hosts)
- **Edge Function**: `supabase/functions/create-user` padronizada (import_map, deno.json)
- **TypeScript**: `index.ts` com validações e rollback seguro, imports padronizados
- **Frontend**: `funcionarios.js` integrou chamada com Bearer e hydrate pós-criação
- **Database**: `edge-function-rls.sql` aplicado (service_role em profiles)
- **Docs**: `EDGE_FUNCTION_README.md` atualizado (deploy/teste rápido)

## [2025-08-09 23:15] — Revisão Final RBAC + RLS + Edge Function (Sistema Completo)
### 🔧 **Backend Seguro Implementado**
- **Edge Function**: Sistema de criação de usuários via backend seguro (supabase/functions/create-user/)
- **SERVICE_ROLE_KEY**: Mantido apenas no backend, zero exposição no frontend
- **Autenticação JWT**: Validação completa em cada requisição
- **Autorização RBAC**: Apenas director/admin podem criar usuários

### 🛡️ **RBAC Padronizado**
- **isUserRoleIn(allowedRoles)**: Para verificações com arrays de roles
- **isRoleAllowed(section, action)**: Alias para checkTabAccess (compatibilidade UI)
- **checkTabAccess(section, action)**: Função principal para tab_access
- **Imports**: Todas dependências de RBAC corrigidas em todos os módulos

### 🗄️ **Database Cache Corrigido**
- **Zero db.push()**: Eliminados todos os pushes diretos no cache
- **Hydrate após insert**: Todos os inserts seguidos por hydrate para atualizar cache
- **addColumnIfExists**: Uso correto para campos opcionais como created_by
- **Supabase Integration**: Todas operações via API, sem mutações locais

### 📋 **Checklists de Segurança Validados**
- ✅ **Segurança**: Zero SERVICE_ROLE ou process.env no frontend
- ✅ **Legado**: Nenhum db.next* ou push direto em arquivos ativos
- ✅ **RBAC**: Funções padronizadas com assinaturas corretas
- ✅ **Imports**: Todos os módulos importam db de ./database.js corretamente
- ✅ **Stock**: addColumnIfExists implementado para created_by
- ✅ **Edge Function**: Integração completa com autenticação Bearer

### 🔄 **Funcionarios.js Aprimorado**
- **Role Creation**: Substituído push local por insert Supabase
- **Error Handling**: Tratamento específico para erro 23505 (duplicidade)
- **Async/Await**: Função saveRole() tornada async para Supabase
- **Cache Update**: hydrate('roles') após criação bem-sucedida
- **User Creation**: Integração completa com Edge Function

### 📚 **Documentação Completa**
- **EDGE_FUNCTION_README.md**: Guia completo de implementação
- **sql/edge-function-rls.sql**: Políticas RLS para Edge Functions
- **sql/test-edge-function.sql**: Scripts de validação e teste

## [2025-08-09 22:45] — Regressão final (Supabase + RLS)
- Login handler corrigido (toast só em falha)
- Boot seguro com getSession + hydrateAll condicional
- Removidos contadores/mutações locais remanescentes
- Confirmado: zero `process.env`/`SERVICE_ROLE` no front
- Smoke test OK (auth/rest endpoints 200/201)
- Appointments: suporte explícito no database.js + hydrate automático
- Main.js: mutações db.next* e db.*.push totalmente eliminadas
- Network: todas operações via funções canônicas Supabase

## [2025-08-09 20:30] — Hotfix: RLS + Boot Seguro (produção estável)
- SQL: função public.is_admin(uuid) criada para quebrar recursão RLS infinita
- SQL: todas as políticas reescritas usando is_admin(auth.uid()) - corrige erro 42P17
- js/main.js: bootApp() implementado - só hidrata com sessão válida, evita 500s no boot
- js/main.js: populateDemoCredentials() sem db.* - corrige "db is not defined" na tela de login
- js/auth.js: hydrateAll() mantido apenas após login bem-sucedido
- fix-rls-recursion.sql: script completo gerado para aplicar no Supabase
- Console limpo: sem RLS recursion, sem hidratação prematura, boot condicional por sessão

## [2025-08-09 19:15] — Hotfix: Login Deploy (Vercel estático)
- index.html: window.__ENV com valores reais do Supabase (URL/ANON_KEY) — corrige login em produção
- js/main.js: login handler com async/await + proteção contra dupla ligação — corrige reload de página
- Limpeza completa: removidas todas as chamadas saveDb()/saveDatabase() em todos os módulos
- js/schedule.js: removido import inválido de saveDatabase — corrige boot error
- main.js: removida função local duplicada addStockItem — usa apenas stock.js canônico
- Deploy preparado para Vercel: ENV injetado, módulos ordenados, console limpo

## [2025-08-09 17:45] — Hotfix: Console Clean
- index.html: valores reais injetados em window.__ENV (Supabase URL/KEY) — corrige "Invalid URL"
- js/schedule.js: removida duplicata editSchedule; mantido export canônico com 2 parâmetros — corrige "already been declared"
- index.html: comentado asset login_badge.png para evitar 404
- Console limpo dos 3 erros críticos

## [2025-08-08 12:30] — Início da migração Supabase + RLS
- Backup completo criado em /backup
- websim.config.json movido para backup/ (se existente)
- Nenhuma alteração funcional realizada

## [2025-08-09 16:00] — Financial.js Schema Alignment + Async Fix
- js/financial.js: removido saveDb, nextDailyNoteId, createdAt/createdBy, fileName/fileData
- Campos alinhados ao schema: file_name, file_data, created_at, category
- FileReader.onload convertido para async function (corrige await error)
- CSV export atualizado para usar file_name
- Eliminada persistência local, apenas hydrate('dailyNotes') após mutations

## [2025-08-09 15:45] — B4 Passo 3 (Estoque, Financeiro, Funcionários)
- js/stock.js: +addStockItem, +updateStock, +deleteStockItem (Supabase + RLS + hydrate)
- js/financial.js: +addDailyNote, +deleteDailyNote
- js/funcionarios.js: +listUsers, +updateUserProfile (profiles)
- js/main.js: troca exclusão de estoque para wrapper deleteStockItem; removidos imports duplicados
- js/database.js: confirmadas fatias e hydrate para stock/dailyNotes/users/appointments
- Sanity: sem mutação local, sem process.env, sem SERVICE_ROLE no front

## [2025-08-09 14:30] — Hotfix: Console Clean
- lib/supabaseClient.js criado com CDN @supabase/supabase-js@2
- window.__ENV e script module injetados no index.html antes de js/main.js
- Cliente Supabase configurado para front estático
