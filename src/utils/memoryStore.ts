import { UserMemory } from "../types";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";

const MEMORY_STORAGE_KEY = "kelvis_user_memory";

export const DEFAULT_USER_MEMORY: UserMemory = {
  user_name: "",
  interests: ["Coding", "Business", "Technology"],
  nationality: "",
  personal_info: "Prefers clear, actionable, and well-structured responses without fluff.",
  major_projects: [],
  ai_character_judgment: "Pragmatic, ambitious builder and thinker focused on rapid execution.",
  custom_memories: [],
  updated_at: new Date().toISOString(),
};

/**
 * Loads user memory from LocalStorage
 */
export function loadUserMemory(): UserMemory {
  try {
    const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_USER_MEMORY, ...parsed };
    }
  } catch (e) {
    console.warn("Could not load user memory from storage:", e);
  }
  return DEFAULT_USER_MEMORY;
}

/**
 * Saves user memory to LocalStorage and syncs with Supabase if configured
 */
export async function saveUserMemory(memory: UserMemory, userEmail?: string | null): Promise<void> {
  try {
    const updated = {
      ...memory,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(updated));

    // Sync to Supabase if available
    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured) {
      const { data: { user } } = await supabase.auth.getUser();
      const payload: any = {
        user_id: user ? user.id : null,
        user_email: user?.email || userEmail || null,
        user_name: updated.user_name || null,
        interests: updated.interests || [],
        nationality: updated.nationality || null,
        personal_info: updated.personal_info || null,
        major_projects: updated.major_projects || [],
        ai_character_judgment: updated.ai_character_judgment || null,
        custom_memories: updated.custom_memories || [],
        updated_at: new Date().toISOString(),
      };

      // Check if memory row exists for this user
      if (user) {
        const { data: existing } = await supabase
          .from("user_memories")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing) {
          await supabase.from("user_memories").update(payload).eq("id", existing.id);
        } else {
          await supabase.from("user_memories").insert(payload);
        }
      }
    }
  } catch (e) {
    console.warn("Error saving user memory:", e);
  }
}

/**
 * Formats user memory into a concise prompt instruction for the AI model
 */
export function formatUserMemoryForPrompt(memory: UserMemory): string {
  const parts: string[] = [];

  if (memory.user_name) {
    parts.push(`- User's Name: ${memory.user_name}`);
  }
  if (memory.nationality) {
    parts.push(`- Nationality / Location: ${memory.nationality}`);
  }
  if (memory.interests && memory.interests.length > 0) {
    parts.push(`- Core Interests: ${memory.interests.join(", ")}`);
  }
  if (memory.personal_info) {
    parts.push(`- Personal Background & Style: ${memory.personal_info}`);
  }
  if (memory.major_projects && memory.major_projects.length > 0) {
    parts.push(`- Major Projects & Goals: ${memory.major_projects.join(", ")}`);
  }
  if (memory.ai_character_judgment) {
    parts.push(`- AI Assessment of User's Persona: ${memory.ai_character_judgment}`);
  }
  if (memory.custom_memories && memory.custom_memories.length > 0) {
    parts.push(`- Specific Remembered Facts:\n  • ${memory.custom_memories.join("\n  • ")}`);
  }

  if (parts.length === 0) return "";

  return `### 🧠 PERSISTENT USER MEMORY & PERSONAL CONTEXT (Tailor all responses & follow-ups using this):\n${parts.join(
    "\n"
  )}`;
}

/**
 * Extract key memory details from conversation messages if present
 */
export function extractMemoryFromText(text: string, currentMemory: UserMemory): Partial<UserMemory> | null {
  const updates: Partial<UserMemory> = {};
  let hasUpdates = false;

  // Name extraction
  const nameMatch = text.match(/\b(?:my name is|i am called|call me|i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/i);
  if (nameMatch && nameMatch[1] && !/^(sorry|here|fine|good|ready|working|coding|building|trying)$/i.test(nameMatch[1])) {
    updates.user_name = nameMatch[1].trim();
    hasUpdates = true;
  }

  // Nationality extraction
  const nationalityMatch = text.match(/\b(?:i am from|i'm from|my country is|nationality is|living in)\s+([A-Za-z\s]+?)(?:\.|\,|$|\n)/i);
  if (nationalityMatch && nationalityMatch[1]) {
    const rawNat = nationalityMatch[1].trim();
    if (rawNat.length > 2 && rawNat.length < 35 && !/^(here|there|home|work)$/i.test(rawNat)) {
      updates.nationality = rawNat;
      hasUpdates = true;
    }
  }

  // Interest detection
  if (/\b(love coding|learning to code|interested in business|into crypto|building a startup|doing software development|trading forex|investing)\b/i.test(text)) {
    const newInterests = new Set(currentMemory.interests || []);
    if (/coding|software|programming|code/i.test(text)) newInterests.add("Coding");
    if (/business|startup|founder|sales/i.test(text)) newInterests.add("Business");
    if (/crypto|binance|bitcoin|trading/i.test(text)) newInterests.add("Crypto & Markets");
    if (/ai|machine learning|deep learning/i.test(text)) newInterests.add("Artificial Intelligence");
    updates.interests = Array.from(newInterests);
    hasUpdates = true;
  }

  return hasUpdates ? updates : null;
}
