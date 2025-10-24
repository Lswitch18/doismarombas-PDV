import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Store, Bell, Database, Shield, Palette } from "lucide-react";
import { toast } from "sonner";

export default function Configuracoes() {
  const [nomeEmpresa, setNomeEmpresa] = useState("Distribuidora Flow");
  const [email, setEmail] = useState("contato@flowdash.com");
  const [telefone, setTelefone] = useState("(11) 98765-4321");
  const [notificacoesEmail, setNotificacoesEmail] = useState(true);
  const [notificacoesEstoque, setNotificacoesEstoque] = useState(true);
  const [modoEscuro, setModoEscuro] = useState(true);

  const salvarConfiguracoes = () => {
    toast.success("Configurações salvas com sucesso!");
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Personalize seu sistema</p>
        </div>
      </div>

      {/* Dados da Empresa */}
      <Card className="animate-fade-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Dados da Empresa
          </CardTitle>
          <CardDescription>
            Informações básicas sobre sua distribuidora
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome-empresa">Nome da Empresa</Label>
            <Input
              id="nome-empresa"
              value={nomeEmpresa}
              onChange={(e) => setNomeEmpresa(e.target.value)}
              placeholder="Nome da sua distribuidora"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>
            Configure como deseja receber alertas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações por E-mail</Label>
              <p className="text-sm text-muted-foreground">
                Receber relatórios e alertas por e-mail
              </p>
            </div>
            <Switch
              checked={notificacoesEmail}
              onCheckedChange={setNotificacoesEmail}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas de Estoque</Label>
              <p className="text-sm text-muted-foreground">
                Notificar quando produtos estiverem abaixo do mínimo
              </p>
            </div>
            <Switch
              checked={notificacoesEstoque}
              onCheckedChange={setNotificacoesEstoque}
            />
          </div>
        </CardContent>
      </Card>

      {/* Aparência */}
      <Card className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Aparência
          </CardTitle>
          <CardDescription>
            Customize a interface do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Modo Escuro</Label>
              <p className="text-sm text-muted-foreground">
                Interface com tema escuro (recomendado)
              </p>
            </div>
            <Switch
              checked={modoEscuro}
              onCheckedChange={setModoEscuro}
            />
          </div>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Segurança
          </CardTitle>
          <CardDescription>
            Gerencie a segurança da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start">
            <Shield className="h-4 w-4 mr-2" />
            Alterar Senha
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Database className="h-4 w-4 mr-2" />
            Fazer Backup dos Dados
          </Button>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end gap-4 animate-fade-up" style={{ animationDelay: "0.4s" }}>
        <Button variant="outline">Cancelar</Button>
        <Button onClick={salvarConfiguracoes}>
          <Settings className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
