import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Volume2, Copy, Check, Loader2, CheckSquare } from "lucide-react";

export interface SelectionCoordinates {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface TextSelectionBubbleProps {
  selectedText: string;
  coords: SelectionCoordinates;
  onDefine: (text: string) => void;
  onSpeak: (text: string) => void;
  onSelectAll?: () => void;
  isSpeaking?: boolean;
  onClose?: () => void;
}

export const TextSelectionBubble: React.FC<TextSelectionBubbleProps> = ({
  selectedText,
  coords,
  onDefine,
  onSpeak,
  onSelectAll,
  isSpeaking = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent | React.TouchEvent) => {
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

  const handleDefine = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDefine(selectedText);
  };

  const handleSpeak = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSpeak(selectedText);
  };

  const handleSelectAll = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSelectAll) {
      onSelectAll();
    }
  };

  // Menu dimensions and positioning for sleek Phone-Style Floating Callout Bar
  const menuWidth = 270;
  const menuHeight = 40;
  const screenPadding = 10;

  let leftPos = coords.x - menuWidth / 2;
  if (leftPos < screenPadding) leftPos = screenPadding;
  if (leftPos + menuWidth > window.innerWidth - screenPadding) {
    leftPos = window.innerWidth - menuWidth - screenPadding;
  }

  // Arrow offset relative to pill
  const arrowOffset = Math.max(16, Math.min(menuWidth - 16, coords.x - leftPos));

  let topPos = coords.y - menuHeight - 12;
  let isAbove = true;
  if (topPos < screenPadding + 44) {
    // If too tight on top, place below the selection
    topPos = coords.y + (coords.height || 26) + 12;
    isAbove = false;
  }

  return (
    <motion.div
      data-ai-bubble="true"
      initial={{ opacity: 0, scale: 0.92, y: isAbove ? 6 : -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: isAbove ? 4 : -4 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
      style={{
        position: "fixed",
        left: `${leftPos}px`,
        top: `${topPos}px`,
        width: `${menuWidth}px`,
        zIndex: 99999,
      }}
      className="select-none pointer-events-auto filter drop-shadow-xl"
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Sleek Phone-Style Horizontal Floating Action Bar */}
      <div className="relative flex items-center justify-between bg-neutral-900/95 dark:bg-neutral-900/95 text-white backdrop-blur-md rounded-2xl border border-neutral-700/80 shadow-2xl px-1.5 py-1">
        {/* 1. DEFINE BUTTON */}
        <button
          type="button"
          onClick={handleDefine}
          onTouchEnd={handleDefine}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl hover:bg-white/15 active:bg-white/25 transition-colors text-xs font-semibold cursor-pointer text-white shrink-0 group"
          title="Define & Explain with AI"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400 group-hover:rotate-12 transition-transform" />
          <span className="text-[12px] tracking-tight">Define</span>
        </button>

        {/* Divider */}
        <div className="w-[1px] h-3.5 bg-white/20 shrink-0" />

        {/* 2. SPEAK BUTTON */}
        <button
          type="button"
          onClick={handleSpeak}
          onTouchEnd={handleSpeak}
          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl hover:bg-white/15 active:bg-white/25 transition-colors text-xs font-semibold cursor-pointer text-white shrink-0 ${
            isSpeaking ? "bg-white/20 text-sky-300 font-bold" : ""
          }`}
          title="Pronounce with Voice Model"
        >
          {isSpeaking ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-300" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-sky-400" />
          )}
          <span className="text-[12px] tracking-tight">Speak</span>
        </button>

        {/* Divider */}
        <div className="w-[1px] h-3.5 bg-white/20 shrink-0" />

        {/* 3. COPY BUTTON */}
        <button
          type="button"
          onClick={handleCopy}
          onTouchEnd={handleCopy}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl hover:bg-white/15 active:bg-white/25 transition-colors text-xs font-semibold cursor-pointer text-white shrink-0"
          title="Copy selected text"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-neutral-300" />
          )}
          <span className={`text-[12px] tracking-tight ${copied ? "text-emerald-400 font-bold" : ""}`}>
            {copied ? "Copied" : "Copy"}
          </span>
        </button>

        {/* Divider */}
        {onSelectAll && <div className="w-[1px] h-3.5 bg-white/20 shrink-0" />}

        {/* 4. SELECT ALL BUTTON */}
        {onSelectAll && (
          <button
            type="button"
            onClick={handleSelectAll}
            onTouchEnd={handleSelectAll}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl hover:bg-white/15 active:bg-white/25 transition-colors text-xs font-semibold cursor-pointer text-white shrink-0"
            title="Select all text in message"
          >
            <CheckSquare className="w-3.5 h-3.5 text-neutral-300" />
            <span className="text-[12px] tracking-tight">All</span>
          </button>
        )}

        {/* Downward / Upward Pointer Arrow */}
        {isAbove ? (
          <div
            style={{ left: `${arrowOffset}px` }}
            className="absolute -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-neutral-900/95 border-r border-b border-neutral-700/80 rotate-45 pointer-events-none"
          />
        ) : (
          <div
            style={{ left: `${arrowOffset}px` }}
            className="absolute -top-1.5 -translate-x-1/2 w-3 h-3 bg-neutral-900/95 border-l border-t border-neutral-700/80 rotate-45 pointer-events-none"
          />
        )}
      </div>
    </motion.div>
  );
};
