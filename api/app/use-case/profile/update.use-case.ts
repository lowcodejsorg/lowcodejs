import { isPasswordMatch } from '@config/app.config';
import { Either, left, right } from '@core/either.core';
import { User as Entity } from '@core/entity.core';
import ApplicationException from '@exceptions/application.exception';
import { User as Model } from '@model/user.model';
import { GetUserByIdSchema, UpdateUserProfileSchema } from '@validators/users';
import { hash } from 'bcryptjs';
import { Service } from 'fastify-decorators';
import z from 'zod';

type Response = Either<ApplicationException, Entity>;

@Service()
export default class AtualizarPerfilUseCase {
  async execute(
    payload: z.infer<typeof UpdateUserProfileSchema> &
      z.infer<typeof GetUserByIdSchema>,
  ): Promise<Response> {
    try {
      if (!payload?.group)
        return left(
          ApplicationException.BadRequest(
            'Group not informed',
            'GROUP_NOT_INFORMED',
          ),
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
        return left(
          ApplicationException.NotFound('User not found', 'USER_NOT_FOUND'),
        );

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

      const isMatch = await isPasswordMatch({
        hashed: user.toJSON({
          flattenObjectIds: true,
        }).password,
        plain: payload.newPassword as string,
      });

      if (!isMatch)
        return left(
          ApplicationException.Unauthorized(
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
        ApplicationException.InternalServerError(
          'Internal server error',
          'UPDATE_USER_PROFILE_ERROR',
        ),
      );
    }
  }
}
