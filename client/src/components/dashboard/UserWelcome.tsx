import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

type User = {
  id: number;
  username: string;
  email?: string;
  displayName?: string;
  level: number;
  points: number;
  streak: number;
  onboardingCompleted: boolean;
};

const UserWelcome = () => {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  if (isLoading || !user) {
    return <WelcomeSkeleton />;
  }

  return (
    <section className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-800">
            Welcome back to{" "}
            <span className="font-quicksand text-[#A7F3D0]">savyfunds™</span>,{" "}
            {user.displayName ? user.displayName.charAt(0).toUpperCase() + user.displayName.slice(1) : 
              user.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 
              "Friend"}!
          </h1>
          <p className="text-neutral-600">
            Keep building your financial future with savyfunds™
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-4 text-sm">
          <div className="px-3 py-1 bg-secondary-100 text-secondary-800 rounded-full">
            <span className="font-medium">Level {user?.level || 1}</span>
          </div>
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1 text-accent-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="7"></circle>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
            </svg>
            <span>{user?.points || 0} points</span>
          </div>
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1 text-primary-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
            </svg>
            <span>{user?.streak || 0} day streak</span>
          </div>
        </div>
      </div>
    </section>
  );
};

const WelcomeSkeleton = () => (
  <section className="mb-8">
    <div className="flex flex-col md:flex-row md:items-center justify-between">
      <div>
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="mt-4 md:mt-0 flex items-center space-x-4">
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-7 w-24" />
      </div>
    </div>
  </section>
);

export default UserWelcome;
