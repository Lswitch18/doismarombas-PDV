import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Calendar, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVendas } from "@/hooks/useVendas";
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Vendas() {
  const { vendas, isLoading } = useVendas();
  const [filtroData, setFiltroData] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const getDateRange = () => {
    const hoje = new Date();
    switch (filtroData) {
      case "hoje":
        return { inicio: startOfDay(hoje), fim: endOfDay(hoje) };
      case "7dias":
        return { inicio: subDays(hoje, 7), fim: hoje };
      case "30dias":
        return { inicio: subDays(hoje, 30), fim: hoje };
      case "mes-atual":
        return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
      default:
        return null;
    }
  };

  const vendasFiltradas = vendas?.filter((venda) => {
    const dateRange = getDateRange();
    const dataVenda = new Date(venda.created_at);
    
    const matchData = !dateRange || (dataVenda >= dateRange.inicio && dataVenda <= dateRange.fim);
    const matchStatus = filtroStatus === "todos" || venda.status === filtroStatus;
    
    return matchData && matchStatus;
  });

  const totalVendas = vendasFiltradas?.reduce((acc, venda) => acc + Number(venda.total), 0) || 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos e Vendas</h1>
          <p className="text-muted-foreground">Registre e acompanhe suas vendas</p>
        </div>
        <div className="flex gap-2">
          <Select value={filtroData} onValueChange={setFiltroData}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="7dias">Últimos 7 dias</SelectItem>
              <SelectItem value="30dias">Últimos 30 dias</SelectItem>
              <SelectItem value="mes-atual">Mês atual</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Card de Resumo */}
      <Card className="animate-fade-up">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total no Período</p>
              <p className="text-3xl font-bold">R$ {totalVendas.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quantidade</p>
              <p className="text-2xl font-bold">{vendasFiltradas?.length || 0} vendas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
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
          ) : vendasFiltradas?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma venda encontrada com os filtros selecionados</p>
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
                {vendasFiltradas?.map((venda) => (
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
