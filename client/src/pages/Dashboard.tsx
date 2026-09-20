import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import UserWelcome from "@/components/dashboard/UserWelcome";
import PersonalizedPath from "@/components/dashboard/PersonalizedPath";
import FinancialTools from "@/components/dashboard/FinancialTools";
import EducationalContent from "@/components/dashboard/EducationalContent";
import FinancialAssistant from "@/components/dashboard/FinancialAssistant";
import HelpButton from "@/components/ui/help-button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PersonalizationModal } from "@/components/modals/PersonalizationModal";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Disclaimer } from "@/components/ui/disclaimer";
import { usePageTracking } from "@/hooks/useTwitterTracking";

const DISMISSED_KEY = "sf_quiz_cta_dismissed";

const Dashboard = () => {
  const [showPersonalizationModal, setShowPersonalizationModal] =
    useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [ctaDismissed, setCtaDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      localStorage.getItem(DISMISSED_KEY) === "true" ||
      localStorage.getItem("sf_onboarding_done") === "true"
    );
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading: isLoadingUser } = useQuery<{
    id: number;
    username: string;
    email?: string;
    level: number;
    points: number;
    streak: number;
    onboardingCompleted: boolean;
    displayName?: string;
    isPremium?: boolean;
  } | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 30000,
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.status === 401) {
          return null; // Anonymous user - return null instead of throwing
        }
        if (!res.ok) {
          throw new Error(`Failed to fetch user: ${res.status}`);
        }
        return await res.json();
      } catch {
        return null; // Treat any error as anonymous user
      }
    },
  });

  const {
    data: userProfile,
    isLoading: isLoadingProfile,
    isError: isProfileError,
    error: profileError,
  } = useQuery({
    queryKey: ["/api/user/profile/" + (user?.id || 0)],
    enabled: !!user?.id,
  });

  const createDefaultProfile = async () => {
    if (!user?.id) return;
    try {
      setIsCreatingProfile(true);
      const defaultProfile = {
        userId: user.id,
        age: "18-24 years",
        country: "United States",
        experienceLevel: "Beginner",
        financialGoals: ["Emergency Fund"],
      };
      await apiRequest("POST", "/api/user/profile", defaultProfile);
      await queryClient.invalidateQueries({
        queryKey: ["/api/user/profile/" + user.id],
      });
      toast({
        title: "Profile Created",
        description: "Default profile set. Update it anytime in settings.",
      });
    } catch (error) {
      console.error("Error creating default profile:", error);
      toast({
        title: "Error",
        description: "Profile creation failed. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const logout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    window.location.href = "/signup";
  };

  // Auto-create a default profile whenever needed instead of forcing onboarding
  useEffect(() => {
    if (user?.id && isProfileError && !isCreatingProfile) {
      // Automatically create a default profile without forcing location input
      createDefaultProfile();
    }
  }, [user?.id, isProfileError, isCreatingProfile]);
  
  // Track dashboard page view
  usePageTracking('dashboard', user?.email);
  
  // Removed forced personalization modal - users can access it manually from profile settings

  // Brief loading state only while checking auth
  if (isLoadingUser) {
    return (
      <>
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#A7F3D0] mx-auto mb-4" />
            <h3 className="text-xl font-medium">
              Loading savyfunds™...
            </h3>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Show loading only for logged-in users waiting for profile
  if (user && (isLoadingProfile || isCreatingProfile)) {
    return (
      <>
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#A7F3D0] mx-auto mb-4" />
            <h3 className="text-xl font-medium">
              Loading your savyfunds™ dashboard...
            </h3>
            <p className="text-muted-foreground">Please wait a moment</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (user && isProfileError) {
    return (
      <>
        <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto">
            <h3 className="text-xl font-medium mb-2">Setting Up Your Dashboard</h3>
            <p className="text-muted-foreground mb-6">
              We're automatically creating your financial profile with default settings.
              You can update your preferences anytime in your profile settings.
            </p>
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
              <span>Creating profile...</span>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Anonymous user view - show AI assistant without user-specific features
  if (!user) {
    const anonLevel = typeof window !== "undefined" ? localStorage.getItem("sf_literacy_level") : null;
    const anonDone = typeof window !== "undefined" ? localStorage.getItem("sf_onboarding_done") : null;

    return (
      <>
        <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 page-transition">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">
              Welcome to savyfunds
            </h1>
            <p className="text-muted-foreground">
              Get instant answers to your financial questions - no account required.
            </p>
          </div>
          <div className="space-y-6 sm:space-y-8">
            {/* Onboarding quiz CTA for anonymous users */}
            {!anonDone ? (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-4">
                <div className="text-3xl">🧠</div>
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="font-semibold text-emerald-900">What's your financial literacy level?</h2>
                  <p className="text-sm text-emerald-700 mt-0.5">
                    Take our free 8-question quiz and get a personalized experience — no account needed.
                  </p>
                </div>
                <Button asChild variant="default" className="shrink-0 bg-emerald-700 hover:bg-emerald-800">
                  <Link href="/onboarding">Take the Quiz</Link>
                </Button>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                <div className="text-2xl">✅</div>
                <div>
                  <p className="text-sm font-medium text-emerald-900">
                    You're at <span className="font-bold">{anonLevel}</span> level — content is tailored for you.
                  </p>
                  <button
                    onClick={() => { window.location.href = "/onboarding"; }}
                    className="text-xs text-emerald-600 underline hover:text-emerald-800 mt-0.5"
                  >
                    Retake the assessment
                  </button>
                </div>
              </div>
            )}

            <FinancialTools />
            
            {/* Sign up prompt */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 text-center">
              <h2 className="text-lg font-semibold mb-2">Want personalized financial guidance?</h2>
              <p className="text-muted-foreground mb-4">
                Create a free account to save your favorite answers, get personalized advice, and track your learning progress.
              </p>
              <div className="flex gap-3 justify-center">
                <Button asChild>
                  <Link href="/auth?show=signup">Sign Up Free</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/auth">Log In</Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
        <HelpButton />
      </>
    );
  }

  const profileLevel = (userProfile as any)?.experienceLevel || null;

  return (
    <>
      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 page-transition">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2 md:mb-0">
            Welcome, {user?.username || 'User'}!
          </h1>
          <Button 
            onClick={logout} 
            size="sm"
            className="self-start bg-[#A7F3D0] text-[#4B5563] text-sm"
          >
            Logout
          </Button>
        </div>
        <div className="space-y-6 sm:space-y-8">
          {/* Onboarding assessment prompt for users who haven't completed it */}
          {!user.onboardingCompleted && !ctaDismissed && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-4">
              <div className="text-3xl">🧠</div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="font-semibold text-emerald-900">Complete your financial literacy assessment</h2>
                <p className="text-sm text-emerald-700 mt-0.5">
                  Answer 8 quick questions so we can tailor your dashboard, AI suggestions, and learning path to your exact level.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => {
                    localStorage.setItem(DISMISSED_KEY, "true");
                    setCtaDismissed(true);
                  }}
                  className="text-xs text-emerald-600 underline hover:text-emerald-800 whitespace-nowrap"
                >
                  Skip for now
                </button>
                <Button asChild variant="default" className="bg-emerald-700 hover:bg-emerald-800">
                  <Link href="/onboarding">Take the Quiz</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Level badge for users who completed the assessment */}
          {user.onboardingCompleted && profileLevel && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
              <div className="text-xl">✅</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-900">
                  Your literacy level: <span className="font-bold">{profileLevel}</span> — your content and AI suggestions are tailored accordingly.
                </p>
              </div>
              <button
                onClick={() => { window.location.href = "/onboarding"; }}
                className="text-xs text-emerald-600 underline hover:text-emerald-800 whitespace-nowrap"
              >
                Retake
              </button>
            </div>
          )}

          <UserWelcome />
          <FinancialAssistant />
          <FinancialTools />
        </div>
      </main>
      <Footer />
      <HelpButton />
      {showPersonalizationModal && user && (
        <PersonalizationModal
          isOpen={showPersonalizationModal}
          onClose={() => setShowPersonalizationModal(false)}
          userId={user.id}
        />
      )}
    </>
  );
};

export default Dashboard;