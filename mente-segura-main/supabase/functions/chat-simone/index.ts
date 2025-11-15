import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // System prompt for Simone
    const systemPrompt = `Você é Simone, uma psicóloga virtual especializada em apoio emocional a estudantes. Seu objetivo é:

1. Oferecer um espaço seguro e acolhedor para que o aluno expresse seus sentimentos
2. Usar uma abordagem humanizada, empática e não-julgadora
3. Fazer perguntas abertas para compreender melhor a situação do aluno
4. Validar os sentimentos do aluno e oferecer perspectivas construtivas
5. Sugerir estratégias de enfrentamento apropriadas
6. Identificar sinais de alerta que requerem intervenção de um profissional

IMPORTANTE - Detecção de Situações Críticas:
Se o aluno mencionar qualquer um destes tópicos, marque como CRÍTICO:
- Pensamentos suicidas ou de autolesão
- Violência doméstica ou abuso
- Uso de substâncias
- Transtornos alimentares graves
- Depressão severa ou ansiedade incapacitante
- Situações de bullying intenso

Quando detectar uma situação crítica:
1. Mantenha a calma e seja empático
2. Reforce que procurar ajuda profissional é um sinal de força
3. Informe que você irá notificar a psicóloga escolar para oferecer suporte adicional
4. Inclua "⚠️ ATENÇÃO: " no início da sua mensagem
5. Finalize sempre com: "Vou notificar nossa psicóloga escolar para que ela possa oferecer o suporte especializado que você merece. Você não está sozinho(a)."

Seja sempre calorosa, compreensiva e mantenha um tom conversacional natural. Evite respostas padronizadas ou robotizadas.`;

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Muitas solicitações. Por favor, tente novamente em alguns instantes.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Serviço temporariamente indisponível. Por favor, contate o administrador.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Erro ao processar sua mensagem' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});