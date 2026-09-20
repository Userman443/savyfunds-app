import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PieChart, Link2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const BudgetCalculator = () => {
  const [monthlyIncome, setMonthlyIncome] = useState<string>("");
  const [budgetData, setBudgetData] = useState<{ essentials: number; savings: number; discretionary: number } | null>(null);

  const budgetMutation = useMutation({
    mutationFn: async (income: number) => {
      const response = await apiRequest("POST", "/api/budget/calculate", { monthlyIncome: income });
      return response.json();
    },
    onSuccess: (data) => {
      setBudgetData(data);
    },
  });

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMonthlyIncome(value);
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      budgetMutation.mutate(numValue);
    } else {
      setBudgetData(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-700">
          <PieChart className="h-5 w-5" />
        </div>
        <h3 className="ml-3 text-lg font-semibold">Budget Calculator</h3>
      </div>
      
      <div className="mb-4">
        <label className="block text-neutral-700 text-sm font-medium mb-2">
          Monthly Income After Tax
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-neutral-500">$</span>
          </div>
          <Input
            type="number"
            className="pl-8"
            placeholder="0.00"
            value={monthlyIncome}
            onChange={handleIncomeChange}
          />
        </div>
      </div>
      
      <div className="mb-5">
        <h4 className="font-medium text-sm text-neutral-700 mb-2">Suggested Monthly Allocation</h4>
        <div className="grid grid-cols-1 gap-2">
          <div className="bg-neutral-50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Essential Expenses (50%)</span>
              <span className="text-sm font-medium text-neutral-800">
                ${budgetData ? budgetData.essentials.toFixed(2) : "0"}
              </span>
            </div>
            <p className="text-xs text-neutral-500">Housing, food, utilities, transport</p>
          </div>
          
          <div className="bg-neutral-50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Savings (30%)</span>
              <span className="text-sm font-medium text-neutral-800">
                ${budgetData ? budgetData.savings.toFixed(2) : "0"}
              </span>
            </div>
            <p className="text-xs text-neutral-500">Emergency fund, investments, goals</p>
          </div>
          
          <div className="bg-neutral-50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Discretionary (20%)</span>
              <span className="text-sm font-medium text-neutral-800">
                ${budgetData ? budgetData.discretionary.toFixed(2) : "0"}
              </span>
            </div>
            <p className="text-xs text-neutral-500">Entertainment, dining out, hobbies</p>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <Button className="w-full bg-secondary-600 hover:bg-secondary-700 mb-2">
          Create Detailed Budget
        </Button>
        <a 
          href="https://www.nerdwallet.com/article/finance/how-to-budget" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-block mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center justify-center"
        >
          <Link2 className="h-3 w-3 mr-1" />
          Learn why this allocation works
        </a>
      </div>
    </div>
  );
};

export default BudgetCalculator;
