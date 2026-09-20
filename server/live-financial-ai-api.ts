/**
 * Live Financial AI API
 * Connects to language model APIs to provide AI-powered financial guidance
 */

import { generateAIResponse } from './language-model-service';
import { findRelevantAnswers } from './financial-qa-database';

interface AiResponse {
  answer: string;
  sources?: {
    title: string;
    link?: string;
  }[];
  provider?: string;
}

/**
 * Generate a response to financial questions using live AI models
 * with fallback to the pre-compiled database if API calls fail
 * 
 * @param query The user's financial question
 * @returns An object containing the answer and optional sources
 */
export async function generateLiveFinancialAiResponse(query: string): Promise<AiResponse> {
  try {
    // Try to generate a response using the language model service
    const aiResponse = await generateAIResponse(query);
    
    // Return the AI-generated response
    return {
      answer: aiResponse.text,
      provider: aiResponse.provider
    };
  } catch (error) {
    console.error("Error generating live AI response:", error);
    
    // Fall back to the pre-compiled database if the API call fails
    const relevantAnswers = findRelevantAnswers(query, 1);
    
    if (relevantAnswers.length > 0) {
      return {
        answer: relevantAnswers[0].answer,
        sources: [{ title: relevantAnswers[0].question }],
        provider: "database"
      };
    } else {
      return {
        answer: "I apologize, but I couldn't generate a response at this time. Please try again later or ask a different question.",
        provider: "error"
      };
    }
  }
}