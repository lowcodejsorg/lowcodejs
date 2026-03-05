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

const Dropdown = z.object({
  id: z.string().trim(),
  label: z.string().trim(),
  color: z.string().nullable().optional(),
});

// Propriedades flat do campo (não aninhadas em configuration)
export const FieldRequiredSchema = z.boolean().default(false);
export const FieldMultipleSchema = z.boolean().default(false);
export const FieldFormatSchema = z
  .enum(E_FIELD_FORMAT)
  .nullable()
  .default(null);
export const FieldShowInFilterSchema = z.boolean().default(false);
export const FieldShowInFormSchema = z.boolean().default(false);
export const FieldShowInDetailSchema = z.boolean().default(false);
export const FieldShowInListSchema = z.boolean().default(false);
export const FieldWidthInFormSchema = z
  .number()
  .min(0)
  .max(100)
  .nullable()
  .default(50);
export const FieldWidthInListSchema = z
  .number()
  .min(0)
  .max(100)
  .nullable()
  .default(10);
export const FieldLockedSchema = z.boolean().default(false);
export const FieldDefaultValueSchema = z.string().nullable().default(null);
export const FieldRelationshipSchema = Relationship.nullable().default(null);
export const FieldDropdownSchema = z.array(Dropdown).default([]);
export const FieldCategorySchema = z.array(Category).default([]);
// For API input: can be just a slug string or the full object
export const FieldGroupSchema = z
  .union([
    z.string().trim(),
    z.object({
      _id: z.string().trim().optional(),
      slug: z.string().trim(),
    }),
  ])
  .nullable()
  .default(null);

// Schema para body de criação/atualização de campos
export const TableFieldBaseSchema = z.object({
  required: FieldRequiredSchema,
  multiple: FieldMultipleSchema,
  format: FieldFormatSchema,
  showInFilter: FieldShowInFilterSchema,
  showInForm: FieldShowInFormSchema,
  showInDetail: FieldShowInDetailSchema,
  showInList: FieldShowInListSchema,
  widthInForm: FieldWidthInFormSchema,
  widthInList: FieldWidthInListSchema,
  locked: FieldLockedSchema,
  defaultValue: FieldDefaultValueSchema,
  relationship: FieldRelationshipSchema,
  dropdown: FieldDropdownSchema,
  category: FieldCategorySchema,
  group: FieldGroupSchema,
});
