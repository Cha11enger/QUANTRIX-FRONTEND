import { describe, it, expect } from 'vitest';
import { signupSchema } from '@/lib/validation/auth';

describe('signupSchema', () => {
  it('validates a correct payload', () => {
    const data = {
      firstName: 'John',
      lastName: 'Doe',
      username: 'john123',
      email: 'john.doe@example.com',
      password: 'SecurePass123@',
      confirmPassword: 'SecurePass123@',
      companyName: 'Acme Corporation',
      terms: true,
    };
    const parsed = signupSchema.safeParse(data);
    expect(parsed.success).toBe(true);
  });

  it("fails when passwords don't match", () => {
    const data = {
      firstName: 'John',
      lastName: 'Doe',
      username: 'john123',
      email: 'john.doe@example.com',
      password: 'SecurePass123@',
      confirmPassword: 'SecurePass123!',
      terms: true,
    } as any;
    const parsed = signupSchema.safeParse(data);
    expect(parsed.success).toBe(false);
  });

  it('requires special character in password', () => {
    const data = {
      firstName: 'John',
      lastName: 'Doe',
      username: 'john123',
      email: 'john.doe@example.com',
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123',
      terms: true,
    } as any;
    const parsed = signupSchema.safeParse(data);
    expect(parsed.success).toBe(false);
  });

  it('enforces username length and alphanumeric', () => {
    const bad1 = { username: 'ab', firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'Aa1@aaaa', confirmPassword: 'Aa1@aaaa', terms: true } as any;
    const bad2 = { username: 'john_doe', firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'Aa1@aaaa', confirmPassword: 'Aa1@aaaa', terms: true } as any;
    expect(signupSchema.safeParse(bad1).success).toBe(false);
    expect(signupSchema.safeParse(bad2).success).toBe(false);
  });

  it('allows empty or missing company name', () => {
    const withEmpty = {
      firstName: 'John',
      lastName: 'Doe',
      username: 'john123',
      email: 'john.doe@example.com',
      password: 'SecurePass123@',
      confirmPassword: 'SecurePass123@',
      companyName: '',
      terms: true,
    } as any;
    const missing = {
      firstName: 'John',
      lastName: 'Doe',
      username: 'john123',
      email: 'john.doe@example.com',
      password: 'SecurePass123@',
      confirmPassword: 'SecurePass123@',
      terms: true,
    } as any;
    expect(signupSchema.safeParse(withEmpty).success).toBe(true);
    expect(signupSchema.safeParse(missing).success).toBe(true);
  });
});