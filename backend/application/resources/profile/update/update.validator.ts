import z from 'zod';

import { Merge } from '@application/core/entity.core';

export const ProfileUpdateBodyValidator = z.object({
  name: z.string().trim(),
  email: z.string().email().trim(),
  group: z.string().trim(),

  currentPassword: z.string().trim().optional(),
  newPassword: z.string().trim().optional(),
  allowPasswordChange: z.coerce.boolean().default(false),
});

export const ProfileUpdateParamsValidator = z.object({
  _id: z.string().trim(),
});

export type ProfileUpdatePayload = Merge<
  z.infer<typeof ProfileUpdateParamsValidator>,
  z.infer<typeof ProfileUpdateBodyValidator>
>;
