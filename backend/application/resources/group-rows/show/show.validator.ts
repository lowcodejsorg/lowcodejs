import z from 'zod';

export const GroupRowShowParamsValidator = z.object({
  slug: z.string().trim(),
  rowId: z.string().trim(),
  groupSlug: z.string().trim(),
  itemId: z.string().trim(),
});

export type GroupRowShowPayload = z.infer<typeof GroupRowShowParamsValidator>;
