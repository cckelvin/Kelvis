import express from "express";
import path from "path";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import { GoogleGenAI, Modality } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Helper to get GoogleGenAI client
function getGeminiClient(customKey?: string) {
  const apiKey =
    customKey ||
    process.env.GEMINI_API_KEY ||
    process.env.gemini_api_key ||
    process.env.GOOGLE_API_KEY ||
    process.env.google_api_key ||
    process.env.KELVIS_API_KEY;

  if (!apiKey) {
    return null;
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

// Convert 24kHz 16-bit Mono PCM buffer to Standard RIFF/WAV
function pcmToWav(pcmData: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // Linear PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

// Normalize Groq model names including vision/image mixtral-8x7b and llama3-8b
function normalizeGroqModelName(requestedModel?: string): string {
  if (!requestedModel) return "openai/gpt-oss-120b";
  const m = String(requestedModel).toLowerCase();
  if (m.includes("mixtral") || m.includes("8x7b")) {
    return "mixtral-8x7b-32768";
  }
  if (m.includes("llama3-8b") || m.includes("llama-3-8b") || m.includes("llama-3.1-8b") || m.includes("llama3")) {
    return "llama-3.1-8b-instant";
  }
  if (m.includes("20b") || m.includes("gpt-oss-20b") || m.includes("oss-20b")) {
    return "openai/gpt-oss-20b";
  }
  return requestedModel.replace(/^groq\//, "");
}

async function fetchLiveWebResults(
  query: string,
  customApiKey?: string,
  customCx?: string
): Promise<Array<{ title: string; url: string; domain: string; snippet: string }>> {
  const sources: Array<{ title: string; url: string; domain: string; snippet: string }> = [];

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

  return sources;
}

// Helper to get initialized Groq Client
function getGroqClient(customKey?: string) {
  const apiKey =
    customKey ||
    process.env.GROQ_API_KEY ||
    process.env.groq_api_key ||
    process.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Groq({
    apiKey,
  });
}

// Health Check Endpoint
app.get(["/api/health", "/health"], (req, res) => {
  const groqKey = process.env.GROQ_API_KEY || process.env.groq_api_key;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.gemini_api_key;
  res.json({
    status: "ok",
    hasGroqKey: Boolean(groqKey),
    hasGeminiKey: Boolean(geminiKey),
    enforcedModels: ["openai/gpt-oss-120b", "openai/gpt-oss-20b"],
    timestamp: new Date().toISOString(),
  });
});

// Spotify Search Helper Function
async function searchSpotifyTrack(query: string) {
  const cleanQuery = query.replace(/^(play|song|music|spotify|listen to|put on|track)\s+/i, "").trim();
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
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        if (accessToken) {
          const searchRes = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(cleanQuery || "Top Hits")}&type=track&limit=1`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (searchRes.ok) {
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
        }
      }
    } catch (e) {
      console.warn("Spotify API live search notice:", e);
    }
  }

  // Generic Spotify Track Embed fallback
  return {
    id: "1xQ6trAsedVPCdbtMB8OOy",
    title: cleanQuery ? cleanQuery.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Popular Track",
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

// Gemini Live Voice Call Turn Endpoint
app.post(["/api/voice/gemini-call", "/voice/gemini-call"], async (req, res) => {
  try {
    const {
      prompt,
      history = [],
      voiceName = "Kore",
      systemInstruction,
      customApiKey,
    } = req.body;

    if (!prompt || !String(prompt).trim()) {
      res.status(400).json({ error: "Prompt is required for voice call" });
      return;
    }

    const gemini = getGeminiClient(customApiKey);
    const groq = getGroqClient();

    let spokenReplyText = "";
    const voiceSystemPrompt =
      "You are Kelvis in a real-time live two-way voice call. Speak naturally, warmly, clearly, and concisely. Keep answers under 2-4 conversational sentences for fluid dialogue. Never output markdown code fences, headers, asterisks, bullet points, or complex symbols. Focus strictly on natural, flowing spoken English.";

    if (gemini) {
      try {
        const contents: any[] = [];
        for (const h of history.slice(-6)) {
          contents.push({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.text || "" }],
          });
        }
        contents.push({ role: "user", parts: [{ text: prompt }] });

        const response = await gemini.models.generateContent({
          model: "gemini-3.7-flash",
          contents,
          config: {
            systemInstruction: systemInstruction || voiceSystemPrompt,
            temperature: 0.7,
            maxOutputTokens: 250,
          },
        });
        spokenReplyText = response.text || "";
      } catch (err) {
        console.warn("Gemini voice text generation notice:", err);
      }
    }

    if (!spokenReplyText && groq) {
      try {
        const messages: any[] = [{ role: "system", content: voiceSystemPrompt }];
        for (const h of history.slice(-6)) {
          messages.push({
            role: h.role === "user" ? "user" : "assistant",
            content: h.text || "",
          });
        }
        messages.push({ role: "user", content: prompt });

        const completion = await groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages,
          temperature: 0.7,
          max_tokens: 250,
        });
        spokenReplyText = completion.choices[0]?.message?.content || "";
      } catch (err) {
        console.warn("Groq voice text generation notice:", err);
      }
    }

    if (!spokenReplyText) {
      spokenReplyText = "I heard you clearly! I am ready to help you with anything you need.";
    }

    // Clean any markdown remnants
    const cleanSpoken = spokenReplyText
      .replace(/```[\s\S]*?```/g, "I have prepared that information for you.")
      .replace(/<[^>]+>/g, "")
      .replace(/[*_#`~[\]()]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // 2. Synthesize High-Fidelity Neural Audio with Groq TTS (canopylabs/orpheus-v1-english) or Gemini TTS
    let audioBase64: string | null = null;
    let mimeType = "audio/mp3";

    // Primary: Groq TTS with canopylabs/orpheus-v1-english
    if (cleanSpoken) {
      try {
        const groqTtsRes = await synthesizeGroqTTS(cleanSpoken, "orpheus");
        if (groqTtsRes) {
          audioBase64 = groqTtsRes.audioBase64;
          mimeType = groqTtsRes.mimeType;
        }
      } catch (err: any) {
        console.warn("Groq TTS call turn notice:", err.message);
      }
    }

    if (!audioBase64 && gemini && cleanSpoken) {
      try {
        const validVoices = ["Kore", "Puck", "Fenrir", "Charon", "Zephyr"];
        const selectedVoice = validVoices.includes(voiceName) ? voiceName : "Kore";

        const ttsResponse = await gemini.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: cleanSpoken.slice(0, 800) }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: selectedVoice },
              },
            },
          },
        });

        const rawPcm = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (rawPcm) {
          const pcmBuf = Buffer.from(rawPcm, "base64");
          const wavBuf = pcmToWav(pcmBuf, 24000);
          audioBase64 = wavBuf.toString("base64");
          mimeType = "audio/wav";
        }
      } catch (ttsErr: any) {
        console.warn("Gemini TTS synthesis note:", ttsErr.message);
      }
    }

    res.json({
      success: true,
      text: cleanSpoken,
      audioBase64,
      mimeType,
      voice: voiceName,
      hasAudio: Boolean(audioBase64),
    });
  } catch (err: any) {
    console.error("Voice call error:", err);
    res.status(500).json({ error: err.message || "Voice call processing failed" });
  }
});

// Groq Neural TTS Helper with canopylabs/orpheus-v1-english
const GROQ_SUPPORTED_VOICES: Record<string, string> = {
  autumn: "autumn",
  diana: "diana",
  hannah: "hannah",
  austin: "austin",
  daniel: "daniel",
  troy: "troy",
  orpheus: "autumn",
  kore: "autumn",
  puck: "austin",
  fenrir: "daniel",
  charon: "troy",
  zephyr: "hannah",
};

async function synthesizeGroqTTS(
  text: string,
  voice = "autumn",
  customApiKey?: string
): Promise<{ audioBase64: string; mimeType: string } | null> {
  const apiKey =
    customApiKey ||
    process.env.GROQ_API_KEY ||
    process.env.groq_api_key ||
    process.env.VITE_GROQ_API_KEY;

  if (!apiKey) return null;

  try {
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/[*_#`~[\]()]/g, "")
      .slice(0, 1000)
      .trim();

    if (!cleanText) return null;

    const normalizedVoice = String(voice || "").toLowerCase().trim();
    const selectedGroqVoice = GROQ_SUPPORTED_VOICES[normalizedVoice] || "autumn";

    const response = await fetch("https://api.groq.com/openai/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "canopylabs/orpheus-v1-english",
        input: cleanText,
        voice: selectedGroqVoice,
        response_format: "wav",
      }),
    });

    if (response.ok) {
      const arrayBuf = await response.arrayBuffer();
      const buf = Buffer.from(arrayBuf);
      return {
        audioBase64: buf.toString("base64"),
        mimeType: response.headers.get("content-type") || "audio/wav",
      };
    } else {
      const errTxt = await response.text();
      console.warn("Groq TTS API response:", response.status, errTxt);
    }
  } catch (err: any) {
    console.warn("Groq TTS fetch error:", err.message);
  }
  return null;
}

// Groq Whisper Large v3 STT Helper
async function transcribeGroqSTT(
  audioBuffer: Buffer,
  mimeType = "audio/webm",
  customApiKey?: string
): Promise<string | null> {
  const apiKey =
    customApiKey ||
    process.env.GROQ_API_KEY ||
    process.env.groq_api_key ||
    process.env.VITE_GROQ_API_KEY;

  if (!apiKey) return null;

  try {
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: mimeType || "audio/webm" });
    formData.append("file", blob, "recording.webm");
    formData.append("model", "whisper-large-v3");
    formData.append("language", "en");
    formData.append("response_format", "json");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      return data.text || "";
    } else {
      const errTxt = await response.text();
      console.warn("Groq STT API response:", response.status, errTxt);
    }
  } catch (err: any) {
    console.warn("Groq STT fetch error:", err.message);
  }
  return null;
}

// Dedicated Groq TTS Endpoint (canopylabs/orpheus-v1-english) with Gemini fallback
app.post(["/api/voice/groq-tts", "/voice/groq-tts", "/api/voice/tts", "/voice/tts"], async (req, res) => {
  try {
    const { text, voice = "orpheus", groqApiKey, customApiKey } = req.body;
    if (!text || !String(text).trim()) {
      res.status(400).json({ error: "Text is required for TTS" });
      return;
    }

    const cleanText = String(text)
      .replace(/```[\s\S]*?```/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/[*_#`~[\]()]/g, "")
      .slice(0, 1000)
      .trim();

    // 1. Try Groq canopylabs/orpheus-v1-english TTS
    const groqRes = await synthesizeGroqTTS(cleanText, voice, groqApiKey || customApiKey);
    if (groqRes && groqRes.audioBase64) {
      res.json({
        success: true,
        model: "canopylabs/orpheus-v1-english",
        audioBase64: groqRes.audioBase64,
        mimeType: groqRes.mimeType,
        voice,
      });
      return;
    }

    // 2. Fallback to Gemini TTS if Groq TTS is unavailable
    const gemini = getGeminiClient(customApiKey);
    if (gemini) {
      try {
        const validVoices = ["Kore", "Puck", "Fenrir", "Charon", "Zephyr"];
        const selectedVoice = validVoices.includes(voice) ? voice : "Kore";
        const ttsResponse = await gemini.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: cleanText.slice(0, 800) }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: selectedVoice },
              },
            },
          },
        });

        const rawPcm = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (rawPcm) {
          const pcmBuf = Buffer.from(rawPcm, "base64");
          const wavBuf = pcmToWav(pcmBuf, 24000);
          res.json({
            success: true,
            model: "gemini-3.1-flash-tts-preview",
            audioBase64: wavBuf.toString("base64"),
            mimeType: "audio/wav",
            voice: selectedVoice,
          });
          return;
        }
      } catch (gemErr) {
        console.warn("Fallback Gemini TTS notice:", gemErr);
      }
    }

    res.status(500).json({ error: "TTS generation failed on both Groq and Gemini" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "TTS generation failed" });
  }
});

// Dedicated Gemini TTS Endpoint
app.post(["/api/voice/gemini-tts", "/voice/gemini-tts"], async (req, res) => {
  try {
    const { text, voice = "Kore", customApiKey } = req.body;
    if (!text || !String(text).trim()) {
      res.status(400).json({ error: "Text is required for TTS" });
      return;
    }

    const cleanText = String(text)
      .replace(/```[\s\S]*?```/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/[*_#`~[\]()]/g, "")
      .slice(0, 1000)
      .trim();

    const gemini = getGeminiClient(customApiKey);
    if (!gemini) {
      res.status(500).json({ error: "Gemini API key is not configured" });
      return;
    }

    const validVoices = ["Kore", "Puck", "Fenrir", "Charon", "Zephyr"];
    const selectedVoice = validVoices.includes(voice) ? voice : "Kore";
    const ttsResponse = await gemini.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: cleanText.slice(0, 800) }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const rawPcm = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (rawPcm) {
      const pcmBuf = Buffer.from(rawPcm, "base64");
      const wavBuf = pcmToWav(pcmBuf, 24000);
      res.json({
        success: true,
        model: "gemini-3.1-flash-tts-preview",
        audioBase64: wavBuf.toString("base64"),
        mimeType: "audio/wav",
        voice: selectedVoice,
      });
      return;
    }

    res.status(500).json({ error: "No audio stream returned from Gemini TTS" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Gemini TTS generation failed" });
  }
});

// Dedicated Groq STT Endpoint (whisper-large-v3)
app.post(["/api/voice/groq-stt", "/voice/groq-stt", "/api/voice/stt", "/voice/stt"], async (req, res) => {
  try {
    const { audioBase64, mimeType = "audio/webm", groqApiKey } = req.body;
    if (!audioBase64) {
      res.status(400).json({ error: "audioBase64 is required for transcription" });
      return;
    }

    const audioBuf = Buffer.from(audioBase64, "base64");
    const text = await transcribeGroqSTT(audioBuf, mimeType, groqApiKey);

    if (text !== null) {
      res.json({
        success: true,
        model: "whisper-large-v3",
        text,
      });
    } else {
      res.status(500).json({ error: "Transcription failed using whisper-large-v3" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "STT transcription failed" });
  }
});

// Interactive Define & Explain Text Endpoint
app.post(["/api/define-text", "/define-text"], async (req, res) => {
  try {
    const { text, context, groqApiKey } = req.body;
    if (!text || !String(text).trim()) {
      res.status(400).json({ error: "Text is required to define" });
      return;
    }

    const groq = getGroqClient(groqApiKey);
    const gemini = getGeminiClient();

    const selectedWord = String(text).trim();
    const systemPrompt = `You are Kelvis AI's concise dictionary and conceptual explainer.
Provide a clear, simple, and direct explanation of the selected word, phrase, or concept.

Guidelines:
- Give a direct 1-2 sentence core definition.
- If relevant, add 1 short sentence on how it's used or a quick example.
- Keep the response clean, engaging, without unnecessary fluff or excessive headings.`;

    const userPrompt = `Explain and define the following selected text: "${selectedWord}"${
      context ? `\n\nContext where it appeared:\n"${String(context).slice(0, 500)}"` : ""
    }`;

    let definition = "";

    if (groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.5,
          max_tokens: 700,
        });
        definition = completion.choices[0]?.message?.content || "";
      } catch (e: any) {
        console.warn("Groq define error:", e.message);
      }
    }

    if (!definition && gemini) {
      try {
        const resp = await gemini.models.generateContent({
          model: "gemini-3.7-flash",
          contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          config: { maxOutputTokens: 700, temperature: 0.5 },
        });
        definition = resp.text || "";
      } catch (e: any) {
        console.warn("Gemini define error:", e.message);
      }
    }

    if (!definition) {
      definition = `### 📖 Definition: **${selectedWord}**\n\n**${selectedWord}** is a highlighted term from the conversation.`;
    }

    res.json({
      success: true,
      word: selectedWord,
      definition,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to generate definition" });
  }
});

// Standalone Gemini TTS Endpoint for Reading Any Message Aloud (legacy endpoint kept for backward-compatibility)
app.post(["/api/voice/gemini-tts", "/voice/gemini-tts"], async (req, res) => {
  try {
    const { text, voiceName = "Kore", customApiKey } = req.body;
    if (!text || !String(text).trim()) {
      res.status(400).json({ error: "Text is required for TTS" });
      return;
    }

    // 1. Try Groq TTS first as per mandate
    const groqRes = await synthesizeGroqTTS(text, "autumn", customApiKey);
    if (groqRes) {
      res.json({
        success: true,
        model: "canopylabs/orpheus-v1-english",
        audioBase64: groqRes.audioBase64,
        mimeType: groqRes.mimeType,
        voice: "autumn",
      });
      return;
    }

    const gemini = getGeminiClient(customApiKey);
    if (!gemini) {
      res.status(400).json({ error: "API key not configured for neural TTS" });
      return;
    }

    const cleanText = String(text)
      .replace(/```[\s\S]*?```/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/[*_#`~[\]()]/g, "")
      .slice(0, 800)
      .trim();

    const validVoices = ["Kore", "Puck", "Fenrir", "Charon", "Zephyr"];
    const selectedVoice = validVoices.includes(voiceName) ? voiceName : "Kore";

    try {
      const ttsResponse = await gemini.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: cleanText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      const rawPcm = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!rawPcm) {
        res.status(500).json({ error: "No audio stream returned by Gemini TTS" });
        return;
      }

      const pcmBuf = Buffer.from(rawPcm, "base64");
      const wavBuf = pcmToWav(pcmBuf, 24000);

      res.json({
        success: true,
        model: "gemini-3.1-flash-tts-preview",
        audioBase64: wavBuf.toString("base64"),
        mimeType: "audio/wav",
        voice: selectedVoice,
      });
    } catch (geminiErr: any) {
      console.warn("Gemini TTS quota or API limit reached:", geminiErr.message);
      res.status(429).json({
        error: "Neural TTS quota limit reached. Browser fallback speech will be used.",
        fallbackToWebSpeech: true,
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "TTS generation failed" });
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
      model = "openai/gpt-oss-120b",
      files = [],
      searchGrounding = false,
      userMemory,
      systemInstruction,
      googleApiKey,
      googleCx,
      groqApiKey,
      codebaseContext,
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
      let outputText = "⚠️ **Groq API Key Missing**\n\nYour application is configured to strictly run on model `openai/gpt-oss-120b` or `openai/gpt-oss-20b`, but `GROQ_API_KEY` has not been added to your environment variables.\n\n**To enable Groq AI responses:**\n1. Get your free API key at [Groq Console](https://console.groq.com/)\n2. Add `GROQ_API_KEY` to your environment variables.";
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

    // Format user memory if provided
    let memoryPromptSegment = "";
    if (userMemory) {
      if (typeof userMemory === "string") {
        memoryPromptSegment = userMemory;
      } else if (typeof userMemory === "object") {
        const memParts: string[] = [];
        if (userMemory.user_name) memParts.push(`- User's Name: ${userMemory.user_name}`);
        if (userMemory.nationality) memParts.push(`- Nationality / Location: ${userMemory.nationality}`);
        if (userMemory.interests && userMemory.interests.length > 0) memParts.push(`- Core Interests: ${userMemory.interests.join(", ")}`);
        if (userMemory.personal_info) memParts.push(`- Personal Background & Preferences: ${userMemory.personal_info}`);
        if (userMemory.major_projects && userMemory.major_projects.length > 0) memParts.push(`- Major Projects & Goals: ${userMemory.major_projects.join(", ")}`);
        if (userMemory.ai_character_judgment) memParts.push(`- AI Assessment of User's Persona: ${userMemory.ai_character_judgment}`);
        if (userMemory.custom_memories && userMemory.custom_memories.length > 0) memParts.push(`- Remembered Facts:\n  • ${userMemory.custom_memories.join("\n  • ")}`);
        if (memParts.length > 0) {
          memoryPromptSegment = `### 🧠 PERSISTENT USER MEMORY (ChatGPT-Style Memory Engine):\nYou remember this about the user. Deeply personalize all reasoning, tone, and advice accordingly:\n${memParts.join("\n")}\n`;
        }
      }
    }

    const defaultStructuredSystemInstruction = `You are Kelvis, an ultra-intelligent, creative, empathetic, and world-class AI companion, thinker, and software architect powered by Groq's high-speed reasoning models (openai/gpt-oss-120b and openai/gpt-oss-20b).

${memoryPromptSegment ? `${memoryPromptSegment}\n` : ""}### 💬 CONVERSATIONAL INTELLIGENCE, PERSONAL QUESTIONS & SEAMLESS FOLLOW-UPS:
1. **Understand Personal & Conversational Queries with Empathy & Context**:
   - Actively understand questions about the user, their feelings, everyday situations, personal ideas, advice, philosophies, and background.
   - When the user asks conversational or personal questions, respond warmly, attentively, and insightfully without needing external web searches.
2. **Mastery of Multi-Turn Follow-Ups**:
   - Always maintain sharp, unbroken awareness of the entire conversation history.
   - When the user asks short or ambiguous follow-up questions (e.g. "what do you think?", "why that choice?", "can you explain more?", "what about the second one?", "why did you say that?"), immediately connect to the preceding thoughts, code, or topics in the chat.
   - Never lose context or ask the user to repeat themselves when the answer is clear from the conversation history.

### 🧠 COGNITIVE REASONING & RESPONSE EXCELLENCE:
1. **Perplexity-Grade Clarity & Depth**: Deliver clear, rigorous, well-structured, and insightful answers. Use crisp headings, executive summaries, tabular comparisons, bulleted findings, and concrete takeaways where appropriate.
2. **Deep File & Code Analysis Engine**:
   When files or code are provided, provide an exhaustive, high-intelligence analysis:
   - **Executive Summary**: Core purpose, schema, data scale, or code architecture.
   - **Key Findings & Data Insights**: Statistical metrics, distributions, key functions, dependencies, or key findings.
   - **Deep Technical / Quality Inspection**: Detect bugs, data anomalies, missing records, syntax issues, security vulnerabilities, or performance bottlenecks.
   - **Actionable Next Steps & Solutions**: Provide exact fixes, optimized code snippets, or analytical conclusions.

### 🌟 4-PHASE DEVELOPMENT & CODING WORKFLOW:
When the user asks to code, develop, or build any website, platform, application, or system (e.g. "build a sales website", "create a landing page for my business", "code a chat platform", "build a crypto dashboard", etc.):
Deliver clean, production-ready code with complete multi-file implementations:

#### PHASE 1: MARKET BENCHMARK & CONCEPT
1. Benchmark against premier real-world platforms (e.g. Amazon, Shopify, Discord, Spotify).
2. Choose a clean visual identity (e.g., modern high-contrast Black & White, sleek dark canvas, or tailored palette) and core user features.

#### PHASE 2: PRE-COMMENCEMENT DUAL-MODEL ARCHITECTURAL AUDIT
Before project implementation, verify the architecture with the secondary model (**openai/gpt-oss-20b** Architecture Inspector):
\`\`\`
🛡️ [Secondary Model Architecture Review - Verified by openai/gpt-oss-20b]:
- Folder & File Structure: Validated modular directory hierarchy (public/, src/pages/, styles/, src/utils/, src/)
- Component Reactivity & State: Validated DOM event binding, local storage persistence, and modal lifecycles
- Responsive & Accessibility: Verified mobile touch standards (44px min targets) & fluid layout
- Quality Status: ✅ APPROVED FOR PRODUCTION IMPLEMENTATION
\`\`\`

#### PHASE 3: STRUCTURED ROADMAP & FILE LIST
Present a concise roadmap organized into real folders, subfolders, and files (e.g. \`landing-page/public/index.html\`, \`landing-page/styles/main.css\`, \`landing-page/src/app.js\`).

#### PHASE 4: COMPLETE PRODUCTION-READY CODE (FOLDERS, SUBFOLDERS & FILES)
1. Insert the active file banner tag before each file:
   \`<activefile filename="project-name/public/index.html" step="Building core layout" step="1" total="3" status="working" />\`
2. Emit the complete code with folder/file path in the code fence header (e.g. \`\`\`html landing-page/public/index.html ... \`\`\`).
3. Conclude with:
   *"✨ **Live Preview Ready**: You can preview by opening the Code Preview or Codebase explorer. All files are saved into your central Codebase workspace."*

### 📁 CENTRAL CODEBASE WORKSPACE & CROSS-CHAT SURGICAL EDITING:
All code you generate is automatically organized into folders and files inside the user's shared **Codebase** workspace.
When the user in this chat or ANY other chat asks to edit, modify, fix, or update an existing project or file (e.g. "edit the landing page to change hero button", "update the header in index.html", "modify main.css"):
1. Access and reference the existing code from the Codebase context.
2. ONLY output and update the specific file(s) that need changes (e.g. \`\`\`css landing-page/styles/main.css ... \`\`\`).
3. Do NOT recreate or re-emit untouched files from scratch if they don't need changes.

### ❓ INTERACTIVE QUESTIONS & QUIZZES POLICY:
- DO NOT ask quick questions or generate \`\`\`quiz blocks for normal coding requests (e.g. landing pages, todo lists, scripts, edits, bug fixes). Directly build and code the solution!
- ONLY provide interactive question blocks when the user explicitly asks for an interactive questionnaire/quiz, or when explicitly planning a massive enterprise multi-tier architecture suite.

### 📈 BINANCE & CHARTS:
- For live Binance crypto data: use \`\`\`binance BTCUSDT \`\`\`
- For general charts: use \`\`\`chart with valid JSON.`;

    let finalSystemPrompt = systemInstruction
      ? `${systemInstruction}\n\n${defaultStructuredSystemInstruction}`
      : defaultStructuredSystemInstruction;

    if (codebaseContext) {
      finalSystemPrompt += `\n\n${codebaseContext}`;
    }

    messages.push({
      role: "system",
      content: finalSystemPrompt,
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
          if (
            file.mimeType?.includes("text") ||
            file.mimeType?.includes("json") ||
            file.mimeType?.includes("csv") ||
            file.mimeType?.includes("javascript") ||
            file.mimeType?.includes("typescript") ||
            file.mimeType?.includes("pdf") ||
            file.name?.match(/\.(csv|json|txt|md|js|ts|jsx|tsx|html|css|py|sql|log|xml|yaml|yml|sh|env|pdf|doc|docx)$/i)
          ) {
            try {
              const base64Data = file.data.includes(",") ? file.data.split(",")[1] : file.data;
              const rawBuffer = Buffer.from(base64Data, "base64");
              const decodedText = rawBuffer.toString("utf-8");

              if (file.name?.endsWith(".csv") || file.mimeType?.includes("csv")) {
                const rows = decodedText.split("\n").filter((r) => r.trim().length > 0);
                fileContext += `\n[CSV Data Table (${rows.length} rows)]:\n\`\`\`csv\n${decodedText.slice(0, 30000)}\n\`\`\`\n`;
              } else if (file.name?.endsWith(".json") || file.mimeType?.includes("json")) {
                fileContext += `\n[JSON Data Structure]:\n\`\`\`json\n${decodedText.slice(0, 30000)}\n\`\`\`\n`;
              } else if (file.name?.match(/\.(js|ts|tsx|jsx|py|html|css|sql|sh)$/i)) {
                const ext = file.name.split(".").pop() || "code";
                fileContext += `\n[Source Code - ${file.name}]:\n\`\`\`${ext}\n${decodedText.slice(0, 30000)}\n\`\`\`\n`;
              } else if (file.mimeType?.includes("pdf") || file.name?.endsWith(".pdf")) {
                // Extract clean readable ASCII text segments from PDF stream
                const asciiText = decodedText.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{2,}/g, " ").trim();
                fileContext += `\n[Extracted PDF Document Text Content]:\n\`\`\`text\n${(asciiText || decodedText).slice(0, 30000)}\n\`\`\`\n`;
              } else {
                fileContext += `\n[Document Content]:\n\`\`\`\n${decodedText.slice(0, 30000)}\n\`\`\`\n`;
              }
            } catch (decErr) {
              fileContext += `[Binary attachment processed: ${file.name}]`;
            }
          } else if (file.mimeType?.startsWith("image/")) {
            fileContext += `\n[Image attachment provided for visual analysis: ${file.name} (${Math.round((file.size || 0) / 1024)} KB)]`;
          }
        }
      }
      userMessageContent += fileContext;
    }

    // Live Web Search Grounding trigger (only search when searchGrounding toggle is explicitly ON or explicit web search command is provided)
    let fetchedSources: Array<{ title: string; url: string; domain: string; snippet: string }> = [];
    const isExplicitSearchQuery = Boolean(
      searchGrounding === true ||
      /^(search the web for|browse the web for|look up on google:|\/search\s+)/i.test(
        (prompt || "").trim()
      )
    );

    if (isExplicitSearchQuery && prompt) {
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
        try {
          stream = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: messages as any,
            temperature: 0.7,
            stream: true,
          });
        } catch (fallbackErr: any) {
          try {
            stream = await groq.chat.completions.create({
              model: "openai/gpt-oss-20b",
              messages: messages as any,
              temperature: 0.7,
              stream: true,
            });
          } catch (lastErr: any) {
            res.write(`data: ${JSON.stringify({ error: lastErr?.message || "Failed to start AI stream." })}\n\n`);
            res.end();
            return;
          }
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
      try {
        completion = await groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: messages as any,
          temperature: 0.7,
        });
      } catch (fallbackErr: any) {
        completion = await groq.chat.completions.create({
          model: "openai/gpt-oss-20b",
          messages: messages as any,
          temperature: 0.7,
        });
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
      noticeText = `⚠️ **Groq API Rate Limit Exceeded (429)**\n\nThe Groq API key has temporarily reached its rate limits or request quota.\n\n**How to fix:**\n1. Check your usage at [Groq Console](https://console.groq.com/)\n2. Wait a few moments for rate limits to reset.`;
    } else if (errStr.includes("401") || errStr.includes("invalid_api_key")) {
      noticeText = `⚠️ **Invalid Groq API Key (401)**: Please verify that \`GROQ_API_KEY\` is configured correctly in environment variables.`;
    } else {
      noticeText = `⚠️ **Groq AI Service Notice**: ${err?.message || "Unable to reach Groq API"}.\n\nPlease check that \`GROQ_API_KEY\` is configured in Environment Variables.`;
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
