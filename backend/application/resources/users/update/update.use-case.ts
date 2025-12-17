import { hash } from 'bcryptjs';
import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { User as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { User as Model } from '@application/model/user.model';

import type {
  UserUpdateBodyValidator,
  UserUpdateParamValidator,
} from './update.validator';

type Response = Either<HTTPException, Entity>;
type Payload = z.infer<typeof UserUpdateBodyValidator> &
  z.infer<typeof UserUpdateParamValidator>;

@Service()
export default class UserUpdateUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      if (!payload?.group)
        return left(
          HTTPException.BadRequest('Group not informed', 'GROUP_NOT_INFORMED'),
        );

      const user = await Model.findOne({ _id: payload._id });

      if (!user)
        return left(HTTPException.NotFound('User not found', 'USER_NOT_FOUND'));

      user.set({
        ...payload,
        group: payload.group,
        ...(payload.password && {
          password: await hash(payload.password, 6),
        }),
      });

      await user.save();

      const populated = await user?.populate([
        {
          path: 'group',
        },
      ]);

      return right({
        ...populated?.toJSON({
          flattenObjectIds: true,
        }),
        _id: populated?._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'UPDATE_USER_ERROR',
        ),
      );
    }
  }
}
