import z from 'zod';

export const TableRowPaginatedQueryValidator = z
  .object({
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
    search: z.string().trim().optional(),
  })
  .loose();

export const TableRowPaginatedParamValidator = z.object({
  slug: z.string().trim(),
  // _id: z.string().trim(),
});
