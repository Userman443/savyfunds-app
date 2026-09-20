import { z } from "zod";
import { 
  FinancialProfile, 
  generateAIFinancialAdvice, 
  generatePersonalizedLearningPath,
  generateFinancialHealthAssessment 
} from './lib/openai-fixed';
import {
  generateFinancialPlan,
  generateRegionalizedAdvice,
  explainFinancialConcept
} from './lib/anthropic-fixed';
import { explainFinancialConcept as OpenAIExplainConcept } from './lib/openai';

// Define type for explainFinancialConcept return value
type ExplainConceptResult = {
  explanation: string;
  examples: string[];
  tips: string[];
  furtherReading: string[];
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

// Generate AI response to financial questions using multiple models in parallel
export async function generateAIResponse(
  question: string,
  userContext: FinancialProfile
): Promise<string> {
  try {
    // Try explainConcept (which tries multiple providers in parallel)
    try {
      console.log(`Attempting to answer question "${question}" using multiple AI providers...`);
      const result = await explainConcept(question, userContext.experienceLevel || 'Beginner', userContext.country);
      return `${result.explanation}\n\nExamples:\n${result.examples.join('\n')}\n\nTips:\n${result.tips.join('\n')}\n\nFurther Reading:\n${result.furtherReading.join('\n')}`;
    } catch (error) {
      console.error("All AI providers failed to answer the question:", error);
      throw new Error("AI answer generation failed");
    }
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
    return await generatePersonalizedLearningPath(userProfile);
  } catch (error) {
    console.error("Error generating learning path:", error);
    throw new Error("Failed to generate learning path. Please try again later.");
  }
}

// Generate a financial health assessment with emoji status
export async function getFinancialHealthAssessment(userProfile: FinancialProfile) {
  try {
    return await generateFinancialHealthAssessment(userProfile);
  } catch (error) {
    console.error("Error generating financial health assessment:", error);
    throw new Error("Failed to generate financial health assessment. Please try again later.");
  }
}

// Generate a comprehensive financial plan using Anthropic
export async function getFinancialPlan(userProfile: FinancialProfile) {
  try {
    return await generateFinancialPlan(userProfile);
  } catch (error) {
    console.error("Error generating financial plan:", error);
    throw new Error("Failed to generate financial plan. Please try again later.");
  }
}

// Get region-specific financial advice
export async function getRegionalizedAdvice(userProfile: FinancialProfile, topic: string) {
  try {
    return await generateRegionalizedAdvice(userProfile, topic);
  } catch (error) {
    console.error("Error generating regionalized advice:", error);
    throw new Error("Failed to generate regionalized advice. Please try again later.");
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
    // First, try to use AI to generate personalized questions
    // This implementation would ideally use OpenAI or Anthropic, but for demo purposes we'll use predefined questions
    // with some personalization logic

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
