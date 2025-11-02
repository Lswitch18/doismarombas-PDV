import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Caixa {
  id: string;
  data_abertura: string;
  data_fechamento?: string;
  valor_inicial: number;
  valor_final?: number;
  total_vendas?: number;
  total_dinheiro?: number;
  total_pix?: number;
  total_credito?: number;
  total_debito?: number;
  lucro_total?: number;
  status: 'aberto' | 'fechado';
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export const useCaixas = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: caixaAberto, isLoading } = useQuery({
    queryKey: ["caixa-aberto"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caixas")
        .select("*")
        .eq("status", "aberto")
        .order("data_abertura", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as Caixa | null;
    },
  });

  const { data: historicoCaixas } = useQuery({
    queryKey: ["historico-caixas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caixas")
        .select("*")
        .order("data_abertura", { ascending: false })
        .limit(30);
      
      if (error) throw error;
      return data as Caixa[];
    },
  });

  const abrirCaixa = useMutation({
    mutationFn: async ({ valor_inicial, observacoes }: { valor_inicial: number; observacoes?: string }) => {
      const { data, error } = await supabase
        .from("caixas")
        .insert({
          valor_inicial,
          observacoes,
          status: 'aberto'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caixa-aberto"] });
      queryClient.invalidateQueries({ queryKey: ["historico-caixas"] });
      toast({ title: "Caixa aberto com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao abrir caixa", variant: "destructive" });
    },
  });

  const fecharCaixa = useMutation({
    mutationFn: async ({ 
      caixaId, 
      observacoes 
    }: { 
      caixaId: string; 
      observacoes?: string;
    }) => {
      // Buscar vendas do caixa
      const { data: vendas, error: vendasError } = await supabase
        .from("vendas")
        .select("total, lucro_total, forma_pagamento")
        .eq("caixa_id", caixaId)
        .eq("status", "concluida");
      
      if (vendasError) throw vendasError;

      // Calcular totais por forma de pagamento
      const totais = vendas?.reduce((acc, venda) => {
        const total = Number(venda.total);
        const lucro = Number(venda.lucro_total || 0);
        
        acc.total_vendas += total;
        acc.lucro_total += lucro;
        
        switch (venda.forma_pagamento?.toLowerCase()) {
          case 'dinheiro':
            acc.total_dinheiro += total;
            break;
          case 'pix':
            acc.total_pix += total;
            break;
          case 'credito':
          case 'crédito':
            acc.total_credito += total;
            break;
          case 'debito':
          case 'débito':
            acc.total_debito += total;
            break;
        }
        
        return acc;
      }, {
        total_vendas: 0,
        total_dinheiro: 0,
        total_pix: 0,
        total_credito: 0,
        total_debito: 0,
        lucro_total: 0
      }) || {
        total_vendas: 0,
        total_dinheiro: 0,
        total_pix: 0,
        total_credito: 0,
        total_debito: 0,
        lucro_total: 0
      };

      // Buscar valor inicial do caixa
      const { data: caixa, error: caixaError } = await supabase
        .from("caixas")
        .select("valor_inicial")
        .eq("id", caixaId)
        .single();
      
      if (caixaError) throw caixaError;

      const valor_final = Number(caixa.valor_inicial) + totais.total_dinheiro;

      // Fechar caixa
      const { data, error } = await supabase
        .from("caixas")
        .update({
          data_fechamento: new Date().toISOString(),
          valor_final,
          ...totais,
          status: 'fechado',
          observacoes
        })
        .eq("id", caixaId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caixa-aberto"] });
      queryClient.invalidateQueries({ queryKey: ["historico-caixas"] });
      toast({ title: "Caixa fechado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao fechar caixa", variant: "destructive" });
    },
  });

  return {
    caixaAberto,
    historicoCaixas,
    isLoading,
    abrirCaixa,
    fecharCaixa,
  };
};
