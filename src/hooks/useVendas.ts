import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Venda {
  id: string;
  cliente_id?: string;
  caixa_id?: string;
  total: number;
  lucro_total: number;
  desconto: number;
  acrescimo: number;
  valor_recebido?: number;
  troco?: number;
  forma_pagamento: string;
  status: string;
  observacoes?: string;
  created_at: string;
}

export interface ItemVenda {
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export interface PagamentoVenda {
  forma_pagamento: string;
  valor: number;
}

export const useVendas = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vendas, isLoading } = useQuery({
    queryKey: ["vendas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendas")
        .select("*, clientes(nome)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const criarVenda = useMutation({
    mutationFn: async ({ 
      venda, 
      itens,
      pagamentos
    }: { 
      venda: Omit<Venda, "id" | "created_at">; 
      itens: ItemVenda[];
      pagamentos?: PagamentoVenda[];
    }) => {
      // Buscar dados dos produtos para calcular lucro e preço de aquisição
      const produtosIds = itens.map(item => item.produto_id);
      const { data: produtosData, error: produtosError } = await supabase
        .from("produtos")
        .select("id, preco_aquisicao, estoque")
        .in("id", produtosIds);
      
      if (produtosError) throw produtosError;

      // Calcular lucro total da venda
      let lucroTotalVenda = 0;
      const itensComLucro = itens.map(item => {
        const produto = produtosData?.find(p => p.id === item.produto_id);
        const precoAquisicao = produto?.preco_aquisicao || 0;
        const lucroUnitario = item.preco_unitario - precoAquisicao;
        const lucroTotal = lucroUnitario * item.quantidade;
        lucroTotalVenda += lucroTotal;
        
        return {
          ...item,
          preco_aquisicao: precoAquisicao,
          lucro_unitario: lucroUnitario,
          lucro_total: lucroTotal,
        };
      });

      // Criar venda com lucro calculado
      const { data: vendaData, error: vendaError } = await supabase
        .from("vendas")
        .insert({
          ...venda,
          lucro_total: lucroTotalVenda,
        })
        .select()
        .single();
      
      if (vendaError) throw vendaError;

      // Inserir itens da venda
      const itensComVendaId = itensComLucro.map(item => ({
        ...item,
        venda_id: vendaData.id,
      }));

      const { error: itensError } = await supabase
        .from("itens_venda")
        .insert(itensComVendaId);
      
      if (itensError) throw itensError;

      // Atualizar estoque dos produtos
      for (const item of itens) {
        const produto = produtosData?.find(p => p.id === item.produto_id);
        if (produto) {
          const novoEstoque = produto.estoque - item.quantidade;
          const { error: estoqueError } = await supabase
            .from("produtos")
            .update({ estoque: novoEstoque })
            .eq("id", item.produto_id);
          
          if (estoqueError) throw estoqueError;
        }
      }

      // Inserir pagamentos múltiplos se existirem
      if (pagamentos && pagamentos.length > 0) {
        const pagamentosComVendaId = pagamentos.map(pag => ({
          venda_id: vendaData.id,
          forma_pagamento: pag.forma_pagamento,
          valor: pag.valor,
        }));

        const { error: pagamentosError } = await supabase
          .from("pagamentos_venda")
          .insert(pagamentosComVendaId);
        
        if (pagamentosError) throw pagamentosError;
      }

      return vendaData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendas"] });
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast({ title: "Venda finalizada com sucesso!" });
    },
    onError: (error) => {
      console.error("Erro ao finalizar venda:", error);
      toast({ title: "Erro ao finalizar venda", variant: "destructive" });
    },
  });

  return {
    vendas,
    isLoading,
    criarVenda,
  };
};
