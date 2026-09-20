import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import express from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { users, insertUserSchema, insertUserProfileSchema, insertGoalSchema, budgetCalculatorSchema, insertAiConversationSchema, insertKnowledgeArticleSchema, insertNewsArticleSchema, savedAnswers } from "@shared/schema";
import { 
  generateAIResponse, 
  calculateBudget, 
  validateFinancialGoal,
  getLearningPath,
  getFinancialHealthAssessment,
  getFinancialPlan,
  getRegionalizedAdvice,
  explainConcept,
  generateOnboardingQuestions,
  sanitizeProfile,
  type OnboardingQuestion
} from "./ai";
import session from "express-session";
import pgSessionFactory from "connect-pg-simple";
import { pool } from "./db";
import { verifyReCaptchaToken } from "./recaptcha";
import { getLocationFromRequest, type LocationInfo } from "./location";
import { convertCurrency, formatCurrency } from "./currency";
import communityRoutes from "./api/community";
import leaderboardRoutes from "./api/leaderboard";
import authRoutes from "./auth-routes";
import { 
  findRelevantAnswers, 
  getQuestionById, 
  getRelatedQuestions, 
  getQuestionsByDifficulty, 
  getQuestionsByTag,
  type FinancialQuestion 
} from "./financial-qa-database";
import { generateFinancialAiResponse } from "./financial-ai-api";
import { generateVerificationToken, sendVerificationEmail, isEmailConfigured } from "./email-service";
import { auditMiddleware } from "./audit-logger";
import { setupSecurityDashboardRoutes } from "./security-dashboard";
import { randomUUID } from "crypto";

const ANON_Q_LIMIT = 2;
const DEVICE_COOKIE = "sf_device_id";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

const anonQuestionCounts = new Map<string, number>();

function getOrCreateDeviceId(req: any, res: any): string {
  let deviceId = req.cookies?.[DEVICE_COOKIE];
  if (!deviceId) {
    deviceId = randomUUID();
    res.cookie(DEVICE_COOKIE, deviceId, {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: false,
      sameSite: "lax",
    });
  }
  return deviceId;
}

// Postgres-backed session store so logins survive restarts and redeploys
const PgSession = pgSessionFactory(session);

// Session configuration
const isProduction = process.env.NODE_ENV === "production";
const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || "savyfunds-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production (behind Northflank's TLS)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (extended from 24 hours)
    sameSite: "lax" as const, // Allow cookies to be sent on same-site navigation (important for SPA navigation)
    path: '/' // Ensure cookie is available across the entire site
  },
  store: new PgSession({
    pool,
    tableName: "session",
    createTableIfMissing: true,
  })
};

// Session-based authentication only - no global state
// Removed global authenticatedUsers Set as it caused cross-user authentication issues

// Type definition for session with user data
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    authenticated?: boolean;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Explicitly serve sitemap.xml and robots.txt files.
  // In the production Docker image the built frontend lives in dist/public;
  // in local dev the source files live in client/public.
  const resolvePublicFile = (filename: string): string | undefined => {
    const candidates = [
      path.resolve(process.cwd(), 'dist/public', filename),
      path.resolve(process.cwd(), 'client/public', filename),
    ];
    return candidates.find((p) => fs.existsSync(p));
  };
  app.get('/sitemap.xml', async (req, res) => {
    const sitemapPath = resolvePublicFile('sitemap.xml');
    if (!sitemapPath) {
      console.error('sitemap.xml not found in dist/public or client/public');
      return res.status(500).send('Error reading sitemap');
    }
    try {
      let xml = fs.readFileSync(sitemapPath, 'utf-8');
      // Inject news article URLs so new press releases and news stay indexed
      try {
        const articles = await storage.getNewsArticles();
        const newsUrls = articles.map((a) => {
          const lastmod = a.publishedAt
            ? new Date(a.publishedAt).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];
          return `  <url>\n    <loc>https://savyfunds.com/news/${a.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
        }).join('\n');
        if (newsUrls) {
          xml = xml.replace('</urlset>', `${newsUrls}\n</urlset>`);
        }
      } catch (e) {
        console.error('Failed to inject news URLs into sitemap:', e);
      }
      res.setHeader('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error('Error reading sitemap:', error);
      res.status(500).send('Error reading sitemap');
    }
  });
  
  app.get('/robots.txt', (req, res) => {
    const robotsPath = resolvePublicFile('robots.txt');
    if (!robotsPath) {
      console.error('robots.txt not found in dist/public or client/public');
      return res.status(500).send('Error reading robots.txt');
    }
    res.setHeader('Content-Type', 'text/plain');
    res.sendFile(robotsPath);
  });
  // Set up session middleware
  app.use(session(sessionConfig));
  
  // API routes - all prefixed with /api
  const apiRouter = express.Router();
  
  // Add audit logging middleware for all API requests
  apiRouter.use(auditMiddleware());
  
  // Add middleware to attach user to request
  apiRouter.use((req, res, next) => {
    if (req.session.authenticated && req.session.userId) {
      req.isAuthenticated = () => Boolean(req.session.authenticated);
      req.user = { id: req.session.userId };
    } else {
      req.isAuthenticated = () => false;
      req.user = null;
    }
    next();
  });
  
  // Use our comprehensive auth routes implementation
  app.use("/api", authRoutes);
  
  // Set up security dashboard routes
  setupSecurityDashboardRoutes(apiRouter);
  
  // Legacy auth routes - kept for backward compatibility
  apiRouter.post("/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Make username case-insensitive by converting to lowercase
      const normalizedUsername = username.toLowerCase();
      
      // Get all users and find the one that matches case-insensitively
      const allUsers = await storage.getAllUsers();
      const user = allUsers.find((u: {username: string}) => u.username.toLowerCase() === normalizedUsername);
      
      if (!user) {
        console.log(`Login attempt failed: User ${username} not found (case-insensitive match)`);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check if password matches the stored password
      // In a real app, we would use bcrypt to compare the hashed password
      if (password !== user.password) {
        console.log(`Login attempt failed: Invalid password for user ${username}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, we'd use proper authentication (e.g., JWT)
      // For simplicity, just returning the user without the password
      const { password: _, ...userWithoutPassword } = user;
      
      // Store user data in session
      req.session.userId = user.id;
      req.session.authenticated = true;
      
      console.log(`User ${user.username} (ID: ${user.id}) successfully logged in`);
      console.log(`User added to session with ID: ${req.session.userId}`);
      
      // Award points and increment user level for returning users
      // Add login streak points (5 points per login)
      const loginPoints = 5;
      const currentStreak = user.streak || 0;
      const currentPoints = user.points || 0;
      
      // Calculate level based on points (1 level per 50 points)
      let currentLevel = user.level || 1;
      const newPoints = currentPoints + loginPoints;
      const newLevel = Math.floor(newPoints / 50) + 1;
      
      // Update user stats with additional points from login
      if (currentLevel !== newLevel || currentPoints !== newPoints) {
        try {
          await storage.updateUserStats(
            user.id, 
            newLevel, 
            newPoints, 
            currentStreak + 1
          );
          console.log(`Updated user ${user.username} stats: Level ${newLevel}, Points ${newPoints}, Streak ${currentStreak + 1}`);
          
          // Update the user object with new values for the response
          userWithoutPassword.level = newLevel;
          userWithoutPassword.points = newPoints;
          userWithoutPassword.streak = currentStreak + 1;
        } catch (statsError) {
          console.error("Error updating user stats on login:", statsError);
          // Continue even if stats update fails - don't block login
        }
      }
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Server error during login" });
    }
  });
  
  apiRouter.post("/auth/register", async (req, res) => {
    try {
      // Extract recaptchaToken from request body before validation
      const { recaptchaToken, ...userData } = req.body;
      
      // Temporarily disable reCAPTCHA verification to allow users to sign up
      // There's an issue with the reCAPTCHA keys or configuration
      console.log("reCAPTCHA verification bypassed to allow user registration");
      
      // reCAPTCHA validation disabled
      
      // Continue with user registration if reCAPTCHA is valid
      const userResult = insertUserSchema.safeParse(userData);
      
      if (!userResult.success) {
        return res.status(400).json({ message: "Invalid user data", errors: userResult.error.format() });
      }
      
      const { username, email } = userResult.data;
      
      // Check for existing username (case-insensitive)
      const allUsers = await storage.getAllUsers();
      const existingUser = allUsers.find((user: {username: string}) => 
        user.username.toLowerCase() === username.toLowerCase()
      );
      
      if (existingUser) {
        return res.status(409).json({ message: `Username '${username}' already exists. Please choose a different username.` });
      }
      
      // Check for existing email if provided
      if (email) {
        // Check if email already exists by querying the database directly
        const existingEmail = await db.select().from(users).where(eq(users.email, email));
        if (existingEmail.length > 0) {
          return res.status(409).json({ message: `Email '${email}' is already registered. Please use a different email or try logging in.` });
        }
      }
      
      const newUser = await storage.createUser({
        ...userResult.data,
        // No email service configured: mark verified so the account is usable
        isEmailVerified: !isEmailConfigured(),
      });
      const { password: _, ...userWithoutPassword } = newUser;
      
      // Store user data in session
      req.session.userId = newUser.id;
      req.session.authenticated = true;
      
      console.log(`User ${newUser.username} (ID: ${newUser.id}) registered and authenticated`);
      console.log(`User added to session with ID: ${req.session.userId}`);
      
      // Send welcome email if email is provided
      if (email) {
        try {
          const { sendWelcomeEmail } = await import('./lib/sendgrid');
          await sendWelcomeEmail(email, username);
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
          // Still proceed with registration even if email fails
        }
      }
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error during registration:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Registration error details: ${errorMessage}`);
      res.status(500).json({ message: `Server error during registration: ${errorMessage}` });
    }
  });
  
  apiRouter.post("/auth/logout", async (req, res) => {
    try {
      // Destroy the session
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({ message: "Server error during logout" });
        }
        
        console.log("Session destroyed successfully");
        res.status(200).json({ message: "Logged out successfully" });
      });
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ message: "Server error during logout" });
    }
  });
  
  apiRouter.put("/auth/update", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.session.userId || !req.session.authenticated) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { displayName, email } = req.body;
      
      if (!displayName && !email) {
        return res.status(400).json({ message: "No data to update" });
      }
      
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user with new data (simplified implementation)
      const updatedData: { displayName?: string, email?: string } = {};
      
      if (displayName) updatedData.displayName = displayName;
      if (email) updatedData.email = email;
      
      const updatedUser = await db.update(users)
        .set(updatedData)
        .where(eq(users.id, req.session.userId))
        .returning()
        .then(results => results[0]);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      // Don't return password
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Server error updating user" });
    }
  });
  
  // User profile routes
  apiRouter.get("/user/profile/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.status(200).json(profile);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching profile" });
    }
  });
  
  apiRouter.post("/user/profile", async (req, res) => {
    try {
      const profileResult = insertUserProfileSchema.safeParse(req.body);
      
      if (!profileResult.success) {
        return res.status(400).json({ message: "Invalid profile data", errors: profileResult.error.format() });
      }
      
      const user = await storage.getUser(profileResult.data.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const existingProfile = await storage.getUserProfile(profileResult.data.userId);
      
      if (existingProfile) {
        return res.status(409).json({ message: "Profile already exists" });
      }
      
      const newProfile = await storage.createUserProfile(profileResult.data);
      
      res.status(201).json(newProfile);
    } catch (error) {
      res.status(500).json({ message: "Server error creating profile" });
    }
  });
  
  apiRouter.put("/user/profile/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid profile ID" });
      }
      
      const updates = req.body;
      const updatedProfile = await storage.updateUserProfile(id, updates);
      
      res.status(200).json(updatedProfile);
    } catch (error) {
      res.status(500).json({ message: "Server error updating profile" });
    }
  });
  
  // Financial goals routes
  apiRouter.get("/goals/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const goals = await storage.getGoals(userId);
      
      res.status(200).json(goals);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching goals" });
    }
  });
  
  apiRouter.post("/goals", async (req, res) => {
    try {
      // Pre-process the data to ensure compatibility
      const processedData = {
        ...req.body,
        targetAmount: req.body.targetAmount ? Math.round(Number(req.body.targetAmount)) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      };
      
      const goalResult = insertGoalSchema.safeParse(processedData);
      
      if (!goalResult.success) {
        console.error("Goal validation failed:", goalResult.error.format());
        return res.status(400).json({ 
          message: "Invalid goal data", 
          errors: goalResult.error.format(),
          details: "Please check that all required fields are provided and data types are correct"
        });
      }
      
      const user = await storage.getUser(goalResult.data.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user profile for validation
      const profile = await storage.getUserProfile(user.id);
      
      // Handle null endDate to fix TypeScript error
      const goalData = {
        ...goalResult.data,
        // Convert null endDate to undefined
        endDate: goalResult.data.endDate || undefined
      };
      
      const validation = validateFinancialGoal(goalData, {});
      const newGoal = await storage.createGoal(goalData);
      
      res.status(201).json({ goal: newGoal, validation });
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(500).json({ message: "Server error creating goal" });
    }
  });
  
  apiRouter.put("/goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid goal ID" });
      }
      
      const updates = req.body;
      const updatedGoal = await storage.updateGoal(id, updates);
      
      res.status(200).json(updatedGoal);
    } catch (error) {
      res.status(500).json({ message: "Server error updating goal" });
    }
  });
  
  apiRouter.delete("/goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid goal ID" });
      }
      
      const success = await storage.deleteGoal(id);
      
      if (!success) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      res.status(200).json({ message: "Goal deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error deleting goal" });
    }
  });
  
  // Learning modules routes
  apiRouter.get("/modules", async (req, res) => {
    try {
      const modules = await storage.getModules();
      res.status(200).json(modules);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching modules" });
    }
  });
  
  apiRouter.get("/modules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid module ID" });
      }
      
      const module = await storage.getModule(id);
      
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      res.status(200).json(module);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching module" });
    }
  });
  
  // User progress routes
  apiRouter.get("/progress/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const progress = await storage.getUserProgressByUser(userId);
      
      res.status(200).json(progress);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching progress" });
    }
  });
  
  apiRouter.post("/progress", async (req, res) => {
    try {
      const { userId, moduleId } = req.body;
      
      if (!userId || !moduleId) {
        return res.status(400).json({ message: "User ID and module ID are required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const module = await storage.getModule(moduleId);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      const existingProgress = await storage.getUserProgressByModule(userId, moduleId);
      if (existingProgress) {
        return res.status(409).json({
          message: "Progress already exists for this module",
          progress: existingProgress
        });
      }
      
      const newProgress = await storage.createUserProgress({ userId, moduleId });
      
      res.status(201).json(newProgress);
    } catch (error) {
      res.status(500).json({ message: "Server error creating progress" });
    }
  });
  
  apiRouter.put("/progress/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid progress ID" });
      }
      
      const { percentComplete, completed } = req.body;
      
      if (percentComplete === undefined || completed === undefined) {
        return res.status(400).json({ message: "Percent complete and completed status are required" });
      }
      
      const updatedProgress = await storage.updateUserProgress(
        id, 
        percentComplete, 
        completed
      );
      
      res.status(200).json(updatedProgress);
    } catch (error) {
      res.status(500).json({ message: "Server error updating progress" });
    }
  });
  
  // Budget calculator
  apiRouter.post("/budget/calculate", async (req, res) => {
    try {
      const budgetResult = budgetCalculatorSchema.safeParse(req.body);
      
      if (!budgetResult.success) {
        return res.status(400).json({ message: "Invalid budget data", errors: budgetResult.error.format() });
      }
      
      const { monthlyIncome } = budgetResult.data;
      const budget = calculateBudget(monthlyIncome);
      
      res.status(200).json(budget);
    } catch (error) {
      res.status(500).json({ message: "Server error calculating budget" });
    }
  });

  // Financial AI Assistant API - provides AI-like answers without requiring login
  apiRouter.get("/anon/question-count", (req, res) => {
    if (req.session?.userId) {
      return res.json({ count: 0, limit: ANON_Q_LIMIT, isLoggedIn: true });
    }
    const deviceId = getOrCreateDeviceId(req, res);
    const count = anonQuestionCounts.get(deviceId) || 0;
    res.json({ count, limit: ANON_Q_LIMIT, isLoggedIn: false });
  });

  apiRouter.post("/financial-ai/ask", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ 
          message: "Invalid query parameter" 
        });
      }

      // Enforce question limit for anonymous users
      if (!req.session?.userId) {
        const deviceId = getOrCreateDeviceId(req, res);
        const count = anonQuestionCounts.get(deviceId) || 0;
        if (count >= ANON_Q_LIMIT) {
          return res.status(429).json({
            message: "Question limit reached",
            questionsUsed: count,
            limit: ANON_Q_LIMIT,
          });
        }
        anonQuestionCounts.set(deviceId, count + 1);
      }
      
      // Try to get user context for personalization if logged in
      let userContext: import('./financial-ai-api').UserContext | undefined;
      
      if (req.session?.userId) {
        try {
          const profile = await storage.getUserProfile(req.session.userId);
          if (profile) {
            userContext = {
              country: profile.country || undefined,
              age: profile.age || undefined,
              income: profile.income || undefined,
              experienceLevel: profile.experienceLevel || undefined,
              financialGoals: profile.financialGoals || undefined,
            };
          }
        } catch (e) {
          // Continue without context if profile fetch fails
        }
      }
      
      // Use the hybrid AI system with optional user context for personalization
      const response = await generateFinancialAiResponse(query, userContext);
      res.status(200).json(response);
    } catch (error) {
      console.error("Error in financial AI API:", error);
      res.status(500).json({ 
        message: "Could not generate a response", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Save favorite AI answer - requires login
  apiRouter.post("/financial-ai/save", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Login required to save answers" });
    }
    
    try {
      const { question, answer, keyPoints, actionItems } = req.body;
      
      if (!question || !answer) {
        return res.status(400).json({ message: "Question and answer are required" });
      }
      
      const saved = await db.insert(savedAnswers).values({
        userId: req.session.userId,
        question,
        answer,
        keyPoints: keyPoints || [],
        actionItems: actionItems || [],
      }).returning();
      
      res.status(201).json(saved[0]);
    } catch (error) {
      console.error("Error saving answer:", error);
      res.status(500).json({ message: "Failed to save answer" });
    }
  });
  
  // Get user's saved answers - requires login
  apiRouter.get("/financial-ai/saved", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Login required" });
    }
    
    try {
      const answers = await db.select().from(savedAnswers)
        .where(eq(savedAnswers.userId, req.session.userId))
        .orderBy(savedAnswers.createdAt);
      
      res.status(200).json(answers);
    } catch (error) {
      console.error("Error fetching saved answers:", error);
      res.status(500).json({ message: "Failed to fetch saved answers" });
    }
  });
  
  // Delete saved answer - requires login
  apiRouter.delete("/financial-ai/saved/:id", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Login required" });
    }
    
    try {
      const answerId = parseInt(req.params.id);
      await db.delete(savedAnswers)
        .where(and(eq(savedAnswers.id, answerId), eq(savedAnswers.userId, req.session.userId)));
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting saved answer:", error);
      res.status(500).json({ message: "Failed to delete answer" });
    }
  });

  // Geolocation API endpoint - provides user location based on IP
  apiRouter.get("/user/geo-location", (req, res) => {
    try {
      // Get the IP address of the client
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
      
      // Default country if we can't determine from IP
      let country = "United States";
      
      // Here we would typically do IP geolocation lookup, but for simplicity we'll use the IP 
      // to consistently assign a country (without making external API calls)
      if (typeof ip === 'string') {
        // Very simple algorithm just for demo purposes, maps different IPs to different countries
        const ipSum = ip.split('.').reduce((sum, num) => sum + parseInt(num || '0', 10), 0);
        const countries = ["United States", "Canada", "United Kingdom", "Australia", "India", "Germany", "Brazil", "South Africa"];
        country = countries[ipSum % countries.length];
      }
      
      res.status(200).json({ country, ip });
    } catch (error) {
      console.error("Error in geo-location API:", error);
      res.status(200).json({ country: "United States", error: "Failed to detect location" });
    }
  });

  // Authentication middleware
  const authenticateMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.session || !req.session.authenticated) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Publishing auth for news: accepts a logged-in admin session OR the
  // NEWS_API_TOKEN bearer token, so automated publishing (scripts, cron)
  // works without an interactive login. Set NEWS_API_TOKEN in the host env.
  const publishNewsAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = process.env.NEWS_API_TOKEN;
    const authHeader = req.headers.authorization;
    if (token && authHeader === `Bearer ${token}`) {
      return next();
    }
    return authenticateMiddleware(req, res, next);
  };
  
  // Location and currency routes
  apiRouter.get("/user/location", async (req, res) => {
    try {
      // Look for override in headers or query parameters
      let countryOverride: string | undefined;
      
      if (req.headers['x-country-override']) {
        countryOverride = Array.isArray(req.headers['x-country-override']) 
          ? req.headers['x-country-override'][0] 
          : req.headers['x-country-override'];
      } else if (req.query.country && typeof req.query.country === 'string') {
        countryOverride = req.query.country;
      }
      
      // Get location information from user's IP address
      const locationInfo = getLocationFromRequest(req, countryOverride);
      
      // Log the location detection for debugging
      console.log(`Location detected: ${locationInfo.country} (${locationInfo.countryName}), Currency: ${locationInfo.currencyCode}`);
      
      // Return location data to the client
      res.status(200).json(locationInfo);
    } catch (error) {
      console.error("Error determining user location:", error);
      res.status(500).json({ message: "Error determining location", error: String(error) });
    }
  });
  
  apiRouter.post("/currency/convert", async (req, res) => {
    try {
      const { amount, targetCurrency } = req.body;
      
      if (typeof amount !== 'number' || !targetCurrency) {
        return res.status(400).json({ 
          message: "Invalid request. 'amount' must be a number and 'targetCurrency' must be provided"
        });
      }
      
      // Convert the amount from USD to target currency
      const convertedAmount = await convertCurrency(amount, targetCurrency);
      
      // Format the amount according to the target currency
      const locationInfo = getLocationFromRequest(req);
      const customLocationInfo = {
        ...locationInfo,
        currencyCode: targetCurrency
      };
      
      const formattedAmount = formatCurrency(convertedAmount, customLocationInfo);
      
      res.status(200).json({
        originalAmount: amount,
        originalCurrency: "USD",
        convertedAmount,
        targetCurrency,
        formattedAmount
      });
    } catch (error) {
      console.error("Error converting currency:", error);
      res.status(500).json({ message: "Error converting currency", error: String(error) });
    }
  });
  
  // Get all exchange rates for a base currency (for currency converter tool)
  apiRouter.get("/currency/rates", async (req, res) => {
    try {
      const baseCurrency = (req.query.base as string) || "USD";
      
      // Use Frankfurter API - free, no API key required
      const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${baseCurrency}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      res.status(200).json({
        base: data.base,
        date: data.date,
        rates: data.rates
      });
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      res.status(500).json({ message: "Error fetching exchange rates", error: String(error) });
    }
  });
  
  // Get list of supported currencies
  apiRouter.get("/currency/list", async (req, res) => {
    try {
      const response = await fetch("https://api.frankfurter.dev/v1/currencies");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch currencies: ${response.statusText}`);
      }
      
      const currencies = await response.json();
      
      res.status(200).json(currencies);
    } catch (error) {
      console.error("Error fetching currency list:", error);
      res.status(500).json({ message: "Error fetching currency list", error: String(error) });
    }
  });
  
  // Budget calculation with automatic currency conversion
  apiRouter.post("/budget/calculate", async (req, res) => {
    try {
      const budgetResult = budgetCalculatorSchema.safeParse(req.body);
      
      if (!budgetResult.success) {
        return res.status(400).json({ 
          message: "Invalid budget data", 
          errors: budgetResult.error.format() 
        });
      }
      
      // Calculate budget in USD
      const { monthlyIncome } = budgetResult.data;
      const budget = calculateBudget(monthlyIncome);
      
      // Get user's location and currency information
      const locationInfo = getLocationFromRequest(req);
      
      // Convert each budget category to the user's local currency
      const localBudget: Record<string, any> = {};
      
      // Process each category with proper type checking
      if (typeof budget === 'object' && budget !== null) {
        // Process each budget category
        for (const category of Object.keys(budget)) {
          // Safely access with type checking
          const budgetCategory = budget as Record<string, number>;
          const usdAmount = budgetCategory[category];
          
          if (typeof usdAmount === 'number') {
            // Convert the amount to local currency
            const localAmount = await convertCurrency(usdAmount, locationInfo.currencyCode);
            
            // Format the amount according to local currency
            const formattedAmount = formatCurrency(localAmount, locationInfo);
            
            // Update the budget with converted amount
            localBudget[category] = {
              usdAmount,
              localAmount,
              formattedAmount
            };
          }
        }
      }
      
      res.status(200).json({
        budget: localBudget,
        currency: {
          code: locationInfo.currencyCode,
          symbol: locationInfo.currencySymbol,
          country: locationInfo.countryName
        },
        originalIncome: {
          usd: monthlyIncome,
          local: await convertCurrency(monthlyIncome, locationInfo.currencyCode),
          formatted: formatCurrency(
            await convertCurrency(monthlyIncome, locationInfo.currencyCode), 
            locationInfo
          )
        }
      });
    } catch (error) {
      console.error("Error calculating budget:", error);
      res.status(500).json({ message: "Server error calculating budget" });
    }
  });
  
  // Knowledge articles routes
  apiRouter.get("/knowledge/articles", async (req, res) => {
    try {
      const articles = await storage.getKnowledgeArticles();
      res.status(200).json(articles);
    } catch (error) {
      console.error("Error fetching knowledge articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });
  
  apiRouter.get("/knowledge/articles/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const articles = await storage.getKnowledgeArticlesByCategory(category);
      res.status(200).json(articles);
    } catch (error) {
      console.error(`Error fetching articles for category ${req.params.category}:`, error);
      res.status(500).json({ message: "Failed to fetch articles by category" });
    }
  });
  
  apiRouter.get("/knowledge/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }
      
      const article = await storage.getKnowledgeArticle(id);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Increment view count
      await storage.updateKnowledgeArticleViews(id);
      
      res.status(200).json(article);
    } catch (error) {
      console.error("Error fetching knowledge article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });
  
  // Protected route for creating articles (admin only)
  apiRouter.post("/knowledge/articles", authenticateMiddleware, async (req, res) => {
    try {
      // TODO: Add admin role check here when user roles are implemented
      
      const result = insertKnowledgeArticleSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid article data", 
          errors: result.error.format() 
        });
      }
      
      const newArticle = await storage.createKnowledgeArticle(result.data);
      res.status(201).json(newArticle);
    } catch (error) {
      console.error("Error creating knowledge article:", error);
      res.status(500).json({ message: "Failed to create article" });
    }
  });
  
  // News articles routes (public read, authenticated write)
  const slugify = (title: string): string => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
    return slug || `article-${Date.now()}`;
  };
  
  apiRouter.get("/news", async (req, res) => {
    try {
      const { type } = req.query;
      const articles = typeof type === "string" && type
        ? await storage.getNewsArticlesByType(type)
        : await storage.getNewsArticles();
      res.status(200).json(articles);
    } catch (error) {
      console.error("Error fetching news articles:", error);
      res.status(500).json({ message: "Failed to fetch news articles" });
    }
  });
  
  apiRouter.get("/news/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const article = await storage.getNewsArticleBySlug(slug);
      
      if (!article) {
        return res.status(404).json({ message: "News article not found" });
      }
      
      // Increment view count
      await storage.updateNewsArticleViews(article.id);
      
      res.status(200).json(article);
    } catch (error) {
      console.error("Error fetching news article:", error);
      res.status(500).json({ message: "Failed to fetch news article" });
    }
  });
  
  // Protected route for publishing news articles (admin only)
  apiRouter.post("/news", publishNewsAuth, async (req, res) => {
    try {
      // TODO: Add admin role check here when user roles are implemented
      
      const body = { ...req.body };
      if (!body.slug && body.title) {
        body.slug = slugify(body.title);
      }
      
      const result = insertNewsArticleSchema.safeParse(body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid news article data", 
          errors: result.error.format() 
        });
      }
      
      // Ensure the slug is unique
      let slug = result.data.slug;
      let suffix = 2;
      while (await storage.getNewsArticleBySlug(slug)) {
        slug = `${result.data.slug}-${suffix++}`;
      }
      
      const newArticle = await storage.createNewsArticle({ ...result.data, slug });
      res.status(201).json(newArticle);
    } catch (error) {
      console.error("Error creating news article:", error);
      res.status(500).json({ message: "Failed to create news article" });
    }
  });

  // Protected route for updating news articles (admin only)
  apiRouter.put("/news/:slug", publishNewsAuth, async (req, res) => {
    try {
      const existing = await storage.getNewsArticleBySlug(req.params.slug);
      if (!existing) {
        return res.status(404).json({ message: "Article not found" });
      }

      const body = { ...req.body };
      if (!body.slug && body.title) {
        body.slug = slugify(body.title);
      }

      const result = insertNewsArticleSchema.partial().safeParse(body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid news article data",
          errors: result.error.format()
        });
      }

      // Ensure the slug stays unique if it changed
      let slug = result.data.slug ?? existing.slug;
      if (slug !== existing.slug) {
        const base = slug;
        let suffix = 2;
        while (await storage.getNewsArticleBySlug(slug)) {
          slug = `${base}-${suffix++}`;
        }
      }

      const updated = await storage.updateNewsArticle(existing.id, { ...result.data, slug });
      res.json(updated);
    } catch (error) {
      console.error("Error updating news article:", error);
      res.status(500).json({ message: "Failed to update news article" });
    }
  });
  
  // AI Assistant
  apiRouter.get("/ai/conversations/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const conversations = await storage.getAiConversations(userId);
      
      res.status(200).json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching conversations" });
    }
  });
  
  apiRouter.post("/ai/ask", async (req, res) => {
    try {
      const conversationResult = insertAiConversationSchema.safeParse(req.body);
      
      if (!conversationResult.success) {
        return res.status(400).json({ message: "Invalid conversation data", errors: conversationResult.error.format() });
      }
      
      const { userId, question } = conversationResult.data;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // First, try to find relevant knowledge article
      const articles = await storage.getKnowledgeArticles();
      
      // Find the most relevant article by keyword matching
      const normalizedQuestion = question.toLowerCase();
      let bestMatch = null;
      let maxMatchScore = 0;
      
      for (const article of articles) {
        // Create a simple relevance score based on title and content matches
        const titleWords = article.title.toLowerCase().split(/\s+/);
        const contentWords = article.content.toLowerCase().split(/\s+/);
        
        // Count how many words from the title and content appear in the question
        const titleMatches = titleWords.filter(word => word.length > 3 && normalizedQuestion.includes(word)).length;
        const contentMatches = contentWords.filter(word => word.length > 3 && normalizedQuestion.includes(word)).length;
        
        // Calculate a score with title matches weighted more heavily
        const matchScore = (titleMatches * 3) + contentMatches;
        
        if (matchScore > maxMatchScore) {
          maxMatchScore = matchScore;
          bestMatch = article;
        }
      }
      
      let answer = '';
      // If we found a good match in the knowledge base, use it
      if (bestMatch && maxMatchScore > 1) {
        console.log(`Found relevant knowledge article: "${bestMatch.title}" (score: ${maxMatchScore})`);
        
        // Extract first paragraph for a concise answer
        const firstParagraph = bestMatch.content.split('\n\n')[0].trim();
        
        // Format answer to look like AI-generated response
        answer = `Based on my financial knowledge, ${firstParagraph}\n\nWould you like me to explain more about this topic or provide some practical examples?`;
        
        // Increment the view count for this article
        await storage.updateKnowledgeArticleViews(bestMatch.id);
      } else {
        // Fall back to actual AI response if no good match found
        console.log("No relevant knowledge article found, using AI fallback");
        const profile = await storage.getUserProfile(userId);
        answer = await generateAIResponse(
          question,
          sanitizeProfile(profile || {})
        );
      }
      
      // Save conversation with the knowledge-based or AI response
      const conversation = await storage.createAiConversation({ userId, question });
      const updatedConversation = await storage.updateAiConversation(conversation.id, answer);
      
      res.status(200).json(updatedConversation);
    } catch (error) {
      console.error("Error processing AI question:", error);
      res.status(500).json({ message: "Server error processing AI request" });
    }
  });
  
  // Enhanced AI capabilities
  
  // Get AI-powered onboarding questions
  apiRouter.get("/ai/onboarding-questions", async (req, res) => {
    try {
      // Get age and country from query params (if provided)
      const { age, country } = req.query;
      
      // Generate personalized onboarding questions
      const questions = await generateOnboardingQuestions({
        age: age as string,
        country: country as string
      });
      
      res.status(200).json(questions);
    } catch (error) {
      console.error("Error generating onboarding questions:", error);
      res.status(500).json({ message: "Error generating onboarding questions" });
    }
  });
  
  // Mark user onboarding as completed
  apiRouter.put("/user/:userId/complete-onboarding", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Store onboarding responses in user profile
      const { responses } = req.body;
      
      if (responses) {
        // Get or create user profile
        let profile = await storage.getUserProfile(userId);
        
        if (profile) {
          // Update existing profile with onboarding responses and experience level
          console.log(`Updating existing profile for user ${userId}`);
          const levelFromResponses = responses.experienceLevel || undefined;
          await storage.updateUserProfile(profile.id, {
            onboardingResponses: responses,
            ...(levelFromResponses ? { experienceLevel: levelFromResponses } : {}),
          });
        } else {
          // Create new profile with onboarding responses
          console.log(`Creating new profile for user ${userId}`);
          
          // Extract profile information from responses
          const age = responses.age || "18-24 years";
          const country = responses.country || "United States";
          const experienceLevel = responses.experienceLevel || "Beginner";
          const financialGoals = responses.financialGoals || ["Emergency Fund"];
          
          // Create the profile
          profile = await storage.createUserProfile({
            userId,
            age,
            country,
            experienceLevel,
            financialGoals,
            onboardingResponses: responses
          });
          
          console.log(`Created new profile: ${JSON.stringify(profile)}`);
        }
      }
      
      // Mark user onboarding as completed
      await db.update(users)
        .set({ onboardingCompleted: true })
        .where(eq(users.id, userId));
      
      res.status(200).json({ message: "Onboarding completed successfully" });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Error completing onboarding" });
    }
  });
  
  // Get personalized learning path
  apiRouter.get("/ai/learning-path/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const profile = await storage.getUserProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      
      const learningPath = await getLearningPath(sanitizeProfile(profile));
      
      res.status(200).json(learningPath);
    } catch (error) {
      console.error("Error generating learning path:", error);
      res.status(500).json({ message: "Error generating personalized learning path" });
    }
  });
  
  // Get financial health assessment
  apiRouter.get("/ai/health-assessment/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const profile = await storage.getUserProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      
      const assessment = await getFinancialHealthAssessment(sanitizeProfile(profile));
      
      res.status(200).json(assessment);
    } catch (error) {
      console.error("Error generating health assessment:", error);
      res.status(500).json({ message: "Error generating financial health assessment" });
    }
  });
  
  // Get financial plan
  apiRouter.get("/ai/financial-plan/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const profile = await storage.getUserProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      
      const financialPlan = await getFinancialPlan(sanitizeProfile(profile));
      
      res.status(200).json(financialPlan);
    } catch (error) {
      console.error("Error generating financial plan:", error);
      res.status(500).json({ message: "Error generating financial plan" });
    }
  });
  
  // Get regionalized advice
  apiRouter.post("/ai/regionalized-advice/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { topic, userLocation } = req.body;
      
      if (isNaN(userId) || !topic) {
        return res.status(400).json({ message: "Invalid user ID or missing topic" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const profile = await storage.getUserProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      
      // Use the user-provided location if available, otherwise use the profile country
      const sanitizedProfile = sanitizeProfile(profile);
      if (userLocation) {
        sanitizedProfile.country = userLocation;
      }
      
      const advice = await getRegionalizedAdvice(sanitizedProfile, topic);
      
      res.status(200).json(advice);
    } catch (error) {
      console.error("Error generating regionalized advice:", error);
      res.status(500).json({ message: "Error generating regionalized advice" });
    }
  });
  
  // Explain financial concept
  apiRouter.post("/ai/explain-concept", async (req, res) => {
    try {
      const { concept, experienceLevel, userLocation } = req.body;
      
      if (!concept || !experienceLevel) {
        return res.status(400).json({ message: "Concept and experience level are required" });
      }
      
      // Pass user location to explainConcept if available
      const explanation = await explainConcept(concept, experienceLevel, userLocation);
      
      res.status(200).json(explanation);
    } catch (error) {
      console.error("Error explaining concept:", error);
      res.status(500).json({ message: "Error explaining financial concept" });
    }
  });
  
  // Follow-up explanation (detailed or simplified)
  apiRouter.post("/ai/follow-up", async (req, res) => {
    try {
      const { userId, originalQuestion, mode } = req.body;
      
      if (!originalQuestion || !mode) {
        return res.status(400).json({ message: "Original question and mode are required" });
      }
      
      if (!['detailed', 'simple'].includes(mode)) {
        return res.status(400).json({ message: "Mode must be either 'detailed' or 'simple'" });
      }
      
      // Get the user profile if userId is provided
      let userContext = {};
      if (userId) {
        const userProfile = await storage.getUserProfile(parseInt(userId));
        if (userProfile) {
          userContext = {
            age: userProfile.age,
            experienceLevel: userProfile.experienceLevel,
            income: userProfile.income,
            country: userProfile.country
          };
        }
      }
      
      // Generate follow-up response based on mode
      let followUpPrompt = '';
      if (mode === 'detailed') {
        followUpPrompt = `The user wants a more detailed explanation for their question: "${originalQuestion}". Please provide a more comprehensive answer with additional details, examples, and context.`;
      } else {
        followUpPrompt = `The user wants a simpler explanation for their question: "${originalQuestion}". Please provide a simplified answer using basic terms, shorter sentences, and avoiding jargon.`;
      }
      
      // Since we know AI services aren't working, we'll just use our templates directly
      console.log(`Generating ${mode} template response for: "${originalQuestion}"`);
      
      // Create responses based on the mode
      let response = '';
      if (mode === 'detailed') {
        response = `Here's a more detailed explanation about ${originalQuestion}:
          
First, it's important to understand the key concepts. When we talk about ${originalQuestion}, we're referring to a fundamental aspect of personal finance that impacts your long-term financial health.

The main principles to consider are:
1. Planning ahead and setting realistic goals
2. Understanding associated risks and benefits
3. Implementing consistent strategies
4. Monitoring and adjusting as needed

Most financial experts recommend starting with a clear understanding of your current financial situation and then developing a structured approach based on your specific circumstances and goals.

I hope this more detailed explanation helps provide a broader context!`;
      } else {
        // Simple explanation
        response = `To explain ${originalQuestion} simply:

It's like making a plan for your money. You figure out what you have, decide what's most important to spend it on, and try to save some for later.

The key is to:
• Know what money you have coming in
• Spend less than you earn
• Save some for unexpected expenses
• Think about future needs

That's really the basic idea without all the complicated terms!`;
      }
      
      // Record this follow-up in conversations if userId is available
      if (userId) {
        try {
          await storage.createAiConversation({
            userId: parseInt(userId),
            question: mode === 'detailed' ? `Tell me more about: ${originalQuestion}` : `Explain simpler: ${originalQuestion}`,
            answer: response
          });
          console.log("Follow-up conversation recorded successfully");
        } catch (convError) {
          console.error("Error recording follow-up conversation:", convError);
        }
      }
      
      // Return the template response directly
      return res.status(200).json({ answer: response });
    } catch (error) {
      console.error("Error with follow-up request:", error);
      res.status(500).json({ message: "Error processing follow-up request" });
    }
  });
  
  // User stats update
  apiRouter.put("/user/stats/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const { level, points, streak } = req.body;
      
      if (level === undefined || points === undefined || streak === undefined) {
        return res.status(400).json({ message: "Level, points, and streak are required" });
      }
      
      const updatedUser = await storage.updateUserStats(id, level, points, streak);
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error updating user stats" });
    }
  });

  // Get current user from the authenticated users set

  apiRouter.get("/auth/me", async (req, res) => {
    try {
      // Check if user is authenticated via session
      console.log("Checking session authentication status");
      
      // Ensure session is saved before proceeding
      if (req.session.userId && req.session.authenticated) {
        console.log(`Fetching user with ID: ${req.session.userId} from session`);
        
        // Touch the session to extend its lifetime
        req.session.touch();
        
        // For debugging, log session expiry and cookie settings
        console.log(`Session cookie maxAge: ${req.session.cookie.maxAge}, expires: ${req.session.cookie.expires}`);
        
        const user = await storage.getUser(req.session.userId);
        
        if (!user) {
          console.log(`User with ID ${req.session.userId} not found in database`);
          // Clear invalid session
          req.session.destroy((err) => {
            if (err) console.error("Error destroying invalid session:", err);
          });
          return res.status(401).json({ message: "User not found" });
        }
        
        // Don't return the password
        const { password: _, ...userWithoutPassword } = user;
        
        // Save session to ensure cookie is set properly
        req.session.save((err) => {
          if (err) {
            console.error("Error saving session:", err);
            // Even if there's an error saving the session, still return the user
          }
          
          console.log(`Successfully returning authenticated user: ${user.username} (ID: ${user.id})`);
          res.status(200).json(userWithoutPassword);
        });
      } else {
        // No longer using legacy authentication fallback - requiring explicit login
        console.log("Session authentication failed. User must log in explicitly.");
        return res.status(401).json({ message: "Not authenticated" });
      }
    } catch (error: any) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Server error fetching current user", error: error?.message || "Unknown error" });
    }
  });
  
  // Premium status update endpoint
  apiRouter.post('/user/premium', async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const userId = req.session.userId;
      const { isPremium } = req.body;
      
      if (typeof isPremium !== 'boolean') {
        return res.status(400).json({ message: 'Invalid premium status. Expected boolean value.' });
      }
      
      // Update user's premium status
      const updatedUser = await storage.updateUserPremiumStatus(userId, isPremium);
      
      // Don't send password to client
      const { password, ...userWithoutPassword } = updatedUser;
      
      console.log(`User ${updatedUser.username} (ID: ${updatedUser.id}) premium status updated to: ${isPremium}`);
      
      res.status(200).json({
        message: `Premium status updated successfully to: ${isPremium ? 'Premium' : 'Standard'}`,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Error updating premium status:', error);
      res.status(500).json({ message: 'Server error updating premium status' });
    }
  });
  
  // Register the API routes with the /api prefix
  // Community API Routes
  apiRouter.use("/community", communityRoutes);
  // Leaderboard API Routes
  apiRouter.use("/leaderboard", leaderboardRoutes);
  
  // Financial Assistant API Routes (No API key required)
  apiRouter.get("/financial-assistant/search", (req: Request, res: Response) => {
    const query = req.query.q as string;
    const count = parseInt(req.query.count as string) || 3;
    
    if (!query) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }
    
    const answers = findRelevantAnswers(query, count);
    res.json({ answers });
  });
  
  apiRouter.get("/financial-assistant/question/:id", (req: Request, res: Response) => {
    const questionId = req.params.id;
    const question = getQuestionById(questionId);
    
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    
    // If the question has related questions, fetch them too
    let related: FinancialQuestion[] = [];
    if (question.relatedQuestions && question.relatedQuestions.length > 0) {
      related = getRelatedQuestions(question.relatedQuestions);
    }
    
    res.json({ question, related });
  });
  
  apiRouter.get("/financial-assistant/difficulty/:level", (req: Request, res: Response) => {
    const level = req.params.level as 'beginner' | 'intermediate' | 'advanced';
    
    if (!['beginner', 'intermediate', 'advanced'].includes(level)) {
      return res.status(400).json({ error: "Invalid difficulty level. Must be 'beginner', 'intermediate', or 'advanced'" });
    }
    
    const questions = getQuestionsByDifficulty(level);
    res.json({ questions });
  });
  
  apiRouter.get("/financial-assistant/tag/:tag", (req: Request, res: Response) => {
    const tag = req.params.tag;
    
    if (!tag) {
      return res.status(400).json({ error: "Tag parameter is required" });
    }
    
    const questions = getQuestionsByTag(tag);
    res.json({ questions });
  });
  
  // Get all financial concepts
  apiRouter.get("/financial-assistant/glossary", (req: Request, res: Response) => {
    try {
      // Import directly from concept-explainer
      import('./concept-explainer.js').then((conceptExplainer) => {
        // Return all loaded financial concepts
        const concepts = conceptExplainer.getFinancialConcepts();
        res.json({ concepts });
      }).catch(error => {
        console.error("Error loading concept explainer:", error);
        res.status(500).json({ message: "Error loading financial concepts" });
      });
    } catch (error) {
      console.error("Error getting financial concepts:", error);
      res.status(500).json({ message: "Error fetching financial concepts" });
    }
  });
  
  // Get a specific financial concept
  apiRouter.get("/financial-assistant/glossary/:concept", (req: Request, res: Response) => {
    try {
      const conceptName = req.params.concept;
      
      if (!conceptName) {
        return res.status(400).json({ error: "Concept parameter is required" });
      }
      
      // Get user experience level from query parameter or default to "beginner"
      const experienceLevel = (req.query.level as string) || "beginner";
      
      // Get user location from the request if available
      const locationInfo = getLocationFromRequest(req);
      const userLocation = locationInfo ? locationInfo.country : undefined;
      
      // Call explainConcept with the provided parameters
      explainConcept(conceptName, experienceLevel, userLocation)
        .then(explanation => {
          res.json(explanation);
        })
        .catch(error => {
          console.error(`Error explaining concept "${conceptName}":`, error);
          res.status(500).json({ message: "Error explaining financial concept" });
        });
    } catch (error) {
      console.error("Error in concept explanation route:", error);
      res.status(500).json({ message: "Server error processing concept request" });
    }
  });
  
  // Serve static files (PNG, SVG, HTML)
  app.use(express.static('.', {
    dotfiles: 'ignore',
    extensions: ['png', 'svg', 'html'],
    index: false
  }));

  // Download page route
  app.get("/download-promo", (req, res) => {
    res.sendFile(path.resolve("download-promo.html"));
  });

  app.use("/api", apiRouter);
  
  const httpServer = createServer(app);
  return httpServer;
}
