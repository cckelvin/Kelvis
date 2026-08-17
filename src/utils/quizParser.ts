import { QuizPayload, QuizQuestion, QuizOption } from "../types";

/**
 * Detect if user prompt is requesting to build/code an app, platform, or feature
 */
export function isCodingPrompt(prompt: string): boolean {
  if (!prompt) return false;
  const p = prompt.toLowerCase();
  
  // Exclude simple questions or direct answers
  if (p.startsWith("quiz answers") || p.startsWith("🎯") || p.includes("submitted answers")) {
    return false;
  }

  return (
    /\b(code|build|create|develop|make|program|design|scaffold|implement|generate)\b/i.test(p) &&
    /\b(platform|app|website|web app|dashboard|chat|chatting|store|ecommerce|sales|sale|shop|shopping|portfolio|calculator|todo|tracker|saas|landing page|interface|ui|system|clone|game|service|tool|component|amazon|jumia)\b/i.test(p)
  );
}

/**
 * Generate an interactive architecture & design specification quiz when a user asks to code something
 */
export function generateCodingSpecificationQuiz(prompt: string): QuizPayload {
  const p = prompt.toLowerCase();
  let appName = "Application";
  let specificQuestions: QuizQuestion[] = [];

  if (p.includes("chat") || p.includes("chatting") || p.includes("messaging")) {
    appName = "Chatting & Messaging Platform";
    specificQuestions = [
      {
        id: 1,
        question: "What visual identity & design aesthetic should we use for your chatting platform?",
        allowCustomAnswer: true,
        options: [
          { id: "A", text: "Modern Minimalist (Clean slate tones, subtle borders, high-contrast readable text)" },
          { id: "B", text: "Cyberpunk / Discord Dark (Deep obsidian canvas, neon emerald/purple accents, compact density)" },
          { id: "C", text: "Warm Editorial & Research (Soft off-white canvas, serif headers, muted jade accents)" },
          { id: "D", text: "Custom style / visual requirements (type below)...", isCustom: true },
        ],
      },
      {
        id: 2,
        question: "Which messaging features and real-time interactive capabilities are needed?",
        allowCustomAnswer: true,
        options: [
          { id: "A", text: "Live Typing Indicators, Message Reactions & Threaded Replies" },
          { id: "B", text: "Rich Media Previews, Code Block Highlighting & File Attachments" },
          { id: "C", text: "Channel/Rooms Sidebar, Voice Notes & Active User Presence" },
          { id: "D", text: "Custom messaging features (type below)...", isCustom: true },
        ],
      },
      {
        id: 3,
        question: "How should messages be managed and stored?",
        allowCustomAnswer: true,
        options: [
          { id: "A", text: "Real-time client state with localStorage persistence & export" },
          { id: "B", text: "Simulated WebSockets with multi-user instant bot responses" },
          { id: "C", text: "Full multi-channel directory with message search & attachments" },
          { id: "D", text: "Custom storage / architecture (type below)...", isCustom: true },
        ],
      },
    ];
  } else if (
    p.includes("sale") ||
    p.includes("sales") ||
    p.includes("ecommerce") ||
    p.includes("shop") ||
    p.includes("store") ||
    p.includes("amazon") ||
    p.includes("jumia") ||
    p.includes("marketplace")
  ) {
    appName = "E-Commerce & Sales Platform";
    specificQuestions = [
      {
        id: 1,
        question: "What brand style and market benchmark should we model this sales platform after?",
        allowCustomAnswer: true,
        options: [
          { id: "A", text: "Amazon / Jumia High-Utility (Dark Blue / Midnight Navy theme, search bar, category grids, flash deals)" },
          { id: "B", text: "Shopify / ASOS Modern Luxury (Sleek cards, gold/amber accents, high-res galleries, filter pills)" },
          { id: "C", text: "Minimalist Direct-to-Consumer (Clean white/zinc canvas, sticky add-to-cart, customer reviews)" },
          { id: "D", text: "Custom theme & benchmark (e.g. I'm using dark blue theme, custom branding)...", isCustom: true },
        ],
      },
      {
        id: 2,
        question: "Which core buyer capabilities and product details should be included?",
        allowCustomAnswer: true,
        options: [
          { id: "A", text: "Product cards with price, discount tags, description, 5-star ratings & verified customer reviews" },
          { id: "B", text: "Live interactive cart drawer with quantity counters, coupon code discounts & order total math" },
          { id: "C", text: "Complete shopping workflow: Discover page, search/filter, quick preview modal & simulated checkout receipt" },
          { id: "D", text: "Custom buyer features & requirements (type below)...", isCustom: true },
        ],
      },
      {
        id: 3,
        question: "What navigation and discovery structure should we generate in the folders?",
        allowCustomAnswer: true,
        options: [
          { id: "A", text: "Modular multi-page structure (public/index.html, src/pages/discover.html, styles/theme.css, src/app.js)" },
          { id: "B", text: "Single-Page Application (SPA) with responsive tabs, instant category switching & live cart" },
          { id: "C", text: "Full marketplace with product detail modal, review submission & mock order tracking" },
          { id: "D", text: "Custom directory / page layout (type below)...", isCustom: true },
        ],
      },
    ];
  } else if (p.includes("dashboard") || p.includes("analytics") || p.includes("crm")) {
    appName = "Analytics & Management Dashboard";
    specificQuestions = [
      {
        id: 1,
        question: "What dashboard layout and density best suits your data?",
        allowCustomAnswer: true,
        options: [
          { id: "A", text: "Executive Overview (KPI metric stat cards, trend sparklines, collapsible sidebar)" },
          { id: "B", text: "Dense Data Grid (Sortable/filterable tables, export buttons, status badges)" },
          { id: "C", text: "Interactive Charts First (Area curves, candlestick charts, breakdown donuts)" },
          { id: "D", text: "Custom dashboard layout (type below)...", isCustom: true },
        ],
      },
      {
        id: 2,
        question: "What color scheme and visual theme do you prefer?",
        allowCustomAnswer: true,
        options: [
          { id: "A", text: "Sleek Dark Mode (Zinc-900 canvas, emerald/cyan accents, glow borders)" },
          { id: "B", text: "Clean Corporate Light (Crisp slate-50 canvas, indigo accents, subtle drop shadows)" },
          { id: "C", text: "High-Contrast Glassmorphism (Translucent blur panels, vibrant gradients)" },
          { id: "D", text: "Custom color scheme (type below)...", isCustom: true },
        ],
      },
      {
        id: 3,
        question: "What interactive data controls are required?",
        allowCustomAnswer: true,
        options: [
          { id: "A", text: "Date range picker (Today / 7D / 30D / 1Y) with live data refresh" },
          { id: "B", text: "Create/Edit modal dialogs with form validation" },
          { id: "C", text: "CSV/JSON Export & realtime notification alerts" },
          { id: "D", text: "Custom controls (type below)...", isCustom: true },
        ],
      },
    ];
  } else {
    appName = prompt.slice(0, 32) || "Web Project";
    specificQuestions = [
      {
        id: 1,
        question: `What visual style & aesthetic do you prefer for this ${appName}?`,
        allowCustomAnswer: true,
        options: [
          { id: "A", text: "Modern Minimalist (High contrast, clean typography, responsive layout)" },
          { id: "B", text: "Sleek Dark Atmosphere (Deep charcoal/zinc, glowing accents, smooth transitions)" },
          { id: "C", text: "Vibrant & Interactive (Playful color pops, card hover micro-animations)" },
          { id: "D", text: "Custom visual style (type below)...", isCustom: true },
        ],
      },
      {
        id: 2,
        question: "What core interactive functionality should be prioritized?",
        allowCustomAnswer: true,
        options: [
          { id: "A", text: "Full CRUD workflow with responsive modals and client-side data state" },
          { id: "B", text: "Rich data visualizer with dynamic filtering, search & export features" },
          { id: "C", text: "Interactive wizard with step-by-step guidance & live progress feedback" },
          { id: "D", text: "Custom functional requirements (type below)...", isCustom: true },
        ],
      },
      {
        id: 3,
        question: "What file architecture and layout do you prefer?",
        allowCustomAnswer: true,
        options: [
          { id: "A", text: "Modular multi-file layout (public/index.html, styles/main.css, src/app.js)" },
          { id: "B", text: "Self-contained single page application with embedded styles and logic" },
          { id: "C", text: "Component-driven layout with separate utility modules and JSON data models" },
          { id: "D", text: "Custom architecture (type below)...", isCustom: true },
        ],
      },
    ];
  }

  return {
    title: `${appName} — Interactive Blueprint`,
    topic: appName,
    isCodingSpecification: true,
    questions: specificQuestions,
  };
}

/**
 * Extract an embedded JSON quiz block from markdown text
 */
export function extractQuizFromText(text: string): QuizPayload | null {
  if (!text) return null;

  // Regex to match ```quiz ... ``` or ```json-quiz ... ``` or ```json with questions
  const quizBlockRegex = /```(?:quiz|json-quiz|json)\s*\n([\s\S]*?)\n```/i;
  const match = quizBlockRegex.exec(text);

  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return {
          title: parsed.title || "Interactive Assessment",
          topic: parsed.topic || "Knowledge Check",
          isCodingSpecification: parsed.isCodingSpecification,
          questions: parsed.questions.map((q: any, idx: number) => ({
            id: q.id || idx + 1,
            question: q.question || "Question",
            options: (q.options || []).map((opt: any) => ({
              id: String(opt.id || opt.key || "A"),
              text: String(opt.text || opt.label || opt),
              isCustom: Boolean(opt.isCustom || opt.id === "CUSTOM" || String(opt.id).toUpperCase() === "CUSTOM"),
            })),
            correctOptionId: q.correctOptionId || q.answer,
            explanation: q.explanation,
            allowCustomAnswer: Boolean(q.allowCustomAnswer || (q.options && q.options.some((o: any) => o.isCustom || o.id === "CUSTOM"))),
          })),
        };
      }
    } catch (e) {
      // Invalid JSON, return null
    }
  }

  return null;
}

/**
 * Fallback dynamic quiz generator for educational/informational topics
 */
export function createTopicQuickQuiz(topic: string, bodyText: string): QuizPayload {
  const cleanTopic = topic.slice(0, 40).replace(/[#*`_]/g, "").trim() || "Topic Overview";
  
  return {
    title: `${cleanTopic} — Knowledge Check`,
    topic: cleanTopic,
    questions: [
      {
        id: 1,
        question: `Based on the explanation of ${cleanTopic}, which statement best describes its core purpose?`,
        options: [
          { id: "A", text: "It establishes the foundational concepts and primary architecture." },
          { id: "B", text: "It handles secondary fallback operations only." },
          { id: "C", text: "It replaces all existing legacy standard implementations." },
          { id: "D", text: "Custom perspective / notes...", isCustom: true },
        ],
        correctOptionId: "A",
        explanation: `The core purpose of ${cleanTopic} is to establish fundamental principles and structural efficiency.`,
      },
      {
        id: 2,
        question: "What is the primary benefit or operational advantage discussed?",
        options: [
          { id: "A", text: "Improved responsiveness, modular clarity, and reduced error rates." },
          { id: "B", text: "Increased computational overhead with complex dependencies." },
          { id: "C", text: "Strict deprecation of all browser compatibility standards." },
          { id: "D", text: "Custom consideration / requirement...", isCustom: true },
        ],
        correctOptionId: "A",
        explanation: "Modular structure and clear patterns minimize errors and ensure responsive user experiences.",
      },
    ],
  };
}
