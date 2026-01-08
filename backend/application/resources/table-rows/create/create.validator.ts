import z from 'zod';

import { Merge } from '@application/core/entity.core';

export const TableRowCreateBodyValidator = z.record(
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

export const TableRowCreateParamsValidator = z.object({
  slug: z.string().trim(),
});

export type TableRowCreatePayload = Merge<
  z.infer<typeof TableRowCreateParamsValidator>,
  z.infer<typeof TableRowCreateBodyValidator>
>;
