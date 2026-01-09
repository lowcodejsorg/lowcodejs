import z from 'zod';

import { Merge } from '@application/core/entity.core';

export const UserGroupUpdateParamsValidator = z.object({
  _id: z.string(),
});

export const UserGroupUpdateBodyValidator = z.object({
  name: z.string().trim().optional(),
  description: z.string().trim().nullable().optional(),
  permissions: z.array(z.string().trim()).default([]),
});

export type UserGroupUpdatePayload = Merge<
  z.infer<typeof UserGroupUpdateParamsValidator>,
  z.infer<typeof UserGroupUpdateBodyValidator>
>;
