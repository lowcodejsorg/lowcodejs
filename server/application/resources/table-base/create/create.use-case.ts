import { Service } from 'fastify-decorators';
import slugify from 'slugify';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { buildSchema } from '@application/core/util.core';
import { Table as Model } from '@application/model/table.model';

import type { TableCreateBodyValidator } from './create.validator';

type Response = Either<
  HTTPException,
  import('@application/core/entity.core').Table
>;

type Payload = z.infer<typeof TableCreateBodyValidator>;

@Service()
export default class TableCreateUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      if (!payload.owner)
        return left(
          HTTPException.BadRequest('Owner required', 'OWNER_REQUIRED'),
        );

      const slug = slugify(payload.name, { lower: true, trim: true });

      const table = await Model.findOne({ slug });

      if (table)
        return left(
          HTTPException.Conflict(
            'Table already exists',
            'TABLE_ALREADY_EXISTS',
          ),
        );

      const _schema = buildSchema([]);

      const created = await Model.create({
        ...payload,
        _schema,
        slug,
        fields: [],
        type: 'table',
        configuration: {
          owner: payload.owner,
          administrators: [],
          collaboration: 'restricted',
          style: 'list',
          visibility: 'restricted',
          fields: {
            orderForm: [],
            orderList: [],
          },
        },
      });

      const populated = await created.populate([
        {
          path: 'configuration.administrators',
          select: 'name _id',
          model: 'User',
        },
        {
          path: 'logo',
          model: 'Storage',
        },
        {
          path: 'configuration.owner',
          select: 'name _id',
          model: 'User',
        },
        {
          path: 'fields',
          model: 'Field',
        },
      ]);

      return right({
        ...populated.toJSON(),
        _id: created._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'CREATE_TABLE_ERROR',
        ),
      );
    }
  }
}
