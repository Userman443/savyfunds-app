import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocalCurrency } from '@/hooks/use-location';

export default function LocationTest() {
  const { 
    location, 
    isLoading, 
    formatLocalCurrency, 
    convertAndFormatCurrency,
    currencyCode,
    currencySymbol,
    country
  } = useLocalCurrency();
  
  const [isUK, setIsUK] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [conversionResults, setConversionResults] = useState<{
    amount: number;
    formatted: string;
    converted?: string;
  }>({
    amount: 100,
    formatted: '$100.00'
  });

  // Simulate currency conversion for different locations
  const testLocations = [
    { name: 'United States', code: 'US', currency: 'USD', symbol: '$' },
    { name: 'United Kingdom', code: 'GB', currency: 'GBP', symbol: '£' },
    { name: 'Europe/Germany', code: 'DE', currency: 'EUR', symbol: '€' },
    { name: 'Canada', code: 'CA', currency: 'CAD', symbol: 'C$' },
    { name: 'Australia', code: 'AU', currency: 'AUD', symbol: 'A$' },
    { name: 'Japan', code: 'JP', currency: 'JPY', symbol: '¥' }
  ];
  
  useEffect(() => {
    if (location) {
      setCurrentLocation(location);
      setIsUK(location.country === 'GB');
    }
  }, [location]);
  
  useEffect(() => {
    // Format the amount using current location info
    const formatted = formatLocalCurrency(conversionResults.amount);
    setConversionResults(prev => ({ ...prev, formatted }));
    
    // Also convert from USD if we have a location
    if (location) {
      convertAndFormatCurrency(conversionResults.amount)
        .then(converted => {
          setConversionResults(prev => ({ ...prev, converted }));
        });
    }
  }, [location, conversionResults.amount, formatLocalCurrency, convertAndFormatCurrency]);
  
  // Function to make API call with country override
  const setLocationOverride = async (countryCode: string) => {
    try {
      const response = await fetch('/api/user/location', {
        headers: {
          'X-Country-Override': countryCode,
        }
      });
      
      if (response.ok) {
        const locationData = await response.json();
        setCurrentLocation(locationData);
        setIsUK(locationData.country === 'GB');
        
        // Reload page to apply location changes
        window.location.reload();
      }
    } catch (error) {
      console.error('Error setting location override:', error);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Location & Currency Test</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Current Location</CardTitle>
            <CardDescription>
              This is the location detected by our system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Detecting your location...</p>
            ) : currentLocation ? (
              <div className="space-y-2">
                <p><strong>Country:</strong> {currentLocation.countryName} ({currentLocation.country})</p>
                <p><strong>City/Region:</strong> {currentLocation.city || 'Unknown'} / {currentLocation.region || 'Unknown'}</p>
                <p><strong>Currency:</strong> {currentLocation.currencyCode} ({currentLocation.currencySymbol})</p>
                
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <h3 className="font-medium mb-2">Currency Conversion Test:</h3>
                  <p className="mb-1">Original Amount (USD): ${conversionResults.amount}</p>
                  <p className="mb-1">Local Format: {conversionResults.formatted}</p>
                  {conversionResults.converted && (
                    <p className="mb-1">Converted: {conversionResults.converted}</p>
                  )}
                </div>
              </div>
            ) : (
              <p>Could not detect your location</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              onClick={() => setConversionResults(prev => ({ ...prev, amount: prev.amount + 50 }))}
              variant="outline"
            >
              Increase Amount
            </Button>
            
            <Button 
              onClick={() => window.location.reload()}
              variant="secondary"
            >
              Refresh
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Different Locations</CardTitle>
            <CardDescription>
              Select a location to simulate for testing currency conversion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="us">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="us">US/Default</TabsTrigger>
                <TabsTrigger value="uk">UK/London</TabsTrigger>
                <TabsTrigger value="other">Other</TabsTrigger>
              </TabsList>
              
              <TabsContent value="us">
                <div className="space-y-4">
                  <p>Test with United States location (default)</p>
                  <Button onClick={() => setLocationOverride('US')}>
                    Set to US Location
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="uk">
                <div className="space-y-4">
                  <p>Test with United Kingdom (London) location</p>
                  <p className="text-sm text-muted-foreground">
                    This should display British Pounds (£) as the currency
                  </p>
                  <Button onClick={() => setLocationOverride('GB')}>
                    Set to UK Location
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="other">
                <div className="space-y-4">
                  <p>Choose other locations to test:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {testLocations.filter(loc => loc.code !== 'US' && loc.code !== 'GB').map(location => (
                      <Button 
                        key={location.code}
                        variant="outline"
                        onClick={() => setLocationOverride(location.code)}
                      >
                        {location.name} ({location.currency})
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Note: After changing location, the page will reload to apply the changes.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}