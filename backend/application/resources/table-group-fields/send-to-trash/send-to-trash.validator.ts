import z from 'zod';

export const GroupFieldSendToTrashParamsValidator = z.object({
  slug: z.string().trim(),
  groupSlug: z.string().trim(),
  fieldId: z.string().trim(),
});

export type GroupFieldSendToTrashPayload = z.infer<
  typeof GroupFieldSendToTrashParamsValidator
>;
