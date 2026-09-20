import { useState, useEffect } from "react";
import { Link } from "wouter";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Helper function to get cookie by name
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

// Helper function to set a cookie with expiration
function setCookie(name: string, value: string, days: number): void {
  const date = new Date();
  // Set expiration date (365 days)
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  
  // Set a more secure cookie with stronger settings
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax;secure`;
  
  // Store in session storage as a fallback (persists within tab)
  try {
    sessionStorage.setItem(name, value);
  } catch (error) {
    console.error("Failed to store in sessionStorage:", error);
  }
}

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Multi-layer check for cookie consent across storage mechanisms 
    const cookieConsent = getCookie("cookieConsent");
    const sessionConsent = sessionStorage.getItem("cookieConsent");
    const localConsent = localStorage.getItem("cookieConsent");
    
    // Use any available consent value
    const hasConsent = cookieConsent || sessionConsent || localConsent;
    
    // If consent exists in any storage but not in all, sync it
    if (hasConsent) {
      // Ensure the consent value is stored in all locations
      if (!cookieConsent) {
        setCookie("cookieConsent", hasConsent, 365);
      }
      if (!localConsent) {
        localStorage.setItem("cookieConsent", hasConsent);
      }
      if (!sessionConsent) {
        sessionStorage.setItem("cookieConsent", hasConsent);
      }
      return; // Don't show banner if we have consent
    }
    
    // No consent found in any storage, show the banner
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const acceptAll = () => {
    // Store consent in all available storage mechanisms
    const consent = "all";
    
    // Set HTTP cookie with 365 day expiration
    setCookie("cookieConsent", consent, 365);
    
    // Store in localStorage for long-term persistence
    try {
      localStorage.setItem("cookieConsent", consent);
    } catch (e) {
      console.warn("Could not set localStorage consent", e);
    }
    
    // Store in sessionStorage for session persistence
    try {
      sessionStorage.setItem("cookieConsent", consent);
    } catch (e) {
      console.warn("Could not set sessionStorage consent", e);
    }
    
    closeWithAnimation();
  };

  const acceptNecessary = () => {
    // Store consent in all available storage mechanisms
    const consent = "necessary";
    
    // Set HTTP cookie with 365 day expiration
    setCookie("cookieConsent", consent, 365);
    
    // Store in localStorage for long-term persistence
    try {
      localStorage.setItem("cookieConsent", consent);
    } catch (e) {
      console.warn("Could not set localStorage consent", e);
    }
    
    // Store in sessionStorage for session persistence
    try {
      sessionStorage.setItem("cookieConsent", consent);
    } catch (e) {
      console.warn("Could not set sessionStorage consent", e);
    }
    
    closeWithAnimation();
  };

  const closeWithAnimation = () => {
    setIsClosing(true);
    
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 300); // Match the CSS transition duration
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/70 backdrop-blur-sm transition-transform duration-300",
        isClosing ? "translate-y-full" : "translate-y-0"
      )}
    >
      <Card className="max-w-4xl mx-auto border shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">Cookie Consent</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mt-1 -mr-1"
              onClick={closeWithAnimation}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <CardDescription>
            We use cookies to enhance your browsing experience and analyze site traffic.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2 text-sm">
          <p>
            By clicking "Accept All", you consent to our use of cookies for analytics, personalization, and ads.
            We also use essential cookies to make our site work and remember your preferences.
            You can find more details in our{" "}
            <Link href="/privacy-policy">
              <Button variant="link" className="p-0 h-auto text-primary">Privacy Policy</Button>
            </Link>.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={acceptNecessary}
            className="w-full sm:w-auto"
          >
            Accept Necessary
          </Button>
          <Button
            size="sm"
            onClick={acceptAll}
            className="w-full sm:w-auto"
          >
            Accept All
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}