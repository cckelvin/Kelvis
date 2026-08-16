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
  Bookmark,
  Share2,
  Check,
  Search,
  List,
  Layers,
  ArrowLeft,
  FileText
} from "lucide-react";
import { Bouk } from "../types";

interface BoukReaderProps {
  bouk: Bouk;
  initialPageIndex?: number;
  onClose: () => void;
  onAskAI?: (prompt: string) => void;
}

export const BoukReader: React.FC<BoukReaderProps> = ({
  bouk,
  initialPageIndex = 1,
  onClose,
}) => {
  // Collect all available pages (1 to 100)
  const availablePageNumbers: number[] = [];
  for (let i = 1; i <= 100; i++) {
    const col = `page_${i}`;
    if (bouk[col] !== undefined && bouk[col] !== null && String(bouk[col]).trim() !== "") {
      availablePageNumbers.push(i);
    }
  }

  // If no pages exist yet, default to page 1
  const pagesList = availablePageNumbers.length > 0 ? availablePageNumbers : [1];

  const [currentPageNum, setCurrentPageNum] = useState<number>(() => {
    if (pagesList.includes(initialPageIndex)) return initialPageIndex;
    return pagesList[0] || 1;
  });

  const [readingTheme, setReadingTheme] = useState<"light" | "sepia" | "dark">("light");
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg" | "xl">("base");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  // Get current page HTML content
  const currentPageKey = `page_${currentPageNum}`;
  const currentPageHtml: string =
    bouk[currentPageKey] ||
    `<div class="p-6 text-center text-slate-500 dark:text-zinc-400">
      <p class="text-base font-semibold">Page ${currentPageNum} is currently empty.</p>
      <p class="text-xs mt-1">You can author HTML content for this page in the Publish Bouk tab.</p>
    </div>`;

  const currentIndexInList = pagesList.indexOf(currentPageNum);
  const hasPrev = currentIndexInList > 0;
  const hasNext = currentIndexInList < pagesList.length - 1;

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
  }, [currentPageNum]);

  // Handle previous page
  const handlePrevPage = () => {
    if (hasPrev) {
      setCurrentPageNum(pagesList[currentIndexInList - 1]);
    }
  };

  // Handle next page
  const handleNextPage = () => {
    if (hasNext) {
      setCurrentPageNum(pagesList[currentIndexInList + 1]);
    }
  };

  // Text to speech (TTS)
  const toggleSpeech = () => {
    if (!("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // Extract plain text from HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = currentPageHtml;
      const plainText = tempDiv.textContent || tempDiv.innerText || "";

      if (!plainText.trim()) return;

      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Font size class mapping
  const getFontSizeClass = () => {
    switch (fontSize) {
      case "sm":
        return "text-sm leading-relaxed";
      case "lg":
        return "text-lg leading-relaxed";
      case "xl":
        return "text-xl leading-loose";
      default:
        return "text-base leading-relaxed";
    }
  };

  // Theme styling mapping
  const getThemeClass = () => {
    switch (readingTheme) {
      case "sepia":
        return "bg-[#fbf0d9] text-[#5f4b32] border-[#e7d8bd]";
      case "dark":
        return "bg-zinc-950 text-zinc-200 border-zinc-800";
      default:
        return "bg-white text-slate-900 border-slate-200 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-800";
    }
  };

  const getReaderHeaderClass = () => {
    switch (readingTheme) {
      case "sepia":
        return "bg-[#f4e6c9] border-[#e7d8bd] text-[#5f4b32]";
      case "dark":
        return "bg-zinc-900 border-zinc-800 text-zinc-100";
      default:
        return "bg-white/95 dark:bg-zinc-900/95 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 backdrop-blur";
    }
  };

  return (
    <div
      id="bouk-full-reader"
      className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className={`relative flex flex-col w-full h-full max-w-5xl mx-auto shadow-2xl overflow-hidden ${getThemeClass()}`}>
        {/* Top Action Header */}
        <header className={`flex items-center justify-between px-4 py-2.5 border-b z-20 transition-colors ${getReaderHeaderClass()}`}>
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-current transition"
              title="Close Reader"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 truncate">
                {bouk.categoryName} • Grade: {bouk.gradeLevel || "Open Access"}
              </span>
              <h1 className="text-sm font-semibold truncate text-current max-w-md">
                {bouk.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Table of Pages Drawer Trigger */}
            <button
              onClick={() => setIsTocOpen(!isTocOpen)}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                isTocOpen
                  ? "bg-amber-600 text-white"
                  : "hover:bg-black/5 dark:hover:bg-white/5 text-current"
              }`}
              title="Table of 100 Pages"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Page Index ({pagesList.length})</span>
            </button>

            {/* Read Aloud TTS */}
            <button
              onClick={toggleSpeech}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                isSpeaking
                  ? "bg-emerald-600 text-white animate-pulse"
                  : "hover:bg-black/5 dark:hover:bg-white/5 text-current"
              }`}
              title={isSpeaking ? "Stop Voice" : "Read Aloud"}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden md:inline">{isSpeaking ? "Stop" : "Read"}</span>
            </button>

            {/* Font Size Adjust */}
            <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-lg p-0.5 text-xs font-medium">
              {(["sm", "base", "lg"] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => setFontSize(sz)}
                  className={`px-2 py-1 rounded capitalize transition ${
                    fontSize === sz
                      ? "bg-white dark:bg-zinc-800 text-amber-600 shadow-sm font-bold"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  {sz === "sm" ? "A-" : sz === "base" ? "A" : "A+"}
                </button>
              ))}
            </div>

            {/* Reading Theme Selector */}
            <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-lg p-0.5">
              <button
                onClick={() => setReadingTheme("light")}
                className={`p-1.5 rounded transition ${
                  readingTheme === "light" ? "bg-white text-amber-600 shadow-sm" : "opacity-70"
                }`}
                title="Light Theme"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setReadingTheme("sepia")}
                className={`px-2 py-0.5 text-xs font-serif font-bold rounded transition ${
                  readingTheme === "sepia" ? "bg-[#e7d8bd] text-[#5f4b32] shadow-sm" : "opacity-70"
                }`}
                title="Sepia Book Theme"
              >
                S
              </button>
              <button
                onClick={() => setReadingTheme("dark")}
                className={`p-1.5 rounded transition ${
                  readingTheme === "dark" ? "bg-zinc-800 text-amber-400 shadow-sm" : "opacity-70"
                }`}
                title="Dark Reading"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-current transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Reader Layout (Main HTML view + Pages Drawer) */}
        <div className="relative flex-1 flex overflow-hidden">
          {/* Table of 100 Pages Drawer */}
          {isTocOpen && (
            <aside className="w-72 sm:w-80 border-r border-inherit bg-inherit flex flex-col z-30 shadow-xl animate-in slide-in-from-left duration-200">
              <div className="p-3 border-b border-inherit flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider opacity-80 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  <span>Book Pages (1–100)</span>
                </span>
                <button
                  onClick={() => setIsTocOpen(false)}
                  className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-xs opacity-70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {Array.from({ length: 100 }, (_, idx) => idx + 1).map((pageNum) => {
                  const hasContent = availablePageNumbers.includes(pageNum);
                  const isCurrent = pageNum === currentPageNum;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setCurrentPageNum(pageNum);
                        setIsTocOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition ${
                        isCurrent
                          ? "bg-amber-600 text-white font-bold shadow"
                          : hasContent
                          ? "hover:bg-black/5 dark:hover:bg-white/5 opacity-90"
                          : "opacity-40 hover:opacity-70"
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-[11px] ${
                            isCurrent
                              ? "bg-white/20 text-white"
                              : hasContent
                              ? "bg-amber-500/20 text-amber-600"
                              : "bg-black/5 dark:bg-white/5 text-current"
                          }`}
                        >
                          {pageNum}
                        </span>
                        <span className="truncate">Page {pageNum}</span>
                      </div>
                      {hasContent && !isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </aside>
          )}

          {/* Main Book Page HTML Reader Container */}
          <main
            ref={contentRef}
            className={`flex-1 overflow-y-auto p-6 sm:p-10 md:p-14 ${getFontSizeClass()}`}
          >
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Page Header Bar */}
              <div className="flex items-center justify-between border-b border-inherit pb-4">
                <div className="flex items-center space-x-2">
                  <div className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 font-mono text-xs font-bold border border-amber-500/20">
                    Page {currentPageNum} of 100
                  </div>
                  <span className="text-xs opacity-60">
                    By {bouk.author}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-xs opacity-80 flex items-center space-x-1"
                    title="Share Page"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span className="text-[11px]">{copiedLink ? "Copied" : "Share"}</span>
                  </button>
                </div>
              </div>

              {/* RENDER NATIVE HTML CONTENT */}
              <div
                className="bouk-html-page-content font-serif prose dark:prose-invert max-w-none space-y-4"
                dangerouslySetInnerHTML={{ __html: currentPageHtml }}
              />

              {/* End of Page Navigation Pill */}
              <div className="pt-8 mt-12 border-t border-inherit flex items-center justify-between">
                <button
                  disabled={!hasPrev}
                  onClick={handlePrevPage}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                    hasPrev
                      ? "bg-black/5 dark:bg-white/5 hover:bg-black/10 text-current"
                      : "opacity-30 cursor-not-allowed"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Page</span>
                </button>

                <span className="text-xs font-mono opacity-60">
                  Page {currentPageNum} / 100
                </span>

                <button
                  disabled={!hasNext}
                  onClick={handleNextPage}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                    hasNext
                      ? "bg-amber-600 text-white hover:bg-amber-700 shadow-md shadow-amber-600/20"
                      : "opacity-30 cursor-not-allowed"
                  }`}
                >
                  <span>Next Page</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </main>
        </div>

        {/* Reader Bottom Navigation Bar */}
        <footer className={`flex items-center justify-between px-6 py-3 border-t text-xs font-medium z-20 ${getReaderHeaderClass()}`}>
          <button
            disabled={!hasPrev}
            onClick={handlePrevPage}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              hasPrev ? "hover:bg-black/5 dark:hover:bg-white/5 text-current" : "opacity-30 cursor-not-allowed"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Quick Page Slider */}
          <div className="flex items-center space-x-3 max-w-sm w-full mx-4">
            <span className="font-mono text-[11px] opacity-70">1</span>
            <input
              type="range"
              min={1}
              max={100}
              value={currentPageNum}
              onChange={(e) => setCurrentPageNum(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none"
            />
            <span className="font-mono text-[11px] opacity-70">100</span>
          </div>

          <button
            disabled={!hasNext}
            onClick={handleNextPage}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              hasNext ? "hover:bg-black/5 dark:hover:bg-white/5 text-current" : "opacity-30 cursor-not-allowed"
            }`}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </footer>
      </div>
    </div>
  );
};
