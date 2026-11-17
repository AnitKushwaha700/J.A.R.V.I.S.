import { NextRequest, NextResponse } from "next/server";
import { queryAIGateway } from "@/lib/ai/gateway";
import { detectToolsToRun, executeTool, type ExecutedTool } from "@/lib/ai/tools";
import { getOrCreateSessionId } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    await getOrCreateSessionId();

    // 1. Detect and execute public tools autonomously
    const detectedTools = detectToolsToRun(message);
    const executedTools: ExecutedTool[] = [];

    for (const tool of detectedTools) {
      try {
        const result = await executeTool(tool.name, tool.args);
        executedTools.push(result);
      } catch (err) {
        console.warn(`[Agent Tool Failed]: ${tool.name}`, err);
      }
    }

    // 2. Format tool outputs into contextual observations
    let toolContext = "";
    let toolMarkdown = "";

    for (const t of executedTools) {
      if (t.name === "generate_image") {
        const imgData = t.result as { imageUrl: string; prompt: string };
        toolMarkdown += `\n\n![${imgData.prompt}](${imgData.imageUrl})\n*Generated concept visual for: "${imgData.prompt}"*\n\n`;
      } else if (t.name === "get_weather" && (t.result as { success: boolean }).success) {
        const w = (t.result as { data: { location: string; temperature: string; condition: string; humidity: string; windSpeed: string } }).data;
        toolContext += `Current Weather in ${w.location}: ${w.temperature}, ${w.condition}, Humidity: ${w.humidity}, Wind: ${w.windSpeed}.\n`;
        toolMarkdown += `\n> 🌤️ **Live Weather:** ${w.location} is currently **${w.temperature}** (${w.condition}) with ${w.humidity} humidity.\n\n`;
      } else if (t.name === "get_crypto_price" && (t.result as { success: boolean }).success) {
        const c = (t.result as { data: { coin: string; price: string; change24h: string | null; currency: string } }).data;
        toolContext += `Current ${c.coin.toUpperCase()} price: ${c.price} (${c.change24h || "0%"}).\n`;
        toolMarkdown += `\n> 💰 **Live Market Price:** **${c.coin.toUpperCase()}** is trading at **${c.price}** (${c.change24h || "0%"} 24h change).\n\n`;
      } else if (t.name === "search_github_repos" && (t.result as { success: boolean }).success) {
        const gh = (t.result as { data: { query: string; totalFound: number; repositories: Array<{ name: string; url: string; stars: number; description: string; language: string }> } }).data;
        toolContext += `Found ${gh.totalFound} GitHub repositories for query "${gh.query}".\n`;
        toolMarkdown += `\n### 🐙 GitHub Repositories for "${gh.query}"\n` +
          gh.repositories.map((r) => `- [**${r.name}**](${r.url}) (${r.stars.toLocaleString()} ⭐ - ${r.language || "code"}): ${r.description || "No description"}`).join("\n") + "\n\n";
      } else if (t.name === "search_wikipedia" && (t.result as { success: boolean }).success) {
        const wiki = (t.result as { data: { title: string; extract: string; url: string } }).data;
        toolContext += `Wikipedia summary for ${wiki.title}: ${wiki.extract}\n`;
        toolMarkdown += `\n> 📚 **Wikipedia Summary:** ${wiki.extract} [Read more](${wiki.url})\n\n`;
      }
    }

    // 3. Query Multi-Provider Gateway with Live Observations
    const aiResponse = await queryAIGateway({
      message,
      history,
      userContext: toolContext ? `REAL-TIME TOOL OBSERVATIONS:\n${toolContext}` : undefined,
    });

    // Merge tool visual output with LLM markdown response
    const combinedDisplayText = toolMarkdown
      ? `${toolMarkdown}${aiResponse.displayText || aiResponse.reply}`
      : (aiResponse.displayText || aiResponse.reply);

    return NextResponse.json({
      ...aiResponse,
      displayText: combinedDisplayText,
      toolsExecuted: executedTools.map((t) => ({ name: t.name, summary: t.summary })),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Agent execution failed";
    console.error("[Agent Route Error]:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
