import { Route, Switch, useLocation, Link, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/Dashboard";
import Learn from "@/pages/Learn";
import Budget from "@/pages/Budget";
import Goals from "@/pages/Goals";
import Community from "@/pages/Community";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import LandingPage from "@/pages/LandingPage";
import ModuleDetails from "@/pages/ModuleDetails";
import Onboarding from "@/pages/Onboarding";
import AboutUs from "@/pages/AboutUs";
import OurMission from "@/pages/OurMission";
import Premium from "@/pages/Premium";
import Knowledge from "@/pages/Knowledge";
import KnowledgeArticle from "@/pages/KnowledgeArticle";
import Profile from "@/pages/Profile";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Terms from "@/pages/Terms";
import Contact from "@/pages/Contact";
import Lessons from "@/pages/Lessons";
import LocationTest from "@/pages/LocationTest";
import FinancialAITest from "@/pages/FinancialAITest";
import FinancialAssistant from "@/pages/FinancialAssistant";
import VerifyEmail from "@/pages/VerifyEmail";
import ResendVerification from "@/pages/ResendVerification";
import CurrencyConverter from "@/pages/CurrencyConverter";
import RemoveWatermark from "@/components/RemoveWatermark";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { CookieBanner } from "@/components/layout/CookieBanner";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import faviconPath from "@/assets/favicon-pastel.svg";
import { queryClient } from "@/lib/queryClient";
import { updateMetaTags } from "@/utils/seo";
import { useTwitterTracking } from "@/hooks/useTwitterTracking";

type User = {
  id: number;
  username: string;
  email?: string;
  displayName?: string;
  level: number;
  points: number;
  streak: number;
  onboardingCompleted: boolean;
  isPremium?: boolean;
  isEmailVerified?: boolean;
};

// Custom queryFn that returns null on 401 (anonymous user) instead of throwing
const authQueryFn = async (): Promise<User | null> => {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (res.status === 401) {
      return null;
    }
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch {
    return null;
  }
};

// Auth page component that shows both login and signup forms
function AuthPage() {
  const [showLogin, setShowLogin] = useState(true);
  const { data: currentUser, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: authQueryFn,
    retry: false,
    staleTime: 30000,
  });
  const [, setLocation] = useLocation();

  // Handle URL parameters for showing login or signup forms
  useEffect(() => {
    // If we were redirected after logout, make sure we show login form
    if (window.location.search.includes("from=logout")) {
      setShowLogin(true);
    }
    
    // If the URL has a show=signup parameter, show the signup form
    if (window.location.search.includes("show=signup")) {
      setShowLogin(false);
    }
  }, []);
  
  // If already logged in, redirect to dashboard immediately using window.location.href
  useEffect(() => {
    if (!isLoading && currentUser) {
      console.log("Already authenticated, redirecting to dashboard");
      window.location.href = "/dashboard";
    }
  }, [currentUser, isLoading]);

  // Brief loading screen while checking auth status
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="mb-6">
          <div className="text-center">
            <span className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-primary">
              savyfunds<span className="align-super text-xs md:text-sm">™</span>
            </span>
          </div>
        </div>
        <div className="inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="mt-4 text-slate-500">Checking account status...</div>
      </div>
    );
  }
  
  // If the user is logged in, they'll be redirected by the effect above
  // Otherwise, show the auth form
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Simplified header with no container that would conflict with Navbar */}
      <div className="py-6 px-4 text-center">
        <Link href="/" className="inline-flex items-center">
          <span className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-primary">
            savyfunds<span className="align-super text-xs md:text-sm">™</span>
          </span>
        </Link>
      </div>
      
      <div className="flex-1 max-w-screen-xl mx-auto py-4 px-4 md:px-8 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          <div>
            {showLogin ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold">Welcome back</h1>
                  <p className="text-muted-foreground">
                    Enter your credentials to access your account
                  </p>
                </div>
                <Login />
                
                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground inline-block mr-2">
                    Don't have an account?{" "}
                  </p>
                  <button
                    onClick={() => setShowLogin(false)}
                    className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-4 py-1 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold">Create an account</h1>
                  <p className="text-muted-foreground">
                    Enter your information to create an account and start your financial journey
                  </p>
                </div>
                <SignUp />
                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground inline-block mr-2">
                    Already have an account?{" "}
                  </p>
                  <button
                    onClick={() => setShowLogin(true)}
                    className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-4 py-1 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  >
                    Login
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="bg-muted rounded-lg p-6 lg:p-8">
            <div className="space-y-4">
              <h2 className="text-xl lg:text-2xl font-bold">Your Path to Financial Freedom</h2>
              <p className="text-sm lg:text-base">
                Join savyfunds and start your journey toward financial literacy and independence.
                Our platform provides personalized learning, budgeting tools, and a supportive
                community to help you achieve your financial goals.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm lg:text-base">
                  <span className="mr-2 text-primary">✓</span> Personalized learning paths
                </li>
                <li className="flex items-center text-sm lg:text-base">
                  <span className="mr-2 text-primary">✓</span> Interactive budgeting tools
                </li>
                <li className="flex items-center text-sm lg:text-base">
                  <span className="mr-2 text-primary">✓</span> Goal tracking and rewards
                </li>
                <li className="flex items-center text-sm lg:text-base">
                  <span className="mr-2 text-primary">✓</span> Community support
                </li>
              </ul>
              
              {/* Industry Acknowledgement */}
              <div className="pt-4 mt-4 border-t border-border">
                <h3 className="text-lg font-semibold mb-3 text-neutral-800">
                  Powered by Industry Innovation
                </h3>
                <p className="text-xs lg:text-sm text-muted-foreground mb-4">
                  We extend our gratitude to industry leaders like American Express, Visa, Mastercard, 
                  and Discover for their continued innovation in advancing the financial landscape.
                </p>
                
                {/* Company Logos - Simplified for smaller space */}
                <div className="flex flex-wrap items-center justify-center gap-4 opacity-60 mb-3">
                  {/* American Express */}
                  <div className="h-8 w-20 flex items-center justify-center">
                    <svg viewBox="0 0 100 40" className="h-full w-full" fill="currentColor">
                      <rect x="5" y="15" width="90" height="15" rx="3" fill="#2557A5" opacity="0.8"/>
                      <text x="50" y="26" textAnchor="middle" className="text-xs font-bold fill-white">
                        AMEX
                      </text>
                    </svg>
                  </div>
                  
                  {/* Visa */}
                  <div className="h-8 w-16 flex items-center justify-center">
                    <svg viewBox="0 0 60 40" className="h-full w-full" fill="currentColor">
                      <text x="30" y="25" textAnchor="middle" className="text-sm font-bold fill-blue-700">
                        VISA
                      </text>
                    </svg>
                  </div>
                  
                  {/* Mastercard */}
                  <div className="h-8 w-20 flex items-center justify-center">
                    <svg viewBox="0 0 80 40" className="h-full w-full">
                      <circle cx="25" cy="20" r="8" fill="#ff5f00" opacity="0.8"/>
                      <circle cx="35" cy="20" r="8" fill="#eb001b" opacity="0.8"/>
                      <text x="40" y="35" textAnchor="middle" className="text-xs font-semibold fill-neutral-600">
                        MC
                      </text>
                    </svg>
                  </div>
                  
                  {/* Plus more indicator */}
                  <div className="h-8 w-16 flex items-center justify-center">
                    <span className="text-neutral-400 font-medium text-xs">+ more</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t border-border">
                <p className="text-xs lg:text-sm text-muted-foreground italic">
                  Sign up or login to access our premium resources, learning materials, and financial tools.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  // Initialize Twitter tracking
  useTwitterTracking();
  
  // Simple app initialization - no background checks that could cause loops
  const [location] = useLocation();
  
  // Get user data for navbar and authentication
  const { data: currentUser, isLoading: userLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: authQueryFn,
    retry: false,
    staleTime: 30000,
  });

  // Update SEO meta tags based on route and authentication status
  useEffect(() => {
    updateMetaTags(location, !!currentUser);
  }, [location, currentUser]);
  
  // Logout mutation
  const [, setLocation] = useLocation();
  
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        // First clear user data from cache immediately
        queryClient.setQueryData(["/api/auth/me"], null);
        
        // Then call the logout API
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        
        if (!response.ok) {
          console.error("Logout API failed");
        }
        
        return response.json();
      } catch (error) {
        console.error("Error during logout:", error);
        return { success: false };
      }
    },
    onSettled: () => {
      // Always redirect to auth page, regardless of success or failure
      // This uses direct window.location rather than wouter's setLocation to ensure a fresh page load
      window.location.href = "/auth";
    }
  });
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Add console log to help with debugging
  console.log("savyfunds - " + new Date().toISOString());
  
  // Remove dark mode completely
  useEffect(() => {
    // Always use light mode
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }, []);
  
  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      {/* Removed accessibility skip link as requested */}
      
      {/* Remove Replit watermark */}
      <RemoveWatermark />
      
      {/* Navbar with authentication state - don't show on auth pages or landing */}
      {location !== '/auth' && location !== '/landing' && (
        <Navbar 
          user={currentUser ? {
            id: currentUser.id,
            username: currentUser.username,
            displayName: currentUser.displayName || currentUser.username,
            level: currentUser.level,
            isPremium: currentUser.isPremium || false,
          } : null}
          onLogout={handleLogout}
        />
      )}
      
      <main id="main-content" tabIndex={-1} className="outline-none pt-20 md:pt-24 lg:pt-28 pb-16">
        <Switch>
          <Route path="/auth">
            <AuthPage />
          </Route>
          {/* Redirect /signup to /auth with the signup form showing */}
          <Route path="/signup">
            <Redirect to="/auth?show=signup" />
          </Route>
          <Route path="/landing">
            <LandingPage />
          </Route>
          <Route path="/about">
            <AboutUs />
          </Route>
          <Route path="/mission">
            <OurMission />
          </Route>
          <Route path="/privacy-policy">
            <PrivacyPolicy />
          </Route>
          <Route path="/terms">
            <Terms />
          </Route>
          <Route path="/contact">
            <Contact />
          </Route>
          <Route path="/currency-converter">
            <CurrencyConverter />
          </Route>
          {/* Redirect from /lessons to /learn since we've merged the content */}
          <Route path="/lessons">
            <Redirect to="/learn" />
          </Route>
          <Route path="/dashboard">
            <Dashboard />
          </Route>
          <Route path="/learn">
            <Learn />
          </Route>
          <Route path="/budget">
            <Budget />
          </Route>
          <Route path="/goals">
            <Goals />
          </Route>
          <Route path="/community">
            <Community />
          </Route>
          <Route path="/module/:id">
            <ModuleDetails />
          </Route>
          <Route path="/onboarding">
            <Onboarding />
          </Route>
          <Route path="/premium">
            <Premium />
          </Route>
          <Route path="/knowledge">
            <Knowledge />
          </Route>
          <Route path="/knowledge/:id">
            <KnowledgeArticle />
          </Route>
          <Route path="/profile">
            <Profile />
          </Route>
          {/* Location test page hidden in production */}
          {process.env.NODE_ENV !== 'production' && (
            <Route path="/location-test">
              <LocationTest />
            </Route>
          )}
          
          <Route path="/financial-ai-test">
            <FinancialAITest />
          </Route>
          <Route path="/financial-assistant">
            <FinancialAssistant />
          </Route>
          <Route path="/verify-email">
            <VerifyEmail />
          </Route>
          <Route path="/resend-verification">
            <ResendVerification />
          </Route>
          <Route path="/">
            {/* Marketing landing page for visitors; logged-in users go straight to the app */}
            {currentUser ? <Redirect to="/dashboard" /> : <LandingPage />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
      
      {/* Add the Footer component if on pages that should have it */}
      {location !== "/dashboard" && 
       location !== "/profile" && 
       location !== "/auth" &&
       !location.includes("/module/") && 
       !location.includes("/knowledge/") && (
        <Footer />
      )}
      
      {/* Cookie consent banner */}
      <CookieBanner />
      
      <Toaster />
    </div>
  );
}

export default App;