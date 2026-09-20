import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, BookOpen, BarChart4, Target, ShieldCheck, Users } from "lucide-react";
import Login from "./Login";
import SignUp from "./SignUp";
import { Meta, StructuredData, createOrganizationStructuredData, createWebsiteStructuredData } from "@/components/SEO";

const LandingPage: React.FC = () => {
  const [, setLocation] = useLocation();

  // SEO keywords for financial literacy
  const keywords = [
    "financial literacy for young adults",
    "money management for beginners",
    "personal finance education",
    "budgeting tools for students",
    "learn financial planning basics",
    "how to create a budget for college students",
    "how to start saving money as a student",
    "financial literacy apps for teenagers",
    "simple investing guide for beginners"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      {/* SEO Meta Tags */}
      <Meta 
        title="savyfunds - Financial Education Platform for Young Adults" 
        description="Learn essential money management skills with savyfunds' personalized financial education platform featuring AI guidance, budgeting tools, and interactive lessons."
        keywords={keywords}
      />
      
      {/* Structured Data for Organization */}
      <StructuredData type="Organization" data={createOrganizationStructuredData()} />
      
      {/* Structured Data for Website */}
      <StructuredData type="WebSite" data={createWebsiteStructuredData()} />
      
      {/* Additional Financial Service structured data */}
      <StructuredData 
        type="FinancialProduct" 
        data={{
          "@context": "https://schema.org",
          "@type": "FinancialProduct",
          "name": "savyfunds Financial Education Platform",
          "description": "A comprehensive financial literacy platform with personalized learning paths, AI guidance, and interactive tools",
          "category": "FinancialService",
          "provider": {
            "@type": "Organization",
            "name": "savyfunds"
          },
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          }
        }} 
      />
      
      {/* Header/Nav */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <span className="font-semibold text-xl">savyfunds</span>
          </div>
          <div className="flex items-center space-x-4">
            <Tabs defaultValue="login" className="w-full max-w-md">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Login</CardTitle>
                    <CardDescription>Sign into your savyfunds account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Login />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="signup">
                <Card>
                  <CardHeader>
                    <CardTitle>Create an Account</CardTitle>
                    <CardDescription>Start your financial journey today</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SignUp />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Build Financial Knowledge for Your Future</h1>
            <p className="text-lg text-neutral-600 mb-8">
              savyfunds helps young people develop essential financial literacy skills
              with personalized learning paths, AI guidance, and practical tools.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Button size="lg" onClick={() => setLocation("/auth?show=signup")}>
                Get Started Free
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => {
                const button = document.querySelector('button[value="login"]') as HTMLButtonElement;
                if (button) button.click();
              }}>
                Sign In
              </Button>
            </div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-8 border border-primary/20">
            <div className="grid grid-cols-2 gap-6">
              <FeatureCard 
                icon={<BookOpen className="h-8 w-8 text-primary" />} 
                title="Learn at Your Pace" 
                description="Personalized financial education modules tailored to your knowledge level"
              />
              <FeatureCard 
                icon={<BarChart4 className="h-8 w-8 text-primary" />} 
                title="Track Your Progress" 
                description="Set financial goals and monitor your journey with visual tools"
              />
              <FeatureCard 
                icon={<Target className="h-8 w-8 text-primary" />} 
                title="Smart Goal Setting" 
                description="AI-powered recommendations to help you achieve financial milestones"
              />
              <FeatureCard 
                icon={<Users className="h-8 w-8 text-primary" />} 
                title="Community Support" 
                description="Connect with peers on similar financial journeys"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white border-y">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How savyfunds Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Personalized Learning</h3>
              <p className="text-neutral-600">
                Get a customized financial education path based on your current knowledge,
                goals, and regional economic context.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Financial Assistant</h3>
              <p className="text-neutral-600">
                Ask questions and get smart, personalized financial guidance powered by
                advanced AI that understands your unique situation.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Interactive Tools</h3>
              <p className="text-neutral-600">
                Practice what you learn with budget calculators, goal trackers, and
                financial health assessments to apply knowledge in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Leaders Acknowledgment */}
      <section className="py-16 bg-neutral-50 border-y">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-neutral-800">
              Powered by Industry Innovation
            </h2>
            <p className="text-lg text-neutral-600 max-w-4xl mx-auto">
              We extend our gratitude to industry leaders like American Express, Visa, Mastercard, 
              and Discover, along with many other financial institutions, for their continued innovation 
              and commitment to advancing the financial landscape that makes platforms like savyfunds possible.
            </p>
          </div>
          
          {/* Company Logos */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
            {/* American Express */}
            <div className="h-12 w-32 flex items-center justify-center">
              <svg viewBox="0 0 140 60" className="h-full w-full" fill="currentColor">
                <rect x="10" y="20" width="120" height="20" rx="4" fill="#2557A5" opacity="0.8"/>
                <text x="70" y="35" textAnchor="middle" className="text-xs font-bold fill-white">
                  American Express
                </text>
              </svg>
            </div>
            
            {/* Visa */}
            <div className="h-12 w-20 flex items-center justify-center">
              <svg viewBox="0 0 80 60" className="h-full w-full" fill="currentColor">
                <text x="40" y="35" textAnchor="middle" className="text-xl font-bold fill-blue-700">
                  VISA
                </text>
              </svg>
            </div>
            
            {/* Mastercard */}
            <div className="h-12 w-28 flex items-center justify-center">
              <svg viewBox="0 0 110 60" className="h-full w-full">
                <circle cx="35" cy="30" r="12" fill="#ff5f00" opacity="0.8"/>
                <circle cx="50" cy="30" r="12" fill="#eb001b" opacity="0.8"/>
                <text x="55" y="50" textAnchor="middle" className="text-xs font-semibold fill-neutral-600">
                  Mastercard
                </text>
              </svg>
            </div>
            
            {/* Discover */}
            <div className="h-12 w-24 flex items-center justify-center">
              <svg viewBox="0 0 100 60" className="h-full w-full" fill="currentColor">
                <text x="50" y="35" textAnchor="middle" className="text-sm font-bold fill-orange-600">
                  DISCOVER
                </text>
              </svg>
            </div>
            
            {/* Plus more indicator */}
            <div className="h-12 w-20 flex items-center justify-center">
              <span className="text-neutral-400 font-medium text-sm">+ many more</span>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-sm text-neutral-500">
              These organizations continue to shape the financial services industry, enabling innovative 
              educational platforms and financial tools for the next generation.
            </p>
          </div>
        </div>
      </section>

      {/* Business Transparency Section */}
      <section className="py-16 bg-slate-50 border-y">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Transparency & Trust</h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              We believe in complete transparency about our mission, business model, and operations.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Business Model */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Our Business Model
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-700 mb-3">
                  <strong>Free Core Platform:</strong> All essential financial education tools are completely free.
                </p>
                <p className="text-sm text-neutral-700 mb-3">
                  <strong>Partnership Development:</strong> Currently exploring partnerships with community-focused financial institutions to provide sponsored educational content.
                </p>
                <p className="text-sm text-neutral-700">
                  <strong>No Data Sales:</strong> We never sell user data. Your privacy is protected.
                </p>
              </CardContent>
            </Card>

            {/* Leadership */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Leadership Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-700 mb-3">
                  <strong>Fintech Veterans:</strong> 15+ years combined experience in financial technology and education.
                </p>
                <p className="text-sm text-neutral-700 mb-3">
                  <strong>Content Quality:</strong> Evidence-based curriculum developed through financial literacy research and best practices.
                </p>
                <p className="text-sm text-neutral-700">
                  <strong>Youth Advocates:</strong> Team members with backgrounds in youth development and financial counseling.
                </p>
              </CardContent>
            </Card>

            {/* Platform Stats */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart4 className="h-5 w-5 text-primary" />
                  Platform Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-700">Active Users:</span>
                    <span className="font-semibold">660,600+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-700">Questions Answered:</span>
                    <span className="font-semibold">1,000+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-700">Uptime:</span>
                    <span className="font-semibold">99.9%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-700">Response Time:</span>
                    <span className="font-semibold">&lt;24hrs</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold mb-4">Get in Touch</h3>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button variant="outline" onClick={() => setLocation("/contact")}>
                Contact Our Team
              </Button>
              <Button variant="outline" onClick={() => setLocation("/about")}>
                Learn More About Us
              </Button>
              <Button variant="outline" onClick={() => {
                window.location.href = "mailto:partnerships@savyfunds.com";
              }}>
                partnerships@savyfunds.com
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Success Stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TestimonialCard
            name="Alex, 22"
            quote="savyfunds helped me understand how to build my emergency fund. Now I have 3 months of expenses saved up!"
          />
          <TestimonialCard
            name="Maya, 19"
            quote="I had no idea how to budget until I found this platform. The interactive tools made it so much easier."
          />
          <TestimonialCard
            name="Jamal, 24"
            quote="The AI assistant explained investing concepts in a way that actually made sense to me. I finally feel confident enough to start."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary/5 border-y">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Start Your Financial Journey Today</h2>
          <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
            Join thousands of young people taking control of their financial future
            with personalized education, AI guidance, and practical tools.
          </p>
          <Button size="lg" onClick={() => setLocation("/auth?show=signup")}>
            Create Free Account
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-200 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center mb-4 md:mb-0">
              <span className="font-semibold text-xl">savyfunds</span>
            </div>
            <div className="flex space-x-6">
              <a href="#about" className="hover:text-white transition">About</a>
              <a href="#features" className="hover:text-white transition">Features</a>
              <a href="#testimonials" className="hover:text-white transition">Testimonials</a>
              <a href="#contact" className="hover:text-white transition">Support</a>
            </div>
          </div>
          
          {/* Social Media Icons */}
          <div className="flex justify-center mb-8">
            <div className="flex gap-6">
              <a 
                href="https://instagram.com/savyfunds" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label="Follow us on Instagram"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              <a 
                href="https://x.com/savyfunds" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label="Follow us on X (Twitter)"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a 
                href="https://facebook.com/savyfunds" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label="Follow us on Facebook"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a 
                href="http://www.youtube.com/@SavyfundsInc" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label="Subscribe to our YouTube channel"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          
          <div className="border-t border-neutral-800 pt-8 text-center text-sm text-neutral-400">
            <div className="mb-4">
              <p className="max-w-prose mx-auto mb-2">
                Savyfunds provides educational content only, not financial or legal advice. 
                Consult professionals. We are not liable for decisions based on our content.
              </p>
            </div>
            <p>© {new Date().getFullYear()} savyfunds. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-white p-4 rounded-lg border">
    <div className="mb-3">{icon}</div>
    <h3 className="font-medium mb-1">{title}</h3>
    <p className="text-sm text-neutral-600">{description}</p>
  </div>
);

const TestimonialCard = ({ name, quote }: { name: string, quote: string }) => (
  <div className="bg-white p-6 rounded-lg border shadow-sm">
    <p className="italic text-neutral-600 mb-4">"{quote}"</p>
    <p className="font-medium">{name}</p>
  </div>
);

export default LandingPage;