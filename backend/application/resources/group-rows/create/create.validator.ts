import z from 'zod';

import { Merge } from '@application/core/entity.core';

export const GroupRowCreateBodyValidator = z.record(
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

export const GroupRowCreateParamsValidator = z.object({
  slug: z.string().trim(),
  rowId: z.string().trim(),
  groupSlug: z.string().trim(),
});

export type GroupRowCreatePayload = Merge<
  z.infer<typeof GroupRowCreateParamsValidator>,
  z.infer<typeof GroupRowCreateBodyValidator>
>;
