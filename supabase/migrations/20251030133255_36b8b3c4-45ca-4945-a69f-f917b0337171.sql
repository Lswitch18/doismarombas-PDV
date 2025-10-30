-- Adicionar campo preco_aquisicao na tabela produtos
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS preco_aquisicao DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Criar tabela para registro de lucros diários
CREATE TABLE IF NOT EXISTS public.lucros_diarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  lucro_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(data)
);

-- Habilitar RLS na tabela lucros_diarios
ALTER TABLE public.lucros_diarios ENABLE ROW LEVEL SECURITY;

-- Política de acesso total para lucros_diarios
CREATE POLICY "Permitir acesso total a lucros_diarios" ON public.lucros_diarios
FOR ALL USING (true) WITH CHECK (true);

-- Adicionar campos de lucro na tabela itens_venda
ALTER TABLE public.itens_venda
ADD COLUMN IF NOT EXISTS preco_aquisicao DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS lucro_unitario DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS lucro_total DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Adicionar campo de lucro total na tabela vendas
ALTER TABLE public.vendas
ADD COLUMN IF NOT EXISTS lucro_total DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Função para calcular e atualizar lucro ao criar item de venda
CREATE OR REPLACE FUNCTION public.calcular_lucro_item_venda()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_preco_aquisicao DECIMAL(10, 2);
BEGIN
  -- Buscar preço de aquisição do produto
  SELECT preco_aquisicao INTO v_preco_aquisicao
  FROM public.produtos
  WHERE id = NEW.produto_id;
  
  -- Calcular lucros
  NEW.preco_aquisicao := v_preco_aquisicao;
  NEW.lucro_unitario := NEW.preco_unitario - v_preco_aquisicao;
  NEW.lucro_total := NEW.lucro_unitario * NEW.quantidade;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para calcular lucro ao inserir item de venda
DROP TRIGGER IF EXISTS trigger_calcular_lucro_item ON public.itens_venda;
CREATE TRIGGER trigger_calcular_lucro_item
BEFORE INSERT ON public.itens_venda
FOR EACH ROW
EXECUTE FUNCTION public.calcular_lucro_item_venda();

-- Função para atualizar lucro total da venda
CREATE OR REPLACE FUNCTION public.atualizar_lucro_venda()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lucro_total DECIMAL(10, 2);
BEGIN
  -- Calcular lucro total da venda
  SELECT COALESCE(SUM(lucro_total), 0) INTO v_lucro_total
  FROM public.itens_venda
  WHERE venda_id = NEW.venda_id;
  
  -- Atualizar lucro na venda
  UPDATE public.vendas
  SET lucro_total = v_lucro_total
  WHERE id = NEW.venda_id;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para atualizar lucro da venda após inserir item
DROP TRIGGER IF EXISTS trigger_atualizar_lucro_venda ON public.itens_venda;
CREATE TRIGGER trigger_atualizar_lucro_venda
AFTER INSERT ON public.itens_venda
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_lucro_venda();

-- Função para consolidar lucro diário
CREATE OR REPLACE FUNCTION public.consolidar_lucro_diario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_data DATE;
  v_lucro_dia DECIMAL(10, 2);
BEGIN
  -- Data da venda
  v_data := DATE(NEW.created_at);
  
  -- Calcular lucro do dia
  SELECT COALESCE(SUM(lucro_total), 0) INTO v_lucro_dia
  FROM public.vendas
  WHERE DATE(created_at) = v_data
  AND status = 'concluida';
  
  -- Inserir ou atualizar lucro diário
  INSERT INTO public.lucros_diarios (data, lucro_total)
  VALUES (v_data, v_lucro_dia)
  ON CONFLICT (data)
  DO UPDATE SET lucro_total = v_lucro_dia;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para consolidar lucro diário após atualizar venda
DROP TRIGGER IF EXISTS trigger_consolidar_lucro_diario ON public.vendas;
CREATE TRIGGER trigger_consolidar_lucro_diario
AFTER INSERT OR UPDATE OF lucro_total ON public.vendas
FOR EACH ROW
EXECUTE FUNCTION public.consolidar_lucro_diario();