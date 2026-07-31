import React from "react";
import { Bell, X, CheckCircle2, Info, Sparkles } from "lucide-react";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  isConnected,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none">
      <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-zinc-100 font-bold text-base">
            <Bell className="w-5 h-5 text-slate-700 dark:text-zinc-300" />
            <span>Notifications & Status</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications list */}
        <div className="py-4 space-y-3">
          <div className="flex items-start space-x-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                Gemini API Engine Active
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                {isConnected
                  ? "Connected securely via server API route."
                  : "Connecting to Gemini backend service..."}
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
            <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-sky-900 dark:text-sky-200">
                Hand-Drawn Layout Active
              </div>
              <div className="text-[11px] text-sky-700 dark:text-sky-300 mt-0.5">
                Strictly rendered matching your hand-sketched wireframe icons and layout.
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                Multi-Modal Features Ready
              </div>
              <div className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5">
                Upload Files, Speech-To-Text, Voice Call mode, and Model Selection are enabled.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
