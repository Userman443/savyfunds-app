/**
 * SavyFunds AI Service
 *
 * Uses Google's Gemini API (free tier key from Google AI Studio) for
 * intelligent financial responses. No paid AI subscription required.
 * The AI provider branding is hidden - responses appear as "SavyFunds AI".
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

export interface SavyFundsAIResponse {
  answer: string;
  keyPoints?: string[];
  actionItems?: string[];
  relatedTopics?: string[];
}

const SYSTEM_PROMPT = `You are SavyFunds AI, a friendly and knowledgeable financial literacy assistant. Your role is to help young adults (18-35) understand personal finance in simple, practical terms.

IMPORTANT GUIDELINES:
- You are SavyFunds AI, a financial education assistant
- NEVER mention Google, Gemini, OpenAI, GPT, ChatGPT, or any AI company names
- NEVER say "As an AI" - instead say "As your financial assistant"
- Explain concepts clearly without jargon
- Give practical, actionable advice
- Use relatable examples (rent, student loans, first jobs, etc.)
- Be encouraging and supportive
- Keep responses concise but complete (150-300 words ideal)
- Focus on building good financial habits

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

export async function askSavyFundsAI(
  question: string,
  context?: string
): Promise<SavyFundsAIResponse> {
  try {
    const model = genAI.getGenerativeModel({
      // gemini-2.5-flash was retired by Google (404 for new API keys);
      // gemini-3.6-flash is the current free-tier flash model.
      model: "gemini-3.6-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const userMessage = context
      ? `Context: ${context}\n\nQuestion: ${question}`
      : question;

    const result = await model.generateContent(
      `${SYSTEM_PROMPT}\n\n---\n\n${userMessage}`
    );
    const content = result.response.text();
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
  } catch (error) {
    console.error("SavyFunds AI error:", error);
    throw error;
  }
}

export function isSavyFundsAIAvailable(): boolean {
  return !!process.env.GOOGLE_AI_API_KEY;
}
