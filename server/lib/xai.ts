import OpenAI from "openai";
import { ExplainConceptResult } from "../concept-explainer";

// Initialize the xAI client using the OpenAI compatibility layer
const openai = new OpenAI({ 
  baseURL: "https://api.x.ai/v1", 
  apiKey: process.env.XAI_API_KEY 
});

/**
 * Explains a financial concept using xAI's Grok model
 * @param concept The financial concept to explain
 * @param experienceLevel The user's financial experience level (beginner, intermediate, advanced)
 * @returns Structured explanation with examples, tips, and further reading
 */
export async function explainFinancialConcept(
  concept: string,
  experienceLevel: string
): Promise<ExplainConceptResult> {
  console.log(`Explaining concept "${concept}" with xAI Grok...`);
  
  const prompt = `
You are a financial advisor specializing in explaining financial concepts to ${experienceLevel} learners.
Explain the concept of "${concept}" clearly and thoroughly.

Format your response as a JSON object with the following keys:
1. "explanation": A clear, concise explanation of ${concept} tailored to a ${experienceLevel} level of understanding
2. "examples": An array of 2-3 practical, real-world examples illustrating the concept
3. "tips": An array of 3-4 actionable tips related to this concept
4. "furtherReading": An array of 3-4 suggested article titles for learning more (do not include URLs)
`;

  try {
    const response = await openai.chat.completions.create({
      model: "grok-2-1212", // Using the most capable text-only model
      messages: [
        {
          role: "system",
          content: "You are a financial education assistant specializing in clear, accurate explanations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the response content
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from xAI Grok");
    }

    const parsedResponse = JSON.parse(content);
    
    // Validate the response has all required fields
    if (!parsedResponse.explanation || !parsedResponse.examples || 
        !parsedResponse.tips || !parsedResponse.furtherReading) {
      throw new Error("Incomplete response from xAI Grok");
    }

    return {
      explanation: parsedResponse.explanation,
      examples: parsedResponse.examples,
      tips: parsedResponse.tips,
      furtherReading: parsedResponse.furtherReading
    };
  } catch (error: any) {
    console.error("Error in xAI Grok explanation:", error);
    throw new Error(`Failed to generate explanation with xAI Grok: ${error.message || 'Unknown error'}`);
  }
}