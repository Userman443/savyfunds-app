import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  
  // Get token from URL query parameters
  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Extract token from the URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        
        if (!token) {
          setStatus("error");
          setMessage("No verification token provided.");
          return;
        }
        
        // Call the API to verify the email
        const response = await apiRequest("GET", `/api/auth/verify-email?token=${token}`);
        const data = await response.json();
        
        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Your email has been verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to verify your email.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred while verifying your email.");
        console.error("Email verification error:", error);
      }
    };
    
    verifyEmail();
  }, []);
  
  // Function to navigate to login or home page
  const goToPage = (page: string) => {
    setLocation(page);
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 shadow-lg">
        <div className="flex flex-col items-center space-y-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Email Verification</h1>
          
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-muted-foreground">Verifying your email...</p>
            </div>
          )}
          
          {status === "success" && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-xl font-medium text-green-500">Verification Successful</p>
              <p className="text-muted-foreground">{message}</p>
              <Button 
                className="w-full mt-4" 
                onClick={() => goToPage("/dashboard")}
              >
                Go to Dashboard
              </Button>
            </div>
          )}
          
          {status === "error" && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <XCircle className="h-16 w-16 text-destructive" />
              <p className="text-xl font-medium text-destructive">Verification Failed</p>
              <p className="text-muted-foreground">{message}</p>
              <div className="flex flex-col space-y-2 w-full">
                <Button 
                  className="w-full" 
                  onClick={() => goToPage("/login")}
                >
                  Go to Login
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={() => goToPage("/resend-verification")}
                >
                  Resend Verification Email
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}