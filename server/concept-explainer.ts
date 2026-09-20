import { explainFinancialConcept as GoogleAIExplainConcept } from './lib/google-ai';
import { explainFinancialConcept as PerplexityExplainConcept } from './lib/perplexity';
import fs from 'fs';
import path from 'path';

// Define type for explainFinancialConcept return value
export type ExplainConceptResult = {
  explanation: string;
  examples: string[];
  tips: string[];
  furtherReading: string[];
};

// Define type for our stored concepts file
export type FinancialConceptsDatabase = {
  concepts: Array<{
    name: string;
    explanation: string;
    examples: string[];
    tips: string[];
    furtherReading: string[];
  }>
};

// Load the financial concepts database
let financialConceptsDb: FinancialConceptsDatabase = { concepts: [] };

// ES Module resolution for __dirname equivalent
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const conceptsFilePath = path.join(__dirname, 'data', 'financial-concepts.json');
  if (fs.existsSync(conceptsFilePath)) {
    const fileData = fs.readFileSync(conceptsFilePath, 'utf8');
    financialConceptsDb = JSON.parse(fileData);
    console.log(`Loaded ${financialConceptsDb.concepts.length} financial concepts from database`);
  } else {
    console.warn('Financial concepts database file not found:', conceptsFilePath);
  }
} catch (error) {
  console.error('Error loading financial concepts database:', error);
}

/**
 * Explains a financial concept, using Google AI first, then falling back to predefined content
 * @param concept The financial concept to explain
 * @param experienceLevel The user's financial experience level
 * @param userLocation Optional user location for region-specific explanations
 * @returns A structured explanation object
 */
/**
 * Returns a list of all financial concepts in the database
 * @returns Array of financial concepts
 */
export function getFinancialConcepts(): Array<{
  name: string;
  explanation: string;
  examples: string[];
  tips: string[];
  furtherReading: string[];
}> {
  return financialConceptsDb.concepts;
}

export async function explainConcept(
  concept: string,
  experienceLevel: string,
  userLocation?: string
): Promise<ExplainConceptResult> {
  const locationContext = userLocation ? ` for someone living in ${userLocation}` : '';
  const fullConcept = concept + locationContext;
  
  // Try multiple AI providers in parallel with fallbacks
  console.log(`Explaining concept "${concept}" using multiple AI providers...`);
  
  // First, try Perplexity AI if the API key is available
  if (process.env.PERPLEXITY_API_KEY) {
    try {
      console.log(`Started Perplexity AI request for "${concept}"`);
      const result = await PerplexityExplainConcept(fullConcept, experienceLevel);
      console.log("Successfully generated explanation with Perplexity AI");
      return result;
    } catch (perplexityError) {
      console.error("Error with Perplexity AI explanation:", perplexityError);
      console.log("Falling back to Google AI...");
    }
  }
  
  // If Perplexity fails or isn't configured, try Google AI
  try {
    console.log(`Started Google AI request for "${concept}"`);
    const result = await GoogleAIExplainConcept(fullConcept, experienceLevel);
    console.log("Successfully generated explanation with Google AI");
    return result;
  } catch (googleError) {
    console.error("Error with Google AI explanation:", googleError);
    console.log("Falling back to predefined responses");
    
    // If all AI providers fail, use predefined responses with location if available
    return getPreDefinedExplanation(concept, userLocation);
  }
}



/**
 * Returns a predefined explanation for common financial concepts
 * @param concept The financial concept to explain
 * @param userLocation Optional user location for tailored content
 * @returns A structured explanation object
 */
function getPreDefinedExplanation(concept: string, userLocation?: string): ExplainConceptResult {
  // Normalize the concept for lookup
  const normalizedConcept = concept.toLowerCase().trim();
  
  // First check our loaded financial concepts database
  if (financialConceptsDb.concepts.length > 0) {
    // Try to find an exact match
    const exactMatch = financialConceptsDb.concepts.find(
      c => c.name.toLowerCase() === normalizedConcept
    );
    
    if (exactMatch) {
      console.log(`Found exact match for "${concept}" in our database`);
      return exactMatch;
    }
    
    // Try to find a partial match
    const partialMatch = financialConceptsDb.concepts.find(
      c => normalizedConcept.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(normalizedConcept)
    );
    
    if (partialMatch) {
      console.log(`Found partial match for "${concept}" in our database: ${partialMatch.name}`);
      return partialMatch;
    }
  }
  
  // If no match in database, use our hardcoded fallbacks
  // Fallback responses for common financial concepts
  const responses: Record<string, ExplainConceptResult> = {
    "emergency fund": {
      explanation: "An emergency fund is money set aside to cover unexpected expenses or financial emergencies. It serves as a financial safety net that helps you avoid going into debt when unexpected costs arise. Most financial experts recommend having 3-6 months of essential expenses saved in an emergency fund.",
      examples: [
        "Sarah's car needed a $800 repair, but she was able to pay for it immediately from her emergency fund without using credit cards.",
        "When John lost his job, his emergency fund covered his rent and food for three months while he searched for a new position."
      ],
      tips: [
        "Start small with a goal of $1,000, then work toward 3-6 months of expenses",
        "Keep your emergency fund in a separate, easily accessible account like a high-yield savings account",
        "Only use your emergency fund for true emergencies, not planned expenses"
      ],
      furtherReading: [
        "How to Build an Emergency Fund in Six Months",
        "Where to Keep Your Emergency Fund",
        "Emergency Fund vs. Regular Savings: What's the Difference?"
      ]
    },
    "compound interest": {
      explanation: "Compound interest is when you earn interest on both the money you've saved and on the interest you've earned. It's often called 'interest on interest' and is a powerful force in building wealth over time. The longer your money compounds, the faster it grows.",
      examples: [
        "If you invest $1,000 with 5% annual compound interest, you'll have $1,628 after 10 years, despite only adding $500 in simple interest.",
        "A retirement account earning compound returns can grow from $10,000 to over $100,000 in 30 years even without additional contributions."
      ],
      tips: [
        "Start investing as early as possible to maximize compound growth",
        "Leave your earnings to reinvest rather than withdrawing them",
        "Use a compound interest calculator to see the long-term impact of your investments"
      ],
      furtherReading: [
        "The Power of Compound Interest Explained",
        "How Compound Interest Works in Investments",
        "Simple vs. Compound Interest: Understanding the Difference"
      ]
    }
  };
  
  // If we have a location, try to return region-specific financial concept
  if (userLocation) {
    const regionalConcepts: Record<string, Record<string, ExplainConceptResult>> = {
      "United States": {
        "401k": {
          explanation: "A 401(k) is a retirement savings plan sponsored by employers in the United States that allows workers to save and invest a portion of their paycheck before taxes are taken out. Many employers match a percentage of employee contributions, which is essentially free money for your retirement.",
          examples: [
            "Lisa contributes 6% of her salary to her 401(k), and her employer matches 50% of her contribution, giving her an additional 3% toward retirement.",
            "By starting his 401(k) contributions at age 25 instead of 35, Mark accumulated an additional $300,000 for retirement."
          ],
          tips: [
            "Contribute at least enough to get your full employer match",
            "Increase your contribution percentage whenever you get a raise",
            "Consider the tax advantages of traditional vs. Roth 401(k) options"
          ],
          furtherReading: [
            "401(k) Plans: The Complete Guide",
            "How to Maximize Your 401(k) Benefits",
            "What Happens to Your 401(k) When You Change Jobs"
          ]
        },
        "ira": {
          explanation: "An Individual Retirement Account (IRA) is a tax-advantaged investment account designed to help Americans save for retirement. Traditional IRAs offer tax-deferred growth, while Roth IRAs offer tax-free growth and withdrawals in retirement.",
          examples: [
            "Jane contributes $6,000 annually to her Roth IRA, allowing her investments to grow tax-free for retirement.",
            "After leaving his job, Mike rolled his 401(k) into a Traditional IRA to maintain tax-deferred growth."
          ],
          tips: [
            "Understand the difference between Traditional (tax-deferred) and Roth (tax-free growth) IRAs",
            "Consider your current and future tax brackets when choosing between IRA types",
            "Start early to maximize the benefits of compound growth"
          ],
          furtherReading: [
            "IRA vs. 401(k): Which Should You Choose?",
            "Roth IRA Conversion: Is It Right for You?",
            "IRS Publication 590-A: Contributions to IRAs"
          ]
        }
      },
      "United Kingdom": {
        "isa": {
          explanation: "An Individual Savings Account (ISA) is a tax-efficient savings or investment account in the UK that allows you to save or invest up to an annual allowance (£20,000 for the 2024/25 tax year) without paying tax on the returns.",
          examples: [
            "Emma maxes out her Stocks and Shares ISA each year, allowing her investments to grow completely tax-free.",
            "Tom uses a Cash ISA for his emergency fund, earning interest without having to pay tax on it."
          ],
          tips: [
            "Use your ISA allowance each tax year as it cannot be carried forward",
            "Consider the different types of ISAs (Cash, Stocks and Shares, Lifetime, Innovative Finance)",
            "Shop around for the best rates and lowest fees"
          ],
          furtherReading: [
            "GOV.UK: Individual Savings Accounts (ISAs)",
            "Money Saving Expert's ISA Guide",
            "Which?: How to Choose the Best ISA"
          ]
        },
        "pension": {
          explanation: "In the UK, a pension is a tax-efficient way to save for retirement. There are three main types: the State Pension (provided by the government), workplace pensions (arranged by employers), and personal pensions (set up by individuals).",
          examples: [
            "James contributes 5% of his salary to his workplace pension, and his employer adds another 3%.",
            "Sarah has a Self-Invested Personal Pension (SIPP) that gives her control over her investment choices."
          ],
          tips: [
            "Check your State Pension forecast on the GOV.UK website",
            "Consider consolidating multiple pension pots to reduce fees",
            "Understand the Lifetime Allowance and Annual Allowance limits"
          ],
          furtherReading: [
            "The Pensions Advisory Service website",
            "Pension Wise: Free guidance for over-50s",
            "Money Helper's pension calculator"
          ]
        }
      },
      "Australia": {
        "superannuation": {
          explanation: "Superannuation ('super') is Australia's compulsory retirement savings system. Employers must contribute a percentage (currently 11%) of an employee's earnings to their chosen super fund, which is preserved until retirement age.",
          examples: [
            "David's employer contributes 11% of his $80,000 salary to his super fund each year, adding $8,800 annually to his retirement savings.",
            "Michelle made additional voluntary contributions to her super through salary sacrifice, reducing her taxable income while boosting her retirement savings."
          ],
          tips: [
            "Check if you have multiple super accounts and consider consolidating them to reduce fees",
            "Review your investment options within your super fund to ensure they match your risk tolerance and time horizon",
            "Consider making additional contributions through salary sacrifice or after-tax contributions"
          ],
          furtherReading: [
            "Australian Taxation Office's super information",
            "MoneySmart's superannuation and retirement planning guides",
            "Super comparison tools to find lower-fee funds"
          ]
        },
        "first home super saver scheme": {
          explanation: "The First Home Super Saver (FHSS) Scheme allows Australians to save money for their first home inside their superannuation fund, potentially offering tax benefits compared to saving in a standard bank account.",
          examples: [
            "Jessica made voluntary contributions of $15,000 to her super fund over two years under the FHSS Scheme, which she later withdrew (plus earnings) to use as a deposit on her first apartment.",
            "Mark and his partner each saved $30,000 through the FHSS Scheme, giving them a combined $60,000 for their home deposit."
          ],
          tips: [
            "You can contribute up to $15,000 per financial year and up to $50,000 in total under the scheme",
            "Only voluntary contributions (not employer contributions) can be withdrawn",
            "Check the ATO website for the latest rules and eligibility requirements"
          ],
          furtherReading: [
            "Australian Taxation Office's FHSS Scheme guide",
            "MoneySmart's first home buyer resources",
            "How to apply for an FHSS determination and release"
          ]
        }
      },
      "Canada": {
        "rrsp": {
          explanation: "A Registered Retirement Savings Plan (RRSP) is a tax-advantaged account in Canada designed to help you save for retirement. Contributions are tax-deductible, and investments grow tax-deferred until withdrawal.",
          examples: [
            "Jean contributed $10,000 to his RRSP, reducing his taxable income by $10,000 for the year.",
            "Marie used the Home Buyers' Plan to withdraw $35,000 from her RRSP tax-free to help purchase her first home."
          ],
          tips: [
            "Your RRSP contribution room accumulates if unused and carries forward",
            "Consider your current and expected future tax brackets when planning RRSP contributions",
            "Remember that RRSP withdrawals in retirement are taxed as income"
          ],
          furtherReading: [
            "Canada Revenue Agency's RRSP information guide",
            "RRSP vs. TFSA: Which is right for you?",
            "Understanding the RRSP Home Buyers' Plan"
          ]
        },
        "tfsa": {
          explanation: "A Tax-Free Savings Account (TFSA) is a registered account in Canada where your investments can grow tax-free. Unlike RRSPs, contributions are not tax-deductible, but withdrawals are completely tax-free.",
          examples: [
            "Alex invested in stocks within his TFSA and earned $20,000 in capital gains, which he can withdraw completely tax-free.",
            "Sophia uses her TFSA for her emergency fund and short-term savings goals because she can withdraw money anytime without tax implications."
          ],
          tips: [
            "Your TFSA contribution room begins accumulating at age 18, even if you haven't opened an account yet",
            "Be careful not to over-contribute, as penalties are 1% per month on excess amounts",
            "Consider using TFSAs for investments with high growth potential to maximize the tax-free benefit"
          ],
          furtherReading: [
            "Canada Revenue Agency's TFSA information",
            "How to check your TFSA contribution room",
            "The Value of Simple: A guide to TFSA investing"
          ]
        }
      }
    };
    
    // Check if we have regional concepts for this user's location
    for (const [region, concepts] of Object.entries(regionalConcepts)) {
      if (userLocation.includes(region)) {
        // Check if any regional concept matches the query
        for (const [conceptKey, conceptInfo] of Object.entries(concepts)) {
          if (normalizedConcept.includes(conceptKey.toLowerCase())) {
            console.log(`Found region-specific (${region}) concept match for "${concept}": ${conceptKey}`);
            return conceptInfo;
          }
        }
      }
    }
  }
  
  // Try to match with generic predefined responses
  for (const [key, response] of Object.entries(responses)) {
    if (normalizedConcept.includes(key)) {
      return response;
    }
  }
  
  // Generic fallback for concepts not in our predefined list
  const fallbackExplanation = normalizedConcept.includes("emergency fund") 
    ? "An emergency fund is money set aside for unexpected expenses like medical bills, car repairs, or job loss. Most experts recommend saving 3-6 months of essential expenses." 
    : normalizedConcept.includes("budget") 
    ? "A budget is a plan for your money that helps you track income and expenses. It gives you control over your finances and helps you achieve financial goals." 
    : normalizedConcept.includes("invest") 
    ? "Investing means putting money into assets like stocks, bonds, or real estate with the expectation of generating income or profit over time." 
    : normalizedConcept.includes("debt") 
    ? "Debt is money borrowed that must be repaid, usually with interest. Managing debt wisely is crucial for financial health." 
    : normalizedConcept.includes("inflation") 
    ? "Inflation is the rise in prices over time, which reduces your purchasing power. A dollar today will buy less in the future due to inflation." 
    : "This is a key financial concept that's important to understand for your financial well-being. Consider researching it further or asking a financial advisor.";
  
  return {
    explanation: `I'd be happy to explain ${concept} for you, but I'm currently experiencing some technical difficulties.\n\nHere's a basic explanation:\n\n${fallbackExplanation}\n\nFor more detailed information, consider exploring educational resources on savyfunds or consulting with a financial advisor.`,
    examples: [],
    tips: [],
    furtherReading: ["Savyfunds Financial Education Resources", "Introductory Financial Literacy Courses"]
  };
}
