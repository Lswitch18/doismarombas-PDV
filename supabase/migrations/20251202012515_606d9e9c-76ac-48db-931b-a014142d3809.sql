-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Criar tabela para registrar os pings do banco
CREATE TABLE IF NOT EXISTS public.health_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'ok',
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  response_time_ms INTEGER,
  details JSONB
);

-- Habilitar RLS
ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserções do sistema
CREATE POLICY "Permitir acesso total a health_checks"
ON public.health_checks
FOR ALL
USING (true)
WITH CHECK (true);