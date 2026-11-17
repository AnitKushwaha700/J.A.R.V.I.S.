import { NextRequest, NextResponse } from "next/server";
import { queryAIGateway } from "@/lib/ai/gateway";
import { queryGrok, GrokServiceError } from "@/lib/ai/grok";
import { detectToolsToRun, executeTool, type ExecutedTool } from "@/lib/ai/tools";
import { getOrCreateSessionId } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { chatRequestSchema } from "@/lib/validators";
import connectToDatabase from "@/lib/db";
import { Conversation } from "@/lib/models/Conversation";
import { User } from "@/lib/models/User";
import { Mistake } from "@/lib/models/Mistake";
import { Progress } from "@/lib/models/Progress";
import { Task } from "@/lib/models/Task";
import type { AIResponse } from "@/types";

export const maxDuration = 35; // Maximum allowable execution duration

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Zod validation
    const parseResult = chatRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }

    const {
      message,
      mode: modeSlug,
      conversationId,
      history,
      language,
      personality,
      responseLength,
    } = parseResult.data;

    // Get or create session
    const sessionId = await getOrCreateSessionId();

    // Rate limiting: 60 messages per hour per session
    const rateLimit = checkRateLimit(`chat:${sessionId}`, {
      maxRequests: 60,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Rate limit reached. Please wait a moment before sending another message.",
          reply:
            "You are speaking quite rapidly! Let's pause for a few minutes so you can review what we've covered.",
          grammarFixes: [],
          betterWords: [],
          pronunciationTip: "",
          confidenceScore: 0,
          cefrLevel: "B1",
          encouragement: "Take a deep breath and we will resume shortly.",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": new Date(rateLimit.resetAt).toISOString(),
          },
        }
      );
    }

    // 1. Detect and execute autonomous public tools
    const detectedTools = detectToolsToRun(message);
    const executedTools: ExecutedTool[] = [];
    let toolContext = "";
    let toolMarkdown = "";

    for (const tool of detectedTools) {
      try {
        const result = await executeTool(tool.name, tool.args);
        executedTools.push(result);
        if (tool.name === "generate_image") {
          const imgData = result.result as { imageUrl: string; prompt: string };
          toolMarkdown += `\n\n![${imgData.prompt}](${imgData.imageUrl})\n*Generated concept visual for: "${imgData.prompt}"*\n\n`;
        } else if (tool.name === "get_weather" && (result.result as { success: boolean }).success) {
          const w = (result.result as { data: { location: string; temperature: string; condition: string; humidity: string; windSpeed: string } }).data;
          toolContext += `Live Weather in ${w.location}: ${w.temperature}, ${w.condition}, Humidity: ${w.humidity}, Wind: ${w.windSpeed}.\n`;
          toolMarkdown += `\n> 🌤️ **Live Weather:** ${w.location} is **${w.temperature}** (${w.condition}).\n\n`;
        } else if (tool.name === "get_crypto_price" && (result.result as { success: boolean }).success) {
          const c = (result.result as { data: { coin: string; price: string; change24h: string | null } }).data;
          toolContext += `Live ${c.coin.toUpperCase()} price: ${c.price} (${c.change24h || "0%"}).\n`;
          toolMarkdown += `\n> 💰 **Market Price:** **${c.coin.toUpperCase()}** is trading at **${c.price}** (${c.change24h || "0%"} 24h change).\n\n`;
        } else if (tool.name === "search_github_repos" && (result.result as { success: boolean }).success) {
          const gh = (result.result as { data: { query: string; repositories: Array<{ name: string; url: string; stars: number; language: string }> } }).data;
          toolMarkdown += `\n### 🐙 GitHub Repositories for "${gh.query}"\n` +
            gh.repositories.map((r) => `- [**${r.name}**](${r.url}) (${r.stars.toLocaleString()} ⭐ - ${r.language || "code"})`).join("\n") + "\n\n";
        }
      } catch (err) {
        console.warn(`[Chat Tool Failed]: ${tool.name}`, err);
      }
    }

    // 2. Normalize history turns for the Gateway
    const normalizedHistory = history?.map((h) => ({
      role: (h.role === "ai" ? "assistant" : "user") as "user" | "assistant",
      content: h.text,
    }));

    // 3. Query Multi-Provider AI Gateway (Groq Llama 3.3 70B -> Gemini 2.0 Flash -> Standby)
    let aiResponse: AIResponse;
    try {
      aiResponse = await queryAIGateway({
        message,
        modeSlug,
        history: normalizedHistory,
        personality,
        responseLength,
        userContext: toolContext ? `REAL-TIME TOOL OBSERVATIONS:\n${toolContext}` : undefined,
      });
    } catch {
      // Fallback to Grok if configured, or default graceful reply
      aiResponse = await queryGrok({
        message,
        mode: modeSlug,
        history,
        language,
        personality,
        responseLength,
      });
    }

    if (toolMarkdown) {
      aiResponse.displayText = `${toolMarkdown}${aiResponse.displayText || aiResponse.reply}`;
    }

    // Save conversation & metadata to MongoDB
    const dbResult = saveToDatabase(
      sessionId,
      modeSlug,
      conversationId,
      message,
      aiResponse
    );

    let newConversationId = conversationId;
    try {
      const conversation = await dbResult;
      newConversationId = conversation?._id?.toString() || conversationId;
    } catch (err) {
      console.error("DB save error:", err);
    }

    const userMessageObj = {
      id: Math.random().toString(),
      role: "user" as const,
      content: message,
      createdAt: new Date().toISOString(),
    };
    const assistantMessageObj = {
      id: Math.random().toString(),
      role: "assistant" as const,
      content: aiResponse.reply,
      createdAt: new Date().toISOString(),
    };

    const response = NextResponse.json({
      ...aiResponse,
      conversationId: newConversationId || "temp-" + Date.now(),
      userMessage: userMessageObj,
      assistantMessage: assistantMessageObj,
    });

    if (newConversationId) {
      response.headers.set("x-conversation-id", newConversationId);
    }
    response.headers.set(
      "X-RateLimit-Remaining",
      rateLimit.remaining.toString()
    );

    return response;
  } catch (error) {
    console.error("Chat API error:", error);
    if (error instanceof GrokServiceError) {
      return NextResponse.json(
        {
          error: error.message,
          reply: error.message,
          grammarFixes: [],
          betterWords: [],
          pronunciationTip: "",
          confidenceScore: 0,
          cefrLevel: "B1",
          encouragement: "",
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        error: "JARVIS could not process your request at this moment.",
        reply: "My cognitive systems encountered an unexpected hiccup. Please try speaking again.",
        grammarFixes: [],
        betterWords: [],
        pronunciationTip: "",
        confidenceScore: 0,
        cefrLevel: "B1",
        encouragement: "",
      },
      { status: 500 }
    );
  }
}

async function saveToDatabase(
  sessionId: string,
  mode: string,
  conversationId: string | undefined,
  userMessage: string,
  aiResponse: AIResponse
) {
  const db = await connectToDatabase();
  if (!db) return null;

  try {
    // Ensure user exists and update activity
    await User.findOneAndUpdate(
      { sessionId },
      {
        $setOnInsert: { sessionId },
        $set: { lastActiveAt: new Date() },
        $inc: { xp: 5 },
      },
      { upsert: true, new: true }
    );

    const userMsg = {
      role: "user" as const,
      text: userMessage,
      createdAt: new Date(),
    };

    const aiMsg = {
      role: "ai" as const,
      text: aiResponse.reply,
      analysis: {
        grammarFixes: aiResponse.grammarFixes,
        betterWords: aiResponse.betterWords,
        confidenceScore: aiResponse.confidenceScore,
        cefrLevel: aiResponse.cefrLevel,
        pronunciationTip: aiResponse.pronunciationTip,
        encouragement: aiResponse.encouragement,
        code: aiResponse.code,
        timeComplexity: aiResponse.timeComplexity,
        spaceComplexity: aiResponse.spaceComplexity,
        keyInsight: aiResponse.keyInsight,
        roadmap: aiResponse.roadmap,
        skills: aiResponse.skills,
        careerTip: aiResponse.careerTip,
        displayText: aiResponse.displayText,
      },
      createdAt: new Date(),
    };

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findByIdAndUpdate(
        conversationId,
        {
          $push: { messages: { $each: [userMsg, aiMsg] } },
          $inc: { messageCount: 2 },
          $set: { avgConfidence: aiResponse.confidenceScore },
        },
        { new: true }
      );
    } else {
      conversation = await Conversation.create({
        sessionId,
        mode,
        messages: [userMsg, aiMsg],
        messageCount: 2,
        avgConfidence: aiResponse.confidenceScore,
      });
    }

    // Save grammar mistakes for review
    if (aiResponse.grammarFixes && aiResponse.grammarFixes.length > 0) {
      for (const fix of aiResponse.grammarFixes) {
        if (!fix.wrong || !fix.right) continue;
        await Mistake.findOneAndUpdate(
          { sessionId, wrong: fix.wrong, right: fix.right },
          {
            $setOnInsert: {
              sessionId,
              type: "grammar",
              wrong: fix.wrong,
              right: fix.right,
              why: fix.why,
            },
            $inc: { occurrences: 1 },
            $set: { lastSeen: new Date() },
          },
          { upsert: true }
        );
      }
    }

    // Automatically persist any agreed action items/tasks
    if (aiResponse.suggestedTasks && aiResponse.suggestedTasks.length > 0) {
      for (const t of aiResponse.suggestedTasks) {
        if (!t.title) continue;
        const task = new Task({
          sessionId,
          title: t.title,
          priority: t.priority || "medium",
          status: "todo",
        });
        await task.save();
      }
    }

    // Update daily progress
    const today = new Date().toISOString().split("T")[0];
    await Progress.findOneAndUpdate(
      { sessionId, date: today },
      {
        $setOnInsert: { sessionId, date: today },
        $inc: {
          messages: 2,
          minutes: 1,
          newWords: (aiResponse.betterWords || []).length,
        },
        $set: {
          grammarScore: aiResponse.confidenceScore,
          streakMaintained: true,
        },
      },
      { upsert: true }
    );

    return conversation;
  } catch (err) {
    console.warn("MongoDB write error:", err);
    return null;
  }
}
