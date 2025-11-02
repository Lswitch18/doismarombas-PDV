import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AbrirCaixaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (valorInicial: number, observacoes?: string) => void;
  isPending: boolean;
}

export function AbrirCaixaModal({ open, onOpenChange, onConfirm, isPending }: AbrirCaixaModalProps) {
  const [valorInicial, setValorInicial] = useState("0");
  const [observacoes, setObservacoes] = useState("");

  const handleConfirm = () => {
    const valor = parseFloat(valorInicial) || 0;
    onConfirm(valor, observacoes || undefined);
    setValorInicial("0");
    setObservacoes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir Caixa</DialogTitle>
          <DialogDescription>
            Informe o valor inicial em dinheiro do caixa
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="valor-inicial">Valor Inicial (R$)</Label>
            <Input
              id="valor-inicial"
              type="number"
              step="0.01"
              min="0"
              value={valorInicial}
              onChange={(e) => setValorInicial(e.target.value)}
              placeholder="0.00"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Digite observações sobre a abertura do caixa..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Abrindo..." : "Abrir Caixa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
