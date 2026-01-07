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

export const E_MENU_ITEM_TYPE = {
  TABLE: 'TABLE',
  PAGE: 'PAGE',
  FORM: 'FORM',
  EXTERNAL: 'EXTERNAL',
  SEPARATOR: 'SEPARATOR',
} as const;

export interface IJWTPayload {
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

export interface IValidationToken extends Base {
  user: string;
  code: string;
  status: keyof typeof E_TOKEN_STATUS;
}

export interface IStorage extends Base {
  url: string;
  filename: string;
  type: string;
  originalName: string;
  size: number;
}

export interface IPermission extends Base {
  name: string;
  slug: string;
  description: string | null;
}

export interface IGroup extends Base {
  name: string;
  slug: string;
  description: string | null;
  permissions: string[] | IPermission[];
}

export interface IUser extends Base {
  name: string;
  email: string;
  password: string;
  status: 'active' | 'inactive';
  group: IGroup;
}

export interface ISchema {
  type: 'Number' | 'String' | 'Date' | 'Boolean' | 'ObjectId';
  required?: boolean;
  ref?: string;
  default?: string | number | boolean | null;
}

export type ITableSchema = Record<string, ISchema | ISchema[]>;

export interface ITable extends Base {
  _schema: ITableSchema;
  name: string;
  description: string | null;
  logo: string | IStorage | null;
  slug: string;
  fields: string[] | IField[];
  type: 'table' | 'field-group';
  configuration: {
    style: 'gallery' | 'list';
    visibility: 'public' | 'restricted' | 'open' | 'form' | 'private';
    collaboration: 'open' | 'restricted';
    administrators: string[] | IUser[];
    owner: string | IUser;
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

export interface ICategory {
  id: string;
  label: string;
  children: unknown[];
}

export interface IFieldConfigurationRelationship {
  table: Pick<ITable, '_id' | 'slug'>;
  field: Pick<IField, '_id' | 'slug'>;
  order: 'asc' | 'desc';
}

export type IFieldConfigurationGroup = Pick<ITable, '_id' | 'slug'>;

export interface IField extends Base {
  name: string;
  slug: string;
  type: (typeof E_FIELD_TYPE)[keyof typeof E_FIELD_TYPE];
  configuration: {
    required: boolean;
    multiple: boolean;
    format: (typeof E_FIELD_FORMAT)[keyof typeof E_FIELD_FORMAT] | null;
    listing: boolean;
    filtering: boolean;
    defaultValue: string | null;
    relationship: IFieldConfigurationRelationship | null;
    dropdown: string[];
    category: ICategory[];
    group: IFieldConfigurationGroup | null;
  };
}

export interface IRow extends Base, Record<string, any> {}

export interface IAttachment {
  filename: string;
  content: Buffer | string;
}

export interface IEmailOptions {
  from?: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<IAttachment>;
}

export interface ISentMessageInfo {
  accepted: string[];
  rejected: string[];
  envelope: {
    from: string;
    to: string[];
  };
}

export interface ISearch extends Record<string, unknown> {
  page: number;
  perPage: number;
  search?: string;
  trashed?: 'true' | 'false';
  sub?: string;
}

export interface IMeta {
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
  firstPage: number;
}

export interface Paginated<Entity> {
  data: Entity[];
  meta: IMeta;
}

export interface IReaction extends Base {
  user: string | IUser;
  type: 'like' | 'unlike';
}

export interface IEvaluation extends Base {
  user: string | IUser;
  value: number;
}

export interface IMenu extends Base {
  name: string;
  slug: string;
  type: (typeof E_MENU_ITEM_TYPE)[keyof typeof E_MENU_ITEM_TYPE];
  table: string | null;
  parent: string | null;
  url: string | null;
  html: string | null;
}

export interface ISetting {
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
