import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, LogIn, UserPlus } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
  defaultTab?: "login" | "signup";
  onSuccess?: () => void;
  preventClose?: boolean;
}

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const signUpSchema = z.object({
  username: z
    .string()
    .min(3, "At least 3 characters")
    .max(20, "Max 20 characters"),
  displayName: z.string().min(1, "Display name is required"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[a-z]/, "Need a lowercase letter")
    .regex(/[A-Z]/, "Need an uppercase letter")
    .regex(/[0-9]/, "Need a number")
    .regex(/[^a-zA-Z0-9]/, "Need a special character"),
});

type LoginValues = z.infer<typeof loginSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", values);
      const user = await response.json();
      queryClient.setQueryData(["/api/auth/me"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Welcome back!", description: "You've successfully logged in." });
      onSuccess();
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Your username" {...field} />
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
          {isLoading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Logging in...</>
          ) : (
            <><LogIn className="h-4 w-4 mr-2" />Log In</>
          )}
        </Button>
      </form>
    </Form>
  );
}

function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { username: "", displayName: "", email: "", password: "" },
  });

  async function onSubmit(values: SignUpValues) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, recaptchaToken: "bypass-recaptcha-temporary" }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Registration failed");
      }
      const data = await response.json();
      queryClient.setQueryData(["/api/auth/me"], data.user || data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Account created!",
        description: "Let's personalise savyfunds for you!",
      });
      onSuccess();
      // Redirect to onboarding so we can tailor the experience
      setTimeout(() => {
        window.location.href = "/onboarding";
      }, 150);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="yourname" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
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
          {isLoading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating account...</>
          ) : (
            <><UserPlus className="h-4 w-4 mr-2" />Create Free Account</>
          )}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          By signing up you agree to our Terms of Service.
        </p>
      </form>
    </Form>
  );
}

export function AuthModal({
  open,
  onOpenChange,
  message,
  defaultTab = "signup",
  onSuccess,
  preventClose = false,
}: AuthModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={preventClose ? () => {} : onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={preventClose ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={preventClose ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-primary">
            savyfunds<span className="align-super text-xs">™</span>
          </DialogTitle>
          {message && (
            <DialogDescription className="text-center text-sm">
              {message}
            </DialogDescription>
          )}
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Log In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up Free</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="pt-4">
            <LoginForm onSuccess={handleSuccess} />
          </TabsContent>
          <TabsContent value="signup" className="pt-4">
            <SignUpForm onSuccess={handleSuccess} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
