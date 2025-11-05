import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ZerarContadorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (opcoes: {
    zerarLucros: boolean;
    zerarVendas: boolean;
    zerarVendasDia: boolean;
    zerarCaixas: boolean;
  }) => void;
  isPending?: boolean;
}

export function ZerarContadorModal({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: ZerarContadorModalProps) {
  const [zerarLucros, setZerarLucros] = useState(true);
  const [zerarVendas, setZerarVendas] = useState(false);
  const [zerarVendasDia, setZerarVendasDia] = useState(false);
  const [zerarCaixas, setZerarCaixas] = useState(false);

  const handleConfirm = () => {
    onConfirm({ zerarLucros, zerarVendas, zerarVendasDia, zerarCaixas });
    // Reset para valores padrão
    setZerarLucros(true);
    setZerarVendas(false);
    setZerarVendasDia(false);
    setZerarCaixas(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            ⚠️ Zerar Contador
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p className="font-semibold">
              Esta ação é IRREVERSÍVEL! Selecione o que deseja resetar:
            </p>
            
            <div className="space-y-3 py-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="lucros"
                  checked={zerarLucros}
                  onCheckedChange={(checked) => setZerarLucros(checked as boolean)}
                />
                <Label
                  htmlFor="lucros"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Zerar todos os lucros (vendas, itens e lucros diários)
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="vendas-dia"
                  checked={zerarVendasDia}
                  onCheckedChange={(checked) => setZerarVendasDia(checked as boolean)}
                />
                <Label
                  htmlFor="vendas-dia"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Excluir apenas as vendas do dia de hoje
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="vendas"
                  checked={zerarVendas}
                  onCheckedChange={(checked) => setZerarVendas(checked as boolean)}
                />
                <Label
                  htmlFor="vendas"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Excluir todas as vendas e seus itens
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="caixas"
                  checked={zerarCaixas}
                  onCheckedChange={(checked) => setZerarCaixas(checked as boolean)}
                />
                <Label
                  htmlFor="caixas"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Excluir todo o histórico de caixas
                </Label>
              </div>
            </div>

            {!zerarLucros && !zerarVendas && !zerarVendasDia && !zerarCaixas && (
              <p className="text-sm text-muted-foreground italic">
                Selecione pelo menos uma opção para continuar.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending || (!zerarLucros && !zerarVendas && !zerarVendasDia && !zerarCaixas)}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isPending ? "Processando..." : "Confirmar e Zerar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
