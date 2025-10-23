'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { debug } from '@/lib/debug';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    debug.log('HomePage useEffect triggered', { isAuthenticated });
    
    if (isAuthenticated) {
      debug.log('Redirecting to dashboard');
      router.replace('/dashboard');
    } else {
      debug.log('Redirecting to login');
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  debug.log('HomePage rendered', { isAuthenticated });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    </div>
  );
}