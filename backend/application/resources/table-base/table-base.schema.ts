import z from 'zod';

import {
  E_COLLABORATION_PROFILE,
  E_TABLE_STYLE,
} from '@application/core/entity.core';

export const GroupConfigurationSchema = z.object({
  slug: z.string().trim(),
  name: z.string().trim(),
  fields: z.array(z.any()).default([]),
  _schema: z.record(z.string(), z.unknown()).default({}),
});

export const TableStyleSchema = z
  .enum([
    E_TABLE_STYLE.GALLERY,
    E_TABLE_STYLE.LIST,
    E_TABLE_STYLE.DOCUMENT,
    E_TABLE_STYLE.CARD,
    E_TABLE_STYLE.MOSAIC,
    E_TABLE_STYLE.KANBAN,
    E_TABLE_STYLE.FORUM,
    E_TABLE_STYLE.CALENDAR,
    E_TABLE_STYLE.GANTT,
  ])
  .default(E_TABLE_STYLE.LIST);

export const TableActionValueSchema = z.string().trim().min(1).default('NOBODY');

export const TableCollaboratorSchema = z.object({
  user: z.string().trim().min(1),
  profile: z.enum([
    E_COLLABORATION_PROFILE.OWNER,
    E_COLLABORATION_PROFILE.ADMIN,
    E_COLLABORATION_PROFILE.EDITOR,
    E_COLLABORATION_PROFILE.CONTRIBUTOR,
    E_COLLABORATION_PROFILE.VIEWER,
  ]),
});

export const TableCollaboratorsSchema = z
  .array(TableCollaboratorSchema)
  .default([]);

export const TableFieldOrderListSchema = z.array(z.string().trim()).default([]);

export const TableFieldOrderFormSchema = z.array(z.string().trim()).default([]);

export const TableFieldOrderFilterSchema = z
  .array(z.string().trim())
  .default([]);

export const TableFieldOrderDetailSchema = z
  .array(z.string().trim())
  .default([]);

export const TableOrderSchema = z
  .object({
    field: z.string().trim(),
    direction: z.enum(['asc', 'desc']),
  })
  .nullable()
  .default(null);

export const TableLayoutFieldsSchema = z.object({
  title: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  cover: z.string().nullable().default(null),
  category: z.string().nullable().default(null),
  startDate: z.string().nullable().default(null),
  endDate: z.string().nullable().default(null),
  color: z.string().nullable().default(null),
  participants: z.string().nullable().default(null),
  reminder: z.string().nullable().default(null),
});

export const TableMethodSchema = z.object({
  beforeSave: z.object({
    code: z.string().trim().nullable(),
  }),
  afterSave: z.object({
    code: z.string().trim().nullable(),
  }),
  onLoad: z.object({
    code: z.string().trim().nullable(),
  }),
});
