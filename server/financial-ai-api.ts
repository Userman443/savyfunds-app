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

// Quality gate for the database fallback: a fallback answer is only shown when
// the top database match is genuinely about the question. Anything weaker gets
// the "not enough information" message instead of a wrong article.
const DB_MIN_CONFIDENCE = 40;

/**
 * Score how well the top database match actually answers the query (0-100).
 *
 * A keyword found in the entry's question or tags is strong evidence the entry
 * is about the query. A keyword found only somewhere inside a long answer body
 * is weak evidence: common finance words ("rate", "fund", "money") appear in
 * nearly every article, so answer-body matches alone must not win.
 */
export function calculateConfidenceScore(query: string, relevantAnswers: FinancialQuestion[]): number {
  if (relevantAnswers.length === 0) return 0;

  const normalizedQuery = query.toLowerCase().trim();
  const firstAnswer = relevantAnswers[0];
  const questionText = firstAnswer.question.toLowerCase();
  const answerText = firstAnswer.answer.toLowerCase();
  const tagText = firstAnswer.tags.join(' ').toLowerCase();

  const stopWords = ['what', 'is', 'are', 'how', 'do', 'does', 'can', 'should', 'will', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'i', 'my', 'me', 'we', 'our', 'you', 'your'];

  const keywords = normalizedQuery
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .map(word => word.replace(/[^\w]/g, ''))
    .filter(word => word.length > 0);

  if (keywords.length === 0) {
    return 5;
  }

  let strongMatches = 0; // keyword in the entry's question or tags
  let weakMatches = 0;   // keyword only somewhere in the long answer body

  keywords.forEach(keyword => {
    if (questionText.includes(keyword) || tagText.includes(keyword)) {
      strongMatches++;
    } else if (answerText.includes(keyword)) {
      weakMatches++;
    }
  });

  const strongRatio = strongMatches / keywords.length;
  const weakRatio = weakMatches / keywords.length;

  let score = strongRatio * 80 + weakRatio * 10;

  // Exact-phrase bonus: the database question literally contains the user's question.
  if (questionText.includes(normalizedQuery)) {
    score += 10;
  }

  return Math.min(score, 100);
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
 * Generate a response to financial questions: AI first, database as fallback
 *
 * Strategy:
 * - SavyFunds AI (OpenRouter free tier) answers every question first.
 * - The pre-compiled database is the fallback when AI is unavailable, fails,
 *   or returns an empty answer (e.g. API outage, quota exhausted, key missing).
 * - AI responses are cached so repeated questions stay fast and cheap; database
 *   answers are never cached.
 *
 * @param query The user's financial question
 * @param userContext Optional user profile data for personalization
 * @returns An object containing the answer and metadata
 */
export async function generateFinancialAiResponse(query: string, userContext?: UserContext): Promise<AiResponse> {
  // Check cache first for repeated questions (only AI responses are cached)
  const queryHash = createQueryHash(query);
  const cachedResponse = await getCachedResponse(queryHash);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Primary path: SavyFunds AI (OpenRouter)
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

      console.log(`Using SavyFunds AI for: "${query.substring(0, 50)}..."`);

      const aiResponse = await askSavyFundsAI(query, contextStr || undefined);

      if (aiResponse && aiResponse.answer && aiResponse.answer.trim().length > 0) {
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
      }

      console.error('AI returned an empty answer, falling back to database');
    } catch (error) {
      console.error('AI response failed, falling back to database:', error);
    }
  } else {
    console.log('SavyFunds AI not configured, falling back to database');
  }

  // Fallback path: pre-compiled database (used when AI is down or unavailable)
  const relevantAnswers = findRelevantAnswers(query, 3);
  const confidenceScore = calculateConfidenceScore(query, relevantAnswers);

  console.log(`Database fallback for: "${query.substring(0, 50)}..." | Confidence: ${confidenceScore.toFixed(1)} | DB Results: ${relevantAnswers.length}`);

  if (relevantAnswers.length === 0 || confidenceScore < DB_MIN_CONFIDENCE) {
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
