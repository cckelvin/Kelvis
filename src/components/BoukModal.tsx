import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  BookOpen,
  Plus,
  Sparkles,
  Database,
  Copy,
  Check,
  GraduationCap,
  Globe,
  Code,
  TrendingUp,
  Layers,
  Star,
  Trash2,
  RefreshCw,
  ChevronRight,
  FileCode
} from "lucide-react";
import { Bouk, BoukClassification } from "../types";
import { DEFAULT_BOUKS } from "../data/defaultBouks";
import { BOUK_SUPABASE_SQL } from "../data/boukSupabaseSchema";
import { fetchSupabaseBouks, saveSupabaseBouk, deleteSupabaseBouk } from "../lib/supabaseSync";
import { BoukReader } from "./BoukReader";

interface BoukModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskKelvis?: (prompt: string) => void;
}

export const BoukModal: React.FC<BoukModalProps> = ({
  isOpen,
  onClose,
  onAskKelvis,
}) => {
  const [bouks, setBouks] = useState<Bouk[]>(() => {
    const saved = localStorage.getItem("kelvis_bouks_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_BOUKS;
      }
    }
    return DEFAULT_BOUKS;
  });

  const [activeTab, setActiveTab] = useState<"library" | "create" | "sql">("library");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassification, setSelectedClassification] = useState<string>("all");
  const [readingBouk, setReadingBouk] = useState<Bouk | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // New Book Form State (1 to 100 HTML Pages)
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newClassification, setNewClassification] = useState<BoukClassification>("edu");
  const [newCategoryName, setNewCategoryName] = useState("Education & Exam Prep");
  const [newGradeLevel, setNewGradeLevel] = useState("WAEC / NECO / High School");
  const [newDescription, setNewDescription] = useState("");
  const [activePageEditNum, setActivePageEditNum] = useState<number>(1);
  const [pagesHtmlState, setPagesHtmlState] = useState<Record<number, string>>({
    1: `<div class="space-y-4">
  <h2 class="text-xl font-bold text-amber-600">Chapter 1: Overview & Fundamental Concepts</h2>
  <div class="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-sm">
    <p>Welcome to this open-access book. Use native HTML tags such as headings, tables, grids, and lists to design rich educational pages.</p>
  </div>
</div>`,
  });

  // Save to LocalStorage whenever bouks change
  useEffect(() => {
    localStorage.setItem("kelvis_bouks_v2", JSON.stringify(bouks));
  }, [bouks]);

  // Load from Supabase on mount
  useEffect(() => {
    if (isOpen) {
      handleSyncSupabase();
    }
  }, [isOpen]);

  const handleSyncSupabase = async () => {
    setIsSyncing(true);
    try {
      const dbBouks = await fetchSupabaseBouks();
      if (dbBouks && dbBouks.length > 0) {
        const mergedMap = new Map<string, Bouk>();
        DEFAULT_BOUKS.forEach((b) => mergedMap.set(b.id, b));
        dbBouks.forEach((b) => mergedMap.set(b.id, b));
        setBouks(Array.from(mergedMap.values()));
      }
    } catch (e) {
      console.warn("Notice: Supabase syncing failed, using local storage:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  // Filter books
  const filteredBouks = bouks.filter((b) => {
    const matchesSearch =
      searchQuery === "" ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClassification =
      selectedClassification === "all" || b.classification === selectedClassification;

    return matchesSearch && matchesClassification;
  });

  const handleCopySql = () => {
    navigator.clipboard.writeText(BOUK_SUPABASE_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCreateBouk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAuthor.trim()) return;

    const gradients = [
      "from-amber-600 via-orange-600 to-red-700",
      "from-emerald-700 via-teal-800 to-cyan-900",
      "from-blue-700 via-indigo-800 to-purple-900",
      "from-rose-600 via-pink-700 to-purple-900",
      "from-cyan-600 via-blue-700 to-indigo-900",
    ];
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

    const newBouk: Bouk = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      author: newAuthor.trim(),
      classification: newClassification,
      categoryName: newCategoryName.trim() || "General",
      gradeLevel: newGradeLevel.trim() || "Open Access",
      coverGradient: randomGradient,
      description: newDescription.trim() || "An open access knowledge book.",
      rating: 5.0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Assign all edited page_1 to page_100 HTML strings
    Object.entries(pagesHtmlState).forEach(([pageNumStr, htmlContent]) => {
      const pNum = Number(pageNumStr);
      if (pNum >= 1 && pNum <= 100 && htmlContent.trim()) {
        newBouk[`page_${pNum}`] = htmlContent.trim();
      }
    });

    const updated = [newBouk, ...bouks];
    setBouks(updated);
    setActiveTab("library");

    // Try saving to Supabase if connected
    await saveSupabaseBouk(newBouk);

    // Reset form
    setNewTitle("");
    setNewAuthor("");
    setNewDescription("");
    setPagesHtmlState({
      1: `<div class="space-y-4">
  <h2 class="text-xl font-bold text-amber-600">Chapter 1: Overview</h2>
  <p>Start writing your HTML content for Page 1.</p>
</div>`,
    });
  };

  const handleDeleteBouk = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to remove this Bouk?")) {
      setBouks(bouks.filter((b) => b.id !== id));
      await deleteSupabaseBouk(id);
    }
  };

  // If reading mode is active, show the Reader view
  if (readingBouk) {
    return (
      <BoukReader
        bouk={readingBouk}
        onClose={() => setReadingBouk(null)}
        onAskAI={onAskKelvis}
      />
    );
  }

  const classificationsList = [
    { id: "all", label: "All Bouks", icon: BookOpen },
    { id: "edu", label: "🎓 Education & WAEC/NECO", icon: GraduationCap },
    { id: "geo", label: "🌍 Geography & Earth", icon: Globe },
    { id: "tech", label: "💻 Tech & Code", icon: Code },
    { id: "business", label: "📈 Business & Econ", icon: TrendingUp },
    { id: "science", label: "🔬 Science & Math", icon: Sparkles },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 select-none">
      <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-3xl w-full max-w-5xl h-[92vh] max-h-[850px] shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-zinc-900/50">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-slate-900 dark:text-zinc-100 tracking-tight">
                  .Bouk
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Open Access Ebooks (100 HTML Pages)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 hidden sm:block">
                Open-access books with individual HTML page columns (1 to 100)
              </p>
            </div>
          </div>

          {/* Navigation Tabs & Close */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-slate-200/80 dark:bg-zinc-800 p-1 rounded-2xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab("library")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === "library"
                    ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                }`}
              >
                Browse Books
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className={`px-3 py-1.5 rounded-xl flex items-center space-x-1 transition-all cursor-pointer ${
                  activeTab === "create"
                    ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Publish Bouk</span>
              </button>
              <button
                onClick={() => setActiveTab("sql")}
                className={`px-3 py-1.5 rounded-xl flex items-center space-x-1 transition-all cursor-pointer ${
                  activeTab === "sql"
                    ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                }`}
              >
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                <span>Supabase SQL</span>
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

        {/* Content Tabs */}
        {activeTab === "library" && (
          <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
            {/* Search Bar & Classification Filter */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search books by title, author, topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2.5 bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 transition-all"
                />
              </div>

              <button
                onClick={handleSyncSupabase}
                disabled={isSyncing}
                className="flex items-center space-x-1.5 px-3 py-2.5 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-amber-500" : ""}`} />
                <span>{isSyncing ? "Syncing..." : "Sync Database"}</span>
              </button>
            </div>

            {/* Classification Filters */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 shrink-0 no-scrollbar">
              {classificationsList.map((item) => {
                const isSelected = selectedClassification === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedClassification(item.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 ${
                      isSelected
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Books Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              {filteredBouks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="p-4 rounded-3xl bg-slate-100 dark:bg-zinc-800 text-slate-400 mb-3">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200">No .Bouks Found</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm">
                    No books matched your filter criteria. Try searching with different keywords or create a new Bouk.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                  {filteredBouks.map((bouk) => {
                    // Count available pages
                    let pageCount = 0;
                    for (let i = 1; i <= 100; i++) {
                      if (bouk[`page_${i}`] && String(bouk[`page_${i}`]).trim() !== "") {
                        pageCount++;
                      }
                    }

                    return (
                      <div
                        key={bouk.id}
                        onClick={() => setReadingBouk(bouk)}
                        className="group bg-slate-50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700/60 hover:border-amber-500/50 rounded-3xl p-4 flex flex-col justify-between shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden"
                      >
                        {/* Top Gradient Banner */}
                        <div
                          className={`h-24 rounded-2xl bg-gradient-to-r ${bouk.coverGradient || "from-amber-600 via-orange-600 to-red-700"} p-3 flex flex-col justify-between text-white shadow-inner mb-3 relative overflow-hidden`}
                        >
                          <div className="flex items-center justify-between z-10">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-black/30 backdrop-blur-xs">
                              {bouk.categoryName}
                            </span>
                            <div className="flex items-center space-x-1 text-amber-300 text-xs font-bold bg-black/30 px-1.5 py-0.5 rounded-md">
                              <Star className="w-3 h-3 fill-amber-300" />
                              <span>{bouk.rating || 5.0}</span>
                            </div>
                          </div>

                          <div className="z-10 flex items-center justify-between">
                            <span className="text-[11px] font-medium text-white/90 truncate max-w-[180px]">
                              {bouk.gradeLevel || "Open Access"}
                            </span>
                            <span className="text-[11px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded-md">
                              {pageCount > 0 ? `${pageCount} Pages` : "100 Pages"}
                            </span>
                          </div>

                          {/* Decorative Background Pattern */}
                          <div className="absolute -right-4 -bottom-4 opacity-10 text-white pointer-events-none">
                            <BookOpen className="w-24 h-24" />
                          </div>
                        </div>

                        {/* Title & Author */}
                        <div className="space-y-1.5 mb-3">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 line-clamp-2 group-hover:text-amber-600 transition-colors">
                            {bouk.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-1">
                            By {bouk.author}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-zinc-300 line-clamp-2 pt-1">
                            {bouk.description}
                          </p>
                        </div>

                        {/* Footer Info */}
                        <div className="pt-3 border-t border-slate-200/80 dark:border-zinc-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                          <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                            <span>Open HTML Book</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>

                          <button
                            onClick={(e) => handleDeleteBouk(bouk.id, e)}
                            className="p-1 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition"
                            title="Delete Book"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create / Publish Bouk Tab */}
        {activeTab === "create" && (
          <form onSubmit={handleCreateBouk} className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Publish a New .Bouk</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Author open-access books with up to 100 HTML pages stored directly as column data.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Book Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WAEC 2000–2026 Biology Theory & Practical Prep"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-2xl text-xs text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Author / Publisher *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Teachers Association of Nigeria"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-2xl text-xs text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Classification</label>
                <select
                  value={newClassification}
                  onChange={(e) => setNewClassification(e.target.value as BoukClassification)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-2xl text-xs text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:border-amber-500"
                >
                  <option value="edu">🎓 Education & WAEC/NECO</option>
                  <option value="geo">🌍 Geography & Earth Sciences</option>
                  <option value="tech">💻 Tech & Computer Science</option>
                  <option value="business">📈 Business & Economics</option>
                  <option value="science">🔬 Pure & Applied Sciences</option>
                  <option value="humanities">🏛️ Humanities & History</option>
                  <option value="general">📚 General Knowledge</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Grade / Target Level</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Secondary / WASSCE / SSCE / UTME"
                  value={newGradeLevel}
                  onChange={(e) => setNewGradeLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-2xl text-xs text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Short Description</label>
              <textarea
                rows={2}
                placeholder="Describe what this book covers, key curriculum topics, past question years, etc."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-2xl text-xs text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            {/* 100 HTML Pages Section */}
            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-zinc-700 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center space-x-1.5">
                    <FileCode className="w-4 h-4 text-amber-600" />
                    <span>Author HTML Pages (1 to 100)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Each page corresponds to a column in your Supabase table (<code>page_1</code> to <code>page_100</code>).
                  </p>
                </div>

                {/* Page Selector Pill */}
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Editing Page:</label>
                  <select
                    value={activePageEditNum}
                    onChange={(e) => setActivePageEditNum(Number(e.target.value))}
                    className="px-2.5 py-1 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-amber-600 focus:outline-hidden"
                  >
                    {Array.from({ length: 100 }, (_, i) => i + 1).map((p) => (
                      <option key={p} value={p}>
                        Page {p} {pagesHtmlState[p]?.trim() ? "•" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Page {activePageEditNum} HTML Content</span>
                  <span className="text-[11px] font-normal text-slate-500">Supports standard HTML tags, CSS classes, tables & styling</span>
                </label>
                <textarea
                  rows={8}
                  value={pagesHtmlState[activePageEditNum] || ""}
                  onChange={(e) =>
                    setPagesHtmlState({
                      ...pagesHtmlState,
                      [activePageEditNum]: e.target.value,
                    })
                  }
                  placeholder={`<div class="space-y-4">\n  <h2 class="text-xl font-bold text-amber-600">Page ${activePageEditNum} Title</h2>\n  <p>Write your educational or past question content here in HTML format.</p>\n</div>`}
                  className="w-full font-mono text-xs px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-2xl text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("library")}
                className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-2xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition cursor-pointer"
              >
                Publish .Bouk
              </button>
            </div>
          </form>
        )}

        {/* Supabase SQL Tab */}
        {activeTab === "sql" && (
          <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center space-x-2">
                  <Database className="w-5 h-5 text-emerald-500" />
                  <span>Supabase SQL Script (100 HTML Pages as Columns)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Single SQL code defining the <code>bouks</code> table with <code>page_1</code> to <code>page_100</code> HTML columns, RLS policies, and seeded past examination bouks.
                </p>
              </div>

              <button
                onClick={handleCopySql}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer shrink-0"
              >
                {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? "Copied SQL!" : "Copy SQL Script"}</span>
              </button>
            </div>

            <div className="flex-1 bg-slate-900 text-slate-100 rounded-3xl p-4 overflow-y-auto font-mono text-xs border border-slate-800 shadow-inner">
              <pre className="whitespace-pre-wrap">{BOUK_SUPABASE_SQL}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
