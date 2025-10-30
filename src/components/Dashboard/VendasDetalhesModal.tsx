import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VendasDetalhesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendas: any[];
  titulo: string;
}

export function VendasDetalhesModal({ 
  open, 
  onOpenChange, 
  vendas,
  titulo 
}: VendasDetalhesModalProps) {
  const totalVendas = vendas?.reduce((acc, v) => acc + Number(v.total), 0) || 0;
  const totalLucro = vendas?.reduce((acc, v) => acc + Number(v.lucro_total || 0), 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Quantidade</p>
            <p className="text-2xl font-bold">{vendas?.length || 0}</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Vendido</p>
            <p className="text-2xl font-bold text-green-500">R$ {totalVendas.toFixed(2)}</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Lucro Total</p>
            <p className="text-2xl font-bold text-primary">R$ {totalLucro.toFixed(2)}</p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Lucro</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendas?.map((venda) => (
              <TableRow key={venda.id}>
                <TableCell>
                  {format(new Date(venda.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell>{venda.clientes?.nome || "Avulso"}</TableCell>
                <TableCell className="font-semibold">R$ {Number(venda.total).toFixed(2)}</TableCell>
                <TableCell className="font-semibold text-primary">
                  R$ {Number(venda.lucro_total || 0).toFixed(2)}
                </TableCell>
                <TableCell className="capitalize">{venda.forma_pagamento}</TableCell>
                <TableCell>
                  <Badge variant="default">{venda.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}