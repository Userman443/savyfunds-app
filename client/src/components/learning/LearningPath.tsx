import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Landmark, 
  BookOpen, 
  DollarSign, 
  PiggyBank, 
  LineChart, 
  Home,
  Briefcase,
  Trophy,
  Lock,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export type LearningModule = {
  id: number;
  title: string;
  description: string;
  level: string; // 'beginner', 'intermediate', 'advanced'
  category: string;
  completed: boolean;
  locked: boolean;
  progress: number; // 0 to 100
  estimatedTime?: string;
  icon?: string;
};

type LearningPathProps = {
  modules: LearningModule[];
  activeCategoryFilter?: string;
  onModuleClick: (moduleId: number) => void;
  userLevel: number;
};

// Icon mapping for different module categories
const iconMap: Record<string, JSX.Element> = {
  basics: <BookOpen className="h-6 w-6" />,
  budgeting: <DollarSign className="h-6 w-6" />,
  saving: <PiggyBank className="h-6 w-6" />,
  investing: <LineChart className="h-6 w-6" />,
  banking: <Landmark className="h-6 w-6" />,
  housing: <Home className="h-6 w-6" />,
  career: <Briefcase className="h-6 w-6" />,
  advanced: <Trophy className="h-6 w-6" />,
};

// Level mapping for level badges
const levelColorMap: Record<string, string> = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-blue-100 text-blue-800",
  advanced: "bg-purple-100 text-purple-800",
  expert: "bg-red-100 text-red-800"
};

const LearningPath = ({ 
  modules, 
  activeCategoryFilter,
  onModuleClick,
  userLevel = 1
}: LearningPathProps) => {
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [filteredModules, setFilteredModules] = useState<LearningModule[]>(modules);
  const pathRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // When activeCategoryFilter changes, update filtered modules
  useEffect(() => {
    if (activeCategoryFilter && activeCategoryFilter !== 'all') {
      setFilteredModules(modules.filter(module => module.category === activeCategoryFilter));
    } else {
      setFilteredModules(modules);
    }
  }, [activeCategoryFilter, modules]);

  // Handle module click
  const handleModuleClick = (module: LearningModule) => {
    if (module.locked) {
      toast({
        title: "Module locked",
        description: `Complete previous modules or reach level ${Math.ceil(module.id / 3)} to unlock this content.`,
        variant: "destructive"
      });
      return;
    }
    
    setSelectedModule(module);
    onModuleClick(module.id);
  };

  // Get icon by category
  const getIcon = (category: string) => {
    return iconMap[category.toLowerCase()] || <BookOpen className="h-6 w-6" />;
  };

  return (
    <div className="w-full space-y-8">
      <div 
        ref={pathRef} 
        className="relative w-full py-12"
      >
        <div className="absolute top-1/2 left-0 right-0 h-2 bg-slate-200 transform -translate-y-1/2 z-0"></div>
        
        <div className="flex justify-between items-center flex-wrap gap-y-16 relative z-10">
          {filteredModules.map((module, index) => (
            <div 
              key={module.id}
              className={cn(
                "flex-1 min-w-[300px] relative px-4",
                index % 2 === 0 ? "mt-10" : "mb-10"
              )}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                whileHover={!module.locked ? { y: -5 } : {}}
                className="relative"
              >
                <Card 
                  className={cn(
                    "relative p-6 hover:shadow-md transition-all duration-300 cursor-pointer border-2",
                    module.completed ? "border-green-500" : 
                    module.locked ? "border-gray-300 opacity-70" : 
                    "border-primary"
                  )}
                  onClick={() => handleModuleClick(module)}
                >
                  {module.locked && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-20 backdrop-blur-sm rounded-lg">
                      <Lock className="h-8 w-8 text-gray-500" />
                    </div>
                  )}
                  
                  <div className="absolute w-6 h-6 rounded-full bg-slate-200 top-1/2 transform -translate-y-1/2 z-10">
                    {index < filteredModules.length - 1 && (
                      <div className="absolute left-6 top-1/2 transform -translate-y-1/2 h-[2px] bg-slate-200 w-full"></div>
                    )}
                  </div>
                  
                  <div className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center mb-4",
                    module.completed ? "bg-green-100" : 
                    module.locked ? "bg-gray-100" : 
                    "bg-primary/10"
                  )}>
                    {module.completed ? (
                      <Trophy className="h-6 w-6 text-green-600" />
                    ) : (
                      <div className={cn(
                        module.locked ? "text-gray-400" : "text-primary"
                      )}>
                        {getIcon(module.category)}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className={cn(
                        "font-semibold",
                        module.locked ? "text-gray-500" : ""
                      )}>
                        {module.title}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs", 
                          levelColorMap[module.level]
                        )}
                      >
                        {module.level}
                      </Badge>
                    </div>
                    
                    <p className={cn(
                      "text-sm text-gray-500 line-clamp-2",
                      module.locked ? "text-gray-400" : ""
                    )}>
                      {module.description}
                    </p>
                    
                    {module.progress > 0 && !module.completed && (
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-3">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${module.progress}%` }}
                        ></div>
                      </div>
                    )}
                    
                    {module.completed ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800 mt-2">
                        Completed
                      </Badge>
                    ) : module.estimatedTime && !module.locked && (
                      <div className="text-xs text-gray-500 mt-2">
                        {module.estimatedTime}
                      </div>
                    )}
                  </div>
                  
                  {!module.locked && !module.completed && (
                    <Button
                      size="sm"
                      className="mt-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleModuleClick(module);
                      }}
                    >
                      {module.progress > 0 ? "Continue" : "Start Learning"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </Card>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LearningPath;