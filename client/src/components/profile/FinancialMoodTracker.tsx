import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays, addDays, startOfDay, isSameDay } from "date-fns";
import { Check, ChevronLeft, ChevronRight, CalendarIcon, Smile, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

type Mood = "😊" | "😀" | "😐" | "😟" | "😣";
type MoodEntry = {
  date: Date;
  mood: Mood;
  note?: string;
};

// Default messages for different moods
const moodMessages: Record<Mood, string[]> = {
  "😊": [
    "You're doing great with your finances!",
    "Excellent work on managing your money today!",
    "Feeling financially confident - keep it up!"
  ],
  "😀": [
    "Your financial habits are working well!",
    "Good job on staying on track with your budget.",
    "You're making good financial decisions today."
  ],
  "😐": [
    "Your finances are stable, but there's room for improvement.",
    "You're doing okay financially - keep monitoring your spending.",
    "Financial situation is neutral today."
  ],
  "😟": [
    "You're feeling some financial stress. Take a deep breath.",
    "Try to identify what's causing your financial worry today.",
    "Remember that small steps can improve your financial situation."
  ],
  "😣": [
    "Financial struggles are temporary. Reach out for help if needed.",
    "Take time to review your budget and identify possible changes.",
    "Consider speaking with a financial advisor about your concerns."
  ]
};

// Mood descriptions
const moodDescriptions: Record<Mood, string> = {
  "😊": "Excellent",
  "😀": "Good",
  "😐": "Neutral",
  "😟": "Concerned",
  "😣": "Stressed"
};

// Mood colors
const moodColors: Record<Mood, string> = {
  "😊": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "😀": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  "😐": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  "😟": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  "😣": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

const FinancialMoodTracker = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [moodNote, setMoodNote] = useState<string>("");
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { toast } = useToast();

  // Load mood entries from local storage on component mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('financialMoodEntries');
    if (savedEntries) {
      try {
        // Convert date strings back to Date objects
        const parsed = JSON.parse(savedEntries);
        setMoodEntries(parsed.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date)
        })));
      } catch (error) {
        console.error('Failed to parse mood entries:', error);
      }
    }
  }, []);

  // Save mood entries to local storage whenever they change
  useEffect(() => {
    if (moodEntries.length > 0) {
      localStorage.setItem('financialMoodEntries', JSON.stringify(moodEntries));
    }
  }, [moodEntries]);

  // Check if there's an entry for the selected date and load it
  useEffect(() => {
    const existingEntry = moodEntries.find(entry => 
      isSameDay(new Date(entry.date), selectedDate)
    );
    
    if (existingEntry) {
      setSelectedMood(existingEntry.mood);
      setMoodNote(existingEntry.note || "");
    } else {
      setSelectedMood(null);
      setMoodNote("");
    }
  }, [selectedDate, moodEntries]);

  // Navigate to previous day
  const goToPreviousDay = () => {
    setSelectedDate(prevDate => subDays(prevDate, 1));
  };

  // Navigate to next day
  const goToNextDay = () => {
    setSelectedDate(prevDate => addDays(prevDate, 1));
  };

  // Handle mood selection
  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
    
    // Auto-save after selecting a mood
    saveMoodEntry(mood);
  };

  // Save the mood entry
  const saveMoodEntry = (mood: Mood = selectedMood as Mood) => {
    if (!mood) return;
    
    const newEntry: MoodEntry = {
      date: startOfDay(selectedDate),
      mood: mood,
      note: moodNote.trim() || undefined
    };
    
    // Check if there's already an entry for this date
    const entryIndex = moodEntries.findIndex(entry => 
      isSameDay(new Date(entry.date), selectedDate)
    );
    
    if (entryIndex >= 0) {
      // Update existing entry
      const updatedEntries = [...moodEntries];
      updatedEntries[entryIndex] = newEntry;
      setMoodEntries(updatedEntries);
    } else {
      // Add new entry
      setMoodEntries(prevEntries => [...prevEntries, newEntry]);
    }
    
    toast({
      title: "Mood saved",
      description: "Your financial mood has been recorded.",
    });
  };

  // Get random encouragement message based on mood
  const getEncouragementMessage = (mood: Mood) => {
    const messages = moodMessages[mood];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Get the streak count (consecutive days with entries)
  const getStreak = (): number => {
    if (moodEntries.length === 0) return 0;
    
    // Sort entries by date (newest first)
    const sortedEntries = [...moodEntries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // Check for entries on consecutive days
    while (true) {
      const hasEntryForDay = sortedEntries.some(entry => 
        isSameDay(new Date(entry.date), currentDate)
      );
      
      if (!hasEntryForDay) break;
      
      streak++;
      currentDate = subDays(currentDate, 1);
    }
    
    return streak;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle>Financial Mood Tracker</CardTitle>
            <CardDescription>
              Track your daily feelings about your finances
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-medium">
              {getStreak()} day streak
            </Badge>
            
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendar</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setCalendarOpen(false);
                    }
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToPreviousDay}
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h3 className="text-lg font-medium">
              {format(selectedDate, "EEEE")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, "MMMM d, yyyy")}
            </p>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={goToNextDay}
            disabled={isSameDay(selectedDate, new Date())}
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium">How do you feel about your finances today?</h3>
          
          <div className="flex justify-center gap-4">
            {(["😊", "😀", "😐", "😟", "😣"] as Mood[]).map((mood) => (
              <motion.button
                key={mood}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMoodSelect(mood)}
                className={`text-3xl p-3 rounded-full relative ${
                  selectedMood === mood ? "bg-primary/10" : "hover:bg-primary/5"
                }`}
                aria-label={`Mood: ${moodDescriptions[mood]}`}
              >
                {mood}
                {selectedMood === mood && (
                  <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
          
          {selectedMood && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Badge className={`${moodColors[selectedMood]}`}>
                    {moodDescriptions[selectedMood]}
                  </Badge>
                </div>
                
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 text-center">
                  <p className="text-sm">{getEncouragementMessage(selectedMood)}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-center border-t pt-6">
        <div className="text-xs text-center text-muted-foreground">
          Tracking your financial mood can help you understand patterns in your financial well-being.
        </div>
      </CardFooter>
    </Card>
  );
};

export default FinancialMoodTracker;