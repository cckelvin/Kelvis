import React, { useState, useEffect } from "react";
import {
  X,
  Play,
  Code,
  Download,
  RefreshCw,
  Maximize2,
  FileCode,
  Copy,
  Check,
  Eye,
  FileArchive,
  Layers,
  Sparkles,
} from "lucide-react";
import JSZip from "jszip";

export interface ProjectFile {
  name: string;
  code: string;
  language: string;
}

interface CodePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  files?: ProjectFile[];
  initialActiveFile?: string;
  code?: string;
  language?: string;
  projectName?: string;
}

export const CodePreviewModal: React.FC<CodePreviewModalProps> = ({
  isOpen,
  onClose,
  files = [],
  initialActiveFile,
  code = "",
  language = "html",
  projectName = "web-project",
}) => {
  // Normalize files list: if single code/language passed, wrap into array
  const allFiles: ProjectFile[] =
    files.length > 0
      ? files
      : [
          {
            name: language === "html" ? "index.html" : language === "css" ? "style.css" : language === "javascript" || language === "js" ? "app.js" : `main.${language || "txt"}`,
            code: code,
            language: language || "html",
          },
        ];

  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [selectedFileName, setSelectedFileName] = useState<string>(
    initialActiveFile || (allFiles[0] ? allFiles[0].name : "index.html")
  );
  const [copiedFile, setCopiedFile] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [renderKey, setRenderKey] = useState<number>(0);

  useEffect(() => {
    if (initialActiveFile) {
      setSelectedFileName(initialActiveFile);
    } else if (allFiles.length > 0 && !allFiles.some((f) => f.name === selectedFileName)) {
      setSelectedFileName(allFiles[0].name);
    }
  }, [initialActiveFile, allFiles, selectedFileName]);

  if (!isOpen || allFiles.length === 0) return null;

  const currentFile =
    allFiles.find((f) => f.name === selectedFileName) || allFiles[0];

  // Helper to compile all files into a single runnable HTML document for the sandbox iframe
  const getCompiledBundleHtml = (): string => {
    const htmlFile = allFiles.find(
      (f) =>
        f.language.toLowerCase() === "html" ||
        f.name.toLowerCase().endsWith(".html") ||
        f.code.includes("<html") ||
        f.code.includes("<!DOCTYPE")
    );

    const cssFiles = allFiles.filter(
      (f) =>
        f.language.toLowerCase() === "css" ||
        f.name.toLowerCase().endsWith(".css")
    );

    const jsFiles = allFiles.filter(
      (f) =>
        f.language.toLowerCase() === "javascript" ||
        f.language.toLowerCase() === "js" ||
        f.name.toLowerCase().endsWith(".js")
    );

    const combinedCss = cssFiles.map((f) => f.code).join("\n\n");
    const combinedJs = jsFiles.map((f) => f.code).join("\n\n");

    if (htmlFile) {
      let html = htmlFile.code;

      // Inject Tailwind CSS CDN if not present and Tailwind classes detected
      const needsTailwind = html.includes("class=") || combinedCss.includes("@apply");
      const tailwindTag = needsTailwind && !html.includes("tailwindcss.com")
        ? '<script src="https://cdn.tailwindcss.com"></script>\n<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>'
        : "";

      // Inject compiled CSS
      if (combinedCss) {
        const styleTag = `<style>\n/* Combined Project Styles */\n${combinedCss}\n</style>`;
        if (html.includes("</head>")) {
          html = html.replace("</head>", `${tailwindTag}\n${styleTag}\n</head>`);
        } else if (html.includes("<head>")) {
          html = html.replace("<head>", `<head>\n${tailwindTag}\n${styleTag}`);
        } else {
          html = `${tailwindTag}\n${styleTag}\n${html}`;
        }
      } else if (tailwindTag) {
        if (html.includes("</head>")) {
          html = html.replace("</head>", `${tailwindTag}\n</head>`);
        } else {
          html = `${tailwindTag}\n${html}`;
        }
      }

      // Inject compiled JS
      if (combinedJs) {
        const scriptTag = `<script>\n// Combined Project JavaScript\ntry {\n${combinedJs}\n} catch(err) { console.error("Script execution error:", err); }\n</script>`;
        if (html.includes("</body>")) {
          html = html.replace("</body>", `${scriptTag}\n</body>`);
        } else {
          html = `${html}\n${scriptTag}`;
        }
      }

      return html;
    }

    // If only CSS is provided
    if (combinedCss && !combinedJs) {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS Preview</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; }
    ${combinedCss}
  </style>
</head>
<body>
  <h2>CSS Preview Environment</h2>
  <p>Your styles have been injected successfully.</p>
</body>
</html>`;
    }

    // If only JS is provided
    if (combinedJs && !combinedCss) {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>JavaScript Runner</title>
  <style>
    body { font-family: monospace; padding: 20px; background: #09090b; color: #10b981; }
    #console { background: #18181b; border: 1px solid #27272a; padding: 16px; border-radius: 12px; font-size: 13px; line-height: 1.6; white-space: pre-wrap; color: #f4f4f5; max-height: 80vh; overflow: auto; }
    .header { font-family: system-ui, sans-serif; font-size: 14px; font-weight: bold; margin-bottom: 12px; color: #a1a1aa; }
  </style>
</head>
<body>
  <div class="header">⚡ JavaScript Output Console</div>
  <div id="console"></div>
  <script>
    const consoleDiv = document.getElementById('console');
    const originalLog = console.log;
    const originalError = console.error;
    function print(msg, color='#f4f4f5') {
      const span = document.createElement('div');
      span.style.color = color;
      span.textContent = msg;
      consoleDiv.appendChild(span);
    }
    console.log = function(...args) {
      originalLog(...args);
      print(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
    };
    console.error = function(...args) {
      originalError(...args);
      print('❌ ' + args.join(' '), '#ef4444');
    };
    try {
      ${combinedJs}
    } catch(err) {
      console.error(err.stack || err.message);
    }
  </script>
</body>
</html>`;
    }

    // Default fallback
    return `<!DOCTYPE html><html><body style="font-family:monospace;padding:24px;background:#09090b;color:#e4e4e7;"><pre>${currentFile.code.replace(/</g, "&lt;")}</pre></body></html>`;
  };

  const handleCopyCurrentCode = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const handleDownloadSingleFile = () => {
    const blob = new Blob([currentFile.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = currentFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      allFiles.forEach((file) => {
        zip.file(file.name, file.code);
      });

      // Add a simple README.md if not present
      if (!allFiles.some((f) => f.name.toLowerCase() === "readme.md")) {
        zip.file(
          "README.md",
          `# ${projectName}\n\nGenerated by Kelvis AI Assistant.\n\n### How to Run:\nOpen \`index.html\` in any modern web browser or run with a local web server (e.g. \`npx serve\`).\n`
        );
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, "-") || "project"}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error creating ZIP archive:", err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleOpenInNewWindow = () => {
    const bundleHtml = getCompiledBundleHtml();
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.open();
      newWindow.document.write(bundleHtml);
      newWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 select-none">
      <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-all">
        
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950 gap-2">
          {/* Title and View Tabs */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Play className="w-4 h-4 fill-current" />
            </div>

            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-zinc-100 flex items-center space-x-2">
                <span>Live Project Sandbox</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold uppercase tracking-wider">
                  {allFiles.length} {allFiles.length === 1 ? "file" : "files"}
                </span>
              </h3>
            </div>

            {/* Mode Switcher Buttons */}
            <div className="flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700/80 text-xs font-semibold ml-2">
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeTab === "preview"
                    ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={`px-3 py-1 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeTab === "code"
                    ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Code Viewer</span>
              </button>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {activeTab === "preview" && (
              <button
                type="button"
                onClick={() => setRenderKey((k) => k + 1)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors flex items-center space-x-1 cursor-pointer"
                title="Reload Preview"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenInNewWindow}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors flex items-center space-x-1 cursor-pointer"
              title="Open full sandbox preview in new tab"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Full Tab</span>
            </button>

            {/* ZIP Download */}
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              title="Download entire project as ZIP"
            >
              <FileArchive className="w-3.5 h-3.5" />
              <span>{isZipping ? "Zipping..." : "Download ZIP"}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Secondary Subheader for File Switcher Tabs when multiple files or code mode */}
        {allFiles.length > 1 && (
          <div className="flex items-center space-x-1 px-4 py-2 bg-slate-200/60 dark:bg-zinc-950/80 border-b border-slate-200 dark:border-zinc-800 overflow-x-auto text-xs">
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mr-2 flex items-center space-x-1 shrink-0">
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              <span>Project Files:</span>
            </span>
            {allFiles.map((file) => (
              <button
                key={file.name}
                type="button"
                onClick={() => {
                  setSelectedFileName(file.name);
                  if (activeTab === "preview" && allFiles.length > 1) {
                    // Stay or view code
                  }
                }}
                className={`px-3 py-1 rounded-lg font-mono text-[11px] font-semibold flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer ${
                  selectedFileName === file.name
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white/80 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-300 dark:border-zinc-700"
                }`}
              >
                <FileCode className="w-3 h-3 text-emerald-300" />
                <span>{file.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Main Content Body */}
        <div className="flex-1 bg-white dark:bg-zinc-950 w-full relative overflow-hidden flex flex-col">
          {activeTab === "preview" ? (
            /* Live Interactive Sandbox */
            <div className="w-full h-full relative bg-white dark:bg-zinc-950">
              <iframe
                key={renderKey}
                id="code-preview-iframe"
                title="Code Sandbox Live Runner"
                srcDoc={getCompiledBundleHtml()}
                sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                className="w-full h-full border-none"
              />
            </div>
          ) : (
            /* Code Inspector View */
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 text-slate-100 font-mono text-xs">
              {/* File details bar */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-200">{currentFile.name}</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 uppercase">
                    {currentFile.language}
                  </span>
                  <span>{currentFile.code.split("\n").length} lines</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCopyCurrentCode}
                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedFile ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadSingleFile}
                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save {currentFile.name}</span>
                  </button>
                </div>
              </div>

              {/* Code Pre container */}
              <div className="flex-1 overflow-auto p-4 leading-relaxed bg-slate-950 text-slate-200 select-text">
                <pre className="font-mono text-xs">
                  <code>{currentFile.code}</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 bg-slate-100 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex flex-wrap justify-between items-center text-xs text-slate-500 dark:text-zinc-400 gap-2">
          <span className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Interactive multi-file web execution sandbox • HTML5, CSS3, JavaScript, Tailwind</span>
          </span>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
