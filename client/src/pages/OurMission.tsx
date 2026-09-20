import React from 'react';
import { 
  Card,
  CardContent
} from "@/components/ui/card";

const OurMission = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl md:text-4xl font-semibold text-primary mb-6 text-center">Our Mission</h1>
      
      <Card className="mb-8">
        <CardContent className="pt-6 px-6 py-8">
          <div className="prose max-w-none">
            <p className="text-lg mb-6">
              At <span className="font-bold text-primary">SavyFunds™</span>, we're all about one thing: empowering young people to take charge of their financial future. Launched in 2025, our mission is to break down the money maze making saving, budgeting, and investing simple, approachable, and even a little fun for the next generation.
            </p>
            
            <p className="text-lg mb-6">
              We believe financial know-how shouldn't be a luxury it's a right. That's why we're building a platform that cuts through the noise with clear lessons, smart tools, and real-world advice, all powered by a dash of AI. Whether you're starting with your first dollar or dreaming bigger, we're here to guide you, step by step.
            </p>
            
            <p className="text-lg">
              Looking ahead, we're not stopping at the basics. Our goal? To open up the world of wealth-building like the stock market to young minds everywhere. <span className="font-bold text-primary">SavyFunds™</span> is more than an app it's a movement to make money your strength, not your stress.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        <div className="max-w-md text-center">
          <p className="text-xl font-semibold text-primary mt-4">
            Empowering financial confidence, one person at a time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OurMission;