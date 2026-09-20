import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

export type FinancialProfile = {
  age?: string;
  experienceLevel?: string;
  financialGoals?: string[];
  income?: number;
  country?: string;
  risk_tolerance?: string;
  existing_investments?: string[];
};

/**
 * Generates AI financial advice based on user context and query
 */
export async function generateAIFinancialAdvice(
  query: string,
  userContext: FinancialProfile
): Promise<string> {
  try {
    const contextString = `
User profile:
- Age: ${userContext.age || "Not specified"}
- Experience level: ${userContext.experienceLevel || "Not specified"}
- Financial goals: ${userContext.financialGoals?.join(", ") || "Not specified"}
- Monthly income: ${userContext.income ? `$${userContext.income}` : "Not specified"}
- Country: ${userContext.country || "Not specified"}
- Risk tolerance: ${userContext.risk_tolerance || "Not specified"}
- Existing investments: ${userContext.existing_investments?.join(", ") || "None"}
    `;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a friendly, supportive financial advisor for the savyfunds app. Your job is to provide clear, 
          jargon-free financial advice to users based on their profile and query. Tailor your responses to their experience 
          level, age, and financial goals. Keep explanations concise (under 250 words) and practical. Focus on actionable 
          advice that is realistic for their situation. Always be encouraging and emphasize that financial literacy is 
          a journey, not a race.`
        },
        {
          role: "user",
          content: `${contextString}\n\nUser query: ${query}`
        }
      ],
      max_tokens: 500
    });

    return response.choices[0].message.content || "I couldn't generate advice for that query. Please try again with a different question.";
  } catch (error) {
    console.error("Error generating AI financial advice with OpenAI:", error);
    throw new Error("Failed to generate AI financial advice. Please try again later.");
  }
}

/**
 * Generates a personalized learning path for the user based on their profile
 */
export async function generatePersonalizedLearningPath(
  userProfile: FinancialProfile
): Promise<{
  modules: { title: string; description: string; priority: number }[];
  reasoning: string;
}> {
  try {
    const contextString = `
User profile:
- Age: ${userProfile.age || "Not specified"}
- Experience level: ${userProfile.experienceLevel || "Not specified"}
- Financial goals: ${userProfile.financialGoals?.join(", ") || "Not specified"}
- Monthly income: ${userProfile.income ? `$${userProfile.income}` : "Not specified"}
- Country: ${userProfile.country || "Not specified"}
    `;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are an educational AI for the savyfunds financial literacy app. Your task is to create a personalized 
          learning path for users based on their profile. Generate a structured list of 5 recommended learning modules and 
          explain the reasoning behind your recommendations.`
        },
        {
          role: "user",
          content: `${contextString}\n\nBased on this user profile, generate a personalized financial learning path with 5 
          modules that would benefit them most. For each module, provide a title, brief description, and priority level (1-5, 
          with 1 being highest priority). Also provide the reasoning behind these recommendations.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000
    });

    const content = response.choices[0].message.content || "";
    const parsedData = JSON.parse(content);

    return {
      modules: parsedData.modules || [],
      reasoning: parsedData.reasoning || ""
    };
  } catch (error) {
    console.error("Error generating personalized learning path with OpenAI:", error);
    throw new Error("Failed to generate a personalized learning path. Please try again later.");
  }
}

/**
 * Generates a financial health assessment based on the user's profile
 */
export async function generateFinancialHealthAssessment(
  userProfile: FinancialProfile
): Promise<{
  assessment: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}> {
  try {
    const contextString = `
User profile:
- Age: ${userProfile.age || "Not specified"}
- Experience level: ${userProfile.experienceLevel || "Not specified"}
- Financial goals: ${userProfile.financialGoals?.join(", ") || "Not specified"}
- Monthly income: ${userProfile.income ? `$${userProfile.income}` : "Not specified"}
- Country: ${userProfile.country || "Not specified"}
- Risk tolerance: ${userProfile.risk_tolerance || "Not specified"}
- Existing investments: ${userProfile.existing_investments?.join(", ") || "None"}
    `;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a financial health assessment AI for the savyfunds app. Your task is to analyze a user's financial 
          profile and provide a helpful assessment of their financial health. Identify strengths, weaknesses, and provide 
          practical recommendations. Be supportive and constructive, avoiding judgment.`
        },
        {
          role: "user",
          content: `${contextString}\n\nBased on this user profile, provide a financial health assessment including an overall 
          assessment paragraph, a list of financial strengths, a list of financial weaknesses or areas for improvement, and 
          3-5 specific recommendations to improve their financial health.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000
    });

    const content = response.choices[0].message.content || "";
    const parsedData = JSON.parse(content);

    return {
      assessment: parsedData.assessment || "",
      strengths: parsedData.strengths || [],
      weaknesses: parsedData.weaknesses || [],
      recommendations: parsedData.recommendations || []
    };
  } catch (error) {
    console.error("Error generating financial health assessment with OpenAI:", error);
    throw new Error("Failed to generate a financial health assessment. Please try again later.");
  }
}

/**
 * Explains a financial concept for users
 */
export async function explainFinancialConcept(
  concept: string, 
  experienceLevel: string = "Beginner"
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a friendly financial education assistant for the savyfunds app. Your task is to explain 
          financial concepts clearly and accurately at the appropriate level for the user. Format your explanations 
          in the following structure:
          
          1. A clear explanation of the concept (2-3 sentences)
          2. A section labeled "Examples:" with 1-2 real-world examples
          3. A section labeled "Tips:" with 2-3 practical tips for applying this knowledge
          4. A section labeled "Further Reading:" with 3-4 suggested topics or resources (just the titles)
          
          Keep your entire explanation under 300 words and tailor it to the user's experience level.`
        },
        {
          role: "user",
          content: `Please explain the concept of "${concept}" at a ${experienceLevel} level.`
        }
      ],
      max_tokens: 500
    });

    return response.choices[0].message.content || "I couldn't generate an explanation for that concept. Please try again with a different concept.";
  } catch (error) {
    console.error("Error explaining financial concept with OpenAI:", error);
    throw new Error("Error explaining financial concept. Please try again later.");
  }
}