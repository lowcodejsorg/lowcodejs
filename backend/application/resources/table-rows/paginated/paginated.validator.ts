import z from 'zod';

import { Merge } from '@application/core/entity.core';

export const TableRowPaginatedQueryValidator = z
  .object({
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
    search: z.string().trim().optional(),
  })
  .loose();

export const TableRowPaginatedParamsValidator = z.object({
  slug: z.string().trim(),
  // _id: z.string().trim(),
});

export type TableRowPaginatedPayload = Merge<
  z.infer<typeof TableRowPaginatedParamsValidator>,
  z.infer<typeof TableRowPaginatedQueryValidator>
>;
