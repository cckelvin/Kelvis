import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Volume2, Copy, Check, Loader2, CheckSquare, Maximize2 } from "lucide-react";

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
  onExpand?: () => void;
  onSelectAll?: () => void;
  isSpeaking?: boolean;
  onClose?: () => void;
}

export const TextSelectionBubble: React.FC<TextSelectionBubbleProps> = ({
  selectedText,
  coords,
  onDefine,
  onSpeak,
  onExpand,
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
      setTimeout(() => setCopied(false), 2000);
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

  const handleExpand = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onExpand) {
      onExpand();
    }
  };

  const handleSelectAll = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSelectAll) {
      onSelectAll();
    }
  };

  // Menu dimensions and positioning for clean vertically stacked popup
  const menuWidth = 146;
  let itemCount = 3;
  if (onExpand) itemCount++;
  if (onSelectAll) itemCount++;
  const menuHeight = itemCount * 42 + 4;
  const screenPadding = 10;

  let leftPos = coords.x - menuWidth / 2;
  if (leftPos < screenPadding) leftPos = screenPadding;
  if (leftPos + menuWidth > window.innerWidth - screenPadding) {
    leftPos = window.innerWidth - menuWidth - screenPadding;
  }

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
      initial={{ opacity: 0, scale: 0.94, y: isAbove ? 6 : -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: isAbove ? 4 : -4 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
      style={{
        position: "fixed",
        left: `${leftPos}px`,
        top: `${topPos}px`,
        width: `${menuWidth}px`,
        zIndex: 99999,
      }}
      className="select-none pointer-events-auto filter drop-shadow-2xl"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Vertically stacked menu items - Above each other */}
      <div className="relative flex flex-col bg-neutral-900/98 dark:bg-neutral-900/98 text-white backdrop-blur-md rounded-2xl border border-neutral-700/80 shadow-2xl overflow-hidden divide-y divide-white/15">
        {/* 1. DEFINE BUTTON */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={handleDefine}
          onTouchEnd={handleDefine}
          className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 hover:bg-white/15 active:bg-white/25 transition-colors text-xs font-semibold cursor-pointer text-left group"
          title="Define & Explain with AI"
        >
          <Sparkles className="w-4 h-4 text-sky-400 group-hover:rotate-12 transition-transform shrink-0" />
          <span className="text-[13px] tracking-tight font-medium">Define</span>
        </button>

        {/* 2. SPEAK BUTTON */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={handleSpeak}
          onTouchEnd={handleSpeak}
          className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 hover:bg-white/15 active:bg-white/25 transition-colors text-xs font-semibold cursor-pointer text-left ${
            isSpeaking ? "bg-white/20 text-sky-300 font-bold" : ""
          }`}
          title="Pronounce with Voice Model"
        >
          {isSpeaking ? (
            <Loader2 className="w-4 h-4 animate-spin text-sky-300 shrink-0" />
          ) : (
            <Volume2 className="w-4 h-4 text-sky-400 shrink-0" />
          )}
          <span className="text-[13px] tracking-tight font-medium">Speak</span>
        </button>

        {/* 3. COPY BUTTON */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={handleCopy}
          onTouchEnd={handleCopy}
          className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 hover:bg-white/15 active:bg-white/25 transition-colors text-xs font-semibold cursor-pointer text-left"
          title="Copy selected text"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-400 stroke-[3] shrink-0" />
          ) : (
            <Copy className="w-4 h-4 text-neutral-300 shrink-0" />
          )}
          <span
            className={`text-[13px] tracking-tight font-medium ${
              copied ? "text-emerald-400 font-bold" : ""
            }`}
          >
            {copied ? "Copied!" : "Copy"}
          </span>
        </button>

        {/* 4. EXPAND SELECTION BUTTON */}
        {onExpand && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={handleExpand}
            onTouchEnd={handleExpand}
            className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 hover:bg-white/15 active:bg-white/25 transition-colors text-xs font-semibold cursor-pointer text-left group"
            title="Expand selection to sentence or paragraph"
          >
            <Maximize2 className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform shrink-0" />
            <span className="text-[13px] tracking-tight font-medium">Expand</span>
          </button>
        )}

        {/* 5. SELECT ALL BUTTON */}
        {onSelectAll && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={handleSelectAll}
            onTouchEnd={handleSelectAll}
            className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 hover:bg-white/15 active:bg-white/25 transition-colors text-xs font-semibold cursor-pointer text-left"
            title="Select all text in message"
          >
            <CheckSquare className="w-4 h-4 text-neutral-300 shrink-0" />
            <span className="text-[13px] tracking-tight font-medium">Select All</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};
