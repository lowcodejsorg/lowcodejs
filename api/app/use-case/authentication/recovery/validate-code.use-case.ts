import { Either, left, right } from '@core/either.core';
import { TOKEN_STATUS } from '@core/entity.core';
import ApplicationException from '@exceptions/application.exception';
import { ValidationToken } from '@model/validation-token.model';
import { AuthenticationRecoveryValidateCodeSchema } from '@validators/authentication.validator';
import { differenceInMinutes } from 'date-fns';
import { Service } from 'fastify-decorators';
import z from 'zod';

type Response = Either<ApplicationException, { user: string }>;

@Service()
export default class ValidateCodeUseCase {
  async execute(
    payload: z.infer<typeof AuthenticationRecoveryValidateCodeSchema>,
  ): Promise<Response> {
    try {
      const token = await ValidationToken.findOne({
        code: payload.code,
      });

      if (!token)
        return left(
          ApplicationException.NotFound(
            'Validation token not found',
            'VALIDATION_TOKEN_NOT_FOUND',
          ),
        );

      if (token.status === TOKEN_STATUS.EXPIRED)
        return left(
          ApplicationException.Gone('Code expired', 'CODE_EXPIRED'),
        );

      const TIME_EXPIRATION_IN_MINUTES = 10;

      const diferenceTimeInMinutes = differenceInMinutes(
        new Date(),
        token.createdAt,
      );

      if (diferenceTimeInMinutes > TIME_EXPIRATION_IN_MINUTES) {
        await token
          .set({
            ...token?.toJSON({
              flattenObjectIds: true,
            }),
            status: TOKEN_STATUS.EXPIRED,
          })
          .save();
        return left(
          ApplicationException.Gone(
            'Validation token code expired',
            'VALIDATION_TOKEN_EXPIRED',
          ),
        );
      }

      await token
        .set({
          ...token?.toJSON({
            flattenObjectIds: true,
          }),
          status: TOKEN_STATUS.VALIDATED,
        })
        .save();

      return right({
        user: token.user,
      });
    } catch (error) {
      console.error(error);
      return left(
        ApplicationException.InternalServerError(
          'Internal server error',
          'VALIDATE_CODE_ERROR',
        ),
      );
    }
  }
}
