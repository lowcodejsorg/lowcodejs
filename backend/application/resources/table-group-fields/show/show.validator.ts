import z from 'zod';

export const GroupFieldShowParamsValidator = z.object({
  slug: z.string().trim(),
  groupSlug: z.string().trim(),
  fieldId: z.string().trim(),
});

export type GroupFieldShowPayload = z.infer<
  typeof GroupFieldShowParamsValidator
>;
