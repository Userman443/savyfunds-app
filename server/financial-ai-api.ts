/**
 * Financial AI API - Hybrid Approach
 * 
 * Uses a combination of:
 * 1. Pre-compiled database for fast, accurate answers to common/simple questions
 * 2. SavyFunds AI (powered by OpenAI, branded as SavyFunds) for complex sentence questions
 * 3. Response caching to reduce API costs for repeated questions
 * 
 * This ensures users get accurate responses whether they ask simple keywords
 * or full sentence questions. AI branding is hidden from users.
 */

import { findRelevantAnswers, getRelatedQuestions, type FinancialQuestion } from './financial-qa-database';
import { askSavyFundsAI, isSavyFundsAIAvailable } from './lib/savyfunds-ai';
import { db } from './db';
import { aiResponseCache } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

// Create a hash of the query for cache lookup
function createQueryHash(query: string): string {
  const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
  return crypto.createHash('md5').update(normalized).digest('hex');
}

// Check cache for existing response
async function getCachedResponse(queryHash: string): Promise<AiResponse | null> {
  try {
    const cached = await db.select().from(aiResponseCache).where(eq(aiResponseCache.queryHash, queryHash)).limit(1);
    if (cached.length > 0) {
      // Increment hit count
      await db.update(aiResponseCache)
        .set({ hitCount: sql`${aiResponseCache.hitCount} + 1`, updatedAt: new Date() })
        .where(eq(aiResponseCache.queryHash, queryHash));
      
      console.log(`Cache hit for query hash: ${queryHash} (hits: ${cached[0].hitCount})`);
      return cached[0].response as AiResponse;
    }
  } catch (error) {
    console.error('Cache lookup error:', error);
  }
  return null;
}

// Store response in cache
async function cacheResponse(query: string, queryHash: string, response: AiResponse): Promise<void> {
  try {
    await db.insert(aiResponseCache).values({
      queryHash,
      query,
      response: response as any,
    }).onConflictDoNothing();
    console.log(`Cached response for: "${query.substring(0, 50)}..."`);
  } catch (error) {
    console.error('Cache store error:', error);
  }
}

interface AiResponse {
  answer: string;
  keyPoints?: string[];
  actionItems?: string[];
  sources?: {
    title: string;
    link?: string;
  }[];
  relatedTopics?: string[];
  source: 'database' | 'ai';
}

const MIN_CONFIDENCE_SCORE = 15;
const MIN_WORDS_FOR_AI = 5;

function isComplexQuestion(query: string): boolean {
  const words = query.trim().split(/\s+/).filter(w => w.length > 2);
  return words.length >= MIN_WORDS_FOR_AI;
}

function calculateConfidenceScore(query: string, relevantAnswers: FinancialQuestion[]): number {
  if (relevantAnswers.length === 0) return 0;
  
  const normalizedQuery = query.toLowerCase();
  const firstAnswer = relevantAnswers[0];
  const questionText = firstAnswer.question.toLowerCase();
  const answerText = firstAnswer.answer.toLowerCase();
  const tagText = firstAnswer.tags.join(' ').toLowerCase();
  
  let score = 0;
  
  const stopWords = ['what', 'is', 'are', 'how', 'do', 'does', 'can', 'should', 'will', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'i', 'my', 'me', 'we', 'our', 'you', 'your'];
  
  const keywords = normalizedQuery
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .map(word => word.replace(/[^\w]/g, ''));
  
  if (keywords.length === 0) {
    return 5;
  }
  
  const matchedKeywords = keywords.filter(keyword => 
    questionText.includes(keyword) || tagText.includes(keyword) || answerText.includes(keyword)
  );
  
  const matchRatio = matchedKeywords.length / keywords.length;
  score += matchRatio * 20;
  
  if (questionText.includes(normalizedQuery)) {
    score += 20;
  }
  
  keywords.forEach(keyword => {
    if (questionText.includes(keyword)) score += 3;
    if (tagText.includes(keyword)) score += 2;
  });
  
  return score;
}

// User context for personalized responses
export interface UserContext {
  country?: string;
  age?: string;
  income?: number;
  experienceLevel?: string;
  financialGoals?: string[];
}

/**
 * Generate a response to financial questions using hybrid approach
 * 
 * Strategy:
 * - Check cache first for repeated questions
 * - Simple questions (< 5 words) with good database match → Use database (fast)
 * - Complex questions (>= 5 words) OR low confidence → Use AI (accurate)
 * 
 * @param query The user's financial question
 * @param userContext Optional user profile data for personalization
 * @returns An object containing the answer and metadata
 */
export async function generateFinancialAiResponse(query: string, userContext?: UserContext): Promise<AiResponse> {
  const relevantAnswers = findRelevantAnswers(query, 3);
  const confidenceScore = calculateConfidenceScore(query, relevantAnswers);
  const isComplex = isComplexQuestion(query);
  
  console.log(`Query: "${query.substring(0, 50)}..." | Words: ${query.split(/\s+/).length} | Confidence: ${confidenceScore.toFixed(1)} | Complex: ${isComplex} | DB Results: ${relevantAnswers.length}`);
  
  const shouldUseAI = (
    relevantAnswers.length === 0 ||
    confidenceScore < MIN_CONFIDENCE_SCORE ||
    (isComplex && confidenceScore < 25)
  );
  
  if (shouldUseAI) {
    // Check cache first for AI queries (only cache AI responses, not database ones)
    const queryHash = createQueryHash(query);
    const cachedResponse = await getCachedResponse(queryHash);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    console.log(`Using SavyFunds AI for: "${query.substring(0, 50)}..." (confidence: ${confidenceScore.toFixed(1)}, complex: ${isComplex})`);
    
    if (isSavyFundsAIAvailable()) {
      try {
        // Build context string from user profile for personalization
        let contextStr = '';
        if (userContext) {
          const contextParts: string[] = [];
          if (userContext.country) contextParts.push(`User is located in ${userContext.country}`);
          if (userContext.age) contextParts.push(`Age group: ${userContext.age}`);
          if (userContext.income) contextParts.push(`Annual income: approximately ${userContext.income}`);
          if (userContext.experienceLevel) contextParts.push(`Financial experience: ${userContext.experienceLevel}`);
          if (userContext.financialGoals?.length) contextParts.push(`Goals: ${userContext.financialGoals.join(', ')}`);
          contextStr = contextParts.join('. ');
        }
        
        const aiResponse = await askSavyFundsAI(query, contextStr || undefined);
        
        const response: AiResponse = {
          answer: aiResponse.answer,
          keyPoints: aiResponse.keyPoints,
          actionItems: aiResponse.actionItems,
          relatedTopics: aiResponse.relatedTopics,
          sources: [{
            title: 'SavyFunds AI Assistant',
            link: '/financial-assistant'
          }],
          source: 'ai'
        };
        
        // Cache the response for future queries (only if no user context to keep cache generic)
        if (!userContext || !contextStr) {
          await cacheResponse(query, queryHash, response);
        }
        
        return response;
      } catch (error) {
        console.error('AI response failed, falling back to database:', error);
      }
    } else {
      console.log("SavyFunds AI not configured, falling back to database");
    }
  }
  
  if (relevantAnswers.length === 0) {
    return {
      answer: "I'm sorry, I don't have enough information to answer that question yet. Please try asking about specific financial topics like budgeting, saving, investing, credit scores, or debt management. You can also try rephrasing your question with more specific terms.",
      sources: [],
      source: 'database'
    };
  }

  const primaryAnswer = relevantAnswers[0];
  let combinedAnswer = primaryAnswer.answer;
  
  const relatedQuestionIds = primaryAnswer.relatedQuestions || [];
  const relatedQuestions = relatedQuestionIds.length > 0 
    ? getRelatedQuestions(relatedQuestionIds) 
    : [];

  if (relatedQuestions.length > 0) {
    combinedAnswer += "\n\nYou might also be interested in learning about:";
    relatedQuestions.forEach(q => {
      combinedAnswer += `\n• ${q.question}`;
    });
  }
  
  const sources = buildSourcesFromAnswers(relevantAnswers);
  
  return {
    answer: combinedAnswer,
    sources,
    relatedTopics: relatedQuestions.map(q => q.question),
    source: 'database'
  };
}

/**
 * Build sources information from answers
 */
function buildSourcesFromAnswers(answers: FinancialQuestion[]): { title: string; link?: string }[] {
  const sources: { title: string; link?: string }[] = [];
  
  answers.forEach(answer => {
    const title = `SavyFunds Financial Education Database`;
    if (!sources.some(s => s.title === title)) {
      sources.push({ title });
    }
  });
  
  return sources;
}
