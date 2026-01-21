/* eslint-disable @typescript-eslint/naming-convention */
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

import type {
  E_FIELD_FORMAT,
  E_FIELD_TYPE,
  E_JWT_TYPE,
  E_MENU_ITEM_TYPE,
  E_REACTION_TYPE,
  E_ROLE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_TYPE,
  E_TABLE_VISIBILITY,
  E_TOKEN_STATUS,
  E_USER_STATUS,
} from './constant';

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type Merge<T, U> = {
  [K in keyof (T & U)]: (T & U)[K];
};

export type ValueOf<T> = T[keyof T];

export type Meta = {
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
  firstPage: number;
};

export type Paginated<Entity> = {
  data: Array<Entity>;
  meta: Meta;
};

export type Base = {
  _id: string;
  createdAt: string;
  updatedAt: string | null;
  trashedAt: string | null;
  trashed: boolean;
};

export type IStorage = Merge<
  Base,
  {
    url: string;
    filename: string;
    type: string;
    size: number;
    originalName: string;
  }
>;

export type IPermission = Merge<
  Base,
  {
    name: string;
    slug: string;
    description: string | null;
  }
>;

export type IGroup = Merge<
  Base,
  {
    name: string;
    slug: string;
    description: string | null;
    permissions: Array<IPermission>;
  }
>;

export type IUser = Merge<
  Base,
  {
    name: string;
    email: string;
    password: string;
    status: ValueOf<typeof E_USER_STATUS>;
    group: IGroup;
  }
>;

export type IValidationToken = Merge<
  Base,
  {
    user: IUser;
    code: string;
    status: ValueOf<typeof E_TOKEN_STATUS>;
  }
>;

export type IJWTPayload = {
  sub: string;
  email: string;
  role: ValueOf<typeof E_ROLE>;
  type: ValueOf<typeof E_JWT_TYPE>;
};

export type IMenu = Merge<
  Base,
  {
    name: string;
    slug: string;
    type: ValueOf<typeof E_MENU_ITEM_TYPE>;
    table: ITable | null;
    parent: IMenu | null;
    url: string | null;
    html: string | null;
  }
>;

export type ICategory = {
  id: string;
  label: string;
  children: Array<ICategory>;
};

export type IDropdown = {
  id: string;
  label: string;
  color: string | null;
};

export type IFieldConfigurationRelationship = {
  table: Pick<ITable, '_id' | 'slug'>;
  field: Pick<IField, '_id' | 'slug'>;
  order: 'asc' | 'desc';
};

export type IFieldConfigurationGroup = Pick<ITable, '_id' | 'slug'>;

export type IField = Merge<
  Base,
  {
    name: string;
    slug: string;
    type: ValueOf<typeof E_FIELD_TYPE>;
    configuration: {
      required: boolean;
      multiple: boolean;
      format: ValueOf<typeof E_FIELD_FORMAT> | null;
      listing: boolean;
      filtering: boolean;
      defaultValue: string | null;
      relationship: IFieldConfigurationRelationship | null;
      dropdown: Array<IDropdown>;
      category: Array<ICategory>;
      group: IFieldConfigurationGroup | null;
    };
  }
>;

export type ISchema = {
  type: 'Number' | 'String' | 'Date' | 'Boolean' | 'ObjectId';
  required?: boolean;
  ref?: string;
  default?: string | number | boolean | null;
};

export type ITableSchema = Record<string, ISchema | Array<ISchema>>;

export type ITableConfiguration = {
  style: ValueOf<typeof E_TABLE_STYLE>;
  visibility: ValueOf<typeof E_TABLE_VISIBILITY>;
  collaboration: ValueOf<typeof E_TABLE_COLLABORATION>;
  administrators: Array<IUser>;
  owner: IUser;
  fields: {
    orderList: Array<string>;
    orderForm: Array<string>;
  };
};

export type ITableMethod = {
  onLoad: { code: string | null };
  beforeSave: { code: string | null };
  afterSave: { code: string | null };
};

export type ITable = Merge<
  Base,
  {
    _schema: ITableSchema;
    name: string;
    description: string | null;
    logo: IStorage | null;
    slug: string;
    fields: Array<IField>;
    type: ValueOf<typeof E_TABLE_TYPE>;
    configuration: ITableConfiguration;
    methods: ITableMethod;
  }
>;

export type ISetting = {
  LOCALE: string;
  LOGO_SMALL_URL: string | null;
  LOGO_LARGE_URL: string | null;
  FILE_UPLOAD_MAX_SIZE: number;
  FILE_UPLOAD_MAX_FILES_PER_UPLOAD: number;
  FILE_UPLOAD_ACCEPTED: Array<string>;
  PAGINATION_PER_PAGE: number;
  MODEL_CLONE_TABLES: Array<string>;
  DATABASE_URL: string;
  EMAIL_PROVIDER_HOST: string;
  EMAIL_PROVIDER_PORT: number;
  EMAIL_PROVIDER_USER: string;
  EMAIL_PROVIDER_PASSWORD: string;
};

export type IRow = Merge<Base, Record<string, any>> & {
  creator: IUser;
};

export type IAttachment = {
  filename: string;
  content: Buffer | string;
};

export type IEmailOptions = {
  from?: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<IAttachment>;
};

export type ISentMessageInfo = {
  accepted: Array<string>;
  rejected: Array<string>;
  envelope: {
    from: string;
    to: Array<string>;
  };
};

export type ISearch = Merge<
  Record<string, unknown>,
  {
    page: number;
    perPage: number;
    search?: string;
    trashed?: 'true' | 'false';
    sub?: string;
  }
>;

export type IReaction = Merge<
  Base,
  {
    user: IUser;
    type: ValueOf<typeof E_REACTION_TYPE>;
  }
>;

export type IEvaluation = Merge<
  Base,
  {
    user: IUser;
    value: number;
  }
>;

export type IHTTPException = {
  code: number;
  cause: string;
  message: string;
};

export type IHTTPExeptionError<T> = Merge<IHTTPException, { errors: T }>;

export interface ICloneTableResponse {
  tableId: string;
  slug: string;
  fieldIdMap: Record<string, string>;
}
