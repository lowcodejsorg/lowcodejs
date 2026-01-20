/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import { left, right, type Either } from '@application/core/either.core';
import type { IUser as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';

import type { RefreshTokenPayload } from './refresh-token.validator';

type Response = Either<HTTPException, Entity>;
type Payload = RefreshTokenPayload;

@Service()
export default class RefreshTokenUseCase {
  constructor(private readonly userRepository: UserContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const user = await this.userRepository.findBy({
        _id: payload._id,
        exact: true,
      });

      if (!user)
        return left(HTTPException.NotFound('User not found', 'USER_NOT_FOUND'));

      return right(user);
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'REFRESH_TOKEN_ERROR',
        ),
      );
    }
  }
}
