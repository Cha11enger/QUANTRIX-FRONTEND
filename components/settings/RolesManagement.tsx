'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService, GetUserRolesResponse, CreateCustomRoleResponse } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Plus, CreditCard as Edit, Trash2, Shield, Grid3x3 as Grid3X3, List, X, Loader2 } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  userCount: number;
  isActive?: boolean;
}

type RoleFormData = {
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
};

interface RolesManagementProps {
  roles: Role[];
  onCreateRole: (role: Omit<Role, 'id' | 'userCount'>) => void;
  onUpdateRole: (id: string, role: Partial<Role>) => void;
  onDeleteRole: (id: string) => void;
}

export function RolesManagement({ roles, onCreateRole, onUpdateRole, onDeleteRole }: RolesManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { currentRole, bumpRolesRefresh } = useAppStore();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    permissions: [],
    isSystem: false,
    isActive: true
  });
  const [apiRoles, setApiRoles] = useState<Role[]>([]);
  const [currentRoleName, setCurrentRoleName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // success state replaced by toast messages
  const [saving, setSaving] = useState<boolean>(false);

  const availablePermissions = [
    'read_data', 'write_data', 'delete_data', 'manage_users',
    'manage_roles', 'view_analytics', 'export_data', 'system_admin'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSaving(true);
      if (editingRole) {
        const updated: CreateCustomRoleResponse = await AuthService.updateCustomRole('name', editingRole.name, {
          name: formData.name,
          description: formData.description,
          is_active: !!formData.isActive,
        });
        setApiRoles(prev => prev.map(r => r.id === String(updated.id) || r.name === editingRole.name ? {
          ...r,
          name: updated.name,
          description: updated.description,
          isActive: updated.is_active,
        } : r));
        bumpRolesRefresh();
        const t = toast({ description: 'Role updated successfully' });
        setTimeout(() => t.dismiss(), 100);
        resetForm();
        setSaving(false);
        return;
      }
      const permissionIds = formData.permissions.length
        ? formData.permissions.map(p => Math.max(1, availablePermissions.indexOf(p) + 1))
        : [1, 2, 3];
      const created = await AuthService.createCustomRole({
        name: formData.name,
        description: formData.description,
        permissionIds,
      });
      const newRole: Role = {
        id: String(created.id),
        name: created.name,
        description: created.description,
        permissions: [],
        isSystem: false,
        userCount: 0,
      };
      setApiRoles(prev => [newRole, ...prev]);
      const t = toast({ description: 'Role created successfully' });
      setTimeout(() => t.dismiss(), 100);
      resetForm();
    } catch (err: any) {
      setError(err?.message || 'Failed to create custom role');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        setError(null);
        const data: GetUserRolesResponse = await AuthService.getUserRoles();
        const normalized: Role[] = [
          ...(data.systemRoles || []).map(r => ({
            id: r.id,
            name: r.name,
            description: r.description,
            permissions: [],
            isSystem: true,
            userCount: 0,
            isActive: (r as any).user_role_is_active ?? true,
          })),
          ...(data.customRoles || []).map(r => ({
            id: r.id,
            name: r.name,
            description: r.description,
            permissions: [],
            isSystem: false,
            userCount: 0,
            isActive: (r as any).is_active ?? true,
          })),
        ];
        setApiRoles(normalized);
        setCurrentRoleName(data.currentRole?.name || '');
      } catch (err: any) {
        setError(err?.message || 'Failed to load roles');
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, [currentRole]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: [],
      isSystem: false,
      isActive: true
    });
    setEditingRole(null);
    setShowModal(false);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isSystem: role.isSystem,
      isActive: (role as any).isActive ?? true
    });
    setShowModal(true);
  };

  const getPermissionColor = (permission: string) => {
    const colors: Record<string, string> = {
      'read_data': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'write_data': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'delete_data': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'manage_users': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'manage_roles': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'view_analytics': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'export_data': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'system_admin': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[permission] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {apiRoles.map((role) => (
        <div
          key={role.id}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
          onClick={() => {
            const slug = encodeURIComponent(String(role.name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, ''));
            router.push(`/roles/${slug}`);
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                {role.isSystem && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mt-1">
                    System
                  </span>
                )}
                {!role.isSystem && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 mt-1">
                    Custom
                  </span>
                )}
                {currentRoleName === role.name && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 mt-1 ml-2">
                    Current
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!role.isSystem && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(role); }}
                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {!role.isSystem && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await AuthService.deleteCustomRole('name', role.name);
                      setApiRoles(prev => prev.filter(r => r.id !== role.id && r.name !== role.name));
                      const t = toast({ description: 'Role deleted successfully' });
                      setTimeout(() => t.dismiss(), 100);
                    } catch (err: any) {
                      const t = toast({ description: err?.message || 'Failed to delete role' });
                      setTimeout(() => t.dismiss(), 1000);
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{role.description}</p>

          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {role.permissions.slice(0, 4).map((permission) => (
                <span
                  key={permission}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPermissionColor(permission)}`}
                >
                  {permission.replace('_', ' ')}
                </span>
              ))}
              {role.permissions.length > 4 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  +{role.permissions.length - 4} more
                </span>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400" />
        </div>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
          {apiRoles.map((role) => (
            <tr
              key={role.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => {
                const slug = encodeURIComponent(String(role.name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, ''));
                router.push(`/roles/${slug}`);
              }}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{role.name}</div>
                    {role.isSystem && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        System
                      </span>
                    )}
                    {!role.isSystem && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        Custom
                      </span>
                    )}
                    {currentRoleName === role.name && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 ml-2">
                        Current
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                  {role.description}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {!role.isSystem && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(role); }}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {!role.isSystem && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await AuthService.deleteCustomRole('name', role.name);
                          setApiRoles(prev => prev.filter(r => r.id !== role.id && r.name !== role.name));
                          const t = toast({ description: 'Role deleted successfully' });
                          setTimeout(() => t.dismiss(), 100);
                        } catch (err: any) {
                          const t = toast({ description: err?.message || 'Failed to delete role' });
                          setTimeout(() => t.dismiss(), 1000);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Roles Management</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage user roles and permissions for your organization
          </p>
          
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              Table
            </button>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Role
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm md:text-base">Loading roles...</span>
          </div>
        </div>
      ) : (
        viewMode === 'grid' ? renderGridView() : renderTableView()
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingRole ? 'Edit Role' : 'Create New Role'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter role name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter role description"
                  rows={3}
                />
              </div>
              {editingRole && (
                <div className="flex items-center justify-between py-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isActive ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                    aria-pressed={formData.isActive}
                    aria-label="Toggle active"
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors ${saving ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                >
                  <span className="inline-flex items-center gap-2 justify-center">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingRole ? 'Update Role' : 'Create Role'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}