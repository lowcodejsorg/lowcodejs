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
export const FieldVisibilityFormSchema = z.string().default('HIDDEN');
export const FieldVisibilityDetailSchema = z.string().default('HIDDEN');
export const FieldVisibilityListSchema = z.string().default('HIDDEN');
export const FieldWidthInFormSchema = z.number().min(0).nullable().default(50);
export const FieldWidthInListSchema = z.number().min(0).nullable().default(10);
export const FieldWidthInDetailSchema = z
  .number()
  .min(0)
  .nullable()
  .default(50);
export const FieldLockedSchema = z.boolean().default(false);
export const FieldDefaultValueSchema = z
  .union([z.string(), z.array(z.string())])
  .nullable()
  .default(null);
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

// Tipos que armazenam defaultValue como string[]
const ARRAY_DEFAULT_VALUE_TYPES = new Set([
  'DROPDOWN',
  'CATEGORY',
  'USER',
  'RELATIONSHIP',
]);

// Tipos que armazenam defaultValue como string
const STRING_DEFAULT_VALUE_TYPES = new Set(['TEXT_SHORT', 'TEXT_LONG', 'DATE']);

/**
 * Normaliza defaultValue para a estrutura correta baseado no tipo do campo:
 * - TEXT_SHORT, TEXT_LONG, DATE → string | null
 * - DROPDOWN, CATEGORY, USER, RELATIONSHIP → string[] | null
 * - Outros → null
 */
export function normalizeDefaultValue(
  type: string,
  defaultValue: string | string[] | null | undefined,
): string | string[] | null {
  if (defaultValue === null || defaultValue === undefined) return null;

  if (ARRAY_DEFAULT_VALUE_TYPES.has(type)) {
    if (Array.isArray(defaultValue)) {
      return defaultValue.length > 0 ? defaultValue : null;
    }
    if (typeof defaultValue === 'string' && defaultValue) {
      return [defaultValue];
    }
    return null;
  }

  if (STRING_DEFAULT_VALUE_TYPES.has(type)) {
    if (typeof defaultValue === 'string' && defaultValue) {
      return defaultValue;
    }
    if (Array.isArray(defaultValue) && defaultValue.length > 0) {
      return defaultValue[0];
    }
    return null;
  }

  return null;
}

// Schema para body de criação/atualização de campos
export const TableFieldBaseSchema = z.object({
  required: FieldRequiredSchema,
  multiple: FieldMultipleSchema,
  format: FieldFormatSchema,
  visibilityForm: FieldVisibilityFormSchema,
  visibilityDetail: FieldVisibilityDetailSchema,
  visibilityList: FieldVisibilityListSchema,
  widthInForm: FieldWidthInFormSchema,
  widthInList: FieldWidthInListSchema,
  widthInDetail: FieldWidthInDetailSchema,
  locked: FieldLockedSchema,
  defaultValue: FieldDefaultValueSchema,
  relationship: FieldRelationshipSchema,
  dropdown: FieldDropdownSchema,
  category: FieldCategorySchema,
  group: FieldGroupSchema,
});
