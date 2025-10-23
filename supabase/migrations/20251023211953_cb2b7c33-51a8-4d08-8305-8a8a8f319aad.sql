-- Corrigir search_path das funções
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.atualizar_estoque_apos_venda()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Atualizar o estoque do produto
  UPDATE public.produtos 
  SET estoque = estoque - NEW.quantidade
  WHERE id = NEW.produto_id;
  
  -- Registrar movimentação de estoque
  INSERT INTO public.movimentacoes_estoque (
    produto_id, 
    tipo, 
    quantidade, 
    quantidade_anterior, 
    quantidade_nova,
    motivo,
    venda_id
  )
  SELECT 
    NEW.produto_id,
    'saida',
    NEW.quantidade,
    p.estoque + NEW.quantidade,
    p.estoque,
    'Venda realizada',
    NEW.venda_id
  FROM public.produtos p
  WHERE p.id = NEW.produto_id;
  
  RETURN NEW;
END;
$$;