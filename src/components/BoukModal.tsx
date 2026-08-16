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
  Users,
  FileText,
  Trash2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  HelpCircle
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
    const saved = localStorage.getItem("kelvis_bouks");
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

  // New Book Form State
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newClassification, setNewClassification] = useState<BoukClassification>("edu");
  const [newCategoryName, setNewCategoryName] = useState("Education & Exam Prep");
  const [newGradeLevel, setNewGradeLevel] = useState("WAEC / NECO / High School");
  const [newDescription, setNewDescription] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newAiGuidance, setNewAiGuidance] = useState("");
  const [newChapterTitle, setNewChapterTitle] = useState("Chapter 1: Foundations & Past Questions");
  const [newPageTitle, setNewPageTitle] = useState("Page 1: Overview & Questions");
  const [newPageContent, setNewPageContent] = useState(
    "### Overview\n\nWrite your open access knowledge content, past questions, formulas, or study notes here in markdown format."
  );

  // Save to LocalStorage whenever bouks change
  useEffect(() => {
    localStorage.setItem("kelvis_bouks", JSON.stringify(bouks));
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
        // Merge Supabase books with default ones
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
      b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      b.chapters.some((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.pages.some((p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );

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
      readersCount: 1,
      tags: newTags.split(",").map((t) => t.trim()).filter(Boolean),
      aiGuidance: newAiGuidance.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chapters: [
        {
          id: `chap-${Date.now()}`,
          chapterNumber: 1,
          title: newChapterTitle.trim() || "Chapter 1",
          summary: "First chapter of this Bouk.",
          pages: [
            {
              pageNumber: 1,
              title: newPageTitle.trim() || "Page 1",
              content: newPageContent.trim(),
            },
          ],
        },
      ],
    };

    const updated = [newBouk, ...bouks];
    setBouks(updated);
    setActiveTab("library");

    // Try saving to Supabase if connected
    await saveSupabaseBouk(newBouk);

    // Reset form
    setNewTitle("");
    setNewAuthor("");
    setNewDescription("");
    setNewTags("");
    setNewAiGuidance("");
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
                  Open Access Books & AI Guidance
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 hidden sm:block">
                Open knowledge base for users & AI guidance (WAEC/NECO 2000–2026, Geography, Tech, Business)
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Bouks (e.g. WAEC 2024 Math, River Niger, Algorithms, Inflation)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-zinc-100 placeholder-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Sync Button */}
              <button
                onClick={handleSyncSupabase}
                disabled={isSyncing}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-2xl border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors shrink-0 cursor-pointer"
                title="Sync latest books from Supabase"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-amber-500" : ""}`} />
                <span>{isSyncing ? "Syncing..." : "Sync DB"}</span>
              </button>
            </div>

            {/* Classification Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 shrink-0 no-scrollbar">
              {classificationsList.map((item) => {
                const isSelected = selectedClassification === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedClassification(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Books Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              {filteredBouks.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl">
                  <BookOpen className="w-12 h-12 text-slate-300 dark:text-zinc-700 mb-3" />
                  <div className="font-bold text-slate-700 dark:text-zinc-300 text-sm mb-1">
                    No Bouks match your search
                  </div>
                  <div className="text-xs text-slate-400 max-w-sm">
                    Try searching for different keywords or click <strong>Publish Bouk</strong> to author a new open access book.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredBouks.map((bouk) => {
                    const totalPages = bouk.chapters.reduce(
                      (acc, chap) => acc + (chap.pages?.length || 0),
                      0
                    );

                    return (
                      <div
                        key={bouk.id}
                        onClick={() => setReadingBouk(bouk)}
                        className="group p-4 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 hover:border-amber-500 dark:hover:border-amber-500 transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between relative overflow-hidden"
                      >
                        {/* Book Top Ribbon / Category */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              {bouk.classification.toUpperCase()}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate">
                              {bouk.gradeLevel || "Open Access"}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1 text-amber-500 text-xs font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            <span>{bouk.rating || 5.0}</span>
                          </div>
                        </div>

                        {/* Title & Author */}
                        <div className="mb-3">
                          <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-sm leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                            {bouk.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">
                            By {bouk.author}
                          </p>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-600 dark:text-zinc-300 line-clamp-2 mb-4 leading-relaxed">
                          {bouk.description}
                        </p>

                        {/* Stats & Actions Footer */}
                        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                          <div className="flex items-center space-x-3 text-[11px]">
                            <span className="flex items-center space-x-1">
                              <Layers className="w-3.5 h-3.5 text-slate-400" />
                              <span>{bouk.chapters.length} Chaps</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              <span>{totalPages} Pages</span>
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            {/* Read Book Button */}
                            <span className="px-3 py-1 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs group-hover:bg-amber-500 dark:group-hover:bg-amber-500 dark:group-hover:text-white transition-colors flex items-center space-x-1">
                              <span>Read Bouk</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Bouk Tab */}
        {activeTab === "create" && (
          <form
            onSubmit={handleCreateBouk}
            className="flex-1 overflow-y-auto p-6 space-y-4"
          >
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Authoring Open Access .Bouk:</strong>
                <p className="mt-0.5 opacity-90">
                  Bouks are accessible to everyone and provide structured context to guide Kelvis AI in specialized fields (such as WAEC/NECO 2000–2026 past questions, Nigerian Geography, Software Engineering, Economics).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Bouk Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. WAEC Biology 2000-2026 Past Questions & Answers"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Author / Organization *
                </label>
                <input
                  type="text"
                  required
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="e.g. WAEC Council & Science Teachers"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Classification
                </label>
                <select
                  value={newClassification}
                  onChange={(e) => setNewClassification(e.target.value as BoukClassification)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="edu">Education / Exam Prep (edu)</option>
                  <option value="geo">Geography & Earth (geo)</option>
                  <option value="tech">Technology & Software (tech)</option>
                  <option value="business">Business & Economics (business)</option>
                  <option value="science">Sciences & Mathematics (science)</option>
                  <option value="humanities">Humanities & History (humanities)</option>
                  <option value="general">General Knowledge (general)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Grade / Target Level
                </label>
                <input
                  type="text"
                  value={newGradeLevel}
                  onChange={(e) => setNewGradeLevel(e.target.value)}
                  placeholder="e.g. WAEC / NECO / Senior Secondary"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Description & Overview
              </label>
              <textarea
                rows={2}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief summary of what this book covers..."
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                AI Guidance Prompt (Optional instructions for Kelvis AI)
              </label>
              <input
                type="text"
                value={newAiGuidance}
                onChange={(e) => setNewAiGuidance(e.target.value)}
                placeholder="e.g. Use this book to provide step-by-step WAEC marking scheme answers and diagrams..."
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-zinc-800">
              <h4 className="font-bold text-xs text-slate-800 dark:text-zinc-200 mb-2">
                Initial Chapter & Page 1 Content
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="Chapter Title"
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs"
                />
                <input
                  type="text"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="Page 1 Title"
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs"
                />
              </div>
              <textarea
                rows={6}
                value={newPageContent}
                onChange={(e) => setNewPageContent(e.target.value)}
                placeholder="Markdown content with questions, answers, formulas, or study guides..."
                className="w-full font-mono px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab("library")}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold shadow-xs hover:opacity-95 transition-opacity"
              >
                Publish .Bouk
              </button>
            </div>
          </form>
        )}

        {/* Supabase SQL Tab */}
        {activeTab === "sql" && (
          <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-sm">
                  Supabase Single SQL Script for .Bouk Storage
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Run this single SQL code in your Supabase SQL Editor to create the <code>bouks</code> table with RLS and sample data.
                </p>
              </div>
              <button
                onClick={handleCopySql}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold flex items-center space-x-1.5 shadow-xs hover:opacity-90 transition-opacity cursor-pointer shrink-0"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                    <span>Copied SQL!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Single SQL Code</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs leading-relaxed border border-slate-800 shadow-inner">
              <pre className="whitespace-pre-wrap break-words">{BOUK_SUPABASE_SQL}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
