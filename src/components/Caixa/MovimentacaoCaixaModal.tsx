import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

interface MovimentacaoCaixaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (tipo: 'entrada' | 'saida', valor: number, descricao: string) => void;
  isPending: boolean;
}

export function MovimentacaoCaixaModal({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: MovimentacaoCaixaModalProps) {
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada');
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valor || !descricao) return;
    
    onConfirm(tipo, parseFloat(valor), descricao);
    setValor("");
    setDescricao("");
    setTipo('entrada');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Movimentação de Caixa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={tipo === 'entrada' ? 'default' : 'outline'}
              className={tipo === 'entrada' ? 'bg-green-600 hover:bg-green-700' : ''}
              onClick={() => setTipo('entrada')}
            >
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Entrada
            </Button>
            <Button
              type="button"
              variant={tipo === 'saida' ? 'default' : 'outline'}
              className={tipo === 'saida' ? 'bg-red-600 hover:bg-red-700' : ''}
              onClick={() => setTipo('saida')}
            >
              <ArrowDownCircle className="h-4 w-4 mr-2" />
              Saída
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição / Motivo</Label>
            <Textarea
              id="descricao"
              placeholder={tipo === 'saida' ? "Ex: Pagamento de fornecedor, despesa..." : "Ex: Troco, reforço de caixa..."}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isPending || !valor || !descricao}
              className={tipo === 'entrada' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isPending ? "Registrando..." : `Registrar ${tipo === 'entrada' ? 'Entrada' : 'Saída'}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
