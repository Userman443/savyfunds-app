import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type { ExplainConceptResult } from '../concept-explainer';
import type { FinancialProfile } from './openai';

// Initialize the Google AI client
const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

/**
 * Explains a financial concept using Google's Gemini model
 * @param concept The financial concept to explain
 * @param experienceLevel The user's financial experience level (beginner, intermediate, advanced)
 * @returns Structured explanation with examples, tips, and further reading
 */
export async function explainFinancialConcept(
  concept: string,
  experienceLevel: string = 'beginner'
): Promise<ExplainConceptResult> {
  try {
    // Use the Gemini Pro model
    const model = googleAI.getGenerativeModel({ model: 'gemini-pro' });

    // Create a structured prompt
    const prompt = `Explain the financial concept of "${concept}" to someone with ${experienceLevel} level financial knowledge.
    
    Format your response in the following way:
    
    First, provide a clear, concise explanation of the concept. 
    
    Then, include 2-3 practical examples that illustrate the concept in real-world situations.
    
    Next, offer 3-4 actionable tips related to this concept.
    
    Finally, suggest 2-3 topics for further reading related to this concept.
    
    Return your response in a structured format with clear sections for the explanation, examples, tips, and further reading.`;

    // Generate the response
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Parse the response into our expected format
    return parseGoogleAIResponse(response);
  } catch (error: unknown) {
    console.error('Error with Google AI explanation:', error);
    throw new Error(`Google AI explanation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate personalized financial learning path using Google's Gemini model
 * @param userProfile The user's financial profile
 * @returns A personalized learning path
 */
export async function generatePersonalizedLearningPath(
  userProfile: FinancialProfile
): Promise<string> {
  try {
    const model = googleAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Create a personalized financial learning path for a user with the following profile:
    
    Age: ${userProfile.age || 'Not specified'}
    Financial Experience Level: ${userProfile.experienceLevel || 'Beginner'}
    Financial Goals: ${userProfile.financialGoals?.join(', ') || 'Not specified'}
    Income Level: ${userProfile.income ? `$${userProfile.income}/year` : 'Not specified'}
    Country: ${userProfile.country || 'Not specified'}
    Risk Tolerance: ${userProfile.risk_tolerance || 'Not specified'}
    Existing Investments: ${userProfile.existing_investments?.join(', ') || 'None'}
    
    Provide a structured learning path with 5-7 topics they should learn about, in order from basic to advanced, based on their profile. For each topic, include a brief explanation of why it's relevant to them specifically.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: unknown) {
    console.error('Error generating learning path with Google AI:', error);
    throw new Error(`Google AI learning path generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate financial advice using Google's Gemini model based on user profile and query
 * @param query The user's financial question
 * @param userContext The user's financial profile
 * @returns AI-generated financial advice
 */
export async function generateAIFinancialAdvice(
  query: string,
  userContext: FinancialProfile
): Promise<string> {
  try {
    const model = googleAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `You are a helpful financial assistant. The user has the following profile:
    
    Age: ${userContext.age || 'Not specified'}
    Financial Experience Level: ${userContext.experienceLevel || 'Beginner'}
    Financial Goals: ${userContext.financialGoals?.join(', ') || 'Not specified'}
    Income Level: ${userContext.income ? `$${userContext.income}/year` : 'Not specified'}
    Country: ${userContext.country || 'Not specified'}
    Risk Tolerance: ${userContext.risk_tolerance || 'Not specified'}
    Existing Investments: ${userContext.existing_investments?.join(', ') || 'None'}
    
    Based on this profile, please provide helpful, personalized financial advice in response to their question:
    
    "${query}"
    
    Important: If this question requires professional advice from a certified financial planner, tax advisor, or lawyer, mention this in your response while still providing general guidance.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: unknown) {
    console.error('Error generating financial advice with Google AI:', error);
    throw new Error(`Google AI financial advice generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parses the string response from Google AI into the structured ExplainConceptResult format
 */
function parseGoogleAIResponse(response: string): ExplainConceptResult {
  let explanation = "";
  const examples: string[] = [];
  const tips: string[] = [];
  const furtherReading: string[] = [];
  
  // Simple parsing of the response
  const sections = response.split('\n\n');
  
  if (sections.length > 0) {
    explanation = sections[0];
  }
  
  let currentSection = '';
  
  for (const section of sections) {
    const lowerSection = section.toLowerCase();
    
    if (lowerSection.includes('example') || lowerSection.includes('practical application')) {
      currentSection = 'examples';
      const lines = section.split('\n').filter(line => line.trim().length > 0);
      // Skip the header line if it contains "example"
      const startIndex = lines[0].toLowerCase().includes('example') ? 1 : 0;
      examples.push(...lines.slice(startIndex));
    } 
    else if (lowerSection.includes('tip') || lowerSection.includes('advice') || lowerSection.includes('action')) {
      currentSection = 'tips';
      const lines = section.split('\n').filter(line => line.trim().length > 0);
      // Skip the header line if it contains "tip"
      const startIndex = lines[0].toLowerCase().includes('tip') ? 1 : 0;
      tips.push(...lines.slice(startIndex));
    } 
    else if (lowerSection.includes('further reading') || lowerSection.includes('learn more') || lowerSection.includes('resources')) {
      currentSection = 'furtherReading';
      const lines = section.split('\n').filter(line => line.trim().length > 0);
      // Skip the header line if it contains "reading"
      const startIndex = lines[0].toLowerCase().includes('reading') ? 1 : 0;
      furtherReading.push(...lines.slice(startIndex));
    }
    else if (explanation === "" && !lowerSection.includes('example') && !lowerSection.includes('tip') && !lowerSection.includes('further reading')) {
      explanation = section;
    }
  }
  
  return { 
    explanation, 
    examples: examples.map(ex => ex.trim()).filter(ex => ex.length > 0), 
    tips: tips.map(tip => tip.trim()).filter(tip => tip.length > 0), 
    furtherReading: furtherReading.map(reading => reading.trim()).filter(reading => reading.length > 0) 
  };
}