
const GEMINI_API_KEY = "AIzaSyDI0MxArtwlbm7Wy0wR7jtPNPRJjrO5j2E";

export const generateQuestionsApi = async (courseTitle: string, level: string) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate a JSON array of 50 multiple choice questions for ${courseTitle} at ${level} level. Each question object should have: 
            1. "question" (string) - the question text
            2. "options" (array of 4 strings) - possible answers
            3. "correctAnswer" (string) - the correct answer that matches one of the options
            Important: Return ONLY valid JSON array, no additional text or formatting.
            Example format:
            [
              {
                "question": "What is...",
                "options": ["A", "B", "C", "D"],
                "correctAnswer": "A"
              }
            ]`
          }]
        }]
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error('API Error:', errorData);
    throw new Error(errorData.error?.message || 'Failed to generate questions');
  }

  const data = await response.json();
  const textContent = data.candidates[0].content.parts[0].text;
  
  try {
    // Clean the response text to ensure we only parse the JSON part
    const jsonStart = textContent.indexOf('[');
    const jsonEnd = textContent.lastIndexOf(']') + 1;
    const jsonStr = textContent.slice(jsonStart, jsonEnd);
    
    console.log('Attempting to parse JSON:', jsonStr);
    const questions = JSON.parse(jsonStr);
    
    // Validate the structure of each question
    const validQuestions = questions.filter((q: any) => {
      return (
        typeof q.question === 'string' &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correctAnswer === 'string' &&
        q.options.includes(q.correctAnswer)
      );
    });

    if (validQuestions.length === 0) {
      throw new Error('No valid questions were generated');
    }

    return validQuestions.slice(0, 50); // Ensure we only return max 50 questions
  } catch (error) {
    console.error('Parsing error:', error);
    console.error('Raw content:', textContent);
    throw new Error('Failed to parse questions from API response');
  }
};

export const evaluateAnswersApi = async (courseTitle: string, questions: any[], userAnswers: any) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Given these MCQ test answers for ${courseTitle}, count and return ONLY the number of correct answers (just the number, nothing else):
            Questions and answers: ${JSON.stringify(questions)}
            User's answers: ${JSON.stringify(userAnswers)}`
          }]
        }]
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error('API Error:', errorData);
    throw new Error('Failed to evaluate answers');
  }

  const data = await response.json();
  const result = data.candidates[0].content.parts[0].text;
  
  // Extract just the number from the response
  const score = parseInt(result.replace(/\D/g, ''));
  if (isNaN(score)) {
    console.error('Invalid score response:', result);
    throw new Error('Failed to calculate score');
  }
  
  return score;
};
