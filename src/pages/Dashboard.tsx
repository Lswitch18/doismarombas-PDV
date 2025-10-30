import { useState } from "react";
import { StatCard } from "@/components/Dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, Package, ShoppingCart, DollarSign, AlertTriangle } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useVendas } from "@/hooks/useVendas";
import { useProdutos } from "@/hooks/useProdutos";
import { useLucros } from "@/hooks/useLucros";
import { VendasDetalhesModal } from "@/components/Dashboard/VendasDetalhesModal";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { useNavigate } from "react-router-dom";

// Dados mockados para demonstração dos gráficos
const salesData = [
  { name: "Seg", vendas: 2400 },
  { name: "Ter", vendas: 1398 },
  { name: "Qua", vendas: 9800 },
  { name: "Qui", vendas: 3908 },
  { name: "Sex", vendas: 4800 },
  { name: "Sáb", vendas: 3800 },
  { name: "Dom", vendas: 4300 },
];

const topProducts = [
  { name: "Coca-Cola 2L", vendas: 120 },
  { name: "Água Mineral 500ml", vendas: 98 },
  { name: "Cerveja Skol Lata", vendas: 87 },
  { name: "Guaraná Antarctica 2L", vendas: 76 },
  { name: "Pepsi 2L", vendas: 65 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { vendas } = useVendas();
  const { produtos } = useProdutos();
  const { lucroDia, lucroMes, lucroAno } = useLucros();
  
  const [modalAberto, setModalAberto] = useState<string | null>(null);
  const [vendasModal, setVendasModal] = useState<any[]>([]);
  const [tituloModal, setTituloModal] = useState("");

  // Cálculos reais
  const totalVendas = vendas?.reduce((acc, v) => acc + Number(v.total), 0) || 0;
  
  const hoje = new Date();
  const vendasDia = vendas?.filter(v => {
    const dataVenda = new Date(v.created_at);
    return dataVenda >= startOfDay(hoje) && dataVenda <= endOfDay(hoje);
  }) || [];
  
  const vendasMes = vendas?.filter(v => {
    const dataVenda = new Date(v.created_at);
    return dataVenda >= startOfMonth(hoje) && dataVenda <= endOfMonth(hoje);
  }) || [];

  const vendasHojeSoma = vendasDia.reduce((acc, v) => acc + Number(v.total), 0);
  const totalProdutos = produtos?.length || 0;
  const produtosBaixoEstoque = produtos?.filter(p => p.estoque <= p.estoque_minimo).length || 0;

  const abrirModalVendas = (tipo: string) => {
    switch (tipo) {
      case "dia":
        setVendasModal(vendasDia);
        setTituloModal("Vendas do Dia");
        break;
      case "mes":
        setVendasModal(vendasMes);
        setTituloModal("Vendas do Mês");
        break;
      default:
        setVendasModal([]);
    }
    setModalAberto(tipo);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio</p>
        </div>
      </div>

      {/* Cards de Estatísticas - Clicáveis */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div onClick={() => abrirModalVendas("dia")} className="cursor-pointer">
          <StatCard
            title="Vendas do Dia"
            value={`R$ ${vendasHojeSoma.toFixed(2)}`}
            icon={TrendingUp}
            description={`${vendasDia.length} transações`}
            trend={{ value: `Lucro: R$ ${lucroDia.toFixed(2)}`, isPositive: true }}
            iconColor="text-blue-500"
            iconBgColor="bg-blue-500/10"
          />
        </div>
        
        <div onClick={() => abrirModalVendas("mes")} className="cursor-pointer">
          <StatCard
            title="Lucro do Mês"
            value={`R$ ${lucroMes.toFixed(2)}`}
            icon={DollarSign}
            description={`${vendasMes.length} vendas`}
            trend={{ value: `Total: R$ ${vendasMes.reduce((acc, v) => acc + Number(v.total), 0).toFixed(2)}`, isPositive: true }}
            iconColor="text-primary"
            iconBgColor="bg-primary/10"
          />
        </div>

        <div onClick={() => navigate("/estoque")} className="cursor-pointer">
          <StatCard
            title="Produtos em Estoque"
            value={totalProdutos.toString()}
            icon={Package}
            description={`${produtosBaixoEstoque} produtos abaixo do mínimo`}
            iconColor="text-purple-500"
            iconBgColor="bg-purple-500/10"
          />
        </div>

        <StatCard
          title="Lucro Acumulado (Ano)"
          value={`R$ ${lucroAno.toFixed(2)}`}
          icon={Wallet}
          description="Performance anual"
          trend={{ value: `${vendas?.length || 0} vendas totais`, isPositive: true }}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Vendas da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="vendas"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={150}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                  }}
                />
                <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alertas e Últimas Movimentações */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alertas de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {produtos?.filter(p => p.estoque <= p.estoque_minimo).slice(0, 5).map((produto) => (
                <div
                  key={produto.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <div>
                    <p className="font-medium">{produto.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      Estoque: {produto.estoque} (mínimo: {produto.estoque_minimo})
                    </p>
                  </div>
                  <div className="text-yellow-500 font-semibold text-lg">
                    {produto.estoque} un
                  </div>
                </div>
              ))}
              {(!produtos || produtos.filter(p => p.estoque <= p.estoque_minimo).length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum alerta de estoque</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: "0.4s" }}>
          <CardHeader>
            <CardTitle>Últimas Movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vendas?.slice(0, 5).map((venda) => (
                <div
                  key={venda.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <div>
                    <p className="font-medium">Venda - {venda.clientes?.nome || "Cliente Avulso"}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(venda.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-green-500 font-semibold text-lg">
                      +R$ {Number(venda.total).toFixed(2)}
                    </div>
                    <div className="text-xs text-primary">
                      Lucro: R$ {Number(venda.lucro_total || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
              {(!vendas || vendas.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma movimentação registrada</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Vendas Detalhadas */}
      <VendasDetalhesModal
        open={modalAberto !== null}
        onOpenChange={(open) => !open && setModalAberto(null)}
        vendas={vendasModal}
        titulo={tituloModal}
      />
    </div>
  );
}