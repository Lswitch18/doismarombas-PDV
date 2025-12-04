import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MovimentacaoCaixa {
  id: string;
  caixa_id: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  descricao: string;
  created_at: string;
}

export const useMovimentacoesCaixa = (caixaId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: movimentacoes, isLoading } = useQuery({
    queryKey: ["movimentacoes-caixa", caixaId],
    queryFn: async () => {
      if (!caixaId) return [];
      
      const { data, error } = await supabase
        .from("movimentacoes_caixa")
        .select("*")
        .eq("caixa_id", caixaId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as MovimentacaoCaixa[];
    },
    enabled: !!caixaId,
  });

  const { data: todasMovimentacoes } = useQuery({
    queryKey: ["todas-movimentacoes-caixa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movimentacoes_caixa")
        .select("*, caixas(data_abertura)")
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
  });

  const adicionarMovimentacao = useMutation({
    mutationFn: async ({ 
      caixa_id, 
      tipo, 
      valor, 
      descricao 
    }: Omit<MovimentacaoCaixa, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from("movimentacoes_caixa")
        .insert({ caixa_id, tipo, valor, descricao })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["movimentacoes-caixa", variables.caixa_id] });
      queryClient.invalidateQueries({ queryKey: ["todas-movimentacoes-caixa"] });
      toast({ 
        title: variables.tipo === 'entrada' 
          ? "Entrada registrada com sucesso!" 
          : "Saída registrada com sucesso!" 
      });
    },
    onError: () => {
      toast({ title: "Erro ao registrar movimentação", variant: "destructive" });
    },
  });

  const totalEntradas = movimentacoes?.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + Number(m.valor), 0) || 0;
  const totalSaidas = movimentacoes?.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + Number(m.valor), 0) || 0;

  return {
    movimentacoes,
    todasMovimentacoes,
    isLoading,
    adicionarMovimentacao,
    totalEntradas,
    totalSaidas,
  };
};
