import type { Either } from '@application/core/either.core';
import type HTTPException from '@application/core/exception.core';

import type { ExportTablePayload } from './export-table.validator';

export type ExportTableUseCasePayload = ExportTablePayload & {
  userId: string;
  userName: string;
};

export type ExportedField = {
  name: string;
  slug: string;
  type: string;
  required: boolean;
  multiple: boolean;
  format: string | null;
  visibilityForm: string;
  visibilityDetail: string;
  visibilityList: string;
  widthInForm: number | null;
  widthInList: number | null;
  defaultValue: string | string[] | null;
  locked?: boolean;
  relationship: {
    tableSlug: string;
    fieldSlug: string;
    order: 'asc' | 'desc';
  } | null;
  dropdown: Array<{ id: string; label: string; color?: string | null }>;
  category: Array<{ id: string; label: string; children: unknown[] }>;
  group: { slug: string } | null;
};

export type ExportedGroup = {
  slug: string;
  name: string;
  fields: ExportedField[];
};

export type ExportHeader = {
  version: string;
  platform: string;
  tableName: string;
  tableSlug: string;
  exportedBy: string;
  exportedAt: string;
  exportType: 'structure' | 'data' | 'full';
};

export type ExportedStructure = {
  name: string;
  slug: string;
  description: string | null;
  style: string;
  viewTable: string;
  updateTable: string;
  createField: string;
  updateField: string;
  removeField: string;
  viewField: string;
  createRow: string;
  updateRow: string;
  removeRow: string;
  viewRow: string;
  fields: ExportedField[];
  groups: ExportedGroup[];
  fieldOrderList: string[];
  fieldOrderForm: string[];
  fieldOrderFilter: string[];
  fieldOrderDetail: string[];
  layoutFields: Record<string, string | null>;
  methods: {
    onLoad: { code: string | null };
    beforeSave: { code: string | null };
    afterSave: { code: string | null };
  };
};

export type ExportResult = {
  header: ExportHeader;
  structure?: ExportedStructure;
  data?: {
    totalRows: number;
    rows: Record<string, unknown>[];
  };
};

export type ExportTableResponse = Either<HTTPException, ExportResult>;
