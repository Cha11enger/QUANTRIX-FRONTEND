'use client';

import { memo } from 'react';
import { ArrowRight } from 'lucide-react';

interface QuickAction {
  label: string;
  onClick: () => void;
}

interface QuickActionsProps {
  actions?: QuickAction[];
}

const defaultActions: QuickAction[] = [
  {
    label: 'New SQL Query',
    onClick: () => console.log('Navigate to SQL Query')
  },
  {
    label: 'Chat with AI',
    onClick: () => console.log('Navigate to AI Chat')
  },
  {
    label: 'View Schema',
    onClick: () => console.log('Navigate to Schema View')
  }
];

export const QuickActions = memo(function QuickActions({ actions = defaultActions }: QuickActionsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <span className="text-sm font-medium text-gray-900 dark:text-white">{action.label}</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  );
});