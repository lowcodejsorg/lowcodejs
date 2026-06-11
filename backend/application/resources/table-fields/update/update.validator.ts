import z from 'zod';

import { E_FIELD_TYPE } from '@application/core/entity.core';
import {
  FIELD_NAME_MAX_LENGTH,
  FIELD_SLUG_MAX_LENGTH,
} from '@application/core/field-slug.core';

import { TableFieldBaseSchema } from '../table-field-base.schema';

export const TableFieldUpdateBodyValidator = z
  .object({
    name: z.string().trim().min(1).max(FIELD_NAME_MAX_LENGTH),
    slug: z.string().trim().max(FIELD_SLUG_MAX_LENGTH).optional(),
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

export const TableFieldUpdateParamsValidator = z.object({
  slug: z.string().trim(), // reference of table slug
  _id: z.string().trim(),
});

export type TableFieldUpdatePayload = Omit<
  z.infer<typeof TableFieldUpdateBodyValidator>,
  'allowCustomDropdownOptions' | 'tip' | 'slug'
> & {
  _id: string;
  slug?: string;
  tableSlug?: string;
  allowCustomDropdownOptions?: boolean;
  tip?: string | null;
};
