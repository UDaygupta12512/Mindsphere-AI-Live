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
  const headers = new Headers({
    'Content-Type': 'application/json',
  });

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
};

// Catalog API
export const catalogApi = {
  getAll: () => {
    return api.get<CourseResponse[]>('/api/catalog');
  },
  
  enroll: (courseId: string) => {
    return api.post<CourseResponse>(`/api/catalog/${courseId}/enroll`);
  },
};

// Chat API
export const chatApi = {
  sendMessage: (message: string) => {
    return api.post<{ reply: string }>('/api/chat', { message });
  },
};

// Health check
export const healthCheck = () => {
  return api.get<{ ok: boolean }>('/api/health');
};
 