'use client';

import { useQuery } from '@tanstack/react-query';
import { mockDashboardStats, mockRecentActivity, mockConnections } from '@/lib/data';

// Simulate API delay for realistic loading states
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface DashboardData {
  stats: {
    totalConnections: number;
    activeConnections: number;
    totalQueries: number;
    avgQueryTime: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
  connections: Array<{
    id: string;
    name: string;
    status: 'connected' | 'error' | 'disconnected';
  }>;
}

const fetchDashboardData = async (): Promise<DashboardData> => {
  // Simulate API call delay
  await delay(800);
  
  return {
    stats: mockDashboardStats,
    recentActivity: mockRecentActivity,
    connections: mockConnections
  };
};

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard-data'],
    queryFn: fetchDashboardData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

// Separate hook for stats only (for faster loading)
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      await delay(300);
      return mockDashboardStats;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}