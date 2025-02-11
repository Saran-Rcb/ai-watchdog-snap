
const GEMINI_API_KEY = "AIzaSyAqSYqGF6C73VsSnDs--fYfTIP-6mwcqD4";

export const generateQuestionsApi = async (courseTitle: string, level: string) => {
  const prompt = `Generate 50 multiple choice questions for ${courseTitle} at ${level} level.
  Format as a JSON array where each question has this exact structure:
  {
    "question": "Question text here?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": "Exact match of one option"
  }
  Important:
  - Make questions challenging but clear
  - Each question must have exactly 4 options
  - correctAnswer must exactly match one of the options
  - Return only the JSON array, no other text`;

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
    
    // Find the JSON array in the response
    const jsonStart = textContent.indexOf('[');
    const jsonEnd = textContent.lastIndexOf(']') + 1;
    if (jsonStart === -1 || jsonEnd === 0) {
      console.error('Invalid response format:', textContent);
      throw new Error('Invalid response format from API');
    }
    
    const jsonStr = textContent.slice(jsonStart, jsonEnd);
    console.log('Attempting to parse JSON:', jsonStr);
    
    const questions = JSON.parse(jsonStr);
    
    // Validate each question's structure
    const validQuestions = questions.filter((q: any) => {
      const isValid = (
        typeof q.question === 'string' &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correctAnswer === 'string' &&
        q.options.includes(q.correctAnswer)
      );
      
      if (!isValid) {
        console.warn('Invalid question structure:', q);
      }
      
      return isValid;
    });

    if (validQuestions.length === 0) {
      throw new Error('No valid questions were generated');
    }

    return validQuestions.slice(0, 50);
  } catch (error) {
    console.error('Error generating questions:', error);
    throw new Error('Failed to generate questions. Please try again.');
  }
};

export const evaluateAnswersApi = async (courseTitle: string, questions: any[], userAnswers: any) => {
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
            parts: [{
              text: `You are an exam evaluator. Compare these MCQ test answers and return ONLY a number representing the count of correct answers.
              Questions with correct answers: ${JSON.stringify(questions)}
              Student's answers: ${JSON.stringify(userAnswers)}
              Important: Return ONLY the number, no other text.`
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
    
    // Extract only the number from the response
    const score = parseInt(result.replace(/\D/g, ''));
    if (isNaN(score)) {
      console.error('Invalid score response:', result);
      throw new Error('Failed to calculate score');
    }
    
    return score;
  } catch (error) {
    console.error('Error evaluating answers:', error);
    throw new Error('Failed to evaluate answers. Please try again.');
  }
};
