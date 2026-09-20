import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ResendVerification() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  
  // Function to handle resend verification email request
  const handleResendVerification = async () => {
    if (status === "loading") return;
    
    try {
      setStatus("loading");
      
      // Call the API to resend verification email
      const response = await apiRequest("POST", "/api/auth/resend-verification");
      const data = await response.json();
      
      if (response.ok) {
        setStatus("success");
        setMessage(data.message || "Verification email has been sent!");
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to send verification email.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("An error occurred while sending the verification email.");
      console.error("Resend verification error:", error);
    }
  };
  
  // Navigate back to previous page
  const goBack = () => {
    window.history.back();
  };

  // Go to dashboard
  const goToDashboard = () => {
    setLocation("/dashboard");
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 shadow-lg">
        <div className="flex flex-col items-center space-y-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Resend Verification Email</h1>
          
          {status === "idle" && (
            <div className="flex flex-col items-center justify-center space-y-4 w-full">
              <div className="bg-muted rounded-full p-3">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground">
                {user?.email 
                  ? `We'll send a verification link to ${user.email}` 
                  : "You need to be logged in to resend a verification email."}
              </p>
              
              {user ? (
                user.isEmailVerified ? (
                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-green-500">
                      <CheckCircle className="h-5 w-5" />
                      <p>Your email is already verified!</p>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={goToDashboard}
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={handleResendVerification}
                  >
                    Send Verification Email
                  </Button>
                )
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => setLocation("/login")}
                >
                  Log In
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={goBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          )}
          
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-muted-foreground">Sending verification email...</p>
            </div>
          )}
          
          {status === "success" && (
            <div className="flex flex-col items-center justify-center space-y-4 w-full">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-xl font-medium text-green-500">Email Sent!</p>
              <p className="text-muted-foreground">{message}</p>
              <p className="text-sm text-muted-foreground">
                Please check your inbox and click the verification link we sent you.
                If you don't see the email, check your spam folder.
              </p>
              <Button 
                className="w-full" 
                onClick={goToDashboard}
              >
                Go to Dashboard
              </Button>
            </div>
          )}
          
          {status === "error" && (
            <div className="flex flex-col items-center justify-center space-y-4 w-full">
              <XCircle className="h-16 w-16 text-destructive" />
              <p className="text-xl font-medium text-destructive">Error</p>
              <p className="text-muted-foreground">{message}</p>
              <div className="flex flex-col space-y-2 w-full">
                <Button 
                  className="w-full" 
                  onClick={handleResendVerification}
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={goBack}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}