import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { BookOpen, Volume2, Copy, Check, Sparkles, Loader2 } from "lucide-react";

export interface SelectionCoordinates {
  x: number;
  y: number;
  width?: number;
  height?: number;
  placement?: "top" | "bottom";
}

interface TextSelectionBubbleProps {
  selectedText: string;
  coords: SelectionCoordinates;
  onDefine: (text: string) => void;
  onSpeak: (text: string) => void;
  isSpeaking?: boolean;
  onClose?: () => void;
}

export const TextSelectionBubble: React.FC<TextSelectionBubbleProps> = ({
  selectedText,
  coords,
  onDefine,
  onSpeak,
  isSpeaking = false,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(selectedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.warn("Failed to copy selected text:", err);
    }
  };

  const handleDefine = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDefine(selectedText);
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSpeak(selectedText);
  };

  // Compute safe screen positioning
  const bubbleWidth = 220;
  const bubbleHeight = 44;
  const screenPadding = 12;

  let leftPos = coords.x - bubbleWidth / 2;
  if (leftPos < screenPadding) leftPos = screenPadding;
  if (leftPos + bubbleWidth > window.innerWidth - screenPadding) {
    leftPos = window.innerWidth - bubbleWidth - screenPadding;
  }

  let topPos = coords.y - bubbleHeight - 8;
  let isAbove = true;
  if (topPos < screenPadding + 50) {
    // If not enough room on top, place below the selection
    topPos = coords.y + (coords.height || 24) + 8;
    isAbove = false;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: isAbove ? 6 : -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: isAbove ? 4 : -4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={{
        position: "fixed",
        left: `${leftPos}px`,
        top: `${topPos}px`,
        zIndex: 99999,
      }}
      className="select-none pointer-events-auto"
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Pop Bubble Shaped Card */}
      <div className="relative flex items-center bg-black dark:bg-white text-white dark:text-black rounded-xl px-1.5 py-1 shadow-2xl border border-white/20 dark:border-black/20 backdrop-blur-md">
        {/* Define Action */}
        <button
          type="button"
          onClick={handleDefine}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/15 dark:hover:bg-black/15 active:scale-95 transition-all text-xs font-black cursor-pointer group"
          title="Define & Explain with Kelvis AI"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-300 dark:text-sky-600 group-hover:rotate-12 transition-transform" />
          <span className="font-extrabold tracking-tight">Define</span>
        </button>

        <div className="w-[1px] h-4 bg-white/20 dark:bg-black/20 my-auto mx-0.5" />

        {/* Speak Action (Groq canopylabs/orpheus-v1-english) */}
        <button
          type="button"
          onClick={handleSpeak}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/15 dark:hover:bg-black/15 active:scale-95 transition-all text-xs font-black cursor-pointer ${
            isSpeaking ? "bg-white/20 dark:bg-black/20 text-sky-300 dark:text-sky-700" : ""
          }`}
          title="Pronounce using Groq Neural TTS"
        >
          {isSpeaking ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-300 dark:text-sky-700" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
          <span className="font-extrabold tracking-tight">Speak</span>
        </button>

        <div className="w-[1px] h-4 bg-white/20 dark:bg-black/20 my-auto mx-0.5" />

        {/* Copy Action */}
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/15 dark:hover:bg-black/15 active:scale-95 transition-all text-xs font-black cursor-pointer"
          title="Copy selected text"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600 stroke-[3]" />
              <span className="text-emerald-300 dark:text-emerald-700 font-extrabold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="font-extrabold tracking-tight">Copy</span>
            </>
          )}
        </button>

        {/* Bubble Tail / Pointer */}
        {isAbove ? (
          <div
            className="absolute left-1/2 -bottom-[6px] -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black dark:border-t-white drop-shadow-xs pointer-events-none"
          />
        ) : (
          <div
            className="absolute left-1/2 -top-[6px] -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-black dark:border-b-white drop-shadow-xs pointer-events-none"
          />
        )}
      </div>
    </motion.div>
  );
};
