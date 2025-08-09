# CHANGELOG

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
