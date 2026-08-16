import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { ChatMessage } from "./components/ChatMessage";
import { InputToolbar } from "./components/InputToolbar";
import { SettingsModal } from "./components/SettingsModal";
import { NotificationsModal } from "./components/NotificationsModal";
import { AuthModal } from "./components/AuthModal";
import { SqlSchemaModal } from "./components/SqlSchemaModal";
import { SpotifyModal } from "./components/SpotifyModal";
import { VoiceCallModal } from "./components/VoiceCallModal";
import { BinanceMarketModal } from "./components/BinanceMarketModal";
import { BoukModal } from "./components/BoukModal";
import { AttachedFile, ChatSession, Message, AppSettings, SpotifyTrack } from "./types";
import { Trash2, Download, RotateCcw, Sparkles, Code, Terminal, Info, BarChart3, Image as ImageIcon, Activity, BookOpen } from "lucide-react";
import {
  fetchSupabaseSessions,
  saveSupabaseSession,
  saveSupabaseMessage,
  deleteSupabaseSession,
  toValidUUID,
  subscribeToSupabaseChats,
} from "./lib/supabaseSync";

const INITIAL_SESSIONS: ChatSession[] = [
  {
    id: toValidUUID("session-1"),
    title: "Kelvis Capabilities & Info",
    updatedAt: "Just now",
    model: "gpt-oss-120b",
    messages: [
      {
        id: toValidUUID("msg-1"),
        role: "user",
        text: "Who are you and what can you do?",
        timestamp: "12:00 PM",
      },
      {
        id: toValidUUID("msg-2"),
        role: "model",
        text: "I am **Kelvis**, an intelligent AI assistant! Here is what I can do:\n\n" +
          "- ==Live Code Execution & Previews==: Write HTML, JavaScript, CSS, or TypeScript code blocks and click **Run Preview** to test them live!\n" +
          "- ==Live Binance Crypto Market Data==: Stream live candlestick charts, EMA, RSI, MACD, and Bollinger Bands with zero API keys required!\n" +
          "- ==File Analysis & Uploads==: Upload documents, code files, or images for deep analysis.\n" +
          "- ==Voice Calls & Speech-to-Text==: Talk naturally or have responses read aloud.\n" +
          "- ==Supabase Data Syncing==: Persist conversations and session history securely across all your devices.\n" +
          "- ==Search Grounding==: Fetch real-time web facts and verified information.\n\n" +
          "How can I assist you today?",
        timestamp: "12:00 PM",
      },
    ],
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  systemInstruction:
    "You are Kelvis, a smart, helpful, and creative AI assistant. You identify strictly as Kelvis. Only write code or generate code blocks when the user explicitly asks for code, programming, or scripts. For general questions, explanations, discussions, or creative writing, respond naturally in clear text without unsolicited code blocks.",
  searchGrounding: true,
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
  const [selectedModel, setSelectedModel] = useState<string>("gpt-oss-120b");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCodeMode, setIsCodeMode] = useState<boolean>(false);

  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState<boolean>(false);
  const [isSpotifyOpen, setIsSpotifyOpen] = useState<boolean>(false);
  const [isBinanceModalOpen, setIsBinanceModalOpen] = useState<boolean>(false);
  const [isBoukOpen, setIsBoukOpen] = useState<boolean>(false);
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

  // Load sessions from Supabase & Subscribe to Realtime Updates across devices
  useEffect(() => {
    const syncChats = () => {
      fetchSupabaseSessions().then((dbSessions) => {
        if (dbSessions && dbSessions.length > 0) {
          setSessions(dbSessions);
          setActiveSessionId((currentId) => {
            if (dbSessions.some((s) => s.id === currentId)) {
              return currentId;
            }
            return dbSessions[0].id;
          });
        }
      });
    };

    syncChats();
    const unsubscribe = subscribeToSupabaseChats(syncChats);
    return () => {
      unsubscribe();
    };
  }, [userEmail]);

  // Persist sessions locally as fallback
  useEffect(() => {
    localStorage.setItem("sketch_ai_sessions", JSON.stringify(sessions));
  }, [sessions]);

  // Persist settings locally & sync theme classes
  useEffect(() => {
    localStorage.setItem("sketch_ai_settings", JSON.stringify(settings));
    if (settings.darkTheme) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
      document.body.classList.remove("dark");
    }
  }, [settings.darkTheme, settings]);

  const toggleTheme = () => {
    setSettings((prev) => {
      const nextDark = !prev.darkTheme;
      if (nextDark) {
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
        document.body.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-theme", "light");
        document.body.classList.remove("dark");
      }
      return { ...prev, darkTheme: nextDark };
    });
  };

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
    const validId = toValidUUID(`session-${Date.now()}`);
    const newSession: ChatSession = {
      id: validId,
      title: "NEW CHAT",
      updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      model: selectedModel,
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(validId);
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
  const handleSendMessage = async (textOverride?: string) => {
    const rawPrompt = typeof textOverride === "string" ? textOverride : prompt;
    if (!rawPrompt.trim() && attachedFiles.length === 0) return;

    const currentPrompt = rawPrompt.trim();
    const currentFiles = [...attachedFiles];

    if (typeof textOverride !== "string") {
      setPrompt("");
    }
    setAttachedFiles([]);

    const userMsg: Message = {
      id: toValidUUID(`msg-user-${Date.now()}`),
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

    // Use selected model, or gpt-oss-120b if Code Mode is explicitly activated
    const modelToUse = isCodeMode ? "gpt-oss-120b" : selectedModel;

    setIsLoading(true);

    const aiMsgId = toValidUUID(`msg-ai-${Date.now() + 1}`);
    const initialAiMsg: Message = {
      id: aiMsgId,
      role: "model",
      text: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Pre-insert placeholder message for smooth real-time token streaming
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, messages: [...s.messages, initialAiMsg] }
          : s
      )
    );

    try {
      // Build history payload for backend API
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
          model: modelToUse,
          files: currentFiles,
          searchGrounding: true,
          systemInstruction: settings.systemInstruction,
          googleApiKey: settings.customGoogleApiKey,
          googleCx: settings.customGoogleCx,
          groqApiKey: settings.customGroqApiKey,
          stream: true,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server returned HTTP ${res.status}: ${errText}`);
      }

      let accumulatedText = "";
      let finalSources: any[] = [];
      let finalSpotifyTrack: any = null;
      let finalImage: string | undefined = undefined;

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              const jsonStr = trimmed.slice(6);
              if (jsonStr === "[DONE]") continue;
              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.token) {
                  accumulatedText += parsed.token;
                  // Incrementally update UI with streamed tokens
                  setSessions((prev) =>
                    prev.map((s) =>
                      s.id === activeSessionId
                        ? {
                            ...s,
                            messages: s.messages.map((m) =>
                              m.id === aiMsgId
                                ? {
                                    ...m,
                                    text: accumulatedText,
                                    image: parsed.image || m.image,
                                    spotifyTrack: parsed.spotifyTrack || m.spotifyTrack,
                                  }
                                : m
                            ),
                          }
                        : s
                    )
                  );
                }
                if (parsed.image) finalImage = parsed.image;
                if (parsed.sources) finalSources = parsed.sources;
                if (parsed.spotifyTrack) finalSpotifyTrack = parsed.spotifyTrack;
                if (parsed.error) {
                  accumulatedText += `\n\n⚠️ ${parsed.error}`;
                }
              } catch (e) {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }
      }

      const finalizedAiMsg: Message = {
        id: aiMsgId,
        role: "model",
        text: accumulatedText || "No response received.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        image: finalImage,
        sources: finalSources.length > 0 ? finalSources : undefined,
        spotifyTrack: finalSpotifyTrack,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === aiMsgId ? finalizedAiMsg : m
                ),
              }
            : s
        )
      );

      // Save finalized AI message to Supabase
      saveSupabaseMessage(activeSessionId, finalizedAiMsg);

      // Auto Voice Readout if enabled or Voice Call active
      if (settings.autoVoiceRead || isVoiceCallActive) {
        speakText(finalizedAiMsg.text, finalizedAiMsg.id);
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
            ? { ...s, messages: [...s.messages.filter((m) => m.id !== aiMsgId), errorMsg] }
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
        onOpenBinanceMarket={() => setIsBinanceModalOpen(true)}
        onOpenBouk={() => setIsBoukOpen(true)}
      />

      {/* Main Window Container matching sketch top rectangle */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-slate-50 dark:bg-zinc-900 shadow-inner relative">
        {/* Header matching top sketch header */}
        <Header
          chatTitle={activeSession?.title || "NEW CHAT"}
          onNewChat={handleNewChat}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenOptionsMenu={() => setShowOptionsMenu(!showOptionsMenu)}
          darkTheme={settings.darkTheme}
          onToggleTheme={toggleTheme}
          onOpenBinanceMarket={() => setIsBinanceModalOpen(true)}
          onOpenBouk={() => setIsBoukOpen(true)}
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
                Hi! I am **Kelvis**, your intelligent AI assistant. Ask me about WAEC/NECO past questions, Nigerian geography, write and preview code, or stream live Binance market data!
              </p>

              {/* Action Quick Starters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                <button
                  onClick={() => setIsBoukOpen(true)}
                  className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 hover:border-amber-500 text-xs transition-all shadow-2xs group cursor-pointer"
                >
                  <div className="font-semibold text-amber-900 dark:text-amber-300 flex items-center space-x-1.5 mb-1">
                    <BookOpen className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                    <span>.Bouk Open Access Library</span>
                  </div>
                  <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80">WAEC/NECO Past Questions & Geography</div>
                </button>
                <button
                  onClick={() => setIsBinanceModalOpen(true)}
                  className="p-3 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-amber-500 dark:hover:border-amber-500 text-xs transition-all shadow-2xs group cursor-pointer"
                >
                  <div className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center space-x-1.5 mb-1">
                    <Activity className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                    <span>Binance Live Market</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Live Candlesticks, EMA, RSI & MACD</div>
                </button>
                <button
                  onClick={() => setPrompt("Explain how to solve WAEC Mathematics 2024 quadratic equation step by step")}
                  className="p-3 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-xs transition-all shadow-2xs group cursor-pointer"
                >
                  <div className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center space-x-1.5 mb-1">
                    <BarChart3 className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                    <span>WAEC Exam Solvers</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Past questions & marking scheme guides</div>
                </button>
                <button
                  onClick={() => setPrompt("Code a modern task manager web app with HTML, CSS, and JS")}
                  className="p-3 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-amber-500 dark:hover:border-amber-500 text-xs transition-all shadow-2xs group cursor-pointer"
                >
                  <div className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center space-x-1.5 mb-1">
                    <Code className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                    <span>Bolt Web App Code</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Multi-file generation & live sandbox</div>
                </button>
              </div>
            </div>
          ) : (
            activeSession.messages.map((msg, idx) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onSpeak={(txt) => speakText(txt, msg.id)}
                isSpeaking={currentlySpeakingId === msg.id}
                onStopSpeaking={stopSpeaking}
                isStreaming={
                  isLoading &&
                  idx === activeSession.messages.length - 1 &&
                  msg.role === "model"
                }
              />
            ))
          )}

          {/* Typing Indicator with Smooth Gradual Fade-Out */}
          <AnimatePresence mode="wait">
            {isLoading &&
              (!activeSession?.messages?.length ||
                activeSession.messages[activeSession.messages.length - 1].role === "user" ||
                !activeSession.messages[activeSession.messages.length - 1].text) && (
                <motion.div
                  key="kelvis-typing-indicator"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    y: -4,
                    scale: 0.98,
                    transition: { duration: 0.5, ease: "easeInOut" },
                  }}
                  className="flex items-center space-x-3 px-3 py-2 text-slate-500 dark:text-zinc-400 select-none"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs border border-slate-700 dark:border-zinc-300">
                    <Sparkles className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">
                      Kelvis is thinking
                    </span>
                    <div className="flex items-center space-x-1">
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.15, 0.85] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                      />
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.15, 0.85] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                      />
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.15, 0.85] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
          </AnimatePresence>

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
          isCodeMode={isCodeMode}
          onToggleCodeMode={() => {
            const nextMode = !isCodeMode;
            setIsCodeMode(nextMode);
            if (nextMode) {
              setSelectedModel("gpt-oss-120b");
            }
          }}
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

      {/* Binance Live Market Modal */}
      <BinanceMarketModal
        isOpen={isBinanceModalOpen}
        onClose={() => setIsBinanceModalOpen(false)}
      />

      {/* .Bouk Open Access Library & AI Guidance Modal */}
      <BoukModal
        isOpen={isBoukOpen}
        onClose={() => setIsBoukOpen(false)}
        onAskKelvis={(promptText) => {
          setIsBoukOpen(false);
          handleSendMessage(promptText);
        }}
      />

      {/* Live Full Voice Call Modal */}
      <VoiceCallModal
        isOpen={isVoiceCallActive}
        onClose={() => setIsVoiceCallActive(false)}
        onSendMessage={async (spokenText) => {
          await handleSendMessage(spokenText);
        }}
        isAiResponding={isLoading}
        lastAiText={
          activeSession?.messages
            ?.slice()
            ?.reverse()
            ?.find((m) => m.role === "model")?.text
        }
        onSpeak={(txt) => speakText(txt)}
        isSpeaking={currentlySpeakingId !== null}
        onStopSpeaking={stopSpeaking}
      />
    </div>
  );
}
