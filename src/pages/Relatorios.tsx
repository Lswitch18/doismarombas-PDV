import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileBarChart, Download, Calendar, TrendingUp, Package, Users, Filter, Clock, CreditCard } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface ItemVendaRelatorio {
  id: string;
  venda_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  lucro_total: number;
  produto_nome: string;
  produto_categoria: string | null;
}

export default function Relatorios() {
  const [tipoFiltroData, setTipoFiltroData] = useState("mes-atual");
  const [dataInicio, setDataInicio] = useState<Date | undefined>(startOfMonth(new Date()));
  const [dataFim, setDataFim] = useState<Date | undefined>(endOfMonth(new Date()));
  const [produtoFiltro, setProdutoFiltro] = useState<string>("todos");
  
  const { vendas } = useVendas();
  const { produtos } = useProdutos();
  const { clientes } = useClientes();

  // Buscar itens de venda com detalhes dos produtos
  const { data: itensVenda } = useQuery({
    queryKey: ["itens-venda-relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("itens_venda")
        .select(`
          id,
          venda_id,
          produto_id,
          quantidade,
          preco_unitario,
          subtotal,
          lucro_total,
          produtos(nome, categoria)
        `);
      
      if (error) throw error;
      return data?.map(item => ({
        ...item,
        produto_nome: (item.produtos as any)?.nome || "Produto não encontrado",
        produto_categoria: (item.produtos as any)?.categoria || null,
      })) as ItemVendaRelatorio[];
    },
  });

  // Buscar pagamentos
  const { data: pagamentos } = useQuery({
    queryKey: ["pagamentos-relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagamentos_venda")
        .select("*");
      
      if (error) throw error;
      return data;
    },
  });

  // Atualizar datas baseado no tipo de filtro
  const handleTipoFiltroChange = (tipo: string) => {
    setTipoFiltroData(tipo);
    const hoje = new Date();
    
    switch (tipo) {
      case "mes-atual":
        setDataInicio(startOfMonth(hoje));
        setDataFim(endOfMonth(hoje));
        break;
      case "mes-anterior":
        const mesAnterior = subMonths(hoje, 1);
        setDataInicio(startOfMonth(mesAnterior));
        setDataFim(endOfMonth(mesAnterior));
        break;
      case "ultimos-3-meses":
        setDataInicio(subMonths(hoje, 3));
        setDataFim(hoje);
        break;
      case "personalizado":
        // Mantém as datas atuais
        break;
    }
  };

  // Filtrar vendas por período e produto
  const vendasFiltradas = useMemo(() => {
    if (!vendas || !dataInicio || !dataFim) return [];
    
    return vendas.filter((venda) => {
      const dataVenda = new Date(venda.created_at);
      const dentroDoIntervalo = dataVenda >= startOfDay(dataInicio) && dataVenda <= endOfDay(dataFim);
      
      if (!dentroDoIntervalo) return false;
      
      // Se há filtro de produto, verificar se a venda contém o produto
      if (produtoFiltro !== "todos" && itensVenda) {
        const itensDestaVenda = itensVenda.filter(item => item.venda_id === venda.id);
        return itensDestaVenda.some(item => item.produto_id === produtoFiltro);
      }
      
      return true;
    });
  }, [vendas, dataInicio, dataFim, produtoFiltro, itensVenda]);

  // Calcular totais
  const totalVendas = vendasFiltradas.reduce((acc, venda) => acc + Number(venda.total), 0);
  const totalLucro = vendasFiltradas.reduce((acc, venda) => acc + Number(venda.lucro_total || 0), 0);
  const quantidadeVendas = vendasFiltradas.length;
  const ticketMedio = quantidadeVendas > 0 ? totalVendas / quantidadeVendas : 0;

  // Calcular total de produtos vendidos no filtro
  const totalProdutosVendidos = useMemo(() => {
    if (!itensVenda) return 0;
    
    const vendasIds = vendasFiltradas.map(v => v.id);
    const itensFiltrados = itensVenda.filter(item => {
      if (!vendasIds.includes(item.venda_id)) return false;
      if (produtoFiltro !== "todos" && item.produto_id !== produtoFiltro) return false;
      return true;
    });
    
    return itensFiltrados.reduce((acc, item) => acc + item.quantidade, 0);
  }, [itensVenda, vendasFiltradas, produtoFiltro]);

  // Resumo por forma de pagamento
  const resumoPagamento = useMemo(() => {
    const resumo: Record<string, { quantidade: number; total: number }> = {};
    
    vendasFiltradas.forEach(venda => {
      const forma = venda.forma_pagamento;
      if (!resumo[forma]) {
        resumo[forma] = { quantidade: 0, total: 0 };
      }
      resumo[forma].quantidade += 1;
      resumo[forma].total += Number(venda.total);
    });
    
    return resumo;
  }, [vendasFiltradas]);

  const produtosBaixoEstoque = produtos?.filter(
    (p) => p.estoque <= p.estoque_minimo
  ).length || 0;

  const exportarCSV = () => {
    if (!vendasFiltradas.length) {
      toast.error("Não há dados para exportar");
      return;
    }

    // CSV detalhado com todos os campos
    const headers = [
      "Data",
      "Hora",
      "ID Venda",
      "Cliente",
      "Produtos",
      "Qtd Itens",
      "Subtotal",
      "Desconto",
      "Acréscimo",
      "Total",
      "Lucro",
      "Forma Pagamento",
      "Status"
    ];

    const rows = vendasFiltradas.map((venda) => {
      const itensDestaVenda = itensVenda?.filter(item => item.venda_id === venda.id) || [];
      const produtosStr = itensDestaVenda.map(item => 
        `${item.produto_nome} (${item.quantidade}x)`
      ).join(" | ");
      const qtdItens = itensDestaVenda.reduce((acc, item) => acc + item.quantidade, 0);
      
      return [
        format(new Date(venda.created_at), "dd/MM/yyyy", { locale: ptBR }),
        format(new Date(venda.created_at), "HH:mm:ss", { locale: ptBR }),
        venda.id.substring(0, 8),
        (venda as any).clientes?.nome || "Cliente Avulso",
        `"${produtosStr}"`,
        qtdItens.toString(),
        `R$ ${(Number(venda.total) - Number(venda.desconto || 0) + Number(venda.acrescimo || 0)).toFixed(2)}`,
        `R$ ${Number(venda.desconto || 0).toFixed(2)}`,
        `R$ ${Number(venda.acrescimo || 0).toFixed(2)}`,
        `R$ ${Number(venda.total).toFixed(2)}`,
        `R$ ${Number(venda.lucro_total || 0).toFixed(2)}`,
        venda.forma_pagamento,
        venda.status,
      ];
    });

    // Adicionar resumo ao final
    const resumoRows = [
      [],
      ["=== RESUMO DO PERÍODO ==="],
      [`Período: ${format(dataInicio!, "dd/MM/yyyy")} a ${format(dataFim!, "dd/MM/yyyy")}`],
      [`Total de Vendas: ${quantidadeVendas}`],
      [`Total de Produtos Vendidos: ${totalProdutosVendidos}`],
      [`Faturamento Total: R$ ${totalVendas.toFixed(2)}`],
      [`Lucro Total: R$ ${totalLucro.toFixed(2)}`],
      [`Ticket Médio: R$ ${ticketMedio.toFixed(2)}`],
      [],
      ["=== RESUMO POR FORMA DE PAGAMENTO ==="],
      ...Object.entries(resumoPagamento).map(([forma, dados]) => 
        [`${forma}: ${dados.quantidade} vendas - R$ ${dados.total.toFixed(2)}`]
      ),
    ];

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
      ...resumoRows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-vendas-${format(dataInicio!, "dd-MM-yyyy")}_${format(dataFim!, "dd-MM-yyyy")}.csv`;
    link.click();

    toast.success("Relatório CSV exportado com sucesso!");
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
    doc.text("Relatório Detalhado de Vendas", 14, 30);
    
    doc.setFontSize(10);
    doc.text(
      `Período: ${format(dataInicio!, "dd/MM/yyyy", { locale: ptBR })} - ${format(dataFim!, "dd/MM/yyyy", { locale: ptBR })}`,
      14,
      38
    );

    if (produtoFiltro !== "todos") {
      const produtoSelecionado = produtos?.find(p => p.id === produtoFiltro);
      doc.text(`Filtro de Produto: ${produtoSelecionado?.nome || "N/A"}`, 14, 44);
    }

    // Resumo Geral
    let yPos = produtoFiltro !== "todos" ? 54 : 48;
    doc.setFontSize(11);
    doc.setTextColor(60);
    doc.text(`Total de Vendas: ${quantidadeVendas} transações`, 14, yPos);
    doc.text(`Total de Produtos Vendidos: ${totalProdutosVendidos} unidades`, 14, yPos + 7);
    doc.text(`Faturamento Total: R$ ${totalVendas.toFixed(2)}`, 14, yPos + 14);
    doc.text(`Lucro Total: R$ ${totalLucro.toFixed(2)}`, 110, yPos + 14);
    doc.text(`Ticket Médio: R$ ${ticketMedio.toFixed(2)}`, 14, yPos + 21);

    // Resumo por forma de pagamento
    yPos += 32;
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text("Resumo por Forma de Pagamento", 14, yPos);
    
    const pagamentoData = Object.entries(resumoPagamento).map(([forma, dados]) => [
      forma.charAt(0).toUpperCase() + forma.slice(1),
      dados.quantidade.toString(),
      `R$ ${dados.total.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: yPos + 4,
      head: [["Forma", "Qtd", "Total"]],
      body: pagamentoData,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 9,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 8 },
      tableWidth: 80,
    });

    // Tabela de vendas detalhada
    yPos = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text("Detalhamento das Vendas", 14, yPos);

    const tableData = vendasFiltradas.map((venda) => {
      const itensDestaVenda = itensVenda?.filter(item => item.venda_id === venda.id) || [];
      const produtosStr = itensDestaVenda.map(item => 
        `${item.produto_nome} (${item.quantidade}x)`
      ).join(", ");
      const qtdItens = itensDestaVenda.reduce((acc, item) => acc + item.quantidade, 0);
      
      return [
        format(new Date(venda.created_at), "dd/MM/yyyy", { locale: ptBR }),
        format(new Date(venda.created_at), "HH:mm", { locale: ptBR }),
        (venda as any).clientes?.nome || "Avulso",
        produtosStr.length > 40 ? produtosStr.substring(0, 40) + "..." : produtosStr,
        qtdItens.toString(),
        `R$ ${Number(venda.total).toFixed(2)}`,
        `R$ ${Number(venda.lucro_total || 0).toFixed(2)}`,
        venda.forma_pagamento,
      ];
    });

    autoTable(doc, {
      startY: yPos + 4,
      head: [["Data", "Hora", "Cliente", "Produtos", "Qtd", "Total", "Lucro", "Pagamento"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 8,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 15 },
        2: { cellWidth: 25 },
        3: { cellWidth: 50 },
        4: { cellWidth: 12 },
        5: { cellWidth: 22 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 },
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
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

    doc.save(`relatorio-vendas-${format(dataInicio!, "dd-MM-yyyy")}_${format(dataFim!, "dd-MM-yyyy")}.pdf`);
    toast.success("Relatório PDF gerado com sucesso!");
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">Análises e exportações de dados detalhadas</p>
        </div>
      </div>

      {/* Filtros Avançados */}
      <Card className="animate-fade-up">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Tipo de Período */}
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={tipoFiltroData} onValueChange={handleTipoFiltroChange}>
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes-atual">Mês Atual</SelectItem>
                  <SelectItem value="mes-anterior">Mês Anterior</SelectItem>
                  <SelectItem value="ultimos-3-meses">Últimos 3 Meses</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data Início */}
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataInicio && "text-muted-foreground"
                    )}
                    onClick={() => setTipoFiltroData("personalizado")}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dataInicio}
                    onSelect={(date) => {
                      setDataInicio(date);
                      setTipoFiltroData("personalizado");
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataFim && "text-muted-foreground"
                    )}
                    onClick={() => setTipoFiltroData("personalizado")}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dataFim}
                    onSelect={(date) => {
                      setDataFim(date);
                      setTipoFiltroData("personalizado");
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Filtro por Produto */}
            <div className="space-y-2">
              <Label>Filtrar por Produto</Label>
              <Select value={produtoFiltro} onValueChange={setProdutoFiltro}>
                <SelectTrigger>
                  <Package className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Todos os produtos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os produtos</SelectItem>
                  {produtos?.map((produto) => (
                    <SelectItem key={produto.id} value={produto.id}>
                      {produto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="animate-fade-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Faturado</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalVendas.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {quantidadeVendas} transações
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: "0.05s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">R$ {totalLucro.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Margem: {totalVendas > 0 ? ((totalLucro / totalVendas) * 100).toFixed(1) : 0}%
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
            <div className="text-2xl font-bold">R$ {ticketMedio.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Por transação</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Vendidos</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProdutosVendidos}</div>
            <p className="text-xs text-muted-foreground mt-1">Unidades no período</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Cadastrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo por Forma de Pagamento */}
      <Card className="animate-fade-up" style={{ animationDelay: "0.25s" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Resumo por Forma de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(resumoPagamento).map(([forma, dados]) => (
              <div key={forma} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium capitalize">{forma}</p>
                  <p className="text-sm text-muted-foreground">{dados.quantidade} vendas</p>
                </div>
                <div className="text-lg font-bold">R$ {dados.total.toFixed(2)}</div>
              </div>
            ))}
            {Object.keys(resumoPagamento).length === 0 && (
              <p className="text-muted-foreground col-span-4 text-center py-4">
                Nenhuma venda no período selecionado
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exportação de Relatórios */}
      <Card className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 p-4 border rounded-lg">
              <h3 className="font-semibold">Relatório CSV (Excel)</h3>
              <p className="text-sm text-muted-foreground">
                Exportar com todos os detalhes: data, hora, produtos, quantidades, formas de pagamento e resumos.
              </p>
              <Button onClick={exportarCSV} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV Completo
              </Button>
            </div>
            <div className="space-y-2 p-4 border rounded-lg">
              <h3 className="font-semibold">Relatório PDF</h3>
              <p className="text-sm text-muted-foreground">
                Gerar relatório formatado com resumos, gráficos de pagamento e tabela detalhada.
              </p>
              <Button onClick={exportarPDF} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF Detalhado
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análises Detalhadas */}
      <Card className="animate-fade-up" style={{ animationDelay: "0.35s" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Resumo do Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Período Analisado</p>
                <p className="text-sm text-muted-foreground">
                  {dataInicio && dataFim ? (
                    <>
                      {format(dataInicio, "dd/MM/yyyy", { locale: ptBR })} até{" "}
                      {format(dataFim, "dd/MM/yyyy", { locale: ptBR })}
                    </>
                  ) : "Selecione um período"}
                </p>
              </div>
              {produtoFiltro !== "todos" && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Filtro ativo:</p>
                  <p className="font-medium">{produtos?.find(p => p.id === produtoFiltro)?.nome}</p>
                </div>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Total de Transações</p>
                  <p className="text-sm text-muted-foreground">Vendas realizadas</p>
                </div>
                <div className="text-2xl font-bold">{quantidadeVendas}</div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Faturamento Total</p>
                  <p className="text-sm text-muted-foreground">Soma das vendas</p>
                </div>
                <div className="text-2xl font-bold text-green-500">
                  R$ {totalVendas.toFixed(2)}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Lucro Líquido</p>
                  <p className="text-sm text-muted-foreground">Margem de lucro</p>
                </div>
                <div className="text-2xl font-bold text-emerald-500">
                  R$ {totalLucro.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
