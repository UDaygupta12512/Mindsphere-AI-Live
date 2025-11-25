import { QuizQuestion } from '../types/course';

// Dynamic quiz generation using AI service
export const generateDynamicQuiz = async (
  title: string, 
  source: 'youtube' | 'pdf', 
  content: string,
  fileName?: string, 
  url?: string,
  timestamp?: number
): Promise<QuizQuestion[]> => {
  try {
    // Call backend API to generate quiz questions
    const response = await fetch('/api/quiz/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        source,
        content,
        fileName,
        url,
        timestamp
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.quizQuestions) {
      return data.quizQuestions.map((q: any, index: number) => ({
        id: `q${index + 1}`,
        type: 'multiple-choice',
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || q.correctExplanation,
        difficulty: q.difficulty || 'medium'
      }));
    } else {
      throw new Error('Invalid response format from quiz generation API');
    }
  } catch (error) {
    console.error('Error generating dynamic quiz:', error);
    
    // Fallback to static questions if API fails
    return generateFallbackQuiz(title);
  }
};

// Fallback static quiz generator
const generateFallbackQuiz = (title: string): QuizQuestion[] => {
  const contentText = title.toLowerCase();
  
  // Basic category detection for fallback
  let category = 'general';
  if (contentText.match(/(programming|code|javascript|python|java|react|node|web|development)/)) {
    category = 'programming';
  } else if (contentText.match(/(science|biology|chemistry|physics|research)/)) {
    category = 'science';
  } else if (contentText.match(/(business|marketing|finance|economics|management)/)) {
    category = 'business';
  }

  const fallbackQuestions: { [key: string]: QuizQuestion[] } = {
    programming: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: "What is the primary purpose of version control systems?",
        options: ["Track changes in code", "Compile programs", "Debug applications", "Design interfaces"],
        correctAnswer: "Track changes in code",
        explanation: "Version control systems track changes in code over time and enable collaboration.",
        difficulty: "easy"
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        question: "Which describes a function in programming?",
        options: ["A type of variable", "A reusable block of code", "A styling method", "A database query"],
        correctAnswer: "A reusable block of code",
        explanation: "Functions are reusable blocks of code that perform specific tasks.",
        difficulty: "easy"
      }
    ],
    science: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: "What is the basic unit of life?",
        options: ["Atom", "Cell", "Molecule", "Organ"],
        correctAnswer: "Cell",
        explanation: "The cell is the fundamental unit of life.",
        difficulty: "easy"
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        question: "What process do plants use to make food?",
        options: ["Respiration", "Photosynthesis", "Digestion", "Transpiration"],
        correctAnswer: "Photosynthesis",
        explanation: "Plants use photosynthesis to convert sunlight into energy.",
        difficulty: "easy"
      }
    ],
    business: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: "What is a minimum viable product (MVP)?",
        options: ["The cheapest product", "A product with basic features", "A perfect product", "A free product"],
        correctAnswer: "A product with basic features",
        explanation: "An MVP has just enough features to satisfy early customers and gather feedback.",
        difficulty: "easy"
      }
    ],
    general: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: "What is active learning?",
        options: ["Passive listening", "Engaging with material", "Reading only", "Memorizing facts"],
        correctAnswer: "Engaging with material",
        explanation: "Active learning involves engaging with the material through activities and discussion.",
        difficulty: "medium"
      }
    ]
  };

  return fallbackQuestions[category] || fallbackQuestions.general;
};

// Dynamic flashcard generation using AI
export const generateDynamicFlashcards = async (
  title: string, 
  source: 'youtube' | 'pdf', 
  content: string,
  fileName?: string, 
  url?: string
): Promise<any[]> => {
  try {
    // Call backend API to generate flashcards
    const response = await fetch('/api/flashcards/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        source,
        content,
        fileName,
        url
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.flashcards) {
      return data.flashcards;
    } else {
      throw new Error('Invalid response format from flashcard generation API');
    }
  } catch (error) {
    console.error('Error generating dynamic flashcards:', error);
    
    // Fallback to static flashcards if API fails
    return generateFallbackFlashcards(title);
  }
};

const generateFallbackFlashcards = (title: string) => {
  return [
    {
      front: "Key Concept",
      back: `Important information about ${title}`
    },
    {
      front: "Main Topic",
      back: `Core subject matter covered in ${title}`
    },
    {
      front: "Application",
      back: `How to apply concepts from ${title}`
    }
  ];
};

// Dynamic lesson generation using AI
export const generateDynamicLessons = async (
  title: string, 
  source: 'youtube' | 'pdf', 
  content: string,
  fileName?: string, 
  url?: string
): Promise<any[]> => {
  try {
    // Call backend API to generate lessons
    const response = await fetch('/api/lessons/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        source,
        content,
        fileName,
        url
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.lessons) {
      return data.lessons;
    } else {
      throw new Error('Invalid response format from lesson generation API');
    }
  } catch (error) {
    console.error('Error generating dynamic lessons:', error);
    
    // Fallback to static lessons if API fails
    return generateFallbackLessons(title);
  }
};

const generateFallbackLessons = (title: string) => {
  return [
    {
      title: `Introduction to ${title}`,
      content: `Overview and fundamentals of ${title}`,
      order: 1
    },
    {
      title: `Core Concepts`,
      content: `Key principles and important concepts`,
      order: 2
    },
    {
      title: `Practical Application`,
      content: `Real-world examples and use cases`,
      order: 3
    }
  ];
}; 