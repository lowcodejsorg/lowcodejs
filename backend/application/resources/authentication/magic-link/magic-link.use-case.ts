/* eslint-disable no-unused-vars */
import { differenceInMinutes } from 'date-fns';
import { Service } from 'fastify-decorators';

import { left, right, type Either } from '@application/core/either.core';
import {
  E_TOKEN_STATUS,
  E_USER_STATUS,
  type IUser as Entity,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';
import { ValidationTokenContractRepository } from '@application/repositories/validation-token/validation-token-contract.repository';

import type { MagicLinkPayload } from './magic-link.validator';

type Response = Either<HTTPException, Entity>;
type Payload = MagicLinkPayload;

@Service()
export default class MagicLinkUseCase {
  constructor(
    private readonly userRepository: UserContractRepository,
    private readonly validationTokenRepository: ValidationTokenContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const token = await this.validationTokenRepository.findBy({
        code: payload.code,
        exact: true,
      });

      if (!token)
        return left(
          HTTPException.NotFound(
            'Validation token not found',
            'VALIDATION_TOKEN_NOT_FOUND',
          ),
        );

      if (token.status === E_TOKEN_STATUS.VALIDATED)
        return left(
          HTTPException.Conflict(
            'Validation token code already used',
            'VALIDATION_TOKEN_ALREADY_USED',
          ),
        );

      if (token.status === E_TOKEN_STATUS.EXPIRED)
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
        await this.validationTokenRepository.update({
          _id: token._id,
          status: E_TOKEN_STATUS.EXPIRED,
        });

        return left(
          HTTPException.Gone(
            'Validation token code expired',
            'VALIDATION_TOKEN_EXPIRED',
          ),
        );
      }

      await this.validationTokenRepository.update({
        _id: token._id,
        status: E_TOKEN_STATUS.VALIDATED,
      });

      const user = await this.userRepository.findBy({
        _id: token.user?._id,
        exact: true,
      });

      if (!user)
        return left(HTTPException.NotFound('User not found', 'USER_NOT_FOUND'));

      if (user.status === E_USER_STATUS.INACTIVE) {
        await this.userRepository.update({
          _id: user._id,
          status: E_USER_STATUS.ACTIVE,
        });
      }

      return right(user);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'MAGIC_LINK_ERROR',
        ),
      );
    }
  }
}
