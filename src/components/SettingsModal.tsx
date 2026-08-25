import React from "react";
import { X, Sliders, Sparkles, Moon, Sun, Volume2, Globe, Key, Download, Smartphone } from "lucide-react";
import { AppSettings } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenInstall?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenInstall,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none">
      <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-zinc-100 font-bold text-base">
            <Sliders className="w-5 h-5 text-slate-700 dark:text-zinc-300" />
            <span>AI Assistant Settings</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Controls */}
        <div className="py-4 space-y-4 text-sm">
          {/* System Prompt / Persona */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              System Instruction / Persona
            </label>
            <textarea
              value={settings.systemInstruction}
              onChange={(e) =>
                onUpdateSettings({ systemInstruction: e.target.value })
              }
              placeholder="e.g. You are a helpful, concise AI assistant..."
              rows={3}
              className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl p-3 text-slate-800 dark:text-zinc-100 text-xs focus:outline-hidden"
            />
          </div>

          {/* Custom API Keys Configuration */}
          <div className="p-3.5 rounded-2xl bg-sky-500/5 dark:bg-sky-900/20 border border-sky-500/20 dark:border-sky-700/30 space-y-3">
            <div className="flex items-center space-x-2 text-sky-700 dark:text-sky-300 font-bold text-xs">
              <Key className="w-4 h-4 text-sky-500" />
              <span>Custom API Credentials (Optional)</span>
            </div>
            
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Google Search API Key
              </label>
              <input
                type="password"
                value={settings.customGoogleApiKey || ""}
                onChange={(e) =>
                  onUpdateSettings({ customGoogleApiKey: e.target.value })
                }
                placeholder="AIzaSy..."
                className="w-full bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-zinc-100 text-xs focus:outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Google Search Engine ID (CX)
              </label>
              <input
                type="text"
                value={settings.customGoogleCx || ""}
                onChange={(e) =>
                  onUpdateSettings({ customGoogleCx: e.target.value })
                }
                placeholder="e.g. 017576564022800000000:abc123def"
                className="w-full bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-zinc-100 text-xs focus:outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Groq API Key
              </label>
              <input
                type="password"
                value={settings.customGroqApiKey || ""}
                onChange={(e) =>
                  onUpdateSettings({ customGroqApiKey: e.target.value })
                }
                placeholder="gsk_..."
                className="w-full bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-zinc-100 text-xs focus:outline-hidden font-mono"
              />
            </div>

            <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">
              Google search sourcing is always enabled. If custom keys are left empty, the application seamlessly uses default system keys.
            </p>
          </div>

          {/* Auto Voice Readout Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center space-x-2.5">
              <Volume2 className="w-4 h-4 text-emerald-500" />
              <div>
                <div className="font-semibold text-slate-800 dark:text-zinc-200 text-xs">
                  Auto Text-To-Speech Readout
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Automatically read AI responses aloud
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoVoiceRead}
              onChange={(e) =>
                onUpdateSettings({ autoVoiceRead: e.target.checked })
              }
              className="w-4 h-4 accent-slate-900 dark:accent-zinc-100 cursor-pointer"
            />
          </div>

          {/* Dark / Light Theme Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center space-x-2.5">
              {settings.darkTheme ? (
                <Moon className="w-4 h-4 text-amber-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <div>
                <div className="font-semibold text-slate-800 dark:text-zinc-200 text-xs">
                  Dark Atmosphere
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Switch visual appearance
                </div>
              </div>
            </div>
            <button
              onClick={() =>
                onUpdateSettings({ darkTheme: !settings.darkTheme })
              }
              className="px-3 py-1 text-xs font-semibold rounded-full border border-slate-400 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
            >
              {settings.darkTheme ? "Dark Mode" : "Light Mode"}
            </button>
          </div>

          {/* Install App / Shortcut Card */}
          {onOpenInstall && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-sky-500/10 dark:bg-sky-900/20 border border-sky-500/20 dark:border-sky-700/30">
              <div className="flex items-center space-x-2.5">
                <Download className="w-4 h-4 text-sky-500" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-zinc-200 text-xs">
                    Install Hybrid App (PWA)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Add shortcut to desktop or home screen
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenInstall();
                }}
                className="px-3 py-1 text-xs font-bold rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors cursor-pointer"
              >
                Install App
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
