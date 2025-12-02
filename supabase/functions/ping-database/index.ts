import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔄 Iniciando ping do banco de dados...')

    // Teste 1: Verificar conexão básica
    const { data: produtosCount, error: produtosError } = await supabase
      .from('produtos')
      .select('id', { count: 'exact', head: true })

    if (produtosError) {
      throw new Error(`Erro ao consultar produtos: ${produtosError.message}`)
    }

    // Teste 2: Verificar tabela de vendas
    const { data: vendasCount, error: vendasError } = await supabase
      .from('vendas')
      .select('id', { count: 'exact', head: true })

    if (vendasError) {
      throw new Error(`Erro ao consultar vendas: ${vendasError.message}`)
    }

    // Teste 3: Verificar tabela de clientes
    const { data: clientesCount, error: clientesError } = await supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true })

    if (clientesError) {
      throw new Error(`Erro ao consultar clientes: ${clientesError.message}`)
    }

    // Teste 4: Verificar tabela de caixas
    const { data: caixasCount, error: caixasError } = await supabase
      .from('caixas')
      .select('id', { count: 'exact', head: true })

    if (caixasError) {
      throw new Error(`Erro ao consultar caixas: ${caixasError.message}`)
    }

    const responseTime = Date.now() - startTime

    // Registrar o health check
    const { error: insertError } = await supabase
      .from('health_checks')
      .insert({
        status: 'ok',
        response_time_ms: responseTime,
        details: {
          tabelas_verificadas: ['produtos', 'vendas', 'clientes', 'caixas'],
          timestamp: new Date().toISOString(),
          supabase_url: supabaseUrl,
        }
      })

    if (insertError) {
      console.error('Erro ao registrar health check:', insertError)
    }

    // Limpar registros antigos (manter apenas os últimos 30 dias)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    await supabase
      .from('health_checks')
      .delete()
      .lt('checked_at', thirtyDaysAgo.toISOString())

    console.log(`✅ Ping concluído com sucesso em ${responseTime}ms`)

    return new Response(
      JSON.stringify({
        success: true,
        status: 'ok',
        response_time_ms: responseTime,
        message: 'Banco de dados está funcionando corretamente',
        checked_at: new Date().toISOString(),
        details: {
          tabelas_verificadas: ['produtos', 'vendas', 'clientes', 'caixas'],
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    const responseTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('❌ Erro no ping do banco:', errorMessage)

    // Tentar registrar o erro
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      await supabase
        .from('health_checks')
        .insert({
          status: 'error',
          response_time_ms: responseTime,
          details: {
            error: errorMessage,
            timestamp: new Date().toISOString(),
          }
        })
    } catch (insertErr) {
      console.error('Não foi possível registrar o erro:', insertErr)
    }

    return new Response(
      JSON.stringify({
        success: false,
        status: 'error',
        response_time_ms: responseTime,
        message: errorMessage,
        checked_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})