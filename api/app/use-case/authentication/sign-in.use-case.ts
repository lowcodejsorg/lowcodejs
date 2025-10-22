import bcrypt from 'bcryptjs';
import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@core/either.core';
import { left, right } from '@core/either.core';
import type { User as Entity } from '@core/entity.core';
import ApplicationException from '@exceptions/application.exception';
import { User as Model } from '@model/user.model';
import type { AuthenticationSignInSchema } from '@validators/authentication.validator';

type Response = Either<ApplicationException, Entity>;

@Service()
export default class SignInUseCase {
  async execute(
    payload: z.infer<typeof AuthenticationSignInSchema>,
  ): Promise<Response> {
    try {
      const user = await Model.findOne({ email: payload.email });

      if (!user) return left(ApplicationException.Unauthorized());

      if (user.status === 'inactive')
        return left(ApplicationException.Unauthorized());

      const passwordDoesMatch = await bcrypt.compare(
        payload.password,
        user.password,
      );

      if (!passwordDoesMatch)
        return left(ApplicationException.Unauthorized('Credenciais invalidas'));

      return right({
        ...user.toJSON({
          flattenObjectIds: true,
        }),
        _id: user._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        ApplicationException.InternalServerError(
          'Internal server error',
          'SIGN_IN_ERROR',
        ),
      );
    }
  }
}
