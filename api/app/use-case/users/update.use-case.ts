import { Either, left, right } from '@core/either.core';
import { User as Entity } from '@core/entity.core';
import ApplicationException from '@exceptions/application.exception';
import { User as Model } from '@model/user.model';
import { GetUserByIdSchema, UpdateUserSchema } from '@validators/users';
import { hash } from 'bcryptjs';
import { Service } from 'fastify-decorators';
import z from 'zod';

type Payload = z.infer<typeof UpdateUserSchema> &
  z.infer<typeof GetUserByIdSchema>;
type Response = Either<ApplicationException, Entity>;

@Service()
export default class UpdateUserUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      if (!payload?.group)
        return left(
          ApplicationException.BadRequest(
            'Group not informed',
            'GROUP_NOT_INFORMED',
          ),
        );

      const user = await Model.findOne({ _id: payload._id });

      if (!user)
        return left(
          ApplicationException.NotFound('User not found', 'USER_NOT_FOUND'),
        );

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
        ApplicationException.InternalServerError(
          'Internal server error',
          'UPDATE_USER_ERROR',
        ),
      );
    }
  }
}
