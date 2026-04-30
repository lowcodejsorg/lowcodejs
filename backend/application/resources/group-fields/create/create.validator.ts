import z from 'zod';

import { E_FIELD_TYPE, Merge } from '@application/core/entity.core';

import { TableFieldBaseSchema } from '../group-field-base.schema';

export const GroupFieldCreateBodyValidator = z
  .object({
    name: z.string().trim(),
    type: z.enum(E_FIELD_TYPE),
  })
  .merge(TableFieldBaseSchema);

export const GroupFieldCreateParamsValidator = z.object({
  slug: z.string().trim(),
  groupSlug: z.string().trim(),
});

export type GroupFieldCreatePayload = Merge<
  z.infer<typeof GroupFieldCreateParamsValidator>,
  Omit<
    z.infer<typeof GroupFieldCreateBodyValidator>,
    'allowCustomDropdownOptions'
  > & {
    allowCustomDropdownOptions?: boolean;
  }
>;
