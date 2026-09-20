import axios from 'axios';
import { type ExplainConceptResult } from '../concept-explainer';

/**
 * Configuration for the Perplexity API
 */
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_URL = 'https://api.perplexity.ai/chat/completions';

/**
 * Explains a financial concept using Perplexity AI
 * @param concept The financial concept to explain
 * @param experienceLevel The user's financial experience level (beginner, intermediate, advanced)
 * @returns Structured explanation with examples, tips, and further reading
 */
export async function explainFinancialConcept(
  concept: string,
  experienceLevel: string = 'beginner'
): Promise<ExplainConceptResult> {
  try {
    console.log(`Explaining concept "${concept}" with experience level "${experienceLevel}" using Perplexity AI...`);
    
    if (!PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY environment variable is not set');
    }
    
    const data = {
      model: "llama-3.1-sonar-small-128k-online",
      messages: [
        {
          role: 'system',
          content: `You are a financial education expert specializing in explaining complex financial concepts in clear, accessible ways. 
          Provide explanations appropriate for someone with ${experienceLevel} level financial knowledge.
          Format the output as a JSON object with these fields:
          {
            "explanation": "A clear, thorough explanation of the concept",
            "examples": ["2-3 practical, real-world examples showing the concept in action"],
            "tips": ["3-5 actionable tips related to this concept"],
            "furtherReading": ["3-5 suggested resources or topics for learning more"]
          }`
        },
        {
          role: 'user',
          content: `Please explain this financial concept: ${concept}`
        }
      ],
      temperature: 0.2,
      max_tokens: 1000,
      top_p: 0.9
    };
    
    const options = {
      method: 'POST',
      url: PERPLEXITY_URL,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      data: data
    };
    
    console.log('Sending request to Perplexity AI...');
    const response = await axios.request(options);
    console.log('Received response from Perplexity AI');
    
    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      const contentStr = response.data.choices[0].message.content;
      console.log('Parsing response content...');
      
      // Extract JSON from the response
      let jsonStr = contentStr;
      if (contentStr.includes('```json')) {
        jsonStr = contentStr.split('```json')[1].split('```')[0].trim();
      } else if (contentStr.includes('```')) {
        jsonStr = contentStr.split('```')[1].split('```')[0].trim();
      }
      
      try {
        const parsedContent = JSON.parse(jsonStr);
        return {
          explanation: parsedContent.explanation || 'No explanation provided',
          examples: Array.isArray(parsedContent.examples) ? parsedContent.examples : [],
          tips: Array.isArray(parsedContent.tips) ? parsedContent.tips : [],
          furtherReading: Array.isArray(parsedContent.furtherReading) ? parsedContent.furtherReading : []
        };
      } catch (parseError) {
        console.error('Error parsing JSON from Perplexity AI response:', parseError);
        // Try to extract structured data from the text
        return extractStructuredData(contentStr);
      }
    } else {
      throw new Error('Invalid response format from Perplexity AI');
    }
  } catch (error) {
    console.error('Error in Perplexity AI explainFinancialConcept:', error);
    throw error;
  }
}

/**
 * Extract structured data from text when JSON parsing fails
 */
function extractStructuredData(text: string): ExplainConceptResult {
  const result: ExplainConceptResult = {
    explanation: '',
    examples: [],
    tips: [],
    furtherReading: []
  };
  
  // Try to extract explanation (everything before "Examples:" or similar)
  const explanationMatch = text.match(/(?:explanation:?\s*)([\s\S]+?)(?=examples:|tips:|further reading:|$)/i);
  if (explanationMatch && explanationMatch[1]) {
    result.explanation = explanationMatch[1].trim();
  } else {
    // If no clear section, use the first paragraph
    const firstPara = text.split('\n\n')[0];
    result.explanation = firstPara || text.substring(0, 300); // Fallback
  }
  
  // Extract examples
  const examplesMatch = text.match(/examples:?\s*([\s\S]+?)(?=tips:|further reading:|$)/i);
  if (examplesMatch && examplesMatch[1]) {
    result.examples = examplesMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
      .map(line => line.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean);
  }
  
  // Extract tips
  const tipsMatch = text.match(/tips:?\s*([\s\S]+?)(?=further reading:|$)/i);
  if (tipsMatch && tipsMatch[1]) {
    result.tips = tipsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
      .map(line => line.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean);
  }
  
  // Extract further reading
  const readingMatch = text.match(/further reading:?\s*([\s\S]+?)(?=$)/i);
  if (readingMatch && readingMatch[1]) {
    result.furtherReading = readingMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
      .map(line => line.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean);
  }
  
  return result;
}

/**
 * Generate personalized learning path using Perplexity AI
 * @param userProfile The user's financial profile
 * @returns A personalized learning path
 */
export async function generatePersonalizedLearningPath(userProfile: any) {
  try {
    console.log(`Generating personalized learning path using Perplexity AI...`);
    
    if (!PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY environment variable is not set');
    }
    
    const data = {
      model: "llama-3.1-sonar-small-128k-online",
      messages: [
        {
          role: 'system',
          content: `You are a financial education expert. Create a personalized financial learning path with 5-7 steps for the user based on their profile. For each step, include a title, brief description, and estimated time to master.`
        },
        {
          role: 'user',
          content: `Create a personalized financial learning path for me. My profile:\n${JSON.stringify(userProfile, null, 2)}`
        }
      ],
      temperature: 0.2,
      max_tokens: 1000
    };
    
    const options = {
      method: 'POST',
      url: PERPLEXITY_URL,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      data: data
    };
    
    const response = await axios.request(options);
    
    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid response format from Perplexity AI');
    }
  } catch (error) {
    console.error('Error in Perplexity AI generatePersonalizedLearningPath:', error);
    throw error;
  }
}

/**
 * Generate financial advice using Perplexity AI based on user profile and query
 * @param query The user's financial question
 * @param userContext The user's financial profile
 * @returns AI-generated financial advice
 */
export async function generateAIFinancialAdvice(
  query: string,
  userContext: any
): Promise<string> {
  try {
    console.log(`Generating financial advice for query "${query}" using Perplexity AI...`);
    
    if (!PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY environment variable is not set');
    }
    
    const data = {
      model: "llama-3.1-sonar-small-128k-online",
      messages: [
        {
          role: 'system',
          content: `You are a financial advisor providing personalized advice based on the user's profile. Give clear, actionable advice with specific examples relevant to their situation.`
        },
        {
          role: 'user',
          content: `My question is: ${query}\n\nHere's my financial profile:\n${JSON.stringify(userContext, null, 2)}`
        }
      ],
      temperature: 0.2,
      max_tokens: 1000
    };
    
    const options = {
      method: 'POST',
      url: PERPLEXITY_URL,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      data: data
    };
    
    const response = await axios.request(options);
    
    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid response format from Perplexity AI');
    }
  } catch (error) {
    console.error('Error in Perplexity AI generateAIFinancialAdvice:', error);
    throw error;
  }
}

/**
 * Generate a financial health assessment using Perplexity AI
 * @param userProfile The user's financial profile
 * @returns A financial health assessment
 */
export async function generateFinancialHealthAssessment(userProfile: any) {
  try {
    console.log(`Generating financial health assessment using Perplexity AI...`);
    
    if (!PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY environment variable is not set');
    }
    
    const data = {
      model: "llama-3.1-sonar-small-128k-online",
      messages: [
        {
          role: 'system',
          content: `You are a financial health expert. Provide a comprehensive assessment of the user's financial health based on their profile. Include strengths, areas for improvement, and a numerical score from 1-100. Also include an appropriate emoji to represent their financial health status.`
        },
        {
          role: 'user',
          content: `Assess my financial health based on my profile:\n${JSON.stringify(userProfile, null, 2)}`
        }
      ],
      temperature: 0.2,
      max_tokens: 1000
    };
    
    const options = {
      method: 'POST',
      url: PERPLEXITY_URL,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      data: data
    };
    
    const response = await axios.request(options);
    
    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid response format from Perplexity AI');
    }
  } catch (error) {
    console.error('Error in Perplexity AI generateFinancialHealthAssessment:', error);
    throw error;
  }
}