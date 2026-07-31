import React, { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { ChatMessage } from "./components/ChatMessage";
import { InputToolbar } from "./components/InputToolbar";
import { SettingsModal } from "./components/SettingsModal";
import { NotificationsModal } from "./components/NotificationsModal";
import { AuthModal } from "./components/AuthModal";
import { SqlSchemaModal } from "./components/SqlSchemaModal";
import { SpotifyModal } from "./components/SpotifyModal";
import { AttachedFile, ChatSession, Message, AppSettings, SpotifyTrack } from "./types";
import { Trash2, Download, RotateCcw, Sparkles, Code, Terminal, Info } from "lucide-react";
import {
  fetchSupabaseSessions,
  saveSupabaseSession,
  saveSupabaseMessage,
  deleteSupabaseSession,
} from "./lib/supabaseSync";

const INITIAL_SESSIONS: ChatSession[] = [
  {
    id: "session-1",
    title: "Kelvis Capabilities & Info",
    updatedAt: "Just now",
    model: "gemini-3.6-flash",
    messages: [
      {
        id: "msg-1",
        role: "user",
        text: "Who are you and what can you do?",
        timestamp: "12:00 PM",
      },
      {
        id: "msg-2",
        role: "model",
        text: "I am **Kelvis**, an intelligent AI assistant! Here is what I can do:\n\n" +
          "- ==Live Code Execution & Previews==: Write HTML, JavaScript, CSS, or TypeScript code blocks and click **Run Preview** to test them live!\n" +
          "- ==File Analysis & Uploads==: Upload documents, code files, or images for deep analysis.\n" +
          "- ==Voice Calls & Speech-to-Text==: Talk naturally or have responses read aloud.\n" +
          "- ==Supabase Data Syncing==: Persist conversations and session history securely.\n" +
          "- ==Search Grounding==: Fetch real-time web facts and verified information.\n\n" +
          "How can I assist you today?",
        timestamp: "12:00 PM",
      },
    ],
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  systemInstruction:
    "You are Kelvis, a smart, creative, and highly capable AI assistant. Never call yourself Gemini. You identify strictly as Kelvis. When writing HTML, CSS, JavaScript, or TypeScript, provide complete runnable code blocks inside ``` language boxes so the user can test them with the Run Preview button.",
  searchGrounding: false,
  autoVoiceRead: false,
  darkTheme: false,
  temperature: 0.7,
};

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem("sketch_ai_sessions");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_SESSIONS;
      }
    }
    return INITIAL_SESSIONS;
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(
    sessions[0]?.id || "session-1"
  );

  const [prompt, setPrompt] = useState<string>("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.6-flash");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState<boolean>(false);
  const [isSpotifyOpen, setIsSpotifyOpen] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState<boolean>(false);

  useEffect(() => {
    (window as any).openSqlModal = () => setIsSqlModalOpen(true);
  }, []);

  // Feature Toggles
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isVoiceCallActive, setIsVoiceCallActive] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem("sketch_ai_settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load sessions from Supabase if available
  useEffect(() => {
    fetchSupabaseSessions().then((dbSessions) => {
      if (dbSessions && dbSessions.length > 0) {
        setSessions(dbSessions);
        if (!dbSessions.some((s) => s.id === activeSessionId)) {
          setActiveSessionId(dbSessions[0].id);
        }
      }
    });
  }, [userEmail]);

  // Persist sessions locally as fallback
  useEffect(() => {
    localStorage.setItem("sketch_ai_sessions", JSON.stringify(sessions));
  }, [sessions]);

  // Persist settings locally
  useEffect(() => {
    localStorage.setItem("sketch_ai_settings", JSON.stringify(settings));
    if (settings.darkTheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings]);

  // Check health status on load
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setIsConnected(Boolean(data.status === "ok"));
      })
      .catch(() => setIsConnected(false));
  }, []);

  // Scroll to bottom when messages update
  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, isLoading]);

  // Speech-To-Text setup (Browser Web Speech API)
  const toggleSpeechToText = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser. Please type your message.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      if (currentTranscript) {
        setPrompt((prev) => (prev ? `${prev} ${currentTranscript}` : currentTranscript));
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  // Text-To-Speech Readout
  const speakText = (text: string, msgId?: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;

    if (msgId) setCurrentlySpeakingId(msgId);

    utterance.onend = () => {
      setCurrentlySpeakingId(null);
    };
    utterance.onerror = () => {
      setCurrentlySpeakingId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentlySpeakingId(null);
  };

  // Start New Chat
  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: "NEW CHAT",
      updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      model: selectedModel,
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setPrompt("");
    setAttachedFiles([]);
    saveSupabaseSession(newSession);
  };

  // Delete Chat Session
  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    deleteSupabaseSession(id);
    if (activeSessionId === id) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  // Send Message Handler
  const handleSendMessage = async () => {
    if (!prompt.trim() && attachedFiles.length === 0) return;

    const currentPrompt = prompt.trim();
    const currentFiles = [...attachedFiles];

    setPrompt("");
    setAttachedFiles([]);

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: currentPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      files: currentFiles.map((f) => ({ name: f.name, mimeType: f.mimeType })),
    };

    // Update session title if first message
    const isFirstMsg = !activeSession || activeSession.messages.length === 0;
    const sessionTitle = isFirstMsg
      ? currentPrompt.slice(0, 24) || "New Enquiry"
      : activeSession.title;

    const updatedSession: ChatSession = {
      ...(activeSession || {
        id: activeSessionId,
        model: selectedModel,
        updatedAt: "Just now",
        messages: [],
      }),
      title: sessionTitle,
      updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      messages: [...(activeSession?.messages || []), userMsg],
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? updatedSession : s))
    );

    // Persist to Supabase
    saveSupabaseSession(updatedSession);
    saveSupabaseMessage(activeSessionId, userMsg);

    setIsLoading(true);

    try {
      // Build history payload for Gemini backend API
      const historyPayload = (activeSession?.messages || []).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentPrompt,
          history: historyPayload,
          model: selectedModel,
          files: currentFiles,
          searchGrounding: settings.searchGrounding,
          systemInstruction: settings.systemInstruction,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reach backend server");
      }

      const aiMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "model",
        text: data.text || "No response received.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        image: data.image,
        sources: data.sources,
        spotifyTrack: data.spotifyTrack,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, aiMsg] }
            : s
        )
      );

      // Save AI message to Supabase
      saveSupabaseMessage(activeSessionId, aiMsg);

      // Auto Voice Readout if enabled or Voice Call active
      if (settings.autoVoiceRead || isVoiceCallActive) {
        speakText(aiMsg.text, aiMsg.id);
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        id: `msg-err-${Date.now()}`,
        role: "model",
        text: `Error: ${err.message || "Something went wrong while communicating with Kelvis backend."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, errorMsg] }
            : s
        )
      );
      saveSupabaseMessage(activeSessionId, errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear current chat messages
  const handleClearMessages = () => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, messages: [] } : s))
    );
    setShowOptionsMenu(false);
  };

  const handlePlaySelectedTrack = (track: SpotifyTrack) => {
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: `Play song: ${track.title} by ${track.artist}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const aiMsg: Message = {
      id: `msg-${Date.now() + 1}`,
      role: "model",
      text: `Playing **${track.title}** by ${track.artist} on Spotify!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      spotifyTrack: track,
    };

    const updatedSession: ChatSession = {
      id: activeSession?.id || activeSessionId,
      title: activeSession?.title || "NEW CHAT",
      model: activeSession?.model || selectedModel,
      updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      messages: [...(activeSession?.messages || []), userMsg, aiMsg],
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? updatedSession : s))
    );
    saveSupabaseSession(updatedSession);
    saveSupabaseMessage(activeSessionId, userMsg);
    saveSupabaseMessage(activeSessionId, aiMsg);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-200 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans">
      {/* Sidebar matching hand drawn lower panel */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        userEmail={userEmail}
      />

      {/* Main Window Container matching sketch top rectangle */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-slate-50 dark:bg-zinc-900 shadow-inner relative">
        {/* Header matching top sketch header */}
        <Header
          chatTitle={activeSession?.title || "NEW CHAT"}
          onNewChat={handleNewChat}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenOptionsMenu={() => setShowOptionsMenu(!showOptionsMenu)}
          onOpenSpotify={() => setIsSpotifyOpen(true)}
        />

        {/* 3-Dots Options Menu Popup */}
        {showOptionsMenu && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowOptionsMenu(false)}
            />
            <div className="absolute right-4 top-14 w-52 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-2xl shadow-xl z-40 py-2 text-xs select-none">
              <button
                onClick={handleClearMessages}
                className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-zinc-700 flex items-center space-x-2 text-slate-700 dark:text-zinc-200"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>Clear Conversation</span>
              </button>
              <button
                onClick={() => {
                  const dataStr =
                    "data:text/json;charset=utf-8," +
                    encodeURIComponent(JSON.stringify(activeSession, null, 2));
                  const downloadAnchor = document.createElement("a");
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", `${activeSession?.title || "chat"}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                  setShowOptionsMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-zinc-700 flex items-center space-x-2 text-slate-700 dark:text-zinc-200"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export Chat Data</span>
              </button>
              <div className="my-1 border-t border-slate-200 dark:border-zinc-700" />
              <button
                onClick={() => handleDeleteSession(activeSessionId)}
                className="w-full text-left px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Chat</span>
              </button>
            </div>
          </>
        )}

        {/* Chat Messages Scroll Container */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3">
          {!activeSession || activeSession.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-zinc-500 select-none max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full border-2 border-slate-400 dark:border-zinc-600 flex items-center justify-center mb-4 bg-slate-100 dark:bg-zinc-800 shadow-xs">
                <Sparkles className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 mb-2">
                Kelvis AI Assistant
              </h2>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mb-6 leading-relaxed">
                Hi! I am **Kelvis**, your intelligent AI assistant. Ask me to generate code, analyze files, answer questions, or run live code previews!
              </p>

              {/* Action Quick Starters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                <button
                  onClick={() => setPrompt("Write a simple HTML, CSS, and JS web calculator code block")}
                  className="p-3 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-xs transition-all shadow-2xs group"
                >
                  <div className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center space-x-1.5 mb-1">
                    <Code className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                    <span>Run HTML/JS Code</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Generate runnable web code</div>
                </button>
                <button
                  onClick={() => setPrompt("Explain who Kelvis is and what key features you support")}
                  className="p-3 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-xs transition-all shadow-2xs group"
                >
                  <div className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center space-x-1.5 mb-1">
                    <Info className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
                    <span>Kelvis Info & Features</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Learn what Kelvis can do</div>
                </button>
              </div>
            </div>
          ) : (
            activeSession.messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onSpeak={(txt) => speakText(txt, msg.id)}
                isSpeaking={currentlySpeakingId === msg.id}
                onStopSpeaking={stopSpeaking}
              />
            ))
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center space-x-3 px-4 py-3 max-w-xs bg-slate-100 dark:bg-zinc-800 rounded-2xl rounded-tl-xs border border-slate-300 dark:border-zinc-700 ml-2 sm:ml-4">
              <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-zinc-100 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <span className="text-xs text-slate-600 dark:text-zinc-300 font-medium">
                Kelvis is typing...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Control Bar */}
        <InputToolbar
          prompt={prompt}
          setPrompt={setPrompt}
          onSend={handleSendMessage}
          isLoading={isLoading}
          attachedFiles={attachedFiles}
          onAddFiles={(newFiles) => setAttachedFiles((prev) => [...prev, ...newFiles])}
          onRemoveFile={(index) =>
            setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
          }
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          isListening={isListening}
          onToggleSpeechToText={toggleSpeechToText}
          isVoiceCallActive={isVoiceCallActive}
          onToggleVoiceCall={() => setIsVoiceCallActive(!isVoiceCallActive)}
          isConnected={isConnected}
          onToggleConnect={() => setIsConnected(!isConnected)}
          searchGrounding={settings.searchGrounding}
          onToggleSearchGrounding={() =>
            setSettings((prev) => ({ ...prev, searchGrounding: !prev.searchGrounding }))
          }
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSt) => setSettings((prev) => ({ ...prev, ...newSt }))}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        isConnected={isConnected}
      />

      {/* Supabase Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onUserChanged={(u) => setUserEmail(u?.email || null)}
      />

      {/* Supabase Full SQL Schema Modal */}
      <SqlSchemaModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />

      {/* Spotify Integration Modal */}
      <SpotifyModal
        isOpen={isSpotifyOpen}
        onClose={() => setIsSpotifyOpen(false)}
        onSelectTrackToPlay={handlePlaySelectedTrack}
      />
    </div>
  );
}
