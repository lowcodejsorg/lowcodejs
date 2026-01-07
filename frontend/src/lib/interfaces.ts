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
  E_MENU_ITEM_TYPE,
} from './constant';

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export interface Meta {
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
  firstPage: number;
}
export interface Paginated<Entity> {
  data: Array<Entity>;
  meta: Meta;
}

export interface Base {
  _id: string;
  createdAt: string;
  updatedAt: string | null;
  trashedAt: string | null;
  trashed: boolean;
}

export interface IStorage extends Base {
  url: string;
  filename: string;
  type: string;
  size: number;
  originalName: string;
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
  permissions: Array<IPermission>;
}

export interface IUser extends Base {
  name: string;
  email: string;
  password: string;
  status: 'active' | 'inactive';
  group: IGroup;
}

export interface IMenu extends Base {
  name: string;
  slug: string;
  type: (typeof E_MENU_ITEM_TYPE)[keyof typeof E_MENU_ITEM_TYPE];
  table: ITable | null;
  parent: IMenu | null;
  url: string | null;
  html: string | null;
}

export interface ICategory {
  id: string;
  label: string;
  children: Array<ICategory>;
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
    dropdown: Array<string> | null;
    category: Array<ICategory> | null;
    group: IFieldConfigurationGroup | null;
  };
}

export interface ISchema {
  type: 'Number' | 'String' | 'Date' | 'Boolean' | 'ObjectId';
  required?: boolean;
  ref?: string;
  default?: string | number | boolean | null;
}

export type ITableSchema = Record<string, ISchema | Array<ISchema>>;

export interface ITable extends Base {
  _schema: ITableSchema;
  name: string;
  description: string | null;
  logo: IStorage | null;
  slug: string;
  fields: Array<IField>;
  type: 'table' | 'field-group';
  configuration: {
    style: 'gallery' | 'list';
    visibility: 'public' | 'restricted' | 'open' | 'form';
    collaboration: 'open' | 'restricted';
    administrators: Array<IUser>;
    owner: IUser;
    fields: {
      orderList: Array<string>;
      orderForm: Array<string>;
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

export interface ISetting {
  LOCALE: string;
  LOGO_SMALL_URL: string | null;
  LOGO_LARGE_URL: string | null;
  FILE_UPLOAD_MAX_SIZE: number;
  FILE_UPLOAD_MAX_FILES_PER_UPLOAD: number;
  FILE_UPLOAD_ACCEPTED: Array<string>;
  PAGINATION_PER_PAGE: number;
  DATABASE_URL: string;
  EMAIL_PROVIDER_HOST: string;
  EMAIL_PROVIDER_PORT: number;
  EMAIL_PROVIDER_USER: string;
  EMAIL_PROVIDER_PASSWORD: string;
}

export interface IRow extends Base, Record<string, any> {
  creator: IUser;
}
