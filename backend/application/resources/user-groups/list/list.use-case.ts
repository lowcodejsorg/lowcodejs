import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { UserGroup as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserGroup as Model } from '@application/model/user-group.model';

type Response = Either<HTTPException, Entity[]>;

@Service()
export default class UserGroupListUseCase {
  async execute(): Promise<Response> {
    try {
      const groups = await Model.find();
      return right(
        groups.map((group) => ({
          ...group.toJSON({
            flattenObjectIds: true,
          }),
          _id: group._id.toString(),
        })),
      );
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'LIST_USER_GROUP_ERROR',
        ),
      );
    }
  }
}
