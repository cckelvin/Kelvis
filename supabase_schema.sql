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
-- 5. .BOUK (OPEN ACCESS EBOOKS - 100 HTML PAGES AS COLUMNS)
-- =====================================================================
DROP TABLE IF EXISTS public.bouks CASCADE;

CREATE TABLE public.bouks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN ('edu', 'tech', 'business', 'science', 'geo', 'humanities', 'general')),
  category_name TEXT NOT NULL DEFAULT 'Education',
  grade_level TEXT DEFAULT 'Open Access',
  cover_image TEXT,
  cover_gradient TEXT DEFAULT 'from-amber-600 via-orange-600 to-red-700',
  description TEXT NOT NULL,
  rating NUMERIC(3, 2) DEFAULT 5.00,
  page_1 TEXT,
  page_2 TEXT,
  page_3 TEXT,
  page_4 TEXT,
  page_5 TEXT,
  page_6 TEXT,
  page_7 TEXT,
  page_8 TEXT,
  page_9 TEXT,
  page_10 TEXT,
  page_11 TEXT,
  page_12 TEXT,
  page_13 TEXT,
  page_14 TEXT,
  page_15 TEXT,
  page_16 TEXT,
  page_17 TEXT,
  page_18 TEXT,
  page_19 TEXT,
  page_20 TEXT,
  page_21 TEXT,
  page_22 TEXT,
  page_23 TEXT,
  page_24 TEXT,
  page_25 TEXT,
  page_26 TEXT,
  page_27 TEXT,
  page_28 TEXT,
  page_29 TEXT,
  page_30 TEXT,
  page_31 TEXT,
  page_32 TEXT,
  page_33 TEXT,
  page_34 TEXT,
  page_35 TEXT,
  page_36 TEXT,
  page_37 TEXT,
  page_38 TEXT,
  page_39 TEXT,
  page_40 TEXT,
  page_41 TEXT,
  page_42 TEXT,
  page_43 TEXT,
  page_44 TEXT,
  page_45 TEXT,
  page_46 TEXT,
  page_47 TEXT,
  page_48 TEXT,
  page_49 TEXT,
  page_50 TEXT,
  page_51 TEXT,
  page_52 TEXT,
  page_53 TEXT,
  page_54 TEXT,
  page_55 TEXT,
  page_56 TEXT,
  page_57 TEXT,
  page_58 TEXT,
  page_59 TEXT,
  page_60 TEXT,
  page_61 TEXT,
  page_62 TEXT,
  page_63 TEXT,
  page_64 TEXT,
  page_65 TEXT,
  page_66 TEXT,
  page_67 TEXT,
  page_68 TEXT,
  page_69 TEXT,
  page_70 TEXT,
  page_71 TEXT,
  page_72 TEXT,
  page_73 TEXT,
  page_74 TEXT,
  page_75 TEXT,
  page_76 TEXT,
  page_77 TEXT,
  page_78 TEXT,
  page_79 TEXT,
  page_80 TEXT,
  page_81 TEXT,
  page_82 TEXT,
  page_83 TEXT,
  page_84 TEXT,
  page_85 TEXT,
  page_86 TEXT,
  page_87 TEXT,
  page_88 TEXT,
  page_89 TEXT,
  page_90 TEXT,
  page_91 TEXT,
  page_92 TEXT,
  page_93 TEXT,
  page_94 TEXT,
  page_95 TEXT,
  page_96 TEXT,
  page_97 TEXT,
  page_98 TEXT,
  page_99 TEXT,
  page_100 TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for classification & fast lookup
CREATE INDEX IF NOT EXISTS idx_bouks_classification ON public.bouks(classification);
CREATE INDEX IF NOT EXISTS idx_bouks_created_at ON public.bouks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bouks_title ON public.bouks(title);

-- Enable RLS for Bouks
ALTER TABLE public.bouks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view all bouks" ON public.bouks;
CREATE POLICY "Public can view all bouks" 
  ON public.bouks FOR SELECT 
  TO public 
  USING (true);

DROP POLICY IF EXISTS "Anyone can publish bouks" ON public.bouks;
CREATE POLICY "Anyone can publish bouks" 
  ON public.bouks FOR INSERT 
  TO public 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update bouks" ON public.bouks;
CREATE POLICY "Anyone can update bouks" 
  ON public.bouks FOR UPDATE 
  TO public 
  USING (true);

DROP POLICY IF EXISTS "Anyone can delete bouks" ON public.bouks;
CREATE POLICY "Anyone can delete bouks" 
  ON public.bouks FOR DELETE 
  TO public 
  USING (true);

-- Seed initial WAEC/NECO & Geography Bouks with HTML formatted pages
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
  page_1,
  page_2,
  page_3,
  page_4
) VALUES 
(
  'a0000001-0000-0000-0000-000000000001',
  'WAEC & NECO 2000–2026 Mathematics Past Questions & Solutions',
  'WAEC Council & West African Math Teachers Guild',
  'edu',
  'Education & Exam Prep',
  'Senior Secondary / WASSCE / SSCE',
  'from-amber-600 via-orange-600 to-red-700',
  'Complete compilation of WAEC & NECO Mathematics theory and objective past questions spanning 2000 to 2026 with step-by-step HTML workings and marking schemes.',
  4.95,
  $html$<div class="bouk-page">
  <h2 class="text-xl font-bold text-amber-600 mb-2">WAEC Mathematics 2024 / 2025 Theory Paper 2</h2>
  <div class="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 mb-4">
    <h3 class="font-bold text-base mb-1">Problem 1: Algebraic Optimization & Quadratic Modeling</h3>
    <p class="text-sm">A trader purchased <em>x</em> bags of rice for <strong>₦180,000</strong>. If each bag had cost <strong>₦3,000</strong> less, he would have bought 2 more bags with the same amount.</p>
  </div>
  <h4 class="font-bold text-sm mb-2">Step-by-Step Marking Scheme Solution:</h4>
  <ol class="list-decimal list-inside space-y-2 text-sm">
    <li><strong>Formulate Equation:</strong> <code>180000/x - 180000/(x+2) = 3000</code></li>
    <li><strong>Simplify:</strong> Divide through by 3000 &rarr; <code>60/x - 60/(x+2) = 1</code></li>
    <li><strong>Quadratic form:</strong> <code>x² + 2x - 120 = 0</code></li>
    <li><strong>Factorize:</strong> <code>(x + 12)(x - 10) = 0</code></li>
    <li><strong>Final Result:</strong> <code>x = 10 bags</code> (Original cost = <strong>₦18,000 per bag</strong>)</li>
  </ol>
</div>$html$,
  $html$<div class="bouk-page">
  <h2 class="text-xl font-bold text-amber-600 mb-2">NECO 2023 / 2026: Simultaneous Non-Linear Equations</h2>
  <div class="p-4 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 mb-4">
    <h3 class="font-bold text-base mb-1">Problem 2: Linear and Quadratic Systems</h3>
    <p class="text-sm">Solve simultaneously for x and y:</p>
    <div class="font-mono text-sm mt-2 pl-3 border-l-2 border-amber-500">
      (1) x + y = 5<br/>
      (2) x² + y² = 13
    </div>
  </div>
  <h4 class="font-bold text-sm mb-2">Detailed Working:</h4>
  <p class="text-sm mb-2">From equation (1), express y: <code>y = 5 - x</code>.</p>
  <p class="text-sm mb-2">Substitute into (2): <code>x² + (5 - x)² = 13</code> &rarr; <code>2x² - 10x + 12 = 0</code> &rarr; <code>x² - 5x + 6 = 0</code>.</p>
  <p class="text-sm">Factoring gives <code>(x - 2)(x - 3) = 0</code>. Solutions: <strong>(x=2, y=3)</strong> and <strong>(x=3, y=2)</strong>.</p>
</div>$html$,
  $html$<div class="bouk-page">
  <h2 class="text-xl font-bold text-amber-600 mb-2">WAEC Trigonometry: 3-Figure Bearings & Distances</h2>
  <div class="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 mb-4">
    <p class="text-sm">A ship sails from port P on a bearing of <strong>060°</strong> for 80 km to Q, then on <strong>150°</strong> for 120 km to R. Find distance |PR|.</p>
  </div>
  <h4 class="font-bold text-sm mb-2">Workings:</h4>
  <p class="text-sm mb-2">Interior angle &ang;PQR = (060° + 180°) - 150° = 90°.</p>
  <p class="text-sm">Using Pythagoras theorem: <code>|PR|² = 80² + 120² = 6400 + 14400 = 20800</code> &rarr; <code>|PR| &approx; 144.22 km</code>.</p>
</div>$html$,
  $html$<div class="bouk-page">
  <h2 class="text-xl font-bold text-amber-600 mb-2">Calculus: Differentiation & Rates of Change</h2>
  <div class="p-4 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 mb-4">
    <p class="text-sm">Find the stationary points of the curve <code>y = 2x³ - 9x² + 12x - 5</code> and determine their nature.</p>
  </div>
  <p class="text-sm mb-2">Derivative: <code>dy/dx = 6x² - 18x + 12 = 0</code> &rarr; <code>x² - 3x + 2 = 0</code> &rarr; <code>x = 1</code> or <code>x = 2</code>.</p>
  <p class="text-sm">Second derivative <code>d²y/dx² = 12x - 18</code>: At x=1 (max), at x=2 (min).</p>
</div>$html$
),
(
  'a0000002-0000-0000-0000-000000000002',
  'Geography of Nigeria & West African Physical Terrain',
  'Dr. A. O. Balogun & African Cartography Society',
  'geo',
  'Geography & Earth Sciences',
  'Senior Secondary / WAEC / Tertiary',
  'from-emerald-700 via-teal-800 to-cyan-900',
  'Complete geographical analysis of Nigeria and West Africa with HTML formatted charts, drainage maps, climate belts, and minerals.',
  4.90,
  $html$<div class="bouk-page">
  <h2 class="text-xl font-bold text-emerald-600 mb-2">Major Drainage Systems & River Niger Basin</h2>
  <div class="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 mb-4">
    <p class="text-sm">Nigeria is drained by two primary river systems that confluence at Lokoja to form a Y-shaped discharge into the Atlantic Ocean.</p>
  </div>
  <ul class="list-disc list-inside space-y-2 text-sm">
    <li><strong>River Niger (4,180 km):</strong> Enters northwest through Kebbi State, flows through Kainji/Jebba dams to Lokoja.</li>
    <li><strong>River Benue (1,400 km):</strong> Originates in Cameroon Adamawa Highlands, flowing westward to Lokoja.</li>
    <li><strong>The Niger Delta:</strong> Expansive 70,000 km² wetland mangrove and petroleum-rich basin.</li>
  </ul>
</div>$html$,
  $html$<div class="bouk-page">
  <h2 class="text-xl font-bold text-emerald-600 mb-2">Climatology & The West African Monsoon</h2>
  <div class="p-4 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 mb-4">
    <h3 class="font-bold text-base mb-1">Inter-Tropical Discontinuity (ITD)</h3>
    <p class="text-sm">West African weather is governed by the oscillation of two contrasting air masses:</p>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
    <div class="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800">
      <h4 class="font-bold text-blue-600">Tropical Maritime (mT)</h4>
      <p class="text-xs mt-1">Originates from South Atlantic. Moist, rain-bearing southwest trade winds.</p>
    </div>
    <div class="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800">
      <h4 class="font-bold text-amber-600">Tropical Continental (cT)</h4>
      <p class="text-xs mt-1">Originates over Sahara Desert. Dry, dusty northeast Harmattan winds.</p>
    </div>
  </div>
</div>$html$,
  $html$<div class="bouk-page">
  <h2 class="text-xl font-bold text-emerald-600 mb-2">Vegetation Belts & Agricultural Zones</h2>
  <div class="space-y-3 text-sm">
    <p>From the coast to the northern border, Nigeria transitions across distinct vegetation belts:</p>
    <div class="p-2 border-l-4 border-emerald-600 bg-slate-50 dark:bg-zinc-800 pl-3">
      <strong>1. Mangrove & Freshwater Swamps:</strong> Coastal belt, high rainfall (>2500mm), fishing and timber.
    </div>
    <div class="p-2 border-l-4 border-green-600 bg-slate-50 dark:bg-zinc-800 pl-3">
      <strong>2. Tropical Rainforest:</strong> Cocoa, oil palm, rubber, timber (Ondo, Edo, Cross River).
    </div>
    <div class="p-2 border-l-4 border-lime-600 bg-slate-50 dark:bg-zinc-800 pl-3">
      <strong>3. Guinea & Sudan Savannah:</strong> Grains (millet, sorghum, maize), groundnuts, cattle rearing.
    </div>
  </div>
</div>$html$,
  $html$<div class="bouk-page">
  <h2 class="text-xl font-bold text-emerald-600 mb-2">Mineral Resources & Economic Geology</h2>
  <table class="w-full text-xs text-left border-collapse border border-slate-300 dark:border-zinc-700 mt-2">
    <thead class="bg-slate-100 dark:bg-zinc-800">
      <tr>
        <th class="p-2 border border-slate-300 dark:border-zinc-700">Mineral</th>
        <th class="p-2 border border-slate-300 dark:border-zinc-700">Major Locations</th>
        <th class="p-2 border border-slate-300 dark:border-zinc-700">Economic Use</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="p-2 border border-slate-300 dark:border-zinc-700 font-semibold">Crude Oil & Gas</td>
        <td class="p-2 border border-slate-300 dark:border-zinc-700">Niger Delta, Offshore</td>
        <td class="p-2 border border-slate-300 dark:border-zinc-700">Primary export revenue</td>
      </tr>
      <tr>
        <td class="p-2 border border-slate-300 dark:border-zinc-700 font-semibold">Solid Minerals / Lithium</td>
        <td class="p-2 border border-slate-300 dark:border-zinc-700">Nasarawa, Kaduna, Kwara</td>
        <td class="p-2 border border-slate-300 dark:border-zinc-700">EV batteries & energy</td>
      </tr>
      <tr>
        <td class="p-2 border border-slate-300 dark:border-zinc-700 font-semibold">Tin & Columbite</td>
        <td class="p-2 border border-slate-300 dark:border-zinc-700">Jos Plateau</td>
        <td class="p-2 border border-slate-300 dark:border-zinc-700">Alloys & metallurgy</td>
      </tr>
    </tbody>
  </table>
</div>$html$
)
ON CONFLICT (id) DO NOTHING;
