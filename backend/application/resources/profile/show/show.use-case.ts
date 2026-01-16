/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IUser as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';

type Response = Either<HTTPException, Entity>;
type Payload = { _id: string };

@Service()
export default class ProfileShowUseCase {
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
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'GET_USER_PROFILE_ERROR',
        ),
      );
    }
  }
}
