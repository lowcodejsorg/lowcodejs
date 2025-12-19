import z from 'zod';

export const TableRowEvaluationBodyValidator = z.object({
  value: z.number(),
  field: z.string().trim(),
  user: z.string().trim().optional(),
});

export const TableRowEvaluationParamValidator = z.object({
  slug: z.string().trim(),
  _id: z.string().trim(),
});
