import z from 'zod';

import { Merge } from '@application/core/entity.core';

export const TableFieldRemoveFromTrashParamsValidator = z.object({
  slug: z.string().trim(), // reference of table slug
  _id: z.string().trim(),
});

export const TableFieldRemoveFromTrashQueryValidator = z.object({
  group: z.string().trim().optional(),
});

export type TableFieldRemoveFromTrashPayload = Merge<
  z.infer<typeof TableFieldRemoveFromTrashParamsValidator>,
  z.infer<typeof TableFieldRemoveFromTrashQueryValidator>
>;
