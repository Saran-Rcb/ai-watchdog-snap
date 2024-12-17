import { useState } from "react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card } from "./ui/card";

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

const GEMINI_API_KEY = "AIzaSyDI0MxArtwlbm7Wy0wR7jtPNPRJjrO5j2E";

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
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate 10 multiple choice questions for ${courseTitle} at ${level} level. Format the response as a JSON array with each question having: question, options (array of 4 choices), and correctAnswer. Make sure the questions are challenging and relevant to the topic. Return only the JSON array without any markdown formatting or additional text.`
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate questions');
      }

      const data = await response.json();
      const parsedQuestions = JSON.parse(data.candidates[0].content.parts[0].text);
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
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Evaluate these answers for ${courseTitle} MCQ test:
              Questions and correct answers: ${JSON.stringify(questions)}
              User answers: ${JSON.stringify(userAnswers)}
              Return only the number of correct answers out of ${questions.length}`
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to calculate score');
      }

      const data = await response.json();
      const score = parseInt(data.candidates[0].content.parts[0].text);
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
            <Card key={index} className="p-4">
              <div className="space-y-4">
                <h3 className="font-semibold">Question {index + 1}: {q.question}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((option, optIndex) => (
                    <Button
                      key={optIndex}
                      variant={userAnswers[index] === option ? "default" : "outline"}
                      onClick={() => handleAnswerSelect(index, option)}
                      className="justify-start"
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
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
        <Card className="mt-8 p-6">
          <h2 className="text-2xl font-bold mb-4">Test Results</h2>
          <p className="text-lg">Your score: {score} out of {questions.length}</p>
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold">Answers:</h3>
            {questions.map((q, index) => (
              <div key={index} className="p-4 border rounded">
                <p className="font-medium">{q.question}</p>
                <p className="text-green-600">Correct answer: {q.correctAnswer}</p>
                <p className={`${userAnswers[index] === q.correctAnswer ? 'text-green-600' : 'text-red-600'}`}>
                  Your answer: {userAnswers[index]}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default MCQTest;