import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { PiggyBank, Calendar, TrendingUp, Target, Calculator } from "lucide-react";

export default function SavingsCalculator() {
  const [goalAmount, setGoalAmount] = useState<string>("10000");
  const [monthlySaving, setMonthlySaving] = useState<string>("500");
  const [currentSavings, setCurrentSavings] = useState<string>("0");
  const [interestRate, setInterestRate] = useState<string>("4");
  const [calculated, setCalculated] = useState(false);

  const calculate = () => {
    setCalculated(true);
  };

  const goal = parseFloat(goalAmount) || 0;
  const monthly = parseFloat(monthlySaving) || 0;
  const current = parseFloat(currentSavings) || 0;
  const rate = (parseFloat(interestRate) || 0) / 100 / 12;
  const remaining = goal - current;

  let monthsNeeded = 0;
  let totalContributions = current;
  let totalInterest = 0;

  if (monthly > 0 && remaining > 0) {
    if (rate > 0) {
      let balance = current;
      while (balance < goal && monthsNeeded < 600) {
        const interest = balance * rate;
        balance += monthly + interest;
        totalInterest += interest;
        monthsNeeded++;
      }
      totalContributions = current + (monthly * monthsNeeded);
    } else {
      monthsNeeded = Math.ceil(remaining / monthly);
      totalContributions = current + (monthly * monthsNeeded);
    }
  }

  const years = Math.floor(monthsNeeded / 12);
  const months = monthsNeeded % 12;
  const progressPercent = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
          Savings Goal Calculator
        </h1>
        <p className="text-neutral-600 text-lg">
          Find out how long it will take to reach your savings goal
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Enter Your Details
            </CardTitle>
            <CardDescription>
              Input your savings information to calculate your timeline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="goal">Savings Goal</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                <Input
                  id="goal"
                  type="number"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  className="pl-7"
                  placeholder="10000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current">Current Savings</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                <Input
                  id="current"
                  type="number"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(e.target.value)}
                  className="pl-7"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly">Monthly Savings Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                <Input
                  id="monthly"
                  type="number"
                  value={monthlySaving}
                  onChange={(e) => setMonthlySaving(e.target.value)}
                  className="pl-7"
                  placeholder="500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interest">Annual Interest Rate (optional)</Label>
              <div className="relative">
                <Input
                  id="interest"
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="pr-7"
                  placeholder="4"
                  step="0.1"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">%</span>
              </div>
              <p className="text-xs text-neutral-500">
                High-yield savings accounts currently offer 4-5% APY
              </p>
            </div>

            <Button onClick={calculate} className="w-full" size="lg">
              <Target className="mr-2 h-4 w-4" />
              Calculate Timeline
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Time to Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthly > 0 && remaining > 0 ? (
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary mb-2">
                    {years > 0 ? `${years}y ${months}m` : `${months} months`}
                  </div>
                  <p className="text-neutral-600">
                    to save {formatCurrency(goal)}
                  </p>
                </div>
              ) : remaining <= 0 ? (
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    Goal Already Reached!
                  </div>
                  <p className="text-neutral-600">
                    You have {formatCurrency(current)} saved
                  </p>
                </div>
              ) : (
                <div className="text-center text-neutral-500">
                  Enter your monthly savings to see timeline
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-primary" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Current: {formatCurrency(current)}</span>
                  <span>Goal: {formatCurrency(goal)}</span>
                </div>
                <Progress value={progressPercent} className="h-3" />
                <p className="text-center text-sm text-neutral-500 mt-2">
                  {progressPercent.toFixed(1)}% of goal reached
                </p>
              </div>
            </CardContent>
          </Card>

          {calculated && monthly > 0 && remaining > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Total Contributions</span>
                    <span className="font-semibold">{formatCurrency(totalContributions)}</span>
                  </div>
                  {rate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Interest Earned</span>
                      <span className="font-semibold text-green-600">+{formatCurrency(totalInterest)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-neutral-600">Final Amount</span>
                    <span className="font-bold text-primary">{formatCurrency(totalContributions + totalInterest)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Tips to Save Faster</h3>
              <ul className="text-sm text-neutral-600 space-y-2">
                <li>• Set up automatic transfers on payday</li>
                <li>• Use a high-yield savings account (4-5% APY)</li>
                <li>• Round up purchases and save the difference</li>
                <li>• Review and cut unused subscriptions monthly</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
