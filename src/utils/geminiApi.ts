
const GEMINI_API_KEY = "AIzaSyB1bnriwsEVMnUypbC6j2DLj1KYVOfWmVY";

export const generateQuestionsApi = async (courseTitle: string, level: string) => {
  const prompt = `Generate 50 multiple choice questions for ${courseTitle} at ${level} level. Follow this EXACT format:
  [
    {
      "question": "What is...",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "A) Option 1"
    }
  ]
  Rules:
  - Generate exactly 50 questions
  - Each question must have exactly 4 options
  - Options must be prefixed with A), B), C), D)
  - The correctAnswer must exactly match one of the options
  - Return valid JSON array only`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.8,
            maxOutputTokens: 8192,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid API response format');
    }

    const text = data.candidates[0].content.parts[0].text;
    
    // Find the JSON array in the response
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON array found in response');
    }

    try {
      const questions = JSON.parse(jsonMatch[0]);
      
      // Validate questions structure
      const validQuestions = questions.filter((q: any) => {
        return (
          q.question &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          q.correctAnswer &&
          q.options.includes(q.correctAnswer)
        );
      });

      if (validQuestions.length === 0) {
        throw new Error('No valid questions generated');
      }

      return validQuestions.slice(0, 50);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      throw new Error('Failed to parse questions JSON');
    }
  } catch (error) {
    console.error('Error generating questions:', error);
    throw new Error('Failed to generate questions. Please try again.');
  }
};

export const evaluateAnswersApi = async (courseTitle: string, questions: any[], userAnswers: any) => {
  try {
    let correctCount = 0;
    questions.forEach((q, index) => {
      if (userAnswers[index] === q.correctAnswer) {
        correctCount++;
      }
    });
    return correctCount;
  } catch (error) {
    console.error('Error evaluating answers:', error);
    throw new Error('Failed to evaluate answers. Please try again.');
  }
};
