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
});

export type MenuPaginatedPayload = z.infer<typeof MenuPaginatedQueryValidator>;
