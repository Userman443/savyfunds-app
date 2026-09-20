import React from 'react';
import { Helmet } from 'react-helmet';

interface MetaProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  imageUrl?: string;
  type?: 'website' | 'article';
  keywords?: string[];
}

/**
 * Component to manage page metadata for SEO and AI crawlers
 * Dynamically updates page title, description, and other meta tags
 */
export const Meta: React.FC<MetaProps> = ({
  title = 'savyfunds - Financial Education Platform',
  description = 'Your personalized financial education platform to build better money habits and improve financial literacy',
  canonicalUrl = 'https://savyfunds.com',
  imageUrl = '/social-preview.png',
  type = 'website',
  keywords = ['financial education', 'money management', 'budgeting', 'financial literacy', 'personal finance']
}) => {
  const fullTitle = title.includes('savyfunds') ? title : `${title} | savyfunds`;
  
  return (
    <Helmet>
      {/* Basic metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* OpenGraph metadata */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      
      {/* Twitter Card metadata */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  );
};