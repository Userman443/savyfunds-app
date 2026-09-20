import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft, RefreshCw, TrendingUp, Globe, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type CurrencyRates = {
  base: string;
  date: string;
  rates: Record<string, number>;
};

type CurrencyList = Record<string, string>;

export default function CurrencyConverter() {
  const [amount, setAmount] = useState<string>("1");
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [toCurrency, setToCurrency] = useState<string>("EUR");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data: currencyList, isLoading: isLoadingList } = useQuery<CurrencyList>({
    queryKey: ["/api/currency/list"],
    staleTime: 24 * 60 * 60 * 1000,
  });

  const { data: rates, isLoading: isLoadingRates, refetch } = useQuery<CurrencyRates>({
    queryKey: ["/api/currency/rates", fromCurrency],
    staleTime: 5 * 60 * 1000,
  });

  const convertedAmount = rates?.rates[toCurrency] 
    ? (parseFloat(amount) * rates.rates[toCurrency]).toFixed(4)
    : "0";

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const filteredCurrencies = currencyList 
    ? Object.entries(currencyList).filter(([code, name]) => 
        code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const popularCurrencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "MXN"];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
          Currency Converter
        </h1>
        <p className="text-neutral-600 text-lg">
          Real-time exchange rates for currencies worldwide
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="shadow-lg" data-testid="converter-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-primary" />
                Convert Currency
              </CardTitle>
              <CardDescription>
                Enter an amount and select currencies to convert
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="text-lg"
                    data-testid="input-amount"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">From</label>
                  {isLoadingList ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                      <SelectTrigger data-testid="select-from-currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyList && Object.entries(currencyList).map(([code, name]) => (
                          <SelectItem key={code} value={code}>
                            {code} - {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">To</label>
                  {isLoadingList ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select value={toCurrency} onValueChange={setToCurrency}>
                      <SelectTrigger data-testid="select-to-currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyList && Object.entries(currencyList).map(([code, name]) => (
                          <SelectItem key={code} value={code}>
                            {code} - {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSwap}
                  className="rounded-full"
                  data-testid="button-swap"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
              </div>

              <div className="bg-primary/5 rounded-lg p-6 text-center">
                {isLoadingRates ? (
                  <Skeleton className="h-12 w-48 mx-auto" />
                ) : (
                  <>
                    <div className="text-sm text-neutral-500 mb-2">
                      {amount} {fromCurrency} =
                    </div>
                    <div className="text-4xl font-bold text-primary" data-testid="text-result">
                      {convertedAmount} {toCurrency}
                    </div>
                    {rates && (
                      <div className="text-xs text-neutral-400 mt-2">
                        1 {fromCurrency} = {rates.rates[toCurrency]?.toFixed(6)} {toCurrency}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-between items-center text-sm text-neutral-500">
                <span>
                  {rates && `Last updated: ${rates.date}`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetch()}
                  className="gap-1"
                  data-testid="button-refresh"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Exchange Rates from {fromCurrency}
              </CardTitle>
              <CardDescription>
                Current rates for popular currencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRates ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {rates && popularCurrencies
                    .filter(c => c !== fromCurrency && rates.rates[c])
                    .map(currency => (
                      <div
                        key={currency}
                        className="bg-neutral-50 rounded-lg p-3 text-center cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => setToCurrency(currency)}
                        data-testid={`rate-${currency}`}
                      >
                        <div className="font-semibold text-primary">{currency}</div>
                        <div className="text-lg font-bold">
                          {rates.rates[currency]?.toFixed(4)}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                All Currencies
              </CardTitle>
              <CardDescription>
                {currencyList ? Object.keys(currencyList).length : 0} currencies available
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search currencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-currency"
                />
              </div>

              <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2">
                {isLoadingList ? (
                  [...Array(20)].map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))
                ) : (
                  filteredCurrencies.map(([code, name]) => (
                    <div
                      key={code}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        fromCurrency === code || toCurrency === code
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-neutral-50 hover:bg-neutral-100"
                      }`}
                      onClick={() => {
                        if (fromCurrency !== code) {
                          setToCurrency(code);
                        }
                      }}
                      data-testid={`currency-item-${code}`}
                    >
                      <div className="font-semibold">{code}</div>
                      <div className="text-sm text-neutral-500 truncate">{name}</div>
                      {rates?.rates[code] && fromCurrency !== code && (
                        <div className="text-xs text-primary mt-1">
                          1 {fromCurrency} = {rates.rates[code].toFixed(4)} {code}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6 bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-2">About Exchange Rates</h3>
          <p className="text-neutral-600 text-sm">
            Exchange rates are provided by the European Central Bank and are updated daily. 
            These rates are for informational purposes only and may differ from actual market rates. 
            For financial transactions, please consult with your bank or financial institution.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
