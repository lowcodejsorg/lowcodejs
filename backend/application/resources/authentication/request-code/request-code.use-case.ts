/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import { left, right, type Either } from '@application/core/either.core';
import { E_TOKEN_STATUS } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';
import { ValidationTokenContractRepository } from '@application/repositories/validation-token/validation-token-contract.repository';

import type { RequestCodePayload } from './request-code.validator';

type Response = Either<HTTPException, null>;
type Payload = RequestCodePayload;

@Service()
export default class RequestCodeUseCase {
  constructor(
    private readonly userRepository: UserContractRepository,
    private readonly validationTokenRepository: ValidationTokenContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const user = await this.userRepository.findBy({
        email: payload.email,
        exact: true,
      });

      if (!user)
        return left(
          HTTPException.NotFound('Email not found', 'EMAIL_NOT_FOUND'),
        );

      const code = Math.floor(100000 + Math.random() * 900000).toString();

      await this.validationTokenRepository.create({
        code,
        status: E_TOKEN_STATUS.REQUESTED,
        user: user._id,
      });

      // enviar e-mail

      return right(null);
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'REQUEST_CODE_ERROR',
        ),
      );
    }
  }
}
