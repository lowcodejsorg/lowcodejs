import z from 'zod';

import { E_ROLE } from '@application/core/entity.core';

export const UserPaginatedQueryValidator = z.object({
  page: z.coerce.number().default(1),
  perPage: z.coerce.number().default(50),
  search: z.string().trim().optional(),
  user: z
    .object({
      _id: z.string().trim(),
      role: z.enum(E_ROLE),
    })
    .optional(),
});

export type UserPaginatedPayload = z.infer<typeof UserPaginatedQueryValidator>;
