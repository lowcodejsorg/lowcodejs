import z from 'zod';

export const BulkTrashBodyValidator = z.object({
  ids: z.array(z.string().trim()).min(1),
});

export type BulkTrashPayload = z.infer<typeof BulkTrashBodyValidator>;
