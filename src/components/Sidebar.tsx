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
  User,
  Link2,
  Layers,
  FolderGit2,
  Code2,
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
  onOpenCodebase?: () => void;
  codebaseFileCount?: number;
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
  onOpenCodebase,
  codebaseFileCount = 0,
  userEmail,
}) => {
  return (
    <aside
      className={`relative h-full bg-white dark:bg-black border-r border-black/15 dark:border-white/15 flex flex-col shrink-0 transition-all duration-300 ease-in-out select-none overflow-hidden z-20 ${
        isOpen
          ? "w-72 sm:w-80 min-w-[18rem] sm:min-w-[20rem] opacity-100"
          : "w-0 min-w-0 border-r-0 opacity-0 pointer-events-none"
      }`}
    >
      <div className="w-72 sm:w-80 h-full flex flex-col">
        {/* Top Header of Sidebar */}
        <div className="p-3 border-b border-black/15 dark:border-white/15 flex items-center justify-between">
          {/* Icons: Settings, Bell, Apps (Box), Globe, Auth User */}
          <div className="flex items-center space-x-1 sm:space-x-1.5">
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenNotifications}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>
            {/* Apps Launcher Button right after Notifications */}
            <button
              type="button"
              onClick={onOpenApps}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white transition-colors cursor-pointer"
              title="Apps & Integrations"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <div
              className="p-1.5 text-black dark:text-white"
              title="Global Web Connect"
            >
              <Globe className="w-4 h-4" />
            </div>
            <button
              onClick={onOpenAuth}
              className={`p-1.5 rounded-lg transition-colors flex items-center ${
                userEmail
                  ? "bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white font-bold"
                  : "hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white"
              }`}
              title={userEmail ? `Logged in as ${userEmail}` : "Supabase Account"}
            >
              <User className="w-4 h-4" />
            </button>
          </div>

          {/* "+ NEW CHAT" pill button and close */}
          <div className="flex items-center space-x-1">
            <button
              onClick={onNewChat}
              className="px-3 py-1.5 rounded-full border border-black dark:border-white bg-black text-white dark:bg-white dark:text-black text-xs font-bold flex items-center space-x-1 hover:opacity-85 transition-opacity shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>NEW CHAT</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white ml-1"
              title="Collapse Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Buttons: Codebase & Connector */}
        <div className="px-3 pt-3 pb-1 space-y-1.5">
          {/* Codebase Button above Connector */}
          <button
            type="button"
            onClick={onOpenCodebase}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white text-black dark:bg-black dark:text-white border-2 border-black dark:border-white font-black text-xs shadow-xs hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black active:scale-[0.98] transition-all cursor-pointer group"
          >
            <div className="flex items-center space-x-2">
              <FolderGit2 className="w-4 h-4 shrink-0 text-black dark:text-white group-hover:text-white dark:group-hover:text-black transition-colors" />
              <span className="tracking-wide uppercase font-black">Codebase</span>
            </div>
            <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/20 group-hover:bg-white/20 dark:group-hover:bg-black/20">
              {codebaseFileCount > 0 ? `${codebaseFileCount} files` : "Workspace"}
            </span>
          </button>

          {/* Connector Button */}
          <button
            type="button"
            onClick={onOpenApps}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white font-bold text-xs shadow-xs hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Link2 className="w-4 h-4 text-white dark:text-black shrink-0" />
              <span className="tracking-wide">Connector</span>
            </div>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/20 dark:bg-black/20 font-extrabold tracking-wider">
              Active
            </span>
          </button>
        </div>

        {/* Section title: Conversations */}
        <div className="px-4 pt-3 pb-1.5 text-xs font-black text-black/60 dark:text-white/60 uppercase tracking-wider flex items-center justify-between">
          <span>Conversations</span>
          <span className="text-[11px] font-bold text-black/50 dark:text-white/50">
            {sessions.length}
          </span>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center py-8 px-4 text-black/50 dark:text-white/50 text-xs font-semibold">
              No conversations yet. Start a new chat!
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`group relative flex items-start justify-between p-2.5 rounded-xl cursor-pointer border transition-all ${
                    isActive
                      ? "bg-black/10 dark:bg-white/15 border-black dark:border-white shadow-xs"
                      : "bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                    <MessageSquare className="w-4 h-4 mt-0.5 text-black dark:text-white shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-black dark:text-white truncate">
                        {session.title || "Untitled Conversation"}
                      </p>
                      <p className="text-[10px] font-semibold text-black/50 dark:text-white/50 mt-0.5">
                        {session.updatedAt}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white transition-opacity rounded-md hover:bg-black/10 dark:hover:bg-white/20"
                    title="Delete Conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info with Supabase Auth status pill */}
        <div className="p-3 border-t border-black/15 dark:border-white/15 text-[11px] text-black/60 dark:text-white/60 font-semibold flex items-center justify-between select-none">
          <span className="font-bold">Kelvis AI • Black & White</span>
          <button
            onClick={onOpenAuth}
            className="hover:text-black dark:hover:text-white font-bold underline flex items-center space-x-1"
          >
            <User className="w-3 h-3" />
            <span>{userEmail ? "Account" : "Sign In"}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

