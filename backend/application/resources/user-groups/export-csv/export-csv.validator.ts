import z from 'zod';

import { E_ROLE, IUser, Merge, ValueOf } from '@application/core/entity.core';

export const UserGroupExportCsvQueryValidator = z.object({
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

  'order-name': z.enum(['asc', 'desc']).optional(),
  'order-description': z.enum(['asc', 'desc']).optional(),
  'order-created-at': z.enum(['asc', 'desc']).optional(),
});

export type UserGroupExportCsvPayload = Merge<
  z.infer<typeof UserGroupExportCsvQueryValidator>,
  {
    user?: Merge<
      Pick<IUser, '_id'>,
      {
        role: ValueOf<typeof E_ROLE>;
      }
    >;
  }
>;
