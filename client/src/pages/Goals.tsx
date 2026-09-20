import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HelpButton from "@/components/ui/help-button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AuthModal } from "@/components/auth/AuthModal";
import { trackGoalCreation, trackMainConversion } from "@/lib/twitter-tracking";
import { usePageTracking } from "@/hooks/useTwitterTracking";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Flag, MoreHorizontal, Calendar as CalendarIcon, Sparkles, Target, Edit, Trash2, ArrowUp, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Goals = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalAmount, setNewGoalAmount] = useState("");
  const [newGoalDate, setNewGoalDate] = useState<Date | undefined>(undefined);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState("");
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  
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
    onSuccess: (newGoal) => {
      // Track goal creation conversion
      trackGoalCreation({
        id: newGoal?.id?.toString(),
        title: newGoalTitle,
        targetAmount: parseInt(newGoalAmount),
        userEmail: user?.email
      });
      
      // Track main conversion event
      trackMainConversion({
        action: 'goal_created',
        userId: user?.id?.toString(),
        email: user?.email,
        value: newGoalAmount,
        content: `Goal: ${newGoalTitle}`
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/goals/" + user?.id] });
      setIsAddGoalOpen(false);
      resetGoalForm();
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
      setIsEditGoalOpen(false);
      setIsAddFundsOpen(false);
      toast({
        title: "Goal updated",
        description: "Your financial goal has been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating goal",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete a goal
  const deleteGoalMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/goals/${id}`, undefined);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals/" + user?.id] });
      setSelectedGoal(null);
      toast({
        title: "Goal deleted",
        description: "Your financial goal has been deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting goal",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const resetGoalForm = () => {
    setNewGoalTitle("");
    setNewGoalAmount("");
    setNewGoalDate(undefined);
  };
  
  const openAddGoalOrAuth = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setIsAddGoalOpen(true);
    }
  };

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
  
  const handleUpdateGoal = () => {
    if (!selectedGoal) return;
    
    const updates: any = {};
    
    if (newGoalTitle !== selectedGoal.title && newGoalTitle.trim()) {
      updates.title = newGoalTitle;
    }
    
    const amount = parseFloat(newGoalAmount);
    if (!isNaN(amount) && amount > 0 && amount !== selectedGoal.targetAmount) {
      updates.targetAmount = amount;
    }
    
    if (newGoalDate !== selectedGoal.endDate) {
      updates.endDate = newGoalDate;
    }
    
    updateGoalMutation.mutate({
      id: selectedGoal.id,
      updates,
    });
  };
  
  const handleAddFunds = () => {
    if (!selectedGoal) return;
    
    const amount = parseFloat(addFundsAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }
    
    const newAmount = Math.min(selectedGoal.currentAmount + amount, selectedGoal.targetAmount);
    
    updateGoalMutation.mutate({
      id: selectedGoal.id,
      updates: { currentAmount: newAmount },
    });
  };
  
  const handleDeleteGoal = () => {
    if (!selectedGoal) return;
    
    if (confirm(`Are you sure you want to delete the goal "${selectedGoal.title}"?`)) {
      deleteGoalMutation.mutate(selectedGoal.id);
    }
  };
  
  const handleToggleFocus = (goal: any) => {
    // First, unfocus all other goals
    if (!goal.isFocused) {
      goals?.forEach((g) => {
        if (g.id !== goal.id && g.isFocused) {
          updateGoalMutation.mutate({
            id: g.id,
            updates: { isFocused: false },
          });
        }
      });
    }
    
    // Then, focus/unfocus the selected goal
    updateGoalMutation.mutate({
      id: goal.id,
      updates: { isFocused: !goal.isFocused },
    });
  };
  
  const openEditGoal = (goal: any) => {
    setSelectedGoal(goal);
    setNewGoalTitle(goal.title);
    setNewGoalAmount(goal.targetAmount.toString());
    setNewGoalDate(goal.endDate ? new Date(goal.endDate) : undefined);
    setIsEditGoalOpen(true);
  };
  
  const openAddFunds = (goal: any) => {
    setSelectedGoal(goal);
    setAddFundsAmount("");
    setIsAddFundsOpen(true);
  };
  
  // Calculate progress percentage
  const calculateProgress = (current: number, target: number) => {
    return Math.round((current / target) * 100);
  };

  // Calculate remaining months for a goal
  const calculateTimeRemaining = (endDate?: Date | string) => {
    if (!endDate) return "No deadline set";
    
    const date = typeof endDate === "string" ? new Date(endDate) : endDate;
    const now = new Date();
    const months = (date.getFullYear() - now.getFullYear()) * 12 + (date.getMonth() - now.getMonth());
    
    if (months <= 0) return "Overdue";
    if (months === 1) return "1 month remaining";
    return `${months} months remaining`;
  };
  
  // Sort goals: focused first, then active, then inactive
  const sortedGoals = React.useMemo(() => {
    if (!goals) return [];
    
    return [...goals].sort((a, b) => {
      if (a.isFocused !== b.isFocused) return a.isFocused ? -1 : 1;
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return 0;
    });
  }, [goals]);
  
  // Filter completed and active goals
  const completedGoals = React.useMemo(() => {
    return sortedGoals.filter(goal => calculateProgress(goal.currentAmount, goal.targetAmount) === 100);
  }, [sortedGoals]);
  
  const activeGoals = React.useMemo(() => {
    return sortedGoals.filter(goal => calculateProgress(goal.currentAmount, goal.targetAmount) < 100);
  }, [sortedGoals]);
  
  // Sample data for the projection chart
  const projectionData = [
    { month: "Jun", projected: 200, actual: 200 },
    { month: "Jul", projected: 400, actual: 380 },
    { month: "Aug", projected: 600, actual: 620 },
    { month: "Sep", projected: 800, actual: null },
    { month: "Oct", projected: 1000, actual: null },
    { month: "Nov", projected: 1200, actual: null },
    { month: "Dec", projected: 1400, actual: null },
  ];
  
  // Loading state
  const isLoading = isLoadingUser || isLoadingGoals;
  
  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 py-6 page-transition">
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <GoalsSkeleton />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      
      <main className="container mx-auto px-4 md:px-6 py-6 page-transition">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">Financial Goals</h1>
          <p className="text-neutral-600">Set, track, and achieve your financial objectives</p>
        </div>
        
        <Tabs defaultValue="active">
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="active">Active Goals</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
            
            <Button onClick={openAddGoalOrAuth}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New Goal
            </Button>
          </div>
          
          <TabsContent value="active">
            {activeGoals.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="flex justify-center mb-4">
                    <Target className="h-16 w-16 text-neutral-300" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">No Active Goals</h3>
                  <p className="text-neutral-600 mb-6">
                    Start by creating your first financial goal to track your progress.
                  </p>
                  <Button onClick={openAddGoalOrAuth}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Your First Goal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={() => openEditGoal(goal)}
                    onAddFunds={() => openAddFunds(goal)}
                    onDelete={() => {
                      setSelectedGoal(goal);
                      handleDeleteGoal();
                    }}
                    onToggleFocus={() => handleToggleFocus(goal)}
                    calculateTimeRemaining={calculateTimeRemaining}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed">
            {completedGoals.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="flex justify-center mb-4">
                    <Award className="h-16 w-16 text-neutral-300" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">No Completed Goals Yet</h3>
                  <p className="text-neutral-600 mb-6">
                    Keep working on your active goals, and they'll appear here when completed!
                  </p>
                  <Button variant="outline" onClick={openAddGoalOrAuth}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add New Goal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedGoals.map((goal) => (
                  <Card key={goal.id} className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-secondary-500 text-white px-3 py-1 text-xs font-medium">
                      Completed!
                    </div>
                    <CardHeader>
                      <CardTitle>{goal.title}</CardTitle>
                      <CardDescription>
                        Target: ${goal.targetAmount.toFixed(2)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress:</span>
                          <span>100%</span>
                        </div>
                        <Progress value={100} className="h-2" />
                      </div>
                      <div className="text-sm text-neutral-600">
                        Completed on {format(new Date(goal.updatedAt), "MMMM d, yyyy")}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleDeleteGoal()}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="insights">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Goal Progress Projection</CardTitle>
                  <CardDescription>
                    Track your progress and projected growth over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={projectionData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                        <Line
                          type="monotone"
                          dataKey="projected"
                          stroke="#5b8eff"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          name="Projected"
                        />
                        <Line
                          type="monotone"
                          dataKey="actual"
                          stroke="#4cb687"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          name="Actual"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-primary-500" />
                    Goal Insights
                  </CardTitle>
                  <CardDescription>
                    Tips and recommendations for your goals
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-primary-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Saving Rate</h3>
                    <p className="text-sm text-neutral-600 mb-3">
                      Based on your current progress, you're saving an average of $210/month toward your goals.
                    </p>
                    <div className="flex items-center text-xs text-primary-700">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      15% increase from last month
                    </div>
                  </div>
                  
                  <div className="bg-secondary-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Optimization Opportunity</h3>
                    <p className="text-sm text-neutral-600 mb-2">
                      Increasing your monthly contribution by just $50 could help you reach your "Emergency Fund" goal 1 month earlier.
                    </p>
                    <Button variant="outline" size="sm" className="w-full text-secondary-700 border-secondary-200">
                      Adjust Contribution
                    </Button>
                  </div>
                  
                  <div className="bg-accent-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Next Milestone</h3>
                    <p className="text-sm text-neutral-600">
                      You're just $150 away from reaching the halfway point of your "Laptop for College" goal!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
      <HelpButton />
      
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
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
      
      {/* Edit Goal Dialog */}
      <Dialog open={isEditGoalOpen} onOpenChange={setIsEditGoalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>
              Update the details of your financial goal.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Goal Name</Label>
              <Input
                id="edit-title"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Target Amount ($)</Label>
              <Input
                id="edit-amount"
                type="number"
                value={newGoalAmount}
                onChange={(e) => setNewGoalAmount(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Target Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {newGoalDate ? format(newGoalDate, "PPP") : "No date set"}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
            
            <div className="flex space-x-2">
              <Button
                variant="default"
                className="flex-1"
                onClick={handleUpdateGoal}
                disabled={updateGoalMutation.isPending}
              >
                {updateGoalMutation.isPending ? "Updating..." : "Update Goal"}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteGoal}
                disabled={deleteGoalMutation.isPending}
              >
                {deleteGoalMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Add Funds Dialog */}
      <Dialog open={isAddFundsOpen} onOpenChange={setIsAddFundsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funds to Goal</DialogTitle>
            <DialogDescription>
              Update your progress by adding funds to this goal.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedGoal && (
              <>
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <h3 className="font-medium">{selectedGoal.title}</h3>
                  <div className="flex justify-between text-sm mt-2">
                    <span>Current: ${selectedGoal.currentAmount.toFixed(2)}</span>
                    <span>Target: ${selectedGoal.targetAmount.toFixed(2)}</span>
                  </div>
                  <Progress
                    value={calculateProgress(selectedGoal.currentAmount, selectedGoal.targetAmount)}
                    className="h-2 mt-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fund-amount">Amount to Add ($)</Label>
                  <Input
                    id="fund-amount"
                    type="number"
                    placeholder="0.00"
                    value={addFundsAmount}
                    onChange={(e) => setAddFundsAmount(e.target.value)}
                  />
                </div>
                
                {parseFloat(addFundsAmount) > 0 && (
                  <div className="text-sm text-neutral-600">
                    New progress will be: ${Math.min(
                      selectedGoal.currentAmount + parseFloat(addFundsAmount),
                      selectedGoal.targetAmount
                    ).toFixed(2)} (
                    {calculateProgress(
                      Math.min(
                        selectedGoal.currentAmount + parseFloat(addFundsAmount),
                        selectedGoal.targetAmount
                      ),
                      selectedGoal.targetAmount
                    )}%)
                  </div>
                )}
                
                <Button
                  className="w-full"
                  onClick={handleAddFunds}
                  disabled={updateGoalMutation.isPending || !addFundsAmount}
                >
                  {updateGoalMutation.isPending ? "Adding..." : "Add Funds"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        message="Sign in or create a free account to track your financial goals."
        defaultTab="signup"
      />
    </>
  );
};

const GoalCard = ({ goal, onEdit, onAddFunds, onDelete, onToggleFocus, calculateTimeRemaining }) => {
  const progress = Math.round((goal.currentAmount / goal.targetAmount) * 100);
  
  return (
    <Card className={`${goal.isFocused ? "border-accent-300 bg-accent-50" : ""}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center">
            {goal.isFocused && (
              <Flag className="h-4 w-4 mr-2 text-accent-700" />
            )}
            {goal.title}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddFunds}>
                <ArrowUp className="h-4 w-4 mr-2" />
                Add Funds
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleFocus}>
                <Flag className="h-4 w-4 mr-2" />
                {goal.isFocused ? "Remove Focus" : "Set as Focus"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription>
          ${goal.currentAmount.toFixed(2)} of ${goal.targetAmount.toFixed(2)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress:</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="flex items-center text-sm text-neutral-600">
          <CalendarIcon className="h-4 w-4 mr-2 text-neutral-500" />
          {goal.endDate ? (
            calculateTimeRemaining(goal.endDate)
          ) : (
            "No deadline set"
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" onClick={onAddFunds}>
          Add Funds
        </Button>
      </CardFooter>
    </Card>
  );
};

const GoalsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3].map((i) => (
      <Card key={i}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-4 w-24 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <Skeleton className="h-4 w-32" />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-24" />
        </CardFooter>
      </Card>
    ))}
  </div>
);

export default Goals;
