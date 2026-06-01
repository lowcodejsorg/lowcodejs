import z from 'zod';

export const GroupFieldRemoveFromTrashParamsValidator = z.object({
  slug: z.string().trim(),
  groupSlug: z.string().trim(),
  fieldId: z.string().trim(),
});

export type GroupFieldRemoveFromTrashPayload = z.infer<
  typeof GroupFieldRemoveFromTrashParamsValidator
>;
