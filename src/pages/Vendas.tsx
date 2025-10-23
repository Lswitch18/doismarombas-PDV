import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useVendas } from "@/hooks/useVendas";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Vendas() {
  const { vendas, isLoading } = useVendas();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos e Vendas</h1>
          <p className="text-muted-foreground">Registre e acompanhe suas vendas</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Histórico de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Carregando vendas...</p>
            </div>
          ) : vendas?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma venda registrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Forma de Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendas?.map((venda) => (
                  <TableRow key={venda.id}>
                    <TableCell>
                      {format(new Date(venda.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {venda.clientes?.nome || "Cliente Avulso"}
                    </TableCell>
                    <TableCell className="font-bold">
                      R$ {Number(venda.total).toFixed(2)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {venda.forma_pagamento}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {venda.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
