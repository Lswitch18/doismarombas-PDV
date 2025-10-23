import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, ShoppingCart, Trash2, Plus, Minus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProdutos } from "@/hooks/useProdutos";
import { useVendas } from "@/hooks/useVendas";

interface CartItem {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
}

export default function Caixa() {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");
  const [searchTerm, setSearchTerm] = useState("");
  const { produtos, isLoading } = useProdutos();
  const { criarVenda } = useVendas();

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
  const change = receivedAmount ? parseFloat(receivedAmount) - total : 0;

  const finalizeSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar",
        variant: "destructive",
      });
      return;
    }

    if (!receivedAmount || parseFloat(receivedAmount) < total) {
      toast({
        title: "Valor insuficiente",
        description: "O valor recebido é menor que o total da compra",
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

    await criarVenda.mutateAsync({
      venda: {
        total,
        desconto: 0,
        valor_recebido: parseFloat(receivedAmount),
        troco: change,
        forma_pagamento: paymentMethod,
        status: "concluida"
      },
      itens
    });

    setCart([]);
    setReceivedAmount("");
    setSearchTerm("");
  };

  const clearCart = () => {
    setCart([]);
    setReceivedAmount("");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Caixa</h1>
          <p className="text-muted-foreground">Sistema de vendas e pagamentos</p>
        </div>
      </div>

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
              <CardHeader>
                <CardTitle className="text-lg">Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="debito">Cartão de Débito</SelectItem>
                      <SelectItem value="credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="received">Valor Recebido</Label>
                  <Input
                    id="received"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    className="text-lg"
                  />
                </div>

                {receivedAmount && parseFloat(receivedAmount) >= total && (
                  <div className="bg-primary/10 p-4 rounded-lg border border-primary">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Troco:</span>
                      <span className="text-2xl font-bold text-primary">
                        R$ {change.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={finalizeSale}
                  disabled={cart.length === 0 || criarVenda.isPending}
                >
                  {criarVenda.isPending ? "Finalizando..." : "Finalizar Venda"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
