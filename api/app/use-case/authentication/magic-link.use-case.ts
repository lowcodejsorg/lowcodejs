import { Either, left, right } from '@core/either.core';
import { User as Entity, TOKEN_STATUS } from '@core/entity.core';
import ApplicationException from '@exceptions/application.exception';
import { User } from '@model/user.model';
import { ValidationToken } from '@model/validation-token.model';
import { AuthenticationMagicLinkSchema } from '@validators/authentication.validator';
import { differenceInMinutes } from 'date-fns';
import { Service } from 'fastify-decorators';
import z from 'zod';

type Response = Either<ApplicationException, Entity>;

@Service()
export default class MagicLinkUseCase {
  async execute(
    payload: z.infer<typeof AuthenticationMagicLinkSchema>,
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

      if (token.status === TOKEN_STATUS.VALIDATED)
        return left(
          ApplicationException.Conflict(
            'Validation token code already used',
            'VALIDATION_TOKEN_ALREADY_USED',
          ),
        );

      if (token.status === TOKEN_STATUS.EXPIRED)
        return left(
          ApplicationException.Gone(
            'Validation token code expired',
            'VALIDATION_TOKEN_EXPIRED',
          ),
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
          ...token.toJSON({
            flattenObjectIds: true,
          }),
          status: TOKEN_STATUS.VALIDATED,
        })
        .save();

      const user = await User.findOne({ _id: token.user?.toString() });

      if (!user)
        return left(
          ApplicationException.NotFound('User not found', 'USER_NOT_FOUND'),
        );

      if (user.status === 'inactive') {
        await user
          .set({
            ...user.toJSON({
              flattenObjectIds: true,
            }),
            status: 'active',
          })
          .save();
      }

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
          'MAGIC_LINK_ERROR',
        ),
      );
    }
  }
}
