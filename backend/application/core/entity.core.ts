/**
 * Make some property optional an type
 *
 * @example
 * ```typescript
 * type Post {
 *  id: string;
 *  name: string;
 *  email: string;
 * }
 *
 * Optional<Post, 'name' | 'email>
 * ```
 */
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export const E_TOKEN_STATUS = {
  REQUESTED: 'REQUESTED',
  EXPIRED: 'EXPIRED',
  VALIDATED: 'VALIDATED',
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

export const E_ROLE = {
  MASTER: 'MASTER',
  ADMINISTRATOR: 'ADMINISTRATOR',
  MANAGER: 'MANAGER',
  REGISTERED: 'REGISTERED',
} as const;

export interface JWTPayload {
  sub: string;
  email: string;
  role: keyof typeof E_ROLE;
  type: 'access' | 'refresh';
}

export interface Base {
  _id: string;
  createdAt: Date;
  updatedAt: Date | null;
  trashedAt: Date | null;
  trashed: boolean;
}

export interface ValidationToken extends Base {
  user: string;
  code: string;
  status: keyof typeof E_TOKEN_STATUS;
}

export interface Storage extends Base {
  url: string;
  filename: string;
  type: string;
  originalName: string;
  size: number;
}

export interface Permission extends Base {
  name: string;
  slug: string;
  description: string | null;
}

export interface UserGroup extends Base {
  name: string;
  slug: string;
  description: string | null;
  permissions: string[] | Permission[];
}

export interface User extends Base {
  name: string;
  email: string;
  password: string;
  status: 'active' | 'inactive';
  group: UserGroup;
}

export interface Schema {
  type: 'Number' | 'String' | 'Date' | 'Boolean' | 'ObjectId';
  required?: boolean;
  ref?: string;
  default?: string | number | boolean | null;
}

export type TableSchema = Record<string, Schema | Schema[]>;

export interface Table extends Base {
  _schema: TableSchema;
  name: string;
  description: string | null;
  logo: string | Storage | null;
  slug: string;
  fields: string[] | Field[];
  type: 'table' | 'field-group';
  configuration: {
    style: 'gallery' | 'list';
    visibility: 'public' | 'restricted' | 'open' | 'form' | 'private';
    collaboration: 'open' | 'restricted';
    administrators: string[] | User[];
    owner: string | User;
    fields: {
      orderList: string[];
      orderForm: string[];
    };
  };
  methods: {
    onLoad: {
      code: string | null;
    };
    beforeSave: {
      code: string | null;
    };
    afterSave: {
      code: string | null;
    };
  };
}

export interface Category {
  id: string;
  label: string;
  children: unknown[];
}

export interface FieldConfigurationRelationship {
  table: Pick<Table, '_id' | 'slug'>;
  field: Pick<Field, '_id' | 'slug'>;
  order: 'asc' | 'desc';
}

export type FieldConfigurationGroup = Pick<Table, '_id' | 'slug'>;

export interface Field extends Base {
  name: string;
  slug: string;
  type: keyof typeof E_FIELD_TYPE;
  configuration: {
    required: boolean;
    multiple: boolean;
    format: keyof typeof E_FIELD_FORMAT | null;
    listing: boolean;
    filtering: boolean;
    defaultValue: string | null;
    relationship: FieldConfigurationRelationship | null;
    dropdown: string[];
    category: Category[];
    group: FieldConfigurationGroup | null;
  };
}

export interface Row extends Base, Record<string, any> {}

export interface Attachment {
  filename: string;
  content: Buffer | string;
}

export interface EmailOptions {
  from?: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<Attachment>;
}

export interface SentMessageInfo {
  accepted: string[];
  rejected: string[];
  envelope: {
    from: string;
    to: string[];
  };
}

export interface Search extends Record<string, unknown> {
  page: number;
  perPage: number;
  search?: string;
  trashed?: 'true' | 'false';
  sub?: string;
}

export interface Meta {
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
  firstPage: number;
}
export interface Paginated<Entity> {
  data: Entity[];
  meta: Meta;
}

export interface Reaction extends Base {
  user: string | User;
  type: 'like' | 'unlike';
}

export interface Evaluation extends Base {
  user: string | User;
  value: number;
}

export const E_MENU_ITEM_TYPE = {
  TABLE: 'TABLE',
  PAGE: 'PAGE',
  FORM: 'FORM',
  EXTERNAL: 'EXTERNAL',
  SEPARATOR: 'SEPARATOR',
} as const;

export interface Menu extends Base {
  name: string;
  slug: string;
  type: keyof typeof E_MENU_ITEM_TYPE;
  table: string | null;
  parent: string | null;
  url: string | null;
  html: string | null;
}

export interface Setting {
  LOCALE: string;
  FILE_UPLOAD_MAX_SIZE: number;
  FILE_UPLOAD_ACCEPTED: string;
  FILE_UPLOAD_MAX_FILES_PER_UPLOAD: number;
  PAGINATION_PER_PAGE: number;
  LOGO_SMALL_URL?: string;
  LOGO_LARGE_URL?: string;
  EMAIL_PROVIDER_HOST: string;
  EMAIL_PROVIDER_PORT: number;
  EMAIL_PROVIDER_USER: string;
  EMAIL_PROVIDER_PASSWORD?: string;
}
