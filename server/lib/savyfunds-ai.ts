/**
 * SavyFunds AI Service
 *
 * Uses OpenRouter's free-tier models (no paid subscription required) for
 * intelligent financial responses. The AI provider branding is hidden -
 * responses appear as "Savyfunds AI".
 *
 * Speed strategy: fast free models are tried in order with a per-attempt
 * timeout. The first one that answers wins, so the AI automatically uses
 * whichever fast model is actually responding quickly right now, instead of
 * waiting in a congested queue. The openrouter/free router is the last
 * resort before the built-in database fallback.
 */

export interface SavyFundsAIResponse {
  answer: string;
  keyPoints?: string[];
  actionItems?: string[];
  relatedTopics?: string[];
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Live crypto prices via CoinGecko's free API (no key needed). When a user
// asks the price of a supported coin, the real number is fetched and passed
// to the model as context so answers quote live data, not guesses.
const COINGECKO_IDS: Record<string, string> = {
  bitcoin: "bitcoin",
  btc: "bitcoin",
  ethereum: "ethereum",
  eth: "ethereum",
  solana: "solana",
  sol: "solana",
  dogecoin: "dogecoin",
  doge: "dogecoin",
  xrp: "ripple",
  cardano: "cardano",
  ada: "cardano",
  litecoin: "litecoin",
  ltc: "litecoin",
  "bitcoin cash": "bitcoin-cash",
  bch: "bitcoin-cash",
  chainlink: "chainlink",
  link: "chainlink",
  avalanche: "avalanche-2",
  avax: "avalanche-2",
  tron: "tron",
  trx: "tron",
  polkadot: "polkadot",
  dot: "polkadot",
};

async function getLiveCryptoData(question: string): Promise<string | null> {
  if (!/price|worth|cost|trading at|how much/i.test(question)) return null;
  const ids = new Set<string>();
  for (const [name, id] of Object.entries(COINGECKO_IDS)) {
    if (new RegExp(`\\b${name}\\b`, "i").test(question)) ids.add(id);
  }
  if (ids.size === 0) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${Array.from(ids).join(",")}&vs_currencies=usd&include_24hr_change=true`,
      { signal: controller.signal }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Record<
      string,
      { usd?: number; usd_24h_change?: number }
    >;
    const displayName = (id: string) =>
      Object.keys(COINGECKO_IDS).find((k) => COINGECKO_IDS[k] === id) ?? id;
    const parts = Array.from(ids)
      .map((id) => {
        const p = data[id];
        if (!p || typeof p.usd !== "number") return null;
        const chg =
          typeof p.usd_24h_change === "number"
            ? ` (${p.usd_24h_change >= 0 ? "up" : "down"} ${Math.abs(p.usd_24h_change).toFixed(2)}% in the last 24h)`
            : "";
        return `${displayName(id)}: $${p.usd.toLocaleString("en-US")}${chg}`;
      })
      .filter((p): p is string => !!p);
    if (parts.length === 0) return null;
    const stamp = new Date().toLocaleString("en-US", {
      timeZone: "America/Chicago",
    });
    return `Live market data as of ${stamp} CT: ${parts.join("; ")}.`;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Fast free models, tried in order. Verified present on OpenRouter 2026-09-20.
const FAST_FREE_MODELS = [
  "google/gemma-4-26b-a4b-it:free", // MoE: fast with strong quality
  "nvidia/nemotron-3.5-lightning:free", // latency-optimized
  "liquid/lfm-2.5-2.6b:free", // tiny: fastest, used as last fast resort
];

const ROUTER_MODEL = "openrouter/free";

// How long to wait for one model before trying the next one.
const ATTEMPT_TIMEOUT_MS = 25000;

const SYSTEM_PROMPT = `You are Savyfunds AI, a friendly and knowledgeable financial literacy assistant. Your role is to help young adults (18-35) understand personal finance in simple, practical terms.

IMPORTANT GUIDELINES:
- You are Savyfunds AI, a financial education assistant
- NEVER mention OpenRouter, Qwen, Google, Gemini, OpenAI, GPT, ChatGPT, or any AI company names
- NEVER say "As an AI" - instead say "As your financial assistant"
- Explain concepts clearly without jargon
- Give practical, actionable advice
- Use relatable examples (rent, student loans, first jobs, etc.)
- Be encouraging and supportive
- Keep responses concise but complete (150-300 words ideal)
- Focus on building good financial habits
- If live market data is provided in the context, quote the exact numbers when
  answering price questions and note they are current as of the given time

When answering:
1. Directly address the user's question
2. Provide 2-3 key points they should remember
3. Suggest 1-2 practical action items they can take
4. Mention related topics they might want to learn about

Respond ONLY with a JSON object in this exact format:
{
  "answer": "Your main response here",
  "keyPoints": ["Key point 1", "Key point 2"],
  "actionItems": ["Action 1", "Action 2"],
  "relatedTopics": ["Topic 1", "Topic 2"]
}`;

function extractJson(text: string): string {
  // Strip markdown code fences if the model wraps the JSON in them
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text.trim();
}

async function tryModel(
  apiKey: string,
  model: string,
  userMessage: string
): Promise<SavyFundsAIResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
  try {
    const res = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://www.savyfunds.com",
        "X-Title": "SavyFunds",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1200,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(
        `OpenRouter request failed (${res.status}): ${errText.slice(0, 200)}`
      );
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI service");
    }

    try {
      const parsed = JSON.parse(extractJson(content)) as SavyFundsAIResponse;
      return {
        answer: parsed.answer || content,
        keyPoints: parsed.keyPoints || [],
        actionItems: parsed.actionItems || [],
        relatedTopics: parsed.relatedTopics || [],
      };
    } catch {
      return {
        answer: content,
        keyPoints: [],
        actionItems: [],
        relatedTopics: [],
      };
    }
  } finally {
    clearTimeout(timeout);
  }
}

export async function askSavyFundsAI(
  question: string,
  context?: string
): Promise<SavyFundsAIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY || "";
  if (!apiKey) {
    throw new Error("OpenRouter API key not configured");
  }

  const userMessage = context
    ? `Context: ${context}\n\nQuestion: ${question}`
    : question;

  // Live price lookup: enrich the context so the model quotes real numbers.
  const liveData = await getLiveCryptoData(question);
  const enrichedContext = [liveData, context].filter(Boolean).join("\n\n");
  const enrichedMessage = enrichedContext
    ? `Context: ${enrichedContext}\n\nQuestion: ${question}`
    : question;

  // Fast models first, then the configured router model as fallback.
  const configured = process.env.OPENROUTER_MODEL || ROUTER_MODEL;
  const models = [...FAST_FREE_MODELS, configured].filter(
    (m, i, arr) => arr.indexOf(m) === i
  );

  let lastError: unknown = null;
  for (const model of models) {
    try {
      const result = await tryModel(apiKey, model, enrichedMessage);
      if (model !== models[0]) {
        console.log(`SavyFunds AI answered via fallback model: ${model}`);
      }
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`SavyFunds AI model ${model} failed, trying next:`, error);
    }
  }

  console.error("SavyFunds AI error: all models failed:", lastError);
  throw lastError instanceof Error
    ? lastError
    : new Error("All AI models failed");
}

export function isSavyFundsAIAvailable(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}
