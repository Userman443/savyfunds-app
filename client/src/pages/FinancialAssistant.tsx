import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, SendIcon, Bot, Bookmark, BookmarkCheck, Sparkles, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackAIInteraction, trackMainConversion } from "@/lib/twitter-tracking";
import { AuthModal } from "@/components/auth/AuthModal";

interface AiResponse {
  answer: string;
  keyPoints?: string[];
  actionItems?: string[];
  sources?: {
    title: string;
    link?: string;
  }[];
  relatedTopics?: string[];
  source?: 'database' | 'ai';
}

interface SavedAnswer {
  id: number;
  question: string;
  answer: string;
  keyPoints?: string[];
  actionItems?: string[];
  createdAt: string;
}

const suggestedQuestions = [
  "How do I create a budget for my first apartment?",
  "What's the best way to start investing with $100?",
  "How do I build an emergency fund?",
  "Should I pay off debt or save first?",
  "How does compound interest work?",
  "What credit score do I need to buy a house?",
];

const thinkingMessages = [
  "Analyzing your question...",
  "Searching our knowledge base...",
  "Crafting a personalized response...",
  "Finding the best financial advice...",
  "Preparing helpful tips for you...",
];

const ANON_Q_LIMIT = 2;

export default function FinancialAssistant() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<AiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState(thinkingMessages[0]);
  const [conversationHistory, setConversationHistory] = useState<{question: string; answer: string; keyPoints?: string[]; actionItems?: string[]}[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState("");
  const [anonCount, setAnonCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<{
    id: number;
    username: string;
    email: string;
  }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: savedAnswers = [] } = useQuery<SavedAnswer[]>({
    queryKey: ["/api/financial-ai/saved"],
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { question: string; answer: string; keyPoints?: string[]; actionItems?: string[] }) => {
      const res = await apiRequest("POST", "/api/financial-ai/save", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-ai/saved"] });
      toast({
        title: "Saved!",
        description: "Answer saved to your favorites.",
      });
    },
    onError: (error: any) => {
      const isAuthError = error?.message?.includes('401') || error?.response?.status === 401;
      toast({
        title: isAuthError ? "Login Required" : "Error",
        description: isAuthError 
          ? "Please log in to save answers to your favorites." 
          : "Could not save this answer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/financial-ai/saved/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-ai/saved"] });
      toast({
        title: "Removed",
        description: "Answer removed from favorites.",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    await askQuestion(query);
  };

  useEffect(() => {
    if (user) return;
    fetch("/api/anon/question-count", { credentials: "include" })
      .then(r => r.json())
      .then(data => { if (!data.isLoggedIn) setAnonCount(data.count); })
      .catch(() => {});
  }, [user]);

  const askQuestion = async (questionText: string) => {
    setIsLoading(true);
    setQuery("");
    
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % thinkingMessages.length;
      setThinkingMessage(thinkingMessages[messageIndex]);
    }, 2000);
    
    try {
      const res = await apiRequest("POST", "/api/financial-ai/ask", { query: questionText });
      const data = await res.json();
      
      trackAIInteraction();
      trackMainConversion({
        action: 'ai_interaction',
        userId: user?.id?.toString(),
        email: user?.email,
        content: 'AI Assistant Query'
      });

      setAnonCount(prev => user ? prev : prev + 1);
      setResponse(data);
      setConversationHistory(prev => [...prev, {
        question: questionText,
        answer: data.answer,
        keyPoints: data.keyPoints,
        actionItems: data.actionItems,
      }]);
    } catch (error: any) {
      const is429 = error?.message?.includes("429");
      if (is429) {
        setAuthModalMessage("You've used your 2 free questions. Sign up for free to ask unlimited questions!");
        setShowAuthModal(true);
      } else {
        console.error("Error asking AI:", error);
        toast({
          title: "Error",
          description: "Could not get a response from our financial assistant. Please try again later.",
          variant: "destructive"
        });
      }
    } finally {
      clearInterval(messageInterval);
      setIsLoading(false);
    }
  };

  const isAnswerSaved = (question: string) => {
    return savedAnswers.some(s => s.question === question);
  };

  const getSavedAnswerId = (question: string) => {
    return savedAnswers.find(s => s.question === question)?.id;
  };

  const handleSaveToggle = (question: string, answer: string, keyPoints?: string[], actionItems?: string[]) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (isAnswerSaved(question)) {
      const id = getSavedAnswerId(question);
      if (id) deleteMutation.mutate(id);
    } else {
      saveMutation.mutate({ question, answer, keyPoints, actionItems });
    }
  };

  return (
    <div className="container max-w-5xl py-8">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center">
            <Bot className="mr-2 h-6 w-6 text-primary" />
            <CardTitle className="text-2xl text-primary">Financial Assistant</CardTitle>
          </div>
          <CardDescription>
            Ask any financial question and get personalized answers powered by AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="Ask a financial question..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !query.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendIcon className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Ask</span>
            </Button>
          </form>

          {!user && anonCount > 0 && anonCount < ANON_Q_LIMIT && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              {ANON_Q_LIMIT - anonCount} free {ANON_Q_LIMIT - anonCount === 1 ? "question" : "questions"} remaining —{" "}
              <button
                type="button"
                className="underline font-medium hover:text-amber-700"
                onClick={() => {
                  setAuthModalMessage("Sign up for free to ask unlimited financial questions!");
                  setShowAuthModal(true);
                }}
              >
                sign up free
              </button>{" "}
              for unlimited access.
            </p>
          )}

          {!response && !isLoading && conversationHistory.length === 0 && (
            <div className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Lightbulb className="h-4 w-4" />
                <span>Try asking one of these questions:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-2 px-3 whitespace-normal text-left"
                    onClick={() => askQuestion(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium text-primary">{thinkingMessage}</p>
                <p className="text-sm text-muted-foreground mt-1">This may take a few seconds for complex questions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {response && !isLoading && conversationHistory.length > 0 && (
        <Card className="mb-6 border-l-4 border-l-primary">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Your question:</CardTitle>
                <CardDescription className="text-base font-medium mt-1">
                  {conversationHistory[conversationHistory.length - 1]?.question}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const latest = conversationHistory[conversationHistory.length - 1];
                  handleSaveToggle(latest.question, latest.answer, latest.keyPoints, latest.actionItems);
                }}
                className={user && isAnswerSaved(conversationHistory[conversationHistory.length - 1]?.question) ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"}
                title={user ? "Save to favorites" : "Sign in to save"}
              >
                {user && isAnswerSaved(conversationHistory[conversationHistory.length - 1]?.question) ? (
                  <BookmarkCheck className="h-5 w-5" />
                ) : (
                  <Bookmark className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose max-w-none dark:prose-invert">
              <div dangerouslySetInnerHTML={{ __html: response.answer.replace(/\n/g, '<br/>') }} />
            </div>

            {response.keyPoints && response.keyPoints.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-blue-800 mb-2">Key Points</h4>
                <ul className="space-y-1">
                  {response.keyPoints.map((point, i) => (
                    <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {response.actionItems && response.actionItems.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Action Items</h4>
                <ul className="space-y-1">
                  {response.actionItems.map((item, i) => (
                    <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
          {response.sources && response.sources.length > 0 && (
            <CardFooter className="flex-col items-start border-t pt-4">
              <h4 className="text-sm font-semibold text-muted-foreground">Sources:</h4>
              <ul className="ml-4 mt-1 list-disc">
                {response.sources.map((source, i) => (
                  <li key={i} className="text-sm">
                    {source.link ? (
                      <a href={source.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {source.title}
                      </a>
                    ) : (
                      source.title
                    )}
                  </li>
                ))}
              </ul>
            </CardFooter>
          )}
        </Card>
      )}

      {savedAnswers.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 text-xl font-semibold flex items-center gap-2">
            <BookmarkCheck className="h-5 w-5 text-yellow-500" />
            Saved Answers
          </h3>
          <div className="space-y-4">
            {savedAnswers.map((item) => (
              <Card key={item.id} className="border-l-2 border-l-yellow-400">
                <CardHeader className="py-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium">{item.question}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(item.id)}
                      className="text-yellow-500 h-8 w-8"
                    >
                      <BookmarkCheck className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="py-3">
                  <div className="prose max-w-none text-sm dark:prose-invert">
                    <div dangerouslySetInnerHTML={{ __html: item.answer.replace(/\n/g, '<br/>') }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {conversationHistory.length > 1 && (
        <div className="mt-8">
          <h3 className="mb-4 text-xl font-semibold">Previous Questions</h3>
          <div className="space-y-4">
            {conversationHistory.slice(0, -1).reverse().map((item, i) => (
              <Card key={i} className="border-l-2 border-l-muted-foreground">
                <CardHeader className="py-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium">{item.question}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSaveToggle(item.question, item.answer, item.keyPoints, item.actionItems)}
                      className={user && isAnswerSaved(item.question) ? "text-yellow-500 h-8 w-8" : "text-muted-foreground h-8 w-8"}
                      title={user ? "Save to favorites" : "Sign in to save"}
                    >
                      {user && isAnswerSaved(item.question) ? (
                        <BookmarkCheck className="h-4 w-4" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="py-3">
                  <div className="prose max-w-none text-sm dark:prose-invert">
                    <div dangerouslySetInnerHTML={{ __html: item.answer.replace(/\n/g, '<br/>') }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        message={authModalMessage || "Sign in or create a free account to save your favourite answers."}
        defaultTab="signup"
        onSuccess={() => setAnonCount(0)}
      />
    </div>
  );
}
