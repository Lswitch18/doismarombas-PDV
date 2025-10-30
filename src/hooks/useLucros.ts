import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

export interface LucroDiario {
  id: string;
  data: string;
  lucro_total: number;
  created_at: string;
}

export const useLucros = () => {
  const { data: lucros, isLoading } = useQuery({
    queryKey: ["lucros"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lucros_diarios")
        .select("*")
        .order("data", { ascending: false });
      
      if (error) throw error;
      return data as LucroDiario[];
    },
  });

  const calcularLucroPeriodo = async (inicio: Date, fim: Date) => {
    const { data, error } = await supabase
      .from("vendas")
      .select("lucro_total, created_at")
      .gte("created_at", inicio.toISOString())
      .lte("created_at", fim.toISOString())
      .eq("status", "concluida");
    
    if (error) throw error;
    
    return data?.reduce((acc, v) => acc + Number(v.lucro_total), 0) || 0;
  };

  const { data: lucroDia } = useQuery({
    queryKey: ["lucro-dia"],
    queryFn: async () => {
      const hoje = new Date();
      return calcularLucroPeriodo(startOfDay(hoje), endOfDay(hoje));
    },
  });

  const { data: lucroMes } = useQuery({
    queryKey: ["lucro-mes"],
    queryFn: async () => {
      const hoje = new Date();
      return calcularLucroPeriodo(startOfMonth(hoje), endOfMonth(hoje));
    },
  });

  const { data: lucroAno } = useQuery({
    queryKey: ["lucro-ano"],
    queryFn: async () => {
      const hoje = new Date();
      return calcularLucroPeriodo(startOfYear(hoje), endOfYear(hoje));
    },
  });

  return {
    lucros,
    isLoading,
    lucroDia: lucroDia || 0,
    lucroMes: lucroMes || 0,
    lucroAno: lucroAno || 0,
  };
};