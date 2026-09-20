import { 
  users, type User, type InsertUser,
  userProfiles, type UserProfile, type InsertUserProfile,
  goals, type Goal, type InsertGoal,
  modules, type Module, type InsertModule,
  userProgress, type UserProgress, type InsertUserProgress,
  aiConversations, type AiConversation, type InsertAiConversation,
  knowledgeArticles, type KnowledgeArticle, type InsertKnowledgeArticle
} from "@shared/schema";
import { db } from "./db";

/**
 * Seeds the database with initial sample data
 */
export async function seedDatabase() {
  // Check if users already exist
  const existingUsers = await db.select().from(users);
  
  if (existingUsers.length > 0) {
    console.log("Database already has users, skipping seeding");
    return;
  }

  console.log("🌱 Seeding database...");
  
  try {
    // Create default user
    const [user] = await db.insert(users).values({
      username: "john_doe",
      email: "john.doe@example.com",
      password: "password123",
      displayName: "John",
      level: 3,
      points: 210,
      streak: 4
    }).returning();
    
    // Create user profile
    const [profile] = await db.insert(userProfiles).values({
      userId: user.id,
      age: "18-24 years",
      experienceLevel: "Beginner",
      country: "United States",
      financialGoals: ["Save for education", "Build emergency fund", "Learn investing basics"]
    }).returning();
    
    // Create sample goals
    const [emergencyFund] = await db.insert(goals).values({
      userId: user.id,
      title: "Emergency Fund",
      targetAmount: 1500,
      currentAmount: 500,
      isActive: true,
      isFocused: true,
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 3 months from now
    }).returning();
    
    const [laptop] = await db.insert(goals).values({
      userId: user.id,
      title: "Laptop for College",
      targetAmount: 1000,
      currentAmount: 150,
      isActive: true,
      isFocused: false,
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 6 months from now
    }).returning();
    
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
    
    // Insert all modules
    const insertedModules = await Promise.all(moduleData.map(async (moduleItem) => {
      const [module] = await db.insert(modules).values(moduleItem).returning();
      return module;
    }));
    
    // Create user progress
    const [progress] = await db.insert(userProgress).values({
      userId: user.id,
      moduleId: insertedModules[0].id,
      percentComplete: 40,
      completed: false
    }).returning();
    
    // Create AI conversation
    const [conversation] = await db.insert(aiConversations).values({
      userId: user.id,
      question: "How much should I save each month?",
      answer: "Based on your current income and expenses, I recommend starting with saving 15% of your monthly income (about $300). Focus first on building your emergency fund, then work toward your laptop goal."
    }).returning();
    
    // Create knowledge articles
    const knowledgeArticleData = [
      {
        title: "What is an Emergency Fund?",
        content: "An emergency fund is money you set aside for unexpected financial needs or emergencies. It provides a financial safety net that keeps you from adding new debt when you have sudden expenses like car repairs, medical bills, or living expenses after losing a job.\n\nFinancial experts typically recommend saving 3-6 months of your essential expenses in an emergency fund. For students or those just starting their financial journey, even $500-$1,000 can make a significant difference in handling unexpected expenses.\n\nYour emergency fund should be kept in a liquid account like a high-yield savings account, where you can access it quickly when needed but separate from your regular checking account to avoid temptation.",
        category: "Saving",
        tags: ["emergency fund", "saving", "financial security", "beginner"],
        views: 0,
        dateCreated: new Date(),
        dateUpdated: new Date()
      },
      {
        title: "Understanding Credit Scores",
        content: "A credit score is a three-digit number that represents your creditworthiness to lenders. FICO scores, the most commonly used scores, range from 300-850, with higher scores indicating lower credit risk.\n\nYour credit score is calculated based on several factors:\n- Payment history (35%): Whether you've paid past accounts on time\n- Credit utilization (30%): Amount of available credit you're using\n- Length of credit history (15%): How long you've had credit accounts\n- New credit (10%): Recently opened accounts and inquiries\n- Credit mix (10%): Types of credit accounts you have\n\nMaintaining a good credit score (700+) helps you qualify for lower interest rates on loans and credit cards, can affect housing applications, and sometimes even job opportunities.",
        category: "Credit",
        tags: ["credit score", "FICO", "credit building", "intermediate"],
        views: 0,
        dateCreated: new Date(),
        dateUpdated: new Date()
      },
      {
        title: "Budgeting Basics: The 50/30/20 Rule",
        content: "The 50/30/20 rule is a simple budgeting method that divides your after-tax income into three categories:\n\n- 50% for needs (essential expenses like rent, groceries, utilities, minimum debt payments, etc.)\n- 30% for wants (non-essential spending like entertainment, dining out, hobbies, etc.)\n- 20% for savings and debt repayment (emergency fund, retirement, paying down debt beyond minimum payments)\n\nThis framework provides flexibility while ensuring you're covering essentials, enjoying life, and building financial security. It's especially helpful for beginners who find detailed line-item budgeting overwhelming.\n\nTo get started, calculate your monthly after-tax income, then multiply by 0.5, 0.3, and 0.2 to find your spending targets for each category. Track your spending for a month to see how it compares to these guidelines, then adjust as needed for your personal situation.",
        category: "Budgeting",
        tags: ["budgeting", "50/30/20 rule", "money management", "beginner"],
        views: 0,
        dateCreated: new Date(),
        dateUpdated: new Date()
      }
    ];
    
    // Insert knowledge articles
    await Promise.all(knowledgeArticleData.map(async (article) => {
      await db.insert(knowledgeArticles).values(article);
    }));
    
    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}