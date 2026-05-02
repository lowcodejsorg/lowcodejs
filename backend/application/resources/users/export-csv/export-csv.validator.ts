import z from 'zod';

import {
  E_ROLE,
  E_USER_STATUS,
  IUser,
  Merge,
  ValueOf,
} from '@application/core/entity.core';

export const UserExportCsvQueryValidator = z.object({
  search: z.string({ message: 'A busca deve ser um texto' }).trim().optional(),

  trashed: z
    .preprocess(
      (v) => {
        if (typeof v === 'boolean') return String(v);
        return v;
      },
      z.enum(['true', 'false']).transform((v) => v === 'true'),
    )
    .optional(),

  status: z.enum(E_USER_STATUS, { message: 'Status inválido' }).optional(),

  role: z.enum(E_ROLE, { message: 'Role inválido' }).optional(),

  'order-name': z.enum(['asc', 'desc']).optional(),
  'order-email': z.enum(['asc', 'desc']).optional(),
  'order-group': z.enum(['asc', 'desc']).optional(),
  'order-status': z.enum(['asc', 'desc']).optional(),
  'order-created-at': z.enum(['asc', 'desc']).optional(),
});

export type UserExportCsvPayload = Merge<
  z.infer<typeof UserExportCsvQueryValidator>,
  {
    user?: Merge<
      Pick<IUser, '_id'>,
      {
        role: ValueOf<typeof E_ROLE>;
      }
    >;
  }
>;
