import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  level: integer("level").default(1),
  points: integer("points").default(0),
  streak: integer("streak").default(0),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  isPremium: boolean("is_premium").default(false),
  isEmailVerified: boolean("is_email_verified").default(false),
  verificationToken: text("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  lastLogin: timestamp("last_login"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  profiles: many(userProfiles),
  goals: many(goals),
  progress: many(userProgress),
  conversations: many(aiConversations),
}));

// User profile preferences
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  age: text("age"),
  experienceLevel: text("experience_level"),
  country: text("country"),
  financialGoals: text("financial_goals").array(),
  income: integer("income"),
  onboardingResponses: jsonb("onboarding_responses"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User profile relations
export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

// Financial goals
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  targetAmount: integer("target_amount").notNull(),
  currentAmount: integer("current_amount").default(0),
  isActive: boolean("is_active").default(true),
  isFocused: boolean("is_focused").default(false),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Goals relations
export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
}));

// Learning modules
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  level: text("level").notNull(),
  duration: integer("duration").notNull(), // in minutes
  imageUrl: text("image_url"),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Modules relations
export const modulesRelations = relations(modules, ({ many }) => ({
  progress: many(userProgress),
}));

// User progress on modules
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  moduleId: integer("module_id").notNull().references(() => modules.id),
  percentComplete: integer("percent_complete").default(0),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User progress relations
export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  module: one(modules, {
    fields: [userProgress.moduleId],
    references: [modules.id],
  }),
}));

// AI Assistant conversations
export const aiConversations = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  question: text("question").notNull(),
  answer: text("answer"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI conversation relations
export const aiConversationsRelations = relations(aiConversations, ({ one }) => ({
  user: one(users, {
    fields: [aiConversations.userId],
    references: [users.id],
  }),
}));

// Enhanced password validation schema
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must not exceed 128 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character")
  .refine((password) => {
    // Check for common weak patterns
    const weakPatterns = [
      /123456/, /password/, /qwerty/, /admin/, /letmein/,
      /welcome/, /monkey/, /dragon/, /master/, /shadow/
    ];
    return !weakPatterns.some(pattern => pattern.test(password.toLowerCase()));
  }, "Password contains common weak patterns");

// Schemas for insert operations
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  level: true,
  points: true,
  streak: true,
  onboardingCompleted: true,
  isPremium: true,
  createdAt: true,
}).extend({
  password: passwordSchema,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  onboardingResponses: z.record(z.string(), z.any()).optional(),
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  currentAmount: true,
  isActive: true,
  isFocused: true,
  createdAt: true,
});

export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true,
  createdAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  percentComplete: true,
  completed: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiConversationSchema = createInsertSchema(aiConversations).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type Module = typeof modules.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;

// Knowledge Base Articles
export const knowledgeArticles = pgTable("knowledge_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  tags: text("tags").array(),
  views: integer("views").default(0),
  dateCreated: timestamp("date_created").defaultNow(),
  dateUpdated: timestamp("date_updated").defaultNow(),
});

export const insertKnowledgeArticleSchema = createInsertSchema(knowledgeArticles).omit({
  id: true,
  views: true,
  dateCreated: true,
  dateUpdated: true,
});

export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;
export type InsertKnowledgeArticle = z.infer<typeof insertKnowledgeArticleSchema>;

// News Articles (press releases, company updates, and financial news)
export const newsArticles = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  imageUrl: text("image_url"),
  content: text("content").notNull(),
  type: text("type").notNull().default("news"),
  tags: text("tags").array(),
  views: integer("views").default(0),
  publishedAt: timestamp("published_at").defaultNow(),
  dateCreated: timestamp("date_created").defaultNow(),
  dateUpdated: timestamp("date_updated").defaultNow(),
});

export const insertNewsArticleSchema = createInsertSchema(newsArticles).omit({
  id: true,
  views: true,
  dateCreated: true,
  dateUpdated: true,
});

export type NewsArticle = typeof newsArticles.$inferSelect;
export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;

// Community Forum Schema
export const forumCategories = pgTable("forum_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertForumCategorySchema = createInsertSchema(forumCategories).omit({
  id: true,
  createdAt: true,
});

// Forum Posts (Discussions, Success Stories, Expert Advice)
export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => forumCategories.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array(),
  type: text("type").notNull().default("discussion"), // "discussion", "success_story", "expert_advice"
  isPinned: boolean("is_pinned").default(false),
  isLocked: boolean("is_locked").default(false),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertForumPostSchema = createInsertSchema(forumPosts).omit({
  id: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
});

// Forum Comments
export const forumComments = pgTable("forum_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => forumPosts.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"),
  content: text("content").notNull(),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertForumCommentSchema = createInsertSchema(forumComments).omit({
  id: true,
  isDeleted: true, 
  createdAt: true,
  updatedAt: true,
});

// Reaction Types (like, love, laugh, wow, sad, angry)
export const reactionTypes = pgTable("reaction_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  emoji: text("emoji").notNull(),
  sortOrder: integer("sort_order").default(0),
});

export const insertReactionTypeSchema = createInsertSchema(reactionTypes).omit({
  id: true,
});

// Post Reactions
export const postReactions = pgTable("post_reactions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => forumPosts.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  reactionTypeId: integer("reaction_type_id").references(() => reactionTypes.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    uniqueReaction: uniqueIndex("unique_post_reaction").on(table.postId, table.userId, table.reactionTypeId),
  };
});

export const insertPostReactionSchema = createInsertSchema(postReactions).omit({
  id: true,
  createdAt: true,
});

// Comment Reactions
export const commentReactions = pgTable("comment_reactions", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id").references(() => forumComments.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  reactionTypeId: integer("reaction_type_id").references(() => reactionTypes.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    uniqueReaction: uniqueIndex("unique_comment_reaction").on(table.commentId, table.userId, table.reactionTypeId),
  };
});

export const insertCommentReactionSchema = createInsertSchema(commentReactions).omit({
  id: true,
  createdAt: true,
});

// Community Challenges
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(), // "easy", "medium", "hard"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  prizePool: text("prize_pool"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Challenge Participants
export const challengeParticipants = pgTable("challenge_participants", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").references(() => challenges.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  points: integer("points").default(0),
  joined: timestamp("joined").defaultNow(),
  completionStatus: text("completion_status").default("in_progress"), // "in_progress", "completed", "dropped"
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    uniqueParticipant: uniqueIndex("unique_challenge_participant").on(table.challengeId, table.userId),
  };
});

export const insertChallengeParticipantSchema = createInsertSchema(challengeParticipants).omit({
  id: true,
  joined: true,
  updatedAt: true,
});

// Types
export type ForumCategory = typeof forumCategories.$inferSelect;
export type InsertForumCategory = z.infer<typeof insertForumCategorySchema>;

export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;

export type ForumComment = typeof forumComments.$inferSelect;
export type InsertForumComment = z.infer<typeof insertForumCommentSchema>;

export type ReactionType = typeof reactionTypes.$inferSelect;
export type InsertReactionType = z.infer<typeof insertReactionTypeSchema>;

export type PostReaction = typeof postReactions.$inferSelect;
export type InsertPostReaction = z.infer<typeof insertPostReactionSchema>;

export type CommentReaction = typeof commentReactions.$inferSelect;
export type InsertCommentReaction = z.infer<typeof insertCommentReactionSchema>;

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;

export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type InsertChallengeParticipant = z.infer<typeof insertChallengeParticipantSchema>;

export const budgetCalculatorSchema = z.object({
  monthlyIncome: z.number().min(0, "Income must be a positive number"),
});

export type BudgetCalculation = z.infer<typeof budgetCalculatorSchema>;

// Security Tables

// Failed login attempts tracking for account lockout
export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  successful: boolean("successful").default(false),
  failedAt: timestamp("failed_at").defaultNow(),
});

export const insertLoginAttemptSchema = createInsertSchema(loginAttempts).omit({
  id: true,
  failedAt: true,
});

// Account lockouts tracking
export const accountLockouts = pgTable("account_lockouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  lockedAt: timestamp("locked_at").defaultNow(),
  unlockedAt: timestamp("unlocked_at"),
  lockReason: text("lock_reason").default("failed_login_attempts"),
  attemptCount: integer("attempt_count").default(0),
  isActive: boolean("is_active").default(true),
});

export const insertAccountLockoutSchema = createInsertSchema(accountLockouts).omit({
  id: true,
  lockedAt: true,
});

// Comprehensive audit logging
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  email: text("email"),
  action: text("action").notNull(), // "login", "logout", "register", "password_change", etc.
  resource: text("resource"), // "user", "goal", "profile", etc.
  resourceId: text("resource_id"), // ID of the affected resource
  details: jsonb("details"), // Additional context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  sessionId: text("session_id"),
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

// Password history for preventing reuse
export const passwordHistory = pgTable("password_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPasswordHistorySchema = createInsertSchema(passwordHistory).omit({
  id: true,
  createdAt: true,
});

// Security Types
export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type InsertLoginAttempt = z.infer<typeof insertLoginAttemptSchema>;

export type AccountLockout = typeof accountLockouts.$inferSelect;
export type InsertAccountLockout = z.infer<typeof insertAccountLockoutSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type PasswordHistory = typeof passwordHistory.$inferSelect;
export type InsertPasswordHistory = z.infer<typeof insertPasswordHistorySchema>;

// AI Response Cache - stores common questions/answers to reduce API costs
export const aiResponseCache = pgTable("ai_response_cache", {
  id: serial("id").primaryKey(),
  queryHash: text("query_hash").notNull().unique(),
  query: text("query").notNull(),
  response: jsonb("response").notNull(),
  hitCount: integer("hit_count").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAiResponseCacheSchema = createInsertSchema(aiResponseCache).omit({
  id: true,
  hitCount: true,
  createdAt: true,
  updatedAt: true,
});

export type AiResponseCache = typeof aiResponseCache.$inferSelect;
export type InsertAiResponseCache = z.infer<typeof insertAiResponseCacheSchema>;

// Saved/Favorite Answers - users can save helpful AI responses
export const savedAnswers = pgTable("saved_answers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  keyPoints: text("key_points").array(),
  actionItems: text("action_items").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const savedAnswersRelations = relations(savedAnswers, ({ one }) => ({
  user: one(users, {
    fields: [savedAnswers.userId],
    references: [users.id],
  }),
}));

export const insertSavedAnswerSchema = createInsertSchema(savedAnswers).omit({
  id: true,
  createdAt: true,
});

export type SavedAnswer = typeof savedAnswers.$inferSelect;
export type InsertSavedAnswer = z.infer<typeof insertSavedAnswerSchema>;
