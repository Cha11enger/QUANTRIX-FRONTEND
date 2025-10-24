'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Database, Loader2, CircleHelp as HelpCircle, X, Clock } from 'lucide-react';
import { AuthService, ApiError, StoredAccount } from '@/lib/api';

const verifyAccountSchema = z.object({
  accountIdentifier: z.string().min(1, 'Account identifier is required')
});

type VerifyAccountFormData = z.infer<typeof verifyAccountSchema>;

export default function VerifyAccountPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [storedAccounts, setStoredAccounts] = useState<StoredAccount[]>([]);
  const [loadingAccountId, setLoadingAccountId] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue
  } = useForm<VerifyAccountFormData>({
    resolver: zodResolver(verifyAccountSchema)
  });

  useEffect(() => {
    // Load stored accounts on component mount
    const accounts = AuthService.getStoredAccounts();
    setStoredAccounts(accounts);
  }, []);

  const onSubmit = async (data: VerifyAccountFormData) => {
    setIsLoading(true);
    try {
      // Call the real API to verify account
      const verificationResult = await AuthService.verifyAccount(data.accountIdentifier);
      
      if (verificationResult.valid) {
        // Store the account identifier securely for the login page
        AuthService.setAccountIdentifier(data.accountIdentifier);
        
        // Save to stored accounts for future use
        const storedAccount: StoredAccount = {
          accountIdentifier: data.accountIdentifier,
          organizationName: verificationResult.organizationName,
          accountName: verificationResult.accountName,
          lastUsed: new Date().toLocaleDateString(),
          timestamp: Date.now()
        };
        AuthService.saveStoredAccount(storedAccount);
        
        // Redirect to login page
        router.push('/login');
      } else {
        setError('accountIdentifier', { message: 'Account identifier is not valid' });
      }
    } catch (error) {
      if (error instanceof ApiError) {
        switch (error.status) {
          case 404:
            setError('accountIdentifier', { message: 'Account not found' });
            break;
          case 400:
            setError('accountIdentifier', { message: 'Invalid account identifier format' });
            break;
          case 403:
            setError('accountIdentifier', { message: 'Account is inactive' });
            break;
          case 0:
            setError('accountIdentifier', { message: 'Network error - please check your connection' });
            break;
          default:
            setError('accountIdentifier', { message: error.message || 'Failed to verify account' });
        }
      } else {
        setError('accountIdentifier', { message: 'Failed to verify account. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoredAccountSelect = async (account: StoredAccount) => {
    setLoadingAccountId(account.accountIdentifier);
    try {
      // Verify the stored account is still valid
      const verificationResult = await AuthService.verifyAccount(account.accountIdentifier);
      
      if (verificationResult.valid) {
        // Update the stored account with new timestamp
        const updatedAccount: StoredAccount = {
          ...account,
          lastUsed: new Date().toLocaleDateString(),
          timestamp: Date.now()
        };
        AuthService.saveStoredAccount(updatedAccount);
        
        // Store the account identifier for login
        AuthService.setAccountIdentifier(account.accountIdentifier);
        
        // Redirect to login page
        router.push('/login');
      } else {
        // Remove invalid account from storage
        AuthService.removeStoredAccount(account.accountIdentifier);
        setStoredAccounts(prev => prev.filter(acc => acc.accountIdentifier !== account.accountIdentifier));
        setError('accountIdentifier', { message: 'This account is no longer valid and has been removed' });
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        // Remove account that no longer exists
        AuthService.removeStoredAccount(account.accountIdentifier);
        setStoredAccounts(prev => prev.filter(acc => acc.accountIdentifier !== account.accountIdentifier));
        setError('accountIdentifier', { message: 'Account not found and has been removed from saved accounts' });
      } else {
        setError('accountIdentifier', { message: 'Failed to verify stored account. Please try again.' });
      }
    } finally {
      setLoadingAccountId(null);
    }
  };

  const handleRemoveStoredAccount = (accountIdentifier: string, event: React.MouseEvent) => {
    event.stopPropagation();
    AuthService.removeStoredAccount(accountIdentifier);
    setStoredAccounts(prev => prev.filter(acc => acc.accountIdentifier !== accountIdentifier));
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
          {/* Stored Accounts Section */}
          {storedAccounts.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Select an account to sign into</h3>
              <div className="space-y-3">
                {storedAccounts.map((account) => (
                  <button
                    key={account.accountIdentifier}
                    type="button"
                    onClick={() => handleStoredAccountSelect(account)}
                    disabled={loadingAccountId === account.accountIdentifier}
                    className="w-full p-4 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg transition-all duration-200 group relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-left">
                        <div className="text-white font-medium text-lg">
                          {account.accountIdentifier}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {account.organizationName}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                          <Clock className="w-3 h-3" />
                          Last used: {account.lastUsed}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {loadingAccountId === account.accountIdentifier ? (
                          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleRemoveStoredAccount(account.accountIdentifier, e)}
                            className="p-1 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove account"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="mt-6 flex items-center">
                <div className="flex-1 border-t border-gray-600"></div>
                <span className="px-4 text-gray-400 text-sm">Or enter manually</span>
                <div className="flex-1 border-t border-gray-600"></div>
              </div>
            </div>
          )}

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