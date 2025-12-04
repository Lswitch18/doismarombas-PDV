import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, AlertTriangle, Upload } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useProdutos } from "@/hooks/useProdutos";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ImportCSVModal } from "@/components/Import/ImportCSVModal";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export default function Estoque() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    nome: "",
    preco: "",
    preco_aquisicao: "",
    estoque: "",
    estoque_minimo: "",
    codigo_barras: "",
    categoria: "",
    marca: "",
  });

  const { toast } = useToast();
  const { produtos, isLoading, addProduto, updateProduto, deleteProduto } = useProdutos();

  const filteredProducts = produtos?.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo_barras?.includes(searchTerm) ||
    p.marca?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allSelected = filteredProducts && filteredProducts.length > 0 && 
    filteredProducts.every(p => selectedProducts.includes(p.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked && filteredProducts) {
      setSelectedProducts(filteredProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0) return;
    
    if (confirm(`Tem certeza que deseja excluir ${selectedProducts.length} produto(s)?`)) {
      try {
        for (const id of selectedProducts) {
          await deleteProduto.mutateAsync(id);
        }
        setSelectedProducts([]);
        toast({
          title: `${selectedProducts.length} produto(s) excluído(s) com sucesso!`,
        });
      } catch (error) {
        toast({
          title: "Erro ao excluir produtos",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      nome: formData.nome,
      preco: parseFloat(formData.preco),
      preco_aquisicao: parseFloat(formData.preco_aquisicao),
      estoque: parseInt(formData.estoque),
      estoque_minimo: parseInt(formData.estoque_minimo),
      codigo_barras: formData.codigo_barras || undefined,
      categoria: formData.categoria || undefined,
      marca: formData.marca || undefined,
      ativo: true,
    };

    if (editingProduct) {
      await updateProduto.mutateAsync({ id: editingProduct.id, ...data });
    } else {
      await addProduto.mutateAsync(data);
    }

    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      preco: "",
      preco_aquisicao: "",
      estoque: "",
      estoque_minimo: "",
      codigo_barras: "",
      categoria: "",
      marca: "",
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      nome: product.nome,
      preco: product.preco.toString(),
      preco_aquisicao: product.preco_aquisicao?.toString() || "0",
      estoque: product.estoque.toString(),
      estoque_minimo: product.estoque_minimo.toString(),
      codigo_barras: product.codigo_barras || "",
      categoria: product.categoria || "",
      marca: product.marca || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      await deleteProduto.mutateAsync(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Estoque</h1>
          <p className="text-muted-foreground">Controle completo dos seus produtos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setImportModalOpen(true)}>
            <Upload className="h-4 w-4" />
            Importar CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço Venda (R$) *</Label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    value={formData.preco}
                    onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço Aquisição (R$) *</Label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    value={formData.preco_aquisicao}
                    onChange={(e) => setFormData({ ...formData, preco_aquisicao: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estoque *</Label>
                  <Input
                    required
                    type="number"
                    value={formData.estoque}
                    onChange={(e) => setFormData({ ...formData, estoque: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estoque Mínimo *</Label>
                  <Input
                    required
                    type="number"
                    value={formData.estoque_minimo}
                    onChange={(e) => setFormData({ ...formData, estoque_minimo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Código de Barras</Label>
                  <Input
                    value={formData.codigo_barras}
                    onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Input
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Categoria</Label>
                  <Input
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProduct ? "Atualizar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, marca ou código de barras..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {selectedProducts.length > 0 && (
              <Button 
                variant="destructive" 
                className="gap-2"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="h-4 w-4" />
                Excluir ({selectedProducts.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Carregando produtos...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Preço Venda</TableHead>
                  <TableHead>Margem</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts?.map((product) => {
                  const margem = product.preco_aquisicao > 0 
                    ? ((product.preco - product.preco_aquisicao) / product.preco_aquisicao) * 100 
                    : 0;
                  
                  return (
                    <TableRow key={product.id} className={selectedProducts.includes(product.id) ? "bg-muted/50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.nome}</TableCell>
                      <TableCell>{product.marca || "-"}</TableCell>
                      <TableCell>R$ {product.preco.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={margem > 30 ? "default" : margem > 15 ? "secondary" : "destructive"}>
                          {margem.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>{product.estoque}</TableCell>
                      <TableCell>
                        {product.estoque <= product.estoque_minimo ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Baixo
                          </Badge>
                        ) : (
                          <Badge variant="default">Normal</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <ImportCSVModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        tipo="produtos"
      />
    </div>
  );
}
