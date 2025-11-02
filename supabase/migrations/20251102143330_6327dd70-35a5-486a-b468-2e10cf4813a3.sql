-- Criar tabela para controle de caixa
CREATE TABLE public.caixas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_abertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_fechamento TIMESTAMP WITH TIME ZONE,
  valor_inicial NUMERIC(10, 2) NOT NULL DEFAULT 0,
  valor_final NUMERIC(10, 2),
  total_vendas NUMERIC(10, 2) DEFAULT 0,
  total_dinheiro NUMERIC(10, 2) DEFAULT 0,
  total_pix NUMERIC(10, 2) DEFAULT 0,
  total_credito NUMERIC(10, 2) DEFAULT 0,
  total_debito NUMERIC(10, 2) DEFAULT 0,
  lucro_total NUMERIC(10, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.caixas ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso total
CREATE POLICY "Permitir acesso total a caixas" 
ON public.caixas 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Adicionar trigger para atualizar updated_at
CREATE TRIGGER update_caixas_updated_at
BEFORE UPDATE ON public.caixas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar coluna caixa_id na tabela vendas
ALTER TABLE public.vendas ADD COLUMN caixa_id UUID REFERENCES public.caixas(id);