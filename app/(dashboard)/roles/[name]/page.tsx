"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AuthService, RoleDetail, ApiError, RolePermission, GetUserRolesResponse } from "@/lib/api";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export default function RoleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roleNameParam = String(params?.name || "");
  const searchParams = useSearchParams();
  const idFromQuery = String(searchParams?.get('id') || "");
  const normalize = (s: string) => s.toLowerCase();
  const slugify = (s: string) => normalize(s).replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
  const [roleId, setRoleId] = useState<string>("");
  const [role, setRole] = useState<RoleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Resolve role ID from query param or by matching name
        let resolvedId = idFromQuery;
        if (!resolvedId) {
          const rolesData: GetUserRolesResponse = await AuthService.getUserRoles();
          const all = [
            ...(rolesData.systemRoles || []),
            ...(rolesData.customRoles || []),
          ];
          const target = normalize(roleNameParam);
          const match = all.find(r => {
            const nm = String(r.name);
            return (
              normalize(nm) === target ||
              slugify(nm) === target ||
              normalize(nm).replace(/[_-]/g, '') === target.replace(/[_-]/g, '')
            );
          });
          if (!match) {
            // As a last resort, treat the name as an ID and try fetch
            try {
              const directRole = await AuthService.getRoleById(roleNameParam);
              resolvedId = String(directRole.id);
            } catch {
              // Keep resolvedId empty; we'll still try permissions later
            }
          } else {
            resolvedId = String(match.id);
          }
        }
        setRoleId(resolvedId);

        // Try to fetch role details; if forbidden or not found, continue with permissions
        try {
          if (resolvedId) {
            const data = await AuthService.getRoleById(resolvedId);
            setRole(data);
          } else {
            // Minimal role info from route param
            setRole({ id: roleNameParam, name: roleNameParam, description: '', permissions: [] });
          }
        } catch (e: any) {
          // Use name from route param as minimal fallback
          setRole(prev => prev ?? { id: resolvedId || roleNameParam, name: roleNameParam, description: '', permissions: [] });
        }

        // Fetch permissions is the core requirement for this page
        const perms = await AuthService.getRolePermissions(resolvedId || roleNameParam);
        setPermissions(perms);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Failed to load role");
        }
      } finally {
        setIsLoading(false);
      }
    };
    if (roleNameParam) fetchRole();
  }, [roleNameParam]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <p className="mt-3 text-gray-600 dark:text-gray-400">Loading role...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{role?.name}</h2>
            {role?.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">{role.description}</p>
            )}
          </div>
        </div>
        <Link
          href="/settings?tab=roles"
          className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
        >
          Back to Roles
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Permissions</h3>
        {permissions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {permissions.map((perm, idx) => (
              <span
                key={`${perm.code}-${idx}`}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              >
                {perm.name.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">No permissions found.</p>
        )}
      </div>
    </div>
  );
}