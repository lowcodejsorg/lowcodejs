import z from 'zod';

export const TableRowShowParamValidator = z.object({
  slug: z.string().trim(),
  _id: z.string().trim(),
});
