import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Calculator, TrendingDown, Zap, Snowflake, Plus, Trash2 } from "lucide-react";

type Debt = {
  id: number;
  name: string;
  balance: string;
  rate: string;
  minPayment: string;
};

export default function DebtCalculator() {
  const [debts, setDebts] = useState<Debt[]>([
    { id: 1, name: "Credit Card 1", balance: "5000", rate: "22", minPayment: "100" },
    { id: 2, name: "Personal Loan", balance: "10000", rate: "12", minPayment: "250" },
  ]);
  const [extraPayment, setExtraPayment] = useState<string>("200");
  const [strategy, setStrategy] = useState<"avalanche" | "snowball">("avalanche");
  const [calculated, setCalculated] = useState(false);

  const addDebt = () => {
    const newId = Math.max(...debts.map(d => d.id), 0) + 1;
    setDebts([...debts, { id: newId, name: `Debt ${newId}`, balance: "", rate: "", minPayment: "" }]);
  };

  const removeDebt = (id: number) => {
    setDebts(debts.filter(d => d.id !== id));
  };

  const updateDebt = (id: number, field: keyof Debt, value: string) => {
    setDebts(debts.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculatePayoff = (useStrategy: "avalanche" | "snowball") => {
    const extra = parseFloat(extraPayment) || 0;
    let debtList = debts
      .filter(d => parseFloat(d.balance) > 0)
      .map(d => ({
        ...d,
        currentBalance: parseFloat(d.balance),
        monthlyRate: (parseFloat(d.rate) || 0) / 100 / 12,
        minimum: parseFloat(d.minPayment) || 0,
      }));

    if (useStrategy === "avalanche") {
      debtList.sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));
    } else {
      debtList.sort((a, b) => a.currentBalance - b.currentBalance);
    }

    let months = 0;
    let totalInterest = 0;
    const maxMonths = 600;

    while (debtList.some(d => d.currentBalance > 0) && months < maxMonths) {
      months++;
      let extraAvailable = extra;

      for (const debt of debtList) {
        if (debt.currentBalance <= 0) continue;

        const interest = debt.currentBalance * debt.monthlyRate;
        totalInterest += interest;
        debt.currentBalance += interest;

        let payment = debt.minimum;
        if (debt === debtList.find(d => d.currentBalance > 0)) {
          payment += extraAvailable;
          extraAvailable = 0;
        }

        debt.currentBalance -= payment;
        if (debt.currentBalance < 0) {
          extraAvailable += Math.abs(debt.currentBalance);
          debt.currentBalance = 0;
        }
      }
    }

    return { months, totalInterest };
  };

  const totalDebt = debts.reduce((sum, d) => sum + (parseFloat(d.balance) || 0), 0);
  const totalMinPayment = debts.reduce((sum, d) => sum + (parseFloat(d.minPayment) || 0), 0);
  const extra = parseFloat(extraPayment) || 0;

  const avalancheResult = calculatePayoff("avalanche");
  const snowballResult = calculatePayoff("snowball");

  const selectedResult = strategy === "avalanche" ? avalancheResult : snowballResult;
  const years = Math.floor(selectedResult.months / 12);
  const months = selectedResult.months % 12;

  const minOnlyResult = (() => {
    let balance = totalDebt;
    let months = 0;
    let interest = 0;
    const avgRate = debts.length > 0 
      ? debts.reduce((sum, d) => sum + (parseFloat(d.rate) || 0), 0) / debts.length / 100 / 12
      : 0;
    
    while (balance > 0 && months < 600) {
      const monthInterest = balance * avgRate;
      interest += monthInterest;
      balance = balance + monthInterest - totalMinPayment;
      months++;
    }
    return { months, interest };
  })();

  const timeSaved = minOnlyResult.months - selectedResult.months;
  const interestSaved = minOnlyResult.interest - selectedResult.totalInterest;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
          Debt Payoff Calculator
        </h1>
        <p className="text-neutral-600 text-lg">
          Find the fastest and cheapest way to become debt-free
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Your Debts
              </CardTitle>
              <CardDescription>
                Enter all your debts to create a payoff plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {debts.map((debt, index) => (
                <div key={debt.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-neutral-50 rounded-lg">
                  <div className="col-span-12 md:col-span-3">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={debt.name}
                      onChange={(e) => updateDebt(debt.id, "name", e.target.value)}
                      placeholder="Debt name"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-3">
                    <Label className="text-xs">Balance ($)</Label>
                    <Input
                      type="number"
                      value={debt.balance}
                      onChange={(e) => updateDebt(debt.id, "balance", e.target.value)}
                      placeholder="5000"
                    />
                  </div>
                  <div className="col-span-3 md:col-span-2">
                    <Label className="text-xs">Rate (%)</Label>
                    <Input
                      type="number"
                      value={debt.rate}
                      onChange={(e) => updateDebt(debt.id, "rate", e.target.value)}
                      placeholder="22"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-3">
                    <Label className="text-xs">Min Payment ($)</Label>
                    <Input
                      type="number"
                      value={debt.minPayment}
                      onChange={(e) => updateDebt(debt.id, "minPayment", e.target.value)}
                      placeholder="100"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDebt(debt.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={addDebt} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Another Debt
              </Button>

              <div className="pt-4 border-t">
                <Label htmlFor="extra">Extra Monthly Payment</Label>
                <div className="flex gap-2 mt-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                    <Input
                      id="extra"
                      type="number"
                      value={extraPayment}
                      onChange={(e) => setExtraPayment(e.target.value)}
                      className="pl-7"
                      placeholder="200"
                    />
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Amount above minimum payments you can put toward debt
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Choose Your Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={strategy} onValueChange={(v) => setStrategy(v as "avalanche" | "snowball")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="avalanche" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Avalanche
                  </TabsTrigger>
                  <TabsTrigger value="snowball" className="flex items-center gap-2">
                    <Snowflake className="h-4 w-4" />
                    Snowball
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="avalanche" className="mt-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Debt Avalanche Method</h4>
                    <p className="text-sm text-green-700">
                      Pay off highest interest rate debts first. This method saves the most money on interest over time.
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="snowball" className="mt-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Debt Snowball Method</h4>
                    <p className="text-sm text-blue-700">
                      Pay off smallest balances first for quick wins. This method builds momentum and motivation.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-primary" />
                Debt-Free Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalDebt > 0 ? (
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary mb-2">
                    {years > 0 ? `${years}y ${months}m` : `${months} months`}
                  </div>
                  <p className="text-neutral-600">
                    to pay off {formatCurrency(totalDebt)}
                  </p>
                </div>
              ) : (
                <div className="text-center text-neutral-500">
                  Add your debts to see payoff timeline
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-600">Total Debt</span>
                <span className="font-semibold">{formatCurrency(totalDebt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Monthly Payment</span>
                <span className="font-semibold">{formatCurrency(totalMinPayment + extra)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Total Interest</span>
                <span className="font-semibold text-red-600">{formatCurrency(selectedResult.totalInterest)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Total Cost</span>
                  <span className="font-bold text-primary">{formatCurrency(totalDebt + selectedResult.totalInterest)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {extra > 0 && totalDebt > 0 && (
            <Card className="shadow-lg border-l-4 border-l-green-500 bg-green-50">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-green-800 mb-3">Your Savings</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Time Saved</span>
                    <span className="font-semibold text-green-800">
                      {Math.floor(timeSaved / 12)}y {timeSaved % 12}m faster
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Interest Saved</span>
                    <span className="font-semibold text-green-800">
                      {formatCurrency(interestSaved)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Tips to Pay Off Faster</h3>
              <ul className="text-sm text-neutral-600 space-y-2">
                <li>• Use windfalls (tax refunds, bonuses) for extra payments</li>
                <li>• Consider balance transfer to lower-rate cards</li>
                <li>• Cut expenses temporarily to boost debt payments</li>
                <li>• Avoid adding new debt while paying off existing</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
