import React, { useState, useMemo, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "motion/react";
import { Message, QuizPayload } from "../types";
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Play,
  Code,
  Sparkles,
  Music,
  Zap,
  ChevronDown,
  ChevronUp,
  Folder,
  FolderOpen,
  Eye,
  Terminal,
  FileCode,
} from "lucide-react";
import { CodePreviewModal, ProjectFile } from "./CodePreviewModal";
import { ChartRenderer } from "./ChartRenderer";
import { TradingViewChart } from "./TradingViewChart";
import { extractQuizFromText, createTopicQuickQuiz } from "../utils/quizParser";
import { ActiveFileBanner } from "./ActiveFileBanner";

interface ParsedFile {
  name: string;
  code: string;
  language: string;
  lineCount: number;
}

// Helper to determine file icon and accent color based on filename or extension
function getFileLanguageMeta(filename: string = "", lang: string = "") {
  const f = filename.toLowerCase();
  const l = lang.toLowerCase();

  if (f.endsWith(".html") || l === "html") {
    return { label: "HTML", color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30" };
  }
  if (f.endsWith(".css") || l === "css" || l === "scss" || l === "tailwind") {
    return { label: "CSS", color: "text-sky-400", bg: "bg-sky-500/15", border: "border-sky-500/30" };
  }
  if (f.endsWith(".js") || f.endsWith(".jsx") || l === "javascript" || l === "js" || l === "jsx") {
    return { label: "JS", color: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-500/30" };
  }
  if (f.endsWith(".ts") || f.endsWith(".tsx") || l === "typescript" || l === "ts" || l === "tsx") {
    return { label: "TS", color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/30" };
  }
  if (f.endsWith(".json") || l === "json") {
    return { label: "JSON", color: "text-purple-400", bg: "bg-purple-500/15", border: "border-purple-500/30" };
  }
  if (f.endsWith(".py") || l === "python" || l === "py") {
    return { label: "Python", color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" };
  }
  if (f.endsWith(".sql") || l === "sql") {
    return { label: "SQL", color: "text-rose-400", bg: "bg-rose-500/15", border: "border-rose-500/30" };
  }
  return { label: (lang || "Code").toUpperCase(), color: "text-slate-300", bg: "bg-slate-700/40", border: "border-slate-600/40" };
}

// Compact Collapsible File Tab Component (fits tiny tab with folder/file name, expands on tap)
const CompactFileTab: React.FC<{
  lang: string;
  filename?: string;
  codeString: string;
  blockIdx: number;
  canRun: boolean;
  copiedBlockIndex: number | null;
  onCopy: (code: string, idx: number) => void;
  onPreview: (code: string, lang: string, filename?: string) => void;
  isStreaming?: boolean;
}> = ({
  lang,
  filename = "file.txt",
  codeString,
  blockIdx,
  canRun,
  copiedBlockIndex,
  onCopy,
  onPreview,
  isStreaming = false,
}) => {
  // Start collapsed by default so code doesn't spill across the screen
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const lineCount = codeString.split("\n").length;
  const meta = getFileLanguageMeta(filename, lang);

  // Extract folder and basename
  const pathParts = filename.split("/");
  const baseName = pathParts.pop() || filename;
  const folderPath = pathParts.length > 0 ? pathParts.join("/") + "/" : "";

  return (
    <div className="my-2 rounded-xl overflow-hidden border border-slate-300 dark:border-zinc-800 bg-slate-900 dark:bg-zinc-950 text-slate-100 shadow-sm text-xs font-sans transition-all">
      {/* Tiny Tab Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-3 py-2 bg-slate-800/95 dark:bg-zinc-900/95 hover:bg-slate-800 dark:hover:bg-zinc-850 cursor-pointer select-none transition-colors border-b border-transparent data-[expanded=true]:border-slate-700 dark:data-[expanded=true]:border-zinc-800"
        data-expanded={isExpanded}
      >
        {/* Left: Folder / File Name */}
        <div className="flex items-center space-x-2 min-w-0 pr-2">
          {folderPath ? (
            <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <FileCode className={`w-3.5 h-3.5 ${meta.color} shrink-0`} />
          )}

          <div className="flex items-center font-mono text-xs truncate">
            {folderPath && (
              <span className="text-slate-400 dark:text-zinc-500 font-normal truncate max-w-[120px]">
                {folderPath}
              </span>
            )}
            <span className="font-bold text-slate-100 dark:text-zinc-100">
              {baseName}
            </span>
          </div>

          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold ${meta.bg} ${meta.color} border ${meta.border} shrink-0`}
          >
            {meta.label}
          </span>

          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono shrink-0 hidden xs:inline">
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </span>
        </div>

        {/* Right: Actions and Expand Chevron */}
        <div className="flex items-center space-x-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Quick Preview Button */}
          {canRun && (
            <button
              type="button"
              onClick={() => onPreview(codeString, lang, filename)}
              className="px-2 py-1 rounded-md bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
              title={`Preview ${filename}`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Preview</span>
            </button>
          )}

          {/* Copy Button */}
          <button
            type="button"
            onClick={() => onCopy(codeString, blockIdx)}
            className="hover:text-white px-2 py-1 rounded-md hover:bg-slate-700 dark:hover:bg-zinc-800 text-slate-300 text-[11px] transition-colors flex items-center space-x-1 cursor-pointer"
            title="Copy Code"
          >
            {copiedBlockIndex === blockIdx ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Toggle Expand Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 dark:hover:bg-zinc-800 transition-transform cursor-pointer"
            title={isExpanded ? "Collapse Code" : "Expand Code"}
          >
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-300" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Code View (Smooth animation) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="relative">
              <pre className="p-3.5 overflow-x-auto leading-relaxed text-[12px] font-mono bg-slate-950 text-slate-200 select-text max-h-[480px]">
                <code>{codeString}</code>
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ChatMessageProps {
  message: Message;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
  isStreaming?: boolean;
  onOpenQuiz?: (quiz: QuizPayload) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSpeak,
  isSpeaking,
  onStopSpeaking,
  isStreaming = false,
  onOpenQuiz,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedBlockIndex, setCopiedBlockIndex] = useState<number | null>(null);
  const [thoughtExpanded, setThoughtExpanded] = useState(false);
  const [previewData, setPreviewData] = useState<{
    isOpen: boolean;
    initialFile?: string;
    files: ProjectFile[];
  }>({
    isOpen: false,
    files: [],
  });

  const isUser = message.role === "user";

  // Check if message contains an embedded quiz
  const extractedQuiz = useMemo(() => {
    if (isUser || !message.text) return null;
    return extractQuizFromText(message.text);
  }, [message.text, isUser]);

  // Auto-popup quiz if detected in assistant response and drawer handler is provided
  useEffect(() => {
    if (extractedQuiz && onOpenQuiz && !isUser) {
      const hasTriggered = sessionStorage.getItem(`quiz_triggered_${message.id}`);
      if (!hasTriggered) {
        sessionStorage.setItem(`quiz_triggered_${message.id}`, "true");
        onOpenQuiz(extractedQuiz);
      }
    }
  }, [extractedQuiz, onOpenQuiz, isUser, message.id]);

  // Parse thought section, active file tags, and code blocks for multi-file preview
  const { cleanBodyText, parsedFiles, thoughtText, activeFileMatch } = useMemo(() => {
    let text = message.text || "";
    let extractedThought = "";
    let fileInfo: { filename: string; step: string; stepIdx: number; total: number } | null = null;

    // Check for thinking blocks
    const thoughtRegex = /<(?:plan|think|thought)>([\s\S]*?)<\/(?:plan|think|thought)>/i;
    const thoughtM = thoughtRegex.exec(text);
    if (thoughtM) {
      extractedThought = thoughtM[1].trim();
      text = text.replace(thoughtRegex, "").trim();
    }

    // Check for active file tag: <activefile filename="..." step="..." step="1" total="4" status="..." />
    const activeFileRegex = /<activefile\s+(?:name|filename)="([^"]+)"(?:\s+step="([^"]+)")?(?:\s+step="?(\d+)"?)?(?:\s+total="?(\d+)"?)?(?:\s+status="([^"]+)")?\s*\/?>/i;
    const afm = activeFileRegex.exec(text);
    if (afm) {
      fileInfo = {
        filename: afm[1],
        step: afm[2] || "Building module...",
        stepIdx: parseInt(afm[3] || "1", 10),
        total: parseInt(afm[4] || "4", 10),
      };
      text = text.replace(activeFileRegex, "").trim();
    }

    const files: ParsedFile[] = [];
    const codeBlockRegex = /```(\w+)?(?:\s+([\w\.\-\/]+))?\n([\s\S]*?)```/g;
    let match;
    let autoCounter = 1;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const lang = (match[1] || "txt").toLowerCase();
      let filename = match[2];
      const code = match[3].trim();

      if (!filename) {
        const firstLineMatch = /^(?:<!--|\/\/|\/\*|#)\s*([\w\.\-\/]+\.(?:html|css|js|ts|jsx|tsx|json|py|sql|sh|env))\s*(?:-->|\*\/)?/i.exec(code);
        if (firstLineMatch) {
          filename = firstLineMatch[1];
        } else if (lang === "html" || code.includes("<html") || code.includes("<!DOCTYPE")) {
          filename = files.some((f) => f.name.endsWith("index.html") || f.name.endsWith("homebuild.html"))
            ? `pages/page${autoCounter++}.html`
            : "public/index.html";
        } else if (lang === "css") {
          filename = files.some((f) => f.name.endsWith("style.css") || f.name.endsWith("main.css"))
            ? `styles/theme${autoCounter++}.css`
            : "styles/main.css";
        } else if (lang === "javascript" || lang === "js") {
          filename = files.some((f) => f.name.endsWith("app.js"))
            ? `src/modules/module${autoCounter++}.js`
            : "src/app.js";
        } else if (lang === "typescript" || lang === "ts") {
          filename = `src/index${autoCounter++}.ts`;
        } else {
          filename = `file_${autoCounter++}.${lang}`;
        }
      }

      files.push({
        name: filename,
        code,
        language: lang,
        lineCount: code.split("\n").length,
      });
    }

    // Highlight pre-processing: replace ==text== with <mark>text</mark>
    const processed = text.replace(/==(.*?)==/g, "<mark>$1</mark>");

    return {
      cleanBodyText: processed,
      parsedFiles: files,
      thoughtText: extractedThought,
      activeFileMatch: fileInfo,
    };
  }, [message.text]);

  const handleCopyText = (text: string, index?: number) => {
    navigator.clipboard.writeText(text);
    if (index !== undefined) {
      setCopiedBlockIndex(index);
      setTimeout(() => setCopiedBlockIndex(null), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isRunnableCode = (lang: string, codeStr: string) => {
    const l = lang.toLowerCase();
    return (
      l === "html" ||
      l === "js" ||
      l === "javascript" ||
      l === "css" ||
      l === "ts" ||
      l === "typescript" ||
      codeStr.includes("<html") ||
      codeStr.includes("<div") ||
      codeStr.includes("function")
    );
  };

  const handleOpenLivePreview = (initialFile?: string) => {
    const projectFiles: ProjectFile[] = parsedFiles.map((f) => ({
      name: f.name,
      code: f.code,
      language: f.language,
    }));

    // Find best default entry file (homebuild.html, index.html, or first html file)
    let bestEntry = initialFile;
    if (!bestEntry) {
      const homeBuild = parsedFiles.find((f) => f.name.toLowerCase().includes("homebuild.html"));
      const indexHtml = parsedFiles.find((f) => f.name.toLowerCase().endsWith("index.html"));
      const anyHtml = parsedFiles.find((f) => f.name.toLowerCase().endsWith(".html") || f.language === "html");
      bestEntry = homeBuild?.name || indexHtml?.name || anyHtml?.name || (parsedFiles[0] ? parsedFiles[0].name : "index.html");
    }

    setPreviewData({
      isOpen: true,
      initialFile: bestEntry,
      files: projectFiles,
    });
  };

  // Determine main entry file for preview CTA
  const mainEntryFile = useMemo(() => {
    if (parsedFiles.length === 0) return "index.html";
    const homeBuild = parsedFiles.find((f) => f.name.toLowerCase().includes("homebuild.html"));
    const indexHtml = parsedFiles.find((f) => f.name.toLowerCase().endsWith("index.html"));
    const anyHtml = parsedFiles.find((f) => f.name.toLowerCase().endsWith(".html") || f.language === "html");
    return homeBuild?.name || indexHtml?.name || anyHtml?.name || parsedFiles[0].name;
  }, [parsedFiles]);

  if (!isUser && !cleanBodyText && !message.image && !message.spotifyTrack) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`flex w-full my-2 px-2 sm:px-4 ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        {isUser ? (
          /* User Message: Clean bubble on the right */
          <div className="flex items-start max-w-[90%] sm:max-w-[80%] md:max-w-[75%] flex-row-reverse space-x-reverse space-x-2">
            <div className="flex flex-col min-w-0 items-end">
              <div className="px-4 py-3 rounded-2xl bg-slate-900 text-white dark:bg-zinc-200 dark:text-zinc-900 rounded-tr-xs shadow-xs text-[15px] sm:text-[16px] font-medium leading-relaxed select-text">
                {message.files && message.files.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2 pb-2 border-b border-slate-700/30 dark:border-zinc-700">
                    {message.files.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-800/40 dark:bg-zinc-700/50 text-slate-200 dark:text-zinc-200"
                      >
                        {file.mimeType.startsWith("image/") ? (
                          <ImageIcon className="w-3 h-3 text-sky-400" />
                        ) : (
                          <FileText className="w-3 h-3 text-amber-400" />
                        )}
                        <span className="truncate max-w-[120px]">{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>

              <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-slate-400 dark:text-zinc-500">
                <span>{message.timestamp}</span>
                <button
                  type="button"
                  onClick={() => handleCopyText(message.text)}
                  className="hover:text-slate-700 dark:hover:text-zinc-300 p-0.5 rounded transition-colors cursor-pointer"
                  title="Copy message"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Assistant Response */
          <div className="flex items-start w-full max-w-4xl space-x-3 sm:space-x-3.5">
            {/* Kelvis AI Avatar */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs mt-1 border border-slate-700 dark:border-zinc-300">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 dark:text-emerald-600" />
            </div>

            {/* AI Text Body directly on canvas */}
            <div className="flex flex-col min-w-0 flex-1">
              {/* Generated image */}
              {message.image && (
                <div className="mb-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm max-w-xl">
                  <img
                    src={message.image}
                    alt="AI Generated Content"
                    className="w-full max-h-96 object-cover rounded-2xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Thought block if present */}
              {thoughtText && (
                <div className="mb-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setThoughtExpanded(!thoughtExpanded)}
                    className="w-full px-3 py-1.5 flex items-center justify-between text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 font-medium select-none cursor-pointer"
                  >
                    <span className="flex items-center space-x-1.5">
                      <span>💭 Thought for a moment</span>
                    </span>
                    {thoughtExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {thoughtExpanded && (
                    <div className="p-3 border-t border-slate-200 dark:border-zinc-800/80 text-slate-600 dark:text-zinc-400 font-mono leading-relaxed whitespace-pre-wrap">
                      {thoughtText}
                    </div>
                  )}
                </div>
              )}

              {/* Active File Banner if present in text or streaming code */}
              {activeFileMatch && (
                <ActiveFileBanner
                  filename={activeFileMatch.filename}
                  stepDescription={activeFileMatch.step}
                  stepIndex={activeFileMatch.stepIdx}
                  totalSteps={activeFileMatch.total}
                  isCompleted={!isStreaming}
                />
              )}

              {/* Direct Markdown Content with Perplexity AI Typography */}
              <div className="markdown-body text-slate-800 dark:text-zinc-100 text-[16px] sm:text-[17px] leading-[1.75] select-text font-normal">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table({ children }) {
                      return (
                        <div className="my-4 overflow-x-auto rounded-xl border border-slate-300 dark:border-zinc-700 shadow-xs bg-white/60 dark:bg-zinc-900/60">
                          <table className="w-full text-left border-collapse text-xs sm:text-sm">
                            {children}
                          </table>
                        </div>
                      );
                    },
                    thead({ children }) {
                      return (
                        <thead className="bg-slate-200/90 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-bold border-b border-slate-300 dark:border-zinc-700">
                          {children}
                        </thead>
                      );
                    },
                    tbody({ children }) {
                      return <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">{children}</tbody>;
                    },
                    tr({ children }) {
                      return (
                        <tr className="hover:bg-slate-100/80 dark:hover:bg-zinc-800/50 transition-colors">
                          {children}
                        </tr>
                      );
                    },
                    th({ children }) {
                      return (
                        <th className="px-3.5 py-2.5 font-semibold text-slate-900 dark:text-zinc-100 text-xs sm:text-sm uppercase tracking-wider">
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return (
                        <td className="px-3.5 py-2.5 text-slate-700 dark:text-zinc-300 text-xs sm:text-sm">
                          {children}
                        </td>
                      );
                    },
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      const rawLang = (match ? match[1] : "code").toLowerCase();
                      const codeString = String(children).replace(/\n$/, "");
                      const blockIdx = Math.abs(codeString.length + (rawLang.length * 10));

                      // Check if this is an interactive Quiz specification
                      if (
                        !inline &&
                        (rawLang === "quiz" ||
                          rawLang === "json-quiz" ||
                          (rawLang === "json" && codeString.includes('"questions"') && (codeString.includes('"options"') || codeString.includes('"title"'))))
                      ) {
                        try {
                          const parsed = JSON.parse(codeString);
                          if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
                            const quizData: QuizPayload = {
                              title: parsed.title || "Interactive Blueprint / Assessment",
                              topic: parsed.topic || "Knowledge Check",
                              isCodingSpecification: parsed.isCodingSpecification,
                              questions: parsed.questions,
                            };
                            return (
                              <div className="my-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-600/10 border border-amber-500/40 dark:border-amber-500/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 select-none">
                                <div className="flex items-center space-x-3.5">
                                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shrink-0">
                                    <Zap className="w-5 h-5 fill-current" />
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                        Interactive Setup
                                      </span>
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                                        {quizData.questions.length} Steps
                                      </span>
                                    </div>
                                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-zinc-100">
                                      {quizData.title || "Interactive Options"}
                                    </h4>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onOpenQuiz && onOpenQuiz(quizData)}
                                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
                                >
                                  <Play className="w-4 h-4 fill-current" />
                                  <span>Open Interactive Blueprint</span>
                                </button>
                              </div>
                            );
                          }
                        } catch (e) {
                          // Continue to standard code rendering
                        }
                      }

                      // Check if this is a live Binance or TradingView Chart specification
                      if (
                        !inline &&
                        (rawLang === "binance" ||
                          rawLang === "trading" ||
                          rawLang === "crypto" ||
                          rawLang === "candlestick" ||
                          codeString.includes('"type": "binance"') ||
                          codeString.includes('"type": "trading"') ||
                          codeString.includes('"binance": true'))
                      ) {
                        try {
                          let symbol = "BTCUSDT";
                          let interval = "1m";
                          if (codeString.trim().startsWith("{")) {
                            const parsed = JSON.parse(codeString);
                            if (parsed.symbol) symbol = parsed.symbol;
                            if (parsed.interval) interval = parsed.interval;
                          } else {
                            const symMatch = codeString.match(/(BTC|ETH|SOL|BNB|XRP|DOGE|ADA|AVAX|LINK|NEAR|SUI|PEPE)(USDT)?/i);
                            if (symMatch) {
                              symbol = symMatch[1].toUpperCase() + (symMatch[2] ? symMatch[2].toUpperCase() : "USDT");
                            }
                          }
                          return <TradingViewChart initialSymbol={symbol} initialInterval={interval} height={460} />;
                        } catch (e) {
                          return <TradingViewChart initialSymbol="BTCUSDT" initialInterval="1m" height={460} />;
                        }
                      }

                      // Check if this is an interactive Chart specification
                      if (
                        !inline &&
                        (rawLang === "chart" ||
                          rawLang === "charts" ||
                          rawLang === "recharts" ||
                          (rawLang === "json" &&
                            (codeString.includes('"type"') || codeString.includes('"data"'))))
                      ) {
                        try {
                          const parsed = JSON.parse(codeString);
                          if (parsed && (parsed.type === "binance" || parsed.symbol)) {
                            return (
                              <TradingViewChart
                                initialSymbol={parsed.symbol || "BTCUSDT"}
                                initialInterval={parsed.interval || "1m"}
                                height={460}
                              />
                            );
                          }
                          if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0) {
                            return <ChartRenderer config={parsed} />;
                          }
                        } catch (e) {
                          // Not valid JSON chart, continue
                        }
                      }

                      // Render Compact Tiny File Tab for multi-line or fenced code
                      if (!inline && (match || codeString.includes("\n"))) {
                        const matchingFile = parsedFiles.find(
                          (f) => f.code.trim() === codeString.trim()
                        );
                        const filename = matchingFile ? matchingFile.name : undefined;
                        const canRun = isRunnableCode(rawLang, codeString);

                        return (
                          <CompactFileTab
                            lang={rawLang}
                            filename={filename}
                            codeString={codeString}
                            blockIdx={blockIdx}
                            canRun={canRun}
                            copiedBlockIndex={copiedBlockIndex}
                            onCopy={handleCopyText}
                            onPreview={(code, lang, fName) => {
                              handleOpenLivePreview(fName);
                            }}
                            isStreaming={isStreaming}
                          />
                        );
                      }

                      return (
                        <code
                          className="px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-zinc-800 font-mono text-[13px] sm:text-[14px] text-slate-900 dark:text-zinc-100 font-semibold"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    p({ children }) {
                      return <p className="leading-[1.75] my-2.5 text-[16px] sm:text-[17px] text-slate-800 dark:text-zinc-100">{children}</p>;
                    },
                    blockquote({ children }) {
                      return (
                        <blockquote className="my-3.5 border-l-4 border-emerald-500/90 dark:border-emerald-400 pl-4 py-1.5 text-slate-700 dark:text-zinc-300 text-[16px] sm:text-[17px] font-medium italic bg-emerald-500/5 dark:bg-emerald-950/20 rounded-r-xl">
                          {children}
                        </blockquote>
                      );
                    },
                    h1({ children }) {
                      return (
                        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-5 mb-2.5">
                          {children}
                        </h1>
                      );
                    },
                    h2({ children }) {
                      return (
                        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-emerald-400 mt-4 mb-2">
                          {children}
                        </h2>
                      );
                    },
                    h3({ children }) {
                      return (
                        <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-zinc-100 mt-3.5 mb-1.5">
                          {children}
                        </h3>
                      );
                    },
                    ul({ children }) {
                      return <ul className="list-disc list-inside my-2.5 space-y-1.5 text-slate-700 dark:text-zinc-300 text-[16px] sm:text-[17px] leading-[1.7]">{children}</ul>;
                    },
                    ol({ children }) {
                      return <ol className="list-decimal list-inside my-2.5 space-y-1.5 text-slate-700 dark:text-zinc-300 text-[16px] sm:text-[17px] leading-[1.7]">{children}</ol>;
                    },
                    hr() {
                      return <hr className="my-4 border-slate-200 dark:border-zinc-800" />;
                    },
                    strong({ children }) {
                      return <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>;
                    },
                    img({ src, alt }) {
                      return (
                        <div className="my-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm max-w-xl">
                          <img
                            src={src}
                            alt={alt || "Generated visual"}
                            className="w-full max-h-96 object-contain rounded-2xl"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      );
                    },
                    mark({ children }) {
                      return <mark className="bg-amber-200 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 px-1 py-0.5 rounded-xs font-semibold">{children}</mark>;
                    },
                  }}
                >
                  {cleanBodyText}
                </ReactMarkdown>

                {/* Animated Typing Cursor */}
                <AnimatePresence>
                  {isStreaming && (
                    <motion.span
                      key="streaming-cursor"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [1, 0.2, 1] }}
                      exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeOut" } }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                      className="inline-block w-2 h-4 ml-1 bg-emerald-500 rounded-xs align-middle"
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* End-of-Response Live Preview Callout Banner */}
              {parsedFiles.length > 0 && !isStreaming && (
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border border-emerald-500/40 dark:border-emerald-500/30 shadow-md select-none">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0 mt-0.5">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Live Preview Environment
                          </span>
                          <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            {parsedFiles.length} {parsedFiles.length === 1 ? "File" : "Files"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-zinc-300 mt-0.5">
                          You can preview by clicking on{" "}
                          <span
                            onClick={() => handleOpenLivePreview(mainEntryFile)}
                            className="font-mono font-bold text-emerald-700 dark:text-emerald-300 underline cursor-pointer hover:text-emerald-500"
                          >
                            {mainEntryFile}
                          </span>
                          . Test the interface and let me know if you notice any issues or want refinements!
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenLivePreview(mainEntryFile)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-md shadow-emerald-500/25 transition-all cursor-pointer shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run Live Preview</span>
                    </button>
                  </div>

                  {/* Quick File Selector Chips */}
                  {parsedFiles.length > 1 && (
                    <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="text-slate-500 dark:text-zinc-400 font-medium mr-1">
                        Quick Launch:
                      </span>
                      {parsedFiles.map((file, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleOpenLivePreview(file.name)}
                          className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-zinc-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-300 dark:border-zinc-700 hover:border-emerald-400 text-slate-800 dark:text-zinc-200 font-mono text-[11px] flex items-center space-x-1 transition-all cursor-pointer"
                        >
                          <FileCode className="w-3 h-3 text-emerald-500" />
                          <span>{file.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Spotify Player */}
              {message.spotifyTrack && (
                <div className="mt-3 p-3 rounded-2xl bg-zinc-950 border border-emerald-500/40 text-white shadow-lg overflow-hidden select-none max-w-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold">
                        <Music className="w-3.5 h-3.5 fill-current" />
                      </div>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        Spotify Web Music
                      </span>
                    </div>
                    <a
                      href={message.spotifyTrack.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 underline font-semibold"
                    >
                      <span>Open Spotify</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center space-x-3 mb-2.5">
                    {message.spotifyTrack.albumArt && (
                      <img
                        src={message.spotifyTrack.albumArt}
                        alt={message.spotifyTrack.title}
                        className="w-12 h-12 rounded-xl object-cover border border-zinc-800 shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold truncate text-zinc-100">
                        {message.spotifyTrack.title}
                      </div>
                      <div className="text-xs text-zinc-400 truncate">
                        {message.spotifyTrack.artist}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl overflow-hidden bg-black/50 border border-zinc-800">
                    <iframe
                      src={message.spotifyTrack.embedUrl}
                      width="100%"
                      height="152"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="w-full rounded-xl"
                      title={`Spotify Player - ${message.spotifyTrack.title}`}
                    />
                  </div>
                </div>
              )}

              {/* Web Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-2 text-xs select-none">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </div>
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-cyan-400">
                      Sources ({message.sources.length})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {message.sources.map((src, i) => {
                      const domainName =
                        src.domain ||
                        (() => {
                          try {
                            return new URL(src.url).hostname.replace(/^www\./, "");
                          } catch (e) {
                            return "web";
                          }
                        })();

                      return (
                        <a
                          key={i}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white dark:bg-zinc-800/80 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700/80 hover:border-cyan-500 dark:hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-all shadow-2xs group"
                          title={src.snippet || src.title}
                        >
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${domainName}&sz=32`}
                            alt={domainName}
                            className="w-3.5 h-3.5 rounded-xs shrink-0 bg-white/20"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <span className="truncate max-w-[130px] font-mono text-[11px]">
                            {domainName}
                          </span>
                          <ExternalLink className="w-3 h-3 shrink-0 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action details footer */}
              <div className="flex items-center space-x-2 mt-2 text-[11px] text-slate-400 dark:text-zinc-500">
                <span>{message.timestamp}</span>

                {/* Copy button */}
                <button
                  type="button"
                  onClick={() => handleCopyText(message.text)}
                  className="hover:text-slate-700 dark:hover:text-zinc-300 p-0.5 rounded transition-colors cursor-pointer"
                  title="Copy message"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Text-to-Speech */}
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeaking) {
                      onStopSpeaking();
                    } else {
                      onSpeak(message.text);
                    }
                  }}
                  className={`p-0.5 rounded transition-colors cursor-pointer ${
                    isSpeaking
                      ? "text-emerald-500 animate-pulse"
                      : "hover:text-slate-700 dark:hover:text-zinc-300"
                  }`}
                  title={isSpeaking ? "Stop Speaking" : "Read Aloud"}
                >
                  {isSpeaking ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Multi-File Code Preview Modal */}
      {previewData.isOpen && (
        <CodePreviewModal
          isOpen={previewData.isOpen}
          onClose={() =>
            setPreviewData((prev) => ({ ...prev, isOpen: false }))
          }
          files={previewData.files}
          initialActiveFile={previewData.initialFile}
          projectName="web-project"
        />
      )}
    </>
  );
};
