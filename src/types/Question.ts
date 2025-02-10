
export interface Question {
  question: string;
  options: string[];
  correctAnswer: string;  // Changed from optional to required
}
