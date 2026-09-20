import { 
  users, type User, type InsertUser,
  userProfiles, type UserProfile, type InsertUserProfile,
  goals, type Goal, type InsertGoal,
  modules, type Module, type InsertModule,
  userProgress, type UserProgress, type InsertUserProgress,
  aiConversations, type AiConversation, type InsertAiConversation,
  knowledgeArticles, type KnowledgeArticle, type InsertKnowledgeArticle,
  newsArticles, type NewsArticle, type InsertNewsArticle,
  forumCategories, type ForumCategory, type InsertForumCategory,
  forumPosts, type ForumPost, type InsertForumPost,
  forumComments, type ForumComment, type InsertForumComment,
  reactionTypes, type ReactionType, type InsertReactionType,
  postReactions, type PostReaction, type InsertPostReaction,
  commentReactions, type CommentReaction, type InsertCommentReaction,
  challenges, type Challenge, type InsertChallenge,
  challengeParticipants, type ChallengeParticipant, type InsertChallengeParticipant
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";

// Storage interface
export interface IStorage {
  // User operations
  getAllUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStats(id: number, level?: number, points?: number, streak?: number): Promise<User>;
  updateUserPremiumStatus(id: number, isPremium: boolean): Promise<User>;
  updateUserLogin(id: number, ipAddress?: string): Promise<User>;
  verifyUserEmail(id: number): Promise<User>;
  updateVerificationToken(id: number, token: string, expiry: Date): Promise<User>;
  
  // User profile operations
  getUserProfile(userId: number): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(id: number, profile: Partial<InsertUserProfile>): Promise<UserProfile>;
  
  // Goals operations
  getGoals(userId: number): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<InsertGoal> & { currentAmount?: number, isActive?: boolean, isFocused?: boolean }): Promise<Goal>;
  deleteGoal(id: number): Promise<boolean>;
  
  // Learning modules operations
  getModules(): Promise<Module[]>;
  getModule(id: number): Promise<Module | undefined>;
  getModulesByLevel(level: string): Promise<Module[]>;
  createModule(module: InsertModule): Promise<Module>;
  
  // User progress operations
  getUserProgressByModule(userId: number, moduleId: number): Promise<UserProgress | undefined>;
  getUserProgressByUser(userId: number): Promise<UserProgress[]>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(id: number, percentComplete: number, completed: boolean): Promise<UserProgress>;
  
  // AI conversation operations
  getAiConversations(userId: number): Promise<AiConversation[]>;
  createAiConversation(conversation: InsertAiConversation): Promise<AiConversation>;
  updateAiConversation(id: number, answer: string): Promise<AiConversation>;
  
  // Knowledge articles operations
  getKnowledgeArticles(): Promise<KnowledgeArticle[]>;
  getKnowledgeArticlesByCategory(category: string): Promise<KnowledgeArticle[]>;
  getKnowledgeArticle(id: number): Promise<KnowledgeArticle | undefined>;
  createKnowledgeArticle(article: InsertKnowledgeArticle): Promise<KnowledgeArticle>;
  updateKnowledgeArticleViews(id: number): Promise<KnowledgeArticle>;
  
  // News articles operations
  getNewsArticles(): Promise<NewsArticle[]>;
  getNewsArticlesByType(type: string): Promise<NewsArticle[]>;
  getNewsArticleBySlug(slug: string): Promise<NewsArticle | undefined>;
  createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle>;
  updateNewsArticle(id: number, data: Partial<InsertNewsArticle>): Promise<NewsArticle>;
  updateNewsArticleViews(id: number): Promise<NewsArticle>;
  
  // Forum category operations
  getForumCategories(): Promise<ForumCategory[]>;
  getForumCategory(id: number): Promise<ForumCategory | undefined>;
  createForumCategory(category: InsertForumCategory): Promise<ForumCategory>;
  
  // Forum post operations
  getForumPosts(options?: { 
    categoryId?: number;
    userId?: number;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<ForumPost[]>;
  getForumPost(id: number): Promise<ForumPost | undefined>;
  createForumPost(post: InsertForumPost): Promise<ForumPost>;
  updateForumPost(id: number, post: Partial<InsertForumPost>): Promise<ForumPost>;
  deleteForumPost(id: number): Promise<boolean>;
  incrementForumPostView(id: number): Promise<ForumPost>;
  
  // Forum comment operations
  getForumComments(postId: number): Promise<ForumComment[]>;
  getForumComment(id: number): Promise<ForumComment | undefined>;
  createForumComment(comment: InsertForumComment): Promise<ForumComment>;
  updateForumComment(id: number, content: string): Promise<ForumComment>;
  deleteForumComment(id: number): Promise<boolean>;
  
  // Reaction operations
  getReactionTypes(): Promise<ReactionType[]>;
  createReactionType(reactionType: InsertReactionType): Promise<ReactionType>;
  
  // Post reaction operations
  getPostReactions(postId: number): Promise<{
    reactionType: ReactionType;
    count: number;
    userReacted: boolean;
  }[]>;
  createOrRemovePostReaction(reaction: InsertPostReaction): Promise<{ reactionAdded: boolean }>;
  
  // Comment reaction operations
  getCommentReactions(commentId: number): Promise<{
    reactionType: ReactionType;
    count: number;
    userReacted: boolean;
  }[]>;
  createOrRemoveCommentReaction(reaction: InsertCommentReaction): Promise<{ reactionAdded: boolean }>;
  
  // Challenge operations
  getChallenges(options?: {
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Challenge[]>;
  getChallenge(id: number): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallenge(id: number, challenge: Partial<InsertChallenge>): Promise<Challenge>;
  deleteChallenge(id: number): Promise<boolean>;
  
  // Challenge participant operations
  getChallengeParticipants(challengeId: number): Promise<ChallengeParticipant[]>;
  getChallengeParticipant(challengeId: number, userId: number): Promise<ChallengeParticipant | undefined>;
  joinChallenge(participant: InsertChallengeParticipant): Promise<ChallengeParticipant>;
  updateChallengeProgress(challengeId: number, userId: number, points: number, status?: string): Promise<ChallengeParticipant>;
}

// Memory Storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userProfiles: Map<number, UserProfile>;
  private goals: Map<number, Goal>;
  private modules: Map<number, Module>;
  private userProgress: Map<number, UserProgress>;
  private aiConversations: Map<number, AiConversation>;
  private knowledgeArticles: Map<number, KnowledgeArticle>;
  private newsArticles: Map<number, NewsArticle>;
  
  // Community-related storage
  private forumCategories: Map<number, ForumCategory>;
  private forumPosts: Map<number, ForumPost>;
  private forumComments: Map<number, ForumComment>;
  private reactionTypes: Map<number, ReactionType>;
  
  private postReactions: Map<number, PostReaction>;
  private commentReactions: Map<number, CommentReaction>;
  private challenges: Map<number, Challenge>;
  private challengeParticipants: Map<number, ChallengeParticipant>;
  
  private userId: number;
  private profileId: number;
  private goalId: number;
  private moduleId: number;
  private progressId: number;
  private conversationId: number;
  private articleId: number;
  private newsArticleId: number;
  private categoryId: number;
  private postId: number;
  private commentId: number;
  private reactionTypeId: number;
  private postReactionId: number;
  private commentReactionId: number;
  private challengeId: number;
  private participantId: number;
  
  constructor() {
    this.users = new Map();
    this.userProfiles = new Map();
    this.goals = new Map();
    this.modules = new Map();
    this.userProgress = new Map();
    this.aiConversations = new Map();
    this.knowledgeArticles = new Map();
    this.newsArticles = new Map();
    
    // Initialize community-related storage
    this.forumCategories = new Map();
    this.forumPosts = new Map();
    this.forumComments = new Map();
    this.reactionTypes = new Map();
    this.postReactions = new Map();
    this.commentReactions = new Map();
    this.challenges = new Map();
    this.challengeParticipants = new Map();
    
    this.userId = 1;
    this.profileId = 1;
    this.goalId = 1;
    this.moduleId = 1;
    this.progressId = 1;
    this.conversationId = 1;
    this.articleId = 1;
    this.newsArticleId = 1;
    this.categoryId = 1;
    this.postId = 1;
    this.commentId = 1;
    this.reactionTypeId = 1;
    this.postReactionId = 1;
    this.commentReactionId = 1;
    this.challengeId = 1;
    this.participantId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }
  
  // User operations
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { 
      ...user, 
      id, 
      level: 1, 
      points: 0, 
      streak: 0, 
      createdAt: new Date() 
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUserStats(id: number, level: number, points: number, streak: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser: User = {
      ...user,
      level,
      points,
      streak
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserPremiumStatus(id: number, isPremium: boolean): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser: User = {
      ...user,
      isPremium
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserLogin(id: number, ipAddress?: string): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser: User = {
      ...user,
      lastLogin: new Date(),
      ipAddress: ipAddress || user.ipAddress
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const [_, user] of this.users) {
      if (user.email?.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    for (const [_, user] of this.users) {
      if (user.verificationToken === token) {
        return user;
      }
    }
    return undefined;
  }
  
  async verifyUserEmail(id: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser: User = {
      ...user,
      isEmailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateVerificationToken(id: number, token: string, expiry: Date): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser: User = {
      ...user,
      verificationToken: token,
      verificationTokenExpiry: expiry
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // User profile operations
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    return Array.from(this.userProfiles.values()).find(profile => profile.userId === userId);
  }
  
  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const id = this.profileId++;
    const newProfile: UserProfile = {
      ...profile,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.userProfiles.set(id, newProfile);
    return newProfile;
  }
  
  async updateUserProfile(id: number, profile: Partial<InsertUserProfile>): Promise<UserProfile> {
    const existingProfile = this.userProfiles.get(id);
    if (!existingProfile) throw new Error("Profile not found");
    
    const updatedProfile: UserProfile = {
      ...existingProfile,
      ...profile,
      updatedAt: new Date()
    };
    
    this.userProfiles.set(id, updatedProfile);
    return updatedProfile;
  }
  
  // Goals operations
  async getGoals(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(goal => goal.userId === userId);
  }
  
  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }
  
  async createGoal(goal: InsertGoal): Promise<Goal> {
    const id = this.goalId++;
    const newGoal: Goal = {
      ...goal,
      id,
      currentAmount: 0,
      isActive: true,
      isFocused: false,
      createdAt: new Date()
    };
    this.goals.set(id, newGoal);
    return newGoal;
  }
  
  async updateGoal(id: number, goal: Partial<InsertGoal> & { currentAmount?: number, isActive?: boolean, isFocused?: boolean }): Promise<Goal> {
    const existingGoal = this.goals.get(id);
    if (!existingGoal) throw new Error("Goal not found");
    
    const updatedGoal: Goal = {
      ...existingGoal,
      ...goal
    };
    
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }
  
  async deleteGoal(id: number): Promise<boolean> {
    return this.goals.delete(id);
  }
  
  // Learning modules operations
  async getModules(): Promise<Module[]> {
    return Array.from(this.modules.values());
  }
  
  async getModule(id: number): Promise<Module | undefined> {
    return this.modules.get(id);
  }
  
  async getModulesByLevel(level: string): Promise<Module[]> {
    return Array.from(this.modules.values()).filter(module => module.level === level);
  }
  
  async createModule(module: InsertModule): Promise<Module> {
    const id = this.moduleId++;
    const newModule: Module = {
      ...module,
      id,
      createdAt: new Date()
    };
    this.modules.set(id, newModule);
    return newModule;
  }
  
  // User progress operations
  async getUserProgressByModule(userId: number, moduleId: number): Promise<UserProgress | undefined> {
    return Array.from(this.userProgress.values()).find(
      progress => progress.userId === userId && progress.moduleId === moduleId
    );
  }
  
  async getUserProgressByUser(userId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values()).filter(progress => progress.userId === userId);
  }
  
  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const id = this.progressId++;
    const newProgress: UserProgress = {
      ...progress,
      id,
      percentComplete: 0,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.userProgress.set(id, newProgress);
    return newProgress;
  }
  
  async updateUserProgress(id: number, percentComplete: number, completed: boolean): Promise<UserProgress> {
    const existingProgress = this.userProgress.get(id);
    if (!existingProgress) throw new Error("Progress record not found");
    
    const updatedProgress: UserProgress = {
      ...existingProgress,
      percentComplete,
      completed,
      updatedAt: new Date()
    };
    
    this.userProgress.set(id, updatedProgress);
    return updatedProgress;
  }
  
  // AI conversation operations
  async getAiConversations(userId: number): Promise<AiConversation[]> {
    return Array.from(this.aiConversations.values())
      .filter(conversation => conversation.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createAiConversation(conversation: InsertAiConversation): Promise<AiConversation> {
    const id = this.conversationId++;
    const newConversation: AiConversation = {
      ...conversation,
      id,
      answer: null,
      createdAt: new Date()
    };
    this.aiConversations.set(id, newConversation);
    return newConversation;
  }
  
  async updateAiConversation(id: number, answer: string): Promise<AiConversation> {
    const existingConversation = this.aiConversations.get(id);
    if (!existingConversation) throw new Error("Conversation not found");
    
    const updatedConversation: AiConversation = {
      ...existingConversation,
      answer
    };
    
    this.aiConversations.set(id, updatedConversation);
    return updatedConversation;
  }
  
  // Knowledge articles operations
  async getKnowledgeArticles(): Promise<KnowledgeArticle[]> {
    return Array.from(this.knowledgeArticles.values());
  }
  
  async getKnowledgeArticlesByCategory(category: string): Promise<KnowledgeArticle[]> {
    return Array.from(this.knowledgeArticles.values())
      .filter(article => article.category === category);
  }
  
  async getKnowledgeArticle(id: number): Promise<KnowledgeArticle | undefined> {
    return this.knowledgeArticles.get(id);
  }
  
  async createKnowledgeArticle(article: InsertKnowledgeArticle): Promise<KnowledgeArticle> {
    const id = this.articleId++;
    const newArticle: KnowledgeArticle = {
      ...article,
      id,
      views: 0,
      dateCreated: new Date(),
      dateUpdated: new Date()
    };
    this.knowledgeArticles.set(id, newArticle);
    return newArticle;
  }
  
  async updateKnowledgeArticleViews(id: number): Promise<KnowledgeArticle> {
    const article = this.knowledgeArticles.get(id);
    if (!article) throw new Error(`Article with id ${id} not found`);
    
    const updatedArticle: KnowledgeArticle = {
      ...article,
      views: article.views + 1
    };
    
    this.knowledgeArticles.set(id, updatedArticle);
    return updatedArticle;
  }
  
  // News articles operations
  async getNewsArticles(): Promise<NewsArticle[]> {
    return Array.from(this.newsArticles.values())
      .sort((a, b) => +new Date(b.publishedAt || 0) - +new Date(a.publishedAt || 0));
  }
  
  async getNewsArticlesByType(type: string): Promise<NewsArticle[]> {
    return Array.from(this.newsArticles.values())
      .filter(article => article.type === type)
      .sort((a, b) => +new Date(b.publishedAt || 0) - +new Date(a.publishedAt || 0));
  }
  
  async getNewsArticleBySlug(slug: string): Promise<NewsArticle | undefined> {
    return Array.from(this.newsArticles.values()).find(a => a.slug === slug);
  }
  
  async createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle> {
    const id = this.newsArticleId++;
    const newArticle: NewsArticle = {
      ...article,
      id,
      views: 0,
      publishedAt: article.publishedAt || new Date(),
      dateCreated: new Date(),
      dateUpdated: new Date()
    };
    this.newsArticles.set(id, newArticle);
    return newArticle;
  }
  
  async updateNewsArticle(id: number, data: Partial<InsertNewsArticle>): Promise<NewsArticle> {
    const article = this.newsArticles.get(id);
    if (!article) throw new Error(`News article with id ${id} not found`);
    
    const updatedArticle: NewsArticle = {
      ...article,
      ...data,
      id,
      views: article.views,
      dateCreated: article.dateCreated,
      dateUpdated: new Date()
    };
    
    this.newsArticles.set(id, updatedArticle);
    return updatedArticle;
  }
  
  async updateNewsArticleViews(id: number): Promise<NewsArticle> {
    const article = this.newsArticles.get(id);
    if (!article) throw new Error(`News article with id ${id} not found`);
    
    const updatedArticle: NewsArticle = {
      ...article,
      views: (article.views || 0) + 1,
      dateUpdated: new Date()
    };
    
    this.newsArticles.set(id, updatedArticle);
    return updatedArticle;
  }
  
  // Forum category operations
  async getForumCategories(): Promise<ForumCategory[]> {
    return Array.from(this.forumCategories.values())
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  
  async getForumCategory(id: number): Promise<ForumCategory | undefined> {
    return this.forumCategories.get(id);
  }
  
  async createForumCategory(category: InsertForumCategory): Promise<ForumCategory> {
    const id = this.categoryId++;
    const newCategory: ForumCategory = {
      ...category,
      id,
      createdAt: new Date()
    };
    this.forumCategories.set(id, newCategory);
    return newCategory;
  }
  
  // Forum post operations
  async getForumPosts(options?: { 
    categoryId?: number;
    userId?: number;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<ForumPost[]> {
    let posts = Array.from(this.forumPosts.values());
    
    if (options?.categoryId) {
      posts = posts.filter(post => post.categoryId === options.categoryId);
    }
    
    if (options?.userId) {
      posts = posts.filter(post => post.userId === options.userId);
    }
    
    if (options?.type) {
      posts = posts.filter(post => post.type === options.type);
    }
    
    // Sort by creation date, newest first
    posts = posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Apply pagination if provided
    if (options?.limit !== undefined) {
      const offset = options.offset || 0;
      posts = posts.slice(offset, offset + options.limit);
    }
    
    return posts;
  }
  
  async getForumPost(id: number): Promise<ForumPost | undefined> {
    return this.forumPosts.get(id);
  }
  
  async createForumPost(post: InsertForumPost): Promise<ForumPost> {
    const id = this.postId++;
    const newPost: ForumPost = {
      ...post,
      id,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.forumPosts.set(id, newPost);
    return newPost;
  }
  
  async updateForumPost(id: number, post: Partial<InsertForumPost>): Promise<ForumPost> {
    const existingPost = this.forumPosts.get(id);
    if (!existingPost) throw new Error("Post not found");
    
    const updatedPost: ForumPost = {
      ...existingPost,
      ...post,
      updatedAt: new Date()
    };
    
    this.forumPosts.set(id, updatedPost);
    return updatedPost;
  }
  
  async deleteForumPost(id: number): Promise<boolean> {
    return this.forumPosts.delete(id);
  }
  
  async incrementForumPostView(id: number): Promise<ForumPost> {
    const post = this.forumPosts.get(id);
    if (!post) throw new Error(`Post with id ${id} not found`);
    
    const updatedPost: ForumPost = {
      ...post,
      viewCount: post.viewCount + 1
    };
    
    this.forumPosts.set(id, updatedPost);
    return updatedPost;
  }
  
  // Forum comment operations
  async getForumComments(postId: number): Promise<ForumComment[]> {
    return Array.from(this.forumComments.values())
      .filter(comment => comment.postId === postId && !comment.isDeleted)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async getForumComment(id: number): Promise<ForumComment | undefined> {
    return this.forumComments.get(id);
  }
  
  async createForumComment(comment: InsertForumComment): Promise<ForumComment> {
    const id = this.commentId++;
    const newComment: ForumComment = {
      ...comment,
      id,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.forumComments.set(id, newComment);
    return newComment;
  }
  
  async updateForumComment(id: number, content: string): Promise<ForumComment> {
    const existingComment = this.forumComments.get(id);
    if (!existingComment) throw new Error("Comment not found");
    
    const updatedComment: ForumComment = {
      ...existingComment,
      content,
      updatedAt: new Date()
    };
    
    this.forumComments.set(id, updatedComment);
    return updatedComment;
  }
  
  async deleteForumComment(id: number): Promise<boolean> {
    const existingComment = this.forumComments.get(id);
    if (!existingComment) return false;
    
    const updatedComment: ForumComment = {
      ...existingComment,
      isDeleted: true,
      content: "[This comment has been deleted]",
      updatedAt: new Date()
    };
    
    this.forumComments.set(id, updatedComment);
    return true;
  }
  
  // Reaction operations
  async getReactionTypes(): Promise<ReactionType[]> {
    return Array.from(this.reactionTypes.values())
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  
  async createReactionType(reactionType: InsertReactionType): Promise<ReactionType> {
    const id = this.reactionTypeId++;
    const newReactionType: ReactionType = {
      ...reactionType,
      id
    };
    this.reactionTypes.set(id, newReactionType);
    return newReactionType;
  }
  
  // Post reaction operations
  async getPostReactions(postId: number): Promise<{
    reactionType: ReactionType;
    count: number;
    userReacted: boolean;
  }[]> {
    // Group reactions by type
    const reactions = Array.from(this.postReactions.values())
      .filter(reaction => reaction.postId === postId);
    
    const reactionTypes = await this.getReactionTypes();
    const result = reactionTypes.map(type => {
      const reactionsOfType = reactions.filter(r => r.reactionTypeId === type.id);
      
      return {
        reactionType: type,
        count: reactionsOfType.length,
        userReacted: false // Will be set by the API endpoint based on current user
      };
    });
    
    return result;
  }
  
  async createOrRemovePostReaction(reaction: InsertPostReaction): Promise<{ reactionAdded: boolean }> {
    // Check if user already reacted with this reaction type
    const existingReaction = Array.from(this.postReactions.values()).find(
      r => r.postId === reaction.postId && 
           r.userId === reaction.userId && 
           r.reactionTypeId === reaction.reactionTypeId
    );
    
    if (existingReaction) {
      // If reaction exists, remove it
      this.postReactions.delete(existingReaction.id);
      return { reactionAdded: false };
    } else {
      // If reaction doesn't exist, add it
      const id = this.postReactionId++;
      const newReaction: PostReaction = {
        ...reaction,
        id,
        createdAt: new Date()
      };
      this.postReactions.set(id, newReaction);
      return { reactionAdded: true };
    }
  }
  
  // Comment reaction operations
  async getCommentReactions(commentId: number): Promise<{
    reactionType: ReactionType;
    count: number;
    userReacted: boolean;
  }[]> {
    // Group reactions by type
    const reactions = Array.from(this.commentReactions.values())
      .filter(reaction => reaction.commentId === commentId);
    
    const reactionTypes = await this.getReactionTypes();
    const result = reactionTypes.map(type => {
      const reactionsOfType = reactions.filter(r => r.reactionTypeId === type.id);
      
      return {
        reactionType: type,
        count: reactionsOfType.length,
        userReacted: false // Will be set by the API endpoint based on current user
      };
    });
    
    return result;
  }
  
  async createOrRemoveCommentReaction(reaction: InsertCommentReaction): Promise<{ reactionAdded: boolean }> {
    // Check if user already reacted with this reaction type
    const existingReaction = Array.from(this.commentReactions.values()).find(
      r => r.commentId === reaction.commentId && 
           r.userId === reaction.userId && 
           r.reactionTypeId === reaction.reactionTypeId
    );
    
    if (existingReaction) {
      // If reaction exists, remove it
      this.commentReactions.delete(existingReaction.id);
      return { reactionAdded: false };
    } else {
      // If reaction doesn't exist, add it
      const id = this.commentReactionId++;
      const newReaction: CommentReaction = {
        ...reaction,
        id,
        createdAt: new Date()
      };
      this.commentReactions.set(id, newReaction);
      return { reactionAdded: true };
    }
  }
  
  // Challenge operations
  async getChallenges(options?: {
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Challenge[]> {
    let challenges = Array.from(this.challenges.values());
    
    if (options?.isActive !== undefined) {
      challenges = challenges.filter(challenge => challenge.isActive === options.isActive);
    }
    
    // Sort by start date, newest first
    challenges = challenges.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    
    // Apply pagination if provided
    if (options?.limit !== undefined) {
      const offset = options.offset || 0;
      challenges = challenges.slice(offset, offset + options.limit);
    }
    
    return challenges;
  }
  
  async getChallenge(id: number): Promise<Challenge | undefined> {
    return this.challenges.get(id);
  }
  
  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const id = this.challengeId++;
    const newChallenge: Challenge = {
      ...challenge,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.challenges.set(id, newChallenge);
    return newChallenge;
  }
  
  async updateChallenge(id: number, challenge: Partial<InsertChallenge>): Promise<Challenge> {
    const existingChallenge = this.challenges.get(id);
    if (!existingChallenge) throw new Error("Challenge not found");
    
    const updatedChallenge: Challenge = {
      ...existingChallenge,
      ...challenge,
      updatedAt: new Date()
    };
    
    this.challenges.set(id, updatedChallenge);
    return updatedChallenge;
  }
  
  async deleteChallenge(id: number): Promise<boolean> {
    return this.challenges.delete(id);
  }
  
  // Challenge participant operations
  async getChallengeParticipants(challengeId: number): Promise<ChallengeParticipant[]> {
    return Array.from(this.challengeParticipants.values())
      .filter(participant => participant.challengeId === challengeId)
      .sort((a, b) => b.points - a.points); // Sort by points (highest first)
  }
  
  async getChallengeParticipant(challengeId: number, userId: number): Promise<ChallengeParticipant | undefined> {
    return Array.from(this.challengeParticipants.values()).find(
      participant => participant.challengeId === challengeId && participant.userId === userId
    );
  }
  
  async joinChallenge(participant: InsertChallengeParticipant): Promise<ChallengeParticipant> {
    const id = this.participantId++;
    const newParticipant: ChallengeParticipant = {
      ...participant,
      id,
      joined: new Date(),
      updatedAt: new Date()
    };
    this.challengeParticipants.set(id, newParticipant);
    return newParticipant;
  }
  
  async updateChallengeProgress(challengeId: number, userId: number, points: number, status?: string): Promise<ChallengeParticipant> {
    const participant = await this.getChallengeParticipant(challengeId, userId);
    if (!participant) throw new Error("Participant not found");
    
    const updatedParticipant: ChallengeParticipant = {
      ...participant,
      points: participant.points + points,
      completionStatus: status || participant.completionStatus,
      updatedAt: new Date()
    };
    
    this.challengeParticipants.set(participant.id, updatedParticipant);
    return updatedParticipant;
  }
  
  // Initialize with sample data
  private initializeSampleData() {
    // Create default user
    const user: User = {
      id: this.userId++,
      username: "john_doe",
      password: "password123",
      displayName: "John",
      level: 3,
      points: 210,
      streak: 4,
      createdAt: new Date()
    };
    this.users.set(user.id, user);
    
    // Create another user
    const user2: User = {
      id: this.userId++,
      username: "angel",
      password: "angel123",
      displayName: "Angel",
      level: 2,
      points: 150,
      streak: 2,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    };
    this.users.set(user2.id, user2);
    
    // Create user profile
    const profile: UserProfile = {
      id: this.profileId++,
      userId: user.id,
      age: "18-24 years",
      experienceLevel: "Beginner",
      country: "United States",
      financialGoals: ["Save for education", "Build emergency fund", "Learn investing basics"],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.userProfiles.set(profile.id, profile);
    
    // Create another user profile
    const profile2: UserProfile = {
      id: this.profileId++,
      userId: user2.id,
      age: "25-34 years",
      experienceLevel: "Intermediate",
      country: "Canada",
      financialGoals: ["Invest for retirement", "Save for a home", "Reduce debt"],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.userProfiles.set(profile2.id, profile2);
    
    // Initialize reaction types
    const reactionTypes = [
      { name: "like", emoji: "👍", sortOrder: 1 },
      { name: "love", emoji: "❤️", sortOrder: 2 },
      { name: "celebrate", emoji: "🎉", sortOrder: 3 },
      { name: "insightful", emoji: "💡", sortOrder: 4 },
      { name: "curious", emoji: "🤔", sortOrder: 5 }
    ];
    
    reactionTypes.forEach(type => {
      const reactionType: ReactionType = {
        id: this.reactionTypeId++,
        ...type
      };
      this.reactionTypes.set(reactionType.id, reactionType);
    });
    
    // Initialize forum categories
    const categories = [
      { name: "Budgeting Tips", description: "Share your best budgeting strategies and tips", icon: "wallet", sortOrder: 1 },
      { name: "Investing", description: "Discuss investment strategies for beginners and experienced investors", icon: "trending-up", sortOrder: 2 },
      { name: "Saving", description: "Tips and tricks for saving money", icon: "piggy-bank", sortOrder: 3 },
      { name: "Debt Management", description: "Strategies for managing and eliminating debt", icon: "credit-card", sortOrder: 4 },
      { name: "Financial Success Stories", description: "Share your financial wins and success stories", icon: "award", sortOrder: 5 }
    ];
    
    categories.forEach(category => {
      const forumCategory: ForumCategory = {
        id: this.categoryId++,
        ...category,
        createdAt: new Date()
      };
      this.forumCategories.set(forumCategory.id, forumCategory);
    });
    
    // Add some sample forum posts
    const samplePosts = [
      {
        categoryId: 1, // Budgeting Tips
        userId: user.id,
        title: "50/30/20 Budgeting Changed My Life",
        content: "I wanted to share how the 50/30/20 budgeting rule completely transformed my finances as a student. I used to constantly run out of money before the end of the month, but after implementing this simple rule (50% needs, 30% wants, 20% savings), I'm actually building savings while still enjoying my life! Here's how I broke it down in my situation...",
        type: "success_story",
        tags: ["budgeting", "student finance", "50/30/20 rule"],
        isPinned: true,
        isLocked: false
      },
      {
        categoryId: 2, // Investing
        userId: user2.id,
        title: "Getting Started with Index Funds",
        content: "After years of being intimidated by investing, I finally took the plunge with index funds and wanted to share my experience for other beginners. Index funds offer instant diversification with low fees, making them perfect for new investors. I started with just $50 per month into a total market index fund, and I'm already seeing the benefits of compound growth...",
        type: "discussion",
        tags: ["investing", "index funds", "beginner investing"],
        isPinned: false,
        isLocked: false
      },
      {
        categoryId: 5, // Financial Success Stories
        userId: user.id,
        title: "Paid Off $10K in Student Loans in One Year!",
        content: "I'm excited to share that I just made my final student loan payment, eliminating $10,000 in debt in just 12 months! My strategy included cutting unnecessary subscriptions, picking up a weekend side gig, and using the debt avalanche method. The relief of being debt-free is indescribable...",
        type: "success_story",
        tags: ["debt payoff", "student loans", "financial freedom"],
        isPinned: false,
        isLocked: false
      }
    ];
    
    samplePosts.forEach(postData => {
      const post: ForumPost = {
        id: this.postId++,
        viewCount: Math.floor(Math.random() * 100),
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        ...postData
      };
      this.forumPosts.set(post.id, post);
      
      // Add some comments to each post
      const commentContent = [
        "This is incredibly helpful, thank you for sharing your experience!",
        "I've been trying something similar with mixed results. Did you encounter any challenges at the beginning?",
        "Great post! Would you recommend this approach for someone just starting their financial journey?",
        "I'm going to try implementing this strategy this month. Any additional tips you'd recommend?",
        "Thanks for breaking this down in such an accessible way. It makes financial concepts much less intimidating."
      ];
      
      // Add 2-4 comments per post
      const commentCount = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < commentCount; i++) {
        const comment: ForumComment = {
          id: this.commentId++,
          postId: post.id,
          userId: i % 2 === 0 ? user.id : user2.id, // Alternate between users
          parentId: null,
          content: commentContent[i],
          isDeleted: false,
          createdAt: new Date(post.createdAt.getTime() + (i + 1) * 2 * 60 * 60 * 1000), // Add a few hours after post
          updatedAt: new Date(post.createdAt.getTime() + (i + 1) * 2 * 60 * 60 * 1000)
        };
        this.forumComments.set(comment.id, comment);
        
        // Add some reactions to comments
        if (i < 2) {
          const reactionTypeId = Math.floor(Math.random() * 5) + 1; // Random reaction type (1-5)
          const commentReaction: CommentReaction = {
            id: this.commentReactionId++,
            commentId: comment.id,
            userId: i % 2 === 0 ? user2.id : user.id, // Opposite user from comment author
            reactionTypeId,
            createdAt: new Date()
          };
          this.commentReactions.set(commentReaction.id, commentReaction);
        }
      }
      
      // Add some reactions to posts
      for (let i = 0; i < 3; i++) {
        const reactionTypeId = Math.floor(Math.random() * 5) + 1; // Random reaction type (1-5)
        const postReaction: PostReaction = {
          id: this.postReactionId++,
          postId: post.id,
          userId: i % 2 === 0 ? user.id : user2.id, // Alternate between users
          reactionTypeId,
          createdAt: new Date()
        };
        this.postReactions.set(postReaction.id, postReaction);
      }
    });
    
    // Create sample goals
    const emergencyFund: Goal = {
      id: this.goalId++,
      userId: user.id,
      title: "Emergency Fund",
      targetAmount: 1500,
      currentAmount: 500,
      isActive: true,
      isFocused: true,
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
      createdAt: new Date()
    };
    this.goals.set(emergencyFund.id, emergencyFund);
    
    const laptop: Goal = {
      id: this.goalId++,
      userId: user.id,
      title: "Laptop for College",
      targetAmount: 1000,
      currentAmount: 150,
      isActive: true,
      isFocused: false,
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
      createdAt: new Date()
    };
    this.goals.set(laptop.id, laptop);
    
    // Create learning modules
    const moduleData = [
      {
        title: "Emergency Fund Basics",
        description: "Learn why and how to build your emergency savings",
        type: "article",
        level: "Beginner",
        duration: 15,
        imageUrl: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&auto=format&fit=crop&q=80",
        content: "Emergency fund content here..."
      },
      {
        title: "Budgeting 101",
        description: "Create your first budget with our simple template",
        type: "activity",
        level: "Beginner",
        duration: 10,
        imageUrl: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=600&auto=format&fit=crop&q=80",
        content: "Budgeting content here..."
      },
      {
        title: "Banking Fundamentals",
        description: "Understanding accounts, fees, and digital banking",
        type: "quiz",
        level: "Beginner",
        duration: 5,
        imageUrl: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&auto=format&fit=crop&q=80",
        content: "Banking content here..."
      },
      {
        title: "Banking Basics",
        description: "Learn about different types of accounts and how to choose the right one.",
        type: "interactive",
        level: "Beginner",
        duration: 10,
        imageUrl: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&auto=format&fit=crop&q=80",
        content: "Banking basics content here..."
      },
      {
        title: "Saving Strategies",
        description: "Simple techniques to boost your savings rate without feeling deprived.",
        type: "video",
        level: "Intermediate",
        duration: 6,
        imageUrl: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=600&auto=format&fit=crop&q=80",
        content: "Saving strategies content here..."
      },
      {
        title: "Financial Terms Quiz",
        description: "Test your knowledge of essential financial vocabulary with this quick quiz.",
        type: "quiz",
        level: "All Levels",
        duration: 5,
        imageUrl: "https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=600&auto=format&fit=crop&q=80",
        content: "Financial terms quiz content here..."
      }
    ];
    
    moduleData.forEach(data => {
      const module: Module = {
        id: this.moduleId++,
        ...data,
        createdAt: new Date()
      };
      this.modules.set(module.id, module);
    });
    
    // Create user progress
    const progress: UserProgress = {
      id: this.progressId++,
      userId: user.id,
      moduleId: 1,
      percentComplete: 40,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.userProgress.set(progress.id, progress);
    
    // Create AI conversation
    const conversation: AiConversation = {
      id: this.conversationId++,
      userId: user.id,
      question: "How much should I save each month?",
      answer: "Based on your current income and expenses, I recommend starting with saving 15% of your monthly income (about $300). Focus first on building your emergency fund, then work toward your laptop goal.",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
    };
    this.aiConversations.set(conversation.id, conversation);
    
    // Create knowledge articles
    const knowledgeArticleData = [
      {
        title: "What is an Emergency Fund?",
        content: "An emergency fund is money you set aside for unexpected financial needs or emergencies. It provides a financial safety net that keeps you from adding new debt when you have sudden expenses like car repairs, medical bills, or living expenses after losing a job.\n\nFinancial experts typically recommend saving 3-6 months of your essential expenses in an emergency fund. For students or those just starting their financial journey, even $500-$1,000 can make a significant difference in handling unexpected expenses.\n\nYour emergency fund should be kept in a liquid account like a high-yield savings account, where you can access it quickly when needed but separate from your regular checking account to avoid temptation.",
        category: "Saving",
        tags: ["emergency fund", "saving", "financial security", "beginner"],
        views: 42,
        dateCreated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        dateUpdated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
      },
      {
        title: "Understanding Credit Scores",
        content: "A credit score is a three-digit number that represents your creditworthiness to lenders. FICO scores, the most commonly used scores, range from 300-850, with higher scores indicating lower credit risk.\n\nYour credit score is calculated based on several factors:\n- Payment history (35%): Whether you've paid past accounts on time\n- Credit utilization (30%): Amount of available credit you're using\n- Length of credit history (15%): How long you've had credit accounts\n- New credit (10%): Recently opened accounts and inquiries\n- Credit mix (10%): Types of credit accounts you have\n\nMaintaining a good credit score (700+) helps you qualify for lower interest rates on loans and credit cards, can affect housing applications, and sometimes even job opportunities.",
        category: "Credit",
        tags: ["credit score", "FICO", "credit building", "intermediate"],
        views: 38,
        dateCreated: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        dateUpdated: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      },
      {
        title: "Budgeting Basics: The 50/30/20 Rule",
        content: "The 50/30/20 rule is a simple budgeting method that divides your after-tax income into three categories:\n\n- 50% for needs (essential expenses like rent, groceries, utilities, minimum debt payments, etc.)\n- 30% for wants (non-essential spending like entertainment, dining out, hobbies, etc.)\n- 20% for savings and debt repayment (emergency fund, retirement, paying down debt beyond minimum payments)\n\nThis framework provides flexibility while ensuring you're covering essentials, enjoying life, and building financial security. It's especially helpful for beginners who find detailed line-item budgeting overwhelming.\n\nTo get started, calculate your monthly after-tax income, then multiply by 0.5, 0.3, and 0.2 to find your spending targets for each category. Track your spending for a month to see how it compares to these guidelines, then adjust as needed for your personal situation.",
        category: "Budgeting",
        tags: ["budgeting", "50/30/20 rule", "money management", "beginner"],
        views: 76,
        dateCreated: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        dateUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      }
    ];
    
    knowledgeArticleData.forEach(data => {
      const article: KnowledgeArticle = {
        id: this.articleId++,
        ...data
      };
      this.knowledgeArticles.set(article.id, article);
    });
  }
}

// Database Storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUserStats(id: number, level?: number, points?: number, streak?: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    
    const updates: Partial<User> = {};
    if (level !== undefined) updates.level = level;
    if (points !== undefined) updates.points = points;
    if (streak !== undefined) updates.streak = streak;
    
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async updateUserPremiumStatus(id: number, isPremium: boolean): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ isPremium })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async updateUserLogin(id: number, ipAddress?: string): Promise<User> {
    const updates: Partial<User> = {
      lastLogin: new Date()
    };
    
    if (ipAddress) {
      updates.ipAddress = ipAddress;
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async verifyUserEmail(id: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        isEmailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null
      })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async updateVerificationToken(id: number, token: string, expiry: Date): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        verificationToken: token,
        verificationTokenExpiry: expiry,
        isEmailVerified: false
      })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  // Community forum operations
  async getForumCategories(): Promise<ForumCategory[]> {
    return db.select().from(forumCategories);
  }

  async getForumCategory(id: number): Promise<ForumCategory | undefined> {
    const [category] = await db.select().from(forumCategories).where(eq(forumCategories.id, id));
    return category;
  }

  async createForumCategory(category: InsertForumCategory): Promise<ForumCategory> {
    const [newCategory] = await db.insert(forumCategories).values(category).returning();
    return newCategory;
  }
  
  // Forum post operations
  async getForumPosts(options?: { 
    categoryId?: number;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<ForumPost[]> {
    let query = db.select().from(forumPosts);
    
    if (options?.categoryId) {
      query = query.where(eq(forumPosts.categoryId, options.categoryId));
    }
    
    if (options?.type) {
      query = query.where(eq(forumPosts.type, options.type));
    }
    
    // Add pagination if provided
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return query.orderBy(desc(forumPosts.createdAt));
  }

  async getForumPost(id: number): Promise<ForumPost | undefined> {
    const [post] = await db.select().from(forumPosts).where(eq(forumPosts.id, id));
    return post;
  }

  async createForumPost(post: InsertForumPost): Promise<ForumPost> {
    const [newPost] = await db.insert(forumPosts).values(post).returning();
    return newPost;
  }

  async updateForumPost(id: number, postData: Partial<InsertForumPost>): Promise<ForumPost> {
    const [updatedPost] = await db
      .update(forumPosts)
      .set(postData)
      .where(eq(forumPosts.id, id))
      .returning();
    return updatedPost;
  }

  async deleteForumPost(id: number): Promise<boolean> {
    const result = await db
      .delete(forumPosts)
      .where(eq(forumPosts.id, id));
    return result.rowCount > 0;
  }

  async incrementForumPostView(id: number): Promise<ForumPost> {
    const [post] = await db.select().from(forumPosts).where(eq(forumPosts.id, id));
    if (!post) throw new Error("Post not found");
    
    const [updatedPost] = await db
      .update(forumPosts)
      .set({ viewCount: post.viewCount + 1 })
      .where(eq(forumPosts.id, id))
      .returning();
    
    return updatedPost;
  }
  
  // Forum comments operations
  async getForumComments(postId: number): Promise<ForumComment[]> {
    return db
      .select()
      .from(forumComments)
      .where(eq(forumComments.postId, postId))
      .orderBy(forumComments.createdAt);
  }

  async createForumComment(comment: InsertForumComment): Promise<ForumComment> {
    const [newComment] = await db.insert(forumComments).values(comment).returning();
    return newComment;
  }

  async updateForumComment(id: number, commentData: Partial<InsertForumComment>): Promise<ForumComment> {
    const [updatedComment] = await db
      .update(forumComments)
      .set(commentData)
      .where(eq(forumComments.id, id))
      .returning();
    return updatedComment;
  }

  async getForumComment(id: number): Promise<ForumComment | undefined> {
    const [comment] = await db.select().from(forumComments).where(eq(forumComments.id, id));
    return comment;
  }

  async deleteForumComment(id: number): Promise<boolean> {
    const result = await db
      .delete(forumComments)
      .where(eq(forumComments.id, id));
    return result.rowCount > 0;
  }
  
  // Reaction operations
  async getReactionTypes(): Promise<ReactionType[]> {
    return db.select().from(reactionTypes).orderBy(reactionTypes.sortOrder);
  }

  async getPostReactions(postId: number): Promise<{
    reactionType: ReactionType;
    count: number;
    userReacted: boolean;
  }[]> {
    // This would need to be expanded to properly include user reactions
    const reactions = await db
      .select({
        reactionTypeId: postReactions.reactionTypeId,
        count: db.fn.count(postReactions.id).as("count"),
      })
      .from(postReactions)
      .where(eq(postReactions.postId, postId))
      .groupBy(postReactions.reactionTypeId);
    
    // Get all reaction types
    const allReactionTypes = await this.getReactionTypes();
    
    // Format the results to include reaction type details
    return allReactionTypes.map(reactionType => {
      const reactionData = reactions.find(r => r.reactionTypeId === reactionType.id);
      return {
        reactionType,
        count: reactionData ? parseInt(reactionData.count.toString()) : 0,
        userReacted: false // This would need actual user data to determine
      };
    });
  }

  async createOrRemovePostReaction(reaction: InsertPostReaction): Promise<{ reactionAdded: boolean }> {
    // Check if reaction already exists
    const [existingReaction] = await db
      .select()
      .from(postReactions)
      .where(and(
        eq(postReactions.postId, reaction.postId),
        eq(postReactions.userId, reaction.userId),
        eq(postReactions.reactionTypeId, reaction.reactionTypeId)
      ));
    
    if (existingReaction) {
      // Remove the reaction
      await db
        .delete(postReactions)
        .where(eq(postReactions.id, existingReaction.id));
      return { reactionAdded: false };
    } else {
      // Add the reaction
      await db.insert(postReactions).values(reaction);
      return { reactionAdded: true };
    }
  }

  async getCommentReactions(commentId: number): Promise<{
    reactionType: ReactionType;
    count: number;
    userReacted: boolean;
  }[]> {
    // Similar implementation as getPostReactions
    const reactions = await db
      .select({
        reactionTypeId: commentReactions.reactionTypeId,
        count: db.fn.count(commentReactions.id).as("count"),
      })
      .from(commentReactions)
      .where(eq(commentReactions.commentId, commentId))
      .groupBy(commentReactions.reactionTypeId);
    
    const allReactionTypes = await this.getReactionTypes();
    
    return allReactionTypes.map(reactionType => {
      const reactionData = reactions.find(r => r.reactionTypeId === reactionType.id);
      return {
        reactionType,
        count: reactionData ? parseInt(reactionData.count.toString()) : 0,
        userReacted: false
      };
    });
  }

  async createOrRemoveCommentReaction(reaction: InsertCommentReaction): Promise<{ reactionAdded: boolean }> {
    // Check if reaction already exists
    const [existingReaction] = await db
      .select()
      .from(commentReactions)
      .where(and(
        eq(commentReactions.commentId, reaction.commentId),
        eq(commentReactions.userId, reaction.userId),
        eq(commentReactions.reactionTypeId, reaction.reactionTypeId)
      ));
    
    if (existingReaction) {
      // Remove the reaction
      await db
        .delete(commentReactions)
        .where(eq(commentReactions.id, existingReaction.id));
      return { reactionAdded: false };
    } else {
      // Add the reaction
      await db.insert(commentReactions).values(reaction);
      return { reactionAdded: true };
    }
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUserStats(id: number, level: number, points: number, streak: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ level, points, streak })
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) throw new Error(`User with id ${id} not found`);
    return updatedUser;
  }
  
  async updateUserPremiumStatus(id: number, isPremium: boolean): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ isPremium })
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) throw new Error(`User with id ${id} not found`);
    return updatedUser;
  }
  
  async updateUserLogin(id: number, ipAddress?: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        lastLogin: new Date(),
        ipAddress: ipAddress || null
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) throw new Error(`User with id ${id} not found`);
    return updatedUser;
  }
  
  // User profile operations
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    
    return profile;
  }
  
  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db
      .insert(userProfiles)
      .values(profile)
      .returning();
    
    return newProfile;
  }
  
  async updateUserProfile(id: number, profile: Partial<InsertUserProfile>): Promise<UserProfile> {
    const [existingProfile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, id));
    
    if (!existingProfile) throw new Error(`Profile for user with id ${id} not found`);
    
    const [updatedProfile] = await db
      .update(userProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(userProfiles.id, existingProfile.id))
      .returning();
    
    return updatedProfile;
  }
  
  // Goals operations
  async getGoals(userId: number): Promise<Goal[]> {
    return db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId));
  }
  
  async getGoal(id: number): Promise<Goal | undefined> {
    const [goal] = await db
      .select()
      .from(goals)
      .where(eq(goals.id, id));
    
    return goal;
  }
  
  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db
      .insert(goals)
      .values({
        ...goal,
        currentAmount: 0,
        isActive: true,
        isFocused: false
      })
      .returning();
    
    return newGoal;
  }
  
  async updateGoal(id: number, goal: Partial<InsertGoal> & { currentAmount?: number, isActive?: boolean, isFocused?: boolean }): Promise<Goal> {
    const [existingGoal] = await db
      .select()
      .from(goals)
      .where(eq(goals.id, id));
    
    if (!existingGoal) throw new Error(`Goal with id ${id} not found`);
    
    // If setting this goal as focused, unfocus other goals for this user
    if (goal.isFocused) {
      await db
        .update(goals)
        .set({ isFocused: false })
        .where(
          and(
            eq(goals.userId, existingGoal.userId),
            eq(goals.isFocused, true)
          )
        );
    }
    
    const [updatedGoal] = await db
      .update(goals)
      .set(goal)
      .where(eq(goals.id, id))
      .returning();
    
    return updatedGoal;
  }
  
  async deleteGoal(id: number): Promise<boolean> {
    const result = await db
      .delete(goals)
      .where(eq(goals.id, id))
      .returning({ id: goals.id });
    
    return result.length > 0;
  }
  
  // Learning modules operations
  async getModules(): Promise<Module[]> {
    return db.select().from(modules);
  }
  
  async getModule(id: number): Promise<Module | undefined> {
    const [module] = await db
      .select()
      .from(modules)
      .where(eq(modules.id, id));
    
    return module;
  }
  
  async getModulesByLevel(level: string): Promise<Module[]> {
    return db
      .select()
      .from(modules)
      .where(eq(modules.level, level));
  }
  
  async createModule(module: InsertModule): Promise<Module> {
    const [newModule] = await db
      .insert(modules)
      .values(module)
      .returning();
    
    return newModule;
  }
  
  // User progress operations
  async getUserProgressByModule(userId: number, moduleId: number): Promise<UserProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.moduleId, moduleId)
        )
      );
    
    return progress;
  }
  
  async getUserProgressByUser(userId: number): Promise<UserProgress[]> {
    return db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
  }
  
  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const [newProgress] = await db
      .insert(userProgress)
      .values({
        ...progress,
        percentComplete: 0,
        completed: false
      })
      .returning();
    
    return newProgress;
  }
  
  async updateUserProgress(id: number, percentComplete: number, completed: boolean): Promise<UserProgress> {
    const [existingProgress] = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.id, id));
    
    if (!existingProgress) throw new Error(`Progress with id ${id} not found`);
    
    const [updatedProgress] = await db
      .update(userProgress)
      .set({
        percentComplete,
        completed,
        updatedAt: new Date()
      })
      .where(eq(userProgress.id, id))
      .returning();
    
    return updatedProgress;
  }
  
  // AI conversation operations
  async getAiConversations(userId: number): Promise<AiConversation[]> {
    return db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(desc(aiConversations.createdAt));
  }
  
  async createAiConversation(conversation: InsertAiConversation): Promise<AiConversation> {
    const [newConversation] = await db
      .insert(aiConversations)
      .values({
        ...conversation,
        answer: null
      })
      .returning();
    
    return newConversation;
  }
  
  async updateAiConversation(id: number, answer: string): Promise<AiConversation> {
    const [existingConversation] = await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.id, id));
    
    if (!existingConversation) throw new Error(`Conversation with id ${id} not found`);
    
    const [updatedConversation] = await db
      .update(aiConversations)
      .set({ answer })
      .where(eq(aiConversations.id, id))
      .returning();
    
    return updatedConversation;
  }
  
  // Knowledge articles operations
  async getKnowledgeArticles(): Promise<KnowledgeArticle[]> {
    return db
      .select()
      .from(knowledgeArticles);
  }
  
  async getKnowledgeArticlesByCategory(category: string): Promise<KnowledgeArticle[]> {
    return db
      .select()
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.category, category));
  }
  
  async getKnowledgeArticle(id: number): Promise<KnowledgeArticle | undefined> {
    const [article] = await db
      .select()
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.id, id));
    
    return article;
  }
  
  async createKnowledgeArticle(article: InsertKnowledgeArticle): Promise<KnowledgeArticle> {
    const [newArticle] = await db
      .insert(knowledgeArticles)
      .values({
        ...article,
        views: 0
      })
      .returning();
    
    return newArticle;
  }
  
  async updateKnowledgeArticleViews(id: number): Promise<KnowledgeArticle> {
    const [existingArticle] = await db
      .select()
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.id, id));
    
    if (!existingArticle) throw new Error(`Article with id ${id} not found`);
    
    const [updatedArticle] = await db
      .update(knowledgeArticles)
      .set({ 
        views: (existingArticle.views || 0) + 1,
        dateUpdated: new Date()
      })
      .where(eq(knowledgeArticles.id, id))
      .returning();
    
    return updatedArticle;
  }
  
  // News articles operations
  async getNewsArticles(): Promise<NewsArticle[]> {
    return db
      .select()
      .from(newsArticles)
      .orderBy(desc(newsArticles.publishedAt));
  }
  
  async getNewsArticlesByType(type: string): Promise<NewsArticle[]> {
    return db
      .select()
      .from(newsArticles)
      .where(eq(newsArticles.type, type))
      .orderBy(desc(newsArticles.publishedAt));
  }
  
  async getNewsArticleBySlug(slug: string): Promise<NewsArticle | undefined> {
    const [article] = await db
      .select()
      .from(newsArticles)
      .where(eq(newsArticles.slug, slug));
    
    return article;
  }
  
  async createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle> {
    const [newArticle] = await db
      .insert(newsArticles)
      .values({
        ...article,
        views: 0
      })
      .returning();
    
    return newArticle;
  }
  
  async updateNewsArticle(id: number, data: Partial<InsertNewsArticle>): Promise<NewsArticle> {
    const [updatedArticle] = await db
      .update(newsArticles)
      .set({
        ...data,
        dateUpdated: new Date()
      })
      .where(eq(newsArticles.id, id))
      .returning();
    
    if (!updatedArticle) throw new Error(`News article with id ${id} not found`);
    
    return updatedArticle;
  }
  
  async updateNewsArticleViews(id: number): Promise<NewsArticle> {
    const [existingArticle] = await db
      .select()
      .from(newsArticles)
      .where(eq(newsArticles.id, id));
    
    if (!existingArticle) throw new Error(`News article with id ${id} not found`);
    
    const [updatedArticle] = await db
      .update(newsArticles)
      .set({ 
        views: (existingArticle.views || 0) + 1,
        dateUpdated: new Date()
      })
      .where(eq(newsArticles.id, id))
      .returning();
    
    return updatedArticle;
  }
}

// Export the database storage implementation
export const storage = new DatabaseStorage();
