'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Database, Loader as Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { AuthService, ApiError } from '@/lib/api';
import Link from 'next/link';
import { useEffect } from 'react';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional()
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accountIdentifier, setAccountIdentifier] = useState('');
  const router = useRouter();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  useEffect(() => {
    // Get account identifier from session storage using AuthService
    const storedIdentifier = AuthService.getAccountIdentifier();
    if (storedIdentifier) {
      setAccountIdentifier(storedIdentifier);
    } else {
      // If no account identifier, redirect back to verify page
      router.push('/verify-account');
    }
  }, [router]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      if (!accountIdentifier) {
        setError('username', { message: 'Account identifier not found. Please verify your account first.' });
        return;
      }

      // Call the real API with account identifier, username, and password
      const loginResult = await AuthService.login(accountIdentifier, data.username, data.password);
      
      // Update the auth store with the user data
      const success = await login(loginResult.user.email, data.password, loginResult.user);
      
      if (success) {
        // Clear the account identifier from session storage after successful login
        AuthService.clearAccountIdentifier();
        router.push('/dashboard');
      } else {
        setError('username', { message: 'Login failed. Please try again.' });
      }
    } catch (error) {
      if (error instanceof ApiError) {
        switch (error.status) {
          case 401:
            setError('username', { message: 'Invalid credentials' });
            break;
          case 404:
            setError('username', { message: 'Account not found' });
            break;
          case 403:
            setError('username', { message: 'Account is inactive' });
            break;
          case 400:
            if (error.details?.validation_errors) {
              // Handle validation errors
              error.details.validation_errors.forEach((validationError: any) => {
                if (validationError.field === 'username') {
                  setError('username', { message: validationError.message });
                } else if (validationError.field === 'password') {
                  setError('password', { message: validationError.message });
                }
              });
            } else {
              setError('username', { message: error.message || 'Invalid request' });
            }
            break;
          case 0:
            setError('username', { message: 'Network error - please check your connection' });
            break;
          default:
            setError('username', { message: error.message || 'Login failed' });
        }
      } else {
        setError('username', { message: 'An error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setValue('username', 'demo');
    setValue('password', 'password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
            <Database className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {accountIdentifier ? `Welcome to ${accountIdentifier}` : 'Welcome back'}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign in to your account to continue
          </p>
          {accountIdentifier && (
            <div className="mt-2">
              <Link
                href="/verify-account"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Not your account? Switch account
              </Link>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                {...register('username')}
                type="text"
                autoComplete="username"
                className={`
                  w-full px-4 py-3 border rounded-lg bg-gray-50 dark:bg-gray-700 
                  text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none 
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200
                  ${errors.username ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}
                `}
                placeholder="Enter your username"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`
                    w-full px-4 py-3 border rounded-lg bg-gray-50 dark:bg-gray-700 
                    text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none 
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200
                    ${errors.password ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}
                  `}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  {...register('remember')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">Demo credentials:</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">Username: demo</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">Password: password123</p>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                Fill Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}