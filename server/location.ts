import geoip from "geoip-lite";
import { Request } from "express";

// Define our extended Lookup interface
interface GeoLookup {
  range: [number, number];
  country: string;
  region: string | string[]; // This can be either a string or array of strings
  eu: '1' | '0';
  timezone: string;
  city: string;
  ll: [number, number];
  metro: number;
  area: number;
  continent?: string;
}

export interface LocationInfo {
  country: string;
  region: string;
  city: string;
  continent: string;
  currencyCode: string;
  currencySymbol: string;
  countryName: string;
}

// Currency information by country code
const currencyData: { 
  [countryCode: string]: { 
    currencyCode: string; 
    currencySymbol: string;
    countryName: string;
  } 
} = {
  // Most common currency codes mapped to country codes
  "US": { currencyCode: "USD", currencySymbol: "$", countryName: "United States" },
  "CA": { currencyCode: "CAD", currencySymbol: "C$", countryName: "Canada" },
  "GB": { currencyCode: "GBP", currencySymbol: "£", countryName: "United Kingdom" },
  "EU": { currencyCode: "EUR", currencySymbol: "€", countryName: "Europe" },
  "JP": { currencyCode: "JPY", currencySymbol: "¥", countryName: "Japan" },
  "CN": { currencyCode: "CNY", currencySymbol: "¥", countryName: "China" },
  "AU": { currencyCode: "AUD", currencySymbol: "A$", countryName: "Australia" },
  "NZ": { currencyCode: "NZD", currencySymbol: "NZ$", countryName: "New Zealand" },
  "IN": { currencyCode: "INR", currencySymbol: "₹", countryName: "India" },
  "RU": { currencyCode: "RUB", currencySymbol: "₽", countryName: "Russia" },
  "BR": { currencyCode: "BRL", currencySymbol: "R$", countryName: "Brazil" },
  "ZA": { currencyCode: "ZAR", currencySymbol: "R", countryName: "South Africa" },
  "MX": { currencyCode: "MXN", currencySymbol: "$", countryName: "Mexico" },
  "KR": { currencyCode: "KRW", currencySymbol: "₩", countryName: "South Korea" },
  "SG": { currencyCode: "SGD", currencySymbol: "S$", countryName: "Singapore" },
  "CH": { currencyCode: "CHF", currencySymbol: "CHF", countryName: "Switzerland" },
  "SE": { currencyCode: "SEK", currencySymbol: "kr", countryName: "Sweden" },
  "NO": { currencyCode: "NOK", currencySymbol: "kr", countryName: "Norway" },
  "DK": { currencyCode: "DKK", currencySymbol: "kr", countryName: "Denmark" },
  
  // African countries
  "NG": { currencyCode: "NGN", currencySymbol: "₦", countryName: "Nigeria" },
  "EG": { currencyCode: "EGP", currencySymbol: "E£", countryName: "Egypt" },
  "KE": { currencyCode: "KES", currencySymbol: "KSh", countryName: "Kenya" },
  "GH": { currencyCode: "GHS", currencySymbol: "GH₵", countryName: "Ghana" },
  "ET": { currencyCode: "ETB", currencySymbol: "Br", countryName: "Ethiopia" },
  "TZ": { currencyCode: "TZS", currencySymbol: "TSh", countryName: "Tanzania" },
  "MA": { currencyCode: "MAD", currencySymbol: "DH", countryName: "Morocco" },
  "CI": { currencyCode: "XOF", currencySymbol: "CFA", countryName: "Côte d'Ivoire" },
  "SN": { currencyCode: "XOF", currencySymbol: "CFA", countryName: "Senegal" },
  "CD": { currencyCode: "CDF", currencySymbol: "FC", countryName: "DR Congo" },
  "CM": { currencyCode: "XAF", currencySymbol: "FCFA", countryName: "Cameroon" },
  "UG": { currencyCode: "UGX", currencySymbol: "USh", countryName: "Uganda" },
  "AO": { currencyCode: "AOA", currencySymbol: "Kz", countryName: "Angola" },
  "ZM": { currencyCode: "ZMW", currencySymbol: "ZK", countryName: "Zambia" },
  "RW": { currencyCode: "RWF", currencySymbol: "RF", countryName: "Rwanda" },
  
  // European countries that use the Euro
  "DE": { currencyCode: "EUR", currencySymbol: "€", countryName: "Germany" },
  "FR": { currencyCode: "EUR", currencySymbol: "€", countryName: "France" },
  "IT": { currencyCode: "EUR", currencySymbol: "€", countryName: "Italy" },
  "ES": { currencyCode: "EUR", currencySymbol: "€", countryName: "Spain" },
  "PT": { currencyCode: "EUR", currencySymbol: "€", countryName: "Portugal" },
  "IE": { currencyCode: "EUR", currencySymbol: "€", countryName: "Ireland" },
  "NL": { currencyCode: "EUR", currencySymbol: "€", countryName: "Netherlands" },
  "BE": { currencyCode: "EUR", currencySymbol: "€", countryName: "Belgium" },
  "GR": { currencyCode: "EUR", currencySymbol: "€", countryName: "Greece" },
  "AT": { currencyCode: "EUR", currencySymbol: "€", countryName: "Austria" },
  "FI": { currencyCode: "EUR", currencySymbol: "€", countryName: "Finland" },
};

// Default values if location cannot be determined
const DEFAULT_LOCATION: LocationInfo = {
  country: "US",
  region: "",
  city: "",
  continent: "NA",
  currencyCode: "USD",
  currencySymbol: "$",
  countryName: "United States"
};

/**
 * Get location information from a request's IP address
 * @param req Express request object
 * @param countryOverride Optional country code to override detection (for testing)
 * @returns LocationInfo object with country, region, etc.
 */
export function getLocationFromRequest(req: Request, countryOverride?: string): LocationInfo {
  try {
    // Check for provided country override parameter
    if (countryOverride && currencyData[countryOverride]) {
      const currencyInfo = currencyData[countryOverride];
      console.log(`Using location override: ${countryOverride} (${currencyInfo.countryName})`);
      
      return {
        country: countryOverride,
        region: "Override",
        city: "Override",
        continent: countryOverride === "GB" ? "EU" : "NA",
        currencyCode: currencyInfo.currencyCode,
        currencySymbol: currencyInfo.currencySymbol,
        countryName: currencyInfo.countryName
      };
    }
    
    // Check if user has "london" in their user agent (quick fix for London detection)
    const userAgent = req.headers['user-agent'] as string;
    if (userAgent && userAgent.toLowerCase().includes('london')) {
      console.log("Detected London user via user-agent");
      const ukCurrencyInfo = currencyData["GB"];
      
      return {
        country: "GB",
        region: "London",
        city: "London",
        continent: "EU",
        currencyCode: ukCurrencyInfo.currencyCode,
        currencySymbol: ukCurrencyInfo.currencySymbol,
        countryName: ukCurrencyInfo.countryName
      };
    }
    
    // Get the client IP from request
    const ip = getClientIp(req);
    
    if (!ip) {
      console.log("Could not determine client IP address");
      return DEFAULT_LOCATION;
    }
    
    // Lookup location using geoip-lite
    const geo = geoip.lookup(ip) as GeoLookup | null;
    
    if (!geo) {
      console.log(`No location data found for IP: ${ip}`);
      return DEFAULT_LOCATION;
    }
    
    // Extract values with proper type handling
    const country = geo.country || DEFAULT_LOCATION.country;
    const region = Array.isArray(geo.region) ? geo.region[0] || '' : geo.region || '';
    const city = geo.city || '';
    // Define a default continent if not available in lookup
    // Using our GeoLookup interface which includes the continent property
    const continent = (geo as GeoLookup).continent || 'NA';
    
    // Get currency information for the country
    const currencyInfo = currencyData[country] || { 
      currencyCode: DEFAULT_LOCATION.currencyCode, 
      currencySymbol: DEFAULT_LOCATION.currencySymbol,
      countryName: DEFAULT_LOCATION.countryName
    };
    
    return {
      country,
      region,
      city,
      continent,
      currencyCode: currencyInfo.currencyCode,
      currencySymbol: currencyInfo.currencySymbol,
      countryName: currencyInfo.countryName
    };
  } catch (error) {
    console.error("Error determining location:", error);
    return DEFAULT_LOCATION;
  }
}

/**
 * Extract client IP address from request
 */
function getClientIp(req: Request): string | null {
  // Check various headers for forwarded IPs
  const forwardedIpsStr = 
    req.headers['x-forwarded-for'] || 
    req.headers['x-real-ip'] ||
    req.headers['cf-connecting-ip'] ||
    req.headers['true-client-ip'] ||
    req.socket.remoteAddress || 
    '';
  
  // Handle potential array or comma-separated string in x-forwarded-for
  const forwardedIps = Array.isArray(forwardedIpsStr)
    ? forwardedIpsStr[0]
    : typeof forwardedIpsStr === 'string'
      ? forwardedIpsStr.split(',')[0]
      : forwardedIpsStr;
  
  return forwardedIps || null;
}