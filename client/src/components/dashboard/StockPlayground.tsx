import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpFromLine, ArrowDownToLine, TrendingUp, Wallet, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Stock {
  id: string;
  name: string;
  ticker: string;
  price: number;
  previousPrice: number;
  change: number;
  changePercent: number;
}

interface Portfolio {
  cash: number;
  stocks: {
    [key: string]: {
      shares: number;
      avgPrice: number;
    };
  };
}

const StockPlayground = () => {
  // Check if user is premium
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const isPremium = user?.isPremium;
  
  const [stocks, setStocks] = useState<Stock[]>([
    {
      id: "1",
      name: "TechCo",
      ticker: "TECH",
      price: 50,
      previousPrice: 48.75,
      change: 1.25,
      changePercent: 2.56,
    },
    {
      id: "2",
      name: "GreenInc",
      ticker: "GRNC",
      price: 30,
      previousPrice: 30.75,
      change: -0.75,
      changePercent: -2.44,
    },
    {
      id: "3",
      name: "FoodLtd",
      ticker: "FOOD",
      price: 20,
      previousPrice: 19.50,
      change: 0.50,
      changePercent: 2.56,
    },
  ]);
  
  const [portfolio, setPortfolio] = useState<Portfolio>({
    cash: 10000,
    stocks: {
      "1": { shares: 0, avgPrice: 0 },
      "2": { shares: 0, avgPrice: 0 },
      "3": { shares: 0, avgPrice: 0 },
    }
  });
  
  const [tradeStock, setTradeStock] = useState<Stock | null>(null);
  const [tradeAmount, setTradeAmount] = useState<number>(0);
  const [showTradeModal, setShowTradeModal] = useState<boolean>(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  
  // Calculate portfolio value
  const portfolioValue = portfolio.cash + 
    Object.entries(portfolio.stocks).reduce((total, [stockId, holdings]) => {
      const stock = stocks.find(s => s.id === stockId);
      return total + (stock ? stock.price * holdings.shares : 0);
    }, 0);
  
  // Simulate market fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prevStocks => 
        prevStocks.map(stock => {
          // Random price change between -2% and +2%
          const randomChange = (Math.random() * 4 - 2) / 100;
          const newPrice = Math.max(1, stock.price * (1 + randomChange));
          const change = newPrice - stock.previousPrice;
          const changePercent = (change / stock.previousPrice) * 100;
          
          return {
            ...stock,
            previousPrice: stock.price,
            price: parseFloat(newPrice.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
          };
        })
      );
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const handleTrade = (stock: Stock, type: 'buy' | 'sell') => {
    setTradeStock(stock);
    setTradeType(type);
    setTradeAmount(0);
    setShowTradeModal(true);
  };
  
  const executeTradeOrder = () => {
    if (!tradeStock || tradeAmount <= 0) return;
    
    if (tradeType === 'buy') {
      const cost = tradeStock.price * tradeAmount;
      
      if (cost > portfolio.cash) {
        alert("Not enough cash available for this trade!");
        return;
      }
      
      const currentHolding = portfolio.stocks[tradeStock.id];
      const newTotalShares = currentHolding.shares + tradeAmount;
      const newAvgPrice = ((currentHolding.shares * currentHolding.avgPrice) + cost) / newTotalShares;
      
      setPortfolio(prev => ({
        cash: prev.cash - cost,
        stocks: {
          ...prev.stocks,
          [tradeStock.id]: {
            shares: newTotalShares,
            avgPrice: parseFloat(newAvgPrice.toFixed(2))
          }
        }
      }));
    } else {
      // Sell
      const currentHolding = portfolio.stocks[tradeStock.id];
      
      if (tradeAmount > currentHolding.shares) {
        alert("You don't have enough shares to sell!");
        return;
      }
      
      const saleProceeds = tradeStock.price * tradeAmount;
      
      setPortfolio(prev => ({
        cash: prev.cash + saleProceeds,
        stocks: {
          ...prev.stocks,
          [tradeStock.id]: {
            shares: currentHolding.shares - tradeAmount,
            avgPrice: currentHolding.shares - tradeAmount > 0 ? currentHolding.avgPrice : 0
          }
        }
      }));
    }
    
    setShowTradeModal(false);
  };
  
  const resetSimulation = () => {
    setPortfolio({
      cash: 10000,
      stocks: {
        "1": { shares: 0, avgPrice: 0 },
        "2": { shares: 0, avgPrice: 0 },
        "3": { shares: 0, avgPrice: 0 },
      }
    });
  };
  
  if (!isPremium) {
    return (
      <section className="mb-8">
        <Card className="border-primary-200 bg-primary-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-primary-700">
              <TrendingUp className="mr-2 h-5 w-5" />
              Virtual Stock Playground
            </CardTitle>
            <CardDescription>
              Experience risk-free stock trading with our interactive simulator
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center py-8">
            <div className="bg-primary-100 p-6 rounded-full mb-4">
              <TrendingUp className="h-12 w-12 text-primary-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Unlock Premium Feature</h3>
            <p className="text-neutral-600 mb-6 max-w-md">
              Practice investing with our virtual stock market simulator. Buy and sell demo stocks, track your portfolio performance, and learn investing fundamentals without any real financial risk.
            </p>
            <Button size="lg" className="bg-primary-600 hover:bg-primary-700" onClick={() => window.location.href = '/premium'}>
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }
  
  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-neutral-800">Virtual Stock Playground</h2>
        
        <div className="flex gap-3 items-center">
          <p className="text-sm text-neutral-600">
            Portfolio Value: <span className="font-medium">${portfolioValue.toFixed(2)}</span>
          </p>
          <Button variant="outline" size="sm" onClick={resetSimulation} className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="col-span-1 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Wallet className="mr-2 h-4 w-4 text-primary-500" />
              Available Cash
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-neutral-800">${portfolio.cash.toFixed(2)}</p>
            <p className="text-sm text-neutral-500 mt-1">Invest wisely and grow your portfolio</p>
          </CardContent>
        </Card>
        
        {stocks.map((stock) => (
          <Card key={stock.id} className="col-span-1 bg-white">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{stock.name}</CardTitle>
                  <CardDescription>{stock.ticker}</CardDescription>
                </div>
                <Badge variant={stock.change >= 0 ? "success" : "destructive"} className="text-xs">
                  {stock.change >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-2xl font-bold text-neutral-800">${stock.price.toFixed(2)}</p>
                <p className={`text-sm ${stock.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)} today
                </p>
              </div>
              
              <div className="flex justify-between gap-2">
                <Button 
                  className="w-full flex items-center justify-center bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleTrade(stock, 'buy')}
                >
                  <ArrowDownToLine className="h-4 w-4 mr-1" />
                  Buy
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center border-rose-600 text-rose-600 hover:bg-rose-50"
                  onClick={() => handleTrade(stock, 'sell')}
                  disabled={!portfolio.stocks[stock.id].shares}
                >
                  <ArrowUpFromLine className="h-4 w-4 mr-1" />
                  Sell
                </Button>
              </div>
              
              {portfolio.stocks[stock.id].shares > 0 && (
                <div className="mt-4 p-3 bg-neutral-50 rounded-md text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-neutral-600">Shares:</span>
                    <span className="font-medium">{portfolio.stocks[stock.id].shares}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-neutral-600">Avg Price:</span>
                    <span className="font-medium">${portfolio.stocks[stock.id].avgPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Value:</span>
                    <span className="font-medium">${(portfolio.stocks[stock.id].shares * stock.price).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {showTradeModal && tradeStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {tradeType === 'buy' ? 'Buy' : 'Sell'} {tradeStock.name} ({tradeStock.ticker})
            </h3>
            
            <p className="mb-4">Current Price: <span className="font-medium">${tradeStock.price.toFixed(2)}</span></p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Number of Shares
              </label>
              <div className="flex items-center">
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(parseInt(e.target.value) || 0)}
                  className="flex-1"
                />
              </div>
              
              <div className="flex justify-between mt-2 text-sm text-neutral-600">
                <span>Total Cost:</span>
                <span>${(tradeStock.price * tradeAmount).toFixed(2)}</span>
              </div>
              
              {tradeType === 'buy' && (
                <div className="flex justify-between mt-1 text-sm text-neutral-600">
                  <span>Cash After Trade:</span>
                  <span>${(portfolio.cash - (tradeStock.price * tradeAmount)).toFixed(2)}</span>
                </div>
              )}
              
              {tradeType === 'sell' && (
                <div className="flex justify-between mt-1 text-sm text-neutral-600">
                  <span>Cash After Trade:</span>
                  <span>${(portfolio.cash + (tradeStock.price * tradeAmount)).toFixed(2)}</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowTradeModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={executeTradeOrder}
                className={tradeType === 'buy' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
                disabled={tradeAmount <= 0}
              >
                {tradeType === 'buy' ? 'Buy' : 'Sell'} Shares
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default StockPlayground;