import { z } from 'zod';

// Update Profile
export const UpdateProfileSchema = z.object({
  body: z.object({
    first_name: z.string().max(64, 'First name too long').optional(),
    last_name: z.string().max(64, 'Last name too long').optional(),
    middle_name: z.string().max(64).nullable().optional(),
  }),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>['body'];

// Change Password
export const ChangePasswordSchema = z.object({
  body: z.object({
    old_password: z.string().min(1, 'Old password is required'),
    new_password: z.string().min(4, 'New password must be at least 4 characters'),
  }),
});

export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>['body'];