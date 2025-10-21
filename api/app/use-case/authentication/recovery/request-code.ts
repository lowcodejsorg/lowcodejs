import { Either, left, right } from '@core/either.core';
import { TOKEN_STATUS } from '@core/entity.core';
import ApplicationException from '@exceptions/application.exception';
import { User as Model } from '@model/user.model';
import { ValidationToken } from '@model/validation-token.model';
import { AuthenticationRecoveryRequestCodeSchema } from '@validators/authentication.validator';
import { Service } from 'fastify-decorators';
import z from 'zod';

type Response = Either<ApplicationException, null>;

@Service()
export default class RequestCodeUseCase {
  async execute(
    payload: z.infer<typeof AuthenticationRecoveryRequestCodeSchema>,
  ): Promise<Response> {
    try {
      const user = await Model.findOne({ email: payload.email });

      if (!user)
        return left(
          ApplicationException.NotFound(
            'Email not found',
            'EMAIL_NOT_FOUND',
          ),
        );

      const code = Math.floor(100000 + Math.random() * 900000).toString();

      await ValidationToken.create({
        code,
        status: TOKEN_STATUS.REQUESTED,
        user: user._id.toString(),
      });

      // enviar e-mail

      return right(null);
    } catch (error) {
      console.error(error);
      return left(
        ApplicationException.InternalServerError(
          'Internal server error',
          'REQUEST_CODE_ERROR',
        ),
      );
    }
  }
}
