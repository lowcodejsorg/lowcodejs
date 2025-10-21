import { Either, left, right } from '@core/either.core';
import { User as Entity } from '@core/entity.core';
import ApplicationException from '@exceptions/application.exception';
import { User as Model } from '@model/user.model';
import { CreateUserSchema } from '@validators/users';

import bcrypt from 'bcryptjs';
import { Service } from 'fastify-decorators';
import z from 'zod';

type Response = Either<ApplicationException, Entity>;

@Service()
export default class CreateUserUseCase {
  async execute(payload: z.infer<typeof CreateUserSchema>): Promise<Response> {
    try {
      if (!payload?.group)
        return left(
          ApplicationException.BadRequest(
            'Group not informed',
            'GROUP_NOT_INFORMED',
          ),
        );

      const user = await Model.findOne({ email: payload.email });

      if (user)
        return left(
          ApplicationException.Conflict(
            'User already exists',
            'USER_ALREADY_EXISTS',
          ),
        );

      const passwordHash = await bcrypt.hash(payload.password, 6);

      const created = await Model.create({
        ...payload,
        password: passwordHash,
        status: 'active',
      });

      const populated = await created.populate([
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
          'CREATE_USER_ERROR',
        ),
      );
    }
  }
}
