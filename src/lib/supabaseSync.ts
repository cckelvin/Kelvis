import { getSupabase, isSupabaseConfigured } from "./supabase";
import { ChatSession, Message } from "../types";

/**
 * Syncs user sessions from Supabase database if available
 */
export async function fetchSupabaseSessions(): Promise<ChatSession[] | null> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch user sessions
    let query = supabase
      .from("chat_sessions")
      .select("*")
      .order("updated_at", { ascending: false });

    if (user) {
      query = query.eq("user_id", user.id);
    }

    const { data: dbSessions, error: sessionErr } = await query;
    if (sessionErr || !dbSessions || dbSessions.length === 0) {
      return null;
    }

    const formattedSessions: ChatSession[] = [];

    for (const s of dbSessions) {
      const { data: dbMessages } = await supabase
        .from("messages")
        .select("*")
        .eq("session_id", s.id)
        .order("created_at", { ascending: true });

      const messages: Message[] = (dbMessages || []).map((m: any) => ({
        id: m.id,
        role: m.role,
        text: m.text,
        image: m.image_url || undefined,
        sources: m.sources || undefined,
        files: m.files || undefined,
        timestamp: m.timestamp || new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));

      formattedSessions.push({
        id: s.id,
        title: s.title || "NEW CHAT",
        model: s.model || "gemini-3.6-flash",
        updatedAt: s.updated_at ? new Date(s.updated_at).toLocaleDateString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Just now",
        messages,
      });
    }

    return formattedSessions;
  } catch (err) {
    console.warn("Could not fetch sessions from Supabase:", err);
    return null;
  }
}

/**
 * Save or update a session in Supabase
 */
export async function saveSupabaseSession(session: ChatSession): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();

    // Upsert session row
    await supabase.from("chat_sessions").upsert({
      id: session.id,
      user_id: user?.id || null,
      title: session.title,
      model: session.model || "gemini-3.6-flash",
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Could not save session to Supabase:", err);
  }
}

/**
 * Save a message into a Supabase session
 */
export async function saveSupabaseMessage(sessionId: string, message: Message): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("messages").insert({
      id: message.id,
      session_id: sessionId,
      user_id: user?.id || null,
      role: message.role,
      text: message.text,
      image_url: message.image || null,
      sources: message.sources ? JSON.parse(JSON.stringify(message.sources)) : null,
      files: message.files ? JSON.parse(JSON.stringify(message.files)) : null,
      timestamp: message.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  } catch (err) {
    console.warn("Could not save message to Supabase:", err);
  }
}

/**
 * Delete a session from Supabase
 */
export async function deleteSupabaseSession(sessionId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) return;

  try {
    await supabase.from("chat_sessions").delete().eq("id", sessionId);
  } catch (err) {
    console.warn("Could not delete session from Supabase:", err);
  }
}

/**
 * Upload attachment file to Supabase Storage if configured
 */
export async function uploadSupabaseFile(file: File): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { data, error } = await supabase.storage
      .from("chat-attachments")
      .upload(fileName, file, { upsert: true });

    if (error || !data) {
      console.warn("Supabase storage upload error:", error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("chat-attachments")
      .getPublicUrl(data.path);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.warn("Supabase file upload failed:", err);
    return null;
  }
}
