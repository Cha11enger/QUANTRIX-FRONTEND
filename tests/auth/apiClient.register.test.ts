import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('apiClient.register', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns data on success', async () => {
    vi.mock('axios', () => {
      return {
        default: {
          create: () => ({
            defaults: { baseURL: 'http://localhost:5000', timeout: 10000 },
            interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
            post: vi.fn().mockResolvedValue({
              data: {
                success: true,
                data: {
                  userId: 'uuid',
                  username: 'johndoe123',
                  email: 'john.doe@example.com',
                  fullName: 'John Doe',
                  accountIdentifier: 'ACC-123',
                  dataSharingIdentifier: 'ACC.123',
                  organizationName: 'Org',
                  accountName: 'ACC',
                  companyName: 'Acme',
                },
              },
            }),
          }),
        },
      };
    });

    const { apiClient } = await import('@/lib/api');

    const result = await apiClient.register({
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe123',
      email: 'john.doe@example.com',
      password: 'SecurePass123@',
      confirmPassword: 'SecurePass123@',
      companyName: 'Acme',
    });

    expect(result.username).toBe('johndoe123');
    expect(result.fullName).toBe('John Doe');
  });

  it('throws ApiError on 400 with details.errors', async () => {
    vi.mock('axios', () => {
      return {
        default: {
          create: () => ({
            defaults: { baseURL: 'http://localhost:5000', timeout: 10000 },
            interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
            post: vi.fn().mockResolvedValue({
              data: {
                success: false,
                error: 'Validation error',
                details: { errors: ['Email invalid'] },
              },
            }),
          }),
        },
      };
    });

    const { apiClient, ApiError } = await import('@/lib/api');

    await expect(
      apiClient.register({
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe123',
        email: 'not-an-email',
        password: 'SecurePass123@',
        confirmPassword: 'SecurePass123@',
      } as any)
    ).rejects.toBeInstanceOf(ApiError);
  });
});