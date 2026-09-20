import OpenAI from "openai";

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

export interface FinancialAIResponse {
  answer: string;
  keyPoints?: string[];
  actionItems?: string[];
  relatedTopics?: string[];
}

export async function askFinancialQuestion(
  question: string,
  context?: string
): Promise<FinancialAIResponse> {
  try {
    const systemPrompt = `You are SavyFunds AI, a friendly and knowledgeable financial literacy assistant. Your role is to help young adults (18-35) understand personal finance in simple, practical terms.

Guidelines:
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

Format your response as JSON:
{
  "answer": "Your main response here",
  "keyPoints": ["Key point 1", "Key point 2"],
  "actionItems": ["Action 1", "Action 2"],
  "relatedTopics": ["Topic 1", "Topic 2"]
}`;

    const userMessage = context
      ? `Context: ${context}\n\nQuestion: ${question}`
      : question;

    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from DeepSeek");
    }

    try {
      const parsed = JSON.parse(content) as FinancialAIResponse;
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
    console.error("DeepSeek API error:", error);
    throw error;
  }
}

export async function isDeepSeekAvailable(): Promise<boolean> {
  if (!process.env.DEEPSEEK_API_KEY) {
    return false;
  }
  
  try {
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: "Hi" }],
      max_tokens: 5,
    });
    return !!response.choices[0]?.message?.content;
  } catch {
    return false;
  }
}
