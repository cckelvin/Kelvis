import React from "react";
import { MoreVertical, Menu, Plus, Sun, Moon, Activity } from "lucide-react";

interface HeaderProps {
  chatTitle: string;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onOpenOptionsMenu: () => void;
  darkTheme?: boolean;
  onToggleTheme?: () => void;
  onOpenBinanceMarket?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  chatTitle,
  onNewChat,
  onToggleSidebar,
  onOpenOptionsMenu,
  darkTheme,
  onToggleTheme,
  onOpenBinanceMarket,
}) => {
  return (
    <header className="bg-slate-50/90 dark:bg-zinc-900/90 backdrop-blur-md px-4 py-3 flex items-center justify-between select-none relative border-b border-slate-200/50 dark:border-zinc-800/50">
      {/* Left side: Menu toggle + Chat Title + Halfway Line extending right */}
      <div className="flex items-center space-x-3 flex-1 min-w-0 pr-4">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors shrink-0"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Title */}
        <span className="font-semibold text-slate-800 dark:text-zinc-100 tracking-wide text-sm sm:text-base uppercase shrink-0">
          {chatTitle || "NEW"}
        </span>

        {/* Line extending halfway across top bar */}
        <div className="h-[2px] bg-slate-700 dark:bg-zinc-300 w-1/2 max-w-[50%] ml-2 rounded-full opacity-80" />
      </div>

      {/* Right side: Binance Market + Theme Toggle + NEW CHAT pill button + 3-dots options menu */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* Binance Live Market Button */}
        {onOpenBinanceMarket && (
          <button
            type="button"
            onClick={onOpenBinanceMarket}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
            title="Open Live Binance Market Data & Charts"
          >
            <Activity className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Binance Live</span>
          </button>
        )}

        {/* Quick Theme Toggle Button */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-full text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-amber-400 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors border border-slate-300 dark:border-zinc-700"
            title={darkTheme ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkTheme ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        )}

        {/* Quick New Chat Button */}
        <button
          onClick={onNewChat}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-400 dark:border-zinc-600 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition-colors"
          title="Start New Chat"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">NEW CHAT</span>
        </button>

        {/* Three dots menu from sketch top right */}
        <button
          onClick={onOpenOptionsMenu}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
          title="More options"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
