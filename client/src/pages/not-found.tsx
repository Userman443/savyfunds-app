import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, ArrowLeft, Search } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useQuery } from "@tanstack/react-query";

export default function NotFound() {
  const [location] = useLocation();
  
  // Get user data for navbar
  const { data: user } = useQuery<{
    id: number;
    username: string;
    displayName: string;
    level: number;
    isPremium: boolean;
    avatarUrl?: string;
  } | null>({
    queryKey: ["/api/auth/me"],
    retry: 0
  });
  
  // Update metadata for 404 page
  useEffect(() => {
    // Set proper page title
    document.title = "Page Not Found | savyfunds™";
    
    // Send 404 status to search engines using meta tags
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex';
    document.head.appendChild(metaRobots);
    
    // Update canonical link to point to homepage to avoid indexing 404 pages
    const canonicalLink = document.getElementById('canonical-link') as HTMLLinkElement;
    if (canonicalLink) {
      canonicalLink.href = 'https://savyfunds.com/';
    }
    
    // Return cleanup function
    return () => {
      // Remove the noindex tag when navigating away
      const robotsTag = document.querySelector('meta[name="robots"][content="noindex"]');
      if (robotsTag) {
        robotsTag.remove();
      }
    };
  }, []);
  
  // Try to suggest a correct page
  const suggestCorrectPage = () => {
    const path = location.toLowerCase();
    
    // Common misspellings or case variations
    const suggestions: Record<string, string> = {
      '/dashbord': '/dashboard',
      '/dashoard': '/dashboard',
      '/budge': '/budget',
      '/budgets': '/budget',
      '/goal': '/goals',
      '/learning': '/learn',
      '/lessons': '/learn',
      '/comunity': '/community',
      '/signup': '/auth',
      '/register': '/auth',
      '/login': '/auth',
      '/signin': '/auth',
      '/settings': '/profile',
      '/account': '/profile',
      '/premium-plan': '/premium',
      '/upgrade': '/premium',
      '/knowledge-base': '/knowledge',
      '/articles': '/knowledge',
      '/about': '/about-us',
      '/mission': '/our-mission',
      '/privacy': '/privacy-policy',
      '/tos': '/terms',
      '/terms-of-service': '/terms',
    };
    
    // Check if we have a direct suggestion
    for (const [wrongPath, correctPath] of Object.entries(suggestions)) {
      if (path.includes(wrongPath)) {
        return correctPath;
      }
    }
    
    // No suggestion found
    return null;
  };
  
  const suggestedPath = suggestCorrectPage();
  
  return (
    <>
      <Navbar user={user || null} />
      
      <div className="min-h-[calc(100vh-64px)] w-full flex items-center justify-center bg-gray-50 py-10">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-8 pb-8">
            <div className="flex items-center mb-4 gap-3">
              <AlertCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
              <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
            </div>

            <p className="mt-4 mb-3 text-sm text-gray-600">
              The page you're looking for doesn't exist or you may not have permission to view it.
            </p>
            
            {suggestedPath && (
              <div className="mb-6 p-3 bg-primary-50 border border-primary-100 rounded-md">
                <p className="text-sm text-primary-700 font-medium">
                  Did you mean to visit:
                </p>
                <Link href={suggestedPath} className="text-sm text-primary-700 underline mt-1 flex items-center">
                  {suggestedPath} <ArrowLeft className="h-3 w-3 ml-1 inline rotate-180" />
                </Link>
              </div>
            )}
            
            <div className="flex flex-col gap-3 mt-6">
              <Link href="/">
                <Button className="w-full flex items-center justify-center" variant="default">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
              
              <div className="grid grid-cols-2 gap-3">
                <Link href="/learn">
                  <Button className="w-full" variant="outline">
                    Learning Center
                  </Button>
                </Link>
                <Link href="/knowledge">
                  <Button className="w-full" variant="outline">
                    Knowledge Base
                  </Button>
                </Link>
              </div>
              
              {!user && (
                <Link href="/auth">
                  <Button className="w-full mt-2" variant="secondary">
                    Login / Sign Up
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </>
  );
}