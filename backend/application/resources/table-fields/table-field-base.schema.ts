import z from 'zod';

import { E_FIELD_FORMAT } from '@application/core/entity.core';

const Category = z.object({
  id: z.string().trim(),
  label: z.string().trim(),
  children: z.array(z.unknown()).default([]), // aceita qualquer coisa
});

const Relationship = z.object({
  table: z.object({
    _id: z.string().trim(),
    slug: z.string().trim(),
  }),
  field: z.object({
    _id: z.string().trim(),
    slug: z.string().trim(),
  }),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export const TableFieldConfiguration = z.object({
  required: z.boolean().default(false),
  multiple: z.boolean().default(false),
  format: z.enum(E_FIELD_FORMAT).nullable().default(null),
  listing: z.boolean().default(false),
  filtering: z.boolean().default(false),
  defaultValue: z.string().nullable().default(null),
  relationship: Relationship.nullable().default(null),
  dropdown: z.array(z.string().trim()).default([]),
  category: z.array(Category).default([]),
  group: z
    .object({
      _id: z.string().trim(),
      slug: z.string().trim(),
    })
    .nullable()
    .default(null),
});
