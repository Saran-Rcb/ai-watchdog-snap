import { useState } from "react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";
import QuestionCard from "./QuestionCard";
import ResultsCard from "./ResultsCard";
import { generateQuestionsApi, evaluateAnswersApi } from "@/utils/geminiApi";

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

const MCQTest = () => {
  const [courseTitle, setCourseTitle] = useState("");
  const [level, setLevel] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const { toast } = useToast();

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
      const parsedQuestions = await generateQuestionsApi(courseTitle, level);
      setQuestions(parsedQuestions);
      setUserAnswers({});
      setShowResults(false);
      
      toast({
        title: "Success",
        description: "Questions generated successfully!",
      });
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate questions. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const calculateScore = async () => {
    if (Object.keys(userAnswers).length < questions.length) {
      toast({
        title: "Warning",
        description: "Please answer all questions before submitting",
        variant: "destructive",
      });
      return;
    }

    try {
      const score = await evaluateAnswersApi(courseTitle, questions, userAnswers);
      setScore(score);
      setShowResults(true);
      
      toast({
        title: "Success",
        description: "Test submitted successfully!",
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
    <div className="container mx-auto p-4 max-w-4xl">
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
        <Button onClick={generateQuestions}>Generate Questions</Button>
      </div>

      {questions.length > 0 && (
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
          
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-muted-foreground">
              {Object.keys(userAnswers).length} of {questions.length} questions answered
            </div>
            <Button onClick={calculateScore}>Submit Test</Button>
          </div>
        </div>
      )}

      {showResults && (
        <ResultsCard
          score={score}
          totalQuestions={questions.length}
          questions={questions}
          userAnswers={userAnswers}
        />
      )}
    </div>
  );
};

export default MCQTest;