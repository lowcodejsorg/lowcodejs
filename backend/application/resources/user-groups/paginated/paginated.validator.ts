import z from 'zod';

import { IUser, Merge } from '@application/core/entity.core';

export const UserGroupPaginatedQueryValidator = z.object({
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

  'order-name': z.enum(['asc', 'desc']).optional(),
  'order-description': z.enum(['asc', 'desc']).optional(),
  'order-created-at': z.enum(['asc', 'desc']).optional(),
});

export type UserGroupPaginatedPayload = Merge<
  z.infer<typeof UserGroupPaginatedQueryValidator>,
  {
    user?: Pick<IUser, '_id'>;
  }
>;
