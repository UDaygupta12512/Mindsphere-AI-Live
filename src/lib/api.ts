// API client configuration
// Use relative URL for production (Vercel), absolute URL for local development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:4000');
const TOKEN_KEY = 'ms_token';

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
    
    // Parse response
    const data = await response.json();
    
    // Handle errors
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
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

import {
  Achievement,
  AwardPointsResponse,
  UserPoints,
  Certificate,
  PointsCategory,
} from '../types/achievement';

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
  signup: (data: { name: string; email: string; password: string }) => {
    return api.post<{ token: string; user: UserResponse }>('/api/auth/signup', data);
  },
  
  login: (data: { email: string; password: string }) => {
    return api.post<{ token: string; user: UserResponse }>('/api/auth/login', data);
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
 