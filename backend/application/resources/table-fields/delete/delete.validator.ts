import z from 'zod';

import { Merge } from '@application/core/entity.core';

export const TableFieldDeleteParamsValidator = z.object({
  slug: z.string().trim(), // reference of table slug
  _id: z.string().trim(),
});

export const TableFieldDeleteQueryValidator = z.object({
  group: z.string().trim().optional(),
});

export type TableFieldDeletePayload = Merge<
  z.infer<typeof TableFieldDeleteParamsValidator>,
  z.infer<typeof TableFieldDeleteQueryValidator>
>;
