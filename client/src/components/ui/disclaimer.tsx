import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from "@/lib/utils";

interface DisclaimerProps {
  className?: string;
  compact?: boolean;
}

export function Disclaimer({ className, compact = false }: DisclaimerProps) {
  return (
    <div className={cn(
      "bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800",
      compact ? "text-xs" : "text-sm",
      className
    )}>
      <div className="flex items-start gap-2">
        <AlertTriangle className={cn(
          "text-amber-500 flex-shrink-0",
          compact ? "h-4 w-4 mt-0.5" : "h-5 w-5"
        )} />
        <div>
          <p className="font-medium">Disclaimer</p>
          <p className={compact ? "mt-0.5" : "mt-1"}>
            Savyfunds is not a financial adviser or a lawyer. The information provided is for educational purposes only.
            Please consult with qualified financial or legal professionals regarding your specific circumstances.
          </p>
        </div>
      </div>
    </div>
  );
}

export function DisclaimerMinimal({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-neutral-500 italic", className)}>
      Disclaimer: savyfunds is not a financial adviser or a lawyer. Please consult with qualified professionals regarding your specific circumstances.
    </p>
  );
}