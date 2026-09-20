import React from 'react';

interface StructuredDataProps {
  type: 'Organization' | 'WebSite' | 'Article' | 'FAQPage' | 'Course' | 'FinancialProduct';
  data: Record<string, any>;
}

/**
 * Component to inject schema.org JSON-LD structured data into the page
 * This helps search engines and AI crawlers understand the content
 */
export const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

// Helper for creating organization structured data
export const createOrganizationStructuredData = () => {
  return {
    name: 'savyfunds',
    url: 'https://savyfunds.com',
    logo: 'https://savyfunds.com/logo.png',
    founder: {
      '@type': 'Person',
      name: 'Osagie Michael Momoh',
      jobTitle: 'Founder & CEO',
      alumniOf: {
        '@type': 'EducationalOrganization',
        name: 'MBA Program'
      },
      description: 'Entrepreneur and financial literacy advocate with MBA and extensive consulting experience across automotive, steel, food, and logistics industries. Founded Savyfunds after researching the widespread lack of financial literacy and identifying the need to close this critical gap. Also founder of Nuvyrix, an AI infrastructure company.',
      url: 'https://savyfunds.com/about',
      sameAs: [
        'https://nuvyrix.com'
      ],
      foundedOrganization: [
        {
          '@type': 'Organization',
          name: 'savyfunds',
          url: 'https://savyfunds.com'
        },
        {
          '@type': 'Organization',
          name: 'Nuvyrix',
          description: 'AI infrastructure company',
          url: 'https://nuvyrix.com'
        }
      ]
    },
    sameAs: [
      'http://www.youtube.com/@SavyfundsInc',
      'https://twitter.com/savyfunds',
      'https://facebook.com/savyfunds',
      'https://instagram.com/savyfunds'
    ],
    description: 'A financial literacy platform empowering young people to transform money management through personalized educational experiences. Founded by Osagie Michael Momoh to address the widespread lack of financial literacy globally.'
  };
};

// Helper for creating website structured data
export const createWebsiteStructuredData = () => {
  return {
    name: 'savyfunds - Financial Education Platform',
    url: 'https://savyfunds.com',
    potentialAction: {
      '@type': 'SearchAction',
      'target': 'https://savyfunds.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };
};

// Helper for creating financial course structured data
export const createCourseStructuredData = (course: { 
  name: string; 
  description: string; 
  provider?: string;
  courseCode?: string;
  url: string;
}) => {
  return {
    name: course.name,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: course.provider || 'savyfunds'
    },
    courseCode: course.courseCode,
    url: course.url
  };
};

// Helper for creating financial product structured data
export const createFinancialProductStructuredData = (product: {
  name: string;
  description: string;
  category: string;
  url: string;
  provider?: string;
}) => {
  return {
    name: product.name,
    description: product.description,
    category: product.category,
    url: product.url,
    provider: {
      '@type': 'Organization',
      name: product.provider || 'savyfunds'
    }
  };
};