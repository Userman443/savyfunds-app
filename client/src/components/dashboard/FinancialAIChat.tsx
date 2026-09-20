import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bot, SendIcon, Loader2, Lightbulb, Sparkles, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AuthModal } from "@/components/auth/AuthModal";

interface AiResponse {
  answer: string;
  keyPoints?: string[];
  actionItems?: string[];
  sources?: {
    title: string;
    link?: string;
  }[];
}

interface SavedAnswer {
  id: number;
  question: string;
  answer: string;
}

const suggestedQuestions = [
  "How do I create a budget?",
  "What's compound interest?",
  "How do I build an emergency fund?",
  "Should I pay off debt or save first?",
  "How do I start investing?",
  "What credit score do I need for a house?",
];

const thinkingMessages = [
  "Analyzing your question...",
  "Searching our knowledge base...",
  "Crafting a personalized response...",
  "Finding the best financial advice...",
];

const ANON_Q_LIMIT = 2;

const FinancialAIChat: React.FC = () => {
  const [query, setQuery] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [response, setResponse] = useState<AiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState(thinkingMessages[0]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState("");
  const [anonCount, setAnonCount] = useState(0);
  const { toast } = useToast();

  const { data: user } = useQuery<{ id: number } | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.status === 401) return null;
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 30000,
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
    onError: () => {
      toast({
        title: "Login Required",
        description: "Please log in to save answers to your favorites.",
        variant: "destructive",
      });
    },
  });

  const isAnswerSaved = (question: string) => {
    return savedAnswers.some(s => s.question === question);
  };

  useEffect(() => {
    if (!isLoading) return;
    let messageIndex = 0;
    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % thinkingMessages.length;
      setThinkingMessage(thinkingMessages[messageIndex]);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);

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
    setCurrentQuestion(questionText);
    
    try {
      const res = await apiRequest("POST", "/api/financial-ai/ask", { query: questionText });
      const data = await res.json();
      setAnonCount(prev => user ? prev : prev + 1);
      setResponse(data);
    } catch (error: any) {
      const is429 = error?.message?.includes("429");
      if (is429) {
        setAuthModalMessage("You've used your 2 free questions. Sign up for free to ask unlimited questions!");
        setShowAuthModal(true);
      } else {
        console.error("Error asking AI:", error);
        toast({
          title: "Error",
          description: "Could not get a response from our financial assistant. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (response && currentQuestion) {
      saveMutation.mutate({
        question: currentQuestion,
        answer: response.answer,
        keyPoints: response.keyPoints,
        actionItems: response.actionItems,
      });
    }
  };

  const handleAiQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    await askQuestion(query);
  };

  return (
    <div className="mb-8">
      <Card className="bg-gradient-to-r from-primary-50 to-accent-50">
        <CardHeader>
          <div className="flex items-center">
            <Bot className="mr-2 h-6 w-6 text-primary" />
            <CardTitle className="text-xl text-primary">AI Financial Assistant</CardTitle>
          </div>
          <CardDescription>
            Ask any financial question and get personalized answers from our knowledge base.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAiQuery} className="flex gap-2">
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
            <p className="text-xs text-amber-600 flex items-center gap-1 mt-2">
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

          {!response && !isLoading && (
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
                    className="text-xs h-auto py-2 px-3 whitespace-normal text-left bg-white"
                    onClick={() => askQuestion(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-6 mt-4 bg-white rounded-lg border border-primary/20">
              <div className="relative mb-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Loader2 className="h-3 w-3 animate-spin text-white" />
                </div>
              </div>
              <p className="font-medium text-primary">{thinkingMessage}</p>
              <p className="text-xs text-muted-foreground mt-1">This may take a few seconds</p>
            </div>
          )}

          {response && !isLoading && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-muted-foreground">{currentQuestion}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSave}
                  disabled={saveMutation.isPending || !!(user && isAnswerSaved(currentQuestion))}
                  className={user && isAnswerSaved(currentQuestion) ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"}
                  title={user ? "Save to favorites" : "Sign in to save"}
                >
                  {user && isAnswerSaved(currentQuestion) ? (
                    <BookmarkCheck className="h-5 w-5" />
                  ) : (
                    <Bookmark className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: response.answer.replace(/\n/g, '<br/>') }} />
              </div>

              {response.keyPoints && response.keyPoints.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-3 mt-4">
                  <h4 className="font-semibold text-blue-800 mb-2 text-sm">Key Points</h4>
                  <ul className="space-y-1">
                    {response.keyPoints.map((point, i) => (
                      <li key={i} className="text-xs text-blue-700 flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {response.actionItems && response.actionItems.length > 0 && (
                <div className="bg-green-50 rounded-lg p-3 mt-3">
                  <h4 className="font-semibold text-green-800 mb-2 text-sm">Action Items</h4>
                  <ul className="space-y-1">
                    {response.actionItems.map((item, i) => (
                      <li key={i} className="text-xs text-green-700 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {response.sources && response.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <h5 className="text-sm font-medium mb-1">Sources:</h5>
                  <ul className="list-disc pl-5 text-xs text-gray-600">
                    {response.sources.map((source, i) => (
                      <li key={i}>
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
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        message={authModalMessage || "Sign in or create a free account to save your favourite financial answers."}
        defaultTab="signup"
        onSuccess={() => setAnonCount(0)}
      />
    </div>
  );
};

export default FinancialAIChat;