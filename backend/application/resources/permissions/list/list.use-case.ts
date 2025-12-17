import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { Permission as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { Permission as Model } from '@application/model/permission.model';

type Resultado = Either<HTTPException, Entity[]>;

@Service()
export default class PermissionListUseCase {
  async execute(): Promise<Resultado> {
    try {
      const permissions = await Model.find();
      return right(
        permissions.map((permission) => ({
          ...permission.toJSON({
            flattenObjectIds: true,
          }),
          _id: permission._id.toString(),
        })),
      );
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'LIST_PERMISSION_ERROR',
        ),
      );
    }
  }
}
