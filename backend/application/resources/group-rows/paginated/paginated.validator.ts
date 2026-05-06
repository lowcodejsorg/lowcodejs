import z from 'zod';

import { Merge } from '@application/core/entity.core';

export const GroupRowPaginatedQueryValidator = z
  .object({
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
    search: z.string().trim().optional(),
  })
  .loose();

export const GroupRowPaginatedParamsValidator = z.object({
  slug: z.string().trim(),
  rowId: z.string().trim(),
  groupSlug: z.string().trim(),
});

export type GroupRowPaginatedPayload = Merge<
  z.infer<typeof GroupRowPaginatedParamsValidator>,
  z.infer<typeof GroupRowPaginatedQueryValidator>
>;
