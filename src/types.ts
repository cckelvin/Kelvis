export interface AttachedFile {
  name: string;
  mimeType: string;
  data: string; // Base64 string
  size: number;
}

export interface GroundingSource {
  title: string;
  url: string;
  domain?: string;
  snippet?: string;
}

export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  previewUrl?: string;
  spotifyUrl: string;
  embedUrl: string;
}

export interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  image?: string;
  sources?: GroundingSource[];
  files?: { name: string; mimeType: string }[];
  spotifyTrack?: SpotifyTrack;
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
  customGoogleApiKey?: string;
  customGoogleCx?: string;
  customGroqApiKey?: string;
}

export type BoukClassification = "edu" | "tech" | "business" | "science" | "geo" | "humanities" | "general";

export interface BoukPage {
  id?: string;
  pageNumber: number;
  title: string;
  content: string; // Markdown supported
  mediaUrl?: string;
  attachments?: { name: string; type: string; url?: string }[];
}

export interface BoukChapter {
  id: string;
  chapterNumber: number;
  title: string;
  summary: string;
  pages: BoukPage[];
}

export interface Bouk {
  id: string;
  title: string;
  author: string;
  classification: BoukClassification;
  categoryName: string;
  gradeLevel?: string;
  coverImage?: string;
  coverGradient?: string;
  description: string;
  rating?: number;
  readersCount?: number;
  chapters: BoukChapter[];
  tags: string[];
  aiGuidance?: string;
  createdAt: string;
  updatedAt: string;
}
