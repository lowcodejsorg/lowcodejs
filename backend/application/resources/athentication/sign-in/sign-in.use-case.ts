import bcrypt from 'bcryptjs';
import { Service } from 'fastify-decorators';
import type z from 'zod';

import { left, right, type Either } from '@application/core/either.core';
import type { IUser as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { User as Model } from '@application/model/user.model';

import type { SignInBodyValidator } from './sign-in.validator';

type Response = Either<HTTPException, Entity>;
type Payload = z.infer<typeof SignInBodyValidator>;

@Service()
export default class SignInUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const user = await Model.findOne({ email: payload.email }).populate([
        {
          path: 'group',
          populate: {
            path: 'permissions',
          },
        },
      ]);

      if (!user) return left(HTTPException.Unauthorized());

      if (user.status === 'inactive') return left(HTTPException.Unauthorized());

      const passwordDoesMatch = await bcrypt.compare(
        payload.password,
        user.password,
      );

      if (!passwordDoesMatch)
        return left(HTTPException.Unauthorized('Credenciais invalidas'));

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
          'SIGN_IN_ERROR',
        ),
      );
    }
  }
}
