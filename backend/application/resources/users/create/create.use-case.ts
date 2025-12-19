import bcrypt from 'bcryptjs';
import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { User as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { User as Model } from '@application/model/user.model';

import type { UserCreateBodyValidator } from './create.validator';

type Response = Either<HTTPException, Entity>;
type Payload = z.infer<typeof UserCreateBodyValidator>;

@Service()
export default class UserCreateUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      if (!payload?.group)
        return left(
          HTTPException.BadRequest('Group not informed', 'GROUP_NOT_INFORMED'),
        );

      const user = await Model.findOne({ email: payload.email });

      if (user)
        return left(
          HTTPException.Conflict('User already exists', 'USER_ALREADY_EXISTS'),
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
        HTTPException.InternalServerError(
          'Internal server error',
          'CREATE_USER_ERROR',
        ),
      );
    }
  }
}
