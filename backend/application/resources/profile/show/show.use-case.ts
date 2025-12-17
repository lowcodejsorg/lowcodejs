import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { User as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { User as Model } from '@application/model/user.model';

import type { ProfileShowParamValidator } from './show.validator';

type Response = Either<HTTPException, Entity>;
type Payload = z.infer<typeof ProfileShowParamValidator>;
@Service()
export default class ProfileShowUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const user = await Model.findOne({ _id: payload._id }).populate([
        {
          path: 'group',
          populate: {
            path: 'permissions',
          },
        },
      ]);

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
          'GET_USER_PROFILE_ERROR',
        ),
      );
    }
  }
}
