'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Camera, Save, Upload, X, AlertCircle } from 'lucide-react';
import { AuthService, ProfileResponse } from '@/lib/api';
import { useAuthStore, useAppStore } from '@/lib/store';
import { AuthDebug } from '@/lib/auth-debug';

interface ProfileData {
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  email: string;
  username: string;
  profilePictureUrl?: string | null;
  company: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  accountIdentifier?: string;
  organizationName?: string;
  accountName?: string;
  role?: string;
  roles?: string[];
  isActive?: boolean;
}

interface ProfileSettingsProps {
  profile: ProfileData;
  onUpdateProfile: (profile: ProfileData) => void;
}

export function ProfileSettings({ profile, onUpdateProfile }: ProfileSettingsProps) {
  const [formData, setFormData] = useState<ProfileData>(profile);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [isRemovingPicture, setIsRemovingPicture] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateProfile } = useAuthStore();
  const { currentRole } = useAppStore();

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true);
        setError(null);
        
        // Debug authentication state
        console.log('🔍 ProfileSettings: Starting profile fetch');
        AuthDebug.logAuthState();
        
        const profileData = await AuthService.getProfile();
        
        // Map API response to form data
        const mappedProfile: ProfileData = {
          id: profileData.id,
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          fullName: profileData.fullName || '',
          username: profileData.username || '',
          email: profileData.email || '',
          company: profileData.companyName || '',
          bio: '',
          phone: '',
          location: '',
          website: '',
          profilePictureUrl: profileData.profilePictureUrl,
          accountIdentifier: profileData.accountIdentifier,
          organizationName: profileData.organizationName,
          accountName: profileData.accountName,
          role: profileData.role,
          roles: profileData.roles,
          isActive: profileData.isActive,
        };
        
        setFormData(mappedProfile);
        onUpdateProfile(mappedProfile);
        if (profileData.profilePictureUrl) {
          updateProfile({ avatar: profileData.profilePictureUrl });
        }
      } catch (err) {
        console.error('❌ ProfileSettings: Failed to fetch profile:', err);
        AuthDebug.logAuthState();
        
        // Check if it's a token-related error and auto-logout
        if (err instanceof Error && (err.message.includes('No access token') || err.message.includes('Invalid token'))) {
          console.log('🚪 Auto-logout: Token issue detected, redirecting to login');
          AuthDebug.clearAllTokens();
          window.location.href = '/verify-account';
          return;
        }
        
        if (err instanceof Error) {
          setError(`Failed to load profile: ${err.message}`);
        } else {
          setError('Failed to load profile data. Please try again.');
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleProfilePictureUpload(file);
    }
  };

  const handleProfilePictureUpload = async (file: File) => {
    try {
      setIsUploadingPicture(true);
      setError(null);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB');
      }

      const mime = file.type.toLowerCase();
      const fallbackExt = (file.name.split('.').pop() || 'png').toLowerCase();
      const ext = mime.includes('jpeg') ? 'jpg' : mime.includes('jpg') ? 'jpg' : mime.includes('png') ? 'png' : fallbackExt;
      const userId = formData.id || '';
      const fileName = userId ? `${userId}.${ext}` : `${Date.now()}.${ext}`;

      const uploadResult = await AuthService.uploadProfilePicture(file);
      
      const newFormData = {
        ...formData,
        profilePictureUrl: uploadResult.url,
      };
      
      setFormData(newFormData);
      onUpdateProfile(newFormData);
      updateProfile({ avatar: uploadResult.url });
      showSuccessMessage('Profile picture updated successfully!');
    } catch (err) {
      console.error('❌ Failed to upload profile picture:', err);
      if (err instanceof Error) {
        setError(`Failed to upload profile picture: ${err.message}`);
      } else {
        setError('Failed to upload profile picture. Please try again.');
      }
    } finally {
      setIsUploadingPicture(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveProfilePicture = async () => {
    try {
      setIsRemovingPicture(true);
      setError(null);

      const result = await AuthService.removeProfilePicture();
      
      const newFormData = {
        ...formData,
        profilePictureUrl: null,
      };
      
      setFormData(newFormData);
      onUpdateProfile(newFormData);
      updateProfile({ avatar: undefined });
      showSuccessMessage('Profile picture removed successfully!');
    } catch (err) {
      console.error('❌ Failed to remove profile picture:', err);
      if (err instanceof Error) {
        setError(`Failed to remove profile picture: ${err.message}`);
      } else {
        setError('Failed to remove profile picture. Please try again.');
      }
    } finally {
      setIsRemovingPicture(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Validate email format
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }
    
    try {
      // Prepare data for API call - only send fields that can be updated
      const updateData: any = {};
      if (formData.firstName && formData.firstName.trim() !== '') updateData.firstName = formData.firstName.trim();
      if (formData.lastName && formData.lastName.trim() !== '') updateData.lastName = formData.lastName.trim();
      if (formData.username && formData.username.trim() !== '') updateData.username = formData.username.trim();
      if (formData.email && formData.email.trim() !== '') updateData.email = formData.email.trim();
      if (formData.company && formData.company.trim() !== '') updateData.companyName = formData.company.trim();
      if (formData.bio && formData.bio.trim() !== '') updateData.bio = formData.bio.trim();
      if (formData.phone && formData.phone.trim() !== '') updateData.phone = formData.phone.trim();
      if (formData.location && formData.location.trim() !== '') updateData.location = formData.location.trim();
      if (formData.website && formData.website.trim() !== '') updateData.website = formData.website.trim();

      const result = await AuthService.updateProfile(updateData);
      
      const newFormData = {
        ...formData,
        ...updateData,
      };
      
      setFormData(newFormData);
      onUpdateProfile(newFormData);
      
      showSuccessMessage(result.message || 'Profile updated successfully!');
    } catch (err) {
      console.error('❌ Failed to update profile:', err);
      if (err instanceof Error) {
        setError(`Failed to update profile: ${err.message}`);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while fetching profile
  if (isLoadingProfile) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Update your personal information and profile details
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading profile...</span>
        </div>
      </div>
    );
  }

  // Show error state if profile fetch failed
  if (error && isLoadingProfile) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Update your personal information and profile details
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Update your personal information and profile details
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && !isLoadingProfile && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-6">
          <div className="relative">
            {formData.profilePictureUrl ? (
              <img
                src={formData.profilePictureUrl}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-600">
                <User className="w-12 h-12 text-gray-400" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPicture}
              className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploadingPicture ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile Photo</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload a new profile photo or remove the current one
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPicture}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploadingPicture ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {isUploadingPicture ? 'Uploading...' : 'Upload New'}
              </button>
              {formData.profilePictureUrl && (
                <button
                  type="button"
                  onClick={handleRemoveProfilePicture}
                  disabled={isRemovingPicture}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRemovingPicture ? (
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  {isRemovingPicture ? 'Removing...' : 'Remove'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName ?? ''}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your first name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName ?? ''}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your last name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={formData.username ?? ''}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email ?? ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Email verification may be required after changing your email address.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company
            </label>
            <input
              type="text"
              value={formData.company ?? ''}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your company"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              value={formData.bio ?? ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us about yourself"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone
            </label>
            <input
              type="text"
              value={formData.phone ?? ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location ?? ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your location"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website ?? ''}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
            />
          </div>
        </div>

        {/* Account Information (Read-only) */}
        <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Identifier
              </label>
              <input
                type="text"
                value={formData.accountIdentifier || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Organization
              </label>
              <input
                type="text"
                value={formData.organizationName || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <input
                type="text"
                value={currentRole || (typeof formData.role === 'string' ? formData.role : Array.isArray(formData.roles) ? (formData.roles[0] || '') : '')}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <input
                type="text"
                value={formData.isActive ? 'Active' : 'Inactive'}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}