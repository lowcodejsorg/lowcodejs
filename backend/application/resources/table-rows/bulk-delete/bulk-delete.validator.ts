import z from 'zod';

export const BulkDeleteParamsValidator = z.object({
  slug: z.string().trim(),
});

export const BulkDeleteBodyValidator = z.object({
  ids: z.array(z.string().trim()).min(1),
});

export type BulkDeletePayload = z.infer<typeof BulkDeleteParamsValidator> &
  z.infer<typeof BulkDeleteBodyValidator>;
