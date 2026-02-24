import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { E_FIELD_TYPE } from '@/lib/constant';

export const Route = createFileRoute('/_private/tables/$slug/field/create/')({
  validateSearch: z.object({
    'field-type': z
      .enum(Object.keys(E_FIELD_TYPE) as [string, ...Array<string>])
      .optional(),
    group: z.string().optional(),
  }),
});
