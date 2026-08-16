import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Volume2,
  VolumeX,
  Type,
  Sun,
  Moon,
  Sparkles,
  Bookmark,
  Share2,
  Check,
  Search,
  List,
  Layers,
  ArrowLeft,
  FileText,
  HelpCircle,
  GraduationCap
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bouk, BoukChapter, BoukPage } from "../types";

interface BoukReaderProps {
  bouk: Bouk;
  initialChapterIndex?: number;
  initialPageIndex?: number;
  onClose: () => void;
  onAskAI?: (prompt: string) => void;
}

export const BoukReader: React.FC<BoukReaderProps> = ({
  bouk,
  initialChapterIndex = 0,
  initialPageIndex = 0,
  onClose,
  onAskAI,
}) => {
  const [currentChapterIdx, setCurrentChapterIdx] = useState(initialChapterIndex);
  const [currentPageIdx, setCurrentPageIdx] = useState(initialPageIndex);
  const [readingTheme, setReadingTheme] = useState<"light" | "sepia" | "dark">("light");
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg" | "xl">("base");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  // Flatten pages for total count calculation
  const allPages: { chapter: BoukChapter; page: BoukPage; chapIdx: number; pageIdx: number }[] = [];
  bouk.chapters.forEach((chap, cIdx) => {
    chap.pages.forEach((p, pIdx) => {
      allPages.push({ chapter: chap, page: p, chapIdx: cIdx, pageIdx: pIdx });
    });
  });

  const currentChapter = bouk.chapters[currentChapterIdx] || bouk.chapters[0];
  const currentPage = currentChapter?.pages[currentPageIdx] || currentChapter?.pages[0];

  // Current page absolute index (1-based)
  const currentGlobalIndex =
    allPages.findIndex(
      (item) => item.chapIdx === currentChapterIdx && item.pageIdx === currentPageIdx
    ) + 1;
  const totalGlobalPages = Math.max(allPages.length, 1);

  // Scroll to top whenever page changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    // Stop voice if speaking
    if (isSpeaking && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [currentChapterIdx, currentPageIdx]);

  // Handle previous page
  const handlePrevPage = () => {
    if (currentPageIdx > 0) {
      setCurrentPageIdx(currentPageIdx - 1);
    } else if (currentChapterIdx > 0) {
      const prevChapIdx = currentChapterIdx - 1;
      const prevChap = bouk.chapters[prevChapIdx];
      setCurrentChapterIdx(prevChapIdx);
      setCurrentPageIdx(Math.max(0, prevChap.pages.length - 1));
    }
  };

  // Handle next page
  const handleNextPage = () => {
    if (currentPageIdx < (currentChapter?.pages.length || 0) - 1) {
      setCurrentPageIdx(currentPageIdx + 1);
    } else if (currentChapterIdx < bouk.chapters.length - 1) {
      setCurrentChapterIdx(currentChapterIdx + 1);
      setCurrentPageIdx(0);
    }
  };

  const hasPrev = currentChapterIdx > 0 || currentPageIdx > 0;
  const hasNext =
    currentChapterIdx < bouk.chapters.length - 1 ||
    currentPageIdx < (currentChapter?.pages.length || 0) - 1;

  // Text-To-Speech
  const toggleSpeech = () => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const plainText = `${currentPage?.title || ""}. ${currentPage?.content?.replace(/[#*`$\\]/g, "") || ""}`;
      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Ask AI about this page
  const handleAskAIAboutPage = () => {
    if (!onAskAI || !currentPage) return;
    const prompt = `From the Bouk **"${bouk.title}"** (by ${bouk.author}), regarding **Chapter ${currentChapter?.chapterNumber}: ${currentChapter?.title}** - *Page ${currentPage.pageNumber}: ${currentPage.title}*:\n\n` +
      `Could you explain, solve, and provide comprehensive insights for the following content:\n\n` +
      `"""\n${currentPage.content}\n"""`;
    onAskAI(prompt);
    onClose();
  };

  // Share link / copy
  const handleShare = () => {
    navigator.clipboard.writeText(
      `Check out "${bouk.title}" on .Bouk Open Access Library!`
    );
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Theme Styles
  const themeClasses = {
    light: "bg-slate-50 text-slate-900",
    sepia: "bg-[#fbf0d9] text-[#433422]",
    dark: "bg-zinc-950 text-zinc-100",
  };

  const containerThemeClasses = {
    light: "bg-white border-slate-200 shadow-sm",
    sepia: "bg-[#f4e6c9] border-[#e1cfad] shadow-sm text-[#433422]",
    dark: "bg-zinc-900 border-zinc-800 shadow-xl",
  };

  const fontSizes = {
    sm: "text-sm leading-relaxed",
    base: "text-base leading-relaxed",
    lg: "text-lg leading-loose",
    xl: "text-xl leading-loose",
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col select-none transition-colors duration-200 ${themeClasses[readingTheme]}`}>
      {/* Top Reading Navigation Bar */}
      <header className="px-4 py-3 border-b flex items-center justify-between shrink-0 backdrop-blur-md bg-opacity-95 z-20 border-slate-200/40 dark:border-zinc-800/40">
        {/* Left: Back & TOC Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 hover:bg-black/5 dark:hover:bg-white/10 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Library</span>
          </button>

          <button
            onClick={() => setIsTocOpen(!isTocOpen)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              isTocOpen
                ? "bg-amber-500 text-white border-amber-600"
                : "border-slate-300 dark:border-zinc-700 hover:bg-black/5 dark:hover:bg-white/10"
            }`}
            title="Table of Contents"
          >
            <List className="w-4 h-4" />
            <span className="hidden md:inline">Contents</span>
          </button>
        </div>

        {/* Center: Title & Chapter */}
        <div className="text-center px-4 max-w-md sm:max-w-xl truncate">
          <div className="text-xs font-semibold opacity-70 truncate">
            {bouk.title}
          </div>
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 truncate">
            Ch {currentChapter?.chapterNumber}: {currentChapter?.title}
          </div>
        </div>

        {/* Right: Tools & Theme */}
        <div className="flex items-center space-x-1.5">
          {/* Read Aloud Button */}
          <button
            onClick={toggleSpeech}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isSpeaking
                ? "bg-amber-500 text-white border-amber-600 animate-pulse"
                : "border-slate-300 dark:border-zinc-700 hover:bg-black/5 dark:hover:bg-white/10"
            }`}
            title={isSpeaking ? "Stop Reading Aloud" : "Read Page Aloud (TTS)"}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Font Size Selector */}
          <div className="hidden sm:flex items-center border border-slate-300 dark:border-zinc-700 rounded-xl overflow-hidden text-xs">
            <button
              onClick={() => setFontSize("sm")}
              className={`px-2 py-1.5 font-bold ${fontSize === "sm" ? "bg-amber-500 text-white" : "hover:bg-black/5 dark:hover:bg-white/10"}`}
              title="Small text"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize("base")}
              className={`px-2 py-1.5 font-bold ${fontSize === "base" ? "bg-amber-500 text-white" : "hover:bg-black/5 dark:hover:bg-white/10"}`}
              title="Default text"
            >
              A
            </button>
            <button
              onClick={() => setFontSize("lg")}
              className={`px-2 py-1.5 font-bold ${fontSize === "lg" ? "bg-amber-500 text-white" : "hover:bg-black/5 dark:hover:bg-white/10"}`}
              title="Large text"
            >
              A+
            </button>
          </div>

          {/* Reading Theme Toggle */}
          <div className="flex items-center border border-slate-300 dark:border-zinc-700 rounded-xl overflow-hidden p-0.5">
            <button
              onClick={() => setReadingTheme("light")}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                readingTheme === "light" ? "bg-amber-500 text-white font-bold" : "hover:bg-black/5"
              }`}
              title="Clean Light Theme"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setReadingTheme("sepia")}
              className={`px-2 py-1 rounded-lg text-xs transition-colors font-serif ${
                readingTheme === "sepia" ? "bg-[#e5d4b3] text-[#433422] font-bold" : "hover:bg-black/5"
              }`}
              title="Sepia Book Paper Theme"
            >
              Sepia
            </button>
            <button
              onClick={() => setReadingTheme("dark")}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                readingTheme === "dark" ? "bg-zinc-800 text-zinc-100 font-bold" : "hover:bg-white/10"
              }`}
              title="Dark Obsidian Theme"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Ask Kelvis AI Button */}
          {onAskAI && (
            <button
              onClick={handleAskAIAboutPage}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-xs shadow-xs hover:opacity-95 transition-all cursor-pointer"
              title="Ask Kelvis AI to explain or solve this page"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask Kelvis</span>
            </button>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Table of Contents Drawer / Sidebar */}
        {isTocOpen && (
          <aside className="w-80 border-r border-slate-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-900 z-10 shadow-xl overflow-hidden shrink-0">
            <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="font-bold text-sm flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span>Table of Contents</span>
              </div>
              <button
                onClick={() => setIsTocOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {bouk.chapters.map((chap, cIdx) => (
                <div key={chap.id || cIdx} className="space-y-1">
                  <div className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider px-2 py-1">
                    Chapter {chap.chapterNumber}: {chap.title}
                  </div>
                  <div className="space-y-0.5 pl-2">
                    {chap.pages.map((p, pIdx) => {
                      const isCurrent =
                        cIdx === currentChapterIdx && pIdx === currentPageIdx;
                      return (
                        <button
                          key={p.id || pIdx}
                          onClick={() => {
                            setCurrentChapterIdx(cIdx);
                            setCurrentPageIdx(pIdx);
                            if (window.innerWidth < 768) setIsTocOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isCurrent
                              ? "bg-amber-500 text-white font-bold shadow-xs"
                              : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                          }`}
                        >
                          <span className="truncate pr-2">
                            {p.pageNumber}. {p.title}
                          </span>
                          <span className="text-[10px] opacity-70 shrink-0">
                            p.{p.pageNumber}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Reader Canvas (Centered Paper Layout) */}
        <main
          ref={contentRef}
          className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center selection:bg-amber-500/30"
        >
          <div
            className={`w-full max-w-3xl rounded-3xl p-6 sm:p-12 transition-colors duration-200 border ${containerThemeClasses[readingTheme]}`}
          >
            {/* Page Header Metadata */}
            <div className="border-b border-black/10 dark:border-white/10 pb-4 mb-6 flex flex-wrap items-center justify-between gap-2 text-xs opacity-75">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {bouk.classification.toUpperCase()}
                </span>
                <span>•</span>
                <span>{bouk.author}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Page {currentPage?.pageNumber || 1} of {totalGlobalPages}</span>
                <span>•</span>
                <span className="font-semibold">{bouk.gradeLevel || "Open Access"}</span>
              </div>
            </div>

            {/* Page Title */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight mb-6 text-balance">
              {currentPage?.title}
            </h1>

            {/* Markdown Content */}
            <div className={`prose dark:prose-invert max-w-none ${fontSizes[fontSize]}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h2 className="text-xl font-bold mt-6 mb-3 border-b pb-2 border-black/10 dark:border-white/10">
                      {children}
                    </h2>
                  ),
                  h2: ({ children }) => (
                    <h3 className="text-lg font-bold mt-5 mb-2">{children}</h3>
                  ),
                  h3: ({ children }) => (
                    <h4 className="text-base font-bold mt-4 mb-2 text-amber-600 dark:text-amber-400">
                      {children}
                    </h4>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4 rounded-xl border border-slate-300 dark:border-zinc-700">
                      <table className="w-full text-xs text-left border-collapse">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="px-3 py-2 bg-slate-100 dark:bg-zinc-800 font-bold border-b border-slate-300 dark:border-zinc-700">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-3 py-2 border-b border-slate-200 dark:border-zinc-800">
                      {children}
                    </td>
                  ),
                  blockquote: ({ children }) => (
                    <div className="my-4 p-4 rounded-2xl bg-amber-500/10 border-l-4 border-amber-500 italic text-sm">
                      {children}
                    </div>
                  ),
                  code: ({ children }) => (
                    <code className="px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10 font-mono text-xs">
                      {children}
                    </code>
                  ),
                }}
              >
                {currentPage?.content || "No content found for this page."}
              </ReactMarkdown>
            </div>

            {/* AI Action Box in Bottom of Page */}
            {onAskAI && (
              <div className="mt-12 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                      Have questions about this past question or chapter?
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400">
                      Kelvis AI can explain concepts, solve equations step-by-step, or generate practice quizzes.
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleAskAIAboutPage}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  Solve with Kelvis AI
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Bottom Paging Footer Bar */}
      <footer className="px-4 py-3 border-t flex items-center justify-between shrink-0 bg-opacity-95 backdrop-blur-md z-20 border-slate-200/40 dark:border-zinc-800/40">
        {/* Previous Page */}
        <button
          onClick={handlePrevPage}
          disabled={!hasPrev}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            hasPrev
              ? "border-slate-300 dark:border-zinc-700 hover:bg-black/5 dark:hover:bg-white/10"
              : "opacity-40 cursor-not-allowed border-transparent"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Page</span>
        </button>

        {/* Page Slider / Progress Bar */}
        <div className="flex flex-col items-center max-w-xs sm:max-w-md w-full px-4">
          <div className="text-xs font-medium opacity-80 mb-1">
            Page {currentGlobalIndex} of {totalGlobalPages} ({Math.round((currentGlobalIndex / totalGlobalPages) * 100)}%)
          </div>
          <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full transition-all duration-300 rounded-full"
              style={{
                width: `${(currentGlobalIndex / totalGlobalPages) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Next Page */}
        <button
          onClick={handleNextPage}
          disabled={!hasNext}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold transition-all shadow-xs cursor-pointer ${
            hasNext
              ? "hover:opacity-90"
              : "opacity-40 cursor-not-allowed"
          }`}
        >
          <span>Next Page</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
};
