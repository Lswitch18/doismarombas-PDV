import { Crown, Lock, Truck, MapPin, QrCode, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PremiumFeatureCard = () => {
  const handleContact = () => {
    window.open("https://wa.me/5511999999999?text=Olá! Gostaria de saber mais sobre o módulo Premium de Loja Online com Entrega e Rastreamento.", "_blank");
  };

  return (
    <Card className="animate-fade-up relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5" style={{ animationDelay: "0.4s" }}>
      {/* Efeito de brilho de fundo */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Ícone da Coroa Animado */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-glow" />
              <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-lg animate-crown-float">
                <Crown className="h-6 w-6 text-white drop-shadow-md" />
              </div>
            </div>
            
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                Módulo Premium
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
                  Em Breve
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                Loja Online com Entrega ao Vivo
              </CardDescription>
            </div>
          </div>
          
          {/* Ícone de Cadeado */}
          <div className="relative group">
            <div className="absolute inset-0 bg-muted-foreground/10 rounded-full blur-md group-hover:bg-primary/20 transition-colors duration-300" />
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-muted/80 border border-border group-hover:border-primary/50 transition-all duration-300">
              <Lock className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-300 animate-lock-shake" />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Estamos desenvolvendo um módulo completo para transformar seu sistema em uma 
          <span className="text-foreground font-medium"> loja online profissional</span> com 
          recursos avançados de entrega e pagamento.
        </p>
        
        {/* Lista de Recursos */}
        <div className="grid gap-3 sm:grid-cols-2">
          <FeatureItem 
            icon={<Truck className="h-4 w-4" />}
            title="Entrega ao Vivo"
            description="Acompanhe entregas em tempo real"
          />
          <FeatureItem 
            icon={<MapPin className="h-4 w-4" />}
            title="Rastreamento GPS"
            description="Localização exata do pedido"
          />
          <FeatureItem 
            icon={<QrCode className="h-4 w-4" />}
            title="Pagamento PIX"
            description="Receba instantaneamente via PIX"
          />
          <FeatureItem 
            icon={<Crown className="h-4 w-4" />}
            title="Painel do Cliente"
            description="Portal exclusivo para clientes"
          />
        </div>
        
        {/* Call to Action */}
        <div className="pt-2">
          <Button 
            onClick={handleContact}
            className="w-full gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
          >
            <MessageCircle className="h-4 w-4" />
            Entrar em Contato para Saber Mais
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Seja um dos primeiros a ter acesso exclusivo
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const FeatureItem = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50 hover:border-primary/30 hover:bg-muted transition-all duration-200">
    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default PremiumFeatureCard;
