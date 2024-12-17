import { Card } from "./ui/card";

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
}

const ResultsCard = ({ score, totalQuestions, questions, userAnswers }: ResultsCardProps) => {
  return (
    <Card className="mt-8 p-6">
      <h2 className="text-2xl font-bold mb-4">Test Results</h2>
      <p className="text-lg">Your score: {score} out of {totalQuestions}</p>
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
  );
};

export default ResultsCard;