import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export interface LocationInfo {
  country: string;
  region: string;
  city: string;
  continent: string;
  currencyCode: string;
  currencySymbol: string;
  countryName: string;
}

/**
 * Hook to get user's location information based on their IP address
 * @returns Location information and query status
 */
export function useLocation() {
  const { 
    data: location, 
    isLoading, 
    error 
  } = useQuery<LocationInfo>({
    queryKey: ["/api/user/location"],
    queryFn: getQueryFn<LocationInfo>(),
    // Only fetch once and keep the data
    staleTime: Infinity
  });
  
  // Log location information when it changes
  if (location) {
    console.log("Location detected:", location);
  }
  
  if (error) {
    console.error("Error detecting location:", error);
  }
  
  return {
    location,
    isLoading,
    error
  };
}

/**
 * Convert an amount from USD to the user's local currency and format it
 * @param amount Amount in USD
 * @param location User's location information (if known)
 * @returns Formatted amount string with currency symbol
 */
export function useLocalCurrency() {
  const { location, isLoading } = useLocation();
  
  /**
   * Format a numeric amount using the user's local currency format
   * @param amount The amount to format (in the user's local currency)
   * @returns A formatted string with the appropriate currency symbol
   */
  const formatLocalCurrency = (amount: number) => {
    if (isLoading || !location) {
      // Default formatting if location is not available
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    }
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: location.currencyCode,
      }).format(amount);
    } catch (error) {
      // Fallback if there's an error with the formatter
      return `${location.currencySymbol}${amount.toFixed(2)}`;
    }
  };
  
  /**
   * Convert a USD amount to the user's local currency and format it
   * @param usdAmount Amount in USD
   * @returns A promise that resolves to the formatted local currency amount
   */
  const convertAndFormatCurrency = async (usdAmount: number) => {
    if (isLoading || !location) {
      console.log('Currency conversion: Location not available, using USD');
      return `$${usdAmount.toFixed(2)}`;
    }
    
    // Special handling for London/UK users
    const isUK = location.country === 'GB';
    if (isUK) {
      console.log('UK user detected, ensuring GBP conversion');
    }
    
    try {
      console.log(`Converting ${usdAmount} USD to ${location.currencyCode} for ${location.countryName} user`);
      
      // Add country identification info to request headers for debugging
      const response = await fetch('/api/currency/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Country': location.country,
          'X-Client-Currency': location.currencyCode
        },
        body: JSON.stringify({
          amount: usdAmount,
          targetCurrency: location.currencyCode,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Currency conversion API error:', errorText);
        throw new Error(`Currency conversion failed: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Currency conversion result:', result);
      
      // Special handling for UK users - force GBP if needed
      if (isUK && result.targetCurrency !== 'GBP') {
        console.warn('UK user received non-GBP currency, applying manual conversion');
        const gbpAmount = usdAmount * 0.79; // Approximate GBP conversion
        return `£${gbpAmount.toFixed(2)}`;
      }
      
      return result.formattedAmount;
    } catch (error) {
      console.error('Error converting currency:', error);
      
      // Special handling for UK users when conversion fails
      if (isUK) {
        const gbpAmount = usdAmount * 0.79; // Approximate GBP conversion
        console.log('Using fallback GBP conversion for UK user');
        return `£${gbpAmount.toFixed(2)}`;
      }
      
      return formatLocalCurrency(usdAmount);
    }
  };
  
  return {
    location,
    isLoading,
    formatLocalCurrency,
    convertAndFormatCurrency,
    currencyCode: location?.currencyCode || 'USD',
    currencySymbol: location?.currencySymbol || '$',
    country: location?.countryName || 'United States',
  };
}