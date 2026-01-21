import type {
  E_FIELD_FORMAT,
  E_FIELD_TYPE,
  E_MENU_ITEM_TYPE,
  E_REACTION_TYPE,
  E_ROLE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_TYPE,
  E_TABLE_VISIBILITY,
  E_USER_STATUS,
} from './constant';
import type { Merge, ValueOf } from './interfaces';

// ============== AUTHENTICATION ==============
export type SignInPayload = {
  email: string;
  password: string;
};

export type SignUpPayload = {
  name: string;
  email: string;
  password: string;
};

export type RequestCodePayload = {
  email: string;
};

export type ValidateCodePayload = {
  code: string;
};

export type ResetPasswordPayload = {
  password: string;
};

// ============== USER ==============
export type UserCreatePayload = {
  name: string;
  email: string;
  password: string;
  group: string;
};

export type UserUpdatePayload = {
  _id: string;
  name?: string;
  email?: string;
  password?: string;
  group?: string;
  status?: ValueOf<typeof E_USER_STATUS>;
};

// ============== USER GROUP ==============
export type UserGroupCreatePayload = {
  name: string;
  description?: string | null;
  permissions: Array<string>;
};

export type UserGroupUpdatePayload = {
  _id: string;
  name?: string;
  description?: string | null;
  permissions?: Array<string>;
};

// ============== MENU ==============
export type MenuCreatePayload = {
  name: string;
  type: ValueOf<typeof E_MENU_ITEM_TYPE>;
  table?: string | null;
  parent?: string | null;
  html?: string | null;
  url?: string | null;
};

export type MenuUpdatePayload = {
  _id: string;
  name?: string;
  type?: ValueOf<typeof E_MENU_ITEM_TYPE>;
  table?: string | null;
  parent?: string | null;
  html?: string | null;
  url?: string | null;
};

// ============== TABLE ==============
export type TableCreatePayload = {
  name: string;
  owner?: string;
  logo?: string | null;
  configuration?: {
    style?: ValueOf<typeof E_TABLE_STYLE>;
    visibility?: ValueOf<typeof E_TABLE_VISIBILITY>;
  };
};

export type TableConfigurationPayload = {
  style?: ValueOf<typeof E_TABLE_STYLE>;
  visibility?: ValueOf<typeof E_TABLE_VISIBILITY>;
  collaboration?: ValueOf<typeof E_TABLE_COLLABORATION>;
  administrators?: Array<string>;
  owner?: string;
  fields?: {
    orderList: Array<string>;
    orderForm: Array<string>;
  };
};

export type TableMethodPayload = {
  onLoad?: { code: string | null };
  beforeSave?: { code: string | null };
  afterSave?: { code: string | null };
};

export type TableUpdatePayload = {
  slug: string;
  name?: string;
  description?: string | null;
  logo?: string | null;
  configuration?: TableConfigurationPayload;
  methods?: TableMethodPayload;
  fields?: Array<string>;
};

// ============== FIELD ==============
export type FieldConfigurationPayload = {
  required?: boolean;
  multiple?: boolean;
  format?: ValueOf<typeof E_FIELD_FORMAT> | null;
  listing?: boolean;
  filtering?: boolean;
  defaultValue?: string | null;
  relationship?: {
    table: { _id: string; slug: string };
    field: { _id: string; slug: string };
    order: 'asc' | 'desc';
  } | null;
  dropdown?: Array<string>;
  category?: Array<{ id: string; label: string; children: Array<unknown> }>;
  group?: { _id: string; slug: string } | null;
};

export type FieldCreatePayload = {
  slug: string;
  name: string;
  type: ValueOf<typeof E_FIELD_TYPE>;
  configuration: FieldConfigurationPayload;
};

export type FieldUpdatePayload = {
  slug: string;
  _id: string;
  name: string;
  type: ValueOf<typeof E_FIELD_TYPE>;
  configuration: FieldConfigurationPayload;
  trashed?: boolean;
  trashedAt?: string | null;
};

// ============== ROW ==============
export type RowCreatePayload = {
  slug: string;
  data: Record<string, unknown>;
};

export type RowUpdatePayload = {
  slug: string;
  rowId: string;
  data: Record<string, unknown>;
};

// ============== PROFILE ==============
export type ProfileUpdatePayload = {
  name: string;
  email: string;
  allowPasswordChange?: boolean;
  currentPassword?: string;
  newPassword?: string;
};

// ============== SETTING ==============
export type SettingUpdatePayload = Partial<{
  LOCALE: string;
  FILE_UPLOAD_MAX_SIZE: number;
  FILE_UPLOAD_ACCEPTED: Array<string>;
  FILE_UPLOAD_MAX_FILES_PER_UPLOAD: number;
  PAGINATION_PER_PAGE: number;
  LOGO_SMALL_URL: string;
  LOGO_LARGE_URL: string;
  MODEL_CLONE_TABLES: string;
  EMAIL_PROVIDER_HOST: string;
  EMAIL_PROVIDER_PORT: number;
  EMAIL_PROVIDER_USER: string;
  EMAIL_PROVIDER_PASSWORD: string;
}>;

// ============== CLONE TABLE ==============
export type CloneTablePayload = {
  baseTableId: string;
  name: string;
};

// ============== REACTION ==============
export type ReactionCreatePayload = {
  type: ValueOf<typeof E_REACTION_TYPE>;
};

// ============== EVALUATION ==============
export type EvaluationCreatePayload = {
  value: number;
};

// ============== QUERY PAYLOADS ==============
export type BaseQueryPayload = {
  page?: number;
  perPage?: number;
  search?: string;
  authenticated?: string;
};

export type UserQueryPayload = Merge<
  BaseQueryPayload,
  {
    user?: { _id: string; role: ValueOf<typeof E_ROLE> };
    _ids?: Array<string>;
    status?: ValueOf<typeof E_USER_STATUS>;
    trashed?: boolean;
  }
>;

export type UserGroupQueryPayload = BaseQueryPayload;

export type MenuQueryPayload = Merge<
  BaseQueryPayload,
  {
    trashed?: boolean;
    parent?: string | null;
  }
>;

export type TableQueryPayload = Merge<
  BaseQueryPayload,
  {
    name?: string;
    type?: ValueOf<typeof E_TABLE_TYPE>;
    owner?: string;
    trashed?: boolean;
    _ids?: Array<string>;
  }
>;

export type FieldQueryPayload = Merge<
  BaseQueryPayload,
  {
    type?: ValueOf<typeof E_FIELD_TYPE>;
    _ids?: Array<string>;
  }
>;

export type StorageQueryPayload = Merge<
  BaseQueryPayload,
  {
    type?: string;
  }
>;

// ============== FIND BY PAYLOADS ==============
export type UserFindByPayload = {
  _id?: string;
  email?: string;
  exact: boolean;
};

export type MenuFindByPayload = {
  _id?: string;
  slug?: string;
  parent?: string;
  trashed?: boolean;
  exact: boolean;
};

export type TableFindByPayload = {
  _id?: string;
  slug?: string;
  exact: boolean;
};

export type FieldFindByPayload = {
  _id?: string;
  slug?: string;
  exact: boolean;
};

// ============== ROW ACTION PAYLOADS ==============
export type RowActionPayload = {
  slug: string;
  rowId: string;
};

export type RowActionBasePayload = {
  tableSlug: string;
  rowId: string;
};

export type RowReactionPayload = Merge<
  RowActionBasePayload,
  {
    field: string;
    type: ValueOf<typeof E_REACTION_TYPE>;
  }
>;

export type RowEvaluationPayload = Merge<
  RowActionBasePayload,
  {
    field: string;
    value: number;
  }
>;
