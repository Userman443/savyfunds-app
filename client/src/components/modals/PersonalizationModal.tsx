import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ageGroups, experienceLevels, countries, financialGoalOptions } from "@/lib/constants";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PersonalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

export const PersonalizationModal = ({ isOpen, onClose, userId }: PersonalizationModalProps) => {
  const { toast } = useToast();
  
  const [age, setAge] = useState<string>("");
  const [experienceLevel, setExperienceLevel] = useState<string>("Beginner");
  const [country, setCountry] = useState<string>("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const createProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/user/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile created!",
        description: "Your personalized journey has been set up.",
        variant: "default",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error creating profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal)
        ? prev.filter((g) => g !== goal)
        : [...prev, goal]
    );
  };

  const handleSubmit = () => {
    if (!age || !country || selectedGoals.length === 0) {
      toast({
        title: "Please complete all fields",
        description: "All fields are required to personalize your experience.",
        variant: "destructive",
      });
      return;
    }

    createProfileMutation.mutate({
      userId,
      age,
      experienceLevel,
      country,
      financialGoals: selectedGoals,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-neutral-800">Personalize Your Journey</DialogTitle>
          <DialogDescription className="text-neutral-600">
            Tell us a bit about yourself so we can customize your learning experience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="age" className="text-neutral-700 font-medium">Your Age</Label>
            <Select value={age} onValueChange={setAge}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your age group" />
              </SelectTrigger>
              <SelectContent>
                {ageGroups.map((ageOption) => (
                  <SelectItem key={ageOption} value={ageOption}>
                    {ageOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="block text-neutral-700 font-medium">Financial Experience Level</Label>
            <div className="grid grid-cols-3 gap-2">
              {experienceLevels.map((level) => (
                <Button
                  key={level}
                  type="button"
                  variant={experienceLevel === level ? "default" : "outline"}
                  className={experienceLevel === level ? "bg-primary-600" : ""}
                  onClick={() => setExperienceLevel(level)}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country" className="text-neutral-700 font-medium">Your Country/Region</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your country/region" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((countryOption) => (
                  <SelectItem key={countryOption} value={countryOption}>
                    {countryOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="block text-neutral-700 font-medium">Your Financial Goals</Label>
            <div className="grid grid-cols-1 gap-2">
              {financialGoalOptions.map((goal) => (
                <div key={goal} className="flex items-center space-x-3 rounded-md border p-3">
                  <Checkbox
                    id={"goal-" + goal}
                    checked={selectedGoals.includes(goal)}
                    onCheckedChange={() => handleGoalToggle(goal)}
                  />
                  <Label
                    htmlFor={"goal-" + goal}
                    className="flex-1 text-sm cursor-pointer"
                  >
                    {goal}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={createProfileMutation.isPending}>
            {createProfileMutation.isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
