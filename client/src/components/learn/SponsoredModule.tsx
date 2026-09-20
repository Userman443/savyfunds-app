import React, { useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface SponsoredModuleProps {
  className?: string;
}

export function SponsoredModule({ className }: SponsoredModuleProps) {
  useEffect(() => {
    // Mock tracking view
    const trackView = async () => {
      try {
        // In a real implementation, this would be a real API call
        // await fetch('/api/sponsor/view', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({
        //     sponsorId: 'chime',
        //     contentId: 'budgeting-101',
        //   }),
        // });
        console.log('Sponsored content view tracked');
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    };

    trackView();
  }, []);

  const handleClick = () => {
    // Track click and redirect in real implementation
    console.log('Sponsored content clicked');
    alert('This would navigate to sponsored content in a real implementation');
  };

  return (
    <Card className={`border border-blue-100 bg-[#F9FAFB] ${className}`}>
      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="bg-primary-50 text-[#2C6E49] border-[#2C6E49]">
            Sponsored
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-3">
          <div className="w-12 h-12 flex-shrink-0 bg-white rounded-full flex items-center justify-center shadow-sm mr-3">
            <img 
              src="https://placehold.co/48x48?text=C" 
              alt="Chime logo" 
              className="w-8 h-8 rounded-full" 
            />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-neutral-800">Budgeting 101</h3>
            <p className="text-sm text-neutral-500">Sponsored by Chime</p>
          </div>
        </div>
        
        <p className="text-neutral-600 mb-4">
          Learn the fundamentals of creating and sticking to a budget that works for your lifestyle. 
          This comprehensive guide will help you track expenses, set realistic goals, and build 
          healthy financial habits.
        </p>
        
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3">
          <div className="flex items-center text-sm text-neutral-500">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium mr-2">Beginner</span>
            <span>20 min</span>
          </div>
          
          <Button 
            className="flex items-center text-sm bg-[#2C6E49] hover:bg-[#26603f]"
            onClick={handleClick}
          >
            Start Learning
            <ExternalLink className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default SponsoredModule;