'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Database, Loader as Loader2, CircleHelp as HelpCircle } from 'lucide-react';
import Link from 'next/link';

const verifyAccountSchema = z.object({
  accountIdentifier: z.string().min(1, 'Account identifier is required')
});

type VerifyAccountFormData = z.infer<typeof verifyAccountSchema>;

export default function VerifyAccountPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<VerifyAccountFormData>({
    resolver: zodResolver(verifyAccountSchema)
  });

  const onSubmit = async (data: VerifyAccountFormData) => {
    setIsLoading(true);
    try {
      // Simulate API call to verify account
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, accept any non-empty identifier
      if (data.accountIdentifier.trim()) {
        // Store the account identifier for the login page
        sessionStorage.setItem('accountIdentifier', data.accountIdentifier);
        router.push('/login');
      } else {
        setError('accountIdentifier', { message: 'Invalid account identifier' });
      }
    } catch (error) {
      setError('accountIdentifier', { message: 'Failed to verify account. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
            <Database className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Account Verification</h2>
          <p className="text-gray-400">
            Enter your account identifier or account URL
          </p>
        </div>

        {/* Form */}
        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="accountIdentifier" className="block text-sm font-medium text-gray-300 mb-2">
                Account identifier
              </label>
              <input
                {...register('accountIdentifier')}
                type="text"
                autoComplete="username"
                className={`
                  w-full px-4 py-3 border rounded-lg bg-gray-700 
                  text-white placeholder-gray-400 focus:outline-none 
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200
                  ${errors.accountIdentifier ? 'border-red-500' : 'border-gray-600'}
                `}
                placeholder="Account identifier"
              />
              {errors.accountIdentifier && (
                <p className="mt-1 text-sm text-red-400">{errors.accountIdentifier.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Verifying...
                </>
              ) : (
                'Sign in'
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push('/signup')}
              className="w-full flex justify-center items-center px-4 py-3 border border-gray-600 text-base font-medium rounded-lg text-gray-300 bg-transparent hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
            >
              Sign up
            </button>
          </form>

          {/* Help Section */}
          <div className="mt-6">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Where to find your account identifier
            </button>
            
            {showHelp && (
              <div className="mt-3 p-4 bg-gray-700 rounded-lg border border-gray-600">
                <div className="text-sm text-gray-300">
                  <p className="font-medium text-white mb-2">Account identifier format:</p>
                  <div className="bg-gray-800 p-3 rounded border border-gray-600 font-mono text-xs text-gray-300">
                    https://&lt;account_identifier&gt;.snowflakecomputing.com
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    Your account identifier is the unique name that identifies your Snowflake account within your organization and the cloud platform where your account is hosted.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}