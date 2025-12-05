import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';

// Extend AxiosRequestConfig to include retry flag
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
  details?: {
    validation_errors?: Array<{
      field: string;
      message: string;
    }>;
    errors?: string[];
  };
}

// Authentication Types
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName?: string;
}

export interface RegisterResponse {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  accountIdentifier: string;
  dataSharingIdentifier: string;
  organizationName: string;
  accountName: string;
  companyName: string;
}

export interface VerifyAccountRequest {
  accountIdentifier: string;
}

export interface VerifyAccountResponse {
  valid: boolean;
  organizationName: string;
  accountName: string;
  accountIdentifier: string;
}

export interface LoginRequest {
  accountIdentifier: string;
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    accountIdentifier: string;
    organizationName: string;
    accountName: string;
    companyName: string;
  };
  expiresIn: number;
  mustChangePassword?: boolean;
  organizationId?: string;
}

// Profile Types
export interface ProfileResponse {
  id: string;
  firstName?: string;
  lastName?: string;
  username: string;
  email: string;
  accountIdentifier: string;
  dataSharingIdentifier?: string;
  organizationName: string;
  accountName: string;
  companyName: string;
  fullName: string;
  profilePictureUrl: string | null;
  role: string;
  roles: string[];
  isActive: boolean;
  isVerified?: boolean;
}

// Password Change Types
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
  updatedFields: string[];
  sessionsInvalidated?: boolean;
}

// Stored Account Types
export interface StoredAccount {
  accountIdentifier: string;
  organizationName: string;
  accountName: string;
  lastUsed: string;
  timestamp: number;
}

// API Error Class
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Base API Client
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();
        if (token) {
          // Ensure headers object exists and set Authorization robustly
          config.headers = config.headers ?? {};
          (config.headers as any).Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiResponse>) => {
        const originalRequest = error.config as ExtendedAxiosRequestConfig;
        
        if (error.response) {
          const { status, data } = error.response;
          
          // Handle 401 errors with automatic token refresh
          if (status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
              const newToken = await this.refreshTokenInternal();
              
              // Update the original request with new token (headers may be undefined)
              originalRequest.headers = {
                ...(originalRequest.headers as any),
                Authorization: `Bearer ${newToken}`,
              } as any;
              
              // Retry the original request
              return this.client(originalRequest);
            } catch (refreshError) {
              // Clear tokens and redirect to login
              this.clearStoredTokens();
              
              // If we're in a browser environment, redirect to login
              if (typeof window !== 'undefined') {
                window.location.href = '/verify-account';
              }
              
              throw new ApiError(401, 'Session expired. Please login again.');
            }
          }
          
          const details: any = (data as any)?.details;
          const validationErrorsArray = Array.isArray(details?.errors) ? details.errors : (Array.isArray(details?.validation_errors) ? details.validation_errors.map((v: any) => v.message) : undefined);
          const validationErrorsJoined = Array.isArray(validationErrorsArray) && validationErrorsArray.length > 0 ? validationErrorsArray.join('; ') : undefined;
          const message = (data as any)?.error || (data as any)?.message || validationErrorsJoined || 'An error occurred';
          throw new ApiError(status, message, details);
        } else if (error.request) {
          throw new ApiError(0, 'Network error - please check your connection');
        } else {
          throw new ApiError(0, 'Request failed');
        }
      }
    );
  }

  private getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  private setStoredToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  private setStoredRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', token);
    }
  }

  private clearStoredTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  // Authentication Methods
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await this.client.post<ApiResponse<RegisterResponse>>(
      '/api/v1/auth/register',
      data
    );
    
    if (!response.data.success || !response.data.data) {
      throw new ApiError(400, response.data.error || 'Registration failed');
    }
    
    return response.data.data;
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<ApiResponse<LoginResponse>>(
      '/api/v1/auth/login',
      data
    );
    
    if (!response.data.success || !response.data.data) {
      throw new ApiError(400, response.data.error || 'Login failed');
    }
    
    const loginData = response.data.data;
    
    // Store tokens
    this.setStoredToken(loginData.token);
    this.setStoredRefreshToken(loginData.refreshToken);
    try {
      const orgId = (loginData as any)?.organizationId || (loginData as any)?.user?.organizationId;
      if (orgId && typeof window !== 'undefined') {
        localStorage.setItem('organizationId', String(orgId));
      }
    } catch {}
    
    return loginData;
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = typeof window !== 'undefined' 
        ? localStorage.getItem('refreshToken') 
        : null;
      
      if (refreshToken) {
        await this.client.post('/api/v1/auth/logout', {
          refreshToken
        });
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      this.clearStoredTokens();
    }
  }

  // Internal refresh method that doesn't use interceptors to avoid infinite loops
  private async refreshTokenInternal(): Promise<string> {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refreshToken') 
      : null;
    
    if (!refreshToken) {
      // Clear tokens and redirect to login silently
      this.clearStoredTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/verify-account';
      }
      throw new ApiError(401, 'No refresh token available');
    }

    // Create a new axios instance without interceptors for refresh
    const refreshClient = axios.create({
      baseURL: this.client.defaults.baseURL,
      timeout: this.client.defaults.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await refreshClient.post<ApiResponse<{ token: string; refreshToken?: string; expiresIn: number }>>(
      '/api/v1/auth/refresh',
      { refreshToken }
    );
    
    if (!response.data.success || !response.data.data) {
      throw new ApiError(401, 'Token refresh failed');
    }
    
    const newToken = response.data.data.token;
    this.setStoredToken(newToken);
    
    // Update refresh token if provided
    if (response.data.data.refreshToken) {
      this.setStoredRefreshToken(response.data.data.refreshToken);
    }
    
    return newToken;
  }

  async refreshToken(): Promise<string> {
    return this.refreshTokenInternal();
  }

  async verifyAccount(data: VerifyAccountRequest): Promise<VerifyAccountResponse> {
    const response = await this.client.post<ApiResponse<VerifyAccountResponse>>(
      '/api/v1/auth/verify-account',
      data
    );
    
    if (!response.data.success || !response.data.data) {
      throw new ApiError(400, response.data.error || 'Account verification failed');
    }
    
    return response.data.data;
  }

  async getProfile(): Promise<ProfileResponse> {
    const token = this.getStoredToken();
    if (!token) {
      throw new ApiError(401, 'No access token available. Please login first.');
    }

    const response = await this.client.get<ApiResponse<any>>('/api/v1/users/me/profile');

    if (!response.data.success) {
      throw new ApiError(400, response.data.error || 'Failed to get profile', response.data.details);
    }

    const payload = response.data.data;
    const user = payload?.user ?? payload;

    if (!user) {
      throw new ApiError(400, 'Failed to get profile');
    }

    const roleSource = user.currentRole || user.role;
    const roleName = typeof roleSource === 'string'
      ? roleSource
      : (roleSource?.name || roleSource?.roleName || '');
    const rolesList = Array.isArray(user.roles)
      ? user.roles.map((r: any) => typeof r === 'string' ? r : (r?.name || r?.roleName || '')).filter(Boolean)
      : [];

    const normalized: ProfileResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      accountIdentifier: user.accountIdentifier,
      dataSharingIdentifier: user.dataSharingIdentifier,
      organizationName: user.organizationName,
      accountName: user.accountName,
      companyName: user.companyName,
      fullName: user.fullName,
      profilePictureUrl: user.profilePictureUrl ?? null,
      role: roleName,
      roles: rolesList,
      isActive: user.isVerified ?? true,
      isVerified: user.isVerified,
    };

    return normalized;
  }

  // Organization user management APIs removed

  async updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResult> {
    const response = await this.client.patch<ApiResponse<UpdateProfileResult>>(
      '/api/v1/users/me/profile',
      data
    );
    
    if (!response.data.success || !response.data.data) {
      throw new ApiError(400, response.data.error || 'Failed to update profile', response.data.details);
    }
    
    return response.data.data;
  }

  async uploadProfilePicture(file: File): Promise<UploadProfilePictureResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<ApiResponse<UploadProfilePictureResponse>>(
      '/api/v1/users/me/profile-picture',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    if (!response.data.success || !response.data.data) {
      throw new ApiError(400, response.data.error || 'Failed to upload profile picture', response.data.details);
    }
    
    return response.data.data;
  }

  async removeProfilePicture(): Promise<{ message?: string }> {
    const response = await this.client.delete<ApiResponse<{ message?: string }>>(
      '/api/v1/users/me/profile-picture'
    );
    
    if (!response.data.success) {
      throw new ApiError(400, response.data.error || 'Failed to remove profile picture', response.data.details);
    }
    
    return response.data.data || { message: 'Profile picture deleted' };
  }

  async getUserRoles(): Promise<GetUserRolesResponse> {
    const response = await this.client.get<ApiResponse<any>>('/api/v1/roles/me/roles');
    if (!response.data.success || !response.data.data) {
      throw new ApiError(400, response.data.error || 'Failed to fetch user roles', response.data.details);
    }
    const payload = response.data.data;
    const rolesObj = payload?.roles ?? payload;
    if (!rolesObj || (!rolesObj.systemRoles && !rolesObj.customRoles)) {
      throw new ApiError(400, 'Failed to fetch user roles');
    }
    return rolesObj as GetUserRolesResponse;
  }

  async getOrgUsers(options?: { page?: number; limit?: number; search?: string; sort?: 'created_at' | 'email' | 'username'; order?: 'asc' | 'desc' }): Promise<{ users: any[]; total: number; page: number; limit: number; pages: number }> {
    const orgId = typeof window !== 'undefined' ? localStorage.getItem('organizationId') : null;
    if (!orgId) {
      throw new ApiError(400, 'Organization ID not found. Please login again.');
    }
    const params: any = {};
    if (options?.page) params.page = options.page;
    if (options?.limit) params.limit = options.limit;
    if (options?.search) params.search = options.search;
    if (options?.sort) params.sort = options.sort;
    if (options?.order) params.order = options.order;
    const response = await this.client.get<ApiResponse<any>>(`/api/v1/users/org/${orgId}/users`, { params });
    if (!response.data.success || !response.data.data) {
      throw new ApiError(400, response.data.error || 'Failed to fetch organization users', response.data.details);
    }
    const payload = response.data.data;
    const users = Array.isArray(payload?.users) ? payload.users : [];
    const total = Number(payload?.total ?? users.length);
    const page = Number(payload?.page ?? 1);
    const limit = Number(payload?.limit ?? users.length);
    const pages = Number(payload?.pages ?? 1);
    return { users, total, page, limit, pages };
  }

  async createInvitation(input: { organizationId: string; email: string; roleId?: string; roleName?: string }): Promise<{ id: string; token?: string; invitationUrl?: string }> {
    const response = await this.client.post<ApiResponse<any>>('/api/v1/invitations', input);
    if (!response.data.success || !response.data.data) {
      throw new ApiError(400, response.data.error || 'Failed to create invitation', response.data.details);
    }
    const data = response.data.data;
    return { id: String(data.id), token: data.token, invitationUrl: data.invitationUrl };
  }

  async listInvitations(organizationId: string, status?: string): Promise<any[]> {
    const params: any = { organizationId };
    if (status) params.status = status;
    const response = await this.client.get<ApiResponse<any>>('/api/v1/invitations', { params });
    if (!response.data.success) {
      throw new ApiError(400, response.data.error || 'Failed to list invitations', response.data.details);
    }
    const list = response.data.data;
    return Array.isArray(list) ? list : [];
  }

  async resendInvitation(invitationId: string): Promise<{ token: string }> {
    const response = await this.client.post<ApiResponse<any>>(`/api/v1/invitations/${invitationId}/resend`);
    if (!response.data.success || !response.data.data) {
      throw new ApiError(400, response.data.error || 'Failed to resend invitation', response.data.details);
    }
    return { token: String(response.data.data.token || '') };
  }

  async revokeInvitation(invitationId: string): Promise<{ status: string }> {
    const response = await this.client.delete<ApiResponse<any>>(`/api/v1/invitations/${invitationId}`);
    if (!response.data.success || !response.data.data) {
      throw new ApiError(400, response.data.error || 'Failed to revoke invitation', response.data.details);
    }
    return { status: String(response.data.data.status || '') };
  }

  async updateOrgUser(userId: string, payload: { fullName?: string; email?: string; status?: 'active' | 'inactive' | 'pending'; defaultRole?: string }): Promise<{ updated_at: string }> {
    const body: any = {};
    if (payload.fullName && String(payload.fullName).trim().length > 0) {
      const parts = String(payload.fullName).trim().split(' ');
      body.first_name = parts[0] || '';
      body.last_name = parts.slice(1).join(' ') || '';
    }
    if (Object.keys(body).length === 0) {
      body.first_name = '';
    }
    const response = await this.client.patch<ApiResponse<any>>(`/api/v1/users/${userId}/profile`, body);
    if (!response.data.success || !response.data.data) {
      throw new ApiError(400, response.data.error || 'Failed to update user profile', response.data.details);
    }
    return { updated_at: String(response.data.data.updated_at || '') };
  }

  // Organization user management APIs removed

  async changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    const response = await this.client.put<ApiResponse<ChangePasswordResponse>>(
      '/api/v1/users/me/password',
      data
    );
    
    if (!response.data.success || !response.data.data) {
      throw new ApiError(400, response.data.error || 'Failed to change password', response.data.details);
    }
    
    return response.data.data;
  }

  async createCustomRole(data: CreateCustomRoleRequest): Promise<CreateCustomRoleResponse> {
    const response = await this.client.post<ApiResponse<CreateCustomRoleResponse>>(
      '/api/v1/roles/custom',
      data
    );
    if (!response.data.success || !response.data.data) {
      throw new ApiError(400, response.data.error || 'Failed to create custom role', response.data.details);
    }
    return response.data.data;
  }

  async getRoleById(roleId: string): Promise<RoleDetail> {
    const response = await this.client.get<ApiResponse<any>>(`/api/v1/roles/${roleId}`);
    if (!response.data.success || !response.data.data) {
      throw new ApiError(400, response.data.error || 'Failed to fetch role', response.data.details);
    }
    const payload = response.data.data;
    const role = payload?.role ?? (Array.isArray(payload) ? payload[0] : payload);
    if (!role || !role.id || !role.name) {
      throw new ApiError(400, 'Invalid role data');
    }
    const permsRaw = role.permissions || [];
    const permissions: string[] = Array.isArray(permsRaw)
      ? permsRaw.map((p: any) => typeof p === 'string' ? p : (p?.name || p?.code || '')).filter(Boolean)
      : [];
    return {
      id: role.id,
      name: role.name,
      description: role.description || '',
      permissions,
    };
  }

  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    const response = await this.client.get<ApiResponse<any>>(`/api/v1/permissions/roles/${roleId}`);
    if (!response.data.success || !response.data.data) {
      throw new ApiError(400, response.data.error || 'Failed to fetch role permissions', response.data.details);
    }
    const payload = response.data.data;
    const list = Array.isArray(payload) ? payload : payload.permissions;
    if (!Array.isArray(list)) {
      throw new ApiError(400, 'Invalid permissions data');
    }
    return list.map((p: any) => ({
      id: String(p.id ?? ''),
      code: String(p.code ?? p.name ?? ''),
      name: String(p.name ?? p.code ?? ''),
      description: String(p.description ?? ''),
      category: String(p.category ?? ''),
    }));
  }

  async updateCustomRole(by: string, value: string, payload: { name: string; description: string; is_active: boolean }): Promise<CreateCustomRoleResponse> {
    const response = await this.client.put<ApiResponse<CreateCustomRoleResponse>>(
      '/api/v1/roles/custom',
      payload,
      { params: { by, value } }
    );
    if (!response.data.success || !response.data.data) {
      throw new ApiError(400, response.data.error || 'Failed to update custom role', response.data.details);
    }
    return response.data.data;
  }

  async switchCurrentRole(roleId: string): Promise<{ current_role_id: string }> {
    const response = await this.client.put<ApiResponse<{ current_role_id: string }>>(
      '/api/v1/roles/current',
      { roleId }
    );
    if (!response.data.success || !response.data.data) {
      throw new ApiError(400, response.data.error || 'Failed to switch role', response.data.details);
    }
    return response.data.data;
  }

  async deleteCustomRole(by: string, value: string): Promise<{ message?: string }> {
    const response = await this.client.delete<ApiResponse<{ message?: string }>>(
      '/api/v1/roles/custom',
      { params: { by, value } }
    );
    if (!response.data.success) {
      throw new ApiError(400, response.data.error || 'Failed to delete custom role', response.data.details);
    }
    return response.data.data || { message: 'Role deleted' };
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Authentication Service
export class AuthService {
  static async register(data: RegisterRequest): Promise<RegisterResponse> {
    return apiClient.register(data);
  }

  static async verifyAccount(accountIdentifier: string): Promise<VerifyAccountResponse> {
    return apiClient.verifyAccount({ accountIdentifier });
  }

  static async login(accountIdentifier: string, username: string, password: string): Promise<LoginResponse> {
    return apiClient.login({ accountIdentifier, username, password });
  }

  static async logout(): Promise<void> {
    return apiClient.logout();
  }

  static async refreshToken(): Promise<string> {
    return apiClient.refreshToken();
  }

  static async getProfile(): Promise<ProfileResponse> {
    return apiClient.getProfile();
  }

  static async updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResult> {
    return apiClient.updateProfile(data);
  }

  static async uploadProfilePicture(file: File): Promise<UploadProfilePictureResponse> {
    return apiClient.uploadProfilePicture(file);
  }

  static async removeProfilePicture(): Promise<{ message?: string }> {
    return apiClient.removeProfilePicture();
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<ChangePasswordResponse> {
    return apiClient.changePassword({ currentPassword, newPassword });
  }

  static async getUserRoles(): Promise<GetUserRolesResponse> {
    return apiClient.getUserRoles();
  }

  static async createCustomRole(data: CreateCustomRoleRequest): Promise<CreateCustomRoleResponse> {
    return apiClient.createCustomRole(data);
  }

  static async getRoleById(roleId: string): Promise<RoleDetail> {
    return apiClient.getRoleById(roleId);
  }

  static async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    return apiClient.getRolePermissions(roleId);
  }

  static async getOrgUsers(options?: { page?: number; limit?: number; search?: string; sort?: 'created_at' | 'email' | 'username'; order?: 'asc' | 'desc' }): Promise<{ users: any[]; total: number; page: number; limit: number; pages: number }> {
    return apiClient.getOrgUsers(options);
  }

  static async createInvitation(input: { organizationId: string; email: string; roleId?: string; roleName?: string }): Promise<{ id: string; token?: string; invitationUrl?: string }> {
    return apiClient.createInvitation(input);
  }

  static async listInvitations(organizationId: string, status?: string): Promise<any[]> {
    return apiClient.listInvitations(organizationId, status);
  }

  static async resendInvitation(invitationId: string): Promise<{ token: string }> {
    return apiClient.resendInvitation(invitationId);
  }

  static async revokeInvitation(invitationId: string): Promise<{ status: string }> {
    return apiClient.revokeInvitation(invitationId);
  }

  static async updateOrgUser(userId: string, payload: { fullName?: string; email?: string; status?: 'active' | 'inactive' | 'pending'; defaultRole?: string }): Promise<{ updated_at: string }> {
    return apiClient.updateOrgUser(userId, payload);
  }

  // Organization user management APIs removed

  // Organization user management APIs removed

  static async switchCurrentRole(roleId: string): Promise<{ current_role_id: string }> {
    return apiClient.switchCurrentRole(roleId);
  }

  static async deleteCustomRole(by: string, value: string): Promise<{ message?: string }> {
    return apiClient.deleteCustomRole(by, value);
  }

  static async updateCustomRole(by: string, value: string, payload: { name: string; description: string; is_active: boolean }): Promise<CreateCustomRoleResponse> {
    return apiClient.updateCustomRole(by, value, payload);
  }

  // Session storage utilities for account identifier
  static setAccountIdentifier(accountIdentifier: string): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('accountIdentifier', accountIdentifier);
    }
  }

  static getAccountIdentifier(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('accountIdentifier');
    }
    return null;
  }

  static clearAccountIdentifier(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('accountIdentifier');
    }
  }

  // Stored accounts management
  static getStoredAccounts(): StoredAccount[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem('storedAccounts');
      if (!stored) return [];
      
      const accounts: StoredAccount[] = JSON.parse(stored);
      // Sort by most recently used
      return accounts.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.warn('Failed to parse stored accounts:', error);
      return [];
    }
  }

  static saveStoredAccount(account: StoredAccount): void {
    if (typeof window === 'undefined') return;
    
    try {
      const existingAccounts = this.getStoredAccounts();
      
      // Remove existing account with same identifier
      const filteredAccounts = existingAccounts.filter(
        acc => acc.accountIdentifier !== account.accountIdentifier
      );
      
      // Add new account at the beginning
      const updatedAccounts = [account, ...filteredAccounts];
      
      // Keep only the last 5 accounts
      const limitedAccounts = updatedAccounts.slice(0, 5);
      
      localStorage.setItem('storedAccounts', JSON.stringify(limitedAccounts));
    } catch (error) {
      console.warn('Failed to save stored account:', error);
    }
  }

  static removeStoredAccount(accountIdentifier: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const existingAccounts = this.getStoredAccounts();
      const filteredAccounts = existingAccounts.filter(
        acc => acc.accountIdentifier !== accountIdentifier
      );
      
      localStorage.setItem('storedAccounts', JSON.stringify(filteredAccounts));
    } catch (error) {
      console.warn('Failed to remove stored account:', error);
    }
  }

  static clearStoredAccounts(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('storedAccounts');
    }
  }

  static clearAllAuthData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('storedAccounts');
      sessionStorage.removeItem('accountIdentifier');
    }
  }
}
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  companyName?: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
}

export interface UpdateProfileResult {
  message: string;
  updatedFields: string[];
}
export interface UploadProfilePictureResponse {
  url: string;
  message?: string;
}

export interface SystemRole {
  id: string;
  name: string;
  description: string;
  default_system_role: boolean;
  created_at: string;
  user_role_is_active: boolean;
}

export interface CustomRole {
  id: string;
  user_id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CurrentRole {
  id: string;
  name: string;
  description: string;
  default_system_role: boolean;
  created_at: string;
  user_role_is_active: boolean;
}

export interface GetUserRolesResponse {
  systemRoles: SystemRole[];
  customRoles: CustomRole[];
  currentRole: CurrentRole;
}

export interface RoleDetail {
  id: string | number;
  name: string;
  description: string;
  permissions: string[];
}

export interface CreateCustomRoleRequest {
  name: string;
  description: string;
  permissionIds: number[];
}

export interface CreateCustomRoleResponse {
  id: number | string;
  user_id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  permissions: any[];
}

export interface RolePermission {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
}

// Organization user management types removed
