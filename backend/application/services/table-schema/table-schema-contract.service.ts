/* eslint-disable no-unused-vars */
import type {
  IField,
  IGroupConfiguration,
  ITable,
  ITableSchema,
} from '@application/core/entity.core';

export abstract class TableSchemaContractService {
  abstract computeSchema(
    fields: IField[],
    groups?: IGroupConfiguration[],
  ): ITableSchema;

  abstract syncModel(table: ITable): Promise<void>;
}
