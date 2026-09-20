import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { KnowledgeArticle } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Book, Tag, Bookmark, Eye, Bot, SendIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface AiResponse {
  answer: string;
  sources?: {
    title: string;
    link?: string;
  }[];
}

export default function Knowledge() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [aiResponse, setAiResponse] = useState<AiResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{question: string; answer: string}[]>([]);
  const { toast } = useToast();

  // Fetch all knowledge articles
  const { data: articles, isLoading, error } = useQuery<KnowledgeArticle[]>({
    queryKey: ['/api/knowledge/articles'],
  });

  const categories = articles ? 
    Array.from(new Set(articles.map(article => article.category))) : 
    [];

  const filteredArticles = activeTab === 'all' 
    ? articles 
    : articles?.filter(article => article.category === activeTab);

  const handleCategoryChange = (category: string) => {
    setActiveTab(category);
  };
  
  const handleAiQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setIsAiLoading(true);
    
    try {
      const res = await apiRequest("POST", "/api/financial-ai/ask", { query });
      const data = await res.json();
      
      setAiResponse(data);
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
      setIsAiLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Knowledge Base</h2>
        <p className="text-center mb-6">We couldn't load the knowledge articles. Please try again later.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-semibold mb-2">Knowledge Base</h1>
      <p className="text-muted-foreground mb-6">
        Explore our collection of financial literacy articles and resources.
      </p>
      
      {/* Financial AI Assistant */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center">
            <Bot className="mr-2 h-6 w-6 text-primary" />
            <CardTitle className="text-2xl text-primary">Financial Assistant</CardTitle>
          </div>
          <CardDescription>
            Ask any financial question and get personalized answers from our financial knowledge base.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAiQuery} className="flex gap-2">
            <Input
              placeholder="Ask a financial question, e.g., 'What is compound interest?'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
              disabled={isAiLoading}
            />
            <Button type="submit" disabled={isAiLoading || !query.trim()}>
              {isAiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendIcon className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Ask</span>
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {isAiLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Finding the best answer for you...</span>
        </div>
      )}

      {aiResponse && !isAiLoading && (
        <Card className="mb-6 border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-lg">Your latest question:</CardTitle>
            <CardDescription className="text-base font-medium">
              {conversationHistory[conversationHistory.length - 1]?.question}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none dark:prose-invert">
              <div dangerouslySetInnerHTML={{ __html: aiResponse.answer.replace(/\n/g, '<br/>') }} />
            </div>
          </CardContent>
          {aiResponse.sources && aiResponse.sources.length > 0 && (
            <CardFooter className="flex-col items-start">
              <h4 className="text-sm font-semibold">Sources:</h4>
              <ul className="ml-4 mt-1 list-disc">
                {aiResponse.sources.map((source, i) => (
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

      <Tabs defaultValue="all" value={activeTab} onValueChange={handleCategoryChange} className="mb-8">
        <TabsList className="mb-4 flex h-auto flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles?.map((article) => (
              <Card key={article.id} className="flex flex-col h-full">
                <CardHeader>
                  <CardTitle className="flex items-start gap-2">
                    <Book className="h-5 w-5 flex-shrink-0 mt-1" />
                    <span>{article.title}</span>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="outline">{article.category}</Badge>
                    <div className="ml-auto flex items-center gap-1 text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span>{article.views}</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="line-clamp-4">
                    {article.content.slice(0, 150)}...
                  </p>
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {article.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(`/knowledge/${article.id}`)}
                  >
                    Read More
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}