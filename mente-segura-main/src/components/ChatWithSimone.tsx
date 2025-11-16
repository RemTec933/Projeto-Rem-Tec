import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import heartIcon from '@/assets/heart-icon.png';
import brainIcon from '@/assets/brain-icon.png';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  is_critical?: boolean;
}

interface ChatWithSimoneProps {
  conversationId: string;
  onCriticalDetected?: () => void;
}

const ChatWithSimone = ({ conversationId, onCriticalDetected }: ChatWithSimoneProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(m => ({ ...m, role: m.role as 'user' | 'assistant' })));
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Erro ao carregar mensagens',
        description: 'Não foi possível carregar o histórico da conversa.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const streamChat = async (userMessage: string) => {
    const messagesToSend = [
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage }
    ];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-simone`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: messagesToSend,
            conversationId,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Muitas solicitações. Por favor, aguarde alguns instantes.');
        }
        if (response.status === 402) {
          throw new Error('Serviço temporariamente indisponível.');
        }
        throw new Error('Erro ao processar sua mensagem');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantContent = '';
      let streamDone = false;
      let isCritical = false;

      // Add temporary assistant message
      const tempAssistantMsg: Message = {
        id: 'temp-' + Date.now(),
        role: 'assistant',
        content: '',
      };
      setMessages(prev => [...prev, tempAssistantMsg]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              
              // Check for critical markers
              if (assistantContent.includes('⚠️ ATENÇÃO:')) {
                isCritical = true;
              }

              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg.id === tempAssistantMsg.id) {
                  lastMsg.content = assistantContent;
                  lastMsg.is_critical = isCritical;
                }
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Save assistant message to database
      const { error: saveError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: assistantContent,
          is_critical: isCritical,
        });

      if (saveError) throw saveError;

      if (isCritical && onCriticalDetected) {
        onCriticalDetected();
      }

      // Reload messages to get proper IDs
      await loadMessages();
    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: 'Erro na conversa',
        description: error.message || 'Não foi possível processar sua mensagem.',
        variant: 'destructive',
      });
      
      // Remove temporary assistant message on error
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Save user message to database
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: userMessage,
        });

      if (error) throw error;

      // Add to local state
      const newUserMsg: Message = {
        id: 'user-' + Date.now(),
        role: 'user',
        content: userMessage,
      };
      setMessages(prev => [...prev, newUserMsg]);

      // Stream AI response
      await streamChat(userMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Não foi possível enviar sua mensagem.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingHistory) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center gap-4 mb-4">
            <img src={heartIcon} alt="" className="w-12 h-12 animate-float" />
            <img src={brainIcon} alt="" className="w-12 h-12 animate-float" style={{ animationDelay: '3s' }} />
          </div>
          <p className="text-muted-foreground">Carregando conversa...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center gap-3">
          <img src={heartIcon} alt="" className="w-8 h-8" />
          <div>
            <h3 className="font-semibold">Simone - Sua Psicóloga Virtual</h3>
            <p className="text-sm text-muted-foreground">Disponível para te ouvir</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex gap-4 mb-4">
              <img src={heartIcon} alt="" className="w-16 h-16 animate-float" />
              <img src={brainIcon} alt="" className="w-16 h-16 animate-float" style={{ animationDelay: '3s' }} />
            </div>
            <h4 className="text-lg font-semibold mb-2">Olá! Eu sou a Simone</h4>
            <p className="text-muted-foreground max-w-md">
              Este é um espaço seguro para você expressar seus sentimentos. 
             Eu estou aqui para te ouvir.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground'
                      : message.is_critical
                      ? 'bg-destructive/10 border-2 border-destructive/50 text-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {message.is_critical && (
                    <div className="flex items-center gap-2 mb-2 text-destructive font-semibold">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">Situação que requer atenção</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={isLoading}
          />
          <Button 
            onClick={handleSend} 
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ChatWithSimone;