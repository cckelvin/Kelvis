import React, { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "motion/react";
import { Message } from "../types";
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Play,
  Code,
  Sparkles,
  Music,
  ChevronDown,
  ChevronRight,
  Download,
  FileCode,
  Layers,
  Terminal,
  Cpu,
  Eye,
  FileArchive,
} from "lucide-react";
import { CodePreviewModal, ProjectFile } from "./CodePreviewModal";
import JSZip from "jszip";

interface ParsedFile {
  name: string;
  code: string;
  language: string;
  lineCount: number;
}

// Plan & Architecture Thought Box Component
const PlanBox: React.FC<{ planText: string }> = ({ planText }) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const lineCount = planText.split("\n").filter((l) => l.trim().length > 0).length;

  return (
    <div className="my-2.5 rounded-2xl border border-amber-500/30 dark:border-amber-400/20 bg-amber-500/5 dark:bg-amber-500/10 overflow-hidden shadow-2xs transition-all">
      {/* Plan Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-amber-500/10 dark:bg-amber-400/15 hover:bg-amber-500/15 text-amber-900 dark:text-amber-200 transition-colors text-left select-none cursor-pointer"
      >
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs tracking-wide">
            Planning & Architecture Strategy
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300 font-mono font-semibold">
            {lineCount} {lineCount === 1 ? "step" : "steps"}
          </span>
        </div>

        <div className="flex items-center space-x-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
          <span>{isOpen ? "Collapse" : "Expand"}</span>
          {isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Plan Body - Smaller text in distinct font */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3.5 font-mono text-[11px] sm:text-xs leading-relaxed text-slate-700 dark:text-amber-100/90 whitespace-pre-wrap border-t border-amber-500/20 bg-white/40 dark:bg-zinc-950/40 select-text">
              {planText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// File Box Grid Component showing small box cards for every code file
const FileBoxGrid: React.FC<{
  files: ParsedFile[];
  onOpenFile: (fileName: string) => void;
}> = ({ files, onOpenFile }) => {
  if (files.length === 0) return null;

  return (
    <div className="my-3 p-3 rounded-2xl bg-slate-200/70 dark:bg-zinc-900/80 border border-slate-300 dark:border-zinc-700/80 shadow-2xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-zinc-200">
          <Layers className="w-4 h-4 text-emerald-500" />
          <span>Project Files ({files.length})</span>
        </div>
        <span className="text-[10px] text-slate-500 dark:text-zinc-400">
          Click any file box to inspect code
        </span>
      </div>

      {/* Small Box Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {files.map((file) => (
          <button
            key={file.name}
            type="button"
            onClick={() => onOpenFile(file.name)}
            className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-800/90 hover:bg-emerald-50 dark:hover:bg-zinc-700/80 border border-slate-200 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-400 text-left transition-all group shadow-2xs cursor-pointer"
          >
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileCode className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-mono font-bold text-xs text-slate-800 dark:text-zinc-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  {file.name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-sans">
                  {file.language} • {file.lineCount} lines
                </div>
              </div>
            </div>

            <div className="shrink-0 text-slate-400 group-hover:text-emerald-500 transition-colors ml-1">
              <Eye className="w-3.5 h-3.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Project Action Bar Component (Run Live Preview + Download Files / ZIP)
const ProjectActionBar: React.FC<{
  files: ParsedFile[];
  onRunPreview: () => void;
  onDownloadZip: () => void;
  isZipping: boolean;
}> = ({ files, onRunPreview, onDownloadZip, isZipping }) => {
  const hasRunnable = files.some(
    (f) =>
      f.language === "html" ||
      f.name.endsWith(".html") ||
      f.code.includes("<html") ||
      f.language === "javascript" ||
      f.language === "js" ||
      f.language === "css"
  );

  return (
    <div className="my-3 p-3 rounded-2xl bg-linear-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-2.5 shadow-xs select-none">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-zinc-100">
            Project Code Ready
          </div>
          <div className="text-[11px] text-slate-600 dark:text-zinc-400">
            {files.length} {files.length === 1 ? "file generated" : "files generated & connected"}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Run Full Web Live Preview */}
        {hasRunnable && (
          <button
            type="button"
            onClick={onRunPreview}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Live Preview</span>
          </button>
        )}

        {/* Download ZIP button */}
        <button
          type="button"
          onClick={onDownloadZip}
          disabled={isZipping}
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 active:scale-95 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <FileArchive className="w-3.5 h-3.5" />
          <span>{isZipping ? "Preparing ZIP..." : "Download ZIP"}</span>
        </button>
      </div>
    </div>
  );
};

// Custom Code Block Renderer Component
const CodeBlockItem: React.FC<{
  lang: string;
  filename?: string;
  codeString: string;
  blockIdx: number;
  canRun: boolean;
  copiedBlockIndex: number | null;
  onCopy: (code: string, idx: number) => void;
  onPreview: (code: string, lang: string, filename?: string) => void;
}> = ({
  lang,
  filename,
  codeString,
  blockIdx,
  canRun,
  copiedBlockIndex,
  onCopy,
  onPreview,
}) => {
  const lineCount = codeString.split("\n").length;

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-300 dark:border-zinc-700 bg-slate-900 dark:bg-zinc-950 text-slate-100 shadow-sm text-xs font-mono">
      {/* Code Box Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-800 dark:bg-zinc-900 border-b border-slate-700 dark:border-zinc-800 text-[11px] text-slate-300 dark:text-zinc-400 font-sans select-none">
        <div className="flex items-center space-x-2 min-w-0">
          <Code className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-bold uppercase tracking-wider text-slate-200">
            {filename || lang || "code"}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-700/80 dark:bg-zinc-800 text-slate-300 font-mono">
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Runnable button */}
          {canRun && (
            <button
              type="button"
              onClick={() => onPreview(codeString, lang, filename)}
              className="px-2 py-0.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Preview</span>
            </button>
          )}

          {/* Copy Button */}
          <button
            type="button"
            onClick={() => onCopy(codeString, blockIdx)}
            className="hover:text-white px-2 py-0.5 rounded-md hover:bg-slate-700 dark:hover:bg-zinc-800 transition-colors flex items-center space-x-1 cursor-pointer"
            title="Copy Code"
          >
            {copiedBlockIndex === blockIdx ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Body */}
      <pre className="p-3.5 overflow-x-auto leading-relaxed text-[12px] bg-slate-900/95 dark:bg-zinc-950 text-slate-200 select-text">
        <code>{codeString}</code>
      </pre>
    </div>
  );
};

interface ChatMessageProps {
  message: Message;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSpeak,
  isSpeaking,
  onStopSpeaking,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedBlockIndex, setCopiedBlockIndex] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<{
    isOpen: boolean;
    initialFile?: string;
    files: ProjectFile[];
  }>({
    isOpen: false,
    files: [],
  });
  const [isZipping, setIsZipping] = useState(false);

  const isUser = message.role === "user";

  // Extract Plan (<plan>...</plan> or <think>...</think>) and clean body text
  const { planText, cleanBodyText, parsedFiles } = useMemo(() => {
    let plan: string | null = null;
    let text = message.text || "";

    // Check for <plan> or <think> tags
    const planMatch = /<(?:plan|think)>([\s\S]*?)<\/(?:plan|think)>/i.exec(text);
    if (planMatch) {
      plan = planMatch[1].trim();
      text = text.replace(/<(?:plan|think)>[\s\S]*?<\/(?:plan|think)>/gi, "").trim();
    }

    // Parse all code blocks for the File Box Grid & Multi-file preview
    const files: ParsedFile[] = [];
    const codeBlockRegex = /```(\w+)?(?:\s+([\w\.\-\/]+))?\n([\s\S]*?)```/g;
    let match;
    let autoCounter = 1;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const lang = (match[1] || "txt").toLowerCase();
      let filename = match[2];
      const code = match[3].trim();

      if (!filename) {
        // Detect filename from first line comment
        const firstLineMatch = /^(?:<!--|\/\/|\/\*|#)\s*([\w\.\-\/]+\.(?:html|css|js|ts|jsx|tsx|json|py|sql|sh|env))\s*(?:-->|\*\/)?/i.exec(code);
        if (firstLineMatch) {
          filename = firstLineMatch[1];
        } else if (lang === "html" || code.includes("<html") || code.includes("<!DOCTYPE")) {
          filename = files.some((f) => f.name === "index.html") ? `page${autoCounter++}.html` : "index.html";
        } else if (lang === "css") {
          filename = files.some((f) => f.name === "style.css") ? `style${autoCounter++}.css` : "style.css";
        } else if (lang === "javascript" || lang === "js") {
          filename = files.some((f) => f.name === "app.js") ? `script${autoCounter++}.js` : "app.js";
        } else if (lang === "typescript" || lang === "ts") {
          filename = `script${autoCounter++}.ts`;
        } else {
          filename = `file_${autoCounter++}.${lang}`;
        }
      }

      files.push({
        name: filename,
        code,
        language: lang,
        lineCount: code.split("\n").length,
      });
    }

    // Highlight pre-processing: replace ==text== with <mark>text</mark>
    const processed = text.replace(/==(.*?)==/g, "<mark>$1</mark>");

    return {
      planText: plan,
      cleanBodyText: processed,
      parsedFiles: files,
    };
  }, [message.text]);

  const handleCopyText = (text: string, index?: number) => {
    navigator.clipboard.writeText(text);
    if (index !== undefined) {
      setCopiedBlockIndex(index);
      setTimeout(() => setCopiedBlockIndex(null), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isRunnableCode = (lang: string, codeStr: string) => {
    const l = lang.toLowerCase();
    return (
      l === "html" ||
      l === "js" ||
      l === "javascript" ||
      l === "css" ||
      l === "ts" ||
      l === "typescript" ||
      codeStr.includes("<html") ||
      codeStr.includes("<div") ||
      codeStr.includes("function")
    );
  };

  const handleOpenLivePreview = (initialFile?: string) => {
    const projectFiles: ProjectFile[] = parsedFiles.map((f) => ({
      name: f.name,
      code: f.code,
      language: f.language,
    }));

    setPreviewData({
      isOpen: true,
      initialFile: initialFile || (parsedFiles[0] ? parsedFiles[0].name : "index.html"),
      files: projectFiles,
    });
  };

  const handleDownloadProjectZip = async () => {
    if (parsedFiles.length === 0) return;
    try {
      setIsZipping(true);
      const zip = new JSZip();

      parsedFiles.forEach((file) => {
        zip.file(file.name, file.code);
      });

      // Add a clean README.md
      if (!parsedFiles.some((f) => f.name.toLowerCase() === "readme.md")) {
        zip.file(
          "README.md",
          `# Web Project\n\nGenerated with Kelvis AI Assistant.\n\n### How to Run:\nOpen \`index.html\` in any web browser to view your live web application.\n`
        );
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = "web-project.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error creating ZIP download:", err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`flex w-full my-3 px-2 sm:px-4 ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        <div
          className={`flex items-start max-w-[95%] sm:max-w-[88%] md:max-w-[82%] ${
            isUser ? "flex-row-reverse space-x-reverse space-x-2" : "flex-row space-x-3"
          }`}
        >
          {/* Kelvis AI Avatar */}
          {!isUser && (
            <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-sm mt-0.5 border border-slate-700 dark:border-zinc-300">
              <Sparkles className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            </div>
          )}

          {/* Message Body Container */}
          <div className="flex flex-col min-w-0 flex-1">
            <div
              className={`px-4 py-3.5 rounded-2xl relative group transition-all text-sm leading-relaxed ${
                isUser
                  ? "bg-slate-900 text-white dark:bg-zinc-200 dark:text-zinc-900 rounded-tr-xs shadow-sm font-medium"
                  : "bg-slate-100/90 dark:bg-zinc-800/90 text-slate-800 dark:text-zinc-100 rounded-tl-xs border border-slate-300 dark:border-zinc-700/80 shadow-2xs"
              }`}
            >
              {/* Attached files preview if user message */}
              {message.files && message.files.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2 pb-2 border-b border-slate-700/30 dark:border-zinc-700">
                  {message.files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-800/40 dark:bg-zinc-700/50 text-slate-200 dark:text-zinc-200"
                    >
                      {file.mimeType.startsWith("image/") ? (
                        <ImageIcon className="w-3 h-3 text-sky-400" />
                      ) : (
                        <FileText className="w-3 h-3 text-amber-400" />
                      )}
                      <span className="truncate max-w-[120px]">{file.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Generated image */}
              {message.image && (
                <div className="mb-3 overflow-hidden rounded-xl border border-slate-300 dark:border-zinc-700">
                  <img
                    src={message.image}
                    alt="AI Generated Content"
                    className="w-full max-h-80 object-cover rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Step 1 & 2: Collapsible Planning & Architecture Box */}
              {!isUser && planText && <PlanBox planText={planText} />}

              {/* Step 3: Interactive File Box Grid */}
              {!isUser && parsedFiles.length > 0 && (
                <FileBoxGrid
                  files={parsedFiles}
                  onOpenFile={(fileName) => handleOpenLivePreview(fileName)}
                />
              )}

              {/* Step 4: Project Action Bar (Run Preview + Download ZIP) */}
              {!isUser && parsedFiles.length > 0 && (
                <ProjectActionBar
                  files={parsedFiles}
                  onRunPreview={() => handleOpenLivePreview()}
                  onDownloadZip={handleDownloadProjectZip}
                  isZipping={isZipping}
                />
              )}

              {/* Message Markdown Body */}
              <div className="markdown-body space-y-2 select-text">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table({ children }) {
                      return (
                        <div className="my-3 overflow-x-auto rounded-xl border border-slate-300 dark:border-zinc-700 shadow-xs bg-white/60 dark:bg-zinc-900/60">
                          <table className="w-full text-left border-collapse text-xs sm:text-sm">
                            {children}
                          </table>
                        </div>
                      );
                    },
                    thead({ children }) {
                      return (
                        <thead className="bg-slate-200/90 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-bold border-b border-slate-300 dark:border-zinc-700">
                          {children}
                        </thead>
                      );
                    },
                    tbody({ children }) {
                      return <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">{children}</tbody>;
                    },
                    tr({ children }) {
                      return (
                        <tr className="hover:bg-slate-100/80 dark:hover:bg-zinc-800/50 transition-colors">
                          {children}
                        </tr>
                      );
                    },
                    th({ children }) {
                      return (
                        <th className="px-3.5 py-2.5 font-semibold text-slate-900 dark:text-zinc-100 text-[11px] sm:text-xs uppercase tracking-wider">
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return (
                        <td className="px-3.5 py-2 text-slate-700 dark:text-zinc-300 text-xs sm:text-sm">
                          {children}
                        </td>
                      );
                    },
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      const rawLang = match ? match[1] : "code";
                      const codeString = String(children).replace(/\n$/, "");
                      const blockIdx = Math.abs(codeString.length + (rawLang.length * 10));

                      if (!inline && (match || codeString.includes("\n"))) {
                        // Look for matching file from parsedFiles
                        const matchingFile = parsedFiles.find(
                          (f) => f.code.trim() === codeString.trim()
                        );
                        const filename = matchingFile ? matchingFile.name : undefined;
                        const canRun = isRunnableCode(rawLang, codeString);

                        return (
                          <CodeBlockItem
                            lang={rawLang}
                            filename={filename}
                            codeString={codeString}
                            blockIdx={blockIdx}
                            canRun={canRun}
                            copiedBlockIndex={copiedBlockIndex}
                            onCopy={handleCopyText}
                            onPreview={(code, lang, fName) => {
                              handleOpenLivePreview(fName);
                            }}
                          />
                        );
                      }

                      return (
                        <code
                          className="px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-zinc-700/80 font-mono text-[12px] text-slate-900 dark:text-zinc-100 font-semibold"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    p({ children }) {
                      return <p className="leading-relaxed my-1.5">{children}</p>;
                    },
                    blockquote({ children }) {
                      return (
                        <blockquote className="my-3 border-l-3 border-amber-500/90 dark:border-amber-400 pl-3.5 py-2 bg-slate-100/80 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-200 font-medium italic rounded-r-xl shadow-2xs">
                          {children}
                        </blockquote>
                      );
                    },
                    h1({ children }) {
                      return (
                        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-4 mb-2 border-b border-slate-200 dark:border-zinc-800 pb-1">
                          {children}
                        </h1>
                      );
                    },
                    h2({ children }) {
                      return (
                        <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-emerald-400 mt-3.5 mb-1.5 flex items-center space-x-2">
                          <span>{children}</span>
                        </h2>
                      );
                    },
                    h3({ children }) {
                      return (
                        <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-zinc-100 mt-3 mb-1 flex items-center space-x-1.5">
                          <span>{children}</span>
                        </h3>
                      );
                    },
                    ul({ children }) {
                      return <ul className="list-disc list-inside my-2 space-y-1 text-slate-700 dark:text-zinc-300">{children}</ul>;
                    },
                    ol({ children }) {
                      return <ol className="list-decimal list-inside my-2 space-y-1 text-slate-700 dark:text-zinc-300">{children}</ol>;
                    },
                    hr() {
                      return <hr className="my-4 border-slate-300 dark:border-zinc-800" />;
                    },
                    strong({ children }) {
                      return <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>;
                    },
                    mark({ children }) {
                      return <mark className="bg-amber-200 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 px-1 py-0.5 rounded-xs font-semibold">{children}</mark>;
                    },
                  }}
                >
                  {cleanBodyText}
                </ReactMarkdown>
              </div>

              {/* Spotify Player */}
              {message.spotifyTrack && (
                <div className="mt-3 p-3 rounded-2xl bg-zinc-950 border border-emerald-500/40 text-white shadow-lg overflow-hidden select-none">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold">
                        <Music className="w-3.5 h-3.5 fill-current" />
                      </div>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        Spotify Web Music
                      </span>
                    </div>
                    <a
                      href={message.spotifyTrack.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 underline font-semibold"
                    >
                      <span>Open Spotify</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center space-x-3 mb-2.5">
                    {message.spotifyTrack.albumArt && (
                      <img
                        src={message.spotifyTrack.albumArt}
                        alt={message.spotifyTrack.title}
                        className="w-12 h-12 rounded-xl object-cover border border-zinc-800 shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold truncate text-zinc-100">
                        {message.spotifyTrack.title}
                      </div>
                      <div className="text-xs text-zinc-400 truncate">
                        {message.spotifyTrack.artist}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl overflow-hidden bg-black/50 border border-zinc-800">
                    <iframe
                      src={message.spotifyTrack.embedUrl}
                      width="100%"
                      height="152"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="w-full rounded-xl"
                      title={`Spotify Player - ${message.spotifyTrack.title}`}
                    />
                  </div>
                </div>
              )}

              {/* Web Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-zinc-800 text-xs select-none">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </div>
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700 dark:text-cyan-400">
                      Searched Live Web Sources ({message.sources.length})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {message.sources.map((src, i) => {
                      const domainName =
                        src.domain ||
                        (() => {
                          try {
                            return new URL(src.url).hostname.replace(/^www\./, "");
                          } catch (e) {
                            return "web";
                          }
                        })();

                      return (
                        <a
                          key={i}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700/80 hover:border-cyan-500 dark:hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-all shadow-xs group"
                          title={src.snippet || src.title}
                        >
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${domainName}&sz=32`}
                            alt={domainName}
                            className="w-3.5 h-3.5 rounded-xs shrink-0 bg-white/20"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <span className="truncate max-w-[130px] font-mono text-[11px]">
                            {domainName}
                          </span>
                          <ExternalLink className="w-3 h-3 shrink-0 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer details */}
            <div
              className={`flex items-center space-x-2 mt-1 text-[11px] text-slate-400 dark:text-zinc-500 ${
                isUser ? "justify-end" : "justify-start pl-1"
              }`}
            >
              <span>{message.timestamp}</span>

              {/* Copy button */}
              <button
                type="button"
                onClick={() => handleCopyText(message.text)}
                className="hover:text-slate-700 dark:hover:text-zinc-300 p-0.5 rounded transition-colors cursor-pointer"
                title="Copy message"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Text-to-Speech */}
              {!isUser && (
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeaking) {
                      onStopSpeaking();
                    } else {
                      onSpeak(message.text);
                    }
                  }}
                  className={`p-0.5 rounded transition-colors cursor-pointer ${
                    isSpeaking
                      ? "text-emerald-500 animate-pulse"
                      : "hover:text-slate-700 dark:hover:text-zinc-300"
                  }`}
                  title={isSpeaking ? "Stop Speaking" : "Read Aloud"}
                >
                  {isSpeaking ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Multi-File Code Preview Modal */}
      {previewData.isOpen && (
        <CodePreviewModal
          isOpen={previewData.isOpen}
          onClose={() =>
            setPreviewData((prev) => ({ ...prev, isOpen: false }))
          }
          files={previewData.files}
          initialActiveFile={previewData.initialFile}
          projectName="web-project"
        />
      )}
    </>
  );
};
