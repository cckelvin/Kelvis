import express from "express";
import path from "path";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Normalize requested model to valid public Groq API model alias
function normalizeGroqModelName(requestedModel?: string): string {
  if (!requestedModel) return "llama-3.3-70b-versatile";
  const m = String(requestedModel).toLowerCase();
  if (m.includes("deepseek") || m.includes("r1")) return "deepseek-r1-distill-llama-70b";
  if (m.includes("8b") || m.includes("instant") || m.includes("lite") || m.includes("flash")) return "llama-3.1-8b-instant";
  if (m.includes("mixtral") || m.includes("8x7b")) return "mixtral-8x7b-32768";
  if (m.includes("gemma")) return "gemma2-9b-it";
  if (m.includes("70b") || m.includes("versatile") || m.includes("pro") || m.includes("llama")) return "llama-3.3-70b-versatile";
  return "llama-3.3-70b-versatile";
}

// Initialize Groq Client
function getGroqClient() {
  const apiKey =
    process.env.GROQ_API_KEY ||
    process.env.groq_api_key ||
    process.env.GROQ_KEY ||
    process.env.VITE_GROQ_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.kelvis ||
    process.env.KELVIS ||
    process.env.VITE_KELVIS ||
    process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }
  return new Groq({ apiKey });
}

// Health check endpoint
app.get(["/api/health", "/health"], (req, res) => {
  const hasKey = Boolean(
    process.env.GROQ_API_KEY ||
      process.env.groq_api_key ||
      process.env.GROQ_KEY ||
      process.env.VITE_GROQ_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.kelvis ||
      process.env.KELVIS ||
      process.env.VITE_KELVIS ||
      process.env.VITE_GEMINI_API_KEY
  );
  res.json({ status: "ok", groqConfigured: hasKey, provider: "groq" });
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

  if (clientId && clientSecret && clientId !== "sample_client_id") {
    try {
      const authRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
        },
        body: "grant_type=client_credentials",
      });

      if (authRes.ok) {
        const authText = await authRes.text();
        let authData: any = {};
        try {
          authData = JSON.parse(authText);
        } catch (err) {
          authData = {};
        }

        if (authData.access_token) {
          const searchRes = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(cleanQuery || "hits")}&type=track&limit=1`,
            {
              headers: { Authorization: `Bearer ${authData.access_token}` },
            }
          );
          if (searchRes.ok) {
            const searchText = await searchRes.text();
            let searchData: any = {};
            try {
              searchData = JSON.parse(searchText);
            } catch (err) {
              searchData = {};
            }
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
app.get(["/api/spotify/auth-url", "/spotify/auth-url"], (req, res) => {
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
app.post(["/api/spotify/search", "/spotify/search"], async (req, res) => {
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
app.post(["/api/chat", "/chat"], async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  let spotifyTrackObj: any = null;
  try {
    const {
      prompt,
      history = [],
      model = "llama-3.3-70b-versatile",
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

    if (isMusicIntent) {
      spotifyTrackObj = await searchSpotifyTrack(prompt);
    }

    const groq = getGroqClient();

    if (!groq) {
      let outputText = "⚠️ **Groq API Key Missing**\n\nYour application is configured to use Groq, but `GROQ_API_KEY` has not been added to your environment variables.\n\n**To enable Groq AI responses on https://kelvis.vercel.app:**\n1. Get your free API key at [Groq Console](https://console.groq.com/)\n2. Open your **Vercel Dashboard** -> Select your **kelvis** project.\n3. Go to **Settings** -> **Environment Variables** -> Add Name: `GROQ_API_KEY`.\n4. Save and click **Redeploy** on Vercel.";
      if (spotifyTrackObj) {
        outputText += `\n\n==Now Playing on Spotify==: **${spotifyTrackObj.title}** by ${spotifyTrackObj.artist}. Enjoy the music below!`;
      }
      res.json({
        text: outputText,
        image: null,
        sources: [],
        spotifyTrack: spotifyTrackObj,
        modelUsed: "notice",
      });
      return;
    }

    // Prepare messages for Groq completion
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

    if (systemInstruction) {
      messages.push({
        role: "system",
        content: systemInstruction,
      });
    }

    if (history && history.length > 0) {
      for (const msg of history) {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.text || "",
        });
      }
    }

    // Add file metadata / descriptions if attachments are provided
    let userMessageContent = prompt || "";
    if (files && files.length > 0) {
      const fileSummary = files
        .map((f: any) => `[Attached File: ${f.name || "attachment"} (${f.mimeType || "file"})]`)
        .join("\n");
      userMessageContent = fileSummary ? `${fileSummary}\n\n${userMessageContent}` : userMessageContent;
    }

    messages.push({
      role: "user",
      content: userMessageContent || "Hello",
    });

    const selectedModel = normalizeGroqModelName(model);

    let completion: any;
    try {
      completion = await groq.chat.completions.create({
        model: selectedModel,
        messages: messages as any,
        temperature: 0.7,
      });
    } catch (genErr: any) {
      console.warn(`Primary Groq model ${selectedModel} failed:`, genErr?.message || genErr);
      if (selectedModel !== "llama-3.1-8b-instant") {
        try {
          completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: messages as any,
            temperature: 0.7,
          });
        } catch (fallbackErr: any) {
          throw genErr;
        }
      } else {
        throw genErr;
      }
    }

    let outputText = completion.choices?.[0]?.message?.content || "";

    if (spotifyTrackObj && !outputText.includes("Spotify")) {
      outputText += `\n\n==Now Playing on Spotify==: **${spotifyTrackObj.title}** by ${spotifyTrackObj.artist}. Enjoy the music below!`;
    }

    res.json({
      text: outputText,
      image: null,
      sources: [],
      spotifyTrack: spotifyTrackObj,
      modelUsed: selectedModel,
    });
  } catch (err: any) {
    console.error("Groq API Error:", err);
    const errStr = String(err?.message || err || "");
    let noticeText = "";

    if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429") || errStr.includes("rate_limit_exceeded") || errStr.includes("quota")) {
      noticeText = `⚠️ **Groq API Rate Limit Exceeded (429)**\n\nThe Groq API key has temporarily reached its rate limits or request quota.\n\n**How to fix:**\n1. Check your usage at [Groq Console](https://console.groq.com/)\n2. Wait a few moments for rate limits to reset or add billing details.`;
    } else if (errStr.includes("401") || errStr.includes("invalid_api_key")) {
      noticeText = `⚠️ **Invalid Groq API Key (401)**: Please verify that \`GROQ_API_KEY\` is configured correctly in environment variables.`;
    } else {
      noticeText = `⚠️ **Groq AI Service Notice**: ${err?.message || "Unable to reach Groq API"}.\n\nIf hosted on Vercel, please check that \`GROQ_API_KEY\` is configured in Vercel Project Settings -> Environment Variables.`;
    }

    res.json({
      text: noticeText,
      image: null,
      sources: [],
      spotifyTrack: spotifyTrackObj || null,
      modelUsed: "error",
    });
  }
});

// Global Express Error Handler for JSON safety
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled Express Error:", err);
  res.setHeader("Content-Type", "application/json");
  res.status(500).json({
    error: err?.message || "Internal Server Error",
  });
});

async function startServer() {
  if (process.env.VERCEL) {
    return;
  }
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
