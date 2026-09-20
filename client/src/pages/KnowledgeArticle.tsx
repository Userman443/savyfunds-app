import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { KnowledgeArticle } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, Calendar, Tag } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function KnowledgeArticlePage() {
  const [match, params] = useRoute('/knowledge/:id');
  const articleId = match ? parseInt(params.id) : null;

  const { data: article, isLoading, error } = useQuery<KnowledgeArticle>({
    queryKey: [`/api/knowledge/articles/${articleId}`],
    enabled: !!articleId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Article Not Found</h2>
        <p className="text-center mb-6">We couldn't find the article you're looking for.</p>
        <Button asChild>
          <Link to="/knowledge">Back to Knowledge Base</Link>
        </Button>
      </div>
    );
  }

  // Format the article content with proper paragraphs and remove asterisks
  const formattedContent = article.content
    .split('\n\n')
    .map(paragraph => {
      // Remove asterisks from list items while preserving the list format
      return paragraph.replace(/\s*\*\s*/g, '')
                      .replace(/\-\s+/g, '• ');
    })
    .map((paragraph, index) => (
      <p key={index} className="mb-4">
        {paragraph}
      </p>
    ));

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 pl-0 hover:bg-transparent">
          <Link to="/knowledge">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Knowledge Base
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <Badge variant="outline" className="mb-2">
              {article.category}
            </Badge>
            <div className="flex items-center text-muted-foreground text-sm">
              <Eye className="h-4 w-4 mr-1" />
              <span>{article.views} views</span>
            </div>
          </div>
          <CardTitle className="text-2xl md:text-3xl">{article.title}</CardTitle>
          <div className="flex flex-wrap gap-2 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>
                {article.dateCreated ? format(new Date(article.dateCreated), 'MMMM d, yyyy') : 'Unknown date'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Separator className="mb-6" />
          <div className="prose max-w-none">
            {formattedContent}
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="mt-8">
              <Separator className="mb-4" />
              <div className="flex flex-wrap gap-2 items-center">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}