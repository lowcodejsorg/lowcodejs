import z from 'zod';

export const UserCreateGroupBodyValidator = z.object({
  name: z.string().trim(),
  description: z.string().trim().nullable(),
  permissions: z.array(z.string().trim()).default([]),
});
