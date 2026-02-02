import z from 'zod';

import { Merge } from '@application/core/entity.core';

export const TableFieldShowParamsValidator = z.object({
  slug: z.string().trim(), // reference of table slug
  _id: z.string().trim(),
});

export const TableFieldShowQueryValidator = z.object({
  group: z.string().trim().optional(),
});

export type TableFieldShowPayload = Merge<
  z.infer<typeof TableFieldShowParamsValidator>,
  z.infer<typeof TableFieldShowQueryValidator>
>;
