import { getSupabase, isSupabaseConfigured } from "./supabase";
import { ChatSession, Message } from "../types";

/**
 * Ensures any string is formatted as a valid 36-character UUID v4 for Supabase PostgreSQL
 */
export function toValidUUID(id: string): string {
  if (!id) return crypto.randomUUID();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;

  // Convert non-UUID string (like "session-1" or "msg-1723...") deterministically into valid UUID v4
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  const pad = "abcdef0123456789abcdef0123456789";
  const fullHex = (hex + pad).slice(0, 32);

  return `${fullHex.slice(0, 8)}-${fullHex.slice(8, 12)}-4${fullHex.slice(13, 16)}-a${fullHex.slice(17, 20)}-${fullHex.slice(20, 32)}`;
}

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
    if (sessionErr) {
      console.warn("Supabase sessions query notice:", sessionErr);
      return null;
    }

    if (!dbSessions || dbSessions.length === 0) {
      return [];
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
        model: s.model || "gpt-oss-120b",
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
export async function saveSupabaseSession(session: ChatSession): Promise<string> {
  const supabase = getSupabase();
  const validSessionId = toValidUUID(session.id);
  if (!supabase || !isSupabaseConfigured) return validSessionId;

  try {
    const { data: { user } } = await supabase.auth.getUser();

    // Upsert session row
    const { error } = await supabase.from("chat_sessions").upsert({
      id: validSessionId,
      user_id: user?.id || null,
      title: session.title,
      model: session.model || "gpt-oss-120b",
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("Supabase saveSession error:", error);
    }
  } catch (err) {
    console.warn("Could not save session to Supabase:", err);
  }

  return validSessionId;
}

/**
 * Save a message into a Supabase session
 */
export async function saveSupabaseMessage(sessionId: string, message: Message): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) return;

  const validSessionId = toValidUUID(sessionId);
  const validMessageId = toValidUUID(message.id);

  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("messages").upsert({
      id: validMessageId,
      session_id: validSessionId,
      user_id: user?.id || null,
      role: message.role,
      text: message.text,
      image_url: message.image || null,
      sources: message.sources ? JSON.parse(JSON.stringify(message.sources)) : null,
      files: message.files ? JSON.parse(JSON.stringify(message.files)) : null,
      timestamp: message.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    if (error) {
      console.warn("Supabase saveMessage error:", error);
    }
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

  const validSessionId = toValidUUID(sessionId);

  try {
    await supabase.from("chat_sessions").delete().eq("id", validSessionId);
  } catch (err) {
    console.warn("Could not delete session from Supabase:", err);
  }
}

/**
 * Subscribe to real-time changes across devices
 */
export function subscribeToSupabaseChats(onSync: () => void): () => void {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) return () => {};

  try {
    const channel = supabase
      .channel("public:chat_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_sessions" },
        () => {
          onSync();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          onSync();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (e) {
    console.warn("Realtime subscription setup notice:", e);
    return () => {};
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

