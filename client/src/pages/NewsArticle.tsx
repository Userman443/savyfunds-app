import { useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { NewsArticle } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, Calendar, Tag, Share2, Check } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Meta } from '@/components/SEO/Meta';

const TYPE_LABELS: Record<string, string> = {
  press: 'Press Release',
  company: 'Company News',
  market: 'Financial News',
  news: 'News',
};

// Render [label](url) links, bare URLs, and email addresses as clickable anchors.
// Bare URLs display as their hostname so long addresses never show in plaintext.
function renderRichText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  const pushPlain = (chunk: string) => {
    const urlPattern = /(https?:\/\/[^\s)]+|www\.[^\s)]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
    let li = 0;
    let um: RegExpExecArray | null;
    while ((um = urlPattern.exec(chunk))) {
      if (um.index > li) nodes.push(chunk.slice(li, um.index));
      const token = um[0];
      let href = token;
      let label = token;
      if (token.includes('@') && !/^https?:\/\//i.test(token) && !/^www\./i.test(token)) {
        href = `mailto:${token}`;
      } else {
        if (!/^https?:\/\//i.test(token)) href = `https://${token}`;
        try {
          label = new URL(href).hostname.replace(/^www\./, '');
        } catch {
          label = token;
        }
      }
      nodes.push(
        <a
          key={`u-${key++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
        >
          {label}
        </a>
      );
      li = um.index + token.length;
    }
    if (li < chunk.length) nodes.push(chunk.slice(li));
  };

  while ((match = linkPattern.exec(text))) {
    if (match.index > lastIndex) pushPlain(text.slice(lastIndex, match.index));
    const href = match[2];
    nodes.push(
      <a
        key={`l-${key++}`}
        href={href}
        target={href.startsWith('mailto:') ? undefined : '_blank'}
        rel="noopener noreferrer"
        className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
      >
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) pushPlain(text.slice(lastIndex));
  return nodes;
}

export default function NewsArticlePage() {
  const [match, params] = useRoute('/news/:slug');
  const slug = match ? params.slug : null;
  const [copied, setCopied] = useState(false);

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

  const canonicalUrl = `https://www.savyfunds.com/news/${article.slug}`;
  const description = article.excerpt || article.content.slice(0, 160);
  const rawImageUrl = article.imageUrl || '/social-preview.png';
  const absoluteImageUrl = rawImageUrl.startsWith('http')
    ? rawImageUrl
    : `https://www.savyfunds.com${rawImageUrl}`;
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
      url: 'https://www.savyfunds.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'savyfunds',
      url: 'https://www.savyfunds.com',
    },
    image: absoluteImageUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };

  const handleShare = async () => {
    // Share only the title and the canonical article URL. The article
    // description is deliberately excluded: it can mention savyfunds.com
    // in plain text, which apps like X auto-link into a homepage link
    // sitting next to the real article URL.
    const shareData = { title: article.title, url: canonicalUrl };
    try {
      const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
      if (nav.share) {
        await nav.share(shareData);
        return;
      }
      throw new Error('Web Share unavailable');
    } catch {
      try {
        await navigator.clipboard.writeText(canonicalUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // clipboard unavailable; nothing to do
      }
    }
  };

  // Format the article content with proper paragraphs, clickable links, and list bullets
  const formattedContent = article.content
    .split('\n\n')
    .map(paragraph => {
      // Remove asterisks from list items while preserving the list format
      return paragraph.replace(/\s*\*\s*/g, '')
                      .replace(/\-\s+/g, '• ');
    })
    .map((paragraph, index) => (
      <p key={index} className="mb-4">
        {renderRichText(paragraph)}
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
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </>
                )}
              </Button>
              <div className="flex items-center text-muted-foreground text-sm">
                <Eye className="h-4 w-4 mr-1" />
                <span>{article.views} views</span>
              </div>
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
