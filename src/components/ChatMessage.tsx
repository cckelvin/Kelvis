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
    return { label: "HTML", color: "text-black dark:text-white", bg: "bg-black/10 dark:bg-white/15", border: "border-black/20 dark:border-white/20" };
  }
  if (f.endsWith(".css") || l === "css" || l === "scss" || l === "tailwind") {
    return { label: "CSS", color: "text-black dark:text-white", bg: "bg-black/10 dark:bg-white/15", border: "border-black/20 dark:border-white/20" };
  }
  if (f.endsWith(".js") || f.endsWith(".jsx") || l === "javascript" || l === "js" || l === "jsx") {
    return { label: "JS", color: "text-black dark:text-white", bg: "bg-black/10 dark:bg-white/15", border: "border-black/20 dark:border-white/20" };
  }
  if (f.endsWith(".ts") || f.endsWith(".tsx") || l === "typescript" || l === "ts" || l === "tsx") {
    return { label: "TS", color: "text-black dark:text-white", bg: "bg-black/10 dark:bg-white/15", border: "border-black/20 dark:border-white/20" };
  }
  if (f.endsWith(".json") || l === "json") {
    return { label: "JSON", color: "text-black dark:text-white", bg: "bg-black/10 dark:bg-white/15", border: "border-black/20 dark:border-white/20" };
  }
  if (f.endsWith(".py") || l === "python" || l === "py") {
    return { label: "Python", color: "text-black dark:text-white", bg: "bg-black/10 dark:bg-white/15", border: "border-black/20 dark:border-white/20" };
  }
  if (f.endsWith(".sql") || l === "sql") {
    return { label: "SQL", color: "text-black dark:text-white", bg: "bg-black/10 dark:bg-white/15", border: "border-black/20 dark:border-white/20" };
  }
  return { label: (lang || "Code").toUpperCase(), color: "text-black dark:text-white", bg: "bg-black/10 dark:bg-white/15", border: "border-black/20 dark:border-white/20" };
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
    <div className="my-2 rounded-xl overflow-hidden border border-black/20 dark:border-white/20 bg-white dark:bg-black text-black dark:text-white shadow-xs text-xs font-sans transition-all">
      {/* Tiny Tab Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-3 py-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 cursor-pointer select-none transition-colors border-b border-transparent data-[expanded=true]:border-black/15 dark:data-[expanded=true]:border-white/15"
        data-expanded={isExpanded}
      >
        {/* Left: Folder / File Name */}
        <div className="flex items-center space-x-2 min-w-0 pr-2">
          {folderPath ? (
            <Folder className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />
          ) : (
            <FileCode className={`w-3.5 h-3.5 ${meta.color} shrink-0`} />
          )}

          <div className="flex items-center font-mono text-xs truncate">
            {folderPath && (
              <span className="text-black/50 dark:text-white/50 font-medium truncate max-w-[120px]">
                {folderPath}
              </span>
            )}
            <span className="font-extrabold text-black dark:text-white">
              {baseName}
            </span>
          </div>

          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-black ${meta.bg} ${meta.color} border ${meta.border} shrink-0`}
          >
            {meta.label}
          </span>

          <span className="text-[10px] text-black/50 dark:text-white/50 font-mono font-bold shrink-0 hidden xs:inline">
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
              className="px-2.5 py-1 rounded-lg bg-black text-white dark:bg-white dark:text-black text-[11px] font-extrabold flex items-center space-x-1 hover:opacity-85 transition-opacity cursor-pointer shadow-2xs"
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
            className="hover:text-black dark:hover:text-white px-2 py-1 rounded-md hover:bg-black/10 dark:hover:bg-white/20 text-black/70 dark:text-white/70 text-[11px] font-bold transition-colors flex items-center space-x-1 cursor-pointer"
            title="Copy Code"
          >
            {copiedBlockIndex === blockIdx ? (
              <>
                <Check className="w-3 h-3 text-black dark:text-white stroke-[3]" />
                <span className="text-black dark:text-white font-extrabold">Copied</span>
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
            className="p-1 rounded-md text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/20 transition-transform cursor-pointer"
            title={isExpanded ? "Collapse Code" : "Expand Code"}
          >
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-black dark:text-white" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-black dark:text-white" />
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
            className="overflow-hidden border-t border-black/15 dark:border-white/15"
          >
            <div className="relative">
              <pre className="p-3.5 overflow-x-auto leading-relaxed text-[12px] font-mono bg-white dark:bg-black text-black dark:text-white select-text max-h-[480px]">
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
              <div className="px-4 py-3 rounded-2xl bg-black text-white dark:bg-white dark:text-black rounded-tr-xs shadow-xs text-[15px] sm:text-[16px] font-bold leading-relaxed select-text border border-black dark:border-white">
                {message.files && message.files.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2 pb-2 border-b border-white/20 dark:border-black/20">
                    {message.files.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-md bg-white/15 dark:bg-black/15 text-white dark:text-black font-bold font-mono"
                      >
                        {file.mimeType.startsWith("image/") ? (
                          <ImageIcon className="w-3 h-3 text-white dark:text-black" />
                        ) : (
                          <FileText className="w-3 h-3 text-white dark:text-black" />
                        )}
                        <span className="truncate max-w-[120px]">{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>

              <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-black/50 dark:text-white/50 font-bold">
                <span>{message.timestamp}</span>
                <button
                  type="button"
                  onClick={() => handleCopyText(message.text)}
                  className="hover:text-black dark:hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                  title="Copy message"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-black dark:text-white stroke-[3]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Assistant Response */
          <div className="flex items-start w-full max-w-4xl space-x-3 sm:space-x-3.5">
            {/* Kelvis AI Avatar */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shrink-0 shadow-xs mt-1 border border-black dark:border-white">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white dark:text-black" />
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
                <div className="mb-3 rounded-xl border border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/10 overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setThoughtExpanded(!thoughtExpanded)}
                    className="w-full px-3 py-1.5 flex items-center justify-between text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white font-bold select-none cursor-pointer"
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
                    <div className="p-3 border-t border-black/15 dark:border-white/15 text-black/70 dark:text-white/70 font-mono text-xs leading-relaxed whitespace-pre-wrap">
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

              {/* Direct Markdown Content with Bold High-Contrast Black and White Typography */}
              <div className="markdown-body text-black dark:text-white text-[16px] sm:text-[17px] leading-[1.75] select-text font-semibold">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table({ children }) {
                      return (
                        <div className="my-4 overflow-x-auto rounded-xl border border-black/20 dark:border-white/20 shadow-xs bg-white dark:bg-black">
                          <table className="w-full text-left border-collapse text-xs sm:text-sm font-bold">
                            {children}
                          </table>
                        </div>
                      );
                    },
                    thead({ children }) {
                      return (
                        <thead className="bg-black/10 dark:bg-white/15 text-black dark:text-white font-black border-b border-black/20 dark:border-white/20">
                          {children}
                        </thead>
                      );
                    },
                    tbody({ children }) {
                      return <tbody className="divide-y divide-black/10 dark:divide-white/15">{children}</tbody>;
                    },
                    tr({ children }) {
                      return (
                        <tr className="hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                          {children}
                        </tr>
                      );
                    },
                    th({ children }) {
                      return (
                        <th className="px-3.5 py-2.5 font-black text-black dark:text-white text-xs sm:text-sm uppercase tracking-wider">
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return (
                        <td className="px-3.5 py-2.5 text-black dark:text-white text-xs sm:text-sm font-semibold">
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
                              <div className="my-4 p-4 sm:p-5 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/20 dark:border-white/20 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 select-none">
                                <div className="flex items-center space-x-3.5">
                                  <div className="w-10 h-10 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-xs shrink-0 font-black">
                                    <Zap className="w-5 h-5 fill-current" />
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-[11px] font-black uppercase tracking-wider text-black/60 dark:text-white/60">
                                        Interactive Setup
                                      </span>
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-black/10 dark:bg-white/15 text-black dark:text-white">
                                        {quizData.questions.length} Steps
                                      </span>
                                    </div>
                                    <h4 className="text-sm sm:text-base font-black text-black dark:text-white">
                                      {quizData.title || "Interactive Options"}
                                    </h4>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onOpenQuiz && onOpenQuiz(quizData)}
                                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-black text-xs sm:text-sm flex items-center justify-center space-x-2 border border-black dark:border-white hover:opacity-85 active:scale-95 transition-all cursor-pointer shadow-xs"
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
                          className="px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/15 font-mono text-[13px] sm:text-[14px] text-black dark:text-white font-bold"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    p({ children }) {
                      return <div className="leading-[1.75] my-2.5 text-[16px] sm:text-[17px] text-black dark:text-white font-semibold">{children}</div>;
                    },
                    blockquote({ children }) {
                      return (
                        <blockquote className="my-3.5 border-l-4 border-black dark:border-white pl-4 py-1.5 text-black dark:text-white text-[16px] sm:text-[17px] font-bold italic bg-black/5 dark:bg-white/10 rounded-r-xl">
                          {children}
                        </blockquote>
                      );
                    },
                    h1({ children }) {
                      return (
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-black dark:text-white mt-5 mb-2.5">
                          {children}
                        </h1>
                      );
                    },
                    h2({ children }) {
                      return (
                        <h2 className="text-lg sm:text-xl font-black tracking-tight text-black dark:text-white mt-4 mb-2">
                          {children}
                        </h2>
                      );
                    },
                    h3({ children }) {
                      return (
                        <h3 className="text-base sm:text-lg font-extrabold text-black dark:text-white mt-3.5 mb-1.5">
                          {children}
                        </h3>
                      );
                    },
                    ul({ children }) {
                      return <ul className="list-disc list-inside my-2.5 space-y-1.5 text-black dark:text-white text-[16px] sm:text-[17px] leading-[1.7] font-semibold">{children}</ul>;
                    },
                    ol({ children }) {
                      return <ol className="list-decimal list-inside my-2.5 space-y-1.5 text-black dark:text-white text-[16px] sm:text-[17px] leading-[1.7] font-semibold">{children}</ol>;
                    },
                    hr() {
                      return <hr className="my-4 border-black/15 dark:border-white/15" />;
                    },
                    strong({ children }) {
                      return <strong className="font-black text-black dark:text-white">{children}</strong>;
                    },
                    img({ src, alt }) {
                      return (
                        <span className="block my-3 overflow-hidden rounded-2xl border border-black/20 dark:border-white/20 shadow-xs max-w-xl">
                          <img
                            src={src}
                            alt={alt || "Generated visual"}
                            className="w-full max-h-96 object-contain rounded-2xl block"
                            referrerPolicy="no-referrer"
                          />
                        </span>
                      );
                    },
                    mark({ children }) {
                      return <mark className="bg-black/15 dark:bg-white/25 text-black dark:text-white px-1 py-0.5 rounded-xs font-black">{children}</mark>;
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
                      className="inline-block w-2 h-4 ml-1 bg-black dark:bg-white rounded-xs align-middle"
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* End-of-Response Live Preview Callout Banner */}
              {parsedFiles.length > 0 && !isStreaming && (
                <div className="mt-4 p-4 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/20 dark:border-white/20 shadow-xs select-none">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-black dark:text-white">
                            Live Preview Environment
                          </span>
                          <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono font-black bg-black/10 dark:bg-white/20 text-black dark:text-white">
                            {parsedFiles.length} {parsedFiles.length === 1 ? "File" : "Files"}
                          </span>
                        </div>
                        <p className="text-xs text-black/70 dark:text-white/70 font-semibold mt-0.5">
                          You can preview by clicking on{" "}
                          <span
                            onClick={() => handleOpenLivePreview(mainEntryFile)}
                            className="font-mono font-black text-black dark:text-white underline cursor-pointer hover:opacity-75"
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
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-85 active:scale-95 font-black text-xs flex items-center justify-center space-x-2 border border-black dark:border-white shadow-xs transition-all cursor-pointer shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run Live Preview</span>
                    </button>
                  </div>

                  {/* Quick File Selector Chips */}
                  {parsedFiles.length > 1 && (
                    <div className="mt-3 pt-2.5 border-t border-black/15 dark:border-white/15 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="text-black/60 dark:text-white/60 font-bold mr-1">
                        Quick Launch:
                      </span>
                      {parsedFiles.map((file, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleOpenLivePreview(file.name)}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-black hover:bg-black/10 dark:hover:bg-white/15 border border-black/20 dark:border-white/20 text-black dark:text-white font-mono font-bold text-[11px] flex items-center space-x-1 transition-all cursor-pointer"
                        >
                          <FileCode className="w-3 h-3 text-black dark:text-white" />
                          <span>{file.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Spotify Player */}
              {message.spotifyTrack && (
                <div className="mt-3 p-3 rounded-2xl bg-white dark:bg-black border border-black/20 dark:border-white/20 text-black dark:text-white shadow-xs overflow-hidden select-none max-w-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black">
                        <Music className="w-3.5 h-3.5 fill-current" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider">
                        Spotify Web Music
                      </span>
                    </div>
                    <a
                      href={message.spotifyTrack.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-black dark:text-white hover:opacity-75 flex items-center space-x-1 underline font-bold"
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
                        className="w-12 h-12 rounded-xl object-cover border border-black/20 dark:border-white/20 shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-black truncate text-black dark:text-white">
                        {message.spotifyTrack.title}
                      </div>
                      <div className="text-xs font-bold text-black/60 dark:text-white/60 truncate">
                        {message.spotifyTrack.artist}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl overflow-hidden bg-black/5 dark:bg-white/10 border border-black/15 dark:border-white/15">
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

              {/* Web Search in a Tab with the Favicon of the First Source Only in the Tab */}
              {message.sources && message.sources.length > 0 && (() => {
                const firstSource = message.sources[0];
                const firstDomain =
                  firstSource.domain ||
                  (() => {
                    try {
                      return new URL(firstSource.url).hostname.replace(/^www\./, "");
                    } catch (e) {
                      return "web";
                    }
                  })();

                return (
                  <div className="mt-3 pt-2 text-xs select-none">
                    {/* Web Search Tab Header */}
                    <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 border border-black/20 dark:border-white/20 text-black dark:text-white font-extrabold shadow-2xs">
                      {/* Favicon of the first source ONLY */}
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${firstDomain}&sz=32`}
                        alt={firstDomain}
                        className="w-4 h-4 rounded-xs shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <span className="text-xs font-black uppercase tracking-wider">
                        Web Search
                      </span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-black/10 dark:bg-white/20">
                        {message.sources.length}
                      </span>
                    </div>

                    {/* Sources citations within the tab view in clean black & white */}
                    <div className="flex flex-wrap gap-2 mt-2.5">
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
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white dark:bg-black text-black dark:text-white border border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 transition-all shadow-2xs group"
                            title={src.snippet || src.title}
                          >
                            <span className="truncate max-w-[150px] font-mono font-bold text-[11px]">
                              {domainName}
                            </span>
                            <ExternalLink className="w-3 h-3 shrink-0 text-black/50 dark:text-white/50 group-hover:text-black dark:group-hover:text-white transition-colors" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Action details footer */}
              <div className="flex items-center space-x-2.5 mt-2 text-[11px] text-black/50 dark:text-white/50 font-bold">
                <span>{message.timestamp}</span>

                {/* Copy button */}
                <button
                  type="button"
                  onClick={() => handleCopyText(message.text)}
                  className="hover:text-black dark:hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                  title="Copy message"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-black dark:text-white stroke-[3]" />
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
                      ? "text-black dark:text-white font-black animate-pulse"
                      : "hover:text-black dark:hover:text-white"
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
