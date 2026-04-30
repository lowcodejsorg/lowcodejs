import z from 'zod';

import { E_FIELD_TYPE, Merge } from '@application/core/entity.core';

import { TableFieldBaseSchema } from '../table-field-base.schema';

export const TableFieldCreateBodyValidator = z
  .object({
    name: z.string().trim(),
    type: z.enum(E_FIELD_TYPE),
  })
  .merge(TableFieldBaseSchema);

export const TableFieldCreateParamsValidator = z.object({
  slug: z.string().trim(),
});

export type TableFieldCreatePayload = Merge<
  z.infer<typeof TableFieldCreateParamsValidator>,
  Omit<
    z.infer<typeof TableFieldCreateBodyValidator>,
    'allowCustomDropdownOptions'
  > & {
    allowCustomDropdownOptions?: boolean;
  }
>;
