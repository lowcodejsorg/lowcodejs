import { Service } from 'fastify-decorators';

import { transformRowContext } from '@application/core/builders/row-context-builder';
import type { IField, IRow } from '@application/core/entity.core';

import { RowContextContractService } from './row-context-contract.service';

@Service()
export default class RowContextService extends RowContextContractService {
  transform(row: IRow, fields: IField[], userId?: string): IRow {
    return transformRowContext(
      row as Record<string, any>,
      fields,
      userId,
    ) as IRow;
  }
}
