'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { RolesManagement } from '@/components/settings/RolesManagement';
import { UserManagement } from '@/components/settings/UserManagement';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';

// Mock data
const mockRoles = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full system access with all permissions',
    permissions: ['read_data', 'write_data', 'delete_data', 'manage_users', 'manage_roles', 'view_analytics', 'export_data', 'system_admin'],
    isSystem: true,
    userCount: 2
  },
  {
    id: 'editor',
    name: 'Editor',
    description: 'Can read, write, and query data',
    permissions: ['read_data', 'write_data', 'view_analytics', 'export_data'],
    isSystem: true,
    userCount: 5
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to data',
    permissions: ['read_data'],
    isSystem: true,
    userCount: 12
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    description: 'Custom role for data analysis team',
    permissions: ['read_data', 'view_analytics', 'export_data'],
    isSystem: false,
    userCount: 3
  }
];

const mockUsers = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@company.com',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
    status: 'active' as const,
    roles: ['admin'],
    lastLogin: '2024-01-15T10:30:00Z',
    createdAt: '2023-06-15T08:00:00Z'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
    status: 'active' as const,
    roles: ['editor', 'data-analyst'],
    lastLogin: '2024-01-14T16:45:00Z',
    createdAt: '2023-08-20T09:15:00Z'
  },
  {
    id: '3',
    name: 'Mike Davis',
    email: 'mike.davis@company.com',
    status: 'inactive' as const,
    roles: ['viewer'],
    lastLogin: '2024-01-10T14:20:00Z',
    createdAt: '2023-09-10T11:30:00Z'
  },
  {
    id: '4',
    name: 'Emily Chen',
    email: 'emily.chen@company.com',
    avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
    status: 'pending' as const,
    roles: ['editor'],
    lastLogin: '2024-01-12T09:10:00Z',
    createdAt: '2024-01-01T10:00:00Z'
  }
];

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [roles, setRoles] = useState(mockRoles);
  const [users, setUsers] = useState(mockUsers);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    username: '',
    bio: '',
    avatar: '',
    company: '',
    location: '',
    website: ''
  });

  // Role management handlers
  const handleCreateRole = (roleData: any) => {
    const newRole = {
      ...roleData,
      id: `role-${Date.now()}`,
      userCount: 0
    };
    setRoles([...roles, newRole]);
  };

  const handleUpdateRole = (id: string, roleData: any) => {
    setRoles(roles.map(role => 
      role.id === id ? { ...role, ...roleData } : role
    ));
  };

  const handleDeleteRole = (id: string) => {
    setRoles(roles.filter(role => role.id !== id));
    // Also remove this role from all users
    setUsers(users.map(user => ({
      ...user,
      roles: user.roles.filter(roleId => roleId !== id)
    })));
  };

  // User management handlers
  const handleCreateUser = (userData: any) => {
    const newUser = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setUsers([...users, newUser]);
    
    // Update role user counts
    userData.roles.forEach((roleId: string) => {
      setRoles(roles.map(role => 
        role.id === roleId 
          ? { ...role, userCount: role.userCount + 1 }
          : role
      ));
    });
  };

  const handleUpdateUser = (id: string, userData: any) => {
    const oldUser = users.find(user => user.id === id);
    setUsers(users.map(user => 
      user.id === id ? { ...user, ...userData } : user
    ));
    
    // Update role user counts if roles changed
    if (oldUser && userData.roles) {
      const oldRoles = oldUser.roles;
      const newRoles = userData.roles;
      
      // Decrease count for removed roles
      oldRoles.forEach((roleId: string) => {
        if (!newRoles.includes(roleId)) {
          setRoles(roles.map(role => 
            role.id === roleId 
              ? { ...role, userCount: Math.max(0, role.userCount - 1) }
              : role
          ));
        }
      });
      
      // Increase count for added roles
      newRoles.forEach((roleId: string) => {
        if (!oldRoles.includes(roleId)) {
          setRoles(roles.map(role => 
            role.id === roleId 
              ? { ...role, userCount: role.userCount + 1 }
              : role
          ));
        }
      });
    }
  };

  const handleDeleteUser = (id: string) => {
    const user = users.find(user => user.id === id);
    setUsers(users.filter(user => user.id !== id));
    
    // Update role user counts
    if (user) {
      user.roles.forEach((roleId: string) => {
        setRoles(roles.map(role => 
          role.id === roleId 
            ? { ...role, userCount: Math.max(0, role.userCount - 1) }
            : role
        ));
      });
    }
  };

  // Profile management handler
  const handleUpdateProfile = (profileData: any) => {
    setProfile(profileData);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ProfileSettings
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
          />
        );
      case 'security':
        return <SecuritySettings />;
      case 'notifications':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Notification Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">Notification settings content coming soon...</p>
          </div>
        );
      case 'appearance':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Appearance Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">Appearance settings content coming soon...</p>
          </div>
        );
      case 'roles':
        return (
          <RolesManagement
            roles={roles}
            onCreateRole={handleCreateRole}
            onUpdateRole={handleUpdateRole}
            onDeleteRole={handleDeleteRole}
          />
        );
      case 'users':
        return (
          <UserManagement
            users={users}
            roles={roles}
            onCreateUser={handleCreateUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        );
      case 'data-privacy':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Data & Privacy</h2>
            <p className="text-gray-600 dark:text-gray-400">Data & privacy settings content coming soon...</p>
          </div>
        );
      default:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">Select a settings category from the sidebar.</p>
          </div>
        );
    }
  };

  return (
    <SettingsLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderTabContent()}
    </SettingsLayout>
  );
}