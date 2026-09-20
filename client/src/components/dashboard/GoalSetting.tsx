import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, MoreHorizontal, Flag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const GoalSetting = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalAmount, setNewGoalAmount] = useState("");
  const [newGoalDate, setNewGoalDate] = useState<Date | undefined>(undefined);
  
  // Fetch current user
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/auth/me"],
  });
  
  // Fetch user's goals
  const { data: goals, isLoading: isLoadingGoals } = useQuery({
    queryKey: ["/api/goals/" + (user?.id || 0)],
    enabled: !!user?.id,
  });
  
  // Create a new goal
  const createGoalMutation = useMutation({
    mutationFn: async (goal: { userId: number; title: string; targetAmount: number; endDate?: Date }) => {
      const response = await apiRequest("POST", "/api/goals", goal);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals/" + user?.id] });
      setIsAddGoalOpen(false);
      setNewGoalTitle("");
      setNewGoalAmount("");
      setNewGoalDate(undefined);
      toast({
        title: "Goal created",
        description: "Your new financial goal has been created",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating goal",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update a goal
  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await apiRequest("PUT", `/api/goals/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals/" + user?.id] });
      toast({
        title: "Goal updated",
        description: "Your financial goal has been updated",
      });
    },
  });
  
  // Handle form submission for creating a new goal
  const handleAddGoal = () => {
    if (!newGoalTitle.trim() || !newGoalAmount.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a title and target amount",
        variant: "destructive",
      });
      return;
    }
    
    const amount = parseFloat(newGoalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }
    
    createGoalMutation.mutate({
      userId: user?.id!,
      title: newGoalTitle,
      targetAmount: Math.round(amount), // Convert to integer
      endDate: newGoalDate,
    });
  };
  
  // Handle toggling a goal's focus status
  const handleToggleFocus = (goalId: number, isFocused: boolean) => {
    // First, unfocus all other goals
    if (!isFocused) {
      goals?.forEach((goal) => {
        if (goal.id !== goalId && goal.isFocused) {
          updateGoalMutation.mutate({
            id: goal.id,
            updates: { isFocused: false },
          });
        }
      });
    }
    
    // Then, focus/unfocus the selected goal
    updateGoalMutation.mutate({
      id: goalId,
      updates: { isFocused: !isFocused },
    });
  };
  
  // Handle adding funds to a goal
  const handleAddFunds = (goalId: number, currentAmount: number, targetAmount: number) => {
    const amountToAdd = prompt("Enter amount to add:");
    if (amountToAdd === null) return;
    
    const amount = parseFloat(amountToAdd);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }
    
    const newAmount = Math.min(currentAmount + amount, targetAmount);
    
    updateGoalMutation.mutate({
      id: goalId,
      updates: { currentAmount: newAmount },
    });
  };
  
  // Calculate remaining months for a goal
  const calculateTimeRemaining = (endDate?: Date | string) => {
    if (!endDate) return "No deadline set";
    
    const now = new Date();
    const endDateObj = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    const months = (endDateObj.getFullYear() - now.getFullYear()) * 12 + (endDateObj.getMonth() - now.getMonth());
    
    if (months <= 0) return "Overdue";
    if (months === 1) return "1 month remaining";
    return `${months} months remaining`;
  };
  
  // Calculate progress percentage
  const calculateProgress = (current: number, target: number) => {
    return Math.round((current / target) * 100);
  };
  
  if (isLoadingUser || isLoadingGoals) {
    return <GoalsSkeleton />;
  }
  
  // Sort goals: focused first, then active, then inactive
  const sortedGoals = [...(goals || [])].sort((a, b) => {
    if (a.isFocused !== b.isFocused) return a.isFocused ? -1 : 1;
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return 0;
  });
  
  const focusedGoal = sortedGoals.find(goal => goal.isFocused);
  const otherGoals = sortedGoals.filter(goal => !goal.isFocused);

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center text-accent-700">
          <Flag className="h-5 w-5" />
        </div>
        <h3 className="ml-3 text-lg font-semibold">Financial Goals</h3>
      </div>
      
      <div className="mb-5 space-y-4">
        {/* Current Focused Goal */}
        {focusedGoal && (
          <div className="border border-accent-200 rounded-lg p-4 bg-accent-50">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs font-medium px-2 py-0.5 bg-accent-200 text-accent-800 rounded-full">Current Focus</span>
                <h4 className="font-medium mt-1">{focusedGoal.title}</h4>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleToggleFocus(focusedGoal.id, focusedGoal.isFocused)}>
                    Remove Focus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-600">
                  ${focusedGoal.currentAmount} of ${focusedGoal.targetAmount}
                </span>
                <span className="text-neutral-600">
                  {calculateProgress(focusedGoal.currentAmount, focusedGoal.targetAmount)}%
                </span>
              </div>
              <div className="w-full bg-white rounded-full h-2 mb-1">
                <div
                  className="progress-bar h-2 rounded-full"
                  style={{ width: `${calculateProgress(focusedGoal.currentAmount, focusedGoal.targetAmount)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-500">
                {calculateTimeRemaining(focusedGoal.endDate)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-accent-600 hover:text-accent-700 text-sm font-medium"
                onClick={() => handleAddFunds(focusedGoal.id, focusedGoal.currentAmount, focusedGoal.targetAmount)}
              >
                Add Funds
              </Button>
            </div>
          </div>
        )}
        
        {/* Other Goals */}
        {otherGoals.map((goal) => (
          <div key={goal.id} className="border border-neutral-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-medium">{goal.title}</h4>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleToggleFocus(goal.id, goal.isFocused)}>
                    Set as Focus
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddFunds(goal.id, goal.currentAmount, goal.targetAmount)}>
                    Add Funds
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="w-full bg-neutral-200 rounded-full h-2 mb-2">
              <div
                className="bg-neutral-400 h-2 rounded-full"
                style={{ width: `${calculateProgress(goal.currentAmount, goal.targetAmount)}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-xs text-neutral-500">
              <span>${goal.currentAmount} of ${goal.targetAmount}</span>
              <span>{goal.isActive ? calculateTimeRemaining(goal.endDate) : "Not active"}</span>
            </div>
          </div>
        ))}
      </div>
      
      <Button
        variant="outline"
        className="w-full flex items-center justify-center space-x-2 border border-dashed border-neutral-300 text-neutral-600 hover:text-primary-700 hover:border-primary-300 py-3 rounded-lg transition-colors mb-4"
        onClick={() => setIsAddGoalOpen(true)}
      >
        <Plus className="h-4 w-4" />
        <span>Add New Financial Goal</span>
      </Button>
      
      <div className="text-center">
        <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
          View goal-setting recommendations
        </a>
      </div>
      
      {/* Add Goal Dialog */}
      <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Financial Goal</DialogTitle>
            <DialogDescription>
              Create a new savings goal to track your progress over time.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Goal Name</Label>
              <Input
                id="title"
                placeholder="e.g., Emergency Fund, New Laptop"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Target Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={newGoalAmount}
                onChange={(e) => setNewGoalAmount(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Target Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {newGoalDate ? format(newGoalDate, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newGoalDate}
                    onSelect={setNewGoalDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <Button
              className="w-full"
              onClick={handleAddGoal}
              disabled={createGoalMutation.isPending}
            >
              {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const GoalsSkeleton = () => (
  <div className="bg-white rounded-xl shadow-card p-6">
    <div className="flex items-center mb-4">
      <Skeleton className="w-10 h-10 rounded-full" />
      <Skeleton className="ml-3 h-6 w-40" />
    </div>
    
    <div className="mb-5 space-y-4">
      <div className="border border-neutral-200 rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <Skeleton className="h-5 w-20 mb-1" />
            <Skeleton className="h-5 w-36" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        
        <div className="mb-2">
          <div className="flex justify-between mb-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="w-full h-2 rounded-full mb-1" />
        </div>
        
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      
      <div className="border border-neutral-200 rounded-lg p-4">
        <Skeleton className="h-5 w-36 mb-2" />
        <Skeleton className="w-full h-2 rounded-full mb-2" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
    
    <Skeleton className="w-full h-10 mb-4" />
    <div className="text-center">
      <Skeleton className="h-4 w-48 mx-auto" />
    </div>
  </div>
);

export default GoalSetting;
