import React, { useState } from "react";
import { X, Database, Copy, Check, Code, FileText } from "lucide-react";

interface SqlSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FULL_SQL_SCHEMA = `-- =====================================================================
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
  WITH CHECK (bucket_id = 'chat-attachments');`;

export const SqlSchemaModal: React.FC<SqlSchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(FULL_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none">
      <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl transition-all flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-zinc-100 font-bold text-base">
            <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Supabase Full SQL Setup Script</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <div className="py-3 text-xs text-slate-600 dark:text-zinc-400 shrink-0 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Code className="w-4 h-4 text-slate-500" />
            <span>Copy & paste this script into your <strong>Supabase SQL Editor</strong></span>
          </div>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs flex items-center space-x-1.5 hover:opacity-90 transition-opacity shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                <span>Copied SQL!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy SQL Script</span>
              </>
            )}
          </button>
        </div>

        {/* Code View */}
        <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs leading-relaxed border border-slate-800 shadow-inner selection:bg-emerald-900 selection:text-white">
          <pre className="whitespace-pre-wrap break-words">{FULL_SQL_SCHEMA}</pre>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0 text-xs text-slate-500 dark:text-zinc-500">
          <div className="flex items-center space-x-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Saved in <code>/supabase_schema.sql</code></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-semibold hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
