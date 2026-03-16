import z from 'zod';

import { Merge } from '@application/core/entity.core';

export const GroupRowUpdateBodyValidator = z.record(
  z.string(),
  z.union([
    z.string().trim(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(z.string().trim()),
    z.array(z.number()),
    z.object({}).loose(),
  ]),
);

export const GroupRowUpdateParamsValidator = z.object({
  slug: z.string().trim(),
  rowId: z.string().trim(),
  groupSlug: z.string().trim(),
  itemId: z.string().trim(),
});

export type GroupRowUpdatePayload = Merge<
  z.infer<typeof GroupRowUpdateParamsValidator>,
  z.infer<typeof GroupRowUpdateBodyValidator>
>;
