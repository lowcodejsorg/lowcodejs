import z from 'zod';

export const ProfileUpdateBodyValidator = z.object({
  name: z.string().trim(),
  email: z.email().trim(),
  group: z.string().trim(),

  currentPassword: z.string().trim().optional(),
  newPassword: z.string().trim().optional(),
  allowPasswordChange: z.coerce.boolean().default(false),
});

export const ProfileUpdateParamValidator = z.object({
  _id: z.string().trim(),
});
