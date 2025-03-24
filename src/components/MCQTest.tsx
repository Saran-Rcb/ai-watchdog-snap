import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";
import QuestionCard from "./QuestionCard";
import ResultsCard from "./ResultsCard";
import { generateQuestionsApi, evaluateAnswersApi } from "@/utils/geminiApi";
import { Progress } from "./ui/progress";
import { Timer, Loader } from "lucide-react";
import { Question } from "@/types/Question";

interface MCQTestProps {
  onTestStart: () => void;
  onTestComplete: () => void;
}

const MCQTest = ({ onTestStart, onTestComplete }: MCQTestProps) => {
  const [courseTitle, setCourseTitle] = useState("");
  const [level, setLevel] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60);
  const [testInProgress, setTestInProgress] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && testInProgress) {
        toast({
          title: "Tab Change Detected",
          description: "Test automatically submitted due to tab change.",
          variant: "destructive",
        });
        handleSubmit();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [testInProgress]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (testInProgress && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [testInProgress, timeRemaining]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const generateQuestions = async () => {
    if (!courseTitle || !level) {
      toast({
        title: "Error",
        description: "Please enter course title and select level",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const parsedQuestions = await generateQuestionsApi(courseTitle, level);
      const limitedQuestions = parsedQuestions.slice(0, 50);
      setQuestions(limitedQuestions);
      setUserAnswers({});
      setShowResults(false);
      setTestInProgress(true);
      setTimeRemaining(30 * 60);
      onTestStart();
      
      toast({
        title: "Test Started",
        description: "You have 30 minutes to complete the test. Good luck!",
      });
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleSubmit = async () => {
    if (!testInProgress) return;

    try {
      const score = await evaluateAnswersApi(courseTitle, questions, userAnswers);
      setScore(score);
      setShowResults(true);
      setTestInProgress(false);
      onTestComplete();
      
      const percentage = (score / questions.length) * 100;
      const passed = percentage >= 50;
      
      toast({
        title: passed ? "Congratulations!" : "Test Completed",
        description: passed 
          ? `You passed with ${percentage.toFixed(1)}%!` 
          : `You scored ${percentage.toFixed(1)}%. Required: 50%`,
        variant: passed ? "default" : "destructive",
      });

      toast({
        title: "Test Submitted",
        description: `You answered ${Object.keys(userAnswers).length} out of ${questions.length} questions.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to calculate score. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {!testInProgress && !showResults && (
        <div className="space-y-4 mb-8">
          <Input
            placeholder="Enter course title"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            className="max-w-md"
          />
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={generateQuestions} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Generating Questions...
              </>
            ) : (
              "Start Test"
            )}
          </Button>
        </div>
      )}

      {testInProgress && (
        <div className="sticky top-0 bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow mb-6 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              <span className="font-mono text-lg">
                {formatTime(timeRemaining)}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {Object.keys(userAnswers).length} of {questions.length} answered
            </div>
          </div>
          <Progress 
            value={(Object.keys(userAnswers).length / questions.length) * 100} 
            className="h-2"
          />
        </div>
      )}

      {questions.length > 0 && testInProgress && (
        <div className="space-y-6">
          {questions.map((q, index) => (
            <QuestionCard
              key={index}
              question={q.question}
              options={q.options}
              index={index}
              selectedAnswer={userAnswers[index]}
              onAnswerSelect={(answer) => handleAnswerSelect(index, answer)}
            />
          ))}
          
          <div className="sticky bottom-4 flex justify-end bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow">
            <Button onClick={handleSubmit}>Submit Test</Button>
          </div>
        </div>
      )}

      {showResults && (
        <ResultsCard
          score={score}
          totalQuestions={questions.length}
          questions={questions}
          userAnswers={userAnswers}
          passingScore={50}
        />
      )}
    </div>
  );
};

export default MCQTest;
