export interface Course {
  _id: string;
  id?: string;
  title: string;
  description: string;
  source?: string;
  sourceType?: 'youtube' | 'pdf' | 'text' | 'catalog';
  sourceUrl?: string;
  fileName?: string;
  createdAt: Date;
  duration: string;
  topics: string[];
  progress: number;
  notes: CourseNote[];
  quizzes: Quiz[];
  flashcards: Flashcard[];
  summary: string;
  lessons: Lesson[];
  instructor: string;
  rating: number;
  studentsEnrolled: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  thumbnail: string;
  totalLessons: number;
  completedLessons: number;
  certificate: boolean;
  lastAccessed?: Date;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoUrl?: string;
  videoId?: string;
  videoTitle?: string;
  isSearchUrl?: boolean;
  content: string;
  isCompleted: boolean;
  order: number;
  resources: LessonResource[];
  transcript?: string;
}

export interface LessonResource {
  id: string;
  title: string;
  type: 'pdf' | 'link' | 'code' | 'image';
  url: string;
  size?: string;
}

export interface CourseNote {
  id: string;
  title: string;
  summary?: string | string[];
  details?: string;
  content?: string; // fallback for old notes
  timestamp?: string;
  topics: string[];
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  completedAt?: Date;
  score?: number;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'coding';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string; // fallback for old quizzes
  explanations?: Record<string, string>; // for new quizzes (A/B/C/D)
  correctExplanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Flashcard {
  id?: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed?: Date;
  nextReview?: Date;
  reviewCount: number;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  courseContext?: string;
} 