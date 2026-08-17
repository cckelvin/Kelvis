import React from "react";
import { motion } from "motion/react";
import { FileCode, Sparkles } from "lucide-react";

export interface ActiveFileBannerProps {
  filename?: string;
  stepDescription?: string;
  stepIndex?: number;
  totalSteps?: number;
  isCompleted?: boolean;
}

export const ActiveFileBanner: React.FC<ActiveFileBannerProps> = ({
  filename = "index.html",
  stepDescription = "Building web structure and layout...",
  stepIndex = 1,
  totalSteps = 4,
  isCompleted = false,
}) => {
  return (
    <div
      id="active-file-progress-banner"
      className="w-full -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-2 my-3 bg-slate-100/95 dark:bg-zinc-900/95 backdrop-blur-md border-y border-slate-300/80 dark:border-zinc-800/90 shadow-xs flex items-center justify-between transition-all select-none overflow-hidden"
    >
      {/* Left side: Rotating Dotted Circle + File Name */}
      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
        {/* Circle Dotted Rotate Animation */}
        <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
          {!isCompleted ? (
            <svg
              className="w-5 h-5 animate-spin text-amber-500 dark:text-amber-400"
              viewBox="0 0 24 24"
              fill="none"
              style={{ animationDuration: "2.4s" }}
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray="2 3.5"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">
              ✓
            </div>
          )}
          {/* Subtle center pulsing core */}
          {!isCompleted && (
            <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-ping opacity-75" />
          )}
        </div>

        {/* File Name Tag */}
        <div className="flex items-center space-x-1.5 min-w-0">
          <FileCode className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 shrink-0" />
          <span className="font-mono text-xs font-bold text-slate-900 dark:text-zinc-100 tracking-tight truncate">
            {filename}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 hidden sm:inline truncate">
            — {stepDescription}
          </span>
        </div>
      </div>

      {/* Right side: Step status indicator */}
      <div className="flex items-center space-x-2 shrink-0">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700">
          {stepIndex}/{totalSteps}
        </span>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 hidden xs:inline">
          {isCompleted ? "DONE" : "WORKING"}
        </span>
      </div>
    </div>
  );
};
