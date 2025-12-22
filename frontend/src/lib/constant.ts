import type { Meta } from './interfaces';

export const MetaDefault: Meta = {
  total: 1,
  perPage: 50,
  page: 1,
  lastPage: 1,
  firstPage: 1,
};

export const MENU_ITEM_TYPE = {
  TABLE: 'table',
  PAGE: 'page',
  FORM: 'form',
  EXTERNAL: 'external',
  SEPARATOR: 'separator',
};

export const FIELD_TYPE = {
  TEXT_SHORT: 'TEXT_SHORT',
  TEXT_LONG: 'TEXT_LONG',
  DROPDOWN: 'DROPDOWN',
  DATE: 'DATE',
  RELATIONSHIP: 'RELATIONSHIP',
  FILE: 'FILE',
  FIELD_GROUP: 'FIELD_GROUP',
  REACTION: 'REACTION',
  EVALUATION: 'EVALUATION',
  CATEGORY: 'CATEGORY',
};

export const FIELD_FORMAT = {
  // TEXT_SHORT
  ALPHA_NUMERIC: 'ALPHA_NUMERIC',
  INTEGER: 'INTEGER',
  DECIMAL: 'DECIMAL',
  URL: 'URL',
  EMAIL: 'EMAIL',
  // DATE
  DD_MM_YYYY: 'dd/MM/yyyy',
  MM_DD_YYYY: 'MM/dd/yyyy',
  YYYY_MM_DD: 'yyyy/MM/dd',
  DD_MM_YYYY_HH_MM_SS: 'dd/MM/yyyy HH:mm:ss',
  MM_DD_YYYY_HH_MM_SS: 'MM/dd/yyyy HH:mm:ss',
  YYYY_MM_DD_HH_MM_SS: 'yyyy/MM/dd HH:mm:ss',
  DD_MM_YYYY_DASH: 'dd-MM-yyyy',
  MM_DD_YYYY_DASH: 'MM-dd-yyyy',
  YYYY_MM_DD_DASH: 'yyyy-MM-dd',
  DD_MM_YYYY_HH_MM_SS_DASH: 'dd-MM-yyyy HH:mm:ss',
  MM_DD_YYYY_HH_MM_SS_DASH: 'MM-dd-yyyy HH:mm:ss',
  YYYY_MM_DD_HH_MM_SS_DASH: 'yyyy-MM-dd HH:mm:ss',
};
