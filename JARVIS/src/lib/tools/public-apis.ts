/**
 * Free Public APIs Tool Hub
 * Powered by open public endpoints (zero API keys required)
 * Source catalog: https://github.com/public-apis/public-apis
 */

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  source: string;
}

/**
 * 1. Open-Meteo Weather API (100% Free, No API key)
 */
export async function getWeather(location: string): Promise<ToolResult> {
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    );
    if (!geoRes.ok) throw new Error("Location lookup failed");
    const geoData = await geoRes.json();
    const place = geoData.results?.[0];

    if (!place) {
      return { success: false, error: `Could not find coordinates for "${location}"`, source: "Open-Meteo" };
    }

    const { latitude, longitude, name, country } = place;
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=celsius`
    );
    if (!weatherRes.ok) throw new Error("Weather forecast lookup failed");
    const weatherData = await weatherRes.json();
    const current = weatherData.current;

    // Simple weather code description
    const weatherDescriptions: Record<number, string> = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Foggy",
      51: "Light drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      71: "Slight snowfall",
      75: "Heavy snowfall",
      95: "Thunderstorm",
    };
    const condition = weatherDescriptions[current.weather_code] || "Variable conditions";

    return {
      success: true,
      source: "Open-Meteo",
      data: {
        location: `${name}, ${country || ""}`.trim(),
        temperature: `${current.temperature_2m}°C`,
        feelsLike: `${current.apparent_temperature}°C`,
        humidity: `${current.relative_humidity_2m}%`,
        windSpeed: `${current.wind_speed_10m} km/h`,
        condition,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Weather lookup error", source: "Open-Meteo" };
  }
}

/**
 * 2. CoinGecko Simple Price API (Free tier, No API key)
 */
export async function getCryptoPrice(coin: string, vsCurrency: string = "usd"): Promise<ToolResult> {
  try {
    const coinId = coin.toLowerCase().trim().replace(/\s+/g, "-");
    const currency = vsCurrency.toLowerCase().trim();

    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=${encodeURIComponent(currency)}&include_24hr_change=true`
    );
    if (!res.ok) throw new Error("CoinGecko API request failed");
    const data = await res.json();

    if (!data[coinId]) {
      return {
        success: false,
        error: `Could not find price data for "${coin}". Try standard names like 'bitcoin', 'ethereum', 'solana', 'dogecoin'.`,
        source: "CoinGecko",
      };
    }

    const price = data[coinId][currency];
    const change24h = data[coinId][`${currency}_24h_change`];

    return {
      success: true,
      source: "CoinGecko",
      data: {
        coin: coinId,
        currency: currency.toUpperCase(),
        price: price.toLocaleString("en-US", { style: "currency", currency: currency.toUpperCase() }),
        change24h: change24h !== undefined ? `${change24h.toFixed(2)}%` : null,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Crypto price lookup error", source: "CoinGecko" };
  }
}

/**
 * 3. GitHub Search API (Public API, No key needed for basic queries)
 */
export async function searchGitHubRepos(query: string): Promise<ToolResult> {
  try {
    const res = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "JARVIS-Personal-AI-Assistant",
        },
      }
    );
    if (!res.ok) throw new Error("GitHub repository search failed");
    const data = await res.json();

    const repos = (data.items || []).map((repo: {
      name: string;
      full_name: string;
      html_url: string;
      description: string;
      stargazers_count: number;
      language: string;
    }) => ({
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      description: repo.description,
      stars: repo.stargazers_count,
      language: repo.language,
    }));

    return {
      success: true,
      source: "GitHub",
      data: { query, totalFound: data.total_count, repositories: repos },
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "GitHub search error", source: "GitHub" };
  }
}

/**
 * 4. Wikipedia REST Summary API (Free encyclopedia lookup)
 */
export async function searchWikipedia(topic: string): Promise<ToolResult> {
  try {
    const cleanTopic = topic.trim().replace(/\s+/g, "_");
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTopic)}`
    );
    if (!res.ok) {
      return { success: false, error: `Wikipedia article not found for "${topic}"`, source: "Wikipedia" };
    }
    const data = await res.json();

    return {
      success: true,
      source: "Wikipedia",
      data: {
        title: data.title,
        description: data.description,
        extract: data.extract,
        url: data.content_urls?.desktop?.page,
        thumbnail: data.thumbnail?.source,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Wikipedia lookup error", source: "Wikipedia" };
  }
}

/**
 * 5. Pollinations.ai Image Generation (100% Free, Unlimited, No API key)
 * Models: 'flux' (ultra-detailed), 'turbo' (fast)
 */
export function generateImageUrl(options: {
  prompt: string;
  width?: number;
  height?: number;
  model?: "flux" | "turbo";
  seed?: number;
}): { imageUrl: string; prompt: string; source: string } {
  const width = options.width || 1024;
  const height = options.height || 1024;
  const model = options.model || "flux";
  const seed = options.seed || Math.floor(Math.random() * 1000000);
  const cleanPrompt = encodeURIComponent(options.prompt.trim());

  const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true`;

  return {
    imageUrl,
    prompt: options.prompt,
    source: "Pollinations.ai (FLUX)",
  };
}
