import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface FecharCaixaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (observacoes?: string) => void;
  isPending: boolean;
  caixaId: string;
  valorInicial: number;
}

interface ResumoVendas {
  totalVendas: number;
  totalDinheiro: number;
  totalPix: number;
  totalCredito: number;
  totalDebito: number;
  lucroTotal: number;
  quantidadeVendas: number;
}

interface LancamentoManual {
  tipo: 'entrada' | 'saida';
  valor: number;
  descricao: string;
}

export function FecharCaixaModal({ 
  open, 
  onOpenChange, 
  onConfirm, 
  isPending,
  caixaId,
  valorInicial 
}: FecharCaixaModalProps) {
  const [observacoes, setObservacoes] = useState("");
  const [lancamentos, setLancamentos] = useState<LancamentoManual[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [resumo, setResumo] = useState<ResumoVendas>({
    totalVendas: 0,
    totalDinheiro: 0,
    totalPix: 0,
    totalCredito: 0,
    totalDebito: 0,
    lucroTotal: 0,
    quantidadeVendas: 0
  });

  useEffect(() => {
    if (open && caixaId) {
      carregarResumo();
      carregarMovimentacoes();
    }
  }, [open, caixaId]);

  const carregarMovimentacoes = async () => {
    const { data } = await supabase
      .from("movimentacoes_caixa")
      .select("*")
      .eq("caixa_id", caixaId)
      .order("created_at", { ascending: false });

    if (data) {
      setMovimentacoes(data);
    }
  };

  const carregarResumo = async () => {
    // Buscar vendas com pagamentos múltiplos
    const { data: vendas } = await supabase
      .from("vendas")
      .select("id, total, lucro_total, forma_pagamento")
      .eq("caixa_id", caixaId)
      .eq("status", "concluida");

    if (vendas) {
      // Buscar pagamentos detalhados
      const vendaIds = vendas.map(v => v.id);
      const { data: pagamentos } = await supabase
        .from("pagamentos_venda")
        .select("*")
        .in("venda_id", vendaIds);

      let totalDinheiro = 0;
      let totalPix = 0;
      let totalCredito = 0;
      let totalDebito = 0;

      // Se existem pagamentos detalhados, usar esses valores
      if (pagamentos && pagamentos.length > 0) {
        pagamentos.forEach(pag => {
          switch (pag.forma_pagamento?.toLowerCase()) {
            case 'dinheiro':
              totalDinheiro += Number(pag.valor);
              break;
            case 'pix':
              totalPix += Number(pag.valor);
              break;
            case 'credito':
            case 'crédito':
              totalCredito += Number(pag.valor);
              break;
            case 'debito':
            case 'débito':
              totalDebito += Number(pag.valor);
              break;
          }
        });
      } else {
        // Fallback para forma de pagamento única
        vendas.forEach(venda => {
          const total = Number(venda.total);
          switch (venda.forma_pagamento?.toLowerCase()) {
            case 'dinheiro':
              totalDinheiro += total;
              break;
            case 'pix':
              totalPix += total;
              break;
            case 'credito':
            case 'crédito':
              totalCredito += total;
              break;
            case 'debito':
            case 'débito':
              totalDebito += total;
              break;
          }
        });
      }

      const totalVendas = vendas.reduce((acc, v) => acc + Number(v.total), 0);
      const lucroTotal = vendas.reduce((acc, v) => acc + Number(v.lucro_total || 0), 0);

      setResumo({
        totalVendas,
        totalDinheiro,
        totalPix,
        totalCredito,
        totalDebito,
        lucroTotal,
        quantidadeVendas: vendas.length
      });
    }
  };

  const addLancamento = () => {
    setLancamentos([...lancamentos, { tipo: 'entrada', valor: 0, descricao: '' }]);
  };

  const removeLancamento = (index: number) => {
    setLancamentos(lancamentos.filter((_, i) => i !== index));
  };

  const updateLancamento = (index: number, field: keyof LancamentoManual, value: any) => {
    setLancamentos(lancamentos.map((l, i) => 
      i === index ? { ...l, [field]: field === 'valor' ? Number(value) : value } : l
    ));
  };

  const handleConfirm = async () => {
    // Salvar lançamentos manuais antes de fechar
    for (const lancamento of lancamentos) {
      if (lancamento.valor > 0 && lancamento.descricao) {
        await supabase.from("movimentacoes_caixa").insert({
          caixa_id: caixaId,
          tipo: lancamento.tipo,
          valor: lancamento.valor,
          descricao: lancamento.descricao
        });
      }
    }

    onConfirm(observacoes || undefined);
    setObservacoes("");
    setLancamentos([]);
  };

  const totalEntradasMov = movimentacoes
    .filter(m => m.tipo === 'entrada')
    .reduce((acc, m) => acc + Number(m.valor), 0);
  
  const totalSaidasMov = movimentacoes
    .filter(m => m.tipo === 'saida')
    .reduce((acc, m) => acc + Number(m.valor), 0);

  const totalEntradasLanc = lancamentos
    .filter(l => l.tipo === 'entrada')
    .reduce((acc, l) => acc + l.valor, 0);
  
  const totalSaidasLanc = lancamentos
    .filter(l => l.tipo === 'saida')
    .reduce((acc, l) => acc + l.valor, 0);

  const valorFinalCaixa = valorInicial + resumo.totalDinheiro + totalEntradasMov - totalSaidasMov + totalEntradasLanc - totalSaidasLanc;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fechar Caixa</DialogTitle>
          <DialogDescription>
            Resumo do dia e fechamento do caixa
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantidade de Vendas:</span>
                  <span className="font-semibold">{resumo.quantidadeVendas}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total em Vendas:</span>
                  <span className="font-semibold">R$ {resumo.totalVendas.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground pl-4">• Dinheiro:</span>
                  <span>R$ {resumo.totalDinheiro.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground pl-4">• PIX:</span>
                  <span>R$ {resumo.totalPix.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground pl-4">• Crédito:</span>
                  <span>R$ {resumo.totalCredito.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground pl-4">• Débito:</span>
                  <span>R$ {resumo.totalDebito.toFixed(2)}</span>
                </div>
                
                <Separator />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Movimentações (Entradas):</span>
                  <span className="text-green-500">+R$ {totalEntradasMov.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Movimentações (Saídas):</span>
                  <span className="text-red-500">-R$ {totalSaidasMov.toFixed(2)}</span>
                </div>

                {lancamentos.length > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Lançamentos Manuais (Entradas):</span>
                      <span className="text-green-500">+R$ {totalEntradasLanc.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Lançamentos Manuais (Saídas):</span>
                      <span className="text-red-500">-R$ {totalSaidasLanc.toFixed(2)}</span>
                    </div>
                  </>
                )}
                
                <Separator />
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor Inicial:</span>
                  <span className="font-semibold">R$ {valorInicial.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Valor Final em Caixa:</span>
                  <span className="font-bold text-primary">R$ {valorFinalCaixa.toFixed(2)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-green-600 dark:text-green-400">Lucro do Dia:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    R$ {resumo.lucroTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lançamentos Manuais */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-semibold">Lançamentos Manuais Faltantes</Label>
                <Button variant="outline" size="sm" onClick={addLancamento}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              {lancamentos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum lançamento manual. Clique em "Adicionar" para inserir lançamentos faltantes.
                </p>
              ) : (
                <div className="space-y-3">
                  {lancamentos.map((lancamento, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                      <Select 
                        value={lancamento.tipo} 
                        onValueChange={(v) => updateLancamento(index, 'tipo', v)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrada">
                            <div className="flex items-center gap-1">
                              <ArrowUpCircle className="h-3 w-3 text-green-500" />
                              Entrada
                            </div>
                          </SelectItem>
                          <SelectItem value="saida">
                            <div className="flex items-center gap-1">
                              <ArrowDownCircle className="h-3 w-3 text-red-500" />
                              Saída
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Valor"
                        value={lancamento.valor || ""}
                        onChange={(e) => updateLancamento(index, 'valor', e.target.value)}
                        className="w-28"
                      />
                      <Input
                        placeholder="Descrição"
                        value={lancamento.descricao}
                        onChange={(e) => updateLancamento(index, 'descricao', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLancamento(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="space-y-2">
            <Label htmlFor="observacoes-fechamento">Observações (opcional)</Label>
            <Textarea
              id="observacoes-fechamento"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Digite observações sobre o fechamento do caixa..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Fechando..." : "Fechar Caixa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}