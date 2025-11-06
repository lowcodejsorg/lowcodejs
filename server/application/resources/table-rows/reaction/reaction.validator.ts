import z from 'zod';

export const TableRowReactionBodyValidator = z.object({
  type: z.enum(['like', 'unlike']),
  field: z.string().trim(),
  user: z.string().trim().optional(),
});

export const TableRowReactionParamValidator = z.object({
  slug: z.string().trim(),
  _id: z.string().trim(),
});
