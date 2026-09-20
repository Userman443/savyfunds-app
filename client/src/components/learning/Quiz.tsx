import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronRight, HelpCircle, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import MilestoneCelebration from "../engagement/MilestoneCelebration";
import ShareProgress from "../engagement/ShareProgress";

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

type QuizProps = {
  moduleId: number;
  title: string;
  questions: QuizQuestion[];
  onComplete: (score: number, totalQuestions: number) => void;
  onExit?: () => void;
};

const Quiz = ({ moduleId, title, questions, onComplete, onExit }: QuizProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const { toast } = useToast();

  const currentQuestion = questions[currentQuestionIndex];
  const isCorrect = selectedOption === currentQuestion?.correctAnswer;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleOptionSelect = (index: number) => {
    if (!isAnswerSubmitted) {
      setSelectedOption(index);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) {
      toast({
        variant: "destructive",
        title: "Please select an answer",
        description: "You need to choose one of the options.",
      });
      return;
    }

    setIsAnswerSubmitted(true);

    // Update score
    if (isCorrect) {
      setScore(prevScore => prevScore + 1);
    }

    // Update answers array
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = selectedOption;
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      // Quiz completed
      setQuizCompleted(true);
      onComplete(score + (isCorrect ? 1 : 0), questions.length);
      
      // Show celebration if the score is above 70%
      const finalScore = score + (isCorrect ? 1 : 0);
      const percentage = (finalScore / questions.length) * 100;
      if (percentage >= 70) {
        setShowCelebration(true);
      }
    }
  };

  const getScoreMessage = () => {
    const percentage = (score / questions.length) * 100;
    
    if (percentage >= 90) return "Excellent! You've mastered this topic!";
    if (percentage >= 70) return "Great job! You have a good understanding of the material.";
    if (percentage >= 50) return "Good effort! Review the areas you missed to improve your score.";
    return "Keep learning! Review the module and try again to improve your score.";
  };

  const getScoreColor = () => {
    const percentage = (score / questions.length) * 100;
    
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-emerald-600";
    if (percentage >= 50) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <>
      <Card className="w-full max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{title}</span>
            <span className="text-sm font-normal text-muted-foreground">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </CardTitle>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        
        <CardContent>
          {!quizCompleted ? (
            <div className="space-y-6">
              <div className="text-lg font-medium mb-6">
                {currentQuestion.question}
              </div>
              
              <RadioGroup 
                value={selectedOption?.toString()} 
                onValueChange={(value) => handleOptionSelect(parseInt(value))}
                className="space-y-3"
              >
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className={`
                      flex items-center relative rounded-lg border p-4 transition-colors
                      ${isAnswerSubmitted && index === currentQuestion.correctAnswer
                        ? "border-green-500 bg-green-50"
                        : isAnswerSubmitted && index === selectedOption && index !== currentQuestion.correctAnswer
                        ? "border-red-500 bg-red-50"
                        : selectedOption === index
                        ? "border-primary"
                        : ""}
                    `}
                  >
                    <RadioGroupItem 
                      value={index.toString()} 
                      id={`option-${index}`} 
                      disabled={isAnswerSubmitted}
                      className="mr-2"
                    />
                    <Label htmlFor={`option-${index}`} className="flex-grow cursor-pointer">
                      {option}
                    </Label>
                    
                    {isAnswerSubmitted && index === currentQuestion.correctAnswer && (
                      <Check className="h-5 w-5 text-green-600 absolute right-4" />
                    )}
                    
                    {isAnswerSubmitted && index === selectedOption && index !== currentQuestion.correctAnswer && (
                      <X className="h-5 w-5 text-red-600 absolute right-4" />
                    )}
                  </div>
                ))}
              </RadioGroup>
              
              {isAnswerSubmitted && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 rounded-lg bg-slate-50"
                  >
                    <div className="flex items-start">
                      <div className={`mr-2 mt-1 ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                        {isCorrect ? <Check className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className={`font-medium ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                          {isCorrect ? "Correct!" : "Incorrect"}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          ) : (
            <div className="py-8 space-y-6 text-center">
              <Award className="h-16 w-16 mx-auto text-primary" />
              
              <h3 className="text-2xl font-bold">Quiz Completed!</h3>
              
              <div className="text-4xl font-bold mb-2 mt-4">
                <span className={getScoreColor()}>
                  {score}/{questions.length}
                </span>
              </div>
              
              <p className="text-slate-600 max-w-md mx-auto">
                {getScoreMessage()}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
                <Button onClick={onExit}>Return to Module</Button>
                <ShareProgress 
                  data={{
                    title: `I completed the ${title} quiz!`,
                    text: `I scored ${score}/${questions.length} on the ${title} quiz on savyfunds. Keep building your financial knowledge!`,
                    hashtags: ["financialliteracy", "savyfunds", "learning"],
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
        
        {!quizCompleted && (
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={onExit}
            >
              Exit Quiz
            </Button>
            
            {!isAnswerSubmitted ? (
              <Button 
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null}
              >
                Submit Answer
              </Button>
            ) : (
              <Button 
                onClick={handleNextQuestion}
              >
                {currentQuestionIndex < questions.length - 1 ? (
                  <>
                    Next Question
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                ) : (
                  "Finish Quiz"
                )}
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
      
      {showCelebration && (
        <MilestoneCelebration
          type="skill"
          title="Quiz Completed!"
          description={`Great job! You scored ${score}/${questions.length} on the ${title} quiz.`}
          onClose={() => setShowCelebration(false)}
          showShareButton={true}
          onShare={() => {
            toast({
              title: "Share your achievement!",
              description: "Let others know about your financial learning progress.",
            });
          }}
        />
      )}
    </>
  );
};

export default Quiz;