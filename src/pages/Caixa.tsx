import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Wallet, ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock products - will be replaced with database data
const mockProducts = [
  { id: 1, name: "Coca-Cola 2L", price: 8.50, stock: 50 },
  { id: 2, name: "Guaraná Antarctica 2L", price: 7.80, stock: 35 },
  { id: 3, name: "Cerveja Skol Lata", price: 3.20, stock: 120 },
  { id: 4, name: "Água Mineral 500ml", price: 2.00, stock: 200 },
  { id: 5, name: "Suco Del Valle 1L", price: 6.50, stock: 40 },
  { id: 6, name: "Energético Red Bull", price: 12.00, stock: 60 },
];

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export default function Caixa() {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [receivedAmount, setReceivedAmount] = useState("");

  const addToCart = (product: typeof mockProducts[0]) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }

    toast({
      title: "Produto adicionado",
      description: `${product.name} adicionado ao carrinho`,
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const change = receivedAmount ? parseFloat(receivedAmount) - total : 0;

  const finalizeSale = () => {
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

    toast({
      title: "Venda finalizada!",
      description: `Total: R$ ${total.toFixed(2)} | Troco: R$ ${change.toFixed(2)}`,
    });

    // Reset
    setCart([]);
    setReceivedAmount("");
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
        {/* Products Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Produtos Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockProducts.map(product => (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => addToCart(product)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-sm">{product.name}</h3>
                        <span className="text-xs text-muted-foreground">
                          Estoque: {product.stock}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-primary">
                          R$ {product.price.toFixed(2)}
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
          </CardContent>
        </Card>

        {/* Cart and Payment Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Carrinho
                </span>
                {cart.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCart}
                  >
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
                                {item.name}
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
                                  {item.quantity}
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
                                R$ {(item.price * item.quantity).toFixed(2)}
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
                  disabled={cart.length === 0}
                >
                  Finalizar Venda
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
