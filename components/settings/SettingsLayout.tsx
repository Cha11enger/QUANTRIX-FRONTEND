'use client';

import { ReactNode } from 'react';
import { User, Shield, Bell, Palette, Users, UserCog, ShieldCheck } from 'lucide-react';

interface SettingsLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const settingsTabs = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'security', name: 'Security', icon: Shield },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'appearance', name: 'Appearance', icon: Palette },
  { id: 'roles', name: 'Roles Management', icon: Users },
  { id: 'users', name: 'User Management', icon: UserCog },
  { id: 'data-privacy', name: 'Data & Privacy', icon: ShieldCheck },
];

export function SettingsLayout({ children, activeTab, onTabChange }: SettingsLayoutProps) {
  return (
    <div className="h-full bg-white dark:bg-gray-800">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your account and preferences
            </p>
          </div>
          
          <nav className="space-y-1">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}