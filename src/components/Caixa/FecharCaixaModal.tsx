import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

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

export function FecharCaixaModal({ 
  open, 
  onOpenChange, 
  onConfirm, 
  isPending,
  caixaId,
  valorInicial 
}: FecharCaixaModalProps) {
  const [observacoes, setObservacoes] = useState("");
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
    }
  }, [open, caixaId]);

  const carregarResumo = async () => {
    const { data: vendas } = await supabase
      .from("vendas")
      .select("total, lucro_total, forma_pagamento")
      .eq("caixa_id", caixaId)
      .eq("status", "concluida");

    if (vendas) {
      const resumoCalculado = vendas.reduce((acc, venda) => {
        const total = Number(venda.total);
        const lucro = Number(venda.lucro_total || 0);
        
        acc.totalVendas += total;
        acc.lucroTotal += lucro;
        acc.quantidadeVendas += 1;
        
        switch (venda.forma_pagamento?.toLowerCase()) {
          case 'dinheiro':
            acc.totalDinheiro += total;
            break;
          case 'pix':
            acc.totalPix += total;
            break;
          case 'credito':
          case 'crédito':
            acc.totalCredito += total;
            break;
          case 'debito':
          case 'débito':
            acc.totalDebito += total;
            break;
        }
        
        return acc;
      }, {
        totalVendas: 0,
        totalDinheiro: 0,
        totalPix: 0,
        totalCredito: 0,
        totalDebito: 0,
        lucroTotal: 0,
        quantidadeVendas: 0
      });

      setResumo(resumoCalculado);
    }
  };

  const handleConfirm = () => {
    onConfirm(observacoes || undefined);
    setObservacoes("");
  };

  const valorFinalCaixa = valorInicial + resumo.totalDinheiro;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
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
