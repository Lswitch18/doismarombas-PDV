import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ImportCSVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: 'produtos' | 'clientes';
}

interface CSVRow {
  [key: string]: string;
}

const colunasProdutos = {
  obrigatorias: ['nome', 'preco', 'preco_aquisicao', 'estoque'],
  opcionais: ['codigo_barras', 'marca', 'categoria', 'descricao', 'estoque_minimo']
};

const colunasClientes = {
  obrigatorias: ['nome'],
  opcionais: ['email', 'telefone', 'cpf', 'endereco', 'cidade', 'estado', 'cep', 'observacoes']
};

export function ImportCSVModal({ open, onOpenChange, tipo }: ImportCSVModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [dados, setDados] = useState<CSVRow[]>([]);
  const [erros, setErros] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const colunas = tipo === 'produtos' ? colunasProdutos : colunasClientes;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo CSV",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    processarCSV(selectedFile);
  };

  const processarCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const dadosProcessados = results.data as CSVRow[];
        const errosEncontrados: string[] = [];

        // Validar colunas obrigatórias
        if (dadosProcessados.length > 0) {
          const colunasCsv = Object.keys(dadosProcessados[0]);
          const faltando = colunas.obrigatorias.filter(col => !colunasCsv.includes(col));
          
          if (faltando.length > 0) {
            errosEncontrados.push(`Colunas obrigatórias faltando: ${faltando.join(', ')}`);
          }
        }

        // Validar dados
        dadosProcessados.forEach((row, index) => {
          colunas.obrigatorias.forEach(col => {
            if (!row[col] || row[col].trim() === '') {
              errosEncontrados.push(`Linha ${index + 2}: ${col} é obrigatório`);
            }
          });

          // Validações específicas para produtos
          if (tipo === 'produtos') {
            if (row.preco && isNaN(Number(row.preco))) {
              errosEncontrados.push(`Linha ${index + 2}: preço deve ser um número`);
            }
            if (row.preco_aquisicao && isNaN(Number(row.preco_aquisicao))) {
              errosEncontrados.push(`Linha ${index + 2}: preco_aquisicao deve ser um número`);
            }
            if (row.estoque && isNaN(Number(row.estoque))) {
              errosEncontrados.push(`Linha ${index + 2}: estoque deve ser um número`);
            }
          }
        });

        setDados(dadosProcessados);
        setErros(errosEncontrados);
      },
      error: (error) => {
        toast({
          title: "Erro ao processar CSV",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  };

  const importarDados = async () => {
    if (erros.length > 0) {
      toast({
        title: "Corrija os erros antes de importar",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);

    try {
      if (tipo === 'produtos') {
        const produtos = dados.map(row => ({
          nome: row.nome,
          preco: Number(row.preco),
          preco_aquisicao: Number(row.preco_aquisicao),
          estoque: Number(row.estoque),
          codigo_barras: row.codigo_barras || null,
          marca: row.marca || null,
          categoria: row.categoria || null,
          descricao: row.descricao || null,
          estoque_minimo: row.estoque_minimo ? Number(row.estoque_minimo) : 5,
          ativo: true
        }));

        const { error } = await supabase
          .from('produtos')
          .insert(produtos);

        if (error) throw error;
        
        queryClient.invalidateQueries({ queryKey: ['produtos'] });
        toast({ title: `${produtos.length} produtos importados com sucesso!` });
      } else {
        const clientes = dados.map(row => ({
          nome: row.nome,
          email: row.email || null,
          telefone: row.telefone || null,
          cpf: row.cpf || null,
          endereco: row.endereco || null,
          cidade: row.cidade || null,
          estado: row.estado || null,
          cep: row.cep || null,
          observacoes: row.observacoes || null
        }));

        const { error } = await supabase
          .from('clientes')
          .insert(clientes);

        if (error) throw error;
        
        queryClient.invalidateQueries({ queryKey: ['clientes'] });
        toast({ title: `${clientes.length} clientes importados com sucesso!` });
      }

      handleClose();
    } catch (error: any) {
      toast({
        title: "Erro ao importar dados",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setDados([]);
    setErros([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Importar {tipo === 'produtos' ? 'Produtos' : 'Clientes'} via CSV</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV com os dados. 
            {tipo === 'produtos' 
              ? ' Colunas obrigatórias: nome, preco, preco_aquisicao, estoque'
              : ' Coluna obrigatória: nome'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Arquivo CSV</Label>
            <div className="flex items-center gap-2">
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isImporting}
              />
              {file && (
                <Upload className="h-5 w-5 text-green-500" />
              )}
            </div>
          </div>

          {erros.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-semibold">Erros encontrados:</p>
                  <ul className="list-disc list-inside text-sm">
                    {erros.slice(0, 5).map((erro, i) => (
                      <li key={i}>{erro}</li>
                    ))}
                    {erros.length > 5 && (
                      <li>... e mais {erros.length - 5} erro(s)</li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {dados.length > 0 && erros.length === 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {dados.length} {tipo === 'produtos' ? 'produto(s)' : 'cliente(s)'} prontos para importação
              </AlertDescription>
            </Alert>
          )}

          {dados.length > 0 && (
            <div className="space-y-2">
              <Label>Pré-visualização (primeiras 10 linhas)</Label>
              <ScrollArea className="h-[300px] w-full border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(dados[0]).map(col => (
                        <TableHead key={col} className="whitespace-nowrap">
                          {col}
                          {colunas.obrigatorias.includes(col) && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dados.slice(0, 10).map((row, i) => (
                      <TableRow key={i}>
                        {Object.values(row).map((val, j) => (
                          <TableCell key={j} className="whitespace-nowrap">
                            {val}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            Cancelar
          </Button>
          <Button 
            onClick={importarDados} 
            disabled={dados.length === 0 || erros.length > 0 || isImporting}
          >
            {isImporting ? "Importando..." : "Importar Dados"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
