import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Sparkles,
  Radio,
  MessageSquare,
  Bot,
  User,
} from "lucide-react";

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (text: string) => Promise<void>;
  isAiResponding: boolean;
  lastAiText?: string;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  isOpen,
  onClose,
  onSendMessage,
  isAiResponding,
  lastAiText,
  onSpeak,
  isSpeaking,
  onStopSpeaking,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const [callState, setCallState] = useState<"connecting" | "active" | "user_speaking" | "ai_speaking" | "idle">("connecting");
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

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

  // Handle call state changes
  useEffect(() => {
    if (!isOpen) return;
    if (isAiResponding || isSpeaking) {
      setCallState("ai_speaking");
    } else if (transcript.trim().length > 0) {
      setCallState("user_speaking");
    } else {
      setCallState("active");
    }
  }, [isOpen, isAiResponding, isSpeaking, transcript]);

  // Format call duration MM:SS
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Start Voice Recognition Loop
  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

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
      if (isMuted || isSpeaking || isAiResponding) return;

      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }

      if (currentTranscript) {
        setTranscript(currentTranscript);
        setCallState("user_speaking");

        // Clear existing silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Auto-send when user finishes speaking (1.2s silence)
        silenceTimerRef.current = setTimeout(async () => {
          const textToSend = currentTranscript.trim();
          if (textToSend && !isAiResponding) {
            setTranscript("");
            setCallState("ai_speaking");
            await onSendMessage(textToSend);
          }
        }, 1300);
      }
    };

    recognition.onerror = () => {
      // Auto restart if still in call
      if (isOpen && !isMuted) {
        try {
          recognition.start();
        } catch (e) {}
      }
    };

    recognition.onend = () => {
      if (isOpen && !isMuted) {
        try {
          recognition.start();
        } catch (e) {}
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
    };
  }, [isOpen, isMuted, isSpeaking, isAiResponding]);

  // When AI finishes speaking, read aloud if speaker is unmuted
  useEffect(() => {
    if (isOpen && lastAiText && !isSpeakerMuted && !isSpeaking && !isAiResponding) {
      // Clean markdown tags for voice readout
      const cleanText = lastAiText
        .replace(/```[\s\S]*?```/g, "I have generated the code files for you.")
        .replace(/<plan>[\s\S]*?<\/plan>/g, "")
        .replace(/[*_#`]/g, "")
        .slice(0, 500);
      onSpeak(cleanText);
    }
  }, [lastAiText]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col items-center relative overflow-hidden">
        {/* Ambient background glow */}
        <div
          className={`absolute -top-24 w-72 h-72 rounded-full blur-3xl opacity-30 transition-all duration-700 pointer-events-none ${
            callState === "ai_speaking"
              ? "bg-emerald-500 scale-125"
              : callState === "user_speaking"
              ? "bg-indigo-500 scale-110"
              : "bg-teal-600 scale-90"
          }`}
        />

        {/* Top Call Info */}
        <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-8 z-10">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-semibold tracking-wider uppercase text-slate-200">
              Live Voice Call
            </span>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 font-mono text-emerald-400">
            {formatDuration(callDuration)}
          </div>
        </div>

        {/* Center Animated Voice Orb */}
        <div className="relative my-6 flex items-center justify-center">
          {/* Pulsing Ripple Rings */}
          <div
            className={`absolute w-36 h-36 rounded-full border-2 transition-all duration-500 ${
              callState === "ai_speaking"
                ? "border-emerald-500/40 animate-ping"
                : callState === "user_speaking"
                ? "border-indigo-500/40 animate-ping"
                : "border-slate-700"
            }`}
          />
          <div
            className={`absolute w-28 h-28 rounded-full border transition-all duration-300 ${
              callState === "ai_speaking"
                ? "border-emerald-400 scale-110 shadow-lg shadow-emerald-500/30"
                : callState === "user_speaking"
                ? "border-indigo-400 scale-105 shadow-lg shadow-indigo-500/30"
                : "border-slate-700"
            }`}
          />

          {/* Central Orb */}
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
              callState === "ai_speaking"
                ? "bg-gradient-to-tr from-emerald-600 to-teal-400 text-white scale-105"
                : callState === "user_speaking"
                ? "bg-gradient-to-tr from-indigo-600 to-purple-500 text-white scale-105"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            {callState === "ai_speaking" ? (
              <Sparkles className="w-8 h-8 animate-spin text-white" style={{ animationDuration: "4s" }} />
            ) : callState === "user_speaking" ? (
              <Mic className="w-8 h-8 animate-bounce text-white" />
            ) : (
              <Bot className="w-8 h-8 text-emerald-400" />
            )}
          </div>
        </div>

        {/* Call Status Label */}
        <div className="text-center my-4 z-10 min-h-[44px]">
          <h3 className="text-lg font-bold text-slate-100">
            {callState === "ai_speaking"
              ? "Kelvis is speaking..."
              : callState === "user_speaking"
              ? "Listening to you..."
              : isMuted
              ? "Microphone Muted"
              : "Kelvis is listening"}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs truncate">
            {transcript ? `"${transcript}"` : "Speak naturally — pauses trigger AI reply"}
          </p>
        </div>

        {/* Subtitles / Last AI thought snippet */}
        {lastAiText && (
          <div className="w-full bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 my-3 text-xs text-slate-300 max-h-24 overflow-y-auto z-10 leading-relaxed font-sans">
            <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1 flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>Latest AI Response</span>
            </div>
            <p className="line-clamp-3">
              {lastAiText
                .replace(/```[\s\S]*?```/g, "[Code generated]")
                .replace(/<plan>[\s\S]*?<\/plan>/g, "")
                .replace(/[*_#`]/g, "")}
            </p>
          </div>
        )}

        {/* Controls Bar */}
        <div className="flex items-center space-x-5 mt-6 z-10">
          {/* Mute Mic Toggle */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMuted
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            }`}
            title={isMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={() => {
              onStopSpeaking();
              onClose();
            }}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            title="End Voice Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          {/* Speaker Volume Toggle */}
          <button
            type="button"
            onClick={() => {
              if (!isSpeakerMuted) onStopSpeaking();
              setIsSpeakerMuted(!isSpeakerMuted);
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isSpeakerMuted
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
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
