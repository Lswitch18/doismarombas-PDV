import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database, Download, FileJson, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BackupDadosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BackupDadosModal({ open, onOpenChange }: BackupDadosModalProps) {
  const [loading, setLoading] = useState(false);
  const [incluirProdutos, setIncluirProdutos] = useState(true);
  const [incluirVendas, setIncluirVendas] = useState(true);
  const [incluirClientes, setIncluirClientes] = useState(true);
  const [incluirFornecedores, setIncluirFornecedores] = useState(true);
  const [incluirCaixas, setIncluirCaixas] = useState(true);
  const [incluirMovimentacoes, setIncluirMovimentacoes] = useState(true);
  const [incluirLucros, setIncluirLucros] = useState(true);
  const [incluirConfiguracoes, setIncluirConfiguracoes] = useState(true);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleBackup = async () => {
    setLoading(true);
    
    try {
      const backupData: Record<string, any> = {
        metadata: {
          versao: "1.0",
          dataExportacao: new Date().toISOString(),
          dataFormatada: format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
          tabelas: [] as string[],
        },
        estrutura: {
          descricao: "Backup completo do sistema de gestão",
          tabelasIncluidas: [] as string[],
        },
      };

      // Produtos
      if (incluirProdutos) {
        const { data: produtos, error } = await supabase
          .from("produtos")
          .select("*")
          .order("nome");
        
        if (error) throw error;
        backupData.produtos = produtos || [];
        backupData.metadata.tabelas.push("produtos");
        backupData.estrutura.tabelasIncluidas.push({
          nome: "produtos",
          registros: produtos?.length || 0,
          campos: ["id", "nome", "codigo_barras", "categoria", "marca", "descricao", "preco", "preco_aquisicao", "estoque", "estoque_minimo", "ativo", "imagem_url", "created_at", "updated_at"],
        });
      }

      // Vendas com itens
      if (incluirVendas) {
        const { data: vendas, error: vendasError } = await supabase
          .from("vendas")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (vendasError) throw vendasError;

        const { data: itensVenda, error: itensError } = await supabase
          .from("itens_venda")
          .select("*");
        
        if (itensError) throw itensError;

        backupData.vendas = vendas || [];
        backupData.itens_venda = itensVenda || [];
        backupData.metadata.tabelas.push("vendas", "itens_venda");
        backupData.estrutura.tabelasIncluidas.push(
          {
            nome: "vendas",
            registros: vendas?.length || 0,
            campos: ["id", "cliente_id", "caixa_id", "forma_pagamento", "total", "desconto", "valor_recebido", "troco", "lucro_total", "status", "observacoes", "created_at"],
          },
          {
            nome: "itens_venda",
            registros: itensVenda?.length || 0,
            campos: ["id", "venda_id", "produto_id", "quantidade", "preco_unitario", "preco_aquisicao", "subtotal", "lucro_unitario", "lucro_total", "created_at"],
          }
        );
      }

      // Clientes
      if (incluirClientes) {
        const { data: clientes, error } = await supabase
          .from("clientes")
          .select("*")
          .order("nome");
        
        if (error) throw error;
        backupData.clientes = clientes || [];
        backupData.metadata.tabelas.push("clientes");
        backupData.estrutura.tabelasIncluidas.push({
          nome: "clientes",
          registros: clientes?.length || 0,
          campos: ["id", "nome", "email", "telefone", "cpf", "endereco", "cidade", "estado", "cep", "observacoes", "created_at", "updated_at"],
        });
      }

      // Fornecedores
      if (incluirFornecedores) {
        const { data: fornecedores, error } = await supabase
          .from("fornecedores")
          .select("*")
          .order("nome");
        
        if (error) throw error;
        backupData.fornecedores = fornecedores || [];
        backupData.metadata.tabelas.push("fornecedores");
        backupData.estrutura.tabelasIncluidas.push({
          nome: "fornecedores",
          registros: fornecedores?.length || 0,
          campos: ["id", "nome", "email", "telefone", "cnpj", "endereco", "cidade", "estado", "cep", "contato_responsavel", "observacoes", "ativo", "created_at", "updated_at"],
        });
      }

      // Caixas
      if (incluirCaixas) {
        const { data: caixas, error } = await supabase
          .from("caixas")
          .select("*")
          .order("data_abertura", { ascending: false });
        
        if (error) throw error;
        backupData.caixas = caixas || [];
        backupData.metadata.tabelas.push("caixas");
        backupData.estrutura.tabelasIncluidas.push({
          nome: "caixas",
          registros: caixas?.length || 0,
          campos: ["id", "data_abertura", "data_fechamento", "valor_inicial", "valor_final", "total_vendas", "total_dinheiro", "total_pix", "total_credito", "total_debito", "lucro_total", "status", "observacoes", "created_at", "updated_at"],
        });
      }

      // Movimentações de Estoque
      if (incluirMovimentacoes) {
        const { data: movimentacoes, error } = await supabase
          .from("movimentacoes_estoque")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        backupData.movimentacoes_estoque = movimentacoes || [];
        backupData.metadata.tabelas.push("movimentacoes_estoque");
        backupData.estrutura.tabelasIncluidas.push({
          nome: "movimentacoes_estoque",
          registros: movimentacoes?.length || 0,
          campos: ["id", "produto_id", "tipo", "quantidade", "quantidade_anterior", "quantidade_nova", "motivo", "fornecedor_id", "venda_id", "created_at"],
        });
      }

      // Lucros Diários
      if (incluirLucros) {
        const { data: lucros, error } = await supabase
          .from("lucros_diarios")
          .select("*")
          .order("data", { ascending: false });
        
        if (error) throw error;
        backupData.lucros_diarios = lucros || [];
        backupData.metadata.tabelas.push("lucros_diarios");
        backupData.estrutura.tabelasIncluidas.push({
          nome: "lucros_diarios",
          registros: lucros?.length || 0,
          campos: ["id", "data", "lucro_total", "created_at"],
        });
      }

      // Configurações
      if (incluirConfiguracoes) {
        const { data: configuracoes, error } = await supabase
          .from("configuracoes")
          .select("*");
        
        if (error) throw error;
        backupData.configuracoes = configuracoes || [];
        backupData.metadata.tabelas.push("configuracoes");
        backupData.estrutura.tabelasIncluidas.push({
          nome: "configuracoes",
          registros: configuracoes?.length || 0,
          campos: ["id", "nome_empresa", "email", "telefone", "notificacoes_email", "notificacoes_estoque", "modo_escuro", "created_at", "updated_at"],
        });
      }

      // Adicionar informações de políticas RLS e funções
      backupData.informacoes_sistema = {
        politicas_rls: {
          descricao: "Políticas de Row Level Security (RLS) aplicadas",
          tabelas_protegidas: [
            "produtos", "vendas", "itens_venda", "clientes", "fornecedores",
            "caixas", "movimentacoes_estoque", "lucros_diarios", "configuracoes"
          ],
          politicas: [
            {
              tabela: "produtos",
              politica: "Permitir acesso total a produtos",
              comando: "ALL",
              expressao: "true"
            },
            {
              tabela: "vendas",
              politica: "Permitir acesso total a vendas",
              comando: "ALL",
              expressao: "true"
            },
            {
              tabela: "itens_venda",
              politica: "Permitir acesso total a itens_venda",
              comando: "ALL",
              expressao: "true"
            },
            {
              tabela: "clientes",
              politica: "Permitir acesso total a clientes",
              comando: "ALL",
              expressao: "true"
            },
            {
              tabela: "fornecedores",
              politica: "Permitir acesso total a fornecedores",
              comando: "ALL",
              expressao: "true"
            },
            {
              tabela: "caixas",
              politica: "Permitir acesso total a caixas",
              comando: "ALL",
              expressao: "true"
            },
            {
              tabela: "movimentacoes_estoque",
              politica: "Permitir acesso total a movimentacoes_estoque",
              comando: "ALL",
              expressao: "true"
            },
            {
              tabela: "lucros_diarios",
              politica: "Permitir acesso total a lucros_diarios",
              comando: "ALL",
              expressao: "true"
            },
            {
              tabela: "configuracoes",
              politicas: [
                { nome: "Qualquer um pode visualizar configurações", comando: "SELECT" },
                { nome: "Qualquer um pode inserir configurações", comando: "INSERT" },
                { nome: "Qualquer um pode atualizar configurações", comando: "UPDATE" }
              ]
            }
          ]
        },
        funcoes_banco: {
          descricao: "Funções do banco de dados",
          funcoes: [
            {
              nome: "calcular_lucro_item_venda",
              tipo: "TRIGGER",
              descricao: "Calcula automaticamente o lucro de cada item vendido"
            },
            {
              nome: "atualizar_lucro_venda",
              tipo: "TRIGGER",
              descricao: "Atualiza o lucro total da venda após inserção de itens"
            },
            {
              nome: "consolidar_lucro_diario",
              tipo: "TRIGGER",
              descricao: "Consolida o lucro diário após cada venda"
            },
            {
              nome: "update_updated_at_column",
              tipo: "TRIGGER",
              descricao: "Atualiza automaticamente a coluna updated_at"
            },
            {
              nome: "atualizar_estoque_apos_venda",
              tipo: "TRIGGER",
              descricao: "Atualiza o estoque do produto após uma venda"
            }
          ]
        },
        triggers: {
          descricao: "Triggers ativos no sistema",
          lista: [
            { tabela: "itens_venda", trigger: "trigger_calcular_lucro_item", funcao: "calcular_lucro_item_venda" },
            { tabela: "itens_venda", trigger: "trigger_atualizar_lucro_venda", funcao: "atualizar_lucro_venda" },
            { tabela: "itens_venda", trigger: "trigger_atualizar_estoque", funcao: "atualizar_estoque_apos_venda" },
            { tabela: "vendas", trigger: "trigger_consolidar_lucro_diario", funcao: "consolidar_lucro_diario" }
          ]
        }
      };

      // Gerar e baixar arquivo JSON
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const dataFormatada = format(new Date(), "yyyy-MM-dd_HH-mm");
      const nomeArquivo = `backup_completo_${dataFormatada}.json`;
      
      const link = document.createElement("a");
      link.href = url;
      link.download = nomeArquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Calcular estatísticas
      const totalRegistros = backupData.estrutura.tabelasIncluidas.reduce(
        (acc: number, t: any) => acc + t.registros, 0
      );

      toast.success(
        `Backup realizado com sucesso! ${totalRegistros} registros exportados em ${backupData.metadata.tabelas.length} tabelas.`
      );
      handleClose();
    } catch (error) {
      console.error("Erro ao fazer backup:", error);
      toast.error("Erro ao gerar backup dos dados");
    } finally {
      setLoading(false);
    }
  };

  const nenhumaOpcaoSelecionada = !incluirProdutos && !incluirVendas && !incluirClientes && 
    !incluirFornecedores && !incluirCaixas && !incluirMovimentacoes && !incluirLucros && !incluirConfiguracoes;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup Completo do Sistema
          </DialogTitle>
          <DialogDescription>
            Selecione os dados que deseja incluir no backup. O arquivo será baixado em formato JSON com todos os dados, políticas RLS e funções do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="produtos"
                checked={incluirProdutos}
                onCheckedChange={(checked) => setIncluirProdutos(checked as boolean)}
              />
              <Label htmlFor="produtos" className="text-sm font-medium">
                Produtos
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="vendas"
                checked={incluirVendas}
                onCheckedChange={(checked) => setIncluirVendas(checked as boolean)}
              />
              <Label htmlFor="vendas" className="text-sm font-medium">
                Vendas e Itens
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="clientes"
                checked={incluirClientes}
                onCheckedChange={(checked) => setIncluirClientes(checked as boolean)}
              />
              <Label htmlFor="clientes" className="text-sm font-medium">
                Clientes
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="fornecedores"
                checked={incluirFornecedores}
                onCheckedChange={(checked) => setIncluirFornecedores(checked as boolean)}
              />
              <Label htmlFor="fornecedores" className="text-sm font-medium">
                Fornecedores
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="caixas"
                checked={incluirCaixas}
                onCheckedChange={(checked) => setIncluirCaixas(checked as boolean)}
              />
              <Label htmlFor="caixas" className="text-sm font-medium">
                Caixas
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="movimentacoes"
                checked={incluirMovimentacoes}
                onCheckedChange={(checked) => setIncluirMovimentacoes(checked as boolean)}
              />
              <Label htmlFor="movimentacoes" className="text-sm font-medium">
                Movimentações
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="lucros"
                checked={incluirLucros}
                onCheckedChange={(checked) => setIncluirLucros(checked as boolean)}
              />
              <Label htmlFor="lucros" className="text-sm font-medium">
                Lucros Diários
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="configuracoes"
                checked={incluirConfiguracoes}
                onCheckedChange={(checked) => setIncluirConfiguracoes(checked as boolean)}
              />
              <Label htmlFor="configuracoes" className="text-sm font-medium">
                Configurações
              </Label>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 mt-4">
            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
              <FileJson className="h-4 w-4" />
              O backup incluirá:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Todos os dados das tabelas selecionadas</li>
              <li>• Informações sobre políticas RLS</li>
              <li>• Documentação das funções do banco</li>
              <li>• Estrutura e campos das tabelas</li>
              <li>• Metadados do backup</li>
            </ul>
          </div>

          {nenhumaOpcaoSelecionada && (
            <p className="text-sm text-destructive">
              Selecione pelo menos uma opção para continuar.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleBackup}
            disabled={loading || nenhumaOpcaoSelecionada}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando Backup...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Baixar Backup
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
