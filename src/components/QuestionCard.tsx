import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface QuestionCardProps {
  question: string;
  options: string[];
  index: number;
  selectedAnswer?: string;
  onAnswerSelect: (answer: string) => void;
}

const QuestionCard = ({
  question,
  options,
  index,
  selectedAnswer,
  onAnswerSelect,
}: QuestionCardProps) => {
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <h3 className="font-semibold">
          Question {index + 1}: {question}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {options.map((option, optIndex) => (
            <Button
              key={optIndex}
              variant={selectedAnswer === option ? "default" : "outline"}
              onClick={() => onAnswerSelect(option)}
              className="justify-start"
            >
              {option}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default QuestionCard;