import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Wallet, ShoppingCart, Trash2, Plus, Minus, Search, DoorOpen, DoorClosed, ArrowUpCircle, ArrowDownCircle, Receipt, Banknote, CreditCard, Smartphone, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProdutos } from "@/hooks/useProdutos";
import { useVendas } from "@/hooks/useVendas";
import { useCaixas } from "@/hooks/useCaixas";
import { useMovimentacoesCaixa } from "@/hooks/useMovimentacoesCaixa";
import { AbrirCaixaModal } from "@/components/Caixa/AbrirCaixaModal";
import { FecharCaixaModal } from "@/components/Caixa/FecharCaixaModal";
import { MovimentacaoCaixaModal } from "@/components/Caixa/MovimentacaoCaixaModal";

interface CartItem {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
}

interface Pagamento {
  forma_pagamento: string;
  valor: number;
}

export default function Caixa() {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalAbrirCaixa, setModalAbrirCaixa] = useState(false);
  const [modalFecharCaixa, setModalFecharCaixa] = useState(false);
  const [modalMovimentacao, setModalMovimentacao] = useState(false);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const { produtos, isLoading } = useProdutos();
  const { criarVenda } = useVendas();
  const { caixaAberto, abrirCaixa, fecharCaixa, isLoading: isLoadingCaixa } = useCaixas();
  const { movimentacoes, adicionarMovimentacao, totalEntradas, totalSaidas } = useMovimentacoesCaixa(caixaAberto?.id);

  const filteredProducts = produtos?.filter(p => 
    p.ativo && (
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo_barras?.includes(searchTerm) ||
      p.marca?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const addToCart = (product: typeof produtos[0]) => {
    if (product.estoque <= 0) {
      toast({
        title: "Estoque insuficiente",
        description: "Este produto está sem estoque",
        variant: "destructive",
      });
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantidade >= product.estoque) {
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${product.estoque} unidades disponíveis`,
          variant: "destructive",
        });
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      ));
    } else {
      setCart([...cart, { id: product.id, nome: product.nome, preco: product.preco, quantidade: 1 }]);
    }

    toast({
      title: "Produto adicionado",
      description: `${product.nome} adicionado ao carrinho`,
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    const produto = produtos?.find(p => p.id === productId);
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(1, item.quantidade + delta);
        if (produto && newQuantity > produto.estoque) {
          toast({
            title: "Estoque insuficiente",
            description: `Apenas ${produto.estoque} unidades disponíveis`,
            variant: "destructive",
          });
          return item;
        }
        return { ...item, quantidade: newQuantity };
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
  const totalPagamentos = pagamentos.reduce((sum, p) => sum + p.valor, 0);
  const valorRestante = total - totalPagamentos;
  const change = totalPagamentos > total ? totalPagamentos - total : 0;

  const addPagamento = () => {
    setPagamentos([...pagamentos, { forma_pagamento: "dinheiro", valor: 0 }]);
  };

  const removePagamento = (index: number) => {
    setPagamentos(pagamentos.filter((_, i) => i !== index));
  };

  const updatePagamento = (index: number, field: keyof Pagamento, value: string | number) => {
    setPagamentos(pagamentos.map((p, i) => 
      i === index ? { ...p, [field]: field === 'valor' ? Number(value) : value } : p
    ));
  };

  const finalizeSale = async () => {
    if (!caixaAberto) {
      toast({
        title: "Caixa fechado",
        description: "Abra o caixa antes de realizar vendas",
        variant: "destructive",
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar",
        variant: "destructive",
      });
      return;
    }

    if (totalPagamentos < total) {
      toast({
        title: "Valor insuficiente",
        description: `Faltam R$ ${valorRestante.toFixed(2)} para completar o pagamento`,
        variant: "destructive",
      });
      return;
    }

    const itens = cart.map(item => ({
      produto_id: item.id,
      quantidade: item.quantidade,
      preco_unitario: item.preco,
      subtotal: item.preco * item.quantidade
    }));

    // Forma principal de pagamento é a de maior valor
    const formaPrincipal = pagamentos.reduce((prev, curr) => 
      curr.valor > prev.valor ? curr : prev
    ).forma_pagamento;

    await criarVenda.mutateAsync({
      venda: {
        total,
        lucro_total: 0,
        desconto: 0,
        valor_recebido: totalPagamentos,
        troco: change,
        forma_pagamento: formaPrincipal,
        status: "concluida",
        caixa_id: caixaAberto.id
      },
      itens,
      pagamentos: pagamentos.filter(p => p.valor > 0)
    });

    setCart([]);
    setReceivedAmount("");
    setSearchTerm("");
    setPagamentos([]);
  };

  const handleAbrirCaixa = async (valorInicial: number, observacoes?: string) => {
    await abrirCaixa.mutateAsync({ valor_inicial: valorInicial, observacoes });
    setModalAbrirCaixa(false);
  };

  const handleFecharCaixa = async (observacoes?: string) => {
    if (caixaAberto) {
      await fecharCaixa.mutateAsync({ caixaId: caixaAberto.id, observacoes });
      setModalFecharCaixa(false);
      setCart([]);
      setReceivedAmount("");
    }
  };

  const clearCart = () => {
    setCart([]);
    setReceivedAmount("");
    setPagamentos([]);
  };

  const handleMovimentacao = async (tipo: 'entrada' | 'saida', valor: number, descricao: string) => {
    if (!caixaAberto) return;
    await adicionarMovimentacao.mutateAsync({
      caixa_id: caixaAberto.id,
      tipo,
      valor,
      descricao,
    });
    setModalMovimentacao(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Caixa</h1>
          <p className="text-muted-foreground">Sistema de vendas e pagamentos</p>
        </div>
        <div className="flex items-center gap-3">
          {isLoadingCaixa ? (
            <Badge variant="outline">Carregando...</Badge>
          ) : caixaAberto ? (
            <>
              <Badge className="bg-green-500 hover:bg-green-600">
                <DoorOpen className="h-3 w-3 mr-1" />
                Caixa Aberto
              </Badge>
              <Button onClick={() => setModalMovimentacao(true)} variant="outline">
                <Receipt className="h-4 w-4 mr-2" />
                Movimentação
              </Button>
              <Button onClick={() => setModalFecharCaixa(true)} variant="destructive">
                <DoorClosed className="h-4 w-4 mr-2" />
                Fechar Caixa
              </Button>
            </>
          ) : (
            <>
              <Badge variant="destructive">
                <DoorClosed className="h-3 w-3 mr-1" />
                Caixa Fechado
              </Badge>
              <Button onClick={() => setModalAbrirCaixa(true)}>
                <DoorOpen className="h-4 w-4 mr-2" />
                Abrir Caixa
              </Button>
            </>
          )}
        </div>
      </div>

      {caixaAberto && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-green-500 bg-green-500/10">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Inicial</p>
                  <p className="text-2xl font-bold">R$ {Number(caixaAberto.valor_inicial).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Aberto em</p>
                  <p className="font-semibold">
                    {new Date(caixaAberto.data_abertura).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Entradas</p>
                  <p className="text-lg font-bold text-green-500">+R$ {totalEntradas.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saídas</p>
                  <p className="text-lg font-bold text-red-500">-R$ {totalSaidas.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Mov.</p>
                  <p className={`text-lg font-bold ${totalEntradas - totalSaidas >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    R$ {(totalEntradas - totalSaidas).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Últimas Movimentações
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <ScrollArea className="h-[100px]">
                {movimentacoes && movimentacoes.length > 0 ? (
                  <div className="space-y-2">
                    {movimentacoes.slice(0, 5).map((mov) => (
                      <div key={mov.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {mov.tipo === 'entrada' ? (
                            <ArrowUpCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="truncate max-w-[150px]">{mov.descricao}</span>
                        </div>
                        <span className={mov.tipo === 'entrada' ? 'text-green-500' : 'text-red-500'}>
                          {mov.tipo === 'entrada' ? '+' : '-'}R$ {Number(mov.valor).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center">Nenhuma movimentação</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Produtos Disponíveis
            </CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, marca ou código..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Carregando produtos...</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts?.map(product => (
                    <Card
                      key={product.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">{product.nome}</h3>
                            {product.marca && (
                              <p className="text-xs text-muted-foreground">{product.marca}</p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Estoque: {product.estoque}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold text-primary">
                            R$ {product.preco.toFixed(2)}
                          </span>
                          <Button size="sm" variant="outline">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Carrinho
                </span>
                {cart.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearCart}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Carrinho vazio</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {cart.map(item => (
                        <Card key={item.id}>
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-sm flex-1">
                                {item.nome}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(item.id, -1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="font-semibold min-w-[2rem] text-center">
                                  {item.quantidade}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(item.id, 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className="font-bold text-primary">
                                R$ {(item.preco * item.quantidade).toFixed(2)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span className="text-primary">R$ {total.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {cart.length > 0 && (
            <Card className="border-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Formas de Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment Method Cards */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'dinheiro', label: 'Dinheiro', icon: Banknote, color: 'bg-green-500' },
                    { id: 'debito', label: 'Débito', icon: CreditCard, color: 'bg-blue-500' },
                    { id: 'credito', label: 'Crédito', icon: CreditCard, color: 'bg-purple-500' },
                    { id: 'pix', label: 'PIX', icon: Smartphone, color: 'bg-teal-500' },
                  ].map((method) => {
                    const pagamento = pagamentos.find(p => p.forma_pagamento === method.id);
                    const isActive = pagamento && pagamento.valor > 0;
                    const Icon = method.icon;
                    
                    return (
                      <div
                        key={method.id}
                        className={`relative rounded-lg border-2 p-3 cursor-pointer transition-all ${
                          isActive 
                            ? 'border-primary bg-primary/10 shadow-md' 
                            : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          if (!pagamento) {
                            setPagamentos([...pagamentos, { forma_pagamento: method.id, valor: valorRestante > 0 ? valorRestante : total }]);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-1.5 rounded-full ${method.color}`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-medium text-sm">{method.label}</span>
                        </div>
                        
                        {pagamento ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">R$</span>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={pagamento.valor || ""}
                              onChange={(e) => {
                                const index = pagamentos.findIndex(p => p.forma_pagamento === method.id);
                                if (index !== -1) {
                                  updatePagamento(index, 'valor', e.target.value);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 text-sm font-semibold"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                const index = pagamentos.findIndex(p => p.forma_pagamento === method.id);
                                if (index !== -1) {
                                  removePagamento(index);
                                }
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Clique para adicionar</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Separator />

                {/* Summary */}
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total da Venda:</span>
                    <span className="font-semibold">R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Recebido:</span>
                    <span className="font-semibold text-green-600">R$ {totalPagamentos.toFixed(2)}</span>
                  </div>
                  {valorRestante > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-red-500">Falta:</span>
                      <span className="font-bold text-red-500">R$ {valorRestante.toFixed(2)}</span>
                    </div>
                  )}
                  {change > 0 && (
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-primary font-medium">Troco:</span>
                      <span className="font-bold text-xl text-primary">R$ {change.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={finalizeSale}
                  disabled={cart.length === 0 || criarVenda.isPending || totalPagamentos < total}
                >
                  {criarVenda.isPending ? "Finalizando..." : "Finalizar Venda"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AbrirCaixaModal
        open={modalAbrirCaixa}
        onOpenChange={setModalAbrirCaixa}
        onConfirm={handleAbrirCaixa}
        isPending={abrirCaixa.isPending}
      />

      {caixaAberto && (
        <>
          <FecharCaixaModal
            open={modalFecharCaixa}
            onOpenChange={setModalFecharCaixa}
            onConfirm={handleFecharCaixa}
            isPending={fecharCaixa.isPending}
            caixaId={caixaAberto.id}
            valorInicial={Number(caixaAberto.valor_inicial)}
          />
          <MovimentacaoCaixaModal
            open={modalMovimentacao}
            onOpenChange={setModalMovimentacao}
            onConfirm={handleMovimentacao}
            isPending={adicionarMovimentacao.isPending}
          />
        </>
      )}
    </div>
  );
}
