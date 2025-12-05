'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { RolesManagement } from '@/components/settings/RolesManagement';
import { UserManagement } from '@/components/settings/UserManagement';
import { AuthService } from '@/lib/api';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { useToast } from '@/hooks/use-toast';

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
  const [roles, setRoles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [pages, setPages] = useState(1);
  const [invites, setInvites] = useState<any[]>([]);
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    username: '',
    bio: '',
    avatar: '',
    company: '',
    location: '',
    website: '',
    fullName: ''
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
  const handleCreateUser = async (userData: any): Promise<boolean> => {
    const rawEmailPart = String(userData.email || '').split('@')[0];
    const sanitizedEmailPart = rawEmailPart.toLowerCase().replace(/[^a-z0-9]+/g, '');
    let baseUsername = sanitizedEmailPart;
    if (!baseUsername || baseUsername.length < 3) {
      const nameSanitized = String(userData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
      baseUsername = nameSanitized || `user${Date.now()}`;
    }
    if (baseUsername.length > 30) {
      baseUsername = baseUsername.slice(0, 30);
    }
    const firstName = String(userData.name || '').split(' ')[0] || '';
    const lastName = String(userData.name || '').split(' ').slice(1).join(' ') || '';
    try {
      if (!userData.email) {
        setFormError('Email is required.');
        return false;
      }
      if (!userData.name || String(userData.name).trim().length < 2) {
        setFormError('Full name is required.');
        return false;
      }
      const selectedRoleName = String(userData.defaultRole || '').trim();
      if (!selectedRoleName) {
        setFormError('Default role is required.');
        return false;
      }
      if (!roles || roles.length === 0) {
        setFormError('Roles not loaded yet. Please wait and try again.');
        return false;
      }
      const localValid = roles.some(r => r.name === selectedRoleName);
      if (!localValid) {
        setFormError('Select a valid default role.');
        return false;
      }

      let passwordToSend: string | undefined = undefined;
      let confirmToSend: string | undefined = undefined;
      const hasPassword = Boolean(userData.password && String(userData.password).trim().length > 0);
      const hasConfirm = Boolean(userData.confirmPassword && String(userData.confirmPassword).trim().length > 0);
      if (hasPassword || hasConfirm) {
        if (!hasPassword || !hasConfirm) {
          setFormError('Both password and confirm password are required or leave both empty.');
          return false;
        }
        if (String(userData.password) !== String(userData.confirmPassword)) {
          setFormError('Password and confirm password must match.');
          return false;
        }
        passwordToSend = String(userData.password);
        confirmToSend = String(userData.confirmPassword);
      }

      const orgId = typeof window !== 'undefined' ? localStorage.getItem('organizationId') : null;
      if (!orgId) {
        setFormError('Organization not found. Please login again.');
        return false;
      }
      await AuthService.createInvitation({ organizationId: orgId, email: userData.email, roleName: selectedRoleName });
      setFormError(null);
      toast({ title: 'Invitation sent', description: `Invite sent to ${userData.email}` });
      return true;
    } catch (e: any) {
      console.error('Create user failed', { status: e?.status, message: e?.message, details: e?.details, error: e });
      const details: any = e?.details;
      const errorsArr = Array.isArray(details?.errors) ? details.errors : (Array.isArray(details?.validation_errors) ? details.validation_errors.map((v: any) => v.message) : []);
      const message = (errorsArr[0] || e?.message || 'Failed to create user');
      setFormError(message);
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const rolesResp = await AuthService.getUserRoles();
        const system = rolesResp.systemRoles || [];
        const sysMapped = system.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description || '',
          permissions: [],
          isSystem: true,
          userCount: 0
        }));
        const custom = rolesResp.customRoles || [];
        const customMapped = custom.map(cr => ({
          id: cr.id,
          name: cr.name,
          description: cr.description || '',
          permissions: [],
          isSystem: false,
          userCount: 0
        }));
        setRoles([...(sysMapped as any), ...(customMapped as any)] as any);
      } catch {}
      try {
        setLoadingUsers(true);
        const resp = await AuthService.getOrgUsers({ page, limit, order: 'desc' });
        const mapped = resp.users.map((u: any) => ({
          id: u.id,
          name: u.full_name || u.email,
          email: u.email,
          status: (u.is_active ? 'active' : 'inactive') as const,
          roles: [],
          lastLogin: u.updated_at || new Date().toISOString(),
          createdAt: u.created_at
        }));
        setUsers(mapped as any);
        setPages(resp.pages || 1);
      } catch (e: any) {
        setFormError(e?.message || 'Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
      try {
        const orgId = typeof window !== 'undefined' ? localStorage.getItem('organizationId') : null;
        if (orgId) {
          const list = await AuthService.listInvitations(orgId, 'pending');
          setInvites(list || []);
        }
      } catch {}
    };
    loadData();
  }, [page, limit]);

  const handleUpdateUser = (id: string, userData: any) => {
    const fullName = String(userData.name || '').trim();
    const email = userData.email;
    const status = userData.status;
    const defaultRole = userData.defaultRole;

    AuthService.updateOrgUser(id, { fullName })
      .then(() => {
        setUsers(users.map(user => 
          user.id === id ? { ...user, name: fullName || user.name, email: email || user.email, status: status || user.status } : user
        ));
        setFormError(null);
      })
      .catch((e: any) => {
        setFormError(e?.message || 'Failed to update user');
      });
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
          <div className="flex-1 overflow-auto">
            <UserManagement
              users={users}
              roles={roles}
              onCreateUser={handleCreateUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              errorMessage={formError}
              onClearError={() => setFormError(null)}
            />
            <div className="mt-6 px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {pages}</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={loadingUsers || page <= 1} className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">Prev</button>
                  <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={loadingUsers || page >= pages} className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">Next</button>
                </div>
              </div>
            </div>
            <div className="mt-8 px-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Pending Invitations</h3>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {invites.map((inv: any) => (
                      <tr key={inv.id}>
                        <td className="px-6 py-3">{inv.email}</td>
                        <td className="px-6 py-3"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{inv.status}</span></td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={async () => { try { await AuthService.resendInvitation(inv.id); toast({ title: 'Invitation resent', description: 'A new token was generated' }); } catch (e: any) { toast({ title: 'Resend failed', description: e?.message || 'Unable to resend', variant: 'destructive' as any }); } }} className="px-3 py-1.5 text-xs rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800">Resend</button>
                            <button onClick={async () => { try { await AuthService.revokeInvitation(inv.id); setInvites(invites.filter(i => i.id !== inv.id)); toast({ title: 'Invitation revoked', description: inv.email }); } catch (e: any) { toast({ title: 'Revoke failed', description: e?.message || 'Unable to revoke', variant: 'destructive' as any }); } }} className="px-3 py-1.5 text-xs rounded-md bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800">Revoke</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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
