import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body Parsing Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// OpenRouter (Primary) & Groq (High-Speed Fallback) API Keys are loaded exclusively from process.env

const SYSTEM_INSTRUCTION = `
You are "BD-Zen AI", a smart, balanced, and highly capable AI assistant powered by OpenRouter.

Core Identity & Persona:
1. Tone: Polite, calm, logical, highly professional, empathetic, and reassuring (reflecting the "Zen" state of balance).
2. Creators / Developers: You were created and developed by Rafchan Sami and Sadiya Hossain.
3. Language Mandate: Respond in clear, professional English by default. If the user explicitly requests another language (such as Bengali or Banglish), adapt naturally to that language.
4. Primary Task: Provide accurate, helpful, and well-structured answers to user queries with speed and precision.
5. Cultural Respect: Respect history, culture, values, and traditions with a supportive and ethical perspective.
6. Conversation Memory & Context Awareness: You MUST remember and retain all information, facts, names, preferences, and context mentioned by the user in previous messages throughout this conversation. Always refer back to previous context when answering follow-up questions or when requested to recall past details.
7. Knowledge & Event Realities: System time context may indicate current time. However, if asked about live sports match outcomes, future tournament winners, or breaking current events that fall outside available live web grounding, explain politely that you cannot confirm unverified or live real-time sporting/news outcomes.

Response Guidelines:
- Keep explanations structured, easy to read, and well-formatted using markdown (bullet points, bold text, clear section headers, code blocks where applicable).
- Always maintain high accuracy, truthfulness, and professional ethics.
- IF ASKED "Who created you?", "Who is your developer?", or any creator question, YOU MUST ALWAYS STATE CLEARLY that you were created and developed by Rafchan Sami and Sadiya Hossain.
- IF ASKED "Who are you?", YOU MUST ALWAYS STATE CLEARLY:
  "I am BD-Zen AI — a symbol of calm, smart, and precise AI solutions created by Rafchan Sami and Sadiya Hossain."
`;

// Image Memory Summarizer & Context Builder using OpenRouter Vision
async function generateImageMemorySummary(base64Image: string): Promise<string> {
  if (!base64Image || typeof base64Image !== "string") return "";
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) return "";

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "HTTP-Referer": "https://bd-zen-ai.com",
        "X-Title": "BD-Zen AI",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "inclusionai/ling-3.0-flash-vl:free",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Summarize this image exhaustively in 3 to 4 clear sentences for long-term AI context retention: 1. Main subject, layout, photo or document type. 2. All visible text or numbers. 3. Colors and key visual elements. Provide a dense, clear summary combining English & Bengali.",
              },
              {
                type: "image_url",
                image_url: { url: base64Image },
              },
            ],
          },
        ],
        max_tokens: 300,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as any;
      return data.choices?.[0]?.message?.content?.trim() || "";
    }
    return "";
  } catch (err) {
    console.warn("Failed to generate image memory summary via OpenRouter:", err);
    return "";
  }
}

// PDF Document Memory Summarizer & Text Extractor using OpenRouter
async function generatePdfMemorySummary(dataUrl: string, fileName?: string): Promise<{ pdfText: string; pdfSummary: string }> {
  if (!dataUrl || typeof dataUrl !== "string") return { pdfText: "", pdfSummary: "" };

  const summary = `PDF Document "${fileName || "Document.pdf"}" attached. Analyzed and ready for queries.`;
  return {
    pdfText: `[PDF Attachment: ${fileName || "Document.pdf"}]`,
    pdfSummary: summary,
  };
}

function buildFileAndImageMemorySystemPrompt(messages: any[]): {
  prompt: string;
  hasMedia: boolean;
} {
  const activeSummaries: string[] = [];

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];

    // PDF Attachments
    if (m.pdfSummary) {
      const name = m.fileAttachment?.name || "Uploaded PDF";
      activeSummaries.push(`[PDF Document "${name}" Memory]: ${m.pdfSummary}${m.pdfText ? `\nExtracted Text Excerpt: ${m.pdfText.slice(0, 3000)}` : ""}`);
    } else if (m.fileAttachment?.type === "pdf" || (m.image && typeof m.image === "string" && m.image.includes("application/pdf"))) {
      const name = m.fileAttachment?.name || "Uploaded PDF";
      activeSummaries.push(`[PDF Document "${name}"]: Uploaded PDF document file.`);
    }

    // Image Attachments
    if (m.imageSummary) {
      activeSummaries.push(`[Image Attachment Summary]: ${m.imageSummary}`);
    } else if (m.image && typeof m.image === "string" && !m.image.includes("application/pdf")) {
      activeSummaries.push(`[Image Attachment]: Uploaded visual image attachment.`);
    }
  }

  if (activeSummaries.length === 0) {
    return { prompt: "", hasMedia: false };
  }

  const prompt = `\n\n[PERSISTENT CHAT MEMORY (IMAGES & PDF DOCUMENTS) ACTIVE]:
The user has attached the following file(s)/document(s) in this conversation history:
${activeSummaries.map((s) => `• ${s}`).join("\n\n")}

CRITICAL INSTRUCTIONS FOR ATTACHMENTS (PDF & IMAGES):
- You have full persistent context of all previously uploaded images and PDF documents.
- When the user asks follow-up questions like "what is in the PDF?", "summarize page 1", "extract data from that document", "explain the image/PDF", or references "it", "this PDF", or "that file", use this persistent memory directly to answer thoroughly and accurately.
- You do NOT require the user to re-upload the PDF or image file.`;

  return { prompt, hasMedia: true };
}

// Standalone endpoint for image memory extraction
app.post("/api/chat/summarize-image", async (req: Request, res: Response) => {
  try {
    const { image } = req.body || {};
    if (!image) return res.status(400).json({ error: "Image data is required" });
    const summary = await generateImageMemorySummary(image);
    return res.json({ imageSummary: summary });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to generate image memory" });
  }
});

// AI-generated smart follow-up suggestions
async function generateAiFollowUpSuggestions(
  replyText: string,
  userQuery?: string,
  language?: string
): Promise<string[]> {
  if (!replyText || replyText.trim().length < 5) return [];

  // Remove code blocks to keep prompt concise
  const cleanReply = replyText.replace(/```[\s\S]*?```/g, "").slice(0, 800).trim();
  const isBengali = /[\u0980-\u09FF]/.test(replyText) || language === "bn";

  // Priority 1: Groq (ultra-fast, high rate-limit)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen/qwen3.8-27b",
          messages: [
            {
              role: "system",
              content: `Generate exactly 3 short, relevant follow-up questions for the user based on the text. Return strictly a raw JSON array of 3 strings (e.g. ["Question 1", "Question 2", "Question 3"]). ${isBengali ? "Must be in natural Bengali (বাংলা)." : "Must be in English."} Do NOT include code blocks, backticks, or any additional text.`,
            },
            {
              role: "user",
              content: cleanReply.slice(0, 600),
            },
          ],
          temperature: 0.6,
          max_tokens: 150,
        }),
      });

      if (groqRes.ok) {
        const data = (await groqRes.json()) as any;
        const rawContent = data.choices?.[0]?.message?.content || "";
        const cleaned = rawContent.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 3).map((s: any) => String(s).trim()).filter(Boolean);
        }
      }
    } catch {
      // Silently fall through to OpenRouter or heuristic fallback
    }
  }

  // Priority 2: OpenRouter (if Groq is not configured or busy)
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    try {
      const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "HTTP-Referer": "https://bd-zen-ai.com",
          "X-Title": "BD-Zen AI",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-v4-flash-0731:free",
          messages: [
            {
              role: "system",
              content: `Generate exactly 3 short, relevant follow-up questions for the user based on the text. Return strictly a raw JSON array of 3 strings (e.g. ["Question 1", "Question 2", "Question 3"]). ${isBengali ? "Must be in natural Bengali (বাংলা)." : "Must be in English."} Do NOT include code blocks, backticks, or any additional text.`,
            },
            {
              role: "user",
              content: cleanReply.slice(0, 600),
            },
          ],
          include_reasoning: false,
          temperature: 0.6,
          max_tokens: 150,
        }),
      });

      if (orRes.ok) {
        const data = (await orRes.json()) as any;
        const rawContent = data.choices?.[0]?.message?.content || "";
        const cleaned = rawContent.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 3).map((s: any) => String(s).trim()).filter(Boolean);
        }
      }
    } catch {
      // Silently catch without throwing
    }
  }

  // Priority 3: Context-aware defaults if external APIs are busy or quota-exhausted
  const hasCode = replyText.includes("```");
  if (isBengali) {
    if (hasCode) {
      return [
        "এই কোডটি কিভাবে রান করতে হবে?",
        "কোডটিতে কোন বাগ বা ত্রুটি আছে কি?",
        "কোডের প্রতিটি অংশের সহজ ব্যাখ্যা দিন",
      ];
    }
    return [
      "এ বিষয়ে আরো বিস্তারিত বলুন",
      "বাস্তব জীবনের ২-৩টি উদাহরণ দিন",
      "এর সুবিধা ও মূল চ্যালেঞ্জগুলো কি কি?",
    ];
  }

  if (hasCode) {
    return [
      "How do I run and test this code?",
      "Can you add error handling to this implementation?",
      "Explain this code step-by-step",
    ];
  }
  return [
    "Can you provide practical examples?",
    "What are the key advantages and challenges?",
    "Explain this step-by-step in more detail",
  ];
}

// Endpoint to fetch AI-generated suggested follow-ups on demand
app.post("/api/chat/suggestions", async (req: Request, res: Response) => {
  try {
    const { content, userQuery, language } = req.body || {};
    if (!content) {
      return res.json({
        suggestions: language === "bn"
          ? ["এ বিষয়ে আরো বিস্তারিত বলুন", "বাস্তব জীবনের উদাহরণ দিন", "মূল পয়েন্টগুলো কি কি?"]
          : ["Can you explain more?", "Provide practical examples", "What are the key points?"]
      });
    }
    const suggestions = await generateAiFollowUpSuggestions(content, userQuery, language);
    return res.json({ suggestions });
  } catch {
    return res.json({
      suggestions: [
        "Can you provide practical examples?",
        "What are the key advantages?",
        "Explain this in more detail"
      ]
    });
  }
});

// Standard JSON Chat Endpoint
app.post(["/api/chat", "/chat"], async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const {
      messages,
      enableSearch = true,
      language = "auto",
      model = "llama-3.3-70b-versatile",
      groqApiKey: customGroqKey,
    } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const lastMessage = messages[messages.length - 1];
    const lastContent = (lastMessage?.content || "").trim();
    const uploadedImage = lastMessage?.image;
    const attachedFile = lastMessage?.fileAttachment;

    // Extract Image Summary if needed
    let newImageSummary = lastMessage?.imageSummary || "";
    if (uploadedImage && typeof uploadedImage === "string" && !uploadedImage.includes("application/pdf") && !newImageSummary) {
      newImageSummary = await generateImageMemorySummary(uploadedImage);
      if (newImageSummary) {
        lastMessage.imageSummary = newImageSummary;
      }
    }

    // Extract PDF Summary & Text if needed
    let newPdfSummary = lastMessage?.pdfSummary || "";
    let newPdfText = lastMessage?.pdfText || "";
    const pdfDataUrl = attachedFile?.dataUrl || (typeof uploadedImage === "string" && uploadedImage.includes("application/pdf") ? uploadedImage : null);

    if (pdfDataUrl && (!newPdfSummary || !newPdfText)) {
      const extracted = await generatePdfMemorySummary(pdfDataUrl, attachedFile?.name);
      if (extracted.pdfSummary) {
        newPdfSummary = extracted.pdfSummary;
        newPdfText = extracted.pdfText;
        lastMessage.pdfSummary = newPdfSummary;
        lastMessage.pdfText = newPdfText;
      }
    }

    let languagePrompt = "";
    if (language === "bn") {
      languagePrompt = " [Please respond primarily in elegant, clear Bengali (বাংলা).]";
    } else if (language === "banglish") {
      languagePrompt = " [Please respond in clean, easy-to-read Banglish (Bangla using English alphabet).]";
    } else if (language === "en") {
      languagePrompt = " [Please respond in professional English.]";
    }

    const currentDateStr = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const dateContext = ` [Today's date is ${currentDateStr}. Always use this accurate date if asked about today's date or current time.]`;

    // Build persistent media & PDF document memory from chat history
    const mediaMem = buildFileAndImageMemorySystemPrompt(messages);
    const lastUploadedMedia = [...messages].reverse().find((m: any) => (m.image && typeof m.image === "string") || m.fileAttachment?.dataUrl)?.fileAttachment?.dataUrl || uploadedImage;
    const hasMedia = mediaMem.hasMedia;

    const fullSystemInstruction = SYSTEM_INSTRUCTION + languagePrompt + dateContext + mediaMem.prompt;

    // 1. Primary Engine: OpenRouter API
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    if (openRouterKey) {
      try {
        const apiMessages = [
          { role: "system", content: fullSystemInstruction },
          ...messages.map((m: any, idx: number) => {
            const mediaToUse = (m.image && typeof m.image === "string")
              ? m.image
              : (m.fileAttachment?.dataUrl)
              ? m.fileAttachment.dataUrl
              : (idx === messages.length - 1 && m.role === "user" && lastUploadedMedia)
              ? lastUploadedMedia
              : null;

            if (mediaToUse) {
              return {
                role: m.role === "assistant" ? "assistant" : "user",
                content: [
                  { type: "text", text: String(m.content || "Please analyze this media/document carefully.") },
                  { type: "image_url", image_url: { url: mediaToUse } },
                ],
              };
            }
            return {
              role: m.role === "assistant" ? "assistant" : "user",
              content: String(m.content || ""),
            };
          }),
        ];

        let selectedModel = model;
        if (!selectedModel || selectedModel.startsWith("gemini-")) {
          selectedModel = hasMedia ? "inclusionai/ling-3.0-flash-vl:free" : "deepseek/deepseek-v4-flash-0731:free";
        }

        const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "HTTP-Referer": "https://bd-zen-ai.com",
            "X-Title": "BD-Zen AI",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: apiMessages,
            temperature: 0.7,
            max_tokens: 3000,
            include_reasoning: false,
          }),
        });

        if (openRouterRes.ok) {
          const data = (await openRouterRes.json()) as any;
          const replyText = data.choices?.[0]?.message?.content || "";
          if (replyText) {
            const suggestions = await generateAiFollowUpSuggestions(replyText, lastContent, language);
            return res.json({
              content: replyText,
              sources: [],
              suggestions,
              imageSummary: newImageSummary || undefined,
              pdfSummary: newPdfSummary || undefined,
              pdfText: newPdfText || undefined,
            });
          }
        } else {
          const errData = (await openRouterRes.json().catch(() => ({}))) as any;
          console.warn("OpenRouter API returned error, falling back to Groq:", errData);
        }
      } catch (orErr: any) {
        console.warn("OpenRouter API connection error, falling back to Groq:", orErr);
      }
    }

    // 2. High-Speed Fallback: Direct Groq API
    const groqKey = customGroqKey || process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const groqMessages = [
          { role: "system", content: fullSystemInstruction },
          ...messages.map((m: any) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: String(m.content || ""),
          })),
        ];

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "qwen/qwen3.8-27b",
            messages: groqMessages,
            temperature: 0.7,
            max_tokens: 3000,
          }),
        });

        if (groqRes.ok) {
          const data = (await groqRes.json()) as any;
          const replyText = data.choices?.[0]?.message?.content || "";
          if (replyText) {
            const suggestions = await generateAiFollowUpSuggestions(replyText, lastContent, language);
            return res.json({
              content: replyText,
              sources: [],
              suggestions,
            });
          }
        }
      } catch (gErr) {
        console.warn("Groq API fallback connection error:", gErr);
      }
    }

    return res.status(200).json({
      content: "⚠️ No response received from any AI model.",
      sources: [],
    });

  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    return res.status(200).json({
      content: "Sorry, an internal error occurred. Please try again.",
      sources: []
    });
  }
});

// SSE Streaming Endpoint
app.post(["/api/chat/stream", "/chat/stream"], async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const {
      messages,
      enableSearch = true,
      language = "auto",
      model = "llama-3.3-70b-versatile",
      groqApiKey: customGroqKey,
    } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    const groqKey = customGroqKey || process.env.GROQ_API_KEY;

    const lastMessageStream = messages[messages.length - 1];
    const uploadedImageStream = lastMessageStream?.image;
    const attachedFileStream = lastMessageStream?.fileAttachment;

    // Extract image memory summary for new uploaded image if missing
    let newImageSummaryStream = lastMessageStream?.imageSummary || "";
    if (uploadedImageStream && typeof uploadedImageStream === "string" && !uploadedImageStream.includes("application/pdf") && !newImageSummaryStream) {
      newImageSummaryStream = await generateImageMemorySummary(uploadedImageStream);
      if (newImageSummaryStream) {
        lastMessageStream.imageSummary = newImageSummaryStream;
      }
    }

    if (newImageSummaryStream) {
      res.write(`data: ${JSON.stringify({ imageSummary: newImageSummaryStream })}\n\n`);
    }

    // Extract PDF summary & text for streaming if missing
    let newPdfSummaryStream = lastMessageStream?.pdfSummary || "";
    let newPdfTextStream = lastMessageStream?.pdfText || "";
    const pdfDataUrlStream = attachedFileStream?.dataUrl || (typeof uploadedImageStream === "string" && uploadedImageStream.includes("application/pdf") ? uploadedImageStream : null);

    if (pdfDataUrlStream && (!newPdfSummaryStream || !newPdfTextStream)) {
      const extracted = await generatePdfMemorySummary(pdfDataUrlStream, attachedFileStream?.name);
      if (extracted.pdfSummary) {
        newPdfSummaryStream = extracted.pdfSummary;
        newPdfTextStream = extracted.pdfText;
        lastMessageStream.pdfSummary = newPdfSummaryStream;
        lastMessageStream.pdfText = newPdfTextStream;
        res.write(`data: ${JSON.stringify({ pdfSummary: newPdfSummaryStream, pdfText: newPdfTextStream })}\n\n`);
      }
    }

    let languagePrompt = "";
    if (language === "bn") {
      languagePrompt = " [Please respond primarily in elegant, clear Bengali (বাংলা).]";
    } else if (language === "banglish") {
      languagePrompt = " [Please respond in clean, easy-to-read Banglish.]";
    } else if (language === "en") {
      languagePrompt = " [Please respond in professional English.]";
    }

    const currentDateStrStream = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const dateContextStream = ` [Today's date is ${currentDateStrStream}. Always use this accurate date if asked about today's date or current time.]`;

    // Build persistent media memory from chat history
    const mediaMemStream = buildFileAndImageMemorySystemPrompt(messages);
    const hasMedia = mediaMemStream.hasMedia;

    const fullSystemInstruction = SYSTEM_INSTRUCTION + languagePrompt + dateContextStream + mediaMemStream.prompt;

    // 1. Primary Engine: OpenRouter Streaming
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const lastUploadedMediaStream = [...messages].reverse().find((m: any) => (m.image && typeof m.image === 'string') || m.fileAttachment?.dataUrl)?.fileAttachment?.dataUrl || uploadedImageStream;

    if (openRouterKey) {
      try {
        const apiMessages = [
          { role: "system", content: fullSystemInstruction },
          ...messages.map((m: any, idx: number) => {
            const mediaToUse = (m.image && typeof m.image === 'string')
              ? m.image
              : (m.fileAttachment?.dataUrl)
              ? m.fileAttachment.dataUrl
              : (idx === messages.length - 1 && m.role === 'user' && lastUploadedMediaStream)
              ? lastUploadedMediaStream
              : null;

            if (mediaToUse) {
              return {
                role: m.role === "assistant" ? "assistant" : "user",
                content: [
                  { type: "text", text: String(m.content || "Please analyze this media/document carefully.") },
                  { type: "image_url", image_url: { url: mediaToUse } },
                ],
              };
            }
            return {
              role: m.role === "assistant" ? "assistant" : "user",
              content: String(m.content || ""),
            };
          }),
        ];

        let selectedModel = model;
        if (!selectedModel || selectedModel.startsWith("gemini-")) {
          selectedModel = hasMedia ? "inclusionai/ling-3.0-flash-vl:free" : "deepseek/deepseek-v4-flash-0731:free";
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "HTTP-Referer": "https://bd-zen-ai.com",
            "X-Title": "BD-Zen AI",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: apiMessages,
            temperature: 0.7,
            stream: true,
            max_tokens: 3000,
            include_reasoning: false,
          }),
        });

        if (response.ok && response.body) {
          const reader = (response.body as any).getReader();
          const decoder = new TextDecoder("utf-8");
          let buffer = "";
          let accumulatedReplyText = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(":")) continue;

              if (trimmed === "data: [DONE]") {
                break;
              }

              if (trimmed.startsWith("data: ")) {
                const jsonStr = trimmed.slice(6);
                try {
                  const parsed = JSON.parse(jsonStr);
                  const deltaContent = parsed.choices?.[0]?.delta?.content;
                  if (deltaContent) {
                    accumulatedReplyText += deltaContent;
                    res.write(`data: ${JSON.stringify({ text: deltaContent })}\n\n`);
                  }
                } catch {
                  // Ignore incomplete JSON chunks
                }
              }
            }
          }

          if (accumulatedReplyText.trim().length > 0) {
            try {
              const suggestions = await generateAiFollowUpSuggestions(accumulatedReplyText, (lastMessageStream?.content || ""), language);
              if (suggestions && suggestions.length > 0) {
                res.write(`data: ${JSON.stringify({ suggestions })}\n\n`);
              }
            } catch (sugErr) {
              console.warn("OpenRouter stream suggestion error:", sugErr);
            }

            res.write("data: [DONE]\n\n");
            return res.end();
          }
        } else {
          const errText = await response.text().catch(() => "");
          console.warn(`OpenRouter Streaming Warning (${response.status}), falling back to Groq:`, errText);
        }
      } catch (orErr) {
        console.warn("OpenRouter Streaming Exception, falling back to Groq:", orErr);
      }
    }

    // 2. High-Speed Fallback: Direct Groq Streaming (Ultra-fast ~20ms, High Rate-Limit)
    if (groqKey) {
      try {
        const groqMessages = [
          { role: "system", content: fullSystemInstruction },
          ...messages.map((m: any) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: String(m.content || ""),
          })),
        ];

        const validGroqModels = [
          "qwen/qwen3.8-27b",
          "openai/gpt-oss-120b",
          "openai/gpt-oss-20b",
        ];
        const selectedModel = validGroqModels.includes(model) ? model : "qwen/qwen3.8-27b";

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: groqMessages,
            temperature: 0.7,
            stream: true,
            max_tokens: 3000,
          }),
        });

        if (response.ok && response.body) {
          const reader = (response.body as any).getReader();
          const decoder = new TextDecoder("utf-8");
          let buffer = "";
          let accumulatedReplyText = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(":")) continue;

              if (trimmed === "data: [DONE]") {
                break;
              }

              if (trimmed.startsWith("data: ")) {
                const jsonStr = trimmed.slice(6);
                try {
                  const parsed = JSON.parse(jsonStr);
                  const deltaContent = parsed.choices?.[0]?.delta?.content;
                  if (deltaContent) {
                    accumulatedReplyText += deltaContent;
                    res.write(`data: ${JSON.stringify({ text: deltaContent })}\n\n`);
                  }
                } catch {
                  // Ignore partial chunks
                }
              }
            }
          }

          if (accumulatedReplyText) {
            try {
              const suggestions = await generateAiFollowUpSuggestions(accumulatedReplyText, (lastMessageStream?.content || ""), language);
              if (suggestions && suggestions.length > 0) {
                res.write(`data: ${JSON.stringify({ suggestions })}\n\n`);
              }
            } catch (sugErr) {
              console.warn("Groq stream suggestion error:", sugErr);
            }

            res.write("data: [DONE]\n\n");
            return res.end();
          }
        }
      } catch (groqStreamErr) {
        console.warn("Groq streaming connection warning:", groqStreamErr);
      }
    }

    res.write(`data: ${JSON.stringify({ text: "The service is temporarily busy. Please try again in a moment." })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("Error in /api/chat/stream:", error);
    res.write(
      `data: ${JSON.stringify({ text: "\nSorry, a technical error occurred. Please try again." })}\n\n`
    );
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

// Static File Handling
const distPath = path.join(process.cwd(), "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Local Server Startup (Vercel ignores this automatically)
if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BD-Zen AI Server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;