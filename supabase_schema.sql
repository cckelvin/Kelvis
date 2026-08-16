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

-- =====================================================================
-- 5. .BOUK (OPEN ACCESS EBOOKS & AI KNOWLEDGE BASE) SCHEMA
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.bouks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN ('edu', 'tech', 'business', 'science', 'geo', 'humanities', 'general')),
  category_name TEXT NOT NULL DEFAULT 'General',
  grade_level TEXT DEFAULT 'General',
  cover_image TEXT,
  cover_gradient TEXT DEFAULT 'from-blue-600 via-indigo-600 to-purple-800',
  description TEXT NOT NULL,
  rating NUMERIC(3, 2) DEFAULT 5.00,
  readers_count INTEGER DEFAULT 1,
  chapters JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  ai_guidance TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for lightning fast searching and classification filtering
CREATE INDEX IF NOT EXISTS idx_bouks_classification ON public.bouks(classification);
CREATE INDEX IF NOT EXISTS idx_bouks_created_at ON public.bouks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bouks_title_author ON public.bouks(title, author);

-- Enable RLS for Bouks
ALTER TABLE public.bouks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view all open access Bouks." ON public.bouks;
CREATE POLICY "Public can view all open access Bouks."
  ON public.bouks FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create Bouks." ON public.bouks;
CREATE POLICY "Authenticated users can create Bouks."
  ON public.bouks FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own Bouks." ON public.bouks;
CREATE POLICY "Users can update their own Bouks."
  ON public.bouks FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their own Bouks." ON public.bouks;
CREATE POLICY "Users can delete their own Bouks."
  ON public.bouks FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Seed initial sample Bouks (WAEC/NECO & Geography)
INSERT INTO public.bouks (
  id,
  title,
  author,
  classification,
  category_name,
  grade_level,
  cover_gradient,
  description,
  rating,
  readers_count,
  tags,
  ai_guidance,
  chapters
) VALUES
(
  'a0000001-0000-0000-0000-000000000001',
  'WAEC & NECO 2000–2026 Comprehensive Past Questions & Step-by-Step Solutions',
  'West African Examinations Council & NECO Editorial Board',
  'edu',
  'Education & Exam Preparation',
  'Senior Secondary (SS1–SS3) / WAEC / NECO',
  'from-amber-600 via-orange-600 to-red-700',
  'Official open-access past examination question archive spanning 2000 to 2026 with worked solutions and marking schemes.',
  4.95,
  48200,
  ARRAY['WAEC', 'NECO', 'Past Questions', 'Mathematics', 'Physics', 'Chemistry', 'Biology'],
  'Contains verified WAEC/NECO senior secondary past examination questions from 2000 to 2026 for AI guidance and student prep.',
  $json$[
    {
      "id": "waec-ch1-math",
      "chapterNumber": 1,
      "title": "General Mathematics: Algebraic Processes & Trigonometry",
      "summary": "Core quadratic equations, simultaneous equations, and 3-figure bearings.",
      "pages": [
        {
          "pageNumber": 1,
          "title": "WAEC 2024 / 2025 Mathematics Theory Paper 2",
          "content": "### WAEC General Mathematics\n\n#### Problem 1 (Algebraic Optimization)\nA trader purchased x bags of rice for ₦180,000. If each bag had cost ₦3,000 less, he would have bought 2 more bags.\n1. Formulate quadratic equation: x^2 + 2x - 120 = 0\n2. Factorization: (x + 12)(x - 10) = 0\n3. Result: x = 10 bags, original cost = ₦18,000 per bag."
        }
      ]
    }
  ]$json$::jsonb
),
(
  'a0000002-0000-0000-0000-000000000002',
  'Complete African & Global Geography Knowledge Bouk',
  'Dr. A. O. Balogun & African Cartography Society',
  'geo',
  'Geography & Earth Sciences',
  'Secondary, University & Reference',
  'from-emerald-700 via-teal-800 to-cyan-900',
  'Comprehensive treatise on African and global physical landforms, the West African Monsoon, River Niger basin, and GIS techniques.',
  4.88,
  31900,
  ARRAY['Geography', 'Africa', 'Climatology', 'River Niger', 'Inselbergs', 'GIS'],
  'Physical and human geography dataset for Africa and the world.',
  $json$[
    {
      "id": "geo-ch1-climate",
      "chapterNumber": 1,
      "title": "Climatology: The West African Monsoon & ITD",
      "summary": "Inter-Tropical Discontinuity air masses and vegetation zones.",
      "pages": [
        {
          "pageNumber": 1,
          "title": "The Mechanics of West African Seasons",
          "content": "### Inter-Tropical Discontinuity (ITD)\n\n1. Tropical Maritime (mT): South Atlantic moist monsoon winds\n2. Tropical Continental (cT): Sahara dry Harmattan winds\n3. Annual migration of the ITD controls the wet and dry rainfall cycles."
        }
      ]
    }
  ]$json$::jsonb
)
ON CONFLICT (id) DO NOTHING;
