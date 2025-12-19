import z from 'zod';

export const TableRowDeleteParamValidator = z.object({
  slug: z.string().trim(), // table slug reference
  _id: z.string().trim(),
});
