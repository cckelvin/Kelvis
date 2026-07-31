-- =====================================================================
-- KELVIS AI CHAT & SUPABASE DATABASE SCHEMA
-- Execute this script in your Supabase SQL Editor (https://app.supabase.com)
-- =====================================================================

-- 1. PROFILES TABLE (Extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile."
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to automatically create profile on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, split_part(new.email, '@', 1));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. CHAT SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'NEW CHAT',
  model TEXT NOT NULL DEFAULT 'gemini-3.6-flash',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Chat Sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat sessions."
  ON public.chat_sessions FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own chat sessions."
  ON public.chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own chat sessions."
  ON public.chat_sessions FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own chat sessions."
  ON public.chat_sessions FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 3. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'model')),
  text TEXT NOT NULL,
  image_url TEXT,
  sources JSONB,
  files JSONB,
  timestamp TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their sessions."
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE chat_sessions.id = messages.session_id
        AND (chat_sessions.user_id = auth.uid() OR chat_sessions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert messages into their sessions."
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE chat_sessions.id = messages.session_id
        AND (chat_sessions.user_id = auth.uid() OR chat_sessions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can delete messages from their sessions."
  ON public.messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE chat_sessions.id = messages.session_id
        AND (chat_sessions.user_id = auth.uid() OR chat_sessions.user_id IS NULL)
    )
  );

-- 4. STORAGE BUCKET CONFIGURATION FOR FILE ATTACHMENTS
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Access for Chat Attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-attachments');

CREATE POLICY "Authenticated Users Upload Chat Attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-attachments');
