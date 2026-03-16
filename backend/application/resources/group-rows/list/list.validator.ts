import z from 'zod';

export const GroupRowListParamsValidator = z.object({
  slug: z.string().trim(),
  rowId: z.string().trim(),
  groupSlug: z.string().trim(),
});

export type GroupRowListPayload = z.infer<typeof GroupRowListParamsValidator>;
