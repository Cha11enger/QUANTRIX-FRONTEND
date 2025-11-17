'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Save, Shield, Key, Smartphone, AlertCircle, CheckCircle } from 'lucide-react';
import { AuthService, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function SecuritySettings() {
  const router = useRouter();
  const { logout } = useAuthStore();
  
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('At least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Contains uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Contains lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Contains number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Contains special character');
    }
    return errors;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate passwords match
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('New passwords do not match');
      }

      // Validate new password strength
      const passwordErrors = validatePassword(passwordData.newPassword);
      if (passwordErrors.length > 0) {
        throw new Error(`Password must meet the following requirements: ${passwordErrors.join(', ')}`);
      }

      // Call API to change password
      const response = await AuthService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Show success message and automatically logout
      showSuccessMessage(`${response.message} You will be logged out automatically in 3 seconds...`);
      
      // Wait 3 seconds before logging out
      setTimeout(async () => {
        try {
          // Call API logout to clear tokens
          await AuthService.logout();
          // Clear local auth state
          logout();
          // Redirect to login page
          router.push('/login');
        } catch (logoutError) {
          console.warn('Logout API call failed:', logoutError);
          // Even if API call fails, still logout locally
          logout();
          router.push('/login');
        }
      }, 3000);
    } catch (err: any) {
      let errorMessage = 'Failed to change password. Please try again.';
      if (err instanceof ApiError) {
        if (err.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
          setTimeout(() => {
            logout();
            router.push('/login');
          }, 2000);
        } else if (err.status === 422 && Array.isArray(err.details?.errors)) {
          errorMessage = `Validation failed: ${err.details.errors.join(', ')}`;
        } else if (err.status === 400) {
          errorMessage = err.message || errorMessage;
        } else {
          errorMessage = err.message || errorMessage;
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrengthErrors = validatePassword(passwordData.newPassword);
  const isPasswordValid = passwordData.newPassword.length > 0 && passwordStrengthErrors.length === 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security Settings</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account security and authentication settings
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-green-800 dark:text-green-200">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Password Change Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Password</h3>
        </div>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            
            {/* Password Requirements */}
            {passwordData.newPassword.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">Password must meet the following requirements:</p>
                <ul className="text-xs space-y-1">
                  {[
                    { requirement: 'At least 8 characters long', valid: passwordData.newPassword.length >= 8 },
                    { requirement: 'Contains uppercase letter', valid: /[A-Z]/.test(passwordData.newPassword) },
                    { requirement: 'Contains lowercase letter', valid: /[a-z]/.test(passwordData.newPassword) },
                    { requirement: 'Contains number', valid: /\d/.test(passwordData.newPassword) },
                    { requirement: 'Contains special character', valid: /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) }
                  ].map((item, index) => (
                    <li key={index} className={`flex items-center gap-2 ${item.valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      <span className="text-xs">{item.valid ? '✓' : '✗'}</span>
                      {item.requirement}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm your new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {passwordData.confirmPassword.length > 0 && passwordData.newPassword !== passwordData.confirmPassword && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
            )}
          </div>

          {/* Change Password Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isLoading || !passwordData.currentPassword || !isPasswordValid || passwordData.newPassword !== passwordData.confirmPassword}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isLoading ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Multi-factor Authentication Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Smartphone className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Multi-factor Authentication</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Increase security for your account by using multiple authentication methods
        </p>
        
        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">0 registered MFA methods</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">No authentication methods configured</p>
          </div>
          <button
            disabled
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-lg cursor-not-allowed"
          >
            Add new authentication method
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Multi-factor authentication will be available in a future update
        </p>
      </div>

      {/* Programmatic Access Tokens Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Programmatic Access Tokens</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Create PAT to authenticate into Snowflake
        </p>
        
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-4">
              <button className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                Active
              </button>
              <button className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 rounded">
                Expired
              </button>
            </div>
            <button
              disabled
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-lg cursor-not-allowed"
            >
              Generate new token
            </button>
          </div>
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No active programmatic access tokens</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Programmatic access tokens will be available in a future update
        </p>
      </div>
    </div>
  );
}