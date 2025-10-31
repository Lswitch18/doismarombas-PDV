import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileBarChart, Download, Calendar, TrendingUp, Package, Users } from "lucide-react";
import { useVendas } from "@/hooks/useVendas";
import { useProdutos } from "@/hooks/useProdutos";
import { useClientes } from "@/hooks/useClientes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Relatorios() {
  const [periodo, setPeriodo] = useState("mes-atual");
  const { vendas } = useVendas();
  const { produtos } = useProdutos();
  const { clientes } = useClientes();

  const getDateRange = () => {
    const hoje = new Date();
    switch (periodo) {
      case "mes-atual":
        return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
      case "mes-anterior":
        const mesAnterior = subMonths(hoje, 1);
        return { inicio: startOfMonth(mesAnterior), fim: endOfMonth(mesAnterior) };
      case "ultimos-3-meses":
        return { inicio: subMonths(hoje, 3), fim: hoje };
      default:
        return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
    }
  };

  const { inicio, fim } = getDateRange();

  const vendasFiltradas = vendas?.filter((venda) => {
    const dataVenda = new Date(venda.created_at);
    return dataVenda >= inicio && dataVenda <= fim;
  }) || [];

  const totalVendas = vendasFiltradas.reduce((acc, venda) => acc + Number(venda.total), 0);
  const quantidadeVendas = vendasFiltradas.length;
  const ticketMedio = quantidadeVendas > 0 ? totalVendas / quantidadeVendas : 0;

  const produtosBaixoEstoque = produtos?.filter(
    (p) => p.estoque <= p.estoque_minimo
  ).length || 0;

  const exportarCSV = () => {
    if (!vendasFiltradas.length) {
      toast.error("Não há dados para exportar");
      return;
    }

    const headers = ["Data", "Cliente", "Total", "Forma de Pagamento", "Status"];
    const rows = vendasFiltradas.map((venda) => [
      format(new Date(venda.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      venda.clientes?.nome || "Cliente Avulso",
      `R$ ${Number(venda.total).toFixed(2)}`,
      venda.forma_pagamento,
      venda.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-vendas-${format(new Date(), "dd-MM-yyyy")}.csv`;
    link.click();

    toast.success("Relatório exportado com sucesso!");
  };

  const exportarPDF = () => {
    if (!vendasFiltradas.length) {
      toast.error("Não há dados para exportar");
      return;
    }

    const doc = new jsPDF();
    
    // Cabeçalho
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text("Dois Marombas", 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Relatório de Vendas", 14, 30);
    
    doc.setFontSize(10);
    doc.text(
      `Período: ${format(inicio, "dd/MM/yyyy", { locale: ptBR })} - ${format(fim, "dd/MM/yyyy", { locale: ptBR })}`,
      14,
      38
    );

    // Resumo
    doc.setFontSize(11);
    doc.setTextColor(60);
    doc.text(`Total de Vendas: R$ ${totalVendas.toFixed(2)}`, 14, 48);
    doc.text(`Quantidade de Transações: ${quantidadeVendas}`, 14, 55);
    doc.text(`Ticket Médio: R$ ${ticketMedio.toFixed(2)}`, 14, 62);

    // Tabela de vendas
    const tableData = vendasFiltradas.map((venda) => [
      format(new Date(venda.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      venda.clientes?.nome || "Cliente Avulso",
      `R$ ${Number(venda.total).toFixed(2)}`,
      `R$ ${Number(venda.lucro_total || 0).toFixed(2)}`,
      venda.forma_pagamento,
      venda.status,
    ]);

    autoTable(doc, {
      startY: 70,
      head: [["Data", "Cliente", "Total", "Lucro", "Pagamento", "Status"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 10,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
      doc.text(
        `Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }

    doc.save(`relatorio-vendas-${format(new Date(), "dd-MM-yyyy")}.pdf`);
    toast.success("Relatório PDF gerado com sucesso!");
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">Análises e exportações de dados</p>
        </div>
        <div className="flex gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[200px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes-atual">Mês Atual</SelectItem>
              <SelectItem value="mes-anterior">Mês Anterior</SelectItem>
              <SelectItem value="ultimos-3-meses">Últimos 3 Meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-fade-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ {totalVendas.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {quantidadeVendas} transações
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileBarChart className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ {ticketMedio.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-2">Por transação</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Cadastrados</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{produtos?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {produtosBaixoEstoque} abaixo do mínimo
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{clientes?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">Cadastrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Exportação de Relatórios */}
      <Card className="animate-fade-up" style={{ animationDelay: "0.4s" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-semibold">Relatório de Vendas (CSV)</h3>
              <p className="text-sm text-muted-foreground">
                Exportar todas as vendas do período selecionado em formato CSV
              </p>
              <Button onClick={exportarCSV} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Relatório de Vendas (PDF)</h3>
              <p className="text-sm text-muted-foreground">
                Gerar relatório detalhado em PDF com gráficos e análises
              </p>
              <Button onClick={exportarPDF} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análises Detalhadas */}
      <Card className="animate-fade-up" style={{ animationDelay: "0.5s" }}>
        <CardHeader>
          <CardTitle>Análises do Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Período Analisado</p>
                <p className="text-sm text-muted-foreground">
                  {format(inicio, "dd/MM/yyyy", { locale: ptBR })} até{" "}
                  {format(fim, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Total de Transações</p>
                <p className="text-sm text-muted-foreground">
                  {quantidadeVendas} vendas realizadas
                </p>
              </div>
              <div className="text-2xl font-bold">{quantidadeVendas}</div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Faturamento Total</p>
                <p className="text-sm text-muted-foreground">
                  Soma de todas as vendas do período
                </p>
              </div>
              <div className="text-2xl font-bold text-green-500">
                R$ {totalVendas.toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
