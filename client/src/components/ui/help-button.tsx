import React from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const HelpButton = () => {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="w-12 h-12 rounded-full p-0 shadow-lg"
              aria-label="Get help"
            >
              <HelpCircle className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Need help? Click here</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default HelpButton;
