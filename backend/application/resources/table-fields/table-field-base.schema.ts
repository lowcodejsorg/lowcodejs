import z from 'zod';

import { E_FIELD_FORMAT } from '@application/core/entity.core';

const Category = z.object({
  id: z.string().trim(),
  label: z.string().trim(),
  children: z.array(z.unknown()).default([]), // aceita qualquer coisa
});

const RelationshipLabelPart = z.object({
  path: z.string().trim().min(1),
  label: z.string().trim().optional(),
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
  customLabel: z.boolean().optional(),
  labelParts: z.array(RelationshipLabelPart).optional(),
  labelSeparator: z.string().optional(),
});

const Dropdown = z.object({
  id: z.string().trim(),
  label: z.string().trim(),
  color: z.string().nullable().optional(),
  sortField: z.string().nullable().optional(),
  sortDirection: z.enum(['asc', 'desc']).nullable().optional(),
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
export const FieldWidthInFormSchema = z.number().min(0).nullable().default(50);
export const FieldWidthInListSchema = z.number().min(0).nullable().default(10);
export const FieldWidthInDetailSchema = z
  .number()
  .min(0)
  .nullable()
  .default(50);
export const FieldTipSchema = z
  .string()
  .trim()
  .max(500)
  .nullable()
  .default(null)
  .transform((value) => (value && value.length > 0 ? value : null));
export const FieldLockedSchema = z.boolean().default(false);
export const FieldDefaultValueSchema = z
  .union([z.string(), z.array(z.string())])
  .nullable()
  .default(null);
export const FieldRelationshipSchema = Relationship.nullable().default(null);
// Aceita null além de undefined: alguns clientes (ex.: Kanban) reenviam o campo
// cru do GET, onde dropdown/category vêm como null, e normaliza para [].
export const FieldDropdownSchema = z
  .array(Dropdown)
  .nullish()
  .transform((value) => value ?? []);
export const FieldAllowCustomDropdownOptionsSchema = z.boolean().default(false);
export const FieldAllowCreateRelationshipRecordsSchema = z
  .boolean()
  .default(false);
export const FieldCategorySchema = z
  .array(Category)
  .nullish()
  .transform((value) => value ?? []);
// For API input: can be just a slug string or the full object
export const FieldGroupSchema = z
  .union([
    z.string().trim(),
    z.object({
      _id: z
        .string()
        .trim()
        .nullish()
        .transform((v) => v || undefined)
        .optional(),

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

export function hasDuplicateDropdownLabels(
  dropdown: Array<{ label: string }> | null | undefined,
): boolean {
  if (!dropdown || dropdown.length === 0) return false;

  const labels = new Set<string>();

  for (const item of dropdown) {
    const label = item.label.trim().toLowerCase();
    if (labels.has(label)) return true;
    labels.add(label);
  }

  return false;
}

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
  widthInDetail: FieldWidthInDetailSchema,
  tip: FieldTipSchema,
  locked: FieldLockedSchema,
  defaultValue: FieldDefaultValueSchema,
  relationship: FieldRelationshipSchema,
  dropdown: FieldDropdownSchema,
  allowCustomDropdownOptions: FieldAllowCustomDropdownOptionsSchema,
  allowCreateRelationshipRecords: FieldAllowCreateRelationshipRecordsSchema,
  category: FieldCategorySchema,
  group: FieldGroupSchema,
});
