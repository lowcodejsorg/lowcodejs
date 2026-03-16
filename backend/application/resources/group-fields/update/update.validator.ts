import z from 'zod';

import { E_FIELD_TYPE, Merge } from '@application/core/entity.core';

import { TableFieldBaseSchema } from '../group-field-base.schema';

export const GroupFieldUpdateBodyValidator = z
  .object({
    name: z.string().trim(),
    type: z.enum(E_FIELD_TYPE),
    trashed: z.boolean().default(false),
    trashedAt: z
      .string()
      .nullable()
      .default(null)
      .transform((value) => {
        return value ? new Date(value) : null;
      }),
  })
  .merge(TableFieldBaseSchema);

export const GroupFieldUpdateParamsValidator = z.object({
  slug: z.string().trim(),
  groupSlug: z.string().trim(),
  fieldId: z.string().trim(),
});

export type GroupFieldUpdatePayload = Merge<
  z.infer<typeof GroupFieldUpdateParamsValidator>,
  z.infer<typeof GroupFieldUpdateBodyValidator>
>;
