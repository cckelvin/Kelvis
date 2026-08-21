import React, { useRef, useState } from "react";
import {
  ArrowUp,
  Mic,
  MicOff,
  Radio,
  ChevronDown,
  Play,
  X,
  FileText,
  Image as ImageIcon,
  Check,
  Code,
  Sparkles,
  Paperclip,
  UploadCloud,
  FileUp,
} from "lucide-react";
import { AttachedFile } from "../types";

interface InputToolbarProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  attachedFiles: AttachedFile[];
  onAddFiles: (files: AttachedFile[]) => void;
  onRemoveFile: (index: number) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isListening: boolean;
  onToggleSpeechToText: () => void;
  isVoiceCallActive: boolean;
  onToggleVoiceCall: () => void;
  isCodeMode?: boolean;
  onToggleCodeMode?: () => void;
}

const AVAILABLE_MODELS = [
  { id: "openai/gpt-oss-120b", name: "openai/gpt-oss-120b", desc: "Flagship 120B Open Architecture Model" },
  { id: "openai/gpt-oss-20b", name: "openai/gpt-oss-20b", desc: "High-Speed 20B Reasoning Model" },
  { id: "groq/mixtral-8x7b-32768", name: "groq/mixtral-8x7b-32768", desc: "Mixtral 8x7B (Vision & Image Prompting)" },
  { id: "groq/llama3-8b", name: "groq/llama3-8b", desc: "Llama 3 8B (Fast Free File Analysis)" },
];

export const InputToolbar: React.FC<InputToolbarProps> = ({
  prompt,
  setPrompt,
  onSend,
  isLoading,
  attachedFiles,
  onAddFiles,
  onRemoveFile,
  selectedModel,
  setSelectedModel,
  isListening,
  onToggleSpeechToText,
  isVoiceCallActive,
  onToggleVoiceCall,
  isCodeMode,
  onToggleCodeMode,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = (fileList: File[]) => {
    if (!fileList || fileList.length === 0) return;
    const newFiles: AttachedFile[] = [];
    let count = 0;

    fileList.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newFiles.push({
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            data: event.target.result as string,
            size: file.size,
          });
          count++;
          if (count === fileList.length) {
            onAddFiles(newFiles);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && (prompt.trim() || attachedFiles.length > 0)) {
        onSend();
      }
    }
  };

  const currentModelObj =
    AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  const canSend = !isLoading && (prompt.trim().length > 0 || attachedFiles.length > 0);

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 pb-4 select-none">
      {/* Container framing hand-drawn pill input structure with drag and drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative bg-slate-100/90 dark:bg-zinc-900/90 border-2 rounded-3xl p-2 sm:p-3 shadow-md backdrop-blur-md transition-all ${
          isDragging
            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 scale-[1.01]"
            : "border-slate-300 dark:border-zinc-700"
        }`}
      >
        {/* Drag & Drop Visual Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-emerald-500/15 backdrop-blur-xs rounded-3xl z-30 flex items-center justify-center border-2 border-dashed border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
            <div className="flex items-center space-x-2 bg-white dark:bg-zinc-900 px-4 py-2 rounded-2xl shadow-lg">
              <UploadCloud className="w-5 h-5 text-emerald-500 animate-bounce" />
              <span>Drop files here to analyze with Groq AI</span>
            </div>
          </div>
        )}

        {/* Attachment chips above input */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 px-2 pt-1">
            {attachedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-1.5 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 px-2.5 py-1.5 rounded-xl text-xs text-slate-800 dark:text-zinc-200 shadow-xs"
              >
                {file.mimeType.startsWith("image/") ? (
                  <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span className="truncate max-w-[150px] font-semibold text-[11px] sm:text-xs">
                  {file.name}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                  ({Math.round((file.size || 0) / 1024)} KB)
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveFile(idx)}
                  className="hover:text-rose-500 p-0.5 rounded-full transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>+ Add more files</span>
            </button>
          </div>
        )}

        {/* TOP ROW: Large Rounded Pill Input + Circular Send Button */}
        <div className="flex items-center space-x-2 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-full px-3.5 py-1.5 shadow-inner">
          {/* Voice Call Active Pulse indicator inside input */}
          {isVoiceCallActive && (
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          )}

          {/* Quick Paperclip File Attachment Shortcut inside input */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-full text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title="Attach documents, data files (CSV, JSON, Code, PDF, Images) for Groq analysis"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Textarea Input with Perplexity-style font size */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              attachedFiles.length > 0
                ? `Analyze ${attachedFiles.length} attached file(s) with Groq AI or ask a question...`
                : isListening
                ? "Listening to speech... Speak clearly..."
                : isVoiceCallActive
                ? "Voice call active... Ask Kelvis anything..."
                : "Ask Kelvis anything, analyze files, or code platforms..."
            }
            rows={1}
            className="w-full bg-transparent text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 text-sm sm:text-base focus:outline-hidden resize-none py-1.5 max-h-32 min-h-[2.25rem]"
          />

          {/* Send Button: Circular button with Play/Send icon */}
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all shadow-sm ${
              !canSend
                ? "border-slate-300 dark:border-zinc-700 bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed"
                : "border-slate-800 dark:border-zinc-200 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-105 active:scale-95 cursor-pointer"
            }`}
            title={attachedFiles.length > 0 ? "Send files for Groq AI analysis" : "Send Message"}
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </button>
        </div>

        {/* BOTTOM ROW: Action Icon Buttons */}
        <div className="flex items-center justify-between mt-2 pt-1 px-1 sm:px-2 border-t border-slate-200/60 dark:border-zinc-800/80">
          
          {/* Left Action Buttons: Upload Files, Speech-To-Text, Voice Call, Coding Mode */}
          <div className="flex items-center space-x-2">
            
            {/* Hidden File Input supporting all data formats */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="*/*,image/*,.pdf,.txt,.doc,.docx,.md,.json,.js,.ts,.tsx,.jsx,.html,.css,.py,.sql,.csv,.log,.xml,.yaml,.yml"
              className="hidden"
            />

            {/* BUTTON 1: UPLOAD & SEND FILES -> Arrow Up icon `↑` / File Upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-2 rounded-xl border transition-all shadow-2xs group relative cursor-pointer ${
                attachedFiles.length > 0
                  ? "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20"
                  : "border-slate-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200"
              }`}
              title="Upload & Send Files for Groq AI Analysis (Code, CSV, JSON, Docs, Images)"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              {attachedFiles.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 text-black text-[9px] font-black rounded-full flex items-center justify-center border border-white dark:border-zinc-900 shadow-xs">
                  {attachedFiles.length}
                </span>
              )}
            </button>

            {/* BUTTON 2: SPEECH-TO-TEXT -> Microphone icon `🎤` */}
            <button
              type="button"
              onClick={onToggleSpeechToText}
              className={`p-2 rounded-xl border transition-all shadow-2xs relative cursor-pointer ${
                isListening
                  ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                  : "border-slate-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200"
              }`}
              title={isListening ? "Listening... Click to stop" : "Speech-to-Text Voice Input"}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            {/* BUTTON 3: VOICE CALL -> Radio icon `🎙️` */}
            <button
              type="button"
              onClick={onToggleVoiceCall}
              className={`p-2 rounded-xl border transition-all shadow-2xs relative cursor-pointer ${
                isVoiceCallActive
                  ? "bg-emerald-600 text-white border-emerald-700 shadow-emerald-500/20 shadow-md"
                  : "border-slate-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200"
              }`}
              title={isVoiceCallActive ? "Voice Call Active" : "Voice Call Mode (Read Responses Aloud with Text-to-Speech)"}
            >
              <Radio className={`w-4 h-4 ${isVoiceCallActive ? "animate-spin" : ""}`} />
            </button>

            {/* BUTTON 4: CODE MODE -> Code icon `💻` */}
            <button
              type="button"
              onClick={() => {
                if (onToggleCodeMode) {
                  onToggleCodeMode();
                } else {
                  setSelectedModel("openai/gpt-oss-120b");
                }
              }}
              className={`p-2 rounded-xl border transition-all shadow-2xs relative cursor-pointer ${
                isCodeMode || selectedModel.includes("120b")
                  ? "bg-sky-600 text-white border-sky-500 shadow-sky-500/20 shadow-md"
                  : "border-slate-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200"
              }`}
              title="Coding Mode (Strictly runs on Open GPT-OSS 120B)"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>

          {/* Model Selection Dropdown pill on bottom right */}
          <div className="flex items-center space-x-2 relative">
            {(isCodeMode || selectedModel.includes("120b")) && (
              <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 text-sky-500" />
                <span>Open GPT-OSS 120B</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border-2 border-slate-400 dark:border-zinc-600 bg-white dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-800 dark:text-zinc-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              title="Select AI Model"
            >
              <span className="truncate max-w-[110px] sm:max-w-none">
                {currentModelObj.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            </button>

            {/* Model Selection Menu Popup */}
            {showModelDropdown && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowModelDropdown(false)}
                />
                <div className="absolute right-0 bottom-full mb-2 w-64 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-2xl shadow-xl z-30 overflow-hidden py-1 select-none">
                  <div className="px-3 py-2 border-b border-slate-200 dark:border-zinc-800 text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Model Selection
                  </div>
                  {AVAILABLE_MODELS.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(model.id);
                        setShowModelDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-start justify-between transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-zinc-100">
                          {model.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                          {model.desc}
                        </div>
                      </div>
                      {selectedModel === model.id && (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
