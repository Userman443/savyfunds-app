import Anthropic from '@anthropic-ai/sdk';
import { FinancialProfile } from './openai';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateFinancialPlan(
  userProfile: FinancialProfile
): Promise<{
  overview: string;
  shortTerm: { goal: string, actions: string[] }[];
  mediumTerm: { goal: string, actions: string[] }[];
  longTerm: { goal: string, actions: string[] }[];
}> {
  try {
    const contextStr = Object.entries(userProfile || {})
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
      .join(", ");
    
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      system: `You are a financial planning expert. Create a comprehensive financial plan for the user based on their profile.
      The plan should include an overview paragraph and specific action items organized into short-term (0-12 months),
      medium-term (1-5 years), and long-term (5+ years) goals. For each timeframe, include 2-3 goals, each with 2-4 specific action steps.
      Format your response as JSON that strictly follows this structure:
      {
        "overview": "Brief overview paragraph of the financial plan",
        "shortTerm": [
          {
            "goal": "Short-term goal description",
            "actions": ["Action 1", "Action 2", "Action 3"]
          }
        ],
        "mediumTerm": [
          {
            "goal": "Medium-term goal description",
            "actions": ["Action 1", "Action 2", "Action 3"]
          }
        ],
        "longTerm": [
          {
            "goal": "Long-term goal description",
            "actions": ["Action 1", "Action 2", "Action 3"]
          }
        ]
      }`,
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `Create a financial plan for me based on this profile: ${contextStr}`
        }
      ],
    });

    const jsonStr = response.content[0].text;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error generating financial plan with Anthropic:", error);
    throw new Error("Error generating financial plan. Please try again later.");
  }
}

export async function generateRegionalizedAdvice(
  userProfile: FinancialProfile,
  topic: string
): Promise<{
  advice: string;
  regionalSpecifics: { title: string, description: string }[];
  resources: { name: string, description: string }[];
}> {
  try {
    const contextStr = Object.entries(userProfile || {})
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
      .join(", ");

    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      system: `You are a financial advisor with expertise in regional financial systems worldwide.
      Provide advice on the requested financial topic, tailored specifically to the user's country and financial situation.
      Include region-specific considerations and recommend local resources where appropriate.
      Format your response as JSON with the following structure:
      {
        "advice": "Main advice text, 150-200 words",
        "regionalSpecifics": [
          {
            "title": "Title of regional consideration",
            "description": "Brief explanation of how this applies to their region"
          }
        ],
        "resources": [
          {
            "name": "Name of resource",
            "description": "Brief description of resource and how it can help"
          }
        ]
      }`,
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Provide advice on ${topic} based on my profile: ${contextStr}`
        }
      ],
    });

    const jsonStr = response.content[0].text;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error generating regionalized advice with Anthropic:", error);
    throw new Error("Error generating regionalized advice. Please try again later.");
  }
}

export async function explainFinancialConcept(
  concept: string,
  experienceLevel: string
): Promise<{
  explanation: string;
  examples: string[];
  tips: string[];
  furtherReading: string[];
}> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      system: `You are a financial educator who excels at explaining complex financial concepts in simple terms.
      Explain the requested financial concept at the appropriate level for the user's experience.
      Format your response as JSON with the following structure:
      {
        "explanation": "Clear explanation of the concept in 100-150 words",
        "examples": ["Example 1 showing the concept in action", "Example 2 showing the concept in action"],
        "tips": ["Practical tip related to the concept", "Another practical tip"],
        "furtherReading": ["Suggestion for further reading on this topic", "Another resource suggestion"]
      }`,
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `Explain the concept of "${concept}" at a ${experienceLevel} level`
        }
      ],
    });

    const jsonStr = response.content[0].text;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error explaining financial concept with Anthropic:", error);
    throw new Error("Error explaining financial concept. Please try again later.");
  }
}