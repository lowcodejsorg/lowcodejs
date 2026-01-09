/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import {
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_TYPE,
  E_TABLE_VISIBILITY,
  type ITable as Entity,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildSchema } from '@application/core/util.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { TableCreatePayload } from './create.validator';

type Response = Either<HTTPException, Entity>;
type Payload = TableCreatePayload;

@Service()
export default class TableCreateUseCase {
  constructor(private readonly tableRepository: TableContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      if (!payload.owner)
        return left(
          HTTPException.BadRequest('Owner required', 'OWNER_REQUIRED'),
        );

      const slug = slugify(payload.name, { lower: true, trim: true });

      const existingTable = await this.tableRepository.findBy({
        slug,
        exact: true,
      });

      if (existingTable)
        return left(
          HTTPException.Conflict(
            'Table already exists',
            'TABLE_ALREADY_EXISTS',
          ),
        );

      const _schema = buildSchema([]);

      const created = await this.tableRepository.create({
        ...payload,
        _schema,
        slug,
        fields: [],
        type: E_TABLE_TYPE.TABLE,
        configuration: {
          owner: payload.owner,
          administrators: [],
          collaboration: E_TABLE_COLLABORATION.RESTRICTED,
          style: E_TABLE_STYLE.LIST,
          visibility: E_TABLE_VISIBILITY.RESTRICTED,
          fields: {
            orderForm: [],
            orderList: [],
          },
        },
      });

      return right(created);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'CREATE_TABLE_ERROR',
        ),
      );
    }
  }
}
