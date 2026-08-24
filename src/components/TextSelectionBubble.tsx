import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { Sparkles, Volume2, Copy, Check, Loader2 } from "lucide-react";

export interface SelectionCoordinates {
  x: number;
  y: number;
  width?: number;
  height?: number;
  startRect?: { x: number; y: number; height: number };
  endRect?: { x: number; y: number; height: number };
  rects?: { x: number; y: number; width: number; height: number }[];
}

interface TextSelectionBubbleProps {
  selectedText: string;
  coords: SelectionCoordinates;
  onDefine: (text: string) => void;
  onSpeak: (text: string) => void;
  isSpeaking?: boolean;
  onClose?: () => void;
  onDragHandleMove?: (point: { x: number; y: number }, handleType: "start" | "end") => void;
}

export const TextSelectionBubble: React.FC<TextSelectionBubbleProps> = ({
  selectedText,
  coords,
  onDefine,
  onSpeak,
  isSpeaking = false,
  onClose,
  onDragHandleMove,
}) => {
  const [copied, setCopied] = useState(false);
  const isDraggingRef = useRef(false);

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

  // Pointer drag listeners using setPointerCapture for smooth mobile/desktop tracking
  const handlePointerDown = (handleType: "start" | "end") => (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (onDragHandleMove) {
      onDragHandleMove({ x: e.clientX, y: e.clientY }, handleType);
    }
  };

  const handlePointerMove = (handleType: "start" | "end") => (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    if (onDragHandleMove) {
      onDragHandleMove({ x: e.clientX, y: e.clientY }, handleType);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  // Safe screen positioning for square vertical pop-up
  const popupWidth = 140;
  const popupHeight = 120;
  const screenPadding = 12;

  let leftPos = coords.x - popupWidth / 2;
  if (leftPos < screenPadding) leftPos = screenPadding;
  if (leftPos + popupWidth > window.innerWidth - screenPadding) {
    leftPos = window.innerWidth - popupWidth - screenPadding;
  }

  let topPos = coords.y - popupHeight - 12;
  let isAbove = true;
  if (topPos < screenPadding + 50) {
    // If tight on top, place below the selection
    topPos = coords.y + (coords.height || 28) + 12;
    isAbove = false;
  }

  return (
    <>
      {/* Visual Selection Highlights with Thick Light Blue Borders & Perplexity-Style Fluid Drag Handles */}
      {coords.rects && coords.rects.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[99990]" data-ai-bubble="true">
          {coords.rects.map((r, i) => (
            <div
              key={i}
              style={{
                position: "fixed",
                left: `${r.x}px`,
                top: `${r.y}px`,
                width: `${r.width}px`,
                height: `${r.height}px`,
              }}
              className="border-t-2 border-b-2 border-sky-400 dark:border-sky-400 bg-sky-400/20 pointer-events-none"
            >
              {/* Thick Light Blue vertical line on first rect left edge */}
              {i === 0 && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-sky-400 dark:bg-sky-400 shadow-sm" />
              )}
              {/* Thick Light Blue vertical line on last rect right edge */}
              {i === coords.rects!.length - 1 && (
                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-sky-400 dark:bg-sky-400 shadow-sm" />
              )}
            </div>
          ))}

          {/* Left / Start Drag Handle Pin with generous touch target */}
          {coords.startRect && (
            <div
              data-drag-handle="true"
              style={{
                position: "fixed",
                left: `${coords.startRect.x - 16}px`,
                top: `${coords.startRect.y - 20}px`,
                width: "32px",
                height: "40px",
              }}
              className="pointer-events-auto cursor-ew-resize select-none touch-none z-[99995] flex items-center justify-center group"
              onPointerDown={handlePointerDown("start")}
              onPointerMove={handlePointerMove("start")}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              title="Drag to expand selection"
            >
              <div className="flex flex-col items-center">
                <div className="w-4.5 h-4.5 bg-sky-500 rounded-full border-2 border-white dark:border-black shadow-lg group-hover:scale-125 transition-transform" />
                <div className="w-1.5 h-4 bg-sky-500 rounded-full" />
              </div>
            </div>
          )}

          {/* Right / End Drag Handle Pin with generous touch target */}
          {coords.endRect && (
            <div
              data-drag-handle="true"
              style={{
                position: "fixed",
                left: `${coords.endRect.x - 16}px`,
                top: `${coords.endRect.y + coords.endRect.height - 20}px`,
                width: "32px",
                height: "40px",
              }}
              className="pointer-events-auto cursor-ew-resize select-none touch-none z-[99995] flex items-center justify-center group"
              onPointerDown={handlePointerDown("end")}
              onPointerMove={handlePointerMove("end")}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              title="Drag to expand selection"
            >
              <div className="flex flex-col items-center">
                <div className="w-1.5 h-4 bg-sky-500 rounded-full" />
                <div className="w-4.5 h-4.5 bg-sky-500 rounded-full border-2 border-white dark:border-black shadow-lg group-hover:scale-125 transition-transform" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pop-up: Square, straight-edge box with vertical stacked buttons */}
      <motion.div
        data-ai-bubble="true"
        initial={{ opacity: 0, scale: 0.92, y: isAbove ? 6 : -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: isAbove ? 4 : -4 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        style={{
          position: "fixed",
          left: `${leftPos}px`,
          top: `${topPos}px`,
          width: `${popupWidth}px`,
          zIndex: 99999,
        }}
        className="select-none pointer-events-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Square & Straight Edges Card Container */}
        <div className="relative flex flex-col bg-black dark:bg-white text-white dark:text-black rounded-none border-2 border-black dark:border-white shadow-2xl overflow-hidden">
          {/* 1. DEFINE BUTTON (Placed First on Top) */}
          <button
            type="button"
            onClick={handleDefine}
            onTouchEnd={handleDefine}
            className="w-full flex items-center justify-start space-x-2.5 px-3 py-2.5 hover:bg-neutral-800 dark:hover:bg-neutral-200 active:bg-neutral-700 dark:active:bg-neutral-300 transition-colors text-xs font-black cursor-pointer group text-left rounded-none"
            title="Define & Explain with Kelvis AI"
          >
            <Sparkles className="w-4 h-4 text-sky-400 dark:text-sky-600 group-hover:rotate-12 transition-transform shrink-0" />
            <span className="font-extrabold tracking-tight text-[13px]">Define</span>
          </button>

          {/* Straight horizontal separator */}
          <div className="w-full h-[1px] bg-white/20 dark:bg-black/20" />

          {/* 2. SPEAK BUTTON (Groq canopylabs/orpheus-v1-english) */}
          <button
            type="button"
            onClick={handleSpeak}
            onTouchEnd={handleSpeak}
            className={`w-full flex items-center justify-start space-x-2.5 px-3 py-2.5 hover:bg-neutral-800 dark:hover:bg-neutral-200 active:bg-neutral-700 dark:active:bg-neutral-300 transition-colors text-xs font-black cursor-pointer text-left rounded-none ${
              isSpeaking ? "bg-neutral-800 dark:bg-neutral-200 text-sky-300 dark:text-sky-700" : ""
            }`}
            title="Pronounce with Groq Neural TTS"
          >
            {isSpeaking ? (
              <Loader2 className="w-4 h-4 animate-spin text-sky-300 dark:text-sky-700 shrink-0" />
            ) : (
              <Volume2 className="w-4 h-4 shrink-0" />
            )}
            <span className="font-extrabold tracking-tight text-[13px]">Speak</span>
          </button>

          {/* Straight horizontal separator */}
          <div className="w-full h-[1px] bg-white/20 dark:bg-black/20" />

          {/* 3. COPY BUTTON */}
          <button
            type="button"
            onClick={handleCopy}
            onTouchEnd={handleCopy}
            className="w-full flex items-center justify-start space-x-2.5 px-3 py-2.5 hover:bg-neutral-800 dark:hover:bg-neutral-200 active:bg-neutral-700 dark:active:bg-neutral-300 transition-colors text-xs font-black cursor-pointer text-left rounded-none"
            title="Copy selected text"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400 stroke-[3] shrink-0" />
            ) : (
              <Copy className="w-4 h-4 shrink-0" />
            )}
            <span className="font-extrabold tracking-tight text-[13px]">
              {copied ? "Copied!" : "Copy"}
            </span>
          </button>
        </div>
      </motion.div>
    </>
  );
};
