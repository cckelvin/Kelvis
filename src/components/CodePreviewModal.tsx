import React from "react";
import { X, Play, Code, ExternalLink, RefreshCw } from "lucide-react";

interface CodePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
}

export const CodePreviewModal: React.FC<CodePreviewModalProps> = ({
  isOpen,
  onClose,
  code,
  language,
}) => {
  if (!isOpen) return null;

  // Prepare full HTML document for sandbox preview
  const getCombinedCode = () => {
    const lang = language.toLowerCase();
    if (lang === "html" || code.includes("<html") || code.includes("<div") || code.includes("<body")) {
      return code;
    }
    if (lang === "css" || lang === "style") {
      return `<!DOCTYPE html><html><head><style>${code}</style></head><body style="font-family:sans-serif;padding:20px;"><h2>CSS Live Preview</h2><div class="preview-box">Preview Container</div></body></html>`;
    }
    if (lang === "javascript" || lang === "js" || lang === "ts") {
      return `<!DOCTYPE html><html><head><style>body{font-family:sans-serif;padding:20px;background:#0f172a;color:#f8fafc;}#console{background:#1e293b;padding:12px;border-radius:8px;font-family:monospace;margin-top:10px;white-space:pre-wrap;}</style></head><body><h3>JavaScript Console Output</h3><div id="console"></div><script>
        const log = console.log;
        const consoleDiv = document.getElementById('console');
        console.log = function(...args) {
          log(...args);
          consoleDiv.innerText += args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ') + '\\n';
        };
        try {
          ${code}
        } catch(err) {
          consoleDiv.innerText += 'Error: ' + err.message;
        }
      </script></body></html>`;
    }
    return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:20px;"><pre>${code.replace(/</g, '&lt;')}</pre></body></html>`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-6 select-none">
      <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-zinc-100 font-bold text-sm sm:text-base">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <span>Live Code Runner ({language.toUpperCase()})</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const iframe = document.getElementById("code-preview-iframe") as HTMLIFrameElement;
                if (iframe) iframe.srcdoc = getCombinedCode();
              }}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
              title="Reload Preview"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sandbox IFrame Preview */}
        <div className="flex-1 bg-white dark:bg-zinc-950 w-full relative">
          <iframe
            id="code-preview-iframe"
            title="Code Runner Preview"
            srcDoc={getCombinedCode()}
            sandbox="allow-scripts allow-modals"
            className="w-full h-full border-none"
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center text-xs text-slate-500 dark:text-zinc-400">
          <span className="flex items-center space-x-1">
            <Code className="w-3.5 h-3.5 text-emerald-500" />
            <span>Executed inside isolated iframe sandbox</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs hover:opacity-90 transition-opacity"
          >
            Close Runner
          </button>
        </div>
      </div>
    </div>
  );
};
