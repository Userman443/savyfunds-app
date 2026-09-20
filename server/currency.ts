import axios from 'axios';
import { LocationInfo } from './location';

// Cache exchange rates to reduce API calls
interface ExchangeRateCache {
  timestamp: number;
  rates: Record<string, number>;
  base: string;
}

let exchangeRateCache: ExchangeRateCache | null = null;
const CACHE_EXPIRY = 86400000; // 24 hours in milliseconds

/**
 * Convert amount from USD to target currency
 * @param amount Amount in USD
 * @param targetCurrency Currency code to convert to (e.g., 'EUR', 'GBP')
 * @returns Converted amount in target currency
 */
export async function convertCurrency(amount: number, targetCurrency: string): Promise<number> {
  // If target is USD, no conversion needed
  if (targetCurrency === 'USD') {
    return amount;
  }

  try {
    const rates = await getExchangeRates();
    // Check if we have a conversion rate for this currency
    if (!rates[targetCurrency]) {
      console.error(`No conversion rate available for ${targetCurrency}, using default rate`);
      
      // Add specific fallback for common currencies if missing
      if (targetCurrency === 'GBP') {
        // Current GBP/USD exchange rate (roughly)
        return amount * 0.79;
      } else if (targetCurrency === 'EUR') {
        return amount * 0.92;
      }
    }
    
    const rate = rates[targetCurrency] || 1;
    const convertedAmount = amount * rate;
    
    // Log the conversion for debugging
    console.log(`Converting ${amount} USD to ${targetCurrency} at rate ${rate} = ${convertedAmount}`);
    
    return convertedAmount;
  } catch (error) {
    console.error(`Error converting currency to ${targetCurrency}:`, error);
    
    // Special case for London users
    if (targetCurrency === 'GBP') {
      // Use a fallback rate for GBP
      console.log(`Using fallback conversion for GBP: ${amount} USD to ${amount * 0.79} GBP`);
      return amount * 0.79;
    }
    
    return amount; // Return original amount on error
  }
}

/**
 * Format a number as currency using the appropriate currency symbol and format
 * @param amount The amount to format
 * @param locationInfo Location information containing currency details
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, locationInfo: LocationInfo): string {
  const { currencyCode, currencySymbol } = locationInfo;
  
  // Create a formatter based on currency code and user's locale
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    return formatter.format(amount);
  } catch (error) {
    // Fallback formatting if Intl API fails
    const formattedAmount = amount.toFixed(2);
    return `${currencySymbol}${formattedAmount}`;
  }
}

/**
 * Get exchange rates, using cached values if available and not expired
 * @returns Object with currency codes and their exchange rates
 */
async function getExchangeRates(): Promise<Record<string, number>> {
  // Check if we have valid cached rates
  const now = Date.now();
  if (exchangeRateCache && (now - exchangeRateCache.timestamp < CACHE_EXPIRY)) {
    return exchangeRateCache.rates;
  }

  // If we have a RapidAPI key, use it
  if (process.env.RAPIDAPI_KEY) {
    try {
      const response = await axios.get('https://currency-exchange.p.rapidapi.com/exchange', {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'currency-exchange.p.rapidapi.com'
        },
        params: {
          from: 'USD',
          to: 'EUR' // We'll make multiple calls for different currencies
        }
      });

      // Set up basic exchange rates (this would be expanded with real API data)
      exchangeRateCache = {
        timestamp: now,
        base: 'USD',
        rates: {
          'USD': 1,
          'EUR': response.data,
          // Other currency rates would be populated from additional API calls
        }
      };

      return exchangeRateCache.rates;
    } catch (error) {
      console.error('Error fetching exchange rates from API:', error);
    }
  }

  // Fallback to approximate static rates if API call fails or no API key
  console.log('Using fallback exchange rates');
  exchangeRateCache = {
    timestamp: now,
    base: 'USD',
    rates: {
      // Major world currencies
      'USD': 1.0,
      'EUR': 0.92,
      'GBP': 0.79,
      'CAD': 1.36,
      'AUD': 1.51,
      'JPY': 151.72,
      'CNY': 7.24,
      'INR': 83.52,
      'MXN': 16.79,
      'BRL': 5.06,
      'ZAR': 18.41,
      'SGD': 1.35,
      'CHF': 0.91,
      'SEK': 10.65,
      'NOK': 10.78,
      'DKK': 6.85,
      'KRW': 1370.55,
      'NZD': 1.65,
      'RUB': 92.22,
      
      // African currencies (approximate rates - May 2025)
      'NGN': 1550.00,   // Nigerian Naira
      'EGP': 48.50,     // Egyptian Pound
      'KES': 131.25,    // Kenyan Shilling
      'GHS': 15.45,     // Ghanaian Cedi
      'ETB': 57.10,     // Ethiopian Birr
      'TZS': 2580.00,   // Tanzanian Shilling
      'MAD': 9.95,      // Moroccan Dirham
      'XOF': 605.00,    // West African CFA Franc (Côte d'Ivoire, Senegal)
      'CDF': 2750.00,   // Congolese Franc
      'XAF': 605.00,    // Central African CFA Franc (Cameroon)
      'UGX': 3780.00,   // Ugandan Shilling
      'AOA': 850.00,    // Angolan Kwanza
      'ZMW': 23.65,     // Zambian Kwacha
      'RWF': 1240.00    // Rwandan Franc
    }
  };

  return exchangeRateCache.rates;
}