import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Brain,
  Sparkles,
  Save,
  Trash2,
  Plus,
  Copy,
  Check,
  Database,
  Code2,
  User,
  Compass,
  Briefcase,
  Flag,
  RotateCcw,
} from "lucide-react";
import { UserMemory } from "../types";
import { DEFAULT_USER_MEMORY, loadUserMemory, saveUserMemory } from "../utils/memoryStore";

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory?: UserMemory;
  onSaveMemory?: (updated: UserMemory) => void;
  userEmail?: string | null;
}

export const SUPABASE_MEMORY_SQL = `-- =====================================================================
-- KELVIS AI CHATGPT-STYLE MEMORY & PERSONALIZATION TABLE
-- Run this in your Supabase SQL Editor (https://app.supabase.com)
-- =====================================================================

-- 1. Create user_memories table
CREATE TABLE IF NOT EXISTS public.user_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  user_name TEXT,
  interests TEXT[] DEFAULT '{}',
  nationality TEXT,
  personal_info TEXT,
  major_projects TEXT[] DEFAULT '{}',
  ai_character_judgment TEXT,
  custom_memories TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_user_memories_user_id ON public.user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memories_user_email ON public.user_memories(user_email);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can view their own memory profile."
  ON public.user_memories FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own memory profile."
  ON public.user_memories FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own memory profile."
  ON public.user_memories FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own memory profile."
  ON public.user_memories FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 5. Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_memory_updated ON public.user_memories;
CREATE TRIGGER on_memory_updated
  BEFORE UPDATE ON public.user_memories
  FOR EACH ROW EXECUTE FUNCTION public.handle_memory_updated_at();`;

export const MemoryModal: React.FC<MemoryModalProps> = ({
  isOpen,
  onClose,
  memory,
  onSaveMemory,
  userEmail,
}) => {
  const [activeTab, setActiveTab] = useState<"memory" | "sql">("memory");
  const [formData, setFormData] = useState<UserMemory>(() => memory || loadUserMemory());
  const [newInterest, setNewInterest] = useState("");
  const [newProject, setNewProject] = useState("");
  const [newCustomMemory, setNewCustomMemory] = useState("");
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync when prop updates or opens
  React.useEffect(() => {
    if (isOpen) {
      setFormData(memory || loadUserMemory());
    }
  }, [memory, isOpen]);

  const handleSave = () => {
    saveUserMemory(formData);
    if (onSaveMemory) {
      onSaveMemory(formData);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleReset = () => {
    if (confirm("Reset all stored AI memory to default?")) {
      const resetData = { ...DEFAULT_USER_MEMORY };
      setFormData(resetData);
      saveUserMemory(resetData);
      if (onSaveMemory) {
        onSaveMemory(resetData);
      }
    }
  };

  const handleAddInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInterest.trim()) return;
    if (!formData.interests?.includes(newInterest.trim())) {
      setFormData({
        ...formData,
        interests: [...(formData.interests || []), newInterest.trim()],
      });
    }
    setNewInterest("");
  };

  const handleRemoveInterest = (item: string) => {
    setFormData({
      ...formData,
      interests: (formData.interests || []).filter((i) => i !== item),
    });
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.trim()) return;
    if (!formData.major_projects?.includes(newProject.trim())) {
      setFormData({
        ...formData,
        major_projects: [...(formData.major_projects || []), newProject.trim()],
      });
    }
    setNewProject("");
  };

  const handleRemoveProject = (proj: string) => {
    setFormData({
      ...formData,
      major_projects: (formData.major_projects || []).filter((p) => p !== proj),
    });
  };

  const handleAddCustomMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomMemory.trim()) return;
    setFormData({
      ...formData,
      custom_memories: [...(formData.custom_memories || []), newCustomMemory.trim()],
    });
    setNewCustomMemory("");
  };

  const handleRemoveCustomMemory = (index: number) => {
    setFormData({
      ...formData,
      custom_memories: (formData.custom_memories || []).filter((_, i) => i !== index),
    });
  };

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_MEMORY_SQL);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    } catch (e) {
      console.warn("Clipboard copy failed:", e);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[88vh] flex flex-col bg-white dark:bg-neutral-950 border-2 border-black dark:border-white rounded-2xl shadow-2xl overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/15 dark:border-white/15 bg-black/5 dark:bg-white/5 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-black text-white dark:bg-white dark:text-black">
                <Brain className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-base font-black uppercase tracking-wider text-black dark:text-white flex items-center space-x-2">
                  <span>AI Memory & Personalization</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 font-extrabold uppercase border border-sky-500/30">
                    ChatGPT Engine
                  </span>
                </h2>
                <p className="text-xs text-black/60 dark:text-white/60 font-medium">
                  Persistent user knowledge used across all conversations
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center px-5 pt-3 border-b border-black/10 dark:border-white/10 gap-2 shrink-0 bg-neutral-50 dark:bg-neutral-900/50">
            <button
              onClick={() => setActiveTab("memory")}
              className={`px-4 py-2 text-xs font-black rounded-t-xl transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
                activeTab === "memory"
                  ? "border-black dark:border-white text-black dark:text-white bg-white dark:bg-neutral-950 shadow-xs"
                  : "border-transparent text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>User Memory Traits</span>
            </button>

            <button
              onClick={() => setActiveTab("sql")}
              className={`px-4 py-2 text-xs font-black rounded-t-xl transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
                activeTab === "sql"
                  ? "border-black dark:border-white text-black dark:text-white bg-white dark:bg-neutral-950 shadow-xs"
                  : "border-transparent text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Supabase SQL Script</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-black dark:text-white">
            {activeTab === "memory" ? (
              <>
                {/* Introduction Banner */}
                <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-start space-x-3">
                  <Sparkles className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-extrabold text-black dark:text-white">
                      How AI Memory Works
                    </p>
                    <p className="text-black/70 dark:text-white/70 leading-relaxed">
                      Kelvis retains these key characteristics and applies them as context to every conversation, giving you personalized reasoning, relevant answers, and sharp follow-ups.
                    </p>
                  </div>
                </div>

                {/* 1. Name & Nationality */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-black/70 dark:text-white/70 flex items-center space-x-1.5 mb-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>User's Name</span>
                    </label>
                    <input
                      type="text"
                      value={formData.user_name || ""}
                      onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                      placeholder="e.g. Doris"
                      className="w-full px-3 py-2 text-sm bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 rounded-xl font-bold focus:outline-hidden focus:border-black dark:focus:border-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-black/70 dark:text-white/70 flex items-center space-x-1.5 mb-1.5">
                      <Flag className="w-3.5 h-3.5" />
                      <span>Nationality / Location</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nationality || ""}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      placeholder="e.g. Nigerian"
                      className="w-full px-3 py-2 text-sm bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 rounded-xl font-bold focus:outline-hidden focus:border-black dark:focus:border-white"
                    />
                  </div>
                </div>

                {/* 2. Interests (Tags) */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-black/70 dark:text-white/70 flex items-center space-x-1.5 mb-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Interests & Focus Areas</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {(formData.interests || []).map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-black text-white dark:bg-white dark:text-black shadow-2xs"
                      >
                        <span>{interest}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveInterest(interest)}
                          className="hover:opacity-75 cursor-pointer ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <form onSubmit={handleAddInterest} className="flex gap-2">
                    <input
                      type="text"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      placeholder="Add interest (e.g. Coding, Business, AI, Crypto)..."
                      className="flex-1 px-3 py-2 text-xs bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 rounded-xl font-medium focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-black hover:opacity-85 active:scale-95 cursor-pointer flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </form>
                </div>

                {/* 3. Major Projects */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-black/70 dark:text-white/70 flex items-center space-x-1.5 mb-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Major Projects & Goals</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {(formData.major_projects || []).map((proj) => (
                      <span
                        key={proj}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black shadow-2xs"
                      >
                        <span>{proj}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProject(proj)}
                          className="hover:opacity-75 cursor-pointer ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <form onSubmit={handleAddProject} className="flex gap-2">
                    <input
                      type="text"
                      value={newProject}
                      onChange={(e) => setNewProject(e.target.value)}
                      placeholder="Add major project (e.g. SaaS Builder, E-commerce Store)..."
                      className="flex-1 px-3 py-2 text-xs bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 rounded-xl font-medium focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-black hover:opacity-85 active:scale-95 cursor-pointer flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </form>
                </div>

                {/* 4. Personal Info & Preferences */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-black/70 dark:text-white/70 flex items-center space-x-1.5 mb-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Personal Info & Tone Preferences</span>
                  </label>
                  <textarea
                    value={formData.personal_info || ""}
                    onChange={(e) => setFormData({ ...formData, personal_info: e.target.value })}
                    rows={2}
                    placeholder="e.g. Prefers fast execution, clean code, concise explanations, and direct answers..."
                    className="w-full px-3 py-2 text-xs bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 rounded-xl font-medium focus:outline-hidden resize-none"
                  />
                </div>

                {/* 5. AI Judge of Character */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-black/70 dark:text-white/70 flex items-center space-x-1.5 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>AI Judge of Character & Persona</span>
                  </label>
                  <textarea
                    value={formData.ai_character_judgment || ""}
                    onChange={(e) => setFormData({ ...formData, ai_character_judgment: e.target.value })}
                    rows={2}
                    placeholder="AI's perception of the user's vibe, intellectual strengths, and workflow..."
                    className="w-full px-3 py-2 text-xs bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 rounded-xl font-medium focus:outline-hidden resize-none"
                  />
                </div>

                {/* 6. Custom Remembered Memories */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-black/70 dark:text-white/70 flex items-center space-x-1.5 mb-1.5">
                    <Brain className="w-3.5 h-3.5" />
                    <span>Specific Remembered Facts</span>
                  </label>
                  <div className="space-y-1.5 mb-2.5">
                    {(formData.custom_memories || []).length === 0 ? (
                      <p className="text-xs text-black/50 dark:text-white/50 italic">
                        No specific memories stored yet. Add one below or converse naturally with Kelvis!
                      </p>
                    ) : (
                      (formData.custom_memories || []).map((mem, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-medium"
                        >
                          <span className="truncate mr-2">• {mem}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomMemory(idx)}
                            className="text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddCustomMemory} className="flex gap-2">
                    <input
                      type="text"
                      value={newCustomMemory}
                      onChange={(e) => setNewCustomMemory(e.target.value)}
                      placeholder="Add fact (e.g. Prefers Next.js with Tailwind, building a portfolio)..."
                      className="flex-1 px-3 py-2 text-xs bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 rounded-xl font-medium focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-black hover:opacity-85 active:scale-95 cursor-pointer flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              /* SQL Tab */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase text-black dark:text-white">
                      Supabase SQL Table Schema
                    </h3>
                    <p className="text-xs text-black/60 dark:text-white/60">
                      Copy and paste this script into your Supabase SQL Editor to store user memories in the cloud.
                    </p>
                  </div>
                  <button
                    onClick={copySql}
                    className="px-3.5 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-extrabold flex items-center space-x-1.5 hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy SQL</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-black/20 dark:border-white/20 bg-neutral-900 text-neutral-100 p-4 font-mono text-xs max-h-[50vh] overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{SUPABASE_MEMORY_SQL}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Footer with Action Buttons */}
          <div className="px-5 py-3.5 border-t border-black/15 dark:border-white/15 bg-black/5 dark:bg-white/5 flex items-center justify-between shrink-0">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-black flex items-center space-x-1.5 hover:opacity-85 active:scale-95 shadow-md cursor-pointer transition-all"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
