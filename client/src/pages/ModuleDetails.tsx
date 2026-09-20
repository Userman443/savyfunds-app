import React, { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  BookOpen,
  Video,
  FileQuestion,
  CheckCircle,
  BookMarked,
  Clock,
  Award,
  ArrowRight,
  Play
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { moduleLevels } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import { Module, UserProgress } from "@shared/schema";

// Skeleton loader for the module details page
const ModuleSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-64" />
          <div className="flex space-x-2 mt-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-full max-w-md mt-2" />
        </div>
        <Skeleton className="h-32 w-48" />
      </div>
      
      <div className="mt-6 space-y-4">
        <div className="flex space-x-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    </div>
  );
};

const ArticleContent = ({ content }: { content?: string }) => (
  <div className="prose prose-neutral max-w-none">
    {content ? (
      <ReactMarkdown>
        {content}
      </ReactMarkdown>
    ) : (
      <div className="text-center py-8">
        <p className="text-neutral-500">No content available for this module.</p>
      </div>
    )}
    
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
      <h4 className="text-blue-700 font-medium">Pro Tip</h4>
      <p className="text-blue-600">Review your emergency fund regularly. As your life circumstances change (new job, house, family members), your emergency fund target may need to be adjusted.</p>
    </div>
  </div>
);

const VideoContent = ({ title }: { title: string }) => (
  <div className="space-y-6">
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-white">
        <div className="text-center p-4">
          <Play className="h-16 w-16 mx-auto mb-4 opacity-70" />
          <p className="text-xl">This would be a video player in the real application</p>
          <p className="text-neutral-400">Educational video content about {title}</p>
        </div>
      </div>
    </div>
    
    <div className="prose prose-neutral max-w-none">
      <h3>Video Transcript</h3>
      <p>Hello and welcome to our lesson on Emergency Fund Basics! I'm Alex, and today we're going to talk about one of the most important aspects of financial security: having an emergency fund.</p>
      
      <p>What exactly is an emergency fund? Simply put, it's money you set aside specifically for unexpected expenses or financial emergencies. Think of it as a financial safety net that can catch you when life throws its inevitable curveballs.</p>
      
      <p>Most financial experts recommend having 3-6 months of essential living expenses saved in your emergency fund. This includes your rent or mortgage, utilities, food, transportation, insurance, and minimum debt payments.</p>
      
      <p>Now, I know that might sound like a lot, especially if you're just starting out or if you're currently living paycheck to paycheck. But don't worry! Building an emergency fund is a marathon, not a sprint. Starting with even a small goal, like $500 or $1,000, can make a big difference in your financial security.</p>
      
      <p>When it comes to where you should keep your emergency fund, the key is making sure it's both safe and accessible. A high-yield savings account is often the best option, as it keeps your money liquid (meaning you can access it quickly) while still earning some interest.</p>
      
      <p>Throughout this video, we'll discuss specific strategies for building your emergency fund, the types of emergencies it should be used for, and how to replenish it if you do need to use it. Stay tuned!</p>
    </div>
  </div>
);

const QuizContent = ({ 
  answers, 
  quizResults,
  setAnswers,
  setQuizResults,
  handleUpdateProgress
}: { 
  answers: any, 
  quizResults: any,
  setAnswers: (answers: any) => void,
  setQuizResults: (results: any) => void,
  handleUpdateProgress: (increment?: number) => void
}) => {
  // The correct answers for the quiz
  const correctAnswers = {
    q1: "q1b", // 3-6 months of expenses
    q2: "q2c", // high-yield savings account
    q3: "q3c", // vacation
    q4: "q4b"  // $1,000
  };
  
  const handleAnswerChange = (question: string, value: string) => {
    setAnswers((prev: any) => ({
      ...prev,
      [question]: value
    }));
  };
  
  const checkAnswers = () => {
    let score = 0;
    const feedback: Record<string, {correct: boolean; feedback: string}> = {};
    
    // Check each answer
    if (answers.q1 === correctAnswers.q1) {
      score++;
      feedback.q1 = {
        correct: true,
        feedback: "Correct! Financial experts typically recommend keeping 3-6 months of essential expenses in your emergency fund."
      };
    } else {
      feedback.q1 = {
        correct: false,
        feedback: "Incorrect. Financial experts typically recommend keeping 3-6 months of essential expenses in your emergency fund."
      };
    }
    
    if (answers.q2 === correctAnswers.q2) {
      score++;
      feedback.q2 = {
        correct: true,
        feedback: "Correct! A high-yield savings account provides both safety and liquidity for your emergency fund."
      };
    } else {
      feedback.q2 = {
        correct: false,
        feedback: "Incorrect. A high-yield savings account provides both safety and liquidity for your emergency fund."
      };
    }
    
    if (answers.q3 === correctAnswers.q3) {
      score++;
      feedback.q3 = {
        correct: true,
        feedback: "Correct! Vacations are planned expenses and should not come from your emergency fund."
      };
    } else {
      feedback.q3 = {
        correct: false,
        feedback: "Incorrect. Vacations are planned expenses and should not come from your emergency fund."
      };
    }
    
    if (answers.q4 === correctAnswers.q4) {
      score++;
      feedback.q4 = {
        correct: true,
        feedback: "Correct! $1,000 is often recommended as a good first milestone for an emergency fund."
      };
    } else {
      feedback.q4 = {
        correct: false,
        feedback: "Incorrect. $1,000 is often recommended as a good first milestone for an emergency fund."
      };
    }
    
    setQuizResults({
      submitted: true,
      score,
      feedback
    });
    
    // If the quiz is completed, update progress
    if (score >= 3) {
      handleUpdateProgress(25);
    }
  };
  
  return (
    <div className="space-y-8">
      <p className="text-neutral-600">Test your knowledge about emergency funds with this short quiz. Select the best answer for each question below.</p>
      
      <div className="space-y-6">
        <div className={`bg-white border ${quizResults.submitted && quizResults.feedback.q1 ? (quizResults.feedback.q1.correct ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50") : "border-neutral-200"} rounded-lg p-6`}>
          <h3 className="font-medium text-lg mb-4">1. What is the recommended size for an emergency fund?</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input 
                type="radio" 
                id="q1a" 
                name="q1" 
                className="w-4 h-4 text-primary-600" 
                checked={answers.q1 === "q1a"}
                onChange={() => handleAnswerChange("q1", "q1a")}
                disabled={quizResults.submitted}
              />
              <label htmlFor="q1a" className="text-neutral-700">1 month of expenses</label>
            </div>
            <div className="flex items-center space-x-3">
              <input 
                type="radio" 
                id="q1b" 
                name="q1" 
                className="w-4 h-4 text-primary-600" 
                checked={answers.q1 === "q1b"}
                onChange={() => handleAnswerChange("q1", "q1b")}
                disabled={quizResults.submitted}
              />
              <label htmlFor="q1b" className="text-neutral-700">3-6 months of expenses</label>
            </div>
            <div className="flex items-center space-x-3">
              <input 
                type="radio" 
                id="q1c" 
                name="q1" 
                className="w-4 h-4 text-primary-600" 
                checked={answers.q1 === "q1c"}
                onChange={() => handleAnswerChange("q1", "q1c")}
                disabled={quizResults.submitted}
              />
              <label htmlFor="q1c" className="text-neutral-700">12 months of expenses</label>
            </div>
            <div className="flex items-center space-x-3">
              <input 
                type="radio" 
                id="q1d" 
                name="q1" 
                className="w-4 h-4 text-primary-600" 
                checked={answers.q1 === "q1d"}
                onChange={() => handleAnswerChange("q1", "q1d")}
                disabled={quizResults.submitted}
              />
              <label htmlFor="q1d" className="text-neutral-700">$10,000 regardless of expenses</label>
            </div>
            
            {quizResults.submitted && quizResults.feedback.q1 && (
              <div className={`mt-3 p-3 rounded ${quizResults.feedback.q1.correct ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {quizResults.feedback.q1.feedback}
              </div>
            )}
          </div>
        </div>
        
        <div className={`bg-white border ${quizResults.submitted && quizResults.feedback.q2 ? (quizResults.feedback.q2.correct ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50") : "border-neutral-200"} rounded-lg p-6`}>
          <h3 className="font-medium text-lg mb-4">2. Where is the best place to keep an emergency fund?</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input 
                type="radio" 
                id="q2a" 
                name="q2" 
                className="w-4 h-4 text-primary-600" 
                checked={answers.q2 === "q2a"}
                onChange={() => handleAnswerChange("q2", "q2a")}
                disabled={quizResults.submitted}
              />
              <label htmlFor="q2a" className="text-neutral-700">Invested in stocks</label>
            </div>
            <div className="flex items-center space-x-3">
              <input 
                type="radio" 
                id="q2b" 
                name="q2" 
                className="w-4 h-4 text-primary-600" 
                checked={answers.q2 === "q2b"}
                onChange={() => handleAnswerChange("q2", "q2b")}
                disabled={quizResults.submitted}
              />
              <label htmlFor="q2b" className="text-neutral-700">In a safe at home</label>
            </div>
            <div className="flex items-center space-x-3">
              <input 
                type="radio" 
                id="q2c" 
                name="q2" 
                className="w-4 h-4 text-primary-600" 
                checked={answers.q2 === "q2c"}
                onChange={() => handleAnswerChange("q2", "q2c")}
                disabled={quizResults.submitted}
              />
              <label htmlFor="q2c" className="text-neutral-700">In a high-yield savings account</label>
            </div>
            <div className="flex items-center space-x-3">
              <input 
                type="radio" 
                id="q2d" 
                name="q2" 
                className="w-4 h-4 text-primary-600" 
                checked={answers.q2 === "q2d"}
                onChange={() => handleAnswerChange("q2", "q2d")}
                disabled={quizResults.submitted}
              />
              <label htmlFor="q2d" className="text-neutral-700">In a 10-year CD</label>
            </div>
            
            {quizResults.submitted && quizResults.feedback.q2 && (
              <div className={`mt-3 p-3 rounded ${quizResults.feedback.q2.correct ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {quizResults.feedback.q2.feedback}
              </div>
            )}
          </div>
        </div>
        
        <div className={`bg-white border ${quizResults.submitted && quizResults.feedback.q3 ? (quizResults.feedback.q3.correct ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50") : "border-neutral-200"} rounded-lg p-6`}>
          <h3 className="font-medium text-lg mb-4">3. Which of the following is NOT typically considered an appropriate use of emergency funds?</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input 
                type="radio" 
                id="q3a" 
                name="q3" 
                className="w-4 h-4 text-primary-600" 
                checked={answers.q3 === "q3a"}
                onChange={() => handleAnswerChange("q3", "q3a")}
                disabled={quizResults.submitted}
              />
              <label htmlFor="q3a" className="text-neutral-700">Medical emergency</label>
            </div>
            <div className="flex items-center space-x-3">
              <input 
                type="radio" 
                id="q3b" 
                name="q3" 
                className="w-4 h-4 text-primary-600" 
                checked={answers.q3 === "q3b"}
                onChange={() => handleAnswerChange("q3", "q3b")}
                disabled={quizResults.submitted}
              />
              <label htmlFor="q3b" className="text-neutral-700">Car repair</label>
            </div>
            <div className="flex items-center space-x-3">
              <input 
                type="radio" 
                id="q3c" 
                name="q3" 
                className="w-4 h-4 text-primary-600" 
                checked={answers.q3 === "q3c"}
                onChange={() => handleAnswerChange("q3", "q3c")}
                disabled={quizResults.submitted}
              />
              <label htmlFor="q3c" className="text-neutral-700">Vacation</label>
            </div>
            <div className="flex items-center space-x-3">
              <input 
                type="radio" 
                id="q3d" 
                name="q3" 
                className="w-4 h-4 text-primary-600" 
                checked={answers.q3 === "q3d"}
                onChange={() => handleAnswerChange("q3", "q3d")}
                disabled={quizResults.submitted}
              />
              <label htmlFor="q3d" className="text-neutral-700">Unexpected home repair</label>
            </div>
            
            {quizResults.submitted && quizResults.feedback.q3 && (
              <div className={`mt-3 p-3 rounded ${quizResults.feedback.q3.correct ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {quizResults.feedback.q3.feedback}
              </div>
            )}
          </div>
        </div>
        
        <div className={`bg-white border ${quizResults.submitted && quizResults.feedback.q4 ? (quizResults.feedback.q4.correct ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50") : "border-neutral-200"} rounded-lg p-6`}>
          <h3 className="font-medium text-lg mb-4">4. What is a good first milestone for an emergency fund if you're just starting out?</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input 
                type="radio" 
                id="q4a" 
                name="q4" 
                className="w-4 h-4 text-primary-600" 
                checked={answers.q4 === "q4a"}
                onChange={() => handleAnswerChange("q4", "q4a")}
                disabled={quizResults.submitted}
              />
              <label htmlFor="q4a" className="text-neutral-700">$100</label>
            </div>
            <div className="flex items-center space-x-3">
              <input 
                type="radio" 
                id="q4b" 
                name="q4" 
                className="w-4 h-4 text-primary-600" 
                checked={answers.q4 === "q4b"}
                onChange={() => handleAnswerChange("q4", "q4b")}
                disabled={quizResults.submitted}
              />
              <label htmlFor="q4b" className="text-neutral-700">$1,000</label>
            </div>
            <div className="flex items-center space-x-3">
              <input 
                type="radio" 
                id="q4c" 
                name="q4" 
                className="w-4 h-4 text-primary-600" 
                checked={answers.q4 === "q4c"}
                onChange={() => handleAnswerChange("q4", "q4c")}
                disabled={quizResults.submitted}
              />
              <label htmlFor="q4c" className="text-neutral-700">$5,000</label>
            </div>
            <div className="flex items-center space-x-3">
              <input 
                type="radio" 
                id="q4d" 
                name="q4" 
                className="w-4 h-4 text-primary-600" 
                checked={answers.q4 === "q4d"}
                onChange={() => handleAnswerChange("q4", "q4d")}
                disabled={quizResults.submitted}
              />
              <label htmlFor="q4d" className="text-neutral-700">1 full month of expenses</label>
            </div>
            
            {quizResults.submitted && quizResults.feedback.q4 && (
              <div className={`mt-3 p-3 rounded ${quizResults.feedback.q4.correct ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {quizResults.feedback.q4.feedback}
              </div>
            )}
          </div>
        </div>
        
        {quizResults.submitted && (
          <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center">
            <h3 className="font-medium text-lg mb-2">Your Score: {quizResults.score}/4</h3>
            <p className="text-neutral-600 mb-4">
              {quizResults.score >= 3 
                ? "Great job! You have a good understanding of emergency funds." 
                : "Keep learning! Review the material and try again to improve your knowledge."}
            </p>
            
            {quizResults.score >= 3 && (
              <Badge className="mx-auto" variant="success">
                <CheckCircle className="h-4 w-4 mr-1" />
                Quiz Completed
              </Badge>
            )}
          </div>
        )}
        
        {!quizResults.submitted && (
          <Button 
            onClick={checkAnswers}
            disabled={!answers.q1 || !answers.q2 || !answers.q3 || !answers.q4}
            className="w-full"
          >
            Check Answers
          </Button>
        )}
      </div>
    </div>
  );
};

const InteractiveContent = ({ 
  expenses, 
  currentSavings,
  monthlySavings,
  planSaved,
  setExpenses,
  setCurrentSavings,
  setMonthlySavings,
  setPlanSaved,
  handleUpdateProgress,
  toast
}: { 
  expenses: any, 
  currentSavings: number,
  monthlySavings: number,
  planSaved: boolean,
  setExpenses: (fn: (prev: any) => any) => void,
  setCurrentSavings: (value: number) => void,
  setMonthlySavings: (value: number) => void,
  setPlanSaved: (value: boolean) => void,
  handleUpdateProgress: (increment?: number) => void,
  toast: any
}) => {
  // Calculate total monthly expenses
  const totalMonthlyExpenses = useMemo(() => {
    return Object.values(expenses).reduce((sum: number, value: number) => sum + (value || 0), 0);
  }, [expenses]);
  
  // Calculate emergency fund targets
  const threeMonthTarget = useMemo(() => totalMonthlyExpenses * 3, [totalMonthlyExpenses]);
  const sixMonthTarget = useMemo(() => totalMonthlyExpenses * 6, [totalMonthlyExpenses]);
  
  // Calculate amounts needed
  const amountNeededForThreeMonths = useMemo(() => 
    Math.max(0, threeMonthTarget - currentSavings), 
    [threeMonthTarget, currentSavings]
  );
  
  const amountNeededForSixMonths = useMemo(() => 
    Math.max(0, sixMonthTarget - currentSavings), 
    [sixMonthTarget, currentSavings]
  );
  
  // Calculate time to reach targets (in months)
  const timeToReachThreeMonths = useMemo(() => 
    monthlySavings > 0 ? Math.ceil(amountNeededForThreeMonths / monthlySavings) : 0, 
    [amountNeededForThreeMonths, monthlySavings]
  );
  
  const timeToReachSixMonths = useMemo(() => 
    monthlySavings > 0 ? Math.ceil(amountNeededForSixMonths / monthlySavings) : 0, 
    [amountNeededForSixMonths, monthlySavings]
  );
  
  // Input validation
  const validateNumberInput = (value: string): boolean => {
    return /^\d*\.?\d*$/.test(value);
  };
  
  // Handle expense changes
  const handleExpenseChange = (type: keyof typeof expenses, valueStr: string) => {
    if (validateNumberInput(valueStr)) {
      const numValue = parseFloat(valueStr) || 0;
      setExpenses((prev: any) => ({
        ...prev,
        [type]: numValue
      }));
      // Reset saved state when changes are made
      setPlanSaved(false);
    }
  };
  
  // Handle saving the plan
  const handleSavePlan = () => {
    try {
      // Structure the plan data
      const planData = {
        expenses,
        totalMonthlyExpenses,
        threeMonthTarget,
        sixMonthTarget,
        currentSavings,
        monthlySavings,
        timeToReachThreeMonths,
        timeToReachSixMonths,
        savedAt: new Date().toISOString()
      };
      
      // Save to localStorage
      localStorage.setItem('emergencyFundPlan', JSON.stringify(planData));
      
      // Update progress and show that the plan is saved
      setPlanSaved(true);
      handleUpdateProgress(25);
      
      toast({
        title: "Plan saved successfully!",
        description: "Your emergency fund plan has been saved. You can access it anytime from your dashboard.",
      });
    } catch (error) {
      console.error("Error saving plan:", error);
      toast({
        variant: "destructive",
        title: "Error saving plan",
        description: "There was a problem saving your plan. Please try again.",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <p className="text-neutral-600">This interactive activity will help you calculate your personal emergency fund target and create a plan to reach it.</p>
      
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h3 className="font-medium text-lg mb-4">Calculate Your Target Emergency Fund</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Monthly Housing (Rent/Mortgage)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
              <input
                type="text"
                className="light-theme-input w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-black"
                placeholder="0"
                value={expenses.housing || ''}
                onChange={(e) => handleExpenseChange('housing', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Monthly Utilities
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
              <input
                type="text"
                className="light-theme-input w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-black"
                placeholder="0"
                value={expenses.utilities || ''}
                onChange={(e) => handleExpenseChange('utilities', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Monthly Food Expenses
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
              <input
                type="text"
                className="light-theme-input w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-black"
                placeholder="0"
                value={expenses.food || ''}
                onChange={(e) => handleExpenseChange('food', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Monthly Transportation
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
              <input
                type="text"
                className="light-theme-input w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-black"
                placeholder="0"
                value={expenses.transportation || ''}
                onChange={(e) => handleExpenseChange('transportation', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Monthly Insurance Premiums
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
              <input
                type="text"
                className="light-theme-input w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-black"
                placeholder="0"
                value={expenses.insurance || ''}
                onChange={(e) => handleExpenseChange('insurance', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Monthly Minimum Debt Payments
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
              <input
                type="text"
                className="light-theme-input w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-black"
                placeholder="0"
                value={expenses.debt || ''}
                onChange={(e) => handleExpenseChange('debt', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Other Essential Monthly Expenses
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
              <input
                type="text"
                className="light-theme-input w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-black"
                placeholder="0"
                value={expenses.other || ''}
                onChange={(e) => handleExpenseChange('other', e.target.value)}
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-neutral-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Monthly Total:</span>
              <span className="font-medium">${totalMonthlyExpenses.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">3-Month Emergency Fund Target:</span>
              <span className="font-medium">${threeMonthTarget.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">6-Month Emergency Fund Target:</span>
              <span className="font-medium">${sixMonthTarget.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h3 className="font-medium text-lg mb-4">Create Your Savings Plan</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Current Emergency Savings
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
              <input
                type="text"
                className="light-theme-input w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-black"
                placeholder="0"
                value={currentSavings || ''}
                onChange={(e) => {
                  if (validateNumberInput(e.target.value)) {
                    setCurrentSavings(parseFloat(e.target.value) || 0);
                    setPlanSaved(false);
                  }
                }}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              How Much Can You Save Monthly
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
              <input
                type="text"
                className="light-theme-input w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-black"
                placeholder="0"
                value={monthlySavings || ''}
                onChange={(e) => {
                  if (validateNumberInput(e.target.value)) {
                    setMonthlySavings(parseFloat(e.target.value) || 0);
                    setPlanSaved(false);
                  }
                }}
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-neutral-200">
            <h4 className="font-medium mb-3">Your Emergency Fund Plan:</h4>
            
            <div className="space-y-4">
              <div>
                <p className="mb-1">3-Month Emergency Fund Target: <strong>${threeMonthTarget.toLocaleString()}</strong></p>
                <p className="text-sm text-neutral-600 mb-2">
                  You need: <strong>${amountNeededForThreeMonths.toLocaleString()}</strong> more to reach this target
                </p>
                {monthlySavings > 0 && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm text-primary-700">
                      {timeToReachThreeMonths > 0 
                        ? `You'll reach this goal in ${timeToReachThreeMonths} month${timeToReachThreeMonths === 1 ? '' : 's'}`
                        : `You've already reached this goal!`}
                    </span>
                  </div>
                )}
              </div>
              
              <div>
                <p className="mb-1">6-Month Emergency Fund Target: <strong>${sixMonthTarget.toLocaleString()}</strong></p>
                <p className="text-sm text-neutral-600 mb-2">
                  You need: <strong>${amountNeededForSixMonths.toLocaleString()}</strong> more to reach this target
                </p>
                {monthlySavings > 0 && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm text-primary-700">
                      {timeToReachSixMonths > 0 
                        ? `You'll reach this goal in ${timeToReachSixMonths} month${timeToReachSixMonths === 1 ? '' : 's'}`
                        : `You've already reached this goal!`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleSavePlan} 
            disabled={planSaved || totalMonthlyExpenses === 0}
          >
            {planSaved ? (
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Plan Saved</span>
              </div>
            ) : "Save Your Emergency Fund Plan"}
          </Button>
          
          {planSaved && (
            <div className="flex justify-center">
              <Badge variant="outline" className="bg-green-50 text-green-800">
                <Award className="h-4 w-4 mr-1" />
                <div className="flex items-center space-x-1">
                  <span>Activity Completed</span>
                </div>
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ResourcesContent = () => (
  <div className="bg-card p-6 border rounded-md">
    <h2 className="text-2xl font-bold mb-4">Additional Resources</h2>
    
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <BookMarked className="h-5 w-5 mr-2 text-primary" />
          Further Reading
        </h3>
        
        <ul className="space-y-2">
          <li>
            <a 
              href="https://www.investopedia.com/terms/e/emergency_fund.asp" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-primary hover:underline"
            >
              Investopedia: Emergency Fund Guide
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </a>
          </li>
          <li>
            <a 
              href="https://www.nerdwallet.com/article/banking/emergency-fund-calculator" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-primary hover:underline"
            >
              NerdWallet: Emergency Fund Calculator
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </a>
          </li>
          <li>
            <a 
              href="https://www.consumerfinance.gov/start-small-save-up/start-saving/" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-primary hover:underline"
            >
              CFPB: Building Your Savings
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </a>
          </li>
        </ul>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <Video className="h-5 w-5 mr-2 text-primary" />
          Related Videos
        </h3>
        
        <ul className="space-y-2">
          <li>
            <a 
              href="https://www.youtube.com/watch?v=fVToMS2Q3XQ" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-primary hover:underline"
            >
              How Much Should Your Emergency Fund Be?
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </a>
          </li>
          <li>
            <a 
              href="https://www.youtube.com/watch?v=xfQFHX2rPD4" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-primary hover:underline"
            >
              Building an Emergency Fund From Scratch
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
);

// Main ModuleDetails component
const ModuleDetails = () => {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const moduleId = parseInt(id as string);
  const [activeTab, setActiveTab] = useState("content");
  
  // Get current user
  const { data: user = { id: null, username: "", displayName: "", level: 1, isPremium: false } } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });
  
  // State for interactive component
  const [expenses, setExpenses] = useState({
    housing: 0,
    utilities: 0,
    food: 0,
    transportation: 0,
    insurance: 0,
    debt: 0,
    other: 0
  });
  const [currentSavings, setCurrentSavings] = useState(0);
  const [monthlySavings, setMonthlySavings] = useState(0);
  const [planSaved, setPlanSaved] = useState(false);
  
  // State for quiz component
  const [answers, setAnswers] = useState({
    q1: "",
    q2: "",
    q3: "",
    q4: ""
  });
  const [quizResults, setQuizResults] = useState({
    submitted: false,
    score: 0,
    feedback: {}
  });
  
  // Fetch module details
  const { data: module, isLoading: moduleLoading } = useQuery<Module>({
    queryKey: ["/api/modules", moduleId],
    queryFn: async () => {
      if (isNaN(moduleId)) return null as any;
      const response = await apiRequest("GET", `/api/modules/${moduleId}`);
      return await response.json();
    },
    enabled: !isNaN(moduleId),
  });
  
  // Fetch user progress for this module
  const { data: userProgress, isLoading: progressLoading } = useQuery<UserProgress | null>({
    queryKey: ["/api/progress", user?.id, moduleId],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        const response = await apiRequest("GET", `/api/progress/${user.id}`);
        const data = await response.json();
        
        // Find progress for this specific module
        return data.find((p: any) => p.moduleId === moduleId) || null;
      } catch (error) {
        console.error("Error fetching progress:", error);
        return null;
      }
    },
    enabled: !isNaN(moduleId) && !!user?.id,
  });
  
  // Create progress if it doesn't exist
  const createProgressMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const response = await apiRequest("POST", "/api/progress", {
        userId: user.id,
        moduleId,
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress", user?.id, moduleId] });
      toast({
        title: "Progress tracking started",
        description: "Your progress for this module is now being tracked",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start progress tracking",
      });
    },
  });
  
  // Update progress
  const updateProgressMutation = useMutation({
    mutationFn: async ({ id, percentComplete, completed }: { id: number, percentComplete: number, completed: boolean }) => {
      const response = await apiRequest("PUT", `/api/progress/${id}`, {
        percentComplete,
        completed,
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress", user?.id, moduleId] });
      
      if (data.completed) {
        toast({
          title: "Module completed! 🎉",
          description: "Great job! You've completed this module.",
        });
      } else {
        toast({
          title: "Progress updated",
          description: `Your progress is now at ${data.percentComplete}%`,
        });
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update progress",
      });
    },
  });
  
  // Handle marking progress
  const handleUpdateProgress = (increment: number = 25) => {
    if (!userProgress) {
      createProgressMutation.mutate();
      return;
    }
    
    const newPercentComplete = Math.min(100, (userProgress.percentComplete || 0) + increment);
    const completed = newPercentComplete === 100;
    
    updateProgressMutation.mutate({
      id: userProgress.id,
      percentComplete: newPercentComplete,
      completed,
    });
  };
  
  if (moduleLoading) {
    return (
      <>
        <Navbar user={user} />
        <main className="container mx-auto px-4 md:px-6 py-6">
          <ModuleSkeleton />
        </main>
        <Footer />
      </>
    );
  }
  
  if (!module) {
    return (
      <>
        <Navbar user={user} />
        <main className="container mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col items-center justify-center py-12">
            <h1 className="text-2xl font-bold mb-2">Module not found</h1>
            <p className="text-neutral-600 mb-6">The module you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => setLocation("/learn")}>
              Back to Learning Center
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }
  
  const level = module.level;
  const levelColor = moduleLevels[level as keyof typeof moduleLevels]?.color || "primary";
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "article":
        return <BookOpen className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      case "quiz":
        return <FileQuestion className="h-5 w-5" />;
      case "interactive":
      case "activity":
        return <Play className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "article":
        return "Article";
      case "video":
        return "Video";
      case "quiz":
        return "Quiz";
      case "interactive":
        return "Interactive";
      case "activity":
        return "Activity";
      default:
        return "Lesson";
    }
  };
  
  // Render module content based on type - NO conditional hooks here
  const renderModuleContent = () => {
    if (!module) return null;
    
    if (module.type === "article") {
      return <ArticleContent content={module.content} />;
    }
    
    if (module.type === "video") {
      return <VideoContent title={module.title} />;
    }
    
    if (module.type === "quiz") {
      return (
        <QuizContent 
          answers={answers}
          quizResults={quizResults}
          setAnswers={setAnswers}
          setQuizResults={setQuizResults}
          handleUpdateProgress={handleUpdateProgress}
        />
      );
    }
    
    if (module.type === "interactive" || module.type === "activity") {
      return (
        <InteractiveContent
          expenses={expenses}
          currentSavings={currentSavings}
          monthlySavings={monthlySavings}
          planSaved={planSaved}
          setExpenses={setExpenses}
          setCurrentSavings={setCurrentSavings}
          setMonthlySavings={setMonthlySavings}
          setPlanSaved={setPlanSaved}
          handleUpdateProgress={handleUpdateProgress}
          toast={toast}
        />
      );
    }
    
    return (
      <div className="prose prose-neutral max-w-none">
        <p className="text-center py-8 text-neutral-500">No content available for this module type.</p>
      </div>
    );
  };
  
  return (
    <>
      <Navbar user={user} />
      <main className="container mx-auto px-4 md:px-6 py-6">
        <div className="mb-8">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <div>
              <Button variant="ghost" size="sm" className="mb-4" onClick={() => setLocation("/learn")}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Learning Center
              </Button>
              
              <h1 className="text-3xl font-bold mb-2">{module.title}</h1>
              
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="outline" className={`text-${levelColor} border-${levelColor}`}>
                  {moduleLevels[level as keyof typeof moduleLevels]?.label || "Beginner"}
                </Badge>
                
                <Badge variant="outline" className="flex items-center">
                  {getTypeIcon(module.type)}
                  <span className="ml-1">{getTypeLabel(module.type)}</span>
                </Badge>
                
                <Badge variant="outline" className="flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  {module.estimatedTime || "15-30"} mins
                </Badge>
              </div>
              
              <p className="text-neutral-600">{module.description}</p>
            </div>
            
            <div className="min-w-[200px]">
              {!progressLoading && (
                <div className="bg-white border border-neutral-200 rounded-md p-4 w-full text-center">
                  <h3 className="font-semibold mb-2">Your Progress</h3>
                  
                  <div className="mb-3">
                    <Progress value={userProgress?.percentComplete || 0} className="h-2" />
                  </div>
                  
                  <p className="text-sm text-neutral-600 mb-4">
                    {userProgress?.completed 
                      ? "Module completed!" 
                      : userProgress 
                        ? `${userProgress.percentComplete}% complete` 
                        : "Not started"
                    }
                  </p>
                  
                  {!userProgress && (
                    <Button onClick={() => handleUpdateProgress(25)} size="sm" className="w-full">
                      Start Module
                    </Button>
                  )}
                  
                  {userProgress && !userProgress.completed && (
                    <Button onClick={() => handleUpdateProgress(25)} size="sm" className="w-full">
                      Mark Progress
                    </Button>
                  )}
                  
                  {userProgress?.completed && (
                    <Badge variant="success" className="w-full justify-center py-1">
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Completed
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <Tabs defaultValue="content" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="bg-card p-6 border rounded-md mt-4">
              {renderModuleContent()}
            </TabsContent>
            
            <TabsContent value="resources" className="mt-4">
              <ResourcesContent />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ModuleDetails;