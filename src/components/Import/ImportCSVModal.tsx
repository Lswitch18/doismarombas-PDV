import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, AlertCircle, CheckCircle, Download, FileText, Trash2 } from "lucide-react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface ImportCSVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: 'produtos' | 'clientes';
}

interface CSVRow {
  [key: string]: string;
}

interface LogValidacao {
  linha: number;
  status: 'sucesso' | 'erro' | 'aviso';
  mensagem: string;
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
  const [logs, setLogs] = useState<LogValidacao[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const colunas = tipo === 'produtos' ? colunasProdutos : colunasClientes;

  const downloadTemplate = () => {
    const todasColunas = [...colunas.obrigatorias, ...colunas.opcionais];
    const header = todasColunas.join(',');
    
    // Criar linha de exemplo
    let exemploLinha = '';
    if (tipo === 'produtos') {
      exemploLinha = 'Produto Exemplo,100.00,50.00,10,7891234567890,Marca X,Categoria Y,Descrição do produto,5';
    } else {
      exemploLinha = 'Cliente Exemplo,email@exemplo.com,(11) 99999-9999,123.456.789-00,Rua Exemplo 123,São Paulo,SP,01234-567,Observações';
    }
    
    const csvContent = `${header}\n${exemploLinha}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `template_${tipo}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Template baixado",
      description: "Use este arquivo como modelo para importação"
    });
  };

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
        const logsValidacao: LogValidacao[] = [];

        // Log inicial
        logsValidacao.push({
          linha: 0,
          status: 'sucesso',
          mensagem: `Arquivo lido com sucesso. Total de ${dadosProcessados.length} linha(s) encontrada(s).`
        });

        // Validar colunas obrigatórias
        if (dadosProcessados.length > 0) {
          const colunasCsv = Object.keys(dadosProcessados[0]);
          const faltando = colunas.obrigatorias.filter(col => !colunasCsv.includes(col));
          
          if (faltando.length > 0) {
            const erro = `Colunas obrigatórias faltando: ${faltando.join(', ')}`;
            errosEncontrados.push(erro);
            logsValidacao.push({
              linha: 0,
              status: 'erro',
              mensagem: erro
            });
          } else {
            logsValidacao.push({
              linha: 0,
              status: 'sucesso',
              mensagem: 'Todas as colunas obrigatórias presentes.'
            });
          }

          // Log das colunas encontradas
          logsValidacao.push({
            linha: 0,
            status: 'sucesso',
            mensagem: `Colunas encontradas: ${colunasCsv.join(', ')}`
          });
        }

        // Validar cada linha
        dadosProcessados.forEach((row, index) => {
          const numLinha = index + 2; // +2 porque linha 1 é cabeçalho
          let errosLinha = 0;

          // Validar campos obrigatórios
          colunas.obrigatorias.forEach(col => {
            if (!row[col] || row[col].trim() === '') {
              const erro = `Linha ${numLinha}: campo "${col}" é obrigatório`;
              errosEncontrados.push(erro);
              logsValidacao.push({
                linha: numLinha,
                status: 'erro',
                mensagem: erro
              });
              errosLinha++;
            }
          });

          // Validações específicas para produtos
          if (tipo === 'produtos') {
            if (row.preco && isNaN(Number(row.preco))) {
              const erro = `Linha ${numLinha}: "preco" deve ser um número válido (valor: ${row.preco})`;
              errosEncontrados.push(erro);
              logsValidacao.push({
                linha: numLinha,
                status: 'erro',
                mensagem: erro
              });
              errosLinha++;
            }
            if (row.preco_aquisicao && isNaN(Number(row.preco_aquisicao))) {
              const erro = `Linha ${numLinha}: "preco_aquisicao" deve ser um número válido (valor: ${row.preco_aquisicao})`;
              errosEncontrados.push(erro);
              logsValidacao.push({
                linha: numLinha,
                status: 'erro',
                mensagem: erro
              });
              errosLinha++;
            }
            if (row.estoque && isNaN(Number(row.estoque))) {
              const erro = `Linha ${numLinha}: "estoque" deve ser um número válido (valor: ${row.estoque})`;
              errosEncontrados.push(erro);
              logsValidacao.push({
                linha: numLinha,
                status: 'erro',
                mensagem: erro
              });
              errosLinha++;
            }
            
            // Avisos
            if (row.estoque_minimo && isNaN(Number(row.estoque_minimo))) {
              logsValidacao.push({
                linha: numLinha,
                status: 'aviso',
                mensagem: `"estoque_minimo" inválido, será usado valor padrão (5)`
              });
            }
            
            if (row.preco && row.preco_aquisicao && Number(row.preco) < Number(row.preco_aquisicao)) {
              logsValidacao.push({
                linha: numLinha,
                status: 'aviso',
                mensagem: 'Preço de venda menor que preço de aquisição (margem negativa)'
              });
            }
          }

          // Validações específicas para clientes
          if (tipo === 'clientes') {
            if (row.email && !row.email.includes('@')) {
              logsValidacao.push({
                linha: numLinha,
                status: 'aviso',
                mensagem: 'Email pode estar em formato inválido'
              });
            }
          }

          // Log de sucesso se não houver erros na linha
          if (errosLinha === 0) {
            logsValidacao.push({
              linha: numLinha,
              status: 'sucesso',
              mensagem: `Linha validada com sucesso`
            });
          }
        });

        // Log final
        if (errosEncontrados.length === 0) {
          logsValidacao.push({
            linha: 0,
            status: 'sucesso',
            mensagem: `✓ Validação concluída! ${dadosProcessados.length} registro(s) pronto(s) para importação.`
          });
        } else {
          logsValidacao.push({
            linha: 0,
            status: 'erro',
            mensagem: `✗ Validação concluída com ${errosEncontrados.length} erro(s). Corrija antes de importar.`
          });
        }

        setDados(dadosProcessados);
        setErros(errosEncontrados);
        setLogs(logsValidacao);
      },
      error: (error) => {
        toast({
          title: "Erro ao processar CSV",
          description: error.message,
          variant: "destructive"
        });
        setLogs([{
          linha: 0,
          status: 'erro',
          mensagem: `Erro ao ler arquivo: ${error.message}`
        }]);
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
          codigo_barras: row.codigo_barras?.trim() || null,
          marca: row.marca?.trim() || null,
          categoria: row.categoria?.trim() || null,
          descricao: row.descricao?.trim() || null,
          estoque_minimo: row.estoque_minimo && row.estoque_minimo.trim() !== '' ? Number(row.estoque_minimo) : 5,
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

  const limparDados = async () => {
    setIsClearing(true);

    try {
      const tabela = tipo === 'produtos' ? 'produtos' : 'clientes';
      
      const { error } = await supabase
        .from(tabela)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta todos os registros

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: [tipo] });
      
      toast({
        title: "Dados limpos com sucesso",
        description: `Todos os ${tipo} foram removidos do banco de dados`
      });
    } catch (error: any) {
      toast({
        title: "Erro ao limpar dados",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setDados([]);
    setErros([]);
    setLogs([]);
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
        
        <div className="flex justify-between mb-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm"
                className="gap-2"
                disabled={isClearing || isImporting}
              >
                <Trash2 className="h-4 w-4" />
                Limpar Todos os Dados
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar limpeza de dados</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá deletar TODOS os {tipo} cadastrados no banco de dados. 
                  Esta operação não pode ser desfeita. Tem certeza que deseja continuar?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={limparDados} className="bg-destructive hover:bg-destructive/90">
                  {isClearing ? "Limpando..." : "Sim, limpar tudo"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button 
            variant="outline" 
            size="sm"
            onClick={downloadTemplate}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Baixar Template CSV
          </Button>
        </div>
        
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

          {logs.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Log de Validação
              </Label>
              <ScrollArea className="h-[200px] w-full border rounded-md p-3 bg-muted/30">
                <div className="space-y-1.5 font-mono text-xs">
                  {logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Badge 
                        variant={log.status === 'erro' ? 'destructive' : log.status === 'aviso' ? 'outline' : 'default'}
                        className="shrink-0 min-w-[60px] justify-center"
                      >
                        {log.status === 'erro' ? 'ERRO' : log.status === 'aviso' ? 'AVISO' : 'OK'}
                      </Badge>
                      <span className="text-muted-foreground">
                        {log.linha > 0 && `[L${log.linha}]`}
                      </span>
                      <span className={log.status === 'erro' ? 'text-destructive' : log.status === 'aviso' ? 'text-orange-500' : ''}>
                        {log.mensagem}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
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
