import { Service } from 'fastify-decorators';

import { buildSchema, buildTable } from '@application/core/builders';
import type {
  IField,
  IGroupConfiguration,
  ITable,
  ITableSchema,
} from '@application/core/entity.core';
import { getDataConnection } from '@config/database.config';

import { TableSchemaContractService } from './table-schema-contract.service';

@Service()
export default class TableSchemaMongooseService extends TableSchemaContractService {
  computeSchema(
    fields: IField[],
    groups?: IGroupConfiguration[],
  ): ITableSchema {
    return buildSchema(fields, groups);
  }

  async syncModel(table: ITable): Promise<void> {
    await buildTable(table, getDataConnection());
  }
}
