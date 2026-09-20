import React from "react";
import { AlertTriangle, Construction } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConstructionBannerProps {
  className?: string;
}

export function ConstructionBanner({ className }: ConstructionBannerProps) {
  return (
    <div 
      className={cn(
        "bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 relative z-10",
        className
      )}
    >
      <div className="flex items-center justify-center">
        <Construction className="h-5 w-5 mr-2" />
        <p className="font-medium">
          <span className="font-bold">Under Construction:</span> This application is currently being refined and improved. Some features may not work as expected.
        </p>
      </div>
    </div>
  );
}

export function FeatureUnderConstructionCard() {
  return (
    <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-yellow-50 text-yellow-800 border-yellow-200 h-full">
      <Construction className="h-12 w-12 mb-4 text-yellow-500" />
      <h3 className="text-lg font-semibold mb-2">Feature Under Development</h3>
      <p className="text-center text-sm">
        We're working hard to bring you this feature soon. Check back later for updates!
      </p>
    </div>
  );
}

export function ApiUnderMaintenanceMessage() {
  return (
    <div className="flex items-center justify-center gap-2 text-amber-600 my-2 p-3 bg-amber-50 rounded-md border border-amber-200">
      <AlertTriangle className="h-5 w-5" />
      <p className="text-sm">Our API services are currently under maintenance. Please try again later.</p>
    </div>
  );
}