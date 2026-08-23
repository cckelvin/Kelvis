import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Volume2, Copy, Check, BookOpen, Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface TextDefineModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  contextText?: string;
  onSpeak: (text: string) => void;
  isSpeaking?: boolean;
}

export const TextDefineModal: React.FC<TextDefineModalProps> = ({
  isOpen,
  onClose,
  selectedText,
  contextText,
  onSpeak,
  isSpeaking = false,
}) => {
  const [definition, setDefinition] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && selectedText) {
      fetchDefinition(selectedText, contextText);
    } else {
      setDefinition("");
      setIsLoading(false);
      setError(null);
    }
  }, [isOpen, selectedText, contextText]);

  const fetchDefinition = async (textToDefine: string, context?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/define-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToDefine,
          context: context || "",
        }),
      });

      if (!res.ok) {
        throw new Error("Could not retrieve definition at this time");
      }

      const data = await res.json();
      setDefinition(data.definition || `**${textToDefine}** is a term from the conversation.`);
    } catch (err: any) {
      setError(err.message || "Failed to load explanation");
      setDefinition(
        `### **${textToDefine}**\n\nCould not fetch real-time definition. You can ask Kelvis directly in the chat for more details.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyDefinition = async () => {
    try {
      await navigator.clipboard.writeText(`${selectedText}\n\n${definition}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn("Copy error:", e);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md">
        {/* Floating Page Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative w-full max-w-2xl max-h-[88vh] flex flex-col bg-white dark:bg-neutral-950 border border-black/15 dark:border-white/15 rounded-3xl shadow-2xl overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 shrink-0">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 -ml-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/15 active:scale-95 transition-colors cursor-pointer text-black dark:text-white"
                title="Go back to chat"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black shadow-xs shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-black dark:text-white tracking-tight flex items-center space-x-1.5">
                    <span>Kelvis Definition & Breakdown</span>
                    <Sparkles className="w-3.5 h-3.5 text-sky-500 fill-sky-500" />
                  </h3>
                  <p className="text-[11px] font-bold text-black/50 dark:text-white/50 truncate">
                    AI Concept Explainer & Reference
                  </p>
                </div>
              </div>
            </div>

            {/* Close 'X' Button to Go Back */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/15 active:scale-90 transition-all cursor-pointer"
              title="Close and go back"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Target Word Highlight Banner */}
          <div className="px-5 py-3.5 bg-sky-50/80 dark:bg-sky-950/40 border-b border-sky-200/80 dark:border-sky-900/60 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-2 overflow-hidden">
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300 shrink-0">
                Selected:
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-sky-200/90 dark:bg-sky-900/80 text-sky-950 dark:text-sky-100 font-extrabold text-sm sm:text-base border border-sky-300 dark:border-sky-700/80 truncate shadow-xs">
                "{selectedText}"
              </span>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              {/* Pronounce / Speak with Groq TTS */}
              <button
                type="button"
                onClick={() => onSpeak(selectedText)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95 text-xs font-black transition-all cursor-pointer shadow-xs ${
                  isSpeaking ? "ring-2 ring-sky-400 animate-pulse" : ""
                }`}
                title="Pronounce with Groq canopylabs/orpheus-v1-english"
              >
                {isSpeaking ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
                <span>Pronounce</span>
              </button>

              {/* Copy */}
              <button
                type="button"
                onClick={handleCopyDefinition}
                className="p-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/15 text-black dark:text-white active:scale-95 transition-colors cursor-pointer"
                title="Copy definition to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500 stroke-[3]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Definition Body / Markdown Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3.5 text-center">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-black text-black dark:text-white">
                    Synthesizing detailed definition...
                  </p>
                  <p className="text-xs font-bold text-black/50 dark:text-white/50">
                    Consulting knowledge base and contextual insights
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200">
                <p className="text-xs font-bold mb-2">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchDefinition(selectedText, contextText)}
                  className="px-3 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-black text-xs inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Definition</span>
                </button>
              </div>
            ) : (
              <div className="markdown-body text-black dark:text-white text-[15px] sm:text-[16px] leading-[1.75] font-medium space-y-4">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h3({ children }) {
                      return (
                        <h3 className="text-base sm:text-lg font-black text-black dark:text-white mt-4 mb-2 flex items-center space-x-1.5 border-b border-black/10 dark:border-white/10 pb-1.5">
                          {children}
                        </h3>
                      );
                    },
                    ul({ children }) {
                      return <ul className="list-disc pl-5 space-y-1.5 my-2.5">{children}</ul>;
                    },
                    li({ children }) {
                      return <li className="text-black/90 dark:text-white/90 font-semibold">{children}</li>;
                    },
                    p({ children }) {
                      return <p className="mb-3 text-black/85 dark:text-white/85">{children}</p>;
                    },
                    strong({ children }) {
                      return <strong className="font-black text-black dark:text-white">{children}</strong>;
                    },
                    code({ inline, children }: any) {
                      return (
                        <code className="px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/15 font-mono text-xs text-black dark:text-white font-bold">
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {definition}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-5 py-3.5 border-t border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-between shrink-0">
            <span className="text-[11px] font-bold text-black/50 dark:text-white/50">
              Powered by Groq & Kelvis Cognitive Engine
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-black text-xs hover:opacity-85 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              Back to Chat
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
