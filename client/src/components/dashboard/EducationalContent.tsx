import React from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { moduleLevels, moduleTypes } from "@/lib/constants";
import { Play, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const EducationalContent = () => {
  // Fetch learning modules
  const { data: modules, isLoading } = useQuery({
    queryKey: ["/api/modules"],
  });

  if (isLoading) {
    return <ContentSkeleton />;
  }

  // Get 3 modules to display (could be more sophisticated in a real app)
  const displayModules = modules?.slice(3, 6) || [];

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-neutral-800">Continue Learning</h2>
        <Link href="/learn">
          <a className="text-primary-600 hover:text-primary-700 text-sm font-medium">View all modules</a>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayModules.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>
    </section>
  );
};

const ModuleCard = ({ module }) => {
  const level = module.level;
  const type = module.type;
  
  // Get the appropriate colors and icons for the level and type
  const levelColor = moduleLevels[level]?.color || "primary";
  const typeIcon = moduleTypes[type]?.icon || "ri-article-line";
  const typeLabel = moduleTypes[type]?.label || "Lesson";

  return (
    <div className="card-hover bg-white rounded-xl shadow-card overflow-hidden">
      <div className="h-36 bg-primary-100 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src={module.imageUrl} 
            alt={`${module.title} illustration`} 
            className="w-full h-full object-cover"
          />
          {type === 'video' && (
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
                <Play className="h-5 w-5 text-neutral-800" />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <span className={`px-2 py-1 bg-${levelColor}-100 text-${levelColor}-800 text-xs font-medium rounded-full`}>
            {level}
          </span>
          <span className="text-xs text-neutral-500">{module.duration} min</span>
        </div>
        <h3 className="font-semibold mb-2">{module.title}</h3>
        <p className="text-sm text-neutral-600 mb-4">
          {module.description}
        </p>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full bg-${levelColor}-200 flex items-center justify-center text-${levelColor}-700 text-xs`}>
              <i className={typeIcon}></i>
            </div>
            <span className="ml-2 text-sm text-neutral-700">{typeLabel}</span>
          </div>
          <Button variant="ghost" className="text-primary-600 hover:text-primary-700 p-0">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const ContentSkeleton = () => (
  <section className="mb-8">
    <div className="flex justify-between items-center mb-4">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-5 w-32" />
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow-card overflow-hidden">
          <Skeleton className="h-36 w-full" />
          <div className="p-5">
            <div className="flex justify-between items-start mb-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-5/6 mb-4" />
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Skeleton className="h-6 w-6 rounded-full mr-2" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default EducationalContent;
