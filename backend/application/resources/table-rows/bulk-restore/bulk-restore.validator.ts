import z from 'zod';

export const BulkRestoreParamsValidator = z.object({
  slug: z.string().trim(),
});

export const BulkRestoreBodyValidator = z.object({
  ids: z.array(z.string().trim()).min(1),
});

export type BulkRestorePayload = z.infer<typeof BulkRestoreParamsValidator> &
  z.infer<typeof BulkRestoreBodyValidator>;
