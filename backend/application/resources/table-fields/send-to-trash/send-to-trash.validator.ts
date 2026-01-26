import z from 'zod';

import { Merge } from '@application/core/entity.core';

export const TableFieldSendToTrashParamsValidator = z.object({
  slug: z.string().trim(), // reference of table slug
  _id: z.string().trim(),
});

export const TableFieldSendToTrashQueryValidator = z.object({
  group: z.string().trim().optional(),
});

export type TableFieldSendToTrashPayload = Merge<
  z.infer<typeof TableFieldSendToTrashParamsValidator>,
  z.infer<typeof TableFieldSendToTrashQueryValidator>
>;
