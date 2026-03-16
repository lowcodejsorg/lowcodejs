import z from 'zod';

export const GroupRowDeleteParamsValidator = z.object({
  slug: z.string().trim(),
  rowId: z.string().trim(),
  groupSlug: z.string().trim(),
  itemId: z.string().trim(),
});

export type GroupRowDeletePayload = z.infer<
  typeof GroupRowDeleteParamsValidator
>;
