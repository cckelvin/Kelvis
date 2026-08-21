import React from "react";
import { FileCode, Check } from "lucide-react";

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
      className="w-full -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-2 my-3 bg-black/5 dark:bg-white/10 backdrop-blur-md border-y border-black/15 dark:border-white/15 shadow-xs flex items-center justify-between transition-all select-none overflow-hidden"
    >
      {/* Left side: Rotating Dotted Circle + File Name */}
      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
        {/* Circle Dotted Rotate Animation */}
        <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
          {!isCompleted ? (
            <svg
              className="w-5 h-5 animate-spin text-black dark:text-white"
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
            <div className="w-4 h-4 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-[10px] font-black">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          )}
          {/* Subtle center pulsing core */}
          {!isCompleted && (
            <div className="absolute w-1.5 h-1.5 rounded-full bg-black dark:bg-white animate-ping opacity-75" />
          )}
        </div>

        {/* File Name Tag */}
        <div className="flex items-center space-x-1.5 min-w-0">
          <FileCode className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />
          <span className="font-mono text-xs font-black text-black dark:text-white tracking-tight truncate">
            {filename}
          </span>
          <span className="text-[11px] font-bold text-black/60 dark:text-white/60 hidden sm:inline truncate">
            — {stepDescription}
          </span>
        </div>
      </div>

      {/* Right side: Step status indicator */}
      <div className="flex items-center space-x-2 shrink-0">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black font-mono tracking-wider bg-black/10 dark:bg-white/15 text-black dark:text-white border border-black/20 dark:border-white/20">
          {stepIndex}/{totalSteps}
        </span>
        <span className="text-[10px] font-black uppercase tracking-wider text-black dark:text-white hidden xs:inline">
          {isCompleted ? "DONE" : "WORKING"}
        </span>
      </div>
    </div>
  );
};
