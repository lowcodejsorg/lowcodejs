import z from 'zod';

export const TablePaginatedQueryValidator = z.object({
  page: z.coerce.number().default(1),
  perPage: z.coerce.number().default(50),
  search: z.string().trim().optional(),
  //
  name: z.string().trim().optional(),
  trashed: z.string().trim().optional(),

  'order-name': z.enum(['asc', 'desc']).default('asc'),
  'order-link': z.enum(['asc', 'desc']).default('asc'),
  'order-created-at': z.enum(['asc', 'desc']).default('asc'),
});
