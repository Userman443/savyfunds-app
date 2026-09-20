import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./hooks/use-auth";

// Functions for cache busting
function clearBrowserCache() {
  try {
    console.log('Force cache refresh with ID:', Date.now());
    
    // Clear React Query cache
    queryClient.clear();
    
    // Clear service worker cache if present
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    console.log('Cache clearing complete');
  } catch (err) {
    console.error('Error during cache busting:', err);
  }
}

// Clear cache on application load to prevent stale content
clearBrowserCache();

// Add a simple console log for debugging
console.log(`savyfunds - ${new Date().toISOString()}`);

// Set page title
document.title = `savyfunds™ - Financial Education`;

// Dynamic SEO metadata updater
function updateSEOMetadata() {
  try {
    // Base domain
    const domain = 'https://savyfunds.com';
    
    // Get current path (clean any cache busting or tracking parameters)
    const path = window.location.pathname;
    const canonicalPath = path.endsWith('/') && path !== '/' 
      ? path.slice(0, -1) // Remove trailing slash except for homepage
      : path;
    
    // Update canonical URL
    const canonicalLink = document.getElementById('canonical-link') as HTMLLinkElement;
    if (canonicalLink) {
      // Special case mappings to avoid duplicate content
      const canonicalMapping: Record<string, string> = {
        '/signup': `${domain}/auth`, // Map signup → auth (canonical for duplicate)
        '/login': `${domain}/auth`,  // Map login → auth
        '/lessons': `${domain}/learn`, // Map lessons → learn
      };
      
      const canonicalUrl = canonicalMapping[canonicalPath] || `${domain}${canonicalPath}`;
      canonicalLink.href = canonicalUrl;
      
      // Also update OG URL for social sharing
      const ogUrl = document.getElementById('og-url') as HTMLMetaElement;
      if (ogUrl) {
        ogUrl.content = canonicalUrl;
      }
    }
    
    // Update page titles based on current path
    const titleMapping: Record<string, string> = {
      '/dashboard': 'Dashboard | savyfunds™',
      '/budget': 'Budget Planner | savyfunds™',
      '/goals': 'Financial Goals | savyfunds™',
      '/learn': 'Learning Center | savyfunds™',
      '/community': 'Community | savyfunds™',
      '/premium': 'Premium Membership | savyfunds™',
      '/profile': 'My Profile | savyfunds™',
      '/auth': 'Sign In or Join | savyfunds™',
    };
    
    if (titleMapping[canonicalPath]) {
      document.title = titleMapping[canonicalPath];
    }
  } catch (err) {
    console.error('Error updating SEO metadata:', err);
  }
}

// Update SEO metadata immediately
updateSEOMetadata();

// Update SEO metadata when the route changes
window.addEventListener('popstate', updateSEOMetadata);

// Create a MutationObserver to watch for URL changes in SPAs
const observer = new MutationObserver((mutations) => {
  mutations.forEach(() => {
    if (window.location.pathname !== lastPathname) {
      lastPathname = window.location.pathname;
      updateSEOMetadata();
    }
  });
});

// Remember last pathname to detect changes
let lastPathname = window.location.pathname;

// Start observing document for route changes
observer.observe(document, { subtree: true, childList: true });

// Render the app
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>
);
