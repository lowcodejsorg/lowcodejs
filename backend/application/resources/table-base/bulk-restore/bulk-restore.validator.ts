import z from 'zod';

export const BulkRestoreBodyValidator = z.object({
  ids: z.array(z.string().trim()).min(1),
});

export type BulkRestorePayload = z.infer<typeof BulkRestoreBodyValidator>;
