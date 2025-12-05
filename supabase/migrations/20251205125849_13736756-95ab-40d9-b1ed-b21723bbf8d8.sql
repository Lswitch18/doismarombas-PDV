-- Criar tabela de pagamentos por venda para suportar múltiplas formas de pagamento
CREATE TABLE public.pagamentos_venda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  forma_pagamento TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pagamentos_venda ENABLE ROW LEVEL SECURITY;

-- Policy for full access
CREATE POLICY "Permitir acesso total a pagamentos_venda"
ON public.pagamentos_venda
AS RESTRICTIVE
FOR ALL
USING (true)
WITH CHECK (true);