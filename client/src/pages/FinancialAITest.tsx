import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, SendIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AiResponse {
  answer: string;
  sources?: {
    title: string;
    link?: string;
  }[];
}

export default function FinancialAITest() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<AiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{question: string; answer: string}[]>([]);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setIsLoading(true);
    
    try {
      const res = await apiRequest("POST", "/api/financial-ai/ask", { query });
      const data = await res.json();
      
      setResponse(data);
      setConversationHistory(prev => [...prev, {
        question: query,
        answer: data.answer
      }]);
      setQuery("");
    } catch (error) {
      console.error("Error asking AI:", error);
      toast({
        title: "Error",
        description: "Could not get a response from our financial assistant. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-5xl py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Financial AI Assistant (Test)</CardTitle>
          <CardDescription>
            Ask any financial question and get answers from our financial knowledge base.
            <br />
            <span className="text-sm italic text-muted-foreground">
              (This is a test feature that doesn't require login)
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="Ask a financial question, e.g., 'What is compound interest?'"
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
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Finding the best answer for you...</span>
        </div>
      )}

      {response && !isLoading && (
        <Card className="mb-6 border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-lg">Your latest question:</CardTitle>
            <CardDescription className="text-base font-medium">
              {conversationHistory[conversationHistory.length - 1]?.question}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none dark:prose-invert">
              <div dangerouslySetInnerHTML={{ __html: response.answer.replace(/\n/g, '<br/>') }} />
            </div>
          </CardContent>
          {response.sources && response.sources.length > 0 && (
            <CardFooter className="flex-col items-start">
              <h4 className="text-sm font-semibold">Sources:</h4>
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

      {conversationHistory.length > 1 && (
        <div className="mt-8">
          <h3 className="mb-4 text-xl font-semibold">Previous Questions</h3>
          <div className="space-y-4">
            {conversationHistory.slice(0, -1).reverse().map((item, i) => (
              <Card key={i} className="border-l-2 border-l-muted-foreground">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">{item.question}</CardTitle>
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
    </div>
  );
}