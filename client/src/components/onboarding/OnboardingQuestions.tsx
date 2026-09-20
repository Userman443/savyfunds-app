import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, ArrowRight, Award, Brain, TrendingUp, Lightbulb } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "The popular '50/30/20' budgeting rule divides your take-home pay into which three categories?",
    options: [
      "50% savings, 30% debt, 20% spending",
      "50% needs, 30% wants, 20% savings/debt repayment",
      "50% tax, 30% rent, 20% everything else",
      "50% investments, 30% needs, 20% entertainment",
    ],
    correctIndex: 1,
    explanation:
      "The 50/30/20 rule allocates 50% to needs (rent, food, bills), 30% to wants (dining out, hobbies), and 20% to savings and debt repayment.",
    topic: "Budgeting",
  },
  {
    id: 2,
    text: "Financial experts generally recommend your emergency fund should cover how many months of living expenses?",
    options: ["1–2 months", "2–3 months", "3–6 months", "10–12 months"],
    correctIndex: 2,
    explanation:
      "A 3–6 month emergency fund is the standard recommendation. It covers unexpected job loss, medical bills, or major repairs without going into debt.",
    topic: "Saving",
  },
  {
    id: 3,
    text: "What best describes 'compound interest'?",
    options: [
      "Interest charged on credit card late payments",
      "Interest earned only on your original deposit",
      "Interest earned on both your principal and previously accumulated interest",
      "A fixed interest rate that never changes",
    ],
    correctIndex: 2,
    explanation:
      "Compound interest is often called 'interest on interest.' Over time it grows exponentially — which is great for savings and investments, but costly for debt.",
    topic: "Interest & Growth",
  },
  {
    id: 4,
    text: "Which debt payoff strategy saves the most money on total interest paid?",
    options: [
      "Snowball method — pay smallest balance first",
      "Avalanche method — pay highest interest rate first",
      "Minimum payments on all debts equally",
      "Consolidating all debts into one loan regardless of terms",
    ],
    correctIndex: 1,
    explanation:
      "The avalanche method targets high-interest debt first, minimising total interest paid. The snowball method builds motivation but costs more in interest overall.",
    topic: "Debt Management",
  },
  {
    id: 5,
    text: "Your credit utilisation ratio is best described as:",
    options: [
      "How many credit cards you own",
      "How many times you use your card each month",
      "The percentage of your available credit limit currently in use",
      "Your credit score divided by your income",
    ],
    correctIndex: 2,
    explanation:
      "Credit utilisation = (total balances ÷ total credit limits) × 100. Keeping it below 30% is recommended; below 10% is ideal for a strong credit score.",
    topic: "Credit",
  },
  {
    id: 6,
    text: "What is the primary advantage of contributing enough to get your employer's full 401(k) match?",
    options: [
      "It guarantees your investments won't lose value",
      "You receive free additional money — your employer adds funds matching your contributions",
      "Your salary automatically increases each year",
      "You avoid paying income tax permanently",
    ],
    correctIndex: 1,
    explanation:
      "An employer match is essentially free money — a 100% instant return on that portion of your contribution. Not capturing the full match means leaving part of your compensation on the table.",
    topic: "Retirement",
  },
  {
    id: 7,
    text: "Historically, which asset class has delivered the highest long-term average annual returns?",
    options: [
      "High-yield savings accounts",
      "Government bonds (e.g. US Treasuries)",
      "Gold and precious metals",
      "Broadly diversified stocks (equities)",
    ],
    correctIndex: 3,
    explanation:
      "Global stocks have historically returned around 7–10% per year after inflation over the long term, outpacing bonds, gold, and cash — though with greater short-term volatility.",
    topic: "Investing",
  },
  {
    id: 8,
    text: "How does inflation affect money sitting in a zero-interest account over time?",
    options: [
      "It increases the real value of your savings",
      "It has no effect — cash always holds its value",
      "It erodes purchasing power — the same amount buys less each year",
      "It converts your savings into investments automatically",
    ],
    correctIndex: 2,
    explanation:
      "Inflation is the general rise in prices over time. If your savings earn less than the inflation rate, your money's real purchasing power shrinks even though the number in your account stays the same.",
    topic: "Inflation",
  },
];

interface LevelInfo {
  label: string;
  colorClasses: string;
  description: string;
  icon: React.ReactNode;
  suggestedPath: string;
}

function getLevel(score: number): LevelInfo {
  if (score <= 3) {
    return {
      label: "Beginner",
      colorClasses: "border-blue-300 bg-blue-50 text-blue-800",
      description:
        "You're at the start of your financial journey — and that's a great place to begin! We'll focus on foundational money habits: building a budget, starting an emergency fund, and understanding how interest works.",
      icon: <Lightbulb className="h-8 w-8 text-blue-500" />,
      suggestedPath: "Budgeting Basics → Building an Emergency Fund → Understanding Credit",
    };
  }
  if (score <= 6) {
    return {
      label: "Intermediate",
      colorClasses: "border-green-300 bg-green-50 text-green-800",
      description:
        "You have a solid grasp of everyday money management. We'll help you level up: diving into investing, optimising debt repayment, and building toward long-term wealth.",
      icon: <TrendingUp className="h-8 w-8 text-green-500" />,
      suggestedPath: "Debt Avalanche Strategy → Index Fund Investing → Tax-Advantaged Accounts",
    };
  }
  return {
    label: "Advanced",
    colorClasses: "border-purple-300 bg-purple-50 text-purple-800",
    description:
      "Impressive! You clearly understand financial fundamentals. We'll challenge you with advanced strategies: tax optimisation, portfolio construction, estate planning, and financial independence planning.",
    icon: <Brain className="h-8 w-8 text-purple-500" />,
    suggestedPath: "Tax-Loss Harvesting → FIRE Planning → Portfolio Rebalancing",
  };
}

interface Props {
  userId?: number;
}

export default function OnboardingQuestions({ userId }: Props) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [finished, setFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const question = QUESTIONS[currentQ];
  const progressPct = (currentQ / QUESTIONS.length) * 100;

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowExplanation(true);
  };

  const handleNext = async () => {
    const newAnswers = [...answers, selected!];
    setAnswers(newAnswers);

    if (currentQ + 1 >= QUESTIONS.length) {
      const score = newAnswers.filter((a, i) => a === QUESTIONS[i].correctIndex).length;
      setFinalScore(score);
      await saveResult(getLevel(score).label, newAnswers, score);
      setFinished(true);
    } else {
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setShowExplanation(false);
    }
  };

  const saveResult = async (level: string, finalAnswers: number[], score: number) => {
    setIsSaving(true);
    const responses = {
      experienceLevel: level,
      quizScore: score,
      quizTotal: QUESTIONS.length,
      answers: finalAnswers,
      completedAt: new Date().toISOString(),
    };
    try {
      if (userId) {
        await apiRequest("PUT", `/api/user/${userId}/complete-onboarding`, { responses });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      }
      localStorage.setItem("sf_literacy_level", level);
      localStorage.setItem("sf_onboarding_done", "true");
      localStorage.setItem("sf_quiz_score", String(score));
    } catch (err) {
      console.error("Failed to save onboarding result:", err);
      localStorage.setItem("sf_literacy_level", level);
    } finally {
      setIsSaving(false);
    }
  };

  const levelInfo = getLevel(finalScore);

  if (finished) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-3">{levelInfo.icon}</div>
            <div className="flex justify-center mb-3">
              <Award className="h-10 w-10 text-yellow-500" />
            </div>
            <CardTitle className="text-2xl font-bold">Assessment Complete!</CardTitle>
            <p className="text-muted-foreground mt-1">
              You scored{" "}
              <span className="font-bold text-primary">
                {finalScore}/{QUESTIONS.length}
              </span>{" "}
              — here&apos;s your financial literacy level:
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={`rounded-xl border-2 p-5 text-center ${levelInfo.colorClasses}`}>
              <Badge className={`text-base px-4 py-1 mb-3 ${levelInfo.colorClasses} border`}>
                {levelInfo.label}
              </Badge>
              <p className="text-sm leading-relaxed mt-2">{levelInfo.description}</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 tracking-wide">
                Your Suggested Learning Path
              </p>
              <p className="text-sm font-medium">{levelInfo.suggestedPath}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Topic Breakdown
              </p>
              {QUESTIONS.map((q, i) => (
                <div key={q.id} className="flex items-center gap-2 text-sm">
                  {answers[i] === q.correctIndex ? (
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                  )}
                  <span className="text-muted-foreground">{q.topic}</span>
                </div>
              ))}
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                window.location.href = "/dashboard";
              }}
              disabled={isSaving}
            >
              {isSaving ? "Saving your profile..." : "Go to My Dashboard"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>
            Question {currentQ + 1} of {QUESTIONS.length}
          </span>
          <span className="font-medium text-primary">{question.topic}</span>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg leading-snug">{question.text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {question.options.map((opt, idx) => {
            let extraClass =
              "w-full text-left px-4 py-3 rounded-lg border-2 text-sm transition-all ";

            if (selected === null) {
              extraClass += "hover:bg-primary/5 hover:border-primary/40 cursor-pointer border-border";
            } else if (idx === question.correctIndex) {
              extraClass += "border-green-500 bg-green-50 text-green-800 cursor-default";
            } else if (idx === selected) {
              extraClass += "border-red-400 bg-red-50 text-red-800 cursor-default";
            } else {
              extraClass += "opacity-40 cursor-default border-border";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={selected !== null}
                className={extraClass}
              >
                <span className="font-semibold mr-2 text-muted-foreground">
                  {String.fromCharCode(65 + idx)}.
                </span>
                {opt}
              </button>
            );
          })}

          {showExplanation && (
            <div
              className={`mt-4 p-4 rounded-lg border-l-4 text-sm ${
                selected === question.correctIndex
                  ? "border-green-500 bg-green-50"
                  : "border-orange-400 bg-orange-50"
              }`}
            >
              <p className="font-semibold mb-1">
                {selected === question.correctIndex
                  ? "Correct!"
                  : "Not quite — here's why:"}
              </p>
              <p className="text-muted-foreground">{question.explanation}</p>
            </div>
          )}

          {showExplanation && (
            <Button onClick={handleNext} className="w-full mt-2" size="lg">
              {currentQ + 1 >= QUESTIONS.length ? "See My Results" : "Next Question"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
