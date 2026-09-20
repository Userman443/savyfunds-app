import { Link } from "wouter";
import { ArrowRight, Twitter, Instagram, Facebook, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  // Check if user is authenticated (silent 401 handling for anonymous users)
  const { data: currentUser } = useQuery({
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
  
  const isAuthenticated = !!currentUser;

  return (
    <footer className="bg-background border-t py-8 mt-auto">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">savyfunds</h3>
            <p className="text-sm text-muted-foreground">
              Empowering your financial journey through education and guidance.
            </p>
            <p className="text-xs text-muted-foreground">
              © {currentYear} savyfunds. All rights reserved.
            </p>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about">
                  <Button variant="link" className="p-0 h-auto text-sm">About Us</Button>
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy">
                  <Button variant="link" className="p-0 h-auto text-sm">Privacy Policy</Button>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <Button variant="link" className="p-0 h-auto text-sm">Terms of Service</Button>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <Button variant="link" className="p-0 h-auto text-sm">Contact Us</Button>
                </Link>
              </li>
            </ul>
          </div>
          
          {isAuthenticated ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/knowledge">
                    <Button variant="link" className="p-0 h-auto text-sm">Knowledge Center</Button>
                  </Link>
                </li>
                <li>
                  <Link href="/lessons">
                    <Button variant="link" className="p-0 h-auto text-sm">Video Lessons</Button>
                  </Link>
                </li>
                <li>
                  <a 
                    href="https://www.nerdwallet.com/article/finance/how-to-budget" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-primary hover:underline"
                  >
                    NerdWallet Budgeting Guide
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.investopedia.com/articles/basics/06/invest1000.asp" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-primary hover:underline"
                  >
                    Investopedia Investing Article
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a 
                    href="http://www.youtube.com/@SavyfundsInc" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-primary hover:underline"
                  >
                    savyfunds YouTube Channel
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Join Us</h3>
              <p className="text-sm text-muted-foreground">
                Sign up for a free account to access our full range of financial resources, tools, and learning materials.
              </p>
              <div className="pt-2">
                <Link href="/auth">
                  <Button variant="outline" size="sm">
                    Sign Up / Login
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
        
        <Separator className="my-6" />

        {/* Social Media Links */}
        <div className="flex justify-center mb-6">
          <div className="flex gap-6">
            <a 
              href="https://instagram.com/savyfunds" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Follow us on Instagram"
            >
              <Instagram className="h-6 w-6" />
            </a>
            <a 
              href="https://x.com/savyfunds" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Follow us on X (Twitter)"
            >
              <Twitter className="h-6 w-6" />
            </a>
            <a 
              href="https://facebook.com/savyfunds" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Follow us on Facebook"
            >
              <Facebook className="h-6 w-6" />
            </a>
            <a 
              href="http://www.youtube.com/@SavyfundsInc" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Subscribe to our YouTube channel"
            >
              <Youtube className="h-6 w-6" />
            </a>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-2">Disclaimer:</p>
            <p className="max-w-prose">
              Savyfunds provides educational content only, not financial or legal advice. 
              Consult professionals. We are not liable for decisions based on our content.
            </p>
          </div>
          
          <div className="text-xs text-muted-foreground flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              We use reCAPTCHA to prevent spam. 
              <Link href="/privacy-policy">
                <Button variant="link" className="p-0 h-auto text-xs ml-1">See our Privacy Policy</Button>
              </Link>
            </div>
            
            <div className="flex gap-4">
              <Link href="/privacy-policy">
                <Button variant="ghost" size="sm" className="h-8 text-xs">Privacy Policy</Button>
              </Link>
              <Link href="/terms">
                <Button variant="ghost" size="sm" className="h-8 text-xs">Terms</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}