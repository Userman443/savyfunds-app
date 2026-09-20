import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

// Type for user from API
interface User {
  id: number;
  username: string;
  displayName?: string;
  level: number;
  points: number;
  streak: number;
  onboardingCompleted: boolean;
  isPremium?: boolean;
}

// UI Components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Icons
import {
  Award,
  BookOpen,
  Bot,
  CreditCard,
  FileText,
  Home,
  LineChart,
  LogOut,
  Menu,
  PiggyBank,
  School,
  User,
  X,
  ArrowRightLeft,
} from "lucide-react";

// Types
interface NavbarProps {
  user: {
    id: number;
    username: string;
    displayName: string;
    level: number;
    isPremium: boolean;
    avatarUrl?: string;
  } | null;
  onLogout?: () => void;
}

export default function Navbar({ user: propsUser, onLogout }: NavbarProps) {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Double-check auth status directly (in case props don't update)
  const { data: currentUser } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.status === 401) return null;
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 30000,
  });
  
  // Use either the props user or the directly fetched user data
  const user = propsUser || (currentUser && {
    id: currentUser.id,
    username: currentUser.username,
    displayName: currentUser.displayName || currentUser.username,
    level: currentUser.level,
    isPremium: currentUser.isPremium || false,
    avatarUrl: undefined,
  });

  // Navigation items — always show full nav for all users (open access model)
  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "Learn",
      href: "/learn",
      icon: School,
    },
    {
      name: "Budget",
      href: "/budget",
      icon: PiggyBank,
    },
    {
      name: "AI Assistant",
      href: "/financial-assistant",
      icon: Bot,
    },
    {
      name: "Currency",
      href: "/currency-converter",
      icon: ArrowRightLeft,
    },
  ];

  // Track scrolling for navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Format display name for the dropdown
  function formatDisplayName(name: string) {
    return name.length > 15 ? name.substring(0, 15) + "..." : name;
  }

  // Get user initials for avatar fallback
  function getUserInitials(name: string) {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }

  return (
    <nav 
      className={cn(
        "w-full fixed top-0 z-[200] py-3 transition-all duration-200",
        isScrolled
          ? "bg-white shadow-sm"
          : "bg-white"
      )}
    >
      <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
            onClick={(e) => {
              // If already on the dashboard, scroll back to the top so the
              // logo tap always visibly responds instead of appearing dead.
              if (location === "/dashboard") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            <span className="text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-primary">
              savyfunds<span className="align-super text-sm md:text-base">™</span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:gap-6 items-center">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn("gap-2", isActive && "bg-primary text-primary-foreground")}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Button>
              </Link>
            );
          })}
        </div>

        {/* User menu and actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getUserInitials(user.displayName || user.username)}
                    </AvatarFallback>
                  </Avatar>
                  {user.isPremium && (
                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-primary ring-2 ring-background" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {formatDisplayName(user.displayName || user.username)}
                    </p>
                    <Badge variant="outline" className="ml-2 bg-primary/10 text-primary">
                      Level {user.level}
                    </Badge>
                  </div>
                  {user.isPremium && (
                    <p className="text-xs text-muted-foreground flex items-center">
                      <CreditCard className="h-3 w-3 mr-1" />
                      Premium Member
                    </p>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer w-full">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/goals" className="cursor-pointer w-full">
                    <Award className="mr-2 h-4 w-4" />
                    <span>Financial Goals</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/community" className="cursor-pointer w-full">
                    <LineChart className="mr-2 h-4 w-4" />
                    <span>Progress & Stats</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/lessons" className="cursor-pointer w-full">
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>Video Lessons</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/knowledge" className="cursor-pointer w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Resources</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user.isPremium ? (
                  <DropdownMenuItem asChild>
                    <Link href="/premium" className="cursor-pointer w-full">
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Premium Settings</span>
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/premium" className="cursor-pointer w-full">
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Upgrade to Premium</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                {onLogout && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={onLogout}
                      className="text-red-600 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Show login button only
            <Link href="/auth">
              <Button size="sm">
                Login
              </Button>
            </Link>
          )}

          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col py-12">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl md:text-3xl font-semibold text-primary">
                      savyfunds<span className="align-super text-xs md:text-sm">™</span>
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <X className="h-6 w-6" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start gap-2 text-lg",
                            isActive && "bg-primary text-primary-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </Button>
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-auto">
                  {user ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 py-4">
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getUserInitials(user.displayName || user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center">
                            <p className="text-sm font-medium">
                              {formatDisplayName(user.displayName || user.username)}
                            </p>
                            <Badge variant="outline" className="ml-2 bg-primary/10 text-primary">
                              Lvl {user.level}
                            </Badge>
                          </div>
                          {user.isPremium && (
                            <p className="text-xs text-muted-foreground flex items-center">
                              <CreditCard className="h-3 w-3 mr-1" />
                              Premium Member
                            </p>
                          )}
                        </div>
                      </div>
                      <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-start gap-2">
                          <User className="h-4 w-4" />
                          Profile & Settings
                        </Button>
                      </Link>
                      <Link href="/lessons" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-start gap-2">
                          <BookOpen className="h-4 w-4" />
                          Video Lessons
                        </Button>
                      </Link>
                      <Link href="/knowledge" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-start gap-2">
                          <FileText className="h-4 w-4" />
                          Resources
                        </Button>
                      </Link>
                      {onLogout && (
                        <Button 
                          variant="destructive" 
                          className="w-full justify-start gap-2"
                          onClick={() => {
                            onLogout();
                            setMobileMenuOpen(false);
                          }}
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </Button>
                      )}
                    </div>
                  ) : (
                    // Show single login button in mobile menu
                    <div className="flex flex-col gap-2 mt-4">
                      <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="default" className="w-full">
                          Login
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}