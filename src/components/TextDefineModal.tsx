import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Volume2, Copy, Check, Loader2, RefreshCw } from "lucide-react";
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
        throw new Error("Could not retrieve definition");
      }

      const data = await res.json();
      setDefinition(data.definition || `**${textToDefine}** is a term from the conversation.`);
    } catch (err: any) {
      setError(err.message || "Failed to load definition");
      setDefinition(
        `${textToDefine}: An expression or term in this context.`
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
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Simple Floating Definition Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl max-h-[82vh] flex flex-col bg-white dark:bg-neutral-950 border border-black/15 dark:border-white/15 rounded-2xl shadow-2xl overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Clean Header: Speaker Icon + Selected Word(s) + Action Icons + Close Button */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 shrink-0 gap-3">
            <div className="flex items-center space-x-2.5 overflow-hidden min-w-0">
              {/* Speaker icon before the selected word */}
              <button
                type="button"
                onClick={() => onSpeak(selectedText)}
                className={`p-2 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:opacity-85 active:scale-95 transition-all cursor-pointer shadow-xs shrink-0 flex items-center justify-center ${
                  isSpeaking ? "ring-2 ring-sky-400 animate-pulse" : ""
                }`}
                title="Pronounce with Neural Voice"
              >
                {isSpeaking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Volume2 className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>

              {/* The Selected Word(s) */}
              <div className="overflow-hidden min-w-0">
                <h3 className="text-base sm:text-lg font-black text-black dark:text-white truncate tracking-tight">
                  {selectedText}
                </h3>
              </div>
            </div>

            {/* Quick Actions (Copy & Close X) */}
            <div className="flex items-center space-x-1 shrink-0">
              <button
                type="button"
                onClick={handleCopyDefinition}
                className="p-2 rounded-xl text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 active:scale-90 transition-colors cursor-pointer"
                title="Copy definition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500 stroke-[3]" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Simple Clean Definition Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
                <p className="text-xs font-bold text-black/60 dark:text-white/60">
                  Getting definition...
                </p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200">
                <p className="text-xs font-semibold mb-2">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchDefinition(selectedText, contextText)}
                  className="px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold text-xs inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            ) : (
              <div className="markdown-body text-black dark:text-white text-sm sm:text-base leading-relaxed font-normal space-y-3">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p({ children }) {
                      return <p className="mb-2.5 text-black/90 dark:text-white/90">{children}</p>;
                    },
                    strong({ children }) {
                      return <strong className="font-extrabold text-black dark:text-white">{children}</strong>;
                    },
                    ul({ children }) {
                      return <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>;
                    },
                    li({ children }) {
                      return <li className="text-black/85 dark:text-white/85">{children}</li>;
                    },
                  }}
                >
                  {definition}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
