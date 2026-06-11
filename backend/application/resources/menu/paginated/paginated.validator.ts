import z from 'zod';

export const MenuPaginatedQueryValidator = z.object({
  page: z.coerce
    .number({ message: 'A página deve ser um número' })
    .min(1, 'A página deve ser maior que zero')
    .default(1),
  perPage: z.coerce
    .number({ message: 'O limite por página deve ser um número' })
    .min(1, 'O limite por página deve ser maior que zero')
    .max(100, 'O limite por página deve ser no máximo 100')
    .default(50),
  search: z.string({ message: 'A busca deve ser um texto' }).trim().optional(),
  trashed: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),

  'order-name': z.enum(['asc', 'desc']).optional(),
  'order-position': z.enum(['asc', 'desc']).optional(),
  'order-slug': z.enum(['asc', 'desc']).optional(),
  'order-type': z.enum(['asc', 'desc']).optional(),
  'order-created-at': z.enum(['asc', 'desc']).optional(),
  'order-owner': z.enum(['asc', 'desc']).optional(),
});

export type MenuPaginatedPayload = z.infer<typeof MenuPaginatedQueryValidator>;
