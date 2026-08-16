import React from "react";
import {
  Settings,
  Bell,
  LayoutGrid,
  Globe,
  Plus,
  MessageSquare,
  Trash2,
  X,
  Sparkles,
  User,
} from "lucide-react";
import { ChatSession } from "../types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onOpenApps: () => void;
  onOpenAuth: () => void;
  userEmail?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onOpenSettings,
  onOpenNotifications,
  onOpenApps,
  onOpenAuth,
  userEmail,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay for mobile */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <aside className="fixed lg:static inset-y-0 left-0 z-50 w-80 bg-slate-100 dark:bg-zinc-900 border-r border-slate-300 dark:border-zinc-800 flex flex-col shadow-xl lg:shadow-none transition-all duration-200 select-none">
        {/* Top Header of Sidebar */}
        <div className="p-3 border-b border-slate-300 dark:border-zinc-800 flex items-center justify-between">
          {/* Icons: Settings, Bell, Apps (Box), Globe, Auth User */}
          <div className="flex items-center space-x-1 sm:space-x-1.5">
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenNotifications}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>
            {/* Apps Launcher Button right after Notifications */}
            <button
              type="button"
              onClick={() => {
                onOpenApps();
                if (window.innerWidth < 1024) onClose();
              }}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer"
              title="Apps (Binance, Bouk, Spotify, Wave Store)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <div
              className="p-1.5 text-slate-700 dark:text-zinc-300"
              title="Global Web Connect"
            >
              <Globe className="w-4 h-4" />
            </div>
            <button
              onClick={onOpenAuth}
              className={`p-1.5 rounded-lg transition-colors flex items-center ${
                userEmail
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                  : "hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
              }`}
              title={userEmail ? `Logged in as ${userEmail}` : "Supabase Account"}
            >
              <User className="w-4 h-4" />
            </button>
          </div>

          {/* "+ NEW CHAT" pill button */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                onNewChat();
                if (window.innerWidth < 1024) onClose();
              }}
              className="px-3 py-1.5 rounded-full border border-slate-800 dark:border-zinc-300 bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold flex items-center space-x-1 hover:opacity-90 transition-opacity shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>NEW CHAT</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 lg:hidden ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section title */}
        <div className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
          <span>Recent Enquiries</span>
          <Sparkles className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center py-8 px-4 text-slate-400 dark:text-zinc-600 text-xs">
              No chat history yet. Start a new conversation!
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`group relative flex items-start justify-between p-2.5 rounded-xl cursor-pointer border transition-all ${
                    isActive
                      ? "bg-slate-200/90 dark:bg-zinc-800/90 border-slate-400 dark:border-zinc-700 shadow-xs"
                      : "bg-transparent border-transparent hover:bg-slate-200/50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                    <MessageSquare className="w-4 h-4 mt-0.5 text-slate-500 dark:text-zinc-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                        {session.title || "Untitled Enquiry"}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-0.5">
                        {session.updatedAt}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-opacity rounded-md hover:bg-slate-300/50 dark:hover:bg-zinc-700/50"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info with Supabase Auth status pill */}
        <div className="p-3 border-t border-slate-300 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-zinc-500 flex items-center justify-between select-none">
          <span>Kelvis AI • Supabase Ready</span>
          <button
            onClick={onOpenAuth}
            className="hover:text-slate-900 dark:hover:text-zinc-200 font-medium underline flex items-center space-x-1"
          >
            <User className="w-3 h-3" />
            <span>{userEmail ? "Account" : "Sign In"}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

