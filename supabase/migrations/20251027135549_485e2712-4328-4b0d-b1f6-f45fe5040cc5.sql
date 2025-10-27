-- Corrigir foreign keys para permitir exclusão em cascata

-- 1. Remover foreign keys antigas
ALTER TABLE public.itens_venda 
DROP CONSTRAINT IF EXISTS itens_venda_produto_id_fkey;

ALTER TABLE public.movimentacoes_estoque 
DROP CONSTRAINT IF EXISTS movimentacoes_estoque_produto_id_fkey;

-- 2. Adicionar foreign keys com DELETE CASCADE
ALTER TABLE public.itens_venda 
ADD CONSTRAINT itens_venda_produto_id_fkey 
FOREIGN KEY (produto_id) 
REFERENCES public.produtos(id) 
ON DELETE CASCADE;

ALTER TABLE public.movimentacoes_estoque 
ADD CONSTRAINT movimentacoes_estoque_produto_id_fkey 
FOREIGN KEY (produto_id) 
REFERENCES public.produtos(id) 
ON DELETE CASCADE;

-- 3. Fazer o mesmo para outras foreign keys relacionadas

-- Foreign key de venda em itens_venda
ALTER TABLE public.itens_venda 
DROP CONSTRAINT IF EXISTS itens_venda_venda_id_fkey;

ALTER TABLE public.itens_venda 
ADD CONSTRAINT itens_venda_venda_id_fkey 
FOREIGN KEY (venda_id) 
REFERENCES public.vendas(id) 
ON DELETE CASCADE;

-- Foreign key de venda em movimentacoes_estoque
ALTER TABLE public.movimentacoes_estoque 
DROP CONSTRAINT IF EXISTS movimentacoes_estoque_venda_id_fkey;

ALTER TABLE public.movimentacoes_estoque 
ADD CONSTRAINT movimentacoes_estoque_venda_id_fkey 
FOREIGN KEY (venda_id) 
REFERENCES public.vendas(id) 
ON DELETE SET NULL;

-- Foreign key de fornecedor em movimentacoes_estoque
ALTER TABLE public.movimentacoes_estoque 
DROP CONSTRAINT IF EXISTS movimentacoes_estoque_fornecedor_id_fkey;

ALTER TABLE public.movimentacoes_estoque 
ADD CONSTRAINT movimentacoes_estoque_fornecedor_id_fkey 
FOREIGN KEY (fornecedor_id) 
REFERENCES public.fornecedores(id) 
ON DELETE SET NULL;

-- Foreign key de cliente em vendas
ALTER TABLE public.vendas 
DROP CONSTRAINT IF EXISTS vendas_cliente_id_fkey;

ALTER TABLE public.vendas 
ADD CONSTRAINT vendas_cliente_id_fkey 
FOREIGN KEY (cliente_id) 
REFERENCES public.clientes(id) 
ON DELETE SET NULL;

-- Comentários explicativos
COMMENT ON CONSTRAINT itens_venda_produto_id_fkey ON public.itens_venda 
IS 'Deletar em cascata: quando um produto é removido, seus itens de venda também são removidos';

COMMENT ON CONSTRAINT movimentacoes_estoque_produto_id_fkey ON public.movimentacoes_estoque 
IS 'Deletar em cascata: quando um produto é removido, suas movimentações também são removidas';

COMMENT ON CONSTRAINT itens_venda_venda_id_fkey ON public.itens_venda 
IS 'Deletar em cascata: quando uma venda é removida, seus itens também são removidos';

COMMENT ON CONSTRAINT movimentacoes_estoque_venda_id_fkey ON public.movimentacoes_estoque 
IS 'SET NULL: quando uma venda é removida, a referência na movimentação fica nula';

COMMENT ON CONSTRAINT movimentacoes_estoque_fornecedor_id_fkey ON public.movimentacoes_estoque 
IS 'SET NULL: quando um fornecedor é removido, a referência na movimentação fica nula';

COMMENT ON CONSTRAINT vendas_cliente_id_fkey ON public.vendas 
IS 'SET NULL: quando um cliente é removido, as vendas mantêm registro mas sem cliente associado';