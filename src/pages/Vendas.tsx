import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Calendar, Filter, User, CreditCard, Eye } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVendas } from "@/hooks/useVendas";
import { useClientes } from "@/hooks/useClientes";
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Label } from "@/components/ui/label";

export default function Vendas() {
  const { vendas, isLoading } = useVendas();
  const { clientes } = useClientes();
  const [filtroData, setFiltroData] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroCliente, setFiltroCliente] = useState("todos");
  const [filtroPagamento, setFiltroPagamento] = useState("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [vendaSelecionada, setVendaSelecionada] = useState<any>(null);
  const [modalDetalhes, setModalDetalhes] = useState(false);

  const getDateRange = () => {
    const hoje = new Date();
    
    if (dataInicio && dataFim) {
      return {
        inicio: startOfDay(new Date(dataInicio)),
        fim: endOfDay(new Date(dataFim))
      };
    }
    
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
    const matchCliente = filtroCliente === "todos" || venda.cliente_id === filtroCliente;
    const matchPagamento = filtroPagamento === "todos" || venda.forma_pagamento === filtroPagamento;
    
    return matchData && matchStatus && matchCliente && matchPagamento;
  });

  const totalVendas = vendasFiltradas?.reduce((acc, venda) => acc + Number(venda.total), 0) || 0;
  const totalLucro = vendasFiltradas?.reduce((acc, venda) => acc + Number(venda.lucro_total || 0), 0) || 0;

  const abrirDetalhes = (venda: any) => {
    setVendaSelecionada(venda);
    setModalDetalhes(true);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendas</h1>
          <p className="text-muted-foreground">Registre e acompanhe suas vendas</p>
        </div>
      </div>

      {/* Filtros Avançados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Período Rápido</Label>
              <Select value={filtroData} onValueChange={(val) => {
                setFiltroData(val);
                if (val !== "personalizado") {
                  setDataInicio("");
                  setDataFim("");
                }
              }}>
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                  <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                  <SelectItem value="mes-atual">Mês atual</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={filtroCliente} onValueChange={setFiltroCliente}>
                <SelectTrigger>
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Clientes</SelectItem>
                  {clientes?.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={filtroPagamento} onValueChange={setFiltroPagamento}>
                <SelectTrigger>
                  <CreditCard className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="debito">Débito</SelectItem>
                  <SelectItem value="credito">Crédito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
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

          {filtroData === "personalizado" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="animate-fade-up">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Quantidade</p>
              <p className="text-3xl font-bold">{vendasFiltradas?.length || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">vendas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: "0.05s" }}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Vendido</p>
              <p className="text-3xl font-bold text-green-500">R$ {totalVendas.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">no período</p>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Lucro Total</p>
              <p className="text-3xl font-bold text-primary">R$ {totalLucro.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalVendas > 0 ? `${((totalLucro / totalVendas) * 100).toFixed(1)}% de margem` : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
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
                  <TableHead>Lucro</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
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
                    <TableCell className="font-semibold text-primary">
                      R$ {Number(venda.lucro_total || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {venda.forma_pagamento}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {venda.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => abrirDetalhes(venda)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes da Venda */}
      <Dialog open={modalDetalhes} onOpenChange={setModalDetalhes}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
          </DialogHeader>
          {vendaSelecionada && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data</Label>
                  <p className="text-sm">{format(new Date(vendaSelecionada.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                </div>
                <div>
                  <Label>Cliente</Label>
                  <p className="text-sm">{vendaSelecionada.clientes?.nome || "Cliente Avulso"}</p>
                </div>
                <div>
                  <Label>Total</Label>
                  <p className="text-lg font-bold text-green-500">R$ {Number(vendaSelecionada.total).toFixed(2)}</p>
                </div>
                <div>
                  <Label>Lucro</Label>
                  <p className="text-lg font-bold text-primary">R$ {Number(vendaSelecionada.lucro_total || 0).toFixed(2)}</p>
                </div>
                <div>
                  <Label>Forma de Pagamento</Label>
                  <p className="text-sm capitalize">{vendaSelecionada.forma_pagamento}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge>{vendaSelecionada.status}</Badge>
                </div>
                {vendaSelecionada.desconto > 0 && (
                  <div>
                    <Label>Desconto</Label>
                    <p className="text-sm">R$ {Number(vendaSelecionada.desconto).toFixed(2)}</p>
                  </div>
                )}
                {vendaSelecionada.observacoes && (
                  <div className="col-span-2">
                    <Label>Observações</Label>
                    <p className="text-sm">{vendaSelecionada.observacoes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}