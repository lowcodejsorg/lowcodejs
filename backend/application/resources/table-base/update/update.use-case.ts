import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { buildTable } from '@application/core/util.core';
import { Table } from '@application/model/table.model';
import { User } from '@application/model/user.model';

import type {
  TableUpdateBodyValidator,
  TableUpdateParamValidator,
} from './update.validator';

type Response = Either<
  HTTPException,
  import('@application/core/entity.core').Table
>;
type Payload = z.infer<typeof TableUpdateBodyValidator> &
  z.infer<typeof TableUpdateParamValidator>;

@Service()
export default class TableUpdateUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await Table.findOne({
        slug: payload.slug,
      });

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );

      // Validar que apenas usuários ativos podem ser administradores
      if (
        payload.configuration?.administrators &&
        payload.configuration.administrators.length > 0
      ) {
        const adminIds = payload.configuration.administrators;
        const activeAdmins = await User.find({
          _id: { $in: adminIds },
          status: 'active',
          trashed: false,
        }).lean();

        if (activeAdmins.length !== adminIds.length) {
          return left(
            HTTPException.BadRequest(
              'All administrators must be active users',
              'INACTIVE_ADMINISTRATORS',
            ),
          );
        }
      }

      await table
        .set({
          ...table.toJSON(),
          ...payload,
          configuration: {
            ...table?.toJSON()?.configuration,
            ...payload.configuration,
            administrators: payload.configuration?.administrators ?? [],
          },
        })
        .save();

      const populated = await table?.populate([
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

      await buildTable({
        ...populated.toJSON(),
        _id: populated._id.toString(),
      });

      return right({
        ...populated?.toJSON(),
        _id: populated._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'UPDATE_TABLE_ERROR',
        ),
      );
    }
  }
}
