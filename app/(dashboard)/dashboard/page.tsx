'use client';

import { Suspense, lazy } from 'react';
import { useAuthStore } from '@/lib/store';
import { useDashboardData, useDashboardStats } from '@/hooks/useDashboardData';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { Plus } from 'lucide-react';

// Lazy load components for better performance
const DashboardStats = lazy(() => import('@/components/dashboard/DashboardStats').then(module => ({ default: module.DashboardStats })));
const RecentActivity = lazy(() => import('@/components/dashboard/RecentActivity').then(module => ({ default: module.RecentActivity })));
const QuickActions = lazy(() => import('@/components/dashboard/QuickActions').then(module => ({ default: module.QuickActions })));
const ConnectionStatus = lazy(() => import('@/components/dashboard/ConnectionStatus').then(module => ({ default: module.ConnectionStatus })));

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: dashboardData, isLoading, error } = useDashboardData();
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();

  // Show skeleton while loading
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Handle error state
  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Failed to load dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There was an error loading your dashboard data.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's what's happening with your databases today.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
          <Plus className="w-4 h-4" />
          Add Connection
        </button>
      </div>

      {/* Stats Grid - Load stats first for better perceived performance */}
      <Suspense fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      }>
        {(statsData || dashboardData?.stats) && (
          <DashboardStats stats={statsData || dashboardData!.stats} />
        )}
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Suspense fallback={
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }>
            {dashboardData?.recentActivity && (
              <RecentActivity activities={dashboardData.recentActivity} />
            )}
          </Suspense>
        </div>

        {/* Sidebar Components */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Suspense fallback={
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            </div>
          }>
            <QuickActions />
          </Suspense>

          {/* Connection Status */}
          <Suspense fallback={
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          }>
            {dashboardData?.connections && (
              <ConnectionStatus connections={dashboardData.connections} />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}