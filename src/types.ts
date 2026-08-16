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

export interface QuizOption {
  id: string; // "A" | "B" | "C" | "D"
  text: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
  correctOptionId?: string;
  explanation?: string;
}

export interface QuizPayload {
  title?: string;
  topic?: string;
  questions: QuizQuestion[];
}

export type GameType = "checkers" | "chess" | "cards" | "whot" | "3d-shooter" | "shooter";

export interface GamePayload {
  game: GameType | "all";
  title: string;
  description?: string;
  options?: string[];
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
  // Pages 1 to 100 HTML content
  pages?: Record<number, string>;
  createdAt: string;
  updatedAt: string;
  // Allow dynamic access to page_1 through page_100
  [key: string]: any;
}
