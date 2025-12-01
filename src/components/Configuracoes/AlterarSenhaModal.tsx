import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Lock } from "lucide-react";

interface AlterarSenhaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlterarSenhaModal({ open, onOpenChange }: AlterarSenhaModalProps) {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
    setMostrarSenhaAtual(false);
    setMostrarNovaSenha(false);
    setMostrarConfirmarSenha(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const validarSenha = () => {
    if (novaSenha.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return false;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não coincidem");
      return false;
    }
    return true;
  };

  const handleAlterarSenha = async () => {
    if (!validarSenha()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (error) {
        if (error.message.includes("same_password")) {
          toast.error("A nova senha não pode ser igual à senha atual");
        } else {
          toast.error("Erro ao alterar senha: " + error.message);
        }
        return;
      }

      toast.success("Senha alterada com sucesso!");
      handleClose();
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      toast.error("Erro inesperado ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Alterar Senha
          </DialogTitle>
          <DialogDescription>
            Digite sua nova senha para atualizar suas credenciais de acesso.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nova-senha">Nova Senha</Label>
            <div className="relative">
              <Input
                id="nova-senha"
                type={mostrarNovaSenha ? "text" : "password"}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
              >
                {mostrarNovaSenha ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmar-senha">Confirmar Nova Senha</Label>
            <div className="relative">
              <Input
                id="confirmar-senha"
                type={mostrarConfirmarSenha ? "text" : "password"}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a nova senha"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
              >
                {mostrarConfirmarSenha ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          {novaSenha && confirmarSenha && novaSenha !== confirmarSenha && (
            <p className="text-sm text-destructive">As senhas não coincidem</p>
          )}

          {novaSenha && novaSenha.length < 6 && (
            <p className="text-sm text-destructive">
              A senha deve ter pelo menos 6 caracteres
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleAlterarSenha}
            disabled={loading || !novaSenha || !confirmarSenha}
          >
            {loading ? "Alterando..." : "Alterar Senha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
