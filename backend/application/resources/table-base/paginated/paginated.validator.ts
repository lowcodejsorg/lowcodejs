import z from 'zod';

export const TablePaginatedQueryValidator = z.object({
  page: z.coerce.number().default(1),
  perPage: z.coerce.number().default(50),
  search: z.string().trim().optional(),
  //
  name: z.string().trim().optional(),
  trashed: z.string().trim().optional(),
  visibility: z.string().trim().optional(),
  owner: z.string().trim().optional(),

  'order-name': z.enum(['asc', 'desc']).optional(),
  'order-link': z.enum(['asc', 'desc']).optional(),
  'order-created-at': z.enum(['asc', 'desc']).optional(),
});

export type TablePaginatedPayload = z.infer<
  typeof TablePaginatedQueryValidator
>;
