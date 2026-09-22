// SEO utility functions to manage meta tags dynamically
export function updateMetaTags(route: string, isAuthenticated: boolean) {
  // All pages are publicly accessible — always allow indexing.
  // Only block truly private user-specific pages.
  const alwaysNoIndex = [
    '/verify-email',
    '/resend-verification',
    '/financial-ai-test',
    '/location-test',
  ];

  const shouldNoIndex = alwaysNoIndex.some(r => route.startsWith(r));

  // Update robots meta tag
  const robotsTag = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
  if (robotsTag) {
    robotsTag.content = shouldNoIndex ? 'noindex, nofollow' : 'index, follow';
  }

  // Update canonical URL — handled in main.tsx already via the id="canonical-link" element
  const canonicalLink = document.querySelector('#canonical-link') as HTMLLinkElement;
  if (canonicalLink && !canonicalLink.href.includes(route)) {
    canonicalLink.href = `https://www.savyfunds.com${route}`;
  }

  // Update OpenGraph URL
  const ogUrl = document.querySelector('#og-url') as HTMLMetaElement;
  if (ogUrl) {
    ogUrl.content = `https://www.savyfunds.com${route}`;
  }
}

export function setPageTitle(title: string) {
  document.title = `${title} - savyfunds™`;
}

export function setPageDescription(description: string) {
  const metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
  if (metaDescription) {
    metaDescription.content = description;
  }
}
