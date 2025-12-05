export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      caixas: {
        Row: {
          created_at: string | null
          data_abertura: string
          data_fechamento: string | null
          id: string
          lucro_total: number | null
          observacoes: string | null
          status: string
          total_credito: number | null
          total_debito: number | null
          total_dinheiro: number | null
          total_pix: number | null
          total_vendas: number | null
          updated_at: string | null
          valor_final: number | null
          valor_inicial: number
        }
        Insert: {
          created_at?: string | null
          data_abertura?: string
          data_fechamento?: string | null
          id?: string
          lucro_total?: number | null
          observacoes?: string | null
          status?: string
          total_credito?: number | null
          total_debito?: number | null
          total_dinheiro?: number | null
          total_pix?: number | null
          total_vendas?: number | null
          updated_at?: string | null
          valor_final?: number | null
          valor_inicial?: number
        }
        Update: {
          created_at?: string | null
          data_abertura?: string
          data_fechamento?: string | null
          id?: string
          lucro_total?: number | null
          observacoes?: string | null
          status?: string
          total_credito?: number | null
          total_debito?: number | null
          total_dinheiro?: number | null
          total_pix?: number | null
          total_vendas?: number | null
          updated_at?: string | null
          valor_final?: number | null
          valor_inicial?: number
        }
        Relationships: []
      }
      clientes: {
        Row: {
          cep: string | null
          cidade: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          created_at: string
          email: string
          id: string
          modo_escuro: boolean
          nome_empresa: string
          notificacoes_email: boolean
          notificacoes_estoque: boolean
          telefone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          modo_escuro?: boolean
          nome_empresa?: string
          notificacoes_email?: boolean
          notificacoes_estoque?: boolean
          telefone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          modo_escuro?: boolean
          nome_empresa?: string
          notificacoes_email?: boolean
          notificacoes_estoque?: boolean
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          ativo: boolean | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          contato_responsavel: string | null
          created_at: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato_responsavel?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato_responsavel?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      health_checks: {
        Row: {
          checked_at: string
          details: Json | null
          id: string
          response_time_ms: number | null
          status: string
        }
        Insert: {
          checked_at?: string
          details?: Json | null
          id?: string
          response_time_ms?: number | null
          status?: string
        }
        Update: {
          checked_at?: string
          details?: Json | null
          id?: string
          response_time_ms?: number | null
          status?: string
        }
        Relationships: []
      }
      itens_venda: {
        Row: {
          created_at: string | null
          id: string
          lucro_total: number
          lucro_unitario: number
          preco_aquisicao: number
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number
          venda_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lucro_total?: number
          lucro_unitario?: number
          preco_aquisicao?: number
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number
          venda_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lucro_total?: number
          lucro_unitario?: number
          preco_aquisicao?: number
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
          subtotal?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_venda_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_venda_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      lucros_diarios: {
        Row: {
          created_at: string | null
          data: string
          id: string
          lucro_total: number
        }
        Insert: {
          created_at?: string | null
          data?: string
          id?: string
          lucro_total?: number
        }
        Update: {
          created_at?: string | null
          data?: string
          id?: string
          lucro_total?: number
        }
        Relationships: []
      }
      movimentacoes_caixa: {
        Row: {
          caixa_id: string
          created_at: string
          descricao: string
          id: string
          tipo: string
          valor: number
        }
        Insert: {
          caixa_id: string
          created_at?: string
          descricao: string
          id?: string
          tipo: string
          valor: number
        }
        Update: {
          caixa_id?: string
          created_at?: string
          descricao?: string
          id?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_caixa_caixa_id_fkey"
            columns: ["caixa_id"]
            isOneToOne: false
            referencedRelation: "caixas"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_estoque: {
        Row: {
          created_at: string | null
          fornecedor_id: string | null
          id: string
          motivo: string | null
          produto_id: string
          quantidade: number
          quantidade_anterior: number
          quantidade_nova: number
          tipo: string
          venda_id: string | null
        }
        Insert: {
          created_at?: string | null
          fornecedor_id?: string | null
          id?: string
          motivo?: string | null
          produto_id: string
          quantidade: number
          quantidade_anterior: number
          quantidade_nova: number
          tipo: string
          venda_id?: string | null
        }
        Update: {
          created_at?: string | null
          fornecedor_id?: string | null
          id?: string
          motivo?: string | null
          produto_id?: string
          quantidade?: number
          quantidade_anterior?: number
          quantidade_nova?: number
          tipo?: string
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos_venda: {
        Row: {
          created_at: string | null
          forma_pagamento: string
          id: string
          valor: number
          venda_id: string
        }
        Insert: {
          created_at?: string | null
          forma_pagamento: string
          id?: string
          valor: number
          venda_id: string
        }
        Update: {
          created_at?: string | null
          forma_pagamento?: string
          id?: string
          valor?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_venda_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          codigo_barras: string | null
          created_at: string | null
          descricao: string | null
          estoque: number
          estoque_minimo: number
          id: string
          imagem_url: string | null
          marca: string | null
          nome: string
          preco: number
          preco_aquisicao: number
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          codigo_barras?: string | null
          created_at?: string | null
          descricao?: string | null
          estoque?: number
          estoque_minimo?: number
          id?: string
          imagem_url?: string | null
          marca?: string | null
          nome: string
          preco: number
          preco_aquisicao?: number
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          codigo_barras?: string | null
          created_at?: string | null
          descricao?: string | null
          estoque?: number
          estoque_minimo?: number
          id?: string
          imagem_url?: string | null
          marca?: string | null
          nome?: string
          preco?: number
          preco_aquisicao?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      vendas: {
        Row: {
          caixa_id: string | null
          cliente_id: string | null
          created_at: string | null
          desconto: number | null
          forma_pagamento: string
          id: string
          lucro_total: number
          observacoes: string | null
          status: string | null
          total: number
          troco: number | null
          valor_recebido: number | null
        }
        Insert: {
          caixa_id?: string | null
          cliente_id?: string | null
          created_at?: string | null
          desconto?: number | null
          forma_pagamento: string
          id?: string
          lucro_total?: number
          observacoes?: string | null
          status?: string | null
          total: number
          troco?: number | null
          valor_recebido?: number | null
        }
        Update: {
          caixa_id?: string | null
          cliente_id?: string | null
          created_at?: string | null
          desconto?: number | null
          forma_pagamento?: string
          id?: string
          lucro_total?: number
          observacoes?: string | null
          status?: string | null
          total?: number
          troco?: number | null
          valor_recebido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_caixa_id_fkey"
            columns: ["caixa_id"]
            isOneToOne: false
            referencedRelation: "caixas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
