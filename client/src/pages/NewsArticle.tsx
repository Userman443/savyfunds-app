import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { NewsArticle } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, Calendar, Tag } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Meta } from '@/components/SEO/Meta';

const TYPE_LABELS: Record<string, string> = {
  press: 'Press Release',
  company: 'Company News',
  market: 'Financial News',
  news: 'News',
};

export default function NewsArticlePage() {
  const [match, params] = useRoute('/news/:slug');
  const slug = match ? params.slug : null;

  const { data: article, isLoading, error } = useQuery<NewsArticle>({
    queryKey: [`/api/news/${slug}`],
    enabled: !!slug,
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
        <p className="text-center mb-6">We couldn't find the story you're looking for.</p>
        <Button asChild>
          <Link to="/news">Back to News</Link>
        </Button>
      </div>
    );
  }

  const canonicalUrl = `https://savyfunds.com/news/${article.slug}`;
  const description = article.excerpt || article.content.slice(0, 160);
  const rawImageUrl = article.imageUrl || '/social-preview.png';
  const absoluteImageUrl = rawImageUrl.startsWith('http')
    ? rawImageUrl
    : `https://savyfunds.com${rawImageUrl}`;
  const datePublished = article.publishedAt
    ? new Date(article.publishedAt).toISOString()
    : new Date().toISOString();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description,
    datePublished,
    dateModified: article.dateUpdated ? new Date(article.dateUpdated).toISOString() : datePublished,
    author: {
      '@type': 'Organization',
      name: 'savyfunds',
      url: 'https://savyfunds.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'savyfunds',
      url: 'https://savyfunds.com',
    },
    image: absoluteImageUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };

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
      <Meta
        title={article.title}
        description={description}
        canonicalUrl={canonicalUrl}
        imageUrl={absoluteImageUrl}
        type="article"
        keywords={article.tags || []}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 pl-0 hover:bg-transparent">
          <Link to="/news">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to News
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden">
        {article.imageUrl && (
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full max-h-96 object-contain bg-white"
          />
        )}
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <Badge variant={article.type === 'press' ? 'default' : 'outline'} className="mb-2">
              {TYPE_LABELS[article.type] || 'News'}
            </Badge>
            <div className="flex items-center text-muted-foreground text-sm">
              <Eye className="h-4 w-4 mr-1" />
              <span>{article.views} views</span>
            </div>
          </div>
          <CardTitle className="text-2xl md:text-3xl">{article.title}</CardTitle>
          <div className="flex flex-wrap gap-2 mt-4 text-sm text-muted-foreground">
            {article.publishedAt && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{format(new Date(article.publishedAt), 'MMMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Separator className="my-4" />
          <div className="prose max-w-none text-base leading-relaxed">
            {formattedContent}
          </div>
          {article.tags && article.tags.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="flex flex-wrap gap-2 items-center">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {article.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
