'use client';

import { memo } from 'react';

interface Connection {
  id: string;
  name: string;
  status: 'connected' | 'error' | 'disconnected';
}

interface ConnectionStatusProps {
  connections: Connection[];
}

export const ConnectionStatus = memo(function ConnectionStatus({ connections }: ConnectionStatusProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Connection Status</h3>
      <div className="space-y-3">
        {connections.slice(0, 3).map((connection) => (
          <div key={connection.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                connection.status === 'connected' ? 'bg-green-500' :
                connection.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
              }`} />
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {connection.name}
              </span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              connection.status === 'connected' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              connection.status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}>
              {connection.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});