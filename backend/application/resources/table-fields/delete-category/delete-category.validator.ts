import z from 'zod';

export const TableFieldDeleteCategoryParamsValidator = z.object({
  slug: z.string().trim(),
  _id: z.string().trim(),
  categoryId: z.string().trim().min(1),
});

export type TableFieldDeleteCategoryPayload = z.infer<
  typeof TableFieldDeleteCategoryParamsValidator
>;
