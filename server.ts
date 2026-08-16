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
  if (!requestedModel) return "deepseek-r1-distill-llama-70b";
  const m = String(requestedModel).toLowerCase();
  if (m.includes("gpt-oss") || m.includes("gptoss") || m.includes("oss-120b") || m.includes("code")) {
    return "deepseek-r1-distill-llama-70b";
  }
  return "deepseek-r1-distill-llama-70b";
}

async function fetchLiveWebResults(
  query: string,
  customApiKey?: string,
  customCx?: string
): Promise<Array<{ title: string; url: string; domain: string; snippet: string }>> {
  const sources: Array<{ title: string; url: string; domain: string; snippet: string }> = [];

  // Check Google Custom Search Engine (CSE) API keys (custom parameters or environment variables)
  const apiKey =
    customApiKey ||
    process.env.GOOGLE_SEARCH_API_KEY ||
    process.env.GOOGLE_CSE_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_SEARCH_KEY;
  const cx =
    customCx ||
    process.env.GOOGLE_CSE ||
    process.env.GOOGLE_CX ||
    process.env.GOOGLE_CSE_ID ||
    process.env.GOOGLE_SEARCH_CX ||
    process.env.GOOGLE_SEARCH_CSE;

  if (apiKey && cx) {
    try {
      const gUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=5`;
      const resp = await fetch(gUrl);
      if (resp.ok) {
        const data = await resp.json();
        if (data.items && Array.isArray(data.items)) {
          for (const item of data.items.slice(0, 5)) {
            let domain = "google.com";
            try {
              domain = new URL(item.link).hostname.replace(/^www\./, "");
            } catch (e) {}
            sources.push({
              title: item.title || domain,
              url: item.link,
              domain: domain,
              snippet: item.snippet || "",
            });
          }
        }
      }
    } catch (e) {
      console.warn("Google Custom Search API error:", e);
    }
  }

  // Fallback or supplementary DuckDuckGo API if Google CSE returns empty
  if (sources.length === 0) {
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const resp = await fetch(ddgUrl);
      if (resp.ok) {
        const data = await resp.json();
        if (data.AbstractURL && data.AbstractText) {
          let domain = "duckduckgo.com";
          try {
            domain = new URL(data.AbstractURL).hostname.replace(/^www\./, "");
          } catch (e) {}
          sources.push({
            title: data.Heading || query,
            url: data.AbstractURL,
            domain: domain,
            snippet: data.AbstractText,
          });
        }
        if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
          for (const topic of data.RelatedTopics.slice(0, 4)) {
            if (topic.FirstURL && topic.Text) {
              let domain = "duckduckgo.com";
              try {
                domain = new URL(topic.FirstURL).hostname.replace(/^www\./, "");
              } catch (e) {}
              sources.push({
                title: topic.Text.slice(0, 60) + "...",
                url: topic.FirstURL,
                domain: domain,
                snippet: topic.Text,
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn("DuckDuckGo search error:", e);
    }
  }

  // Secondary Fallback to Wikipedia API
  if (sources.length === 0) {
    try {
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
      const resp = await fetch(wikiUrl);
      if (resp.ok) {
        const data = await resp.json();
        const searchHits = data.query?.search;
        if (searchHits && Array.isArray(searchHits)) {
          for (const hit of searchHits.slice(0, 4)) {
            const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.title.replace(/ /g, "_"))}`;
            const cleanSnippet = (hit.snippet || "").replace(/<[^>]+>/g, "");
            sources.push({
              title: hit.title,
              url: pageUrl,
              domain: "wikipedia.org",
              snippet: cleanSnippet,
            });
          }
        }
      }
    } catch (e) {
      console.warn("Wikipedia fallback search error:", e);
    }
  }

  return sources;
}

// Initialize Groq Client
function getGroqClient(customKey?: string) {
  const apiKey =
    customKey ||
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

// Binance Public Market Data Proxy Routes (Zero API Key / Unauthenticated)
app.get("/api/binance/klines", async (req, res) => {
  const symbol = String(req.query.symbol || "BTCUSDT").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const interval = String(req.query.interval || "1m");
  const limit = Math.min(Number(req.query.limit) || 100, 500);

  try {
    const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const response = await fetch(binanceUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch from Binance" });
    }
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal error fetching Binance klines" });
  }
});

app.get("/api/binance/ticker", async (req, res) => {
  const symbol = String(req.query.symbol || "BTCUSDT").toUpperCase().replace(/[^A-Z0-9]/g, "");

  try {
    const binanceUrl = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
    const response = await fetch(binanceUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch 24hr ticker from Binance" });
    }
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal error fetching Binance ticker" });
  }
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

// Image Generation Helper using Pollinations FLUX engine
function generateAIPictureUrl(prompt: string): string {
  const cleanPrompt = encodeURIComponent(
    prompt.replace(/^(generate|create|draw|make|show me)\s+(an?\s+)?(image|picture|photo|illustration|drawing|visual)\s+(of\s+)?/i, "").trim() || prompt
  );
  const seed = Math.floor(Math.random() * 1000000);
  return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;
}

// Dedicated Image Generation API
app.post(["/api/generate-image", "/generate-image"], async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Prompt is required for image generation" });
      return;
    }
    const imageUrl = generateAIPictureUrl(prompt);
    res.json({
      success: true,
      imageUrl,
      prompt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to generate image" });
  }
});

// Main Chat Endpoint
app.post(["/api/chat", "/chat"], async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  let spotifyTrackObj: any = null;
  let generatedImageUrl: string | null = null;
  try {
    const {
      prompt,
      history = [],
      model = "llama-3.3-70b-versatile",
      files = [],
      searchGrounding = true,
      systemInstruction,
      googleApiKey,
      googleCx,
      groqApiKey,
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

    // Check if image generation intent is present
    const isImageIntent =
      prompt &&
      /\b(generate|create|draw|make|render|illustrate)\b.*\b(image|picture|photo|artwork|illustration|logo|wallpaper|drawing|graphic)\b/i.test(
        prompt
      );
    if (isImageIntent) {
      generatedImageUrl = generateAIPictureUrl(prompt);
    }

    const groq = getGroqClient(groqApiKey);

    if (!groq) {
      let outputText = "⚠️ **Groq API Key Missing**\n\nYour application is configured to use Groq, but `GROQ_API_KEY` has not been added to your environment variables.\n\n**To enable Groq AI responses on https://kelvis.vercel.app:**\n1. Get your free API key at [Groq Console](https://console.groq.com/)\n2. Open your **Vercel Dashboard** -> Select your **kelvis** project.\n3. Go to **Settings** -> **Environment Variables** -> Add Name: `GROQ_API_KEY`.\n4. Save and click **Redeploy** on Vercel.";
      if (spotifyTrackObj) {
        outputText += `\n\n==Now Playing on Spotify==: **${spotifyTrackObj.title}** by ${spotifyTrackObj.artist}. Enjoy the music below!`;
      }
      if (generatedImageUrl) {
        outputText += `\n\n![Generated Image](${generatedImageUrl})\n*Generated Image with AI*`;
      }
      res.json({
        text: outputText,
        image: generatedImageUrl,
        sources: [],
        spotifyTrack: spotifyTrackObj,
        modelUsed: "notice",
      });
      return;
    }

    // Prepare messages for Groq completion
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

    const defaultStructuredSystemInstruction = `You are Kelvis, a smart, creative, and highly capable AI assistant.

### 1. CODE GENERATION SCOPE (CRITICAL):
- **Only write code when explicitly requested**: Do NOT output code blocks, HTML, CSS, JavaScript, Python, or scripts unless the user explicitly asks you to code, program, build a script, or debug code.
- **For general conversations, questions, advice, summaries, or explanations**: Respond in natural, articulate text without unsolicited code blocks.
- **When the user DOES explicitly request code**:
  - Provide clean, complete, fully working code blocks with proper language syntax fences (e.g., \`\`\`html, \`\`\`css, \`\`\`javascript, \`\`\`python).
  - Ensure the code is runnable with zero placeholders.

### 2. LIVE BINANCE MARKET DATA & CANDLESTICK CHARTS:
When the user asks for live Binance cryptocurrency market data, prices, candlestick charts, or technical analysis (e.g. BTCUSDT, ETHUSDT, SOLUSDT, BNBUSDT, etc.), embed the live interactive Binance WebSocket candlestick chart directly in your response using:
\`\`\`binance
BTCUSDT
\`\`\`
or with a specific interval (1m, 5m, 15m, 1h, 4h, 1D):
\`\`\`binance
{ "symbol": "ETHUSDT", "interval": "5m" }
\`\`\`
The application will automatically connect to Binance's public WebSocket, render live real-time OHLCV candles, and locally calculate Exponential Moving Averages (EMA 9, 21, 50), Relative Strength Index (RSI 14), Moving Average Convergence Divergence (MACD 12, 26, 9), and Bollinger Bands (20, 2) without any API keys.

### 3. INTERACTIVE CHARTS & VISUALIZATIONS:
When the user explicitly asks for general data charts, graphs, or statistical data comparison, format using a \`\`\`chart block with valid JSON:
\`\`\`chart
{
  "type": "bar",
  "title": "Data Overview",
  "description": "Metric comparison",
  "xKey": "category",
  "data": [
    { "category": "A", "Value": 100 },
    { "category": "B", "Value": 150 }
  ],
  "keys": ["Value"]
}
\`\`\`

### 4. FILE ATTACHMENTS & ANALYSIS:
When the user attaches files, analyze the contents thoroughly and summarize key insights or statistics clearly.

### 5. INTERACTIVE PRACTICE QUIZZES & CLAUDE-STYLE KNOWLEDGE TESTS:
- **When explaining or teaching a subject** (e.g. Geography, Physics, Biology, History, WAEC/NECO, Chemistry, Economics, Coding, etc.) or when the user asks to test their knowledge / quiz them, conclude your explanation with a quick, engaging interactive practice quiz using a \`\`\`quiz block:
\`\`\`quiz
{
  "title": "Quick Knowledge Check: [Topic Name]",
  "topic": "[Subject / Topic]",
  "questions": [
    {
      "id": 1,
      "question": "Engaging multiple choice question 1?",
      "options": [
        { "id": "A", "text": "Option A" },
        { "id": "B", "text": "Option B" },
        { "id": "C", "text": "Option C" },
        { "id": "D", "text": "Option D" }
      ],
      "correctOptionId": "A",
      "explanation": "Clear explanation of why A is the correct answer."
    },
    {
      "id": 2,
      "question": "Engaging multiple choice question 2?",
      "options": [
        { "id": "A", "text": "Option A" },
        { "id": "B", "text": "Option B" },
        { "id": "C", "text": "Option C" },
        { "id": "D", "text": "Option D" }
      ],
      "correctOptionId": "B",
      "explanation": "Clear explanation of why B is correct."
    }
  ]
}
\`\`\`
The application will automatically render this as a slick slide-up floating test tab with glowing options and interactive navigation!
- **When receiving a quiz submission** (starts with "🎯 **Quiz Answers Submission**" or "Here are my submitted answers"):
  - Provide complete, encouraging, and detailed grading in your response:
  - 1. State the final score and grade percentage prominently (e.g., 🎯 **Final Score: 4/5 (80%) — Excellent Work!**).
  - 2. Break down each question: celebrate correct choices, explain any mistaken options with clarity and kindness, and share deep insights into the correct answer.
  - 3. Give high-impact study takeaways and next learning milestones.`;

    messages.push({
      role: "system",
      content: systemInstruction
        ? `${systemInstruction}\n\n${defaultStructuredSystemInstruction}`
        : defaultStructuredSystemInstruction,
    });

    if (history && history.length > 0) {
      for (const msg of history) {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.text || "",
        });
      }
    }

    // Process file attachments and extract real content
    let userMessageContent = prompt || "";
    if (files && files.length > 0) {
      let fileContext = "\n\n=== UPLOADED ATTACHMENTS FOR ANALYSIS ===";
      for (const file of files) {
        fileContext += `\n\n📄 [File: ${file.name} (${file.mimeType || "application/octet-stream"}) - ${Math.round((file.size || 0) / 1024)} KB]:\n`;
        if (file.data) {
          // If text-based file (JSON, CSV, JS, TS, HTML, CSS, TXT, MD, Python, etc.)
          if (
            file.mimeType?.includes("text") ||
            file.mimeType?.includes("json") ||
            file.mimeType?.includes("csv") ||
            file.mimeType?.includes("javascript") ||
            file.mimeType?.includes("typescript") ||
            file.name?.match(/\.(csv|json|txt|md|js|ts|jsx|tsx|html|css|py|sql|log|xml|yaml|yml)$/i)
          ) {
            try {
              const base64Data = file.data.includes(",") ? file.data.split(",")[1] : file.data;
              const decodedText = Buffer.from(base64Data, "base64").toString("utf-8");
              
              // If CSV, provide preview and compute quick stats
              if (file.name?.endsWith(".csv") || file.mimeType?.includes("csv")) {
                const rows = decodedText.split("\n").filter((r) => r.trim().length > 0);
                fileContext += `\n[CSV Data (${rows.length} rows)]:\n\`\`\`csv\n${decodedText.slice(0, 15000)}\n\`\`\`\n`;
              } else {
                fileContext += `\n\`\`\`\n${decodedText.slice(0, 15000)}\n\`\`\`\n`;
              }
            } catch (decErr) {
              fileContext += `[Binary data encoded: ${file.data.slice(0, 200)}...]`;
            }
          } else if (file.mimeType?.startsWith("image/")) {
            fileContext += `\n[Image attachment provided for visual analysis: ${file.name}]`;
          }
        }
      }
      userMessageContent += fileContext;
    }

    // Live Web Search Grounding trigger
    let fetchedSources: Array<{ title: string; url: string; domain: string; snippet: string }> = [];
    const needsSearch =
      searchGrounding ||
      /search|latest|recent|news|current|today|2025|2026|update|price|who is|what is|competitor|website|bouk|info|data|google/i.test(
        prompt || ""
      );

    if (needsSearch && prompt) {
      try {
        fetchedSources = await fetchLiveWebResults(prompt, googleApiKey, googleCx);
      } catch (sErr) {
        console.warn("Live web search execution notice:", sErr);
      }
    }

    if (fetchedSources.length > 0) {
      const searchContextText =
        "\n\n[Verified Live Web Search Context (Use this fresh data to answer accurately)]:\n" +
        fetchedSources
          .map(
            (s, idx) =>
              `Source ${idx + 1}: ${s.title}\nDomain: ${s.domain}\nURL: ${s.url}\nSnippet: ${s.snippet}`
          )
          .join("\n\n");

      userMessageContent += searchContextText;
    }

    messages.push({
      role: "user",
      content: userMessageContent || "Hello",
    });

    const selectedModel = normalizeGroqModelName(model);
    const wantsStream = req.body.stream !== false;

    if (wantsStream) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      if (typeof (res as any).flushHeaders === "function") {
        (res as any).flushHeaders();
      }

      let stream: any;
      try {
        stream = await groq.chat.completions.create({
          model: selectedModel,
          messages: messages as any,
          temperature: 0.7,
          stream: true,
        });
      } catch (genErr: any) {
        console.warn(`Primary Groq stream ${selectedModel} failed:`, genErr?.message || genErr);
        if (selectedModel !== "llama-3.1-8b-instant") {
          try {
            stream = await groq.chat.completions.create({
              model: "llama-3.1-8b-instant",
              messages: messages as any,
              temperature: 0.7,
              stream: true,
            });
          } catch (fallbackErr: any) {
            res.write(`data: ${JSON.stringify({ error: fallbackErr?.message || "Failed to start AI stream." })}\n\n`);
            res.end();
            return;
          }
        } else {
          res.write(`data: ${JSON.stringify({ error: genErr?.message || "Failed to start AI stream." })}\n\n`);
          res.end();
          return;
        }
      }

      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content || "";
        if (delta) {
          res.write(`data: ${JSON.stringify({ token: delta })}\n\n`);
        }
      }

      if (spotifyTrackObj) {
        res.write(
          `data: ${JSON.stringify({
            token: `\n\n==Now Playing on Spotify==: **${spotifyTrackObj.title}** by ${spotifyTrackObj.artist}. Enjoy the music below!`,
            spotifyTrack: spotifyTrackObj,
          })}\n\n`
        );
      }

      if (generatedImageUrl) {
        res.write(
          `data: ${JSON.stringify({
            token: `\n\n![Generated Image](${generatedImageUrl})\n*Generated Image with AI*`,
            image: generatedImageUrl,
          })}\n\n`
        );
      }

      res.write(
        `data: ${JSON.stringify({
          done: true,
          image: generatedImageUrl,
          sources: fetchedSources,
          spotifyTrack: spotifyTrackObj,
          modelUsed: selectedModel,
        })}\n\n`
      );
      res.end();
      return;
    }

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

    if (generatedImageUrl) {
      outputText += `\n\n![Generated Image](${generatedImageUrl})\n*Generated Image with AI*`;
    }

    res.json({
      text: outputText,
      image: generatedImageUrl,
      sources: fetchedSources,
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
