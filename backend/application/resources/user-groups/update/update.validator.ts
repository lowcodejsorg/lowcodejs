import z from 'zod';

import { Merge } from '@application/core/entity.core';

export const UserGroupUpdateParamsValidator = z.object({
  _id: z.string(),
});

export const UserGroupUpdateBodyValidator = z.object({
  description: z.string().trim().nullable(),
  permissions: z.array(z.string().trim()).default([]),
});

export type UserGroupUpdatePayload = Merge<
  z.infer<typeof UserGroupUpdateParamsValidator>,
  z.infer<typeof UserGroupUpdateBodyValidator>
>;
