import { useEffect } from 'react';

/**
 * Component to remove the Replit watermark from the application
 * This uses JavaScript to remove the elements from the DOM
 */
const RemoveWatermark = () => {
  useEffect(() => {
    // Function to remove Replit watermark elements
    const removeWatermarks = () => {
      // Select elements by their attributes
      const possibleSelectors = [
        // By attributes containing replit
        'a[href*="replit.com"]',
        'iframe[src*="replit.com"]',
        'div[class*="replit"]',
        '[class*="replit"]',
        '[id*="replit"]',
        '[class*="watermark"]',
        // Look for common patterns in class names
        '.replit-badge',
        '.replit-watermark',
        '.watermark',
        // General watermark container patterns
        '[class*="badge"]',
        '.badge',
        '.badge-container'
      ];

      // Combine all selectors for a thorough search
      const allSelectors = possibleSelectors.join(', ');
      
      // Find and remove all matching elements
      const watermarks = document.querySelectorAll(allSelectors);
      watermarks.forEach(element => {
        element.remove();
      });
    };

    // Run immediately
    removeWatermarks();

    // Set an interval to continuously check for and remove watermarks
    // (in case they're dynamically added after the page loads)
    const interval = setInterval(removeWatermarks, 1000);

    // Clean up interval when component unmounts
    return () => clearInterval(interval);
  }, []);

  // This component doesn't render anything
  return null;
};

export default RemoveWatermark;