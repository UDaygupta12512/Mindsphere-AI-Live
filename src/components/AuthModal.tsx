import React, { useState } from 'react'; 
import { X } from 'lucide-react';
import { authApi, setToken } from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuth: (user: any) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuth }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    newPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Trim inputs
    const email = formData.email.trim();
    const name = formData.name.trim();

    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (email.length > 100) {
      newErrors.email = 'Email is too long';
    }

    if (mode === 'reset') {
      if (!formData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      } else if (formData.newPassword.length > 50) {
        newErrors.newPassword = 'Password is too long';
      } else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(formData.newPassword)) {
        newErrors.newPassword = 'Password must contain letters and numbers';
      }
    } else {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      } else if (formData.password.length > 50) {
        newErrors.password = 'Password is too long';
      }

      if (mode === 'signup') {
        if (!name) {
          newErrors.name = 'Name is required';
        } else if (name.length < 2) {
          newErrors.name = 'Name must be at least 2 characters';
        } else if (name.length > 50) {
          newErrors.name = 'Name is too long';
        } else if (!/^[a-zA-Z\s'-]+$/.test(name)) {
          newErrors.name = 'Name can only contain letters, spaces, hyphens, and apostrophes';
        }

        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }

        // Password strength for signup
        if (formData.password && formData.password.length >= 6) {
          if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(formData.password)) {
            newErrors.password = 'Password must contain letters and numbers';
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    if (!validateForm()) return;

    setIsLoading(true);

    // Trim inputs before submission
    const trimmedEmail = formData.email.trim().toLowerCase();
    const trimmedName = formData.name.trim();

    try {
      if (mode === 'reset') {
        await authApi.resetPassword({
          email: trimmedEmail,
          newPassword: formData.newPassword
        });
        setSuccessMessage('Password reset successfully! You can now login.');
        setFormData({ ...formData, newPassword: '' });
        setTimeout(() => {
          setMode('login');
          setSuccessMessage('');
        }, 2000);
      } else if (mode === 'signup') {
        const response = await authApi.signup({
          name: trimmedName,
          email: trimmedEmail,
          password: formData.password
        });
        setToken(response.token);
        onAuth(response.user);
        onClose();
      } else {
        const response = await authApi.login({
          email: trimmedEmail,
          password: formData.password
        });
        setToken(response.token);
        onAuth(response.user);
        onClose();
      }
    } catch (error) {
      console.error('Auth error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Authentication failed. Please try again.';
      setErrors({ general: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const switchMode = (newMode: 'login' | 'signup' | 'reset') => {
    setMode(newMode);
    setFormData({ name: '', email: formData.email, password: '', confirmPassword: '', newPassword: '' });
    setErrors({});
    setSuccessMessage('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transition-colors duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
            <span className="sr-only">Close</span>
          </button>
          <h2 className="text-2xl font-bold">
            {mode === 'signup' ? 'Sign Up' : mode === 'reset' ? 'Reset Password' : 'Login'}
          </h2>
        </div>

        {/* Form */}
        <div className="p-6">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{errors.general}</p>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-600 dark:text-green-400 text-sm">{successMessage}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>
            )}

            {mode === 'reset' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your new password"
                />
                {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>}
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {isLoading ? 'Processing...' : mode === 'signup' ? 'Sign Up' : mode === 'reset' ? 'Reset Password' : 'Login'}
            </button>
          </form>

          <div className="mt-4 text-center space-y-2">
            {mode === 'login' && (
              <button
                onClick={() => switchMode('reset')}
                className="text-sm text-gray-500 hover:text-blue-600 hover:underline"
              >
                Forgot Password?
              </button>
            )}
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {mode === 'signup' ? 'Already have an account?' : mode === 'reset' ? 'Remember your password?' : "Don't have an account?"}{' '}
              <button
                onClick={() => switchMode(mode === 'signup' ? 'login' : mode === 'reset' ? 'login' : 'signup')}
                className="text-blue-600 hover:underline"
              >
                {mode === 'signup' ? 'Login' : mode === 'reset' ? 'Login' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal; 