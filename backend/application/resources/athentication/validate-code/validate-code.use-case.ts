import { differenceInMinutes } from 'date-fns';
import { Service } from 'fastify-decorators';
import type z from 'zod';

import { left, right, type Either } from '@application/core/either.core';
import { E_TOKEN_STATUS } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { ValidationToken } from '@application/model/validation-token.model';

import type { ValidateCodeBodyValidator } from './validate-code.validator';

type Response = Either<HTTPException, { user: string }>;
type Payload = z.infer<typeof ValidateCodeBodyValidator>;

@Service()
export default class ValidateCodeUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const token = await ValidationToken.findOne({
        code: payload.code,
      });

      if (!token)
        return left(
          HTTPException.NotFound(
            'Validation token not found',
            'VALIDATION_TOKEN_NOT_FOUND',
          ),
        );

      if (token.status === E_TOKEN_STATUS.EXPIRED)
        return left(HTTPException.Gone('Code expired', 'CODE_EXPIRED'));

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
            status: E_TOKEN_STATUS.EXPIRED,
          })
          .save();
        return left(
          HTTPException.Gone(
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
          status: E_TOKEN_STATUS.VALIDATED,
        })
        .save();

      return right({
        user: token.user,
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'VALIDATE_CODE_ERROR',
        ),
      );
    }
  }
}
