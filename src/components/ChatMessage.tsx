import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "motion/react";
import { Message } from "../types";
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
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { CodePreviewModal } from "./CodePreviewModal";

interface CodeBlockItemProps {
  lang: string;
  codeString: string;
  blockIdx: number;
  canRun: boolean;
  copiedBlockIndex: number | null;
  onCopy: (code: string, idx: number) => void;
  onPreview: (code: string, lang: string) => void;
}

const CodeBlockItem: React.FC<CodeBlockItemProps> = ({
  lang,
  codeString,
  blockIdx,
  canRun,
  copiedBlockIndex,
  onCopy,
  onPreview,
}) => {
  const lineCount = codeString.split("\n").length;
  // Long code blocks (> 10 lines) default to collapsed to save space, but can be easily toggled
  const [isCollapsed, setIsCollapsed] = useState<boolean>(lineCount > 10);

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 shadow-lg text-xs font-mono transition-all">
      {/* Code Box Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-sans select-none">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center space-x-1.5 hover:text-white transition-colors cursor-pointer"
            title={isCollapsed ? "Expand code" : "Collapse code"}
          >
            <Code className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold uppercase tracking-wider text-slate-200">
              {lang}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 font-mono">
              {lineCount} {lineCount === 1 ? "line" : "lines"}
            </span>
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 text-amber-400 ml-0.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            )}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Collapse/Expand Toggle Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[10px] font-semibold"
          >
            {isCollapsed ? "Expand" : "Collapse"}
          </button>

          {/* Runnable button if HTML / JS / CSS / TS */}
          {canRun && (
            <button
              type="button"
              onClick={() => onPreview(codeString, lang)}
              className="px-2 py-0.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center space-x-1 transition-colors"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run Preview</span>
            </button>
          )}

          {/* Copy Button */}
          <button
            type="button"
            onClick={() => onCopy(codeString, blockIdx)}
            className="hover:text-white p-1 rounded-md transition-colors flex items-center space-x-1"
            title="Copy Code"
          >
            {copiedBlockIndex === blockIdx ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
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

      {/* Code Body vs Collapsed Summary */}
      {isCollapsed ? (
        <div
          onClick={() => setIsCollapsed(false)}
          className="p-3 bg-slate-950/90 hover:bg-slate-900/80 text-slate-400 text-xs font-sans cursor-pointer flex items-center justify-between italic transition-colors group"
        >
          <span className="truncate flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            <span>Collapsed {lineCount} lines of {lang.toUpperCase()} code to save space.</span>
          </span>
          <span className="text-[11px] text-emerald-400 not-italic font-semibold shrink-0 ml-2 group-hover:underline">
            Click to Expand →
          </span>
        </div>
      ) : (
        <pre className="p-3.5 overflow-x-auto leading-relaxed text-[12px] bg-slate-950/90 text-slate-200">
          <code>{codeString}</code>
        </pre>
      )}
    </div>
  );
};

interface ChatMessageProps {
  message: Message;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSpeak,
  isSpeaking,
  onStopSpeaking,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedBlockIndex, setCopiedBlockIndex] = useState<number | null>(null);
  const [previewCode, setPreviewCode] = useState<{ code: string; language: string } | null>(null);

  const isUser = message.role === "user";

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

  // Helper to test if code is runnable (HTML, JS, CSS, TS)
  const isRunnableCode = (lang: string, codeStr: string) => {
    const l = lang.toLowerCase();
    if (l === "html" || l === "js" || l === "javascript" || l === "css" || l === "ts" || l === "typescript") {
      return true;
    }
    if (codeStr.includes("<html") || codeStr.includes("<div") || codeStr.includes("function") || codeStr.includes("const ")) {
      return true;
    }
    return false;
  };

  // Pre-process highlights: replace ==text== with <mark>text</mark>
  const processedText = message.text ? message.text.replace(/==(.*?)==/g, "<mark>$1</mark>") : "";

  return (
    <>
      {/* GPT-style smooth entering motion animation */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`flex w-full my-3 px-2 sm:px-4 ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        <div
          className={`flex items-start max-w-[92%] sm:max-w-[85%] md:max-w-[78%] ${
            isUser ? "flex-row-reverse space-x-reverse space-x-2" : "flex-row space-x-3"
          }`}
        >
          {/* Kelvis AI Icon Avatar */}
          {!isUser && (
            <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-sm mt-0.5 border border-slate-700 dark:border-zinc-300">
              <Sparkles className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            </div>
          )}

          {/* Message Content Body */}
          <div className="flex flex-col min-w-0">
            {/* Main Bubble */}
            <div
              className={`px-4 py-3 rounded-2xl relative group transition-all text-sm leading-relaxed ${
                isUser
                  ? "bg-slate-900 text-white dark:bg-zinc-200 dark:text-zinc-900 rounded-tr-xs shadow-sm font-medium"
                  : "bg-slate-100/90 dark:bg-zinc-800/90 text-slate-800 dark:text-zinc-100 rounded-tl-xs border border-slate-300 dark:border-zinc-700/80 shadow-2xs"
              }`}
            >
              {/* Attached files preview if user message */}
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

              {/* Generated image if AI returned image */}
              {message.image && (
                <div className="mb-3 overflow-hidden rounded-xl border border-slate-300 dark:border-zinc-700">
                  <img
                    src={message.image}
                    alt="AI Generated Content"
                    className="w-full max-h-80 object-cover rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Message Text with Markdown, Table & Code Box Support */}
              <div className="markdown-body space-y-2 select-text">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Custom Table Rendering
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
                    // Custom Code Block rendering inside Box with Header and Run Button
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      const lang = match ? match[1] : "code";
                      const codeString = String(children).replace(/\n$/, "");
                      const blockIdx = Math.abs(codeString.length + (lang.length * 10));

                      if (!inline && (match || codeString.includes("\n"))) {
                        const canRun = isRunnableCode(lang, codeString);
                        return (
                          <CodeBlockItem
                            lang={lang}
                            codeString={codeString}
                            blockIdx={blockIdx}
                            canRun={canRun}
                            copiedBlockIndex={copiedBlockIndex}
                            onCopy={handleCopyText}
                            onPreview={(code, language) =>
                              setPreviewCode({ code, language })
                            }
                          />
                        );
                      }

                      return (
                        <code
                          className="px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-zinc-700/80 font-mono text-[12px] text-slate-900 dark:text-zinc-100 font-semibold"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    p({ children }) {
                      return <p className="leading-relaxed my-1.5">{children}</p>;
                    },
                    blockquote({ children }) {
                      return (
                        <blockquote className="my-3 border-l-3 border-amber-500/90 dark:border-amber-400 pl-3.5 py-2 bg-slate-100/80 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-200 font-medium italic rounded-r-xl shadow-2xs">
                          {children}
                        </blockquote>
                      );
                    },
                    h1({ children }) {
                      return (
                        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-4 mb-2 border-b border-slate-200 dark:border-zinc-800 pb-1">
                          {children}
                        </h1>
                      );
                    },
                    h2({ children }) {
                      return (
                        <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-amber-300 mt-3.5 mb-1.5 flex items-center space-x-2">
                          <span>{children}</span>
                        </h2>
                      );
                    },
                    h3({ children }) {
                      return (
                        <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-zinc-200 mt-3 mb-1">
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
                      return <hr className="my-4 border-slate-300 dark:border-zinc-800" />;
                    },
                    strong({ children }) {
                      return <strong className="font-bold text-slate-900 dark:text-white bg-amber-100/60 dark:bg-amber-900/30 px-1 rounded-xs">{children}</strong>;
                    },
                    mark({ children }) {
                      return <mark className="bg-amber-200 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 px-1 py-0.5 rounded-xs font-semibold">{children}</mark>;
                    }
                  }}
                >
                  {processedText}
                </ReactMarkdown>
              </div>

              {/* Interactive Spotify Player Card */}
              {message.spotifyTrack && (
                <div className="mt-3 p-3 rounded-2xl bg-zinc-950 border border-emerald-500/40 text-white shadow-lg overflow-hidden select-none">
                  {/* Spotify Header */}
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

                  {/* Track Info */}
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

                  {/* Spotify Embed Web Player */}
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

              {/* Searched Web Sources & Domain Badges below response */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-zinc-800 text-xs select-none">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </div>
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700 dark:text-cyan-400">
                      Searched Live Web Sources ({message.sources.length})
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
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700/80 hover:border-cyan-500 dark:hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-all shadow-xs group"
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
            </div>

            {/* Footer Actions under message */}
            <div
              className={`flex items-center space-x-2 mt-1 text-[11px] text-slate-400 dark:text-zinc-500 ${
                isUser ? "justify-end" : "justify-start pl-1"
              }`}
            >
              <span>{message.timestamp}</span>

              {/* Copy button */}
              <button
                onClick={() => handleCopyText(message.text)}
                className="hover:text-slate-700 dark:hover:text-zinc-300 p-0.5 rounded transition-colors"
                title="Copy full message"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Text-to-Speech / Speak AI response */}
              {!isUser && (
                <button
                  onClick={() => {
                    if (isSpeaking) {
                      onStopSpeaking();
                    } else {
                      onSpeak(message.text);
                    }
                  }}
                  className={`p-0.5 rounded transition-colors ${
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
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Code Runner Preview Modal */}
      {previewCode && (
        <CodePreviewModal
          isOpen={Boolean(previewCode)}
          onClose={() => setPreviewCode(null)}
          code={previewCode.code}
          language={previewCode.language}
        />
      )}
    </>
  );
};
