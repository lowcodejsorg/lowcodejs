import { hash } from 'bcryptjs';
import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IUser as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { User as Model } from '@application/model/user.model';
import { isPasswordMatch } from '@config/util.config';

import type {
  ProfileUpdateBodyValidator,
  ProfileUpdateParamValidator,
} from './update.validator';

type Response = Either<HTTPException, Entity>;
type Payload = z.infer<typeof ProfileUpdateBodyValidator> &
  z.infer<typeof ProfileUpdateParamValidator>;

@Service()
export default class ProfileUpdateUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      console.log(JSON.stringify(payload, null, 2));
      if (!payload?.group)
        return left(
          HTTPException.BadRequest('Group not informed', 'GROUP_NOT_INFORMED'),
        );

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

      if (!payload.allowPasswordChange) {
        await user
          .set({
            ...user?.toJSON({
              flattenObjectIds: true,
            }),
            ...payload,
            group: payload.group,
          })
          .save();

        return right({
          ...user?.toJSON({
            flattenObjectIds: true,
          }),
          _id: user?._id.toString(),
        });
      }

      console.log({
        hashed: user.toJSON({
          flattenObjectIds: true,
        }).password,
        plain: payload.newPassword as string,
      });

      const isMatch = await isPasswordMatch({
        hashed: user.toJSON({
          flattenObjectIds: true,
        }).password,
        plain: payload.currentPassword as string,
      });

      if (!isMatch)
        return left(
          HTTPException.Unauthorized(
            'Invalid credentials',
            'INVALID_CREDENTIALS',
          ),
        );

      const password = await hash(payload.newPassword as string, 6);

      await user
        .set({
          ...user?.toJSON({
            flattenObjectIds: true,
          }),
          ...payload,
          group: payload.group,
          password,
        })
        .save();

      return right({
        ...user?.toJSON({
          flattenObjectIds: true,
        }),
        _id: user?._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'UPDATE_USER_PROFILE_ERROR',
        ),
      );
    }
  }
}
