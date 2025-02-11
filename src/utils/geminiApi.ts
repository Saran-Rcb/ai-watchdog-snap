
const GEMINI_API_KEY = "AIzaSyB1bnriwsEVMnUypbC6j2DLj1KYVOfWmVY";

export const generateQuestionsApi = async (courseTitle: string, level: string) => {
  const prompt = `Generate 50 multiple choice questions for ${courseTitle} at ${level} level.
  Make sure to follow this exact JSON format:
  [
    {
      "question": "Question text here?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Option that exactly matches one of the options"
    }
  ]
  Requirements:
  - Generate exactly 50 questions
  - Each question must have exactly 4 options
  - The correctAnswer must exactly match one of the options
  - Questions should be challenging but clear
  - Return only the JSON array, no other text or formatting`;

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
      const errorData = await response.json();
      console.error('API Error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to generate questions');
    }

    const data = await response.json();
    console.log('Raw API response:', data);
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid API response format');
    }

    const textContent = data.candidates[0].content.parts[0].text;
    console.log('Text content:', textContent);

    // Find the JSON array in the response
    const jsonMatch = textContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in response');
      throw new Error('Invalid response format from API');
    }

    const jsonStr = jsonMatch[0];
    console.log('Extracted JSON string:', jsonStr);

    try {
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

      // Ensure we return exactly 50 questions
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
    const prompt = `You are an exam evaluator. Compare these MCQ test answers and provide the count of correct answers.
    Questions with correct answers: ${JSON.stringify(questions)}
    Student's answers: ${JSON.stringify(userAnswers)}
    Important: Return ONLY the number of correct answers, no other text.`;

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
            temperature: 0,
            topK: 1,
            topP: 1,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      throw new Error('Failed to evaluate answers');
    }

    const data = await response.json();
    console.log('Evaluation response:', data);

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid API response format');
    }

    const result = data.candidates[0].content.parts[0].text;
    console.log('Raw score result:', result);
    
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
