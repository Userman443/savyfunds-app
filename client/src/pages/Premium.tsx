import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HelpButton from "@/components/ui/help-button";
import { PremiumTeaser } from "@/components/premium/PremiumTeaser";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, ArrowLeft, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const Premium = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if user is already premium
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const isPremium = user?.isPremium;
  
  // Simplified safe mutation for premium status
  const updatePremiumMutation = useMutation({
    mutationFn: async (willBePremium: boolean) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiRequest("POST", "/api/user/premium", { isPremium: willBePremium });
        const data = await response.json();
        return { success: true, data };
      } catch (err) {
        console.error("Premium update error:", err);
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
    onSuccess: (result) => {
      if (!result.success) {
        setError(result.error || "Failed to update premium status");
        toast({
          title: "Error updating premium status",
          description: result.error || "Please try again later.",
          variant: "destructive",
        });
        return;
      }
      
      // Invalidate the user query to refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({
        title: isPremium ? "Premium membership canceled" : "Welcome to Premium!",
        description: isPremium 
          ? "Your premium status has been revoked. You can upgrade again anytime."
          : "You now have access to all premium features!",
        variant: isPremium ? "destructive" : "default",
      });
      
      // Redirect to dashboard after a brief delay to show toast
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    },
    onError: (error: any) => {
      console.error("Premium update mutation error:", error);
      setError(typeof error === 'string' ? error : error?.message || "An unexpected error occurred");
      toast({
        title: "Error updating premium status",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });
  
  const handleTogglePremium = () => {
    updatePremiumMutation.mutate(!isPremium);
  };

  if (isPremium) {
    return (
      <>
        <Navbar />
        
        <main className="container mx-auto px-4 md:px-6 py-6 page-transition">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">Premium Membership</h1>
            <p className="text-neutral-600">Your premium features and benefits</p>
          </div>
          
          <Card className="mb-8 bg-primary-50 border-primary-200">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-primary-800">You're a Premium Member!</h2>
                <p className="text-neutral-600 max-w-lg mb-6">
                  Thank you for supporting savyfunds™. You now have access to all premium features including the stock playground, advanced calculators, premium challenges, and an ad-free experience.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button 
                    className="bg-primary-600 hover:bg-primary-700"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    Explore Premium Features
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={handleTogglePremium}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Cancel Premium'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-neutral-800">Your Premium Benefits</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600">
                        <path d="m3 11 18-5v12L3 14v-3z"></path>
                        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>
                      </svg>
                    </div>
                    <h3 className="font-semibold mb-2">Virtual Stock Trading</h3>
                    <p className="text-neutral-600 text-sm">
                      Practice investing with our simulator using demo stocks without risking real money
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600">
                        <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path>
                        <line x1="2" y1="20" x2="2" y2="20"></line>
                      </svg>
                    </div>
                    <h3 className="font-semibold mb-2">Ad-Free Experience</h3>
                    <p className="text-neutral-600 text-sm">
                      Enjoy the platform without any advertisements or interruptions
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                      </svg>
                    </div>
                    <h3 className="font-semibold mb-2">Advanced Financial Tools</h3>
                    <p className="text-neutral-600 text-sm">
                      Access advanced calculators and financial planning tools
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600">
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                        <path d="M4 22h16"></path>
                        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                      </svg>
                    </div>
                    <h3 className="font-semibold mb-2">Premium Challenges</h3>
                    <p className="text-neutral-600 text-sm">
                      Exclusive financial challenges with deeper insights and rewards
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
                        <path d="m9 12 2 2 4-4"></path>
                      </svg>
                    </div>
                    <h3 className="font-semibold mb-2">Priority Support</h3>
                    <p className="text-neutral-600 text-sm">
                      Get faster responses to your questions and concerns
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <path d="M16 13H8"></path>
                        <path d="M16 17H8"></path>
                        <path d="M10 9H8"></path>
                      </svg>
                    </div>
                    <h3 className="font-semibold mb-2">Exclusive Content</h3>
                    <p className="text-neutral-600 text-sm">
                      Access premium learning materials and financial guides
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        
        <Footer />
        <HelpButton />
      </>
    );
  }

  return (
    <>
      <Navbar />
      
      <main className="container mx-auto px-4 md:px-6 py-6 page-transition">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-neutral-600 hover:text-primary-600 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">Upgrade to Premium</h1>
          <p className="text-neutral-600">Unlock advanced features to boost your financial literacy journey</p>
        </div>
        
        <PremiumTeaser className="mb-8" />
        
        {/* Upgrade Button and Error Display */}
        <div className="mb-8 flex flex-col items-center">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start max-w-md">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          <Button 
            className="bg-primary-600 hover:bg-primary-700 px-8 py-6 text-lg"
            onClick={handleTogglePremium}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Upgrade to Premium - $2.99/month'
            )}
          </Button>
          <p className="text-neutral-500 text-sm mt-2">Cancel anytime. No credit card required for demo.</p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-neutral-800">Why Our Members Love Premium</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="bg-neutral-50 rounded-lg p-4">
                  <p className="italic text-neutral-600 mb-3">
                    "The stock simulator helped me understand how investing works without risking my own money. Now I feel confident enough to start investing with a small amount of my savings."
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                      <span className="font-medium text-primary-700">M</span>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-800">Miguel S.</p>
                      <p className="text-sm text-neutral-500">Premium member for 3 months</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="bg-neutral-50 rounded-lg p-4">
                  <p className="italic text-neutral-600 mb-3">
                    "The compound interest calculator changed my perspective on saving. I was shocked to see how much my monthly contributions could grow over time!"
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                      <span className="font-medium text-primary-700">T</span>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-800">Taylor K.</p>
                      <p className="text-sm text-neutral-500">Premium member for 1 month</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-neutral-800">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">How does the premium subscription work?</h3>
                <p className="text-neutral-600">
                  Once you subscribe, you'll immediately gain access to all premium features including the stock playground, advanced financial tools, and premium challenges. You can choose between a monthly subscription ($2.99/month) or an annual subscription ($24.99/year) which saves you over 30%.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Can I cancel my subscription anytime?</h3>
                <p className="text-neutral-600">
                  Yes, you can cancel your subscription at any time. You'll continue to have access to premium features until the end of your current billing period.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Is my payment information secure?</h3>
                <p className="text-neutral-600">
                  Absolutely. We use industry-standard encryption and secure payment processors to ensure your financial information is always protected. We never store your full credit card details on our servers.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">What's included in the premium plan?</h3>
                <p className="text-neutral-600">
                  Premium members get access to our virtual stock trading simulator, advanced financial calculators, premium educational challenges, exclusive content, priority support, and an ad-free experience.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
      <HelpButton />
    </>
  );
};

export default Premium;