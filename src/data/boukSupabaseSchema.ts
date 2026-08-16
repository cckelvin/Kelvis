export const BOUK_SUPABASE_SQL = `-- =====================================================================
-- .BOUK (OPEN ACCESS EBOOKS & AI KNOWLEDGE BASE) SUPABASE SQL SCHEMA
-- Execute this single SQL script in your Supabase SQL Editor (https://app.supabase.com)
-- =====================================================================

-- 1. CREATE BOUKS TABLE
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

-- 2. CREATE INDEXES FOR ULTRA-FAST FULL-TEXT SEARCH & FILTERING
CREATE INDEX IF NOT EXISTS idx_bouks_classification ON public.bouks(classification);
CREATE INDEX IF NOT EXISTS idx_bouks_created_at ON public.bouks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bouks_title_author ON public.bouks(title, author);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.bouks ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES (Public read for all open-access books, authenticated write/update)
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

-- 5. SEED INITIAL SAMPLE BOUKS (WAEC/NECO 2000-2026, Geography, Tech, Business)
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
        },
        {
          "pageNumber": 2,
          "title": "Simultaneous Linear & Quadratic Equations",
          "content": "### NECO Past Question: Simultaneous Equations\n\nSolve for x and y:\n1. x + y = 5\n2. x^2 + y^2 = 13\n\n#### Solution:\nFrom (1), y = 5 - x\nSubstitute into (2): x^2 + (5 - x)^2 = 13\nx^2 + 25 - 10x + x^2 = 13\n2x^2 - 10x + 12 = 0\nx^2 - 5x + 6 = 0\n(x - 2)(x - 3) = 0\n\nSolutions: (x=2, y=3) or (x=3, y=2)."
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
          "content": "### Inter-Tropical Discontinuity (ITD)\n\n1. Tropical Maritime (mT): South Atlantic moist south-westerly winds bringing heavy rainfall.\n2. Tropical Continental (cT): Sahara dry north-easterly winds bringing dry dusty Harmattan conditions.\n3. The annual migration of the ITD controls the wet and dry seasons across Nigeria and West Africa."
        },
        {
          "pageNumber": 2,
          "title": "Drainage Basins & River Niger Network",
          "content": "### Major Drainage Systems of Nigeria\n\nNigeria is drained by two primary river systems:\n1. **River Niger**: Enters Nigeria from the northwest through Kebbi State and flows southeast towards Lokoja.\n2. **River Benue**: Flows from the Cameroon Adamawa Highlands westwards to meet the Niger at Lokoja.\n3. The confluence at Lokoja forms a southern discharge into the Atlantic Ocean via the Niger Delta mangrove and freshwater swamplands."
        }
      ]
    }
  ]$json$::jsonb
)
ON CONFLICT (id) DO NOTHING;
`;
