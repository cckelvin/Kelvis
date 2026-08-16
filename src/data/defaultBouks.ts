import { Bouk } from "../types";

export const DEFAULT_BOUKS: Bouk[] = [
  {
    id: "a0000001-0000-0000-0000-000000000001",
    title: "WAEC & NECO 2000–2026 Mathematics Past Questions & Solutions",
    author: "West African Examinations Council & NECO Editorial Board",
    classification: "edu",
    categoryName: "Education & Exam Preparation",
    gradeLevel: "Senior Secondary / WASSCE / SSCE",
    coverGradient: "from-amber-600 via-orange-600 to-red-700",
    description:
      "Complete compilation of WAEC & NECO Mathematics theory and objective past questions spanning 2000 to 2026 with step-by-step HTML workings, geometric proofs, and marking schemes.",
    rating: 4.95,
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-08-15T12:00:00Z",
    page_1: `<div class="space-y-4">
      <div class="border-b border-amber-500/20 pb-3">
        <span class="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-500/30">WAEC 2024 / 2025 Theory Paper 2</span>
        <h2 class="text-xl font-extrabold text-slate-900 dark:text-zinc-100 mt-2">Problem 1: Algebraic Optimization & Quadratic Modeling</h2>
      </div>
      <div class="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50 text-sm">
        <p class="font-semibold text-slate-800 dark:text-zinc-200">Question Statement:</p>
        <p class="mt-1 text-slate-700 dark:text-zinc-300">A trader purchased <em>x</em> bags of rice for <strong>₦180,000</strong>. If each bag had cost <strong>₦3,000</strong> less, he would have been able to purchase <strong>2</strong> more bags with the same total amount.</p>
        <ul class="list-disc list-inside mt-2 space-y-1 text-slate-600 dark:text-zinc-400 text-xs">
          <li>(i) Formulate a quadratic equation in terms of <em>x</em>.</li>
          <li>(ii) Calculate the total number of bags purchased (<em>x</em>).</li>
          <li>(iii) Find the original cost per bag.</li>
        </ul>
      </div>
      <div class="space-y-3">
        <h3 class="font-bold text-sm text-slate-900 dark:text-zinc-100">Step-by-Step Marking Scheme Solution:</h3>
        <div class="p-3.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 font-mono text-xs text-slate-800 dark:text-zinc-200 space-y-1.5 border border-slate-200 dark:border-zinc-700">
          <div>Original cost per bag = 180,000 / x</div>
          <div>Reduced cost per bag = 180,000 / (x + 2)</div>
          <div>Difference: (180,000 / x) - (180,000 / (x + 2)) = 3,000</div>
          <div>Divide by 3,000: (60 / x) - (60 / (x + 2)) = 1</div>
          <div>Multiply by x(x + 2): 60(x + 2) - 60x = x(x + 2)</div>
          <div>Standard Form: x² + 2x - 120 = 0</div>
          <div>Factorize: (x + 12)(x - 10) = 0</div>
          <div>Since x > 0, <strong>x = 10 bags</strong></div>
          <div>Original Cost = ₦180,000 / 10 = <strong>₦18,000 per bag</strong></div>
        </div>
      </div>
    </div>`,
    page_2: `<div class="space-y-4">
      <div class="border-b border-amber-500/20 pb-3">
        <span class="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-500/30">NECO 2023 / 2026 Paper 2</span>
        <h2 class="text-xl font-extrabold text-slate-900 dark:text-zinc-100 mt-2">Problem 2: Non-Linear Simultaneous Equations</h2>
      </div>
      <div class="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200 dark:border-zinc-700 text-sm">
        <p class="font-semibold text-slate-800 dark:text-zinc-200">Solve simultaneously for x and y:</p>
        <div class="font-mono text-sm mt-2 pl-3 border-l-2 border-amber-500 space-y-0.5">
          <div>(1) x + y = 5</div>
          <div>(2) x² + y² = 13</div>
        </div>
      </div>
      <div class="space-y-2 text-sm text-slate-700 dark:text-zinc-300">
        <p><strong>Step 1:</strong> From (1), express <em>y</em> in terms of <em>x</em>: <code>y = 5 - x</code>.</p>
        <p><strong>Step 2:</strong> Substitute into (2):</p>
        <div class="p-3 rounded-xl bg-slate-100 dark:bg-zinc-800 font-mono text-xs">
          x² + (5 - x)² = 13<br/>
          x² + 25 - 10x + x² = 13<br/>
          2x² - 10x + 12 = 0 &rarr; x² - 5x + 6 = 0<br/>
          (x - 2)(x - 3) = 0
        </div>
        <p><strong>Step 3:</strong> Solutions: <strong>(x=2, y=3)</strong> or <strong>(x=3, y=2)</strong>.</p>
      </div>
    </div>`,
    page_3: `<div class="space-y-4">
      <div class="border-b border-amber-500/20 pb-3">
        <span class="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-500/30">WAEC Trigonometry</span>
        <h2 class="text-xl font-extrabold text-slate-900 dark:text-zinc-100 mt-2">Problem 3: Three-Figure Bearings & Distances</h2>
      </div>
      <div class="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50 text-sm">
        <p class="text-slate-800 dark:text-zinc-200">A ship leaves port P on bearing <strong>060°</strong> for 80 km to Q. From Q, it sails on bearing <strong>150°</strong> for 120 km to point R. Calculate:</p>
        <ul class="list-disc list-inside mt-1 text-xs text-slate-600 dark:text-zinc-400">
          <li>1. The interior angle &ang;PQR</li>
          <li>2. Distance |PR| correct to 2 decimal places</li>
        </ul>
      </div>
      <div class="p-3.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 font-mono text-xs space-y-1.5">
        <div>Reverse bearing of Q to P = 060° + 180° = 240°</div>
        <div>Interior angle &ang;PQR = 240° - 150° = 90°</div>
        <div>Using Pythagoras: |PR|² = 80² + 120² = 6400 + 14400 = 20800</div>
        <div>|PR| = &radic;20800 &approx; <strong>144.22 km</strong></div>
      </div>
    </div>`,
    page_4: `<div class="space-y-4">
      <div class="border-b border-amber-500/20 pb-3">
        <span class="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-500/30">Calculus & Graphs</span>
        <h2 class="text-xl font-extrabold text-slate-900 dark:text-zinc-100 mt-2">Problem 4: Differentiation & Stationary Points</h2>
      </div>
      <div class="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200 dark:border-zinc-700 text-sm">
        <p class="text-slate-800 dark:text-zinc-200">Find the stationary points for <code>y = 2x³ - 9x² + 12x - 5</code> and determine their nature.</p>
      </div>
      <div class="space-y-2 text-sm">
        <p>1. First Derivative: <code>dy/dx = 6x² - 18x + 12 = 0</code></p>
        <p>2. Divide by 6: <code>x² - 3x + 2 = 0</code> &rarr; <code>(x - 1)(x - 2) = 0</code> &rarr; <strong>x = 1, x = 2</strong>.</p>
        <p>3. Second Derivative: <code>d²y/dx² = 12x - 18</code></p>
        <ul class="list-disc list-inside text-xs text-slate-600 dark:text-zinc-400 pl-2">
          <li>At x = 1: d²y/dx² = -6 &lt; 0 (<strong>Local Maximum at (1, 0)</strong>)</li>
          <li>At x = 2: d²y/dx² = +6 &gt; 0 (<strong>Local Minimum at (2, -1)</strong>)</li>
        </ul>
      </div>
    </div>`
  },
  {
    id: "a0000002-0000-0000-0000-000000000002",
    title: "Geography of Nigeria & West African Physical Terrain",
    author: "Dr. A. O. Balogun & African Cartography Society",
    classification: "geo",
    categoryName: "Geography & Earth Sciences",
    gradeLevel: "Senior Secondary / WAEC / Tertiary",
    coverGradient: "from-emerald-700 via-teal-800 to-cyan-900",
    description:
      "Comprehensive geographical analysis of Nigeria and West Africa with HTML formatted drainage maps, climate belts, vegetation zones, and mineral distributions.",
    rating: 4.90,
    createdAt: "2026-01-15T08:00:00Z",
    updatedAt: "2026-08-15T12:00:00Z",
    page_1: `<div class="space-y-4">
      <div class="border-b border-emerald-500/20 pb-3">
        <span class="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-500/30">Hydrology & Rivers</span>
        <h2 class="text-xl font-extrabold text-slate-900 dark:text-zinc-100 mt-2">Major Drainage Systems & River Niger Basin</h2>
      </div>
      <div class="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 text-sm">
        <p class="text-slate-800 dark:text-zinc-200">Nigeria is drained by two primary river systems that meet at <strong>Lokoja</strong> to form a majestic confluence.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div class="p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700">
          <h4 class="font-bold text-emerald-600 text-sm mb-1">River Niger (4,180 km)</h4>
          <p class="text-slate-600 dark:text-zinc-300">Enters Nigeria in the northwest from Kebbi, flows through Kainji and Jebba HEP dams to Lokoja.</p>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700">
          <h4 class="font-bold text-emerald-600 text-sm mb-1">River Benue (1,400 km)</h4>
          <p class="text-slate-600 dark:text-zinc-300">Rises in the Cameroon Adamawa plateau, flowing west across Yola and Makurdi into Lokoja.</p>
        </div>
      </div>
      <div class="p-3 rounded-xl bg-slate-100 dark:bg-zinc-800/80 text-xs text-slate-700 dark:text-zinc-300">
        <strong>The Niger Delta:</strong> Spans over 70,000 km², creating an extensive mangrove swamp network before entering the Atlantic Ocean.
      </div>
    </div>`,
    page_2: `<div class="space-y-4">
      <div class="border-b border-emerald-500/20 pb-3">
        <span class="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-500/30">Climatology & Meteorology</span>
        <h2 class="text-xl font-extrabold text-slate-900 dark:text-zinc-100 mt-2">The West African Monsoon & ITD</h2>
      </div>
      <div class="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200 dark:border-zinc-700 text-sm">
        <h3 class="font-bold mb-1">The Inter-Tropical Discontinuity (ITD)</h3>
        <p class="text-slate-700 dark:text-zinc-300">The ITD is the oscillating boundary where two contrasting air masses meet:</p>
      </div>
      <div class="space-y-2 text-xs">
        <div class="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50">
          <strong class="text-blue-600 text-sm">1. Tropical Maritime (mT) Air Mass:</strong>
          <p class="mt-0.5 text-slate-600 dark:text-zinc-300">Originates over the South Atlantic Ocean, bringing warm, moisture-laden southwesterly winds and rain.</p>
        </div>
        <div class="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50">
          <strong class="text-amber-600 text-sm">2. Tropical Continental (cT) Air Mass:</strong>
          <p class="mt-0.5 text-slate-600 dark:text-zinc-300">Originates over the Sahara Desert, bringing dry, dusty northeasterly Harmattan winds.</p>
        </div>
      </div>
    </div>`,
    page_3: `<div class="space-y-4">
      <div class="border-b border-emerald-500/20 pb-3">
        <span class="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-500/30">Biogeography</span>
        <h2 class="text-xl font-extrabold text-slate-900 dark:text-zinc-100 mt-2">Vegetation Belts of Nigeria</h2>
      </div>
      <div class="space-y-2 text-xs">
        <div class="p-2.5 border-l-4 border-emerald-600 bg-slate-50 dark:bg-zinc-800 rounded-r-xl">
          <strong class="text-slate-900 dark:text-zinc-100">1. Mangrove & Freshwater Swamps:</strong> Coastal states (Bayelsa, Rivers, Delta, Lagos) with heavy year-round rainfall.
        </div>
        <div class="p-2.5 border-l-4 border-green-600 bg-slate-50 dark:bg-zinc-800 rounded-r-xl">
          <strong class="text-slate-900 dark:text-zinc-100">2. Lowland Rainforest:</strong> Dense canopy, timber, oil palm, cocoa (Ondo, Ogun, Edo, Cross River).
        </div>
        <div class="p-2.5 border-l-4 border-lime-600 bg-slate-50 dark:bg-zinc-800 rounded-r-xl">
          <strong class="text-slate-900 dark:text-zinc-100">3. Guinea & Sudan Savannah:</strong> Tall grasses, acacia trees, grains (sorghum, millet, maize), and livestock rearing.
        </div>
        <div class="p-2.5 border-l-4 border-amber-600 bg-slate-50 dark:bg-zinc-800 rounded-r-xl">
          <strong class="text-slate-900 dark:text-zinc-100">4. Sahel Savannah:</strong> Semi-arid fringe in extreme northern borders (Borno, Yobe, Sokoto).
        </div>
      </div>
    </div>`,
    page_4: `<div class="space-y-4">
      <div class="border-b border-emerald-500/20 pb-3">
        <span class="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-500/30">Economic Geology</span>
        <h2 class="text-xl font-extrabold text-slate-900 dark:text-zinc-100 mt-2">Mineral Resources & Industrial Belts</h2>
      </div>
      <table class="w-full text-xs text-left border-collapse border border-slate-300 dark:border-zinc-700">
        <thead class="bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200">
          <tr>
            <th class="p-2 border border-slate-300 dark:border-zinc-700">Mineral</th>
            <th class="p-2 border border-slate-300 dark:border-zinc-700">Major Deposits</th>
            <th class="p-2 border border-slate-300 dark:border-zinc-700">Economic Role</th>
          </tr>
        </thead>
        <tbody class="text-slate-700 dark:text-zinc-300">
          <tr>
            <td class="p-2 border border-slate-300 dark:border-zinc-700 font-semibold">Crude Oil & Gas</td>
            <td class="p-2 border border-slate-300 dark:border-zinc-700">Niger Delta, Offshore</td>
            <td class="p-2 border border-slate-300 dark:border-zinc-700">Primary national revenue</td>
          </tr>
          <tr>
            <td class="p-2 border border-slate-300 dark:border-zinc-700 font-semibold">Lithium & Tantalite</td>
            <td class="p-2 border border-slate-300 dark:border-zinc-700">Nasarawa, Kwara, Kaduna</td>
            <td class="p-2 border border-slate-300 dark:border-zinc-700">Battery manufacture</td>
          </tr>
          <tr>
            <td class="p-2 border border-slate-300 dark:border-zinc-700 font-semibold">Tin & Columbite</td>
            <td class="p-2 border border-slate-300 dark:border-zinc-700">Jos Plateau</td>
            <td class="p-2 border border-slate-300 dark:border-zinc-700">Alloy engineering</td>
          </tr>
          <tr>
            <td class="p-2 border border-slate-300 dark:border-zinc-700 font-semibold">Limestone</td>
            <td class="p-2 border border-slate-300 dark:border-zinc-700">Ewekoro, Gboko, Obajana</td>
            <td class="p-2 border border-slate-300 dark:border-zinc-700">Cement production</td>
          </tr>
        </tbody>
      </table>
    </div>`
  }
];
