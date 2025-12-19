import { hash } from 'bcryptjs';
import { Service } from 'fastify-decorators';
import type z from 'zod';

import { left, right, type Either } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { User as Model } from '@application/model/user.model';

import type {
  UpdatePasswordBodyValidator,
  UpdatePasswordParamValidator,
} from './reset-password.validator';

type Response = Either<HTTPException, null>;
type Payload = z.infer<typeof UpdatePasswordBodyValidator> &
  z.infer<typeof UpdatePasswordParamValidator>;

@Service()
export default class UpdatePasswordRecoveryUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const user = await Model.findOne({ _id: payload._id });

      if (!user)
        return left(HTTPException.NotFound('User not found', 'USER_NOT_FOUND'));

      const hashedPassword = await hash(payload.password, 6);

      await user
        .set({
          ...user.toJSON({
            flattenObjectIds: true,
          }),
          password: hashedPassword,
        })
        .save();

      return right(null);
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'UPDATE_PASSWORD_ERROR',
        ),
      );
    }
  }
}
