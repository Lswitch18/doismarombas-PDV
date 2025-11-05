import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startOfDay, endOfDay } from "date-fns";

interface ZerarContadorOpcoes {
  zerarLucros: boolean;
  zerarVendas: boolean;
  zerarVendasDia: boolean;
  zerarCaixas: boolean;
}

export function useZerarContador() {
  const queryClient = useQueryClient();

  const zerarContador = useMutation({
    mutationFn: async (opcoes: ZerarContadorOpcoes) => {
      const erros: string[] = [];

      // 1. Zerar lucros (sem excluir vendas)
      if (opcoes.zerarLucros) {
        // Zerar lucro_total em vendas
        const { error: vendasError } = await supabase
          .from("vendas")
          .update({ lucro_total: 0 })
          .neq("id", "00000000-0000-0000-0000-000000000000"); // Update all

        if (vendasError) {
          erros.push("Erro ao zerar lucros das vendas");
          console.error(vendasError);
        }

        // Zerar lucros em itens_venda
        const { error: itensError } = await supabase
          .from("itens_venda")
          .update({
            lucro_unitario: 0,
            lucro_total: 0,
          })
          .neq("id", "00000000-0000-0000-0000-000000000000"); // Update all

        if (itensError) {
          erros.push("Erro ao zerar lucros dos itens");
          console.error(itensError);
        }

        // Excluir todos os registros de lucros_diarios
        const { error: lucrosDiariosError } = await supabase
          .from("lucros_diarios")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

        if (lucrosDiariosError) {
          erros.push("Erro ao excluir lucros diários");
          console.error(lucrosDiariosError);
        }
      }

      // 2. Excluir vendas do dia
      if (opcoes.zerarVendasDia) {
        const hoje = new Date();
        const inicioHoje = startOfDay(hoje).toISOString();
        const fimHoje = endOfDay(hoje).toISOString();

        const { error: vendasDiaError } = await supabase
          .from("vendas")
          .delete()
          .gte("created_at", inicioHoje)
          .lte("created_at", fimHoje);

        if (vendasDiaError) {
          erros.push("Erro ao excluir vendas do dia");
          console.error(vendasDiaError);
        }
      }

      // 3. Excluir todas as vendas (e automaticamente seus itens por CASCADE)
      if (opcoes.zerarVendas) {
        const { error: vendasError } = await supabase
          .from("vendas")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

        if (vendasError) {
          erros.push("Erro ao excluir vendas");
          console.error(vendasError);
        }
      }

      // 4. Excluir caixas
      if (opcoes.zerarCaixas) {
        const { error: caixasError } = await supabase
          .from("caixas")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

        if (caixasError) {
          erros.push("Erro ao excluir caixas");
          console.error(caixasError);
        }
      }

      if (erros.length > 0) {
        throw new Error(erros.join(", "));
      }

      return { sucesso: true };
    },
    onSuccess: (_, opcoes) => {
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ["vendas"] });
      queryClient.invalidateQueries({ queryKey: ["lucros"] });
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      queryClient.invalidateQueries({ queryKey: ["caixas"] });

      let mensagem = "Contador zerado com sucesso!";
      const acoes = [];
      
      if (opcoes.zerarLucros) acoes.push("lucros");
      if (opcoes.zerarVendasDia) acoes.push("vendas do dia");
      if (opcoes.zerarVendas) acoes.push("todas as vendas");
      if (opcoes.zerarCaixas) acoes.push("caixas");
      
      if (acoes.length > 0) {
        mensagem = `${acoes.join(", ").toUpperCase()} resetados com sucesso!`;
      }

      toast.success(mensagem);
    },
    onError: (error: Error) => {
      console.error("Erro ao zerar contador:", error);
      toast.error(`Erro ao zerar contador: ${error.message}`);
    },
  });

  return {
    zerarContador: zerarContador.mutate,
    isPending: zerarContador.isPending,
  };
}
