import React from 'react';
import { 
  Card,
  CardContent
} from "@/components/ui/card";

const AboutUs = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl md:text-4xl font-semibold text-primary mb-6 text-center">About Us</h1>
      
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="prose max-w-none">
            <p className="text-lg mb-4">
              <span className="font-bold text-primary">SavyFunds™</span> is a comprehensive financial literacy platform founded in 2024 by <span className="font-semibold text-primary">Osagie Michael Momoh</span> to bridge the critical gap in financial education for young adults worldwide. Our mission-driven team combines expertise in financial education, technology, and youth development to create accessible, engaging learning experiences.
            </p>
            <p className="text-base text-neutral-700">
              Recognizing that traditional financial education often fails to connect with younger generations, we've developed an innovative platform that transforms complex financial concepts into digestible, actionable knowledge through AI-powered personalization and interactive tools.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 mb-8">
        <Card className="overflow-hidden">
          <div className="h-2 bg-primary"></div>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-semibold mb-2">Why We Exist</h2>
            <p className="text-neutral-700">
              Growing up, money felt like a maze budgets, savings, investing, all that jazz. Schools skipped it, and most apps were either snooze-worthy or way too complex. So, we built <span className="font-bold text-primary">SavyFunds™</span>: a spot where teens and young adults can master their finances, no fancy degree needed. We're turning "money stress" into "money confidence."
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-2 bg-primary"></div>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-semibold mb-2">What We Do</h2>
            <p className="text-neutral-700 mb-3">
              Our comprehensive platform provides evidence-based financial education through multiple integrated services:
            </p>
            <ul className="space-y-2 list-disc pl-6">
              <li>
                <span><strong>Structured Learning Modules</strong>: Curriculum-based lessons covering budgeting, saving, investing, credit management, and debt reduction strategies.</span>
              </li>
              <li>
                <span><strong>AI-Powered Financial Assistant</strong>: Personalized guidance system that provides real-time answers to financial questions and adapts to individual learning styles.</span>
              </li>
              <li>
                <span><strong>Interactive Budget Tools</strong>: Professional-grade calculators and tracking systems for income, expenses, and financial goal management.</span>
              </li>
              <li>
                <span><strong>Community Learning Platform</strong>: Peer-to-peer knowledge sharing with moderated discussions and expert-verified content.</span>
              </li>
              <li>
                <span><strong>Progress Tracking & Analytics</strong>: Detailed insights into financial learning journey and milestone achievements.</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-2 border-primary/20">
          <div className="h-2 bg-gradient-to-r from-primary to-primary/70"></div>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-semibold mb-4">Meet the Founder</h2>
            <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-lg border border-primary/10">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                    OM
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-primary mb-1">Osagie Michael Momoh</h3>
                  <p className="text-sm font-semibold text-primary/70 mb-4">Founder & CEO | MBA</p>
                  
                  <div className="space-y-3 text-neutral-700">
                    <p className="leading-relaxed">
                      Osagie founded SavyFunds after a personal revelation: discovering he was losing thousands of dollars annually through poor financial decisions. His in-depth research uncovered a troubling global pattern—millions of people worldwide were experiencing the same silent wealth erosion due to lack of accessible financial education.
                    </p>
                    
                    <p className="leading-relaxed">
                      With an MBA and extensive consulting experience across diverse industries including automotive, steel, food, and logistics, Osagie brings a unique cross-sector perspective to financial literacy. His consulting background revealed that financial challenges transcend industries and demographics—from corporate executives to young professionals, the need for practical financial education is universal.
                    </p>
                    
                    <div className="mt-4 pt-4 border-t border-primary/20">
                      <p className="font-semibold text-primary mb-2">Mission & Vision</p>
                      <p className="italic leading-relaxed">
                        "To democratize financial literacy globally, empowering individuals from all backgrounds to make informed financial decisions and build lasting wealth. Financial knowledge shouldn't be a privilege—it's a fundamental right that can transform lives and communities."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-2 bg-primary"></div>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-semibold mb-2">Our Technology & Security</h2>
            <p className="text-neutral-700 mb-3">
              Built with enterprise-grade security and modern web technologies to ensure user privacy and data protection:
            </p>
            <ul className="space-y-1 list-disc pl-6 text-sm">
              <li>End-to-end encryption for all user data</li>
              <li>GDPR and CCPA compliant privacy practices</li>
              <li>PostgreSQL database with secure authentication</li>
              <li>Regular security audits and updates</li>
              <li>No sale of personal data to third parties</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-2 bg-primary"></div>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-semibold mb-2">Financial Institution Collaboration</h2>
            <p className="text-neutral-700 mb-3">
              Building relationships with community-focused financial institutions to expand access to financial education:
            </p>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-neutral-700">
                <strong>Partnership Development:</strong> Currently exploring collaborations with community banks and credit unions to integrate financial literacy tools and support local economic development initiatives.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-2 bg-primary"></div>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-semibold mb-2">Platform Statistics & Growth</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-primary">660,600+</div>
                <div className="text-xs text-neutral-600">Active Users</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-primary">1000+</div>
                <div className="text-xs text-neutral-600">Questions Answered</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-xs text-neutral-600">AI Assistant</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-primary">Free</div>
                <div className="text-xs text-neutral-600">Core Features</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AboutUs;