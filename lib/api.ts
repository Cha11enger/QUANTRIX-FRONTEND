import axios, { AxiosInstance, AxiosError } from 'axios';

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
  };
}

// Authentication Types
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
}

export interface RegisterResponse {
  userId: string;
  username: string;
  email: string;
  accountIdentifier: string;
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
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse>) => {
        if (error.response) {
          const { status, data } = error.response;
          throw new ApiError(
            status,
            data?.error || 'An error occurred',
            data?.details
          );
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
    
    return loginData;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/api/v1/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      this.clearStoredTokens();
    }
  }

  async refreshToken(): Promise<string> {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refreshToken') 
      : null;
    
    if (!refreshToken) {
      throw new ApiError(401, 'No refresh token available');
    }

    const response = await this.client.post<ApiResponse<{ token: string; expiresIn: number }>>(
      '/api/v1/auth/refresh',
      { refreshToken }
    );
    
    if (!response.data.success || !response.data.data) {
      throw new ApiError(401, 'Token refresh failed');
    }
    
    const newToken = response.data.data.token;
    this.setStoredToken(newToken);
    
    return newToken;
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

  async getProfile(): Promise<any> {
    const response = await this.client.get<ApiResponse>('/api/v1/auth/profile');
    
    if (!response.data.success) {
      throw new ApiError(400, response.data.error || 'Failed to get profile');
    }
    
    return response.data.data;
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

  static async getProfile(): Promise<any> {
    return apiClient.getProfile();
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