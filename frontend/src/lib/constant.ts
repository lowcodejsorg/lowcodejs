import type { Meta } from './interfaces';

export const MetaDefault: Meta = {
  total: 1,
  perPage: 50,
  page: 1,
  lastPage: 1,
  firstPage: 1,
};

export const E_MENU_ITEM_TYPE = {
  TABLE: 'TABLE',
  PAGE: 'PAGE',
  FORM: 'FORM',
  EXTERNAL: 'EXTERNAL',
  SEPARATOR: 'SEPARATOR',
} as const;

export const E_FIELD_TYPE = {
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
} as const;

export const E_ROLE = {
  MASTER: 'MASTER',
  ADMINISTRATOR: 'ADMINISTRATOR',
  MANAGER: 'MANAGER',
  REGISTERED: 'REGISTERED',
} as const;

export const E_FIELD_FORMAT = {
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
} as const;

export const E_TABLE_TYPE = {
  TABLE: 'TABLE',
  FIELD_GROUP: 'FIELD_GROUP',
} as const;

export const E_TABLE_STYLE = {
  LIST: 'LIST',
  GALLERY: 'GALLERY',
} as const;

export const E_TABLE_VISIBILITY = {
  PUBLIC: 'PUBLIC',
  RESTRICTED: 'RESTRICTED',
  OPEN: 'OPEN',
  FORM: 'FORM',
  PRIVATE: 'PRIVATE',
} as const;

export const E_TABLE_COLLABORATION = {
  OPEN: 'OPEN',
  RESTRICTED: 'RESTRICTED',
} as const;

export const E_TOKEN_STATUS = {
  REQUESTED: 'REQUESTED',
  EXPIRED: 'EXPIRED',
  VALIDATED: 'VALIDATED',
} as const;

export const E_JWT_TYPE = {
  ACCESS: 'ACCESS',
  REFRESH: 'REFRESH',
} as const;

export const E_USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

// MANTER SEM PADRÃO UPPERCASE POIS MAPEIA AS CHAVE <- VALOR PARA MONGOOSE
export const E_SCHEMA_TYPE = {
  NUMBER: 'Number',
  STRING: 'String',
  DATE: 'Date',
  BOOLEAN: 'Boolean',
  OBJECT_ID: 'Boolean',
} as const;

export const E_REACTION_TYPE = {
  LIKE: 'LIKE',
  UNLIKE: 'UNLIKE',
} as const;

export const E_TABLE_PERMISSION = {
  // TABLE
  CREATE_TABLE: 'CREATE_TABLE',
  UPDATE_TABLE: 'UPDATE_TABLE',
  REMOVE_TABLE: 'REMOVE_TABLE',
  VIEW_TABLE: 'VIEW_TABLE',

  // FIELD
  CREATE_FIELD: 'CREATE_FIELD',
  UPDATE_FIELD: 'UPDATE_FIELD',
  REMOVE_FIELD: 'REMOVE_FIELD',
  VIEW_FIELD: 'VIEW_FIELD',

  // ROW
  CREATE_ROW: 'CREATE_ROW',
  UPDATE_ROW: 'UPDATE_ROW',
  REMOVE_ROW: 'REMOVE_ROW',
  VIEW_ROW: 'VIEW_ROW',
} as const;

// ============== OPTIONS PARA SELECTS ==============
export const FIELD_TYPE_OPTIONS = [
  { label: 'Texto', value: E_FIELD_TYPE.TEXT_SHORT },
  { label: 'Texto longo', value: E_FIELD_TYPE.TEXT_LONG },
  { label: 'Dropdown', value: E_FIELD_TYPE.DROPDOWN },
  { label: 'Arquivo', value: E_FIELD_TYPE.FILE },
  { label: 'Data', value: E_FIELD_TYPE.DATE },
  { label: 'Relacionamento', value: E_FIELD_TYPE.RELATIONSHIP },
  { label: 'Grupo de campos', value: E_FIELD_TYPE.FIELD_GROUP },
  { label: 'Categoria', value: E_FIELD_TYPE.CATEGORY },
  { label: 'Reação', value: E_FIELD_TYPE.REACTION },
  { label: 'Avaliação', value: E_FIELD_TYPE.EVALUATION },
] as const;

export const TEXT_FORMAT_OPTIONS = [
  { label: 'Alfanumérico', value: E_FIELD_FORMAT.ALPHA_NUMERIC },
  { label: 'Inteiro', value: E_FIELD_FORMAT.INTEGER },
  { label: 'Decimal', value: E_FIELD_FORMAT.DECIMAL },
  { label: 'URL', value: E_FIELD_FORMAT.URL },
  { label: 'E-mail', value: E_FIELD_FORMAT.EMAIL },
] as const;

export const DATE_FORMAT_OPTIONS = [
  { label: 'DD/MM/AAAA', value: E_FIELD_FORMAT.DD_MM_YYYY },
  { label: 'MM/DD/AAAA', value: E_FIELD_FORMAT.MM_DD_YYYY },
  { label: 'AAAA/MM/DD', value: E_FIELD_FORMAT.YYYY_MM_DD },
  { label: 'DD/MM/AAAA hh:mm:ss', value: E_FIELD_FORMAT.DD_MM_YYYY_HH_MM_SS },
  { label: 'MM/DD/AAAA hh:mm:ss', value: E_FIELD_FORMAT.MM_DD_YYYY_HH_MM_SS },
  { label: 'AAAA/MM/DD hh:mm:ss', value: E_FIELD_FORMAT.YYYY_MM_DD_HH_MM_SS },
  { label: 'DD-MM-AAAA', value: E_FIELD_FORMAT.DD_MM_YYYY_DASH },
  { label: 'MM-DD-AAAA', value: E_FIELD_FORMAT.MM_DD_YYYY_DASH },
  { label: 'AAAA-MM-DD', value: E_FIELD_FORMAT.YYYY_MM_DD_DASH },
  {
    label: 'DD-MM-AAAA hh:mm:ss',
    value: E_FIELD_FORMAT.DD_MM_YYYY_HH_MM_SS_DASH,
  },
  {
    label: 'MM-DD-AAAA hh:mm:ss',
    value: E_FIELD_FORMAT.MM_DD_YYYY_HH_MM_SS_DASH,
  },
  {
    label: 'AAAA-MM-DD hh:mm:ss',
    value: E_FIELD_FORMAT.YYYY_MM_DD_HH_MM_SS_DASH,
  },
] as const;

export const MENU_ITEM_TYPE_OPTIONS = [
  { label: 'Tabela', value: E_MENU_ITEM_TYPE.TABLE },
  { label: 'Página', value: E_MENU_ITEM_TYPE.PAGE },
  { label: 'Formulário', value: E_MENU_ITEM_TYPE.FORM },
  { label: 'Link Externo', value: E_MENU_ITEM_TYPE.EXTERNAL },
  { label: 'Separador', value: E_MENU_ITEM_TYPE.SEPARATOR },
] as const;

export const TABLE_COLLABORATION_OPTIONS = [
  { label: 'Restrita', value: E_TABLE_COLLABORATION.RESTRICTED },
  { label: 'Aberta', value: E_TABLE_COLLABORATION.OPEN },
] as const;

export const TABLE_VISIBILITY_OPTIONS = [
  { label: 'Privada', value: E_TABLE_VISIBILITY.PRIVATE },
  { label: 'Restrita', value: E_TABLE_VISIBILITY.RESTRICTED },
  { label: 'Aberta', value: E_TABLE_VISIBILITY.OPEN },
  { label: 'Pública', value: E_TABLE_VISIBILITY.PUBLIC },
  { label: 'Formulário online', value: E_TABLE_VISIBILITY.FORM },
] as const;

export const USER_GROUP_MAPPER = {
  [E_ROLE.ADMINISTRATOR]: 'Administrador',
  [E_ROLE.REGISTERED]: 'Registrado',
  [E_ROLE.MANAGER]: 'Gerente',
  [E_ROLE.MASTER]: 'Master (Super Administrador)',
} as const;

export const USER_STATUS_MAPPER = {
  [E_USER_STATUS.ACTIVE]: 'Ativo',
  [E_USER_STATUS.INACTIVE]: 'Inativo',
} as const;
