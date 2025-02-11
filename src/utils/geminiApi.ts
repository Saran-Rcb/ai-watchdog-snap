
const getGeminiApiKey = () => {
  return localStorage.getItem('GEMINI_API_KEY');
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateQuestionsApi = async (courseTitle: string, level: string) => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Please enter your Gemini API key in settings');
  }

  const prompt = `Generate 50 multiple choice questions for ${courseTitle} at ${level} level. Each question must have exactly 4 options labeled A) to D), and one correct answer. Format the output EXACTLY as a JSON array like this, with no additional text:
  [
    {
      "question": "Sample question text?",
      "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
      "correctAnswer": "A) First option"
    }
  ]`;

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
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
              temperature: 0.3,
              maxOutputTokens: 8192,
              topP: 0.8,
              topK: 40
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_ONLY_HIGH"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_ONLY_HIGH"
              }
            ]
          })
        }
      );

      if (response.status === 429) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Rate limited, waiting ${waitTime}ms before retry...`);
        await delay(waitTime);
        attempt++;
        continue;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        
        if (response.status === 429) {
          throw new Error('API quota exceeded. Please try again later or use a different API key.');
        }
        
        throw new Error(errorData.error?.message || 'API request failed');
      }

      const data = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid API response format');
      }

      const text = data.candidates[0].content.parts[0].text.trim();
      
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      
      try {
        const questions = JSON.parse(cleanedText);
        
        if (!Array.isArray(questions)) {
          throw new Error('Response is not an array');
        }

        const validQuestions = questions.filter((q: any) => {
          return (
            q.question &&
            Array.isArray(q.options) &&
            q.options.length === 4 &&
            q.correctAnswer &&
            q.options.includes(q.correctAnswer) &&
            q.options.every((opt: string) => /^[A-D]\)/.test(opt))
          );
        });

        if (validQuestions.length === 0) {
          throw new Error('No valid questions found in response');
        }

        return validQuestions.slice(0, 50);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError, '\nResponse text:', cleanedText);
        throw new Error('Failed to parse questions JSON');
      }
    } catch (error) {
      if (attempt === maxRetries - 1) {
        console.error('Error generating questions:', error);
        throw new Error('Failed to generate questions. Please try again later.');
      }
      console.log(`Attempt ${attempt + 1} failed, retrying...`);
      attempt++;
    }
  }
};

export const evaluateAnswersApi = async (courseTitle: string, questions: any[], userAnswers: any) => {
  try {
    let correctCount = 0;
    let total = questions.length;
    
    Object.entries(userAnswers).forEach(([index, answer]) => {
      const questionIndex = parseInt(index);
      if (questions[questionIndex] && questions[questionIndex].correctAnswer === answer) {
        correctCount++;
      }
    });

    return correctCount;
  } catch (error) {
    console.error('Error evaluating answers:', error);
    throw new Error('Failed to evaluate answers. Please try again.');
  }
};
