import { Card } from "./ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface ResultsCardProps {
  score: number;
  totalQuestions: number;
  questions: Question[];
  userAnswers: { [key: number]: string };
  passingScore: number;
}

const ResultsCard = ({ score, totalQuestions, questions, userAnswers, passingScore }: ResultsCardProps) => {
  const percentage = (score / totalQuestions) * 100;
  const passed = percentage >= passingScore;

  return (
    <Card className="mt-8 p-6">
      <div className="flex items-center gap-4 mb-6">
        {passed ? (
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        ) : (
          <XCircle className="h-8 w-8 text-red-500" />
        )}
        <div>
          <h2 className="text-2xl font-bold">Test Results</h2>
          <p className="text-lg">
            Score: {score} out of {totalQuestions} ({percentage.toFixed(1)}%)
          </p>
          <p className={passed ? "text-green-600" : "text-red-600"}>
            {passed ? "Passed!" : `Failed (Required: ${passingScore}%)`}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <h3 className="font-semibold">Answers:</h3>
        {questions.map((q, index) => (
          <div key={index} className="p-4 border rounded">
            <p className="font-medium">{q.question}</p>
            <p className="text-green-600">Correct answer: {q.correctAnswer}</p>
            <p className={`${userAnswers[index] === q.correctAnswer ? 'text-green-600' : 'text-red-600'}`}>
              Your answer: {userAnswers[index] || "Not answered"}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ResultsCard;