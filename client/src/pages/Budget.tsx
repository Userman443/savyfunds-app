import React, { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HelpButton from "@/components/ui/help-button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Wallet, CreditCard, BarChart3, ArrowUpRight, ArrowDown, DollarSign, Globe, MapPin, Download, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Disclaimer } from "@/components/ui/disclaimer";
import { useLocation, useLocalCurrency } from "@/hooks/use-location";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Budget = () => {
  const [monthlyIncome, setMonthlyIncome] = useState<string>("");
  const [expenses, setExpenses] = useState({
    housing: "",
    food: "",
    utilities: "",
    transportation: "",
    entertainment: "",
    other: "",
  });
  
  // Get user data
  const { data: user } = useQuery<{
    id: number;
    username: string;
    displayName: string;
    level: number;
    isPremium: boolean;
    avatarUrl?: string;
  } | null>({
    queryKey: ["/api/auth/me"],
    retry: 0
  });
  
  // Get location and currency information
  const { location, isLoading: locationLoading } = useLocation();
  const { formatLocalCurrency, convertAndFormatCurrency, currencySymbol } = useLocalCurrency();
  
  // State for storing server-calculated budget
  const [serverBudget, setServerBudget] = useState<any>(null);
  const [budgetLoading, setBudgetLoading] = useState(false);
  
  const handleExpenseChange = (category: string, value: string) => {
    try {
      // Allow empty string or valid numbers with at most one decimal point
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setExpenses((prev) => ({
          ...prev,
          [category]: value,
        }));
      }
    } catch (error) {
      console.error(`Error updating expense (${category}):`, error);
      // Don't update on error
    }
  };
  
  // Calculate totals - with enhanced error prevention
  const income = useMemo(() => {
    try {
      return monthlyIncome && monthlyIncome.trim() !== '' ? (parseFloat(monthlyIncome) || 0) : 0;
    } catch (e) {
      console.error("Error parsing income:", e);
      return 0;
    }
  }, [monthlyIncome]);
  
  const totalExpenses = useMemo(() => {
    try {
      return Object.values(expenses).reduce(
        (sum, value) => {
          if (!value || value.trim() === '') return sum;
          const parsedValue = parseFloat(value);
          return sum + (isNaN(parsedValue) ? 0 : parsedValue);
        },
        0
      );
    } catch (e) {
      console.error("Error calculating expenses:", e);
      return 0;
    }
  }, [expenses]);
  
  const savings = useMemo(() => {
    try {
      return Math.max(0, income - totalExpenses);
    } catch (e) {
      console.error("Error calculating savings:", e);
      return 0;
    }
  }, [income, totalExpenses]);
  
  // Calculate percentages for recommended allocations
  const recommendedAllocations = useMemo(() => {
    try {
      return {
        essentials: income * 0.5,
        savings: income * 0.3,
        discretionary: income * 0.2,
      };
    } catch (e) {
      console.error("Error calculating recommended allocations:", e);
      return {
        essentials: 0,
        savings: 0,
        discretionary: 0
      };
    }
  }, [income]);
  
  // Function to get location-specific budget calculations
  const calculateBudget = async () => {
    if (income <= 0) return;
    
    setBudgetLoading(true);
    try {
      const response = await fetch('/api/budget/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monthlyIncome: income,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Budget calculation failed');
      }
      
      const result = await response.json();
      setServerBudget(result);
    } catch (error) {
      console.error('Error calculating budget:', error);
    } finally {
      setBudgetLoading(false);
    }
  };
  
  // Recalculate budget when income changes
  useEffect(() => {
    if (income > 0) {
      calculateBudget();
    } else {
      setServerBudget(null);
    }
  }, [income]);
  
  // Calculate expense categories for pie chart with better safeguards
  const expenseData = useMemo(() => {
    try {
      return [
        { 
          name: "Housing", 
          value: expenses.housing ? (isNaN(parseFloat(expenses.housing)) ? 0 : parseFloat(expenses.housing)) : 0, 
          color: "#4cb687" 
        },
        { 
          name: "Food", 
          value: expenses.food ? (isNaN(parseFloat(expenses.food)) ? 0 : parseFloat(expenses.food)) : 0, 
          color: "#7fd1ac" 
        },
        { 
          name: "Utilities", 
          value: expenses.utilities ? (isNaN(parseFloat(expenses.utilities)) ? 0 : parseFloat(expenses.utilities)) : 0, 
          color: "#b1e5cb" 
        },
        { 
          name: "Transportation", 
          value: expenses.transportation ? (isNaN(parseFloat(expenses.transportation)) ? 0 : parseFloat(expenses.transportation)) : 0, 
          color: "#5b8eff" 
        },
        { 
          name: "Entertainment", 
          value: expenses.entertainment ? (isNaN(parseFloat(expenses.entertainment)) ? 0 : parseFloat(expenses.entertainment)) : 0, 
          color: "#9877ff" 
        },
        { 
          name: "Other", 
          value: expenses.other ? (isNaN(parseFloat(expenses.other)) ? 0 : parseFloat(expenses.other)) : 0, 
          color: "#d5ccff" 
        },
      ].filter(item => item.value > 0);
    } catch (e) {
      console.error("Error calculating expense data for chart:", e);
      return [];
    }
  }, [expenses]);
  
  // Comparison chart data with enhanced safeguards
  const comparisonData = useMemo(() => {
    try {
      if (income <= 0) {
        // Return default data with zero values if no income
        return [
          { name: "Housing", yours: 0, average: 30 },
          { name: "Food", yours: 0, average: 15 },
          { name: "Utilities", yours: 0, average: 10 },
          { name: "Transport", yours: 0, average: 12 },
          { name: "Entertainment", yours: 0, average: 10 },
          { name: "Other", yours: 0, average: 5 },
          { name: "Savings", yours: 0, average: 18 },
        ];
      }
      
      return [
        { 
          name: "Housing", 
          yours: ((expenses.housing ? parseFloat(expenses.housing) || 0 : 0) / income * 100), 
          average: 30 
        },
        { 
          name: "Food", 
          yours: ((expenses.food ? parseFloat(expenses.food) || 0 : 0) / income * 100), 
          average: 15 
        },
        { 
          name: "Utilities", 
          yours: ((expenses.utilities ? parseFloat(expenses.utilities) || 0 : 0) / income * 100), 
          average: 10 
        },
        { 
          name: "Transport", 
          yours: ((expenses.transportation ? parseFloat(expenses.transportation) || 0 : 0) / income * 100), 
          average: 12 
        },
        { 
          name: "Entertainment", 
          yours: ((expenses.entertainment ? parseFloat(expenses.entertainment) || 0 : 0) / income * 100), 
          average: 10 
        },
        { 
          name: "Other", 
          yours: ((expenses.other ? parseFloat(expenses.other) || 0 : 0) / income * 100), 
          average: 5 
        },
        { 
          name: "Savings", 
          yours: (savings / income * 100), 
          average: 18 
        },
      ];
    } catch (e) {
      console.error("Error calculating comparison data:", e);
      return [];
    }
  }, [expenses, income, savings]);
  
  // Calculate essential expenses with additional safeguards
  const essentialExpenses = useMemo(() => {
    try {
      return (
        (expenses.housing ? (isNaN(parseFloat(expenses.housing)) ? 0 : parseFloat(expenses.housing)) : 0) +
        (expenses.food ? (isNaN(parseFloat(expenses.food)) ? 0 : parseFloat(expenses.food)) : 0) +
        (expenses.utilities ? (isNaN(parseFloat(expenses.utilities)) ? 0 : parseFloat(expenses.utilities)) : 0) +
        (expenses.transportation ? (isNaN(parseFloat(expenses.transportation)) ? 0 : parseFloat(expenses.transportation)) : 0)
      );
    } catch (e) {
      console.error("Error calculating essential expenses:", e);
      return 0;
    }
  }, [expenses.housing, expenses.food, expenses.utilities, expenses.transportation]);
  
  // Calculate discretionary expenses with additional safeguards
  const discretionaryExpenses = useMemo(() => {
    try {
      return (
        (expenses.entertainment ? (isNaN(parseFloat(expenses.entertainment)) ? 0 : parseFloat(expenses.entertainment)) : 0) +
        (expenses.other ? (isNaN(parseFloat(expenses.other)) ? 0 : parseFloat(expenses.other)) : 0)
      );
    } catch (e) {
      console.error("Error calculating discretionary expenses:", e);
      return 0;
    }
  }, [expenses.entertainment, expenses.other]);
  
  // Sample monthly transactions
  const transactions = [
    { id: 1, date: "May 28", description: "Rent Payment", amount: -1200, category: "Housing" },
    { id: 2, date: "May 27", description: "Grocery Store", amount: -85.33, category: "Food" },
    { id: 3, date: "May 26", description: "Electric Bill", amount: -72.50, category: "Utilities" },
    { id: 4, date: "May 25", description: "Gas Station", amount: -45.80, category: "Transportation" },
    { id: 5, date: "May 24", description: "Paycheck", amount: 1250, category: "Income" },
    { id: 6, date: "May 23", description: "Restaurant", amount: -38.95, category: "Entertainment" },
  ];
  
  // For premium feature dialog
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState("");
  const { toast } = useToast();
  
  // Handle downloading budget report - Now free for all users
  const handleDownloadBudgetReport = () => {
    if (income <= 0) {
      toast({
        variant: "destructive",
        title: "No budget data",
        description: "Please enter your income and expenses first.",
      });
      return;
    }
    
    try {
      // Prepare CSV content
      let csvContent = "Category,Monthly Amount,Percentage of Income\n";
      
      // Add essential expenses
      csvContent += `Housing,${location ? currencySymbol : '$'}${parseFloat(expenses.housing || '0').toFixed(2)},${expenses.housing ? Math.round((parseFloat(expenses.housing) / income) * 100) : 0}%\n`;
      csvContent += `Food,${location ? currencySymbol : '$'}${parseFloat(expenses.food || '0').toFixed(2)},${expenses.food ? Math.round((parseFloat(expenses.food) / income) * 100) : 0}%\n`;
      csvContent += `Utilities,${location ? currencySymbol : '$'}${parseFloat(expenses.utilities || '0').toFixed(2)},${expenses.utilities ? Math.round((parseFloat(expenses.utilities) / income) * 100) : 0}%\n`;
      csvContent += `Transportation,${location ? currencySymbol : '$'}${parseFloat(expenses.transportation || '0').toFixed(2)},${expenses.transportation ? Math.round((parseFloat(expenses.transportation) / income) * 100) : 0}%\n`;
      
      // Add discretionary expenses
      csvContent += `Entertainment,${location ? currencySymbol : '$'}${parseFloat(expenses.entertainment || '0').toFixed(2)},${expenses.entertainment ? Math.round((parseFloat(expenses.entertainment) / income) * 100) : 0}%\n`;
      csvContent += `Other,${location ? currencySymbol : '$'}${parseFloat(expenses.other || '0').toFixed(2)},${expenses.other ? Math.round((parseFloat(expenses.other) / income) * 100) : 0}%\n`;
      
      // Add savings
      csvContent += `Savings,${location ? currencySymbol : '$'}${savings.toFixed(2)},${Math.round((savings / income) * 100)}%\n`;
      
      // Add totals
      csvContent += `\nTotal Expenses,${location ? currencySymbol : '$'}${totalExpenses.toFixed(2)},${Math.round((totalExpenses / income) * 100)}%\n`;
      csvContent += `Total Income,${location ? currencySymbol : '$'}${income.toFixed(2)},100%\n`;
      
      // Add budget health analysis
      csvContent += "\nBudget Analysis:";
      csvContent += `\nEssential Expenses: ${Math.round((essentialExpenses / income) * 100)}% (Recommended: 50%)`;
      csvContent += `\nDiscretionary Spending: ${Math.round((discretionaryExpenses / income) * 100)}% (Recommended: 30%)`;
      csvContent += `\nSavings Rate: ${Math.round((savings / income) * 100)}% (Recommended: 20%)`;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `savyfunds_budget_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Budget report downloaded",
        description: "Your budget report has been downloaded as a CSV file.",
      });
    } catch (error) {
      console.error("Error generating budget report:", error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "There was an error generating your budget report.",
      });
    }
  };
  
  // Handle premium feature click - shows upgrade dialog
  const handlePremiumFeatureClick = (feature: string) => {
    setPremiumFeature(feature);
    setShowPremiumDialog(true);
  };


  // Return the main component with error handling
  return (
    <>
      <Navbar user={user || null} />
      
      {/* Premium Feature Dialog */}
      <Dialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Crown className="h-5 w-5 mr-2 text-yellow-500" />
              Premium Feature
            </DialogTitle>
            <DialogDescription>
              This feature is only available to premium SavyFunds members.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Premium Benefits:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <div className="h-5 w-5 text-primary-500 mr-2">✓</div>
                  <span>Download budget reports as CSV</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 text-primary-500 mr-2">✓</div>
                  <span>Personalized AI-powered financial advice</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 text-primary-500 mr-2">✓</div>
                  <span>Advanced budget tools and calculators</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 text-primary-500 mr-2">✓</div>
                  <span>Priority customer support</span>
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:space-x-0">
            <Button variant="outline" onClick={() => setShowPremiumDialog(false)}>
              Maybe Later
            </Button>
            <Button onClick={() => window.location.href = "/premium"}>
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <main className="container mx-auto px-4 md:px-6 py-6 page-transition">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">Budget Planner</h1>
          <p className="text-neutral-600">Track, analyze, and optimize your spending</p>
        </div>
        
        <Tabs defaultValue="calculator">
          <TabsList className="mb-6">
            <TabsTrigger value="calculator">Budget Calculator</TabsTrigger>
            <TabsTrigger value="tracker">Expense Tracker</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wallet className="mr-2 h-5 w-5 text-primary-500" />
                    Income & Expenses
                  </CardTitle>
                  <CardDescription>
                    Enter your monthly income and expenses to calculate your budget
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="mb-6">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="monthlyIncome" className="text-base font-medium">
                            Monthly Income After Tax
                          </Label>
                          {location && (
                            <Badge variant="outline" className="flex items-center gap-1 text-xs">
                              <Globe className="h-3 w-3" />
                              {location.countryName}
                            </Badge>
                          )}
                        </div>
                        <div className="relative mt-2">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-neutral-500">{locationLoading ? '$' : currencySymbol}</span>
                          </div>
                          <Input
                            id="monthlyIncome"
                            type="text"
                            inputMode="decimal"
                            className="pl-8"
                            placeholder="0.00"
                            value={monthlyIncome}
                            onChange={(e) => {
                              try {
                                const value = e.target.value;
                                // Only allow empty string or valid numbers with at most one decimal point
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setMonthlyIncome(value);
                                }
                              } catch (error) {
                                console.error("Error updating income:", error);
                                // Don't update on error
                              }
                            }}
                          />
                        </div>
                        {locationLoading && (
                          <div className="mt-1 text-xs text-neutral-500">
                            <Skeleton className="h-4 w-28" />
                          </div>
                        )}
                        {location && (
                          <div className="mt-1 text-xs text-neutral-500">
                            All calculations will use {location.currencyCode} ({location.currencySymbol})
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-base font-medium mb-3">Essential Expenses</h3>
                        
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="housing">Housing (Rent/Mortgage)</Label>
                            <div className="relative mt-1">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-neutral-500">{locationLoading ? '$' : currencySymbol}</span>
                              </div>
                              <Input
                                id="housing"
                                type="text"
                                inputMode="decimal"
                                className="pl-8"
                                placeholder="0.00"
                                value={expenses.housing}
                                onChange={(e) => handleExpenseChange("housing", e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="food">Food & Groceries</Label>
                            <div className="relative mt-1">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-neutral-500">{locationLoading ? '$' : currencySymbol}</span>
                              </div>
                              <Input
                                id="food"
                                type="text"
                                inputMode="decimal"
                                className="pl-8"
                                placeholder="0.00"
                                value={expenses.food}
                                onChange={(e) => handleExpenseChange("food", e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="utilities">Utilities</Label>
                            <div className="relative mt-1">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-neutral-500">{locationLoading ? '$' : currencySymbol}</span>
                              </div>
                              <Input
                                id="utilities"
                                type="text"
                                inputMode="decimal"
                                className="pl-8"
                                placeholder="0.00"
                                value={expenses.utilities}
                                onChange={(e) => handleExpenseChange("utilities", e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="transportation">Transportation</Label>
                            <div className="relative mt-1">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-neutral-500">{locationLoading ? '$' : currencySymbol}</span>
                              </div>
                              <Input
                                id="transportation"
                                type="text"
                                inputMode="decimal"
                                className="pl-8"
                                placeholder="0.00"
                                value={expenses.transportation}
                                onChange={(e) => handleExpenseChange("transportation", e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="mb-6">
                        <h3 className="text-base font-medium mb-3">Discretionary Expenses</h3>
                        
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="entertainment">Entertainment & Dining</Label>
                            <div className="relative mt-1">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-neutral-500">{locationLoading ? '$' : currencySymbol}</span>
                              </div>
                              <Input
                                id="entertainment"
                                type="text"
                                inputMode="decimal"
                                className="pl-8"
                                placeholder="0.00"
                                value={expenses.entertainment}
                                onChange={(e) => handleExpenseChange("entertainment", e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="other">Other Expenses</Label>
                            <div className="relative mt-1">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-neutral-500">{locationLoading ? '$' : currencySymbol}</span>
                              </div>
                              <Input
                                id="other"
                                type="text"
                                inputMode="decimal"
                                className="pl-8"
                                placeholder="0.00"
                                value={expenses.other}
                                onChange={(e) => handleExpenseChange("other", e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-neutral-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-base font-medium">Budget Summary</h3>
                          {location && (
                            <Badge variant="outline" className="flex items-center gap-1 text-xs">
                              <MapPin className="h-3 w-3" />
                              {location.currencyCode}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          {budgetLoading ? (
                            <>
                              <div className="flex justify-between">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-16" />
                              </div>
                              <div className="flex justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-16" />
                              </div>
                              <Separator />
                              <div className="flex justify-between">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-4 w-16" />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between">
                                <span>Total Income:</span>
                                <span className="font-medium">
                                  {location ? (
                                    <>
                                      <span className="text-xs text-neutral-500 mr-1">
                                        (USD ${income.toFixed(2)})
                                      </span>
                                      {formatLocalCurrency(income)}
                                    </>
                                  ) : (
                                    `$${income.toFixed(2)}`
                                  )}
                                </span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span>Total Expenses:</span>
                                <span className="font-medium">
                                  {location ? (
                                    formatLocalCurrency(totalExpenses)
                                  ) : (
                                    `$${totalExpenses.toFixed(2)}`
                                  )}
                                </span>
                              </div>
                              
                              <Separator />
                              
                              <div className="flex justify-between">
                                <span>Remaining (Savings):</span>
                                <span className={`font-medium ${savings >= 0 ? 'text-secondary-600' : 'text-destructive'}`}>
                                  {location ? (
                                    formatLocalCurrency(savings)
                                  ) : (
                                    `$${savings.toFixed(2)}`
                                  )}
                                </span>
                              </div>
                            </>
                          )}
                          
                          <div className="pt-2">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Monthly Savings Rate:</span>
                              <span>{income > 0 ? Math.round((savings / income) * 100) : 0}%</span>
                            </div>
                            <Progress value={income > 0 ? (savings / income) * 100 : 0} className="h-2" />
                          </div>
                          
                          {serverBudget && (
                            <div className="mt-4 pt-4 border-t border-neutral-200">
                              <div className="text-sm font-medium mb-2 flex items-center">
                                <Globe className="w-3.5 h-3.5 mr-1 text-primary-500" />
                                Regional Budget Guidelines
                              </div>
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                  <span>Housing (30%):</span>
                                  <span>{serverBudget?.budget?.essentials?.formattedAmount || `${currencySymbol}0.00`}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Savings (20%):</span>
                                  <span>{serverBudget?.budget?.savings?.formattedAmount || `${currencySymbol}0.00`}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Discretionary (50%):</span>
                                  <span>{serverBudget?.budget?.discretionary?.formattedAmount || `${currencySymbol}0.00`}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="mr-2 h-5 w-5 text-primary-500" />
                    Budget Breakdown
                  </CardTitle>
                  <CardDescription>
                    Visualize your spending patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {income > 0 && expenseData.length > 0 ? (
                    <div className="space-y-6">
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={expenseData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {expenseData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [
                              `${locationLoading || !location ? '$' : currencySymbol}${value}`, 
                              'Amount'
                            ]} />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center">
                              <span className="w-3 h-3 bg-secondary-500 rounded-full mr-2"></span>
                              Essential (50%)
                            </span>
                            <span>{essentialExpenses > 0 ? Math.round((essentialExpenses / income) * 100) : 0}%</span>
                          </div>
                          <Progress value={Math.min(100, essentialExpenses / income * 100)} className="h-2 bg-neutral-200" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center">
                              <span className="w-3 h-3 bg-accent-500 rounded-full mr-2"></span>
                              Discretionary (30%)
                            </span>
                            <span>{discretionaryExpenses > 0 ? Math.round((discretionaryExpenses / income) * 100) : 0}%</span>
                          </div>
                          <Progress value={Math.min(100, discretionaryExpenses / income * 100)} className="h-2 bg-neutral-200" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center">
                              <span className="w-3 h-3 bg-primary-500 rounded-full mr-2"></span>
                              Savings (20%)
                            </span>
                            <span>{savings > 0 ? Math.round((savings / income) * 100) : 0}%</span>
                          </div>
                          <Progress value={Math.min(100, savings / income * 100)} className="h-2 bg-neutral-200" />
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleDownloadBudgetReport()}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Budget Report
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-60 flex flex-col items-center justify-center text-center text-neutral-500">
                      <PieChart className="h-12 w-12 mb-2 opacity-50" />
                      <p>Enter your income and expenses to see your budget breakdown</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-primary-500" />
                  Spending Comparison
                </CardTitle>
                <CardDescription>
                  See how your spending compares to recommended guidelines
                </CardDescription>
              </CardHeader>
              <CardContent>
                {income > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis unit="%" />
                        <Tooltip 
                          formatter={(value: number | string) => {
                            const numValue = typeof value === 'number' ? value : parseFloat(value);
                            return isNaN(numValue) ? ['0%', 'Percentage of Income'] : [`${numValue.toFixed(1)}%`, 'Percentage of Income'];
                          }} 
                        />
                        <Bar dataKey="yours" name="Your Budget" fill="#5b8eff" />
                        <Bar dataKey="average" name="Recommended" fill="#7fd1ac" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex flex-col items-center justify-center text-center text-neutral-500">
                    <BarChart3 className="h-12 w-12 mb-2 opacity-50" />
                    <p>Enter your income to see spending comparisons</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tracker">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="mr-2 h-5 w-5 text-primary-500" />
                    Recent Transactions
                  </CardTitle>
                  <CardDescription>
                    Track your income and expenses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 bg-neutral-50 p-3 text-sm font-medium">
                      <div className="col-span-3">Date</div>
                      <div className="col-span-5">Description</div>
                      <div className="col-span-2">Category</div>
                      <div className="col-span-2 text-right">Amount</div>
                    </div>
                    <div className="divide-y">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="grid grid-cols-12 p-3 text-sm">
                          <div className="col-span-3">{transaction.date}</div>
                          <div className="col-span-5">{transaction.description}</div>
                          <div className="col-span-2 flex items-center">
                            <span
                              className={`w-2 h-2 rounded-full mr-2 ${
                                transaction.amount > 0 ? "bg-secondary-500" : "bg-primary-500"
                              }`}
                            ></span>
                            {transaction.category}
                          </div>
                          <div 
                            className={`col-span-2 text-right font-medium ${
                              transaction.amount > 0 ? "text-secondary-700" : "text-neutral-700"
                            }`}
                          >
                            {transaction.amount > 0 ? "+" : ""}
                            {location 
                              ? formatLocalCurrency(Math.abs(transaction.amount))
                              : `$${Math.abs(transaction.amount).toFixed(2)}`
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between">
                    <Button variant="outline">
                      <ArrowDown className="mr-2 h-4 w-4" />
                      Add Expense
                    </Button>
                    <Button variant="outline" className="text-secondary-700">
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      Add Income
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="mr-2 h-5 w-5 text-primary-500" />
                    Month Overview
                  </CardTitle>
                  <CardDescription>
                    Your financial summary for May
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm text-neutral-500 mb-1">Income</div>
                      <div className="text-2xl font-bold text-secondary-700">
                        {location ? formatLocalCurrency(3250) : "$3,250.00"}
                      </div>
                      <div className="text-xs text-secondary-600 flex items-center">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        5% more than last month
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-neutral-500 mb-1">Expenses</div>
                      <div className="text-2xl font-bold">
                        {location ? formatLocalCurrency(2180.45) : "$2,180.45"}
                      </div>
                      <div className="text-xs text-secondary-600 flex items-center">
                        <ArrowDown className="h-3 w-3 mr-1" />
                        3% less than last month
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <div className="text-sm text-neutral-500 mb-1">Savings</div>
                      <div className="text-2xl font-bold text-secondary-700">
                        {location ? formatLocalCurrency(1069.55) : "$1,069.55"}
                      </div>
                      <div className="text-xs text-secondary-600">33% of income saved</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">Top Spending Categories</div>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Housing</span>
                            <span>{location ? formatLocalCurrency(1200) : "$1,200.00"}</span>
                          </div>
                          <Progress value={65} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Food</span>
                            <span>{location ? formatLocalCurrency(425.80) : "$425.80"}</span>
                          </div>
                          <Progress value={25} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Utilities</span>
                            <span>{location ? formatLocalCurrency(185.25) : "$185.25"}</span>
                          </div>
                          <Progress value={15} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="insights">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Insights</CardTitle>
                  <CardDescription>
                    Personalized recommendations based on your financial habits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-primary-50 border border-primary-100 rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-2 text-primary-800">Spending Patterns</h3>
                      <p className="text-neutral-700 mb-4">
                        Based on your recent transaction history, we've noticed that you spend more on dining out
                        during weekends. Try setting a weekend dining budget to reduce these expenses.
                      </p>
                      <Button variant="outline" className="text-primary-700 border-primary-200">View Dining Expenses</Button>
                    </div>
                    
                    <div className="bg-secondary-50 border border-secondary-100 rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-2 text-secondary-800">Savings Opportunity</h3>
                      <p className="text-neutral-700 mb-4">
                        You're currently saving about 33% of your income, which is excellent! Consider directing some
                        of these savings toward your "Emergency Fund" goal to reach it faster.
                      </p>
                      <Button variant="outline" className="text-secondary-700 border-secondary-200">Optimize Savings</Button>
                    </div>
                    
                    <div className="bg-accent-50 border border-accent-100 rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-2 text-accent-800">Bill Alert</h3>
                      <p className="text-neutral-700 mb-4">
                        Your utility bill seems higher than average this month. This might be due to seasonal changes
                        or increased usage. Check for ways to reduce energy consumption.
                      </p>
                      <Button variant="outline" className="text-accent-700 border-accent-200">Energy Saving Tips</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
      <HelpButton />
    </>
  );
};

export default Budget;
