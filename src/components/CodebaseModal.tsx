import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Copy,
  Check,
  Download,
  Trash2,
  Plus,
  Search,
  Layers,
  Sparkles,
  ExternalLink,
  Save,
  Code,
  FolderGit2,
  FileArchive,
  RefreshCw,
} from "lucide-react";
import { CodebaseFile } from "../types";
import {
  loadCodebase,
  saveCodebase,
  upsertCodebaseFile,
  deleteCodebaseFile,
  deleteCodebaseFolder,
  downloadFileDirect,
  downloadFolderAsZip,
  downloadAllCodebaseAsZip,
  normalizePath,
} from "../utils/codebaseStore";

interface CodebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPreview?: (files: { name: string; code: string; language: string }[], initialFile?: string) => void;
}

export const CodebaseModal: React.FC<CodebaseModalProps> = ({
  isOpen,
  onClose,
  onOpenPreview,
}) => {
  const [files, setFiles] = useState<CodebaseFile[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedPath, setCopiedPath] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedCode, setEditedCode] = useState<string>("");
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // New File/Folder state
  const [showNewFileDialog, setShowNewFileDialog] = useState<boolean>(false);
  const [newFilePath, setNewFilePath] = useState<string>("");
  const [newFileContent, setNewFileContent] = useState<string>("");

  // Refresh files list
  const refreshFiles = () => {
    const loaded = loadCodebase();
    setFiles(loaded);
    if (!selectedFilePath && loaded.length > 0) {
      setSelectedFilePath(loaded[0].path);
      setEditedCode(loaded[0].code);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshFiles();
    }
  }, [isOpen]);

  // Listen for codebase updates from chat
  useEffect(() => {
    const handleUpdate = () => {
      refreshFiles();
    };
    window.addEventListener("kelvis_codebase_updated", handleUpdate);
    return () => window.removeEventListener("kelvis_codebase_updated", handleUpdate);
  }, []);

  const selectedFile = useMemo(() => {
    return files.find((f) => normalizePath(f.path) === normalizePath(selectedFilePath)) || files[0] || null;
  }, [files, selectedFilePath]);

  useEffect(() => {
    if (selectedFile) {
      setEditedCode(selectedFile.code);
      setIsEditing(false);
    }
  }, [selectedFile]);

  // Group files by Folder / Project Hierarchy
  const folderTree = useMemo(() => {
    const tree: Record<string, CodebaseFile[]> = {};

    const filtered = files.filter((f) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        f.path.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q) ||
        f.project.toLowerCase().includes(q) ||
        f.code.toLowerCase().includes(q)
      );
    });

    for (const file of filtered) {
      const folderKey = file.folder || file.project || "root";
      if (!tree[folderKey]) {
        tree[folderKey] = [];
      }
      tree[folderKey].push(file);
    }

    return tree;
  }, [files, searchQuery]);

  // Automatically expand all folders on initial search/load
  useEffect(() => {
    const exp: Record<string, boolean> = {};
    for (const folder of Object.keys(folderTree)) {
      exp[folder] = true;
    }
    setExpandedFolders(exp);
  }, [folderTree]);

  if (!isOpen) return null;

  const toggleFolder = (folderName: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  };

  const handleSelectFile = (file: CodebaseFile) => {
    setSelectedFilePath(file.path);
    setEditedCode(file.code);
    setIsEditing(false);
  };

  const handleCopyCode = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(editedCode || selectedFile.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyPath = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.path);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const handleDownloadCurrentFile = () => {
    if (!selectedFile) return;
    downloadFileDirect(selectedFile.name, editedCode || selectedFile.code);
  };

  const handleDownloadFolderZip = async (folderName: string) => {
    await downloadFolderAsZip(folderName, files);
  };

  const handleDownloadAllZip = async () => {
    await downloadAllCodebaseAsZip();
  };

  const handleDeleteFile = (file: CodebaseFile) => {
    if (window.confirm(`Are you sure you want to delete "${file.path}"?`)) {
      deleteCodebaseFile(file.path);
      const remaining = files.filter((f) => f.path !== file.path);
      setFiles(remaining);
      if (remaining.length > 0) {
        setSelectedFilePath(remaining[0].path);
      } else {
        setSelectedFilePath("");
      }
    }
  };

  const handleDeleteFolder = (folderName: string) => {
    if (window.confirm(`Are you sure you want to delete all files in folder "${folderName}"?`)) {
      deleteCodebaseFolder(folderName);
      const remaining = files.filter((f) => !f.path.startsWith(folderName + "/") && f.folder !== folderName);
      setFiles(remaining);
      if (remaining.length > 0) {
        setSelectedFilePath(remaining[0].path);
      } else {
        setSelectedFilePath("");
      }
    }
  };

  const handleSaveFileEdits = () => {
    if (!selectedFile) return;
    const updated = upsertCodebaseFile(selectedFile.path, editedCode, {
      chatSessionId: selectedFile.chatSessionId,
      chatTitle: selectedFile.chatTitle,
      projectOverride: selectedFile.project,
    });
    refreshFiles();
    setIsEditing(false);
  };

  const handleCreateNewFile = () => {
    if (!newFilePath.trim()) return;
    const created = upsertCodebaseFile(newFilePath.trim(), newFileContent || "// New file", {
      chatTitle: "Manual Create",
    });
    refreshFiles();
    setSelectedFilePath(created.path);
    setShowNewFileDialog(false);
    setNewFilePath("");
    setNewFileContent("");
  };

  const handleLaunchPreview = () => {
    if (!selectedFile || !onOpenPreview) return;
    // Get all files belonging to the same project/folder
    const projectFiles = files
      .filter((f) => f.project === selectedFile.project || f.folder.startsWith(selectedFile.project))
      .map((f) => ({
        name: f.name,
        code: f.code,
        language: f.language,
      }));

    if (projectFiles.length === 0) {
      projectFiles.push({
        name: selectedFile.name,
        code: selectedFile.code,
        language: selectedFile.language,
      });
    }

    onOpenPreview(projectFiles, selectedFile.name);
  };

  const totalLines = files.reduce((acc, f) => acc + (f.lineCount || f.code.split("\n").length), 0);
  const totalProjects = Array.from(new Set(files.map((f) => f.project || "general"))).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-6xl h-[92vh] bg-white dark:bg-black border border-black/30 dark:border-white/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-black dark:text-white font-sans">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-black/15 dark:border-white/15 flex items-center justify-between bg-white dark:bg-black shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-black">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">Codebase & Project Files</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-black text-white dark:bg-white dark:text-black">
                  {files.length} {files.length === 1 ? "File" : "Files"}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/10 dark:bg-white/15">
                  {totalProjects} {totalProjects === 1 ? "Project" : "Projects"} • {totalLines} Lines
                </span>
              </div>
              <p className="text-xs text-black/60 dark:text-white/60 font-semibold mt-0.5">
                Centralized multi-file repository shared across all conversations with surgical editing
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadAllZip}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-black/25 dark:border-white/25 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-black transition-colors cursor-pointer"
              title="Download entire codebase as a single ZIP archive"
            >
              <FileArchive className="w-4 h-4" />
              <span>Export ZIP</span>
            </button>
            <button
              onClick={() => setShowNewFileDialog(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-black hover:opacity-85 transition-opacity cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New File</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/15 text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white transition-colors cursor-pointer"
              title="Close Codebase"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global AI Sync Info Banner */}
        <div className="px-6 py-2 bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 flex items-center justify-between text-xs font-bold text-black/70 dark:text-white/70">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-black dark:text-white" />
            <span>AI Cross-Chat Intelligence: When you code in any chat, files auto-sync here. In other chats, asking to edit pulls the exact code.</span>
          </div>
          <span className="font-mono text-[10px] font-black uppercase">Live Persistent Store</span>
        </div>

        {/* Main Body: Split View (Left File Tree, Right Code Preview) */}
        <div className="flex-1 flex min-h-0 divide-x divide-black/15 dark:divide-white/15">
          
          {/* LEFT SIDEBAR: File Tree */}
          <div className="w-72 sm:w-80 shrink-0 flex flex-col bg-white dark:bg-black">
            {/* Search Input */}
            <div className="p-3 border-b border-black/15 dark:border-white/15">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" />
                <input
                  type="text"
                  placeholder="Search files or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs font-bold bg-black/5 dark:bg-white/10 border border-black/15 dark:border-white/15 text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Folder / Files Tree List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {Object.keys(folderTree).length === 0 ? (
                <div className="text-center py-12 px-4 text-black/40 dark:text-white/40 text-xs font-bold">
                  No files found. Create one or prompt Kelvis to build a project!
                </div>
              ) : (
                Object.entries(folderTree).map(([folderName, folderFiles]) => {
                  const isExpanded = expandedFolders[folderName] !== false;
                  return (
                    <div key={folderName} className="space-y-1">
                      {/* Folder Header */}
                      <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-xs font-black text-black dark:text-white">
                        <button
                          type="button"
                          onClick={() => toggleFolder(folderName)}
                          className="flex items-center space-x-2 flex-1 min-w-0 text-left cursor-pointer"
                        >
                          {isExpanded ? (
                            <FolderOpen className="w-4 h-4 text-black dark:text-white shrink-0" />
                          ) : (
                            <Folder className="w-4 h-4 text-black/70 dark:text-white/70 shrink-0" />
                          )}
                          <span className="truncate">{folderName}</span>
                          <span className="text-[10px] font-mono text-black/50 dark:text-white/50 px-1 py-0.2 rounded bg-black/10 dark:bg-white/15">
                            {folderFiles.length}
                          </span>
                        </button>

                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleDownloadFolderZip(folderName)}
                            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/20 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                            title={`Download folder "${folderName}" as ZIP`}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFolder(folderName)}
                            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/20 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                            title={`Delete folder "${folderName}"`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Files Inside Folder */}
                      {isExpanded && (
                        <div className="pl-3 space-y-0.5 border-l border-black/15 dark:border-white/15 ml-2 mt-1">
                          {folderFiles.map((file) => {
                            const isSelected = selectedFile?.path === file.path;
                            return (
                              <div
                                key={file.path}
                                onClick={() => handleSelectFile(file)}
                                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                                  isSelected
                                    ? "bg-black text-white dark:bg-white dark:text-black shadow-xs font-black"
                                    : "hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white"
                                }`}
                              >
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                  <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-white dark:text-black" : "text-black/60 dark:text-white/60"}`} />
                                  <span className="truncate">{file.name}</span>
                                </div>
                                <span className={`text-[10px] font-mono ${isSelected ? "text-white/80 dark:text-black/80" : "text-black/40 dark:text-white/40"}`}>
                                  {file.lineCount || file.code.split("\n").length}L
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT MAIN PANEL: File Viewer & Code Editor */}
          <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-black">
            {selectedFile ? (
              <>
                {/* File Action Toolbar */}
                <div className="px-6 py-3 border-b border-black/15 dark:border-white/15 flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-black">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="font-mono text-xs font-black text-black dark:text-white truncate">
                      {selectedFile.path}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-black/10 dark:bg-white/15">
                      {selectedFile.language}
                    </span>
                    <span className="text-[11px] font-semibold text-black/50 dark:text-white/50 hidden sm:inline">
                      • {selectedFile.lineCount || editedCode.split("\n").length} lines
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 flex-wrap">
                    {/* Copy Path */}
                    <button
                      type="button"
                      onClick={handleCopyPath}
                      className="px-2.5 py-1 rounded-lg border border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                      title="Copy file path"
                    >
                      {copiedPath ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPath ? "Path Copied" : "Path"}</span>
                    </button>

                    {/* Copy Code */}
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 rounded-lg border border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                      title="Copy full code to clipboard"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                    </button>

                    {/* Download File */}
                    <button
                      type="button"
                      onClick={handleDownloadCurrentFile}
                      className="px-2.5 py-1 rounded-lg border border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>

                    {/* Live Preview Button if web file */}
                    {(selectedFile.language === "html" || selectedFile.path.endsWith(".html") || selectedFile.name.endsWith(".html")) && onOpenPreview && (
                      <button
                        type="button"
                        onClick={handleLaunchPreview}
                        className="px-3 py-1 rounded-lg bg-black text-white dark:bg-white dark:text-black font-black text-xs flex items-center space-x-1 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Preview App</span>
                      </button>
                    )}

                    {/* Save or Edit toggle */}
                    {isEditing ? (
                      <button
                        type="button"
                        onClick={handleSaveFileEdits}
                        className="px-3 py-1 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-black flex items-center space-x-1 hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save File</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="px-2.5 py-1 rounded-lg border border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                    )}

                    {/* Delete File */}
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(selectedFile)}
                      className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/15 text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white transition-colors cursor-pointer"
                      title="Delete file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Code Viewer / Editor */}
                <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed bg-white dark:bg-black">
                  {isEditing ? (
                    <textarea
                      value={editedCode}
                      onChange={(e) => setEditedCode(e.target.value)}
                      className="w-full h-full p-3 font-mono text-xs bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 rounded-xl focus:outline-hidden text-black dark:text-white resize-none"
                    />
                  ) : (
                    <div className="flex">
                      {/* Line Numbers */}
                      <div className="select-none pr-4 text-right text-black/30 dark:text-white/30 font-mono text-[11px] leading-relaxed shrink-0">
                        {editedCode.split("\n").map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>

                      {/* Code Content */}
                      <pre className="flex-1 overflow-x-auto text-black dark:text-white whitespace-pre font-mono text-xs select-text pl-2">
                        {editedCode}
                      </pre>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-black/50 dark:text-white/50">
                <FolderGit2 className="w-12 h-12 mb-3 text-black/30 dark:text-white/30" />
                <h3 className="text-sm font-black text-black dark:text-white mb-1">Select a File to View or Edit</h3>
                <p className="text-xs max-w-sm font-semibold">
                  Browse the folder structure on the left to inspect, copy, edit, or download code.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Create New File Dialog */}
        {showNewFileDialog && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white dark:bg-black border border-black/30 dark:border-white/30 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-black dark:text-white">Create New Codebase File</h3>
                <button
                  type="button"
                  onClick={() => setShowNewFileDialog(false)}
                  className="p-1 text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-black/70 dark:text-white/70 mb-1">
                    File Path (Folder / Subfolder / Name)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. landing-page/src/components/Hero.tsx"
                    value={newFilePath}
                    onChange={(e) => setNewFilePath(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-black/5 dark:bg-white/10 border border-black/20 dark:border-white/20 text-black dark:text-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-black/70 dark:text-white/70 mb-1">
                    Initial Content (Optional)
                  </label>
                  <textarea
                    rows={6}
                    placeholder="// Write your code or paste template here..."
                    value={newFileContent}
                    onChange={(e) => setNewFileContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-black/5 dark:bg-white/10 border border-black/20 dark:border-white/20 text-black dark:text-white focus:outline-hidden resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFileDialog(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-black/10 dark:hover:bg-white/15"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewFile}
                  disabled={!newFilePath.trim()}
                  className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-black disabled:opacity-40 cursor-pointer"
                >
                  Create File
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
