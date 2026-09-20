import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthModal } from "@/components/auth/AuthModal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// User type definition
type User = {
  id: number;
  username: string;
  email?: string;
  displayName?: string;
  level: number;
  points: number;
  streak: number;
  onboardingCompleted: boolean;
};

// User profile type definition
type UserProfile = {
  id: number;
  userId: number;
  age: string;
  country: string;
  experienceLevel: string;
  financialGoals: string[];
  income?: number;
  createdAt: Date;
  updatedAt: Date;
};

const userProfileSchema = z.object({
  userId: z.number(),
  age: z.string(),
  country: z.string(),
  experienceLevel: z.string(),
  financialGoals: z.array(z.string()),
  income: z.number().optional(),
  email: z.string().email().optional(),
  displayName: z.string().min(1, "Display name is required"),
});

type UserProfileFormValues = z.infer<typeof userProfileSchema>;

const ProfilePage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch current user data
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  // Fetch user profile if user exists
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery<UserProfile>({
    queryKey: ["/api/user/profile/" + (user?.id || 0)],
    enabled: !!user?.id,
  });

  const form = useForm<UserProfileFormValues>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      userId: user?.id || 0,
      age: userProfile?.age || "",
      country: userProfile?.country || "",
      experienceLevel: userProfile?.experienceLevel || "",
      financialGoals: userProfile?.financialGoals || [],
      income: userProfile?.income || undefined,
      email: user?.email || "",
      displayName: user?.displayName || "",
    },
    values: {
      userId: user?.id || 0,
      age: userProfile?.age || "",
      country: userProfile?.country || "",
      experienceLevel: userProfile?.experienceLevel || "",
      financialGoals: userProfile?.financialGoals || [],
      income: userProfile?.income || undefined,
      email: user?.email || "",
      displayName: user?.displayName || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UserProfileFormValues) => {
      setIsSubmitting(true);
      try {
        // Update user display name
        if (data.displayName && data.displayName !== user?.displayName) {
          await apiRequest("PUT", "/api/auth/update", {
            displayName: data.displayName,
            email: data.email,
          });
          
          // Invalidate user data
          queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        }
        
        // If profile exists, update it
        if (userProfile?.id) {
          const profileData = {
            age: data.age,
            country: data.country,
            experienceLevel: data.experienceLevel,
            financialGoals: data.financialGoals,
            income: data.income,
          };
          
          return await apiRequest("PUT", `/api/user/profile/${userProfile.id}`, profileData);
        } 
        // Otherwise create new profile
        else {
          const profileData = {
            userId: user?.id,
            age: data.age,
            country: data.country,
            experienceLevel: data.experienceLevel,
            financialGoals: data.financialGoals,
            income: data.income,
          };
          
          return await apiRequest("POST", "/api/user/profile", profileData);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile/" + user?.id] });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  });

  async function onSubmit(values: UserProfileFormValues) {
    updateProfileMutation.mutate(values);
  }

  if (isLoadingUser || isLoadingProfile) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <h3 className="text-xl font-medium">Loading your profile...</h3>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[70vh]">
          <div className="max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Info className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Your Personal Profile</h2>
              <p className="text-muted-foreground text-sm">
                Sign in or create a free account to access your profile and personalise your financial journey.
              </p>
            </div>
            <AuthModal
              open={true}
              onOpenChange={() => {}}
              defaultTab="signup"
              preventClose={true}
            />
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
          
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="personal">Personal Information</TabsTrigger>
              <TabsTrigger value="financial">Financial Profile</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <TabsContent value="personal">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>
                        Update your personal details and preferences.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your Name" {...field} />
                            </FormControl>
                            <FormDescription>
                              This is how you'll appear to others.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="you@example.com" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormDescription>
                              We'll use this for account recovery and notifications.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="United States">United States</SelectItem>
                                <SelectItem value="Canada">Canada</SelectItem>
                                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                                <SelectItem value="Australia">Australia</SelectItem>
                                <SelectItem value="Germany">Germany</SelectItem>
                                <SelectItem value="India">India</SelectItem>
                                <SelectItem value="Japan">Japan</SelectItem>
                                <SelectItem value="Brazil">Brazil</SelectItem>
                                <SelectItem value="South Africa">South Africa</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              We use this to provide region-specific financial advice.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="financial">
                  <Card>
                    <CardHeader>
                      <CardTitle>Financial Profile</CardTitle>
                      <CardDescription>
                        Update your financial details to get personalized guidance.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age Range</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your age range" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Under 18 years">Under 18 years</SelectItem>
                                <SelectItem value="18-24 years">18-24 years</SelectItem>
                                <SelectItem value="25-34 years">25-34 years</SelectItem>
                                <SelectItem value="35-44 years">35-44 years</SelectItem>
                                <SelectItem value="45-54 years">45-54 years</SelectItem>
                                <SelectItem value="55-64 years">55-64 years</SelectItem>
                                <SelectItem value="65+ years">65+ years</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              This helps us tailor financial advice to your life stage.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="experienceLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Financial Experience Level</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your experience level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Beginner">Beginner - New to financial concepts</SelectItem>
                                <SelectItem value="Intermediate">Intermediate - Understand basic concepts</SelectItem>
                                <SelectItem value="Advanced">Advanced - Experienced with investments</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              This helps us adjust the complexity of our educational content.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="income"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Income (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="3000" 
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormDescription>
                              Helps us provide more accurate budget recommendations.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting || updateProfileMutation.isPending}>
                    {isSubmitting || updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </Tabs>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProfilePage;