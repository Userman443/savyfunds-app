import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Define the model and provider types
export type LanguageModelProvider = "openai" | "anthropic" | "google";

interface ModelConfig {
  provider: LanguageModelProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

// Default configuration, using OpenAI GPT-4
const defaultConfig: ModelConfig = {
  provider: "openai",
  model: "gpt-4o",
  temperature: 0.7,
  maxTokens: 1000
};

// Initialize the language model clients - only when needed to avoid errors if keys are missing
let openai: OpenAI | null = null;
let anthropic: Anthropic | null = null;
let googleAi: GoogleGenerativeAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }
  return openai;
}

function getAnthropic(): Anthropic {
  if (!anthropic && process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  if (!anthropic) {
    throw new Error("Anthropic API key not configured");
  }
  return anthropic;
}

function getGoogleAI(): GoogleGenerativeAI {
  if (!googleAi && process.env.GOOGLE_AI_API_KEY) {
    googleAi = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  }
  if (!googleAi) {
    throw new Error("Google AI API key not configured");
  }
  return googleAi;
}



/**
 * Generates a response using the specified language model provider
 * Falls back to alternative providers if the primary one fails
 * 
 * @param query The user query to process
 * @param config Optional configuration for the language model
 * @returns The generated text response
 */
export async function generateAIResponse(
  query: string,
  config: Partial<ModelConfig> = {}
): Promise<{ text: string; provider: string }> {
  // Combine default and user config
  const modelConfig: ModelConfig = { ...defaultConfig, ...config };
  
  // Create system prompt for financial expertise
  const systemPrompt = `You are SavyFunds AI, a financial literacy assistant focused on helping young people understand personal finance and money management. 
  
Provide clear, educational responses to financial questions with simple explanations and relatable examples. Favor practical advice over technical jargon.

When appropriate, explain concepts considering the user may be from anywhere in the world, including regions with different financial systems.

Important guidelines:
- Be conversational but informative
- Avoid overly complex financial terms without explanation
- Keep responses concise (maximum 3-4 paragraphs)
- Never recommend specific investments or make market predictions
- If asked about something outside of finance, politely redirect to financial topics
- Emphasize financial literacy fundamentals for young people
`;

  // Attempt to use the primary provider first, then fall back to others
  try {
    return await callLanguageModel(query, systemPrompt, modelConfig);
  } catch (error) {
    console.error(`Error with ${modelConfig.provider}:`, error);
    
    // Fallback to alternative providers
    const fallbackProviders = ["anthropic", "openai", "google"]
      .filter(p => p !== modelConfig.provider) as LanguageModelProvider[];
    
    // Try each fallback provider
    for (const provider of fallbackProviders) {
      try {
        const fallbackConfig = { ...modelConfig, provider };
        return await callLanguageModel(query, systemPrompt, fallbackConfig);
      } catch (fallbackError) {
        console.error(`Fallback to ${provider} failed:`, fallbackError);
      }
    }
    
    // If all providers fail, return a graceful error message
    return {
      text: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
      provider: "error"
    };
  }
}

/**
 * Call the specified language model provider with the query
 */
async function callLanguageModel(
  query: string,
  systemPrompt: string,
  config: ModelConfig
): Promise<{ text: string; provider: string }> {
  switch (config.provider) {
    case "openai":
      return callOpenAI(query, systemPrompt, config);
    case "anthropic":
      return callAnthropic(query, systemPrompt, config);
    case "google": 
      return callGoogleAI(query, systemPrompt, config);

    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  query: string,
  systemPrompt: string,
  config: ModelConfig
): Promise<{ text: string; provider: string }> {
  try {
    const openaiClient = getOpenAI();
    const completion = await openaiClient.chat.completions.create({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 1000
    });

    return {
      text: completion.choices[0].message.content || "No response generated",
      provider: "openai"
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
}

/**
 * Call Anthropic API
 */
async function callAnthropic(
  query: string,
  systemPrompt: string,
  config: ModelConfig
): Promise<{ text: string; provider: string }> {
  try {
    const anthropicClient = getAnthropic();
    const message = await anthropicClient.messages.create({
      model: "claude-3-7-sonnet-20250219", // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
      max_tokens: config.maxTokens || 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: query }]
    });

    // Handle the response properly - accessing content array
    const textContent = message.content[0].type === "text" 
      ? message.content[0].text 
      : "No text response generated";

    return {
      text: textContent,
      provider: "anthropic"
    };
  } catch (error) {
    console.error("Anthropic API error:", error);
    throw error;
  }
}

/**
 * Call Google AI API
 */
async function callGoogleAI(
  query: string,
  systemPrompt: string,
  config: ModelConfig
): Promise<{ text: string; provider: string }> {
  try {
    const googleAiClient = getGoogleAI();
    const model = googleAiClient.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `${systemPrompt}\n\nUser question: ${query}`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    
    return {
      text: response.text(),
      provider: "google"
    };
  } catch (error) {
    console.error("Google AI API error:", error);
    throw error;
  }
}

