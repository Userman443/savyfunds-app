import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PremiumTeaserProps {
  className?: string;
}

export function PremiumTeaser({ className }: PremiumTeaserProps) {
  const { toast } = useToast();
  const [showMonthly, setShowMonthly] = useState(true);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const handleSubscribe = () => {
    toast({
      title: "Premium subscription",
      description: "This would initiate the payment process in a real implementation",
    });
    
    // In a real implementation, this would redirect to a payment processor
    // window.location.href = '/api/payments/checkout';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly pricing card */}
        <Card className={`border-primary-200 ${showMonthly ? 'ring-2 ring-primary-500' : ''}`}>
          <CardContent className="pt-6">
            <div className="mb-4">
              <Badge variant="outline" className="bg-primary-50 text-primary-700 border-primary-200 mb-2">
                Monthly
              </Badge>
              <h3 className="text-2xl font-bold mb-1">$2.99 <span className="text-sm font-normal text-neutral-500">/month</span></h3>
              <p className="text-neutral-600 text-sm">
                Billed monthly. Cancel anytime.
              </p>
            </div>
            
            <ul className="space-y-2 mb-6">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-neutral-700">Virtual stock playground</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-neutral-700">Ad-free experience</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-neutral-700">Advanced financial calculators</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-neutral-700">Premium learning modules</span>
              </li>
            </ul>
            
            <Button 
              className="w-full bg-primary-600 hover:bg-primary-700"
              onClick={() => {
                setShowMonthly(true);
                handleSubscribe();
              }}
            >
              Subscribe Monthly
            </Button>
          </CardContent>
        </Card>
        
        {/* Annual pricing card */}
        <Card className={`border-primary-200 ${!showMonthly ? 'ring-2 ring-primary-500' : ''}`}>
          <CardContent className="pt-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary-500 text-white text-xs font-medium py-1 px-3 transform rotate-0 translate-x-2 -translate-y-0">
              Save 30%
            </div>
            
            <div className="mb-4">
              <Badge variant="outline" className="bg-primary-50 text-primary-700 border-primary-200 mb-2">
                Annual
              </Badge>
              <h3 className="text-2xl font-bold mb-1">$24.99 <span className="text-sm font-normal text-neutral-500">/year</span></h3>
              <p className="text-neutral-600 text-sm">
                $2.08/month, billed annually. Cancel anytime.
              </p>
            </div>
            
            <ul className="space-y-2 mb-6">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-neutral-700">Virtual stock playground</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-neutral-700">Ad-free experience</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-neutral-700">Advanced financial calculators</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-neutral-700">Premium learning modules</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-neutral-700 font-medium">Priority customer support</span>
              </li>
            </ul>
            
            <Button 
              className="w-full bg-primary-600 hover:bg-primary-700"
              onClick={() => {
                setShowMonthly(false);
                handleSubscribe();
              }}
            >
              Subscribe Annually
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Details section */}
      <div className="border border-neutral-200 rounded-md">
        <button 
          className="w-full flex items-center justify-between p-4 text-left font-medium"
          onClick={() => setIsDetailsOpen(prev => !prev)}
        >
          Premium Features Details
          {isDetailsOpen ? (
            <ChevronUp className="h-5 w-5 text-neutral-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-neutral-500" />
          )}
        </button>
        
        {isDetailsOpen && (
          <div className="p-4 pt-0 border-t border-neutral-200">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Virtual Stock Playground</h4>
                <p className="text-neutral-600 text-sm">
                  Practice investing with our risk-free stock simulator. Buy and sell virtual stocks using real market data to develop your investment strategy without risking real money.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Ad-Free Experience</h4>
                <p className="text-neutral-600 text-sm">
                  Enjoy uninterrupted learning without any advertisements or promotions. Focus entirely on building your financial knowledge and skills.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Advanced Financial Calculators</h4>
                <p className="text-neutral-600 text-sm">
                  Access powerful tools for retirement planning, loan comparisons, investment return projections, and more to make better financial decisions.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Premium Learning Modules</h4>
                <p className="text-neutral-600 text-sm">
                  Unlock advanced learning content covering topics like investment strategies, tax optimization, retirement planning, and more with interactive lessons.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Priority Support</h4>
                <p className="text-neutral-600 text-sm">
                  Get faster responses to your questions and personalized assistance with your financial learning journey (annual plan only).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PremiumTeaser;