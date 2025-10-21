import { FIELD_FORMAT, FIELD_TYPE } from '@core/entity.core';
import z from 'zod';

const Category = z.object({
  id: z.string().trim(),
  label: z.string().trim(),
  children: z.array(z.unknown()).default([]), // aceita qualquer coisa
});

const Relacionamento = z.object({
  collection: z.object({
    _id: z.string().trim(),
    slug: z.string().trim(),
  }),
  field: z.object({
    _id: z.string().trim(),
    slug: z.string().trim(),
  }),
  order: z.enum(['asc', 'desc']).default('asc'),
});

const Configuration = z.object({
  required: z.boolean().default(false),
  multiple: z.boolean().default(false),
  format: z.enum(FIELD_FORMAT).nullable().default(null),
  listing: z.boolean().default(false),
  filtering: z.boolean().default(false),
  defaultValue: z.string().nullable().default(null),
  relationship: Relacionamento.nullable().default(null),
  dropdown: z.array(z.string().trim()).nullable().default(null),
  category: z.array(Category).nullable().default(null),
  group: z
    .object({
      _id: z.string().trim(),
      slug: z.string().trim(),
    })
    .nullable()
    .default(null),
});

export const GetFieldCollectionParamsSchema = z.object({
  slug: z.string().trim(),
});

export const GetFieldCollectionByIdSchema = z.object({
  _id: z.string().trim(),
});

export const CreateFieldCollectionSchema = z.object({
  name: z.string().trim(),
  type: z.enum(FIELD_TYPE),
  configuration: Configuration,
});

export const UpdateFieldCollectionSchema = z.object({
  name: z.string().trim(),
  type: z.enum(FIELD_TYPE),
  configuration: Configuration,
  trashed: z.boolean().default(false),
  trashedAt: z.string().nullable().default(null),
});
