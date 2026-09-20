import React, { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AdBannerProps {
  className?: string;
}

export function AdBanner({ className }: AdBannerProps) {
  const [visible, setVisible] = useState(false);
  
  // Check if user is premium
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const isPremium = user?.isPremium;
  
  // Skip rendering for premium users
  if (isPremium) {
    return null;
  }
  
  // Fade in effect for the ad
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const trackAdClick = () => {
    // In a real implementation, this would track ad clicks
    console.log("Ad clicked");
    // Could make an API call to track clicks: fetch('/api/ads/click', {method: 'POST'})
  };
  
  return (
    <div 
      className={`
        w-full bg-[#A3BFFA] text-[#4B5563] py-3 px-4 rounded-md 
        flex items-center justify-between mb-6
        transition-opacity duration-1000
        ${visible ? 'opacity-10' : 'opacity-0'}
        ${className || ''}
      `}
    >
      <p className="text-sm font-medium flex items-center">
        <span className="bg-white text-xs px-1.5 py-0.5 rounded mr-2">Ad</span>
        Start investing with Robinhood—free stock awaits!
      </p>
      
      <a 
        href="#" 
        className="text-xs flex items-center hover:underline"
        onClick={(e) => {
          e.preventDefault();
          trackAdClick();
          alert("This would link to an advertiser in a real implementation");
        }}
      >
        Learn more
        <ExternalLink className="h-3 w-3 ml-1" />
      </a>
    </div>
  );
}

export default AdBanner;