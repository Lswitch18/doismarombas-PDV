-- Tabela de Produtos
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  preco DECIMAL(10, 2) NOT NULL,
  estoque INTEGER NOT NULL DEFAULT 0,
  estoque_minimo INTEGER NOT NULL DEFAULT 5,
  codigo_barras TEXT UNIQUE,
  categoria TEXT,
  marca TEXT,
  descricao TEXT,
  imagem_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Clientes
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  cpf TEXT UNIQUE,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Fornecedores
CREATE TABLE public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  cnpj TEXT UNIQUE,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  contato_responsavel TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Vendas
CREATE TABLE public.vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id),
  total DECIMAL(10, 2) NOT NULL,
  desconto DECIMAL(10, 2) DEFAULT 0,
  valor_recebido DECIMAL(10, 2),
  troco DECIMAL(10, 2),
  forma_pagamento TEXT NOT NULL,
  status TEXT DEFAULT 'concluida',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Itens de Venda
CREATE TABLE public.itens_venda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID REFERENCES public.vendas(id) ON DELETE CASCADE NOT NULL,
  produto_id UUID REFERENCES public.produtos(id) NOT NULL,
  quantidade INTEGER NOT NULL,
  preco_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Movimentações de Estoque
CREATE TABLE public.movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID REFERENCES public.produtos(id) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
  quantidade INTEGER NOT NULL,
  quantidade_anterior INTEGER NOT NULL,
  quantidade_nova INTEGER NOT NULL,
  motivo TEXT,
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  venda_id UUID REFERENCES public.vendas(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (acesso público para sistema de caixa)
CREATE POLICY "Permitir acesso total a produtos" ON public.produtos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total a clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total a fornecedores" ON public.fornecedores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total a vendas" ON public.vendas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total a itens_venda" ON public.itens_venda FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total a movimentacoes_estoque" ON public.movimentacoes_estoque FOR ALL USING (true) WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para atualizar estoque automaticamente após venda
CREATE OR REPLACE FUNCTION public.atualizar_estoque_apos_venda()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_estoque_apos_venda
AFTER INSERT ON public.itens_venda
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_estoque_apos_venda();

-- Inserir dados de exemplo
INSERT INTO public.produtos (nome, preco, estoque, estoque_minimo, codigo_barras, categoria, marca) VALUES
('Coca-Cola 2L', 8.99, 50, 10, '7894900011517', 'Bebidas', 'Coca-Cola'),
('Arroz Tipo 1 5kg', 25.90, 30, 5, '7891234567890', 'Alimentos', 'Tio João'),
('Feijão Preto 1kg', 7.50, 40, 10, '7891234567891', 'Alimentos', 'Camil'),
('Macarrão 500g', 4.99, 60, 15, '7891234567892', 'Alimentos', 'Barilla'),
('Açúcar 1kg', 4.50, 35, 10, '7891234567893', 'Alimentos', 'União'),
('Café 500g', 12.90, 25, 8, '7891234567894', 'Alimentos', 'Pilão'),
('Leite Integral 1L', 5.50, 45, 12, '7891234567895', 'Laticínios', 'Parmalat'),
('Pão de Forma', 8.90, 20, 5, '7891234567896', 'Padaria', 'Pullman'),
('Manteiga 500g', 15.90, 18, 5, '7891234567897', 'Laticínios', 'Aviação'),
('Sabonete', 2.50, 100, 20, '7891234567898', 'Higiene', 'Dove');

INSERT INTO public.clientes (nome, email, telefone, cpf) VALUES
('João Silva', 'joao@email.com', '11999998888', '12345678901'),
('Maria Santos', 'maria@email.com', '11988887777', '98765432109'),
('Pedro Oliveira', 'pedro@email.com', '11977776666', '45678912345');

INSERT INTO public.fornecedores (nome, email, telefone, cnpj, contato_responsavel) VALUES
('Distribuidora ABC', 'contato@abc.com', '1133334444', '12345678000190', 'Carlos Souza'),
('Atacadão XYZ', 'vendas@xyz.com', '1144445555', '98765432000180', 'Ana Lima');