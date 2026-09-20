import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen, DollarSign, LineChart, ArrowRight } from "lucide-react";
import Footer from "@/components/layout/Footer";

interface VideoLesson {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  duration: string;
  category: "budgeting" | "investing" | "saving" | "credit";
  level: "beginner" | "intermediate" | "advanced";
}

const videoLessons: VideoLesson[] = [
  {
    id: "budget-101",
    title: "Budgeting 101: Creating Your First Budget",
    description: "Learn the basics of budgeting, including how to track your income and expenses, set realistic goals, and stick to your plan.",
    youtubeId: "Fq3QmtV8vT0", // Two Cents: How to Make a Budget (Even if You Hate Budgeting)
    duration: "8:27",
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
  }
];

export default function Lessons() {
  const [activeTab, setActiveTab] = useState<string>("all");
  
  const filteredVideos = activeTab === "all" 
    ? videoLessons 
    : videoLessons.filter(video => video.category === activeTab);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container px-4 py-8 mx-auto flex-grow">
        <div className="max-w-5xl mx-auto">
          <div className="space-y-2 mb-8 text-center">
            <h1 className="text-3xl font-bold">Video Lessons</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
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

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-center mb-6">
              <TabsList className="grid grid-cols-2 md:grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="budgeting">Budgeting</TabsTrigger>
                <TabsTrigger value="investing">Investing</TabsTrigger>
                <TabsTrigger value="saving">Saving</TabsTrigger>
                <TabsTrigger value="credit">Credit</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredVideos.map((video) => (
                  <Card key={video.id} className="overflow-hidden">
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
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <Separator className="my-12" />

          <div className="space-y-6">
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
                    <h3 className="font-medium mb-1">savyfunds YouTube Channel</h3>
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
        </div>
      </div>
      <Footer />
    </div>
  );
}