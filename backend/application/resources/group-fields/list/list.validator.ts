import z from 'zod';

export const GroupFieldListParamsValidator = z.object({
  slug: z.string().trim(),
  groupSlug: z.string().trim(),
});

export type GroupFieldListPayload = z.infer<
  typeof GroupFieldListParamsValidator
>;
