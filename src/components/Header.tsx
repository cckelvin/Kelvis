import React from "react";
import { MoreVertical, Menu, Plus, Sun, Moon, Download } from "lucide-react";

interface HeaderProps {
  chatTitle: string;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onOpenOptionsMenu: () => void;
  darkTheme?: boolean;
  onToggleTheme?: () => void;
  onOpenInstall?: () => void;
  isInstallable?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  chatTitle,
  onNewChat,
  onToggleSidebar,
  onOpenOptionsMenu,
  darkTheme,
  onToggleTheme,
  onOpenInstall,
  isInstallable,
}) => {
  return (
    <header className="bg-white/95 dark:bg-black/95 backdrop-blur-md px-4 py-3 flex items-center justify-between select-none relative border-b border-black/15 dark:border-white/15">
      {/* Left side: Menu toggle + Chat Title + Halfway Line extending right */}
      <div className="flex items-center space-x-3 flex-1 min-w-0 pr-4">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Title */}
        <span className="font-extrabold text-black dark:text-white tracking-wider text-sm sm:text-base uppercase shrink-0">
          {chatTitle || "NEW CONVERSATION"}
        </span>

        {/* Line extending halfway across top bar */}
        <div className="h-[2px] bg-black dark:bg-white w-1/2 max-w-[50%] ml-2 rounded-full opacity-80" />
      </div>

      {/* Right side: Install shortcut + Theme Toggle + NEW CHAT pill button + 3-dots options menu */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* Quick Install App Button */}
        {onOpenInstall && (
          <button
            onClick={onOpenInstall}
            className="p-1.5 rounded-full text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10 transition-colors border border-black/20 dark:border-white/20 cursor-pointer hidden xs:flex items-center space-x-1"
            title="Install Kelvis AI App / Desktop Shortcut"
          >
            <Download className="w-4 h-4 text-sky-500" />
          </button>
        )}

        {/* Quick Theme Toggle Button */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-full text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10 transition-colors border border-black/20 dark:border-white/20 cursor-pointer"
            title={darkTheme ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkTheme ? (
              <Sun className="w-4 h-4 text-white" />
            ) : (
              <Moon className="w-4 h-4 text-black" />
            )}
          </button>
        )}

        {/* Quick New Chat Button */}
        <button
          onClick={onNewChat}
          className="flex items-center space-x-1 px-3.5 py-1.5 rounded-full text-xs font-extrabold border border-black dark:border-white bg-black text-white dark:bg-white dark:text-black hover:opacity-85 transition-opacity cursor-pointer shadow-xs"
          title="Start New Chat"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">NEW CHAT</span>
        </button>

        {/* Three dots menu from sketch top right */}
        <button
          onClick={onOpenOptionsMenu}
          className="p-1.5 rounded-lg text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="More options"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
