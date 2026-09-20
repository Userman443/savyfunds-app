import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HelpButton from "@/components/ui/help-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Play, BookOpen, Video, FileQuestion, ArrowRight, ExternalLink, DollarSign, LineChart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { moduleLevels } from "@/lib/constants";
import { Module } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Video lessons from Lessons.tsx
interface VideoLesson {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  duration: string;
  category: "budgeting" | "investing" | "saving" | "credit" | "debt" | "retirement";
  level: "beginner" | "intermediate" | "advanced";
}

// Financial articles for different categories and experience levels
interface FinancialArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  category: string;
  level: string;
  duration: string;
  source: string;
}

const videoLessons: VideoLesson[] = [
  // Beginner Level Videos
  {
    id: "monthly-budget-plan",
    title: "How to Create a Monthly Budget Plan",
    description: "Learn practical steps to create and maintain an effective monthly budget that helps you reach your financial goals and reduce stress.",
    youtubeId: "sVKQn2I4HDM", // Practical Psychology: How to Manage Your Money (Budget 101 for Beginners)
    duration: "6:18",
    category: "budgeting",
    level: "beginner"
  },
  {
    id: "50-30-20",
    title: "The 50/30/20 Budgeting Rule",
    description: "Discover how to allocate your income using the 50/30/20 rule - 50% for needs, 30% for wants, and 20% for savings and debt repayment.",
    youtubeId: "HQzoZfc3GwQ", // The Financial Diet: The 50/30/20 Rule of Money
    duration: "6:56",
    category: "budgeting",
    level: "beginner"
  },
  {
    id: "investing-basics",
    title: "Investing Basics: Getting Started",
    description: "Learn the fundamentals of investing, including stocks, bonds, mutual funds, and ETFs, and how to create a diversified portfolio.",
    youtubeId: "gFQNPmLKj1k", // Two Cents: Investing Is Easier Than You Think
    duration: "7:20",
    category: "investing",
    level: "beginner"
  },
  {
    id: "compound-interest",
    title: "The Power of Compound Interest",
    description: "Understand how compound interest works and why starting your investment journey early can lead to significant growth over time.",
    youtubeId: "wf91rEGw88Q", // One Minute Economics: The Rule of 72
    duration: "10:07",
    category: "investing",
    level: "beginner"
  },
  {
    id: "emergency-fund",
    title: "Building an Emergency Fund",
    description: "Learn why having an emergency fund is essential and how to build one that can cover 3-6 months of expenses.",
    youtubeId: "fVToMS2Q3XQ", // One Big Happy Life: How to Save an Emergency Fund FAST
    duration: "9:41",
    category: "saving",
    level: "beginner"
  },
  {
    id: "credit-score",
    title: "Understanding Your Credit Score",
    description: "Learn what factors affect your credit score, how to check it, and strategies to improve it over time.",
    youtubeId: "Vn9ounAgG3w", // Next Level Life: How Credit Scores Work
    duration: "8:55",
    category: "credit",
    level: "beginner"
  },
  
  // Intermediate Level Videos
  {
    id: "debt-payoff-strategies",
    title: "Debt Payoff Strategies That Actually Work",
    description: "Compare debt snowball vs. avalanche methods and learn actionable strategies to pay off debt efficiently while maintaining financial stability.",
    youtubeId: "PFJUJTJPmoE", // The Financial Diet: Debt Payoff Strategies
    duration: "11:25",
    category: "debt",
    level: "intermediate"
  },
  {
    id: "index-fund-investing",
    title: "Index Fund Investing for Beginners",
    description: "Learn how index funds work, why they're recommended for most investors, and how to start building a low-cost, diversified portfolio.",
    youtubeId: "fwe-PjrX23o", // Minority Mindset: Index Funds Explained
    duration: "15:32",
    category: "investing",
    level: "intermediate"
  },
  {
    id: "tax-efficient-investing",
    title: "Tax-Efficient Investing Strategies",
    description: "Understand how to minimize taxes on your investments through tax-advantaged accounts, asset location, and strategic tax-loss harvesting.",
    youtubeId: "zI03zJAcPjI", // The Plain Bagel: Tax-Efficient Investing
    duration: "12:05",
    category: "investing",
    level: "intermediate"
  },
  
  // Advanced Level Videos
  {
    id: "real-estate-investing",
    title: "Real Estate Investing Fundamentals",
    description: "Explore different real estate investment strategies, property valuation methods, financing options, and how to analyze potential returns.",
    youtubeId: "T_7vhsSBi7c", // Graham Stephan: How to Invest in Real Estate
    duration: "18:43",
    category: "investing",
    level: "advanced"
  },
  {
    id: "retirement-planning",
    title: "Comprehensive Retirement Planning",
    description: "Learn advanced retirement planning strategies, including withdrawal strategies, Social Security optimization, and healthcare considerations.",
    youtubeId: "L8-GgS4geMo", // New Money: Retirement Planning Strategies
    duration: "20:14",
    category: "retirement",
    level: "advanced"
  },
  {
    id: "portfolio-rebalancing",
    title: "Advanced Portfolio Rebalancing Techniques",
    description: "Understand when and how to rebalance your investment portfolio to maintain your target asset allocation and risk tolerance over time.",
    youtubeId: "Jt8pMuI0n8g", // Ben Felix: Portfolio Rebalancing
    duration: "14:38",
    category: "investing",
    level: "advanced"
  }
];

const financialArticles: FinancialArticle[] = [
  // Beginner Level Articles
  {
    id: "budgeting-beginners",
    title: "Budgeting 101: How to Create Your First Budget",
    description: "A step-by-step guide to creating and maintaining your first budget, including free templates and tools to make the process easier.",
    url: "https://www.nerdwallet.com/article/finance/how-to-budget",
    imageUrl: "https://i.imgur.com/mTJDYBF.jpg",
    category: "budgeting",
    level: "beginner",
    duration: "10 min read",
    source: "NerdWallet"
  },
  {
    id: "emergency-fund-basics",
    title: "Why You Need an Emergency Fund and How to Build One",
    description: "Learn why emergency funds are essential for financial security and practical steps to build yours, even with limited income.",
    url: "https://www.investopedia.com/articles/personal-finance/040915/how-much-cash-should-i-keep-bank.asp",
    imageUrl: "https://i.imgur.com/N3GLJTK.jpg",
    category: "saving",
    level: "beginner",
    duration: "8 min read",
    source: "Investopedia"
  },
  {
    id: "credit-score-basics",
    title: "Understanding and Improving Your Credit Score",
    description: "Discover what makes up your credit score, how to check it for free, and simple steps to improve it over time.",
    url: "https://www.consumerfinance.gov/about-us/blog/credit-score-myths-might-be-holding-you-back-improving-your-credit/",
    imageUrl: "https://i.imgur.com/QdrUbPh.jpg",
    category: "credit",
    level: "beginner",
    duration: "12 min read",
    source: "Consumer Financial Protection Bureau"
  },
  
  // Intermediate Level Articles
  {
    id: "debt-repayment-strategies",
    title: "Strategic Approaches to Paying Off Debt",
    description: "Compare different debt repayment strategies including the debt snowball, debt avalanche, and debt consolidation to find what works best for your situation.",
    url: "https://www.ramseysolutions.com/debt/debt-snowball-vs-debt-avalanche",
    imageUrl: "https://i.imgur.com/WQbGGrX.jpg",
    category: "debt",
    level: "intermediate",
    duration: "15 min read",
    source: "Ramsey Solutions"
  },
  {
    id: "investing-etf-fundamentals",
    title: "ETF Investing: Building a Diversified Portfolio",
    description: "Learn how to use ETFs to build a low-cost, diversified investment portfolio that matches your financial goals and risk tolerance.",
    url: "https://www.morningstar.com/etfs/fundamentals-investing-etfs",
    imageUrl: "https://i.imgur.com/FEyKESw.jpg",
    category: "investing",
    level: "intermediate",
    duration: "18 min read",
    source: "Morningstar"
  },
  {
    id: "tax-efficient-investing",
    title: "Maximizing Tax Efficiency in Your Investment Strategy",
    description: "Strategies to minimize tax impact on your investments through asset location, tax-loss harvesting, and optimal use of retirement accounts.",
    url: "https://www.schwab.com/learn/story/tax-efficient-investing-why-its-important",
    imageUrl: "https://i.imgur.com/6gFvFe2.jpg",
    category: "investing",
    level: "intermediate",
    duration: "14 min read",
    source: "Charles Schwab"
  },
  
  // Advanced Level Articles
  {
    id: "real-estate-investment",
    title: "Real Estate Investment Strategies for Wealth Building",
    description: "Explore different approaches to real estate investing, from rental properties to REITs, with analysis of potential returns and risks.",
    url: "https://www.biggerpockets.com/blog/2015/12/04/real-estate-vs-stocks-performance-comparison",
    imageUrl: "https://i.imgur.com/yNtIWqs.jpg",
    category: "investing",
    level: "advanced",
    duration: "20 min read",
    source: "BiggerPockets"
  },
  {
    id: "retirement-income-strategies",
    title: "Sustainable Retirement Income Strategies",
    description: "Advanced techniques for creating reliable retirement income streams, including withdrawal strategies, Social Security optimization, and tax planning.",
    url: "https://www.kitces.com/blog/the-problem-with-fireing-at-4-and-the-need-for-flexible-spending-rules/",
    imageUrl: "https://i.imgur.com/aA94Gnr.jpg",
    category: "retirement",
    level: "advanced",
    duration: "25 min read",
    source: "Kitces"
  },
  {
    id: "advanced-asset-allocation",
    title: "Beyond the Basics: Advanced Asset Allocation Strategies",
    description: "Understand factor investing, alternative assets, and risk parity approaches to optimize your portfolio beyond traditional asset allocation.",
    url: "https://www.portfoliovisualizer.com/articles/asset-allocation-in-theory-and-practice",
    imageUrl: "https://i.imgur.com/LswGS5t.jpg",
    category: "investing",
    level: "advanced",
    duration: "22 min read",
    source: "Portfolio Visualizer"
  }
];

const Learn = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  
  // Fetch learning modules
  const { data: modules = [], isLoading } = useQuery<Module[]>({
    queryKey: ["/api/modules"],
  });
  
  // Filter modules by level and search query
  const filteredModules = React.useMemo(() => {
    if (!modules) return [];
    
    return modules.filter((module) => {
      const matchesLevel = selectedLevel === "All" || module.level === selectedLevel;
      const matchesSearch = !searchQuery || 
        module.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        module.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesLevel && matchesSearch;
    });
  }, [modules, selectedLevel, searchQuery]);
  
  // Group modules by type
  const modulesByType = React.useMemo(() => {
    const grouped: Record<string, Module[]> = {
      article: [],
      video: [],
      quiz: [],
      activity: [],
      interactive: [],
    };
    
    filteredModules.forEach((module) => {
      if (grouped[module.type]) {
        grouped[module.type].push(module);
      } else {
        grouped.article.push(module);
      }
    });
    
    return grouped;
  }, [filteredModules]);

  // Filter video lessons based on search and level
  const filteredVideoLessons = React.useMemo(() => {
    if (!videoLessons) return [];
    
    return videoLessons.filter((video) => {
      // Convert beginner/intermediate/advanced to match our filter format
      const videoLevel = video.level.charAt(0).toUpperCase() + video.level.slice(1);
      const matchesLevel = selectedLevel === "All" || videoLevel === selectedLevel;
      const matchesSearch = !searchQuery || 
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesLevel && matchesSearch;
    });
  }, [videoLessons, selectedLevel, searchQuery]);
  
  // Filter articles based on search and level
  const filteredArticles = React.useMemo(() => {
    if (!financialArticles) return [];
    
    return financialArticles.filter((article) => {
      // Convert beginner/intermediate/advanced to match our filter format
      const articleLevel = article.level.charAt(0).toUpperCase() + article.level.slice(1);
      const matchesLevel = selectedLevel === "All" || articleLevel === selectedLevel;
      const matchesSearch = !searchQuery || 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesLevel && matchesSearch;
    });
  }, [financialArticles, selectedLevel, searchQuery]);

  // Group video lessons by category
  const videosByCategory = React.useMemo(() => {
    const grouped: Record<string, VideoLesson[]> = {
      budgeting: [],
      investing: [],
      saving: [],
      credit: [],
      debt: [],
      retirement: []
    };
    
    filteredVideoLessons.forEach((video) => {
      if (grouped[video.category]) {
        grouped[video.category].push(video);
      }
    });
    
    return grouped;
  }, [filteredVideoLessons]);
  
  // Group articles by category
  const articlesByCategory = React.useMemo(() => {
    const grouped: Record<string, FinancialArticle[]> = {
      budgeting: [],
      investing: [],
      saving: [],
      credit: [],
      debt: [],
      retirement: []
    };
    
    filteredArticles.forEach((article) => {
      if (article.category in grouped) {
        grouped[article.category].push(article);
      }
    });
    
    return grouped;
  }, [filteredArticles]);

  // Get user data for the Navbar with proper typing
  const { data: userData } = useQuery<{
    id: number;
    username: string;
    displayName?: string;
    level: number;
    isPremium?: boolean;
  } | null>({
    queryKey: ["/api/auth/me"],
  });
  
  // Process user data to match Navbar's expected format
  const user = userData ? {
    id: userData.id,
    username: userData.username,
    displayName: userData.displayName || userData.username,
    level: userData.level,
    isPremium: userData.isPremium || false,
  } : null;
  
  return (
    <>
      <Navbar user={user} />
      
      <main className="container mx-auto px-4 md:px-6 py-6 page-transition">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">Learning Center</h1>
          <p className="text-neutral-600">Explore financial topics and expand your knowledge</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-card p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search for topics..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-2">
              {["All", "Beginner", "Intermediate", "Advanced"].map((level) => (
                <Button
                  key={level}
                  variant={selectedLevel === level ? "default" : "outline"}
                  className={selectedLevel === level ? "bg-primary-600" : ""}
                  onClick={() => setSelectedLevel(level)}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
          
          <Tabs defaultValue="all">
            <TabsList className="grid grid-cols-5 mb-6">
              <TabsTrigger value="all" data-value="all">All</TabsTrigger>
              <TabsTrigger value="articles" data-value="articles">Articles</TabsTrigger>
              <TabsTrigger value="videos" data-value="videos">Videos</TabsTrigger>
              <TabsTrigger value="quizzes" data-value="quizzes">Quizzes</TabsTrigger>
              <TabsTrigger value="interactive" data-value="interactive">Interactive</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {isLoading ? (
                <ModuleSkeleton count={6} />
              ) : filteredModules.length === 0 && filteredVideoLessons.length === 0 && filteredArticles.length === 0 ? (
                <NoResults query={searchQuery} level={selectedLevel} />
              ) : (
                <>
                  {/* Show regular modules */}
                  {filteredModules.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {filteredModules.map((module) => (
                        <ModuleCard key={module.id} module={module} />
                      ))}
                    </div>
                  )}
                  
                  {/* Show video lessons */}
                  {filteredVideoLessons.length > 0 && (
                    <div className="mt-8">
                      <h2 className="text-xl font-semibold mb-4">Video Lessons</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredVideoLessons.slice(0, 4).map((video) => (
                          <VideoCard key={video.id} video={video} />
                        ))}
                      </div>
                      {filteredVideoLessons.length > 4 && (
                        <div className="text-center mt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              const tabEl = document.querySelector('[data-value="videos"]') as HTMLElement;
                              if (tabEl) tabEl.click();
                            }}
                          >
                            View all {filteredVideoLessons.length} videos
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Show articles */}
                  {filteredArticles.length > 0 && (
                    <div className="mt-8">
                      <h2 className="text-xl font-semibold mb-4">Financial Articles</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredArticles.slice(0, 3).map((article) => (
                          <ArticleCard key={article.id} article={article} />
                        ))}
                      </div>
                      {filteredArticles.length > 3 && (
                        <div className="text-center mt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              const tabEl = document.querySelector('[data-value="articles"]') as HTMLElement;
                              if (tabEl) tabEl.click();
                            }}
                          >
                            View all {filteredArticles.length} articles
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="articles">
              {isLoading ? (
                <ModuleSkeleton count={3} />
              ) : modulesByType.article.length === 0 && filteredArticles.length === 0 ? (
                <NoResults query={searchQuery} level={selectedLevel} type="articles" />
              ) : (
                <>
                  {/* Show regular article modules */}
                  {modulesByType.article.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {modulesByType.article.map((module) => (
                        <ModuleCard key={module.id} module={module} />
                      ))}
                    </div>
                  )}
                  
                  {/* Show curated articles by category */}
                  {filteredArticles.length > 0 && (
                    <div className="mt-8">
                      <div className="mb-2">
                        <h2 className="text-xl font-semibold mb-4">Financial Knowledge Library</h2>
                        <p className="text-muted-foreground mb-6">
                          Expand your financial literacy with our collection of expert articles from trusted financial sources.
                          These articles provide in-depth knowledge on key financial topics.
                        </p>
                      </div>
                      
                      <div className="disclaimer mb-6 p-4 bg-muted rounded-lg text-xs text-muted-foreground">
                        <p>
                          <strong>Disclaimer:</strong> Savyfunds provides educational content only, not financial or legal advice. 
                          Consult professionals. We are not liable for decisions based on our content.
                        </p>
                      </div>
                      
                      <div className="space-y-8">
                        {articlesByCategory.budgeting.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-primary" />
                              Budgeting
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {articlesByCategory.budgeting.map((article) => (
                                <ArticleCard key={article.id} article={article} />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {articlesByCategory.investing.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                              <LineChart className="h-5 w-5 text-primary" />
                              Investing
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {articlesByCategory.investing.map((article) => (
                                <ArticleCard key={article.id} article={article} />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {articlesByCategory.saving.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-primary" />
                              Saving
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {articlesByCategory.saving.map((article) => (
                                <ArticleCard key={article.id} article={article} />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {articlesByCategory.credit.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-primary" />
                              Credit
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {articlesByCategory.credit.map((article) => (
                                <ArticleCard key={article.id} article={article} />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {articlesByCategory.debt.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-primary" />
                              Debt Management
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {articlesByCategory.debt.map((article) => (
                                <ArticleCard key={article.id} article={article} />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {articlesByCategory.retirement.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-primary" />
                              Retirement Planning
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {articlesByCategory.retirement.map((article) => (
                                <ArticleCard key={article.id} article={article} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="videos">
              {isLoading && filteredVideoLessons.length === 0 ? (
                <ModuleSkeleton count={3} />
              ) : modulesByType.video.length === 0 && filteredVideoLessons.length === 0 ? (
                <NoResults query={searchQuery} level={selectedLevel} type="videos" />
              ) : (
                <>
                  {/* Show regular video modules */}
                  {modulesByType.video.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {modulesByType.video.map((module) => (
                        <ModuleCard key={module.id} module={module} />
                      ))}
                    </div>
                  )}
                  
                  {/* Show video lessons by category */}
                  {filteredVideoLessons.length > 0 && (
                    <div className="mt-8">
                      <div className="mb-2">
                        <h2 className="text-xl font-semibold mb-4">Educational Video Library</h2>
                        <p className="text-muted-foreground mb-6">
                          Learn key financial concepts through our curated collection of educational videos.
                          These lessons provide clear explanations to help you build your financial knowledge.
                        </p>
                      </div>
                      
                      <div className="disclaimer mb-6 p-4 bg-muted rounded-lg text-xs text-muted-foreground">
                        <p>
                          <strong>Disclaimer:</strong> Savyfunds provides educational content only, not financial or legal advice. 
                          Consult professionals. We are not liable for decisions based on our content.
                        </p>
                      </div>
                      
                      <div className="space-y-8">
                        {videosByCategory.budgeting.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-primary" />
                              Budgeting
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {videosByCategory.budgeting.map((video) => (
                                <VideoCard key={video.id} video={video} />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {videosByCategory.investing.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                              <LineChart className="h-5 w-5 text-primary" />
                              Investing
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {videosByCategory.investing.map((video) => (
                                <VideoCard key={video.id} video={video} />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {videosByCategory.saving.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-primary" />
                              Saving
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {videosByCategory.saving.map((video) => (
                                <VideoCard key={video.id} video={video} />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {videosByCategory.credit.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-primary" />
                              Credit
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {videosByCategory.credit.map((video) => (
                                <VideoCard key={video.id} video={video} />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {videosByCategory.debt.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-primary" />
                              Debt Management
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {videosByCategory.debt.map((video) => (
                                <VideoCard key={video.id} video={video} />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {videosByCategory.retirement.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-primary" />
                              Retirement Planning
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {videosByCategory.retirement.map((video) => (
                                <VideoCard key={video.id} video={video} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="quizzes">
              {isLoading ? (
                <ModuleSkeleton count={3} />
              ) : modulesByType.quiz.length === 0 ? (
                <NoResults query={searchQuery} level={selectedLevel} type="quizzes" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {modulesByType.quiz.map((module) => (
                    <ModuleCard key={module.id} module={module} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="interactive">
              {isLoading ? (
                <ModuleSkeleton count={3} />
              ) : [...modulesByType.activity, ...modulesByType.interactive].length === 0 ? (
                <NoResults query={searchQuery} level={selectedLevel} type="interactive content" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...modulesByType.activity, ...modulesByType.interactive].map((module) => (
                    <ModuleCard key={module.id} module={module} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Additional resources section */}
        <div className="space-y-6 my-12">
          <h2 className="text-2xl font-bold">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>Financial Education</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">NerdWallet Budgeting Guide</h3>
                  <p className="text-sm text-muted-foreground">Comprehensive guide to creating and maintaining a budget</p>
                  <a 
                    href="https://www.nerdwallet.com/article/finance/how-to-budget" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-primary hover:underline mt-2"
                  >
                    Read the guide
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </a>
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-1">Investopedia Investing for Beginners</h3>
                  <p className="text-sm text-muted-foreground">Learn the basics of investing and building wealth</p>
                  <a 
                    href="https://www.investopedia.com/articles/basics/06/invest1000.asp" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-primary hover:underline mt-2"
                  >
                    Read the article
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </a>
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-1">SavyFunds YouTube Channel</h3>
                  <p className="text-sm text-muted-foreground">Watch our educational videos on financial literacy and wealth building</p>
                  <a 
                    href="http://www.youtube.com/@SavyfundsInc" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-primary hover:underline mt-2"
                  >
                    Visit our channel
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span>Financial Tools</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Interactive Budget Calculator</h3>
                  <p className="text-sm text-muted-foreground">Create a personalized budget based on your income and expenses</p>
                  <Link href="/budget">
                    <Button variant="link" className="p-0 h-auto text-sm mt-2">
                      Try our calculator
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-1">Financial Goal Tracker</h3>
                  <p className="text-sm text-muted-foreground">Set and track progress towards your financial goals</p>
                  <Link href="/goals">
                    <Button variant="link" className="p-0 h-auto text-sm mt-2">
                      Set your goals
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
      <HelpButton />
    </>
  );
};

const ModuleCard = ({ module }: { module: Module }) => {
  const [, setLocation] = useLocation();
  const level = module.level;
  const levelColor = moduleLevels[level as keyof typeof moduleLevels]?.color || "primary";
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "article":
        return <BookOpen className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "quiz":
        return <FileQuestion className="h-4 w-4" />;
      case "interactive":
      case "activity":
        return <Play className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "article":
        return "Article";
      case "video":
        return "Video";
      case "quiz":
        return "Quiz";
      case "interactive":
        return "Interactive";
      case "activity":
        return "Activity";
      default:
        return "Lesson";
    }
  };

  return (
    <div className="card-hover bg-white border border-neutral-200 rounded-lg overflow-hidden">
      <div className="h-36 relative">
        <img 
          src={module.imageUrl || ''} 
          alt={`${module.title} illustration`}
          className="w-full h-full object-cover" 
        />
        {module.type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
            <div className="w-12 h-12 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
              <Play className="h-5 w-5 text-neutral-800" />
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <span className={`px-2 py-1 bg-${levelColor}-100 text-${levelColor}-800 text-xs font-medium rounded-full`}>
            {module.level}
          </span>
          <span className="text-sm text-neutral-500">{module.duration} min</span>
        </div>
        
        <h3 className="font-semibold mb-2">{module.title}</h3>
        <p className="text-sm text-neutral-600 mb-4">{module.description}</p>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full bg-${levelColor}-100 flex items-center justify-center text-${levelColor}-700`}>
              {getTypeIcon(module.type)}
            </div>
            <span className="ml-2 text-sm text-neutral-600">{getTypeLabel(module.type)}</span>
          </div>
          
          <Button 
            size="sm" 
            onClick={() => {
              console.log(`Navigating to module ${module.id}`);
              setLocation(`/module/${module.id}`);
            }}
          >
            Start
          </Button>
        </div>
      </div>
    </div>
  );
};

const NoResults = ({ query, level, type = "" }: { query: string, level: string, type?: string }) => (
  <div className="text-center py-10">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
      <Search className="h-8 w-8 text-neutral-400" />
    </div>
    <h3 className="text-lg font-medium text-neutral-700 mb-1">No results found</h3>
    <p className="text-neutral-500 max-w-md mx-auto">
      {query ? (
        <>No {type} found matching "{query}" for {level} level.</>
      ) : (
        <>No {type} available for {level} level.</>
      )}
    </p>
  </div>
);

// VideoCard component to display video lessons
const VideoCard = ({ video }: { video: VideoLesson }) => {
  return (
    <Card key={video.id} className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-video w-full">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${video.youtubeId}`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="border-0"
        ></iframe>
      </div>
      <CardHeader>
        <CardTitle className="text-lg">{video.title}</CardTitle>
        <CardDescription className="flex justify-between items-center">
          <span className="capitalize">{video.category}</span>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
            {video.duration}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{video.description}</p>
      </CardContent>
    </Card>
  );
};

// ArticleCard component to display financial articles
const ArticleCard = ({ article }: { article: FinancialArticle }) => {
  return (
    <Card key={article.id} className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="h-40 w-full">
        <img 
          src={article.imageUrl} 
          alt={article.title}
          className="w-full h-full object-cover"
        />
      </div>
      <CardHeader className="flex-grow">
        <CardTitle className="text-lg">{article.title}</CardTitle>
        <CardDescription className="flex justify-between items-center">
          <span className="capitalize">{article.category}</span>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
            {article.duration}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">{article.description}</p>
        <p className="text-xs text-muted-foreground mt-2">Source: {article.source}</p>
      </CardContent>
      <CardFooter className="pt-0">
        <a 
          href={article.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button variant="outline" className="w-full group" size="sm">
            Read Article
            <ExternalLink className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
          </Button>
        </a>
      </CardFooter>
    </Card>
  );
};

const ModuleSkeleton = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array(count).fill(0).map((_, i) => (
      <div key={i} className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <Skeleton className="h-36 w-full" />
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Skeleton className="h-6 w-6 rounded-full mr-2" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-9 w-16 rounded-md" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default Learn;
