import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BarChart2, Award } from "lucide-react";

interface DataInsightsOptInProps {
  className?: string;
}

export function DataInsightsOptIn({ className }: DataInsightsOptInProps) {
  const { toast } = useToast();
  const [optedIn, setOptedIn] = useState<boolean>(() => {
    // Check if user has already opted in (stored in localStorage)
    const stored = localStorage.getItem("dataInsightsOptIn");
    return stored === "true";
  });
  const [showThankYou, setShowThankYou] = useState<boolean>(() => {
    return localStorage.getItem("dataInsightsOptIn") === "true";
  });

  const handleOptInToggle = (checked: boolean) => {
    setOptedIn(checked);
  };

  const handleSavePreference = async () => {
    try {
      // Store preference in localStorage
      localStorage.setItem("dataInsightsOptIn", optedIn.toString());
      
      // Mock API call
      // In a real implementation, this would send the preference to the server
      // const response = await fetch('/api/user/insights', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ optedIn })
      // });
      
      // Show toast notification
      toast({
        title: optedIn ? "Data sharing enabled" : "Data sharing disabled",
        description: optedIn 
          ? "Thank you for helping improve savyfunds™!" 
          : "Your preference has been saved",
      });
      
      // Show thank you message if opted in
      setShowThankYou(optedIn);
      
    } catch (error) {
      console.error("Error saving preference:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem saving your preference. Please try again.",
      });
    }
  };

  if (showThankYou) {
    return (
      <Card className={`border-emerald-200 bg-emerald-50 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-start">
            <Award className="h-5 w-5 text-emerald-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-emerald-800">Thanks for sharing anonymized data!</h3>
              <p className="text-sm text-emerald-700 mt-1">
                Your contributions help us improve financial education for everyone.
              </p>
              <Button 
                variant="link" 
                className="text-emerald-700 hover:text-emerald-800 p-0 h-auto mt-1"
                onClick={() => {
                  setShowThankYou(false);
                  setOptedIn(false);
                  localStorage.removeItem("dataInsightsOptIn");
                }}
              >
                Opt out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-neutral-200 ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start">
          <BarChart2 className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-neutral-800">Help improve savyfunds™</h3>
            <p className="text-sm text-neutral-600 mt-1 mb-3">
              Share anonymized usage data to help us enhance the platform for everyone. 
              No personal financial information will be shared.
            </p>
            
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox 
                id="dataOptIn" 
                checked={optedIn}
                onCheckedChange={handleOptInToggle}
              />
              <Label 
                htmlFor="dataOptIn" 
                className="text-sm font-medium cursor-pointer"
              >
                Share anonymized data for rewards
              </Label>
            </div>
            
            <Button 
              size="sm" 
              className="bg-primary-600 hover:bg-primary-700" 
              onClick={handleSavePreference}
            >
              Save preference
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DataInsightsOptIn;