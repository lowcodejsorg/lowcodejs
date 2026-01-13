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
export type Merge<T, U> = {
  [K in keyof (T & U)]: (T & U)[K];
};

export type ValueOf<T> = T[keyof T];

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

export const E_TABLE_TYPE = {
  TABLE: 'TABLE',
  FIELD_GROUP: 'FIELD_GROUP',
} as const;

export const E_TABLE_STYLE = {
  LIST: 'LIST',
  GALLERY: 'GALLERY',
  DOCUMENT: 'DOCUMENT',
  CARD: 'CARD',
  MOSAIC: 'MOSAIC',
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

export const E_JWT_TYPE = {
  ACCESS: 'ACCESS',
  REFRESH: 'REFRESH',
} as const;

export type IJWTPayload = {
  sub: string;
  email: string;
  role: ValueOf<typeof E_ROLE>;
  type: ValueOf<typeof E_JWT_TYPE>;
};

export type Base = {
  _id: string;
  createdAt: Date;
  updatedAt: Date | null;
  trashedAt: Date | null;
  trashed: boolean;
};

export type IValidationToken = Merge<
  Base,
  {
    user: IUser;
    code: string;
    status: ValueOf<typeof E_TOKEN_STATUS>;
  }
>;

export type IStorage = Merge<
  Base,
  {
    url: string;
    filename: string;
    type: string;
    originalName: string;
    size: number;
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
    permissions: IPermission[];
  }
>;

export const E_USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

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

// MANTER SEM PADRÃO UPPERCASE POIS MAPEIA AS CHAVE <- VALOR PARA MONGOOSE
export const E_SCHEMA_TYPE = {
  NUMBER: 'Number',
  STRING: 'String',
  DATE: 'Date',
  BOOLEAN: 'Boolean',
  OBJECT_ID: 'ObjectId',
} as const;

export type ISchema = {
  type: ValueOf<typeof E_SCHEMA_TYPE>;
  required?: boolean;
  ref?: string;
  default?: string | number | boolean | null;
};

export type ITableSchema = Record<string, ISchema | ISchema[]>;

export type ITableConfiguration = {
  style: ValueOf<typeof E_TABLE_STYLE>;
  visibility: ValueOf<typeof E_TABLE_VISIBILITY>;
  collaboration: ValueOf<typeof E_TABLE_COLLABORATION>;
  administrators: IUser[];
  owner: IUser;
  fields: {
    orderList: string[];
    orderForm: string[];
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
    fields: IField[];
    type: ValueOf<typeof E_TABLE_TYPE>;
    configuration: ITableConfiguration;
    methods: ITableMethod;
  }
>;

export type ICategory = {
  id: string;
  label: string;
  children: unknown[];
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
      dropdown: string[];
      category: ICategory[];
      group: IFieldConfigurationGroup | null;
    };
  }
>;

export type IRow = Merge<Base, Record<string, any>>;

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
  accepted: string[];
  rejected: string[];
  envelope: {
    from: string;
    to: string[];
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

export type IMeta = {
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
  firstPage: number;
};

export type Paginated<Entity> = {
  data: Entity[];
  meta: IMeta;
};

export const E_REACTION_TYPE = {
  LIKE: 'LIKE',
  UNLIKE: 'UNLIKE',
} as const;

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

export type IMenu = Merge<
  Base,
  {
    name: string;
    slug: string;
    type: ValueOf<typeof E_MENU_ITEM_TYPE>;
    table: string | null;
    parent: string | null;
    url: string | null;
    html: string | null;
  }
>;

export type ISetting = {
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
};

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
