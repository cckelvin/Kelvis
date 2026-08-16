import React, { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "motion/react";
import { Message, QuizPayload, GameType, GamePayload } from "../types";
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
  HelpCircle,
  Gamepad2,
  Award,
  Shield,
  Layers,
  Crosshair,
} from "lucide-react";
import { CodePreviewModal, ProjectFile } from "./CodePreviewModal";
import { ChartRenderer } from "./ChartRenderer";
import { TradingViewChart } from "./TradingViewChart";
import { extractQuizFromText, createTopicQuickQuiz } from "../utils/quizParser";

interface ParsedFile {
  name: string;
  code: string;
  language: string;
  lineCount: number;
}

// Custom Code Block Renderer Component
const CodeBlockItem: React.FC<{
  lang: string;
  filename?: string;
  codeString: string;
  blockIdx: number;
  canRun: boolean;
  copiedBlockIndex: number | null;
  onCopy: (code: string, idx: number) => void;
  onPreview: (code: string, lang: string, filename?: string) => void;
}> = ({
  lang,
  filename,
  codeString,
  blockIdx,
  canRun,
  copiedBlockIndex,
  onCopy,
  onPreview,
}) => {
  const lineCount = codeString.split("\n").length;

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-300 dark:border-zinc-700 bg-slate-900 dark:bg-zinc-950 text-slate-100 shadow-sm text-xs font-mono">
      {/* Code Box Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-800 dark:bg-zinc-900 border-b border-slate-700 dark:border-zinc-800 text-[11px] text-slate-300 dark:text-zinc-400 font-sans select-none">
        <div className="flex items-center space-x-2 min-w-0">
          <Code className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-bold uppercase tracking-wider text-slate-200">
            {filename || lang || "code"}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-700/80 dark:bg-zinc-800 text-slate-300 font-mono">
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Runnable button */}
          {canRun && (
            <button
              type="button"
              onClick={() => onPreview(codeString, lang, filename)}
              className="px-2 py-0.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Preview</span>
            </button>
          )}

          {/* Copy Button */}
          <button
            type="button"
            onClick={() => onCopy(codeString, blockIdx)}
            className="hover:text-white px-2 py-0.5 rounded-md hover:bg-slate-700 dark:hover:bg-zinc-800 transition-colors flex items-center space-x-1 cursor-pointer"
            title="Copy Code"
          >
            {copiedBlockIndex === blockIdx ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Body */}
      <pre className="p-3.5 overflow-x-auto leading-relaxed text-[12px] bg-slate-900/95 dark:bg-zinc-950 text-slate-200 select-text">
        <code>{codeString}</code>
      </pre>
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
  onOpenGame?: (game: GameType) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSpeak,
  isSpeaking,
  onStopSpeaking,
  isStreaming = false,
  onOpenQuiz,
  onOpenGame,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedBlockIndex, setCopiedBlockIndex] = useState<number | null>(null);
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

  // Parse code blocks for multi-file preview
  const { cleanBodyText, parsedFiles } = useMemo(() => {
    let text = message.text || "";

    // Strip out internal tags cleanly
    text = text.replace(/<(?:plan|think)>[\s\S]*?<\/(?:plan|think)>/gi, "").trim();

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
          filename = files.some((f) => f.name === "index.html") ? `page${autoCounter++}.html` : "index.html";
        } else if (lang === "css") {
          filename = files.some((f) => f.name === "style.css") ? `style${autoCounter++}.css` : "style.css";
        } else if (lang === "javascript" || lang === "js") {
          filename = files.some((f) => f.name === "app.js") ? `script${autoCounter++}.js` : "app.js";
        } else if (lang === "typescript" || lang === "ts") {
          filename = `script${autoCounter++}.ts`;
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

    setPreviewData({
      isOpen: true,
      initialFile: initialFile || (parsedFiles[0] ? parsedFiles[0].name : "index.html"),
      files: projectFiles,
    });
  };

  // If this is an empty placeholder message waiting for first stream chunk, don't show blank area
  if (!isUser && !cleanBodyText && !message.image && !message.spotifyTrack) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`flex w-full my-2.5 px-2 sm:px-4 ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        {isUser ? (
          /* User Message: Clean bubble on the right */
          <div className="flex items-start max-w-[90%] sm:max-w-[80%] md:max-w-[75%] flex-row-reverse space-x-reverse space-x-2">
            <div className="flex flex-col min-w-0 items-end">
              <div className="px-4 py-3 rounded-2xl bg-slate-900 text-white dark:bg-zinc-200 dark:text-zinc-900 rounded-tr-xs shadow-xs text-sm font-medium leading-relaxed select-text">
                {/* Attached files preview */}
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

              {/* Timestamp & copy */}
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
          /* AI Response: DIRECT ON STREAM - NOT IN A TAB OR CARD BOX */
          <div className="flex items-start w-full max-w-4xl space-x-3.5">
            {/* Kelvis AI Avatar */}
            <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs mt-1 border border-slate-700 dark:border-zinc-300">
              <Sparkles className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
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

              {/* Direct Markdown Content */}
              <div className="markdown-body text-slate-800 dark:text-zinc-100 text-sm sm:text-[15px] leading-relaxed select-text font-normal">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table({ children }) {
                      return (
                        <div className="my-3 overflow-x-auto rounded-xl border border-slate-300 dark:border-zinc-700 shadow-xs bg-white/60 dark:bg-zinc-900/60">
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
                        <th className="px-3.5 py-2.5 font-semibold text-slate-900 dark:text-zinc-100 text-[11px] sm:text-xs uppercase tracking-wider">
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return (
                        <td className="px-3.5 py-2 text-slate-700 dark:text-zinc-300 text-xs sm:text-sm">
                          {children}
                        </td>
                      );
                    },
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      const rawLang = (match ? match[1] : "code").toLowerCase();
                      const codeString = String(children).replace(/\n$/, "");
                      const blockIdx = Math.abs(codeString.length + (rawLang.length * 10));

                      // Check if this is an interactive Game specification
                      if (
                        !inline &&
                        (rawLang === "game" ||
                          rawLang === "games" ||
                          rawLang === "play" ||
                          (rawLang === "json" && (codeString.includes('"game"') || codeString.includes('"checkers"') || codeString.includes('"3d-shooter"'))))
                      ) {
                        try {
                          let gameType: GameType = "checkers";
                          let gameTitle = "Live Game vs Kelvis AI";
                          let gameDesc = "Play in real-time right inside your browser.";

                          if (codeString.trim().startsWith("{")) {
                            const parsed = JSON.parse(codeString);
                            if (parsed.game) gameType = parsed.game;
                            if (parsed.title) gameTitle = parsed.title;
                            if (parsed.description) gameDesc = parsed.description;
                          } else {
                            const trimmed = codeString.trim().toLowerCase();
                            if (trimmed.includes("chess")) gameType = "chess";
                            else if (trimmed.includes("whot") || trimmed.includes("card") || trimmed.includes("white")) gameType = "whot";
                            else if (trimmed.includes("shooter") || trimmed.includes("3d") || trimmed.includes("fire")) gameType = "3d-shooter";
                            else gameType = "checkers";
                          }

                          const gameIcons: Record<string, { icon: any; color: string; label: string; bg: string }> = {
                            checkers: { icon: Award, color: "text-red-500", label: "Checkers (Draughts)", bg: "from-red-500/15 via-rose-500/10 to-amber-500/10 border-red-500/30" },
                            chess: { icon: Shield, color: "text-amber-500", label: "Chess Master AI", bg: "from-amber-500/15 via-orange-500/10 to-amber-600/10 border-amber-500/30" },
                            cards: { icon: Layers, color: "text-emerald-500", label: "Whot & Classic Cards", bg: "from-emerald-500/15 via-teal-500/10 to-cyan-500/10 border-emerald-500/30" },
                            whot: { icon: Layers, color: "text-emerald-500", label: "Whot & Classic Cards", bg: "from-emerald-500/15 via-teal-500/10 to-cyan-500/10 border-emerald-500/30" },
                            "3d-shooter": { icon: Crosshair, color: "text-sky-500", label: "3D Battle Shooter (Free Fire)", bg: "from-sky-500/15 via-blue-500/10 to-cyan-500/10 border-sky-500/30" },
                            shooter: { icon: Crosshair, color: "text-sky-500", label: "3D Battle Shooter (Free Fire)", bg: "from-sky-500/15 via-blue-500/10 to-cyan-500/10 border-sky-500/30" },
                          };

                          const conf = gameIcons[gameType] || gameIcons.checkers;
                          const Icon = conf.icon;

                          return (
                            <div className={`my-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${conf.bg} border shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 select-none`}>
                              <div className="flex items-center space-x-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-md shrink-0 border border-slate-700">
                                  <Icon className="w-6 h-6" />
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                                      <Gamepad2 className="w-3.5 h-3.5 inline" />
                                      <span>Interactive Game</span>
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                                      Live AI
                                    </span>
                                  </div>
                                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-zinc-100">
                                    {gameTitle || conf.label}
                                  </h4>
                                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                    {gameDesc}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => onOpenGame && onOpenGame(gameType)}
                                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
                              >
                                <Play className="w-4 h-4 fill-current" />
                                <span>Start {gameType === "3d-shooter" ? "3D Shooter" : gameType === "whot" || gameType === "cards" ? "Whot Cards" : gameType.charAt(0).toUpperCase() + gameType.slice(1)}</span>
                              </button>
                            </div>
                          );
                        } catch (e) {
                          // Continue to regular code block
                        }
                      }

                      // Check if this is an interactive Quiz specification (Claude-style practice test)
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
                              title: parsed.title || "Interactive Practice Test",
                              topic: parsed.topic || "Knowledge Check",
                              questions: parsed.questions,
                            };
                            return (
                              <div className="my-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-600/10 border border-amber-500/40 dark:border-amber-500/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 select-none">
                                <div className="flex items-center space-x-3.5">
                                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
                                    <Zap className="w-5 h-5 fill-current" />
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                        Quick Knowledge Test
                                      </span>
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                                        {quizData.questions.length} Questions
                                      </span>
                                    </div>
                                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-zinc-100">
                                      {quizData.title || "Interactive Assessment"}
                                    </h4>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onOpenQuiz && onOpenQuiz(quizData)}
                                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
                                >
                                  <Play className="w-4 h-4 fill-current" />
                                  <span>Take Practice Test</span>
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
                          // Not valid JSON chart, continue to normal code block
                        }
                      }

                      if (!inline && (match || codeString.includes("\n"))) {
                        const matchingFile = parsedFiles.find(
                          (f) => f.code.trim() === codeString.trim()
                        );
                        const filename = matchingFile ? matchingFile.name : undefined;
                        const canRun = isRunnableCode(rawLang, codeString);

                        return (
                          <CodeBlockItem
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
                          />
                        );
                      }

                      return (
                        <code
                          className="px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-zinc-800 font-mono text-[12px] text-slate-900 dark:text-zinc-100 font-semibold"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    p({ children }) {
                      return <p className="leading-relaxed my-2">{children}</p>;
                    },
                    blockquote({ children }) {
                      return (
                        <blockquote className="my-3 border-l-3 border-emerald-500/90 dark:border-emerald-400 pl-3.5 py-1 text-slate-700 dark:text-zinc-300 font-medium italic">
                          {children}
                        </blockquote>
                      );
                    },
                    h1({ children }) {
                      return (
                        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-4 mb-2">
                          {children}
                        </h1>
                      );
                    },
                    h2({ children }) {
                      return (
                        <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-emerald-400 mt-3.5 mb-1.5">
                          {children}
                        </h2>
                      );
                    },
                    h3({ children }) {
                      return (
                        <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-zinc-100 mt-3 mb-1">
                          {children}
                        </h3>
                      );
                    },
                    ul({ children }) {
                      return <ul className="list-disc list-inside my-2 space-y-1 text-slate-700 dark:text-zinc-300">{children}</ul>;
                    },
                    ol({ children }) {
                      return <ol className="list-decimal list-inside my-2 space-y-1 text-slate-700 dark:text-zinc-300">{children}</ol>;
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

                {/* Animated Typing Cursor with Smooth Fade Out */}
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

                {/* Quick Practice Test Trigger */}
                {onOpenQuiz && message.text && message.text.length > 50 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (extractedQuiz) {
                        onOpenQuiz(extractedQuiz);
                      } else {
                        // Extract first heading or subject snippet for quiz generator
                        const firstLine = message.text.split("\n")[0].replace(/[#*`]/g, "").trim();
                        const dynamicQuiz = createTopicQuickQuiz(firstLine || "Knowledge Check", message.text);
                        onOpenQuiz(dynamicQuiz);
                      }
                    }}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 transition-colors cursor-pointer ml-1"
                    title="Take a quick Claude-style test on this topic"
                  >
                    <Zap className="w-3 h-3 fill-current text-amber-500" />
                    <span>Quick Test</span>
                  </button>
                )}
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
