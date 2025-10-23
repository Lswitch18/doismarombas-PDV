import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Fornecedor {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  contato_responsavel?: string;
  observacoes?: string;
  ativo: boolean;
}

export const useFornecedores = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fornecedores, isLoading } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("*")
        .order("nome");
      
      if (error) throw error;
      return data as Fornecedor[];
    },
  });

  const addFornecedor = useMutation({
    mutationFn: async (fornecedor: Omit<Fornecedor, "id">) => {
      const { data, error } = await supabase
        .from("fornecedores")
        .insert(fornecedor)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      toast({ title: "Fornecedor adicionado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar fornecedor", variant: "destructive" });
    },
  });

  const updateFornecedor = useMutation({
    mutationFn: async ({ id, ...fornecedor }: Partial<Fornecedor> & { id: string }) => {
      const { data, error } = await supabase
        .from("fornecedores")
        .update(fornecedor)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      toast({ title: "Fornecedor atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar fornecedor", variant: "destructive" });
    },
  });

  const deleteFornecedor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("fornecedores")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      toast({ title: "Fornecedor removido com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao remover fornecedor", variant: "destructive" });
    },
  });

  return {
    fornecedores,
    isLoading,
    addFornecedor,
    updateFornecedor,
    deleteFornecedor,
  };
};
