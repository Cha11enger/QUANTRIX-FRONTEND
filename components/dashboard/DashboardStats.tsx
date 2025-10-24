'use client';

import { memo } from 'react';
import {
  Database,
  Activity,
  Clock,
  TrendingUp,
  CheckCircle
} from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalConnections: number;
    activeConnections: number;
    totalQueries: number;
    avgQueryTime: number;
  };
}

export const DashboardStats = memo(function DashboardStats({ stats }: DashboardStatsProps) {
  const statItems = [
    {
      name: 'Total Connections',
      value: stats.totalConnections,
      change: '+12%',
      changeType: 'positive' as const,
      icon: Database
    },
    {
      name: 'Active Connections',
      value: stats.activeConnections,
      change: '+8%',
      changeType: 'positive' as const,
      icon: CheckCircle
    },
    {
      name: 'Queries Executed',
      value: stats.totalQueries,
      change: '+23%',
      changeType: 'positive' as const,
      icon: Activity
    },
    {
      name: 'Avg Query Time',
      value: `${stats.avgQueryTime}s`,
      change: '-5%',
      changeType: 'positive' as const,
      icon: Clock
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((stat) => (
        <div
          key={stat.name}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <stat.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className="w-4 h-4" />
              {stat.change}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});