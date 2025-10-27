-- Criar tabela de configurações da empresa
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_empresa TEXT NOT NULL DEFAULT 'Dois Marombas',
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  notificacoes_email BOOLEAN NOT NULL DEFAULT true,
  notificacoes_estoque BOOLEAN NOT NULL DEFAULT true,
  modo_escuro BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (permitir leitura e escrita para todos usuários autenticados)
CREATE POLICY "Qualquer um pode visualizar configurações"
ON public.configuracoes
FOR SELECT
USING (true);

CREATE POLICY "Qualquer um pode atualizar configurações"
ON public.configuracoes
FOR UPDATE
USING (true);

CREATE POLICY "Qualquer um pode inserir configurações"
ON public.configuracoes
FOR INSERT
WITH CHECK (true);

-- Inserir configuração padrão
INSERT INTO public.configuracoes (nome_empresa, email, telefone)
VALUES ('Dois Marombas', 'contato@doismarombas.com', '(11) 98765-4321')
ON CONFLICT DO NOTHING;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_configuracoes_updated_at
BEFORE UPDATE ON public.configuracoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();