-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'psychologist', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  class_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nova conversa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  is_critical BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create teacher_feedback table
CREATE TABLE public.teacher_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.teacher_feedback ENABLE ROW LEVEL SECURITY;

-- Create educational_resources table
CREATE TABLE public.educational_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.educational_resources ENABLE ROW LEVEL SECURITY;

-- Create lectures table
CREATE TABLE public.lectures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;

-- Create lecture_reminders table
CREATE TABLE public.lecture_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lecture_id)
);

ALTER TABLE public.lecture_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for conversations
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Psychologists can view all conversations" ON public.conversations
  FOR SELECT USING (public.has_role(auth.uid(), 'psychologist'));

-- RLS Policies for messages
CREATE POLICY "Users can view messages from own conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Psychologists can view all messages" ON public.messages
  FOR SELECT USING (public.has_role(auth.uid(), 'psychologist'));

-- RLS Policies for teacher_feedback
CREATE POLICY "Teachers can view own feedback" ON public.teacher_feedback
  FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create feedback" ON public.teacher_feedback
  FOR INSERT WITH CHECK (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Psychologists can view all feedback" ON public.teacher_feedback
  FOR SELECT USING (public.has_role(auth.uid(), 'psychologist'));

CREATE POLICY "Psychologists can update feedback" ON public.teacher_feedback
  FOR UPDATE USING (public.has_role(auth.uid(), 'psychologist'));

-- RLS Policies for educational_resources
CREATE POLICY "Anyone can view resources" ON public.educational_resources
  FOR SELECT USING (true);

CREATE POLICY "Psychologists can manage resources" ON public.educational_resources
  FOR ALL USING (public.has_role(auth.uid(), 'psychologist'));

-- RLS Policies for lectures
CREATE POLICY "Anyone can view lectures" ON public.lectures
  FOR SELECT USING (true);

CREATE POLICY "Psychologists can manage lectures" ON public.lectures
  FOR ALL USING (public.has_role(auth.uid(), 'psychologist'));

-- RLS Policies for lecture_reminders
CREATE POLICY "Users can view own reminders" ON public.lecture_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reminders" ON public.lecture_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- By default, assign student role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default educational resources
INSERT INTO public.educational_resources (title, description, url, category, icon) VALUES
  ('Respeito no Ambiente Escolar', 'Compreenda a importância do respeito mútuo e como ele transforma o ambiente escolar em um lugar mais acolhedor.', '/resources/respect', 'respect', 'Heart'),
  ('Seus Sentimentos Importam', 'Entenda como seus sentimentos influenciam seu comportamento e aprenda a lidar com eles de forma saudável.', '/resources/feelings', 'feelings', 'Heart'),
  ('A Importância do Diálogo', 'Descubra como a comunicação aberta pode resolver conflitos e fortalecer relacionamentos.', '/resources/dialogue', 'dialogue', 'MessageCircle'),
  ('A Escola Como Apoio', 'Saiba como a escola pode ser fundamental no seu desenvolvimento emocional e acadêmico.', '/resources/school-support', 'support', 'School');

-- Insert sample lectures
INSERT INTO public.lectures (title, description, date) VALUES
  ('Saúde Mental na Adolescência', 'Palestra sobre os desafios emocionais na adolescência e estratégias de enfrentamento.', NOW() + INTERVAL '7 days'),
  ('Preservação do Patrimônio Escolar', 'Como cuidar do espaço que compartilhamos e sua importância para o aprendizado.', NOW() + INTERVAL '14 days');