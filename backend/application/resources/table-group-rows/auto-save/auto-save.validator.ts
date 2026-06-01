import z from 'zod';

import { Merge } from '@application/core/entity.core';

export const GroupRowAutoSaveParamsValidator = z.object({
  slug: z.string().trim(),
  rowId: z.string().trim(),
  groupSlug: z.string().trim(),
});

export const GroupRowAutoSaveQueryValidator = z.object({
  _id: z.string().trim().optional(),
});

export const GroupRowAutoSaveBodyValidator = z.record(
  z.string(),
  z.union([
    z.string().trim(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(z.string().trim()),
    z.array(z.number()),
    z.array(
      z
        .object({
          _id: z.string().trim().optional(),
        })
        .loose(),
    ),
    z.object({}).loose(),
  ]),
);

export type GroupRowAutoSavePayload = Merge<
  z.infer<typeof GroupRowAutoSaveParamsValidator>,
  z.infer<typeof GroupRowAutoSaveBodyValidator>
>;
