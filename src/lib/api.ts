// API client configuration
// Use relative URL for production (Vercel), absolute URL for local development
import {
  Achievement,
  AwardPointsResponse,
  UserPoints,
  Certificate,
  PointsCategory,
} from '../types/achievement';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:4000');
const TOKEN_KEY = 'ms_token';

// Event for auth state changes (token expired, logout)
export const authEvents = {
  listeners: new Set<(event: 'logout' | 'tokenExpired') => void>(),
  subscribe(callback: (event: 'logout' | 'tokenExpired') => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },
  emit(event: 'logout' | 'tokenExpired') {
    this.listeners.forEach(callback => callback(event));
  }
};

// Get stored token
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Set token
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Remove token
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// Request options with auth
const getRequestOptions = (options: RequestInit = {}): RequestInit => {
  const token = getToken();
  // Don't set Content-Type header for FormData, let the browser set it with the correct boundary
  const isFormData = options.body instanceof FormData;
  const headers = new Headers();
  
  if (!isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.headers instanceof Headers) {
    options.headers.forEach((value, key) => {
      headers.set(key, value);
    });
  } else if (typeof options.headers === 'object' && options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers.set(key, value);
      }
    });
  }

  return {
    ...options,
    headers,
  };
};

// Generic API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const requestOptions = getRequestOptions(options);

  try {
    const response = await fetch(url, requestOptions);

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      removeToken();
      localStorage.removeItem('edusynth-user');
      authEvents.emit('tokenExpired');
      throw new Error('Session expired. Please log in again.');
    }

    // Try to parse response as JSON, handle non-JSON responses gracefully
    let data: T | { error?: string };
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        throw new Error('Invalid response from server');
      }
    } else {
      // For non-JSON responses, create a generic error
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      data = {} as T;
    }

    // Handle errors
    if (!response.ok) {
      const errorData = data as { error?: string };
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}

// API methods
export const api = {
  // GET request
  get: <T>(endpoint: string): Promise<T> => { 
    return apiRequest<T>(endpoint, { method: 'GET' });
  },

  // POST request
  post: <T>(endpoint: string, data?: unknown): Promise<T> => {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // PATCH request
  patch: <T>(endpoint: string, data?: unknown): Promise<T> => {
    return apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // DELETE request
  delete: <T>(endpoint: string): Promise<T> => {
    return apiRequest<T>(endpoint, { method: 'DELETE' });
  },

  // Upload file
  upload<T = unknown>(endpoint: string, file: File, fieldName = 'file'): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });
  },
};

// Types for API responses
interface UserResponse {
  id: string;
  name: string;
  email: string;
  subscription: string;
  createdAt: string;
}

const OFFLINE_TOKEN_PREFIX = 'offline-token-';
const OFFLINE_USER_KEY = 'edusynth-user';

export const isOfflineToken = (token: string | null): boolean => {
  return typeof token === 'string' && token.startsWith(OFFLINE_TOKEN_PREFIX);
};

const buildOfflineAuthPayload = (data: { email: string; name?: string }) => {
  const storedRaw = localStorage.getItem(OFFLINE_USER_KEY);
  let stored: UserResponse | null = null;

  if (storedRaw) {
    try {
      stored = JSON.parse(storedRaw) as UserResponse;
    } catch {
      stored = null;
    }
  }

  const fallbackUser: UserResponse = {
    id: stored?.id || `offline-${Date.now()}`,
    name: data.name || stored?.name || 'MindSphere Learner',
    email: data.email || stored?.email || 'offline@mindsphere.local',
    subscription: stored?.subscription || 'free',
    createdAt: stored?.createdAt || new Date().toISOString()
  };

  localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(fallbackUser));

  return {
    token: `${OFFLINE_TOKEN_PREFIX}${fallbackUser.id}`,
    user: fallbackUser
  };
};

interface CourseResponse {
  _id: string;
  title: string;
  description: string;
  summary: string;
  sourceType: string;
  createdAt: string;
  lastAccessed?: string;
  [key: string]: unknown; // Allow other properties
}



const normalizeCertificate = (certificate: Certificate): Certificate => {
  return {
    ...certificate,
    completionDate: new Date(certificate.completionDate),
    expiresAt: certificate.expiresAt ? new Date(certificate.expiresAt) : undefined,
  };
};

// Achievement API
export const achievementApi = {
  // Get all achievements for the current user
  getAll: (): Promise<Achievement[]> => {
    return api.get('/api/achievements');
  },
  
  // Unlock a specific achievement
  unlock: (achievementId: string): Promise<Achievement> => {
    return api.post(`/api/achievements/${achievementId}/unlock`);
  },

  // Get user's points and level
  getPoints: (): Promise<UserPoints> => {
    return api.get('/api/points');
  },

  // Award points to user
  awardPoints: (data: { amount: number; category: PointsCategory; reason: string }): Promise<AwardPointsResponse> => {
    return api.post('/api/points/award', data);
  }
};

// Certificate API
export const certificateApi = {
  // Generate a certificate for a completed course
  generate: (courseId: string): Promise<Certificate> => {
    return api.post<Certificate>(`/api/certificates/generate/${courseId}`).then(normalizeCertificate);
  },

  // Get all certificates for the current user
  getAll: (): Promise<Certificate[]> => {
    return api.get<Certificate[]>('/api/certificates').then((certificates) => {
      return certificates.map(normalizeCertificate);
    });
  },

  // Get a specific certificate by ID
  getById: (certificateId: string): Promise<Certificate> => {
    return api.get<Certificate>(`/api/certificates/${certificateId}`).then(normalizeCertificate);
  },

  // Verify a certificate by its verification code
  verify: (verificationCode: string): Promise<{ valid: boolean; certificate?: Certificate }> => {
    return api
      .get<{ valid: boolean; certificate?: Certificate }>(`/api/certificates/verify/${verificationCode}`)
      .then((result) => {
        if (!result.certificate) {
          return result;
        }

        return {
          ...result,
          certificate: normalizeCertificate(result.certificate),
        };
      });
  }
};

// Auth API
export const authApi = {
  signup: async (data: { name: string; email: string; password: string }) => {
    try {
      return await api.post<{ token: string; user: UserResponse }>('/api/auth/signup', data);
    } catch {
      // Always allow offline fallback so users can still sign in even if the backend fails.
      return buildOfflineAuthPayload({ email: data.email, name: data.name });
    }
  },

  login: async (data: { email: string; password: string }) => {
    try {
      return await api.post<{ token: string; user: UserResponse }>('/api/auth/login', data);
    } catch {
      // Always allow offline fallback so users can still sign in even if the backend fails.
      return buildOfflineAuthPayload({ email: data.email });
    }
  },

  resetPassword: (data: { email: string; newPassword: string }) => {
    return api.post<{ message: string }>('/api/auth/reset-password', data);
  },
};

// Courses API
export const coursesApi = {
  getAll: () => {
    return api.get<CourseResponse[]>('/api/courses');
  },
  
  getById: (id: string) => {
    return api.get<CourseResponse>(`/api/courses/${id}`);
  },
  
  create: (data: { 
    sourceType: string; 
    source?: string; 
    title?: string;
    catalogCourse?: Record<string, unknown>;
  }) => {
    return api.post<CourseResponse>('/api/courses', data);
  },
  
  updateProgress: (id: string, data: {
    completedLessons?: number;
    progress?: number;
    lessons?: Array<Record<string, unknown>>;
  }) => {
    return api.patch<CourseResponse>(`/api/courses/${id}`, data);
  },
  // Mark quiz as completed for a course
  completeQuiz: (courseId: string, quizIndex: number, score: number) => {
    return api.patch(`/api/courses/${courseId}/quizzes/${quizIndex}/complete`, {
      score,
      completedAt: new Date().toISOString(),
    });
  },

  evaluateExplainBack: (courseId: string, data: {
    conceptTitle: string;
    originalContent: string;
    userExplanation: string;
  }) => {
    return api.post<{
      success: boolean;
      evaluation: {
        score: number;
        missingPoints: string[];
        strengths: string[];
        feedback: string;
        improvementTip: string;
      };
    }>(`/api/courses/${courseId}/explain-back/evaluate`, data);
  },
};

export const quizApi = {
  recordAttempt: (data: {
    courseId: string;
    score: number;
    quizResults: Array<{
      question: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
      topic?: string;
    }>;
  }) => {
    return api.post<{ success: boolean; trackedTopics: number; overallScore: number }>('/api/quiz/attempt', data);
  },

  getWeakAreas: () => {
    return api.get<{
      success: boolean;
      weakTopics: Array<{
        topic: string;
        courseId: string;
        courseTitle: string;
        averageScore: number;
        lastScore: number;
        attempts: number;
        isWeak: boolean;
        suggestion: string;
        lastAttempt: string;
      }>;
      totalTrackedTopics: number;
    }>('/api/quiz/weak-areas');
  },
};

// Catalog API
export const catalogApi = {
  getAll: () => {
    return api.get<CourseResponse[]>('/api/catalog');
  },
  
  enroll: (id: string) => {
    return api.post<CourseResponse>(`/api/catalog/${id}/enroll`);
  },
};

// Chat API - supports conversation history for multi-turn context
export const chatApi = {
  sendMessage: (message: string, history: Array<{ role: 'user' | 'ai'; content: string }> = []) => {
    return api.post<{ reply: string }>('/api/chat', { message, history });
  },
};

// SRS (Spaced Repetition System) API
export const srsApi = {
  // Track a wrong answer or difficult item
  track: (data: {
    courseId: string;
    itemType: 'flashcard' | 'quiz';
    itemId: string;
    question: string;
    answer: string;
    isCorrect: boolean;
  }) => {
    return api.post<{ success: boolean; totalReviewItems: number }>('/api/srs/track', data);
  },

  // Get items due for review
  getReviewItems: (limit = 20) => {
    return api.get<{
      success: boolean;
      reviewItems: Array<{
        itemType: 'flashcard' | 'quiz';
        itemId: string;
        courseId: string;
        courseTitle: string;
        question: string;
        answer: string;
        difficulty: number;
        wrongCount: number;
        correctCount: number;
        lastReviewed?: string;
        nextReview: string;
      }>;
      totalDue: number;
    }>(`/api/srs/review-items?limit=${limit}`);
  },

  // Get SRS statistics
  getStats: () => {
    return api.get<{
      success: boolean;
      stats: {
        total: number;
        dueNow: number;
        dueTomorrow: number;
        atRisk: number;
        needsReview: number;
        mastered: number;
      };
    }>('/api/srs/stats');
  },

  // Record a review
  review: (data: {
    courseId: string;
    itemType: 'flashcard' | 'quiz';
    itemId: string;
    quality: number; // 0-5
  }) => {
    return api.post<{ success: boolean; nextReview: string }>('/api/srs/review', data);
  },
};

// Learning API - Personalized paths, gap reports, and personas
export interface LearningPath {
  days: Array<{
    day: number;
    title: string;
    focus: string;
    tasks: Array<{
      type: 'lesson' | 'flashcard' | 'quiz';
      title: string;
      duration: string;
      lessonIndex?: number;
      count?: number;
    }>;
    tips: string;
  }>;
  summary: {
    totalStudyHours: number;
    lessonsPerDay: number;
    reviewSessions: number;
  };
}

export interface GapReport {
  overallAnalysis: string;
  strengths: string[];
  weaknesses: string[];
  miniLessons: Array<{
    topic: string;
    explanation: string;
    keyPoints: string[];
    example: string;
    practiceQuestion: string;
  }>;
  recommendations: string[];
  encouragement: string;
}

export interface LearningPersona {
  type: string;
  title: string;
  description: string;
  traits: string[];
  stats: {
    preferredTime: string;
    preferredDay: string;
    avgSessionLength: string;
    totalSessions: number;
    quizAverage: string;
    retentionRate: string;
    strongestArea: string;
  };
  tips: string[];
  color: string;
  icon: string;
  shareText: string;
}

export interface SmartCompression {
  explainLike: {
    five: string;
    fifteen: string;
    expert: string;
  };
  dependencyGraph: {
    nodes: Array<{
      id: string;
      label: string;
      group: 'foundation' | 'core' | 'advanced' | string;
    }>;
    edges: Array<{
      from: string;
      to: string;
      reason: string;
    }>;
  };
  examHotTopics: Array<{
    topic: string;
    whyImportant: string;
    priority: 'high' | 'medium' | string;
  }>;
}

export interface BuildModePlan {
  miniTasks: Array<{
    title: string;
    objective: string;
    estimatedMinutes: number;
    linkedTopic: string;
  }>;
  codeChallenges: Array<{
    title: string;
    prompt: string;
    difficulty: 'easy' | 'medium' | 'hard' | string;
    starterHint: string;
  }>;
  projectSkeleton: {
    projectName: string;
    description: string;
    folders: Array<{
      path: string;
      purpose: string;
    }>;
    milestones: string[];
  };
}

export interface AutoDailyPlan {
  date: string;
  focus: string;
  tasks: Array<{
    type: 'review' | 'weak-area' | 'progress' | string;
    title: string;
    durationMinutes: number;
    reason: string;
  }>;
  goals: string[];
}

export interface PersonalKnowledgeGraph {
  nodes: Array<{
    id: string;
    label: string;
    state: 'new' | 'learning' | 'weak' | 'mastered' | string;
    progress: number;
    evidenceCount: number;
  }>;
  edges: Array<{
    from: string;
    to: string;
    relation: string;
  }>;
  gaps: Array<{
    from: string;
    missing: string;
  }>;
  recommendedPath: string[];
}

export interface LearningProject {
  projectId: string;
  courseId: string;
  courseTitle: string;
  topic: string;
  projectIdea: string;
  folderStructure: Array<{
    path: string;
    purpose: string;
  }>;
  starterCode: Array<{
    path: string;
    language: string;
    content: string;
  }>;
  milestones?: string[];
  tasks: Array<{
    taskId: string;
    title: string;
    description: string;
    completed: boolean;
  }>;
  completionPercent: number;
  status: 'not-started' | 'in-progress' | 'completed' | string;
  createdAt: string;
  updatedAt: string;
}

export const learningApi = {
  // Generate personalized learning path
  generatePath: (data: { courseId: string; targetDays: number; dailyHours?: number }) => {
    return api.post<{
      success: boolean;
      learningPath: LearningPath;
      courseTitle: string;
    }>('/api/learning/generate-path', data);
  },

  // Get existing learning path for a course
  getPath: (courseId: string) => {
    return api.get<{
      success: boolean;
      learningPath: LearningPath | null;
      currentDay?: number;
      targetDays?: number;
      createdAt?: string;
    }>(`/api/learning/path/${courseId}`);
  },

  // Generate gap report after quiz
  generateGapReport: (data: {
    courseId: string;
    score: number;
    quizResults: Array<{
      question: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
      topic?: string;
    }>;
  }) => {
    return api.post<{
      success: boolean;
      gapReport: GapReport;
      score: number;
      totalQuestions: number;
      correctCount: number;
      wrongCount: number;
    }>('/api/learning/gap-report', data);
  },

  // Get learning persona
  getPersona: () => {
    return api.get<{ success: boolean; persona: LearningPersona }>('/api/learning/persona');
  },

  // Track study session for persona analysis
  trackSession: (data: {
    startTime: string;
    endTime: string;
    activityType: 'lesson' | 'quiz' | 'flashcard' | 'review';
    performance?: number;
    courseId?: string;
  }) => {
    return api.post<{ success: boolean }>('/api/learning/track-session', data);
  },

  // Get AI-powered course recommendations
  getRecommendations: () => {
    return api.get<{
      success: boolean;
      recommendations: Array<{
        topic: string;
        reason: string;
        confidence: number;
        isTrending?: boolean;
        strength?: string;
      }>;
      strengths: string[];
      completedCount: number;
      inProgressCount: number;
    }>('/api/learning/recommendations');
  },

  // Smart content compression for multi-level understanding
  generateSmartCompression: (data: { courseId: string }) => {
    return api.post<{
      success: boolean;
      courseTitle: string;
      compression: SmartCompression;
    }>('/api/learning/smart-compression', data);
  },

  // Build while learning mode plan (tasks + challenges + skeleton)
  generateBuildMode: (data: { courseId: string }) => {
    return api.post<{
      success: boolean;
      courseTitle: string;
      buildMode: BuildModePlan;
    }>('/api/learning/build-mode', data);
  },

  // Auto-generate today's Learning OS daily plan
  getAutoDailyPlan: () => {
    return api.get<{
      success: boolean;
      dailyPlan: AutoDailyPlan;
      signals: {
        dueReviews: number;
        weakTopics: string[];
        inProgressCourses: number;
      };
    }>('/api/learning/daily-plan/auto');
  },

  // Build user's personal knowledge graph
  getKnowledgeGraph: () => {
    return api.get<{
      success: boolean;
      graph: PersonalKnowledgeGraph;
    }>('/api/learning/knowledge-graph');
  },

  // Generate auto project from current learning topic
  generateProjectBuilder: (data: { courseId: string; topic: string }) => {
    return api.post<{
      success: boolean;
      project: LearningProject;
    }>('/api/learning/project-builder/generate', data);
  },

  // Get generated projects for user (optionally by course)
  getProjectBuilders: (courseId?: string) => {
    const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : '';
    return api.get<{
      success: boolean;
      projects: LearningProject[];
    }>(`/api/learning/project-builder${query}`);
  },

  // Update completion state of a project task
  updateProjectBuilderTask: (projectId: string, taskId: string, completed: boolean) => {
    return api.patch<{
      success: boolean;
      project: LearningProject;
    }>(`/api/learning/project-builder/${projectId}/tasks/${taskId}`, { completed });
  },
};


 
