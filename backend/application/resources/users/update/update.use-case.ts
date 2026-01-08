/* eslint-disable no-unused-vars */
import { hash } from 'bcryptjs';
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IUser as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';

import type { UserUpdatePayload } from './update.validator';

type Response = Either<HTTPException, Entity>;
type Payload = UserUpdatePayload;

@Service()
export default class UserUpdateUseCase {
  constructor(private readonly userRepository: UserContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const user = await this.userRepository.findBy({
        _id: payload._id,
        exact: true,
      });

      if (!user)
        return left(HTTPException.NotFound('User not found', 'USER_NOT_FOUND'));

      const updated = await this.userRepository.update({
        ...payload,
        ...(payload.password && {
          password: await hash(payload.password, 12),
        }),
      });

      return right(updated);
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'UPDATE_USER_ERROR',
        ),
      );
    }
  }
}
