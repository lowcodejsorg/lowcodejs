import { Either, left, right } from '@core/either.core';
import ApplicationException from '@exceptions/application.exception';
import { User as Model } from '@model/user.model';
import { AuthenticationRecoveryUpdatePasswordSchema } from '@validators/authentication.validator';
import { GetUserByIdSchema } from '@validators/users';
import { hash } from 'bcryptjs';
import { Service } from 'fastify-decorators';
import z from 'zod';

type Response = Either<ApplicationException, null>;

@Service()
export default class RecoveryUpdatePasswordUseCase {
  async execute(
    payload: z.infer<typeof AuthenticationRecoveryUpdatePasswordSchema> &
      z.infer<typeof GetUserByIdSchema>,
  ): Promise<Response> {
    try {
      const user = await Model.findOne({ _id: payload._id });

      if (!user)
        return left(
          ApplicationException.NotFound('User not found', 'USER_NOT_FOUND'),
        );

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
        ApplicationException.InternalServerError(
          'Internal server error',
          'UPDATE_PASSWORD_ERROR',
        ),
      );
    }
  }
}
