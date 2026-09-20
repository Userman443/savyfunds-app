import { useEffect } from 'react';
import { initTwitterTracking, trackPageView } from '@/lib/twitter-tracking';

/**
 * Custom hook for Twitter conversion tracking
 */
export const useTwitterTracking = () => {
  useEffect(() => {
    // Initialize Twitter tracking - pixel loaded via HTML head with ID 'pyrld'
    initTwitterTracking('pyrld');
  }, []);

  return {
    trackPageView,
  };
};

/**
 * Hook for tracking page visits
 */
export const usePageTracking = (pageName: string, userEmail?: string) => {
  useEffect(() => {
    // Track page view when component mounts
    trackPageView(pageName, userEmail);
  }, [pageName, userEmail]);
};