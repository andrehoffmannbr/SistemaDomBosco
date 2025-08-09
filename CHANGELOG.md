# CHANGELOG

## [2025-08-08 12:30] — Início da migração Supabase + RLS
- Backup completo criado em /backup
- websim.config.json movido para backup/ (se existente)
- Nenhuma alteração funcional realizada

## [2025-08-08 12:35] — B2 Supabase Client
- lib/supabaseClient.js criado com CDN @supabase/supabase-js@2
- window.__ENV e script module injetados no index.html antes de js/main.js
- Cliente Supabase configurado para front estático
