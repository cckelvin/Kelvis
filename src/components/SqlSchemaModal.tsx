import React, { useState } from "react";
import { X, Database, Copy, Check, Code, FileText } from "lucide-react";
import { BOUK_SUPABASE_SQL } from "../data/boukSupabaseSchema";

interface SqlSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BASE_SQL_SCHEMA = `-- =====================================================================
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

-- 4. USER MEMORIES TABLE (ChatGPT-Style Persistent Knowledge Engine)
CREATE TABLE IF NOT EXISTS public.user_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  user_name TEXT,
  interests TEXT[] DEFAULT '{}',
  nationality TEXT,
  personal_info TEXT,
  major_projects TEXT[] DEFAULT '{}',
  ai_character_judgment TEXT,
  custom_memories TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for User Memories
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memory profile."
  ON public.user_memories FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own memory profile."
  ON public.user_memories FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own memory profile."
  ON public.user_memories FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own memory profile."
  ON public.user_memories FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 5. STORAGE BUCKET CONFIGURATION FOR FILE ATTACHMENTS
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Access for Chat Attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-attachments');

CREATE POLICY "Authenticated Users Upload Chat Attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-attachments');
`;

export const SqlSchemaModal: React.FC<SqlSchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [copiedBouk, setCopiedBouk] = useState(false);
  const [tab, setTab] = useState<"full" | "bouk">("bouk");

  if (!isOpen) return null;

  const fullSchema = BASE_SQL_SCHEMA + "\n" + BOUK_SUPABASE_SQL;

  const handleCopy = (content: string, isBoukOnly: boolean) => {
    navigator.clipboard.writeText(content);
    if (isBoukOnly) {
      setCopiedBouk(true);
      setTimeout(() => setCopiedBouk(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 select-none">
      <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center space-x-2">
                <span>Supabase Database SQL Code</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Execute directly in your Supabase SQL Editor to set up tables, RLS policies, and 100 HTML pages columns.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-slate-200/80 dark:bg-zinc-800 p-1 rounded-2xl text-xs font-semibold">
              <button
                onClick={() => setTab("bouk")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  tab === "bouk"
                    ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-xs font-bold"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                }`}
              >
                .Bouk (100 HTML Pages)
              </button>
              <button
                onClick={() => setTab("full")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  tab === "full"
                    ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-xs font-bold"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                }`}
              >
                Full Database
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Banner */}
        <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-amber-800 dark:text-amber-300">
            <FileText className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {tab === "bouk"
                ? "Includes page_1 to page_100 HTML columns and initial WAEC/NECO & Geography books."
                : "Includes chat sessions, messages, storage buckets, and .Bouk 100 HTML pages schema."}
            </span>
          </div>

          <button
            onClick={() => handleCopy(tab === "bouk" ? BOUK_SUPABASE_SQL : fullSchema, tab === "bouk")}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            {tab === "bouk" ? (
              copiedBouk ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />
            ) : (
              copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />
            )}
            <span>
              {tab === "bouk"
                ? copiedBouk
                  ? "Copied .Bouk SQL!"
                  : "Copy .Bouk SQL"
                : copied
                ? "Copied Full SQL!"
                : "Copy Full SQL"}
            </span>
          </button>
        </div>

        {/* SQL Code View */}
        <div className="flex-1 bg-slate-900 text-slate-100 p-4 overflow-y-auto font-mono text-xs leading-relaxed border-t border-slate-800">
          <pre className="whitespace-pre-wrap">{tab === "bouk" ? BOUK_SUPABASE_SQL : fullSchema}</pre>
        </div>
      </div>
    </div>
  );
};
