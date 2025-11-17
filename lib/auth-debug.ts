// Authentication debugging utilities
export class AuthDebug {
  static checkTokens(): { hasAccessToken: boolean; hasRefreshToken: boolean; accessToken?: string; refreshToken?: string } {
    if (typeof window === 'undefined') {
      return { hasAccessToken: false, hasRefreshToken: false };
    }

    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    return {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessToken: accessToken?.substring(0, 20) + '...' || undefined,
      refreshToken: refreshToken?.substring(0, 20) + '...' || undefined,
    };
  }

  static logAuthState(): void {
    const tokens = this.checkTokens();
    console.log('🔐 Auth Debug State:', {
      ...tokens,
      timestamp: new Date().toISOString(),
    });
  }

  static clearAllTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('accountIdentifier');
      console.log('🧹 All tokens cleared');
    }
  }

  static setMockTokens(): void {
    if (typeof window !== 'undefined') {
      // Set mock tokens for testing
      localStorage.setItem('accessToken', 'mock-access-token-for-testing');
      localStorage.setItem('refreshToken', 'mock-refresh-token-for-testing');
      console.log('🧪 Mock tokens set for testing');
    }
  }
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).AuthDebug = AuthDebug;
}