import React from "react";
import { Button } from "@/components/ui/button";
import { Shield, Calculator, Landmark } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PersonalizationModal } from "@/components/modals/PersonalizationModal";
import { useState } from "react";

const PersonalizedPath = () => {
  const [showPersonalizationModal, setShowPersonalizationModal] = useState(false);
  
  // Fetch current user
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/auth/me"],
  });
  
  // Fetch user profile
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["/api/user/profile/" + (user?.id || 0)],
    enabled: !!user?.id,
  });
  
  // Fetch modules
  const { data: modules, isLoading: isLoadingModules } = useQuery({
    queryKey: ["/api/modules"],
  });
  
  // Fetch user progress
  const { data: userProgress, isLoading: isLoadingProgress } = useQuery({
    queryKey: ["/api/progress/" + (user?.id || 0)],
    enabled: !!user?.id,
  });
  
  const isLoading = isLoadingUser || isLoadingProfile || isLoadingModules || isLoadingProgress;
  
  // Filter for recommended modules (in a real app, this would be based on user preferences)
  const recommendedModules = modules?.slice(0, 3);
  
  // Find the current progress module (in a real app, this would be more sophisticated)
  const currentProgress = userProgress?.[0];
  const currentModule = modules?.find(m => m.id === currentProgress?.moduleId);
  
  if (isLoading) {
    return <PathSkeleton />;
  }
  
  return (
    <section className="mb-8">
      <div className="bg-white rounded-xl shadow-card p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-800">Your Financial Journey</h2>
            <p className="text-neutral-600">Personalized path based on your goals</p>
          </div>
          <Button
            variant="ghost"
            className="mt-2 sm:mt-0 text-primary-600 hover:text-primary-700 font-medium text-sm"
            onClick={() => setShowPersonalizationModal(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Adjust Preferences
          </Button>
        </div>

        <div className="bg-neutral-100 rounded-lg p-4 mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                <Shield className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <h3 className="font-medium">{currentModule?.title || "Building Your Safety Net"}</h3>
                <p className="text-sm text-neutral-600">
                  Progress: {currentProgress?.percentComplete || 40}% complete
                </p>
              </div>
            </div>
            <Button className="mt-2 sm:mt-0">Continue</Button>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
              className="progress-bar h-2 rounded-full"
              style={{ width: `${currentProgress?.percentComplete || 40}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedModules?.map((module) => (
            <div key={module.id} className="card-hover bg-white border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <ModuleIcon type={module.type} />
                <h4 className="ml-2 font-medium">{module.title}</h4>
              </div>
              <p className="text-sm text-neutral-600 mb-3">
                {module.description}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">{module.duration} min {getModuleTypeLabel(module.type)}</span>
                <Button variant="ghost" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Start
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {showPersonalizationModal && (
        <PersonalizationModal
          isOpen={showPersonalizationModal}
          onClose={() => setShowPersonalizationModal(false)}
          userId={user?.id}
        />
      )}
    </section>
  );
};

const ModuleIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "article":
      return (
        <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
      );
    case "activity":
      return (
        <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center text-accent-700">
          <Calculator className="h-4 w-4" />
        </div>
      );
    case "quiz":
      return (
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
      );
    case "interactive":
      return (
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </div>
      );
    case "video":
      return (
        <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
            <line x1="7" y1="2" x2="7" y2="22"></line>
            <line x1="17" y1="2" x2="17" y2="22"></line>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <line x1="2" y1="7" x2="7" y2="7"></line>
            <line x1="2" y1="17" x2="7" y2="17"></line>
            <line x1="17" y1="17" x2="22" y2="17"></line>
            <line x1="17" y1="7" x2="22" y2="7"></line>
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
          <Landmark className="h-4 w-4" />
        </div>
      );
  }
};

const getModuleTypeLabel = (type: string) => {
  switch (type) {
    case "article":
      return "read";
    case "activity":
      return "activity";
    case "quiz":
      return "quiz";
    case "interactive":
      return "lesson";
    case "video":
      return "video";
    default:
      return "lesson";
  }
};

const PathSkeleton = () => (
  <section className="mb-8">
    <div className="bg-white rounded-xl shadow-card p-6 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="mt-2 sm:mt-0 h-9 w-36" />
      </div>

      <div className="bg-neutral-100 rounded-lg p-4 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
          <div className="flex items-center">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="ml-3">
              <Skeleton className="h-5 w-48 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="mt-2 sm:mt-0 h-9 w-24" />
        </div>
        <Skeleton className="w-full h-2 rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-neutral-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="ml-2 h-5 w-32" />
            </div>
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-5/6 mb-3" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default PersonalizedPath;
