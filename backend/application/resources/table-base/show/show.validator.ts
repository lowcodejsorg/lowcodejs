import z from 'zod';

export const TableShowParamsValidator = z.object({
  slug: z.string().trim(),
});

export type TableShowPayload = z.infer<typeof TableShowParamsValidator>;
