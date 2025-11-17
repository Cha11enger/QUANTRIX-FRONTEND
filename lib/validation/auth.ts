import { z } from 'zod';

export const signupSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be at most 50 characters')
      .regex(/^[A-Za-z ]+$/, 'First name must contain letters and spaces only'),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must be at most 50 characters')
      .regex(/^[A-Za-z ]+$/, 'Last name must contain letters and spaces only'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(/^[A-Za-z0-9]+$/, 'Username must be alphanumeric only'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        'Password must include uppercase, lowercase, number, and special character'
      ),
    confirmPassword: z.string(),
    companyName: z
      .union([
        z.string().max(100, 'Company name must be at most 100 characters'),
        z.literal(''),
      ])
      .optional(),
    terms: z
      .boolean()
      .refine((val) => val === true, 'You must agree to the terms and conditions'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;