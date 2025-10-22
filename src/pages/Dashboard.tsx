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

// Dados mockados para demonstração
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
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio</p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Saldo em Caixa"
          value="R$ 12.450,00"
          icon={Wallet}
          description="Valor disponível"
          trend={{ value: "12% vs. ontem", isPositive: true }}
        />
        <StatCard
          title="Vendas do Dia"
          value="R$ 4.320,00"
          icon={TrendingUp}
          description="38 transações"
          trend={{ value: "8% vs. ontem", isPositive: true }}
        />
        <StatCard
          title="Produtos em Estoque"
          value="1.247"
          icon={Package}
          description="12 produtos abaixo do mínimo"
        />
        <StatCard
          title="Lucro do Mês"
          value="R$ 32.450,00"
          icon={DollarSign}
          description="Margem de 23%"
          trend={{ value: "15% vs. mês anterior", isPositive: true }}
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
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
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="vendas"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
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
                    borderRadius: "8px",
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alertas de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { produto: "Coca-Cola 2L", estoque: 8, minimo: 20 },
                { produto: "Cerveja Brahma Lata", estoque: 12, minimo: 30 },
                { produto: "Suco Del Valle 1L", estoque: 5, minimo: 15 },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{item.produto}</p>
                    <p className="text-sm text-muted-foreground">
                      Estoque: {item.estoque} (mínimo: {item.minimo})
                    </p>
                  </div>
                  <div className="text-yellow-500 font-semibold">
                    {item.estoque} un
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas Movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { tipo: "Venda", valor: 45.5, hora: "14:32" },
                { tipo: "Venda", valor: 128.9, hora: "14:15" },
                { tipo: "Entrada", valor: 500.0, hora: "13:45" },
                { tipo: "Venda", valor: 67.3, hora: "13:22" },
              ].map((mov, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{mov.tipo}</p>
                    <p className="text-sm text-muted-foreground">{mov.hora}</p>
                  </div>
                  <div
                    className={`font-semibold ${
                      mov.tipo === "Venda" ? "text-green-500" : "text-blue-500"
                    }`}
                  >
                    {mov.tipo === "Venda" ? "+" : ""}R$ {mov.valor.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
