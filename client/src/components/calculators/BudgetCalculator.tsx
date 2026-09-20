import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DollarSign, FileDown, BarChart3, PieChart as PieChartIcon, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import ShareProgress from "@/components/engagement/ShareProgress";

type BudgetCategory = {
  name: string;
  percentage: number;
  color: string;
  value: number;
  description: string;
  recommendation?: string;
};

const defaultCategories: BudgetCategory[] = [
  { 
    name: "Housing", 
    percentage: 30, 
    color: "#2C6E49", 
    value: 0,
    description: "Rent or mortgage payments, property taxes, home insurance, and maintenance costs."
  },
  { 
    name: "Food", 
    percentage: 15, 
    color: "#4F9D69", 
    value: 0,
    description: "Groceries, dining out, and food delivery services."
  },
  { 
    name: "Transportation", 
    percentage: 10, 
    color: "#80CFA9", 
    value: 0,
    description: "Car payments, gas, insurance, public transport, ride-sharing, and maintenance."
  },
  { 
    name: "Utilities", 
    percentage: 10, 
    color: "#F4D35E", 
    value: 0,
    description: "Electricity, water, gas, internet, phone bills, and streaming services."
  },
  { 
    name: "Savings", 
    percentage: 15, 
    color: "#EE964B", 
    value: 0,
    description: "Emergency fund, retirement contributions, and other savings goals."
  },
  { 
    name: "Debt Repayment", 
    percentage: 10, 
    color: "#F95738", 
    value: 0,
    description: "Credit card payments, student loans, personal loans, and other debts."
  },
  { 
    name: "Entertainment", 
    percentage: 5, 
    color: "#A63A50", 
    value: 0,
    description: "Movies, concerts, subscriptions, and other leisure activities."
  },
  { 
    name: "Personal", 
    percentage: 5, 
    color: "#0075A2", 
    value: 0,
    description: "Clothing, personal care items, gym memberships, and other personal expenses."
  }
];

const BudgetCalculator = () => {
  const [income, setIncome] = useState<string>("");
  const [categories, setCategories] = useState<BudgetCategory[]>(defaultCategories);
  const [activeTab, setActiveTab] = useState<string>("breakdown");
  const [allocatedPercentage, setAllocatedPercentage] = useState<number>(100);
  const [budgetHealth, setBudgetHealth] = useState<number>(0);
  const { toast } = useToast();

  // Calculate values and update allocated percentage whenever income or categories change
  useEffect(() => {
    if (!income || isNaN(parseFloat(income))) return;

    const monthlyIncome = parseFloat(income);
    let totalPercentage = 0;

    const updatedCategories = categories.map(cat => {
      totalPercentage += cat.percentage;
      return {
        ...cat,
        value: (monthlyIncome * cat.percentage) / 100
      };
    });

    setCategories(updatedCategories);
    setAllocatedPercentage(totalPercentage);

    // Calculate budget health score (0-100)
    // Factors: Savings rate, debt percentage, housing affordability
    const savingsCategory = updatedCategories.find(cat => cat.name === "Savings");
    const debtCategory = updatedCategories.find(cat => cat.name === "Debt Repayment");
    const housingCategory = updatedCategories.find(cat => cat.name === "Housing");

    let score = 50; // Start at middle

    // Savings rate (higher is better)
    if (savingsCategory) {
      if (savingsCategory.percentage >= 20) score += 20;
      else if (savingsCategory.percentage >= 15) score += 15;
      else if (savingsCategory.percentage >= 10) score += 10;
      else if (savingsCategory.percentage >= 5) score += 5;
    }

    // Debt percentage (lower is better)
    if (debtCategory) {
      if (debtCategory.percentage <= 5) score += 15;
      else if (debtCategory.percentage <= 10) score += 10;
      else if (debtCategory.percentage <= 15) score += 5;
      else if (debtCategory.percentage >= 25) score -= 10;
    }

    // Housing affordability (lower is better)
    if (housingCategory) {
      if (housingCategory.percentage <= 25) score += 15;
      else if (housingCategory.percentage <= 30) score += 10;
      else if (housingCategory.percentage <= 35) score += 5;
      else if (housingCategory.percentage >= 40) score -= 10;
    }

    // Overall allocation (closer to 100% is better)
    if (totalPercentage === 100) score += 10;
    else if (totalPercentage > 100) score -= 15;
    else if (totalPercentage < 90) score -= 10;

    // Ensure score is between 0-100
    setBudgetHealth(Math.max(0, Math.min(100, score)));
  }, [income, categories]);

  // Handle slider change for a category
  const handleCategoryChange = (index: number, newPercentage: number) => {
    const updatedCategories = [...categories];
    updatedCategories[index].percentage = newPercentage;
    setCategories(updatedCategories);
  };

  // Handle reset to default allocations
  const handleReset = () => {
    setCategories(defaultCategories);
    toast({
      title: "Budget reset",
      description: "Your budget has been reset to default allocations.",
    });
  };

  // Download budget as CSV
  const downloadBudget = () => {
    if (!income || isNaN(parseFloat(income))) {
      toast({
        variant: "destructive",
        title: "Income required",
        description: "Please enter your monthly income first.",
      });
      return;
    }

    const monthlyIncome = parseFloat(income);
    let csvContent = "Category,Percentage,Monthly Amount,Annual Amount\n";
    
    categories.forEach(cat => {
      const monthlyAmount = (monthlyIncome * cat.percentage) / 100;
      const annualAmount = monthlyAmount * 12;
      csvContent += `${cat.name},${cat.percentage}%,$${monthlyAmount.toFixed(2)},$${annualAmount.toFixed(2)}\n`;
    });
    
    csvContent += `\nTotal,${allocatedPercentage}%,$${monthlyIncome.toFixed(2)},$${(monthlyIncome * 12).toFixed(2)}\n`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'savyfunds_budget.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Budget downloaded",
      description: "Your budget has been downloaded as a CSV file.",
    });
  };

  // Get budget health message
  const getBudgetHealthMessage = () => {
    if (budgetHealth >= 90) return "Excellent";
    if (budgetHealth >= 70) return "Good";
    if (budgetHealth >= 50) return "Average";
    if (budgetHealth >= 30) return "Needs Improvement";
    return "At Risk";
  };

  // Get budget health color
  const getBudgetHealthColor = () => {
    if (budgetHealth >= 90) return "text-green-600 dark:text-green-400";
    if (budgetHealth >= 70) return "text-emerald-600 dark:text-emerald-400";
    if (budgetHealth >= 50) return "text-amber-600 dark:text-amber-400";
    if (budgetHealth >= 30) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Interactive Budget Calculator</CardTitle>
              <CardDescription>
                Create a personalized budget based on your monthly income
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleReset} size="sm">
                Reset
              </Button>
              <Button variant="outline" onClick={downloadBudget} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <ShareProgress 
                data={{
                  title: "My savyfunds Budget Plan",
                  text: `I created a personalized budget with savyfunds. My budget health score: ${getBudgetHealthMessage()} (${budgetHealth}/100)`,
                  hashtags: ["budgeting", "personalfinance", "savyfunds"],
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
              <div>
                <Label htmlFor="income">Monthly Income</Label>
                <div className="relative mt-1.5">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="income"
                    type="number"
                    placeholder="0.00"
                    className="pl-9"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm">Total Allocation</h3>
                    <p className="text-xs text-muted-foreground">
                      Your budget allocations should total 100%
                    </p>
                  </div>
                  <Badge
                    variant={
                      allocatedPercentage === 100
                        ? "default"
                        : allocatedPercentage > 100
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {allocatedPercentage}%
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-medium text-sm">Budget Health</h3>
                  <Progress value={budgetHealth} className="h-2" />
                  <div className="flex justify-between items-center">
                    <p className={`text-xs ${getBudgetHealthColor()}`}>
                      {getBudgetHealthMessage()}
                    </p>
                    <p className={`text-xs font-medium ${getBudgetHealthColor()}`}>
                      {budgetHealth}/100
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <Tabs defaultValue="breakdown" onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="breakdown" className="flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4" />
                    <span>Budget Breakdown</span>
                  </TabsTrigger>
                  <TabsTrigger value="allocation" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Allocation Sliders</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="breakdown" className="space-y-4">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categories}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="percentage"
                          nameKey="name"
                          label={({ name, percentage }) => `${name} ${percentage}%`}
                        >
                          {categories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name) => {
                            const numericValue = Number(value);
                            const amount = income ? `$${((parseFloat(income) * numericValue) / 100).toFixed(2)}` : '$0.00';
                            return [`${numericValue}% (${amount})`, name];
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {parseFloat(income) > 0 && (
                    <div className="rounded-lg border p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {categories.map((category, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-3 w-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="font-medium text-sm">{category.name}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{category.percentage}%</span>
                            <span className="font-medium">
                              ${category.value.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="allocation" className="space-y-6">
                  {categories.map((category, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-3 w-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            <h4 className="text-sm font-medium">{category.name}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {category.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {category.percentage}%
                          </div>
                          {income && (
                            <div className="text-xs text-muted-foreground">
                              ${category.value.toFixed(2)} / month
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Slider
                        value={[category.percentage]}
                        min={0}
                        max={50}
                        step={1}
                        className="[&>span]:bg-[var(--slider-color)]"
                        style={{ "--slider-color": category.color } as any}
                        onValueChange={(values) => handleCategoryChange(index, values[0])}
                      />
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between text-xs text-muted-foreground border-t pt-6">
          <div>
            The 50/30/20 rule suggests spending 50% on needs, 30% on wants, and 20% on savings.
          </div>
          <div>
            Adjust sliders to match your personal financial situation.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BudgetCalculator;