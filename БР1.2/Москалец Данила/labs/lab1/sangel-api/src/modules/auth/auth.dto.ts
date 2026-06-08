import { z } from 'zod';
import { UserRole } from '../user/user.entity';

// Register
export const RegisterSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(4, 'Password must be at least 4 characters'), 
    first_name: z.string().max(64, 'First name too long'),
    last_name: z.string().max(64, 'Last name too long'),
    middle_name: z.string().max(64).optional().nullable(),
  }),
});

export type RegisterDto = z.infer<typeof RegisterSchema>['body'];

// Login
export const LoginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export type LoginDto = z.infer<typeof LoginSchema>['body'];

// Refresh Token
export const RefreshTokenSchema = z.object({
  body: z.object({
    refresh_token: z.string().min(1, 'Refresh token is required'),
  }),
});

export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>['body'];

// Logout
export const LogoutSchema = z.object({
  body: z.object({
    refresh_token: z.string().min(1, 'Refresh token is required'),
  }),
});

export type LogoutDto = z.infer<typeof LogoutSchema>['body'];

// Response types
export interface TokenPairResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface UserResponse {
  id: number;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  is_verified: boolean;
  created_at: Date;
}