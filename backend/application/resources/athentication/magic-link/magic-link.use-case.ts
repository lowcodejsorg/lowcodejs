import { differenceInMinutes } from 'date-fns';
import { Service } from 'fastify-decorators';
import type z from 'zod';

import { left, right, type Either } from '@application/core/either.core';
import {
  TOKEN_STATUS,
  type User as Entity,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { User } from '@application/model/user.model';
import { ValidationToken } from '@application/model/validation-token.model';

import type { MagicLinkBodyValidator } from './magic-link.validator';

type Response = Either<HTTPException, Entity>;
type Payload = z.infer<typeof MagicLinkBodyValidator>;

@Service()
export default class MagicLinkUseCase {
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

      if (token.status === TOKEN_STATUS.VALIDATED)
        return left(
          HTTPException.Conflict(
            'Validation token code already used',
            'VALIDATION_TOKEN_ALREADY_USED',
          ),
        );

      if (token.status === TOKEN_STATUS.EXPIRED)
        return left(
          HTTPException.Gone(
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
          HTTPException.Gone(
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
        return left(HTTPException.NotFound('User not found', 'USER_NOT_FOUND'));

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
        HTTPException.InternalServerError(
          'Internal server error',
          'MAGIC_LINK_ERROR',
        ),
      );
    }
  }
}
