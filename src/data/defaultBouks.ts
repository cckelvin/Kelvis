import { Bouk } from "../types";

export const DEFAULT_BOUKS: Bouk[] = [
  {
    id: "bouk-waec-neco-2000-2026",
    title: "WAEC & NECO 2000–2026 Comprehensive Past Questions & Step-by-Step Solutions",
    author: "West African Examinations Council & NECO Editorial Board",
    classification: "edu",
    categoryName: "Education & Exam Preparation",
    gradeLevel: "Senior Secondary (SS1–SS3) / WAEC / NECO / UTME",
    coverGradient: "from-amber-600 via-orange-600 to-red-700",
    description:
      "Official open-access past examination question archive spanning 2000 to 2026. Includes worked solutions, marking schemes, examiner commentary, and common pitfall analyses across Mathematics, English, Biology, Chemistry, Physics, and Economics.",
    rating: 4.9,
    readersCount: 48200,
    tags: ["WAEC", "NECO", "Past Questions", "Mathematics", "Physics", "Chemistry", "Biology", "English", "Economics", "2000-2026"],
    aiGuidance:
      "This book contains verified West African Examinations Council (WAEC) and National Examinations Council (NECO) senior secondary examination questions from 2000 to 2026. Use this to provide step-by-step mathematical proofs, chemical equations, biological diagrams, and English comprehension guides to students.",
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-08-15T12:00:00Z",
    chapters: [
      {
        id: "waec-ch1-math",
        chapterNumber: 1,
        title: "General Mathematics: Algebraic Processes, Trigonometry & Calculus",
        summary: "Core equations, quadratic formulas, simultaneous linear/non-linear systems, coordinate geometry, trigonometric ratios, differentiation, and integration.",
        pages: [
          {
            pageNumber: 1,
            title: "WAEC 2024 / 2025 General Mathematics Theory Paper 2 (Selected Problems)",
            content: `### WAEC General Mathematics Theory (Paper 2)

#### Question 1 (Algebra & Quadratic Optimization)
**Problem Statement:**
A trader purchased $x$ bags of rice for $\\text{₦}180,000$. If each bag had cost $\\text{₦}3,000$ less, he would have been able to purchase $2$ more bags with the same total amount.
1. Formulate a quadratic equation in terms of $x$.
2. Find the number of bags purchased ($x$).
3. Determine the original cost per bag.

---

#### Step-by-Step Worked Solution:
**Step 1: Express costs per bag algebraically**
- Original cost per bag:
  $$\\text{Cost}_1 = \\frac{180,000}{x}$$
- Reduced cost per bag (for $x + 2$ bags):
  $$\\text{Cost}_2 = \\frac{180,000}{x + 2}$$

Given that $\\text{Cost}_1 - \\text{Cost}_2 = 3,000$:
$$\\frac{180,000}{x} - \\frac{180,000}{x + 2} = 3,000$$

Divide the entire equation by $3,000$:
$$\\frac{60}{x} - \\frac{60}{x + 2} = 1$$

Multiply across by the common denominator $x(x + 2)$:
$$60(x + 2) - 60x = x(x + 2)$$
$$60x + 120 - 60x = x^2 + 2x$$
$$x^2 + 2x - 120 = 0$$

**Step 2: Solve the quadratic equation**
Factorizing:
$$(x + 12)(x - 10) = 0$$
Since number of bags must be positive ($x > 0$):
$$x = 10 \\text{ bags}$$

**Step 3: Original cost per bag**
$$\\text{Cost} = \\frac{\\text{₦}180,000}{10} = \\text{₦}18,000 \\text{ per bag}$$

> **Examiner Tip & Marking Scheme Note:**
> - 1 Mark for setting up cost expressions.
> - 2 Marks for algebraic simplification to standard quadratic form.
> - 2 Marks for factorizing and eliminating the negative root ($x = -12$).
> - 1 Mark for explicit unit inclusion ($\\text{₦}18,000$).`
          },
          {
            pageNumber: 2,
            title: "NECO 2023 / 2026 Trigonometry, Bearings & Elevation",
            content: `### NECO General Mathematics: Trigonometry & 3-Figure Bearings

#### Question 2 (Three-Figure Bearings & Sine/Cosine Rules)
**Problem Statement:**
A ship leaves port $P$ and sails on a bearing of $060^\\circ$ for a distance of $80\\text{ km}$ to point $Q$. From point $Q$, the ship changes course and sails on a bearing of $150^\\circ$ for $120\\text{ km}$ to point $R$.
1. Draw a neat, fully labelled sketch representing the journey.
2. Calculate the distance $|PR|$ correct to 2 decimal places.
3. Calculate the bearing of $R$ from $P$ correct to the nearest degree.

---

#### Step-by-Step Worked Solution:
**Step 1: Compute the Interior Angle $\\angle PQR$**
- Reverse bearing from $Q$ back to $P$:
  $$060^\\circ + 180^\\circ = 240^\\circ$$
- Bearing from $Q$ to $R = 150^\\circ$.
- Interior angle $\\theta = \\angle PQR = 240^\\circ - 150^\\circ = 90^\\circ$.
*(Since $\\angle PQR = 90^\\circ$, we can use Pythagoras Theorem or Cosine Rule).*

**Step 2: Calculate Distance $|PR|$ using Pythagoras**
$$|PR|^2 = |PQ|^2 + |QR|^2$$
$$|PR|^2 = (80)^2 + (120)^2 = 6400 + 14400 = 20800$$
$$|PR| = \\sqrt{20800} \\approx 144.22\\text{ km}$$

**Step 3: Calculate the Bearing of $R$ from $P$**
Let $\\alpha = \\angle QPR$:
$$\\tan \\alpha = \\frac{|QR|}{|PQ|} = \\frac{120}{80} = 1.5$$
$$\\alpha = \\arctan(1.5) = 56.31^\\circ$$

Bearing of $R$ from $P$:
$$\\text{Bearing} = 060^\\circ + 56.31^\\circ = 116.31^\\circ \\approx 116^\\circ$$

**Summary Result:**
- Distance $|PR| = 144.22\\text{ km}$
- Bearing of $R$ from $P = 116^\\circ$`
          }
        ]
      },
      {
        id: "waec-ch2-physics",
        chapterNumber: 2,
        title: "Physics: Mechanics, Waves, Electromagnetism & Modern Physics",
        summary: "Newton's laws of motion, projectile dynamics, Doppler effect, refraction/reflection, electromagnetic induction, radioactivity and photoelectric effect.",
        pages: [
          {
            pageNumber: 3,
            title: "WAEC Physics Paper 2: Projectile Motion & Energy Conservation",
            content: `### WAEC Physics: Projectiles & Mechanics

#### Question 1 (Projectile at an Angle to the Horizontal)
**Problem Statement:**
A projectile is fired with an initial velocity of $u = 40\\text{ m/s}$ at an angle of $\\theta = 30^\\circ$ to the horizontal ground. Taking $g = 9.8\\text{ m/s}^2$ (or $10\\text{ m/s}^2$ as specified):
1. Find the time of flight $T$.
2. Calculate the maximum height $H$ reached above the ground.
3. Compute the horizontal range $R$.

---

#### Comprehensive Solution ($g = 10\\text{ m/s}^2$):
1. **Time of Flight ($T$):**
   $$T = \\frac{2u \\sin \\theta}{g} = \\frac{2(40) \\sin(30^\\circ)}{10} = \\frac{80 \\times 0.5}{10} = 4.0\\text{ seconds}$$

2. **Maximum Height ($H$):**
   $$H = \\frac{u^2 \\sin^2 \\theta}{2g} = \\frac{(40)^2 (0.5)^2}{2(10)} = \\frac{1600 \\times 0.25}{20} = \\frac{400}{20} = 20.0\\text{ meters}$$

3. **Horizontal Range ($R$):**
   $$R = \\frac{u^2 \\sin(2\\theta)}{g} = \\frac{(40)^2 \\sin(60^\\circ)}{10} = \\frac{1600 \\times 0.8660}{10} = 138.56\\text{ meters}$$

---

#### Key Formula Summary Sheet for WAEC/NECO Physics:
| Physical Quantity | Formula | Units |
|---|---|---|
| Time of flight ($T$) | $T = \\frac{2u\\sin\\theta}{g}$ | $\\text{seconds (s)}$ |
| Maximum height ($H$) | $H = \\frac{u^2\\sin^2\\theta}{2g}$ | $\\text{meters (m)}$ |
| Horizontal range ($R$) | $R = \\frac{u^2\\sin 2\\theta}{g}$ | $\\text{meters (m)}$ |
| Max range angle | $\\theta = 45^\\circ \\implies R_{max} = \\frac{u^2}{g}$ | $\\text{meters (m)}$ |`
          }
        ]
      },
      {
        id: "waec-ch3-chem",
        chapterNumber: 3,
        title: "Chemistry: Stoichiometry, Organic Reaction Mechanisms & Electrochemistry",
        summary: "Mole concept calculations, redox equations, Faraday's laws of electrolysis, hydrocarbon IUPAC nomenclature, and qualitative analytical tests.",
        pages: [
          {
            pageNumber: 4,
            title: "NECO / WAEC Chemistry: Electrolysis & Faraday's Laws",
            content: `### WAEC / NECO Chemistry: Electrochemistry & Quantitative Analysis

#### Faraday's Second Law of Electrolysis
**Problem Statement:**
An electric current of $2.5\\text{ A}$ is passed through an aqueous solution of copper(II) tetraoxosulphate(VI) ($\\text{CuSO}_4$) for $30\\text{ minutes}$ using platinum electrodes.
Calculate:
1. The quantity of electricity passed ($Q$).
2. The mass of copper deposited at the cathode.
*(Molar mass of $\\text{Cu} = 63.5\\text{ g/mol}$, $1\\text{ Faraday} = 96,500\\text{ C/mol}$)*

---

#### Worked Solution:
**Step 1: Calculate Total Charge ($Q$)**
$$t = 30\\text{ mins} \\times 60 = 1800\\text{ seconds}$$
$$Q = I \\times t = 2.5\\text{ A} \\times 1800\\text{ s} = 4500\\text{ Coulombs}$$

**Step 2: Cathode Half-Reaction**
$$\\text{Cu}^{2+}_{(\\text{aq})} + 2e^- \\longrightarrow \\text{Cu}_{(\\text{s})}$$
From stoichiometry: $2\\text{ moles of electrons } (2F) = 2 \\times 96,500\\text{ C} = 193,000\\text{ C}$ deposits $1\\text{ mole of Cu } (63.5\\text{ g})$.

**Step 3: Mass of Copper ($m$)**
$$m = \\frac{M \\times Q}{n \\times F} = \\frac{63.5 \\times 4500}{2 \\times 96,500} = \\frac{285,750}{193,000} \\approx 1.48\\text{ g}$$

**Cathode Product:** Pure copper metal deposited ($1.48\\text{ g}$).
**Anode Product:** Oxygen gas ($O_2$) evolved: $4OH^- \\to 2H_2O + O_2 + 4e^-$.`
          }
        ]
      }
    ]
  },
  {
    id: "bouk-geography-africa-world",
    title: "Complete African & Global Geography Knowledge Bouk",
    author: "Dr. A. O. Balogun & African Cartography Society",
    classification: "geo",
    categoryName: "Geography & Earth Sciences",
    gradeLevel: "Secondary, University & General Reference",
    coverGradient: "from-emerald-700 via-teal-800 to-cyan-900",
    description:
      "A comprehensive open-access treatise on physical, human, and economic geography with specific emphasis on West Africa, Sub-Saharan river basins, climatic patterns, geomorphology, mineral corridors, and GIS map reading.",
    rating: 4.8,
    readersCount: 31900,
    tags: ["Geography", "Africa", "Climatology", "River Niger", "Geomorphology", "Landforms", "GIS", "Natural Resources"],
    aiGuidance:
      "This knowledge base contains rigorous physical and human geography data for Africa and the world. Use this to explain climatic seasons, the Inter-Tropical Discontinuity (ITD), monsoon circulation, landform formation (insulbergs, rift valleys, volcanic calderas), and mineral distributions.",
    createdAt: "2026-02-14T09:00:00Z",
    updatedAt: "2026-08-15T12:00:00Z",
    chapters: [
      {
        id: "geo-ch1-climate",
        chapterNumber: 1,
        title: "Climatology: The West African Monsoon & Inter-Tropical Discontinuity (ITD)",
        summary: "Atmospheric pressure belts, Northeast Trade Winds (Harmattan), Southwest Monsoon winds, seasonal rainfall distribution, and vegetation belts.",
        pages: [
          {
            pageNumber: 1,
            title: "The Mechanics of West African Seasons & Air Masses",
            content: `### The Inter-Tropical Discontinuity (ITD) & West African Climate

West African weather and climate are primarily governed by the seasonal oscillation of the **Inter-Tropical Discontinuity (ITD)**, the boundary zone separating two major contrasting air masses:

1. **Tropical Maritime (mT) Air Mass:**
   - **Source:** South Atlantic Ocean.
   - **Characteristics:** Warm, moisture-laden, and unstable.
   - **Wind Direction:** Southwest Monsoon winds.
   - **Effect:** Brings prolonged convectional rains, thunderstorms, and cloudiness across coastal and inland regions.

2. **Tropical Continental (cT) Air Mass:**
   - **Source:** Sahara Desert.
   - **Characteristics:** Dry, dusty, and stable.
   - **Wind Direction:** Northeast Trade Winds (the *Harmattan*).
   - **Effect:** Induces low relative humidity, hazy skies, cold nights, and high diurnal temperature ranges.

---

### Seasonal Migration of the ITD
- **July / August:** The ITD reaches its northernmost latitude (around $20^\\circ\\text{N}$ to $22^\\circ\\text{N}$). Nearly the entire West African sub-region falls under the maritime air mass, producing the rainy season peak.
- **January:** The ITD retreats southwards to around $4^\\circ\\text{N}$ to $6^\\circ\\text{N}$ near the Guinea Coast, bringing dry Harmattan conditions to the interior.

#### Vegetation & Rainfall Belts (South to North in West Africa):
1. **Mangrove Swamp Forest:** Rainfall $> 2500\\text{ mm/year}$ (Niger Delta, coastal lagoons).
2. **Tropical Rainforest:** Rainfall $1500 - 2500\\text{ mm/year}$ (Dense multi-canopy trees, epiphytes).
3. **Guinea Savanna:** Rainfall $1000 - 1500\\text{ mm/year}$ (Tall grasses, oil palms, locust beans).
4. **Sudan Savanna:** Rainfall $600 - 1000\\text{ mm/year}$ (Feather grasses, acacia, baobab trees).
5. **Sahel Savanna & Semi-Desert:** Rainfall $< 500\\text{ mm/year}$ (Short thorny shrubs, date palms).`
          },
          {
            pageNumber: 2,
            title: "Hydrology: The River Niger & Major African River Basins",
            content: `### African Hydrography: The Great River Niger System

The **River Niger** is the third-longest river in Africa ($4,180\\text{ km}$), characterized by an extraordinary crescent-shaped course that defied European cartographers for centuries:

#### Key Characteristics & Course:
1. **Source:** Fouta Djallon highlands in Guinea, only $240\\text{ km}$ inland from the Atlantic Ocean.
2. **Course:** Runs northeast away from the sea into the arid Sahara border (Mali), creating the **Inner Niger Delta** (a vast wetland network of lakes and marshes around Mopti and Timbuktu).
3. **The Great Bend:** Curves southeast past Niamey (Niger), forms part of the Benin border, traverses Nigeria, meets the **River Benue** at Lokoja (*the Confluence City*), and drains into the Atlantic Ocean via the massive **Niger Delta** petroleum province.

#### The Dual Flood Regime:
- **Black Flood (Upper Niger Flood):** Originates from heavy rains in the Guinea highlands during July–September. It travels slowly through the flat Inner Niger Delta, reaching Nigeria between December and February with clear, sediment-filtered water.
- **White Flood (Local Flood):** Caused by local monsoon rains in Nigeria during August–October, heavily silt-laden (turbid white appearance).

#### Hydroelectric Power (HEP) Infrastructure:
- **Kainji Dam (Nigeria):** Commissioned in 1968, generating up to $760\\text{ MW}$.
- **Jebba Dam & Shiroro Dam (on River Kaduna):** Integral components of the West African power grid.`
          }
        ]
      },
      {
        id: "geo-ch2-landforms",
        chapterNumber: 2,
        title: "Geomorphology: Landforms of Volcanism, Folding & Weathering",
        summary: "Plutonic intrusive features (batholiths, dykes, sills), volcanic cones, fold mountains, inselbergs, pediplains, and karst limestone topography.",
        pages: [
          {
            pageNumber: 3,
            title: "Inselbergs, Bornhardts & Tropical Weathering Landscapes",
            content: `### Tropical Landforms: Inselbergs, Kopjes & Bornhardts

An **inselberg** (*German for 'island mountain'*) is an isolated rock hill, ridge, or small mountain that rises abruptly from a virtually level surrounding plain (*pediplain*).

#### Classification of Inselbergs:
1. **Bornhardts (Domed Inselbergs):**
   - Massive, bare granite or gneiss domes with steep, convex slopes.
   - Formed through deep chemical weathering under humid paleo-climates followed by stripping of the saprolite regolith (*two-stage etching model*).
   - Prominent examples: **Zuma Rock** (Niger State, Nigeria), **Aso Rock** (Abuja), and **Sugarloaf Mountain** (Rio de Janeiro).

2. **Castle Kopjes (Tors):**
   - Angular, blocky towers of granite boulders formed where joint density is high.
   - As vertical and horizontal joints widen due to hydrolysis and freeze-thaw/thermal expansion, corestones are exposed as perched boulder stacks.`
          }
        ]
      }
    ]
  },
  {
    id: "bouk-computer-science-ai",
    title: "Modern Computer Science, Software Architecture & AI Engineering",
    author: "Kelvis Open Source Tech Initiative",
    classification: "tech",
    categoryName: "Technology & Software Engineering",
    gradeLevel: "Undergraduate / Professional Developer",
    coverGradient: "from-blue-700 via-indigo-800 to-purple-900",
    description:
      "A rigorous, modern curriculum in computer systems, algorithms, distributed system architecture, relational & vector databases, deep learning transformer attention mechanisms, and production cloud operations.",
    rating: 4.9,
    readersCount: 54100,
    tags: ["Computer Science", "Algorithms", "AI", "Transformers", "Distributed Systems", "PostgreSQL", "Full-Stack"],
    aiGuidance:
      "This technical book details low-level and high-level software engineering concepts. Use this to generate clean algorithms, explain Big-O space/time complexities, design distributed systems, and implement transformer self-attention mechanisms.",
    createdAt: "2026-03-01T10:00:00Z",
    updatedAt: "2026-08-15T14:00:00Z",
    chapters: [
      {
        id: "cs-ch1-algorithms",
        chapterNumber: 1,
        title: "Data Structures & Algorithmic Complexity",
        summary: "Big-O notation, binary search trees, heap priority queues, graph traversal (Dijkstra/A*), and dynamic programming paradigms.",
        pages: [
          {
            pageNumber: 1,
            title: "Mastering Asymptotic Analysis & Dynamic Programming",
            content: `### Dynamic Programming: From Recursion to Optimal Substructure

Dynamic Programming (DP) optimizes recursive problems exhibiting **overlapping subproblems** and **optimal substructure**.

#### Example: 0/1 Knapsack Problem
Given $n$ items, each with weight $w_i$ and value $v_i$, and a knapsack of capacity $W$:

$$\\text{DP}[i][w] = \\max(\\text{DP}[i-1][w], \\text{DP}[i-1][w - w_i] + v_i)$$

\`\`\`typescript
// Optimal O(n * W) 1D Array Space Dynamic Programming
export function knapsack01(weights: number[], values: number[], capacity: number): number {
  const n = weights.length;
  const dp = new Array(capacity + 1).fill(0);

  for (let i = 0; i < n; i++) {
    const w = weights[i];
    const v = values[i];
    // Iterate backwards to avoid reusing the same item in 0/1 Knapsack
    for (let c = capacity; c >= w; c--) {
      dp[c] = Math.max(dp[c], dp[c - w] + v);
    }
  }

  return dp[capacity];
}
\`\`\`

#### Big-O Complexity Comparison Table:
| Algorithm | Best Case | Average Case | Worst Case | Space Complexity |
|---|---|---|---|---|
| QuickSort | $O(n \\log n)$ | $O(n \\log n)$ | $O(n^2)$ | $O(\\log n)$ |
| MergeSort | $O(n \\log n)$ | $O(n \\log n)$ | $O(n \\log n)$ | $O(n)$ |
| Dijkstra (Min-Heap) | $O((V + E) \\log V)$ | $O((V + E) \\log V)$ | $O((V + E) \\log V)$ | $O(V)$ |
| Binary Search | $O(1)$ | $O(\\log n)$ | $O(\\log n)$ | $O(1)$ |`
          },
          {
            pageNumber: 2,
            title: "Transformer Architecture & Self-Attention Equations",
            content: `### The Mathematical Core of Large Language Models (LLMs)

The core mechanism of modern generative AI is **Scaled Dot-Product Attention**:

$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right) V$$

Where:
- $Q \\in \\mathbb{R}^{n \\times d_k}$ is the Query matrix.
- $K \\in \\mathbb{R}^{m \\times d_k}$ is the Key matrix.
- $V \\in \\mathbb{R}^{m \\times d_v}$ is the Value matrix.
- $\\sqrt{d_k}$ is the scaling factor preventing gradient saturation in softmax.

#### Multi-Head Attention:
$$\\text{MultiHead}(Q, K, V) = \\text{Concat}(\\text{head}_1, \\dots, \\text{head}_h) W^O$$
$$\\text{head}_i = \\text{Attention}(Q W_i^Q, K W_i^K, V W_i^V)$$`
          }
        ]
      }
    ]
  },
  {
    id: "bouk-applied-business-economics",
    title: "Applied Business, Macroeconomics & African Market Strategy",
    author: "Lagos & Nairobi Institute of Economic Research",
    classification: "business",
    categoryName: "Business, Economics & Finance",
    gradeLevel: "Professional & Academic",
    coverGradient: "from-amber-700 via-yellow-800 to-stone-900",
    description:
      "Foundational and modern economic principles tailored to emerging African markets, foreign exchange dynamics, fiscal decentralization, fintech venture capital, and SME scaling strategies.",
    rating: 4.7,
    readersCount: 22400,
    tags: ["Business", "Economics", "Fintech", "Venture Capital", "Inflation", "Banking", "Africa"],
    aiGuidance:
      "This book covers economics, financial valuation, and business strategy in African economies. Use this to explain monetary policy, exchange rate unification, DCF models, and venture business models.",
    createdAt: "2026-03-12T11:00:00Z",
    updatedAt: "2026-08-15T15:00:00Z",
    chapters: [
      {
        id: "biz-ch1-macro",
        chapterNumber: 1,
        title: "Macroeconomic Policy, Inflation & Exchange Rate Dynamics",
        summary: "Monetary policy transmission, Central Bank reserve management, inflation targeting, and currency valuation mechanisms.",
        pages: [
          {
            pageNumber: 1,
            title: "Exchange Rate Regimes & Inflation Transmission",
            content: `### Macroeconomics in Emerging Markets

#### The Quantity Theory of Money (Fisher Equation)
$$M \\cdot V = P \\cdot Y$$
Where:
- $M$: Money Supply
- $V$: Velocity of Money Circulation
- $P$: General Price Level (Inflation Index)
- $Y$: Real Gross Domestic Product (Output)

#### Policy Instruments of Central Banks:
1. **Monetary Policy Rate (MPR):** Benchmark interest rate setting the cost of commercial borrowing.
2. **Cash Reserve Ratio (CRR):** Minimum percentage of customer deposits banks must hold with the Central Bank.
3. **Open Market Operations (OMO):** Sale and purchase of government Treasury Bills to manage liquidity.`
          }
        ]
      }
    ]
  }
];
