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
  showInFilter: boolean;
  showInForm: boolean;
  showInDetail: boolean;
  showInList: boolean;
  widthInForm: number | null;
  widthInList: number | null;
  widthInDetail: number | null;
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

export type ExportedStructure = {
  name: string;
  slug: string;
  description: string | null;
  style: string;
  visibility: string;
  collaboration: string;
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

export type ExportedRow = Record<string, unknown> & { _originalId: string };

export type ExportedTable = {
  structure?: ExportedStructure;
  data?: {
    totalRows: number;
    rows: ExportedRow[];
  };
};

export type ExportedMenu = {
  _originalId: string;
  name: string;
  slug: string;
  type: string;
  parent: string | null;
  url: string | null;
  html: string | null;
  order: number;
  isInitial: boolean;
  tableSlug: string | null;
  extension: { pkg: string; extensionId: string } | null;
};

export type ExportHeader = {
  version: string;
  platform: string;
  tableName: string;
  tableSlug: string;
  exportedBy: string;
  exportedAt: string;
  exportType: 'structure' | 'data' | 'full';
  tablesCount: number;
  menusCount: number;
};

export type ExportResult = {
  header: ExportHeader;
  tables: ExportedTable[];
  menus: ExportedMenu[];
};

export type ExportTableResponse = Either<HTTPException, ExportResult>;
