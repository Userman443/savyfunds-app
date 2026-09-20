import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { NewsArticle } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, ArrowRight, Newspaper } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Meta } from '@/components/SEO/Meta';

const TYPE_LABELS: Record<string, string> = {
  press: 'Press Release',
  company: 'Company News',
  market: 'Financial News',
  news: 'News',
};

const TABS = [
  { value: 'all', label: 'Latest' },
  { value: 'press', label: 'Press Releases' },
  { value: 'company', label: 'Company News' },
  { value: 'market', label: 'Financial News' },
];

export default function News() {
  const [activeTab, setActiveTab] = useState('all');

  const { data: articles, isLoading, error } = useQuery<NewsArticle[]>({
    queryKey: ['/api/news', activeTab],
    queryFn: async () => {
      const url = activeTab === 'all' ? '/api/news' : `/api/news?type=${activeTab}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch news');
      return res.json();
    },
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Meta
        title="News | savyfunds"
        description="The latest press releases, company updates, and financial news from savyfunds."
        canonicalUrl="https://savyfunds.com/news"
        type="website"
      />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Newspaper className="h-8 w-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold">News</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Press releases, company updates, and financial news from the savyfunds team.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 flex h-auto flex-wrap">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="text-center py-16">
          <p className="text-red-500 mb-4">We couldn't load the news right now. Please try again later.</p>
        </div>
      )}

      {!isLoading && !error && articles && articles.length === 0 && (
        <div className="text-center py-16">
          <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No stories yet</h2>
          <p className="text-muted-foreground">Check back soon for the latest updates.</p>
        </div>
      )}

      {!isLoading && !error && articles && articles.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Card key={article.id} className="flex flex-col h-full overflow-hidden">
              {article.imageUrl && (
                <Link to={`/news/${article.slug}`}>
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-44 object-cover"
                  />
                </Link>
              )}
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={article.type === 'press' ? 'default' : 'outline'}>
                    {TYPE_LABELS[article.type] || 'News'}
                  </Badge>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Eye className="h-4 w-4 mr-1" />
                    <span>{article.views || 0}</span>
                  </div>
                </div>
                <CardTitle className="text-xl leading-snug">
                  <Link to={`/news/${article.slug}`} className="hover:text-primary transition-colors">
                    {article.title}
                  </Link>
                </CardTitle>
                {article.publishedAt && (
                  <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(new Date(article.publishedAt), 'MMMM d, yyyy')}
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription className="text-base">
                  {article.excerpt || article.content.slice(0, 160) + '...'}
                </CardDescription>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" asChild className="pl-0">
                  <Link to={`/news/${article.slug}`}>
                    Read more
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
