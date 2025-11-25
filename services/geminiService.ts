
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

// Curriculum mapping to ensure grade-appropriate questions
const GRADE_TOPICS: Record<number, string> = {
  1: "simple addition and subtraction with numbers 0-20",
  2: "addition and subtraction with 2-digit numbers",
  3: "multiplication facts (1-10) and basic division",
  4: "multi-digit multiplication, long division, and basic fractions",
  5: "operations with fractions, decimals, and volume",
  6: "ratios, rates, percentages, and introduction to negative numbers",
  7: "proportions, rational numbers, linear expressions, and probability",
  8: "linear equations, functions, exponents, and pythagorean theorem",
  9: "Algebra I: quadratics, polynomials, and systems of equations",
  10: "Geometry: proofs, theorems, trigonometry basics, and circle properties",
  11: "Algebra II: logarithms, complex numbers, and advanced functions",
  12: "Pre-Calculus/Calculus: limits, derivatives, and integrals"
};

// Fallback questions in case API fails or key is missing
const FALLBACK_QUESTIONS: Question[] = [
  {
    id: 'f1',
    text: '5 + 5',
    difficulty: 'easy',
    answers: [
      { id: 'a1', text: '10', isCorrect: true },
      { id: 'a2', text: '15', isCorrect: false },
      { id: 'a3', text: '55', isCorrect: false },
    ]
  },
  {
    id: 'f2',
    text: '12 × 12',
    difficulty: 'medium',
    answers: [
      { id: 'b1', text: '110', isCorrect: false },
      { id: 'b2', text: '144', isCorrect: true },
      { id: 'b3', text: '124', isCorrect: false },
    ]
  },
  {
    id: 'f3',
    text: '9 - 3',
    difficulty: 'easy',
    answers: [
      { id: 'c1', text: '6', isCorrect: true },
      { id: 'c2', text: '3', isCorrect: false },
      { id: 'c3', text: '0', isCorrect: false },
    ]
  },
  {
    id: 'f4',
    text: '√81',
    difficulty: 'medium',
    answers: [
      { id: 'd1', text: '9', isCorrect: true },
      { id: 'd2', text: '8', isCorrect: false },
      { id: 'd3', text: '7', isCorrect: false },
    ]
  },
  {
    id: 'f5',
    text: '8 / 4',
    difficulty: 'easy',
    answers: [
      { id: 'e1', text: '2', isCorrect: true },
      { id: 'e2', text: '4', isCorrect: false },
      { id: 'e3', text: '32', isCorrect: false },
    ]
  },
  {
    id: 'f6',
    text: '7 × 6',
    difficulty: 'medium',
    answers: [
      { id: 'g1', text: '42', isCorrect: true },
      { id: 'g2', text: '48', isCorrect: false },
      { id: 'g3', text: '36', isCorrect: false },
    ]
  },
  {
    id: 'f7',
    text: '15 ÷ 3',
    difficulty: 'easy',
    answers: [
      { id: 'h1', text: '5', isCorrect: true },
      { id: 'h2', text: '3', isCorrect: false },
      { id: 'h3', text: '6', isCorrect: false },
    ]
  },
  {
    id: 'f8',
    text: '20 - 8',
    difficulty: 'easy',
    answers: [
      { id: 'i1', text: '12', isCorrect: true },
      { id: 'i2', text: '10', isCorrect: false },
      { id: 'i3', text: '2', isCorrect: false },
    ]
  },
  {
    id: 'f9',
    text: '9 + 6',
    difficulty: 'easy',
    answers: [
      { id: 'j1', text: '15', isCorrect: true },
      { id: 'j2', text: '14', isCorrect: false },
      { id: 'j3', text: '16', isCorrect: false },
    ]
  },
  {
    id: 'f10',
    text: '50 + 50',
    difficulty: 'easy',
    answers: [
      { id: 'k1', text: '100', isCorrect: true },
      { id: 'k2', text: '1000', isCorrect: false },
      { id: 'k3', text: '5050', isCorrect: false },
    ]
  },
  {
    id: 'f11',
    text: '11 × 3',
    difficulty: 'medium',
    answers: [
      { id: 'l1', text: '33', isCorrect: true },
      { id: 'l2', text: '30', isCorrect: false },
      { id: 'l3', text: '36', isCorrect: false },
    ]
  }
];

export const generateMathQuestion = async (difficulty: 'easy' | 'medium' | 'hard', gradeLevel: number): Promise<Question> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.warn("No API Key found, using fallback questions.");
    return getFallbackQuestion();
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Determine topic based on grade
    const topic = GRADE_TOPICS[gradeLevel] || `general math suitable for Grade ${gradeLevel}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a single math question suitable for Grade ${gradeLevel} students.
      The specific topic should be: ${topic}.
      The difficulty within this grade level should be ${difficulty}.
      Keep the question text concise (under 10 words if possible).
      Format: Return JSON Object with 'questionText' and 'options' (array of {text, isCorrect}).
      Provide 3 options, only 1 correct.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questionText: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  isCorrect: { type: Type.BOOLEAN }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");

    const data = JSON.parse(text);
    
    if (!data.questionText || !data.options) {
        throw new Error("Invalid response format");
    }

    return {
      id: Date.now().toString(),
      text: data.questionText,
      difficulty,
      answers: data.options.map((opt: any, idx: number) => ({
        id: `opt-${idx}`,
        text: String(opt.text),
        isCorrect: !!opt.isCorrect
      })).sort(() => Math.random() - 0.5) // Shuffle answers
    };

  } catch (error: any) {
    const errorMessage = error.toString();
    const isHandledError = 
        errorMessage.includes('429') || 
        errorMessage.includes('RESOURCE_EXHAUSTED') || 
        errorMessage.includes('Invalid response format') ||
        errorMessage.includes('SyntaxError') ||
        error.status === 429 || 
        error.code === 429;

    if (isHandledError) {
        console.warn("Gemini API Issue (Quota/Format). Switching to offline/fallback mode.");
    } else {
        console.warn("Gemini API Error:", error);
    }
    return getFallbackQuestion();
  }
};

const getFallbackQuestion = (): Question => {
  const q = FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)];
  return {
    ...q,
    id: Date.now().toString(), 
    answers: [...q.answers].sort(() => Math.random() - 0.5)
  };
}
