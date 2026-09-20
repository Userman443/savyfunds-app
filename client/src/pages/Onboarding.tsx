import { useQuery } from "@tanstack/react-query";
import OnboardingQuestions from "@/components/onboarding/OnboardingQuestions";
import { Loader2 } from "lucide-react";

export default function Onboarding() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Financial Literacy Assessment</h1>
          <p className="text-lg text-muted-foreground mt-2 max-w-xl mx-auto">
            Answer 8 quick questions so we can tailor savyfunds to your exact level —
            whether you're just starting out or already investing.
          </p>
          {!user && (
            <p className="text-sm text-muted-foreground mt-1">
              No account needed — your results will be saved in your browser.
            </p>
          )}
        </div>
        <OnboardingQuestions userId={user?.id} />
      </div>
    </div>
  );
}
