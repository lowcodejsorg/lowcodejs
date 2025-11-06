import z from 'zod';

export const UserGroupUpdateParamValidator = z.object({
  _id: z.string(),
});

export const UserGroupUpdateBodyValidator = z.object({
  description: z.string().trim().nullable(),
  permissions: z.array(z.string().trim()).default([]),
});
