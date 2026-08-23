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
import { AppsModal } from "./components/AppsModal";
import { QuickQuizDrawer } from "./components/QuickQuizDrawer";
import { CodebaseModal } from "./components/CodebaseModal";
import { CodePreviewModal, ProjectFile } from "./components/CodePreviewModal";
import { AttachedFile, ChatSession, Message, AppSettings, SpotifyTrack, QuizPayload } from "./types";
import { Trash2, Download, RotateCcw, Sparkles } from "lucide-react";
import {
  fetchSupabaseSessions,
  saveSupabaseSession,
  saveSupabaseMessage,
  deleteSupabaseSession,
  toValidUUID,
  subscribeToSupabaseChats,
} from "./lib/supabaseSync";
import { isLargeProjectCodingPrompt, generateCodingSpecificationQuiz } from "./utils/quizParser";
import {
  loadCodebase,
  syncFilesFromAiResponse,
  getCodebaseContextForPrompt,
} from "./utils/codebaseStore";

const INITIAL_SESSIONS: ChatSession[] = [
  {
    id: toValidUUID("session-1"),
    title: "Kelvis Capabilities & Info",
    updatedAt: "Just now",
    model: "openai/gpt-oss-120b",
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
        text: "I am **Kelvis**, an intelligent AI assistant powered strictly by **openai/gpt-oss-120b** and **openai/gpt-oss-20b**!\n\n" +
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
    "You are Kelvis, a smart, helpful, and creative AI assistant running strictly on model openai/gpt-oss-120b or openai/gpt-oss-20b. When coding an application, first explain your next step clearly (e.g., 'I will start with the web structure...'), then use activefile progress tags and complete code blocks.",
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
  const [selectedModel, setSelectedModel] = useState<string>("openai/gpt-oss-120b");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCodeMode, setIsCodeMode] = useState<boolean>(false);

  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState<boolean>(false);
  const [isAppsModalOpen, setIsAppsModalOpen] = useState<boolean>(false);
  const [isSpotifyOpen, setIsSpotifyOpen] = useState<boolean>(false);
  const [isBinanceModalOpen, setIsBinanceModalOpen] = useState<boolean>(false);
  const [isBoukOpen, setIsBoukOpen] = useState<boolean>(false);
  const [isCodebaseOpen, setIsCodebaseOpen] = useState<boolean>(false);
  const [codebaseFiles, setCodebaseFiles] = useState(() => loadCodebase());
  const [previewModalData, setPreviewModalData] = useState<{
    isOpen: boolean;
    files: { name: string; code: string; language: string }[];
    initialFile?: string;
  }>({
    isOpen: false,
    files: [],
  });
  const [isQuizOpen, setIsQuizOpen] = useState<boolean>(false);
  const [activeQuiz, setActiveQuiz] = useState<QuizPayload | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState<boolean>(false);

  useEffect(() => {
    (window as any).openSqlModal = () => setIsSqlModalOpen(true);
    const handleCodebaseSync = () => {
      setCodebaseFiles(loadCodebase());
    };
    window.addEventListener("kelvis_codebase_updated", handleCodebaseSync);
    return () => window.removeEventListener("kelvis_codebase_updated", handleCodebaseSync);
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  // Speech-To-Text setup (Groq Whisper Large v3 with Web Speech fallback)
  const toggleSpeechToText = async () => {
    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    // 1. Primary: Use MediaRecorder to stream audio directly to Groq whisper-large-v3
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64Data = (reader.result as string)?.split(",")[1];
              if (base64Data) {
                try {
                  const res = await fetch("/api/voice/groq-stt", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      audioBase64: base64Data,
                      mimeType: "audio/webm",
                      groqApiKey: settings.customGroqApiKey,
                    }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    if (data.text && data.text.trim()) {
                      setPrompt((prev) => (prev ? `${prev} ${data.text.trim()}` : data.text.trim()));
                    }
                  }
                } catch (err) {
                  console.warn("Groq Whisper STT processing notice:", err);
                }
              }
            };
            reader.readAsDataURL(audioBlob);
          }
          setIsListening(false);
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsListening(true);
        return;
      } catch (micErr) {
        console.warn("Microphone stream notice, checking Web Speech fallback:", micErr);
      }
    }

    // 2. Fallback: Web Speech Recognition API
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition requires microphone permissions. Please enable mic access.");
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

  // Audio player ref for Neural TTS audio playback
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Text-To-Speech Readout with Groq canopylabs/orpheus-v1-english & Fallbacks
  const speakText = async (rawText: string, msgId?: string) => {
    // 1. Clean markdown, code blocks, activefile tags, and special symbols for natural speech
    const cleanSpoken = rawText
      .replace(/<activefile[\s\S]*?\/>/g, "")
      .replace(/```[\s\S]*?```/g, " Code block omitted for speech. ")
      .replace(/<[^>]+>/g, "")
      .replace(/[*_#`~[\]()]/g, "")
      .replace(/==(.*?)==/g, "$1")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanSpoken) return;

    // Cancel any active speech or audio playback
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (msgId) setCurrentlySpeakingId(msgId);

    // 1. Primary: Groq Neural TTS (canopylabs/orpheus-v1-english)
    try {
      const res = await fetch("/api/voice/groq-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanSpoken.slice(0, 1000),
          voice: "orpheus",
          groqApiKey: settings.customGroqApiKey,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audioUrl = `data:${data.mimeType || "audio/mp3"};base64,${data.audioBase64}`;
          const audio = new Audio(audioUrl);
          activeAudioRef.current = audio;
          audio.onended = () => {
            setCurrentlySpeakingId(null);
            activeAudioRef.current = null;
          };
          audio.onerror = () => {
            setCurrentlySpeakingId(null);
            activeAudioRef.current = null;
          };
          await audio.play();
          return;
        }
      }
    } catch (e) {
      console.warn("Groq Orpheus TTS notice, falling back:", e);
    }

    // 2. Secondary: Gemini TTS
    try {
      const res = await fetch("/api/voice/gemini-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanSpoken.slice(0, 1000),
          voiceName: "Kore",
          customApiKey: settings.customGoogleApiKey,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audioUrl = `data:${data.mimeType || "audio/wav"};base64,${data.audioBase64}`;
          const audio = new Audio(audioUrl);
          activeAudioRef.current = audio;
          audio.onended = () => {
            setCurrentlySpeakingId(null);
            activeAudioRef.current = null;
          };
          audio.onerror = () => {
            setCurrentlySpeakingId(null);
            activeAudioRef.current = null;
          };
          await audio.play();
          return;
        }
      }
    } catch (e) {}

    // 3. Fallback: Browser Web Speech API
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(cleanSpoken);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Prefer natural English voices if available
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha"))
      );
      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      utterance.onend = () => {
        setCurrentlySpeakingId(null);
      };
      utterance.onerror = () => {
        setCurrentlySpeakingId(null);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setCurrentlySpeakingId(null);
    }
  };

  const stopSpeaking = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
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
  const handleSendMessage = async (
    textOverride?: string,
    options?: { bypassAutoQuiz?: boolean; isBackgroundSubmission?: boolean; displayUserText?: string } | boolean
  ) => {
    const opts = typeof options === "boolean" ? { bypassAutoQuiz: options } : (options || {});
    const isBackground = opts.isBackgroundSubmission || false;
    const rawPrompt = typeof textOverride === "string" ? textOverride : prompt;
    if (!rawPrompt.trim() && attachedFiles.length === 0) return;

    const currentPrompt = rawPrompt.trim();
    const currentFiles = [...attachedFiles];

    // If user sends a prompt asking for large project architecture/quiz,
    // auto-popup the interactive blueprint quiz. For standard coding (landing page, scripts, edits), proceed directly!
    if (!opts.bypassAutoQuiz && !textOverride && isLargeProjectCodingPrompt(currentPrompt)) {
      const codingQuiz = generateCodingSpecificationQuiz(currentPrompt);
      setActiveQuiz(codingQuiz);
      setIsQuizOpen(true);
      
      // Pre-insert user prompt into chat so the user query is clearly visible in the conversation
      const userMsg: Message = {
        id: toValidUUID(`msg-user-${Date.now()}`),
        role: "user",
        text: currentPrompt,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        files: currentFiles.map((f) => ({ name: f.name, mimeType: f.mimeType })),
      };
      const sessionTitle = !activeSession || activeSession.messages.length === 0
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
      setSessions((prev) => prev.map((s) => (s.id === activeSessionId ? updatedSession : s)));
      saveSupabaseSession(updatedSession);
      saveSupabaseMessage(activeSessionId, userMsg);

      setPrompt("");
      setAttachedFiles([]);
      setIsCodeMode(true);
      return;
    }

    if (typeof textOverride !== "string") {
      setPrompt("");
    }
    setAttachedFiles([]);

    if (!isBackground) {
      const userMsg: Message = {
        id: toValidUUID(`msg-user-${Date.now()}`),
        role: "user",
        text: opts.displayUserText || currentPrompt,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        files: currentFiles.map((f) => ({ name: f.name, mimeType: f.mimeType })),
      };

      // Update session title if first message
      const isFirstMsg = !activeSession || activeSession.messages.length === 0;
      const sessionTitle = isFirstMsg
        ? (opts.displayUserText || currentPrompt).slice(0, 24) || "New Enquiry"
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
    }

    // Use selected model, or openai/gpt-oss-120b
    const modelToUse = isCodeMode ? "openai/gpt-oss-120b" : selectedModel;

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
          codebaseContext: getCodebaseContextForPrompt(),
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

      // Auto-sync files from AI response directly into shared Codebase Workspace
      try {
        const synced = syncFilesFromAiResponse(
          accumulatedText,
          activeSessionId,
          activeSession?.title
        );
        if (synced.length > 0) {
          setCodebaseFiles(loadCodebase());
        }
      } catch (cbErr) {
        console.warn("Failed to sync files to codebase:", cbErr);
      }

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
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-black text-black dark:text-white font-sans">
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
        onOpenApps={() => setIsAppsModalOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenCodebase={() => setIsCodebaseOpen(true)}
        codebaseFileCount={codebaseFiles.length}
        userEmail={userEmail}
      />

      {/* Main Window Container matching sketch top rectangle */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-black relative">
        {/* Header matching top sketch header */}
        <Header
          chatTitle={activeSession?.title || "NEW CHAT"}
          onNewChat={handleNewChat}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenOptionsMenu={() => setShowOptionsMenu(!showOptionsMenu)}
          darkTheme={settings.darkTheme}
          onToggleTheme={toggleTheme}
        />

        {/* 3-Dots Options Menu Popup */}
        {showOptionsMenu && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowOptionsMenu(false)}
            />
            <div className="absolute right-4 top-14 w-56 bg-white dark:bg-black border border-black/30 dark:border-white/30 rounded-2xl shadow-xl z-40 py-2 text-xs select-none">
              <button
                onClick={handleClearMessages}
                className="w-full text-left px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10 flex items-center space-x-2 text-black dark:text-white font-bold"
              >
                <RotateCcw className="w-4 h-4 text-black dark:text-white" />
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
                className="w-full text-left px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10 flex items-center space-x-2 text-black dark:text-white font-bold"
              >
                <Download className="w-4 h-4 text-black dark:text-white" />
                <span>Export Chat Data</span>
              </button>
              <div className="my-1 border-t border-black/15 dark:border-white/15" />
              <button
                onClick={() => handleDeleteSession(activeSessionId)}
                className="w-full text-left px-4 py-2 hover:bg-black/10 dark:hover:bg-white/15 text-black dark:text-white flex items-center space-x-2 font-bold"
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
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-black/60 dark:text-white/60 select-none max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl border border-black/20 dark:border-white/20 flex items-center justify-center mb-4 bg-black text-white dark:bg-white dark:text-black shadow-xs">
                <Sparkles className="w-7 h-7 text-white dark:text-black" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-black dark:text-white mb-2">
                How can I help you today?
              </h2>
              <p className="text-sm text-black/70 dark:text-white/70 leading-relaxed max-w-sm font-semibold">
                Ask questions, build and preview applications, solve problems, analyze documents, or launch tools from the Apps menu.
              </p>
            </div>
          ) : (
            activeSession.messages.map((msg, idx) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onSpeak={(txt) => speakText(txt, msg.id)}
                isSpeaking={currentlySpeakingId === msg.id}
                onStopSpeaking={stopSpeaking}
                onOpenQuiz={(quiz) => {
                  setActiveQuiz(quiz);
                  setIsQuizOpen(true);
                }}
                isStreaming={
                  isLoading &&
                  idx === activeSession.messages.length - 1 &&
                  msg.role === "model"
                }
              />
            ))
          )}

          {/* Typing Indicator in Strict Black & White */}
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
                  className="flex items-center space-x-3 px-3 py-2 text-black/70 dark:text-white/70 select-none"
                >
                  <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 shadow-xs border border-black dark:border-white">
                    <Sparkles className="w-4 h-4 text-white dark:text-black" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-black dark:text-white">
                      Kelvis is thinking
                    </span>
                    <div className="flex items-center space-x-1">
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.15, 0.85] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                        className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white"
                      />
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.15, 0.85] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white"
                      />
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.15, 0.85] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                        className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white"
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
              setSelectedModel("openai/gpt-oss-120b");
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

      {/* Live Full Gemini Voice Call Modal */}
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
        conversationHistory={activeSession?.messages || []}
        systemInstruction={settings.systemInstruction}
      />

      {/* Interactive Blueprint & Practice Quiz Drawer */}
      <QuickQuizDrawer
        isOpen={isQuizOpen}
        quiz={activeQuiz}
        onClose={() => setIsQuizOpen(false)}
        onSubmitQuiz={(submissionText) => {
          setIsQuizOpen(false);
          handleSendMessage(submissionText, {
            bypassAutoQuiz: true,
            isBackgroundSubmission: true,
          });
        }}
      />

      {/* Apps Ecosystem Modal (Binance, Bouk, Spotify, Wave App Store) */}
      <AppsModal
        isOpen={isAppsModalOpen}
        onClose={() => setIsAppsModalOpen(false)}
        onLaunchBinance={() => setIsBinanceModalOpen(true)}
        onLaunchBouk={() => setIsBoukOpen(true)}
        onLaunchSpotify={() => setIsSpotifyOpen(true)}
      />

      {/* Codebase & Central Project Files Workspace Modal */}
      <CodebaseModal
        isOpen={isCodebaseOpen}
        onClose={() => setIsCodebaseOpen(false)}
        onOpenPreview={(files, initialFile) => {
          setPreviewModalData({
            isOpen: true,
            files: files.map((f) => ({
              name: f.name,
              code: f.code,
              language: f.language,
            })),
            initialFile,
          });
        }}
      />

      {/* Global Code Preview Modal for live app testing */}
      {previewModalData.isOpen && (
        <CodePreviewModal
          isOpen={previewModalData.isOpen}
          onClose={() =>
            setPreviewModalData({
              isOpen: false,
              files: [],
            })
          }
          files={previewModalData.files}
          initialActiveFile={previewModalData.initialFile}
        />
      )}
    </div>
  );
}
