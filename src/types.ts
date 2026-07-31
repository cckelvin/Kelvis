export interface AttachedFile {
  name: string;
  mimeType: string;
  data: string; // Base64 string
  size: number;
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  image?: string;
  sources?: GroundingSource[];
  files?: { name: string; mimeType: string }[];
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  messages: Message[];
  model: string;
}

export interface AppSettings {
  systemInstruction: string;
  searchGrounding: boolean;
  autoVoiceRead: boolean;
  darkTheme: boolean;
  temperature: number;
}
