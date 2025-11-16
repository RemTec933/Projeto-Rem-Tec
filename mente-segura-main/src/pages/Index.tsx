import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, Brain, MessageCircle, Shield, Users, BookOpen } from 'lucide-react';
import heartIcon from '@/assets/heart-icon.png';
import brainIcon from '@/assets/brain-icon.png';


const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src={heartIcon} alt="Coração" className="w-10 h-10" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Apoio emocional
          </span>
        </div>
        <Button 
          onClick={() => navigate('/auth')}
          className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
        >
          Entrar
        </Button>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img 
            src={heartIcon} 
            alt="" 
            className="absolute top-10 left-20 w-32 h-32 opacity-10 animate-float"
            style={{ animationDelay: '0s' }}
          />
          <img 
            src={brainIcon} 
            alt="" 
            className="absolute top-32 right-32 w-24 h-24 opacity-10 animate-float"
            style={{ animationDelay: '2s' }}
          />
          <img 
            src={heartIcon} 
            alt="" 
            className="absolute bottom-20 right-40 w-20 h-20 opacity-10 animate-float"
            style={{ animationDelay: '4s' }}
          />
          <img 
            src={brainIcon} 
            alt="" 
            className="absolute bottom-32 left-40 w-28 h-28 opacity-10 animate-float"
            style={{ animationDelay: '1s' }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex justify-center gap-6 mb-8">
            <img 
              src={heartIcon} 
              alt="Coração" 
              className="w-24 h-24 animate-float"
              style={{ animationDelay: '0s' }}
            />
            <img 
              src={brainIcon} 
              alt="Cérebro" 
              className="w-24 h-24 animate-float"
              style={{ animationDelay: '3s' }}
            />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Seu Espaço Seguro de Apoio Emocional
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Um ambiente acolhedor onde você pode expressar seus sentimentos com segurança, 
            contando com o suporte da IA Simone e profissionais especializados.
          </p>

          <div>
            <Button 
              onClick={() => navigate('/auth')}
              className="px-8 py-4 text-lg bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
            >
              Começar Agora
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Como Podemos Ajudar
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl shadow-soft hover:shadow-glow transition-all duration-300 border border-border">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-4">
              <MessageCircle className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Conversa com Simone</h3>
            <p className="text-muted-foreground">
              Nossa IA psicológica está disponível 24/7 para ouvir você com empatia e compreensão.
            </p>
          </div>

          <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl shadow-soft hover:shadow-glow transition-all duration-300 border border-border">
            <div className="w-14 h-14 bg-gradient-to-br from-secondary to-accent rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Espaço Confidencial</h3>
            <p className="text-muted-foreground">
              Suas conversas são privadas e seguras. Você pode se expressar livremente.
            </p>
          </div>

          <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl shadow-soft hover:shadow-glow transition-all duration-300 border border-border">
            <div className="w-14 h-14 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Apoio Profissional</h3>
            <p className="text-muted-foreground">
              Em situações críticas, conectamos você com nossa psicóloga escolar.
            </p>
          </div>

          <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl shadow-soft hover:shadow-glow transition-all duration-300 border border-border">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mb-4">
              <BookOpen className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Recursos Educativos</h3>
            <p className="text-muted-foreground">
              Acesse conteúdos sobre saúde mental, respeito e desenvolvimento pessoal.
            </p>
          </div>

          <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl shadow-soft hover:shadow-glow transition-all duration-300 border border-border">
            <div className="w-14 h-14 bg-gradient-to-br from-secondary to-primary rounded-xl flex items-center justify-center mb-4">
              <Heart className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Palestras e Eventos</h3>
            <p className="text-muted-foreground">
              Participe de palestras sobre saúde emocional e bem-estar escolar.
            </p>
          </div>

          <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl shadow-soft hover:shadow-glow transition-all duration-300 border border-border">
            <div className="w-14 h-14 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center mb-4">
              <Brain className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Acompanhamento</h3>
            <p className="text-muted-foreground">
              Monitore seu progresso emocional e celebre suas conquistas.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 p-12 rounded-3xl backdrop-blur-sm border border-primary/20">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para cuidar da sua saúde mental?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Junte-se a centenas de alunos que já encontraram apoio e acolhimento.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground border-t border-border">
        <p>© 2025 Apoio Emocional. Desenvolvido com ❤️ por Rafaella Velace,Murilo Lima,Jullya Aparecida,Sarah Pereira,Emilly Vitória
           para o bem-estar estudantil.</p>
      </footer>
    </div>
  );
};

export default Index;