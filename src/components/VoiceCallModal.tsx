import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Sparkles,
  Radio,
  Bot,
  User,
  Settings2,
  ChevronDown,
  Activity,
  Zap,
  RotateCcw,
  Check,
} from "lucide-react";

export type GeminiVoiceName = "Kore" | "Puck" | "Fenrir" | "Charon" | "Zephyr";

interface VoicePersona {
  id: GeminiVoiceName;
  name: string;
  desc: string;
  tone: string;
  avatarBg: string;
}

const VOICE_PERSONAS: VoicePersona[] = [
  {
    id: "Kore",
    name: "Kore",
    desc: "Warm & Expressive",
    tone: "Natural, engaging feminine voice with empathetic tone",
    avatarBg: "from-pink-500 to-rose-500",
  },
  {
    id: "Puck",
    name: "Puck",
    desc: "Upbeat & Energetic",
    tone: "Lively, curious, and fast-paced conversational voice",
    avatarBg: "from-amber-500 to-orange-500",
  },
  {
    id: "Fenrir",
    name: "Fenrir",
    desc: "Deep & Authoritative",
    tone: "Resonant, clear, and confident masculine baritone",
    avatarBg: "from-blue-600 to-indigo-700",
  },
  {
    id: "Zephyr",
    name: "Zephyr",
    desc: "Calm & Soothing",
    tone: "Relaxed, gentle, and balanced pacing",
    avatarBg: "from-teal-500 to-emerald-600",
  },
  {
    id: "Charon",
    name: "Charon",
    desc: "Refined & Thoughtful",
    tone: "Intellectual, distinguished, and articulated timbre",
    avatarBg: "from-purple-600 to-violet-800",
  },
];

interface MessageHistoryItem {
  role: string;
  text: string;
}

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (text: string) => Promise<void>;
  isAiResponding?: boolean;
  lastAiText?: string;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
  onStopSpeaking?: () => void;
  conversationHistory?: MessageHistoryItem[];
  systemInstruction?: string;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  isOpen,
  onClose,
  onSendMessage,
  lastAiText,
  onSpeak,
  onStopSpeaking,
  conversationHistory = [],
  systemInstruction,
}) => {
  // Voice engine & persona state
  const [selectedVoice, setSelectedVoice] = useState<GeminiVoiceName>("Kore");
  const [voiceEngine, setVoiceEngine] = useState<"gemini-neural" | "web-speech">("gemini-neural");
  const [showVoicePicker, setShowVoicePicker] = useState(false);

  // Call status state
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastSpokenReply, setLastSpokenReply] = useState<string>("");
  const [callDuration, setCallDuration] = useState(0);
  const [callState, setCallState] = useState<"connecting" | "active" | "user_speaking" | "ai_thinking" | "ai_speaking">("connecting");
  const [isHandsFree, setIsHandsFree] = useState(true);
  const [isPushToTalking, setIsPushToTalking] = useState(false);

  // Audio nodes & canvas refs
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isCurrentlyProcessingRef = useRef(false);

  // Initialize or get AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx({ sampleRate: 24000 });
      }
    }
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch(() => {});
    }
    return audioContextRef.current;
  }, []);

  // Procedural Sound Effects (Chime for AI start/connect)
  const playChime = useCallback((type: "start" | "receive" | "end") => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "start") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "receive") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {}
  }, [getAudioContext]);

  // Stop any ongoing AI audio playback immediately (Barge-in / interrupt support)
  const stopAiAudio = useCallback(() => {
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
        currentAudioSourceRef.current.disconnect();
      } catch (e) {}
      currentAudioSourceRef.current = null;
    }
    if (onStopSpeaking) {
      onStopSpeaking();
    }
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    if (callState === "ai_speaking") {
      setCallState("active");
    }
  }, [onStopSpeaking, callState]);

  // Play synthesized audio buffer with real-time AnalyserNode hookup
  const playAudioBuffer = useCallback(
    async (arrayBuffer: ArrayBuffer): Promise<void> => {
      stopAiAudio();
      if (isSpeakerMuted) return;

      const ctx = getAudioContext();
      if (!ctx) return;

      try {
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;

        // Setup analyser for live waveform visualizer
        if (!analyserRef.current) {
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.8;
          analyserRef.current = analyser;
        }

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(1.0, ctx.currentTime);

        source.connect(analyserRef.current);
        analyserRef.current.connect(gainNode);
        gainNode.connect(ctx.destination);

        currentAudioSourceRef.current = source;
        setCallState("ai_speaking");

        source.onended = () => {
          if (currentAudioSourceRef.current === source) {
            currentAudioSourceRef.current = null;
            setCallState("active");
          }
        };

        source.start(0);
      } catch (err) {
        console.warn("Audio buffer playback fallback:", err);
        setCallState("active");
      }
    },
    [getAudioContext, isSpeakerMuted, stopAiAudio]
  );

  // Send turn to Gemini Voice Call API and play neural response
  const handleVoiceTurn = useCallback(
    async (spokenPrompt: string) => {
      if (!spokenPrompt.trim() || isCurrentlyProcessingRef.current) return;
      isCurrentlyProcessingRef.current = true;
      setCallState("ai_thinking");
      playChime("receive");

      try {
        if (voiceEngine === "gemini-neural") {
          const response = await fetch("/api/voice/gemini-call", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: spokenPrompt,
              voiceName: selectedVoice,
              systemInstruction,
              history: conversationHistory.slice(-4),
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setLastSpokenReply(data.text || "");

            // Sync with main chat session asynchronously
            onSendMessage(spokenPrompt).catch(() => {});

            if (data.audioBase64 && !isSpeakerMuted) {
              const binary = atob(data.audioBase64);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
              }
              await playAudioBuffer(bytes.buffer);
            } else if (data.text && !isSpeakerMuted) {
              // Web speech fallback if no audio stream
              if (onSpeak) onSpeak(data.text);
              setCallState("ai_speaking");
            } else {
              setCallState("active");
            }
          } else {
            throw new Error("Gemini voice API status: " + response.status);
          }
        } else {
          // Standard web-speech mode
          await onSendMessage(spokenPrompt);
          setCallState("active");
        }
      } catch (err) {
        console.warn("Voice turn fallback to chat pipeline:", err);
        await onSendMessage(spokenPrompt);
        setCallState("active");
      } finally {
        isCurrentlyProcessingRef.current = false;
      }
    },
    [
      voiceEngine,
      selectedVoice,
      systemInstruction,
      conversationHistory,
      playChime,
      onSendMessage,
      isSpeakerMuted,
      playAudioBuffer,
      onSpeak,
    ]
  );

  // Call duration counter
  useEffect(() => {
    if (!isOpen) {
      setCallDuration(0);
      return;
    }
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Waveform / Spectrum Visualizer Loop
  useEffect(() => {
    if (!isOpen) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dataArray = new Uint8Array(32);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      let isVoiceActive = false;
      if (analyserRef.current && callState === "ai_speaking") {
        analyserRef.current.getByteFrequencyData(dataArray);
        isVoiceActive = dataArray.some((val) => val > 10);
      }

      const barCount = 28;
      const barWidth = 4;
      const gap = (width - barCount * barWidth) / (barCount - 1);

      for (let i = 0; i < barCount; i++) {
        let barHeight = 6;
        if (callState === "ai_speaking") {
          const freqVal = dataArray[i % dataArray.length] || 0;
          barHeight = Math.max(6, (freqVal / 255) * (height - 10));
        } else if (callState === "user_speaking") {
          // Animated user voice wave
          const time = Date.now() / 150;
          barHeight = 10 + Math.abs(Math.sin(time + i * 0.4)) * (height * 0.6);
        } else if (callState === "ai_thinking") {
          const time = Date.now() / 200;
          barHeight = 8 + Math.abs(Math.sin(time + i * 0.25)) * 24;
        } else {
          barHeight = 4 + Math.sin(Date.now() / 400 + i) * 3;
        }

        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (callState === "ai_speaking") {
          gradient.addColorStop(0, "#10b981");
          gradient.addColorStop(1, "#06b6d4");
        } else if (callState === "user_speaking") {
          gradient.addColorStop(0, "#818cf8");
          gradient.addColorStop(1, "#c084fc");
        } else if (callState === "ai_thinking") {
          gradient.addColorStop(0, "#f59e0b");
          gradient.addColorStop(1, "#ef4444");
        } else {
          gradient.addColorStop(0, "#475569");
          gradient.addColorStop(1, "#334155");
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isOpen, callState]);

  // Start Voice Recognition Loop
  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopAiAudio();
      return;
    }

    playChime("start");

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setCallState("active");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setCallState("active");
    };

    recognition.onresult = (event: any) => {
      if (isMuted || isCurrentlyProcessingRef.current) return;

      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }

      if (currentTranscript.trim()) {
        // User started speaking -> Interrupt AI speech instantly (Barge-in)
        if (callState === "ai_speaking") {
          stopAiAudio();
        }

        setTranscript(currentTranscript);
        setCallState("user_speaking");

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Auto-send in Hands-free mode after 1.2s silence
        if (isHandsFree) {
          silenceTimerRef.current = setTimeout(async () => {
            const textToSend = currentTranscript.trim();
            if (textToSend && !isCurrentlyProcessingRef.current) {
              setTranscript("");
              await handleVoiceTurn(textToSend);
            }
          }, 1200);
        }
      }
    };

    recognition.onerror = (e: any) => {
      if (isOpen && !isMuted) {
        try {
          recognition.start();
        } catch (err) {}
      }
    };

    recognition.onend = () => {
      if (isOpen && !isMuted) {
        try {
          recognition.start();
        } catch (err) {}
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {}

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        recognition.stop();
      } catch (e) {}
      stopAiAudio();
    };
  }, [isOpen, isMuted, isHandsFree, stopAiAudio, playChime, handleVoiceTurn]);

  // Sync lastAiText update if available
  useEffect(() => {
    if (lastAiText && !lastSpokenReply) {
      setLastSpokenReply(lastAiText);
    }
  }, [lastAiText]);

  // Format call duration MM:SS
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  const currentPersona = VOICE_PERSONAS.find((p) => p.id === selectedVoice) || VOICE_PERSONAS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      {/* Background Ambient Glows */}
      <div
        className={`absolute w-96 h-96 rounded-full blur-[100px] opacity-25 transition-all duration-700 pointer-events-none ${
          callState === "ai_speaking"
            ? "bg-emerald-500 scale-125"
            : callState === "user_speaking"
            ? "bg-indigo-500 scale-110"
            : callState === "ai_thinking"
            ? "bg-amber-500 scale-105"
            : "bg-teal-600 scale-90"
        }`}
      />

      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col items-center relative overflow-hidden backdrop-blur-2xl">
        {/* Top Header Bar */}
        <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-6 z-10">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-semibold tracking-wider uppercase text-slate-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Gemini Live Voice
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Voice persona quick selector */}
            <button
              type="button"
              onClick={() => setShowVoicePicker(!showVoicePicker)}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-200 transition-colors cursor-pointer text-xs font-medium"
            >
              <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${currentPersona.avatarBg}`} />
              <span>{currentPersona.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Timer Badge */}
            <div className="px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 font-mono text-emerald-400 font-medium">
              {formatDuration(callDuration)}
            </div>
          </div>
        </div>

        {/* Voice Persona Dropdown Drawer */}
        <AnimatePresence>
          {showVoicePicker && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="w-full bg-slate-800/95 border border-slate-700 rounded-2xl p-3 mb-4 z-20 shadow-xl"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-2 mb-2">
                <span>Select Gemini Neural Voice</span>
                <span className="text-[10px] text-emerald-400">24kHz Studio HD</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {VOICE_PERSONAS.map((persona) => {
                  const isSelected = selectedVoice === persona.id;
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => {
                        setSelectedVoice(persona.id);
                        setShowVoicePicker(false);
                      }}
                      className={`flex items-start space-x-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-500/15 border-emerald-500/50 text-white"
                          : "bg-slate-900/60 border-slate-700/60 hover:bg-slate-700/50 text-slate-300"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${persona.avatarBg} flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{persona.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">{persona.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center Animated Voice Orb & Dynamic Pulsing Aura */}
        <div className="relative my-6 flex items-center justify-center">
          {/* Outer Ripple Rings */}
          <div
            className={`absolute w-44 h-44 rounded-full border-2 transition-all duration-500 ${
              callState === "ai_speaking"
                ? "border-emerald-500/40 animate-ping"
                : callState === "user_speaking"
                ? "border-indigo-500/40 animate-ping"
                : callState === "ai_thinking"
                ? "border-amber-500/30 animate-pulse"
                : "border-slate-800"
            }`}
          />
          <div
            className={`absolute w-36 h-36 rounded-full border transition-all duration-300 ${
              callState === "ai_speaking"
                ? "border-emerald-400/80 scale-110 shadow-lg shadow-emerald-500/25"
                : callState === "user_speaking"
                ? "border-indigo-400/80 scale-105 shadow-lg shadow-indigo-500/25"
                : callState === "ai_thinking"
                ? "border-amber-400/80 scale-105 shadow-lg shadow-amber-500/25"
                : "border-slate-700/60"
            }`}
          />

          {/* Central Glowing Interactive Orb */}
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 relative ${
              callState === "ai_speaking"
                ? `bg-gradient-to-tr ${currentPersona.avatarBg} text-white scale-105 shadow-emerald-500/40`
                : callState === "user_speaking"
                ? "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white scale-105 shadow-indigo-500/40"
                : callState === "ai_thinking"
                ? "bg-gradient-to-tr from-amber-600 to-rose-600 text-white scale-100 animate-pulse"
                : "bg-slate-800 border border-slate-700 text-slate-300"
            }`}
          >
            {callState === "ai_speaking" ? (
              <Sparkles className="w-10 h-10 animate-spin text-white" style={{ animationDuration: "5s" }} />
            ) : callState === "user_speaking" ? (
              <Mic className="w-10 h-10 animate-bounce text-white" />
            ) : callState === "ai_thinking" ? (
              <Activity className="w-10 h-10 animate-spin text-amber-200" />
            ) : (
              <Bot className="w-10 h-10 text-emerald-400" />
            )}
          </div>
        </div>

        {/* Real-time Waveform Canvas Visualizer */}
        <div className="w-full h-12 flex items-center justify-center my-1 z-10 px-4">
          <canvas
            ref={canvasRef}
            width={340}
            height={48}
            className="w-full max-w-[340px] h-12"
          />
        </div>

        {/* Call Status Label & Spoken Indicator */}
        <div className="text-center my-3 z-10 min-h-[48px]">
          <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center justify-center gap-2">
            {callState === "ai_speaking" ? (
              <>
                <span className="text-emerald-400">{currentPersona.name}</span> is speaking...
              </>
            ) : callState === "ai_thinking" ? (
              <>
                <span>Kelvis is formulating reply...</span>
              </>
            ) : callState === "user_speaking" ? (
              <>
                <span className="text-indigo-400">Listening to you...</span>
              </>
            ) : isMuted ? (
              <span className="text-rose-400">Microphone Muted</span>
            ) : (
              <span>Kelvis is listening</span>
            )}
          </h3>

          <p className="text-xs text-slate-400 mt-1 max-w-sm truncate mx-auto">
            {transcript
              ? `"${transcript}"`
              : callState === "ai_speaking"
              ? "Interrupt anytime by speaking"
              : "Speak naturally — 24kHz Gemini Neural Voice active"}
          </p>
        </div>

        {/* Live Subtitles / Spoken Response Box */}
        {(lastSpokenReply || transcript) && (
          <div className="w-full bg-slate-800/70 border border-slate-700/60 rounded-2xl p-3.5 my-2 text-xs text-slate-200 max-h-24 overflow-y-auto z-10 leading-relaxed font-sans scrollbar-thin">
            <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Live Spoken Transcript
              </span>
              <span className="text-[9px] text-slate-400 font-mono">24kHz Audio</span>
            </div>
            <p className="line-clamp-3 text-slate-300">
              {transcript ? (
                <span className="text-indigo-300 font-medium">You: {transcript}</span>
              ) : (
                <span>{lastSpokenReply}</span>
              )}
            </p>
          </div>
        )}

        {/* Interactive Controls Bar */}
        <div className="flex items-center space-x-4 sm:space-x-6 mt-4 z-10">
          {/* Mute Mic Toggle */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMuted
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/50"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            }`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={() => {
              stopAiAudio();
              playChime("end");
              onClose();
            }}
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            title="End Voice Call"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          {/* Speaker Volume Mute Toggle */}
          <button
            type="button"
            onClick={() => {
              if (!isSpeakerMuted) stopAiAudio();
              setIsSpeakerMuted(!isSpeakerMuted);
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isSpeakerMuted
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            }`}
            title={isSpeakerMuted ? "Unmute Speaker" : "Mute Speaker"}
          >
            {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
