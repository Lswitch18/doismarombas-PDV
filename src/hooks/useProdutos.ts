import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Produto {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  estoque_minimo: number;
  codigo_barras?: string;
  categoria?: string;
  marca?: string;
  descricao?: string;
  imagem_url?: string;
  ativo: boolean;
}

export const useProdutos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: produtos, isLoading } = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .order("nome");
      
      if (error) throw error;
      return data as Produto[];
    },
  });

  const addProduto = useMutation({
    mutationFn: async (produto: Omit<Produto, "id">) => {
      const { data, error } = await supabase
        .from("produtos")
        .insert(produto)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast({ title: "Produto adicionado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar produto", variant: "destructive" });
    },
  });

  const updateProduto = useMutation({
    mutationFn: async ({ id, ...produto }: Partial<Produto> & { id: string }) => {
      const { data, error } = await supabase
        .from("produtos")
        .update(produto)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast({ title: "Produto atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar produto", variant: "destructive" });
    },
  });

  const deleteProduto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("produtos")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast({ title: "Produto removido com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao remover produto", variant: "destructive" });
    },
  });

  return {
    produtos,
    isLoading,
    addProduto,
    updateProduto,
    deleteProduto,
  };
};
