import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  Smartphone,
  Monitor,
  Share,
  PlusSquare,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Zap,
  Layers,
  ArrowRight,
  Laptop
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  isInstallable: boolean;
  onInstalled?: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  isInstallable,
  onInstalled,
}) => {
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop" | "other">("desktop");
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Detect if already installed / running in standalone mode
    const checkStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");
    setIsStandalone(Boolean(checkStandalone));

    // Detect user platform / OS
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform("ios");
    } else if (/android/.test(ua)) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }
  }, [isOpen]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setInstallSuccess(true);
          if (onInstalled) onInstalled();
        }
      } catch (err) {
        console.warn("PWA install error:", err);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Fallback instruction for browsers without active deferred prompt (or iframe preview)
      setIsInstalling(true);
      setTimeout(() => {
        setIsInstalling(false);
      }, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800/80 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black shadow-md">
              <Sparkles className="w-5 h-5 text-sky-400 dark:text-sky-500" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
                <span>Install Kelvis AI</span>
                {isStandalone && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                    Active App
                  </span>
                )}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                Desktop & Mobile Standalone Web App
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Status banner if already running in standalone mode */}
          {isStandalone ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-sm">Kelvis AI is Already Installed!</p>
                <p className="opacity-90">
                  You are currently using Kelvis in standalone app mode with native hardware speed and full offline caching.
                </p>
              </div>
            </div>
          ) : installSuccess ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-sm">Installation Prompt Accepted!</p>
                <p className="opacity-90">
                  Kelvis AI is being added to your application launcher, desktop taskbar, and home screen.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Main 1-Click Install Button if Native DeferredPrompt is available */}
              {deferredPrompt ? (
                <div className="p-5 rounded-2xl bg-black text-white dark:bg-white dark:text-black shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <p className="font-extrabold text-sm sm:text-base flex items-center justify-center sm:justify-start space-x-2">
                      <Download className="w-4 h-4 text-sky-400 dark:text-sky-600" />
                      <span>Ready to Install</span>
                    </p>
                    <p className="text-xs opacity-80 max-w-xs font-medium">
                      Add to your desktop taskbar or mobile home screen with one click.
                    </p>
                  </div>
                  <button
                    onClick={handleInstallClick}
                    disabled={isInstalling}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    {isInstalling ? (
                      <span>Installing...</span>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Install App Now</span>
                      </>
                    )}
                  </button>
                </div>
              ) : null}

              {/* Platform-Specific Step-by-Step Guides */}
              {platform === "ios" ? (
                /* iOS Safari Guide */
                <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-300 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center space-x-2 text-neutral-900 dark:text-neutral-100 font-bold text-xs uppercase tracking-wide">
                    <Smartphone className="w-4 h-4 text-sky-500" />
                    <span>How to Install on iPhone / iPad (Safari)</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 shadow-2xs">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
                        1
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          Tap the <strong className="text-sky-500">Share</strong> button in Safari
                        </span>
                        <Share className="w-4 h-4 text-sky-500 shrink-0 ml-2" />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 shadow-2xs">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
                        2
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          Scroll down and tap <strong className="text-neutral-900 dark:text-white">Add to Home Screen</strong>
                        </span>
                        <PlusSquare className="w-4 h-4 text-neutral-700 dark:text-neutral-300 shrink-0 ml-2" />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 shadow-2xs">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
                        3
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          Tap <strong className="text-neutral-900 dark:text-white">Add</strong> at top right to launch from your home screen.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Desktop & Android Guide */
                <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-300 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center space-x-2 text-neutral-900 dark:text-neutral-100 font-bold text-xs uppercase tracking-wide">
                    {platform === "android" ? (
                      <Smartphone className="w-4 h-4 text-sky-500" />
                    ) : (
                      <Monitor className="w-4 h-4 text-sky-500" />
                    )}
                    <span>
                      {platform === "android"
                        ? "Android Chrome / Samsung Internet"
                        : "Chrome / Edge / Brave / Desktop Installation"}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 space-y-1.5 shadow-2xs">
                      <p className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center space-x-1.5">
                        <span>Method 1: Browser Address Bar</span>
                      </p>
                      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-[11px]">
                        Look at the right side of your browser URL address bar for the{" "}
                        <strong className="text-neutral-900 dark:text-neutral-100 bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded font-mono">
                          Install App ⊕
                        </strong>{" "}
                        or computer icon, and click <strong>Install</strong>.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 space-y-1.5 shadow-2xs">
                      <p className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center space-x-1.5">
                        <span>Method 2: Browser Options Menu (⋮)</span>
                      </p>
                      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-[11px]">
                        Click the <strong>3 dots (⋮)</strong> at top right of Chrome / Edge → Select{" "}
                        <strong>"Install Kelvis AI"</strong> or <strong>"Save and Share" → "Install page as app"</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Hybrid App Benefits Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 flex items-start space-x-2.5">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-neutral-900 dark:text-neutral-100">Zero Startup Delay</p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Launches instantly from taskbar or mobile dock.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 flex items-start space-x-2.5">
                  <Laptop className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-neutral-900 dark:text-neutral-100">Standalone Window</p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Full-screen distraction-free workspace with no tabs.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
            PWA Standalone Engine • Offline Enabled
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
