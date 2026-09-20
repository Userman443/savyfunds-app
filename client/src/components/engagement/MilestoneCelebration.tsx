import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Award, Share2, Trophy, Star, Target, Sparkles } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

type MilestoneType = "level" | "streak" | "goal" | "skill" | "badge";

type MilestoneProps = {
  type: MilestoneType;
  title: string;
  description: string;
  value?: number | string;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  showShareButton?: boolean;
  onShare?: () => void;
};

function ConfettiEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const myConfetti = confetti.create(canvasRef.current, {
      resize: true,
      useWorker: true
    });
    
    // Initial burst
    myConfetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    // Side bursts
    setTimeout(() => {
      myConfetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
    }, 250);
    
    setTimeout(() => {
      myConfetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 400);
    
    function animate() {
      // Slower, floating confetti
      myConfetti({
        particleCount: 2,
        spread: 60,
        origin: { y: 0.7 },
        gravity: 0.5,
        scalar: 0.8,
        drift: 1
      });
      
      if (canvasRef.current) {
        requestAnimationFrame(animate);
      }
    }
    
    const animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
      myConfetti.reset();
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-40 pointer-events-none"
      style={{ width: "100vw", height: "100vh" }}
    ></canvas>
  );
}

const getMilestoneIcon = (type: MilestoneType) => {
  switch (type) {
    case "level":
      return <Trophy className="h-12 w-12 text-yellow-500" />;
    case "streak":
      return <Sparkles className="h-12 w-12 text-amber-500" />;
    case "goal":
      return <Target className="h-12 w-12 text-emerald-500" />;
    case "skill":
      return <Star className="h-12 w-12 text-blue-500" />;
    case "badge":
      return <Award className="h-12 w-12 text-purple-500" />;
    default:
      return <Award className="h-12 w-12 text-primary" />;
  }
};

const MilestoneCelebration = ({
  type,
  title,
  description,
  value,
  onClose,
  autoClose = true,
  autoCloseDelay = 10000,
  showShareButton = false,
  onShare,
}: MilestoneProps) => {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <ConfettiEffect />
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 15 }}
          className="relative z-50 w-full max-w-md"
        >
          <Card className="border-2 border-primary shadow-xl">
            <div className="absolute right-4 top-4">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="p-4 rounded-full bg-primary/10"
              >
                {getMilestoneIcon(type)}
              </motion.div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <h2 className="text-2xl font-bold">{title}</h2>
                
                {value && (
                  <div className="text-4xl font-bold text-primary">
                    {value}
                  </div>
                )}
                
                <p className="text-muted-foreground">{description}</p>
              </motion.div>
              
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="w-full max-w-[200px] h-32 mt-2"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 200 120"
                  className="w-full h-full"
                >
                  <rect width="200" height="120" fill="none" />
                  <g transform="translate(100, 60)">
                    <motion.path
                      d="M0,-50 C27.6,-50 50,-27.6 50,0 C50,27.6 27.6,50 0,50 C-27.6,50 -50,27.6 -50,0 C-50,-27.6 -27.6,-50 0,-50 Z"
                      fill="var(--primary)"
                      fillOpacity="0.2"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1, delay: 0.7 }}
                    />
                    <motion.path
                      d="M0,-30 C16.6,-30 30,-16.6 30,0 C30,16.6 16.6,30 0,30 C-16.6,30 -30,16.6 -30,0 C-30,-16.6 -16.6,-30 0,-30 Z"
                      fill="var(--primary)"
                      fillOpacity="0.4"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1, delay: 0.9 }}
                    />
                    <motion.circle
                      cx="0"
                      cy="0"
                      r="15"
                      fill="var(--primary)"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 200, 
                        delay: 1.1 
                      }}
                    />
                  </g>
                </svg>
              </motion.div>
            </CardContent>
            
            <CardFooter className="flex justify-center gap-3 pb-6">
              <Button variant="outline" onClick={onClose}>
                Continue
              </Button>
              
              {showShareButton && onShare && (
                <Button onClick={onShare} className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MilestoneCelebration;