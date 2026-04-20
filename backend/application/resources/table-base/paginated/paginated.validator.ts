import z from 'zod';

import { E_TABLE_VISIBILITY } from '@application/core/entity.core';

export const TablePaginatedQueryValidator = z.object({
  page: z.coerce.number().default(1),
  perPage: z.coerce.number().default(50),
  search: z.string().trim().optional(),
  //
  name: z.string().trim().optional(),
  trashed: z.string().trim().optional(),
  visibility: z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      const tokens = value
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean);
      if (tokens.length === 0) return undefined;
      return tokens;
    })
    .pipe(z.array(z.enum(E_TABLE_VISIBILITY)).optional()),
  owner: z.string().trim().optional(),

  'order-name': z.enum(['asc', 'desc']).optional(),
  'order-link': z.enum(['asc', 'desc']).optional(),
  'order-created-at': z.enum(['asc', 'desc']).optional(),
  'order-visibility': z.enum(['asc', 'desc']).optional(),
  'order-owner': z.enum(['asc', 'desc']).optional(),
});

export type TablePaginatedPayload = z.infer<
  typeof TablePaginatedQueryValidator
>;
