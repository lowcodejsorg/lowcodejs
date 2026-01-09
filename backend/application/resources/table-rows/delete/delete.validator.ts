import z from 'zod';

export const TableRowDeleteParamsValidator = z.object({
  slug: z.string().trim(), // table slug reference
  _id: z.string().trim(),
});

export type TableRowDeletePayload = z.infer<typeof TableRowDeleteParamsValidator>;
