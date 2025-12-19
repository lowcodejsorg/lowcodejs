import { Service } from 'fastify-decorators';

import { left, right, type Either } from '@application/core/either.core';
import type { User as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { User as Model } from '@application/model/user.model';

type Response = Either<HTTPException, Entity>;

@Service()
export default class RefreshTokenUseCase {
  async execute(payload: { user: string }): Promise<Response> {
    try {
      const user = await Model.findOne({ _id: payload.user });

      if (!user)
        return left(HTTPException.NotFound('User not found', 'USER_NOT_FOUND'));

      return right({
        ...user.toJSON({
          flattenObjectIds: true,
        }),
        _id: user._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'REFRESH_TOKEN_ERROR',
        ),
      );
    }
  }
}
