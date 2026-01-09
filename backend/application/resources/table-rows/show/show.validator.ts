import z from 'zod';

export const TableRowShowParamsValidator = z.object({
  slug: z.string().trim(),
  _id: z.string().trim(),
});

export type TableRowShowPayload = z.infer<typeof TableRowShowParamsValidator>;
