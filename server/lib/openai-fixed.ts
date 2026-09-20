import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type FinancialProfile = {
  age?: string;
  experienceLevel?: string;
  financialGoals?: string[];
  income?: number;
  country?: string;
  risk_tolerance?: string;
  existing_investments?: string[];
};

export async function generateAIFinancialAdvice(
  question: string,
  userContext: FinancialProfile
): Promise<string> {
  try {
    const contextStr = Object.entries(userContext || {})
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
      .join(", ");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a specialized financial advisor focusing on financial literacy and education. 
          Provide practical, actionable advice tailored to the user's specific financial situation. 
          Use simple language that is easy to understand even for beginners.
          Keep responses concise (maximum 250 words) but comprehensive.
          Always consider the user's financial context in your answers.
          
          User's financial profile: ${contextStr}`
        },
        {
          role: "user",
          content: question
        }
      ],
      max_tokens: 500
    });

    return response.choices[0].message.content ?? "I couldn't generate a response at this time. Please try again later.";
  } catch (error) {
    console.error("Error generating financial advice with OpenAI:", error);
    throw new Error("Error generating AI response. Please try again later.");
  }
}

export async function generatePersonalizedLearningPath(
  userProfile: FinancialProfile
): Promise<{
  path: {
    title: string;
    description: string;
    difficulty: string;
    estimatedTime: string;
    topics: string[];
  }[];
  summary: string;
}> {
  try {
    const contextStr = Object.entries(userProfile || {})
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
      .join(", ");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Create a personalized financial learning path for the user based on their financial profile.
          The path should consist of 3-5 sequential learning modules that build on each other.
          Each module should have a title, brief description, difficulty level, estimated completion time, and list of topics covered.
          Also include a brief summary paragraph explaining why this path is appropriate for their specific situation.
          Format the response as JSON following this exact structure:
          {
            "path": [
              {
                "title": "Module title",
                "description": "Brief description",
                "difficulty": "Beginner/Intermediate/Advanced",
                "estimatedTime": "X hours/weeks",
                "topics": ["Topic 1", "Topic 2", "Topic 3"]
              }
            ],
            "summary": "Explanation of why this learning path fits their needs"
          }`
        },
        {
          role: "user",
          content: `Create a personalized financial learning path for me based on this profile: ${contextStr}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000
    });

    const content = response.choices[0].message.content ?? "{}";
    const result = JSON.parse(content);
    return result;
  } catch (error) {
    console.error("Error generating learning path with OpenAI:", error);
    
    // Fallback if API fails
    return {
      path: [
        {
          title: "Financial Basics",
          description: "Fundamental financial concepts for beginners",
          difficulty: "Beginner",
          estimatedTime: "2 weeks",
          topics: ["Budgeting", "Saving", "Financial Goals"]
        },
        {
          title: "Building Security",
          description: "Creating financial security for your future",
          difficulty: "Beginner",
          estimatedTime: "3 weeks",
          topics: ["Emergency Fund", "Debt Management", "Credit Scores"]
        },
        {
          title: "Growing Wealth",
          description: "Introduction to investing and wealth building",
          difficulty: "Intermediate",
          estimatedTime: "4 weeks",
          topics: ["Investment Basics", "Retirement Planning", "Risk Management"]
        }
      ],
      summary: "This learning path covers essential financial knowledge in a progressive sequence."
    };
  }
}

export async function generateFinancialHealthAssessment(
  userProfile: FinancialProfile
): Promise<{
  score: number;
  assessment: string;
  recommendations: string[];
  emoji: string;
}> {
  try {
    const contextStr = Object.entries(userProfile || {})
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
      .join(", ");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Assess the user's financial health based on their profile.
          Provide a score from 1-10 (10 being excellent financial health), a brief assessment,
          3 specific recommendations for improvement, and select one emoji that best represents their current financial status.
          The emoji should be from this set: 😊 (good), 😐 (neutral), 😟 (concerned), 🚀 (growth), 💰 (saving), 🛡️ (security).
          Format the response as JSON with the following structure:
          {
            "score": number,
            "assessment": "Brief assessment of financial health",
            "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
            "emoji": "Single emoji representing their financial status"
          }`
        },
        {
          role: "user",
          content: `Assess my financial health based on this profile: ${contextStr}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500
    });

    const content = response.choices[0].message.content ?? "{}";
    const result = JSON.parse(content);
    return result;
  } catch (error) {
    console.error("Error generating financial health assessment with OpenAI:", error);
    
    // Fallback if API fails
    return {
      score: 5,
      assessment: "Based on the limited information available, your financial health appears average.",
      recommendations: [
        "Consider building an emergency fund if you don't have one",
        "Review your budget to identify potential savings",
        "Focus on paying down high-interest debt if applicable"
      ],
      emoji: "😐"
    };
  }
}