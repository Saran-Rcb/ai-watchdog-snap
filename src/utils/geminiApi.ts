
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
            text: `Create 50 multiple choice questions for ${courseTitle} at ${level} level. Return a JSON array where each question object has these properties: "question" (string), "options" (array of 4 strings), and "correctAnswer" (string matching one of the options). The questions should be challenging and topic-relevant. Important: Return only valid JSON, no markdown or other formatting.`
          }]
        }]
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to generate questions');
  }

  const data = await response.json();
  const textContent = data.candidates[0].content.parts[0].text;
  
  try {
    // Remove any markdown formatting if present
    const jsonStr = textContent.replace(/```json\n|\n```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Parsing error:', textContent);
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
            text: `Evaluate these answers for ${courseTitle} MCQ test. Return only the number of correct answers:
            Questions and correct answers: ${JSON.stringify(questions)}
            User answers: ${JSON.stringify(userAnswers)}`
          }]
        }]
      })
    }
  );

  if (!response.ok) {
    throw new Error('Failed to evaluate answers');
  }

  const data = await response.json();
  return parseInt(data.candidates[0].content.parts[0].text);
};
