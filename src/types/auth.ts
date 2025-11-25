export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  subscription: 'free' | 'premium';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
} 