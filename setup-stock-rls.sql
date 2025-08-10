-- Configuração RLS para stock_items
-- Executa no SQL Editor do Supabase

-- 1. Criar coluna created_by se não existir
ALTER TABLE stock_items
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- 2. Definir valor padrão para novos itens
ALTER TABLE stock_items
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- 3. Ativar RLS na tabela
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;

-- 4. Política: Usuário vê apenas seus próprios itens
DROP POLICY IF EXISTS "user_select_own_stock_items" ON stock_items;
CREATE POLICY "user_select_own_stock_items"
ON stock_items
FOR SELECT
USING (auth.uid() = created_by);

-- 5. Política: Usuário insere seus próprios itens
DROP POLICY IF EXISTS "user_insert_own_stock_items" ON stock_items;
CREATE POLICY "user_insert_own_stock_items"
ON stock_items
FOR INSERT
WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- 6. Política: Usuário edita apenas seus itens
DROP POLICY IF EXISTS "user_update_own_stock_items" ON stock_items;
CREATE POLICY "user_update_own_stock_items"
ON stock_items
FOR UPDATE
USING (auth.uid() = created_by);

-- 7. Política: Usuário deleta apenas seus itens
DROP POLICY IF EXISTS "user_delete_own_stock_items" ON stock_items;
CREATE POLICY "user_delete_own_stock_items"
ON stock_items
FOR DELETE
USING (auth.uid() = created_by);

-- 8. Políticas especiais para DIRETOR ter acesso total
-- Permitir que director veja todos os itens
DROP POLICY IF EXISTS "director_select_all_stock_items" ON stock_items;
CREATE POLICY "director_select_all_stock_items"
ON stock_items
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid()
    AND role = 'director'
));

-- Permitir que director edite todos os itens
DROP POLICY IF EXISTS "director_update_all_stock_items" ON stock_items;
CREATE POLICY "director_update_all_stock_items"
ON stock_items
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid()
    AND role = 'director'
));

-- Permitir que director delete todos os itens
DROP POLICY IF EXISTS "director_delete_all_stock_items" ON stock_items;
CREATE POLICY "director_delete_all_stock_items"
ON stock_items
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid()
    AND role = 'director'
));

-- Permitir que director insira itens sem restrição
DROP POLICY IF EXISTS "director_insert_all_stock_items" ON stock_items;
CREATE POLICY "director_insert_all_stock_items"
ON stock_items
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid()
    AND role = 'director'
));

-- 9. (Opcional) Política para admins verem todos os itens
-- Substitua 'admin' pelo role adequado do seu sistema
DROP POLICY IF EXISTS "admin_full_access_stock_items" ON stock_items;
CREATE POLICY "admin_full_access_stock_items"
ON stock_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 10. Atualizar itens existentes sem created_by
UPDATE stock_items 
SET created_by = user_id 
WHERE created_by IS NULL AND user_id IS NOT NULL;
