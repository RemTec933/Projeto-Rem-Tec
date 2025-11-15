import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Heart, Brain } from 'lucide-react';
import heartIcon from '@/assets/heart-icon.png';
import brainIcon from '@/assets/brain-icon.png';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [className, setClassName] = useState('');
  const [userType, setUserType] = useState<'student' | 'teacher' | 'psychologist'>('student');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  // handleSignUp consolidated later in the file


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            class_name: className,
            role: userType, // envia role no user_metadata para o trigger/db usar
          }
        }
      });

      // debug: ver resposta completa
      console.log('signUp response', { data, error });

      if (error) throw error;

      // se não veio user, provavelmente o fluxo exige confirmação por e-mail
      if (!data?.user) {
        toast({
          title: 'Confirme seu e‑mail',
          description: 'Enviamos um link de confirmação. Confirme para concluir o cadastro.',
        });
        return;
      }

      // Se o user foi retornado, só tentar atualizar profile (se permitido pelas rules)
      if (className && userType === 'student') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ class_name: className })
          .eq('id', data.user.id);

        if (profileError) {
          // Log para debugar; não interrompe fluxo do usuário
          console.error('Erro ao atualizar profile:', profileError);
        }
      }

      toast({
        title: 'Bem-vindo(a)!',
        description: 'Sua conta foi criada com sucesso.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Erro ao criar conta',
        description: error?.message || 'Ocorreu um erro ao criar sua conta.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img 
          src={heartIcon} 
          alt="" 
          className="absolute top-20 left-20 w-24 h-24 opacity-20 animate-float"
          style={{ animationDelay: '0s' }}
        />
        <img 
          src={brainIcon} 
          alt="" 
          className="absolute top-40 right-32 w-20 h-20 opacity-20 animate-float"
          style={{ animationDelay: '2s' }}
        />
        <img 
          src={heartIcon} 
          alt="" 
          className="absolute bottom-32 right-20 w-16 h-16 opacity-15 animate-float"
          style={{ animationDelay: '4s' }}
        />
        <img 
          src={brainIcon} 
          alt="" 
          className="absolute bottom-20 left-32 w-24 h-24 opacity-15 animate-float"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <Card className="w-full max-w-md p-8 shadow-soft backdrop-blur-sm bg-card/80 relative z-10">
        <div className="text-center mb-6">
          <div className="flex justify-center gap-4 mb-4">
            <img src={heartIcon} alt="Coração" className="w-16 h-16" />
            <img src={brainIcon} alt="Cérebro" className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Bem-vindo ao espaço de apoio emocional
          </h1>
          <p className="text-muted-foreground mt-2">
            Seu espaço seguro de apoio emocional
          </p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signin">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar Conta</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Senha</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usertype">Tipo de Usuário</Label>
                <Select value={userType} onValueChange={(value: any) => setUserType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Aluno</SelectItem>
                    <SelectItem value="teacher">Professor</SelectItem>
                    <SelectItem value="psychologist">Psicólogo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fullname">Nome Completo</Label>
                <Input
                  id="fullname"
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              {userType === 'student' && (
                <div className="space-y-2">
                  <Label htmlFor="classname">Turma</Label>
                  <Input
                    id="classname"
                    type="text"
                    placeholder="Ex: 3º Ano A"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                disabled={loading}
              >
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;