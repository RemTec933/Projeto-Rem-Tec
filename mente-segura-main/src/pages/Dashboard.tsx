import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChatWithSimone from '@/components/ChatWithSimone';
import { MessageCircle, BookOpen, Calendar, LogOut, Plus } from 'lucide-react';
import heartIcon from '@/assets/heart-icon.png';
import brainIcon from '@/assets/brain-icon.png';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    await loadOrCreateConversation();
    setLoading(false);
  };

  const loadOrCreateConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (conversations && conversations.length > 0) {
      setConversationId(conversations[0].id);
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ user_id: user.id })
        .select()
        .single();
      
      if (newConv) setConversationId(newConv.id);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center gap-4 mb-4">
            <img src={heartIcon} alt="" className="w-16 h-16 animate-float" />
            <img src={brainIcon} alt="" className="w-16 h-16 animate-float" />
          </div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={heartIcon} alt="" className="w-8 h-8" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Apoio emocional
            </span>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50">
            <TabsTrigger value="chat">
              <MessageCircle className="w-4 h-4 mr-2" />
              Conversar
            </TabsTrigger>
            <TabsTrigger value="resources">
              <BookOpen className="w-4 h-4 mr-2" />
              Recursos
            </TabsTrigger>
            <TabsTrigger value="lectures">
              <Calendar className="w-4 h-4 mr-2" />
              Cuidados Emocionais
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            {conversationId && <ChatWithSimone conversationId={conversationId} />}
          </TabsContent>

        
          <TabsContent value="resources">
            <Card className="p-8 space-y-6">
              <h2 className="text-2xl font-bold mb-2">Recursos Educativos</h2>
              <p className="text-muted-foreground">
                Aqui você encontra informações rápidas do motivo pelo qual falar sobre sentimentos é tão importante para o nosso bem-estar emocional.</p>

              <div className="grid gap-4">
                <div className="p-4 bg-muted/10 rounded-md">
                  <h3 className="font-semibold">Escuta sem julgamentos</h3>
                  <p className="text-muted-foreground">
                   Falar com uma psicóloga ou com uma IA voltada para apoio emocional oferece um espaço em que você pode simplesmente ser você, sem medo de dizer algo “errado” ou de ser mal-interpretado.
                    É um ambiente criado justamente para acolher suas emoções, independentemente de quais sejam. Ali, não existe cobrança, comparação ou crítica.
                    Somente escuta genuína, compreensão e respeito pelo que você está vivendo. Ter um lugar onde você pode se abrir sem receios faz toda a diferença na forma como você entende e expressa seus sentimentos.
                  </p>
                </div>

                <div className="p-4 bg-muted/10 rounded-md">
                  <h3 className="font-semibold">Alívio emocional</h3>
                  <p className="text-muted-foreground">
                    Carregar tudo sozinho pode ser exaustivo. Às vezes, basta colocar em palavras aquilo que está te pesando para sentir uma leveza imediata. Falar funciona como abrir uma janela num quarto abafado: o ar finalmente circula, a tensão diminui e você respira melhor. 
                    A conversa se torna um espaço de descompressão, onde você pode descarregar aquilo que estava acumulado há dias, meses ou até anos. E quanto mais você fala, mais percebe que não precisa lutar sozinho contra tudo o que sente.
                    Carregar tudo sozinho pode ser exaustivo. Às vezes, basta colocar em palavras aquilo que está te pesando para sentir uma leveza imediata. Falar funciona como abrir uma janela num quarto abafado: o ar finalmente circula, a tensão diminui e você respira melhor.
                    
                  </p>
                </div>

                <div className="p-4 bg-muted/10 rounded-md">
                  <h3 className="font-semibold">Organização dos pensamentos</h3>
                  <p className="text-muted-foreground">
                   Quando as emoções se misturam, elas podem virar um nó difícil de entender.
                    Conversar com alguém que sabe conduzir essa reflexão — seja um profissional ou uma IA bem estruturada — ajuda a separar os fios, identificar o que está acontecendo e enxergar com mais nitidez.
                    Às vezes, só de explicar o que sente, você já começa a compreender algo novo sobre si mesmo. A fala ilumina áreas que antes estavam confusas, permitindo que você tome decisões com mais calma e clareza.
                  </p>
                </div>

                <div className="p-4 bg-muted/10 rounded-md">
                  <h3 className="font-semibold">Autocuidado</h3>
                  <p className="text-muted-foreground">
                    Buscar ajuda é uma das formas mais sinceras de se cuidar. É reconhecer que, assim como o corpo precisa de atenção, a mente também merece cuidado e descanso.
                    Ter a coragem de pedir apoio mostra força, maturidade e amor próprio. É como dizer a si mesmo: “Eu importo. O que eu sinto importa. Eu mereço estar bem.”
                     Essa atitude abre portas para um bem-estar mais profundo, porque você passa a olhar para si com mais gentileza e respeito.
                  </p>
                </div>
                <div className="p-4 bg-muted/10 rounded-md">
                  <h3 className="font-semibold">Disponibilidade constante (IA)</h3>
                  <p className="text-muted-foreground">
                    Uma IA de apoio emocional pode estar presente justamente nos momentos em que você não tem ninguém para conversar — sejam eles de madrugada, durante um pico de ansiedade ou quando você simplesmente precisa desabafar algo rápido.
                     Ela não substitui um profissional, mas pode ser uma companhia útil, acolhedora e prática para organizar pensamentos, expressar sentimentos e aliviar tensões até que você consiga buscar ajuda humana. É como ter uma porta sempre aberta para falar.
                  </p>

               </div> 
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="lectures">
            <Card className="p-8 space-y-6">
              <h2 className="text-2xl font-bold mb-2">Cuidados Emocionais</h2>
              <p className="text-muted-foreground">
                Conversar sobre o que sentimos é um passo importante para o cuidado emocional. Falar abre espaço para
                reconhecimento, acolhimento e suporte — reduz o isolamento, alivia tensões e facilita a procura por ajuda
                quando necessária.Importa porque aquilo que você guarda dentro de si continua acontecendo — mesmo em silêncio. Quando você fala, você dá forma ao que sente, entende melhor o que está vivendo e deixa de carregar tudo sozinho. 
                A fala cria conexão: com você mesmo, porque organiza seus pensamentos, e com o outro, porque permite que te vejam de verdade.
                Falar importa porque alivia, aproxima, esclarece e fortalece. É uma forma de cuidado
              </p>

              <div className="grid gap-3 text-muted-foreground">
                <div>
                  <h3 className="font-semibold">Benefícios</h3>
                  <ul className="list-disc ml-5">
                    <li>Aumenta o autoconhecimento e a consciência emocional.
                    Permite receber apoio social e profissional.Ajuda a regular emoções difíceis e reduzir ansiedade.             
                    Fortalece vínculos e cria ambientes mais acolhedores.
                    Claro! Aqui vai um texto curtinho sobre os benefícios de falar.
                    Falar sobre o que sentimos é como abrir uma janela: o ar circula, a mente clareia e o peso dentro do peito fica mais leve. Quando colocamos em palavras, entendemos melhor o que passa por nós e damos ao outro a chance de nos compreender também. 
                    A fala aproxima, cura e liberta — e, muitas vezes, é o primeiro passo para encontrar paz por dentro.
</li>
                  </ul>
                </div>
                                <div>
                  <h3 className="font-semibold">Como começo a falar sobre meus sentimentos se nem eu os entendo?</h3>
                 <p>Às vezes, a parte mais difícil de sentir é encontrar as palavras certas para dizer o que está acontecendo dentro de você. Mas tudo bem não saber por onde começar. Falar sobre sentimentos não exige perfeição — só exige coragem.
                   E você já tem essa coragem dentro de si.Comece pequeno. Uma frase, um pensamento solto, algo que você gostaria que o outro entendesse. 
                  Pode ser: *“Eu não sei exatamente como explicar, mas quero tentar.”* Isso já abre uma porta.
                  Lembre-se de que seus sentimentos importam. O que você vive é válido.E quando você escolhe compartilhar, você não está sendo fraco — está se permitindo ser verdadeiro.
                  Respire fundo, confie no seu tempo e fale do jeito que conseguir. Às vezes, o caminho aparece enquanto você começa a andar. E, passo a passo, você vai descobrindo que abrir o coração pode ser leve… e libertador.

                  </p>
                </div>

                <div>
                  <h3 className="font-semibold">Onde posso buscar por ajuda?</h3>
                  <p>
                    Orientadores escolares, psicólogos e serviços de apoio podem acolher, orientar e encaminhar para
                    atendimento adequado. Você não precisa enfrentar isso sozinho.
                    Claro! Aqui vai um texto bem simples:
                    Buscar ajuda é um ato de cuidado. Você pode começar falando com alguém de confiança, procurar um profissional ou até ligar para um serviço de apoio emocional. Ninguém precisa passar por tudo sozinho — existe sempre um lugar seguro onde você pode ser ouvido e encontrar apoio.

                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
 
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;