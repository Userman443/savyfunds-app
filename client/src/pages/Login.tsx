import { useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LineChart } from "lucide-react";
import { trackTwitterEvent, trackMainConversion } from "@/lib/twitter-tracking";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
}).required();

type LoginValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  async function onSubmit(values: LoginValues) {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", values);
      const user = await response.json();
      
      // Update the cache with the user data
      queryClient.setQueryData(['/api/auth/me'], user);
      
      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Track successful login
      trackTwitterEvent('tw-pyrld-login', {
        contents: [{
          content_type: 'user_login',
          content_id: user.id?.toString(),
          content_name: 'User Login',
          content_price: null,
          num_items: 1,
          content_group_id: 'authentication'
        }],
        status: 'completed',
        conversion_id: `login_${user.id}_${Date.now()}`,
        email_address: user.email || null
      });
      
      // Track main conversion event
      trackMainConversion({
        action: 'login',
        userId: user.id?.toString(),
        email: user.email,
        content: 'User Login'
      });

      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
      
      // Redirect directly to dashboard using window.location for a full page refresh
      window.location.href = "/dashboard";
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid username or password",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <span className="savyfunds-logo-large">
              savyfunds<span className="tm-symbol">™</span>
            </span>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Log in to continue your financial literacy journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Log In"}
              </Button>
            </form>
          </Form>
        </CardContent>

      </Card>
    </div>
  );
}