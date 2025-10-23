import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Venda {
  id: string;
  cliente_id?: string;
  total: number;
  desconto: number;
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
      itens 
    }: { 
      venda: Omit<Venda, "id" | "created_at">; 
      itens: ItemVenda[] 
    }) => {
      const { data: vendaData, error: vendaError } = await supabase
        .from("vendas")
        .insert(venda)
        .select()
        .single();
      
      if (vendaError) throw vendaError;

      const itensComVendaId = itens.map(item => ({
        ...item,
        venda_id: vendaData.id,
      }));

      const { error: itensError } = await supabase
        .from("itens_venda")
        .insert(itensComVendaId);
      
      if (itensError) throw itensError;

      return vendaData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendas"] });
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast({ title: "Venda finalizada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao finalizar venda", variant: "destructive" });
    },
  });

  return {
    vendas,
    isLoading,
    criarVenda,
  };
};
