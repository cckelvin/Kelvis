import { createClient, SupabaseClient } from "@supabase/supabase-js";

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || "";

let supabaseInstance: SupabaseClient | null = null;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}
