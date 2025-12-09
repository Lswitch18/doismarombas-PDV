-- Remover política existente restritiva
DROP POLICY IF EXISTS "Permitir acesso total a pagamentos_venda" ON public.pagamentos_venda;

-- Criar política permissiva para todas as operações
CREATE POLICY "Permitir acesso total a pagamentos_venda" 
ON public.pagamentos_venda
FOR ALL 
USING (true) 
WITH CHECK (true);