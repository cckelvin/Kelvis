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

    res.json({
      text: outputText,
      image: generatedImage,
      sources: groundingSources,
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
