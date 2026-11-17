import {
  getWeather,
  getCryptoPrice,
  searchGitHubRepos,
  searchWikipedia,
  generateImageUrl,
  type ToolResult,
} from "@/lib/tools/public-apis";

export interface ExecutedTool {
  name: string;
  args: Record<string, unknown>;
  result: ToolResult | { imageUrl: string; prompt: string };
  summary: string;
}

/**
 * Executes a requested tool by name with arguments.
 */
export async function executeTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<ExecutedTool> {
  switch (toolName) {
    case "get_weather": {
      const location = String(args.location || "London");
      const res = await getWeather(location);
      const summary = res.success && res.data
        ? `Weather in ${(res.data as { location: string }).location}: ${(res.data as { temperature: string; condition: string }).temperature}, ${(res.data as { condition: string }).condition}`
        : `Weather check failed for ${location}`;
      return { name: "get_weather", args, result: res, summary };
    }

    case "get_crypto_price": {
      const coin = String(args.coin || "bitcoin");
      const currency = String(args.currency || "usd");
      const res = await getCryptoPrice(coin, currency);
      const summary = res.success && res.data
        ? `${coin.toUpperCase()}: ${(res.data as { price: string }).price} (${(res.data as { change24h: string | null }).change24h || "0%"})`
        : `Crypto check failed for ${coin}`;
      return { name: "get_crypto_price", args, result: res, summary };
    }

    case "search_github_repos": {
      const query = String(args.query || "nextjs");
      const res = await searchGitHubRepos(query);
      const summary = res.success && res.data
        ? `Found ${(res.data as { totalFound: number }).totalFound} repos for "${query}"`
        : `GitHub search failed for "${query}"`;
      return { name: "search_github_repos", args, result: res, summary };
    }

    case "search_wikipedia": {
      const topic = String(args.topic || "Artificial intelligence");
      const res = await searchWikipedia(topic);
      const summary = res.success && res.data
        ? `Wikipedia article: ${(res.data as { title: string }).title}`
        : `Wikipedia article not found for "${topic}"`;
      return { name: "search_wikipedia", args, result: res, summary };
    }

    case "generate_image": {
      const prompt = String(args.prompt || "Futuristic AI city");
      const res = generateImageUrl({ prompt });
      const summary = `Generated image for "${prompt}"`;
      return { name: "generate_image", args, result: res, summary };
    }

    default:
      throw new Error(`Unknown tool "${toolName}"`);
  }
}

/**
 * Autonomous Tool Detection Rule Matrix:
 * Detects if a user message warrants a real-time tool call.
 */
export function detectToolsToRun(message: string): Array<{ name: string; args: Record<string, unknown> }> {
  const lower = message.toLowerCase();
  const tools: Array<{ name: string; args: Record<string, unknown> }> = [];

  // 1. Weather intent
  const weatherMatch = lower.match(/(?:weather|temperature|forecast|climate|rain)\s+(?:in|for|at)?\s*([a-zA-Z\s]+)/i);
  if (weatherMatch && weatherMatch[1]) {
    const loc = weatherMatch[1].replace(/\b(today|tomorrow|now|please|tell me|what is the)\b/gi, "").trim();
    if (loc.length > 2) {
      tools.push({ name: "get_weather", args: { location: loc } });
    }
  }

  // 2. Crypto price intent
  const cryptoMatch = lower.match(/(?:price of|crypto|rate of|how much is)\s+([a-zA-Z]+)(?:\s+(?:in|to)\s+([a-zA-Z]+))?/i);
  const commonCoins = ["bitcoin", "btc", "ethereum", "eth", "solana", "sol", "doge", "dogecoin", "cardano", "ripple", "xrp"];
  const foundCoin = commonCoins.find((c) => lower.includes(c));
  if (cryptoMatch || foundCoin) {
    const coin = foundCoin || (cryptoMatch ? cryptoMatch[1] : "bitcoin");
    tools.push({ name: "get_crypto_price", args: { coin, currency: "usd" } });
  }

  // 3. Image generation intent
  if (
    lower.includes("generate an image") ||
    lower.includes("create an image") ||
    lower.includes("draw me") ||
    lower.startsWith("draw ") ||
    lower.startsWith("image of ") ||
    lower.includes("generate a picture") ||
    lower.includes("render an image")
  ) {
    const prompt = message
      .replace(/(?:generate an image of|generate a picture of|create an image of|draw me an image of|draw an image of|draw me|draw|image of|render an image of)/i, "")
      .trim();
    if (prompt.length > 2) {
      tools.push({ name: "generate_image", args: { prompt } });
    }
  }

  // 4. GitHub search intent
  if (lower.includes("github repo") || lower.includes("github project") || lower.includes("repositories for")) {
    const query = message.replace(/(?:search|find|show me|look for)?\s*(?:github repos?|github projects?|repositories for)\s*/i, "").trim();
    if (query.length > 1) {
      tools.push({ name: "search_github_repos", args: { query } });
    }
  }

  // 5. Wikipedia lookup intent
  if (lower.startsWith("who is ") || lower.startsWith("what is the history of ") || lower.includes("wikipedia summary")) {
    const topic = message.replace(/(?:who is|what is the history of|wikipedia summary of|tell me about the history of)\s*/i, "").trim();
    if (topic.length > 2 && !tools.some((t) => t.name === "get_weather")) {
      tools.push({ name: "search_wikipedia", args: { topic } });
    }
  }

  return tools;
}
