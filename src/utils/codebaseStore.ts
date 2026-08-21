import JSZip from "jszip";
import { CodebaseFile, CodebaseProject } from "../types";

const STORAGE_KEY = "kelvis_codebase_v1";

// Helper to normalize path (remove leading/trailing slashes, standardize separators)
export function normalizePath(pathStr: string): string {
  return pathStr
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/+/g, "/");
}

// Derive language from file extension
export function detectLanguageFromPath(pathStr: string): string {
  const ext = pathStr.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "html":
    case "htm":
      return "html";
    case "css":
    case "scss":
    case "sass":
    case "less":
      return "css";
    case "js":
    case "mjs":
    case "cjs":
      return "javascript";
    case "ts":
    case "mts":
      return "typescript";
    case "jsx":
      return "jsx";
    case "tsx":
      return "tsx";
    case "json":
      return "json";
    case "py":
      return "python";
    case "sql":
      return "sql";
    case "md":
    case "markdown":
      return "markdown";
    case "sh":
    case "bash":
      return "shell";
    case "svg":
      return "xml";
    default:
      return "text";
  }
}

// Derive clean project name from path or session title
export function sanitizeProjectName(name: string): string {
  if (!name) return "general-project";
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32) || "project";
}

// Load all codebase files from localStorage
export function loadCodebase(): CodebaseFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultStarterCodebase();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn("Failed to load codebase from localStorage:", err);
  }
  return getDefaultStarterCodebase();
}

// Save codebase files to localStorage
export function saveCodebase(files: CodebaseFile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    window.dispatchEvent(new CustomEvent("kelvis_codebase_updated", { detail: { files } }));
  } catch (err) {
    console.warn("Failed to save codebase to localStorage:", err);
  }
}

// Starter sample codebase so new users immediately see a landing page and files
function getDefaultStarterCodebase(): CodebaseFile[] {
  const now = new Date().toISOString();
  return [
    {
      id: "file-landing-index",
      path: "landing-page/public/index.html",
      name: "index.html",
      folder: "landing-page/public",
      project: "landing-page",
      language: "html",
      updatedAt: "Just now",
      createdAt: now,
      lineCount: 45,
      size: 1420,
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modern Business Landing</title>
  <link rel="stylesheet" href="../styles/main.css">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-black text-white font-sans antialiased min-h-screen flex flex-col justify-between">
  <!-- Header Navigation -->
  <header class="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
    <div class="flex items-center space-x-3">
      <div class="w-8 h-8 rounded-lg bg-white text-black font-black flex items-center justify-center text-sm">K</div>
      <span class="font-bold text-lg tracking-tight">Apex Enterprises</span>
    </div>
    <nav class="hidden md:flex items-center space-x-6 text-sm font-semibold text-white/70">
      <a href="#features" class="hover:text-white transition-colors">Features</a>
      <a href="#solutions" class="hover:text-white transition-colors">Solutions</a>
      <a href="#pricing" class="hover:text-white transition-colors">Pricing</a>
    </nav>
    <button class="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:opacity-90 transition-opacity">Get Started</button>
  </header>

  <!-- Hero Section -->
  <main class="max-w-4xl mx-auto px-6 py-20 text-center flex-1 flex flex-col items-center justify-center">
    <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-white/20 bg-white/5 text-xs font-bold mb-6">
      <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
      <span>Next-Generation Architecture</span>
    </div>
    <h1 class="text-4xl sm:text-6xl font-black tracking-tight leading-tight mb-6">
      Transforming Digital Commerce with Speed and Precision.
    </h1>
    <p class="text-base sm:text-lg text-white/70 max-w-2xl mx-auto mb-8 font-medium">
      Deploy high-converting landing pages, interactive product platforms, and robust enterprise workflows instantly.
    </p>
    <div class="flex flex-wrap gap-4 justify-center">
      <button id="cta-btn" class="px-6 py-3 rounded-xl bg-white text-black font-bold text-sm hover:opacity-90 shadow-lg transition-transform active:scale-95">
        Explore Products
      </button>
      <button class="px-6 py-3 rounded-xl border border-white/30 hover:bg-white/10 text-white font-bold text-sm transition-colors">
        Read Whitepaper
      </button>
    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-white/10 py-6 text-center text-xs text-white/50">
    <p>&copy; 2026 Apex Enterprises. All rights reserved. Built with Kelvis AI.</p>
  </footer>

  <script src="../src/app.js"></script>
</body>
</html>`,
    },
    {
      id: "file-landing-css",
      path: "landing-page/styles/main.css",
      name: "main.css",
      folder: "landing-page/styles",
      project: "landing-page",
      language: "css",
      updatedAt: "Just now",
      createdAt: now,
      lineCount: 30,
      size: 680,
      code: `/* Modern High-Contrast Monochrome Aesthetics */
@layer base {
  body {
    background-color: #000000;
    color: #ffffff;
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  }
}

.hero-glow {
  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 60%);
}

button {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}`,
    },
    {
      id: "file-landing-js",
      path: "landing-page/src/app.js",
      name: "app.js",
      folder: "landing-page/src",
      project: "landing-page",
      language: "javascript",
      updatedAt: "Just now",
      createdAt: now,
      lineCount: 22,
      size: 520,
      code: `// Landing Page Interactive State Engine
document.addEventListener("DOMContentLoaded", () => {
  const ctaBtn = document.getElementById("cta-btn");
  if (ctaBtn) {
    ctaBtn.addEventListener("click", () => {
      alert("Welcome to Apex! Connecting to live storefront...");
    });
  }
  console.log("Apex Landing Page Engine Loaded Successfully");
});`,
    },
  ];
}

// Upsert a single file in codebase
export function upsertCodebaseFile(
  pathStr: string,
  code: string,
  extra?: {
    chatSessionId?: string;
    chatTitle?: string;
    projectOverride?: string;
  }
): CodebaseFile {
  const files = loadCodebase();
  const normalized = normalizePath(pathStr);
  const parts = normalized.split("/");
  const fileName = parts.pop() || "file.txt";

  let project = extra?.projectOverride;
  if (!project) {
    if (parts.length > 0) {
      project = parts[0];
    } else if (extra?.chatTitle) {
      project = sanitizeProjectName(extra.chatTitle);
    } else {
      project = "workspace";
    }
  }

  const folder = parts.length > 0 ? parts.join("/") : project;
  const fullPath = parts.length > 0 ? `${folder}/${fileName}` : `${project}/${fileName}`;
  const language = detectLanguageFromPath(fileName);
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const lineCount = code.split("\n").length;
  const size = new Blob([code]).size;

  const existingIdx = files.findIndex((f) => normalizePath(f.path) === normalizePath(fullPath));

  let savedFile: CodebaseFile;
  if (existingIdx >= 0) {
    savedFile = {
      ...files[existingIdx],
      path: fullPath,
      name: fileName,
      folder,
      project,
      code,
      language,
      updatedAt: now,
      chatSessionId: extra?.chatSessionId || files[existingIdx].chatSessionId,
      chatTitle: extra?.chatTitle || files[existingIdx].chatTitle,
      lineCount,
      size,
    };
    files[existingIdx] = savedFile;
  } else {
    savedFile = {
      id: `cb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      path: fullPath,
      name: fileName,
      folder,
      project,
      code,
      language,
      updatedAt: now,
      createdAt: new Date().toISOString(),
      chatSessionId: extra?.chatSessionId,
      chatTitle: extra?.chatTitle,
      lineCount,
      size,
    };
    files.push(savedFile);
  }

  saveCodebase(files);
  return savedFile;
}

// Extract and sync all files from an AI message directly into the central codebase
export function syncFilesFromAiResponse(
  messageText: string,
  chatSessionId?: string,
  chatTitle?: string
): CodebaseFile[] {
  if (!messageText) return [];
  const saved: CodebaseFile[] = [];

  // 1. Check for activefile banner tags: <activefile filename="public/index.html" ... />
  const activeFileRegex = /<activefile\s+(?:name|filename)="([^"]+)"/gi;
  let afMatch;
  const activeFilePaths: string[] = [];
  while ((afMatch = activeFileRegex.exec(messageText)) !== null) {
    activeFilePaths.push(afMatch[1]);
  }

  // 2. Parse all code fences: ```html public/index.html\n ... ```
  const codeBlockRegex = /```(\w+)?(?:\s+([\w\.\-\/]+))?\n([\s\S]*?)```/g;
  let match;
  let codeBlockIndex = 0;

  const defaultProject = sanitizeProjectName(chatTitle || "project");

  while ((match = codeBlockRegex.exec(messageText)) !== null) {
    const lang = (match[1] || "").toLowerCase();
    let rawFilePath = match[2];
    const code = match[3].trim();

    // Skip charts, quizzes, json thoughts, or empty code
    if (lang === "quiz" || lang === "chart" || lang === "binance" || !code) {
      continue;
    }

    // Try finding path from comment on line 1 if header didn't specify filename
    if (!rawFilePath) {
      const firstLine = /^(?:<!--|\/\/|\/\*|#)\s*([\w\.\-\/]+\.(?:html|css|js|ts|jsx|tsx|json|py|sql|sh|env))\s*(?:-->|\*\/)?/i.exec(code);
      if (firstLine) {
        rawFilePath = firstLine[1];
      } else if (activeFilePaths[codeBlockIndex]) {
        rawFilePath = activeFilePaths[codeBlockIndex];
      } else {
        // Infer standard file names
        if (lang === "html" || code.includes("<html") || code.includes("<!DOCTYPE")) {
          rawFilePath = "index.html";
        } else if (lang === "css") {
          rawFilePath = "styles/main.css";
        } else if (lang === "javascript" || lang === "js") {
          rawFilePath = "src/app.js";
        } else if (lang === "typescript" || lang === "ts") {
          rawFilePath = "src/index.ts";
        } else if (lang === "python" || lang === "py") {
          rawFilePath = "main.py";
        } else if (lang === "sql") {
          rawFilePath = "schema.sql";
        } else {
          rawFilePath = `file_${codeBlockIndex + 1}.${lang || "txt"}`;
        }
      }
    }

    codeBlockIndex++;

    // Prefix with project folder if path is flat or relative without project folder
    let targetPath = normalizePath(rawFilePath);
    if (!targetPath.includes("/") || targetPath.startsWith("public/") || targetPath.startsWith("src/") || targetPath.startsWith("styles/")) {
      targetPath = `${defaultProject}/${targetPath}`;
    }

    const file = upsertCodebaseFile(targetPath, code, {
      chatSessionId,
      chatTitle,
      projectOverride: defaultProject,
    });
    saved.push(file);
  }

  return saved;
}

// Delete file from codebase
export function deleteCodebaseFile(filePath: string): void {
  const files = loadCodebase();
  const normalized = normalizePath(filePath);
  const updated = files.filter((f) => normalizePath(f.path) !== normalized);
  saveCodebase(updated);
}

// Delete entire folder or project from codebase
export function deleteCodebaseFolder(folderOrProjectPrefix: string): void {
  const files = loadCodebase();
  const prefix = normalizePath(folderOrProjectPrefix);
  const updated = files.filter(
    (f) => !normalizePath(f.path).startsWith(prefix + "/") && normalizePath(f.path) !== prefix && f.project !== prefix
  );
  saveCodebase(updated);
}

// Download a single file
export function downloadFileDirect(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download a folder / project as a ZIP file using JSZip
export async function downloadFolderAsZip(
  folderPathOrProject: string,
  filesList?: CodebaseFile[]
): Promise<void> {
  const zip = new JSZip();
  const files = filesList || loadCodebase();
  const targetPrefix = normalizePath(folderPathOrProject);

  const matched = files.filter(
    (f) =>
      normalizePath(f.path).startsWith(targetPrefix + "/") ||
      normalizePath(f.path) === targetPrefix ||
      f.project === targetPrefix
  );

  if (matched.length === 0) {
    alert("No files found in folder to download.");
    return;
  }

  for (const file of matched) {
    // Strip leading project folder for cleaner zip root if downloading single project
    let relativeInZip = normalizePath(file.path);
    if (relativeInZip.startsWith(targetPrefix + "/")) {
      relativeInZip = relativeInZip.slice(targetPrefix.length + 1);
    }
    zip.file(relativeInZip, file.code);
  }

  const zipName = `${targetPrefix.replace(/\//g, "-")}-export.zip`;
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download entire workspace codebase as a ZIP
export async function downloadAllCodebaseAsZip(): Promise<void> {
  const zip = new JSZip();
  const files = loadCodebase();

  if (files.length === 0) {
    alert("Codebase is empty.");
    return;
  }

  for (const file of files) {
    zip.file(normalizePath(file.path), file.code);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kelvis-codebase-workspace-${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Build compact summary for AI prompt context so the model knows all existing files across all chats
export function getCodebaseContextForPrompt(): string {
  const files = loadCodebase();
  if (files.length === 0) return "";

  let context = "\n\n=== 📁 WORKSPACE CODEBASE (All Projects & Files Across Chats) ===\n";
  context += "The following projects and files are already stored in the user's workspace:\n";

  for (const file of files.slice(0, 15)) {
    context += `\n[File: ${file.path}] (${file.lineCount || file.code.split("\n").length} lines, ${file.language}):\n`;
    context += `\`\`\`${file.language} ${file.path}\n${file.code.slice(0, 8000)}\n\`\`\`\n`;
  }

  context += `\nCRITICAL DIRECTIVE FOR EDITING EXISTING FILES:
- If the user asks to edit, modify, update, tweak, or extend any existing file or project above (e.g. "edit the landing page to change hero button", "update index.html", "modify main.css", etc.):
  1. Pull and reference the existing code from the Codebase above.
  2. ONLY emit and edit the specific files that need changes (e.g. \`\`\`html landing-page/public/index.html ... \`\`\`).
  3. Do NOT recreate unmodified files unless explicitly asked. Keep unchanged files intact.
- If the user asks to create a NEW project, structure it neatly into its own project folder (e.g. \`\`\`html new-project/index.html ... \`\`\`).`;

  return context;
}
