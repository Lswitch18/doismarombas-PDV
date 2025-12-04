-- Create table for cash register movements
CREATE TABLE public.movimentacoes_caixa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caixa_id UUID NOT NULL REFERENCES public.caixas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor NUMERIC NOT NULL,
  descricao TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.movimentacoes_caixa ENABLE ROW LEVEL SECURITY;

-- Create policy for full access
CREATE POLICY "Permitir acesso total a movimentacoes_caixa"
ON public.movimentacoes_caixa
FOR ALL
USING (true)
WITH CHECK (true);