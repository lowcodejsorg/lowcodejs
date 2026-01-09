import z from 'zod';

export const UserGroupCreateBodyValidator = z.object({
  name: z.string().trim(),
  description: z.string().trim().nullable(),
  permissions: z.array(z.string().trim()).default([]),
});

export type UserGroupCreatePayload = z.infer<
  typeof UserGroupCreateBodyValidator
>;
