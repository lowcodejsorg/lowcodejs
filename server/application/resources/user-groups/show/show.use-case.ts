import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { UserGroup as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserGroup as Model } from '@application/model/user-group.model';

import type { UserGroupShowParamValidator } from './show.validator';

type Response = Either<HTTPException, Entity>;
type Payload = z.infer<typeof UserGroupShowParamValidator>;
@Service()
export default class UserGroupShowUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const group = await Model.findOne({
        _id: payload._id,
      }).populate([
        {
          path: 'permissions',
        },
      ]);

      if (!group)
        return left(HTTPException.NotFound('Grupo de usuários não encontrado'));

      return right({
        ...group?.toJSON({
          flattenObjectIds: true,
        }),
        _id: group?._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'GET_USER_GROUP_BY_ID_ERROR',
        ),
      );
    }
  }
}
