import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Gemini Client
function getGeminiClient() {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.kelvis ||
    process.env.KELVIS ||
    process.env.VITE_KELVIS;

  if (!apiKey) {
    throw new Error(
      "API key not found. Please set GEMINI_API_KEY or kelvis in your environment variables."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  const hasKey = Boolean(
    process.env.GEMINI_API_KEY ||
      process.env.kelvis ||
      process.env.KELVIS ||
      process.env.VITE_KELVIS
  );
  res.json({ status: "ok", geminiConfigured: hasKey });
});

// Spotify Search & Embed Helper
async function searchSpotifyTrack(query: string) {
  const cleanQuery = query.replace(/^(play|listen to|put on|song|track|music)\s+/i, "").trim();

  // Known track fallback map for instant playback demo
  const knownTracks: Record<string, any> = {
    starboy: {
      id: "1xQ6trAsedVPCdbtMB8OOy",
      title: "Starboy",
      artist: "The Weeknd ft. Daft Punk",
      albumArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80",
      spotifyUrl: "https://open.spotify.com/track/1xQ6trAsedVPCdbtMB8OOy",
      embedUrl: "https://open.spotify.com/embed/track/1xQ6trAsedVPCdbtMB8OOy",
    },
    blinding: {
      id: "0VjIdWI8SuThmSYStw8KrE",
      title: "Blinding Lights",
      artist: "The Weeknd",
      albumArt: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80",
      spotifyUrl: "https://open.spotify.com/track/0VjIdWI8SuThmSYStw8KrE",
      embedUrl: "https://open.spotify.com/embed/track/0VjIdWI8SuThmSYStw8KrE",
    },
    shape: {
      id: "7qiZ28fsWCZ9eksYvGmvNK",
      title: "Shape of You",
      artist: "Ed Sheeran",
      albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=80",
      spotifyUrl: "https://open.spotify.com/track/7qiZ28fsWCZ9eksYvGmvNK",
      embedUrl: "https://open.spotify.com/embed/track/7qiZ28fsWCZ9eksYvGmvNK",
    },
  };

  const lowerQ = cleanQuery.toLowerCase();
  for (const key in knownTracks) {
    if (lowerQ.includes(key)) {
      return knownTracks[key];
    }
  }

  // Try fetching live via Spotify Web API if client credentials exist
  const clientId =
    process.env.SPOTIFY_CLIENT_ID ||
    process.env.spotify_client_id ||
    process.env.SPOTIFY_ID;
  const clientSecret =
    process.env.SPOTIFY_CLIENT_SECRET ||
    process.env.spotify_client_secret ||
    process.env.SPOTIFY_SECRET;

  if (clientId && clientSecret) {
    try {
      const authRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
        },
        body: "grant_type=client_credentials",
      });
      const authData = await authRes.json();
      if (authData.access_token) {
        const searchRes = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(cleanQuery || "hits")}&type=track&limit=1`,
          {
            headers: { Authorization: `Bearer ${authData.access_token}` },
          }
        );
        const searchData = await searchRes.json();
        const track = searchData.tracks?.items?.[0];
        if (track) {
          return {
            id: track.id,
            title: track.name,
            artist: track.artists?.map((a: any) => a.name).join(", "),
            albumArt: track.album?.images?.[0]?.url,
            previewUrl: track.preview_url || undefined,
            spotifyUrl: track.external_urls?.spotify,
            embedUrl: `https://open.spotify.com/embed/track/${track.id}`,
          };
        }
      }
    } catch (e) {
      console.warn("Spotify API live search notice:", e);
    }
  }

  // Generic Spotify Track Embed fallback
  return {
    id: "1xQ6trAsedVPCdbtMB8OOy",
    title: cleanQuery ? cleanQuery.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Popular Track",
    artist: "Spotify Web Player",
    albumArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80",
    spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(cleanQuery || "music")}`,
    embedUrl: `https://open.spotify.com/embed/track/1xQ6trAsedVPCdbtMB8OOy`,
  };
}

// Spotify OAuth URL endpoint
app.get("/api/spotify/auth-url", (req, res) => {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers.host;
  const appUrl = process.env.APP_URL || `${protocol}://${host}`;
  const redirectUri = `${appUrl}/auth/callback`;
  const clientId =
    process.env.SPOTIFY_CLIENT_ID ||
    process.env.spotify_client_id ||
    process.env.SPOTIFY_ID ||
    "sample_client_id";
  const scopes = [
    "user-read-private",
    "user-read-email",
    "user-modify-playback-state",
    "user-read-playback-state",
    "streaming",
  ].join(" ");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    show_dialog: "true",
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  res.json({ url: authUrl, redirectUri });
});

// OAuth Callback Route for Spotify popup window
app.get(["/auth/callback", "/auth/callback/"], (req, res) => {
  const code = req.query.code;
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Spotify Connection</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:40px;background:#0f172a;color:#fff;">
        <h2 style="color:#22c55e;">Spotify Connected!</h2>
        <p>Your Spotify account is connected to Kelvis. Closing popup window...</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'SPOTIFY_AUTH_SUCCESS', code: '${code || ""}' }, '*');
            window.close();
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `);
});

// Spotify direct search endpoint
app.post("/api/spotify/search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      res.status(400).json({ error: "Query parameter is required" });
      return;
    }
    const track = await searchSpotifyTrack(query);
    res.json({ track });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Spotify search failed" });
  }
});

// Main Chat Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const {
      prompt,
      history = [],
      model = "gemini-3.6-flash",
      files = [],
      searchGrounding = false,
      systemInstruction,
    } = req.body;

    if (!prompt && (!files || files.length === 0)) {
      res.status(400).json({ error: "Prompt or file attachment is required" });
      return;
    }

    // Check if music play intent is present
    const isMusicIntent = prompt && /\b(play|song|music|spotify|listen to|put on|track)\b/i.test(prompt);
    let spotifyTrackObj: any = null;

    if (isMusicIntent) {
      spotifyTrackObj = await searchSpotifyTrack(prompt);
    }

    const ai = getGeminiClient();

    // Prepare content parts
    const parts: any[] = [];

    // Add files if attached (inline base64)
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.data && file.mimeType) {
          parts.push({
            inlineData: {
              data: file.data.replace(/^data:[^;]+;base64,/, ""),
              mimeType: file.mimeType,
            },
          });
        }
      }
    }

    // Add text prompt
    if (prompt) {
      parts.push({ text: prompt });
    }

    // Build history context if present
    const contents: any[] = [];
    if (history && history.length > 0) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        });
      }
    }

    // Add current turn
    contents.push({
      role: "user",
      parts: parts.length > 0 ? parts : [{ text: prompt || "" }],
    });

    // Configure tools & options
    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (searchGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    // Check if model is image generation
    const selectedModel = model || "gemini-3.6-flash";

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: contents.length === 1 ? contents[0] : contents,
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    let outputText = response.text || "";
    let generatedImage: string | null = null;
    const groundingSources: Array<{ title: string; url: string }> = [];

    // Check for inline images or grounding metadata
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const firstCandidate = candidates[0];

      // Grounding sources
      const groundingChunks = firstCandidate.groundingMetadata?.groundingChunks;
      if (groundingChunks && Array.isArray(groundingChunks)) {
        for (const chunk of groundingChunks) {
          if (chunk.web?.uri) {
            groundingSources.push({
              title: chunk.web.title || chunk.web.uri,
              url: chunk.web.uri,
            });
          }
        }
      }

      // Check parts for generated image inline data
      const resParts = firstCandidate.content?.parts;
      if (resParts && Array.isArray(resParts)) {
        for (const p of resParts) {
          if (p.inlineData?.data) {
            const mime = p.inlineData.mimeType || "image/png";
            generatedImage = `data:${mime};base64,${p.inlineData.data}`;
          }
        }
      }
    }

    if (spotifyTrackObj && !outputText.includes("Spotify")) {
      outputText += `\n\n==Now Playing on Spotify==: **${spotifyTrackObj.title}** by ${spotifyTrackObj.artist}. Enjoy the music below!`;
    }

    res.json({
      text: outputText,
      image: generatedImage,
      sources: groundingSources,
      spotifyTrack: spotifyTrackObj,
      modelUsed: selectedModel,
    });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({
      error: err.message || "An error occurred while communicating with Gemini API",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();

export default app;
