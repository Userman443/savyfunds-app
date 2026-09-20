/**
 * SavyFunds AI orchestration layer.
 *
 * All AI features run on Google Gemini (free tier) via ./lib/savyfunds-ai.
 * No OpenAI or Anthropic clients are constructed here: those SDKs throw at
 * import time when their API keys are absent, which crashed the server on
 * startup. Every function degrades gracefully when the Gemini key is unset.
 */
import { askSavyFundsAI, isSavyFundsAIAvailable } from "./lib/savyfunds-ai";

export type FinancialProfile = {
  age?: string;
  experienceLevel?: string;
  financialGoals?: string[];
  income?: number;
  country?: string;
  risk_tolerance?: string;
  existing_investments?: string[];
};

// Helper function to convert nullable fields to undefined
// This helps with TypeScript compatibility between database models and AI functions
export function sanitizeProfile(profile: any): FinancialProfile {
  return {
    age: profile.age || undefined,
    experienceLevel: profile.experienceLevel || undefined,
    financialGoals: profile.financialGoals || undefined,
    income: profile.income || undefined,
    country: profile.country || undefined,
    risk_tolerance: profile.risk_tolerance || undefined,
    existing_investments: profile.existing_investments || undefined,
  };
}

function profileContext(userContext: FinancialProfile): string {
  const parts: string[] = [];
  if (userContext.age) parts.push(`Age: ${userContext.age}`);
  if (userContext.experienceLevel) parts.push(`Experience level: ${userContext.experienceLevel}`);
  if (userContext.financialGoals?.length) parts.push(`Financial goals: ${userContext.financialGoals.join(", ")}`);
  if (userContext.income) parts.push(`Monthly income: $${userContext.income}`);
  if (userContext.country) parts.push(`Country: ${userContext.country}`);
  if (userContext.risk_tolerance) parts.push(`Risk tolerance: ${userContext.risk_tolerance}`);
  if (userContext.existing_investments?.length) parts.push(`Existing investments: ${userContext.existing_investments.join(", ")}`);
  return parts.length ? parts.join("\n") : "No profile details provided.";
}

/** Ask Gemini for a JSON answer; returns null when unavailable or unparsable. */
async function askGeminiJson(prompt: string): Promise<any | null> {
  if (!isSavyFundsAIAvailable()) return null;
  try {
    const res = await askSavyFundsAI(prompt);
    const text = res.answer || "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    return JSON.parse(text.slice(start, end + 1));
  } catch (error) {
    console.error("Gemini JSON request failed:", error);
    return null;
  }
}

// Generate AI response to financial questions using Gemini
export async function generateAIResponse(
  question: string,
  userContext: FinancialProfile
): Promise<string> {
  try {
    // Try the concept explainer first (local DB + Gemini/Perplexity providers)
    try {
      console.log(`Attempting to answer question "${question}" via concept explainer...`);
      const result = await explainConcept(question, userContext.experienceLevel || 'Beginner', userContext.country);
      return `${result.explanation}\n\nExamples:\n${result.examples.join('\n')}\n\nTips:\n${result.tips.join('\n')}\n\nFurther Reading:\n${result.furtherReading.join('\n')}`;
    } catch (error) {
      console.error("Concept explainer failed, trying SavyFunds AI:", error);
    }

    if (isSavyFundsAIAvailable()) {
      const res = await askSavyFundsAI(
        question,
        `User profile:\n${profileContext(userContext)}`
      );
      const parts = [res.answer];
      if (res.keyPoints?.length) parts.push(`\nKey points:\n${res.keyPoints.map((k) => `- ${k}`).join("\n")}`);
      if (res.actionItems?.length) parts.push(`\nAction items:\n${res.actionItems.map((a) => `- ${a}`).join("\n")}`);
      return parts.join("\n");
    }
    throw new Error("AI service not configured");
  } catch (error) {
    console.error("Error generating AI response:", error);

    // Enhanced fallback responses for common financial questions
    const responses: Record<string, string> = {
      "how much should i save each month":
        `Based on your experience level (${userContext.experienceLevel || 'Beginner'}) and age group (${userContext.age || 'young adult'}), I recommend starting with 15-20% of your income. ${userContext.financialGoals?.includes('Build emergency fund') ? 'Since building an emergency fund is one of your goals, focus on that first until you have 3-6 months of expenses saved.' : 'Consider building an emergency fund first until you have 3-6 months of expenses saved.'}`,

      "what is an emergency fund":
        "An emergency fund is money set aside to cover unexpected expenses or financial emergencies. Ideally, it should cover 3-6 months of your essential expenses and be kept in an easily accessible account like a high-yield savings account.",

      "how do i create a budget":
        "To create a budget, start by tracking your income and expenses for a month. Then, categorize your spending and set limits for each category. A simple approach is the 50/30/20 rule: 50% for necessities, 30% for wants, and 20% for savings and debt repayment.",

      "how can i save money":
        "You can save money by tracking your spending, cutting unnecessary expenses, automating your savings, reducing subscription services, meal planning to reduce food waste, and finding more affordable alternatives for things you regularly use.",

      "what are stocks":
        "Stocks represent ownership in a company. When you buy a stock, you're purchasing a small piece of that company. The value of your stock will rise or fall based on the company's performance and market conditions. Stocks are considered higher-risk, higher-reward investments compared to options like bonds or savings accounts.",

      "student debt":
        "Student debt refers to money borrowed to pay for educational expenses. Managing student debt effectively involves understanding your loan terms, exploring repayment options (like income-driven repayment plans), and potentially seeking forgiveness programs if you qualify.\n\nExamples:\n- Federal student loans typically offer more flexible repayment options than private loans\n- Some employers offer student loan repayment assistance as an employee benefit\n\nTips:\n- Make payments on time to avoid penalties and negative credit impacts\n- Consider refinancing if you can qualify for a lower interest rate\n- Look into forgiveness programs if you work in public service\n\nFurther Reading:\n- Federal Student Aid website (studentaid.gov)\n- Student Loan Repayment Strategies Guide\n- Tax Benefits for Education: IRS Publication 970",

      "student loans":
        "Student loans are funds borrowed to pay for higher education costs that must be repaid with interest. There are two main types: federal student loans (issued by the government) and private student loans (from banks or other financial institutions).\n\nExamples:\n- Federal loans offer benefits like income-driven repayment and potential forgiveness options\n- Private loans typically require good credit or a co-signer\n\nTips:\n- Exhaust all federal loan options before considering private loans\n- Understand the difference between subsidized loans (government pays interest while you're in school) and unsubsidized loans\n- Consider the long-term affordability of payments based on your expected career path\n\nFurther Reading:\n- Federal vs. Private Student Loans Comparison\n- Student Loan Repayment Options Guide\n- How to Apply for Federal Student Aid",

      "college debt":
        "College debt typically refers to student loans taken to finance higher education. These loans cover tuition, books, housing, and other educational expenses. The average college graduate in the US has around $30,000 in student loan debt.\n\nExamples:\n- A nursing student might graduate with $25,000 in federal loans but qualify for forgiveness by working in an underserved area\n- Many graduate programs like law or medical school can result in six-figure debt\n\nTips:\n- Apply for scholarships and grants before taking loans\n- Consider starting at a community college to reduce costs\n- Work part-time during school to minimize borrowing\n- Understand the total cost of your loan including interest over time\n\nFurther Reading:\n- College Financing Options Beyond Student Loans\n- Managing Student Debt After Graduation\n- Public Service Loan Forgiveness Program"
    };

    // Simple logic to match the question to a response
    const normalizedQuestion = question.toLowerCase().trim();

    // Try to find an exact match
    if (responses[normalizedQuestion]) {
      return responses[normalizedQuestion];
    }

    // Try to find a partial match
    for (const [key, response] of Object.entries(responses)) {
      if (normalizedQuestion.includes(key)) {
        return response;
      }
    }

    // Check for specific topic categories with more generic answers
    if (normalizedQuestion.includes("debt") || normalizedQuestion.includes("loan")) {
      return "Debt management is an important financial skill. The key principles include understanding the terms of your loans, prioritizing high-interest debt first, making payments on time, and creating a sustainable repayment plan.\n\nExamples:\n- Credit card debt typically has high interest rates and should usually be paid off before lower-interest debt\n- Using debt consolidation to combine multiple debts into one loan with a lower interest rate\n\nTips:\n- Create a list of all your debts with their interest rates, minimum payments, and balances\n- Consider the avalanche method (paying highest interest first) or snowball method (paying smallest balances first)\n- Contact lenders if you're struggling to make payments - many offer hardship programs\n\nFurther Reading:\n- Debt Repayment Strategies Guide\n- How to Improve Your Credit Score While Paying Off Debt\n- Understanding Good Debt vs. Bad Debt";
    }

    if (normalizedQuestion.includes("invest") || normalizedQuestion.includes("stock") || normalizedQuestion.includes("bond") || normalizedQuestion.includes("etf")) {
      return "Investing involves putting money into assets with the expectation they'll grow in value over time. Common investment vehicles include stocks, bonds, ETFs, mutual funds, and real estate.\n\nExamples:\n- Index funds that track the overall market provide diversification with low fees\n- Dollar-cost averaging (investing a fixed amount regularly) can reduce the impact of market volatility\n\nTips:\n- Start with an emergency fund before investing\n- Consider your time horizon and risk tolerance when choosing investments\n- Diversification across different asset classes can help manage risk\n\nFurther Reading:\n- Beginner's Guide to Investment Types\n- How to Build a Diversified Portfolio\n- Understanding Investment Risk and Return";
    }

    if (normalizedQuestion.includes("save") || normalizedQuestion.includes("saving")) {
      return "Saving money is fundamental to financial stability and achieving your goals. Effective saving starts with setting clear objectives, creating a budget that includes savings, and automating the process.\n\nExamples:\n- Setting up automatic transfers to a dedicated savings account on payday\n- Using the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and debt repayment\n\nTips:\n- Start with an emergency fund of 3-6 months of expenses\n- Look for high-yield savings accounts to earn more interest\n- Set specific, measurable savings goals with deadlines\n- Review and cut unnecessary expenses to increase saving capacity\n\nFurther Reading:\n- Best Places to Keep Your Savings\n- Psychology of Saving: Overcoming Spending Triggers\n- How to Automate Your Saving Strategy";
    }

    // Default response with more helpful guidance if no match is found
    return `I'm here to help with your question about "${question}". While I don't have a specific answer ready, I can suggest a few approaches:\n\n1. Try to be more specific about what aspect of ${question} you'd like to understand (e.g., definitions, strategies, or personal application)\n\n2. Consider checking the Learn section of SavyFunds for educational modules related to this topic\n\n3. For personalized advice, you might want to provide some context about your financial situation, such as your goals, income level, or current knowledge of this topic.\n\nHow would you like to proceed?`;
  }
}

// Generate a personalized learning path
export async function getLearningPath(userProfile: FinancialProfile) {
  try {
    const parsed = await askGeminiJson(
      `Create a personalized financial learning path for a user with this profile:\n${profileContext(userProfile)}\n\n` +
      `Respond with JSON only in this exact shape:\n` +
      `{"modules": [{"title": string, "description": string, "priority": number}], "reasoning": string}\n` +
      `Recommend 5 modules ordered by priority (1 = highest).`
    );
    if (parsed?.modules?.length) {
      return {
        modules: parsed.modules,
        reasoning: parsed.reasoning || "",
      };
    }
    throw new Error("AI learning path unavailable");
  } catch (error) {
    console.error("Error generating learning path:", error);
    return {
      modules: [
        { title: "Financial Basics", description: "Fundamental financial concepts for beginners", priority: 1 },
        { title: "Building Security", description: "Creating financial security for your future", priority: 2 },
        { title: "Growing Wealth", description: "Introduction to investing and wealth building", priority: 3 },
      ],
      reasoning: "This learning path covers essential financial knowledge in a progressive sequence.",
    };
  }
}

// Generate a financial health assessment
export async function getFinancialHealthAssessment(userProfile: FinancialProfile) {
  try {
    const parsed = await askGeminiJson(
      `Assess the financial health of a user with this profile:\n${profileContext(userProfile)}\n\n` +
      `Respond with JSON only in this exact shape:\n` +
      `{"assessment": string, "strengths": string[], "weaknesses": string[], "recommendations": string[]}\n` +
      `Be supportive and constructive.`
    );
    if (parsed?.assessment) {
      return {
        assessment: parsed.assessment,
        strengths: parsed.strengths || [],
        weaknesses: parsed.weaknesses || [],
        recommendations: parsed.recommendations || [],
      };
    }
    throw new Error("AI assessment unavailable");
  } catch (error) {
    console.error("Error generating financial health assessment:", error);
    return {
      assessment: "Based on the limited information available, your financial health appears average.",
      strengths: [],
      weaknesses: [],
      recommendations: [
        "Consider building an emergency fund if you don't have one",
        "Review your budget to identify potential savings",
        "Focus on paying down high-interest debt if applicable",
      ],
    };
  }
}

// Generate a comprehensive financial plan
export async function getFinancialPlan(userProfile: FinancialProfile) {
  try {
    if (!isSavyFundsAIAvailable()) throw new Error("AI service not configured");
    const res = await askSavyFundsAI(
      `Create a comprehensive, practical financial plan for me based on my profile below. ` +
      `Cover budgeting, saving, debt, and next steps. Keep it under 400 words.`,
      `User profile:\n${profileContext(userProfile)}`
    );
    const text = res.answer || "";
    return {
      overview: text,
      keyPoints: res.keyPoints || [],
      actionItems: res.actionItems || [],
    };
  } catch (error) {
    console.error("Error generating financial plan:", error);
    return {
      overview: "Start with the basics: track spending for a month, build a starter emergency fund, then tackle high-interest debt before investing.",
      keyPoints: ["Track spending", "Build an emergency fund", "Pay down high-interest debt"],
      actionItems: ["Create a monthly budget", "Automate savings"],
    };
  }
}

// Get region-specific financial advice
export async function getRegionalizedAdvice(userProfile: FinancialProfile, topic: string) {
  try {
    if (!isSavyFundsAIAvailable()) throw new Error("AI service not configured");
    const res = await askSavyFundsAI(
      `Give practical financial advice about "${topic}" tailored to someone in ${userProfile.country || "their country"}. ` +
      `Mention any region-specific accounts, rules, or programs where relevant. Keep it under 300 words.`,
      `User profile:\n${profileContext(userProfile)}`
    );
    return res.answer || "I couldn't generate advice for that topic right now. Please try again later.";
  } catch (error) {
    console.error("Error generating regionalized advice:", error);
    return "I couldn't generate advice for that topic right now. Please try again later.";
  }
}

// Get explanation of financial concepts
import { explainConcept } from "./concept-explainer";

// Re-export the explain function
export { explainConcept };

// Budget calculations
export function calculateBudget(monthlyIncome: number) {
  return {
    essentials: monthlyIncome * 0.5,
    savings: monthlyIncome * 0.3,
    discretionary: monthlyIncome * 0.2
  };
}

// Validate a financial goal
export function validateFinancialGoal(
  goal: { title: string; targetAmount: number; endDate?: Date },
  userContext: { income?: number }
) {
  // Check if the goal is achievable based on user's income
  if (userContext.income) {
    // Assume 20% of monthly income goes to savings
    const monthlySavings = userContext.income * 0.2;

    // If end date is provided, check if goal is achievable by that date
    if (goal.endDate) {
      const today = new Date();
      const monthsUntilEndDate =
        (goal.endDate.getFullYear() - today.getFullYear()) * 12 +
        (goal.endDate.getMonth() - today.getMonth());

      const achievableSavings = monthlySavings * monthsUntilEndDate;

      if (achievableSavings < goal.targetAmount) {
        return {
          achievable: false,
          message: `Based on your income, this goal might be challenging to achieve by the target date. Consider extending the timeframe or adjusting the target amount.`,
          suggestedTimeframe: Math.ceil(goal.targetAmount / monthlySavings)
        };
      }
    }
  }

  return {
    achievable: true,
    message: "This goal seems achievable based on your financial situation."
  };
}

// Generate personalized onboarding questions for new users
export async function generateOnboardingQuestions(
  userDetails?: { age?: string; country?: string }
): Promise<{ questions: OnboardingQuestion[] }> {
  try {
    // Common financial questions for all users
    const commonQuestions: OnboardingQuestion[] = [
      {
        id: "income",
        text: "What is your approximate monthly income?",
        type: "select",
        options: [
          "Less than $1,000",
          "$1,000 - $3,000",
          "$3,000 - $5,000",
          "$5,000 - $10,000",
          "More than $10,000",
          "Prefer not to say"
        ]
      },
      {
        id: "financial_knowledge",
        text: "How would you rate your current financial knowledge?",
        type: "select",
        options: [
          "Complete beginner",
          "Know the basics",
          "Intermediate understanding",
          "Advanced knowledge"
        ]
      },
      {
        id: "top_financial_goals",
        text: "What are your top financial goals right now? (Select up to 3)",
        type: "multiselect",
        options: [
          "Build an emergency fund",
          "Pay off debt",
          "Save for retirement",
          "Save for a major purchase",
          "Invest in the stock market",
          "Start a business",
          "Improve credit score",
          "Create a budget"
        ],
        maxSelections: 3
      }
    ];

    // Personalized questions based on user age
    let ageSpecificQuestions: OnboardingQuestion[] = [];
    if (userDetails?.age) {
      if (["18-24 years", "Under 18 years"].includes(userDetails.age)) {
        ageSpecificQuestions.push({
          id: "education_funding",
          text: "Are you interested in learning about education funding or student loans?",
          type: "select",
          options: ["Yes, very interested", "Somewhat interested", "Not interested"]
        });
      } else if (["25-34 years", "35-44 years"].includes(userDetails.age)) {
        ageSpecificQuestions.push({
          id: "home_buying",
          text: "Are you planning to buy a home in the next 5 years?",
          type: "select",
          options: ["Yes", "Maybe", "No", "Already own a home"]
        });
      } else {
        ageSpecificQuestions.push({
          id: "retirement_planning",
          text: "How confident are you in your retirement planning?",
          type: "select",
          options: [
            "Very confident",
            "Somewhat confident",
            "Not confident",
            "Haven't started planning"
          ]
        });
      }
    }

    // Personalized questions based on country/region
    let regionSpecificQuestions: OnboardingQuestion[] = [];
    if (userDetails?.country) {
      // Add region-specific questions
      if (["United States", "Canada", "United Kingdom", "Australia"].includes(userDetails.country)) {
        regionSpecificQuestions.push({
          id: "investment_experience",
          text: "Do you currently have any investments?",
          type: "select",
          options: [
            "Yes, I actively invest",
            "Yes, but only through retirement accounts",
            "No, but I'm interested in starting",
            "No, and I'm not interested right now"
          ]
        });
      } else {
        regionSpecificQuestions.push({
          id: "currency_stability",
          text: "How concerned are you about currency stability in your country?",
          type: "select",
          options: [
            "Very concerned",
            "Somewhat concerned",
            "Not concerned"
          ]
        });
      }
    }

    // Combine all questions, limiting to a reasonable number (7 max)
    const allQuestions = [
      ...commonQuestions,
      ...ageSpecificQuestions,
      ...regionSpecificQuestions
    ].slice(0, 7);

    return { questions: allQuestions };
  } catch (error) {
    console.error("Error generating onboarding questions:", error);

    // Fallback to a default set of questions if AI generation fails
    return {
      questions: [
        {
          id: "income",
          text: "What is your approximate monthly income?",
          type: "select",
          options: [
            "Less than $1,000",
            "$1,000 - $3,000",
            "$3,000 - $5,000",
            "$5,000 - $10,000",
            "More than $10,000",
            "Prefer not to say"
          ]
        },
        {
          id: "financial_knowledge",
          text: "How would you rate your current financial knowledge?",
          type: "select",
          options: [
            "Complete beginner",
            "Know the basics",
            "Intermediate understanding",
            "Advanced knowledge"
          ]
        },
        {
          id: "top_financial_goals",
          text: "What are your top financial goals right now? (Select up to 3)",
          type: "select",
          options: [
            "Build an emergency fund",
            "Pay off debt",
            "Save for retirement",
            "Save for a major purchase",
            "Invest in the stock market",
            "Start a business",
            "Improve credit score",
            "Create a budget"
          ],
          maxSelections: 3
        },
        {
          id: "biggest_challenge",
          text: "What's your biggest financial challenge right now?",
          type: "select",
          options: [
            "Not enough income",
            "Too much debt",
            "Difficulty saving",
            "Lack of knowledge",
            "Unexpected expenses",
            "No challenges currently"
          ]
        }
      ]
    };
  }
}

// Type definition for onboarding questions
export type OnboardingQuestion = {
  id: string;
  text: string;
  type: "select" | "multiselect" | "text";
  options?: string[];
  maxSelections?: number;
};
