import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { FinancialIcons } from "@/assets/icons";
import { useToast } from "@/hooks/use-toast";
import { User, Bot, Heart, Brain, Globe, BookOpen, Lightbulb, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Define types for our AI capabilities
type LearningPathModule = {
  title: string;
  description: string;
  difficulty: string;
  estimatedTime: string;
  topics: string[];
};

type LearningPath = {
  path: LearningPathModule[];
  summary: string;
};

type FinancialHealthAssessment = {
  score: number;
  assessment: string;
  recommendations: string[];
  emoji: string;
};

type FinancialGoal = {
  goal: string;
  actions: string[];
};

type FinancialPlan = {
  overview: string;
  shortTerm: FinancialGoal[];
  mediumTerm: FinancialGoal[];
  longTerm: FinancialGoal[];
};

type RegionalSpecific = {
  title: string;
  description: string;
};

type Resource = {
  name: string;
  description: string;
};

type RegionalizedAdvice = {
  advice: string;
  regionalSpecifics: RegionalSpecific[];
  resources: Resource[];
};

type FinancialConceptExplanation = {
  explanation: string;
  examples: string[];
  tips: string[];
  furtherReading: string[];
};

const AIAssistant = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpResponse, setFollowUpResponse] = useState("");

  // Define user type
  type User = {
    id: number;
    username: string;
    email?: string;
    level?: number;
    points?: number;
    streak?: number;
    onboardingCompleted?: boolean;
  };

  // Fetch current user
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  // Fetch AI conversations
  const { data: conversations, isLoading: isLoadingConversations } = useQuery({
    queryKey: ["/api/ai/conversations/" + (user?.id || 0)],
    enabled: !!user?.id,
  });
  
  // Fetch learning path
  const { data: learningPath, isLoading: isLoadingLearningPath } = useQuery<LearningPath>({
    queryKey: ["/api/ai/learning-path/" + (user?.id || 0)],
    enabled: !!user?.id && activeTab === "learning",
  });
  
  // Fetch financial health assessment
  const { data: healthAssessment, isLoading: isLoadingHealthAssessment } = useQuery<FinancialHealthAssessment>({
    queryKey: ["/api/ai/health-assessment/" + (user?.id || 0)],
    enabled: !!user?.id && activeTab === "health",
  });
  
  // Fetch financial plan
  const { data: financialPlan, isLoading: isLoadingFinancialPlan } = useQuery<FinancialPlan>({
    queryKey: ["/api/ai/financial-plan/" + (user?.id || 0)],
    enabled: !!user?.id && activeTab === "plan",
  });
  
  // Get regionalized advice
  const getRegionalizedAdviceMutation = useMutation({
    mutationFn: async (topic: string) => {
      const response = await apiRequest("POST", `/api/ai/regionalized-advice/${user?.id}`, { 
        topic,
        userLocation 
      });
      return response.json() as Promise<RegionalizedAdvice>;
    }
  });
  
  // Explain concept
  const explainConceptMutation = useMutation({
    mutationFn: async ({ concept, experienceLevel, userLocation }: { concept: string, experienceLevel: string, userLocation?: string }) => {
      const response = await apiRequest("POST", "/api/ai/explain-concept", { 
        concept, 
        experienceLevel,
        userLocation 
      });
      return response.json() as Promise<FinancialConceptExplanation>;
    }
  });

  // Ask a question mutation
  const askQuestionMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await apiRequest("POST", "/api/ai/ask", {
        userId: user?.id,
        question,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/conversations/" + user?.id] });
      setQuestion("");
    },
    onError: (error) => {
      toast({
        title: "Error asking question",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAskQuestion = () => {
    if (!question.trim()) {
      toast({
        title: "Empty question",
        description: "Please enter a question to ask the AI assistant",
        variant: "destructive",
      });
      return;
    }

    askQuestionMutation.mutate(question);
  };

  const isLoading = isLoadingUser || isLoadingConversations;
  
  // Type for conversation
  type Conversation = {
    id: number;
    userId: number;
    question: string;
    answer: string;
    createdAt: string;
  };
  
  // Ensure conversations is treated as an array (even if empty)
  const conversationsArray = Array.isArray(conversations) ? conversations : [];
  const latestConversation = conversationsArray[0] as Conversation | undefined;

  // Additional state for concept explanation and regional advice
  const [conceptInput, setConceptInput] = useState("");
  const [conceptLevel, setConceptLevel] = useState("Beginner");
  const [regionalTopic, setRegionalTopic] = useState("");
  const [userLocation, setUserLocation] = useState("");
  
  // Get user location from API or saved preference
  useEffect(() => {
    const savedLocation = localStorage.getItem("user_location");
    if (savedLocation) {
      setUserLocation(savedLocation);
    } else {
      // Fetch location from API instead of prompting the user
      fetch('/api/user/geo-location')
        .then(res => res.json())
        .then(data => {
          const detectedLocation = data.country || "United States";
          setUserLocation(detectedLocation);
          localStorage.setItem("user_location", detectedLocation);
        })
        .catch(err => {
          console.error("Error fetching geo location:", err);
          // Set a default without prompting
          setUserLocation("United States");
          localStorage.setItem("user_location", "United States");
        });
    }
  }, []);
  
  // Determine if any AI feature is loading
  // Mutation for follow-up responses
  const followUpMutation = useMutation({
    mutationFn: async ({question, mode}: {question: string, mode: 'detailed' | 'simple'}) => {
      const response = await apiRequest("POST", "/api/ai/follow-up", {
        userId: user?.id,
        originalQuestion: question,
        mode
      });
      return response.json();
    },
    onSuccess: (data) => {
      try {
        console.log("Follow-up response:", data);
        if (data && typeof data.answer === 'string') {
          setFollowUpResponse(data.answer);
        } else {
          console.error("Invalid follow-up response format:", data);
          setFollowUpResponse("Sorry, I encountered an issue processing your request. Please try again.");
        }
        setFollowUpLoading(false);
      } catch (error) {
        console.error("Error processing follow-up response:", error);
        setFollowUpResponse("Sorry, I encountered an issue processing your request. Please try again.");
        setFollowUpLoading(false);
      }
    },
    onError: (error) => {
      toast({
        title: "Error processing follow-up",
        description: error.message,
        variant: "destructive",
      });
      setFollowUpLoading(false);
    },
  });
  
  const isAnyLoading = isLoadingUser || 
    isLoadingConversations || 
    isLoadingLearningPath || 
    isLoadingHealthAssessment || 
    isLoadingFinancialPlan || 
    askQuestionMutation.isPending || 
    getRegionalizedAdviceMutation.isPending || 
    explainConceptMutation.isPending ||
    followUpMutation.isPending;
    
  // Handle concept explanation request
  const handleExplainConcept = () => {
    if (!conceptInput.trim()) {
      toast({
        title: "Empty concept",
        description: "Please enter a financial concept to explain",
        variant: "destructive",
      });
      return;
    }
    
    explainConceptMutation.mutate({
      concept: conceptInput,
      experienceLevel: conceptLevel,
      userLocation: userLocation || undefined
    });
  };
  
  // Handle regionalized advice request
  const handleGetRegionalizedAdvice = () => {
    if (!regionalTopic.trim()) {
      toast({
        title: "Empty topic",
        description: "Please enter a financial topic to get regional advice",
        variant: "destructive",
      });
      return;
    }
    
    getRegionalizedAdviceMutation.mutate(regionalTopic);
  };
  
  // Handle "Tell me more" button click
  const handleTellMeMore = (question: string) => {
    setFollowUpLoading(true);
    setFollowUpResponse(""); // Clear previous response
    followUpMutation.mutate({ question, mode: 'detailed' });
  };
  
  // Handle "Explain simpler" button click
  const handleExplainSimpler = (question: string) => {
    setFollowUpLoading(true);
    setFollowUpResponse(""); // Clear previous response
    followUpMutation.mutate({ question, mode: 'simple' });
  };

  return (
    <section className="mb-8">
      <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-32 h-32 opacity-20">
          <div className="animate-float">
            <FinancialIcons.WavePattern />
          </div>
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-1">Financial AI Assistant</h2>
              <p className="text-neutral-600 max-w-lg">
                Get personalized financial guidance with our intelligent assistant
              </p>
            </div>
          </div>
          
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="bg-white/50 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 h-auto p-1 gap-1">
              <TabsTrigger value="chat" className="data-[state=active]:bg-white py-2 text-xs sm:text-sm">
                <Bot className="h-4 w-4 mr-1 sm:mr-2" /> 
                <span className="hidden xs:inline">Ask AI</span>
                <span className="xs:hidden">💬</span>
              </TabsTrigger>
              <TabsTrigger value="learning" className="data-[state=active]:bg-white py-2 text-xs sm:text-sm">
                <BookOpen className="h-4 w-4 mr-1 sm:mr-2" /> 
                <span className="hidden xs:inline">Learning</span>
                <span className="xs:hidden">📚</span>
              </TabsTrigger>
              <TabsTrigger value="health" className="data-[state=active]:bg-white py-2 text-xs sm:text-sm">
                <Heart className="h-4 w-4 mr-1 sm:mr-2" /> 
                <span className="hidden xs:inline">Health</span>
                <span className="xs:hidden">❤️</span>
              </TabsTrigger>
              <TabsTrigger value="plan" className="data-[state=active]:bg-white py-2 text-xs sm:text-sm">
                <Brain className="h-4 w-4 mr-1 sm:mr-2" /> 
                <span className="hidden xs:inline">Plan</span>
                <span className="xs:hidden">🧠</span>
              </TabsTrigger>
              <TabsTrigger value="advice" className="data-[state=active]:bg-white py-2 text-xs sm:text-sm">
                <Globe className="h-4 w-4 mr-1 sm:mr-2" /> 
                <span className="hidden xs:inline">Regional</span>
                <span className="xs:hidden">🌎</span>
              </TabsTrigger>
            </TabsList>

            {/* Ask AI Tab */}
            <TabsContent value="chat" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Your Financial Learning Assistant</CardTitle>
                  <CardDescription>
                    Ask questions, learn concepts, and get personalized financial guidance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border border-neutral-200 rounded-md p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1 px-2 py-1 bg-primary-50 rounded text-primary-700 text-sm font-medium">
                        <Bot className="h-4 w-4" />
                        <span>Ask anything about money</span>
                      </div>
                      <div className="text-sm text-neutral-500">or</div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-accent-50 rounded text-accent-700 text-sm font-medium">
                        <BookOpen className="h-4 w-4" />
                        <span>Learn specific concepts</span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="relative">
                        <Input
                          className="pr-28 pl-3 py-6"
                          placeholder="Ask a question or type a concept to explain..."
                          value={activeTab === "chat" && !conceptInput ? question : conceptInput}
                          onChange={(e) => {
                            if (e.target.value.startsWith("explain") || e.target.value.startsWith("what is") || e.target.value.startsWith("define")) {
                              setConceptInput(e.target.value);
                              setQuestion("");
                            } else {
                              setQuestion(e.target.value);
                              setConceptInput("");
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (conceptInput) {
                                if (!explainConceptMutation.isPending) handleExplainConcept();
                              } else {
                                if (!askQuestionMutation.isPending) handleAskQuestion();
                              }
                            }
                          }}
                        />
                        <div className="absolute right-2 top-2 flex gap-2">
                          {conceptInput ? (
                            <Button
                              onClick={handleExplainConcept}
                              disabled={explainConceptMutation.isPending || !conceptInput.trim()}
                              size="sm"
                            >
                              {explainConceptMutation.isPending ? "Explaining..." : "Explain"}
                            </Button>
                          ) : (
                            <Button
                              onClick={handleAskQuestion}
                              disabled={askQuestionMutation.isPending || !question.trim()}
                              size="sm"
                            >
                              {askQuestionMutation.isPending ? "Asking..." : "Ask"}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Experience level selector only shown when in explain mode */}
                      {conceptInput && (
                        <div className="flex justify-end mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-neutral-600">Experience level:</span>
                            <select 
                              value={conceptLevel}
                              onChange={(e) => setConceptLevel(e.target.value)}
                              className="text-sm border rounded p-1 bg-white text-black"
                            >
                              <option value="Beginner">Beginner</option>
                              <option value="Intermediate">Intermediate</option>
                              <option value="Advanced">Advanced</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      <p className="text-sm text-neutral-600">
                        {conceptInput ? 
                          "Type 'explain [concept]' or 'what is [concept]' for quick financial explanations" : 
                          "Ask about saving, investing, debt management, or financial planning"}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-neutral-200"
                        onClick={() => {
                          setQuestion("How do I start an emergency fund?");
                          setConceptInput("");
                        }}
                      >
                        Emergency funds
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-neutral-200"
                        onClick={() => {
                          setConceptInput("explain compound interest");
                          setQuestion("");
                        }}
                      >
                        Compound interest
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-neutral-200"
                        onClick={() => {
                          setQuestion("");
                          setConceptInput("what is inflation");
                        }}
                      >
                        Inflation
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Display conversation or concept explanation based on what was last queried */}
                  {isLoadingConversations || askQuestionMutation.isPending ? (
                    <AIAssistantSkeleton />
                  ) : latestConversation && !explainConceptMutation.data ? (
                    <div className="bg-neutral-50 rounded-lg p-4">
                      <div className="flex items-start mb-4">
                        <div className="mr-3 mt-1">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                            <User className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-neutral-800">{latestConversation.question}</p>
                          <span className="text-xs text-neutral-500">
                            Asked {formatDate(latestConversation.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="mr-3 mt-1">
                          <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center text-accent-700">
                            <Bot className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-neutral-100">
                          <p className="text-neutral-700 mb-2">{followUpResponse || latestConversation.answer}</p>
                          
                          {followUpLoading ? (
                            <div className="flex items-center gap-2 text-neutral-500 text-sm py-2">
                              <div className="animate-spin h-4 w-4 border-2 border-primary-400 border-t-transparent rounded-full"></div>
                              <span>Processing follow-up...</span>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleTellMeMore(latestConversation.question)}
                                disabled={followUpLoading}
                              >
                                Tell me more
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleExplainSimpler(latestConversation.question)}
                                disabled={followUpLoading}
                              >
                                Explain simpler
                              </Button>
                            </div>
                          )}
                          
                          {followUpResponse && (
                            <div className="mt-3 pt-3 border-t border-neutral-100">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs text-neutral-500"
                                onClick={() => setFollowUpResponse("")}
                              >
                                View original answer
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : explainConceptMutation.data ? (
                    <div className="bg-neutral-50 rounded-lg p-4">
                      <h3 className="font-semibold mb-2 text-primary-700">
                        {conceptInput}
                      </h3>
                      <div className="prose prose-sm max-w-none mb-3">
                        <p>{explainConceptMutation.data.explanation}</p>
                      </div>
                      
                      {explainConceptMutation.data.examples.length > 0 && (
                        <div className="mb-3">
                          <h4 className="font-medium mb-1 text-sm">Examples:</h4>
                          <ul className="list-disc pl-5 text-sm space-y-1">
                            {explainConceptMutation.data.examples.map((example, i) => (
                              <li key={i}>{example}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {explainConceptMutation.data.tips.length > 0 && (
                        <div className="mb-3">
                          <h4 className="font-medium mb-1 text-sm">Tips:</h4>
                          <ul className="list-disc pl-5 text-sm space-y-1">
                            {explainConceptMutation.data.tips.map((tip, i) => (
                              <li key={i}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : explainConceptMutation.isPending ? (
                    <AIAssistantSkeleton />
                  ) : (
                    <div className="bg-neutral-50 rounded-lg p-6 text-center">
                      <p className="text-neutral-600">
                        Enter a financial concept to get a detailed explanation.
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-neutral-200"
                      onClick={() => setConceptInput("Compound interest")}
                    >
                      Compound interest
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-neutral-200"
                      onClick={() => setConceptInput("Dollar-cost averaging")}
                    >
                      Dollar-cost averaging
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-neutral-200"
                      onClick={() => setConceptInput("APR vs APY")}
                    >
                      APR vs APY
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-neutral-200"
                      onClick={() => setConceptInput("ETF")}
                    >
                      ETF
                    </Badge>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Learning Path Tab */}
            <TabsContent value="learning" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Personalized Learning Path</CardTitle>
                  <CardDescription>
                    Curated financial education modules based on your profile and goals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingLearningPath ? (
                    <div className="space-y-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : learningPath ? (
                    <div className="space-y-6">
                      <div className="bg-neutral-50 p-4 rounded-lg">
                        <h3 className="font-medium text-neutral-700 mb-2">Overview</h3>
                        <p className="text-neutral-600">{learningPath.summary}</p>
                      </div>
                      
                      <div className="space-y-4">
                        {learningPath.path.map((module, index) => (
                          <div key={index} className="border rounded-lg p-4 bg-white">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-primary-700">{module.title}</h3>
                              <Badge>{module.difficulty}</Badge>
                            </div>
                            <p className="text-neutral-600 mb-3">{module.description}</p>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {module.topics.map((topic, i) => (
                                <Badge key={i} variant="outline">{topic}</Badge>
                              ))}
                            </div>
                            <div className="flex justify-between items-center mt-3">
                              <span className="text-xs text-neutral-500">{module.estimatedTime}</span>
                              <Button size="sm">Start Learning</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-neutral-50 rounded-lg p-6 text-center">
                      <p className="text-neutral-600">
                        Complete your profile to get a personalized learning path.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Health Check Tab */}
            <TabsContent value="health" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Financial Health Assessment</CardTitle>
                  <CardDescription>
                    An analysis of your current financial situation with recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingHealthAssessment ? (
                    <div className="space-y-4">
                      <Skeleton className="h-32 w-full" />
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : healthAssessment ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between bg-neutral-50 p-6 rounded-lg">
                        <div>
                          <h3 className="text-2xl font-semibold text-primary-700 mb-1">
                            Financial Health Score
                          </h3>
                          <p className="text-neutral-600">{healthAssessment.assessment}</p>
                        </div>
                        <div className="text-center">
                          <div className="text-6xl mb-2">{healthAssessment.emoji}</div>
                          <div className="text-3xl font-bold">{healthAssessment.score}/100</div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4 bg-white">
                        <h3 className="font-medium text-neutral-700 mb-3">Recommendations</h3>
                        <ul className="space-y-2">
                          {healthAssessment.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start">
                              <div className="mr-2 mt-1">✦</div>
                              <p className="text-neutral-600">{rec}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-neutral-50 rounded-lg p-6 text-center">
                      <p className="text-neutral-600">
                        Complete your profile to get a financial health assessment.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Financial Plan Tab */}
            <TabsContent value="plan" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Personalized Financial Plan</CardTitle>
                  <CardDescription>
                    A tailored roadmap to achieve your financial goals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingFinancialPlan ? (
                    <div className="space-y-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-32 w-full" />
                      <Skeleton className="h-32 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : financialPlan ? (
                    <div className="space-y-6">
                      <div className="bg-neutral-50 p-4 rounded-lg">
                        <h3 className="font-medium text-neutral-700 mb-2">Overview</h3>
                        <p className="text-neutral-600">{financialPlan.overview}</p>
                      </div>
                      
                      <div className="border rounded-lg p-4 bg-white">
                        <h3 className="font-semibold text-primary-700 mb-3">Short-term Goals (0-1 year)</h3>
                        {financialPlan.shortTerm.map((goal, index) => (
                          <div key={index} className="mb-4 last:mb-0">
                            <h4 className="font-medium text-neutral-800 mb-1">{goal.goal}</h4>
                            <ul className="space-y-1 pl-5 list-disc text-sm text-neutral-600">
                              {goal.actions.map((action, i) => (
                                <li key={i}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border rounded-lg p-4 bg-white">
                        <h3 className="font-semibold text-primary-700 mb-3">Medium-term Goals (1-5 years)</h3>
                        {financialPlan.mediumTerm.map((goal, index) => (
                          <div key={index} className="mb-4 last:mb-0">
                            <h4 className="font-medium text-neutral-800 mb-1">{goal.goal}</h4>
                            <ul className="space-y-1 pl-5 list-disc text-sm text-neutral-600">
                              {goal.actions.map((action, i) => (
                                <li key={i}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border rounded-lg p-4 bg-white">
                        <h3 className="font-semibold text-primary-700 mb-3">Long-term Goals (5+ years)</h3>
                        {financialPlan.longTerm.map((goal, index) => (
                          <div key={index} className="mb-4 last:mb-0">
                            <h4 className="font-medium text-neutral-800 mb-1">{goal.goal}</h4>
                            <ul className="space-y-1 pl-5 list-disc text-sm text-neutral-600">
                              {goal.actions.map((action, i) => (
                                <li key={i}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-neutral-50 rounded-lg p-6 text-center">
                      <p className="text-neutral-600">
                        Complete your profile to get a personalized financial plan.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Regional Advice Tab */}
            <TabsContent value="advice" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Regional Financial Advice</CardTitle>
                  <CardDescription>
                    Get financial guidance specific to your country and economic context
                  </CardDescription>
                  {userLocation && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-primary-600">
                      <MapPin className="h-4 w-4" />
                      <span>Location detected: {userLocation}</span>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto" 
                        onClick={() => {
                          const newLocation = window.prompt("Update your location:", userLocation);
                          if (newLocation) {
                            setUserLocation(newLocation);
                            localStorage.setItem("user_location", newLocation);
                          }
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Enter financial topic (e.g., student loans, housing)"
                      value={regionalTopic}
                      onChange={(e) => setRegionalTopic(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !getRegionalizedAdviceMutation.isPending) {
                          handleGetRegionalizedAdvice();
                        }
                      }}
                    />
                    <Button
                      onClick={handleGetRegionalizedAdvice}
                      disabled={getRegionalizedAdviceMutation.isPending}
                    >
                      {getRegionalizedAdviceMutation.isPending ? "Loading..." : "Get Advice"}
                    </Button>
                  </div>
                  
                  {getRegionalizedAdviceMutation.data ? (
                    <div className="space-y-4">
                      <div className="bg-neutral-50 p-4 rounded-lg">
                        <h3 className="font-medium text-neutral-700 mb-2">General Advice</h3>
                        <p className="text-neutral-600">{getRegionalizedAdviceMutation.data.advice}</p>
                      </div>
                      
                      {getRegionalizedAdviceMutation.data.regionalSpecifics.length > 0 && (
                        <div className="border rounded-lg p-4 bg-white">
                          <h3 className="font-medium text-neutral-700 mb-3">Regional Considerations</h3>
                          <div className="space-y-3">
                            {getRegionalizedAdviceMutation.data.regionalSpecifics.map((specific, index) => (
                              <div key={index}>
                                <h4 className="font-medium text-primary-700 mb-1">{specific.title}</h4>
                                <p className="text-neutral-600 text-sm">{specific.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {getRegionalizedAdviceMutation.data.resources.length > 0 && (
                        <div className="border rounded-lg p-4 bg-white">
                          <h3 className="font-medium text-neutral-700 mb-3">Useful Resources</h3>
                          <div className="space-y-3">
                            {getRegionalizedAdviceMutation.data.resources.map((resource, index) => (
                              <div key={index}>
                                <h4 className="font-medium text-neutral-800 mb-1">{resource.name}</h4>
                                <p className="text-neutral-600 text-sm">{resource.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : getRegionalizedAdviceMutation.isPending ? (
                    <div className="space-y-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-32 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : (
                    <div className="bg-neutral-50 rounded-lg p-6 text-center">
                      <p className="text-neutral-600">
                        Enter a financial topic to get regionalized advice for your country.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-4 justify-center">
                        <Badge 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-neutral-200"
                          onClick={() => setRegionalTopic("Student loans")}
                        >
                          Student loans
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-neutral-200"
                          onClick={() => setRegionalTopic("Housing market")}
                        >
                          Housing market
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-neutral-200"
                          onClick={() => setRegionalTopic("Retirement planning")}
                        >
                          Retirement planning
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return "today";
  } else if (diffDays === 1) {
    return "yesterday";
  } else {
    return `${diffDays} days ago`;
  }
};

const AIAssistantSkeleton = () => (
  <div className="mt-6 bg-white rounded-lg shadow-soft p-4">
    <div className="flex items-start mb-4">
      <Skeleton className="w-8 h-8 rounded-full mr-3" />
      <div className="flex-1">
        <Skeleton className="h-5 w-3/4 mb-1" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
    
    <div className="flex items-start">
      <Skeleton className="w-8 h-8 rounded-full mr-3" />
      <div className="flex-1">
        <Skeleton className="h-24 w-full rounded-lg mb-2" />
        <div className="flex space-x-2">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

export default AIAssistant;
