import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronRight, BookOpen, BarChart4, Target, ShieldCheck, Users } from "lucide-react";
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
      
      {/* Header/Nav is provided by the app Navbar */}

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
              <Button variant="outline" size="lg" onClick={() => setLocation("/auth")}>
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