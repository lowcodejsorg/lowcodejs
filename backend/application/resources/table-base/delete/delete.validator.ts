import z from 'zod';

export const TableDeleteParamsValidator = z.object({
  slug: z.string().trim(),
});

export type TableDeletePayload = z.infer<typeof TableDeleteParamsValidator>;
