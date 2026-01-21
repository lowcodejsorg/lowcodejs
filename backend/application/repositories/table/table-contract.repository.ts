/* eslint-disable no-unused-vars */
import type {
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_TYPE,
  E_TABLE_VISIBILITY,
  IField,
  ITable,
  ITableMethod,
  ITableSchema,
  Merge,
  ValueOf,
} from '@application/core/entity.core';

export type TableConfigurationPayload = {
  style?: ValueOf<typeof E_TABLE_STYLE>;
  visibility?: ValueOf<typeof E_TABLE_VISIBILITY>;
  collaboration?: ValueOf<typeof E_TABLE_COLLABORATION>;
  administrators?: string[];
  owner: string;
  fields?: {
    orderList: string[];
    orderForm: string[];
  };
};

export type TableCreatePayload = Merge<
  Pick<ITable, 'name' | 'slug'>,
  {
    _schema?: ITableSchema;
    description?: string | null;
    logo?: string | null;
    fields?: string[];
    type?: ValueOf<typeof E_TABLE_TYPE>;
    configuration: TableConfigurationPayload;
    methods?: ITableMethod;
  }
>;

export type TableUpdatePayload = Merge<
  Pick<ITable, '_id'>,
  Partial<TableCreatePayload> & {
    trashed?: boolean;
    trashedAt?: Date | null;
  }
>;

export type TableFindByPayload = Merge<
  Partial<Pick<ITable, '_id' | 'slug'>>,
  { exact: boolean }
>;

export type TableQueryPayload = {
  page?: number;
  perPage?: number;
  search?: string;
  type?: ValueOf<typeof E_TABLE_TYPE>;
  owner?: string;
  trashed?: boolean;
  _ids?: string[];
};

export type TableUpdateManyPayload = {
  _ids: string[];
  type?: ValueOf<typeof E_TABLE_TYPE>;
  data: Partial<TableConfigurationPayload>;
};

export abstract class TableContractRepository {
  abstract create(payload: TableCreatePayload): Promise<ITable>;
  abstract findBy(payload: TableFindByPayload): Promise<ITable | null>;
  abstract findMany(payload?: TableQueryPayload): Promise<ITable[]>;
  abstract update(payload: TableUpdatePayload): Promise<ITable>;
  abstract updateMany(payload: TableUpdateManyPayload): Promise<void>;
  abstract delete(_id: string): Promise<void>;
  abstract count(payload?: TableQueryPayload): Promise<number>;

  //
  abstract mapperSchemaField(field: IField): ITableSchema;
  abstract buildSchema(fields: IField[]): ITableSchema;
}
