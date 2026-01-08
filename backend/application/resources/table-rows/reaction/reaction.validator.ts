import z from 'zod';

import { E_REACTION_TYPE, Merge } from '@application/core/entity.core';

export const TableRowReactionBodyValidator = z.object({
  type: z.enum(E_REACTION_TYPE),
  field: z.string().trim(),
  user: z.string().trim(),
});

export const TableRowReactionParamsValidator = z.object({
  slug: z.string().trim(),
  _id: z.string().trim(),
});

export type TableRowReactionPayload = Merge<
  z.infer<typeof TableRowReactionParamsValidator>,
  z.infer<typeof TableRowReactionBodyValidator>
>;
