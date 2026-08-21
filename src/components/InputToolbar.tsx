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
        className={`relative bg-white dark:bg-black border-2 rounded-3xl p-2 sm:p-3 shadow-md backdrop-blur-md transition-all ${
          isDragging
            ? "border-black dark:border-white bg-black/5 dark:bg-white/10 scale-[1.01]"
            : "border-black/20 dark:border-white/20"
        }`}
      >
        {/* Drag & Drop Visual Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-black/10 dark:bg-white/10 backdrop-blur-xs rounded-3xl z-30 flex items-center justify-center border-2 border-dashed border-black dark:border-white text-black dark:text-white font-black text-sm">
            <div className="flex items-center space-x-2 bg-white dark:bg-black px-4 py-2 rounded-2xl shadow-lg border border-black dark:border-white">
              <UploadCloud className="w-5 h-5 text-black dark:text-white animate-bounce" />
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
                className="flex items-center space-x-1.5 bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-xs"
              >
                {file.mimeType.startsWith("image/") ? (
                  <ImageIcon className="w-3.5 h-3.5 text-white dark:text-black" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-white dark:text-black" />
                )}
                <span className="truncate max-w-[150px] font-bold text-[11px] sm:text-xs">
                  {file.name}
                </span>
                <span className="text-[10px] text-white/70 dark:text-black/70 font-mono">
                  ({Math.round((file.size || 0) / 1024)} KB)
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveFile(idx)}
                  className="hover:opacity-75 p-0.5 rounded-full transition-opacity cursor-pointer"
                  title="Remove file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-black/10 dark:bg-white/15 text-black dark:text-white border border-black/30 dark:border-white/30 transition-colors cursor-pointer hover:bg-black/20 dark:hover:bg-white/25"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>+ Add more files</span>
            </button>
          </div>
        )}

        {/* TOP ROW: Large Rounded Pill Input + Circular Send Button */}
        <div className="flex items-center space-x-2 bg-white dark:bg-black border border-black/25 dark:border-white/25 rounded-full px-3.5 py-1.5 shadow-inner">
          {/* Voice Call Active Pulse indicator inside input */}
          {isVoiceCallActive && (
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black dark:bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-black dark:bg-white"></span>
            </span>
          )}

          {/* Quick Paperclip File Attachment Shortcut inside input */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-full text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
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
            className="w-full bg-transparent text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 text-base font-semibold focus:outline-hidden resize-none py-1.5 max-h-32 min-h-[2.25rem]"
          />

          {/* Send Button: Circular button with Play/Send icon */}
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all shadow-xs ${
              !canSend
                ? "border-black/20 dark:border-white/20 bg-black/10 dark:bg-white/10 text-black/40 dark:text-white/40 cursor-not-allowed"
                : "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95 cursor-pointer font-bold"
            }`}
            title={attachedFiles.length > 0 ? "Send files for Groq AI analysis" : "Send Message"}
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </button>
        </div>

        {/* BOTTOM ROW: Action Icon Buttons */}
        <div className="flex items-center justify-between mt-2 pt-1 px-1 sm:px-2 border-t border-black/15 dark:border-white/15">
          
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
                  ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold shadow-md"
                  : "border-black/20 dark:border-white/20 bg-white/80 dark:bg-black/80 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white font-bold"
              }`}
              title="Upload & Send Files for Groq AI Analysis (Code, CSV, JSON, Docs, Images)"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              {attachedFiles.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black text-white dark:bg-white dark:text-black text-[9px] font-black rounded-full flex items-center justify-center border border-white dark:border-black shadow-xs">
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
                  ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white animate-pulse"
                  : "border-black/20 dark:border-white/20 bg-white/80 dark:bg-black/80 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white"
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
                  ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md font-bold"
                  : "border-black/20 dark:border-white/20 bg-white/80 dark:bg-black/80 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white"
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
                  ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md font-bold"
                  : "border-black/20 dark:border-white/20 bg-white/80 dark:bg-black/80 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white"
              }`}
              title="Coding Mode (Strictly runs on Open GPT-OSS 120B)"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>

          {/* Model Selection Dropdown pill on bottom right */}
          <div className="flex items-center space-x-2 relative">
            <button
              type="button"
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-black/30 dark:border-white/30 bg-white dark:bg-black hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Select AI Model"
            >
              <span className="truncate max-w-[110px] sm:max-w-none">
                {currentModelObj.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-black/60 dark:text-white/60" />
            </button>

            {/* Model Selection Menu Popup */}
            {showModelDropdown && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowModelDropdown(false)}
                />
                <div className="absolute right-0 bottom-full mb-2 w-72 bg-white dark:bg-black border border-black/30 dark:border-white/30 rounded-2xl shadow-xl z-30 overflow-hidden py-1 select-none">
                  <div className="px-3 py-2 border-b border-black/15 dark:border-white/15 text-[11px] font-black text-black/60 dark:text-white/60 uppercase tracking-wider">
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
                      className="w-full text-left px-3 py-2.5 hover:bg-black/5 dark:hover:bg-white/10 flex items-start justify-between transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-black dark:text-white">
                          {model.name}
                        </div>
                        <div className="text-[10px] font-medium text-black/60 dark:text-white/60">
                          {model.desc}
                        </div>
                      </div>
                      {selectedModel === model.id && (
                        <Check className="w-4 h-4 text-black dark:text-white shrink-0 mt-0.5 stroke-[3]" />
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
